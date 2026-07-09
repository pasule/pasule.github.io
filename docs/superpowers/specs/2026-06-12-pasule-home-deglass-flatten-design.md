# Pasule 全站去毛玻璃 + 首页减负设计（纯净扁平 · 贴近 xtower）

- Date: 2026-06-12
- Project: `pasule-blog`
- Stack: Hexo 7.3.0, Butterfly 5.3.5, Stylus, Cheerio HTML filters, vanilla JavaScript
- References:
  - 当前站点：`https://pasule.com/`
  - 视觉参考：`https://xtower.site/`（实心浅色卡 + 发丝描边 + 极淡阴影，无毛玻璃）
  - 参考截图证据：`.firecrawl/xtower-screenshot.png`
- Status: 已与用户确认范围（整站统一）、观感（纯净扁平）、背景（换柔和底）、死数据（一并删除）

## Context

首页当前已是 firefly/xtower 风格三栏布局（`scripts/pasule-home-shell.js` 把首页拆成 左栏资料/音乐/分类/标签 + 中栏文章流 + 右栏公告/统计/归档），结构已贴近 xtower。

问题出在两处"臃肿"：

1. **视觉毛玻璃（glassmorphism）**：导航胶囊、导航下拉、快捷跳转链接、标签 chips、公告面板、文章页头部 meta、若干次级链接，仍在用 `backdrop-filter: blur()` + 半透明 `rgba(255,255,255,.x)` 背景。整体显得重、不够干净。
2. **代码臃肿**：`source/css/modify.styl` 累积了三代首页样式（旧 fomalhaut hero/section/grid、媒体轮播、firefly 三栏），其中第一代大量样式首页已不再渲染，是死代码（约 1874 行里有相当比例无效）。

xtower 的卡片是**实心浅色 + 极淡描边 + 很轻阴影**，完全没有毛玻璃，背景区是柔和纯色/浅渐变而非花哨大图。本次目标是把 Pasule 拉到同一观感，同时清掉死代码。

## Goal

在不改动 firefly 三栏布局逻辑、不动 Butterfly 内核的前提下：

- 整站去掉 `backdrop-filter` 毛玻璃与半透明面板，统一为实心浅色卡（发丝描边 + 极淡阴影）。
- 把内容区背后从全屏大图改为柔和底色，让实心卡干净浮现；顶部 banner 保留艺术大图作氛围。
- 删除首页累积的死 CSS 与对应死数据，真正给文件减负。
- 保留并仅"去毛玻璃" about / projects / post 页面仍在使用的样式。

## Non-Goals

- 不重做三栏布局，不改 `scripts/pasule-home-shell.js` 的结构逻辑。
- 不改 `source/js/pasule-fomalhaut-ui.js` 的交互逻辑（音乐播放器/导航/阅读进度）。
- 不迁移到 Astro/Firefly，不引入新框架或新全局库。
- 不动 Butterfly 主题自身 CSS（仅在项目自有 `modify.styl` / `styles.styl` 里覆盖）。
- 不删除 projects 数据、不破坏 about/projects/post 页面。
- 不改音乐播放器是否启用、不硬编码网易云歌单 ID。

## Confirmed Decisions

1. **范围**：整站统一。首页 + 全站共用导航/下拉 + 文章页（article brief / reading rail / 头部 meta）+ about/projects 页面，全部去毛玻璃改实心。
2. **观感**：纯净扁平，贴近 xtower。实心白/近白卡，发丝级描边，极淡阴影，无模糊无半透明。
3. **背景**：顶部 banner 保留艺术大图；内容区背后换柔和底（浅色近白冷调浅渐变；深色深实色）。
4. **死数据**：一并删除 content-map.yml 中仅服务死板块的字段；projects 数据保留。

## Build Mechanism（影响验证脚本指向）

`source/css/modify.styl` 经构建后同时出现在 `public/css/modify.css`（通过 inject `<link href="/css/modify.css">`）与 `public/style.css`（已用现有验证脚本经验证实：`public/style.css` 含 `.pasule-home-firefly` 等 modify.styl 定义的类）。因此：

- 编辑 `modify.styl` 会同时反映到这两个产物。
- 验证毛玻璃缺失时，**必须按选择器作用域断言**（沿用现有 `mustNotContainInRule(file, selector, 'backdrop-filter')`），不能对整个 `public/style.css` 做"零 backdrop-filter"全局断言——否则会被 Butterfly 自身的 backdrop-filter 误伤。

## Architecture / Files

全部改动落在项目自有定制层：

| 文件 | 改动 |
|---|---|
| `source/css/modify.styl` | 主战场：去毛玻璃 + 删死代码（见下） |
| `source/_data/styles.styl` | 已部分去毛玻璃，统一收尾（确认无残留 blur/半透明面板） |
| `source/_data/content-map.yml` | 删除死数据字段（见下） |
| `_config.butterfly.yml` | 内容区背景换柔和底（`background:` 改柔和色/浅渐变；顶部 banner 图保留） |
| `tools/verify-fomalhaut-home.cjs` | 扩展毛玻璃缺失断言 + 死类名缺失断言 |
| `tools/verify-generated-pages.cjs` | 翻转/移除对已删死类的存在断言（如 `.pasule-project-spotlight-card`） |
| `scripts/pasule-home-shell.js` | **不改** |
| `source/js/pasule-fomalhaut-ui.js` | **不改** |

## A. 去毛玻璃（视觉）

统一规则：**删除所有 `backdrop-filter` / `-webkit-backdrop-filter`；把半透明 `rgba(255,255,255,.x)` 面板背景换成实心 token。**（注：`--pasule-glass-bg`、`--pasule-card-bg`、`--pasule-surface*` 等 token 当前已是实心 `#fff` / 深色实色，工作量主要是删 blur 与少量字面量 rgba 背景。）

需要处理的活动选择器：

| 选择器 | 现状 | 改为 |
|---|---|---|
| `.menus_item > .site-page`（导航胶囊） | `--pasule-nav-pill-bg: rgba(255,255,255,.58)` + `blur(8px)`，hover `rgba(255,255,255,.78)` | 实心淡底 token + 发丝描边，去 blur，hover 实心 |
| `.menus_item_child`（导航下拉） | `rgba(255,255,255,.94)` + `blur(12px) saturate(112%)` | 实心 `--pasule-surface-strong`，去 blur |
| `.pasule-link-stack a`（快捷跳转） | `rgba(255,255,255,.56)` + `blur(6px)` | 实心 `--pasule-surface-soft` + 描边 |
| `#aside-content .card-tag-cloud a`（标签 chips） | 实心底 + `blur(6px)` | 去 blur |
| `[data-pasule-announcement-panel]`（公告） | `rgba(255,255,255,.58)` | 实心 surface |
| `.pasule-secondary-link` / `.pasule-mini-link` / `.pasule-rail-link` | `rgba(255,255,255,.72~.86)` | 实心 `--pasule-surface-soft` |
| `#aside-content .card-info .site-data a` | `rgba(255,255,255,.5)` | 实心 soft |
| `#page-header.post-bg #post-info #post-meta`（文章头部 meta） | `rgba(18,22,34,.26)` + `blur(14px)` | 去 blur；提高底板不透明度（压在 banner 图上保证文字可读），保留一层**不透明**深色底板 |

唯一保留的半透明：仅压在 banner 大图上、纯为文字可读性的遮罩层（`#page-header` 渐变 overlay、post-meta 深色底板）。但**一律不使用 blur**。

暗色模式同步：对应 `[data-theme='dark']` 分支同样去 blur、改实色（token 已具备深色实色值）。

## B. 内容区背景换柔和底

- 顶部 banner：保留现有艺术大图（`default_top_img` / 静态 banner 逻辑不变），作为首屏氛围（与 xtower 一致）。
- 内容区背后：`_config.butterfly.yml` 的 `background:` 由全屏照片改为柔和底——
  - 浅色：近白冷调浅渐变（如 `#f6f8fd` 系）。
  - 深色：深实色（与 `--pasule-surface` 暗色协调）。
- 目的：实心卡浮在柔和底上更干净，避免"实心白卡压在花哨大图上"的厚重感。
- 若深浅模式需各自底色，用 `[data-theme='dark']` body 背景覆盖实现。

## C. 删死代码（CSS 减负）

**确认死亡**（首页 firefly 不渲染，且 about/projects/post 经全仓 grep 确认不使用）→ 从 `modify.styl` 删除其规则、暗色变体、媒体查询变体：

- `.pasule-home-shell`、`.pasule-home-hero`、`.pasule-home-section`、`.pasule-home-grid`
- `.pasule-feature-card`、`.pasule-series-card`、`.pasule-project-spotlight-card`
- `[data-pasule-feature-panels]`、`[data-pasule-series-deck]`、`[data-pasule-project-spotlight]`
- `.pasule-announcement-section`（firefly 用的是 `[data-pasule-announcement-panel]`）
- `.pasule-eyebrow`、`.pasule-hero-copy`、`.pasule-hero-actions`

**分组选择器需外科处理**：当死类与活类写在同一选择器组里（例如 `.pasule-feature-card, .pasule-series-card, .pasule-project-spotlight-card, .pasule-project-card, #recent-posts .recent-post-item { ... }`，或 `.pasule-eyebrow, .pasule-card-kicker`），只移除死类成员，保留活类成员（`.pasule-project-card`、`#recent-posts .recent-post-item`、`.pasule-card-kicker` 等）。

**保留并仅去毛玻璃**（经 grep 确认 about/projects/post 在用）：
`.pasule-about-page`、`.pasule-about-grid`、`.pasule-about-panel`、`.pasule-project-page`、`.pasule-project-grid`、`.pasule-project-card`、`.pasule-project-status`、`.pasule-card-grid`、`.pasule-section-head`、`.pasule-card-kicker`、`.pasule-primary-link`、`.pasule-secondary-link`、`.pasule-mini-link`、`.pasule-rail-link`、`.pasule-link-stack`、`.pasule-stack-list`、`.pasule-guide-links`、`.pasule-post-guide` 及其 guide-* 子类、`.pasule-article-brief` / `.pasule-article-outro` / `.pasule-reading-rail` 等文章页面板。

预期 `modify.styl` 约 1874 行 → 约 1300–1450 行。

## D. 删死数据（content-map.yml）

经全仓 grep 确认：`topic_atlas`、`featured_titles`、`series_deck` 仅在 content-map.yml 自身出现，无任何脚本/模板读取；`home.hero`、`home.announcement` 也无读取者（首页 shell 只读 `home.banner` / `home.layout` / `home.music`；公告来自 Butterfly `card_announcement`）。

删除：`home.hero`、`home.announcement`、`home.topic_atlas`、`home.featured_titles`、`home.series_deck`。

保留：`home.banner`、`home.layout`、`home.music`，以及整个 `projects:` 块（`pasule-projects.js` 在用）。

> 注：文章页里出现的 "Java / 后端成长线" 来自文章 front-matter + Butterfly series 功能，与 content-map 的 `series_deck` 同名但无关，删除后文章页不受影响。

## E. 验证脚本更新

`tools/verify-fomalhaut-home.cjs`：

- 保留现有三栏存在断言、音乐播放器断言、APlayer/Meting 注入断言、顺序断言。
- 扩展按选择器作用域的毛玻璃缺失断言（沿用 `mustNotContainInRule`），覆盖：
  - `.menus_item > .site-page`、`.menus_item_child`、`.pasule-link-stack a`、`.card-tag-cloud a`、`[data-pasule-announcement-panel]`、`.pasule-rail-link`、`.pasule-mini-link`、`#post-info #post-meta`（以及现有的 rail-card / stream-head / recent-post-item / global-music-panel）。
- 新增死类名缺失断言（`public/style.css`）：`.pasule-home-hero`、`.pasule-home-section`、`.pasule-home-shell`、`.pasule-home-grid`、`.pasule-feature-card`、`.pasule-series-card`、`.pasule-project-spotlight-card`、`.pasule-announcement-section`、`.pasule-hero-copy`（及已有的 `.pasule-home-media-hero`、`.pasule-swiper`）。

`tools/verify-generated-pages.cjs`：

- **翻转/移除** `expectContains('public/style.css', '.pasule-project-spotlight-card')`（该类将被删除）→ 改为 `expectNotContains`，或删除该行。
- 保留对活类的存在断言：`.pasule-post-guide`、`.pasule-link-stack`、`.pasule-article-brief`、`.pasule-reading-rail`、`.pasule-article-outro`、`.pasule-home-firefly`、`.pasule-home-stream`、`.card-tag-cloud`、`.pasule-nav-group`，以及 about/projects/post 页面内容断言。

## Error Handling / Risks

- **分组选择器误删**：删死类时若连带删掉同组活类，会破坏 projects/about。对策：逐组检查，只删死成员；删后跑 `verify-generated-pages.cjs` 覆盖 about/projects/post。
- **`!important` 覆盖顺序**：modify.styl 后段"polish pass"已用 `!important` 把多数面板实心化；删前段死规则不应影响后段。删除后需确认无遗留引用。
- **banner 图上文字可读性**：去掉 post-meta 的 blur 后，需用足够不透明的深色底板保证标题/日期在大图上可读。
- **背景改色影响全站**：`background:` 改柔和底会影响所有页面观感；若与某页面冲突，用 `[data-theme]` / body 作用域微调，不回退到大图。
- **构建产物双份**：modify.styl 进 modify.css 与 style.css 两处，验证脚本指向 `public/style.css`（与现状一致）。

## Testing

构建与冒烟：

```bash
npm run build
node tools/verify-fomalhaut-home.cjs
node tools/verify-generated-pages.cjs
```

期望：构建成功，两个验证脚本均打印通过行。

手动浏览器核验（桌面 + 移动）：

- 首页：三栏布局完好；导航胶囊/下拉、标签 chips、快捷跳转、公告面板均为实心无模糊；卡片为实心浅色 + 发丝描边 + 极淡阴影；内容区背后是柔和底而非花哨大图；无横向滚动。
- 文章页：article brief / reading rail / outro / 头部 meta 无毛玻璃；头部 meta 在 banner 图上文字清晰可读。
- about / projects：面板实心无模糊，布局不破。
- 暗色模式：以上各项在 dark 下同样无模糊、配色协调。
- 音乐播放器：全站浮动按钮可展开/收起；空歌单 ID 显示占位文案、不报错。

## Acceptance Criteria

- 全站不再有 `backdrop-filter` 毛玻璃；面板/胶囊/chips/链接均为实心浅色，观感贴近 xtower。
- 顶部 banner 保留艺术大图；内容区背后为柔和底，整体更轻更干净。
- `modify.styl` 删除全部已确认死亡的首页 CSS（含分组选择器中的死成员），文件显著变短。
- content-map.yml 删除全部已确认死亡的数据字段，projects 数据与 about/projects/post 页面不受影响。
- `npm run build` 通过；`verify-fomalhaut-home.cjs` 与 `verify-generated-pages.cjs` 均通过。
- 改动全部局限在项目自有的 CSS / 数据 / 配置 / 验证文件，未改布局逻辑、未改交互 JS、未改 Butterfly 内核。
