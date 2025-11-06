import { useState } from "react";
import { Filter, Calendar, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { FinanceiroFilters as FinanceiroFiltersType } from "@/types/financeiro";
import { calculateFinanceiroDateRange } from "@/services/financeiroService";
import { PROGRAMAS_FINANCEIROS } from "@/types/financeiro";

interface FinanceiroFiltersProps {
  filters: FinanceiroFiltersType;
  onFiltersChange: (filters: FinanceiroFiltersType) => void;
  onApply: () => void;
  isLoading?: boolean;
}

export default function FinanceiroFilters({ 
  filters, 
  onFiltersChange, 
  onApply, 
  isLoading = false 
}: FinanceiroFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePeriodChange = (period: FinanceiroFiltersType['period']) => {
    if (period !== 'custom') {
      const { start, end } = calculateFinanceiroDateRange(period);
      onFiltersChange({
        ...filters,
        period,
        start,
        end
      });
    } else {
      onFiltersChange({
        ...filters,
        period
      });
    }
  };

  const handleEscopoChange = (escopo: FinanceiroFiltersType['escopo']) => {
    onFiltersChange({
      ...filters,
      escopo,
      id: escopo === 'geral' ? undefined : filters.id
    });
  };

  const handleProgramaChange = (id: string) => {
    onFiltersChange({
      ...filters,
      id: id === 'all' ? undefined : id
    });
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
      case 'mensal': return 'Mensal';
      case 'trimestral': return 'Trimestral';
      case 'semestral': return 'Semestral';
      case 'anual': return 'Anual';
      case 'custom': return 'Personalizado';
      default: return 'Período';
    }
  };

  const getEscopoLabel = () => {
    switch (filters.escopo) {
      case 'geral': return 'Geral';
      case 'programa': return 'Programa';
      case 'projeto': return 'Projeto';
      default: return 'Escopo';
    }
  };

  const getProgramaLabel = () => {
    if (!filters.id) return 'Todos';
    const programa = PROGRAMAS_FINANCEIROS.find(p => p.value === filters.id);
    return programa?.label || filters.id;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm" data-testid="financeiro-filters">
      {/* Filtro compacto sempre visível */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtros Financeiros</span>
          
          {/* Período selecionado */}
          <Select 
            value={filters.period} 
            onValueChange={handlePeriodChange}
            disabled={isLoading}
          >
            <SelectTrigger className="w-32 h-8 text-xs" data-testid="select-period">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="trimestral">Trimestral</SelectItem>
              <SelectItem value="semestral">Semestral</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {/* Escopo */}
          <Select 
            value={filters.escopo} 
            onValueChange={handleEscopoChange}
            disabled={isLoading}
          >
            <SelectTrigger className="w-24 h-8 text-xs" data-testid="select-escopo">
              <SelectValue placeholder="Escopo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="geral">Geral</SelectItem>
              <SelectItem value="programa">Programa</SelectItem>
              <SelectItem value="projeto">Projeto</SelectItem>
            </SelectContent>
          </Select>

          {/* Programa (só aparece se escopo for programa ou projeto) */}
          {(filters.escopo === 'programa' || filters.escopo === 'projeto') && (
            <Select 
              value={filters.id || 'all'} 
              onValueChange={handleProgramaChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-28 h-8 text-xs" data-testid="select-programa">
                <SelectValue placeholder="Programa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {PROGRAMAS_FINANCEIROS.map((programa) => (
                  <SelectItem key={programa.value} value={programa.value}>
                    {programa.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Badges com filtros ativos */}
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              {getPeriodLabel()}
            </Badge>
            
            {filters.escopo !== 'geral' && (
              <Badge variant="outline" className="text-xs">
                <Building className="w-3 h-3 mr-1" />
                {getEscopoLabel()}
                {filters.id && `: ${getProgramaLabel()}`}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Data range indicator */}
          {formatDateRange() && (
            <span className="text-xs text-gray-500">
              {formatDateRange()}
            </span>
          )}
          
          {/* Aplicar e Limpar buttons */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const { start, end } = calculateFinanceiroDateRange('mensal');
                onFiltersChange({
                  period: 'mensal',
                  start,
                  end,
                  escopo: 'geral',
                  id: undefined
                });
                onApply();
              }}
              disabled={isLoading}
              className="h-8 px-3 text-xs text-gray-500 hover:text-gray-700"
              data-testid="button-limpar"
            >
              Limpar
            </Button>
            
            <Button 
              size="sm" 
              onClick={onApply}
              disabled={isLoading}
              className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700"
              data-testid="button-aplicar"
            >
              {isLoading ? "Carregando..." : "Aplicar"}
            </Button>
          </div>
        </div>
      </div>

      {/* Expandir filtros para custom date range (futuro) */}
      {filters.period === 'custom' && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Período personalizado:</span>
            <input
              type="date"
              value={filters.start || ''}
              onChange={(e) => onFiltersChange({ ...filters, start: e.target.value })}
              className="text-xs border border-gray-300 rounded px-2 py-1"
              data-testid="input-start-date"
            />
            <span className="text-gray-400">até</span>
            <input
              type="date"
              value={filters.end || ''}
              onChange={(e) => onFiltersChange({ ...filters, end: e.target.value })}
              className="text-xs border border-gray-300 rounded px-2 py-1"
              data-testid="input-end-date"
            />
          </div>
        </div>
      )}

      {/* Status dos filtros aplicados */}
      {(filters.start || filters.end || filters.escopo !== 'geral') && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            Filtros ativos: {getPeriodLabel()}
            {formatDateRange() && ` • ${formatDateRange()}`}
            {filters.escopo !== 'geral' && ` • ${getEscopoLabel()}`}
            {filters.id && ` • ${getProgramaLabel()}`}
          </span>
        </div>
      )}
    </div>
  );
}