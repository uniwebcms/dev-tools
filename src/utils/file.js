import fs from "fs/promises";
import path from "path";
import { Project, Module, Component, Site, Page, Section } from "./types.js";
import { URL } from "url";
import yaml from "js-yaml";

/**
 * Special key used for files when a directory has both files and subdirectories
 * You can change this to any other special character like "@", ":", "~", etc.
 */
const FILES_KEY = "*";

/**
 * Default patterns to ignore
 */
const DEFAULT_IGNORE = [
  "node_modules",
  ".git",
  ".yarn",
  ".DS_Store",
  "build_dev",
  "dist",
];

export function normalizePath(pagePath) {
  // Normalize the path using platform-specific separator
  pagePath = path.normalize(pagePath);

  // Convert to forward slashes for consistency
  pagePath = pagePath.replace(/\\/g, "/");

  // Split into segments (filter empty, eg from trailing /)
  const segments = pagePath.split("/").filter((s) => s !== "");

  // Check for parent '..' and hidden files/folders (starting with a dot)
  if (segments.findIndex((segment) => segment.startsWith(".")) !== -1) {
    throw new Error(`Path segments cannot start with '.': ${pagePath}`);
  }

  const encoded = segments.map((segment) => encodeURIComponent(segment));

  return { filePath: segments.join(path.sep), urlPath: encoded.join("/") };
}

export function isValidUrlPath(pathString) {
  try {
    // Create a dummy base URL and append the path
    const url = new URL(pathString, "http://x.com");

    // Check if the resulting pathname matches the original path
    // This will tell us if any character escaping happened
    return url.pathname === pathString;
  } catch (error) {
    return false;
  }
}

function validateUrlPath(pathString) {
  // Check for empty path
  if (!pathString || pathString.trim() === "") {
    return { valid: false, message: "Path cannot be empty" };
  }

  try {
    // Create a URL with the path
    const url = new URL(pathString, "http://x.com");

    // Check if the path was modified in the URL
    if (url.pathname !== pathString) {
      // Find which characters caused the issue
      const problematicChars = [];
      for (let i = 0; i < pathString.length; i++) {
        const char = pathString[i];
        // Check if this character is encoded in the URL pathname
        if (!url.pathname.includes(char) && char !== " ") {
          problematicChars.push(char);
        }
      }

      if (pathString.includes(" ")) {
        return {
          valid: false,
          message:
            "Path contains spaces which would be encoded in URLs. Use hyphens or underscores instead.",
        };
      }

      if (problematicChars.length > 0) {
        return {
          valid: false,
          message: `Path contains characters that would be encoded in URLs: ${problematicChars.join(
            " "
          )}. Use only URL-safe characters.`,
        };
      }

      return {
        valid: false,
        message:
          "Path contains characters that would be encoded in URLs. Use only URL-safe characters.",
      };
    }

    // Check for reserved characters or patterns that could cause issues
    if (pathString.includes("?") || pathString.includes("#")) {
      return {
        valid: false,
        message:
          "Path contains query parameters ('?') or fragment identifiers ('#') which are not allowed in directory names.",
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      message: `Invalid path: ${error.message}`,
    };
  }
}

/**
 * Create a new page directory
 * @param {Page} page - The page information
 * @returns {Promise<string>} Path to the created directory
 */
export async function createPageDirectory(page) {
  await ensureDirectory(page.dirPath);
  return page.dirPath;
}

// export async function loadPageStructure(page) {
//   const filePath = path.join(
//     page.site.path,
//     "pages",
//     page.path,
//     "structure.yml"
//   );

//   return path.join(this.page.dirPath, "structure.yml");
// }

/**
 * Create a new section file
 * @param {Section} section - The section information
 * @returns {Promise<string>} Path to the created file
 */
export async function createSectionFile(section, content = "") {
  const dirPath = await createPageDirectory(section.page);
  const filePath = path.join(dirPath, `${section.name}.md`);

  if (await fileExists(filePath)) {
    throw new Error(
      `Section ${section.name} already exists in ${section.page.path}`
    );
  }

  await fs.writeFile(filePath, content, "utf8");
  return filePath;
}

export async function resolveProject() {
  return new Project(await findProjectRoot());
}

export async function resolveModule(moduleName) {
  const project = await resolveProject();

  if (!moduleName) {
    const currentPath = process.cwd();

    const relativePath = currentPath.startsWith(project.modulesDir)
      ? path.relative(project.modulesDir, currentPath)
      : "";

    const segments = relativePath.split(path.sep).filter(Boolean);

    if (segments.length > 0) {
      moduleName = segments[0];
    } else {
      const modules = await project.listModules();

      if (modules.length === 1) {
        moduleName = modules[0];
      } else {
        throw new Error(
          `Cannot determine module name. ${modules.length} modules available.`
        );
      }
    }
  }

  return new Module(moduleName, project);
}

export async function resolveComponent(componentName, moduleName) {
  const module = await resolveModule(moduleName);

  if (!componentName) {
    const currentPath = process.cwd();

    const relativePath = currentPath.startsWith(module.componentsDir)
      ? path.relative(module.componentsDir, currentPath)
      : "";

    const segments = relativePath.split(path.sep).filter(Boolean);

    if (segments.length > 0) {
      componentName = segments[0];
    } else {
      throw new Error(
        "Cannot determine component name. Please specify it explicitly."
      );
    }
  }

  return new Component(componentName, module);
}

/**
 * Finds the root directory of a project by searching for a config file
 * @returns {Promise<string|null>} Absolute path to the project root or null if not found
 */
async function findProjectRoot() {
  // Start from the current working directory
  let currentDir = process.cwd();

  // Config files to look for
  const configFiles = ["uniweb.config.js", "uniweb.config.json"];

  // Keep going up until we find a config file or hit the filesystem root
  while (true) {
    // Check if any of the config files exist in the current directory
    for (const configFile of configFiles) {
      const configPath = path.join(currentDir, configFile);
      try {
        await fs.access(configPath);
        // If we reach here, the file exists
        return currentDir;
      } catch (error) {
        // File doesn't exist, continue checking
      }
    }

    // Move to the parent directory
    const parentDir = path.dirname(currentDir);

    // If we've reached the root of the filesystem, stop searching
    if (parentDir === currentDir) {
      throw new Error(`Cannot find project file from ${process.cwd()}`);
      // throw new Error("Not inside a valid project folder.");
    }

    // Continue with the parent directory
    currentDir = parentDir;
  }
}

/**
 * Resolves and validates a path to ensure it stays within project boundaries
 * @param {string} pagePath - The path to resolve and validate
 * @param {string} siteName - The name of the site. Use "/" for root site.
 * @returns {Promise<string>} The resolved absolute path if valid
 * @throws {Error} If the path is invalid or goes outside project boundaries
 */
export async function resolvePagePath(pagePath, siteName) {
  // Find the project root directory
  const project = await resolveProject();

  let basePath;

  // Check if the path starts with "./" or "../" - relative to CWD
  if (pagePath.startsWith("./") || pagePath.startsWith("../")) {
    basePath = process.cwd();
  }
  // Check if it's an absolute path
  else if (path.isAbsolute(pagePath)) {
    throw new Error(
      "Absolute paths are not allowed. Use paths relative to project root or current directory."
    );
  }
  // Otherwise, interpret as relative to project root
  else {
    basePath =
      siteName === "/"
        ? path.join(project.path, "pages")
        : path.join(project.sitesDir, siteName, "pages");

    if (!(await isDirectory(basePath))) {
      throw new Error(`The path '${basePath}' is not a directory`);
    }
  }

  // Resolve the full path
  const resolvedPath = path.resolve(basePath, pagePath);

  if (!(await isDirectory(resolvedPath))) {
    throw new Error(`Path is not directory: ${resolvedPath}`);
  }

  // Ensure the resolved path stays within the project root
  if (!resolvedPath.startsWith(projectRoot)) {
    throw new Error("Path is outside the project directory.");
  }

  return resolvedPath;
}

/**
 * Checks if a file or directory exists
 *
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>} True if the file or directory exists
 */
export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

export async function isDirectory(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.isDirectory();
  } catch (error) {
    // if (err.code === "ENOENT") {
    //   return "not found";
    // }
    return false;
  }
}

/**
 * Ensures a directory exists, creating it and any parents if necessary
 *
 * @param {string} dirPath - Directory path to ensure
 * @returns {Promise<void>}
 */
export async function ensureDirectory(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Ignore if directory already exists
    if (error.code !== "EEXIST") {
      throw error;
    }
  }
}

/**
 * Writes an object to a JSON file
 *
 * @param {string} filePath - Path to write to
 * @param {Object} data - Data to write
 * @returns {Promise<void>}
 */
export async function writeJsonFile(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

/**
 * Reads a JSON file into an object
 *
 * @param {string} filePath - Path to read from
 * @returns {Promise<Object>} Parsed JSON object
 */
export async function readJsonFile(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

/**
 * Reads a YAML file into an object
 * Note: In a real implementation, you would use a proper YAML library
 * This is a simplified version for demonstration
 *
 * @param {string} filePath - Path to read from
 * @returns {Promise<Object>} Parsed YAML object
 */
export async function readYamlFile(filePath) {
  if (!(await fileExists(filePath))) {
    return {};
  }

  const content = await fs.readFile(filePath, "utf8");

  return yaml.load(content);

  // // Very simplified YAML parsing (not suitable for production)
  // const result = {};
  // const lines = content.split("\n");

  // for (const line of lines) {
  //   const trimmed = line.trim();
  //   if (!trimmed || trimmed.startsWith("#")) continue;

  //   const colonIndex = trimmed.indexOf(":");
  //   if (colonIndex > 0) {
  //     const key = trimmed.substring(0, colonIndex).trim();
  //     const value = trimmed.substring(colonIndex + 1).trim();
  //     result[key] = value;
  //   }
  // }

  // return result;
}

/**
 * Writes an object to a YAML file
 * Note: In a real implementation, you would use a proper YAML library
 *
 * @param {string} filePath - Path to write to
 * @param {Object|string} data - Data to write
 * @returns {Promise<void>}
 */
export async function writeYamlFile(filePath, data) {
  // let content = "";

  // for (const [key, value] of Object.entries(data)) {
  //   if (
  //     typeof value === "string" ||
  //     typeof value === "number" ||
  //     typeof value === "boolean"
  //   ) {
  //     content += `${key}: ${value}\n`;
  //   } else if (value === null || value === undefined) {
  //     content += `${key}:\n`;
  //   } else if (Array.isArray(value)) {
  //     content += `${key}:\n`;
  //     value.forEach((item) => {
  //       content += `  - ${item}\n`;
  //     });
  //   } else if (typeof value === "object") {
  //     content += `${key}:\n`;
  //     for (const [subKey, subValue] of Object.entries(value)) {
  //       content += `  ${subKey}: ${subValue}\n`;
  //     }
  //   }
  // }
  const content = typeof data === "string" ? data : yaml.dump(data);

  await fs.writeFile(filePath, content, "utf8");
}

/**
 * Gets a list of directories within a directory
 *
 * @param {string} dirPath - Directory to list from
 * @returns {Promise<string[]>} Array of directory names
 */
export async function getDirectories(dirPath) {
  if (!(await isDirectory(dirPath))) return [];

  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

/**
 * Check if a given path is a valid site directory.
 * A valid site has a `pages/` directory and a `site.yml` file.
 *
 * @param {string} sitePath - Absolute path to the potential site folder.
 * @returns {Promise<boolean>} - Whether the site is valid.
 */
export async function isValidSite(sitePath) {
  const pagesPath = path.join(sitePath, "pages");
  const siteYmlPath = path.join(sitePath, "site.yml");
  try {
    const [pagesStat, siteYmlStat] = await Promise.all([
      fs.stat(pagesPath),
      fs.stat(siteYmlPath),
    ]);
    return pagesStat.isDirectory() && siteYmlStat.isFile();
  } catch {
    return false;
  }
}

async function resolveSitePath(siteName) {
  const project = await resolveProject();

  // Validate name
  if (!siteName || typeof siteName !== "string") {
    throw new Error("Site name must be a non-empty string");
  }

  if (siteName === "root" || siteName === "/") {
    return project.path;
  }

  if (/^[a-zA-Z0-9_-]+$/.test(siteName)) {
    return path.join(project.sitesDir, siteName);
  }

  throw new Error(
    "Site name can only contain letters, numbers, hyphens, and underscores"
  );
}

/**
 * Validate that a given site name refers to a valid site in the project.
 * Accepts '/' or 'root' to refer to the root site.
 *
 * @param {string} siteName - Name of the site to validate (e.g., '/', 'root', 'mysite').
 * @returns {Promise<string>} - The normalized site name (e.g., '/').
 * @throws {Error} - If the site is not valid or does not exist.
 */
export async function validateSite(siteName) {
  const project = await resolveProject();
  // if (!projectPath) {
  //   throw new Error("Not inside a valid project folder.");
  // }

  const sitePath = await resolveSitePath(siteName);

  if (await isValidSite(sitePath)) {
    return new Site(siteName, project);
  }

  throw new Error(`Site "${siteName}" not found or invalid.`);
}

/**
 * Attempts to determine the default site based on the current working directory.
 * If CWD is inside a valid site folder, returns its name.
 * If not, and exactly one valid site exists in the project, returns that one.
 * Otherwise, returns null to indicate ambiguity.
 *
 * @returns {Promise<Site>} - The resolved site name (e.g., '/', 'mysite') and path.
 * @throws {Error} - If not inside a valid project folder.
 */
export async function getDefaultSite() {
  const project = await resolveProject();
  const currentPath = process.cwd();
  project.validatePath(currentPath);

  // Check if inside root site
  const rootPagesPath = path.join(project.path, "pages");
  if (currentPath.startsWith(rootPagesPath)) {
    if (await isValidSite(projectPath)) {
      return new Site("/", project);
    }
  }

  // Check if inside a named site
  const sitesPath = project.sitesDir;
  try {
    const entries = await fs.readdir(sitesPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const siteName = entry.name;
      const sitePath = path.join(sitesPath, siteName);
      if (currentPath.startsWith(sitePath)) {
        if (await isValidSite(sitePath)) {
          return new Site(siteName, project);
        }
      }
    }
  } catch {
    // Ignore if no sites folder
  }

  // No match — look for all valid sites
  const validSites = [];

  if (await isValidSite(project.path)) {
    validSites.push(new Site("/", project));
  }

  try {
    const entries = await fs.readdir(sitesPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const siteName = entry.name;
      const sitePath = path.join(sitesPath, siteName);
      if (await isValidSite(sitePath)) {
        validSites.push(new Site(siteName, project));
      }
    }
  } catch {}

  if (validSites.length === 1) {
    return validSites[0];
  } else if (validSites.length > 1) {
    throw new Error(
      "Multiple sites found. Please specify a site using the --site parameter"
    );
  }

  throw new Error("There are no sites in the project");
}

/**
 * Resolves the active site.
 * If a site name is provided, validates and returns it.
 * If no name is provided, falls back to auto-resolution via `getDefaultSite()`.
 *
 * @param {string|null|undefined} siteName - The optional site name to validate.
 * @returns {Promise<Site>} - The resolved site name (e.g., '/', 'mysite') and path.
 */
export async function resolveSite(siteName) {
  if (siteName) {
    return await validateSite(siteName);
  }
  return await getDefaultSite();
}

/**
 * Resolves the active page.
 * If a site name is provided, validates and returns it.
 * If no name is provided, falls back to auto-resolution via `getDefaultSite()`.
 *
 * @param {string|null|undefined} pagePath - The optional page path to validate.
 * @param {string|null|undefined} siteName - The optional site name to validate.
 * @returns {Promise<Page>} - The resolved site name (e.g., '/', 'mysite') and path.
 */
export async function resolvePage(pagePath, siteName) {
  const site = await resolveSite(siteName);
  pagePath ??= "";

  // Check if the path is relative to site.pagesDir instead of the CWD
  if (pagePath.startsWith("/") || pagePath.startsWith("\\")) {
    pagePath = pagePath.slice(1);
  } else {
    // Check if the CWD is within the site path
    const currentPath = process.cwd();

    if (currentPath.startsWith(site.pagesDir)) {
      const relPath = path.relative(site.pagesDir, currentPath);
      pagePath = path.join(relPath, pagePath);
    } else if (!pagePath) {
      throw new Error(`Cannot resolve empty page name`);
    }
  }

  return site.getPage(pagePath);
}

/**
 * Resolves the active page.
 * If a site name is provided, validates and returns it.
 * If no name is provided, falls back to auto-resolution via `getDefaultSite()`.
 *
 * @param {string|null|undefined} sectionName - The name of the section.
 * @param {string|null|undefined} pagePath - Path to the page the section is in.
 * @param {string|null|undefined} siteName - Name of the path the page is in.
 * @returns {Promise<Section>} - The resolved section object.
 */
export async function resolveSection(sectionName, pagePath, siteName) {
  return (await resolvePage(pagePath, siteName)).getSection(sectionName);
}

/**
 * Validates a page path
 *
 * @param {string} pagePath - Page path to validate
 * @returns {string} Validated page path
 */
export function validatePagePath(pagePath) {
  if (!pagePath) {
    throw new Error("Page path is required");
  }

  // Remove leading and trailing slashes
  pagePath = pagePath.replace(/^\/+|\/+$/g, "");

  // Validate path segments
  const segments = pagePath.split("/");
  for (const segment of segments) {
    if (!segment || !/^[a-zA-Z0-9_-]+$/.test(segment)) {
      throw new Error(
        "Page path segments can only contain letters, numbers, hyphens, and underscores"
      );
    }
  }

  return pagePath;
}

export function parseSectionName(sectionName) {
  // Parse section file name
  const match = sectionName.match(/^([0-9.]+)-(.+?)(?:\.md)?$/);
  if (match) {
  }

  return match
    ? { prefix: match[1], name: match[2] }
    : { prefix: "", name: sectionName };
}

/**
 * Parses a section path into its components
 *
 * @param {string} sectionPath - Section path (e.g., "about/1-intro")
 * @returns {Object} Parsed components { pagePath, prefix, name }
 */
export function parseSectionPath(sectionPath) {
  if (!sectionPath) {
    throw new Error("Section path is required");
  }

  // Remove leading and trailing slashes
  sectionPath = sectionPath.replace(/^\/+|\/+$/g, "");

  const lastSlashIndex = sectionPath.lastIndexOf("/");
  if (lastSlashIndex === -1) {
    throw new Error(
      'Invalid section path format. Expected format: "page/prefix-name"'
    );
  }

  const pagePath = sectionPath.substring(0, lastSlashIndex);
  const sectionFile = sectionPath.substring(lastSlashIndex + 1);

  return {
    pagePath: validatePagePath(pagePath),
    ...parseSectionName(sectionFile),
  };
}

/**
 * Checks if a module name is a URL
 *
 * @param {string} module - Module name or URL
 * @returns {boolean} True if the module is a URL
 */
export function isModuleUrl(module) {
  return module.startsWith("http://") || module.startsWith("https://");
}

/**
 * Parses the content, and possibly literal newlines and comma-separated
 * params, and then converts them into a YAML string. It gives preference
 * to JSON parsing the content. If that fails, it tries YAML parsing
 * after converting literal \n and , to real \n characters.
 *
 * @param {any} content - Content string in JSON or YAML format.
 * @returns {string|null} Content string normalized to valid YAML format.
 */
export function parseConfigData(content) {
  let data = content;

  if (typeof content === "string") {
    content = content.trim();
    if (content === "") return null;

    data = parseAsJsonObject(content);

    if (data === null) {
      // Convert literal \n into new lines
      // Replace any `key:value` with `key: value`, only when not already followed by a space
      const processed = content
        .replace(/\\n|,/g, "\n")
        .split("\n")
        .map((line) => line.trim())
        .join("\n")
        .replace(/^(\s*[^:\s]+):(?!\s)/gm, "$1: ");

      try {
        data = yaml.load(processed);
      } catch (_) {
        throw new Error("Config text is not valid JSON or YAML");
      }
    }
  }

  return isPlainObject(data) && Object.keys(data).length > 0 ? data : null;
}

/**
 * Parses the content, and possibly literal newlines and comma-separated
 * params, and then converts them into a YAML string. It gives preference
 * to JSON parsing the content. If that fails, it tries YAML parsing
 * after converting literal \n and , to real \n characters.
 *
 * @param {any} content - Content string in JSON or YAML format.
 * @returns {string} Content string normalized to valid YAML format.
 */
export function normalizeConfigData(content) {
  const data = parseConfigData(content);
  return data ? yaml.dump(data).trim() : "";
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseAsJsonObject(content) {
  try {
    if (!content.startsWith("{")) content = "{" + content + "}";
    return JSON.parse(content);
  } catch (_) {
    return null;
  }
}

async function readConfigFile(filePath) {
  try {
    if (await fileExists(filePath)) {
      const data = await fs.readFile(filePath, "utf8");

      if (filePath.endsWith(".json")) return JSON.parse(data);
      if (filePath.endsWith(".yml")) return yaml.load(data);
      if (filePath.endsWith(".txt")) return data;
    }
  } catch (error) {
    // console.warn(
    //   `Warning: Could not parse config file ${filePath}`,
    //   error
    // );
    throw new Error(
      `Failed to read configuration file ${filePath}: ${error.message}`
    );
  }

  return null;
}

/**
 * Imports a configuration file if it exists.
 *
 * @async
 * @param {string} [configPath] - Path to the configuration file
 * @returns {Promise<object|null>} The configuration module if it exists, null otherwise
 */
export async function loadConfigFile(configPath) {
  if (!configPath.endsWith(".js")) {
    return readConfigFile(configPath);
  }

  try {
    // Dynamic import of the configuration module
    const configModule = await import(configPath);

    // return configModule.default || configModule;
    return {
      ...(configModule.default || {}),
      ...Object.fromEntries(
        Object.entries(configModule).filter(([key]) => key !== "default")
      ),
    };
  } catch (error) {
    if (error.code === "ERR_MODULE_NOT_FOUND") {
      console.log(`Configuration file not found: ${configPath}`);
      return null;
    }
    console.error(`Error loading configuration from ${configPath}:`, error);
    return null;
  }
}

export function normalizeUrl(url) {
  if (!url) return "";
  return new URL(url).toString();
}

export function normalizeName(rawName) {
  if (typeof rawName !== "string" || !rawName.trim()) {
    throw new Error("Name must be a non-empty string.");
  }

  let name = rawName.trim();

  // Step 1: Generate display name
  let displayName = name
    // Replace dashes and underscores with spaces
    .replace(/[-_]+/g, " ")
    // Insert spaces before camelCase or PascalCase capitals
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2") // Handle acronyms
    .replace(/\s+/g, " ") // Remove duplicate spaces
    .trim()
    // Title Case each word
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return displayName;

  // // Step 2: Component name is display name without spaces
  // const componentName = displayName.replace(/\s+/g, "");

  // return {
  //   componentName,
  //   displayName,
  // };
}

export function createDisplayName(variableName) {
  if (typeof variableName !== "string") {
    throw new TypeError("Expected a string");
  }

  return (
    variableName
      // Replace underscores and hyphens with spaces
      .replace(/[_\-]+/g, " ")
      // Split camelCase and PascalCase
      .replace(/([a-z\d])([A-Z])/g, "$1 $2")
      .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, "$1 $2")
      // Remove any extra non-word characters (except spaces)
      .replace(/[^\w\s]/g, "")
      // Collapse multiple spaces into one
      .replace(/\s+/g, " ")
      // Trim whitespace from start and end
      .trim()
      // Title Case
      .replace(
        /\w\S*/g,
        (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
  );
}

/**
 * Scans a directory recursively:
 *
 * 1. If a directory has only files, it's represented as an array of filenames
 * 2. If a directory has subdirectories, it's an object with:
 *    - The "*" key containing an array of files
 *    - Other keys for subdirectories
 *
 * @param {string} dirPath - Path to the directory to scan
 * @param {Object} [options] - Scan options
 * @param {string[]} [options.ignore] - Patterns to ignore (default: node_modules, .git, .DS_Store)
 * @param {number} [options.depth] - Maximum depth to scan (-1 for unlimited, default: -1)
 * @return {Promise<Object|Array>} - The directory structure
 */
export async function scanDirectory(dirPath, options = {}) {
  const {
    ignore = DEFAULT_IGNORE,
    depth = -1, // -1 means unlimited depth
  } = options;

  // Stop recursion if maximum depth is reached
  if (depth === 0) {
    return []; // Return empty array to indicate it has files but we're not scanning them
  }
  try {
    // Read all entries in the directory
    const entries = await fs.readdir(dirPath);

    // Arrays to collect files and subdirectory results
    const files = [];
    const subdirs = {};
    let hasSubdirs = false;

    // Process each entry
    await Promise.all(
      entries.map(async (entry) => {
        // Skip ignored entries
        if (ignore.includes(entry)) {
          return;
        }

        const entryPath = path.join(dirPath, entry);

        try {
          const entryStat = await fs.stat(entryPath);

          if (entryStat.isFile()) {
            // Add the file to the files array
            files.push(entry);
          } else if (entryStat.isDirectory()) {
            // Recursively scan subdirectory with adjusted depth
            const nextDepth = depth === -1 ? -1 : depth - 1;
            const dirContent = await scanDirectory(entryPath, {
              ignore,
              depth: nextDepth,
            });
            subdirs[entry] = dirContent;
            hasSubdirs = true;
          }
          // Ignore other types (symlinks, etc.)
        } catch (error) {
          // Skip entries that can't be accessed
          console.error(`Error accessing ${entryPath}: ${error.message}`);
        }
      })
    );

    // If there are no subdirectories, return just the files array
    if (!hasSubdirs) {
      return files;
    }

    // Otherwise, create an object with files and subdirectories
    const result = { ...subdirs };

    // Only add the files array if there are files
    if (files.length > 0) {
      result[FILES_KEY] = files;
    }

    return result;
  } catch (error) {
    throw new Error(`Error scanning directory ${dirPath}: ${error.message}`);
  }
}
