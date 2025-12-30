# Feature Specification: Minimal Markdown Blog

**Feature Branch**: `001-markdown-blog`
**Created**: 2025-12-14
**Status**: Draft
**Input**: User description: "Why (Purpose): The purpose of this project is to build a personal blog that publishes Markdown-based writing in a form that is readable, durable, and maintainable over the long term. The project prioritizes the following: Platform independence, Low friction from writing to publishing, Content-first approach, Quiet reading experience, Ability to evolve safely over time."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Write and Publish a Blog Post (Priority: P1)

As a writer, I want to create a new blog post by writing Markdown in my local editor, save it to a designated folder, and have it automatically appear on my published blog with proper formatting, so that I can focus on writing without dealing with publishing mechanics.

**Why this priority**: This is the core value proposition of the blog. Without the ability to write and publish content easily, the entire project has no purpose. This must work first.

**Independent Test**: Can be fully tested by creating a Markdown file with standard formatting (headings, paragraphs, lists, code blocks), placing it in the content directory, triggering a build, and verifying it appears on the live site with correct rendering.

**Acceptance Scenarios**:

1. **Given** I have a Markdown file with frontmatter (title, date, optional description), **When** I place it in the content directory and build the site, **Then** the post appears on the blog index with correct metadata
2. **Given** my post contains standard Markdown elements (headings, paragraphs, bold, italic, links, lists, code blocks, blockquotes), **When** the post is rendered, **Then** all elements display with appropriate semantic HTML and readable styling
3. **Given** I update an existing post's content, **When** I rebuild the site, **Then** the changes are reflected without breaking other posts
4. **Given** I write a post with a draft status flag in frontmatter, **When** the site builds, **Then** the draft post does not appear on the public blog

---

### User Story 2 - Browse and Navigate Blog Posts (Priority: P2)

As a reader, I want to view a chronological list of blog posts on the homepage and navigate to individual posts with clear titles and dates, so that I can discover and read content easily.

**Why this priority**: Once content can be published, readers need a way to discover it. Without navigation, the blog is not functional as a reading experience.

**Independent Test**: Can be tested by publishing multiple posts with different dates, visiting the homepage, and verifying posts are listed in reverse chronological order with readable titles, dates, and working links.

**Acceptance Scenarios**:

1. **Given** there are multiple published posts, **When** I visit the homepage, **Then** I see posts listed in reverse chronological order (newest first)
2. **Given** I'm viewing the blog index, **When** I click on a post title, **Then** I navigate to the full post page with complete content
3. **Given** I'm reading a post, **When** I want to return to the index, **Then** I can click a clear navigation link back to the homepage
4. **Given** a post has a description in frontmatter, **When** viewing the index, **Then** the description appears as a preview snippet

---

### User Story 3 - Read Posts in a Distraction-Free Environment (Priority: P3)

As a reader, I want to read blog posts in a clean, readable layout with good typography, proper line length, appropriate contrast, and support for light/dark modes, so that I can focus on the content without visual distractions.

**Why this priority**: After publishing and navigation work, reading experience becomes critical for engagement. This transforms the blog from functional to pleasant to use.

**Independent Test**: Can be tested by opening a post on different devices and screen sizes, checking typography (font size, line height, line length), verifying dark mode toggle works, and confirming no distracting UI elements interfere with reading.

**Acceptance Scenarios**:

1. **Given** I'm reading a post on desktop, **When** viewing the content area, **Then** text has optimal line length (50-75 characters), comfortable font size (18-20px), and generous line height (1.6-1.8)
2. **Given** I prefer dark mode, **When** I toggle the theme preference, **Then** the site switches to dark mode with proper contrast and the preference persists across visits
3. **Given** I'm reading on mobile, **When** viewing a post, **Then** content is responsive, readable without zooming, and margins adapt appropriately
4. **Given** I'm reading a code-heavy post, **When** viewing code blocks, **Then** code has syntax highlighting, proper monospace font, horizontal scrolling if needed, and readable contrast in both light and dark modes

---

### User Story 4 - Organize Posts by Topic (Priority: P4)

As a writer, I want to categorize posts with tags or categories in frontmatter and have them automatically grouped, so that readers can find related content without manual linking.

**Why this priority**: This is valuable for blogs with multiple topics but not essential for MVP. The blog works without it, but organization improves discoverability as content grows.

**Independent Test**: Can be tested by adding tag/category fields to post frontmatter, building the site, and verifying filtered views or tag pages are generated automatically.

**Acceptance Scenarios**:

1. **Given** I add tags to a post's frontmatter, **When** the site builds, **Then** the post displays its tags and each tag links to a filtered view of posts with that tag
2. **Given** I click on a tag link, **When** the tag page loads, **Then** I see all posts with that tag listed chronologically
3. **Given** posts have multiple tags, **When** viewing a post, **Then** all tags are visible and clickable

---

### Edge Cases

- What happens when a Markdown file has invalid frontmatter? The build should fail with a clear error message indicating which file has the issue.
- How does the system handle posts with the same date? Posts should sort by date, then alphabetically by title as a tiebreaker.
- What happens when a post has no title in frontmatter? The build should fail with a clear error message, as title is a required field.
- What happens when a post has no slug in frontmatter? The system should auto-generate a unique random alphanumeric slug (8-12 characters).
- What happens when two posts have the same slug? The build should fail with a clear error message indicating slug collision and which files conflict.
- How are Japanese and mixed-language filenames handled? Filenames can contain Japanese, English, or mixed characters. The filename does not affect the URL slug.
- What happens when an image link in a post is broken? The site should build but display a missing image placeholder, not break the entire page.
- How are extremely long posts handled? Long posts should render completely; consider adding optional table of contents generation for posts over a certain length.
- What happens when a post has zero tags? The post should build successfully with an empty tags array; tag-related UI should handle empty arrays gracefully.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST render Markdown files into HTML pages with semantic markup
- **FR-002**: System MUST extract metadata from YAML frontmatter (at minimum: title, date, optionally: description, tags, draft status)
- **FR-003**: System MUST generate a homepage listing all published posts in reverse chronological order
- **FR-004**: System MUST create individual pages for each post at a predictable URL structure (e.g., `/posts/[slug]` or `/[year]/[month]/[slug]`)
- **FR-005**: System MUST support standard Markdown syntax: headings (h1-h6), paragraphs, bold, italic, links, ordered/unordered lists, code blocks, inline code, blockquotes, images
- **FR-006**: System MUST exclude draft posts (identified by frontmatter flag) from public build output
- **FR-007**: System MUST provide a light and dark theme with user preference toggle
- **FR-008**: System MUST persist theme preference across browser sessions
- **FR-009**: System MUST provide navigation between index and individual posts
- **FR-010**: System MUST generate static HTML files that can be hosted without a server runtime
- **FR-011**: System MUST support syntax highlighting for code blocks with language specification
- **FR-012**: System MUST be responsive and readable on screen sizes from 320px to desktop widths
- **FR-013**: System MUST generate unique URL slugs using random strings (not from filenames). Slugs must be shorter than UUIDs, use commonly-used characters (alphanumeric), and must not contain Japanese characters. If slug is not specified in frontmatter, system generates a random slug automatically
- **FR-014**: System MUST support images referenced relative to the post file or from a central assets directory
- **FR-015**: System MUST display post metadata (title, date, optionally description/tags) on both index and post pages
- **FR-016**: System MUST organize posts by tags/categories if specified in frontmatter, generating filtered views automatically
- **FR-017**: System MUST allow posts with zero tags (empty tags array) and successfully build without errors
- **FR-018**: System MUST support filenames in Japanese, English, or mixed Japanese-English characters

### Key Entities

- **Blog Post**: Represents a single piece of written content. Key attributes: title (string, required, can be Japanese), date (ISO date, required), slug (alphanumeric random string, auto-generated if not in frontmatter, must be unique and URL-safe, no Japanese characters), content (Markdown text), description (optional string for previews), tags (optional array of strings, can be empty array), draft status (optional boolean, default false). Filename can be Japanese, English, or mixed. Relationships: may belong to multiple tags (or zero tags).

- **Tag/Category**: Represents a topic or theme for grouping posts. Key attributes: name (string), slug (URL-safe string). Relationships: has many blog posts.

- **Site Metadata**: Represents global blog configuration. Key attributes: site title, author name, base URL, theme preference (light/dark/system). This may be stored in a configuration file rather than per-post frontmatter.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A writer can create a new blog post and publish it to the live site within 5 minutes (write Markdown, save file, trigger build/deploy)
- **SC-002**: Readers can discover and read any published post within 2 clicks from the homepage
- **SC-003**: Blog posts are readable without horizontal scrolling on devices from 320px width to 4K displays
- **SC-004**: The site loads and displays readable content within 2 seconds on a 3G connection
- **SC-005**: A writer can migrate all content to a different platform by copying Markdown files without loss of content or metadata
- **SC-006**: The site functions completely with JavaScript disabled (static HTML with CSS only), though theme toggle requires JavaScript
- **SC-007**: All blog posts pass WCAG AA accessibility standards for color contrast and semantic HTML
- **SC-008**: Adding a new post with 2000 words of content increases build time by less than 5 seconds
- **SC-009**: The blog supports at least 100 posts without performance degradation on the homepage or individual post pages
- **SC-010**: 95% of standard Markdown syntax renders correctly without custom formatting or workarounds

## Assumptions

1. **Astro as the Static Site Generator**: The project uses Astro for static site generation, as explicitly stated in the user input. This enables the Markdown-first workflow and static output requirements.

2. **Git-based version control**: Content is versioned using Git, enabling rollback, history tracking, and branch-based workflows for drafting.

3. **Filesystem-based content storage**: Blog posts are stored as `.md` files in a designated directory (e.g., `src/content/posts/`), not in a database or CMS.

4. **Build-time generation**: The entire blog is generated at build time, not at request time. This aligns with the static-first requirement and platform independence goal.

5. **Markdown frontmatter format**: Frontmatter uses YAML format between `---` delimiters at the start of each file, which is the standard for most static site generators.

6. **No backend server required**: The generated site consists only of static HTML, CSS, and minimal JavaScript, and can be hosted on any static file host (Netlify, Vercel, GitHub Pages, etc.).

7. **Modern browser support**: The site targets browsers released within the last 2 years, supporting modern CSS features like custom properties and grid. Legacy browser support is not a priority.

8. **Syntax highlighting library**: A lightweight syntax highlighting library (e.g., Shiki or Prism) will be used for code blocks, integrated at build time to avoid runtime JavaScript.

9. **Single author**: The blog is designed for a single author. Multi-author support (author attribution, filtering) is explicitly out of scope.

10. **No dynamic features**: All content is pre-rendered. Features requiring real-time data (view counts, live comments, personalization) are out of scope for MVP.

11. **Default sorting**: Posts are sorted by date descending (newest first) on the homepage. Alternative sorting methods are not required.

12. **URL structure**: Post URLs follow the pattern `/posts/[slug]`, where slug is a random alphanumeric string (shorter than UUID, e.g., 8-12 characters) specified in frontmatter or auto-generated. Slugs are NOT derived from filenames. This ensures uniqueness, convenience, and long-term permalink persistence regardless of title or filename changes.

13. **Theme toggle UI**: A simple toggle button or icon in a consistent location (header or footer) allows switching between light and dark modes. Theme preference is stored in localStorage.

14. **Responsive breakpoints**: Standard breakpoints will be used (e.g., mobile <768px, tablet 768-1024px, desktop >1024px) for responsive design.

15. **No external API dependencies**: The blog does not depend on external services for core functionality. Analytics or optional embeds (YouTube, etc.) may use external scripts but are not required for the blog to function.

## Out of Scope

The following are explicitly excluded from this specification:

- Admin dashboards or content management UIs for creating or editing posts
- Authentication, user accounts, roles, or permissions
- Comments, likes, reactions, or other interactive social features
- Site-wide search, filtering, or recommendation systems
- Analytics-driven ranking, personalization, or popularity-based ordering
- Multi-language or internationalization support
- Dependencies on external CMSs, databases, or third-party content services
- RSS feed generation (may be added later, but not required for MVP)
- Related posts or content recommendations
- Social media sharing buttons or open graph meta tags (may add later)
- Newsletter integration or email capture
- Contact forms or author communication features
- Image optimization or responsive image generation (assume images are optimized before adding to content)
- Custom shortcodes or advanced MDX components (standard Markdown only for MVP)
