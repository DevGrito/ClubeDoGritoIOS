import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  CreditCard,
  Clock,
  Target,
  BarChart3,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Interface para dados do histórico de doações
 */
interface DonationHistoryData {
  usuario: {
    id: number;
    nome: string;
    planoAtual: string;
    subscriptionStatus: string;
    periodicidadeAtual: string;
  };
  doador: {
    id: number;
    plano: string;
    valorPorPeriodo: number;
    status: string;
    dataPrimeiraDoacao: string;
    ultimaDoacao: string;
  } | null;
  estatisticas: {
    totalPago: number;
    totalDoacoes: number;
    periodicidadeAtual: string;
    valorPorPeriodo: number;
    proximaCobranca: number;
    totalAnual: number;
    cobrancasRestantesAno: number;
  };
  historico: {
    local: Array<{
      id: number;
      valor: number;
      plano: string;
      status: string;
      processedAt: string;
      createdAt: string;
    }>;
    stripe: Array<{
      id: string;
      amount: number;
      currency: string;
      status: string;
      created: string;
      period_start: string | null;
      period_end: string | null;
      description: string;
      invoice_pdf?: string;
    }>;
  };
  stripeData: {
    customerId: string | null;
    subscriptionId: string | null;
    subscription: {
      id: string;
      status: string;
      current_period_start: string;
      current_period_end: string;
      cancel_at_period_end: boolean;
    } | null;
  };
}

/**
 * Props do componente
 */
interface DonationHistoryDashboardProps {
  userId: number;
  className?: string;
}

/**
 * Componente para exibir histórico completo de doações por periodicidade
 */
export default function DonationHistoryDashboard({ userId, className = '' }: DonationHistoryDashboardProps) {
  const [showValues, setShowValues] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'local' | 'stripe'>('stripe');

  // Fetch dos dados do histórico
  const { 
    data: historyData, 
    isLoading, 
    error, 
    refetch, 
    isFetching 
  } = useQuery<DonationHistoryData>({
    queryKey: [`/api/users/${userId}/donation-history`],
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2
  });

  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    if (!showValues) return '••••••';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'succeeded':
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'pending':
      case 'processing':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
      case 'canceled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Função para obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'succeeded':
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
      case 'processing':
        return <Clock className="w-4 h-4" />;
      case 'failed':
      case 'canceled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Função para mapear periodicidade para rótulo
  const getPeriodicityLabel = (period: string) => {
    switch (period) {
      case 'mensal': return 'Mensal';
      case 'trimestral': return 'Trimestral';
      case 'semestral': return 'Semestral';
      default: return 'Mensal';
    }
  };

  // Estado de loading
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`} data-testid="donation-history-loading">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estado de erro removido - continuando sem exibir erro

  if (!historyData) {
    return null;
  }

  const { usuario, doador, estatisticas, historico, stripeData } = historyData;

  // Dados combinados do histórico
  const historicoCompleto = selectedPeriod === 'stripe' ? historico.stripe : historico.local;

  return (
    <div className={`space-y-6 ${className}`} data-testid="donation-history-dashboard">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Histórico de Doações</h2>
          <p className="text-sm text-gray-600">
            Acompanhe suas contribuições e periodicidade
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowValues(!showValues)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            data-testid="toggle-values-visibility"
          >
            {showValues ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {showValues ? "Ocultar" : "Mostrar"} Valores
          </Button>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={isFetching}
            className="flex items-center gap-2"
            data-testid="refresh-history"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total doado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Doado</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="total-donated">
                    {formatCurrency(estatisticas.totalPago)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {estatisticas.totalDoacoes} doação{estatisticas.totalDoacoes !== 1 ? 'ões' : ''}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Periodicidade atual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Periodicidade</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="current-periodicity">
                    {getPeriodicityLabel(estatisticas.periodicidadeAtual)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(estatisticas.valorPorPeriodo)} por período
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Projeção anual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Projeção Anual</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="annual-projection">
                    {formatCurrency(estatisticas.totalAnual)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {estatisticas.cobrancasRestantesAno} cobrança{estatisticas.cobrancasRestantesAno !== 1 ? 's' : ''} restante{estatisticas.cobrancasRestantesAno !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Status da subscription */}
      {stripeData.subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Status da Assinatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(stripeData.subscription.status)}>
                    {getStatusIcon(stripeData.subscription.status)}
                    <span className="ml-1 capitalize">{stripeData.subscription.status}</span>
                  </Badge>
                  {stripeData.subscription.cancel_at_period_end && (
                    <Badge variant="outline" className="text-orange-600 bg-orange-100">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Cancelamento agendado
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Período atual: {formatDate(stripeData.subscription.current_period_start)} até {formatDate(stripeData.subscription.current_period_end)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Próxima cobrança</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(estatisticas.proximaCobranca)}
                </p>
                <p className="text-xs text-gray-500">
                  em {formatDate(stripeData.subscription.current_period_end)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico detalhado */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Histórico Detalhado
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setSelectedPeriod('stripe')}
                variant={selectedPeriod === 'stripe' ? 'default' : 'outline'}
                size="sm"
                data-testid="select-stripe-history"
              >
                Stripe ({historico.stripe.length})
              </Button>
              <Button
                onClick={() => setSelectedPeriod('local')}
                variant={selectedPeriod === 'local' ? 'default' : 'outline'}
                size="sm"
                data-testid="select-local-history"
              >
                Local ({historico.local.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {historicoCompleto.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma doação encontrada no histórico {selectedPeriod === 'stripe' ? 'do Stripe' : 'local'}.</p>
            </div>
          ) : (
            <div className="space-y-4" data-testid="donation-list">
              <AnimatePresence>
                {historicoCompleto.map((item, index) => (
                  <motion.div
                    key={selectedPeriod === 'stripe' ? (item as any).id : `${(item as any).id}-local`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    data-testid={`donation-item-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        {getStatusIcon((item as any).status)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {selectedPeriod === 'stripe' 
                              ? `Invoice #${(item as any).id.slice(-8)}`
                              : `Doação #${(item as any).id}`
                            }
                          </p>
                          <Badge 
                            className={getStatusColor((item as any).status)}
                            data-testid={`status-${index}`}
                          >
                            {(item as any).status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>
                            {formatDate(selectedPeriod === 'stripe' ? (item as any).created : (item as any).createdAt)}
                          </span>
                          {selectedPeriod === 'stripe' && (item as any).period_start && (
                            <span>
                              Período: {formatDate((item as any).period_start)} - {formatDate((item as any).period_end)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900" data-testid={`amount-${index}`}>
                        {formatCurrency(
                          selectedPeriod === 'stripe' 
                            ? (item as any).amount / 100 
                            : parseFloat(String((item as any).valor || 0))
                        )}
                      </p>
                      {selectedPeriod === 'stripe' && (item as any).description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {(item as any).description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}