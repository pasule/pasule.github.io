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
expectContains('public/about/index.html', 'id="pasule-quick-jump"');
expectContains('public/about/index.html', 'Signal Note');
expectNotContains('public/about/index.html', 'data-pasule-home-shell');
expectContains('public/index.html', 'data-pasule-home-shell');
expectContains('public/index.html', 'data-pasule-series-deck');
expectContains('public/index.html', 'data-pasule-project-spotlight');
expectContains('public/index.html', '把博客做成一个有气质的技术小宇宙');
expectContains('public/index.html', 'Java / 后端成长线');
expectContains('public/index.html', 'Pasule Blog');
expectContains('public/style.css', '.pasule-home-shell');
expectContains('public/style.css', '.pasule-project-spotlight-card');
expectContains('public/style.css', '.pasule-post-guide');
expectContains('public/style.css', '#pasule-quick-jump');
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
expectContains('public/2025/10/20/Java并发编程深度解析/index.html', 'Java / 后端成长线');
expectContains('public/2025/10/20/Java并发编程深度解析/index.html', '推荐下一篇');
expectContains('public/2025/10/20/Java并发编程深度解析/index.html', 'card-post-series');
expectContains('public/index.html', 'data-pasule-home-carousel');
expectContains('public/index.html', 'data-pasule-nav-grouped');
expectContains('public/index.html', 'data-pasule-announcement-panel');
expectContains('public/style.css', '.pasule-home-carousel');
expectContains('public/style.css', '.pasule-nav-group');

console.log('verify-generated-pages: checks passed');







