// Tipos para os filtros do Conselho
export type ConselhoFilters = {
  period: 'mensal' | 'trimestral' | 'semestral' | 'anual' | 'specific_month' | 'custom';
  specificMonth?: string; // formato "2025-01" para janeiro de 2025
  start?: string; // ISO
  end?: string;   // ISO
  unitId?: string | null;
  classId?: string | null;
};

// Tipos para os dados dos KPIs
export interface KpiData {
  criancasImpactadas: number;
  pessoasFormadas: number;
  familiasAcompanhadas: number;
  atendimentosMetodoGrito: number;
}

export interface PessoasFormadasBreakdown {
  leb: number;
  curso30h: number;
  ead: number;
  total: number;
}

// Tipos para respostas da API
export interface CriancasImpactadasResponse {
  total: number;
}

export interface PessoasFormadasResponse {
  total: number;
  breakdown: PessoasFormadasBreakdown;
}

export interface FamiliasAcompanhadasResponse {
  total: number;
}

export interface AtendimentosResponse {
  total: number;
}