import { jest, describe, test, expect, beforeEach } from "@jest/globals";
import { PromptBuilder } from "../src/internal/PromptBuilder.js";

describe("PromptBuilder", () => {
  let promptBuilder;

  beforeEach(() => {
    promptBuilder = new PromptBuilder();

    // Mock getPrompt to provide test prompts
    promptBuilder.promptRegistry.getPrompt = jest.fn((id) => {
      const prompts = {
        system: {
          id: "system",
          title: "System Prompt",
          content: "You are a helpful AI assistant for Uniweb.",
          tools: ["site", "page"],
        },
        developer: {
          id: "developer",
          title: "Developer Context",
          content: "You are helping a Uniweb developer.",
          depends: ["system"],
          tools: ["component"],
        },
        "content-creator": {
          id: "content-creator",
          title: "Content Creator Context",
          content: "You are helping a content creator.",
          depends: ["system"],
        },
        adaptive: {
          id: "adaptive",
          title: "Adaptive Context",
          content: "Adapt based on who you are talking to.",
          depends: ["system", { any: ["developer", "content-creator"] }],
        },
      };

      return prompts[id];
    });

    // Mock getAvailablePrompts
    promptBuilder.promptRegistry.getAvailablePrompts = jest.fn(() => [
      "system",
      "developer",
      "content-creator",
      "adaptive",
    ]);

    // Mock tool registry methods
    promptBuilder.toolRegistry.getToolNames = jest.fn(() => [
      "getSiteConfig",
      "setSiteConfig",
      "addPage",
      "createComponent",
    ]);

    promptBuilder.toolRegistry.getToolMetadata = jest.fn((name) => {
      const metadata = {
        getSiteConfig: { name: "getSiteConfig", module: "site" },
        setSiteConfig: { name: "setSiteConfig", module: "site" },
        addPage: { name: "addPage", module: "page" },
        createComponent: { name: "createComponent", module: "component" },
      };
      return metadata[name];
    });
  });

  test("returns available prompts", () => {
    const prompts = promptBuilder.getAvailablePrompts();
    expect(prompts).toEqual([
      "system",
      "developer",
      "content-creator",
      "adaptive",
    ]);
    expect(promptBuilder.promptRegistry.getAvailablePrompts).toHaveBeenCalled();
  });

  test("builds system prompt with no dependencies", () => {
    const result = promptBuilder.build("system");

    expect(result.systemPrompt).toContain(
      "You are a helpful AI assistant for Uniweb"
    );
    expect(result.tools.length).toBeGreaterThan(0);
    expect(promptBuilder.promptRegistry.getPrompt).toHaveBeenCalledWith(
      "system"
    );
  });

  test("builds developer prompt with dependencies", () => {
    const result = promptBuilder.build("developer");

    // Should include both system and developer content
    expect(result.systemPrompt).toContain(
      "You are a helpful AI assistant for Uniweb"
    );
    expect(result.systemPrompt).toContain("You are helping a Uniweb developer");

    // Should include tools from both system and developer
    const toolNames = result.tools.map((t) => t.name);
    expect(toolNames).toContain("getSiteConfig");
    expect(toolNames).toContain("createComponent");
  });

  test('resolves "any" operator in dependencies', () => {
    const result = promptBuilder.build("adaptive");

    // Should include system and one of the "any" dependencies
    expect(result.systemPrompt).toContain(
      "You are a helpful AI assistant for Uniweb"
    );
    expect(result.systemPrompt).toContain("You are helping a Uniweb developer");
    expect(result.systemPrompt).toContain(
      "Adapt based on who you are talking to"
    );
  });

  test("handles unknown prompt error", () => {
    promptBuilder.promptRegistry.getPrompt.mockReturnValueOnce(null);

    expect(() => {
      promptBuilder.build("unknown-prompt");
    }).toThrow('Prompt with ID "unknown-prompt" not found');
  });

  test("includes metadata with tools", () => {
    const result = promptBuilder.build("system");

    // Each tool should include its metadata
    const firstTool = result.tools[0];
    expect(firstTool).toHaveProperty("name");
    expect(firstTool).toHaveProperty("module");
  });
});
