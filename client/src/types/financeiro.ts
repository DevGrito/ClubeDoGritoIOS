// Tipos para dados financeiros do Quadro Financeiro
export type FinanceiroFilters = {
  period: 'mensal' | 'trimestral' | 'semestral' | 'anual' | 'custom';
  start?: string; // YYYY-MM-DD
  end?: string;   // YYYY-MM-DD
  escopo: 'geral' | 'programa' | 'projeto';
  id?: string;    // ID do programa/projeto quando escopo != geral
};

export type ResumoFinanceiro = {
  previsto: number;
  realizado: number;
  saldo: number;
};

export type SerieMensal = {
  points: Array<{
    mes: string; // YYYY-MM format
    previsto: number;
    realizado: number;
  }>;
};

export type PorPrograma = {
  items: Array<{
    programa: string;
    previsto: number;
    realizado: number;
  }>;
};

export type SerieRubrica = {
  points: Array<{
    mes: string; // YYYY-MM format
    valor: number;
  }>;
  total: number;
};

// Resposta da API consolidada para o carrossel
export type ResumoFinanceiroResponse = ResumoFinanceiro;

// Resposta da API para série temporal
export type SerieTemporalResponse = SerieMensal;

// Resposta da API para comparativo por programa
export type ComparativoProgramaResponse = PorPrograma;

// Resposta da API para rubrica específica
export type RubricaResponse = SerieRubrica;

// Dados consolidados para o componente principal
export type FinanceiroData = {
  resumo: ResumoFinanceiro;
  serie: SerieMensal;
  programas: PorPrograma;
  rubrica: SerieRubrica;
  loading: boolean;
  error: string | null;
  lastUpdated?: string;
};

// Programas disponíveis para filtragem
export const PROGRAMAS_FINANCEIROS = [
  { value: 'pec', label: 'PEC' },
  { value: 'psi', label: 'PSI' },
  { value: 'ic', label: 'IC' },
  { value: 'pd', label: 'PD' },
  { value: 'f3d', label: 'F3D' }
] as const;