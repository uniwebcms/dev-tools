import { jest, describe, test, expect, beforeEach } from "@jest/globals";
import { ToolRegistry } from "../src/internal/ToolRegistry.js";

describe("ToolRegistry", () => {
  let toolRegistry;

  beforeEach(() => {
    // Create a fresh ToolRegistry for each test
    toolRegistry = new ToolRegistry();
  });

  test("loads tools from metadata correctly", () => {
    // The registry should have loaded tools from the metadata
    const toolNames = toolRegistry.getToolNames();

    // Verify we have tools (without needing to know exact count)
    expect(toolNames.length).toBeGreaterThan(0);

    // Verify a few specific tools we know should exist
    expect(toolRegistry.hasTool("getSiteConfig")).toBe(true);
    expect(toolRegistry.hasTool("addPage")).toBe(true);
    expect(toolRegistry.hasTool("listSites")).toBe(true);
  });

  test("provides accurate tool metadata", () => {
    // Check metadata for a specific tool
    const siteConfigMeta = toolRegistry.getToolMetadata("getSiteConfig");

    // Verify the metadata contains expected fields
    expect(siteConfigMeta).toBeDefined();
    expect(siteConfigMeta.module).toBe("site");
    expect(siteConfigMeta.description).toContain("Gets site configuration");
    expect(Array.isArray(siteConfigMeta.params)).toBe(true);
  });

  test("generates AI function definitions correctly", () => {
    const definitions = toolRegistry.getToolDefinitions();

    // Should have multiple tool definitions
    expect(definitions.length).toBeGreaterThan(0);

    // Each definition should have the right structure
    const firstTool = definitions[0];
    expect(firstTool).toHaveProperty("name");
    expect(firstTool).toHaveProperty("description");
    expect(firstTool).toHaveProperty("parameters");
    expect(firstTool.parameters).toHaveProperty("properties");

    // Verify that private tools are excluded
    const privateTools = definitions.filter(
      (tool) =>
        toolRegistry.getToolMetadata(tool.name)?.visibility === "private"
    );
    expect(privateTools.length).toBe(0);
  });

  test("generates CLI command structure correctly", () => {
    const commandStructure = toolRegistry.getToolCommandStructure();

    // Verify structure has expected categories
    expect(commandStructure).toHaveProperty("site");
    expect(commandStructure).toHaveProperty("page");

    // Verify nested command structure
    expect(commandStructure.site).toHaveProperty("config");
    expect(commandStructure.site.config).toHaveProperty("get");
    expect(commandStructure.site.config.get.function).toBe("getSiteConfig");
  });

  test("generates correct command structure from function names", () => {
    const commandStructure = toolRegistry.getToolCommandStructure();

    // Check verb-noun conversions for common patterns
    // getSiteConfig -> site.config.get
    expect(commandStructure.site?.config?.get).toBeDefined();
    expect(commandStructure.site?.config?.get.function).toBe("getSiteConfig");

    // addSite -> site.add
    expect(commandStructure.site?.add).toBeDefined();
    expect(commandStructure.site?.add.function).toBe("addSite");

    // listPages -> pages.list (if it exists)
    if (toolRegistry.hasTool("listPages")) {
      expect(commandStructure.pages?.list).toBeDefined();
      expect(commandStructure.pages?.list.function).toBe("listPages");
    }
  });
});
