import type { FriendLink } from '../types/friendsConfig';

export const friendsConfig: FriendLink[] = [
  {
    title: "Hexo",
    desc: "快速、简单且强大的网志框架",
    imgurl: "https://d33wubrfki0l68.cloudfront.net/6657ba50e702d84afb32fe846bed54fba1a77add/827ae/logo.svg",
    siteurl: "https://hexo.io/zh-cn/",
    tags: [],
    weight: 0,
    enabled: true,
  },
  {
    title: "Fomalhaut🥝",
    desc: "Future is now 🍭🍭🍭",
    imgurl: "/assets/head.jpg",
    siteurl: "https://fomal.cc/",
    tags: [],
    weight: 0,
    enabled: true,
  }
];

export function getEnabledFriends(): FriendLink[] {
  return friendsConfig.filter(f => f.enabled);
}

export interface FriendsPageConfig {
  title: string;
  subTitle: string;
  remark: string;
  listExplain: string;
}
export const friendsPageConfig: FriendsPageConfig = {
  title: '友链',
  subTitle: 'Friends',
  remark: '如果在浏览时发现了问题，欢迎联系我。',
  listExplain: '',
};
