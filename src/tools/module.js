import fs from "fs/promises";
import {
  fileExists,
  resolveModule,
  resolveSite,
  resolveProject,
  isDirectory,
} from "../utils/file.js";
import { applyTemplate, TEMPLATE_TYPES } from "../utils/templates.js";
import { runInstallScript } from "../utils/shell.js";
import * as viewer from "../utils/schema-viewer.js";

/**
 * Lists all exposed components in a module.
 *
 * @param {string} [module=""] - Name or URL of the module.
 * @param {string} [site=""] - Site linked to the module to inspect (if name is empty).
 * @returns {Object} List of components with their information
 */
export async function listComponents(module, site) {
  if (!module && !site) {
    const project = await resolveProject();
    // If there are no modules, infer the site name
    if (!(await project.hasModules())) {
      site = (await resolveSite()).name;
    }
  }
  // If no module but a site name is known, use the module linked to it
  if (!module && site) {
    site = await resolveSite(site);
    module = (await site.loadConfig()).module;
    if (!module) {
      throw new Error(`There is no module linked to site ${site.name}`);
    }
  }

  module = await resolveModule(module);
  return viewer.listComponents(module);
}

/**
 * Adds a new module to the project.
 *
 * @param {string} name - Name of the module.
 * @param {string} [example=""] - Name of an example with initial content.
 * @returns {Promise<void>}
 */
export async function addModule(name, example = "basic") {
  const module = await resolveModule(name);

  if (await fileExists(module.path)) {
    throw new Error(`A module named '${name}' already exists`);
  }

  await applyTemplate(TEMPLATE_TYPES.MODULE, module.path, { name }, example);

  await runInstallScript(module.project);
}

/**
 * Gets module data.
 *
 * @param {string} name - Name of the module.
 */
export async function getModule(name) {
  const module = await resolveModule(name);
  return await module.loadConfig();
}

/**
 * Updates module configuration (module.yml).
 *
 * @param {string} name - Name of the module.
 * @param {string|null} [version=null] - The version of the module.
 * @param {string|null} [description=null] - The description of the module.
 * @returns {Object} Updated module configuration
 */
export async function setModule(name, version, description) {
  const module = await resolveModule(name);

  // ... make changes ... TBD

  return module.loadConfig();
}

/**
 * Renames a module.
 *
 * @param {string} name - Name of the module.
 * @param {string} newName - The new name of the module.
 * @returns {boolean} Result of the renamed operation. True if the module was renamed.
 */
export async function renameModule(name, newName) {
  // TBD
}

/**
 * Removes a module from the project.
 *
 * @param {string} name - Name of the module.
 * @param {boolean} [force=false] - Required confirmation to remove the folder.
 * @returns {boolean} Result of the removal operation. True if the module was deleted.
 */
export async function removeModule(name, force) {
  const module = await resolveModule(name);

  if (!(await isDirectory(module.path))) {
    throw new Error(`Module '${name}' not found`);
  }

  if (!force) {
    throw new Error(`Confirm removal of module '${name}' with "force"`);
  }

  await fs.rm(module.path, { recursive: true, force: true });

  return true;
}
