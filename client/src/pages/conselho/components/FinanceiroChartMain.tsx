import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import type { SerieMensal } from "@/types/financeiro";
import { formatBRLCompact } from "@/services/financeiroService";

interface FinanceiroChartMainProps {
  data: SerieMensal | null;
  loading: boolean;
  className?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    color: string;
    name: string;
    value: number;
    dataKey: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-gray-600 text-sm mb-2">{`Mês: ${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
            {`${entry.name}: ${formatBRLCompact(entry.value)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

function LoadingSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="h-80 flex items-center justify-center">
          <div className="space-y-3 w-full">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FinanceiroChartMain({ data, loading, className = "" }: FinanceiroChartMainProps) {
  if (loading) {
    return (
      <div className={className} data-testid="financeiro-chart-main-loading">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!data || !data.points.length) {
    return (
      <div className={className} data-testid="financeiro-chart-main-empty">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Total – Previsto x Realizado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center text-gray-500">
              Nenhum dado disponível
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Preparar dados para o gráfico
  const chartData = data.points.map(point => ({
    ...point,
    mesFormatted: new Date(point.mes + '-01').toLocaleDateString('pt-BR', { 
      month: 'short',
      year: point.mes.includes('2024') ? '2-digit' : undefined
    })
  }));

  // Calcular total para exibir no header
  const totalRealizado = data.points.reduce((sum, point) => sum + point.realizado, 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
      data-testid="financeiro-chart-main"
    >
      <Card className="h-full bg-white shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Total – Previsto x Realizado
          </CardTitle>
          <div className="text-2xl font-bold text-green-600">
            {formatBRLCompact(totalRealizado)}
          </div>
        </CardHeader>
        
        <CardContent className="pb-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="previstoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="realizadoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                
                <XAxis 
                  dataKey="mesFormatted" 
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                
                <YAxis 
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatBRLCompact(value)}
                />
                
                <Tooltip content={<CustomTooltip />} />
                
                {/* Área para Previsto */}
                <Area
                  type="monotone"
                  dataKey="previsto"
                  name="Previsto"
                  stroke="#16A34A"
                  strokeWidth={3}
                  fill="url(#previstoGradient)"
                  dot={{ fill: '#16A34A', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#16A34A', strokeWidth: 2 }}
                />
                
                {/* Linha para Realizado */}
                <Line
                  type="monotone"
                  dataKey="realizado"
                  name="Realizado"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#059669', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}