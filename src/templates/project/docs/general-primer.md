# Uniweb Framework

> **This is part 1 of 3 in the Uniweb documentation set.**  
> • Part 1: Uniweb: A New Approach to Web Creation (this document)  
> • [Part 2: Uniweb for Content Creators: A Practical Guide](#)  
> • [Part 3: Uniweb for Developers: Building Purpose-Built Foundations](#)

## A Modern Approach to Web Development Through Separation of Concerns

The Uniweb Framework transforms how websites are built by creating a clean separation between content and code. This separation enables content teams and developers to work independently, each focusing on their areas of expertise without blocking each other.

## The Core Philosophy

At its foundation, Uniweb is built on a practical idea: **content and code should be separate concerns**. This philosophy manifests in several key principles:

1. **Content is written in markdown** - Accessible, readable, and structured
2. **Components are built in React** - Modern, flexible, and widely adopted
3. **Runtime connection** - Content and components connect dynamically at runtime
4. **Composable architecture** - Build sophisticated websites from modular components

## Two Complementary Paths

The Framework supports two distinct approaches to web development:

### For Content Creators and Site Builders

**Create websites without writing code** by selecting and configuring a purpose-built Foundation.

What you need to know:

- Basic markdown for content creation
- How to configure components via front matter (key-value pairs at the top of markdown files)
- How to select a Foundation for your site
- No JavaScript, React, or programming knowledge required

With this approach, you select a single Foundation that provides all the components your site needs, then focus exclusively on creating and organizing your content.

### For Component Developers

**Create purpose-built Foundations** that can power multiple websites.

What you need to know:

- JavaScript and React development
- Component architecture principles
- Understanding of the Uniweb component interface
- How to package and distribute Foundations

Component developers create cohesive design systems packaged as modules that content creators can use. These purpose-built libraries encapsulate all the presentation logic, ensuring a consistent look and functionality across sites using them.

## Foundations and Modules

A **Foundation** in Uniweb is a complete and purpose-built collection of components designed to work together as a cohesive design system. These come in two forms:

1. **Ready-to-use Foundations**: Pre-built collections created by Uniweb or the community that content creators can immediately use without development expertise.

2. **Custom Foundations**: Built by developers for specific project needs, providing complete control over design and functionality.

A **module** is the technical packaging and delivery mechanism that connects a Foundation to a site at runtime. It's the just-in-time delivery system that makes components available when and where they're needed.

**Important distinctions:**

- Each site links to exactly one Foundation (module) that provides all components needed.
- When developing components, developers can freely use any traditional static libraries or build tools in their projects.

## How It Works: The Big Picture

```
┌─────────────────────┐     ┌─────────────────────┐
│  Content Repository │     │   Code Repository   │
│  ─────────────────  │     │  ─────────────────  │
│                     │     │                     │
│  - Markdown content │     │  - Components       │
│  - Static assets    │ ◄── │  - Styling          │
│  - Configuration    │     │  - Logic            │
│                     │     │                     │
└─────────────────────┘     └─────────────────────┘
```

In a Uniweb project:

1. **Content lives in structured markdown files** organized in a logical hierarchy
2. **The components used in a site all come from a chosen purpose-built Foundation** that defines how content is rendered
3. **Configuration connects the two** through a structured metadata system
4. **At runtime, content and code unite** to create the final website

Unlike traditional frameworks where content and code are compiled together at build time, Uniweb maintains their separation right up to runtime. This is a key distinction:

- **Traditional Approach**: Content + Templates → Static HTML/JS → Web Site
- **Uniweb Approach**: Content → Runtime → Purpose-Built Foundation → Web Site

This runtime connection gives Uniweb unique capabilities:

- Foundations can be updated without rebuilding content
- Content can be updated without touching component code
- Different sites can use the same Foundation
- Foundations can evolve independently of sites

## The Module Ecosystem

```
┌───────────────────────┐
│   Module Registry     │
│   ───────────────     │
│                       │
│  Catalog of available │──────┐
│  Foundations  │      │
│                       │      │
└───────────────────────┘      │
                               ▼
┌───────────────────────┐    ┌───────────────────────┐
│      Foundation       │    │        Website        │
│    ───────────────    │    │    ───────────────    │
│                       │    │                       │
│  - UI Components      │◄───│  - Markdown Content   │
│  - Design System      │    │  - Configuration      │
│  - Functionality      │    │  - Static Assets      │
│                       │    │                       │
└───────────────────────┘    └───────────────────────┘
```

The framework enables easy discovery and use of Foundations:

1. **Module Registries** are catalogs that list available Foundations
2. **Each site** selects exactly one Foundation
3. **Content creators** can choose from ready-to-use libraries
4. **Developers** can create custom libraries for specific needs

This approach gives content creators immediate access to complete design systems while allowing developers to create reusable solutions.

## Core Concepts

### Project Structure

Projects can scale from simple to complex depending on your needs. For content-focused projects, the structure is straightforward:

```
project-root/
├── package.json           # Root package.json
├── uniweb.config.js       # Project-level configuration
├── pages/                 # Content pages
│   ├── index/             # Home page
│   │   ├── hero.md        # Section files
│   │   ├── features.md
│   │   └── page.yml       # Page metadata and section structure
│   └── about/             # About page
│       └── ...
├── locales/               # All translations (optional)
├── data/                  # Dynamic data files (optional)
├── public/                # Public assets (images, etc.)
├── engine/                # Site runtime
└── site.yml               # Site configuration with Foundation link
```

This structure is ideal for content creators who are working with a single site and using an existing Foundation.

For larger projects with multiple sites and/or custom Foundations, Uniweb uses a workspace-based architecture:

```
project-root/
├── package.json           # Root package.json with workspace config
├── uniweb.config.js       # Project-level configuration
├── sites/                 # Site workspaces (each with its chosen Foundation)
│   ├── company/           # Marketing site (pages, locales, data, etc.)
│   └── help-center/       # Documentation site
└── src/                   # Module workspaces (Foundations)
    └── marketing/         # Foundation (for marketing sites)
        └── ...
```

Each site and Foundation can be developed and deployed independently, which is valuable for teams working on multiple projects.

### Sites and Pages

- **Sites** are complete websites with their own content and configuration
- **Pages** are collections of content that map to URL paths
- Each page contains multiple **sections** that represent content blocks
- Each site uses exactly one purpose-built Foundation that provides all its components

### Sections and Blocks

- **Sections** are units of content represented by markdown files
- **Blocks** are the runtime JavaScript objects that represent sections
- The structure of sections within a page is defined in the `sections` property of each `page.yml` file

### Components and Libraries

- **Components** are React components that follow a specific interface to render content
- **Purpose-built Foundations** are complete collections of components packaged together as modules
- Components receive four primary props:
  - `content` - Structured content parsed from markdown
  - `params` - Configuration parameters from front matter
  - `block` - Runtime object representing the section with methods for interacting with other sections
  - `input` - Optional dynamically fetched data

Unlike generic React components, components in Uniweb:

- Have a standardized interface for receiving content
- Include metadata that defines their parameters and documentation
- Maintain a clear separation between content structure and visual presentation

### Dynamic Data

- Uniweb supports **dynamic data** from both local JSON files and external APIs
- Content files specify **what** data to fetch, components determine **how** to render it
- Dynamic data configuration follows the same separation of concerns as static content
- Data can be configured at the site, page, or section level
- Transformers convert external data formats into component-friendly structures

This approach allows static markdown content and dynamic data to work together seamlessly, giving content creators the flexibility to incorporate changing data without compromising the separation of concerns.

### Localization

- Content can be translated into multiple languages
- Translations maintain the same structure as the main content
- The `locales/` folder contains language-specific content

## Enhancing Building with Plugins

Building upon the core architecture, Uniweb provides a plugin system that extends the build process with asset optimization, content transformations, and custom build configurations. These build-time extensions are configured in `uniweb.config.js` and provide ways to adapt the framework's toolchain to specific project needs without affecting runtime behavior.

Plugins maintain the separation of concerns by focusing exclusively on build-time processes, leaving runtime functionality to components. Common plugin types include:

- **Asset optimization plugins** - Image compression, CSS/JS minification
- **Content transformation plugins** - Markdown extensions, content translation via AI, asset metadata management
- **Build customization plugins** - Custom webpack configurations, development tools
- **CLI extension plugins** - Additional commands and capabilities for the Uniweb CLI

## The Uniweb CLI Tool

Uniweb provides a powerful command-line interface (CLI) that simplifies many common tasks:

```bash
# Install the Uniweb CLI tool globally
npm install -g @uniwebcms/toolkit
```

Installing the CLI tool globally offers several advantages:

- Access Uniweb commands from any directory
- Manage content across multiple projects
- Automate common workflows
- Maintain consistency across languages and sites

The CLI automatically detects your Uniweb project context, making it aware of the current site, page, or component you're working with.

## Getting Started

Start using Uniweb with these basic CLI commands:

### Create a minimal project

```bash
uniweb init my-project
```

This creates a barebones project with just the minimum requirements. After creation, you can navigate to it with `cd my-project` and run additional commands to add sites or modules.

### Create a content-focused project

```bash
uniweb init my-project --site /
```

This creates a project with a root-level site, which is the basic setup for a content-focused project with the structure described earlier in this guide.

### Create a development-focused project

```bash
uniweb init my-project --module M1 --interface marketing --site test
```

This creates a project with:

- A purpose-built Foundation under `src/M1` (where developers will create reusable components)
- A starter template of components based on the `marketing` [library interface](https://github.com/uniwebcms/library-interfaces) (defaults to `marketing/latest/core`)
- A test site under `sites/test` initialized with an index page for testing components

### AI-Assisted Development

```bash
uniweb chat
```

Launches an interactive AI assistant that can help you build and manage Uniweb projects. The assistant:

- Integrates with various AI providers (Anthropic, OpenAI, xAI, Gemini, and others)
- Has access to all CLI commands as tools
- Can help create sites, components, and content through natural language conversation
- Securely stores API keys using your operating system's standard security features

On first run, the assistant will ask for your preferred AI provider and API key if not already configured. The provider name will be saved in your project configuration while the key is stored securely.

## Key Benefits

### For Content Teams:

- Update content without developer dependencies
- Configure components through straightforward front matter
- Work in a content-focused environment
- Use components that self update as browsers evolve

### For Developers:

- Create purpose-built Foundations once, use them across multiple sites
- Update Foundations without rebuilding sites
- Work in a code-focused environment
- Full implementation freedom within components

## Practical Applications

Uniweb is well-suited for:

- **Multi-site organizations** that want to share Foundations across sites
- **Collaborative teams** with separate content and development workflows
- **Content-heavy sites** that require a comprehensive Foundation
- **Long-lived projects** that need flexibility to evolve over time

For example, a university with multiple department websites could use Uniweb to maintain consistent branding and functionality across sites while allowing each department to manage their own content independently. Similarly, a documentation platform could leverage Uniweb to separate technical content from presentation logic, enabling subject matter experts to update documentation without developer intervention.

By separating content from code, Uniweb creates a web development workflow that is more efficient, collaborative, and maintainable than traditional approaches.

## Terminology Guide

To avoid misunderstandings, here's how Uniweb defines key terms that might have different meanings in other frameworks:

| Term                   | In Uniweb                                                                                                             | Different From                                                                                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Foundation**         | A comprehensive collection of components designed to work together as a cohesive design system                        | Generic Foundations where individual components are imported separately                                                                                           |
| **Project**            | The entire Uniweb codebase including all sites and modules, managed as workspaces                                     | Single-app projects in traditional frameworks                                                                                                                     |
| **Site**               | An independent website with its own content, configuration, and chosen Foundation                                     | Template-based sites in traditional CMSs                                                                                                                          |
| **Module**             | The technical packaging that delivers a Foundation to a site at runtime                                               | JS modules or plugins in other systems                                                                                                                            |
| **Registry**           | A catalog of available Foundations, each representing a complete design system                                        | Component marketplaces where individual components are mixed and matched                                                                                          |
| **Page**               | A content entity that maps to a URL path, containing multiple sections                                                | Template files in traditional systems                                                                                                                             |
| **Section**            | A content unit represented by a markdown file, rendered by a component                                                | Page regions or blocks in traditional CMSs                                                                                                                        |
| **Block**              | The runtime JavaScript representation of a section                                                                    | UI blocks or widgets in other frameworks                                                                                                                          |
| **Component**          | A React component that renders content according to the Uniweb interface                                              | Standard React components without the Uniweb content/params/block interface                                                                                       |
| **Plugin**             | A build-time extension that can modify content processing, customize build configuration, or extend CLI functionality | Traditional CMS plugins that often provide runtime functionality and may mix concerns across the entire stack rather than targeting specific build-time processes |
| **Runtime Connection** | The dynamic binding of content to components at runtime rather than build time                                        | Static template compilation in traditional frameworks                                                                                                             |

Understanding these distinctions will help you avoid common misconceptions when working with Uniweb.

## Next Steps

Depending on your role, you might want to explore one of our specialized guides:

- [Uniweb for Content Creators](#) - Learn how to create and manage content effectively
- [Uniweb for Developers](#) - Technical guidance for building purpose-built Foundations
