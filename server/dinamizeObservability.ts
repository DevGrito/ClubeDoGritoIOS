import type { Pool } from "pg";
import { isDinamizeLgpdPayloadEnabled } from "./services/dinamizeConsentPayload";

export interface DinamizeIntegrationStatus {
  webhookConfigured: boolean;
  lgpdPayloadEnabled: boolean;
}

export interface DinamizeSyncLogEntry {
  syncIntent?: string | null;
  eventType: "doador" | "premio";
  entityId?: number | null;
  userId?: number | null;
  success: boolean;
  httpStatus?: number | null;
  errorMessage?: string | null;
  responsePreview?: string | null;
  optinMarketing?: boolean | null;
  optinCommunications?: boolean | null;
}

export type DinamizeSyncAlertDetails = {
  errorMessage: string;
  syncIntent?: string | null;
  eventType: "doador" | "premio";
  entityId?: number | null;
  alertSource: string;
  httpStatus?: number | null;
};

type DinamizeSyncAlertFn = (details: DinamizeSyncAlertDetails) => void;

let syncAlertFn: DinamizeSyncAlertFn | null = null;

export function setDinamizeSyncAlertHandler(fn: DinamizeSyncAlertFn | null): void {
  syncAlertFn = fn;
}

export function emitDinamizeSyncFailureAlert(details: DinamizeSyncAlertDetails): void {
  try {
    syncAlertFn?.(details);
  } catch {
    /* alertas não devem quebrar o fluxo principal */
  }
}

export function getDinamizeIntegrationStatus(): DinamizeIntegrationStatus {
  return {
    webhookConfigured: Boolean(process.env.DINAMIZE_WEBHOOK_URL?.trim()),
    lgpdPayloadEnabled: isDinamizeLgpdPayloadEnabled(),
  };
}

export async function ensureDinamizeSyncLogTable(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dinamize_sync_log (
      id SERIAL PRIMARY KEY,
      sync_intent VARCHAR(50),
      event_type VARCHAR(20) NOT NULL DEFAULT 'doador',
      entity_id INTEGER,
      user_id INTEGER,
      success BOOLEAN NOT NULL DEFAULT false,
      http_status INTEGER,
      error_message TEXT,
      response_preview VARCHAR(500),
      optin_marketing BOOLEAN,
      optin_communications BOOLEAN,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_dinamize_sync_log_created_at
      ON dinamize_sync_log (created_at DESC)
  `);
}

function truncate(text: string | null | undefined, max: number): string | null {
  if (!text) return null;
  const t = text.trim();
  if (!t) return null;
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

export async function recordDinamizeSync(pool: Pool, entry: DinamizeSyncLogEntry): Promise<void> {
  try {
    await ensureDinamizeSyncLogTable(pool);
    await pool.query(
      `INSERT INTO dinamize_sync_log (
        sync_intent, event_type, entity_id, user_id, success,
        http_status, error_message, response_preview,
        optin_marketing, optin_communications
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        entry.syncIntent ?? null,
        entry.eventType,
        entry.entityId ?? null,
        entry.userId ?? null,
        entry.success,
        entry.httpStatus ?? null,
        truncate(entry.errorMessage, 1000),
        truncate(entry.responsePreview, 500),
        entry.optinMarketing ?? null,
        entry.optinCommunications ?? null,
      ]
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[DINAMIZE] Falha ao registrar histórico de sync:", message);
  }
}
