import { useState } from "react";
import { Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { ConselhoFilters as ConselhoFiltersType } from "@/types/conselho";
import { calculateDateRange } from "@/services/conselhoService";

interface KpiFiltersProps {
  filters: ConselhoFiltersType;
  onFiltersChange: (filters: ConselhoFiltersType) => void;
  onApply: (newFilters?: ConselhoFiltersType) => void;
  isLoading?: boolean;
}

export default function KpiFilters({ 
  filters, 
  onFiltersChange, 
  onApply, 
  isLoading = false 
}: KpiFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePeriodChange = (period: ConselhoFiltersType['period']) => {
    console.log(`🔄 [FILTERS] Período alterado para: ${period}`);
    
    let newFilters: ConselhoFiltersType;
    
    if (period === 'specific_month') {
      // Para mês específico, começar com janeiro de 2025
      newFilters = {
        ...filters,
        period,
        specificMonth: '2025-01',
        start: undefined,
        end: undefined
      };
    } else {
      // Para outros períodos, calcular start/end
      const { start, end } = calculateDateRange(period);
      newFilters = {
        ...filters,
        period,
        specificMonth: undefined,
        start,
        end
      };
    }
    
    onFiltersChange(newFilters);
    console.log(`🎯 [FILTERS] Aplicando filtros automaticamente:`, newFilters);
    onApply(newFilters);
  };

  const formatDateRange = () => {
    if (!filters.start || !filters.end) return '';
    
    const startDate = new Date(filters.start);
    const endDate = new Date(filters.end);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    };
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const getPeriodLabel = () => {
    switch (filters.period) {
      case 'specific_month': return filters.specificMonth ? 
        new Date(filters.specificMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 
        'Mês Específico';
      case 'mensal': return 'Mensal (Atual)';
      case 'trimestral': return 'Trimestral';
      case 'semestral': return 'Semestral';
      case 'anual': return 'Anual';
      case 'custom': return 'Personalizado';
      default: return 'Período';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      {/* Filtro compacto sempre visível */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtros dos KPIs</span>
          
          {/* Período selecionado */}
          <Select 
            value={filters.period} 
            onValueChange={handlePeriodChange}
            disabled={isLoading}
          >
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="specific_month">Mês Específico</SelectItem>
              <SelectItem value="mensal">Mensal (Atual)</SelectItem>
              <SelectItem value="trimestral">Trimestral</SelectItem>
              <SelectItem value="semestral">Semestral</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
            </SelectContent>
          </Select>

          {/* Badge informativo - Filtro de período agora via ícone de funil */}
          {filters.period === 'specific_month' && (
            <span className="text-xs text-gray-500">
              Use o ícone de funil para selecionar o mês
            </span>
          )}

          {/* Badge com período ativo */}
          <Badge variant="secondary" className="text-xs">
            <Calendar className="w-3 h-3 mr-1" />
            {getPeriodLabel()}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Data range indicator */}
          {formatDateRange() && (
            <span className="text-xs text-gray-500">
              {formatDateRange()}
            </span>
          )}
          
          {/* Aplicar button */}
          <Button 
            size="sm" 
            onClick={() => onApply()}
            disabled={isLoading}
            className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700"
          >
            {isLoading ? "Carregando..." : "Aplicar"}
          </Button>
        </div>
      </div>

      {/* Status dos filtros aplicados */}
      {(filters.start || filters.end) && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Filtros ativos: {getPeriodLabel()}
              {formatDateRange() && ` • ${formatDateRange()}`}
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const { start, end } = calculateDateRange('mensal');
                const resetFilters = {
                  period: 'mensal' as const,
                  start,
                  end,
                  specificMonth: undefined,
                  unitId: null,
                  classId: null
                };
                onFiltersChange(resetFilters);
                onApply(resetFilters);
              }}
              className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
            >
              Limpar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}