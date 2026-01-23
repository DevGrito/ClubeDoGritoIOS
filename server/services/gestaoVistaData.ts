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
  criancasAtendidas: 400, // Meta: 400 crianças (40/mês × 10 meses: fev→nov)
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
