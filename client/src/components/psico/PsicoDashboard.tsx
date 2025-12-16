import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Users,
  Clock,
  TrendingUp,
  FileText,
  AlertTriangle,
  Heart,
  Eye,
  Download,
  RefreshCw,
  Calendar,
  Filter
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

interface PsicoDashboardProps {
  familias?: any[];
  casos?: any[];
  atendimentos?: any[];
  encaminhamentos?: any[];
  participantes?: any[];
  onViewDetails?: (caso: any) => void;
  onExportCSV?: (data: any[], filename: string) => void;
}

export default function PsicoDashboard({
  familias = [],
  casos = [],
  atendimentos = [],
  encaminhamentos = [],
  participantes = [],
  onViewDetails,
  onExportCSV
}: PsicoDashboardProps) {
  const [filters, setFilters] = useState({
    dataInicio: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0],
    programa: 'todos',
    status: 'todos'
  });

  // Função para aplicar filtros
  const applyFilters = (data: any[], type: 'atendimentos' | 'casos' | 'familias' | 'encaminhamentos') => {
    let filtered = [...data];

    // Filtro de data
    if (type === 'atendimentos' && filters.dataInicio && filters.dataFim) {
      filtered = filtered.filter((item: any) => {
        const dataAtendimento = new Date(item.dataAtendimento || item.created_at);
        return dataAtendimento >= new Date(filters.dataInicio) && dataAtendimento <= new Date(filters.dataFim);
      });
    }

    if (type === 'casos' && filters.dataInicio && filters.dataFim) {
      filtered = filtered.filter((item: any) => {
        const dataCriacao = new Date(item.created_at);
        return dataCriacao >= new Date(filters.dataInicio) && dataCriacao <= new Date(filters.dataFim);
      });
    }

    // Filtro de status
    if (filters.status !== 'todos') {
      filtered = filtered.filter((item: any) => item.status === filters.status);
    }

    return filtered;
  };

  // Dados filtrados
  const atendimentosFiltrados = useMemo(() => applyFilters(atendimentos, 'atendimentos'), [atendimentos, filters]);
  const casosFiltrados = useMemo(() => applyFilters(casos, 'casos'), [casos, filters]);
  const familiasFiltradas = useMemo(() => applyFilters(familias, 'familias'), [familias, filters]);
  const encaminhamentosFiltrados = useMemo(() => applyFilters(encaminhamentos, 'encaminhamentos'), [encaminhamentos, filters]);

  // Filtrar participantes por programa
  const participantesFiltrados = useMemo(() => {
    if (filters.programa === 'todos') return participantes;
    return participantes.filter((p: any) => {
      if (filters.programa === 'pec') {
        return p.tipo === 'pec' || p.programaTipo === 'pec';
      } else if (filters.programa === 'inclusao') {
        return p.tipo === 'inclusao' || p.programaTipo === 'inclusao';
      }
      return true;
    });
  }, [participantes, filters.programa]);

  // KPIs calculados - Considerar filtro de programa
  const kpis = useMemo(() => {
    // Total de atendimentos (todos os registros, não apenas filtrados)
    const atendimentosNoPeriodo = atendimentos.length;
    
    // Casos ativos (todos os casos com status ativo, independente do filtro)
    const casosAtivos = casos.filter((c: any) => 
      c.status === 'aberto' || c.status === 'em_atendimento' || c.status === 'em_acompanhamento'
    ).length;

    // Novos casos (todos os casos cadastrados)
    const novosCasos = casos.length;

    // Total de famílias cadastradas
    const totalFamilias = familias.length;

    // Total de participantes vinculados (filtrado por programa)
    const totalParticipantes = participantesFiltrados.length;

    // Visitas domiciliares realizadas
    const visitasDomiciliares = atendimentos.filter((a: any) => 
      a.tipo === 'visita_domiciliar'
    ).length;

    // Tempo médio até primeiro atendimento (em dias)
    let tempoMedio = 0;
    if (casos.length > 0 && atendimentos.length > 0) {
      const tempos = casos.map((caso: any) => {
        const primeiroAtendimento = atendimentos
          .filter((a: any) => a.casoId === caso.id)
          .sort((a: any, b: any) => new Date(a.dataAtendimento).getTime() - new Date(b.dataAtendimento).getTime())[0];

        if (primeiroAtendimento) {
          const diasDiff = Math.floor(
            (new Date(primeiroAtendimento.dataAtendimento).getTime() - new Date(caso.dataAbertura || caso.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          return diasDiff >= 0 ? diasDiff : 0;
        }
        return 0;
      });

      const temposValidos = tempos.filter((t: number) => t > 0);
      tempoMedio = temposValidos.length > 0 
        ? Math.round(temposValidos.reduce((a: number, b: number) => a + b, 0) / temposValidos.length)
        : 0;
    }

    const encaminhamentosExternos = encaminhamentos.length;

    return {
      atendimentosNoPeriodo,
      casosAtivos,
      novosCasos,
      tempoMedio,
      encaminhamentosExternos,
      totalFamilias,
      totalParticipantes,
      visitasDomiciliares,
      nps: 0 // Placeholder - implementar se houver dados de satisfação
    };
  }, [atendimentos, casos, familias, participantesFiltrados, encaminhamentos]);

  // Dados para gráfico de evolução semanal
  const weeklyData = useMemo(() => {
    const weeks: { [key: string]: number } = {};
    const startDate = new Date(filters.dataInicio);
    const endDate = new Date(filters.dataFim);

    // Criar semanas
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
      const weekLabel = `Sem ${Math.ceil((d.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1}`;
      weeks[weekLabel] = 0;
    }

    // Contar atendimentos por semana
    atendimentosFiltrados.forEach((atendimento: any) => {
      const dataAtendimento = new Date(atendimento.dataAtendimento || atendimento.created_at);
      const weeksDiff = Math.floor((dataAtendimento.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const weekLabel = `Sem ${weeksDiff + 1}`;
      if (weeks[weekLabel] !== undefined) {
        weeks[weekLabel]++;
      }
    });

    return Object.entries(weeks).map(([semana, atendimentos]) => ({
      semana,
      atendimentos
    })).slice(0, 12); // Últimas 12 semanas
  }, [atendimentosFiltrados, filters.dataInicio, filters.dataFim]);

  // Dados para gráfico de distribuição por tipo/status
  const distributionData = useMemo(() => {
    const tipos = ['individual', 'familiar', 'grupo', 'visita_domiciliar'];
    const statuses = ['ativo', 'em_acompanhamento', 'encaminhado', 'concluido'];

    return tipos.map(tipo => {
      const atendimentosTipo = atendimentosFiltrados.filter((a: any) => a.tipo === tipo);
      const result: any = { tipo: tipo.replace('_', ' ').toUpperCase() };

      statuses.forEach(status => {
        const count = atendimentosTipo.filter((a: any) => {
          // Verificar status do caso relacionado
          const caso = casosFiltrados.find((c: any) => c.id === a.casoId);
          return caso?.status === status;
        }).length;
        result[status] = count;
      });

      return result;
    });
  }, [atendimentosFiltrados, casosFiltrados]);

  // Casos de alto risco
  const casosAltoRisco = useMemo(() => {
    return casosFiltrados
      .filter((caso: any) => caso.prioridade === 'alta' || caso.prioridade === 'urgente')
      .sort((a: any, b: any) => {
        const prioridadeOrdem: any = { urgente: 4, alta: 3, media: 2, baixa: 1 };
        return (prioridadeOrdem[b.prioridade] || 0) - (prioridadeOrdem[a.prioridade] || 0);
      })
      .slice(0, 10)
      .map((caso: any) => {
        const familia = familiasFiltradas.find((f: any) => f.id === caso.familiaId);
        const atendimentosCaso = atendimentosFiltrados.filter((a: any) => a.casoId === caso.id);
        const diasAcompanhamento = Math.floor(
          (new Date().getTime() - new Date(caso.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          ...caso,
          nomeResponsavel: familia?.nomeResponsavel || 'Não vinculado',
          profissional: atendimentosCaso[atendimentosCaso.length - 1]?.profissionalResponsavel || '-',
          diasAcompanhamento
        };
      });
  }, [casosFiltrados, familiasFiltradas, atendimentosFiltrados]);

  const handleClearFilters = () => {
    setFilters({
      dataInicio: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      dataFim: new Date().toISOString().split('T')[0],
      programa: 'todos',
      status: 'todos'
    });
  };

  const handleExportAltoRisco = () => {
    if (onExportCSV) {
      const csvData = casosAltoRisco.map(caso => ({
        Título: caso.titulo,
        Responsável: caso.nomeResponsavel,
        Profissional: caso.profissional,
        Prioridade: caso.prioridade,
        Status: caso.status,
        'Dias em Acompanhamento': caso.diasAcompanhamento
      }));
      onExportCSV(csvData, 'casos-alto-risco.csv');
    }
  };

  return (
    <div className="space-y-6" data-testid="psico-dashboard">
      {/* Filtros Globais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5 text-purple-500" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data-inicio" data-testid="label-data-inicio">Data Início</Label>
              <Input
                id="data-inicio"
                type="date"
                value={filters.dataInicio}
                onChange={(e) => setFilters({...filters, dataInicio: e.target.value})}
                data-testid="input-data-inicio"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data-fim" data-testid="label-data-fim">Data Fim</Label>
              <Input
                id="data-fim"
                type="date"
                value={filters.dataFim}
                onChange={(e) => setFilters({...filters, dataFim: e.target.value})}
                data-testid="input-data-fim"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="programa" data-testid="label-programa">Programa</Label>
              <Select value={filters.programa} onValueChange={(value) => setFilters({...filters, programa: value})}>
                <SelectTrigger id="programa" data-testid="select-programa">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pec">PEC (Esporte e Cultura)</SelectItem>
                  <SelectItem value="inclusao">Inclusão Produtiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" data-testid="label-status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger id="status" data-testid="select-status">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="em_acompanhamento">Em Acompanhamento</SelectItem>
                  <SelectItem value="encaminhado">Encaminhado</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              data-testid="button-clear-filters"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card data-testid="kpi-atendimentos">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Atendimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-8 h-8 text-blue-500" />
              <div className="text-2xl font-bold">{kpis.atendimentosNoPeriodo}</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">no período</p>
          </CardContent>
        </Card>

        <Card data-testid="kpi-casos-ativos">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Casos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="w-8 h-8 text-green-500" />
              <div className="text-2xl font-bold">{kpis.casosAtivos}</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">em acompanhamento</p>
          </CardContent>
        </Card>

        <Card data-testid="kpi-novos-casos">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Novos Casos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              <div className="text-2xl font-bold">{kpis.novosCasos}</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">abertos</p>
          </CardContent>
        </Card>

        <Card data-testid="kpi-tempo-medio">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tempo Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-8 h-8 text-orange-500" />
              <div className="text-2xl font-bold">{kpis.tempoMedio}</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">dias até 1º atend.</p>
          </CardContent>
        </Card>

        <Card data-testid="kpi-encaminhamentos">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Encaminhamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="w-8 h-8 text-indigo-500" />
              <div className="text-2xl font-bold">{kpis.encaminhamentosExternos}</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">externos</p>
          </CardContent>
        </Card>

        <Card data-testid="kpi-satisfacao">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Satisfação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Heart className="w-8 h-8 text-pink-500" />
              <div className="text-2xl font-bold">{kpis.nps || '-'}</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">NPS/Score</p>
          </CardContent>
        </Card>

        <Card data-testid="kpi-familias">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Famílias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-8 h-8 text-teal-500" />
              <div className="text-2xl font-bold">{kpis.totalFamilias}</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">cadastradas</p>
          </CardContent>
        </Card>

        <Card data-testid="kpi-atendidos">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Atendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-8 h-8 text-cyan-500" />
              <div className="text-2xl font-bold">{kpis.totalParticipantes}</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">participantes</p>
          </CardContent>
        </Card>

        <Card data-testid="kpi-visitas">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Visitas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="w-8 h-8 text-amber-500" />
              <div className="text-2xl font-bold">{kpis.visitasDomiciliares}</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">domiciliares</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico: Evolução Semanal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evolução Semanal de Atendimentos</CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="semana" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="atendimentos" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Atendimentos"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              Sem dados para o período selecionado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
