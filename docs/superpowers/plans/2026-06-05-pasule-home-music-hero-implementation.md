# Pasule Home Music Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a configurable NetEase Cloud Music player across the site and a rotating photo hero on the homepage without replacing the Hexo/Butterfly base.

**Architecture:** Keep `source/_data/content-map.yml` as the content source. Use the existing Hexo `after_render:html` filter in `scripts/pasule-home-shell.js` to inject the homepage hero only on `index.html` and inject the music player shell on every generated HTML page. Use `source/js/pasule-fomalhaut-ui.js` for rotation and panel behavior, `source/css/modify.styl` for visuals, and Butterfly `inject` settings for APlayer/MetingJS assets.

**Tech Stack:** Hexo 7.3.0, Butterfly 5.3.5, Cheerio, Stylus, vanilla JavaScript, APlayer, MetingJS, local Node verification scripts.

---

## Scope Check

This is one cohesive subsystem: homepage media hero plus the global music control. The homepage hero and music player share the same data source and front-end initialization file, and they can be verified through one build. No further decomposition is needed.

## File Structure

- Modify: `source/_data/content-map.yml`
  Responsibility: stores homepage hero images and NetEase Cloud Music configuration.
- Modify: `scripts/pasule-home-shell.js`
  Responsibility: injects the homepage media hero and global music shell into generated HTML.
- Modify: `source/js/pasule-fomalhaut-ui.js`
  Responsibility: rotates hero images, handles music panel open/close, and keeps existing navigation/read-progress behavior.
- Modify: `source/css/modify.styl`
  Responsibility: visual styling for the media hero and music player, including responsive and dark-mode states.
- Modify: `_config.butterfly.yml`
  Responsibility: loads APlayer and MetingJS assets globally through Butterfly injection.
- Modify: `tools/verify-fomalhaut-home.cjs`
  Responsibility: focused smoke checks for the new homepage hero and music player.
- Modify: `tools/verify-generated-pages.cjs`
  Responsibility: broad regression checks for existing pages plus the new player/hero markers.

## Tasks

### Task 1: Add Failing Smoke Checks

**Files:**
- Modify: `tools/verify-fomalhaut-home.cjs`
- Modify: `tools/verify-generated-pages.cjs`

- [ ] **Step 1: Replace the focused homepage verifier**

Replace `tools/verify-fomalhaut-home.cjs` with:

```js
const fs = require('node:fs');
const path = require('node:path');

function read(file) {
  return fs.readFileSync(path.join(process.cwd(), file), 'utf8');
}

function mustContain(file, marker) {
  const text = read(file);
  if (!text.includes(marker)) {
    throw new Error(`Missing "${marker}" in ${file}`);
  }
}

mustContain('public/index.html', 'data-pasule-home-hero');
mustContain('public/index.html', 'data-pasule-hero-slide');
mustContain('public/index.html', 'data-pasule-music-player');
mustContain('public/about/index.html', 'data-pasule-music-player');
mustContain('public/index.html', 'id="recent-posts"');
mustContain('public/index.html', 'data-pasule-nav-grouped');
mustContain('public/index.html', 'APlayer.min.css');
mustContain('public/index.html', 'Meting.min.js');
mustContain('public/style.css', '.pasule-home-media-hero');
mustContain('public/style.css', '.pasule-global-music');
mustContain('public/js/pasule-fomalhaut-ui.js', 'initPasuleMediaHero');
mustContain('public/js/pasule-fomalhaut-ui.js', 'initPasuleGlobalMusic');

console.log('verify-fomalhaut-home: checks passed');
```

- [ ] **Step 2: Add broad regression assertions**

In `tools/verify-generated-pages.cjs`, after:

```js
expectContains('public/index.html', 'Pasule Blog');
```

insert:

```js
expectContains('public/index.html', 'data-pasule-home-hero');
expectContains('public/index.html', 'data-pasule-music-player');
expectContains('public/about/index.html', 'data-pasule-music-player');
expectContains('public/index.html', 'data-pasule-music-empty');
expectNotContains('public/index.html', '<meting-js');
```

Keep the existing checks that ensure no old `data-pasule-home-shell`, `data-pasule-home-side`, or `data-pasule-home-profile` block is injected.

- [ ] **Step 3: Run the build and verify the checks fail**

Run:

```powershell
npm run build
node tools/verify-fomalhaut-home.cjs
```

Expected:

```text
Error: Missing "data-pasule-home-hero" in public/index.html
```

Do not commit this failing state. Continue to Task 2.

### Task 2: Add Config And HTML Injection

**Files:**
- Modify: `source/_data/content-map.yml`
- Modify: `scripts/pasule-home-shell.js`

- [ ] **Step 1: Add homepage media and music configuration**

In `source/_data/content-map.yml`, add this block inside `home`, after the existing `carousel` block and before `topic_atlas`:

```yaml
  media_hero:
    enabled: true
    interval: 5200
    images:
      - src: /img/2.jpg
        title: "Pasule Blog"
        subtitle: "记录技术文章、项目实验和日常折腾。"
      - src: https://pic1.imgdb.cn/item/6805d3a258cb8da5c8bb423b.jpg
        title: "技术、实验与日常"
        subtitle: "把值得复盘的东西留在这里。"
      - src: https://bu.dusays.com/2026/04/04/69d11d25cc720.jpg
        title: "生活与折腾现场"
        subtitle: "让相册和技术记录在首页都有一点存在感。"
  music:
    enabled: true
    provider: netease
    type: playlist
    id: ""
    title: "Pasule Radio"
    subtitle: "网易云歌单源未填写。"
```

- [ ] **Step 2: Add safe rendering helpers**

In `scripts/pasule-home-shell.js`, add these helpers after `findPostByTitle`:

```js
function escapeHtml(input) {
  return String(input || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function normalizeInterval(input, fallback = 5200) {
  const value = Number(input);
  return Number.isFinite(value) && value >= 2000 ? value : fallback;
}

function normalizeMusicType(input) {
  const value = String(input || 'playlist').trim().toLowerCase();
  return ['song', 'playlist', 'album', 'artist'].includes(value) ? value : 'playlist';
}
```

- [ ] **Step 3: Add media hero builder**

In `scripts/pasule-home-shell.js`, add this function after `normalizeMusicType`:

```js
function buildMediaHero(home) {
  const config = home && home.media_hero;
  const images = ((config && config.images) || []).filter(item => item && item.src);

  if (!config || config.enabled === false || !images.length) return '';

  const interval = normalizeInterval(config.interval);
  const slides = images.map((item, index) => {
    const active = index === 0 ? ' is-active' : '';
    return `
      <figure class="pasule-hero-slide${active}" data-pasule-hero-slide>
        <img src="${normalizeAsset(item.src)}" alt="${escapeHtml(item.title || 'Pasule hero image')}" loading="${index === 0 ? 'eager' : 'lazy'}" onerror="this.onerror=null;this.src='/img/404.jpg'">
        <figcaption class="pasule-hero-caption">
          ${item.title ? `<strong>${escapeHtml(item.title)}</strong>` : ''}
          ${item.subtitle ? `<span>${escapeHtml(item.subtitle)}</span>` : ''}
        </figcaption>
      </figure>
    `;
  }).join('');

  const dots = images.map((item, index) => {
    const active = index === 0 ? ' is-active' : '';
    const label = escapeHtml(item.title || `slide ${index + 1}`);
    return `<button class="pasule-hero-dot${active}" type="button" data-pasule-hero-dot="${index}" aria-label="${label}"></button>`;
  }).join('');

  return `
    <section class="pasule-home-enhancement" data-pasule-home-enhancement>
      <section class="pasule-home-media-hero" data-pasule-home-hero data-interval="${interval}">
        <div class="pasule-hero-track">
          ${slides}
        </div>
        <div class="pasule-hero-copy-panel">
          <p class="pasule-eyebrow">Pasule Station</p>
          <h2>技术文章、项目实验和日常折腾的入口</h2>
          <p>先从最近的记录开始，也可以去项目、相册和归档里慢慢翻。</p>
          <div class="pasule-hero-actions">
            <a class="pasule-primary-link" href="/archives/">浏览文章</a>
            <a class="pasule-secondary-link" href="/gallery/">打开相册</a>
          </div>
        </div>
        <div class="pasule-hero-controls" aria-label="首页照片轮换">
          ${dots}
        </div>
      </section>
    </section>
  `;
}
```

- [ ] **Step 4: Add music player builder**

In `scripts/pasule-home-shell.js`, add these functions after `buildMediaHero`:

```js
function buildMetingElement(music) {
  const id = String((music && music.id) || '').trim();
  if (!id) {
    return '<p class="pasule-global-music-empty" data-pasule-music-empty>歌单源未填写</p>';
  }

  return `
    <meting-js
      data-pasule-meting
      server="netease"
      type="${normalizeMusicType(music.type)}"
      id="${escapeHtml(id)}"
      fixed="false"
      mini="false"
      autoplay="false"
      mutex="true"
      preload="none"
      theme="#4f7df3"
      list-folded="true">
    </meting-js>
  `;
}

function buildGlobalMusic(home) {
  const music = (home && home.music) || {};
  if (music.enabled === false) return '';

  const title = escapeHtml(music.title || 'Pasule Radio');
  const subtitle = escapeHtml(music.subtitle || '网易云歌单源未填写。');

  return `
    <aside class="pasule-global-music" data-pasule-music-player>
      <button class="pasule-global-music-toggle" type="button" data-pasule-music-toggle aria-label="${title}" aria-expanded="false" aria-controls="pasule-global-music-panel" title="${title}">
        <i class="fas fa-music" aria-hidden="true"></i>
      </button>
      <section class="pasule-global-music-panel" id="pasule-global-music-panel" data-pasule-music-panel hidden>
        <header class="pasule-global-music-head">
          <div>
            <p class="pasule-card-kicker">Music</p>
            <h2>${title}</h2>
            <p>${subtitle}</p>
          </div>
          <button class="pasule-global-music-close" type="button" data-pasule-music-close aria-label="收起音乐播放器">
            <i class="fas fa-xmark" aria-hidden="true"></i>
          </button>
        </header>
        <div class="pasule-global-music-body">
          ${buildMetingElement(music)}
        </div>
      </section>
    </aside>
  `;
}
```

- [ ] **Step 5: Inject hero on homepage and music on every page**

Replace the existing `after_render:html` filter in `scripts/pasule-home-shell.js` with:

```js
hexo.extend.filter.register('after_render:html', function (html, data) {
  if (!data || !data.path || !data.path.endsWith('.html')) return html;

  const $ = cheerio.load(html, { decodeEntities: false });
  const map = ((hexo.locals.get('data') || {})['content-map']) || {};
  const home = map.home || {};

  if (data.path === 'index.html') {
    $('body').addClass('pasule-home-page');
    $('#nav').attr('data-pasule-nav-grouped', 'true');

    if (!$('[data-pasule-home-hero]').length) {
      const hero = buildMediaHero(home);
      const recentPosts = $('#recent-posts');

      if (hero && recentPosts.length) {
        recentPosts.before(hero);
      } else if (hero) {
        $('#content-inner').prepend(hero);
      }
    }
  }

  if (!$('[data-pasule-music-player]').length) {
    const player = buildGlobalMusic(home);
    if (player && $('body').length) {
      $('body').append(player);
    }
  }

  return $.html();
});
```

- [ ] **Step 6: Build and inspect targeted HTML markers**

Run:

```powershell
npm run build
Select-String -Path 'public/index.html' -Pattern 'data-pasule-home-hero','data-pasule-music-player','data-pasule-music-empty'
Select-String -Path 'public/about/index.html' -Pattern 'data-pasule-music-player'
```

Expected:

```text
public/index.html:... data-pasule-home-hero
public/index.html:... data-pasule-music-player
public/index.html:... data-pasule-music-empty
public/about/index.html:... data-pasule-music-player
```

### Task 3: Add Browser Behavior

**Files:**
- Modify: `source/js/pasule-fomalhaut-ui.js`

- [ ] **Step 1: Add global state for the new interactions**

At the top of `source/js/pasule-fomalhaut-ui.js`, after the existing handler variables, add:

```js
let pasuleMediaHeroTimer = null;
let pasuleMusicKeyHandler = null;
```

- [ ] **Step 2: Add media hero rotation**

After `initPasuleHomeEffects`, add:

```js
function initPasuleMediaHero() {
  if (pasuleMediaHeroTimer) {
    window.clearInterval(pasuleMediaHeroTimer);
    pasuleMediaHeroTimer = null;
  }

  const root = document.querySelector('[data-pasule-home-hero]');
  if (!root) return;

  const slides = Array.from(root.querySelectorAll('[data-pasule-hero-slide]'));
  const dots = Array.from(root.querySelectorAll('[data-pasule-hero-dot]'));
  const interval = Math.max(Number(root.getAttribute('data-interval')) || 5200, 2000);
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activeIndex = Math.max(slides.findIndex(slide => slide.classList.contains('is-active')), 0);
  let isPaused = false;

  if (!slides.length) return;

  const render = () => {
    slides.forEach((slide, index) => {
      const active = index === activeIndex;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
    });

    dots.forEach((dot, index) => {
      const active = index === activeIndex;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-current', active ? 'true' : 'false');
    });
  };

  const goTo = (index) => {
    activeIndex = (index + slides.length) % slides.length;
    render();
  };

  if (!root.dataset.pasuleHeroBound) {
    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        goTo(Number(dot.getAttribute('data-pasule-hero-dot')) || 0);
      });
    });

    root.addEventListener('mouseenter', () => {
      isPaused = true;
    });

    root.addEventListener('mouseleave', () => {
      isPaused = false;
    });

    root.dataset.pasuleHeroBound = 'true';
  }

  render();

  if (!reduceMotion && slides.length > 1) {
    pasuleMediaHeroTimer = window.setInterval(() => {
      if (!isPaused) goTo(activeIndex + 1);
    }, interval);
  }
}
```

- [ ] **Step 3: Add global music panel behavior**

After `initPasuleMediaHero`, add:

```js
function initPasuleGlobalMusic() {
  const root = document.querySelector('[data-pasule-music-player]');
  if (!root) return;

  const toggle = root.querySelector('[data-pasule-music-toggle]');
  const close = root.querySelector('[data-pasule-music-close]');
  const panel = root.querySelector('[data-pasule-music-panel]');
  const storageKey = 'pasule-global-music-open';

  if (!toggle || !panel) return;

  const setOpen = (open, persist = true) => {
    root.classList.toggle('is-open', open);
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');

    if (persist) {
      localStorage.setItem(storageKey, open ? 'true' : 'false');
    }
  };

  if (!root.dataset.pasuleMusicBound) {
    toggle.addEventListener('click', () => {
      setOpen(!root.classList.contains('is-open'));
    });

    if (close) {
      close.addEventListener('click', () => {
        setOpen(false);
      });
    }

    root.dataset.pasuleMusicBound = 'true';
  }

  if (pasuleMusicKeyHandler) {
    document.removeEventListener('keydown', pasuleMusicKeyHandler);
    pasuleMusicKeyHandler = null;
  }

  pasuleMusicKeyHandler = (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  document.addEventListener('keydown', pasuleMusicKeyHandler);
  setOpen(localStorage.getItem(storageKey) === 'true', false);
}
```

- [ ] **Step 4: Register the new initializers**

At the bottom of `source/js/pasule-fomalhaut-ui.js`, add these listeners beside the existing ones:

```js
document.addEventListener('DOMContentLoaded', initPasuleMediaHero);
document.addEventListener('DOMContentLoaded', initPasuleGlobalMusic);
document.addEventListener('pjax:complete', initPasuleMediaHero);
document.addEventListener('pjax:complete', initPasuleGlobalMusic);
```

- [ ] **Step 5: Build and inspect copied JavaScript**

Run:

```powershell
npm run build
Select-String -Path 'public/js/pasule-fomalhaut-ui.js' -Pattern 'initPasuleMediaHero','initPasuleGlobalMusic'
```

Expected:

```text
public/js/pasule-fomalhaut-ui.js:... initPasuleMediaHero
public/js/pasule-fomalhaut-ui.js:... initPasuleGlobalMusic
```

### Task 4: Add Styling And Music Assets

**Files:**
- Modify: `source/css/modify.styl`
- Modify: `_config.butterfly.yml`

- [ ] **Step 1: Load APlayer and MetingJS assets**

In `_config.butterfly.yml`, update the `inject` block so it includes APlayer CSS in `head` and APlayer/MetingJS scripts in `bottom`:

```yaml
inject:
  head:
    - <link rel="stylesheet" href="/css/modify.css">
    - <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.css">
    - <link rel="stylesheet" href="https://npm.elemecdn.com/hexo-butterfly-swiper/lib/swiper.min.css">
    - <link rel="stylesheet" href="https://npm.elemecdn.com/hexo-butterfly-wowjs/lib/animate.min.css">
  bottom:
    - <script src="https://npm.elemecdn.com/hexo-butterfly-swiper/lib/swiper.min.js"></script>
    - <script src="https://npm.elemecdn.com/hexo-butterfly-wowjs/lib/wow.min.js"></script>
    - <script src="https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.js"></script>
    - <script src="https://cdn.jsdelivr.net/npm/meting/dist/Meting.min.js"></script>
    - <script src="/js/pasule-fomalhaut-ui.js" data-pjax></script>
```

- [ ] **Step 2: Add homepage hero styles**

Append this block to `source/css/modify.styl`:

```stylus
// Homepage media hero and global music player.
.pasule-home-enhancement
  width: 100%
  margin: 0 auto 22px

.pasule-home-media-hero
  position: relative
  display: grid
  min-height: 360px
  overflow: hidden
  border-radius: 24px
  border: 1px solid rgba(255,255,255,.66)
  background: rgba(18,24,38,.18)
  box-shadow: 0 18px 42px rgba(36,48,72,.16)
  isolation: isolate

.pasule-hero-track,
.pasule-hero-slide,
.pasule-hero-slide img
  position: absolute
  inset: 0
  width: 100%
  height: 100%

.pasule-hero-slide
  margin: 0
  opacity: 0
  transform: scale(1.02)
  transition: opacity .7s var(--pasule-ease), transform 1.2s var(--pasule-ease)

  &.is-active
    opacity: 1
    transform: scale(1)

  img
    object-fit: cover

  &:after
    position: absolute
    inset: 0
    background: linear-gradient(90deg, rgba(12,18,32,.68), rgba(12,18,32,.22) 56%, rgba(12,18,32,.1))
    content: ''

.pasule-hero-caption
  position: absolute
  right: 22px
  bottom: 20px
  z-index: 2
  display: grid
  max-width: min(320px, calc(100% - 44px))
  gap: 4px
  padding: 12px 14px
  border-radius: 14px
  border: 1px solid rgba(255,255,255,.22)
  background: rgba(12,18,32,.32)
  color: rgba(255,255,255,.92)
  backdrop-filter: blur(12px)
  -webkit-backdrop-filter: blur(12px)

  strong
    line-height: 1.35

  span
    line-height: 1.55
    font-size: .88rem

.pasule-hero-copy-panel
  position: relative
  z-index: 3
  display: grid
  align-content: center
  max-width: 560px
  min-height: inherit
  padding: 38px
  color: #fff

  h2
    margin: 0
    font-size: 2.35rem
    line-height: 1.18
    letter-spacing: 0

  p
    margin: 0
    max-width: 42rem
    line-height: 1.75
    color: rgba(255,255,255,.84)

  .pasule-eyebrow
    color: rgba(255,255,255,.72)

.pasule-hero-controls
  position: absolute
  left: 38px
  bottom: 28px
  z-index: 4
  display: flex
  align-items: center
  gap: 8px

.pasule-hero-dot
  width: 10px
  height: 10px
  padding: 0
  border: 0
  border-radius: 999px
  background: rgba(255,255,255,.48)
  cursor: pointer
  transition: width .24s var(--pasule-ease), background .24s var(--pasule-ease)

  &.is-active
    width: 30px
    background: #fff

  &:focus-visible
    outline: 3px solid rgba(255,255,255,.34)
    outline-offset: 3px
```

- [ ] **Step 3: Add global music styles**

Append this block after the hero styles:

```stylus
.pasule-global-music
  position: fixed
  right: 18px
  bottom: 154px
  z-index: 90
  color: var(--pasule-ink)

.pasule-global-music-toggle,
.pasule-global-music-close
  display: inline-flex
  align-items: center
  justify-content: center
  border: 0
  cursor: pointer

.pasule-global-music-toggle
  width: 44px
  height: 44px
  border-radius: 12px
  background: var(--pasule-surface-strong)
  color: var(--pasule-accent)
  box-shadow: var(--pasule-shadow-soft)
  transition: transform .2s var(--pasule-ease), box-shadow .2s var(--pasule-ease)

  &:hover
    transform: translateY(-2px)
    box-shadow: var(--pasule-shadow-lift)

  &:focus-visible
    outline: 3px solid var(--pasule-focus-ring)
    outline-offset: 3px

.pasule-global-music-panel
  position: absolute
  right: 0
  bottom: 54px
  width: min(340px, calc(100vw - 28px))
  overflow: hidden
  border-radius: 18px
  border: 1px solid var(--pasule-border)
  background: var(--pasule-surface-strong)
  box-shadow: 0 18px 42px rgba(36,48,72,.18)
  backdrop-filter: blur(16px) saturate(112%)
  -webkit-backdrop-filter: blur(16px) saturate(112%)

  &[hidden]
    display: none

.pasule-global-music-head
  display: flex
  align-items: flex-start
  justify-content: space-between
  gap: 12px
  padding: 16px 16px 10px
  border-bottom: 1px solid var(--pasule-border)

  h2
    margin: 0
    font-size: 1rem
    line-height: 1.3

  p
    margin: 0
    color: var(--pasule-muted)
    line-height: 1.55
    font-size: .84rem

.pasule-global-music-close
  width: 34px
  height: 34px
  border-radius: 10px
  background: var(--pasule-accent-soft)
  color: var(--pasule-accent)

.pasule-global-music-body
  padding: 12px

  .aplayer
    margin: 0
    border-radius: 12px
    box-shadow: none
    background: transparent

.pasule-global-music-empty
  margin: 0
  padding: 14px
  border-radius: 12px
  background: var(--pasule-surface-soft)
  color: var(--pasule-muted)
  line-height: 1.65
```

- [ ] **Step 4: Add responsive, dark-mode, and reduced-motion styles**

Append this block after the music styles:

```stylus
[data-theme='dark']
  .pasule-home-media-hero
    border-color: rgba(155,176,235,.16)
    box-shadow: 0 18px 42px rgba(0,0,0,.32)

  .pasule-global-music-panel,
  .pasule-global-music-toggle
    background: var(--pasule-surface-strong)
    border-color: var(--pasule-border)

@media screen and (max-width: 900px)
  .pasule-home-media-hero
    min-height: 300px
    border-radius: 18px

  .pasule-hero-copy-panel
    padding: 28px

  .pasule-hero-caption
    right: 16px
    bottom: 16px

  .pasule-hero-controls
    left: 28px
    bottom: 22px

@media screen and (max-width: 768px)
  .pasule-home-enhancement
    margin-bottom: 18px

  .pasule-home-media-hero
    min-height: 280px

  .pasule-hero-copy-panel
    padding: 22px
    padding-bottom: 74px

    h2
      font-size: 1.55rem

  .pasule-hero-caption
    display: none

  .pasule-hero-controls
    left: 22px
    bottom: 22px

  .pasule-global-music
    right: 14px
    bottom: 112px

@media (prefers-reduced-motion: reduce)
  .pasule-hero-slide,
  .pasule-hero-dot,
  .pasule-global-music-toggle
    transition: none
```

- [ ] **Step 5: Build and inspect CSS/asset markers**

Run:

```powershell
npm run build
Select-String -Path 'public/style.css' -Pattern '.pasule-home-media-hero','.pasule-global-music'
Select-String -Path 'public/index.html' -Pattern 'APlayer.min.css','APlayer.min.js','Meting.min.js'
```

Expected:

```text
public/style.css:... .pasule-home-media-hero
public/style.css:... .pasule-global-music
public/index.html:... APlayer.min.css
public/index.html:... APlayer.min.js
public/index.html:... Meting.min.js
```

### Task 5: Run Full Verification And Commit

**Files:**
- Verify generated output under `public/`
- Commit modified source files

- [ ] **Step 1: Run the complete build**

Run:

```powershell
npm run build
```

Expected:

```text
INFO  Generated: index.html
INFO  Generated: about/index.html
INFO  Generated: css/modify.css
INFO  Generated: js/pasule-fomalhaut-ui.js
```

The exact generated file list can include more pages, but the command must exit with code `0`.

- [ ] **Step 2: Run focused and broad smoke checks**

Run:

```powershell
node tools/verify-fomalhaut-home.cjs
node tools/verify-generated-pages.cjs
```

Expected:

```text
verify-fomalhaut-home: checks passed
verify-generated-pages: checks passed
```

- [ ] **Step 3: Inspect git diff**

Run:

```powershell
git diff --stat
git diff -- source/_data/content-map.yml scripts/pasule-home-shell.js source/js/pasule-fomalhaut-ui.js source/css/modify.styl _config.butterfly.yml tools/verify-fomalhaut-home.cjs tools/verify-generated-pages.cjs
```

Expected:

```text
source/_data/content-map.yml
scripts/pasule-home-shell.js
source/js/pasule-fomalhaut-ui.js
source/css/modify.styl
_config.butterfly.yml
tools/verify-fomalhaut-home.cjs
tools/verify-generated-pages.cjs
```

Confirm no unrelated files appear in the diff.

- [ ] **Step 4: Commit the implementation**

Run:

```powershell
git add -- source/_data/content-map.yml scripts/pasule-home-shell.js source/js/pasule-fomalhaut-ui.js source/css/modify.styl _config.butterfly.yml tools/verify-fomalhaut-home.cjs tools/verify-generated-pages.cjs
git commit -m "feat: add home media hero and music player"
```

Expected:

```text
[hexo-source ...] feat: add home media hero and music player
```

### Task 6: Browser Verification

**Files:**
- Verify rendered site through local server

- [ ] **Step 1: Start the Hexo server**

Run:

```powershell
npm run server -- -p 4000
```

Expected:

```text
Hexo is running at http://localhost:4000/
```

If port `4000` is already in use, run:

```powershell
npm run server -- -p 4001
```

- [ ] **Step 2: Check the homepage in a browser**

Open:

```text
http://localhost:4000/
```

Expected:

- The first content block above the article list is a photo hero.
- The hero shows the `Pasule Station` eyebrow and two buttons: `浏览文章` and `打开相册`.
- The hero image changes after roughly five seconds when reduced motion is not enabled.
- The music button appears near the right-side controls.
- Clicking the music button opens a compact panel.
- With the empty music ID, the panel shows `歌单源未填写` and no broken `<meting-js>` player.
- There is no horizontal scroll at desktop width or mobile width.

- [ ] **Step 3: Check a regular page**

Open:

```text
http://localhost:4000/about/
```

Expected:

- The homepage photo hero is absent.
- The music button is present.
- The music panel expands and collapses.
- Existing about-page content remains visible.

- [ ] **Step 4: Stop the server**

Stop the running Hexo server with `Ctrl+C`.

Expected:

```text
INFO  Have a nice day
```
