import { useState, useEffect } from "react";

// Hook personalizado para buscar dados financeiros do Omie
export function useOmieData() {
  const [data, setData] = useState({
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
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null); // Controle de cache simples

  // Função para formatar valores monetários
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Função para parsear números (inclui strings formatadas como "R$ 286.062,21")
  const parseNum = (v) => {
    if (typeof v === 'number') return v;
    if (!v) return 0;
    // Remove símbolos de moeda e converte vírgulas para pontos
    const cleaned = String(v).replace(/[^\d,.-]/g, '').replace(/\.(?=.*\.)/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  // Função para buscar dados do Omie
  const fetchOmieData = async () => {
    // Cache reduzido - evita chamadas muito frequentes (menos de 5 segundos)
    const now = Date.now();
    if (lastFetch && (now - lastFetch) < 5000) {
      console.log('🔄 [OMIE HOOK] Cache ativo - pulando busca (última: ' + ((now - lastFetch) / 1000).toFixed(1) + 's atrás)');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setLastFetch(now);
      
      console.log('🔵 [OMIE HOOK] Iniciando busca de dados financeiros...');
      
      // Usar a rota consolidada do Omie
      const response = await fetch('/api/conselho');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const omieData = await response.json();
      
      console.log('✅ [OMIE HOOK] Dados consolidados recebidos:', omieData);

      // Extrair dados das respostas consolidadas
      let contasReceber = [];
      let contasPagar = [];
      let contasCorrentes = [];
      let projetos = [];
      let categorias = [];
      let resumoFinanceiro = null;

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
      let indicadores = { captado: capt, realizado: real, saldo: capt - real };
      
      // Fallback: se não temos valores válidos, calcular localmente
      if (!capt && !real) {
        console.log('⚠️ [OMIE HOOK] Indicadores zerados/ausentes - usando cálculo local');
        indicadores = calcularIndicadores(contasReceber, contasPagar, contasCorrentes);
        console.log('📊 [OMIE HOOK] Indicadores calculados localmente:', indicadores);
      }
      
      console.log('✅ [OMIE HOOK] Indicadores finais:', indicadores);

      setData({
        contasReceber,
        contasPagar,
        contasCorrentes,
        projetos,
        categorias,
        resumoFinanceiro,
        indicadores
      });

    } catch (err) {
      console.error('❌ [OMIE HOOK] Erro ao buscar dados:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Função para calcular indicadores financeiros
  const calcularIndicadores = (contasReceber, contasPagar, contasCorrentes) => {
    // Captado: soma de valores de contas a receber
    const captado = contasReceber.reduce((total, conta) => {
      const valor = parseFloat(conta.valor_documento || conta.valor || 0);
      return total + valor;
    }, 0);

    // Realizado: soma de valores de contas a pagar pagas
    const realizado = contasPagar.reduce((total, conta) => {
      const valor = parseFloat(conta.valor_documento || conta.valor || 0);
      const status = conta.status_titulo || conta.status || '';
      
      if (status.toLowerCase().includes('pago') || status.toLowerCase().includes('liquidado')) {
        return total + valor;
      }
      return total;
    }, 0);

    // Saldo: soma de saldos iniciais de contas correntes
    const saldo = contasCorrentes.reduce((total, conta) => {
      const saldoInicial = parseFloat(conta.saldo_inicial || conta.saldo || 0);
      return total + saldoInicial;
    }, 0);

    return {
      captado,
      realizado,
      saldo: captado - realizado // ou usar o saldo das contas correntes
    };
  };

  // Função para filtrar dados por período
  const filtrarPorPeriodo = (dados, periodo) => {
    if (!periodo || !dados.length) return dados;
    
    const { mes, ano } = periodo;
    
    return dados.filter(item => {
      const dataEmissao = item.data_emissao || item.data_vencimento || item.data || '';
      if (!dataEmissao) return true;
      
      try {
        const [dia, mesItem, anoItem] = dataEmissao.split('/');
        return (!ano || anoItem === ano.toString()) && 
               (!mes || parseInt(mesItem) === mes);
      } catch {
        return true;
      }
    });
  };

  // Função para filtrar dados por projeto/área
  const filtrarPorArea = (dados, area) => {
    if (!area || !dados.length) return dados;
    
    return dados.filter(item => {
      const codigoProjeto = item.codigo_projeto || item.projeto || '';
      const descricaoProjeto = item.descricao_projeto || item.projeto_desc || '';
      
      return codigoProjeto.includes(area) || 
             descricaoProjeto.toLowerCase().includes(area.toLowerCase());
    });
  };

  // Função para gerar dados do gráfico mensal
  const gerarDadosGrafico = (contasReceber, contasPagar) => {
    const meses = {};
    
    // Processar contas a receber (Captado)
    contasReceber.forEach(conta => {
      const dataEmissao = conta.data_emissao || conta.data_vencimento || '';
      if (!dataEmissao) return;
      
      try {
        const [dia, mes, ano] = dataEmissao.split('/');
        const chave = `${mes}/${ano}`;
        
        if (!meses[chave]) {
          meses[chave] = { mes: chave, captado: 0, realizado: 0 };
        }
        
        meses[chave].captado += parseFloat(conta.valor_documento || conta.valor || 0);
      } catch (error) {
        console.warn('Data inválida em conta a receber:', dataEmissao);
      }
    });

    // Processar contas a pagar (Realizado)
    contasPagar.forEach(conta => {
      const dataEmissao = conta.data_emissao || conta.data_vencimento || '';
      if (!dataEmissao) return;
      
      try {
        const [dia, mes, ano] = dataEmissao.split('/');
        const chave = `${mes}/${ano}`;
        
        if (!meses[chave]) {
          meses[chave] = { mes: chave, captado: 0, realizado: 0 };
        }
        
        const status = conta.status_titulo || conta.status || '';
        if (status.toLowerCase().includes('pago') || status.toLowerCase().includes('liquidado')) {
          meses[chave].realizado += parseFloat(conta.valor_documento || conta.valor || 0);
        }
      } catch (error) {
        console.warn('Data inválida em conta a pagar:', dataEmissao);
      }
    });

    // Converter para array e ordenar
    return Object.values(meses).sort((a, b) => {
      const [mesA, anoA] = a.mes.split('/');
      const [mesB, anoB] = b.mes.split('/');
      return new Date(anoA, mesA - 1) - new Date(anoB, mesB - 1);
    });
  };

  // Buscar dados na inicialização
  useEffect(() => {
    fetchOmieData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchOmieData,
    formatCurrency,
    filtrarPorPeriodo,
    filtrarPorArea,
    gerarDadosGrafico
  };
}