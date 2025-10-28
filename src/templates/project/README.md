# Uniweb Framework

A web development framework built on separation of concerns. **Content** lives in sites—page hierarchy, markdown files, and assets. **Foundations** provide the React components that render that content.

Content can be markdown, structured data, or dynamic data from APIs and databases. Build marketing sites, product catalogs, or anything in between—same architecture, different data sources.

This architecture means content teams and developers work independently—content editors compose pages using intuitive components, developers build those components. Whether you're building a single site or deploying one Foundation across dozens of client sites, the same clean architecture applies.

## Quick Start

Create a new Uniweb project with a starter template:

```bash
npx @uniwebcms/framework@latest create my-project --template marketing
```

This creates a complete example with:

- A Foundation showcasing different component patterns
- A demo site with sample pages and content
- Components ranging from fully hardcoded to fully parameterized

Start the development server:

```bash
cd my-project
npm install
npx uniweb start
```

Visit `http://localhost:3000/sites/main/` to see your site.

**Available templates:** `marketing`, `docs`, `corporate`

> Want to start from scratch? Omit `--template` for a minimal project, then add sites and modules as needed.

**Foundations scale to your needs.** Build a minimal Foundation for a single site (like any React framework) or create a comprehensive design system with presets, theming, and visual editor integration. The framework supports the entire spectrum—from hardcoded components for one project to product-grade Foundations serving multiple sites with content creators who never touch code.

## Core Concepts

### Sites and Foundations

- A **site** is your content — pages, assets, and configuration
- A **Foundation** is a collection of React components designed to work together
- A **module** is how Foundations are packaged and delivered to sites

Each site primarily links to one Foundation (local or remote) that provides the components it needs, with optional secondary Foundations for specialized components.

**Independently hosted.** Unlike traditional React apps, Foundations aren't bundled with sites. Sites in your project typically provide test content for developing Foundation components—actual production sites often live in separate projects or at [uniweb.app](https://www.uniweb.app). See [Testing](https://github.com/uniwebcms/framework/blob/HEAD/docs/testing-guide.md) and [Deployment](#deployment) for production patterns.

### Foundation Interfaces

A Foundation's _interface_ is the set of components it exposes and their available options. These exposed components are what you can reference in markdown frontmatter. When you write `component: HeroSection`, that component must be in your Foundation's interface. Internal components are implementation details that content teams never reference directly.

**Schemas enable visual editor integration.** Component schemas aren't just metadata—they're runtime contracts that make your components native to visual editors. When content creators use the Uniweb App, your Foundation's components appear as first-class building blocks with your parameters becoming visual controls, your presets becoming one-click starting points, and changes previewing instantly. Your custom design system becomes the editor's interface for that site.

### Content-Driven Rendering

Content is written in markdown with YAML frontmatter that specifies which component to use:

```markdown
---
component: HeroSection
layout: centered
background: dark
---

# Welcome to Our Platform

Discover innovative solutions for your business.
```

At runtime, the Framework connects your content with the appropriate component from your Foundation.

**Content with structure and dynamics.** Markdown handles content naturally, but you can also use JSON blocks for structured data and data sources for dynamic content. The framework handles data fetching and provides everything to your components—from static marketing sites to data-driven product catalogs with the same content-first architecture.

## Workspace Organization

**Single project, multiple workspaces:** One project can contain multiple sites and Foundations as independent workspaces. Ideal when you want to share components across Foundations, or test the same site content with different Foundations.

**Multiple projects:** Alternatively, create separate projects (repositories) for different sites or Foundations. Ideal for independent versioning, separate teams, or publishing Foundations to the registry.

Both approaches use the same Framework tools. Here's an example of a multi-workspace project:

```
my-project/
├── package.json           # Root package.json with workspace config
├── uniweb.config.js       # Project-level configuration
├── sites/                 # Site workspaces
│   ├── marketing/         # Marketing site
│   └── docs/              # Documentation site
└── src/                   # Component library workspaces
    ├── corporate/         # Corporate design Foundation
    └── documentation/     # Documentation-focused Foundation
```

Each workspace maintains its own dependencies, which are auto-installed based on your preferred package manager (npm, yarn, pnpm, or bun).

## Project Types

**Template Project** (recommended for learning):

```bash
npx @uniwebcms/framework@latest create my-project --template marketing
```

Includes a Foundation with example components and a demo site with sample content.

**Development Project** (build your own Foundation):

```bash
npx @uniwebcms/framework@latest create my-project --site demo --module marketing
```

Creates a local Foundation at `src/marketing` for building custom components, plus a demo site for testing. Perfect for your own site with complete control over components—start with what you need, expand if your requirements grow.

**Content-Only Project** (uses a remote Foundation):

```bash
npx @uniwebcms/framework@latest create my-site \
  --site / \
  --module https://modules.uniweb.app/username/marketing
```

Ideal for content teams — no local code, just content management.

**Minimal Project** (add sites/modules as needed):

```bash
npx @uniwebcms/framework@latest create my-project
```

## Key CLI Commands

```bash
# Inside a project
npx uniweb start              # Development server
npx uniweb page add about     # Create a new page
npx uniweb component add FAQ  # Add component to your Foundation

# Inline help
npx uniweb -h                 # Main help index
npx uniweb page add -h        # Help for 'page add' command

# Publishing (coming soon)
npx uniweb site publish       # Publish your site
npx uniweb module publish     # Publish your Foundation to the registry
```

## Installation Options

**Recommended:** Use `npx` (no installation needed):

```bash
npx @uniwebcms/framework@latest create my-project
```

**Optional:** Install globally for frequent use:

```bash
npm install -g @uniwebcms/framework
uniweb create my-project
```

## Why Uniweb Framework?

**Clean separation of content and code.** Build components in a Foundation, write content in markdown. Start with a single site using your own Foundation—standard React development with better content organization. Need to serve multiple sites later? Your Foundation is already architected for it. Updates propagate automatically based on version strategy—improvements flow without redeployment.

**Components that scale to your needs.** Build hardcoded components for a single site or create parameterized components that content creators configure. Start with minimal schemas (just component names) and add parameters, presets, and validation as your needs grow. The framework supports the entire continuum—from site-specific React components to comprehensive design systems for content creators.

**Components without the complexity.** A lightweight JavaScript engine runs in every site and provides all the typical infrastructure—localization, analytics, data fetching, forms, uploads. You just write components that receive preprocessed content and render it.

**Standard React workflow.** Use any packages, styles, or tools you prefer. The Framework scaffolds a normal React project—no vendor lock-in.

**Component schemas define the contract.** Every exposed component requires a schema file—at minimum, defining the component's name. This minimal schema is enough for hardcoded components in single-site projects. Rich schemas that specify parameters, options, and validation unlock powerful features:

- Content teams can configure components through frontmatter options
- The build process validates frontmatter against your schema
- The Uniweb App integrates your components as native building blocks in its visual editor
- Your Foundation's complete interface is defined by all component schemas plus Foundation-level settings

Start with minimal schemas during development. Add parameters and options as your components mature and your use case expands—for flexibility across related sites, for content creator empowerment, or for deep visual editor integration. The schema defines what content teams can achieve with each component, scaled to your project's requirements.

### Scaling Beyond a Single Site

The same Foundation that powers your site can serve others. Build once for a vertical (documentation, marketing, corporate, medical, legal, real estate), then optionally deploy to multiple client sites. Updates propagate automatically, controlled by per-site versioning policies.

**Developers maintain Foundations.** Build and refine components without managing individual client content.

**Content teams manage content.** Work with Git and Markdown, or use the [Uniweb App](https://uniweb.app) for a professional visual editing experience. Components are built by developers; content teams compose with them as if they were native app features—no code required.

This separation eliminates bottlenecks and lets each team focus on their expertise—whether you're working solo on one site or coordinating across multiple teams and projects.

## Deployment

Publish your Foundation and create a live site in 5 minutes.

### Publish Foundation to Registry

```bash
# Authenticate (creates account if needed)
npx uniweb login

# Publish your foundation
cd src/my-foundation
npx uniweb module publish
```

### Create and Publish Site

1. Go to [uniweb.app](https://uniweb.app)
2. Click **Create Site**
3. Select your foundation
4. Build content with visual editor
5. Click **Publish**

Done! Your site is live with managed hosting, visual editor, and automatic updates.

**Looking for self-hosted sites?** See the [deployment guide](https://github.com/uniwebcms/framework/blob/HEAD/docs/deployment-guide.md) for detailed options.

## Architecture

### Pre-Configured Development Environment

Site and module workspaces come fully pre-configured with professional development tooling:

- **Modern JavaScript ecosystem**: Webpack, Babel, and ESM module support with zero configuration
- **TypeScript integration**: Complete TypeScript support with optimized tsconfig defaults
- **React development**: Built-in React, JSX processing, and router with automatic React imports
- **Advanced CSS tools**: PostCSS pipeline with Tailwind CSS and essential plugins
- **Core components**: The `@uniwebcms/basic` package provides essential components like Link, Image, Icon, Form, RichText, and more
- **Production optimization**: Automatic minification, tree-shaking, code splitting, and asset optimization
- **Developer experience**: Hot module replacement, detailed error overlays, and source maps

This comprehensive setup eliminates hours of configuration work, allowing you to focus immediately on building components rather than wrestling with build tools. While the default configuration covers most common needs, all aspects can be customized as your project requirements evolve.

### Module Federation

Webpack technology enabling Foundations to load dynamically at runtime and share dependencies with host sites. Allows Foundation updates to propagate instantly—improve your Foundation, and sites get the update on their next page load based on their version strategy.

### Version Strategy

Sites control how Foundation updates are applied: automatic (all updates), minor-only (minor + patch), patch-only (patch only), or pinned (no updates). This configuration is evaluated at runtime, giving sites control over their update stability.

### The Broader Ecosystem

The Uniweb Framework is open source (GPL-3.0) and free to use. The broader Uniweb ecosystem includes:

- **Uniweb App** — Professional visual editor and hosting platform (free for drafts, pay to publish)
- **Foundation Registry** — Publish and share Foundations with licensing options (coming soon)
- **Community** — Open interfaces, examples, and shared best practices

The Framework works standalone or integrates with the full ecosystem as your needs grow.

## Optional: Connect to GitHub

After creating your project locally, you can push it to GitHub:

1. Create an empty repository on GitHub
2. In your project directory:

```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/username/project-name.git
   git push -u origin main
```

Alternatively, use the GitHub CLI:

```bash
gh repo create project-name --source=.
git push -u origin main
```

## Learn More

- 🧭 **[Understanding Uniweb](https://github.com/uniwebcms/framework/blob/HEAD/docs/understanding-uniweb.md)** — Core concepts and architectural insights
- 🏠 **[Framework Website](https://framework.uniweb.app)** — Guides, blog, and comprehensive resources
- 📘 **[Documentation](https://docs.framework.uniweb.app)** — Complete API reference and tutorials
- 🚀 **[Uniweb App](https://uniweb.app)** — Visual content editor and hosting platform
- 💡 **[Examples](https://github.com/uniwebcms/examples)** — Sample Foundations and components
- 🛠️ **[Community Interfaces](https://github.com/uniwebcms/interfaces)** — Standard component specifications

## License

This project is licensed under GPL-3.0-or-later.

You are free to use and modify this repository, but if you distribute it (as a template or software package), you must also release your modifications under the same license.

**Important:** Websites and Foundations created using the Framework are NOT considered distributions and do not need to be licensed under GPL. The content and code you build with Uniweb remain yours to license as you choose.
