import cliContext from "../context.js";
import { createDisplayName } from "./file.js";

const { buffer, chalk } = cliContext;

function getLabel(prop, name) {
  return prop.label ? localStr(prop.label) : createDisplayName(name);
}

/**
 * Format multilingual string
 * @param {Object|String} text - Text that can be multilingual {en: "text", fr: "texte"} or simple string
 * @param {String} locale - Preferred locale (default: 'en')
 * @returns {String} Formatted text
 */
function localStr(text, locale = "en") {
  if (!text) return "";

  if (typeof text === "string") return text;

  if (typeof text === "object") {
    // Return preferred locale or fallback to another available locale
    return text[locale] || text.en || text[Object.keys(text)[0]] || "";
  }

  return String(text);
}

/**
 * Returns color for different component categories
 * @param {String} category - Component category
 * @returns {String} Category with appropriate color styling
 */
function getCategoryStyle(category, styler) {
  const categoryColors = {
    hero: "magenta",
    feature: "green",
    pricing: "yellow",
    content: "cyan",
    article: "blue",
    video: "red",
    layout: "magenta",
    header: "green",
    footer: "yellow",
    form: "cyan",
    action: "blue",
    template: "red",
    graph: "gray",
    page: "white",
    "sub-content": "yellow", // Was using hex, now using standard color
  };

  const colorName = categoryColors[category] || "white";
  return styler[colorName](category);
}

/**
 * List all components in a module
 * @param {Module} module - A Module object
 * @param {Object} options - Display options
 * @returns {Array}
 */
export async function listComponents(module, options = {}) {
  const schema = await module.loadSchema();

  // const locale = options.locale || "en";
  const { detailed = false } = options;

  // Filter out internal properties (like _self)
  const componentNames = Object.keys(schema).filter(
    (key) => !key.startsWith("_")
  );

  if (componentNames.length === 0) {
    buffer.warn("No components found in the schema.");
    return [];
  }

  // Create header
  buffer
    // .h1(`Components in Module`)
    .prop("Module", module.isRemote() ? module.url : module.name);
  // .br();

  if (detailed) {
    // Create table headers
    const headers = [
      chalk.bold(`Component ${componentNames.length}`),
      chalk.bold("Category"),
      chalk.bold("Description"),
    ];

    // Create table rows
    const rows = componentNames
      .map((name) => {
        const config = schema[name];
        if (!config || name === "_self") return null;

        const category = config.category || "unknown";
        const description = localStr(config.description);
        const truncatedDescription =
          description.length > 100
            ? `${description.slice(0, 100)}...`
            : description;

        return [
          chalk.bold(name),
          getCategoryStyle(category, chalk),
          chalk.gray(truncatedDescription),
        ];
      })
      .filter(Boolean); // Remove nulls

    // Add the table
    buffer.table(headers, rows, {
      columns: {
        0: { width: 30, wrapWord: true },
        1: { width: 15, wrapWord: true },
        2: { width: 50, wrapWord: true },
      },
    });

    // Show categories summary
    buffer.br().section("Categories");

    // Count categories
    const categories = {};
    componentNames.forEach((name) => {
      const config = schema[name];
      if (!config || name === "_self") return;

      const category = config.category || "unknown";
      categories[category] = (categories[category] || 0) + 1;
    });

    // Display category counts
    Object.entries(categories).forEach(([category, count]) => {
      buffer.prop(
        `${getCategoryStyle(category, chalk)}`,
        `${count} components`
      );
    });
  } else {
    buffer.prop(
      `Components (${componentNames.length})`,
      componentNames.join(", ")
    );
    // // Create table headers
    // const headers = [chalk.bold(`Component (${componentNames.length})`)];

    // // Create table rows
    // const rows = componentNames
    //   .map((name) => {
    //     const component = schema[name];
    //     if (!component || name === "_self") return null;
    //     return [chalk.bold(name)];
    //   })
    //   .filter(Boolean); // Remove nulls

    // // Add the table
    // buffer.table(headers, rows, {
    //   columns: {
    //     0: { width: 30, wrapWord: true },
    //   },
    // });
  }

  return buffer.toObject();
}

/**
 * Get detailed information about a specific component
 */
export function getComponentDetails(config) {
  const presets = [];
  const params = [];

  config.presets.forEach((preset) => {
    presets.push(localStr(preset.label));
  });

  for (const [propName, info] of Object.entries(config.parameters)) {
    const lbl = chalk.blue("(" + localStr(info.label) + ")");
    params.push(`${propName} ${lbl}`);
  }

  // console.log(params, config.parameters, config);

  // Object.entries(config.parameters).forEach(([propName, info]) => {
  //   const lbl = chalk.blue("(" + localStr(info.label) + ")");
  //   params.push(`${propName} ${lbl}`);
  // });

  const elements = [];

  Object.entries(config.elements || {}).forEach(([elementName, info]) => {
    elements.push(elementName);
  });

  buffer
    // .section("Basic Information")
    .prop("Name", localStr(config.label) || config.name)
    // .prop("Category", getCategoryStyle(config.category, chalk))
    .prop("Description", localStr(config.description))
    .prop("Content", elements.join("; "))
    .prop("Parameters", params.join("; "))
    .prop("Presets", presets.join("; "));

  // // Elements
  // if (config.elements) {
  //   buffer.section("Elements");

  //   Object.entries(config.elements).forEach(([elementName, element]) => {
  //     buffer.keyInfo(chalk.cyan(elementName), "");

  //     if (element.type) {
  //       buffer.detail("Type", element.type);
  //     }

  //     if (element.description) {
  //       buffer.prop("Description", localStr(element.description));
  //     }
  //   });

  //   buffer.br();
  // }

  return buffer.toObject();
}

/**
 * List presets for a specific component
 * @param {Object} config - Component config
 */
export function listComponentParams(config) {
  const header = [
    "Parameter",
    "Display Name",
    "Default",
    "Options",
    "Description",
  ];
  for (let i = 0; i < header.length; i++) header[i] = chalk.bold(header[i]);

  const rows = [];

  Object.entries(config.parameters).forEach(([propName, property]) => {
    let { description: desc, type, options, default: defValue } = property;

    const label = getLabel(property, propName);
    // const alias = label === propName ? "" : propName;
    options ??= property.enum || "";
    defValue ??= "";
    desc = localStr(desc);
    if (options) type = "select";

    const truncDesc = desc.length > 50 ? `${desc.slice(0, 50)}...` : desc;

    if (options) {
      options = options
        .map((option) => getLabel(option, option.value))
        .join("; ");
    }

    // const ops = (property.enum || {}).map((option) => option.value).join("; ");

    rows.push([propName, label, defValue, options, truncDesc]);
  });

  buffer.table(header, rows, {
    columns: {
      0: { width: 15, wrapWord: true },
      1: { width: 20, wrapWord: true },
      2: { width: 7, wrapWord: true },
      3: { width: 25, wrapWord: true },
      4: { width: 32, wrapWord: true },
    },
  });
}

/**
 * List presets for a specific config
 * @param {Object} config - Path or URL to schema
 */
export function listComponentPresets(config) {
  const header = ["Index", "Label", "Properties"];
  for (let i = 0; i < header.length; i++) header[i] = chalk.bold(header[i]);

  const rows = [];
  config.presets.forEach((preset, index) => {
    const { label, properties } = preset;
    const props = [];

    Object.entries(properties).forEach(([propName, value]) => {
      props.push(chalk.green(propName) + ": " + chalk.yellow(value));
    });

    rows.push([index, localStr(label), props.join("; ")]);

    // buffer
    //   .br()
    //   .h2(`Preset ${index + 1}`)
    //   .prop("Label", localStr(preset.label, locale));
    // // Show properties
    // if (preset.settings) {
    //   buffer.section("Properties");
    //   Object.entries(preset.settings).forEach(([propName, value]) => {
    //     buffer.prop(chalk.green(propName), chalk.yellow(value));
    //   });
    // }
    // // Show image info
    // if (preset.image) {
    //   buffer.section("Preview").prop("Path", chalk.blue(preset.image.path));
    // }
  });

  buffer.table(header, rows, {
    columns: {
      0: { width: 5, wrapWord: true },
      1: { width: 25, wrapWord: true },
      2: { width: 50, wrapWord: true },
    },
  });

  // try {
  //   const schema = await loadSchema(schemaSource);
  //   const locale = options.locale || "en";
  //   const component = schema[componentName];
  //   if (!component) {
  //     throw new Error(`Component "${componentName}" not found in schema.`);
  //   }
  //   if (!config.presets || config.presets.length === 0) {
  //     buffer.warn(`No presets found for component "${componentName}".`);
  //     return [];
  //   }
  //   buffer.h1(`Presets for ${componentName} (${config.presets.length})`);
  //   // List each preset
  //   config.presets.forEach((preset, index) => {
  //     buffer
  //       .br()
  //       .h2(`Preset ${index + 1}`)
  //       .prop("Label", localStr(preset.label, locale));
  //     // Show properties
  //     if (preset.settings) {
  //       buffer.section("Properties");
  //       Object.entries(preset.settings).forEach(([propName, value]) => {
  //         buffer.prop(chalk.green(propName), chalk.yellow(value));
  //       });
  //     }
  //     // Show image info
  //     if (preset.image) {
  //       buffer.section("Preview").prop("Path", chalk.blue(preset.image.path));
  //     }
  //   });
  // } catch (error) {
  //   buffer.error("Error listing presets: ", error.message);
  // }
  // return buffer.toObject();
}

/**
 * Show detailed information about a specific preset
 * @param {String} name - Path or URL to schema
 * @param {Component} component - Name of the component
 * @returns {Object}
 */
export async function getPresetDetails(config) {
  if (!config.presets || config.presets.length === 0) {
    buffer.warn(`No presets found for component "${config.name}".`);
    return {};
  }

  // Convert to zero-based index
  const index = parseInt(presetIndex) - 1;

  if (isNaN(index) || index < 0 || index >= config.presets.length) {
    throw new Error(
      `Invalid preset index. Available range: 1-${config.presets.length}`
    );
  }

  const preset = config.presets[index];

  buffer
    .h1(`Preset ${index + 1} for ${config.name}`)
    .br()
    .prop("Label", localStr(preset.label, locale));

  // Show properties with comparisons
  if (preset.settings) {
    buffer.br().section("Properties");

    // Table headers
    const headers = [
      chalk.bold("Property"),
      chalk.bold("Preset Value"),
      chalk.bold("Component Default"),
    ];

    // Table rows
    const rows = Object.entries(preset.settings).map(([propName, value]) => {
      const componentProp = config.parameters && config.parameters[propName];
      const defaultValue = componentProp ? componentProp.default : undefined;

      // Format the values
      let defaultDisplay =
        defaultValue !== undefined ? String(defaultValue) : "N/A";
      let valueDisplay = String(value);

      // Highlight differences
      const displayValue =
        defaultValue !== undefined && defaultValue !== value
          ? chalk.yellow(valueDisplay)
          : chalk.gray(valueDisplay);

      return [chalk.green(propName), displayValue, chalk.gray(defaultDisplay)];
    });

    buffer.table(headers, rows, {
      columns: {
        0: { width: 20, wrapWord: true },
        1: { width: 30, wrapWord: true },
        2: { width: 20, wrapWord: true },
      },
    });

    // Show preview image
    if (preset.image) {
      buffer
        .br()
        .section("Preview Image")
        .prop("Path", chalk.blue(preset.image.path))
        .prop("Size", `${preset.image.width}x${preset.image.height}`)
        .prop("Type", preset.image.type);
    }
  }

  return preset;
}
