// tree-structure.js
import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import yaml from "js-yaml";

export class TreeNode {
  constructor(name) {
    this.name = name; // string (filename without extension)
    this.children = []; // array of TreeNode
  }
}

export class TreeStructure {
  #inferred;

  constructor(filePath) {
    this.rootNodes = []; // top-level nodes (TreeNode[])
    this.filePath = filePath;
    this.dirPath = path.dirname(filePath);
    this.#inferred = null;
  }

  isOptional() {
    return this.#inferred && this.#inferred.length === 0;
  }

  /** Returns the TreeNode with the given name, or null */
  find(name) {
    return this._findNodeRecursive(name, this.rootNodes)?.node || null;
  }

  has(name) {
    return !!this.find(name);
  }

  /** Returns an array of names from root to the target node */
  getPath(name) {
    const path = [];
    const search = (nodes, currentPath) => {
      for (const node of nodes) {
        const newPath = [...currentPath, node.name];
        if (node.name === name) {
          path.push(...newPath);
          return true;
        }
        if (search(node.children, newPath)) return true;
      }
      return false;
    };
    return search(this.rootNodes, []) ? path : null;
  }

  getDepth(name) {
    const path = this.getPath(name);
    return path ? path.length - 1 : null;
  }

  remove(name) {
    const { node, parent } =
      this._findNodeRecursive(name, this.rootNodes) || {};
    if (!node) return false;
    const list = parent ? parent.children : this.rootNodes;
    const index = list.findIndex((n) => n.name === name);
    if (index !== -1) list.splice(index, 1);
    return true;
  }

  // add(name, parentName = null) {
  //   if (this.has(name)) throw new Error(`"${name}" already exists`);
  //   const newNode = new TreeNode(name);
  //   if (!parentName) {
  //     this.rootNodes.push(newNode);
  //   } else {
  //     const parent = this.find(parentName);
  //     if (!parent) throw new Error(`Parent "${parentName}" not found`);
  //     parent.children.push(newNode);
  //   }
  // }

  add(name, position = null) {
    if (this.has(name)) throw new Error(`"${name}" already exists`);
    const newNode = new TreeNode(name);
    const { under, before, after } = position || {};

    if (under) {
      const parent = this.find(under);
      if (!parent) throw new Error(`Parent "${under}" not found`);
      const siblings = parent.children;

      if (before || after) {
        const refName = before || after;
        const refIndex = siblings.findIndex((n) => n.name === refName);
        if (refIndex === -1)
          throw new Error(
            `Reference node "${refName}" not found under "${under}"`
          );

        const insertAt = before ? refIndex : refIndex + 1;
        siblings.splice(insertAt, 0, newNode);
      } else {
        siblings.push(newNode);
      }

      return;
    }

    if (before || after) {
      const refName = before || after;
      const { node: refNode, parent } =
        this._findNodeRecursive(refName, this.rootNodes) || {};
      if (!refNode) throw new Error(`Reference node "${refName}" not found`);

      const siblings = parent ? parent.children : this.rootNodes;
      const refIndex = siblings.findIndex((n) => n.name === refName);
      const insertAt = before ? refIndex : refIndex + 1;
      siblings.splice(insertAt, 0, newNode);
      return;
    }

    // Default to root-level insertion
    this.rootNodes.push(newNode);
  }

  // move(name, newParentName = null) {
  //   const found = this._findNodeRecursive(name, this.rootNodes);
  //   if (!found) throw new Error(`Node "${name}" not found`);
  //   const { node } = found;

  //   this.remove(name);

  //   if (!newParentName) {
  //     this.rootNodes.push(node);
  //   } else {
  //     const newParent = this.find(newParentName);
  //     if (!newParent)
  //       throw new Error(`New parent "${newParentName}" not found`);
  //     if (this.getFlatDescendants(name).includes(newParentName)) {
  //       throw new Error(
  //         `Cannot move "${name}" under its own descendant "${newParentName}"`
  //       );
  //     }
  //     newParent.children.push(node);
  //   }
  // }

  move(name, position = {}) {
    const found = this._findNodeRecursive(name, this.rootNodes);
    if (!found) throw new Error(`Node "${name}" not found`);
    const { node } = found;

    const { under, before, after } = position || {};

    // Prevent invalid descendant moves
    const target = under || before || after;
    if (target && this.getFlatDescendants(name).includes(target)) {
      throw new Error(
        `Cannot move "${name}" into or near its own descendant "${target}"`
      );
    }

    // Remove from current location
    this.remove(name);

    if (under) {
      const parent = this.find(under);
      if (!parent) throw new Error(`Parent "${under}" not found`);
      const siblings = parent.children;

      if (before || after) {
        const refName = before || after;
        const refIndex = siblings.findIndex((n) => n.name === refName);
        if (refIndex === -1)
          throw new Error(
            `Reference node "${refName}" not found under "${under}"`
          );

        const insertAt = before ? refIndex : refIndex + 1;
        siblings.splice(insertAt, 0, node);
      } else {
        siblings.push(node);
      }

      return;
    }

    if (before || after) {
      const refName = before || after;
      const { node: refNode, parent } =
        this._findNodeRecursive(refName, this.rootNodes) || {};
      if (!refNode) throw new Error(`Reference node "${refName}" not found`);

      const siblings = parent ? parent.children : this.rootNodes;
      const refIndex = siblings.findIndex((n) => n.name === refName);
      const insertAt = before ? refIndex : refIndex + 1;
      siblings.splice(insertAt, 0, node);
      return;
    }

    // Default to root-level move
    this.rootNodes.push(node);
  }

  /** Rename a node while preserving its position and children */
  rename(oldName, newName) {
    if (this.has(newName)) {
      throw new Error(
        `Cannot rename: target name "${newName}" already exists.`
      );
    }
    const node = this.find(oldName);
    if (!node) {
      throw new Error(`Node "${oldName}" not found.`);
    }
    node.name = newName;
  }

  /** Returns a deep clone of the subtree rooted at name */
  getSubtree(name) {
    const node = this.find(name);
    return node ? this._clone(node) : null;
  }

  /** Returns a flat array of all descendants starting from a node */
  getFlatDescendants(name) {
    const node = this.find(name);
    const result = [];
    const walk = (n) => {
      result.push(n.name);
      for (const child of n.children) walk(child);
    };
    if (node) walk(node);
    return result;
  }

  /** Internal recursive node lookup */
  _findNodeRecursive(name, nodes, parent = null) {
    for (const node of nodes) {
      if (node.name === name) return { node, parent };
      const found = this._findNodeRecursive(name, node.children, node);
      if (found) return found;
    }
    return null;
  }

  _clone(node) {
    const copy = new TreeNode(node.name);
    copy.children = node.children.map((c) => this._clone(c));
    return copy;
  }

  /** Convert tree structure into compact YAML-style object format */
  toObject() {
    const convert = (node) => {
      if (node.children.length === 0) {
        return node.name;
      }

      const childArray = node.children.map(convert);
      return { [node.name]: childArray };
    };

    return this.rootNodes.map(convert);
  }

  /** Get all node names (DFS) */
  getAllFilenames() {
    return this.getFlatDescendantsList(this.rootNodes);
  }

  getFlatDescendantsList(nodes) {
    const result = [];
    const walk = (n) => {
      result.push(n.name);
      for (const child of n.children) walk(child);
    };
    for (const node of nodes) walk(node);
    return result;
  }

  printTree(indent = "  ") {
    const walk = (nodes, level = 0) => {
      for (const node of nodes) {
        console.log(indent.repeat(level) + node.name);
        walk(node.children, level + 1);
      }
    };
    walk(this.rootNodes);
  }

  toMap() {
    const map = new Map();
    const walk = (node) => {
      map.set(node.name, node);
      for (const child of node.children) walk(child);
    };
    for (const root of this.rootNodes) walk(root);
    return map;
  }

  initStructure(sections) {
    this.rootNodes = sections.map((data) => this._rebuildNodeTree(data));
  }

  /** Load structure from a YAML file. Fall back to inferred structure if file is missing. */
  async loadStructure() {
    if (!existsSync(this.filePath)) {
      this.#inferred = await this.inferStructure();
      this.rootNodes = this.#inferred.map((name) => new TreeNode(name));
      if (this.#inferred.length > 1) await this.saveStructure();
      return;
    } else {
      this.#inferred = null;
    }

    try {
      const content = await fs.readFile(this.filePath, "utf8");
      const raw = yaml.load(content)?.sections || [];
      console.log("raw", raw);
      this.rootNodes = raw.map((data) => this._rebuildNodeTree(data));
      // console.log("rootNodes", this.rootNodes);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      this.rootNodes = [];
    }
  }

  async saveStructure() {
    const text = await fs.readFile(this.filePath, "utf8");
    let content = yaml.load(text) || {};
    content.sections = this.toObject();
    content = yaml.dump(raw);
    //const raw = this.toObject();
    // const content = yaml.dump(raw);
    await fs.mkdir(this.dirPath, { recursive: true });
    await fs.writeFile(this.filePath, content, "utf8");
    this.#inferred = null;
  }

  /** If no structure file exists, infer flat structure from .md files, sorted by creation time */
  async inferStructure() {
    try {
      const files = await fs.readdir(this.dirPath, { withFileTypes: true });
      const markdownFiles = [];

      for (const file of files) {
        if (file.isFile() && file.name.endsWith(".md")) {
          const fullPath = path.join(this.dirPath, file.name);
          const stat = await fs.stat(fullPath);
          markdownFiles.push({
            name: file.name.replace(/\.md$/, ""),
            ctime: stat.ctimeMs,
          });
        }
      }

      markdownFiles.sort((a, b) => a.ctime - b.ctime);
      return markdownFiles.map((f) => f.name);
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
  }

  _rebuildNodeTree(entry) {
    if (typeof entry === "string") {
      return new TreeNode(entry);
    }

    if (typeof entry === "object" && entry !== null) {
      const [key, value] = Object.entries(entry)[0];
      const node = new TreeNode(key);

      if (Array.isArray(value)) {
        node.children = value.map((child) => this._rebuildNodeTree(child));
      } else if (typeof value === "object") {
        node.children = Object.entries(value).map(([k, v]) =>
          this._rebuildNodeTree({ [k]: v })
        );
      }

      return node;
    }

    throw new Error("Invalid structure entry");
  }

  /** Fix structure based on actual .md files: remove dead references, promote orphans */
  async syncToFilesystem() {
    const existingFiles = new Set();
    const files = await fs.readdir(this.dirPath);
    for (const file of files) {
      if (file.endsWith(".md")) {
        existingFiles.add(file.replace(/\.md$/, ""));
      }
    }

    const fixTree = (nodes, parentExists) => {
      const result = [];
      for (const node of nodes) {
        const hasFile = existingFiles.has(node.name);
        if (!hasFile && node.children.length > 0) {
          // Promote children if parent file is missing
          result.push(...fixTree(node.children, false));
        } else if (hasFile || parentExists) {
          node.children = fixTree(node.children, hasFile);
          if (hasFile) result.push(node);
        }
        // Else, node and children are discarded
      }
      return result;
    };

    const allValidNames = new Set([...existingFiles]);
    const allTreeNames = new Set(this.getAllFilenames());
    const orphans = [...existingFiles].filter(
      (name) => !allTreeNames.has(name)
    );

    this.rootNodes = fixTree(this.rootNodes, true);

    for (const name of orphans) {
      this.rootNodes.push(new TreeNode(name));
    }
  }
}
