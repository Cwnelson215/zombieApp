// Service Worker for Push Notifications

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

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
