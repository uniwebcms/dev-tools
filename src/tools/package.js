// module-package.js
import cliContext from "../context.js";
import * as manager from "../utils/package-management.js";
import { resolveModule } from "../utils/file.js";

const { buffer, chalk } = cliContext;

/**
 * Adds one npm packages to a module
 *
 * @param {string} name - Package name to add
 * @param {string} [module=""] - The name of the module
 * @param {string} [version=""] - Specific version or version range
 * @param {boolean} [exact=false] - Use exact version (not ^)
 */
export async function addPackage(name, module, version, exact) {
  try {
    module = await resolveModule(module);
    const packages = [name];

    buffer.info(
      `Adding package ${chalk.underline(name)} to module ${module.name}`
    );

    const result = await manager.addPackage(module, packages, {
      version,
      exact,
    });

    if (result.success) {
      buffer.success(result.message);
    } else {
      buffer.error(result.message);
    }
  } catch (error) {
    buffer.error(
      `Failed to add packages to module "${module.name}": ${error.message}`
    );
  }
}

/**
 * Removes an npm packages from a module
 *
 * @param {string} name - Package name to remove
 * @param {string} [module=""] - The name of the module
 */
export async function removePackage(name, module) {
  try {
    module = await resolveModule(module);
    const packages = [name];

    buffer.info(`Removing package ${name} from module "${module.name}"`);

    const result = await manager.removePackage(module, packages);

    if (result.success) {
      buffer.success(result.message);
    } else {
      buffer.error(result.message);
    }
  } catch (error) {
    buffer.error(
      `Failed to remove package from module "${module.name}": ${error.message}`
    );
  }
}

/**
 * Lists npm packages installed in a module
 *
 * @param {string} [module=""] - The name of the module
 * @param {boolean} [dev=false] - Show only development dependencies
 * @param {boolean} [prod=false] - Show only production dependencies
 */
export async function listPackages(module, dev = false, prod = false) {
  try {
    module = await resolveModule(module);

    buffer.info(`Listing packages in module "${module.name}"`);

    const packages = await manager.listPackages(module.name, { dev, prod });

    // Format the output
    const { dependencies = {}, devDependencies = {} } = packages;

    // Create a table for dependencies if we have any and should show them
    if (Object.keys(dependencies).length > 0 && !dev) {
      buffer.table(
        ["Dependencies"],
        Object.entries(dependencies).map(([name, version]) => [
          `${name}@${version}`,
        ])
      );
    }

    // Create a table for dev dependencies if we have any and should show them
    if (Object.keys(devDependencies).length > 0 && !prod) {
      buffer.table(
        ["Development Dependencies"],
        Object.entries(devDependencies).map(([name, version]) => [
          `${name}@${version}`,
        ])
      );
    }

    // Show a message if no packages were found
    if (
      Object.keys(dependencies).length === 0 &&
      Object.keys(devDependencies).length === 0
    ) {
      buffer.info(
        `No ${dev ? "dev " : ""}${
          prod ? "prod " : ""
        }packages found in module "${module.name}"`
      );
    }
  } catch (error) {
    buffer.error(
      `Failed to list packages in module "${module.name}": ${error.message}`
    );
  }
}

/**
 * Updates an npm package in a module
 *
 * @param {string} name - Specific package to update, or all if empty
 * @param {string} [module=""] - The name of the module
 * @param {boolean} [latest=false] - Update to latest (potentially breaking) version
 */
export async function updatePackage(name, module, latest) {
  try {
    module = await resolveModule(module);
    const packages = [name];

    const packagesList = Array.isArray(packages)
      ? packages
      : packages
      ? [packages]
      : [];

    const packageDisplay =
      packagesList.length > 0
        ? `packages: ${packagesList.join(", ")}`
        : "all packages";

    buffer.info(`Updating ${packageDisplay} in module "${module.name}"`);

    const result = await manager.updatePackages(module, packages, {
      latest,
    });

    if (result.success) {
      buffer.success(result.message);
    } else {
      buffer.error(result.message);
    }
  } catch (error) {
    buffer.error(
      `Failed to update packages in module "${module.name}": ${error.message}`
    );
  }
}
