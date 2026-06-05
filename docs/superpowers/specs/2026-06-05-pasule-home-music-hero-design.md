# Pasule 首页动态首屏与全局音乐播放器设计

## Context

Project: `pasule-blog`

Stack: Hexo 7.3.0, Butterfly 5.3.5, Stylus, local Hexo filters, small browser-side JavaScript.

Current production reference: `https://pasule.com/`

Visual reference: `https://xtower.site/`

The current homepage is a standard Butterfly index: transparent top banner, site title, recent post cards, and a right sidebar with profile, announcement, quick links, recent posts, categories, tags, archives, and site stats. The codebase already contains partial homepage shell work in `scripts/pasule-home-shell.js`, `source/js/pasule-fomalhaut-ui.js`, and `source/css/modify.styl`, but the custom shell is not currently injected into `public/index.html`.

## Goal

Improve the homepage while keeping the Hexo and Butterfly base stable:

- Add a dynamic photo hero on the homepage with several rotating images.
- Add a global music player using a configurable NetEase Cloud Music source.
- Borrow the reference site's feeling of media-first banner, translucent panels, compact controls, and global player access without recreating the reference site one-to-one.
- Preserve the existing article list, sidebar content, routes, and current Butterfly behavior.

## Non-Goals

- Do not migrate away from Hexo or Butterfly.
- Do not replace the whole site with an Astro/Firefly-style implementation.
- Do not hard-code a specific NetEase playlist ID.
- Do not autoplay music on page load.
- Do not remove Live2D, current post cards, existing widgets, or existing navigation unless a direct layout conflict must be solved.

## Source Of Truth

Add a homepage configuration object under `source/_data/content-map.yml` rather than creating another data island.

New data shape:

```yaml
home:
  media_hero:
    enabled: true
    interval: 5200
    images:
      - src: /img/2.jpg
        title: Pasule Blog
        subtitle: 记录技术文章、项目实验和日常折腾。
      - src: https://pic1.imgdb.cn/item/6805d3a258cb8da5c8bb423b.jpg
        title: 技术、实验与日常
        subtitle: 把值得复盘的东西留在这里。
      - src: https://bu.dusays.com/2026/04/04/69d11d25cc720.jpg
        title: 生活与折腾现场
        subtitle: 让相册和技术记录在首页都有一点存在感。
  music:
    enabled: true
    provider: netease
    type: playlist
    id: ""
    title: Pasule Radio
    subtitle: 网易云歌单 ID 可在这里配置。
```

If `home.music.id` is empty, the UI still renders as a configurable placeholder and does not attempt to load a broken playlist.

## Architecture

### HTML Injection

Update `scripts/pasule-home-shell.js` to inject the homepage media hero into `index.html` before `#recent-posts`.

The homepage block should include:

- `data-pasule-home-hero` for the photo hero.
- `data-pasule-hero-slide` items generated from `home.media_hero.images`.

The media hero should only run for `data.path === 'index.html'`. It should not affect archive, post, about, projects, gallery, or pagination pages.

The same filter file should also inject `data-pasule-music-player` once into every generated HTML page so the music player is truly global. This player shell should include a compact trigger button that can stay visible even when the player panel is collapsed.

### Music Loading

Use APlayer and MetingJS via Butterfly inject settings or equivalent script tags:

- APlayer CSS and JS.
- MetingJS for NetEase Cloud Music integration.

When `home.music.id` is set, generate a `<meting-js>` element with:

- `server="netease"`
- `type` from config, defaulting to `playlist`
- `id` from config
- mini/player attributes suitable for a compact global player

When `home.music.id` is empty, show a small disabled panel that marks the music source as unset.

### Browser Behavior

Extend `source/js/pasule-fomalhaut-ui.js`:

- Rotate active hero images on the configured interval.
- Allow manual next/previous or dot selection if controls are rendered.
- Pause rotation while the user hovers over the hero on desktop.
- Add collapse/expand behavior for the music player.
- Persist collapsed state in `localStorage`.
- Re-run initialization on `DOMContentLoaded` and `pjax:complete`, matching the existing project pattern.

### Styling

Extend `source/css/modify.styl`:

- Keep the visual language close to the current Pasule tokens.
- Use the reference site's ideas: a large media banner, translucent rounded panels, compact floating controls, and clear light/dark support.
- Avoid nested cards.
- Keep cards at 8px border radius or less only where they are controls; larger photo panels may follow the existing Pasule rounded style because the current custom theme already uses large radius tokens.
- Ensure mobile layouts do not horizontally scroll.
- Reserve stable hero and control dimensions to avoid layout shift.

## Layout

Desktop:

- The Butterfly top banner remains, but the custom homepage enhancement appears at the top of the content area before recent posts.
- The media hero spans the main content width and shows one large image at a time with a text overlay.
- The music trigger appears on every page and floats near the right-side controls, above the Live2D-safe area.
- Expanding the player opens a compact glass panel without covering the article cards.

Mobile:

- The media hero becomes a shorter, full-width block.
- Hero text wraps naturally and never overlaps controls.
- The music player collapses by default into a bottom/right compact button.
- Expanded player width is constrained to the viewport.

## Data Flow

1. Hexo reads `source/_data/content-map.yml`.
2. `scripts/pasule-home-shell.js` builds homepage hero and music shell HTML from the data map.
3. Butterfly renders the page normally.
4. The filter injects the media hero into homepage HTML.
5. The filter injects the music player shell into every generated HTML page.
6. `source/js/pasule-fomalhaut-ui.js` initializes image rotation and player panel behavior in the browser.
7. APlayer/MetingJS loads the configured NetEase resource only when a music ID exists.

## Error Handling

- Missing `home.media_hero.images`: do not inject a broken hero; leave the homepage article list intact.
- Broken image URL: fall back to `/img/404.jpg`.
- Empty music ID: render the music shell as a configuration placeholder and skip MetingJS playlist loading.
- Missing APlayer/MetingJS assets: the page remains usable; the music panel should show a non-blocking fallback state.
- Repeated initialization after PJAX: clear timers and avoid duplicate event listeners.

## Testing

Add or update a local verification script so builds assert:

- `public/index.html` contains `data-pasule-home-hero`.
- `public/index.html` contains `data-pasule-music-player`.
- `public/about/index.html` contains `data-pasule-music-player`.
- `public/index.html` keeps `id="recent-posts"`.
- `public/index.html` does not contain a hard-coded NetEase playlist ID when the config ID is empty.
- `public/style.css` contains `.pasule-home-media-hero`.
- `public/style.css` contains `.pasule-global-music`.
- Existing article page checks still pass.

Manual browser verification:

- `npm run build` succeeds.
- `npm run server` serves the homepage.
- Desktop and mobile screenshots show no overlapping text or horizontal scroll.
- The hero rotates images.
- The music panel expands and collapses.
- With an empty music ID, the player placeholder does not throw visible errors.

## Acceptance Criteria

- The homepage first content section feels more intentional and media-rich than the current article-list-only entry.
- Users can see and open a global music player control from the homepage and regular content pages.
- NetEase Cloud Music source is configurable from data, not hard-coded in scripts.
- The existing Hexo routes, article cards, sidebar widgets, and post pages continue to build.
- The implementation remains localized to project-owned scripts, data, CSS, and verification files.
