import path from "path";
import { existsSync } from "fs";
import {
  normalizePath,
  loadConfigFile,
  getDirectories,
  fileExists,
  isDirectory,
} from "./file.js";
import { TreeStructure } from "./tree-structure.js";
import { parseEnvFile } from "./env-parser.js";

export class Project {
  #config;

  /**
   * Creates a Project object.
   * @param {string} projectPath - Absolute path to the project.
   */
  constructor(projectPath) {
    if (!path.isAbsolute(projectPath)) {
      throw new Error("Project path must be absolute.");
    }
    this.path = projectPath;
    this.name = path.basename(this.path);
    this.sitesDir = path.join(this.path, "sites");
    this.modulesDir = path.join(this.path, "src");
  }
  isPathInProject(filePath) {
    return filePath && filePath.startsWith(this.path);
  }
  validatePath(filePath) {
    if (!this.isPathInProject(filePath)) {
      throw new Error("Path is outside the project");
    }
  }
  async loadConfig() {
    if (!this.#config) {
      const packagePath = path.join(this.path, "package.json");
      const configPath = path.join(this.path, "uniweb.config.js");
      const envPath = path.join(this.path, ".env");

      const pkg = await loadConfigFile(packagePath);
      const config = await loadConfigFile(configPath);
      const env = await parseEnvFile(envPath, {
        interpolate: true,
        defaults: config,
      });

      this.#config = { ...pkg, ...config, ...env };

      this.#config.packageManager ||= await this.#detectPackageManager();
      this.#config.packageManager = this.#config.packageManager.split("@")[0];
    }
    return this.#config;
  }
  async #detectPackageManager() {
    const locks = [
      ["yarn", "yarn.lock"],
      ["npm", "package-lock.json"],
      ["pnpm", "pnpm-lock.yaml"],
      ["bun", "bun.lockb"],
    ];

    for (const [pm, file] of locks) {
      if (await fileExists(path.join(this.path, file))) return pm;
    }
    return "";
  }
  /**
   * List local modules
   * @returns {Promise<Array>}
   */
  async listModules() {
    return (await getDirectories(this.modulesDir)).filter((entry) =>
      fileExists(path.join(this.modulesDir, entry, "package.json"))
    );
  }
  /**
   * Check if there are local modules
   * @returns {Promise<boolean>}
   */
  async hasModules() {
    return (await this.listModules()).length > 0;
  }
}

export class Site {
  /**
   * Creates a Site object.
   * @param {string} siteName - Site identifier.
   * @param {Project} project - A project object.
   */
  constructor(siteName, project) {
    if (siteName === "/") {
      this.path = project.path;
    } else if (!siteName || /[./\\]/.test(siteName)) {
      throw new Error(`Invalid site name '${siteName}'`);
    } else {
      this.path = path.join(project.sitesDir, siteName);
    }

    this.project = project;
    this.name = siteName;
    this.pagesDir = path.join(this.path, "pages");
    this.langDir = path.join(this.path, "languages");
  }
  getPage(pagePath) {
    return new Page(pagePath, this);
  }
  async loadConfig() {
    return loadConfigFile(path.join(this.path, "site.yml"));
  }
  async loadTheme() {
    return loadConfigFile(path.join(this.path, "theme.yml"));
  }
  toString() {
    return this.name;
  }
}

export class Page {
  #config;
  // #structure;
  constructor(pagePath, site) {
    pagePath = normalizePath(pagePath);

    this.site = site;
    this.path = pagePath.filePath;
    this.route = pagePath.urlPath;

    // Set the absolute path to the page directory
    this.dirPath = path.join(site.pagesDir, this.path);
    // this.#structure = new TreeStructure(path.join(this.dirPath, "page.yml"));
  }
  // get structure() {
  //   return this.#structure;
  // }
  async exists() {
    // return existsSync(this.dirPath);
    return isDirectory(this.dirPath);
  }
  // hasStructure() {
  //   return existsSync(this.#structure.filePath);
  // }
  async loadConfig() {
    this.#config ??= await loadConfigFile(path.join(this.dirPath, "page.yml"));
    // this.#structure.initStructure(this.#config?.sections);
    return this.#config || {};
  }
  // /**
  //  * Leads the section structure.
  //  * @returns {Promise<TreeStructure>}
  //  */
  // async loadStructure() {
  //   const structure = new TreeStructure(path.join(this.dirPath, "page.yml"));
  //   await structure.loadStructure();
  //   return structure;
  // }
  // async saveStructure() {
  //   await this.#structure.saveStructure();
  //   return this.#structure;
  // }
  getSection(sectionName) {
    return new Section(sectionName, this);
  }
  getLangPath(lang) {
    return path.join(this.site.langDir, lang, this.path);
  }
  toString() {
    return this.dirPath;
  }
  initSections(sections) {
    return Array.isArray(sections)
      ? sections.map((entry) => this.#parseSectionTree(entry))
      : [];
  }
  #parseSectionTree(entry) {
    if (typeof entry === "string") {
      return new Section(entry, this);
    }

    if (typeof entry === "object" && entry !== null) {
      const [key, value] = Object.entries(entry)[0];
      const node = new Section(key, this);

      if (Array.isArray(value)) {
        node.subsections = value.map((child) => this.parseSectionTree(child));
      } else if (typeof value === "object") {
        node.subsections = Object.entries(value).map(([k, v]) =>
          this.parseSectionTree({ [k]: v })
        );
      }

      return node;
    }

    throw new Error("Invalid structure entry");
  }
}

export class Section {
  constructor(name, page) {
    let filename;

    if (name.endsWith(".md")) {
      filename = name;
      name = name.slice(0, -3);
    } else {
      filename = name + ".md";
    }

    this.name = name;
    this.page = page;
    this.id = encodeURIComponent(name);
    this.filePath = path.join(this.page.dirPath, filename);
    this.relPath = path.join(this.page.path, filename);
    this.subsections = [];
  }
  // addSubsection(section) {
  //   this.subsections.push(section);
  // }
  getLangPath(lang) {
    return path.join(
      this.page.site.langDir,
      lang,
      this.page.path,
      this.name + ".md"
    );
  }
  toString() {
    return this.name;
  }
}

export class Module {
  /**
   * Creates a Module object.
   * @param {string} moduleName - Module identifier.
   * @param {Project} project - A project object.
   */
  constructor(moduleName, project) {
    if (moduleName.startsWith("http://") || moduleName.startsWith("https://")) {
      this.name = moduleName;
      this.url = moduleName;
      this.path = null;
    } else if (moduleName && !/[./\\]/.test(moduleName)) {
      this.name = moduleName;
      this.path = path.join(project.modulesDir, moduleName);
      this.url = null;
    } else {
      throw new Error(`Invalid module name '${moduleName}'`);
    }
    this.project = project;
    this.componentsDir = this.path ? path.join(this.path, "components") : null;
  }
  async exists() {
    if (this.isRemote()) return false;
    return fileExists(this.path);
  }
  async validateExists() {
    if (!(await this.exists())) {
      throw new Error(`The module '${this.name}' does not exist`);
    }
  }
  isRemote() {
    return !!this.url;
  }
  getComponent(componentPath) {
    return new Component(componentPath, this);
  }
  toString() {
    return this.name;
  }
  async loadConfig() {
    if (this.isRemote()) {
      return (await this.loadSchema())?._self;
    } else {
      const config = await loadConfigFile(path.join(this.path, "package.json"));
      return {
        name: this.name,
        version: config.version || "",
        description: config.description || "",
      };
    }
  }
  /**
   * Load schema from file or URL
   * @param {String} source - Path or URL to schema
   * @returns {Promise<Object>} Schema object
   */
  async loadSchema() {
    let schema = {};

    if (this.isRemote()) {
      let response = await fetch(`${this.url}/latest_version.txt`);
      const version = await response.text();
      response = await fetch(`${this.url}/${version}/schema.json`);
      schema = await response.json();
    } else {
      const folders = await getDirectories(this.componentsDir);

      for (const name of folders) {
        const configPath = path.join(
          this.componentsDir,
          name,
          `component.config.js`
        );
        if (await fileExists(configPath)) {
          schema[name] = await loadConfigFile(configPath);
        }
      }
    }

    // Normalize the structure
    for (const [key, value] of Object.entries(schema)) {
      value.name = key;
      value.parameters ??= value.Parameters || value.properties || {};
      value.presets ??= [];
    }

    return schema;
  }
}

export class Component {
  constructor(componentName, module) {
    if (!componentName || /[./\\]/.test(componentName)) {
      throw new Error(`Invalid component name '${componentName}'`);
    }

    this.module = module;
    this.name = componentName;
    this.path = path.join(module.componentsDir, componentName);
  }
  toString() {
    return this.name;
  }
  async loadConfig() {
    const schema = await this.module.loadSchema();

    for (const name in schema) {
      if (name === this.name) return schema[name];
    }

    return {};

    // return Object.values(schema).find((item) => item.name === this.name);
  }
}
