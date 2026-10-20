import type { FriendLink, FriendsPageConfig } from '../types/friendsConfig';

export const friendsPageConfig: FriendsPageConfig = {
  title: '友链',
  description: '这里是我的朋友们，欢迎互相访问交流',
  showCustomContent: true,
  showComment: true,
  randomizeSort: false,
};

export const friendsConfig: FriendLink[] = [
  // {
  //   title: "Hexo",
  //   desc: "快速、简单且强大的网志框架",
  //   imgurl: "https://d33wubrfki0l68.cloudfront.net/6657ba50e702d84afb32fe846bed54fba1a77add/827ae/logo.svg",
  //   siteurl: "https://hexo.io/zh-cn/",
  //   tags: ["技术支持"],
  //   weight: 10,
  //   enabled: true,
  // },
  {
    title: "番茄主理人",
    imgurl: "https://q1.qlogo.cn/g?b=qq&nk=20447289&s=640",
    desc: "坐而言不如起而行.",
    siteurl: "https://blog.fqzlr.top/",
    tags: ["Blog"],
    weight: 12,
    enabled:true,
 },
 {
    title: "Amiya的书桌",
    imgurl: "https://blog.sayori.org/assets/profile/avatar-sayori.jpg",
    desc: "Amiya_desi的博客站，会记录一个真实的想要分享的人，欢迎!",
    siteurl: "https://blog.sayori.org/",
    tags: ["Blog"],
    weight: 11,
    enabled:true,
 },
 {
    title: "zuige's blog",
    imgurl: "https://blog.zuiges.com/img/avatar.jpg",
    desc: "软件开发 · 玩机折腾 · 技术随手记",
    siteurl: "https://blog.zuiges.com",
    tags: ["Blog"],
    weight: 13,
    enabled:true,
 },
 {
  title:"拾玖的博客",
  imgurl: "https://shijiucode.cn/avatar.jpg",
  desc: "喜欢折腾，尝试创作。",
  siteurl: "https://shijiucode.cn",
  tags: ["Blog"],
  weight: 14,
  enabled:true,
 },
 {
  title:"符辞 · fu.ci",
  imgurl: "https://fu.ci/brand/seal-logo.png",
  desc: "如果你需要, 我可以帮你生成一个更稳, 更一针见血的博客介绍。",
  siteurl: "https://fu.ci",
  tags: ["Blog"],
  weight: 15,
  enabled:true,
 },
 {
  title:"奶油小屋博客",
  imgurl: "https://abcdtfk.icu/IMG_1370.jpeg",
  desc: "这个博客存放我的日常、成长，还有我对自己的观察。",
  siteurl: "https://abcdtfk.icu",
  tags: ["Blog"],
  weight: 16,
  enabled:true,
 },
 {
  title:"赛博小屋",
  imgurl: "https://minio.njfu-yangfan.top/aurora/aurora/config/050ee401d7f8b3cd9ce266d2dc01fd70.jpg",
  desc: "午安大电牛",
  siteurl: "https://www.njfu-yangfan.top/",
  tags: ["Blog"],
  weight: 17,
  enabled:true,
 },
 {
  title:"Alexander",
  imgurl: "https://lanerc.me/avatar.png",
  desc: "记录代码、折腾与生活",
  siteurl: "https://lanerc.me",
  tags: ["Blog"],
  weight: 18,
  enabled:true,
 },
 {
  title:"Chisa Blog",
  imgurl: "https://chisablog.ef-yuko.cn/mainIcon-64.gif",
  desc: "Catch the Future",
  siteurl: "https://chisablog.ef-yuko.cn/",
  tags: ["Blog"],
  weight: 19,
  enabled:true,
 },
 {
  title:"AiphaDeity",
  imgurl: "https://aiphadeity.cn/favicon/avatar-128.png",
  desc: "路漫漫其修远兮，吾将上下而求索",
  siteurl: "https://aiphadeity.cn",
  tags: ["Blog"],
  weight: 20,
  enabled:true,
 },

  // {
  //   title: "Fomalhaut🥝",
  //   desc: "Future is now 🍭🍭🍭",
  //   imgurl: "/assets/head.jpg",
  //   siteurl: "https://fomal.cc/",
  //   tags: ["友情链接"],
  //   weight: 9,
  //   enabled: true,
  // },
];

export const getEnabledFriends = (): FriendLink[] => {
  const friends = friendsConfig.filter(f => f.enabled);
  if (friendsPageConfig.randomizeSort) {
    return friends.sort(() => Math.random() - 0.5);
  }
  return friends.sort((a, b) => (b.weight || 0) - (a.weight || 0));
};
