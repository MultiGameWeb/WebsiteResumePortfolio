// Keeps the shop assistant page installable and quick to open. Pages and scripts
// come from the network first (so updates show at once), with the cached copy
// as a fallback; API calls are never cached.
const CACHE = 'salesbot-v8';
const SHELL = ['./', './index.html', './styles.css?v=8', './app.js?v=8', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(fetch(event.request)
    .then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
      }
      return response;
    })
    .catch(() => caches.match(event.request, { ignoreSearch: url.pathname.endsWith('/') || url.pathname.endsWith('index.html') })));
});

// The shop's reply or a new status for the customer's request.
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {}
  event.waitUntil(self.registration.showNotification(data.title || 'Shop update', {
    body: data.body || 'The shop replied to your request.',
    icon: './icon.svg',
    tag: data.tag || 'salesbot',
    data: { url: data.url || './' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || './', self.registration.scope).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    const open = windows.find((client) => client.url.split('#')[0] === url.split('#')[0]);
    if (open) return open.focus().then((client) => client.navigate?.(url) || client);
    return self.clients.openWindow(url);
  }));
});
