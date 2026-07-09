let pasuleNavScrollHandler = null;
let pasuleReadPercentHandler = null;
let pasuleArticleScrollHandler = null;
let pasuleMusicKeyHandler = null;

function normalizePath(path) {
  const cleaned = String(path || '/').split('#')[0].split('?')[0].replace(/\/index\.html$/, '/');
  return cleaned.endsWith('/') ? cleaned : `${cleaned}/`;
}

function initPasuleGlobalMusic() {
  const root = document.querySelector('[data-pasule-music-player]');
  if (!root) return;

  const toggle = root.querySelector('[data-pasule-music-toggle]');
  const close = root.querySelector('[data-pasule-music-close]');
  const panel = root.querySelector('[data-pasule-music-panel]');
  const openTriggers = Array.from(document.querySelectorAll('[data-pasule-music-open]'));
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

  openTriggers.forEach((trigger) => {
    if (trigger.dataset.pasuleMusicOpenBound) return;

    trigger.addEventListener('click', () => {
      setOpen(true);
    });

    trigger.dataset.pasuleMusicOpenBound = 'true';
  });

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

document.addEventListener('DOMContentLoaded', initPasuleGlobalMusic);
document.addEventListener('DOMContentLoaded', initPasuleNavTitle);
document.addEventListener('DOMContentLoaded', initPasuleNavActiveState);
document.addEventListener('DOMContentLoaded', initPasuleReadPercent);
document.addEventListener('DOMContentLoaded', initPasuleArticleProgress);
document.addEventListener('pjax:complete', initPasuleGlobalMusic);
document.addEventListener('pjax:complete', initPasuleNavTitle);
document.addEventListener('pjax:complete', initPasuleNavActiveState);
document.addEventListener('pjax:complete', initPasuleReadPercent);
document.addEventListener('pjax:complete', initPasuleArticleProgress);
