# Uniweb Dev Tools

A powerful set of tools for the Uniweb framework that provide functionality for both AI agents and command-line interfaces.

## Features

- Tool-based architecture for composable operations and AI integration
- Templates for projects, sites, modules, and components
- CLI command structures for site and module management
- Consistent error handling and validation

## Installation

```bash
npm install @uniwebcms/dev-tools
```

## Usage

### Basic Usage

```javascript
import { ToolHandler } from "@uniwebcms/dev-tools";

// Create a tool handler
const toolHandler = new ToolHandler();

// Build a system prompt for a specific context
const { systemPrompt, tools } = toolHandler.buildPrompt("developer");

// Use tools
const siteConfig = await toolHandler.useTool("getSiteConfig", {
  name: "my-site",
});
```

### AI Agent Integration

```javascript
import { ToolHandler } from "@uniwebcms/dev-tools";

// Initialize the tool handler
const toolHandler = new ToolHandler();

// Get a system prompt for an AI agent
const { systemPrompt, tools } = toolHandler.buildPrompt("system");

// Set up AI with the system prompt and tools
const aiConfig = {
  systemPrompt,
  tools: toolHandler.getToolDefinitions(),
};

// Handle tool usage requests from the AI
async function handleToolUse(toolName, parameters) {
  try {
    return await toolHandler.useTool(toolName, parameters);
  } catch (error) {
    return { error: error.message };
  }
}
```

### CLI Integration

Automattic command registration:

```javascript
import { Command } from "commander";
import { ToolHandler } from "@uniwebcms/dev-tools";

const program = new Command();
const toolHandler = new ToolHandler();

// Register all commands with Commander
toolHandler.toolRegistry.registerCommands(program);

// Parse command line arguments
program.parse(process.argv);
```

Manual command registration:

```javascript
import { ToolHandler, enableSelfCalls } from "@uniwebcms/dev-tools";
import { Command } from "commander";

// Initialize
const toolHandler = new ToolHandler();
const program = new Command();

// Optional: let the `run` command run other commands
enableSelfCalls(program, toolHandler);

// Get command structure
const commandStructure = toolHandler.getToolCommandStructure();

// Build CLI commands from structure
function buildCommands(structure, parentCommand = program) {
  for (const [name, value] of Object.entries(structure)) {
    if (value.function) {
      // Leaf command - add action
      parentCommand
        .command(name)
        .description(value.description || "")
        .action(async (options) => {
          try {
            const result = await toolHandler.useTool(value.function, options);
            console.log(result);
          } catch (error) {
            console.error(`Error: ${error.message}`);
          }
        });
    } else {
      // Branch - create subcommand
      const subCommand = parentCommand.command(name);
      buildCommands(value, subCommand);
    }
  }
}

buildCommands(commandStructure);
program.parse(process.argv);
```

## System Prompts

The library includes predefined system prompts for different contexts:

- `system` - Base system prompt with core Uniweb concepts
- `developer` - Context for module and component developers
- `content-creator` - Context for content authors
- `adaptive` - Combines multiple contexts based on availability

## Error Handling

The library provides specific error classes for different types of failures:

```javascript
import { ToolValidationError, ToolExecutionError } from "@uniwebcms/dev-tools";

try {
  await toolHandler.useTool("getSiteConfig", { name: "my-site" });
} catch (error) {
  if (error instanceof ToolValidationError) {
    // Handle validation error (e.g., missing required parameter)
  } else if (error instanceof ToolExecutionError) {
    // Handle execution error (e.g., site not found)
  } else {
    // Handle other errors
  }
}
```

## License

GPL-3.0-or-later - see LICENSE for details
