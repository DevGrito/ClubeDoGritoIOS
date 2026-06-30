import cron from "node-cron";
import type { Pool } from "pg";
import { dispatchFcmToRecipients } from "../pushDispatch";

type InAppPushCronDeps = {
  pool: Pool;
  pushIconUrl: string;
  pushBadgeUrl: string;
  rejectedPushTokens: Set<string>;
};

/**
 * A cada minuto: notificações in-app com send_as_push + scheduled_at vencido
 * e push_sent_at ainda nulo → dispara push para doadores/leo registrados.
 */
export function scheduleInAppPushCron(deps: InAppPushCronDeps): void {
  const { pool, pushIconUrl, pushBadgeUrl, rejectedPushTokens } = deps;

  cron.schedule("* * * * *", async () => {
    try {
      const { rows: pending } = await pool.query<{
        id: number;
        title: string;
        message: string;
        primary_button_action: string | null;
        target_audience: string;
      }>(`
        SELECT id, title, message, primary_button_action, target_audience
        FROM in_app_notifications
        WHERE active = true
          AND send_as_push = true
          AND push_sent_at IS NULL
          AND scheduled_at IS NOT NULL
          AND scheduled_at <= NOW() AT TIME ZONE 'America/Sao_Paulo'
          AND (expires_at IS NULL OR expires_at > NOW() AT TIME ZONE 'America/Sao_Paulo')
        ORDER BY scheduled_at ASC
        LIMIT 20
      `);

      if (!pending.length) return;

      for (const n of pending) {
        const audience = n.target_audience || "all";
        let tokenQuery = `
          SELECT token, nome, user_key, user_type
          FROM fcm_tokens WHERE ativo = true
        `;
        const tokenParams: string[][] = [];

        if (audience === "donors_only" || audience === "donors") {
          tokenQuery += ` AND user_type = ANY($1)`;
          tokenParams.push(["doador", "leo", "user"]);
        }

        const { rows: tokenRows } = await pool.query(tokenQuery, tokenParams.length ? tokenParams : undefined);

        if (tokenRows.length === 0) {
          await pool.query(
            `UPDATE in_app_notifications SET push_sent_at = NOW(), updated_at = NOW() WHERE id = $1`,
            [n.id]
          );
          continue;
        }

        const url =
          n.primary_button_action && n.primary_button_action !== "dismiss"
            ? n.primary_button_action
            : undefined;

        const summary = await dispatchFcmToRecipients({
          pool,
          rows: tokenRows,
          payload: { title: n.title, body: n.message, url },
          iconUrl: pushIconUrl,
          badgeUrl: pushBadgeUrl,
          gatilho: "in_app_scheduled_push",
          origem: "cron",
          payloadMeta: { in_app_notification_id: n.id, target_audience: audience },
          rejectedPushTokens,
        });

        if (summary.enviados > 0) {
          await pool.query(
            `UPDATE in_app_notifications SET push_sent_at = NOW(), updated_at = NOW() WHERE id = $1`,
            [n.id]
          );
        }

        console.log(
          `[PUSH-CRON] in-app #${n.id} agendado: ${summary.enviados}/${summary.totalTokens} ok`
        );
      }
    } catch (e: any) {
      console.error("[PUSH-CRON] Erro in-app agendado:", e?.message || e);
    }
  });

  console.log("✅ [PUSH-CRON] Push agendado in-app (send_as_push + scheduled_at) — a cada minuto");
}
