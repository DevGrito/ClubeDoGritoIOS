import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";

type ConsentHistoryRow = {
  id: number;
  consent_area: string;
  source: string | null;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  image_use: boolean;
  communications: boolean;
  privacy_policy_version: string | null;
  cookie_policy_version: string | null;
  policy_hash: string | null;
  consent_hmac?: string | null;
  updated_at: string;
};

export default function PrivacyConsentHistorySection() {
  const { data, isLoading, error } = useQuery<{ consents: ConsentHistoryRow[] }>({
    queryKey: ["/api/privacy/consent/history"],
    queryFn: async () => {
      const res = await fetch("/api/privacy/consent/history", { credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      return res.json();
    },
  });

  const rows = data?.consents ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <History className="w-4 h-4" /> Histórico de consentimentos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-gray-500">
          Registros salvos no servidor vinculados à sua conta (últimos {rows.length}).
        </p>
        {isLoading && <p className="text-xs text-gray-400">Carregando histórico...</p>}
        {error && (
          <p className="text-xs text-red-600">
            {error instanceof Error ? error.message : "Não foi possível carregar o histórico."}
          </p>
        )}
        {!isLoading && !error && rows.length === 0 && (
          <p className="text-xs text-gray-400">Nenhum registro encontrado para sua conta.</p>
        )}
        {rows.slice(0, 10).map((row) => {
          const count =
            Number(row.analytics) +
            Number(row.functional) +
            Number(row.marketing) +
            Number(row.image_use) +
            Number(row.communications);
          const label = count === 0 ? "recusado" : count === 5 ? "aceito" : "parcial";
          return (
            <div key={row.id} className="border border-gray-100 rounded-lg p-3 text-xs space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-gray-800">#{row.id}</span>
                <Badge variant="outline">{label}</Badge>
              </div>
              <p className="text-gray-500">
                {new Date(row.updated_at).toLocaleString("pt-BR")} · {row.source || "web"} · {row.consent_area}
              </p>
              <p className="text-gray-600">
                analytics={String(row.analytics)}, marketing={String(row.marketing)}, communications=
                {String(row.communications)}
              </p>
              {row.policy_hash && (
                <p className="text-gray-400 font-mono truncate" title={row.policy_hash}>
                  hash: {row.policy_hash.slice(0, 20)}…
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
