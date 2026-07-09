# Pasule Firefly Static Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the Hexo/Butterfly homepage into a Firefly/Xtower-style three-column layout with a static configurable banner and global music player, with all carousel behavior removed.

**Architecture:** Keep Butterfly rendering the base homepage, then use `scripts/pasule-home-shell.js` as a Cheerio post-render adapter for `index.html`: set one static banner image, wrap the recent posts and selected sidebar widgets into left/center/right rails, and keep the music player injection global. Use `source/css/modify.styl` for the three-column layout and `source/js/pasule-fomalhaut-ui.js` only for music/nav/page effects, not carousel timers.

**Tech Stack:** Hexo 7.3, Butterfly 5.3.5, Cheerio HTML filters, Stylus, vanilla JavaScript, Node smoke verifiers.

---

### Task 1: Update Smoke Tests For Static Three-Column Home

**Files:**
- Modify: `tools/verify-fomalhaut-home.cjs`
- Modify: `tools/verify-generated-pages.cjs`

- [ ] **Step 1: Write failing static-home assertions**

Update `tools/verify-fomalhaut-home.cjs` so it asserts these markers:

```js
mustContain('public/index.html', 'data-pasule-home-firefly');
mustContain('public/index.html', 'data-pasule-home-left');
mustContain('public/index.html', 'data-pasule-home-stream');
mustContain('public/index.html', 'data-pasule-home-right');
mustContain('public/index.html', 'data-pasule-static-banner');
mustContain('public/index.html', 'data-pasule-home-music-card');
mustContain('public/index.html', 'data-pasule-music-player');
mustContain('public/about/index.html', 'data-pasule-music-player');
mustContain('public/index.html', 'id="recent-posts"');
mustContain('public/index.html', 'data-pasule-nav-grouped');
mustContain('public/index.html', 'APlayer.min.css');
mustContain('public/index.html', 'Meting.min.js');
mustContain('public/style.css', '.pasule-home-firefly');
mustContain('public/style.css', '.pasule-home-stream');
mustContain('public/style.css', '.pasule-global-music');
mustContain('public/js/pasule-fomalhaut-ui.js', 'initPasuleGlobalMusic');
mustNotContain('public/index.html', 'data-pasule-home-hero');
mustNotContain('public/index.html', 'data-pasule-home-carousel');
mustNotContain('public/index.html', 'pasule-hero-dot');
mustNotContain('public/style.css', '.pasule-home-media-hero');
mustNotContain('public/style.css', '.pasule-swiper');
mustNotContain('public/js/pasule-fomalhaut-ui.js', 'initPasuleMediaHero');
mustNotContain('public/js/pasule-fomalhaut-ui.js', 'pasuleMediaHeroTimer');
```

Update `tools/verify-generated-pages.cjs` so homepage checks expect `data-pasule-home-firefly`, `data-pasule-home-left`, `data-pasule-home-right`, and no `data-pasule-home-carousel`, `.pasule-home-carousel`, `.pasule-swiper`, or `data-pasule-home-hero`.

- [ ] **Step 2: Run tests to verify they fail**

Run:

```powershell
node tools\verify-fomalhaut-home.cjs
```

Expected: fails with a missing static-home marker such as `Missing "data-pasule-home-firefly" in public/index.html`.

### Task 2: Replace Carousel Config With Static Banner Config

**Files:**
- Modify: `source/_data/content-map.yml`

- [ ] **Step 1: Add static banner and layout options**

Set the homepage config to:

```yaml
home:
  banner:
    enabled: true
    image: /img/2.jpg
    fallback_image: /img/404.jpg
  layout:
    style: firefly_three_column
    tag_limit: 12
    category_limit: 6
    show_recent_sidebar: false
    show_archive_sidebar: compact
```

Remove the `home.carousel` and `home.media_hero` blocks so no slideshow configuration remains.

- [ ] **Step 2: Keep music configurable**

Keep:

```yaml
  music:
    enabled: true
    provider: netease
    type: playlist
    id: ""
    title: "Pasule Radio"
    subtitle: "网易云歌单源未填写。"
```

### Task 3: Implement Static Three-Column HTML Adapter

**Files:**
- Modify: `scripts/pasule-home-shell.js`

- [ ] **Step 1: Remove old content hero and carousel builders**

Delete builder code that emits `data-pasule-home-hero`, `data-pasule-home-carousel`, `.pasule-swiper`, slide cards, dots, or timers.

- [ ] **Step 2: Add static banner helper**

Implement:

```js
function getStaticBanner(home) {
  const banner = (home && home.banner) || {};
  if (banner.enabled === false) return null;

  const legacyImages = (((home && home.media_hero) || {}).images || []).filter(item => item && item.src);
  const image = banner.image || (legacyImages[0] && legacyImages[0].src);
  if (!image) return null;

  return {
    image: normalizeAsset(image),
    fallback: normalizeAsset(banner.fallback_image || '/img/404.jpg')
  };
}
```

- [ ] **Step 3: Add rail adapter**

Implement `applyFireflyHomeLayout($, home)` so it:

```js
const layout = $('#content-inner');
const recentPosts = $('#recent-posts');
const aside = $('#aside-content');
const shell = $('<section class="pasule-home-firefly" data-pasule-home-firefly></section>');
const left = $('<aside class="pasule-home-rail pasule-home-left" data-pasule-home-left></aside>');
const stream = $('<section class="pasule-home-stream" data-pasule-home-stream></section>');
const right = $('<aside class="pasule-home-rail pasule-home-right" data-pasule-home-right></aside>');
```

Move `.card-info`, a new compact music status card, `.card-categories`, and `.card-tags` into the left rail. Move `.card-announcement`, `#pasule-quick-jump`, `.card-webinfo`, and a compact archive card into the right rail. Move `#recent-posts` into the center stream. Remove the duplicate `#pasule-station-note` and `.card-recent-post` on the homepage.

- [ ] **Step 4: Run build and static smoke test**

Run:

```powershell
npm run build
node tools\verify-fomalhaut-home.cjs
```

Expected: build succeeds and any remaining failure points at CSS/JS assertions, not missing HTML structure.

### Task 4: Remove Carousel JavaScript And Swiper Assets

**Files:**
- Modify: `source/js/pasule-fomalhaut-ui.js`
- Modify: `_config.butterfly.yml`

- [ ] **Step 1: Remove frontend carousel code**

Delete `pasuleMediaHeroTimer`, `initPasuleHomeEffects`, and `initPasuleMediaHero`. Remove their `DOMContentLoaded` and `pjax:complete` listeners. Keep `initPasuleGlobalMusic`, nav title, nav active state, read percent, and article progress.

- [ ] **Step 2: Remove Swiper injection**

Remove these injected assets from `_config.butterfly.yml`:

```yaml
- <link rel="stylesheet" href="https://npm.elemecdn.com/hexo-butterfly-swiper/lib/swiper.min.css">
- <script src="https://npm.elemecdn.com/hexo-butterfly-swiper/lib/swiper.min.js"></script>
```

Keep APlayer, MetingJS, animate.css, wow.js, and `/js/pasule-fomalhaut-ui.js`.

### Task 5: Restyle Homepage As Firefly/Xtower Three Columns

**Files:**
- Modify: `source/css/modify.styl`

- [ ] **Step 1: Remove carousel/media-hero selectors**

Remove styles for `.pasule-home-media-hero`, `.pasule-hero-slide`, `.pasule-hero-dot`, `.pasule-home-carousel`, `.pasule-swiper`, `.pasule-slide-card`, `.swiper-pagination`, and `.pasule-swiper-dot`.

- [ ] **Step 2: Add three-column selectors**

Add styles for:

```stylus
.pasule-home-firefly
  display: grid
  grid-template-columns: minmax(220px, 260px) minmax(0, 1fr) minmax(220px, 260px)
  gap: 18px
  width: min(1280px, calc(100vw - 32px))
  margin: 0 auto 28px

.pasule-home-stream #recent-posts .recent-post-items
  display: grid
  grid-template-columns: 1fr
  gap: 16px

.pasule-home-stream #recent-posts .recent-post-item
  display: grid
  grid-template-columns: minmax(0, 1fr) 180px
```

Add responsive rules under `1100px` to collapse to one column and under `768px` to keep post thumbnails above text.

- [ ] **Step 3: Run build and verifiers**

Run:

```powershell
npm run build
node tools\verify-fomalhaut-home.cjs
node tools\verify-generated-pages.cjs
```

Expected: all commands exit `0`, and both verifiers print their success lines.

### Task 6: Manual Browser Verification

**Files:**
- No source files

- [ ] **Step 1: Start local Hexo server**

Run:

```powershell
npm run server -- --port 4000
```

Expected: Hexo serves the site at `http://localhost:4000/`.

- [ ] **Step 2: Inspect desktop and mobile**

Open `http://localhost:4000/` and verify:

```text
desktop: top banner is static, homepage below it is left rail / post stream / right rail
desktop: no slideshow dots, no large content hero, no carousel strip
desktop: tags and categories are compact chips
mobile: no horizontal overflow, rails collapse into a single column
music: global music button opens/closes, empty music ID shows fallback text
```

- [ ] **Step 3: Confirm non-home pages**

Open `/about/` and one post page. Verify they still have the global music player but do not have `data-pasule-home-firefly`.

