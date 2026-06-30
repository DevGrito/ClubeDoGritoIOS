import type { Express, Request, Response, NextFunction } from "express";
import type { Pool } from "pg";
import {
  emitLgpdAlert,
  getLgpdIntegrationsStatus,
} from "../lgpdObservability";
import {
  queryLgpdCoverageMetrics,
  runPrivacyConsentBackfill,
} from "../privacyConsentBackfill";

type AuthMiddleware = (req: Request, res: Response, next: NextFunction) => void;

export function registerLgpdObservabilityRoutes(
  app: Express,
  deps: {
    pool: Pool;
    requireAuth: AuthMiddleware;
    requirePrivacyAuditAccess: AuthMiddleware;
  }
) {
  const { pool, requireAuth, requirePrivacyAuditAccess } = deps;

  app.get(
    "/api/admin/lgpd-observability/integrations",
    requireAuth,
    requirePrivacyAuditAccess,
    (_req, res) => {
      res.json(getLgpdIntegrationsStatus());
    }
  );

  app.get(
    "/api/admin/lgpd-observability/coverage",
    requireAuth,
    requirePrivacyAuditAccess,
    async (_req, res) => {
      try {
        const coverage = await queryLgpdCoverageMetrics(pool);
        res.json({ coverage, generatedAt: new Date().toISOString() });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erro interno";
        console.error("[LGPD] coverage:", error);
        emitLgpdAlert("error", "lgpd_coverage_query_failed", { message });
        res.status(500).json({ error: "Erro ao carregar cobertura LGPD" });
      }
    }
  );

  app.post(
    "/api/admin/lgpd-observability/backfill",
    requireAuth,
    requirePrivacyAuditAccess,
    async (req, res) => {
      try {
        const execute = req.body?.execute === true || req.query.execute === "true";
        const result = await runPrivacyConsentBackfill(pool, { dryRun: !execute });
        res.json(result);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erro interno";
        console.error("[LGPD] backfill:", error);
        emitLgpdAlert("error", "lgpd_backfill_failed", { message });
        res.status(500).json({ error: "Erro ao executar backfill LGPD" });
      }
    }
  );

  app.get(
    "/api/admin/lgpd-observability/metrics",
    requireAuth,
    requirePrivacyAuditAccess,
    async (_req, res) => {
      try {
        const [totals, last24h, bySource, recentErrors, coverage] = await Promise.all([
          pool.query(`
            SELECT
              (SELECT COUNT(*)::int FROM privacy_consents) AS total_consents,
              (SELECT COUNT(*)::int FROM privacy_consent_sync_errors) AS total_sync_errors
          `),
          pool.query(`
            SELECT
              (SELECT COUNT(*)::int FROM privacy_consents
                WHERE updated_at >= NOW() - INTERVAL '24 hours') AS consents_24h,
              (SELECT COUNT(*)::int FROM privacy_consent_sync_errors
                WHERE created_at >= NOW() - INTERVAL '24 hours') AS sync_errors_24h,
              (SELECT COUNT(*)::int FROM privacy_consent_sync_errors
                WHERE created_at >= NOW() - INTERVAL '24 hours'
                  AND COALESCE(http_status, 0) >= 500) AS sync_errors_5xx_24h,
              (SELECT COUNT(*)::int FROM privacy_consents
                WHERE updated_at >= NOW() - INTERVAL '24 hours'
                  AND user_id IS NULL) AS unlinked_consents_24h
          `),
          pool.query(`
            SELECT source, COUNT(*)::int AS count
              FROM privacy_consent_sync_errors
             WHERE created_at >= NOW() - INTERVAL '7 days'
             GROUP BY source
             ORDER BY count DESC
             LIMIT 10
          `),
          pool.query(`
            SELECT id, error_message, http_status, source, created_at
              FROM privacy_consent_sync_errors
             ORDER BY created_at DESC
             LIMIT 15
          `),
          queryLgpdCoverageMetrics(pool),
        ]);

        const t = totals.rows[0] || {};
        const d = last24h.rows[0] || {};

        res.json({
          totals: {
            consents: t.total_consents ?? 0,
            syncErrors: t.total_sync_errors ?? 0,
          },
          last24h: {
            consents: d.consents_24h ?? 0,
            syncErrors: d.sync_errors_24h ?? 0,
            syncErrors5xx: d.sync_errors_5xx_24h ?? 0,
            unlinkedConsents: d.unlinked_consents_24h ?? 0,
          },
          coverage,
          syncErrorsBySource7d: bySource.rows,
          recentSyncErrors: recentErrors.rows,
          integrations: getLgpdIntegrationsStatus(),
          generatedAt: new Date().toISOString(),
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erro interno";
        emitLgpdAlert("error", "lgpd_metrics_query_failed", { message });
        res.status(500).json({ error: "Erro ao carregar métricas LGPD" });
      }
    }
  );
}
