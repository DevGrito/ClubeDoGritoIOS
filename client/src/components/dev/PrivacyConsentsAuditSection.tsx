import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Download, RefreshCw, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ConsentRow = {
  id: number;
  user_id: number | null;
  user_name?: string | null;
  user_email?: string | null;
  anonymous_consent_id: string | null;
  role: string | null;
  consent_area: string;
  source: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  image_use: boolean;
  communications: boolean;
  privacy_policy_version: string | null;
  cookie_policy_version: string | null;
  terms_version: string | null;
  image_policy_version: string | null;
  policy_hash?: string | null;
  consent_hmac?: string | null;
  policy_bundle_id?: string | null;
  client_policy_hash?: string | null;
  necessary?: boolean;
  accepted_at_client?: string | null;
  created_at?: string | null;
  updated_at: string;
};

type StaffConsentRow = {
  id: number;
  staff_kind: string;
  staff_id: number;
  staff_name?: string | null;
  consent_area: string;
  policy_bundle_id: string;
  privacy_policy_version: string | null;
  terms_version: string | null;
  image_use: boolean;
  communications: boolean;
  marketing: boolean;
  source: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  accepted_at: string;
};

type StaffApiResponse = {
  page: number;
  pageSize: number;
  total: number;
  consents: StaffConsentRow[];
};

const AREA_GATE_AREAS = new Set(["employees", "council", "students", "sponsors", "donors"]);

function deriveStatusLabel(row: ConsentRow): string {
  const prefCount =
    Number(row.analytics) +
    Number(row.functional) +
    Number(row.marketing) +
    Number(row.image_use) +
    Number(row.communications);

  if (row.source?.startsWith("termos_")) return "termos gerais";

  if (AREA_GATE_AREAS.has(row.consent_area) && row.necessary !== false) {
    if (prefCount === 0) return "aceito (área)";
    return prefCount >= 5 ? "aceito (área + opcionais)" : "aceito (área, opcionais parciais)";
  }

  if (prefCount === 0) return "recusado";
  if (prefCount === 5) return "aceito";
  return "parcial";
}

function statusBadgeClass(label: string): string {
  if (label.startsWith("aceito") || label === "termos gerais") {
    return "border-green-300 text-green-800 bg-green-50";
  }
  if (label === "parcial") return "border-yellow-300 text-yellow-800 bg-yellow-50";
  return "border-gray-300 text-gray-700";
}

type ApiResponse = {
  page: number;
  pageSize: number;
  total: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  summary?: {
    total: number;
    accepted_count: number;
    rejected_count: number;
    partial_count: number;
  };
  consents: ConsentRow[];
};

interface Props {
  /** Só busca dados quando a aba está visível */
  active?: boolean;
}

export default function PrivacyConsentsAuditSection({ active = true }: Props) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [consentArea, setConsentArea] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("updated_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [analytics, setAnalytics] = useState("");
  const [functional, setFunctional] = useState("");
  const [marketing, setMarketing] = useState("");
  const [imageUse, setImageUse] = useState("");
  const [communications, setCommunications] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncErrors, setSyncErrors] = useState<
    Array<{ id: number; error_message: string; http_status: number | null; source: string | null; created_at: string }>
  >([]);
  const [data, setData] = useState<ApiResponse>({
    page: 1,
    pageSize: 20,
    total: 0,
    summary: { total: 0, accepted_count: 0, rejected_count: 0, partial_count: 0 },
    consents: [],
  });
  const [staffPage, setStaffPage] = useState(1);
  const [staffConsentArea, setStaffConsentArea] = useState("");
  const [staffKind, setStaffKind] = useState("");
  const [staffQ, setStaffQ] = useState("");
  const [staffData, setStaffData] = useState<StaffApiResponse>({
    page: 1,
    pageSize: 20,
    total: 0,
    consents: [],
  });
  const [staffLoading, setStaffLoading] = useState(false);

  const totalPages = useMemo(() => Math.max(1, Math.ceil((data.total || 0) / pageSize)), [data.total, pageSize]);
  const staffTotalPages = useMemo(
    () => Math.max(1, Math.ceil((staffData.total || 0) / 20)),
    [staffData.total]
  );

  const staffQueryString = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(staffPage));
    p.set("pageSize", "20");
    if (staffConsentArea) p.set("consentArea", staffConsentArea);
    if (staffKind) p.set("staffKind", staffKind);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (staffQ) p.set("q", staffQ);
    return p.toString();
  }, [staffPage, staffConsentArea, staffKind, from, to, staffQ]);

  const clearFilters = () => {
    setPage(1);
    setConsentArea("");
    setSource("");
    setStatus("");
    setFrom("");
    setTo("");
    setQ("");
    setSortBy("updated_at");
    setSortDir("desc");
    setAnalytics("");
    setFunctional("");
    setMarketing("");
    setImageUse("");
    setCommunications("");
  };

  const applyPresetRejected = () => {
    setPage(1);
    setStatus("rejected");
  };

  const applyPresetMarketingTrue = () => {
    setPage(1);
    setMarketing("true");
  };

  const applyPresetLast7Days = () => {
    setPage(1);
    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setDate(now.getDate() - 7);
    setFrom(fromDate.toISOString().slice(0, 10));
    setTo(now.toISOString().slice(0, 10));
  };

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    if (consentArea) p.set("consentArea", consentArea);
    if (source) p.set("source", source);
    if (status) p.set("status", status);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (q) p.set("q", q);
    if (analytics) p.set("analytics", analytics);
    if (functional) p.set("functional", functional);
    if (marketing) p.set("marketing", marketing);
    if (imageUse) p.set("image_use", imageUse);
    if (communications) p.set("communications", communications);
    p.set("sortBy", sortBy);
    p.set("sortDir", sortDir);
    return p.toString();
  }, [page, pageSize, consentArea, source, status, from, to, q, analytics, functional, marketing, imageUse, communications, sortBy, sortDir]);

  const maskIp = (ip?: string | null) => {
    if (!ip) return "-";
    if (ip.includes(":")) return ip.split(":").slice(0, 3).join(":") + ":****";
    const parts = ip.split(".");
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.***.***`;
    return "***";
  };

  const maskUserAgent = (ua?: string | null) => {
    if (!ua) return "-";
    return ua.length > 60 ? `${ua.slice(0, 60)}...` : ua;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/privacy-consents?${queryString}`, {
        credentials: "include",
      });
      if (!res.ok) {
        let detail = "";
        try {
          const body = await res.json();
          detail = body?.error ? `: ${body.error}` : "";
        } catch {}
        if (res.status === 403) {
          throw new Error(
            `Acesso negado (403)${detail}. Verifique se sua sessão tem permissão de administrador ou encerre a sessão de aluno neste navegador.`
          );
        }
        throw new Error(`Falha ao carregar auditoria (HTTP ${res.status})${detail}`);
      }
      const json = (await res.json()) as ApiResponse;
      setData(json);

      try {
        const errRes = await fetch("/api/admin/privacy-consents/sync-errors?limit=10", {
          credentials: "include",
        });
        if (errRes.ok) {
          const errJson = await errRes.json();
          setSyncErrors(errJson.errors || []);
        }
      } catch {
        setSyncErrors([]);
      }
    } catch (err) {
      console.error("[LGPD] Erro ao carregar auditoria:", err);
      setError(err instanceof Error ? err.message : "Não foi possível carregar os consentimentos agora.");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  const fetchStaffData = useCallback(async () => {
    setStaffLoading(true);
    try {
      const res = await fetch(`/api/admin/staff-area-consents?${staffQueryString}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Falha ao carregar ficha staff (HTTP ${res.status})`);
      setStaffData((await res.json()) as StaffApiResponse);
    } catch (err) {
      console.error("[LGPD] Erro ao carregar staff_area_consents:", err);
    } finally {
      setStaffLoading(false);
    }
  }, [staffQueryString]);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchData(), fetchStaffData()]);
  }, [fetchData, fetchStaffData]);

  const downloadCsv = async () => {
    try {
      const res = await fetch(`/api/admin/privacy-consents?${queryString}&format=csv`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Falha ao exportar CSV (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `privacy-consents-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[LGPD] Erro ao exportar CSV:", err);
      setError("Falha ao exportar CSV da auditoria.");
    }
  };

  useEffect(() => {
    if (!active) return;
    void fetchAll();
  }, [active, fetchAll]);

  if (!active) return null;

  const inputClass =
    "w-full min-w-0 border rounded-md px-3 py-2 text-sm bg-white";
  const selectClass =
    "w-full min-w-0 border rounded-md px-3 py-2 text-sm bg-white";

  return (
    <div className="w-full min-w-0 overflow-x-hidden p-0 sm:p-4 space-y-3 sm:space-y-4 max-w-6xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-gray-500">LGPD</p>
          <h2 className="text-base sm:text-lg font-bold text-gray-900 break-words">
            Auditoria de Consentimentos
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchAll()}
            disabled={loading || staffLoading}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Atualizar
          </Button>
          <Button
            size="sm"
            onClick={downloadCsv}
            className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-500 text-black"
          >
            <Download className="w-4 h-4 mr-1" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <input className={inputClass} placeholder="Busca (nome, e-mail, user, origem)" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
          <input className={inputClass} placeholder="Área (ex: general)" value={consentArea} onChange={(e) => { setPage(1); setConsentArea(e.target.value); }} />
          <input className={inputClass} placeholder="Origem (ex: web_banner)" value={source} onChange={(e) => { setPage(1); setSource(e.target.value); }} />
          <select className={selectClass} value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">Status (todos)</option>
            <option value="accepted">Aceito</option>
            <option value="rejected">Recusado</option>
            <option value="partial">Parcial</option>
          </select>
          <input type="date" className={inputClass} value={from} onChange={(e) => { setPage(1); setFrom(e.target.value); }} />
          <input type="date" className={inputClass} value={to} onChange={(e) => { setPage(1); setTo(e.target.value); }} />
          <select className={selectClass} value={String(pageSize)} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}>
            <option value="20">20 por página</option>
            <option value="50">50 por página</option>
            <option value="100">100 por página</option>
          </select>
          <select className={selectClass} value={sortBy} onChange={(e) => { setPage(1); setSortBy(e.target.value); }}>
            <option value="updated_at">Ordenar por data</option>
            <option value="source">Ordenar por origem</option>
            <option value="consent_area">Ordenar por área</option>
            <option value="status_rank">Ordenar por status</option>
          </select>
          <select className={selectClass} value={sortDir} onChange={(e) => { setPage(1); setSortDir(e.target.value as "asc" | "desc"); }}>
            <option value="desc">Ordem decrescente</option>
            <option value="asc">Ordem crescente</option>
          </select>
          <select className={selectClass} value={analytics} onChange={(e) => { setPage(1); setAnalytics(e.target.value); }}>
            <option value="">Analytics (todos)</option>
            <option value="true">Analytics = true</option>
            <option value="false">Analytics = false</option>
          </select>
          <select className={selectClass} value={functional} onChange={(e) => { setPage(1); setFunctional(e.target.value); }}>
            <option value="">Functional (todos)</option>
            <option value="true">Functional = true</option>
            <option value="false">Functional = false</option>
          </select>
          <select className={selectClass} value={marketing} onChange={(e) => { setPage(1); setMarketing(e.target.value); }}>
            <option value="">Marketing (todos)</option>
            <option value="true">Marketing = true</option>
            <option value="false">Marketing = false</option>
          </select>
          <select className={selectClass} value={imageUse} onChange={(e) => { setPage(1); setImageUse(e.target.value); }}>
            <option value="">Image Use (todos)</option>
            <option value="true">Image Use = true</option>
            <option value="false">Image Use = false</option>
          </select>
          <select className={selectClass} value={communications} onChange={(e) => { setPage(1); setCommunications(e.target.value); }}>
            <option value="">Communications (todos)</option>
            <option value="true">Communications = true</option>
            <option value="false">Communications = false</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 sm:p-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={clearFilters}>
            Limpar filtros
          </Button>
          <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={applyPresetRejected}>
            Preset: somente recusados
          </Button>
          <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={applyPresetMarketingTrue}>
            Preset: marketing=true
          </Button>
          <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={applyPresetLast7Days}>
            Preset: últimos 7 dias
          </Button>
        </CardContent>
      </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-3 sm:p-4 flex items-start gap-2">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-800 break-words">
              Trilha de auditoria LGPD com filtros e exportação. Total atual: <strong>{data.total}</strong> registros.
            </p>
          </CardContent>
        </Card>

        {syncErrors.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-3 sm:p-4 space-y-2">
              <p className="text-sm font-semibold text-amber-900">
                Falhas recentes de sincronização ({syncErrors.length})
              </p>
              {syncErrors.map((e) => (
                <p key={e.id} className="text-xs text-amber-800 break-words [overflow-wrap:anywhere]">
                  {new Date(e.created_at).toLocaleString("pt-BR")} · HTTP {e.http_status ?? "?"} · {e.source || "web"} —{" "}
                  {e.error_message}
                </p>
              ))}
            </CardContent>
          </Card>
        )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg sm:text-xl font-bold text-gray-900">{data.summary?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-gray-500">Aceitos</p>
            <p className="text-lg sm:text-xl font-bold text-green-700">{data.summary?.accepted_count ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-gray-500">Parciais</p>
            <p className="text-lg sm:text-xl font-bold text-yellow-700">{data.summary?.partial_count ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-gray-500">Recusados</p>
            <p className="text-lg sm:text-xl font-bold text-red-700">{data.summary?.rejected_count ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-red-200">
          <CardContent className="p-4 text-sm text-red-600">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {loading ? (
          <Card><CardContent className="p-6 text-sm text-gray-500">Carregando auditoria...</CardContent></Card>
        ) : data.consents.length === 0 ? (
          <Card><CardContent className="p-6 text-sm text-gray-500">Nenhum registro encontrado com os filtros atuais.</CardContent></Card>
        ) : (
          data.consents.map((row) => {
            const statusLabel = deriveStatusLabel(row);

            return (
              <Card key={row.id} className="overflow-hidden">
                <CardHeader className="pb-2 px-3 sm:px-6">
                  <CardTitle className="text-base flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span>Registro #{row.id}</span>
                    <Badge variant="outline" className={`w-fit ${statusBadgeClass(statusLabel)}`}>
                      {statusLabel}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-4 text-sm text-gray-700 space-y-0">
                  <AuditField
                    label="Usuário"
                    value={
                      row.user_id ? (
                        <span>
                          {row.user_name?.trim() ? (
                            <>
                              <span className="font-medium text-gray-900">{row.user_name.trim()}</span>
                              <span className="text-gray-500"> · #{row.user_id}</span>
                            </>
                          ) : (
                            <span>#{row.user_id}</span>
                          )}
                          {row.user_email ? (
                            <span className="block text-xs text-gray-500 mt-0.5">{row.user_email}</span>
                          ) : null}
                        </span>
                      ) : (
                        "anônimo"
                      )
                    }
                  />
                  <AuditField label="Papel" value={row.role || "-"} />
                  <AuditField label="Anon ID" value={row.anonymous_consent_id || "-"} />
                  <AuditField label="Área" value={row.consent_area} />
                  <AuditField label="Origem" value={row.source || "-"} />
                  <AuditField label="IP" value={maskIp(row.ip_address)} />
                  <AuditField label="User-Agent" value={maskUserAgent(row.user_agent)} />
                  <AuditField
                    label="Preferências"
                    value={
                      <span className="flex flex-wrap gap-1">
                        <PrefBadge label="necessary" value={row.necessary !== false} />
                        <PrefBadge label="analytics" value={row.analytics} />
                        <PrefBadge label="functional" value={row.functional} />
                        <PrefBadge label="marketing" value={row.marketing} />
                        <PrefBadge label="image_use" value={row.image_use} />
                        <PrefBadge label="communications" value={row.communications} />
                      </span>
                    }
                  />
                  <AuditField
                    label="Versões"
                    value={`privacy=${row.privacy_policy_version || "-"}, cookie=${row.cookie_policy_version || "-"}, terms=${row.terms_version || "-"}, image=${row.image_policy_version || "-"}`}
                  />
                  <AuditField label="Policy hash" value={row.policy_hash ? `${row.policy_hash.slice(0, 16)}…` : "-"} mono />
                  <AuditField
                    label="HMAC / Bundle"
                    value={`${row.consent_hmac ? `${row.consent_hmac.slice(0, 16)}…` : "-"} · ${row.policy_bundle_id || "-"}`}
                    mono
                  />
                  <AuditField
                    label="Hash cliente"
                    value={row.client_policy_hash ? `${row.client_policy_hash.slice(0, 16)}…` : "-"}
                    mono
                  />
                  <AuditField
                    label="Aceite cliente"
                    value={
                      row.accepted_at_client
                        ? new Date(row.accepted_at_client).toLocaleString("pt-BR")
                        : "-"
                    }
                  />
                  <AuditField
                    label="Criado em"
                    value={row.created_at ? new Date(row.created_at).toLocaleString("pt-BR") : "-"}
                  />
                  <AuditField
                    label="Atualizado em"
                    value={new Date(row.updated_at).toLocaleString("pt-BR")}
                  />
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Card className="border-indigo-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-indigo-900">
            Aceites na ficha staff ({staffData.total})
          </CardTitle>
          <p className="text-xs text-indigo-700 font-normal">
            Prova direta em <code className="text-xs">staff_area_consents</code> (professor, monitor, coordenador — área employees).
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              className={inputClass}
              placeholder="Busca (nome, id, origem)"
              value={staffQ}
              onChange={(e) => { setStaffPage(1); setStaffQ(e.target.value); }}
            />
            <input
              className={inputClass}
              placeholder="Área (ex: employees)"
              value={staffConsentArea}
              onChange={(e) => { setStaffPage(1); setStaffConsentArea(e.target.value); }}
            />
            <select
              className={selectClass}
              value={staffKind}
              onChange={(e) => { setStaffPage(1); setStaffKind(e.target.value); }}
            >
              <option value="">Tipo staff (todos)</option>
              <option value="professor">Professor</option>
              <option value="monitor">Monitor</option>
              <option value="coordenador">Coordenador</option>
            </select>
          </div>

          {staffLoading ? (
            <p className="text-sm text-gray-500">Carregando ficha staff...</p>
          ) : staffData.consents.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum aceite na ficha staff com os filtros atuais.</p>
          ) : (
            <div className="grid gap-3">
              {staffData.consents.map((row) => (
                <Card key={`staff-${row.id}`} className="overflow-hidden border-indigo-100">
                  <CardHeader className="pb-2 px-3 sm:px-6">
                    <CardTitle className="text-sm flex flex-wrap items-center gap-2">
                      <span>Ficha #{row.id}</span>
                      <Badge variant="outline" className="border-indigo-300 text-indigo-800 bg-indigo-50">
                        {row.staff_kind} · #{row.staff_id}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-4 text-sm text-gray-700 space-y-0">
                    <AuditField
                      label="Nome"
                      value={row.staff_name?.trim() || "-"}
                    />
                    <AuditField label="Área" value={row.consent_area} />
                    <AuditField label="Origem" value={row.source || "-"} />
                    <AuditField label="Bundle" value={row.policy_bundle_id} mono />
                    <AuditField
                      label="Versões"
                      value={`privacy=${row.privacy_policy_version || "-"}, terms=${row.terms_version || "-"}`}
                    />
                    <AuditField
                      label="Opcionais"
                      value={
                        <span className="flex flex-wrap gap-1">
                          <PrefBadge label="image_use" value={row.image_use} />
                          <PrefBadge label="communications" value={row.communications} />
                          <PrefBadge label="marketing" value={row.marketing} />
                        </span>
                      }
                    />
                    <AuditField label="IP" value={maskIp(row.ip_address)} />
                    <AuditField label="User-Agent" value={maskUserAgent(row.user_agent)} />
                    <AuditField
                      label="Aceito em"
                      value={new Date(row.accepted_at).toLocaleString("pt-BR")}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setStaffPage((p) => Math.max(1, p - 1))}
              disabled={staffPage <= 1 || staffLoading}
            >
              Anterior
            </Button>
            <span className="text-sm text-gray-600 text-center">
              Página {staffPage} de {staffTotalPages}
            </span>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setStaffPage((p) => Math.min(staffTotalPages, p + 1))}
              disabled={staffPage >= staffTotalPages || staffLoading}
            >
              Próxima
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-600 text-center">Página {page} de {totalPages}</span>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            Próxima
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AuditField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[7.5rem_minmax(0,1fr)] gap-0.5 sm:gap-3 py-2 border-b border-gray-100 last:border-0 min-w-0">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide shrink-0">{label}</span>
      <span
        className={`text-sm text-gray-800 break-words [overflow-wrap:anywhere] min-w-0 ${mono ? "font-mono text-xs sm:text-sm" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function PrefBadge({ label, value }: { label: string; value: boolean }) {
  return (
    <Badge
      variant="outline"
      className={`text-[10px] sm:text-xs ${value ? "border-green-300 text-green-800 bg-green-50" : "border-gray-300 text-gray-600"}`}
    >
      {label}={String(value)}
    </Badge>
  );
}
