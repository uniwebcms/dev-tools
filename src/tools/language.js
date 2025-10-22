// import {
//   syncLanguages,
//   removeSectionTranslations,
//   removePageTranslations,
//   moveSectionTranslations,
//   movePageTranslations,
// } from "../utils/lang-sync.js";
// import { resolveSite } from "../utils/file.js";

// /**
//  * Command handler for syncing languages
//  *
//  * @param {Object} options - Command options
//  * @param {string} [options.site] - Site name
//  * @param {boolean} [options.dryRun=false] - Only analyze without making changes
//  * @param {boolean} [options.createFolders=true] - Create missing folders
//  * @param {boolean} [options.removeInvalid=true] - Remove invalid content
//  * @param {boolean} [options.createTemplates=false] - Create empty templates
//  * @param {string[]} [options.languages] - Specific languages to sync
//  * @param {string[]} [options.pages] - Specific pages to sync
//  */
// export async function handleSyncLanguages(options) {
//   try {
//     const site = await resolveSite(options.site);

//     console.log(`Analyzing languages for site "${site.name}"...`);

//     const report = await syncLanguages(site, {
//       dryRun: options.dryRun,
//       createFolders: options.createFolders,
//       removeInvalid: options.removeInvalid,
//       createTemplates: options.createTemplates,
//       languages: options.languages,
//       pages: options.pages,
//     });

//     // Print summary
//     console.log("\nAnalysis Summary:");
//     console.log(
//       `Main structure: ${report.summary.pageCount} pages, ${report.summary.sectionCount} sections`
//     );

//     for (const [lang, analysis] of Object.entries(report.languages)) {
//       const { stats } = analysis;
//       console.log(`\n${lang}:`);
//       console.log(
//         `  Pages: ${stats.translatedPages}/${report.summary.pageCount} (${stats.missingPages} missing, ${stats.invalidPages} invalid)`
//       );
//       console.log(
//         `  Sections: ${stats.translatedSections}/${report.summary.sectionCount} (${stats.missingSections} missing, ${stats.invalidSections} invalid)`
//       );
//     }

//     // If not a dry run, print changes
//     if (!report.dryRun && report.changes.length > 0) {
//       console.log("\nChanges made:");

//       const createDirs = report.changes.filter(
//         (c) => c.type === "create_directory"
//       ).length;
//       const createFiles = report.changes.filter(
//         (c) => c.type === "create_file"
//       ).length;
//       const removeDirs = report.changes.filter(
//         (c) => c.type === "remove_directory"
//       ).length;
//       const removeFiles = report.changes.filter(
//         (c) => c.type === "remove_file"
//       ).length;
//       const moveFiles = report.changes.filter(
//         (c) => c.type === "move_file"
//       ).length;
//       const moveDirs = report.changes.filter(
//         (c) => c.type === "move_directory"
//       ).length;
//       const errors = report.changes.filter((c) => c.type === "error").length;

//       console.log(`  ${createDirs} directories created`);
//       console.log(`  ${createFiles} template files created`);
//       console.log(`  ${removeDirs} invalid directories removed`);
//       console.log(`  ${removeFiles} invalid files removed`);
//       console.log(`  ${moveFiles} files moved`);
//       console.log(`  ${moveDirs} directories moved`);

//       if (errors > 0) {
//         console.log(`  ${errors} errors occurred`);
//         console.log("\nErrors:");
//         report.changes
//           .filter((c) => c.type === "error")
//           .forEach((error) => {
//             console.error(`  - ${error.operation} failed: ${error.error}`);
//           });
//       }
//     } else if (report.dryRun) {
//       console.log("\n(Dry run, no changes were made)");

//       // Print potential changes
//       let potentialChanges = 0;
//       for (const [lang, analysis] of Object.entries(report.languages)) {
//         potentialChanges += analysis.stats.missingPages;
//         potentialChanges += analysis.stats.missingSections;
//         potentialChanges += analysis.stats.invalidPages;
//         potentialChanges += analysis.stats.invalidSections;
//       }

//       if (potentialChanges > 0) {
//         console.log(
//           `${potentialChanges} changes would be made if run without --dry-run flag`
//         );
//       } else {
//         console.log(
//           "All language folders are in sync with the main structure!"
//         );
//       }
//     }
//   } catch (error) {
//     console.error("Error syncing languages:", error);
//   }
// }

// /**
//  * Command handler for removing a section and its translations
//  *
//  * @param {string} pagePath - Page path
//  * @param {string} sectionName - Section name
//  * @param {Object} options - Command options
//  * @param {string} [options.site] - Site name
//  */
// export async function handleRemoveSection(pagePath, sectionName, options) {
//   try {
//     const site = await resolveSite(options.site);
//     const page = site.getPage(pagePath);
//     const section = page.getSection(sectionName);

//     console.log(`Removing section "${sectionName}" from page "${pagePath}"...`);

//     // Your existing code to remove the main section file
//     // ...

//     // Then remove translations
//     console.log("Removing corresponding translations...");
//     const result = await removeSectionTranslations(section);

//     if (result.success) {
//       console.log(
//         `Successfully removed ${result.removedCount} translated section files`
//       );
//     } else {
//       console.warn("Failed to remove some translated section files:");
//       result.changes
//         .filter((c) => c.type === "error")
//         .forEach((error) => {
//           console.error(`  - ${error.error}`);
//         });
//     }
//   } catch (error) {
//     console.error("Error removing section:", error);
//   }
// }

// /**
//  * Command handler for removing a page and its translations
//  *
//  * @param {string} pagePath - Page path
//  * @param {Object} options - Command options
//  * @param {string} [options.site] - Site name
//  */
// export async function handleRemovePage(pagePath, options) {
//   try {
//     const site = await resolveSite(options.site);
//     const page = site.getPage(pagePath);

//     console.log(`Removing page "${pagePath}"...`);

//     // Your existing code to remove the main page folder
//     // ...

//     // Then remove translations
//     console.log("Removing corresponding translations...");
//     const result = await removePageTranslations(page);

//     if (result.success) {
//       console.log(
//         `Successfully removed ${result.removedCount} translated page folders`
//       );
//     } else {
//       console.warn("Failed to remove some translated page folders:");
//       result.changes
//         .filter((c) => c.type === "error")
//         .forEach((error) => {
//           console.error(`  - ${error.error}`);
//         });
//     }
//   } catch (error) {
//     console.error("Error removing page:", error);
//   }
// }

// /**
//  * Command handler for moving/renaming a section and its translations
//  *
//  * @param {string} pagePath - Page path
//  * @param {string} oldSectionName - Original section name
//  * @param {string} newSectionName - New section name
//  * @param {Object} options - Command options
//  * @param {string} [options.site] - Site name
//  * @param {string} [options.targetSite] - Target site name (if moving to a different site)
//  * @param {string} [options.targetPage] - Target page path (if moving to a different page)
//  */
// export async function handleMoveSection(
//   pagePath,
//   oldSectionName,
//   newSectionName,
//   options
// ) {
//   try {
//     const sourceSite = await resolveSite(options.site);
//     const oldPage = sourceSite.getPage(pagePath);
//     const oldSection = oldPage.getSection(oldSectionName);

//     // Determine target site (same as source if not specified)
//     const targetSite = options.targetSite
//       ? await resolveSite(options.targetSite)
//       : sourceSite;

//     // Determine target page (same as source if not specified)
//     const targetPagePath = options.targetPage || pagePath;
//     const newPage = targetSite.getPage(targetPagePath);
//     const newSection = newPage.getSection(newSectionName);

//     // Log the operation with site information if cross-site
//     if (sourceSite.name !== targetSite.name) {
//       console.log(
//         `Moving section from site "${sourceSite.name}" page "${pagePath}/${oldSectionName}" to site "${targetSite.name}" page "${targetPagePath}/${newSectionName}"...`
//       );
//     } else {
//       console.log(
//         `Moving section from "${pagePath}/${oldSectionName}" to "${targetPagePath}/${newSectionName}"...`
//       );
//     }

//     // Your existing code to move/rename the main section file
//     // ...

//     // Then move translations
//     console.log("Moving corresponding translations...");
//     const result = await moveSectionTranslations(oldSection, newSection);

//     if (result.crossSite) {
//       console.log(
//         `Cross-site operation: copied and deleted ${result.movedCount} translated section files`
//       );
//     } else {
//       console.log(
//         `Successfully moved ${result.movedCount} translated section files`
//       );
//     }

//     if (!result.success) {
//       console.warn("Some translated section files had issues:");
//       result.changes
//         .filter((c) => c.type === "error")
//         .forEach((error) => {
//           console.error(`  - ${error.error}`);
//         });
//     }
//   } catch (error) {
//     console.error("Error moving section:", error);
//   }
// }

// /**
//  * Command handler for moving/renaming a page and its translations
//  *
//  * @param {string} oldPagePath - Original page path
//  * @param {string} newPagePath - New page path
//  * @param {Object} options - Command options
//  * @param {string} [options.site] - Source site name
//  * @param {string} [options.targetSite] - Target site name (if moving to a different site)
//  */
// export async function handleMovePage(oldPagePath, newPagePath, options) {
//   try {
//     const sourceSite = await resolveSite(options.site);
//     const oldPage = sourceSite.getPage(oldPagePath);

//     // Determine target site (same as source if not specified)
//     const targetSite = options.targetSite
//       ? await resolveSite(options.targetSite)
//       : sourceSite;

//     const newPage = targetSite.getPage(newPagePath);

//     // Log the operation with site information if cross-site
//     if (sourceSite.name !== targetSite.name) {
//       console.log(
//         `Moving page from site "${sourceSite.name}" path "${oldPagePath}" to site "${targetSite.name}" path "${newPagePath}"...`
//       );
//     } else {
//       console.log(`Moving page from "${oldPagePath}" to "${newPagePath}"...`);
//     }

//     // Your existing code to move/rename the main page folder
//     // ...

//     // Then move translations
//     console.log("Moving corresponding translations...");
//     const result = await movePageTranslations(oldPage, newPage);

//     if (result.crossSite) {
//       console.log(
//         `Cross-site operation: copied and deleted ${result.movedCount} translated page folders`
//       );
//     } else {
//       console.log(
//         `Successfully moved ${result.movedCount} translated page folders`
//       );
//     }

//     if (!result.success) {
//       console.warn("Some translated page folders had issues:");
//       result.changes
//         .filter((c) => c.type === "error")
//         .forEach((error) => {
//           console.error(`  - ${error.error}`);
//         });
//     }
//   } catch (error) {
//     console.error("Error moving page:", error);
//   }
// }

// /**
//  * Examples of CLI command registration
//  *
//  * This is an example of how you might register these commands in a CLI tool
//  * such as Commander or Yargs.
//  */

// /*
//   Using Commander:

//   import { program } from 'commander';

//   program
//     .command('sync-languages')
//     .description('Synchronize language folders with the main structure')
//     .option('-s, --site <name>', 'Site name')
//     .option('-d, --dry-run', 'Only analyze without making changes', false)
//     .option('--no-create-folders', 'Do not create missing folders')
//     .option('--no-remove-invalid', 'Do not remove invalid content')
//     .option('-t, --create-templates', 'Create empty translation templates', false)
//     .option('-l, --languages <langs...>', 'Specific languages to sync')
//     .option('-p, --pages <pages...>', 'Specific pages to sync')
//     .action(handleSyncLanguages);

//   program
//     .command('remove-section <page> <section>')
//     .description('Remove a section and its translations')
//     .option('-s, --site <name>', 'Site name')
//     .action(handleRemoveSection);

//   program
//     .command('remove-page <page>')
//     .description('Remove a page and its translations')
//     .option('-s, --site <name>', 'Site name')
//     .action(handleRemovePage);

//   program
//     .command('move-section <page> <old-section> <new-section>')
//     .description('Move/rename a section and its translations')
//     .option('-s, --site <name>', 'Site name')
//     .option('-t, --target-page <page>', 'Target page (if moving to a different page)')
//     .action(handleMoveSection);

//   program
//     .command('move-page <old-page> <new-page>')
//     .description('Move/rename a page and its translations')
//     .option('-s, --site <name>', 'Site name')
//     .action(handleMovePage);
//   */

// // Example calls to the handlers
// async function examples() {
//   // Sync all languages
//   await handleSyncLanguages({
//     dryRun: true,
//   });

//   // Create missing structure without templates
//   await handleSyncLanguages({
//     createFolders: true,
//     removeInvalid: true,
//     createTemplates: false,
//   });

//   // Remove a section and its translations
//   await handleRemoveSection("about", "team", {});

//   // Remove a page and its translations
//   await handleRemovePage("contact", {});

//   // Rename a section
//   await handleMoveSection("index", "hero", "banner", {});

//   // Move a section to another page
//   await handleMoveSection("index", "features", "main-features", {
//     targetPage: "features",
//   });

//   // Rename a page
//   await handleMovePage("about", "about-us", {});

//   // Cross-site operations

//   // Move a section to another site
//   await handleMoveSection("index", "hero", "landing-hero", {
//     site: "main",
//     targetSite: "landing",
//     targetPage: "home",
//   });

//   // Move a page to another site
//   await handleMovePage("about", "about-us", {
//     site: "main",
//     targetSite: "landing",
//   });
// }

// // This is just for example purposes
// // examples().catch(console.error);
