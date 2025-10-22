/**
 * Custom error classes for the Uniweb Dev Tools library
 */

/**
 * Base error class for tool-related errors
 */
export class ToolError extends Error {
  /**
   * Create a new ToolError
   * @param {string} message - Error message
   * @param {Object} details - Additional error details
   */
  constructor(message, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;

    // Capture code if provided
    if (details.code) {
      this.code = details.code;
    }

    // Capture cause if provided
    if (details.cause) {
      this.cause = details.cause;
    }

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when tool validation fails
 */
export class ToolValidationError extends ToolError {
  /**
   * Create a new ToolValidationError
   * @param {string} message - Error message
   * @param {Object} details - Additional error details
   */
  constructor(message, details = {}) {
    super(message, details);
    this.toolName = details.toolName;
    this.parameters = details.parameters;
    this.validationErrors = details.validationErrors;
  }

  toString() {
    return [
      `ToolValidationError: ${this.message}`,
      `  Tool: ${this.toolName}`,
      `  Parameters: ${JSON.stringify(this.parameters, null, 2)}`,
      `  Validation Errors: ${JSON.stringify(this.validationErrors, null, 2)}`,
      `  Code: ${this.code}`,
    ].join("\n");
  }
}

/**
 * Error thrown when tool execution fails
 */
export class ToolExecutionError extends ToolError {
  /**
   * Create a new ToolExecutionError
   * @param {string} message - Error message
   * @param {Object} details - Additional error details
   */
  constructor(message, details = {}) {
    // const functionName = ToolExecutionError.extractCallingFunction();
    // const extendedMessage = `${message} (called from ${
    //   functionName || "unknown function"
    // })`;

    super(message, details);

    this.toolName = details.toolName;
    this.parameters = details.parameters;

    // this.functionName = functionName; //this.extractCallingFunction();
  }

  static extractCallingFunction() {
    const err = new Error();
    const stackLines = err.stack.split("\n");

    // Skip lines that are internal to the error classes or constructors
    const skipPatterns = [
      "ToolExecutionError",
      "ToolError",
      "new ",
      "Object.<anonymous>",
      "(internal/", // node internals
      "node:internal",
    ];

    for (let i = 2; i < stackLines.length; i++) {
      const line = stackLines[i].trim();

      // Skip lines that match any skip pattern
      if (skipPatterns.some((pattern) => line.includes(pattern))) {
        continue;
      }

      const match =
        line.match(/^at (\S+) \(([^)]+)\)$/) || line.match(/^at ([^ ]+)$/);
      if (match) {
        return line.replace(/^at /, "");
      }
    }

    return "unknown";
  }

  // extractCallingFunction() {
  //   const stackLines = this.stack.split("\n");

  //   // Skip the first line (error message) and the line for this constructor
  //   for (let i = 2; i < stackLines.length; i++) {
  //     const line = stackLines[i].trim();
  //     // Format: at functionName (file:line:col) OR at file:line:col
  //     const match = line.match(/^at (\S+)/);
  //     if (match) {
  //       const fn = match[1];
  //       if (!fn.includes("ToolExecutionError")) {
  //         return fn;
  //       }
  //     }
  //   }

  //   return undefined;
  // }

  toString() {
    return [
      `ToolExecutionError: ${this.message}`,
      `  Tool: ${this.toolName}`,
      `  Function: ${this.functionName || "Unknown"}`,
      `  Parameters: ${JSON.stringify(this.parameters, null, 2)}`,
      `  Code: ${this.code}`,
    ].join("\n");
  }
}
