import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Home, Briefcase, Palette, Megaphone, Heart } from "lucide-react";
import { formatIndicatorValue, getIndicatorType, mapIndicatorName } from '@/hooks/useProgramCharts';

interface ProgramIndicator {
  indicator: string;
  originalIndicator?: string;
  value: number | null;
  unit: string | null;
  target: number | null;
  type?: 'month' | 'target' | 'responsible' | 'other';
}

interface ProgramData {
  slug: string;
  name: string;
  indicators: ProgramIndicator[];
}

interface ProgramChartProps {
  program: ProgramData;
  chartType?: 'bar' | 'line' | 'pie';
  className?: string;
  loading?: boolean;
  showMetrics?: boolean;
}

// Configuração de cores e ícones por programa - Paleta Corporativa O Grito
const PROGRAM_CONFIG = {
  'favela-3d': { 
    name: 'Favela 3D',
    color: '#0F4C5C', 
    bgColor: 'bg-gray-50',
    icon: Home,
    gradient: 'from-[#0F4C5C] to-[#0a3a46]' 
  },
  'inclusao-produtiva': { 
    name: 'Inclusão Produtiva',
    color: '#2563EB', 
    bgColor: 'bg-blue-50',
    icon: Briefcase,
    gradient: 'from-[#2563EB] to-[#1d4ed8]' 
  },
  'esporte-cultura': { 
    name: 'Cultura e Esporte',
    color: '#7AAAD6', 
    bgColor: 'bg-blue-50',
    icon: Palette,
    gradient: 'from-[#7AAAD6] to-[#5a8ab6]' 
  },
  'marketing': { 
    name: 'Marketing',
    color: '#FFCC00', 
    bgColor: 'bg-yellow-50',
    icon: Megaphone,
    gradient: 'from-[#FFCC00] to-[#e6b800]' 
  },
  'psicossocial': { 
    name: 'Psicossocial',
    color: '#6B7280', 
    bgColor: 'bg-gray-50',
    icon: Heart,
    gradient: 'from-[#6B7280] to-[#4b5563]' 
  }
} as const;

// Função para formatar valores monetários
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Função para processar dados para gráficos
const processChartData = (indicators: ProgramIndicator[], chartType: string) => {
  // Filtrar indicadores mensais usando o tipo do indicador
  const monthlyIndicators = indicators.filter(ind => ind.type === 'month');
  
  const metaIndicator = indicators.find(ind => ind.type === 'target');

  if (chartType === 'pie') {
    // Para gráfico de pizza, mostrar distribuição dos valores mensais
    return monthlyIndicators
      .filter(ind => ind.value && ind.value > 0)
      .map(ind => ({
        name: ind.indicator,
        value: ind.value || 0,
        fill: `hsl(${Math.random() * 360}, 70%, 60%)`
      }));
  }

  // Para gráficos de barra e linha
  const chartData = monthlyIndicators.map(ind => {
    const originalMonth = ind.originalIndicator?.toLowerCase().trim() || '';
    const mesIndex = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
                      .indexOf(originalMonth);
    
    return {
      mes: ind.indicator.replace('Realizado em ', ''),
      mesCompleto: ind.indicator,
      realizado: ind.value || 0,
      meta: metaIndicator?.value || 0,
      mesIndex,
      unit: ind.unit
    };
  })
  .sort((a, b) => a.mesIndex - b.mesIndex)
  .map(({ mesIndex, ...rest }) => rest);

  return chartData;
};

// Componente de tooltip personalizado - Estilo Corporativo
const CustomTooltip = ({ active, payload, label, programColor }: any) => {
  if (active && payload && payload.length) {
    const entryData = payload[0]?.payload;
    const unit = entryData?.unit;
    
    return (
      <div className="bg-white border-2 border-gray-200 rounded-lg shadow-lg p-4 min-w-[200px]">
        <div className="font-semibold text-gray-900 mb-2 text-center">
          {label}
        </div>
        <div className="space-y-2">
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium" style={{ color: '#374151' }}>
                  {item.name === 'realizado' ? 'Realizado:' : 'Meta:'}
                </span>
              </div>
              <span className="text-sm font-bold" style={{ color: '#374151' }}>
                {formatIndicatorValue(item.value, unit)}
              </span>
            </div>
          ))}
        </div>
        {entryData && (
          <div className="mt-2 pt-2 border-t" style={{ borderColor: '#E5E7EB' }}>
            <div className="text-xs text-center" style={{ color: '#6B7280' }}>
              {entryData.mesCompleto || label}
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

// Componente principal do gráfico
export default function ProgramChart({ 
  program, 
  chartType = 'bar', 
  className = "", 
  loading = false,
  showMetrics = true 
}: ProgramChartProps) {
  
  const config = PROGRAM_CONFIG[program.slug as keyof typeof PROGRAM_CONFIG] || PROGRAM_CONFIG['marketing'];
  const IconComponent = config.icon;
  
  // Processar dados para o gráfico
  const chartData = processChartData(program.indicators, chartType);
  
  // Calcular métricas
  const monthlyIndicators = program.indicators.filter(ind => ind.type === 'month');
  const totalRealizado = monthlyIndicators
    .filter(ind => ind.value && ind.value > 0)
    .reduce((sum, ind) => sum + (ind.value || 0), 0);
    
  const metaIndicator = program.indicators.find(ind => ind.type === 'target');
  
  const percentualMeta = metaIndicator?.value && metaIndicator.value > 0 
    ? (totalRealizado / metaIndicator.value) * 100 
    : 0;

  // Estado de loading
  if (loading) {
    return (
      <Card className={`${config.bgColor} border-2 ${className}`} data-testid={`program-chart-loading-${program.slug}`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${config.gradient}`}>
              <IconComponent className="w-5 h-5 text-white" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
            {showMetrics && (
              <div className="grid grid-cols-2 gap-4">
                <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderizar gráfico baseado no tipo
  const renderChart = () => {
    const height = 280;
    
    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="mes" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
                stroke="#6B7280"
                tick={{ fill: '#374151' }}
              />
              <YAxis 
                fontSize={12}
                stroke="#6B7280"
                tick={{ fill: '#374151' }}
              />
              <Tooltip content={<CustomTooltip programColor={config.color} />} />
              <Line 
                type="monotone" 
                dataKey="realizado" 
                stroke={config.color}
                strokeWidth={3}
                dot={{ fill: config.color, strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: config.color }}
              />
              <Line 
                type="monotone" 
                dataKey="meta" 
                stroke="#FFCC00"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "#FFCC00", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
        
      default: // 'bar'
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="mes" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
                stroke="#6B7280"
                tick={{ fill: '#374151' }}
              />
              <YAxis 
                fontSize={12}
                stroke="#6B7280"
                tick={{ fill: '#374151' }}
              />
              <Tooltip content={<CustomTooltip programColor={config.color} />} />
              <Bar 
                dataKey="meta" 
                fill="#FFCC00" 
                name="Meta"
                radius={[2, 2, 0, 0]}
                opacity={0.8}
              />
              <Bar 
                dataKey="realizado" 
                fill={config.color} 
                name="Realizado"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Card 
      className={`${config.bgColor} border-2 hover:shadow-lg transition-shadow ${className}`}
      data-testid={`program-chart-${program.slug}`}
    >
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${config.gradient}`}>
            <IconComponent className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{config.name}</h3>
            <p className="text-sm text-gray-600">
              {program.indicators.length} indicadores
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Gráfico */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          {chartData.length > 0 ? (
            renderChart()
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum dado disponível</p>
              </div>
            </div>
          )}
        </div>

        {/* Métricas resumidas */}
        {showMetrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Total Realizado</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: config.color }}>
                {formatIndicatorValue(totalRealizado, monthlyIndicators[0]?.unit)}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-gray-700">% da Meta</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-gray-900">
                  {percentualMeta.toFixed(1)}%
                </div>
                <Badge 
                  variant={percentualMeta >= 100 ? "default" : percentualMeta >= 80 ? "secondary" : "outline"}
                  className={
                    percentualMeta >= 100 ? "bg-green-100 text-green-800" :
                    percentualMeta >= 80 ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }
                >
                  {percentualMeta >= 100 ? "Atingida" : percentualMeta >= 80 ? "Quase" : "Abaixo"}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}