# Pasule Blog UI And Content Design

- Date: 2026-03-30
- Project: `pasule-blog`
- Theme stack: Hexo 7 + Butterfly 5
- Design status: Approved for spec drafting, pending implementation planning

## 1. Goal

Upgrade the existing Butterfly-based Hexo blog into a stronger "blog + portfolio hybrid" while preserving data integrity, URL stability, and the current image/resource set.

The target experience is:

- the site has a clearly stronger visual identity
- the identity carries a noticeable anime-inspired atmosphere
- the atmosphere is expressed mainly through visual styling, not heavy character-role copywriting
- the site remains a serious technical blog first, not a pure visual landing page
- articles, projects, archives, gallery, and about page feel like parts of one coherent world

## 2. Approved Direction

The chosen direction is the second design path discussed during brainstorming:

- keep the current Butterfly structure instead of replacing the theme architecture
- strengthen the site shell, information hierarchy, and cross-page consistency
- make the homepage a stronger content hub instead of a plain article list
- upgrade the projects page from sample-style content into a real portfolio section
- organize existing articles into clearer series and reading paths
- keep anime influence primarily in visual atmosphere

This is explicitly not a "light touch only" refresh and not a full custom front-end rebuild.

## 3. Hard Constraints

The following constraints are part of the approved design and must be respected during implementation:

- do not break existing article permalinks
- do not batch rename post files
- do not remove or replace existing image resources by default
- do not discard the existing background-image-based visual world
- do not turn the blog into a single-page portfolio
- do not rely on large new illustration assets to create the anime feeling
- do not introduce a heavy new front-end framework around Hexo
- do not rewrite the core technical meaning of existing articles

## 4. Current Baseline

The current site already has a recognizable base layer:

- [`/_config.yml`](/f:/hexo butterfly/pasule-blog/_config.yml) defines the Hexo site structure, permalink strategy, and general behavior
- [`/_config.butterfly.yml`](/f:/hexo butterfly/pasule-blog/_config.butterfly.yml) defines the Butterfly navigation, images, covers, and theme behavior
- [`/source/css/modify.styl`](/f:/hexo butterfly/pasule-blog/source/css/modify.styl) and [`/source/_data/styles.styl`](/f:/hexo butterfly/pasule-blog/source/_data/styles.styl) already push the site toward a "background image + translucent card" language

Current weaknesses:

- the homepage shell and the article body quality are not yet at the same maturity level
- the projects page is still a sample-style page rather than a real portfolio section
- the gallery page is still closer to a demo page than a curated content page
- the about page has baseline data but weak presentation
- articles have solid standalone volume but limited series structure and limited cross-entry navigation

## 5. Visual System

### 5.1 Visual Positioning

The approved visual positioning is:

`technical content foundation + clearly visible anime-inspired atmosphere shell`

This means:

- content readability remains the first priority
- anime feeling comes from color, shape language, labels, highlight treatment, and card atmosphere
- the site should feel like a personal technical "small universe", not a generic pink reskin

### 5.2 Color Strategy

Use a restrained, readable base with dual accent colors:

- primary text: deep ink / dark gray-blue
- primary accent: sakura pink
- secondary accent: sky blue
- balancing neutrals: cream white, mist white, very light blue-gray

Design intent:

- pink creates emotional identity
- blue prevents the site from becoming too sugary
- neutral light surfaces preserve long-form reading comfort

### 5.3 Component Language

The site should use one consistent component language:

- softer card radius, generally in the `14px-20px` range
- sticker-like pills and badge tags
- gentle glow or highlight edges on important cards
- subtle gradient blocks for selected modules
- soft shadows instead of aggressive depth
- decorative separators for section headings

This should feel deliberate and cohesive, not decorative for its own sake.

### 5.4 Motion Strategy

Motion should be light and controlled:

- hover and transition timing around `150ms-220ms`
- small lift, border glow, shadow expansion, fade-in
- avoid heavy liquid glass or always-on floating effects
- avoid performance-heavy blur stacks on top of the existing background/live2d setup

## 6. Navigation And Entry Model

The homepage will become the strongest entry point, but not the only one.

Approved navigation model:

- top navigation remains globally available across the site
- users can jump directly among homepage, archives, projects, gallery, about, and article pages without returning to homepage first
- section pages should cross-link each other, not exist as isolated dead ends
- active location should be visually clear through menu highlighting and, where useful, light breadcrumb support

Target user experience:

- homepage acts as the central hub
- any section page can still lead naturally to other sections
- the site behaves like a connected network, not a one-way landing page

## 7. Page-Level Strategy

### 7.1 Homepage

The homepage is the primary enhancement page.

It will evolve from a mostly article-list-driven front page into a content hub containing:

- stronger hero shell
- featured articles
- series/topic entry cards
- project entry section
- recent updates area
- more intentional sidebar cards

The homepage should answer these questions immediately:

- who is this site for
- what kind of content lives here
- what to read first
- what projects are worth opening

### 7.2 Article Pages

Article pages are a medium-strength enhancement area.

What changes:

- cleaner article header and metadata presentation
- clearer tag/category/series treatment
- better related reading flow
- stronger "what to read next" behavior

What does not change:

- long-form technical reading remains the dominant mode
- body content should stay restrained and readable
- decorative UI should not compete with the article itself

### 7.3 Projects Page

The projects page is a major rebuild target.

It should move from sample-style markup to a maintainable grid of real project cards, each with:

- project name
- short description
- tech stack
- status
- repository/demo links
- optional related-article linkage

This page should look like a first-class section, not a temporary sample.

### 7.4 About Page

The about page is a medium-strength enhancement area.

It should become:

- clearer as a personal profile page
- more structured in presentation
- more visually aligned with the rest of the site

It should still sound natural and personal, not role-played or overly character-driven.

### 7.5 Gallery / Shuoshuo / Archives / Tags

These are light-refinement pages.

Goals:

- bring them into the shared visual shell
- improve card consistency and page polish
- keep them connected to the homepage and other key sections

They should not steal focus from homepage, article pages, or projects.

## 8. Content Strategy

### 8.1 Principle

Existing content should be improved by structured enhancement, not by rewriting everything.

Preferred enhancement methods:

- add stronger front matter
- add article-level intro/guide blocks where useful
- add series and reading-order information
- add related-reading paths
- add homepage/topic curation

Avoid:

- rewriting articles just to make them match a style
- over-decorating technical posts
- scattering manual article relations across many files

### 8.2 Existing Content Lines

The current posts naturally support four content lines:

1. Java / backend growth line
   Includes Spring basics, Java concurrency, and microservices architecture.

2. Database performance line
   Centered on MySQL index optimization and expandable into execution plans, slow queries, locks, and transactions.

3. Front-end engineering line
   Built from routing and front-end performance topics.

4. Engineering collaboration line
   Built from Git workflow and team collaboration, expandable into pull request and review practice.

### 8.3 Recommended Article Metadata Additions

To support curation and cross-linking, posts may gain structured fields such as:

- `series`
- `series_order`
- `difficulty`
- `keywords`
- `hero_desc`
- `recommended_next`

These fields should be added gradually and consistently, not partially in conflicting formats.

### 8.4 Recommended Follow-Up Articles

The best new content additions are gap-fillers that complete the current lines:

- Java concurrency practical follow-up: thread pools / `CompletableFuture` / concurrency in practice
- MySQL follow-up: `EXPLAIN`, slow query analysis, execution-plan reading
- front-end follow-up: route permissions, lazy loading, route organization in real projects
- engineering collaboration follow-up: pull request and code review practice

This keeps growth aligned with the current content identity.

## 9. Data Consistency Model

To preserve consistency, the design introduces a centralized content-mapping layer.

Recommended file:

- [`/source/_data/content-map.yml`](/f:/hexo butterfly/pasule-blog/source/_data/content-map.yml)

This file should centrally manage:

- homepage featured articles
- homepage topic/series sections
- article-to-series mapping where needed
- article-to-project relationship mapping
- display order for curated homepage blocks

The purpose is to avoid repeating the same relationships in many pages and markdown files.

This centralized mapping is a key guardrail for data integrity.

## 10. Implementation Architecture

Implementation should be separated into four layers.

### 10.1 Style Layer

Primary files:

- [`/source/css/modify.styl`](/f:/hexo butterfly/pasule-blog/source/css/modify.styl)
- [`/source/_data/styles.styl`](/f:/hexo butterfly/pasule-blog/source/_data/styles.styl)

Responsibilities:

- global visual variables
- cards, labels, buttons, headings
- shared page shell treatments
- hover and atmosphere effects

### 10.2 Theme Configuration Layer

Primary files:

- [`/_config.yml`](/f:/hexo butterfly/pasule-blog/_config.yml)
- [`/_config.butterfly.yml`](/f:/hexo butterfly/pasule-blog/_config.butterfly.yml)

Responsibilities:

- navigation
- homepage display behavior
- article metadata visibility
- theme-level options such as covers, sidebar behavior, and page settings

This layer should be changed cautiously and minimally.

### 10.3 Content Mapping Layer

Primary file:

- [`/source/_data/content-map.yml`](/f:/hexo butterfly/pasule-blog/source/_data/content-map.yml)

Responsibilities:

- curated content relationships
- topic sections
- homepage featured ordering
- project/article connections

### 10.4 Page Content Layer

Primary files:

- [`/source/about/index.md`](/f:/hexo butterfly/pasule-blog/source/about/index.md)
- [`/source/projects/index.md`](/f:/hexo butterfly/pasule-blog/source/projects/index.md)
- [`/source/gallery/index.md`](/f:/hexo butterfly/pasule-blog/source/gallery/index.md)
- selected files under [`/source/_posts`](/f:/hexo butterfly/pasule-blog/source/_posts)

Responsibilities:

- page copy refinement
- card content structures
- project portfolio content
- article front matter enrichment

## 11. Delivery Phases

Implementation should be done in controlled phases.

### Phase A: Unified Shell

Focus:

- global visual variables
- card, tag, and heading unification
- navigation and shell polish

This phase is the safest and produces the fastest visible gain.

### Phase B: Homepage And Projects Upgrade

Focus:

- homepage hub structure
- projects page rebuild
- about page refinement

This phase upgrades the site's public face without high data risk.

### Phase C: Article System Enhancement

Focus:

- article intro blocks
- series metadata
- reading paths
- related reading
- topic grouping

This phase creates the strongest long-term content value.

### Phase D: Light Closing Pass And Maintenance Rules

Focus:

- gallery / shuoshuo / archives / tags polish
- content-map-based synchronization
- template rules for future posts and projects

This phase stabilizes maintenance quality.

## 12. Acceptance Criteria

The design should be considered successful when the following are true:

- the homepage clearly feels more complete, intentional, and recognizable
- the anime-inspired atmosphere is obvious without overwhelming technical readability
- section pages can cross-navigate without forcing a return to homepage
- the projects page becomes a real portfolio section
- existing posts feel connected through series and reading flow
- the site can be maintained through stable data structures instead of ad hoc repeated edits
- article URLs, current image assets, and existing core content remain intact

## 13. First Implementation Scope Recommendation

For the first real implementation cycle, the recommended scope is:

- homepage shell and unified visual system
- projects page rebuild
- about page refinement
- introduction of `content-map.yml`
- gradual post front matter enrichment for series/topic display

Do not attempt full content expansion and every secondary page in the same first pass.

## 14. Risks And Mitigations

### Risk: Style overwhelms content

Mitigation:

- keep article body styling restrained
- concentrate strong atmosphere mostly in shells, cards, badges, and curated sections

### Risk: Data relationships become scattered

Mitigation:

- use a central content map instead of repeating manual curation in multiple pages

### Risk: Theme overrides become hard to maintain

Mitigation:

- keep style logic concentrated in the two existing style override files
- minimize config-layer churn

### Risk: First implementation scope grows too large

Mitigation:

- enforce phased delivery
- finish shell and hub structure before expanding article creation work

## 15. Summary

This design keeps the existing Butterfly-based blog intact at the structural level while upgrading it into a more expressive, more coherent, and more maintainable technical-content world.

The site should end up feeling like:

- a real personal technical universe
- visually distinctive with an anime-inspired atmosphere
- structurally stronger as a blog + portfolio hybrid
- safer to maintain because curation logic is centralized instead of duplicated

The next step after spec review is to write a detailed implementation plan before editing the production site.
