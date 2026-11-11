// Replaces the old offline cache on phones that installed the game from Netlify:
// removes the old cached copy, unregisters itself and sends open windows to the new address.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.registration.unregister();
    const wins = await self.clients.matchAll({ type: 'window' });
    wins.forEach((w) => w.navigate('https://j-sadeghi.github.io/jasoos/').catch(() => {}));
  })());
});
self.addEventListener('fetch', () => {});
