import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import type { PorPrograma, SerieRubrica } from "@/types/financeiro";
import { formatBRLCompact, formatBRL } from "@/services/financeiroService";

interface FinanceiroSideCardProps {
  programaData: PorPrograma | null;
  rubricaData: SerieRubrica | null;
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
      <div className="bg-gray-900 text-white p-2 border border-gray-700 rounded-lg shadow-lg text-xs">
        <p className="mb-1">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
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
    <Card className="h-full bg-gray-900 text-white">
      <CardHeader>
        <Skeleton className="h-6 w-32 bg-gray-700" />
        <Skeleton className="h-8 w-24 bg-gray-700" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-4 w-12 bg-gray-700" />
              <Skeleton className="h-3 w-16 bg-gray-700" />
            </div>
          ))}
        </div>
        <Skeleton className="h-20 w-full bg-gray-700" />
      </CardContent>
    </Card>
  );
}

export default function FinanceiroSideCard({ 
  programaData, 
  rubricaData, 
  loading, 
  className = "" 
}: FinanceiroSideCardProps) {
  if (loading) {
    return (
      <div className={className} data-testid="financeiro-side-card-loading">
        <LoadingSkeleton />
      </div>
    );
  }

  // Calcular total realizado
  const totalRealizado = programaData?.items.reduce((sum, item) => sum + item.realizado, 0) || 0;

  // Preparar dados para gráfico de barras
  const barData = programaData?.items.map(item => ({
    programa: item.programa,
    previsto: item.previsto,
    realizado: item.realizado,
    diferenca: item.realizado - item.previsto
  })) || [];

  // Preparar dados para mini-linha (rubrica)
  const lineData = rubricaData?.points.map(point => ({
    mes: new Date(point.mes + '-01').toLocaleDateString('pt-BR', { month: 'short' }),
    valor: point.valor
  })) || [];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={className}
      data-testid="financeiro-side-card"
    >
      <Card className="h-full bg-gray-900 text-white shadow-lg border-gray-700">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-white">
            Total Realizado
          </CardTitle>
          <div className="text-3xl font-bold text-green-400">
            {formatBRLCompact(totalRealizado)}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Gráfico de barras por programa */}
          <div data-testid="programa-bars">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Por Programa</h4>
            
            {barData.length > 0 ? (
              <div className="h-32 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <XAxis 
                      dataKey="programa" 
                      stroke="#9CA3AF"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} />
                    
                    <Bar 
                      dataKey="previsto" 
                      name="Previsto"
                      fill="#374151"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar 
                      dataKey="realizado" 
                      name="Realizado"
                      fill="#10B981"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-gray-500 text-sm">
                Nenhum dado disponível
              </div>
            )}

            {/* Lista detalhada */}
            <div className="space-y-2">
              {barData.map((item) => (
                <div key={item.programa} className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">{item.programa}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">
                      {formatBRLCompact(item.realizado)}
                    </span>
                    <Badge 
                      variant={item.diferenca >= 0 ? "secondary" : "destructive"}
                      className={`text-xs ${
                        item.diferenca >= 0 
                          ? 'bg-green-900 text-green-200 border-green-700' 
                          : 'bg-red-900 text-red-200 border-red-700'
                      }`}
                    >
                      {item.diferenca >= 0 ? '+' : ''}{formatBRLCompact(item.diferenca)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mini-linha para rubrica alimentação */}
          <div data-testid="rubrica-line">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-300">Alimentação</h4>
              <span className="text-sm text-green-400 font-medium">
                {formatBRLCompact(rubricaData?.total || 0)}
              </span>
            </div>
            
            {lineData.length > 0 ? (
              <div className="h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <Line 
                      type="monotone" 
                      dataKey="valor" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 3, stroke: '#10B981', strokeWidth: 1 }}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-gray-800 text-white p-2 border border-gray-600 rounded text-xs">
                              <p>{`${label}: ${formatBRLCompact(payload[0].value as number)}`}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-16 flex items-center justify-center text-gray-500 text-xs">
                Sem dados
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}