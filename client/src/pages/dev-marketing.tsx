import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { ArrowLeft, RefreshCw, Search, Plus, Heart, MessageCircle, Users, DollarSign, Settings, BarChart3, Calendar, Target, Gift, TrendingUp, CheckCircle, AlertTriangle, Star, Edit, Save, X, Clock, Eye, Trash2, Upload, Download, FileText, Gavel, CreditCard, Filter, Share2, Ticket, Phone, Mail, Trophy, Activity, ExternalLink, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { BenefitImageUploader } from '@/components/BenefitImageUploader';
import { MarketingLinksSection } from '@/components/MarketingLinksSection';
import { useUserData } from '@/hooks/useUserData';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/logo';
import { StripeKeyManager } from '@/components/StripeKeyManager';

function ConverterDoacoesSection({ queryClient }: { queryClient: any }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleConvert = async () => {
    if (!confirm('Tem certeza que deseja converter todas as doações antigas em assinaturas?\n\nIsso criará subscriptions no Stripe para todos os doadores que ainda não têm uma.')) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await apiRequest('/api/admin/convert-donations-to-subscriptions', {
        method: 'POST',
      });

      setResult(response);
      
      if (response.success) {
        toast({
          title: "✅ Conversão Concluída",
          description: `${response.sucessos} doações convertidas com sucesso!`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/doadores'] });
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Erro ao converter doações'
      });
      
      toast({
        title: "❌ Erro na Conversão",
        description: error.message || 'Erro ao converter doações',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <RefreshCw className="w-7 h-7 text-purple-600" />
            Converter Doações em Assinaturas
          </h2>
          <p className="text-gray-600">Transforme doações únicas em assinaturas recorrentes mensais</p>
        </div>
      </div>

      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-600" />
            ⚙️ Converter Doações Antigas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-yellow-800">
                <p className="font-semibold">⚠️ ATENÇÃO - Leia antes de executar:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Esta ação criará <strong>subscriptions recorrentes mensais</strong> no Stripe</li>
                  <li>Apenas doações que ainda <strong>NÃO têm subscription</strong> serão convertidas</li>
                  <li>Cada doador receberá um <strong>PaymentIntent</strong> que precisará ser pago</li>
                  <li>O valor da subscription será o mesmo da doação original</li>
                  <li>Após conversão, o Stripe cobrará <strong>automaticamente TODO MÊS</strong></li>
                </ul>
              </div>
            </div>
          </div>

          <Button
            onClick={handleConvert}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-6"
            size="lg"
            data-testid="button-convert-donations"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Convertendo doações...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-5 w-5" />
                🔄 Converter Todas as Doações
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className={result.success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-700">✅ Conversão Concluída</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-red-700">❌ Erro na Conversão</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.success ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-white">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{result.total}</div>
                        <div className="text-sm text-gray-600">Total Encontrados</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-green-500 bg-white">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{result.sucessos}</div>
                        <div className="text-sm text-gray-600">✅ Convertidos</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-red-500 bg-white">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-red-600">{result.erros}</div>
                        <div className="text-sm text-gray-600">❌ Erros</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {result.detalhes?.sucessos && result.detalhes.sucessos.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Subscriptions Criadas com Sucesso:
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {result.detalhes.sucessos.map((item: any, idx: number) => (
                        <Card key={idx} className="bg-white">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div><strong>Doador ID:</strong> #{item.doadorId}</div>
                              <div><strong>Usuário ID:</strong> #{item.userId}</div>
                              <div><strong>Plano:</strong> {item.plano}</div>
                              <div><strong>Valor:</strong> R$ {item.valor.toFixed(2)}</div>
                              <div className="col-span-2">
                                <strong>Subscription ID:</strong>
                                <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                                  {item.subscriptionId}
                                </code>
                              </div>
                              <div className="col-span-2">
                                <Badge variant="secondary" className="text-xs">
                                  PaymentIntent: {item.paymentIntentId}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {result.detalhes?.erros && result.detalhes.erros.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Erros Encontrados:
                    </h3>
                    <div className="space-y-2">
                      {result.detalhes.erros.map((item: any, idx: number) => (
                        <div key={idx} className="bg-red-100 border border-red-300 rounded p-3">
                          <p className="text-sm text-red-800">
                            <strong>Doador #{item.doadorId}:</strong> {item.error}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-red-100 border border-red-300 rounded p-4">
                <p className="text-red-800">
                  <strong>Erro:</strong> {result.error}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>ℹ️ Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>✅ <strong>Periodicidade:</strong> O sistema agora suporta mensal, trimestral, semestral e anual</p>
          <p>✅ <strong>Conversão:</strong> Doações antigas serão convertidas em subscriptions mensais</p>
          <p>✅ <strong>Status:</strong> Após conversão, as pessoas precisam completar o pagamento</p>
          <p>✅ <strong>Stripe:</strong> Todas as subscriptions serão criadas no Stripe com cobrança recorrente</p>
          <p>⚠️ <strong>Atenção:</strong> Apenas admin pode executar esta ação</p>
        </CardContent>
      </Card>
    </>
  );
}

function EstatisticasIngressosSection({ queryClient }: { queryClient: any }) {
  const { data: stats, isLoading } = useQuery<{
    total: number;
    usados: number;
    pendentes: number;
  }>({
    queryKey: ['/api/ingressos/estatisticas'],
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-600">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-orange-400" />
          <h3 className="font-semibold text-lg mb-2 text-gray-800">Erro ao carregar estatísticas</h3>
          <p>Não foi possível carregar as estatísticas dos ingressos.</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-cyan-600" />
            Estatísticas de Ingressos
          </h2>
          <p className="text-gray-600">Visão geral de todos os ingressos do evento</p>
        </div>
        <Button
          variant="outline"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/ingressos/estatisticas'] })}
          className="flex items-center gap-2"
          data-testid="button-refresh-estatisticas"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-cyan-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-cyan-100 rounded-full">
                <Ticket className="w-10 h-10 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total de Ingressos</p>
                <p className="text-4xl font-bold text-cyan-700">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1">Todos os ingressos criados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-green-100 rounded-full">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Ingressos Resgatados</p>
                <p className="text-4xl font-bold text-green-700">{stats.usados}</p>
                <p className="text-xs text-gray-500 mt-1">Já foram escaneados no evento</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-orange-100 rounded-full">
                <Clock className="w-10 h-10 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Ingressos Pendentes</p>
                <p className="text-4xl font-bold text-orange-700">{stats.pendentes}</p>
                <p className="text-xs text-gray-500 mt-1">Aguardando uso no evento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Progresso */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso de Uso dos Ingressos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Barra de progresso */}
            <div className="w-full">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Resgatados</span>
                <span className="font-semibold text-green-700">
                  {stats.total > 0 ? ((stats.usados / stats.total) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${stats.total > 0 ? (stats.usados / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Detalhes */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.usados}</p>
                <p className="text-sm text-gray-600">Resgatados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.pendentes}</p>
                <p className="text-sm text-gray-600">Ainda não usados</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function PagamentosIngressosSection({ queryClient }: { queryClient: any }) {
  const { data: pagamentos = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/ingresso/pagamentos'],
  });

  // Estados para filtros
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>('');
  const [filtroDataFim, setFiltroDataFim] = useState<string>('');

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (pagamentos.length === 0) {
    return (
      <>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Ticket className="w-7 h-7 text-purple-600" />
              Pagamentos e Ingressos
            </h2>
            <p className="text-gray-600">Todos os pagamentos processados via Cartão (Stripe) - Use os filtros para refinar a busca</p>
          </div>
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/ingresso/pagamentos'] })}
            className="flex items-center gap-2"
            data-testid="button-refresh-payments"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>
        <Card className="p-8 text-center">
          <div className="text-gray-600">
            <Ticket className="w-12 h-12 mx-auto mb-4 text-purple-400" />
            <h3 className="font-semibold text-lg mb-2 text-gray-800">Nenhum pagamento encontrado</h3>
            <p>Ainda não há pagamentos processados de ingressos via cartão.</p>
          </div>
        </Card>
      </>
    );
  }

  // Aplicar filtros aos pagamentos
  const pagamentosFiltrados = pagamentos.filter((p: any) => {
    // Filtro de status
    if (filtroStatus !== 'todos') {
      if (filtroStatus === 'pago' && (p.status !== 'succeeded' || p.temReembolso)) return false;
      if (filtroStatus === 'reembolsado' && !p.temReembolso) return false;
      if (filtroStatus === 'falhado' && !['payment_failed', 'canceled'].includes(p.status)) return false;
      if (filtroStatus === 'aguardando' && p.status !== 'requires_payment_method') return false;
      if (filtroStatus === 'processando' && p.status !== 'processing') return false;
    }

    // Filtro de data
    if (filtroDataInicio && p.data) {
      const dataPagamento = new Date(p.data);
      const dataInicio = new Date(filtroDataInicio);
      if (dataPagamento < dataInicio) return false;
    }
    if (filtroDataFim && p.data) {
      const dataPagamento = new Date(p.data);
      const dataFim = new Date(filtroDataFim);
      dataFim.setHours(23, 59, 59, 999); // Incluir todo o dia final
      if (dataPagamento > dataFim) return false;
    }

    return true;
  });

  const totalPagamentos = pagamentosFiltrados.length;
  const totalPagos = pagamentosFiltrados.filter((p: any) => p.status === 'succeeded' && !p.temReembolso).length;
  const totalReembolsados = pagamentosFiltrados.filter((p: any) => p.temReembolso).length;
  const totalFalhados = pagamentosFiltrados.filter((p: any) => 
    p.status === 'payment_failed' || 
    p.status === 'canceled' || 
    p.status === 'requires_action'
  ).length;
  const totalIngressos = pagamentosFiltrados.reduce((sum: number, p: any) => sum + p.quantidade, 0);
  
  // Calcular valor total: Pagos - Reembolsos
  const valorPago = pagamentosFiltrados.reduce((sum: number, p: any) => 
    p.status === 'succeeded' ? sum + p.valor : sum, 0
  );
  const valorReembolsado = pagamentosFiltrados.reduce((sum: number, p: any) => 
    sum + (p.valorReembolsado || 0), 0
  );
  const valorTotal = valorPago - valorReembolsado;

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Ticket className="w-7 h-7 text-purple-600" />
            Pagamentos e Ingressos
          </h2>
          <p className="text-gray-600">Pagamentos processados via Cartão (Stripe) - Apenas tentativas efetivas</p>
        </div>
        <Button
          variant="outline"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/ingresso/pagamentos'] })}
          className="flex items-center gap-2"
          data-testid="button-refresh-payments"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total de Pagamentos</p>
                <p className="text-2xl font-bold">{totalPagamentos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Pagamentos Confirmados</p>
                <p className="text-2xl font-bold">{totalPagos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Reembolsados</p>
                <p className="text-2xl font-bold">{totalReembolsados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <X className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Tentativas Falhadas</p>
                <p className="text-2xl font-bold">{totalFalhados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-emerald-500" />
              <div>
                <p className="text-sm text-gray-600">Valor Líquido</p>
                <p className="text-2xl font-bold">R$ {(valorTotal / 100).toFixed(2).replace('.', ',')}</p>
                {valorReembolsado > 0 && (
                  <p className="text-xs text-gray-500">
                    (R$ {(valorReembolsado / 100).toFixed(2).replace('.', ',')} reembolsado)
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Lista de Pagamentos</CardTitle>
            <div className="text-sm text-gray-600">
              Total: {pagamentos.length} | Exibindo: {pagamentosFiltrados.length}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Filtrar por Status</Label>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger data-testid="select-filter-status">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value="pago">✅ Pago</SelectItem>
                    <SelectItem value="reembolsado">🔄 Reembolsado</SelectItem>
                    <SelectItem value="falhado">❌ Falhado/Cancelado</SelectItem>
                    <SelectItem value="aguardando">⏳ Aguardando Pagamento</SelectItem>
                    <SelectItem value="processando">⚙️ Processando</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2 block">Data Início</Label>
                <Input 
                  type="date" 
                  value={filtroDataInicio}
                  onChange={(e) => setFiltroDataInicio(e.target.value)}
                  data-testid="input-filter-date-start"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2 block">Data Fim</Label>
                <Input 
                  type="date" 
                  value={filtroDataFim}
                  onChange={(e) => setFiltroDataFim(e.target.value)}
                  data-testid="input-filter-date-end"
                />
              </div>
            </div>

            {/* Botão limpar filtros */}
            {(filtroStatus !== 'todos' || filtroDataInicio || filtroDataFim) && (
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFiltroStatus('todos');
                    setFiltroDataInicio('');
                    setFiltroDataFim('');
                  }}
                  className="flex items-center gap-2"
                  data-testid="button-clear-filters"
                >
                  <X className="w-4 h-4" />
                  Limpar Filtros
                </Button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold text-gray-700">Nome</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Telefone</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Método</th>
                  <th className="text-center p-3 font-semibold text-gray-700">Qtd</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Valor</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Reembolso</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Data</th>
                  <th className="text-center p-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Status Detalhado</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Resumo de Atividade</th>
                </tr>
              </thead>
              <tbody>
                {pagamentosFiltrados.map((pagamento: any) => (
                  <tr key={pagamento.id} className="border-b hover:bg-gray-50" data-testid={`row-payment-${pagamento.id}`}>
                    <td className="p-3" data-testid={`text-name-${pagamento.id}`}>{pagamento.nome}</td>
                    <td className="p-3" data-testid={`text-phone-${pagamento.id}`}>{pagamento.telefone}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {pagamento.metodo}
                      </Badge>
                    </td>
                    <td className="p-3 text-center" data-testid={`text-quantity-${pagamento.id}`}>{pagamento.quantidade}</td>
                    <td className="p-3 text-right font-semibold" data-testid={`text-value-${pagamento.id}`}>{pagamento.valorFormatado}</td>
                    <td className="p-3 text-right" data-testid={`text-refund-${pagamento.id}`}>
                      {pagamento.temReembolso ? (
                        <span className="text-red-600 font-semibold">
                          -R$ {(pagamento.valorReembolsado / 100).toFixed(2).replace('.', ',')}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3" data-testid={`text-date-${pagamento.id}`}>
                      {pagamento.data ? new Date(pagamento.data).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'N/A'}
                    </td>
                    <td className="p-3 text-center" data-testid={`text-status-${pagamento.id}`}>
                      <Badge 
                        variant={pagamento.status === 'succeeded' && !pagamento.temReembolso ? 'default' : 'secondary'}
                        className={
                          pagamento.temReembolso ? 'bg-orange-500' :
                          pagamento.status === 'succeeded' ? 'bg-green-500' :
                          pagamento.status === 'processing' ? 'bg-yellow-500' :
                          pagamento.status === 'payment_failed' ? 'bg-red-500' :
                          pagamento.status === 'canceled' ? 'bg-gray-500' :
                          'bg-blue-500'
                        }
                      >
                        {pagamento.statusLabel}
                      </Badge>
                    </td>
                    <td className="p-3" data-testid={`text-status-detailed-${pagamento.id}`}>
                      <span className="text-sm text-gray-600">{pagamento.statusDetalhado || 'N/A'}</span>
                    </td>
                    <td className="p-3" data-testid={`text-activity-${pagamento.id}`}>
                      {pagamento.resumoAtividade && pagamento.resumoAtividade.length > 0 ? (
                        <div className="text-xs space-y-1 text-gray-600">
                          {pagamento.resumoAtividade.map((atividade: string, idx: number) => (
                            <div key={idx} className="border-l-2 border-gray-300 pl-2 py-1">
                              {atividade}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Nenhuma atividade</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
}

// Componente de Dashboard de Pagamentos Cielo
// Componente de Compradores de Ingressos Avulsos
function CompradoresAvulsosSection({ queryClient }: { queryClient: any }) {
  const { data: response, isLoading } = useQuery<any>({
    queryKey: ['/api/ingresso/compradores-avulsos'],
  });

  const compradores = response?.compradores || [];
  const stats = response?.stats || { total: 0, confirmados: 0, pendentes: 0, valorTotal: 0 };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Phone className="w-7 h-7 text-rose-600" />
            Compradores de Ingressos Avulsos
          </h2>
          <p className="text-gray-600">Todos os compradores que não possuem vínculo com empresa ou usuário cadastrado</p>
        </div>
        <Button
          variant="outline"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/ingresso/compradores-avulsos'] })}
          className="flex items-center gap-2"
          data-testid="button-refresh-compradores"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      <div className="space-y-6">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-rose-500" />
                <div>
                  <p className="text-sm text-gray-600">Total de Compradores</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Confirmados</p>
                  <p className="text-2xl font-bold">{stats.confirmados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold">{stats.pendentes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-emerald-500" />
                <div>
                  <p className="text-sm text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold">R$ {(stats.valorTotal / 100).toFixed(2).replace('.', ',')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Compradores */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Compradores</CardTitle>
          </CardHeader>
          <CardContent>
            {compradores.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <Phone className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="font-semibold text-lg mb-2">Nenhum comprador encontrado</h3>
                <p>Ainda não há compradores de ingressos avulsos.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold text-gray-700">#</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Nome</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Telefone</th>
                      <th className="text-left p-3 font-semibold text-gray-700">E-mail</th>
                      <th className="text-right p-3 font-semibold text-gray-700">Valor</th>
                      <th className="text-center p-3 font-semibold text-gray-700">Status</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Gateway</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compradores.map((comprador: any) => (
                      <tr key={comprador.id} className="border-b hover:bg-gray-50" data-testid={`row-comprador-${comprador.id}`}>
                        <td className="p-3 text-gray-600" data-testid={`text-numero-${comprador.id}`}>
                          {comprador.numero}
                        </td>
                        <td className="p-3 font-medium" data-testid={`text-name-${comprador.id}`}>
                          {comprador.nome}
                        </td>
                        <td className="p-3" data-testid={`text-phone-${comprador.id}`}>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {comprador.telefone}
                          </div>
                        </td>
                        <td className="p-3" data-testid={`text-email-${comprador.id}`}>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {comprador.email}
                          </div>
                        </td>
                        <td className="p-3 text-right font-semibold" data-testid={`text-value-${comprador.id}`}>
                          {comprador.valor}
                        </td>
                        <td className="p-3 text-center" data-testid={`text-status-${comprador.id}`}>
                          <Badge 
                            variant={comprador.status === 'confirmado' || comprador.status === 'ativo' ? 'default' : 'secondary'}
                            className={
                              comprador.status === 'confirmado' || comprador.status === 'ativo' ? 'bg-green-500' :
                              comprador.status === 'pendente' ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }
                          >
                            {comprador.status}
                          </Badge>
                        </td>
                        <td className="p-3" data-testid={`text-gateway-${comprador.id}`}>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {comprador.gateway}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-gray-600" data-testid={`text-date-${comprador.id}`}>
                          {comprador.dataCompra ? new Date(comprador.dataCompra).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function PagamentosCieloSection({ queryClient }: { queryClient: any }) {
  const { data: response, isLoading } = useQuery<any>({
    queryKey: ['/api/ingresso/pagamentos-cielo'],
  });

  const pagamentos = response?.pagamentos || [];
  const stats = response?.stats || null;

  // Estados para filtros
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>('');
  const [filtroDataFim, setFiltroDataFim] = useState<string>('');

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (pagamentos.length === 0) {
    return (
      <>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-7 h-7 text-blue-600" />
              Pagamentos Cielo
            </h2>
            <p className="text-gray-600">Todos os pagamentos processados via Cielo - Use os filtros para refinar a busca</p>
          </div>
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/ingresso/pagamentos-cielo'] })}
            className="flex items-center gap-2"
            data-testid="button-refresh-cielo"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>
        <Card className="p-8 text-center">
          <div className="text-gray-600">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-blue-400" />
            <h3 className="font-semibold text-lg mb-2 text-gray-800">Nenhum pagamento encontrado</h3>
            <p>Ainda não há pagamentos processados de ingressos via Cielo.</p>
          </div>
        </Card>
      </>
    );
  }

  // Aplicar filtros aos pagamentos
  const pagamentosFiltrados = pagamentos.filter((p: any) => {
    // Filtro de status
    if (filtroStatus !== 'todos') {
      if (filtroStatus === 'pago' && p.status !== 'succeeded') return false;
      if (filtroStatus === 'negado' && p.status !== 'payment_failed') return false;
      if (filtroStatus === 'cancelado' && p.status !== 'canceled') return false;
      if (filtroStatus === 'processando' && p.status !== 'processing') return false;
    }

    // Filtro de data
    if (filtroDataInicio && p.data) {
      const dataPagamento = new Date(p.data);
      const dataInicio = new Date(filtroDataInicio);
      if (dataPagamento < dataInicio) return false;
    }
    if (filtroDataFim && p.data) {
      const dataPagamento = new Date(p.data);
      const dataFim = new Date(filtroDataFim);
      dataFim.setHours(23, 59, 59, 999);
      if (dataPagamento > dataFim) return false;
    }

    return true;
  });

  const totalPagamentos = pagamentosFiltrados.length;
  const totalPagos = pagamentosFiltrados.filter((p: any) => p.status === 'succeeded').length;
  const totalNegados = pagamentosFiltrados.filter((p: any) => p.status === 'payment_failed').length;
  const totalCancelados = pagamentosFiltrados.filter((p: any) => p.status === 'canceled').length;
  const totalProcessando = pagamentosFiltrados.filter((p: any) => p.status === 'processing').length;
  
  const valorPago = pagamentosFiltrados
    .filter(p => p.status === 'succeeded')
    .reduce((sum: number, p: any) => sum + p.valor, 0);
  
  const valorProcessando = pagamentosFiltrados
    .filter(p => p.status === 'processing')
    .reduce((sum: number, p: any) => sum + p.valor, 0);
  
  const valorFalhado = pagamentosFiltrados
    .filter(p => p.status === 'payment_failed' || p.status === 'canceled')
    .reduce((sum: number, p: any) => sum + p.valor, 0);

  const totalParcelados = pagamentosFiltrados.filter((p: any) => (p.parcelas || 1) > 1).length;

  // Mutation para confirmar todos os ingressos pendentes
  const confirmarTodosMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/admin/cielo/confirmar-todos-pendentes', { method: 'POST' });
    },
    onSuccess: (data) => {
      toast({
        title: "Ingressos confirmados!",
        description: "Todos os ingressos pendentes foram marcados como confirmados.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ingresso/pagamentos-cielo'] });
    },
    onError: () => {
      toast({
        title: "Erro ao confirmar",
        description: "Não foi possível confirmar os ingressos.",
        variant: "destructive",
      });
    }
  });

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-blue-600" />
            Dashboard Pagamentos Cielo
          </h2>
          <p className="text-gray-600">Análise completa de pagamentos processados via Cielo (gateway Rede)</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={() => {
              if (confirm('⚠️ ATENÇÃO: Isso marcará TODOS os 192 ingressos pendentes como CONFIRMADOS. Esta ação não pode ser desfeita. Deseja continuar?')) {
                confirmarTodosMutation.mutate();
              }
            }}
            disabled={confirmarTodosMutation.isPending}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            data-testid="button-confirm-all-cielo"
          >
            {confirmarTodosMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Confirmar Todos Pendentes
          </Button>
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/ingresso/pagamentos-cielo'] })}
            className="flex items-center gap-2"
            data-testid="button-refresh-cielo"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Ticket className="w-6 h-6 text-blue-600" />
                  <p className="text-xs font-medium text-blue-700">Total</p>
                </div>
                <p className="text-3xl font-bold text-blue-900">{totalPagamentos}</p>
                <p className="text-xs text-blue-600">ingressos</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <p className="text-xs font-medium text-green-700">Pagos</p>
                </div>
                <p className="text-3xl font-bold text-green-900">{totalPagos}</p>
                <p className="text-xs text-green-600">confirmados</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <X className="w-6 h-6 text-red-600" />
                  <p className="text-xs font-medium text-red-700">Negados</p>
                </div>
                <p className="text-3xl font-bold text-red-900">{totalNegados}</p>
                <p className="text-xs text-red-600">recusados</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-gray-600" />
                  <p className="text-xs font-medium text-gray-700">Cancelados</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{totalCancelados}</p>
                <p className="text-xs text-gray-600">cancelados</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-6 h-6 text-yellow-600" />
                  <p className="text-xs font-medium text-yellow-700">Processando</p>
                </div>
                <p className="text-3xl font-bold text-yellow-900">{totalProcessando}</p>
                <p className="text-xs text-yellow-600">em análise</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                  <p className="text-xs font-medium text-emerald-700">Total Pago</p>
                </div>
                <p className="text-2xl font-bold text-emerald-900">
                  R$ {(valorPago / 100).toFixed(2).replace('.', ',')}
                </p>
                <p className="text-xs text-emerald-600">confirmados</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                  <p className="text-xs font-medium text-purple-700">Parcelados</p>
                </div>
                <p className="text-3xl font-bold text-purple-900">{totalParcelados}</p>
                <p className="text-xs text-purple-600">em parcelas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Pagamentos */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Lista Completa de Pagamentos Cielo</CardTitle>
              <div className="text-sm text-gray-600">
                Total: {pagamentos.length} | Exibindo: {pagamentosFiltrados.length}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Filtrar por Status</Label>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger data-testid="select-filter-status-cielo">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os status</SelectItem>
                      <SelectItem value="pago">✅ Pago</SelectItem>
                      <SelectItem value="negado">❌ Negado</SelectItem>
                      <SelectItem value="cancelado">🚫 Cancelado</SelectItem>
                      <SelectItem value="processando">⏳ Processando</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">Data Início</Label>
                  <Input 
                    type="date" 
                    value={filtroDataInicio}
                    onChange={(e) => setFiltroDataInicio(e.target.value)}
                    data-testid="input-filter-date-start-cielo"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">Data Fim</Label>
                  <Input 
                    type="date" 
                    value={filtroDataFim}
                    onChange={(e) => setFiltroDataFim(e.target.value)}
                    data-testid="input-filter-date-end-cielo"
                  />
                </div>
              </div>

              {/* Botão limpar filtros */}
              {(filtroStatus !== 'todos' || filtroDataInicio || filtroDataFim) && (
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFiltroStatus('todos');
                      setFiltroDataInicio('');
                      setFiltroDataFim('');
                    }}
                    className="flex items-center gap-2"
                    data-testid="button-clear-filters-cielo"
                  >
                    <X className="w-4 h-4" />
                    Limpar Filtros
                  </Button>
                </div>
              )}
            </div>

            {/* Tabela */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-semibold text-gray-700">Nome</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Telefone</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Email</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Valor</th>
                    <th className="text-center p-3 font-semibold text-gray-700">Parcelas</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Data</th>
                    <th className="text-center p-3 font-semibold text-gray-700">Status</th>
                    <th className="text-left p-3 font-semibold text-gray-700">TID/Ordem</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {pagamentosFiltrados.map((pagamento: any) => (
                    <tr key={pagamento.id} className="border-b hover:bg-gray-50 transition-colors" data-testid={`row-cielo-${pagamento.id}`}>
                      <td className="p-3 font-medium" data-testid={`text-name-cielo-${pagamento.id}`}>{pagamento.nome}</td>
                      <td className="p-3" data-testid={`text-phone-cielo-${pagamento.id}`}>
                        <a href={`tel:${pagamento.telefone}`} className="text-blue-600 hover:underline">
                          {pagamento.telefone}
                        </a>
                      </td>
                      <td className="p-3 text-sm" data-testid={`text-email-cielo-${pagamento.id}`}>
                        <a href={`mailto:${pagamento.email}`} className="text-blue-600 hover:underline truncate block max-w-[200px]">
                          {pagamento.email}
                        </a>
                      </td>
                      <td className="p-3 text-right font-bold text-lg" data-testid={`text-value-cielo-${pagamento.id}`}>
                        {pagamento.valorFormatado}
                      </td>
                      <td className="p-3 text-center" data-testid={`text-installments-cielo-${pagamento.id}`}>
                        {pagamento.parcelas > 1 ? (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {pagamento.parcelas}x
                          </Badge>
                        ) : (
                          <span className="text-gray-400">à vista</span>
                        )}
                      </td>
                      <td className="p-3 text-sm" data-testid={`text-date-cielo-${pagamento.id}`}>
                        {pagamento.data ? new Date(pagamento.data).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </td>
                      <td className="p-3 text-center" data-testid={`text-status-cielo-${pagamento.id}`}>
                        <Badge 
                          className={
                            pagamento.status === 'succeeded' ? 'bg-green-500 text-white' :
                            pagamento.status === 'processing' ? 'bg-yellow-500 text-white' :
                            pagamento.status === 'payment_failed' ? 'bg-red-500 text-white' :
                            pagamento.status === 'canceled' ? 'bg-gray-500 text-white' :
                            'bg-blue-500 text-white'
                          }
                        >
                          {pagamento.statusLabel}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs font-mono" data-testid={`text-tid-cielo-${pagamento.id}`}>
                        <div className="space-y-1">
                          <div>TID: {pagamento.transactionId}</div>
                          {pagamento.orderId !== 'N/A' && (
                            <div className="text-gray-500">Order: {pagamento.orderId}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-3" data-testid={`text-details-cielo-${pagamento.id}`}>
                        {pagamento.resumoAtividade && pagamento.resumoAtividade.length > 0 ? (
                          <div className="text-xs space-y-1 text-gray-600">
                            {pagamento.resumoAtividade.map((atividade: string, idx: number) => (
                              <div key={idx} className="border-l-2 border-blue-300 pl-2 py-1">
                                {atividade}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Card ultra-compacto de leilão (uma linha)
function LeilaoCard({ leilao }: { leilao: any }) {
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    ativo: { 
      bg: 'bg-green-50', 
      border: 'border-green-200', 
      badge: 'bg-green-600',
      icon: Activity
    },
    aguardando: { 
      bg: 'bg-yellow-50', 
      border: 'border-yellow-200', 
      badge: 'bg-yellow-600',
      icon: Clock
    },
    finalizado: { 
      bg: 'bg-gray-50', 
      border: 'border-gray-200', 
      badge: 'bg-gray-600',
      icon: Trophy
    }
  };

  const config = statusConfig[leilao.statusLeilao as keyof typeof statusConfig] || statusConfig.aguardando;
  const StatusIcon = config.icon;

  return (
    <Card className={`${config.bg} ${config.border} border`}>
      <CardContent className="p-3">
        {/* Linha Compacta */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <StatusIcon className="w-5 h-5 text-gray-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{leilao.beneficio.titulo}</p>
            </div>
            <Badge className={`${config.badge} text-white text-xs flex-shrink-0`}>
              {leilao.statusLeilao.toUpperCase()}
            </Badge>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {leilao.estatisticas.totalParticipantes}
              </span>
              {leilao.lider && (
                <span className="flex items-center gap-1 font-medium text-gray-900">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  {leilao.lider.nome}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Detalhes Expandidos */}
        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-3">
            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center bg-white/50 rounded p-2">
                <p className="text-xs text-gray-500">Lances</p>
                <p className="text-lg font-bold">{leilao.estatisticas.totalLances}</p>
              </div>
              <div className="text-center bg-white/50 rounded p-2">
                <p className="text-xs text-gray-500">Maior</p>
                <p className="text-lg font-bold text-green-600">{leilao.estatisticas.maiorLance}</p>
              </div>
              <div className="text-center bg-white/50 rounded p-2">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-lg font-bold text-orange-600">{leilao.estatisticas.totalInvestido}</p>
              </div>
            </div>

            {/* Líder/Vencedor */}
            {leilao.lider && (
              <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  <p className="font-semibold text-yellow-900">
                    {leilao.statusLeilao === 'finalizado' ? 'Vencedor' : 'Líder Atual'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-yellow-700">Nome</p>
                    <p className="font-medium text-yellow-900">{leilao.lider.nome}</p>
                  </div>
                  <div>
                    <p className="text-xs text-yellow-700">Lance</p>
                    <p className="font-bold text-yellow-900">{leilao.lider.pontosOfertados} Gritos</p>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Participantes */}
            {leilao.participantes && leilao.participantes.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">
                  Participantes ({leilao.participantes.length})
                </p>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-2 py-2 text-left font-medium text-gray-600">#</th>
                        <th className="px-2 py-2 text-left font-medium text-gray-600">Nome</th>
                        <th className="px-2 py-2 text-left font-medium text-gray-600">Telefone</th>
                        <th className="px-2 py-2 text-left font-medium text-gray-600">Email</th>
                        <th className="px-2 py-2 text-left font-medium text-gray-600">Lance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {leilao.participantes.map((p: any, idx: number) => (
                        <tr key={p.userId} className={idx === 0 ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                          <td className="px-2 py-2">
                            {idx === 0 && <Trophy className="w-3 h-3 text-yellow-500" />}
                            {idx !== 0 && <span className="text-gray-400">{idx + 1}</span>}
                          </td>
                          <td className="px-2 py-2 font-medium text-gray-900">{p.nome}</td>
                          <td className="px-2 py-2 text-gray-600">
                            <a href={`tel:${p.telefone}`} className="hover:text-blue-600">
                              {p.telefone}
                            </a>
                          </td>
                          <td className="px-2 py-2 text-gray-600">
                            <a href={`mailto:${p.email}`} className="hover:text-blue-600 truncate block max-w-[150px]">
                              {p.email || '-'}
                            </a>
                          </td>
                          <td className="px-2 py-2">
                            <span className={`font-bold ${idx === 0 ? 'text-yellow-700' : 'text-gray-900'}`}>
                              {p.pontosOfertados}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DevMarketing() {
  const [, setLocation] = useLocation();
  const { userData } = useUserData();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Benefits state
  const [showBenefitForm, setShowBenefitForm] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<any>(null);
  const [benefitFormData, setBenefitFormData] = useState({
    titulo: '',
    descricao: '',
    imagem: '',
    categoria: 'lazer',
    planosDisponiveis: ['eco'],
    ciclosPagamento: ['mensal'],
    pontosNecessarios: '',
    valorEstimado: 0,
    gritosMinimos: 100,
    inicioLeilao: '',
    prazoLances: '',
    ativo: true,
    ordem: 0
  });

  // Stories state
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [editingStory, setEditingStory] = useState<any>(null);
  const [storyFormData, setStoryFormData] = useState({
    titulo: '',
    nome: '',
    texto: '',
    imagemBox: '',
    imagemStory: '',
    ativo: true,
    ordem: 0
  });

  // Missions state
  const [showMissionForm, setShowMissionForm] = useState(false);
  const [editingMission, setEditingMission] = useState<any>(null);

  // CRM Doadores state
  const [showCrmModal, setShowCrmModal] = useState(false);
  const [syncingStripe, setSyncingStripe] = useState(false);
  const [syncingPlans, setSyncingPlans] = useState(false);

  // Auctions Details Modal state
  const [showAuctionDetailsModal, setShowAuctionDetailsModal] = useState(false);
  
  // Webhook Automation state
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<any>(null);
  const [showAutomationForm, setShowAutomationForm] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<any>(null);
  const [webhookFormData, setWebhookFormData] = useState({
    url: '',
    event_types: [] as string[],
    headers: '',
    active: true,
    description: ''
  });
  const [automationFormData, setAutomationFormData] = useState({
    name: '',
    trigger_event: 'payment_success',
    webhook_url: '',
    conditions: '',
    active: true
  });
  
  // Gestão à Vista state
  const [gvScope, setGvScope] = useState('monthly');
  const [gvPeriod, setGvPeriod] = useState('2025-09');
  const [gvSectorSlug, setGvSectorSlug] = useState('all');
  const [gvProjectSlug, setGvProjectSlug] = useState('all');
  const [gvRagFilter, setGvRagFilter] = useState('all');
  
  const [missionFormData, setMissionFormData] = useState({
    titulo: '',
    descricao: '',
    recompensaGritos: 150,
    tipoMissao: 'feedback',
    evidenceType: 'comentario',
    imagemUrl: '',
    planoMinimo: 'eco',
    semanaInicio: '',
    semanaFim: '',
    ativo: true
  });

  // Data fetching - usando endpoints corretos
  const { data: beneficios = [], isLoading: loadingBeneficios, error: errorBeneficios, refetch: refetchBeneficios } = useQuery({
    queryKey: ['/api/admin/beneficios'],
    queryFn: () => apiRequest('/api/admin/beneficios')
  });

  const { data: historias = [], isLoading: loadingHistorias, refetch: refetchHistorias } = useQuery({
    queryKey: ['/api/admin/historias-inspiradoras'],
    queryFn: () => apiRequest('/api/admin/historias-inspiradoras')
  });

  // Query para analytics de engajamento das histórias
  const { data: historiasAnalytics, isLoading: loadingAnalytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ['/api/admin/historias-interacoes/analytics'],
    queryFn: () => apiRequest('/api/admin/historias-interacoes/analytics')
  });

  const { data: lances = [], isLoading: loadingLances, refetch: refetchLances } = useQuery({
    queryKey: ['/api/beneficios-lances-admin'],
    queryFn: () => apiRequest('/api/beneficios-lances-admin')
  });

  const { data: missoes = [], isLoading: loadingMissoes, refetch: refetchMissoes } = useQuery({
    queryKey: ['/api/admin/missoes-semanais'],
    queryFn: () => apiRequest('/api/admin/missoes-semanais')
  });

  const { data: donorStats = {}, isLoading: loadingDonorStats, error: errorDonorStats } = useQuery({
    queryKey: ['/api/donor-stats'],
    queryFn: async () => {
      console.log("🔍 [DONOR DASHBOARD] Buscando donor stats...");
      try {
        const result = await apiRequest('/api/donor-stats');
        console.log("✅ [DONOR DASHBOARD] Stats recebidos:", result);
        return result;
      } catch (error) {
        console.error("❌ [DONOR DASHBOARD] Erro ao buscar stats:", error);
        throw error;
      }
    }
  });

  const { data: doadores = [], isLoading: loadingDoadores, error: errorDoadores } = useQuery({
    queryKey: ['/api/donors'],
    queryFn: async () => {
      console.log("🔍 [DONOR DASHBOARD] Buscando lista de doadores...");
      try {
        const result = await apiRequest('/api/donors');
        console.log("✅ [DONOR DASHBOARD] Doadores recebidos:", result?.length || 0);
        return result;
      } catch (error) {
        console.error("❌ [DONOR DASHBOARD] Erro ao buscar doadores:", error);
        throw error;
      }
    }
  });

  // Queries para dashboard macro de leilões
  const { data: auctionsSummary = {}, isLoading: loadingAuctionsSummary } = useQuery({
    queryKey: ['/api/auctions/summary'],
    queryFn: () => {
      console.log("📊 [AUCTIONS DASHBOARD] Buscando resumo de leilões...");
      return apiRequest('/api/auctions/summary');
    }
  });

  const { data: auctionsStats = {}, isLoading: loadingAuctionsStats } = useQuery({
    queryKey: ['/api/auctions/stats'],
    queryFn: () => {
      console.log("📈 [AUCTIONS DASHBOARD] Buscando estatísticas de leilões...");
      return apiRequest('/api/auctions/stats');
    }
  });

  // Query para detalhes completos de cada leilão
  const { data: leiloesDetalhes = {}, isLoading: loadingLeiloesDetalhes, refetch: refetchLeiloesDetalhes } = useQuery({
    queryKey: ['/api/leiloes-detalhes'],
    queryFn: () => {
      console.log("🏆 [LEILÕES] Buscando detalhes de todos os leilões...");
      return apiRequest('/api/leiloes-detalhes');
    }
  });

  // Query para detalhes do doador selecionado

  const { data: stripeMetrics = { totalPayments: 0, monthlyRevenue: 0, failedPayments: 0, successRate: 0 }, isLoading: loadingStripe } = useQuery<{
    totalPayments: number;
    monthlyRevenue: number;
    failedPayments: number;
    successRate: number;
  }>({
    queryKey: ['/api/stripe/metrics'],
    queryFn: () => {
      // Retornar dados mock até implementar endpoint
      return Promise.resolve({
        totalPayments: 0,
        monthlyRevenue: 0,
        failedPayments: 0,
        successRate: 0
      });
    }
  });

  const { data: managementData, isLoading: loadingManagement } = useQuery({
    queryKey: ['/api/gestao-vista-data'],
    queryFn: () => apiRequest('/api/gestao-vista-data')
  });

  // 🔧 AUTOMATION & WEBHOOKS - Queries
  const { data: webhookSubscriptions = [], isLoading: loadingWebhooks, refetch: refetchWebhooks } = useQuery({
    queryKey: ['/api/webhooks'],
    queryFn: () => apiRequest('/api/webhooks')
  });

  const { data: automations = [], isLoading: loadingAutomations, refetch: refetchAutomations } = useQuery({
    queryKey: ['/api/automations'],
    queryFn: () => apiRequest('/api/automations')
  });

  const { data: webhookDeliveries = [], isLoading: loadingDeliveries } = useQuery({
    queryKey: ['/api/webhook-deliveries'],
    queryFn: () => apiRequest('/api/webhook-deliveries')
  });

  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['/api/events'],
    queryFn: () => apiRequest('/api/events')
  });

  const { data: automationStats = {
    total_webhooks: 0,
    active_webhooks: 0,
    total_automations: 0,
    total_deliveries: 0,
    success_rate: 0
  }, isLoading: loadingAutomationStats } = useQuery<{
    total_webhooks: number;
    active_webhooks: number;
    total_automations: number;
    total_deliveries: number;
    success_rate: number | string;
  }>({
    queryKey: ['/api/automations/stats'],
    queryFn: () => {
      // Calculado baseado nos dados reais
      const totalWebhooks = webhookSubscriptions.length;
      const activeWebhooks = webhookSubscriptions.filter((w: any) => w.active).length;
      const totalAutomations = automations.length;
      const totalDeliveries = webhookDeliveries.length;
      const successfulDeliveries = webhookDeliveries.filter((d: any) => d.status === 'success').length;
      
      return Promise.resolve({
        total_webhooks: totalWebhooks,
        active_webhooks: activeWebhooks,
        total_automations: totalAutomations,
        total_deliveries: totalDeliveries,
        success_rate: totalDeliveries > 0 ? ((successfulDeliveries / totalDeliveries) * 100).toFixed(1) : 0
      });
    }
  });

  // 📊 GESTÃO À VISTA - Queries
  const { data: gvSetores = [], isLoading: loadingGvSetores } = useQuery({
    queryKey: ['/api/gestao-vista/setores'],
    queryFn: () => apiRequest('/api/gestao-vista/setores')
  });

  const { data: gvProjetos = [], isLoading: loadingGvProjetos } = useQuery({
    queryKey: ['/api/gestao-vista/projetos', gvSectorSlug],
    queryFn: () => {
      const params = gvSectorSlug !== 'all' ? `?sector_slug=${gvSectorSlug}` : '';
      return apiRequest(`/api/gestao-vista/projetos${params}`);
    }
  });

  const { data: gvMetaRealizado = {}, isLoading: loadingGvMetaRealizado } = useQuery({
    queryKey: ['/api/gestao-vista/meta-realizado', gvScope, gvPeriod, gvSectorSlug, gvProjectSlug, gvRagFilter],
    queryFn: () => {
      const params = new URLSearchParams({
        scope: gvScope,
        period: gvPeriod
      });
      if (gvSectorSlug !== 'all') params.append('sector_slug', gvSectorSlug);
      if (gvProjectSlug !== 'all') params.append('project_slug', gvProjectSlug);
      if (gvRagFilter && gvRagFilter !== 'all') params.append('rag_filter', gvRagFilter);
      
      return apiRequest(`/api/gestao-vista/meta-realizado?${params.toString()}`);
    }
  });

  // Refresh all data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchBeneficios(),
        refetchHistorias(),
        refetchAnalytics(),
        refetchLances(),
        refetchMissoes(),
        queryClient.invalidateQueries({ queryKey: ['/api/admin/missoes-semanais'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/donor-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/donors'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/stripe/metrics'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/gestao-vista-data'] })
      ]);
      toast({
        title: 'Dados atualizados',
        description: 'Todas as informações foram atualizadas com sucesso.'
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Falha ao atualizar alguns dados.',
        variant: 'destructive'
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Mutação para sincronizar com Stripe
  const syncStripeMutation = useMutation({
    mutationFn: () => apiRequest('/api/donors/sync-stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }),
    onMutate: () => {
      setSyncingStripe(true);
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Sincronização concluída',
        description: `${data.processed} doadores processados com sucesso.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/donors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/donor-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro na sincronização',
        description: error.message || 'Falha ao sincronizar com Stripe.',
        variant: 'destructive'
      });
    },
    onSettled: () => {
      setSyncingStripe(false);
    }
  });

  // Mutação para sincronizar planos do Stripe
  const syncPlansMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/sync-stripe-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }),
    onMutate: () => {
      setSyncingPlans(true);
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Planos sincronizados',
        description: `${data.updated} usuários atualizados, ${data.errors} erros.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/donors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/donor-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro na sincronização',
        description: error.message || 'Falha ao sincronizar planos.',
        variant: 'destructive'
      });
    },
    onSettled: () => {
      setSyncingPlans(false);
    }
  });

  // Função para abrir CRM do doador

  // Benefits mutations
  const beneficioMutation = useMutation({
    mutationFn: (rawData: any) => {
      // Process data to handle empty strings and type coercion
      const data = {
        ...rawData,
        valorEstimado: rawData.valorEstimado ? Number(rawData.valorEstimado) : null,
        gritosMinimos: Number(rawData.gritosMinimos) || 100,
        ordem: Number(rawData.ordem) || 0,
        inicioLeilao: rawData.inicioLeilao ? new Date(rawData.inicioLeilao).toISOString() : null,
        prazoLances: rawData.prazoLances ? new Date(rawData.prazoLances).toISOString() : null,
        imagem: rawData.imagem || null,
        pontosNecessarios: rawData.pontosNecessarios ? parseInt(rawData.pontosNecessarios) : null,
        // Ensure these important fields are included
        planosDisponiveis: rawData.planosDisponiveis || ['eco'],
        ciclosPagamento: rawData.ciclosPagamento || ['mensal']
      };
      
      console.log('🔍 [BENEFIT DEBUG] Sending data:', JSON.stringify(data, null, 2));
      
      if (editingBenefit) {
        return apiRequest(`/api/beneficios/${editingBenefit.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        return apiRequest('/api/beneficios', {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        });
      }
    },
    onSuccess: () => {
      refetchBeneficios();
      setShowBenefitForm(false);
      setEditingBenefit(null);
      setBenefitFormData({
        titulo: '',
        descricao: '',
        imagem: '',
        categoria: 'lazer',
        planosDisponiveis: ['eco'],
        ciclosPagamento: ['mensal'],
        pontosNecessarios: '',
        valorEstimado: 0,
        gritosMinimos: 100,
        inicioLeilao: '',
        prazoLances: '',
        ativo: true,
        ordem: 0
      });
      toast({ title: editingBenefit ? "Benefício atualizado!" : "Benefício criado!" });
    }
  });

  const deleteBenefitMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/beneficios/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      refetchBeneficios();
      toast({ title: "Benefício excluído!" });
    }
  });

  // Stories mutations
  const storyMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingStory) {
        return apiRequest(`/api/admin/historias-inspiradoras/${editingStory.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        return apiRequest('/api/admin/historias-inspiradoras', {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        });
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['/api/admin/historias-inspiradoras'] }),
        queryClient.refetchQueries({ queryKey: ['/api/historias-inspiradoras'] })
      ]);
      setShowStoryForm(false);
      setEditingStory(null);
      setStoryFormData({
        titulo: '',
        nome: '',
        texto: '',
        imagemBox: '',
        imagemStory: '',
        ativo: true,
        ordem: 0
      });
      toast({ title: editingStory ? "História atualizada!" : "História criada!" });
    },
    onError: (error: any) => {
      const message = error?.error || error?.message || "Erro ao salvar história";
      toast({ 
        title: "Erro", 
        description: message,
        variant: "destructive"
      });
    }
  });

  const deleteStoryMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/historias-inspiradoras/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['/api/admin/historias-inspiradoras'] }),
        queryClient.refetchQueries({ queryKey: ['/api/historias-inspiradoras'] })
      ]);
      toast({ title: "História excluída!" });
    }
  });

  // Missions mutations
  const missionMutation = useMutation({
    mutationFn: (rawData: any) => {
      // Process data to handle empty strings and type coercion
      const data = {
        ...rawData,
        recompensaGritos: Number(rawData.recompensaGritos) || 0,
        semanaInicio: rawData.semanaInicio || null,
        semanaFim: rawData.semanaFim || null,
        imagemUrl: rawData.imagemUrl || null
      };
      
      if (editingMission) {
        return apiRequest(`/api/admin/missoes-semanais/${editingMission.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        return apiRequest('/api/admin/missoes-semanais', {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        });
      }
    },
    onSuccess: () => {
      refetchMissoes();
      setShowMissionForm(false);
      setEditingMission(null);
      setMissionFormData({
        titulo: '',
        descricao: '',
        recompensaGritos: 150,
        tipoMissao: 'feedback',
        evidenceType: 'comentario',
        imagemUrl: '',
        planoMinimo: 'eco',
        semanaInicio: '',
        semanaFim: '',
        ativo: true
      });
      toast({ title: editingMission ? "Missão atualizada!" : "Missão criada!" });
    },
    onError: (error) => {
      console.error('Erro na mutation de missão:', error);
      toast({ title: "Erro ao salvar missão", description: "Tente novamente", variant: "destructive" });
    }
  });

  const deleteMissionMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/missoes-semanais/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      refetchMissoes();
      toast({ title: "Missão excluída!" });
    },
    onError: (error) => {
      console.error('Erro ao deletar missão:', error);
      toast({ title: "Erro ao excluir missão", description: "Tente novamente", variant: "destructive" });
    }
  });

  // Webhook mutations
  const webhookMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingWebhook) {
        return apiRequest(`/api/webhooks/${editingWebhook.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        return apiRequest('/api/webhooks', {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        });
      }
    },
    onSuccess: () => {
      refetchWebhooks();
      setShowWebhookForm(false);
      setEditingWebhook(null);
      setWebhookFormData({
        url: '',
        event_types: [],
        headers: '',
        active: true,
        description: ''
      });
      toast({ title: editingWebhook ? "Webhook atualizado!" : "Webhook criado!" });
    },
    onError: (error) => {
      console.error('Erro na mutation de webhook:', error);
      toast({ title: "Erro ao salvar webhook", description: "Tente novamente", variant: "destructive" });
    }
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/webhooks/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      refetchWebhooks();
      toast({ title: "Webhook excluído!" });
    }
  });

  // Automation mutations
  const automationMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingAutomation) {
        return apiRequest(`/api/automations/${editingAutomation.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        return apiRequest('/api/automations', {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        });
      }
    },
    onSuccess: () => {
      refetchAutomations();
      setShowAutomationForm(false);
      setEditingAutomation(null);
      setAutomationFormData({
        name: '',
        trigger_event: 'payment_success',
        webhook_url: '',
        conditions: '',
        active: true
      });
      toast({ title: editingAutomation ? "Automação atualizada!" : "Automação criada!" });
    }
  });

  const deleteAutomationMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/automations/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      refetchAutomations();
      toast({ title: "Automação excluída!" });
    }
  });

  const handleEditBenefit = (beneficio: any) => {
    setEditingBenefit(beneficio);
    setBenefitFormData({
      titulo: beneficio.titulo || '',
      descricao: beneficio.descricao || '',
      imagem: beneficio.imagem || '',
      categoria: beneficio.categoria || 'lazer',
      planosDisponiveis: beneficio.planosDisponiveis || ['eco'],
      ciclosPagamento: beneficio.ciclosPagamento || ['mensal'],
      pontosNecessarios: beneficio.pontosNecessarios || '',
      valorEstimado: beneficio.valorEstimado || 0,
      gritosMinimos: beneficio.gritosMinimos || 100,
      inicioLeilao: beneficio.inicioLeilao ? new Date(beneficio.inicioLeilao).toISOString().slice(0, 16) : '',
      prazoLances: beneficio.prazoLances ? new Date(beneficio.prazoLances).toISOString().slice(0, 16) : '',
      ativo: beneficio.ativo !== false,
      ordem: beneficio.ordem || 0
    });
    setShowBenefitForm(true);
  };

  const handleNewBenefit = () => {
    setEditingBenefit(null);
    setBenefitFormData({
      titulo: '',
      descricao: '',
      imagem: '',
      categoria: 'lazer',
      planosDisponiveis: ['eco'],
      ciclosPagamento: ['mensal'],
      pontosNecessarios: '',
      valorEstimado: 0,
      gritosMinimos: 100,
      inicioLeilao: '',
      prazoLances: '',
      ativo: true,
      ordem: 0
    });
    setShowBenefitForm(true);
  };

  const handleEditStory = (historia: any) => {
    setEditingStory(historia);
    setStoryFormData({
      titulo: historia.titulo || '',
      nome: historia.nome || '',
      texto: historia.texto || '',
      imagemBox: historia.imagemBox || '',
      imagemStory: historia.imagemStory || '',
      ativo: historia.ativo !== false,
      ordem: historia.ordem || 0
    });
    setShowStoryForm(true);
  };

  const handleNewStory = () => {
    setEditingStory(null);
    setStoryFormData({
      titulo: '',
      nome: '',
      texto: '',
      imagemBox: '',
      imagemStory: '',
      ativo: true,
      ordem: 0
    });
    setShowStoryForm(true);
  };

  const handleEditMission = (missao: any) => {
    setEditingMission(missao);
    setMissionFormData({
      titulo: missao.titulo || '',
      descricao: missao.descricao || '',
      recompensaGritos: missao.recompensaGritos || 150,
      tipoMissao: missao.tipoMissao || 'feedback',
      evidenceType: missao.evidenceType || 'comentario',
      imagemUrl: missao.imagemUrl || '',
      planoMinimo: missao.planoMinimo || 'eco',
      semanaInicio: missao.semanaInicio ? new Date(missao.semanaInicio).toISOString().split('T')[0] : '',
      semanaFim: missao.semanaFim ? new Date(missao.semanaFim).toISOString().split('T')[0] : '',
      ativo: missao.ativo !== false
    });
    setShowMissionForm(true);
  };

  const handleNewMission = () => {
    setEditingMission(null);
    setMissionFormData({
      titulo: '',
      descricao: '',
      recompensaGritos: 150,
      tipoMissao: 'feedback',
      evidenceType: 'comentario',
      imagemUrl: '',
      planoMinimo: 'eco',
      semanaInicio: '',
      semanaFim: '',
      ativo: true
    });
    setShowMissionForm(true);
  };

  const handleEditWebhook = (webhook: any) => {
    setEditingWebhook(webhook);
    setWebhookFormData({
      url: webhook.url || '',
      event_types: webhook.event_types || [],
      headers: webhook.headers ? JSON.stringify(webhook.headers, null, 2) : '',
      active: webhook.active !== false,
      description: webhook.description || ''
    });
    setShowWebhookForm(true);
  };

  const handleEditAutomation = (automation: any) => {
    setEditingAutomation(automation);
    setAutomationFormData({
      name: automation.name || '',
      trigger_event: automation.trigger_event || 'payment_success',
      webhook_url: automation.webhook_url || '',
      conditions: automation.conditions ? JSON.stringify(automation.conditions, null, 2) : '',
      active: automation.active !== false
    });
    setShowAutomationForm(true);
  };

  // Filter data based on search term
  const filteredBeneficios = beneficios.filter((item: any) =>
    item.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHistorias = historias.filter((item: any) =>
    item.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMissoes = missoes.filter((item: any) =>
    item.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tipoMissao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para verificar se um leilão está ativo
  const isAuctionActive = (beneficio: any) => {
    if (!beneficio.ativo) return false;
    
    const now = new Date();
    const inicioLeilao = beneficio.inicioLeilao ? new Date(beneficio.inicioLeilao) : null;
    const prazoLances = beneficio.prazoLances ? new Date(beneficio.prazoLances) : null;
    
    // Se não tem data de início ou prazo, não é um leilão
    if (!inicioLeilao || !prazoLances) return false;
    
    // Verifica se está dentro do período do leilão
    return now >= inicioLeilao && now <= prazoLances;
  };

  // Identificar leilões ativos
  const leiloesAtivos = beneficios.filter(isAuctionActive);
  const proximoLeilao = beneficios
    .filter((b: any) => b.ativo && b.inicioLeilao && new Date(b.inicioLeilao) > new Date())
    .sort((a: any, b: any) => new Date(a.inicioLeilao).getTime() - new Date(b.inicioLeilao).getTime())[0];

  const filteredDoadores = doadores.filter((item: any) =>
    item.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.plano?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      className="min-h-screen bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation('/')}
              className="flex items-center gap-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </Button>
            <Logo size="md" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Dev-Marketing</h1>
              <p className="text-sm text-gray-600">Painel administrativo completo</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => window.open('/pagamento/ingresso', '_blank')}
              className="flex items-center gap-2"
              data-testid="button-ingresso"
            >
              <Ticket className="w-4 h-4" />
              Página Ingresso
            </Button>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
              data-testid="button-refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="benefits" className="w-full">
            <div className="bg-white rounded-lg p-2">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 gap-2 bg-transparent h-auto">
                <TabsTrigger 
                  value="benefits" 
                  className="flex flex-col items-center gap-1 p-3 text-xs font-medium h-auto min-h-[60px] data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200" 
                  data-testid="tab-benefits"
                >
                  <Gift className="w-5 h-5" />
                  <span className="text-center leading-tight">Benefícios</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="stories" 
                  className="flex flex-col items-center gap-1 p-3 text-xs font-medium h-auto min-h-[60px] data-[state=active]:bg-pink-50 data-[state=active]:text-pink-700 data-[state=active]:border-pink-200" 
                  data-testid="tab-stories"
                >
                  <Heart className="w-5 h-5" />
                  <span className="text-center leading-tight">Histórias</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="auctions" 
                  className="flex flex-col items-center gap-1 p-3 text-xs font-medium h-auto min-h-[60px] data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:border-orange-200" 
                  data-testid="tab-auctions"
                >
                  <Target className="w-5 h-5" />
                  <span className="text-center leading-tight">Leilões</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="missions" 
                  className="flex flex-col items-center gap-1 p-3 text-xs font-medium h-auto min-h-[60px] data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-green-200" 
                  data-testid="tab-missions"
                >
                  <Calendar className="w-5 h-5" />
                  <span className="text-center leading-tight">Missões</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="automation" 
                  className="flex flex-col items-center gap-1 p-3 text-xs font-medium h-auto min-h-[60px] data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:border-purple-200" 
                  data-testid="tab-automation"
                >
                  <Settings className="w-5 h-5" />
                  <span className="text-center leading-tight">Automação</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-8 gap-2 bg-transparent h-auto mt-2">
                <TabsTrigger 
                  value="donors" 
                  className="flex flex-col items-center gap-1 p-3 text-xs font-medium h-auto min-h-[60px] data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:border-indigo-200" 
                  data-testid="tab-donors"
                >
                  <Users className="w-5 h-5" />
                  <span className="text-center leading-tight">Doadores</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="stripe" 
                  className="flex flex-col items-center gap-1 p-3 text-xs font-medium h-auto min-h-[60px] data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-700 data-[state=active]:border-yellow-200" 
                  data-testid="tab-stripe"
                >
                  <DollarSign className="w-5 h-5" />
                  <span className="text-center leading-tight">Stripe</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="management" 
                  className="flex flex-col items-center gap-1 p-3 text-xs font-medium h-auto min-h-[60px] data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:border-teal-200" 
                  data-testid="tab-management"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="text-center leading-tight">Visão Gerencial</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="gestao-vista" 
                  className="flex flex-col items-center gap-1 p-3 text-xs font-medium h-auto min-h-[60px] data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-700 data-[state=active]:border-cyan-200" 
                  data-testid="tab-gestao-vista"
                >
                  <Activity className="w-5 h-5" />
                  <span className="text-center leading-tight">Gestão à Vista</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="pagamentos-ingressos" 
                  className="flex flex-col items-center gap-1 p-3 text-xs font-medium h-auto min-h-[60px] data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:border-emerald-200" 
                  data-testid="tab-pagamentos-ingressos"
                >
                  <Ticket className="w-5 h-5" />
                  <span className="text-center leading-tight">Pag. Stripe</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="pagamentos-cielo" 
                  className="flex flex-col items-center gap-1 p-3 text-xs font-medium h-auto min-h-[60px] data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200" 
                  data-testid="tab-pagamentos-cielo"
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-center leading-tight">Pag. Cielo</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="compradores-avulsos" 
                  className="flex flex-col items-center gap-1 p-3 text-xs font-medium h-auto min-h-[60px] data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700 data-[state=active]:border-rose-200" 
                  data-testid="tab-compradores-avulsos"
                >
                  <Phone className="w-5 h-5" />
                  <span className="text-center leading-tight">Compradores Avulsos</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="estatisticas-ingressos" 
                  className="flex flex-col items-center gap-1 p-3 text-xs font-medium h-auto min-h-[60px] data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-700 data-[state=active]:border-cyan-200" 
                  data-testid="tab-estatisticas-ingressos"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="text-center leading-tight">Estatísticas Ingressos</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="marketing-links" 
                  className="flex flex-col items-center gap-1 p-3 text-xs font-medium h-auto min-h-[60px] data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:border-indigo-200" 
                  data-testid="tab-marketing-links"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span className="text-center leading-tight">Marketing Links</span>
                </TabsTrigger>
              </TabsList>

              <TabsList className="grid w-full grid-cols-1 lg:grid-cols-4 gap-2 bg-transparent h-auto mt-2">
                <TabsTrigger 
                  value="converter-doacoes" 
                  className="flex flex-col items-center gap-1 p-3 text-xs font-medium h-auto min-h-[60px] data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:border-purple-200" 
                  data-testid="tab-converter-doacoes"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span className="text-center leading-tight">🔄 Converter Doações</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Benefits Tab */}
            <TabsContent value="benefits" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Benefícios</h2>
                  <p className="text-gray-600">Gerencie todos os benefícios disponíveis na plataforma</p>
                </div>
                <Button onClick={handleNewBenefit} className="flex items-center gap-2" data-testid="btn-new-benefit">
                  <Plus className="w-4 h-4" />
                  Novo Benefício
                </Button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Gift className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-600">Total de Benefícios</p>
                        <p className="text-2xl font-bold">{filteredBeneficios.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-600">Ativos</p>
                        <p className="text-2xl font-bold">
                          {filteredBeneficios.filter((b: any) => b.ativo).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Target className="w-8 h-8 text-orange-500" />
                      <div>
                        <p className="text-sm text-gray-600">Categorias</p>
                        <p className="text-2xl font-bold">
                          {new Set(filteredBeneficios.map((b: any) => b.categoria)).size}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-8 h-8 text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-600">Disponíveis</p>
                        <p className="text-2xl font-bold">
                          {filteredBeneficios.filter((b: any) => b.ativo).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Benefits List */}
              <div className="space-y-4">
                {loadingBeneficios ? (
                  [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
                ) : filteredBeneficios.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Gift className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Nenhum benefício encontrado</p>
                  </div>
                ) : (
                  filteredBeneficios.map((beneficio: any) => (
                    <Card key={beneficio.id} className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{beneficio.titulo}</h3>
                            <Badge variant={beneficio.ativo ? "default" : "secondary"}>
                              {beneficio.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                            <Badge variant="outline">{beneficio.categoria}</Badge>
                          </div>
                          <p className="text-gray-600 mb-3">{beneficio.descricao}</p>
                          <div className="flex gap-4 text-sm text-gray-500">
                            <span>Gritos mínimos: {beneficio.gritosMinimos || 0}</span>
                            <span>Planos: {beneficio.planosDisponiveis?.join(', ') || 'eco'}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditBenefit(beneficio)}
                            data-testid={`btn-edit-benefit-${beneficio.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteBenefitMutation.mutate(beneficio.id)}
                            data-testid={`btn-delete-benefit-${beneficio.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Inspiring Stories Tab */}
            <TabsContent value="stories" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Histórias Inspiradoras</h2>
                  <p className="text-gray-600">Gerencie todas as histórias inspiradoras da plataforma</p>
                </div>
                <Button onClick={handleNewStory} className="flex items-center gap-2" data-testid="btn-new-story">
                  <Plus className="w-4 h-4" />
                  Nova História
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Heart className="w-8 h-8 text-red-500" />
                      <div>
                        <p className="text-sm text-gray-600">Total de Histórias</p>
                        <p className="text-2xl font-bold">{filteredHistorias.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-600">Ativas</p>
                        <p className="text-2xl font-bold">
                          {filteredHistorias.filter((h: any) => h.ativo).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-600">Autores</p>
                        <p className="text-2xl font-bold">
                          {new Set(filteredHistorias.map((h: any) => h.autor)).size}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Eye className="w-8 h-8 text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-600">Total Slides</p>
                        <p className="text-2xl font-bold">
                          {filteredHistorias.reduce((sum: number, h: any) => sum + (h.total_slides || 0), 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                {loadingHistorias ? (
                  [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
                ) : filteredHistorias.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Nenhuma história encontrada</p>
                  </div>
                ) : (
                  filteredHistorias.map((historia: any) => {
                    const analytics = historiasAnalytics?.historias?.find((h: any) => h.id === historia.id);
                    const stats = analytics?.stats || { curtidas: 0, comentarios: 0, compartilhamentos: 0, total: 0 };
                    
                    return (
                    <Card key={historia.id} className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{historia.titulo}</h3>
                            <Badge variant={historia.ativo ? "default" : "secondary"}>
                              {historia.ativo ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-2">Por: {historia.nome || historia.autor}</p>
                          <p className="text-gray-600 mb-3">{historia.texto?.substring(0, 200)}...</p>
                          
                          {/* Indicadores de Engajamento */}
                          <div className="flex items-center gap-6 mb-3 text-sm">
                            <div className="flex items-center gap-1 text-red-500">
                              <Heart className="h-4 w-4" />
                              <span className="font-medium">{stats.curtidas}</span>
                              <span className="text-gray-500">curtidas</span>
                            </div>
                            <div className="flex items-center gap-1 text-blue-500">
                              <MessageCircle className="h-4 w-4" />
                              <span className="font-medium">{stats.comentarios}</span>
                              <span className="text-gray-500">comentários</span>
                            </div>
                            <div className="flex items-center gap-1 text-green-500">
                              <Share2 className="h-4 w-4" />
                              <span className="font-medium">{stats.compartilhamentos}</span>
                              <span className="text-gray-500">compartilhamentos</span>
                            </div>
                            <div className="flex items-center gap-1 text-purple-600 font-semibold">
                              <TrendingUp className="h-4 w-4" />
                              <span>{stats.total} total</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-4 text-sm text-gray-500">
                            <span>Slides: {historia.total_slides || 0}</span>
                            <span>Ordem: {historia.ordem || 0}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditStory(historia)}
                            data-testid={`btn-edit-story-${historia.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteStoryMutation.mutate(historia.id)}
                            data-testid={`btn-delete-story-${historia.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>

            {/* Auctions Tab */}
            <TabsContent value="auctions" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Gestão de Leilões de Benefícios</h2>
                  <p className="text-gray-600">Gerencie todos os lances de benefícios da plataforma</p>
                </div>
              </div>

              {/* Resumo Geral - Cards Compactos */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-green-600">Ativos</p>
                        <p className="text-2xl font-bold text-green-700">
                          {auctionsSummary.data?.leiloesAtivos || 0}
                        </p>
                      </div>
                      <Activity className="w-8 h-8 text-green-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-yellow-600">Aguardando</p>
                        <p className="text-2xl font-bold text-yellow-700">
                          {auctionsSummary.data?.leiloesAguardando || 0}
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600">Finalizados</p>
                        <p className="text-2xl font-bold text-gray-700">
                          {auctionsSummary.data?.leiloesFinalizados || 0}
                        </p>
                      </div>
                      <Trophy className="w-8 h-8 text-gray-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-purple-600">Participantes</p>
                        <p className="text-2xl font-bold text-purple-700">
                          {auctionsStats.data?.usuariosParticipando || 0}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-purple-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de Leilões com Tabs */}
              {!loadingLeiloesDetalhes && leiloesDetalhes.leiloes && leiloesDetalhes.leiloes.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Leilões</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => refetchLeiloesDetalhes()}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Atualizar
                    </Button>
                  </div>

                  <Tabs defaultValue="ativos" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 max-w-md">
                      <TabsTrigger value="ativos">
                        Ativos ({leiloesDetalhes.leiloes.filter((l: any) => l.statusLeilao === 'ativo').length})
                      </TabsTrigger>
                      <TabsTrigger value="aguardando">
                        Aguardando ({leiloesDetalhes.leiloes.filter((l: any) => l.statusLeilao === 'aguardando').length})
                      </TabsTrigger>
                      <TabsTrigger value="finalizados">
                        Finalizados ({leiloesDetalhes.leiloes.filter((l: any) => l.statusLeilao === 'finalizado').length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="ativos" className="space-y-2 mt-4">
                      {leiloesDetalhes.leiloes
                        .filter((l: any) => l.statusLeilao === 'ativo')
                        .map((leilao: any) => (
                          <LeilaoCard key={leilao.beneficio.id} leilao={leilao} />
                        ))
                      }
                      {leiloesDetalhes.leiloes.filter((l: any) => l.statusLeilao === 'ativo').length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Nenhum leilão ativo</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="aguardando" className="space-y-2 mt-4">
                      {leiloesDetalhes.leiloes
                        .filter((l: any) => l.statusLeilao === 'aguardando')
                        .map((leilao: any) => (
                          <LeilaoCard key={leilao.beneficio.id} leilao={leilao} />
                        ))
                      }
                      {leiloesDetalhes.leiloes.filter((l: any) => l.statusLeilao === 'aguardando').length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Nenhum leilão aguardando</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="finalizados" className="space-y-2 mt-4">
                      {leiloesDetalhes.leiloes
                        .filter((l: any) => l.statusLeilao === 'finalizado')
                        .map((leilao: any) => (
                          <LeilaoCard key={leilao.beneficio.id} leilao={leilao} />
                        ))
                      }
                      {leiloesDetalhes.leiloes.filter((l: any) => l.statusLeilao === 'finalizado').length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Nenhum leilão finalizado</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {/* Gerenciamento de Benefícios */}
              {beneficios.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Gerenciar Benefícios</h3>
                  
                  {leiloesAtivos.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-green-600 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Leilões Ativos ({leiloesAtivos.length})
                      </h4>
                      {leiloesAtivos.map((beneficio: any) => {
                        const tempoRestante = new Date(beneficio.prazoLances).getTime() - Date.now();
                        const diasRestantes = Math.ceil(tempoRestante / (1000 * 60 * 60 * 24));
                        
                        return (
                          <Card key={beneficio.id} className="border-green-200">
                            <CardContent className="p-3">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium text-gray-900">{beneficio.titulo}</p>
                                  <p className="text-xs text-gray-500">
                                    Termina em: {diasRestantes > 0 ? `${diasRestantes} dias` : 'Menos de 1 dia'}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditBenefit(beneficio)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteBenefitMutation.mutate(beneficio.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                  
                  {proximoLeilao && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-blue-600 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Próximo Leilão
                      </h4>
                      <Card className="border-blue-200">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-900">{proximoLeilao.titulo}</p>
                              <p className="text-xs text-gray-500">
                                Inicia em: {new Date(proximoLeilao.inicioLeilao).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  
                  {/* Leilões Expirados */}
                  {beneficios.filter((b: any) => b.ativo && b.prazoLances && new Date(b.prazoLances) < new Date()).length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-md font-medium text-red-600 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Leilões Expirados
                      </h4>
                      {beneficios
                        .filter((b: any) => b.ativo && b.prazoLances && new Date(b.prazoLances) < new Date())
                        .map((beneficio: any) => (
                          <Card key={beneficio.id} className="border-red-300 bg-red-50">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-semibold text-red-800">{beneficio.titulo}</h4>
                                    <Badge className="bg-red-600">EXPIRADO</Badge>
                                  </div>
                                  <div className="text-sm text-red-700">
                                    <p>🔚 Expirou em: {new Date(beneficio.prazoLances).toLocaleString('pt-BR')}</p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Estatísticas Avançadas dos Lances */}
              <div className="space-y-6">
                {loadingLances ? (
                  [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
                ) : lances.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Gavel className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Nenhum lance encontrado</p>
                  </div>
                ) : (
                  <>
                    {/* Estatísticas Gerais */}
                    <Card className="border-purple-300 bg-purple-50">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                          <BarChart3 className="w-5 h-5" />
                          Análise Completa dos Lances
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-purple-600">Total de Gritos Investidos</p>
                            <p className="text-2xl font-bold text-purple-900">
                              {lances.reduce((sum: number, l: any) => sum + (l.pontosOfertados || 0), 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-purple-600">Participantes Únicos</p>
                            <p className="text-2xl font-bold text-purple-900">
                              {new Set(lances.map((l: any) => l.userId)).size}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-purple-600">Lance Mais Alto</p>
                            <p className="text-2xl font-bold text-purple-900">
                              {Math.max(...lances.map((l: any) => l.pontosOfertados || 0))}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-purple-600">Média por Lance</p>
                            <p className="text-2xl font-bold text-purple-900">
                              {Math.round(lances.reduce((sum: number, l: any) => sum + (l.pontosOfertados || 0), 0) / lances.length)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Leilões Finalizados com Vencedores */}
                    {(() => {
                      const leiloesFinalizados = beneficios.filter((b: any) => 
                        b.ativo && b.prazoLances && new Date(b.prazoLances) < new Date()
                      );
                      
                      if (leiloesFinalizados.length > 0) {
                        return (
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                              <Trophy className="w-5 h-5 text-yellow-500" />
                              Leilões Finalizados - Vencedores
                            </h3>
                            {leiloesFinalizados.map((beneficio: any) => {
                              const lancesDesteLeilao = lances.filter((l: any) => l.beneficioId === beneficio.id);
                              // Ordenar por pontos ofertados (maior primeiro) - garantir conversão numérica
                              const lancesOrdenados = [...lancesDesteLeilao].sort((a: any, b: any) => {
                                const pontosA = Number(a.pontosOfertados) || 0;
                                const pontosB = Number(b.pontosOfertados) || 0;
                                return pontosB - pontosA;
                              });
                              const vencedor = lancesOrdenados[0];
                              
                              /* console.log('🏆 [VENCEDOR DEBUG]', {
                                beneficio: beneficio.titulo,
                                totalLances: lancesDesteLeilao.length,
                                lances: lancesDesteLeilao.map((l: any) => ({ 
                                  nome: l.userName, 
                                  pontos: l.pontosOfertados,
                                  tipo: typeof l.pontosOfertados 
                                })),
                                vencedor: vencedor ? { 
                                  nome: vencedor.userName, 
                                  pontos: vencedor.pontosOfertados 
                                } : null
                              }); */
                              
                              return (
                                <Card key={beneficio.id} className="border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50">
                                  <CardContent className="p-6">
                                    <div className="flex items-start gap-6">
                                      <div className="flex-shrink-0">
                                        <Trophy className="w-16 h-16 text-yellow-500" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                          <h4 className="text-xl font-bold text-yellow-900">{beneficio.titulo}</h4>
                                          <Badge className="bg-yellow-600">FINALIZADO</Badge>
                                        </div>
                                        {vencedor ? (
                                          <div className="space-y-2">
                                            <div className="flex items-center gap-4 text-yellow-800">
                                              <div className="flex items-center gap-2">
                                                <Users className="w-5 h-5" />
                                                <span className="font-semibold text-lg">{vencedor.userName || 'Usuário desconhecido'}</span>
                                              </div>
                                              {vencedor.userTelefone && (
                                                <div className="flex items-center gap-2">
                                                  <Phone className="w-4 h-4" />
                                                  <span className="text-sm">{vencedor.userTelefone}</span>
                                                </div>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-6 text-sm text-yellow-700">
                                              <div className="flex items-center gap-2">
                                                <Star className="w-4 h-4" />
                                                <span className="font-bold">{vencedor.pontosOfertados} Gritos</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <CreditCard className="w-4 h-4" />
                                                <span>Plano: {vencedor.userPlano?.toUpperCase() || 'ECO'}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>{new Date(vencedor.dataLance).toLocaleString('pt-BR')}</span>
                                              </div>
                                            </div>
                                            <p className="text-xs text-yellow-600 mt-2">
                                              🏆 Venceu com {lancesDesteLeilao.length} participante{lancesDesteLeilao.length !== 1 ? 's' : ''} no total
                                            </p>
                                          </div>
                                        ) : (
                                          <p className="text-yellow-700">Nenhum lance registrado para este leilão</p>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Tabela Detalhada de Todos os Lances */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-500" />
                        Todos os Lances - Detalhamento Completo
                      </h3>
                      <div className="bg-white rounded-lg border overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posição</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participante</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plano</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Benefício</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gritos</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {lances
                                .sort((a: any, b: any) => b.pontosOfertados - a.pontosOfertados)
                                .slice(0, 50)
                                .map((lance: any, index: number) => (
                                  <tr key={lance.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div className="flex items-center gap-2">
                                        {index === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                                        {index === 1 && <Trophy className="w-4 h-4 text-gray-400" />}
                                        {index === 2 && <Trophy className="w-4 h-4 text-orange-600" />}
                                        <span className="font-medium text-gray-900">#{index + 1}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-gray-400" />
                                        <div>
                                          <p className="font-medium text-gray-900">{lance.userName || 'Usuário desconhecido'}</p>
                                          <p className="text-xs text-gray-500">ID: {lance.userId}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      {lance.userTelefone ? (
                                        <div className="flex items-center gap-1 text-sm text-gray-700">
                                          <Phone className="w-3 h-3" />
                                          {lance.userTelefone}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400 text-sm">-</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3">
                                      <Badge variant="outline" className="text-xs">
                                        {lance.userPlano?.toUpperCase() || 'ECO'}
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div>
                                        <p className="font-medium text-gray-900 text-sm">{lance.beneficioTitulo || 'Benefício removido'}</p>
                                        {lance.beneficioCategoria && (
                                          <p className="text-xs text-gray-500">{lance.beneficioCategoria}</p>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-1">
                                        <Star className="w-4 h-4 text-yellow-500" />
                                        <span className="font-bold text-gray-900">{lance.pontosOfertados}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <Badge variant={lance.status === 'ativo' ? 'default' : 'secondary'} className="text-xs">
                                        {lance.status === 'ativo' ? 'Ativo' : lance.status}
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                      {new Date(lance.dataLance).toLocaleDateString('pt-BR', { 
                                        day: '2-digit', 
                                        month: '2-digit',
                                        year: '2-digit'
                                      })}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      {lances.length > 50 && (
                        <p className="text-sm text-gray-500 text-center">
                          Mostrando os primeiros 50 de {lances.length} lances totais
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Mission Management Tab */}
            <TabsContent value="missions" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Gestão de Missões</h2>
                  <p className="text-gray-600">Gerencie todas as missões disponíveis na plataforma</p>
                </div>
                <Button onClick={handleNewMission} className="flex items-center gap-2" data-testid="btn-new-mission">
                  <Plus className="w-4 h-4" />
                  Nova Missão
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-600">Total de Missões</p>
                        <p className="text-2xl font-bold">{filteredMissoes.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-600">Ativas</p>
                        <p className="text-2xl font-bold">
                          {filteredMissoes.filter((m: any) => m.ativo).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Users className="w-8 h-8 text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-600">Participantes</p>
                        <p className="text-2xl font-bold">
                          {filteredMissoes.reduce((sum: number, m: any) => sum + (m.participantes || 0), 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Star className="w-8 h-8 text-yellow-500" />
                      <div>
                        <p className="text-sm text-gray-600">Gritos Totais</p>
                        <p className="text-2xl font-bold">
                          {filteredMissoes.reduce((sum: number, m: any) => sum + (m.recompensaGritos || m.gritos || 0), 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                {loadingMissoes ? (
                  [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
                ) : filteredMissoes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Nenhuma missão encontrada</p>
                  </div>
                ) : (
                  filteredMissoes.map((missao: any) => (
                    <Card key={missao.id} className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{missao.titulo}</h3>
                            <Badge variant={missao.ativo ? "default" : "secondary"}>
                              {missao.ativo ? 'Ativa' : 'Inativa'}
                            </Badge>
                            <Badge variant="outline">{missao.categoria}</Badge>
                            <Badge variant="outline">{missao.tipo}</Badge>
                          </div>
                          <p className="text-gray-600 mb-3">{missao.descricao}</p>
                          <div className="flex gap-4 text-sm text-gray-500">
                            <span>Recompensa: {missao.recompensaGritos || missao.gritos} gritos</span>
                            <span>Participantes: {missao.participantes || 0}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditMission(missao)}
                            data-testid={`btn-edit-mission-${missao.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMissionMutation.mutate(missao.id)}
                            data-testid={`btn-delete-mission-${missao.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Automation & Webhooks Tab */}
            <TabsContent value="automation" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Automação & Webhooks</h2>
                  <p className="text-gray-600">Configure webhooks e automações para integração com ferramentas externas (n8n, Zapier, etc.)</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowWebhookForm(true)} className="flex items-center gap-2" data-testid="btn-new-webhook">
                    <Plus className="w-4 h-4" />
                    Novo Webhook
                  </Button>
                  <Button onClick={() => setShowAutomationForm(true)} variant="outline" className="flex items-center gap-2" data-testid="btn-new-automation">
                    <Plus className="w-4 h-4" />
                    Nova Automação
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <ExternalLink className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-600">Webhooks Ativos</p>
                        <p className="text-2xl font-bold">{automationStats.active_webhooks || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Settings className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-600">Automações</p>
                        <p className="text-2xl font-bold">{automationStats.total_automations || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Activity className="w-8 h-8 text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-600">Entregas</p>
                        <p className="text-2xl font-bold">{automationStats.total_deliveries || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                        <p className="text-2xl font-bold">{automationStats.success_rate || 0}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-8 h-8 text-yellow-500" />
                      <div>
                        <p className="text-sm text-gray-600">Eventos Hoje</p>
                        <p className="text-2xl font-bold">{events.filter((e: any) => new Date(e.created_at).toDateString() === new Date().toDateString()).length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content - Two Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Webhooks Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Webhooks Configurados</h3>
                    <Badge variant="outline">{webhookSubscriptions.length} total</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {loadingWebhooks ? (
                      [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
                    ) : webhookSubscriptions.length === 0 ? (
                      <Card className="p-6 text-center">
                        <ExternalLink className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-500">Nenhum webhook configurado</p>
                        <p className="text-sm text-gray-400 mt-1">Configure webhooks para integrar com n8n, Zapier e outras ferramentas</p>
                      </Card>
                    ) : (
                      webhookSubscriptions.map((webhook: any) => (
                        <Card key={webhook.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{webhook.description || 'Webhook #' + webhook.id}</h4>
                                <Badge variant={webhook.active ? "default" : "secondary"}>
                                  {webhook.active ? 'Ativo' : 'Inativo'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{webhook.url}</p>
                              <div className="flex flex-wrap gap-1">
                                {webhook.event_types?.map((eventType: string) => (
                                  <Badge key={eventType} variant="outline" className="text-xs">
                                    {eventType}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-1 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditWebhook(webhook)}
                                data-testid={`btn-edit-webhook-${webhook.id}`}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteWebhookMutation.mutate(webhook.id)}
                                data-testid={`btn-delete-webhook-${webhook.id}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>

                {/* Automations Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Automações</h3>
                    <Badge variant="outline">{automations.length} total</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {loadingAutomations ? (
                      [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
                    ) : automations.length === 0 ? (
                      <Card className="p-6 text-center">
                        <Settings className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-500">Nenhuma automação configurada</p>
                        <p className="text-sm text-gray-400 mt-1">Crie automações baseadas em eventos do sistema</p>
                      </Card>
                    ) : (
                      automations.map((automation: any) => (
                        <Card key={automation.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{automation.name}</h4>
                                <Badge variant={automation.active ? "default" : "secondary"}>
                                  {automation.active ? 'Ativa' : 'Inativa'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">
                                Evento: <code className="bg-gray-100 px-1 rounded">{automation.trigger_event}</code>
                              </p>
                              <p className="text-sm text-gray-500">{automation.webhook_url}</p>
                            </div>
                            <div className="flex gap-1 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditAutomation(automation)}
                                data-testid={`btn-edit-automation-${automation.id}`}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteAutomationMutation.mutate(automation.id)}
                                data-testid={`btn-delete-automation-${automation.id}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Events & Webhook Deliveries */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Recent Events */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Eventos Recentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {loadingEvents ? (
                        [...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
                      ) : events.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">Nenhum evento registrado</p>
                      ) : (
                        events.slice(0, 10).map((event: any) => (
                          <div key={event.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium text-sm">{event.event_type}</p>
                              <p className="text-xs text-gray-500">{new Date(event.created_at).toLocaleString('pt-BR')}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {event.id}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Webhook Deliveries */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ExternalLink className="w-5 h-5" />
                      Entregas de Webhooks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {loadingDeliveries ? (
                        [...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
                      ) : webhookDeliveries.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">Nenhuma entrega registrada</p>
                      ) : (
                        webhookDeliveries.slice(0, 10).map((delivery: any) => (
                          <div key={delivery.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium text-sm">Webhook #{delivery.webhook_subscription_id}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(delivery.created_at).toLocaleString('pt-BR')} • HTTP {delivery.response_status}
                              </p>
                            </div>
                            <Badge variant={delivery.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                              {delivery.status}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Donor Dashboard Tab */}
            <TabsContent value="donors" className="space-y-6 mt-6">
              {/* Debug info */}
              {(errorDonorStats || errorDoadores) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <h4 className="text-red-800 font-semibold">Erros detectados:</h4>
                  {errorDonorStats && <p className="text-red-700">Erro donor stats: {String(errorDonorStats)}</p>}
                  {errorDoadores && <p className="text-red-700">Erro doadores: {String(errorDoadores)}</p>}
                </div>
              )}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Dashboard de Doadores</h2>
                  <p className="text-gray-600">Acompanhe métricas e estatísticas dos doadores</p>
                </div>
                <Button data-testid="btn-export-donors">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Users className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-600">Doadores Ativos</p>
                        <p className="text-2xl font-bold">{donorStats.totalAtivos || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-600">Missões Completadas</p>
                        <p className="text-2xl font-bold">{donorStats.quantidadeMissoes || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-8 h-8 text-orange-500" />
                      <div>
                        <p className="text-sm text-gray-600">Check-ins Diários</p>
                        <p className="text-2xl font-bold">{donorStats.quantidadeCheckinDiario || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-8 h-8 text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-600">Engajamento Médio</p>
                        <p className="text-2xl font-bold">{donorStats.engajamentoMedio || 0}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Lista de Doadores</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCrmModal(true)}
                      data-testid="button-ver-detalhes-dashboard"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Dashboard Detalhado
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => syncStripeMutation.mutate()}
                      disabled={syncingStripe}
                      data-testid="button-sync-stripe"
                    >
                      {syncingStripe ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      {syncingStripe ? 'Sincronizando...' : 'Sincronizar Stripe'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => syncPlansMutation.mutate()}
                      disabled={syncingPlans}
                      data-testid="button-sync-plans"
                      className="bg-purple-50 hover:bg-purple-100"
                    >
                      {syncingPlans ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      {syncingPlans ? 'Sincronizando Planos...' : 'Sincronizar Planos'}
                    </Button>
                  </div>
                </div>
                {loadingDoadores ? (
                  [...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
                ) : filteredDoadores.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Nenhum doador encontrado</p>
                  </div>
                ) : (
                  // Ordenar doadores por data de início e adicionar número sequencial
                  filteredDoadores
                    .sort((a: any, b: any) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime())
                    .map((doador: any, index: number) => (
                    <Card key={doador.id} className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-mono text-gray-500">#{index + 1}</span>
                            <h3 className="text-lg font-semibold">{doador.nome}</h3>
                            <Badge variant="outline">{doador.plano?.charAt(0).toUpperCase() + doador.plano?.slice(1) || 'N/A'}</Badge>
                            <Badge variant={doador.status === 'paid' ? "default" : "secondary"}>
                              {doador.status === 'paid' ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span>{doador.telefone || 'Não informado'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span>{doador.email || 'Não informado'}</span>
                            </div>
                          </div>
                          <div className="flex gap-4 text-sm text-gray-500">
                            <span>💰 Valor: R$ {doador.valor ? Number(doador.valor).toFixed(2) : '0.00'}</span>
                            <span>📅 Início: {new Date(doador.dataInicio).toLocaleDateString('pt-BR')}</span>
                            {doador.ultimaDoacao && (
                              <span>✅ Último pagamento: {new Date(doador.ultimaDoacao).toLocaleDateString('pt-BR')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Stripe Tab */}
            <TabsContent value="stripe" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Gestão Stripe</h2>
                  <p className="text-gray-600">Configurações e métricas do Stripe</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-600">Total de Pagamentos</p>
                        <p className="text-2xl font-bold">{stripeMetrics.totalPayments || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-600">Receita Mensal</p>
                        <p className="text-2xl font-bold">R$ {stripeMetrics.monthlyRevenue || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-8 h-8 text-red-500" />
                      <div>
                        <p className="text-sm text-gray-600">Pagamentos Falhos</p>
                        <p className="text-2xl font-bold">{stripeMetrics.failedPayments || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                        <p className="text-2xl font-bold">{stripeMetrics.successRate || 0}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Stripe Key Manager Component */}
              <StripeKeyManager 
                title="Configuração das Chaves Stripe"
                allowEdit={true}
                onKeysUpdated={() => {
                  toast({ title: 'Chaves Stripe atualizadas com sucesso!' });
                }}
              />
            </TabsContent>

            {/* Management View Tab */}
            <TabsContent value="management" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Visão de Gestão</h2>
                  <p className="text-gray-600">Indicadores principais do Instituto O Grito</p>
                </div>
              </div>

              {loadingManagement ? (
                <div className="flex justify-center items-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Carregando dados de gestão...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Indicadores principais */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6">
                      <h3 className="font-semibold text-lg mb-4">Casa Sonhar</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Crianças atendidas</span>
                          <span className="font-semibold">{managementData?.indicators?.criancas_atendidas || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Atividades realizadas</span>
                          <span className="font-semibold">{managementData?.indicators?.atividades_realizadas || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Refeições servidas</span>
                          <span className="font-semibold">{managementData?.indicators?.refeicoes_servidas || 0}</span>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6">
                      <h3 className="font-semibold text-lg mb-4">Polo Esportivo Cultural</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Jovens participantes</span>
                          <span className="font-semibold">{managementData?.indicators?.jovens_participantes || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Modalidades oferecidas</span>
                          <span className="font-semibold">{managementData?.indicators?.modalidades_oferecidas || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Eventos realizados</span>
                          <span className="font-semibold">{managementData?.indicators?.eventos_realizados || 0}</span>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6">
                      <h3 className="font-semibold text-lg mb-4">Redes Sociais</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Instagram</span>
                          <span className="font-semibold">{managementData?.indicators?.seguidores_instagram || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Facebook</span>
                          <span className="font-semibold">{managementData?.indicators?.seguidores_facebook || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">TikTok</span>
                          <span className="font-semibold">{managementData?.indicators?.seguidores_tiktok || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Engajamento</span>
                          <span className="font-semibold">{managementData?.indicators?.engajamento_total || 0}</span>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Métricas adicionais */}
                  <Card className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Métricas Gerais</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{managementData?.indicators?.reels_publicados || 0}</p>
                        <p className="text-sm text-gray-600">Reels publicados</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{managementData?.indicators?.posts_feed || 0}</p>
                        <p className="text-sm text-gray-600">Posts no feed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{managementData?.indicators?.eventos_realizados || 0}</p>
                        <p className="text-sm text-gray-600">Eventos realizados</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">{managementData?.indicators?.parcerias_ativas || 0}</p>
                        <p className="text-sm text-gray-600">Parcerias ativas</p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Nova aba: Gestão à Vista */}
            <TabsContent value="gestao-vista" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Gestão à Vista</h2>
                  <p className="text-gray-600">Sistema Meta × Realizado com controle por Programa/Projeto</p>
                  {gvMetaRealizado?.statistics && (
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-green-600 font-medium">
                        Verde: {gvMetaRealizado.statistics.verde_count}
                      </span>
                      <span className="text-yellow-600 font-medium">
                        Amarelo: {gvMetaRealizado.statistics.amarelo_count}
                      </span>
                      <span className="text-red-600 font-medium">
                        Vermelho: {gvMetaRealizado.statistics.vermelho_count}
                      </span>
                      <span className="text-gray-600">
                        Total: {gvMetaRealizado.statistics.total_indicators} indicadores
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex items-center gap-2" disabled>
                    <Upload className="h-4 w-4" />
                    Importar CSV
                  </Button>
                  <Button className="flex items-center gap-2" disabled>
                    <Plus className="h-4 w-4" />
                    Novo Indicador
                  </Button>
                </div>
              </div>

              {/* Filtros */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Filtros</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <Label>Escopo</Label>
                    <Select value={gvScope} onValueChange={setGvScope}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="semiannual">Semestral</SelectItem>
                        <SelectItem value="annual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Período</Label>
                    <Input 
                      type="month" 
                      value={gvPeriod}
                      onChange={(e) => setGvPeriod(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Programa</Label>
                    <Select value={gvSectorSlug} onValueChange={setGvSectorSlug}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Programas</SelectItem>
                        {gvSetores?.data?.map((setor: any) => (
                          <SelectItem key={setor.slug} value={setor.slug}>
                            {setor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Projeto</Label>
                    <Select value={gvProjectSlug} onValueChange={setGvProjectSlug}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Projetos</SelectItem>
                        {gvProjetos?.data?.map((projeto: any) => (
                          <SelectItem key={projeto.slug} value={projeto.slug}>
                            {projeto.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status RAG</Label>
                    <Select value={gvRagFilter} onValueChange={setGvRagFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="Verde">Verde (≥100%)</SelectItem>
                        <SelectItem value="Amarelo">Amarelo (80-99%)</SelectItem>
                        <SelectItem value="Vermelho">Vermelho (&lt;80%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              {/* Loading State */}
              {loadingGvMetaRealizado && (
                <div className="flex justify-center items-center py-12">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Carregando dados...</span>
                  </div>
                </div>
              )}

              {/* Dashboard Gráfico - Estilo Figma */}
              {!loadingGvMetaRealizado && gvMetaRealizado?.data && (
                <div className="space-y-6">
                  {/* Cards de Métricas no Topo */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Total Indicadores */}
                    <Card className="bg-white border-gray-200 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-600 text-sm font-medium">Total Indicadores</p>
                            <h3 className="text-2xl font-bold text-gray-900">{gvMetaRealizado.statistics?.total_indicators || 0}</h3>
                            <div className="flex items-center mt-2">
                              <Target className="w-4 h-4 text-blue-600 mr-1" />
                              <span className="text-sm text-gray-500">Ativos</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Meta Total */}
                    <Card className="bg-white border-gray-200 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-600 text-sm font-medium">Meta Total</p>
                            <h3 className="text-2xl font-bold text-gray-900">
                              {gvMetaRealizado.data.reduce((sum: number, item: any) => sum + (item.meta || 0), 0).toLocaleString()}
                            </h3>
                            <div className="flex items-center mt-2">
                              <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
                              <span className="text-sm text-gray-500">Total</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Realizado Total */}
                    <Card className="bg-white border-gray-200 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-600 text-sm font-medium">Realizado Total</p>
                            <h3 className="text-2xl font-bold text-gray-900">
                              {gvMetaRealizado.data.reduce((sum: number, item: any) => sum + (item.realizado || 0), 0).toLocaleString()}
                            </h3>
                            <div className="flex items-center mt-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                              <span className="text-sm text-green-600">
                                {Math.round(
                                  (gvMetaRealizado.data.reduce((sum: number, item: any) => sum + (item.realizado || 0), 0) /
                                   gvMetaRealizado.data.reduce((sum: number, item: any) => sum + (item.meta || 0), 0)) * 100
                                )}% atingido
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Distribuição RAG */}
                    <Card className="bg-white border-gray-200 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-600 text-sm font-medium">Distribuição RAG</p>
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex items-center">
                                <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                                <span className="text-sm font-medium text-green-600">{gvMetaRealizado.statistics?.verde_count || 0}</span>
                              </div>
                              <div className="flex items-center">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
                                <span className="text-sm font-medium text-yellow-600">{gvMetaRealizado.statistics?.amarelo_count || 0}</span>
                              </div>
                              <div className="flex items-center">
                                <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                                <span className="text-sm font-medium text-red-600">{gvMetaRealizado.statistics?.vermelho_count || 0}</span>
                              </div>
                            </div>
                            <div className="flex items-center mt-2">
                              <Activity className="w-4 h-4 text-gray-500 mr-1" />
                              <span className="text-sm text-gray-500">Status</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Gráficos Principais */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Gráfico de Performance Detalhada por Projetos */}
                    <Card className="bg-white border-gray-200 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-gray-900 flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-blue-600" />
                          {gvSectorSlug === 'all' ? 'Todos os Projetos' : `Projetos - ${gvSectorSlug}`}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                          <BarChart data={gvMetaRealizado.data
                            .filter((item: any) => item.is_primary)
                            .slice(0, 15) // Mostrar mais projetos
                            .map((item: any) => ({
                              projeto: item.projeto_nome.length > 12 ? item.projeto_nome.substring(0, 12) + '...' : item.projeto_nome,
                              Meta: item.meta || 0,
                              Realizado: item.realizado || 0,
                              status: item.status_rag,
                              atingimento: item.atingimento_percentual
                            }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis 
                              dataKey="projeto" 
                              stroke="#6b7280"
                              fontSize={11}
                              angle={-45}
                              textAnchor="end"
                              height={100}
                            />
                            <YAxis stroke="#6b7280" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#ffffff', 
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                color: '#111827',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                              formatter={(value: any, name: string) => {
                                if (name === 'Meta') return [value, 'Meta'];
                                if (name === 'Realizado') return [value, 'Realizado'];
                                return [value, name];
                              }}
                            />
                            <Bar dataKey="Meta" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                            <Bar dataKey="Realizado" fill="#10b981" radius={[2, 2, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Gráfico de Distribuição RAG por Indicadores */}
                    <Card className="bg-white border-gray-200 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-gray-900 flex items-center gap-2">
                          <Activity className="w-5 h-5 text-blue-600" />
                          Status RAG dos Indicadores
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                          <BarChart data={gvMetaRealizado.data
                            .filter((item: any) => item.is_primary)
                            .slice(0, 10)
                            .map((item: any) => ({
                              indicador: item.indicador_nome.length > 8 ? item.indicador_nome.substring(0, 8) + '...' : item.indicador_nome,
                              atingimento: item.atingimento_percentual,
                              status: item.status_rag,
                              meta: item.meta,
                              realizado: item.realizado
                            }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis 
                              dataKey="indicador" 
                              stroke="#6b7280"
                              fontSize={11}
                              angle={-45}
                              textAnchor="end"
                              height={100}
                            />
                            <YAxis stroke="#6b7280" label={{ value: 'Atingimento %', angle: -90, position: 'insideLeft' }} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#ffffff', 
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                color: '#111827',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                              formatter={(value: any, name: string, props: any) => {
                                const { payload } = props;
                                return [
                                  `${value}%`,
                                  `Status: ${payload.status} | Meta: ${payload.meta} | Realizado: ${payload.realizado}`
                                ];
                              }}
                            />
                            <Bar 
                              dataKey="atingimento" 
                              radius={[2, 2, 0, 0]}
                            >
                              {gvMetaRealizado.data
                                .filter((item: any) => item.is_primary)
                                .slice(0, 10)
                                .map((item: any, index: number) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={
                                      item.status_rag === 'Verde' ? '#10b981' :
                                      item.status_rag === 'Amarelo' ? '#f59e0b' : '#ef4444'
                                    } 
                                  />
                                ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Gráfico de Evolução por Indicadores Individuais */}
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Performance Individual dos Indicadores
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={gvMetaRealizado.data
                          .filter((item: any) => item.is_primary)
                          .slice(0, 12) // Mostrar mais indicadores individuais
                          .map((item: any, index: number) => ({
                            indicador: `${index + 1}. ${item.indicador_nome.length > 10 ? item.indicador_nome.substring(0, 10) + '...' : item.indicador_nome}`,
                            Meta: item.meta || 0,
                            Realizado: item.realizado || 0,
                            atingimento: item.atingimento_percentual,
                            status: item.status_rag,
                            projeto: item.projeto_nome,
                            setor: item.setor_nome
                          }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="indicador" 
                            stroke="#6b7280"
                            fontSize={10}
                            angle={-45}
                            textAnchor="end"
                            height={120}
                          />
                          <YAxis stroke="#6b7280" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#ffffff', 
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              color: '#111827',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            formatter={(value: any, name: string, props: any) => {
                              const { payload } = props;
                              if (name === 'Meta') return [value, `Meta - ${payload.projeto}`];
                              if (name === 'Realizado') return [value, `Realizado - ${payload.status} (${payload.atingimento}%)`];
                              return [value, name];
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="Meta" 
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="Realizado" 
                            stroke="#10b981" 
                            strokeWidth={3}
                            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {gvMetaRealizado.data.filter((item: any) => item.is_primary).length === 0 && (
                    <Card className="p-8 text-center bg-white border-gray-200 shadow-sm">
                      <div className="text-gray-600">
                        <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="font-semibold text-lg mb-2 text-gray-800">Nenhum indicador encontrado</h3>
                        <p>Ajuste os filtros para visualizar os dados ou aguarde o carregamento.</p>
                      </div>
                    </Card>
                  )}
                </div>
              )}


            </TabsContent>

            {/* Nova aba: Pagamentos de Ingressos */}
            <TabsContent value="pagamentos-ingressos" className="space-y-6 mt-6">
              <PagamentosIngressosSection queryClient={queryClient} />
            </TabsContent>

            {/* Nova aba: Pagamentos Cielo */}
            <TabsContent value="pagamentos-cielo" className="space-y-6 mt-6">
              <PagamentosCieloSection queryClient={queryClient} />
            </TabsContent>

            {/* Nova aba: Estatísticas de Ingressos */}
            <TabsContent value="estatisticas-ingressos" className="space-y-6 mt-6">
              <EstatisticasIngressosSection queryClient={queryClient} />
            </TabsContent>

            {/* Nova aba: Marketing Links */}
            <TabsContent value="marketing-links" className="space-y-6 mt-6">
              <MarketingLinksSection queryClient={queryClient} />
            </TabsContent>

            {/* Nova aba: Compradores Avulsos */}
            <TabsContent value="compradores-avulsos" className="space-y-6 mt-6">
              <CompradoresAvulsosSection queryClient={queryClient} />
            </TabsContent>

            {/* Nova aba: Converter Doações em Assinaturas */}
            <TabsContent value="converter-doacoes" className="space-y-6 mt-6">
              <ConverterDoacoesSection queryClient={queryClient} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Benefits Form Dialog */}
      <Dialog open={showBenefitForm} onOpenChange={setShowBenefitForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {editingBenefit ? 'Editar Benefício' : 'Novo Benefício'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-y-auto overscroll-contain min-h-0 pr-2">
            <div>
              <Label>Título do Benefício</Label>
              <Input 
                placeholder="Ex: Combo Cineart - Diversão Garantida" 
                value={benefitFormData.titulo}
                onChange={(e) => setBenefitFormData(prev => ({ ...prev, titulo: e.target.value }))}
              />
            </div>
            <div>
              <Label>Descrição Completa</Label>
              <Textarea 
                placeholder="Descreva detalhadamente o benefício..." 
                value={benefitFormData.descricao}
                onChange={(e) => setBenefitFormData(prev => ({ ...prev, descricao: e.target.value }))}
                className="h-24"
              />
            </div>
            <div>
              <BenefitImageUploader
                value={benefitFormData.imagem}
                onChange={(url) => setBenefitFormData(prev => ({ ...prev, imagem: url }))}
                className="mt-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pontos Necessários</Label>
                <Input 
                  type="number"
                  placeholder="Ex: 100" 
                  value={benefitFormData.pontosNecessarios}
                  onChange={(e) => setBenefitFormData(prev => ({ ...prev, pontosNecessarios: e.target.value }))}
                />
              </div>
              <div>
                <Label>Valor Estimado (R$)</Label>
                <Input 
                  type="number"
                  step="0.01" 
                  placeholder="Ex: 50.00" 
                  value={benefitFormData.valorEstimado}
                  onChange={(e) => setBenefitFormData(prev => ({ ...prev, valorEstimado: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Plano Mínimo Exigido (Hierárquico)</Label>
                <Select 
                  value={benefitFormData.planosDisponiveis[0] || 'eco'} 
                  onValueChange={(value) => setBenefitFormData(prev => ({ 
                    ...prev, 
                    planosDisponiveis: [value] // Backend implementa a hierarquia automaticamente
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eco">🟢 Eco - Todos os planos têm acesso (Eco, Voz, Grito, Platinum)</SelectItem>
                    <SelectItem value="voz">🟡 Voz - Planos médios e altos (Voz, Grito, Platinum)</SelectItem>
                    <SelectItem value="grito">🟠 Grito - Planos altos (Grito, Platinum)</SelectItem>
                    <SelectItem value="platinum">⭐ Platinum - Apenas usuários premium</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Sistema hierárquico: usuários com planos superiores também têm acesso
                </p>
              </div>
              <div>
                <Label>Ciclos de Pagamento</Label>
                <Select 
                  value={benefitFormData.ciclosPagamento[0] || 'mensal'} 
                  onValueChange={(value) => setBenefitFormData(prev => ({ ...prev, ciclosPagamento: [value] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal (preço base)</SelectItem>
                    <SelectItem value="trimestral">Trimestral (5% desconto)</SelectItem>
                    <SelectItem value="semestral">Semestral (10% desconto)</SelectItem>
                    <SelectItem value="anual">Anual (15% desconto)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Gritos Mínimos</Label>
                <Input 
                  type="number" 
                  placeholder="100" 
                  value={benefitFormData.gritosMinimos}
                  onChange={(e) => setBenefitFormData(prev => ({ ...prev, gritosMinimos: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select 
                  value={benefitFormData.categoria} 
                  onValueChange={(value) => setBenefitFormData(prev => ({ ...prev, categoria: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lazer">Lazer</SelectItem>
                    <SelectItem value="educacional">Educacional</SelectItem>
                    <SelectItem value="saude">Saúde</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select 
                  value={benefitFormData.ativo ? 'ativo' : 'inativo'} 
                  onValueChange={(value) => setBenefitFormData(prev => ({ ...prev, ativo: value === 'ativo' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Início do Leilão</Label>
                <Input 
                  type="datetime-local"
                  value={benefitFormData.inicioLeilao}
                  onChange={(e) => setBenefitFormData(prev => ({ ...prev, inicioLeilao: e.target.value }))}
                  className="w-full"
                  data-testid="input-inicio-leilao"
                />
              </div>
              <div>
                <Label>Prazo para Lances</Label>
                <Input 
                  type="datetime-local"
                  value={benefitFormData.prazoLances}
                  onChange={(e) => setBenefitFormData(prev => ({ ...prev, prazoLances: e.target.value }))}
                  className="w-full"
                  data-testid="input-prazo-lances"
                />
              </div>
              <div>
                <Label>Ordem de Exibição</Label>
                <Input 
                  type="number"
                  placeholder="0" 
                  value={benefitFormData.ordem}
                  onChange={(e) => setBenefitFormData(prev => ({ ...prev, ordem: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  if (!benefitFormData.titulo.trim() || !benefitFormData.descricao.trim()) {
                    toast({ title: "Campos obrigatórios", description: "Título e descrição são obrigatórios", variant: "destructive" });
                    return;
                  }
                  beneficioMutation.mutate(benefitFormData);
                }} 
                className="flex-1" 
                disabled={beneficioMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {beneficioMutation.isPending ? 'Salvando...' : (editingBenefit ? 'Atualizar' : 'Criar')}
              </Button>
              <Button variant="outline" onClick={() => setShowBenefitForm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stories Form Dialog */}
      <Dialog open={showStoryForm} onOpenChange={setShowStoryForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {editingStory ? 'Editar História' : 'Nova História'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-y-auto overscroll-contain min-h-0 pr-2">
            <div>
              <Label>Título da História</Label>
              <Input 
                placeholder="Ex: A Transformação de Maria" 
                value={storyFormData.titulo}
                onChange={(e) => setStoryFormData(prev => ({ ...prev, titulo: e.target.value }))}
              />
            </div>
            <div>
              <Label>Nome</Label>
              <Input 
                placeholder="Nome da pessoa da história" 
                value={storyFormData.nome}
                onChange={(e) => setStoryFormData(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            <div>
              <Label>Texto da História</Label>
              <Textarea 
                placeholder="Conte a história inspiradora..." 
                value={storyFormData.texto}
                onChange={(e) => setStoryFormData(prev => ({ ...prev, texto: e.target.value }))}
                className="h-32"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Imagem do Card (329x201px)</Label>
                <BenefitImageUploader
                  value={storyFormData.imagemBox}
                  onChange={(url) => setStoryFormData(prev => ({ ...prev, imagemBox: url }))}
                  label="Imagem do Card"
                />
              </div>
              <div>
                <Label>Imagem do Story (1080x1920px)</Label>
                <BenefitImageUploader
                  value={storyFormData.imagemStory}
                  onChange={(url) => setStoryFormData(prev => ({ ...prev, imagemStory: url }))}
                  label="Imagem do Story"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ordem de Exibição</Label>
                <Input 
                  type="number"
                  placeholder="0" 
                  value={storyFormData.ordem}
                  onChange={(e) => setStoryFormData(prev => ({ ...prev, ordem: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select 
                  value={storyFormData.ativo ? 'ativo' : 'inativo'} 
                  onValueChange={(value) => setStoryFormData(prev => ({ ...prev, ativo: value === 'ativo' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  if (!storyFormData.titulo.trim() || !storyFormData.nome.trim()) {
                    toast({ title: "Campos obrigatórios", description: "Título e nome são obrigatórios", variant: "destructive" });
                    return;
                  }
                  storyMutation.mutate(storyFormData);
                }} 
                className="flex-1" 
                disabled={storyMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {storyMutation.isPending ? 'Salvando...' : (editingStory ? 'Atualizar' : 'Criar')}
              </Button>
              <Button variant="outline" onClick={() => setShowStoryForm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Missions Form Dialog */}
      <Dialog open={showMissionForm} onOpenChange={setShowMissionForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {editingMission ? 'Editar Missão' : 'Nova Missão'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-y-auto overscroll-contain min-h-0 pr-2">
            <div>
              <Label>Título da Missão</Label>
              <Input 
                placeholder="Ex: Compartilhe nas Redes Sociais" 
                value={missionFormData.titulo}
                onChange={(e) => setMissionFormData(prev => ({ ...prev, titulo: e.target.value }))}
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea 
                placeholder="Descreva os detalhes da missão..." 
                value={missionFormData.descricao}
                onChange={(e) => setMissionFormData(prev => ({ ...prev, descricao: e.target.value }))}
                className="h-24"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Recompensa (Gritos)</Label>
                <Input 
                  type="number"
                  placeholder="150" 
                  value={missionFormData.recompensaGritos}
                  onChange={(e) => setMissionFormData(prev => ({ ...prev, recompensaGritos: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Tipo de Missão</Label>
                <Select 
                  value={missionFormData.tipoMissao} 
                  onValueChange={(value) => setMissionFormData(prev => ({ ...prev, tipoMissao: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feedback">Feedback</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="check_in">Check-in</SelectItem>
                    <SelectItem value="completar_perfil">Completar Perfil</SelectItem>
                    <SelectItem value="convite_amigo">Convite Amigo</SelectItem>
                    <SelectItem value="especial">Especial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Tipo de Evidência</Label>
              <Select 
                value={missionFormData.evidenceType} 
                onValueChange={(value) => setMissionFormData(prev => ({ ...prev, evidenceType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comentario">Texto</SelectItem>
                  <SelectItem value="print">Foto</SelectItem>
                  <SelectItem value="link">Link de Referral</SelectItem>
                  <SelectItem value="checkin">Check-in</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="pagamento">Pagamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>URL da Imagem (opcional)</Label>
              <Input 
                placeholder="https://exemplo.com/imagem.jpg" 
                value={missionFormData.imagemUrl}
                onChange={(e) => setMissionFormData(prev => ({ ...prev, imagemUrl: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Plano Mínimo</Label>
                <Select 
                  value={missionFormData.planoMinimo} 
                  onValueChange={(value) => setMissionFormData(prev => ({ ...prev, planoMinimo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eco">Eco - Plano mínimo mensal, trimestral, semestral ou anual</SelectItem>
                    <SelectItem value="voz">Voz - Plano mínimo mensal, trimestral, semestral ou anual</SelectItem>
                    <SelectItem value="grito">Grito - Plano mínimo mensal, trimestral, semestral ou anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select 
                  value={missionFormData.ativo ? 'ativo' : 'inativo'} 
                  onValueChange={(value) => setMissionFormData(prev => ({ ...prev, ativo: value === 'ativo' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data de Início</Label>
                <Input 
                  type="date"
                  value={missionFormData.semanaInicio}
                  onChange={(e) => setMissionFormData(prev => ({ ...prev, semanaInicio: e.target.value }))}
                />
              </div>
              <div>
                <Label>Data de Fim</Label>
                <Input 
                  type="date"
                  value={missionFormData.semanaFim}
                  onChange={(e) => setMissionFormData(prev => ({ ...prev, semanaFim: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => missionMutation.mutate(missionFormData)} className="flex-1" disabled={missionMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {missionMutation.isPending ? 'Salvando...' : (editingMission ? 'Atualizar' : 'Criar')}
              </Button>
              <Button variant="outline" onClick={() => setShowMissionForm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Dashboard Detalhado de Doadores */}
      <Dialog open={showCrmModal} onOpenChange={setShowCrmModal}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Dashboard Detalhado de Doadores
          </DialogTitle>
        </DialogHeader>
        
        {loadingDoadores ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tabela de Doadores */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Todos os Doadores ({filteredDoadores.length})</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const csvContent = [
                        ['#', 'Nome', 'Telefone', 'E-mail', 'Data Início', 'Plano', 'Valor', 'Periodicidade', 'Status'].join(','),
                        ...filteredDoadores.map((d: any, i: number) => 
                          [
                            i + 1,
                            `"${d.nome || ''}"`,
                            `"${d.telefone || ''}"`,
                            `"${d.email || ''}"`,
                            new Date(d.dataInicio).toLocaleDateString('pt-BR'),
                            d.plano || '',
                            d.valor || '0',
                            d.periodicidade || '-',
                            d.status === 'paid' ? 'Ativo' : 'Inativo'
                          ].join(',')
                        )
                      ].join('\n');
                      
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const link = document.createElement('a');
                      link.href = URL.createObjectURL(blob);
                      link.download = `doadores_${new Date().toISOString().split('T')[0]}.csv`;
                      link.click();
                      
                      toast({
                        title: 'Exportado com sucesso!',
                        description: `${filteredDoadores.length} doadores exportados.`
                      });
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => syncStripeMutation.mutate()}
                    disabled={syncingStripe}
                  >
                    {syncingStripe ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    {syncingStripe ? 'Sincronizando...' : 'Atualizar Status'}
                  </Button>
                </div>
              </div>
              
              {/* Container com scroll horizontal */}
              <div className="overflow-x-auto">
                {/* Cabeçalho da Tabela */}
                <div className="grid gap-3 p-4 bg-gray-50 rounded-lg font-semibold text-sm min-w-max" style={{ gridTemplateColumns: '50px 140px 130px minmax(220px, 1fr) 110px 90px 90px 100px 80px 70px' }}>
                  <div>#</div>
                  <div>Nome</div>
                  <div>Telefone</div>
                  <div>E-mail</div>
                  <div>Data Início</div>
                  <div>Plano</div>
                  <div>Valor</div>
                  <div>Periodicidade</div>
                  <div>Status</div>
                  <div>Ações</div>
                </div>
                
                {/* Linhas da Tabela */}
                <div className="space-y-2">
                  {filteredDoadores
                    .sort((a: any, b: any) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime())
                    .map((doador: any, index: number) => (
                    <Card key={doador.id} className="p-4">
                      <div className="grid gap-3 items-center text-sm min-w-max" style={{ gridTemplateColumns: '50px 140px 130px minmax(220px, 1fr) 110px 90px 90px 100px 80px 70px' }}>
                        <div className="font-mono text-gray-500">#{index + 1}</div>
                        <div className="font-semibold truncate" title={doador.nome}>{doador.nome || '-'}</div>
                        <div className="text-gray-600 text-xs">{doador.telefone || '-'}</div>
                        <div className="text-gray-600 text-xs font-mono" title={doador.email}>{doador.email || '-'}</div>
                      <div className="text-gray-600">
                        {new Date(doador.dataInicio).toLocaleDateString('pt-BR')}
                      </div>
                      <div>
                        <Badge variant="outline">
                          {doador.plano?.charAt(0).toUpperCase() + doador.plano?.slice(1) || 'N/A'}
                        </Badge>
                      </div>
                      <div className="font-semibold text-green-600">
                        R$ {doador.valor ? Number(doador.valor).toFixed(2) : '0.00'}
                      </div>
                      <div className="text-gray-600 capitalize">
                        {doador.periodicidade || '-'}
                      </div>
                      <div>
                        <Badge variant={doador.status === 'paid' ? "default" : "secondary"}>
                          {doador.status === 'paid' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (confirm(`Tem certeza que deseja remover ${doador.nome}?`)) {
                              try {
                                await apiRequest(`/api/donors/${doador.id}`, {
                                  method: 'DELETE'
                                });
                                toast({
                                  title: 'Doador removido',
                                  description: `${doador.nome} foi removido com sucesso.`
                                });
                                queryClient.invalidateQueries({ queryKey: ['/api/donors'] });
                                queryClient.invalidateQueries({ queryKey: ['/api/donor-stats'] });
                              } catch (error) {
                                toast({
                                  title: 'Erro',
                                  description: 'Não foi possível remover o doador.',
                                  variant: 'destructive'
                                });
                              }
                            }
                          }}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
              
              {filteredDoadores.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhum doador encontrado</p>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

      {/* Modal Detalhes de Leilões */}
      <Dialog open={showAuctionDetailsModal} onOpenChange={setShowAuctionDetailsModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              📊 Estatísticas Detalhadas de Leilões
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Top 5 Leilões Mais Ativos */}
            {auctionsStats.data?.lancesPorLeilao && auctionsStats.data.lancesPorLeilao.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    🏆 Top 5 Leilões Mais Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {auctionsStats.data.lancesPorLeilao.slice(0, 5).map((leilao: any, index: number) => (
                      <div key={leilao.beneficioId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{leilao.titulo}</p>
                            <p className="text-sm text-gray-600">ID: {leilao.beneficioId}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">{leilao.totalLances}</p>
                          <p className="text-xs text-gray-500">lances</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top 5 Usuários Mais Ativos */}
            {auctionsStats.data?.topUsuarios && auctionsStats.data.topUsuarios.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    👥 Top 5 Usuários Mais Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {auctionsStats.data.topUsuarios.map((usuario: any, index: number) => (
                      <div key={usuario.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-orange-600' : 'bg-purple-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{usuario.nome}</p>
                            <p className="text-sm text-gray-600">ID: {usuario.userId}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-purple-600">{usuario.totalPontosOfertados.toLocaleString('pt-BR')}</p>
                          <p className="text-xs text-gray-500">pontos ofertados</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Métricas Resumidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-green-300 bg-green-50">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Leilões Ativos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {auctionsSummary.data?.leiloesAtivos || 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-300 bg-blue-50">
                <CardContent className="p-4 text-center">
                  <Activity className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Total de Lances</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {auctionsStats.data?.lancesTotais || 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-300 bg-purple-50">
                <CardContent className="p-4 text-center">
                  <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Usuários Participando</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {auctionsStats.data?.usuariosParticipando || 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-indigo-300 bg-indigo-50">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Média por Lance</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {auctionsStats.data?.mediaPontosPorLance || 0}
                  </p>
                  <p className="text-xs text-indigo-500">pontos</p>
                </CardContent>
              </Card>
            </div>

            {/* Produto Mais Disputado */}
            {auctionsStats.data?.produtoMaisDisputado && (
              <Card className="border-orange-300 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <Star className="w-5 h-5" />
                    🌟 Produto Mais Disputado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-orange-200">
                    <div>
                      <h4 className="text-lg font-bold text-orange-800">
                        {auctionsStats.data.produtoMaisDisputado.titulo}
                      </h4>
                      <p className="text-orange-600">
                        Este produto recebeu o maior número de lances até agora
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-orange-600">
                        {auctionsStats.data.produtoMaisDisputado.totalLances}
                      </p>
                      <p className="text-sm text-orange-500">lances</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Footer do Modal */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-500">
                📊 Dados atualizados em tempo real
              </div>
              <Button
                onClick={() => setShowAuctionDetailsModal(false)}
                className="bg-gray-600 hover:bg-gray-700"
              >
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Webhook Form Dialog */}
      <Dialog open={showWebhookForm} onOpenChange={setShowWebhookForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingWebhook ? 'Editar Webhook' : 'Novo Webhook'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="webhook-url">URL do Webhook *</Label>
              <Input
                id="webhook-url"
                placeholder="https://hooks.n8n.cloud/webhook/..."
                value={webhookFormData.url}
                onChange={(e) => setWebhookFormData(prev => ({ ...prev, url: e.target.value }))}
                data-testid="input-webhook-url"
              />
              <p className="text-sm text-gray-500 mt-1">URL onde os webhooks serão enviados (n8n, Zapier, etc.)</p>
            </div>

            <div>
              <Label htmlFor="webhook-description">Descrição</Label>
              <Input
                id="webhook-description"
                placeholder="Ex: Integração com n8n para novos doadores"
                value={webhookFormData.description}
                onChange={(e) => setWebhookFormData(prev => ({ ...prev, description: e.target.value }))}
                data-testid="input-webhook-description"
              />
            </div>

            <div>
              <Label>Tipos de Eventos</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['payment_success', 'payment_failed', 'user_created', 'subscription_updated', 'donation_completed', 'user_login'].map((eventType) => (
                  <label key={eventType} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={webhookFormData.event_types.includes(eventType)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setWebhookFormData(prev => ({ 
                            ...prev, 
                            event_types: [...prev.event_types, eventType] 
                          }));
                        } else {
                          setWebhookFormData(prev => ({ 
                            ...prev, 
                            event_types: prev.event_types.filter(t => t !== eventType) 
                          }));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{eventType}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="webhook-headers">Headers Personalizados (JSON)</Label>
              <Textarea
                id="webhook-headers"
                placeholder='{"Authorization": "Bearer token", "Custom-Header": "value"}'
                value={webhookFormData.headers}
                onChange={(e) => setWebhookFormData(prev => ({ ...prev, headers: e.target.value }))}
                className="h-20"
                data-testid="textarea-webhook-headers"
              />
              <p className="text-sm text-gray-500 mt-1">Headers HTTP adicionais em formato JSON</p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="webhook-active"
                checked={webhookFormData.active}
                onChange={(e) => setWebhookFormData(prev => ({ ...prev, active: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="webhook-active">Webhook ativo</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowWebhookForm(false)}
                data-testid="btn-cancel-webhook"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  try {
                    const processedData = {
                      ...webhookFormData,
                      headers: webhookFormData.headers ? JSON.parse(webhookFormData.headers) : {}
                    };
                    webhookMutation.mutate(processedData);
                  } catch (error) {
                    toast({ 
                      title: "Erro no JSON dos Headers", 
                      description: "Verifique se o formato dos headers está correto", 
                      variant: "destructive" 
                    });
                  }
                }}
                disabled={!webhookFormData.url || webhookFormData.event_types.length === 0}
                data-testid="btn-save-webhook"
              >
                {editingWebhook ? 'Atualizar' : 'Criar'} Webhook
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Automation Form Dialog */}
      <Dialog open={showAutomationForm} onOpenChange={setShowAutomationForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAutomation ? 'Editar Automação' : 'Nova Automação'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="automation-name">Nome da Automação *</Label>
              <Input
                id="automation-name"
                placeholder="Ex: Boas-vindas para novos doadores"
                value={automationFormData.name}
                onChange={(e) => setAutomationFormData(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-automation-name"
              />
            </div>

            <div>
              <Label htmlFor="automation-trigger">Evento Disparador *</Label>
              <Select
                value={automationFormData.trigger_event}
                onValueChange={(value) => setAutomationFormData(prev => ({ ...prev, trigger_event: value }))}
              >
                <SelectTrigger data-testid="select-automation-trigger">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment_success">Pagamento Aprovado</SelectItem>
                  <SelectItem value="payment_failed">Pagamento Falhou</SelectItem>
                  <SelectItem value="user_created">Usuário Criado</SelectItem>
                  <SelectItem value="subscription_updated">Assinatura Atualizada</SelectItem>
                  <SelectItem value="donation_completed">Doação Completada</SelectItem>
                  <SelectItem value="user_login">Login do Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="automation-webhook-url">URL do Webhook *</Label>
              <Input
                id="automation-webhook-url"
                placeholder="https://hooks.n8n.cloud/webhook/..."
                value={automationFormData.webhook_url}
                onChange={(e) => setAutomationFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
                data-testid="input-automation-webhook-url"
              />
              <p className="text-sm text-gray-500 mt-1">URL específica para esta automação</p>
            </div>

            <div>
              <Label htmlFor="automation-conditions">Condições (JSON)</Label>
              <Textarea
                id="automation-conditions"
                placeholder='{"plano": "premium", "valor": ">= 50"}'
                value={automationFormData.conditions}
                onChange={(e) => setAutomationFormData(prev => ({ ...prev, conditions: e.target.value }))}
                className="h-20"
                data-testid="textarea-automation-conditions"
              />
              <p className="text-sm text-gray-500 mt-1">Condições opcionais para disparar a automação</p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="automation-active"
                checked={automationFormData.active}
                onChange={(e) => setAutomationFormData(prev => ({ ...prev, active: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="automation-active">Automação ativa</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAutomationForm(false)}
                data-testid="btn-cancel-automation"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => automationMutation.mutate(automationFormData)}
                disabled={!automationFormData.name || !automationFormData.webhook_url}
                data-testid="btn-save-automation"
              >
                {editingAutomation ? 'Atualizar' : 'Criar'} Automação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}