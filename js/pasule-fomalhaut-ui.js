let pasuleNavScrollHandler = null;
let pasuleReadPercentHandler = null;
let pasuleArticleScrollHandler = null;

function normalizePath(path) {
  const cleaned = String(path || '/').split('#')[0].split('?')[0].replace(/\/index\.html$/, '/');
  return cleaned.endsWith('/') ? cleaned : `${cleaned}/`;
}

function initPasuleHomeEffects() {
  const root = document.querySelector('.pasule-swiper');
  if (root) {
    const slides = Array.from(root.querySelectorAll('.swiper-slide'));
    const pagination = root.querySelector('.swiper-pagination');
    let activeIndex = 0;
    let timer = null;

    if (slides.length) {
      const render = () => {
        slides.forEach((slide, index) => {
          slide.classList.toggle('is-active', index === activeIndex);
        });

        if (pagination) {
          pagination.innerHTML = slides
            .map((_, index) => {
              const active = index === activeIndex ? ' is-active' : '';
              return `<button class="pasule-swiper-dot${active}" data-index="${index}" type="button" aria-label="slide ${index + 1}"></button>`;
            })
            .join('');

          pagination.querySelectorAll('[data-index]').forEach((button) => {
            button.addEventListener('click', () => {
              activeIndex = Number(button.getAttribute('data-index'));
              render();
              restart();
            });
          });
        }
      };

      const restart = () => {
        if (timer) clearInterval(timer);
        timer = window.setInterval(() => {
          activeIndex = (activeIndex + 1) % slides.length;
          render();
        }, 4200);
      };

      render();
      restart();
    }
  }

  if (typeof WOW === 'function') {
    new WOW().init();
  }
}

function initPasuleNavTitle() {
  const navTitle = document.querySelector('#blog-info .nav-page-title .site-name');
  if (pasuleNavScrollHandler) {
    document.removeEventListener('scroll', pasuleNavScrollHandler);
    pasuleNavScrollHandler = null;
  }
  if (!navTitle) return;

  const onScroll = () => {
    navTitle.style.display = window.scrollY > 180 ? 'inline' : 'none';
  };

  pasuleNavScrollHandler = onScroll;
  onScroll();
  document.addEventListener('scroll', onScroll, { passive: true });
}

function initPasuleNavActiveState() {
  const nav = document.querySelector('#nav');
  if (!nav) return;
  nav.setAttribute('data-pasule-nav-grouped', 'true');

  const currentPath = normalizePath(window.location.pathname);
  const links = Array.from(nav.querySelectorAll('.menus_item > .site-page[href], .menus_item_child a[href]'));
  let activeTopItem = null;
  let bestLength = 0;

  links.forEach((link) => {
    const url = new URL(link.getAttribute('href'), window.location.origin);
    const linkPath = normalizePath(url.pathname);
    const isActive = linkPath === '/'
      ? currentPath === '/'
      : currentPath === linkPath || currentPath.startsWith(linkPath);

    link.classList.toggle('is-active', isActive);

    if (isActive && linkPath.length >= bestLength) {
      activeTopItem = link.closest('.menus_item');
      bestLength = linkPath.length;
    }
  });

  if (!activeTopItem && /^\/\d{4}\//.test(currentPath)) {
    activeTopItem = Array.from(nav.querySelectorAll('.menus_item'))
      .find((item) => item.textContent.includes('文章'));
  }

  nav.querySelectorAll('.menus_item.is-current').forEach((item) => {
    item.classList.remove('is-current');
  });

  if (activeTopItem) {
    activeTopItem.classList.add('is-current');
  }
}

function initPasuleReadPercent() {
  const button = document.querySelector('#go-up .scroll-percent');
  if (pasuleReadPercentHandler) {
    document.removeEventListener('scroll', pasuleReadPercentHandler);
    pasuleReadPercentHandler = null;
  }
  if (!button) return;

  const update = () => {
    const top = document.documentElement.scrollTop || document.body.scrollTop;
    const total = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const percent = total > 0 ? Math.round((top / total) * 100) : 0;
    button.textContent = `${percent}%`;
  };

  pasuleReadPercentHandler = update;
  update();
  document.addEventListener('scroll', update, { passive: true });
}

function initPasuleArticleProgress() {
  if (pasuleArticleScrollHandler) {
    window.removeEventListener('scroll', pasuleArticleScrollHandler);
    pasuleArticleScrollHandler = null;
  }

  const article = document.querySelector('article#article-container.post-content');
  const percentNodes = Array.from(document.querySelectorAll('[data-pasule-read-percent]'));
  const progressNodes = Array.from(document.querySelectorAll('[data-pasule-progress-fill]'));
  const headingNode = document.querySelector('[data-pasule-current-heading]');

  if (!article || (!percentNodes.length && !progressNodes.length && !headingNode)) return;

  const headings = Array.from(article.querySelectorAll('h2[id], h3[id]'));

  const update = () => {
    const top = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const articleTop = article.getBoundingClientRect().top + top;
    const total = Math.max(article.scrollHeight - window.innerHeight * 0.72, 1);
    const raw = ((top - articleTop) / total) * 100;
    const percent = Math.max(0, Math.min(100, Math.round(raw)));

    percentNodes.forEach((node) => {
      node.textContent = `${percent}%`;
    });

    progressNodes.forEach((node) => {
      node.style.width = `${percent}%`;
    });

    if (headingNode && headings.length) {
      let activeHeading = headings[0];

      headings.forEach((heading) => {
        const headingTop = heading.getBoundingClientRect().top + top;
        if (headingTop - 160 <= top) {
          activeHeading = heading;
        }
      });

      headingNode.textContent = activeHeading.textContent.trim();
    }
  };

  pasuleArticleScrollHandler = update;
  update();
  window.addEventListener('scroll', update, { passive: true });
}

document.addEventListener('DOMContentLoaded', initPasuleHomeEffects);
document.addEventListener('DOMContentLoaded', initPasuleNavTitle);
document.addEventListener('DOMContentLoaded', initPasuleNavActiveState);
document.addEventListener('DOMContentLoaded', initPasuleReadPercent);
document.addEventListener('DOMContentLoaded', initPasuleArticleProgress);
document.addEventListener('pjax:complete', initPasuleHomeEffects);
document.addEventListener('pjax:complete', initPasuleNavTitle);
document.addEventListener('pjax:complete', initPasuleNavActiveState);
document.addEventListener('pjax:complete', initPasuleReadPercent);
document.addEventListener('pjax:complete', initPasuleArticleProgress);
