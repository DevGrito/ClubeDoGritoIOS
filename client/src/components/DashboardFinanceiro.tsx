import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, PiggyBank, Wallet, AlertCircle, BarChart3, Eye, EyeOff, Building2 } from "lucide-react";
import IndicadorCard from "./IndicadorCard";
import FinanceCarousel from "./FinanceCarousel";
import FinanceChartCarousel from "./FinanceChartCarousel";
import { useOmieData } from "@/hooks/useOmieData";
import { useUserData } from "@/hooks/useUserData";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

/**
 * Interface para as propriedades do componente DashboardFinanceiro
 */
interface DashboardFinanceiroProps {
  /** Filtros de período aplicados aos dados */
  filtrosPeriodo?: {
    mes: number | null;
    ano: number;
  };
  /** Filtro de área/projeto */
  filtroArea?: string;
  /** Classe CSS adicional */
  className?: string;
  /** Callback para refresh manual dos dados */
  onRefresh?: () => void;
  /** Se deve mostrar controles de refresh */
  showRefreshControls?: boolean;
  /** Se deve mostrar os dados ou mascarar */
  showData?: boolean;
}

/**
 * Interface para dados de indicadores financeiros
 */
interface IndicadoresFinanceiros {
  captado: number;
  realizado: number;
  saldo: number;
}

/**
 * Interface para dados do gráfico mensal
 */
interface DadosGrafico {
  mes: string;
  captado: number;
  realizado: number;
  mesNumero?: number;
}

/**
 * Interface para dados consolidados (Metas vs Realizados)
 */
interface DadosConsolidados {
  periodo: string;
  totais: {
    receitas_meta: number;
    receitas_captado: number;
    receitas_resultado: number;
    despesas_meta: number;
    despesas_realizado: number;
    despesas_resultado: number;
    saldo_final_geral: number;
  };
  dados_mensais: Array<{
    mes: string;
    meta_captado: number;
    captado: number;
    meta_realizado: number;
    realizado: number;
    saldo: number;
  }>;
  metas: {
    receitas: number;
    despesas: number;
  };
  realizados: {
    contas_receber: number;
    contas_pagar: number;
  };
  timestamp: string;
}

/**
 * Container principal do Dashboard Financeiro
 * 
 * Integra dados reais do Omie via useOmieData e exibe:
 * - 3 indicadores principais (Captado, Realizado, Saldo)
 * - Gráfico comparativo mensal
 * - Estados de loading, erro e dados vazios
 * - Filtros por período e área
 */
export default function DashboardFinanceiro({
  filtrosPeriodo = { mes: null, ano: new Date().getFullYear() },
  filtroArea = '',
  className = '',
  onRefresh,
  showRefreshControls = true,
  showData = true
}: DashboardFinanceiroProps) {
  
  console.log('🔧 [DASHBOARD] Renderizando com filtros:', filtrosPeriodo, 'Área:', filtroArea, 'showData:', showData);
  
  // Função helper para mascarar valores
  const maskValue = (value: number) => {
    if (showData) return value;
    return 0; // Retorna 0 para zerar os gráficos
  };
  
  const maskCurrency = (value: number) => {
    if (showData) return formatCurrency(value);
    return '•••';
  };
  
  // Hook para dados do Omie
  const {
    data: omieData,
    loading: omieLoading,
    error: omieError,
    periodosDisponiveis,
    refetch: refetchOmie,
    refetchWithFilter,  // 🆕 Nova função com filtros
    formatCurrency,
    filtrarPorPeriodo,
    filtrarPorArea,
    gerarDadosGrafico
  } = useOmieData();

  // 🆕 Estados para dados consolidados (Metas vs Realizados)
  const [dadosConsolidados, setDadosConsolidados] = useState<DadosConsolidados | null>(null);
  const [loadingConsolidado, setLoadingConsolidado] = useState(false);
  const [periodoSelecionado, setPeriodoSelecionado] = useState('2025'); // Padrão: ano todo
  const [departamentoSelecionado, setDepartamentoSelecionado] = useState('TODOS'); // 'TODOS' = sem filtro

  // 🆕 Buscar lista de departamentos disponíveis
  const { data: departamentosData, isLoading: loadingDepartamentos } = useQuery<{ departamentos: string[] }>({
    queryKey: ['/api/financeiro/departamentos'],
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  const departamentos = departamentosData?.departamentos || [];

  // 🆕 Função auxiliar para decodificar HTML entities
  const decodeHtmlEntities = (text: string): string => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  // 🆕 Função para buscar dados consolidados
  const buscarDadosConsolidados = async (periodo: string, departamento: string) => {
    setLoadingConsolidado(true);
    try {
      const params = new URLSearchParams({ periodo });
      // Só adiciona filtro se não for 'TODOS'
      if (departamento && departamento !== 'TODOS') {
        // Decodificar HTML entities antes de enviar (ex: &amp; → &)
        const departamentoDecodificado = decodeHtmlEntities(departamento);
        params.append('departamento', departamentoDecodificado);
      }
      
      const url = `/api/financeiro/consolidado?${params.toString()}`;
      console.log('📊 [DASHBOARD] Buscando dados consolidados:', { periodo, departamento: departamento === 'TODOS' ? 'TODOS' : departamento });
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const dados = await response.json();
      setDadosConsolidados(dados);
      console.log('✅ [DASHBOARD] Dados consolidados recebidos:', dados);
    } catch (error) {
      console.error('❌ [DASHBOARD] Erro ao buscar dados consolidados:', error);
      setDadosConsolidados(null);
    } finally {
      setLoadingConsolidado(false);
    }
  };

  // 🆕 Buscar dados consolidados quando período ou departamento mudar
  useEffect(() => {
    buscarDadosConsolidados(periodoSelecionado, departamentoSelecionado);
  }, [periodoSelecionado, departamentoSelecionado]);

  // 🎯 Recarregar dados quando filtro de área mudar
  useEffect(() => {
    console.log('🔄 [DASHBOARD] Detectada mudança no filtroArea:', filtroArea);
    
    // Verificar se a função existe antes de chamar
    if (typeof refetchWithFilter === 'function') {
      // Se há filtro de área, chamar API com filtro
      if (filtroArea && filtroArea.trim() !== '') {
        console.log('🚀 [DASHBOARD] Aplicando filtro de área:', filtroArea);
        refetchWithFilter(filtroArea, true); // debug=true para logs detalhados
      } else {
        console.log('🌐 [DASHBOARD] Sem filtro de área, carregando todos os dados');
        refetchWithFilter(undefined, true); // Carregar sem filtros
      }
    } else {
      console.warn('⚠️ [DASHBOARD] refetchWithFilter não é uma função, usando refetchOmie como fallback');
      // Fallback para refetch simples se refetchWithFilter não estiver disponível
      if (typeof refetchOmie === 'function') {
        refetchOmie();
      }
    }
  }, [filtroArea]); // Remover refetchWithFilter das dependências para evitar re-renders

  // Aplicar filtros aos dados com memoização para performance
  const dadosFiltrados = useMemo(() => {
    if (!omieData || omieLoading) {
      return {
        contasReceber: [],
        contasPagar: [],
        contasCorrentes: []
      };
    }

    console.log('🔄 [DASHBOARD] Aplicando filtros - Período:', filtrosPeriodo, 'Área:', filtroArea);

    // Para filtros de área, os dados já vêm filtrados do backend!
    let contasReceberFiltradas = omieData.contasReceber || [];
    let contasPagarFiltradas = omieData.contasPagar || [];
    let contasCorrentesFiltradas = omieData.contasCorrentes || [];

    // Aplicar apenas filtro de período (local)
    if (filtrosPeriodo && (filtrosPeriodo.mes || filtrosPeriodo.ano)) {
      contasReceberFiltradas = filtrarPorPeriodo(contasReceberFiltradas, filtrosPeriodo);
      contasPagarFiltradas = filtrarPorPeriodo(contasPagarFiltradas, filtrosPeriodo);
      contasCorrentesFiltradas = filtrarPorPeriodo(contasCorrentesFiltradas, filtrosPeriodo);
      console.log('⚙️ [DASHBOARD] Filtro de período aplicado localmente');
    }
    
    // 🔴 FILTRO DE ÁREA AGORA É FEITO NO BACKEND!
    // Não aplicar filtro de área aqui, pois os dados já vêm filtrados
    if (filtroArea) {
      console.log('✅ [DASHBOARD] Usando dados já filtrados pelo backend para área:', filtroArea);
    }

    console.log('✅ [DASHBOARD] Dados filtrados:', {
      contasReceber: contasReceberFiltradas.length,
      contasPagar: contasPagarFiltradas.length,
      contasCorrentes: contasCorrentesFiltradas.length
    });

    return {
      contasReceber: contasReceberFiltradas,
      contasPagar: contasPagarFiltradas,
      contasCorrentes: contasCorrentesFiltradas
    };
  }, [omieData, filtrosPeriodo, filtroArea, omieLoading, filtrarPorPeriodo, filtrarPorArea]);

  // Calcular indicadores baseados nos dados filtrados
  const indicadores: IndicadoresFinanceiros = useMemo(() => {
    if (omieLoading || !dadosFiltrados) {
      return { captado: 0, realizado: 0, saldo: 0 };
    }

    // Se temos dados gerais do Omie (não filtrados), usar eles como base
    const indicadoresBase = omieData?.indicadores || { captado: 0, realizado: 0, saldo: 0 };

    // Se não há filtros aplicados, usar indicadores gerais
    const temFiltros = (filtrosPeriodo?.mes || filtrosPeriodo?.ano !== new Date().getFullYear()) || filtroArea;
    
    if (!temFiltros) {
      return indicadoresBase;
    }

    // Calcular indicadores dos dados filtrados
    const captado = dadosFiltrados.contasReceber.reduce((total: number, conta: any) => {
      const valor = parseFloat(String(conta.valor_documento || conta.valor || 0));
      return total + valor;
    }, 0);

    const realizado = dadosFiltrados.contasPagar.reduce((total: number, conta: any) => {
      const valor = parseFloat(String(conta.valor_documento || conta.valor || 0));
      const status = conta.status_titulo || conta.status || '';
      
      if (status.toLowerCase().includes('pago') || status.toLowerCase().includes('liquidado')) {
        return total + valor;
      }
      return total;
    }, 0);

    const saldo = captado - realizado;

    console.log('📊 [DASHBOARD] Indicadores calculados:', { captado, realizado, saldo });

    return { captado, realizado, saldo };
  }, [dadosFiltrados, omieData, filtrosPeriodo, filtroArea, omieLoading]);

  // Gerar dados do gráfico baseados nos dados filtrados
  const dadosGrafico: DadosGrafico[] = useMemo(() => {
    if (omieLoading || !dadosFiltrados.contasReceber.length && !dadosFiltrados.contasPagar.length) {
      return [];
    }

    const dadosGerados = gerarDadosGrafico(dadosFiltrados.contasReceber, dadosFiltrados.contasPagar);
    
    // Aplicar mascaramento se showData=false
    const dadosComMascara = dadosGerados.map(item => ({
      ...item,
      captado: maskValue(item.captado),
      realizado: maskValue(item.realizado)
    }));
    
    console.log('📈 [DASHBOARD] Dados do gráfico gerados:', showData ? dadosGerados : 'MASCARADO');
    
    return dadosComMascara;
  }, [dadosFiltrados, gerarDadosGrafico, omieLoading, showData, maskValue]);

  // Gerar dados por área para o gráfico de pizza
  const dadosPorArea = useMemo(() => {
    if (omieLoading || !dadosFiltrados.contasReceber.length) {
      return [];
    }

    const areasTotais: Record<string, number> = {};
    
    // Processar contas a receber por projeto/área
    dadosFiltrados.contasReceber.forEach((conta: any) => {
      const area = conta.descricao_projeto || conta.projeto_desc || conta.codigo_projeto || 'Outros';
      const valor = parseFloat(String(conta.valor_documento || conta.valor || 0));
      
      if (areasTotais[area]) {
        areasTotais[area] += valor;
      } else {
        areasTotais[area] = valor;
      }
    });

    // Converter para array de objetos com cores
    const cores = ['#3B82F6', '#10B981', '#FFCC00', '#F59E0B', '#8B5CF6', '#EF4444'];
    const dadosArray = Object.entries(areasTotais)
      .map(([area, valor], index) => ({
        area,
        valor,
        cor: cores[index % cores.length]
      }))
      .sort((a, b) => b.valor - a.valor) // Ordenar por valor decrescente
      .slice(0, 6); // Limitar a 6 áreas principais

    console.log('🍰 [DASHBOARD] Dados por área gerados:', dadosArray);
    
    return dadosArray;
  }, [dadosFiltrados, omieLoading]);

  // Calcular tendências para os indicadores
  const calcularTendencia = (valor: number, valorAnterior: number): { type: 'up' | 'down' | 'stable'; text: string; } | undefined => {
    if (valorAnterior === 0) return undefined;
    const percentual = ((valor - valorAnterior) / valorAnterior) * 100;
    return {
      type: percentual > 0 ? 'up' : percentual < 0 ? 'down' : 'stable',
      text: `${Math.abs(percentual).toFixed(1)}%`
    };
  };

  // Função para mascarar valores sensíveis (usando showData prop)
  const formatarValorPrivado = (valor: number): string => {
    return maskCurrency(valor);
  };

  // Handler para refresh manual
  const handleRefresh = async () => {
    console.log('🔄 [DASHBOARD] Refresh manual solicitado');
    if (onRefresh) {
      onRefresh();
    }
    await refetchOmie();
  };

  // Estado de erro removido - continuando sem exibir erro financeiro

  return (
    <div className={`space-y-6 ${className}`} data-testid="dashboard-financeiro-container">
      {/* Controles de refresh e filtros */}
      {showRefreshControls && (
        <div className="flex items-center justify-between gap-4">
          {/* Filtro de Departamento */}
          {!loadingDepartamentos && departamentos.length > 0 && (
            <div className="flex items-center gap-2 flex-1">
              <Building2 className="w-4 h-4 text-gray-500" />
              <Select
                value={departamentoSelecionado}
                onValueChange={setDepartamentoSelecionado}
              >
                <SelectTrigger className="w-[280px]" data-testid="select-departamento">
                  <SelectValue placeholder="Todos os Departamentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os Departamentos</SelectItem>
                  {departamentos.filter((dep: string) => dep && dep.trim()).map((dep: string) => (
                    <SelectItem key={dep} value={dep}>
                      {dep}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Loading state para departamentos */}
          {loadingDepartamentos && (
            <div className="flex items-center gap-2 flex-1 text-gray-500">
              <Building2 className="w-4 h-4" />
              <span className="text-sm">Carregando departamentos...</span>
            </div>
          )}

          {/* Botão de atualizar */}
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={omieLoading}
            className="border-gray-300 hover:bg-gray-50"
            data-testid="button-refresh"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${omieLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      )}

      {/* Gráficos Financeiros com Dados Consolidados */}
      <FinanceChartCarousel
        dadosConsolidados={dadosConsolidados}
        loading={loadingConsolidado}
        periodoSelecionado={periodoSelecionado}
        onPeriodoChange={setPeriodoSelecionado}
        showData={showData}
      />
    </div>
  );
}