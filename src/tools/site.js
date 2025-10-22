// site.js - Site management functions for Uniweb

import fs from "fs/promises";
import path from "path";
import {
  fileExists,
  ensureDirectory,
  writeYamlFile,
  readYamlFile,
  resolveSite,
  isModuleUrl,
  resolveProject,
} from "../utils/file.js";
import { applyTemplate, TEMPLATE_TYPES } from "../utils/templates.js";
import { Site } from "../utils/types.js";
import os from "os";
import { runInstallScript } from "../utils/shell.js";
import cliContext from "../context.js";

const { buffer, chalk } = cliContext;

// /**
//  * Starts a development server for a site.
//  *
//  * @param {string} [name=""] - Port to run the dev server on
//  * @param {number} [port=3000] - Port to run the dev server on
//  */
// export async function startSite(name, port) {
//   const { chalk } = cliContext;
//   const site = await resolveSite(name);

//   try {
//     const serverUrl = `http://localhost:${port}/sites/${site.name}/`;

//     logger.info(`Server running at ${chalk.cyan(serverUrl)}`);
//     logger.info(`Press ${chalk.yellow("Ctrl+C")} to stop`);

//     await runScript("install");

//     const exitCode = await runScript("start", [`--port ${port}`]);

//     if (exitCode === 127) {
//       logger.error(
//         "Some dependencies seem to be missing.\nPlease run `npm install` or `yarn install` and retry."
//       );
//     }
//   } catch (error) {
//     logger.error(error.message);
//   }
// }

/**
 * Adds a new site to the project.
 *
 * @param {string} name - Site name or "/" for top-level site.
 * @param {string} [module=""] - Module name or URL.
 * @param {string} [example=""] - Name of an example with initial content.
 * @returns {Object} Site information
 */
export async function addSite(name, module = "", example = "local") {
  const project = await resolveProject();
  const config = await project.loadConfig();

  module ||= "https://uniwebcms.github.io/AcademicModules/M1";

  let {
    engineName = "@uniwebcms/uniweb-rte",
    engineVersion = "^1.2.2",
    devMode = false,
  } = config;

  if (devMode) {
    engineVersion = `file:${os.homedir()}/Proximify/uniweb-rte`;
  }

  const site = new Site(name, project);

  if (site.name !== "/" && (await fileExists(site.path))) {
    throw new Error(`A site named '${name}' already exists`);
  }

  const templateData = {
    name,
    module,
    engineName,
    engineVersion,
  };

  await applyTemplate(TEMPLATE_TYPES.SITE, site.path, templateData, example);

  await runInstallScript(project);
}

// /**
//  * Gets site data.
//  *
//  * @param {string} [name="root"] - Site identifier: "root" or site name.
//  * @param {boolean} [config=false] - Return only configuration.
//  * @param {boolean} [content=false] - Return only content structure.
//  * @returns {Object} Site data (complete, config, or content)
//  */
// export async function getSite(name = "root", config = false, content = false) {
//   // If no specific flags are set, return complete data
//   if (!config && !content) {
//     const siteConfig = await getSiteConfig(name);
//     const siteContent = await getSiteContent(name);

//     return {
//       ...siteConfig,
//       content: siteContent,
//     };
//   }

//   // Return specific data based on flags
//   if (config) {
//     return await getSiteConfig(name);
//   }

//   if (content) {
//     return await getSiteContent(name);
//   }
// }

/**
 * Gets site configuration from site.yml.
 *
 * @param {string} [site=""] - Site identifier: "/" or site name.
 * @returns {Object} Site configuration and metadata
 */
export async function getSiteConfig(site = "") {
  // If no site specified, get default site
  site = await resolveSite(site);

  // Check for site.yml
  const siteConfigPath = path.join(site.path, "site.yml");
  if (!(await fileExists(siteConfigPath))) {
    throw new Error(`Site configuration not found at ${siteConfigPath}`);
  }

  // Read site configuration
  const siteConfig = await readYamlFile(siteConfigPath);

  //   return {
  //     name:site.name,
  //     path: site.path,
  //     configPath: siteConfigPath,
  //     config: siteConfig,
  //   };
  return siteConfig;
}

/**
 * Gets the page hierarchy of a site and page panels.
 *
 * @private
 * @param {string} [site=""] - Site folder name, or empty for active site.
 * @param {boolean} [flat=false] - Should each page has a nested "pages" prop (default) or not (flat pages array).
 * @returns {Primise<{panels: Array, pages: Array}>} Site content structure with pages hierarchy and panels
 */
export async function getSiteStructure(site = "", flat = false) {
  site = await resolveSite(site);

  // Determine pages directory based on language
  const pagesDir = path.join(site.path, "pages");

  if (!(await fileExists(pagesDir))) {
    throw new Error(`Pages directory not found at ${pagesDir}`);
  }

  // Get page listing and build hierarchy
  const pages = await getPageHierarchy(pagesDir);

  // Check for special folders
  const specialFolders = ["@header", "@footer", "@left", "@right"];
  const specialContent = {};

  for (const folder of specialFolders) {
    const folderPath = path.join(pagesDir, folder);
    if (await fileExists(folderPath)) {
      const sections = await getSectionListing(folderPath);
      if (sections.length > 0) {
        specialContent[folder.slice(1)] = sections;
      }
    }
  }

  return {
    // site: name,
    // language: language || "default",
    panels: Object.keys(specialContent).length > 0 ? specialContent : undefined,
    pages,
  };
}

/**
 * Gets the page hierarchy of a site and page panels.
 *
 * @param {string} site - Site folder name, or empty for active site.
 * @param {boolean} [flat] - Should each page has a nested "pages" prop (default) or not (flat pages array).
 * @returns {Array} Site content structure with pages hierarchy and panels
 */
export async function getSitePages(site = "", flat = false) {
  return (await getSiteStructure(site, flat)).pagesDir;
}

/**
 * Gets the panels available for all pages.
 *
 * @param {string} site - Site folder name, or empty for active site.
 * @returns {Array} Site content structure with pages hierarchy and panels
 */
export async function getSitePanels(site = "") {
  return (await getSiteStructure(site)).panels;
}

/**
 * Helper function to get page hierarchy recursively
 *
 * @param {string} pagesDir - Directory to scan
 * @param {string} [prefix=""] - Path prefix for recursive calls
 * @returns {Promise<Array>} Array of page objects with their sections
 */
async function getPageHierarchy(pagesDir, prefix = "") {
  const entries = await fs.readdir(pagesDir, { withFileTypes: true });
  const pages = [];

  for (const entry of entries) {
    // Skip special folders and hidden files
    if (entry.name.startsWith("@") || entry.name.startsWith(".")) {
      continue;
    }

    const entryPath = path.join(pagesDir, entry.name);
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      // This is a page or a subdirectory
      const sections = await getSectionListing(entryPath);

      const pageProps = await readYamlFile(path.join(entryPath, "page.yml"));

      // Check for subpages
      const subpages = await getPageHierarchy(entryPath, relativePath);

      pages.push({
        // name: entry.name,
        route: relativePath,
        ...pageProps,
        // sections: sections.length > 0 ? sections : undefined,
        hasSections: sections.length > 0,
        pages: subpages.length > 0 ? subpages : undefined,
      });
    }
  }

  return pages;
}

/**
 * Helper function to get sections in a page
 *
 * @param {string} pageDir - Page directory to scan
 * @returns {Promise<Array>} Array of section objects
 */
async function getSectionListing(pageDir) {
  const entries = await fs.readdir(pageDir, { withFileTypes: true });
  const sections = [];

  for (const entry of entries) {
    // Only consider markdown files
    if (entry.isFile() && entry.name.endsWith(".md")) {
      // Parse file name to extract prefix and name
      const match = entry.name.match(/^([0-9.]+)-(.+?)\.md$/);
      if (match) {
        const filePath = path.join(pageDir, entry.name);
        const content = await fs.readFile(filePath, "utf8");

        // Extract front matter (simplistic approach)
        let component = "";
        if (content.startsWith("---")) {
          const endIndex = content.indexOf("---", 3);
          if (endIndex > 0) {
            const frontMatter = content.substring(3, endIndex).trim();
            const componentMatch = frontMatter.match(/component:\s*([^\n]+)/);
            if (componentMatch) {
              component = componentMatch[1].trim();
            }
          }
        }

        sections.push({
          file: entry.name,
          prefix: match[1],
          name: match[2],
          component: component || undefined,
        });
      }
    }
  }

  // Sort sections by prefix
  return sections.sort((a, b) => {
    const prefixA = a.prefix.split(".").map(Number);
    const prefixB = b.prefix.split(".").map(Number);

    for (let i = 0; i < Math.max(prefixA.length, prefixB.length); i++) {
      const numA = i < prefixA.length ? prefixA[i] : 0;
      const numB = i < prefixB.length ? prefixB[i] : 0;
      if (numA !== numB) {
        return numA - numB;
      }
    }

    return 0;
  });
}

/**
 * Updates site configuration (site.yml).
 *
 * @param {string} site - Site identifier: "root" or site name.
 * @param {Object} config - Configuration fields to update.
 * @returns {Object} Updated site configuration
 */
export async function setSiteConfig(site, config) {
  site = await resolveSite(site);

  // Check for site.yml
  const siteConfigPath = path.join(site.path, "site.yml");
  if (!(await fileExists(siteConfigPath))) {
    throw new Error(`Site configuration not found at ${siteConfigPath}`);
  }

  // Read existing site configuration
  const existingConfig = await readYamlFile(siteConfigPath);

  // Merge with new configuration
  const updatedConfig = {
    ...existingConfig,
    ...config,
  };

  // Write updated configuration
  await writeYamlFile(siteConfigPath, updatedConfig);

  return {
    name,
    path: site.path,
    configPath: siteConfigPath,
    config: updatedConfig,
    updated: new Date().toISOString(),
  };
}

/**
 * Sets the module for a site.
 *
 * @param {string} name - Site identifier: "root" or site name.
 * @param {string} module - Module name or URL.
 * @returns {Object} Updated site configuration
 */
export async function setSiteModule(name, module) {
  if (!module) {
    throw new Error("Module name or URL is required");
  }

  // Resolve module URL
  let moduleUrl;
  if (isModuleUrl(module)) {
    moduleUrl = module;
  } else {
    // Check if local module exists
    const project = await resolveProject();
    const modulePath = path.join(project.modulesDir, module);

    if (await fileExists(modulePath)) {
      moduleUrl = `http://localhost:3001/${module}`;
    } else {
      throw new Error(`Local module '${module}' not found in src/ directory`);
    }
  }

  // Update site configuration with the module URL
  return await setSiteConfig(name, { module: moduleUrl });
}

/**
 * Removes a site from the project.
 *
 * @param {string} site - Site identifier: "root" or site name.
 * @param {boolean} [force=false] - Force removal without confirmation.
 * @returns {Object} Result of the removal operation
 */
export async function removeSite(site, force = false) {
  site = await resolveSite(site);

  // Check if force flag is set
  if (!force) {
    throw new Error(`Use --force to confirm removal of site '${name}'`);
  }

  // Remove the site directory
  await fs.rm(site.path, { recursive: true, force: true });

  return true;
}

/**
 * Lists all sites in a project.
 *
 * @returns {Object} List of sites with their basic information
 */
export async function listProjectSites() {
  const project = await resolveProject();
  const projectConfig = await project.loadConfig();
  const sites = [];

  // Check for root site
  const rootSiteConfig = path.join(projectPath, "site.yml");
  if (await fileExists(rootSiteConfig)) {
    const rootConfig = await readYamlFile(rootSiteConfig);
    sites.push({
      name: "root",
      path: projectPath,
      title: rootConfig.title || rootConfig.name || "Root Site",
      module: rootConfig.module || "(none)",
    });
  }

  // For multi-site projects, check sites directory
  const sitesDir = path.join(projectPath, "sites");
  if (await fileExists(sitesDir)) {
    const siteEntries = await fs.readdir(sitesDir, { withFileTypes: true });

    for (const entry of siteEntries) {
      if (entry.isDirectory()) {
        const sitePath = path.join(sitesDir, entry.name);
        const siteConfigPath = path.join(sitePath, "site.yml");

        if (await fileExists(siteConfigPath)) {
          const siteConfig = await readYamlFile(siteConfigPath);
          sites.push({
            name: entry.name,
            path: sitePath,
            title: siteConfig.title || siteConfig.name || entry.name,
            module: siteConfig.module || "(none)",
          });
        }
      }
    }
  }

  return {
    project: projectConfig.name,
    type: projectConfig.type,
    count: sites.length,
    sites,
  };
}

/**
 * Sets the default language for a site.
 *
 * @param {string} name - Site identifier: "root" or site name.
 * @param {string} language - Language code (e.g., "en", "fr").
 * @returns {Object} Updated site language settings
 */
export async function setSiteLanguage(name, language) {
  if (!language) {
    throw new Error("Language code is required");
  }

  // Validate language code format
  if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(language)) {
    throw new Error(
      'Invalid language code format. Use format like "en" or "en-US"'
    );
  }

  // Update site configuration with the language
  return await setSiteConfig(name, { defaultLanguage: language });
}

/**
 * Adds a supported language to a site.
 *
 * @param {string} site - Site identifier: "/" or site name.
 * @param {string} language - Language code (e.g., "en", "fr").
 * @returns {Object} Updated site language settings
 */
export async function addSiteLanguage(site, language) {
  site = await resolveSite(site);

  if (!language) {
    throw new Error("Language code is required");
  }

  // Validate language code format
  if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(language)) {
    throw new Error(
      'Invalid language code format. Use format like "en" or "en-US"'
    );
  }

  // Create languages directory if it doesn't exist
  const languagesDir = path.join(site.path, "languages");
  await ensureDirectory(languagesDir);

  // Create language directory
  const langDir = path.join(languagesDir, language);
  await ensureDirectory(langDir);

  // Create pages directory for this language
  await ensureDirectory(path.join(langDir, "pages"));

  // Get current site configuration
  const siteConfigPath = path.join(site.path, "site.yml");
  const siteConfig = await readYamlFile(siteConfigPath);

  // Update languages array in site configuration
  let languages = siteConfig.languages || [];
  if (Array.isArray(languages)) {
    if (!languages.includes(language)) {
      languages.push(language);
    }
  } else {
    languages = [language];
  }

  // Update site configuration
  await setSiteConfig(name, { languages });

  return {
    site: name,
    language,
    path: langDir,
    languages,
    added: new Date().toISOString(),
  };
}

/**
 * Removes a supported language from a site.
 *
 * @param {string} site - Site identifier: "root" or site name.
 * @param {string} language - Language code (e.g., "en", "fr").
 * @returns {Object} Updated site language settings
 */
export async function removeSiteLanguage(site, language) {
  if (!language) {
    throw new Error("Language code is required");
  }

  site = await resolveSite(site);

  // Check if language directory exists
  const langDir = path.join(site.path, "languages", language);
  if (!(await fileExists(langDir))) {
    throw new Error(`Language '${language}' not found for site '${name}'`);
  }

  // Get current site configuration
  const siteConfigPath = path.join(site.path, "site.yml");
  const siteConfig = await readYamlFile(siteConfigPath);

  // Update languages array in site configuration
  let languages = siteConfig.languages || [];
  if (Array.isArray(languages)) {
    languages = languages.filter((lang) => lang !== language);
  }

  // Remove language directory
  await fs.rm(langDir, { recursive: true, force: true });

  // Update site configuration
  await setSiteConfig(name, { languages });

  return {
    site: name,
    language,
    languages,
    removed: true,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Configures site panels (header, footer, etc.).
 *
 * @param {string} site - Site identifier: "/" or site name.
 * @param {string} panel - Panel type: header|footer|left|right.
 * @param {boolean} [enabled=true] - Enable or disable the panel.
 * @returns {Object} Updated panel settings
 */
export async function setSitePanels(site, panel, enabled = true) {
  if (!panel) {
    throw new Error("Panel type is required");
  }

  // Validate panel type
  const validPanels = ["header", "footer", "left", "right"];
  if (!validPanels.includes(panel)) {
    throw new Error(
      `Invalid panel type. Must be one of: ${validPanels.join(", ")}`
    );
  }

  // If no site specified, get default site
  site = await resolveSite(site);

  // Create or remove panel directory
  const panelDir = path.join(site.path, "pages", `@${panel}`);

  if (enabled) {
    // Create panel directory if it doesn't exist
    await ensureDirectory(panelDir);

    // Create a default section if the directory is empty
    const entries = await fs.readdir(panelDir);
    if (entries.length === 0) {
      const defaultContent = `---
component: ${
        panel === "header"
          ? "Navbar"
          : panel === "footer"
          ? "Footer"
          : "Sidebar"
      }
---

# Default ${panel} content

This is a default section for the ${panel} panel.
`;
      await fs.writeFile(
        path.join(panelDir, `1-default.md`),
        defaultContent,
        "utf8"
      );
    }
  } else {
    // Check if panel directory exists before attempting to remove it
    if (await fileExists(panelDir)) {
      await fs.rm(panelDir, { recursive: true, force: true });
    }
  }

  // Get current site configuration
  const siteConfigPath = path.join(site.path, "site.yml");
  const siteConfig = await readYamlFile(siteConfigPath);

  // Update panels in site configuration
  const panels = siteConfig.panels || {};
  panels[panel] = enabled;

  // Update site configuration
  await setSiteConfig(name, { panels });

  return {
    site: name,
    panel,
    enabled,
    path: enabled ? panelDir : null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Lists all pages in a site.
 *
 * @param {string} [site=""] - Name of the site. Inferred otherwise.
 * @returns {Object} List of pages with their paths and titles
 */
export async function listPages(site) {
  site = await resolveSite(site);
  const pagesList = await listPagesRecursive(site.pagesDir);

  const headers = [
    chalk.bold(`Path ${pagesList.length}`),
    chalk.bold("Title"),
    chalk.bold("Description"),
  ];

  const rows = pagesList.map((page) => {
    let description = page.description || "";
    if (description.length > 30) description += "...";
    return [page.path, page.title || "", description];
  });

  // Add the table
  buffer.table(headers, rows, {
    columns: {
      0: { width: 40, wrapWord: true },
      1: { width: 15, wrapWord: true },
      2: { width: 30, wrapWord: true },
    },
  });

  return pagesList;
}

/**
 * Helper function to get a flat list of pages recursively
 *
 * @param {string} baseDir - Base directory to scan
 * @param {string} [prefix=""] - Path prefix for recursive calls
 * @returns {Promise<Array>} Array of page objects
 */
async function listPagesRecursive(baseDir, prefix = "") {
  const entries = await fs.readdir(baseDir, { withFileTypes: true });
  let pages = [];

  for (const entry of entries) {
    // Skip special folders and hidden files
    if (entry.name.startsWith("@") || entry.name.startsWith(".")) {
      continue;
    }

    const entryPath = path.join(baseDir, entry.name);

    if (entry.isDirectory()) {
      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;

      // Check if this is a page (has page.yml)
      const pageConfigPath = path.join(entryPath, "page.yml");
      let title = entry.name;

      if (await fileExists(pageConfigPath)) {
        try {
          const pageConfig = await readYamlFile(pageConfigPath);
          title = pageConfig.title || entry.name;

          pages.push({
            path: relPath,
            title: title,
            directory: entryPath,
          });
        } catch (error) {
          // If we can't read the config, still list the page with default title
          pages.push({
            path: relPath,
            title: entry.name,
            directory: entryPath,
            error: "Could not read page configuration",
          });
        }
      }

      // Recursively scan subdirectories
      const subPages = await listPagesRecursive(entryPath, relPath);
      pages = pages.concat(subPages);
    }
  }

  return pages;
}
