import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Target, 
  RefreshCw,
  Clock,
  AlertCircle
} from "lucide-react";
import ConsolidatedDashboard from './ConsolidatedDashboard';
import ProgramDetailView from './ProgramDetailView';
import { useDashboardData, PROGRAM_DISPLAY_NAMES } from '@/hooks/useDashboardData';
import { queryClient } from '@/lib/queryClient';

interface InteractiveDashboardProps {
  className?: string;
  defaultView?: 'consolidated' | 'program';
  defaultProgram?: string;
}

type DashboardView = 'consolidated' | 'program';

export default function InteractiveDashboard({ 
  className = "",
  defaultView = 'consolidated',
  defaultProgram 
}: InteractiveDashboardProps) {
  const [currentView, setCurrentView] = useState<DashboardView>(defaultView);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(
    defaultProgram || null
  );
  
  const { consolidated, loading, error, lastUpdated } = useDashboardData();

  // Handle program selection
  const handleProgramSelect = useCallback((programSlug: string) => {
    setSelectedProgram(programSlug);
    setCurrentView('program');
  }, []);

  // Handle back to consolidated view
  const handleBackToConsolidated = useCallback(() => {
    setCurrentView('consolidated');
    setSelectedProgram(null);
  }, []);

  // Handle view toggle via tabs
  const handleViewChange = useCallback((view: DashboardView) => {
    setCurrentView(view);
    if (view === 'consolidated') {
      setSelectedProgram(null);
    }
  }, []);

  // Refresh data by invalidating relevant queries
  const handleRefresh = useCallback(async () => {
    try {
      // Invalidate dashboard data queries
      await queryClient.invalidateQueries({ queryKey: ['/api/gv'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/omie'] });
      
      // Optional: Force refetch immediately
      await queryClient.refetchQueries({ queryKey: ['/api/gv'] });
      
      console.log('✅ Dashboard data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing dashboard data:', error);
    }
  }, []);

  const getProgramDisplayName = (slug: string | null) => {
    if (!slug) return '';
    return PROGRAM_DISPLAY_NAMES[slug as keyof typeof PROGRAM_DISPLAY_NAMES] || slug;
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`} data-testid="interactive-dashboard">
      {/* Dashboard Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Title and Breadcrumb */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">
                  Dashboard Gestão à Vista
                </h1>
              </div>
              
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Button
                  variant={currentView === 'consolidated' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleViewChange('consolidated')}
                  data-testid="nav-consolidated"
                  className="h-8"
                >
                  <LayoutDashboard className="w-4 h-4 mr-1" />
                  Visão Geral
                </Button>
                
                {currentView === 'program' && selectedProgram && (
                  <>
                    <span className="text-gray-400">/</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      data-testid="nav-program"
                    >
                      <Target className="w-4 h-4 mr-1" />
                      {getProgramDisplayName(selectedProgram)}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Status and Actions */}
            <div className="flex items-center gap-3">
              {/* Status Indicator */}
              {loading && (
                <Badge variant="secondary" className="animate-pulse" data-testid="status-loading">
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Carregando...
                </Badge>
              )}
              
              {error && (
                <Badge variant="destructive" data-testid="status-error">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Erro
                </Badge>
              )}
              
              {!loading && !error && (
                <Badge variant="outline" data-testid="status-success">
                  <Clock className="w-3 h-3 mr-1" />
                  {lastUpdated || 'Dados atualizados'}
                </Badge>
              )}

              {/* Refresh Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                data-testid="button-refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Quick Stats Banner */}
        {!loading && !error && (
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-none" data-testid="stats-banner">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {consolidated.totalPrograms}
                  </div>
                  <div className="text-sm text-gray-600">Programas</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {consolidated.programsWithData}
                  </div>
                  <div className="text-sm text-gray-600">Com Dados</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {consolidated.totalIndicators}
                  </div>
                  <div className="text-sm text-gray-600">Indicadores</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">
                    {Math.round(consolidated.averagePerformance * 100) / 100}%
                  </div>
                  <div className="text-sm text-gray-600">Performance</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Tabs - Only show when in program view */}
        {currentView === 'program' && (
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost" 
                  size="sm"
                  onClick={handleBackToConsolidated}
                  data-testid="button-back-to-consolidated"
                  className="text-blue-600 hover:text-blue-700"
                >
                  ← Voltar para Visão Geral
                </Button>
              </div>
              
              <div className="text-sm text-gray-500">
                Visualizando: <span className="font-medium">{getProgramDisplayName(selectedProgram)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Dashboard Content */}
        <div className="min-h-[600px]">
          {currentView === 'consolidated' ? (
            <ConsolidatedDashboard 
              onProgramSelect={handleProgramSelect}
              data-testid="dashboard-consolidated-view"
            />
          ) : (
            selectedProgram && (
              <ProgramDetailView 
                programSlug={selectedProgram}
                onBack={handleBackToConsolidated}
                data-testid="dashboard-program-view"
              />
            )
          )}
          
          {currentView === 'program' && !selectedProgram && (
            <Card className="text-center py-12" data-testid="no-program-selected">
              <CardContent>
                <div className="text-gray-500 mb-4">
                  <Target className="w-16 h-16 mx-auto mb-2 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">Nenhum programa selecionado</h3>
                  <p>Retorne à visão geral para selecionar um programa.</p>
                </div>
                <Button onClick={handleBackToConsolidated} variant="outline">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Voltar à Visão Geral
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span>© 2025 Clube do Grito - Dashboard Gestão à Vista</span>
              {lastUpdated && (
                <span>
                  Última atualização: {lastUpdated}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {consolidated.totalPrograms} programas monitorados
              </Badge>
              <Badge variant="outline" className="text-xs">
                {consolidated.totalIndicators} indicadores ativos
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export type { DashboardView, InteractiveDashboardProps };