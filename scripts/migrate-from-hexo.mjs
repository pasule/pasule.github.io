// 一次性迁移脚本：Hexo → Astro Firefly。幂等，可反复跑。
// 用法：node scripts/migrate-from-hexo.mjs
import { mkdir, rm, readdir, cp, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { PATHS } from './migrate.config.mjs';

import { mapFrontmatter } from './_lib/frontmatter-map.mjs';
import { rewriteImagePaths } from './_lib/rewrite-image-paths.mjs';
import { htmlToMarkdown } from './_lib/html-to-markdown.mjs';
import { readFrontmatter, writeFrontmatter } from './_lib/yaml-frontmatter.mjs';
import { friendsYamlToTs } from './_lib/friends-yaml-to-ts.mjs';

const log = (m) => console.log(m);
const results = { posts: [], spec: [], friends: 0, assets: 0, errors: [] };
const ROOT = process.cwd();

async function cleanFireflySamples() {
  log('→ 清理 Firefly 示例内容');
  const targets = [
    'src/content/posts',
    'src/content/spec',
    'public/gallery',
    'public/anime-list.json',
  ];
  for (const t of targets) {
    await rm(path.join(ROOT, t), { recursive: true, force: true });
  }
  await rm(path.join(ROOT, 'src/assets/images'), { recursive: true, force: true });
  await mkdir(path.join(ROOT, 'src/assets/images'), { recursive: true });
}

async function cleanOutput() {
  log('→ 清空输出目录');
  await rm(PATHS.astroPosts, { recursive: true, force: true });
  await rm(PATHS.astroSpec, { recursive: true, force: true });
  await rm(PATHS.astroPublicAssets, { recursive: true, force: true });
  await mkdir(PATHS.astroPosts, { recursive: true });
  await mkdir(PATHS.astroSpec, { recursive: true });
  await mkdir(PATHS.astroPublicAssets, { recursive: true });
}

async function migratePosts() {
  log('→ 迁移文章');
  const rawEntries = await readdir(PATHS.hexoPosts);
  const files = rawEntries.filter(f => f.endsWith('.md'));
  for (const file of files) {
    try {
      const src = path.join(PATHS.hexoPosts, file);
      const raw = await readFile(src, 'utf8');
      const { fm, body } = readFrontmatter(raw);
      const slug = file.replace(/\.md$/, '');
      const fireflyFm = mapFrontmatter(fm, slug);
      const newBody = rewriteImagePaths(body, slug);
      const out = writeFrontmatter(fireflyFm) + '\n' + newBody;
      await writeFile(path.join(PATHS.astroPosts, file), out, 'utf8');
      results.posts.push({ slug, fm: fireflyFm });
    } catch (e) {
      results.errors.push({ file, error: e.message });
    }
  }
}

async function migrateSpec() {
  log('→ 迁移 spec 页（about / guestbook）');
  // about：HTML → markdown
  if (existsSync(PATHS.hexoAbout)) {
    let raw = await readFile(PATHS.hexoAbout, 'utf8');
    raw = raw.replace(/^﻿/, ''); // strip BOM
    const { fm, body } = readFrontmatter(raw);
    const mdBody = htmlToMarkdown(body);
    const pubDate = fm.date ? String(fm.date).replace(' ', 'T').slice(0, 10) : '2025-05-24';
    const out = writeFrontmatter({ title: 'about', published: pubDate }) + '\n' + mdBody;
    await writeFile(path.join(PATHS.astroSpec, 'about.md'), out, 'utf8');
    results.spec.push('about.md');
  }
  // guestbook：空 body，靠 Giscus 驱动
  const gb = writeFrontmatter({ title: 'guestbook', published: '2025-05-27' }) + '\n\n留言板。请在下方评论区留言。\n';
  await writeFile(path.join(PATHS.astroSpec, 'guestbook.md'), gb, 'utf8');
  results.spec.push('guestbook.md');
}

async function migrateFriends() {
  log('→ 迁移友链到 friendsConfig.ts');
  if (!existsSync(PATHS.hexoLinkYml)) { log('  跳过：link.yml 不存在'); return; }
  const yaml = await readFile(PATHS.hexoLinkYml, 'utf8');
  const friendsArrayTs = friendsYamlToTs(yaml);
  results.friends = friendsArrayTs.split('title:').length - 1;

  const ts = `import type { FriendLink } from '../types/friendsConfig';

export const friendsConfig: FriendLink[] = ${friendsArrayTs};

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
`;
  await writeFile(path.join(PATHS.astroConfig, 'friendsConfig.ts'), ts, 'utf8');
}

async function migrateAssets() {
  log('→ 迁移 Obsidian 图片资源');
  const hexoAssetsDir = path.join(PATHS.hexoPosts, 'assets');
  if (!existsSync(hexoAssetsDir)) { log('  跳过：无 assets 目录'); return; }
  const entries = await readdir(hexoAssetsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const src = path.join(hexoAssetsDir, entry.name);
    const dest = path.join(PATHS.astroPublicAssets, entry.name);
    await cp(src, dest, { recursive: true });
    const files = await readdir(dest);
    results.assets += files.length;
  }
}

async function verifyMigration() {
  log('→ 自验迁移产物');
  const checks = [];
  const fail = (m) => { checks.push(`  ✗ ${m}`); };

  // 1. 文章数量 = 12
  const posts = (await readdir(PATHS.astroPosts)).filter(f => f.endsWith('.md'));
  if (posts.length !== 12) fail(`文章数 ${posts.length} != 12`);

  // 2. 每篇必填字段 + 无被弃字段
  for (const f of posts) {
    const raw = await readFile(path.join(PATHS.astroPosts, f), 'utf8');
    const { fm } = readFrontmatter(raw);
    if (!fm.title) fail(`${f}: 无 title`);
    if (!fm.published) fail(`${f}: 无 published`);
    if (!fm.lang) fail(`${f}: 无 lang`);
    for (const drop of ['series','difficulty','keywords','hero_desc','recommended_next']) {
      if (drop in fm) fail(`${f}: 残留 ${drop}`);
    }
  }

  // 3. 微服务 pinned
  const msRaw = await readFile(path.join(PATHS.astroPosts, '微服务架构设计原理与最佳实践.md'), 'utf8').catch(() => null);
  if (msRaw) {
    const { fm } = readFrontmatter(msRaw);
    if (fm.pinned !== 'true' && fm.pinned !== true) fail('微服务架构设计: pinned !== true');
  } else fail('微服务架构设计 文件缺失');

  // 4. 测试 草稿
  const tRaw = await readFile(path.join(PATHS.astroPosts, '测试.md'), 'utf8').catch(() => null);
  if (tRaw) {
    const { fm } = readFrontmatter(tRaw);
    if (fm.draft !== 'true' && fm.draft !== true) fail('测试: draft !== true');
  }

  // 5. 校园网串流方案 图片路径 + 资源数
  const xxRaw = await readFile(path.join(PATHS.astroPosts, '校园网串流方案.md'), 'utf8').catch(() => null);
  if (xxRaw) {
    if (/\]\(\s*\.?\/?assets\//.test(xxRaw)) fail('校园网串流方案: 残留相对 assets 路径');
  }
  const xxAssetsDir = path.join(PATHS.astroPublicAssets, '校园网串流方案');
  if (existsSync(xxAssetsDir)) {
    const n = (await readdir(xxAssetsDir)).length;
    if (n < 15) fail(`校园网串流方案 资源数 ${n} < 15`);
  } else fail('校园网串流方案 资源目录缺失');

  // 6. friendsConfig.ts 含友链
  const fc = await readFile(path.join(PATHS.astroConfig, 'friendsConfig.ts'), 'utf8').catch(() => '');
  if (fc) {
    const n = (fc.match(/title:/g) || []).length;
    if (n < 2) fail(`friendsConfig 友链数 ${n} < 2`);
  } else fail('friendsConfig.ts 缺失');

  // 7. about.md 无 <section
  const about = await readFile(path.join(PATHS.astroSpec, 'about.md'), 'utf8').catch(() => '');
  if (about && /<section/i.test(about)) fail('about.md: 残留 <section>');

  if (checks.length) {
    log('\n自验失败:');
    checks.forEach(c => log(c));
    process.exit(1);
  }
  log('  自验通过');
}

async function main() {
  log('=== Pasule Hexo → Astro Firefly 迁移 ===');

  // 检查 hexo 源
  if (!existsSync(PATHS.hexoPosts)) {
    throw new Error(`Hexo 源不存在: ${PATHS.hexoPosts}\n请先: git worktree add ../pasule-hexo-source hexo-source`);
  }

  await cleanFireflySamples();
  await cleanOutput();
  await migratePosts();
  await migrateSpec();
  await migrateFriends();
  await migrateAssets();
  await verifyMigration();

  log(`\n=== 迁移报告 ===`);
  log(`文章: ${results.posts.length} 篇`);
  for (const p of results.posts) {
    const flags = [];
    if (p.fm.pinned === true || p.fm.pinned === 'true') flags.push('pinned');
    if (p.fm.draft === true || p.fm.draft === 'true') flags.push('draft');
    const flagStr = flags.length ? ` [${flags.join(',')}]` : '';
    log(`  ✓ ${p.slug} -> posts/${p.slug}${flagStr}`);
  }
  log(`spec 页: ${results.spec.join(', ')}`);
  log(`友链: ${results.friends} 条`);
  log(`图片资源: ${results.assets} 文件`);
  log(`错误: ${results.errors.length}`);
  if (results.errors.length) {
    results.errors.forEach(e => log(`  ✗ ${e.file}: ${e.error}`));
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
