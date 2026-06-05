# Pasule Firefly/Xtower Three-Column Home Design

- Date: 2026-06-05
- Project: `pasule-blog`
- Stack: Hexo 7.3.0, Butterfly 5.3.5, Stylus, Cheerio HTML filters, vanilla JavaScript
- References:
  - `https://xtower.site/`
  - `https://firefly.cuteleaf.cn/`
  - `https://github.com/CuteLeaf/Firefly`
- Status: Drafted after user selected the Firefly/Xtower three-column adaptation direction

## Context

The homepage currently uses Butterfly's full-screen top banner, then a custom rotating media hero inserted above the recent posts, followed by a two-column card grid and a crowded sidebar. This made the page more visual, but it also created a duplicated hero structure: the first viewport already has a large banner, and the content area repeats another large image block before the article list.

The user wants the homepage layout to feel closer to `xtower.site` and CuteLeaf Firefly: a mood-heavy top banner, then a readable three-column blog dashboard where left, center, and right rails each have a clear role. The user also called out "extra tags and positions", so this pass should reduce duplicate category/tag/sidebar noise instead of adding more panels.

Firecrawl evidence captured for review:

- `.firecrawl/xtower-screenshot.png`
- `.firecrawl/firefly-screenshot.png`
- `.firecrawl/xtower-branding-images.json`
- `.firecrawl/firefly-branding-images.json`

The screenshots show both references using the same core structure: translucent top nav, large banner, left profile/music/category/tag rail, central post list, and right statistics/calendar rail. The design should borrow that organization without migrating the site to Astro or copying Firefly assets.

## Goal

Adapt Pasule's homepage into a Firefly/Xtower-style three-column blog entry while preserving Hexo/Butterfly.

The result should:

- Keep the existing Butterfly top full-screen banner as the homepage's main visual mood.
- Move the dynamic photo rotation to the top banner/background layer instead of rendering a second large content hero.
- Rebuild the content area into a three-column layout on desktop:
  - left rail: profile, compact music/config state, category/tag entry points
  - center: recent post list
  - right rail: announcement/statistics/lightweight site info
- Reduce duplicate sidebar widgets and make tags/categories compact chips rather than a bulky cloud.
- Keep the global floating music player from the previous implementation.
- Preserve existing routes, posts, Live2D, background imagery, and Butterfly dark mode.

## Non-Goals

- Do not migrate to Astro, Firefly, or Fuwari.
- Do not clone Firefly/Xtower assets, logos, copy, or exact colors.
- Do not add heavy new effects, WinBox panels, or large framework dependencies.
- Do not add another decorative card layer above the article list.
- Do not autoplay music.
- Do not remove article content or break archive/tag/category pages.

## Reference Interpretation

### Xtower

Observed patterns:

- A large art banner owns the first viewport.
- The content area starts directly under the banner as a dashboard-like layout.
- Left rail contains identity and media widgets.
- Center column is a vertical post stream, not a masonry/card-heavy grid.
- Right rail is sparse: site stats and calendar-like info.
- Tags and categories are compact chips with counts, not a dominant block.
- The palette is soft and themed, but structure matters more than exact pink values.

### Firefly

Observed patterns:

- Similar layout to Xtower but with a green theme and longer post list.
- Post cards are horizontal list cards with metadata, tags, and optional right-side cover image.
- Left tags can be more numerous, but still compact and capped with a "more" entry.
- The page has high information density without looking like nested cards inside cards.

### Pasule Translation

Pasule should take the structural pattern:

- banner as mood
- rails as information panels
- center list as reading path
- compact chips for classification

Pasule should not take the exact brand assets, copy, or full widget inventory.

## Architecture

Use the existing project-owned customization layer:

- `source/_data/content-map.yml`
  - Keep homepage image and music configuration.
  - Add or reuse homepage display preferences for widget visibility and chip limits.
- `scripts/pasule-home-shell.js`
  - Stop injecting `data-pasule-home-hero` as a content-area block.
  - Inject a lightweight homepage layout scaffold around existing Butterfly output.
  - Move or clone selected sidebar widgets into left/right rails only on `index.html`.
  - Continue injecting the global music player on every HTML page.
- `source/js/pasule-fomalhaut-ui.js`
  - Reuse the existing media rotation timer, but target the homepage banner/background layer.
  - Keep global music panel behavior.
  - Reinitialize safely on `DOMContentLoaded` and `pjax:complete`.
- `source/css/modify.styl`
  - Replace content hero styling with banner rotation and three-column layout styling.
  - Restyle recent posts as horizontal list cards.
  - Compact category/tag cards and hide duplicate/low-value homepage widgets.
- `_config.butterfly.yml`
  - Keep current injected APlayer/MetingJS assets.
  - Avoid adding more global libraries.
- `tools/verify-fomalhaut-home.cjs` and `tools/verify-generated-pages.cjs`
  - Update smoke checks to match the new layout markers.

## Layout Design

### First Viewport

Keep Butterfly's top banner as the first-viewport signal.

On the homepage, the banner background should rotate through `home.media_hero.images` when enabled. This preserves the user's requested dynamic photo experience while avoiding a second large hero inside the content area.

The banner keeps:

- site title
- subtitle/typewriter behavior
- nav
- social icons
- scroll-down affordance

The banner gains:

- background image rotation sourced from `content-map.yml`
- reduced-motion support
- no autoplaying audio

### Desktop Content Area

Use a three-column grid:

- left rail: about/profile, compact music state, categories, compact tags
- center column: article stream
- right rail: announcement, site stats, archives/updated info

Recommended widths:

- left rail: `240px-280px`
- center: flexible `minmax(0, 1fr)`
- right rail: `240px-280px`
- total content max width: around `1180px-1280px`

The left and right rails should feel like separate information columns, not a long default Butterfly sidebar copied twice.

### Center Article List

Replace the current two-column recent-post grid on the homepage with vertical list cards:

- title
- date
- category
- short excerpt
- limited tags when available
- optional cover thumbnail on the right
- compact "read more" affordance

Pinned posts should keep a clear sticky marker, but avoid oversized iconography.

This column is the main reading path and should not be interrupted by another full-width hero.

### Left Rail

Left rail should contain:

- profile card from existing Butterfly card-info
- compact music card:
  - if music ID is empty, show a small "网易云歌单源未填写" state
  - if music ID is set, the global floating player remains the full player and this card can act as a status/trigger
- category chips with counts
- tag chips capped to a small count
- a "更多" link to tags or archives when there are more tags

This directly addresses the user's "extra tags" concern: tags become a concise navigation aid, not a large visual block.

### Right Rail

Right rail should contain only high-signal site info:

- announcement
- site statistics / web info
- archive summary or recent activity

Default widgets that add noise on the homepage should be hidden or moved out of the first screen:

- full recent-post sidebar card, because the center column already lists posts
- oversized tag cloud
- duplicate quick jump/announcement blocks
- long archive/category blocks if they repeat left-rail chips

Regular post pages may keep their existing sidebar/Toc behavior.

### Mobile Layout

Mobile should collapse to one column:

1. top banner
2. compact profile/entry card
3. article list
4. category/tag chips
5. site info

The rails should not become side-by-side or create horizontal scroll. The floating music control should remain offset from Butterfly's right-side controls.

## Data And Configuration

Reuse the current `home.media_hero` and `home.music` data.

Add only small optional configuration if needed:

```yaml
home:
  layout:
    style: firefly_three_column
    tag_limit: 10
    category_limit: 6
    show_recent_sidebar: false
    show_archive_sidebar: compact
```

The layout must still work if this block is missing by using safe defaults.

## Interaction

- Banner rotation:
  - rotate images on the configured interval
  - pause or skip animation when `prefers-reduced-motion: reduce`
  - do not shift layout dimensions during rotation
- Music:
  - keep the global player expand/collapse interaction
  - keep empty-ID fallback
  - do not autoplay
- Tags/categories:
  - simple links, no complex filter UI in this pass
- Post cards:
  - hover lift is subtle
  - focus states remain visible

## Error Handling

- Missing `home.media_hero.images`: keep the normal Butterfly banner image/background.
- Broken banner image: fall back to `/img/404.jpg` or the existing background.
- Missing music ID: show configured empty state and skip `<meting-js>`.
- Missing sidebar widget: skip moving that widget; do not break the page.
- PJAX reentry: do not duplicate rails, timers, event listeners, or player shells.

## Testing

Update automated checks so they assert:

- `public/index.html` contains a new three-column homepage marker, for example `data-pasule-home-firefly`.
- `public/index.html` does not contain the old content-area `data-pasule-home-hero` block.
- `public/index.html` still contains recent posts.
- `public/index.html` still contains `data-pasule-music-player`.
- `public/about/index.html` contains `data-pasule-music-player`.
- Empty music ID still skips `<meting-js>`.
- `public/style.css` contains the three-column layout selectors.
- `public/js/pasule-fomalhaut-ui.js` contains the banner rotation initializer.

Manual browser checks:

- Desktop homepage visually matches the reference structure: banner, left rail, center list, right rail.
- Tags/categories are compact and not duplicated in several large blocks.
- About/post pages do not receive homepage-only three-column rails.
- Mobile has no horizontal overflow at common widths.
- Music panel opens and closes on homepage and regular pages.
- Banner image rotation works or is disabled under reduced motion.

## Acceptance Criteria

- Homepage reads as a Firefly/Xtower-style blog dashboard rather than a standard Butterfly card grid.
- The dynamic photo experience is preserved through the top banner/background, not a duplicated content hero.
- Tags/categories are compact, capped, and positioned intentionally.
- Sidebar content is reduced to high-signal widgets.
- The global music player still works and remains configurable.
- The change is localized to existing project-owned customization files.
- Build and smoke checks pass.

