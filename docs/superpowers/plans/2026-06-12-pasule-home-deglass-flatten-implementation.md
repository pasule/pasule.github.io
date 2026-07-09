# Pasule 全站去毛玻璃 + 首页减负 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 整站移除毛玻璃（`backdrop-filter` + 半透明面板）改成 xtower 风格实心浅色卡，内容区背景换柔和底，并删除首页累积的死 CSS / 死数据。

**Architecture:** 纯静态站点改造，无运行时测试。采用本仓既有的"验证脚本优先"TDD：先把目标状态写进 `tools/verify-*.cjs`（构建后跑应失败），再分文件/分区改 `source/css/modify.styl`、`source/_data/styles.styl`、`source/_data/content-map.yml`、`_config.butterfly.yml`，最后 `npm run build` + 两个验证脚本通过。布局逻辑（`scripts/pasule-home-shell.js`）与交互 JS（`source/js/pasule-fomalhaut-ui.js`）不动。

**Tech Stack:** Hexo 7.3.0, Butterfly 5.3.5, Stylus, Cheerio HTML filter, Node 验证脚本（CommonJS）。

---

## 关键事实（执行前必读）

- `source/css/modify.styl` 构建后同时出现在 `public/css/modify.css`（项目 100% 自有）和 `public/style.css`（含 Butterfly 自身 CSS）。
- **毛玻璃缺失断言只在 `public/css/modify.css` 上做**（它全是项目自有，删干净后无任何 `backdrop-filter: blur`）；`public/style.css` 含 Butterfly 自身的 backdrop-filter，不能整体断言。
- **保留 `backdrop-filter: none` 的覆盖**（如 `#nav`、`.content-wrap`）——它们是用来压制 Butterfly 自身毛玻璃的，删了反而会让 Butterfly 的毛玻璃回来。本次只删 `blur(...)`，不删 `none`。
- `Edit` 工具按内容匹配（非行号）。删除会改变后续行号但不影响后续按内容匹配，**只要每个 old_string 唯一即可**。每个分区任务结束后跑 `npm run build` 确认 Stylus 能编译。
- 编译输出空格形态以构建结果为准：下文断言同时覆盖 `'backdrop-filter: blur'` 与 `'backdrop-filter:blur'` 两种写法；`-webkit-backdrop-filter: blur` 含子串 `backdrop-filter: blur`，故被一并覆盖。

## File Structure

| 文件 | 责任 | 本次改动 |
|---|---|---|
| `tools/verify-fomalhaut-home.cjs` | 首页结构 + 毛玻璃/死类断言 | 加 blur 缺失 + 死类缺失断言 |
| `tools/verify-generated-pages.cjs` | 全站页面内容断言 | 翻转 spotlight-card 断言 |
| `source/css/modify.styl` | 项目主样式（去毛玻璃 + 删死代码主战场） | 分 3 区改 |
| `source/_data/styles.styl` | Butterfly 注入的项目样式 | 清残留半透明（确认无 blur） |
| `_config.butterfly.yml` | 主题配置 | `background:` 换柔和色 |
| `source/_data/content-map.yml` | 内容映射数据 | 删死数据字段 |

---

### Task 1: 把目标状态写进验证脚本（失败的测试）

**Files:**
- Modify: `tools/verify-fomalhaut-home.cjs`
- Modify: `tools/verify-generated-pages.cjs`

- [ ] **Step 1: 在 `verify-fomalhaut-home.cjs` 末尾的 `console.log` 之前插入毛玻璃缺失 + 死类缺失断言**

在 `mustNotContainInRule('public/style.css', '.pasule-global-music-panel', 'backdrop-filter');`（现有第 75 行）之后、`console.log(...)` 之前插入：

```js
// De-glass: modify.css is 100% project-owned; after de-glass it has zero blur.
mustNotContain('public/css/modify.css', 'backdrop-filter: blur');
mustNotContain('public/css/modify.css', 'backdrop-filter:blur');

// Dead homepage CSS removed (gen-1 fomalhaut / media-hero leftovers).
[
  '.pasule-home-shell',
  '.pasule-home-hero',
  '.pasule-home-section',
  '.pasule-home-grid',
  '.pasule-feature-card',
  '.pasule-series-card',
  '.pasule-project-spotlight-card',
  '.pasule-announcement-section',
  '.pasule-eyebrow',
  '.pasule-hero-copy',
  '.pasule-hero-actions'
].forEach(cls => mustNotContain('public/css/modify.css', cls));

// Live classes that must survive (still rendered by projects / about / posts / home).
['.pasule-project-card', '.pasule-about-panel', '.pasule-card-grid', '.pasule-section-head', '.pasule-card-kicker']
  .forEach(cls => mustContain('public/css/modify.css', cls));
```

- [ ] **Step 2: 在 `verify-generated-pages.cjs` 翻转 spotlight-card 断言**

把现有行（第 43 行）：

```js
expectContains('public/style.css', '.pasule-project-spotlight-card');
```

改为：

```js
expectContains('public/style.css', '.pasule-project-card');
expectNotContains('public/css/modify.css', '.pasule-project-spotlight-card');
```

- [ ] **Step 3: 构建并运行验证，确认失败**

Run:

```bash
npm run build && node tools/verify-fomalhaut-home.cjs
```

Expected: 失败，报 `Unexpected "backdrop-filter: blur" in public/css/modify.css`（或 `Unexpected ".pasule-home-hero" ...`）——因为此刻样式尚未清理。

- [ ] **Step 4: Commit**

```bash
git add tools/verify-fomalhaut-home.cjs tools/verify-generated-pages.cjs
git commit -m "test: assert de-glassed and slimmed homepage CSS"
```

---

### Task 2: modify.styl 第 1 区（行 ~188–373：tokens / gen-1 首页 / 链接）

**Files:**
- Modify: `source/css/modify.styl`

- [ ] **Step 1: 去毛玻璃 `.pasule-link-stack a`**

old_string:

```stylus
    border-radius: 12px
    background: rgba(255,255,255,.56)
    backdrop-filter: blur(6px)
    -webkit-backdrop-filter: blur(6px)
    border: 1px solid var(--pasule-line)
```

new_string:

```stylus
    border-radius: 12px
    background: var(--pasule-surface-soft)
    border: 1px solid var(--pasule-line)
```

- [ ] **Step 2: 删死类 home-hero / home-section 成员并去毛玻璃，删 home-hero 独立块**

old_string:

```stylus
.pasule-home-hero,
.pasule-home-section,
.pasule-project-page,
.pasule-about-panel,
.pasule-post-guide
  border-radius: var(--pasule-radius-lg)
  border: 1px solid var(--pasule-line)
  background: var(--pasule-card-bg)
  backdrop-filter: blur(10px)
  -webkit-backdrop-filter: blur(10px)
  box-shadow: var(--pasule-shadow)

.pasule-home-hero
  padding: 28px
  background: var(--pasule-gradient-warm)
```

new_string:

```stylus
.pasule-project-page,
.pasule-about-panel,
.pasule-post-guide
  border-radius: var(--pasule-radius-lg)
  border: 1px solid var(--pasule-line)
  background: var(--pasule-card-bg)
  box-shadow: var(--pasule-shadow)
```

- [ ] **Step 3: 从 `.pasule-eyebrow, .pasule-card-kicker` 移除死类 eyebrow**

old_string:

```stylus
.pasule-eyebrow,
.pasule-card-kicker
  margin: 0 0 8px
```

new_string:

```stylus
.pasule-card-kicker
  margin: 0 0 8px
```

- [ ] **Step 4: 删死块 `.pasule-hero-copy` 与 `.pasule-hero-actions`**

old_string:

```stylus
.pasule-hero-copy
  max-width: 48rem
  color: var(--pasule-muted)
  line-height: 1.8

.pasule-hero-actions
  display: flex
  flex-wrap: wrap
  gap: 12px
  margin-top: 18px

```

new_string:（空字符串，整段删除）

```stylus
```

- [ ] **Step 5: 去毛玻璃 `.pasule-secondary-link, .pasule-mini-link`**

old_string:

```stylus
.pasule-secondary-link,
.pasule-mini-link
  color: var(--pasule-ink)
  background: rgba(255,255,255,.76)
  border: 1px solid var(--pasule-line)
```

new_string:

```stylus
.pasule-secondary-link,
.pasule-mini-link
  color: var(--pasule-ink)
  background: var(--pasule-surface-soft)
  border: 1px solid var(--pasule-line)
```

- [ ] **Step 6: 从 `.pasule-home-grid, .pasule-card-grid, .pasule-about-grid` 移除死类 home-grid**

old_string:

```stylus
.pasule-home-grid,
.pasule-card-grid,
.pasule-about-grid
  display: grid
  gap: 16px
```

new_string:

```stylus
.pasule-card-grid,
.pasule-about-grid
  display: grid
  gap: 16px
```

- [ ] **Step 7: 删死块 `.pasule-home-section`（gen-1，padding: 24px 那个）**

old_string:

```stylus
.pasule-home-section
  padding: 24px
  border-radius: var(--pasule-radius)
  border: 1px solid var(--pasule-line)
  background: var(--pasule-card-bg)
  backdrop-filter: blur(10px)
  -webkit-backdrop-filter: blur(10px)
  box-shadow: var(--pasule-shadow)
```

new_string:（空）

- [ ] **Step 8: 从 feature/series/spotlight 卡组移除死类并去毛玻璃，仅留 project-card / about-panel**

old_string:

```stylus
.pasule-feature-card,
.pasule-series-card,
.pasule-project-spotlight-card,
.pasule-project-card,
.pasule-about-panel
  padding: 20px
  border-radius: var(--pasule-radius-sm)
  border: 1px solid var(--pasule-line)
  background: var(--pasule-glass-bg)
  backdrop-filter: blur(8px)
  -webkit-backdrop-filter: blur(8px)
  transition: transform .25s ease, box-shadow .25s ease
```

new_string:

```stylus
.pasule-project-card,
.pasule-about-panel
  padding: 20px
  border-radius: var(--pasule-radius-sm)
  border: 1px solid var(--pasule-line)
  background: var(--pasule-glass-bg)
  transition: transform .25s ease, box-shadow .25s ease
```

- [ ] **Step 9: 构建确认编译通过**

Run:

```bash
npm run build
```

Expected: 构建成功，无 Stylus 报错（验证脚本此时仍会失败，正常）。

- [ ] **Step 10: Commit**

```bash
git add source/css/modify.styl
git commit -m "refactor(css): de-glass links and drop gen-1 home styles (region 1)"
```

---

### Task 3: modify.styl 第 2 区（行 ~384–960：导航 / firefly 区 / recent-posts / aside）

**Files:**
- Modify: `source/css/modify.styl`

- [ ] **Step 1: 导航胶囊底色变量改实心**

old_string:

```stylus
body
  --pasule-nav-pill-bg: rgba(255,255,255,.58)
  --pasule-nav-pill-border: rgba(114,128,167,.12)
```

new_string:

```stylus
body
  --pasule-nav-pill-bg: var(--pasule-surface-soft)
  --pasule-nav-pill-border: var(--pasule-border)
```

- [ ] **Step 2: 删死块 `[data-pasule-feature-panels]`**

old_string:

```stylus
[data-pasule-feature-panels]
  display: grid
  gap: 14px

```

new_string:（空）

- [ ] **Step 3: 去毛玻璃公告面板 `[data-pasule-announcement-panel]`**

old_string:

```stylus
[data-pasule-announcement-panel]
  padding: 20px
  border-radius: 20px
  border: 1px solid var(--pasule-line)
  background: rgba(255,255,255,.58)
  box-shadow: 0 8px 22px rgba(55, 72, 120, 0.07)
```

new_string:

```stylus
[data-pasule-announcement-panel]
  padding: 20px
  border-radius: 20px
  border: 1px solid var(--pasule-line)
  background: var(--pasule-surface)
  box-shadow: 0 8px 22px rgba(55, 72, 120, 0.07)
```

- [ ] **Step 4: 去毛玻璃导航胶囊 `.menus_item > .site-page`（去 blur）**

old_string:

```stylus
    background: var(--pasule-nav-pill-bg) !important
    backdrop-filter: blur(8px)
    -webkit-backdrop-filter: blur(8px)
    border: 1px solid var(--pasule-nav-pill-border) !important
```

new_string:

```stylus
    background: var(--pasule-nav-pill-bg) !important
    border: 1px solid var(--pasule-nav-pill-border) !important
```

- [ ] **Step 5: 导航胶囊 hover 去半透明**

old_string:

```stylus
    &:hover
      transform: translateY(-1px)
      background: rgba(255,255,255,.78) !important
```

new_string:

```stylus
    &:hover
      transform: translateY(-1px)
      background: var(--pasule-surface) !important
```

- [ ] **Step 6: 删死块 `.pasule-home-shell` 成员 + 独立块（gen-1 max-width 那个）**

old_string:

```stylus
.pasule-home-shell,
.pasule-project-page,
.pasule-about-page,
.pasule-post-guide
  color: var(--pasule-ink)

.pasule-home-shell
  display: grid
  gap: 20px
  margin-bottom: 24px
```

new_string:

```stylus
.pasule-project-page,
.pasule-about-page,
.pasule-post-guide
  color: var(--pasule-ink)
```

- [ ] **Step 7: 删死块 `.pasule-home-shell` / `.pasule-home-grid`（firefly 区 max-width/grid 那两个）**

old_string:

```stylus
.pasule-home-shell
  max-width: var(--pasule-home-max)
  margin: 0 auto 24px

.pasule-home-grid
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, .72fr)
  align-items: start

.pasule-announcement-section
  min-height: 100%
```

new_string:（空）

- [ ] **Step 8: 删死块 `.pasule-feature-card...` min-height: 180px 那组**

old_string:

```stylus
.pasule-feature-card,
.pasule-series-card,
.pasule-project-spotlight-card
  min-height: 180px

```

new_string:（空）

- [ ] **Step 9: 删 `.layout:has(> .pasule-home-shell)` 与其后的 `.pasule-home-shell` / `.pasule-home-grid` / `.pasule-home-section` 死块**

old_string:

```stylus
.layout:has(> .pasule-home-shell)
  flex-wrap: wrap

.pasule-home-shell
  flex: 0 0 100%
  width: 100%
  gap: 14px

.pasule-home-grid
  grid-template-columns: minmax(280px, .72fr) minmax(0, 1.28fr) !important
  gap: 14px
  align-items: start

.pasule-home-section
  padding: 0
  border: 0 !important
  border-radius: 0
  background: transparent !important
  backdrop-filter: none !important
  -webkit-backdrop-filter: none !important
  box-shadow: none !important
```

new_string:（空）

- [ ] **Step 10: 删死块 `.pasule-announcement-section`（firefly 区 blur(16px) 那个大块，含其嵌套规则）**

old_string:

```stylus
.pasule-announcement-section
  min-height: auto
  padding: 22px
  border-radius: 20px
  border: 1px solid rgba(255, 255, 255, 0.72) !important
  background: linear-gradient(160deg, rgba(248, 251, 255, 0.9), rgba(226, 236, 255, 0.82)) !important
  backdrop-filter: blur(16px) saturate(118%) !important
  -webkit-backdrop-filter: blur(16px) saturate(118%) !important
  box-shadow: 0 16px 34px rgba(22, 39, 78, 0.18) !important

  .pasule-section-head
    border-bottom-color: rgba(46, 67, 112, 0.12)

    h2
      color: #152238

    a
      color: #3468d9

  .pasule-hero-copy
    color: #41516b

  .pasule-secondary-link
    background: rgba(255,255,255,.86)
    border-color: rgba(62, 88, 140, 0.16)
    color: #1f2d45
```

new_string:（空）

- [ ] **Step 11: 删死块 firefly 区 `.pasule-feature-card...` padding:18px 那组 + `[data-pasule-series-deck]...`**

old_string:

```stylus
.pasule-feature-card,
.pasule-series-card,
.pasule-project-spotlight-card
  min-height: 0
  padding: 18px
  border-radius: 18px
  box-shadow: 0 8px 22px rgba(55, 72, 120, 0.07)

  h3
    margin: 0 0 8px
    line-height: 1.4
    font-size: 1.05rem
    font-weight: 700

  p
    margin: 0
    line-height: 1.65
    font-size: .88rem

[data-pasule-series-deck],
[data-pasule-project-spotlight]
  align-self: start
```

new_string:（空）

- [ ] **Step 12: 去毛玻璃标签 chips `#aside-content .card-tag-cloud a`**

old_string:

```stylus
    border-radius: 999px
    background: var(--pasule-glass-bg)
    backdrop-filter: blur(6px)
    -webkit-backdrop-filter: blur(6px)
    border: 1px solid var(--pasule-line)
    color: var(--pasule-ink) !important
    font-size: .86rem
```

new_string:

```stylus
    border-radius: 999px
    background: var(--pasule-glass-bg)
    border: 1px solid var(--pasule-line)
    color: var(--pasule-ink) !important
    font-size: .86rem
```

- [ ] **Step 13: 去毛玻璃 `#recent-posts .recent-post-item`（行 ~785 那个通用规则的 blur）**

old_string:

```stylus
  background: var(--pasule-card-bg)
  backdrop-filter: blur(8px)
  -webkit-backdrop-filter: blur(8px)
  box-shadow: var(--pasule-shadow)
  transition: transform .25s ease, box-shadow .25s ease

  &:hover
    transform: translateY(-3px)
    box-shadow: var(--pasule-shadow-lg)

#recent-posts .post_cover
```

new_string:

```stylus
  background: var(--pasule-card-bg)
  box-shadow: var(--pasule-shadow)
  transition: transform .25s ease, box-shadow .25s ease

  &:hover
    transform: translateY(-3px)
    box-shadow: var(--pasule-shadow-lg)

#recent-posts .post_cover
```

- [ ] **Step 14: 去半透明 `#aside-content .card-info .site-data a`**

old_string:

```stylus
    a
      padding: 8px 4px
      border-radius: 12px
      background: rgba(255,255,255,.5)
      border: 1px solid var(--pasule-border)
```

new_string:

```stylus
    a
      padding: 8px 4px
      border-radius: 12px
      background: var(--pasule-surface-soft)
      border: 1px solid var(--pasule-border)
```

- [ ] **Step 15: 构建确认编译通过**

Run:

```bash
npm run build
```

Expected: 构建成功，无 Stylus 报错。

- [ ] **Step 16: Commit**

```bash
git add source/css/modify.styl
git commit -m "refactor(css): de-glass nav/aside/posts and drop dead firefly blocks (region 2)"
```

---

### Task 4: modify.styl 第 3 区（行 ~1029–1874：文章页 / polish pass / 导航下拉）

**Files:**
- Modify: `source/css/modify.styl`

- [ ] **Step 1: 去半透明 `#post-info #post-meta`（去 blur，底板提高不透明度保证图上可读）**

old_string:

```stylus
    padding: 12px 18px
    border-radius: 18px
    border: 1px solid rgba(255,255,255,.18)
    background: rgba(18, 22, 34, 0.26)
    backdrop-filter: blur(14px)
```

new_string:

```stylus
    padding: 12px 18px
    border-radius: 18px
    border: 1px solid rgba(255,255,255,.18)
    background: rgba(18, 22, 34, 0.62)
```

- [ ] **Step 2: 从 polish-pass 的卡组移除死类 feature/series/spotlight，仅留活类**

old_string:

```stylus
.pasule-feature-card,
.pasule-series-card,
.pasule-project-spotlight-card,
.pasule-project-card,
.pasule-guide-panel,
.pasule-brief-stat,
.pasule-rail-stat
  background: var(--pasule-surface-soft) !important
  border: 1px solid var(--pasule-border) !important
  box-shadow: none

.pasule-feature-card:hover,
.pasule-series-card:hover,
.pasule-project-spotlight-card:hover,
.pasule-project-card:hover,
#recent-posts .recent-post-item:hover
  box-shadow: var(--pasule-shadow-lift) !important
  transform: translateY(-2px)
```

new_string:

```stylus
.pasule-project-card,
.pasule-guide-panel,
.pasule-brief-stat,
.pasule-rail-stat
  background: var(--pasule-surface-soft) !important
  border: 1px solid var(--pasule-border) !important
  box-shadow: none

.pasule-project-card:hover,
#recent-posts .recent-post-item:hover
  box-shadow: var(--pasule-shadow-lift) !important
  transform: translateY(-2px)
```

- [ ] **Step 3: 去半透明 `.pasule-mini-link, .pasule-rail-link`（polish pass）**

old_string:

```stylus
.pasule-mini-link,
.pasule-rail-link
  min-height: 34px
  border-radius: 999px
  border: 1px solid var(--pasule-border)
  background: rgba(255,255,255,.72)
  color: var(--pasule-body)
  font-weight: 650

  &:hover
    color: var(--pasule-accent)
    border-color: rgba(79,125,243,.24)
    background: rgba(255,255,255,.94)
```

new_string:

```stylus
.pasule-mini-link,
.pasule-rail-link
  min-height: 34px
  border-radius: 999px
  border: 1px solid var(--pasule-border)
  background: var(--pasule-surface-soft)
  color: var(--pasule-body)
  font-weight: 650

  &:hover
    color: var(--pasule-accent)
    border-color: rgba(79,125,243,.24)
    background: var(--pasule-surface)
```

- [ ] **Step 4: 去毛玻璃导航下拉 `.menus_item_child`（polish pass，去 blur）**

old_string:

```stylus
  .menus_item_child
    border: 1px solid var(--pasule-border)
    background: var(--pasule-surface-strong)
    backdrop-filter: blur(12px) saturate(112%)
    -webkit-backdrop-filter: blur(12px) saturate(112%)
```

new_string:

```stylus
  .menus_item_child
    border: 1px solid var(--pasule-border)
    background: var(--pasule-surface-strong)
```

- [ ] **Step 5: 导航下拉容器底色去半透明（行 ~465）**

old_string:

```stylus
      border-radius: 10px
      background: rgba(255,255,255,.94)
      box-shadow: 0 12px 30px rgba(22, 39, 78, 0.18)
```

new_string:

```stylus
      border-radius: 10px
      background: var(--pasule-surface-strong)
      box-shadow: 0 12px 30px rgba(22, 39, 78, 0.18)
```

- [ ] **Step 6: 扫尾——确认 modify.styl 再无 `blur(` 残留**

Run:

```bash
grep -n "blur(" source/css/modify.styl
```

Expected: 无输出（所有 `backdrop-filter: blur` 已清除；若仍有命中，按"去 blur 行"规则删除该两行）。

- [ ] **Step 7: 构建确认编译通过**

Run:

```bash
npm run build
```

Expected: 构建成功。

- [ ] **Step 8: Commit**

```bash
git add source/css/modify.styl
git commit -m "refactor(css): de-glass article panels and nav dropdown (region 3)"
```

---

### Task 5: styles.styl 残留清理

**Files:**
- Modify: `source/_data/styles.styl`

- [ ] **Step 1: 确认无 blur / 半透明面板残留**

Run:

```bash
grep -nE "blur\(|rgba\(255, *255, *255" source/_data/styles.styl
```

Expected: 无输出（该文件已是 `backdrop-filter: none` + 实心 `#fff`）。若有命中，按同样规则改为实心 token / 删 blur 两行，并 `npm run build` 确认通过。

- [ ] **Step 2: 若有改动则提交（无改动跳过）**

```bash
git add source/_data/styles.styl
git commit -m "refactor(css): drop residual translucency in injected styles"
```

---

### Task 6: 内容区背景换柔和底

**Files:**
- Modify: `_config.butterfly.yml:103`
- Modify: `source/css/modify.styl`

- [ ] **Step 1: 配置里把全屏大图背景换成柔和色**

`_config.butterfly.yml` 现有行：

```yaml
background: https://pic1.imgdb.cn/item/6805d3a258cb8da5c8bb423b.jpg
```

改为：

```yaml
background: '#eef2fb'
```

（顶部 banner 仍由 `default_top_img`(第 73 行) + 静态 banner 逻辑提供，不动。）

- [ ] **Step 2: 在 modify.styl 末尾追加 `#web_bg` 柔和底（含深色）**

在 `source/css/modify.styl` 文件末尾追加：

```stylus
// Soft, calm content background (xtower-style); banner image stays on the header.
#web_bg
  background: linear-gradient(180deg, #f3f6fd 0%, #e9eefb 100%) !important

[data-theme='dark'] #web_bg
  background: #10131e !important
```

- [ ] **Step 3: 构建确认编译通过**

Run:

```bash
npm run build
```

Expected: 构建成功。

- [ ] **Step 4: Commit**

```bash
git add _config.butterfly.yml source/css/modify.styl
git commit -m "feat(home): soften content background to a calm surface"
```

---

### Task 7: 删除 content-map.yml 死数据

**Files:**
- Modify: `source/_data/content-map.yml`

- [ ] **Step 1: 删除 `home.hero` 与 `home.announcement` 两个死字段块**

old_string:

```yaml
  hero:
    eyebrow: ""
    title: ""
    description: ""
    primary_text: "浏览文章档案"
    primary_link: "/archives/"
    secondary_text: "打开项目页"
    secondary_link: "/projects/"
  announcement:
    title: "公告"
    description: "精选文章、项目页与归档入口都在这里。"
  music:
```

new_string:

```yaml
  music:
```

- [ ] **Step 2: 删除 `home.topic_atlas` / `home.featured_titles` / `home.series_deck` 三个死字段块**

删除从 `  topic_atlas:` 行开始、到 `series_deck` 整块结束（即顶层 `projects:` 之前）的全部内容。删除后 `home:` 块应只剩 `banner` / `layout` / `music` 三个子键，且其后紧跟空行 + `projects:`。

old_string（从 `  topic_atlas:` 到 `series_deck` 末项，直到 `projects:` 之前——见 content-map.yml 第 30–78 行整段）起始锚点：

```yaml
  topic_atlas:
    - title: "架构观察室"
```

结束锚点（该块最后内容，其后是空行与 `projects:`）：

```yaml
        - "Git工作流与团队协作最佳实践"

projects:
```

执行：用 Read 打开 `source/_data/content-map.yml` 确认第 30–77 行为 `topic_atlas`/`featured_titles`/`series_deck` 整段，将这 48 行（含其间所有子项）整体删除，使 `  music:` 块之后直接是空行 + `projects:`。

- [ ] **Step 3: 校验 YAML 合法 + 构建通过**

Run:

```bash
node -e "const y=require('js-yaml');y.load(require('fs').readFileSync('source/_data/content-map.yml','utf8'));console.log('yaml ok')" && npm run build
```

Expected: 打印 `yaml ok` 且构建成功。（若 `js-yaml` 不可用，跳过校验、直接 `npm run build`，Hexo 解析 data 失败会报错。）

- [ ] **Step 4: Commit**

```bash
git add source/_data/content-map.yml
git commit -m "chore(data): drop dead home content-map fields (hero/announcement/atlas/featured/series)"
```

---

### Task 8: 全量验证 + 人工核验

**Files:**
- No source files（仅运行验证；如需微调回到对应文件）

- [ ] **Step 1: 干净重建 + 跑两个验证脚本**

Run:

```bash
npm run build && node tools/verify-fomalhaut-home.cjs && node tools/verify-generated-pages.cjs
```

Expected: 两行成功输出 —— `verify-fomalhaut-home: checks passed` 与 `verify-generated-pages: checks passed`。

若失败：
- 报 `backdrop-filter: blur` → 回 Task 4 Step 6 的 grep 找漏网 blur。
- 报某 `.pasule-*` 死类仍在 → 回对应 Task 找未删干净的块。
- 报某活类缺失（如 `.pasule-project-card`）→ 说明 Task 2 Step 8 / Task 4 Step 2 误删了活成员，补回。

- [ ] **Step 2: 启动本地服务器人工核验**

Run:

```bash
npm run server -- --port 4000
```

打开 `http://localhost:4000/`，逐项确认（桌面 + 移动 + 暗色）：

```text
首页：三栏布局完好；导航胶囊/下拉、标签 chips、快捷跳转、公告面板均为实心、无模糊
首页：卡片为实心浅色 + 发丝描边 + 极淡阴影；内容区背后是柔和底而非大图；无横向滚动
文章页：article brief / reading rail / outro / 头部 meta 无毛玻璃；头部 meta 在 banner 图上文字清晰可读
about / projects：面板实心无模糊，布局不破（项目卡、关于面板正常）
暗色模式：以上各项无模糊、配色协调；内容区背景为深实色
音乐播放器：全站浮动按钮可展开/收起；空歌单 ID 显示占位文案、不报错
```

- [ ] **Step 3: 如人工核验需微调（如导航胶囊实心过重 / 柔和底色值），改对应文件后重建并重跑 Step 1，然后提交**

```bash
git add -A
git commit -m "polish(home): tune solid surfaces after manual review"
```

---

## Self-Review

**1. Spec coverage：**
- Spec A 去毛玻璃 → Task 2/3/4（导航胶囊/下拉、link-stack、tag chips、公告、次级/rail/mini 链接、post-meta、recent-post-item、card-info）+ Task 5（styles.styl 残留）✓
- Spec B 背景柔和 → Task 6 ✓
- Spec C 删死 CSS → Task 2/3（home-shell/hero/section/grid、feature/series/spotlight、announcement-section、eyebrow/hero-copy/hero-actions、feature-panels/series-deck/project-spotlight 属性）+ polish-pass 成员裁剪（Task 4 Step 2）✓
- Spec D 删死数据 → Task 7 ✓
- Spec E 验证 → Task 1（断言）+ Task 8（通过）✓
- "保留仅去毛玻璃的活类" → Task 1 Step 1 末尾活类存在断言守护 ✓

**2. Placeholder scan：** 无 TBD/TODO；删除步骤以"new_string:（空）"明确表示整段删除；每个改动均给出 old/new 实体片段。Task 7 Step 2 的大段删除以起止锚点 + Read 确认行号方式给出（YAML 缩进敏感，故用锚点而非 48 行全文，并要求先 Read 确认）。

**3. Type/命名一致性：** 验证脚本里断言的类名（`.pasule-project-card` 等活类、`.pasule-project-spotlight-card` 等死类）与 modify.styl 任务中保留/删除的类名一致；`mustNotContain`/`mustContain`/`expectContains`/`expectNotContains` 均为两脚本现有函数；`var(--pasule-surface)` / `--pasule-surface-soft` / `--pasule-surface-strong` / `--pasule-border` 均为文件 polish-pass `:root` 已定义的 token（运行时解析，前后引用均可）。
