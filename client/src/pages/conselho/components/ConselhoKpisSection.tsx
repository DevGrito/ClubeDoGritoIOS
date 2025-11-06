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

  // Buscar KPIs reais do banco de dados
  const { data: kpisFromDb, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/conselho/kpis'],
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Estado dos dados dos KPIs (usa dados do banco ou fallback para 0)
  const kpiData: KpiData = {
    criancasImpactadas: kpisFromDb?.criancasPec || 0,
    pessoasFormadas: kpisFromDb?.alunosFormados || 0,
    familiasAcompanhadas: kpisFromDb?.familiasAtivas || 0,
    atendimentosMetodoGrito: kpisFromDb?.empregabilidade || 0
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
    if (filters.specificMonth) {
      // Converter formato 'YYYY-MM' para nome do mês
      const [ano, mes] = filters.specificMonth.split('-');
      const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      const mesIndex = parseInt(mes, 10) - 1;
      return meses[mesIndex] || 'Período';
    }
    
    // Fallback para outros tipos de período
    switch (filters.period) {
      case 'trimestral':
        return 'Trimestre';
      case 'semestral':
        return 'Semestre';
      case 'anual':
        return 'Ano';
      default:
        return 'Período';
    }
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
      title: "Empregabilidade",
      value: showData ? kpiData.atendimentosMetodoGrito : 0,
      displayValue: getDisplayValue(kpiData.atendimentosMetodoGrito),
      icon: Activity,
      subtitle: getSubtitle(),
      description: "Participantes ativos na Inclusão Produtiva",
      color: "#FFC300" // Amarelo-sol
    },
    {
      title: "Famílias Ativas da F3D",
      value: showData ? kpiData.familiasAcompanhadas : 0,
      displayValue: getDisplayValue(kpiData.familiasAcompanhadas),
      icon: Home,
      subtitle: getSubtitle(),
      description: "Famílias ativas no projeto Favela 3D (Psicossocial)",
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
