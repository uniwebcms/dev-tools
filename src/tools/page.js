import pathUtils, { join } from "path";
import {
  resolvePage,
  fileExists,
  writeYamlFile,
  readYamlFile,
  parseConfigData,
} from "../utils/file.js";
import { PageManager } from "../utils/page-manager.js";
import { openTerminalAt } from "../utils/shell.js";
import { listPages } from "./site.js";

/**
 * Change directory for the current process. Any tool operations will be relative
 * to the new directory.
 *
 * @param {string} path - Path to a page (e.g., 'home')
 * @param {string} [site=""] - Name of the site (e.g., 'marketing')
 * @returns {void}
 */
export async function goPage(path, site) {
  const page = await resolvePage(path, site);
  await openTerminalAt(page.dirPath);
}

/**
 * Adds a new page to a site.
 *
 * @param {string} name - The name of the new page.
 * @param {string} [path=""] - An absolute or relative path to the page (e.g., "/products").
 * @param {string} [section=""] - Name of a first section. Otherwise the page is just a route.
 * @param {string} [title=""] - Page title.
 * @param {string} [description=""] - Page description.
 * @param {string} [site=""] - Site identifier. Inferred if not given.
 * @returns {Object} Page config and sections
 */
export async function addPage(name, path, section, title, description, site) {
  const page = await resolvePage(join(path, name), site);

  const pm = new PageManager();
  const structure = await pm.createPage(page);

  // Read the config data if it exists already
  const config = await readPageConfig(page);
  config.title = title ? title.trim() : generateTitleFromPath(page.path);
  config.description = "";

  await savePageConfig(page, config);

  if (section) {
    section = page.getSection(section);
    await pm.addSection(section);
    await pm.writeSection(section, "component: Section", "");
  }

  return { ...config, route: page.route, sections: structure.toObject() };
}

/**
 * Gets page config and sections.
 *
 * @param {string} [name=""] - Path of the page.
 * @param {string} [site=""] - Site identifier: "root" or site name.
 * @returns {Object} Page data (complete, config, or sections)
 */
export async function getPage(name, site) {
  const page = await resolvePage(name, site);
  const data = await readPageConfig(page);
  data.sections = (await page.loadStructure()).toObject();
  return data;
}

/**
 * Gets page configuration.
 *
 * @param {string} [path=""] - Path of the page.
 * @param {string} [site=""] - Site identifier: "root" or site name.
 * @returns {Object} Page configuration and metadata
 */
export async function getPageConfig(path, site) {
  const page = await resolvePage(path, site);
  return await readPageConfig(page);
}

/**
 * Lists all sections in a page.
 *
 * @param {string} [page=""] - Path of the page.
 * @param {string} [site=""] - Site identifier: "root" or site name.
 * @returns {Object} List of sections with their information
 */
export async function listSections(page, site) {
  page = await resolvePage(page, site);
  const structure = await page.loadStructure();
  return structure.printTree();
}

/**
 * Updates page configuration.
 *
 * @param {string|Object} config - Configuration fields to update.
 * @param {boolean} [replace=false] - Whether to replace all or merge with existing props.
 * @param {string} [path=""] - Path of the page.
 * @param {string} [site=""] - Site identifier: "/" or site name.
 * @param {string} [locale=""] - Language code for translation (empty for default).
 * @returns {Object} Updated page configuration
 */
export async function setPage(config, replace, path, site, locale) {
  const page = await resolvePage(path, site);
  const previous = replace ? {} : await readPageConfig(page);
  config = { ...previous, ...parseConfigData(config) };
  await savePageConfig(page, config, locale);
  return config;
}

/**
 * Copies a page to a new location in the same or different site.
 *
 * @param {string} from - Path to the page to more.
 * @param {string} to - Path to where the page page will be moved.
 * @param {string} [site=""] - Site identifier for the source page.
 * @param {string} [toSite=""] - The target site if different from the source site.
 * @returns {Object} Updated page information
 */
export async function copyPage(from, to, site, toSite) {
  const fromPage = await resolvePage(from, site);
  const toPage = await resolvePage(to, toSite || site);
  const pm = new PageManager();
  await pm.copyPage(fromPage, toPage);
  return toPage;
}

/**
 * Moves a page to a new location in the same or different site.
 *
 * @param {string} from - Path to the page to more.
 * @param {string} to - Path to where the page page will be moved.
 * @param {string} [site=""] - Site identifier for the source page.
 * * @param {string} [toSite=""] - The target site if different from the source site.
 * @returns {Object} Updated page information
 */
export async function movePage(from, to, site, toSite) {
  const fromPage = await resolvePage(from, site);
  const toPage = await resolvePage(to, toSite || site);
  const pm = new PageManager();
  await pm.movePage(fromPage, toPage);
  return toPage;
}

/**
 * Removes a page from the site.
 *
 * @param {string} name - Name of the page.
 * @param {string} [path=""] - Path of the page to remove.
 * @param {string} [site=""] - Site identifier: "root" or site name.
 * @returns {void}
 */
export async function removePage(name, path, site) {
  const page = await resolvePage(join(path, name), site);
  const pm = new PageManager();
  await pm.removePage(page);
}

/**
 * Find the first page with given name
 *
 * @param {string} name - Name of the page to locate
 * @param {string} [site=""] - Name of the site for page listing
 * @param {boolean} [relative=false] - Whether to get a relative path
 * @returns {Object} List of modules with their basic information
 */
export async function locatePage(name, site, relative) {
  const pagesList = await listPages(site);
  // site = await resolveSite(site);
  // const pagesList = await listPagesRecursive(site.pagesDir);
  let page = pagesList.find((entry) => entry.path.endsWith(name));
  if (!page) return null;

  page = await resolvePage("/" + page.path, site);
  return relative ? pathUtils.relative(".", page.dirPath) : page.dirPath;
}

async function readPageConfig(page) {
  const filePath = join(page.dirPath, "page.yml");
  let content = {};

  if (await fileExists(filePath)) {
    try {
      content = await readYamlFile(filePath);
    } catch (error) {
      throw new Error(`Error reading page configuration: ${error.message}`);
    }
  }

  return content !== null && typeof content === "object" ? content : {};
}

async function savePageConfig(page, config, locale = "") {
  const filePath = join(page.dirPath, "page.yml");
  return writeYamlFile(filePath, config);
}

/**
 * Generates a fallback title from a folder path.
 * @param {string} folderPath - The path to the folder.
 * @returns {string} A nicely formatted title based on the last segment.
 */
function generateTitleFromPath(folderPath) {
  const last = pathUtils.basename(folderPath);

  if (!last) return "Untitled";

  // Replace dashes/underscores with spaces and capitalize words
  return last
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
