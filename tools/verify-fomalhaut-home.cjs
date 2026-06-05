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

function mustAppearInOrder(file, markers) {
  const text = read(file);
  let cursor = -1;
  markers.forEach(marker => {
    const index = text.indexOf(marker, cursor + 1);
    if (index === -1) {
      throw new Error(`Missing ordered marker "${marker}" in ${file}`);
    }
    cursor = index;
  });
}

mustContain('public/index.html', 'data-pasule-home-hero');
mustContain('public/index.html', 'data-pasule-hero-slide');
mustContain('public/index.html', 'data-pasule-music-player');
mustContain('public/about/index.html', 'data-pasule-music-player');
mustContain('public/index.html', 'id="recent-posts"');
mustContain('public/index.html', 'data-pasule-nav-grouped');
mustContain('public/index.html', 'APlayer.min.css');
mustContain('public/index.html', 'Meting.min.js');
mustContain('public/style.css', '.pasule-home-media-hero');
mustContain('public/style.css', '.pasule-global-music');
mustContain('public/js/pasule-fomalhaut-ui.js', 'initPasuleMediaHero');
mustContain('public/js/pasule-fomalhaut-ui.js', 'initPasuleGlobalMusic');
mustAppearInOrder('public/index.html', ['id="recent-posts"', 'data-pasule-home-enhancement', 'class="recent-post-items"']);

console.log('verify-fomalhaut-home: checks passed');
