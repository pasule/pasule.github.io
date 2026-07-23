import type { CoverImageConfig } from "../types/coverImageConfig";

/**
 * 文章封面图配置
 *
 * enableInPost - 是否在文章详情页显示封面图
 *
 * 随机封面图使用说明：
 * 1. 在文章的 Frontmatter 中添加 image: "api" 即可使用随机图功能
 * 2. 系统会依次尝试所有配置的 API，全部失败后使用备用图片
 *
 * // 文章 Frontmatter 示例：
 * ---
 * title: 文章标题
 * image: "api"
 * ---
 */
export const coverImageConfig: CoverImageConfig = {
	// 是否在文章详情页显示封面图
	enableInPost: true,

	randomCoverImage: {
		// 随机封面图功能开关
		enable: true,
		// 封面图API列表
		apis: [
			"https://t.alcy.cc/pc",
			"https://www.dmoe.cc/random.php",
			"https://tu.pasule.com/file/wallpaper/1784710590997_【哲风壁纸】云-动漫天空-反射.webp",
			"https://tu.pasule.com/file/wallpaper/1783562056705_【哲风壁纸】出水芙蓉-插画.png",
			"https://tu.pasule.com/file/wallpaper/1784710582017_【哲风壁纸】女孩-鲸鱼.webp",
			"https://tu.pasule.com/file/wallpaper/1784710582322_【哲风壁纸】佩剑-侠客-剪影.webp",
			"https://tu.pasule.com/file/wallpaper/1784710592472_【哲风壁纸】8k-二次元.webp",
			"https://tu.pasule.com/file/wallpaper/1784710501410_【哲风壁纸】动漫壁纸-动漫天空.webp",
		],
		// API失败时的回退图片路径（相对于src目录或以/开头的public目录路径）
		fallback: "https://tu.pasule.com/file/wallpaper/1783561571511_【哲风壁纸】女孩-鲸鱼.png",
		// 是否显示加载动画
		showLoading: false,
	},
};
