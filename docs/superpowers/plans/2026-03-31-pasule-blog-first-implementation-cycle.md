# Pasule Blog First Implementation Cycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the first production cycle for Pasule Blog: a stronger homepage shell, a real projects section, a refined about page, and article-series/read-path enhancements without breaking URLs or replacing the current image resource set.

**Architecture:** Keep Butterfly as the rendering base and do not edit `node_modules`. Add a centralized content map under `source/_data`, use Butterfly's built-in widget and series features where they already exist, inject homepage and post-level UI with local `after_render:html` filters, and verify every phase by building the site into `public/` and checking the generated HTML with a local smoke-test script.

**Tech Stack:** Hexo 7.3, Butterfly 5.3.5, Cheerio, Markdown/HTML pages, Stylus, Node 22 CommonJS scripts

---

## Scope Check

This plan intentionally covers the first implementation cycle from the approved spec, not the entire long-tail polish backlog.

In scope for this plan:

- homepage shell and content-hub sections
- unified visual shell and navigation polish
- data-driven project page rebuild
- about page refinement
- centralized content map
- article series metadata and post guide cards
- smoke-test verification for generated HTML

Explicitly out of scope for this plan:

- gallery, shuoshuo, tag, archive, and category page polish
- writing the 2-4 follow-up articles recommended by the spec
- comment system changes
- deployment pipeline changes
- replacing the current avatar, background image, or favicon

These deferred items should be handled in a follow-up plan after this first cycle ships cleanly.

## File Structure

### Files To Create

- `docs/superpowers/plans/2026-03-31-pasule-blog-first-implementation-cycle.md`
  Responsibility: this implementation plan document.
- `source/_data/content-map.yml`
  Responsibility: central curated data for homepage hero, featured posts, series deck, and projects deck.
- `source/_data/widget.yml`
  Responsibility: custom Butterfly top/bottom aside widgets for quick navigation and signal notes.
- `scripts/verify-generated-pages.cjs`
  Responsibility: build-output smoke test that reads generated files under `public/` and asserts required markers.
- `scripts/pasule-home-shell.js`
  Responsibility: homepage post-render filter that injects the homepage shell from `content-map.yml`.
- `scripts/pasule-post-guide.js`
  Responsibility: post-page post-render filter that injects article guide cards using front matter and existing posts.
- `scripts/tag/pasule-projects.js`
  Responsibility: custom Hexo tag that renders the projects grid from `content-map.yml`.

### Files To Modify

- `_config.butterfly.yml`
  Responsibility: enable or tune Butterfly features we can reuse directly, especially fixed nav text, card content, and series card behavior.
- `source/css/modify.styl`
  Responsibility: main custom styling for the homepage shell, sticker tags, project cards, about page, and post guide cards.
- `source/_data/styles.styl`
  Responsibility: global layout offset tuning so the new shell still sits correctly on top of the current transparent-card setup.
- `source/projects/index.md`
  Responsibility: replace sample inline HTML with a clean tag-driven projects page.
- `source/about/index.md`
  Responsibility: replace the rough single-column self-intro with a structured, cross-linked about layout.
- `source/_posts/sping框架xml和注解注入的理解.md`
  Responsibility: add first-cycle metadata for Java/backend series positioning.
- `source/_posts/Java并发编程深度解析.md`
  Responsibility: add series, difficulty, keywords, hero description, and recommended-next linkage.
- `source/_posts/微服务架构设计原理与最佳实践.md`
  Responsibility: add first-cycle metadata for the same series.
- `source/_posts/路由的理解.md`
  Responsibility: add first-cycle metadata for the front-end engineering line.
- `source/_posts/前端性能优化实战.md`
  Responsibility: add first-cycle metadata for the front-end engineering line.
- `source/_posts/MySQL索引优化完全指南.md`
  Responsibility: add first-cycle metadata for the database performance line.
- `source/_posts/Git工作流与团队协作最佳实践.md`
  Responsibility: add first-cycle metadata for the engineering collaboration line.

### Existing Files To Read During Execution

- `scripts/modify.js`
  Responsibility: existing `top-img` injection; keep intact while adding new filters alongside it.
- `node_modules/hexo-theme-butterfly/layout/index.pug`
  Responsibility: confirms homepage output shape and `#recent-posts` selector used by the new filter.
- `node_modules/hexo-theme-butterfly/layout/includes/widget/card_top_self.pug`
  Responsibility: confirms `site.data.widget.top` rendering contract.
- `node_modules/hexo-theme-butterfly/layout/includes/widget/card_bottom_self.pug`
  Responsibility: confirms `site.data.widget.bottom` rendering contract.
- `node_modules/hexo-theme-butterfly/layout/includes/widget/card_post_series.pug`
  Responsibility: confirms Butterfly's built-in post-series card already works when `page.series` exists.

## Task 1: Establish The Data Foundation And Smoke-Test Harness

**Files:**
- Create: `scripts/verify-generated-pages.cjs`
- Create: `source/_data/content-map.yml`
- Create: `source/_data/widget.yml`
- Modify: `_config.butterfly.yml`

- [ ] **Step 1: Write the failing smoke-test script for the first visible foundation markers**

Create `scripts/verify-generated-pages.cjs` with this exact content:

```js
const fs = require('node:fs');
const path = require('node:path');

function read(file) {
  return fs.readFileSync(path.join(process.cwd(), file), 'utf8');
}

function expectContains(file, marker) {
  const text = read(file);
  if (!text.includes(marker)) {
    throw new Error(`Missing "${marker}" in ${file}`);
  }
}

function expectNotContains(file, marker) {
  const text = read(file);
  if (text.includes(marker)) {
    throw new Error(`Unexpected "${marker}" in ${file}`);
  }
}

expectContains('public/index.html', 'id="pasule-quick-jump"');
expectContains('public/about/index.html', 'id="pasule-quick-jump"');
expectContains('public/about/index.html', 'Signal Note');
expectNotContains('public/about/index.html', 'data-pasule-home-shell');

console.log('verify-generated-pages: task-1 checks passed');
```

- [ ] **Step 2: Run the build and verify it fails before the data files exist**

Run:

```powershell
npm run build
node scripts/verify-generated-pages.cjs
```

Expected: `npm run build` succeeds, then `node scripts/verify-generated-pages.cjs` fails with `Missing "id="pasule-quick-jump"" in public/index.html`.

- [ ] **Step 3: Create the content map, custom widgets, and the minimal Butterfly config updates**

Create `source/_data/content-map.yml` with this exact content:

```yml
home:
  hero:
    eyebrow: "TECH x ACG"
    title: "把博客做成一个有气质的技术小宇宙"
    description: "把技术文章、项目实验、归档入口和个人信息组织成同一个世界观下的内容站。"
    primary_text: "浏览文章档案"
    primary_link: "/archives/"
    secondary_text: "打开项目页"
    secondary_link: "/projects/"
  featured_titles:
    - "微服务架构设计原理与最佳实践"
    - "Java并发编程深度解析：从理论到实践"
    - "MySQL索引优化完全指南：从原理到实战"
  series_deck:
    - key: "backend-growth"
      title: "Java / 后端成长线"
      description: "从 Spring 注入、Java 并发到微服务架构。"
      entry_titles:
        - "sping框架xml和注解注入的理解"
        - "Java并发编程深度解析：从理论到实践"
        - "微服务架构设计原理与最佳实践"
    - key: "db-performance"
      title: "数据库性能线"
      description: "围绕 MySQL 索引、查询分析和性能定位逐步展开。"
      entry_titles:
        - "MySQL索引优化完全指南：从原理到实战"
    - key: "frontend-engineering"
      title: "前端工程线"
      description: "从路由理解到性能优化，构建前端工程认知。"
      entry_titles:
        - "路由的理解"
        - "前端性能优化实战：从加载到渲染全面提速"
    - key: "engineering-collaboration"
      title: "工程协作线"
      description: "从 Git 基础延伸到团队协作与评审习惯。"
      entry_titles:
        - "Git工作流与团队协作最佳实践"

projects:
  intro:
    title: "Project Deck"
    description: "先收纳当前真实在维护的项目，再用 planned 状态诚实标注后续扩展位。"
  items:
    - key: "pasule-blog"
      title: "Pasule Blog"
      summary: "当前这个 Hexo + Butterfly 博客本体，目标是把它升级成技术博客和作品页混合站。"
      status: "active"
      stack:
        - "Hexo"
        - "Butterfly"
        - "Stylus"
        - "Cheerio"
      repo: "https://github.com/pasule/pasule.github.io"
      demo: "https://pasule.github.io"
      related_titles:
        - "前端性能优化实战：从加载到渲染全面提速"
    - key: "content-map-upgrade"
      title: "Content Map Upgrade"
      summary: "把文章、系列、项目和首页导流整理进一个中心化内容映射层。"
      status: "planned"
      stack:
        - "Hexo Data"
        - "YAML"
        - "Content Design"
      repo: ""
      demo: ""
      related_titles:
        - "Git工作流与团队协作最佳实践"
    - key: "series-reading-flow"
      title: "Series Reading Flow"
      summary: "让文章从孤立页面升级成可连续阅读的知识路径。"
      status: "planned"
      stack:
        - "Front Matter"
        - "Butterfly Series"
        - "HTML Filter"
      repo: ""
      demo: ""
      related_titles:
        - "Java并发编程深度解析：从理论到实践"
        - "MySQL索引优化完全指南：从原理到实战"
```

Create `source/_data/widget.yml` with this exact content:

```yml
top:
  - class_name: "pasule-quick-jump"
    id_name: "pasule-quick-jump"
    icon: "fas fa-compass"
    name: "快速跳转"
    html: |
      <div class="pasule-link-stack">
        <a href="/archives/">文章档案</a>
        <a href="/projects/">项目集</a>
        <a href="/gallery/">相册</a>
        <a href="/about/">关于我</a>
      </div>

bottom:
  - class_name: "pasule-signal-note"
    id_name: "pasule-signal-note"
    icon: "fas fa-satellite-dish"
    name: "Signal Note"
    html: |
      <p class="pasule-widget-copy">先看精选文章，再逛项目页和关于页。所有主要分页面都会保留互相跳转入口。</p>
```

Update these exact blocks in `_config.butterfly.yml`:

```yml
nav:
  logo:
  display_title: true
  fixed: true
```

```yml
aside:
  enable: true
  hide: false
  button: true
  mobile: true
  position: right
  display:
    archive: true
    tag: true
    category: true
  card_author:
    enable: true
    description: 把技术文章、项目实验和长期成长记录整理成一个持续更新的小宇宙。
    button:
      enable: true
      icon: fab fa-github
      text: Follow Me
      link: https://github.com/pasule
  card_announcement:
    enable: true
    content: 先看精选文章，再逛项目页和关于页，所有主要分页面都能直接互跳。
```

```yml
  card_post_series:
    enable: true
    series_title: true
    orderBy: 'date'
    order: -1
```

- [ ] **Step 4: Rebuild and verify the first foundation markers pass**

Run:

```powershell
npm run build
node scripts/verify-generated-pages.cjs
```

Expected: build succeeds and `node scripts/verify-generated-pages.cjs` prints `verify-generated-pages: task-1 checks passed`.

- [ ] **Step 5: Commit or record a checkpoint**

If the workspace is inside git, run:

```bash
git add _config.butterfly.yml source/_data/content-map.yml source/_data/widget.yml scripts/verify-generated-pages.cjs
git commit -m "feat: add content map foundation and sidebar quick links"
```

If `git rev-parse --is-inside-work-tree` fails in this workspace, record a manual checkpoint note with the same message and continue.

## Task 2: Inject The Homepage Shell From The Central Content Map

**Files:**
- Create: `scripts/pasule-home-shell.js`
- Modify: `scripts/verify-generated-pages.cjs`

- [ ] **Step 1: Extend the smoke test with failing homepage-shell assertions**

Update `scripts/verify-generated-pages.cjs` to include these exact additional assertions before the final `console.log(...)`:

```js
expectContains('public/index.html', 'data-pasule-home-shell');
expectContains('public/index.html', 'data-pasule-series-deck');
expectContains('public/index.html', 'data-pasule-project-spotlight');
expectContains('public/index.html', '把博客做成一个有气质的技术小宇宙');
expectContains('public/index.html', 'Java / 后端成长线');
expectContains('public/index.html', 'Pasule Blog');
```

- [ ] **Step 2: Run the build and verify it fails before the homepage shell filter exists**

Run:

```powershell
npm run build
node scripts/verify-generated-pages.cjs
```

Expected: `node scripts/verify-generated-pages.cjs` fails with `Missing "data-pasule-home-shell" in public/index.html`.

- [ ] **Step 3: Create the homepage shell filter that injects curated hero, series, and project sections**

Create `scripts/pasule-home-shell.js` with this exact content:

```js
'use strict';

const cheerio = require('cheerio');

function normalizeLink(input) {
  if (!input) return '#';
  return `/${String(input).replace(/^\/+/, '')}`;
}

function findPostByTitle(posts, title) {
  return posts.find(post => post.title === title);
}

function buildFeaturedCards(posts, titles) {
  return titles.map(title => {
    const post = findPostByTitle(posts, title);
    if (!post) return '';
    return `
      <article class="pasule-feature-card" data-pasule-feature-card>
        <p class="pasule-card-kicker">Featured Article</p>
        <h3><a href="${normalizeLink(post.path)}">${post.title}</a></h3>
        <p>${post.description || ''}</p>
      </article>
    `;
  }).join('');
}

function buildSeriesDeck(posts, seriesDeck) {
  return seriesDeck.map(item => {
    const links = item.entry_titles.map(title => {
      const post = findPostByTitle(posts, title);
      if (!post) return '';
      return `<a class="pasule-mini-link" href="${normalizeLink(post.path)}">${post.title}</a>`;
    }).join('');

    return `
      <article class="pasule-series-card" data-pasule-series-card>
        <p class="pasule-card-kicker">Series Deck</p>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <div class="pasule-mini-link-list">${links}</div>
      </article>
    `;
  }).join('');
}

function buildProjectSpotlight(items) {
  return items.map(item => `
    <article class="pasule-project-spotlight-card" data-pasule-project-card>
      <p class="pasule-card-kicker">Project</p>
      <h3>${item.title}</h3>
      <p>${item.summary}</p>
      <div class="pasule-project-status">status: ${item.status}</div>
    </article>
  `).join('');
}

function buildHomeShell(map, posts) {
  if (!map || !map.home || !map.projects) return '';

  const hero = map.home.hero;
  const featuredCards = buildFeaturedCards(posts, map.home.featured_titles || []);
  const seriesCards = buildSeriesDeck(posts, map.home.series_deck || []);
  const projectCards = buildProjectSpotlight(map.projects.items || []);

  return `
    <section class="pasule-home-shell" data-pasule-home-shell>
      <section class="pasule-home-hero">
        <p class="pasule-eyebrow">${hero.eyebrow}</p>
        <h1>${hero.title}</h1>
        <p class="pasule-hero-copy">${hero.description}</p>
        <div class="pasule-hero-actions">
          <a class="pasule-primary-link" href="${hero.primary_link}">${hero.primary_text}</a>
          <a class="pasule-secondary-link" href="${hero.secondary_link}">${hero.secondary_text}</a>
        </div>
      </section>

      <section class="pasule-home-grid">
        <div class="pasule-home-section" data-pasule-featured-deck>
          <div class="pasule-section-head">
            <h2>Featured Dispatches</h2>
            <a href="/archives/">更多文章</a>
          </div>
          <div class="pasule-card-grid">${featuredCards}</div>
        </div>

        <div class="pasule-home-section" data-pasule-series-deck>
          <div class="pasule-section-head">
            <h2>Series Deck</h2>
            <a href="/tags/">浏览标签</a>
          </div>
          <div class="pasule-card-grid">${seriesCards}</div>
        </div>

        <div class="pasule-home-section" data-pasule-project-spotlight>
          <div class="pasule-section-head">
            <h2>${map.projects.intro.title}</h2>
            <a href="/projects/">打开项目页</a>
          </div>
          <div class="pasule-card-grid">${projectCards}</div>
        </div>
      </section>
    </section>
  `;
}

hexo.extend.filter.register('after_render:html', function (html, data) {
  if (!data || data.path !== 'index.html') return html;

  const $ = cheerio.load(html, { decodeEntities: false });
  const recentPosts = $('#recent-posts');
  if (!recentPosts.length || $('[data-pasule-home-shell]').length) return html;

  const siteData = hexo.locals.get('data');
  const posts = hexo.locals.get('posts').data;
  const contentMap = siteData['content-map'];
  const shell = buildHomeShell(contentMap, posts);

  if (!shell) return html;

  recentPosts.before(shell);
  recentPosts.prepend(`
    <div class="pasule-section-head pasule-feed-head">
      <h2>Recent Updates</h2>
      <a href="/archives/">查看完整归档</a>
    </div>
  `);

  return $.html();
});
```

- [ ] **Step 4: Rebuild and verify the homepage shell passes**

Run:

```powershell
npm run build
node scripts/verify-generated-pages.cjs
```

Expected: build succeeds and the verifier passes all task-1 and task-2 assertions.

- [ ] **Step 5: Commit or record a checkpoint**

If git is available:

```bash
git add scripts/pasule-home-shell.js scripts/verify-generated-pages.cjs
git commit -m "feat: inject homepage shell from content map"
```

If git is unavailable, record the same checkpoint note manually.

## Task 3: Apply The Unified Visual Shell And Navigation Polish

**Files:**
- Modify: `source/css/modify.styl`
- Modify: `source/_data/styles.styl`
- Modify: `scripts/verify-generated-pages.cjs`

- [ ] **Step 1: Add failing style assertions for the new shell classes**

Update `scripts/verify-generated-pages.cjs` with these exact assertions:

```js
expectContains('public/style.css', '.pasule-home-shell');
expectContains('public/style.css', '.pasule-project-spotlight-card');
expectContains('public/style.css', '.pasule-post-guide');
expectContains('public/style.css', '#pasule-quick-jump');
```

- [ ] **Step 2: Run the build and verify it fails before the new classes are styled**

Run:

```powershell
npm run build
node scripts/verify-generated-pages.cjs
```

Expected: verifier fails with `Missing ".pasule-home-shell" in public/style.css`.

- [ ] **Step 3: Add the unified shell, card, and guide styles**

Append this exact block to `source/css/modify.styl`:

```stylus
:root
  --pasule-ink: #243047
  --pasule-muted: #617089
  --pasule-line: rgba(114, 128, 167, 0.16)
  --pasule-pink: #ff6fb1
  --pasule-blue: #6aa5ff
  --pasule-cream: rgba(255, 255, 255, 0.82)
  --pasule-shadow: 0 18px 40px rgba(112, 126, 161, 0.16)

#nav
  backdrop-filter: blur(12px)

#pasule-quick-jump .item-content,
#pasule-signal-note .item-content
  text-align: left

.pasule-link-stack
  display: grid
  gap: 10px

  a
    display: block
    padding: 10px 12px
    border-radius: 14px
    background: rgba(255, 255, 255, 0.72)
    border: 1px solid var(--pasule-line)
    color: var(--pasule-ink)
    transition: all .2s ease

    &:hover
      transform: translateY(-2px)
      box-shadow: var(--pasule-shadow)

.pasule-widget-copy
  margin: 0
  color: var(--pasule-muted)
  line-height: 1.7

.pasule-home-shell,
.pasule-project-page,
.pasule-about-page,
.pasule-post-guide
  color: var(--pasule-ink)

.pasule-home-shell
  display: grid
  gap: 20px
  margin-bottom: 24px

.pasule-home-hero,
.pasule-home-section,
.pasule-project-page,
.pasule-about-panel,
.pasule-post-guide
  border-radius: 24px
  border: 1px solid var(--pasule-line)
  background: linear-gradient(180deg, rgba(255,255,255,.82), rgba(255,255,255,.9))
  box-shadow: var(--pasule-shadow)

.pasule-home-hero
  padding: 28px
  background: linear-gradient(135deg, rgba(255,234,244,.96), rgba(230,242,255,.96))

.pasule-eyebrow,
.pasule-card-kicker
  margin: 0 0 8px
  font-size: .8rem
  letter-spacing: .08em
  text-transform: uppercase
  color: #6f5e8e

.pasule-hero-copy
  max-width: 48rem
  color: var(--pasule-muted)
  line-height: 1.8

.pasule-hero-actions
  display: flex
  flex-wrap: wrap
  gap: 12px
  margin-top: 18px

.pasule-primary-link,
.pasule-secondary-link,
.pasule-mini-link
  display: inline-flex
  align-items: center
  justify-content: center
  border-radius: 999px
  padding: 10px 16px

.pasule-primary-link
  color: #fff
  background: linear-gradient(135deg, var(--pasule-pink), var(--pasule-blue))

.pasule-secondary-link,
.pasule-mini-link
  color: var(--pasule-ink)
  background: rgba(255,255,255,.76)
  border: 1px solid var(--pasule-line)

.pasule-home-grid,
.pasule-card-grid,
.pasule-about-grid
  display: grid
  gap: 16px

.pasule-card-grid
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))

.pasule-home-section
  padding: 22px

.pasule-section-head
  display: flex
  align-items: center
  justify-content: space-between
  gap: 12px
  margin-bottom: 16px

  h2
    margin: 0

.pasule-feature-card,
.pasule-series-card,
.pasule-project-spotlight-card,
.pasule-project-card,
.pasule-about-panel
  padding: 18px
  border-radius: 18px
  border: 1px solid var(--pasule-line)
  background: rgba(255,255,255,.72)

.pasule-mini-link-list,
.pasule-stack-list
  display: flex
  flex-wrap: wrap
  gap: 10px
  margin-top: 12px

.pasule-post-guide
  margin-bottom: 24px
  padding: 18px 20px

.pasule-guide-links
  display: flex
  flex-wrap: wrap
  gap: 10px
  margin-top: 14px

@media screen and (max-width: 768px)
  .pasule-home-hero,
  .pasule-home-section,
  .pasule-project-page,
  .pasule-about-panel,
  .pasule-post-guide
    border-radius: 18px
```

Append this exact block to `source/_data/styles.styl`:

```css
.content-wrap,
#aside-content .card-widget {
  border-radius: 18px !important;
}

.recent-post-item,
#aside-content .card-widget,
#post,
#page,
#archive,
#tag,
#category {
  box-shadow: 0 20px 42px rgba(111, 126, 160, 0.14) !important;
}

#recent-posts .recent-post-item {
  border: 1px solid rgba(114, 128, 167, 0.12);
  overflow: hidden;
}

#recent-posts .article-title {
  line-height: 1.5;
}

#recent-posts .content {
  color: #617089;
}
```

- [ ] **Step 4: Rebuild and verify the styles are emitted**

Run:

```powershell
npm run build
node scripts/verify-generated-pages.cjs
```

Expected: verifier passes the style-asset assertions as well as the previous markup assertions.

- [ ] **Step 5: Commit or record a checkpoint**

If git is available:

```bash
git add source/css/modify.styl source/_data/styles.styl scripts/verify-generated-pages.cjs
git commit -m "feat: apply unified pasule shell styling"
```

If git is unavailable, record the same checkpoint note manually.

## Task 4: Rebuild The Projects Page With A Data-Driven Custom Tag

**Files:**
- Create: `scripts/tag/pasule-projects.js`
- Modify: `source/projects/index.md`
- Modify: `scripts/verify-generated-pages.cjs`

- [ ] **Step 1: Extend the smoke test with failing project-page assertions**

Add these exact assertions to `scripts/verify-generated-pages.cjs`:

```js
expectContains('public/projects/index.html', 'data-pasule-project-grid');
expectContains('public/projects/index.html', 'Pasule Blog');
expectContains('public/projects/index.html', 'status: active');
expectNotContains('public/projects/index.html', '示例项目');
expectNotContains('public/projects/index.html', '更多项目请仿照上方格式添加');
```

- [ ] **Step 2: Run the build and verify it fails before the custom tag exists**

Run:

```powershell
npm run build
node scripts/verify-generated-pages.cjs
```

Expected: verifier fails with `Missing "data-pasule-project-grid" in public/projects/index.html`.

- [ ] **Step 3: Create the `pasule_projects` tag and replace the sample page markup**

Create `scripts/tag/pasule-projects.js` with this exact content:

```js
'use strict';

function tagList(stack) {
  return (stack || []).map(item => `<span class="pasule-mini-link">${item}</span>`).join('');
}

function relationList(items) {
  return (items || []).map(item => `<span class="pasule-mini-link">${item}</span>`).join('');
}

hexo.extend.tag.register('pasule_projects', function () {
  const map = hexo.locals.get('data')['content-map'];
  const intro = map.projects.intro;
  const cards = map.projects.items.map(item => {
    const repoLink = item.repo ? `<a class="pasule-primary-link" href="${item.repo}" target="_blank" rel="noopener">Repository</a>` : '';
    const demoLink = item.demo ? `<a class="pasule-secondary-link" href="${item.demo}" target="_blank" rel="noopener">Live Demo</a>` : '';

    return `
      <article class="pasule-project-card" data-pasule-project-card>
        <p class="pasule-card-kicker">${item.key}</p>
        <h3>${item.title}</h3>
        <p>${item.summary}</p>
        <div class="pasule-stack-list">${tagList(item.stack)}</div>
        <p class="pasule-project-status">status: ${item.status}</p>
        <div class="pasule-guide-links">${repoLink}${demoLink}</div>
        <div class="pasule-stack-list">${relationList(item.related_titles)}</div>
      </article>
    `;
  }).join('');

  return `
    <section class="pasule-project-page" data-pasule-project-grid>
      <div class="pasule-section-head">
        <div>
          <h1>${intro.title}</h1>
          <p>${intro.description}</p>
        </div>
        <a class="pasule-secondary-link" href="/archives/">回到文章档案</a>
      </div>
      <div class="pasule-card-grid">${cards}</div>
    </section>
  `;
});
```

Replace `source/projects/index.md` with this exact content:

```md
---
title: projects
date: 2025-05-24 03:00:30
---

{% pasule_projects %}
```

- [ ] **Step 4: Rebuild and verify the projects page passes**

Run:

```powershell
npm run build
node scripts/verify-generated-pages.cjs
```

Expected: verifier passes the projects-page assertions and no longer finds the old sample strings.

- [ ] **Step 5: Commit or record a checkpoint**

If git is available:

```bash
git add scripts/tag/pasule-projects.js source/projects/index.md scripts/verify-generated-pages.cjs
git commit -m "feat: rebuild projects page from content map"
```

If git is unavailable, record the same checkpoint note manually.

## Task 5: Replace The About Page With A Structured Cross-Linked Profile Layout

**Files:**
- Modify: `source/about/index.md`
- Modify: `scripts/verify-generated-pages.cjs`

- [ ] **Step 1: Extend the smoke test with failing about-page assertions**

Add these exact assertions to `scripts/verify-generated-pages.cjs`:

```js
expectContains('public/about/index.html', 'data-pasule-about-grid');
expectContains('public/about/index.html', '继续读文章');
expectContains('public/about/index.html', '打开项目页');
expectNotContains('public/about/index.html', '混吃，等死');
```

- [ ] **Step 2: Run the build and verify it fails before the about page is rewritten**

Run:

```powershell
npm run build
node scripts/verify-generated-pages.cjs
```

Expected: verifier fails with `Missing "data-pasule-about-grid" in public/about/index.html`.

- [ ] **Step 3: Replace the about page with a structured, honest, cross-linked profile**

Replace `source/about/index.md` with this exact content:

```md
---
title: about
date: 2025-05-24 02:40:31
---

<section class="pasule-about-page pasule-about-grid" data-pasule-about-grid>
  <section class="pasule-about-panel">
    <p class="pasule-card-kicker">About The Maintainer</p>
    <h1>Pasule</h1>
    <p>这里是我的个人博客。我把技术文章、项目实验、归档入口和长期更新记录整理在同一个站点里，希望它既能持续积累，也能保持一点明确的个人气质。</p>
  </section>

  <section class="pasule-about-panel">
    <p class="pasule-card-kicker">目前坐标</p>
    <h2>杭州 · 小和山</h2>
    <p>杭州市西湖区小和山浙江科技大学（Zhejiang University of Science and Technology）。</p>
  </section>

  <section class="pasule-about-panel">
    <p class="pasule-card-kicker">关注方向</p>
    <ul>
      <li>Java / 后端基础与并发</li>
      <li>MySQL 与数据库性能优化</li>
      <li>前端工程、路由与性能体验</li>
      <li>博客系统、内容组织和长期维护</li>
    </ul>
  </section>

  <section class="pasule-about-panel">
    <p class="pasule-card-kicker">联系方式</p>
    <div class="pasule-link-stack">
      <a href="mailto:3086874696@qq.com">邮箱：3086874696@qq.com</a>
      <a href="https://github.com/pasule" target="_blank" rel="noopener">Github：pasule</a>
      <a href="/projects/">打开项目页</a>
      <a href="/archives/">继续读文章</a>
    </div>
  </section>
</section>
```

- [ ] **Step 4: Rebuild and verify the about page passes**

Run:

```powershell
npm run build
node scripts/verify-generated-pages.cjs
```

Expected: verifier passes the about-page assertions and the old joke line is gone from the generated about page.

- [ ] **Step 5: Commit or record a checkpoint**

If git is available:

```bash
git add source/about/index.md scripts/verify-generated-pages.cjs
git commit -m "feat: refine about page into structured profile layout"
```

If git is unavailable, record the same checkpoint note manually.

## Task 6: Activate Article Series Metadata And Inject Post Guide Cards

**Files:**
- Create: `scripts/pasule-post-guide.js`
- Modify: `scripts/verify-generated-pages.cjs`
- Modify: `source/_posts/sping框架xml和注解注入的理解.md`
- Modify: `source/_posts/Java并发编程深度解析.md`
- Modify: `source/_posts/微服务架构设计原理与最佳实践.md`
- Modify: `source/_posts/路由的理解.md`
- Modify: `source/_posts/前端性能优化实战.md`
- Modify: `source/_posts/MySQL索引优化完全指南.md`
- Modify: `source/_posts/Git工作流与团队协作最佳实践.md`

- [ ] **Step 1: Extend the smoke test with failing post-guide and series assertions**

Add these exact assertions to `scripts/verify-generated-pages.cjs`:

```js
expectContains('public/2025/10/20/Java并发编程深度解析/index.html', 'data-pasule-post-guide');
expectContains('public/2025/10/20/Java并发编程深度解析/index.html', 'Java / 后端成长线');
expectContains('public/2025/10/20/Java并发编程深度解析/index.html', '推荐下一篇');
expectContains('public/2025/10/20/Java并发编程深度解析/index.html', 'card-post-series');
```

- [ ] **Step 2: Run the build and verify it fails before the metadata and guide filter exist**

Run:

```powershell
npm run build
node scripts/verify-generated-pages.cjs
```

Expected: verifier fails with `Missing "data-pasule-post-guide" in public/2025/10/20/Java并发编程深度解析/index.html`.

- [ ] **Step 3: Add article metadata and the post-guide injection filter**

Create `scripts/pasule-post-guide.js` with this exact content:

```js
'use strict';

const cheerio = require('cheerio');

function normalizeLink(input) {
  if (!input) return '#';
  return `/${String(input).replace(/^\/+/, '')}`;
}

function findPostByTitle(posts, title) {
  return posts.find(post => post.title === title);
}

function buildNextLinks(posts, titles) {
  return (titles || []).map(title => {
    const post = findPostByTitle(posts, title);
    if (!post) return '';
    return `<a class="pasule-mini-link" href="${normalizeLink(post.path)}">${post.title}</a>`;
  }).join('');
}

function buildGuide(post, posts) {
  const tags = [];
  if (post.series) tags.push(`<span class="pasule-mini-link">${post.series}</span>`);
  if (post.difficulty) tags.push(`<span class="pasule-mini-link">难度 · ${post.difficulty}</span>`);
  if (post.keywords && post.keywords.length) {
    post.keywords.forEach(item => tags.push(`<span class="pasule-mini-link">${item}</span>`));
  }

  return `
    <section class="pasule-post-guide" data-pasule-post-guide>
      <p class="pasule-card-kicker">Reading Guide</p>
      <h2>${post.title}</h2>
      <p>${post.hero_desc || ''}</p>
      <div class="pasule-stack-list">${tags.join('')}</div>
      <div class="pasule-guide-links">
        ${buildNextLinks(posts, post.recommended_next)}
      </div>
      <p class="pasule-card-kicker">推荐下一篇</p>
    </section>
  `;
}

hexo.extend.filter.register('after_render:html', function (html, data) {
  if (!data || data.path === 'index.html' || !/index\.html$/.test(data.path)) return html;

  const postPath = data.path.replace(/index\.html$/, '');
  const posts = hexo.locals.get('posts').data;
  const post = posts.find(item => item.path === postPath);
  if (!post || post.layout !== 'post') return html;

  const $ = cheerio.load(html, { decodeEntities: false });
  const container = $('article#article-container.post-content');
  if (!container.length || $('[data-pasule-post-guide]').length) return html;

  container.prepend(buildGuide(post, posts));
  return $.html();
});
```

Update the front matter blocks in the following files exactly as shown.

In `source/_posts/sping框架xml和注解注入的理解.md`, add:

```yml
series: Java / 后端成长线
difficulty: beginner
keywords: [Spring, IoC, 依赖注入]
hero_desc: 从 Spring 的 IoC 和依赖注入切入，为后续并发和架构文章打基础。
recommended_next:
  - Java并发编程深度解析：从理论到实践
```

In `source/_posts/Java并发编程深度解析.md`, add:

```yml
series: Java / 后端成长线
difficulty: intermediate
keywords: [JMM, synchronized, Lock, JUC]
hero_desc: 把 Java 并发的底层原则、同步工具和常见问题一次串起来，方便后续继续扩展线程池与并发实战内容。
recommended_next:
  - 微服务架构设计原理与最佳实践
```

In `source/_posts/微服务架构设计原理与最佳实践.md`, add:

```yml
series: Java / 后端成长线
difficulty: intermediate
keywords: [微服务, 分布式系统, Spring Cloud]
hero_desc: 从单体到微服务的演进过程，适合放在 Java 基础和并发之后继续阅读。
recommended_next:
  - Git工作流与团队协作最佳实践
```

In `source/_posts/路由的理解.md`, add:

```yml
series: 前端工程线
difficulty: beginner
keywords: [路由, SPA, 前端]
hero_desc: 先把路由的职责和基本概念理顺，再去看性能、懒加载和工程化组织会更顺。
recommended_next:
  - 前端性能优化实战：从加载到渲染全面提速
```

In `source/_posts/前端性能优化实战.md`, add:

```yml
series: 前端工程线
difficulty: intermediate
keywords: [性能优化, Webpack, Core Web Vitals]
hero_desc: 从首屏到交互响应，把前端性能优化常见抓手整理成一篇可以反复回看的长文。
recommended_next:
  - Git工作流与团队协作最佳实践
```

In `source/_posts/MySQL索引优化完全指南.md`, add:

```yml
series: 数据库性能线
difficulty: intermediate
keywords: [MySQL, 索引, SQL, B+树]
hero_desc: 用索引作为数据库性能线的入口，后续可以自然接到 EXPLAIN 和慢查询定位。
recommended_next:
  - Java并发编程深度解析：从理论到实践
```

In `source/_posts/Git工作流与团队协作最佳实践.md`, add:

```yml
series: 工程协作线
difficulty: beginner
keywords: [Git, 协作, DevOps, Pull Request]
hero_desc: 用 Git 工作流把个人开发和团队协作习惯串起来，方便后续扩展 Code Review 与发布流程文章。
recommended_next:
  - 微服务架构设计原理与最佳实践
```

- [ ] **Step 4: Rebuild and verify post guides and built-in series cards pass**

Run:

```powershell
npm run build
node scripts/verify-generated-pages.cjs
```

Expected: verifier passes all prior assertions and confirms the generated Java concurrency article now contains both `data-pasule-post-guide` and Butterfly's `card-post-series`.

- [ ] **Step 5: Commit or record a checkpoint**

If git is available:

```bash
git add scripts/pasule-post-guide.js scripts/verify-generated-pages.cjs source/_posts/sping框架xml和注解注入的理解.md source/_posts/Java并发编程深度解析.md source/_posts/微服务架构设计原理与最佳实践.md source/_posts/路由的理解.md source/_posts/前端性能优化实战.md source/_posts/MySQL索引优化完全指南.md source/_posts/Git工作流与团队协作最佳实践.md
git commit -m "feat: add series metadata and post reading guides"
```

If git is unavailable, record the same checkpoint note manually.

## Task 7: Final First-Cycle Validation

**Files:**
- Modify: `scripts/verify-generated-pages.cjs` only if a missing assertion is discovered during review

- [ ] **Step 1: Run the complete build and smoke-test suite once more from a clean state**

Run:

```powershell
npm run clean
npm run build
node scripts/verify-generated-pages.cjs
```

Expected: all commands exit with code `0`, `npm run build` reports generated pages such as `index.html`, `projects/index.html`, and `about/index.html`, and the verifier prints the success line without throwing.

- [ ] **Step 2: Run a focused manual QA pass in the local server**

Run:

```powershell
npm run server
```

Open these exact routes in a browser and confirm them manually:

- `/`
- `/projects/`
- `/about/`
- `/2025/10/20/Java并发编程深度解析/`

Expected:

- homepage shows the injected shell before the recent post list
- projects page no longer contains the old sample copy
- about page shows the structured panel layout
- Java concurrency article shows both the injected guide and Butterfly's series card

- [ ] **Step 3: Record the first-cycle completion checkpoint**

If git is available:

```bash
git add _config.butterfly.yml source/_data/content-map.yml source/_data/widget.yml source/css/modify.styl source/_data/styles.styl source/projects/index.md source/about/index.md scripts/verify-generated-pages.cjs scripts/pasule-home-shell.js scripts/pasule-post-guide.js scripts/tag/pasule-projects.js source/_posts/sping框架xml和注解注入的理解.md source/_posts/Java并发编程深度解析.md source/_posts/微服务架构设计原理与最佳实践.md source/_posts/路由的理解.md source/_posts/前端性能优化实战.md source/_posts/MySQL索引优化完全指南.md source/_posts/Git工作流与团队协作最佳实践.md
git commit -m "feat: ship first pasule blog implementation cycle"
```

If git is unavailable, record the same checkpoint note manually and proceed to the next planning cycle for gallery/archive/tag polish.

## Self-Review Checklist

- Spec coverage:
  - homepage hub: covered by Task 2 and Task 3
  - unified visual shell: covered by Task 3
  - projects page rebuild: covered by Task 4
  - about page refinement: covered by Task 5
  - centralized content map: covered by Task 1
  - article series and reading flow: covered by Task 6
  - first-cycle validation: covered by Task 7
  - deferred secondary-page polish: intentionally left out of scope for a follow-up plan

- Placeholder scan:
  - no unfinished-marker words remain in task instructions
  - code and commands are concrete for every implementation step

- Type and naming consistency:
  - homepage shell marker: `data-pasule-home-shell`
  - projects grid marker: `data-pasule-project-grid`
  - about layout marker: `data-pasule-about-grid`
  - post guide marker: `data-pasule-post-guide`
  - sidebar widget id: `pasule-quick-jump`

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-03-31-pasule-blog-first-implementation-cycle.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**

