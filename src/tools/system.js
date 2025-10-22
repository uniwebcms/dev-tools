import path from "path";
import cliContext from "../context.js";
import { resolveSection, resolvePage, resolveProject } from "../utils/file.js";
import { openInEditor } from "../utils/shell.js";

/**
 * Opens the specified resource in the default editor
 *
 * @param {string} name - Name of resource to edit (can include extension)
 * @param {string} [locale=""] - Optional locale code for editing translations
 * @param {string} [page=""] - Optional page name when not in page directory
 * @param {string} [site=""] - Optional site name when not in site directory
 * @returns {Promise<void>}
 */
export async function edit(name, locale, page, site) {
  const filePath = await resolveResource(name, locale, page, site);
  await openInEditor(filePath);
}

/**
 * Execute multiple commands in sequence or in parallel.
 *
 * @private Only available for CLI users (not AI agents)
 *
 * @param {string} commands - A string with commands separated by semicolon (;)
 * @param {boolean} skip - Skip errors and continue running
 * @param {boolean} parallel - Run commands in parallel
 */
export async function run(commands, skip = false, parallel = false) {
  const program = cliContext.getProgram();
  const commandList = parseCommands(commands);

  if (parallel) {
    await Promise.allSettled(
      commandList.map((cmd) => executeCommand(cmd, program, skip))
    );
  } else {
    for (const cmd of commandList) {
      try {
        await executeCommand(cmd, program, skip);
      } catch (error) {
        if (!skip) {
          throw error;
        }
        console.error(`Command failed: ${cmd}. Error: ${error.message}`);
      }
    }
  }
}

/**
 * Execute a single command using the program's command structure
 * @param {string} cmdString - The command string to execute
 * @param {Command} program - The commander program instance
 * @param {boolean} skip - Whether to skip errors
 */
async function executeCommand(cmdString, program, skip) {
  // Split the command string into arguments
  const args = parseCommandArgs(cmdString);

  if (args.length === 0) return;

  const commandName = args[0];

  // Find the matching command in the program
  const command = findCommand(program, commandName);

  if (!command) {
    const error = new Error(`Unknown command: ${commandName}`);
    if (skip) {
      console.error(error.message);
      return;
    }
    throw error;
  }

  // Execute the command
  try {
    // Special handling for the 'go' command since it changes the CWD
    if (commandName === "go") {
      // Make sure the CWD change persists for subsequent commands
      await command._actionHandler(args.slice(1), command);
      // Note: No need to do anything special since process.chdir() will
      // change the CWD for the current process and all subsequent commands
    } else {
      await command._actionHandler(args.slice(1), command);
    }
  } catch (error) {
    if (!skip) {
      throw error;
    }
    console.error(`Command execution failed: ${error.message}`);
  }
}

/**
 * Resolves a resource to its file path based on type and context
 */
async function resolveResource(name, locale, page, site) {
  if (name === "uniweb.config.js") {
    const project = await resolveProject();
    return path.join(project.path, name);
  }

  // Determine resource type from extension, defaulting to section (.md)
  let type = "section";

  if (name.includes(".")) {
    const parts = name.split(".");
    const extension = parts.pop().toLowerCase();
    name = parts.join(".");

    // Map extensions to resource types
    const typeMap = {
      md: "section",
      yml: "config",
      // Add other mappings as needed
    };

    type = typeMap[extension] || "section";
  }

  if (type === "section") {
    return (await resolveSection(name, page, site)).filePath;
  } else if (type === "config") {
    return path.join((await resolvePage(page, site)).dirPath, "page.yml");
  }
  // Add other resource types as needed

  throw new Error(`Unsupported resource type: ${type}`);
}

/**
 * Find a command in the program by name
 * @param {Command} program - The commander program
 * @param {string} name - The command name to find
 * @returns {Command|null} The found command or null
 */
function findCommand(program, name) {
  // First check if it's a direct command
  for (const cmd of program.commands) {
    if (cmd.name() === name) {
      return cmd;
    }

    // Check subcommands
    for (const subCmd of cmd.commands) {
      if (`${cmd.name()} ${subCmd.name()}` === name) {
        return subCmd;
      }
    }
  }

  return null;
}

/**
 * Parse command string into arguments, respecting quotes
 * @param {string} cmd - The command string
 * @returns {string[]} Array of arguments
 */
function parseCommandArgs(cmd) {
  const args = [];
  let current = "";
  let inQuotes = false;
  let quoteChar = "";

  for (let i = 0; i < cmd.length; i++) {
    const char = cmd[i];

    if ((char === '"' || char === "'") && (!inQuotes || quoteChar === char)) {
      inQuotes = !inQuotes;
      if (inQuotes) quoteChar = char;
      else quoteChar = "";
    } else if (char === " " && !inQuotes) {
      if (current) {
        args.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }

  if (current) {
    args.push(current);
  }

  return args;
}

/**
 * Parse a string into individual commands, respecting quotes and handling special characters
 * @param {string} input - The command string to parse
 * @returns {string[]} Array of parsed commands
 * @throws {Error} If quotes are unmatched or invalid separators are used
 */
function parseCommands(input) {
  const commands = [];
  let buffer = "";
  let quote = null;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    // Handle escape character
    if (char === "\\" && !escaped) {
      escaped = true;
      continue;
    }

    if (escaped) {
      // Add the escaped character to the buffer
      buffer += char;
      escaped = false;
      continue;
    }

    // Handle quotes
    if ((char === '"' || char === "'") && !escaped) {
      if (quote === char) {
        quote = null; // Close the quote
      } else if (quote === null) {
        quote = char; // Open a new quote
      } else {
        // Different quote character inside an already quoted string
        buffer += char;
      }
    }
    // Handle command separators (only if not in quotes)
    else if (char === ";" && !quote) {
      // Add the command to the list if it's not empty
      const trimmed = buffer.trim();
      if (trimmed) {
        commands.push(trimmed);
      }
      buffer = "";
    }
    // Handle comments (only if not in quotes)
    else if (char === "#" && !quote) {
      // Skip until the end of the line
      while (i < input.length && input[i] !== "\n") {
        i++;
      }
    }
    // Explicitly disallow using & as a separator to prevent confusion
    else if (char === "&" && !quote) {
      throw new Error("'&' is not a valid command separator. Use ';' instead.");
    }
    // All other characters
    else {
      buffer += char;
    }
  }

  // Handle any remaining command in the buffer
  const trimmed = buffer.trim();
  if (trimmed) {
    commands.push(trimmed);
  }

  // Check for unmatched quotes
  if (quote !== null) {
    throw new Error(
      `Unmatched ${quote} quote detected. Ensure all quotes are closed properly.`
    );
  }

  // Check for trailing escape character
  if (escaped) {
    throw new Error("Trailing escape character (\\) found at end of input.");
  }

  return commands;
}
