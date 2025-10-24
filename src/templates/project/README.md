# Uniweb Framework

A web development framework built on separation of concerns. **Content** lives in sites – markdown files and assets. **Foundations** provide the React components that render that content.

This architecture means content teams and developers work independently – content editors compose pages using intuitive components, developers build those components.

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

**Available templates:** `marketing`, `docs`, `corporate`

> Want to start from scratch? Omit `--template` for a minimal project, and later add sites and modules as needed.

## Core Concepts

### Sites and Foundations

- A **site** is your content – pages, assets, and configuration
- A **Foundation** is a collection of React components designed to work together
- A **module** is how Foundations are packaged and delivered to sites

Each site links to one Foundation (local or remote) that provides all the components it needs.

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

## Project Types

**Content-Only Project** (uses a remote Foundation):

```bash
npx @uniwebcms/framework@latest create my-site \
  --site / \
  --module https://modules.uniweb.app/username/marketing
```

Ideal for content teams – no local code, just content management.

**Development Project** (build your own Foundation):

```bash
npx @uniwebcms/framework@latest create my-project --site demo --module marketing
```

Creates a local Foundation at `src/marketing` for building custom components, plus a demo site for testing.

**Minimal Project** (add sites/modules as needed):

```bash
npx @uniwebcms/framework@latest create my-project
```

## Optional Setup Steps

### Connect local repository to GitHub

Create an **empty repository** on GitHub and then:

```sh
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/[user-name]/[project-name].git
git push -u origin main
```

### Install the CLI globally

Install globally for frequent use:

```bash
npm install -g @uniwebcms/framework
uniweb create my-project
```

## Monorepo Organization

The project file structure supports one optional root level site, multiple sites under `sites/`, and multiple Foundation modules under `src/`. Each site and module represents an **independent workspace**, with its own dependencies. For example:

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

> **Workspaces:** When adding sites or modules, independent project workspaces are automatically created. Each workspace maintains its own dependencies, which are auto-installed based on your preferred package manager. This is determined either from the `packageManager` field in `package.json` or inferred from your existing lock file (npm, yarn, pnpm, or bun).

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

## Deployment

You have multiple deployment options:

### Option 1: Uniweb.app (Recommended)

The easiest way to deploy your Uniweb site is through the official [Uniweb.app](https://www.uniweb.app) platform:

```bash
# Login to your Uniweb account
npx uniweb login

# Publish your site
npx uniweb site publish my-site

# For your Foundation
npx uniweb module publish my-foundation
```

Uniweb.app provides specialized hosting optimized for Uniweb projects with features like:

- Automatic preview environments
- Content management interface
- Custom domain support
- SSL certificates
- Integrated analytics

Uniweb.app is a commercial CMS platform with visual editing features, while the Uniweb framework itself remains open source.

### Option 2: Custom Hosting

Alternatively, you can build your site for deployment to any static hosting service:

```bash
# Build for production
npm run build
# or
npx uniweb build
```

The `dist` folder contains everything needed to deploy your site to:

- GitHub Pages
- Any other hosting service

## Why Uniweb Framework?

**Build plug-and-play Foundations.** Create a Foundation and deploy it across multiple sites. When you update components, all connected sites benefit automatically.

**Components without the complexity.** A lightweight JavaScript engine runs in every site and provides all the typical code – localization, analytics, data fetching, forms, uploads. You just write components that receive preprocessed content and render it.

**Standard React workflow.** Use any packages, styles, or tools you prefer. The Framework scaffolds a normal React project – no vendor lock-in.

**Optional schemas unlock powerful features.** Add component schemas for your user-facing components:

- The local build process uses the component schemas to validate frontmatter options
- The Uniweb App uses a Foundation's schema to integrate its exposed components as native building blocks in its visual editor

### The Power of Specialization

Build one Foundation for a vertical (documentation, marketing, corporate, medical, legal, real estate) and deploy to dozens of client sites. Updates propagate automatically, controlled by per-site versioning policies.

**Developers maintain Foundations.** Build and refine components without managing individual client content.

**Content teams manage content.** Work with Git and Markdown, or use the [Uniweb App](https://uniweb.app) for a professional visual editing experience. Components are built by developers; content teams use them without touching code.

This separation eliminates bottlenecks and lets each team focus on their expertise.

## Architecture

### Module Federation

Webpack technology enabling Foundations to load dynamically at runtime and share dependencies with host site. Allows Foundation updates to propagate instantly – improve Foundation, sites get update on next page load based on version strategy.

### Version Strategy

How sites control Foundation updates: automatic (all updates), minor-only (minor + patch), patch-only (patch only), or pinned (no updates). Set in backend configuration evaluated at runtime.

### Pre-Configured Development Environment

Site and module workspaces come fully pre-configured with professional development tooling:

- **Modern JavaScript ecosystem**: Webpack, Babel, and ESM module support with zero configuration
- **TypeScript integration**: Complete TypeScript support with optimized tsconfig defaults
- **React development**: Built-in React, JSX processing, and router with automatic React imports
- **Advanced CSS tools**: PostCSS pipeline with Tailwind CSS and essential plugins:
  - autoprefixer
  - @tailwindcss/typography
- **Core components**: The `@uniwebcms/basic` package provides essential components like Link, Image, Icon, For, RichText, and more
- **Production optimization**: Automatic minification, tree-shaking, code splitting, and asset optimization
- **Developer experience**: Hot module replacement, detailed error overlays, and source maps

This comprehensive setup eliminates hours of configuration work and maintenance, allowing you to focus immediately on building components and content rather than wrestling with build tools. While the default configuration covers most common needs, all aspects can be customized and extended as your project requirements evolve.

### The Broader Ecosystem

The Uniweb Framework is open source (GPL-3.0) and free to use. The broader Uniweb ecosystem includes:

- **Uniweb App** – Professional visual editor and hosting platform (free for drafts, pay to publish)
- **Foundation Registry** – Publish and share Foundations with licensing options (coming soon)
- **Community** – Open interfaces, examples, and shared best practices

The Framework works standalone or integrates with the full ecosystem as your needs grow.

## Learn More

- 🏠 **[Framework Website](https://framework.uniweb.app)** – Guides, blog, and comprehensive resources
- 📘 **[Documentation](https://docs.framework.uniweb.app)** – Complete API reference and tutorials
- 🚀 **[Uniweb App](https://uniweb.app)** – Visual content editor and hosting platform
- 💡 **[Examples](https://github.com/uniwebcms/examples)** – Sample Foundations and components
- 🛠️ **[Community Interfaces](https://github.com/uniwebcms/interfaces)** – Standard component specifications

## License

This project is licensed under GPL-3.0-or-later.

You are free to use and modify this repository, but if you distribute it (as a template or software package), you must also release your modifications under the same license.

**Important:** Websites created using Uniweb are NOT considered distributions and do not need to be licensed under GPL. The content and sites you build with Uniweb remain yours to license as you choose.
