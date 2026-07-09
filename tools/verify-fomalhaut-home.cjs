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

function mustNotContain(file, marker) {
  const text = read(file);
  if (text.includes(marker)) {
    throw new Error(`Unexpected "${marker}" in ${file}`);
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

function mustNotContainInRule(file, selector, marker) {
  const text = read(file);
  const selectorIndex = text.indexOf(selector);
  if (selectorIndex === -1) {
    throw new Error(`Missing selector "${selector}" in ${file}`);
  }

  const nextRuleIndex = text.indexOf('}', selectorIndex);
  const rule = nextRuleIndex === -1 ? text.slice(selectorIndex) : text.slice(selectorIndex, nextRuleIndex);
  if (rule.includes(marker)) {
    throw new Error(`Unexpected "${marker}" in "${selector}" rule in ${file}`);
  }
}

mustContain('public/index.html', 'data-pasule-home-firefly');
mustContain('public/index.html', 'data-pasule-home-left');
mustContain('public/index.html', 'data-pasule-home-stream');
mustContain('public/index.html', 'data-pasule-home-right');
mustContain('public/index.html', 'data-pasule-static-banner');
mustContain('public/index.html', 'data-pasule-home-music-card');
mustContain('public/index.html', 'data-pasule-music-player');
mustContain('public/about/index.html', 'data-pasule-music-player');
mustContain('public/index.html', 'id="recent-posts"');
mustContain('public/index.html', 'data-pasule-nav-grouped');
mustContain('public/index.html', 'APlayer.min.css');
mustContain('public/index.html', 'Meting.min.js');
mustContain('public/style.css', '.pasule-home-firefly');
mustContain('public/style.css', '.pasule-home-stream');
mustContain('public/style.css', '.pasule-global-music');
mustContain('public/js/pasule-fomalhaut-ui.js', 'initPasuleGlobalMusic');
mustNotContain('public/index.html', 'data-pasule-home-hero');
mustNotContain('public/index.html', 'data-pasule-home-carousel');
mustNotContain('public/index.html', 'pasule-hero-dot');
mustNotContain('public/style.css', '.pasule-home-media-hero');
mustNotContain('public/style.css', '.pasule-swiper');
mustNotContain('public/js/pasule-fomalhaut-ui.js', 'initPasuleMediaHero');
mustNotContain('public/js/pasule-fomalhaut-ui.js', 'pasuleMediaHeroTimer');
mustAppearInOrder('public/index.html', ['data-pasule-home-left', 'data-pasule-home-stream', 'data-pasule-home-right']);
mustNotContainInRule('public/style.css', '.pasule-home-rail-card', 'backdrop-filter');
mustNotContainInRule('public/style.css', '.pasule-home-stream-head', 'backdrop-filter');
mustNotContainInRule('public/style.css', '.pasule-home-stream #recent-posts .recent-post-item', 'backdrop-filter');
mustNotContainInRule('public/style.css', '.pasule-global-music-panel', 'backdrop-filter');

// De-glass: modify.css is 100% project-owned; after de-glass it has zero blur.
mustNotContain('public/css/modify.css', 'backdrop-filter: blur');
mustNotContain('public/css/modify.css', 'backdrop-filter:blur');

// Dead homepage CSS removed (gen-1 fomalhaut / media-hero leftovers).
[
  '.pasule-home-shell',
  '.pasule-home-hero',
  '.pasule-home-section',
  '.pasule-home-grid',
  '.pasule-feature-card',
  '.pasule-series-card',
  '.pasule-project-spotlight-card',
  '.pasule-announcement-section',
  '.pasule-eyebrow',
  '.pasule-hero-copy',
  '.pasule-hero-actions'
].forEach(cls => mustNotContain('public/css/modify.css', cls));

// Live classes that must survive (still rendered by projects / about / posts / home).
['.pasule-project-card', '.pasule-about-panel', '.pasule-card-grid', '.pasule-section-head', '.pasule-card-kicker']
  .forEach(cls => mustContain('public/css/modify.css', cls));

console.log('verify-fomalhaut-home: checks passed');
