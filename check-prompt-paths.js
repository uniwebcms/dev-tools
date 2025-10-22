/**
 * Simple script to check prompt directory paths
 * Run with: node check-prompt-paths.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory path for this file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
console.log("Current script directory:", __dirname);

// Check different potential prompt directories
const possibleDirs = [
  path.resolve(__dirname, "prompts"),
  path.resolve(__dirname, "src", "prompts"),
  path.resolve(__dirname, "src", "internal", "..", "prompts"),
];

console.log("\nChecking possible prompt directories:");
for (const dir of possibleDirs) {
  try {
    if (fs.existsSync(dir)) {
      console.log(`✅ ${dir} exists`);

      // List files in directory
      const files = fs.readdirSync(dir);
      console.log(`   Contains ${files.length} files: ${files.join(", ")}`);
    } else {
      console.log(`❌ ${dir} does not exist`);
    }
  } catch (error) {
    console.error(`Error checking ${dir}:`, error.message);
  }
}

// Check for the exact path that PromptRegistry would use
const internalDir = path.resolve(__dirname, "src", "internal");
if (fs.existsSync(internalDir)) {
  console.log("\nPromptRegistry would look for prompts in:");
  const registryPromptsDir = path.resolve(internalDir, "..", "prompts");
  console.log(registryPromptsDir);

  if (fs.existsSync(registryPromptsDir)) {
    console.log("✅ This directory exists");

    // List files in directory
    const files = fs.readdirSync(registryPromptsDir);
    console.log(`   Contains ${files.length} files: ${files.join(", ")}`);
  } else {
    console.log("❌ This directory does not exist");
  }
}

console.log("\nTo fix this issue:");
console.log(
  '1. Create a "prompts" directory at the right location if it does not exist'
);
console.log("2. Make sure your prompt files have .md extension");
console.log(
  "3. Ensure each prompt file has proper front matter with at least an id field"
);
