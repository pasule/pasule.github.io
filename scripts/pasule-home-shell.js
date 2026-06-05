'use strict';

const cheerio = require('cheerio');

function normalizeLink(input) {
  if (!input) return '#';
  return `/${String(input).replace(/^\/+/, '')}`;
}

function normalizeAsset(input) {
  if (!input) return '#';
  if (/^(https?:)?\/\//.test(String(input)) || String(input).startsWith('mailto:')) return input;
  return normalizeLink(input);
}

function findPostByTitle(posts, title) {
  return posts.find(post => post.title === title);
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

function normalizeInterval(input, fallback = 5200) {
  const value = Number(input);
  return Number.isFinite(value) && value >= 2000 ? value : fallback;
}

function normalizeMusicType(input) {
  const value = String(input || 'playlist').trim().toLowerCase();
  return ['song', 'playlist', 'album', 'artist'].includes(value) ? value : 'playlist';
}

function buildMediaHero(home) {
  const config = home && home.media_hero;
  const images = ((config && config.images) || []).filter(item => item && item.src);

  if (!config || config.enabled === false || !images.length) return '';

  const interval = normalizeInterval(config.interval);
  const slides = images.map((item, index) => {
    const active = index === 0 ? ' is-active' : '';
    return `
      <figure class="pasule-hero-slide${active}" data-pasule-hero-slide>
        <img src="${normalizeAsset(item.src)}" alt="${escapeHtml(item.title || 'Pasule hero image')}" loading="${index === 0 ? 'eager' : 'lazy'}" onerror="this.onerror=null;this.src='/img/404.jpg'">
        <figcaption class="pasule-hero-caption">
          ${item.title ? `<strong>${escapeHtml(item.title)}</strong>` : ''}
          ${item.subtitle ? `<span>${escapeHtml(item.subtitle)}</span>` : ''}
        </figcaption>
      </figure>
    `;
  }).join('');

  const dots = images.map((item, index) => {
    const active = index === 0 ? ' is-active' : '';
    const label = escapeHtml(item.title || `slide ${index + 1}`);
    return `<button class="pasule-hero-dot${active}" type="button" data-pasule-hero-dot="${index}" aria-label="${label}"></button>`;
  }).join('');

  return `
    <section class="pasule-home-enhancement" data-pasule-home-enhancement>
      <section class="pasule-home-media-hero" data-pasule-home-hero data-interval="${interval}">
        <div class="pasule-hero-track">
          ${slides}
        </div>
        <div class="pasule-hero-copy-panel">
          <p class="pasule-eyebrow">Pasule Station</p>
          <h2>技术文章、项目实验和日常折腾的入口</h2>
          <p>先从最近的记录开始，也可以去项目、相册和归档里慢慢翻。</p>
          <div class="pasule-hero-actions">
            <a class="pasule-primary-link" href="/archives/">浏览文章</a>
            <a class="pasule-secondary-link" href="/gallery/">打开相册</a>
          </div>
        </div>
        <div class="pasule-hero-controls" aria-label="首页照片轮换">
          ${dots}
        </div>
      </section>
    </section>
  `;
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

function buildFeaturedCards(posts, titles) {
  return titles.map(title => {
    const post = findPostByTitle(posts, title);
    if (!post) return '';
    return `
      <article class="pasule-feature-card wow animate__fadeInUp" data-pasule-feature-card>
        <p class="pasule-card-kicker">Featured Article</p>
        <h3><a href="${normalizeLink(post.path)}">${post.title}</a></h3>
        <p>${post.description || ''}</p>
      </article>
    `;
  }).join('');
}

function buildSeriesDeck(posts, seriesDeck) {
  return seriesDeck.map(item => {
    const links = item.entry_titles.map(title => {
      const post = findPostByTitle(posts, title);
      if (!post) return '';
      return `<a class="pasule-mini-link" href="${normalizeLink(post.path)}">${post.title}</a>`;
    }).join('');

    return `
      <article class="pasule-series-card wow animate__fadeInUp" data-pasule-series-card>
        <p class="pasule-card-kicker">Series Deck</p>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <div class="pasule-mini-link-list">${links}</div>
      </article>
    `;
  }).join('');
}

function buildProjectSpotlight(items) {
  return items.map(item => `
    <article class="pasule-project-spotlight-card wow animate__fadeInUp" data-pasule-project-card>
      <p class="pasule-card-kicker">Project</p>
      <h3>${item.title}</h3>
      <p>${item.summary}</p>
      <div class="pasule-project-status">status: ${item.status}</div>
    </article>
  `).join('');
}

function buildCarouselSlides(posts, items) {
  return items.map(item => {
    const post = findPostByTitle(posts, item.title);
    if (!post) return '';
    return `
      <article class="swiper-slide pasule-slide-card">
        <p class="pasule-card-kicker">Featured Slide</p>
        <h3>${post.title}</h3>
        <p>${item.summary}</p>
        <a class="pasule-primary-link" href="${normalizeLink(post.path)}">${item.link_title}</a>
      </article>
    `;
  }).join('');
}

function buildHomeProfile(meta) {
  const socialLinks = (meta.social || []).map(item => `
    <a class="social-icon" href="${item.link}" target="_blank" rel="noopener" title="${item.label}">
      <i class="${item.icon}"${item.color ? ` style="color:${item.color}"` : ''}></i>
    </a>
  `).join('');

  return `
    <section class="pasule-home-side-card pasule-home-profile-card text-center" data-pasule-home-profile>
      <div class="avatar-img">
        <img src="${meta.avatar}" onerror="this.onerror=null;this.src='/img/friend_404.gif'" alt="avatar">
      </div>
      <div class="author-info-name">${meta.author}</div>
      <div class="author-info-description">${meta.description}</div>
      <div class="site-data">
        <a href="/archives/"><div class="headline">文章</div><div class="length-num">${meta.counts.posts}</div></a>
        <a href="/tags/"><div class="headline">标签</div><div class="length-num">${meta.counts.tags}</div></a>
        <a href="/categories/"><div class="headline">分类</div><div class="length-num">${meta.counts.categories}</div></a>
      </div>
      <a id="pasule-home-profile-btn" href="${meta.profileLink}" target="_blank" rel="noopener">
        <i class="${meta.profileIcon}"></i><span>${meta.profileText}</span>
      </a>
      <div class="card-info-social-icons">${socialLinks}</div>
    </section>
  `;
}

function buildHomeSide(meta) {
  return `
    <aside class="pasule-home-side" data-pasule-home-side>
      ${buildHomeProfile(meta)}
      <section class="pasule-home-side-card pasule-home-note-card" data-pasule-home-note data-pasule-announcement-panel>
        <div class="item-headline"><i class="fas fa-bullhorn"></i><span>公告</span></div>
        <p class="pasule-widget-copy">${meta.announcement}</p>
      </section>
      <section class="pasule-home-side-card pasule-home-quick-card" data-pasule-home-quick>
        <div class="item-headline"><i class="fas fa-compass"></i><span>快速导航</span></div>
        <div class="pasule-link-stack">
          <a href="/archives/">文章档案</a>
          <a href="/projects/">项目集</a>
          <a href="/gallery/">相册</a>
          <a href="/about/">关于我</a>
        </div>
      </section>
    </aside>
  `;
}

function buildHomeShell(map, posts, meta) {
  if (!map || !map.home || !map.projects) return '';

  const hero = map.home.hero;
  const featuredCards = buildFeaturedCards(posts, map.home.featured_titles || []);
  const seriesCards = buildSeriesDeck(posts, map.home.series_deck || []);
  const projectCards = buildProjectSpotlight(map.projects.items || []);
  const carouselSlides = buildCarouselSlides(posts, (map.home.carousel && map.home.carousel.items) || []);

  return `
    <section class="pasule-home-shell" data-pasule-home-shell>
      <section class="pasule-home-stage" data-pasule-home-stage>
        <section class="pasule-home-carousel" data-pasule-home-carousel>
          ${(hero.eyebrow || hero.title || hero.description) ? `
            <div class="pasule-carousel-head">
              ${hero.eyebrow ? `<p class="pasule-eyebrow">${hero.eyebrow}</p>` : ''}
              ${hero.title ? `<h1>${hero.title}</h1>` : ''}
              ${hero.description ? `<p class="pasule-hero-copy">${hero.description}</p>` : ''}
            </div>
          ` : ''}
          <div class="swiper pasule-swiper">
            <div class="swiper-wrapper">${carouselSlides}</div>
            <div class="swiper-pagination"></div>
          </div>
        </section>
        ${buildHomeSide(meta)}
      </section>

      <section class="pasule-home-grid" data-pasule-feature-panels>
        <div class="pasule-home-section" data-pasule-featured-deck>
          <div class="pasule-section-head">
            <h2>Featured Dispatches</h2>
            <a href="/archives/">更多文章</a>
          </div>
          <div class="pasule-card-grid">${featuredCards}</div>
        </div>

        <div class="pasule-home-section" data-pasule-series-deck>
          <div class="pasule-section-head">
            <h2>Series Deck</h2>
            <a href="/tags/">浏览标签</a>
          </div>
          <div class="pasule-card-grid">${seriesCards}</div>
        </div>

        <div class="pasule-home-section" data-pasule-project-spotlight>
          <div class="pasule-section-head">
            <h2>${map.projects.intro.title}</h2>
            <a href="/projects/">打开项目页</a>
          </div>
          <div class="pasule-card-grid">${projectCards}</div>
        </div>
      </section>
    </section>
  `;
}

function normalizeSocial(icon, raw) {
  const parts = String(raw).split('||').map(part => part.trim());
  return {
    icon,
    link: parts[0] || '#',
    label: parts[1] || icon,
    color: parts[2] ? parts[2].replace(/^['"]|['"]$/g, '') : ''
  };
}

hexo.extend.filter.register('after_render:html', function (html, data) {
  if (!data || !data.path || !data.path.endsWith('.html')) return html;

  const $ = cheerio.load(html, { decodeEntities: false });
  const map = ((hexo.locals.get('data') || {})['content-map']) || {};
  const home = map.home || {};

  if (data.path === 'index.html') {
    $('body').addClass('pasule-home-page');
    $('#nav').attr('data-pasule-nav-grouped', 'true');

    if (!$('[data-pasule-home-hero]').length) {
      const hero = buildMediaHero(home);
      const recentPosts = $('#recent-posts');

      if (hero && recentPosts.length) {
        recentPosts.prepend(hero);
      } else if (hero) {
        $('#content-inner').prepend(hero);
      }
    }
  }

  if (!$('[data-pasule-music-player]').length) {
    const player = buildGlobalMusic(home);
    if (player && $('body').length) {
      $('body').append(player);
    }
  }

  return $.html();
});
