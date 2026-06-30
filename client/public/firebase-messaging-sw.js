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

function pushClickAbsoluteUrl(urlToOpen) {
  if (!urlToOpen || urlToOpen === '/') return self.location.origin + '/';
  if (/^https?:\/\//i.test(urlToOpen)) return urlToOpen;
  return self.location.origin + (urlToOpen.startsWith('/') ? urlToOpen : '/' + urlToOpen);
}

async function openPushClickUrl(urlToOpen) {
  const url = pushClickAbsoluteUrl(urlToOpen);
  const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of windowClients) {
    if (!client.url.startsWith(self.location.origin)) continue;
    if ('focus' in client) await client.focus();
    if ('navigate' in client) {
      try {
        await client.navigate(url);
        return;
      } catch (e) {
        console.warn('[firebase-messaging-sw] navigate falhou, tentando openWindow:', e);
      }
    }
  }
  if (clients.openWindow) await clients.openWindow(url);
}

// Só trata mensagens data-only (sem campo notification).
// Mensagens com notification são exibidas automaticamente pelo browser via webpush.
messaging.onBackgroundMessage((payload) => {
  if (payload.notification) return;

  const title = payload.data?.title || 'Clube do Grito';
  const body = payload.data?.body || '';
  const url = payload.data?.url;
  const absoluteUrl = url ? pushClickAbsoluteUrl(url) : undefined;

  return self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    data: absoluteUrl ? { url: absoluteUrl } : {},
    vibrate: [200, 100, 200],
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(openPushClickUrl(urlToOpen));
});

console.log('[firebase-messaging-sw.js] Service Worker carregado');
