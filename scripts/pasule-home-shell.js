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
  if (!data || data.path !== 'index.html') return html;

  const $ = cheerio.load(html, { decodeEntities: false });
  $('body').addClass('pasule-home-page');
  $('#nav').attr('data-pasule-nav-grouped', 'true');

  return $.html();
});
