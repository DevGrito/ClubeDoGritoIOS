import { pool } from "../db";
import { db } from "../db";
import { doadores, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  derivePrivacyFlagsFromLegacyRows,
  type PrivacyConsentFlags,
} from "../privacyConsentMappings";
import { getLatestPrivacyConsentRecord } from "../privacyConsentUser";
import {
  buildLgpdDinamizePayloadFields,
  DEFAULT_DENY_CONSENT_SNAPSHOT,
  logDinamizeConsentLine,
  type DinamizeConsentSnapshot,
  type DinamizeSyncIntent,
} from "./dinamizeConsentPayload";

export type { DinamizeConsentSnapshot, DinamizeSyncIntent } from "./dinamizeConsentPayload";
export {
  buildLgpdDinamizePayloadFields,
  DEFAULT_DENY_CONSENT_SNAPSHOT,
  isDinamizeLgpdPayloadEnabled,
  logDinamizeConsentLine,
} from "./dinamizeConsentPayload";

function flagsToSnapshot(
  flags: PrivacyConsentFlags,
  meta: { consentKnown: boolean; consentVersion: string; consentUpdatedAt: string | null; consentSource: string }
): DinamizeConsentSnapshot {
  return {
    marketing: !!flags.marketing,
    communications: !!flags.communications,
    consentKnown: meta.consentKnown,
    consentVersion: meta.consentVersion,
    consentUpdatedAt: meta.consentUpdatedAt,
    consentSource: meta.consentSource,
  };
}

/** Consentimento mais recente: privacy_consents → user_consents → default deny. */
export async function getDinamizeConsentSnapshot(userId: number): Promise<DinamizeConsentSnapshot> {
  const record = await getLatestPrivacyConsentRecord(userId);
  if (record) {
    return flagsToSnapshot(record.flags, {
      consentKnown: true,
      consentVersion: record.consentVersion,
      consentUpdatedAt: record.updatedAt,
      consentSource: record.source,
    });
  }

  const legacy = await pool.query<{ consent_type: string; granted: boolean }>(
    `SELECT consent_type, granted FROM user_consents WHERE user_id = $1`,
    [userId]
  );
  if (legacy.rows.length > 0) {
    const flags = derivePrivacyFlagsFromLegacyRows(legacy.rows);
    const latestLegacy = await pool.query<{ updated_at: Date; version: string }>(
      `SELECT updated_at, version FROM user_consents WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [userId]
    );
    const row = latestLegacy.rows[0];
    return flagsToSnapshot(flags, {
      consentKnown: true,
      consentVersion: row?.version || "1.0",
      consentUpdatedAt: row?.updated_at ? new Date(row.updated_at).toISOString() : null,
      consentSource: "user_consents",
    });
  }

  return { ...DEFAULT_DENY_CONSENT_SNAPSHOT };
}

export async function resolveUserIdForDoador(doadorId: number): Promise<number | null> {
  const row = await db
    .select({ userId: doadores.userId })
    .from(doadores)
    .where(eq(doadores.id, doadorId))
    .limit(1);
  const userId = row[0]?.userId;
  return typeof userId === "number" && userId > 0 ? userId : null;
}

/**
 * Re-sincroniza opt-in/opt-out na Dinamize após alteração de consentimento (fire-and-forget).
 * Só envia se existir registro de doador para o usuário.
 */
export async function syncDinamizeConsentByUserId(userId: number): Promise<void> {
  if (!process.env.DINAMIZE_WEBHOOK_URL) return;

  const rows = await db
    .select({
      id: doadores.id,
      plano: doadores.plano,
      valor: doadores.valor,
      status: doadores.status,
      dataDoacaoInicial: doadores.dataDoacaoInicial,
      stripeCustomerId: doadores.stripeCustomerId,
      email: users.email,
      nome: users.nome,
      telefone: users.telefone,
    })
    .from(doadores)
    .leftJoin(users, eq(doadores.userId, users.id))
    .where(eq(doadores.userId, userId))
    .limit(1);

  if (!rows.length) {
    console.log(`[DINAMIZE] consent_update ignorado — user ${userId} sem registro de doador`);
    return;
  }

  const { enviarDoadorParaDinamize } = await import("./dinamize");
  const row = rows[0];
  await enviarDoadorParaDinamize({
    id: row.id,
    userId,
    email: row.email ?? null,
    nome: row.nome ?? null,
    telefone: row.telefone ?? null,
    status: row.status ?? null,
    plano: row.plano,
    valor: row.valor,
    dataDoacaoInicial: row.dataDoacaoInicial ?? null,
    stripeCustomerId: row.stripeCustomerId ?? null,
    syncIntent: "consent_update",
  });
}
