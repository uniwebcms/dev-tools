/**
 * ToolRegistry - Internal class for managing tool registration and execution
 */

import { ToolValidationError, ToolExecutionError } from "../utils/errors.js";

// Import the generated tools metadata
import toolsMetadata from "../generated/tools-metadata.js";

// Import all tools from the generated index
import * as tools from "../generated/tools-index.js";

/**
 * ToolRegistry manages the collection of available tools and provides
 * methods for tool lookup and execution.
 */
export class ToolRegistry {
  /**
   * Create a new ToolRegistry
   */
  constructor() {
    this.tools = new Map();
    this.metadata = new Map();
    this.#loadTools();
  }

  /**
   * Get all tool definitions for AI function calling
   * @returns {Array} Array of tool definitions
   */
  getToolDefinitions() {
    const definitions = [];

    for (const [name, metadata] of this.metadata.entries()) {
      // Only include public tools (skip protected and private)
      if (metadata.visibility && metadata.visibility !== "public") {
        continue;
      }

      definitions.push({
        name,
        description: metadata.description || `Execute the ${name} function`,
        parameters: {
          type: "object",
          properties: this.#convertParamsToProperties(metadata.params || []),
          required: this.#getRequiredParams(metadata.params || []),
        },
      });
    }

    return definitions;
  }

  /**
   * Get tool definitions formatted for CLI usage
   * @returns {Object} Nested command structure for CLI
   */
  getCLICommands() {
    const commands = [];

    for (const [name, metadata] of this.metadata.entries()) {
      // Skip private tools
      if (metadata.visibility && metadata.visibility === "private") {
        continue;
      }

      // Convert function name to command parts
      // E.g., getSiteConfig -> ['site', 'config', 'get']
      const parts = this.#functionNameToCommandParts(name);

      commands.push({
        command: parts,
        ...metadata,
      });

      // // Add command to structure
      // let current = commandStructure;
      // for (let i = 0; i < parts.length - 1; i++) {
      //   if (!current[parts[i]]) {
      //     current[parts[i]] = {};
      //   }
      //   current = current[parts[i]];
      // }

      // Add the leaf command with its metadata
      // const commandName = parts[parts.length - 1];
      // current[commandName] = {
      //   module: metadata.module,
      //   name: commandName,
      //   function: name,
      //   description: metadata.description || "",
      //   params: metadata.params || [],
      // };
    }

    return commands;
  }

  /**
   * Check if a tool is registered
   * @param {string} name - Name of the tool to check
   * @returns {boolean} Whether the tool is registered
   */
  hasTool(name) {
    return this.tools.has(name);
  }

  /**
   * Get all registered tool names
   * @returns {Array<string>} Array of registered tool names
   */
  getToolNames() {
    return Array.from(this.tools.keys());
  }

  /**
   * Get metadata for a specific tool
   * @param {string} name - Name of the tool
   * @returns {Object|undefined} Tool metadata or undefined if not found
   */
  getToolMetadata(name) {
    return this.metadata.get(name);
  }

  /**
   * Use a specific tool with the given parameters
   * @param {string} name - Name of the tool to use
   * @param {Object} parameters - Parameters to pass to the tool
   * @returns {Promise<any>} Result of the tool execution
   * @throws {ToolValidationError} If parameters are invalid
   * @throws {ToolExecutionError} If execution fails
   */
  async useTool(name, parameters = {}) {
    const tool = this.tools.get(name);

    if (!tool) {
      throw new ToolValidationError(`Unknown tool: "${name}"`, {
        toolName: name,
        code: "UNKNOWN_TOOL",
      });
    }

    const metadata = this.metadata.get(name);

    // Validate parameters if metadata is available
    if (metadata && metadata.params) {
      const validationErrors = this.#validateParameters(
        parameters,
        metadata.params
      );
      if (validationErrors.length > 0) {
        throw new ToolValidationError("Parameter validation failed", {
          toolName: name,
          parameters,
          validationErrors,
          code: "PARAMETER_VALIDATION_FAILED",
        });
      }
      // The params look good. Now, normalize their values.
      // this.#normalizeParameterValues(parameters, metadata.params);
    }

    try {
      // Execute the tool with the provided parameters
      const args = this.#prepareToolArguments(metadata, parameters);
      return await tool(...args);
    } catch (error) {
      throw new ToolExecutionError(
        // `Error executing tool "${name}": ${error.message}`,
        error.message,
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
   * Prepare ordered arguments for a tool function from input object
   * @param {Object} meta The tool metadata
   * @param {Object} input The input object
   * @returns {Array} Arguments array for the function
   */
  #prepareToolArguments(meta, input) {
    return meta.params.map((param) => {
      // If parameter is optional and not provided, return undefined
      if (param.optional && input[param.name] === undefined) {
        return undefined;
      }

      const value = input[param.name];

      // Normalize "string boolean" values
      if (typeof value === "string" && param.type === "boolean") {
        return ["true", "1", "yes"].includes(value.toLowerCase());
      }

      return value;
    });
  }

  // #normalizeParameterValues(parameters, paramsMeta) {
  //   for (const [paramName, paramValue] of Object.entries(parameters)) {
  //     const paramMeta = paramsMeta.find((p) => p.name === paramName);

  //     // Unknown parameter
  //     if (!paramMeta) {
  //       errors.push(`Unknown parameter: ${paramName}`);
  //       continue;
  //     }

  //     // Type validation
  //     if (paramMeta.type && paramValue !== undefined) {
  //       if (paramMeta.type === "boolean") {
  //         parameters[paramName] =
  //           paramValue === true ||
  //           paramValue === 1 ||
  //           (typeof paramValue === "string" &&
  //             ["true", "1", "yes"].includes(paramValue.toLowerCase()));
  //       }
  //     }
  //   }
  // }

  /**
   * Load and register all available tools
   * @private
   */
  #loadTools() {
    // Create a map of metadata by name for quick lookup
    const metadataMap = new Map();
    toolsMetadata.forEach((meta) => metadataMap.set(meta.name, meta));

    // Register each tool from the imported tools object
    for (const [name, func] of Object.entries(tools)) {
      if (typeof func === "function") {
        // Only register tools that have metadata
        const toolMeta = metadataMap.get(name);
        if (toolMeta) {
          this.tools.set(name, func);
          this.metadata.set(name, toolMeta);
        }
      }
    }
  }

  /**
   * Convert tool parameters to JSON Schema properties
   * @param {Array} params - Array of parameter objects
   * @returns {Object} Properties object for JSON Schema
   * @private
   */
  #convertParamsToProperties(params) {
    const properties = {};

    for (const param of params) {
      properties[param.name] = {
        type: this.#mapTypeToJsonSchemaType(param.type),
        description: param.description || `Parameter ${param.name}`,
      };

      // Add additional properties based on parameter type
      if (param.type === "enum" && param.values) {
        properties[param.name].enum = param.values;
      }

      // Add default value if specified
      if (param.defaultValue !== undefined) {
        properties[param.name].default = param.defaultValue;
      }
    }

    return properties;
  }

  /**
   * Get list of required parameter names
   * @param {Array} params - Array of parameter objects
   * @returns {Array<string>} Array of required parameter names
   * @private
   */
  #getRequiredParams(params) {
    return params.filter((param) => !param.optional).map((param) => param.name);
  }

  /**
   * Map JavaScript/JSDoc type to JSON Schema type
   * @param {string} type - JavaScript/JSDoc type
   * @returns {string} JSON Schema type
   * @private
   */
  #mapTypeToJsonSchemaType(type) {
    if (!type) return "string";

    const typeMap = {
      string: "string",
      number: "number",
      boolean: "boolean",
      object: "object",
      array: "array",
      null: "null",
      undefined: "null",
      any: "string",
      enum: "string",
      function: "string",
      symbol: "string",
      bigint: "string",
      date: "string",
    };

    // Remove any generic type parameters, e.g., Array<string> -> Array
    const baseType = type.replace(/<.*>/, "").trim();

    return typeMap[baseType.toLowerCase()] || "string";
  }

  /**
   * Convert function name to command parts
   * @param {string} functionName - Function name (e.g., getSiteConfig)
   * @returns {Array<string>} Command parts (e.g., ['site', 'config', 'get'])
   * @private
   */
  #functionNameToCommandParts(functionName) {
    // Extract the action verb (first part of camel case)
    const match = functionName.match(/^([a-z]+)([A-Z].*)/);
    if (!match) return [functionName.toLowerCase()];

    const [_, verb, rest] = match;

    // Split the rest into parts
    const parts = this.#splitCamelCase(rest);

    // Get the module name for this function
    const metadata = this.metadata.get(functionName);
    const moduleName = metadata?.module?.toLowerCase();

    // Basic case: just verb + resource
    if (parts.length === 1) {
      return [parts[0].toLowerCase(), verb];
      // return [verb, parts[0].toLowerCase()];
    }

    // Standard case: verb + resource + subresource
    if (parts.length === 2) {
      return [parts[0].toLowerCase(), parts[1].toLowerCase(), verb];
      // return [verb, parts[0].toLowerCase(), parts[1].toLowerCase()];
    }

    // return [verb, ...parts.map((p) => p.toLowerCase())];

    // Complex case: check if the first parts form a compound resource
    // that matches the module name
    if (parts.length >= 3 && moduleName) {
      const firstPart = parts[0].toLowerCase();

      // If first part matches module name, it might be a compound resource
      if (firstPart === moduleName) {
        // Try to use the module name as guidance
        return [firstPart, ...parts.slice(1).map((p) => p.toLowerCase()), verb];
      }

      // Or if first two parts combined match a compound module name
      const compoundResource = `${parts[0].toLowerCase()}-${parts[1].toLowerCase()}`;
      if (compoundResource === moduleName) {
        return [
          compoundResource,
          ...parts.slice(2).map((p) => p.toLowerCase()),
          verb,
        ];
      }
    }

    // Default: assume first part is resource, rest are subresources
    return [
      parts[0].toLowerCase(),
      ...parts.slice(1).map((p) => p.toLowerCase()),
      verb,
    ];
  }

  /**
   * Split a camelCase string into parts
   * @param {string} camelCase - camelCase string
   * @returns {Array<string>} Parts of the string
   * @private
   */
  #splitCamelCase(camelCase) {
    return camelCase.replace(/([a-z])([A-Z])/g, "$1 $2").split(" ");
  }

  /**
   * Validate parameters against metadata
   * @param {Object} parameters - Parameters to validate
   * @param {Array} paramsMeta - Parameter metadata
   * @returns {Array} Array of validation error messages
   * @private
   */
  #validateParameters(parameters, paramsMeta) {
    const errors = [];

    // Check required parameters
    for (const paramMeta of paramsMeta) {
      if (!paramMeta.optional && parameters[paramMeta.name] === undefined) {
        errors.push(`Missing required parameter: ${paramMeta.name}`);
      }
    }

    // Check parameter types and values
    for (const [paramName, paramValue] of Object.entries(parameters)) {
      const paramMeta = paramsMeta.find((p) => p.name === paramName);

      // Unknown parameter
      if (!paramMeta) {
        errors.push(`Unknown parameter: ${paramName}`);
        continue;
      }

      // Type validation
      if (paramMeta.type && paramValue !== undefined) {
        if (!this.#validateParameterType(paramValue, paramMeta.type)) {
          errors.push(
            `Invalid type for parameter ${paramName}: expected ${paramMeta.type}`
          );
        }
      }

      // Enum validation
      if (
        paramMeta.type === "enum" &&
        paramMeta.values &&
        paramValue !== undefined
      ) {
        if (!paramMeta.values.includes(paramValue)) {
          errors.push(
            `Invalid value for parameter ${paramName}: must be one of [${paramMeta.values.join(
              ", "
            )}]`
          );
        }
      }
    }

    return errors;
  }

  #isNumeric(str) {
    return typeof str === "string" && !isNaN(str) && !isNaN(parseFloat(str));
  }

  /**
   * Validate parameter type
   * @param {any} value - Parameter value
   * @param {string} type - Expected type
   * @returns {boolean} Whether the value matches the expected type
   * @private
   */
  #validateParameterType(value, type) {
    switch (type.toLowerCase()) {
      case "string":
        return typeof value === "string";
      case "number":
        return typeof value === "number" || this.#isNumeric(value);
      case "boolean":
        return (
          typeof value === "boolean" ||
          ["true", "false", "0", "1", "yes", "no"].includes(value.toLowerCase())
        );
      case "object":
        return (
          typeof value === "object" && value !== null && !Array.isArray(value)
        );
      case "array":
        return Array.isArray(value);
      case "null":
        return value === null;
      case "enum":
        return typeof value === "string"; // Enums are validated separately
      case "any":
        return true;
      default:
        return true; // Unknown types pass validation
    }
  }
}
