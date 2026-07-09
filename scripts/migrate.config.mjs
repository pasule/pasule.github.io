import path from 'node:path';

const ROOT = process.cwd();

export const HEXO_SOURCE_ROOT = process.env.HEXO_SOURCE_ROOT
  || path.resolve(ROOT, '../pasule-hexo-source');

export const PATHS = {
  hexoPosts: path.join(HEXO_SOURCE_ROOT, 'source/_posts'),
  hexoAbout: path.join(HEXO_SOURCE_ROOT, 'source/about/index.md'),
  hexoLinkYml: path.join(HEXO_SOURCE_ROOT, 'source/_data/link.yml'),
  hexoComments: path.join(HEXO_SOURCE_ROOT, 'source/comments/index.md'),
  astroPosts: path.join(ROOT, 'src/content/posts'),
  astroSpec: path.join(ROOT, 'src/content/spec'),
  astroAssetsImages: path.join(ROOT, 'src/assets/images'),
  astroPublicAssets: path.join(ROOT, 'public/assets'),
  astroConfig: path.join(ROOT, 'src/config'),
};

export const DROPPED_FIELDS = [
  'series', 'difficulty', 'keywords', 'hero_desc', 'recommended_next',
];
