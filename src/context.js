import { OutputBuffer } from "./utils/output-buffer.js";

/**
 * CLI Context that holds shared state and references
 */
class CLIContext {
  constructor() {
    this.program = null;
    this.toolHandler = null;
    this.options = {};
    // this.chalk = null;
    this.buffer = new OutputBuffer();
    this.chalk = this.buffer.getStyler();
  }

  /**
   * Initialize the context with program and tools
   * @param {Object} program Commander program instance
   * @param {Object} toolHandler Tool handler instance
   * @param {Object} [options] Global options from the CLI tool
   * @param {Object} [formatters] - Chalk-like methods to format output
   */
  initialize(program, toolHandler, options = {}, formatters = {}) {
    this.program = program;
    this.toolHandler = toolHandler;
    this.options = options;
    // this.chalk = formatters.chalk;
    this.buffer.setFormatters(formatters);
  }
  addOptions(options) {
    this.options = { ...this.options, ...options };
    if (options.json) {
      this.buffer.setMode("json");
    }
    this.buffer.setVerbosity(this.getVerbosity());
  }
  getVerbosity() {
    const { debug, verbose, quiet } = this.options;
    return debug ? "debug" : verbose ? "verbose" : quiet ? "quiet" : "normal";
  }
  /**
   * Get the program instance
   * @returns {Object} Commander program instance
   */
  getProgram() {
    if (!this.program) {
      throw new Error("CLI Context not initialized");
    }
    return this.program;
  }

  /**
   * Get the tool handler
   * @returns {Object} Tool handler instance
   */
  getToolHandler() {
    if (!this.toolHandler) {
      throw new Error("CLI Context not initialized");
    }
    return this.toolHandler;
  }
}

// Create a singleton instance
const cliContext = new CLIContext();
const { buffer, chalk } = cliContext;
const logger = buffer;

export default cliContext;

export { buffer, chalk, logger };
