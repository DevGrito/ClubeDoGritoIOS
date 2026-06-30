// Firebase Messaging Service Worker
// Este arquivo é necessário para receber notificações quando o app está em background

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDKdcqxJj1qoSFpY1bLT2JloeJDfxDG_x8",
  authDomain: "clube-do-grito.firebaseapp.com",
  projectId: "clube-do-grito",
  storageBucket: "clube-do-grito.firebasestorage.app",
  messagingSenderId: "579937692596",
  appId: "1:579937692596:web:9c2dd3f21e94d3230ca0e1"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  if (payload.notification) return;

  const title = payload.data?.title || 'Clube do Grito';
  const url   = payload.data?.url;

  return self.registration.showNotification(title, {
    body:    payload.data?.body || '',
    icon:    '/icons/icon-192.png',
    badge:   '/icons/badge-96.png',
    data:    url ? { url } : {},
    vibrate: [200, 100, 200],
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (urlToOpen !== '/') client.navigate(urlToOpen);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});

console.log('[firebase-messaging-sw.js] Service Worker carregado');
