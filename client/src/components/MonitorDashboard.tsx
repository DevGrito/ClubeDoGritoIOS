import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  BookOpen,
  Calendar,
  Target,
  Activity,
  TrendingUp,
  GraduationCap,
  Briefcase,
  HeartHandshake,
  CheckCircle,
  Clock,
  BarChart3,
  Percent,
  Filter,
  X,
  ChevronDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import DashboardPeriodoFiltro from "@/components/dashboard/DashboardPeriodoFiltro";
import {
  buildPeriodoQueryString,
  filterByPeriodo,
  type PeriodoFiltro,
} from "@/lib/dashboardPeriodoFiltro";

const useAnimatedCounter = (endValue: number, duration: number = 1200) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (endValue === 0) {
      setCount(0);
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min(
        (timestamp - startTimeRef.current) / duration,
        1,
      );
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(easeOutQuart * endValue);

      if (currentValue !== countRef.current) {
        countRef.current = currentValue;
        setCount(currentValue);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    startTimeRef.current = null;
    requestAnimationFrame(animate);
  }, [endValue, duration]);

  return count;
};

const AnimatedNumber = ({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) => {
  const animated = useAnimatedCounter(value);
  return (
    <span>
      {animated.toLocaleString("pt-BR")}
      {suffix}
    </span>
  );
};

type MetricCardProps = {
  icon: any;
  label: string;
  value: number;
  suffix?: string;
  color: string;
  bgColor: string;
  borderColor: string;
};

function MetricCard({
  icon: Icon,
  label,
  value,
  suffix = "",
  color,
  bgColor,
  borderColor,
}: MetricCardProps) {
  return (
    <div
      className={`rounded-xl p-4 border ${bgColor} ${borderColor} flex items-center gap-3 transition-all hover:shadow-md`}
    >
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        <p className="text-xl font-bold text-gray-900">
          <AnimatedNumber value={value} suffix={suffix} />
        </p>
      </div>
    </div>
  );
}

function DarkMetricCard({ icon: Icon, label, value, suffix = "", colorRgb, onClick }: { icon: any; label: string; value: number; suffix?: string; colorRgb: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-4 ${onClick ? "cursor-pointer hover:brightness-110" : ""} relative`}
      style={{ background: `rgba(${colorRgb},0.15)`, border: `1px solid rgba(${colorRgb},0.3)` }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" style={{ color: `rgba(${colorRgb},0.95)` }} />
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: `rgba(${colorRgb},0.85)` }}>{label}</span>
      </div>
      <div className="text-3xl font-bold text-white"><AnimatedNumber value={value} suffix={suffix} /></div>
      {onClick && <ChevronDown className="absolute bottom-2 right-2 w-3 h-3 text-slate-500" />}
    </div>
  );
}

type FrequencyBarProps = {
  label: string;
  value: number;
  total: number;
  color: string;
};

function FrequencyBar({ label, value, total, color }: FrequencyBarProps) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600 truncate">{label}</span>
        <span className="font-semibold text-gray-800">
          {pct}% ({value}/{total})
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

type MonitorDashboardProps = {
  vertente: "pec" | "inclusao" | "psico";
  dashboardData?: any;
  alunosPec?: any[];
  participantesInclusao?: any[];
  monitorGruposData?: any[];
  gruposInclusaoData?: any[];
  atividadesData?: any[];
  historicoChamadas?: any[];
  psicoAtendidos?: any[];
  psicoTurmas?: any[];
  psicoHistoricoChamadas?: any[];
  psicoAtividades?: any[];
  psicoRegistrosConf?: any[];
  isLoading?: boolean;
  titulo?: string;
  onFilterChange?: (ano: number, periodo: PeriodoFiltro) => void;
  filtroAno?: number;
  filtroPeriodo?: PeriodoFiltro;
  meusAlunos?: number;
  alunosFormados?: number;
  alunosEmFormacao?: number;
  frequenciaMedia?: number;
  filterByTurmas?: boolean;
};

function FilterBar({
  ano,
  periodo,
  onFilterChange,
}: {
  ano: number;
  periodo: PeriodoFiltro;
  onFilterChange: (ano: number, periodo: PeriodoFiltro) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Filter className="w-3.5 h-3.5" />
        <span>Filtrar:</span>
      </div>
      <DashboardPeriodoFiltro
        ano={ano}
        periodo={periodo}
        onChange={onFilterChange}
        minAno={2026}
        variant="light"
      />
    </div>
  );
}

const VERTENTE_CONFIG = {
  pec: {
    title: "PEC - Polo Esportivo Cultural",
    accent: "orange",
    gradientFrom: "from-orange-500",
    gradientTo: "to-amber-400",
    bgAccent: "bg-orange-50",
    borderAccent: "border-orange-200",
    textAccent: "text-orange-600",
  },
  inclusao: {
    title: "Inclusão Produtiva",
    accent: "green",
    gradientFrom: "from-green-500",
    gradientTo: "to-emerald-400",
    bgAccent: "bg-green-50",
    borderAccent: "border-green-200",
    textAccent: "text-green-600",
  },
  psico: {
    title: "Psicossocial",
    accent: "purple",
    gradientFrom: "from-purple-500",
    gradientTo: "to-violet-400",
    bgAccent: "bg-purple-50",
    borderAccent: "border-purple-200",
    textAccent: "text-purple-600",
  },
};

const PIE_COLORS = ["#f97316", "#10b981", "#8b5cf6", "#3b82f6", "#ef4444", "#eab308"];

// ── Modal dark de detalhamento de atendidos ──────────────────────────────────
function DarkBreakdownModal({
  porPrograma, porGenero, porFaixaEtaria, porRacaCor, total, onClose,
}: {
  porPrograma: {name:string;value:number}[];
  porGenero: {name:string;value:number}[];
  porFaixaEtaria: {name:string;value:number}[];
  porRacaCor: {name:string;value:number}[];
  total: number;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"programa"|"genero"|"faixa"|"raca">("programa");
  const tabs = [
    { key: "programa" as const, label: "Por Programa" },
    { key: "genero" as const, label: "Por Gênero" },
    { key: "faixa" as const, label: "Faixa Etária" },
    { key: "raca" as const, label: "Raça/Cor" },
  ];
  const chartMap = { programa: porPrograma, genero: porGenero, faixa: porFaixaEtaria, raca: porRacaCor };
  const currentData = (chartMap[activeTab] || []).filter(d => d.value > 0);
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:w-[95vw] max-w-5xl h-[90vh] sm:h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-700 shrink-0">
          <div>
            <h3 className="text-base sm:text-xl font-bold text-white">Detalhamento de Atendidos</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Total de atendidos: <span className="font-semibold text-orange-400">{total.toLocaleString("pt-BR")}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="flex gap-1.5 px-4 sm:px-5 py-2 sm:py-3 bg-slate-800 border-b border-slate-700 overflow-x-auto shrink-0">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.key ? "bg-orange-500 text-white shadow-sm" : "text-slate-400 hover:bg-slate-700"}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-900">
          {currentData.length > 0 ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <div className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={currentData} dataKey="value" cx="50%" cy="50%" innerRadius="20%" outerRadius="45%" paddingAngle={2}
                      label={({ name, value, percent, cx, cy, midAngle, outerRadius: oR }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = oR * 1.35;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return <text x={x} y={y} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={11} fontWeight={600} fill="#e2e8f0">{`${name}: ${value} (${(percent*100).toFixed(0)}%)`}</text>;
                      }}
                      labelLine={{ stroke: "#475569", strokeWidth: 1 }}
                    >
                      {currentData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [v, "Quantidade"]} contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Users className="w-16 h-16 mx-auto mb-3 text-slate-700" />
              <p className="text-lg">Sem dados disponíveis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal dark de turmas totais ───────────────────────────────────────────────
function DarkTurmasModal({
  ativas, concluidas, onClose,
}: {
  ativas: {nome: string; projeto?: string}[];
  concluidas: {nome: string; projeto?: string}[];
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"ativas"|"concluidas">("ativas");
  const lista = activeTab === "ativas" ? ativas : concluidas;
  const total = ativas.length + concluidas.length;
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:w-[95vw] max-w-2xl h-[85vh] sm:h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-700 shrink-0">
          <div>
            <h3 className="text-base sm:text-xl font-bold text-white">Minhas Turmas Totais</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Total: <span className="font-semibold text-orange-400">{total}</span>
              <span className="mx-2 text-slate-600">|</span>
              Ativas: <span className="font-semibold text-emerald-400">{ativas.length}</span>
              <span className="mx-2 text-slate-600">|</span>
              Concluídas: <span className="font-semibold text-slate-400">{concluidas.length}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="flex gap-1.5 px-4 sm:px-5 py-2 sm:py-3 bg-slate-800 border-b border-slate-700 shrink-0">
          <button onClick={() => setActiveTab("ativas")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "ativas" ? "bg-emerald-500 text-white" : "text-slate-400 hover:bg-slate-700"}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Turmas Ativas ({ativas.length})
          </button>
          <button onClick={() => setActiveTab("concluidas")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "concluidas" ? "bg-slate-600 text-white" : "text-slate-400 hover:bg-slate-700"}`}>
            <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> Turmas Concluídas ({concluidas.length})
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 sm:p-5 bg-slate-900">
          {lista.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-700" />
              <p>Nenhuma turma {activeTab === "ativas" ? "ativa" : "concluída"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lista.map((turma, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 border border-slate-700">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${activeTab === "ativas" ? "bg-emerald-400" : "bg-slate-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{turma.nome}</p>
                    {turma.projeto && <p className="text-xs text-slate-500 truncate">{turma.projeto}</p>}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${activeTab === "ativas" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-400"}`}>
                    {activeTab === "ativas" ? "Ativa" : "Concluída"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MonitorDashboard({
  vertente,
  dashboardData,
  alunosPec = [],
  participantesInclusao = [],
  monitorGruposData = [],
  gruposInclusaoData = [],
  atividadesData = [],
  historicoChamadas = [],
  psicoAtendidos = [],
  psicoTurmas = [],
  psicoHistoricoChamadas = [],
  psicoAtividades = [],
  psicoRegistrosConf = [],
  isLoading = false,
  titulo,
  onFilterChange,
  filtroAno,
  filtroPeriodo = "todos",
  meusAlunos,
  alunosFormados,
  alunosEmFormacao,
  frequenciaMedia,
  filterByTurmas = false,
}: MonitorDashboardProps) {
  const config = VERTENTE_CONFIG[vertente];
  const ano = filtroAno ?? new Date().getFullYear();
  const periodo = filtroPeriodo ?? "todos";

  if (isLoading) {
    return (
      <div className={`rounded-2xl border ${config.borderAccent} ${config.bgAccent} p-6 mb-6`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`h-8 w-48 bg-gray-200 rounded animate-pulse`} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white/60 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const painelTitulo = titulo || "Painel do Monitor";
  const filterProps = onFilterChange ? { ano, periodo, onFilterChange } : null;

  if (vertente === "pec") {
    return <PecDashboard config={config} dashboardData={dashboardData} alunosPec={alunosPec} monitorGruposData={monitorGruposData} atividadesData={atividadesData} historicoChamadas={historicoChamadas} titulo={painelTitulo} filterProps={filterProps} filtroAno={ano} filtroPeriodo={periodo} meusAlunos={meusAlunos} alunosFormados={alunosFormados} filterByTurmas={filterByTurmas} />;
  }

  if (vertente === "inclusao") {
    return <InclusaoDashboard config={config} participantesInclusao={participantesInclusao} gruposInclusaoData={gruposInclusaoData} monitorGruposData={monitorGruposData} atividadesData={atividadesData} historicoChamadas={historicoChamadas} titulo={painelTitulo} filterProps={filterProps} filtroAno={ano} filtroPeriodo={periodo} meusAlunos={meusAlunos} alunosFormados={alunosFormados} alunosEmFormacao={alunosEmFormacao} frequenciaMedia={frequenciaMedia} filterByTurmas={filterByTurmas} />;
  }

  return <PsicoDashboard config={config} psicoAtendidos={psicoAtendidos} psicoTurmas={psicoTurmas} psicoHistoricoChamadas={psicoHistoricoChamadas} psicoAtividades={psicoAtividades} psicoRegistrosConf={psicoRegistrosConf} titulo={painelTitulo} filterProps={filterProps} filtroAno={ano} filtroPeriodo={periodo} />;
}

function PecDashboard({
  config,
  dashboardData,
  alunosPec,
  monitorGruposData,
  atividadesData,
  historicoChamadas,
  titulo = "Painel do Monitor",
  filterProps,
  filtroAno,
  filtroPeriodo = "todos",
  meusAlunos,
  alunosFormados,
  filterByTurmas = false,
}: any) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showTurmas, setShowTurmas] = useState(false);
  const [showAllTurmas, setShowAllTurmas] = useState(false);

  const ano = filtroAno ?? new Date().getFullYear();
  const periodo: PeriodoFiltro = filtroPeriodo ?? filterProps?.periodo ?? "todos";

  // KPIs canônicos do backend (fonte única de verdade)
  // Usa queryKey com URL completa p/ o fetcher padrão adicionar x-user-id header
  const allTurmasForFilter = Array.isArray(monitorGruposData) ? monitorGruposData : [];
  const hasNoTurmas = filterByTurmas && allTurmasForFilter.length === 0;
  const turmaIdsParam = filterByTurmas && allTurmasForFilter.length > 0
    ? `&turmaIds=${allTurmasForFilter.map((t: any) => t.id).join(',')}`
    : '';
  const pecKpisUrl = `/api/pec/dashboard-kpis${buildPeriodoQueryString(ano, periodo)}${turmaIdsParam}`;
  const { data: pecKpis, isLoading: pecKpisLoading } = useQuery<any>({
    queryKey: [pecKpisUrl],
    staleTime: 60000,
    refetchInterval: 120000,
    enabled: !hasNoTurmas,
  });

  const allAlunos = filterByPeriodo(Array.isArray(alunosPec) ? alunosPec : [], ano, periodo);
  const totalAlunos = allAlunos.length;
  // Atendidos: fonte canônica filtrada por período (nunca usa meusAlunos/totalAlunos não-filtrados)
  const totalAtendidos = pecKpis?.atendidos ?? 0;

  const allTurmas = Array.isArray(monitorGruposData) ? monitorGruposData : [];
  const inativaStatuses = ["inativo", "finalizado", "concluido", "concluída"];
  const turmasAtivasList = allTurmas
    .filter((g: any) => !inativaStatuses.includes((g.status || "").toLowerCase()))
    .map((g: any) => ({ nome: g.nome || g.name || "Turma", projeto: g.projeto || g.programa || g.projeto_nome }));
  const turmasConcluidasList = allTurmas
    .filter((g: any) => inativaStatuses.includes((g.status || "").toLowerCase()))
    .map((g: any) => ({ nome: g.nome || g.name || "Turma", projeto: g.projeto || g.programa || g.projeto_nome }));
  const totalTurmas = allTurmas.length;
  const totalAtividades = Array.isArray(atividadesData) ? atividadesData.length : 0;

  const chamadas = filterByPeriodo(Array.isArray(historicoChamadas) ? historicoChamadas : [], ano, periodo);
  const totalChamadas = chamadas.length;
  const totalPresentes = chamadas.reduce((sum: number, c: any) => {
    const presencas = c.presencas || c.presencaList || [];
    return sum + presencas.filter((p: any) => p.presente || p.status === 'falta_justificada' || p.status === 'presente' || (!p.presente && p.justificativa && p.justificativa !== 'Sem justificativa')).length;
  }, 0);
  const totalRegistrosPresenca = chamadas.reduce((sum: number, c: any) => {
    const presencas = c.presencas || c.presencaList || [];
    return sum + presencas.length;
  }, 0);
  const localFreq = totalRegistrosPresenca > 0 ? Math.round((totalPresentes / totalRegistrosPresenca) * 100) : (dashboardData?.frequenciaMedia ?? 0);
  // Frequência: usa fonte canônica (sessions JSON, exclui falta_justificada) ou fallback local
  const taxaFrequencia = hasNoTurmas ? 0 : (pecKpis?.frequenciaMedia ?? localFreq);

  // Dados demográficos a partir de alunosPec
  function groupBy(arr: any[], fn: (item: any) => string): {name: string; value: number}[] {
    const map: Record<string, number> = {};
    for (const item of arr) {
      const key = fn(item) || "Não informado";
      map[key] = (map[key] || 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }
  function calcFaixaEtaria(dataNasc: string): string {
    if (!dataNasc) return "Não informado";
    const age = new Date().getFullYear() - new Date(dataNasc).getFullYear();
    if (age < 12) return "< 12 anos";
    if (age < 18) return "12-17 anos";
    if (age < 25) return "18-24 anos";
    if (age < 35) return "25-34 anos";
    if (age < 50) return "35-49 anos";
    return "50+ anos";
  }
  const porGenero = groupBy(allAlunos, a => a.genero || a.gender);
  const porRacaCor = groupBy(allAlunos, a => a.cor_raca || a.raca_cor || a.raca || a.cor);
  const porFaixaEtaria = groupBy(allAlunos, a => calcFaixaEtaria(a.data_nascimento || a.dataNascimento));
  const porPrograma = groupBy(allAlunos, a => a.programa || a.projeto || a.projeto_nome || "PEC");

  const turmasComAlunosSorted = allTurmas.map((g: any) => ({
    name: (g.nome || g.name || "").substring(0, 22),
    alunos: g.totalAlunos || g.alunos || g.total_alunos || 0,
  })).filter((t: any) => t.name).sort((a: any, b: any) => b.alunos - a.alunos);
  const turmasComAlunos = showAllTurmas ? turmasComAlunosSorted : turmasComAlunosSorted.slice(0, 5);

  return (
    <>
      <div className="rounded-2xl p-5 mb-6" style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'}}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-8 rounded-full bg-gradient-to-b ${config.gradientFrom} ${config.gradientTo}`} />
            <div>
              <h2 className="text-lg font-bold text-white">{titulo}</h2>
              <p className={`text-xs ${config.textAccent} font-medium`}>{config.title}</p>
            </div>
          </div>
          {filterProps && <FilterBar {...filterProps} />}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <DarkMetricCard icon={Users} label="Atendidos" value={totalAtendidos} colorRgb="234,88,12" onClick={() => setShowBreakdown(true)} />
          <DarkMetricCard icon={BookOpen} label="Minhas Turmas Totais" value={totalTurmas} colorRgb="59,130,246" onClick={() => setShowTurmas(true)} />
          <DarkMetricCard icon={Activity} label="Oficinas/Atividades" value={totalAtividades} colorRgb="16,185,129" />
          <DarkMetricCard icon={Percent} label="Frequência Média" value={taxaFrequencia} suffix="%" colorRgb="245,158,11" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {turmasComAlunos.length > 0 && (
            <div className="rounded-xl p-4 border border-slate-700 bg-slate-800/50 md:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-orange-400" />
                  Alunos por Turma
                  <span className="text-xs text-slate-500 font-normal">
                    {showAllTurmas ? `(${turmasComAlunosSorted.length} turmas)` : `(top 5 de ${turmasComAlunosSorted.length})`}
                  </span>
                </p>
                {turmasComAlunosSorted.length > 5 && (
                  <button
                    onClick={() => setShowAllTurmas(v => !v)}
                    className="text-xs text-orange-400 hover:text-orange-300 border border-orange-400/30 hover:border-orange-300/50 rounded-md px-2 py-1 transition-colors"
                  >
                    {showAllTurmas ? '▲ Ver menos' : `▼ Ver todas (${turmasComAlunosSorted.length})`}
                  </button>
                )}
              </div>
              <div style={{ height: Math.max(200, turmasComAlunos.length * 48) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={turmasComAlunos} layout="vertical" margin={{ top: 4, right: 40, left: 4, bottom: 4 }} barCategoryGap="35%">
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#cbd5e1' }} width={140} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 8 }} />
                    <Bar dataKey="alunos" fill="#f97316" radius={[0, 6, 6, 0]} barSize={20} label={{ position: 'right', fontSize: 11, fill: '#94a3b8' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="rounded-xl p-4 border border-slate-700 bg-slate-800/50">
            <p className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Resumo Geral
            </p>
            <div className="space-y-2">
              <FrequencyBar label="Presença" value={totalPresentes} total={totalRegistrosPresenca} color="bg-green-500" />
              <div className="flex justify-between text-xs pt-1 border-t border-slate-700 mt-2">
                <span className="text-slate-400">Total de chamadas</span>
                <span className="font-semibold text-slate-200">{totalChamadas}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Turmas totais</span>
                <span className="font-semibold text-slate-200">{totalTurmas}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBreakdown && (
        <DarkBreakdownModal
          porPrograma={porPrograma}
          porGenero={porGenero}
          porFaixaEtaria={porFaixaEtaria}
          porRacaCor={porRacaCor}
          total={totalAtendidos}
          onClose={() => setShowBreakdown(false)}
        />
      )}
      {showTurmas && (
        <DarkTurmasModal
          ativas={turmasAtivasList}
          concluidas={turmasConcluidasList}
          onClose={() => setShowTurmas(false)}
        />
      )}
    </>
  );
}

function InclusaoDashboard({
  config,
  participantesInclusao,
  gruposInclusaoData,
  historicoChamadas,
  titulo = "Painel do Monitor",
  filterProps,
  filtroAno,
  filtroPeriodo = "todos",
  meusAlunos,
  alunosFormados,
  alunosEmFormacao,
  frequenciaMedia,
  filterByTurmas,
}: any) {
  const [showTurmasInclusao, setShowTurmasInclusao] = useState(false);

  const ano = filtroAno ?? new Date().getFullYear();
  const periodo: PeriodoFiltro = filtroPeriodo ?? filterProps?.periodo ?? "todos";

  const participantes = Array.isArray(participantesInclusao) ? participantesInclusao : [];

  // Para inclusão do professor, as turmas chegam em gruposInclusaoData.
  // monitorGruposData é usado nos fluxos de monitor/PEC.
  const turmasList = Array.isArray(gruposInclusaoData) ? gruposInclusaoData : [];
  const turmaIds = turmasList.map((t: any) => t.id).filter(Boolean);
  const hasNoTurmas = filterByTurmas && turmaIds.length === 0;

  const displayMeusAlunos = hasNoTurmas
    ? 0
    : (meusAlunos ?? participantes.filter((p: any) => p.hasTurma === true).length);
  const displayFormados = hasNoTurmas
    ? 0
    : (alunosFormados ?? 0);
  const displayEmFormacao = hasNoTurmas
    ? 0
    : (alunosEmFormacao ?? Math.max(0, displayMeusAlunos - displayFormados));

  const turmasMonitor = Array.isArray(gruposInclusaoData) ? gruposInclusaoData : [];
  const allTurmasInclusao = turmasMonitor;

  const chamadas = filterByPeriodo(Array.isArray(historicoChamadas) ? historicoChamadas : [], ano, periodo);
  const totalChamadas = chamadas.length;
  const totalPresentes = chamadas.reduce((sum: number, c: any) => {
    const presencas = c.presencas || c.presencaList || [];
    return sum + presencas.filter((p: any) => p.presente).length;
  }, 0);
  const totalRegistros = chamadas.reduce((sum: number, c: any) => {
    const presencas = c.presencas || c.presencaList || [];
    return sum + presencas.length;
  }, 0);
  const taxaFrequencia = hasNoTurmas
    ? 0
    : (frequenciaMedia ?? (totalRegistros > 0 ? Math.round((totalPresentes / totalRegistros) * 100) : 0));


  return (
    <>
    <div className="rounded-2xl p-5 mb-6" style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'}}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-8 rounded-full bg-gradient-to-b ${config.gradientFrom} ${config.gradientTo}`} />
          <div>
            <h2 className="text-lg font-bold text-white">{titulo}</h2>
            <p className={`text-xs ${config.textAccent} font-medium`}>{config.title}</p>
          </div>
        </div>
        {filterProps && <FilterBar {...filterProps} />}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <DarkMetricCard icon={Users} label="Atendidos" value={displayMeusAlunos} colorRgb="16,185,129" />
        <DarkMetricCard icon={BookOpen} label="Minhas Turmas Totais" value={allTurmasInclusao.length} colorRgb="59,130,246" onClick={() => setShowTurmasInclusao(true)} />
        <DarkMetricCard icon={GraduationCap} label="Alunos Formados" value={displayFormados} colorRgb="139,92,246" />
        <DarkMetricCard icon={Clock} label="Em Formação" value={displayEmFormacao} colorRgb="14,165,233" />
        <DarkMetricCard icon={Percent} label="Frequência Média" value={taxaFrequencia} suffix="%" colorRgb="20,184,166" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-4 border border-slate-700 bg-slate-800/50">
          <p className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Resumo Geral
          </p>
          <div className="space-y-2">
            <FrequencyBar label="Presença" value={totalPresentes} total={totalRegistros} color="bg-green-500" />
            <div className="flex justify-between text-xs pt-1 border-t border-slate-700 mt-2">
              <span className="text-slate-400">Total de chamadas</span>
              <span className="font-semibold text-slate-200">{totalChamadas}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Atendidos</span>
              <span className="font-semibold text-slate-200">{displayMeusAlunos}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Alunos formados</span>
              <span className="font-semibold text-slate-200">{displayFormados}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Em formação</span>
              <span className="font-semibold text-slate-200">{displayEmFormacao}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {showTurmasInclusao && (
      <DarkTurmasModal
        ativas={allTurmasInclusao
          .filter((t: any) => !["inativo","finalizado","concluido","concluída"].includes((t.status||"").toLowerCase()))
          .map((t: any) => ({ nome: t.nome || t.name || "Turma", projeto: t.programa || t.projeto }))}
        concluidas={allTurmasInclusao
          .filter((t: any) => ["inativo","finalizado","concluido","concluída"].includes((t.status||"").toLowerCase()))
          .map((t: any) => ({ nome: t.nome || t.name || "Turma", projeto: t.programa || t.projeto }))}
        onClose={() => setShowTurmasInclusao(false)}
      />
    )}
  </>
  );
}

function PsicoDashboard({
  config,
  psicoAtendidos,
  psicoTurmas,
  psicoHistoricoChamadas,
  psicoAtividades,
  psicoRegistrosConf,
  titulo = "Painel do Monitor",
  filterProps,
  filtroAno,
  filtroPeriodo = "todos",
}: any) {
  const ano = filtroAno ?? new Date().getFullYear();
  const periodo: PeriodoFiltro = filtroPeriodo ?? filterProps?.periodo ?? "todos";

  const atendidos = filterByPeriodo(Array.isArray(psicoAtendidos) ? psicoAtendidos : [], ano, periodo);
  const turmas = Array.isArray(psicoTurmas) ? psicoTurmas : [];
  const chamadas = filterByPeriodo(Array.isArray(psicoHistoricoChamadas) ? psicoHistoricoChamadas : [], ano, periodo);
  const atividades = filterByPeriodo(Array.isArray(psicoAtividades) ? psicoAtividades : [], ano, periodo);
  const registros = filterByPeriodo(Array.isArray(psicoRegistrosConf) ? psicoRegistrosConf : [], ano, periodo);

  const totalAtendidos = atendidos.length;
  const totalTurmas = turmas.length;
  const totalAtividades = atividades.length;
  const totalRegistros = registros.length;

  const totalPresentes = chamadas.reduce((sum: number, c: any) => {
    const presencas = c.presencas || c.presencaList || [];
    return sum + presencas.filter((p: any) => p.presente || p.status === 'falta_justificada' || (!p.presente && p.justificativa && p.justificativa !== 'Sem justificativa')).length;
  }, 0);
  const totalRegistrosPresenca = chamadas.reduce((sum: number, c: any) => {
    const presencas = c.presencas || c.presencaList || [];
    return sum + presencas.length;
  }, 0);
  const taxaFrequencia = totalRegistrosPresenca > 0 ? Math.round((totalPresentes / totalRegistrosPresenca) * 100) : 0;

  const vertentePec = atendidos.filter((a: any) => a.__vertente === "pec").length;
  const vertenteInclusao = atendidos.filter((a: any) => a.__vertente === "inclusao").length;
  const vertenteData = [
    { name: "PEC", value: vertentePec, color: "#f97316" },
    { name: "Inclusão", value: vertenteInclusao, color: "#10b981" },
  ].filter((d) => d.value > 0);

  const tipoRegistros = registros.reduce((acc: any, r: any) => {
    const tipo = r.tipo || "outro";
    const label = tipo === "atendimento_individual" ? "Atendimento" : tipo === "situacao_risco" ? "Risco" : tipo === "encaminhamento" ? "Encaminhamento" : "Outro";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
  const tipoRegistrosData = Object.entries(tipoRegistros).map(([name, value], i) => ({
    name,
    value: value as number,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <div className={`rounded-2xl border ${config.borderAccent} bg-white shadow-sm p-4 md:p-6 mb-6`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-8 rounded-full bg-gradient-to-b ${config.gradientFrom} ${config.gradientTo}`} />
          <div>
            <h2 className="text-lg font-bold text-gray-900">{titulo}</h2>
            <p className={`text-xs ${config.textAccent} font-medium`}>{config.title}</p>
          </div>
        </div>
        {filterProps && <FilterBar {...filterProps} />}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <MetricCard icon={HeartHandshake} label="Atendidos" value={totalAtendidos} color="bg-purple-500" bgColor="bg-purple-50" borderColor="border-purple-100" />
        <MetricCard icon={BookOpen} label="Turmas" value={totalTurmas} color="bg-blue-500" bgColor="bg-blue-50" borderColor="border-blue-100" />
        <MetricCard icon={Activity} label="Atividades" value={totalAtividades} color="bg-emerald-500" bgColor="bg-emerald-50" borderColor="border-emerald-100" />
        <MetricCard icon={Target} label="Registros Conf." value={totalRegistros} color="bg-red-500" bgColor="bg-red-50" borderColor="border-red-100" />
        <MetricCard icon={Percent} label="Frequência" value={taxaFrequencia} suffix="%" color="bg-amber-500" bgColor="bg-amber-50" borderColor="border-amber-100" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vertenteData.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              Atendidos por Vertente
            </p>
            <div className="flex items-center gap-4">
              <div className="h-28 w-28">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={vertenteData} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={45} paddingAngle={3}>
                      {vertenteData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {vertenteData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-gray-600">{d.name}:</span>
                    <span className="font-semibold">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Resumo
          </p>
          <div className="space-y-2">
            {chamadas.length > 0 && (
              <FrequencyBar label="Presença" value={totalPresentes} total={totalRegistrosPresenca} color="bg-purple-500" />
            )}
            <div className="flex justify-between text-xs pt-1 border-t border-gray-200 mt-2">
              <span className="text-gray-500">Chamadas realizadas</span>
              <span className="font-semibold">{chamadas.length}</span>
            </div>
            {tipoRegistrosData.length > 0 && (
              <>
                <div className="text-xs font-semibold text-gray-600 pt-1 border-t border-gray-200 mt-1">
                  Registros por Tipo:
                </div>
                {tipoRegistrosData.map((d, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-gray-500 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </span>
                    <span className="font-semibold">{d.value}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
