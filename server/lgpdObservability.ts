/**
 * Observabilidade LGPD: logs estruturados + encaminhamento opcional (Datadog / webhook / Sentry).
 *
 * Variáveis de ambiente:
 * - DATADOG_API_KEY + DATADOG_SITE (ex.: datadoghq.com) — Logs API v2
 * - LGPD_ALERT_WEBHOOK_URL — JSON POST genérico (Slack, PagerDuty, integração Sentry inbound)
 * - SENTRY_DSN — captura via @sentry/node se o pacote estiver instalado
 */

export type LgpdAlertSeverity = "info" | "warning" | "error";

export interface LgpdIntegrationsStatus {
  datadog: boolean;
  webhook: boolean;
  sentry: boolean;
  hmacSecret: boolean;
  datadogSite: string | null;
}

export function getLgpdIntegrationsStatus(): LgpdIntegrationsStatus {
  return {
    datadog: Boolean(process.env.DATADOG_API_KEY?.trim()),
    webhook: Boolean(process.env.LGPD_ALERT_WEBHOOK_URL?.trim()),
    sentry: Boolean(process.env.SENTRY_DSN?.trim()),
    hmacSecret: Boolean(
      process.env.PRIVACY_CONSENT_HMAC_SECRET?.trim() ||
        process.env.SESSION_SECRET?.trim()
    ),
    datadogSite: process.env.DATADOG_SITE?.trim() || "datadoghq.com",
  };
}

function structuredLog(
  severity: LgpdAlertSeverity,
  event: string,
  details: Record<string, unknown>
) {
  const line = JSON.stringify({
    service: "clubedogrito-lgpd",
    severity,
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });
  if (severity === "error") console.error("[lgpd-obs]", line);
  else if (severity === "warning") console.warn("[lgpd-obs]", line);
  else console.log("[lgpd-obs]", line);
}

async function forwardToDatadog(
  severity: LgpdAlertSeverity,
  event: string,
  details: Record<string, unknown>
) {
  const apiKey = process.env.DATADOG_API_KEY?.trim();
  if (!apiKey) return;

  const site = process.env.DATADOG_SITE?.trim() || "datadoghq.com";
  const status =
    severity === "error" ? "error" : severity === "warning" ? "warn" : "info";

  try {
    await fetch(`https://http-intake.logs.${site}/api/v2/logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "DD-API-KEY": apiKey,
      },
      body: JSON.stringify([
        {
          ddsource: "nodejs",
          ddtags: `env:${process.env.NODE_ENV || "development"},service:clubedogrito-lgpd`,
          hostname: process.env.HOSTNAME || "clubedogrito",
          message: event,
          status,
          ...details,
        },
      ]),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[lgpd-obs] Falha ao enviar log ao Datadog:", msg);
  }
}

async function forwardToWebhook(
  severity: LgpdAlertSeverity,
  event: string,
  details: Record<string, unknown>
) {
  const url = process.env.LGPD_ALERT_WEBHOOK_URL?.trim();
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        severity,
        event,
        service: "clubedogrito-lgpd",
        timestamp: new Date().toISOString(),
        details,
      }),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[lgpd-obs] Falha no webhook de alerta:", msg);
  }
}

/** SENTRY_DSN indica intenção de integração; use LGPD_ALERT_WEBHOOK_URL (Sentry inbound) ou instale @sentry/node. */
function noteSentryConfigured(event: string) {
  if (!process.env.SENTRY_DSN?.trim()) return;
  structuredLog("info", "sentry_dsn_configured", {
    hint: "Encaminhe via LGPD_ALERT_WEBHOOK_URL ou instale @sentry/node",
    event,
  });
}

/** Dispara alerta assíncrono (não bloqueia a requisição HTTP). */
export function emitLgpdAlert(
  severity: LgpdAlertSeverity,
  event: string,
  details: Record<string, unknown> = {}
): void {
  void (async () => {
    structuredLog(severity, event, details);
    noteSentryConfigured(event);
    await Promise.all([
      forwardToDatadog(severity, event, details),
      forwardToWebhook(severity, event, details),
    ]);
  })();
}
