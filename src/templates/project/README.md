# Uniweb Framework

A web development framework built on separation of concerns. **Content** lives in sites — markdown files and assets. **Foundations** provide the React components that render that content.

This architecture means content teams and developers work independently — content editors compose pages using intuitive components, developers build those components.

## Core Concepts

### Sites and Foundations

- A **site** is your content — pages, assets, and configuration
- A **Foundation** is a collection of React components designed to work together
- A **module** is how Foundations are packaged and delivered to sites

Each site primarily links to one Foundation (local or remote) that provides the components it needs, with optional secondary Foundations for specialized components.

### Foundation Interfaces

A Foundation's _interface_ is the set of components it exposes and their available options. These exposed components are what you can reference in markdown frontmatter. When you write `component: HeroSection`, that component must be in your Foundation's interface. Internal components are implementation details that content teams never reference directly.

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

Creates a local Foundation at `src/marketing` for building custom components, plus a demo site for testing.

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

**Build plug-and-play Foundations.** Create a Foundation and deploy it across multiple sites. When you update components, all connected sites benefit automatically.

**Components without the complexity.** A lightweight JavaScript engine runs in every site and provides all the typical code — localization, analytics, data fetching, forms, uploads. You just write components that receive preprocessed content and render it.

**Standard React workflow.** Use any packages, styles, or tools you prefer. The Framework scaffolds a normal React project — no vendor lock-in.

**Optional schemas unlock powerful features.** Add component schemas for your user-facing components:

- The local build process uses the component schemas to validate frontmatter options
- The Uniweb App uses a Foundation's schema to integrate its exposed components as native building blocks in its visual editor

### The Power of Specialization

Build one Foundation for a vertical (documentation, marketing, corporate, medical, legal, real estate) and deploy to dozens of client sites. Updates propagate automatically, controlled by per-site versioning policies.

**Developers maintain Foundations.** Build and refine components without managing individual client content.

**Content teams manage content.** Work with Git and Markdown, or use the [Uniweb App](https://uniweb.app) for a professional visual editing experience. Components are built by developers; content teams use them without touching code.

This separation eliminates bottlenecks and lets each team focus on their expertise.

## Deployment

**Publish your Foundation to the registry:**

```bash
npx uniweb module publish
```

Once published, content teams can create sites using your Foundation through the Uniweb App or by linking to your published module URL.

**Deploy your site:**

Use the Uniweb App for integrated hosting, or build and deploy to any static host:

```bash
npx uniweb build
```

The `dist` folder contains everything needed for deployment to GitHub Pages, Netlify, Vercel, or any other static hosting service.

See the [deployment guide](https://docs.framework.uniweb.app/deployment) for detailed options.

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

Webpack technology enabling Foundations to load dynamically at runtime and share dependencies with host sites. Allows Foundation updates to propagate instantly — improve your Foundation, and sites get the update on their next page load based on their version strategy.

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

- 🏠 **[Framework Website](https://framework.uniweb.app)** — Guides, blog, and comprehensive resources
- 📘 **[Documentation](https://docs.framework.uniweb.app)** — Complete API reference and tutorials
- 🚀 **[Uniweb App](https://uniweb.app)** — Visual content editor and hosting platform
- 💡 **[Examples](https://github.com/uniwebcms/examples)** — Sample Foundations and components
- 🛠️ **[Community Interfaces](https://github.com/uniwebcms/interfaces)** — Standard component specifications

## License

This project is licensed under GPL-3.0-or-later.

You are free to use and modify this repository, but if you distribute it (as a template or software package), you must also release your modifications under the same license.

**Important:** Websites and Foundations created using the Framework are NOT considered distributions and do not need to be licensed under GPL. The content and code you build with Uniweb remain yours to license as you choose.
