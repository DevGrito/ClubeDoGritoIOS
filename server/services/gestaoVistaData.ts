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

// ==================================================================
// TIPO MesFiltro — suporta mês único, trimestre ou anual
// ==================================================================
export type MesFiltro = number | null | [number, number];

export function buildMesFilter(mes: MesFiltro, col: string): string {
  if (!mes) return '';
  if (Array.isArray(mes)) return `AND EXTRACT(MONTH FROM ${col}) BETWEEN ${mes[0]} AND ${mes[1]}`;
  return `AND EXTRACT(MONTH FROM ${col}) = ${Math.floor(Number(mes))}`;
}

function buildDateRange(mes: MesFiltro, ano: number = 2026): [string, string] {
  if (!mes) return [`${ano}-01-01`, `${ano + 1}-01-01`];
  const start = Array.isArray(mes) ? mes[0] : (mes as number);
  const end   = Array.isArray(mes) ? mes[1] : (mes as number);
  const nextMes  = end === 12 ? 1 : end + 1;
  const nextYear = end === 12 ? ano + 1 : ano;
  return [
    `${ano}-${String(start).padStart(2, '0')}-01`,
    `${nextYear}-${String(nextMes).padStart(2, '0')}-01`,
  ];
}

/** Último dia do mês (mes 1–12) como YYYY-MM-DD. */
export function buildPecEndDateRef(mes: MesFiltro, ano: number = new Date().getFullYear()): string {
  const now = new Date();
  let mesFim: number;
  if (mes === null) {
    mesFim = ano === now.getFullYear() ? now.getMonth() + 1 : 12;
  } else if (Array.isArray(mes)) {
    mesFim = mes[1];
  } else {
    mesFim = Math.floor(Number(mes));
  }
  const d = new Date(ano, mesFim, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Crianças atendidas no PEC — snapshot ao fim do período.
 * Data de início = LEAST(data_entrada do cadastro, enrollment_date da turma),
 * para não inflar o mês em que o vínculo tardio foi registrado no sistema.
 * Evasão: ainda conta no mês da data_evasao; deixa de contar só a partir do mês seguinte.
 */
export async function countCriancasAtendidasPEC(
  mes: MesFiltro = null,
  ano: number = new Date().getFullYear(),
  opts?: { turmaIds?: number[] },
): Promise<number> {
  try {
    const endDateStr = buildPecEndDateRef(mes, ano);
    const turmaIds = opts?.turmaIds?.filter((id) => id > 0) ?? [];
    const turmaFilter =
      turmaIds.length > 0
        ? `AND ie.activity_instance_id = ANY($2::int[])`
        : '';

    const params: (string | number[])[] = [endDateStr];
    if (turmaIds.length > 0) params.push(turmaIds);

    const result = await pool.query(
      `SELECT COUNT(DISTINCT cpf_norm) AS total
       FROM (
         SELECT
           REGEXP_REPLACE(ie.student_cpf, '[^0-9]', '', 'g') AS cpf_norm,
           LEAST(
             COALESCE(ie.enrollment_date, '9999-12-31'::date),
             COALESCE(a.data_entrada, a.created_at::date, ie.enrollment_date)
           ) AS data_inicio
         FROM instance_enrollments ie
         JOIN activity_instances ai ON ai.id = ie.activity_instance_id
         JOIN pec_activities pa ON pa.id = ai.activity_id
         JOIN projects p ON p.id = pa.project_id
         LEFT JOIN aluno a ON a.cpf = ie.student_cpf
         WHERE p.name IS NOT NULL
           ${turmaFilter}
           AND (
             COALESCE(ie.evadido, false) = false
             OR (
               ie.data_evasao IS NOT NULL
               AND date_trunc('month', ie.data_evasao::date)
                 >= date_trunc('month', $1::date)
             )
           )
       ) x
       WHERE data_inicio <= $1::date`,
      params,
    );
    const total = parseInt(result.rows[0]?.total || '0', 10);
    console.log(
      `[GV ${ano}] Crianças atendidas PEC (data_início, fim=${endDateStr}, mes=${JSON.stringify(mes)}): ${total}`,
    );
    return total;
  } catch (error) {
    console.error(`[GV ${ano}] Erro ao buscar crianças PEC:`, error);
    return 0;
  }
}

/**
 * Buscar contagem de crianças atendidas no PEC em 2026
 * Fonte: instance_enrollments + data_entrada (cadastro)
 * @param mes - Mês específico (1-12) ou null para anual
 */
export async function getCriancasAtendidasPEC2026(mes: MesFiltro = null): Promise<number> {
  return countCriancasAtendidasPEC(mes, 2026);
}

/**
 * Atendidos Inclusão = COUNT(DISTINCT CPF) de quem:
 *  1) está vinculado a alguma turma (participantes_turmas), OU
 *  2) aparece em geração de renda
 * NÃO usa presença. Equivalente à lógica do PEC (CPF com vínculo em turma).
 */
export async function getAtendimentosInclusao2026(
  mes: MesFiltro = null,
  ano: number = new Date().getFullYear()
): Promise<number> {
  try {
    const dataVinculo = `COALESCE(pt.data_ingresso::timestamp, ti.data_inicio::timestamp, pt.created_at, ti.created_at)`;
    const cpfVinculo = `REGEXP_REPLACE(COALESCE(pt.atendido_cpf, pi.cpf, ''), '[^0-9]', '', 'g')`;

    let turmaWhere = `length(${cpfVinculo}) = 11`;
    let geracaoWhere = `gr.cpf IS NOT NULL AND gr.cpf <> '' AND length(REGEXP_REPLACE(gr.cpf, '[^0-9]', '', 'g')) = 11`;

    if (mes === null) {
      // Snapshot anual: quem tem vínculo em turma agora + geração de renda do ano
      geracaoWhere += ` AND EXTRACT(YEAR FROM gr.criado_em) = ${ano}`;
    } else {
      turmaWhere += ` AND EXTRACT(YEAR FROM ${dataVinculo}) = ${ano} ${buildMesFilter(mes, dataVinculo)}`;
      geracaoWhere += ` AND EXTRACT(YEAR FROM gr.criado_em) = ${ano} ${buildMesFilter(mes, 'gr.criado_em')}`;
    }

    const result = await pool.query(`
      SELECT COUNT(DISTINCT cpf) as total FROM (
        SELECT ${cpfVinculo} AS cpf
        FROM participantes_turmas pt
        LEFT JOIN participantes_inclusao pi ON pi.id = pt.participante_id
        LEFT JOIN turmas_inclusao ti ON ti.id = pt.turma_id
        WHERE ${turmaWhere}

        UNION

        SELECT REGEXP_REPLACE(gr.cpf, '[^0-9]', '', 'g') AS cpf
        FROM inclusao_geracao_de_renda gr
        WHERE ${geracaoWhere}
      ) combined
    `);
    const total = Number(result.rows[0]?.total || 0);
    console.log(`[GV ${ano}] Atendidos Inclusão (turma+renda, mes=${JSON.stringify(mes)}): ${total}`);
    return total;
  } catch (error) {
    console.error(`[GV ${ano}] Erro ao buscar atendidos inclusão:`, error);
    return 0;
  }
}

export async function getHorasAulaInclusao2026(
  mes: MesFiltro = null,
  ano: number = new Date().getFullYear()
): Promise<number> {
  try {
    const mesFilter = `AND EXTRACT(YEAR FROM pi2.data) = ${ano} ${buildMesFilter(mes, 'pi2.data')}`;
    const result = await pool.query(`
      SELECT
        COUNT(CASE WHEN pi2.presente THEN 1 END) as presentes_count,
        ti.horario_entrada::text,
        ti.horario_saida::text,
        ti.horario
      FROM presencas_inclusao pi2
      JOIN turmas_inclusao ti ON pi2.turma_id = ti.id
      WHERE 1=1 ${mesFilter}
      GROUP BY pi2.turma_id, pi2.data, ti.horario_entrada, ti.horario_saida, ti.horario
    `);
    let horasAula = 0;
    for (const row of result.rows) {
      const presentes = Number(row.presentes_count || 0);
      if (presentes <= 0) continue;
      let diffMinutes = 0;
      if (row.horario_entrada && row.horario_saida) {
        const [hE, mE] = String(row.horario_entrada).split(':').map(Number);
        const [hS, mS] = String(row.horario_saida).split(':').map(Number);
        diffMinutes = (hS * 60 + mS) - (hE * 60 + mE);
      } else if (row.horario) {
        const match = String(row.horario).match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
        if (match) {
          const entMin = parseInt(match[1]) * 60 + parseInt(match[2]);
          const saiMin = parseInt(match[3]) * 60 + parseInt(match[4]);
          diffMinutes = saiMin - entMin;
        }
      }
      if (diffMinutes > 0) horasAula += presentes * (diffMinutes / 60);
    }
    const total = Math.round(horasAula);
    console.log(`[GV ${ano}] Horas Aula Inclusão (presenças reais, mês=${mes ?? 'anual'}): ${total}h`);
    return total;
  } catch (error) {
    console.error(`[GV ${ano}] Erro ao buscar horas aula inclusão:`, error);
    return 0;
  }
}

export async function getAtendidosPsico2026(
  mes: MesFiltro = null,
  ano: number = new Date().getFullYear()
): Promise<number> {
  try {
    const [startDate, nextDate] = buildDateRange(mes, ano);
    // Fonte única de verdade: mesma query do /api/psico/dashboard-kpis
    // Filtra tipos individuais (atendimento_individual + visita_domiciliar) + demandas_espontaneas
    const result = await pool.query(`
      SELECT COUNT(DISTINCT pessoa) AS cnt FROM (
        SELECT COALESCE(NULLIF(TRIM(cpf_atendido),''), NULLIF(LOWER(TRIM(nome_atendido)),''), 'de_' || id::text) AS pessoa
        FROM demandas_espontaneas
        WHERE data_atendimento::date >= $1 AND data_atendimento::date < $2
        UNION
        SELECT COALESCE(NULLIF(participante_cpf,''), NULLIF(LOWER(TRIM(participante_nome)),''), 'rc_' || id::text) AS pessoa
        FROM registros_confidenciais
        WHERE tipo IN ('atendimento_individual', 'visita_domiciliar')
          AND data::date >= $1 AND data::date < $2
          AND (status IS NULL OR status != 'inativo')
      ) pessoas
    `, [startDate, nextDate]);
    const total = parseInt(result.rows[0]?.cnt || '0');
    console.log(`[GV ${ano}] Atendidos Psico (mês=${mes ?? 'anual'}): ${total}`);
    return total;
  } catch (error) {
    console.error(`[GV ${ano}] Erro ao buscar atendidos psico:`, error);
    return 0;
  }
}

/**
 * Buscar contagem de alunos formados na Inclusão Produtiva em 2026
 * Fonte: participantes_turmas + turmas_inclusao
 * @param mes - Mês específico (1-12) ou null para anual
 */
export async function getAlunosFormadosInclusao2026(
  mes: MesFiltro = null,
  ano: number = new Date().getFullYear()
): Promise<number> {
  try {
    const mesFilter = `AND EXTRACT(YEAR FROM ti.data_fim) = ${ano} ${buildMesFilter(mes, 'ti.data_fim')}`;
    const result = await pool.query(`
      SELECT COUNT(*) as total
      FROM participantes_turmas pt
      JOIN turmas_inclusao ti ON pt.turma_id = ti.id
      WHERE pt.status IN ('concluido', 'formado')
        AND ti.status = 'concluido'
        ${mesFilter}
    `);
    return parseInt(result.rows[0]?.total || '0');
  } catch (error) {
    console.error(`[GV ${ano}] Erro ao buscar alunos formados:`, error);
    return 0;
  }
}

/**
 * Buscar frequência geral em 2026
 * Fonte: sessions (campo attendance é JSONB com lista de presenças)
 * @param mes - Mês específico (1-12) ou null para anual
 */
export async function getFrequenciaGeral2026(mes: MesFiltro = null): Promise<number> {
  try {
    const mesFilterPecCoord = `AND EXTRACT(YEAR FROM s.date::date) = 2026 ${buildMesFilter(mes, 's.date::date')}`;
    const mesFilterInclusao = buildMesFilter(mes, 'pi.data');
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
    `);

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
export async function getAlunosEmFormacao2026(mes: MesFiltro = null, ano: number = 2026): Promise<number> {
  try {
    // "Todos os Meses" → usa mês atual (snapshot, não acumulado)
    const mesEfetivo: MesFiltro = mes === null ? new Date().getMonth() + 1 : mes;
    const [, periodoFimExcl] = buildDateRange(mesEfetivo, ano);

    // Último dia do período (dia antes do início do próximo mês)
    const lastDayDate = new Date(periodoFimExcl);
    lastDayDate.setDate(lastDayDate.getDate() - 1);

    // Se o período ainda não fechou (mês corrente), usa hoje como referência
    const today = new Date();
    const refDate = lastDayDate > today ? today.toISOString().split('T')[0] : lastDayDate.toISOString().split('T')[0];

    // Snapshot: turmas ativas no último dia do período — DISTINCT por CPF (mestre ou legado)
    const result = await pool.query(`
      SELECT COUNT(DISTINCT REGEXP_REPLACE(COALESCE(pt.atendido_cpf, pi.cpf, ''), '[^0-9]', '', 'g')) as total
      FROM participantes_turmas pt
      JOIN turmas_inclusao ti ON pt.turma_id = ti.id
      LEFT JOIN participantes_inclusao pi ON pi.id = pt.participante_id
      WHERE ti.data_inicio <= $1
        AND (ti.data_fim IS NULL OR ti.data_fim >= $1)
        AND length(REGEXP_REPLACE(COALESCE(pt.atendido_cpf, pi.cpf, ''), '[^0-9]', '', 'g')) = 11
    `, [refDate]);
    console.log(`[GV ${ano}] Pessoas em Formação Inclusão (snapshot em ${refDate}):`, result.rows[0]?.total);
    return parseInt(result.rows[0]?.total || '0');
  } catch (error) {
    console.error(`[GV ${ano}] Erro ao buscar pessoas em formação Inclusão:`, error);
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
export async function getAtendimentosColetivos2026(mes: MesFiltro = null): Promise<number> {
  try {
    const mesFilter = buildMesFilter(mes, 'data::date');
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

export async function getIndicadores2026(mes: MesFiltro = null): Promise<{
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
  npsCombinado: number;
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
    pesquisaSatisfacao,
    npsCombinado
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
    getPesquisaSatisfacao2026(mes),
    getNpsCombinado2026(mes)
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
    avaliacaoAprendizagem, pesquisaSatisfacao, npsCombinado
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

/** Defaults de meta anual para geração de renda (empregados + empreendedores). */
export const METAS_INCLUSAO_RENDA_DEFAULTS = {
  pessoasEmpregadas: 1000,
  empreendedores: 500,
};

/**
 * Resolve metas de geração de renda a partir do banco (metas_indicadores).
 * Compatível com meta legada `geracaoRenda` (total único).
 */
export function resolveMetasInclusaoRenda(dbInclusao: Record<string, number> = {}): {
  pessoasEmpregadas: number;
  empreendedores: number;
  geracaoRenda: number;
} {
  const { pessoasEmpregadas: defEmp, empreendedores: defEmpr } = METAS_INCLUSAO_RENDA_DEFAULTS;
  let empreendedores = dbInclusao.empreendedores ?? defEmpr;
  let pessoasEmpregadas = dbInclusao.pessoasEmpregadas
    ?? (dbInclusao.geracaoRenda != null
      ? Math.max(0, dbInclusao.geracaoRenda - empreendedores)
      : defEmp);
  return {
    pessoasEmpregadas,
    empreendedores,
    geracaoRenda: pessoasEmpregadas + empreendedores,
  };
}

// ==================================================================
// FUNÇÕES ADICIONAIS PARA 2026 - Indicadores em tempo real do banco
// ==================================================================

/**
 * Buscar evasão (participantes que abandonaram turmas) em 2026
 * Fonte: inclusao_evasoes e pec_evasoes (registros ativos)
 * @param mes - Mês específico (1-12) ou null para anual
 */
export async function getEvasao2026(mes: MesFiltro = null): Promise<number> {
  try {
    const mesFilterInclusao = mes
      ? `AND EXTRACT(YEAR FROM ev.data_desligamento) = 2026 ${buildMesFilter(mes, 'ev.data_desligamento')}`
      : `AND EXTRACT(YEAR FROM ev.data_desligamento) = 2026`;
    const mesFilterPec = mes
      ? `AND EXTRACT(YEAR FROM pe.data_desligamento) = 2026 ${buildMesFilter(mes, 'pe.data_desligamento')}`
      : `AND EXTRACT(YEAR FROM pe.data_desligamento) = 2026`;

    const [resultInclusao, resultPec] = await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS total
        FROM inclusao_evasoes ev
        WHERE ev.revertido_em IS NULL
          ${mesFilterInclusao}
      `),
      pool.query(`
        SELECT COUNT(*)::int AS total
        FROM pec_evasoes pe
        WHERE pe.revertido_em IS NULL
          ${mesFilterPec}
      `),
    ]);

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
 * Taxa de evasão Inclusão (%) = evadidos distintos / matriculados distintos.
 * Mesma lógica do PEC (evasões no período ÷ base de matrículas até o fim do período).
 * Antes usava COUNT de vínculos com created_at no ano → taxa artificialmente perto de 0%.
 */
export async function getTaxaEvasaoInclusaoPct(
  mes: MesFiltro = null,
  ano: number = 2026,
): Promise<{ pct: number; evasoes: number; matriculas: number }> {
  try {
    const endDate = buildPecEndDateRef(mes, ano);
    const mesFilter = buildMesFilter(mes, 'ev.data_desligamento');

    const [evRes, totRes] = await Promise.all([
      pool.query(
        `
        SELECT COUNT(DISTINCT ev.participante_id)::int AS cnt
        FROM inclusao_evasoes ev
        WHERE ev.revertido_em IS NULL
          AND EXTRACT(YEAR FROM ev.data_desligamento) = $1
          ${mesFilter}
        `,
        [ano],
      ),
      pool.query(
        `
        SELECT COUNT(DISTINCT pt.participante_id)::int AS cnt
        FROM participantes_turmas pt
        WHERE COALESCE(pt.data_inscricao, pt.created_at)::date <= $1::date
        `,
        [endDate],
      ),
    ]);

    const evasoes = Number(evRes.rows[0]?.cnt || 0);
    const matriculas = Number(totRes.rows[0]?.cnt || 0);
    const pct = matriculas > 0 ? Math.round((evasoes / matriculas) * 100) : 0;
    console.log(`[GV ${ano}] Taxa evasão Inclusão: ${evasoes}/${matriculas} = ${pct}% (fim=${endDate}, mes=${JSON.stringify(mes)})`);
    return { pct, evasoes, matriculas };
  } catch (error) {
    console.error(`[GV ${ano}] Erro ao calcular taxa de evasão Inclusão:`, error);
    return { pct: 0, evasoes: 0, matriculas: 0 };
  }
}

/**
 * Buscar geração de renda (pessoas empregadas) em 2026
 * Fonte: participantes_turmas ou registros de empregabilidade
 * @param mes - Mês específico (1-12) ou null para anual
 */
/**
 * Contar famílias acompanhadas pelo Psicossocial (Favela 3D)
 * Fonte: favela3d_participantes
 * - Anual: total de registros com status = 'ativo'
 * - Mês específico: acumulado até o fim do mês (created_at < início do mês seguinte)
 */
export async function getFamiliasPsicossocial2026(mes: MesFiltro = null, ano: number = 2026): Promise<number> {
  try {
    let whereClause: string;
    if (mes) {
      const [, endDate] = buildDateRange(mes, ano);
      whereClause = `status IS DISTINCT FROM 'inativo' AND created_at < '${endDate}'`;
    } else {
      whereClause = `status = 'ativo'`;
    }
    const result = await pool.query(
      `SELECT COUNT(*) as total FROM favela3d_participantes WHERE ${whereClause}`
    );
    const total = parseInt(result.rows[0]?.total || '0');
    console.log(`[GV 2026] Famílias (Favela3D) mes=${mes} ano=${ano}: ${total}`);
    return total;
  } catch (error) {
    console.error('[GV 2026] Erro ao buscar famílias psicossocial:', error);
    return 0;
  }
}

export async function getGeracaoRenda2026(mes: MesFiltro = null): Promise<number> {
  try {
    const col = 'COALESCE(data_contratacao, data_inicio_atividade, criado_em)';
    const mesFilter = buildMesFilter(mes, col);
    const result = await pool.query(
      `SELECT COUNT(*) as total FROM inclusao_geracao_de_renda WHERE EXTRACT(YEAR FROM ${col}) = 2026 ${mesFilter}`
    );
    const total = parseInt(result.rows[0]?.total || '0');
    console.log(`[GV 2026] Geração de renda: ${total}`);
    return total;
  } catch (error) {
    console.error('[GV 2026] Erro ao buscar geração de renda:', error);
    return 0;
  }
}

export async function getGeracaoRendaSplit2026(mes: MesFiltro = null): Promise<{ empregabilidade: number; empreendedorismo: number }> {
  try {
    const col = 'COALESCE(data_contratacao, data_inicio_atividade, criado_em)';
    const mesFilter = buildMesFilter(mes, col);
    const result = await pool.query(
      `SELECT tipo, COUNT(*) as total FROM inclusao_geracao_de_renda
       WHERE EXTRACT(YEAR FROM ${col}) = 2026 ${mesFilter}
       GROUP BY tipo`
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
export async function getVisitasDomicilio2026(mes: MesFiltro = null): Promise<number> {
  try {
    const mesFilterRc = buildMesFilter(mes, 'data::date');
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
export async function getAtendimentosPsico2026(mes: MesFiltro = null): Promise<number> {
  try {
    const mesFilterRc2 = buildMesFilter(mes, 'data::date');
    const mesFilterDe  = buildMesFilter(mes, 'data_atendimento::date');
    const [rcResult, deResult] = await Promise.all([
      pool.query(`
        SELECT COUNT(*) as total
        FROM registros_confidenciais
        WHERE tipo = 'atendimento_individual'
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
    return parseInt(rcResult.rows[0]?.total || '0')
      + parseInt(deResult.rows[0]?.total || '0');
  } catch (error) {
    console.error('[GV 2026] Erro ao buscar atendimentos psicossociais:', error);
    return 0;
  }
}

/**
 * Avaliação de Aprendizagem = % formados sobre inscritos em turmas que finalizaram no período.
 * Mesma regra do endpoint /api/coordenador/dashboard-demografico-inclusao.
 */
export async function getAvaliacaoAprendizagem2026(mes: MesFiltro = null, ano = 2026): Promise<number> {
  try {
    const mesInicio = mes === null ? 1 : Array.isArray(mes) ? mes[0] : Math.floor(Number(mes));
    const mesFim = mes === null ? 12 : Array.isArray(mes) ? mes[1] : Math.floor(Number(mes));
    const result = await pool.query(`
      SELECT
        COUNT(pt.id) AS total_inscritos,
        COUNT(CASE WHEN pt.status IN ('formado', 'concluido') THEN 1 END) AS total_formados
      FROM participantes_turmas pt
      JOIN turmas_inclusao ti ON ti.id = pt.turma_id
      WHERE ti.status IN ('finalizado', 'concluido', 'encerrado')
        AND ti.data_fim IS NOT NULL
        AND EXTRACT(YEAR FROM ti.data_fim) = $1
        AND EXTRACT(MONTH FROM ti.data_fim) BETWEEN $2 AND $3
    `, [ano, mesInicio, mesFim]);
    const totalInscritos = Number(result.rows?.[0]?.total_inscritos || 0);
    const totalFormados = Number(result.rows?.[0]?.total_formados || 0);
    const pct = totalInscritos > 0 ? Math.round((totalFormados / totalInscritos) * 100) : 0;
    console.log(`[GV ${ano}] Avaliação aprendizagem (meses ${mesInicio}-${mesFim}): ${totalFormados}/${totalInscritos} = ${pct}%`);
    return pct;
  } catch (error) {
    console.error('[GV 2026] Erro ao buscar avaliação de aprendizagem:', error);
    return 0;
  }
}

/** Casas mapeadas (território psicossocial) — soma agregada por ano/mês. */
export async function getCasasMapeadas(ano: number, mes: MesFiltro = null): Promise<number> {
  try {
    let sql = 'SELECT COALESCE(SUM(casas_mapeadas), 0) AS total FROM mapeamentos_territorio WHERE 1=1';
    const params: number[] = [];
    params.push(ano);
    sql += ` AND EXTRACT(YEAR FROM data) = $${params.length}`;
    if (Array.isArray(mes)) {
      params.push(mes[0]);
      sql += ` AND EXTRACT(MONTH FROM data) >= $${params.length}`;
      params.push(mes[1]);
      sql += ` AND EXTRACT(MONTH FROM data) <= $${params.length}`;
    } else if (mes !== null && Number(mes) >= 1 && Number(mes) <= 12) {
      params.push(Math.floor(Number(mes)));
      sql += ` AND EXTRACT(MONTH FROM data) = $${params.length}`;
    }
    const r = await pool.query(sql, params);
    return Number(r.rows[0]?.total ?? 0);
  } catch (error) {
    console.error('[GV] Erro ao buscar casas mapeadas:', error);
    return 0;
  }
}

function isNpsMesUnico(mes: MesFiltro): mes is number {
  return mes !== null && !Array.isArray(mes) && Number(mes) >= 1 && Number(mes) <= 12;
}

function npsFromValores(vals: number[]): number {
  if (!vals.length) return 0;
  const prom = vals.filter((v) => v >= 9).length;
  const det = vals.filter((v) => v <= 6).length;
  return Math.round(((prom - det) / vals.length) * 100);
}

/** NPS anual/período = média aritmética dos NPS mensais (meses com dado). Mês único = fórmula clássica. */
async function calcNpsMediaMensalFromScores(
  programas: string[],
  mes: MesFiltro,
  ano = 2026,
): Promise<number | null> {
  const placeholders = programas.map((_, i) => `$${i + 1}`).join(', ');
  const params: any[] = [...programas, ano];
  let mesClause = ' AND mes IS NOT NULL';
  if (isNpsMesUnico(mes)) {
    params.push(Math.floor(Number(mes)));
    mesClause = ` AND mes = $${params.length}`;
  } else if (Array.isArray(mes)) {
    params.push(mes[0], mes[1]);
    mesClause = ` AND mes BETWEEN $${params.length - 1} AND $${params.length}`;
  }
  const res = await pool.query(
    `SELECT mes, ROUND(AVG(nps_score)::numeric, 1) AS score
     FROM nps_scores_mensais
     WHERE programa IN (${placeholders}) AND ano = $${programas.length + 1}
     ${mesClause}
     GROUP BY mes
     ORDER BY mes`,
    params,
  );
  if (!res.rows.length) return null;
  if (isNpsMesUnico(mes)) return Number(res.rows[0].score);
  const scores = res.rows.map((r: { score: number }) => Number(r.score));
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
}

async function calcNpsMediaMensalFromRespostas(
  programas: string[],
  mes: MesFiltro,
  ano = 2026,
): Promise<number | null> {
  const placeholders = programas.map((_, i) => `$${i + 1}`).join(', ');
  const params: any[] = [...programas, ano];
  let mesFilter = '';
  if (isNpsMesUnico(mes)) {
    params.push(Math.floor(Number(mes)));
    mesFilter = `AND EXTRACT(MONTH FROM nr.criado_em) = $${params.length}`;
  } else if (Array.isArray(mes)) {
    params.push(mes[0], mes[1]);
    mesFilter = `AND EXTRACT(MONTH FROM nr.criado_em) BETWEEN $${params.length - 1} AND $${params.length}`;
  }
  const result = await pool.query(
    `SELECT EXTRACT(MONTH FROM nr.criado_em)::int AS mes, ri.valor_numerico
     FROM nps_respostas_itens ri
     JOIN nps_perguntas np ON np.id = ri.pergunta_id
     JOIN nps_pesquisas p ON p.id = np.pesquisa_id
     JOIN nps_respostas nr ON nr.id = ri.resposta_id
     WHERE p.programa IN (${placeholders})
       AND np.is_nps_principal = TRUE
       AND ri.valor_numerico IS NOT NULL
       AND EXTRACT(YEAR FROM nr.criado_em) = $${programas.length + 1}
       ${mesFilter}`,
    params,
  );
  if (!result.rows.length) return null;
  if (isNpsMesUnico(mes)) {
    return npsFromValores(result.rows.map((r: { valor_numerico: number }) => Number(r.valor_numerico)));
  }
  const byMes = new Map<number, number[]>();
  for (const row of result.rows) {
    const m = Number(row.mes);
    if (!byMes.has(m)) byMes.set(m, []);
    byMes.get(m)!.push(Number(row.valor_numerico));
  }
  const monthlyNps = [...byMes.values()].map(npsFromValores);
  return Math.round(monthlyNps.reduce((a, b) => a + b, 0) / monthlyNps.length);
}

/**
 * NPS por programa. Mês único: fórmula clássica (promotores − detratores).
 * Anual/período: média dos NPS mensais com dado.
 */
async function calcNpsByPrograma(programas: string[], mes: MesFiltro, ano = 2026): Promise<number> {
  try {
    const fromRespostas = await calcNpsMediaMensalFromRespostas(programas, mes, ano);
    if (fromRespostas !== null) return fromRespostas;
    const fromScores = await calcNpsMediaMensalFromScores(programas, mes, ano);
    if (fromScores !== null) return fromScores;
    return 0;
  } catch (e) {
    console.error('Erro calcNpsByPrograma:', e);
    return 0;
  }
}

export async function getPesquisaSatisfacao2026(mes: MesFiltro = null): Promise<number> {
  return calcNpsByPrograma(['inclusao'], mes);
}

export async function getNpsPEC2026(mes: MesFiltro = null, ano = 2026): Promise<number> {
  return calcNpsByPrograma(['pec'], mes, ano);
}

/** Avaliação de Aprendizagem PEC — modelo semestral (só meses com dado contam na média). */
async function calcAvaliacaoAprendizagemPecFromScores(
  mes: MesFiltro,
  ano = 2026,
): Promise<number | null> {
  const params: any[] = [ano];
  let mesClause = ' AND mes IS NOT NULL';
  if (isNpsMesUnico(mes)) {
    params.push(Math.floor(Number(mes)));
    mesClause = ` AND mes = $${params.length}`;
  } else if (Array.isArray(mes)) {
    params.push(mes[0], mes[1]);
    mesClause = ` AND mes BETWEEN $${params.length - 1} AND $${params.length}`;
  }
  const res = await pool.query(
    `SELECT mes, ROUND(AVG(score)::numeric, 1) AS score
     FROM pec_avaliacao_aprendizagem_mensais
     WHERE ano = $1
     ${mesClause}
     GROUP BY mes
     ORDER BY mes`,
    params,
  );
  if (!res.rows.length) return null;
  if (isNpsMesUnico(mes)) return Number(res.rows[0].score);
  const scores = res.rows.map((r: { score: number }) => Number(r.score));
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
}

export async function getAvaliacaoAprendizagemPEC(mes: MesFiltro = null, ano = 2026): Promise<number> {
  try {
    const v = await calcAvaliacaoAprendizagemPecFromScores(mes, ano);
    return v ?? 0;
  } catch (e) {
    console.error('Erro getAvaliacaoAprendizagemPEC:', e);
    return 0;
  }
}

export async function getNpsCombinado2026(mes: MesFiltro = null): Promise<number> {
  return calcNpsByPrograma(['inclusao', 'pec'], mes);
}
