import { useMemo } from 'react';
import { useGV } from '@/hooks/useGV';
import type { Program, Workstream, Indicator } from '@/services/gv';

interface ProcessedProgram {
  slug: string;
  name: string;
  indicators: Array<{
    indicator: string;
    originalIndicator?: string;
    value: number | null;
    unit: string | null;
    target: number | null;
    type?: 'month' | 'target' | 'responsible' | 'other';
  }>;
  totalIndicators: number;
  hasData: boolean;
}

interface ProgramChartData {
  programs: ProcessedProgram[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  totalPrograms: number;
}

// Mapeamento de nomes amigáveis para os programas
const PROGRAM_NAMES = {
  'favela-3d': 'Favela 3D',
  'inclusao-produtiva': 'Inclusão Produtiva', 
  'esporte-cultura': 'Cultura e Esporte',
  'marketing': 'Marketing',
  'psicossocial': 'Psicossocial',
  'casa-sonhar': 'Casa Sonhar',
  'negocios-sociais': 'Negócios Sociais',
  'polo-esportivo-cultural': 'Polo Esportivo Cultural',
  'gestao': 'Gestão'
} as const;

// Mapeamento de indicadores para nomenclaturas descritivas
const INDICATOR_NAMES = {
  // Meses
  'janeiro': 'Realizado em Janeiro',
  'fevereiro': 'Realizado em Fevereiro',
  'março': 'Realizado em Março',
  'abril': 'Realizado em Abril',
  'maio': 'Realizado em Maio',
  'junho': 'Realizado em Junho',
  'julho': 'Realizado em Julho',
  'agosto': 'Realizado em Agosto',
  'setembro': 'Realizado em Setembro',
  'outubro': 'Realizado em Outubro',
  'novembro': 'Realizado em Novembro',
  'dezembro': 'Realizado em Dezembro',
  // Termos comuns
  'meta': 'Meta',
  'responsável': 'Responsáveis',
  'responsavel': 'Responsáveis'
} as const;

/**
 * Função para mapear indicadores para nomes descritivos
 */
export function mapIndicatorName(indicator: string): string {
  const normalized = indicator.toLowerCase().trim();
  
  // Verificar mapeamentos diretos
  if (INDICATOR_NAMES[normalized as keyof typeof INDICATOR_NAMES]) {
    return INDICATOR_NAMES[normalized as keyof typeof INDICATOR_NAMES];
  }
  
  // Verificar se contém termos específicos
  if (normalized.includes('meta')) return 'Meta';
  if (normalized.includes('responsável') || normalized.includes('responsavel')) return 'Responsáveis';
  
  // Verificar meses com variações
  for (const [key, value] of Object.entries(INDICATOR_NAMES)) {
    if (normalized.includes(key) && key.length > 3) {
      return value;
    }
  }
  
  // Fallback para nome original com primeira letra maiúscula
  return indicator.charAt(0).toUpperCase() + indicator.slice(1);
}

/**
 * Função para formatar valores com contexto apropriado
 */
export function formatIndicatorValue(value: number | null, unit?: string | null): string {
  if (value === null || value === undefined) return '-';
  
  // Formatação numérica consistente
  const formattedNumber = new Intl.NumberFormat('pt-BR').format(value);
  
  // Se tem unidade específica, usar ela
  if (unit && unit !== 'unidade' && unit !== 'Unidade') {
    return `${formattedNumber} ${unit}`;
  }
  
  // Para valores monetários (detectar por magnitude)
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

/**
 * Função para determinar o tipo de indicador
 */
export function getIndicatorType(indicator: string): 'month' | 'target' | 'responsible' | 'other' {
  const normalized = indicator.toLowerCase().trim();
  
  if (normalized.includes('meta')) return 'target';
  if (normalized.includes('responsável') || normalized.includes('responsavel')) return 'responsible';
  
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  
  if (months.some(month => normalized.includes(month))) return 'month';
  
  return 'other';
}

/**
 * Hook para processar dados dos programas do Monday.com para uso em gráficos
 */
export function useProgramCharts(areaFilter?: string): ProgramChartData {
  const { data: gvData, loading, err } = useGV();

  const processedData = useMemo(() => {
    if (!gvData?.programs) {
      return {
        programs: [],
        totalPrograms: 0,
        hasData: false
      };
    }

    console.log('📊 [useProgramCharts] Processando dados dos programas:', gvData.programs.length);

    // Processar cada programa
    const processedPrograms = gvData.programs.map((program: Program) => {
      // Coletar todos os indicadores de todos os workstreams
      const allIndicators: Array<{
        indicator: string;
        value: number | null;
        unit: string | null;
        target: number | null;
      }> = [];

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

      // Verificar se há dados válidos
      const hasData = allIndicators.some(ind => 
        ind.value !== null && ind.value !== undefined && ind.value > 0
      );

      // Nome amigável do programa
      const friendlyName = PROGRAM_NAMES[program.slug as keyof typeof PROGRAM_NAMES] || 
                          program.slug.charAt(0).toUpperCase() + program.slug.slice(1).replace(/-/g, ' ');

      console.log(`📈 [useProgramCharts] Programa: ${friendlyName} - ${allIndicators.length} indicadores, dados válidos: ${hasData}`);

      return {
        slug: program.slug,
        name: friendlyName,
        indicators: allIndicators,
        totalIndicators: allIndicators.length,
        hasData
      };
    });

    // Filtrar por área se especificado
    let filteredPrograms = processedPrograms;
    if (areaFilter) {
      filteredPrograms = processedPrograms.filter(program => 
        program.slug.toLowerCase().includes(areaFilter.toLowerCase()) ||
        program.name.toLowerCase().includes(areaFilter.toLowerCase())
      );
      console.log(`🔍 [useProgramCharts] Filtro aplicado "${areaFilter}" - ${filteredPrograms.length} programas encontrados`);
    }

    // Ordenar por nome para consistência
    filteredPrograms.sort((a, b) => a.name.localeCompare(b.name));

    return {
      programs: filteredPrograms,
      totalPrograms: filteredPrograms.length,
      hasData: filteredPrograms.some(p => p.hasData)
    };
  }, [gvData, areaFilter]);

  return {
    programs: processedData.programs,
    loading,
    error: err,
    lastUpdated: gvData?.period || null,
    totalPrograms: processedData.totalPrograms
  };
}

/**
 * Hook para obter dados específicos de um programa
 */
export function useProgramChart(programSlug: string): {
  program: ProcessedProgram | null;
  loading: boolean;
  error: string | null;
} {
  const { programs, loading, error } = useProgramCharts();
  
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
 * Hook para estatísticas agregadas de todos os programas
 */
export function useProgramStats(): {
  totalPrograms: number;
  totalIndicators: number;
  programsWithData: number;
  averageIndicatorsPerProgram: number;
  loading: boolean;
  error: string | null;
} {
  const { programs, loading, error } = useProgramCharts();

  const stats = useMemo(() => {
    if (programs.length === 0) {
      return {
        totalPrograms: 0,
        totalIndicators: 0,
        programsWithData: 0,
        averageIndicatorsPerProgram: 0
      };
    }

    const totalIndicators = programs.reduce((sum, program) => sum + program.totalIndicators, 0);
    const programsWithData = programs.filter(program => program.hasData).length;
    const averageIndicatorsPerProgram = totalIndicators / programs.length;

    return {
      totalPrograms: programs.length,
      totalIndicators,
      programsWithData,
      averageIndicatorsPerProgram: Math.round(averageIndicatorsPerProgram * 10) / 10
    };
  }, [programs]);

  return {
    ...stats,
    loading,
    error
  };
}

/**
 * Função para exportar dados dos programas para análise
 */
export function exportProgramData(programs: ProcessedProgram[]): string {
  const exportData = programs.map(program => ({
    programa: program.name,
    slug: program.slug,
    totalIndicadores: program.totalIndicators,
    temDados: program.hasData,
    indicadores: program.indicators.map(ind => ({
      nome: ind.indicator,
      nomeOriginal: ind.originalIndicator,
      valor: ind.value,
      valorFormatado: formatIndicatorValue(ind.value, ind.unit),
      unidade: ind.unit,
      meta: ind.target,
      tipo: ind.type
    }))
  }));

  return JSON.stringify(exportData, null, 2);
}