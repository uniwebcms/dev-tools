# Uniweb for Content Creators: A Practical Guide

> **This is part 2 of 3 in the Uniweb documentation set.**  
> • [Part 1: Uniweb: A New Approach to Web Creation](#)  
> • Part 2: Uniweb for Content Creators: A Practical Guide (this document)  
> • [Part 3: Uniweb for Developers: Building Purpose-Built Component Libraries](#)

## Introduction

As a content creator using Uniweb, you can build sophisticated websites without writing code. This guide will help you understand how to create, organize, and configure content effectively within the Uniweb framework.

Uniweb's approach is unique because it completely separates content from code. This means:

- You can focus entirely on content without worrying about technical implementation
- You have the power to update websites without developer involvement
- You can reuse the same content structure across different designs
- Your work won't be blocked by technical changes happening behind the scenes

> **Note:** For a conceptual overview of Uniweb's approach to content-code separation, see [Uniweb: A New Approach to Web Creation](#).

## Getting Started

### Your Workspace at a Glance

```
project-root/
├── pages/                 # Where your content lives
│   ├── index/             # Home page
│   │   ├── hero.md        # Individual content sections
│   │   ├── features.md
│   │   └── structure.yml  # Defines section order
│   └── about/             # About page
│       └── ...
└── public/                # Where your images and files live
    └── images/
        └── ...
```

As a content creator, you'll primarily work with:

- **Markdown files (.md)** - Individual sections of content
- **Structure files (structure.yml)** - Control the order of sections
- **Images and assets** - Stored in the public folder

### Basic Content Creation

Creating content in Uniweb is as simple as writing markdown files. Here's a typical section:

```markdown
---
component: HeroSection
layout: centered
background: dark
---

# Welcome to Our Platform

Discover how our innovative solutions can transform your business.

![Hero Image](/images/hero.jpg)

[Get Started](#getting-started){button-primary}
[Learn More](#about){button-secondary}
```

Don't let the technical-looking parts at the top intimidate you! Let's break this down:

1. **Front matter** (between `---` lines) - This simply tells Uniweb which component to use and how to configure it. Think of it as selecting a template and choosing some options.

2. **Content** - Everything after the front matter is just regular content:
   - `#` creates headings
   - Regular text creates paragraphs
   - `![Text](/images/file.jpg)` adds images
   - `[Text](link)` creates links
   - Adding `{button-primary}` to a link turns it into a styled button

You don't need to understand how components work internally - you just need to know which ones are available and what options they accept.

## Organizing Your Content

### Pages and Sections

In Uniweb, content is organized into pages and sections:

- **Pages** are complete web pages that visitors see (like "Home" or "About Us")
- **Sections** are individual content blocks on those pages (like a hero banner, feature list, or testimonial section)

```
pages/
├── index/                # Home page
│   ├── hero.md           # Hero section
│   ├── features.md       # Features section
│   └── page.yml          # Page metadata and section structure
└── about/                # About page
    ├── team.md           # Team section
    ├── mission.md        # Mission section
    └── page.yml          # Page metadata and section structure
```

The name of each folder becomes the URL path:

- `pages/index/` → Home page (`/`)
- `pages/about/` → About page (`/about`)
- `pages/products/services/` → Services page (`/products/services`)

### Organizing Sections with page.yml

The `sections` property in `page.yml` controls the order and hierarchy of sections:

```yaml
# pages/index/page.yml
title: Home Page
description: Welcome to our site
# Other page metadata...

# Section structure
sections:
  - hero # First section (references hero.md)
  - features # Second section (references features.md)
  - testimonials # Third section (references testimonials.md)
```

To create parent-child relationships (like tabbed content), use indentation:

```yaml
# pages/about/page.yml
title: About Us
description: Learn about our company

# Section structure with hierarchy
sections:
  - hero
  - team
    - member1  # Child of team
    - member2  # Child of team
  - history
```

If you add a new section file, remember to add it to the `sections` list in `page.yml` to make it appear on the page.

## Working with Components

Components are the building blocks that determine how your content is presented. Think of them as templates or layouts that give your content structure and style. In Uniweb, these components come from purpose-built component libraries (PBCLs) that have been designed specifically for your content needs.

### Discovering Available Components

To see which components are available in your project:

```bash
# List all components in the current module
uniweb list components
```

This command shows:

- Component names (what you'll use in your front matter)
- Descriptions (what each component does)
- Available parameters (options you can configure)

### Using Components in Your Content

To use a component, specify it in the front matter of your markdown file:

```yaml
---
component: TeamGrid
---
```

### Configuring Components

Most components have options you can configure:

```yaml
---
component: TeamGrid
layout: cards # How team members are displayed
columns: 3 # Number of columns in the grid
showDepartment: true # Whether to show department labels
---
```

Don't worry about memorizing all possible options. You can always check:

```bash
# Get detailed information about a specific component
uniweb get component --name TeamGrid
```

### Using Component Presets

Many components offer presets - pre-configured sets of options:

```yaml
---
component: FeatureShowcase
preset: compact # Uses a predefined configuration
---
```

To see available presets for a component:

```bash
uniweb list presets --component FeatureShowcase
```

Presets are a great way to use professionally designed configurations without having to specify all the individual settings.

## Creating Effective Content

### Structuring Your Content

Uniweb components expect content to be structured in a certain way. The most common pattern is:

```markdown
# Main Title

Introduction paragraph goes here.

## First Group Item

Content for the first item.

## Second Group Item

Content for the second item.
```

This creates:

- A main title (H1) with an introduction paragraph
- Multiple content groups (H2) that components can display as cards, tabs, accordion items, etc.

Here's how this structure looks when rendered by different components:

- **FeatureShowcase** - Displays each H2 group as a feature card
- **TabContainer** - Turns each H2 group into a separate tab
- **AccordionList** - Makes each H2 group into a collapsible accordion item

The same content structure can look completely different depending on which component you choose!

### Working with Images

Images are added using standard markdown syntax:

```markdown
![Team photo](/images/team.jpg)
```

The path should start with `/` and reference files in your `public` folder. For example, `/images/team.jpg` refers to `public/images/team.jpg` in your project.

You can add special attributes to images:

```markdown
![Background image](/images/background.jpg){background}
![Profile photo](/images/profile.jpg){circle}
```

These attributes tell components how to treat the image (as a background, circular crop, etc.).

### Creating Links and Buttons

Standard links use markdown syntax:

```markdown
[Learn more](/about)
```

To turn links into buttons, add an attribute:

```markdown
[Get Started](/signup){button-primary}
[Learn More](/about){button-secondary}
```

### Lists and Structured Content

Create bulleted and numbered lists using markdown:

```markdown
# Our Services

Here are the services we offer:

- Web Design
- App Development
- Content Creation

## Service Packages

1. Basic Package
2. Premium Package
3. Enterprise Solution
```

Components will automatically format these lists according to their design.

## Translating Your Content

Uniweb makes it easy to create multilingual websites without duplicating your entire site structure.

### How Translations Work

Translations are stored in the `locales` folder, mirroring your main content structure:

```
locales/
└── fr/                  # French translations
    └── pages/
        ├── index/
        │   ├── hero.md  # French version of hero section
        │   └── features.md
        └── about/
            └── team.md
```

The key benefit: You only need to translate the content itself, not the configuration or structure.

### Creating Translations

When creating a translation file, you only need to include the content - not the front matter:

**Original (pages/about/team.md):**

```markdown
---
component: TeamShowcase
layout: grid
columns: 3
---

# Our Team

Our dedicated professionals are committed to excellence.

## Alice Smith

Chief Executive Officer
```

**Translation (locales/fr/pages/about/team.md):**

```markdown
# Notre Équipe

Nos professionnels dévoués sont engagés dans l'excellence.

## Alice Smith

Directrice Générale
```

Notice that the translation file:

- Doesn't include the front matter (component, layout, columns)
- Only contains the translated content
- Keeps the same structure (headings, paragraphs)

### Using the CLI for Translations

The Uniweb CLI makes managing translations easy:

```bash
# Create a French translation for the team section
uniweb set section --page about --name team --locale fr --body "# Notre Équipe\n\nNos professionnels..."
```

This automatically creates the translation file in the correct location and format.

## Using the Uniweb CLI

The Uniweb Command Line Interface (CLI) is a powerful tool that simplifies content management. While you can edit files directly, the CLI helps ensure everything is in the right place and format.

### Getting Started with the CLI

First, install the CLI globally:

```bash
npm install -g @uniwebcms/toolkit
```

This makes the `uniweb` command available from any directory on your computer.

### Common Content Tasks

#### Adding Content

```bash
# Add a new page
uniweb add page --name products

# Add a new section to a page
uniweb add section --page about --name mission

# Add section content
uniweb set section --page about --name mission --body "# Our Mission\n\nWe aim to..."
```

#### Managing Content

```bash
# Update existing section content
uniweb set section --page about --name team --body "# Updated Team Content"

# Get current content of a section
uniweb get section --page about --name team

# Copy a section to another page
uniweb copy section --from-page about --from-name team --to-page contact --to-name leadership
```

#### Working with Translations

```bash
# Add a French translation
uniweb set section --page about --name team --locale fr --body "# Notre Équipe"

# List available translations
uniweb list locales
```

### Getting Help

```bash
# See all available commands
uniweb help

# Get help for a specific command
uniweb help add section
```

## Practical Examples

Let's look at some common scenarios:

### Creating a New Page with Sections

```bash
# Create the page
uniweb add page --name services

# Add sections
uniweb add section --page services --name overview
uniweb add section --page services --name offerings
uniweb add section --page services --name pricing

# Add content to sections
uniweb set section --page services --name overview --body "# Our Services\n\nWe provide..."
uniweb set section --page services --name offerings --body "# What We Offer\n\n## Service One\n\nDetails..."
uniweb set section --page services --name pricing --body "# Pricing Options\n\n## Basic\n\n$99/month..."

# Define page metadata and section order
uniweb set page --name services --config "title: Our Services\ndescription: Services we offer\nsections:\n  - overview\n  - offerings\n  - pricing"
```

### Updating an Existing Section

```bash
# Get current content
uniweb get section --page about --name team

# Update the content
uniweb set section --page about --name team --body "# Our Team\n\nMeet our expanded team of experts..."
```

## Best Practices

1. **Structure content logically** - Use headings to create a clear hierarchy
2. **Be consistent across sections** - Use similar patterns for similar content
3. **Think in terms of content, not presentation** - Focus on what you're saying, not exactly how it will look
4. **Use the appropriate component** - Different components are designed for different content types
5. **Preview changes frequently** - Use the preview functionality to see how your content renders
6. **Leverage presets** - Use component presets for professionally designed layouts
7. **Use the CLI for complex operations** - The CLI helps maintain consistency, especially for translations

## Getting Help

If you're ever unsure about how a component works or what options are available:

```bash
# Get information about a component
uniweb get component --name HeroSection

# List all available components
uniweb list components

# List presets for a component
uniweb list presets --component FeatureShowcase
```

These commands provide the information you need without having to search through documentation.

## Next Steps

Now that you understand the basics of content creation in Uniweb, you're ready to start building! Remember that the purpose-built Foundation used by your site determines which components are available to you and how they function.

If you're interested in learning more about how these PBCLs are created:

- [Uniweb for Developers: Building Foundations](#) - The technical guide for developers who create component libraries

---

Happy content creating with Uniweb!
