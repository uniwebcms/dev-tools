/**
 * Represents a node in the hierarchical file structure
 */
export class HierarchyNode {
  /**
   * Create a new hierarchy node
   * @param {number[]} segments - The position segments (e.g., [1,2,3] for "1.2.3")
   * @param {string} filename - The associated filename (null for non-file nodes)
   * @param {string} name - The name part of the file (without prefix or extension)
   */
  constructor(segments, filename = null, name = null) {
    this.segments = segments;
    this.filename = filename;
    this.name = name;
    this.children = new Map(); // Map of last segment number -> child node
  }

  /**
   * Get the string representation of this node's path (e.g., "1.2.3")
   * @returns {string} The path string
   */
  getPath() {
    return this.segments.join(".");
  }

  /**
   * Add a child node to this node
   * @param {HierarchyNode} node - The child node to add
   */
  addChild(node) {
    const lastSegment = node.segments[node.segments.length - 1];
    this.children.set(lastSegment, node);
  }

  /**
   * Get all child nodes sorted by their last segment value
   * @returns {HierarchyNode[]} Sorted array of child nodes
   */
  getSortedChildren() {
    return Array.from(this.children.values()).sort(
      (a, b) =>
        a.segments[a.segments.length - 1] - b.segments[b.segments.length - 1]
    );
  }

  /**
   * Find the next available slot for a new child
   * @returns {number} The next available segment number
   */
  findNextAvailableSlot() {
    if (this.children.size === 0) {
      return 1; // First child starts at 1
    }

    const childSegments = Array.from(this.children.keys()).sort(
      (a, b) => a - b
    );

    // Look for gaps in the sequence
    let prevSegment = 0;
    for (const segment of childSegments) {
      if (segment > prevSegment + 1) {
        // Found a gap
        return prevSegment + 1;
      }
      prevSegment = segment;
    }

    // No gaps, so use the next number after the last child
    return childSegments[childSegments.length - 1] + 1;
  }

  /**
   * Recursively get all descendant nodes (including this node)
   * @returns {HierarchyNode[]} All descendant nodes
   */
  getAllDescendants() {
    const result = [this];
    for (const child of this.children.values()) {
      result.push(...child.getAllDescendants());
    }
    return result;
  }

  /**
   * Get direct child by segment number
   * @param {number} segment - The segment number to find
   * @returns {HierarchyNode|null} The child node or null if not found
   */
  getChild(segment) {
    return this.children.get(segment) || null;
  }

  /**
   * Check if this node has a child with the given segment
   * @param {number} segment - The segment number to check
   * @returns {boolean} True if a child exists with this segment
   */
  hasChild(segment) {
    return this.children.has(segment);
  }
}
