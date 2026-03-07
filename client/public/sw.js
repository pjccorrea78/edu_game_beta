// EduGame Service Worker - Push Notifications
const CACHE_NAME = 'edugame-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: 'EduGame', body: event.data.text() };
  }

  const title = data.title || '🎓 EduGame';
  const options = {
    body: data.body || 'Você tem um novo desafio esperando por você!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'edugame-notification',
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: '🎮 Jogar Agora' },
      { action: 'close', title: 'Depois' },
    ],
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
