import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, PieChart } from "lucide-react";
import { useState } from 'react';

// Componente principal do gráfico financeiro moderno
export default function GraficoFinanceiro({ 
  dados = [],
  titulo = "Evolução Financeira",
  tipo = "bar", // bar, line, area
  filtros = {},
  loading = false,
  height = 400,
  className = ""
}) {
  const [tipoGrafico, setTipoGrafico] = useState(tipo);

  // Formatador de valores para o tooltip
  const formatTooltipValue = (value, name) => {
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
    
    return [formatted, name === 'captado' ? 'Captado' : 'Realizado'];
  };

  // Formatador do eixo Y
  const formatYAxisTick = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Cores do gráfico - tema escuro moderno e profissional
  const cores = {
    captado: "#8B5FE5", // Roxo moderno
    realizado: "#4FACF7", // Azul moderno  
    saldo: "#10B981", // Verde esmeralda
    accent: "#F59E0B", // Amarelo accent
    grid: "#374151", // Grid mais sutil
    text: "#D1D5DB", // Texto cinza claro
    background: "#1F2937" // Fundo escuro
  };

  if (loading) {
    return (
      <Card className={`w-full bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-2xl ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            {titulo}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-slate-300 text-lg font-medium">Carregando dados financeiros...</p>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dados || dados.length === 0) {
    return (
      <Card className={`w-full bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-2xl ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            {titulo}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4">
              <PieChart className="w-20 h-20 text-slate-500 mx-auto" />
              <div className="space-y-2">
                <p className="text-slate-300 text-lg font-medium">Nenhum dado financeiro disponível</p>
                <p className="text-sm text-slate-400">Verifique a conexão com o Omie ou aguarde o carregamento</p>
              </div>
              <div className="mt-4 px-4 py-2 bg-slate-700 rounded-lg">
                <p className="text-xs text-slate-400">Sistema de integração em operação</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderizar gráfico de barras moderno
  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={dados} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="captadoGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cores.captado} stopOpacity={0.8}/>
            <stop offset="100%" stopColor={cores.captado} stopOpacity={0.6}/>
          </linearGradient>
          <linearGradient id="realizadoGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cores.realizado} stopOpacity={0.8}/>
            <stop offset="100%" stopColor={cores.realizado} stopOpacity={0.6}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={cores.grid} opacity={0.3} />
        <XAxis 
          dataKey="mes" 
          tick={{ fontSize: 12, fill: cores.text }}
          axisLine={{ stroke: cores.grid }}
          tickLine={{ stroke: cores.grid }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: cores.text }}
          axisLine={{ stroke: cores.grid }}
          tickLine={{ stroke: cores.grid }}
          tickFormatter={formatYAxisTick}
        />
        <Tooltip 
          formatter={formatTooltipValue}
          labelStyle={{ color: '#fff', fontWeight: 'bold' }}
          contentStyle={{ 
            backgroundColor: 'rgba(31, 41, 55, 0.95)', 
            border: `1px solid ${cores.grid}`,
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)'
          }}
        />
        <Legend 
          wrapperStyle={{ color: cores.text }}
        />
        <Bar 
          dataKey="captado" 
          fill="url(#captadoGradient)"
          name="Captado"
          radius={[8, 8, 0, 0]}
          animationDuration={1000}
        />
        <Bar 
          dataKey="realizado" 
          fill="url(#realizadoGradient)"
          name="Realizado"
          radius={[8, 8, 0, 0]}
          animationDuration={1000}
          animationDelay={200}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  // Renderizar gráfico de linha moderno
  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={dados} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="captadoLineGlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={cores.captado} stopOpacity={0.1}/>
            <stop offset="50%" stopColor={cores.captado} stopOpacity={0.8}/>
            <stop offset="100%" stopColor={cores.captado} stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="realizadoLineGlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={cores.realizado} stopOpacity={0.1}/>
            <stop offset="50%" stopColor={cores.realizado} stopOpacity={0.8}/>
            <stop offset="100%" stopColor={cores.realizado} stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={cores.grid} opacity={0.3} />
        <XAxis 
          dataKey="mes" 
          tick={{ fontSize: 12, fill: cores.text }}
          axisLine={{ stroke: cores.grid }}
          tickLine={{ stroke: cores.grid }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: cores.text }}
          axisLine={{ stroke: cores.grid }}
          tickLine={{ stroke: cores.grid }}
          tickFormatter={formatYAxisTick}
        />
        <Tooltip 
          formatter={formatTooltipValue}
          labelStyle={{ color: '#fff', fontWeight: 'bold' }}
          contentStyle={{ 
            backgroundColor: 'rgba(31, 41, 55, 0.95)', 
            border: `1px solid ${cores.grid}`,
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)'
          }}
        />
        <Legend 
          wrapperStyle={{ color: cores.text }}
        />
        <Line 
          type="monotone" 
          dataKey="captado" 
          stroke={cores.captado}
          strokeWidth={4}
          dot={{ 
            fill: cores.captado, 
            strokeWidth: 3, 
            r: 6,
            stroke: '#fff'
          }}
          activeDot={{ 
            r: 8, 
            fill: cores.captado,
            stroke: '#fff',
            strokeWidth: 2,
            boxShadow: `0 0 20px ${cores.captado}`
          }}
          name="Captado"
          animationDuration={1500}
        />
        <Line 
          type="monotone" 
          dataKey="realizado" 
          stroke={cores.realizado}
          strokeWidth={4}
          dot={{ 
            fill: cores.realizado, 
            strokeWidth: 3, 
            r: 6,
            stroke: '#fff'
          }}
          activeDot={{ 
            r: 8, 
            fill: cores.realizado,
            stroke: '#fff',
            strokeWidth: 2,
            boxShadow: `0 0 20px ${cores.realizado}`
          }}
          name="Realizado"
          animationDuration={1500}
          animationDelay={300}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  // Renderizar gráfico de área moderno
  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={dados} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="captadoArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cores.captado} stopOpacity={0.4}/>
            <stop offset="50%" stopColor={cores.captado} stopOpacity={0.2}/>
            <stop offset="100%" stopColor={cores.captado} stopOpacity={0.05}/>
          </linearGradient>
          <linearGradient id="realizadoArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cores.realizado} stopOpacity={0.4}/>
            <stop offset="50%" stopColor={cores.realizado} stopOpacity={0.2}/>
            <stop offset="100%" stopColor={cores.realizado} stopOpacity={0.05}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={cores.grid} opacity={0.3} />
        <XAxis 
          dataKey="mes" 
          tick={{ fontSize: 12, fill: cores.text }}
          axisLine={{ stroke: cores.grid }}
          tickLine={{ stroke: cores.grid }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: cores.text }}
          axisLine={{ stroke: cores.grid }}
          tickLine={{ stroke: cores.grid }}
          tickFormatter={formatYAxisTick}
        />
        <Tooltip 
          formatter={formatTooltipValue}
          labelStyle={{ color: '#fff', fontWeight: 'bold' }}
          contentStyle={{ 
            backgroundColor: 'rgba(31, 41, 55, 0.95)', 
            border: `1px solid ${cores.grid}`,
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)'
          }}
        />
        <Legend 
          wrapperStyle={{ color: cores.text }}
        />
        <Area 
          type="monotone" 
          dataKey="captado" 
          stackId="1"
          stroke={cores.captado}
          strokeWidth={3}
          fill="url(#captadoArea)"
          name="Captado"
          animationDuration={1500}
        />
        <Area 
          type="monotone" 
          dataKey="realizado" 
          stackId="2"
          stroke={cores.realizado}
          strokeWidth={3}
          fill="url(#realizadoArea)"
          name="Realizado"
          animationDuration={1500}
          animationDelay={300}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  return (
    <Card className={`w-full bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-2xl hover:shadow-slate-700/50 transition-all duration-500 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-3 text-white">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">{titulo}</h3>
            <p className="text-sm text-slate-400 font-normal">Análise de performance financeira</p>
          </div>
        </CardTitle>
        
        {/* Controles do tipo de gráfico modernos */}
        <div className="flex gap-1 bg-slate-700/50 p-1 rounded-xl backdrop-blur-sm">
          <Button
            variant={tipoGrafico === 'bar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTipoGrafico('bar')}
            className={`transition-all duration-300 ${
              tipoGrafico === 'bar' 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                : 'text-slate-300 hover:text-white hover:bg-slate-600'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
          </Button>
          <Button
            variant={tipoGrafico === 'line' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTipoGrafico('line')}
            className={`transition-all duration-300 ${
              tipoGrafico === 'line' 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                : 'text-slate-300 hover:text-white hover:bg-slate-600'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
          </Button>
          <Button
            variant={tipoGrafico === 'area' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTipoGrafico('area')}
            className={`transition-all duration-300 ${
              tipoGrafico === 'area' 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                : 'text-slate-300 hover:text-white hover:bg-slate-600'
            }`}
          >
            <PieChart className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Informações sobre filtros aplicados - tema escuro */}
        {Object.keys(filtros).length > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-500/30 backdrop-blur-sm">
            <p className="text-sm text-blue-200">
              <strong className="text-blue-300">Filtros aplicados:</strong> {' '}
              <span className="inline-flex items-center gap-2">
                {filtros.periodo && (
                  <span className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded-md text-xs font-medium">
                    Período: {filtros.periodo}
                  </span>
                )}
                {filtros.area && (
                  <span className="px-2 py-1 bg-purple-600/20 text-purple-300 rounded-md text-xs font-medium">
                    Área: {filtros.area}
                  </span>
                )}
              </span>
            </p>
          </div>
        )}

        {/* Renderização do gráfico baseado no tipo selecionado */}
        <div className="w-full">
          {tipoGrafico === 'bar' && renderBarChart()}
          {tipoGrafico === 'line' && renderLineChart()}
          {tipoGrafico === 'area' && renderAreaChart()}
        </div>

        {/* Resumo dos dados - tema escuro moderno */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group">
            <div className="p-6 bg-gradient-to-br from-purple-800/30 to-purple-900/20 rounded-xl border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-purple-300 uppercase tracking-wider">Total Captado</h4>
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  notation: 'compact',
                  compactDisplay: 'short'
                }).format(dados.reduce((acc, item) => acc + item.captado, 0))}
              </div>
              <div className="text-xs text-purple-400">Receitas planejadas</div>
            </div>
          </div>
          
          <div className="group">
            <div className="p-6 bg-gradient-to-br from-blue-800/30 to-blue-900/20 rounded-xl border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-blue-300 uppercase tracking-wider">Total Realizado</h4>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  notation: 'compact',
                  compactDisplay: 'short'
                }).format(dados.reduce((acc, item) => acc + item.realizado, 0))}
              </div>
              <div className="text-xs text-blue-400">Gastos efetivados</div>
            </div>
          </div>
          
          <div className="group">
            <div className={`p-6 rounded-xl border transition-all duration-300 backdrop-blur-sm ${
              dados.reduce((acc, item) => acc + item.captado - item.realizado, 0) >= 0 
                ? 'bg-gradient-to-br from-emerald-800/30 to-emerald-900/20 border-emerald-500/20 hover:border-emerald-400/40' 
                : 'bg-gradient-to-br from-red-800/30 to-red-900/20 border-red-500/20 hover:border-red-400/40'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className={`text-sm font-semibold uppercase tracking-wider ${
                  dados.reduce((acc, item) => acc + item.captado - item.realizado, 0) >= 0 
                    ? 'text-emerald-300' 
                    : 'text-red-300'
                }`}>Saldo</h4>
                <div className={`w-3 h-3 rounded-full animate-pulse ${
                  dados.reduce((acc, item) => acc + item.captado - item.realizado, 0) >= 0 
                    ? 'bg-emerald-500' 
                    : 'bg-red-500'
                }`}></div>
              </div>
              <div className={`text-3xl font-bold text-white mb-1`}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  notation: 'compact',
                  compactDisplay: 'short'
                }).format(dados.reduce((acc, item) => acc + item.captado - item.realizado, 0))}
              </div>
              <div className={`text-xs ${
                dados.reduce((acc, item) => acc + item.captado - item.realizado, 0) >= 0 
                  ? 'text-emerald-400' 
                  : 'text-red-400'
              }`}>
                {dados.reduce((acc, item) => acc + item.captado - item.realizado, 0) >= 0 
                  ? 'Superávit disponível' 
                  : 'Déficit a cobrir'
                }
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente de gráfico simplificado para uso em cards menores
export function GraficoFinanceiroCompact({ dados = [], height = 200 }) {
  if (!dados || dados.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-gray-500 text-sm">Sem dados</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={dados}>
        <Area 
          type="monotone" 
          dataKey="captado" 
          stroke="#FFCC00" 
          fill="#FFCC0040" 
        />
        <Area 
          type="monotone" 
          dataKey="realizado" 
          stroke="#000000" 
          fill="#00000020" 
        />
        <Tooltip formatter={(value) => [
          new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(value), 
          ''
        ]} />
      </AreaChart>
    </ResponsiveContainer>
  );
}