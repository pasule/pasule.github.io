const fs = require('node:fs');
const path = require('node:path');

function mustExist(file) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing file: ${file}`);
  }
}

function mustContain(file, marker) {
  const full = path.join(process.cwd(), file);
  const text = fs.readFileSync(full, 'utf8');
  if (!text.includes(marker)) {
    throw new Error(`Missing marker "${marker}" in ${file}`);
  }
}

mustContain('public/2026/04/04/校园网串流方案/index.html', '/assets/%E6%A0%A1%E5%9B%AD%E7%BD%91%E4%B8%B2%E6%B5%81%E6%96%B9%E6%A1%88/file-20260405014556300.png');
mustExist('public/assets/校园网串流方案/file-20260405014556300.png');
mustExist('public/assets/校园网串流方案/file-20260405022428189.jpg');

console.log('verify-post-assets: checks passed');

