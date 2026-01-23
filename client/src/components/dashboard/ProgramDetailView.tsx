import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  TrendingUp, 
  Target, 
  Activity,
  BarChart3,
  Calendar,
  PieChart as PieChartIcon,
  Home,
  Briefcase,
  Palette,
  Megaphone,
  Heart,
  Building,
  Users,
  Eye,
  Download
} from "lucide-react";
import { useProgramData, formatIndicatorValue, formatPercentage, PROGRAM_CONFIG, type ProcessedProgram } from '@/hooks/useDashboardData';

interface ProgramDetailViewProps {
  programSlug: string;
  onBack: () => void;
  className?: string;
}

// Chart type options
type ChartType = 'bar' | 'line' | 'area';

// Icon mapping for programs
const PROGRAM_ICONS = {
  'favela-3d': Home,
  'negocios-sociais': Building,
  'polo-esportivo-cultural': Palette,
  'casa-sonhar': Home,
  'psicossocial': Heart,
  'inclusao-produtiva': Briefcase,
  'marketing': Megaphone
} as const;

// Colors for charts
const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function ProgramDetailView({ programSlug, onBack, className = "" }: ProgramDetailViewProps) {
  const { program, loading, error } = useProgramData(programSlug);
  const [chartType, setChartType] = useState<ChartType>('bar');

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`} data-testid="program-detail-loading">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`} data-testid="program-detail-error">
        <div className="text-red-600 mb-4">
          <Activity className="w-12 h-12 mx-auto mb-2" />
          <p>Erro ao carregar dados do programa: {error}</p>
        </div>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  if (!program) {
    return (
      <div className={`text-center py-12 ${className}`} data-testid="program-not-found">
        <div className="text-gray-600 mb-4">
          <Users className="w-12 h-12 mx-auto mb-2" />
          <p>Programa não encontrado</p>
        </div>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  const config = PROGRAM_CONFIG[program.slug as keyof typeof PROGRAM_CONFIG] || PROGRAM_CONFIG.marketing;
  const IconComponent = PROGRAM_ICONS[program.slug as keyof typeof PROGRAM_ICONS] || Users;

  // Prepare chart data
  const monthlyChartData = program.monthlyData
    .filter(m => m.realized > 0 || m.target > 0)
    .map(m => ({
      month: m.month.substring(0, 3),
      fullMonth: m.month,
      realizado: m.realized,
      meta: m.target,
      performance: m.performance,
      cumprimento: m.target > 0 ? (m.realized / m.target) * 100 : 0
    }));

  // Indicators breakdown
  const monthlyIndicators = program.indicators.filter(ind => ind.type === 'month');
  const targetIndicators = program.indicators.filter(ind => ind.type === 'target');
  const otherIndicators = program.indicators.filter(ind => ind.type === 'other');

  // Calculate success rate
  const successfulMonths = monthlyChartData.filter(m => m.cumprimento >= 100).length;
  const successRate = monthlyChartData.length > 0 ? (successfulMonths / monthlyChartData.length) * 100 : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[250px]">
          <div className="font-semibold text-gray-900 mb-3 text-center">
            {data?.fullMonth || label}
          </div>
          <div className="space-y-2">
            {payload.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {item.dataKey === 'cumprimento' ? 'Cumprimento' : item.name || item.dataKey}:
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {item.dataKey === 'performance' || item.dataKey === 'cumprimento'
                    ? `${Math.round(item.value * 100) / 100}%`
                    : formatIndicatorValue(item.value)
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (monthlyChartData.length === 0) {
      return (
        <div className="h-96 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum dado disponível para gráfico</p>
          </div>
        </div>
      );
    }

    const commonProps = {
      data: monthlyChartData,
      margin: { top: 5, right: 30, left: 20, bottom: 60 }
    };

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="realizado" 
                stroke={config.color}
                strokeWidth={3}
                name="Realizado"
                dot={{ fill: config.color, strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8 }}
              />
              <Line 
                type="monotone" 
                dataKey="meta" 
                stroke="#FFD700"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Meta"
                dot={{ fill: "#FFD700", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
              <defs>
                <linearGradient id={`gradient-${program.slug}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config.color} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={config.color} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="realizado"
                stroke={config.color}
                fillOpacity={1}
                fill={`url(#gradient-${program.slug})`}
                name="Realizado"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="meta"
                stroke="#FFD700"
                fill="transparent"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Meta"
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      default: // 'bar'
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="meta" 
                fill="#FFD700" 
                name="Meta"
                radius={[2, 2, 0, 0]}
                opacity={0.7}
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
    <div className={`space-y-6 ${className}`} data-testid={`program-detail-${programSlug}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            onClick={onBack} 
            variant="ghost" 
            size="sm"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg bg-gradient-to-br ${config.gradient}`}>
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{program.name}</h2>
              <p className="text-gray-600">
                {program.performance.totalIndicators} indicadores · 
                {program.performance.monthlyIndicators} mensais
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={program.hasData ? "default" : "secondary"}
            data-testid={`status-${program.hasData ? 'active' : 'inactive'}`}
          >
            {program.hasData ? 'Dados Disponíveis' : 'Sem Dados'}
          </Badge>
        </div>
      </div>

      {!program.hasData ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Eye className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Programa sem dados disponíveis
            </h3>
            <p className="text-gray-500 mb-6">
              Este programa ainda não possui indicadores com dados válidos.
            </p>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card data-testid="metric-total-realized">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Realizado</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatIndicatorValue(program.performance.totalRealized)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="metric-total-target">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Target className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Meta Total</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatIndicatorValue(program.performance.totalTarget)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="metric-performance">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Performance Geral</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatPercentage(program.performance.averagePerformance)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="metric-success-rate">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatPercentage(successRate)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {successfulMonths}/{monthlyChartData.length} meses
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Progress */}
          <Card data-testid="performance-progress">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Performance vs Meta</h4>
                <span className="text-sm text-gray-600">
                  {formatIndicatorValue(program.performance.totalRealized)} / {formatIndicatorValue(program.performance.totalTarget)}
                </span>
              </div>
              <Progress 
                value={Math.min(program.performance.averagePerformance, 100)} 
                className="h-3 mb-2"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>0%</span>
                <span className="font-medium">{formatPercentage(program.performance.averagePerformance)}</span>
                <span>100%</span>
              </div>
            </CardContent>
          </Card>

          {/* Main Chart */}
          <Card data-testid="main-chart">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Evolução Mensal - {program.name}
                </CardTitle>
                <div className="flex gap-2">
                  {(['bar', 'line', 'area'] as ChartType[]).map((type) => (
                    <Button
                      key={type}
                      variant={chartType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChartType(type)}
                      data-testid={`chart-type-${type}`}
                    >
                      {type === 'bar' && <BarChart3 className="w-4 h-4" />}
                      {type === 'line' && <TrendingUp className="w-4 h-4" />}
                      {type === 'area' && <Activity className="w-4 h-4" />}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {renderChart()}
            </CardContent>
          </Card>

          {/* Monthly Performance Chart */}
          <Card data-testid="monthly-performance-chart">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-purple-600" />
                Taxa de Cumprimento por Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="month" 
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="cumprimento" 
                      fill={config.color}
                      name="Taxa de Cumprimento"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Indicators Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Indicators */}
            <Card data-testid="monthly-indicators">
              <CardHeader>
                <CardTitle className="text-lg">Indicadores Mensais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthlyIndicators.slice(0, 6).map((indicator, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">
                        {indicator.indicator}
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {formatIndicatorValue(indicator.value, indicator.unit)}
                      </span>
                    </div>
                  ))}
                  {monthlyIndicators.length > 6 && (
                    <Badge variant="outline" className="w-full text-center">
                      +{monthlyIndicators.length - 6} indicadores
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Target Indicators */}
            <Card data-testid="target-indicators">
              <CardHeader>
                <CardTitle className="text-lg">Metas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {targetIndicators.map((indicator, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">
                        {indicator.indicator}
                      </span>
                      <span className="text-sm font-bold text-amber-800">
                        {formatIndicatorValue(indicator.value, indicator.unit)}
                      </span>
                    </div>
                  ))}
                  {targetIndicators.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      Nenhuma meta definida
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Other Indicators */}
            <Card data-testid="other-indicators">
              <CardHeader>
                <CardTitle className="text-lg">Outros Indicadores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {otherIndicators.slice(0, 4).map((indicator, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">
                        {indicator.indicator}
                      </span>
                      <span className="text-sm font-bold text-blue-800">
                        {formatIndicatorValue(indicator.value, indicator.unit)}
                      </span>
                    </div>
                  ))}
                  {otherIndicators.length > 4 && (
                    <Badge variant="outline" className="w-full text-center">
                      +{otherIndicators.length - 4} indicadores
                    </Badge>
                  )}
                  {otherIndicators.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      Nenhum outro indicador
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}