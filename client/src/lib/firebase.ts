import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, deleteToken, onMessage, isSupported, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDKdcqxJj1qoSFpY1bLT2JloeJDfxDG_x8",
  authDomain: "clube-do-grito.firebaseapp.com",
  projectId: "clube-do-grito",
  storageBucket: "clube-do-grito.firebasestorage.app",
  messagingSenderId: "579937692596",
  appId: "1:579937692596:web:9c2dd3f21e94d3230ca0e1"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let messaging: Messaging | null = null;

const TOKEN_CACHE_KEY = 'fcm_token_v1';

// Lazy async initializer: garante que getMessaging() só é chamado
// DEPOIS que isSupported() resolver, evitando rejeições internas não tratadas.
let messagingInitPromise: Promise<Messaging | null> | null = null;

export function resolveMessaging(): Promise<Messaging | null> {
  if (messagingInitPromise) return messagingInitPromise;
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }
  messagingInitPromise = isSupported()
    .then(supported => {
      if (!supported) return null;
      try {
        if (!messaging) messaging = getMessaging(app);
        return messaging;
      } catch {
        return null;
      }
    })
    .catch(() => null);
  return messagingInitPromise;
}

// Getter síncrono para uso após resolveMessaging() ter sido aguardado
export function getFirebaseMessaging(): Messaging | null {
  return messaging;
}

async function waitForFcmSwRegistration(reg: ServiceWorkerRegistration, timeoutMs = 12_000): Promise<ServiceWorkerRegistration> {
  if (reg.active) return reg;

  const activating = reg.installing || reg.waiting;
  if (activating) {
    await Promise.race([
      new Promise<void>((resolve) => {
        const onStateChange = () => {
          if (reg.active || activating.state === 'activated' || activating.state === 'redundant') {
            activating.removeEventListener('statechange', onStateChange);
            resolve();
          }
        };
        activating.addEventListener('statechange', onStateChange);
        onStateChange();
      }),
      delay(timeoutMs),
    ]);
  }

  if (reg.active) return reg;
  return navigator.serviceWorker.ready;
}

async function getSwRegistration(): Promise<ServiceWorkerRegistration> {
  const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
  return waitForFcmSwRegistration(reg);
}

async function tryGetToken(msg: Messaging, vapidKey: string): Promise<string | null> {
  const reg = await getSwRegistration();
  const token = await getToken(msg, { vapidKey, serviceWorkerRegistration: reg });
  return token || null;
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fullCleanAndRetry(msg: Messaging, vapidKey: string): Promise<string | null> {
  // 1. Remove token Firebase do SDK
  await deleteToken(msg).catch(() => {});

  // 2. Cancela assinatura push e desregistra firebase-messaging-sw.js
  const regs = await navigator.serviceWorker.getRegistrations();
  for (const reg of regs) {
    const isFcmSw = reg.active?.scriptURL?.includes('firebase-messaging-sw.js')
      || reg.installing?.scriptURL?.includes('firebase-messaging-sw.js')
      || reg.waiting?.scriptURL?.includes('firebase-messaging-sw.js');
    if (isFcmSw) {
      const sub = await reg.pushManager.getSubscription().catch(() => null);
      if (sub) await sub.unsubscribe().catch(() => {});
      await reg.unregister().catch(() => {});
    }
  }

  // 3. Limpa cache local
  localStorage.removeItem(TOKEN_CACHE_KEY);

  // 4. Aguarda o navegador processar
  await delay(800);

  // 5. Re-registra firebase-messaging-sw.js e obtém token novo
  const token = await tryGetToken(msg, vapidKey);
  return token;
}

export async function requestPushPermissionAndGetToken(forceRefresh = false): Promise<string | null> {
  const msg = await resolveMessaging();
  if (!msg) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.error('[Firebase] VITE_FIREBASE_VAPID_KEY não definida');
    return null;
  }

  if (forceRefresh) {
    try {
      const token = await fullCleanAndRetry(msg, vapidKey);
      if (token) console.log('[Firebase] Token renovado (forceRefresh):', token.slice(0, 20) + '...');
      else console.warn('[Firebase] Não foi possível renovar token.');
      return token;
    } catch (err: any) {
      console.error('[Firebase] Erro ao renovar token:', err?.name, err?.message);
      return null;
    }
  }

  try {
    const token = await tryGetToken(msg, vapidKey);
    if (token) console.log('[Firebase] Token obtido:', token.slice(0, 20) + '...');
    return token;
  } catch (err: any) {
    const isSecurityError = err instanceof DOMException && err.name === 'SecurityError';

    if (isSecurityError && !window.isSecureContext) {
      console.warn('[Firebase] Contexto não seguro — push não disponível neste ambiente.');
      return null;
    }

    console.warn('[Firebase] Erro ao obter token (', err?.name, err?.message, ') — tentando reset...');
    try {
      const token = await fullCleanAndRetry(msg, vapidKey);
      if (token) console.log('[Firebase] Token obtido após reset:', token.slice(0, 20) + '...');
      return token;
    } catch (retryErr: any) {
      console.error('[Firebase] Erro final:', retryErr?.name, retryErr?.message);
      return null;
    }
  }
}

export function clearPushTokenCache() {
  localStorage.removeItem(TOKEN_CACHE_KEY);
}

/** Extrai endpoint e chaves da assinatura Web Push (para auditoria no backend). */
export async function getWebPushSubscriptionKeys(): Promise<{
  pushEndpoint: string | null;
  pushP256dh: string | null;
  pushAuth: string | null;
}> {
  if (!("serviceWorker" in navigator)) {
    return { pushEndpoint: null, pushP256dh: null, pushAuth: null };
  }
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    const fcmReg = regs.find((r) =>
      r.active?.scriptURL?.includes("firebase-messaging-sw.js")
    );
    const reg = fcmReg ?? (await navigator.serviceWorker.ready);
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return { pushEndpoint: null, pushP256dh: null, pushAuth: null };

    const json = sub.toJSON();
    const pushEndpoint = json.endpoint || sub.endpoint || null;
    const pushP256dh = json.keys?.p256dh ?? null;
    const pushAuth = json.keys?.auth ?? null;
    return { pushEndpoint, pushP256dh, pushAuth };
  } catch {
    return { pushEndpoint: null, pushP256dh: null, pushAuth: null };
  }
}

export async function fullResetPushSubscription(): Promise<void> {
  localStorage.removeItem(TOKEN_CACHE_KEY);
  const msg = await resolveMessaging();
  if (msg) await deleteToken(msg).catch(() => {});
  const regs = await navigator.serviceWorker.getRegistrations().catch(() => [] as ServiceWorkerRegistration[]);
  for (const reg of regs) {
    const sub = await reg.pushManager.getSubscription().catch(() => null);
    if (sub) await sub.unsubscribe().catch(() => {});
    const isFcmSw = reg.active?.scriptURL?.includes('firebase-messaging-sw.js')
      || reg.installing?.scriptURL?.includes('firebase-messaging-sw.js')
      || reg.waiting?.scriptURL?.includes('firebase-messaging-sw.js');
    if (isFcmSw) await reg.unregister().catch(() => {});
  }
}

export { onMessage, getFirebaseMessaging as messaging };
export default app;
