import fs from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import {
  loadHierarchy,
  findNodeBySegments,
  findParentNode,
  findNodesToShiftForInsertion,
  findNodesToShiftForDeletion,
  normalizeName,
  parsePrefix,
} from "./hierarchyUtils.js";

/**
 * Create a new file in the hierarchy
 * @param {string} dirPath - Directory path
 * @param {string} newPrefix - Numeric prefix for the new file (e.g., "1.2")
 * @param {string} newName - Name part of the new file
 * @returns {Promise<object>} Result with created and updated files
 */
export async function addFile(dirPath, newPrefix, newName) {
  // Normalize input
  const baseName = normalizeName(newName);
  const newFilename = `${newPrefix}-${baseName}.md`;
  const newFilePath = path.join(dirPath, newFilename);
  const newSegments = newPrefix.split(".").map(Number);

  // Load the current hierarchy
  const hierarchy = await loadHierarchy(dirPath);

  // Check if a file already exists at exactly this location
  const existingNode = findNodeBySegments(hierarchy, newSegments);
  // if (existingNode && existingNode.filename) {
  //   throw new Error(`A file already exists at position ${newPrefix}`);
  // }

  // Find the parent node
  const parentNode = findParentNode(hierarchy, newSegments);

  // If parent doesn't exist, we can just create the file
  if (!parentNode) {
    await fs.writeFile(newFilePath, "");
    return {
      created: newFilename,
      updated: [],
    };
  }

  // Check if the slot is available
  const lastSegment = newSegments[newSegments.length - 1];
  const slotTaken = parentNode.hasChild(lastSegment);

  // If the slot is available, just create the file
  if (!slotTaken) {
    await fs.writeFile(newFilePath, "");
    return {
      created: newFilename,
      updated: [],
    };
  }

  // If we're here, the slot is taken and we need to shift files
  // Find all nodes that need to be shifted
  const nodesToShift = findNodesToShiftForInsertion(parentNode, lastSegment);

  // Shift the nodes (rename the files)
  const renamedFiles = [];
  for (const node of nodesToShift) {
    if (!node.filename) continue; // Skip non-file nodes

    const oldFilePath = path.join(dirPath, node.filename);

    // Create the new path (increment the last segment)
    const newNodeSegments = [...node.segments];
    const nodeLastSegmentIndex = newNodeSegments.length - 1;

    // Find which segment needs to be incremented
    const insertPathLength = newSegments.length;
    const nodePathLength = newNodeSegments.length;

    // If the node is a direct sibling of the insertion point
    if (nodePathLength === insertPathLength) {
      newNodeSegments[nodeLastSegmentIndex] += 1;
    }
    // If the node is a descendant of a node at the insertion point
    else if (nodePathLength > insertPathLength) {
      // Check if it's in the same branch
      let sameBranch = true;
      for (let i = 0; i < insertPathLength; i++) {
        if (newNodeSegments[i] !== newSegments[i]) {
          sameBranch = false;
          break;
        }
      }

      if (sameBranch) {
        // Only increment the segment at the insertion level
        newNodeSegments[insertPathLength - 1] += 1;
      }
    }

    const newNodePrefix = newNodeSegments.join(".");
    const updatedFilename = `${newNodePrefix}-${node.name}.md`;
    const updatedFilePath = path.join(dirPath, updatedFilename);

    await fs.rename(oldFilePath, updatedFilePath);

    renamedFiles.push({
      oldName: node.filename,
      newName: updatedFilename,
    });
  }

  // Create the new file
  await fs.writeFile(newFilePath, "");

  return {
    created: newFilename,
    updated: renamedFiles,
  };
}

/**
 * Delete a file from the hierarchy
 * @param {string} dirPath - Directory path
 * @param {string} targetFilename - File to delete
 * @param {boolean} updateIndices - Whether to update indices of affected files
 * @returns {Promise<object>} Result with deleted file and updated files
 */
export async function deleteFile(
  dirPath,
  targetFilename,
  updateIndices = true
) {
  const targetFilePath = path.join(dirPath, targetFilename);

  // Check if file exists
  if (!existsSync(targetFilePath)) {
    throw new Error(`File ${targetFilename} does not exist`);
  }

  // Parse the target file's prefix
  const targetParsed = parsePrefix(targetFilename);
  if (!targetParsed) {
    throw new Error(
      `File ${targetFilename} does not have a valid numeric prefix`
    );
  }

  // Delete the file
  await fs.unlink(targetFilePath);

  // If we don't need to update indices, we're done
  if (!updateIndices) {
    return {
      deleted: targetFilename,
      updated: [],
    };
  }

  // Load the current hierarchy
  const hierarchy = await loadHierarchy(dirPath);

  // Determine the parent path
  const parentSegments = targetParsed.segments.slice(0, -1);
  const lastSegment = targetParsed.segments[targetParsed.segments.length - 1];

  // Find the parent node
  const parentNode =
    parentSegments.length === 0
      ? hierarchy
      : findNodeBySegments(hierarchy, parentSegments);

  if (!parentNode) {
    // Parent doesn't exist, nothing to update
    return {
      deleted: targetFilename,
      updated: [],
    };
  }

  // Find all nodes that need to be shifted down
  const nodesToShift = findNodesToShiftForDeletion(parentNode, lastSegment);

  // Now shift the files down (rename them)
  const renamedFiles = [];
  for (const node of nodesToShift) {
    if (!node.filename) continue; // Skip non-file nodes

    const oldFilePath = path.join(dirPath, node.filename);

    // Create the new path (decrement the appropriate segment)
    const newNodeSegments = [...node.segments];
    const nodeLastSegmentIndex = newNodeSegments.length - 1;

    // Find which segment needs to be decremented
    const deletePathLength = targetParsed.segments.length;
    const nodePathLength = newNodeSegments.length;

    // If the node is a direct sibling of the deleted node
    if (nodePathLength === deletePathLength) {
      newNodeSegments[nodeLastSegmentIndex] -= 1;
    }
    // If the node is a descendant of a node that was shifted
    else if (nodePathLength > deletePathLength) {
      // Check if it's in the same branch
      let sameBranch = true;
      for (let i = 0; i < deletePathLength - 1; i++) {
        // Check up to parent level
        if (newNodeSegments[i] !== targetParsed.segments[i]) {
          sameBranch = false;
          break;
        }
      }

      if (sameBranch && newNodeSegments[deletePathLength - 1] > lastSegment) {
        // Only decrement the segment at the deletion level
        newNodeSegments[deletePathLength - 1] -= 1;
      }
    }

    const newNodePrefix = newNodeSegments.join(".");
    const updatedFilename = `${newNodePrefix}-${node.name}.md`;
    const updatedFilePath = path.join(dirPath, updatedFilename);

    await fs.rename(oldFilePath, updatedFilePath);

    renamedFiles.push({
      oldName: node.filename,
      newName: updatedFilename,
    });
  }

  return {
    deleted: targetFilename,
    updated: renamedFiles,
  };
}

/**
 * Move a file to a new position in the hierarchy
 * @param {string} sourceDirPath - Source directory path
 * @param {string} targetDirPath - Target directory path (can be the same as source)
 * @param {string} sourceFilename - File to move
 * @param {string} newPrefix - New numeric prefix for the file
 * @param {string} newName - Optional new name for the file (if not provided, keep the old name)
 * @returns {Promise<object>} Result with moved file info and updated files
 */
export async function moveFile(
  sourceDirPath,
  targetDirPath,
  sourceFilename,
  newPrefix,
  newName = null
) {
  const sourceFilePath = path.join(sourceDirPath, sourceFilename);

  // Check if source file exists
  if (!existsSync(sourceFilePath)) {
    throw new Error(`Source file ${sourceFilename} does not exist`);
  }

  // Parse the source file's prefix
  const sourceParsed = parsePrefix(sourceFilename);
  if (!sourceParsed) {
    throw new Error(
      `Source file ${sourceFilename} does not have a valid numeric prefix`
    );
  }

  // Determine the name to use
  const nameToUse = newName || sourceParsed.name;

  // Read the content of the source file
  const content = await fs.readFile(sourceFilePath, "utf8");

  // Delete the source file (with index updates)
  const deleteResult = await deleteFile(sourceDirPath, sourceFilename, true);

  // Add the file to the target directory
  const addResult = await addFile(targetDirPath, newPrefix, nameToUse);

  // Write the content to the new file
  const newFilePath = path.join(targetDirPath, addResult.created);
  await fs.writeFile(newFilePath, content);

  return {
    moved: {
      from: path.join(sourceDirPath, sourceFilename),
      to: path.join(targetDirPath, addResult.created),
    },
    sourceUpdated: deleteResult.updated,
    targetUpdated: addResult.updated,
  };
}

/**
 * @section Hierarchy Operations
 */

/**
 * Shift file indices in a specified range
 * @param {string} dirPath - Directory path
 * @param {string} basePrefix - Base prefix where shifting begins (e.g., "1" or "2.3")
 * @param {number} startIndex - Index to start shifting from (inclusive)
 * @param {number} endIndex - Index to end shifting at (inclusive, or -1 for all)
 * @param {number} shiftAmount - Amount to shift indices by (positive or negative)
 * @returns {Promise<object>} Result with updated files
 */
export async function shiftIndices(
  dirPath,
  basePrefix,
  startIndex,
  endIndex = -1,
  shiftAmount = 1
) {
  if (shiftAmount === 0) {
    return { updated: [] }; // No shifting needed
  }

  // Load hierarchy
  const hierarchy = await loadHierarchy(dirPath);

  // Find base node
  const baseSegments = basePrefix ? basePrefix.split(".").map(Number) : [];
  const baseNode =
    baseSegments.length === 0
      ? hierarchy
      : findNodeBySegments(hierarchy, baseSegments);

  if (!baseNode) {
    return { updated: [] }; // Nothing to shift
  }

  // Determine range of nodes to shift
  const childrenToShift = baseNode.getSortedChildren().filter((node) => {
    const lastSegment = node.segments[node.segments.length - 1];
    return (
      lastSegment >= startIndex && (endIndex === -1 || lastSegment <= endIndex)
    );
  });

  // Collect all descendants
  const nodesToShift = [];
  for (const node of childrenToShift) {
    nodesToShift.push(...node.getAllDescendants());
  }

  // Sort appropriately based on shift direction
  if (shiftAmount > 0) {
    // Shift up - start from highest indices to avoid overwriting
    nodesToShift.sort((a, b) => {
      // Sort by depth (descending)
      if (b.segments.length !== a.segments.length) {
        return b.segments.length - a.segments.length;
      }
      // Then by last segment (descending)
      return (
        b.segments[b.segments.length - 1] - a.segments[a.segments.length - 1]
      );
    });
  } else {
    // Shift down - start from lowest indices to avoid overwriting
    nodesToShift.sort((a, b) => {
      // Sort by depth (ascending)
      if (a.segments.length !== b.segments.length) {
        return a.segments.length - b.segments.length;
      }
      // Then by last segment (ascending)
      return (
        a.segments[a.segments.length - 1] - b.segments[b.segments.length - 1]
      );
    });

    // When shifting down, check if the new position would be negative
    for (const node of nodesToShift) {
      const segmentToModify = baseSegments.length;
      if (
        segmentToModify < node.segments.length &&
        node.segments[segmentToModify] + shiftAmount <= 0
      ) {
        throw new Error(
          `Shifting would result in a non-positive index at position ${node.segments.join(
            "."
          )}`
        );
      }
    }
  }

  // Perform shifting
  const renamedFiles = [];
  for (const node of nodesToShift) {
    if (!node.filename) continue; // Skip non-file nodes

    const oldFilePath = path.join(dirPath, node.filename);

    // Create the new path by shifting the appropriate segment
    const newNodeSegments = [...node.segments];
    const segmentToModify = baseSegments.length; // Index in segments array to modify

    if (segmentToModify < newNodeSegments.length) {
      newNodeSegments[segmentToModify] += shiftAmount;

      const newNodePrefix = newNodeSegments.join(".");
      const updatedFilename = `${newNodePrefix}-${node.name}.md`;
      const updatedFilePath = path.join(dirPath, updatedFilename);

      await fs.rename(oldFilePath, updatedFilePath);

      renamedFiles.push({
        oldName: node.filename,
        newName: updatedFilename,
      });
    }
  }

  return { updated: renamedFiles };
}

/**
 * Normalize a section of the hierarchy by removing gaps in numbering
 * @param {string} dirPath - Directory path
 * @param {string} basePrefix - Base prefix to normalize (e.g., "1" or "2.3")
 * @returns {Promise<object>} Result with updated files
 */
export async function normalizeHierarchy(dirPath, basePrefix = "") {
  // Load hierarchy
  const hierarchy = await loadHierarchy(dirPath);

  // Find base node
  const baseSegments = basePrefix ? basePrefix.split(".").map(Number) : [];
  const baseNode =
    baseSegments.length === 0
      ? hierarchy
      : findNodeBySegments(hierarchy, baseSegments);

  if (!baseNode) {
    return { updated: [] }; // Nothing to normalize
  }

  // Get sorted children
  const children = baseNode.getSortedChildren();

  // If no children, nothing to normalize
  if (children.length === 0) {
    return { updated: [] };
  }

  const renamedFiles = [];

  // Normalize each level recursively
  async function normalizeLevel(node, level) {
    const children = node.getSortedChildren();

    // Normalize current level
    let expectedIndex = 1;
    for (const child of children) {
      const currentIndex = child.segments[child.segments.length - 1];

      // If the index is not as expected, we need to rename
      if (currentIndex !== expectedIndex) {
        const oldSegments = [...child.segments];
        const newSegments = [...oldSegments];
        newSegments[newSegments.length - 1] = expectedIndex;

        // Rename this file if it exists
        if (child.filename) {
          const oldFilePath = path.join(dirPath, child.filename);
          const newPrefix = newSegments.join(".");
          const updatedFilename = `${newPrefix}-${child.name}.md`;
          const updatedFilePath = path.join(dirPath, updatedFilename);

          await fs.rename(oldFilePath, updatedFilePath);

          renamedFiles.push({
            oldName: child.filename,
            newName: updatedFilename,
          });
        }

        // Update all descendants
        const descendants = child
          .getAllDescendants()
          .filter((d) => d !== child);

        for (const descendant of descendants) {
          if (!descendant.filename) continue; // Skip non-file nodes

          const oldFilePath = path.join(dirPath, descendant.filename);

          // Create the new path
          const descendantPath = [...descendant.segments];
          // Update the shared segment that changed
          descendantPath[oldSegments.length - 1] = expectedIndex;

          const newPrefix = descendantPath.join(".");
          const updatedFilename = `${newPrefix}-${descendant.name}.md`;
          const updatedFilePath = path.join(dirPath, updatedFilename);

          await fs.rename(oldFilePath, updatedFilePath);

          renamedFiles.push({
            oldName: descendant.filename,
            newName: updatedFilename,
          });
        }
      }

      // Recursively normalize children
      await normalizeLevel(child, level + 1);

      expectedIndex++;
    }
  }

  // Start normalization from the base node
  await normalizeLevel(baseNode, baseSegments.length);

  return { updated: renamedFiles };
}

/**
 * Create space in the hierarchy for future files
 * @param {string} dirPath - Directory path
 * @param {string} basePrefix - Base prefix where to create space (e.g., "1" or "2.3")
 * @param {number} position - Position where to create space
 * @param {number} count - Number of spaces to create
 * @returns {Promise<object>} Result with updated files
 */
export async function createSpace(dirPath, basePrefix, position, count = 1) {
  if (count <= 0) {
    return { updated: [] };
  }

  // Just use shiftIndices with a positive amount
  return shiftIndices(dirPath, basePrefix, position, -1, count);
}

/**
 * Get a structured representation of the hierarchy
 * @param {string} dirPath - Directory path
 * @returns {Promise<object>} Hierarchical object representation
 */
export async function getHierarchyStructure(dirPath) {
  const hierarchy = await loadHierarchy(dirPath);

  function buildStructure(node) {
    const result = {
      path: node.getPath(),
      file: node.filename,
      name: node.name,
      children: [],
    };

    // Add children
    for (const child of node.getSortedChildren()) {
      result.children.push(buildStructure(child));
    }

    return result;
  }

  return buildStructure(hierarchy);
}
