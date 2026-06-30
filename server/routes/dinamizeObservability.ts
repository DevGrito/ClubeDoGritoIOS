import type { Express, Request, Response, NextFunction } from "express";
import type { Pool } from "pg";
import {
  ensureDinamizeSyncLogTable,
  getDinamizeIntegrationStatus,
} from "../dinamizeObservability";

type AuthMiddleware = (req: Request, res: Response, next: NextFunction) => void;

export function registerDinamizeObservabilityRoutes(
  app: Express,
  deps: {
    pool: Pool;
    requireAuth: AuthMiddleware;
    requirePrivacyAuditAccess: AuthMiddleware;
  }
) {
  const { pool, requireAuth, requirePrivacyAuditAccess } = deps;

  void ensureDinamizeSyncLogTable(pool).catch((err) =>
    console.warn("[DINAMIZE] ensure table:", err?.message || err)
  );

  app.get(
    "/api/admin/dinamize-observability/metrics",
    requireAuth,
    requirePrivacyAuditAccess,
    async (_req, res) => {
      try {
        await ensureDinamizeSyncLogTable(pool);

        const [totals, last24h, byIntent, recentHistory] = await Promise.all([
          pool.query(`
            SELECT
              COUNT(*)::int AS attempts,
              COUNT(*) FILTER (WHERE success)::int AS successes,
              COUNT(*) FILTER (WHERE NOT success)::int AS failures
            FROM dinamize_sync_log
          `),
          pool.query(`
            SELECT
              COUNT(*)::int AS attempts,
              COUNT(*) FILTER (WHERE success)::int AS successes,
              COUNT(*) FILTER (WHERE NOT success)::int AS failures
            FROM dinamize_sync_log
            WHERE created_at >= NOW() - INTERVAL '24 hours'
          `),
          pool.query(`
            SELECT
              COALESCE(sync_intent, '(sem intent)') AS sync_intent,
              COUNT(*)::int AS count,
              COUNT(*) FILTER (WHERE success)::int AS successes,
              COUNT(*) FILTER (WHERE NOT success)::int AS failures
            FROM dinamize_sync_log
            WHERE created_at >= NOW() - INTERVAL '7 days'
            GROUP BY sync_intent
            ORDER BY count DESC
            LIMIT 10
          `),
          pool.query(`
            SELECT
              id,
              sync_intent,
              event_type,
              entity_id,
              user_id,
              success,
              http_status,
              error_message,
              optin_marketing,
              optin_communications,
              created_at
            FROM dinamize_sync_log
            ORDER BY created_at DESC
            LIMIT 50
          `),
        ]);

        const t = totals.rows[0] || {};
        const d = last24h.rows[0] || {};

        res.json({
          integrations: getDinamizeIntegrationStatus(),
          totals: {
            attempts: t.attempts ?? 0,
            successes: t.successes ?? 0,
            failures: t.failures ?? 0,
          },
          last24h: {
            attempts: d.attempts ?? 0,
            successes: d.successes ?? 0,
            failures: d.failures ?? 0,
          },
          byIntent7d: byIntent.rows,
          recentHistory: recentHistory.rows,
          generatedAt: new Date().toISOString(),
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erro interno";
        console.error("[DINAMIZE] metrics query failed:", message);
        res.status(500).json({ error: "Erro ao carregar métricas Dinamize" });
      }
    }
  );

  app.post(
    "/api/admin/dinamize/test-webhook-lgpd",
    requireAuth,
    requirePrivacyAuditAccess,
    async (req, res) => {
      try {
        const email =
          typeof req.body?.email === "string" && req.body.email.trim()
            ? req.body.email.trim()
            : "teste@teste.com";
        const { enviarTesteLgpdParaDinamize } = await import("../services/dinamize");
        const result = await enviarTesteLgpdParaDinamize(email);
        return res.status(result.success ? 200 : 502).json(result);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erro interno";
        res.status(500).json({ success: false, message });
      }
    }
  );
}
