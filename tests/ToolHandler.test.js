import { jest, describe, test, expect, beforeEach } from "@jest/globals";
import { ToolHandler } from "../src/ToolHandler.js";
import {
  ToolValidationError,
  ToolExecutionError,
} from "../src/utils/errors.js";

describe("ToolHandler", () => {
  let toolHandler;

  beforeEach(() => {
    toolHandler = new ToolHandler();

    // Mock the actual tool execution to avoid side effects
    // but still test the parameter validation and method calls
    jest
      .spyOn(toolHandler.toolRegistry, "useTool")
      .mockImplementation(async (name, params) => {
        // Let validation run normally, but don't actually execute the tool
        if (name === "getSiteConfig") {
          if (!params.name) {
            throw new ToolValidationError("Missing required parameter: name");
          }
          return { name: params.name, config: { title: "Test Site" } };
        }

        if (name === "listSites") {
          return { sites: [{ name: "root" }, { name: "docs" }] };
        }

        if (!toolHandler.hasTool(name)) {
          throw new ToolValidationError(`Unknown tool: "${name}"`);
        }

        return { success: true, message: `Executed ${name}` };
      });
  });

  test("returns tool definitions for AI", () => {
    const definitions = toolHandler.getToolDefinitions();

    // Should return definitions from the registry
    expect(definitions.length).toBeGreaterThan(0);
    expect(definitions[0]).toHaveProperty("name");
    expect(definitions[0]).toHaveProperty("description");
    expect(definitions[0]).toHaveProperty("parameters");
  });

  test("returns command structure for CLI", () => {
    const commandStructure = toolHandler.getToolCommandStructure();

    // Should have site commands
    expect(commandStructure).toHaveProperty("site");
    expect(commandStructure.site).toHaveProperty("config");
    // Should have page commands
    expect(commandStructure).toHaveProperty("page");
  });

  test("handles tool execution with validation", async () => {
    // Test successful execution
    const result = await toolHandler.useTool("getSiteConfig", {
      name: "test-site",
    });
    expect(result).toEqual({
      name: "test-site",
      config: { title: "Test Site" },
    });

    // Test validation error handling
    await expect(toolHandler.useTool("getSiteConfig", {})).rejects.toThrow(
      ToolValidationError
    );

    // Test unknown tool handling
    await expect(toolHandler.useTool("nonexistentTool", {})).rejects.toThrow(
      ToolValidationError
    );
  });

  test("verifies if tools exist", () => {
    // Check tools that should exist based on metadata
    expect(toolHandler.hasTool("getSiteConfig")).toBe(true);
    expect(toolHandler.hasTool("addPage")).toBe(true);

    // Check non-existent tool
    expect(toolHandler.hasTool("nonexistentTool")).toBe(false);
  });
});
