// Applies the persisted/system theme before first paint to avoid a light→dark flash.
// Lives as an external file (not inline in index.html) so the Content-Security-Policy can
// keep `script-src 'self'` — no `'unsafe-inline'` escape hatch for scripts. Render-blocking
// by design: loaded synchronously in <head> so the `dark` class is set before the body paints.
(function () {
  var t = localStorage.getItem('theme') || 'system';
  var dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  if (dark) document.documentElement.classList.add('dark');
})();
