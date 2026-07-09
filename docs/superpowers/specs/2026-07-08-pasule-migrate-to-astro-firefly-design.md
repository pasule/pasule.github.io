# Pasule Blog 迁移至 Astro Firefly 主题设计

- Date: 2026-07-08
- Project: `pasule-blog`（仓库 `pasule/pasule.github.io`）
- 现状: Hexo 7.3.0 + Butterfly 5.3.5 + Cheerio 自定义层
- 目标: 整体替换为 Astro Firefly 主题（CuteLeaf/Firefly，基于 saicaca/fuwari）
- References:
  - https://github.com/CuteLeaf/Firefly
  - https://firefly.cuteleaf.cn/
  - https://github.com/saicaca/fuwari
- Status: 设计完成，待评审

## Context

`pasule-blog` 当前是一个重度定制的 Hexo + Butterfly 博客：标准 Butterfly 渲染被 Cheerio HTML 过滤层二次改写，形成首页三栏布局、文章 Brief/PostGuide/ReadingRail/Article Outro 阅读流、全局音乐播放器和一套自定义设计令牌。站点部署在 `pasule.github.io` 用户站（GitHub Pages），源码与构建产物同仓库：源码在 `hexo-source` 分支，`hexo-deployer-git` 把构建产物推到 `main` 分支供 Pages 读取。

用户决定整体迁移到 Astro 生态的 Firefly 主题。定位明确：**全部旧定制作废，组件 UI 全部采用 Firefly 原生**，只做博客内容迁移。Firefly 是一个功能远超当前站点的现代主题（双 sidebar 三栏首页、Svelte islands、Pagefind 搜索、Giscus 评论、OG 图自动生成、樱花特效、i18n、Calendar 热力图），现有站点仅 12 篇文章、无评论、无搜索、无分析。

本设计描述如何从 Hexo 迁移到 Astro Firefly：仓库与分支策略、构建部署流水线、内容迁移模型、Firefly 配置、迁移脚本、错误处理与验证。

## Goal

把 `pasule-blog` 从 Hexo + Butterfly 迁移到 Astro + Firefly，保留 12 篇博客文章内容与必要的站点配置，组件 UI 全部使用 Firefly 原生实现，通过 GitHub Actions 自动构建部署。

## 决策汇总

| 维度 | 决策 |
|---|---|
| 迁移目标 | 整体替换为 Firefly，旧 Cheerio 定制层全弃，UI 全用 Firefly 原生 |
| 主题起点 | 直接拉取 CuteLeaf/Firefly 仓库文件树 |
| 仓库 | 同仓库（`pasule.github.io`）换分支 |
| 源码分支 | 新建 `astro-source`，旧 `hexo-source` 保留作回滚备份 |
| 构建方式 | GitHub Actions 自动构建（不本地部署） |
| Pages source | 从"Deploy from a branch (main)"切换为"GitHub Actions" |
| 文章 URL | Firefly 默认 `/posts/<slug>/`，旧日期前缀 URL 不保留、不重定向 |
| frontmatter | 严格按 Firefly schema，自定义字段（series/difficulty/keywords/hero_desc/recommended_next）全弃 |
| 页面范围 | 只搬 Firefly 原生页（about/friends/guestbook/tags/categories/archive），shuoshuo/projects 丢弃 |
| 评论系统 | Giscus（GitHub Discussions，零后端部署） |
| 启用特性 | 音乐播放器 + Pagefind 搜索 + 樱花特效 + OG 图 + RSS + Sitemap |
| 不启用特性 | Live2D/Spine 看板娘、加密文章、i18n 多语言 |
| 音乐歌单 ID | 留空字符串，与 Hexo 版空歌单占位一致，后续自行填入 |
| 执行路径 | 方案 A：脚本化迁移，一次性 Node 脚本转换内容 |
| 验证方式 | 验证逻辑编进迁移脚本末尾，不单独留 verify.cjs |

## Architecture

### 仓库与分支策略

仓库 `pasule/pasule.github.io` 不变。分支策略：

- **`astro-source`（新建）**：Astro 源码 = Firefly 文件树 + 迁移后的内容与配置。push 触发部署。
- **`main`**：GitHub Pages 部署目标。改用 Actions 部署后，Pages 不再读 `main` 分支文件，`main` 可保留旧 Hexo 产物作回滚或清空。
- **`hexo-source`**：保留不动，作回滚兜底，不删除。

### 仓库根结构（astro-source 分支）

```
pasule.github.io/                 (astro-source 分支，基于 Firefly)
├─ src/
│  ├─ config/                     # Firefly 配置（TS）
│  │  ├─ siteConfig.ts            # 标题/描述/URL/语言/主题色/分页
│  │  ├─ profileConfig.ts         # 头像/昵称/简介/社交链接
│  │  ├─ navBarConfig.ts          # 导航菜单
│  │  ├─ sidebarConfig.ts         # 侧栏 widget 组合
│  │  ├─ friendsConfig.ts         # 友链（从 link.yml 迁移）
│  │  ├─ musicConfig.ts           # 音乐（id 留空）
│  │  ├─ commentConfig.ts         # Giscus 配置
│  │  └─ effectsConfig.ts         # 樱花特效开启
│  ├─ content/
│  │  ├─ posts/                   # 12 篇迁移后的 md
│  │  └─ spec/                    # about.md, friends.mdx, guestbook.md
│  ├─ assets/images/              # 封面/头像/壁纸
│  └─ ...（Firefly 其余目录原样保留）
├─ public/                        # 静态资源 + Obsidian 图片
│  ├─ assets/<post-slug>/         # 迁移拷贝的 Obsidian 图片
│  ├─ gallery/, favicon/, pio/ 等
├─ scripts/
│  ├─ migrate-from-hexo.mjs       # 一次性迁移脚本（含末尾验证）
│  └─ ...（Firefly 自带 generate-icons/lqips/subset-fonts）
├─ astro.config.mjs               # Firefly 原样
├─ .github/workflows/deploy.yml   # GitHub Pages 部署
├─ package.json                   # Firefly 原样（pnpm）
└─ pnpm-lock.yaml
```

### 构建流水线

push 到 `astro-source` → GitHub Actions（Node 22 + pnpm 9）→ `pnpm install` → `pnpm build`（Firefly 构建 = generate-icons → generate-lqips → astro build → subset-fonts → pagefind）→ `dist/` 通过 `actions/deploy-pages@v4` 发布到 GitHub Pages。

不再需要 `tools/deploy-fix.cjs`（那个 HTTP/1.1 + 清代理 workaround 是 hexo-deployer-git 本地推送的产物，Astro 走 Actions 不涉及本地 git 推送）。

### 部署模式切换（关键）

GitHub Pages 用户站 `pasule.github.io` 默认 Source = "Deploy from a branch"（读 `main` 分支）。改用 Actions 部署后必须**一次性**切换：

- 仓库 Settings → Pages → Source 改为 "GitHub Actions"
- 切换后 Pages 不再读任何分支文件，改由 workflow artifact 发布
- `main` 分支存废不影响部署

未切换则 workflow 跑成功但站点不更新。此项标为部署期必做，不在脚本内。

## Content Migration

### frontmatter 映射

| Hexo 字段 | Firefly 字段 | 转换规则 |
|---|---|---|
| `title` | `title` | 直接搬；无则报错跳过 |
| `date` | `published` | ISO 日期；无则用文件 mtime 兜底，再无则跳过 |
| `updated` | `updated` | 有则搬（optional） |
| `published: false` | `draft: true` | 测试.md 走此条 |
| `cover` | `image` | URL 直接搬；无则留空 |
| `categories: [...]` | `category` | 数组取首项作单字符串；嵌套 `[[x]]` 取最深一级 |
| `tags` | `tags` | 数组直接搬 |
| `sticky: 1` | `pinned: true` | 微服务架构设计那篇 |
| `description` | `description` | 直接搬 |
| `series/difficulty/keywords/hero_desc/recommended_next` | - | 丢弃 |
| -（Hexo 无） | `lang: "zh-CN"` | 脚本统一写入 |
| -（Hexo 无） | `comment: true` | 默认开启评论 |

不写 Firefly schema 的内部字段（`prevTitle/prevSlug/nextTitle/nextSlug`），由 Firefly 构建时自动填充。

### slug 生成

Firefly 用文件名（去扩展名）作 slug，URL = `/posts/<slug>/`。迁移脚本**保留原文件名**，不强行改名：

- `Java并发编程深度解析.md` → `/posts/Java并发编程深度解析/`
- `校园网串流方案.md` → `/posts/校园网串流方案/`
- `路由的理解4.md` → `/posts/路由的理解4/`（文件名带 4 但标题是"路由的理解"，保留原文件名）
- `测试.md` → `/posts/测试/`（draft）

中文 slug 支持，浏览器自动编码为 `%E...`，可接受。

### Obsidian 图片路径（关键坑）

`校园网串流方案` 用相对路径 `assets/校园网串流方案/file-*.png` 引用 15 张图。迁移策略：

1. `migrateAssets()` 把 `source/_posts/assets/<post-slug>/` 整目录拷到 Astro `public/assets/<post-slug>/`
2. `rewriteImagePaths()` 把正文里的相对路径重写为绝对路径：
   - `![](assets/校园网串流方案/...)` → `![](/assets/校园网串流方案/...)`
   - `![](./assets/...)` → `![](/assets/...)`
   - `<img src="assets/...">` → `<img src="/assets/...">`
   - 外部 URL `https://...` 不动
3. 源目录不存在时记录警告但继续（图片可能 404，不阻断迁移）

其他文章封面为外部 URL（jsdelivr/dusays），不受影响。

### spec 页迁移

| 现有 | Firefly 目标 | 处理 |
|---|---|---|
| `source/about/index.md`（4 HTML panel） | `src/content/spec/about.md` | HTML 转 markdown（h1/h2/ul/p/a 保留，未知标签剥掉留文本） |
| `source/_data/link.yml`（2 分类 3 友链） | `src/config/friendsConfig.ts` | 扁平化一维数组，丢 `class_name` 分类，保留 name/link/avatar/desc |
| `source/comments/index.md`（空 body，envelope 动画） | `src/content/spec/guestbook.md` | 内容留空，靠 Giscus 评论区驱动 |

### 正文处理

md 正文原样保留。Hexo marked 与 Astro remark 都吃标准 markdown，正文无需改写。BOM 统一剥离（about 等文件带 UTF-8 BOM，不剥离会破坏 YAML 解析）。

## Firefly Configuration

### siteConfig 核心配置

```ts
title: "Pasule Blog"
subtitle: "pasule的个人博客网站喵~"
site_url: "https://pasule.github.io"
description: "pasule的个人博客网站喵~"
keywords: ["Pasule", "博客", "技术博客"]
lang: "zh-CN"
SITE_LANG: "zh_CN"
timezone: "Asia/Shanghai"
siteStartDate: "2025-01-01"
themeColor: { hue: 165, fixed: false, defaultMode: "system" }  // Firefly 默认绿，跟随系统
pageWidth: 16
pagination: { postsPerPage: 10 }
post: { showLastModified: true, generateOgImages: true }
```

### 特性启用清单

| 特性 | 状态 | 配置位置 | 说明 |
|---|---|---|---|
| Pagefind 搜索 | 启用 | Firefly 自带，构建时 `pagefind --site dist` | 导航栏搜索框 |
| 樱花特效 | 启用 | `effectsConfig.ts` `enable: true` | 默认开，用户可关 |
| 音乐播放器 | 启用 | `musicConfig.ts` meting 模式 | id 留空（空歌单占位），侧栏 widget + 导航栏入口 |
| Giscus 评论 | 启用 | `commentConfig.ts` `type: "giscus"` | 文章页 + guestbook |
| OG 图自动生成 | 启用 | `post.generateOgImages: true` | satori 生成社交分享图 |
| RSS | 启用 | Firefly 自带 | `/rss.xml` |
| Sitemap | 启用 | Firefly 自带 | 过滤已禁用页面 |
| Live2D | 不启用 | `pioConfig.ts` 关闭 | 按决策 |
| Spine 看板娘 | 不启用 | `pioConfig.ts` 关闭 | 按决策 |
| 加密文章 | 不启用 | - | 保留能力但不配置 |
| i18n | 单语言 | 仅 `zh_CN` | Firefly 翻译文件保留不删 |

### 侧栏 widget 组合（sidebarConfig.ts）

- **左栏**：`profile`（头像/简介/社交）、`announcement`（"欢迎来到 Pasule Blog"）、`music`、`categories`、`tags`
- **右栏**：`stats`（文章数/分类数/标签数/总字数/运行时长）、`calendar`（文章热力图）、`sidebarToc`（仅文章页）

`shuoshuo`/`projects` 不进任何栏、不进导航。

### 导航菜单（navBarConfig.ts）

```
首页 -> /
文章 -> 归档 /archive, 标签 /tags, 分类 /categories
友链 -> /friends
留言 -> /guestbook
关于 -> /about
搜索 -> Pagefind
```

去掉原"生活"（说说/相册）和"站点"（项目/留言板）分组。保留友链和留言为顶级项。

### Giscus 配置（部署期）

启用 Giscus 需部署期手工完成（不在脚本内）：

1. 仓库 `pasule.github.io` 设为 public（已满足）
2. 开启 Discussions 功能
3. 装 Giscus GitHub App 并授权
4. 在 https://giscus.app 生成 `repo`、`repoId`、`category`、`categoryId` 填入 `commentConfig.ts`

`commentConfig.ts` 脚本只留占位字段，部署后填入实际值。

### 音乐播放器占位

`musicConfig.ts`：meting 模式、server netease。歌单 ID 留空字符串 `""`，与 Hexo 版空歌单占位行为一致。Firefly 空歌单显示空列表，非阻断，用户后续填入自己的网易云歌单 ID 即启用。不预填 Firefly 示例歌单 ID，避免引入不属于本站的内容。

## Migration Script

### 定位

- 路径：`scripts/migrate-from-hexo.mjs`
- 语言：ESM（`.mjs`，与 Firefly 的 `generate-lqips.ts` 一致）
- 输入：旧 Hexo 仓库内容（只读源，路径在脚本常量配置）
- 输出：写入当前 Astro 仓库的 `src/content/posts/`、`src/content/spec/`、`src/config/`、`public/assets/`
- 特性：**幂等**——每次运行先清空输出目录再重写，可反复跑

### 结构

```
scripts/migrate-from-hexo.mjs
├─ 配置常量（源路径、映射规则表）
├─ cleanFireflySamples()     # 清理 Firefly 示例文章/配置
├─ 工具函数
│  ├─ frontmatterMap(hexoFm, slug) -> fireflyFm
│  ├─ slugFromFile(filename) -> string
│  ├─ rewriteImagePaths(md, slug) -> md
│  ├─ htmlToMarkdown(html) -> md          # about 页
│  ├─ friendsYamlToTs(yaml) -> ts
│  └─ stripBom(content) -> content
├─ migratePosts()            # 遍历 _posts，转 frontmatter + 正文 + 图片
├─ migrateSpec()             # about.md / guestbook.md
├─ migrateFriends()          # friendsConfig.ts
├─ migrateAssets()          # copy _posts/assets -> public/assets
├─ verifyMigration()         # 末尾断言
└─ main()                     # 串联 + 打印报告
```

### frontmatter 映射实现

```js
function frontmatterMap(hexoFm, slug) {
  const fb = {
    title: hexoFm.title,
    published: toISODate(hexoFm.date),
    lang: 'zh-CN',
    comment: true,
  };
  if (hexoFm.updated) fb.updated = toISODate(hexoFm.updated);
  if (hexoFm.description) fb.description = hexoFm.description;
  if (hexoFm.cover) fb.image = hexoFm.cover;
  // categories 数组 -> 单字符串，取首项（嵌套取最深一级）
  if (hexoFm.categories?.length) fb.category = flattenCategory(hexoFm.categories[0]);
  if (hexoFm.tags?.length) fb.tags = hexoFm.tags;
  // sticky -> pinned
  if (hexoFm.sticky) fb.pinned = true;
  // 草稿
  if (hexoFm.published === false) fb.draft = true;
  return fb;
}
```

### 图片路径重写实现

```js
function rewriteImagePaths(md, slug) {
  // ![](assets/...) 和 ![](./assets/...) -> ![](/assets/...)
  let out = md.replace(
    /!\[([^\]]*)\]\(\.?\/?(assets\/[^)]+)\)/g,
    (m, alt, p) => `![${alt}](/${p})`
  );
  // <img src="assets/..."> -> <img src="/assets/...">
  out = out.replace(
    /(<img[^>]+src=")\.?\/?(assets\/[^"]+)(")/g,
    (m, pre, p, post) => `${pre}/${p}${post}`
  );
  return out;
}
```

### 原子写入

脚本中途失败不写半截文件：所有输出在内存组装完成，全部成功后一次性写入（或先写临时目录再原子替换）。失败时打印是哪篇、哪步、什么错，退出码非 0。

### 迁移报告

脚本跑完打印转换结果表：

```
✓ Java并发编程深度解析        -> posts/Java并发编程深度解析  [category=Java技术栈, tags=5, pinned=false]
✓ 微服务架构设计原理与最佳实践 -> posts/微服务架构设计原理与最佳实践 [pinned=true]
✓ 校园网串流方案              -> posts/校园网串流方案 [assets=15 images]
✓ 测试                       -> posts/测试 [draft=true]
...
迁移完成: 12 篇文章, 1 篇草稿, 15 张图片, 3 个友链
```

## Firefly Repo Bootstrap

### 源码拉取

从 `astro-source` 分支起步，用 `degit` 拉取 Firefly master 完整文件树到仓库根：

```bash
npx degit CuteLeaf/Firefly#master .
```

`degit` 只拉文件不带 git 历史，仓库根保持自己的 git 历史。

### 清理示例内容

| 清理对象 | 动作 |
|---|---|
| `src/content/posts/*.md` | 全删（示例文章） |
| `src/content/spec/*.md` | 全删（示例 about/friends/guestbook） |
| `src/assets/images/` 示例壁纸 | 删示例，留迁入的头像/封面 |
| `public/pio/` | 保留（模型不启用也不碍事） |
| `public/gallery/` | 删示例相册 |
| `public/anime-list.json` | 删（不用 bangumi/anime） |
| `src/config/*.ts` | 不删，只改值（保留 Firefly 配置结构） |

清理动作编进迁移脚本 `cleanFireflySamples()` 步骤，整个迁移一键完成。

### .gitignore

确认 Firefly 自带 `.gitignore` 含：`dist/`、`node_modules/`、`.astro/`、`public/pagefind/`、`src/constants/lqips.json`。缺失补上。

### 工具链

- Firefly 用 pnpm 9 + Node 22，与 GitHub Actions workflow 一致
- 本地需装 pnpm（`npm i -g pnpm`）
- Firefly `package.json` 直接用，不改依赖

### 部署 workflow

Firefly 自带 `.github/workflows/deploy.yml`，调整分支：

```yaml
on:
  push:
    branches: [astro-source]    # 原为 master
permissions:
  pages: write
  id-token: write
# build 步骤原样保留
```

## Error Handling

### frontmatter 缺失字段

| 情况 | 处理 |
|---|---|
| 无 `date` | 文件 mtime 兜底；再无则跳过并报错 |
| 无 `categories` | `category` 留空（schema 默认） |
| 无 `tags` | `tags: []`（schema 默认） |
| 无 `cover` | `image` 留空，Firefly 默认封面占位 |
| 无 `description` | `description` 留空（schema 默认） |
| 无 `title` | 报错跳过（必填） |
| `categories` 嵌套 `[[架构设计]]` | 取最深一级 |

### Obsidian 图片路径变体

脚本覆盖：`assets/...`、`./assets/...`、`<img src="assets/...">` 三种写法，外部 URL 不动。源目录不存在则警告但继续。

### 编码

`about/index.md` 等带 UTF-8 BOM，统一 `stripBom()`，避免 BOM 进 frontmatter 破坏 YAML 解析。

### about HTML 转 markdown

`htmlToMarkdown()` 处理 `<h1>/<h2>` → `# / ##`、`<ul><li>` → `- `、`<p>` → 段落空行、`<a href>` → `[text](url)`、未知标签剥掉留文本。转得不完美可接受，about 后续可手工润色。

### friends 分类丢失

现有 link.yml 两分类，Firefly 一维数组无分类概念。脚本扁平化所有友链成一个数组，丢分类名。3 个友链（Hexo、Fomalhaut）同进一个列表。

### 文件名冲突 / 特殊字符

- 中文文件名：Firefly 支持中文 slug，浏览器自动编码
- 空格：当前无，脚本防御性 trim，出现空格时转连字符（不主动改名）
- 重名：跑前校验，重名报错

### 脚本失败

中途崩了不写半截文件（原子写入）。失败时打印哪篇、哪步、什么错，退出码非 0。

### Astro 构建期错误

Firefly content layer 校验在 build 时抛错指明哪篇哪个字段。脚本应让 frontmatter 符合 schema，把错误拦在迁移阶段。

### 部署期错误

- Pages source 没切到 Actions：workflow 跑成功但站点不更新。症状明确，spec 写排查指引。
- Giscus 未配置：评论区空白但不报错。非阻断，部署后补配置。
- 音乐 id 空：播放器空列表，非阻断。

## Testing

### 迁移脚本验证（编进末尾 verifyMigration）

| 断言 | 说明 |
|---|---|
| `src/content/posts/` 下 12 个 md（含 1 草稿） | 文章数量 |
| 每篇含 `title` `published` `lang` | 必填字段 |
| 每篇不含 `series` `difficulty` `recommended_next` | 自定义字段已弃 |
| 微服务架构设计 `pinned: true` | sticky 映射 |
| 测试那篇 `draft: true` | 草稿映射 |
| 校园网串流方案正文无 `](assets/` 残留 | 图片路径已重写 |
| `public/assets/校园网串流方案/` 15 个文件 | 图片已拷贝 |
| `friendsConfig.ts` 含 3 个友链 | 友链数 |
| `about.md` 不含 `<section` | HTML 已转 md |

### 构建验证（本地）

```bash
pnpm install
pnpm build
```

- 退出码 0，无 schema 校验错误
- `dist/posts/<slug>/index.html` 生成文章页（draft 默认不构建）
- `dist/index.html` 首页三栏
- `dist/rss.xml`、`dist/sitemap-index.xml`、`dist/pagefind/`、`dist/og/` 生成

### 运行时验证（本地 dev）

`pnpm dev`（http://localhost:4321）人工核对：

- 首页双 sidebar 三栏、文章列表、分类/标签 chip、公告
- 文章页正文、TOC、阅读进度、相关推荐、Giscus 区块
- `/posts/Java并发编程深度解析/` 中文 slug 可开
- 校园网串流方案 15 张图正常
- Pagefind 搜索能搜到文章
- 樱花特效飘落
- 音乐播放器侧栏卡片 + 展开
- 深色模式切换
- 移动端单栏、无横向溢出

### 部署验证（线上）

push 到 `astro-source` 后：

- GitHub Actions workflow 成功（绿勾）
- `https://pasule.github.io/` 显示新站
- 旧 URL `/2025/10/20/Java并发编程深度解析/` 返回 404（预期，URL 策略已改，接受）
- 新 URL `/posts/Java并发编程深度解析/` 可访问
- Giscus 评论区出现（部署后配完 Giscus 才有）

### 废弃验证

不保留旧 verifier：`verify-fomalhaut-home.cjs` / `verify-generated-pages.cjs` / `verify-post-assets.cjs` 断言的是 Hexo+Cheerio 的 `data-pasule-*` 属性，迁到 Astro 后这些 marker 不存在，全部废弃，不迁移不改写。

## Acceptance Criteria

- `astro-source` 分支含完整 Firefly 文件树，无示例文章残留。
- 12 篇文章迁移至 `src/content/posts/`，frontmatter 严格符合 Firefly schema，自定义字段已弃。
- 校园网串流方案 15 张 Obsidian 图片可访问，正文图片路径为绝对路径。
- about/friends/guestbook 三个 spec 页就位，友链 3 条。
- siteConfig/profile/nav/sidebar/music/comment/effects 配置填入站点信息。
- Giscus 评论、Pagefind 搜索、樱花特效、音乐播放器启用；Live2D/Spine 关闭。
- 本地 `pnpm build` 成功，`pnpm dev` 核对通过。
- GitHub Actions workflow 跑通，`pasule.github.io` 线上显示 Firefly 新站。
- Pages source 已切到 GitHub Actions。
- 旧 `hexo-source` 分支保留作回滚。
- 旧 verifier 工具废弃。

## Non-Goals

- 不保留旧 URL（日期前缀）与重定向，接受旧链接 404。
- 不迁移 shuoshuo（说说）/projects（项目）页面。
- 不保留旧 Cheerio 定制层（Brief/PostGuide/ReadingRail/Article Outro/自定义设计令牌）。
- 不做 Hexo 与 Astro 的性能基线对比。
- 不启用 Live2D/Spine 看板娘、加密文章、i18n 多语言。
- 不引入额外依赖改 Firefly package.json。
- 不改 Firefly 的 slug 生成逻辑（保留中文文件名）。
