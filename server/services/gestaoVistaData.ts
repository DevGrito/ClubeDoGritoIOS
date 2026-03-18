/**
 * FONTE ÚNICA DE DADOS - Gestão à Vista
 * Este módulo contém os dados mensais de indicadores usados tanto pela
 * Gestão à Vista quanto pelos KPIs do Dashboard do Conselho.
 * 
 * IMPORTANTE: Qualquer atualização nos dados deve ser feita SOMENTE aqui!
 */

// ==================================================================
// DADOS MENSAIS 2025 - Todos os 11 indicadores
// Índice 0 = Janeiro, 1 = Fevereiro, ..., 8 = Setembro, 9 = Outubro, ..., 11 = Dezembro
// null = sem dados para aquele mês
// ATUALIZADO: Dados até OUTUBRO 2025 (índice 9)
// ATENÇÃO: Este array contém valores MENSAIS para indicadores de FLUXO (que somam)
//          e SNAPSHOTS para indicadores de ESTOQUE (que pegam último valor)
// ==================================================================
export const dadosMensais2025 = {
  criancasAtendidas: [null, 330, 305, 305, 318, 284, 328, 321, 333, 370, 368, null], // ESTOQUE (snapshot) - último: nov (368)
  alunosFormados: [null, null, 72, null, 62, 176, 64, 33, 52, 122, 80, 200], // FLUXO (mensal) - Total out: 581
  alunosEmFormacao: [57, 71, 80, 30, 211, 204, 170, 162, 341, 255, null, null], // ESTOQUE (snapshot) - último: out (255)
  frequencia: [null, 78, 81, 88, 86, 86, 90, 82, 87, 84, 83.4, null], // ESTOQUE (% snapshot) - último: 84% (out)
  avaliacaoAprendizagem: [null, null, null, null, null, 89, null, null, null, null, null, null], // ESTOQUE (% snapshot) - último: 89% (jun)
  pesquisaSatisfacao: [null, null, null, null, null, 81, null, null, null, null, null, null], // ESTOQUE (snapshot) - último: 81 (jun)
  evasao: [null, 0, 32, 0, 0, 1, 1, 23, 4, 6, 7, null], // FLUXO (mensal) - Total out: 67
  geracaoRenda: [null, 1, 21, 8, 45, 10, 13, null, 20, 13, 5, null], // FLUXO (mensal) - Total out: 131
  familiasAcompanhadas: [238, 219, 219, 217, 217, 217, 217, 218, 219, 219, 219, 219], // ESTOQUE (snapshot) - último: 219 (out)
  visitasDomicilio: [323, 297, 332, 363, 398, 407, 354, 387, 313, 366, 313, 114], // FLUXO (mensal) - Total out: 3540
  atendimentosPsico: [0, 17, 50, 44, 56, 30, 35, 30, 62, 53, 52, 11] // FLUXO (mensal) - Total out: 377
};

// Metas anuais 2025 (não mudam por mês)
export const metasAnuais2025 = {
  criancasAtendidas: 500, // Meta: 500 crianças (50/mês × 10 meses: fev→nov)
  alunosFormados: 800, // Meta: 800 alunos formados (80/mês × 10 meses)
  alunosEmFormacao: 1600, // Meta: 160/mês × 10 meses
  frequencia: 85,
  avaliacaoAprendizagem: 90,
  pesquisaSatisfacao: 70,
  evasao: 210,
  geracaoRenda: 160, // Meta anual: 160 pessoas
  familiasAcompanhadas: 250, // Meta anual: 250 famílias ao F3D
  visitasDomicilio: 3460,
  atendimentosPsico: 420
};

// ==================================================================
// HELPERS DE AGREGAÇÃO
// ==================================================================

/**
 * Helper: Pegar valor mensal ou último disponível (para ESTOQUE/snapshot)
 * Usado para indicadores que representam o estado atual (ex: crianças atendidas)
 */
export const getValorMensalOuUltimo = (valores: (number | null)[], mes: number | null): number => {
  if (mes !== null) {
    // Retornar valor do mês específico (índice 0 = janeiro)
    const indice = mes - 1;
    return valores[indice] ?? 0;
  }
  // Anual: pegar último mês com dados (de trás para frente)
  for (let i = valores.length - 1; i >= 0; i--) {
    if (valores[i] !== null && valores[i] !== undefined) {
      return valores[i]!;
    }
  }
  return 0;
};

/**
 * Helper: Somar valores mensais ou pegar valor do mês (para FLUXO)
 * Usado para indicadores que acumulam ao longo do ano (ex: alunos formados)
 */
export const getValorSomadoOuMensal = (valores: (number | null)[], mes: number | null): number => {
  if (mes !== null) {
    // Retornar valor do mês específico (índice 0 = janeiro)
    const indice = mes - 1;
    return valores[indice] ?? 0;
  }
  // Anual: somar todos os meses válidos
  const valoresValidos = valores.filter(v => v !== null && v !== undefined) as number[];
  return valoresValidos.reduce((a, b) => a + b, 0);
};

/**
 * Helper: Calcular média mensal dos valores válidos
 * Usado para indicadores percentuais ou quando queremos média
 */
export const calcularMediaMensal = (valores: (number | null)[], mes: number | null): number => {
  if (mes !== null) {
    // Retornar valor do mês específico (índice 0 = janeiro)
    const indice = mes - 1;
    return valores[indice] ?? 0;
  }
  // Anual: média de todos os meses
  const valoresValidos = valores.filter(v => v !== null && v !== undefined) as number[];
  if (valoresValidos.length === 0) return 0;
  return valoresValidos.reduce((a, b) => a + b, 0) / valoresValidos.length;
};

/**
 * Helper: Ajustar meta baseada no filtro (mensal ou anual)
 * Se mes !== null: meta mensal = meta anual ÷ 10
 * Se mes === null: meta anual completa
 */
export const ajustarMeta = (metaAnual: number, mes: number | null): number => {
  if (mes !== null) {
    return metaAnual / 10; // Meta mensal
  }
  return metaAnual; // Meta anual
};

/**
 * NOVA LÓGICA: Meta ACUMULADA para Crianças Atendidas
 * Meta anual = 400 crianças
 * Dividida em 10 meses (fevereiro → novembro)
 * Meta mensal = 40 crianças
 * 
 * A meta exibida em cada mês deve ser ACUMULADA:
 * - Fevereiro (mês 2): 40
 * - Março (mês 3): 80
 * - Abril (mês 4): 120
 * - Maio (mês 5): 160
 * - Junho (mês 6): 200
 * - Julho (mês 7): 240
 * - Agosto (mês 8): 280
 * - Setembro (mês 9): 320
 * - Outubro (mês 10): 360
 * - Novembro (mês 11): 400
 * - Dezembro (mês 12): 400 (mantém a meta final)
 */
export const getMetaAcumuladaCriancas = (mes: number | null): number => {
  const META_ANUAL = 400;
  const META_MENSAL = 40;
  const MES_INICIO = 2; // Fevereiro
  const MES_FIM = 11; // Novembro
  
  // Se for filtro anual (null), retornar meta anual completa
  if (mes === null) {
    return META_ANUAL;
  }
  
  // Janeiro não tem meta (programa começa em fevereiro)
  if (mes < MES_INICIO) {
    return 0;
  }
  
  // Dezembro mantém a meta final de novembro
  if (mes > MES_FIM) {
    return META_ANUAL;
  }
  
  // Calcular meta acumulada: (mes - 1) * 40
  // Fevereiro (mês 2) → (2-1) * 40 = 40
  // Março (mês 3) → (3-1) * 40 = 80
  // ...
  // Novembro (mês 11) → (11-1) * 40 = 400
  const mesesDecorridos = mes - MES_INICIO + 1;
  return mesesDecorridos * META_MENSAL;
};

/**
 * Array de metas acumuladas mensais para exibição em gráficos
 * Índice 0 = Janeiro, 1 = Fevereiro, ..., 11 = Dezembro
 */
export const metasAcumuladasCriancas = [
  0,    // Janeiro (sem meta)
  40,   // Fevereiro
  80,   // Março
  120,  // Abril
  160,  // Maio
  200,  // Junho
  240,  // Julho
  280,  // Agosto
  320,  // Setembro
  360,  // Outubro
  400,  // Novembro
  400   // Dezembro (mantém meta final)
];

/**
 * Encontrar o último mês com dados disponíveis
 */
export const getUltimoMesComDados = (): number => {
  for (let i = dadosMensais2025.criancasAtendidas.length - 1; i >= 0; i--) {
    if (dadosMensais2025.criancasAtendidas[i] !== null) {
      return i + 1; // Retorna número do mês (1-12)
    }
  }
  return new Date().getMonth() + 1;
};

/**
 * Obter KPIs do Conselho (4 indicadores principais)
 * Usados no Dashboard do Conselho - mesma fonte da Gestão à Vista
 */
export const getConselhoKpis = (mes: number | null) => {
  return {
    criancasPec: getValorMensalOuUltimo(dadosMensais2025.criancasAtendidas, mes), // ESTOQUE
    alunosFormados: getValorSomadoOuMensal(dadosMensais2025.alunosFormados, mes), // FLUXO
    geracao_renda: getValorSomadoOuMensal(dadosMensais2025.geracaoRenda, mes), // FLUXO  
    familiasAtivas: getValorMensalOuUltimo(dadosMensais2025.familiasAcompanhadas, mes), // ESTOQUE
  };
};

// ==================================================================
// DADOS DINÂMICOS 2026 - Busca em tempo real do banco de dados
// ==================================================================

import { pool, db } from '../db';
import { participantesInclusao } from '../../shared/schema';
import { sql } from 'drizzle-orm';

/**
 * Buscar contagem de crianças atendidas no PEC em 2026
 * Fonte: instance_enrollments + activity_instances
 * @param mes - Mês específico (1-12) ou null para anual
 */
export async function getCriancasAtendidasPEC2026(mes: number | null = null): Promise<number> {
  try {
    // Conta TODOS os alunos cadastrados na tabela 'aluno'
    // Exclui apenas os que têm situacao_atendimento = 'Inativo'
    const safeMes1 = mes !== null ? Math.floor(Number(mes)) : null;
    const mesFilter1 = safeMes1 !== null ? `AND EXTRACT(MONTH FROM created_at) = ${safeMes1}` : '';
    const result = await pool.query(`
      SELECT COUNT(*) as total
      FROM aluno
      WHERE (situacao_atendimento IS NULL OR situacao_atendimento != 'Inativo')
        AND EXTRACT(YEAR FROM created_at) = 2026
        ${mesFilter1}
    `);
    console.log(`[GV 2026] Query crianças PEC 2026 (tabela aluno) result:`, result.rows);
    return parseInt(result.rows[0]?.total || '0');
  } catch (error) {
    console.error('[GV 2026] Erro ao buscar crianças PEC:', error);
    return 0;
  }
}

/**
 * Buscar total de atendimentos de Inclusão Produtiva em 2026
 * Definição: cada vínculo aluno-turma = 1 atendimento (não é distinct por aluno)
 * Um aluno em 3 turmas = 3 atendimentos
 * Todos os status contam (ativo, concluido, evadido, desistente)
 * @param mes - Mês específico (1-12) ou null para anual
 */
export async function getAtendimentosInclusao2026(mes: number | null = null): Promise<number> {
  try {
    // Mesma fonte do coordenador Inclusão: COUNT(*) FROM participantes_inclusao WHERE status = 'ativo'
    const result = await db.execute(sql`SELECT COUNT(*) as cnt FROM participantes_inclusao WHERE status = 'ativo'`);
    const total = Number(result.rows?.[0]?.cnt || 0);
    console.log(`[GV 2026] Atendidos Inclusão (participantes ativos): ${total}`);
    return total;
  } catch (error) {
    console.error('[GV 2026] Erro ao buscar atendidos inclusão:', error);
    return 0;
  }
}

export async function getAtendidosPsico2026(mes: number | null = null): Promise<number> {
  try {
    const safeMes = mes !== null ? Math.floor(Number(mes)) : null;
    const startDate = safeMes !== null ? `2026-${String(safeMes).padStart(2,'0')}-01` : '2026-01-01';
    const nextDate = safeMes !== null
      ? (safeMes === 12 ? '2027-01-01' : `2026-${String(safeMes+1).padStart(2,'0')}-01`)
      : '2027-01-01';
    // Mesma lógica do coordenador Psicossocial: pessoas distintas em registros_confidenciais
    const result = await pool.query(`
      SELECT COUNT(DISTINCT COALESCE(participante_cpf, participante_nome, id::text)) as cnt
      FROM registros_confidenciais
      WHERE data::date >= $1 AND data::date < $2
    `, [startDate, nextDate]);
    const total = parseInt(result.rows[0]?.cnt || '0');
    console.log(`[GV 2026] Atendidos Psico (mês=${mes ?? 'anual'}): ${total}`);
    return total;
  } catch (error) {
    console.error('[GV 2026] Erro ao buscar atendidos psico:', error);
    return 0;
  }
}

/**
 * Buscar contagem de alunos formados na Inclusão Produtiva em 2026
 * Fonte: participantes_turmas + turmas_inclusao
 * @param mes - Mês específico (1-12) ou null para anual
 */
export async function getAlunosFormadosInclusao2026(mes: number | null = null): Promise<number> {
  try {
    const safeMes = mes !== null ? Math.floor(Number(mes)) : null;
    // Mesma fonte do coordenador Inclusão: participantes_turmas de turmas finalizadas no ano
    const mesFilter = safeMes !== null
      ? `AND EXTRACT(YEAR FROM ti.data_fim) = 2026 AND EXTRACT(MONTH FROM ti.data_fim) = ${safeMes}`
      : `AND EXTRACT(YEAR FROM ti.data_fim) = 2026`;
    const result = await pool.query(`
      SELECT COUNT(CASE WHEN pt.status = 'concluido' OR pt.status = 'formado' THEN 1 END) as total
      FROM participantes_turmas pt
      JOIN turmas_inclusao ti ON pt.turma_id = ti.id
      WHERE (ti.status = 'finalizado' OR ti.status = 'concluido')
        ${mesFilter}
    `);
    return parseInt(result.rows[0]?.total || '0');
  } catch (error) {
    console.error('[GV 2026] Erro ao buscar alunos formados:', error);
    return 0;
  }
}

/**
 * Buscar frequência geral em 2026
 * Fonte: sessions (campo attendance é JSONB com lista de presenças)
 * @param mes - Mês específico (1-12) ou null para anual
 */
export async function getFrequenciaGeral2026(mes: number | null = null): Promise<number> {
  try {
    const safeMes = mes !== null ? Math.floor(Number(mes)) : null;
    const mesFilterPec = safeMes !== null 
      ? `AND EXTRACT(MONTH FROM s.date::date) = $1` 
      : '';
    const mesFilterInclusao = safeMes !== null
      ? `AND EXTRACT(MONTH FROM pi.data) = $1`
      : '';
    const params = safeMes !== null ? [safeMes] : [];
    
    // PEC: mesma lógica do coordenador PEC — falta_justificada conta como presente
    const mesFilterPecCoord = safeMes !== null
      ? `AND EXTRACT(YEAR FROM s.date::date) = 2026 AND EXTRACT(MONTH FROM s.date::date) = ${safeMes}`
      : `AND EXTRACT(YEAR FROM s.date::date) = 2026`;
    const resultPec = await pool.query(`
      SELECT
        COUNT(CASE WHEN a->>'presente' = 'true' OR a->>'status' = 'falta_justificada' THEN 1 END) as presentes,
        COUNT(*) as total_alunos
      FROM sessions s, jsonb_array_elements(s.attendance::jsonb) as a
      WHERE s.attendance IS NOT NULL AND jsonb_typeof(s.attendance::jsonb) = 'array'
        ${mesFilterPecCoord}
    `);

    const resultInclusao = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE pi.presente = true) as presentes,
        COUNT(*) as total_alunos
      FROM presencas_inclusao pi
      WHERE EXTRACT(YEAR FROM pi.data) = 2026
        ${mesFilterInclusao}
    `, params);

    const presentesPec = parseInt(resultPec.rows[0]?.presentes || '0');
    const totalPec = parseInt(resultPec.rows[0]?.total_alunos || '0');
    const presentesInc = parseInt(resultInclusao.rows[0]?.presentes || '0');
    const totalInc = parseInt(resultInclusao.rows[0]?.total_alunos || '0');

    const totalPresentes = presentesPec + presentesInc;
    const totalAlunos = totalPec + totalInc;

    const freq = totalAlunos > 0 ? Math.round((totalPresentes / totalAlunos) * 1000) / 10 : 0;
    console.log(`[GV 2026] Frequência geral: PEC(${presentesPec}/${totalPec}) + Inclusão(${presentesInc}/${totalInc}) = ${freq}%`);
    return freq;
  } catch (error) {
    console.error('[GV 2026] Erro ao buscar frequência:', error);
    return 0;
  }
}

/**
 * Buscar participantes ativos na Inclusão Produtiva em um ano específico
 * Um participante é "ativo no ano" se passou por qualquer turma que funcionou naquele ano
 * (turma com data_inicio ou data_fim dentro do ano, ou created_at no ano)
 * @param ano - Ano de referência (padrão 2026)
 */
export async function getAlunosEmFormacao2026(mes: number | null = null, ano: number = 2026): Promise<number> {
  try {
    const result = await pool.query(`
      SELECT COUNT(DISTINCT pt.participante_id) as total
      FROM participantes_turmas pt
      JOIN turmas_inclusao ti ON pt.turma_id = ti.id
      WHERE (
        EXTRACT(YEAR FROM ti.data_inicio) = $1
        OR EXTRACT(YEAR FROM ti.data_fim) = $1
        OR (ti.data_inicio <= make_date($1::int, 12, 31) AND (ti.data_fim IS NULL OR ti.data_fim >= make_date($1::int, 1, 1)))
        OR EXTRACT(YEAR FROM ti.created_at) = $1
      )
    `, [ano]);
    console.log(`[GV ${ano}] Participantes ativos na Inclusão (turmas do ano):`, result.rows);
    return parseInt(result.rows[0]?.total || '0');
  } catch (error) {
    console.error(`[GV ${ano}] Erro ao buscar participantes ativos Inclusão:`, error);
    return 0;
  }
}

/**
 * Buscar todos os indicadores de 2026 de uma vez
 * @param mes - Mês específico (1-12) ou null para anual
 */
/**
 * Buscar todos os indicadores de 2026 de uma vez
 * @param mes - Mês específico (1-12) ou null para anual
 */
export async function getAtendimentosColetivos2026(mes: number | null = null): Promise<number> {
  try {
    const safeMes = mes !== null ? Math.floor(Number(mes)) : null;
    const mesFilter = safeMes !== null ? `AND EXTRACT(MONTH FROM data::date) = ${safeMes}` : '';
    const result = await pool.query(`
      SELECT COUNT(*) as total
      FROM registros_confidenciais
      WHERE tipo = 'atendimento_coletivo'
        AND EXTRACT(YEAR FROM data::date) = 2026
        AND (status IS NULL OR status != 'inativo')
        ${mesFilter}
    `);
    return parseInt(result.rows[0]?.total || '0');
  } catch (error) {
    console.error('[GV 2026] Erro ao buscar atendimentos coletivos:', error);
    return 0;
  }
}

export async function getIndicadores2026(mes: number | null = null): Promise<{
  criancasAtendidas: number;
  alunosFormados: number;
  alunosEmFormacao: number;
  frequencia: number;
  evasao: number;
  geracaoRenda: number;
  visitasDomicilio: number;
  atendimentosPsico: number;
  atendimentosColetivos: number;
  avaliacaoAprendizagem: number;
  pesquisaSatisfacao: number;
}> {
  const [
    criancasAtendidas, 
    alunosFormados, 
    alunosEmFormacao, 
    frequencia,
    evasao,
    geracaoRenda,
    visitasDomicilio,
    atendimentosPsico,
    atendimentosColetivos,
    avaliacaoAprendizagem,
    pesquisaSatisfacao
  ] = await Promise.all([
    getCriancasAtendidasPEC2026(mes),
    getAlunosFormadosInclusao2026(mes),
    getAlunosEmFormacao2026(mes),
    getFrequenciaGeral2026(mes),
    getEvasao2026(mes),
    getGeracaoRenda2026(mes),
    getVisitasDomicilio2026(mes),
    getAtendimentosPsico2026(mes),
    getAtendimentosColetivos2026(mes),
    getAvaliacaoAprendizagem2026(mes),
    getPesquisaSatisfacao2026(mes)
  ]);
  
  console.log(`📊 [GV 2026] Indicadores em tempo real (mês=${mes || 'anual'}):`, {
    criancasAtendidas, alunosFormados, alunosEmFormacao,
    frequencia: frequencia + '%', evasao, geracaoRenda,
    visitasDomicilio, atendimentosPsico, atendimentosColetivos
  });
  
  return { 
    criancasAtendidas, alunosFormados, alunosEmFormacao, 
    frequencia, evasao, geracaoRenda,
    visitasDomicilio, atendimentosPsico, atendimentosColetivos,
    avaliacaoAprendizagem, pesquisaSatisfacao
  };
}

// Metas anuais 2026 (mesmas metas de 2025 por enquanto)
export const metasAnuais2026 = {
  criancasAtendidas: 500,
  alunosFormados: 2000,
  alunosEmFormacao: 1600,
  frequencia: 85,
  avaliacaoAprendizagem: 90,
  pesquisaSatisfacao: 90,
  evasao: 10,
  geracaoRenda: 2000,
  pessoasEmpregadas: 1500,
  empreendedores: 500,
  familiasAcompanhadas: 250,
  visitasDomicilio: 250,
  atendimentosPsico: 250,
  atendimentosColetivos: 100
};

// ==================================================================
// FUNÇÕES ADICIONAIS PARA 2026 - Indicadores em tempo real do banco
// ==================================================================

/**
 * Buscar evasão (participantes que abandonaram turmas) em 2026
 * Fonte: participantes_turmas com status diferente de 'ativo' e 'concluido'
 * @param mes - Mês específico (1-12) ou null para anual
 */
export async function getEvasao2026(mes: number | null = null): Promise<number> {
  try {
    const safeMes = mes !== null ? Math.floor(Number(mes)) : null;
    const params = safeMes !== null ? [safeMes] : [];

    // Inclusão: usa data_desligamento (data real de saída)
    const mesFilterInclusao = safeMes !== null
      ? `AND EXTRACT(MONTH FROM pt.data_desligamento) = $1 AND EXTRACT(YEAR FROM pt.data_desligamento) = 2026`
      : `AND EXTRACT(YEAR FROM COALESCE(pt.data_desligamento, pt.created_at) ) = 2026`;

    const resultInclusao = await pool.query(`
      SELECT COUNT(DISTINCT pt.id) as total
      FROM participantes_turmas pt
      JOIN turmas_inclusao ti ON pt.turma_id = ti.id
      WHERE pt.status IN ('inativo', 'desistente', 'transferido', 'evadido')
        ${mesFilterInclusao}
    `, params);

    // PEC: usa data_inativacao (campo adicionado), com fallback para updated_at
    const mesFilterPec = safeMes !== null
      ? `AND EXTRACT(MONTH FROM a.data_inativacao) = $1 AND EXTRACT(YEAR FROM a.data_inativacao) = 2026`
      : `AND EXTRACT(YEAR FROM COALESCE(a.data_inativacao, a.updated_at)) = 2026`;

    const resultPec = await pool.query(`
      SELECT COUNT(*) as total
      FROM aluno a
      WHERE a.situacao_atendimento = 'Inativo'
        ${mesFilterPec}
    `, params);

    const evasaoInclusao = parseInt(resultInclusao.rows[0]?.total || '0');
    const evasaoPec = parseInt(resultPec.rows[0]?.total || '0');
    console.log(`[GV 2026] Evasão: Inclusão=${evasaoInclusao}, PEC=${evasaoPec}`);
    return evasaoInclusao + evasaoPec;
  } catch (error) {
    console.error('[GV 2026] Erro ao buscar evasão:', error);
    return 0;
  }
}

/**
 * Buscar geração de renda (pessoas empregadas) em 2026
 * Fonte: participantes_turmas ou registros de empregabilidade
 * @param mes - Mês específico (1-12) ou null para anual
 */
export async function getGeracaoRenda2026(mes: number | null = null): Promise<number> {
  try {
    const safeMes = mes !== null ? Math.floor(Number(mes)) : null;
    const params: any[] = [2026];
    let mesFilter = '';
    if (safeMes !== null) {
      params.push(safeMes);
      mesFilter = `AND EXTRACT(MONTH FROM COALESCE(data_contratacao, data_inicio_atividade, criado_em)) = $2`;
    }
    const result = await pool.query(
      `SELECT COUNT(*) as total FROM inclusao_geracao_de_renda WHERE EXTRACT(YEAR FROM COALESCE(data_contratacao, data_inicio_atividade, criado_em)) = $1 ${mesFilter}`,
      params
    );
    const total = parseInt(result.rows[0]?.total || '0');
    console.log(`[GV 2026] Geração de renda: ${total}`);
    return total;
  } catch (error) {
    console.error('[GV 2026] Erro ao buscar geração de renda:', error);
    return 0;
  }
}

export async function getGeracaoRendaSplit2026(mes: number | null = null): Promise<{ empregabilidade: number; empreendedorismo: number }> {
  try {
    const safeMes = mes !== null ? Math.floor(Number(mes)) : null;
    const params: any[] = [2026];
    let mesFilter = '';
    if (safeMes !== null) {
      params.push(safeMes);
      mesFilter = `AND EXTRACT(MONTH FROM COALESCE(data_contratacao, data_inicio_atividade, criado_em)) = $2`;
    }
    const result = await pool.query(
      `SELECT tipo, COUNT(*) as total FROM inclusao_geracao_de_renda
       WHERE EXTRACT(YEAR FROM COALESCE(data_contratacao, data_inicio_atividade, criado_em)) = $1 ${mesFilter}
       GROUP BY tipo`,
      params
    );
    const empregabilidade = parseInt(result.rows.find((r: any) => r.tipo === 'empregabilidade')?.total || '0');
    const empreendedorismo = parseInt(result.rows.find((r: any) => r.tipo === 'empreendedorismo')?.total || '0');
    console.log(`[GV 2026] Geração de renda split: empregabilidade=${empregabilidade} empreendedorismo=${empreendedorismo}`);
    return { empregabilidade, empreendedorismo };
  } catch (error) {
    console.error('[GV 2026] Erro ao buscar geração de renda split:', error);
    return { empregabilidade: 0, empreendedorismo: 0 };
  }
}

/**
 * Buscar visitas em domicílio do psicossocial em 2026
 * Fonte: psico_atendimentos com tipo='visita_domiciliar'
 * @param mes - Mês específico (1-12) ou null para anual
 */
export async function getVisitasDomicilio2026(mes: number | null = null): Promise<number> {
  try {
    const safeMes = mes !== null ? Math.floor(Number(mes)) : null;
    const mesFilterAtend = safeMes !== null 
      ? `AND EXTRACT(MONTH FROM data_atendimento) = $1` 
      : '';
    const mesFilterConf = safeMes !== null 
      ? `AND EXTRACT(MONTH FROM data::date) = $1` 
      : '';
    const mesFilterAtiv = safeMes !== null 
      ? `AND EXTRACT(MONTH FROM data) = $1` 
      : '';
    const params = safeMes !== null ? [safeMes] : [];
    
    const mesFilterRc = safeMes !== null ? `AND EXTRACT(MONTH FROM data::date) = ${safeMes}` : '';
    const result = await pool.query(`
      SELECT COUNT(*) as total
      FROM registros_confidenciais
      WHERE tipo = 'visita_domiciliar'
        AND EXTRACT(YEAR FROM data::date) = 2026
        AND (status IS NULL OR status != 'inativo')
        ${mesFilterRc}
    `);
    return parseInt(result.rows[0]?.total || '0');
  } catch (error) {
    console.error('[GV 2026] Erro ao buscar visitas em domicílio:', error);
    return 0;
  }
}

/**
 * Buscar atendimentos psicossociais em 2026
 * Fonte: psico_atendimentos (todos os tipos, exceto visita que já é contada separadamente)
 * @param mes - Mês específico (1-12) ou null para anual
 */
export async function getAtendimentosPsico2026(mes: number | null = null): Promise<number> {
  try {
    const safeMes = mes !== null ? Math.floor(Number(mes)) : null;
    const mesFilterAtend = safeMes !== null 
      ? `AND EXTRACT(MONTH FROM data_atendimento) = $1` 
      : '';
    const mesFilterConf = safeMes !== null 
      ? `AND EXTRACT(MONTH FROM data::date) = $1` 
      : '';
    const mesFilterAtiv = safeMes !== null 
      ? `AND EXTRACT(MONTH FROM data) = $1` 
      : '';
    const params = safeMes !== null ? [safeMes] : [];
    
    const mesFilterRc2 = safeMes !== null ? `AND EXTRACT(MONTH FROM data::date) = ${safeMes}` : '';
    const mesFilterDe = safeMes !== null ? `AND EXTRACT(MONTH FROM data_atendimento::date) = ${safeMes}` : '';
    const [rcResult, deResult] = await Promise.all([
      pool.query(`
        SELECT COUNT(*) as total
        FROM registros_confidenciais
        WHERE tipo != 'visita_domiciliar'
          AND EXTRACT(YEAR FROM data::date) = 2026
          AND (status IS NULL OR status != 'inativo')
          ${mesFilterRc2}
      `),
      pool.query(`
        SELECT COUNT(*) as total
        FROM demandas_espontaneas
        WHERE EXTRACT(YEAR FROM data_atendimento::date) = 2026
          ${mesFilterDe}
      `),
    ]);
    return parseInt(rcResult.rows[0]?.total || '0') + parseInt(deResult.rows[0]?.total || '0');
  } catch (error) {
    console.error('[GV 2026] Erro ao buscar atendimentos psicossociais:', error);
    return 0;
  }
}

/**
 * Buscar avaliação de aprendizagem em 2026
 * Por enquanto retorna 0 até que haja dados de avaliações no banco
 * @param mes - Mês específico (1-12) ou null para anual
 */
export async function getAvaliacaoAprendizagem2026(mes: number | null = null): Promise<number> {
  // TODO: Implementar quando houver tabela de avaliações de aprendizagem
  // Por enquanto retorna 0 (sem dados)
  return 0;
}

/**
 * Buscar pesquisa de satisfação (NPS) em 2026
 * Por enquanto retorna 0 até que haja dados de pesquisas no banco
 * @param mes - Mês específico (1-12) ou null para anual
 */
export async function getPesquisaSatisfacao2026(mes: number | null = null): Promise<number> {
  // TODO: Implementar quando houver tabela de pesquisas de satisfação
  // Por enquanto retorna 0 (sem dados)
  return 0;
}
