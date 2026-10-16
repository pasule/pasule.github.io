import { h } from "hastscript";
import { visit } from "unist-util-visit";
import { shouldAddNoReferrer } from "../utils/image-utils.ts";

// 图片扩展名：alt 以它结尾才可能只是上传时的原始文件名
const IMAGE_EXTENSION_PATTERN =
	/\.(png|jpe?g|gif|webp|avif|svg|bmp|ico|tiff?)$/i;

// 含 CJK 字符的 alt 视为刻意写的图注，即使以扩展名结尾也保留
const CJK_PATTERN = /[㐀-䶿一-鿿豈-﫿]/;

/**
 * 判断 alt 是否只是上传时自动生成的文件名。
 * 依据是「以图片扩展名结尾 + 不含路径分隔符和空白 + 不含中文」：
 * image.png、image.jpg、7759c03bcc73c647ee54448c9d19b47d.png 会被过滤，
 * 而「架构图.png」这类刻意写的中文图注会保留。
 *
 * @param {string} alt
 * @returns {boolean}
 */
const isMeaninglessAlt = (alt) =>
	IMAGE_EXTENSION_PATTERN.test(alt) &&
	!/[\s/\\]/.test(alt) &&
	!CJK_PATTERN.test(alt);

/**
 * 将带有 alt 文本的图片转换为 figure 元素，并生成 figcaption。
 * 当 alt 只是自动生成的文件名时不显示图注。
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

			// 保留 figure 居中结构，自动生成的文件名不作为图注
			const figureChildren = [h("img", { ...imgProps })];
			if (!isMeaninglessAlt(alt)) {
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
