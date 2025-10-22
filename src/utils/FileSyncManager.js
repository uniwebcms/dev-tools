import fs from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { Structure } from "./struct-manager.js";

/**
 * Extended manager that keeps files in sync with structure metadata
 * Handles file operations alongside structure operations
 */
export class FileSyncManager extends Structure {
  /**
   * Create a new section file
   * @param {string} pagePath - The page path
   * @param {string} sectionName - The section name
   * @param {string} content - Initial content for the section
   * @returns {Promise<string>} Path to the created file
   */
  async createSectionFile(pagePath, sectionName, content = "") {
    const sectionPath = this.getSectionFilePath(pagePath, sectionName);

    // Ensure the page directory exists
    const pageDir = this.getPageDir(pagePath);
    await fs.mkdir(pageDir, { recursive: true });

    // Create the file
    await fs.writeFile(sectionPath, content, "utf8");

    return sectionPath;
  }

  /**
   * Delete a section file
   * @param {string} pagePath - The page path
   * @param {string} sectionName - The section name
   * @returns {Promise<boolean>} True if file was deleted, false if it didn't exist
   */
  async deleteSectionFile(pagePath, sectionName) {
    const sectionPath = this.getSectionFilePath(pagePath, sectionName);

    try {
      await fs.unlink(sectionPath);
      return true;
    } catch (error) {
      if (error.code === "ENOENT") {
        return false; // File didn't exist
      }
      throw error;
    }
  }

  /**
   * Rename a section file
   * @param {string} pagePath - The page path
   * @param {string} oldName - The old section name
   * @param {string} newName - The new section name
   * @returns {Promise<boolean>} True if file was renamed, false if source didn't exist
   */
  async renameSectionFile(pagePath, oldName, newName) {
    const oldPath = this.getSectionFilePath(pagePath, oldName);
    const newPath = this.getSectionFilePath(pagePath, newName);

    try {
      // Check if source file exists
      await fs.access(oldPath);

      // Ensure target directory exists
      const dir = path.dirname(newPath);
      await fs.mkdir(dir, { recursive: true });

      // Rename the file
      await fs.rename(oldPath, newPath);
      return true;
    } catch (error) {
      if (error.code === "ENOENT") {
        return false; // Source file didn't exist
      }
      throw error;
    }
  }

  /**
   * Copy a section file
   * @param {string} sourcePage - Source page path
   * @param {string} sourceSection - Source section name
   * @param {string} targetPage - Target page path
   * @param {string} targetSection - Target section name
   * @returns {Promise<boolean>} True if file was copied, false if source didn't exist
   */
  async copySectionFile(sourcePage, sourceSection, targetPage, targetSection) {
    const sourcePath = this.getSectionFilePath(sourcePage, sourceSection);
    const targetPath = this.getSectionFilePath(targetPage, targetSection);

    try {
      // Check if source file exists
      await fs.access(sourcePath);

      // Read the content
      const content = await fs.readFile(sourcePath, "utf8");

      // Ensure target directory exists
      const dir = path.dirname(targetPath);
      await fs.mkdir(dir, { recursive: true });

      // Write to target
      await fs.writeFile(targetPath, content, "utf8");
      return true;
    } catch (error) {
      if (error.code === "ENOENT") {
        return false; // Source file didn't exist
      }
      throw error;
    }
  }

  /**
   * Add a section to a page with file synchronization
   * @param {string} pagePath - The page path
   * @param {string} sectionName - The section to add
   * @param {object} options - Options for positioning and content
   * @returns {Promise<object>} Result of the operation
   */
  async addSection(pagePath, sectionName, options = {}) {
    // First update the structure
    const result = await super.addSection(pagePath, sectionName, options);

    // Then create the file if content is provided or createFile option is true
    if (options.content !== undefined || options.createFile) {
      const content = options.content || "";
      const filePath = await this.createSectionFile(
        pagePath,
        sectionName,
        content
      );
      result.filePath = filePath;
    }

    return result;
  }

  /**
   * Remove a section from a page with file synchronization
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

    // Get the section (to check if it has children)
    const section = position.parent[position.index];

    // Check if this is a parent section with children
    let hasChildren = false;
    if (typeof section === "object") {
      const children = section[Object.keys(section)[0]];
      hasChildren = children && children.length > 0;
    }

    // If it has children and we're not force removing, throw error
    if (hasChildren && !options.force) {
      throw new Error(
        `Section "${sectionName}" has children. Use force:true to remove it and its children.`
      );
    }

    // Get the list of all section names to remove (including children)
    const sectionsToRemove = [sectionName];
    if (hasChildren) {
      const flattenChildren = (item) => {
        if (typeof item === "string") {
          return [item];
        }

        const key = Object.keys(item)[0];
        const children = item[key];
        const result = [key];

        for (const child of children) {
          result.push(...flattenChildren(child));
        }

        return result;
      };

      sectionsToRemove.push(...flattenChildren(section).slice(1)); // Skip the first one (it's the section itself)
    }

    // Remove the section from structure
    position.parent.splice(position.index, 1);

    // Save the updated structure
    await this.saveStructure(pagePath, structure);

    // Delete the files if deleteFile option is true (default) or not specified
    const deleteFile = options.deleteFile !== false;
    const deletedFiles = [];

    if (deleteFile) {
      // Delete all files (main section and its children)
      for (const sectionToRemove of sectionsToRemove) {
        const deleted = await this.deleteSectionFile(pagePath, sectionToRemove);
        if (deleted) {
          deletedFiles.push(sectionToRemove);
        }
      }
    }

    return {
      removed: sectionName,
      from: pagePath,
      deletedFiles,
    };
  }

  /**
   * Rename a section with file synchronization
   * @param {string} pagePath - The page path
   * @param {string} oldName - Current section name
   * @param {string} newName - New section name
   * @returns {Promise<object>} Result of the operation
   */
  async renameSection(pagePath, oldName, newName) {
    // Load the current structure
    const structure = await this.loadStructure(pagePath);

    // Find the section
    const position = this.findSectionPosition(structure, oldName);
    if (!position) {
      throw new Error(`Section "${oldName}" not found in page "${pagePath}"`);
    }

    // Get the section
    const section = position.parent[position.index];

    // Rename the section based on its type
    if (typeof section === "string") {
      // Simple string section
      position.parent[position.index] = newName;
    } else {
      // Object with children
      const children = section[oldName];
      position.parent[position.index] = { [newName]: children };
    }

    // Save the updated structure
    await this.saveStructure(pagePath, structure);

    // Rename the file if it exists
    const fileRenamed = await this.renameSectionFile(
      pagePath,
      oldName,
      newName
    );

    return {
      oldName,
      newName,
      page: pagePath,
      fileRenamed,
    };
  }

  /**
   * Move a section with file synchronization
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

    // Get list of all section names to move (including children)
    const sectionsToMove = [sectionName];
    if (typeof section === "object") {
      const flattenChildren = (item) => {
        if (typeof item === "string") {
          return [item];
        }

        const key = Object.keys(item)[0];
        const children = item[key];
        const result = [key];

        for (const child of children) {
          result.push(...flattenChildren(child));
        }

        return result;
      };

      sectionsToMove.push(...flattenChildren(section).slice(1)); // Skip the first one (it's the section itself)
    }

    // Remove from source
    position.parent.splice(position.index, 1);
    await this.saveStructure(sourcePage, sourceStructure);

    // If moving to another page, handle the files
    const movedFiles = [];
    if (targetPage !== sourcePage) {
      for (const sectionToMove of sectionsToMove) {
        // Check if section file exists and move it
        const sourceFilePath = this.getSectionFilePath(
          sourcePage,
          sectionToMove
        );
        if (existsSync(sourceFilePath)) {
          // Read content
          const content = await fs.readFile(sourceFilePath, "utf8");

          // Create in target
          await this.createSectionFile(targetPage, sectionToMove, content);

          // Delete source
          await this.deleteSectionFile(sourcePage, sectionToMove);

          movedFiles.push(sectionToMove);
        }
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
      movedFiles,
    };
  }

  /**
   * Create a copy of a section
   * @param {string} sourcePage - Source page path
   * @param {string} sectionName - Section to copy
   * @param {string} targetPage - Target page path
   * @param {string} newName - New name for the copy (defaults to original name)
   * @param {object} options - Positioning options
   * @returns {Promise<object>} Result of the operation
   */
  async copySection(
    sourcePage,
    sectionName,
    targetPage,
    newName = null,
    options = {}
  ) {
    const copyName = newName || sectionName;

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
    let section = position.parent[position.index];

    // If we're renaming, we need to modify the section
    if (newName && newName !== sectionName) {
      if (typeof section === "string") {
        // Simple string section
        section = copyName;
      } else {
        // Object with children
        const children = section[sectionName];
        section = { [copyName]: children };
      }
    }

    // Get list of all section names to copy (including children)
    const sectionsToCopy = new Map(); // Map of original name -> new name
    sectionsToCopy.set(sectionName, copyName);

    if (typeof section === "object") {
      const flattenChildren = (item, prefix = "") => {
        const key = Object.keys(item)[0];
        const children = item[key];
        const result = new Map();

        // For each child, we need to preserve its structure
        for (const child of children) {
          if (typeof child === "string") {
            result.set(`${prefix}${child}`, `${prefix}${child}`);
          } else {
            const childKey = Object.keys(child)[0];
            result.set(`${prefix}${childKey}`, `${prefix}${childKey}`);

            // Recursively add child's children
            const childResults = flattenChildren(
              child,
              `${prefix}${childKey}/`
            );
            childResults.forEach((newPath, origPath) => {
              result.set(origPath, newPath);
            });
          }
        }

        return result;
      };

      if (section[Object.keys(section)[0]].length > 0) {
        const childrenMap = flattenChildren(section);
        childrenMap.forEach((newPath, origPath) => {
          sectionsToCopy.set(origPath, newPath);
        });
      }
    }

    // Add to target (with positioning)
    const addOptions = { ...options };
    if (options.before) addOptions.before = options.before;
    if (options.after) addOptions.after = options.after;
    if (options.parent) addOptions.parent = options.parent;

    // Load target structure
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

    // Copy the files
    const copiedFiles = [];
    for (const [origSection, newSection] of sectionsToCopy.entries()) {
      // Check if section file exists and copy it
      const copied = await this.copySectionFile(
        sourcePage,
        origSection,
        targetPage,
        newSection
      );

      if (copied) {
        copiedFiles.push({
          original: origSection,
          copy: newSection,
        });
      }
    }

    return {
      copied: sectionName,
      as: copyName,
      from: sourcePage,
      to: targetPage,
      copiedFiles,
    };
  }

  /**
   * Create a new page with initial sections
   * @param {string} pagePath - The page path to create
   * @param {Array} sections - Initial sections to add
   * @returns {Promise<object>} Result of the operation
   */
  async createPage(pagePath, sections = []) {
    const pageDir = this.getPageDir(pagePath);

    // Create the page directory
    await fs.mkdir(pageDir, { recursive: true });

    // Create the structure file
    const structure = [];

    // Add initial sections
    for (const section of sections) {
      const sectionName = typeof section === "string" ? section : section.name;
      const content =
        typeof section === "object" && section.content ? section.content : "";

      // Add to structure
      structure.push(sectionName);

      // Create the section file
      await this.createSectionFile(pagePath, sectionName, content);
    }

    // Save the structure
    await this.saveStructure(pagePath, structure);

    return {
      created: pagePath,
      sections: structure,
    };
  }

  /**
   * Delete a page and all its sections
   * @param {string} pagePath - The page path to delete
   * @returns {Promise<object>} Result of the operation
   */
  async deletePage(pagePath) {
    const pageDir = this.getPageDir(pagePath);

    // Check if page exists
    try {
      await fs.access(pageDir);
    } catch (error) {
      if (error.code === "ENOENT") {
        throw new Error(`Page "${pagePath}" does not exist`);
      }
      throw error;
    }

    // Get the list of sections
    const sections = await this.getFlatSectionList(pagePath);

    // Recursively delete the directory and all its contents
    await fs.rm(pageDir, { recursive: true, force: true });

    return {
      deleted: pagePath,
      sections,
    };
  }

  /**
   * Verify that structure and files are in sync
   * @param {string} pagePath - The page path to verify
   * @returns {Promise<object>} Verification results
   */
  async verifySync(pagePath) {
    const result = {
      inSync: true,
      missing: [],
      orphaned: [],
    };

    // Get the structure
    const structure = await this.loadStructure(pagePath);

    // Get all sections in the structure
    const sectionsInStructure = await this.getFlatSectionList(pagePath);

    // Get all markdown files in the directory
    const pageDir = this.getPageDir(pagePath);
    let files = [];

    try {
      const allFiles = await fs.readdir(pageDir);
      files = allFiles
        .filter((file) => file.endsWith(".md"))
        .map((file) => file.replace(/\.md$/, ""));
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }

    // Find missing files (in structure but not on disk)
    for (const section of sectionsInStructure) {
      if (!files.includes(section)) {
        result.missing.push(section);
        result.inSync = false;
      }
    }

    // Find orphaned files (on disk but not in structure)
    for (const file of files) {
      if (!sectionsInStructure.includes(file) && file !== "structure") {
        result.orphaned.push(file);
        result.inSync = false;
      }
    }

    return result;
  }

  /**
   * Fix synchronization issues by creating missing files and adding orphaned files to structure
   * @param {string} pagePath - The page path to fix
   * @returns {Promise<object>} Fix results
   */
  async fixSync(pagePath) {
    const syncResult = await this.verifySync(pagePath);
    const result = {
      fixed: false,
      created: [],
      added: [],
    };

    if (syncResult.inSync) {
      return result;
    }

    // Create missing files
    for (const section of syncResult.missing) {
      await this.createSectionFile(pagePath, section, "");
      result.created.push(section);
    }

    // Add orphaned files to structure
    const structure = await this.loadStructure(pagePath);
    for (const section of syncResult.orphaned) {
      structure.push(section);
      result.added.push(section);
    }

    // Save the updated structure
    if (result.added.length > 0) {
      await this.saveStructure(pagePath, structure);
    }

    result.fixed = result.created.length > 0 || result.added.length > 0;

    return result;
  }
}

export default FileSyncManager;
