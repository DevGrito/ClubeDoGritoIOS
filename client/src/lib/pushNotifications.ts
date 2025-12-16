import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported, Messaging } from "firebase/messaging";
import { firebaseConfig, VAPID_KEY } from "./firebase-config";

let messaging: Messaging | null = null;

// Inicializar Firebase apenas se ainda não foi inicializado
function initializeFirebase() {
  if (getApps().length === 0) {
    initializeApp(firebaseConfig);
  }
}

// Verificar se o navegador suporta notificações
export function isNotificationsSupported(): boolean {
  return "Notification" in window && "serviceWorker" in navigator;
}

// Verificar status da permissão
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationsSupported()) {
    return "unsupported";
  }
  return Notification.permission;
}

// Solicitar permissão de notificações
export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isNotificationsSupported()) {
    console.warn("[PUSH] Notificações não suportadas neste navegador");
    return "unsupported";
  }

  try {
    const permission = await Notification.requestPermission();
    console.log(`[PUSH] Permissão de notificação: ${permission}`);
    return permission;
  } catch (error) {
    console.error("[PUSH] Erro ao solicitar permissão:", error);
    return Notification.permission;
  }
}

// Registrar service worker e obter token FCM
export async function registerForPushNotifications(userId?: number): Promise<string | null> {
  console.log("[PUSH] 🚀 Iniciando registro de notificações push...");
  console.log("[PUSH] UserId:", userId);
  
  if (!isNotificationsSupported()) {
    console.warn("[PUSH] ❌ Notificações não suportadas");
    return null;
  }

  // Verificar permissão
  console.log("[PUSH] Permissão atual:", Notification.permission);
  if (Notification.permission !== "granted") {
    console.log("[PUSH] Solicitando permissão...");
    const permission = await requestNotificationPermission();
    console.log("[PUSH] Permissão após solicitação:", permission);
    if (permission !== "granted") {
      console.warn("[PUSH] ❌ Permissão negada pelo usuário");
      return null;
    }
  }

  try {
    // Verificar suporte ao Firebase Messaging
    console.log("[PUSH] Verificando suporte Firebase Messaging...");
    const supported = await isSupported();
    console.log("[PUSH] Firebase suportado:", supported);
    if (!supported) {
      console.warn("[PUSH] ❌ Firebase Messaging não suportado neste navegador");
      return null;
    }

    // Inicializar Firebase
    console.log("[PUSH] Inicializando Firebase...");
    initializeFirebase();

    // Registrar service worker do Firebase
    console.log("[PUSH] Registrando service worker...");
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    console.log("[PUSH] ✅ Service Worker registrado:", registration.scope);

    // Obter instância do messaging
    console.log("[PUSH] Obtendo instância do messaging...");
    messaging = getMessaging();

    // Obter token FCM
    console.log("[PUSH] Obtendo token FCM com VAPID...");
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log("[PUSH] ✅ Token FCM obtido:", token.substring(0, 20) + "...");
      
      // Enviar token para o backend
      console.log("[PUSH] Enviando token para o servidor...");
      const serverResult = await registerTokenOnServer(token, userId);
      console.log("[PUSH] Resultado do registro no servidor:", serverResult);
      
      return token;
    } else {
      console.warn("[PUSH] ❌ Não foi possível obter token FCM");
      return null;
    }
  } catch (error) {
    console.error("[PUSH] ❌ Erro ao registrar para notificações:", error);
    return null;
  }
}

// Registrar token no servidor
async function registerTokenOnServer(token: string, userId?: number): Promise<boolean> {
  try {
    // Detectar plataforma
    const platform = detectPlatform();
    
    const response = await fetch("/api/push/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        platform,
        userId: userId || null,
      }),
    });

    if (response.ok) {
      console.log("[PUSH] Token registrado no servidor");
      return true;
    } else {
      console.error("[PUSH] Erro ao registrar token no servidor:", await response.text());
      return false;
    }
  } catch (error) {
    console.error("[PUSH] Erro ao enviar token para servidor:", error);
    return false;
  }
}

// Remover registro de token do servidor
export async function unregisterFromPushNotifications(): Promise<boolean> {
  const storedToken = localStorage.getItem("fcm_token");
  
  if (!storedToken) {
    console.log("[PUSH] Nenhum token para remover");
    return true;
  }

  try {
    const response = await fetch("/api/push/unregister", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: storedToken }),
    });

    if (response.ok) {
      localStorage.removeItem("fcm_token");
      console.log("[PUSH] Token removido com sucesso");
      return true;
    } else {
      console.error("[PUSH] Erro ao remover token:", await response.text());
      return false;
    }
  } catch (error) {
    console.error("[PUSH] Erro ao remover token:", error);
    return false;
  }
}

// Detectar plataforma (exportado para uso em verify.tsx)
export function detectPlatform(): "web" | "android" | "ios" {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Verificar se está em um WebView do Capacitor/Cordova
  if ((window as any).Capacitor) {
    const platform = (window as any).Capacitor.getPlatform();
    if (platform === "android") return "android";
    if (platform === "ios") return "ios";
  }
  
  // Verificar por user agent
  if (/android/i.test(userAgent)) {
    return "android";
  }
  
  if (/iphone|ipad|ipod/i.test(userAgent)) {
    return "ios";
  }
  
  return "web";
}

// Configurar listener para mensagens em foreground
export function setupForegroundMessageListener(
  callback: (payload: { title: string; body: string; data?: Record<string, string> }) => void
): (() => void) | null {
  if (!messaging) {
    console.warn("[PUSH] Messaging não inicializado");
    return null;
  }

  const unsubscribe = onMessage(messaging, (payload) => {
    console.log("[PUSH] Mensagem recebida em foreground:", payload);
    
    callback({
      title: payload.notification?.title || "Clube do Grito",
      body: payload.notification?.body || "",
      data: payload.data as Record<string, string>,
    });
  });

  return unsubscribe;
}

// Salvar token no localStorage
export function saveTokenLocally(token: string): void {
  localStorage.setItem("fcm_token", token);
}

// Obter token salvo localmente
export function getStoredToken(): string | null {
  return localStorage.getItem("fcm_token");
}
