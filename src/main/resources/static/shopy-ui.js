/* SHOPY shared UI enhancements. Does not replace page-specific business logic. */
(() => {
  document.documentElement.classList.add('shopy-ready');

  // Add a subtle page-enter state without blocking navigation.
  const body = document.body;
  body.classList.add('shopy-page');

  // Close native mobile navs when a link is selected.
  document.querySelectorAll('.mobileNav a').forEach(link => {
    link.addEventListener('click', () => {
      const nav = document.querySelector('.mobileNav');
      const btn = document.getElementById('menuBtn');
      if (nav) nav.classList.remove('open');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  });

  // Keyboard escape closes common overlays/search areas.
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    document.querySelectorAll('.modal-overlay.active,.modal-overlay.show,.search.open,.mobileNav.open').forEach(el => {
      el.classList.remove('active','show','open');
    });
  });

  // Mark current internal nav item where the page already exposes nav links.
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http')) return;
    const clean = href.split('?')[0].split('#')[0].replace(/^\//, '') || 'index.html';
    if (clean === path && !link.classList.contains('logo')) link.setAttribute('aria-current','page');
  });
})();
