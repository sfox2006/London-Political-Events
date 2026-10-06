/* Shared header markup is generated from index.html; directory actions live here. */
(() => {
  const menu = document.getElementById('menu-toggle');
  const about = document.getElementById('about-dialog');
  const install = document.getElementById('install-app');
  const tip = document.getElementById('install-tip');
  const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const phone = () => window.matchMedia('(max-width: 700px)').matches;
  let installPrompt = null;
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.querySelector('.ms').textContent = open ? 'close' : 'menu';
    if (open) {
      const first = [...document.querySelectorAll('#overflow-menu button, #overflow-menu a')]
        .find(element => !element.hidden && element.offsetParent !== null);
      first?.focus();
    }
  }
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  document.getElementById('overflow-menu').addEventListener('click', () => {
    if (phone()) setMenu(false);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.top-actions')) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.body.classList.contains('menu-open')) {
      setMenu(false);
      menu.focus();
      event.preventDefault();
    }
  });
  window.addEventListener('resize', () => { if (!phone()) setMenu(false); });
  document.getElementById('refresh-events').addEventListener('click', () => window.location.reload());
  document.getElementById('about-open').addEventListener('click', () => {
    if (about.showModal) about.showModal();
    else about.setAttribute('open', '');
  });
  document.getElementById('about-close').addEventListener('click', () => {
    if (about.close) about.close();
    else about.removeAttribute('open');
  });
  const tipKey = 'london-events-install-tip-dismissed';
  let dismissed = false;
  try { dismissed = localStorage.getItem(tipKey) === '1'; } catch { /* Storage is optional. */ }
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios && !standalone() && !dismissed) tip.hidden = false;
  document.getElementById('dismiss-install-tip').addEventListener('click', () => {
    tip.hidden = true;
    try { localStorage.setItem(tipKey, '1'); } catch { /* The tip still closes. */ }
  });
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    install.hidden = standalone();
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    install.hidden = true;
    tip.hidden = true;
  });
  install.addEventListener('click', async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    try { await installPrompt.userChoice; } catch { /* Dismissal is allowed. */ }
    installPrompt = null;
    install.hidden = true;
  });
  // Refresh the directory shell when the same worker update reaches either page.
  if ('serviceWorker' in navigator) {
    let reloading = false;
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data?.type !== 'shell-updated') return;
      event.ports[0]?.postMessage('ok');
      if (reloading) return;
      reloading = true;
      setTimeout(() => window.location.reload(), 40);
    });
    navigator.serviceWorker.register('./sw.js').then(registration => {
      const update = () => registration.update().catch(() => {});
      update();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') update();
      });
    }).catch(() => {});
  }
})();
