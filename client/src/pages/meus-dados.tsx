import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  User,
  Download,
  Mail,
  FileText,
  ChevronRight,
  CheckCircle,
  Clock,
  Eye,
  Heart,
  Info,
  CreditCard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { openPrivacyPreferences } from "@/lib/consentManager";
import BottomNavigation from "@/components/bottom-navigation";
import { LGPD_CONTACT_EMAIL, buildLgpdMailto } from "@/lib/lgpdContact";
import { useAuthSession } from "@/hooks/useAuthSession";
import { isNonDonorLgpdProfile, resolveLgpdBackPath } from "@/lib/lgpdBackPath";

const PLAN_LABELS: Record<string, string> = {
  eco: "Eco",
  voz: "Voz",
  grito: "O Grito",
  platinum: "Platinum",
  diamante: "Diamante",
};

const PERIODICIDADE_LABELS: Record<string, string> = {
  mensal: "Mensal",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCPF(cpf: string | null) {
  if (!cpf) return "—";
  const d = cpf.replace(/\D/g, "");
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : cpf;
}

function maskCPF(cpf: string | null) {
  if (!cpf) return "—";
  const f = formatCPF(cpf);
  return f.replace(/(\d{3}\.)(\d{3}\.)(\d{3})(-.{2})/, "***.$2***$4");
}

function planLabel(plano: string | null | undefined) {
  if (!plano) return "—";
  return PLAN_LABELS[plano.toLowerCase()] || plano;
}

function isAssinaturaAtiva(d: { ativo?: boolean; status?: string | null }) {
  if (d.ativo === true) return true;
  const s = (d.status || "").toLowerCase();
  return s === "paid" || s === "active" || s === "trialing";
}

const statusLabel: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  in_review: { label: "Em análise", color: "bg-blue-100 text-blue-800" },
  completed: { label: "Concluída", color: "bg-green-100 text-green-800" },
  rejected: { label: "Recusada", color: "bg-red-100 text-red-800" },
};

const docTypeLabel: Record<string, string> = {
  terms: "Termos de Uso",
  privacy_policy: "Política de Privacidade",
};

export default function MeusDados() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: authSession } = useAuthSession();
  const [showCPF, setShowCPF] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/meus-dados"],
  });

  const handleExportar = async () => {
    setExporting(true);
    try {
      const r = await fetch("/api/meus-dados/exportar", { credentials: "include" });
      if (!r.ok) throw new Error("export_failed");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meus-dados-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Download iniciado", description: "Seu arquivo JSON foi gerado." });
    } catch {
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível baixar seus dados. Tente novamente ou entre em contato com o suporte.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const usuario = data?.usuario;
  const aceites = data?.aceites || [];
  const doacoes = data?.doacoes || [];
  const solicitacoes = data?.solicitacoes || [];
  const isAluno = data?.tipoAtor === "aluno";
  const isPatrocinador = data?.tipoAtor === "patrocinador";
  const isStaff = ["coordenador", "professor", "monitor"].includes(String(data?.tipoAtor || ""));
  const nonDonor = isNonDonorLgpdProfile(authSession?.papel, authSession?.role) || isAluno || isStaff || isPatrocinador;
  const cursos = data?.cursos || [];
  const patrocinio = data?.patrocinio;
  const perfilStaff = data?.perfilStaff;
  const assinaturaAtiva = (data?.doadores || []).find((d: { ativo?: boolean; status?: string }) =>
    isAssinaturaAtiva(d)
  );
  const backPath = resolveLgpdBackPath(authSession?.papel, authSession?.role);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-gray-50"
      style={{ fontFamily: "SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif" }}
    >
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation(backPath)}
            className="mr-3 hover:bg-transparent"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">LGPD</p>
            <h1 className="text-lg font-bold text-gray-900">Meus dados</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4 pb-24">
        <div className="flex gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800 leading-relaxed">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Aqui você consulta e exporta os dados que guardamos sobre você. Para cookies e comunicações,
            use{" "}
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => openPrivacyPreferences()}
            >
              Privacidade e cookies
            </button>
            .
          </p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4" /> Seus dados cadastrais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-5 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <Row label="Nome" value={usuario?.nome} />
                <Row label="E-mail" value={usuario?.email} />
                <Row label="Telefone" value={usuario?.telefone} />
                <Row
                  label="CPF"
                  value={
                    <span className="flex items-center gap-2 justify-end">
                      {showCPF ? formatCPF(usuario?.cpf) : maskCPF(usuario?.cpf)}
                      <button
                        type="button"
                        onClick={() => setShowCPF((v) => !v)}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label={showCPF ? "Ocultar CPF" : "Mostrar CPF"}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  }
                />
                {!nonDonor && <Row label="Plano" value={planLabel(usuario?.plano)} />}
                {perfilStaff?.programa && (
                  <Row label="Área / programa" value={String(perfilStaff.programa)} />
                )}
                <Row label="Cadastro em" value={formatDate(usuario?.created_at)} />
              </>
            )}
            {!nonDonor && (
              <>
                <Separator />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-sm"
                  onClick={() => setLocation("/dados-cadastrais")}
                >
                  Editar meus dados
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {!isLoading && assinaturaAtiva && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Sua doação recorrente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Row label="Plano" value={planLabel(assinaturaAtiva.plano)} />
              <Row
                label="Valor"
                value={`R$ ${Number(assinaturaAtiva.valor || 0).toFixed(2).replace(".", ",")}`}
              />
              <Row
                label="Periodicidade"
                value={
                  PERIODICIDADE_LABELS[assinaturaAtiva.periodicidade as string] ||
                  assinaturaAtiva.periodicidade ||
                  "—"
                }
              />
              <Row label="Status" value={assinaturaAtiva.status || "ativo"} />
              {assinaturaAtiva.data_doacao_inicial && (
                <Row label="Desde" value={formatDate(assinaturaAtiva.data_doacao_inicial)} />
              )}
            </CardContent>
          </Card>
        )}

        {!isLoading && isPatrocinador && patrocinio && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Seu patrocínio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Row label="Empresa" value={patrocinio.nome as string} />
              <Row label="Categoria" value={String(patrocinio.categoria || "—")} />
              <Row
                label="Valor"
                value={
                  patrocinio.valor_patrocinio
                    ? `R$ ${Number(patrocinio.valor_patrocinio).toFixed(2).replace(".", ",")}`
                    : "—"
                }
              />
              <Row label="Status" value={String(patrocinio.status || "—")} />
            </CardContent>
          </Card>
        )}

        {!isLoading && isAluno && cursos.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Matrículas ({cursos.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {cursos.slice(0, 5).map((c: { id?: number; nome?: string; area?: string; status?: string }, i: number) => (
                <div key={c.id ?? i} className="text-sm">
                  <p className="font-medium text-gray-800">{c.nome}</p>
                  <p className="text-xs text-gray-400">
                    {(c.area || "").toUpperCase()} · {c.status || "—"}
                  </p>
                </div>
              ))}
              {cursos.length > 5 && (
                <p className="text-xs text-gray-400 text-center">Exportação inclui todas as matrículas.</p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Documentos aceitos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-10 bg-gray-100 rounded animate-pulse" />
            ) : aceites.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-2">Nenhum aceite registrado ainda.</p>
            ) : (
              <div className="space-y-2">
                {aceites.map((a: { document_type: string; document_version: string; accepted_at: string; source?: string }, i: number) => (
                  <div key={`${a.document_type}-${a.accepted_at}-${i}`} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium text-gray-800">
                        {docTypeLabel[a.document_type] || a.document_type}
                      </p>
                      <p className="text-xs text-gray-400">
                        v{a.document_version} · {formatDate(a.accepted_at)}
                        {a.source
                          ? ` · ${
                              a.source === "users.termos_uso"
                                ? "termos no cadastro"
                                : a.source === "aluno.termos_uso"
                                  ? "termos do aluno"
                                  : a.source?.endsWith(".termos_uso")
                                    ? "termos no cadastro"
                                    : a.source === "privacy_consents"
                                    ? "privacidade"
                                    : a.source
                            }`
                          : ""}
                      </p>
                    </div>
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {!isLoading && doacoes.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Heart className="w-4 h-4" /> Histórico de pagamentos ({doacoes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {doacoes.slice(0, 10).map((d: { id?: number; created_at: string; valor: string | number }, i: number) => (
                  <div key={d.id ?? i} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{formatDate(d.created_at)}</span>
                    <span className="font-medium text-gray-800">
                      R$ {Number(d.valor || 0).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                ))}
              </div>
              {doacoes.length > 10 && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Exibindo os 10 mais recentes. O arquivo de exportação inclui o histórico completo.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {!isLoading && solicitacoes.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Minhas solicitações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {solicitacoes.map((s: { request_type: string; status: string; requested_at: string; response?: string }, i: number) => {
                  const st = statusLabel[s.status] || { label: s.status, color: "bg-gray-100 text-gray-700" };
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-800">
                          {s.request_type === "deletion" ? "Exclusão de conta" : s.request_type}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{formatDate(s.requested_at)}</p>
                      {s.response && (
                        <p className="text-xs text-gray-600 bg-gray-50 rounded p-2">{s.response}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Download className="w-4 h-4" /> Exportar meus dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-gray-500 leading-relaxed">
              {isAluno
                ? "Baixe um arquivo JSON com sua ficha, matrículas, frequência, documentos aceitos e consentimentos (portabilidade LGPD)."
                : isStaff
                  ? "Baixe um arquivo JSON com seu cadastro profissional, documentos aceitos e consentimentos (portabilidade LGPD)."
                  : isPatrocinador
                    ? "Baixe um arquivo JSON com seu cadastro, dados de patrocínio, documentos aceitos e consentimentos (portabilidade LGPD)."
                    : "Baixe um arquivo JSON com cadastro, doações, documentos aceitos, histórico de consentimentos e solicitações registradas (portabilidade LGPD)."}
            </p>
            <Button
              onClick={() => void handleExportar()}
              variant="outline"
              size="sm"
              className="w-full"
              disabled={exporting || isLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              {exporting ? "Gerando arquivo…" : "Baixar meus dados (JSON)"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Mail className="w-4 h-4" /> Pedidos sobre seus dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-gray-500 leading-relaxed">
              Para solicitar exclusão, correção ou outro direito previsto na LGPD, envie um e-mail para
              nossa equipe. Responderemos em até 15 dias úteis.
            </p>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href={buildLgpdMailto()}>
                <Mail className="w-4 h-4 mr-2" />
                Enviar solicitação por e-mail
              </a>
            </Button>
            <p className="text-xs text-gray-400 text-center">{LGPD_CONTACT_EMAIL}</p>
          </CardContent>
        </Card>
      </div>

      {!nonDonor && <BottomNavigation />}
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-1 gap-3">
      <span className="text-xs text-gray-500 w-28 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900 text-right flex-1">{value || "—"}</span>
    </div>
  );
}
