// language-manager.js
import fs from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import {
  getAvailableLanguages,
  analyzeLanguageStructure,
  //   getExpectedLanguageFiles,
  //   getActualLanguageFiles,
  //   getLanguageDiff,
} from "./lang-sync.js";

export class LanguageManager {
  async getAvailableLanguages(site) {
    return await getAvailableLanguages(site);
  }

  async analyzeStructure(site, { languages = null } = {}) {
    const langs = languages || (await this.getAvailableLanguages(site));
    return await analyzeLanguageStructure(site, langs);
  }

  async syncStructure(
    site,
    {
      dryRun = false,
      createFolders = true,
      removeInvalid = true,
      createTemplates = true,
      languages = null,
    } = {}
  ) {
    const langs = languages || (await this.getAvailableLanguages(site));
    const report = await analyzeLanguageStructure(site, langs);
    const fixes = [];

    for (const lang of langs) {
      for (const fix of report[lang].fixes) {
        fixes.push({ lang, ...fix });
      }
    }

    if (dryRun) return fixes;

    for (const fix of fixes) {
      const targetPath = path.join(site.langDir, fix.lang, fix.relativePath);
      if (fix.action === "create-folder" && createFolders) {
        await fs.mkdir(targetPath, { recursive: true });
      } else if (
        fix.action === "remove-invalid" &&
        removeInvalid &&
        existsSync(targetPath)
      ) {
        await fs.unlink(targetPath);
      } else if (fix.action === "create-template" && createTemplates) {
        await fs.writeFile(targetPath, "\n", "utf8");
      }
    }

    return fixes;
  }

  //   getExpectedFiles(site) {
  //     return getExpectedLanguageFiles(site);
  //   }

  //   async getActualFiles(site, lang) {
  //     return await getActualLanguageFiles(path.join(site.langDir, lang));
  //   }

  //   async getDiff(site, lang) {
  //     const expected = this.getExpectedFiles(site)[lang] || [];
  //     const actual = await this.getActualFiles(site, lang);
  //     return getLanguageDiff(expected, actual);
  //   }

  async removePage(page) {
    const langs = await this.getAvailableLanguages(page.site);
    for (const lang of langs) {
      const langPagePath = page.getLangPath(lang);
      if (existsSync(langPagePath)) {
        await fs.rm(langPagePath, { recursive: true, force: true });
      }
    }
  }

  async removeSection(section) {
    const langs = await this.getAvailableLanguages(section.page.site);
    for (const lang of langs) {
      const langPath = section.getLangPath(lang);
      if (existsSync(langPath)) {
        await fs.unlink(langPath);
      }
    }
  }

  async movePage(oldPage, newPage) {
    const langs = await this.getAvailableLanguages(oldPage.site);
    for (const lang of langs) {
      const fromPath = oldPage.getLangPath(lang);
      const toPath = newPage.getLangPath(lang);
      if (existsSync(fromPath) && !existsSync(toPath)) {
        await fs.mkdir(path.dirname(toPath), { recursive: true });
        await fs.rename(fromPath, toPath);
      }
    }
  }

  async moveSection(oldSection, newSection) {
    const langs = await this.getAvailableLanguages(oldSection.page.site);
    for (const lang of langs) {
      const fromPath = oldSection.getLangPath(lang);
      const toPath = newSection.getLangPath(lang);
      if (existsSync(fromPath) && !existsSync(toPath)) {
        await fs.mkdir(path.dirname(toPath), { recursive: true });
        await fs.rename(fromPath, toPath);
      }
    }
  }

  async renamePage(page, newPath) {
    const langs = await this.getAvailableLanguages(page.site);
    for (const lang of langs) {
      const oldPath = page.getLangPath(lang);
      const newPage = new page.constructor(newPath, page.site);
      const newPathAbs = newPage.getLangPath(lang);
      if (existsSync(oldPath) && !existsSync(newPathAbs)) {
        await fs.rename(oldPath, newPathAbs);
      }
    }
  }

  async renameSection(section, newSection) {
    const langs = await this.getAvailableLanguages(section.page.site);
    for (const lang of langs) {
      const oldPath = section.getLangPath(lang);
      const newPath = newSection.getLangPath(lang);
      if (existsSync(oldPath) && !existsSync(newPath)) {
        await fs.rename(oldPath, newPath);
      }
    }
  }

  async copyPage(fromPage, toSite, toPage, { overwrite = false } = {}) {
    const langs = await this.getAvailableLanguages(fromPage.site);
    for (const lang of langs) {
      const fromPath = fromPage.getLangPath(lang);
      if (!existsSync(fromPath)) continue;
      const toPath = toPage.getLangPath(lang);
      if (!overwrite && existsSync(toPath)) continue;
      await fs.mkdir(path.dirname(toPath), { recursive: true });
      await fs.cp(fromPath, toPath, { recursive: true, force: overwrite });
    }
  }

  async copySection(
    fromSection,
    toSite,
    toSection,
    { overwrite = false } = {}
  ) {
    const langs = await this.getAvailableLanguages(fromSection.page.site);
    for (const lang of langs) {
      const fromPath = fromSection.getLangPath(lang);
      if (!existsSync(fromPath)) continue;
      const toPath = toSection.getLangPath(lang);
      if (!overwrite && existsSync(toPath)) continue;
      await fs.mkdir(path.dirname(toPath), { recursive: true });
      await fs.copyFile(fromPath, toPath);
    }
  }
}
