import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Users, GraduationCap, Home, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { ConselhoFilters as ConselhoFiltersType, KpiData } from "@/types/conselho";
import { getAllKpis, calculateDateRange } from "@/services/conselhoService";
import KpiFilters from "./KpiFilters";
import KpiCarousel from "./KpiCarousel";

interface ConselhoKpisSectionProps {
  showData?: boolean;
  externalPeriod?: string; // Período vindo do filtro externo (formato: '2025-08')
}

export interface ConselhoKpisSectionRef {
  refresh: () => Promise<void>;
}

function ConselhoKpisSection({ showData = true, externalPeriod }: ConselhoKpisSectionProps, ref: React.Ref<ConselhoKpisSectionRef>) {
  const { toast } = useToast();
  
  // Debug: Log do período externo recebido
  console.log(`🎯 [CONSELHO KPI] externalPeriod recebido: "${externalPeriod}"`);
  
  // Função helper para mascarar valores
  const maskValue = (value: number | string) => {
    if (showData) return value;
    return '•••';
  };
  
  // Calcular mês anterior ao mês atual (formato: 'YYYY-MM')
  const getMesAnterior = () => {
    const hoje = new Date();
    const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const ano = mesAnterior.getFullYear();
    const mes = String(mesAnterior.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  };

  // Estado dos filtros - inicializar com mês anterior ao mês atual
  const [filters, setFilters] = useState<ConselhoFiltersType>({
    period: 'specific_month',
    specificMonth: getMesAnterior(),
    unitId: null,
    classId: null
  });

  // Calcular mês atual baseado em externalPeriod (prioridade) ou filters.specificMonth
  // Usar useMemo para garantir que recalcula quando as dependências mudam
  const mesFiltro = (() => {
    const src = externalPeriod || filters.specificMonth;
    if (src) {
      const parts = src.split('-');
      if (parts.length >= 2 && parts[1]) return parseInt(parts[1], 10);
      return null; // apenas ano = anual
    }
    return null;
  })();

  // Extrair ano para filtrar indicadores (Favela 3D não aparece em 2026+)
  // Retorna null quando ano não pode ser determinado (fallback mostra indicador)
  const anoFiltro = (() => {
    if (externalPeriod) {
      const [ano] = externalPeriod.split('-');
      return parseInt(ano, 10);
    }
    if (filters.specificMonth) {
      const [ano] = filters.specificMonth.split('-');
      return parseInt(ano, 10);
    }
    // Se período anual ou indefinido, retornar null para mostrar o indicador por segurança
    return null;
  })();
  
  // Só esconder Favela 3D quando ano for explicitamente 2026 ou posterior
  const esconderFavela3D = anoFiltro !== null && anoFiltro >= 2026;

  // Buscar KPIs reais (mesma fonte da Gestão à Vista)
  const { data: kpisFromDb, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/conselho/kpis', externalPeriod, filters.specificMonth, filters.period],
    queryFn: async () => {
      // Calcular URL dentro do queryFn para garantir valor atualizado
      // externalPeriod '2026' = anual; '2026-04' = mensal
      const period = externalPeriod || filters.specificMonth || '2026';
      const parts = period.split('-');
      const anoParam = parts[0];
      const mesParam = parts.length >= 2 ? parts[1] : null;
      const url = mesParam
        ? `/api/conselho/kpis?ano=${anoParam}&mes=${parseInt(mesParam, 10)}`
        : `/api/conselho/kpis?ano=${anoParam}`;
      console.log(`🔍 [CONSELHO KPI] Buscando KPIs: ${url}`);
      const response = await fetch(url);
      return response.json();
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Estado dos dados dos KPIs (usa dados do banco ou fallback para 0)
  const kpiData: KpiData = {
    criancasImpactadas: kpisFromDb?.criancasPec || 0,
    pessoasFormadas: kpisFromDb?.alunosFormados || 0,
    familiasAcompanhadas: kpisFromDb?.familiasAtivas || 0,
    atendimentosMetodoGrito: kpisFromDb?.geracao_renda || 0
  };

  const hasError = isError;

  // Função para atualizar dados dos KPIs
  const fetchKpiData = async (filtersToUse: ConselhoFiltersType = filters) => {
    console.log('🔄 [CONSELHO KPI] Atualizando dados dos KPIs...');
    await refetch();
  };

  // Sincronizar com período externo quando fornecido
  useEffect(() => {
    if (externalPeriod && externalPeriod !== filters.specificMonth) {
      setFilters(prev => ({
        ...prev,
        specificMonth: externalPeriod
      }));
    }
  }, [externalPeriod]);

  // Handler para quando filtros são aplicados
  const handleApplyFilters = (newFilters?: ConselhoFiltersType) => {
    const filtersToUse = newFilters || filters;
    console.log('🎯 [CONSELHO KPI SECTION] handleApplyFilters chamado com filtros:', filtersToUse);
    fetchKpiData(filtersToUse);
  };

  // Handler para tentar novamente em caso de erro
  const handleRetry = () => {
    refetch();
  };

  // Calcular subtitle para os cards - mostrar nome do mês
  const getSubtitle = () => {
    const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const src = externalPeriod || filters.specificMonth;
    if (src) {
      const parts = src.split('-');
      if (parts.length >= 2 && parts[1]) return MESES[parseInt(parts[1], 10) - 1] || 'Período';
      return 'Anual 2026'; // só ano = anual
    }
    return 'Anual 2026';
  };

  // Expor função de refresh via ref
  useImperativeHandle(ref, () => ({
    refresh: async () => {
      await fetchKpiData(filters);
    }
  }));

  // Helper para exibir valores com máscara
  const getDisplayValue = (value: number) => {
    if (!showData) return '•••';
    return value;
  };

  // Definir dados dos cards - CORES CORPORATIVAS DO GRITO
  const kpiCards = [
    {
      title: "Crianças atendidas",
      value: showData ? kpiData.criancasImpactadas : 0,
      displayValue: getDisplayValue(kpiData.criancasImpactadas),
      icon: Users,
      subtitle: getSubtitle(),
      description: "Crianças atendidas no PEC (Polo Esportivo Cultural)",
      color: "#3E8E41" // Verde-folha
    },
    {
      title: "Alunos formados",
      value: showData ? kpiData.pessoasFormadas : 0,
      displayValue: getDisplayValue(kpiData.pessoasFormadas),
      icon: GraduationCap,
      subtitle: getSubtitle(),
      description: "Alunos formados na Inclusão Produtiva (Lab. Vozes do Futuro, 30h, EAD)",
      color: "#FF8C42" // Laranja
    },
    {
      title: "Geração de Renda",
      value: showData ? kpiData.atendimentosMetodoGrito : 0,
      displayValue: getDisplayValue(kpiData.atendimentosMetodoGrito),
      icon: Activity,
      subtitle: getSubtitle(),
      description: "Participantes ativos na Inclusão Produtiva",
      color: "#FFC300" // Amarelo-sol
    },
    {
      title: "Famílias Acompanhadas",
      value: showData ? kpiData.familiasAcompanhadas : 0,
      displayValue: getDisplayValue(kpiData.familiasAcompanhadas),
      icon: Home,
      subtitle: getSubtitle(),
      description: "Famílias acompanhadas pelo Coordenador Psicossocial",
      color: "#7B2CBF" // Roxo
    }
  ];

  return (
    <div className="space-y-4">
      {/* Carrossel de Cards KPI */}
      <KpiCarousel 
        kpiCards={kpiCards}
        isLoading={isLoading}
      />

      {/* Estado de erro com retry */}
      {hasError && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-800 font-medium mb-2">Erro ao carregar os dados</p>
          <p className="text-red-600 text-sm mb-4">
            Não foi possível conectar com o servidor. Verifique sua conexão e tente novamente.
          </p>
          <button
            onClick={handleRetry}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            data-testid="button-retry-kpi"
          >
            Tentar Novamente
          </button>
        </div>
      )}
    </div>
  );
}

export default forwardRef(ConselhoKpisSection);
