<div align="center">

# Pasule Blog

> Keep the Wonder. Keep the Fire

个人技术博客 · 记录后端、架构、网络与折腾日常

[![站点](https://img.shields.io/badge/🌐_pasule.com-在线访问-ff69b4?style=flat-square)](https://pasule.com)
[![RSS](https://img.shields.io/badge/RSS-订阅-orange?style=flat-square)](https://pasule.com/rss/)
[![Astro](https://img.shields.io/badge/Astro-7.0.2-orange?style=flat-square)](https://astro.build)
[![Svelte](https://img.shields.io/badge/Svelte-5-ff3e00?style=flat-square)](https://svelte.dev)
[![Node.js >= 22](https://img.shields.io/badge/node.js-%3E%3D22-brightgreen?style=flat-square)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](./LICENSE)

</div>

---

这是 [pasule.com](https://pasule.com) 的源码仓库——一个基于 **Astro** 构建的静态个人博客，把技术文章、项目实验和长期更新记录整理在同一个站点里。内容以中文为主，希望能持续积累，也保持一点明确的个人气质。

站点使用 [Firefly](https://github.com/CuteLeaf/Firefly) 主题（源自 [Fuwari](https://github.com/saicaca/fuwari)）并做了大量个人定制：双侧边栏布局、自定义主题色、字体子集化、图片 LQIP 占位、Umami 统计分析等。感谢原主题作者的出色工作，具体致谢见文末。

## 📚 内容方向

| 分类 | 大致内容 |
|:---|:---|
| **Java 技术栈** | 并发编程、JUC、Spring 依赖注入与生态演进 |
| **数据库技术** | MySQL 索引原理、查询优化与慢查询定位 |
| **计算机网络** | 路由原理、校园网串流、异地组网与网络防护 |
| **架构设计** | 微服务演进、模块边界划分、家庭服务器服务编排 |
| **开发工具** | Git 工作流、Windows + WSL 协同开发环境 |
| **前端开发** | 加载与渲染性能优化、路由设计 |

文章按 [分类](https://pasule.com/categories/) 和 [标签](https://pasule.com/tags/) 归档，也可以在 [归档页](https://pasule.com/archive/) 按时间浏览。站内提供基于 Pagefind 的全文搜索。

## 🛠 技术栈

- **框架**：[Astro 7](https://astro.build) + [Svelte 5](https://svelte.dev)（交互组件）
- **样式**：[Tailwind CSS 4](https://tailwindcss.com)
- **搜索**：[Pagefind](https://pagefind.app) 客户端全文索引
- **过渡**：Swup 页面切换动画
- **代码高亮**：Expressive Code / Shiki，支持 KaTeX 公式、Mermaid 与 PlantUML 图表
- **图片**：Sharp 生成 LQIP 占位图，上传前自动转 WebP
- **字体**：构建期字体子集化，按需裁剪字符集
- **代码规范**：[Biome](https://biomejs.dev)（tab 缩进、双引号）
- **包管理**：pnpm（Node.js ≥ 22）

## 🚀 本地运行

```bash
# 安装依赖（需先全局安装 pnpm：npm i -g pnpm）
pnpm install

# 启动开发服务器，访问 http://localhost:4321
pnpm dev

# 生产构建：生成图标 → 生成 LQIP → Astro 构建 → 字体子集化 → Pagefind 索引
pnpm build

# 本地预览构建产物
pnpm preview
```

### 常用指令

| 指令 | 说明 |
|:---|:---|
| `pnpm dev` | 启动开发服务器 `localhost:4321` |
| `pnpm build` | 构建站点至 `./dist/` |
| `pnpm preview` | 预览已构建的站点 |
| `pnpm check` | `astro check` 类型与错误检查 |
| `pnpm type-check` | `tsc --noEmit --isolatedDeclarations` |
| `pnpm lint` / `pnpm format` | Biome 检查修复 / 格式化 |
| `pnpm new-post <filename>` | 创建新文章 |
| `pnpm icons` / `pnpm lqips` | 重新生成图标 / LQIP 数据 |

## 📁 项目结构

```
src/
├── config/          # 站点配置（站点信息、侧边栏、评论、友链、字体等）
├── content/
│   ├── posts/       # 博客文章（.md / .mdx）
│   └── spec/        # 特殊页面（关于、留言板）
├── components/      # 按领域划分的组件：analytics/ comment/ common/ ...
├── layouts/         # Layout.astro（HTML 外壳）、MainGridLayout.astro（页面网格）
├── pages/           # Astro 文件路由
├── plugins/         # 自定义 remark / rehype 插件
├── i18n/            # 多语言文案
└── utils/           # 内容排序、加密、日期、图片处理、TOC
```

所有功能开关与个性化选项集中在 `src/config/`，通过 `src/config/index.ts` 统一导出。



## 🚢 部署

站点为纯静态输出（`dist/`），已配置两种托管方式：

- **Vercel**：读取 `vercel.json`，构建命令 `pnpm build`，输出目录 `dist`
- **Cloudflare Workers**：设置 `CF_WORKERS` 环境变量即可在 `astro.config.mjs` 中启用 Cloudflare 适配器，配合 `wrangler.jsonc` 部署

任何支持静态站点的平台（Netlify、Cloudflare Pages、EdgeOne Pages 等）均可部署，框架预设选 `Astro`，安装命令 `pnpm install`。

## 🔗 找到我

- 🌐 博客：[pasule.com](https://pasule.com)
- 🐙 GitHub：[@pasule](https://github.com/pasule)
- 📺 B站：[space.bilibili.com/624807530](https://space.bilibili.com/624807530)
- 🎮 Steam：[个人主页](https://steamcommunity.com/profiles/76561199523953843/)
- 💬 Linux.do：[@pasule](https://linux.do/u/pasule/summary)
- 📧 邮箱：[3086874696@qq.com](mailto:3086874696@qq.com)

欢迎来 [留言板](https://pasule.com/guestbook/) 交流，或通过 [友链页](https://pasule.com/friends/) 交换链接。

## 🙏 致谢

本项目基于以下开源项目构建，感谢原作者的贡献：

- [saicaca/fuwari](https://github.com/saicaca/fuwari) — 主题原型
- [CuteLeaf/Firefly](https://github.com/CuteLeaf/Firefly) — 本站使用的主题，提供了双侧边栏、文章网格布局、音乐播放器、看板娘等大量增强功能
- [Astro](https://astro.build)、[Svelte](https://svelte.dev)、[Tailwind CSS](https://tailwindcss.com)、[Pagefind](https://pagefind.app)

其他参考：

- 博主[霞葉](https://kasuha.com/posts/fuwari-enhance-ep2/)的 Bangumi 收藏页组件
- 哔哩哔哩 up 主「公公的日常」的 Q 版看板娘 Spine 切片数据

## 📝 许可协议

代码部分遵循 [MIT license](./LICENSE)，你可以自由使用、修改、分发，但需保留原始版权声明：

- Copyright (c) 2024 [saicaca](https://github.com/saicaca) — [fuwari](https://github.com/saicaca/fuwari)
- Copyright (c) 2025 [CuteLeaf](https://github.com/CuteLeaf) — [Firefly](https://github.com/CuteLeaf/Firefly)


<div align="center">

⭐ 如果这个站点或其中的定制实现对你有帮助，欢迎到 [Firefly](https://github.com/CuteLeaf/Firefly) 给原作者点个 Star

</div>
