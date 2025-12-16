import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";

import FinanceiroFilters from "./FinanceiroFilters";
import FinanceiroCarousel from "./FinanceiroCarousel";
import FinanceiroChartMain from "./FinanceiroChartMain";
import FinanceiroSideCard from "./FinanceiroSideCard";
import CreditCardDisplay from "./CreditCardDisplay";

import type { FinanceiroFilters as FinanceiroFiltersType, FinanceiroData } from "@/types/financeiro";
import { getAllFinanceiroData, calculateFinanceiroDateRange } from "@/services/financeiroService";
import { queryClient } from "@/lib/queryClient";
import { useUserData } from "@/hooks/useUserData";

interface ConselhoFinanceiroSectionProps {
  className?: string;
}

export default function ConselhoFinanceiroSection({ className = "" }: ConselhoFinanceiroSectionProps) {
  const { userData } = useUserData();
  const userId = localStorage.getItem("userId");
  
  // Estado dos filtros
  const [filters, setFilters] = useState<FinanceiroFiltersType>(() => {
    const { start, end } = calculateFinanceiroDateRange('mensal');
    return {
      period: 'mensal',
      start,
      end,
      escopo: 'geral'
    };
  });

  const [appliedFilters, setAppliedFilters] = useState<FinanceiroFiltersType>(filters);

  // Query para buscar dados do doador do usuário logado
  const { data: donorData } = useQuery<any>({
    queryKey: ['donor', userId],
    queryFn: async () => {
      if (!userId) return null;
      const res = await fetch(`/api/users/${userId}/donor`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!userId,
  });

  // Query para buscar dados financeiros
  const { 
    data: financeiroData, 
    isLoading, 
    error,
    refetch
  } = useQuery<FinanceiroData>({
    queryKey: ['financeiro', appliedFilters],
    queryFn: () => getAllFinanceiroData(appliedFilters),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 30 * 1000, // 30 segundos
  });

  // Handlers
  const handleFiltersChange = useCallback((newFilters: FinanceiroFiltersType) => {
    setFilters(newFilters);
  }, []);

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters(filters);
  }, [filters]);

  const handleRefresh = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['financeiro'] });
      await refetch();
    } catch (error) {
      console.error('Erro ao atualizar dados financeiros:', error);
    }
  }, [refetch]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`space-y-6 ${className}`}
      data-testid="conselho-financeiro-section"
    >
      {/* Header da seção */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quadro Financeiro</h2>
          <p className="text-gray-600 text-sm mt-1">
            Acompanhe o desempenho financeiro dos programas
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2"
          data-testid="button-refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Filtros */}
      <FinanceiroFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onApply={handleApplyFilters}
        isLoading={isLoading}
      />

      {/* Cartão de Crédito */}
      <div className="max-w-md mx-auto">
        <CreditCardDisplay 
          userName={userData?.nome || "—"}
          donorId={donorData?.id}
        />
      </div>

      {/* Erro */}
      {error && (
        <Alert variant="destructive" data-testid="error-alert">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Erro ao carregar dados financeiros: {error.message}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="ml-4"
              data-testid="button-retry"
            >
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Informações adicionais */}
      {financeiroData?.lastUpdated && !isLoading && (
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Última atualização: {new Date(financeiroData.lastUpdated).toLocaleString('pt-BR')}
          </p>
        </div>
      )}
    </motion.section>
  );
}