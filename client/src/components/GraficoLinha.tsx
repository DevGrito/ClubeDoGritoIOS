import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, Minus } from "lucide-react";

/**
 * Interface para as propriedades do componente GraficoLinha
 */
interface GraficoLinhaProps {
  /** Dados para o gráfico - array com dados mensais */
  data?: Array<{
    mes: string;
    captado: number;
    realizado: number;
    saldo?: number;
    mesNumero?: number;
  }>;
  /** Estado de loading */
  loading?: boolean;
  /** Classe CSS adicional */
  className?: string;
  /** Título do gráfico */
  title?: string;
  /** Altura do gráfico em pixels */
  height?: number;
  /** Se deve mostrar área preenchida sob a linha */
  showArea?: boolean;
  /** Se deve mostrar linha de referência no zero */
  showZeroLine?: boolean;
  /** Controla se os dados financeiros devem ser visíveis ou mascarados */
  dadosVisiveis?: boolean;
  /** Filtros de período para determinar ano correto nos tooltips */
  filtrosPeriodo?: {
    mes: number | null;
    ano: number;
  };
}

// Dados de exemplo para demonstração - evolução realística de saldo de ONG baseados em 2022
const dadosExemplo = [
  { mes: 'Jan', captado: 42500, realizado: 39000, mesNumero: 1 },
  { mes: 'Fev', captado: 46000, realizado: 42500, mesNumero: 2 },
  { mes: 'Mar', captado: 44000, realizado: 41000, mesNumero: 3 },
  { mes: 'Abr', captado: 47500, realizado: 44500, mesNumero: 4 },
  { mes: 'Mai', captado: 43500, realizado: 42000, mesNumero: 5 },
  { mes: 'Jun', captado: 46500, realizado: 44000, mesNumero: 6 },
  { mes: 'Jul', captado: 44500, realizado: 43000, mesNumero: 7 },
  { mes: 'Ago', captado: 48000, realizado: 45500, mesNumero: 8 },
  { mes: 'Set', captado: 45500, realizado: 43500, mesNumero: 9 },
  { mes: 'Out', captado: 47000, realizado: 45000, mesNumero: 10 },
  { mes: 'Nov', captado: 49000, realizado: 46500, mesNumero: 11 },
  { mes: 'Dez', captado: 51000, realizado: 48500, mesNumero: 12 }
];

/**
 * Função para formatar valores monetários em Real brasileiro
 */
const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(valor);
};

/**
 * Função para formatar valores compactos (K, M) - mascarada quando necessário
 */
const formatarValorCompacto = (valor: number, dadosVisiveis: boolean = true): string => {
  if (!dadosVisiveis) return '';
  if (Math.abs(valor) >= 1000000) {
    return `${(valor / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(valor) >= 1000) {
    return `${(valor / 1000).toFixed(0)}K`;
  }
  return valor.toString();
};

/**
 * Componente de tooltip customizado para o gráfico
 */
const TooltipCustomizado = ({ active, payload, label, dadosVisiveis, ano }: any) => {
  if (active && payload && payload.length > 0 && dadosVisiveis) {
    const data = payload[0];
    const saldo = data.value;
    const isPositive = saldo >= 0;
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 min-w-[220px]">
        <div className="font-semibold text-gray-900 mb-3 text-center border-b pb-2">
          {label} {ano}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: isPositive ? '#FFCC00' : '#333333' }}
              />
              <span className="text-sm font-medium text-gray-700">
                Saldo:
              </span>
            </div>
            <span className={`text-sm font-bold ${isPositive ? 'text-yellow-600' : 'text-gray-800'}`}>
              {formatarMoeda(saldo)}
            </span>
          </div>
          
          {/* Indicador de tendência */}
          <div className="flex items-center justify-center gap-2 pt-2 border-t">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-yellow-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-gray-800" />
            )}
            <span className={`text-xs font-medium ${isPositive ? 'text-yellow-600' : 'text-gray-800'}`}>
              {isPositive ? 'Superávit' : 'Déficit'}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

/**
 * Componente de loading skeleton
 */
const LoadingSkeleton = ({ height = 400 }: { height?: number }) => (
  <div 
    className="w-full animate-pulse p-4"
    style={{ height: `${height}px` }}
    data-testid="grafico-linha-loading"
  >
    {/* Skeleton da linha de tendência */}
    <div className="relative h-full">
      <svg 
        className="w-full h-full" 
        viewBox="0 0 400 200"
        fill="none"
      >
        {/* Grid skeleton */}
        <defs>
          <pattern id="grid" width="40" height="25" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 25" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Linha de tendência animada */}
        <path
          d="M20,160 Q80,140 120,100 T200,80 T280,120 T360,90"
          stroke="#e5e7eb"
          strokeWidth="3"
          fill="none"
          strokeDasharray="5,5"
          className="animate-pulse"
        />
        
        {/* Área sob a linha */}
        <path
          d="M20,160 Q80,140 120,100 T200,80 T280,120 T360,90 L360,180 L20,180 Z"
          fill="url(#gradient-skeleton)"
          opacity="0.3"
        />
        
        <defs>
          <linearGradient id="gradient-skeleton" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e5e7eb" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="#e5e7eb" stopOpacity="0"/>
          </linearGradient>
        </defs>
      </svg>
      
      {/* Labels skeleton */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-3 w-8 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  </div>
);

/**
 * Componente principal do gráfico de linha
 */
export default function GraficoLinha({ 
  data, 
  loading = false, 
  className = "", 
  title = "Evolução do Saldo - Tendência Mensal",
  height = 400,
  showArea = true,
  showZeroLine = true,
  dadosVisiveis = true,
  filtrosPeriodo
}: GraficoLinhaProps) {
  
  // Determinar ano para tooltips (dos filtros ou dos dados reais)
  const anoTooltip = filtrosPeriodo?.ano || 2022;

  // Processar dados e calcular saldo com memoização
  const dadosProcessados = useMemo(() => {
    const dadosBase = data && data.length > 0 ? data : dadosExemplo;
    
    const dadosOriginais = dadosBase.map(item => ({
      ...item,
      saldo: (item.captado || 0) - (item.realizado || 0)
    }));

    // Mascarar dados quando privacidade ativada
    if (!dadosVisiveis) {
      return dadosOriginais.map(item => ({
        ...item,
        captado: 0,
        realizado: 0,
        saldo: 0
      }));
    }

    return dadosOriginais;
  }, [data, dadosVisiveis]);

  // Calcular estatísticas do saldo
  const estatisticas = useMemo(() => {
    if (!dadosProcessados || dadosProcessados.length === 0) {
      return { 
        saldoAtual: 0, 
        tendencia: 'stable', 
        variacao: 0,
        saldoMaximo: 0,
        saldoMinimo: 0,
        mediaMovel: 0
      };
    }

    const saldos = dadosProcessados.map(d => d.saldo);
    const saldoAtual = saldos[saldos.length - 1];
    const saldoAnterior = saldos[saldos.length - 2] || saldoAtual;
    const variacao = saldoAtual - saldoAnterior;
    const tendencia = variacao > 0 ? 'up' : variacao < 0 ? 'down' : 'stable';
    
    return {
      saldoAtual,
      tendencia,
      variacao,
      saldoMaximo: Math.max(...saldos),
      saldoMinimo: Math.min(...saldos),
      mediaMovel: saldos.reduce((acc, val) => acc + val, 0) / saldos.length
    };
  }, [dadosProcessados]);

  // Determinar cor da linha baseada na tendência geral - agora amarelo/preto
  const corLinha = useMemo(() => {
    const saldoFinal = estatisticas.saldoAtual;
    if (saldoFinal > 0) return '#FFCC00'; // Amarelo para positivo
    if (saldoFinal < 0) return '#333333'; // Preto para negativo
    return '#6B7280'; // Cinza para neutro
  }, [estatisticas.saldoAtual]);

  // Estado de loading
  if (loading) {
    return (
      <Card className={`bg-white shadow-sm border border-gray-200 ${className}`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Activity className="w-5 h-5 text-gray-600" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton height={height} />
        </CardContent>
      </Card>
    );
  }

  // Estado vazio
  if (!dadosProcessados || dadosProcessados.length === 0) {
    return (
      <Card className={`bg-white shadow-sm border border-gray-200 ${className}`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Activity className="w-5 h-5 text-gray-600" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="flex flex-col items-center justify-center text-gray-500"
            style={{ height: `${height}px` }}
            data-testid="grafico-linha-empty"
          >
            <Activity className="w-12 h-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">Nenhum dado disponível</p>
            <p className="text-sm text-gray-400">Os dados de evolução aparecerão aqui quando disponíveis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300 ${className}`}
      data-testid="grafico-linha-container"
    >
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Activity className="w-5 h-5 text-gray-600" />
          {title}
        </CardTitle>
        <div className="flex items-center justify-between mt-2">
          <div className="text-sm text-gray-600">
            Evolução mensal do saldo (Captado - Realizado)
          </div>
          
          {/* Indicador de tendência */}
          <div className="flex items-center gap-2">
            {estatisticas.tendencia === 'up' && (
              <div className="flex items-center gap-1 text-yellow-600">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">Em alta</span>
              </div>
            )}
            {estatisticas.tendencia === 'down' && (
              <div className="flex items-center gap-1 text-gray-800">
                <TrendingDown className="w-4 h-4" />
                <span className="text-xs font-medium">Em baixa</span>
              </div>
            )}
            {estatisticas.tendencia === 'stable' && (
              <div className="flex items-center gap-1 text-gray-600">
                <Minus className="w-4 h-4" />
                <span className="text-xs font-medium">Estável</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Gráfico principal */}
        <div 
          style={{ height: `${height}px` }}
          data-testid="grafico-linha-chart"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={dadosProcessados}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 20,
              }}
            >
              {/* Gradiente para área */}
              <defs>
                <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop 
                    offset="0%" 
                    stopColor={corLinha} 
                    stopOpacity={0.8}
                  />
                  <stop 
                    offset="100%" 
                    stopColor={corLinha} 
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>

              {/* Grid profissional */}
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#E5E7EB" 
                strokeOpacity={0.6}
                vertical={false}
              />
              
              {/* Eixo X - Meses */}
              <XAxis 
                dataKey="mes"
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fontSize: 12, 
                  fill: '#6B7280',
                  fontWeight: 500
                }}
                height={60}
              />
              
              {/* Eixo Y - Valores */}
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fontSize: 12, 
                  fill: '#6B7280',
                  fontWeight: 500
                }}
                tickFormatter={(value) => formatarValorCompacto(value, dadosVisiveis)}
                width={80}
              />
              
              {/* Linha de referência no zero */}
              {showZeroLine && (
                <ReferenceLine 
                  y={0} 
                  stroke="#9CA3AF" 
                  strokeDasharray="2 2" 
                  strokeWidth={1}
                />
              )}
              
              {/* Tooltip customizado - desabilitado quando dados ocultos */}
              <Tooltip 
                content={dadosVisiveis ? (props: any) => <TooltipCustomizado {...props} dadosVisiveis={dadosVisiveis} ano={anoTooltip} /> : () => null}
                cursor={dadosVisiveis ? { 
                  stroke: corLinha,
                  strokeWidth: 2,
                  strokeDasharray: '5 5'
                } : false}
              />
              
              {/* Área preenchida com linha suave */}
              <Area
                type="monotone"
                dataKey="saldo"
                stroke={corLinha}
                strokeWidth={3}
                fill="url(#saldoGradient)"
                fillOpacity={1}
                dot={false}
                activeDot={dadosVisiveis ? { 
                  r: 6, 
                  stroke: corLinha,
                  strokeWidth: 2,
                  fill: '#fff'
                } : false}
                animationDuration={1500}
                animationEasing="ease-in-out"
                data-testid="area-saldo"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Estatísticas resumo - mascaradas quando necessário */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-1">Saldo Atual</div>
            <div className={`text-lg font-bold ${dadosVisiveis ? (
              estatisticas.saldoAtual >= 0 ? 'text-yellow-600' : 'text-gray-800'
            ) : 'text-gray-500'}`}>
              {dadosVisiveis ? formatarMoeda(estatisticas.saldoAtual) : '••••••••'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-1">Variação</div>
            <div className={`text-lg font-bold ${dadosVisiveis ? (
              estatisticas.variacao >= 0 ? 'text-yellow-600' : 'text-gray-800'
            ) : 'text-gray-500'}`}>
              {dadosVisiveis ? (
                `${estatisticas.variacao >= 0 ? '+' : ''}${formatarMoeda(estatisticas.variacao)}`
              ) : '••••••••'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-1">Maior Saldo</div>
            <div className={`text-lg font-bold ${dadosVisiveis ? 'text-yellow-600' : 'text-gray-500'}`}>
              {dadosVisiveis ? formatarMoeda(estatisticas.saldoMaximo) : '••••••••'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-1">Menor Saldo</div>
            <div className={`text-lg font-bold ${dadosVisiveis ? 'text-gray-800' : 'text-gray-500'}`}>
              {dadosVisiveis ? formatarMoeda(estatisticas.saldoMinimo) : '••••••••'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
