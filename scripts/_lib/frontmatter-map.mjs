import { DROPPED_FIELDS } from '../migrate.config.mjs';

export function mapFrontmatter(hexoFm, slug) {
  if (!hexoFm.title) throw new Error(`文章无 title: ${slug}`);

  const fb = {
    title: String(hexoFm.title),
    published: toISODate(hexoFm.date, slug),
    lang: 'zh-CN',
    comment: true,
  };

  if (hexoFm.updated) fb.updated = toISODate(hexoFm.updated, slug);
  if (hexoFm.description) fb.description = String(hexoFm.description);
  if (hexoFm.cover) fb.image = String(hexoFm.cover);

  if (Array.isArray(hexoFm.categories) && hexoFm.categories.length) {
    fb.category = flattenCategory(hexoFm.categories[0]);
  } else if (typeof hexoFm.categories === 'string' && hexoFm.categories) {
    fb.category = hexoFm.categories;
  }

  if (Array.isArray(hexoFm.tags) && hexoFm.tags.length) {
    fb.tags = hexoFm.tags.map(String);
  }

  if (hexoFm.sticky) fb.pinned = true;
  if (hexoFm.published === false || hexoFm.published === 'false') fb.draft = true;

  for (const drop of DROPPED_FIELDS) {
    if (drop in fb) delete fb[drop];
  }
  return fb;
}

function flattenCategory(cat) {
  if (Array.isArray(cat)) return flattenCategory(cat[0]);
  return String(cat).replace(/^\[+|\]+$/g, '').trim();
}

function toISODate(val, slug) {
  if (!val) throw new Error(`文章无 date: ${slug}`);
  const d = new Date(String(val).replace(' ', 'T'));
  if (isNaN(d.getTime())) throw new Error(`文章 date 无法解析: ${slug} = ${val}`);
  return d.toISOString().slice(0, 10);
}
