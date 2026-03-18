import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';

// Hook para contador animado
const useAnimatedCounter = (endValue: number, duration: number = 1500) => {
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
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      
      // Easing function for smooth deceleration
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

// Componente de Contador Animado
const AnimatedCounter = ({ 
  value, 
  className = "",
  duration = 1500 
}: { 
  value: number; 
  className?: string;
  duration?: number;
}) => {
  const animatedValue = useAnimatedCounter(value, duration);
  return <span className={`${className} dashboard-number-pulse`}>{animatedValue.toLocaleString('pt-BR')}</span>;
};

import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, AreaChart, Area, Legend,
  RadialBarChart, RadialBar
} from 'recharts';

// Componente de Gauge/Velocímetro com SVG customizado
const GaugeChart = ({ 
  value, 
  meta, 
  label, 
  isInverse = false,
  hideMeta = false
}: { 
  value: number; 
  meta: number; 
  label: string; 
  isInverse?: boolean;
  hideMeta?: boolean;
}) => {
  const absValue = Math.abs(value);
  const absMeta = Math.abs(meta);
  const percentage = absMeta > 0 ? (absValue / absMeta) * 100 : 0;
  const cappedPercentage = Math.min(percentage, 100);
  
  // Animação de subida do gauge
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  useEffect(() => {
    // Animar de 0 até o valor final
    const duration = 1500; // 1.5 segundos
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setAnimatedProgress(easeOut * cappedPercentage);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [cappedPercentage]);
  
  // Verifica se meta foi atingida
  const isGoalMet = isInverse ? percentage <= 100 : percentage >= 100;
  
  // Cor baseada no desempenho
  const getColor = () => {
    if (isInverse) {
      if (percentage <= 80) return '#22c55e';
      if (percentage <= 100) return '#eab308';
      return '#ef4444';
    } else {
      if (percentage >= 100) return '#22c55e';
      if (percentage >= 80) return '#eab308';
      return '#ef4444';
    }
  };

  const color = getColor();
  
  // SVG Gauge - semicírculo
  const size = 140;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  const progress = (animatedProgress / 100) * circumference;

  return (
    <div className="bg-slate-800/60 rounded-xl p-2 lg:p-4 border border-slate-600/50 flex flex-col items-center justify-center dashboard-border-glow">
      <p className="text-white text-[10px] lg:text-base font-semibold mb-1 lg:mb-2 text-center leading-tight">{label}</p>
      
      {/* SVG Gauge - Responsive */}
      <div className="relative dashboard-gauge-glow" style={{ '--glow-color': `${color}40` } as React.CSSProperties}>
        <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`} className="w-[90px] h-[50px] lg:w-[140px] lg:h-[80px]">
          {/* Background arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="#334155"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
            style={{ 
              filter: `drop-shadow(0 0 8px ${color}50)`
            }}
          />
        </svg>
        
        {/* Valor centralizado */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-0">
          <span className="text-lg lg:text-3xl font-bold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            {value.toLocaleString('pt-BR')}
          </span>
        </div>
      </div>
      
      {/* Ícone de check abaixo do valor quando meta atingida */}
      {!hideMeta && isGoalMet && percentage >= 100 && (
        <div className="flex items-center justify-center gap-1 mt-0.5 lg:mt-1">
          <div className="w-4 h-4 lg:w-5 lg:h-5 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-2 h-2 lg:w-3 lg:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-green-400 text-[8px] lg:text-xs font-bold">META ATINGIDA</span>
        </div>
      )}
      
      {/* Meta e percentual */}
      {!hideMeta && (
        <div className="flex items-center justify-between w-full mt-1 lg:mt-2 px-1 lg:px-2 gap-1">
          <span className="text-slate-400 text-[9px] lg:text-sm truncate">Meta: {meta.toLocaleString('pt-BR')}</span>
          {isGoalMet && percentage >= 100 ? (
            <span className="text-[9px] lg:text-sm font-bold px-1 lg:px-2 py-0.5 rounded bg-green-500/20 text-green-400 flex items-center gap-0.5 lg:gap-1 whitespace-nowrap">
              ✓ {Math.round(percentage)}%
            </span>
          ) : (
            <span className="text-[9px] lg:text-sm font-bold px-1 lg:px-2 py-0.5 rounded whitespace-nowrap" style={{ color, backgroundColor: `${color}20` }}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
};
import { 
  TrendingUp, Users, Briefcase, Instagram, Eye, Target, Award, Calendar,
  Play, Pause, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type GestaoVistaData = {
  periodo: { ano: number; tipo: string; mes?: number };
  indicadores: {
    frequencia: { valor: number; meta: number };
    evasao: { valor: number; meta: number };
    criterioSucesso: { valor: number; meta: number };
    nps: { valor: number; meta: number };
    alunosFormados: { valor: number; meta: number };
    alunosEmFormacao: { valor: number; meta: number };
    criancasAtendidas: { valor: number; meta: number };
    empreendedores: { valor: number; meta: number };
    pessoasEmpregadas: { valor: number; meta: number };
    familiasAtivas: { valor: number; meta: number };
    visitas: { valor: number; meta: number };
    atendimentos: { valor: number; meta: number };
  };
};

type MarketingData = {
  success: boolean;
  seguidores?: { atual: number; meta: number; crescimento: number };
  engajamento?: { valor: number; meta: number };
  reels?: { quantidade: number; meta: number };
};

type IndicadoresMarketingData = {
  success: boolean;
  data: {
    ano: number;
    total_seguidores: number;
    seguidores_ganhos: number;
    seguidores_ganhos_meta: number;
    seguidores_perdidos: number;
    seguidores_perdidos_meta: number;
    novos_doadores: number;
    novos_doadores_meta: number;
    materiais_distribuidos: number;
    materiais_distribuidos_meta: number;
  };
};

type DoadoresStatsData = {
  totalDoadores: number;
  porStatus: {
    active: number;
    trialing: number;
    past_due: number;
    canceled: number;
  };
};

type EvolucaoMensalData = {
  success: boolean;
  ano: string;
  dados: Array<{ mes: string; visitas: number; atendimentos: number }>;
};

const MESES = [
  { value: 'todos', label: 'Todos os Meses' },
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

const ANOS = [2025, 2026];

const ROTATION_INTERVAL = 120000; // 2 minutos em milissegundos

export default function GestaoVistaDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [anoSelecionado, setAnoSelecionado] = useState('2026');
  const [mesSelecionado, setMesSelecionado] = useState('todos');
  const [currentPage, setCurrentPage] = useState(0); // 0 = Dados Gerais, 1 = Marketing + Negócios
  const [isPaused, setIsPaused] = useState(false);
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Timer para alternância automática de páginas
  useEffect(() => {
    if (isPaused) return;
    const rotationTimer = setInterval(() => {
      setCurrentPage(prev => (prev + 1) % 2);
    }, ROTATION_INTERVAL);
    return () => clearInterval(rotationTimer);
  }, [isPaused]);

  // Usar a API /api/gestao-vista que já funciona com filtros de ano e mês
  const queryParams = mesSelecionado === 'todos' 
    ? `?ano=${anoSelecionado}` 
    : `?ano=${anoSelecionado}&mes=${mesSelecionado}`;

  const { data: gvData, isLoading } = useQuery<GestaoVistaData>({ 
    queryKey: ['/api/gestao-vista', anoSelecionado, mesSelecionado], 
    queryFn: () => fetch(`/api/gestao-vista${queryParams}`).then(res => res.json()),
    refetchInterval: 60000 
  });
  
  const { data: marketingData } = useQuery<MarketingData>({ queryKey: ['/api/marketing/dashboard'], refetchInterval: 60000 });

  const { data: indMktData } = useQuery<IndicadoresMarketingData>({ 
    queryKey: ['/api/indicadores-marketing', anoSelecionado], 
    queryFn: () => fetch(`/api/indicadores-marketing?ano=${anoSelecionado}`).then(res => res.json()),
    refetchInterval: 60000 
  });

  const { data: doadoresStats } = useQuery<DoadoresStatsData>({ 
    queryKey: ['/api/doadores/stats'], 
    refetchInterval: 60000 
  });

  const { data: evolucaoData } = useQuery<EvolucaoMensalData>({ 
    queryKey: ['/api/gestao-vista/evolucao-mensal', anoSelecionado], 
    queryFn: () => fetch(`/api/gestao-vista/evolucao-mensal?ano=${anoSelecionado}`).then(res => res.json()),
    refetchInterval: 60000 
  });

  const { data: seguidoresMensalData } = useQuery<{ success: boolean; data: Array<{ mes: number; seguidores_ganhos: number; seguidores_perdidos: number; total_seguidores: number; materiais_distribuidos: number; doadores_ativos: number }> }>({
    queryKey: ['/api/marketing-seguidores-mensal', anoSelecionado],
    queryFn: () => fetch(`/api/marketing-seguidores-mensal?ano=${anoSelecionado}`).then(res => res.json()),
    refetchInterval: 60000
  });

  const { data: igMetrics } = useQuery<any>({
    queryKey: ['/api/instagram/metrics/current'],
    queryFn: () => fetch('/api/instagram/metrics/current').then(r => r.json()),
    refetchInterval: 300000,
    retry: false,
  });

  const negociosMesParam = anoSelecionado === '2026' && mesSelecionado !== 'todos' ? `&mes=${mesSelecionado}` : '';
  const { data: negociosData } = useQuery<{ success: boolean; data: { outlet: { doacoesRecebidas: number; vendasPessoasImpactadas: number; pecasVendidas: number }; griffte: { pecasConfeccionadas: number; clientesAtendidos: number } } }>({ 
    queryKey: ['/api/negocios-sociais', anoSelecionado, mesSelecionado], 
    queryFn: () => fetch(`/api/negocios-sociais?ano=${anoSelecionado}${negociosMesParam}`).then(r => r.json()),
    refetchInterval: 60000 
  });

  const { data: demograficosData } = useQuery<{ success: boolean; totalParticipantes: number; genero: Array<{ name: string; value: number; percentage: number }>; racaCor: Array<{ name: string; value: number; percentage: number }>; idade: Array<{ name: string; value: number; percentage: number }> }>({ 
    queryKey: ['/api/dados-demograficos', anoSelecionado],
    queryFn: () => fetch(`/api/dados-demograficos?ano=${anoSelecionado}`).then(r => r.json()),
    refetchInterval: 60000 
  });

  const mkt = indMktData?.data;
  const doadoresAtivos = (doadoresStats?.porStatus?.active || 0) + (doadoresStats?.porStatus?.trialing || 0);

  const ind = gvData?.indicadores;
  
  // Dados agora vêm em tempo real da API para 2026

  const is2026Dashboard = anoSelecionado === '2026';

  const programasData = [
    { name: 'Programa de Esporte e Cultura', value: ind?.criancasAtendidas?.valor || 0, color: '#10b981' },
    { name: 'Inclusão', value: ind?.atendidosInclusao?.valor ?? ind?.alunosEmFormacao?.valor ?? 0, color: '#3b82f6' },
    { name: 'Psicossocial', value: ind?.atendimentos?.valor || 0, color: '#f59e0b' },
    ...(anoSelecionado !== '2026' ? [{ name: 'Favela 3D', value: ind?.familiasAtivas?.valor || 0, color: '#8b5cf6' }] : []),
  ];

  // Dados de evolução mensal vindos da API (mesma fonte da tela do doador)
  const lineData = evolucaoData?.dados || [
    { mes: 'Jan', visitas: 0, atendimentos: 0 },
    { mes: 'Fev', visitas: 0, atendimentos: 0 },
    { mes: 'Mar', visitas: 0, atendimentos: 0 },
    { mes: 'Abr', visitas: 0, atendimentos: 0 },
    { mes: 'Mai', visitas: 0, atendimentos: 0 },
    { mes: 'Jun', visitas: 0, atendimentos: 0 },
    { mes: 'Jul', visitas: 0, atendimentos: 0 },
    { mes: 'Ago', visitas: 0, atendimentos: 0 },
    { mes: 'Set', visitas: 0, atendimentos: 0 },
    { mes: 'Out', visitas: 0, atendimentos: 0 },
    { mes: 'Nov', visitas: 0, atendimentos: 0 },
    { mes: 'Dez', visitas: 0, atendimentos: 0 },
  ];

  const metasData = [
    { name: 'Frequência', value: ind?.frequencia?.valor || 0, meta: 85 },
    { name: 'Aprendizagem', value: ind?.criterioSucesso?.valor || 0, meta: 90 },
    { name: 'NPS', value: ind?.nps?.valor || 0, meta: 70 },
  ];

  const totalAtendidos = (ind?.criancasAtendidas?.valor || 0) + (ind?.alunosEmFormacao?.valor || 0) + (ind?.atendimentos?.valor || 0) + (anoSelecionado !== '2026' ? (ind?.familiasAtivas?.valor || 0) : 0);
  
  // Valores de Marketing - dados da API
  const is2026 = anoSelecionado === '2026';
  const META_ANUAL_SEGUIDORES_2026 = 15000;
  const SEGUIDORES_ATUAL_2026 = igMetrics?.data?.followers_total || 11538;
  const SEGUIDORES_A_GANHAR_2026 = META_ANUAL_SEGUIDORES_2026 - SEGUIDORES_ATUAL_2026;
  const META_MENSAL_SEGUIDORES_2026 = Math.ceil(SEGUIDORES_A_GANHAR_2026 / 12); // ~296/mês
  const META_ANUAL_PERDIDOS_2026 = 1500;
  const META_MENSAL_PERDIDOS_2026 = Math.ceil(META_ANUAL_PERDIDOS_2026 / 12); // ~125/mês
  const META_ANUAL_MATERIAIS_2026 = 6000;
  const META_MENSAL_MATERIAIS_2026 = Math.ceil(META_ANUAL_MATERIAIS_2026 / 12); // 500/mês

  const segMensalRows = seguidoresMensalData?.data || [];
  const segMensalByMes: Record<string, { ganhos: number; perdidos: number; total: number; materiais: number; doadores: number }> = {};
  for (const row of segMensalRows) {
    segMensalByMes[String(row.mes)] = {
      ganhos: row.seguidores_ganhos,
      perdidos: row.seguidores_perdidos,
      total: row.total_seguidores,
      materiais: row.materiais_distribuidos,
      doadores: row.doadores_ativos || 0,
    };
  }

  const seguidoresGanhosAcumulado = segMensalRows.reduce((acc, r) => acc + r.seguidores_ganhos, 0);
  const seguidoresPerdidosAcumulado = segMensalRows.reduce((acc, r) => acc + r.seguidores_perdidos, 0);
  const materiaisAcumulado = segMensalRows.reduce((acc, r) => acc + r.materiais_distribuidos, 0);
  const ultimoMesTotal = segMensalRows.length > 0 ? segMensalRows[segMensalRows.length - 1].total_seguidores : SEGUIDORES_ATUAL_2026;

  const mesData = segMensalByMes[mesSelecionado];

  const mktSeguidoresGanhos = is2026
    ? (mesSelecionado === 'todos' ? seguidoresGanhosAcumulado : (mesData?.ganhos ?? 0))
    : (mkt?.seguidores_ganhos || 0);

  const metaSeguidoresGanhos2026 = is2026
    ? (mesSelecionado === 'todos' ? SEGUIDORES_A_GANHAR_2026 : META_MENSAL_SEGUIDORES_2026)
    : (mkt?.seguidores_ganhos_meta || 1);

  const mktSeguidoresPerdidos = is2026
    ? (mesSelecionado === 'todos' ? seguidoresPerdidosAcumulado : (mesData?.perdidos ?? 0))
    : (mkt?.seguidores_perdidos || 0);

  const metaSeguidoresPerdidos2026 = is2026
    ? (mesSelecionado === 'todos' ? META_ANUAL_PERDIDOS_2026 : META_MENSAL_PERDIDOS_2026)
    : (mkt?.seguidores_perdidos_meta || 1);

  const mktTotalSeguidores = is2026
    ? (mesSelecionado === 'todos' ? ultimoMesTotal : (mesData?.total ?? ultimoMesTotal))
    : (mkt?.total_seguidores || 11401);

  const mktMateriaisDistribuidos = is2026
    ? (mesSelecionado === 'todos' ? materiaisAcumulado : (mesData?.materiais ?? 0))
    : (mkt?.materiais_distribuidos || 0);

  const metaMateriaisDistribuidos2026 = is2026
    ? (mesSelecionado === 'todos' ? META_ANUAL_MATERIAIS_2026 : META_MENSAL_MATERIAIS_2026)
    : (mkt?.materiais_distribuidos_meta || 1);
  const doadoresUltimoMes = segMensalRows.length > 0 ? (segMensalRows[segMensalRows.length - 1].doadores_ativos || 0) : 0;
  const mktDoadoresAtivos = is2026
    ? (mesSelecionado === 'todos' ? doadoresUltimoMes : (mesData?.doadores ?? doadoresUltimoMes))
    : doadoresAtivos;
  const metaDoadores = 1000; // Meta de doadores
  
  // Função para calcular cor baseada no progresso (lógica do Gestão à Vista)
  const getProgressColor = (valor: number, meta: number) => {
    if (meta <= 0) return { bar: 'bg-blue-500', text: 'text-blue-400' };
    const percentual = (valor / meta) * 100;
    if (percentual >= 100) return { bar: 'bg-emerald-500', text: 'text-emerald-400' }; // Verde - atingiu/superou meta
    if (percentual >= 80) return { bar: 'bg-yellow-500', text: 'text-yellow-400' }; // Amarelo - acima de 80%
    return { bar: 'bg-red-500', text: 'text-red-400' }; // Vermelho - abaixo de 80%
  };
  
  // Função para lógica inversa - quanto MENOS, melhor (para Seguidores Perdidos)
  const getInverseProgressColor = (valor: number, meta: number) => {
    if (meta <= 0) return { bar: 'bg-blue-500', text: 'text-blue-400' };
    const percentual = (valor / meta) * 100;
    if (percentual <= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-400' }; // Verde - está abaixo de 80% da meta (bom!)
    if (percentual <= 100) return { bar: 'bg-yellow-500', text: 'text-yellow-400' }; // Amarelo - entre 80% e 100%
    return { bar: 'bg-red-500', text: 'text-red-400' }; // Vermelho - ultrapassou a meta (ruim!)
  };
  
  // Valores de resultados chave - dados da API em tempo real
  const alunosFormados = ind?.alunosFormados?.valor || 0;
  const pessoasEmpregadas = ind?.pessoasEmpregadas?.valor || 0;
  const atendimentosPsico = ind?.atendimentos?.valor || 0;
  const empreendedores = ind?.empreendedores?.valor || 0;
  const evasaoAtual = ind?.evasao?.valor || 0;
  const visitasDomiciliares = ind?.visitas?.valor || 0;

  // Valores de Negócios Sociais
  const outletDoacoesRecebidas = negociosData?.data?.outlet?.doacoesRecebidas || 0;
  const outletPecasVendidas = negociosData?.data?.outlet?.pecasVendidas || 0;
  const outletPessoasImpactadas = negociosData?.data?.outlet?.vendasPessoasImpactadas || 0;
  const grifftePecasConfeccionadas = negociosData?.data?.griffte?.pecasConfeccionadas || 0;
  const griffteClientesAtendidos = negociosData?.data?.griffte?.clientesAtendidos || 0;

  if (isLoading) return <div className="h-screen bg-slate-900 flex items-center justify-center"><div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden grid grid-rows-[auto_1fr] p-2 lg:p-3 gap-2 lg:gap-3" data-testid="gestao-vista-dashboard">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-800/50 rounded-xl px-3 lg:px-6 py-2 lg:py-3 flex-wrap gap-2">
        <div className="flex items-center gap-3 lg:gap-5">
          <img src="/attached_assets/image_1769454113778.png" alt="Instituto O Grito" className="h-20 lg:h-32 object-contain" />
          <div>
            <h1 className="text-lg lg:text-2xl font-bold text-white">Gestão à Vista</h1>
            <p className="text-slate-400 text-xs lg:text-sm">O Grito</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-4 flex-wrap">
          {/* Controles de Navegação */}
          <div className="flex items-center gap-1 lg:gap-2 border-r border-slate-600 pr-2 lg:pr-4">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`p-1.5 lg:p-2 rounded-lg transition-all ${isPaused ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-700 hover:bg-slate-600'}`}
              title={isPaused ? 'Continuar' : 'Pausar'}
              data-testid="button-pause-play"
            >
              {isPaused ? <Play className="w-3 h-3 lg:w-4 lg:h-4 text-white" /> : <Pause className="w-3 h-3 lg:w-4 lg:h-4 text-white" />}
            </button>
            <button
              onClick={() => setCurrentPage(prev => (prev - 1 + 2) % 2)}
              className="p-1.5 lg:p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-all"
              title="Página Anterior"
              data-testid="button-prev-page"
            >
              <ChevronLeft className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
            </button>
            <div className="flex items-center gap-1 lg:gap-1.5 px-1 lg:px-2">
              <div className={`w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full transition-all ${currentPage === 0 ? 'bg-emerald-500 dashboard-indicator-blink' : 'bg-slate-600'}`} />
              <div className={`w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full transition-all ${currentPage === 1 ? 'bg-pink-500 dashboard-indicator-blink' : 'bg-slate-600'}`} />
            </div>
            <button
              onClick={() => setCurrentPage(prev => (prev + 1) % 2)}
              className="p-1.5 lg:p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-all"
              title="Próxima Página"
              data-testid="button-next-page"
            >
              <ChevronRight className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
            </button>
            <span className="text-slate-400 text-[10px] lg:text-xs ml-1 hidden xl:inline">
              {currentPage === 0 ? 'Indicadores' : 'Marketing & Negócios'}
            </span>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
              <SelectTrigger className="w-[90px] bg-slate-700/50 border-slate-600 text-white text-sm h-8">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {ANOS.map((ano) => (
                  <SelectItem key={ano} value={ano.toString()} className="text-white hover:bg-slate-700">
                    {ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
              <SelectTrigger className="w-[170px] bg-slate-700/50 border-slate-600 text-white text-sm h-8">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {MESES.map((mes) => (
                  <SelectItem key={mes.value} value={mes.value} className="text-white hover:bg-slate-700">
                    {mes.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Hora e Data */}
          <div className="text-right border-l border-slate-600 pl-2 lg:pl-4">
            <p className="text-xl lg:text-3xl font-mono text-white font-bold">{currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
            <p className="text-slate-400 text-[10px] lg:text-sm">{currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>
      </div>

      {/* Conteúdo das Páginas */}
      {currentPage === 0 ? (
        /* PÁGINA 1: Indicadores Gerais */
        <div key="page-0" className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-3 min-h-0 dashboard-page-enter overflow-hidden">
        
          {/* COLUNA 1: Total e Perfil */}
          <div className="flex flex-col gap-2 h-full min-h-0">
            {/* Total Geral */}
            <div className="bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-violet-500/20 rounded-xl p-3 lg:p-5 border border-slate-700/50 flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs lg:text-sm">TOTAL GERAL</p>
                <p className="text-3xl lg:text-5xl font-bold text-white" style={{color: '#10b981'}}><AnimatedCounter value={totalAtendidos} duration={1500} /></p>
                <p className="text-emerald-400 text-xs lg:text-base">
                  Pessoas Impactadas em {anoSelecionado}
                  {mesSelecionado !== 'todos' && ` - ${MESES.find(m => m.value === mesSelecionado)?.label}`}
                </p>
              </div>
              <Award className="w-10 h-10 lg:w-14 lg:h-14 text-emerald-500/40" />
            </div>
          
            {/* Dados Demográficos - Gênero, Raça/Cor e Faixa Etária com Gráficos de Pizza */}
            <div className="bg-slate-800/40 rounded-lg p-2 lg:p-3 border border-slate-700/40 flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-2 mb-1 lg:mb-2">
                <Users className="w-3 h-3 lg:w-4 lg:h-4 text-pink-400" />
                <p className="text-white font-bold text-xs lg:text-sm">Perfil dos Atendidos</p>
              </div>
              <div className="flex flex-col gap-2 flex-1">
                {/* Gênero */}
                {(() => {
                  const generoData = demograficosData?.genero || [];
                  const colors = ['#ec4899', '#3b82f6', '#64748b', '#8b5cf6'];
                  return (
                    <div className="bg-slate-800/60 rounded-lg px-2 lg:px-4 py-1.5 lg:py-2 border border-pink-500/20 flex items-center gap-2 lg:gap-4 flex-1">
                      <div className="w-[60px] h-[60px] lg:w-[80px] lg:h-[80px] flex-shrink-0">
                        <PieChart width={60} height={60} className="lg:hidden">
                          <Pie data={generoData} cx={30} cy={30} innerRadius={0} outerRadius={25} paddingAngle={1} dataKey="value" stroke="#1e293b" strokeWidth={1}>
                            {generoData.map((_, i) => <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />)}
                          </Pie>
                        </PieChart>
                        <PieChart width={80} height={80} className="hidden lg:block">
                          <Pie data={generoData} cx={40} cy={40} innerRadius={0} outerRadius={35} paddingAngle={1} dataKey="value" stroke="#1e293b" strokeWidth={1}>
                            {generoData.map((_, i) => <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />)}
                          </Pie>
                        </PieChart>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs lg:text-sm font-medium mb-0.5 lg:mb-1">Gênero</p>
                        <div className="flex gap-2 lg:gap-3 text-[10px] lg:text-xs text-white flex-wrap">
                          {generoData.map((item, i) => (
                            <span key={i} className="flex items-center gap-1">
                              <span className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i % colors.length] }}></span>
                              <span className="truncate">{item.name} {item.percentage}%</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
                {/* Raça/Cor */}
                {(() => {
                  const racaData = demograficosData?.racaCor || [];
                  const colors = ['#f59e0b', '#854d0e', '#fcd34d', '#64748b', '#78716c'];
                  return (
                    <div className="bg-slate-800/60 rounded-lg px-2 lg:px-4 py-1.5 lg:py-2 border border-amber-500/20 flex items-center gap-2 lg:gap-4 flex-1">
                      <div className="w-[60px] h-[60px] lg:w-[80px] lg:h-[80px] flex-shrink-0">
                        <PieChart width={60} height={60} className="lg:hidden">
                          <Pie data={racaData} cx={30} cy={30} innerRadius={0} outerRadius={25} paddingAngle={1} dataKey="value" stroke="#1e293b" strokeWidth={1}>
                            {racaData.map((_, i) => <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />)}
                          </Pie>
                        </PieChart>
                        <PieChart width={80} height={80} className="hidden lg:block">
                          <Pie data={racaData} cx={40} cy={40} innerRadius={0} outerRadius={35} paddingAngle={1} dataKey="value" stroke="#1e293b" strokeWidth={1}>
                            {racaData.map((_, i) => <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />)}
                          </Pie>
                        </PieChart>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs lg:text-sm font-medium mb-0.5 lg:mb-1">Raça/Cor</p>
                        <div className="flex gap-1.5 lg:gap-2 text-[10px] lg:text-xs text-white flex-wrap">
                          {racaData.map((item, i) => (
                            <span key={i} className="flex items-center gap-1">
                              <span className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i % colors.length] }}></span>
                              <span className="truncate">{item.name} {item.percentage}%</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
                {/* Faixa Etária */}
                {(() => {
                  const idadeData = demograficosData?.idade || [];
                  const colors = ['#06b6d4', '#0891b2', '#22d3ee', '#64748b', '#475569'];
                  return (
                    <div className="bg-slate-800/60 rounded-lg px-2 lg:px-4 py-1.5 lg:py-2 border border-cyan-500/20 flex items-center gap-2 lg:gap-4 flex-1">
                      <div className="w-[60px] h-[60px] lg:w-[80px] lg:h-[80px] flex-shrink-0">
                        <PieChart width={60} height={60} className="lg:hidden">
                          <Pie data={idadeData} cx={30} cy={30} innerRadius={0} outerRadius={25} paddingAngle={1} dataKey="value" stroke="#1e293b" strokeWidth={1}>
                            {idadeData.map((_, i) => <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />)}
                          </Pie>
                        </PieChart>
                        <PieChart width={80} height={80} className="hidden lg:block">
                          <Pie data={idadeData} cx={40} cy={40} innerRadius={0} outerRadius={35} paddingAngle={1} dataKey="value" stroke="#1e293b" strokeWidth={1}>
                            {idadeData.map((_, i) => <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />)}
                          </Pie>
                        </PieChart>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs lg:text-sm font-medium mb-0.5 lg:mb-1">Faixa Etária</p>
                        <div className="flex gap-1.5 lg:gap-2 text-[10px] lg:text-xs text-white flex-wrap">
                          {idadeData.map((item, i) => (
                            <span key={i} className="flex items-center gap-1">
                              <span className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i % colors.length] }}></span>
                              <span className="truncate">{item.name}: {item.percentage}%</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

          {/* Indicador de Evasão */}
          <div className="bg-slate-800/40 rounded-lg p-2 lg:p-3 border border-slate-700/40">
            <div className="flex items-center justify-between mb-2 lg:mb-3">
              <p className="text-white font-bold text-xs lg:text-sm">Controle de Evasão</p>
              <span className="text-emerald-400 text-xs lg:text-sm font-semibold">Meta: 210</span>
            </div>
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="flex-1">
                <div className="flex justify-between mb-1.5 lg:mb-2">
                  <span className="text-slate-300 text-xs lg:text-sm">Evasão Atual</span>
                  <span className="text-emerald-400 font-bold text-lg lg:text-xl">{evasaoAtual}</span>
                </div>
                <div className="h-3 lg:h-4 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                    style={{ width: `${Math.min((evasaoAtual / 210) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-slate-400 text-[10px] lg:text-xs mt-1.5 lg:mt-2">Quanto Menor, Melhor • {Math.round((evasaoAtual / 210) * 100)}% do Limite</p>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA 2: Gráficos */}
        <div className="flex flex-col gap-2 min-h-0">
          {/* Gráfico de Linha - Evolução */}
          <div className="bg-slate-800/40 rounded-lg p-2 lg:p-3 border border-slate-700/40 flex-1 min-h-0 flex flex-col">
            <p className="text-white font-bold text-sm lg:text-base mb-0.5 lg:mb-1">Evolução de Atendimentos</p>
            <p className="text-slate-300 text-[10px] lg:text-xs mb-1 lg:mb-2">Pessoas Impactadas por Mês</p>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="mes" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} tickCount={4} />
                  <Line type="monotone" dataKey="visitas" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} name="Visitas Domicílio" />
                  <Line type="monotone" dataKey="atendimentos" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} name="Atend. Psicossociais" />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} iconSize={8} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#fff' }} itemStyle={{ color: '#fff' }} formatter={(value: number) => value.toLocaleString('pt-BR')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Indicadores de Qualidade - Barras Horizontais */}
          <div className="bg-slate-800/40 rounded-lg p-2 lg:p-3 border border-slate-700/40 flex-1 min-h-0 flex flex-col">
            <p className="text-white font-bold text-sm lg:text-base mb-0.5 lg:mb-1">Indicadores de Qualidade</p>
            <p className="text-slate-300 text-[10px] lg:text-xs mb-1 lg:mb-2">Percentual Atingido vs Meta</p>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metasData} layout="vertical" barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={10} domain={[0, 100]} tickCount={5} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={90} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Realizado" barSize={14} label={{ position: 'right', fill: '#fff', fontSize: 10, formatter: (v: number) => `${v}%` }}>
                    {metasData.map((entry, index) => {
                      const percentual = (entry.value / entry.meta) * 100;
                      let color = '#ef4444'; // vermelho - abaixo de 80%
                      if (percentual >= 100) color = '#10b981'; // verde - atingiu meta
                      else if (percentual >= 80) color = '#eab308'; // amarelo - acima de 80%
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#fff' }} itemStyle={{ color: '#fff' }} formatter={(value: number) => [`${value}%`, 'Realizado']} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* COLUNA 3: Gráficos Adicionais */}
        <div className="flex flex-col gap-2 min-h-0">
          {/* Atendidos por Programa - Barras Verticais */}
          <div className="bg-slate-800/40 rounded-lg p-2 lg:p-3 border border-slate-700/40 flex-[2] min-h-0 flex flex-col">
            <p className="text-white font-bold text-xs lg:text-sm mb-1 lg:mb-2">Atendidos por Programa</p>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={programasData} barCategoryGap="15%" margin={{ top: 22, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickCount={4} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={35} label={{ position: 'top', fill: '#fff', fontSize: 10, formatter: (v: number) => v.toLocaleString('pt-BR') }}>
                    {programasData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.color} />)}
                  </Bar>
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#fff' }} itemStyle={{ color: '#fff' }} formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Atendidos']} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Geração de Renda */}
          {(() => {
            const valor = ind?.pessoasEmpregadas?.valor || 0;
            const meta = ind?.pessoasEmpregadas?.meta || 100;
            const progress = meta > 0 ? Math.min((valor / meta) * 100, 100) : 0;
            const percentual = meta > 0 ? (valor / meta) * 100 : 0;
            let barColor = '#ef4444';
            if (percentual >= 100) barColor = '#10b981';
            else if (percentual >= 80) barColor = '#eab308';
            return (
              <div className="bg-slate-800/40 rounded-lg p-2 lg:p-4 border border-amber-500/30">
                <div className="flex items-center justify-between mb-2 lg:mb-3">
                  <p className="text-white font-bold text-sm lg:text-base">Geração de Renda</p>
                  <div className="flex items-center gap-1 lg:gap-2">
                    <span className="text-white font-bold text-lg lg:text-2xl">{valor.toLocaleString('pt-BR')}</span>
                    <span className="text-slate-400 text-xs lg:text-sm">/ Meta: {meta.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
                <div className="h-4 lg:h-5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: barColor }} />
                </div>
                <p className="text-slate-400 text-[10px] lg:text-sm mt-1.5 lg:mt-2 text-right">{percentual.toFixed(0)}% da meta</p>
              </div>
            );
          })()}

        </div>
      </div>
      ) : (
        /* PÁGINA 2: Marketing e Negócios Sociais */
        <div key="page-1" className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-4 min-h-0 dashboard-page-enter overflow-hidden">
          {/* Marketing e Tecnologia */}
          <div className="bg-slate-800/40 rounded-xl p-3 lg:p-6 border-2 border-pink-500/30 flex flex-col">
            <div className="flex items-center gap-2 lg:gap-3 mb-3 lg:mb-6 flex-wrap">
              <div className="p-2 lg:p-3 bg-pink-500 rounded-xl"><Instagram className="w-5 h-5 lg:w-8 lg:h-8 text-white" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-base lg:text-xl">Marketing e Tecnologia</p>
                <p className="text-slate-300 text-xs lg:text-sm">Indicadores de Crescimento</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-xs lg:text-sm">Total Seguidores</p>
                <p className="text-xl lg:text-3xl font-bold text-white">{mktTotalSeguidores.toLocaleString('pt-BR')}</p>
                {is2026 && (
                  <p className="text-slate-400 text-xs">Meta: {META_ANUAL_SEGUIDORES_2026.toLocaleString('pt-BR')}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 lg:gap-3 flex-1">
              {/* Seguidores Ganhos - Gauge */}
              <GaugeChart 
                value={mktSeguidoresGanhos}
                meta={is2026 ? metaSeguidoresGanhos2026 : (mkt?.seguidores_ganhos_meta || 1)}
                label="Seguidores Ganhos"
                hideMeta={false}
              />
              {/* Seguidores Perdidos - Gauge (inverso) */}
              <GaugeChart 
                value={mktSeguidoresPerdidos}
                meta={is2026 ? metaSeguidoresPerdidos2026 : (mkt?.seguidores_perdidos_meta || 1)}
                label="Seguidores Perdidos"
                isInverse={true}
                hideMeta={false}
              />
              {/* Doadores Ativos - Gauge */}
              <GaugeChart 
                value={mktDoadoresAtivos}
                meta={metaDoadores}
                label="Doadores Ativos"
                hideMeta={false}
              />
              {/* Materiais Distribuídos - Gauge */}
              <GaugeChart 
                value={mktMateriaisDistribuidos}
                meta={is2026 ? metaMateriaisDistribuidos2026 : (mkt?.materiais_distribuidos_meta || 1)}
                label="Materiais Distribuídos"
                hideMeta={false}
              />
            </div>
          </div>

          {/* Negócios Sociais */}
          <div className="bg-slate-800/40 rounded-xl p-3 lg:p-6 border-2 border-orange-500/30 flex flex-col">
            <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-4">
              <div className="p-2 lg:p-3 bg-orange-500 rounded-xl"><Briefcase className="w-5 h-5 lg:w-8 lg:h-8 text-white" /></div>
              <div>
                <p className="text-white font-bold text-base lg:text-xl">Negócios Sociais</p>
                <p className="text-slate-300 text-xs lg:text-sm">Resultados do Período</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 lg:gap-4 flex-1 min-h-0">
              {/* Outlet - Cards com valores */}
              <div className="bg-slate-800/60 rounded-xl p-2 lg:p-5 border border-yellow-500/40 flex flex-col">
                <p className="text-white font-bold text-base lg:text-xl mb-2 lg:mb-4 text-center border-b border-yellow-500/30 pb-2 lg:pb-3">IOG OUTLET</p>
                <div className="flex-1 grid grid-rows-3 gap-1.5 lg:gap-3">
                  <div className="bg-gradient-to-r from-yellow-500/20 via-yellow-500/10 to-transparent rounded-lg p-2 lg:p-4 border-l-4 border-yellow-500 relative overflow-hidden group hover:from-yellow-500/30 transition-all duration-300">
                    <div className="absolute top-1 right-1 lg:top-2 lg:right-2 w-5 h-5 lg:w-8 lg:h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 lg:w-4 lg:h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <p className="text-slate-300 text-[10px] lg:text-sm">Doações Recebidas</p>
                    <p className="text-yellow-400 font-bold text-xl lg:text-3xl">
                      <AnimatedCounter value={outletDoacoesRecebidas} duration={1800} />
                    </p>
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-yellow-500 to-transparent opacity-50" />
                  </div>
                  <div className="bg-gradient-to-r from-orange-500/20 via-orange-500/10 to-transparent rounded-lg p-2 lg:p-4 border-l-4 border-orange-500 relative overflow-hidden group hover:from-orange-500/30 transition-all duration-300">
                    <div className="absolute top-1 right-1 lg:top-2 lg:right-2 w-5 h-5 lg:w-8 lg:h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 lg:w-4 lg:h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <p className="text-slate-300 text-[10px] lg:text-sm">Peças Vendidas</p>
                    <p className="text-orange-400 font-bold text-xl lg:text-3xl">
                      <AnimatedCounter value={outletPecasVendidas} duration={1600} />
                    </p>
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-orange-500 to-transparent opacity-50" />
                  </div>
                  <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent rounded-lg p-2 lg:p-4 border-l-4 border-amber-500 relative overflow-hidden group hover:from-amber-500/30 transition-all duration-300">
                    <div className="absolute top-1 right-1 lg:top-2 lg:right-2 w-5 h-5 lg:w-8 lg:h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 lg:w-4 lg:h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-slate-300 text-[10px] lg:text-sm">Pessoas Impactadas</p>
                    <p className="text-amber-400 font-bold text-xl lg:text-3xl">
                      <AnimatedCounter value={outletPessoasImpactadas} duration={1400} />
                    </p>
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-500 to-transparent opacity-50" />
                  </div>
                </div>
              </div>
              {/* Griffte - Cards com valores */}
              <div className="bg-slate-800/60 rounded-xl p-2 lg:p-5 border border-orange-500/40 flex flex-col">
                <p className="text-white font-bold text-base lg:text-xl mb-2 lg:mb-4 text-center border-b border-orange-500/30 pb-2 lg:pb-3">IOG CONFECÇÃO</p>
                <div className="flex-1 grid grid-rows-2 gap-2 lg:gap-4">
                  <div className="bg-gradient-to-r from-orange-600/20 via-orange-600/10 to-transparent rounded-lg p-2 lg:p-5 border-l-4 border-orange-600 relative overflow-hidden group hover:from-orange-600/30 transition-all duration-300">
                    <div className="absolute top-1 right-1 lg:top-3 lg:right-3 w-6 h-6 lg:w-10 lg:h-10 rounded-full bg-orange-600/20 flex items-center justify-center">
                      <svg className="w-3 h-3 lg:w-5 lg:h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                      </svg>
                    </div>
                    <p className="text-slate-300 text-[10px] lg:text-base">Peças Confeccionadas</p>
                    <p className="text-orange-400 font-bold text-2xl lg:text-4xl">
                      <AnimatedCounter value={grifftePecasConfeccionadas} duration={1700} />
                    </p>
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-orange-600 to-transparent opacity-50" />
                  </div>
                  <div className="bg-gradient-to-r from-red-500/20 via-red-500/10 to-transparent rounded-lg p-2 lg:p-5 border-l-4 border-red-500 relative overflow-hidden group hover:from-red-500/30 transition-all duration-300">
                    <div className="absolute top-1 right-1 lg:top-3 lg:right-3 w-6 h-6 lg:w-10 lg:h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                      <svg className="w-3 h-3 lg:w-5 lg:h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <p className="text-slate-300 text-[10px] lg:text-base">Clientes Atendidos</p>
                    <p className="text-red-400 font-bold text-2xl lg:text-4xl">
                      <AnimatedCounter value={griffteClientesAtendidos} duration={1200} />
                    </p>
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-500 to-transparent opacity-50" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
