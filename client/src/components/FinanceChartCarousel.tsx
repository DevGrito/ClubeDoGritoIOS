import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ChartData {
  mes: string;
  captado?: number;
  realizado?: number;
  saldo?: number;
}

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

interface FinanceChartCarouselProps {
  dadosConsolidados: DadosConsolidados | null;
  loading: boolean;
  periodoSelecionado: string;
  onPeriodoChange: (periodo: string) => void;
  showData?: boolean;
}

export default function FinanceChartCarousel({ 
  dadosConsolidados,
  loading = false,
  showData = true
}: FinanceChartCarouselProps) {
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
    loop: false
  });

  // Função para mascarar valores
  const maskValue = (value: number) => showData ? value : 0;

  // Preparar dados com saldo calculado dos dados consolidados
  const hasData = dadosConsolidados && dadosConsolidados.dados_mensais && dadosConsolidados.dados_mensais.length > 0;
  
  // Detectar se é Comunicação Integrada pelos dados consolidados
  const isComunicacaoIntegrada = dadosConsolidados?.departamento === 'Comunicação Integrada';
  
  const chartData = hasData ? dadosConsolidados.dados_mensais.map(item => {
    // CORREÇÃO ESPECÍFICA: Janeiro de Comunicação Integrada deve ter captado = 0
    const captadoCorrigido = (isComunicacaoIntegrada && item.mes === 'Jan') 
      ? 0 
      : item.captado;
    
    return {
      mes: item.mes,
      meta_captado: maskValue(item.meta_captado),
      captado: maskValue(captadoCorrigido),
      meta_realizado: maskValue(item.meta_realizado),
      realizado: maskValue(item.realizado),
      saldo: maskValue(item.saldo)
    };
  }) : [
    { mes: 'Jan', meta_captado: 0, captado: 0, meta_realizado: 0, realizado: 0, saldo: 0 },
    { mes: 'Fev', meta_captado: 0, captado: 0, meta_realizado: 0, realizado: 0, saldo: 0 },
    { mes: 'Mar', meta_captado: 0, captado: 0, meta_realizado: 0, realizado: 0, saldo: 0 },
    { mes: 'Abr', meta_captado: 0, captado: 0, meta_realizado: 0, realizado: 0, saldo: 0 },
    { mes: 'Mai', meta_captado: 0, captado: 0, meta_realizado: 0, realizado: 0, saldo: 0 },
    { mes: 'Jun', meta_captado: 0, captado: 0, meta_realizado: 0, realizado: 0, saldo: 0 },
    { mes: 'Jul', meta_captado: 0, captado: 0, meta_realizado: 0, realizado: 0, saldo: 0 },
    { mes: 'Ago', meta_captado: 0, captado: 0, meta_realizado: 0, realizado: 0, saldo: 0 },
    { mes: 'Set', meta_captado: 0, captado: 0, meta_realizado: 0, realizado: 0, saldo: 0 },
    { mes: 'Out', meta_captado: 0, captado: 0, meta_realizado: 0, realizado: 0, saldo: 0 },
    { mes: 'Nov', meta_captado: 0, captado: 0, meta_realizado: 0, realizado: 0, saldo: 0 },
    { mes: 'Dez', meta_captado: 0, captado: 0, meta_realizado: 0, realizado: 0, saldo: 0 }
  ];

  // Calcular totais - usar REALIZADOS dos departamentos (não METAS)
  console.log('[FINANCE CHART] Dados recebidos:', dadosConsolidados?.totais);
  const totalCaptado = maskValue(dadosConsolidados?.totais.receitas_captado || 0);
  const totalRealizado = maskValue(dadosConsolidados?.totais.despesas_realizado || 0);
  const totalSaldo = maskValue((dadosConsolidados?.totais.receitas_captado || 0) - (dadosConsolidados?.totais.despesas_realizado || 0));
  console.log('[FINANCE CHART] Totais calculados - Captado (REALIZADO):', totalCaptado, 'Realizado (REALIZADO):', totalRealizado, 'Saldo:', totalSaldo);

  const formatCurrency = (value: number) => {
    if (!showData) return '•••';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatCurrencyShort = (value: number) => {
    if (!showData) return '•••';
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return `${value.toFixed(0)}`;
  };

  if (loading) {
    return (
      <div className="w-full h-[500px] bg-gray-100 rounded-xl animate-pulse"></div>
    );
  }

  return (
    <div className="relative">
      {/* Layout horizontal com scroll no mobile */}
      <div className="overflow-x-auto" ref={emblaRef}>
        <div className="flex gap-4 min-w-full">
          {/* Gráfico Principal - Corporativo */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-none w-full md:w-[60%] lg:w-[65%]"
          >
            <Card className="bg-white border-2 border-gray-200 shadow-xl overflow-hidden h-full">
              <CardContent className="p-6">
                <div className="text-gray-600 text-sm font-medium mb-2">
                  Contas a Receber (Realizado Anual)
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-6">
                  {formatCurrency(totalCaptado)}
                </div>

                {/* Legenda */}
                <div className="flex items-center gap-6 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FFCC00' }}></div>
                    <span className="text-gray-700 text-sm">Meta (Mensal)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#0F4C5C' }}></div>
                    <span className="text-gray-700 text-sm">Realizado (Mensal)</span>
                  </div>
                </div>

                {/* Gráfico */}
                <div className="h-[380px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis 
                        dataKey="mes" 
                        stroke="#6B7280"
                        tick={{ fill: '#374151', fontSize: 12 }}
                        axisLine={{ stroke: '#E5E7EB' }}
                      />
                      <YAxis 
                        stroke="#6B7280"
                        tick={{ fill: '#374151', fontSize: 12 }}
                        tickFormatter={formatCurrencyShort}
                        axisLine={{ stroke: '#E5E7EB' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#FFFFFF', 
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          padding: '12px'
                        }}
                        labelStyle={{ color: '#374151', marginBottom: '8px' }}
                        formatter={(value: any, name: string) => [
                          formatCurrency(value), 
                          name === 'meta_captado' ? 'Meta' : 'Realizado'
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="meta_captado"
                        stroke="#FFCC00"
                        strokeWidth={3}
                        dot={{ fill: '#FFCC00', strokeWidth: 0, r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="captado"
                        stroke="#0F4C5C"
                        strokeWidth={3}
                        dot={{ fill: '#0F4C5C', strokeWidth: 0, r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Gráficos Menores Empilhados - Direita */}
          <div className="flex-none w-full md:w-[38%] lg:w-[33%] flex flex-col gap-4">
            {/* Gráfico 2 - Total Realizado (Barras) */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex-1"
            >
              <Card className="bg-white border-2 border-gray-200 shadow-xl overflow-hidden h-full">
                <CardContent className="p-4">
                  <div className="text-gray-600 text-xs font-medium mb-1">
                    Contas a Pagar (Realizado Anual)
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-3">
                    {formatCurrency(-totalRealizado)}
                  </div>

                  {/* Legenda */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FFCC00' }}></div>
                      <span className="text-gray-700 text-xs">Meta (Mensal)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#0F4C5C' }}></div>
                      <span className="text-gray-700 text-xs">Realizado (Mensal)</span>
                    </div>
                  </div>

                  {/* Gráfico */}
                  <div className="h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis 
                          dataKey="mes" 
                          stroke="#6B7280"
                          tick={{ fill: '#374151', fontSize: 10 }}
                          axisLine={{ stroke: '#E5E7EB' }}
                        />
                        <YAxis 
                          stroke="#6B7280"
                          tick={{ fill: '#374151', fontSize: 10 }}
                          tickFormatter={formatCurrencyShort}
                          axisLine={{ stroke: '#E5E7EB' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#FFFFFF', 
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            padding: '8px'
                          }}
                          labelStyle={{ color: '#374151', marginBottom: '4px', fontSize: '12px' }}
                          formatter={(value: any, name: string) => [
                            formatCurrency(value), 
                            name === 'meta_realizado' ? 'Meta' : 'Realizado'
                          ]}
                        />
                        <Bar dataKey="meta_realizado" fill="#FFCC00" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="realizado" fill="#0F4C5C" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Gráfico 3 - Saldo (Linha) */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-1"
            >
              <Card className="bg-white border-2 border-gray-200 shadow-xl overflow-hidden h-full">
                <CardContent className="p-4">
                  <div className="text-gray-600 text-xs font-medium mb-1">
                    Saldo (Realizado Anual)
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-3">
                    {formatCurrency(totalSaldo)}
                  </div>

                  {/* Legenda */}
                  <div className="flex items-center gap-1 mb-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2563EB' }}></div>
                    <span className="text-gray-700 text-xs">Saldo (Realizado Mensal)</span>
                  </div>

                  {/* Gráfico */}
                  <div className="h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <defs>
                          <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis 
                          dataKey="mes" 
                          stroke="#6B7280"
                          tick={{ fill: '#374151', fontSize: 10 }}
                          axisLine={{ stroke: '#E5E7EB' }}
                        />
                        <YAxis 
                          stroke="#6B7280"
                          tick={{ fill: '#374151', fontSize: 10 }}
                          tickFormatter={formatCurrencyShort}
                          axisLine={{ stroke: '#E5E7EB' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#FFFFFF', 
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            padding: '8px'
                          }}
                          labelStyle={{ color: '#374151', marginBottom: '4px', fontSize: '12px' }}
                          formatter={(value: any) => [formatCurrency(value), 'Saldo']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="saldo"
                          stroke="#2563EB"
                          strokeWidth={2}
                          fill="url(#colorSaldo)"
                          fillOpacity={1}
                          dot={{ fill: '#2563EB', strokeWidth: 0, r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
