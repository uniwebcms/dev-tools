import { resolveSite } from "./file.js";

/**
 * Generate a detailed translation status report for a site
 *
 * @param {import('./types').Site} site - The site object
 * @param {string[]} [specificLanguages] - Specific languages to include (optional)
 * @returns {Promise<{languages: LanguageReport[]}>} - Detailed translation status report
 */
export async function generateTranslationReport(site, specificLanguages) {
  // Get available languages
  let languages = await getAvailableLanguages(site);
  if (specificLanguages && specificLanguages.length > 0) {
    languages = languages.filter((lang) => specificLanguages.includes(lang));
  }

  // Build main structure first
  const mainStructure = await buildMainStructure(site);
  const report = { languages: [] };

  // Process each language
  for (const lang of languages) {
    const langReport = await generateLanguageReport(site, lang, mainStructure);
    report.languages.push(langReport);
  }

  return report;
}

/**
 * Generate a translation status report for a single language
 *
 * @param {import('./types').Site} site - The site object
 * @param {string} lang - Language code
 * @param {Object} mainStructure - Main site structure
 * @returns {Promise<LanguageReport>} - Language translation status report
 */
async function generateLanguageReport(site, lang, mainStructure) {
  const langDir = path.join(site.languages, lang);
  const langReport = {
    language: lang,
    totalPages: Object.keys(mainStructure.pages).length,
    translatedPages: 0,
    completionPercentage: 0,
    pages: [],
  };

  let totalSections = 0;
  let translatedSections = 0;

  // Process each page
  for (const [pageName, pageInfo] of Object.entries(mainStructure.pages)) {
    const pageReport = await generatePageReport(site, lang, pageName, pageInfo);
    langReport.pages.push(pageReport);

    // Update language stats
    totalSections += pageReport.totalSections;
    translatedSections += pageReport.translatedSections;

    if (pageReport.translatedSections > 0) {
      langReport.translatedPages++;
    }
  }

  // Calculate overall completion percentage
  langReport.completionPercentage =
    totalSections > 0
      ? Math.round((translatedSections / totalSections) * 100)
      : 0;

  return langReport;
}

/**
 * Generate a translation status report for a single page
 *
 * @param {import('./types').Site} site - The site object
 * @param {string} lang - Language code
 * @param {string} pageName - Page name/path
 * @param {Object} pageInfo - Page information
 * @returns {Promise<PageTranslationStatus>} - Page translation status report
 */
async function generatePageReport(site, lang, pageName, pageInfo) {
  const pageReport = {
    name: pageName,
    totalSections: pageInfo.sections.length,
    translatedSections: 0,
    completionPercentage: 0,
    sections: [],
  };

  const langPageDir = path.join(site.languages, lang, pageName);

  // Check if the language page directory exists
  let langPageExists = false;
  try {
    await fs.access(langPageDir);
    langPageExists = true;
  } catch (error) {
    if (error.code === "ENOENT") {
      // Language page directory doesn't exist
      langPageExists = false;
    } else {
      throw error;
    }
  }

  // Process each section
  for (const sectionFile of pageInfo.sections) {
    const sectionName = path.basename(sectionFile, ".md");
    const langSectionPath = path.join(langPageDir, sectionFile);

    let translated = false;
    let lastModified = null;

    if (langPageExists) {
      try {
        const stats = await fs.stat(langSectionPath);
        translated = true;
        lastModified = stats.mtime;
        pageReport.translatedSections++;
      } catch (error) {
        if (error.code !== "ENOENT") {
          throw error;
        }
      }
    }

    pageReport.sections.push({
      name: sectionName,
      translated,
      lastModified,
    });
  }

  // Calculate page completion percentage
  pageReport.completionPercentage =
    pageReport.totalSections > 0
      ? Math.round(
          (pageReport.translatedSections / pageReport.totalSections) * 100
        )
      : 0;

  return pageReport;
}

/**
 * Command handler for generating a translation report
 *
 * @param {Object} options - Command options
 * @param {string} [options.site] - Site name
 * @param {string[]} [options.languages] - Specific languages to report on
 * @param {boolean} [options.json=false] - Output as JSON
 */
export async function handleTranslationReport(options) {
  try {
    const site = await resolveSite(options.site);

    console.log(`Generating translation report for site "${site.name}"...`);

    const report = await generateTranslationReport(site, options.languages);

    if (options.json) {
      // Output as JSON
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    // Output as human-readable text
    console.log("\nTranslation Status Report:");
    console.log("=========================\n");

    for (const lang of report.languages) {
      console.log(`Language: ${lang.language}`);
      console.log(
        `Overall completion: ${lang.completionPercentage}% (${lang.translatedPages}/${lang.totalPages} pages)`
      );
      console.log("");

      // Sort pages by completion percentage (descending)
      const sortedPages = [...lang.pages].sort(
        (a, b) => b.completionPercentage - a.completionPercentage
      );

      for (const page of sortedPages) {
        console.log(`  Page: ${page.name} (${page.completionPercentage}%)`);

        // Don't show section details for fully translated or untranslated pages
        if (page.completionPercentage === 100) {
          console.log("    ✓ All sections translated");
        } else if (page.completionPercentage === 0) {
          console.log("    ✗ No sections translated");
        } else {
          for (const section of page.sections) {
            const status = section.translated ? "✓" : "✗";
            const modified = section.lastModified
              ? `(last modified: ${
                  section.lastModified.toISOString().split("T")[0]
                })`
              : "";

            console.log(`    ${status} ${section.name} ${modified}`);
          }
        }

        console.log("");
      }

      console.log("--------------------------\n");
    }

    // Print summary
    console.log("Summary:");
    for (const lang of report.languages) {
      console.log(`${lang.language}: ${lang.completionPercentage}% complete`);
    }
  } catch (error) {
    console.error("Error generating translation report:", error);
  }
}

// Example of CLI command registration
/*
import { program } from 'commander';

program
  .command('translation-report')
  .description('Generate a translation status report')
  .option('-s, --site <n>', 'Site name')
  .option('-l, --languages <langs...>', 'Specific languages to report on')
  .option('-j, --json', 'Output as JSON', false)
  .action(handleTranslationReport);
*/

// Example usage
async function example() {
  // Generate report for all languages
  await handleTranslationReport({});

  // Generate report for specific languages
  await handleTranslationReport({
    languages: ["fr", "es"],
  });

  // Generate JSON report
  await handleTranslationReport({
    json: true,
  });
}

// This is just for example purposes
// example().catch(console.error);
