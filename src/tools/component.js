import fs from "fs/promises";
import path from "path";
import {
  fileExists,
  resolveComponent,
  isDirectory,
  normalizeName,
} from "../utils/file.js";
import { applyTemplate, TEMPLATE_TYPES } from "../utils/templates.js";
import * as viewer from "../utils/schema-viewer.js";

/**
 * Adds a new component to a module.
 *
 * @param {string} name - Name of the component.
 * @param {string} [module=""] - Name of the module.
 * @param {boolean} [css=false] - Whether to add CSS starter code.
 * @param {boolean} [clean=false] - Whether to use minimal starter code.
 * @param {boolean} [internal=false] - Whether this is an internal component.
 * @param {string} [category="generic"] - Component category.
 */
export async function addComponent(
  name,
  module,
  css,
  clean,
  internal,
  category
) {
  const displayName = normalizeName(name);
  name = displayName.replace(/\s+/g, ""); // remove spaces

  const component = await resolveComponent(name, module);

  if (await fileExists(component.path)) {
    throw new Error(`A component named '${name}' already exists`);
  }

  const data = {
    componentName: name,
    displayName,
    category,
  };

  const subtype = internal
    ? "internal"
    : css
    ? "css"
    : clean
    ? "clean"
    : "tailwind";
  console.log({ subtype, css });
  await applyTemplate(TEMPLATE_TYPES.COMPONENT, component.path, data, subtype);
}

/**
 * Gets component configuration.
 *
 * @param {string} name - Name of the component.
 * @param {string} [module=""] - Name of the module.
 * @returns {Object} Component configuration
 */
export async function getComponent(name, module) {
  const component = await resolveComponent(name, module);
  const config = await component.loadConfig();
  return viewer.getComponentDetails(config);
}

/**
 * Gets component parameters.
 *
 * @param {string} name - Name of the file.
 * @param {string} [module=""] - Name of the module.
 */
export async function getComponentParams(name, module) {
  const component = await resolveComponent(name, module);
  const config = await component.loadConfig();
  return viewer.listComponentParams(config);
}

/**
 * Gets component presets.
 *
 * @param {string} name - Name of the file.
 * @param {string} [module=""] - Name of the module.
 */
export async function getComponentPresets(name, module) {
  const component = await resolveComponent(name, module);
  const config = await component.loadConfig();
  return viewer.listComponentPresets(config);
}

/**
 * Reads a component's file.
 *
 * @param {string} name - Name of the file.
 * @param {string} [component=""] - Name of the component.
 * @param {string} [module=""] - Name of the module.
 */
export async function readComponentFile(name, component, module) {
  component = await resolveComponent(component, module);

  if (!path.isAbsolute(name)) {
    name = path.resolve(component.path, name);
  }

  if (!name.startsWith(component.path)) {
    throw new Error("The file path must be within the component folder");
  }

  return await fs.readFile(name, "utf8");
}

/**
 * Updates a component's file.
 *
 * @param {string} name - Name of the file.
 * @param {string} content - Name of the file.
 * @param {string} [component=""] - Name of the component.
 * @param {string} [module=""] - Name of the module.
 */
export async function writeComponentFile(name, content, component, module) {
  component = await resolveComponent(component, module);

  if (!path.isAbsolute(name)) {
    name = path.resolve(component.path, name);
  }

  if (!name.startsWith(component.path)) {
    throw new Error("The file path must be within the component folder");
  }

  await fs.mkdir(path.dirname(name), { recursive: true });
  await fs.writeFile(name, content, "utf8");
}

/**
 * Removes a component's file.
 *
 * @param {string} name - Name of the file.
 * @param {string} [component=""] - Name of the component.
 * @param {string} [module=""] - Name of the module.
 */
export async function removeComponentFile(name, component, module) {
  component = await resolveComponent(component, module);

  if (!path.isAbsolute(name)) {
    name = path.resolve(component.path, name);
  }

  if (!name.startsWith(component.path)) {
    throw new Error("The file path must be within the component folder");
  }

  try {
    await fs.unlink(name);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Removes a folder within a component.
 *
 * @param {string} name - Name or relative path of the folder.
 * @param {string} [component=""] - Name of the component.
 * @param {string} [module=""] - Name of the module.
 */
export async function removeComponentFolder(name, component, module) {
  component = await resolveComponent(component, module);

  if (!path.isAbsolute(name)) {
    name = path.resolve(component.path, name);
  }

  if (!name.startsWith(component.path) || component.path === name) {
    throw new Error("The folder path must be within the component folder");
  }

  if (!(await isDirectory(name))) {
    return false;
  }

  try {
    await fs.rm(folderPath, { recursive: true, force: true });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Removes a component folder from a module.
 *
 * @param {string} name - Name of the component.
 * @param {boolean} [force=false] - Required confirmation to remove the folder.
 * @param {string} [module=""] - Name of the module that contains the components.
 * @returns {boolean} Result of the removal operation. True if the folder was deleted.
 */
export async function removeComponent(name, force, module) {
  const component = await resolveComponent(name, module);

  if (!(await isDirectory(component.path))) {
    throw new Error(
      `Component '${name}' not found in module '${component.module.name}'`
    );
  }

  if (!force) {
    throw new Error(`Confirm removal of component '${name}' with "force"`);
  }

  // Remove component directory
  await fs.rm(component.path, { recursive: true, force: true });

  return true;
}
