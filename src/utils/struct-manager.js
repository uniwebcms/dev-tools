import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";
import { existsSync } from "fs";
import { Page, Section } from "./types.js";
import { createSectionFile, ensureDirectory, fileExists } from "./file.js";
import { removeSectionTranslations } from "./lang-sync.js";
import { TreeStructure } from "./tree-structure.js";

const DEFAULT_SECTION_CONTENT = `---
component: 
---
`;

/**
 * Manages page structure using structure.yml files
 */
export class StructManager {
  /**
   * Create a new StructManager
   * @param {Page} page - The page to manage.
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Get the structure file path
   * @returns {string} Path to the structure.yml file
   */
  getStructureFilePath() {
    return path.join(this.page.dirPath, "page.yml");
  }

  /**
   * Check if a structure file exists
   * @returns {Promise<boolean>} True if the structure file exists
   */
  async hasStructureFile() {
    const structurePath = this.getStructureFilePath();
    try {
      await fs.access(structurePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Load the structure
   * @returns {Promise<Array>} The page structure
   */
  async loadStructure() {
    const structure = new TreeStructure();

    structure.load(this.getStructureFilePath());

    return structure;

    // const structurePath = this.getStructureFilePath();

    // // If structure file doesn't exist, try to infer from available sections
    // if (!existsSync(structurePath)) {
    //   return this.inferStructure();
    // }

    // try {
    //   const content = await fs.readFile(structurePath, "utf8");
    //   return yaml.load(content) || [];
    // } catch (error) {
    //   if (error.code === "ENOENT") {
    //     return [];
    //   }
    //   throw error;
    // }
  }

  /**
   * Save the structure
   * @param {Array} structure - The page structure
   * @returns {Promise<void>}
   */
  async saveStructure(structure) {
    structure.save(this.getStructureFilePath());
    // const structurePath = this.getStructureFilePath();
    // const content = yaml.dump(structure);

    // // Ensure the directory exists
    // const dir = path.dirname(structurePath);
    // await fs.mkdir(dir, { recursive: true });

    // await fs.writeFile(structurePath, content, "utf8");
  }

  // /**
  //  * Infer structure from existing markdown files
  //  * @returns {Promise<Array>} Inferred structure
  //  */
  // async inferStructure() {
  //   try {
  //     const files = await fs.readdir(this.page.dirPath);

  //     // Get markdown files (excluding structure.yml)
  //     const sections = files
  //       .filter((file) => file.endsWith(".md"))
  //       .map((file) => file.replace(/\.md$/, ""));

  //     return sections;
  //   } catch (error) {
  //     if (error.code === "ENOENT") {
  //       return [];
  //     }
  //     throw error;
  //   }
  // }

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

  findParentStructure(structure, parentPath) {
    const pathParts = parentPath.split("/");

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

    return current;
  }

  findPosition(structure, options) {
    const refSection = options.before || options.after;
    const refIndex = structure.findIndex((item) => {
      if (typeof item === "string") return item === refSection;
      return Object.keys(item)[0] === refSection;
    });

    if (refIndex === -1) {
      throw new Error(`Reference section "${refSection}" not found`);
    }

    return options.after ? refIndex + 1 : refIndex;
  }

  /**
   * Add a section to a page
   * @param {string} sectionName - The section to add
   * @param {object} options - Options for positioning
   * @returns {Promise<Section>} Result of the operation
   */
  async addSection(sectionName, options = {}) {
    // Load the current structure
    const structure = await this.loadStructure();

    // Determine where to add the section
    let parent = options.parent || null;

    // If a parent is specified, find it in the structure
    let targetArray = parent
      ? this.findParentStructure(structure, parent)
      : structure;

    // Check for position options
    if (options.before || options.after) {
      // Insert at the appropriate position
      const insertIndex = this.findPosition(targetArray, options);
      targetArray.splice(insertIndex, 0, sectionName);
    } else {
      // Default: add to the end
      targetArray.push(sectionName);
    }

    const section = this.page.getSection(sectionName);

    await createSectionFile(section, DEFAULT_SECTION_CONTENT);

    // Save the updated structure
    await this.saveStructure(structure);

    return section;
  }

  /**
   * Remove a section from a page
   * @param {string} sectionName - The section to remove
   * @returns {Promise<Array>} Result of the operation
   */
  async removeSection(sectionName) {
    // Load the current structure
    const structure = await this.loadStructure();
    const section = this.page.getSection(sectionName);

    // Check if section exists
    if (!(await fileExists(section.filePath))) {
      throw new Error(
        `Section '${sectionName}' not found in page '${this.page.path}'`
      );
    }

    fs.unlink(section.filePath);

    // Find the section
    const position = this.findSectionPosition(structure, sectionName);

    if (position) {
      // Remove the section from the structure
      position.parent.splice(position.index, 1);

      // Save the updated structure
      await this.saveStructure(structure);
    }

    const result = await removeSectionTranslations(section);

    return result;
  }

  /**
   * Move a section within a page or to another page
   
   * @param {string} sectionName - The section to move
   * @param {Section} newSection - The target section
   * * @param {string} [parent] - Name of the target parent section
   * @returns {Promise<object>} Result of the operation
   */
  async moveSection(sectionName, newSection, parent) {
    // Load the source structure
    const sourceStructure = await this.loadStructure();
    const section = this.page.getSection(sectionName);

    // Check if section exists
    if (!(await fileExists(section.filePath))) {
      throw new Error(
        `Section '${section.name}' not found in page '${section.page.path}'`
      );
    }

    // Check if target section already exists
    if (await fileExists(newSection.filePath)) {
      throw new Error(
        `Section '${newSection.name}' already exist in page '${newSection.page.path}'`
      );
    }

    // Find the section in the source
    const position = this.findSectionPosition(sourceStructure, sectionName);
    if (!position) {
      throw new Error(
        `Section "${sectionName}" not found in page "${sourcePage}"`
      );
    }

    console.log("structure", sourceStructure);
    console.dir(position, { depth: null });

    // Get the section with its children
    const entry = position.parent[position.index];
    const files = normalizeToStringArray(entry);

    console.log("entry", entry, files);
    return files;

    // If moving to another page
    if (section.page.path !== newSection.page.path) {
      // @todo Move child sections recursively
      // ACTUALLY: first copy section and subsections recursively
      // then delete or not

      // Move the file
      const content = await fs.readFile(sectionPath, "utf8");

      await ensureDirectory(newSection.page.dirPath);

      // Write content to new location
      await fs.writeFile(newSection.filePath, content, "utf8");

      // Delete the original file
      await fs.unlink(sectionPath);
    }

    // Remove from source
    position.parent.splice(position.index, 1);
    await this.saveStructure(sourcePage, sourceStructure);

    newSection.page.manager.addEntry(entry, options);

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
   * Get all sections in structured order
   * @returns {Promise<Array>} Ordered sections with hierarchy
   */
  async getSections() {
    return this.loadStructure();
  }

  /**
   * Get a flat list of all section names
   * @returns {Promise<Array<string>>} Flat list of section names
   */
  async getFlatSectionList() {
    const structure = await this.loadStructure();
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

function normalizeToStringArray(entry) {
  if (typeof entry === "string") {
    return [entry];
  }

  if (Array.isArray(entry)) {
    return entry.flat(Infinity).filter((item) => typeof item === "string");
  }

  return [];
}
