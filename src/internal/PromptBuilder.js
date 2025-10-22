/**
 * PromptBuilder - Internal class for building complete prompts with dependencies
 */

import { PromptRegistry } from "./PromptRegistry.js";
import { ToolRegistry } from "./ToolRegistry.js";
import {
  normalizeDependencies,
  extractDependencyIds,
} from "../utils/promptParser.js";

/**
 * PromptBuilder resolves prompt dependencies and builds complete system prompts
 * with all required tools.
 */
export class PromptBuilder {
  /**
   * Create a new PromptBuilder
   */
  constructor() {
    this.promptRegistry = new PromptRegistry();
    this.toolRegistry = new ToolRegistry();
  }

  /**
   * Get all available prompt IDs
   * @returns {Array<string>} Array of prompt IDs
   */
  getAvailablePrompts() {
    return this.promptRegistry.getAvailablePrompts();
  }

  /**
   * Build a complete prompt with dependencies resolved
   * @param {string} promptId - ID of the prompt to build
   * @returns {Object} Object containing the system prompt and required tools
   * @throws {Error} If prompt not found or circular dependency detected
   */
  build(promptId) {
    const prompt = this.promptRegistry.getPrompt(promptId);
    if (!prompt) {
      throw new Error(`Prompt with ID "${promptId}" not found`);
    }

    // Track visited prompts to detect circular dependencies
    const visited = new Set();

    // Resolve dependencies
    const dependencies = this.#resolveDependencies(prompt, visited);

    // Resolve required tools from the main prompt AND its dependencies
    const toolSet = new Set();

    // Get tools from all dependencies
    for (const dependency of dependencies) {
      const dependencyTools = this.#resolveTools(dependency);
      for (const tool of dependencyTools) {
        toolSet.add(tool);
      }
    }

    // Get tools from the main prompt
    const promptTools = this.#resolveTools(prompt);
    for (const tool of promptTools) {
      toolSet.add(tool);
    }

    const tools = Array.from(toolSet);

    // Build the complete prompt
    const systemPrompt = this.#concatenatePrompts([...dependencies, prompt]);

    return {
      systemPrompt,
      tools: tools.map((toolName) => ({
        name: toolName,
        ...this.toolRegistry.getToolMetadata(toolName),
      })),
    };
  }

  /**
   * Resolve all dependencies for a prompt
   * @param {Object} prompt - Prompt object
   * @param {Set} visited - Set of visited prompt IDs (for cycle detection)
   * @returns {Array} Array of dependency prompts in order
   * @private
   */
  #resolveDependencies(prompt, visited = new Set()) {
    // Check for circular dependency
    if (visited.has(prompt.id)) {
      throw new Error(
        `Circular dependency detected involving prompt "${prompt.id}"`
      );
    }

    // Mark as visited
    visited.add(prompt.id);

    // No dependencies
    if (!prompt.depends && !prompt.dependsOn) {
      return [];
    }

    // Get dependencies (support both field names)
    const deps = prompt.depends || prompt.dependsOn || [];
    const dependencies = normalizeDependencies(deps);
    const dependencyIds = extractDependencyIds(dependencies);

    // Process all dependencies
    const resolvedDependencies = [];

    for (const dep of dependencyIds) {
      if (typeof dep === "string") {
        // Simple dependency
        const dependencyPrompt = this.promptRegistry.getPrompt(dep);
        if (!dependencyPrompt) {
          console.warn(
            `Dependency "${dep}" not found for prompt "${prompt.id}"`
          );
          continue;
        }

        // Recursively resolve this dependency's dependencies
        const nestedDependencies = this.#resolveDependencies(
          dependencyPrompt,
          new Set(visited)
        );

        // Add to resolved dependencies
        resolvedDependencies.push(...nestedDependencies);
        resolvedDependencies.push(dependencyPrompt);
      } else if (typeof dep === "object") {
        // Handle complex dependency objects
        if (dep.any && Array.isArray(dep.any) && dep.any.length > 0) {
          // 'any' dependency - try each one in order until one succeeds
          let anyResolved = false;

          for (const anyDep of dep.any) {
            const dependencyPrompt = this.promptRegistry.getPrompt(anyDep);
            if (dependencyPrompt) {
              // Recursively resolve this dependency's dependencies
              const nestedDependencies = this.#resolveDependencies(
                dependencyPrompt,
                new Set(visited)
              );

              // Add to resolved dependencies
              resolvedDependencies.push(...nestedDependencies);
              resolvedDependencies.push(dependencyPrompt);

              anyResolved = true;
              break; // Use the first one that works
            }
          }

          if (!anyResolved) {
            console.warn(
              `None of the alternative dependencies could be resolved for prompt "${prompt.id}"`
            );
          }
        } else if (dep.all && Array.isArray(dep.all)) {
          // 'all' dependency - all must be present
          for (const allDep of dep.all) {
            const dependencyPrompt = this.promptRegistry.getPrompt(allDep);
            if (!dependencyPrompt) {
              console.warn(
                `Required dependency "${allDep}" not found for prompt "${prompt.id}"`
              );
              continue;
            }

            // Recursively resolve this dependency's dependencies
            const nestedDependencies = this.#resolveDependencies(
              dependencyPrompt,
              new Set(visited)
            );

            // Add to resolved dependencies
            resolvedDependencies.push(...nestedDependencies);
            resolvedDependencies.push(dependencyPrompt);
          }
        }
      }
    }

    // Remove duplicates while preserving order
    const uniqueDependencies = [];
    const seenIds = new Set();

    for (const dep of resolvedDependencies) {
      if (!seenIds.has(dep.id)) {
        seenIds.add(dep.id);
        uniqueDependencies.push(dep);
      }
    }

    return uniqueDependencies;
  }

  /**
   * Resolve the required tools for a prompt
   * @param {Object} prompt - Prompt object
   * @returns {Array<string>} Array of tool names
   * @private
   */
  #resolveTools(prompt) {
    // Get tools from the prompt
    const promptTools = prompt.tools || prompt.toolModules || [];

    // Build set of all tools
    const toolSet = new Set();

    // Add tools from the prompt
    if (Array.isArray(promptTools)) {
      for (const tool of promptTools) {
        if (typeof tool === "string") {
          // If tool is a module name, add all public tools from that module
          if (this.#isModuleName(tool)) {
            const moduleTools = this.#getToolsFromModule(tool);
            for (const moduleTool of moduleTools) {
              toolSet.add(moduleTool);
            }
          } else {
            // Otherwise treat as individual tool name
            toolSet.add(tool);
          }
        }
      }
    }

    // Convert set back to array
    return Array.from(toolSet);
  }

  /**
   * Check if a string is likely a module name
   * @param {string} name - Name to check
   * @returns {boolean} Whether it's a module name
   * @private
   */
  #isModuleName(name) {
    // Module names are typically short, singular nouns (site, page, etc.)
    return name.length < 20 && !name.includes("/") && !name.includes(".");
  }

  /**
   * Get all public tools from a module
   * @param {string} moduleName - Name of the module
   * @returns {Array<string>} Array of tool names
   * @private
   */
  #getToolsFromModule(moduleName) {
    const toolNames = this.toolRegistry.getToolNames();
    return toolNames.filter((name) => {
      const metadata = this.toolRegistry.getToolMetadata(name);
      return (
        metadata &&
        metadata.module === moduleName &&
        (!metadata.visibility || metadata.visibility === "public")
      );
    });
  }

  /**
   * Concatenate prompts into a single string
   * @param {Array<Object>} prompts - Array of prompt objects
   * @returns {string} Combined prompt content
   * @private
   */
  #concatenatePrompts(prompts) {
    return prompts
      .map((prompt) => {
        // Add a section header if the prompt has a title
        if (prompt.title) {
          return `## ${prompt.title}\n\n${prompt.content}`;
        }
        return prompt.content;
      })
      .join("\n\n");
  }
}
