# Pasule Article Reading Rail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为文章页增加信息头、阅读轨道、升级导览卡和文末收束区，让文章阅读界面更接近 Fomalhaut 的编排感。

**Architecture:** 继续采用 Hexo `after_render:html` 注入方案，不改 Butterfly 核心源码。结构由 `scripts/pasule-post-guide.js` 生成，交互由 `source/js/pasule-fomalhaut-ui.js` 管理，视觉层全部收束到 `source/css/modify.styl`。

**Tech Stack:** Hexo, Butterfly, Cheerio, Stylus, vanilla JS

---

### Task 1: Define Verification Markers

**Files:**
- Modify: `tools/verify-generated-pages.cjs`

- [ ] 增加文章页第二轮结构标记校验。
- [ ] 让校验在实现前失败，确认检测覆盖了新需求。

### Task 2: Build Article Page Injection

**Files:**
- Modify: `scripts/pasule-post-guide.js`

- [ ] 为文章页收集 headings、估算阅读时长、推导系列位置和推荐跳转。
- [ ] 注入 `Article Brief` 信息头。
- [ ] 升级 `Reading Guide` 为三段式导览。
- [ ] 在侧栏 sticky 区注入 `Reading Rail`。
- [ ] 在正文末尾注入 `Article Outro`。

### Task 3: Add Visual System

**Files:**
- Modify: `source/css/modify.styl`

- [ ] 添加文章页第二轮卡片、统计块、阅读轨道和文末收束区样式。
- [ ] 统一 TOC 卡、系列卡与新阅读轨道的视觉层级。
- [ ] 补移动端布局规则，避免文章正文被侧栏式设计压缩。

### Task 4: Add Progress Interaction

**Files:**
- Modify: `source/js/pasule-fomalhaut-ui.js`

- [ ] 新增文章页阅读进度同步逻辑。
- [ ] 同步更新阅读百分比、进度条和当前章节标题。
- [ ] 保证 DOMContentLoaded 和 PJAX 下都能正常初始化。

### Task 5: Verify

**Files:**
- Verify: `public/2025/10/20/Java并发编程深度解析/index.html`

- [ ] 运行 `npm run build`
- [ ] 运行 `node tools/verify-generated-pages.cjs`
- [ ] 检查样板文章页输出中是否具备四个新标记和升级后的侧栏结构
