// services/gv.ts - Adaptado para React Web
export type Indicator = {
  indicator: string;
  value: number | null;
  unit: string | null;
  target: number | null;
};

export type Workstream = {
  slug: string;
  indicators: Indicator[];
};

export type Program = {
  slug: string;
  workstreams: Workstream[];
};

// ✅ SETOR DATA TYPES (estrutura real retornada pela API)
export type SetorData = {
  marketing?: {
    seguidores_instagram?: number;
    seguidores_facebook?: number;
    seguidores_tiktok?: number;
    engajamento_total?: number;
    reels_publicados?: number;
    posts_feed?: number;
    eventos_realizados?: number;
  };
  psicossocial?: {
    atendimentos_individuais?: number;
    atendimentos_familiares?: number;
    visitas_domiciliares?: number;
    intervencoes_grupo?: number;
    caravana_eventos?: number;
    caravana_pessoas?: number;
  };
  inclusao_produtiva?: {
    frequencia_media?: number;
    total_alunos?: number;
    taxa_evasao?: number;
    cursos_oferecidos?: number;
    certificados_emitidos?: number;
  };
  favela3d?: {
    oportunidades_emprego?: number;
    pessoas_empregadas?: number;
    taxa_empregabilidade?: number;
    empresas_parceiras?: number;
  };
  pec?: {
    frequencia_media?: number;
    total_alunos?: number;
    taxa_evasao?: number;
    atividades_esportivas?: number;
    atividades_culturais?: number;
  };
  geracao_renda?: {
    empreendedores?: number;
    micro_empreendimentos?: number;
    renda_total?: number;
    renda_media?: number;
    cursos_concluidos?: number;
    taxa_formalizacao?: number;
  };
};

// ✅ GV API RESPONSE TYPE (estrutura exata retornada pela API /api/gv)
export type GVApiResponse = {
  ano: number;
  semestre: number;
  setores: SetorData;
};

// ✅ GESTÃO À VISTA DATA TYPES (mantido para compatibilidade com outros componentes)
export type GestaoVistaData = {
  marketing?: {
    seguidores_totais?: number;
    seguidores_ganhos?: number;
    seguidores_perdidos?: number;
    reels?: number;
  };
  empregabilidade?: {
    total_empregos?: number;
    empregos_formalizados?: number;
    empregos_informais?: number;
  };
  frequencia?: {
    total?: number;
    inclusao_produtiva?: number;
    PEC?: number;
  };
  psicosocial?: {
    atendimentos_totais?: number;
  };
  transversal?: {
    quantidade?: number;
    horas_aula?: number;
  };
};

// ✅ BUSINESS SECTIONS TYPES
export type BusinessSectionData = {
  seguidores: {
    total: number;
    ganhos: number;
    perdidos: number;
    reels: number;
    metas: {
      total: number;
      ganhos: number;
      perdidos: number;
      reels: number;
    };
    trends: {
      total: 'up' | 'down' | 'neutral';
      ganhos: 'up' | 'down' | 'neutral';
      perdidos: 'up' | 'down' | 'neutral';
      reels: 'up' | 'down' | 'neutral';
    };
  };
  frequenciaTotal: {
    chartData: Array<{
      name: string;
      frequencia: number;
      meta: number;
    }>;
    mediaFrequencia: number;
    mediaMeta: number;
  };
  geracaoRenda: {
    monthlyData: Array<{
      mes: string;
      empreendedores: number;
      microEmpreendimentos: number;
      renda: number;
      trend: 'up' | 'down' | 'neutral';
    }>;
    totals: {
      empreendedores: number;
      microEmpreendimentos: number;
      rendaTotal: number;
    };
  };
  atendimentosPsicossocial: {
    totalAtendimentos: number;
    beneficiariosUnicos: number;
    casosAbertos: number;
    casosFechados: number;
    metas: {
      totalAtendimentos: number;
      beneficiariosUnicos: number;
      casosAbertos: number;
      casosFechados: number;
    };
  };
  alunosDesenvolvimento: {
    distribuicao: Array<{
      name: string;
      value: number;
      color: string;
    }>;
    metricas: {
      qtdeAlunos: number;
      aprendizagem: number; // percentage
      evasao: number;
      nps: number;
      metas: {
        qtdeAlunos: number;
        aprendizagem: number;
        evasao: number;
        nps: number;
      };
    };
  };
};

export type GVResponse = {
  period: string | null;
  programs: Program[];
  businessSections?: BusinessSectionData;
  gestaoVistaData?: GestaoVistaData;
};

export async function fetchGV(ano?: number, semestre?: number): Promise<GVApiResponse> {
  const searchParams = new URLSearchParams();
  if (ano) searchParams.set('ano', ano.toString());
  if (semestre) searchParams.set('semestre', semestre.toString());
  
  const url = `/api/gv${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  const response = await fetch(url, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`GV fetch failed: ${response.status}`);
  }
  return response.json();
}

export async function syncGV(): Promise<{ success: boolean; message: string }> {
  const response = await fetch('/api/gv/sync', { method: 'POST' });
  if (!response.ok) {
    throw new Error(`GV sync failed: ${response.status}`);
  }
  return response.json();
}