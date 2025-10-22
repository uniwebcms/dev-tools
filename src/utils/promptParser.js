/**
 * Utilities for parsing prompt front matter and extracting dependencies
 */

import yaml from "js-yaml";

/**
 * Parse front matter from a markdown string
 * @param {string} content - Markdown content with front matter
 * @returns {Object} Object containing front matter and content
 */
export function parsePromptFrontMatter(content) {
  // Default return object
  const result = {
    frontMatter: null,
    content: content,
  };

  // Check if the content has front matter (starts with ---)
  if (!content || !content.trim().startsWith("---")) {
    return result;
  }

  // Find the end of the front matter section
  const endIndex = content.indexOf("---", 3);
  if (endIndex === -1) {
    return result;
  }

  // Extract front matter and content
  const frontMatterText = content.substring(3, endIndex).trim();
  const remainingContent = content.substring(endIndex + 3).trim();

  try {
    // Parse front matter as YAML
    result.frontMatter = yaml.load(frontMatterText) || {};
    result.content = remainingContent;
  } catch (error) {
    console.error("Error parsing front matter:", error);
  }

  return result;
}

/**
 * Normalize dependency paths
 * @param {Array|string} dependencies - Dependencies array or string
 * @returns {Array} Normalized array of dependency paths
 */
export function normalizeDependencies(dependencies) {
  if (!dependencies) {
    return [];
  }

  // Convert string to array
  if (typeof dependencies === "string") {
    return [dependencies];
  }

  // Process array
  if (Array.isArray(dependencies)) {
    const result = [];

    for (const dep of dependencies) {
      if (typeof dep === "string") {
        result.push(dep);
      } else if (typeof dep === "object") {
        // Handle complex dependency objects (e.g., { any: [...] })
        if (dep.any && Array.isArray(dep.any)) {
          result.push({ any: dep.any });
        } else if (dep.all && Array.isArray(dep.all)) {
          result.push({ all: dep.all });
        }
      }
    }

    return result;
  }

  return [];
}

/**
 * Extract dependency IDs from paths
 * @param {Array} dependencies - Array of dependency paths
 * @returns {Array} Array of dependency IDs
 */
export function extractDependencyIds(dependencies) {
  const ids = [];

  for (const dep of dependencies) {
    if (typeof dep === "string") {
      // Extract ID from file path (remove directory and extension)
      const parts = dep.split("/");
      const filename = parts[parts.length - 1];
      const id = filename.replace(/\.(md|markdown)$/, "");
      ids.push(id);
    } else if (typeof dep === "object") {
      // Handle complex dependency objects
      if (dep.any && Array.isArray(dep.any)) {
        ids.push({ any: extractDependencyIds(dep.any) });
      } else if (dep.all && Array.isArray(dep.all)) {
        ids.push({ all: extractDependencyIds(dep.all) });
      }
    }
  }

  return ids;
}
