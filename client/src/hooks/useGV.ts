// hooks/useGV.ts - Adaptado para usar endpoint meta-realizado
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export type GVIndicatorData = {
  setor_nome: string;
  setor_slug: string;
  projeto_nome: string;
  projeto_slug: string;
  indicador_nome: string;
  indicador_unit: string;
  is_primary: boolean;
  weight: number;
  meta: number;
  realizado: number;
  atingimento_percentual: number;
  status_rag: string;
  period: string;
  scope: string;
};

export type GVMetaRealizadoResponse = {
  success: boolean;
  period: string;
  scope: string;
  project_slug?: string;
  sector_slug?: string;
  rag_filter?: string;
  statistics: {
    total_indicators: number;
    verde_count: number;
    amarelo_count: number;
    vermelho_count: number;
    neutral_count: number;
    primary_indicators: number;
    avg_achievement: number;
  };
  data: GVIndicatorData[];
};

// Transform meta-realizado data to GV format
function transformMetaRealizadoToGV(response: GVMetaRealizadoResponse) {
  console.log('🔧 [transformMetaRealizadoToGV] Input response:', response);
  if (!response?.data) {
    console.log('❌ [transformMetaRealizadoToGV] No data in response');
    return { 
      programs: [],
      period: response?.period || '2025-08' 
    };
  }
  console.log('✅ [transformMetaRealizadoToGV] Found', response.data.length, 'indicators');

  // Group by programa/projeto
  const programsMap = new Map();
  
  response.data.forEach(item => {
    const programSlug = item.setor_slug || 'unknown';
    const workstreamSlug = item.projeto_slug || 'default';
    
    if (!programsMap.has(programSlug)) {
      programsMap.set(programSlug, {
        slug: programSlug,
        workstreams: new Map()
      });
    }
    
    const program = programsMap.get(programSlug);
    
    if (!program.workstreams.has(workstreamSlug)) {
      program.workstreams.set(workstreamSlug, {
        slug: workstreamSlug,
        indicators: []
      });
    }
    
    const workstream = program.workstreams.get(workstreamSlug);
    workstream.indicators.push({
      indicator: item.indicador_nome,
      value: item.realizado,
      unit: null,
      target: item.meta
    });
  });
  
  // Convert maps to arrays with proper typing
  const programs = Array.from(programsMap.values()).map(program => ({
    slug: program.slug,
    workstreams: Array.from(program.workstreams.values()).map((ws: any) => ({
      slug: ws.slug,
      indicators: ws.indicators.map((ind: any) => ({
        indicator: ind.indicator,
        value: ind.value,
        unit: ind.unit,
        target: ind.target
      }))
    }))
  }));
  
  console.log('🎯 [transformMetaRealizadoToGV] Final programs:', programs);
  return { 
    programs,
    period: response.period || '2025-08'
  };
}

export function useGV(period = '2025-08', scope = 'monthly') {
  console.log('🔥 [useGV] Hook chamado com period:', period, 'scope:', scope);
  const { data: rawData, isLoading, error } = useQuery<GVMetaRealizadoResponse>({
    queryKey: ['/api/gestao-vista/meta-realizado', { period, scope }],
    queryFn: () => apiRequest(`/api/gestao-vista/meta-realizado?period=${period}&scope=${scope}`),
    staleTime: 0,
  });
  console.log('📊 [useGV] rawData:', rawData);

  return { 
    data: rawData, 
    loading: isLoading, 
    err: error?.message || null 
  };
}