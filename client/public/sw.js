/**
 * PRIME OS - Service Worker
 * Proporciona soporte offline para la PWA, gestión de notificaciones locales y Web Push.
 */

const CACHE_NAME = 'prime-os-shell-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png'
];

// Instalación: Precarga el shell básico
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Advertencia al cachear assets iniciales en SW:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activación: Limpieza de cachés viejas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia de Fetch: Network-Only para /api/, Stale-While-Revalidate para estáticos
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Ignorar llamadas al API o métodos no-GET
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Si no hay red y se pedía navegación HTML, devolver la página principal de caché
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Recepción de mensajes desde el cliente React
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, {
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [250, 100, 250, 100, 400],
      ...options
    });
  }
});

// Gestión de Notificaciones Web Push en segundo plano
self.addEventListener('push', (event) => {
  let data = {
    title: '⚡ PRIME OS',
    body: 'Recordatorio activo para tu día Prime.',
    url: '/'
  };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [300, 150, 300, 150, 500],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Abrir App' },
      { action: 'dismiss', title: 'Entendido' }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Clic en la notificación: abre o enfoca la ventana de la PWA
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si la ventana ya está abierta, enfocarla
      for (let client of windowClients) {
        if ('focus' in client) {
          if (client.url.includes(self.location.origin)) {
            return client.focus();
          }
        }
      }
      // Si no, abrir una nueva ventana
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
