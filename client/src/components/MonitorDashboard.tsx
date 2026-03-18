import { useState, useEffect, useRef } from "react";
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
  onFilterChange?: (ano: number, mes: number) => void;
  filtroAno?: number;
  filtroMes?: number;
  meusAlunos?: number;
  alunosFormados?: number;
};

const MESES_MONITOR = [
  { value: 0, label: "Todos" },
  { value: 1, label: "Jan" },
  { value: 2, label: "Fev" },
  { value: 3, label: "Mar" },
  { value: 4, label: "Abr" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Jun" },
  { value: 7, label: "Jul" },
  { value: 8, label: "Ago" },
  { value: 9, label: "Set" },
  { value: 10, label: "Out" },
  { value: 11, label: "Nov" },
  { value: 12, label: "Dez" },
];

function filterByDate(items: any[], ano: number, mes: number, dateField: string = 'created_at'): any[] {
  if (!items || !Array.isArray(items)) return [];
  return items.filter(item => {
    const dateStr = item[dateField] || item.createdAt || item.created_at || item.data;
    if (!dateStr) return true;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;
    const itemYear = d.getFullYear();
    const itemMonth = d.getMonth() + 1;
    if (mes === 0) {
      return itemYear === ano;
    }
    return itemYear === ano && itemMonth === mes;
  });
}

function FilterBar({ ano, mes, onFilterChange, config }: { ano: number; mes: number; onFilterChange: (ano: number, mes: number) => void; config: any }) {
  const currentYear = new Date().getFullYear();
  const anos = [];
  for (let y = currentYear; y >= 2025; y--) anos.push(y);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Filter className="w-3.5 h-3.5" />
        <span>Filtrar:</span>
      </div>
      <select
        value={ano}
        onChange={(e) => onFilterChange(Number(e.target.value), mes)}
        className={`text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-${config.accent}-300`}
      >
        {anos.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <select
        value={mes}
        onChange={(e) => onFilterChange(ano, Number(e.target.value))}
        className={`text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-${config.accent}-300`}
      >
        {MESES_MONITOR.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
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
  filtroMes,
  meusAlunos,
  alunosFormados,
}: MonitorDashboardProps) {
  const config = VERTENTE_CONFIG[vertente];
  const ano = filtroAno ?? new Date().getFullYear();
  const mes = filtroMes ?? 0;

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
  const filterProps = onFilterChange ? { ano, mes, onFilterChange, config } : null;

  if (vertente === "pec") {
    return <PecDashboard config={config} dashboardData={dashboardData} alunosPec={alunosPec} monitorGruposData={monitorGruposData} atividadesData={atividadesData} historicoChamadas={historicoChamadas} titulo={painelTitulo} filterProps={filterProps} filtroAno={ano} filtroMes={mes} meusAlunos={meusAlunos} alunosFormados={alunosFormados} />;
  }

  if (vertente === "inclusao") {
    return <InclusaoDashboard config={config} participantesInclusao={participantesInclusao} gruposInclusaoData={gruposInclusaoData} monitorGruposData={monitorGruposData} atividadesData={atividadesData} historicoChamadas={historicoChamadas} titulo={painelTitulo} filterProps={filterProps} filtroAno={ano} filtroMes={mes} meusAlunos={meusAlunos} alunosFormados={alunosFormados} />;
  }

  return <PsicoDashboard config={config} psicoAtendidos={psicoAtendidos} psicoTurmas={psicoTurmas} psicoHistoricoChamadas={psicoHistoricoChamadas} psicoAtividades={psicoAtividades} psicoRegistrosConf={psicoRegistrosConf} titulo={painelTitulo} filterProps={filterProps} filtroAno={ano} filtroMes={mes} />;
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
  filtroMes,
  meusAlunos,
  alunosFormados,
}: any) {
  const ano = filtroAno ?? new Date().getFullYear();
  const mes = filtroMes ?? 0;

  const allAlunos = filterByDate(Array.isArray(alunosPec) ? alunosPec : [], ano, mes);
  const totalAlunos = allAlunos.length;
  const alunosAtivos = allAlunos.filter((a: any) => a.status !== "inativo").length;
  const alunosInativos = totalAlunos - alunosAtivos;
  const turmasAtivas = (monitorGruposData || []).filter((g: any) => g.status !== "inativo" && g.status !== "finalizado").length;
  const totalTurmas = monitorGruposData?.length ?? 0;
  const filteredAtividades = filterByDate(atividadesData || [], ano, mes);
  const totalAtividades = filteredAtividades.length;

  const chamadas = filterByDate(Array.isArray(historicoChamadas) ? historicoChamadas : [], ano, mes);
  const totalChamadas = chamadas.length;
  const totalPresentes = chamadas.reduce((sum: number, c: any) => {
    const presencas = c.presencas || c.presencaList || [];
    return sum + presencas.filter((p: any) => p.presente || p.status === 'falta_justificada' || (!p.presente && p.justificativa && p.justificativa !== 'Sem justificativa')).length;
  }, 0);
  const totalRegistrosPresenca = chamadas.reduce((sum: number, c: any) => {
    const presencas = c.presencas || c.presencaList || [];
    return sum + presencas.length;
  }, 0);
  const taxaFrequencia = totalRegistrosPresenca > 0 ? Math.round((totalPresentes / totalRegistrosPresenca) * 100) : 0;

  const turmasComAlunos = (monitorGruposData || []).map((g: any) => ({
    name: (g.nome || g.name || "").substring(0, 12),
    alunos: g.totalAlunos || g.alunos || g.total_alunos || 0,
  })).filter((t: any) => t.name).slice(0, 6);

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="rounded-xl p-4 border bg-orange-50 border-orange-100 transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Meus Alunos</p>
              <p className="text-xl font-bold text-gray-900"><AnimatedNumber value={meusAlunos ?? totalAlunos} /></p>
            </div>
          </div>
          <div className="flex gap-3 mt-1 pt-2 border-t border-orange-200/60 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-gray-600">Ativos: <span className="font-semibold">{alunosAtivos}</span></span>
            </div>
            {alunosFormados !== undefined ? (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-xs text-gray-600">Formados: <span className="font-semibold">{alunosFormados}</span></span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-xs text-gray-600">Inativos: <span className="font-semibold">{alunosInativos}</span></span>
              </div>
            )}
          </div>
        </div>
        <MetricCard icon={BookOpen} label="Turmas Ativas" value={turmasAtivas} color="bg-blue-500" bgColor="bg-blue-50" borderColor="border-blue-100" />
        <MetricCard icon={Activity} label="Oficinas/Atividades" value={totalAtividades} color="bg-emerald-500" bgColor="bg-emerald-50" borderColor="border-emerald-100" />
        <MetricCard icon={Percent} label="Frequência Média" value={taxaFrequencia} suffix="%" color="bg-amber-500" bgColor="bg-amber-50" borderColor="border-amber-100" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {turmasComAlunos.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-orange-500" />
              Alunos por Turma
            </p>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={turmasComAlunos} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="alunos" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Resumo Geral
          </p>
          <div className="space-y-2">
            <FrequencyBar label="Presença" value={totalPresentes} total={totalRegistrosPresenca} color="bg-green-500" />
            <div className="flex justify-between text-xs pt-1 border-t border-gray-200 mt-2">
              <span className="text-gray-500">Total de chamadas</span>
              <span className="font-semibold">{totalChamadas}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Turmas totais</span>
              <span className="font-semibold">{totalTurmas}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InclusaoDashboard({
  config,
  participantesInclusao,
  gruposInclusaoData,
  monitorGruposData,
  atividadesData,
  historicoChamadas,
  titulo = "Painel do Monitor",
  filterProps,
  filtroAno,
  filtroMes,
  meusAlunos,
  alunosFormados,
}: any) {
  const ano = filtroAno ?? new Date().getFullYear();
  const mes = filtroMes ?? 0;

  const participantes = filterByDate(Array.isArray(participantesInclusao) ? participantesInclusao : [], ano, mes);
  const participantesAtivos = participantes.filter((p: any) => p.status !== "inativo").length;
  const displayMeusAlunos = meusAlunos ?? participantesAtivos;

  const turmas = Array.isArray(gruposInclusaoData) ? gruposInclusaoData : [];
  const turmasMonitor = Array.isArray(monitorGruposData) ? monitorGruposData : [];
  const allTurmas = [...turmas, ...turmasMonitor];
  const turmasAtivas = allTurmas.filter((t: any) => t.status !== "inativo" && t.status !== "finalizado").length;

  const filteredAtividades = filterByDate(atividadesData || [], ano, mes);
  const totalAtividades = filteredAtividades.length;

  const chamadas = filterByDate(Array.isArray(historicoChamadas) ? historicoChamadas : [], ano, mes);
  const totalChamadas = chamadas.length;
  const totalPresentes = chamadas.reduce((sum: number, c: any) => {
    const presencas = c.presencas || c.presencaList || [];
    return sum + presencas.filter((p: any) => p.presente || p.status === 'falta_justificada' || (!p.presente && p.justificativa && p.justificativa !== 'Sem justificativa')).length;
  }, 0);
  const totalRegistros = chamadas.reduce((sum: number, c: any) => {
    const presencas = c.presencas || c.presencaList || [];
    return sum + presencas.length;
  }, 0);
  const taxaFrequencia = totalRegistros > 0 ? Math.round((totalPresentes / totalRegistros) * 100) : 0;


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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <MetricCard icon={Users} label="Meus Alunos" value={displayMeusAlunos} color="bg-green-500" bgColor="bg-green-50" borderColor="border-green-100" />
        {alunosFormados !== undefined && <MetricCard icon={GraduationCap} label="Alunos Formados" value={alunosFormados} color="bg-purple-500" bgColor="bg-purple-50" borderColor="border-purple-100" />}
        <MetricCard icon={Briefcase} label="Turmas" value={turmasAtivas} color="bg-blue-500" bgColor="bg-blue-50" borderColor="border-blue-100" />
        <MetricCard icon={Activity} label="Atividades" value={totalAtividades} color="bg-emerald-500" bgColor="bg-emerald-50" borderColor="border-emerald-100" />
        <MetricCard icon={Percent} label="Frequência Média" value={taxaFrequencia} suffix="%" color="bg-teal-500" bgColor="bg-teal-50" borderColor="border-teal-100" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Resumo Geral
          </p>
          <div className="space-y-2">
            <FrequencyBar label="Presença" value={totalPresentes} total={totalRegistros} color="bg-green-500" />
            <div className="flex justify-between text-xs pt-1 border-t border-gray-200 mt-2">
              <span className="text-gray-500">Total de chamadas</span>
              <span className="font-semibold">{totalChamadas}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Meus Alunos</span>
              <span className="font-semibold">{displayMeusAlunos}</span>
            </div>
            {alunosFormados !== undefined && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Alunos formados</span>
                <span className="font-semibold">{alunosFormados}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
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
  filtroMes,
}: any) {
  const ano = filtroAno ?? new Date().getFullYear();
  const mes = filtroMes ?? 0;

  const atendidos = filterByDate(Array.isArray(psicoAtendidos) ? psicoAtendidos : [], ano, mes);
  const turmas = Array.isArray(psicoTurmas) ? psicoTurmas : [];
  const chamadas = filterByDate(Array.isArray(psicoHistoricoChamadas) ? psicoHistoricoChamadas : [], ano, mes);
  const atividades = filterByDate(Array.isArray(psicoAtividades) ? psicoAtividades : [], ano, mes);
  const registros = filterByDate(Array.isArray(psicoRegistrosConf) ? psicoRegistrosConf : [], ano, mes);

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
