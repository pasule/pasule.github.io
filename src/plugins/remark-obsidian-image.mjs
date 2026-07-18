import { visit } from "unist-util-visit";

/**
 * 归一化 Obsidian 生成的图片链接为 Astro public 根路径。
 *
 * Obsidian 在 vault 中粘贴图片时，产出的 markdown 链接是相对路径，
 * 形如 `../../../public/images/a.png` 或 `images/a.png`。
 * Astro 的 `public/` 目录映射到站点根，文件 `public/images/a.png`
 * 的真实 URL 是 `/images/a.png`，因此需要把 `public/` 前缀和相对层级剥掉。
 *
 * 规则：
 * - http(s):// / data: / 已经是 `/images/...` 的绝对路径：保持不变
 * - 任意层级的 `../`、`./` 后接 `public/images/...` → `/images/...`
 * - 任意层级的 `../`、`./` 后接 `images/...` → `/images/...`
 * - 不区分大小写匹配 `images`
 *
 * @returns {import("unified").Plugin}
 */
export function remarkObsidianImage() {
	return (tree) => {
		visit(tree, "image", (node) => {
			if (!node.url || typeof node.url !== "string") return;

			// 外链、data URI、已经归一化的绝对路径直接跳过
			if (
				node.url.startsWith("http://") ||
				node.url.startsWith("https://") ||
				node.url.startsWith("data:") ||
				node.url.startsWith("/images/")
			) {
				return;
			}

			const match = node.url.match(
				/^(?:\.\.\/|\.\/)*(?:public\/)?images\/(.+)$/i,
			);
			if (match) {
				node.url = `/images/${match[1]}`;
			}
		});
	};
}