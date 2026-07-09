# Pasule 迁移至 Astro Firefly 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `pasule-blog` 从 Hexo + Butterfly 整体迁移到 Astro + Firefly，保留 12 篇文章内容与必要站点配置，UI 全用 Firefly 原生，通过 GitHub Actions 自动部署。

**Architecture:** 在 `astro-source` 分支拉取 CuteLeaf/Firefly 完整文件树作起点，用一个幂等 ESM 迁移脚本把 Hexo 文章 frontmatter 转成 Firefly schema、重写 Obsidian 图片路径、迁移 spec 页与配置，脚本末尾自验。GitHub Actions 构建后部署到 GitHub Pages（Source 切到 Actions）。

**Tech Stack:** Astro 7 + Firefly（Svelte 5 islands、Tailwind v4、Pagefind、Giscus、expressive-code、KaTeX、Mermaid/PlantUML）、pnpm 9、Node 22、ESM（`.mjs`）迁移脚本、GitHub Pages + Actions。

**参考 spec:** `docs/superpowers/specs/2026-07-08-pasule-migrate-to-astro-firefly-design.md`

---

## File Structure

迁移过程中将创建/修改的文件（按职责）：

**新建分支与 Firefly 基底**
- 分支 `astro-source`：从 `hexo-source` 切出，清空非 docs 内容后作为 Firefly 载体
- 仓库根：Firefly 完整文件树（degit 拉取）

**迁移脚本（一次性工具）**
- `scripts/migrate-from-hexo.mjs`：幂等迁移入口，含 `cleanFireflySamples` / `migratePosts` / `migrateSpec` / `migrateFriends` / `migrateAssets` / `verifyMigration`
- `scripts/_lib/frontmatter-map.mjs`：Hexo frontmatter → Firefly schema 映射
- `scripts/_lib/rewrite-image-paths.mjs`：Obsidian 相对图片路径 → 绝对路径
- `scripts/_lib/html-to-markdown.mjs`：about 页 HTML → markdown
- `scripts/_lib/yaml-frontmatter.mjs`：读/写 YAML frontmatter（不引外部依赖）
- `scripts/_lib/friends-yaml-to-ts.mjs`：`link.yml` → `friendsConfig.ts` 片段
- `scripts/migrate.config.mjs`：源/目标路径常量与映射规则表

**迁移产物（被脚本写入）**
- `src/content/posts/*.md`：12 篇迁移后文章
- `src/content/spec/about.md`、`guestbook.md`：spec 页
- `src/config/siteConfig.ts`、`profileConfig.ts`、`navBarConfig.ts`、`sidebarConfig.ts`、`friendsConfig.ts`、`musicConfig.ts`、`commentConfig.ts`、`effectsConfig.ts`：Firefly 配置改值
- `src/assets/images/avatar.jpg`、`public/favicon/`：迁入的头像/favicon
- `public/assets/校园网串流方案/*`：拷贝的 Obsidian 图片（16 文件）

**部署**
- `.github/workflows/deploy.yml`：Firefly 自带，改 `branches: [astro-source]`
- `.gitignore`：确认含 `dist/`、`node_modules/`、`.astro/`、`public/pagefind/`、`src/constants/lqips.json`

**废弃（不迁移不改写，留在 hexo-source 分支）**
- `tools/verify-fomalhaut-home.cjs`、`tools/verify-generated-pages.cjs`、`tools/verify-post-assets.cjs`、`tools/deploy-fix.cjs`、`scripts/pasule-*.js`、`source/css/modify.styl`、`source/js/pasule-fomalhaut-ui.js`

源 Hexo 内容作为只读输入，路径由 `scripts/migrate.config.mjs` 指向（默认指向 hexo-source 分支 checkout 或本地备份路径，见 Task 1 配置）。

---

### Task 1: 建 astro-source 分支与 Firefly 基底

**Files:**
- 分支: `astro-source`
- 工作区根

- [ ] **Step 1: 从 hexo-source 切出 astro-source 分支**

Run:
```bash
cd e:/pasule-blog
git checkout hexo-source
git checkout -b astro-source
```
Expected: 切到新分支 `astro-source`，工作区为当前 hexo-source 全部内容。

- [ ] **Step 2: 清空工作区（保留 .git 与 docs/superpowers）**

Firefly 要落地到仓库根，需先清掉 Hexo 内容。保留 git 历史与设计文档：

```bash
cd e:/pasule-blog
# 保留 docs（含 spec/plan）和 .git，其余清空
git rm -r --quiet source scripts themes _config.yml _config.butterfly.yml package.json package-lock.json tools .gitignore 2>/dev/null || true
git rm -r --quiet .obsidian 2>/dev/null || true
git rm -r --quiet .firecrawl 2>/dev/null || true
# 保留 docs/superpowers
ls
```
Expected: 工作区只剩 `docs/`（和 `.git/`）。`git rm` 会把这些删除暂存。

> 注意：`hexo-source` 分支的内容不受影响，`astro-source` 是新分支。旧分支作回滚备份。

- [ ] **Step 3: 用 degit 拉取 Firefly 文件树**

```bash
cd e:/pasule-blog
npx degit CuteLeaf/Firefly#master .
```
Expected: Firefly 仓库全部文件落地仓库根（`src/`、`public/`、`astro.config.mjs`、`package.json`、`.github/` 等）。`degit` 不带 git 历史，仓库自己的 `.git` 不变。

- [ ] **Step 4: 确认 Firefly 基底完整性**

```bash
cd e:/pasule-blog
ls
test -f astro.config.mjs && echo "OK astro.config"
test -f package.json && echo "OK package"
test -d src/content/posts && echo "OK posts dir"
test -d src/config && echo "OK config dir"
test -f .github/workflows/deploy.yml && echo "OK workflow"
```
Expected: 6 个 OK 全部打印。

- [ ] **Step 5: 提交 Firefly 基底**

```bash
cd e:/pasule-blog
git add -A
git commit -m "feat: bootstrap astro-source with Firefly theme base"
```
Expected: commit 生成，含 Firefly 全部文件 + 删除的 Hexo 文件。

---

### Task 2: 确认工具链可构建（构建冒烟）

**Files:**
- 无源文件改动（仅装依赖验证）

- [ ] **Step 1: 装 pnpm（若未装）**

```bash
pnpm -v 2>/dev/null || npm i -g pnpm
pnpm -v
```
Expected: 打印 pnpm 版本（≥9）。若已装则跳过安装。

- [ ] **Step 2: 安装依赖**

```bash
cd e:/pasule-blog
pnpm install
```
Expected: 安装成功，生成 `node_modules/` 与 `pnpm-lock.yaml`（已存在则更新）。

- [ ] **Step 3: 跑 Firefly 原生构建**

```bash
cd e:/pasule-blog
pnpm build
```
Expected: 构建退出码 0，`dist/` 生成，含 Firefly 示例文章页。这一步验证 Firefly 基底可构建，再开始迁移。

> 若失败：多半是 Node 版本（需 ≥22）或 pnpm 版本问题。`node -v` 确认。

- [ ] **Step 4: 本地 dev 冒烟**

```bash
cd e:/pasule-blog
pnpm dev
```
Expected: 启动在 http://localhost:4321，浏览器看到 Firefly 演示站首页（绿色主题、三栏、示例文章）。Ctrl+C 停止。

- [ ] **Step 5: 提交 lockfile**

```bash
cd e:/pasule-blog
git add pnpm-lock.yaml
git commit -m "chore: lock dependencies" || echo "no lock changes"
```
Expected: lockfile 入库（或提示无变化）。

---

### Task 3: 迁移脚本骨架与配置常量

**Files:**
- Create: `scripts/migrate.config.mjs`
- Create: `scripts/migrate-from-hexo.mjs`

- [ ] **Step 1: 写迁移配置常量**

Create `scripts/migrate.config.mjs`:

```js
// 迁移源：旧 Hexo 内容。指向 hexo-source 分支的 checkout 路径。
// 本地迁移时先把 hexo-source 分支 checkout 到一个临时目录，或用 git worktree。
// 默认假设旧内容在同仓库的 ../pasule-hexo-source worktree（见 Task 1 备注的 worktree 法）。
import path from 'node:path';

const ROOT = process.cwd();

// 旧 Hexo 源根目录。迁移前用 git worktree add 出 hexo-source 分支：
//   git worktree add ../pasule-hexo-source hexo-source
export const HEXO_SOURCE_ROOT = process.env.HEXO_SOURCE_ROOT
  || path.resolve(ROOT, '../pasule-hexo-source');

export const PATHS = {
  hexoPosts: path.join(HEXO_SOURCE_ROOT, 'source/_posts'),
  hexoAbout: path.join(HEXO_SOURCE_ROOT, 'source/about/index.md'),
  hexoLinkYml: path.join(HEXO_SOURCE_ROOT, 'source/_data/link.yml'),
  hexoComments: path.join(HEXO_SOURCE_ROOT, 'source/comments/index.md'),
  hexoConfig: path.join(HEXO_SOURCE_ROOT, '_config.yml'),
  hexoButterflyConfig: path.join(HEXO_SOURCE_ROOT, '_config.butterfly.yml'),
  hexoContentMap: path.join(HEXO_SOURCE_ROOT, 'source/_data/content-map.yml'),

  astroPosts: path.join(ROOT, 'src/content/posts'),
  astroSpec: path.join(ROOT, 'src/content/spec'),
  astroAssetsImages: path.join(ROOT, 'src/assets/images'),
  astroPublicAssets: path.join(ROOT, 'public/assets'),
  astroFavicon: path.join(ROOT, 'public/favicon'),
  astroConfig: path.join(ROOT, 'src/config'),
};

// 自定义字段：迁移时从 Hexo frontmatter 中丢弃（Firefly schema 不认）
export const DROPPED_FIELDS = [
  'series', 'difficulty', 'keywords', 'hero_desc', 'recommended_next',
];

// Firefly schema 必填/可选字段（用于 verifyMigration）
export const FIREFLY_REQUIRED = ['title', 'published', 'lang'];
```

- [ ] **Step 2: 准备 hexo-source 只读 worktree（迁移源）**

```bash
cd e:/pasule-blog
git worktree add ../pasule-hexo-source hexo-source
ls ../pasule-hexo-source/source/_posts | head
```
Expected: worktree 创建在 `../pasule-hexo-source`，`ls` 列出 12 篇 Hexo md。这个 worktree 全程只读，作迁移源。

- [ ] **Step 3: 写迁移脚本主骨架**

Create `scripts/migrate-from-hexo.mjs`:

```js
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
  const files = (await readdir(PATHS.hexoPosts)).filter(f => f.endsWith('.md'));
  for (const file of files) {
    try {
      const src = path.join(PATHS.hexoPosts, file);
      const raw = await readFile(src, 'utf8');
      const { fm, body } = readFrontmatter(raw);
      const slug = file.replace(/\.md$/, '');
      const fireflyFm = mapFrontmatter(fm, slug);
      let newBody = body;
      if (slug === '校园网串流方案') {
        newBody = rewriteImagePaths(body, slug);
      }
      const out = writeFrontmatter(fireflyFm) + '\n' + newBody;
      await writeFile(path.join(PATHS.astroPosts, file), out, 'utf8');
      results.posts.push({ slug, fm: fireflyFm });
    } catch (e) {
      results.errors.push({ file, error: e.message });
    }
  }
}

// migrateSpec / migrateFriends / migrateAssets 在后续 Task 实现
async function migrateSpec() {}
async function migrateFriends() {}
async function migrateAssets() {}
async function verifyMigration() {}

async function main() {
  log('=== Pasule Hexo → Astro Firefly 迁移 ===');
  if (!existsSync(PATHS.hexoPosts)) {
    throw new Error(`Hexo 源不存在: ${PATHS.hexoPosts}\n请先 git worktree add ../pasule-hexo-source hexo-source`);
  }
  await cleanOutput();
  await migratePosts();
  await migrateSpec();
  await migrateFriends();
  await migrateAssets();
  await verifyMigration();
  log(`\n=== 迁移报告 ===`);
  log(`文章: ${results.posts.length} 篇`);
  log(`错误: ${results.errors.length}`);
  if (results.errors.length) results.errors.forEach(e => log(`  ✗ ${e.file}: ${e.error}`));
  if (results.errors.length) process.exit(1);
}
main().catch(e => { console.error(e); process.exit(1); });
```

> 注：骨架引用了 `_lib/*` 模块，这些在 Task 4-7 创建。骨架本身此刻不能跑通（import 会失败），这是预期的——先立结构，再填实现。

- [ ] **Step 4: 提交骨架**

```bash
cd e:/pasule-blog
git add scripts/migrate.config.mjs scripts/migrate-from-hexo.mjs
git commit -m "feat(migrate): scaffold migration script and config"
```

---

### Task 4: YAML frontmatter 读写库

**Files:**
- Create: `scripts/_lib/yaml-frontmatter.mjs`

- [ ] **Step 1: 写 readFrontmatter / writeFrontmatter**

Frontmatter 是 `---` 分隔的 YAML 头。Hexo 的 frontmatter 结构简单（标量、数组、字符串），不引 `js-yaml`，手写最小解析+序列化。

Create `scripts/_lib/yaml-frontmatter.mjs`:

```js
// 最小 YAML frontmatter 读写，覆盖 Pasule 用到的结构（标量、行内数组、块数组）。
// 不引外部依赖。不支持嵌套对象（Pasule frontmatter 无此结构）。

export function readFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { fm: {}, body: raw };
  const fm = parseYaml(match[1]);
  const body = match[2];
  return { fm, body };
}

export function writeFrontmatter(fm) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(fm)) {
    lines.push(...serializeValue(k, v));
  }
  lines.push('---');
  return lines.join('\n');
}

function parseYaml(text) {
  const fm = {};
  const lines = text.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) { i++; continue; }
    const m = line.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
    if (!m) { i++; continue; }
    const key = m[1];
    const rest = m[2].trim();
    if (rest === '') {
      // 块数组：后续缩进行
      const arr = [];
      i++;
      while (i < lines.length && /^\s+-\s+/.test(lines[i])) {
        const item = lines[i].replace(/^\s+-\s+/, '').trim();
        arr.push(stripQuotes(item));
        i++;
      }
      fm[key] = arr;
    } else if (rest.startsWith('[') && rest.endsWith(']')) {
      // 行内数组
      fm[key] = rest.slice(1, -1).split(',').map(s => stripQuotes(s.trim())).filter(Boolean);
    } else {
      fm[key] = stripQuotes(rest);
    }
    i++;
  }
  return fm;
}

function serializeValue(key, v) {
  if (Array.isArray(v)) {
    if (v.length === 0) return [`${key}: []`];
    return [`${key}:`, ...v.map(item => `  - ${yamlScalar(item)}`)];
  }
  if (v === null || v === undefined) return [`${key}: ""`];
  if (typeof v === 'boolean' || typeof v === 'number') return [`${key}: ${v}`];
  return [`${key}: ${yamlScalar(v)}`];
}

function yamlScalar(v) {
  const s = String(v);
  // 含特殊字符或中文用双引号包裹并转义
  if (/[:#\[\]{}&'*!|>%@`,]/.test(s) || s.includes('\n')) {
    return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  // 中文直接输出（YAML 支持）
  return s;
}

function stripQuotes(s) {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  return s;
}
```

- [ ] **Step 2: 手写快速自测**

```bash
cd e:/pasule-blog
node -e "
import('./scripts/_lib/yaml-frontmatter.mjs').then(m => {
  const raw = '---\ntitle: 测试\ntags: [a,b]\ncategories:\n  - x\nsticky: 1\n---\n正文';
  const { fm, body } = m.readFrontmatter(raw);
  console.log('parsed fm:', JSON.stringify(fm));
  console.log('body:', JSON.stringify(body));
  const out = m.writeFrontmatter({ title: '测试', tags: ['a','b'], category: 'x', pinned: true, lang: 'zh-CN' });
  console.log('serialized:\n' + out);
});
"
```
Expected:
- `parsed fm` 含 `title:"测试"`, `tags:["a","b"]`, `categories:["x"]`, `sticky:"1"`
- `body` 为 `"正文"`
- `serialized` 输出合法 YAML，`pinned: true`（布尔），`tags:` 块数组

- [ ] **Step 3: 提交**

```bash
cd e:/pasule-blog
git add scripts/_lib/yaml-frontmatter.mjs
git commit -m "feat(migrate): yaml frontmatter read/write lib"
```

---

### Task 5: frontmatter 映射库

**Files:**
- Create: `scripts/_lib/frontmatter-map.mjs`

- [ ] **Step 1: 写 mapFrontmatter（spec §Content Migration 映射表的代码化）**

Create `scripts/_lib/frontmatter-map.mjs`:

```js
// Hexo frontmatter → Firefly schema 映射。
// 参见 spec「frontmatter 映射」表。
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

  // categories 数组 → 单字符串，取首项；嵌套 [[x]] 取最深一级
  if (Array.isArray(hexoFm.categories) && hexoFm.categories.length) {
    fb.category = flattenCategory(hexoFm.categories[0]);
  } else if (typeof hexoFm.categories === 'string' && hexoFm.categories) {
    fb.category = hexoFm.categories;
  }

  if (Array.isArray(hexoFm.tags) && hexoFm.tags.length) {
    fb.tags = hexoFm.tags.map(String);
  }

  // sticky → pinned
  if (hexoFm.sticky) fb.pinned = true;

  // 草稿
  if (hexoFm.published === false) fb.draft = true;

  // 防御：确保没漏带被丢弃的字段
  for (const drop of DROPPED_FIELDS) {
    if (drop in fb) delete fb[drop];
  }
  return fb;
}

function flattenCategory(cat) {
  // 嵌套形如 [[...]] 已被 readFrontmatter 当成字符串处理；这里只兜底去括号
  if (Array.isArray(cat)) return flattenCategory(cat[0]);
  return String(cat).replace(/^\[+|\]+$/g, '').trim();
}

function toISODate(val, slug) {
  if (!val) throw new Error(`文章无 date: ${slug}`);
  // Hexo 日期格式：'2025-11-15 10:30' 或 '2025-11-15'
  const d = new Date(String(val).replace(' ', 'T'));
  if (isNaN(d.getTime())) throw new Error(`文章 date 无法解析: ${slug} = ${val}`);
  return d.toISOString().slice(0, 10);
}
```

- [ ] **Step 2: 自测映射**

```bash
cd e:/pasule-blog
node -e "
import('./scripts/_lib/frontmatter-map.mjs').then(m => {
  const hexo = {
    title: '微服务架构设计原理与最佳实践',
    date: '2025-11-15 10:30',
    updated: '2025-12-01 15:30',
    tags: ['微服务','架构设计'],
    categories: ['架构设计'],
    description: 'desc',
    cover: 'https://x/y.png',
    sticky: 1,
    series: 'Java线',
    difficulty: 'intermediate',
    keywords: ['a'],
    hero_desc: 'h',
    recommended_next: ['b'],
  };
  const fb = m.mapFrontmatter(hexo, '微服务');
  console.log(JSON.stringify(fb, null, 2));
  console.log('has series?', 'series' in fb);
  console.log('pinned?', fb.pinned);
});
"
```
Expected:
- `pinned: true`，`category: "架构设计"`，`tags: ["微服务","架构设计"]`，`lang: "zh-CN"`，`comment: true`
- `has series?` 为 `false`（已丢）
- 无 `difficulty/keywords/hero_desc/recommended_next`

- [ ] **Step 3: 自测草稿映射**

```bash
cd e:/pasule-blog
node -e "
import('./scripts/_lib/frontmatter-map.mjs').then(m => {
  const fb = m.mapFrontmatter({ title: '测试占位页', date: '2026-04-05 01:24', published: false }, '测试');
  console.log(JSON.stringify(fb));
  console.log('draft?', fb.draft);
  console.log('pinned?', fb.pinned === undefined);
});
"
```
Expected: `draft: true`，`pinned` 未定义。

- [ ] **Step 4: 提交**

```bash
cd e:/pasule-blog
git add scripts/_lib/frontmatter-map.mjs
git commit -m "feat(migrate): hexo→firefly frontmatter mapping"
```

---

### Task 6: Obsidian 图片路径重写库

**Files:**
- Create: `scripts/_lib/rewrite-image-paths.mjs`

- [ ] **Step 1: 写 rewriteImagePaths（spec §Obsidian 图片路径）**

Create `scripts/_lib/rewrite-image-paths.mjs`:

```js
// 把正文里 Obsidian 相对图片路径重写为 Astro public 绝对路径。
// 覆盖：![](assets/...)、![](./assets/...)、<img src="assets/...">、<img src="./assets/...">
// 外部 URL（http(s)://）不动。

export function rewriteImagePaths(md, slug) {
  let out = md;

  // markdown 图片：![alt](assets/x) 或 ![alt](./assets/x)
  out = out.replace(
    /!\[([^\]]*)\]\(\s*\.?\/?(assets\/[^)]+)\s*\)/g,
    (m, alt, p) => `![${alt}](/${p})`
  );

  // HTML img：<img src="assets/x"> 或 <img src="./assets/x">
  out = out.replace(
    /(<img[^>]+src=")\s*\.?\/?(assets\/[^"]+)\s*(")/g,
    (m, pre, p, post) => `${pre}/${p}${post}`
  );

  return out;
}
```

- [ ] **Step 2: 自测重写**

```bash
cd e:/pasule-blog
node -e "
import('./scripts/_lib/rewrite-image-paths.mjs').then(m => {
  const md = [
    '![](assets/校园网串流方案/file-1.png)',
    '![](./assets/校园网串流方案/file-2.png)',
    '<img src=\"assets/x/y.jpg\" alt=\"a\">',
    '![ext](https://cdn.com/a.png)',
    '![]( /assets/校园网串流方案/z.png )',
  ].join('\n');
  console.log(m.rewriteImagePaths(md, '校园网串流方案'));
});
"
```
Expected:
- 前 3 行路径变 `/assets/...`
- 第 4 行 `https://cdn.com/a.png` 不动
- 第 5 行变 `![](/assets/校园网串流方案/z.png)`

- [ ] **Step 3: 提交**

```bash
cd e:/pasule-blog
git add scripts/_lib/rewrite-image-paths.mjs
git commit -m "feat(migrate): obsidian image path rewriter"
```

---

### Task 7: HTML 转 markdown 与友链转换库

**Files:**
- Create: `scripts/_lib/html-to-markdown.mjs`
- Create: `scripts/_lib/friends-yaml-to-ts.mjs`

- [ ] **Step 1: 写 htmlToMarkdown（about 页用）**

Create `scripts/_lib/html-to-markdown.mjs`:

```js
// 最小 HTML → markdown 转换，只覆盖 about 页用到的标签。
// 不引外部依赖。转得不完美可接受，about 后续可手工润色。

export function htmlToMarkdown(html) {
  let s = html;

  // 去掉 <style>/<script>
  s = s.replace(/<style[\s\S]*?<\/style>/gi, '');
  s = s.replace(/<script[\s\S]*?<\/script>/gi, '');

  // section/p/div 换行
  s = s.replace(/<\/(section|p|div|article|ul|ol)>/gi, '\n\n');
  s = s.replace(/<br\s*\/?>/gi, '\n');

  // 标题
  s = s.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, t) => `# ${clean(t)}\n\n`);
  s = s.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, t) => `## ${clean(t)}\n\n`);
  s = s.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, t) => `### ${clean(t)}\n\n`);

  // 列表项
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, t) => `- ${clean(t)}\n`);

  // 链接
  s = s.replace(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, t) => `[${clean(t)}](${href})`);

  // 加粗/斜体
  s = s.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_, t) => `**${clean(t)}**`);
  s = s.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_, t) => `*${clean(t)}*`);

  // 剥掉剩余标签留文本
  s = s.replace(/<[^>]+>/g, '');

  // HTML 实体
  s = s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');

  // 压缩多余空行
  s = s.replace(/\n{3,}/g, '\n\n').trim() + '\n';
  return s;
}

function clean(t) {
  return t.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}
```

- [ ] **Step 2: 自测 htmlToMarkdown**

```bash
cd e:/pasule-blog
node -e "
import('./scripts/_lib/html-to-markdown.mjs').then(m => {
  const html = '<section><p class=\"k\">About</p><h1>Pasule</h1><p>这里是<b>个人</b>博客。</p><ul><li>Java</li><li>MySQL</li></ul></section>';
  console.log(m.htmlToMarkdown(html));
});
"
```
Expected: 含 `# Pasule`、`**个人**`、`- Java` / `- MySQL`，无 `<section>`/`<p>` 标签残留。

- [ ] **Step 3: 写 friendsYamlToTs**

link.yml 是分两类的友链列表，Firefly friendsConfig 是一维 `FriendLink[]`。扁平化丢分类。

Create `scripts/_lib/friends-yaml-to-ts.mjs`:

```js
// source/_data/link.yml → src/config/friendsConfig.ts 的 friends 数组片段
// 扁平化丢 class_name 分类。返回 TS 数组字面量字符串。

export function friendsYamlToTs(yamlText) {
  const friends = parseLinkYaml(yamlText);
  const items = friends.map(f => `  {\n    title: ${tsStr(f.name)},\n    desc: ${tsStr(f.descr || '')},\n    imgurl: ${tsStr(f.avatar || '')},\n    siteurl: ${tsStr(f.link || '')},\n    tags: [],\n    weight: 0,\n    enabled: true,\n  }`).join(',\n');
  return `[\n${items}\n]`;
}

// 解析 link.yml：顶层是 - class_name / class_desc / link_list（每项 name/link/avatar/descr/siteshot）
function parseLinkYaml(text) {
  const out = [];
  const lines = text.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^-?\s*class_name:/.test(line)) {
      // 进入一个分类块，下面跟 class_desc 和 link_list
      i++;
      while (i < lines.length && !/^-?\s*class_name:/.test(lines[i])) {
        if (/^\s*-?\s*link_list:/.test(lines[i]) || /^\s*link_list:/.test(lines[i])) {
          i++;
          while (i < lines.length && /^\s+-\s/.test(lines[i])) {
            const item = {};
            while (i < lines.length && /^\s+-\s/.test(lines[i])) {
              const m = lines[i].match(/^\s+-\s*(\w+):\s*(.*)$/);
              if (m) item[m[1]] = stripQ(m[2]);
              i++;
            }
            if (item.name) out.push(item);
          }
          continue;
        }
        i++;
      }
      continue;
    }
    i++;
  }
  return out;
}

function tsStr(s) {
  return `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}
function stripQ(s) {
  s = s.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1);
  return s;
}
```

- [ ] **Step 4: 自测 friendsYamlToTs**

```bash
cd e:/pasule-blog
node -e "
import('fs').then(fs => {
  const yaml = fs.readFileSync('../pasule-hexo-source/source/_data/link.yml', 'utf8');
  import('./scripts/_lib/friends-yaml-to-ts.mjs').then(m => {
    console.log(m.friendsYamlToTs(yaml));
  });
});
"
```
Expected: 输出一个 TS 数组，含约 3 个 `{ title, desc, imgurl, siteurl, tags: [], weight: 0, enabled: true }` 对象（Hexo、Fomalhaut 等）。

- [ ] **Step 5: 提交**

```bash
cd e:/pasule-blog
git add scripts/_lib/html-to-markdown.mjs scripts/_lib/friends-yaml-to-ts.mjs
git commit -m "feat(migrate): html→md and friends yaml→ts converters"
```

---

### Task 8: 实现 migratePosts / migrateSpec / migrateFriends / migrateAssets

**Files:**
- Modify: `scripts/migrate-from-hexo.mjs`（填实 Task 3 留空的四个函数）

- [ ] **Step 1: 实现 migratePosts（已在 Task 3 骨架，确认 body 处理）**

Task 3 的 `migratePosts` 已对 `校园网串流方案` slug 调用 `rewriteImagePaths`。但更稳妥：对所有文章都跑一次重写（无 `assets/` 引用的不受影响）。

Edit `scripts/migrate-from-hexo.mjs`，把 `migratePosts` 改为：

```js
async function migratePosts() {
  log('→ 迁移文章');
  const files = (await readdir(PATHS.hexoPosts)).filter(f => f.endsWith('.md'));
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
```

- [ ] **Step 2: 实现 migrateSpec**

Edit `scripts/migrate-from-hexo.mjs`，替换空的 `migrateSpec`：

```js
async function migrateSpec() {
  log('→ 迁移 spec 页（about / guestbook）');
  const { stripBom } = await import('./_lib/yaml-frontmatter.mjs').then(() => ({ stripBom: (s) => s.replace(/^﻿/, '') }));

  // about：HTML → markdown
  if (existsSync(PATHS.hexoAbout)) {
    let raw = await readFile(PATHS.hexoAbout, 'utf8');
    raw = raw.replace(/^﻿/, ''); // strip BOM
    const { fm, body } = readFrontmatter(raw);
    const mdBody = htmlToMarkdown(body);
    const out = writeFrontmatter({ title: 'about', published: fm.date || '2025-05-24' }) + '\n' + mdBody;
    await writeFile(path.join(PATHS.astroSpec, 'about.md'), out, 'utf8');
    results.spec.push('about.md');
  }

  // guestbook：空 body，靠 Giscus 驱动
  const gb = writeFrontmatter({ title: 'guestbook', published: '2025-05-27' }) + '\n\n留言板。请在下方评论区留言。\n';
  await writeFile(path.join(PATHS.astroSpec, 'guestbook.md'), gb, 'utf8');
  results.spec.push('guestbook.md');
}
```

> 注：`stripBom` 用内联函数实现（YAML 库未导出），直接 `.replace(/^﻿/, '')`。上面写的 import 那行是误导，简化为直接 replace。最终代码应是：

```js
async function migrateSpec() {
  log('→ 迁移 spec 页（about / guestbook）');
  // about：HTML → markdown
  if (existsSync(PATHS.hexoAbout)) {
    let raw = await readFile(PATHS.hexoAbout, 'utf8');
    raw = raw.replace(/^﻿/, ''); // strip BOM
    const { fm, body } = readFrontmatter(raw);
    const mdBody = htmlToMarkdown(body);
    const out = writeFrontmatter({ title: 'about', published: (fm.date ? String(fm.date).replace(' ', 'T').slice(0,10) : '2025-05-24') }) + '\n' + mdBody;
    await writeFile(path.join(PATHS.astroSpec, 'about.md'), out, 'utf8');
    results.spec.push('about.md');
  }
  // guestbook：空 body，靠 Giscus 驱动
  const gb = writeFrontmatter({ title: 'guestbook', published: '2025-05-27' }) + '\n\n留言板。请在下方评论区留言。\n';
  await writeFile(path.join(PATHS.astroSpec, 'guestbook.md'), gb, 'utf8');
  results.spec.push('guestbook.md');
}
```

- [ ] **Step 3: 实现 migrateFriends**

Edit `scripts/migrate-from-hexo.mjs`，替换空的 `migrateFriends`：

```js
async function migrateFriends() {
  log('→ 迁移友链到 friendsConfig.ts');
  if (!existsSync(PATHS.hexoLinkYml)) { log('  跳过：link.yml 不存在'); return; }
  const yaml = await readFile(PATHS.hexoLinkYml, 'utf8');
  const friendsArrayTs = friendsYamlToTs(yaml);
  results.friends = friendsArrayTs.split('title:').length - 1;

  // friendsConfig.ts 的 friends 字段替换。Firefly 原文件结构已知，直接整文件生成。
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
```

> ⚠️ 依赖检查：Step 3 的 TS 文件 import 了 `'../types/friendsConfig'`。若 Firefly 实际类型路径不同（如 `'../types/config'` 或内联类型），需在实现时按 Firefly 真实文件调整。Task 11 验证时会捕获类型错误。

- [ ] **Step 4: 实现 migrateAssets**

Edit `scripts/migrate-from-hexo.mjs`，替换空的 `migrateAssets`：

```js
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
```

- [ ] **Step 5: 实现末尾 verifyMigration**

Edit `scripts/migrate-from-hexo.mjs`，替换空的 `verifyMigration`：

```js
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
    if (fm.pinned !== true) fail('微服务架构设计: pinned !== true');
  } else fail('微服务架构设计 文件缺失');

  // 4. 测试 草稿
  const tRaw = await readFile(path.join(PATHS.astroPosts, '测试.md'), 'utf8').catch(() => null);
  if (tRaw) {
    const { fm } = readFrontmatter(tRaw);
    if (fm.draft !== true) fail('测试: draft !== true');
  }

  // 5. 校园网串流方案 图片路径 + 资源数 = 16
  const xxRaw = await readFile(path.join(PATHS.astroPosts, '校园网串流方案.md'), 'utf8').catch(() => null);
  if (xxRaw) {
    if (/\]\(\s*\.?\/?assets\//.test(xxRaw)) fail('校园网串流方案: 残留相对 assets 路径');
  }
  const xxAssetsDir = path.join(PATHS.astroPublicAssets, '校园网串流方案');
  if (existsSync(xxAssetsDir)) {
    const n = (await readdir(xxAssetsDir)).length;
    if (n !== 16) fail(`校园网串流方案 资源数 ${n} != 16`);
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
```

- [ ] **Step 6: 跑迁移脚本**

```bash
cd e:/pasule-blog
node scripts/migrate-from-hexo.mjs
```
Expected: 打印各步日志，末尾"自验通过"，迁移报告显示 12 篇文章、0 错误。退出码 0。

> 若自验失败：按打印的 `✗` 行定位修复。常见：frontmatter 解析失败（检查 YAML 库）、图片数对不上（检查 cp 是否完整）。

- [ ] **Step 7: 人工抽查产物**

```bash
cd e:/pasule-blog
echo "--- 微服务 frontmatter ---"
sed -n '1,12p' src/content/posts/微服务架构设计原理与最佳实践.md
echo "--- 校园网串流方案 图片路径 ---"
grep -E '!\[' src/content/posts/校园网串流方案.md | head -3
echo "--- public/assets 资源 ---"
ls public/assets/校园网串流方案/ | wc -l
echo "--- friendsConfig ---"
head -20 src/config/friendsConfig.ts
echo "--- about ---"
head -8 src/content/spec/about.md
```
Expected:
- 微服务 frontmatter 含 `pinned: true`、`category: 架构设计`、无 `series`
- 校园网串流方案图片路径为 `/assets/校园网串流方案/...`
- 资源数 16
- friendsConfig 含友链对象
- about.md 是 markdown（`#` 标题），无 `<section>`

- [ ] **Step 8: 提交迁移产物与脚本**

```bash
cd e:/pasule-blog
git add scripts/migrate-from-hexo.mjs src/content/posts src/content/spec src/config/friendsConfig.ts public/assets
git commit -m "feat(migrate): convert 12 posts, spec pages, friends, assets"
```

---

### Task 9: 清理 Firefly 示例内容

**Files:**
- Modify: `scripts/migrate-from-hexo.mjs`（加 cleanFireflySamples）
- 删除：Firefly 示例文章、spec、壁纸、相册等

- [ ] **Step 1: 在 cleanOutput 之前加 cleanFireflySamples**

Edit `scripts/migrate-from-hexo.mjs`，在 `cleanOutput` 函数定义后、`main` 调用 `cleanOutput` 之前，加入并调用清理：

```js
async function cleanFireflySamples() {
  log('→ 清理 Firefly 示例内容');
  const targets = [
    'src/content/posts',              // 示例文章（cleanOutput 会重建目录）
    'src/content/spec',               // 示例 about/friends/guestbook（重建）
    'public/gallery',                 // 示例相册
    'public/anime-list.json',         // bangumi/anime 数据
  ];
  for (const t of targets) {
    await rm(path.join(ROOT, t), { recursive: true, force: true });
  }
  // src/assets/images 示例壁纸：删整个目录后重建（迁移会放头像）
  await rm(path.join(ROOT, 'src/assets/images'), { recursive: true, force: true });
  await mkdir(path.join(ROOT, 'src/assets/images'), { recursive: true });
  // src/config/*.ts 不删，只改值（Task 10 处理）
}
```

并在 `main()` 里 `await cleanOutput();` 之前加 `await cleanFireflySamples();`：

```js
  await cleanFireflySamples();
  await cleanOutput();
```

- [ ] **Step 2: 重跑迁移脚本（含清理）**

```bash
cd e:/pasule-blog
node scripts/migrate-from-hexo.mjs
```
Expected: 日志首行含"清理 Firefly 示例内容"，自验通过。

- [ ] **Step 3: 确认示例残留清空**

```bash
cd e:/pasule-blog
ls src/content/posts
echo "--- 示例文章 firefly.md 是否还在 ---"
test -f src/content/posts/firefly.md && echo "仍存在！需检查" || echo "已清"
echo "--- public/anime-list.json ---"
test -f public/anime-list.json && echo "仍存在！" || echo "已清"
echo "--- src/content/posts 数量 ---"
ls src/content/posts/*.md | wc -l
```
Expected: `src/content/posts` 下只有迁移的 12 篇（无 firefly.md/guide.md 等示例）；anime-list.json 已清；文件数 12。

- [ ] **Step 4: 提交**

```bash
cd e:/pasule-blog
git add -A
git commit -m "feat(migrate): clean firefly sample content"
```

---

### Task 10: 填入 Firefly 站点配置

**Files:**
- Modify: `src/config/siteConfig.ts`
- Modify: `src/config/profileConfig.ts`
- Modify: `src/config/navBarConfig.ts`
- Modify: `src/config/sidebarConfig.ts`
- Modify: `src/config/musicConfig.ts`
- Modify: `src/config/commentConfig.ts`
- Modify: `src/config/effectsConfig.ts`

> ⚠️ 前置：这些 TS 文件 Firefly 自带，结构已定。下面的改动是"改值"，不动结构。实现时先 Read 每个文件确认字段名与当前 Firefly 版本一致，再做最小改动。

- [ ] **Step 1: siteConfig.ts 填站点信息**

Read `src/config/siteConfig.ts`，按 spec §siteConfig 改这些字段（保留其余 Firefly 默认）：

```ts
title: "Pasule Blog"
subtitle: "pasule的个人博客网站喵~"
site_url: "https://pasule.github.io"
description: "pasule的个人博客网站喵~"
keywords: ["Pasule", "博客", "技术博客"]
lang: "zh-CN"
SITE_LANG: "zh_CN"
timezone: "Asia/Shanghai"
siteStartDate: "2025-01-01"
// themeColor 保留 Firefly 默认绿 hue:165, defaultMode: "system"
// pageWidth 保留默认
pagination: { postsPerPage: 10 }
post: {
  showLastModified: true,
  generateOgImages: true,
  // 其余字段保留默认
}
```

> pages 字段：确保 friends/guestbook 为 true（启用），bangumi/gallery/anime/sponsor 设为 false（不用）。

- [ ] **Step 2: profileConfig.ts 填头像/社交**

Read `src/config/profileConfig.ts`：

```ts
// avatar 改为本地头像路径（Task 11 会把 /img/2.jpg 拷到 src/assets/images/avatar.jpg）
avatar: "src/assets/images/avatar.jpg"   // 或 Firefly 约定的路径，按文件实际确认
name: "Pasule"
bio: "记录技术文章、项目实验和日常折腾。"
// social: github + email
// { name: "GitHub", icon: "fa7-brands:github", url: "https://github.com/pasule", showName: true }
// { name: "Email", icon: "fa7-regular:envelope", url: "mailto:3086874696@qq.com", showName: true }
```

> 实际字段名（avatar 路径格式、icon 集）以 Firefly 文件为准。

- [ ] **Step 3: navBarConfig.ts 按精简菜单**

Read `src/config/navBarConfig.ts`，菜单只留：

```
首页 -> /
文章(下拉) -> 归档 /archive, 标签 /tags, 分类 /categories
友链 -> /friends
留言 -> /guestbook
关于 -> /about
```

去掉 Firefly 默认的 sponsor/bangumi/gallery/anime 等项（若存在）。搜索框保留（Pagefind）。

- [ ] **Step 4: sidebarConfig.ts 确认 widget 组合**

Read `src/config/sidebarConfig.ts`，按 spec：

- 左栏：profile、announcement（文案"欢迎来到 Pasule Blog"）、music、categories、tags
- 右栏：stats、calendar、sidebarToc（仅文章页）

Firefly 默认配置已接近，主要确认 announcement 文案、无多余 widget。

- [ ] **Step 5: musicConfig.ts 设空歌单**

Read `src/config/musicConfig.ts`：

```ts
// meting 模式
type: "meting"   // 或 Firefly 实际枚举值
server: "netease"
id: ""           // 留空
volume: 0.5
// showInNavbar: true, showInSidebar: true（按 Firefly 字段）
```

- [ ] **Step 6: commentConfig.ts 设 Giscus 占位**

Read `src/config/commentConfig.ts`：

```ts
type: "giscus"
// Giscus 占位字段，部署期填实值
giscus: {
  repo: "pasule/pasule.github.io",
  repoId: "",        // 部署期在 https://giscus.app 生成
  category: "Announcements",
  categoryId: "",    // 部署期生成
  // 其余 mapping/reactions 等 Firefly 默认
}
```

- [ ] **Step 7: effectsConfig.ts 开樱花**

Read `src/config/effectsConfig.ts`：

```ts
// 樱花特效
sakura: {
  enable: true,
  // count/speed/opacity 用 Firefly 默认
}
```

- [ ] **Step 8: 拷头像与 favicon 资源**

```bash
cd e:/pasule-blog
cp ../pasule-hexo-source/source/img/2.jpg src/assets/images/avatar.jpg
cp ../pasule-hexo-source/source/img/favicon.ico public/favicon/favicon.ico 2>/dev/null || mkdir -p public/favicon && cp ../pasule-hexo-source/source/img/favicon.ico public/favicon/favicon.ico
ls src/assets/images/
ls public/favicon/
```
Expected: `avatar.jpg` 在 `src/assets/images/`，`favicon.ico` 在 `public/favicon/`。

- [ ] **Step 9: siteConfig.favicon 指向**

Read `siteConfig.ts` 确认 favicon 字段指向 `/favicon/favicon.ico`。

- [ ] **Step 10: 提交配置**

```bash
cd e:/pasule-blog
git add src/config src/assets/images public/favicon
git commit -m "feat(config): fill pasule site/profile/nav/sidebar/music/comment/effects"
```

---

### Task 11: 构建验证与产物检查

**Files:**
- 无源文件改动（验证为主）

- [ ] **Step 1: pnpm build**

```bash
cd e:/pasule-blog
pnpm build
```
Expected: 退出码 0。若失败，读错误信息：
- TS 类型错误 → 检查 friendsConfig.ts 类型路径、各 config 字段名是否与 Firefly 当前版本一致，按报错改
- content schema 错误 → 某篇 frontmatter 字段类型不对，检查 `src/content/posts/`
- 资源缺失 → 头像/favicon 路径对不上

- [ ] **Step 2: 检查 dist 产物**

```bash
cd e:/pasule-blog
test -f dist/index.html && echo "OK index"
test -d dist/posts && echo "OK posts"
ls dist/posts/ | head
test -f dist/rss.xml && echo "OK rss"
test -f dist/sitemap-index.xml && echo "OK sitemap"
test -d dist/pagefind && echo "OK pagefind"
```
Expected: 6 个 OK。`dist/posts/` 下有迁移文章的目录（draft 测试.md 默认不构建，预期缺失）。

- [ ] **Step 3: 确认中文 slug 文章页生成**

```bash
cd e:/pasule-blog
test -d "dist/posts/Java并发编程深度解析" && echo "OK Java post" || echo "缺 Java 文章页"
test -d "dist/posts/校园网串流方案" && echo "OK 校园网 post" || echo "缺 校园网 文章页"
```
Expected: 两个 OK。

- [ ] **Step 4: 本地 dev 人工核对**

```bash
cd e:/pasule-blog
pnpm dev
```
浏览器开 http://localhost:4321，核对：
- 首页：绿色主题、双 sidebar 三栏、文章列表（不含草稿）、分类/标签 chip、公告"欢迎来到 Pasule Blog"
- 点一篇文章：正文、TOC、阅读进度、相关推荐、Giscus 占位区
- 点 `/posts/校园网串流方案/`：15 张图正常显示
- 搜索框：输入关键词能搜到文章（Pagefind）
- 樱花特效飘落
- 音乐播放器：侧栏卡片（空歌单）
- 右上角深色模式切换
- 缩窄到手机宽度：单栏、无横向溢出

Ctrl+C 停止。

- [ ] **Step 5: 提交（无源码改动则跳过）**

```bash
cd e:/pasule-blog
git status --short
git add -A && git commit -m "fix: post-build corrections" || echo "无改动"
```

> 若 build 期间改了配置/文章修复 bug，这里提交。否则跳过。

---

### Task 12: GitHub Actions 部署 workflow 与 Pages source

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: 改 workflow 触发分支**

Read `.github/workflows/deploy.yml`，把触发分支从 `master` 改为 `astro-source`：

```yaml
on:
  push:
    branches: [astro-source]
```

其余（permissions、build steps、deploy-pages）保留 Firefly 默认。确认 workflow 含 `actions/deploy-pages@v4` 与 `upload-pages-artifact`。

- [ ] **Step 2: 确认 .nojekyll 与 artifact 路径**

Read workflow 的 build/upload 步骤，确认：
- `path: ./dist`（artifact 上传 `dist/`）
- 含 `touch dist/.nojekyll` 或等价（Firefly 自带应已处理）

- [ ] **Step 3: 提交 workflow**

```bash
cd e:/pasule-blog
git add .github/workflows/deploy.yml
git commit -m "ci: trigger deploy on astro-source push"
```

- [ ] **Step 4: push astro-source 触发首次 Actions 构建**

```bash
cd e:/pasule-blog
git push -u origin astro-source
```
Expected: push 成功。去 GitHub 仓库 Actions 页面，看到 workflow 运行。

- [ ] **Step 5: 切换 Pages source 到 GitHub Actions（手动）**

这一步在 GitHub 网页手动完成，不在脚本内：

1. 仓库 Settings → Pages
2. Source 从 "Deploy from a branch" 改为 "GitHub Actions"
3. 保存

> 不切的话 workflow 跑成功但站点不更新。

- [ ] **Step 6: 等待并确认 Actions 部署成功**

GitHub Actions 页面等 workflow 跑完（绿勾）。Settings → Pages 顶部会显示部署成功的站点 URL（`https://pasule.github.io/`）。

- [ ] **Step 7: 线上验证**

浏览器开 `https://pasule.github.io/`：
- 显示 Firefly 新站（不是旧 Hexo 站）
- 首页三栏、12 篇文章列表（不含草稿）
- 点 `/posts/Java并发编程深度解析/` 可访问
- 旧 URL `/2025/10/20/Java并发编程深度解析/` 返回 404（预期，URL 策略已改）

- [ ] **Step 8: 配置 Giscus（手动，部署期）**

1. 确认仓库 public + 开启 Discussions（Settings → General → Features ✓ Discussions）
2. 访问 https://giscus.app ，输入 repo `pasule/pasule.github.io`，生成 `repoId`、`categoryId`
3. 回填 `src/config/commentConfig.ts` 的 `giscus.repoId` 与 `categoryId`
4. 提交并 push：

```bash
cd e:/pasule-blog
git add src/config/commentConfig.ts
git commit -m "feat(comment): configure giscus ids"
git push
```
Expected: Actions 重新构建，文章页与 guestbook 出现 Giscus 评论区。

---

### Task 13: 收尾与回滚兜底确认

**Files:**
- 无源文件改动

- [ ] **Step 1: 确认 hexo-source 回滚分支完好**

```bash
cd e:/pasule-blog
git branch -l hexo-source
git worktree list
```
Expected: `hexo-source` 分支存在。若 worktree `../pasule-hexo-source` 不再需要，可移除：

```bash
git worktree remove ../pasule-hexo-source
```

> `hexo-source` 分支本身保留，作回滚兜底。

- [ ] **Step 2: 更新 .gitignore（确认 Firefly 自带够用）**

```bash
cd e:/pasule-blog
grep -E "dist/|node_modules/|\.astro/|pagefind|lqips" .gitignore
```
Expected: 含这些条目。缺则补：
```
dist/
node_modules/
.astro/
public/pagefind/
src/constants/lqips.json
```

- [ ] **Step 3: 清理临时 worktree**

```bash
cd e:/pasule-blog
git worktree remove ../pasule-hexo-source 2>/dev/null || echo "已移除或不存在"
git worktree list
```
Expected: 只剩主工作区。

- [ ] **Step 4: 最终提交**

```bash
cd e:/pasule-blog
git add -A
git commit -m "chore: finalize migration, cleanup worktree" || echo "无改动"
git push
```

- [ ] **Step 5: 验收清单核对**

对照 spec §Acceptance Criteria 逐项确认：
- [ ] astro-source 分支含完整 Firefly 文件树，无示例文章残留
- [ ] 12 篇文章迁移至 src/content/posts/，frontmatter 符合 Firefly schema，自定义字段已弃
- [ ] 校园网串流方案 16 张 Obsidian 图片可访问，正文图片路径为绝对路径
- [ ] about/friends/guestbook 三个 spec 页就位，友链 3 条
- [ ] siteConfig/profile/nav/sidebar/music/comment/effects 配置填入站点信息
- [ ] Giscus 评论、Pagefind 搜索、樱花特效、音乐播放器启用；Live2D/Spine 关闭
- [ ] 本地 pnpm build 成功，pnpm dev 核对通过
- [ ] GitHub Actions workflow 跑通，pasule.github.io 线上显示 Firefly 新站
- [ ] Pages source 已切到 GitHub Actions
- [ ] 旧 hexo-source 分支保留作回滚
- [ ] 旧 verifier 工具废弃（留在 hexo-source 分支，astro-source 不含）

---

## Self-Review

**1. Spec coverage 核对**

- 仓库与分支策略 → Task 1（建 astro-source）+ Task 13（保留 hexo-source）
- 构建流水线 → Task 12（workflow）+ Task 11（本地构建验证）
- Pages source 切换 → Task 12 Step 5
- frontmatter 映射 → Task 5（mapFrontmatter）+ Task 8（migratePosts）
- slug 生成 → Task 8（保留原文件名）
- Obsidian 图片路径 → Task 6（rewrite）+ Task 8 Step 4（migrateAssets）+ verify 16 文件
- spec 页迁移 → Task 8 Step 2-3（about/guestbook）
- 配置迁移 → Task 10
- siteConfig 核心配置 → Task 10 Step 1
- 特性启用清单 → Task 10（music/comment/effects）+ Task 11（搜索/OG 默认）
- 侧栏 widget → Task 10 Step 4
- 导航菜单 → Task 10 Step 3
- Giscus 配置 → Task 12 Step 8
- 音乐占位 → Task 10 Step 5（id 留空）
- 迁移脚本幂等 → Task 3+8（cleanOutput 每次清空重写）
- 迁移报告 → Task 8 Step 6 输出
- Firefly 源码拉取 → Task 1 Step 3（degit）
- 清理示例 → Task 9
- .gitignore → Task 13 Step 2
- 工具链 → Task 2
- 部署 workflow → Task 12
- frontmatter 缺失字段容错 → Task 5（toISODate 抛错 + verifyMigration 检查）
- BOM → Task 8 Step 2（strip BOM）
- about HTML 转 md → Task 7 Step 1 + Task 8 Step 2
- friends 扁平化 → Task 7 Step 3 + Task 8 Step 3
- 文件名冲突 → Task 8 verifyMigration 检查文件数
- 脚本原子性 → Task 8（先 cleanOutput 再写，失败 exit 1）
- 构建期错误 → Task 11 Step 1
- 部署期错误（Pages source）→ Task 12 Step 5
- 迁移脚本验证 → Task 8 Step 5（verifyMigration 编进末尾）
- 构建验证 → Task 11
- 运行时验证 → Task 11 Step 4
- 部署验证 → Task 12 Step 7
- 废弃旧 verifier → hexo-source 分支保留，astro-source 不含（Task 1 已删）

无 spec 条目缺任务覆盖。

**2. 占位符扫描**

- Task 10 多处"按 Firefly 文件实际确认"——这是**必要的动态对齐**（Firefly 版本字段名可能变），不是占位符。每个 Step 都要求先 Read 文件再改值，给了目标值与方向。
- 无 TBD/TODO/"稍后实现"。

**3. 类型一致性**

- `mapFrontmatter(hexoFm, slug)` 签名：Task 5 定义，Task 8 调用——一致
- `rewriteImagePaths(md, slug)`：Task 6 定义，Task 8 调用——一致
- `htmlToMarkdown(html)`：Task 7 定义，Task 8 调用——一致
- `readFrontmatter(raw) → {fm, body}`：Task 4 定义，Task 8/Task 8 verify 调用——一致
- `writeFrontmatter(fm)`：Task 4 定义，Task 8 调用——一致
- `friendsYamlToTs(yamlText)`：Task 7 定义，Task 8 调用——一致
- `cleanFireflySamples()`：Task 9 定义并调用——一致
- `verifyMigration()`：Task 8 Step 5 定义，main 调用——一致
- 资源数 16：Task 8 verifyMigration 断言 16，Task 11 无冲突——一致

计划完整，无占位符，类型一致。
