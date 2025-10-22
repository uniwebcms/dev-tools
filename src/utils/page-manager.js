// page-manager.js
import fs from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { Section } from "./types.js";
import { LanguageManager } from "./language-manager.js";
import yaml from "js-yaml";

export class PageManager {
  constructor() {
    this.languageManager = new LanguageManager();
  }

  async createPage(page) {
    await fs.mkdir(page.dirPath, { recursive: true });
    return page.loadStructure();
  }

  async removePage(page) {
    await fs.rm(page.dirPath, { recursive: true, force: true });
    await this.languageManager.removePage(page);
  }

  async renamePage(oldPage, newPage) {
    await fs.mkdir(path.dirname(newPage.dirPath), { recursive: true });
    await fs.rename(oldPage.dirPath, newPage.dirPath);
    await this.languageManager.renamePage(oldPage, newPage.path);
  }

  async copyPage(fromPage, toPage, { overwrite = false } = {}) {
    await fs.mkdir(path.dirname(toPage.dirPath), { recursive: true });
    await fs.cp(fromPage.dirPath, toPage.dirPath, {
      recursive: true,
      force: overwrite,
    });
    await this.languageManager.copyPage(fromPage, toPage.site, toPage, {
      overwrite,
    });
    return toPage;
  }

  async movePage(fromPage, toPage) {
    const copied = await this.copyPage(fromPage, toPage);
    await this.removePage(fromPage);
    return copied;
  }

  async addSection(section, position = null) {
    const structure = await section.page.loadStructure();
    structure.add(section.name, position);
    await fs.writeFile(section.filePath, "\n", "utf8");
    if (!structure.isOptional()) {
      await structure.saveStructure();
    }
    return section;
  }

  async removeSection(section) {
    const structure = await section.page.loadStructure();
    structure.remove(section.name);
    if (existsSync(section.filePath)) {
      await fs.unlink(section.filePath);
    }
    await this.languageManager.removeSection(section);
    await structure.saveStructure();
  }

  async removeSectionRecursive(section) {
    const structure = await section.page.loadStructure();
    const node = structure.find(section.name);
    for (const childNode of node.children) {
      const childSection = new Section(childNode.name, section.page);
      await removeSectionRecursive(childSection);
    }
    this.removeSection(section);
  }

  async renameSection(section, newName) {
    const newSection = new Section(newName, section.page);
    const structure = await section.page.loadStructure();
    structure.rename(section.name, newName);
    await fs.rename(section.filePath, newSection.filePath);
    await structure.saveStructure();
    await this.languageManager.renameSection(section, newSection);
  }

  async copySection(fromSection, toSection, position = null) {
    const structure = await toSection.page.loadStructure();
    structure.add(toSection.name, position);
    await fs.mkdir(path.dirname(toSection.filePath), { recursive: true });
    await fs.copyFile(fromSection.filePath, toSection.filePath);
    await this.languageManager.copySection(
      fromSection,
      toSection.page.site,
      toSection
    );
    await structure.saveStructure();
    return toSection;
  }

  async copySectionRecursive(fromSection, toSection, position = null) {
    await this.copySection(fromSection, toSection, position);
    const structure = await fromSection.page.loadStructure();
    const node = structure.find(fromSection.name);
    for (const child of node.children) {
      const fromChild = new Section(child.name, fromSection.page);
      const toChild = new Section(child.name, toSection.page);
      await this.copySectionRecursive(fromChild, toChild, {
        under: toSection.name,
      });
    }
  }

  async moveSection(fromSection, toSection, position = null) {
    // If same page, rename the section and move under new parent
    if (fromSection.page.dirPath === toSection.page.dirPath) {
      await this.renameSection(fromSection, toSection.name);
      // Move to new parent
      const structure = await toSection.page.loadStructure();
      structure.move(fromSection.name, position);
      await structure.saveStructure();
    } else {
      await this.copySection(fromSection, toSection, position);
      await this.removeSection(fromSection);
    }
  }

  async syncStructureToFS(page) {
    const structure = await page.loadStructure();
    const names = structure.getAllFilenames();
    for (const name of names) {
      const section = new Section(name, page);
      if (!existsSync(section.filePath)) {
        await fs.writeFile(section.filePath, "\n", "utf8");
      }
    }
    return structure;
  }

  async rebuildStructureFromFS(page) {
    const structure = await page.loadStructure();
    const flat = await structure.inferStructure(page.dirPath);
    const fileMap = structure.toMap();

    for (const name in flat) {
      if (!fileMap.has(name)) {
        structure.add(name);
      }
    }

    await structure.saveStructure();

    return structure;
  }

  async syncBoth(page) {
    await this.rebuildStructureFromFS(page);
    return this.syncStructureToFS(page);
  }

  async writeSection(section, config, body = "") {
    if (config && typeof config !== "string") {
      config = yaml.dump(config).trim();
    }

    config = config ? `---\n${config}\n---\n\n` : "";
    return fs.writeFile(section.filePath, config + body, "utf8");
  }

  async listPageSections(page) {
    const structure = await this.syncBoth(page);
    return structure.getAllFilenames();
  }

  async listChildSections(section) {
    const structure = await this.syncBoth(section.page);
    return structure.getFlatDescendants(section.name);
  }

  async validateNewFiles(fromSection, toSection) {
    const fromNames = await this.listChildSections(fromSection);
    const toNames = await this.listPageSections(toSection.page);
    const overlapping = fromNames.filter((name) => toNames.includes(name));

    if (overlapping.length > 0) {
      throw new Error(
        `The following sections already exist:\n` +
          overlapping.map((name) => `  - ${name}`).join("\n")
      );
    }
  }

  //   async editStruct(page, operation) {
  //     const structure = await page.loadStructure();
  //     operation(structure);
  //     await structure.saveStructure();
  //   }
}
