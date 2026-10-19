/**
 * 阻止 Astro 把 markdown 里的远程图片纳入构建期优化。
 *
 * @astrojs/markdown-remark 会按 image.remotePatterns 收集远程图片，随后在
 * updateImageReferencesInBody 里无条件调用 getImage() 去抓取它们；任何一张抓取失败
 * 都会抛出 "Failed to parse image reference" 并中断整个构建。
 *
 * 图床位于 Cloudflare 之后，从构建机访问并不稳定，一次瞬时失败就会让发布失败。
 * 这里清空收集结果，让 markdown 图片保持普通 <img>；需要优化的图片由组件层的
 * getRemoteImage() 显式处理，那条路径带 try/catch 回退，不会拖垮构建。
 *
 * 用户 rehype 插件在 Astro 内部的 rehypeImages 之前执行，所以在这里清空有效。
 */
export default function rehypeSkipRemoteImages() {
	return (_tree, file) => {
		if (file?.data?.astro) {
			file.data.astro.remoteImagePaths = [];
		}
	};
}
