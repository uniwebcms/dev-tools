/**
 * PromptRegistry - Internal class for managing prompt loading and access
 */

import promptsData from "../generated/prompts-data.js";

/**
 * PromptRegistry manages the collection of available prompts and provides
 * methods for prompt lookup.
 */
export class PromptRegistry {
  /**
   * Create a new PromptRegistry
   */
  constructor() {
    this.prompts = new Map();
    this.#loadPrompts();
  }

  /**
   * Get a prompt by ID
   * @param {string} id - ID of the prompt
   * @returns {Object|undefined} Prompt object or undefined if not found
   */
  getPrompt(id) {
    return this.prompts.get(id);
  }

  /**
   * Get all available prompt IDs
   * @returns {Array<string>} Array of prompt IDs
   */
  getAvailablePrompts() {
    return Array.from(this.prompts.keys());
  }

  /**
   * Get prompts by category
   * @param {string} category - Category to filter by
   * @returns {Array<Object>} Array of prompts in the category
   */
  getPromptsByCategory(category) {
    const result = [];

    for (const prompt of this.prompts.values()) {
      if (prompt.category === category) {
        result.push(prompt);
      }
    }

    return result;
  }

  /**
   * Load prompts from the generated data
   * @private
   */
  #loadPrompts() {
    for (const prompt of promptsData) {
      this.prompts.set(prompt.id, prompt);
    }
  }
}
