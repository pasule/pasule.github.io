function initPasuleHomeEffects() {
  if (typeof Swiper === 'function' && document.querySelector('.pasule-swiper')) {
    new Swiper('.pasule-swiper', {
      loop: true,
      autoplay: { delay: 4200 },
      pagination: {
        el: '.swiper-pagination',
        clickable: true
      }
    });
  }

  if (typeof WOW === 'function') {
    new WOW().init();
  }
}

function initPasuleNavTitle() {
  const navTitle = document.querySelector('#blog-info .nav-page-title .site-name');
  if (!navTitle) return;

  const onScroll = () => {
    navTitle.style.display = window.scrollY > 180 ? 'inline' : 'none';
  };

  onScroll();
  document.addEventListener('scroll', onScroll, { passive: true });
}

function initPasuleReadPercent() {
  const button = document.querySelector('#go-up .scroll-percent');
  if (!button) return;

  const update = () => {
    const top = document.documentElement.scrollTop || document.body.scrollTop;
    const total = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const percent = total > 0 ? Math.round((top / total) * 100) : 0;
    button.textContent = `${percent}%`;
  };

  update();
  document.addEventListener('scroll', update, { passive: true });
}

document.addEventListener('DOMContentLoaded', initPasuleHomeEffects);
document.addEventListener('DOMContentLoaded', initPasuleNavTitle);
document.addEventListener('DOMContentLoaded', initPasuleReadPercent);
document.addEventListener('pjax:complete', initPasuleHomeEffects);
document.addEventListener('pjax:complete', initPasuleNavTitle);
document.addEventListener('pjax:complete', initPasuleReadPercent);
