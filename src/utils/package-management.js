import path from "path";
import fs from "fs/promises";
import { runPackageCommand } from "./shell.js";
import { logger } from "../context.js";

/**
 * Adds a package to a module
 *
 * @param {Module} module - Module object
 * @param {string|string[]} packageNames - Package(s) to add
 * @param {object} options - Options for adding packages
 * @param {boolean} [options.dev=false] - Add as development dependency
 * @param {string} [options.version=null] - Specific version or version range
 * @param {boolean} [options.exact=false] - Use exact version (not ^)
 * @returns {Promise<{success: boolean, message: string}>} Result of the operation
 */
export async function addPackage(module, packageNames, options = {}) {
  try {
    await module.validateExists();

    // Make packages an array if it's a string
    if (!Array.isArray(packageNames)) {
      packageNames = [packageNames];
    }

    // Validate package names
    packageNames = packageNames.filter(
      (pkg) => typeof pkg === "string" && pkg.trim()
    );
    if (packageNames.length === 0) {
      return { success: false, message: "No valid package names provided" };
    }

    // Add versions to package names if specified
    if (options.version && packageNames.length === 1) {
      const version = options.exact ? options.version : `^${options.version}`;
      packageNames[0] = `${packageNames[0]}@${version}`;
    }

    // Get package manager from config
    const pm = (await module.project.loadConfig()).packageManager;
    if (!pm) {
      return { success: false, message: "Cannot determine package manager" };
    }

    // Build arguments based on package manager
    const cmdArgs = [];

    // Add appropriate dev dependency flag
    if (options.dev) {
      switch (pm) {
        case "npm":
          cmdArgs.push("--save-dev");
          break;
        case "yarn":
          // Check if it's Yarn v1 or v2+
          const isYarnModern = await isYarnModern(module.path);
          cmdArgs.push(isYarnModern ? "-D" : "--dev");
          break;
        case "pnpm":
          cmdArgs.push("-D");
          break;
        case "bun":
          cmdArgs.push("-d");
          break;
      }
    }

    // Add exact version flag if requested
    if (options.exact) {
      switch (pm) {
        case "npm":
          cmdArgs.push("--save-exact");
          break;
        case "yarn":
          cmdArgs.push("--exact");
          break;
        case "pnpm":
          cmdArgs.push("--save-exact");
          break;
        case "bun":
          cmdArgs.push("--exact");
          break;
      }
    }

    // Add the packages to the arguments
    cmdArgs.push(...packageNames);

    // // Execute the command in the module directory
    // logger.info(
    //   `Adding packages to module ${module.name}: ${packageNames.join(", ")}`
    // );

    const result = await runPackageCommand(pm, "add", cmdArgs, {
      cwd: module.path,
      captureOutput: true,
    });

    if (result.code !== 0) {
      return {
        success: false,
        message: `Failed to add packages. Exit code: ${result.code}\n${
          result.output || ""
        }`,
      };
    }

    return {
      success: true,
      message: result.output,
      // `Successfully added ${packageNames.join(", ")} to ${
      //   module.name
      // }`,
    };
  } catch (error) {
    logger.error(`Failed to add packages: ${error.message}`);
    return { success: false, message: error.message };
  }
}

/**
 * Removes a package from a module
 *
 * @param {Module} module - Module object
 * @param {string|string[]} packageNames - Package(s) to remove
 * @returns {Promise<{success: boolean, message: string}>} Result of the operation
 */
export async function removePackage(module, packageNames) {
  try {
    await module.validateExists();

    // Make packages an array if it's a string
    if (!Array.isArray(packageNames)) {
      packageNames = [packageNames];
    }

    // Validate package names
    packageNames = packageNames.filter(
      (pkg) => typeof pkg === "string" && pkg.trim()
    );
    if (packageNames.length === 0) {
      return { success: false, message: "No valid package names provided" };
    }

    // Get package manager from config
    const pm = (await module.project.loadConfig()).packageManager;
    if (!pm) {
      return { success: false, message: "Cannot determine package manager" };
    }

    // // Execute the command in the module directory
    // logger.info(
    //   `Removing packages from module ${module.name}: ${packageNames.join(", ")}`
    // );

    const result = await runPackageCommand(pm, "remove", packageNames, {
      cwd: module.path,
      captureOutput: true,
    });

    if (result.code !== 0) {
      return {
        success: false,
        message: `Failed to remove packages. Exit code: ${result.code}\n${
          result.output || ""
        }`,
      };
    }

    return {
      success: true,
      message: result.output,
      // message: `Successfully removed ${packageNames.join(", ")} from ${
      //   module.name
      // }`,
    };
  } catch (error) {
    logger.error(`Failed to remove packages: ${error.message}`);
    return { success: false, message: error.message };
  }
}

/**
 * Lists packages installed in a module
 *
 * @param {Module} module - Module object
 * @param {object} options - List options
 * @param {boolean} [options.dev=false] - Show only development dependencies
 * @param {boolean} [options.prod=false] - Show only production dependencies
 * @returns {Promise<{dependencies: object, devDependencies: object}>} Installed packages
 */
export async function listPackages(module, options = {}) {
  try {
    await module.validateExists();

    // Read the package.json file
    const packageJsonPath = path.join(module.path, "package.json");
    const packageJsonContent = await fs.readFile(packageJsonPath, "utf8");
    const packageJson = JSON.parse(packageJsonContent);

    // Extract dependencies based on options
    const result = {};

    if (!options.dev) {
      result.dependencies = packageJson.dependencies || {};
    }

    if (!options.prod) {
      result.devDependencies = packageJson.devDependencies || {};
    }

    return result;
  } catch (error) {
    logger.error(`Failed to list packages: ${error.message}`);
    throw error;
  }
}

/**
 * Updates packages in a module to their latest versions
 *
 * @param {Module} module - Module object
 * @param {string|string[]} [packageNames=[]] - Specific package(s) to update, or all if empty
 * @param {object} options - Update options
 * @param {boolean} [options.latest=false] - Update to latest (potentially breaking) version
 * @returns {Promise<{success: boolean, message: string}>} Result of the operation
 */
export async function updatePackages(module, packageNames = [], options = {}) {
  try {
    await module.validateExists();

    // Make packages an array if it's a string
    if (!Array.isArray(packageNames)) {
      packageNames = packageNames ? [packageNames] : [];
    }

    // Get package manager from config
    const pm = (await module.project.loadConfig()).packageManager;
    if (!pm) {
      return { success: false, message: "Cannot determine package manager" };
    }

    // Determine the update command based on package manager and options
    let command;
    const cmdArgs = [];
    const updateToLatest = options.latest ? true : false;

    switch (pm) {
      case "npm":
        command = updateToLatest ? "install" : "update";
        break;
      case "yarn":
        // Check if it's Yarn v1 or v2+
        const isYarnModern = await isYarnModern(module.path);
        command = "up"; // Modern yarn uses "up", legacy uses "upgrade"
        if (updateToLatest && !isYarnModern) cmdArgs.push("--latest");
        break;
      case "pnpm":
        command = "update";
        if (updateToLatest) cmdArgs.push("--latest");
        break;
      case "bun":
        command = "update";
        if (updateToLatest) cmdArgs.push("--latest");
        break;
      default:
        return {
          success: false,
          message: `Unsupported package manager: ${pm}`,
        };
    }

    // Add package names to args if specified
    if (packageNames.length > 0) {
      cmdArgs.push(...packageNames);
    }

    // Execute the command in the module directory
    // logger.info(`Updating packages in module ${module.name}`);

    const result = await runPackageCommand(pm, command, cmdArgs, {
      cwd: module.path,
      captureOutput: true,
    });

    if (result.code !== 0) {
      return {
        success: false,
        message: `Failed to update packages. Exit code: ${result.code}\n${
          result.output || ""
        }`,
      };
    }

    return {
      success: true,
      message:
        packageNames.length > 0
          ? `Successfully updated ${packageNames.join(", ")} in ${module.name}`
          : `Successfully updated packages in ${module.name}`,
    };
  } catch (error) {
    logger.error(`Failed to update packages: ${error.message}`);
    return { success: false, message: error.message };
  }
}

/**
 * Determines if the project is using a modern version of Yarn (v2+)
 *
 * @param {string} projectPath - Path to the project
 * @returns {Promise<boolean>} True if using Yarn v2+
 */
async function isYarnModern(projectPath) {
  try {
    const yarnrcPath = path.join(projectPath, ".yarnrc.yml");
    return await fs
      .access(yarnrcPath)
      .then(() => true)
      .catch(() => false);
  } catch (error) {
    return false;
  }
}

/**
 * Manually edits the package.json file to add a dependency
 * This is a fallback method when direct package manager commands fail
 *
 * @param {Module} module - Module object
 * @param {string} packageName - Package to add
 * @param {string} version - Version specification
 * @param {boolean} isDev - Whether this is a dev dependency
 * @returns {Promise<{success: boolean, message: string}>} Result of the operation
 */
export async function manuallyAddPackage(
  module,
  packageName,
  version,
  isDev = false
) {
  try {
    await module.validateExists();

    // Read the package.json file
    const packageJsonPath = path.join(module.path, "package.json");
    const packageJsonContent = await fs.readFile(packageJsonPath, "utf8");
    const packageJson = JSON.parse(packageJsonContent);

    // Determine where to add the dependency
    const depType = isDev ? "devDependencies" : "dependencies";

    // Ensure the dependency section exists
    if (!packageJson[depType]) {
      packageJson[depType] = {};
    }

    // Add the dependency with its version
    packageJson[depType][packageName] = version;

    // Write the updated package.json
    await fs.writeFile(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2),
      "utf8"
    );

    // Run install to update the lock file
    const pm = (await module.project.loadConfig()).packageManager;
    if (!pm) {
      return { success: false, message: "Cannot determine package manager" };
    }

    const result = await runPackageCommand(pm, "install", [], {
      cwd: module.path,
      captureOutput: true,
    });

    if (result.code !== 0) {
      return {
        success: false,
        message: `Failed to update lock file. Exit code: ${result.code}\n${
          result.output || ""
        }`,
      };
    }

    return {
      success: true,
      message: `Successfully added ${packageName}@${version} to ${
        module.name
      } ${isDev ? "(dev)" : ""}`,
    };
  } catch (error) {
    logger.error(`Failed to manually add package: ${error.message}`);
    return { success: false, message: error.message };
  }
}
