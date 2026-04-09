const fs = require('node:fs');
const path = require('node:path');

function read(file) {
  return fs.readFileSync(path.join(process.cwd(), file), 'utf8');
}

function mustContain(file, marker) {
  const text = read(file);
  if (!text.includes(marker)) {
    throw new Error(`Missing "${marker}" in ${file}`);
  }
}

mustContain('public/index.html', 'data-pasule-home-carousel');
mustContain('public/index.html', 'data-pasule-feature-panels');
mustContain('public/index.html', 'data-pasule-announcement-panel');
mustContain('public/index.html', 'data-pasule-nav-grouped');
mustContain('public/style.css', '.pasule-home-carousel');
mustContain('public/style.css', '.pasule-nav-group');

console.log('verify-fomalhaut-home: checks passed');
