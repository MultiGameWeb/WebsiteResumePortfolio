// Shows BotCraft notifications on the owner's phone: a new customer question
// or request. Only push and notification clicks; pages are not cached here.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {}
  event.waitUntil(self.registration.showNotification(data.title || 'BotCraft', {
    body: data.body || 'A customer needs your reply.',
    tag: data.tag || 'botcraft',
    data: { url: data.url || 'owner.html' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || 'owner.html', self.registration.scope).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    const open = windows.find((client) => client.url.split('#')[0] === url.split('#')[0]);
    if (open) return open.focus().then((client) => client.navigate?.(url) || client);
    return self.clients.openWindow(url);
  }));
});
