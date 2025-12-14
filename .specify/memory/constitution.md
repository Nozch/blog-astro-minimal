# Astro Blog Constitution

<!--
Sync Impact Report:
- Version: 0.0.0 → 1.0.0 (Initial constitution)
- Ratification: 2025-12-13
- Principles Added: 5 core principles + 2 additional sections
- Templates Status:
  ✅ plan-template.md - Constitution Check section will reference these principles
  ✅ spec-template.md - Aligned with UX and testing principles
  ✅ tasks-template.md - Reflects performance and testing discipline
- Follow-up: None - all placeholders resolved
-->

## Core Principles

### I. Static-First Architecture

Astro components MUST use static site generation (SSG) by default. Client-side JavaScript MUST be justified and minimal. Interactive components MUST use Astro islands with explicit `client:*` directives. Server-side rendering (SSR) MAY be used only when dynamic personalization is required.

**Rationale**: Static generation maximizes performance, reduces hosting costs, and ensures reliability. Client JavaScript should be treated as progressive enhancement, not a requirement.

### II. Performance as a Guardrail

Every feature MUST maintain or improve existing performance baselines. Performance regressions MUST be caught before merge. Key metrics: Lighthouse score ≥90, First Contentful Paint <1.5s, Time to Interactive <3.5s on 3G. Bundle size increases >10KB require explicit justification.

**Rationale**: Performance directly impacts reader experience and SEO. For a solo project, automated guardrails prevent gradual degradation without requiring constant manual measurement.

### III. Minimal Testing with High Value

Tests are OPTIONAL unless the feature involves complex logic, data transformations, or API integrations. When tests exist, they MUST be integration or end-to-end tests that verify actual user flows. Unit tests for simple components are discouraged. Smoke tests for build output and critical paths are preferred over comprehensive coverage.

**Rationale**: Solo projects benefit from high-leverage testing that catches real breakage. Testing pure presentational components creates maintenance burden without proportional value.

### IV. Content-First Design

Content MUST be portable: use Markdown or MDX with minimal custom syntax. Content MUST be decoupled from presentation: avoid inline styles or component-specific formatting. Typography, spacing, and readability MUST be optimized for long-form reading. Dark mode support MUST be included from the start.

**Rationale**: Content outlasts implementations. Portable content enables future migrations and repurposing. Reader comfort drives engagement.

### V. Developer Velocity Over Perfection

Ship working features quickly, iterate based on real usage. Avoid premature abstraction: copy-paste is acceptable until patterns emerge organically. Documentation MUST be minimal: prefer self-documenting code and inline comments for non-obvious decisions. Refactoring MUST be driven by actual pain points, not hypothetical needs.

**Rationale**: For a solo blog, time is the scarcest resource. Delivering value to readers trumps architectural purity. Over-engineering kills momentum.

## Build & Deployment Standards

### Fast Feedback Loops

Build time MUST stay under 30 seconds for incremental changes. Full site builds MUST complete in under 5 minutes. Hot module replacement (HMR) MUST work reliably for components and content. Deploy previews MUST be automated for every commit.

**Rationale**: Long build times kill experimentation. Fast feedback enables rapid iteration and reduces context switching costs.

### Deployment Discipline

Main branch MUST always be deployable. Breaking changes MUST be feature-flagged or deployed behind URL paths. Rollbacks MUST be possible within 5 minutes. Analytics and error tracking MUST be present to catch issues in production.

**Rationale**: Solo projects lack QA teams. Production visibility and quick recovery prevent small issues from becoming reader-facing disasters.

## Content & UX Standards

### Accessibility Baseline

Semantic HTML MUST be used throughout. Color contrast MUST meet WCAG AA standards. Keyboard navigation MUST work for all interactive elements. Images MUST have descriptive alt text. Responsive design MUST support viewports from 320px to 4K.

**Rationale**: Accessibility is not optional. These standards are easy to maintain from the start and hard to retrofit later.

### Visual Consistency

Design tokens MUST be defined in CSS custom properties. Component variants MUST be limited to 2-3 per component. New UI patterns MUST reuse existing components before creating new ones. Visual changes MUST be previewed across breakpoints.

**Rationale**: Consistency requires discipline, not extensive design systems. Constraints prevent design drift in solo projects.

## Governance

### Amendment Process

Constitution changes require documented rationale and impact assessment. Version bumps follow semantic versioning: MAJOR for removed/redefined principles, MINOR for new principles, PATCH for clarifications. All amendments MUST update dependent templates and propagate changes.

### Compliance & Exceptions

Features MUST pass constitution checks before implementation. Exceptions MUST be documented in plan.md Complexity Tracking table with justification. Systematic violations signal a principle needs revision, not repeated exceptions.

### Living Document

Review constitution every 6 months or after 10 feature implementations. Outdated principles MUST be removed, not relaxed. If a rule is consistently broken, either enforce it strictly or remove it entirely.

**Version**: 1.0.0 | **Ratified**: 2025-12-13 | **Last Amended**: 2025-12-13
