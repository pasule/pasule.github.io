# Fomalhaut-Inspired Home And Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the current Butterfly-based homepage and sidebar so the site feels much closer to Fomalhaut's content-station style while preserving the current background images, Live2D, and existing page set.

**Architecture:** Keep `theme: butterfly` and build the Fomalhaut-inspired behavior as a layered enhancement on top of the current codebase. Reuse existing `content-map.yml`, `widget.yml`, homepage filter scripts, and Butterfly dark mode where possible; add only the minimum external plugin surface needed for the carousel and lightweight motion. Treat the local `hexo-theme-Fomalhaut/` directory as reference-only and do not wire it into the active Hexo build.

**Tech Stack:** Hexo 7.3, Butterfly 5.3.5, Stylus, local Hexo filter scripts, `hexo-butterfly-swiper`, `hexo-butterfly-wowjs`, existing `tools/verify-generated-pages.cjs`

---

## Scope Check

This plan covers the next implementation slice after the first-cycle redesign work and focuses only on the homepage, navigation, sidebar, and supporting interaction layer.

In scope:

- grouped top navigation inspired by Fomalhaut
- homepage hero replaced by a large manual-feature carousel
- homepage announcement / welcome block refinement
- richer homepage curated sections under the carousel
- stronger sidebar information panels
- improved dark mode / light mode experience for the homepage shell
- lightweight interaction scripts such as nav title switching and reading progress
- hiding the reference repository from source-control noise

Out of scope:

- wholesale migration to the Fomalhaut codebase
- replacing current background images
- replacing current Live2D
- importing Vue 2, Element UI, or WinBox in this round
- IP geolocation greeting
- heavy holiday effects like lanterns / fireworks / snow by default
- article-page deep restyling beyond what is required to keep scripts coherent

## File Structure

### Files To Create

- `docs/superpowers/plans/2026-04-09-fomalhaut-inspired-home-sidebar-implementation.md`
  Responsibility: this execution plan document.
- `scripts/pasule-fomalhaut-ui.js`
  Responsibility: lightweight homepage and navigation interaction script for reading progress, nav title switching, and optional homepage initialization hooks.
- `tools/verify-fomalhaut-home.cjs`
  Responsibility: focused smoke test for carousel, grouped nav, sidebar panel markers, and dark-mode hook markers.

### Files To Modify

- `.gitignore`
  Responsibility: ignore the local `hexo-theme-Fomalhaut/` reference repository so it does not pollute source control.
- `package.json`
  Responsibility: add the minimum new plugin dependencies required for the homepage carousel and light animation.
- `package-lock.json`
  Responsibility: lock the new dependency graph after installation.
- `_config.butterfly.yml`
  Responsibility: regroup navigation, wire the homepage carousel plugin, tune dark mode settings, and refine sidebar widgets.
- `source/_data/content-map.yml`
  Responsibility: add manual homepage carousel data and richer welcome/sidebar section data.
- `source/_data/widget.yml`
  Responsibility: expand quick-jump and signal widgets into stronger Fomalhaut-like information panels.
- `scripts/pasule-home-shell.js`
  Responsibility: replace the current static hero-first homepage shell with a carousel-led homepage layout and richer curated sections.
- `source/css/modify.styl`
  Responsibility: implement grouped nav styling, carousel shell styling, sidebar panel styling, and stronger day/night theme differentiation.
- `source/_data/styles.styl`
  Responsibility: keep card-level layout consistency aligned with the new homepage shell.
- `tools/verify-generated-pages.cjs`
  Responsibility: extend the existing smoke test to cover new homepage, nav, and sidebar markers.

### Existing Reference Files To Read During Execution

- `hexo-theme-Fomalhaut/_config.butterfly.yml`
  Responsibility: grouped navigation structure and injection ideas.
- `hexo-theme-Fomalhaut/_config.yml`
  Responsibility: swiper plugin configuration examples.
- `hexo-theme-Fomalhaut/source/js/fomal.js`
  Responsibility: reference logic for reading progress and nav title behavior.
- `hexo-theme-Fomalhaut/themes/butterfly/source/css/_custom/custom.css`
  Responsibility: reference for grouped nav positioning, card feel, and slider styling.

## Task 1: Prepare The Repo And Verification Baseline

**Files:**
- Modify: `.gitignore`
- Create: `tools/verify-fomalhaut-home.cjs`
- Modify: `tools/verify-generated-pages.cjs`

- [ ] **Step 1: Write the focused failing verification script for the Fomalhaut-inspired homepage slice**

Create `tools/verify-fomalhaut-home.cjs` with this exact content:

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

mustContain('public/index.html', 'data-pasule-home-carousel');
mustContain('public/index.html', 'data-pasule-feature-panels');
mustContain('public/index.html', 'data-pasule-announcement-panel');
mustContain('public/index.html', 'data-pasule-nav-grouped');
mustContain('public/style.css', '.pasule-home-carousel');
mustContain('public/style.css', '.pasule-nav-group');

console.log('verify-fomalhaut-home: checks passed');
```

- [ ] **Step 2: Extend the general verification script with the new homepage expectations**

Append these exact assertions before the final `console.log(...)` in `tools/verify-generated-pages.cjs`:

```js
expectContains('public/index.html', 'data-pasule-home-carousel');
expectContains('public/index.html', 'data-pasule-nav-grouped');
expectContains('public/index.html', 'data-pasule-announcement-panel');
expectContains('public/style.css', '.pasule-home-carousel');
expectContains('public/style.css', '.pasule-nav-group');
```

- [ ] **Step 3: Make the local Fomalhaut reference repository invisible to normal git status**

Append this exact line to `.gitignore` if it is not already present:

```gitignore
hexo-theme-Fomalhaut/
```

- [ ] **Step 4: Run the current build and verify the new tests fail for the right reason**

Run:

```powershell
npm run build
node tools/verify-generated-pages.cjs
node tools/verify-fomalhaut-home.cjs
```

Expected:

- `npm run build` succeeds
- both verifier commands fail
- the first missing marker should be one of the new homepage markers such as `data-pasule-home-carousel`

- [ ] **Step 5: Commit the verification baseline**

Run:

```bash
git add .gitignore tools/verify-generated-pages.cjs tools/verify-fomalhaut-home.cjs
git commit -m "test: add fomalhaut-inspired homepage verification baseline"
```

## Task 2: Add The Minimal Carousel And Motion Plugin Foundation

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Add the failing dependency expectation to the plan-local checklist**

Use this exact target dependency block in `package.json`:

```json
{
  "dependencies": {
    "hexo-butterfly-swiper": "^1.0.12",
    "hexo-butterfly-wowjs": "^1.0.5"
  }
}
```

- [ ] **Step 2: Update `package.json` with the new dependencies**

Add these exact entries under `"dependencies"`:

```json
"hexo-butterfly-swiper": "^1.0.12",
"hexo-butterfly-wowjs": "^1.0.5",
```

- [ ] **Step 3: Install and lock the new dependencies**

Run:

```powershell
npm install
```

Expected:

- `package-lock.json` is updated
- `npm install` exits with code `0`

- [ ] **Step 4: Re-run the build to confirm the new dependencies do not break the current site**

Run:

```powershell
npm run build
```

Expected:

- build succeeds
- verifiers still fail only because the new homepage/nav features are not implemented yet

- [ ] **Step 5: Commit the plugin foundation**

Run:

```bash
git add package.json package-lock.json
git commit -m "build: add carousel and motion plugin foundation"
```

## Task 3: Replace The Flat Navigation With A Grouped Fomalhaut-Inspired Structure

**Files:**
- Modify: `_config.butterfly.yml`
- Modify: `source/css/modify.styl`
- Modify: `tools/verify-generated-pages.cjs`

- [ ] **Step 1: Add a failing grouped-navigation marker expectation**

Append this exact assertion to `tools/verify-generated-pages.cjs` if not already present:

```js
expectContains('public/index.html', 'data-pasule-nav-grouped');
```

- [ ] **Step 2: Replace the flat menu with grouped menu definitions**

Update the `menu:` block in `_config.butterfly.yml` to this exact structure:

```yml
menu:
  首页: /
  文章 || fas fa-book || hide:
    归档: /archives/
    标签: /tags/
    分类: /categories/
  生活 || fas fa-feather || hide:
    说说: /shuoshuo/
    相册: /gallery/
  站点 || fas fa-box-archive || hide:
    项目: /projects/
    留言板: /comments/ || fas fa-envelope
    友链: /link/
  关于: /about/
```

- [ ] **Step 3: Add grouped-nav style hooks and a nav marker**

Append this exact block to `source/css/modify.styl`:

```stylus
body
  --pasule-nav-pill-bg: rgba(255,255,255,.72)
  --pasule-nav-pill-border: rgba(114,128,167,.16)

#nav[data-pasule-nav-grouped]
  .menus_items
    display: flex
    align-items: center
    gap: 8px

  .menus_item > a.site-page
    padding: 8px 14px
    border-radius: 999px
    background: var(--pasule-nav-pill-bg)
    border: 1px solid var(--pasule-nav-pill-border)

.pasule-nav-group
  display: inline-flex
  align-items: center
  gap: 8px
```

- [ ] **Step 4: Inject a marker on the navigation container via the existing home shell script**

Add this exact line inside `scripts/pasule-home-shell.js` after `const $ = cheerio.load(html, { decodeEntities: false });`:

```js
$('#nav').attr('data-pasule-nav-grouped', 'true');
```

- [ ] **Step 5: Build and verify grouped navigation markers**

Run:

```powershell
npm run build
node tools/verify-generated-pages.cjs
```

Expected:

- build succeeds
- navigation-related checks pass
- homepage carousel checks still fail because the carousel layout is not built yet

- [ ] **Step 6: Commit the grouped navigation layer**

Run:

```bash
git add _config.butterfly.yml source/css/modify.styl scripts/pasule-home-shell.js tools/verify-generated-pages.cjs
git commit -m "feat: add grouped fomalhaut-inspired navigation"
```

## Task 4: Replace The Current Hero With A Large Manual Carousel-Led Homepage

**Files:**
- Modify: `source/_data/content-map.yml`
- Modify: `_config.butterfly.yml`
- Modify: `scripts/pasule-home-shell.js`
- Modify: `source/css/modify.styl`
- Modify: `tools/verify-generated-pages.cjs`
- Modify: `tools/verify-fomalhaut-home.cjs`

- [ ] **Step 1: Add manual carousel data to the content map**

Insert this exact block under `home:` in `source/_data/content-map.yml`:

```yml
  carousel:
    title: "Pasule Featured Station"
    items:
      - title: "微服务架构设计原理与最佳实践"
        summary: "从单体到微服务的完整演进路线，适合作为首页主打专题。"
        link_title: "进入文章"
      - title: "Java并发编程深度解析：从理论到实践"
        summary: "并发、JMM 与同步工具放在首页首屏，最能体现技术站主线。"
        link_title: "开始阅读"
      - title: "MySQL索引优化完全指南：从原理到实战"
        summary: "数据库性能线的代表文章，适合作为首页精选之一。"
        link_title: "查看全文"
      - title: "前端性能优化实战：从加载到渲染全面提速"
        summary: "让首页内容覆盖后端、数据库与前端三条主线。"
        link_title: "阅读文章"
```

- [ ] **Step 2: Add the plugin config and homepage motion hook**

Add these exact blocks to `_config.butterfly.yml`:

```yml
inject:
  head:
    - <link rel="stylesheet" href="https://npm.elemecdn.com/hexo-butterfly-swiper/lib/swiper.min.css">
    - <link rel="stylesheet" href="https://npm.elemecdn.com/hexo-butterfly-wowjs/lib/animate.min.css">
  bottom:
    - <script src="https://npm.elemecdn.com/hexo-butterfly-swiper/lib/swiper.min.js"></script>
    - <script src="https://npm.elemecdn.com/hexo-butterfly-wowjs/lib/wow.min.js"></script>
```

```yml
darkmode:
  enable: true
  button: true
  autoChangeMode: false
```

- [ ] **Step 3: Replace the existing hero-first homepage shell with a carousel-led structure**

Update `scripts/pasule-home-shell.js` so that:

- `buildHomeShell(...)` renders a top-level section with `data-pasule-home-carousel`
- it creates a `swiper-container` block using the manual `home.carousel.items`
- the existing featured deck moves below the carousel
- the announcement area gets `data-pasule-announcement-panel`
- the section wrapping the panels under the carousel gets `data-pasule-feature-panels`

Use this exact carousel HTML shape inside the returned shell:

```js
    <section class="pasule-home-carousel" data-pasule-home-carousel>
      <div class="pasule-carousel-head">
        <p class="pasule-eyebrow">${hero.eyebrow}</p>
        <h1>${hero.title}</h1>
        <p class="pasule-hero-copy">${hero.description}</p>
      </div>
      <div class="swiper pasule-swiper">
        <div class="swiper-wrapper">${carouselSlides}</div>
        <div class="swiper-pagination"></div>
      </div>
    </section>
```

And generate each slide in this exact shape:

```js
      <article class="swiper-slide pasule-slide-card">
        <p class="pasule-card-kicker">Featured Slide</p>
        <h3>${post.title}</h3>
        <p>${item.summary}</p>
        <a class="pasule-primary-link" href="${normalizeLink(post.path)}">${item.link_title}</a>
      </article>
```

- [ ] **Step 4: Add the required carousel and panel styling**

Append this exact block to `source/css/modify.styl`:

```stylus
.pasule-home-carousel
  padding: 24px
  border-radius: 28px
  border: 1px solid var(--pasule-line)
  background: linear-gradient(135deg, rgba(255,237,246,.94), rgba(230,242,255,.94))
  box-shadow: var(--pasule-shadow)

.pasule-swiper
  margin-top: 18px

.pasule-slide-card
  min-height: 260px
  padding: 26px
  border-radius: 24px
  background: rgba(255,255,255,.78)
  border: 1px solid var(--pasule-line)

.pasule-carousel-head
  max-width: 54rem

[data-pasule-feature-panels]
  display: grid
  gap: 18px

[data-pasule-announcement-panel]
  padding: 20px
  border-radius: 22px
  border: 1px solid var(--pasule-line)
  background: rgba(255,255,255,.76)
```

- [ ] **Step 5: Add a minimal Swiper/WOW initializer**

Create `scripts/pasule-fomalhaut-ui.js` with this exact content:

```js
'use strict';

function initPasuleHomeEffects() {
  if (typeof Swiper === 'function' && document.querySelector('.pasule-swiper')) {
    new Swiper('.pasule-swiper', {
      loop: true,
      autoplay: { delay: 4200 },
      pagination: {
        el: '.swiper-pagination',
        clickable: true
      }
    });
  }

  if (typeof WOW === 'function') {
    new WOW().init();
  }
}

document.addEventListener('DOMContentLoaded', initPasuleHomeEffects);
document.addEventListener('pjax:complete', initPasuleHomeEffects);
```

Then add this exact line to `_config.butterfly.yml` under `inject.bottom:`:

```yml
    - <script src="/scripts/pasule-fomalhaut-ui.js" data-pjax></script>
```

- [ ] **Step 6: Build and verify the carousel-led homepage**

Run:

```powershell
npm run build
node tools/verify-generated-pages.cjs
node tools/verify-fomalhaut-home.cjs
```

Expected:

- build succeeds
- both verifiers pass the carousel, nav, and feature-panel assertions

- [ ] **Step 7: Commit the homepage carousel layer**

Run:

```bash
git add source/_data/content-map.yml _config.butterfly.yml scripts/pasule-home-shell.js scripts/pasule-fomalhaut-ui.js source/css/modify.styl tools/verify-generated-pages.cjs tools/verify-fomalhaut-home.cjs
git commit -m "feat: add fomalhaut-inspired homepage carousel"
```

## Task 5: Upgrade Sidebar Panels And Day/Night Experience

**Files:**
- Modify: `source/_data/widget.yml`
- Modify: `_config.butterfly.yml`
- Modify: `source/css/modify.styl`
- Modify: `source/_data/styles.styl`
- Modify: `tools/verify-generated-pages.cjs`

- [ ] **Step 1: Expand the sidebar widgets into stronger information panels**

Replace the current `top:` and `bottom:` blocks in `source/_data/widget.yml` with this exact content:

```yml
top:
  - class_name: "pasule-quick-jump"
    id_name: "pasule-quick-jump"
    icon: "fas fa-compass"
    name: "快速导航"
    html: |
      <div class="pasule-link-stack">
        <a href="/archives/">文章档案</a>
        <a href="/projects/">项目集</a>
        <a href="/gallery/">相册</a>
        <a href="/about/">关于我</a>
      </div>
  - class_name: "pasule-station-note"
    id_name: "pasule-station-note"
    icon: "fas fa-bullhorn"
    name: "站点公告"
    html: |
      <div data-pasule-announcement-panel>
        <p class="pasule-widget-copy">首页轮播展示手动精选文章，右侧卡片负责快速导航、站点信息与文章路线入口。</p>
      </div>

bottom:
  - class_name: "pasule-signal-note"
    id_name: "pasule-signal-note"
    icon: "fas fa-satellite-dish"
    name: "Signal Note"
    html: |
      <p class="pasule-widget-copy">白天模式偏玻璃感内容站，夜间模式偏霓虹感内容站，保留原背景与 Live2D。</p>
```

- [ ] **Step 2: Add stronger dark-mode-specific homepage and sidebar variables**

Append this exact block to `source/css/modify.styl`:

```stylus
[data-theme='dark']
  --pasule-ink: rgba(255,255,255,.88)
  --pasule-muted: rgba(220,228,245,.78)
  --pasule-line: rgba(145, 168, 255, 0.18)
  --pasule-shadow: 0 20px 42px rgba(0, 0, 0, 0.24)

  .pasule-home-carousel,
  .pasule-home-section,
  .pasule-project-page,
  .pasule-about-panel,
  .pasule-post-guide,
  #aside-content .card-widget
    background: linear-gradient(180deg, rgba(22,26,40,.76), rgba(14,18,30,.88))

  .pasule-slide-card,
  .pasule-feature-card,
  .pasule-series-card,
  .pasule-project-spotlight-card
    background: rgba(18,22,34,.74)
```

- [ ] **Step 3: Add support styling for the stronger sidebar panel look**

Append this exact block to `source/_data/styles.styl`:

```css
#aside-content .card-widget {
  border-radius: 20px !important;
  border: 1px solid rgba(114, 128, 167, 0.14);
}

#aside-content .item-headline {
  font-weight: 700;
}
```

- [ ] **Step 4: Add the nav-title-switch and reading-progress behavior to the UI script**

Append this exact block to `scripts/pasule-fomalhaut-ui.js`:

```js
function initPasuleNavTitle() {
  const navTitle = document.querySelector('#blog-info .nav-page-title .site-name');
  const siteTitle = document.querySelector('#blog-info .nav-site-title .site-name');
  if (!siteTitle) return;

  document.addEventListener('scroll', () => {
    if (!navTitle) return;
    navTitle.style.display = window.scrollY > 180 ? 'inline' : 'none';
  }, { passive: true });
}

function initPasuleReadPercent() {
  const button = document.querySelector('#go-up .scroll-percent');
  if (!button) return;

  const update = () => {
    const top = document.documentElement.scrollTop || document.body.scrollTop;
    const total = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const percent = total > 0 ? Math.round((top / total) * 100) : 0;
    button.textContent = `${percent}%`;
  };

  update();
  document.addEventListener('scroll', update, { passive: true });
}

document.addEventListener('DOMContentLoaded', initPasuleNavTitle);
document.addEventListener('DOMContentLoaded', initPasuleReadPercent);
document.addEventListener('pjax:complete', initPasuleNavTitle);
document.addEventListener('pjax:complete', initPasuleReadPercent);
```

- [ ] **Step 5: Verify the richer sidebar and day/night behavior hooks**

Add these exact assertions to `tools/verify-generated-pages.cjs`:

```js
expectContains('public/index.html', '快速导航');
expectContains('public/index.html', '站点公告');
expectContains('public/style.css', '[data-theme=\'dark\']');
expectContains('public/index.html', 'Signal Note');
```

Run:

```powershell
npm run build
node tools/verify-generated-pages.cjs
node tools/verify-fomalhaut-home.cjs
```

Expected:

- build succeeds
- both verification scripts pass
- homepage HTML contains the stronger panel copy

- [ ] **Step 6: Commit the sidebar and day/night layer**

Run:

```bash
git add source/_data/widget.yml _config.butterfly.yml source/css/modify.styl source/_data/styles.styl scripts/pasule-fomalhaut-ui.js tools/verify-generated-pages.cjs
git commit -m "feat: enhance sidebar panels and dark mode experience"
```

## Task 6: Final Validation And Cleanup

**Files:**
- Modify: none unless verification reveals a real defect

- [ ] **Step 1: Run a clean rebuild**

Run:

```powershell
npm run clean
npm run build
node tools/verify-generated-pages.cjs
node tools/verify-fomalhaut-home.cjs
```

Expected:

- all commands exit with code `0`
- both verifier scripts print success lines

- [ ] **Step 2: Run local manual QA**

Run:

```powershell
npm run server
```

Check these routes manually:

- `/`
- `/projects/`
- `/about/`
- `/2025/10/20/Java并发编程深度解析/`

Confirm:

- homepage shows grouped nav
- homepage opens with a large carousel-led shell
- homepage keeps the original background and Live2D
- sidebar feels denser and more panel-like
- dark/light toggle visibly changes the homepage shell and sidebar visual treatment

- [ ] **Step 3: Commit the final validated state**

Run:

```bash
git add .
git commit -m "feat: deliver fomalhaut-inspired home and sidebar redesign"
```

## Self-Review Checklist

- Spec coverage:
  - grouped navigation: covered by Task 3
  - large manual carousel: covered by Task 4
  - richer curated homepage sections: covered by Task 4
  - denser sidebar panels: covered by Task 5
  - stronger dark mode / day-night experience: covered by Task 5
  - keeping background and Live2D: preserved by architecture and manual QA in Task 6
  - not wiring the Fomalhaut repo into active build: covered by Task 1

- Placeholder scan:
  - no unfinished markers remain in the plan
  - every task has concrete file paths, commands, and code snippets

- Type consistency:
  - homepage carousel marker: `data-pasule-home-carousel`
  - homepage feature-panel marker: `data-pasule-feature-panels`
  - announcement marker: `data-pasule-announcement-panel`
  - grouped nav marker: `data-pasule-nav-grouped`
  - focused verifier: `tools/verify-fomalhaut-home.cjs`

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-09-fomalhaut-inspired-home-sidebar-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
