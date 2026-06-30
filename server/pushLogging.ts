import type { Pool } from "pg";

export type PushLogOrigin = "cron" | "manual" | "evento" | "teste" | "broadcast" | "skipped";
export type PushLogStatus = "success" | "error" | "skipped";

export type PushLogEntry = {
  ruleId?: number | null;
  gatilho: string;
  destinatarioKey?: string | null;
  destinatarioRole?: string | null;
  status: PushLogStatus;
  erro?: string | null;
  tituloRenderizado?: string | null;
  mensagemRenderizado?: string | null;
  payload?: Record<string, unknown> | string | null;
  origem: PushLogOrigin;
  canal?: string;
  disparadoPorUserId?: number | null;
  skippedReason?: string | null;
};

function serializePayload(payload: PushLogEntry["payload"]): string | null {
  if (payload == null) return null;
  if (typeof payload === "string") return payload;
  try {
    return JSON.stringify(payload);
  } catch {
    return null;
  }
}

/** Insere uma linha em push_logs (colunas novas são opcionais no SQL para compatibilidade). */
export async function insertPushLog(pool: Pool, entry: PushLogEntry): Promise<void> {
  const payloadStr = serializePayload(entry.payload);
  await pool.query(
    `INSERT INTO push_logs (
       rule_id, gatilho, destinatario_key, destinatario_role, status, erro,
       titulo_renderizado, mensagem_renderizado, payload,
       origem, canal, disparado_por_user_id, skipped_reason
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [
      entry.ruleId ?? null,
      entry.gatilho,
      entry.destinatarioKey ?? null,
      entry.destinatarioRole ?? null,
      entry.status,
      entry.erro ?? null,
      entry.tituloRenderizado ?? null,
      entry.mensagemRenderizado ?? null,
      payloadStr,
      entry.origem,
      entry.canal ?? "push",
      entry.disparadoPorUserId ?? null,
      entry.skippedReason ?? null,
    ]
  );
}

export async function logPushSkipped(
  pool: Pool,
  params: {
    gatilho: string;
    ruleId?: number | null;
    reason: string;
    origem: PushLogOrigin;
    payload?: Record<string, unknown>;
    disparadoPorUserId?: number | null;
  }
): Promise<void> {
  await insertPushLog(pool, {
    ruleId: params.ruleId,
    gatilho: params.gatilho,
    status: "skipped",
    origem: params.origem,
    skippedReason: params.reason,
    payload: params.payload ?? null,
    disparadoPorUserId: params.disparadoPorUserId ?? null,
  });
}

export type FcmTokenRow = {
  token: string;
  nome: string | null;
  user_key: string;
  user_type: string;
};

export async function logFcmPerTokenResults(
  pool: Pool,
  params: {
    rows: Array<FcmTokenRow & { success: boolean; error?: string | null }>;
    ruleId?: number | null;
    gatilho: string;
    origem: PushLogOrigin;
    titulo: string;
    mensagem: string;
    payload?: Record<string, unknown>;
    disparadoPorUserId?: number | null;
  }
): Promise<void> {
  for (const row of params.rows) {
    await insertPushLog(pool, {
      ruleId: params.ruleId,
      gatilho: params.gatilho,
      destinatarioKey: row.user_key,
      destinatarioRole: row.user_type,
      status: row.success ? "success" : "error",
      erro: row.error ?? null,
      tituloRenderizado: params.titulo,
      mensagemRenderizado: params.mensagem,
      payload: params.payload ?? null,
      origem: params.origem,
      disparadoPorUserId: params.disparadoPorUserId ?? null,
    });
  }
}
