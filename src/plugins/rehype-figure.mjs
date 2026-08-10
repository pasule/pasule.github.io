import { h } from "hastscript";
import { visit } from "unist-util-visit";
import { shouldAddNoReferrer } from "../utils/image-utils.ts";

/**
 * 将带有 alt 文本的图片转换为 figure 元素，并生成 figcaption。
 * 当 alt 是默认文件名 image.png 时不显示图注。
 *
 * @returns {Function} A transformer function for the rehype plugin
 */
export default function rehypeFigure() {
	return (tree) => {
		visit(tree, "element", (node, index, parent) => {
			// 只处理 img 元素
			if (node.tagName !== "img") {
				return;
			}

			// 跳过已由其它插件接管渲染的图片（例如 plantuml）
			const classRaw = node.properties?.className;
			const classNames = Array.isArray(classRaw)
				? classRaw
				: typeof classRaw === "string"
					? classRaw.split(/\s+/)
					: [];
			if (classNames.includes("plantuml-image")) {
				return;
			}

			const imgProps = { ...node.properties };

			// 添加 referrerpolicy（如果需要）解决 403 问题
			// 无论是否有 alt，都要检查并添加 referrerpolicy
			if (imgProps.src && shouldAddNoReferrer(imgProps.src)) {
				imgProps.referrerpolicy = "no-referrer";
			}

			const alt = typeof imgProps.alt === "string" ? imgProps.alt.trim() : "";

			// 没有 alt 时只更新图片属性，保持原有结构
			if (!alt) {
				node.properties = imgProps;
				return;
			}

			// 保留 figure 居中结构，默认文件名 image.png 不显示为图注
			const figureChildren = [h("img", { ...imgProps })];
			if (alt !== "image.png") {
				figureChildren.push(h("figcaption", alt));
			}
			const figure = h("figure", figureChildren);

			// 居中显示
			const centerFigure = h("center", figure);

			// 替换当前的 img 节点为 figure 节点
			if (parent && typeof index === "number") {
				parent.children[index] = centerFigure;
			}
		});
	};
}
