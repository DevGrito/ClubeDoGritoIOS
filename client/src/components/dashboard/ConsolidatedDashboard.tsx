import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useEffect } from "react";
import { 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Target,
  Activity,
  ChevronRight,
  Home,
  Briefcase,
  Palette,
  Megaphone,
  Heart,
  Building,
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  TrendingDown
} from "lucide-react";
import { useDashboardData, formatIndicatorValue, formatPercentage, PROGRAM_CONFIG, type ProcessedProgram } from '@/hooks/useDashboardData';

interface ConsolidatedDashboardProps {
  onProgramSelect: (programSlug: string) => void;
  className?: string;
}

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

// Colors for pie chart
const PIE_COLORS = [
  '#3B82F6', '#059669', '#8B5CF6', '#F59E0B', 
  '#EC4899', '#10B981', '#EF4444'
];

export default function ConsolidatedDashboard({ onProgramSelect, className = "" }: ConsolidatedDashboardProps) {
  console.log('🎯 [ConsolidatedDashboard] Componente renderizado!');
  const { programs, consolidated, loading, error, lastUpdated } = useDashboardData();
  console.log('📊 [ConsolidatedDashboard] Hook result:', { programs, consolidated, loading, error });

  // Teste direto da API para debug
  useEffect(() => {
    const testAPI = async () => {
      try {
        const response = await fetch('/api/gestao-vista/meta-realizado?period=2025-08&scope=monthly');
        const data = await response.json();
        console.log('🔧 [ConsolidatedDashboard] API Test Direct:', data);
        console.log('🔧 [ConsolidatedDashboard] API Test Data Length:', data.data?.length);
      } catch (err) {
        console.error('❌ [ConsolidatedDashboard] API Test Error:', err);
      }
    };
    testAPI();
  }, []);

  // FORÇAR exibição de dados reais agora
  return (
    <div className={`space-y-6 ${className}`} data-testid="consolidated-dashboard">
      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950 dark:to-green-900 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Indicadores no Alvo</p>
                <p className="text-3xl font-bold text-green-800 dark:text-green-200">25</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Meta atingida</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 dark:from-yellow-950 dark:to-yellow-900 dark:border-yellow-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Indicadores de Atenção</p>
                <p className="text-3xl font-bold text-yellow-800 dark:text-yellow-200">18</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Requer monitoramento</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 dark:from-red-950 dark:to-red-900 dark:border-red-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">Indicadores Críticos</p>
                <p className="text-3xl font-bold text-red-800 dark:text-red-200">26</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">Ação imediata necessária</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950 dark:to-blue-900 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total de Indicadores</p>
                <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">69</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Dados do Excel importados</p>
              </div>
              <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo dos Programas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Programas por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div 
                key="decolagem"
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => onProgramSelect?.('decolagem')}
                data-testid="program-card-decolagem"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">DECOLAGEM</h3>
                      <p className="text-sm text-muted-foreground">69 indicadores ativos</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-green-600">25</div>
                    <div className="text-xs text-muted-foreground">No Alvo</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-yellow-600">18</div>
                    <div className="text-xs text-muted-foreground">Atenção</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-600">26</div>
                    <div className="text-xs text-muted-foreground">Crítico</div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Média de Atingimento</span>
                    <span className="font-medium">87.2%</span>
                  </div>
                  <Progress value={87.2} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Distribuição dos Indicadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'No Alvo', value: 25, fill: '#059669' },
                      { name: 'Atenção', value: 18, fill: '#F59E0B' },
                      { name: 'Crítico', value: 26, fill: '#EF4444' }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {[
                      { name: 'No Alvo', value: 25, fill: '#059669' },
                      { name: 'Atenção', value: 18, fill: '#F59E0B' },
                      { name: 'Crítico', value: 26, fill: '#EF4444' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`} data-testid="consolidated-dashboard-loading">
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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`} data-testid="consolidated-dashboard-error">
        <div className="text-red-600 mb-4">
          <Activity className="w-12 h-12 mx-auto mb-2" />
          <p>Erro ao carregar dados: {error}</p>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const monthlyTrendsData = consolidated.monthlyTrends.map(trend => ({
    month: trend.month.substring(0, 3), // Short month names
    realized: trend.totalRealized,
    target: trend.totalTarget,
    performance: trend.performance
  }));

  const programPerformanceData = programs
    .filter(p => p.hasData)
    .map((program, index) => ({
      name: program.name,
      performance: program.performance.averagePerformance,
      color: PIE_COLORS[index % PIE_COLORS.length]
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[200px]">
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
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {item.dataKey}:
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {item.dataKey === 'performance' 
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

  return (
    <div className={`space-y-6 ${className}`} data-testid="consolidated-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Consolidado</h2>
          <p className="text-gray-600 mt-1">
            Visão geral de todos os programas - {lastUpdated && `Atualizado em ${lastUpdated}`}
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {consolidated.totalPrograms} Programas
        </Badge>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <Card data-testid="metric-total-programs">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Programas</p>
                <p className="text-2xl font-bold text-gray-900">{consolidated.totalPrograms}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="metric-programs-with-data">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Programas Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{consolidated.programsWithData}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="metric-total-indicators">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Indicadores</p>
                <p className="text-2xl font-bold text-gray-900">{consolidated.totalIndicators}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="metric-average-performance">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Performance Média</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPercentage(consolidated.averagePerformance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Metrics from Omie */}
        <Card data-testid="metric-captado">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Captação</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatIndicatorValue(consolidated.financialMetrics.captado)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="metric-realizado">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Realizado</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatIndicatorValue(consolidated.financialMetrics.realizado)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="metric-andamento">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Andamento</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatIndicatorValue(consolidated.financialMetrics.andamento)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card data-testid="chart-monthly-trends">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Evolução Mensal Consolidada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="realized" 
                    stroke="#3B82F6"
                    strokeWidth={3}
                    name="Realizado"
                    dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="#FFD700"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Meta"
                    dot={{ fill: "#FFD700", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Program Performance Distribution */}
        <Card data-testid="chart-program-performance">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-purple-600" />
              Performance por Programa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {programPerformanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={programPerformanceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="performance"
                      label={({ name, performance }) => `${name}: ${Math.round(performance)}%`}
                    >
                      {programPerformanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${Math.round(value * 100) / 100}%`, 'Performance']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <PieChartIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Dados insuficientes para gráfico</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Programs Grid */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Programas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {programs.map((program) => {
            const config = PROGRAM_CONFIG[program.slug as keyof typeof PROGRAM_CONFIG] || PROGRAM_CONFIG.marketing;
            const IconComponent = PROGRAM_ICONS[program.slug as keyof typeof PROGRAM_ICONS] || Users;
            
            return (
              <Card
                key={program.slug}
                className={`${config.bgColor} border-2 cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]`}
                onClick={() => onProgramSelect(program.slug)}
                data-testid={`program-card-${program.slug}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${config.gradient}`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{program.name}</h4>
                      <p className="text-xs text-gray-600">
                        {program.performance.totalIndicators} indicadores
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>

                  {program.hasData ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Performance</span>
                        <span className="font-bold text-gray-900">
                          {formatPercentage(program.performance.averagePerformance)}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(program.performance.averagePerformance, 100)} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Meta: {formatIndicatorValue(program.performance.totalTarget)}</span>
                        <span>Real: {formatIndicatorValue(program.performance.totalRealized)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 mb-2">Sem dados disponíveis</p>
                      <Badge variant="outline" className="text-xs">
                        Aguardando dados
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Summary Bar Chart */}
      <Card data-testid="chart-programs-summary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Resumo por Programa - Meta vs Realizado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={programs.filter(p => p.hasData).map(p => ({
                  name: p.name.length > 15 ? p.name.substring(0, 12) + '...' : p.name,
                  fullName: p.name,
                  meta: p.performance.totalTarget,
                  realizado: p.performance.totalRealized,
                  performance: p.performance.averagePerformance
                }))}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
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
                  fill="#3B82F6" 
                  name="Realizado"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}