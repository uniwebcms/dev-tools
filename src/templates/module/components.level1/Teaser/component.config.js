/**
 * Component Configuration
 *
 * Define how content creators will interact with your component.
 *
 * Guidelines:
 * - Use semantic parameters that describe content presentation, not styling details
 * - For selection parameters, provide the 'options' array (type: 'select' will be implied)
 * - Preview images are automatically detected at 'previews/[preset-name].{jpg,png,webp}'
 * - Use 'private: true' to make a component internal (not selectable by content creators)
 */

export default {
  description: "Highlights important items with various presentation options",
  category: "teaser",
  preset: "standard",
};

export const parameters = [
  {
    name: "layout",
    label: "Layout",
    options: ["grid", "list", "carousel"],
    default: "grid",
    description: "How items are arranged and presented",
  },
  {
    name: "columns",
    label: "Columns",
    type: "number",
    min: 1,
    max: 4,
    default: 3,
    description: "Number of items per row (for grid layout)",
  },
  {
    name: "emphasis",
    label: "Emphasis",
    options: ["balanced", "visual", "textual"],
    default: "balanced",
    description: "Balance between images and text",
  },
];

export const presets = [
  {
    name: "standard",
    label: "Standard Grid",
    description: "Default grid layout with balanced content",
    preview: "previews/standard.jpg",
    settings: {
      layout: "grid",
      columns: 3,
      emphasis: "balanced",
    },
  },
  {
    name: "featured",
    label: "Featured Item",
    description: "Highlights a single item with detailed information",
    preview: "previews/featured.jpg",
    settings: {
      layout: "list",
      columns: 1,
      emphasis: "textual",
    },
  },
];
