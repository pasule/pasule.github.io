let pasuleNavScrollHandler = null;
let pasuleReadPercentHandler = null;
let pasuleArticleScrollHandler = null;
let pasuleMediaHeroTimer = null;
let pasuleMusicKeyHandler = null;

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

function initPasuleMediaHero() {
  if (pasuleMediaHeroTimer) {
    window.clearInterval(pasuleMediaHeroTimer);
    pasuleMediaHeroTimer = null;
  }

  const root = document.querySelector('[data-pasule-home-hero]');
  if (!root) return;

  const slides = Array.from(root.querySelectorAll('[data-pasule-hero-slide]'));
  const dots = Array.from(root.querySelectorAll('[data-pasule-hero-dot]'));
  const interval = Math.max(Number(root.getAttribute('data-interval')) || 5200, 2000);
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activeIndex = Math.max(slides.findIndex(slide => slide.classList.contains('is-active')), 0);
  if (!slides.length) return;

  const render = () => {
    slides.forEach((slide, index) => {
      const active = index === activeIndex;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
    });

    dots.forEach((dot, index) => {
      const active = index === activeIndex;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-current', active ? 'true' : 'false');
    });
  };

  const goTo = (index) => {
    activeIndex = (index + slides.length) % slides.length;
    render();
  };

  if (!root.dataset.pasuleHeroBound) {
    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        goTo(Number(dot.getAttribute('data-pasule-hero-dot')) || 0);
      });
    });

    root.addEventListener('mouseenter', () => {
      root.dataset.pasuleHeroPaused = 'true';
    });

    root.addEventListener('mouseleave', () => {
      root.dataset.pasuleHeroPaused = 'false';
    });

    root.dataset.pasuleHeroBound = 'true';
  }

  render();

  if (!reduceMotion && slides.length > 1) {
    pasuleMediaHeroTimer = window.setInterval(() => {
      if (root.dataset.pasuleHeroPaused !== 'true') goTo(activeIndex + 1);
    }, interval);
  }
}

function initPasuleGlobalMusic() {
  const root = document.querySelector('[data-pasule-music-player]');
  if (!root) return;

  const toggle = root.querySelector('[data-pasule-music-toggle]');
  const close = root.querySelector('[data-pasule-music-close]');
  const panel = root.querySelector('[data-pasule-music-panel]');
  const storageKey = 'pasule-global-music-open';

  if (!toggle || !panel) return;

  const setOpen = (open, persist = true) => {
    root.classList.toggle('is-open', open);
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');

    if (persist) {
      localStorage.setItem(storageKey, open ? 'true' : 'false');
    }
  };

  if (!root.dataset.pasuleMusicBound) {
    toggle.addEventListener('click', () => {
      setOpen(!root.classList.contains('is-open'));
    });

    if (close) {
      close.addEventListener('click', () => {
        setOpen(false);
      });
    }

    root.dataset.pasuleMusicBound = 'true';
  }

  if (pasuleMusicKeyHandler) {
    document.removeEventListener('keydown', pasuleMusicKeyHandler);
    pasuleMusicKeyHandler = null;
  }

  pasuleMusicKeyHandler = (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  document.addEventListener('keydown', pasuleMusicKeyHandler);
  setOpen(localStorage.getItem(storageKey) === 'true', false);
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
document.addEventListener('DOMContentLoaded', initPasuleMediaHero);
document.addEventListener('DOMContentLoaded', initPasuleGlobalMusic);
document.addEventListener('DOMContentLoaded', initPasuleNavTitle);
document.addEventListener('DOMContentLoaded', initPasuleNavActiveState);
document.addEventListener('DOMContentLoaded', initPasuleReadPercent);
document.addEventListener('DOMContentLoaded', initPasuleArticleProgress);
document.addEventListener('pjax:complete', initPasuleHomeEffects);
document.addEventListener('pjax:complete', initPasuleMediaHero);
document.addEventListener('pjax:complete', initPasuleGlobalMusic);
document.addEventListener('pjax:complete', initPasuleNavTitle);
document.addEventListener('pjax:complete', initPasuleNavActiveState);
document.addEventListener('pjax:complete', initPasuleReadPercent);
document.addEventListener('pjax:complete', initPasuleArticleProgress);
