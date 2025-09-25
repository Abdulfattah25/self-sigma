/* global workbox, self */
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({ cacheName: 'images', plugins: [] }),
);

registerRoute(
  ({ url }) => /\.supabase\.co$/.test(url.host) && /\/rest\/v1\//.test(url.pathname),
  new NetworkFirst({
    cacheName: 'supabase-rest',
    networkTimeoutSeconds: 6,
  }),
);

registerRoute(
  ({ url }) => /\.supabase\.co$/.test(url.host) && /\/storage\/v1\/object\//.test(url.pathname),
  new StaleWhileRevalidate({ cacheName: 'supabase-storage' }),
);

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch (_) {}
  const type = data.type || 'info';
  const title = data.title || (type === 'morning' ? 'Pengingat pagi' : 'Pengingat sore');
  const body = data.body || data.message || '';
  const options = {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data,
    tag: `reminder-${type}-${data.date || ''}`,
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = '/?open=tasks';
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        if ('focus' in client) {
          client.postMessage({ type: 'open-view', view: 'tasks' });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })(),
  );
});
