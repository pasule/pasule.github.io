const fs = require('node:fs');
const path = require('node:path');

function read(file) {
  return fs.readFileSync(path.join(process.cwd(), file), 'utf8');
}

function expectContains(file, marker) {
  const text = read(file);
  if (!text.includes(marker)) {
    throw new Error(`Missing "${marker}" in ${file}`);
  }
}

function expectNotContains(file, marker) {
  const text = read(file);
  if (text.includes(marker)) {
    throw new Error(`Unexpected "${marker}" in ${file}`);
  }
}

expectContains('public/index.html', 'id="pasule-quick-jump"');
expectContains('public/index.html', 'id="pasule-station-note"');
expectContains('public/index.html', 'card-info');
expectContains('public/about/index.html', 'id="pasule-quick-jump"');
expectNotContains('public/about/index.html', 'Signal Note');
expectNotContains('public/about/index.html', 'data-pasule-home-shell');
expectNotContains('public/index.html', 'data-pasule-home-shell');
expectNotContains('public/index.html', 'data-pasule-home-side');
expectNotContains('public/index.html', 'data-pasule-home-profile');
expectNotContains('public/index.html', '把博客做成一个有气质的技术小宇宙');
expectContains('public/index.html', 'Pasule Blog');
expectContains('public/style.css', '.pasule-project-spotlight-card');
expectContains('public/style.css', '.pasule-post-guide');
expectContains('public/style.css', '.pasule-link-stack');
expectContains('public/projects/index.html', 'data-pasule-project-grid');
expectContains('public/projects/index.html', 'Pasule Blog');
expectContains('public/projects/index.html', 'status: active');
expectNotContains('public/projects/index.html', '示例项目');
expectNotContains('public/projects/index.html', '更多项目请仿照上方格式添加');
expectContains('public/about/index.html', 'data-pasule-about-grid');
expectContains('public/about/index.html', '继续读文章');
expectContains('public/about/index.html', '打开项目页');
expectNotContains('public/about/index.html', '混吃，等死');
expectContains('public/2025/10/20/Java并发编程深度解析/index.html', 'data-pasule-post-guide');
expectContains('public/2025/10/20/Java并发编程深度解析/index.html', 'data-pasule-article-brief');
expectContains('public/2025/10/20/Java并发编程深度解析/index.html', 'data-pasule-reading-rail');
expectContains('public/2025/10/20/Java并发编程深度解析/index.html', 'data-pasule-article-outro');
expectContains('public/2025/10/20/Java并发编程深度解析/index.html', 'Java / 后端成长线');
expectContains('public/2025/10/20/Java并发编程深度解析/index.html', 'Pasule Article Brief');
expectContains('public/2025/10/20/Java并发编程深度解析/index.html', 'Reading Rail');
expectContains('public/2025/10/20/Java并发编程深度解析/index.html', '继续沿主线往下读');
expectContains('public/2025/10/20/Java并发编程深度解析/index.html', 'card-post-series');
expectNotContains('public/index.html', 'data-pasule-home-carousel');
expectNotContains('public/index.html', 'data-pasule-topic-atlas');
expectContains('public/index.html', 'data-pasule-nav-grouped');
expectContains('public/index.html', 'data-pasule-announcement-panel');
expectContains('public/style.css', '.pasule-home-carousel');
expectContains('public/style.css', '.pasule-nav-group');
expectContains('public/index.html', '快速导航');
expectContains('public/index.html', '公告');
expectContains('public/style.css', '[data-theme=dark]');
expectNotContains('public/index.html', 'Signal Note');
expectContains('public/style.css', '--pasule-side-fab-offset');
expectContains('public/style.css', '.pasule-swiper');
expectNotContains('public/style.css', '.pasule-topic-atlas');
expectContains('public/style.css', '.card-tag-cloud');
expectContains('public/style.css', '.pasule-article-brief');
expectContains('public/style.css', '.pasule-reading-rail');
expectContains('public/style.css', '.pasule-article-outro');
expectContains('public/index.html', '软件架构设计入门：从拆模块到定边界');
expectContains('public/index.html', 'Windows 与 WSL 协同开发环境整理');
expectContains('public/index.html', 'Linux 家庭服务器服务编排实战');
expectNotContains('public/index.html', '/2026/04/05/%E6%B5%8B%E8%AF%95/');

console.log('verify-generated-pages: checks passed');
