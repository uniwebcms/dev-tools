import fs from "fs/promises";
import path from "path";
import { Site, Page, Section } from "./types.js";

/**
 * Get all available language codes for a site
 *
 * @param {Site} site - The site object
 * @returns {Promise<string[]>} - Array of language codes
 */
export async function getAvailableLanguages(site) {
  try {
    const entries = await fs.readdir(site.langDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((dir) => dir.name);
  } catch (error) {
    if (error.code === "ENOENT") {
      // Languages directory doesn't exist yet
      return [];
    }
    throw error;
  }
}

/**
 * Helper function to create a change object
 *
 * @param {string} type - Type of change
 * @param {Object} data - Change data
 * @returns {Object} - Change object
 */
function createChange(type, data) {
  return { type, ...data };
}

/**
 * Helper function to create an error change object
 *
 * @param {string} operation - Operation that failed
 * @param {Object} data - Change data
 * @param {Error} error - Error object
 * @returns {Object} - Error change object
 */
function createErrorChange(operation, data, error) {
  return {
    type: "error",
    operation,
    ...data,
    error: error.message,
  };
}

/**
 * Helper function to safely perform a file operation with change logging
 *
 * @param {Function} operation - File operation function to perform
 * @param {string} changeType - Type of change when successful
 * @param {string} errorType - Type of operation for error reporting
 * @param {Object} changeData - Data to include in change object
 * @param {Function} [shouldSkipError] - Function to determine if an error should be skipped
 * @returns {Promise<Object|null>} - Change object or null if skipped
 */
async function safeFileOp(
  operation,
  changeType,
  errorType,
  changeData,
  shouldSkipError
) {
  try {
    await operation();
    return createChange(changeType, changeData);
  } catch (error) {
    if (shouldSkipError && shouldSkipError(error)) {
      return null;
    }
    return createErrorChange(errorType, changeData, error);
  }
}

/**
 * Helper to check if a path exists
 *
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>} - True if exists, false otherwise
 */
async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

/**
 * Analyzes and optionally fixes language synchronization issues
 *
 * @param {Site} site - The site object
 * @param {Object} options - Synchronization options
 * @param {boolean} [options.dryRun=false] - If true, only report issues without fixing
 * @param {boolean} [options.createFolders=true] - Create missing folders
 * @param {boolean} [options.removeInvalid=true] - Remove files/folders that don't exist in main structure
 * @param {boolean} [options.createTemplates=false] - Create empty translation templates
 * @param {string[]} [options.languages] - Specific languages to sync (default: all)
 * @param {string[]} [options.pages] - Specific pages to sync (default: all)
 * @returns {Promise<Object>} - Detailed sync report
 */
export async function syncLanguages(site, options = {}) {
  // Set default options
  const {
    dryRun = false,
    createFolders = true,
    removeInvalid = true,
    createTemplates = false,
    languages: specificLanguages,
    pages: specificPages,
  } = options;

  // Get the analysis of current state
  const report = await analyzeLanguageStructure(
    site,
    specificLanguages,
    specificPages
  );

  // If dry run, just return the report without making changes
  if (dryRun) {
    return {
      ...report,
      dryRun: true,
      changes: [],
    };
  }

  // Track all changes made
  const changes = [];

  // Create missing folders if requested
  if (createFolders) {
    const folderChanges = await createMissingFolders(site, report);
    changes.push(...folderChanges);
  }

  // Remove invalid content if requested
  if (removeInvalid) {
    const removalChanges = await removeInvalidContent(site, report);
    changes.push(...removalChanges);
  }

  // Create empty templates if requested
  if (createTemplates) {
    const templateChanges = await createEmptyTemplates(site, report);
    changes.push(...templateChanges);
  }

  return {
    ...report,
    dryRun: false,
    changes,
  };
}

/**
 * Gets all MD section files in a directory
 *
 * @param {string} dirPath - Path to directory
 * @returns {Promise<string[]>} - Array of section filenames
 */
async function getSections(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && path.extname(entry.name) === ".md")
      .map((file) => file.name);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

/**
 * Builds the main structure from the pages directory
 *
 * @param {Site} site - The site object
 * @param {string[]} [specificPages] - Specific pages to include (optional)
 * @returns {Promise<Object>} - Main structure object
 */
async function buildMainStructure(site, specificPages) {
  const structure = {
    pages: {},
    totalSections: 0,
  };

  try {
    // Get all page directories
    const entries = await fs.readdir(site.pagesDir, { withFileTypes: true });
    const pageDirectories = entries
      .filter((entry) => entry.isDirectory())
      .map((dir) => dir.name);

    // Filter to specific pages if provided
    const pagesToProcess =
      specificPages && specificPages.length > 0
        ? pageDirectories.filter((page) => specificPages.includes(page))
        : pageDirectories;

    // Process each page
    for (const pageName of pagesToProcess) {
      const page = site.getPage(pageName);
      const sections = await getSections(page.dirPath);

      structure.pages[pageName] = {
        path: page.path,
        sections,
      };

      structure.totalSections += sections.length;
    }

    return structure;
  } catch (error) {
    if (error.code === "ENOENT") {
      return { pages: {}, totalSections: 0 };
    }
    throw error;
  }
}

/**
 * Analyzes the structure of all language folders compared to the main pages
 *
 * @param {Site} site - The site object
 * @param {string[]} [specificLanguages] - Specific languages to analyze (optional)
 * @param {string[]} [specificPages] - Specific pages to analyze (optional)
 * @returns {Promise<Object>} - Analysis report
 */
export async function analyzeLanguageStructure(
  site,
  specificLanguages,
  specificPages
) {
  // Get the available languages (or filter to specified ones)
  let languages = await getAvailableLanguages(site);
  if (specificLanguages && specificLanguages.length > 0) {
    languages = languages.filter((lang) => specificLanguages.includes(lang));
  }

  // Build the structure of the main pages directory
  const mainStructure = await buildMainStructure(site, specificPages);

  // Initialize report
  const report = {
    mainStructure,
    languages: {},
    summary: {
      pageCount: Object.keys(mainStructure.pages).length,
      sectionCount: mainStructure.totalSections,
      languageCount: languages.length,
    },
  };

  // Analyze each language
  for (const lang of languages) {
    report.languages[lang] = await analyzeLanguage(site, lang, mainStructure);
  }

  return report;
}

/**
 * Analyzes a single language compared to the main structure
 *
 * @param {Site} site - The site object
 * @param {string} language - Language code
 * @param {Object} mainStructure - Main structure object
 * @returns {Promise<Object>} - Language analysis
 */
async function analyzeLanguage(site, language, mainStructure) {
  const langDir = path.join(site.langDir, language);
  const analysis = {
    missing: {
      pages: [],
      sections: {},
    },
    invalid: {
      pages: [],
      sections: {},
    },
    stats: {
      translatedPages: 0,
      translatedSections: 0,
      invalidPages: 0,
      invalidSections: 0,
      missingPages: 0,
      missingSections: 0,
    },
  };

  try {
    // Check if language directory exists
    if (!(await pathExists(langDir))) {
      // Language directory doesn't exist, all pages are missing
      analysis.missing.pages = Object.keys(mainStructure.pages);
      analysis.stats.missingPages = analysis.missing.pages.length;
      return analysis;
    }

    // Get all directories in language folder
    const langEntries = await fs.readdir(langDir, { withFileTypes: true });
    const langPages = langEntries
      .filter((entry) => entry.isDirectory())
      .map((dir) => dir.name);

    // Find missing pages
    for (const pageName of Object.keys(mainStructure.pages)) {
      if (!langPages.includes(pageName)) {
        analysis.missing.pages.push(pageName);
        analysis.stats.missingPages++;
      }
    }

    // Find invalid pages
    for (const pageName of langPages) {
      if (!mainStructure.pages[pageName]) {
        analysis.invalid.pages.push(pageName);
        analysis.stats.invalidPages++;
      }
    }

    // Calculate translated pages
    analysis.stats.translatedPages =
      Object.keys(mainStructure.pages).length - analysis.stats.missingPages;

    // Check sections for each valid page
    for (const pageName of langPages) {
      if (!mainStructure.pages[pageName]) continue; // Skip invalid pages

      const mainSections = mainStructure.pages[pageName].sections;
      const langPageDir = path.join(langDir, pageName);
      const langSections = await getSections(langPageDir);

      // Find missing sections
      const missingSections = mainSections.filter(
        (section) => !langSections.includes(section)
      );
      if (missingSections.length > 0) {
        analysis.missing.sections[pageName] = missingSections;
        analysis.stats.missingSections += missingSections.length;
      }

      // Find invalid sections
      const invalidSections = langSections.filter(
        (section) => !mainSections.includes(section)
      );
      if (invalidSections.length > 0) {
        analysis.invalid.sections[pageName] = invalidSections;
        analysis.stats.invalidSections += invalidSections.length;
      }
    }

    // Calculate translated sections
    analysis.stats.translatedSections =
      mainStructure.totalSections - analysis.stats.missingSections;

    return analysis;
  } catch (error) {
    console.error(`Error analyzing language ${language}:`, error);
    return {
      error: error.message,
      missing: { pages: [], sections: {} },
      invalid: { pages: [], sections: {} },
      stats: {
        translatedPages: 0,
        translatedSections: 0,
        invalidPages: 0,
        invalidSections: 0,
        missingPages: 0,
        missingSections: 0,
      },
    };
  }
}

/**
 * Creates missing folders in language directories
 *
 * @param {Site} site - The site object
 * @param {Object} report - Analysis report
 * @returns {Promise<Array>} - Array of changes made
 */
async function createMissingFolders(site, report) {
  const changes = [];

  for (const [lang, analysis] of Object.entries(report.languages)) {
    // Create language directory if it doesn't exist
    const langDir = path.join(site.langDir, lang);
    const langDirChange = await safeFileOp(
      () => fs.mkdir(langDir, { recursive: true }),
      "create_directory",
      "create_directory",
      { path: langDir, language: lang },
      (error) => error.code === "EEXIST"
    );

    if (langDirChange) changes.push(langDirChange);

    // Create missing page directories
    for (const pageName of analysis.missing.pages) {
      const pageDir = path.join(langDir, pageName);
      const pageDirChange = await safeFileOp(
        () => fs.mkdir(pageDir, { recursive: true }),
        "create_directory",
        "create_directory",
        { path: pageDir, language: lang, page: pageName },
        (error) => error.code === "EEXIST"
      );

      if (pageDirChange) changes.push(pageDirChange);
    }
  }

  return changes;
}

/**
 * Removes invalid content from language directories
 *
 * @param {Site} site - The site object
 * @param {Object} report - Analysis report
 * @returns {Promise<Array>} - Array of changes made
 */
async function removeInvalidContent(site, report) {
  const changes = [];

  for (const [lang, analysis] of Object.entries(report.languages)) {
    const langDir = path.join(site.langDir, lang);

    // Remove invalid pages
    for (const pageName of analysis.invalid.pages) {
      const pageDir = path.join(langDir, pageName);
      const pageDirChange = await safeFileOp(
        () => fs.rm(pageDir, { recursive: true, force: true }),
        "remove_directory",
        "remove_directory",
        { path: pageDir, language: lang, page: pageName },
        null
      );

      if (pageDirChange) changes.push(pageDirChange);
    }

    // Remove invalid sections
    for (const [pageName, sections] of Object.entries(
      analysis.invalid.sections
    )) {
      const pageDir = path.join(langDir, pageName);

      for (const section of sections) {
        const sectionPath = path.join(pageDir, section);
        const sectionChange = await safeFileOp(
          () => fs.unlink(sectionPath),
          "remove_file",
          "remove_file",
          { path: sectionPath, language: lang, page: pageName, section },
          (error) => error.code === "ENOENT"
        );

        if (sectionChange) changes.push(sectionChange);
      }
    }
  }

  return changes;
}

/**
 * Creates empty template files for missing translations
 *
 * @param {Site} site - The site object
 * @param {Object} report - Analysis report
 * @returns {Promise<Array>} - Array of changes made
 */
async function createEmptyTemplates(site, report) {
  const changes = [];

  for (const [lang, analysis] of Object.entries(report.languages)) {
    // Process missing sections
    for (const [pageName, sections] of Object.entries(
      analysis.missing.sections
    )) {
      const mainPageDir = path.join(site.pagesDir, pageName);
      const langPageDir = path.join(site.langDir, lang, pageName);

      // Ensure the page directory exists
      try {
        await fs.mkdir(langPageDir, { recursive: true });
      } catch (error) {
        if (error.code !== "EEXIST") continue;
      }

      for (const section of sections) {
        const mainSectionPath = path.join(mainPageDir, section);
        const langSectionPath = path.join(langPageDir, section);

        const changeData = {
          path: langSectionPath,
          language: lang,
          page: pageName,
          section,
        };

        try {
          // Read original content to use as a template
          let originalContent = "";
          try {
            originalContent = await fs.readFile(mainSectionPath, "utf-8");
          } catch (readError) {
            originalContent = "(Original content not available)";
          }

          // Create template with original content as comment
          const templateContent = `<!-- TO BE TRANSLATED: ORIGINAL CONTENT\n${originalContent}\n-->\n\n# Translation needed\n\nThis section needs translation.`;

          await fs.writeFile(langSectionPath, templateContent, "utf-8");
          changes.push(createChange("create_file", changeData));
        } catch (error) {
          changes.push(createErrorChange("create_file", changeData, error));
        }
      }
    }
  }

  return changes;
}

// We're no longer using the handleTranslationOperation function
// since our operations now need to handle cross-site scenarios
// and get their site information directly from the page/section objects

/**
 * Helper function to copy a file and then delete the original
 *
 * @param {string} sourcePath - Source file path
 * @param {string} targetPath - Target file path
 * @returns {Promise<void>}
 */
async function copyAndDeleteFile(sourcePath, targetPath) {
  const content = await fs.readFile(sourcePath, "utf-8");
  await fs.writeFile(targetPath, content, "utf-8");
  await fs.unlink(sourcePath);
}

/**
 * Helper function to copy a directory and then delete the original
 *
 * @param {string} sourceDir - Source directory path
 * @param {string} targetDir - Target directory path
 * @returns {Promise<void>}
 */
async function copyAndDeleteDirectory(sourceDir, targetDir) {
  // Create destination directory
  await fs.mkdir(targetDir, { recursive: true });

  // Get all files in the source directory
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  // Copy all files
  for (const entry of entries) {
    const srcPath = path.join(sourceDir, entry.name);
    const destPath = path.join(targetDir, entry.name);

    if (entry.isFile()) {
      const content = await fs.readFile(srcPath, "utf-8");
      await fs.writeFile(destPath, content, "utf-8");
    } else if (entry.isDirectory()) {
      // Recursively copy subdirectories
      await copyAndDeleteDirectory(srcPath, destPath);
    }
  }

  // Remove original directory
  await fs.rm(sourceDir, { recursive: true, force: true });
}

/**
 * Remove a section file across all languages
 *
 * @param {Section} section - Section to remove
 * @returns {Promise<Object>} - Result of the operation
 */
export async function removeSectionTranslations(section) {
  // Extract site information from the section
  const site = section.page.site;
  const languages = await getAvailableLanguages(site);
  const changes = [];
  let removedCount = 0;

  for (const lang of languages) {
    const langSectionPath = path.join(
      site.langDir,
      lang,
      section.page.path,
      section.name + ".md"
    );

    const changeData = {
      path: langSectionPath,
      language: lang,
      site: site.name,
      page: section.page.path,
      section: section.name + ".md",
    };

    const change = await safeFileOp(
      () => fs.unlink(langSectionPath),
      "remove_file",
      "remove_file",
      changeData,
      (error) => error.code === "ENOENT" // Skip if file doesn't exist
    );

    if (change) {
      changes.push(change);
      if (change.type !== "error") removedCount++;
    }
  }

  return {
    success: removedCount > 0 || languages.length === 0,
    removedCount,
    changes,
  };
}

/**
 * Remove a page folder across all languages
 *
 * @param {Page} page - Page to remove
 * @returns {Promise<Object>} - Result of the operation
 */
export async function removePageTranslations(page) {
  // Extract site information from the page
  const site = page.site;
  const languages = await getAvailableLanguages(site);
  const changes = [];
  let removedCount = 0;

  for (const lang of languages) {
    const langPagePath = path.join(site.langDir, lang, page.path);

    const changeData = {
      path: langPagePath,
      language: lang,
      site: site.name,
      page: page.path,
    };

    const change = await safeFileOp(
      () => fs.rm(langPagePath, { recursive: true, force: true }),
      "remove_directory",
      "remove_directory",
      changeData,
      (error) => error.code === "ENOENT" // Skip if directory doesn't exist
    );

    if (change) {
      changes.push(change);
      if (change.type !== "error") removedCount++;
    }
  }

  return {
    success: removedCount > 0 || languages.length === 0,
    removedCount,
    changes,
  };
}

/**
 * Move/rename a section across all languages
 *
 * @param {Section} oldSection - Original section
 * @param {Section} newSection - New section
 * @returns {Promise<Object>} - Result of the operation
 */
export async function moveSectionTranslations(oldSection, newSection) {
  // Extract site information from the sections
  const oldSite = oldSection.page.site;
  const newSite = newSection.page.site;

  // Check if this is a cross-site operation (just for reporting)
  const isCrossSite = oldSite.name !== newSite.name;

  const changes = [];
  let movedCount = 0;

  // Get available languages for both sites
  const oldLanguages = await getAvailableLanguages(oldSite);
  const newLanguages = isCrossSite
    ? await getAvailableLanguages(newSite)
    : oldLanguages;

  // Get intersection of languages if cross-site
  const languages = isCrossSite
    ? oldLanguages.filter((lang) => newLanguages.includes(lang))
    : oldLanguages;

  for (const lang of languages) {
    // Set up paths and change data
    const oldLangSectionPath = path.join(
      oldSite.langDir,
      lang,
      oldSection.page.path,
      oldSection.name + ".md"
    );
    const newLangSectionPath = path.join(
      newSite.langDir,
      lang,
      newSection.page.path,
      newSection.name + ".md"
    );

    const changeData = {
      language: lang,
      from: oldLangSectionPath,
      to: newLangSectionPath,
      oldSite: oldSite.name,
      newSite: newSite.name,
      oldPage: oldSection.page.path,
      newPage: newSection.page.path,
      oldSection: oldSection.name + ".md",
      newSection: newSection.name + ".md",
    };

    try {
      // Check if source file exists
      if (!(await pathExists(oldLangSectionPath))) {
        continue;
      }

      // Ensure target directory exists
      await fs.mkdir(path.dirname(newLangSectionPath), { recursive: true });

      // Try rename first (most efficient)
      try {
        await fs.rename(oldLangSectionPath, newLangSectionPath);
        changes.push(createChange("move_file", changeData));
        movedCount++;
      } catch (error) {
        // Fall back to copy-delete if rename fails due to cross-device issues
        if (error.code === "EXDEV") {
          await copyAndDeleteFile(oldLangSectionPath, newLangSectionPath);
          changes.push(createChange("copy_and_delete_file", changeData));
          movedCount++;
        } else {
          throw error; // Re-throw other errors
        }
      }
    } catch (error) {
      changes.push(createErrorChange("file_operation", changeData, error));
    }
  }

  return {
    success: movedCount > 0 || languages.length === 0,
    movedCount,
    changes,
    crossSite: isCrossSite,
  };
}

/**
 * Move/rename a page across all languages
 *
 * @param {Page} oldPage - Original page
 * @param {Page} newPage - New page
 * @returns {Promise<Object>} - Result of the operation
 */
export async function movePageTranslations(oldPage, newPage) {
  // Extract site information from the pages
  const oldSite = oldPage.site;
  const newSite = newPage.site;

  // Check if this is a cross-site operation (just for reporting)
  const isCrossSite = oldSite.name !== newSite.name;

  const changes = [];
  let movedCount = 0;

  // Get available languages for both sites
  const oldLanguages = await getAvailableLanguages(oldSite);
  const newLanguages = isCrossSite
    ? await getAvailableLanguages(newSite)
    : oldLanguages;

  // Get intersection of languages if cross-site (only process languages available in both sites)
  const languages = isCrossSite
    ? oldLanguages.filter((lang) => newLanguages.includes(lang))
    : oldLanguages;

  for (const lang of languages) {
    const oldLangPagePath = path.join(oldSite.langDir, lang, oldPage.path);
    const newLangPagePath = path.join(newSite.langDir, lang, newPage.path);

    const changeData = {
      language: lang,
      from: oldLangPagePath,
      to: newLangPagePath,
      oldSite: oldSite.name,
      newSite: newSite.name,
      oldPage: oldPage.path,
      newPage: newPage.path,
    };

    try {
      // Check if source directory exists
      if (!(await pathExists(oldLangPagePath))) {
        continue;
      }

      // Ensure parent directory of target exists
      await fs.mkdir(path.dirname(newLangPagePath), { recursive: true });

      // Try rename first (most efficient)
      try {
        await fs.rename(oldLangPagePath, newLangPagePath);
        changes.push(createChange("move_directory", changeData));
        movedCount++;
      } catch (error) {
        // Fall back to copy-delete if rename fails due to cross-device issues
        if (error.code === "EXDEV") {
          await copyAndDeleteDirectory(oldLangPagePath, newLangPagePath);
          changes.push(createChange("copy_and_delete_directory", changeData));
          movedCount++;
        } else {
          throw error; // Re-throw other errors
        }
      }
    } catch (error) {
      changes.push(createErrorChange("directory_operation", changeData, error));
    }
  }

  return {
    success: movedCount > 0 || languages.length === 0,
    movedCount,
    changes,
    crossSite: isCrossSite,
  };
}
