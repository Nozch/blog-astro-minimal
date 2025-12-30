# Research & Technical Decisions

**Feature**: Minimal Markdown Blog
**Date**: 2025-12-14
**Status**: Complete

## Overview

This document captures research findings and technical decisions for implementing a minimal, content-first blog using Astro's static site generation capabilities.

## Technology Stack Decisions

### 1. Static Site Generator: Astro

**Decision**: Use Astro v4+ as the primary framework

**Rationale**:

- **Explicitly required**: User input specifies "Astro is required as the static site generator"
- **Content Collections**: Astro's built-in content collections provide type-safe frontmatter validation with Zod schemas
- **Islands Architecture**: Enables minimal client JavaScript (only theme toggle needs JS)
- **Markdown-first**: Native support for `.md` files without additional configuration (advanced MDX components excluded from MVP scope)
- **Performance**: Ships zero JavaScript by default, aligns with constitution's static-first principle
- **Build-time rendering**: All pages generated at build time, no server runtime required

**Alternatives Considered**: N/A (Astro is a hard requirement)

**Implementation Notes**:

- Use `defineCollection()` in `src/content/config.ts` to validate frontmatter schema
- Content collections automatically handle slug generation and querying
- Built-in Markdown parser supports standard syntax out of the box

### 2. Syntax Highlighting: Shiki

**Decision**: Use Shiki (Astro's default syntax highlighter)

**Rationale**:

- **Zero runtime cost**: Highlighting happens at build time, no client JavaScript
- **Built into Astro**: No additional dependencies or configuration
- **TextMate grammars**: Same syntax highlighting as VS Code, high quality
- **Theme support**: Ships with multiple themes, supports light/dark mode switching
- **Performance**: Static HTML output means no hydration or runtime overhead

**Alternatives Considered**:

- **Prism.js**: Requires client-side JavaScript or additional build setup. Rejected because Shiki is built-in and zero-runtime.
- **Highlight.js**: Similar concerns to Prism. Shiki's build-time approach is superior for static sites.

**Implementation Notes**:

- Configure in `astro.config.mjs` under `markdown.shikiConfig`
- Use dual themes for light/dark mode (e.g., `github-light` and `github-dark`)
- Code blocks use `<pre>` and `<code>` with inline styles (no runtime theme switching)

### 3. Content Validation: Zod

**Decision**: Use Zod for frontmatter schema validation (via Astro Content Collections)

**Rationale**:

- **Built into Astro**: Content collections use Zod by default
- **Type safety**: TypeScript types auto-generated from Zod schemas
- **Build-time validation**: Invalid frontmatter fails the build with clear error messages (satisfies "fail fast" requirement)
- **Rich validation**: Supports complex validation rules (date formats, enums, optional fields, defaults)

**Alternatives Considered**: N/A (Zod is Astro's standard for content collections)

**Implementation Notes**:

```typescript
// src/content/config.ts
import { defineCollection, z } from "astro:content";

const posts = defineCollection({
	schema: z.object({
		title: z.string(),
		date: z.date(),
		description: z.string().optional(),
		tags: z.array(z.string()).default([]),
		draft: z.boolean().default(false),
	}),
});

export const collections = { posts };
```

### 4. Theming Strategy: CSS Custom Properties + localStorage

**Decision**: Use CSS custom properties (CSS variables) for theming with client-side localStorage persistence

**Rationale**:

- **Constitution requirement**: "Design tokens MUST be defined in CSS custom properties"
- **No runtime cost (mostly)**: Theme values are CSS variables, no JavaScript for rendering
- **Progressive enhancement**: Site works without JavaScript, theme toggle requires JS
- **Simple implementation**: Toggle adds/removes `data-theme="dark"` attribute on `<html>`
- **User preference**: localStorage persists choice across sessions (FR-008)

**Alternatives Considered**:

- **Tailwind dark mode classes**: Adds unnecessary build complexity and larger CSS bundle. CSS custom properties are simpler and more maintainable.
- **Server-side theme detection**: Requires cookies or SSR, violates static-first constraint.

**Implementation Notes**:

```css
/* global.css */
:root {
	--color-text: #1a1a1a;
	--color-bg: #ffffff;
	--color-accent: #0066cc;
}

[data-theme="dark"] {
	--color-text: #e0e0e0;
	--color-bg: #1a1a1a;
	--color-accent: #4da6ff;
}
```

```javascript
// ThemeToggle inline script (minimal JS)
if (
	localStorage.theme === "dark" ||
	(!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
) {
	document.documentElement.setAttribute("data-theme", "dark");
}
```

### 5. Typography System: System Font Stack + Fluid Typography

**Decision**: Use system font stack with fluid typography (clamp-based)

**Rationale**:

- **Performance**: No font downloads, instant text rendering (FCP <1.5s requirement)
- **Readability**: System fonts are optimized for screen reading
- **Accessibility**: Users already familiar with system fonts
- **Responsive**: `clamp()` provides fluid scaling across breakpoints without media queries

**Alternatives Considered**:

- **Web fonts (Google Fonts, etc.)**: Adds network request and render-blocking time. Rejected for performance reasons.
- **Variable fonts**: Still requires download. System fonts are faster.

**Implementation Notes**:

```css
:root {
	--font-body:
		-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
	--font-mono: "SF Mono", Monaco, "Cascadia Code", "Consolas", monospace;
	--font-size-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem); /* 16-18px */
	--line-height: 1.7;
	--measure: 65ch; /* optimal line length */
}
```

### 6. Testing Strategy: Vitest + TypeScript

**Decision**: Use Vitest for integration tests, TypeScript for type safety, no E2E tests for MVP

**Rationale**:

- **User requirement**: "Use Vitest for automated tests"
- **Constitution alignment**: "Minimal testing with high value" - focus on integration tests, skip unit tests for presentational components
- **Fast**: Vitest is faster than Jest, uses Vite for bundling (Astro uses Vite internally)
- **TypeScript**: Catches many errors at compile time, reducing need for runtime tests
- **No E2E for MVP**: Playwright/Cypress add complexity. Integration tests (build output verification) catch critical issues.

**Test Coverage**:

1. **Content validation**: Verify frontmatter schema catches invalid posts
2. **Build output**: Verify static HTML is generated for published posts
3. **Draft filtering**: Verify draft posts excluded from build
4. **Slug generation**: Verify deterministic slug generation

**Alternatives Considered**:

- **Jest**: Slower than Vitest, requires more configuration with ESM modules
- **Playwright E2E**: Overkill for MVP. Integration tests sufficient for static site.

**Implementation Notes**:

```typescript
// tests/content.test.ts
import { getCollection } from "astro:content";
import { describe, it, expect } from "vitest";

describe("Content Collections", () => {
	it("excludes draft posts from published collection", async () => {
		const posts = await getCollection("posts", ({ data }) => !data.draft);
		const hasDrafts = posts.some((post) => post.data.draft);
		expect(hasDrafts).toBe(false);
	});
});
```

### 7. CI/CD Pipeline: GitHub Actions

**Decision**: Use GitHub Actions for CI (typecheck, lint, build, test)

**Rationale**:

- **User requirement**: "At minimum, run typecheck, lint, build, and Vitest in CI"
- **Free for public repos**: No cost for open-source blogs
- **Simple setup**: YAML configuration, native GitHub integration
- **Caching**: Built-in caching for `node_modules` speeds up builds

**Pipeline Steps**:

1. Install dependencies (`npm ci`)
2. Type check (`tsc --noEmit`)
3. Lint (`eslint .`)
4. Run tests (`vitest run`)
5. Build site (`astro build`)

**Alternatives Considered**:

- **CircleCI/Travis**: No advantage over GitHub Actions for static sites
- **Netlify/Vercel CI**: Deployment platforms handle deployment, but GitHub Actions provides more control for CI checks

**Implementation Notes**:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

### 8. URL Structure: `/posts/[slug]`

**Decision**: Use `/posts/[slug]` pattern for blog post URLs

**Rationale**:

- **Simplicity**: Flat URL structure, no date-based paths (reduces complexity)
- **Durability**: Slug-based URLs are stable even if post dates change
- **Predictability**: Matches spec requirement (FR-004) for predictable URL structure
- **SEO**: Descriptive slugs better for search engines than numeric IDs or date paths

**Alternatives Considered**:

- **`/[year]/[month]/[slug]`**: More complex, harder to maintain, no SEO benefit for low-volume blog
- **`/[slug]` (root level)**: Conflicts with other potential pages (about, contact, etc.)

**Implementation Notes**:

- Slugs are random alphanumeric strings (8-12 chars), specified in frontmatter or auto-generated
- NOT derived from filenames (filenames can be Japanese/English/mixed)

### 9. Tag Pages: Dynamic Routes

**Decision**: Use Astro's `getStaticPaths()` to generate tag pages dynamically

**Rationale**:

- **Static generation**: All tag pages pre-rendered at build time
- **No configuration**: Tags discovered automatically from post frontmatter
- **Scalable**: Works for any number of tags without manual route creation

**Implementation Notes**:

```typescript
// src/pages/tags/[tag].astro
export async function getStaticPaths() {
	const posts = await getCollection("posts", ({ data }) => !data.draft);
	const tags = [...new Set(posts.flatMap((post) => post.data.tags))];

	return tags.map((tag) => ({
		params: { tag },
		props: { posts: posts.filter((p) => p.data.tags.includes(tag)) },
	}));
}
```

## Performance Optimizations

### 1. Image Handling (Deferred to Post-MVP)

**Decision**: No automatic image optimization for MVP

**Rationale**:

- **Spec exclusion**: "Image optimization or responsive image generation (assume images are optimized before adding to content)"
- **Simplicity**: Users manually optimize images before adding to posts
- **Future enhancement**: Can add Astro's `<Image>` component later without breaking existing posts

### 2. CSS Strategy: Single Global Stylesheet

**Decision**: Single `global.css` file with CSS custom properties, no CSS modules or scoped styles for MVP

**Rationale**:

- **Simplicity**: Minimal component set (5-6 components) doesn't benefit from CSS modules
- **Performance**: Single CSS file, no CSS-in-JS overhead
- **Constitution**: "Avoid premature abstraction" - CSS modules can be added later if needed

**Alternatives Considered**:

- **Tailwind CSS**: Adds build complexity, larger initial bundle. Custom CSS simpler for minimal design.
- **CSS Modules**: Unnecessary for small component set, adds complexity.

### 3. Build Performance: Incremental Builds

**Decision**: Rely on Astro's incremental builds (future Astro feature) and Vite's caching

**Rationale**:

- **Spec requirement**: SC-008 requires <5s build time increase per post
- **Current state**: Astro rebuilds all pages on changes, but Vite caches dependencies
- **Future-proof**: Astro's roadmap includes incremental builds, no action needed now

## Security Considerations

### 1. XSS Protection

**Decision**: Rely on Astro's auto-escaping in templates

**Rationale**:

- **Default safety**: Astro escapes all dynamic content by default
- **Markdown sanitization**: Astro's Markdown parser sanitizes HTML by default
- **No user input**: Blog has no forms or user-generated content (only author-written Markdown)

### 2. Dependency Management

**Decision**: Use `npm audit` in CI and Dependabot for automated updates

**Rationale**:

- **Automated checks**: CI fails on high-severity vulnerabilities
- **Zero-effort updates**: Dependabot creates PRs for dependency updates
- **Static site**: Limited attack surface (no server runtime, no database)

## Open Questions (Resolved)

All technical unknowns have been resolved. No outstanding clarifications needed.

## References

- [Astro Documentation](https://docs.astro.build/)
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [Shiki Syntax Highlighter](https://shiki.style/)
- [Vitest Documentation](https://vitest.dev/)
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [CSS Custom Properties MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
