import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3 } from "lucide-react";

// Interface para as propriedades do componente
interface GraficoBarrasProps {
  data?: Array<{
    mes: string;
    captado: number;
    realizado: number;
    mesNumero?: number;
  }>;
  loading?: boolean;
  className?: string;
  title?: string;
  height?: number;
  showLegend?: boolean;
  /** Controla se os dados financeiros devem ser visíveis ou mascarados */
  dadosVisiveis?: boolean;
  /** Filtros de período para determinar ano correto nos tooltips */
  filtrosPeriodo?: {
    mes: number | null;
    ano: number;
  };
}

// Dados de exemplo para demonstração - valores realistas do setor de ONGs baseados em 2022
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

// Função para formatar valores em Real brasileiro
const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(valor);
};

// Componente de tooltip customizado
const TooltipCustomizado = ({ active, payload, label, dadosVisiveis, ano }: any) => {
  if (active && payload && payload.length && dadosVisiveis) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[200px]">
        <div className="font-semibold text-gray-900 mb-2 text-center">
          {label} {ano}
        </div>
        <div className="space-y-2">
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium text-gray-700">
                  {item.name}:
                </span>
              </div>
              <span className="text-sm font-bold text-gray-900">
                {formatarMoeda(item.value)}
              </span>
            </div>
          ))}
          
          {/* Mostrar diferença */}
          {payload.length === 2 && (
            <div className="border-t pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Diferença:
                </span>
                <span className={`text-sm font-bold ${
                  payload[0].value - payload[1].value >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {formatarMoeda(Math.abs(payload[0].value - payload[1].value))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// Componente de loading skeleton
const LoadingSkeleton = ({ height = 400 }: { height?: number }) => (
  <div 
    className="w-full animate-pulse"
    style={{ height: `${height}px` }}
    data-testid="grafico-barras-loading"
  >
    <div className="flex items-end justify-between h-full space-x-1 p-4">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="flex-1 space-y-2">
          <div 
            className="bg-gradient-to-t from-gray-200 to-gray-300 rounded-t-md"
            style={{ 
              height: `${Math.random() * 60 + 20}%`,
              minHeight: '40px'
            }}
          />
          <div 
            className="bg-gradient-to-t from-gray-300 to-gray-400 rounded-t-md"
            style={{ 
              height: `${Math.random() * 50 + 15}%`,
              minHeight: '30px'
            }}
          />
          <div className="h-4 bg-gray-200 rounded mx-auto w-8"></div>
        </div>
      ))}
    </div>
  </div>
);

// Componente principal do gráfico de área
export default function GraficoBarras({ 
  data, 
  loading = false, 
  className = "", 
  title = "Captado x Realizado - Comparativo Mensal",
  height = 400,
  showLegend = true,
  dadosVisiveis = true,
  filtrosPeriodo
}: GraficoBarrasProps) {
  
  // Usar dados de exemplo se não houver dados fornecidos, e mascarar se necessário
  const dadosOriginais = data && data.length > 0 ? data : dadosExemplo;
  
  // Determinar ano para tooltips (dos filtros ou dos dados reais)
  const anoTooltip = filtrosPeriodo?.ano || 2022;
  
  // Mascarar dados quando privacidade ativada
  const dadosGrafico = dadosVisiveis ? dadosOriginais : dadosOriginais.map(item => ({
    ...item,
    captado: 0,
    realizado: 0
  }));
  
  // Estado de loading
  if (loading) {
    return (
      <Card className={`bg-white shadow-sm border border-gray-200 ${className}`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <BarChart3 className="w-5 h-5 text-gray-600" />
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
  if (!dadosGrafico || dadosGrafico.length === 0) {
    return (
      <Card className={`bg-white shadow-sm border border-gray-200 ${className}`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="flex flex-col items-center justify-center text-gray-500"
            style={{ height: `${height}px` }}
            data-testid="grafico-barras-empty"
          >
            <BarChart3 className="w-12 h-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">Nenhum dado disponível</p>
            <p className="text-sm text-gray-400">Os dados financeiros aparecerão aqui quando disponíveis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300 ${className}`}
      data-testid="grafico-barras-container"
    >
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          {title}
        </CardTitle>
        <div className="text-sm text-gray-600">
          Comparativo mensal de valores captados versus realizados
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Legenda customizada */}
        {showLegend && (
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3B82F6' }}></div>
              <span className="text-sm font-medium text-gray-700">Captado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10B981' }}></div>
              <span className="text-sm font-medium text-gray-700">Realizado</span>
            </div>
          </div>
        )}

        {/* Gráfico principal */}
        <div 
          style={{ height: `${height}px` }}
          data-testid="grafico-barras-chart"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={dadosGrafico}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 20,
              }}
            >
              {/* Gradientes para as áreas */}
              <defs>
                <linearGradient id="captadoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="realizadoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.1} />
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
                tickFormatter={(value) => {
                  if (!dadosVisiveis) return '';
                  if (value >= 1000000) {
                    return `${(value / 1000000).toFixed(1)}M`;
                  }
                  if (value >= 1000) {
                    return `${(value / 1000).toFixed(0)}K`;
                  }
                  return value.toString();
                }}
                width={80}
              />
              
              {/* Tooltip customizado - desabilitado quando dados ocultos */}
              <Tooltip 
                content={dadosVisiveis ? (props: any) => <TooltipCustomizado {...props} dadosVisiveis={dadosVisiveis} ano={anoTooltip} /> : () => null}
                cursor={dadosVisiveis ? { 
                  stroke: '#999',
                  strokeWidth: 1,
                  strokeDasharray: '5 5'
                } : false}
              />
              
              {/* Área - Captado (Azul) */}
              <Area
                type="monotone"
                dataKey="captado" 
                name="Captado"
                stroke="#3B82F6"
                strokeWidth={3}
                fill="url(#captadoGradient)"
                fillOpacity={1}
                dot={false}
                activeDot={dadosVisiveis ? { 
                  r: 6, 
                  stroke: '#3B82F6',
                  strokeWidth: 2,
                  fill: '#fff'
                } : false}
                animationDuration={1500}
                animationEasing="ease-in-out"
                data-testid="area-captado"
              />
              
              {/* Área - Realizado (Verde) */}
              <Area
                type="monotone"
                dataKey="realizado" 
                name="Realizado"
                stroke="#10B981"
                strokeWidth={3}
                fill="url(#realizadoGradient)"
                fillOpacity={1}
                dot={false}
                activeDot={dadosVisiveis ? { 
                  r: 6, 
                  stroke: '#10B981',
                  strokeWidth: 2,
                  fill: '#fff'
                } : false}
                animationDuration={1500}
                animationEasing="ease-in-out"
                data-testid="area-realizado"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Informações adicionais - mascaradas quando necessário */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-sm text-gray-600">Total Captado</div>
            <div className="text-lg font-bold text-gray-900">
              {dadosVisiveis ? formatarMoeda(
                dadosOriginais.reduce((acc, item) => acc + (item.captado || 0), 0)
              ) : '••••••••'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-600">Total Realizado</div>
            <div className="text-lg font-bold text-gray-900">
              {dadosVisiveis ? formatarMoeda(
                dadosOriginais.reduce((acc, item) => acc + (item.realizado || 0), 0)
              ) : '••••••••'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-600">Diferença</div>
            <div className={`text-lg font-bold ${dadosVisiveis ? (
              dadosOriginais.reduce((acc, item) => acc + (item.captado || 0), 0) - 
              dadosOriginais.reduce((acc, item) => acc + (item.realizado || 0), 0) >= 0
                ? 'text-green-600' 
                : 'text-red-600'
            ) : 'text-gray-500'}`}>
              {dadosVisiveis ? formatarMoeda(Math.abs(
                dadosOriginais.reduce((acc, item) => acc + (item.captado || 0), 0) - 
                dadosOriginais.reduce((acc, item) => acc + (item.realizado || 0), 0)
              )) : '••••••••'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
