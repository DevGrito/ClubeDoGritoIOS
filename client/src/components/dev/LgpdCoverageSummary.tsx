import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { lgpdRouteCoverageSummary, lgpdRouteGaps } from "@shared/lgpdRouteCoverage";

type Coverage = {
  totalUsers: number;
  usersWithTermos: number;
  usersWithLinkedConsent: number;
  usersWithTermosSemPrivacy: number;
  consentRecordsTotal: number;
  consentLinkedRecords: number;
  anonymousOnlyRecords: number;
  fullyOrphanRecords: number;
  missingHmacRecords: number;
  staleAnonymous7d: number;
  linkedConsentPct: number;
  termosCoveragePct: number;
};

interface Props {
  active?: boolean;
  showBackfill?: boolean;
}

function pctBadge(value: number, warnBelow = 80) {
  if (value >= warnBelow) {
    return (
      <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
        {value}%
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-amber-800 border-amber-300 bg-amber-50">
      {value}%
    </Badge>
  );
}

export default function LgpdCoverageSummary({ active = true, showBackfill = true }: Props) {
  const [loading, setLoading] = useState(false);
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backfillMsg, setBackfillMsg] = useState<string | null>(null);
  const [coverage, setCoverage] = useState<Coverage | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/lgpd-observability/coverage", { credentials: "include" });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || `HTTP ${r.status}`);
      }
      const data = await r.json();
      setCoverage(data.coverage as Coverage);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Falha ao carregar cobertura");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active) void load();
  }, [active, load]);

  const runBackfill = async (execute: boolean) => {
    setBackfillLoading(true);
    setBackfillMsg(null);
    setError(null);
    try {
      const r = await fetch(
        `/api/admin/lgpd-observability/backfill${execute ? "?execute=true" : ""}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ execute }),
        }
      );
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || `HTTP ${r.status}`);
      }
      const result = await r.json();
      setCoverage(result.metricsAfter as Coverage);
      setBackfillMsg(
        execute
          ? `Backfill executado: ${result.termosBackfill.inserted} termos, ${result.hmacBackfill.updated} HMAC, ${result.legacyTagged.updated} legados marcados.`
          : `Simulação: ${result.termosBackfill.candidates} termos, ${result.hmacBackfill.candidates} HMAC, ${result.legacyTagged.candidates} legados.`
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Falha no backfill");
    } finally {
      setBackfillLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Users className="w-4 h-4" />
          Cobertura de consentimentos
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {error && (
          <p className="text-red-600 text-xs flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {error}
          </p>
        )}
        {backfillMsg && <p className="text-xs text-gray-600">{backfillMsg}</p>}

        {coverage ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-gray-500">Usuários com consent vinculado</p>
              <p className="font-semibold mt-1">
                {coverage.usersWithLinkedConsent} / {coverage.totalUsers}
              </p>
              <div className="mt-1">{pctBadge(coverage.linkedConsentPct, 80)}</div>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-gray-500">Termos com espelho privacy</p>
              <p className="font-semibold mt-1">
                {coverage.usersWithTermos - coverage.usersWithTermosSemPrivacy} / {coverage.usersWithTermos}
              </p>
              <div className="mt-1">{pctBadge(coverage.termosCoveragePct, 80)}</div>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-gray-500">Só anônimo / órfãos</p>
              <p className="font-semibold mt-1">
                {coverage.anonymousOnlyRecords} / {coverage.fullyOrphanRecords}
              </p>
              <p className="text-xs text-gray-400 mt-1">anônimo · sem ID</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-gray-500">Sem HMAC / anôn. &gt;7d</p>
              <p className="font-semibold mt-1">
                {coverage.missingHmacRecords} / {coverage.staleAnonymous7d}
              </p>
            </div>
          </div>
        ) : (
          !loading && <p className="text-xs text-gray-400">Sem dados de cobertura.</p>
        )}

        <div className="rounded-lg border p-3 space-y-2">
          <p className="text-xs font-semibold text-gray-700">Cobertura de rotas (PII)</p>
          <p className="text-xs text-gray-500">
            {(() => {
              const s = lgpdRouteCoverageSummary();
              return `${s.covered} cobertas · ${s.partial} parciais · ${s.gap} lacunas (de ${s.total} rotas mapeadas)`;
            })()}
          </p>
          <ul className="text-xs text-gray-600 space-y-1.5 max-h-40 overflow-y-auto">
            {lgpdRouteGaps().map((r) => (
              <li key={r.path} className="border-b border-gray-100 pb-1.5 last:border-0">
                <span className="font-medium text-gray-800">{r.label}</span>
                <span className="text-gray-400"> ({r.path})</span>
                <span className="block text-gray-500 mt-0.5">{r.notes}</span>
              </li>
            ))}
          </ul>
        </div>

        {showBackfill && (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              disabled={backfillLoading}
              onClick={() => void runBackfill(false)}
            >
              Simular backfill
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={backfillLoading}
              onClick={() => {
                if (
                  window.confirm(
                    "Executar backfill LGPD? Isso insere registros a partir de termos aceitos e corrige HMAC legado."
                  )
                ) {
                  void runBackfill(true);
                }
              }}
            >
              Executar backfill
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
