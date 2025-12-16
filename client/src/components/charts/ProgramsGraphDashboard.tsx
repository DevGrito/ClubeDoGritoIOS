import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  RefreshCw, 
  Download,
  Filter,
  Grid3X3,
  List,
  Eye,
  EyeOff
} from "lucide-react";
import ProgramChart from './ProgramChart';
import { useProgramCharts, useProgramStats, exportProgramData } from '@/hooks/useProgramCharts';

interface ProgramsGraphDashboardProps {
  className?: string;
  showControls?: boolean;
  defaultView?: 'grid' | 'list';
  defaultChartType?: 'bar' | 'line' | 'pie';
}

export default function ProgramsGraphDashboard({ 
  className = "",
  showControls = true,
  defaultView = 'grid',
  defaultChartType = 'bar'
}: ProgramsGraphDashboardProps) {
  
  // Estados do dashboard
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>(defaultChartType);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultView);
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [showMetrics, setShowMetrics] = useState(true);
  
  // Hooks de dados
  const { programs, loading, error, lastUpdated, totalPrograms } = useProgramCharts(areaFilter);
  const { 
    totalIndicators, 
    programsWithData, 
    averageIndicatorsPerProgram 
  } = useProgramStats();

  // Função para exportar dados
  const handleExport = () => {
    try {
      const exportData = exportProgramData(programs);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `programas-monday-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
    }
  };

  // Função para forçar atualização
  const handleRefresh = () => {
    window.location.reload();
  };

  // Estados de carregamento e erro
  if (loading) {
    return (
      <div className={`space-y-6 ${className}`} data-testid="programs-dashboard-loading">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-64 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
          </CardHeader>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="h-96 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`} data-testid="programs-dashboard-error">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Erro ao Carregar Dados
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`} data-testid="programs-dashboard">
      {/* Header com controles */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-3 text-xl">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                Programas Monday.com
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Dashboard com gráficos separados por programa
              </p>
            </div>
            
            {showControls && (
              <div className="flex flex-wrap items-center gap-3">
                {/* Filtro por área */}
                <Select value={areaFilter} onValueChange={setAreaFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filtrar área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as áreas</SelectItem>
                    <SelectItem value="favela">Favela 3D</SelectItem>
                    <SelectItem value="inclusao">Inclusão Produtiva</SelectItem>
                    <SelectItem value="cultura">Cultura e Esporte</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="psico">Psicossocial</SelectItem>
                  </SelectContent>
                </Select>

                {/* Tipo de gráfico */}
                <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Barras
                      </div>
                    </SelectItem>
                    <SelectItem value="line">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Linha
                      </div>
                    </SelectItem>
                    <SelectItem value="pie">
                      <div className="flex items-center gap-2">
                        <PieChartIcon className="w-4 h-4" />
                        Pizza
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Modo de visualização */}
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>

                {/* Toggle métricas */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMetrics(!showMetrics)}
                >
                  {showMetrics ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>

                {/* Ações */}
                <Button onClick={handleRefresh} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4" />
                </Button>
                
                <Button onClick={handleExport} variant="outline" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Estatísticas resumidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalPrograms}</div>
                <div className="text-sm text-gray-600">Programas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{programsWithData}</div>
                <div className="text-sm text-gray-600">Com Dados</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <PieChartIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalIndicators}</div>
                <div className="text-sm text-gray-600">Indicadores</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{averageIndicatorsPerProgram}</div>
                <div className="text-sm text-gray-600">Média/Programa</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações de estado */}
      {lastUpdated && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Última atualização: {lastUpdated}
            </Badge>
            {areaFilter && areaFilter !== 'all' && (
              <Badge variant="secondary">
                Filtro: {areaFilter}
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {programs.length} de {totalPrograms} programas exibidos
          </div>
        </div>
      )}

      {/* Grid de gráficos dos programas */}
      {programs.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum programa encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                {areaFilter 
                  ? `Nenhum programa corresponde ao filtro "${areaFilter}"`
                  : 'Não há dados de programas disponíveis no momento'
                }
              </p>
              {areaFilter && areaFilter !== 'all' && (
                <Button onClick={() => setAreaFilter('')} variant="outline">
                  Limpar Filtro
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div 
          className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
              : "space-y-6"
          }
          data-testid="programs-grid"
        >
          {programs.map((program) => (
            <ProgramChart
              key={program.slug}
              program={program}
              chartType={chartType}
              showMetrics={showMetrics}
              className={viewMode === 'list' ? 'max-w-none' : ''}
            />
          ))}
        </div>
      )}

      {/* Footer com informações adicionais */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-600">
              <p>
                Dados obtidos do Monday.com através da API GV (Gestão à Vista).
                {lastUpdated && ` Período: ${lastUpdated}.`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700">
                ✓ Conectado
              </Badge>
              <span className="text-xs text-gray-500">
                Atualizado automaticamente
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}