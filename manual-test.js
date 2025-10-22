/**
 * Manual test script to show actual outputs from the library.
 * Run with: node manual-test.js
 */

import { ToolHandler } from "./src/ToolHandler.js";

// Create a new ToolHandler instance
const toolHandler = new ToolHandler();

// Helper to output results in a readable format
function printResult(label, data) {
  console.log(`\n===== ${label} =====`);
  console.log(JSON.stringify(data, null, 2));
  console.log("=".repeat(label.length + 12));
}

// 1. Get the first few tool definitions (what an AI would see)
const toolDefinitions = toolHandler.getToolDefinitions();
printResult("Tool Definitions (First 3)", toolDefinitions.slice(0, 3));

// 2. Get a sample of the CLI command structure
const commandStructure = toolHandler.getToolCommandStructure();
// Extract just the site and page parts for readability
const sampleCommandStructure = {
  site: commandStructure.site,
  page: commandStructure.page,
};
printResult("CLI Command Structure Sample", sampleCommandStructure);

// 3. Get available prompts
try {
  const availablePrompts = toolHandler.getAvailablePrompts();
  printResult("Available Prompts", availablePrompts);

  // 4. Build a prompt if any are available
  if (availablePrompts.length > 0) {
    const promptId = availablePrompts[0];
    try {
      const promptResult = toolHandler.buildPrompt(promptId);
      // Truncate the system prompt for display
      const promptPreview = {
        systemPrompt: promptResult.systemPrompt.substring(0, 200) + "...",
        tools: promptResult.tools.slice(0, 3), // Show only first 3 tools
      };
      printResult(`Built Prompt "${promptId}" (Preview)`, promptPreview);
    } catch (error) {
      console.log(`\nError building prompt "${promptId}": ${error.message}`);
    }
  }
} catch (error) {
  console.log("\nNo prompts available yet: ", error.message);
}

// 5. Show tool validation in action
try {
  console.log("\n===== Tool Validation Example =====");
  // Try to use a tool with missing parameters
  try {
    await toolHandler.useTool("getSiteConfig", {});
  } catch (error) {
    console.log(`Expected error: ${error.message}`);
    if (error.details && error.details.validationErrors) {
      console.log("Validation errors:", error.details.validationErrors);
    }
  }
  console.log("===================================");
} catch (error) {
  console.log(`\nError demonstrating validation: ${error.message}`);
}

// Log the available tools by module
console.log("\n===== Tools By Module =====");
const toolsByModule = {};
const toolNames = toolHandler.toolRegistry.getToolNames();

for (const name of toolNames) {
  const metadata = toolHandler.toolRegistry.getToolMetadata(name);
  if (metadata && metadata.module) {
    if (!toolsByModule[metadata.module]) {
      toolsByModule[metadata.module] = [];
    }
    toolsByModule[metadata.module].push(name);
  }
}

// Print each module's tools
for (const [module, tools] of Object.entries(toolsByModule)) {
  console.log(`\n${module}:`);
  for (const tool of tools) {
    console.log(`  - ${tool}`);
  }
}
console.log("===========================");
