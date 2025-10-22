/**
 * OutputBuffer - A flexible, mode-aware output formatting tool
 *
 * Provides a unified interface for generating formatted output in multiple modes:
 * - CLI (with colors and formatting when chalk is available)
 * - JSON (structured data with style metadata)
 * - Simple (plain text without formatting)
 *
 * Dependencies (chalk, table) are optional and injected at creation time.
 */

class TextStyler {
  constructor({ chalk, table }) {
    // Store dependencies or use minimal implementations
    this.chalk = chalk || createMinimalChalk();
    this.table = table || createMinimalTable();
    this.mode = "cli";
  }
  setFormatters({ chalk, table }) {
    if (chalk) this.chalk = chalk;
    if (table) this.table = table;
  }
  /**
   * Apply styling to text, with mode-awareness
   * @param {string} text - The text to style
   * @param {string|Array<string>} styles - Style(s) to apply
   * @returns {Object|string} Styled text object or string
   */
  style(text, styles) {
    if (!text) return text;

    // Normalize styles to array
    const styleList = Array.isArray(styles) ? styles : [styles];

    if (this.mode === "cli") {
      // In CLI mode, apply chalk styling if available
      let result = text;
      for (const style of styleList) {
        if (typeof this.chalk[style] === "function") {
          result = this.chalk[style](result);
        }
      }
      return result;
    } else if (this.mode === "simple") {
      // In simple mode, just return the text without styling
      return text;
    } else {
      // In other modes (like JSON), return an object with style metadata
      return {
        text,
        styles: styleList,
        toString() {
          return text;
        },
      };
    }
  }

  // Style helper methods
  red(text) {
    return this.style(text, "red");
  }
  green(text) {
    return this.style(text, "green");
  }
  yellow(text) {
    return this.style(text, "yellow");
  }
  blue(text) {
    return this.style(text, "blue");
  }
  magenta(text) {
    return this.style(text, "magenta");
  }
  cyan(text) {
    return this.style(text, "cyan");
  }
  white(text) {
    return this.style(text, "white");
  }
  gray(text) {
    return this.style(text, "gray");
  }

  bold(text) {
    return this.style(text, "bold");
  }
  italic(text) {
    return this.style(text, "italic");
  }
  underline(text) {
    return this.style(text, "underline");
  }
}

/**
 * OutputBuffer class for flexible, mode-aware output formatting
 */
export class OutputBuffer {
  /**
   * Create a new OutputBuffer
   * @param {Object} options - Configuration options
   * @param {string} options.mode - Output mode: 'cli', 'json', or 'simple' (default: 'cli')
   * @param {string} options.verbosity - Verbosity level: 'quiet', 'normal', 'verbose', 'debug' (default: 'normal')
   * @param {Object} dependencies - Optional dependencies
   * @param {Object} dependencies.chalk - Chalk instance for terminal styling
   * @param {Function} dependencies.table - Table formatting function
   */
  constructor(options = {}, dependencies = {}) {
    this.items = [];
    this.mode = options.mode || "cli";
    this.verbosity = options.verbosity || "normal";
    this.indentLevel = 0;
    this.styler = new TextStyler(dependencies);
  }
  size() {
    return this.items.length;
  }
  setFormatters(formatters) {
    this.styler.setFormatters(formatters);
  }
  getStyler() {
    return this.styler;
  }
  formatTable(rows, config) {
    return this.styler.table(rows, config);
  }
  /**
   * Apply styling to text, with mode-awareness
   * @param {string} text - The text to style
   * @param {string|Array<string>} styles - Style(s) to apply
   * @returns {Object|string} Styled text object or string
   */
  style(text, styles) {
    return this.styler.style(text, styles);
  }

  // Combined styles
  error(text, message = "") {
    // return this.text(this.style(text, ["red", "bold"]) + message);
    return this.text(
      this.styler.red("error ") +
        this.styler.bold(text) +
        (message && `: ${message}`)
    );
  }
  warn(text) {
    // return this.style(text, ["yellow", "bold"]);
    return this.text(this.style(text, ["yellow", "bold"]));
  }
  success(text) {
    // return this.style(text, ["green", "bold"]);
    return this.text(this.style(text, ["green", "bold"]));
  }
  info(text) {
    // return this.style(text, ["blue", "bold"]);
    return this.text(this.style(text, ["blue", "bold"]));
  }
  verbose(text) {
    if (this.verbosity === "verbose") {
      return this.text(this.style(text, ["cyan"]));
    }
  }

  step(message) {
    return this.text(this.styler.green("→ ") + message);
  }

  /**
   * Add an item to the buffer
   * @private
   */
  #addItem(item) {
    // Add current indent level to the item
    this.items.push({ ...item, indentLevel: this.indentLevel });
    if (this.verbosity === "verbose") this.print;
    return this;
  }

  // Heading methods
  h1(text) {
    return this.#addItem({ type: "heading", level: 1, text });
  }
  h2(text) {
    return this.#addItem({ type: "heading", level: 2, text });
  }
  h3(text) {
    return this.#addItem({ type: "heading", level: 3, text });
  }

  // Text content
  text(content) {
    return this.#addItem({ type: "text", text: content });
  }

  // Line break
  br() {
    return this.#addItem({ type: "break" });
  }

  clearLine() {
    return this.#addItem({ type: "clear-line" });
  }

  // Key-value properties with importance levels
  prop(key, value) {
    return this.#addItem({
      type: "property",
      key,
      value,
      importance: "normal",
    });
  }
  keyInfo(key, value) {
    return this.#addItem({ type: "property", key, value, importance: "high" });
  }
  detail(key, value) {
    return this.#addItem({ type: "property", key, value, importance: "low" });
  }

  // Section with optional title
  section(title) {
    return this.#addItem({ type: "section", title });
  }

  // Table with headers and rows
  table(headers, rows, config = {}) {
    return this.#addItem({ type: "table", headers, rows, config });
  }

  // Lists
  list(items) {
    return this.#addItem({ type: "list", items, ordered: false });
  }
  ol(items) {
    return this.#addItem({ type: "list", items, ordered: true });
  }

  // Debug information
  debug(info) {
    return this.#addItem({ type: "debug", info });
  }

  // Raw data that will be included in JSON but may be formatted differently in other modes
  data(value) {
    return this.#addItem({ type: "data", value });
  }

  /**
   * Create a nested context with increased indentation
   * @param {string} name - Name of the context (optional)
   * @param {Function} fn - Function to execute within the context
   */
  with(name, fn) {
    if (typeof name === "function") {
      fn = name;
      name = null;
    }

    if (name) {
      this.keyInfo(name, "");
    }

    this.indentLevel++;
    fn(this);
    this.indentLevel--;

    return this;
  }

  /**
   * Conditionally add content to the buffer
   * @param {boolean} condition - Condition to evaluate
   * @param {Function} fn - Function to execute if condition is true
   */
  when(condition, fn) {
    if (condition) {
      fn(this);
    }
    return this;
  }

  /**
   * Set output mode
   * @param {string} value - Mode to set
   */
  setMode(value) {
    this.mode = value;
    this.styler.mode = value;
    return this;
  }

  /**
   * Set verbosity level
   * @param {string} level - Verbosity level
   */
  setVerbosity(level) {
    this.verbosity = level;
    return this;
  }

  /**
   * Generate output based on current mode
   * @returns {string} Rendered output
   */
  render() {
    switch (this.mode) {
      case "json":
        return this.#renderJSON();
      case "simple":
        return this.#renderSimple();
      case "cli":
      default:
        return this.#renderCLI();
    }
  }

  /**
   * Render output for CLI display with colors and formatting
   * @private
   */
  #renderCLI() {
    let output = "";

    for (const item of this.items) {
      // Skip based on verbosity
      if (item.type === "debug" && this.verbosity !== "debug") continue;
      if (item.importance === "low" && this.verbosity === "quiet") continue;

      const indent = "  ".repeat(item.indentLevel || 0);

      switch (item.type) {
        case "heading": {
          let headingStyle;
          if (item.level === 1)
            headingStyle = (text) => this.style(text, ["bold", "underline"]);
          else if (item.level === 2)
            headingStyle = (text) => this.styler.bold(text);
          else headingStyle = (text) => this.styler.italic(text);

          output += indent + headingStyle(item.text) + "\n";
          break;
        }

        case "text":
          output += indent + item.text + "\n";
          break;

        case "break":
          output += "\n";
          break;

        case "clear-line":
          // Clear line and move to start of line
          output += "\x1b[2K\r";
          break;

        case "property": {
          const styles =
            item.importance === "low" ? ["gray"] : ["bold", "cyan"];
          output += `${indent}${this.style(item.key, styles)}: ${item.value}\n`;
          break;
        }

        case "section":
          output += `${indent}${this.styler.bold(item.title)}:\n`;
          break;

        case "table": {
          try {
            // Apply indentation to each row
            const tableConfig = {
              ...(item.config || {}),
              drawHorizontalLine: (index, size) => {
                // Only draw lines at top, bottom, and after headers
                return index === 0 || index === 1 || index === size;
              },
            };

            const tableOutput = this.formatTable(
              [item.headers, ...item.rows],
              tableConfig
            )
              .split("\n")
              .map((line) => indent + line)
              .join("\n");

            output += tableOutput + "\n";
          } catch (error) {
            // Fallback if table formatter fails
            output +=
              indent +
              `Table with ${item.rows.length} rows and ${item.headers.length} columns\n`;
            console.error("Error rendering table:", error);
          }
          break;
        }

        case "list":
          item.items.forEach((listItem, index) => {
            const marker = item.ordered ? `${index + 1}.` : "•";
            output += `${indent}${marker} ${listItem}\n`;
          });
          break;

        case "debug":
          output +=
            indent +
            this.styler.gray(`[DEBUG] ${JSON.stringify(item.info, null, 2)}\n`);
          break;

        case "data":
          // For raw data in CLI mode, use console.dir-like formatting
          const dataStr = JSON.stringify(item.value, null, 2)
            .split("\n")
            .map((line) => indent + line)
            .join("\n");
          output += dataStr + "\n";
          break;
      }
    }

    return output;
  }

  /**
   * Render output as simple plain text without formatting
   * @private
   */
  #renderSimple() {
    let output = "";

    for (const item of this.items) {
      // Skip based on verbosity
      if (item.type === "debug" && this.verbosity !== "debug") continue;
      if (item.importance === "low" && this.verbosity === "quiet") continue;

      const indent = "  ".repeat(item.indentLevel || 0);

      switch (item.type) {
        case "heading": {
          const prefix =
            item.level === 1 ? "== " : item.level === 2 ? "-- " : "- ";
          const suffix =
            item.level === 1 ? " ==" : item.level === 2 ? " --" : " -";
          output +=
            indent + prefix + this.#extractText(item.text) + suffix + "\n";
          break;
        }

        case "text":
          output += indent + this.#extractText(item.text) + "\n";
          break;

        case "break":
          output += "\n";
          break;

        case "property": {
          const key = this.#extractText(item.key);
          const value = this.#extractText(item.value);
          output += `${indent}${key}: ${value}\n`;
          break;
        }

        case "section": {
          const title = this.#extractText(item.title);
          output += `${indent}${title}:\n`;
          break;
        }

        case "table": {
          // Extract text from styled headers and rows
          const headers = Array.isArray(item.headers)
            ? item.headers.map((h) => this.#extractText(h))
            : [];

          const rows = Array.isArray(item.rows)
            ? item.rows.map((row) =>
                Array.isArray(row)
                  ? row.map((cell) => this.#extractText(cell))
                  : []
              )
            : [];

          // Simple table rendering
          const allRows = [headers, ...rows];

          // Calculate column widths
          const colWidths = [];
          allRows.forEach((row) => {
            row.forEach((cell, i) => {
              colWidths[i] = Math.max(
                colWidths[i] || 0,
                String(cell || "").length
              );
            });
          });

          // Generate separator
          const separator =
            "+" + colWidths.map((w) => "-".repeat(w + 2)).join("+") + "+";

          // Generate table
          output += indent + separator + "\n";

          allRows.forEach((row, rowIndex) => {
            const rowStr =
              "| " +
              row
                .map((cell, i) => String(cell || "").padEnd(colWidths[i]))
                .join(" | ") +
              " |";

            output += indent + rowStr + "\n";

            // Add separator after header
            if (rowIndex === 0) {
              output += indent + separator + "\n";
            }
          });

          output += indent + separator + "\n";
          break;
        }

        case "list":
          item.items.forEach((listItem, index) => {
            const plainItem = this.#extractText(listItem);
            const marker = item.ordered ? `${index + 1}.` : "*";
            output += `${indent}${marker} ${plainItem}\n`;
          });
          break;

        case "debug":
          if (this.verbosity === "debug") {
            output +=
              indent + `[DEBUG] ${JSON.stringify(item.info, null, 2)}\n`;
          }
          break;

        case "data":
          // For raw data in simple mode, use basic JSON.stringify
          const dataStr = JSON.stringify(item.value, null, 2)
            .split("\n")
            .map((line) => indent + line)
            .join("\n");
          output += dataStr + "\n";
          break;
      }
    }

    return output;
  }

  /**
   * Extract plain text from potentially styled text objects
   * @private
   */
  #extractText(value) {
    if (!value) return "";

    // If it's a styled object with text property
    if (value && typeof value === "object" && value.text !== undefined) {
      return value.text;
    }

    // Otherwise, convert to string
    return String(value);
  }

  /**
   * Render output as structured, consumer-friendly JSON
   * @private
   */
  #renderJSON() {
    // Create a clean data structure
    const result = this.toObject();

    // Return JSON string
    return JSON.stringify(result, null, 2);
  }

  /**
   * Build a clean, logical data structure from buffer items
   */
  toObject() {
    // Initialize result object
    const result = {
      title: null,
      sections: [],
    };

    let currentSection = null;

    // Process items in order
    for (const item of this.items) {
      // Skip based on verbosity
      if (item.type === "debug" && this.verbosity !== "debug") continue;
      if (item.importance === "low" && this.verbosity === "quiet") continue;

      switch (item.type) {
        case "heading":
          if (item.level === 1) {
            // Main title
            result.title = this.#extractText(item.text);
          } else {
            // Section heading
            currentSection = {
              title: this.#extractText(item.text),
              properties: [],
              content: [],
            };
            result.sections.push(currentSection);
          }
          break;

        case "section":
          // Add a new section
          currentSection = {
            title: this.#extractText(item.title),
            properties: [],
            content: [],
          };
          result.sections.push(currentSection);
          break;

        case "property":
          // Add property to current section or root if no section
          const prop = {
            key: this.#extractText(item.key),
            value: this.#extractText(item.value),
          };

          if (currentSection) {
            currentSection.properties.push(prop);
          } else {
            if (!result.properties) result.properties = [];
            result.properties.push(prop);
          }
          break;

        case "text":
          // Add text content
          const text = this.#extractText(item.text);
          if (currentSection) {
            currentSection.content.push({ type: "text", text });
          } else {
            if (!result.content) result.content = [];
            result.content.push({ type: "text", text });
          }
          break;

        case "table":
          // Process table for clean data
          const tableData = {
            type: "table",
            headers: item.headers.map((h) => this.#extractText(h)),
            rows: item.rows.map((row) =>
              row.map((cell) => this.#extractText(cell))
            ),
          };

          if (currentSection) {
            currentSection.content.push(tableData);
          } else {
            if (!result.content) result.content = [];
            result.content.push(tableData);
          }
          break;

        case "list":
          // Process list
          const listData = {
            type: "list",
            ordered: item.ordered,
            items: item.items.map((i) => this.#extractText(i)),
          };

          if (currentSection) {
            currentSection.content.push(listData);
          } else {
            if (!result.content) result.content = [];
            result.content.push(listData);
          }
          break;

        case "data":
          // Raw data passes through directly
          if (currentSection) {
            currentSection.content.push({
              type: "data",
              value: item.value,
            });
          } else {
            if (!result.content) result.content = [];
            result.content.push({
              type: "data",
              value: item.value,
            });
          }
          break;
      }
    }

    // Clean up empty arrays and sections
    result.sections = result.sections.filter(
      (section) => section.properties.length > 0 || section.content.length > 0
    );

    if (result.properties && result.properties.length === 0) {
      delete result.properties;
    }

    if (result.content && result.content.length === 0) {
      delete result.content;
    }

    return result;
  }

  /**
   * Output directly to console and empties the buffer
   */
  print() {
    // console.log(this.render());
    process.stdout.write(this.render());
    this.clear();
    return this;
  }

  /**
   * Clear the buffer
   */
  clear() {
    this.items = [];
    this.indentLevel = 0;
    return this;
  }

  /**
   * Get the raw items array
   * @returns {Array} The buffer items
   */
  getItems() {
    return [...this.items];
  }
}

/**
 * Create a new OutputBuffer with auto-detected dependencies
 * @param {Object} options - Configuration options
 * @returns {OutputBuffer} New buffer instance
 */
export async function createOutputBuffer(options = {}) {
  try {
    // Try to dynamically import chalk and table
    const chalkModule = await import("chalk").catch(() => null);
    const tableModule = await import("table").catch(() => null);

    return new OutputBuffer(options, {
      chalk: chalkModule?.default,
      table: tableModule?.table,
    });
  } catch (error) {
    // Fall back to no dependencies
    return new OutputBuffer(options);
  }
}

/**
 * Create a CLI OutputBuffer with provided dependencies
 * @param {Object} options - Configuration options
 * @param {Object} chalk - Chalk instance
 * @param {Function} table - Table formatter function
 * @returns {OutputBuffer} New buffer instance configured for CLI output
 */
export function createCliOutputBuffer(options = {}, chalk, table) {
  return new OutputBuffer(
    {
      mode: "cli",
      ...options,
    },
    {
      chalk,
      table,
    }
  );
}

/**
 * Create a simple OutputBuffer with no dependencies
 * @param {Object} options - Configuration options
 * @returns {OutputBuffer} New buffer instance configured for simple output
 */
export function createSimpleOutputBuffer(options = {}) {
  return new OutputBuffer({
    mode: "simple",
    ...options,
  });
}

/**
 * Create a JSON OutputBuffer
 * @param {Object} options - Configuration options
 * @returns {OutputBuffer} New buffer instance configured for JSON output
 */
export function createJsonOutputBuffer(options = {}) {
  return new OutputBuffer({
    mode: "json",
    ...options,
  });
}

// /**
//  * Example usage function showing key features
//  */
// export function example() {
//   const buffer = new OutputBuffer();
//   const chalk = buffer.getStyler();

//   buffer
//     .h1("OutputBuffer Example")
//     .text("This demonstrates the key features of the OutputBuffer.")
//     .br()
//     .section("Styling")
//     .prop("Red Text", chalk.red("This text is red"))
//     .prop("Bold Text", chalk.bold("This text is bold"))
//     .prop("Combined", chalk.style("Error message", ["red", "bold"]))
//     .br()
//     .section("Nested Content")
//     .with("User Profile", (buf) => {
//       buf
//         .prop("Name", "John Doe")
//         .prop("Email", "john@example.com")
//         .with("Address", (b) => {
//           b.prop("Street", "123 Main St")
//             .prop("City", "Anytown")
//             .prop("Zip", "12345");
//         });
//     })
//     .br()
//     .section("Tables")
//     .table(
//       ["Name", "Age", "Role"],
//       [
//         ["Alice", "28", "Developer"],
//         ["Bob", "34", "Designer"],
//         ["Charlie", "45", "Manager"],
//       ]
//     );

//   return buffer;
// }

/**
 * Create a minimal chalk-like implementation
 * Returns an object that mimics chalk's API but doesn't modify text
 * @returns {Object} A chalk-like object
 */
function createMinimalChalk() {
  // Base function that just returns the input text
  const noop = (text) => (text ? String(text) : "");

  // Add basic color/style properties that return the noop function
  const styleNames = [
    // Text colors
    "black",
    "red",
    "green",
    "yellow",
    "blue",
    "magenta",
    "cyan",
    "white",
    "gray",
    // Background colors
    "bgBlack",
    "bgRed",
    "bgGreen",
    "bgYellow",
    "bgBlue",
    "bgMagenta",
    "bgCyan",
    "bgWhite",
    // Modifiers
    "bold",
    "dim",
    "italic",
    "underline",
    "inverse",
    "strikethrough",
  ];

  // The proxy target object (base chalk-like object)
  const target = noop;

  // Add all style functions to the target
  styleNames.forEach((style) => {
    target[style] = noop;
  });

  // Create a handler that returns the target for any property access
  // This allows for arbitrary chaining like chalk.red.bold.underline
  const handler = {
    get(target, prop) {
      // If the property exists on the target, return it
      if (prop in target) {
        return target[prop];
      }

      // For any other property, return the target to allow chaining
      return target;
    },
  };

  // Create and return a proxy that implements the handler
  return new Proxy(target, handler);
}

/**
 * Create a minimal table formatter
 * @returns {Function} A simple table formatting function
 */
function createMinimalTable() {
  return (data, config = {}) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return "";
    }

    // Calculate column widths based on content
    const calculateColumnWidths = (rows) => {
      const widths = [];

      rows.forEach((row) => {
        row.forEach((cell, columnIndex) => {
          const cellText = String(cell || "");
          widths[columnIndex] = Math.max(
            widths[columnIndex] || 0,
            cellText.length
          );
        });
      });

      return widths;
    };

    // Format a single row with padding
    const formatRow = (row, widths) => {
      return (
        "| " +
        row
          .map((cell, i) => {
            const cellText = String(cell || "");
            return cellText.padEnd(widths[i]);
          })
          .join(" | ") +
        " |"
      );
    };

    // Generate horizontal separator
    const makeSeparator = (widths) => {
      return "+" + widths.map((w) => "-".repeat(w + 2)).join("+") + "+";
    };

    // Get column widths
    const columnWidths = calculateColumnWidths(data);

    // Generate the table
    const separator = makeSeparator(columnWidths);
    let result = separator + "\n";

    data.forEach((row, rowIndex) => {
      result += formatRow(row, columnWidths) + "\n";

      // Add separator after header row
      if (rowIndex === 0) {
        result += separator + "\n";
      }
    });

    result += separator;
    return result;
  };
}
