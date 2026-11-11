/* Service worker for جاسوس — generated at build time. Do not edit dist/sw.js by hand. */
const CACHE = 'jasoos-__BUILD_ID__';
const PREFIX = 'jasoos-';
// Every file of the game, relative to this file's folder (e.g. /jasoos/).
const ASSETS = __ASSETS__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS.map((a) => new Request(a, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      // Only remove OUR old caches (other projects on the same github.io address keep theirs).
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const scope = new URL(self.registration.scope);
  if (!url.pathname.startsWith(scope.pathname)) return;

  // Opening the app (any page inside /jasoos/) → the cached game page.
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match(new URL('index.html', scope).href, { ignoreVary: true })
        .then((hit) => hit || fetch(req))
        .catch(() => caches.match(new URL('index.html', scope).href, { ignoreVary: true })),
    );
    return;
  }

  event.respondWith(
    caches.match(req, { ignoreVary: true, ignoreSearch: url.pathname.endsWith('.html') }).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      });
    }),
  );
});
