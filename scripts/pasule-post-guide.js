'use strict';

const cheerio = require('cheerio');

function normalizeLink(input) {
  if (!input) return '#';
  return `/${String(input).replace(/^\/+/, '')}`;
}

function findPostByTitle(posts, title) {
  return posts.find(post => post.title === title);
}

function stripHtml(input) {
  return String(input || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-zA-Z#0-9]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatDate(input) {
  if (!input) return '未记录';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return String(input);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function estimateReadMinutes(text) {
  const normalized = stripHtml(text);
  const cnChars = (normalized.match(/[\u4e00-\u9fff]/g) || []).length;
  const latinWords = (normalized.replace(/[\u4e00-\u9fff]/g, ' ').match(/[A-Za-z0-9_]+/g) || []).length;
  const minutes = Math.ceil(cnChars / 420 + latinWords / 220);
  return Math.max(3, minutes || 3);
}

function buildLinkList(posts, titles, className = 'pasule-mini-link') {
  return (titles || []).map(title => {
    const post = findPostByTitle(posts, title);
    if (!post) return '';
    return `<a class="${className}" href="${normalizeLink(post.path)}">${post.title}</a>`;
  }).join('');
}

function buildHeadingLinks(headings, limit = 4, className = 'pasule-mini-link') {
  return headings.slice(0, limit).map(item => {
    return `<a class="${className}" href="#${item.id}">${item.text}</a>`;
  }).join('');
}

function deriveAudience(post) {
  if (post.reading_for) return String(post.reading_for);

  const difficultyMap = {
    beginner: '适合刚开始搭技术知识树、希望先抓住主线概念的读者。',
    intermediate: '适合已经有基础概念，想把分散知识串成完整路径的读者。',
    advanced: '适合已经写过相关实践，想补齐底层原理与设计细节的读者.'
  };

  const difficultyText = difficultyMap[post.difficulty] || '适合希望把单篇文章读成一条可持续知识路径的读者。';
  const keywords = post.keywords && post.keywords.length
    ? `这篇内容会重点围绕 ${post.keywords.slice(0, 3).join(' / ')} 展开。`
    : '';

  return `${difficultyText}${keywords}`;
}

function deriveTakeaways(post, analysis) {
  if (Array.isArray(post.takeaways) && post.takeaways.length) {
    return post.takeaways.slice(0, 3).map(item => String(item));
  }

  if (typeof post.takeaways === 'string' && post.takeaways.trim()) {
    return post.takeaways
      .split(/[；;。]/)
      .map(item => item.trim())
      .filter(Boolean)
      .slice(0, 3);
  }

  const items = [];

  if (post.hero_desc) {
    items.push(post.hero_desc);
  }

  if (analysis.headings.length) {
    items.push(`你可以顺着 ${analysis.headings.slice(0, 3).map(item => item.text).join(' / ')} 这条目录主线快速建立结构感。`);
  }

  if (post.recommended_next && post.recommended_next.length) {
    items.push(`读完后可以继续进入《${post.recommended_next[0]}》，把当前主题延伸成连续阅读。`);
  }

  return items.filter(Boolean).slice(0, 3);
}

function buildSeriesState(post, posts) {
  if (!post.series) return null;

  const seriesPosts = posts
    .filter(item => item.layout === 'post' && item.series === post.series)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const currentIndex = seriesPosts.findIndex(item => item.path === post.path);

  return {
    title: post.series,
    index: currentIndex >= 0 ? currentIndex + 1 : 0,
    total: seriesPosts.length,
    items: seriesPosts
  };
}

function collectHeadings($, container) {
  return container.find('h2[id], h3[id]').map((_, element) => {
    const heading = $(element);
    return {
      id: heading.attr('id'),
      text: heading.text().replace(/\s+/g, ' ').trim(),
      level: element.tagName.toLowerCase()
    };
  }).get().filter(item => item.id && item.text);
}

function buildStatCard(label, value, hint) {
  return `
    <article class="pasule-brief-stat">
      <p class="pasule-card-kicker">${label}</p>
      <h3>${value}</h3>
      <p>${hint}</p>
    </article>
  `;
}

function buildArticleBrief(post, analysis, seriesState) {
  const summary = post.hero_desc || post.description || analysis.lead;
  const quickLinks = buildHeadingLinks(analysis.headings, 4);
  const seriesHint = seriesState
    ? `系列 ${seriesState.index}/${seriesState.total}`
    : '单篇阅读';

  const statCards = [
    buildStatCard('预计阅读', `${analysis.readMinutes} min`, '按当前正文长度估算'),
    buildStatCard('目录规模', `${analysis.primaryCount} / ${analysis.headingCount}`, '一级章节 / 总锚点'),
    buildStatCard('最后更新', formatDate(post.updated || post.date), seriesHint),
    buildStatCard('阅读难度', post.difficulty || 'progressive', post.series || '自由专题')
  ].join('');

  return `
    <section class="pasule-article-brief" data-pasule-article-brief>
      <div class="pasule-article-brief-main">
        <p class="pasule-card-kicker">Pasule Article Brief</p>
        <h2>先掌握这篇文章的结构，再开始往下读</h2>
        <p class="pasule-hero-copy">${summary || '这篇文章会先帮你建立结构感，再进入正文细节。'}</p>
        <div class="pasule-guide-links">${quickLinks}</div>
      </div>
      <div class="pasule-article-meta-grid">${statCards}</div>
      <div class="pasule-inline-progress" data-pasule-inline-progress>
        <div class="pasule-progress-meta">
          <span>阅读完成度</span>
          <strong data-pasule-read-percent>0%</strong>
        </div>
        <div class="pasule-progress-track">
          <span data-pasule-progress-fill></span>
        </div>
      </div>
    </section>
  `;
}

function buildGuide(post, posts, analysis, seriesState) {
  const takeaways = deriveTakeaways(post, analysis).map(item => `<li>${item}</li>`).join('');
  const chapterLinks = buildHeadingLinks(analysis.headings, 5);
  const nextLinks = buildLinkList(posts, post.recommended_next);
  const seriesText = seriesState
    ? `当前位于《${seriesState.title}》第 ${seriesState.index} / ${seriesState.total} 篇，读完后继续往后接会更顺。`
    : '这篇文章更适合按目录从上往下读完，再回头挑重点复习。';

  return `
    <section class="pasule-post-guide" data-pasule-post-guide>
      <div class="pasule-post-guide-grid">
        <article class="pasule-guide-panel">
          <p class="pasule-card-kicker">Reading For</p>
          <h3>适合谁读</h3>
          <p>${deriveAudience(post)}</p>
        </article>
        <article class="pasule-guide-panel">
          <p class="pasule-card-kicker">Takeaways</p>
          <h3>你会拿到什么</h3>
          <ul class="pasule-guide-list">${takeaways}</ul>
        </article>
        <article class="pasule-guide-panel">
          <p class="pasule-card-kicker">Reading Path</p>
          <h3>推荐怎么读</h3>
          <p>${seriesText}</p>
          <div class="pasule-guide-links">${chapterLinks}</div>
          <div class="pasule-guide-links">${nextLinks}</div>
        </article>
      </div>
    </section>
  `;
}

function buildReadingRail(post, posts, analysis, seriesState) {
  const chapterLinks = buildHeadingLinks(analysis.headings, 3, 'pasule-rail-link');
  const nextLinks = buildLinkList(posts, post.recommended_next, 'pasule-rail-link');
  const seriesBlock = seriesState
    ? `
      <div class="pasule-rail-stat">
        <span>系列位置</span>
        <strong>${seriesState.index} / ${seriesState.total}</strong>
      </div>
    `
    : '';

  return `
    <div class="card-widget pasule-reading-rail" data-pasule-reading-rail>
      <div class="item-headline">
        <i class="fas fa-route"></i>
        <span>Reading Rail</span>
      </div>
      <div class="pasule-reading-progress">
        <div class="pasule-progress-meta">
          <span>阅读完成度</span>
          <strong data-pasule-read-percent>0%</strong>
        </div>
        <div class="pasule-progress-track">
          <span data-pasule-progress-fill></span>
        </div>
        <p class="pasule-current-section">当前章节：<span data-pasule-current-heading>${analysis.headings[0] ? analysis.headings[0].text : '准备开始阅读'}</span></p>
      </div>
      <div class="pasule-reading-rail-grid">
        <div class="pasule-rail-stat">
          <span>预计阅读</span>
          <strong>${analysis.readMinutes} min</strong>
        </div>
        <div class="pasule-rail-stat">
          <span>一级章节</span>
          <strong>${analysis.primaryCount}</strong>
        </div>
        ${seriesBlock}
        <div class="pasule-rail-stat">
          <span>更新日期</span>
          <strong>${formatDate(post.updated || post.date)}</strong>
        </div>
      </div>
      ${chapterLinks ? `
        <div class="pasule-rail-block">
          <p class="pasule-card-kicker">Quick Jump</p>
          <div class="pasule-rail-links">${chapterLinks}</div>
        </div>
      ` : ''}
      ${nextLinks ? `
        <div class="pasule-rail-block">
          <p class="pasule-card-kicker">Next Route</p>
          <div class="pasule-rail-links">${nextLinks}</div>
        </div>
      ` : ''}
    </div>
  `;
}

function buildArticleOutro(post, posts, seriesState) {
  const nextLinks = buildLinkList(posts, post.recommended_next);
  const seriesLinks = seriesState
    ? seriesState.items
      .filter(item => item.path !== post.path)
      .slice(0, 3)
      .map(item => `<a class="pasule-mini-link" href="${normalizeLink(item.path)}">${item.title}</a>`)
      .join('')
    : '';

  return `
    <section class="pasule-article-outro" data-pasule-article-outro>
      <div class="pasule-section-head">
        <h2>读完之后可以去哪里</h2>
        <a href="/archives/">回到文章档案</a>
      </div>
      <div class="pasule-card-grid">
        <article class="pasule-feature-card">
          <p class="pasule-card-kicker">Continue Reading</p>
          <h3>继续沿主线往下读</h3>
          <div class="pasule-mini-link-list">${nextLinks || '<span class="pasule-mini-link">这篇适合作为当前节点的收束篇</span>'}</div>
        </article>
        <article class="pasule-feature-card">
          <p class="pasule-card-kicker">Series Deck</p>
          <h3>${seriesState ? seriesState.title : '更多系列阅读'}</h3>
          <div class="pasule-mini-link-list">${seriesLinks || '<a class="pasule-mini-link" href="/tags/">浏览标签与系列入口</a>'}</div>
        </article>
        <article class="pasule-feature-card">
          <p class="pasule-card-kicker">Explore</p>
          <h3>把文章继续接回站点主线</h3>
          <div class="pasule-mini-link-list">
            <a class="pasule-mini-link" href="/projects/">打开项目页</a>
            <a class="pasule-mini-link" href="/about/">关于我</a>
            <a class="pasule-mini-link" href="/comments/">留言板</a>
          </div>
        </article>
      </div>
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
  if (!container.length || $('[data-pasule-article-brief]').length) return html;

  const headings = collectHeadings($, container);
  const lead = container.find('p').first().text().replace(/\s+/g, ' ').trim();
  const textContent = stripHtml(container.html());
  const analysis = {
    headings,
    headingCount: headings.length,
    primaryCount: headings.filter(item => item.level === 'h2').length || headings.length,
    lead,
    readMinutes: estimateReadMinutes(textContent)
  };
  const seriesState = buildSeriesState(post, posts);

  container.prepend(buildGuide(post, posts, analysis, seriesState));
  container.prepend(buildArticleBrief(post, analysis, seriesState));
  container.append(buildArticleOutro(post, posts, seriesState));

  const stickyLayout = $('#aside-content .sticky_layout');
  if (stickyLayout.length && !$('[data-pasule-reading-rail]').length) {
    stickyLayout.prepend(buildReadingRail(post, posts, analysis, seriesState));
  }

  $('#card-toc').attr('data-pasule-reading-contents', 'true');
  $('.card-post-series').attr('data-pasule-series-lane', 'true');

  return $.html();
});
