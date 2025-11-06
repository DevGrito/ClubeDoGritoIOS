// pages/gestao-vista.tsx - Sistema de Gestão à Vista com dados reais
import { useState } from 'react';
import { useGV, type GVIndicatorData } from '@/hooks/useGV';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw, TrendingUp, Target, BarChart3, Activity, PieChart, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import Logo from '@/components/logo';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';

// Componente para renderizar indicador individual
function IndicatorRow({ indicator }: { indicator: GVIndicatorData }) {
  const percentage = indicator.atingimento_percentual;
  const ragColor = indicator.status_rag === 'Verde' ? 'green' : 
                   indicator.status_rag === 'Amarelo' ? 'yellow' : 
                   indicator.status_rag === 'Vermelho' ? 'red' : 'gray';
  
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-gray-900">{indicator.indicador_nome}</h4>
          {indicator.is_primary && (
            <Badge variant="secondary" className="text-xs">
              <Target className="w-3 h-3 mr-1" />
              Principal
            </Badge>
          )}
        </div>
        {indicator.meta > 0 && (
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            <Target className="w-3 h-3" />
            Meta: {indicator.meta}{indicator.indicador_unit && ` ${indicator.indicador_unit}`}
          </p>
        )}
      </div>
      <div className="text-right">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">
            {indicator.realizado || '—'}
          </span>
          {indicator.indicador_unit && <span className="text-sm text-gray-500">{indicator.indicador_unit}</span>}
        </div>
        {percentage > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <div className={`text-xs px-2 py-1 rounded-full ${
              ragColor === 'green' ? 'bg-green-100 text-green-800' :
              ragColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
              ragColor === 'red' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-600'
            }`}>
              {percentage.toFixed(1)}%
            </div>
            <TrendingUp className={`w-3 h-3 ${
              ragColor === 'green' ? 'text-green-600' : 'text-gray-400'
            }`} />
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para renderizar projeto
function ProjectCard({ projectName, indicators }: { projectName: string; indicators: GVIndicatorData[] }) {
  const primaryIndicators = indicators.filter(ind => ind.is_primary);
  const secondaryIndicators = indicators.filter(ind => !ind.is_primary);
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          {projectName}
        </CardTitle>
        <p className="text-xs text-gray-500">
          {indicators.length} indicador{indicators.length !== 1 ? 'es' : ''} • {primaryIndicators.length} principal{primaryIndicators.length !== 1 ? 'is' : ''}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-0">
          {/* Indicadores primários primeiro */}
          {primaryIndicators.map((indicator, idx) => (
            <IndicatorRow key={`primary-${idx}`} indicator={indicator} />
          ))}
          {/* Indicadores secundários depois */}
          {secondaryIndicators.map((indicator, idx) => (
            <IndicatorRow key={`secondary-${idx}`} indicator={indicator} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function GestaoVistaScreen() {
  const { toast } = useToast();
  
  // Estados para filtros
  const [period, setPeriod] = useState('2025-08');
  const [scope, setScope] = useState('monthly');
  const [sectorFilter, setSectorFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [ragFilter, setRagFilter] = useState('');
  
  const { data, loading, err } = useGV(period, scope);

  // Mutation para atualizar dados
  const refreshMutation = useMutation({
    mutationFn: async () => { window.location.reload(); return true; },
    onSuccess: () => {
      toast({
        title: "Dados atualizados",
        description: "Os dados de Gestão à Vista foram atualizados com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na atualização",
        description: error?.message || "Erro ao atualizar dados",
        variant: "destructive",
      });
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Carregando dados de Gestão à Vista...</p>
          </div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white border-b">
          <div className="px-4 py-4">
            <Logo />
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <h2 className="text-lg font-semibold text-red-800 mb-2">
                Erro ao carregar dados
              </h2>
              <p className="text-red-600 mb-4">{err}</p>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!data || !data.success) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Nenhum dado disponível</p>
        </div>
      </div>
    );
  }

  // Aplicar filtros aos dados
  const filteredData = data.data.filter(indicator => {
    if (sectorFilter && indicator.setor_nome !== sectorFilter) return false;
    if (projectFilter && indicator.projeto_nome !== projectFilter) return false;
    if (ragFilter && indicator.status_rag !== ragFilter) return false;
    return true;
  });

  // Agrupar dados filtrados por setor e projeto
  const groupedBySector = filteredData.reduce((acc, indicator) => {
    if (!acc[indicator.setor_slug]) {
      acc[indicator.setor_slug] = {
        sectorName: indicator.setor_nome,
        projects: {}
      };
    }
    if (!acc[indicator.setor_slug].projects[indicator.projeto_slug]) {
      acc[indicator.setor_slug].projects[indicator.projeto_slug] = {
        projectName: indicator.projeto_nome,
        indicators: []
      };
    }
    acc[indicator.setor_slug].projects[indicator.projeto_slug].indicators.push(indicator);
    return acc;
  }, {} as Record<string, { sectorName: string; projects: Record<string, { projectName: string; indicators: GVIndicatorData[] }> }>);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Gestão à Vista
              </h1>
              <p className="text-sm text-gray-600">
                Período: {data.period} • {data.scope}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Activity className="w-4 h-4" />
              {data.statistics.total_indicators} indicadores
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
          </div>
        </div>
      </header>

      {/* Filtros */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-900">Filtros</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Filtro de Período */}
            <div className="space-y-1">
              <Label htmlFor="period" className="text-xs text-gray-600">Período</Label>
              <Input
                id="period"
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="h-8 text-xs"
                data-testid="input-period"
              />
            </div>

            {/* Filtro de Escopo */}
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Escopo</Label>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger className="h-8 text-xs" data-testid="select-scope">
                  <SelectValue placeholder="Selecione o escopo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="semiannual">Semestral</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Programa */}
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Programa</Label>
              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger className="h-8 text-xs" data-testid="select-program">
                  <SelectValue placeholder="Todos os programas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os programas</SelectItem>
                  {data?.data && Array.from(new Set(data.data.map(item => item.setor_nome))).map(sector => (
                    <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Projeto */}
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Projeto</Label>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="h-8 text-xs" data-testid="select-project">
                  <SelectValue placeholder="Todos os projetos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os projetos</SelectItem>
                  {data?.data && Array.from(new Set(data.data
                    .filter(item => !sectorFilter || item.setor_nome === sectorFilter)
                    .map(item => item.projeto_nome)
                  )).map(project => (
                    <SelectItem key={project} value={project}>{project}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Status RAG */}
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Status RAG</Label>
              <Select value={ragFilter} onValueChange={setRagFilter}>
                <SelectTrigger className="h-8 text-xs" data-testid="select-rag">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  <SelectItem value="Verde">Verde</SelectItem>
                  <SelectItem value="Amarelo">Amarelo</SelectItem>
                  <SelectItem value="Vermelho">Vermelho</SelectItem>
                  <SelectItem value="Neutro">Neutro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-3">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{data.statistics.total_indicators}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{data.statistics.verde_count}</div>
                <div className="text-xs text-gray-500">Verde</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600">{data.statistics.amarelo_count}</div>
                <div className="text-xs text-gray-500">Amarelo</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{data.statistics.vermelho_count}</div>
                <div className="text-xs text-gray-500">Vermelho</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-600">{data.statistics.neutral_count}</div>
                <div className="text-xs text-gray-500">Neutro</div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            
            {/* Gráfico de Barras: Meta vs Realizado por Projeto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Meta vs Realizado por Projeto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(groupedBySector).flatMap(([, sector]) =>
                    Object.entries(sector.projects).map(([, project]) => {
                      const totalMeta = project.indicators.reduce((sum, ind) => sum + ind.meta, 0);
                      const totalRealizado = project.indicators.reduce((sum, ind) => sum + ind.realizado, 0);
                      return {
                        projeto: project.projectName,
                        Meta: totalMeta,
                        Realizado: totalRealizado
                      };
                    })
                  )}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="projeto" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Meta" fill="#3b82f6" name="Meta" />
                    <Bar dataKey="Realizado" fill="#10b981" name="Realizado" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Pizza: Distribuição Status RAG */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Distribuição de Status RAG
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'Verde', value: data.statistics.verde_count, color: '#10b981' },
                        { name: 'Amarelo', value: data.statistics.amarelo_count, color: '#f59e0b' },
                        { name: 'Vermelho', value: data.statistics.vermelho_count, color: '#ef4444' },
                        { name: 'Neutro', value: data.statistics.neutral_count, color: '#6b7280' }
                      ].filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {[
                        { name: 'Verde', value: data.statistics.verde_count, color: '#10b981' },
                        { name: 'Amarelo', value: data.statistics.amarelo_count, color: '#f59e0b' },
                        { name: 'Vermelho', value: data.statistics.vermelho_count, color: '#ef4444' },
                        { name: 'Neutro', value: data.statistics.neutral_count, color: '#6b7280' }
                      ].filter(item => item.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

          </div>

          {/* Gráfico de Área: Evolução por Setor */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance por Programa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={Object.entries(groupedBySector).map(([, sector]) => {
                  const sectorIndicators = Object.values(sector.projects).flatMap(p => p.indicators);
                  const totalMeta = sectorIndicators.reduce((sum, ind) => sum + ind.meta, 0);
                  const totalRealizado = sectorIndicators.reduce((sum, ind) => sum + ind.realizado, 0);
                  const atingimento = totalMeta > 0 ? Math.round((totalRealizado / totalMeta) * 100) : 0;
                  
                  return {
                    programa: sector.sectorName,
                    Meta: totalMeta,
                    Realizado: totalRealizado,
                    "Atingimento %": atingimento
                  };
                })}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="programa" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="Meta" 
                    stackId="1" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Realizado" 
                    stackId="2" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.8}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="space-y-8">
          {Object.entries(groupedBySector).map(([sectorSlug, sector]) => (
            <div key={sectorSlug} className="space-y-4">
              <div className="bg-white rounded-lg border p-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {sector.sectorName}
                </h2>
                <p className="text-gray-600 text-sm">
                  {Object.keys(sector.projects).length} projeto{Object.keys(sector.projects).length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(sector.projects).map(([projectSlug, project]) => (
                  <ProjectCard 
                    key={projectSlug} 
                    projectName={project.projectName} 
                    indicators={project.indicators} 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {data.data.length === 0 && (
          <Card className="text-center p-8">
            <CardContent>
              <TrendingUp className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum indicador encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                Configure seus indicadores para visualizar os dados aqui.
              </p>
              <Button onClick={() => window.location.reload()}>
                Atualizar dados
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}