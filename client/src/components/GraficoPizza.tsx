import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as PieChartIcon, TrendingUp, TrendingDown, DollarSign, Target, Activity } from "lucide-react";

/**
 * Interface para as propriedades do componente GraficoPizza
 */
interface GraficoPizzaProps {
  /** Dados para o gráfico - array com dados por área */
  data?: Array<{
    area: string;
    valor: number;
    cor?: string;
    descricao?: string;
  }>;
  /** Estado de loading */
  loading?: boolean;
  /** Classe CSS adicional */
  className?: string;
  /** Título do gráfico */
  title?: string;
  /** Altura do gráfico em pixels */
  height?: number;
  /** Label central customizado */
  centerLabel?: string;
  /** Se deve mostrar valores como percentual */
  showPercentages?: boolean;
  /** Se deve mostrar legenda */
  showLegend?: boolean;
}

/**
 * Interface para dados processados do gráfico
 */
interface DadosProcessados {
  area: string;
  valor: number;
  cor: string;
  percentual: number;
  descricao?: string;
}

// Dados de exemplo para demonstração - distribuição realística por áreas
const dadosExemplo = [
  { 
    area: 'Negócios Sociais', 
    valor: 285000, 
    cor: '#3B82F6',
    descricao: 'Iniciativas de empreendedorismo social'
  },
  { 
    area: 'Favela 3D', 
    valor: 195000, 
    cor: '#10B981',
    descricao: 'Projeto de desenvolvimento urbano'
  },
  { 
    area: 'Educação', 
    valor: 320000, 
    cor: '#FFCC00',
    descricao: 'Programas educacionais e capacitação'
  },
  { 
    area: 'Cultura', 
    valor: 140000, 
    cor: '#F59E0B',
    descricao: 'Projetos culturais e artísticos'
  },
  { 
    area: 'Tecnologia', 
    valor: 165000, 
    cor: '#8B5CF6',
    descricao: 'Inovação e inclusão digital'
  },
  { 
    area: 'Outros', 
    valor: 95000, 
    cor: '#EF4444',
    descricao: 'Outras iniciativas e projetos'
  }
];

// Paleta de cores profissional para as áreas
const coresProfissionais = [
  '#3B82F6', // Azul moderno
  '#10B981', // Verde esmeralda
  '#FFCC00', // Amarelo vibrante (marca)
  '#F59E0B', // Laranja profissional
  '#8B5CF6', // Roxo moderno
  '#EF4444', // Vermelho coral
  '#06B6D4', // Ciano
  '#84CC16', // Verde lima
  '#F97316', // Laranja queimado
  '#EC4899', // Rosa vibrante
];

/**
 * Função para formatar valores monetários em Real brasileiro
 */
const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(valor);
};

/**
 * Função para formatar valores compactos (K, M)
 */
const formatarValorCompacto = (valor: number): string => {
  if (Math.abs(valor) >= 1000000) {
    return `${(valor / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(valor) >= 1000) {
    return `${(valor / 1000).toFixed(0)}K`;
  }
  return valor.toString();
};

/**
 * Componente de tooltip customizado para o gráfico
 */
const TooltipCustomizado = ({ active, payload }: any) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0];
    const { area, valor, percentual, descricao } = data.payload;
    
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-4 min-w-[250px] backdrop-blur-sm">
        <div className="font-semibold text-gray-900 mb-3 text-center border-b pb-2">
          {area}
        </div>
        
        <div className="space-y-3">
          {/* Valor */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: data.fill }}
              />
              <span className="text-sm font-medium text-gray-700">
                Valor:
              </span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              {formatarMoeda(valor)}
            </span>
          </div>
          
          {/* Percentual */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Percentual:
            </span>
            <span className="text-sm font-bold text-blue-600">
              {percentual.toFixed(1)}%
            </span>
          </div>
          
          {/* Descrição */}
          {descricao && (
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500 italic">
                {descricao}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

/**
 * Componente de legenda customizada
 */
const LegendaCustomizada = ({ payload, totalValue }: any) => {
  if (!payload || !payload.length) return null;

  return (
    <div className="mt-6 space-y-3">
      <div className="text-sm font-semibold text-gray-700 text-center mb-4">
        Distribuição por Área
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
        {payload.map((entry: any, index: number) => (
          <div 
            key={`legenda-${index}`}
            className="flex items-center justify-between bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors duration-200"
            data-testid={`legenda-item-${entry.payload.area.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                style={{ backgroundColor: entry.color }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {entry.value}
                </div>
                <div className="text-xs text-gray-500">
                  {entry.payload.percentual.toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-gray-900">
                {formatarValorCompacto(entry.payload.valor)}
              </div>
              <div className="text-xs text-gray-500">
                {formatarMoeda(entry.payload.valor)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Componente de loading skeleton
 */
const LoadingSkeleton = ({ height = 400 }: { height?: number }) => (
  <div 
    className="w-full animate-pulse p-4"
    style={{ height: `${height}px` }}
    data-testid="grafico-pizza-loading"
  >
    <div className="flex items-center justify-center h-full">
      {/* Skeleton do gráfico circular */}
      <div className="relative">
        {/* Círculo externo */}
        <div className="w-64 h-64 rounded-full border-8 border-gray-200 animate-spin">
          {/* Segmentos simulados */}
          <div className="absolute top-0 left-1/2 w-2 h-32 bg-gradient-to-b from-blue-200 to-transparent transform -translate-x-1/2 origin-bottom animate-pulse"></div>
          <div className="absolute top-1/2 right-0 w-32 h-2 bg-gradient-to-r from-green-200 to-transparent transform -translate-y-1/2 origin-left animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-0 left-1/2 w-2 h-32 bg-gradient-to-t from-yellow-200 to-transparent transform -translate-x-1/2 origin-top animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-0 w-32 h-2 bg-gradient-to-l from-orange-200 to-transparent transform -translate-y-1/2 origin-right animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        </div>
        
        {/* Centro do donut */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 bg-white rounded-full shadow-inner flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-20 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Skeleton da legenda */}
    <div className="mt-8 space-y-3">
      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mx-auto"></div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
            <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-2 w-12 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="text-right space-y-2">
              <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-2 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/**
 * Componente de label central do donut
 */
const LabelCentral = ({ totalValue, centerLabel }: { totalValue: number; centerLabel?: string }) => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    <div className="text-center bg-white rounded-full w-32 h-32 flex flex-col items-center justify-center shadow-lg border-2 border-gray-100">
      <div className="text-xs text-gray-600 font-medium mb-1">
        {centerLabel || 'Total Geral'}
      </div>
      <div className="text-lg font-bold text-gray-900">
        {formatarValorCompacto(totalValue)}
      </div>
      <div className="text-xs text-gray-500">
        {formatarMoeda(totalValue)}
      </div>
    </div>
  </div>
);

/**
 * Componente principal do gráfico de pizza
 */
export default function GraficoPizza({ 
  data, 
  loading = false, 
  className = "", 
  title = "Distribuição por Áreas do Grito",
  height = 400,
  centerLabel,
  showPercentages = true,
  showLegend = true
}: GraficoPizzaProps) {
  
  // Processar dados e calcular percentuais com memoização
  const dadosProcessados: DadosProcessados[] = useMemo(() => {
    const dadosBase = data && data.length > 0 ? data : dadosExemplo;
    const totalValue = dadosBase.reduce((acc, item) => acc + (item.valor || 0), 0);
    
    return dadosBase.map((item, index) => ({
      area: item.area,
      valor: item.valor || 0,
      cor: item.cor || coresProfissionais[index % coresProfissionais.length],
      percentual: totalValue > 0 ? ((item.valor || 0) / totalValue) * 100 : 0,
      descricao: item.descricao
    })).sort((a, b) => b.valor - a.valor); // Ordenar por valor decrescente
  }, [data]);

  // Calcular estatísticas
  const estatisticas = useMemo(() => {
    const total = dadosProcessados.reduce((acc, item) => acc + item.valor, 0);
    const maiorArea = dadosProcessados[0];
    const menorArea = dadosProcessados[dadosProcessados.length - 1];
    
    return {
      total,
      maiorArea,
      menorArea,
      numeroAreas: dadosProcessados.length,
      ticketMedio: total / Math.max(dadosProcessados.length, 1)
    };
  }, [dadosProcessados]);

  // Estado de loading
  if (loading) {
    return (
      <Card className={`bg-white shadow-sm border border-gray-200 ${className}`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <PieChartIcon className="w-5 h-5 text-gray-600" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton height={height} />
        </CardContent>
      </Card>
    );
  }

  // Estado vazio
  if (!dadosProcessados || dadosProcessados.length === 0) {
    return (
      <Card className={`bg-white shadow-sm border border-gray-200 ${className}`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <PieChartIcon className="w-5 h-5 text-gray-600" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="flex flex-col items-center justify-center text-gray-500"
            style={{ height: `${height}px` }}
            data-testid="grafico-pizza-empty"
          >
            <PieChartIcon className="w-12 h-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">Nenhum dado disponível</p>
            <p className="text-sm text-gray-400">Os dados de distribuição aparecerão aqui quando disponíveis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300 ${className}`}
      data-testid="grafico-pizza-container"
    >
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <PieChartIcon className="w-5 h-5 text-gray-600" />
          {title}
        </CardTitle>
        <div className="flex items-center justify-between mt-2">
          <div className="text-sm text-gray-600">
            Distribuição financeira por área de atuação
          </div>
          
          {/* Indicadores de resumo */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              <span>{estatisticas.numeroAreas} áreas</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              <span>Média {formatarValorCompacto(estatisticas.ticketMedio)}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Gráfico principal */}
        <div 
          className="relative"
          style={{ height: `${height}px` }}
          data-testid="grafico-pizza-chart"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <Pie
                data={dadosProcessados}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={120}
                innerRadius={60} // Donut style
                fill="#8884d8"
                dataKey="valor"
                stroke="#ffffff"
                strokeWidth={2}
                animationBegin={0}
                animationDuration={1200}
                animationEasing="ease-out"
              >
                {dadosProcessados.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.cor}
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                      cursor: 'pointer'
                    }}
                    data-testid={`pizza-segment-${entry.area.toLowerCase().replace(/\s+/g, '-')}`}
                  />
                ))}
              </Pie>
              
              {/* Tooltip customizado */}
              <Tooltip 
                content={<TooltipCustomizado />}
                animationEasing="ease-out"
                animationDuration={200}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Label central */}
          <LabelCentral 
            totalValue={estatisticas.total} 
            centerLabel={centerLabel}
          />
        </div>

        {/* Legenda customizada */}
        {showLegend && (
          <LegendaCustomizada 
            payload={dadosProcessados.map(item => ({
              value: item.area,
              color: item.cor,
              payload: item
            }))}
            totalValue={estatisticas.total}
          />
        )}

        {/* Estatísticas de resumo */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-sm text-gray-600">Maior Investimento</div>
            <div className="text-lg font-bold text-blue-600">
              {estatisticas.maiorArea?.area}
            </div>
            <div className="text-xs text-gray-500">
              {formatarMoeda(estatisticas.maiorArea?.valor || 0)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-600">Total Distribuído</div>
            <div className="text-lg font-bold text-gray-900">
              {formatarMoeda(estatisticas.total)}
            </div>
            <div className="text-xs text-gray-500">
              Em {estatisticas.numeroAreas} áreas
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-600">Ticket Médio</div>
            <div className="text-lg font-bold text-green-600">
              {formatarMoeda(estatisticas.ticketMedio)}
            </div>
            <div className="text-xs text-gray-500">
              Por área de atuação
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Versão compacta do gráfico para dashboards menores
 */
export function GraficoPizzaCompacto({
  data,
  loading = false,
  height = 200,
  centerLabel = "Total"
}: Omit<GraficoPizzaProps, 'showLegend' | 'className' | 'title'>) {
  return (
    <GraficoPizza
      data={data}
      loading={loading}
      height={height}
      centerLabel={centerLabel}
      showLegend={false}
      title=""
      className="shadow-none border-0"
    />
  );
}