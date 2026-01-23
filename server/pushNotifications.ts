import admin from "firebase-admin";
import { db } from "./db";
import { deviceTokens, pushNotifications, users } from "@shared/schema";
import { eq, sql, and, inArray, isNull, ne } from "drizzle-orm";

// Inicializar Firebase Admin SDK
let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized) return;
  
  try {
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountStr) {
      console.warn("⚠️ [PUSH] FIREBASE_SERVICE_ACCOUNT não configurada");
      return;
    }
    
    const serviceAccount = JSON.parse(serviceAccountStr);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    firebaseInitialized = true;
    console.log("✅ [PUSH] Firebase Admin SDK inicializado");
  } catch (error) {
    console.error("❌ [PUSH] Erro ao inicializar Firebase:", error);
  }
}

// Inicializar ao importar o módulo
initializeFirebase();

// Interface para dados de notificação
interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

// Registrar token de dispositivo
export async function registerDeviceToken(
  userId: number | null,
  token: string,
  platform: "web" | "android" | "ios"
): Promise<boolean> {
  try {
    // Verificar se o token já existe
    const existing = await db
      .select()
      .from(deviceTokens)
      .where(eq(deviceTokens.token, token))
      .limit(1);
    
    if (existing.length > 0) {
      // Atualizar token existente
      await db
        .update(deviceTokens)
        .set({
          userId,
          platform,
          subscriptionStatus: "active",
          lastSeenAt: new Date(),
          revokedAt: null,
        })
        .where(eq(deviceTokens.token, token));
      
      console.log(`✅ [PUSH] Token atualizado para usuário ${userId}`);
    } else {
      // Inserir novo token
      await db.insert(deviceTokens).values({
        userId,
        token,
        platform,
        subscriptionStatus: "active",
      });
      
      console.log(`✅ [PUSH] Novo token registrado para usuário ${userId}`);
    }
    
    return true;
  } catch (error) {
    console.error("❌ [PUSH] Erro ao registrar token:", error);
    return false;
  }
}

// Revogar/remover token de dispositivo
export async function revokeDeviceToken(token: string): Promise<boolean> {
  try {
    await db
      .update(deviceTokens)
      .set({
        subscriptionStatus: "revoked",
        revokedAt: new Date(),
      })
      .where(eq(deviceTokens.token, token));
    
    console.log("✅ [PUSH] Token revogado");
    return true;
  } catch (error) {
    console.error("❌ [PUSH] Erro ao revogar token:", error);
    return false;
  }
}

// Enviar notificação para um usuário específico
export async function sendPushToUser(
  userId: number,
  notification: NotificationPayload,
  sentBy?: number
): Promise<{ success: number; failure: number }> {
  if (!firebaseInitialized) {
    console.warn("⚠️ [PUSH] Firebase não inicializado");
    return { success: 0, failure: 0 };
  }
  
  try {
    // Buscar tokens ativos do usuário
    const tokens = await db
      .select()
      .from(deviceTokens)
      .where(
        and(
          eq(deviceTokens.userId, userId),
          eq(deviceTokens.subscriptionStatus, "active")
        )
      );
    
    if (tokens.length === 0) {
      console.log(`⚠️ [PUSH] Nenhum token ativo para usuário ${userId}`);
      return { success: 0, failure: 0 };
    }
    
    const results = await sendToTokens(
      tokens.map(t => t.token),
      notification
    );
    
    // Registrar notificação enviada
    await db.insert(pushNotifications).values({
      title: notification.title,
      body: notification.body,
      data: notification.data,
      targetType: "user",
      targetValue: userId.toString(),
      sentBy,
      successCount: results.success,
      failureCount: results.failure,
    });
    
    return results;
  } catch (error) {
    console.error("❌ [PUSH] Erro ao enviar para usuário:", error);
    return { success: 0, failure: 0 };
  }
}

// Enviar notificação para múltiplos usuários
export async function sendPushToUsers(
  userIds: number[],
  notification: NotificationPayload,
  sentBy?: number
): Promise<{ success: number; failure: number }> {
  if (!firebaseInitialized) {
    console.warn("⚠️ [PUSH] Firebase não inicializado");
    return { success: 0, failure: 0 };
  }
  
  try {
    // Buscar tokens ativos dos usuários
    const tokens = await db
      .select()
      .from(deviceTokens)
      .where(
        and(
          inArray(deviceTokens.userId, userIds),
          eq(deviceTokens.subscriptionStatus, "active")
        )
      );
    
    if (tokens.length === 0) {
      console.log("⚠️ [PUSH] Nenhum token ativo para os usuários");
      return { success: 0, failure: 0 };
    }
    
    const results = await sendToTokens(
      tokens.map(t => t.token),
      notification
    );
    
    // Registrar notificação enviada
    await db.insert(pushNotifications).values({
      title: notification.title,
      body: notification.body,
      data: notification.data,
      targetType: "users",
      targetValue: userIds.join(","),
      sentBy,
      successCount: results.success,
      failureCount: results.failure,
    });
    
    return results;
  } catch (error) {
    console.error("❌ [PUSH] Erro ao enviar para usuários:", error);
    return { success: 0, failure: 0 };
  }
}

// Enviar notificação para todos os usuários com assinatura ativa (doadores)
export async function sendPushToAllDonors(
  notification: NotificationPayload,
  sentBy?: number
): Promise<{ success: number; failure: number }> {
  if (!firebaseInitialized) {
    console.warn("⚠️ [PUSH] Firebase não inicializado");
    return { success: 0, failure: 0 };
  }
  
  try {
    // Buscar usuários com assinatura ativa
    const activeDonors = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.subscriptionStatus, "active"));
    
    if (activeDonors.length === 0) {
      console.log("⚠️ [PUSH] Nenhum doador ativo encontrado");
      return { success: 0, failure: 0 };
    }
    
    const donorIds = activeDonors.map(d => d.id);
    
    // Buscar tokens dos doadores
    const tokens = await db
      .select()
      .from(deviceTokens)
      .where(
        and(
          inArray(deviceTokens.userId, donorIds),
          eq(deviceTokens.subscriptionStatus, "active")
        )
      );
    
    if (tokens.length === 0) {
      console.log("⚠️ [PUSH] Nenhum token ativo para doadores");
      return { success: 0, failure: 0 };
    }
    
    const results = await sendToTokens(
      tokens.map(t => t.token),
      notification
    );
    
    // Registrar notificação enviada
    await db.insert(pushNotifications).values({
      title: notification.title,
      body: notification.body,
      data: notification.data,
      targetType: "all",
      targetValue: "donors",
      sentBy,
      successCount: results.success,
      failureCount: results.failure,
    });
    
    console.log(`✅ [PUSH] Enviado para ${results.success} doadores, ${results.failure} falhas`);
    return results;
  } catch (error) {
    console.error("❌ [PUSH] Erro ao enviar para doadores:", error);
    return { success: 0, failure: 0 };
  }
}

// Enviar para lista de tokens (função interna)
async function sendToTokens(
  tokens: string[],
  notification: NotificationPayload
): Promise<{ success: number; failure: number }> {
  if (tokens.length === 0) {
    return { success: 0, failure: 0 };
  }
  
  let successCount = 0;
  let failureCount = 0;
  
  // FCM tem limite de 500 tokens por chamada
  const batchSize = 500;
  
  for (let i = 0; i < tokens.length; i += batchSize) {
    const batch = tokens.slice(i, i + batchSize);
    
    const message: admin.messaging.MulticastMessage = {
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl,
      },
      data: notification.data,
      tokens: batch,
      android: {
        priority: "high",
        notification: {
          channelId: "clube_do_grito_default",
          priority: "high",
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      webpush: {
        notification: {
          icon: "/icon-192.png",
          badge: "/icon-72.png",
        },
        fcmOptions: {
          link: notification.data?.url || "/",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };
    
    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      
      successCount += response.successCount;
      failureCount += response.failureCount;
      
      // Processar respostas para identificar tokens inválidos
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error) {
          const errorCode = resp.error.code;
          // Tokens inválidos ou expirados
          if (
            errorCode === "messaging/invalid-registration-token" ||
            errorCode === "messaging/registration-token-not-registered"
          ) {
            // Revogar token inválido
            revokeDeviceToken(batch[idx]).catch(console.error);
          }
        }
      });
    } catch (error) {
      console.error("❌ [PUSH] Erro ao enviar batch:", error);
      failureCount += batch.length;
    }
  }
  
  return { success: successCount, failure: failureCount };
}

// Obter estatísticas de notificações
export async function getPushStats(): Promise<{
  totalTokens: number;
  activeTokens: number;
  notificationsSent: number;
}> {
  try {
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deviceTokens);
    
    const [activeResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deviceTokens)
      .where(eq(deviceTokens.subscriptionStatus, "active"));
    
    const [notifResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pushNotifications);
    
    return {
      totalTokens: Number(totalResult?.count || 0),
      activeTokens: Number(activeResult?.count || 0),
      notificationsSent: Number(notifResult?.count || 0),
    };
  } catch (error) {
    console.error("❌ [PUSH] Erro ao obter estatísticas:", error);
    return { totalTokens: 0, activeTokens: 0, notificationsSent: 0 };
  }
}
