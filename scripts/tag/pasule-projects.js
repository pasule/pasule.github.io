'use strict';

function tagList(stack) {
  return (stack || []).map(item => `<span class="pasule-mini-link">${item}</span>`).join('');
}

function relationList(items) {
  return (items || []).map(item => `<span class="pasule-mini-link">${item}</span>`).join('');
}

hexo.extend.tag.register('pasule_projects', function () {
  const map = hexo.locals.get('data')['content-map'];
  const intro = map.projects.intro;
  const cards = map.projects.items.map(item => {
    const repoLink = item.repo ? `<a class="pasule-primary-link" href="${item.repo}" target="_blank" rel="noopener">Repository</a>` : '';
    const demoLink = item.demo ? `<a class="pasule-secondary-link" href="${item.demo}" target="_blank" rel="noopener">Live Demo</a>` : '';

    return `
      <article class="pasule-project-card" data-pasule-project-card>
        <p class="pasule-card-kicker">${item.key}</p>
        <h3>${item.title}</h3>
        <p>${item.summary}</p>
        <div class="pasule-stack-list">${tagList(item.stack)}</div>
        <p class="pasule-project-status">status: ${item.status}</p>
        <div class="pasule-guide-links">${repoLink}${demoLink}</div>
        <div class="pasule-stack-list">${relationList(item.related_titles)}</div>
      </article>
    `;
  }).join('');

  return `
    <section class="pasule-project-page" data-pasule-project-grid>
      <div class="pasule-section-head">
        <div>
          <h1>${intro.title}</h1>
          <p>${intro.description}</p>
        </div>
        <a class="pasule-secondary-link" href="/archives/">回到文章档案</a>
      </div>
      <div class="pasule-card-grid">${cards}</div>
    </section>
  `;
});
