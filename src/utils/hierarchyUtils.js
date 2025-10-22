import fs from "fs/promises";
import { HierarchyNode } from "./HierarchyNode.js";

/**
 * Parse a numeric prefix from a filename
 * @param {string} filename - The filename to parse
 * @returns {Object|null} The parsed prefix or null if no prefix
 */
export function parsePrefix(filename) {
  const match = filename.match(/^(\d+(?:\.\d+)*)-(.+)$/);
  if (!match) return null;

  const numericPrefix = match[1];
  const name = match[2];
  const segments = numericPrefix.split(".").map(Number);

  return {
    original: numericPrefix,
    segments,
    name,
  };
}

/**
 * Normalize a filename (remove .md extension if present)
 * @param {string} name - The filename to normalize
 * @returns {string} Normalized name without .md extension
 */
export function normalizeName(name) {
  return name.endsWith(".md") ? name.slice(0, -3) : name;
}

/**
 * Get all markdown files in a directory
 * @param {string} dirPath - Directory path
 * @returns {Promise<string[]>} Array of markdown filenames
 */
export async function getMarkdownFiles(dirPath) {
  const files = await fs.readdir(dirPath);
  return files.filter((file) => file.endsWith(".md"));
}

/**
 * Build a hierarchy tree from a list of files
 * @param {Array} files - Array of {filename, segments, name} objects
 * @returns {HierarchyNode} The root node of the hierarchy
 */
export function buildHierarchyTree(files) {
  // Create a root node
  const root = new HierarchyNode([]);

  // Add each file to the hierarchy
  for (const file of files) {
    let currentNode = root;

    // Build up the full path to this node
    const fullPath = [];

    // Navigate/create the path to this file
    for (let i = 0; i < file.segments.length; i++) {
      const segment = file.segments[i];
      fullPath.push(segment);

      // Check if this child already exists
      if (!currentNode.hasChild(segment)) {
        // Create intermediate node (not a file node)
        const newNode = new HierarchyNode([...fullPath]);
        currentNode.addChild(newNode);
      }

      // Move to the next level
      currentNode = currentNode.getChild(segment);
    }

    // Now we're at the correct node, update it with file info
    currentNode.filename = file.filename;
    currentNode.name = file.name;
  }

  return root;
}

/**
 * Load the current file hierarchy from a directory
 * @param {string} dirPath - Directory path
 * @returns {Promise<HierarchyNode>} The root node of the hierarchy
 */
export async function loadHierarchy(dirPath) {
  // Get all markdown files
  const allFiles = await getMarkdownFiles(dirPath);

  // Parse prefixes
  const fileData = allFiles
    .map((filename) => {
      const parsed = parsePrefix(filename);
      if (!parsed) return null;

      return {
        filename,
        segments: parsed.segments,
        name: normalizeName(parsed.name),
      };
    })
    .filter((file) => file !== null);

  // Build hierarchy tree
  return buildHierarchyTree(fileData);
}

/**
 * Find a node in the hierarchy by its path segments
 * @param {HierarchyNode} root - The root node
 * @param {number[]} targetSegments - The segments to find
 * @returns {HierarchyNode|null} The found node or null
 */
export function findNodeBySegments(root, targetSegments) {
  if (targetSegments.length === 0) {
    return root;
  }

  let currentNode = root;

  for (let i = 0; i < targetSegments.length; i++) {
    const segment = targetSegments[i];
    currentNode = currentNode.getChild(segment);

    if (!currentNode) {
      return null; // Path doesn't exist
    }
  }

  return currentNode;
}

/**
 * Find the parent node for a given path
 * @param {HierarchyNode} root - The root node
 * @param {number[]} segments - The segments of the node
 * @returns {HierarchyNode|null} The parent node or null
 */
export function findParentNode(root, segments) {
  if (segments.length === 0) {
    return null; // Root has no parent
  }

  return findNodeBySegments(root, segments.slice(0, -1));
}

/**
 * Find nodes that need to be shifted during insertion
 * @param {HierarchyNode} parentNode - The parent node
 * @param {number} insertSegment - The segment to insert at
 * @returns {HierarchyNode[]} Nodes to shift
 */
export function findNodesToShiftForInsertion(parentNode, insertSegment) {
  // Get all direct children at or above the insertion point
  const directChildren = parentNode
    .getSortedChildren()
    .filter((node) => node.segments[node.segments.length - 1] >= insertSegment);

  // Collect all descendants of these nodes that need to shift
  const allNodesToShift = [];
  for (const node of directChildren) {
    allNodesToShift.push(...node.getAllDescendants());
  }

  // Sort in reverse order (deepest nodes first, then highest indices first)
  // to avoid overwriting during renaming
  allNodesToShift.sort((a, b) => {
    // Sort by depth (descending)
    if (b.segments.length !== a.segments.length) {
      return b.segments.length - a.segments.length;
    }
    // Then by last segment (descending)
    return (
      b.segments[b.segments.length - 1] - a.segments[a.segments.length - 1]
    );
  });

  return allNodesToShift;
}

/**
 * Find nodes that need to be shifted during deletion
 * @param {HierarchyNode} parentNode - The parent node
 * @param {number} deleteSegment - The segment being deleted
 * @returns {HierarchyNode[]} Nodes to shift
 */
export function findNodesToShiftForDeletion(parentNode, deleteSegment) {
  // Get all direct children after the deletion point
  const directChildren = parentNode
    .getSortedChildren()
    .filter((node) => node.segments[node.segments.length - 1] > deleteSegment);

  // Collect all descendants of these nodes that need to shift
  const allNodesToShift = [];
  for (const node of directChildren) {
    allNodesToShift.push(...node.getAllDescendants());
  }

  // Sort in ascending order (shallowest and lowest indices first)
  // for deletion we want to start from the front to avoid collisions
  allNodesToShift.sort((a, b) => {
    // Sort by depth (ascending)
    if (a.segments.length !== b.segments.length) {
      return a.segments.length - b.segments.length;
    }
    // Then by last segment (ascending)
    return (
      a.segments[a.segments.length - 1] - b.segments[b.segments.length - 1]
    );
  });

  return allNodesToShift;
}
