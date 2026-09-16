// Router tipis berbasis History API (pushState) — menggantikan hash routing (`#/...`) lama.
// Kenapa dipisah dari main.js: view modules (mufrodat.js dkk) perlu navigasi terprogram
// (mis. tombol next/prev) tanpa import balik dari main.js (yang bakal bikin circular import,
// karena main.js sendiri yang import semua view modules).
let routerFn = null;

export function setRouter(fn) {
  routerFn = fn;
}

export function navigate(path) {
  if (window.location.pathname === path) return;
  window.history.pushState(null, '', path);
  routerFn?.();
}

// Delegasi klik pada SEMUA link internal (href diawali "/") ke pushState, supaya browser tidak
// full-reload halaman tiap navigasi — ini yang bikin routing berbasis path bisa jalan tanpa "#".
export function bindLinkInterceptor() {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('/') || link.target === '_blank') return;

    e.preventDefault();
    navigate(href);
  });

  window.addEventListener('popstate', () => routerFn?.());
}
