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
			"https://uapis.cn/api/v1/random/image?category=acg&type=pc",
			"https://tu.pasule.com/file/wallpaper/1783561571511_【哲风壁纸】女孩-鲸鱼.png",
			"https://tu.pasule.com/file/wallpaper/1783668484482_【哲风壁纸】8k-二次元.png",
			"https://tu.pasule.com/file/wallpaper/1783668726255_【哲风壁纸】动漫壁纸-动漫天空.png",
		],
		// API失败时的回退图片路径（相对于src目录或以/开头的public目录路径）
		fallback: "https://tu.pasule.com/file/wallpaper/1783561571511_【哲风壁纸】女孩-鲸鱼.png",
		// 是否显示加载动画
		showLoading: false,
	},
};
