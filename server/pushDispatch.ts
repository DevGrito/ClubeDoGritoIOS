import type { Pool } from "pg";
import { getMessaging } from "firebase-admin/messaging";
import {
  getFirebaseAdminApp,
  maskFcmToken,
  type FcmSendSummary,
} from "./pushFcm";
import { buildFcmWebPushParts, toAbsolutePushUrl } from "./pushClickUrls";
import { logFcmPerTokenResults, type PushLogOrigin, type FcmTokenRow } from "./pushLogging";

const INVALID_FCM_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

export type FcmRecipientRow = FcmTokenRow;

export type DispatchFcmParams = {
  pool: Pool;
  rows: FcmRecipientRow[];
  payload: { title: string; body: string; url?: string };
  iconUrl: string;
  badgeUrl: string;
  gatilho: string;
  origem: PushLogOrigin;
  ruleId?: number | null;
  disparadoPorUserId?: number | null;
  rejectedPushTokens?: Set<string>;
  payloadMeta?: Record<string, unknown>;
};

/** Envia FCM para cada destinatário e grava uma linha em push_logs por token. */
export async function dispatchFcmToRecipients(params: DispatchFcmParams): Promise<FcmSendSummary> {
  const {
    pool,
    rows,
    payload,
    iconUrl,
    badgeUrl,
    gatilho,
    origem,
    ruleId,
    disparadoPorUserId,
    rejectedPushTokens,
    payloadMeta,
  } = params;

  if (rows.length === 0) {
    return { totalTokens: 0, enviados: 0, falhas: 0, tokensInvalidosRemovidos: 0 };
  }

  const adminApp = getFirebaseAdminApp();
  const messaging = getMessaging(adminApp);
  const clickUrl = toAbsolutePushUrl(payload.url);
  const parts = buildFcmWebPushParts({
    title: payload.title,
    body: payload.body,
    clickUrl,
    iconUrl,
    badgeUrl,
  });

  const messages = rows.map((r) => ({
    token: r.token,
    ...parts,
  }));

  const response = await messaging.sendEach(messages);
  const invalidTokens: string[] = [];
  const logRows: Array<FcmRecipientRow & { success: boolean; error?: string | null }> = [];

  response.responses.forEach((r, i) => {
    const row = rows[i];
    if (r.success) {
      logRows.push({ ...row, success: true });
      return;
    }
    const errCode = r.error?.code || "";
    const errMsg = r.error?.message || errCode || "FCM error";
    logRows.push({ ...row, success: false, error: errMsg });
    if (INVALID_FCM_CODES.has(errCode)) {
      invalidTokens.push(row.token);
    }
    console.warn(`[Push/FCM] Falha token ${maskFcmToken(row.token)} code=${errCode || "unknown"}`);
  });

  let tokensInvalidosRemovidos = 0;
  if (invalidTokens.length > 0) {
    await pool.query(
      "UPDATE fcm_tokens SET ativo = false, falhou_em = NOW(), updated_at = NOW() WHERE token = ANY($1)",
      [invalidTokens]
    );
    tokensInvalidosRemovidos = invalidTokens.length;
    invalidTokens.forEach((t) => rejectedPushTokens?.add(t));
  }

  await logFcmPerTokenResults(pool, {
    rows: logRows,
    ruleId: ruleId ?? null,
    gatilho,
    origem,
    titulo: payload.title,
    mensagem: payload.body,
    payload: payloadMeta ?? (payload.url ? { url: payload.url } : undefined),
    disparadoPorUserId: disparadoPorUserId ?? null,
  }).catch(() => {});

  const enviados = logRows.filter((r) => r.success).length;
  const falhas = logRows.length - enviados;

  return {
    totalTokens: rows.length,
    enviados,
    falhas,
    tokensInvalidosRemovidos,
  };
}
