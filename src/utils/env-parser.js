import fs from "fs/promises";
import path from "path";

/**
 * Custom error for .env parsing issues
 */
export class EnvParseError extends Error {
  constructor(message, lineNumber = null) {
    super(message + (lineNumber !== null ? ` at line ${lineNumber}` : ""));
    this.name = "EnvParseError";
    this.lineNumber = lineNumber;
  }
}

/**
 * Parses a .env file and returns its contents as an object
 * @param {string} filePath - Path to the .env file
 * @param {Object} options - Configuration options
 * @param {boolean} options.interpolate - Whether to interpolate variables (default: true)
 * @param {Object} options.defaults - Default values to use if not in file
 * @returns {Promise<object>} - Object containing the parsed environment variables
 */
export async function parseEnvFile(filePath, options = {}) {
  const { interpolate = true, defaults = {} } = options;

  try {
    // Ensure file path is absolute
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(process.cwd(), filePath);

    // Read the file content
    const content = await fs.readFile(absolutePath, "utf8");

    // Initialize with defaults
    const result = { ...defaults };

    // Split by lines (handling both CRLF and LF)
    const lines = content.replace(/\r\n/g, "\n").split("\n");

    let multilineKey = null;
    let multilineValue = "";
    let isMultiline = false;

    for (let i = 0; i < lines.length; i++) {
      const lineNumber = i + 1;
      let line = lines[i].trim();

      // Skip empty lines and comments
      if (!line || line.startsWith("#")) {
        continue;
      }

      // Handle multiline values
      if (isMultiline) {
        if (line.endsWith('"') && !line.endsWith('\\"')) {
          // End of multiline value
          multilineValue += line.slice(0, -1);
          result[multilineKey] = multilineValue;
          isMultiline = false;
          multilineKey = null;
          multilineValue = "";
        } else {
          // Continue multiline value
          multilineValue += line + "\n";
        }
        continue;
      }

      // Find the first unescaped equals sign
      let equalSignIndex = -1;
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        if (
          (line[j] === '"' || line[j] === "'") &&
          (j === 0 || line[j - 1] !== "\\")
        ) {
          inQuotes = !inQuotes;
        } else if (line[j] === "=" && !inQuotes) {
          equalSignIndex = j;
          break;
        }
      }

      if (equalSignIndex === -1) {
        throw new EnvParseError(
          `Invalid line format, missing equals sign`,
          lineNumber
        );
      }

      // Extract key and raw value
      const key = line.substring(0, equalSignIndex).trim();
      let value = line.substring(equalSignIndex + 1).trim();

      if (!key) {
        throw new EnvParseError(`Empty key is not allowed`, lineNumber);
      }

      // Handle quoted values
      if (value.startsWith('"')) {
        if (value.endsWith('"') && !value.endsWith('\\"')) {
          // Single line quoted value
          value = value.slice(1, -1).replace(/\\"/g, '"');
        } else {
          // Start of multiline value
          isMultiline = true;
          multilineKey = key;
          multilineValue = value.slice(1) + "\n";
          continue;
        }
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1).replace(/\\'/g, "'");
      }

      // Add to result object
      result[key] = value;
    }

    // Handle variable interpolation if enabled
    if (interpolate) {
      for (const [key, value] of Object.entries(result)) {
        result[key] = interpolateValue(value, result);
      }
    }

    return result;
  } catch (error) {
    if (error instanceof EnvParseError) {
      throw error;
    }

    if (error.code === "ENOENT") {
      return null;
      //   throw new Error(`Environment file not found: ${filePath}`);
    }

    throw new Error(`Error parsing .env file: ${error.message}`);
  }
}

/**
 * Interpolates variables in a string value
 * @param {string} value - The value to interpolate
 * @param {Object} envVars - The object containing all environment variables
 * @returns {string} - The interpolated value
 */
function interpolateValue(value, envVars) {
  if (typeof value !== "string") return value;

  return value.replace(/\${([^}]+)}/g, (match, varName) => {
    if (envVars[varName] !== undefined) {
      return envVars[varName];
    }
    // Return the original placeholder if variable is not defined
    return match;
  });
}
