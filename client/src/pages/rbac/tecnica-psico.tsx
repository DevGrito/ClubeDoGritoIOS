import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, authFetch } from "@/lib/queryClient";
import { logoutAndClearSession } from "@/lib/auth-session";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCPF } from "@/lib/utils";
import { useAuthSession } from "@/hooks/useAuthSession";
import AreaConsentGate, { useAreaConsentReady } from "@/components/AreaConsentGate";
import AtendidosComunidadeSection from "@/components/AtendidosComunidadeSection";
import { DarkMetricCard, PsicoAtendBreakdownModal, PsicoVisitasBreakdownModal } from "@/components/CoordenadorDashboard";
import {
  metaEspacoGritoPeriodo,
  periodoQtdMesesParaMeta,
  type PeriodoFiltro,
} from "@/lib/dashboardPeriodoFiltro";
import { PsicoPerfilModal } from "@/components/PsicoPerfilModal";
import { PushNotificationSettings } from "@/components/PushNotificationSettings";
import { LgpdMeusDadosSettingsPanel } from "@/components/LgpdLegalMenuSection";
import {
  Users, FileText, LogOut, UserCheck, Activity, Home, Search, User,
  CheckCircle, Loader2, Eye, Heart, Lock, Plus, Filter, Layers,
  ChevronRight, ChevronLeft, MessageSquare, BookOpen,
} from "lucide-react";

type Tab = "atendidos" | "alunos" | "frequencia" | "atividades" | "registros" | "confidencial" | "demanda" | "acompanhamentos";

export default function TecnicaPsicoPage() {
  const fetchApi = authFetch;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { ready: consentReady, checking: consentChecking, markReady: setConsentReady } =
    useAreaConsentReady("employees");
  const { data: authSession } = useAuthSession();
  const authUserId = authSession?.id;
  const userName = authSession?.nome || authSession?.email || '';

  const [activeTab, setActiveTab] = useState<Tab>("atendidos");
  const [psicoVertente, setPsicoVertente] = useState<"todos" | "pec" | "inclusao">("todos");
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear());
  const [filtroMes, setFiltroMes] = useState(0);
  const [dashView, setDashView] = useState<"psico" | "mapa">("psico");
  const [showAtendBreakdown, setShowAtendBreakdown] = useState(false);
  const [showVisitasBreakdown, setShowVisitasBreakdown] = useState(false);

  // Atendidos
  const [buscaAtendido, setBuscaAtendido] = useState("");
  const [filtroAtendidosVertente, setFiltroAtendidosVertente] = useState<"todos" | "pec" | "inclusao" | "comunidade">("todos");
  const [perfilAberto, setPerfilAberto] = useState<any>(null);

  // Alunos
  const [psicoAlunosFiltro, setPsicoAlunosFiltro] = useState<"todos" | "pec" | "inclusao">("todos");
  const [psicoAlunosBusca, setPsicoAlunosBusca] = useState("");

  // Frequência
  const [chamadaPrograma, setChamadaPrograma] = useState<"pec" | "inclusao">("pec");
  const [chamadaTurmaId, setChamadaTurmaId] = useState("");
  const [chamadaExpandida, setChamadaExpandida] = useState<number | null>(null);
  const [chamadaBusca, setChamadaBusca] = useState("");

  // Confidencial
  const [confSubTab, setConfSubTab] = useState<"realizados" | "novo">("realizados");
  const [confSearch, setConfSearch] = useState("");
  const [confForm, setConfForm] = useState({ tipo: "atendimento_individual", data: new Date().toISOString().slice(0, 10), vulnerabilidade: "media_vulnerabilidade", participanteNome: "", participanteCpf: "", participanteDataNascimento: "", conteudo: "" });
  const [confPartBusca, setConfPartBusca] = useState("");
  const [confPartOpen, setConfPartOpen] = useState(false);
  const [confPartFiltro, setConfPartFiltro] = useState<"todos" | "pec" | "inclusao" | "comunidade">("todos");

  // Registros gerais
  const [registrosSubTab, setRegistrosSubTab] = useState<"realizados" | "novo">("realizados");
  const [registroGeralForm, setRegistroGeralForm] = useState({ tipoGeral: "", categoria: "", data: new Date().toISOString().slice(0, 10), conteudo: "", participanteNome: "", participanteCpf: "" });

  // Atividades
  const [ativSubTab, setAtivSubTab] = useState<"lista" | "nova">("lista");
  const [ativForm, setAtivForm] = useState({ titulo: "", tipo: "", conteudo: "", data: new Date().toISOString().slice(0, 10) });

  const handleLogout = async () => {
    await logoutAndClearSession();
    setLocation("/login/coordenador");
  };

  const changeTab = (tab: Tab) => {
    setActiveTab(tab);
    setTimeout(() => {
      document.getElementById("tecnica-content")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // ─── QUERIES ───────────────────────────────────────────────────────────────

  const { data: dashStats } = useQuery({
    queryKey: ["/api/psico/dashboard-kpis", filtroAno, filtroMes],
    queryFn: async () => {
      const mesParam = filtroMes > 0 ? `&mes=${filtroMes}` : "";
      const res = await fetchApi(`/api/psico/dashboard-kpis?ano=${filtroAno}${mesParam}`, { credentials: "include" });
      if (!res.ok) return {};
      const json = await res.json().catch(() => ({}));
      const individual = json.atendimentos ?? 0;
      const demandas = json.demandasEspontaneas ?? 0;
      return {
        atendidosCpf: json.atendidos ?? 0,
        atendimentoTotal: individual + demandas,
        atendimentoIndividual: individual,
        visitaDomiciliar: json.visitas ?? 0,
        visitasPEC: json.visitasPEC ?? 0,
        visitasInclusao: json.visitasInclusao ?? 0,
        visitasDemandaEspontanea: json.visitasDemandaEspontanea ?? 0,
        atendimentoColetivo: json.atendimentosColetivos ?? 0,
        espacoOGrito: json.espacoOGrito ?? 0,
        workshop: json.workshop ?? 0,
        demandasEspontaneas: demandas,
        atendimentosPEC: json.atendimentosPEC ?? 0,
        atendimentosInclusao: json.atendimentosInclusao ?? 0,
        atendimentosDemandaEspontanea: json.atendimentosDemandaEspontanea ?? demandas,
        intervencoes: json.intervencoes ?? 0,
      };
    },
    enabled: !!authUserId,
  });

  const { data: monitorMetas } = useQuery<{ metas: Record<string, number> }>({
    queryKey: ["/api/metas-indicadores", filtroAno, "psico"],
    queryFn: () => fetch(`/api/metas-indicadores?ano=${filtroAno}&vertente=psico`).then(r => r.json()),
    staleTime: 60000,
  });

  // Atendidos (coordenador - todos)
  const { data: atendidosRegistrados = [], isLoading: loadingAtendidos } = useQuery({
    queryKey: ["/api/psico/coordenador/atendidos-registrados"],
    queryFn: async () => {
      const res = await fetchApi("/api/psico/coordenador/atendidos-registrados", { credentials: "include" });
      const json = await res.json().catch(() => ({ atendidos: [] }));
      return json.atendidos || [];
    },
    enabled: !!authUserId,
  });

  // Participantes para busca em formulários
  const { data: todosParticipantes = [] } = useQuery({
    queryKey: ["/api/psico/participantes", psicoVertente],
    queryFn: async () => {
      const filtro = psicoVertente === "pec" ? "pec" : psicoVertente === "inclusao" ? "inclusao" : "todos";
      const res = await fetchApi(`/api/psico/participantes?filtro=${filtro}`, { credentials: "include" });
      const json = await res.json().catch(() => ({ participantes: [] }));
      return (json.participantes || []).map((a: any) => ({ ...a, __vertente: a.programa_origem || "pec", __nome: (a.nome || "-").replace(/^\s+|\s+$/g, "") }));
    },
    enabled: !!authUserId,
  });

  const { data: atendidosComunidade = [] } = useQuery({
    queryKey: ["/api/psico/atendidos-comunidade"],
    queryFn: async () => {
      const res = await fetchApi("/api/psico/atendidos-comunidade", { credentials: "include" });
      const json = await res.json().catch(() => []);
      return Array.isArray(json) ? json : [];
    },
    enabled: !!authUserId,
  });

  // Alunos por turma
  const { data: psicoAlunos = [], isLoading: loadingAlunos } = useQuery({
    queryKey: ["/api/psico/alunos-turmas", authUserId],
    queryFn: async () => {
      const res = await fetchApi("/api/psico/alunos-turmas", { credentials: "include" });
      if (!res.ok) return [];
      const json = await res.json().catch(() => []);
      return Array.isArray(json) ? json : (json?.data ?? []);
    },
    enabled: !!authUserId && activeTab === "alunos",
  });

  // Chamadas / frequência
  const { data: chamadaTurmas = [] } = useQuery({
    queryKey: ["/api/tecnica/chamada-turmas", chamadaPrograma],
    queryFn: async () => {
      if (chamadaPrograma === "pec") {
        const res = await fetchApi("/api/pec/instances", { credentials: "include" });
        const json = await res.json().catch(() => []);
        return Array.isArray(json) ? json.map((t: any) => ({ id: t.id, nome: t.name || t.titulo || `Turma ${t.id}` })) : [];
      }
      const res = await fetchApi("/api/turmas-inclusao", { credentials: "include" });
      const json = await res.json().catch(() => []);
      const arr = Array.isArray(json) ? json : (json?.data ?? []);
      return arr.map((t: any) => ({ id: t.id, nome: t.nome || `Turma ${t.id}` }));
    },
    enabled: activeTab === "frequencia",
  });

  const { data: chamadasData = { chamadas: [] } } = useQuery({
    queryKey: ["/api/psico/chamadas", chamadaPrograma, chamadaTurmaId],
    queryFn: async () => {
      let url = `/api/psico/chamadas?programa=${chamadaPrograma}`;
      if (chamadaTurmaId) url += `&turmaId=${chamadaTurmaId}`;
      const res = await fetchApi(url, { credentials: "include" });
      const json = await res.json().catch(() => ({ chamadas: [] }));
      return json;
    },
    enabled: !!authUserId && activeTab === "frequencia",
  });
  const historicoChamadas = (chamadasData as any)?.chamadas || [];

  // Registros Confidenciais (coordenador - todos)
  const { data: registrosConf = [], isLoading: loadingConf, refetch: refetchConf } = useQuery({
    queryKey: ["/api/psico/coordenador/registros-confidenciais", psicoVertente],
    queryFn: async () => {
      const res = await fetchApi(`/api/psico/coordenador/registros-confidenciais?vertente=${psicoVertente}`, { credentials: "include" });
      const json = await res.json().catch(() => []);
      return Array.isArray(json) ? json : [];
    },
    enabled: !!authUserId && (activeTab === "confidencial" || activeTab === "atendidos"),
  });

  // Registros Gerais (coordenador - todos)
  const { data: registrosGerais = [], isLoading: loadingGerais, refetch: refetchGerais } = useQuery({
    queryKey: ["/api/psico/coordenador/registros-gerais"],
    queryFn: async () => {
      const res = await fetchApi("/api/psico/coordenador/registros-gerais", { credentials: "include" });
      const json = await res.json().catch(() => []);
      return Array.isArray(json) ? json : [];
    },
    enabled: !!authUserId && activeTab === "registros",
  });

  // Atividades/Intervenções
  const { data: atividades = [], isLoading: loadingAtividades, refetch: refetchAtividades } = useQuery({
    queryKey: ["/api/psico/intervencoes", filtroAno, filtroMes],
    queryFn: async () => {
      const mesParam = filtroMes > 0 ? `&mes=${filtroMes}` : "";
      const res = await fetchApi(`/api/psico/intervencoes?ano=${filtroAno}${mesParam}`, { credentials: "include" });
      const json = await res.json().catch(() => []);
      return Array.isArray(json) ? json : [];
    },
    enabled: !!authUserId && activeTab === "atividades",
  });

  // Acompanhamentos pedagógicos
  const { data: acompanhamentos = [] } = useQuery({
    queryKey: ["/api/professor/acompanhamentos/all"],
    queryFn: async () => {
      const res = await fetchApi("/api/professor/acompanhamentos/all");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: activeTab === "acompanhamentos",
  });

  // ─── MUTATIONS ──────────────────────────────────────────────────────────────

  const criarConfMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetchApi("/api/psico/coordenador/registros-confidenciais", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro ao salvar" }));
        throw new Error(err.error || "Erro ao salvar");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Registro salvo!" });
      setConfSubTab("realizados");
      setConfForm({ tipo: "atendimento_individual", data: new Date().toISOString().slice(0, 10), vulnerabilidade: "media_vulnerabilidade", participanteNome: "", participanteCpf: "", participanteDataNascimento: "", conteudo: "" });
      refetchConf();
    },
    onError: (error: any) => toast({ title: "Erro ao salvar registro", description: error.message || "Tente novamente.", variant: "destructive" }),
  });

  const criarGeralMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetchApi("/api/psico/coordenador/registros-gerais", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Registro salvo!" });
      setRegistrosSubTab("realizados");
      setRegistroGeralForm({ tipoGeral: "", categoria: "", data: new Date().toISOString().slice(0, 10), conteudo: "", participanteNome: "", participanteCpf: "" });
      refetchGerais();
    },
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });

  const criarAtividadeMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetchApi("/api/psico/intervencoes", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, monitorId: authUserId }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Atividade registrada!" });
      setAtivSubTab("lista");
      setAtivForm({ titulo: "", tipo: "", conteudo: "", data: new Date().toISOString().slice(0, 10) });
      refetchAtividades();
    },
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });

  // ─── HELPERS ────────────────────────────────────────────────────────────────

  const periodoFiltro: PeriodoFiltro = filtroMes === 0 ? "todos" : [filtroMes];
  const mesesParaMeta = periodoQtdMesesParaMeta(periodoFiltro);
  const prorateMeta = (anual: number) =>
    mesesParaMeta ? Math.round((anual / 11) * mesesParaMeta) : anual;
  const metaAtend = prorateMeta(monitorMetas?.metas?.atendimentos ?? 250);
  const metaVisitas = prorateMeta(monitorMetas?.metas?.visitas ?? 250);
  const metaEspaco = metaEspacoGritoPeriodo(periodoFiltro);
  const stats = dashStats as any ?? {};

  const todosParaConf = [
    ...(todosParticipantes as any[]),
    ...(atendidosComunidade as any[]).map((p: any) => ({ __nome: p.nome, cpf: p.cpf, __vertente: "comunidade" })),
  ];

  const tipoLabel: Record<string, string> = {
    atendimento_individual: "Atendimento Individual", visita_domiciliar: "Visita Domiciliar",
    atendimento_coletivo: "Atendimento Coletivo", espaco_o_grito: "Espaço O Grito",
    acoes_saude: "Ações para Saúde", encaminhamento: "Encaminhamento",
    situacao_risco: "Situação de Risco", contato_familiar: "Contato Familiar",
    relato_espontaneo: "Relato Espontâneo", observacao_comportamental: "Observação Comportamental",
    outro: "Outro",
  };
  const vulnLabel: Record<string, string> = {
    baixa_vulnerabilidade: "Baixa Vulnerabilidade", media_vulnerabilidade: "Média Vulnerabilidade",
    alta_vulnerabilidade: "Alta Vulnerabilidade",
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  if (consentChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
      </div>
    );
  }
  if (!consentReady) {
    return (
      <AreaConsentGate area="employees" onAccept={() => setConsentReady()} onNavigate={setLocation} />
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 px-4 py-4 md:px-6 border-l-4 border-l-violet-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Técnica Psicossocial</h1>
              <p className="text-slate-400">Bem-vinda, {userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="border-violet-500 text-violet-400">
              💜 Psicossocial
            </Badge>
            <Select value={psicoVertente} onValueChange={(v: any) => setPsicoVertente(v)}>
              <SelectTrigger className="w-40 bg-slate-800 border-slate-600 text-slate-200">
                <SelectValue placeholder="Vertente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pec">PEC</SelectItem>
                <SelectItem value="inclusao">Inclusão</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:px-6 md:py-8 space-y-6">
        <PushNotificationSettings variant="panel" className="max-w-xl" />
        <LgpdMeusDadosSettingsPanel className="max-w-xl" />

        {/* Dashboard KPIs */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900 shadow-xl p-3 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-10 rounded-full bg-gradient-to-b from-violet-500 to-blue-400" />
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Visão Geral</h2>
                <p className="text-sm text-slate-400 font-medium">Técnica Psicossocial</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={filtroAno}
                  onChange={(e) => setFiltroAno(Number(e.target.value))}
                  className="text-sm border border-slate-600 rounded-lg px-2 py-1.5 bg-slate-800 text-slate-200 focus:outline-none"
                >
                  {Array.from({ length: new Date().getFullYear() - 2024 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <select
                  value={filtroMes}
                  onChange={(e) => setFiltroMes(Number(e.target.value))}
                  className="text-sm border border-slate-600 rounded-lg px-2 py-1.5 bg-slate-800 text-slate-200 focus:outline-none max-w-[130px]"
                >
                  <option value={0}>Todos os meses</option>
                  {["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"].map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
            <DarkMetricCard icon={UserCheck} label="Atendidos" value={stats.atendidosCpf ?? atendidosRegistrados.length} accentColor="#f97316" />
            <DarkMetricCard icon={User} label="Atendimentos" value={stats.atendimentoTotal ?? 0} accentColor="#3b82f6" meta={metaAtend} metaLabel={String(metaAtend)} onClick={() => setShowAtendBreakdown(true)} subtitle="Clique p/ detalhar" />
            <DarkMetricCard icon={Home} label="Visitas" value={stats.visitaDomiciliar ?? 0} accentColor="#06b6d4" meta={metaVisitas} metaLabel={String(metaVisitas)} onClick={() => setShowVisitasBreakdown(true)} subtitle="Clique p/ detalhar" />
            <DarkMetricCard icon={Activity} label="Intervenções" value={stats.intervencoes ?? 0} accentColor="#8b5cf6" onClick={() => changeTab("atividades")} subtitle="Clique p/ ver" />
            <DarkMetricCard icon={Activity} label="Espaço O Grito" value={stats.espacoOGrito ?? 0} accentColor="#a855f7" meta={metaEspaco} metaLabel={String(metaEspaco)} />
            <DarkMetricCard icon={BookOpen} label="Workshop" value={stats.workshop ?? 0} accentColor="#f59e0b" />
          </div>
        </div>

        {/* Modais de breakdown */}
        {showAtendBreakdown && dashStats && (
          <PsicoAtendBreakdownModal
            data={{ atendimentos: stats.atendimentoTotal ?? 0, atendimentosPEC: stats.atendimentosPEC ?? 0, atendimentosInclusao: stats.atendimentosInclusao ?? 0, atendimentosDemandaEspontanea: stats.atendimentosDemandaEspontanea ?? 0 } as any}
            onClose={() => setShowAtendBreakdown(false)}
          />
        )}
        {showVisitasBreakdown && dashStats && (
          <PsicoVisitasBreakdownModal
            data={{ visitasDomiciliares: stats.visitaDomiciliar ?? 0, visitasPEC: stats.visitasPEC ?? 0, visitasInclusao: stats.visitasInclusao ?? 0, visitasDemandaEspontanea: stats.visitasDemandaEspontanea ?? 0 } as any}
            onClose={() => setShowVisitasBreakdown(false)}
          />
        )}

        {/* Navegação - Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Atendidos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserCheck className="w-5 h-5 text-indigo-500" />
                Atendidos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className={`w-full ${activeTab === "atendidos" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500" : ""}`} variant="outline" onClick={() => changeTab("atendidos")}>
                <UserCheck className="w-4 h-4 mr-2" /> Ver Atendidos
              </Button>
              <Button className={`w-full ${activeTab === "alunos" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500" : ""}`} variant="outline" onClick={() => changeTab("alunos")}>
                <Users className="w-4 h-4 mr-2" /> Alunos
              </Button>
              <Button className={`w-full ${activeTab === "demanda" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500" : ""}`} variant="outline" onClick={() => changeTab("demanda")}>
                <MessageSquare className="w-4 h-4 mr-2" /> Atendidos Comunidade
              </Button>
            </CardContent>
          </Card>

          {/* Registros */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="w-5 h-5 text-violet-500" />
                Registros Psicossociais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className={`w-full ${activeTab === "confidencial" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500" : ""}`} variant="outline" onClick={() => changeTab("confidencial")}>
                <Lock className="w-4 h-4 mr-2" /> Registros Confidenciais
              </Button>
              <Button className={`w-full ${activeTab === "registros" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500" : ""}`} variant="outline" onClick={() => changeTab("registros")}>
                <FileText className="w-4 h-4 mr-2" /> Registros Gerais
              </Button>
            </CardContent>
          </Card>

          {/* Presença e Atividades */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                Presença e Atividades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className={`w-full ${activeTab === "frequencia" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500" : ""}`} variant="outline" onClick={() => changeTab("frequencia")}>
                <CheckCircle className="w-4 h-4 mr-2" /> Controle de Presença
              </Button>
              <Button className={`w-full ${activeTab === "atividades" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500" : ""}`} variant="outline" onClick={() => changeTab("atividades")}>
                <Activity className="w-4 h-4 mr-2" /> Registros de Intervenções
              </Button>
            </CardContent>
          </Card>

          {/* Acompanhamentos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="w-5 h-5 text-pink-500" />
                Acompanhamentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className={`w-full ${activeTab === "acompanhamentos" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500" : ""}`} variant="outline" onClick={() => changeTab("acompanhamentos")}>
                <Heart className="w-4 h-4 mr-2" /> Acompanhamentos
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo dinâmico */}
        <div id="tecnica-content" className="bg-white rounded-xl border border-gray-200 p-6">

          {/* ATENDIDOS */}
          {activeTab === "atendidos" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input placeholder="Buscar atendido por nome ou CPF..." value={buscaAtendido} onChange={(e) => setBuscaAtendido(e.target.value)} className="pl-10" />
                </div>
                <div className="flex items-center gap-1">
                  {(["todos", "pec", "inclusao", "comunidade"] as const).map((f) => (
                    <Button key={f} size="sm" variant="outline"
                      className={`text-xs px-3 ${f === "pec" && filtroAtendidosVertente === f ? "bg-yellow-500 hover:bg-yellow-600 border-yellow-500" : f === "inclusao" && filtroAtendidosVertente === f ? "bg-green-600 hover:bg-green-700 border-green-600 text-white" : f === "comunidade" && filtroAtendidosVertente === f ? "bg-blue-600 hover:bg-blue-700 border-blue-600 text-white" : f === "todos" && filtroAtendidosVertente === f ? "bg-gray-200" : ""}`}
                      onClick={() => setFiltroAtendidosVertente(f)}>
                      {f === "todos" ? "Todos" : f === "pec" ? "PEC" : f === "inclusao" ? "Inclusão" : "Comunidade"}
                    </Button>
                  ))}
                </div>
              </div>
              {loadingAtendidos ? (
                <div className="text-center py-6 text-gray-500">Carregando atendidos...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Atendimentos</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const filtered = (atendidosRegistrados as any[]).filter((a: any) => {
                        if (buscaAtendido.trim()) {
                          const t = buscaAtendido.toLowerCase();
                          if (!(a.nome || "").toLowerCase().includes(t) && !(a.cpf || "").includes(buscaAtendido)) return false;
                        }
                        if (filtroAtendidosVertente !== "todos") {
                          const atends: any[] = a.atendimentos || [];
                          if (filtroAtendidosVertente === "comunidade") {
                            if (!atends.some((at: any) => at.vertente === "comunidade" || typeof at.id === "string")) return false;
                          } else {
                            if (!atends.some((at: any) => at.vertente === filtroAtendidosVertente)) return false;
                          }
                        }
                        return true;
                      }).sort((a: any, b: any) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"));
                      if (filtered.length === 0) return (
                        <TableRow><TableCell colSpan={4} className="text-center text-gray-500 py-8">Nenhum atendido encontrado.</TableCell></TableRow>
                      );
                      return filtered.map((a: any) => (
                        <TableRow key={a.id} className="cursor-pointer hover:bg-violet-50" onClick={() => setPerfilAberto(a)}>
                          <TableCell className="font-medium">{a.nome || "-"}</TableCell>
                          <TableCell className="text-sm text-gray-500">{formatCPF(a.cpf)}</TableCell>
                          <TableCell><Badge className="bg-violet-100 text-violet-800">{a.totalAtendimentos} registro(s)</Badge></TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setPerfilAberto(a); }}>
                              <Eye className="w-4 h-4 mr-1" /> Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              )}
            </div>
          )}

          {/* ALUNOS */}
          {activeTab === "alunos" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-base font-bold text-gray-900">Alunos com Vínculo em Turma</h3>
                <div className="flex items-center gap-1">
                  {(["todos", "pec", "inclusao"] as const).map((f) => (
                    <Button key={f} size="sm" variant="outline"
                      className={`text-xs px-3 ${f === "pec" && psicoAlunosFiltro === f ? "bg-yellow-500 hover:bg-yellow-600 border-yellow-500" : f === "inclusao" && psicoAlunosFiltro === f ? "bg-green-600 hover:bg-green-700 border-green-600 text-white" : f === "todos" && psicoAlunosFiltro === f ? "bg-gray-200" : ""}`}
                      onClick={() => setPsicoAlunosFiltro(f)}>
                      {f === "todos" ? "Todos" : f === "pec" ? "PEC" : "Inclusão Produtiva"}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input placeholder="Buscar aluno por nome ou CPF..." value={psicoAlunosBusca} onChange={(e) => setPsicoAlunosBusca(e.target.value)} className="pl-10" />
              </div>
              {loadingAlunos ? (
                <div className="text-center py-10 text-gray-500">Carregando alunos...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Turmas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const busca = psicoAlunosBusca.toLowerCase().trim();
                      const filtered = (psicoAlunos as any[]).filter((a: any) => {
                        if (psicoAlunosFiltro === "pec" && a.programa !== "pec") return false;
                        if (psicoAlunosFiltro === "inclusao" && a.programa !== "inclusao") return false;
                        if (!busca) return true;
                        return (a.nome || "").toLowerCase().includes(busca) || (a.cpf || "").includes(busca);
                      }).sort((a: any, b: any) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"));
                      if (filtered.length === 0) return (
                        <TableRow><TableCell colSpan={4} className="text-center text-gray-500 py-8">Nenhum aluno encontrado.</TableCell></TableRow>
                      );
                      return filtered.map((a: any) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">{a.nome || "-"}</TableCell>
                          <TableCell className="text-sm font-mono text-gray-700">{formatCPF(a.cpf)}</TableCell>
                          <TableCell className="text-sm text-gray-600">{a.telefone || "-"}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(a.turmas || []).map((t: any, ti: number) => (
                                <Badge key={ti} variant="outline" className={`text-xs ${a.programa === "pec" ? "border-yellow-400 text-yellow-700 bg-yellow-50" : "border-green-400 text-green-700 bg-green-50"}`}>{t.nome}</Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              )}
            </div>
          )}

          {/* FREQUÊNCIA */}
          {activeTab === "frequencia" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700">Programa:</span>
                <Button size="sm" variant="outline" className={chamadaPrograma === "pec" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500" : ""} onClick={() => { setChamadaPrograma("pec"); setChamadaTurmaId(""); }}>PEC</Button>
                <Button size="sm" variant="outline" className={chamadaPrograma === "inclusao" ? "bg-green-600 text-white hover:bg-green-700" : ""} onClick={() => { setChamadaPrograma("inclusao"); setChamadaTurmaId(""); }}>Inclusão Produtiva</Button>
              </div>
              {!chamadaTurmaId ? (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Turmas — {chamadaPrograma === "pec" ? "PEC" : "Inclusão Produtiva"}</h3>
                  <input type="text" placeholder="Buscar turma..." value={chamadaBusca} onChange={(e) => setChamadaBusca(e.target.value)} className="w-full px-3 py-2 mb-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                  {(chamadaTurmas as any[]).length > 0 ? (
                    <div className="space-y-1">
                      {(chamadaTurmas as any[]).filter((t: any) => !chamadaBusca || (t.nome || "").toLowerCase().includes(chamadaBusca.toLowerCase())).map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer hover:bg-gray-50" onClick={() => setChamadaTurmaId(String(t.id))}>
                          <span className="font-medium text-gray-800 text-sm">{t.nome || `Turma ${t.id}`}</span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400 border rounded-lg">Nenhuma turma encontrada</div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Button size="sm" variant="ghost" onClick={() => { setChamadaTurmaId(""); setChamadaExpandida(null); }} className="px-2">
                      <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                    </Button>
                    <h3 className="font-semibold text-gray-800">{(chamadaTurmas as any[]).find((t: any) => String(t.id) === chamadaTurmaId)?.nome || "Turma"}</h3>
                  </div>
                  {historicoChamadas.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 border rounded-lg">Nenhuma chamada registrada para esta turma</div>
                  ) : (
                    <div className="space-y-2">
                      {historicoChamadas.map((c: any, i: number) => (
                        <div key={c.id || i} className="border rounded-lg overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100" onClick={() => setChamadaExpandida(chamadaExpandida === c.id ? null : c.id)}>
                            <span className="text-sm font-medium">{c.data}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-sm">
                                <span className="text-green-600 font-medium">{c.presentes || 0}</span>
                                <span className="text-gray-400"> / </span>
                                <span className="text-gray-600">{c.total || 0}</span>
                              </span>
                              <span className="text-xs text-gray-400">{chamadaExpandida === c.id ? "▲" : "▼"}</span>
                            </div>
                          </div>
                          {chamadaExpandida === c.id && c.presencas && (
                            <div className="border-t">
                              {[...c.presencas].sort((a: any, b: any) => (a.nome || "").localeCompare(b.nome || "", "pt-BR")).map((p: any, pi: number) => (
                                <div key={p.alunoCpf || pi} className={`flex items-center justify-between px-4 py-2 border-b last:border-b-0 text-sm ${p.presente ? "bg-green-50" : "bg-red-50"}`}>
                                  <span>{(p.nome || "Sem nome").replace(/^\s+|\s+$/g, "")}</span>
                                  <Badge variant="outline" className={p.presente ? "border-green-500 text-green-600" : "border-red-500 text-red-600"}>
                                    {p.presente ? "Presente" : p.justificativa ? `Falta — ${p.justificativa}` : "Falta"}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ATIVIDADES / INTERVENÇÕES */}
          {activeTab === "atividades" && (
            <div className="space-y-4">
              <div className="flex gap-2 border-b pb-2">
                <button onClick={() => setAtivSubTab("lista")} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${ativSubTab === "lista" ? "bg-violet-100 text-violet-700 border-b-2 border-violet-600" : "text-gray-500 hover:text-gray-700"}`}>Atividades Realizadas</button>
                <button onClick={() => setAtivSubTab("nova")} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${ativSubTab === "nova" ? "bg-violet-100 text-violet-700 border-b-2 border-violet-600" : "text-gray-500 hover:text-gray-700"}`}>Registrar Nova</button>
              </div>
              {ativSubTab === "nova" && (
                <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-violet-800">Registrar Atividade</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Título</label>
                      <Input value={ativForm.titulo} onChange={(e) => setAtivForm({ ...ativForm, titulo: e.target.value })} placeholder="Ex: Roda de conversa sobre ansiedade" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Tipo</label>
                      <Select value={ativForm.tipo} onValueChange={(v) => setAtivForm({ ...ativForm, tipo: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="roda_de_conversa">Roda de Conversa</SelectItem>
                          <SelectItem value="atendimento_grupo">Atendimento em Grupo</SelectItem>
                          <SelectItem value="acao_socioemocional">Ação Socioemocional</SelectItem>
                          <SelectItem value="palestra">Palestra</SelectItem>
                          <SelectItem value="visita_domiciliar">Visita Domiciliar</SelectItem>
                          <SelectItem value="encaminhamento">Encaminhamento</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Data</label>
                      <Input type="date" value={ativForm.data} onChange={(e) => setAtivForm({ ...ativForm, data: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Descrição</label>
                    <Textarea rows={4} value={ativForm.conteudo} onChange={(e) => setAtivForm({ ...ativForm, conteudo: e.target.value })} placeholder="Descreva a atividade realizada..." />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setAtivSubTab("lista")}>Cancelar</Button>
                    <Button size="sm" className="bg-violet-600 hover:bg-violet-700"
                      disabled={!ativForm.titulo || !ativForm.tipo || !ativForm.data || criarAtividadeMutation.isPending}
                      onClick={() => criarAtividadeMutation.mutate(ativForm)}>
                      {criarAtividadeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                      Salvar
                    </Button>
                  </div>
                </div>
              )}
              {ativSubTab === "lista" && (
                loadingAtividades ? (
                  <div className="text-center py-6 text-gray-500">Carregando...</div>
                ) : (atividades as any[]).length === 0 ? (
                  <div className="text-center py-8 text-gray-400 border rounded-lg">Nenhuma atividade registrada ainda.</div>
                ) : (
                  <div className="space-y-3">
                    {(atividades as any[]).map((a: any) => (
                      <div key={a.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                          <span className="font-medium text-sm">{a.titulo || a.tipo || "Atividade"}</span>
                          <div className="flex gap-2">
                            {a.tipo && <span className="text-xs bg-violet-100 text-violet-700 rounded px-2 py-0.5 capitalize">{a.tipo.replace(/_/g, " ")}</span>}
                            {a.data && <span className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">{new Date(a.data + (a.data.includes("T") ? "" : "T12:00:00")).toLocaleDateString("pt-BR")}</span>}
                          </div>
                        </div>
                        {a.conteudo && <p className="text-sm text-gray-700 whitespace-pre-wrap mt-1">{a.conteudo}</p>}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}

          {/* REGISTROS GERAIS */}
          {activeTab === "registros" && (
            <div className="space-y-4">
              <div className="flex gap-2 mb-2">
                <Button size="sm" variant="outline" className={registrosSubTab === "realizados" ? "bg-blue-600 text-white hover:bg-blue-700" : ""} onClick={() => setRegistrosSubTab("realizados")}>Realizados</Button>
                <Button size="sm" variant="outline" className={registrosSubTab === "novo" ? "bg-blue-600 text-white hover:bg-blue-700" : ""} onClick={() => setRegistrosSubTab("novo")}><Plus className="w-4 h-4 mr-1" /> Novo Registro</Button>
              </div>
              {registrosSubTab === "novo" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-blue-800">Novo Registro Geral</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Tipo</label>
                      <Select value={registroGeralForm.tipoGeral} onValueChange={(v) => setRegistroGeralForm({ ...registroGeralForm, tipoGeral: v, categoria: "" })}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="atendimento_coletivo">Atendimento Coletivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {registroGeralForm.tipoGeral && (
                      <div>
                        <label className="text-sm font-medium mb-1 block">Categoria</label>
                        <Select value={registroGeralForm.categoria} onValueChange={(v) => setRegistroGeralForm({ ...registroGeralForm, categoria: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="espaco_o_grito">Espaço O Grito</SelectItem>
                            <SelectItem value="caravana_comunitaria">Caravana Comunitária</SelectItem>
                            <SelectItem value="workshop">Workshop</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium mb-1 block">Data</label>
                      <Input type="date" value={registroGeralForm.data} onChange={(e) => setRegistroGeralForm({ ...registroGeralForm, data: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Descrição</label>
                    <Textarea rows={3} value={registroGeralForm.conteudo} onChange={(e) => setRegistroGeralForm({ ...registroGeralForm, conteudo: e.target.value })} placeholder="Descreva o registro..." />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setRegistrosSubTab("realizados")}>Cancelar</Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700"
                      disabled={!registroGeralForm.tipoGeral || !registroGeralForm.categoria || !registroGeralForm.conteudo || !registroGeralForm.data || criarGeralMutation.isPending}
                      onClick={() => criarGeralMutation.mutate({ tipo: registroGeralForm.tipoGeral, categoria: registroGeralForm.categoria, conteudo: registroGeralForm.conteudo, data: registroGeralForm.data })}>
                      {criarGeralMutation.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </div>
              )}
              {registrosSubTab === "realizados" && (
                loadingGerais ? (
                  <div className="text-center py-6 text-gray-500">Carregando...</div>
                ) : (registrosGerais as any[]).length === 0 ? (
                  <div className="text-center py-8 text-gray-400 border rounded-lg">Nenhum registro ainda</div>
                ) : (
                  <div className="space-y-2">
                    {(registrosGerais as any[]).map((r: any) => {
                      const catLabel: Record<string, string> = { atendimento_coletivo: "Atendimento Coletivo", espaco_o_grito: "Espaço O Grito", caravana_comunitaria: "Caravana Comunitária", workshop: "Workshop" };
                      return (
                        <div key={r.id} className="border rounded-lg p-3 space-y-1 bg-white">
                          <div className="flex items-center gap-2 flex-wrap">
                            {r.categoria && <Badge variant="outline" className="text-xs text-blue-700 border-blue-300">{catLabel[r.categoria] || r.categoria}</Badge>}
                            {r.data && <span className="text-xs text-gray-400">{new Date(r.data + (r.data.includes("T") ? "" : "T12:00:00")).toLocaleDateString("pt-BR")}</span>}
                            {r.monitorNome && <span className="text-xs text-gray-500 ml-auto">por {r.monitorNome}</span>}
                          </div>
                          <p className="text-sm text-gray-700">{r.conteudo}</p>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          )}

          {/* CONFIDENCIAL */}
          {activeTab === "confidencial" && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <strong>Importante:</strong> Registros confidenciais são visíveis apenas para monitores e técnicas psicossociais e coordenadores psicossociais.
              </div>
              <div className="flex gap-2 mb-2">
                <Button size="sm" variant="outline" className={confSubTab === "realizados" ? "bg-violet-600 text-white hover:bg-violet-700" : ""} onClick={() => setConfSubTab("realizados")}>Registros Realizados</Button>
                <Button size="sm" variant="outline" className={confSubTab === "novo" ? "bg-violet-600 text-white hover:bg-violet-700" : ""} onClick={() => setConfSubTab("novo")}><Plus className="w-4 h-4 mr-1" /> Novo Registro</Button>
              </div>
              {confSubTab === "novo" && (
                <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-violet-800">Novo Registro Confidencial</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Tipo de Atendimento</label>
                      <Select value={confForm.tipo} onValueChange={(v) => setConfForm({ ...confForm, tipo: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="visita_domiciliar">Visita Domiciliar</SelectItem>
                          <SelectItem value="situacao_risco">Situação de Risco</SelectItem>
                          <SelectItem value="encaminhamento">Encaminhamento</SelectItem>
                          <SelectItem value="atendimento_individual">Atendimento Individual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Data</label>
                      <Input type="date" value={confForm.data} onChange={(e) => setConfForm({ ...confForm, data: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Vulnerabilidade</label>
                      <Select value={confForm.vulnerabilidade} onValueChange={(v) => setConfForm({ ...confForm, vulnerabilidade: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixa_vulnerabilidade">Baixa Vulnerabilidade</SelectItem>
                          <SelectItem value="media_vulnerabilidade">Média Vulnerabilidade</SelectItem>
                          <SelectItem value="alta_vulnerabilidade">Alta Vulnerabilidade</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="relative">
                      <label className="text-sm font-medium mb-1 block">Participante <span className="text-red-500">*</span></label>
                      <Input
                        value={confPartOpen ? confPartBusca : confForm.participanteNome}
                        onChange={(e) => { setConfPartBusca(e.target.value); setConfPartOpen(true); setConfForm({ ...confForm, participanteNome: e.target.value, participanteCpf: "" }); }}
                        onFocus={() => { setConfPartOpen(true); setConfPartBusca(confForm.participanteNome || ""); }}
                        onBlur={() => setTimeout(() => setConfPartOpen(false), 200)}
                        placeholder="Buscar por nome ou CPF"
                      />
                      {confPartOpen && (() => {
                        const filtrados = todosParaConf.filter((p: any) => {
                          if (confPartFiltro !== "todos") { const v = p.__vertente || "pec"; if (v !== confPartFiltro) return false; }
                          if (!confPartBusca.trim()) return true;
                          return (p.__nome || p.nome || "").toLowerCase().includes(confPartBusca.toLowerCase()) || (p.cpf || "").includes(confPartBusca);
                        });
                        return (
                          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                            <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50 sticky top-0">
                              {(["todos", "pec", "inclusao", "comunidade"] as const).map((f) => (
                                <button key={f} type="button" className={`text-xs px-2 py-0.5 rounded border transition-colors ${confPartFiltro === f ? "bg-violet-600 text-white border-violet-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"}`} onMouseDown={(e) => { e.preventDefault(); setConfPartFiltro(f); }}>
                                  {f === "todos" ? "Todos" : f === "pec" ? "PEC" : f === "inclusao" ? "Inclusão" : "Comunidade"}
                                </button>
                              ))}
                            </div>
                            {filtrados.slice(0, 20).map((p: any, i: number) => (
                              <button key={p.id || i} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-violet-50 flex items-center gap-2 border-b border-gray-50 last:border-0"
                                onClick={() => { const nome = p.__nome || p.nome || ""; const cpf = p.cpf || ""; setConfForm({ ...confForm, participanteNome: nome, participanteCpf: cpf }); setConfPartBusca(nome); setConfPartOpen(false); }}>
                                <span className="font-medium text-gray-900">{p.__nome || p.nome}</span>
                                {p.cpf && <span className="text-xs text-gray-400">{formatCPF(p.cpf)}</span>}
                                <span className="text-xs text-gray-400 ml-auto">{p.__vertente === "comunidade" ? "Comunidade" : p.__vertente === "inclusao" ? "Inclusão" : "PEC"}</span>
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                      {confForm.participanteNome && confForm.participanteCpf && !confPartOpen && (
                        <p className="text-xs text-green-600 mt-1">✓ CPF vinculado: {confForm.participanteCpf}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Descrição / Conteúdo</label>
                    <Textarea rows={5} value={confForm.conteudo} onChange={(e) => setConfForm({ ...confForm, conteudo: e.target.value })} placeholder="Descreva em detalhes o atendimento..." />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setConfSubTab("realizados")}>Cancelar</Button>
                    <Button size="sm" className="bg-violet-600 hover:bg-violet-700"
                      disabled={!confForm.vulnerabilidade || !confForm.conteudo || !confForm.participanteNome || criarConfMutation.isPending}
                      onClick={() => criarConfMutation.mutate(confForm)}>
                      {criarConfMutation.isPending ? "Salvando..." : "Salvar Registro"}
                    </Button>
                  </div>
                </div>
              )}
              {confSubTab === "realizados" && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input value={confSearch} onChange={(e) => setConfSearch(e.target.value)} placeholder="Pesquisar por nome do participante..." className="pl-9" />
                  </div>
                  {loadingConf ? (
                    <div className="text-center py-6 text-gray-500">Carregando registros...</div>
                  ) : (() => {
                    const allR = (registrosConf as any[]);
                    const grouped: Record<string, any[]> = {};
                    allR.forEach((r: any) => {
                      const nome = (r.participanteNome || "").trim();
                      if (!nome) return;
                      if (!grouped[nome]) grouped[nome] = [];
                      grouped[nome].push(r);
                    });
                    const names = Object.keys(grouped).sort((a, b) => a.localeCompare(b, "pt-BR"));
                    const filtered = confSearch.trim() ? names.filter(n => n.toLowerCase().includes(confSearch.toLowerCase())) : names;
                    if (filtered.length === 0) return <div className="text-center py-8 text-gray-400 border rounded-lg">Nenhum registro encontrado.</div>;
                    return (
                      <div className="space-y-4">
                        {filtered.map(nome => (
                          <div key={nome} className="border rounded-lg overflow-hidden">
                            <div className="bg-violet-50 px-4 py-2 border-b">
                              <span className="font-semibold text-violet-900">{nome}</span>
                              <Badge className="ml-2 bg-violet-100 text-violet-700 text-xs">{grouped[nome].length} registro(s)</Badge>
                              {grouped[nome][0]?.participanteCpf && <span className="text-xs text-gray-500 ml-2">{formatCPF(grouped[nome][0].participanteCpf)}</span>}
                            </div>
                            <div className="divide-y">
                              {grouped[nome].sort((a: any, b: any) => (b.data || "").localeCompare(a.data || "")).map((r: any) => (
                                <div key={r.id} className="px-4 py-3 space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {r.tipo && <Badge variant="outline" className="text-xs">{tipoLabel[r.tipo] || r.tipo}</Badge>}
                                    {r.vulnerabilidade && <Badge variant="outline" className={`text-xs ${r.vulnerabilidade === "alta_vulnerabilidade" ? "border-red-300 text-red-700" : r.vulnerabilidade === "media_vulnerabilidade" ? "border-yellow-300 text-yellow-700" : "border-green-300 text-green-700"}`}>{vulnLabel[r.vulnerabilidade] || r.vulnerabilidade}</Badge>}
                                    {r.data && <span className="text-xs text-gray-400">{new Date(r.data + (r.data.includes("T") ? "" : "T12:00:00")).toLocaleDateString("pt-BR")}</span>}
                                    {r.monitorNome && <span className="text-xs text-gray-500 ml-auto">por {r.monitorNome}</span>}
                                  </div>
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.conteudo}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* DEMANDA ESPONTÂNEA */}
          {activeTab === "demanda" && (
            <AtendidosComunidadeSection
              userId={String(authUserId || "")}
              userRole="monitor_psico"
            />
          )}

          {/* ACOMPANHAMENTOS */}
          {activeTab === "acompanhamentos" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Observações pedagógicas registradas pelos professores sobre os alunos.</p>
              {(acompanhamentos as any[]).length === 0 ? (
                <div className="text-center py-10 text-gray-400 border rounded-lg">Nenhum acompanhamento registrado ainda.</div>
              ) : (
                <div className="space-y-3">
                  {(acompanhamentos as any[]).map((ac: any) => (
                    <div key={ac.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                        <span className="font-medium text-sm">{ac.titulo || "Acompanhamento"}</span>
                        <div className="flex gap-2 flex-wrap">
                          {ac.tipoObservacao && <span className="text-xs bg-blue-100 text-blue-700 rounded px-2 py-0.5 capitalize">{ac.tipoObservacao}</span>}
                          {ac.data && <span className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">{new Date(ac.data + (ac.data.includes("T") ? "" : "T12:00:00")).toLocaleDateString("pt-BR")}</span>}
                        </div>
                      </div>
                      {ac.alunoCpf && <p className="text-xs text-blue-600 mb-1">Aluno CPF: {ac.alunoCpf}</p>}
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{ac.observacoes}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-slate-500 text-sm">Técnica Psicossocial • Instituto O Grito</p>
        </div>
      </div>

      {/* Modal Perfil */}
      {perfilAberto && (
        <PsicoPerfilModal
          atendido={perfilAberto}
          onClose={() => setPerfilAberto(null)}
          registrosConf={registrosConf as any[]}
        />
      )}
    </div>
  );
}
