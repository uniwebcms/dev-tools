// section.js - Section management functions for Uniweb

import fs from "fs/promises";
import { join } from "path";
import yaml from "js-yaml";
import {
  fileExists,
  ensureDirectory,
  resolveSite,
  normalizeConfigData,
  resolveSection,
} from "../utils/file.js";
import { Section } from "../utils/types.js";
import { PageManager } from "../utils/page-manager.js";

/**
 * Adds a new section to a page.
 *
 * @param {string} name - Section name.
 * @param {string} [page=""] - Path to the page (e.g., "team/about" ).
 * @param {string} [site=""] - Site identifier.
 * @param {string} [under=""] - Path to the parent section (e.g., "main/cards")
 * @param {string} [before=""] - Name of the sibling section to have before the new one.
 * @param {string} [after=""] - Name of the sibling section to have after the new one.
 * @returns {Object} Section information
 */
export async function addSection(name, page, site, under, before, after) {
  const pm = new PageManager();
  const section = await resolveSection(name, page, site);
  await pm.addSection(section, { under, before, after });
  await pm.writeSection(section, "component: Section", "");
  return await getSectionContent(section);
}

/**
 * Gets section content (not parsed).
 *
 * @param {string} name - Section file name (e.g., "intro" or "intro.md").
 * @param {string} [page=""] - Page path (e.g., "features/examples").
 * @param {string} [site=""] - Site identifier.
 * @returns {Promise<string>} Raw section content
 */
export async function getSection(name, page, site) {
  const section = await resolveSection(name, page, site);
  return parseContent(await getSectionContent(section));
}

/**
 * Gets section configuration (front matter).
 *
 * @param {string} name - Section file name (e.g., "intro" or "intro.md").
 * @param {string} [page=""] - Page path (e.g., "features/examples").
 * @param {string} [site=""] - Site identifier.
 * @returns {Promise<Object>} Section config object (component, preset, ...params)
 */
export async function getSectionConfig(name, page, site) {
  const content = await getSection(name, page, site);
  return parseContent(content).config;
}

/**
 * Configures standard properties of a section.
 *
 * @param {string} name - Section name (e.g., "intro").
 * @param {string|null} [component=null] - Name of a component
 * @param {string|null} [preset=null] - Name of a preset
 * @param {string|null} [theme=null] - Name of a theme
 * @param {string} [page=""] - Page path (e.g., "features/examples").
 * @param {string} [site=""] - Site identifier.
 */
export async function configSection(
  name,
  component,
  preset,
  theme,
  page,
  site
) {
  const section = await resolveSection(name, page, site);
  const { config, body } = parseContent(await getSectionContent(section));
  const values = { component, preset, theme };

  for (const key in values) {
    if (values[key] === "") delete config[key];
    else if (values[key] !== null) config[key] = values[key];
  }

  const pm = new PageManager();
  await pm.writeSection(section, config, body);
}

/**
 * Gets section data.
 *
 * @param {string} name - Section file name (e.g., "intro").
 * @param {string} [page=""] - Page path (e.g., "features/examples").
 * @param {string} [site=""] - Site identifier.
 * @param {string} [lang=""] - Language code for translation (empty for default).
 * @returns {Promise<string>} Section body
 */
export async function getSectionBody(name, page, site, lang) {
  if (lang) {
    return await getLanguageContent(name, page, site, lang);
  }

  const content = await getSection(name, page, site);
  return splitContent(content).body;
}

/**
 * Updates a section's config (front matter) and body.
 *
 * @param {string} name - Name of the page section.
 * @param {string|null} [config=null] - Content for the config part in JSON or YAML
 * @param {string|null} [body=null] - Content for the body part in markdown
 * @param {string} [page=""] - Path to page (e.g., "about/team").
 * @param {string} [site=""] - Site identifier.
 * @returns {Promise<void>} Updated section information
 */
export async function setSection(name, config, body, page, site) {
  const section = await resolveSection(name, page, site);
  const content = splitContent(await getSectionContent(section));

  if (config !== null) {
    config = normalizeConfigData(config);
  }

  if (body !== null) {
    body = normalizeBodyData(body);
  }

  if (typeof config === "string") content.config = config;
  if (typeof body === "string") content.body = body;

  const pm = new PageManager();
  await pm.writeSection(section, content.config, content.body);
}

/**
 * Updates a section's config (front matter) and body.
 *
 * @param {string} name - Name of the page section.
 * @param {string} body - Content for the body part in markdown
 * @param {string} lang - Language code
 * @param {string} [page=""] - Path to page (e.g., "about/team").
 * @param {string} [site=""] - Site identifier.
 * @returns {Promise<string>} Path to the updated file.
 */
export async function translateSection(name, body, lang, page, site) {
  const section = await resolveSection(name, page, site);
  body = normalizeBodyData(body);
  const dirPath = join(section.page.site.langDir, lang, section.page.path);
  const filePath = join(dirPath, section.name + ".md");
  await ensureDirectory(dirPath);
  await fs.writeFile(filePath, body, "utf8");
  return filePath;
}

// /**
//  * Nest a section under another withing the same page.
//  *
//  * @param {string} name - Name of the child section.
//  * @param {string} under - Name of the parent section.
//  * @param {string} [page=""] - Path to page (e.g., "about/team").
//  * @param {string} [site=""] - Site identifier.
//  * @returns {Promise<Object>} Updated page structure
//  */
// export async function nestSection(name, under, page, site) {
//   page = await resolvePage(page, site);
//   await page.loadStructure();
//   page.structure.move(name, under);
//   await page.saveStructure();
//   return page.structure.toObject();
// }

/**
 * Renames a section while leaving its location unchanged.
 *
 * @param {string} name - Name of the page section.
 * @param {string} [newName=""] - A new name for the section.
 * @param {string} [page=""] - Path to page (e.g., "about/team").
 * @param {string} [site=""] - Site identifier.
 * @returns {Promise<void>}
 */
export async function renameSection(name, newName, page, site) {
  const pm = new PageManager();
  const section = await resolveSection(name, page, site);
  await pm.renameSection(section, newName);
}

/**
 * Changes the order of a section within a page page.
 *
 * @param {string} name - Name of the page section.
 * @param {string} [under=""] - Path to the parent section (e.g., "main/cards")
 * @param {string} [before=""] - Name of the sibling section to have before the new one.
 * @param {string} [after=""] - Name of the sibling section to have after the new one.
 * @param {string} [page=""] - Path to page (e.g., "about/team").
 * @param {string} [site=""] - Site identifier.
 * @returns {Promise<Object>} New section structure of the target page
 */
export async function reorderSection(name, under, before, after, page, site) {
  const pm = new PageManager();
  const section = await resolveSection(name, page, site);
  const structure = await section.page.loadStructure();
  await structure.move(section.name, { under, before, after });
  await structure.saveStructure();
  return structure.toObject();
}

/**
 * Copies a section to a new position in the same or different page.
 *
 * Parameters like `toName`, `toPage`, and `toSite` default to the values of `name`, `page`, and `site`
 * when their value is the empty string `""`.
 *
 * When using `before` or `after`, they must **not** be used together. If both are non-empty, the call will fail.
 * If `under` is provided, `before` and `after` are evaluated relative to its children.
 *
 * @param {string} name - Name of the page section.
 * @param {boolean} [deep=false] - Whether to copy subsections recursively.
 * @param {string} [page=""] - Path to the page (e.g., "about/team"). Defaults to the current page if `""`.
 * @param {string} [site=""] - Site identifier. Defaults to the current site if `""`.
 * @param {string} [under=""] - Name of the target parent section. Optional. Compatible with `before` or `after`.
 * @param {string} [before=""] - Name of a sibling section that the moved section should precede.
 * @param {string} [after=""] - Name of a sibling section that the moved section should follow.
 * @param {string} [toName=""] - The new name of the section. Defaults to `name` if `""`.
 * @param {string} [toPage=""] - The target page path. Defaults to `page` if `""`.
 * @param {string} [toSite=""] - The target site identifier. Defaults to `site` if `""`.
 * @returns {Promise<void>}
 */
export async function copySection(
  name,
  deep,
  page,
  site,
  under,
  before,
  after,
  toName,
  toPage,
  toSite
) {
  const fromSection = await resolveSection(name, page, site);
  const toSection = await resolveSection(
    toName || name,
    toPage || page,
    toSite || site
  );

  const pm = new PageManager();
  const position = { under, before, after };

  if (deep) {
    await pm.validateNewFiles(fromSection, toSection);
    await pm.copySectionRecursive(fromSection, toSection, position);
  } else {
    await pm.copySection(fromSection, toSection, position);
  }
}

/**
 * Moves a section and its subsections to a new position in the same or different page.
 *
 * Parameters like `toName`, `toPage`, and `toSite` default to the values of `name`, `page`, and `site`
 * when their value is the empty string `""`.
 *
 * When using `before` or `after`, they must **not** be used together. If both are non-empty, the call will fail.
 * If `under` is provided, `before` and `after` are evaluated relative to its children.
 *
 * @param {string} name - Name of the page section to move.
 * @param {string} [page=""] - Path to the page (e.g., "about/team"). Defaults to the current page if `""`.
 * @param {string} [site=""] - Site identifier. Defaults to the current site if `""`.
 * @param {string} [under=""] - Name of the target parent section. Optional. Compatible with `before` or `after`.
 * @param {string} [before=""] - Name of a sibling section that the moved section should precede.
 * @param {string} [after=""] - Name of a sibling section that the moved section should follow.
 * @param {string} [toName=""] - The new name of the section. Defaults to `name` if `""`.
 * @param {string} [toPage=""] - The target page path. Defaults to `page` if `""`.
 * @param {string} [toSite=""] - The target site identifier. Defaults to `site` if `""`.
 * @returns {Promise<void>}
 */

export async function moveSection(
  name,
  page,
  site,
  under,
  before,
  after,
  toName,
  toPage,
  toSite
) {
  const fromSection = await resolveSection(name, page, site);
  const toSection = await resolveSection(
    toName || name,
    toPage || page,
    toSite || site
  );

  const pm = new PageManager();
  const position = { under, before, after };

  await pm.validateNewFiles(fromSection, toSection);
  await pm.copySectionRecursive(fromSection, toSection, position);
  await pm.removeSectionRecursive(fromSection);
}

/**
 * Removes a section from a page.
 *
 * @param {string} name - Name of the page section.
 * @param {string} [page=""] - Path to page (e.g., "about/team").
 * @param {string} [site=""] - Site identifier.
 * @returns {Promise<void>}
 */
export async function removeSection(name, page, site) {
  const section = await resolveSection(name, page, site);
  const pm = new PageManager();
  await pm.removeSectionRecursive(section);
}

function parseContent(content) {
  content = splitContent(content);
  content.config = content.config ? yaml.load(content.config) : {};
  return content;
}

function splitContent(content) {
  // Parse front matter using a simple regex approach
  const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  let config = "",
    body = content;

  if (frontMatterMatch) {
    try {
      const matter = yaml.load(frontMatterMatch[1]);

      if (matter !== null && typeof matter === "object") {
        config = yaml.dump(matter).trim();
        body = frontMatterMatch[2].trim();
      }
    } catch (_) {}
  }

  return { config, body };
  // return frontMatterMatch
  //   ? { config: frontMatterMatch[1].trim(), body: frontMatterMatch[2].trim() }
  //   : { config: "", body: content };
}

async function getLanguageContent(name, page, site, lang) {
  site = await resolveSite(site);
  page = site.getPage(page);

  const filePath = join(site.path, "languages", lang, page.path, name + ".md");

  return (await fileExists(filePath))
    ? await fs.readFile(filePath, "utf8")
    : "";
}

async function sectionExists(section) {
  return fileExists(section.filePath);
}

async function validateExists(section) {
  if (!(await sectionExists(section))) {
    throw new Error(
      `Section '${section.name}' not found in page '${section.page}'`
    );
  }
}

async function getSectionContent(section) {
  await validateExists(section);
  return await fs.readFile(section.filePath, "utf8");
}

/**
 * Converts content by parsing it as a JSON string. It wraps the input content
 * in double quotes if it's not already wrapped.
 *
 * @param {any} content - Content string in JSON or YAML format.
 * @returns {string} Content string normalized to plain text.
 * @example
 *
 * mycli --config '{"title": "Hello", "body": "This is a test.\nNew line."}'
 */
function normalizeBodyData(content) {
  if (typeof content !== "string") {
    return null;
  }

  if (!content.startsWith('"')) {
    content = '"' + content + '"';
  }
  return JSON.parse(content);
}
