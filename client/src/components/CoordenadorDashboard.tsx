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
  geracaoRenda?: { total: number; empregabilidade: number; empreendedorismo: number };
  psicoFamilias?: number;
  psicoCasos?: number;
  visitasDomiciliares?: number;
  porPrograma: { name: string; value: number }[];
  porGenero: { name: string; value: number }[];
  porFaixaEtaria: { name: string; value: number }[];
  porRacaCor: { name: string; value: number }[];
};

type CoordenadorDashboardProps = {
  data?: DashboardData;
  isLoading?: boolean;
  onFilterChange?: (ano: number, mes: number) => void;
  filtroAno?: number;
  filtroMes?: number;
  tipo?: "pec" | "inclusao" | "psico";
  titleOverride?: string;
  minAno?: number;
  turmasAtivasPec?: { totalAtivas: number; porProjeto: Array<{projeto: string; total: number}> };
  metaGeracaoRenda?: number;
  metaFormados?: number;
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
function DarkMetricCard({
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
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${accentColor}22`, border: `1px solid ${accentColor}44` }}
          >
            <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" style={{ color: accentColor }} />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
            {subtitle && <p className="text-[9px] text-slate-500 mt-0.5 normal-case tracking-normal">{subtitle}</p>}
          </div>
        </div>
        {status !== "neutral" && (
          <span className={`text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 whitespace-nowrap ${cfg.badge}`}>
            <StatusIcon className="w-2.5 h-2.5" />
            {cfg.label}
          </span>
        )}
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

// ── Modal de detalhamento ────────────────────────────────────────────────────
function BreakdownModal({ data, onClose }: { data: DashboardData; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"programa" | "genero" | "faixa" | "raca">("programa");

  const tabs = [
    { key: "programa" as const, label: "Por Programa" },
    { key: "genero" as const, label: "Por Gênero" },
    { key: "faixa" as const, label: "Faixa Etária" },
    { key: "raca" as const, label: "Raça/Cor" },
  ];

  const chartData = { programa: data.porPrograma, genero: data.porGenero, faixa: data.porFaixaEtaria, raca: data.porRacaCor };
  const currentData = chartData[activeTab].filter((d) => d.value > 0);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:w-[95vw] max-w-5xl h-[90vh] sm:h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 sm:p-5 border-b shrink-0">
          <div>
            <h3 className="text-base sm:text-xl font-bold text-gray-900">Detalhamento de Alunos</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Total: <span className="font-semibold">{data.totalAlunos}</span> | Ativos: <span className="font-semibold text-green-600">{data.alunosAtivos}</span> | Inativos: <span className="font-semibold text-red-500">{data.alunosInativos}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="flex gap-1.5 px-4 sm:px-5 py-2 sm:py-3 bg-gray-50 border-b overflow-x-auto shrink-0">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.key ? "bg-orange-500 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-4 sm:p-6">
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
                          <text x={x} y={y} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={11} fontWeight={600} fill="#374151">
                            {`${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                          </text>
                        );
                      }}
                      labelLine={{ stroke: "#9ca3af", strokeWidth: 1 }}
                    >
                      {currentData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, "Quantidade"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-3 text-gray-300" />
              <p className="text-lg">Sem dados disponíveis para esta categoria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const MESES = [
  { value: 0, label: "Todos" }, { value: 1, label: "Janeiro" }, { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" }, { value: 4, label: "Abril" }, { value: 5, label: "Maio" },
  { value: 6, label: "Junho" }, { value: 7, label: "Julho" }, { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" }, { value: 10, label: "Outubro" }, { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

const DARK_TOOLTIP_STYLE = {
  backgroundColor: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 8,
  fontSize: 12,
  color: "#e2e8f0",
};

export default function CoordenadorDashboard({ data, isLoading = false, onFilterChange, filtroAno, filtroMes, tipo = "pec", titleOverride, minAno = 2025, turmasAtivasPec, metaGeracaoRenda, metaFormados }: CoordenadorDashboardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const currentYear = new Date().getFullYear();
  const ano = filtroAno ?? currentYear;
  const mes = filtroMes ?? 0;

  const { data: metasDB } = useQuery<{ metas: Record<string, number> }>({
    queryKey: ['/api/metas-indicadores', ano, tipo],
    queryFn: () => fetch(`/api/metas-indicadores?ano=${ano}&vertente=${tipo}`).then(r => r.json()),
    staleTime: 60000,
  });
  const metas = metasDB?.metas ?? {};
  const metasLoaded    = metasDB !== undefined;
  const metaFrequencia = metas.frequencia  ?? METAS.frequencia;
  const metaEvasao     = metas.evasao      ?? METAS.evasao;
  const metaNps        = metasLoaded ? (metas.nps ?? null) : METAS.nps;
  const metaAtend      = metas.atendimentos ?? 250;
  const anos: number[] = [];
  for (let y = currentYear; y >= minAno; y--) anos.push(y);

  const defaultData: DashboardData = {
    totalAlunos: 0, alunosAtivos: 0, alunosInativos: 0, horasAula: 0,
    evasao: 0, frequenciaMedia: 0, alunosFormados: 0, nps: 0,
    porPrograma: [], porGenero: [], porFaixaEtaria: [], porRacaCor: [],
  };

  const d = data || defaultData;

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
            {/* Pill de resumo de status */}
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-600 rounded-full px-3 py-1.5">
              {summary.greens > 0 && <span className="flex items-center gap-0.5 text-xs text-emerald-400 font-semibold"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />{summary.greens}</span>}
              {summary.yellows > 0 && <span className="flex items-center gap-0.5 text-xs text-amber-400 font-semibold ml-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />{summary.yellows}</span>}
              {summary.reds > 0 && <span className="flex items-center gap-0.5 text-xs text-red-400 font-semibold ml-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />{summary.reds}</span>}
              <span className="text-[10px] text-slate-500 ml-1">indicadores</span>
            </div>

            {onFilterChange && (
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select value={ano} onChange={(e) => onFilterChange?.(Number(e.target.value), mes)}
                  className="text-sm border border-slate-600 rounded-lg px-2 py-1.5 bg-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500">
                  {anos.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <select value={mes} onChange={(e) => onFilterChange?.(ano, Number(e.target.value))}
                  className="text-sm border border-slate-600 rounded-lg px-2 py-1.5 bg-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500">
                  {MESES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ── Grid de KPI Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 mb-5">

          <DarkMetricCard
            icon={Users}
            label={tipo === "psico" ? "Atendidos" : "Alunos"}
            value={d.totalAlunos}
            accentColor="#f97316"
            onClick={tipo !== "psico" ? () => setShowBreakdown(true) : undefined}
            subItems={tipo !== "psico" ? [
              { label: "Ativos", value: d.alunosAtivos, dotColor: "#10b981" },
              { label: "Inativos", value: d.alunosInativos, dotColor: "#ef4444" },
            ] : undefined}
          />

          <DarkMetricCard
            icon={Clock}
            label={tipo === "psico" ? "Atendimentos" : "Horas Aula"}
            value={d.horasAula}
            suffix={tipo === "psico" ? "" : "h"}
            meta={tipo === "psico" ? metaAtend : undefined}
            metaLabel={tipo === "psico" ? `${metaAtend}` : undefined}
            accentColor="#3b82f6"
          />

          <DarkMetricCard
            icon={Percent}
            label={tipo === "psico" ? "Resolutividade" : "Frequência"}
            value={d.frequenciaMedia}
            suffix="%"
            meta={tipo !== "psico" ? metaFrequencia : undefined}
            metaLabel={tipo !== "psico" ? `${metaFrequencia}%` : undefined}
            accentColor="#10b981"
          />

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
            />
          )}

          {tipo === "pec" && (
            <DarkMetricCard
              icon={Utensils}
              label="Alimentação"
              value={d.alimentacao ?? 0}
              accentColor="#22c55e"
            />
          )}

          {tipo === "inclusao" && (
            <DarkMetricCard
              icon={Activity}
              label="Atendidos"
              value={d.atendimentos ?? 0}
              accentColor="#14b8a6"
            />
          )}

          {tipo === "inclusao" && (
            <DarkMetricCard
              icon={Activity}
              label="Atendimentos"
              value={d.totalPresencas ?? 0}
              accentColor="#14b8a6"
            />
          )}

          {tipo === "inclusao" && (
            <DarkMetricCard
              icon={Utensils}
              label="Alimentação"
              value={d.alimentacao ?? 0}
              accentColor="#22c55e"
            />
          )}

          {tipo === "inclusao" && (
            <DarkMetricCard
              icon={TrendingUp}
              label="Geração de Renda"
              value={d.geracaoRenda?.total ?? 0}
              meta={metaGeracaoRenda}
              metaLabel={metaGeracaoRenda ? metaGeracaoRenda.toString() : undefined}
              accentColor="#22c55e"
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
              meta={metaFormados}
              metaLabel={metaFormados ? metaFormados.toString() : undefined}
              accentColor="#a855f7"
            />
          )}

          {tipo === "psico" && (
            <DarkMetricCard
              icon={Users}
              label="Famílias"
              value={d.psicoFamilias ?? 0}
              accentColor="#8b5cf6"
            />
          )}

          {tipo === "psico" && (
            <DarkMetricCard
              icon={MapPin}
              label="Visitas"
              value={d.visitasDomiciliares ?? 0}
              meta={250}
              metaLabel="250"
              accentColor="#06b6d4"
            />
          )}

          {tipo === "psico" && (
            <DarkMetricCard
              icon={MessageCircle}
              label="Demanda Espontânea"
              value={d.demandasEspontaneas ?? 0}
              accentColor="#f59e0b"
            />
          )}

          {tipo === "psico" && (
            <DarkMetricCard
              icon={Activity}
              label="Atend. Coletivos"
              value={(d as any).atendimentosColetivos ?? 0}
              accentColor="#10b981"
            />
          )}

          {tipo === "psico" && (
            <DarkMetricCard
              icon={Star}
              label="Espaço O Grito"
              value={(d as any).espacoOGrito ?? 0}
              meta={10}
              metaLabel="10"
              accentColor="#a855f7"
            />
          )}

          {tipo === "pec" && turmasAtivasPec && (
            <DarkMetricCard
              icon={BookOpen}
              label="Turmas Ativas"
              value={turmasAtivasPec.totalAtivas}
              accentColor="#10b981"
              subItems={turmasAtivasPec.porProjeto.map(p => {
                const nome = p.projeto.toLowerCase().includes('polo') ? 'Polo Esp. Cultural'
                  : p.projeto.toLowerCase().includes('casa') ? 'Casa Sonhar'
                  : 'Sala Serenata';
                return { label: nome, value: p.total, dotColor: '#10b981' };
              })}
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

        {/* ── Gráficos ── */}
        <div className="grid grid-cols-1 gap-4">
          {d.porPrograma.filter((p) => p.value > 0 && p.name !== "Contato Familiar").length > 0 && (
            <div className="bg-slate-800 rounded-xl p-3 sm:p-4 border border-slate-700">
              <p className="text-xs sm:text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-orange-400" />
                Alunos por Programa
              </p>
              <div className="h-52 sm:h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.porPrograma.filter((p) => p.value > 0 && p.name !== "Contato Familiar")} margin={{ top: 4, right: 10, left: -25, bottom: 70 }}>
                    <XAxis
                      dataKey="name"
                      tick={({ x, y, payload }: any) => {
                        const label = payload.value.length > 22 ? payload.value.slice(0, 22) + "…" : payload.value;
                        return (
                          <text x={x} y={y + 6} textAnchor="end" transform={`rotate(-42, ${x}, ${y + 6})`} fontSize={10} fill="#94a3b8">
                            {label}
                          </text>
                        );
                      }}
                      interval={0}
                      height={75}
                    />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <Tooltip contentStyle={DARK_TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                    <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {d.porGenero.filter((p) => p.value > 0).length > 0 && (
            <div className="bg-slate-800 rounded-xl p-3 sm:p-4 border border-slate-700">
              <p className="text-xs sm:text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Distribuição por Gênero
              </p>
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 sm:h-28 sm:w-28 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={d.porGenero.filter((p) => p.value > 0)} dataKey="value" cx="50%" cy="50%" innerRadius={20} outerRadius={38} paddingAngle={3}>
                        {d.porGenero.filter((p) => p.value > 0).map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={DARK_TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5">
                  {d.porGenero.filter((p) => p.value > 0).map((g, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs sm:text-sm">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-slate-400">{g.name}:</span>
                      <span className="font-semibold text-slate-200">{g.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showBreakdown && <BreakdownModal data={d} onClose={() => setShowBreakdown(false)} />}
    </>
  );
}
