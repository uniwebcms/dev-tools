// deployment.js - Deployment and publishing functions for Uniweb

import fs from "fs/promises";
import path from "path";
import {
  fileExists,
  resolveSite,
  readJsonFile,
  writeJsonFile,
  readYamlFile,
  writeYamlFile,
  resolveProject,
} from "../utils/file.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Default deployment configuration
 */
const DEFAULT_DEPLOYMENT_CONFIG = {
  environments: {
    production: {
      hosting: "netlify",
      siteId: "",
      branch: "main",
    },
  },
  defaultEnvironment: "production",
};

/**
 * Deploys a site to a hosting provider.
 *
 * @param {string} site - Name of the site.
 * @param {string} [environment="production"] - Deployment environment.
 * @returns {Object} Deployment information
 */
export async function deploySite(site, environment = "production") {
  site = await resolveSite(site);

  // Check for deployment configuration
  const deploymentConfigPath = path.join(site.path, "deployment.yml");

  if (!(await fileExists(deploymentConfigPath))) {
    throw new Error(
      `Deployment configuration not found for site '${siteName}'. Run configureDeployment first.`
    );
  }

  // Read deployment configuration
  const deploymentConfig = await readYamlFile(deploymentConfigPath);

  // Check if environment exists
  if (
    !deploymentConfig.environments ||
    !deploymentConfig.environments[environment]
  ) {
    throw new Error(
      `Environment '${environment}' not defined for site '${siteName}'`
    );
  }

  const envConfig = deploymentConfig.environments[environment];

  // Build the site first
  const buildDir = path.join(site.path, "dist");

  // In a real implementation, you'd call the buildSite function directly
  // rather than duplicating the logic here
  const project = await resolveProject();
  const isMultiSite = siteName !== "/";

  let buildCommand;

  if (isMultiSite) {
    buildCommand = `cd ${projectPath} && npx uniweb-build --site=${site}`;
  } else {
    buildCommand = `cd ${site.path} && npx uniweb-build`;
  }

  try {
    await execAsync(buildCommand);
  } catch (error) {
    throw new Error(`Build failed before deployment: ${error.message}`);
  }

  // Now deploy the built site
  // The exact command depends on the hosting provider
  let deployCommand;

  switch (envConfig.hosting) {
    case "netlify":
      deployCommand = `cd ${site.path} && npx netlify deploy --dir=dist --site=${envConfig.siteId} --prod`;
      break;
    case "vercel":
      deployCommand = `cd ${site.path} && npx vercel --prod`;
      break;
    case "github":
      deployCommand = `cd ${site.path} && npx gh-pages -d dist -b ${envConfig.branch}`;
      break;
    default:
      throw new Error(`Unsupported hosting provider: ${envConfig.hosting}`);
  }

  try {
    const { stdout, stderr } = await execAsync(deployCommand);

    // Parse deploy URL from output (highly dependent on provider)
    let deployUrl = "";

    if (envConfig.hosting === "netlify") {
      const urlMatch = stdout.match(/Website URL:\s+(\S+)/);
      if (urlMatch) {
        deployUrl = urlMatch[1];
      }
    } else if (envConfig.hosting === "vercel") {
      const urlMatch = stdout.match(/Production:\s+(\S+)/);
      if (urlMatch) {
        deployUrl = urlMatch[1];
      }
    } else if (envConfig.hosting === "github") {
      deployUrl = `https://${envConfig.username}.github.io/${envConfig.repository}`;
    }

    return {
      site,
      environment,
      hosting: envConfig.hosting,
      path: site.path,
      buildDir,
      deployUrl,
      deployed: true,
      logs: stdout.trim(),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Deployment failed: ${error.message}`);
  }
}

/**
 * Publishes a module to the module registry.
 *
 * @param {string} module - Name of the module.
 * @param {string} [version=""] - Version to publish (empty for package.json version).
 * @returns {Object} Publishing information
 */
export async function publishModule(module, version = "") {
  if (!module) {
    throw new Error("Module name is required");
  }

  // Get project path
  const projectPath = process.cwd();

  // Build module path
  const modulePath = path.join(projectPath, "src", module);

  // Check if module exists
  if (!(await fileExists(modulePath))) {
    throw new Error(`Module '${module}' not found at ${modulePath}`);
  }

  // Check if package.json exists
  const packageJsonPath = path.join(modulePath, "package.json");
  if (!(await fileExists(packageJsonPath))) {
    throw new Error(`package.json not found for module '${module}'`);
  }

  // Read package.json
  const packageJson = await readJsonFile(packageJsonPath);

  // Update version if provided
  if (version) {
    packageJson.version = version;
    await writeJsonFile(packageJsonPath, packageJson);
  }

  // Build the module first
  try {
    await execAsync(
      `cd ${projectPath} && npx uniweb-build-module --module=${module}`
    );
  } catch (error) {
    throw new Error(`Module build failed before publishing: ${error.message}`);
  }

  // Publish to npm-compatible registry
  try {
    const { stdout, stderr } = await execAsync(
      `cd ${modulePath} && npm publish --access public`
    );

    return {
      module,
      version: packageJson.version,
      path: modulePath,
      published: true,
      logs: stdout.trim(),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Publishing failed: ${error.message}`);
  }
}

/**
 * Configures deployment settings for a site.
 *
 * @param {string} site - Name of the site.
 * @param {Object} settings - Deployment settings.
 * @returns {Object} Updated deployment settings
 */
export async function configureDeployment(site, settings) {
  if (!settings || typeof settings !== "object") {
    throw new Error("Deployment settings are required");
  }

  site = await resolveSite(site);

  // Get existing deployment config or create new one
  const deploymentConfigPath = path.join(site.path, "deployment.yml");
  let deploymentConfig = { ...DEFAULT_DEPLOYMENT_CONFIG };

  if (await fileExists(deploymentConfigPath)) {
    const existingConfig = await readYamlFile(deploymentConfigPath);
    deploymentConfig = { ...deploymentConfig, ...existingConfig };
  }

  // Update with new settings
  const updatedConfig = { ...deploymentConfig, ...settings };

  // Write updated config
  await writeYamlFile(deploymentConfigPath, updatedConfig);

  return {
    site,
    path: site.path,
    configPath: deploymentConfigPath,
    config: updatedConfig,
    updated: new Date().toISOString(),
  };
}

/**
 * Lists available deployment environments for a site.
 *
 * @param {string} site - Name of the site.
 * @returns {Object} List of environments with their information
 */
export async function listEnvironments(site) {
  site = await resolveSite(site);

  // Check for deployment configuration
  const deploymentConfigPath = path.join(site.path, "deployment.yml");

  if (!(await fileExists(deploymentConfigPath))) {
    return {
      site,
      count: 0,
      defaultEnvironment: null,
      environments: [],
    };
  }

  // Read deployment configuration
  const deploymentConfig = await readYamlFile(deploymentConfigPath);

  // Extract environments
  const environments = [];

  if (deploymentConfig.environments) {
    for (const [name, config] of Object.entries(
      deploymentConfig.environments
    )) {
      environments.push({
        name,
        hosting: config.hosting,
        isDefault: name === deploymentConfig.defaultEnvironment,
        ...config,
      });
    }
  }

  return {
    site,
    count: environments.length,
    defaultEnvironment: deploymentConfig.defaultEnvironment || null,
    environments: environments.sort((a, b) => a.name.localeCompare(b.name)),
  };
}
