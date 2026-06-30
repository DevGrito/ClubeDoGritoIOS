import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  BookOpen,
  Activity,
  TrendingDown,
  TrendingUp,
  Briefcase,
  Percent,
  GraduationCap,
  Star,
  Clock,
  ChevronDown,
  X,
  Filter,
  Target,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Utensils,
  Home,
  Zap,
  Layers,
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
  metaEspacoGritoPeriodo,
  periodoQtdMesesParaMeta,
  type PeriodoFiltro,
} from "@/lib/dashboardPeriodoFiltro";

const useAnimatedCounter = (endValue: number, duration: number = 1200) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (endValue === 0) { setCount(0); return; }
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(easeOutQuart * endValue);
      if (currentValue !== countRef.current) { countRef.current = currentValue; setCount(currentValue); }
      if (progress < 1) { requestAnimationFrame(animate); } else { setCount(endValue); }
    };
    startTimeRef.current = null;
    requestAnimationFrame(animate);
  }, [endValue, duration]);

  return count;
};

const AnimatedNumber = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const animated = useAnimatedCounter(value);
  return <span>{animated.toLocaleString("pt-BR")}{suffix}</span>;
};

const PIE_COLORS = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#eab308", "#ec4899", "#06b6d4"];

type DashboardData = {
  totalAlunos: number;
  alunosAtivos: number;
  alunosInativos: number;
  horasAula: number;
  evasao: number;
  frequenciaMedia: number;
  alunosFormados: number;
  nps: number;
  atendimentos?: number;
  totalPresencas?: number;
  alimentacao?: number;
  demandasEspontaneas?: number;
  atendimentosPEC?: number;
  atendimentosInclusao?: number;
  atendimentosDemandaEspontanea?: number;
  geracaoRenda?: { total: number; empregabilidade: number; empreendedorismo: number };
  avaliacaoAprendizagem?: number;
  psicoFamilias?: number;
  psicoCasos?: number;
  visitasDomiciliares?: number;
  visitasPEC?: number;
  visitasInclusao?: number;
  visitasDemandaEspontanea?: number;
  porPrograma: { name: string; value: number }[];
  porGenero: { name: string; value: number }[];
  porFaixaEtaria: { name: string; value: number }[];
  porRacaCor: { name: string; value: number }[];
};

type TurmaDetalhe = { nome: string; projeto?: string };
type PecBreakdownMetric = "atendimentos" | "alimentacao" | "horaAula" | "frequencia";
type InclusaoBreakdownMetric = "atendimentos" | "alimentacao" | "horaAula" | "frequencia";

type CoordenadorDashboardProps = {
  data?: DashboardData;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onFilterChange?: (ano: number, periodo: PeriodoFiltro) => void;
  filtroAno?: number;
  filtroPeriodo?: PeriodoFiltro;
  ocultarFiltroPeriodo?: boolean;
  tipo?: "pec" | "inclusao" | "psico";
  titleOverride?: string;
  minAno?: number;
  turmasAtivasPec?: { totalAtivas: number; porProjeto: Array<{projeto: string; total: number}> };
  turmasDetalhadas?: { ativas: TurmaDetalhe[]; concluidas: TurmaDetalhe[] };
  metaGeracaoRenda?: number;
  metaFormados?: number;
  casasMapeadas?: number;
  moradasGeraisStats?: { total: number; porStatus: { label: string; value: number; color: string }[] };
};

// ── Metas padrão ────────────────────────────────────────────────────────────
const METAS = {
  frequencia: 85,
  evasao: 10,
  nps: 90,
  horasAula: 200,
};

type StatusNivel = "green" | "yellow" | "red" | "neutral";

function calcStatus(value: number, meta: number, inverso = false): StatusNivel {
  if (meta === 0) return "neutral";
  const ratio = inverso ? meta / Math.max(value, 0.01) : value / meta;
  if (ratio >= 1) return "green";
  if (ratio >= 0.8) return "yellow";
  return "red";
}

const STATUS_CONFIG = {
  green:   { border: "border-l-emerald-500", glow: "shadow-emerald-500/20", badge: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle2, label: "Na Meta" },
  yellow:  { border: "border-l-amber-400",   glow: "shadow-amber-400/20",   badge: "bg-amber-400/20  text-amber-300",   icon: AlertTriangle, label: "Atenção" },
  red:     { border: "border-l-red-500",     glow: "shadow-red-500/20",     badge: "bg-red-500/20    text-red-400",     icon: AlertTriangle, label: "< Meta" },
  neutral: { border: "border-l-slate-600",   glow: "shadow-slate-700/20",   badge: "bg-slate-600/40  text-slate-400",   icon: Target,        label: "—" },
};

// ── Card KPI escuro ──────────────────────────────────────────────────────────
export function DarkMetricCard({
  icon: Icon,
  label,
  value,
  suffix = "",
  meta,
  metaLabel,
  inverso = false,
  onClick,
  subItems,
  accentColor = "#f97316",
  subtitle,
}: {
  icon: any;
  label: string;
  value: number;
  suffix?: string;
  meta?: number;
  metaLabel?: string;
  inverso?: boolean;
  onClick?: () => void;
  subItems?: { label: string; value: number; dotColor: string }[];
  accentColor?: string;
  subtitle?: string;
}) {
  const status: StatusNivel = meta !== undefined ? calcStatus(value, meta, inverso) : "neutral";
  const cfg = STATUS_CONFIG[status];
  const StatusIcon = cfg.icon;

  const pct = meta
    ? inverso
      ? Math.min(100, Math.round((meta / Math.max(value, 0.01)) * 100))
      : Math.min(100, Math.round((value / meta) * 100))
    : null;

  const barColor =
    status === "green" ? "#10b981" :
    status === "yellow" ? "#f59e0b" :
    status === "red" ? "#ef4444" : "#64748b";

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-xl border border-slate-700 border-l-4 ${cfg.border}
        bg-gradient-to-br from-slate-800 to-slate-900
        shadow-lg ${cfg.glow}
        p-3 sm:p-4 transition-all duration-200
        hover:shadow-xl hover:scale-[1.01]
        ${onClick ? "cursor-pointer" : ""}
      `}
    >
      {/* Badge posicionado absolutamente no canto superior direito */}
      {status !== "neutral" && (
        <span className={`absolute top-2 right-2 text-[8px] sm:text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 whitespace-nowrap ${cfg.badge}`}>
          <StatusIcon className="w-2 h-2" />
          {cfg.label}
        </span>
      )}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accentColor}22`, border: `1px solid ${accentColor}44` }}
        >
          <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" style={{ color: accentColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium uppercase leading-tight tracking-wide">{label}</p>
          {subtitle && <p className="text-[9px] text-slate-500 mt-0.5 normal-case tracking-normal">{subtitle}</p>}
        </div>
      </div>

      <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">
        <AnimatedNumber value={value} suffix={suffix} />
      </p>

      {pct !== null && (
        <div className="mb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-slate-500">
              Meta: {metaLabel || `${meta}${suffix}`}
            </span>
            <span className="text-[10px] font-semibold" style={{ color: barColor }}>{pct}%</span>
          </div>
          <div className="h-1 rounded-full bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${pct}%`, backgroundColor: barColor }}
            />
          </div>
        </div>
      )}

      {subItems && subItems.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2 border-t border-slate-700/60 mt-1">
          {subItems.map((item, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.dotColor }} />
              <span className="text-[10px] text-slate-400">
                {item.label}: <span className="font-semibold text-slate-300">{item.value}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {onClick && (
        <ChevronDown className="absolute bottom-2 right-2 w-3 h-3 text-slate-600" />
      )}
    </div>
  );
}

// ── Modal de detalhamento de atendidos ──────────────────────────────────────
function BreakdownModal({ data, onClose, totalAtendidos }: { data: DashboardData; onClose: () => void; totalAtendidos?: number }) {
  const [activeTab, setActiveTab] = useState<"programa" | "genero" | "faixa" | "raca">("programa");

  const tabs = [
    { key: "programa" as const, label: "Por Programa" },
    { key: "genero" as const, label: "Por Gênero" },
    { key: "faixa" as const, label: "Faixa Etária" },
    { key: "raca" as const, label: "Raça/Cor" },
  ];

  const chartData = { programa: data.porPrograma, genero: data.porGenero, faixa: data.porFaixaEtaria, raca: data.porRacaCor };
  const currentData = chartData[activeTab].filter((d) => d.value > 0);
  const total = totalAtendidos ?? data.totalAlunos;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:w-[95vw] max-w-5xl h-[90vh] sm:h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-700 shrink-0">
          <div>
            <h3 className="text-base sm:text-xl font-bold text-white">Detalhamento de Atendidos</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Total de atendidos: <span className="font-semibold text-orange-400">{total.toLocaleString("pt-BR")}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="flex gap-1.5 px-4 sm:px-5 py-2 sm:py-3 bg-slate-800 border-b border-slate-700 overflow-x-auto shrink-0">
          {tabs.map((tab) => (
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
                        return (
                          <text x={x} y={y} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={11} fontWeight={600} fill="#e2e8f0">
                            {`${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                          </text>
                        );
                      }}
                      labelLine={{ stroke: "#475569", strokeWidth: 1 }}
                    >
                      {currentData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [value, "Quantidade"]}
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Users className="w-16 h-16 mx-auto mb-3 text-slate-700" />
              <p className="text-lg">Sem dados disponíveis para esta categoria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PecMetricBreakdownModal({
  ano,
  periodo,
  metric,
  onClose,
}: {
  ano: number;
  periodo: PeriodoFiltro;
  metric: PecBreakdownMetric;
  onClose: () => void;
}) {
  const qs = buildPeriodoQueryString(ano, periodo);
  const { data, isLoading } = useQuery<{
    success: boolean;
    data: {
      casaSonhar: { atendimentos: number; alimentacao: number; horaAula: number };
      programaEsporteCultura: { atendimentos: number; alimentacao: number; horaAula: number };
      serenata: { atendimentos: number; alimentacao?: number; horaAula: number };
    };
  }>({
    queryKey: ["/api/pec/dados-programas", ano, periodo],
    queryFn: () => fetch(`/api/pec/dados-programas${qs}`, { credentials: "include" }).then((r) => r.json()),
  });

  const config: Record<PecBreakdownMetric, { titulo: string; unidade: string; color: string }> = {
    atendimentos: { titulo: "Detalhamento de Atendimentos", unidade: "atendimentos", color: "#14b8a6" },
    alimentacao: { titulo: "Detalhamento de Alimentação", unidade: "alimentações", color: "#22c55e" },
    horaAula: { titulo: "Detalhamento de Hora-Aula", unidade: "horas", color: "#3b82f6" },
    frequencia: { titulo: "Detalhamento de Frequência", unidade: "%", color: "#10b981" },
  };

  const raw = data?.data;
  const chartData = [
    { name: "Polo Esportivo Cultural", value: Number(raw?.programaEsporteCultura?.[metric] ?? 0) },
    { name: "Casa Sonhar", value: Number(raw?.casaSonhar?.[metric] ?? 0) },
    { name: "Sala Serenata", value: Number(raw?.serenata?.[metric] ?? 0) },
  ].filter((d) => d.value > 0);
  const total = metric === "frequencia"
    ? (chartData.length > 0 ? Math.round(chartData.reduce((s, i) => s + i.value, 0) / chartData.length) : 0)
    : chartData.reduce((s, i) => s + i.value, 0);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:w-[95vw] max-w-5xl h-[90vh] sm:h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-700 shrink-0">
          <div>
            <h3 className="text-base sm:text-xl font-bold text-white">{config[metric].titulo}</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Total: <span className="font-semibold" style={{ color: config[metric].color }}>{total.toLocaleString("pt-BR")}</span> {config[metric].unidade}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-900">
          {isLoading ? (
            <div className="text-center py-12 text-slate-500">Carregando...</div>
          ) : chartData.length > 0 ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              {metric === "frequencia" ? (
                <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {chartData.map((item, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-700 bg-slate-800 p-4 text-center">
                      <p className="text-xs text-slate-400 mb-1">{item.name}</p>
                      <p className="text-2xl font-bold text-emerald-400">{item.value}%</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius="20%"
                        outerRadius="45%"
                        paddingAngle={2}
                        label={({ name, value, percent, cx, cy, midAngle, outerRadius: oR }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = oR * 1.35;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          return (
                            <text x={x} y={y} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={11} fontWeight={600} fill="#e2e8f0">
                              {`${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                            </text>
                          );
                        }}
                        labelLine={{ stroke: "#475569", strokeWidth: 1 }}
                      >
                        {chartData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [value, config[metric].unidade]}
                        contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Activity className="w-16 h-16 mx-auto mb-3 text-slate-700" />
              <p className="text-lg">Sem dados disponíveis para este indicador</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InclusaoMetricBreakdownModal({
  ano,
  periodo,
  metric,
  onClose,
}: {
  ano: number;
  periodo: PeriodoFiltro;
  metric: InclusaoBreakdownMetric;
  onClose: () => void;
}) {
  const qs = buildPeriodoQueryString(ano, periodo);
  const { data, isLoading } = useQuery<{
    success: boolean;
    programas: Array<{
      nome: string;
      atendimentos: number;
      alimentacao: number;
      horaAula: number;
      frequencia: number;
    }>;
  }>({
    queryKey: ["/api/inclusao-produtiva/breakdown-programas", ano, periodo],
    queryFn: () => fetch(`/api/inclusao-produtiva/breakdown-programas${qs}`, { credentials: "include" }).then((r) => r.json()),
  });

  const config: Record<InclusaoBreakdownMetric, { titulo: string; unidade: string; color: string }> = {
    atendimentos: { titulo: "Detalhamento de Atendimentos", unidade: "atendimentos", color: "#14b8a6" },
    alimentacao: { titulo: "Detalhamento de Alimentação", unidade: "alimentações", color: "#22c55e" },
    horaAula: { titulo: "Detalhamento de Hora-Aula", unidade: "horas", color: "#3b82f6" },
    frequencia: { titulo: "Detalhamento de Frequência", unidade: "%", color: "#10b981" },
  };

  const normalizeName = (name: string) => {
    const upper = (name || "").toUpperCase();
    if (upper.includes("LAB")) return "LAB. Vozes do Futuro";
    if (upper.includes("PRESENCIAL")) return "Cursos Presenciais";
    if (upper.includes("EAD")) return "Cursos EAD CGD";
    return name || "Outros";
  };

  const chartData = (data?.programas ?? [])
    .map((p) => ({
      name: normalizeName((p as any).nome),
      value: Number((p as any)[metric] ?? 0),
    }))
    .filter((d) => d.value > 0);
  const total = metric === "frequencia"
    ? (chartData.length > 0 ? Math.round(chartData.reduce((s, i) => s + i.value, 0) / chartData.length) : 0)
    : chartData.reduce((s, i) => s + i.value, 0);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:w-[95vw] max-w-5xl h-[90vh] sm:h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-700 shrink-0">
          <div>
            <h3 className="text-base sm:text-xl font-bold text-white">{config[metric].titulo}</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Total: <span className="font-semibold" style={{ color: config[metric].color }}>{total.toLocaleString("pt-BR")}</span> {config[metric].unidade}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-900">
          {isLoading ? (
            <div className="text-center py-12 text-slate-500">Carregando...</div>
          ) : chartData.length > 0 ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              {metric === "frequencia" ? (
                <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {chartData.map((item, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-700 bg-slate-800 p-4 text-center">
                      <p className="text-xs text-slate-400 mb-1">{item.name}</p>
                      <p className="text-2xl font-bold text-emerald-400">{item.value}%</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius="20%"
                        outerRadius="45%"
                        paddingAngle={2}
                        label={({ name, value, percent, cx, cy, midAngle, outerRadius: oR }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = oR * 1.35;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          return (
                            <text x={x} y={y} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={11} fontWeight={600} fill="#e2e8f0">
                              {`${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                            </text>
                          );
                        }}
                        labelLine={{ stroke: "#475569", strokeWidth: 1 }}
                      >
                        {chartData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [value, config[metric].unidade]}
                        contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Activity className="w-16 h-16 mx-auto mb-3 text-slate-700" />
              <p className="text-lg">Sem dados disponíveis para este indicador</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal de breakdown de atendimentos psico ────────────────────────────────
export function PsicoAtendBreakdownModal({ data, onClose }: { data: DashboardData; onClose: () => void }) {
  const total = data.atendimentos ?? 0;
  const pec   = data.atendimentosPEC ?? 0;
  const inc   = data.atendimentosInclusao ?? 0;
  const dem   = data.atendimentosDemandaEspontanea ?? 0;

  const items = [
    { label: "PEC", value: pec, color: "#f97316", icon: BookOpen },
    { label: "Inclusão Produtiva", value: inc, color: "#3b82f6", icon: Briefcase },
    { label: "Atendidos Comunidade", value: dem, color: "#10b981", icon: MessageCircle },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:w-[95vw] max-w-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-700">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Atendimentos por Origem</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Total: <span className="font-semibold text-blue-400">{total.toLocaleString("pt-BR")}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-4 sm:p-5 flex flex-col gap-3">
          {items.map(({ label, value, color, icon: Icon }) => {
            const pct = total > 0 ? Math.round((value / total) * 100) : 0;
            return (
              <div key={label} className="bg-slate-800 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}22` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-200">{label}</span>
                    <span className="text-sm font-bold text-white">{value.toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">{pct}% do total</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PsicoVisitasBreakdownModal({ data, onClose }: { data: DashboardData; onClose: () => void }) {
  const total = data.visitasDomiciliares ?? 0;
  const pec   = data.visitasPEC ?? 0;
  const inc   = data.visitasInclusao ?? 0;
  const com   = data.visitasDemandaEspontanea ?? 0;

  const items = [
    { label: "PEC", value: pec, color: "#f97316", icon: BookOpen },
    { label: "Inclusão Produtiva", value: inc, color: "#3b82f6", icon: Briefcase },
    { label: "Comunidade", value: com, color: "#10b981", icon: MessageCircle },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:w-[95vw] max-w-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-700">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Visitas por Origem</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Total: <span className="font-semibold text-cyan-400">{total.toLocaleString("pt-BR")}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-4 sm:p-5 flex flex-col gap-3">
          {items.map(({ label, value, color, icon: Icon }) => {
            const pct = total > 0 ? Math.round((value / total) * 100) : 0;
            return (
              <div key={label} className="bg-slate-800 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}22` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-200">{label}</span>
                    <span className="text-sm font-bold text-white">{value.toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">{pct}% do total</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function MoradasGeraisBreakdownModal({
  total,
  porStatus,
  onClose,
}: {
  total: number;
  porStatus: { label: string; value: number; color: string }[];
  onClose: () => void;
}) {
  const items = porStatus.filter((item) => item.value > 0);
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:w-[95vw] max-w-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-700">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Moradas Gerais por Status</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Total: <span className="font-semibold text-emerald-400">{total.toLocaleString("pt-BR")}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-4 sm:p-5 flex flex-col gap-3">
          {items.length > 0 ? (
            items.map(({ label, value, color }) => {
              const pct = total > 0 ? Math.round((value / total) * 100) : 0;
              return (
                <div key={label} className="bg-slate-800 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}22` }}>
                    <Home className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-slate-200">{label}</span>
                      <span className="text-sm font-bold text-white">{value.toLocaleString("pt-BR")}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">{pct}% do total</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">Sem reformas cadastradas no período.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal Evasão por Motivo ──────────────────────────────────────────────────
function EvasaoMotivoModal({ ano, periodo, onClose }: { ano: number; periodo: PeriodoFiltro; onClose: () => void }) {
  const qs = buildPeriodoQueryString(ano, periodo);
  const { data, isLoading } = useQuery<{
    motivos: { motivo: string; total: number; contaComoEvasao: boolean }[];
    totalEvadidos: number;
    totalMatriculas: number;
  }>({
    queryKey: ['/api/pec/evasao-motivos', ano, periodo],
    queryFn: () => fetch(`/api/pec/evasao-motivos${qs}`, { credentials: 'include' }).then(r => r.json()),
  });

  const contados = data?.motivos.filter(m => m.contaComoEvasao).reduce((s, m) => s + m.total, 0) ?? 0;
  const total = data?.totalEvadidos ?? 0;
  const matriculas = data?.totalMatriculas ?? 0;
  const pctEvasao = matriculas > 0 ? Math.round((contados / matriculas) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:w-[95vw] max-w-lg flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-700 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-400" /> Evasão — Detalhamento por Motivo
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {total} saídas registradas · {matriculas} matrículas totais
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-5 space-y-3">
          {isLoading && (
            <div className="text-center py-10 text-slate-400 text-sm">Carregando...</div>
          )}
          {!isLoading && (!data?.motivos || data.motivos.length === 0) && (
            <div className="text-center py-10 text-slate-500 text-sm">Nenhuma evasão registrada no período.</div>
          )}
          {!isLoading && data?.motivos.map((m, i) => (
            <div key={i} className={`p-3 rounded-xl border ${m.contaComoEvasao ? 'border-red-500/40 bg-red-500/10' : 'border-slate-700 bg-slate-800'}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${m.contaComoEvasao ? 'bg-red-400' : 'bg-slate-500'}`} />
                  <span className={`text-sm font-medium leading-snug ${m.contaComoEvasao ? 'text-red-300' : 'text-slate-400'}`}>{m.motivo}</span>
                </div>
                <span className={`text-base font-bold shrink-0 ${m.contaComoEvasao ? 'text-red-400' : 'text-slate-400'}`}>{m.total}</span>
              </div>
              {m.contaComoEvasao && (
                <p className="text-xs text-red-400/70 mt-1.5 ml-4">✓ Conta como evasão no indicador</p>
              )}
              {!m.contaComoEvasao && (
                <p className="text-xs text-slate-500 mt-1.5 ml-4">Não conta como evasão no indicador</p>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-700 bg-slate-800/50 rounded-b-2xl shrink-0">
          <p className="text-xs text-slate-400 leading-relaxed">
            <span className="text-white font-semibold">Como funciona:</span> apenas saídas com motivo{' '}
            <span className="text-red-300 font-medium">"Desistência da oficina/curso"</span> entram no cálculo do{' '}
            indicador de evasão ({pctEvasao}%). Os demais motivos são registrados mas não impactam a meta de evasão.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Modal Turmas Totais ──────────────────────────────────────────────────────
function TurmasTotaisModal({
  ativas,
  concluidas,
  onClose,
}: {
  ativas: TurmaDetalhe[];
  concluidas: TurmaDetalhe[];
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"ativas" | "concluidas">("ativas");
  const lista = activeTab === "ativas" ? ativas : concluidas;
  const total = ativas.length + concluidas.length;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:w-[95vw] max-w-2xl h-[85vh] sm:h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-700 shrink-0">
          <div>
            <h3 className="text-base sm:text-xl font-bold text-white">Turmas Totais</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Total: <span className="font-semibold text-orange-400">{total}</span>
              <span className="mx-2 text-slate-600">|</span>
              Ativas: <span className="font-semibold text-emerald-400">{ativas.length}</span>
              <span className="mx-2 text-slate-600">|</span>
              Concluídas: <span className="font-semibold text-slate-400">{concluidas.length}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex gap-1.5 px-4 sm:px-5 py-2 sm:py-3 bg-slate-800 border-b border-slate-700 shrink-0">
          <button
            onClick={() => setActiveTab("ativas")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "ativas" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-400 hover:bg-slate-700"}`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            Turmas Ativas ({ativas.length})
          </button>
          <button
            onClick={() => setActiveTab("concluidas")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "concluidas" ? "bg-slate-600 text-white shadow-sm" : "text-slate-400 hover:bg-slate-700"}`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
            Turmas Concluídas ({concluidas.length})
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-5 bg-slate-900">
          {lista.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-700" />
              <p>Nenhuma turma {activeTab === "ativas" ? "ativa" : "concluída"} encontrada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lista.map((turma, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 border border-slate-700">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${activeTab === "ativas" ? "bg-emerald-400" : "bg-slate-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{turma.nome}</p>
                    {turma.projeto && (
                      <p className="text-xs text-slate-500 truncate">{turma.projeto}</p>
                    )}
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

const DARK_TOOLTIP_STYLE = {
  backgroundColor: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 8,
  fontSize: 12,
  color: "#e2e8f0",
};


// ── Modal Geração de Renda ──────────────────────────────────────────────────
function GeracaoRendaModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"empregabilidade" | "empreendedorismo">("empregabilidade");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const { data: stats, isLoading } = useQuery<{ empresas: { empresa: string; total: number }[]; segmentos: { segmento: string; total: number }[] }>({
    queryKey: ["/api/geracoes-de-renda/stats"],
    queryFn: () => fetch("/api/geracoes-de-renda/stats", { credentials: "include" }).then(r => r.json()),
  });

  const toTitleCase = (str: string) =>
    (str || '').toLowerCase().split(' ').map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : w).join(' ');

  const wrapName = (name: string, max = 22): [string, string | null] => {
    if (name.length <= max) return [name, null];
    const cut = name.lastIndexOf(' ', max);
    if (cut <= 0) return [name.slice(0, max), name.slice(max)];
    return [name.slice(0, cut), name.slice(cut + 1)];
  };

  const empresaData = (stats?.empresas ?? []).map(e => ({ name: toTitleCase(e.empresa), total: e.total }));
  const segmentoData = (stats?.segmentos ?? []).map(s => ({ name: toTitleCase(s.segmento), total: s.total }));

  const WrapTick = ({ x, y, payload }: any) => {
    const [line1, line2] = wrapName(payload.value ?? '');
    const dy = line2 ? -6 : 4;
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={dy} textAnchor="end" fill="#e2e8f0" fontSize={12}>
          {line1}
        </text>
        {line2 && (
          <text x={0} y={0} dy={dy + 16} textAnchor="end" fill="#e2e8f0" fontSize={12}>
            {line2}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:w-[95vw] max-w-4xl h-[85vh] sm:h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-700 shrink-0">
          <div>
            <h3 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Geração de Renda
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Detalhamento por tipo de inserção</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 px-4 sm:px-5 py-2 sm:py-3 bg-slate-800 border-b border-slate-700 shrink-0">
          <button
            onClick={() => setActiveTab("empregabilidade")}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${activeTab === "empregabilidade" ? "bg-blue-500 text-white shadow-sm" : "text-slate-400 hover:bg-slate-700"}`}
          >
            Empregabilidade (CLT)
          </button>
          <button
            onClick={() => setActiveTab("empreendedorismo")}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${activeTab === "empreendedorismo" ? "bg-amber-500 text-white shadow-sm" : "text-slate-400 hover:bg-slate-700"}`}
          >
            Empreendedorismo (MEI/PJ)
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-900">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeTab === "empregabilidade" ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-slate-400">Empresas que mais contrataram participantes do programa</p>
                <span className="text-sm font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1">
                  {(stats as any)?.totalEmpregados ?? empresaData.reduce((s, e) => s + e.total, 0)} empregados
                </span>
              </div>
              {empresaData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                  <Briefcase className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">Nenhum registro de empregabilidade ainda</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={(() => { const wrapped = empresaData.filter(e => e.name.length > 22).length; const normal = empresaData.length - wrapped; return Math.max(220, normal * 44 + wrapped * 60); })()}>
                  <BarChart data={empresaData} layout="vertical" margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
                    <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={<WrapTick />} tickLine={false} axisLine={false} width={180} />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12, color: "#e2e8f0" }}
                      formatter={(v: any) => [`${v} contratação${v !== 1 ? "ões" : ""}`, ""]}
                    />
                    <Bar dataKey="total" fill="#3b82f6" radius={[0, 6, 6, 0]} label={{ position: "right", fill: "#94a3b8", fontSize: 11, formatter: (v: any) => v }} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-slate-400">Segmentos de negócio dos empreendedores cadastrados</p>
                <span className="text-sm font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1">
                  {(stats as any)?.totalEmpreendedores ?? segmentoData.reduce((s, e) => s + e.total, 0)} empreendedores
                </span>
              </div>
              {segmentoData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                  <Star className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">Nenhum registro de empreendedorismo ainda</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={(() => { const wrapped = segmentoData.filter(s => s.name.length > 22).length; const normal = segmentoData.length - wrapped; return Math.max(220, normal * 44 + wrapped * 60); })()}>
                  <BarChart data={segmentoData} layout="vertical" margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
                    <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={<WrapTick />} tickLine={false} axisLine={false} width={180} />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12, color: "#e2e8f0" }}
                      formatter={(v: any) => [`${v} negócio${v !== 1 ? "s" : ""}`, ""]}
                    />
                    <Bar dataKey="total" fill="#f59e0b" radius={[0, 6, 6, 0]} label={{ position: "right", fill: "#94a3b8", fontSize: 11, formatter: (v: any) => v }} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CoordenadorDashboard({
  data, isLoading = false, isError = false, errorMessage, onRetry, onFilterChange, filtroAno,
  filtroPeriodo = "todos",
  ocultarFiltroPeriodo = false,
  tipo = "pec", titleOverride, minAno = 2025,
  turmasAtivasPec, turmasDetalhadas,
  metaGeracaoRenda, metaFormados, casasMapeadas, moradasGeraisStats
}: CoordenadorDashboardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showTurmas, setShowTurmas] = useState(false);
  const [showGeracaoRenda, setShowGeracaoRenda] = useState(false);
  const [showAtendBreakdown, setShowAtendBreakdown] = useState(false);
  const [showVisitasBreakdown, setShowVisitasBreakdown] = useState(false);
  const [showMoradasBreakdown, setShowMoradasBreakdown] = useState(false);
  const [showEvasaoModal, setShowEvasaoModal] = useState(false);
  const [pecMetricBreakdown, setPecMetricBreakdown] = useState<PecBreakdownMetric | null>(null);
  const [inclusaoMetricBreakdown, setInclusaoMetricBreakdown] = useState<InclusaoBreakdownMetric | null>(null);
  const currentYear = new Date().getFullYear();
  const ano = filtroAno ?? currentYear;
  const periodo = filtroPeriodo ?? "todos";

  const { data: metasDB } = useQuery<{ metas: Record<string, number> }>({
    queryKey: ['/api/metas-indicadores', ano, tipo],
    queryFn: () => fetch(`/api/metas-indicadores?ano=${ano}&vertente=${tipo}`).then(r => r.json()),
    staleTime: 60000,
  });

  const { data: atendidosTotalData } = useQuery<{ total: number }>({
    queryKey: ['/api/inclusao/atendidos-total'],
    queryFn: () => fetch('/api/inclusao/atendidos-total', { credentials: 'include' }).then(r => r.json()),
    enabled: tipo === 'inclusao',
    staleTime: 60000,
  });

  const metas = metasDB?.metas ?? {};
  const metasLoaded    = metasDB !== undefined;
  const metaFrequencia = metas.frequencia  ?? METAS.frequencia;
  const metaEvasao     = metas.evasao      ?? METAS.evasao;
  const metaNps        = metasLoaded ? (metas.nps ?? null) : METAS.nps;
  const metaAtendAnual = metas.atendimentos ?? 250;
  const metaVisitasAnual = metas.visitas ?? 250;
  const mesesParaMeta = periodoQtdMesesParaMeta(periodo);
  const metaPeriodo = (metaAnual?: number) => {
    if (metaAnual == null) return undefined;
    if (!mesesParaMeta) return metaAnual;
    return Math.round((metaAnual / 11) * mesesParaMeta);
  };
  const metaAtend = metaPeriodo(metaAtendAnual) ?? 0;
  const metaVisitas = metaPeriodo(metaVisitasAnual) ?? 0;
  const metaEspacoOGrito = metaEspacoGritoPeriodo(periodo);
  const metaGeracaoRendaPeriodo = metaPeriodo(metaGeracaoRenda);
  const metaFormadosPeriodo = metaPeriodo(metaFormados);
  const anos: number[] = [];
  for (let y = currentYear; y >= minAno; y--) anos.push(y);

  const defaultData: DashboardData = {
    totalAlunos: 0, alunosAtivos: 0, alunosInativos: 0, horasAula: 0,
    evasao: 0, frequenciaMedia: 0, alunosFormados: 0, nps: 0,
    porPrograma: [], porGenero: [], porFaixaEtaria: [], porRacaCor: [],
  };

  const d = data || defaultData;
  const atendidosTotal = d.totalAlunos;

  // Dados de turmas para o modal
  const turmasAtivas = turmasDetalhadas?.ativas ?? (turmasAtivasPec
    ? turmasAtivasPec.porProjeto.map(p => ({ nome: `${p.total} turma(s)`, projeto: p.projeto }))
    : []);
  const turmasConcluidas = turmasDetalhadas?.concluidas ?? [];
  const totalTurmas = turmasAtivas.length + turmasConcluidas.length;
  const totalTurmasDisplay = turmasAtivasPec
    ? (turmasDetalhadas ? totalTurmas : turmasAtivasPec.totalAtivas + turmasConcluidas.length)
    : totalTurmas;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-48 bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-slate-900 p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h3 className="text-base sm:text-lg font-semibold text-red-300">
            Erro ao carregar dashboard
          </h3>
        </div>
        <p className="text-sm text-slate-300 mb-4">
          {errorMessage || "Não foi possível carregar os indicadores agora."}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-3 py-2 rounded-lg border border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700 transition-colors text-sm"
          >
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  const statusSummary = () => {
    const cards = [
      calcStatus(d.frequenciaMedia, metaFrequencia),
      calcStatus(d.evasao, metaEvasao, true),
      ...(metaNps != null ? [calcStatus(d.nps, metaNps)] : []),
    ];
    const greens = cards.filter(s => s === "green").length;
    const yellows = cards.filter(s => s === "yellow").length;
    const reds = cards.filter(s => s === "red").length;
    return { greens, yellows, reds };
  };
  const summary = statusSummary();

  return (
    <>
      <div className="rounded-2xl border border-slate-700 bg-slate-900 shadow-xl p-3 sm:p-4 md:p-6 mb-6">

        {/* ── Cabeçalho ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 rounded-full bg-gradient-to-b from-orange-500 to-amber-400" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Visão Geral</h2>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-600 rounded-full px-3 py-1.5">
              {summary.greens > 0 && <span className="flex items-center gap-0.5 text-xs text-emerald-400 font-semibold"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />{summary.greens}</span>}
              {summary.yellows > 0 && <span className="flex items-center gap-0.5 text-xs text-amber-400 font-semibold ml-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />{summary.yellows}</span>}
              {summary.reds > 0 && <span className="flex items-center gap-0.5 text-xs text-red-400 font-semibold ml-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />{summary.reds}</span>}
              <span className="text-[10px] text-slate-500 ml-1">indicadores</span>
            </div>

            {onFilterChange && !ocultarFiltroPeriodo && (
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <DashboardPeriodoFiltro
                  ano={ano}
                  periodo={periodo}
                  onChange={onFilterChange}
                  minAno={minAno}
                  variant="dark"
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Grid de KPI Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 mb-5">

          {/* ATENDIDOS — aparece para pec, inclusao e psico (sempre em primeiro lugar) */}
          {tipo === "psico" && (
            <DarkMetricCard
              icon={Users}
              label="Atendidos"
              value={d.totalAlunos}
              accentColor="#f97316"
            />
          )}

          {tipo === "pec" && (
            <DarkMetricCard
              icon={Users}
              label="Atendidos"
              value={d.totalAlunos}
              accentColor="#f97316"
              onClick={() => setShowBreakdown(true)}
            />
          )}

          {tipo === "inclusao" && (
            <DarkMetricCard
              icon={Users}
              label="Atendidos"
              value={atendidosTotal}
              accentColor="#f97316"
              onClick={() => setShowBreakdown(true)}
            />
          )}

          <DarkMetricCard
            icon={Clock}
            label={tipo === "psico" ? "Atendimentos" : "Horas Aula"}
            value={tipo === "psico" ? (d.atendimentos ?? 0) : d.horasAula}
            suffix={tipo === "psico" ? "" : "h"}
            meta={tipo === "psico" ? metaAtend : undefined}
            metaLabel={tipo === "psico" ? `${metaAtend}` : undefined}
            accentColor="#3b82f6"
            onClick={
              tipo === "psico"
                ? () => setShowAtendBreakdown(true)
                : tipo === "pec"
                  ? () => setPecMetricBreakdown("horaAula")
                  : tipo === "inclusao"
                    ? () => setInclusaoMetricBreakdown("horaAula")
                    : undefined
            }
            subtitle={tipo === "pec" || tipo === "inclusao" ? "Clique p/ detalhar" : undefined}
          />

          {tipo !== "psico" && (
            <DarkMetricCard
              icon={Percent}
              label="Frequência"
              value={d.frequenciaMedia}
              suffix="%"
              meta={metaFrequencia}
              metaLabel={`${metaFrequencia}%`}
              accentColor="#10b981"
              onClick={
                tipo === "pec"
                  ? () => setPecMetricBreakdown("frequencia")
                  : tipo === "inclusao"
                    ? () => setInclusaoMetricBreakdown("frequencia")
                    : undefined
              }
              subtitle={tipo === "pec" || tipo === "inclusao" ? "Clique p/ detalhar" : undefined}
            />
          )}

          {tipo !== "psico" && (
            <DarkMetricCard
              icon={TrendingDown}
              label="Evasão"
              value={d.evasao}
              suffix="%"
              meta={metaEvasao}
              metaLabel={`≤${metaEvasao}%`}
              inverso={true}
              accentColor="#ef4444"
              onClick={tipo === "pec" ? () => setShowEvasaoModal(true) : undefined}
            />
          )}

          {tipo !== "psico" && (
            <DarkMetricCard
              icon={Star}
              label="NPS"
              value={d.nps}
              meta={metaNps ?? undefined}
              metaLabel={metaNps != null ? `${metaNps}` : undefined}
              accentColor="#f59e0b"
            />
          )}

          {tipo === "pec" && (
            <DarkMetricCard
              icon={Activity}
              label="Atendimentos"
              value={d.atendimentos ?? 0}
              accentColor="#14b8a6"
              onClick={() => setPecMetricBreakdown("atendimentos")}
              subtitle="Clique p/ detalhar"
            />
          )}

          {tipo === "pec" && (
            <DarkMetricCard
              icon={Utensils}
              label="Alimentação"
              value={d.alimentacao ?? 0}
              accentColor="#22c55e"
              onClick={() => setPecMetricBreakdown("alimentacao")}
              subtitle="Clique p/ detalhar"
            />
          )}

          {tipo === "inclusao" && (
            <DarkMetricCard
              icon={Activity}
              label="Atendimentos"
              value={d.totalPresencas ?? 0}
              accentColor="#14b8a6"
              onClick={() => setInclusaoMetricBreakdown("atendimentos")}
              subtitle="Clique p/ detalhar"
            />
          )}

          {tipo === "inclusao" && (
            <DarkMetricCard
              icon={Utensils}
              label="Alimentação"
              value={d.alimentacao ?? 0}
              accentColor="#22c55e"
              onClick={() => setInclusaoMetricBreakdown("alimentacao")}
              subtitle="Clique p/ detalhar"
            />
          )}

          {tipo === "inclusao" && (
            <DarkMetricCard
              icon={TrendingUp}
              label="Geração de Renda"
              value={d.geracaoRenda?.total ?? 0}
              meta={metaGeracaoRendaPeriodo}
              metaLabel={metaGeracaoRendaPeriodo ? metaGeracaoRendaPeriodo.toString() : undefined}
              accentColor="#22c55e"
              onClick={() => setShowGeracaoRenda(true)}
              subItems={[
                { label: "CLT", value: d.geracaoRenda?.empregabilidade ?? 0, dotColor: "#3b82f6" },
                { label: "MEI/PJ", value: d.geracaoRenda?.empreendedorismo ?? 0, dotColor: "#f59e0b" },
              ]}
            />
          )}

          {tipo === "inclusao" && (
            <DarkMetricCard
              icon={GraduationCap}
              label="Formados"
              value={d.alunosFormados}
              meta={metaFormadosPeriodo}
              metaLabel={metaFormadosPeriodo ? metaFormadosPeriodo.toString() : undefined}
              accentColor="#a855f7"
            />
          )}

          {tipo === "inclusao" && (
            <DarkMetricCard
              icon={GraduationCap}
              label="Avaliação de Aprendizagem"
              value={d.avaliacaoAprendizagem ?? 0}
              suffix="%"
              meta={90}
              metaLabel="90%"
              accentColor="#06b6d4"
            />
          )}

          {tipo === "psico" && (
            <DarkMetricCard
              icon={MapPin}
              label="Visitas"
              value={d.visitasDomiciliares ?? 0}
              meta={metaVisitas}
              metaLabel={`${metaVisitas}`}
              accentColor="#06b6d4"
              onClick={() => setShowVisitasBreakdown(true)}
              subtitle="Clique p/ detalhar"
            />
          )}


          {tipo === "psico" && (
            <DarkMetricCard
              icon={Zap}
              label="Intervenções"
              value={(d as any).intervencoes ?? 0}
              accentColor="#8b5cf6"
            />
          )}

          {tipo === "psico" && (
            <DarkMetricCard
              icon={Star}
              label="Espaço O Grito"
              value={(d as any).espacoOGrito ?? 0}
              meta={metaEspacoOGrito}
              metaLabel={`${metaEspacoOGrito}`}
              accentColor="#a855f7"
            />
          )}

          {tipo === "psico" && (
            <DarkMetricCard
              icon={BookOpen}
              label="Workshop"
              value={(d as any).workshop ?? 0}
              accentColor="#f59e0b"
            />
          )}

          {tipo === "psico" && (
            <DarkMetricCard
              icon={Layers}
              label="Casas Mapeadas"
              value={casasMapeadas ?? 0}
              accentColor="#14b8a6"
            />
          )}

          {tipo === "psico" && (
            <DarkMetricCard
              icon={Home}
              label="Moradas Gerais"
              value={moradasGeraisStats?.total ?? 0}
              accentColor="#22c55e"
              onClick={() => setShowMoradasBreakdown(true)}
              subtitle="Clique p/ detalhar"
            />
          )}

          {/* Turmas Totais — PEC e Inclusão */}
          {(tipo === "pec" || tipo === "inclusao") && (turmasAtivasPec || turmasDetalhadas) && (
            <DarkMetricCard
              icon={BookOpen}
              label="Turmas Totais"
              value={turmasDetalhadas ? totalTurmas : (turmasAtivasPec ? turmasAtivasPec.totalAtivas + turmasConcluidas.length : 0)}
              accentColor="#10b981"
              onClick={() => setShowTurmas(true)}
              subItems={tipo === "pec" && turmasAtivasPec ? turmasAtivasPec.porProjeto.map(p => {
                const nome = p.projeto.toLowerCase().includes('polo') ? 'Polo Esp. Cultural'
                  : p.projeto.toLowerCase().includes('casa') ? 'Casa Sonhar'
                  : 'Sala Serenata';
                return { label: nome, value: p.total, dotColor: '#10b981' };
              }) : undefined}
            />
          )}
        </div>

        {/* ── Legenda de referência ── */}
        <div className="flex items-center gap-4 mb-5 px-1">
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Legenda:</span>
          <span className="flex items-center gap-1 text-[10px] text-emerald-400"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Na meta (≥100%)</span>
          <span className="flex items-center gap-1 text-[10px] text-amber-400"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> Atenção (80–99%)</span>
          <span className="flex items-center gap-1 text-[10px] text-red-400"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> Abaixo da meta (&lt;80%)</span>
        </div>

      </div>

      {showBreakdown && (
        <BreakdownModal
          data={d}
          totalAtendidos={tipo === "inclusao" ? atendidosTotal : d.totalAlunos}
          onClose={() => setShowBreakdown(false)}
        />
      )}
      {showTurmas && (
        <TurmasTotaisModal
          ativas={turmasAtivas}
          concluidas={turmasConcluidas}
          onClose={() => setShowTurmas(false)}
        />
      )}
      {showGeracaoRenda && (
        <GeracaoRendaModal onClose={() => setShowGeracaoRenda(false)} />
      )}
      {showAtendBreakdown && (
        <PsicoAtendBreakdownModal data={d} onClose={() => setShowAtendBreakdown(false)} />
      )}
      {showVisitasBreakdown && (
        <PsicoVisitasBreakdownModal data={d} onClose={() => setShowVisitasBreakdown(false)} />
      )}
      {showMoradasBreakdown && (
        <MoradasGeraisBreakdownModal
          total={moradasGeraisStats?.total ?? 0}
          porStatus={moradasGeraisStats?.porStatus ?? []}
          onClose={() => setShowMoradasBreakdown(false)}
        />
      )}
      {showEvasaoModal && tipo === "pec" && (
        <EvasaoMotivoModal ano={ano} periodo={periodo} onClose={() => setShowEvasaoModal(false)} />
      )}
      {pecMetricBreakdown && tipo === "pec" && (
        <PecMetricBreakdownModal
          ano={ano}
          periodo={periodo}
          metric={pecMetricBreakdown}
          onClose={() => setPecMetricBreakdown(null)}
        />
      )}
      {inclusaoMetricBreakdown && tipo === "inclusao" && (
        <InclusaoMetricBreakdownModal
          ano={ano}
          periodo={periodo}
          metric={inclusaoMetricBreakdown}
          onClose={() => setInclusaoMetricBreakdown(null)}
        />
      )}
    </>
  );
}
