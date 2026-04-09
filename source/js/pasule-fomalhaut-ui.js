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

document.addEventListener('DOMContentLoaded', initPasuleHomeEffects);
document.addEventListener('pjax:complete', initPasuleHomeEffects);
