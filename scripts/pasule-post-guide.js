'use strict';

const cheerio = require('cheerio');

function normalizeLink(input) {
  if (!input) return '#';
  return `/${String(input).replace(/^\/+/, '')}`;
}

function findPostByTitle(posts, title) {
  return posts.find(post => post.title === title);
}

function buildNextLinks(posts, titles) {
  return (titles || []).map(title => {
    const post = findPostByTitle(posts, title);
    if (!post) return '';
    return `<a class="pasule-mini-link" href="${normalizeLink(post.path)}">${post.title}</a>`;
  }).join('');
}

function buildGuide(post, posts) {
  const tags = [];
  if (post.series) tags.push(`<span class="pasule-mini-link">${post.series}</span>`);
  if (post.difficulty) tags.push(`<span class="pasule-mini-link">难度 · ${post.difficulty}</span>`);
  if (post.keywords && post.keywords.length) {
    post.keywords.forEach(item => tags.push(`<span class="pasule-mini-link">${item}</span>`));
  }

  return `
    <section class="pasule-post-guide" data-pasule-post-guide>
      <p class="pasule-card-kicker">Reading Guide</p>
      <h2>${post.title}</h2>
      <p>${post.hero_desc || ''}</p>
      <div class="pasule-stack-list">${tags.join('')}</div>
      <div class="pasule-guide-links">
        ${buildNextLinks(posts, post.recommended_next)}
      </div>
      <p class="pasule-card-kicker">推荐下一篇</p>
    </section>
  `;
}

hexo.extend.filter.register('after_render:html', function (html, data) {
  if (!data || data.path === 'index.html' || !/index\.html$/.test(data.path)) return html;

  const postPath = data.path.replace(/index\.html$/, '');
  const posts = hexo.locals.get('posts').data;
  const post = posts.find(item => item.path === postPath);
  if (!post || post.layout !== 'post') return html;

  const $ = cheerio.load(html, { decodeEntities: false });
  const container = $('article#article-container.post-content');
  if (!container.length || $('[data-pasule-post-guide]').length) return html;

  container.prepend(buildGuide(post, posts));
  return $.html();
});
