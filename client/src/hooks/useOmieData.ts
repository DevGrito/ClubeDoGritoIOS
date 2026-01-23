import { useState, useEffect, useCallback, useMemo } from "react";

// Interfaces para tipos de dados do Omie
export interface ContaReceber {
  codigo_lancamento_omie?: number;
  numero_documento?: string;
  data_emissao?: string;
  data_vencimento?: string;
  valor_documento?: number;
  valor?: number;
  status_titulo?: string;
  status?: string;
  codigo_cliente?: number;
  razao_social?: string;
  codigo_projeto?: string;
  descricao_projeto?: string;
  projeto?: string;
  projeto_desc?: string;
}

export interface ContaPagar {
  codigo_lancamento_omie?: number;
  numero_documento?: string;
  data_emissao?: string;
  data_vencimento?: string;
  valor_documento?: number;
  valor?: number;
  status_titulo?: string;
  status?: string;
  codigo_fornecedor?: number;
  razao_social?: string;
  codigo_projeto?: string;
  descricao_projeto?: string;
  projeto?: string;
  projeto_desc?: string;
}

export interface ContaCorrente {
  codigo_conta?: number;
  nome_conta?: string;
  saldo_inicial?: number;
  saldo?: number;
  tipo_conta?: string;
  data_emissao?: string;
  data_vencimento?: string;
  codigo_projeto?: string;
  descricao_projeto?: string;
}

export interface Projeto {
  codigo_projeto?: string;
  nome_projeto?: string;
  descricao?: string;
}

export interface Categoria {
  codigo_categoria?: string;
  nome_categoria?: string;
  tipo?: string;
}

export interface ResumoFinanceiro {
  total_contas_receber?: number;
  total_contas_pagar?: number;
  saldo_contas_correntes?: number;
  periodo?: string;
}

export interface Indicadores {
  captado: number;
  realizado: number;
  saldo: number;
}

export interface DadosGrafico {
  mes: string;
  captado: number;
  realizado: number;
  mesNumero?: number;
}

export interface FiltrosPeriodo {
  mes: number | null;
  ano: number;
}

export interface PeriodoDisponivel {
  ano: number;
  mes: number;
  anoMes: string;
  label: string;
  countReceber: number;
  countPagar: number;
  totalRegistros: number;
}

export interface PeriodosDisponiveis {
  anos: number[];
  meses: { numero: number; nome: string }[];
  periodos: PeriodoDisponivel[];
  periodoDefault: FiltrosPeriodo;
}

export interface OmieData {
  contasReceber: ContaReceber[];
  contasPagar: ContaPagar[];
  contasCorrentes: ContaCorrente[];
  projetos: Projeto[];
  categorias: Categoria[];
  resumoFinanceiro: ResumoFinanceiro | null;
  indicadores: Indicadores;
}

export interface UseOmieDataReturn {
  data: OmieData;
  loading: boolean;
  error: string | null;
  periodosDisponiveis: PeriodosDisponiveis;
  refetch: () => Promise<void>;
  refetchWithFilter: (filtroArea?: string, debug?: boolean) => Promise<void>;  // 🆕 Nova função
  formatCurrency: (value: number) => string;
  filtrarPorPeriodo: (dados: any[], periodo: FiltrosPeriodo) => any[];
  filtrarPorArea: (dados: any[], area: string) => any[];
  gerarDadosGrafico: (contasReceber: ContaReceber[], contasPagar: ContaPagar[]) => DadosGrafico[];
}

// Hook personalizado para buscar dados financeiros do Omie
export function useOmieData(): UseOmieDataReturn {
  const [data, setData] = useState<OmieData>({
    contasReceber: [],
    contasPagar: [],
    contasCorrentes: [],
    projetos: [],
    categorias: [],
    resumoFinanceiro: null,
    indicadores: {
      captado: 0,
      realizado: 0,
      saldo: 0
    }
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number | null>(null); // Controle de cache simples
  const [periodosDisponiveis, setPeriodosDisponiveis] = useState<PeriodosDisponiveis>({
    anos: [],
    meses: [],
    periodos: [],
    periodoDefault: { mes: null, ano: new Date().getFullYear() }
  });

  // Função para formatar valores monetários
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Função para parsear números (inclui strings formatadas como "R$ 286.062,21")
  const parseNum = (v: any): number => {
    if (typeof v === 'number') return v;
    if (!v) return 0;
    // Remove símbolos de moeda e converte vírgulas para pontos
    const cleaned = String(v).replace(/[^\d,.-]/g, '').replace(/\.(?=.*\.)/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };
  
  // Log de depuração de dados filtrados
  const logDadosFiltrados = (dados: any[], filtro: string) => {
    if (dados.length > 0) {
      console.log(`📊 [DEBUG] Amostra de dados filtrados por "${filtro}":`);
      dados.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. Código: "${item.codigo_projeto || 'N/A'}" | Descrição: "${item.descricao_projeto || item.projeto_desc || 'N/A'}" | Valor: ${parseNum(item.valor_documento || item.valor || 0)}`);
      });
    }
  };

  // Função para extrair data de um registro (suporta múltiplos campos)
  const extrairData = (registro: any): string | null => {
    const possiveisCampos = ['data_emissao', 'data_vencimento', 'data_previsao', 'data'];
    for (const campo of possiveisCampos) {
      if (registro[campo] && typeof registro[campo] === 'string') {
        return registro[campo];
      }
    }
    return null;
  };

  // Função para parsear data brasileira (dd/mm/yyyy) para objeto
  const parsearDataBr = (dataBr: string): { ano: number; mes: number } | null => {
    try {
      const partes = dataBr.split('/');
      if (partes.length !== 3) return null;
      
      const dia = parseInt(partes[0]);
      const mes = parseInt(partes[1]);
      const ano = parseInt(partes[2]);
      
      if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return null;
      if (mes < 1 || mes > 12) return null;
      
      return { ano, mes };
    } catch {
      return null;
    }
  };

  // Função para analisar períodos disponíveis nos dados
  const analisarPeriodosDisponiveis = (contasReceber: ContaReceber[], contasPagar: ContaPagar[]): PeriodosDisponiveis => {
    console.log('🔍 [PERÍODOS] Analisando períodos disponíveis em', contasReceber.length + contasPagar.length, 'registros');
    
    const periodosMap = new Map<string, PeriodoDisponivel>();
    
    // Analisar contas a receber
    contasReceber.forEach(conta => {
      const dataStr = extrairData(conta);
      if (!dataStr) return;
      
      const dataObj = parsearDataBr(dataStr);
      if (!dataObj) return;
      
      const chave = `${dataObj.ano}-${dataObj.mes.toString().padStart(2, '0')}`;
      
      if (periodosMap.has(chave)) {
        const periodo = periodosMap.get(chave)!;
        periodo.countReceber++;
        periodo.totalRegistros++;
      } else {
        const nomesMeses = [
          '', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
          'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
        ];
        
        periodosMap.set(chave, {
          ano: dataObj.ano,
          mes: dataObj.mes,
          anoMes: chave,
          label: `${nomesMeses[dataObj.mes]}/${dataObj.ano}`,
          countReceber: 1,
          countPagar: 0,
          totalRegistros: 1
        });
      }
    });
    
    // Analisar contas a pagar
    contasPagar.forEach(conta => {
      const dataStr = extrairData(conta);
      if (!dataStr) return;
      
      const dataObj = parsearDataBr(dataStr);
      if (!dataObj) return;
      
      const chave = `${dataObj.ano}-${dataObj.mes.toString().padStart(2, '0')}`;
      
      if (periodosMap.has(chave)) {
        const periodo = periodosMap.get(chave)!;
        periodo.countPagar++;
        periodo.totalRegistros++;
      } else {
        const nomesMeses = [
          '', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
          'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
        ];
        
        periodosMap.set(chave, {
          ano: dataObj.ano,
          mes: dataObj.mes,
          anoMes: chave,
          label: `${nomesMeses[dataObj.mes]}/${dataObj.ano}`,
          countReceber: 0,
          countPagar: 1,
          totalRegistros: 1
        });
      }
    });
    
    // Converter para array e ordenar
    const periodos = Array.from(periodosMap.values())
      .sort((a, b) => {
        if (a.ano !== b.ano) return b.ano - a.ano; // Anos mais recentes primeiro
        return b.mes - a.mes; // Meses mais recentes primeiro
      });
    
    // Extrair anos únicos
    const anosUnicos = [...new Set(periodos.map(p => p.ano))].sort((a, b) => b - a);
    
    // Extrair meses únicos (dos períodos que têm dados)
    const mesesComDados = [...new Set(periodos.map(p => p.mes))].sort((a, b) => a - b);
    const nomesMeses = [
      '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    const meses = mesesComDados.map(mes => ({
      numero: mes,
      nome: nomesMeses[mes]
    }));
    
    // Encontrar período com mais dados como default
    const periodoComMaisDados = periodos.reduce((prev, current) => 
      (current.totalRegistros > prev.totalRegistros) ? current : prev,
      periodos[0] || { ano: new Date().getFullYear(), mes: new Date().getMonth() + 1, totalRegistros: 0 }
    );
    
    const periodoDefault = {
      mes: null, // Iniciar sem filtro de mês para mostrar ano inteiro
      ano: periodoComMaisDados?.ano || new Date().getFullYear()
    };
    
    console.log('✅ [PERÍODOS] Análise concluída:', {
      totalPeriodos: periodos.length,
      anos: anosUnicos.length,
      meses: meses.length,
      periodoDefault
    });
    
    return {
      anos: anosUnicos,
      meses,
      periodos,
      periodoDefault
    };
  };

  // Função para buscar dados do Omie
  const fetchOmieData = async (filtroArea?: string, debug: boolean = false): Promise<void> => {
    // Cache reduzido - evita chamadas muito frequentes (menos de 5 segundos)
    const now = Date.now();
    if (lastFetch && (now - lastFetch) < 5000 && !debug) {
      console.log('🔄 [OMIE HOOK] Cache ativo - pulando busca (última: ' + ((now - lastFetch) / 1000).toFixed(1) + 's atrás)');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setLastFetch(now);
      
      console.log('🔵 [OMIE HOOK] Iniciando busca de dados financeiros...');
      
      // 🎯 CONSTRUIR URL COM FILTROS
      let url = '/api/conselho';
      const params = new URLSearchParams();
      
      if (filtroArea) {
        params.append('filtroArea', filtroArea);
        console.log('🎯 [OMIE HOOK] Aplicando filtro de área:', filtroArea);
      }
      
      if (debug) {
        params.append('debug', '1');
        params.append('nocache', '1');
        console.log('🔍 [OMIE HOOK] Modo debug ativo');
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      console.log('📡 [OMIE HOOK] URL final:', url);
      
      // Usar a rota consolidada do Omie COM FILTROS
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const omieData = await response.json();
      
      console.log('✅ [OMIE HOOK] Dados consolidados recebidos:', omieData);

      // Extrair dados das respostas consolidadas
      let contasReceber: ContaReceber[] = [];
      let contasPagar: ContaPagar[] = [];
      let contasCorrentes: ContaCorrente[] = [];
      let projetos: Projeto[] = [];
      let categorias: Categoria[] = [];
      let resumoFinanceiro: ResumoFinanceiro | null = null;

      // Processar contas a receber (com múltiplas estruturas possíveis)
      if (omieData.contasReceber && !omieData.contasReceber.error) {
        contasReceber = omieData.contasReceber.conta_receber_cadastro || omieData.contasReceber.lista || omieData.contasReceber || [];
        console.log('✅ [OMIE HOOK] Contas a receber carregadas:', contasReceber.length);
      } else {
        console.warn('⚠️ [OMIE HOOK] Erro ao carregar contas a receber:', omieData.contasReceber?.error);
      }

      // Processar contas a pagar (com múltiplas estruturas possíveis)
      if (omieData.contasPagar && !omieData.contasPagar.error) {
        contasPagar = omieData.contasPagar.conta_pagar_cadastro || omieData.contasPagar.lista || omieData.contasPagar || [];
        console.log('✅ [OMIE HOOK] Contas a pagar carregadas:', contasPagar.length);
      } else {
        console.warn('⚠️ [OMIE HOOK] Erro ao carregar contas a pagar:', omieData.contasPagar?.error);
      }

      // Processar contas correntes (corrigindo pluralização)
      if (omieData.contasCorrentes && !omieData.contasCorrentes.error) {
        contasCorrentes = omieData.contasCorrentes.ContaCorrente || omieData.contasCorrentes.lista || omieData.contasCorrentes || [];
        console.log('✅ [OMIE HOOK] Contas correntes carregadas:', contasCorrentes.length);
      } else {
        console.warn('⚠️ [OMIE HOOK] Erro ao carregar contas correntes:', omieData.contasCorrentes?.error);
      }

      // Processar projetos
      if (omieData.projetos && !omieData.projetos.error) {
        projetos = omieData.projetos.projeto_cadastro || [];
        console.log('✅ [OMIE HOOK] Projetos carregados:', projetos.length);
      }

      // Processar categorias
      if (omieData.categorias && !omieData.categorias.error) {
        categorias = omieData.categorias.categoria_cadastro || [];
        console.log('✅ [OMIE HOOK] Categorias carregadas:', categorias.length);
      }

      // Processar resumo financeiro
      if (omieData.resumoFinanceiro && !omieData.resumoFinanceiro.error) {
        resumoFinanceiro = omieData.resumoFinanceiro;
        console.log('✅ [OMIE HOOK] Resumo financeiro carregado');
      }

      // Processar indicadores com múltiplos formatos e fallback
      const rawInd = omieData.indicadores || {};
      console.log('📊 [OMIE HOOK] Indicadores brutos recebidos:', rawInd);
      
      // Tentar diferentes nomes de campos e parsear números
      const capt = parseNum(rawInd.totalCaptado ?? rawInd.captado ?? rawInd.total_captado);
      const real = parseNum(rawInd.totalRealizado ?? rawInd.realizado ?? rawInd.total_realizado);
      
      console.log('📊 [OMIE HOOK] Valores parseados - Captado:', capt, 'Realizado:', real);
      
      // Se os indicadores do backend são válidos, usar eles
      let indicadores: Indicadores = { captado: capt, realizado: real, saldo: capt - real };
      
      // Fallback: se não temos valores válidos, calcular localmente
      if (!capt && !real) {
        console.log('⚠️ [OMIE HOOK] Indicadores zerados/ausentes - usando cálculo local');
        indicadores = calcularIndicadores(contasReceber, contasPagar, contasCorrentes);
        console.log('📊 [OMIE HOOK] Indicadores calculados localmente:', indicadores);
      }
      
      console.log('✅ [OMIE HOOK] Indicadores finais:', indicadores);

      // Analisar períodos disponíveis nos dados carregados
      const novosPerodos = analisarPeriodosDisponiveis(contasReceber, contasPagar);
      setPeriodosDisponiveis(novosPerodos);
      
      console.log('📅 [OMIE HOOK] Períodos disponíveis atualizados:', {
        totalPeriodos: novosPerodos.periodos.length,
        periodoDefault: novosPerodos.periodoDefault,
        anosDisponiveis: novosPerodos.anos
      });

      setData({
        contasReceber,
        contasPagar,
        contasCorrentes,
        projetos,
        categorias,
        resumoFinanceiro,
        indicadores
      });

    } catch (err: any) {
      console.error('❌ [OMIE HOOK] Erro ao buscar dados:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Função para calcular indicadores financeiros
  const calcularIndicadores = (contasReceber: ContaReceber[], contasPagar: ContaPagar[], contasCorrentes: ContaCorrente[]): Indicadores => {
    // Captado: soma de valores de contas a receber
    const captado = contasReceber.reduce((total: number, conta: ContaReceber) => {
      const valor = parseFloat(String(conta.valor_documento || conta.valor || 0));
      return total + valor;
    }, 0);

    // Realizado: soma de valores de contas a pagar pagas
    const realizado = contasPagar.reduce((total: number, conta: ContaPagar) => {
      const valor = parseFloat(String(conta.valor_documento || conta.valor || 0));
      const status = conta.status_titulo || conta.status || '';
      
      if (status.toLowerCase().includes('pago') || status.toLowerCase().includes('liquidado')) {
        return total + valor;
      }
      return total;
    }, 0);

    // Saldo: soma de saldos iniciais de contas correntes
    const saldoContas = contasCorrentes.reduce((total: number, conta: ContaCorrente) => {
      const saldoInicial = parseFloat(String(conta.saldo_inicial || conta.saldo || 0));
      return total + saldoInicial;
    }, 0);

    return {
      captado,
      realizado,
      saldo: captado - realizado // ou usar o saldo das contas correntes
    };
  };

  // Função para filtrar dados por período (melhorada)
  const filtrarPorPeriodo = (dados: any[], periodo: FiltrosPeriodo): any[] => {
    if (!periodo || !dados.length) {
      console.log('🔍 [FILTRO] Sem período ou dados, retornando todos os registros');
      return dados;
    }
    
    const { mes, ano } = periodo;
    
    console.log('🔍 [FILTRO] Aplicando filtro de período:', { mes, ano, totalRegistros: dados.length });
    
    const dadosFiltrados = dados.filter(item => {
      const dataStr = extrairData(item);
      if (!dataStr) {
        console.log('⚠️ [FILTRO] Registro sem data válida:', item);
        return false; // Excluir registros sem data
      }
      
      const dataObj = parsearDataBr(dataStr);
      if (!dataObj) {
        console.log('⚠️ [FILTRO] Data não parseável:', dataStr);
        return false;
      }
      
      // Filtrar por ano (obrigatório se especificado)
      if (ano && dataObj.ano !== ano) {
        return false;
      }
      
      // Filtrar por mês (opcional - se null, mostrar todos os meses do ano)
      if (mes && dataObj.mes !== mes) {
        return false;
      }
      
      return true;
    });
    
    console.log('✅ [FILTRO] Filtro aplicado:', {
      registrosOriginais: dados.length,
      registrosFiltrados: dadosFiltrados.length,
      criterio: { ano, mes }
    });
    
    return dadosFiltrados;
  };

  // Função para filtrar dados por projeto/área
  const filtrarPorArea = (dados: any[], area: string): any[] => {
    if (!area || !dados.length) {
      console.log('🔍 [FILTRO ÁREA] Sem filtro ou dados vazios:', { area, quantidadeDados: dados.length });
      return dados;
    }
    
    console.log(`🔍 [FILTRO ÁREA] Aplicando filtro para "${area}" em ${dados.length} registros`);
    
    // Mapeamento baseado nos valores do dropdown e dados reais da API Omie
    const mapeamentoAreas = {
      'casa': ['casa sonhar', 'casa', 'sonhar', '9153694887'],
      'favela': ['favela 3d', 'favela', '3d', '9153695042'],
      'negocios': ['negócios sociais', 'negocios', 'sociais', 'q. profissional', 'profissional', '9153694940'],
      'polo': ['pec', 'programa empreendedor', 'polo esportivo', 'polo', '9153695012'],
      'psicossocial': ['psicossocial', 'psico', 'social'],
      'inclusao': ['inclusão produtiva', 'inclusao', 'produtiva'],
      // Valores antigos para compatibilidade  
      'casa sonhar': ['casa sonhar', 'casa', 'sonhar', '9153694887'],
      'favela 3d': ['favela 3d', 'favela', '3d', '9153695042'],
      'negócios sociais': ['negócios sociais', 'negocios', 'sociais', 'q. profissional', 'profissional', '9153694940'],
      'pec': ['pec', 'programa empreendedor', '9153695012'],
      'educação': ['educação', 'educacao', 'educa'],
      'capacitação': ['capacitação', 'capacitacao', 'capac'],
      'moradia': ['moradia', 'habitação', 'habitacao'],
      'empreendedorismo': ['empreendedorismo', 'empreender', 'startup'],
      'tecnologia': ['tecnologia', 'tech', 'digital'],
      'clube do grito': ['clube do grito', 'grito', '9153695120']
    };
    
    // Normalizar área de busca
    const areaNormalizada = area.toLowerCase().trim();
    const palavrasChave = mapeamentoAreas[areaNormalizada] || [areaNormalizada];
    
    console.log(`🔍 [FILTRO ÁREA] Palavras-chave para "${area}":`, palavrasChave);
    
    // Primeiro, loggar uma amostra dos dados para debug
    if (dados.length > 0) {
      console.log('🔍 [FILTRO ÁREA DEBUG] Amostra dos dados a filtrar:');
      dados.slice(0, 3).forEach((item, idx) => {
        console.log(`  ${idx + 1}. Campos disponíveis:`, Object.keys(item));
        console.log(`     - codigo_projeto: "${item.codigo_projeto}"`, 
                   `- projeto: "${item.projeto}"`,
                   `- codigo: "${item.codigo}"`);
        console.log(`     - descricao_projeto: "${item.descricao_projeto}"`,
                   `- projeto_desc: "${item.projeto_desc}"`,
                   `- nome: "${item.nome}"`,
                   `- nome_projeto: "${item.nome_projeto}"`);
        console.log(`     - valor: ${item.valor_documento || item.valor || 0}`);
      });
    }
    
    const dadosFiltrados = dados.filter(item => {
      // Tentar múltiplos campos para código do projeto
      const codigoProjeto = (
        item.codigo_projeto || 
        item.projeto || 
        item.codigo ||
        ''
      ).toString().toLowerCase();
      
      // Tentar múltiplos campos para descrição/nome do projeto
      const descricaoProjeto = (
        item.descricao_projeto || 
        item.projeto_desc || 
        item.nome_projeto ||
        item.nome ||
        ''
      ).toString().toLowerCase();
      
      const textoCompleto = `${codigoProjeto} ${descricaoProjeto}`.toLowerCase();
      
      // Debug detalhado para os primeiros registros
      if (dados.indexOf(item) < 5) {
        console.log(`🔍 [FILTRO DEBUG ${dados.indexOf(item) + 1}]`, {
          codigoProjeto,
          descricaoProjeto,
          textoCompleto,
          valorItem: item.valor_documento || item.valor || 0
        });
      }
      
      // Verificar se alguma palavra-chave está presente
      const temMatch = palavrasChave.some(palavra => 
        textoCompleto.includes(palavra.toLowerCase())
      );
      
      if (temMatch) {
        console.log(`✅ [FILTRO ÁREA] Match encontrado:`, {
          codigo: codigoProjeto,
          descricao: descricaoProjeto,
          palavraEncontrada: palavrasChave.find(p => textoCompleto.includes(p.toLowerCase())),
          valorDocumento: item.valor_documento || item.valor || 0
        });
      }
      
      return temMatch;
    });
    
    const valorTotal = dadosFiltrados.reduce((total, item) => total + parseNum(item.valor_documento || item.valor || 0), 0);
    
    console.log(`✅ [FILTRO ÁREA] Filtro aplicado para "${area}":`, {
      registrosOriginais: dados.length,
      registrosFiltrados: dadosFiltrados.length,
      valorTotal,
      valorTotalFormatado: formatCurrency(valorTotal)
    });
    
    // Se não encontrou nada, loggar mais detalhes para debug
    if (dadosFiltrados.length === 0 && dados.length > 0) {
      console.warn('⚠️ [FILTRO ÁREA] Nenhum match encontrado! Amostra dos textos completos:');
      dados.slice(0, 5).forEach((item, idx) => {
        const codigoProjeto = (item.codigo_projeto || item.projeto || item.codigo || '').toString();
        const descricaoProjeto = (item.descricao_projeto || item.projeto_desc || item.nome_projeto || item.nome || '').toString();
        console.log(`  ${idx + 1}. "${codigoProjeto} ${descricaoProjeto}".toLowerCase() => "${(codigoProjeto + ' ' + descricaoProjeto).toLowerCase()}"`);
      });
    }
    
    return dadosFiltrados;
  };

  // Função para gerar dados do gráfico mensal
  const gerarDadosGrafico = (contasReceber: ContaReceber[], contasPagar: ContaPagar[]): DadosGrafico[] => {
    const meses: Record<string, DadosGrafico> = {};
    
    // Processar contas a pagar - META (todas as contas planejadas)
    contasPagar.forEach(conta => {
      const dataEmissao = conta.data_emissao || conta.data_vencimento || '';
      if (!dataEmissao) return;
      
      try {
        const [dia, mes, ano] = dataEmissao.split('/');
        const chave = `${mes}/${ano}`;
        
        if (!meses[chave]) {
          meses[chave] = { mes: chave, captado: 0, realizado: 0 };
        }
        
        // META = TODAS as contas a pagar (planejadas)
        meses[chave].captado += parseFloat(String(conta.valor_documento || conta.valor || 0));
      } catch (error) {
        console.warn('Data inválida em conta a pagar (meta):', dataEmissao);
      }
    });

    // Processar contas a pagar - REALIZADO (apenas as pagas)
    contasPagar.forEach(conta => {
      const dataEmissao = conta.data_emissao || conta.data_vencimento || '';
      if (!dataEmissao) return;
      
      try {
        const [dia, mes, ano] = dataEmissao.split('/');
        const chave = `${mes}/${ano}`;
        
        if (!meses[chave]) {
          meses[chave] = { mes: chave, captado: 0, realizado: 0 };
        }
        
        // REALIZADO = Contas a pagar que foram PAGAS
        const status = conta.status_titulo || conta.status || '';
        if (status.toLowerCase().includes('pago') || status.toLowerCase().includes('liquidado')) {
          meses[chave].realizado += parseFloat(String(conta.valor_documento || conta.valor || 0));
        }
      } catch (error) {
        console.warn('Data inválida em conta a pagar (realizado):', dataEmissao);
      }
    });

    // Converter para array e ordenar
    return Object.values(meses).sort((a, b) => {
      const [mesA, anoA] = a.mes.split('/');
      const [mesB, anoB] = b.mes.split('/');
      return new Date(parseInt(anoA), parseInt(mesA) - 1).getTime() - new Date(parseInt(anoB), parseInt(mesB) - 1).getTime();
    });
  };

  // Buscar dados na inicialização
  useEffect(() => {
    fetchOmieData();
  }, []);
  

  // Memoizar as funções de refetch para evitar re-renders desnecessários
  const refetch = useCallback(async () => {
    console.log('🔄 [OMIE HOOK] Refetch sem filtros');
    await fetchOmieData(undefined, false);
  }, []);

  const refetchWithFilter = useCallback(async (filtroArea?: string, debug = false) => {
    console.log('🔄 [OMIE HOOK] Refetch com filtro:', { filtroArea, debug });
    await fetchOmieData(filtroArea, debug);
  }, []);

  return {
    data,
    loading,
    error,
    periodosDisponiveis,
    refetch,
    refetchWithFilter,
    formatCurrency,
    filtrarPorPeriodo,
    filtrarPorArea,
    gerarDadosGrafico
  };
}