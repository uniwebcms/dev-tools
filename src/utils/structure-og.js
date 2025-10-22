import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";
import { existsSync } from "fs";
import { Site, Page, Section } from "./types";

/**
 * Manages page structure using structure.yml files
 */
export class StructManager {
  /**
   * Create a new StructManager
   * @param {Site} site - Base path for the site content
   */
  constructor(site) {
    this.site = site;
    //this.basePath = basePath;
  }

  /**
   * Get the full path to a page directory
   * @param {string} pagePath - The page path
   * @returns {string} Full filesystem path
   */
  getPageDir(pagePath) {
    return path.join(this.basePath, pagePath);
  }

  /**
   * Get the structure file path for a page
   * @param {string} pagePath - The page path
   * @returns {string} Path to the structure.yml file
   */
  getStructureFilePath(pagePath) {
    return path.join(this.getPageDir(pagePath), "structure.yml");
  }

  /**
   * Check if a structure file exists for a page
   * @param {string} pagePath - The page path
   * @returns {Promise<boolean>} True if the structure file exists
   */
  async hasStructureFile(pagePath) {
    const structurePath = this.getStructureFilePath(pagePath);
    try {
      await fs.access(structurePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Load the structure for a page
   * @param {string} pagePath - The page path
   * @returns {Promise<Array>} The page structure
   */
  async loadStructure(pagePath) {
    const structurePath = this.getStructureFilePath(pagePath);

    // If structure file doesn't exist, try to infer from available sections
    if (!existsSync(structurePath)) {
      return this.inferStructure(pagePath);
    }

    try {
      const content = await fs.readFile(structurePath, "utf8");
      return yaml.load(content) || [];
    } catch (error) {
      if (error.code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  /**
   * Save the structure for a page
   * @param {string} pagePath - The page path
   * @param {Array} structure - The page structure
   * @returns {Promise<void>}
   */
  async saveStructure(pagePath, structure) {
    const structurePath = this.getStructureFilePath(pagePath);
    const content = yaml.dump(structure);

    // Ensure the directory exists
    const dir = path.dirname(structurePath);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(structurePath, content, "utf8");
  }

  /**
   * Infer structure from existing markdown files
   * @param {string} pagePath - The page path
   * @returns {Promise<Array>} Inferred structure
   */
  async inferStructure(pagePath) {
    const pageDir = this.getPageDir(pagePath);

    try {
      const files = await fs.readdir(pageDir);

      // Get markdown files (excluding structure.yml)
      const sections = files
        .filter((file) => file.endsWith(".md"))
        .map((file) => file.replace(/\.md$/, ""));

      return sections;
    } catch (error) {
      if (error.code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  /**
   * Find the index of a section in a structure
   * @param {Array} structure - The page structure
   * @param {string} sectionName - The section to find
   * @returns {object|null} Information about the section location
   */
  findSectionPosition(structure, sectionName) {
    // Helper function to search the structure
    const search = (items, path = []) => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // Handle string items
        if (typeof item === "string") {
          if (item === sectionName) {
            return { parent: items, index: i, path };
          }
          continue;
        }

        // Handle object items (with children)
        for (const [key, value] of Object.entries(item)) {
          if (key === sectionName) {
            return { parent: items, index: i, path };
          }

          // Recursively search children
          const result = search(value, [...path, key]);
          if (result) return result;
        }
      }

      return null;
    };

    return search(structure);
  }

  /**
   * Add a section to a page
   * @param {string} pagePath - The page path
   * @param {string} sectionName - The section to add
   * @param {object} options - Options for positioning
   * @returns {Promise<object>} Result of the operation
   */
  async addSection(pagePath, sectionName, options = {}) {
    const page = this.site.getPage(pagePath);
    const section = page.getSection(sectionName, options.parent);

    // Load the current structure
    const structure = await this.loadStructure(pagePath);

    // Determine where to add the section
    let targetPath = "";
    let targetArray = structure;

    // If a parent is specified, find it in the structure
    if (options.parent) {
      const pathParts = options.parent.split("/");

      // Navigate to the parent location
      let current = structure;
      let currentPath = [];

      for (const part of pathParts) {
        currentPath.push(part);

        // Find the parent section
        const position = this.findSectionPosition(current, part);
        if (!position) {
          throw new Error(
            `Parent section "${part}" not found in path "${currentPath.join(
              "/"
            )}"`
          );
        }

        // Get the children array of this parent
        const parentItem = position.parent[position.index];

        // If it's a string, convert to object with empty children
        if (typeof parentItem === "string") {
          position.parent[position.index] = { [parentItem]: [] };
          current = position.parent[position.index][parentItem];
        } else {
          // It's already an object, get its children
          const key = Object.keys(parentItem)[0];
          current = parentItem[key];
        }
      }

      targetArray = current;
      targetPath = options.parent;
    }

    // Check for position options
    if (options.before || options.after) {
      const refSection = options.before || options.after;
      const refIndex = targetArray.findIndex((item) => {
        if (typeof item === "string") return item === refSection;
        return Object.keys(item)[0] === refSection;
      });

      if (refIndex === -1) {
        throw new Error(`Reference section "${refSection}" not found`);
      }

      // Insert at the appropriate position
      const insertIndex = options.after ? refIndex + 1 : refIndex;
      targetArray.splice(insertIndex, 0, sectionName);
    } else {
      // Default: add to the end
      targetArray.push(sectionName);
    }

    // Save the updated structure
    await this.saveStructure(pagePath, structure);

    // return {
    //   added: sectionName,
    //   to: pagePath + (targetPath ? `/${targetPath}` : ""),
    // };
    const fullName = targetPath ? `${targetPath}/${sectionName}` : sectionName;
    return new Section(fullName, pagePath, this.site);
  }

  /**
   * Remove a section from a page
   * @param {string} pagePath - The page path
   * @param {string} sectionName - The section to remove
   * @param {object} options - Options for removal
   * @returns {Promise<object>} Result of the operation
   */
  async removeSection(pagePath, sectionName, options = {}) {
    // Load the current structure
    const structure = await this.loadStructure(pagePath);

    // Find the section
    const position = this.findSectionPosition(structure, sectionName);
    if (!position) {
      throw new Error(
        `Section "${sectionName}" not found in page "${pagePath}"`
      );
    }

    // Remove the section
    position.parent.splice(position.index, 1);

    // Save the updated structure
    await this.saveStructure(pagePath, structure);

    return {
      removed: sectionName,
      from: pagePath,
    };
  }

  /**
   * Move a section within a page or to another page
   * @param {string} sourcePage - Source page path
   * @param {string} sectionName - The section to move
   * @param {object} options - Options for the move
   * @returns {Promise<object>} Result of the operation
   */
  async moveSection(sourcePage, sectionName, options = {}) {
    // Determine target page
    const targetPage = options.to || sourcePage;

    // Load the source structure
    const sourceStructure = await this.loadStructure(sourcePage);

    // Find the section in the source
    const position = this.findSectionPosition(sourceStructure, sectionName);
    if (!position) {
      throw new Error(
        `Section "${sectionName}" not found in page "${sourcePage}"`
      );
    }

    // Get the section with its children
    const section = position.parent[position.index];

    // Remove from source
    position.parent.splice(position.index, 1);
    await this.saveStructure(sourcePage, sourceStructure);

    // If moving to another page
    if (targetPage !== sourcePage) {
      // Check if section file exists
      const sectionPath = path.join(
        this.getPageDir(sourcePage),
        `${sectionName}.md`
      );

      if (existsSync(sectionPath)) {
        // Move the file
        const content = await fs.readFile(sectionPath, "utf8");
        const targetPath = path.join(
          this.getPageDir(targetPage),
          `${sectionName}.md`
        );

        // Ensure target directory exists
        await fs.mkdir(path.dirname(targetPath), { recursive: true });

        // Write content to new location
        await fs.writeFile(targetPath, content, "utf8");

        // Delete the original file
        await fs.unlink(sectionPath);
      }
    }

    // Add to target (with positioning)
    const addOptions = {};
    if (options.before) addOptions.before = options.before;
    if (options.after) addOptions.after = options.after;
    if (options.parent) addOptions.parent = options.parent;

    // Load target structure (might have changed if same as source)
    const targetStructure = await this.loadStructure(targetPage);

    // Add the section to the target
    let targetArray = targetStructure;

    // If a parent is specified, find it
    if (options.parent) {
      const pathParts = options.parent.split("/");

      // Navigate to the parent location
      let current = targetStructure;
      let currentPath = [];

      for (const part of pathParts) {
        currentPath.push(part);

        // Find the parent section
        const position = this.findSectionPosition(current, part);
        if (!position) {
          throw new Error(
            `Parent section "${part}" not found in path "${currentPath.join(
              "/"
            )}"`
          );
        }

        // Get the children array of this parent
        const parentItem = position.parent[position.index];

        // If it's a string, convert to object with empty children
        if (typeof parentItem === "string") {
          position.parent[position.index] = { [parentItem]: [] };
          current = position.parent[position.index][parentItem];
        } else {
          // It's already an object, get its children
          const key = Object.keys(parentItem)[0];
          current = parentItem[key];
        }
      }

      targetArray = current;
    }

    // Determine insert position
    let insertIndex = targetArray.length; // Default to end

    if (options.before || options.after) {
      const refSection = options.before || options.after;
      const refIndex = targetArray.findIndex((item) => {
        if (typeof item === "string") return item === refSection;
        return Object.keys(item)[0] === refSection;
      });

      if (refIndex === -1) {
        throw new Error(
          `Reference section "${refSection}" not found in target`
        );
      }

      insertIndex = options.after ? refIndex + 1 : refIndex;
    }

    // Insert the section
    targetArray.splice(insertIndex, 0, section);

    // Save the target structure
    await this.saveStructure(targetPage, targetStructure);

    return {
      moved: sectionName,
      from: sourcePage,
      to: targetPage,
    };
  }

  /**
   * Get all sections for a page in structured order
   * @param {string} pagePath - The page path
   * @returns {Promise<Array>} Ordered sections with hierarchy
   */
  async getSections(pagePath) {
    return this.loadStructure(pagePath);
  }

  /**
   * Get a flat list of all section names for a page
   * @param {string} pagePath - The page path
   * @returns {Promise<Array<string>>} Flat list of section names
   */
  async getFlatSectionList(pagePath) {
    const structure = await this.loadStructure(pagePath);
    const sections = [];

    // Helper function to flatten the structure
    const flatten = (items) => {
      for (const item of items) {
        if (typeof item === "string") {
          sections.push(item);
        } else {
          // It's an object with children
          const key = Object.keys(item)[0];
          sections.push(key);
          flatten(item[key]);
        }
      }
    };

    flatten(structure);
    return sections;
  }
}
