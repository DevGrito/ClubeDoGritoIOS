/**
 * CRON catraca_offline: monitora cada unidade (Inclusão / PEC) separadamente.
 */
import type { Pool } from "pg";

export const CATRACA_OFFLINE_MENSAGEM =
  "A catraca {{nome_catraca}} está offline há {{tempo_offline}} (último registro: {{ultima}}).";

/** Sincroniza texto da regra no banco (idempotente — roda no startup). */
export async function ensureCatracaOfflinePushRule(pool: Pool): Promise<void> {
  const r = await pool.query<{ id: number }>(
    `UPDATE push_rules SET mensagem = $1
     WHERE gatilho = 'catraca_offline' AND mensagem IS DISTINCT FROM $1
     RETURNING id`,
    [CATRACA_OFFLINE_MENSAGEM]
  );
  if ((r.rowCount ?? 0) > 0) {
    console.log(
      `✅ [Push] Regra catraca_offline atualizada (ids: ${r.rows.map((x) => x.id).join(", ")})`
    );
  }
}

export const CATRACAS_MONITORADAS = [
  { id: "INSTITUTO_O_GRITO", nome: "Instituto O Grito (Inclusão)" },
  { id: "CASA_SONHAR", nome: "Casa Sonhar (PEC)" },
] as const;

export type CatracaMonitorada = (typeof CATRACAS_MONITORADAS)[number];

export function formatTempoOffline(ms: number): string {
  const minutosOffline = Math.max(1, Math.floor(ms / 60000));
  const horasOffline = Math.floor(ms / 3600000);
  if (horasOffline >= 48) {
    const dias = Math.floor(horasOffline / 24);
    return `${dias} dia${dias !== 1 ? "s" : ""}`;
  }
  if (horasOffline >= 1) {
    return `${horasOffline} hora${horasOffline !== 1 ? "s" : ""}`;
  }
  return `${minutosOffline} minuto${minutosOffline !== 1 ? "s" : ""}`;
}

/** Último webhook da catraca (Inclusão aceita unidade vazia legada). */
export async function fetchUltimoEventoCatraca(
  pool: Pool,
  unidadeId: string
): Promise<Date | null> {
  const { rows } = await pool.query<{ ultima_evento: string | Date | null }>(
    `SELECT MAX(created_at) AS ultima_evento
     FROM webhook_catraca_log
     WHERE CASE
       WHEN $1 = 'INSTITUTO_O_GRITO' THEN
         UPPER(TRIM(COALESCE(unidade, ''))) IN ('', 'INSTITUTO_O_GRITO')
       ELSE
         UPPER(TRIM(COALESCE(unidade, ''))) = $1
     END`,
    [unidadeId]
  );
  const ultima = rows[0]?.ultima_evento;
  if (!ultima) return null;
  const t = new Date(ultima).getTime();
  return t > 0 ? new Date(ultima) : null;
}

const COOLDOWN_MINUTOS = 4320; // alinhado à regra push #96

export async function runPushCatracaOfflineCron(
  pool: Pool,
  fire: (gatilho: string, vars: Record<string, string>) => Promise<void>,
  options?: { horasMinimasOffline?: number }
): Promise<number> {
  const horasMin = options?.horasMinimasOffline ?? 24;
  let disparos = 0;

  for (const catraca of CATRACAS_MONITORADAS) {
    const ultima = await fetchUltimoEventoCatraca(pool, catraca.id);
    if (!ultima) continue;

    const msOffline = Date.now() - ultima.getTime();
    const horasOffline = Math.floor(msOffline / 3600000);
    if (horasOffline < horasMin) continue;

    const dedupeKey = `catraca_offline:${catraca.id}`;
    const ja = await pool.query(
      `SELECT 1 FROM push_logs
       WHERE gatilho = 'catraca_offline' AND status = 'success'
         AND payload->>'dedupe_key' = $1
         AND disparado_em > NOW() - ($2::int * INTERVAL '1 minute')
       LIMIT 1`,
      [dedupeKey, COOLDOWN_MINUTOS]
    );
    if (ja.rows.length > 0) continue;

    const minutosOffline = Math.max(1, Math.floor(msOffline / 60000));
    const tempoOffline = formatTempoOffline(msOffline);

    console.log(
      `🔴 [PUSH-CRON] catraca_offline: ${catraca.nome} offline há ${tempoOffline}`
    );

    await fire("catraca_offline", {
      nome_catraca: catraca.nome,
      unidade_catraca_id: catraca.id,
      dedupe_key: dedupeKey,
      minutos: String(minutosOffline),
      horas: String(horasOffline),
      tempo_offline: tempoOffline,
      ultima: ultima.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    });
    disparos++;
  }

  if (disparos > 0) {
    console.log(`✅ [PUSH-CRON] catraca_offline: ${disparos} disparo(s)`);
  }
  return disparos;
}
