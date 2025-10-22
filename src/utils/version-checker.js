import fs from "fs/promises";
import path from "path";
import os from "os";
import { execSync } from "child_process";

/**
 * Get the path to the version cache file
 * @param {string} packageName - Package name (e.g., '@uniwebcms/toolkit')
 * @returns {string} Path to the cache file
 */
export const getVersionCacheFilePath = (packageName) => {
  const cacheDir = path.join(
    os.homedir(),
    ".config",
    packageName.replace(/^@/, "").replace(/\//, "-")
  );
  return path.join(cacheDir, "version-cache.json");
};

/**
 * Read the cached version data
 * @param {string} packageName - Package name
 * @returns {Promise<object|null>} Cached version data or null if not found
 */
export const readVersionCache = async (packageName) => {
  try {
    const cachePath = getVersionCacheFilePath(packageName);
    const data = await fs.readFile(cachePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return null; // Cache doesn't exist or is invalid
  }
};

/**
 * Write version data to cache
 * @param {string} packageName - Package name
 * @param {object} data - Version data to cache
 * @returns {Promise<void>}
 */
export const writeVersionCache = async (packageName, data) => {
  try {
    const cachePath = getVersionCacheFilePath(packageName);
    const cacheDir = path.dirname(cachePath);

    // Ensure directory exists
    await fs.mkdir(cacheDir, { recursive: true });

    // Write cache file
    await fs.writeFile(
      cachePath,
      JSON.stringify({
        ...data,
        fetchedAt: new Date().toISOString(),
      })
    );
  } catch (error) {
    // Silently fail on cache write errors
    console.error("Failed to write version cache:", error);
  }
};

/**
 * Fetch the latest version from npm
 * @param {string} packageName - Package name
 * @returns {Promise<object>} Latest version data
 */
export const fetchLatestVersion = async (packageName) => {
  try {
    const registry = "https://registry.npmjs.org/";
    const url = `${registry}${packageName}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch from npm registry: ${response.status} ${response.statusText}`
      );
    }

    const packageInfo = await response.json();

    return {
      latestVersion: packageInfo["dist-tags"].latest,
      versions: packageInfo.versions,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Failed to fetch latest version: ${error.message}`);
  }
};

/**
 * Get the current installed version
 * @param {string} packageName - Package name
 * @returns {string} Current version
 */
export const getCurrentVersion = (packageName) => {
  try {
    // This works for globally installed packages
    return execSync(`npm list -g ${packageName} --json`).toString();
  } catch (error) {
    try {
      // Fallback to the local package.json if available
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), "package.json"))
      );
      return packageJson.version;
    } catch (e) {
      return "unknown";
    }
  }
};

/**
 * Parse semantic version string to compare versions
 * @param {string} version - Semantic version string (e.g., '1.2.3')
 * @returns {number[]} Array of version parts as numbers
 */
export const parseVersion = (version) => {
  return version.split(".").map(Number);
};

/**
 * Compare two semantic versions
 * @param {string} versionA - First version
 * @param {string} versionB - Second version
 * @returns {number} -1 if A < B, 0 if A = B, 1 if A > B
 */
export const compareVersions = (versionA, versionB) => {
  const partsA = parseVersion(versionA);
  const partsB = parseVersion(versionB);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const a = partsA[i] || 0;
    const b = partsB[i] || 0;

    if (a < b) return -1;
    if (a > b) return 1;
  }

  return 0;
};

/**
 * Check if an update is available
 * @param {string} packageName - Package name
 * @param {object} options - Configuration options
 * @param {boolean} options.background - Run update check in background
 * @param {number} options.cacheMaxAge - Max age of cache in milliseconds (default: 24h)
 * @returns {Promise<object>} Update information
 */
export const checkForUpdates = async (packageName, options = {}) => {
  const {
    background = true,
    cacheMaxAge = 24 * 60 * 60 * 1000, // 24 hours
  } = options;

  try {
    // Get current version
    const currentVersion = getCurrentVersion(packageName);

    // Read cache
    const cache = await readVersionCache(packageName);

    // Determine if cache needs refresh
    const cacheExpired =
      !cache ||
      !cache.fetchedAt ||
      new Date() - new Date(cache.fetchedAt) > cacheMaxAge;

    // If cache is expired, fetch in background or foreground based on options
    if (cacheExpired) {
      if (background) {
        // Fetch in background
        setTimeout(async () => {
          try {
            const latest = await fetchLatestVersion(packageName);
            await writeVersionCache(packageName, latest);
          } catch (error) {
            // Silently fail in background
          }
        }, 0);

        // Use cache for now if available
        if (cache) {
          return {
            currentVersion,
            latestVersion: cache.latestVersion,
            updateAvailable:
              compareVersions(currentVersion, cache.latestVersion) < 0,
            usingCache: true,
          };
        }

        // No cache available, return current info only
        return {
          currentVersion,
          latestVersion: currentVersion,
          updateAvailable: false,
          usingCache: true,
        };
      } else {
        // Fetch synchronously
        const latest = await fetchLatestVersion(packageName);
        await writeVersionCache(packageName, latest);

        return {
          currentVersion,
          latestVersion: latest.latestVersion,
          updateAvailable:
            compareVersions(currentVersion, latest.latestVersion) < 0,
          usingCache: false,
        };
      }
    }

    // Use valid cache
    return {
      currentVersion,
      latestVersion: cache.latestVersion,
      updateAvailable: compareVersions(currentVersion, cache.latestVersion) < 0,
      usingCache: true,
    };
  } catch (error) {
    // Return conservative result on errors
    return {
      currentVersion: "unknown",
      latestVersion: "unknown",
      updateAvailable: false,
      error: error.message,
      usingCache: false,
    };
  }
};

/**
 * Format update message for the user
 * @param {string} packageName - Package name
 * @param {object} updateInfo - Update information
 * @returns {string} Formatted message
 */
export const formatUpdateMessage = (packageName, updateInfo) => {
  if (!updateInfo.updateAvailable) {
    return "";
  }

  return `
╭───────────────────────────────────────────╮
│ Update available for ${packageName}        
│ Current: ${updateInfo.currentVersion}
│ Latest:  ${updateInfo.latestVersion}
│                                           
│ Run: npm install -g ${packageName}
╰───────────────────────────────────────────╯
`;
};

/**
 * Check for updates and format a message if needed
 * @param {string} packageName - Package name
 * @param {object} options - Configuration options
 * @returns {Promise<string>} Update message (empty if no update)
 */
export const getUpdateMessage = async (packageName, options = {}) => {
  const updateInfo = await checkForUpdates(packageName, options);
  return formatUpdateMessage(packageName, updateInfo);
};
