# Uniweb for Developers: Building Foundations

> **This is part 3 of 3 in the Uniweb documentation set.**  
> • [Part 1: Uniweb: A New Approach to Web Creation](#)  
> • [Part 2: Uniweb for Content Creators: A Practical Guide](#)  
> • Part 3: Uniweb for Developers: Building Foundations (this document)

## Introduction

As a component developer in Uniweb, you're creating Foundations that content creators will use to build websites without writing code. This guide explains Uniweb's component architecture and provides practical guidance for building effective, reusable Foundations.

> **Note:** For a conceptual overview of Uniweb's approach to content-code separation, see [Uniweb: A New Approach to Web Creation](#).

### Two Types of Components in Uniweb

Uniweb supports two distinct types of components:

1. **User-facing components**:

   - Components that content creators can select in markdown files
   - Follow the special `{ content, params, block }` interface
   - Require metadata in `component.config.js` files
   - Act as the bridge between content and code
   - Can be composed through section hierarchy (parent-child relationships)

2. **Internal components**:
   - Regular React components used within your implementations
   - Follow standard React patterns and can use any props structure
   - Don't require metadata files or special interfaces
   - Not directly available to content creators
   - Handle most of the actual rendering and UI logic

This distinction is crucial: Uniweb fully supports standard React development patterns. In fact, most of your actual UI rendering should happen in internal components, with user-facing components primarily handling the content/code bridge.

### How User-facing Components Differ from Standard React

User-facing components have some specific characteristics:

1. **Standardized Props Interface**

   - Receive `{ content, params, block }` instead of arbitrary props
   - Content is pre-parsed from markdown into a structured object
   - Parameters come from front matter configuration
   - The block object provides runtime context and methods

2. **Metadata-Driven Configuration**

   - Include metadata (in `component.config.js`) that defines their parameters
   - This metadata powers documentation and visual editors at built time
   - Parameters have semantic meaning rather than implementation details

3. **Content/Code Separation**
   - Components don't embed content; they receive it at runtime
   - The same component can render completely different content
   - Content and component updates are independent

This separation creates a powerful system where content creators and developers can work independently.

> **Note**: During component development, you may hardcode content in a component as a way to test its rendering logic and adjust the code more easily.

## Setting Up Your Development Environment

### Foundation Structure

A Uniweb Foundation follows this structure:

```
src/
└── my-foundation/              # Your Foundation (workspace)
    ├── components/             # Individual components
    │   ├── Hero/
    │   │   ├── index.js            # Component implementation
    │   │   ├── component.config.js # Component metadata (params, presets, etc)
    │   │   └── previews/           # Preset preview images (optional metadata)
    │   └── Features/
    │       ├── index.js
    │       └── component.config.js
    ├── index.js             # Foundation entry point
    ├── package.json         # Foundation-specific dependencies
    └── module.yml           # Foundation metadata
```

### Getting Started

1. **Install the Uniweb CLI globally**:

   ```bash
   npm install -g @uniwebcms/toolkit
   ```

2. **Create a new Foundation**:

   ```bash
   # Create a new Foundation in an existing project
   cd my-uniweb-project
   uniweb add module --name marketing-components
   ```

3. **Add a component**:
   ```bash
   cd src/marketing-components
   uniweb add component --name HeroSection
   ```

This creates the basic component structure, including the implementation file and metadata.

### Module Configuration

Your Foundation is defined in the `package.json` of the module (npm workspace):

```jsonc
{
  "name": "marketing", // An npm-compatible name
  "version": "1.0.0", // A required version number
  "interfaces": ["marketing-v1.1"], // Implemented Foundation interfaces
  "description": "Purpose of the Foundation"
  // ...
}
```

Each component has its own `component.config.js` file:

```js
// components/HeroSection/component.config.js
export default {
  label: "Hero Section", // Optional display name
  description: "A full-width hero section with optional background image",
  category: "Layout",
  preset: "standard",
}

export const parameters {
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
  }
};

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
```

## Building Components

### Component Interface

Every Uniweb component follows this interface:

```jsx
function HeroSection({ content, params, block }) {
  // Extract content from the structured content object
  const { title, paragraphs, images } = content.main;

  // Extract parameters with defaults
  const { layout = "standard", theme = "light" } = params;

  // Render the content according to the parameters
  return (
    <div className={`hero-section layout-${layout} theme-${theme}`}>
      <h2>{title}</h2>
      {paragraphs.map((paragraph, index) => (
        <p key={index} dangerouslySetInnerHTML={{ __html: paragraph }} />
      ))}
      {images.length > 0 && (
        <img
          src={images[0].src}
          alt={images[0].alt || ""}
          className="hero-image"
        />
      )}
    </div>
  );
}

// Initialize block defaults for persistent state
HeroSection.blockDefaults = {
  state: {
    supportsOverlay: true,
  },
};

export default HeroSection;
```

> **Important**: `ComponentName.blockDefaults` is runtime initialization for persistent block instances. It is different from `component.config.js`, which is build-time metadata used to create schemas for content creators.

### Understanding the Content Object

The `content` object contains structured data parsed from markdown:

```javascript
{
  // Main content (from H1 and following paragraphs)
  main: {
    title: "Welcome to Our Platform",
    paragraphs: ["Discover how our innovative solutions..."],
    images: [{
      src: "/images/hero.jpg",
      alt: "Hero Image",
      attributes: { background: true }
    }],
    links: [{
      text: "Get Started",
      url: "#getting-started",
      attributes: { "button-primary": true }
    }],
    list: [] // Any lists in the main content
  },

  // Content groups from H2 headings
  items: [
    {
      title: "Feature One",
      paragraphs: ["Feature one description..."],
      images: [],
      links: [],
      list: []
    },
    {
      title: "Feature Two",
      paragraphs: ["Feature two description..."],
      images: [],
      links: [],
      list: []
    }
  ]
}
```

Uniweb automatically structures the markdown content into this standardized object. This consistent structure makes it easy to access content in your components without having to parse markdown yourself.

### Working with Parameters

Parameters come from the front matter in markdown files:

```markdown
---
component: HeroSection
layout: centered
theme: dark
showButton: true
---
```

In your component, access parameters with defaults:

```javascript
function HeroSection({ content, params }) {
  // Extract parameters with defaults
  const { layout = "grid", columns = 3 } = params;
  const cta = content.main.links[0];

  // Use parameters in rendering
  return (
    <div className={`hero-section layout-${layout} cols-${columns}`}>
      {/* Component content */}
      {cta && (
        <a href={cta.url} className="button">
          {cta.text}
        </a>
      )}
    </div>
  );
}
```

### Parameter Metadata

Define parameters in `component.config.js`:

```js
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
```

This metadata:

- Provides documentation for content creators
- Powers visual configuration interfaces
- Sets validation rules for parameters

## Working with Child Blocks and Component Composition

User-facing components can be composed through section hierarchy relationships, allowing content creators to build complex layouts without writing code.

### Understanding Section Hierarchy

In Uniweb, content creators can create parent-child relationships between sections using the `sections` property in `page.yml`:

```yaml
# pages/about/page.yml
title: About Us
description: Learn about our team

# Section structure with hierarchy
sections:
  - tabs            # Parent section
    - tab1          # Child of tabs
    - tab2          # Child of tabs
  - accordion       # Another parent section
    - item1         # Child of accordion
    - item2         # Child of accordion
```

### Accessing Child Blocks

On the component side, you can access these relationships through the block object:

```jsx
function TabContainer({ content, params, block }) {
  // State for active tab
  const [activeTab, setActiveTab] = useState(0);

  // Get the renderer for child blocks
  const ChildBlocks = block.getChildBlockRenderer();

  // If no child blocks, render normally
  if (!block.childBlocks || block.childBlocks.length === 0) {
    return (
      <div className="tab-container empty">
        <h2>{content.main.title}</h2>
        {content.main.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    );
  }

  return (
    <div className="tab-container">
      {/* Tab navigation */}
      <div className="tab-navigation">
        {block.childBlocks.map((childBlock, index) => (
          <button
            key={index}
            className={activeTab === index ? "active" : ""}
            onClick={() => setActiveTab(index)}
          >
            {childBlock.content.main.title}
          </button>
        ))}
      </div>

      {/* Only render the active tab */}
      <div className="tab-content">
        <ChildBlocks
          block={block}
          childBlocks={[block.childBlocks[activeTab]]}
        />
      </div>
    </div>
  );
}
```

This allows content creators to compose complex interfaces by:

1. Creating parent sections with components like `TabContainer`
2. Adding child sections that use any components they choose
3. Configuring each section independently# Uniweb for Developers: Building Effective Foundations

### Flexible Composition Patterns

You can implement various composition patterns:

1. **Tab interfaces** - Show one child at a time
2. **Accordions** - Expand/collapse children
3. **Multi-column layouts** - Arrange children in columns
4. **Carousels** - Cycle through children
5. **Master-detail views** - Select a child from a list

For example, a two-column layout component:

```jsx
function TwoColumnLayout({ content, params, block }) {
  // Get child block renderer
  const ChildBlocks = block.getChildBlockRenderer();

  // Extract parameters
  const { leftWidth = "50%", rightWidth = "50%", spacing = "2rem" } = params;

  // Handle case with fewer than 2 children
  if (!block.childBlocks || block.childBlocks.length < 2) {
    return (
      <div className="two-column-error">
        <p>This component requires exactly two child sections.</p>
      </div>
    );
  }

  // Get the first two children
  const leftBlock = block.childBlocks[0];
  const rightBlock = block.childBlocks[1];

  return (
    <div className="two-column-layout" style={{ gap: spacing }}>
      <div className="left-column" style={{ width: leftWidth }}>
        <ChildBlocks block={block} childBlocks={[leftBlock]} />
      </div>

      <div className="right-column" style={{ width: rightWidth }}>
        <ChildBlocks block={block} childBlocks={[rightBlock]} />
      </div>
    </div>
  );
}
```

With this approach, content creators can create sophisticated layouts by combining components without writing code.

### Cross-Component Communication

Components can communicate with each other using block state:

```jsx
function NavBar({ content, params, block }) {
  // Check if the next block supports an overlay
  const nextBlockIndex = block.getIndex() + 1;
  const nextBlock = block.page.getBlockInfo(nextBlockIndex);
  const supportsOverlay = nextBlock?.state?.supportsOverlay || false;

  return (
    <nav className={supportsOverlay ? "transparent" : "solid"}>
      <h2>{content.main.title}</h2>
      {/* Navigation content */}
    </nav>
  );
}

// Initialize with persistent state
NavBar.init = {
  initialState: {
    isSticky: true,
  },
};
```

This allows a navbar component to adapt its appearance based on the next section.

### Managing Block State

For more complex state management:

```jsx
function InteractiveComponent({ content, params, block }) {
  // Connect block.state to React state
  const [state, setState] = block.useBlockState(useState);

  // Update both React state and block state
  const handleClick = () => {
    setState({
      ...state,
      clickCount: (state.clickCount || 0) + 1,
    });
  };

  return (
    <div>
      <h2>{content.main.title}</h2>
      <p>Clicked {state.clickCount || 0} times</p>
      <button onClick={handleClick}>Click me</button>
    </div>
  );
}

// Initial state for blocks using this component
InteractiveComponent.blockDefaults = {
  state: {
    clickCount: 0,
  },
};
```

Block state persists across renders and even page navigations, making it more powerful than standard React state for some use cases (e.g., remembering user selections is previous pages).

## Component Evolution Strategies

One of Uniweb's strengths is the ability to evolve components over time without breaking existing content.

### The Evolution Path

Components typically evolve from specific to general:

1. **Start with specific components** focused on one use case
2. **Add parameters** to make them configurable
3. **Generalize gradually** to handle more use cases

### Example: From TeamMember to ProfileCard

#### Stage 1: Specific Component

```jsx
function TeamMember({ content }) {
  const { title, subtitle, paragraphs } = content.main;
  const bio = paragraphs[0] || "";

  return (
    <div className="team-member">
      <h3>{title}</h3>
      <p className="role">{subtitle}</p>
      <p className="bio">{bio}</p>
    </div>
  );
}
```

#### Stage 2: Add Configuration Options

```jsx
function TeamMember({ content, params }) {
  const { title, subtitle, paragraphs } = content.main;
  const bio = paragraphs[0] || "";

  // Add parameters with defaults
  const { layout = "card", showBio = true, showSocial = false } = params;

  return (
    <div className={`team-member layout-${layout}`}>
      <h3>{title}</h3>
      <p className="role">{subtitle}</p>
      {showBio && <p className="bio">{bio}</p>}
      {showSocial && (
        <div className="social-links">{/* Social links implementation */}</div>
      )}
    </div>
  );
}
```

#### Stage 3: Generalize With Backward Compatibility

```jsx
function ProfileCard({ content, params }) {
  const { title, subtitle, paragraphs } = content.main;
  const bio = paragraphs[0] || "";

  // Add new parameters with defaults matching old behavior
  const {
    layout = "card",
    showBio = true,
    showSocial = false,
    profileType = "team", // New parameter
    avatarStyle = "square", // New parameter
  } = params;

  return (
    <div className={`profile-card type-${profileType} layout-${layout}`}>
      <div className={`avatar ${avatarStyle}`}>
        {/* Avatar implementation */}
      </div>
      <h3>{title}</h3>
      <p className="subtitle">{subtitle}</p>
      {showBio && <p className="bio">{bio}</p>}
      {showSocial && (
        <div className="social-links">{/* Social links implementation */}</div>
      )}
    </div>
  );
}
```

### Key Evolution Principles

1. **Always provide defaults** that match previous behavior
2. **Add parameters, don't remove them**
3. **Use feature detection** to handle different content structures
4. **Preserve backward compatibility**
5. **Test with existing content**

This approach allows components to evolve without requiring content updates.

## Working with Dynamic Data

Components can access dynamic data through the `input` prop, which comes from data sources defined in content files.

### Basic Dynamic Data Example

```jsx
function ProductList({ content, params, block, input }) {
  // Handle loading and error states
  if (!input || input.isLoading) {
    return <div className="loading">Loading products...</div>;
  }

  if (input.error) {
    return <div className="error">Error: {input.error.message}</div>;
  }

  // Use the data
  const products = input.data || [];

  return (
    <div className="product-list">
      <h2>{content.main.title}</h2>

      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <h3>{product.name}</h3>
              <p className="price">${product.price.toFixed(2)}</p>
              <p>{product.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Data Transformation

You can define transformers in your module configuration that process raw data:

```jsx
// In your module's index.js
export const config = {
  transformers: {
    productData: (rawData) => {
      return rawData.map((item) => ({
        id: item.id,
        name: item.title || "Unnamed Product",
        price: Number(item.price) || 0,
        description: item.description || "",
        isOnSale: Boolean(item.discount),
      }));
    },
  },
};
```

Content creators can then reference this transformer:

```markdown
---
component: ProductList
input:
  source: "./data/products.json"
  transform: "productData"
---

# Our Products

Explore our catalog of premium products.
```

### Creating Filterable Components

You can allow content creators to filter data:

```jsx
function FilterableProductList({ content, params, block, input }) {
  // Get products with loading handling
  const products = input?.data || [];
  const isLoading = !input || input.isLoading;

  // Extract filtering parameters
  const {
    category = null,
    minPrice = 0,
    maxPrice = Infinity,
    sortBy = "name",
  } = params;

  // Apply filters
  const filteredProducts = products
    .filter((product) => {
      // Apply category filter if specified
      if (category && product.category !== category) return false;

      // Apply price range filter
      if (product.price < minPrice || product.price > maxPrice) return false;

      return true;
    })
    .sort((a, b) => {
      // Apply sorting
      if (sortBy === "price") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      return a.name.localeCompare(b.name); // Default: sort by name
    });

  // Render component
  return (
    <div className="filterable-products">
      <h2>{content.main.title}</h2>

      {isLoading ? (
        <div className="loading">Loading products...</div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product) => (
            <div key={product.id} className="product-card">
              {/* Product card implementation */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

Content creators can then configure filters in front matter:

```markdown
---
component: FilterableProductList
category: electronics
minPrice: 50
maxPrice: 200
sortBy: price
input: "./data/products.json"
---

# Electronics Under $200

Browse our affordable electronics collection.
```

## Development Workflow

### Using the CLI During Development

The Uniweb CLI provides helpful commands for component developers:

Install the CLI globally if you haven't done it yet (e.g., you started your project form a GitHub template)

```bash
npm install -g @uniwebcms/toolkit
```

```bash
# Go to you project folder
cd my-project

# Initialize a new component
uniweb add component --name InfoCard --module marketing-components

# You can also go work from specific module folder (or subfolder of it)
cd src/marketing-components
uniweb add component --name InfoCard

# List all user-facing components in a module
uniweb list components --module marketing-components

# List all components in the module connected to a site in the project
uniweb list components --site marketing

# Get info about a component from a site (or subfolder in it)
cd sites/my-site
uniweb get component --name HeroSection
```

### Testing Components

Test your components with mock data to ensure they work correctly:

```jsx
import { render, screen } from "@testing-Foundation/react";
import HeroSection from "./index";

describe("HeroSection", () => {
  const mockContent = {
    main: {
      title: "Test Title",
      paragraphs: ["Test paragraph"],
      images: [],
      links: [],
    },
    items: [],
  };

  const mockParams = {
    layout: "centered",
    theme: "dark",
  };

  const mockBlock = {
    childBlocks: [],
  };

  it("renders correctly with basic content", () => {
    render(
      <HeroSection
        content={mockContent}
        params={mockParams}
        block={mockBlock}
      />
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test paragraph")).toBeInTheDocument();
  });

  it("applies parameters correctly", () => {
    const { container } = render(
      <HeroSection
        content={mockContent}
        params={mockParams}
        block={mockBlock}
      />
    );

    const heroElement = container.querySelector(".hero-section");
    expect(heroElement).toHaveClass("layout-centered");
    expect(heroElement).toHaveClass("theme-dark");
  });
});
```

### Debugging Components

Add debugging helpers to inspect what's happening in your components:

```jsx
function DebugComponent({ content, params, block, input }) {
  // Render as expandable JSON for easy inspection
  return (
    <div className="debug-component">
      <h2>Component Debug View</h2>

      <details open>
        <summary>Content</summary>
        <pre>{JSON.stringify(content, null, 2)}</pre>
      </details>

      <details>
        <summary>Parameters</summary>
        <pre>{JSON.stringify(params, null, 2)}</pre>
      </details>

      <details>
        <summary>Block Info</summary>
        <pre>
          Child Blocks: {block.childBlocks?.length || 0}
          Block Index: {block.getIndex()}
        </pre>
      </details>

      {input && (
        <details>
          <summary>Input Data</summary>
          <pre>{JSON.stringify(input.data, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}
```

This component is invaluable during development to visualize the exact data being passed to your components.

### Component Development Best Practices

1. **Start with the content structure**

   - Understand how content creators will structure their content
   - Design your component to handle common content patterns

2. **Use semantic parameters**

   - Create parameters based on meaning, not implementation
   - Example: Use `theme: "dark"` instead of `backgroundColor: "#333"`
   - This allows implementation to change without breaking content

3. **Provide sensible defaults**

   - Every parameter should have a reasonable default
   - Components should work without any explicit configuration

4. **Handle edge cases gracefully**

   - Missing content
   - Empty arrays
   - Invalid parameter values
   - No child blocks when expected

5. **Document thoroughly**

   - Write clear parameter descriptions
   - Provide usage examples
   - Document expected content structure

6. **Consider performance**

   - Use React's performance optimization tools (memo, useMemo, etc.)
   - Optimize rendering for components that might have many instances

7. **Make components composable**
   - Design components that work well together
   - Consider how components will interact through block state

By following these practices, you'll create components that content creators love to use.

## Advanced Component Patterns

### Using Internal Components

One of the most powerful patterns in Uniweb is using standard React components to handle the actual rendering:

```jsx
// User-facing component that content creators can select
function TeamSection({ content, params, block }) {
  // Extract parameters
  const {
    columns = 3,
    layout = "grid",
    cardStyle = "standard", // Controls which internal component to use
  } = params;

  // Select the appropriate internal component based on parameters
  const CardComponent =
    cardStyle === "minimal" ? MinimalTeamCard : StandardTeamCard;

  return (
    <div className={`team-section layout-${layout}`}>
      <h2>{content.main.title}</h2>
      <p className="introduction">{content.main.paragraphs[0]}</p>

      <div className={`team-grid cols-${columns}`}>
        {content.items.map((item, index) => (
          <CardComponent
            key={index}
            name={item.title}
            role={item.subtitle}
            bio={item.paragraphs[0]}
            image={item.images[0]}
          />
        ))}
      </div>
    </div>
  );
}

// Standard React component - not directly exposed to content creators
function StandardTeamCard({ name, role, bio, image }) {
  return (
    <div className="team-member-card standard">
      {image && (
        <div className="member-image">
          <img src={image.src} alt={image.alt || name} />
        </div>
      )}
      <h3>{name}</h3>
      <p className="role">{role}</p>
      <p className="bio">{bio}</p>
    </div>
  );
}

// Alternate internal component with different design
function MinimalTeamCard({ name, role, bio, image }) {
  return (
    <div className="team-member-card minimal">
      <div className="card-content">
        <h3>{name}</h3>
        <p className="role">{role}</p>
      </div>
    </div>
  );
}
```

In this pattern:

- `TeamSection` is a user-facing component that content creators select
- `StandardTeamCard` and `MinimalTeamCard` are regular React components
- The user-facing component handles the Uniweb interface and content transformation
- The internal components focus on rendering and can use any standard React patterns

This separation allows you to:

- Use the full power of React's component model
- Create specialized internal components for different rendering needs
- Switch between internal implementations based on parameters
- Reuse internal components across multiple user-facing components

### Creating Component Presets

Presets provide pre-configured component options:

```jsx
// Define presets in component.config.js
export const presets = [
  {
    name: "standard",
    label: "Standard Grid",
    description: "Default grid layout with 3 columns",
    settings: {
      layout: "grid",
      columns: 3,
      showBio: true,
    },
  },
  {
    name: "compact",
    label: "Compact List",
    description: "Compact list view without bios",
    settings: {
      layout: "list",
      showBio: false,
    },
  },
  {
    name: "featured",
    label: "Featured Team",
    description: "Highlight key team members",
    settings: {
      layout: "grid",
      columns: 1,
      showBio: true,
      showSocial: true,
      size: "large",
    },
  },
];
```

Content creators can then use presets in their front matter:

```markdown
---
component: TeamSection
preset: compact
---
```

### Interactive Components

Create components that respond to user interactions:

```jsx
function AccordionComponent({ content, params, block }) {
  const [openItem, setOpenItem] = useState(null);

  // Extract parameters with defaults
  const { allowMultiple = false, initialOpen = null } = params;

  // Set initial open item
  useEffect(() => {
    setOpenItem(initialOpen);
  }, [initialOpen]);

  // Toggle item open/closed
  const toggleItem = (index) => {
    if (allowMultiple) {
      // For multiple open items, toggle the clicked item
      setOpenItem((prevOpen) => {
        if (Array.isArray(prevOpen)) {
          return prevOpen.includes(index)
            ? prevOpen.filter((i) => i !== index)
            : [...prevOpen, index];
        } else {
          return [index];
        }
      });
    } else {
      // For single open item, toggle or close
      setOpenItem((prevOpen) => (prevOpen === index ? null : index));
    }
  };

  // Check if an item is open
  const isItemOpen = (index) => {
    if (allowMultiple && Array.isArray(openItem)) {
      return openItem.includes(index);
    }
    return openItem === index;
  };

  return (
    <div className="accordion">
      <h2>{content.main.title}</h2>

      {content.items.map((item, index) => (
        <div
          key={index}
          className={`accordion-item ${isItemOpen(index) ? "open" : "closed"}`}
        >
          <div className="accordion-header" onClick={() => toggleItem(index)}>
            <h3>{item.title}</h3>
            <span className="icon">{isItemOpen(index) ? "−" : "+"}</span>
          </div>

          {isItemOpen(index) && (
            <div className="accordion-content">
              {item.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Conclusion

Building components for Uniweb gives you the power to create reusable building blocks that content creators can use without writing code. By following the patterns and practices in this guide, you'll create components that are:

- **Flexible** - Adaptable to different content structures
- **Configurable** - Customizable through parameters
- **Evolvable** - Able to grow without breaking existing content
- **Composable** - Work well together to create sophisticated websites

The separation between content and code gives both developers and content creators the freedom to work independently while creating cohesive websites.

Remember that great Uniweb components focus on:

1. Creating a clear interface between content and presentation
2. Providing semantic parameters that make sense to content creators
3. Handling a variety of content structures gracefully
4. Evolving carefully to maintain backward compatibility

By following these principles, you'll build Foundations that content creators will love to use.
