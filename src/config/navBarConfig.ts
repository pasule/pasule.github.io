import {
	type NavBarConfig,
	type NavBarLink,
	type NavBarSearchConfig,
	NavBarSearchMethod,
} from "../types/navBarConfig";

const getDynamicNavBarConfig = (): NavBarConfig => {
	const links: NavBarLink[] = [
		LinkPresets.Home,
	];

	// 文章及其子菜单
	links.push({
		name: "文章",
		url: "#",
		icon: "material-symbols:article",
		children: [
			LinkPresets.Archive,
			LinkPresets.Categories,
			LinkPresets.Tags,
		],
	});

	// 友链
	links.push(LinkPresets.Friends);

	// 留言板
	links.push(LinkPresets.Guestbook);

	// 关于
	links.push(LinkPresets.About);

	// 链接及其子菜单
	links.push({
		name: "链接",
		url: "#",
		icon: "material-symbols:link",
		children: [
			{
				name: "GitHub",
				url: "https://github.com/pasule", // GitHub 地址
				external: true,
				icon: "fa7-brands:github",
			},
			{
				name: "B站",
				url: "https://space.bilibili.com/624807530?spm_id_from=333.1387.0.0", //  B站主页地址
				external: true,
				icon: "fa7-brands:bilibili",
			},
			{
				name: "Steam",
				url: "https://steamcommunity.com/profiles/76561199523953843/", // Steam 主页地址
				external: true,
				icon: "fa7-brands:steam",
			},
		],
	});

	return { links } as NavBarConfig;
};

export const navBarSearchConfig: NavBarSearchConfig = {
	method: NavBarSearchMethod.PageFind,
};

export const LinkPresets: Record<string, NavBarLink> = {
	Home: {
		name: "首页",
		url: "/",
		icon: "material-symbols:home",
	},
	Archive: {
		name: "归档",
		url: "/archive/",
		icon: "material-symbols:archive",
	},
	Categories: {
		name: "分类",
		url: "/categories/",
		icon: "material-symbols:folder-open-rounded",
	},
	Tags: {
		name: "标签",
		url: "/tags/",
		icon: "material-symbols:tag-rounded",
	},
	Friends: {
		name: "友链",
		url: "/friends/",
		icon: "material-symbols:group",
		pageKey: "friends",
	},
	Guestbook: {
		name: "留言",
		url: "/guestbook/",
		icon: "material-symbols:chat",
		pageKey: "guestbook",
	},
	About: {
		name: "关于我",
		url: "/about/",
		icon: "material-symbols:person",
	},
};

export const navBarConfig: NavBarConfig = getDynamicNavBarConfig();
