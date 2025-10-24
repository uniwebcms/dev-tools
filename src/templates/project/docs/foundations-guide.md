# Building Foundations: A Guide

## Purpose of This Document

This guide explains what Foundations are, how they work within Uniweb, and what you need to understand before building one. If you're evaluating whether to create a Foundation, use an existing one, or trying to understand how Foundation design decisions affect the sites that use them, this document is for you.

This is not a technical implementation guide. It's about understanding the mental model, the contracts, and the constraints that make Foundations work. For implementation details, see the technical Foundation documentation.

## What is a Foundation, Really?

A Foundation is not just a collection of components. It's a **capability boundary** that defines what content teams can do when building sites.

When a content team uses the Uniweb App to create a website, they work entirely within the constraints of the Foundation they've chosen. If the Foundation doesn't provide a carousel component, they can't add carousels. If a component doesn't support dynamic data, they can't use dynamic data in that section. If a component offers three layout options, they get exactly those three options—no more, no less.

This is intentional. The Foundation is the literal foundation of what's possible for a site. Content teams don't write code, don't configure backends, don't interact with the engine directly. They compose sections using Foundation components, configure those components through the options the Foundation exposes, and arrange content within the structure the Foundation provides.

### Primary and Secondary Foundations

Every site has exactly one **Primary Foundation**. This is the main component system that defines the site's capabilities. All section-level components come from the Primary Foundation, ensuring visual and functional coherence.

Sites can optionally add **Secondary Foundations** that provide specialized capabilities—additional components or child components that extend what the Primary Foundation offers. For example, a Secondary Foundation might provide industry-specific sections, specialized animations, or alternative implementations of certain patterns. How Primary and Secondary Foundations compose is beyond the scope of this guide, but the key insight is that the Primary Foundation establishes the core capability boundary while Secondary Foundations can extend it.

### What This Means for Foundation Creators

When you build a Foundation, you're not just building components—you're making architectural decisions about what content teams can accomplish. You're deciding:

- What kinds of sections can exist on sites using your Foundation?
- How much layout flexibility should content teams have?
- Which components should accept dynamic data, and how?
- How much visual customization is possible through configuration?
- Where are the boundaries of what can be composed?

These aren't just technical decisions. They're product decisions that shape how content teams experience the platform.

## The Content/Code Separation

Uniweb cleanly separates content from code, similar to headless CMS architectures. But unlike traditional headless systems where you fetch data and handle it yourself, Uniweb delivers content **preprocessed and render-ready** to your components.

### What the Engine Handles

By the time your Foundation components receive data, the engine has already:

- **Localized all content** - Text arrives in the correct language for the current user
- **Processed markdown** - Rich text is already converted to render-ready format
- **Optimized assets** - Images have CDN URLs, optimized sizes, proper formats
- **Fetched dynamic data** - External data sources are already retrieved and structured
- **Validated links** - URLs are checked and prepared
- **Resolved references** - Cross-references between content pieces are linked

Your components receive content that's ready to render. You don't write data fetching logic, localization code, or asset processing. That complexity lives in the engine layer.

### What Foundation Components Handle

Foundation components make **rendering decisions**:

- Which content to display and where
- How to layout the section
- What styling to apply
- Whether to render child components
- Which dynamic data to use (if any)

The separation is deliberate. The engine handles all the messy, stateful, asynchronous work of getting content ready. Components handle the declarative work of deciding how to present it.

This means you can focus entirely on the user experience without worrying about data pipelines, caching strategies, or internationalization logic.

## The Component Interface Contract

Every exposed Foundation component receives the same props structure from the engine. This is the contract between the platform and your components.

### The Standard Props Structure

All Foundation components receive the same interface from the engine:

**`params`** - Configuration options that content teams set in the Uniweb App. If your component offers layout choices, color schemes, or behavioral flags, they come through params. What's configurable is entirely up to you—this is how you expose control to content teams.

**`content`** - The static content for this section. Text, images, links—all localized, processed, and ready to render. The structure depends on what content fields you define for your component.

**`input`** - Dynamic data from external sources. If the content team connects a data source to this section, the fetched data arrives here. Your component can choose to use it, ignore it, or use only parts of it.

**`children`** - Child content blocks that should render within this section. Each child is itself a choice of component with its own props. Your component decides whether to render children, and where in your layout they appear.

### Components Choose What to Use

Not every component uses every prop. This is intentional flexibility:

- An FAQ component might only render static content and completely ignore dynamic data
- A testimonials component might only use dynamic data and have no configurable options
- A simple hero section might not render children at all
- A flexible container component might render only children and minimal content

You're not required to handle everything. The engine provides the interface consistently, but you decide what's relevant for each component.

## Composability and Rendering Control

In the Uniweb App, content teams compose sections by choosing components and optionally nesting child blocks within them. But whether those child blocks actually render is entirely up to your component implementation.

### Child Rendering is Optional

Some components are designed as flexible containers that render whatever children content teams add. Others are self-contained and render only their own predefined structure, ignoring any children entirely.

Both approaches are valid. Flexible containers enable composition and varied layouts. Self-contained components enforce specific structures and maintain tight visual consistency. Neither is wrong—they serve different purposes based on your Foundation's design philosophy.

### Design Decisions About Composability

When designing a Foundation, you'll make choices about composability:

- **Flexible containers** let content teams build varied layouts by combining smaller pieces
- **Opinionated components** enforce visual consistency by controlling their entire structure
- **Hybrid approaches** allow children in specific zones while controlling other areas

These decisions shape how content teams experience your Foundation. More composability means more flexibility but potentially less visual consistency. Less composability means tighter control but potentially less adaptability to unique needs.

### Dynamic Data Integration

Similar to children, dynamic data integration is opt-in per component. Some components might prefer dynamic data when available but fall back to static content. Others might be explicitly designed for only static content and ignore dynamic data entirely. You decide which components benefit from dynamic integration and which work better with configured, static content.

## Design Philosophy for Foundation Creators

Building a Foundation requires thinking beyond individual components. You're designing a system that other people will use to build unlimited sites.

### Granularity of Control

One of your primary decisions is how much control to give content teams through configuration:

**Rich parameterization:**

- Many configurable options per component
- Multiple layout choices
- Extensive color and spacing controls
- Maximum flexibility for content teams

**Opinionated constraints:**

- Minimal configuration options
- Enforced design system
- Consistent look and feel
- Lower cognitive load for content teams

**Recommendation for general-purpose Foundations:** Provide rich parameterization. Give content teams the tools to achieve different layouts and looks while maintaining the Foundation's core design language.

**Recommendation for specialized Foundations:** Be more opinionated. If you're building a Foundation for a specific industry or use case, enforcing consistency often serves users better than maximum flexibility.

### Thinking in Capability Boundaries

Every component you add to a Foundation expands what's possible for content teams. Every configuration option you expose gives them another lever to pull. Every decision to support or not support certain features defines the boundaries of their work.

Ask yourself:

- **What should be easy?** These become simple components with good defaults
- **What should be possible but require thought?** These become flexible components with more configuration
- **What should be prevented?** These capabilities you deliberately don't include

Not including a feature is as much a design decision as including one. An omission might prevent bad design choices, reduce complexity, or keep the Foundation focused.

### Balancing Flexibility and Consistency

The tension between flexibility and consistency runs through every Foundation design decision:

- More `params` → More flexibility, less consistency
- More component variety → More possible layouts, harder to maintain coherence
- More child rendering → More composition power, more ways to break the design
- More dynamic data support → More integration possibilities, more complexity

Neither extreme is right. The balance depends on your Foundation's purpose and your target users' needs.

### General-Purpose vs. Specialized Foundations

**General-purpose Foundations** aim to support many types of sites:

- Broad component library
- Rich configuration options
- Multiple style variants
- Support for various content patterns

**Specialized Foundations** optimize for specific contexts:

- Focused component set
- Opinionated design decisions
- Industry-specific patterns
- Optimized workflows for particular use cases

Both approaches are valid. General-purpose Foundations enable wider adoption but may be harder to master. Specialized Foundations serve their niche exceptionally well but limit applicability.

## How Foundations Fit in the Platform

Foundations sit at a specific layer in the Uniweb architecture. Understanding this context helps clarify what you control and what's handled elsewhere.

### The Layers Below

The Uniweb Engine provides the runtime infrastructure—data fetching, caching, localization, form handling, state management, and more. Your Foundation components don't interact with the engine directly. Instead, you use the **Common Components library**, which provides React components that wrap engine functionality.

For example, the `<Form>` component handles form submission, security, file uploads, and errors by internally using the engine. You just import and use it like any React component. The same pattern applies to images, videos, and other common needs.

For details on the engine architecture and available Common Components, see the **Uniweb Engine Documentation** and **Uniweb Framework Documentation**.

### Updates and Deployment

When you update your Foundation, sites using it receive the update on their next page load. No rebuilds or redeployments of individual sites are needed. This is possible because Foundations are dynamically loaded at runtime rather than bundled with sites.

Sites can control their update strategy through configuration—accepting all updates immediately, only patch versions, only minor versions, or pinning to specific versions. This lets you deploy improvements while sites maintain their chosen stability level.

### Your Development Focus

As a Foundation creator, you work at the component design layer. You decide what sections to provide, how configurable they should be, how they compose, and what they render. The layers below handle the infrastructure concerns, and the layer above (the Uniweb App) provides the interface where content teams use your work.

## Next Steps

This guide provides the mental model for thinking about Foundations. You now understand:

- Foundations as capability boundaries that define what content teams can accomplish
- The content/code separation and what the engine handles vs. what components decide
- The component interface contract and how components choose what to use
- How composition and dynamic data work conceptually
- Design philosophy considerations and the tradeoffs involved
- How Foundations fit within the larger platform architecture

The actual implementation—code structure, build configuration, testing strategies, component development patterns, and deployment processes—is covered in the **Technical Foundation Guide**.

For understanding the engine and framework architecture that powers Foundations, see the **Uniweb Engine Documentation** and **Uniweb Framework Documentation**.

## Conclusion

Building a Foundation is product design work wrapped in component development. You're not just creating UI elements—you're defining what's possible for every site that uses your work.

The constraints are the architecture: standard props, preprocessed content, capability boundaries. The freedom is in the design: which capabilities to expose, how much flexibility to provide, how to balance consistency and adaptability.

The Foundation you build becomes the creative sandbox for content teams. Make it powerful enough to enable their vision, structured enough to maintain quality, and thoughtful enough to guide good decisions.

---

_This guide complements the Uniweb Engine and Framework documentation. Together, they provide the complete picture of how Uniweb enables building and maintaining multiple websites with shared technology and independent features._
