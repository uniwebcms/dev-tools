import os from "os";
import path from "path";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import { logger } from "./logger.js";
import { resolveProject } from "./file.js";

export const execAsync = promisify(exec);

export async function initGitRepo(projectPath) {
  await execAsync("git init", { cwd: projectPath });
}

export async function runInstallScript(project) {
  const config = await project.loadConfig();

  if (!config.packageManager) return null;

  logger.info(`Installing dependencies with ${config.packageManager}...`);
  process.chdir(project.path);
  await runScript("install", [], {});
}

/**
 * Runs an npm script with the current package manager
 * @param {string} scriptName - The name of the script to run (e.g., "start", "build")
 * @param {string[]} args - Additional arguments to pass to the script
 * @param {object} options - Additional options
 * @param {boolean} [options.silent=false] - Whether to suppress output
 * @param {boolean} [options.captureOutput=false] - Whether to capture output instead of forwarding it
 * @param {string} [options.cwd] - Working directory to use if different from the project path
 * @returns {Promise<{code: number, output?: string}>} - Exit code and optional captured output
 */
export async function runScript(scriptName, args = [], options = {}) {
  const project = await resolveProject();
  const config = await project.loadConfig();

  // Get package manager
  const pm = config.packageManager;

  if (!pm) {
    throw new Error("Cannot determine the package manager to use.");
  }

  let cmd = scriptName;

  // Determine if we need to add "run"
  if (pm !== "yarn" && scriptName !== "install" && scriptName !== "start") {
    cmd = "run " + cmd;
  }

  return runPackageCommand(pm, cmd, [], { ...options, scriptArgs: args });
}

/**
 * Runs a direct package manager command
 * @param {string} packageManager - The package manager to use (npm, yarn, etc.)
 * @param {string} cmd - The command (install, add, remove, etc.)
 * @param {string[]} cmdArgs - Command arguments
 * @param {object} options - Additional options
 * @param {string[]} [options.scriptArgs=[]] - Extra script arguments
 * @param {boolean} [options.silent=false] - Whether to suppress output
 * @param {boolean} [options.captureOutput=false] - Whether to capture output instead of forwarding it
 * @param {string} [options.cwd] - Working directory to use if different from the project path
 * @returns {Promise<{code: number, output?: string}>} - Exit code and optional captured output
 */
export async function runPackageCommand(
  packageManager,
  cmd,
  cmdArgs = [],
  options = {}
) {
  let capturedOutput = "";

  try {
    const project = await resolveProject();

    // Determine working directory - use provided cwd or default to project path
    const workingDir = options.cwd || project.path;

    const { captureOutput, scriptArgs = [] } = options;

    // Build the command parts, filtering out empty strings
    const commandParts = [
      packageManager,
      mapPackageCommand(packageManager, cmd),
      ...cmdArgs,
      scriptArgs.length > 0 ? `-- ${scriptArgs.join(" ")}` : "",
    ].filter(Boolean); // Remove empty strings

    const command = commandParts.join(" ");

    logger.verbose(
      `Running command: ${command}${
        workingDir !== project.path ? ` in ${workingDir}` : ""
      }`
    );

    const env = {
      ...process.env,
      npm_config_fund: "false",
      npm_config_audit: "false",
      npm_config_progress: "false",
      npm_config_loglevel: "warn",
    };

    // Execute the command
    const childProcess = exec(command, { cwd: workingDir, env });

    // Forward I/O unless silent
    if (captureOutput) {
      // Capture output to string
      childProcess.stdout?.on("data", (data) => {
        capturedOutput += data.toString();
      });
      childProcess.stderr?.on("data", (data) => {
        capturedOutput += data.toString();
      });
    } else {
      childProcess.stdout?.pipe(process.stdout);
      childProcess.stderr?.pipe(process.stderr);
    }

    // Handle graceful exit
    const sigintHandler = () => {
      childProcess.kill("SIGINT");
    };

    process.on("SIGINT", sigintHandler);

    // Wait for the process to exit
    return await new Promise((resolve, reject) => {
      childProcess.on("exit", (code) => {
        // Remove the SIGINT handler to prevent memory leaks
        process.off("SIGINT", sigintHandler);

        resolve({
          code: code || 0,
          output: captureOutput ? capturedOutput : undefined,
        });
      });

      childProcess.on("error", (error) => {
        // Remove the SIGINT handler to prevent memory leaks
        process.off("SIGINT", sigintHandler);

        reject(
          new Error(
            `Failed to run command '${cmd}': ${error.message}\n\n${capturedOutput}\n`
          )
        );
      });
    });
  } catch (error) {
    logger.error(
      `Failed to run command '${cmd}': ${error.message}\n\n${capturedOutput}\n`
    );
    throw error;
  }
}

/**
 * Opens a file in the user's default editor
 *
 * @param {string} filePath - Path to the file to open
 * @returns {Promise<void>}
 */
export async function openInEditor(filePath) {
  const project = await resolveProject();

  project.validatePath(filePath);

  const config = await project.loadConfig();
  const editor = config.editor || getDefaultEditor();

  return new Promise((resolve, reject) => {
    // Spawn the editor process
    const child = spawn(editor, [filePath], {
      stdio: "inherit",
      shell: true,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Editor process exited with code ${code}`));
      }
    });

    child.on("error", (err) => {
      reject(new Error(`Failed to start editor: ${err.message}`));
    });
  });
}

/**
 * Gets the default editor based on the operating system
 *
 * @returns {string} Default editor command
 */
function getDefaultEditor() {
  const platform = os.platform();

  if (platform === "win32") {
    return "notepad";
  } else if (platform === "darwin") {
    return "open -t";
  } else {
    // Linux and others
    return "nano";
  }
}

/**
 * Opens a new terminal window at the given path.
 * @param {string} targetPath - The absolute or relative path to open in the terminal.
 */
export async function openTerminalAt(targetPath) {
  const platform = os.platform();
  const absPath = path.resolve(targetPath);

  try {
    if (platform === "darwin") {
      // macOS - Terminal.app via AppleScript
      const command = `osascript -e 'tell application "Terminal"
        do script "cd \\"${absPath}\\""
        activate
      end tell'`;
      await execAsync(command);
    } else if (platform === "win32") {
      // Windows - cmd.exe with /K (stay open)
      const command = `start cmd.exe /K "cd /d \\"${absPath}\\""`;
      await execAsync(command);
    } else if (platform === "linux") {
      // Linux - gnome-terminal is common, can be expanded
      const command = `gnome-terminal --working-directory="${absPath}"`;
      await execAsync(command);
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }
  } catch (err) {
    console.error("Failed to open terminal:", err.message);
  }
}

/**
 * Opens a URL in the default browser
 * @param {string} url - The URL to open
 */
export function openBrowser(url) {
  const command = (() => {
    switch (os.platform()) {
      case "win32":
        return `start ${url}`;
      case "darwin":
        return `open ${url}`;
      default:
        // Linux and others
        return `xdg-open ${url}`;
    }
  })();

  return new Promise((resolve, reject) => {
    exec(command, (error) => {
      if (error) {
        console.log(`Could not open browser. Try visiting ${url} manually.`);
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Maps generic package commands to package manager-specific commands
 * @param {string} pm - Package manager name
 * @param {string} command - Generic command name
 * @returns {string} Package manager-specific command
 */
function mapPackageCommand(pm, command) {
  const commandMap = {
    npm: {
      add: "install",
      remove: "uninstall",
    },
    // Other package managers use standard commands
    yarn: {},
    pnpm: {},
    bun: {},
  };

  return (commandMap[pm] && commandMap[pm][command]) || command;
}
