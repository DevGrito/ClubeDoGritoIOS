import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Radio,
  RefreshCw,
  Send,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
type Integrations = {
  webhookConfigured: boolean;
  lgpdPayloadEnabled: boolean;
};

type HistoryRow = {
  id: number;
  sync_intent: string | null;
  event_type: string;
  entity_id: number | null;
  user_id: number | null;
  success: boolean;
  http_status: number | null;
  error_message: string | null;
  optin_marketing: boolean | null;
  optin_communications: boolean | null;
  created_at: string;
};

type MetricsResponse = {
  integrations: Integrations;
  totals: { attempts: number; successes: number; failures: number };
  last24h: { attempts: number; successes: number; failures: number };
  byIntent7d: Array<{
    sync_intent: string;
    count: number;
    successes: number;
    failures: number;
  }>;
  recentHistory: HistoryRow[];
  generatedAt: string;
};

interface Props {
  active?: boolean;
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">DINAMIZE_WEBHOOK_URL</p>
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

function intentLabel(intent: string | null): string {
  if (!intent) return "—";
  const map: Record<string, string> = {
    billing: "Pagamento / checkout",
    subscription_status: "Status assinatura",
    consent_update: "Alteração consentimento",
    prize_fulfillment: "Prêmio resgatado",
    manual: "Reenvio manual",
  };
  return map[intent] || intent;
}

export default function DinamizeObservabilitySection({ active = true }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [doadorIdInput, setDoadorIdInput] = useState("");
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [sendingLgpdTest, setSendingLgpdTest] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/dinamize-observability/metrics", {
        credentials: "include",
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error || `HTTP ${r.status} ao carregar métricas Dinamize`
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

  const resyncDoador = useCallback(
    async (doadorId: number) => {
      setResendingId(doadorId);
      try {
        const r = await fetch(`/api/admin/dinamize/sync-doador/${doadorId}`, {
          method: "POST",
          credentials: "include",
        });
        const body = (await r.json().catch(() => ({}))) as { success?: boolean; message?: string };
        if (!r.ok || !body.success) {
          throw new Error(body.message || `HTTP ${r.status}`);
        }
        toast({
          title: "Doador reenviado",
          description: body.message || `Doador #${doadorId} sincronizado com a Dinamize.`,
        });
        await load();
      } catch (e: unknown) {
        toast({
          title: "Falha no reenvio",
          description: e instanceof Error ? e.message : "Erro ao reenviar doador",
          variant: "destructive",
        });
      } finally {
        setResendingId(null);
      }
    },
    [load, toast]
  );

  const handleManualResync = useCallback(() => {
    const id = parseInt(doadorIdInput.trim(), 10);
    if (isNaN(id) || id <= 0) {
      toast({
        title: "ID inválido",
        description: "Informe o número do doador (ex.: 188).",
        variant: "destructive",
      });
      return;
    }
    void resyncDoador(id);
  }, [doadorIdInput, resyncDoador, toast]);

  const sendLgpdTest = useCallback(async () => {
    setSendingLgpdTest(true);
    try {
      const r = await fetch("/api/admin/dinamize/test-webhook-lgpd", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "teste@teste.com" }),
      });
      const body = (await r.json()) as { success?: boolean; message?: string };
      if (!r.ok || !body.success) {
        throw new Error(body.message || `HTTP ${r.status}`);
      }
      toast({
        title: "Teste LGPD enviado",
        description: body.message || "Confira teste@teste.com na Dinamize.",
      });
      await load();
    } catch (e: unknown) {
      toast({
        title: "Falha no teste LGPD",
        description: e instanceof Error ? e.message : "Erro ao enviar teste",
        variant: "destructive",
      });
    } finally {
      setSendingLgpdTest(false);
    }
  }, [load, toast]);

  const integrations = data?.integrations;

  return (
    <div className="p-4 space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Radio className="w-5 h-5 text-orange-600" />
            Integração Dinamize
          </h2>
          <p className="text-sm text-muted-foreground">
            Status do webhook e histórico de sincronizações (sem expor a URL).
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

      {data ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuração</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              <StatusBadge
                ok={!!integrations?.webhookConfigured}
                label="Webhook Dinamize"
              />
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Payload LGPD</p>
                  <p className="text-xs text-muted-foreground">DINAMIZE_LGPD_PAYLOAD</p>
                </div>
                {integrations?.lgpdPayloadEnabled ? (
                  <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Ativo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-600">
                    <XCircle className="w-3 h-3 mr-1" />
                    Desligado
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Teste payload LGPD (real)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Dispara POST igual ao Clube para <strong>teste@teste.com</strong> com todos os
                campos LGPD em <code>true</code> / <code>status_doador=ativo</code> /
                <code>tipo_evento=consent_update</code>. Diferente do botão interno da Dinamize.
              </p>
              <Button
                variant="secondary"
                onClick={() => void sendLgpdTest()}
                disabled={sendingLgpdTest || !integrations?.webhookConfigured}
              >
                <Send className="w-4 h-4 mr-1" />
                {sendingLgpdTest ? "Enviando…" : "Enviar teste LGPD"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reenvio manual de doador</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label htmlFor="dinamize-doador-id">ID do doador</Label>
                <Input
                  id="dinamize-doador-id"
                  type="number"
                  min={1}
                  placeholder="ex.: 188"
                  value={doadorIdInput}
                  onChange={(e) => setDoadorIdInput(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button
                onClick={() => void handleManualResync()}
                disabled={resendingId != null}
              >
                <Send className="w-4 h-4 mr-1" />
                Reenviar para Dinamize
              </Button>
              <p className="text-xs text-muted-foreground w-full">
                Falhas disparam push <code className="text-xs">dinamize_sync_falhou</code> para dev
                (cooldown 30 min).
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tentativas (total)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{data.totals.attempts}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Sucessos (total)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold text-green-700">
                {data.totals.successes}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Falhas (total)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold text-amber-700">
                {data.totals.failures}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Últimas 24h — tentativas
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xl font-bold">{data.last24h.attempts}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Últimas 24h — sucessos
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xl font-bold text-green-700">
                {data.last24h.successes}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Últimas 24h — falhas
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xl font-bold text-amber-700">
                {data.last24h.failures}
              </CardContent>
            </Card>
          </div>

          {data.byIntent7d.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Por tipo (7 dias)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {data.byIntent7d.map((row) => (
                  <div key={row.sync_intent} className="flex justify-between gap-2">
                    <span>{intentLabel(row.sync_intent)}</span>
                    <span className="font-mono shrink-0">
                      {row.count} ({row.successes} ok / {row.failures} err)
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico de sincronizações</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-2">Quando</th>
                    <th className="py-2 pr-2">Status</th>
                    <th className="py-2 pr-2">Tipo</th>
                    <th className="py-2 pr-2">Entidade</th>
                    <th className="py-2 pr-2">Opt-in</th>
                    <th className="py-2 pr-2">Detalhe</th>
                    <th className="py-2">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-4 text-muted-foreground">
                        Nenhuma sincronização registrada ainda.
                      </td>
                    </tr>
                  ) : (
                    data.recentHistory.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100">
                        <td className="py-2 pr-2 whitespace-nowrap">
                          {new Date(row.created_at).toLocaleString("pt-BR")}
                        </td>
                        <td className="py-2 pr-2">
                          {row.success ? (
                            <Badge variant="outline" className="text-green-700 border-green-300">
                              OK {row.http_status ?? ""}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-700 border-amber-300">
                              Falha {row.http_status ?? ""}
                            </Badge>
                          )}
                        </td>
                        <td className="py-2 pr-2">{intentLabel(row.sync_intent)}</td>
                        <td className="py-2 pr-2 whitespace-nowrap">
                          {row.event_type === "premio" ? "Prêmio" : "Doador"} #
                          {row.entity_id ?? "—"}
                        </td>
                        <td className="py-2 pr-2 whitespace-nowrap text-xs">
                          {row.optin_marketing == null && row.optin_communications == null
                            ? "—"
                            : `mkt ${row.optin_marketing ? "sim" : "não"} / com ${
                                row.optin_communications ? "sim" : "não"
                              }`}
                        </td>
                        <td
                          className="py-2 pr-2 max-w-xs truncate"
                          title={row.error_message || undefined}
                        >
                          {row.error_message || "—"}
                        </td>
                        <td className="py-2">
                          {row.event_type === "doador" && row.entity_id ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              disabled={resendingId === row.entity_id}
                              onClick={() => void resyncDoador(row.entity_id!)}
                            >
                              <Send className="w-3 h-3 mr-1" />
                              Reenviar
                            </Button>
                          ) : (
                            "—"
                          )}
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
