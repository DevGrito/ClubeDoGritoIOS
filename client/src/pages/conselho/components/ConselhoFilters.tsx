import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, RotateCcw } from "lucide-react";
import type { ConselhoFilters } from "@/types/conselho";
import { calculateDateRange } from "@/services/conselhoService";

interface ConselhoFiltersProps {
  filters: ConselhoFilters;
  onFiltersChange: (filters: ConselhoFilters) => void;
  onApply: () => void;
  isLoading?: boolean;
}

// Mock data para unidades e turmas - substituir por dados reais
const MOCK_UNITS = [
  { id: "pec-1", name: "PEC - Unidade Centro", type: "pec" },
  { id: "pec-2", name: "PEC - Unidade Norte", type: "pec" },
  { id: "inclusao-1", name: "Inclusão Produtiva - Sede", type: "inclusao" }
];

const MOCK_CLASSES = [
  { id: "class-1", name: "Turma A - Manhã", unitId: "pec-1" },
  { id: "class-2", name: "Turma B - Tarde", unitId: "pec-1" },
  { id: "class-3", name: "Turma C - Manhã", unitId: "pec-2" },
  { id: "class-4", name: "LEB - Turma 1", unitId: "inclusao-1" },
  { id: "class-5", name: "Curso 30h - Turma 2", unitId: "inclusao-1" }
];

export default function ConselhoFilters({ 
  filters, 
  onFiltersChange, 
  onApply, 
  isLoading = false 
}: ConselhoFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ConselhoFilters>(filters);
  const [availableClasses, setAvailableClasses] = useState(MOCK_CLASSES);

  // Atualizar filtros locais quando props mudarem
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Filtrar turmas baseado na unidade selecionada
  useEffect(() => {
    if (localFilters.unitId) {
      setAvailableClasses(MOCK_CLASSES.filter(c => c.unitId === localFilters.unitId));
      // Limpar turma se não pertence à unidade selecionada
      if (localFilters.classId && !MOCK_CLASSES.find(c => c.id === localFilters.classId && c.unitId === localFilters.unitId)) {
        setLocalFilters(prev => ({ ...prev, classId: null }));
      }
    } else {
      setAvailableClasses(MOCK_CLASSES);
      setLocalFilters(prev => ({ ...prev, classId: null }));
    }
  }, [localFilters.unitId]);

  const handlePeriodChange = (period: ConselhoFilters['period']) => {
    const newFilters = { ...localFilters, period };
    
    // Auto-calcular datas para períodos pré-definidos
    if (period !== 'custom') {
      const { start, end } = calculateDateRange(period);
      newFilters.start = start;
      newFilters.end = end;
    }
    
    setLocalFilters(newFilters);
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value,
      period: 'custom' // Automaticamente mudar para custom quando datas são editadas
    }));
  };

  const handleClear = () => {
    const defaultFilters: ConselhoFilters = {
      period: 'mensal',
      unitId: null,
      classId: null
    };
    
    const { start, end } = calculateDateRange('mensal');
    defaultFilters.start = start;
    defaultFilters.end = end;
    
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApply();
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="w-5 h-5" />
          Filtros dos KPIs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Período */}
          <div className="space-y-2">
            <Label htmlFor="period">Período</Label>
            <Select 
              value={localFilters.period} 
              onValueChange={handlePeriodChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="semestral">Semestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Escopo - Unidade */}
          <div className="space-y-2">
            <Label htmlFor="unit">Unidade/Polo</Label>
            <Select 
              value={localFilters.unitId || "geral"} 
              onValueChange={(value) => setLocalFilters(prev => ({ 
                ...prev, 
                unitId: value === "geral" ? null : value 
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escopo geral" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="geral">Geral</SelectItem>
                {MOCK_UNITS.map(unit => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Turma (apenas se unidade selecionada) */}
          <div className="space-y-2">
            <Label htmlFor="class">Turma</Label>
            <Select 
              value={localFilters.classId || "todas"} 
              onValueChange={(value) => setLocalFilters(prev => ({ 
                ...prev, 
                classId: value === "todas" ? null : value 
              }))}
              disabled={!localFilters.unitId}
            >
              <SelectTrigger>
                <SelectValue placeholder={localFilters.unitId ? "Todas as turmas" : "Selecione unidade"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as turmas</SelectItem>
                {availableClasses.map(class_ => (
                  <SelectItem key={class_.id} value={class_.id}>
                    {class_.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botões */}
          <div className="space-y-2">
            <Label className="opacity-0">Ações</Label>
            <div className="flex gap-2">
              <Button 
                onClick={handleApply}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? "Aplicando..." : "Aplicar"}
              </Button>
              <Button 
                onClick={handleClear}
                variant="outline"
                size="icon"
                disabled={isLoading}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Datas personalizadas (apenas para period: custom) */}
        {localFilters.period === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="start-date">Data Inicial</Label>
              <Input
                id="start-date"
                type="date"
                value={localFilters.start || ''}
                onChange={(e) => handleDateChange('start', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Data Final</Label>
              <Input
                id="end-date"
                type="date"
                value={localFilters.end || ''}
                onChange={(e) => handleDateChange('end', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Resumo dos filtros aplicados */}
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <strong>Filtros ativos:</strong> {localFilters.period.charAt(0).toUpperCase() + localFilters.period.slice(1)}
          {localFilters.unitId && ` • ${MOCK_UNITS.find(u => u.id === localFilters.unitId)?.name}`}
          {localFilters.classId && ` • ${MOCK_CLASSES.find(c => c.id === localFilters.classId)?.name}`}
          {localFilters.start && localFilters.end && ` • ${new Date(localFilters.start).toLocaleDateString('pt-BR')} a ${new Date(localFilters.end).toLocaleDateString('pt-BR')}`}
        </div>
      </CardContent>
    </Card>
  );
}