import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Filter, BarChart3 } from "lucide-react";
import { PeriodosDisponiveis, FiltrosPeriodo } from "@/hooks/useOmieData";

/**
 * Interface para propriedades do componente FiltrosDinamicos
 */
interface FiltrosDinamicosProps {
  /** Períodos disponíveis extraídos dinamicamente dos dados reais */
  periodosDisponiveis: PeriodosDisponiveis;
  /** Filtros atualmente aplicados */
  filtrosAtuais: FiltrosPeriodo;
  /** Callback para atualização dos filtros de período */
  onFiltrosChange: (filtros: FiltrosPeriodo) => void;
  /** Se deve mostrar estatísticas dos períodos */
  mostrarEstatisticas?: boolean;
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Componente de filtros dinâmicos baseados em dados reais do Omie
 * 
 * Funcionalidades:
 * - Seletores de ano e mês populados dinamicamente
 * - Apenas períodos com dados reais são exibidos
 * - Indicadores visuais de quantidade de registros por período
 * - Filtro inteligente baseado nos dados carregados
 */
export default function FiltrosDinamicos({
  periodosDisponiveis,
  filtrosAtuais,
  onFiltrosChange,
  mostrarEstatisticas = true,
  className = ''
}: FiltrosDinamicosProps) {
  
  console.log('🎛️ [FILTROS] Renderizando filtros dinâmicos:', {
    totalPeriodos: periodosDisponiveis?.periodos?.length || 0,
    anosDisponiveis: periodosDisponiveis?.anos?.length || 0,
    filtrosAtuais
  });

  // Calcular estatísticas dos filtros aplicados
  const estatisticasFiltros = useMemo(() => {
    if (!periodosDisponiveis?.periodos?.length) {
      return {
        totalRegistros: 0,
        totalReceber: 0,
        totalPagar: 0,
        periodosFiltrados: 0,
        descricaoFiltro: 'Carregando períodos...'
      };
    }

    if (!filtrosAtuais.ano && !filtrosAtuais.mes) {
      // Sem filtros - contar todos os registros
      const totalRegistros = periodosDisponiveis.periodos.reduce((total, periodo) => 
        total + periodo.totalRegistros, 0
      );
      
      return {
        totalRegistros,
        totalReceber: periodosDisponiveis.periodos.reduce((total, periodo) => 
          total + periodo.countReceber, 0
        ),
        totalPagar: periodosDisponiveis.periodos.reduce((total, periodo) => 
          total + periodo.countPagar, 0
        ),
        periodosFiltrados: periodosDisponiveis.periodos.length,
        descricaoFiltro: 'Todos os períodos'
      };
    }

    // Com filtros aplicados
    const periodosFiltrados = periodosDisponiveis.periodos.filter(periodo => {
      if (filtrosAtuais.ano && periodo.ano !== filtrosAtuais.ano) return false;
      if (filtrosAtuais.mes && periodo.mes !== filtrosAtuais.mes) return false;
      return true;
    });

    const totalRegistros = periodosFiltrados.reduce((total, periodo) => 
      total + periodo.totalRegistros, 0
    );

    let descricaoFiltro = '';
    if (filtrosAtuais.ano && filtrosAtuais.mes) {
      const nomesMeses = [
        '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      descricaoFiltro = `${nomesMeses[filtrosAtuais.mes]}/${filtrosAtuais.ano}`;
    } else if (filtrosAtuais.ano) {
      descricaoFiltro = `Ano ${filtrosAtuais.ano}`;
    } else if (filtrosAtuais.mes) {
      const nomesMeses = [
        '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      descricaoFiltro = `Mês ${nomesMeses[filtrosAtuais.mes]}`;
    }

    return {
      totalRegistros,
      totalReceber: periodosFiltrados.reduce((total, periodo) => 
        total + periodo.countReceber, 0
      ),
      totalPagar: periodosFiltrados.reduce((total, periodo) => 
        total + periodo.countPagar, 0
      ),
      periodosFiltrados: periodosFiltrados.length,
      descricaoFiltro
    };
  }, [periodosDisponiveis?.periodos, filtrosAtuais]);

  // Handler para mudança no filtro de ano
  const handleAnoChange = (anoStr: string) => {
    const novoAno = anoStr === 'todos' ? new Date().getFullYear() : parseInt(anoStr);
    const novosFiltros = {
      ano: novoAno,
      mes: filtrosAtuais.mes // Manter filtro de mês atual
    };
    
    console.log('📅 [FILTROS] Mudando ano:', { de: filtrosAtuais.ano, para: novoAno });
    onFiltrosChange(novosFiltros);
  };

  // Handler para mudança no filtro de mês
  const handleMesChange = (mesStr: string) => {
    const novoMes = mesStr === 'todos' ? null : parseInt(mesStr);
    const novosFiltros = {
      ano: filtrosAtuais.ano, // Manter filtro de ano atual
      mes: novoMes
    };
    
    console.log('📅 [FILTROS] Mudando mês:', { de: filtrosAtuais.mes, para: novoMes });
    onFiltrosChange(novosFiltros);
  };

  // Handler para limpar todos os filtros
  const limparFiltros = () => {
    console.log('🧹 [FILTROS] Limpando todos os filtros');
    onFiltrosChange({ ano: new Date().getFullYear(), mes: null });
  };

  // Se não há períodos disponíveis, mostrar estado vazio
  if (!periodosDisponiveis?.periodos?.length) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`} data-testid="filtros-dinamicos-vazio">
        <div className="flex items-center gap-2 text-gray-500">
          <Filter className="w-4 h-4" />
          <span>Aguardando dados para exibir filtros...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 space-y-4 ${className}`} data-testid="filtros-dinamicos-container">
      {/* Header dos filtros */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Filtros por Período</h3>
          <Badge variant="secondary" className="text-xs">
            Baseado em dados reais
          </Badge>
        </div>
        
        {/* Botão para limpar filtros */}
        {(filtrosAtuais.ano || filtrosAtuais.mes) && (
          <button
            onClick={limparFiltros}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
            data-testid="botao-limpar-filtros"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Seletores de filtro */}
      <div className="grid grid-cols-2 gap-4">
        {/* Seletor de Ano */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Ano</label>
          <Select 
            value={filtrosAtuais.ano?.toString() || 'todos'} 
            onValueChange={handleAnoChange}
            data-testid="seletor-ano"
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os anos</SelectItem>
              {periodosDisponiveis?.anos?.map(ano => {
                const registrosAno = periodosDisponiveis.periodos
                  .filter(p => p.ano === ano)
                  .reduce((total, p) => total + p.totalRegistros, 0);
                
                return (
                  <SelectItem key={ano} value={ano.toString()}>
                    {ano} ({registrosAno} registros)
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Seletor de Mês */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Mês</label>
          <Select 
            value={filtrosAtuais.mes?.toString() || 'todos'} 
            onValueChange={handleMesChange}
            data-testid="seletor-mes"
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os meses</SelectItem>
              {periodosDisponiveis?.meses?.map(mes => {
                const registrosMes = periodosDisponiveis.periodos
                  .filter(p => p.mes === mes.numero && (!filtrosAtuais.ano || p.ano === filtrosAtuais.ano))
                  .reduce((total, p) => total + p.totalRegistros, 0);
                
                return (
                  <SelectItem key={mes.numero} value={mes.numero.toString()}>
                    {mes.nome} ({registrosMes} registros)
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Estatísticas dos filtros aplicados */}
      {mostrarEstatisticas && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3" data-testid="estatisticas-filtros">
          <div className="flex items-start gap-3">
            <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  {estatisticasFiltros.descricaoFiltro}
                </span>
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  {estatisticasFiltros.totalRegistros} registros
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-xs text-blue-700">
                <div>
                  <span className="font-medium">{estatisticasFiltros.totalReceber}</span>
                  <div className="text-blue-600">A Receber</div>
                </div>
                <div>
                  <span className="font-medium">{estatisticasFiltros.totalPagar}</span>
                  <div className="text-blue-600">A Pagar</div>
                </div>
                <div>
                  <span className="font-medium">{estatisticasFiltros.periodosFiltrados}</span>
                  <div className="text-blue-600">Períodos</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de períodos disponíveis (apenas se há poucos períodos) */}
      {periodosDisponiveis?.periodos?.length <= 12 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Períodos com dados:</h4>
          <div className="flex flex-wrap gap-2">
            {periodosDisponiveis?.periodos
              .sort((a, b) => b.ano - a.ano || b.mes - a.mes) // Ordenar por período mais recente
              .map(periodo => (
                <Badge 
                  key={periodo.anoMes} 
                  variant={
                    (filtrosAtuais.ano === periodo.ano && (!filtrosAtuais.mes || filtrosAtuais.mes === periodo.mes))
                      ? "default" 
                      : "secondary"
                  }
                  className="text-xs cursor-pointer hover:bg-gray-200"
                  onClick={() => onFiltrosChange({ ano: periodo.ano, mes: periodo.mes })}
                  data-testid={`badge-periodo-${periodo.anoMes}`}
                  title={`${periodo.totalRegistros} registros (${periodo.countReceber} receber, ${periodo.countPagar} pagar)`}
                >
                  {periodo.label} ({periodo.totalRegistros})
                </Badge>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}