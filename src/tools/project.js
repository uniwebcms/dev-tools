import pathUtils from "path";
import { initGitRepo, runScript, runInstallScript } from "../utils/shell.js";
// import { logger } from "../utils/logger.js";
import { applyTemplate, TEMPLATE_TYPES } from "../utils/templates.js";
import { addSite } from "./site.js";
import { addModule } from "./module.js";
import cliContext from "../context.js";
import {
  resolveProject,
  resolveSite,
  scanDirectory,
  getDirectories,
} from "../utils/file.js";
import { Project } from "../utils/types.js";
import os from "os";

const { buffer, chalk } = cliContext;

const packageManagers = {
  npm: {
    name: "npm",
    version: "10.5.0",
    lockFile: "package-lock.json",
    additionalFiles: {},
  },
  yarn: {
    name: "yarn",
    version: "1.22.22",
    lockFile: "yarn.lock",
    additionalFiles: {},
  },
  "yarn-pnp": {
    name: "yarn",
    version: "4.9.1",
    lockFile: "yarn.lock",
    additionalFiles: {
      ".yarnrc.yml": "nodeLinker: pnp",
    },
  },
  pnpm: {
    name: "pnpm",
    version: "10.4.1",
    lockFile: "pnpm-lock.yaml",
    additionalFiles: {},
  },
  bun: {
    name: "bun",
    version: "1.2.9",
    lockFile: "bun.lockb",
    additionalFiles: {},
  },
};

/**
 * Check if there is a newer version of the uniweb CLI.
 */
export async function check() {
  const { packageName, version: currentVersion } = cliContext.options;

  const latestVersion = await fetchLatestVersion(packageName);
  if (!latestVersion) return currentVersion;

  const updateAvailable = compareVersions(currentVersion, latestVersion) < 0;

  if (updateAvailable) {
    buffer.table(
      [`Update available for ${packageName}`],
      [
        [`Current: ${currentVersion}`],
        [`Latest:  ${latestVersion}`],
        [`Run: npm install -g ${packageName}`],
      ]
    );
  } else {
    buffer.text(`The current version ${currentVersion} is the latest`);
  }

  return latestVersion;
}

/**
 * Initialize a new Uniweb project.
 *
 * @param {string} name - Project name
 * @param {string} [site=""] - Name of a site to add ("/" for root site)
 * @param {string} [module=""] - Name of a module to add
 * @param {string} [template=""] - Quick options: basic, develop
 * @param {string} [pm=""] - Name of a package manager (npm or yarn) to install dependencies
 * @param {boolean} [noGit=false] - Skip git initialization
 * @param {boolean} [dev=false] - Use development dependencies
 */
export async function init(name, site, module, template, pm, noGit, dev) {
  try {
    const latestVersion = await check();

    let packageManager = "";

    if (pm) {
      pm = packageManagers[pm.toLowerCase()];
      packageManager = `${pm.name}@${pm.version}`;
    }

    const project = new Project(pathUtils.resolve(name));
    const initGit = !noGit;

    const {
      peerDependencies = {},
      packageName,
      version: currentVersion,
    } = cliContext.options;

    // const toolkitName = "@uniwebcms/framework";
    const toolkitVersion = dev
      ? `file:${os.homedir()}/Proximify/framework`
      : "^" + (latestVersion || currentVersion);

    const options = {
      name: project.name,
      packageManager,
      toolkitName: packageName,
      toolkitVersion,
      devMode: dev,
      devDependencies: JSON.stringify(peerDependencies, null, 8)
        .slice(1, -1)
        .trim(),
    };

    await applyTemplate(TEMPLATE_TYPES.PROJECT, project.path, options);

    // if (!template && !site && !module) {
    //   template = "develop";
    // }

    if (["basic", "single", "simple", "single-site"].includes(template)) {
      site ||= "/";
    } else if (["dev", "develop", "developer", "advanced"].includes(template)) {
      module ||= "M1";
      site ||= "test";
    }

    if (module) {
      process.chdir(project.path);
      await addModule(module);
    }

    if (site) {
      process.chdir(project.path);
      await addSite(site, module);
    }

    if (initGit) {
      buffer.info("Initializing git repository...");
      try {
        // await execAsync("git init", { cwd: project.path });
        await initGitRepo(project.path);
        // logger.info("Git repository initialized.");
      } catch (error) {
        buffer.warn(`Git initialization failed: ${error.message}`);
        buffer.warn("You can initialize git manually later if needed.");
      }
    }

    if (pm) {
      await runInstallScript(project);
    }

    // Print success message and next steps
    // logger.success(`\n✅ Project ${project.name} created successfully!`);
    buffer.success(`\nTo get started:`);
    let step = 1;
    buffer.step(`  ${step++}. cd ${project.name}`);
    if (!pm) buffer.step(`  ${step++}. npm i (or yarn)`);
    buffer.step(`  ${step++}. uniweb start`);
  } catch (error) {
    buffer.error(`Failed to initialize project`, error.message);
  }
}

/**
 * Starts a development server for a site.
 *
 * @param {string} [site=""] - Name of the site to serve
 * @param {string} [module=""] - Name of the module to serve
 * @param {number} [port=3000] - Port to run the dev server on
 */
export async function start(site, module, port) {
  const {
    chalk,
    options: { verbose },
  } = cliContext;
  site = await resolveSite(site);

  try {
    const serverUrl = `http://localhost:${port}/sites/${site.name}/`;

    // Create a function to print the important info
    const printInfo = () => {
      // Clear line and move to start of line
      // process.stdout.write("\x1b[2K\r");
      buffer.clearLine();

      // Print with visible separators
      // console.log("\n" + "=".repeat(60));
      buffer.text("\n" + "=".repeat(60));
      buffer.info(`Server running at ${chalk.cyan(serverUrl)}`);
      buffer.info(`Press ${chalk.yellow("Ctrl+C")} to stop`);
      // console.log("=".repeat(60) + "\n");
      buffer.text("=".repeat(60));
      buffer.print();
    };

    // Print once before starting the server
    printInfo();

    if (verbose) {
      // Print again after 5 seconds
      setTimeout(printInfo, 5000);
    }

    // buffer.info(`Server running at ${chalk.cyan(serverUrl)}`);
    // buffer.info(`Press ${chalk.yellow("Ctrl+C")} to stop`);

    // await runScript("install");

    const { code, output } = await runScript("start", [`--port ${port}`], {
      captureOutput: !verbose,
    });

    if (output) {
      buffer.text(output);
    }

    if (code === 127) {
      buffer.error(
        "Some dependencies seem to be missing.\nPlease run `npm install` or `yarn install` and retry."
      );
    }
  } catch (error) {
    buffer.error(error.message);
  }
}

/**
 * Lists the sites of the project
 */
export async function listSites() {
  const project = await resolveProject();
  const dirPath = project.sitesDir;
  return getDirectories(dirPath);

  // modules.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Lists local modules
 */
export async function listModules() {
  const project = await resolveProject();
  return project.listModules();
}

/**
 * Scans a directory recursively:
 *
 * 1. If a directory has only files, it's represented as an array of filenames
 * 2. If a directory has subdirectories, it's an object with:
 *    - The "*" key containing an array of files
 *    - Other keys for subdirectories
 *
 * @param {string} [path=""] - A relative path to scan
 * @param {number} [depth=-1] - Maximum depth to scan (-1 for unlimited)
 */
export async function listFiles(path, depth) {
  const project = await resolveProject();

  if (path) {
    path = pathUtils.resolve(project.path, path);
    project.validatePath(path);
  } else {
    path = project.path;
  }
  return scanDirectory(path, { depth: parseInt(depth) });
}

/**
 * Fetch the latest version from npm
 * @param {string} packageName - Package name
 * @returns {Promise<object>} Latest version data
 */
async function fetchLatestVersion(packageName) {
  try {
    const registry = "https://registry.npmjs.org/";
    const url = `${registry}${packageName}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch from npm registry: ${response.status} ${response.statusText}`
      );
    }

    const packageInfo = await response.json();

    return packageInfo["dist-tags"].latest;
    // return {
    //   latestVersion: packageInfo["dist-tags"].latest,
    //   versions: packageInfo.versions,
    //   fetchedAt: new Date().toISOString(),
    // };
  } catch (error) {
    // throw new Error(`Failed to fetch latest version: ${error.message}`);
    return null;
  }
}

/**
 * Compare two semantic versions
 * @param {string} versionA - First version
 * @param {string} versionB - Second version
 * @returns {number} -1 if A < B, 0 if A = B, 1 if A > B
 */
function compareVersions(versionA, versionB) {
  const partsA = versionA.split(".").map(Number);
  const partsB = versionB.split(".").map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const a = partsA[i] || 0;
    const b = partsB[i] || 0;

    if (a < b) return -1;
    if (a > b) return 1;
  }

  return 0;
}
