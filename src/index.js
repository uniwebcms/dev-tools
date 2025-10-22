/**
 * Uniweb Dev Tools
 *
 * A library for building and managing Uniweb sites through
 * CLI commands and AI agent tools.
 */

// Main interface export
export { ToolHandler } from "./ToolHandler.js";

// Error classes for handling tool errors
export {
  ToolError,
  ToolValidationError,
  ToolExecutionError,
} from "./utils/errors.js";

export * from "./utils/types.js";

export { logger } from "./utils/logger.js";
// export { logger } from "./context.js";

// import cliContext from "./context.js";

// /**
//  * Define the CLI context for tools that need it, like `run`
//  * @example
//  * import {initCLIContext} from "dev-tools";
//  * const toolHandler = new ToolHandler();
//  * const program = new Command();
//  * // define all commands...
//  * initCLIContext(program, toolHandler);
//  * // now a tool can run other CLI commands
//  */
// export function enableSelfCalls(program, toolHandler) {
//   cliContext.initialize(program, toolHandler);
// }

// // Re-export all tools from the generated index
// export * as Tools from "./tools/index.js";
