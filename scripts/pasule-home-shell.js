'use strict';

const cheerio = require('cheerio');

function normalizeLink(input) {
  if (!input) return '#';
  return `/${String(input).replace(/^\/+/, '')}`;
}

function normalizeAsset(input) {
  if (!input) return '#';
  const value = String(input);
  if (/^(https?:)?\/\//.test(value) || value.startsWith('mailto:')) return value;
  return normalizeLink(value);
}

function escapeHtml(input) {
  return String(input || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function escapeCssUrl(input) {
  return String(input || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function normalizeLimit(input, fallback) {
  const value = Number(input);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function normalizeMusicType(input) {
  const value = String(input || 'playlist').trim().toLowerCase();
  return ['song', 'playlist', 'album', 'artist'].includes(value) ? value : 'playlist';
}

function getStaticBanner(home) {
  const banner = (home && home.banner) || {};
  if (banner.enabled === false) return null;

  const legacyImages = ((((home && home.media_hero) || {}).images) || []).filter(item => item && item.src);
  const image = banner.image || (legacyImages[0] && legacyImages[0].src);
  if (!image) return null;

  return {
    image: normalizeAsset(image),
    fallback: normalizeAsset(banner.fallback_image || '/img/404.jpg')
  };
}

function applyStaticBanner($, home) {
  const banner = getStaticBanner(home);
  const header = $('#page-header');
  if (!banner || !header.length) return;

  const style = String(header.attr('style') || '')
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .filter(part => !/^background(?:-image|-size|-position|-repeat)?\s*:/i.test(part));

  style.push(`background-image: url("${escapeCssUrl(banner.image)}")`);
  style.push('background-size: cover');
  style.push('background-position: center');
  style.push('background-repeat: no-repeat');

  header.attr('style', style.join('; '));
  header.attr('data-pasule-static-banner', 'true');
  header.attr('data-pasule-banner-image', banner.image);
  header.attr('data-pasule-banner-fallback', banner.fallback);
}

function buildMetingElement(music) {
  const id = String((music && music.id) || '').trim();
  if (!id) {
    return '<p class="pasule-global-music-empty" data-pasule-music-empty>歌单源未填写</p>';
  }

  return `
    <meting-js
      data-pasule-meting
      server="netease"
      type="${normalizeMusicType(music.type)}"
      id="${escapeHtml(id)}"
      fixed="false"
      mini="false"
      autoplay="false"
      mutex="true"
      preload="none"
      theme="#4f7df3"
      list-folded="true">
    </meting-js>
  `;
}

function buildGlobalMusic(home) {
  const music = (home && home.music) || {};
  if (music.enabled === false) return '';

  const title = escapeHtml(music.title || 'Pasule Radio');
  const subtitle = escapeHtml(music.subtitle || '网易云歌单源未填写。');

  return `
    <aside class="pasule-global-music" data-pasule-music-player>
      <button class="pasule-global-music-toggle" type="button" data-pasule-music-toggle aria-label="${title}" aria-expanded="false" aria-controls="pasule-global-music-panel" title="${title}">
        <i class="fas fa-music" aria-hidden="true"></i>
      </button>
      <section class="pasule-global-music-panel" id="pasule-global-music-panel" data-pasule-music-panel hidden>
        <header class="pasule-global-music-head">
          <div>
            <p class="pasule-card-kicker">Music</p>
            <h2>${title}</h2>
            <p>${subtitle}</p>
          </div>
          <button class="pasule-global-music-close" type="button" data-pasule-music-close aria-label="收起音乐播放器">
            <i class="fas fa-times" aria-hidden="true"></i>
          </button>
        </header>
        <div class="pasule-global-music-body">
          ${buildMetingElement(music)}
        </div>
      </section>
    </aside>
  `;
}

function buildHomeMusicCard(home) {
  const music = (home && home.music) || {};
  if (music.enabled === false) return '';

  const title = escapeHtml(music.title || 'Pasule Radio');
  const hasSource = Boolean(String(music.id || '').trim());
  const status = hasSource ? '歌单源已配置，打开全局播放器即可收听。' : escapeHtml(music.subtitle || '网易云歌单源未填写。');

  return `
    <section class="card-widget pasule-home-music-card" data-pasule-home-music-card>
      <div class="item-headline"><i class="fas fa-music"></i><span>音乐</span></div>
      <div class="item-content">
        <p class="pasule-widget-copy">${status}</p>
        <button class="pasule-home-music-open" type="button" data-pasule-music-open>打开播放器</button>
      </div>
    </section>
  `;
}

function limitCategoryCard($, card, limit) {
  const items = card.find('.card-category-list-item');
  if (items.length <= limit) return;

  items.each((index, item) => {
    if (index >= limit) $(item).remove();
  });

  card.find('.card-category-list').append(`
    <li class="card-category-list-item pasule-more-item">
      <a class="card-category-list-link" href="/categories/">
        <span class="card-category-list-name">更多</span>
        <span class="card-category-list-count">+</span>
      </a>
    </li>
  `);
}

function limitTagCard($, card, limit) {
  const tags = card.find('.card-tag-cloud a');
  if (tags.length <= limit) return;

  tags.each((index, item) => {
    if (index >= limit) $(item).remove();
  });

  card.find('.card-tag-cloud').append('<a class="pasule-chip-more" href="/tags/">更多</a>');
}

function limitArchiveCard($, card, limit) {
  const items = card.find('.card-archive-list-item');
  if (items.length <= limit) return;

  items.each((index, item) => {
    if (index >= limit) $(item).remove();
  });

  card.find('.card-archive-list').append(`
    <li class="card-archive-list-item pasule-more-item">
      <a class="card-archive-list-link" href="/archives/">
        <span class="card-archive-list-date">更多归档</span>
        <span class="card-archive-list-count">+</span>
      </a>
    </li>
  `);
}

function moveFirst($, source, selector, target) {
  const node = source.find(selector).first();
  if (!node.length) return null;
  target.append(node);
  return node;
}

function applyFireflyHomeLayout($, home) {
  if ($('[data-pasule-home-firefly]').length) return;

  const layout = $('#content-inner');
  const recentPosts = $('#recent-posts');
  const aside = $('#aside-content');
  if (!layout.length || !recentPosts.length || !aside.length) return;

  const config = (home && home.layout) || {};
  const tagLimit = normalizeLimit(config.tag_limit, 12);
  const categoryLimit = normalizeLimit(config.category_limit, 6);

  const shell = $('<section class="pasule-home-firefly" data-pasule-home-firefly></section>');
  const left = $('<aside class="pasule-home-rail pasule-home-left" data-pasule-home-left></aside>');
  const stream = $('<section class="pasule-home-stream" data-pasule-home-stream></section>');
  const right = $('<aside class="pasule-home-rail pasule-home-right" data-pasule-home-right></aside>');

  recentPosts.before(shell);
  shell.append(left, stream, right);

  moveFirst($, aside, '.card-info', left);
  left.append(buildHomeMusicCard(home));

  const categoryCard = moveFirst($, aside, '.card-categories', left);
  if (categoryCard) limitCategoryCard($, categoryCard, categoryLimit);

  const tagCard = moveFirst($, aside, '.card-tags', left);
  if (tagCard) limitTagCard($, tagCard, tagLimit);

  const announcementCard = moveFirst($, aside, '.card-announcement', right);
  if (announcementCard) announcementCard.attr('data-pasule-announcement-panel', '');

  moveFirst($, aside, '#pasule-quick-jump', right);
  moveFirst($, aside, '.card-webinfo', right);

  const archiveCard = moveFirst($, aside, '.card-archives', right);
  if (archiveCard) limitArchiveCard($, archiveCard, 5);

  aside.find('#pasule-station-note, .card-recent-post').remove();
  aside.remove();

  recentPosts.addClass('pasule-home-posts');
  if (!recentPosts.find('[data-pasule-stream-head]').length) {
    recentPosts.prepend(`
      <div class="pasule-home-stream-head" data-pasule-stream-head>
        <p class="pasule-card-kicker">Recent Posts</p>
        <h2>最近文章</h2>
        <a href="/archives/">全部归档</a>
      </div>
    `);
  }
  stream.append(recentPosts);

  left.children('.card-widget').addClass('pasule-home-rail-card');
  right.children('.card-widget').addClass('pasule-home-rail-card');
  layout.addClass('pasule-home-layout');
}

hexo.extend.filter.register('after_render:html', function (html, data) {
  if (!data || !data.path || !data.path.endsWith('.html')) return html;

  const $ = cheerio.load(html, { decodeEntities: false });
  const map = ((hexo.locals.get('data') || {})['content-map']) || {};
  const home = map.home || {};

  if (data.path === 'index.html') {
    $('body').addClass('pasule-home-page');
    $('#nav').attr('data-pasule-nav-grouped', 'true');
    applyStaticBanner($, home);
    applyFireflyHomeLayout($, home);
  }

  if (!$('[data-pasule-music-player]').length) {
    const player = buildGlobalMusic(home);
    if (player && $('body').length) {
      $('body').append(player);
    }
  }

  return $.html();
});
