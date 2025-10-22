import { readFile, readdir } from "node:fs/promises";
import path from "path";
import yaml from "js-yaml";

export async function readMarkdownFile(filePath) {
  try {
    const content = await readFile(filePath, "utf8");
    return await processMarkdown(content);
  } catch (err) {
    throw createError(`Failed to read markdown file ${name}`, {
      cause: err,
      path: filePath,
    });
  }
}

async function processMarkdown(content) {
  let data = {};

  // Process front matter if present
  if (content.trim().startsWith("---")) {
    const parts = content.split("---\n");
    if (parts.length >= 3) {
      try {
        data = yaml.load(parts[1]);
        content = parts.slice(2).join("---\n");
      } catch (err) {
        throw createError("Invalid front matter", { cause: err });
      }
    }
  }

  return { content, data };
}

export async function loadMarkdownFiles(dirPath) {
  const content = [];

  try {
    const entries = await readdir(dirPath, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const nested = await loadMarkdownFiles(path.join(dirPath, entry.name));
        content.push(...nested);
      } else if (entry.name.endsWith(".md")) {
        const filePath = path.join(dirPath, entry.name);
        const fileContent = await readMarkdownFile(filePath);
        content.push({ filePath, ...fileContent });
      }
    }
  } catch (error) {
    // Ignore if directory doesn't exist
    if (error.code !== "ENOENT") {
      console.warn("Failed to load markdown files:", error.message);
    }
  }

  return content;
}

export function createError(message, details = {}) {
  const error = new Error(message);
  Object.assign(error, details);
  return error;
}
