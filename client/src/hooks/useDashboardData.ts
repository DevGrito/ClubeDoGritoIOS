import { useMemo } from 'react';
import { useGV } from '@/hooks/useGV';
import { useOmieData } from '@/hooks/useOmieData';
import type { Program, Workstream, Indicator } from '@/services/gv';

// Fixed list of programs as specified
export const FIXED_PROGRAMS = [
  'favela-3d',
  'negocios-sociais', 
  'polo-esportivo-cultural',
  'casa-sonhar',
  'psicossocial',
  'inclusao-produtiva',
  'marketing'
] as const;

export const PROGRAM_DISPLAY_NAMES = {
  'favela-3d': 'Favela 3D',
  'negocios-sociais': 'Negócios Sociais',
  'polo-esportivo-cultural': 'Polo Esportivo Cultural', 
  'casa-sonhar': 'Casa Sonhar',
  'psicossocial': 'Psicossocial',
  'inclusao-produtiva': 'Inclusão Produtiva',
  'marketing': 'Marketing'
} as const;

export const PROGRAM_CONFIG = {
  'favela-3d': { 
    color: '#3B82F6', 
    bgColor: 'bg-blue-50',
    gradient: 'from-blue-400 to-blue-600' 
  },
  'negocios-sociais': { 
    color: '#059669', 
    bgColor: 'bg-emerald-50',
    gradient: 'from-emerald-400 to-emerald-600' 
  },
  'polo-esportivo-cultural': { 
    color: '#8B5CF6', 
    bgColor: 'bg-purple-50',
    gradient: 'from-purple-400 to-purple-600' 
  },
  'casa-sonhar': { 
    color: '#F59E0B', 
    bgColor: 'bg-amber-50',
    gradient: 'from-amber-400 to-amber-600' 
  },
  'psicossocial': { 
    color: '#EC4899', 
    bgColor: 'bg-pink-50',
    gradient: 'from-pink-400 to-pink-600' 
  },
  'inclusao-produtiva': { 
    color: '#10B981', 
    bgColor: 'bg-green-50',
    gradient: 'from-green-400 to-green-600' 
  },
  'marketing': { 
    color: '#EF4444', 
    bgColor: 'bg-red-50',
    gradient: 'from-red-400 to-red-600' 
  }
} as const;

export interface ProcessedIndicator {
  indicator: string;
  originalIndicator: string;
  value: number | null;
  unit: string | null;
  target: number | null;
  type: 'month' | 'target' | 'responsible' | 'other';
}

export interface ProcessedProgram {
  slug: string;
  name: string;
  indicators: ProcessedIndicator[];
  monthlyData: Array<{
    month: string;
    realized: number;
    target: number;
    performance: number; // percentage
  }>;
  performance: {
    totalRealized: number;
    totalTarget: number;
    averagePerformance: number; // percentage
    totalIndicators: number;
    monthlyIndicators: number;
    targetIndicators: number;
  };
  hasData: boolean;
}

export interface ConsolidatedData {
  programs: ProcessedProgram[];
  consolidated: {
    totalPrograms: number;
    totalIndicators: number;
    totalRealized: number;
    totalTarget: number;
    averagePerformance: number;
    programsWithData: number;
    // Métricas financeiras do Omie
    financialMetrics: {
      captado: number;
      realizado: number;
      saldo: number;
      andamento: number; // Calculado baseado nos dados
    };
    monthlyTrends: Array<{
      month: string;
      totalRealized: number;
      totalTarget: number;
      performance: number;
    }>;
  };
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

/**
 * Determine indicator type based on content
 */
function getIndicatorType(indicator: string): 'month' | 'target' | 'responsible' | 'other' {
  const normalized = indicator.toLowerCase().trim();
  
  if (normalized.includes('meta')) return 'target';
  if (normalized.includes('responsável') || normalized.includes('responsavel')) return 'responsible';
  
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  
  if (months.some(month => normalized.includes(month))) return 'month';
  
  return 'other';
}

/**
 * Map indicator names to friendly display names
 */
function mapIndicatorName(indicator: string): string {
  const normalized = indicator.toLowerCase().trim();
  
  const monthMap = {
    'janeiro': 'Janeiro',
    'fevereiro': 'Fevereiro', 
    'março': 'Março',
    'abril': 'Abril',
    'maio': 'Maio',
    'junho': 'Junho',
    'julho': 'Julho',
    'agosto': 'Agosto',
    'setembro': 'Setembro',
    'outubro': 'Outubro',
    'novembro': 'Novembro',
    'dezembro': 'Dezembro'
  };

  for (const [key, value] of Object.entries(monthMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }

  if (normalized.includes('meta')) return 'Meta';
  if (normalized.includes('responsável') || normalized.includes('responsavel')) return 'Responsáveis';
  
  return indicator.charAt(0).toUpperCase() + indicator.slice(1);
}

/**
 * Process program data into structured format
 */
function processProgram(program: Program): ProcessedProgram {
  // Collect all indicators from all workstreams
  const allIndicators: ProcessedIndicator[] = [];
  
  program.workstreams.forEach((workstream: Workstream) => {
    workstream.indicators.forEach((indicator: Indicator) => {
      allIndicators.push({
        indicator: mapIndicatorName(indicator.indicator),
        originalIndicator: indicator.indicator,
        value: indicator.value,
        unit: indicator.unit,
        target: indicator.target,
        type: getIndicatorType(indicator.indicator)
      });
    });
  });

  // Filter monthly and target indicators
  const monthlyIndicators = allIndicators.filter(ind => ind.type === 'month');
  const targetIndicator = allIndicators.find(ind => ind.type === 'target');
  
  // Process monthly data
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  const monthlyData = months.map(month => {
    const monthIndicator = monthlyIndicators.find(ind => 
      ind.indicator.toLowerCase().includes(month.toLowerCase())
    );
    
    const realized = monthIndicator?.value || 0;
    const target = targetIndicator?.value || 0;
    const performance = target > 0 ? (realized / target) * 100 : 0;
    
    return {
      month,
      realized,
      target,
      performance: Math.round(performance * 100) / 100
    };
  });

  // Calculate performance metrics
  const totalRealized = monthlyIndicators
    .filter(ind => ind.value && ind.value > 0)
    .reduce((sum, ind) => sum + (ind.value || 0), 0);
    
  const totalTarget = targetIndicator?.value || 0;
  const averagePerformance = totalTarget > 0 ? (totalRealized / totalTarget) * 100 : 0;
  
  const hasData = allIndicators.some(ind => 
    ind.value !== null && ind.value !== undefined && ind.value > 0
  );

  const displayName = PROGRAM_DISPLAY_NAMES[program.slug as keyof typeof PROGRAM_DISPLAY_NAMES] || 
                     program.slug.charAt(0).toUpperCase() + program.slug.slice(1).replace(/-/g, ' ');

  return {
    slug: program.slug,
    name: displayName,
    indicators: allIndicators,
    monthlyData,
    performance: {
      totalRealized,
      totalTarget,
      averagePerformance: Math.round(averagePerformance * 100) / 100,
      totalIndicators: allIndicators.length,
      monthlyIndicators: monthlyIndicators.length,
      targetIndicators: targetIndicator ? 1 : 0
    },
    hasData
  };
}

/**
 * Main hook for dashboard data processing
 */
export function useDashboardData(): ConsolidatedData {
  console.log('🚀 [useDashboardData] Hook executado!');
  const { data: gvData, loading, error } = useGV('2025-08'); // Usando período com dados
  console.log('📦 [useDashboardData] useGV data:', gvData);
  const { data: omieData, loading: omieLoading } = useOmieData();

  const processedData = useMemo(() => {
    if (!gvData?.programs) {
      return {
        programs: [],
        consolidated: {
          totalPrograms: 0,
          totalIndicators: 0,
          totalRealized: 0,
          totalTarget: 0,
          averagePerformance: 0,
          programsWithData: 0,
          financialMetrics: {
            captado: 0,
            realizado: 0,
            saldo: 0,
            andamento: 0
          },
          monthlyTrends: []
        }
      };
    }

    console.log('🔄 [useDashboardData] Processing programs for dashboard:', gvData.programs.length);
    console.log('🔍 [DEBUG] gvData structure:', gvData);

    // Process each program
    const processedPrograms = gvData.programs.map((program: any) => processProgram(program));

    // Filter only the fixed programs we want to display
    const fixedPrograms = FIXED_PROGRAMS.map(slug => {
      const found = processedPrograms.find(p => p.slug === slug);
      if (found) return found;
      
      // Create placeholder for missing programs
      return {
        slug,
        name: PROGRAM_DISPLAY_NAMES[slug],
        indicators: [],
        monthlyData: [],
        performance: {
          totalRealized: 0,
          totalTarget: 0,
          averagePerformance: 0,
          totalIndicators: 0,
          monthlyIndicators: 0,
          targetIndicators: 0
        },
        hasData: false
      };
    });

    // Calculate consolidated metrics
    const totalRealized = fixedPrograms.reduce((sum, p) => sum + p.performance.totalRealized, 0);
    const totalTarget = fixedPrograms.reduce((sum, p) => sum + p.performance.totalTarget, 0);
    const totalIndicators = fixedPrograms.reduce((sum, p) => sum + p.performance.totalIndicators, 0);
    const programsWithData = fixedPrograms.filter(p => p.hasData).length;
    
    const averagePerformance = programsWithData > 0 
      ? fixedPrograms
          .filter(p => p.hasData)
          .reduce((sum, p) => sum + p.performance.averagePerformance, 0) / programsWithData
      : 0;

    // Calculate monthly trends across all programs
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    const monthlyTrends = months.map(month => {
      const monthTotals = fixedPrograms.reduce((totals, program) => {
        const monthData = program.monthlyData.find(m => m.month === month);
        return {
          realized: totals.realized + (monthData?.realized || 0),
          target: totals.target + (monthData?.target || 0)
        };
      }, { realized: 0, target: 0 });
      
      const performance = monthTotals.target > 0 
        ? (monthTotals.realized / monthTotals.target) * 100 
        : 0;

      return {
        month,
        totalRealized: monthTotals.realized,
        totalTarget: monthTotals.target,
        performance: Math.round(performance * 100) / 100
      };
    });

    // Calculate financial metrics from Omie data
    const financialMetrics = {
      captado: omieData?.indicadores?.captado || 0,
      realizado: omieData?.indicadores?.realizado || 0,
      saldo: omieData?.indicadores?.saldo || 0,
      andamento: 0 // Will be calculated based on projects in progress
    };

    // Calculate "andamento" (work in progress) - captado minus realizado but not counting as saldo
    if (financialMetrics.captado > 0) {
      const pendingWork = Math.max(0, financialMetrics.captado - financialMetrics.realizado);
      financialMetrics.andamento = pendingWork;
    }

    console.log('✅ [useDashboardData] Dashboard data processed:', {
      programs: fixedPrograms.length,
      programsWithData,
      totalIndicators,
      averagePerformance: Math.round(averagePerformance * 100) / 100,
      financialMetrics
    });

    return {
      programs: fixedPrograms,
      consolidated: {
        totalPrograms: fixedPrograms.length,
        totalIndicators,
        totalRealized,
        totalTarget,
        averagePerformance: Math.round(averagePerformance * 100) / 100,
        programsWithData,
        financialMetrics,
        monthlyTrends
      }
    };
  }, [gvData, omieData]);

  return {
    ...processedData,
    loading: loading || omieLoading,
    error: error,
    lastUpdated: gvData?.period || null
  };
}

/**
 * Hook to get specific program data
 */
export function useProgramData(programSlug: string): {
  program: ProcessedProgram | null;
  loading: boolean;
  error: string | null;
} {
  const { programs, loading, error } = useDashboardData();
  
  const program = useMemo(() => {
    return programs.find(p => p.slug === programSlug) || null;
  }, [programs, programSlug]);

  return {
    program,
    loading,
    error
  };
}

/**
 * Utility functions for formatting
 */
export function formatIndicatorValue(value: number | null, unit?: string | null): string {
  if (value === null || value === undefined) return '-';
  
  const formattedNumber = new Intl.NumberFormat('pt-BR').format(value);
  
  if (unit && unit !== 'unidade' && unit !== 'Unidade') {
    return `${formattedNumber} ${unit}`;
  }
  
  if (value >= 1000 && value % 100 === 0) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
  
  return formattedNumber;
}

export function formatPercentage(value: number): string {
  return `${Math.round(value * 100) / 100}%`;
}