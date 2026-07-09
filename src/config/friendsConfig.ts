import type { FriendLink } from '../types/friendsConfig';

export const friendsConfig: FriendLink[] = [
  {
    title: "Hexo",
    desc: "",
    imgurl: "",
    siteurl: "",
    tags: [],
    weight: 0,
    enabled: true,
  },
  {
    title: "Fomalhaut🥝",
    desc: "",
    imgurl: "",
    siteurl: "",
    tags: [],
    weight: 0,
    enabled: true,
  }
];

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
