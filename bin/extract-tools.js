#!/usr/bin/env node
import fs from "fs";
import path from "path";
import ts from "typescript";
import { fileURLToPath } from "url";
import yaml from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, "../src/generated");

/**
 * Extracts a set of all exported function names from a TypeScript source file.
 * @param {ts.SourceFile} sourceFile - The TypeScript source file.
 * @returns {Set<string>} Set of exported function names.
 */
function getExportedFunctions(sourceFile) {
  const exportedFunctions = new Set();

  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name) {
      // Direct export via 'export function'
      if (
        node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword)
      ) {
        exportedFunctions.add(node.name.text);
      }
    }

    // Named exports at the end of the file (e.g., `export { myFunc }`)
    if (
      ts.isExportDeclaration(node) &&
      node.exportClause &&
      ts.isNamedExports(node.exportClause)
    ) {
      for (const element of node.exportClause.elements) {
        exportedFunctions.add(element.name.text);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return exportedFunctions;
}

function cleanType(typeStr) {
  if (!typeStr) return "any";

  // Remove curly braces but preserve other important syntax
  //   let cleaned = typeStr.replace(/[{}]/g, "");
  let cleaned =
    typeStr.startsWith("{") && typeStr.endsWith("}")
      ? typeStr.slice(1, -1)
      : typeStr;

  // Handle union types by normalizing spaces around pipe (|)
  cleaned = cleaned
    .replace(/\s*\|\s*/g, "|") // Normalize space around union type separator
    .replace(/\(\s*(.*?)\s*\)/g, "$1") // Remove unnecessary parentheses
    .replace(/\s+/g, " ") // Convert multiple spaces to single space
    .trim(); // Remove leading/trailing spaces

  return cleaned;
}

function cleanDescription(desc) {
  return desc ? desc.replace(/^- /, "").trim() : ""; // Remove leading "- "
}

function extractDefaultValueFromSignature(node, paramName) {
  if (!node || !node.parameters) return undefined;

  for (const param of node.parameters) {
    if (param.name && param.name.getText() === paramName && param.initializer) {
      return param.initializer.getText().replace(/^["']|["']$/g, ""); // Remove surrounding quotes if string
    }
  }
  return undefined;
}

function extractDefaultValueFromJSDoc(tag, paramName) {
  if (!tag) return undefined;

  const tagText = tag.getFullText();

  // Escape special regex characters in paramName
  const escapedParamName = paramName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // More comprehensive regex pattern to handle various whitespace scenarios
  // This matches [paramName=value] or [paramName = value] with any amount of whitespace
  const defaultValueRegex = new RegExp(
    `\\[\\s*${escapedParamName}\\s*=\\s*([^\\]]+?)\\s*\\]`
  );
  const match = tagText.match(defaultValueRegex);

  if (match && match[1]) {
    return match[1].trim();
  }

  return undefined; // No default value found
}

function extractTools() {
  const TOOLS_DIR = path.resolve(__dirname, "../src/tools");
  const METADATA_FILE = path.join(OUTPUT_DIR, "tools-metadata.js");
  const INDEX_FILE = path.join(OUTPUT_DIR, "tools-index.js");

  // Ensure output directory exists
  if (!fs.existsSync(TOOLS_DIR)) {
    fs.mkdirSync(TOOLS_DIR, { recursive: true });
  }

  const toolRegistry = [];
  const toolExports = [];

  const files = fs
    .readdirSync(TOOLS_DIR)
    .filter((file) => file.endsWith(".js") && file !== "index.js");

  for (const file of files) {
    const moduleName = file.replace(".js", "");
    const filePath = path.join(TOOLS_DIR, file);
    const sourceCode = fs.readFileSync(filePath, "utf8");

    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );

    const exportedFunctions = getExportedFunctions(sourceFile);

    function visit(node) {
      if (ts.isFunctionDeclaration(node) && node.name) {
        const functionName = node.name.text;

        // Checks if the function is in the exported set
        if (!exportedFunctions.has(functionName)) {
          return;
        }

        // Extract JSDoc
        const jsdoc = ts.getJSDocCommentsAndTags(node);
        let description = "";
        const params = [];
        let examples = [];
        let returnInfo = { type: "any", description: "" };
        let visibility = "public"; // Default visibility if not specified

        for (const comment of jsdoc) {
          if (ts.isJSDoc(comment)) {
            description = comment.comment
              ? cleanDescription(comment.comment)
              : "";

            // Extract tags
            for (const tag of comment.tags || []) {
              if (ts.isJSDocParameterTag(tag) && tag.name) {
                const paramName = tag.name.getText(); // TypeScript already removes brackets
                const paramType = cleanType(
                  tag.typeExpression ? tag.typeExpression.getText() : "any"
                );
                let paramDesc = cleanDescription(
                  tag.comment ? tag.comment.trim() : ""
                );
                const isOptional = tag.isBracketed; // Directly check if TypeScript marked it optional

                // Try to extract default value from JSDoc
                let defaultValue = isOptional
                  ? extractDefaultValueFromJSDoc(tag, paramName)
                  : undefined;

                // If no default value in JSDoc, check function signature
                if (defaultValue === undefined) {
                  defaultValue = extractDefaultValueFromSignature(
                    node,
                    paramName
                  );
                }

                params.push({
                  name: paramName,
                  type: paramType,
                  description: paramDesc,
                  optional: isOptional || defaultValue !== undefined, // Mark optional if a default exists
                  defaultValue,
                });
              } else if (ts.isJSDocReturnTag(tag)) {
                // Extract return type and description
                returnInfo.type = tag.typeExpression
                  ? cleanType(tag.typeExpression.getText())
                  : "any";
                returnInfo.description = tag.comment
                  ? cleanDescription(tag.comment)
                  : "";
              } else if (ts.isJSDocTag(tag)) {
                // Check for the example tag and for visibility tags
                const tagName = tag.tagName.getText();
                if (tagName === "example") {
                  examples.push(tag.comment ? tag.comment.trim() : "");
                } else if (
                  ["public", "private", "protected", "package"].includes(
                    tagName
                  )
                ) {
                  visibility = tagName;
                }
              }
            }
          }
        }

        toolRegistry.push({
          module: moduleName,
          name: functionName,
          description,
          params,
          examples,
          ...(returnInfo.type !== "any" && { returns: returnInfo }),
          ...(visibility !== "public" && { visibility }),
        });

        toolExports.push(
          `export { ${functionName} } from "../tools/${moduleName}.js";`
        );
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  }

  // Write the metadata as a JavaScript module
  const metadataContent = `/**
* Generated Tools Metadata - DO NOT EDIT
* This file is automatically generated by extract-tools.js
*/

export default ${JSON.stringify(toolRegistry, null, 2)};
`;

  fs.writeFileSync(METADATA_FILE, metadataContent);

  // Write index.js file to export all tools
  const indexContent = `/**
* Generated Tools index - DO NOT EDIT
* This file is automatically generated by extract-tools.js
*/

${toolExports.join("\n")}
`;

  fs.writeFileSync(INDEX_FILE, indexContent);

  console.log(
    "✅ Tools extracted with correct optional & default values and return documentation!"
  );
}

/**
 * Extract prompts and save them as a JavaScript module
 */
function extractPrompts() {
  const PROMPTS_DIR = path.resolve(__dirname, "../src/prompts");
  const OUTPUT_FILE = path.join(OUTPUT_DIR, "prompts-data.js");

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Check if prompts directory exists
  if (!fs.existsSync(PROMPTS_DIR)) {
    console.log("No prompts directory found. Generating empty prompts file.");
    const emptyContent = `/**
 * Generated Prompts Data - DO NOT EDIT
 * This file is automatically generated by extract-tools.js
 */

export default [];
`;
    fs.writeFileSync(OUTPUT_FILE, emptyContent);
    return;
  }

  // Read all markdown files in the prompts directory
  const promptFiles = fs
    .readdirSync(PROMPTS_DIR, { withFileTypes: true })
    .filter((file) => file.isFile() && file.name.endsWith(".md"));

  const promptsData = [];

  // Process each prompt file
  for (const file of promptFiles) {
    const filePath = path.join(PROMPTS_DIR, file.name);
    const content = fs.readFileSync(filePath, "utf8");

    // Parse front matter using a simple regex approach
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

    if (frontMatterMatch) {
      try {
        const frontMatterText = frontMatterMatch[1];
        const promptContent = frontMatterMatch[2].trim();

        // Parse YAML front matter
        const frontMatter = yaml.load(frontMatterText);

        // Get ID from front matter or filename
        const id = frontMatter.id || path.basename(file.name, ".md");

        // Store prompt data
        promptsData.push({
          id,
          content: promptContent,
          ...frontMatter,
          filePath: file.name,
        });
      } catch (error) {
        console.error(
          `Error processing prompt file ${file.name}:`,
          error.message
        );
      }
    }
  }

  // Generate JavaScript file with prompts data
  const jsContent = `/**
 * Generated Prompts Data - DO NOT EDIT
 * This file is automatically generated by extract-tools.js
 */

export default ${JSON.stringify(promptsData, null, 2)};
`;

  fs.writeFileSync(OUTPUT_FILE, jsContent);
  console.log(`✅ Extracted ${promptsData.length} prompts to ${OUTPUT_FILE}`);
}

extractTools();

extractPrompts();
