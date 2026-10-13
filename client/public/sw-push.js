/**
 * PRIME OS - Service Worker Push & Notification Click Engine
 * Handles background Web Push events and notifications clicks reliably on Android and iOS (PWA).
 * Strict professional implementation without emojis.
 */

self.addEventListener('push', (event) => {
  let data = {
    title: 'PRIME OS',
    body: 'Notificacion del sistema PRIME OS.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'prime-notification',
    url: '/'
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch (err) {
    try {
      if (event.data) {
        data.body = event.data.text();
      }
    } catch (_) {}
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/icon-192.png',
    tag: data.tag || 'prime-notification-' + Date.now(),
    renotify: true,
    vibrate: [200, 100, 200, 100, 300],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    },
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if (targetUrl && targetUrl !== '/') {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
