/**
 * ToolHandler - Main entry point for the Uniweb Dev Tools library.
 * Provides access to tools and prompt building functionality.
 */

import { ToolRegistry } from "./internal/ToolRegistry.js";
import { PromptBuilder } from "./internal/PromptBuilder.js";
import { ToolValidationError, ToolExecutionError } from "./utils/errors.js";
import cliContext from "./context.js";
import { OutputBuffer } from "./utils/output-buffer.js";

/**
 * ToolHandler provides a unified interface for managing tools and system prompts
 * for both AI agents and CLI applications.
 */
export class ToolHandler {
  /**
   * Create a new ToolHandler instance
   */
  constructor() {
    this.toolRegistry = new ToolRegistry();
    this.promptBuilder = new PromptBuilder();
  }

  /**
   * Get tool definitions formatted for AI function calling
   * @returns {Array} Array of tool definitions
   */
  getToolDefinitions() {
    return this.toolRegistry.getToolDefinitions();
  }

  /**
   * Get all available prompt IDs
   * @returns {Array<string>} Array of available prompt IDs
   */
  getAvailablePrompts() {
    return this.promptBuilder.getAvailablePrompts();
  }

  /**
   * Build a complete system prompt with dependencies resolved
   * @param {string} promptId - ID of the prompt to build
   * @returns {Object} Object containing the system prompt and required tools
   */
  buildPrompt(promptId) {
    return this.promptBuilder.build(promptId);
  }

  /**
   * Use a specific tool with the given parameters
   * @param {string} name - Name of the tool to use
   * @param {Object} parameters - Parameters to pass to the tool
   * @returns {Promise<Object>} Result of the tool execution
   * @throws {ToolValidationError} If the tool or parameters are invalid
   * @throws {ToolExecutionError} If the tool execution fails
   */
  async useTool(name, parameters = {}) {
    if (!this.toolRegistry.hasTool(name)) {
      throw new ToolValidationError(`Unknown tool: "${name}"`, {
        toolName: name,
        code: "UNKNOWN_TOOL",
      });
    }

    try {
      return await this.toolRegistry.useTool(name, parameters);
    } catch (error) {
      // Re-throw validation and execution errors directly
      if (error instanceof ToolValidationError) {
        console.error(error.toString());
        throw error;
      }

      if (error instanceof ToolExecutionError) {
        throw error;
      }

      // Wrap other errors in ToolExecutionError
      throw new ToolExecutionError(
        `Error executing tool "${name}": ${error.message}`,
        {
          toolName: name,
          parameters,
          cause: error,
          code: "TOOL_EXECUTION_FAILED",
        }
      );
    }
  }

  /**
   * Check if a tool is available
   * @param {string} name - Name of the tool to check
   * @returns {boolean} Whether the tool is available
   */
  hasTool(name) {
    return this.toolRegistry.hasTool(name);
  }

  /**
   * Get tool definitions formatted for CLI usage
   * @returns {Object} Nested command structure for CLI
   */
  getCLICommands() {
    return this.toolRegistry.getCLICommands();
  }

  /**
   * Registers commands with a Commander program instance
   * @param {Object} program - Commander program instance
   * @param {Object} info - Package information
   * @param {Object} [formatters={}] - Options for the OutputBuffer.
   * @returns {Object} The program with commands registered
   */
  registerCommands(program, info = {}, formatters = {}) {
    cliContext.initialize(program, this, info, formatters);

    program
      .name(info.name || "cli")
      .description(info.description || "")
      .version(info.version || "1.0.0")
      .option("--verbose", "enable verbose output")
      .option("--debug", "enable debug mode")
      .option("--json", "enable json output");

    // Get the flat list of commands
    const commands = this.getCLICommands();

    // Group commands by their path segments to identify command hierarchy
    const commandGroups = new Map();

    // First, organize commands by their full path to detect shared parent commands
    for (const cmd of commands) {
      const path = cmd.command.join(" ");
      commandGroups.set(path, cmd);
    }

    // Cache for already created command objects to avoid duplicates
    const commandCache = new Map();

    // Process each command
    for (const cmd of commands) {
      let currentProgram = program;
      const fullPath = [];

      // Create or navigate the command hierarchy
      for (let i = 0; i < cmd.command.length - 1; i++) {
        const segment = cmd.command[i];
        fullPath.push(segment);
        const currentPath = fullPath.join(" ");

        // Check if we already created this command level
        if (commandCache.has(currentPath)) {
          currentProgram = commandCache.get(currentPath);
        } else {
          // Create a new subcommand at this level
          const newCmd = currentProgram
            .command(segment)
            .description(`${currentPath} commands`);

          commandCache.set(currentPath, newCmd);
          currentProgram = newCmd;
        }
      }

      // Add the final command with its parameters
      let finalSegment = cmd.command[cmd.command.length - 1];

      const firstArg = cmd.params[0] || {};
      const positionalArg =
        !firstArg.optional && firstArg.type === "string" ? firstArg.name : null;

      // console.log({ firstArg, positionalArg, cmd });

      // console.log({ params: cmd.params });
      // const positionalName =
      //   cmd.params[0]?.name === "name" && !cmd.params[0].optional;

      if (positionalArg) finalSegment += ` [${positionalArg}]`;

      const command = currentProgram
        .command(finalSegment)
        .description(cmd.description || "");

      if (positionalArg) {
        command.usage(`<${positionalArg}> [options]`);
      }

      // Add options based on parameters
      if (cmd.params) {
        for (const param of cmd.params) {
          const flag = param.optional
            ? `--${param.name} [value]`
            : `--${param.name} <value>`;

          const defVal = param.defaultValue
            ? JSON.parse(param.defaultValue)
            : param.defaultValue;

          // typeof param.defaultValue === "string"
          //   ? param.defaultValue.replace(/^["']|["']$/g, "")
          //   : param.defaultValue;

          command.option(flag, param.description || "", defVal);
        }
      }

      // Set the action handler
      command.action(async (...args) => {
        const options = args[args.length - 1].opts(); // always the Command object
        if (positionalArg && args.length > 1)
          options[positionalArg] ??= args[0];

        try {
          const result = await this.useTool(cmd.name, options);
          this.printResult(result);
        } catch (error) {
          console.error(`Error: ${error.message}`);
          if (process.env.DEBUG) {
            console.error(error);
          }
          process.exit(1);
        }
      });
    }

    // Set up a hook to capture global options for all commands
    // Make global options available to the CLI context
    program.hook("preAction", (thisCommand) => {
      cliContext.addOptions(thisCommand.opts() || {});
    });

    this.registerHelpCommand(program);

    return program;
  }

  // createActionHandler(cmd, expectsPositional) {
  //   return async (...args) => {
  //     const commandObj = args[args.length - 1]; // always the Command object
  //     const positionalName = expectsPositional ? args[0] : undefined;
  //     const options = commandObj.opts();

  //     // If a positional 'name' is expected, merge it into options
  //     if (expectsPositional && options.name == null) {
  //       options.name = positionalName;
  //     }

  //     try {
  //       const result = await this.useTool(cmd.name, options);
  //       this.printResult(result);
  //     } catch (error) {
  //       console.error(`Error: ${error.message}`);
  //       if (process.env.DEBUG) {
  //         console.error(error);
  //       }
  //       process.exit(1);
  //     }
  //   };
  // }

  /**
   * Prints a result value in a human-readable or JSON format.
   *
   * - For primitive values (string, number, boolean, null, undefined), logs directly.
   * - For arrays of plain objects with primitive values, displays a table.
   * - For other objects and arrays, uses console.dir with full depth and color.
   * - If `json` is true, outputs JSON instead of human formatting.
   *   - Use `pretty` for indented formatting.
   *   - Use `compact` for minified JSON (overrides `pretty` if both are true).
   *
   * @param {*} result - The value to print (string, number, object, array, etc.).
   * @param {Object} [options] - Optional settings.
   * @param {boolean} [options.json=false] - If true, outputs raw JSON.
   * @param {boolean} [options.pretty=false] - Pretty-print JSON with indentation.
   * @param {boolean} [options.compact=false] - Minified JSON output.
   */
  printResult(result, options = {}) {
    const { json = false, pretty = false, compact = false } = options;

    if (cliContext.buffer.size()) {
      cliContext.buffer.print();
      return;
    }

    if (result === undefined) return;

    if (result instanceof OutputBuffer) {
      result.print();
      return;
    }

    const isPrimitive = (val) =>
      val === null ||
      val === undefined ||
      typeof val === "string" ||
      typeof val === "number" ||
      typeof val === "boolean";

    if (json) {
      const spacing = pretty && !compact ? 2 : 0;
      console.log(JSON.stringify(result, null, spacing));
      return;
    }

    if (isPrimitive(result)) {
      console.log(result);
      return;
    }

    if (Array.isArray(result) && result.length) {
      // if (result.length === 0) {
      //   console.log("[]");
      //   return;
      // }

      const isTabular = result.every(
        (item) =>
          item &&
          typeof item === "object" &&
          !Array.isArray(item) &&
          Object.values(item).every(isPrimitive)
      );

      if (isTabular) {
        console.table(result);
        return;
      }
      // else {
      //   console.dir(result, { depth: null, colors: true });
      // }

      // return;
    }

    if (typeof result === "object") {
      console.dir(result, { depth: compact ? 3 : null, colors: true });
      return;
    }

    // Fallback (very rare)
    console.log(String(result));
  }

  registerHelpCommand(program) {
    // Configure help display options
    program.configureHelp({
      sortSubcommands: true,
      subcommandTerm: (cmd) => cmd.name(),
      // Ensure command descriptions are shown clearly
      commandDescription: (cmd) => cmd.description(),
    });

    // Add global help text
    program.addHelpText(
      "after",
      `
Command Structure:
  Commands follow a hierarchical structure (e.g., module config get)
  Use --help at any level to see available options
  
Examples:
  $ myapp module get --name auth           Get complete module info
  $ myapp module config get --name auth    Get module configuration
  $ myapp module components get --name ui  Get module components listing
  `
    );

    // Add a note about how to get help for subcommands
    program.addHelpText(
      "after",
      `
For more help:
  Run '${program.name()} [command] --help' for detailed information about a specific command.
  Example: ${program.name()} page --help
  `
    );

    // Help command (not --help flag)
    program
      .command("help [command...]")
      .description("Display help for a command")
      .action((toolName) => {
        const chalk = cliContext.buffer.chalk;
        if (!chalk) {
          program.help();
        } else if (toolName && toolName.length) {
          console.log(this.#getToolHelp(toolName, chalk));
        } else {
          this.#displayFullHelp(chalk);
        }
      });

    return program;
  }

  #displayFullHelp(chalk) {
    // Define brand colors
    const orange = chalk.hex("#FA8400"); // Orange color for '<'
    const blue = chalk.hex("#00ADFE"); // Blue color for '>'
    const title = chalk.bold; // White for 'Uniweb' (or change as needed)

    // Create the logo string
    console.log(
      `${orange("<")}${blue(">")} ${title("Uniweb CLI Commands:\n")}`
    );

    // console.log(chalk.bold("\nAvailable CLI Commands:\n"));

    // const toolsSet = this.tools;
    const toolsSet = this.getCLICommands();

    // Group commands by module
    const groupedCommands = new Map();

    toolsSet.forEach((tool) => {
      if (!groupedCommands.has(tool.module)) {
        groupedCommands.set(tool.module, []);
      }
      groupedCommands.get(tool.module).push(tool);
    });

    // Print each module's commands
    groupedCommands.forEach((commands, moduleName) => {
      console.log(chalk.blue.bold(`  ${moduleName.toUpperCase()}`)); // Module header

      commands.forEach((tool) => {
        const paramList = tool.params
          .map((param) => {
            let paramText = chalk.yellow(param.name); // Parameter name
            if (param.optional) {
              paramText += chalk.gray(" (optional)");
            }
            if (param.defaultValue !== undefined) {
              paramText += chalk.gray(` [default: ${param.defaultValue}]`);
            }
            return paramText;
          })
          .join(", ");

        console.log(
          `  ${chalk.green(tool.command.join(" "))} - ${tool.description}`
        );
        if (paramList) {
          //   console.log(`    ${chalk.gray("Params:")} ${paramList}`);
          console.log(`    ➤ ${paramList}`);
        }
      });

      console.log(""); // Extra space between modules
    });

    console.log(
      chalk.gray("\nUse 'help <command>' for details on a specific command.\n")
    );
  }

  /**
   * Get CLI help text for a tool
   * @param {string|Array} toolName The tool name
   * @returns {string} Formatted help text
   */
  #getToolHelp(toolName, chalk) {
    // toolName = this.camelToolName(toolName);
    // const tool = this.tools.get(toolName);

    const toolsSet = this.getCLICommands();

    if (Array.isArray(toolName)) {
      toolName = toolName.join(" ");
    }

    const tool = toolsSet.find((tool) => tool.command.join(" ") === toolName);

    if (!tool) {
      //   console.log(this.tools, this.tools.get("addAsset"));
      return `Unknown tool: ${toolName}`;
    }

    let help = `${chalk.bold("Tool:")} ${tool.name}\n`;
    help += `${chalk.bold("Description:")} ${tool.description}\n\n`;

    help += `${chalk.bold("Parameters:")}\n`;
    for (const param of tool.params) {
      const optional = param.optional ? " (optional)" : "";
      help += `  ${chalk.cyan(param.name)}: ${param.type}${optional}\n`;
      help += `    ${param.description}\n`;
    }

    if (tool.examples && tool.examples.length > 0) {
      help += `\n${chalk.bold("Examples:")}\n`;
      for (const example of tool.examples) {
        help += `  ${example}\n`;
      }
    }

    return help;
  }
}
