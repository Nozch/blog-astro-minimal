# Data Model

**Feature**: Minimal Markdown Blog
**Date**: 2025-12-14
**Status**: Complete

## Overview

This blog uses a file-based data model where Markdown files with YAML frontmatter serve as the primary data storage. Astro's Content Collections API provides type-safe access to this data at build time.

## Entities

### 1. Blog Post

**Description**: Represents a single piece of written content.

**Storage**: Filesystem (`.md` files in `src/content/posts/`)

**Schema**:

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `title` | string | Yes | - | Non-empty string | Post title displayed in headings and metadata |
| `date` | Date | Yes | - | Valid ISO date | Publication date (YYYY-MM-DD format in frontmatter) |
| `description` | string | No | `undefined` | - | Short summary for post list previews (1-2 sentences) |
| `tags` | string[] | No | `[]` | Array of non-empty strings (empty array allowed) | Topic tags for categorization |
| `draft` | boolean | No | `false` | - | If `true`, post excluded from build output |
| `slug` | string | No | Auto-generated | Alphanumeric string (8-12 chars), no Japanese | URL slug (random string if omitted, NOT from filename) |

**Derived Fields** (computed at build time):

| Field | Type | Description |
|-------|------|-------------|
| `slug` | string | Random alphanumeric string (8-12 chars) from frontmatter, or auto-generated if omitted. NOT from filename. |
| `body` | string | Rendered Markdown content as HTML |
| `readingTime` | number | Estimated reading time in minutes (optional, can be added later) |

**Example Markdown File**:

```markdown
---
title: "Getting Started with Astro"
date: 2025-12-14
description: "A guide to building static sites with Astro's content-first approach."
tags: ["astro", "web-development", "tutorial"]
draft: false
slug: "a8k3n9x2"
---

# Getting Started with Astro

This is the post content written in Markdown...
```

**Relationships**:
- **Has many** tags (many-to-many via `tags` array)
- **Belongs to** zero or more tag collections

**Validation Rules** (enforced by Zod schema):
1. `title` must be a non-empty string
2. `date` must be a valid Date object (parsed from YYYY-MM-DD in frontmatter)
3. `description` is optional but must be a string if provided
4. `tags` defaults to empty array (zero tags allowed), each tag must be non-empty string
5. `draft` defaults to `false`
6. `slug` must be unique across all posts; duplicate slugs cause build failure
7. Build fails if frontmatter doesn't match schema

**Query Patterns**:

```typescript
// Get all published posts (excludes drafts)
const posts = await getCollection('posts', ({ data }) => !data.draft);

// Sort by date (newest first)
const sorted = posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

// Filter by tag
const tagged = posts.filter(post => post.data.tags.includes('astro'));

// Get single post by slug
const post = await getEntry('posts', 'getting-started-with-astro');
```

### 2. Tag

**Description**: Represents a topic or category for grouping posts.

**Storage**: Derived from post frontmatter (no separate storage)

**Schema**:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Tag name (e.g., "astro", "web-development") |
| `slug` | string | URL-safe slug (same as `name` for simplicity) |
| `count` | number | Number of published posts with this tag (derived) |

**Derived Data**:
- Tags are extracted from all published posts at build time
- Tag pages are generated dynamically using `getStaticPaths()`

**Example Tag Extraction**:

```typescript
// Extract unique tags from all posts
const posts = await getCollection('posts', ({ data }) => !data.draft);
const tags = [...new Set(posts.flatMap(post => post.data.tags))];

// Tags with post counts
const tagCounts = tags.map(tag => ({
  name: tag,
  slug: tag,
  count: posts.filter(p => p.data.tags.includes(tag)).length,
}));
```

**Relationships**:
- **Has many** blog posts (many-to-many via post `tags` array)

### 3. Site Metadata

**Description**: Global site configuration (title, author, etc.).

**Storage**: Astro configuration file (`astro.config.mjs`) and/or separate config file

**Schema**:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `title` | string | Yes | - | Site title (e.g., "My Blog") |
| `description` | string | No | - | Site description for meta tags |
| `author` | string | Yes | - | Author name |
| `url` | string | Yes | - | Base URL (e.g., "https://example.com") |
| `postsPerPage` | number | No | `10` | Number of posts per page (if pagination added later) |

**Example Configuration**:

```javascript
// astro.config.mjs
export default {
  site: 'https://example.com',
  // ... other Astro config
};
```

```typescript
// src/config.ts (site metadata)
export const siteConfig = {
  title: 'My Blog',
  description: 'Thoughts on web development and design',
  author: 'Author Name',
  postsPerPage: 10,
};
```

## State Transitions

### Post Lifecycle

```
[Created] → [Draft] → [Published] → [Updated] → [Archived/Deleted]
   ↓          ↓           ↓
   └──────────┴───────────┴─── (Build excludes drafts)
```

**States**:
1. **Created**: New `.md` file added to `src/content/posts/`
2. **Draft**: `draft: true` in frontmatter → excluded from build
3. **Published**: `draft: false` (or omitted) → included in build
4. **Updated**: File modified, `date` unchanged → re-rendered on next build
5. **Archived/Deleted**: File removed or moved out of `src/content/posts/` → removed from build

**Validation at Each Stage**:
- **Creation**: Frontmatter must match Zod schema or build fails
- **Publication**: `draft: false` (implicit or explicit) to appear in build
- **Update**: Re-validation on every build (catches schema changes)

## Data Access Patterns

### Build-Time Queries (Astro)

```typescript
import { getCollection, getEntry } from 'astro:content';

// 1. Get all published posts (most common)
const posts = await getCollection('posts', ({ data }) => !data.draft);

// 2. Get posts sorted by date (newest first)
const sorted = posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

// 3. Get single post by slug
const post = await getEntry('posts', 'my-post-slug');

// 4. Get posts by tag
const taggedPosts = posts.filter(post => post.data.tags.includes('astro'));

// 5. Get unique tags
const tags = [...new Set(posts.flatMap(post => post.data.tags))];
```

### Type Safety

Astro auto-generates TypeScript types from Zod schemas:

```typescript
import type { CollectionEntry } from 'astro:content';

type Post = CollectionEntry<'posts'>;

// Type-safe access to frontmatter
const post: Post = await getEntry('posts', 'example');
console.log(post.data.title);    // ✅ Type: string
console.log(post.data.date);     // ✅ Type: Date
console.log(post.data.tags);     // ✅ Type: string[]
console.log(post.data.unknown);  // ❌ TypeScript error
```

## Data Integrity

### Validation Rules

1. **Frontmatter Schema Validation**:
   - Enforced by Zod at build time
   - Invalid frontmatter causes build failure with clear error message
   - Example: Missing `title` → "Error: [posts/my-post.md] title is required"

2. **Date Format Validation**:
   - Dates must be valid ISO 8601 format (YYYY-MM-DD)
   - Astro parses and validates dates automatically
   - Invalid dates cause build failure

3. **Slug Uniqueness**:
   - Astro enforces unique slugs per collection
   - Duplicate slugs (same filename or `slug` field) cause build error

4. **Draft Filtering**:
   - `draft: true` posts never appear in production build
   - Enforced by query filters, not file exclusion (drafts remain in repo)

### Error Handling

**Build Failures** (fail-fast requirement):
- Invalid frontmatter → Build fails with file path and validation error
- Duplicate slugs → Build fails with conflict details
- Malformed Markdown → Build fails with parse error

**Graceful Degradation**:
- Missing `description` → Post list shows no preview (field is optional)
- Empty `tags` array → Post appears in main list but no tag links shown

## Future Extensibility

### Potential Schema Additions (Post-MVP)

| Field | Type | Purpose |
|-------|------|---------|
| `updated` | Date | Last modified date (for "Updated on" notices) |
| `featured` | boolean | Highlight post on homepage |
| `image` | string | Hero image URL for post |
| `series` | string | Group posts into series (e.g., "React Tutorial") |
| `canonical` | string | Canonical URL for cross-posted content |

**Migration Strategy**:
- All new fields must be optional (default values)
- Existing posts work without modification
- Zod schema versioning (if needed for breaking changes)

## Performance Considerations

### Build-Time Performance

- **Query optimization**: Use collection filters to avoid loading draft posts
- **Sorting**: Sort arrays in-memory (no database indices needed)
- **Tag extraction**: Single pass over posts array (O(n) complexity)

### Runtime Performance

- **No runtime queries**: All data resolved at build time
- **Static HTML**: Posts rendered to static HTML, no client-side data fetching
- **Tag pages**: Pre-rendered during build (no dynamic routes)

**Expected Scale**:
- 100 posts: <5s build time (per SC-008, SC-009)
- 1000 posts: Still viable with incremental builds (future Astro feature)

## Schema Implementation

See `contracts/frontmatter-schema.yaml` for the canonical schema definition.

TypeScript implementation:

```typescript
// src/content/config.ts
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

This schema enforces all validation rules and provides type safety for content queries.
