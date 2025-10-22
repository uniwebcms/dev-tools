// asset.js - Asset management functions for Uniweb

import fs from "fs/promises";
import path from "path";
import { fileExists, ensureDirectory, resolveSite } from "../utils/file.js";

/**
 * Uploads an asset to a site's public folder.
 *
 * @param {string} site - Name of the site.
 * @param {string} source - Local path to the file.
 * @param {string} [target=""] - Target path in public folder (empty for root).
 * @returns {Object} Asset information
 */
export async function addAsset(site, source, target = "") {
  if (!source) {
    throw new Error("Source file path is required");
  }

  // Resolve final site name and path
  site = await resolveSite(site);

  // Check if source file exists
  if (!(await fileExists(source))) {
    throw new Error(`Source file not found at ${source}`);
  }

  // Build the public directory path
  const publicDir = path.join(site.path, "public");
  await ensureDirectory(publicDir);

  // Parse target path and create directories if needed
  let targetDir = publicDir;
  let targetFilename = path.basename(source);

  if (target) {
    // If target includes a filename (has extension), separate it
    const targetExt = path.extname(target);
    if (targetExt) {
      targetDir = path.join(publicDir, path.dirname(target));
      targetFilename = path.basename(target);
    } else {
      // Target is a directory path
      targetDir = path.join(publicDir, target);

      // Check if target ends with a directory separator
      if (!target.endsWith("/") && !target.endsWith(path.sep)) {
        // If not, it's a full filepath including the filename
        targetFilename = path.basename(target);
        targetDir = path.join(publicDir, path.dirname(target));
      }
    }
  }

  // Ensure target directory exists
  await ensureDirectory(targetDir);

  // Build full target path
  const targetPath = path.join(targetDir, targetFilename);

  // Check if target file already exists
  if (await fileExists(targetPath)) {
    throw new Error(`Target file already exists at ${targetPath}`);
  }

  // Copy file
  await fs.copyFile(source, targetPath);

  // Get file stats
  const stats = await fs.stat(targetPath);

  // Build public URL path (for reference)
  const publicPath = target ? path.join("/", target) : `/${targetFilename}`;

  return {
    site,
    filename: targetFilename,
    sourcePath: source,
    targetPath,
    publicPath,
    size: stats.size,
    uploaded: new Date().toISOString(),
  };
}

/**
 * Creates a folder in a site's public directory.
 *
 * @param {string} site - Name of the site.
 * @param {string} folder - Path for the new folder.
 * @returns {Object} Folder information
 */
export async function addAssetFolder(site, folder) {
  if (!folder) {
    throw new Error("Folder path is required");
  }

  site = await resolveSite(site);

  // Build the public directory path
  const publicDir = path.join(site.path, "public");
  await ensureDirectory(publicDir);

  // Build the folder path
  const folderPath = path.join(publicDir, folder);

  // Check if folder already exists
  if (await fileExists(folderPath)) {
    throw new Error(`Folder already exists at ${folderPath}`);
  }

  // Create folder
  await ensureDirectory(folderPath);

  return {
    site,
    folder,
    path: folderPath,
    created: new Date().toISOString(),
  };
}

/**
 * Lists assets in a site's public folder.
 * @private
 * @param {string} site - Name of the site.
 * @param {string} [folder=""] - Folder path in public folder (empty for root).
 * @returns {Object} List of assets with their information
 */
export async function listAssets(site, folder = "") {
  site = await resolveSite(site);

  // Build the public directory path
  const publicDir = path.join(site.path, "public");

  // Check if public directory exists
  if (!(await fileExists(publicDir))) {
    return {
      site,
      folder,
      count: 0,
      assets: [],
    };
  }

  // Build the target folder path
  const folderPath = folder ? path.join(publicDir, folder) : publicDir;

  // Check if folder exists
  if (!(await fileExists(folderPath))) {
    throw new Error(`Folder not found at ${folderPath}`);
  }

  // Read directory contents
  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  const assets = [];

  for (const entry of entries) {
    const entryPath = path.join(folderPath, entry.name);
    const stats = await fs.stat(entryPath);

    // Build public URL path
    const publicPath = folder
      ? path.join("/", folder, entry.name)
      : `/${entry.name}`;

    assets.push({
      name: entry.name,
      path: entryPath,
      publicPath,
      isDirectory: entry.isDirectory(),
      size: entry.isDirectory() ? null : stats.size,
      modified: stats.mtime.toISOString(),
    });
  }

  // Sort by directories first, then by name
  assets.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });

  return {
    site,
    folder,
    path: folderPath,
    count: assets.length,
    assets,
  };
}

/**
 * Removes an asset from a site.
 *
 * @param {string} site - Name of the site.
 * @param {string} assetPath - Path of the asset to remove.
 * @param {boolean} [force=false] - Force removal without confirmation.
 * @returns {Object} Result of the removal operation
 */
export async function removeAsset(site, assetPath, force = false) {
  if (!assetPath) {
    throw new Error("Asset path is required");
  }

  site = await resolveSite(site);

  // Build the public directory path
  const publicDir = path.join(site.path, "public");

  // Check if public directory exists
  if (!(await fileExists(publicDir))) {
    throw new Error(`Public directory not found for site '${site}'`);
  }

  // Build full asset path
  const fullAssetPath = path.join(publicDir, assetPath);

  // Check if asset exists
  if (!(await fileExists(fullAssetPath))) {
    throw new Error(`Asset not found at ${fullAssetPath}`);
  }

  // Get asset stats
  const stats = await fs.stat(fullAssetPath);
  const isDirectory = stats.isDirectory();

  // Check if force flag is required
  if (isDirectory) {
    // For directories, check if they're not empty
    const entries = await fs.readdir(fullAssetPath);
    if (entries.length > 0 && !force) {
      throw new Error(`Directory is not empty. Use --force to remove anyway`);
    }
  }

  // Remove asset
  if (isDirectory) {
    await fs.rm(fullAssetPath, { recursive: true, force: true });
  } else {
    await fs.unlink(fullAssetPath);
  }

  return {
    site,
    path: assetPath,
    fullPath: fullAssetPath,
    isDirectory,
    removed: true,
    timestamp: new Date().toISOString(),
  };
}
