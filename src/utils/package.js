// src/utils/package.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Get package data from package.json
 * @returns {Promise<Object>} Package data
 */
export async function getPackageData() {
  try {
    // Try to find package.json in parent directories
    const packagePath = findPackageJson(__dirname);

    if (!packagePath) {
      return { version: "1.0.0" };
    }

    const packageData = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    return packageData;
  } catch (error) {
    console.warn("Warning: Could not load package.json", error);
    return { version: "1.0.0" };
  }
}

/**
 * Find package.json by traversing parent directories
 * @param {string} startDir Directory to start searching from
 * @returns {string|null} Path to package.json or null if not found
 */
function findPackageJson(startDir) {
  let currentDir = startDir;

  // Traverse up to 5 parent directories
  for (let i = 0; i < 5; i++) {
    const packagePath = path.join(currentDir, "package.json");

    if (fs.existsSync(packagePath)) {
      return packagePath;
    }

    // Go up one directory
    const parentDir = path.dirname(currentDir);

    // Stop if we've reached the root
    if (parentDir === currentDir) {
      break;
    }

    currentDir = parentDir;
  }

  return null;
}
