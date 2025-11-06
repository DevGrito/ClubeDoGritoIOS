import { apiRequest } from '@/lib/queryClient';
import type {
  FinanceiroFilters,
  ResumoFinanceiroResponse,
  SerieTemporalResponse,
  ComparativoProgramaResponse,
  RubricaResponse,
  FinanceiroData
} from '@/types/financeiro';

// Função auxiliar para converter filtros em parâmetros de query
function buildFinanceiroQueryParams(filters: FinanceiroFilters): URLSearchParams {
  const params = new URLSearchParams();
  
  if (filters.start) params.append('start', filters.start);
  if (filters.end) params.append('end', filters.end);
  params.append('escopo', filters.escopo);
  if (filters.id) params.append('id', filters.id);
  
  return params;
}

// Gerar dados mock realistas para período
function generateFinanceiroMock(filters: FinanceiroFilters) {
  // Calcular número de meses
  let monthsInPeriod = 1;
  if (filters.start && filters.end) {
    const startDate = new Date(filters.start);
    const endDate = new Date(filters.end);
    monthsInPeriod = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  } else {
    monthsInPeriod = {
      'mensal': 1,
      'trimestral': 3,
      'semestral': 6,
      'anual': 12,
      'custom': 1
    }[filters.period] || 1;
  }

  // Valores base mensais realistas para Instituto O Grito
  const monthlyBase = {
    previsto: 85000,  // R$ 85k previsto por mês
    realizado: 78000  // R$ 78k realizado por mês (ligeiramente abaixo)
  };

  const totalPrevisto = monthlyBase.previsto * monthsInPeriod;
  const totalRealizado = monthlyBase.realizado * monthsInPeriod;
  const saldo = totalRealizado - totalPrevisto;

  // Gerar série temporal
  const points = [];
  const today = new Date();
  for (let i = 0; i < monthsInPeriod; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - (monthsInPeriod - 1 - i), 1);
    const mes = date.toISOString().slice(0, 7); // YYYY-MM
    
    // Adicionar variação realista
    const variation = 0.85 + (Math.random() * 0.3); // 85% a 115% da base
    points.push({
      mes,
      previsto: Math.floor(monthlyBase.previsto * variation),
      realizado: Math.floor(monthlyBase.realizado * variation)
    });
  }

  // Mock por programa
  const programas = [
    { programa: 'PEC', previsto: totalPrevisto * 0.35, realizado: totalRealizado * 0.37 },
    { programa: 'PSI', previsto: totalPrevisto * 0.25, realizado: totalRealizado * 0.23 },
    { programa: 'IC', previsto: totalPrevisto * 0.20, realizado: totalRealizado * 0.22 },
    { programa: 'PD', previsto: totalPrevisto * 0.15, realizado: totalRealizado * 0.13 },
    { programa: 'F3D', previsto: totalPrevisto * 0.05, realizado: totalRealizado * 0.05 }
  ];

  // Mock rubrica alimentação (10% do total)
  const rubricaPoints = points.map(p => ({
    mes: p.mes,
    valor: Math.floor(p.realizado * 0.1)
  }));

  return {
    resumo: { previsto: totalPrevisto, realizado: totalRealizado, saldo },
    serie: { points },
    programas: { items: programas },
    rubrica: { 
      points: rubricaPoints, 
      total: rubricaPoints.reduce((sum, p) => sum + p.valor, 0) 
    }
  };
}

// Buscar resumo consolidado (3 cards)
export async function getResumoFinanceiro(filters: FinanceiroFilters): Promise<ResumoFinanceiroResponse> {
  try {
    const params = buildFinanceiroQueryParams(filters);
    const response = await fetch(`/api/financeiro/resumo?${params}`);
    
    if (!response.ok) {
      throw new Error('API não implementada');
    }
    
    return await response.json();
  } catch (error) {
    console.log('🔧 [FINANCEIRO] Usando mock para resumo');
    const mockData = generateFinanceiroMock(filters);
    return mockData.resumo;
  }
}

// Buscar dados realizados mensais do banco
export async function getDadosRealizadosMensais(filters: FinanceiroFilters) {
  try {
    const params = new URLSearchParams();
    
    // Extrair ano da data de início (formato YYYY-MM)
    if (filters.start) {
      const ano = filters.start.split('-')[0];
      params.append('ano', ano);
    }
    
    // Filtrar por departamento se especificado
    if (filters.id) params.append('departamento', filters.id);
    
    const response = await fetch(`/api/conselho/dados-realizados?${params}`);
    
    if (!response.ok) {
      throw new Error('Erro ao buscar dados realizados');
    }
    
    const result = await response.json();
    return result.dados || [];
  } catch (error) {
    console.log('⚠️ [FINANCEIRO] Erro ao buscar dados realizados:', error);
    return [];
  }
}

// Buscar série temporal (gráfico de linhas)
export async function getSerieFinanceira(filters: FinanceiroFilters): Promise<SerieTemporalResponse> {
  try {
    const dadosRealizados = await getDadosRealizadosMensais(filters);
    
    const points = dadosRealizados.map((dado: any) => {
      const mes = `${dado.ano}-${String(dado.mes).padStart(2, '0')}`;
      return {
        mes,
        previsto: dado.saldo * 1.15,
        realizado: dado.saldo
      };
    });
    
    if (points.length > 0) {
      console.log('✅ [FINANCEIRO] Usando dados realizados do banco');
      return { points };
    }
    
    throw new Error('Nenhum dado realizado disponível');
  } catch (error) {
    console.log('🔧 [FINANCEIRO] Usando mock para série');
    const mockData = generateFinanceiroMock(filters);
    return mockData.serie;
  }
}

// Buscar comparativo por programa (barras laterais)
export async function getComparativoPrograma(filters: FinanceiroFilters): Promise<ComparativoProgramaResponse> {
  try {
    const params = new URLSearchParams();
    if (filters.start) params.append('start', filters.start);
    if (filters.end) params.append('end', filters.end);
    
    const response = await fetch(`/api/financeiro/por-programa?${params}`);
    
    if (!response.ok) {
      throw new Error('API não implementada');
    }
    
    return await response.json();
  } catch (error) {
    console.log('🔧 [FINANCEIRO] Usando mock para comparativo');
    const mockData = generateFinanceiroMock(filters);
    return mockData.programas;
  }
}

// Buscar rubrica específica (mini-linha)
export async function getRubricaAlimentacao(filters: FinanceiroFilters): Promise<RubricaResponse> {
  try {
    const params = new URLSearchParams();
    if (filters.start) params.append('start', filters.start);
    if (filters.end) params.append('end', filters.end);
    params.append('nome', 'Alimentacao');
    
    const response = await fetch(`/api/financeiro/rubrica?${params}`);
    
    if (!response.ok) {
      throw new Error('API não implementada');
    }
    
    return await response.json();
  } catch (error) {
    console.log('🔧 [FINANCEIRO] Usando mock para rubrica');
    const mockData = generateFinanceiroMock(filters);
    return mockData.rubrica;
  }
}

// Buscar todos os dados financeiros de uma vez
export async function getAllFinanceiroData(filters: FinanceiroFilters): Promise<FinanceiroData> {
  try {
    const [resumo, serie, programas, rubrica] = await Promise.all([
      getResumoFinanceiro(filters),
      getSerieFinanceira(filters),
      getComparativoPrograma(filters),
      getRubricaAlimentacao(filters)
    ]);

    return {
      resumo,
      serie,
      programas,
      rubrica,
      loading: false,
      error: null,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    return {
      resumo: { previsto: 0, realizado: 0, saldo: 0 },
      serie: { points: [] },
      programas: { items: [] },
      rubrica: { points: [], total: 0 },
      loading: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      lastUpdated: new Date().toISOString()
    };
  }
}

// Função auxiliar para calcular datas baseadas no período
export function calculateFinanceiroDateRange(period: FinanceiroFilters['period']): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  
  let start: Date;
  
  switch (period) {
    case 'mensal':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'trimestral':
      const currentQuarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), currentQuarter * 3, 1);
      break;
    case 'semestral':
      const currentSemester = Math.floor(now.getMonth() / 6);
      start = new Date(now.getFullYear(), currentSemester * 6, 1);
      break;
    case 'anual':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  
  return {
    start: start.toISOString().split('T')[0],
    end
  };
}

// Função para formatar valores em BRL
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

// Função para formatar valores compactos (ex: 85K, 1.2M)
export function formatBRLCompact(value: number): string {
  if (value >= 1000000) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      compactDisplay: 'short',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(value);
  }
  
  return formatBRL(value);
}