import { useCallback, useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LgpdCoverageSummary from "@/components/dev/LgpdCoverageSummary";

type Integrations = {
  datadog: boolean;
  webhook: boolean;
  sentry: boolean;
  hmacSecret: boolean;
  datadogSite: string | null;
};

type MetricsResponse = {
  totals: { consents: number; syncErrors: number };
  last24h: {
    consents: number;
    syncErrors: number;
    syncErrors5xx: number;
    unlinkedConsents?: number;
  };
  coverage?: {
    linkedConsentPct: number;
    usersWithLinkedConsent: number;
    totalUsers: number;
    anonymousOnlyRecords: number;
    missingHmacRecords: number;
  };
  syncErrorsBySource7d: Array<{ source: string | null; count: number }>;
  recentSyncErrors: Array<{
    id: number;
    error_message: string;
    http_status: number | null;
    source: string | null;
    created_at: string;
  }>;
  integrations: Integrations;
  generatedAt: string;
};

interface Props {
  active?: boolean;
}

function IntegrationBadge({
  label,
  ok,
  hint,
}: {
  label: string;
  ok: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {ok ? (
        <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Ativo
        </Badge>
      ) : (
        <Badge variant="outline" className="text-gray-600">
          <XCircle className="w-3 h-3 mr-1" />
          Não configurado
        </Badge>
      )}
    </div>
  );
}

export default function LgpdObservabilitySection({ active = true }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MetricsResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/lgpd-observability/metrics", { credentials: "include" });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error || `HTTP ${r.status} ao carregar métricas LGPD`
        );
      }
      setData((await r.json()) as MetricsResponse);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Falha ao carregar métricas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active) void load();
  }, [active, load]);

  const integrations = data?.integrations;

  return (
    <div className="p-4 space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-yellow-600" />
            Observabilidade LGPD
          </h2>
          <p className="text-sm text-muted-foreground">
            Métricas internas + status de integrações Datadog / Sentry / webhook.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4 text-sm text-red-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </CardContent>
        </Card>
      ) : null}

      <LgpdCoverageSummary active={active} />

      {data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Consentimentos (total)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{data.totals.consents}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Erros de sync (total)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold text-amber-700">
                {data.totals.syncErrors}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Últimas 24h — consentimentos
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{data.last24h.consents}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Últimas 24h — erros sync
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">
                {data.last24h.syncErrors}
                {data.last24h.syncErrors5xx > 0 ? (
                  <span className="text-sm font-normal text-red-600 ml-2">
                    ({data.last24h.syncErrors5xx} HTTP 5xx)
                  </span>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Integrações externas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              <IntegrationBadge
                label="Datadog Logs"
                ok={!!integrations?.datadog}
                hint={
                  integrations?.datadog
                    ? `Site: ${integrations.datadogSite || "datadoghq.com"}`
                    : "DATADOG_API_KEY"
                }
              />
              <IntegrationBadge
                label="Sentry"
                ok={!!integrations?.sentry}
                hint={integrations?.sentry ? "SENTRY_DSN" : "Opcional (@sentry/node)"}
              />
              <IntegrationBadge
                label="Webhook de alertas"
                ok={!!integrations?.webhook}
                hint="LGPD_ALERT_WEBHOOK_URL"
              />
              <IntegrationBadge
                label="HMAC de consentimento"
                ok={!!integrations?.hmacSecret}
                hint="PRIVACY_CONSENT_HMAC_SECRET"
              />
            </CardContent>
          </Card>

          {data.syncErrorsBySource7d.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Erros de sync por origem (7 dias)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {data.syncErrorsBySource7d.map((row) => (
                  <div key={String(row.source)} className="flex justify-between">
                    <span>{row.source || "(sem origem)"}</span>
                    <span className="font-mono">{row.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Últimos erros de sincronização</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-2">Quando</th>
                    <th className="py-2 pr-2">HTTP</th>
                    <th className="py-2 pr-2">Origem</th>
                    <th className="py-2">Mensagem</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSyncErrors.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-muted-foreground">
                        Nenhum erro registrado.
                      </td>
                    </tr>
                  ) : (
                    data.recentSyncErrors.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100">
                        <td className="py-2 pr-2 whitespace-nowrap">
                          {new Date(row.created_at).toLocaleString("pt-BR")}
                        </td>
                        <td className="py-2 pr-2">{row.http_status ?? "—"}</td>
                        <td className="py-2 pr-2">{row.source || "—"}</td>
                        <td className="py-2 max-w-md truncate" title={row.error_message}>
                          {row.error_message}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}
          </p>
        </>
      ) : !loading && !error ? (
        <p className="text-sm text-muted-foreground">Carregando métricas…</p>
      ) : null}
    </div>
  );
}
