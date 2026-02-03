// Service Worker for Push Notifications

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);

  if (!event.data) {
    console.log('[Service Worker] No data in push event');
    return;
  }

  let data;
  try {
    data = event.data.json();
    console.log('[Service Worker] Push data:', data);
  } catch (e) {
    console.error('[Service Worker] Failed to parse push data:', e);
    return;
  }

  const options = {
    body: data.body,
    icon: data.icon || '/images/pic1.jpeg',
    badge: '/images/pic1.jpeg',
    tag: data.tag || 'infection-notification',
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => console.log('[Service Worker] Notification shown'))
      .catch((err) => console.error('[Service Worker] Failed to show notification:', err))
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Focus on existing tab or open a new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to find an existing game tab
      for (const client of clientList) {
        if (client.url.includes('/game/') && 'focus' in client) {
          return client.focus();
        }
      }
      // If no existing tab, open the app
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
