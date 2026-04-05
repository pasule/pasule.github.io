'use strict';

const fs = require('node:fs');
const path = require('node:path');

const sourceDir = path.join(hexo.base_dir, 'source', '_posts', 'assets');
const targetDir = path.join(hexo.public_dir, 'assets');

function syncAssets() {
  if (!fs.existsSync(sourceDir)) return;

  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  fs.cpSync(sourceDir, targetDir, { recursive: true });
}

hexo.extend.filter.register('after_generate', function () {
  syncAssets();
});
