# 页脚萌 ICP 备案链接设计

## 目标

在站点页脚添加“萌ICP备20260373号”链接，并确保桌面端和移动端均显示。链接在新标签页打开，视觉样式与现有 RSS、Sitemap 等页脚链接保持一致。

## 实现方案

使用项目已有的自定义页脚 HTML 注入机制，不修改 `Footer.astro`：

- 将 `src/config/footerConfig.ts` 中的 `enable` 设置为 `true`。
- 将 `src/config/FooterConfig.html` 的示例内容替换为指向 `https://icp.gov.moe/?keyword=20260373` 的备案链接。
- 为链接添加现有页脚链接所使用的 `transition link text-(--primary) font-medium` 类。
- 保留 `target="_blank"`，并添加 `rel="noopener noreferrer"`。

`Footer.astro` 已由主布局统一渲染，且页脚容器没有按设备隐藏，因此该内容会同时出现在桌面端和移动端。

## 显示位置

备案链接使用现有的自定义内容区域，显示在版权、RSS 和 Sitemap 信息上方。布局沿用页脚的居中样式，不引入新的断点或设备专用分支。

## 范围

本次只修改以下文件：

- `src/config/footerConfig.ts`
- `src/config/FooterConfig.html`

不调整页脚组件结构、其他配置或全局样式。

## 验证

这是纯配置与静态 HTML 改动，不新增测试框架或测试文件。实现后运行：

- `pnpm check`
- `pnpm type-check`
- `pnpm build`

并检查生成结果中包含正确的链接地址、文字、样式类、`target` 和 `rel` 属性。
