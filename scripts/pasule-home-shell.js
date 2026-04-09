'use strict';

const cheerio = require('cheerio');

function normalizeLink(input) {
  if (!input) return '#';
  return `/${String(input).replace(/^\/+/, '')}`;
}

function findPostByTitle(posts, title) {
  return posts.find(post => post.title === title);
}

function buildFeaturedCards(posts, titles) {
  return titles.map(title => {
    const post = findPostByTitle(posts, title);
    if (!post) return '';
    return `
      <article class="pasule-feature-card" data-pasule-feature-card>
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
      <article class="pasule-series-card" data-pasule-series-card>
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
    <article class="pasule-project-spotlight-card" data-pasule-project-card>
      <p class="pasule-card-kicker">Project</p>
      <h3>${item.title}</h3>
      <p>${item.summary}</p>
      <div class="pasule-project-status">status: ${item.status}</div>
    </article>
  `).join('');
}

function buildHomeShell(map, posts) {
  if (!map || !map.home || !map.projects) return '';

  const hero = map.home.hero;
  const featuredCards = buildFeaturedCards(posts, map.home.featured_titles || []);
  const seriesCards = buildSeriesDeck(posts, map.home.series_deck || []);
  const projectCards = buildProjectSpotlight(map.projects.items || []);

  return `
    <section class="pasule-home-shell" data-pasule-home-shell>
      <section class="pasule-home-hero">
        <p class="pasule-eyebrow">${hero.eyebrow}</p>
        <h1>${hero.title}</h1>
        <p class="pasule-hero-copy">${hero.description}</p>
        <div class="pasule-hero-actions">
          <a class="pasule-primary-link" href="${hero.primary_link}">${hero.primary_text}</a>
          <a class="pasule-secondary-link" href="${hero.secondary_link}">${hero.secondary_text}</a>
        </div>
      </section>

      <section class="pasule-home-grid">
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

hexo.extend.filter.register('after_render:html', function (html, data) {
  if (!data || data.path !== 'index.html') return html;

  const $ = cheerio.load(html, { decodeEntities: false });
  $('#nav').attr('data-pasule-nav-grouped', 'true');
  const recentPosts = $('#recent-posts');
  if (!recentPosts.length || $('[data-pasule-home-shell]').length) return html;

  const siteData = hexo.locals.get('data');
  const posts = hexo.locals.get('posts').data;
  const contentMap = siteData['content-map'];
  const shell = buildHomeShell(contentMap, posts);

  if (!shell) return html;

  recentPosts.before(shell);
  recentPosts.prepend(`
    <div class="pasule-section-head pasule-feed-head">
      <h2>Recent Updates</h2>
      <a href="/archives/">查看完整归档</a>
    </div>
  `);

  return $.html();
});

