import type { ProfileConfig } from "../types/profileConfig";

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/avatar.jpg",
	name: "Pasule",
	bio: "Keep the Wonder. Keep the Fire",
	links: [
		{
			name: "GitHub",
			icon: "fa7-brands:github",
			url: "https://github.com/pasule",
			showName: false,
		},
		{
			name: "B站",
			icon: "fa7-brands:bilibili",
			url: "https://space.bilibili.com/624807530?spm_id_from=333.1387.0.0", // B站主页地址
			showName: false,
		},
		{
			name: "Steam",
			icon: "fa7-brands:steam",
			url: "https://steamcommunity.com/profiles/76561199523953843/", // Steam 主页地址
			showName: false,
		},
		{
			name: "Linux.do",
			icon: "custom/linuxdo",
			url: "https://linux.do/u/pasule/summary",
			showName: false,
		},
		{
			name: "Email",
			icon: "fa7-solid:envelope",
			url: "mailto:3086874696@qq.com",
			showName: false,
		},
		{
			name: "RSS",
			icon: "fa7-solid:rss",
			url: "/rss/",
			showName: false,
		},
	],
};
