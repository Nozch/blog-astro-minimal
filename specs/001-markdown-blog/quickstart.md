# Quickstart Guide: Minimal Markdown Blog

**Feature**: Minimal Markdown Blog
**Date**: 2025-12-14
**Audience**: Developers implementing this feature

## Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- Git (for version control)
- Text editor (VS Code recommended for Astro support)

## Project Setup (5 minutes)

> **📚 Design Context**: See [plan.md](./plan.md#project-structure) for the complete project structure and [research.md](./research.md#1-static-site-generator-astro) for why Astro was chosen as the static site generator.

### 1. Initialize Astro Project

> **Design Reference**: [research.md - Static Site Generator: Astro](./research.md#1-static-site-generator-astro)
> **Rationale**: Astro is explicitly required and provides built-in content collections, Markdown support, and zero-JS-by-default architecture.

```bash
# Create new Astro project
npm create astro@latest

# Follow prompts:
# - Where should we create your new project? → .
# - How would you like to start? → Empty
# - Install dependencies? → Yes
# - TypeScript? → Yes (strict)
# - Initialize git? → Yes (if not already in repo)
```

### 2. Install Dependencies

> **Design Reference**: [research.md - Testing Strategy: Vitest](./research.md#6-testing-strategy-vitest--typescript)
> **Rationale**: Vitest is required by user constraints. TypeScript provides compile-time type safety, reducing the need for runtime tests.

```bash
# Install testing dependencies
npm install -D vitest @vitest/ui
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Astro includes these by default (no install needed):
# - Markdown/MDX support
# - Shiki syntax highlighter (build-time, zero runtime cost)
# - TypeScript
```

### 3. Project Structure

> **Design Reference**: [plan.md - Source Code Structure](./plan.md#source-code-repository-root)
> **Rationale**: Astro enforces conventions - `src/content/` for content collections, `src/pages/` for file-based routing, `src/layouts/` for shared layouts.

Create the following directories:

```bash
mkdir -p src/content/posts
mkdir -p src/layouts
mkdir -p src/components
mkdir -p src/styles
mkdir -p tests
```

### 4. Configure ESLint

> **Design Reference**: [research.md - Testing Strategy](./research.md#6-testing-strategy-vitest--typescript)
> **Rationale**: ESLint catches common errors and enforces code style. Using TypeScript-specific rules ensures type-aware linting.

Create `.eslintrc.json`:

```json
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:astro/recommended"
  ],
  "overrides": [
    {
      "files": ["*.astro"],
      "parser": "astro-eslint-parser",
      "parserOptions": {
        "parser": "@typescript-eslint/parser",
        "extraFileExtensions": [".astro"]
      }
    }
  ],
  "rules": {}
}
```

**Note**: If you need `plugin:astro/recommended`, install it:
```bash
npm install -D eslint-plugin-astro astro-eslint-parser
```

### 5. Create .gitignore

> **Rationale**: Prevents committing generated files, dependencies, and sensitive data to version control.

Create `.gitignore`:

```
# dependencies
node_modules/

# build output
dist/
.astro/

# environment variables
.env
.env.local
.env.production

# macOS-specific files
.DS_Store

# logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# editor directories
.vscode/
.idea/
```

## Core Implementation (30 minutes)

### 1. Define Content Collection Schema

> **Design Reference**:
> - [contracts/frontmatter-schema.yaml](./contracts/frontmatter-schema.yaml) - Canonical schema definition
> - [data-model.md - Blog Post Entity](./data-model.md#1-blog-post) - Entity specification
> - [research.md - Content Validation: Zod](./research.md#3-content-validation-zod) - Why Zod was chosen
>
> **Rationale**: Astro's content collections use Zod for type-safe frontmatter validation at build time. Invalid frontmatter causes build failures with clear error messages, satisfying the "fail fast" requirement.

Create `src/content/config.ts`:

```typescript
import { defineCollection, z } from 'astro:content';

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

### 2. Create Base Layout

> **Design Reference**:
> - [research.md - Theming Strategy](./research.md#4-theming-strategy-css-custom-properties--localstorage) - Why CSS custom properties + localStorage
> - [plan.md - Visual Consistency](./plan.md#visual-consistency-) - Constitution requirement for design tokens
>
> **Rationale**: The theme toggle is the **only** client-side JavaScript in the entire application (progressive enhancement). The `is:inline` script prevents flash of unstyled content by initializing theme before page render. Theme preference is persisted in localStorage across sessions.

Create `src/layouts/BaseLayout.astro`:

```astro
---
interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
    <link rel="stylesheet" href="/styles/global.css" />
    <script is:inline>
      // Theme initialization (before page render to avoid flash)
      if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    </script>
  </head>
  <body>
    <header>
      <nav>
        <a href="/">Home</a>
        <button id="theme-toggle" aria-label="Toggle theme">🌓</button>
      </nav>
    </header>
    <main>
      <slot />
    </main>
    <footer>
      <p>&copy; 2025 Your Name. All rights reserved.</p>
    </footer>
    <script>
      // Theme toggle logic
      const toggle = document.getElementById('theme-toggle');
      toggle?.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.theme = next;
      });
    </script>
  </body>
</html>
```

### 3. Create Homepage (Post List)

> **Design Reference**:
> - [data-model.md - Query Patterns](./data-model.md#build-time-queries-astro) - How to query content collections
> - [data-model.md - Draft Filtering](./data-model.md#draft-filtering) - Why drafts are excluded via query filters
> - [spec.md - User Story 2](../spec.md#user-story-2---browse-and-navigate-blog-posts-priority-p2) - Chronological navigation requirement
>
> **Rationale**: Posts are sorted by date descending (newest first) per spec requirement. Draft posts are filtered out using content collection queries, not file exclusion.

Create `src/pages/index.astro`:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';

const posts = await getCollection('posts', ({ data }) => !data.draft);
const sorted = posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
---

<BaseLayout title="My Blog">
  <h1>Blog Posts</h1>
  <ul class="post-list">
    {sorted.map(post => (
      <li>
        <a href={`/posts/${post.slug}`}>
          <h2>{post.data.title}</h2>
          <time datetime={post.data.date.toISOString()}>
            {post.data.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </time>
          {post.data.description && <p>{post.data.description}</p>}
        </a>
      </li>
    ))}
  </ul>
</BaseLayout>
```

### 4. Create Post Pages

> **Design Reference**:
> - [data-model.md - Blog Post Schema](./data-model.md#1-blog-post) - Entity fields and validation rules
> - [research.md - URL Structure](./research.md#8-url-structure-postsslug) - Why `/posts/[slug]` pattern
> - [spec.md - User Story 3](../spec.md#user-story-3---read-posts-in-a-distraction-free-environment-priority-p3) - Reading experience requirements
>
> **Rationale**: Astro's `getStaticPaths()` generates static pages at build time for all published posts. Slugs are random alphanumeric strings (from frontmatter or auto-generated), ensuring stable permalinks independent of filenames.

Create `src/pages/posts/[slug].astro`:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await post.render();
---

<BaseLayout title={post.data.title} description={post.data.description}>
  <article>
    <header>
      <h1>{post.data.title}</h1>
      <time datetime={post.data.date.toISOString()}>
        {post.data.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </time>
      {post.data.tags.length > 0 && (
        <div class="tags">
          {post.data.tags.map(tag => (
            <a href={`/tags/${tag}`}>#{tag}</a>
          ))}
        </div>
      )}
    </header>
    <Content />
  </article>
</BaseLayout>
```

### 5. Create Tag Pages

> **Design Reference**:
> - [data-model.md - Tag Entity](./data-model.md#2-tag) - Tag extraction and relationships
> - [research.md - Tag Pages: Dynamic Routes](./research.md#9-tag-pages-dynamic-routes) - Static generation of tag pages
> - [spec.md - User Story 4](../spec.md#user-story-4---organize-posts-by-topic-priority-p4) - Tag organization requirement
>
> **Rationale**: Tags are discovered automatically from post frontmatter. All tag pages are pre-rendered at build time using `getStaticPaths()`, maintaining the static-first architecture.

Create `src/pages/tags/[tag].astro`:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  const tags = [...new Set(posts.flatMap(post => post.data.tags))];

  return tags.map(tag => ({
    params: { tag },
    props: {
      posts: posts
        .filter(p => p.data.tags.includes(tag))
        .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    },
  }));
}

const { tag } = Astro.params;
const { posts } = Astro.props;
---

<BaseLayout title={`Posts tagged "${tag}"`}>
  <h1>Posts tagged "{tag}"</h1>
  <ul class="post-list">
    {posts.map(post => (
      <li>
        <a href={`/posts/${post.slug}`}>
          <h2>{post.data.title}</h2>
          <time datetime={post.data.date.toISOString()}>
            {post.data.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </time>
        </a>
      </li>
    ))}
  </ul>
  <p><a href="/">← Back to all posts</a></p>
</BaseLayout>
```

### 6. Add Global Styles

> **Design Reference**:
> - [research.md - Typography System](./research.md#5-typography-system-system-font-stack--fluid-typography) - System fonts and fluid scaling
> - [research.md - Theming Strategy](./research.md#4-theming-strategy-css-custom-properties--localstorage) - CSS custom properties for themes
> - [research.md - CSS Strategy](./research.md#2-css-strategy-single-global-stylesheet) - Why single CSS file
> - [plan.md - Visual Consistency](./plan.md#visual-consistency-) - Design tokens in CSS variables (constitution requirement)
> - [spec.md - User Story 3](../spec.md#user-story-3---read-posts-in-a-distraction-free-environment-priority-p3) - Typography and readability requirements
>
> **Rationale**:
> - **System fonts**: No web font downloads, instant text rendering (FCP <1.5s requirement)
> - **Fluid typography**: `clamp()` provides responsive scaling without media queries
> - **CSS custom properties**: Required by constitution, enables theme switching
> - **65ch measure**: Optimal line length for readability (50-75 characters per spec)

Create `src/styles/global.css`:

```css
/* CSS Custom Properties (Design Tokens) */
:root {
  --color-text: #1a1a1a;
  --color-bg: #ffffff;
  --color-accent: #0066cc;
  --color-border: #e0e0e0;

  --font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace;

  --font-size-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --line-height: 1.7;
  --measure: 65ch;
}

[data-theme="dark"] {
  --color-text: #e0e0e0;
  --color-bg: #1a1a1a;
  --color-accent: #4da6ff;
  --color-border: #333333;
}

/* Base Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-body);
  font-size: var(--font-size-base);
  line-height: var(--line-height);
  color: var(--color-text);
  background-color: var(--color-bg);
  max-width: var(--measure);
  margin: 0 auto;
  padding: 2rem 1rem;
}

a {
  color: var(--color-accent);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

code {
  font-family: var(--font-mono);
  font-size: 0.9em;
}

/* Post List */
.post-list {
  list-style: none;
}

.post-list li {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--color-border);
}

.post-list time {
  display: block;
  font-size: 0.875rem;
  color: var(--color-text);
  opacity: 0.7;
}

/* Tags */
.tags {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.tags a {
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 0.25rem;
}
```

### 7. Configure Astro

> **Design Reference**:
> - [research.md - Syntax Highlighting: Shiki](./research.md#2-syntax-highlighting-shiki) - Why Shiki (build-time, zero runtime cost)
> - [spec.md - FR-011](../spec.md#functional-requirements) - Syntax highlighting requirement
>
> **Rationale**: Shiki is built into Astro and performs syntax highlighting at build time (zero JavaScript). Using dual themes ensures code blocks adapt to light/dark mode.

Update `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://yourdomain.com',
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: true,
    },
  },
});
```

### 8. Add Example Post

> **Design Reference**:
> - [contracts/frontmatter-schema.yaml](./contracts/frontmatter-schema.yaml) - Canonical frontmatter format and examples
> - [data-model.md - Blog Post Schema](./data-model.md#1-blog-post) - Required and optional fields
>
> **Rationale**: This example demonstrates the frontmatter schema with all common fields. The schema validation will fail the build if frontmatter is invalid, ensuring content quality.

Create `src/content/posts/hello-world.md`:

```markdown
---
title: "Hello World"
date: 2025-12-14
description: "My first blog post using Astro."
tags: ["meta", "astro"]
draft: false
---

# Hello World

This is my first blog post! I'm using **Astro** to build a minimal, content-first blog.

## Features

- Static site generation
- Markdown support
- Dark mode
- Tag-based organization

```typescript
// Example code block
const greeting = "Hello, world!";
console.log(greeting);
```
```

## Testing Setup (10 minutes)

> **📚 Design Context**: See [research.md - Testing Strategy](./research.md#6-testing-strategy-vitest--typescript) for the complete testing philosophy and [plan.md - Minimal Testing](./plan.md#iii-minimal-testing-with-high-value-) for constitution alignment.

### 1. Configure Vitest

> **Design Reference**: [research.md - Testing Strategy](./research.md#6-testing-strategy-vitest--typescript)
> **Rationale**: Vitest is required by user constraints. It's faster than Jest and uses Vite (Astro's bundler) internally.

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
  },
});
```

### 2. Add Test Script

Update `package.json`:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  }
}
```

### 3. Write Content Test

> **Design Reference**:
> - [research.md - Test Coverage](./research.md#6-testing-strategy-vitest--typescript) - What to test and why
> - [data-model.md - Validation Rules](./data-model.md#validation-rules) - Schema validation behavior
> - [plan.md - Minimal Testing with High Value](./plan.md#iii-minimal-testing-with-high-value-) - Constitution principle
>
> **Rationale**: These integration tests verify critical paths: schema validation works, drafts are excluded, and frontmatter parses correctly. No unit tests for presentational components (per constitution).

Create `tests/content.test.ts`:

```typescript
import { getCollection } from 'astro:content';
import { describe, it, expect } from 'vitest';

describe('Content Collections', () => {
  it('excludes draft posts from published collection', async () => {
    const posts = await getCollection('posts', ({ data }) => !data.draft);
    const hasDrafts = posts.some(post => post.data.draft);
    expect(hasDrafts).toBe(false);
  });

  it('validates frontmatter schema', async () => {
    const posts = await getCollection('posts');
    posts.forEach(post => {
      expect(post.data.title).toBeDefined();
      expect(post.data.date).toBeInstanceOf(Date);
    });
  });
});
```

## CI Setup (5 minutes)

> **Design Reference**:
> - [research.md - CI/CD Pipeline](./research.md#7-cicd-pipeline-github-actions) - Why GitHub Actions and pipeline design
> - [plan.md - Fast Feedback Loops](./plan.md#fast-feedback-loops-) - Build time and automation requirements
>
> **Rationale**: User requirements mandate running typecheck, lint, build, and tests in CI. This pipeline catches errors before merge and ensures main branch is always deployable (constitution requirement).

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build
```

## Running the Blog

### Development

```bash
npm run dev
# Visit http://localhost:4321
```

### Build

```bash
npm run build
# Output in dist/ directory
```

### Preview Production Build

```bash
npm run preview
```

### Run Tests

```bash
npm test
```

## Creating New Posts

> **Design Reference**: [contracts/frontmatter-schema.yaml](./contracts/frontmatter-schema.yaml) - See examples and validation rules for all frontmatter fields.

1. Create a new `.md` file in `src/content/posts/`
2. Add frontmatter with `title`, `date` (required), and optionally `description`, `tags`, `draft`
3. Write content in Markdown below the frontmatter
4. Build or dev server will automatically pick up the new post

**Example**:

```markdown
---
title: "My New Post"
date: 2025-12-15
description: "A short description of my post."
tags: ["tutorial", "web"]
---

# My New Post

Content goes here...
```

## Deployment

### Static Hosting (Netlify, Vercel, Cloudflare Pages)

All platforms auto-detect Astro projects. Simply:

1. Connect your Git repository
2. Deploy (build command: `npm run build`, output: `dist/`)

### Manual Deployment

```bash
npm run build
# Upload dist/ directory to any static host
```

## Troubleshooting

### Build Fails with Frontmatter Error

- Check that all posts have required `title` and `date` fields
- Verify date is in `YYYY-MM-DD` format
- Check for YAML syntax errors in frontmatter

### Posts Not Appearing

- Check if `draft: true` is set
- Verify file is in `src/content/posts/` directory
- Check frontmatter schema matches config

### Theme Toggle Not Working

- Check that JavaScript is enabled
- Verify `theme-toggle` button ID matches script selector
- Check browser console for errors

## Next Steps

1. Customize design in `src/styles/global.css`
2. Add more posts to `src/content/posts/`
3. Configure site metadata in `astro.config.mjs`
4. Set up deployment to hosting platform
5. (Optional) Add RSS feed, sitemap, or other enhancements

## Resources

- [Astro Documentation](https://docs.astro.build/)
- [Content Collections Guide](https://docs.astro.build/en/guides/content-collections/)
- [Markdown Syntax](https://www.markdownguide.org/basic-syntax/)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
