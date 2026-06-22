/* Billy — service worker minimal (installable PWA + cache de l'app shell).
 * Stratégie : cache-first pour les assets statiques ; on ne met JAMAIS en cache les API
 * (/api/*, /lib/*) ni les flux temps réel. */
const CACHE = 'billy-v3';
const SHELL = [
  '/adulte.html', '/session.html', '/sessions.html', '/css/styles.css', '/js/session.js',
  '/assets/billy.png', '/assets/billy-talk.png', '/manifest.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/lib/') || url.pathname.startsWith('/signal')) return; // jamais en cache
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      if (res.ok && (url.pathname.startsWith('/assets/') || SHELL.includes(url.pathname))) caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('/session.html')))
  );
});
