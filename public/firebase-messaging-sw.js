// Firebase Messaging Service Worker
// Este arquivo é necessário para receber notificações quando o app está em background

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuração do Firebase (mesma do app)
firebase.initializeApp({
  apiKey: "AIzaSyDKdcqxJj1qoSFpY1bLT2JloeJDfxDG_x8",
  authDomain: "clube-do-grito.firebaseapp.com",
  projectId: "clube-do-grito",
  storageBucket: "clube-do-grito.firebasestorage.app",
  messagingSenderId: "579937692596",
  appId: "1:579937692596:web:9c2dd3f21e94d3230ca0e1"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'Clube do Grito';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    tag: payload.data?.tag || 'default',
    data: payload.data,
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Fechar' }
    ],
    vibrate: [200, 100, 200]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received:', event);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  // Get the URL to open from notification data
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window/tab open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (urlToOpen !== '/') {
            client.navigate(urlToOpen);
          }
          return;
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

console.log('[firebase-messaging-sw.js] Service Worker carregado');
