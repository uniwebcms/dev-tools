# Uniweb Framework

Uniweb Framework enables developers and content creators to work independently through complete content-code separation:

- **Content** exists as markdown files with semantic configuration
- **Code** a purpose-built _foundation_ of section-level components that content creators can select and customize, together with internal React components that are not exposed to content creators
- **Runtime connection** dynamically unites content and code (they can be hosted separately)

This approach eliminates traditional compromises between simplicity and power, letting each role focus on what they do best.

> **Documentation:** For a comprehensive understanding of Uniweb, check out our three-part documentation set:
>
> - [Uniweb Framework](link) - Core concepts and architectural overview
> - [Uniweb for Content Creators](link) - Guide for creating and managing content
> - [Uniweb for Developers](link) - Technical guide for building Foundations

## Who Is Uniweb For?

- **Content Teams**: Writers, marketers, and editors who want to focus on content without technical hurdles
- **Developers**: Frontend engineers who want to build reusable component systems without content constraints
- **Organizations**: Teams that need to maintain multiple connected sites with consistent design systems
- **Agencies**: Design and development shops managing multiple client websites with shared components

## Getting Started

We recommend installing the Uniweb CLI globally as your first step:

```bash
# Install the Uniweb CLI globally
npm install -g @uniwebcms/toolkit
```

This enables you to initialize and manage Uniweb projects from any directory, with commands that intelligently detect your context and project structure.

You can then create a new project in several ways:

### Option 1: Use this GitHub Template

1. Click the "Use this template" button at the top of this repository
2. Name your new repository and create it
3. Clone your new repository locally
4. Install dependencies: `npm install` (or `yarn`)
5. Add sites and modules to the project as needed. Use `uniweb add site <site-name>` to add a site, and `uniweb add module <module-name>` to add a module. You can also add a special **root-level site** via `uniweb add site /`.
6. Start the development server: `uniweb start`
7. Visit `http://localhost:3000` to see your site

> **Workspaces:** When adding sites or modules, independent project workspaces are automatically created. Each workspace maintains its own dependencies, which are auto-installed based on your preferred package manager. This is determined either from the `packageManager` field in `package.json` or inferred from your existing lock file (npm, yarn, pnpm, or bun).

### Option 2: Use a Specialized Starter

For specific use cases, check out our pre-configured starters:

- [Uniweb Documentation Starter](link) - Perfect for knowledge bases and technical documentation
- [Uniweb Marketing Starter](link) - Optimized for business and marketing sites
- [Uniweb Blog Starter](link) - Designed for content-focused sites and blogs

### Option 3: Use the Uniweb CLI Directly

For a completely fresh start with standard options:

```bash
# Create a git repository with no sites or libraries
uniweb init my-project
```

Alternatively, start with a site and/or library:

```bash
# Create a new project with both a site and component library
uniweb init my-project --module M1 --site test

# Or create just a content-focused site (single root site)
uniweb init my-project --site /
```

> By default, the site and module dependencies are auto installed with `npm install`. To use a different project manager, set the desired one with `--pm [NAME]`. Options are `npm`, `yarn`, `yarn-pnp`, `pnpm`, and `bun`. For example, `uniweb init my-project --pm yarn-pnp`.

Next:

```bash
cd my-project
uniweb start
```

**OPTIONAL**: You can connect your local repository to GitHub by creating an **empty repository** on GitHub and then:

```sh
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/[user-name]/[project-name].git
git push -u origin main
```

## Pre-Configured Development Environment

Site and module workspaces come fully pre-configured with professional development tooling:

- **Modern JavaScript ecosystem**: Webpack, Babel, and ESM module support with zero configuration
- **TypeScript integration**: Complete TypeScript support with optimized tsconfig defaults
- **React development**: Built-in React, JSX processing, and router with automatic React imports
- **Advanced CSS tools**: PostCSS pipeline with Tailwind CSS and essential plugins:
  - autoprefixer
  - @tailwindcss/typography
- **Core components**: The `@uniwebcms/basic` package provides essential components like Link, Image, Icon, and RichText
- **Production optimization**: Automatic minification, tree-shaking, code splitting, and asset optimization
- **Developer experience**: Hot module replacement, detailed error overlays, and source maps

This comprehensive setup eliminates hours of configuration work and maintenance, allowing you to focus immediately on building components and content rather than wrestling with build tools. While the default configuration covers most common needs, all aspects can be customized and extended as your project requirements evolve.

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

## AI-Powered Development

The Uniweb CLI features an AI agent mode that enables natural language interaction with your projects:

```bash
# Start or resume an AI chat session
uniweb chat
```

The AI assistant can help you:

- Create sites, pages, and component libraries through conversation
- Generate well-structured markdown content
- Explore available components and their parameters
- Get guidance on Uniweb concepts and best practices
- Execute CLI commands based on your natural language instructions

Chat sessions persist across multiple sessions, making it easy to continue working on long-term projects.

## Key Concepts

### Purpose-Built Foundation

A Foundation is a comprehensive collection of components designed to work together as a cohesive design system:

- Each site connects with exactly one Foundation via a `site.yml` configuration file, which can reference local modules or remote modules by URL with optional version specifications
- Foundations provide nearly all HTML, CSS, and JavaScript for a site
- Component interfaces use semantic parameters that express intent rather than implementation
- Libraries can be specialized for particular industries, purposes, or design approaches

### Content/Code Separation

Uniweb maintains complete separation between content and code:

- Content creators work with pure markdown and simple configuration
- Developers create reusable component libraries that can power multiple sites
- Sites can switch libraries without modifying content
- Libraries can evolve without disrupting content

### Project Types

Uniweb supports different project configurations depending on your needs:

1. **Content-focused projects**: For content creators using existing component libraries
2. **Development-focused projects**: For developers creating and testing component libraries
3. **Monorepo projects**: For teams managing multiple sites and libraries together

## Deployment

You have multiple deployment options:

### Option 1: Uniweb.app (Recommended)

The easiest way to deploy your Uniweb site is through the official Uniweb.app platform:

```bash
# Login to your Uniweb account
uniweb login

# Publish your site
uniweb site publish mysite

# For component libraries
uniweb module publish mylibrary
```

Uniweb.app provides specialized hosting optimized for Uniweb projects with features like:

- Automatic preview environments
- Content management interface
- Custom domain support
- SSL certificates
- Integrated analytics

Uniweb.app is a commercial CMS platform with visual editing features, while the Uniweb framework itself remains open source.

### Option 2: Static Site Hosting

Alternatively, you can build your site for deployment to any static hosting service:

```bash
# Build for production
npm run build
# or
uniweb build
```

The `dist` folder contains everything needed to deploy your site to:

- GitHub Pages
- Any other hosting service

## Practical Applications

Uniweb is particularly well-suited for:

- **Multi-site organizations** that want to share design systems across sites
- **Content-heavy platforms** like documentation, marketing, and educational sites
- **Teams with distinct content and technical roles** seeking efficient collaboration
- **Long-lived projects** that need to evolve over time without constant rebuilds

## Community and Resources

- 📘 [Documentation](https://link-to-docs)
- 🌟 [GitHub Organization](https://github.com/uniwebcms)
- 🐛 [Report Issues](https://github.com/uniwebcms/uniweb/issues)
- 💡 [Feature Requests](https://github.com/uniwebcms/uniweb/discussions)
- 🛠️ [Component Library Template](https://github.com/uniwebcms/component-library-template)
- 🚀 [Site Starter Template](https://github.com/uniwebcms/site-starter)

## License

This project is licensed under GPL-3.0-or-later.

You are free to use and modify this repository, but if you distribute it (as a template or software package), you must also release your modifications under the same license.

**Important:** Websites created using Uniweb are NOT considered distributions and do not need to be licensed under GPL. The content and sites you build with Uniweb remain yours to license as you choose.

---

Built with ❤️ by the Uniweb Community. Learn more at [uniwebcms.com](https://uniwebcms.com).
