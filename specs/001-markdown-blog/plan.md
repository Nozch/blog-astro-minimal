# Implementation Plan: Minimal Markdown Blog

**Branch**: `001-markdown-blog` | **Date**: 2025-12-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-markdown-blog/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a minimal, content-first personal blog using Astro's static site generation to publish Markdown-based writing. The system will render Markdown files with frontmatter metadata into static HTML pages, providing chronological navigation, responsive typography, light/dark theming, and tag-based organization—all optimized for long-term durability and platform independence.

## Technical Context

**Language/Version**: Node.js (latest LTS recommended, minimum Node 18+)
**Primary Dependencies**: Astro (v4+), Markdown parser (built into Astro), Syntax highlighter (Shiki or Prism), CSS (custom properties for theming)
**Storage**: Filesystem-based (Markdown files in `src/content/posts/`)
**Testing**: Vitest for unit/integration tests, TypeScript for type checking, ESLint for linting
**Target Platform**: Static hosting (Netlify, Vercel, GitHub Pages, Cloudflare Pages, or any static file host)
**Project Type**: Single web project (static site generator output)
**Performance Goals**: Lighthouse ≥90, First Contentful Paint <1.5s, Time to Interactive <3.5s on 3G, build time <5 min for 100 posts
**Constraints**: Static-only output (no server runtime), JavaScript minimal (progressive enhancement), build must fail fast on invalid frontmatter
**Scale/Scope**: 100+ blog posts, responsive 320px-4K, <2s load on 3G, <5s per post build time increase

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Static-First Architecture ✅

- **Compliance**: Full. Astro defaults to SSG. Blog content is entirely static HTML/CSS. Theme toggle is the only client JavaScript (progressive enhancement).
- **Justification**: Blog has no personalization or dynamic data requirements. Static generation aligns perfectly with durability and platform independence goals.

### II. Performance as a Guardrail ✅

- **Compliance**: Full. Success criteria (SC-004, SC-008, SC-009) enforce Lighthouse ≥90, <2s load on 3G, <5s build time per post.
- **Justification**: Performance is explicitly required by spec and constitution. Monitoring will be automated in CI.

### III. Minimal Testing with High Value ✅

- **Compliance**: Full. User input requires "project must not have zero tests." Plan includes Vitest for high-value integration tests (Markdown parsing, frontmatter validation, build output verification).
- **Justification**: Tests focus on critical paths: build doesn't break, Markdown renders correctly, drafts excluded. No tests for pure presentational components.

### IV. Content-First Design ✅

- **Compliance**: Full. Spec requires portable Markdown with YAML frontmatter, semantic HTML output, optimized typography, and dark mode from start.
- **Justification**: Content portability (SC-005) and distraction-free reading (US3) are core requirements. Design supports content outlasting implementation.

### V. Developer Velocity Over Perfection ✅

- **Compliance**: Full. MVP scope excludes search, comments, i18n, CMS integration. Plan prioritizes shipping P1-P4 user stories incrementally.
- **Justification**: Spec explicitly excludes non-MVP features. Focus on rapid iteration for single-author blog.

### Build & Deployment Standards

#### Fast Feedback Loops ✅

- **Compliance**: Full. Astro HMR works by default. Build time constraint <5 min (SC-008). User input requires automated builds.
- **Justification**: Spec requires low-friction publishing (SC-001: publish in <5 min). Fast builds enable experimentation.

#### Deployment Discipline ✅

- **Compliance**: Full. Static output enables instant rollbacks (redeploy previous build). CI automation required by user input.
- **Justification**: Solo project needs safety nets. Static deploys are inherently safer than dynamic backends.

### Content & UX Standards

#### Accessibility Baseline ✅

- **Compliance**: Full. SC-007 requires WCAG AA contrast, FR-012 requires 320px-4K responsive design, spec requires semantic HTML (FR-001).
- **Justification**: Accessibility is non-negotiable per constitution and explicitly measured in success criteria.

#### Visual Consistency ✅

- **Compliance**: Full. Theme uses CSS custom properties (constitution requirement). Minimal component set (header, footer, post list, post view).
- **Justification**: Simple design system prevents drift. Constitution requires design tokens in CSS variables.

### **Gate Result**: ✅ PASS - No violations. Proceed to Phase 0.

---

## Post-Design Constitution Re-Evaluation

_Re-evaluated after Phase 1 design (research.md, data-model.md, contracts, quickstart.md)_

### Design Artifacts Review

**Research Decisions** (`research.md`):

- ✅ Shiki syntax highlighter: Build-time only, zero runtime JS (Static-First ✅)
- ✅ Zod validation: Fail-fast on invalid frontmatter (Fast Feedback Loops ✅)
- ✅ CSS custom properties: Constitution requirement met (Visual Consistency ✅)
- ✅ System font stack: No web fonts, instant rendering (Performance ✅)
- ✅ Vitest integration tests: High-value testing only (Minimal Testing ✅)
- ✅ Single global CSS file: No premature abstraction (Developer Velocity ✅)

**Data Model** (`data-model.md`):

- ✅ File-based storage: Portable Markdown files (Content-First ✅)
- ✅ Build-time validation: Zod schema enforces frontmatter rules (Fast Feedback Loops ✅)
- ✅ Static queries: All data resolved at build time (Static-First ✅)

**Contracts** (`contracts/frontmatter-schema.yaml`):

- ✅ Minimal required fields: Only `title` and `date` required (Developer Velocity ✅)
- ✅ Optional extensions documented: Future-proof without over-engineering (Developer Velocity ✅)

**Quickstart** (`quickstart.md`):

- ✅ 50-minute setup time: Fast onboarding (Developer Velocity ✅)
- ✅ CI automation included: typecheck, lint, test, build (Fast Feedback Loops ✅)
- ✅ Semantic HTML throughout: Accessibility baseline met (Accessibility Baseline ✅)

### Final Constitution Compliance: ✅ PASS

**Summary**: All design decisions align with constitutional principles. No violations introduced during planning. Implementation ready to proceed.

**Key Alignments**:

1. **Static-First**: 100% static output, minimal JS (theme toggle only)
2. **Performance**: System fonts, build-time syntax highlighting, CSS custom properties
3. **Testing**: Integration tests for critical paths, no unit tests for presentational components
4. **Content-First**: Portable Markdown, semantic HTML, responsive typography
5. **Velocity**: Simple architecture, no premature abstractions, fast setup

**Exceptions**: None required.

## Project Structure

### Documentation (this feature)

```text
specs/001-markdown-blog/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── frontmatter-schema.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Astro project structure (to be created)
astro-blog/
├── src/
│   ├── content/
│   │   ├── config.ts           # Content collection schema (Astro's built-in validation)
│   │   └── posts/              # Markdown blog posts (user content)
│   │       └── example-post.md
│   ├── layouts/
│   │   └── BaseLayout.astro    # Shared layout (HTML structure, head, theme script)
│   ├── pages/
│   │   ├── index.astro         # Homepage (post list)
│   │   ├── posts/
│   │   │   └── [slug].astro    # Individual post pages
│   │   └── tags/
│   │       └── [tag].astro     # Tag-filtered post lists
│   ├── components/
│   │   ├── Header.astro        # Site header with nav
│   │   ├── Footer.astro        # Site footer
│   │   ├── ThemeToggle.astro   # Light/dark mode toggle (only client JS)
│   │   ├── PostList.astro      # Post list component
│   │   └── PostMeta.astro      # Post metadata display
│   └── styles/
│       └── global.css          # CSS custom properties, typography, base styles
├── public/                     # Static assets (favicon, images)
├── tests/
│   ├── content.test.ts         # Frontmatter validation, Markdown parsing
│   ├── build.test.ts           # Build output verification
│   └── integration/            # Integration tests (if needed)
├── astro.config.mjs            # Astro configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies, scripts
├── vitest.config.ts            # Vitest test configuration
└── .github/
    └── workflows/
        └── ci.yml              # CI: typecheck, lint, build, test
```

**Structure Decision**: Single web project structure. Astro enforces conventions: `src/content/` for content collections (Markdown with schema validation), `src/pages/` for routes (file-based routing), `src/layouts/` for shared layouts, `src/components/` for reusable UI. This aligns with constitution's static-first architecture and Astro's opinionated SSG approach.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

_No violations. Table intentionally left empty._
