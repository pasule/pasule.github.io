import type { FriendLink, FriendsPageConfig } from '../types/friendsConfig';

export const friendsPageConfig: FriendsPageConfig = {
  title: '友链',
  description: '一些好朋友~~',
  showCustomContent: true,
  showComment: true,
  randomizeSort: false,
};

export const friendsConfig: FriendLink[] = [
  {
    title: "Hexo",
    desc: "快速、简单且强大的网志框架",
    imgurl: "https://d33wubrfki0l68.cloudfront.net/6657ba50e702d84afb32fe846bed54fba1a77add/827ae/logo.svg",
    siteurl: "https://hexo.io/zh-cn/",
    tags: ["技术支持"],
    weight: 10,
    enabled: true,
  },
  {
    title: "Fomalhaut🥝",
    desc: "Future is now 🍭🍭🍭",
    imgurl: "/assets/head.jpg",
    siteurl: "https://fomal.cc/",
    tags: ["友情链接"],
    weight: 9,
    enabled: true,
  },
  {
    title: "Firefly Docs",
    desc: "Firefly 主题模板文档",
    imgurl: "https://docs-firefly.cuteleaf.cn/logo.png",
    siteurl: "https://docs-firefly.cuteleaf.cn",
    tags: ["文档"],
    weight: 8,
    enabled: true,
  },
  {
    title: "Astro",
    desc: "The web framework for content-driven websites.",
    imgurl: "https://avatars.githubusercontent.com/u/44914786?v=4&s=640",
    siteurl: "https://astro.build",
    tags: ["框架"],
    weight: 7,
    enabled: true,
  }
];

export const getEnabledFriends = (): FriendLink[] => {
  const friends = friendsConfig.filter(f => f.enabled);
  if (friendsPageConfig.randomizeSort) {
    return friends.sort(() => Math.random() - 0.5);
  }
  return friends.sort((a, b) => (b.weight || 0) - (a.weight || 0));
};
