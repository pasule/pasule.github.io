# Pasule Article Reading Rail Design

**Date:** 2026-04-09

**Goal:** 在不改动现有背景图、Live2D 和 Butterfly 主体框架的前提下，把文章页推进成更有 Fomalhaut 味道的“阅读界面”，重点强化目录感、信息卡和阅读完成度。

## Scope

- 保留当前文章头图、正文容器、侧栏和现有全站导航结构。
- 不直接改 Butterfly 核心主题源码，继续通过 `scripts/`、`source/css/modify.styl` 和 `source/js/` 做增强。
- 重点处理单篇文章页，不扩散到首页、项目页和归档页。

## Experience Direction

- 文章页顶部增加一层“Article Brief”信息头，用更清晰的卡片方式呈现本篇定位、章节规模、阅读时间、更新时间与所属系列。
- 现有 `Reading Guide` 升级成三段式阅读导览：适合谁读、能拿到什么、推荐怎么读。
- 侧栏新增“Reading Rail”，专门承载阅读进度、当前阅读章节、系列位置和推荐跳转。
- 文末新增“收束区”，把继续阅读、回到归档、项目页跳转做成阅读闭环。

## Data Strategy

- 优先复用现有 front matter：
  - `series`
  - `difficulty`
  - `keywords`
  - `hero_desc`
  - `recommended_next`
  - `description`
- 新字段不作为本轮强依赖，缺省时由脚本根据现有 front matter 和文章结构自动生成文案。

## Structural Changes

### 1. Article Brief

- 插入到文章正文顶部，位于正文标题内容块之前。
- 包含：
  - 本文一句话摘要
  - 预计阅读时间
  - 一级章节数 / 目录规模
  - 所属系列
  - 难度
  - 最后更新时间
  - 快速跳转到前几个核心章节

### 2. Reading Guide 2.0

- 仍沿用现有 `pasule-post-guide` 标记，但内部升级为三张导览卡。
- 三张卡分别承担：
  - 阅读对象
  - 核心收获
  - 推荐阅读路径

### 3. Reading Rail

- 注入到文章页侧栏的 sticky 区顶部。
- 包含：
  - 实时阅读百分比
  - 进度条
  - 当前所在章节标题
  - 系列内位置
  - 下一篇推荐
- 保留并样式整合 Butterfly 原生 TOC 卡与系列卡，使其更像同一组阅读工具，而不是零散侧栏部件。

### 4. Article Outro

- 注入到文章正文末尾。
- 提供：
  - 系列继续阅读入口
  - 推荐下一篇
  - 回到归档
  - 打开项目页

## Interaction

- 通过 `source/js/pasule-fomalhaut-ui.js` 增强文章页滚动逻辑。
- 新增的阅读进度条与百分比和现有右下角百分比共存，但文章页内部信息卡优先承担阅读状态表达。
- 随滚动更新当前章节标题，增强“正在读到哪里”的感知。

## Visual Direction

- 风格采用偏编辑型信息卡，而不是首页那种大面积展示型卡片。
- 关键词：
  - 阅读轨道
  - 信息分层
  - 玻璃感卡片
  - 克制的二次元科技气息
- 强化秩序感：
  - 网格对齐
  - 标题 / 描述 / 统计三级层级
  - 目录与系列的统一视觉壳

## Verification

- 在生成后的文章页中验证以下标记稳定存在：
  - `data-pasule-article-brief`
  - `data-pasule-post-guide`
  - `data-pasule-reading-rail`
  - `data-pasule-article-outro`
- 使用 `Java并发编程深度解析` 作为样板页检查布局。
