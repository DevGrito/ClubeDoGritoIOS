import { useMemo, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import {  UploadCloud, FileSpreadsheet,CheckCircle2, ArrowLeft, RefreshCw, Search, Plus, Heart, MessageCircle, Users, DollarSign, Settings, BarChart3, Calendar, Target, Gift, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, Star, Edit, Save, X, Clock, Eye, Trash2, Upload, Download, FileText, Gavel, CreditCard, Filter, Share2, Ticket, Phone, Mail, Trophy, Activity, ExternalLink, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Loader2, LogOut, Monitor, Camera, Globe } from 'lucide-react';
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
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
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
import DevLogin from '@/pages/dev-login';
import { TeamManagementSection } from '@/components/TeamManagementSection';
import clubeDoGritoLogo from '../app-assets/CLUBE_DO_GRITO_LOGO_Prancheta_1_1751996016284_(1)_1764696786533.png';
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";


// Seção de Origem dos Doadores - mostra de onde vêm os usuários (Web, Android, iOS)
function DonorOriginSection() {
  const { data: platformData, isLoading } = useQuery<any>({
    queryKey: ['/api/admin/donor-platforms'],
  });

  const COLORS = {
    doacao_web: '#3B82F6',      // Blue - Web App
    doacao: '#10B981',           // Green - App/Doação
    desconhecido: '#9CA3AF',     // Gray - Não identificado
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Monitor className="w-7 h-7 text-slate-600" />
              Origem dos Doadores (Stripe)
            </h2>
            <p className="text-gray-600">De onde os doadores estão vindo - dados do Stripe</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const platforms = platformData?.platforms || [];
  const monthlyTrend = platformData?.monthlyTrend || [];
  const summary = platformData?.summary || {};

  const pieData = platforms.map((p: any) => ({
    name: p.platform,
    value: p.totalDonors,
    color: COLORS[p.platformKey as keyof typeof COLORS] || '#9CA3AF',
  }));

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Monitor className="w-7 h-7 text-slate-600" />
            Origem dos Doadores (Stripe)
          </h2>
          <p className="text-gray-600">De onde os doadores estão vindo - dados do Stripe</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-blue-100">
                <Monitor className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">🌐 Web App</p>
                <p className="text-2xl font-bold text-blue-600">
                  {summary.webApp || 0}
                </p>
                <p className="text-xs text-gray-500">doadores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-100">
                <Phone className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">📱 App/Doação</p>
                <p className="text-2xl font-bold text-green-600">
                  {summary.doacao || 0}
                </p>
                <p className="text-xs text-gray-500">doadores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-gray-100">
                <AlertTriangle className="w-8 h-8 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600">❓ Não identificado</p>
                <p className="text-2xl font-bold text-gray-500">
                  {summary.desconhecido || 0}
                </p>
                <p className="text-xs text-gray-500">doadores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-purple-100">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Stripe</p>
                <p className="text-2xl font-bold text-purple-700">
                  {summary.totalDonors || 0}
                </p>
                <p className="text-xs text-gray-500">clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-slate-600" />
              Distribuição por Origem
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 && pieData.some((p: any) => p.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} doadores`, 'Total']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Monitor className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum dado de plataforma disponível</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-slate-600" />
              Evolução Mensal por Origem
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="doacao_web" 
                    stackId="1" 
                    stroke={COLORS.doacao_web} 
                    fill={COLORS.doacao_web} 
                    name="🌐 Web App" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="doacao" 
                    stackId="1" 
                    stroke={COLORS.doacao} 
                    fill={COLORS.doacao} 
                    name="📱 App/Doação" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="desconhecido" 
                    stackId="1" 
                    stroke={COLORS.desconhecido} 
                    fill={COLORS.desconhecido} 
                    name="❓ Não identificado" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum dado histórico disponível</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-600" />
            Sobre os Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p><strong>🌐 Web App:</strong> Doadores que se cadastraram pelo navegador (fonte: doacao_web)</p>
          <p><strong>📱 App/Doação:</strong> Doadores marcados como "doacao" no Stripe</p>
          <p><strong>❓ Não identificado:</strong> Doadores antigos sem informação de origem</p>
          <p className="text-xs text-gray-400 mt-4">
            * Dados obtidos diretamente do Stripe via metadata.fonte dos clientes
          </p>
        </CardContent>
      </Card>
    </>
  );
}
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


/* ────────────────────────────────────────────────────────────────
   Instagram Analytics Section (mLabs style)
──────────────────────────────────────────────────────────────── */
function InstagramProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  const [anim, setAnim] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnim(pct), 400); return () => clearTimeout(t); }, [pct]);
  return (
    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${anim}%`, backgroundColor: color }} />
    </div>
  );
}

const IG_META_SEGUIDORES = 15000;
const IG_SEGUIDORES_BASE = 11538;
const IG_META_GANHOS = IG_META_SEGUIDORES - IG_SEGUIDORES_BASE;
const IG_META_PERDIDOS = 1500;
const IG_MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function InstagramAnalyticsSection() {
  const [ano, setAno] = useState('2026');
  const [mes, setMes] = useState('todos');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: igMetrics, refetch: refetchIg, isLoading: loadingIg } = useQuery<any>({
    queryKey: ['/api/instagram/metrics/current'],
    queryFn: () => fetch('/api/instagram/metrics/current').then(r => r.json()),
    refetchInterval: 300000,
    retry: false,
  });

  const syncIgMutation = useMutation({
    mutationFn: () => {
      const userId = localStorage.getItem('userId') || localStorage.getItem('mktUserId') || '1';
      return fetch('/api/instagram/metrics/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ periodLabel: 'morning' }),
      }).then(r => r.json());
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast({ title: '✅ Sincronizado!', description: 'Dados do Instagram atualizados.' });
        queryClient.invalidateQueries({ queryKey: ['/api/instagram/metrics/current'] });
        queryClient.invalidateQueries({ queryKey: ['/api/marketing-seguidores-mensal'] });
        refetchIg();
      } else {
        toast({ title: 'Aviso', description: data?.error || 'Não foi possível sincronizar.', variant: 'destructive' });
      }
    },
    onError: () => toast({ title: 'Erro', description: 'Falha ao conectar com a API do Instagram.', variant: 'destructive' }),
  });

  const { data: segMensal } = useQuery<any>({
    queryKey: ['/api/marketing-seguidores-mensal', ano],
    queryFn: () => fetch(`/api/marketing-seguidores-mensal?ano=${ano}`).then(r => r.json()),
    refetchInterval: 60000,
  });

  const igData        = igMetrics?.data;
  const followersReal = igData?.followers_total || IG_SEGUIDORES_BASE;
  const syncedAt      = igData?.synced_at
    ? new Date(igData.synced_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : null;

  const segRows: any[] = segMensal?.data || [];
  const segByMes: Record<string, any> = {};
  for (const r of segRows) segByMes[String(r.mes)] = r;
  const mesData = segByMes[mes];

  const acumulado   = (key: string) => segRows.reduce((acc, r) => acc + (r[key] || 0), 0);
  const ultimoTotal = segRows.length > 0 ? segRows[segRows.length - 1].total_seguidores : followersReal;

  const segGanhos   = mes === 'todos' ? acumulado('seguidores_ganhos')   : (mesData?.seguidores_ganhos   ?? 0);
  const segPerdidos = mes === 'todos' ? acumulado('seguidores_perdidos') : (mesData?.seguidores_perdidos ?? 0);
  const liquido     = segGanhos - segPerdidos;
  const totalSeg    = mes === 'todos' ? followersReal : (mesData?.total_seguidores ?? followersReal);
  const taxaCrescimento = totalSeg > 0 ? Number(((segGanhos / totalSeg) * 100).toFixed(1)) : 0;

  const faltam          = Math.max(IG_META_SEGUIDORES - followersReal, 0);
  const progressoPct    = Math.min(Math.round((followersReal / IG_META_SEGUIDORES) * 100), 100);
  const progressColor   = progressoPct >= 100 ? '#22c55e' : progressoPct >= 70 ? '#f59e0b' : '#ec4899';
  const mesAtual        = new Date().getMonth() + 1;
  const mesesRestantes  = Math.max(12 - mesAtual, 1);
  const mediaNecessaria = faltam > 0 ? Math.ceil(faltam / mesesRestantes) : 0;
  const mediaGanhosMes  = segRows.length > 0 ? Math.round(acumulado('seguidores_ganhos') / segRows.length) : 0;

  const anoAtual = new Date().getFullYear();
  const isFuturo = (i: number) => Number(ano) === anoAtual && (i + 1) > mesAtual;

  const barData = IG_MESES.map((m, i) => {
    if (isFuturo(i)) return { mes: m, ganhos: null, perdidos: null };
    const row = segRows.find((r: any) => Number(r.mes) === i + 1);
    return { mes: m, ganhos: row?.seguidores_ganhos || 0, perdidos: -(row?.seguidores_perdidos || 0) };
  });

  let acum = IG_SEGUIDORES_BASE;
  const lineData = IG_MESES.map((m, i) => {
    if (isFuturo(i)) return { mes: m, total: null };
    const row = segRows.find((r: any) => Number(r.mes) === i + 1);
    if (row) acum = row.total_seguidores;
    return { mes: m, total: acum };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-7 h-7 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            Instagram Analytics
          </h2>
          <p className="text-gray-500 text-sm">{syncedAt ? `Atualizado em ${syncedAt}` : 'Buscando dados...'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => syncIgMutation.mutate()} disabled={syncIgMutation.isPending} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${syncIgMutation.isPending ? 'animate-spin' : ''}`} />
            {syncIgMutation.isPending ? 'Sincronizando...' : 'Sincronizar'}
          </button>
          <div className="flex gap-1">
            {['2025','2026'].map(a => (
              <button key={a} onClick={() => { setAno(a); setMes('todos'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${ano === a ? 'bg-pink-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {a}
              </button>
            ))}
          </div>
          <div className="flex gap-1 flex-wrap max-w-xs">
            <button onClick={() => setMes('todos')} className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${mes === 'todos' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Ano todo</button>
            {IG_MESES.map((m, i) => (
              <button key={i} onClick={() => setMes(String(i + 1))} className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${mes === String(i + 1) ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{m}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Painel principal: total + progress */}
      <Card className="border-pink-100 bg-gradient-to-br from-white to-pink-50/30">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-sm font-semibold text-gray-600">Total de Seguidores</p>
              <p className="text-xs text-gray-400">@institutoogrito</p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-bold text-gray-900 tabular-nums">{followersReal.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-gray-400 mt-1">Meta: {IG_META_SEGUIDORES.toLocaleString('pt-BR')}</p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold" style={{ color: progressColor }}>{progressoPct}% da meta</span>
              <span className="text-gray-400">Faltam <strong className="text-gray-700">{faltam.toLocaleString('pt-BR')}</strong> seguidores</span>
            </div>
            <InstagramProgressBar value={followersReal} max={IG_META_SEGUIDORES} color={progressColor} />
            <div className="flex justify-between text-[10px] text-gray-300 mt-1">
              <span>{IG_SEGUIDORES_BASE.toLocaleString('pt-BR')} (início)</span>
              <span>{IG_META_SEGUIDORES.toLocaleString('pt-BR')} (meta)</span>
            </div>
          </div>
          {mediaNecessaria > 0 && (
            <div className="mt-4 flex items-center gap-2 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-lg px-3 py-2">
              <Target className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Precisa de <strong>{mediaNecessaria.toLocaleString('pt-BR')} seguidores/mês</strong> nos próximos {mesesRestantes} meses para atingir a meta.{mediaGanhosMes > 0 ? ` Média atual: ${mediaGanhosMes.toLocaleString('pt-BR')}/mês.` : ''}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4 métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp,   label: 'Seguidores Ganhos',     value: `+${segGanhos.toLocaleString('pt-BR')}`,     sub: `Meta: ${(mes === 'todos' ? IG_META_GANHOS : Math.ceil(IG_META_GANHOS / 12)).toLocaleString('pt-BR')}`,  color: '#10b981', bg: '#d1fae5' },
          { icon: TrendingDown, label: 'Seguidores Perdidos',   value: `-${segPerdidos.toLocaleString('pt-BR')}`,   sub: `Limite: ${(mes === 'todos' ? IG_META_PERDIDOS : Math.ceil(IG_META_PERDIDOS / 12)).toLocaleString('pt-BR')}`, color: '#ef4444', bg: '#fee2e2' },
          { icon: Activity,     label: 'Crescimento Líquido',   value: `${liquido >= 0 ? '+' : ''}${liquido.toLocaleString('pt-BR')}`,  sub: `Taxa: ${taxaCrescimento}%`, color: liquido >= 0 ? '#8b5cf6' : '#ef4444', bg: '#ede9fe' },
          { icon: Target,       label: 'Média/Mês Necessária',  value: mediaNecessaria > 0 ? `+${mediaNecessaria.toLocaleString('pt-BR')}` : '✓ Meta!', sub: `${mesesRestantes} meses restantes`, color: '#f59e0b', bg: '#fef3c7' },
        ].map(({ icon: Icon, label, value, sub, color, bg }) => (
          <Card key={label} className="border-gray-100">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="p-2.5 rounded-xl flex-shrink-0" style={{ backgroundColor: bg }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-0.5">{label}</p>
                <p className="text-xl font-bold tabular-nums" style={{ color }}>{value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-pink-500" />
              Ganhos vs Perdidos por Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickCount={4} axisLine={false} tickLine={false} />
                <Bar dataKey="ganhos"   fill="#10b981" radius={[3,3,0,0]} name="Ganhos" />
                <Bar dataKey="perdidos" fill="#fca5a5" radius={[0,0,3,3]} name="Perdidos" />
                <Legend wrapperStyle={{ fontSize: '11px' }} iconSize={8} iconType="circle" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: 11 }}
                  formatter={(v: number) => Math.abs(v).toLocaleString('pt-BR')}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              Evolução Total de Seguidores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickCount={4} axisLine={false} tickLine={false} domain={['auto', IG_META_SEGUIDORES + 500]} />
                <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }} name="Total" connectNulls={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: 11 }}
                  formatter={(v: number) => v.toLocaleString('pt-BR')}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-gray-400 mt-1 text-center">Linha rosa pontilhada = meta {IG_META_SEGUIDORES.toLocaleString('pt-BR')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GanhadoresSection({ queryClient }: { queryClient: any }) {
  const { toast } = useToast();
  const [selectedBeneficio, setSelectedBeneficio] = useState<number | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingGanhador, setEditingGanhador] = useState<any>(null);
  const [formData, setFormData] = useState({
    userId: 0,
    lancesTotais: 0,
    gritosTotais: 0,
    depoimento: '',
    visivel: true,
  });
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [manualSearchResults, setManualSearchResults] = useState<any[]>([]);
  const [pendingFotoFile, setPendingFotoFile] = useState<File | null>(null);
  const [pendingFotoPreview, setPendingFotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const newFotoInputRef = useRef<HTMLInputElement>(null);

  const { data: beneficiosEncerrados = [], isLoading: loadingBeneficios } = useQuery<any[]>({
    queryKey: ['/api/admin/beneficios'],
    select: (data) => data?.filter((b: any) => {
      // Benefício encerrado = inativo OU prazo de lances já passou
      if (!b.ativo) return true;
      if (b.prazoLances) {
        const prazo = new Date(b.prazoLances);
        return prazo < new Date();
      }
      return false;
    }) || [],
  });

  const { data: ganhadoresData, isLoading: loadingGanhadores } = useQuery<{ success: boolean; ganhadores: any[] }>({
    queryKey: ['/api/beneficios/ganhadores'],
  });
  const ganhadores = ganhadoresData?.ganhadores || [];

  const { data: topLicitantesData, isLoading: loadingTopLicitantes } = useQuery<{
    success: boolean;
    topLicitantes: Array<{
      userId: number;
      nomeUsuario: string;
      telefone: string;
      email: string;
      pontosOfertados: number;
      status: string;
      dataLance: string;
    }>;
    ganhadorExistente: any;
    totalLances: number;
  }>({
    queryKey: ['/api/admin/beneficios', selectedBeneficio, 'top-licitantes'],
    queryFn: () => selectedBeneficio ? apiRequest(`/api/admin/beneficios/${selectedBeneficio}/top-licitantes`) : Promise.resolve({ success: false, topLicitantes: [], ganhadorExistente: null, totalLances: 0 }),
    enabled: !!selectedBeneficio,
  });

  const topLicitantes = topLicitantesData?.topLicitantes || [];
  const ganhadorExistente = topLicitantesData?.ganhadorExistente;

  // Quando há um top licitante, pré-preencher o formulário automaticamente
  const topLicitante = topLicitantes[0];

  const handleSelectBeneficio = (beneficioId: number) => {
    setSelectedBeneficio(beneficioId);
    // Reset form para ser preenchido pela query
    setFormData({
      userId: 0,
      lancesTotais: 0,
      gritosTotais: 0,
      depoimento: '',
      visivel: true,
    });
  };

  // Efeito para pré-preencher quando dados chegam
  const preencherFormulario = (licitante: typeof topLicitante) => {
    if (licitante && !editingGanhador) {
      setFormData({
        userId: licitante.userId,
        lancesTotais: 1, // Número de vezes que deu lance
        gritosTotais: licitante.pontosOfertados,
        depoimento: '',
        visivel: true,
      });
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const result = await apiRequest('/api/dev/beneficios/ganhadores', {
        method: 'POST',
        body: JSON.stringify({ ...data, beneficioId: selectedBeneficio }),
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (result.success && result.ganhador?.id && pendingFotoFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('foto', pendingFotoFile);
        
        await fetch(`/api/dev/beneficios/ganhadores/${result.ganhador.id}/foto`, {
          method: 'POST',
          body: formDataUpload,
        });
      }
      
      return result;
    },
    onSuccess: () => {
      toast({ title: "Ganhador registrado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['/api/beneficios/ganhadores'] });
      setShowFormModal(false);
      resetForm();
      setPendingFotoFile(null);
      setPendingFotoPreview(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar ganhador", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/dev/beneficios/ganhadores/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      toast({ title: "Ganhador atualizado!" });
      queryClient.invalidateQueries({ queryKey: ['/api/beneficios/ganhadores'] });
      setShowFormModal(false);
      setEditingGanhador(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/dev/beneficios/ganhadores/${id}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Erro ao remover ganhador');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Ganhador removido!" });
      queryClient.invalidateQueries({ queryKey: ['/api/beneficios/ganhadores'] });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    },
  });

  const handleFotoUpload = async (ganhadorId: number, file: File) => {
    setUploadingFoto(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('foto', file);

      const response = await fetch(`/api/dev/beneficios/ganhadores/${ganhadorId}/foto`, {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) throw new Error('Erro ao fazer upload da foto');
      
      toast({ title: "Foto atualizada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['/api/beneficios/ganhadores'] });
    } catch (error: any) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
    } finally {
      setUploadingFoto(false);
    }
  };

  const resetForm = () => {
    setFormData({
      userId: 0,
      lancesTotais: 0,
      gritosTotais: 0,
      depoimento: '',
      visivel: true,
    });
  };

  const handleEdit = (ganhador: any) => {
    setEditingGanhador(ganhador);
    setFormData({
      userId: ganhador.userId,
      lancesTotais: ganhador.lancesTotais || 0,
      gritosTotais: ganhador.gritosTotais || 0,
      depoimento: ganhador.depoimento || '',
      visivel: ganhador.visivel ?? true,
    });
    setSelectedBeneficio(ganhador.beneficioId);
    setShowFormModal(true);
  };

  const handleSelectVencedor = (vencedor: any) => {
    setFormData({
      userId: vencedor.userId,
      lancesTotais: vencedor.totalLances || 0,
      gritosTotais: vencedor.totalGritos || 0,
      depoimento: '',
      visivel: true,
    });
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-600" />
            Galeria de Ganhadores
          </h2>
          <p className="text-gray-600">Gerencie os ganhadores dos benefícios para exibir na galeria pública</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-amber-100">
                <Trophy className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Ganhadores</p>
                <p className="text-2xl font-bold text-amber-600">{ganhadores.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-100">
                <Eye className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Visíveis na Galeria</p>
                <p className="text-2xl font-bold text-green-600">
                  {ganhadores.filter((g: any) => g.visivel).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-blue-100">
                <Gift className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Benefícios Encerrados</p>
                <p className="text-2xl font-bold text-blue-600">{beneficiosEncerrados.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Registrar Novo Ganhador
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Selecione o Benefício Encerrado</Label>
            <Select
              value={selectedBeneficio?.toString() || ''}
              onValueChange={(value) => handleSelectBeneficio(parseInt(value))}
            >
              <SelectTrigger data-testid="select-beneficio-ganhador">
                <SelectValue placeholder="Escolha um benefício..." />
              </SelectTrigger>
              <SelectContent>
                {beneficiosEncerrados.map((b: any) => (
                  <SelectItem key={b.id} value={b.id.toString()}>
                    {b.titulo} - {b.categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedBeneficio && (
            <div className="space-y-4">
              {ganhadorExistente && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Ganhador já registrado!</span>
                  </div>
                  <p className="text-sm text-green-600">
                    {ganhadorExistente.nomeUsuario} - {ganhadorExistente.gritosTotais} gritos
                  </p>
                </div>
              )}

              {loadingTopLicitantes ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Buscando licitantes...</span>
                </div>
              ) : topLicitantes.length > 0 ? (
                <div>
                  <Label>Top Licitantes (maior lance = ganhador)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {topLicitantes.map((v: any, index: number) => (
                      <Card
                        key={v.userId}
                        className={`cursor-pointer transition-all ${formData.userId === v.userId ? 'border-amber-500 bg-amber-50' : 'hover:border-gray-300'} ${index === 0 ? 'ring-2 ring-amber-400' : ''}`}
                        onClick={() => preencherFormulario(v)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback>{v.nomeUsuario?.[0] || 'U'}</AvatarFallback>
                              </Avatar>
                              {index === 0 && (
                                <Trophy className="absolute -top-1 -right-1 h-4 w-4 text-amber-500" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{v.nomeUsuario}</p>
                              <p className="text-sm text-gray-500">
                                {v.pontosOfertados} gritos ofertados
                              </p>
                              {index === 0 && (
                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                  Maior lance
                                </span>
                              )}
                            </div>
                            {formData.userId === v.userId && (
                              <CheckCircle className="h-5 w-5 text-amber-600" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : !ganhadorExistente ? (
                <div className="space-y-4">
                  <div className="text-center py-4 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                    <p className="text-amber-700 font-medium">Nenhum lance encontrado para este benefício</p>
                    <p className="text-sm text-amber-600 mt-1">Você pode cadastrar o ganhador manualmente abaixo</p>
                  </div>
                  
                  <div>
                    <Label>Buscar Doador para Registrar como Ganhador</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Digite o nome do ganhador..."
                        data-testid="input-busca-ganhador-manual"
                        onChange={(e) => {
                          const searchValue = e.target.value.toLowerCase();
                          if (searchValue.length >= 2) {
                            fetch(`/api/donors`)
                              .then(res => res.json())
                              .then(data => {
                                const filtered = data.filter((d: any) => 
                                  d.nome?.toLowerCase().includes(searchValue)
                                ).slice(0, 5);
                                setManualSearchResults(filtered);
                              });
                          } else {
                            setManualSearchResults([]);
                          }
                        }}
                      />
                    </div>
                    
                    {manualSearchResults.length > 0 && (
                      <div className="mt-2 border rounded-lg divide-y max-h-60 overflow-y-auto">
                        {manualSearchResults.map((d: any) => (
                          <div
                            key={d.userId}
                            className="p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                userId: d.userId,
                                gritosTotais: 0,
                                lancesTotais: 1,
                              }));
                              setManualSearchResults([]);
                            }}
                          >
                            <div>
                              <p className="font-medium">{d.nome}</p>
                              <p className="text-sm text-gray-500">Plano: {d.plano || 'N/A'}</p>
                            </div>
                            <Button variant="outline" size="sm">Selecionar</Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {formData.userId > 0 && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-green-700 font-medium flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Ganhador selecionado! Preencha o depoimento abaixo e registre.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {formData.userId > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <Label>Foto do Ganhador (opcional)</Label>
                    <div className="mt-2 flex items-center gap-4">
                      {pendingFotoPreview ? (
                        <div className="relative">
                          <img
                            src={pendingFotoPreview}
                            alt="Preview"
                            className="w-20 h-20 rounded-full object-cover border-2 border-amber-500"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                            onClick={() => {
                              setPendingFotoFile(null);
                              setPendingFotoPreview(null);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <Camera className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={newFotoInputRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setPendingFotoFile(file);
                              setPendingFotoPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => newFotoInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {pendingFotoPreview ? 'Trocar Foto' : 'Selecionar Foto'}
                        </Button>
                        <p className="text-xs text-gray-500 mt-1">JPG, PNG até 5MB</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>Depoimento do Ganhador (opcional)</Label>
                    <Textarea
                      placeholder="O que o ganhador disse sobre o prêmio..."
                      value={formData.depoimento}
                      onChange={(e) => setFormData(prev => ({ ...prev, depoimento: e.target.value }))}
                      className="mt-1"
                      data-testid="textarea-depoimento-ganhador"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="visivel-galeria"
                      checked={formData.visivel}
                      onChange={(e) => setFormData(prev => ({ ...prev, visivel: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="visivel-galeria">Exibir na galeria pública</Label>
                  </div>
                  <Button
                    onClick={() => createMutation.mutate(formData)}
                    disabled={createMutation.isPending}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                    data-testid="btn-registrar-ganhador"
                  >
                    {createMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registrando...</>
                    ) : (
                      <><Trophy className="mr-2 h-4 w-4" /> Registrar Ganhador</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Ganhadores Cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingGanhadores ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : ganhadores.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum ganhador cadastrado ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ganhadores.map((g: any) => (
                <Card key={g.id} className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={g.fotoUrl ? `/api/ganhadores/${g.id}/foto` : undefined} />
                          <AvatarFallback className="bg-amber-100 text-amber-700">
                            {g.nomeUsuario?.[0] || 'G'}
                          </AvatarFallback>
                        </Avatar>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id={`foto-ganhador-${g.id}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFotoUpload(g.id, file);
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full p-0"
                          onClick={() => document.getElementById(`foto-ganhador-${g.id}`)?.click()}
                          disabled={uploadingFoto}
                        >
                          {uploadingFoto ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Upload className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-lg">{g.nomeUsuario || 'Usuário'}</h4>
                          <Badge variant={g.visivel ? "default" : "secondary"}>
                            {g.visivel ? 'Visível' : 'Oculto'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{g.beneficioTitulo}</p>
                        <div className="flex gap-4 mt-1 text-sm">
                          <span className="text-amber-600 font-medium">
                            <Target className="w-3 h-3 inline mr-1" />
                            {g.lancesTotais} lances
                          </span>
                          <span className="text-orange-600 font-medium">
                            <Star className="w-3 h-3 inline mr-1" />
                            {g.gritosTotais} gritos
                          </span>
                        </div>
                        {g.depoimento && (
                          <p className="mt-2 text-sm text-gray-500 italic">"{g.depoimento}"</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(g)}
                          data-testid={`btn-edit-ganhador-${g.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm('Remover este ganhador da galeria?')) {
                              deleteMutation.mutate(g.id);
                            }
                          }}
                          data-testid={`btn-delete-ganhador-${g.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGanhador ? 'Editar Ganhador' : 'Novo Ganhador'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Depoimento</Label>
              <Textarea
                value={formData.depoimento}
                onChange={(e) => setFormData(prev => ({ ...prev, depoimento: e.target.value }))}
                placeholder="Depoimento do ganhador..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Lances Totais</Label>
                <Input
                  type="number"
                  value={formData.lancesTotais}
                  onChange={(e) => setFormData(prev => ({ ...prev, lancesTotais: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Gritos Totais</Label>
                <Input
                  type="number"
                  value={formData.gritosTotais}
                  onChange={(e) => setFormData(prev => ({ ...prev, gritosTotais: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-visivel"
                checked={formData.visivel}
                onChange={(e) => setFormData(prev => ({ ...prev, visivel: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="edit-visivel">Exibir na galeria pública</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowFormModal(false);
                setEditingGanhador(null);
                resetForm();
              }}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (editingGanhador) {
                    updateMutation.mutate({ id: editingGanhador.id, data: formData });
                  }
                }}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function NotificationsSection({ queryClient }: { queryClient: any }) {
  const [showForm, setShowForm] = useState(false);
  const [editingNotification, setEditingNotification] = useState<any>(null);
  const [sendingPush, setSendingPush] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    primaryButtonText: '',
    primaryButtonAction: '',
    secondaryButtonText: '',
    secondaryButtonAction: 'dismiss',
    targetAudience: 'all',
    priority: 1,
    progressDuration: 5,
    sendAsPush: false,
    scheduledAt: '',
    notificationType: 'normal',
    blockedRoutes: [] as string[],
    requirementField: 'email',
  });

  const { data: notifications, isLoading } = useQuery<any[]>({
    queryKey: ['/api/in-app-notifications'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/in-app-notifications', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      toast({ title: "Notificação criada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['/api/in-app-notifications'] });
      setShowForm(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar notificação", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/in-app-notifications/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      toast({ title: "Notificação atualizada!" });
      queryClient.invalidateQueries({ queryKey: ['/api/in-app-notifications'] });
      setShowForm(false);
      setEditingNotification(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/in-app-notifications/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast({ title: "Notificação excluída!" });
      queryClient.invalidateQueries({ queryKey: ['/api/in-app-notifications'] });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      primaryButtonText: '',
      primaryButtonAction: '',
      secondaryButtonText: '',
      secondaryButtonAction: 'dismiss',
      targetAudience: 'all',
      priority: 1,
      progressDuration: 5,
      sendAsPush: false,
      scheduledAt: '',
      notificationType: 'normal',
      blockedRoutes: [],
      requirementField: 'email',
    });
  };

  const handleEdit = (notification: any) => {
    setEditingNotification(notification);
    let blockedRoutes: string[] = [];
    try {
      blockedRoutes = notification.blocked_routes ? JSON.parse(notification.blocked_routes) : [];
    } catch { blockedRoutes = []; }
    
    setFormData({
      title: notification.title || '',
      message: notification.message || '',
      primaryButtonText: notification.primary_button_text || '',
      primaryButtonAction: notification.primary_button_action || '',
      secondaryButtonText: notification.secondary_button_text || '',
      secondaryButtonAction: notification.secondary_button_action || 'dismiss',
      targetAudience: notification.target_audience || 'all',
      priority: notification.priority || 1,
      progressDuration: notification.progress_duration || 5,
      sendAsPush: false,
      scheduledAt: notification.scheduled_at ? new Date(notification.scheduled_at).toISOString().slice(0, 16) : '',
      notificationType: notification.notification_type || 'normal',
      blockedRoutes,
      requirementField: notification.requirement_field || 'email',
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.message) {
      toast({ title: "Preencha título e mensagem", variant: "destructive" });
      return;
    }

    if (editingNotification) {
      updateMutation.mutate({ id: editingNotification.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleSendPush = async () => {
    if (!formData.title || !formData.message) {
      toast({ title: "Preencha título e mensagem", variant: "destructive" });
      return;
    }

    setSendingPush(true);
    try {
      await apiRequest('/api/push/send-to-all-donors', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title,
          body: formData.message,
          data: {
            type: 'in_app_notification',
            action: formData.primaryButtonAction,
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      toast({ title: "Push enviado para todos os doadores!" });
    } catch (error: any) {
      toast({ title: "Erro ao enviar push", description: error.message, variant: "destructive" });
    } finally {
      setSendingPush(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-7 h-7 text-amber-600" />
            Notificações In-App & Push
          </h2>
          <p className="text-gray-600">Gerencie notificações que aparecem dentro do app e enviadas por push</p>
        </div>
        <Button 
          onClick={() => { resetForm(); setEditingNotification(null); setShowForm(true); }} 
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600"
          data-testid="btn-new-notification"
        >
          <Plus className="w-4 h-4" />
          Nova Notificação
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 border-amber-300">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{editingNotification ? 'Editar Notificação' : 'Nova Notificação In-App'}</span>
              <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingNotification(null); }}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <Input
                    placeholder="Ex: Ei {nome}, falta só o seu e-mail"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    data-testid="input-notification-title"
                  />
                  <p className="text-xs text-gray-500 mt-1">Use {'{nome}'} para personalizar com o nome do usuário</p>
                </div>
                <div>
                  <Label>Mensagem</Label>
                  <Textarea
                    placeholder="Ex: Oi {nome}, para liberar os benefícios do Clube do Grito, precisamos que você adicione seu e-mail."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="h-24"
                    data-testid="input-notification-message"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Botão Primário (Amarelo)</Label>
                    <Input
                      placeholder="Ex: Adicionar seu e-mail"
                      value={formData.primaryButtonText}
                      onChange={(e) => setFormData({ ...formData, primaryButtonText: e.target.value })}
                      data-testid="input-primary-button"
                    />
                  </div>
                  <div>
                    <Label>Ação do Botão Primário</Label>
                    <Select
                      value={formData.primaryButtonAction}
                      onValueChange={(value) => setFormData({ ...formData, primaryButtonAction: value })}
                    >
                      <SelectTrigger data-testid="select-primary-action">
                        <SelectValue placeholder="Escolha a ação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="/perfil">Ver Meu Perfil</SelectItem>
                        <SelectItem value="/dados-cadastrais">Completar Cadastro</SelectItem>
                        <SelectItem value="/beneficios">Benefícios</SelectItem>
                        <SelectItem value="/meus-lances">Leilões (Meus Lances)</SelectItem>
                        <SelectItem value="/missoes">Missões</SelectItem>
                        <SelectItem value="/welcome">Tela Inicial</SelectItem>
                        <SelectItem value="/configuracoes">Configurações</SelectItem>
                        <SelectItem value="dismiss">Apenas Fechar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Botão Secundário (Preto)</Label>
                    <Input
                      placeholder="Ex: Não quero ganhar prêmios"
                      value={formData.secondaryButtonText}
                      onChange={(e) => setFormData({ ...formData, secondaryButtonText: e.target.value })}
                      data-testid="input-secondary-button"
                    />
                  </div>
                  <div>
                    <Label>Ação do Botão Secundário</Label>
                    <Select
                      value={formData.secondaryButtonAction}
                      onValueChange={(value) => setFormData({ ...formData, secondaryButtonAction: value })}
                    >
                      <SelectTrigger data-testid="select-secondary-action">
                        <SelectValue placeholder="Escolha a ação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dismiss">Apenas Fechar</SelectItem>
                        <SelectItem value="/perfil">Ver Meu Perfil</SelectItem>
                        <SelectItem value="/dados-cadastrais">Completar Cadastro</SelectItem>
                        <SelectItem value="/beneficios">Benefícios</SelectItem>
                        <SelectItem value="/meus-lances">Leilões</SelectItem>
                        <SelectItem value="/welcome">Tela Inicial</SelectItem>
                        <SelectItem value="/configuracoes">Configurações</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Público Alvo</Label>
                    <Select
                      value={formData.targetAudience}
                      onValueChange={(value) => setFormData({ ...formData, targetAudience: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="donors">Apenas Doadores</SelectItem>
                        <SelectItem value="no_email">Sem E-mail</SelectItem>
                        <SelectItem value="no_subscription">Sem Assinatura</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prioridade (1-10)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <Label>Duração Barra (seg)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={formData.progressDuration}
                      onChange={(e) => setFormData({ ...formData, progressDuration: parseInt(e.target.value) || 5 })}
                    />
                  </div>
                  <div>
                    <Label>Agendar para</Label>
                    <Input
                      type="datetime-local"
                      value={formData.scheduledAt}
                      onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                      data-testid="input-scheduled-at"
                    />
                    <p className="text-xs text-gray-500 mt-1">Deixe vazio para enviar imediatamente</p>
                  </div>
                </div>

                {/* Opção Push */}
                <div className="flex items-center gap-3 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="sendAsPush"
                    checked={formData.sendAsPush}
                    onChange={(e) => setFormData({ ...formData, sendAsPush: e.target.checked })}
                    className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                    data-testid="checkbox-send-as-push"
                  />
                  <label htmlFor="sendAsPush" className="cursor-pointer">
                    <span className="font-semibold text-blue-800">Enviar também como Push</span>
                    <p className="text-xs text-blue-600">Além da notificação in-app, envia push notification para todos os dispositivos registrados</p>
                  </label>
                </div>

                {/* Tipo de Notificação - Bloqueio */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                  <Label className="text-amber-800 font-semibold mb-3 block">Tipo de Notificação</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Select
                        value={formData.notificationType}
                        onValueChange={(value) => setFormData({ ...formData, notificationType: value })}
                      >
                        <SelectTrigger data-testid="select-notification-type">
                          <SelectValue placeholder="Tipo de notificação" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal (pode fechar)</SelectItem>
                          <SelectItem value="email_required">Exigir E-mail (bloqueia telas)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-amber-700 mt-1">
                        {formData.notificationType === 'email_required' 
                          ? 'O doador só poderá acessar as telas selecionadas após cadastrar o e-mail'
                          : 'Notificação normal que pode ser fechada'}
                      </p>
                    </div>
                    
                    {formData.notificationType === 'email_required' && (
                      <div>
                        <Label className="text-amber-700 text-sm">Rotas Bloqueadas</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {[
                            { value: '/beneficios', label: 'Benefícios' },
                            { value: '/missoes', label: 'Missões' },
                            { value: '/meus-lances', label: 'Leilões' },
                          ].map((route) => (
                            <label key={route.value} className="flex items-center gap-1 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.blockedRoutes.includes(route.value)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({ ...formData, blockedRoutes: [...formData.blockedRoutes, route.value] });
                                  } else {
                                    setFormData({ ...formData, blockedRoutes: formData.blockedRoutes.filter(r => r !== route.value) });
                                  }
                                }}
                                className="rounded border-amber-300"
                              />
                              <span>{route.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Preview do Card In-App (Aparece no topo)</Label>
                <div className="bg-gray-100 rounded-xl p-4 border-2 border-dashed border-gray-300">
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-md mx-auto">
                    <div className="relative h-2 bg-gray-200">
                      <div className="absolute left-0 top-0 h-full bg-yellow-400 w-3/4" />
                      <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-400 rounded-full shadow-md border-2 border-white" style={{ left: 'calc(75% - 8px)' }} />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 flex-shrink-0">
                          <img 
                            src={clubeDoGritoLogo} 
                            alt="Clube do Grito" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">Clube do Grito</p>
                          <p className="text-xs text-gray-500">{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <h3 className="font-bold text-base text-gray-900 mb-1">
                        {(formData.title || 'Ei {nome}, falta só o seu e-mail').replace(/\{nome\}/gi, 'João')}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {(formData.message || 'Para liberar os benefícios do Clube do Grito, precisamos que você adicione seu e-mail.').replace(/\{nome\}/gi, 'João')}
                      </p>
                      <div className="flex gap-2">
                        {formData.primaryButtonText && (
                          <button className="flex-1 py-2 px-4 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-full transition-colors text-sm">
                            {formData.primaryButtonText}
                          </button>
                        )}
                        {formData.secondaryButtonText && (
                          <button className="flex-1 py-2 px-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-full transition-colors text-sm">
                            {formData.secondaryButtonText}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-amber-500 hover:bg-amber-600"
                data-testid="btn-save-notification"
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {editingNotification ? 'Atualizar' : 'Criar Notificação In-App'}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleSendPush}
                disabled={sendingPush || !formData.title || !formData.message}
                data-testid="btn-send-push"
              >
                {sendingPush ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Monitor className="mr-2 h-4 w-4" />
                    Enviar como Push (Agora)
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {notifications && notifications.length > 0 ? (
          notifications.map((notification: any) => (
            <Card key={notification.id} className={`border-l-4 ${notification.active ? 'border-l-green-500' : 'border-l-gray-300'}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg">{notification.title}</h3>
                      <Badge variant={notification.active ? "default" : "secondary"}>
                        {notification.active ? 'Ativa' : 'Inativa'}
                      </Badge>
                      {notification.push_sent_at && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          Push enviado
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{notification.message}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      {notification.primary_button_text && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          {notification.primary_button_text} → {notification.primary_button_action}
                        </span>
                      )}
                      {notification.secondary_button_text && (
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          {notification.secondary_button_text} → {notification.secondary_button_action}
                        </span>
                      )}
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        Público: {notification.target_audience}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-3 text-xs text-gray-500">
                      <span>Cliques Primário: <strong>{notification.primary_clicks || 0}</strong></span>
                      <span>Cliques Secundário: <strong>{notification.secondary_clicks || 0}</strong></span>
                      <span>Dispensados: <strong>{notification.dismissals || 0}</strong></span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(notification)}
                      data-testid={`btn-edit-notification-${notification.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir esta notificação?')) {
                          deleteMutation.mutate(notification.id);
                        }
                      }}
                      data-testid={`btn-delete-notification-${notification.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <div className="text-gray-600">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="font-semibold text-lg mb-2 text-gray-800">Nenhuma notificação</h3>
              <p>Crie sua primeira notificação in-app clicando no botão acima.</p>
            </div>
          </Card>
        )}
      </div>
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
  const { toast } = useToast();
  const { data: response, isLoading } = useQuery<any>({
    queryKey: ['/api/ingresso/pagamentos-cielo'],
  });

  const pagamentos = response?.pagamentos || [];
  const stats = response?.stats || null;

  // Estados para filtros
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>('');
  const [filtroDataFim, setFiltroDataFim] = useState<string>('');

  // Mutation para confirmar todos os ingressos pendentes (DEVE estar antes dos early returns!)
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
    .filter((p: any) => p.status === 'succeeded')
    .reduce((sum: number, p: any) => sum + p.valor, 0);
  
  const valorProcessando = pagamentosFiltrados
    .filter((p: any) => p.status === 'processing')
    .reduce((sum: number, p: any) => sum + p.valor, 0);
  
  const valorFalhado = pagamentosFiltrados
    .filter((p: any) => p.status === 'payment_failed' || p.status === 'canceled')
    .reduce((sum: number, p: any) => sum + p.valor, 0);

  const totalParcelados = pagamentosFiltrados.filter((p: any) => (p.parcelas || 1) > 1).length;

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
                  <Ticket className="w-8 h-8 text-blue-600" />
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
                  <CheckCircle className="w-8 h-8 text-green-600" />
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
                  <X className="w-8 h-8 text-red-600" />
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
                  <AlertTriangle className="w-8 h-8 text-gray-600" />
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
                  <Clock className="w-8 h-8 text-yellow-600" />
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
                  <DollarSign className="w-8 h-8 text-emerald-600" />
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
                  <CreditCard className="w-8 h-8 text-purple-600" />
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


function CatracaWebhookSection() {
  const { toast } = useToast();
  const [testId, setTestId] = useState("");
  const [testSecret, setTestSecret] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [copied, setCopied] = useState<string | null>(null);
  const [customBaseUrl, setCustomBaseUrl] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("catraca_base_url") || "";
    }
    return "";
  });

  const defaultBaseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const activeBaseUrl = customBaseUrl.trim() || defaultBaseUrl;
  const webhookUrl = `${activeBaseUrl}/webhook/presenca`;
  const sseUrl = `${activeBaseUrl}/api/webhook/presenca-events`;
  const logUrl = `${activeBaseUrl}/api/webhook/presenca-log`;

  const saveCustomUrl = (url: string) => {
    setCustomBaseUrl(url);
    if (typeof window !== "undefined") {
      if (url.trim()) {
        localStorage.setItem("catraca_base_url", url.trim());
      } else {
        localStorage.removeItem("catraca_base_url");
      }
    }
  };

  const { data: presencaLog, isLoading: loadingLog, refetch: refetchLog } = useQuery<any>({
    queryKey: ['/api/webhook/presenca-log', logDate],
    queryFn: () => apiRequest(`/api/webhook/presenca-log?data=${logDate}`),
  });

  const { data: webhookLogs = [], refetch: refetchWebhookLogs } = useQuery<any[]>({
    queryKey: ['/api/webhook/logs'],
    refetchInterval: 5000,
  });

  const [logFilter, setLogFilter] = useState<string>('all');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: `${label} copiado!` });
  };

  const sendTestWebhook = async () => {
    if (!testId.trim()) {
      toast({ title: "Digite um ID de catraca para testar", variant: "destructive" });
      return;
    }
    setTestLoading(true);
    setTestResult(null);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (testSecret.trim()) {
        headers["x-webhook-secret"] = testSecret.trim();
      }
      const res = await fetch("/webhook/presenca", {
        method: "POST",
        headers,
        body: JSON.stringify({ aluno_id: testId.trim(), timestamp: new Date().toISOString() }),
      });
      const data = await res.json();
      setTestResult({ status: res.status, ...data });
      refetchLog();
    } catch (err: any) {
      setTestResult({ error: err.message });
    }
    setTestLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-7 h-7 text-red-600" />
            Catraca Intelbras - Webhook Incontrol
          </h2>
          <p className="text-gray-600">Configure a integração com catracas Intelbras para registro automático de presença</p>
        </div>
      </div>

      <Card className="border-2 border-blue-200 bg-blue-50/50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <Label className="text-sm font-bold text-blue-900">URL Base (ngrok / túnel)</Label>
                <p className="text-xs text-blue-700">Cole aqui a URL do ngrok ou túnel externo. As URLs do webhook serão geradas automaticamente. Deixe vazio para usar a URL padrão do sistema.</p>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="https://abc123.ngrok-free.app"
                  value={customBaseUrl}
                  onChange={(e) => saveCustomUrl(e.target.value)}
                  className="font-mono text-sm bg-white border-blue-300 focus:border-blue-500"
                />
                {customBaseUrl.trim() && (
                  <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100" onClick={() => saveCustomUrl("")}>
                    Limpar
                  </Button>
                )}
              </div>
              {customBaseUrl.trim() ? (
                <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Usando URL personalizada: {activeBaseUrl}
                </p>
              ) : (
                <p className="text-xs text-gray-500">Usando URL padrão: {defaultBaseUrl}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-600" />
              Configuração do Webhook
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-semibold text-gray-700">URL do Webhook (POST)</Label>
              <p className="text-xs text-gray-500 mb-1">Configure esta URL no sistema Intelbras Incontrol como destino do webhook de eventos</p>
              <div className="flex gap-2">
                <Input value={webhookUrl} readOnly className="font-mono text-sm bg-gray-50" />
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(webhookUrl, "URL Webhook")}>
                  {copied === "URL Webhook" ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-semibold text-gray-700">URL SSE (Eventos em Tempo Real)</Label>
              <p className="text-xs text-gray-500 mb-1">Conecte a esta URL para receber notificações em tempo real de presenças</p>
              <div className="flex gap-2">
                <Input value={sseUrl} readOnly className="font-mono text-sm bg-gray-50" />
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(sseUrl, "URL SSE")}>
                  {copied === "URL SSE" ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-semibold text-gray-700">Formato do Payload (JSON)</Label>
              <p className="text-xs text-gray-500 mb-1">O Incontrol deve enviar este formato no body da requisição POST</p>
              <div className="relative">
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
{`{
  "aluno_id": "12345",      // ID da catraca do aluno (obrigatório)
  "timestamp": "2026-02-20T14:30:00Z"  // Data/hora (opcional, usa hora atual se omitido)
}`}
                </pre>
                <Button size="sm" variant="outline" className="absolute top-2 right-2 bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                  onClick={() => copyToClipboard(JSON.stringify({ aluno_id: "12345", timestamp: new Date().toISOString() }, null, 2), "Payload")}
                >
                  {copied === "Payload" ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-semibold text-gray-700">Autenticação (Opcional)</Label>
              <p className="text-xs text-gray-500 mb-1">Se definido o secret <code className="bg-gray-100 px-1 rounded">WEBHOOK_PRESENCA_SECRET</code>, envie no header:</p>
              <pre className="bg-gray-900 text-yellow-400 p-3 rounded-lg text-sm font-mono">
{`Headers:
  x-webhook-secret: "SEU_SECRET_AQUI"
  // ou
  Authorization: "Bearer SEU_SECRET_AQUI"`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Como Funciona
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                <div>
                  <p className="font-semibold text-sm">Aluno passa na catraca</p>
                  <p className="text-xs text-gray-600">O Intelbras Incontrol detecta o ID e envia POST para o webhook</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                <div>
                  <p className="font-semibold text-sm">Sistema busca o aluno</p>
                  <p className="text-xs text-gray-600">Procura pelo <strong>id_catraca</strong> nas tabelas <strong>aluno</strong> (PEC) e <strong>participantes_inclusao</strong> (Inclusão)</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                <div>
                  <p className="font-semibold text-sm">Verifica turma do dia</p>
                  <p className="text-xs text-gray-600">Identifica em qual turma o aluno está matriculado no dia/horário atual</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">4</div>
                <div>
                  <p className="font-semibold text-sm">Registra presença</p>
                  <p className="text-xs text-gray-600">Cria/atualiza a chamada do dia automaticamente e marca o aluno como presente</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">5</div>
                <div>
                  <p className="font-semibold text-sm">Notificação em tempo real</p>
                  <p className="text-xs text-gray-600">Envia evento SSE para todas as telas abertas (monitor, coordenador, professor)</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="font-semibold text-sm text-orange-800 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Importante
              </p>
              <p className="text-xs text-orange-700 mt-1">
                O campo <strong>id_catraca</strong> deve estar preenchido no cadastro do aluno (PEC) ou participante (Inclusão Produtiva). 
                Sem esse campo, o sistema não consegue identificar quem passou na catraca.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Testar Webhook
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">ID da Catraca (aluno_id)</Label>
              <p className="text-xs text-gray-500 mb-1">Digite o ID de catraca de um aluno cadastrado para simular uma passagem</p>
              <Input
                placeholder="Ex: 12345"
                value={testId}
                onChange={(e) => setTestId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendTestWebhook()}
              />
            </div>
            <div>
              <Label className="text-sm font-semibold">Secret (opcional)</Label>
              <p className="text-xs text-gray-500 mb-1">Se o webhook exigir autenticação, informe o secret aqui</p>
              <Input
                type="password"
                placeholder="WEBHOOK_PRESENCA_SECRET"
                value={testSecret}
                onChange={(e) => setTestSecret(e.target.value)}
              />
            </div>
            <div>
              <Button onClick={sendTestWebhook} disabled={testLoading} className="bg-green-600 hover:bg-green-700 w-full">
                {testLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Activity className="w-4 h-4 mr-2" />}
                {testLoading ? "Enviando..." : "Enviar Teste"}
              </Button>
            </div>

            {testResult && (
              <div className={`p-4 rounded-lg border ${testResult.error || testResult.status >= 400 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                <p className="font-semibold text-sm mb-2">
                  {testResult.error || testResult.status >= 400 ? "Erro" : "Sucesso"} 
                  {testResult.status && <Badge variant="outline" className="ml-2">HTTP {testResult.status}</Badge>}
                </p>
                {testResult.status === 401 && (
                  <p className="text-xs text-red-600 mb-2 font-medium">
                    O servidor exige autenticação (WEBHOOK_PRESENCA_SECRET). Preencha o campo "Secret" acima com o valor correto.
                  </p>
                )}
                {testResult.status === 404 && (
                  <p className="text-xs text-orange-600 mb-2 font-medium">
                    ID de catraca não encontrado. Verifique se o campo "id_catraca" está preenchido no cadastro do aluno/participante.
                  </p>
                )}
                <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Log de Presenças via Catraca
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-sm">Data</Label>
                <Input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchLog()}>
                <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
              </Button>
            </div>

            {loadingLog ? (
              <div className="text-center py-6 text-gray-500">Carregando log...</div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className="bg-indigo-100 text-indigo-800">
                    {presencaLog?.total || 0} entrada(s) via catraca
                  </Badge>
                  <span className="text-xs text-gray-500">Data: {logDate}</span>
                </div>

                <ScrollArea className="h-[300px]">
                  <div className="space-y-1">
                    {(presencaLog?.entradas || []).length === 0 ? (
                      <p className="text-center text-gray-400 py-8 text-sm">Nenhuma entrada via catraca nesta data</p>
                    ) : (
                      (presencaLog?.entradas || []).map((e: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium">{e.nome}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={e.vertente === "pec" ? "border-yellow-500 text-yellow-700" : "border-green-500 text-green-700"}>
                              {e.vertente === "pec" ? "PEC" : "Inclusão"}
                            </Badge>
                            <span className="text-xs text-gray-500">{e.turma}</span>
                            <span className="text-xs font-mono text-gray-600">{e.hora}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-600" />
              Logs de Integração (Webhook)
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={logFilter} onValueChange={setLogFilter}>
                <SelectTrigger className="w-[140px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="request">Requisições</SelectItem>
                  <SelectItem value="success">Sucessos</SelectItem>
                  <SelectItem value="error">Erros</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => refetchWebhookLogs()}>
                <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500">Últimos {webhookLogs.length} eventos do webhook (atualiza automaticamente a cada 5s)</p>
        </CardHeader>
        <CardContent>
          {webhookLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Nenhum log registrado ainda</p>
              <p className="text-xs mt-1">Envie um teste pelo formulário acima para gerar logs</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-1.5 font-mono text-xs">
                {webhookLogs
                  .filter((log: any) => logFilter === 'all' || log.type === logFilter)
                  .map((log: any, idx: number) => {
                    const time = new Date(log.timestamp).toLocaleTimeString('pt-BR');
                    const date = new Date(log.timestamp).toLocaleDateString('pt-BR');
                    const colorMap: Record<string, string> = {
                      request: 'bg-blue-100 text-blue-800 border-blue-200',
                      success: 'bg-green-100 text-green-800 border-green-200',
                      error: 'bg-red-100 text-red-800 border-red-200',
                      info: 'bg-gray-100 text-gray-700 border-gray-200',
                    };
                    const typeColor = colorMap[log.type] || 'bg-gray-100 text-gray-700';
                    const iconMap: Record<string, string> = {
                      request: '→',
                      success: '✓',
                      error: '✗',
                      info: 'ℹ',
                    };
                    const typeIcon = iconMap[log.type] || '•';
                    return (
                      <div key={idx} className={`p-2 rounded border ${typeColor}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <span className="font-bold text-sm flex-shrink-0">{typeIcon}</span>
                            <span className="break-words">{log.message}</span>
                          </div>
                          <span className="text-[10px] opacity-60 flex-shrink-0 whitespace-nowrap">{date} {time}</span>
                        </div>
                        {log.details && (
                          <pre className="mt-1 text-[10px] opacity-70 whitespace-pre-wrap break-all pl-5">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    );
                  })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DevMarketing() {
  const [, setLocation] = useLocation();
  const { userData } = useUserData();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para modal de motivo de cancelamento
  const [showMotivoModal, setShowMotivoModal] = useState(false);
  const [motivoModalUserId, setMotivoModalUserId] = useState<number | null>(null);
  const [motivoModalNome, setMotivoModalNome] = useState('');
  const [motivoSelecionado, setMotivoSelecionado] = useState('');
  const [motivoCustom, setMotivoCustom] = useState('');
  const [savingMotivo, setSavingMotivo] = useState(false);
  
  const motivosPredefinidos = [
    'Problemas financeiros',
    'Cartão inválido/expirado',
    'Não quis continuar',
    'Mudou de ideia',
    'Insatisfação com o serviço',
    'Preferiu outro plano',
    'Problema técnico',
    'Outro'
  ];
    const [syncStripeLoading, setSyncStripeLoading] = useState(false);

    const handleSyncStripeDonors = async () => {
    const ok = confirm(
      "Tem certeza que deseja sincronizar doadores do Stripe?\n\nIsso vai varrer customers/subscriptions e atualizar/criar Users e Doadores no banco."
    );
    if (!ok) return;

    setSyncStripeLoading(true);

    try {
      const response = await apiRequest("/api/admin/sync-stripe-donors", {
        method: "POST",
      });

      const r = response?.results || {};

      if (!response?.success) {
        throw new Error(response?.message || response?.error || "Falha na sincronização");
      }

      toast({
        title: "✅ Sync Stripe concluída",
        description: `Users: +${r.usersCreated || 0} / upd ${r.usersUpdated || 0} • Doadores: +${r.doadoresCreated || 0} / upd ${r.doadoresUpdated || 0} • Erros: ${r.errorsCount || 0}`,
      });

      queryClient.invalidateQueries({ queryKey: ['/api/donors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/donor-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/doadores/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/donor-platforms'] });
    } catch (error: any) {
      toast({
        title: "❌ Erro na Sync Stripe",
        description: error?.message || "Erro ao sincronizar",
        variant: "destructive",
      });
    } finally {
      setSyncStripeLoading(false);
    }
  };
  
  const handleSaveMotivo = async () => {
    const motivoFinal = motivoSelecionado === 'Outro' ? motivoCustom : motivoSelecionado;
    if (!motivoModalUserId || !motivoFinal) return;
    
    setSavingMotivo(true);
    try {
      const response = await fetch(`/api/users/${motivoModalUserId}/motivo-cancelamento`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivoCancelamento: motivoFinal })
      });
      
      if (!response.ok) throw new Error('Erro ao salvar motivo');
      
      toast({
        title: 'Motivo salvo',
        description: `Motivo de cancelamento atualizado para ${motivoModalNome}`
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/doadores/stats'] });
      setShowMotivoModal(false);
      setMotivoModalUserId(null);
      setMotivoModalNome('');
      setMotivoSelecionado('');
      setMotivoCustom('');
    } catch (error) {
      console.error('Erro ao salvar motivo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o motivo de cancelamento',
        variant: 'destructive'
      });
    } finally {
      setSavingMotivo(false);
    }
  };
  
  // ✅ Verificar autenticação - se não estiver logado como dev, mostrar login
  const userPapel = localStorage.getItem('userPapel');
  const isDevAuthenticated = userPapel === 'dev' || userPapel === 'desenvolvedor' || userPapel === 'super_admin' || userPapel === 'leo' || userPapel === 'marketing' || userPapel === 'dev-marketing' || userPapel === 'dev-admin';
  const isDevAdmin = userPapel === 'dev-admin'; // devfull tem acesso a ambas as páginas
  
  // Se não está autenticado, renderizar tela de login
  if (!isDevAuthenticated) {
    return <DevLogin />;
  }

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
    ativo: true,
    habilitarLinkCompartilhamento: false,
    quantidadeAmigos: 1,
    diasNecessarios: 3
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

  // Buscar dados dos Doadores do Stripe (igual ao Leo)
  const { data: doadoresStripeData } = useQuery<any>({
    queryKey: ['/api/doadores/stats'],
    refetchInterval: 900000,
    refetchOnWindowFocus: true,
  });

  // Buscar doadores externos (doam fora do aplicativo)
  const { data: doadoresExternosData } = useQuery<any>({
    queryKey: ['/api/doadores-externos'],
    refetchInterval: 900000,
    refetchOnWindowFocus: true,
  });

  // Variáveis calculadas dos doadores do Stripe (igual ao Leo)
  const statsDoadores = doadoresStripeData || {};
  const totalDoadoresStripe = statsDoadores.totalDoadores || 0;
  const arrecadacaoMensalStripe = statsDoadores.arrecadacaoMensal || 0;
  const doacaoMediaStripe = statsDoadores.doacaoMedia || 0;
  const taxaRetencaoStripe = statsDoadores.taxaRetencao || 0;
  const porStatusStripe = statsDoadores.porStatus || { active: 0, trialing: 0, past_due: 0, canceled: 0 };
  const porPlanoStripe = statsDoadores.porPlano || [];
  const evolucaoMensalStripe = statsDoadores.evolucaoMensal || [];
  const distribuicaoPorValorStripe = statsDoadores.distribuicaoPorValor || [];
  const listaDoadoresStripe = statsDoadores.doadores || [];
  const CORES_PLANO = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
  const CORES_MOTIVO = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'];
  
  // Calcular dados do gráfico de motivos de cancelamento
  const dadosMotivosCancelamento = (() => {
    const cancelados = listaDoadoresStripe.filter((d: any) => d.status === 'canceled');
    const motivosContagem: Record<string, number> = {};
    
    cancelados.forEach((d: any) => {
      const motivo = d.motivoCancelamento || 'Sem motivo registrado';
      motivosContagem[motivo] = (motivosContagem[motivo] || 0) + 1;
    });
    
    return Object.entries(motivosContagem)
      .map(([motivo, quantidade]) => ({ motivo, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);
  })();

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

    // já existia
    queryClient.invalidateQueries({ queryKey: ['/api/donors'] });
    queryClient.invalidateQueries({ queryKey: ['/api/donor-stats'] });

    // 🔥 ADICIONAR ISSO AQUI
    queryClient.invalidateQueries({ queryKey: ['/api/doadores/stats'] });
    queryClient.invalidateQueries({ queryKey: ['/api/doadores-externos'] });
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
    },
    onError: (error: any) => {
      console.error('❌ [BENEFIT ERROR]', error);
      toast({ 
        title: "Erro ao salvar benefício", 
        description: error?.message || "Verifique se todos os campos estão preenchidos corretamente",
        variant: "destructive" 
      });
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
        imagemUrl: rawData.imagemUrl || null,
        diasNecessarios: rawData.tipoMissao === 'check_in_consecutivo' ? (Number(rawData.diasNecessarios) || 3) : null
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
    onSuccess: async () => {
      // Force invalidate and refetch to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/missoes-semanais'] });
      await refetchMissoes();
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
        ativo: true,
        habilitarLinkCompartilhamento: false,
        quantidadeAmigos: 1,
        diasNecessarios: 3
      });
      toast({ title: "Missão salva com sucesso!" });
    },
    onError: (error) => {
      console.error('Erro na mutation de missão:', error);
      toast({ title: "Erro ao salvar missão", description: "Tente novamente", variant: "destructive" });
    }
  });

  const deleteMissionMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/missoes-semanais/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/missoes-semanais'] });
      await refetchMissoes();
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
      ativo: missao.ativo !== false,
      habilitarLinkCompartilhamento: missao.habilitarLinkCompartilhamento === true,
      quantidadeAmigos: missao.quantidadeAmigos || 1,
      diasNecessarios: missao.diasNecessarios || 3
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
      ativo: true,
      habilitarLinkCompartilhamento: false,
      quantidadeAmigos: 1,
      diasNecessarios: 3
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
  const searchLower = searchTerm.toLowerCase().trim();
  
  const filteredBeneficios = beneficios.filter((item: any) =>
    !searchLower ||
    item.titulo?.toLowerCase().includes(searchLower) ||
    item.categoria?.toLowerCase().includes(searchLower)
  );

  const filteredHistorias = historias.filter((item: any) =>
    !searchLower ||
    item.titulo?.toLowerCase().includes(searchLower) ||
    item.nome?.toLowerCase().includes(searchLower)
  );

  const filteredMissoes = missoes.filter((item: any) =>
    !searchLower ||
    item.titulo?.toLowerCase().includes(searchLower) ||
    item.tipoMissao?.toLowerCase().includes(searchLower) ||
    item.descricao?.toLowerCase().includes(searchLower)
  );

  // Ref para controlar o scroll dos tabs
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  // 🖱️ Habilitar scroll horizontal com a roda do mouse
  useEffect(() => {
    const container = tabsScrollRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Prevenir scroll vertical padrão
      e.preventDefault();
      // Converter scroll vertical em horizontal
      container.scrollLeft += e.deltaY;
    };

    // Adicionar event listener
    container.addEventListener('wheel', handleWheel, { passive: false });

    // Cleanup
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Funções para navegação dos tabs
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsScrollRef.current) {
      const scrollAmount = 500; // pixels por clique
      const newScrollLeft = tabsScrollRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
      tabsScrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Função para verificar se um leilão está ativo
  const isAuctionActive = (beneficio: any) => {
    if (!beneficio.ativo) return false;
    
    const now = new Date();
    const inicioLeilao = beneficio.inicioLeilao ? new Date(beneficio.inicioLeilao) : null;
    const prazoLances = beneficio.prazoLances ? new Date(beneficio.prazoLances) : null;
    
    // Se não tem datas definidas, o benefício ativo está disponível para lances
    if (!inicioLeilao || !prazoLances) return true;
    
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

  // Função para fazer logout
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setLocation('/dev/login');
  };

  // DADOS DE IMPORTAÇÃO
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [commitResult, setCommitResult] = useState<any>(null);
  const [loadingSimulate, setLoadingSimulate] = useState(false);
  const [loadingCommit, setLoadingCommit] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importDefaultYear, setImportDefaultYear] = useState<string>(String(new Date().getFullYear()));
  const [importPreviewTab, setImportPreviewTab] = useState<string>("resumo");

  const canConfirm = useMemo(() => {
    return !!preview && !loadingCommit && !loadingSimulate && !commitResult?.ok;
  }, [preview, loadingCommit, loadingSimulate, commitResult]);

  async function postFormData(url: string, file: File, extraFields?: Record<string, string>) {
    const fd = new FormData();
    fd.append("file", file);
    if (extraFields) {
      for (const [k, v] of Object.entries(extraFields)) {
        fd.append(k, v);
      }
    }

    const headers: Record<string, string> = {};
    const userId = localStorage.getItem("userId");
    if (userId) headers["x-user-id"] = userId;
    const devToken = sessionStorage.getItem("dev_token") || localStorage.getItem("dev_token");
    if (devToken) headers["x-dev-token"] = devToken;

    const resp = await fetch(url, {
      method: "POST",
      body: fd,
      headers,
      credentials: "include",
    });

    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(json?.error || json?.details || json?.message || "Erro na requisição");
    }
    return json;
  }

  async function handleSimulate() {
    try {
      setImportError(null);
      setCommitResult(null);
      setImportPreviewTab("resumo");

      if (!importFile) {
        setImportError("Selecione um arquivo .xlsx/.xls primeiro.");
        return;
      }

      setLoadingSimulate(true);
      const data = await postFormData("/api/import/simulate", importFile, {
        defaultYear: importDefaultYear,
      });
      setPreview(data);
    } catch (e: any) {
      setImportError(e?.message || "Falha ao simular importação.");
    } finally {
      setLoadingSimulate(false);
    }
  }

  async function handleCommit() {
    try {
      setImportError(null);
      setCommitResult(null);

      if (!importFile) {
        setImportError("Selecione um arquivo .xlsx/.xls primeiro.");
        return;
      }
      if (!preview) {
        setImportError("Primeiro faça a simulação.");
        return;
      }

      setLoadingCommit(true);
      const data = await postFormData("/api/dev/import/commit/dados", importFile, {
        defaultYear: importDefaultYear,
      });
      setCommitResult(data);
    } catch (e: any) {
      setImportError(e?.message || "Falha ao confirmar importação.");
    } finally {
      setLoadingCommit(false);
    }
  }

  function resetImportUI() {
    setImportFile(null);
    setPreview(null);
    setCommitResult(null);
    setImportError(null);
    setImportPreviewTab("resumo");
  }


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
            <Logo size="xs" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Painel Estratégico</h1>
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
            {isDevAdmin && (
              <Button
                variant="default"
                onClick={() => setLocation('/dev')}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold"
                data-testid="button-dev-toggle"
              >
                <Monitor className="w-4 h-4" />
                Painel Dev
              </Button>
            )}
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
            <Button
              variant="outline"
              onClick={() => window.open('https://complaint-tracker-OGRITO.replit.app', '_blank')}
              className="flex items-center gap-2 bg-yellow-400 text-black hover:bg-yellow-500 border-yellow-400"
              data-testid="button-transparencia"
            >
              <ExternalLink className="w-4 h-4" />
              Canal de Transparência
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="flex items-center gap-2"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

                {/* Main Content */}
                <main className="p-6 mt-8">
                  <div className="max-w-7xl mx-auto">
                    <Tabs defaultValue="benefits" className="w-full">

                        {/* ✅ Header de Ações (fixo para qualquer aba) */}
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Painel Estratégico</h1>
                    <p className="text-gray-600">Ações rápidas de manutenção e sincronização</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleSyncStripeDonors}
                      disabled={syncStripeLoading}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                      data-testid="btn-sync-stripe-donors"
                    >
                      {syncStripeLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sincronizando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Sync Stripe
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => queryClient.invalidateQueries()}
                      data-testid="btn-refresh-panel"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Atualizar
                    </Button>
                  </div>
                </div>
              
               {/* Indicador de scroll */}
              <div className="flex items-center justify-center gap-2 mb-6 text-sm text-muted-foreground">
                <span>Use a roda do mouse para navegar (14 opções no total)</span>
              </div>

              {/* Navegação com scroll */}
              <div className="relative py-8 overflow-visible">
                  <div
                    ref={tabsScrollRef}
                    className="w-full h-auto flex justify-start gap-4 overflow-x-auto overflow-y-visible py-4 mb-6 bg-transparent border-none scrollbar-thin scroll-smooth px-2"
                  >
                    <TabsList className="flex gap-4 bg-transparent border-none h-auto" style={{ overflow: "visible" }}>
                      <TabsTrigger
                        value="benefits"
                        className="group relative flex flex-col items-center gap-2 p-4 text-sm font-semibold h-auto min-h-[90px] min-w-[160px] flex-shrink-0 rounded-xl border-2 border-transparent bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-400"
                        data-testid="tab-benefits"
                      >
                        <Gift className="w-6 h-6 transition-transform group-hover:rotate-12 group-hover:scale-110" />
                        <span className="text-center leading-tight font-bold text-xs">Benefícios</span>
                      </TabsTrigger>

                      <TabsTrigger
                        value="stories"
                        className="group relative flex flex-col items-center gap-2 p-4 text-sm font-semibold h-auto min-h-[90px] min-w-[160px] flex-shrink-0 rounded-xl border-2 border-transparent bg-gradient-to-br from-pink-500/10 to-pink-600/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 data-[state=active]:from-pink-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:border-pink-400"
                        data-testid="tab-stories"
                      >
                        <Heart className="w-6 h-6 transition-transform group-hover:scale-110 group-hover:animate-pulse" />
                        <span className="text-center leading-tight font-bold text-xs">Histórias</span>
                      </TabsTrigger>

                      <TabsTrigger
                        value="auctions"
                        className="group relative flex flex-col items-center gap-2 p-4 text-sm font-semibold h-auto min-h-[90px] min-w-[160px] flex-shrink-0 rounded-xl border-2 border-transparent bg-gradient-to-br from-orange-500/10 to-orange-600/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:border-orange-400"
                        data-testid="tab-auctions"
                      >
                        <Target className="w-6 h-6 transition-transform group-hover:rotate-180 group-hover:scale-110" />
                        <span className="text-center leading-tight font-bold text-xs">Leilões</span>
                      </TabsTrigger>

                      <TabsTrigger
                        value="missions"
                        className="group relative flex flex-col items-center gap-2 p-4 text-sm font-semibold h-auto min-h-[90px] min-w-[160px] flex-shrink-0 rounded-xl border-2 border-transparent bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:border-green-400"
                        data-testid="tab-missions"
                      >
                        <Calendar className="w-6 h-6 transition-transform group-hover:scale-110 group-hover:-rotate-12" />
                        <span className="text-center leading-tight font-bold text-xs">Missões</span>
                      </TabsTrigger>

                      <TabsTrigger
                        value="automation"
                        className="group relative flex flex-col items-center gap-2 p-4 text-sm font-semibold h-auto min-h-[90px] min-w-[160px] flex-shrink-0 rounded-xl border-2 border-transparent bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:border-purple-400"
                        data-testid="tab-automation"
                      >
                        <Settings className="w-6 h-6 transition-transform group-hover:rotate-90 group-hover:scale-110" />
                        <span className="text-center leading-tight font-bold text-xs">Automação</span>
                      </TabsTrigger>

                      <TabsTrigger
                        value="donors"
                        className="group relative flex flex-col items-center gap-2 p-4 text-sm font-semibold h-auto min-h-[90px] min-w-[160px] flex-shrink-0 rounded-xl border-2 border-transparent bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:border-indigo-400"
                        data-testid="tab-donors"
                      >
                        <Users className="w-6 h-6 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                        <span className="text-center leading-tight font-bold text-xs">Doadores</span>
                      </TabsTrigger>

                      <TabsTrigger
                        value="donor-origin"
                        className="group relative flex flex-col items-center gap-2 p-4 text-sm font-semibold h-auto min-h-[90px] min-w-[160px] flex-shrink-0 rounded-xl border-2 border-transparent bg-gradient-to-br from-sky-500/10 to-sky-600/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 data-[state=active]:from-sky-500 data-[state=active]:to-sky-600 data-[state=active]:text-white data-[state=active]:border-sky-400"
                        data-testid="tab-donor-origin"
                      >
                        <Monitor className="w-6 h-6 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                        <span className="text-center leading-tight font-bold text-xs">Origem Doadores</span>
                      </TabsTrigger>

                      <TabsTrigger
                        value="stripe"
                        className="group relative flex flex-col items-center gap-2 p-4 text-sm font-semibold h-auto min-h-[90px] min-w-[160px] flex-shrink-0 rounded-xl border-2 border-transparent bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white data-[state=active]:border-yellow-400"
                        data-testid="tab-stripe"
                      >
                        <DollarSign className="w-6 h-6 transition-transform group-hover:scale-110 group-hover:animate-pulse" />
                        <span className="text-center leading-tight font-bold text-xs">Stripe</span>
                      </TabsTrigger>

                      <TabsTrigger
                        value="management"
                        className="group relative flex flex-col items-center gap-2 p-4 text-sm font-semibold h-auto min-h-[90px] min-w-[160px] flex-shrink-0 rounded-xl border-2 border-transparent bg-gradient-to-br from-teal-500/10 to-teal-600/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 data-[state=active]:from-teal-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:border-teal-400"
                        data-testid="tab-management"
                      >
                        <BarChart3 className="w-6 h-6 transition-transform group-hover:scale-110 group-hover:-rotate-12" />
                        <span className="text-center leading-tight font-bold text-xs">Visão Gerencial</span>
                      </TabsTrigger>

                      <TabsTrigger
                        value="gestao-vista"
                        className="group relative flex flex-col items-center gap-2 p-4 text-sm font-semibold h-auto min-h-[90px] min-w-[160px] flex-shrink-0 rounded-xl border-2 border-transparent bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 data-[state=active]:from-cyan-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:border-cyan-400"
                        data-testid="tab-gestao-vista"
                      >
                        <Activity className="w-6 h-6 transition-transform group-hover:scale-110 group-hover:animate-bounce" />
                        <span className="text-center leading-tight font-bold text-xs">Gestão à Vista</span>
                      </TabsTrigger>

                      <TabsTrigger
                        value="pagamentos-ingressos"
                        className="group relative flex flex-col items-center gap-2 p-4 text-sm font-semibold h-auto min-h-[90px] min-w-[160px] flex-shrink-0 rounded-xl border-2 border-transparent bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:border-emerald-400"
                        data-testid="tab-pagamentos-ingressos"
                      >
                        <Ticket className="w-6 h-6 transition-transform group-hover:rotate-12 group-hover:scale-110" />
                        <span className="text-center leading-tight font-bold text-xs">Pag. Stripe</span>
                      </TabsTrigger>

                      <TabsTrigger
                        value="pagamentos-cielo"
                        className="group relative flex flex-col items-center gap-2 p-4 text-sm font-semibold h-auto min-h-[90px] min-w-[160px] flex-shrink-0 rounded-xl border-2 border-transparent bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-400"
                        data-testid="tab-pagamentos-cielo"
                      >
                        <CreditCard className="w-6 h-6 transition-transform group-hover:scale-110 group-hover:-rotate-12" />
                        <span className="text-center leading-tight font-bold text-xs">Pag. Cielo</span>
                      </TabsTrigger>

                      <TabsTrigger
                        value="compradores-avulsos"
                        className="group relative flex flex-col items-center gap-2 p-4 text-sm font-semibold h-auto min-h-[90px] min-w-[160px] flex-shrink-0 rounded-xl border-2 border-transparent bg-gradient-to-br from-rose-500/10 to-rose-600/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 data-[state=active]:from-rose-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:border-rose-400"
                        data-testid="tab-compradores-avulsos"
                      >
                        <Phone className="w-6 h-6 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                        <span className="text-center leading-tight font-bold text-xs">Compradores Avulsos</span>
                      </TabsTrigger>

                      <TabsTrigger
                        value="estatisticas-ingressos"
                        className="group relative flex flex-col items-center gap-2 p-4 text-sm font-semibold h-auto min-h-[90px] min-w-[160px] flex-shrink-0 rounded-xl border-2 border-transparent bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 data-[state=active]:from-cyan-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:border-cyan-400"
                        data-testid="tab-estatisticas-ingressos"
                      >
                        <BarChart3 className="w-6 h-6 transition-transform group-hover:scale-110 group-hover:rotate-180" />
                        <span className="text-center leading-tight font-bold text-xs">Estatísticas Ingressos</span>
                      </TabsTrigger>

                      <TabsTrigger
                        value="marketing-links"
                        className="group relative flex flex-col items-center gap-2 p-4 text-sm font-semibold h-auto min-h-[90px] min-w-[160px] flex-shrink-0 rounded-xl border-2 border-transparent bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:border-indigo-400"
                        data-testid="tab-marketing-links"
                      >
                        <ExternalLink className="w-6 h-6 transition-transform group-hover:scale-110 group-hover:-rotate-45" />
                        <span className="text-center leading-tight font-bold text-xs">Marketing Links</span>
                      </TabsTrigger>

                      <TabsTrigger
                        value="converter-doacoes"
                        className="group relative flex flex-col items-center gap-2 p-4 text-sm font-semibold h-auto min-h-[90px] min-w-[160px] flex-shrink-0 rounded-xl border-2 border-transparent bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:border-purple-400"
                        data-testid="tab-converter-doacoes"
                      >
                        <RefreshCw className="w-6 h-6 transition-transform group-hover:rotate-180 group-hover:scale-110" />
                        <span className="text-center leading-tight font-bold text-xs">🔄 Converter Doações</span>
                      </TabsTrigger>

                      <TabsTrigger
                        value="notifications"
                        className="group relative flex flex-col items-center gap-2 p-4 text-sm font-semibold h-auto min-h-[90px] min-w-[160px] flex-shrink-0 rounded-xl border-2 border-transparent bg-gradient-to-br from-amber-500/10 to-amber-600/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:border-amber-400"
                        data-testid="tab-notifications"
                      >
                        <MessageCircle className="w-6 h-6 transition-transform group-hover:scale-110 group-hover:animate-bounce" />
                        <span className="text-center leading-tight font-bold text-xs">Notificações</span>
                      </TabsTrigger>

                      <TabsTrigger
                        value="gestao-equipe"
                        className="group relative flex flex-col items-center gap-2 p-4 text-sm font-semibold h-auto min-h-[90px] min-w-[160px] flex-shrink-0 rounded-xl border-2 border-transparent bg-gradient-to-br from-violet-500/10 to-violet-600/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 data-[state=active]:from-violet-500 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:border-violet-400"
                        data-testid="tab-gestao-equipe"
                      >
                        <Users className="w-6 h-6 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                        <span className="text-center leading-tight font-bold text-xs">Gestão Equipe</span>
                      </TabsTrigger>

                      <TabsTrigger
                        value="ganhadores"
                        className="group relative flex flex-col items-center gap-2 p-4 text-sm font-semibold h-auto min-h-[90px] min-w-[160px] flex-shrink-0 rounded-xl border-2 border-transparent bg-gradient-to-br from-amber-500/10 to-amber-600/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:border-amber-400"
                        data-testid="tab-ganhadores"
                      >
                        <Trophy className="w-6 h-6 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                        <span className="text-center leading-tight font-bold text-xs">Ganhadores</span>
                      </TabsTrigger>

                      <TabsTrigger
                        value="catraca-webhook"
                        className="group relative flex flex-col items-center gap-2 p-4 text-sm font-semibold h-auto min-h-[90px] min-w-[160px] flex-shrink-0 rounded-xl border-2 border-transparent bg-gradient-to-br from-red-500/10 to-red-600/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:border-red-400"
                        data-testid="tab-catraca-webhook"
                      >
                        <Activity className="w-6 h-6 transition-transform group-hover:scale-110 group-hover:animate-pulse" />
                        <span className="text-center leading-tight font-bold text-xs">Catraca Intelbras</span>
                      </TabsTrigger>


                      <TabsTrigger
                        value="instagram-analytics"
                        className="group relative flex flex-col items-center gap-2 p-4 text-sm font-semibold h-auto min-h-[90px] min-w-[160px] flex-shrink-0 rounded-xl border-2 border-transparent bg-gradient-to-br from-pink-500/10 to-purple-600/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:border-pink-400"
                        data-testid="tab-instagram-analytics"
                      >
                        <TrendingUp className="w-6 h-6 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                        <span className="text-center leading-tight font-bold text-xs">Instagram</span>
                      </TabsTrigger>

                      <button
                        type="button"
                        onClick={() => setImportOpen(true)}
                        className="group relative flex flex-col items-center gap-2 p-4 text-sm font-semibold
                                  h-auto min-h-[90px] min-w-[160px] flex-shrink-0 rounded-xl
                                  border-2 border-transparent
                                  bg-gradient-to-br from-slate-500/10 to-slate-600/10
                                  backdrop-blur-sm transition-all duration-300
                                  hover:scale-105 hover:border-slate-300"
                      >
                        <UploadCloud className="w-6 h-6 transition-transform group-hover:scale-110" />
                        <span className="text-center leading-tight font-bold text-xs">Importar dados</span>
                      </button>
                    </TabsList>
                  </div>
              </div>

              {/* Modal de Importação de Dados */}
              <Dialog open={importOpen} onOpenChange={(open) => { setImportOpen(open); if (!open) resetImportUI(); }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                      <FileSpreadsheet className="w-5 h-5" />
                      Importar Dados Gerais
                    </DialogTitle>
                    <DialogDescription>
                      Envie uma planilha (.xlsx/.xls), simule para conferir e depois confirme para gravar no banco.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* Upload + Configurações */}
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Arquivo (.xlsx / .xls)</label>
                        <Input
                          type="file"
                          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                          onChange={(e) => {
                            const f = e.target.files?.[0] ?? null;
                            setImportFile(f);
                            setPreview(null);
                            setCommitResult(null);
                            setImportError(null);
                          }}
                        />
                        {importFile?.name && (
                          <div className="text-xs text-muted-foreground">
                            Selecionado: <span className="font-semibold">{importFile.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Ano padrão</label>
                        <Select value={importDefaultYear} onValueChange={setImportDefaultYear}>
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2025">2025</SelectItem>
                            <SelectItem value="2026">2026</SelectItem>
                            <SelectItem value="2027">2027</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Classificação de programas */}
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
                      <div className="font-semibold mb-1">Classificação automática de programas:</div>
                      <div className="flex flex-wrap gap-2">
                        <span><Badge variant="outline" className="text-xs">PEC</Badge> PEC, Casa Sonhar, SCFV, Contraturno</span>
                        <span className="text-blue-400">|</span>
                        <span><Badge variant="outline" className="text-xs">Inclusão</Badge> QP, Inclusão, Cursos EAD, EAD</span>
                      </div>
                      <div className="mt-1 text-blue-600">Projetos com nomes fora dessas palavras-chave serão rejeitados como "não classificado".</div>
                    </div>

                    {/* Botões de ação */}
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={handleSimulate}
                        disabled={!importFile || loadingSimulate || loadingCommit}
                      >
                        {loadingSimulate ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                        Simular
                      </Button>
                      <Button onClick={handleCommit} disabled={!canConfirm || loadingCommit} className="bg-green-600 hover:bg-green-700">
                        {loadingCommit ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                        Confirmar importação
                      </Button>
                      <Button variant="outline" onClick={resetImportUI}>
                        Limpar
                      </Button>
                    </div>

                    {/* Erro */}
                    {importError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>{importError}</div>
                      </div>
                    )}

                    {/* Resultado do commit */}
                    {commitResult?.ok && (
                      <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
                        <div className="flex items-center gap-2 font-semibold text-green-800">
                          <CheckCircle2 className="w-5 h-5" />
                          Importação confirmada com sucesso!
                        </div>
                        {commitResult.summary && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div className="bg-white rounded-lg p-2 text-center">
                              <div className="text-lg font-bold text-green-700">{commitResult.summary.approvedRows ?? 0}</div>
                              <div className="text-xs text-muted-foreground">Linhas aprovadas</div>
                            </div>
                            <div className="bg-white rounded-lg p-2 text-center">
                              <div className="text-lg font-bold text-red-600">{commitResult.summary.rejectedRows ?? 0}</div>
                              <div className="text-xs text-muted-foreground">Rejeitadas</div>
                            </div>
                            <div className="bg-white rounded-lg p-2 text-center">
                              <div className="text-lg font-bold text-blue-600">{commitResult.summary.createdProjects ?? 0}</div>
                              <div className="text-xs text-muted-foreground">Projetos criados</div>
                            </div>
                            <div className="bg-white rounded-lg p-2 text-center">
                              <div className="text-lg font-bold text-purple-600">{commitResult.summary.createdTurmas ?? 0}</div>
                              <div className="text-xs text-muted-foreground">Turmas criadas</div>
                            </div>
                            <div className="bg-white rounded-lg p-2 text-center">
                              <div className="text-lg font-bold text-teal-600">{commitResult.summary.createdLinks ?? 0}</div>
                              <div className="text-xs text-muted-foreground">Vínculos criados</div>
                            </div>
                            <div className="bg-white rounded-lg p-2 text-center">
                              <div className="text-lg font-bold text-orange-600">{commitResult.summary.updatedLinks ?? 0}</div>
                              <div className="text-xs text-muted-foreground">Vínculos existentes</div>
                            </div>
                            <div className="bg-white rounded-lg p-2 text-center">
                              <div className="text-lg font-bold text-indigo-600">{commitResult.summary.createdActivities ?? 0}</div>
                              <div className="text-xs text-muted-foreground">Atividades criadas</div>
                            </div>
                            <div className="bg-white rounded-lg p-2 text-center">
                              <div className="text-lg font-bold text-amber-600">{commitResult.summary.filledMatriculas ?? 0}</div>
                              <div className="text-xs text-muted-foreground">Matrículas preenchidas</div>
                            </div>
                          </div>
                        )}
                        {commitResult.rejectedPreview?.length > 0 && (
                          <div className="mt-2">
                            <div className="text-sm font-medium text-red-700 mb-1">Linhas rejeitadas no commit ({commitResult.rejectedPreview.length}):</div>
                            <ScrollArea className="h-[150px]">
                              {commitResult.rejectedPreview.map((r: any, idx: number) => (
                                <div key={idx} className="text-xs py-1 border-b last:border-b-0 flex items-center gap-2">
                                  <Badge variant="destructive" className="text-xs">L{r.rowIndex}</Badge>
                                  <span>{r.error}</span>
                                  {r.cpf && <span className="text-muted-foreground">CPF: {r.cpf}</span>}
                                </div>
                              ))}
                            </ScrollArea>
                          </div>
                        )}
                      </div>
                    )}

                    <Separator />

                    {/* Preview com abas */}
                    {preview ? (
                      <div className="space-y-3">
                        {/* Badges de resumo */}
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-sm px-3 py-1">Total: {preview?.stats?.totalRows ?? 0}</Badge>
                          <Badge className="bg-green-600 text-white text-sm px-3 py-1">Aprovadas: {preview?.stats?.approvedRows ?? 0}</Badge>
                          <Badge className="bg-red-600 text-white text-sm px-3 py-1">Rejeitadas: {preview?.stats?.rejectedRows ?? 0}</Badge>
                          <Badge variant="outline" className="text-sm px-3 py-1">Pessoas encontradas: {preview?.stats?.personsFound ?? 0}</Badge>
                          <Badge variant="outline" className="text-sm px-3 py-1">Pessoas não encontradas: {preview?.stats?.personsNotFound ?? 0}</Badge>
                        </div>

                        {/* Abas do preview */}
                        <Tabs value={importPreviewTab} onValueChange={setImportPreviewTab}>
                          <TabsList className="grid grid-cols-4 w-full">
                            <TabsTrigger value="resumo">Resumo</TabsTrigger>
                            <TabsTrigger value="aprovadas">
                              Aprovadas ({preview?.stats?.approvedRows ?? 0})
                            </TabsTrigger>
                            <TabsTrigger value="rejeitadas">
                              Rejeitadas ({preview?.stats?.rejectedRows ?? 0})
                            </TabsTrigger>
                            <TabsTrigger value="entidades">Entidades</TabsTrigger>
                          </TabsList>

                          {/* Aba Resumo */}
                          <TabsContent value="resumo" className="mt-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <Card className="p-3 text-center">
                                <div className="text-2xl font-bold text-blue-600">{preview?.stats?.projectsToCreate ?? 0}</div>
                                <div className="text-xs text-muted-foreground">Projetos a criar</div>
                              </Card>
                              <Card className="p-3 text-center">
                                <div className="text-2xl font-bold text-purple-600">{preview?.stats?.turmasToCreate ?? 0}</div>
                                <div className="text-xs text-muted-foreground">Turmas a criar</div>
                              </Card>
                              <Card className="p-3 text-center">
                                <div className="text-2xl font-bold text-teal-600">{preview?.stats?.linksToCreate ?? 0}</div>
                                <div className="text-xs text-muted-foreground">Vínculos a criar</div>
                              </Card>
                              <Card className="p-3 text-center">
                                <div className="text-2xl font-bold text-orange-600">{preview?.stats?.linksAlreadyExist ?? 0}</div>
                                <div className="text-xs text-muted-foreground">Vínculos existentes</div>
                              </Card>
                              <Card className="p-3 text-center">
                                <div className="text-2xl font-bold text-amber-600">{preview?.stats?.matriculasToFill ?? 0}</div>
                                <div className="text-xs text-muted-foreground">Matrículas a preencher</div>
                              </Card>
                              <Card className="p-3 text-center">
                                <div className="text-2xl font-bold text-green-600">{preview?.stats?.personsFound ?? 0}</div>
                                <div className="text-xs text-muted-foreground">Pessoas encontradas</div>
                              </Card>
                              <Card className="p-3 text-center">
                                <div className="text-2xl font-bold text-red-600">{preview?.stats?.personsNotFound ?? 0}</div>
                                <div className="text-xs text-muted-foreground">Pessoas n/ encontradas</div>
                              </Card>
                              <Card className="p-3 text-center">
                                <div className="text-2xl font-bold text-gray-600">{preview?.stats?.totalRows ?? 0}</div>
                                <div className="text-xs text-muted-foreground">Total de linhas</div>
                              </Card>
                            </div>
                            {preview?.debug && (
                              <div className="mt-4 p-3 rounded-lg border bg-slate-50 text-xs space-y-1">
                                <div className="font-semibold text-sm mb-2">Diagnóstico da Planilha</div>
                                <div>Aba participantes: <span className="font-mono font-semibold">{preview.debug.participantesSheet}</span> (header na linha {(preview.debug.participantesHeaderRow ?? 0) + 1})</div>
                                <div>Aba atividades: <span className="font-mono font-semibold">{preview.debug.atividadesSheet}</span> (header na linha {(preview.debug.atividadesHeaderRow ?? 0) + 1})</div>
                                <div>Participantes lidos: <span className="font-semibold">{preview.debug.participantesTotal}</span> (com CPF: <span className="text-green-600 font-semibold">{preview.debug.participantesComCpf}</span>, sem CPF: <span className="text-red-600 font-semibold">{preview.debug.participantesSemCpf}</span>)</div>
                                <div>Mapa ID_Atendido→CPF: <span className="font-semibold">{preview.debug.cpfByAtendidoIdSize}</span> | Mapa Matrícula→CPF: <span className="font-semibold">{preview.debug.cpfByMatriculaSize}</span> | Mapa Nome→CPF: <span className="font-semibold">{preview.debug.cpfByNomeSize}</span></div>
                                {preview.debug.participantesSampleKeys?.length > 0 && (
                                  <div>Colunas participantes: <span className="font-mono text-[10px]">{preview.debug.participantesSampleKeys.join(", ")}</span></div>
                                )}
                                {preview.debug.atividadesSampleKeys?.length > 0 && (
                                  <div>Colunas atividades: <span className="font-mono text-[10px]">{preview.debug.atividadesSampleKeys.join(", ")}</span></div>
                                )}
                              </div>
                            )}
                          </TabsContent>

                          {/* Aba Aprovadas */}
                          <TabsContent value="aprovadas" className="mt-3">
                            <ScrollArea className="h-[350px]">
                              {(preview?.approvedRows ?? []).length === 0 ? (
                                <div className="text-sm text-muted-foreground text-center py-8">Nenhuma linha aprovada.</div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="grid grid-cols-[60px_80px_1fr_1fr_1fr_100px] gap-2 text-xs font-semibold text-muted-foreground border-b pb-2 sticky top-0 bg-white">
                                    <span>Linha</span>
                                    <span>Tipo</span>
                                    <span>CPF / Nome</span>
                                    <span>Projeto</span>
                                    <span>Turma</span>
                                    <span>Ações</span>
                                  </div>
                                  {(preview?.approvedRows ?? []).slice(0, 500).map((r: any, idx: number) => (
                                    <div key={idx} className="grid grid-cols-[60px_80px_1fr_1fr_1fr_100px] gap-2 text-xs py-1.5 border-b last:border-b-0 items-center">
                                      <span className="font-mono">{r.rowIndex}</span>
                                      <Badge variant={r.programType === "pec" ? "default" : "secondary"} className="text-xs w-fit">
                                        {r.programType?.toUpperCase()}
                                      </Badge>
                                      <div className="truncate">
                                        <span className="font-mono">{r.cpf}</span>
                                        {r.nome && <span className="text-muted-foreground ml-1">({r.nome})</span>}
                                      </div>
                                      <span className="truncate">{r.projectName}</span>
                                      <span className="truncate">{r.turmaTitle}</span>
                                      <div className="flex gap-1 flex-wrap">
                                        {r.actions?.willCreateProject && <Badge className="bg-amber-100 text-amber-800 text-[10px]">+proj</Badge>}
                                        {r.actions?.willCreateTurma && <Badge className="bg-purple-100 text-purple-800 text-[10px]">+turma</Badge>}
                                        {r.actions?.willCreateLink && <Badge className="bg-teal-100 text-teal-800 text-[10px]">+vínculo</Badge>}
                                        {r.actions?.linkAlreadyExists && <Badge className="bg-gray-100 text-gray-600 text-[10px]">existe</Badge>}
                                        {r.actions?.willFillMatricula && <Badge className="bg-indigo-100 text-indigo-800 text-[10px]">+matr</Badge>}
                                      </div>
                                    </div>
                                  ))}
                                  {(preview?.approvedRows ?? []).length > 500 && (
                                    <div className="text-xs text-muted-foreground text-center py-2">
                                      Mostrando 500 de {preview.approvedRows.length} linhas aprovadas.
                                    </div>
                                  )}
                                </div>
                              )}
                            </ScrollArea>
                          </TabsContent>

                          {/* Aba Rejeitadas */}
                          <TabsContent value="rejeitadas" className="mt-3">
                            <ScrollArea className="h-[350px]">
                              {(preview?.rejectedRows ?? []).length === 0 ? (
                                <div className="text-sm text-muted-foreground text-center py-8">Nenhuma linha rejeitada. Tudo certo!</div>
                              ) : (
                                <div className="space-y-2">
                                  {(preview?.rejectedRows ?? []).slice(0, 500).map((r: any, idx: number) => (
                                    <div key={idx} className="text-sm py-2 px-3 rounded-lg border bg-red-50/50">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="destructive" className="text-xs">Linha {r.rowIndex}</Badge>
                                        <Badge variant="outline" className="text-xs">{r.errorCode}</Badge>
                                        {r.programType && <Badge variant="secondary" className="text-xs">{r.programType.toUpperCase()}</Badge>}
                                        {r.cpf && <span className="font-mono text-xs text-muted-foreground">CPF: {r.cpf}</span>}
                                      </div>
                                      <div className="text-muted-foreground mt-1 text-xs">{r.errorMessage}</div>
                                      {r.projectName && <div className="text-xs mt-0.5">Projeto: {r.projectName}</div>}
                                      {r.hint && <div className="text-xs mt-1 text-blue-600">Dica: {r.hint}</div>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </ScrollArea>
                          </TabsContent>

                          {/* Aba Entidades */}
                          <TabsContent value="entidades" className="mt-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="rounded-xl border p-3">
                                <div className="font-semibold mb-2 text-sm">Projetos / Programas</div>
                                <ScrollArea className="h-[280px] pr-3">
                                  {(preview?.entitiesPreview?.projects ?? []).length === 0 ? (
                                    <div className="text-xs text-muted-foreground py-4 text-center">Nenhum projeto identificado.</div>
                                  ) : (
                                    (preview?.entitiesPreview?.projects ?? []).map((p: any, idx: number) => (
                                      <div key={idx} className="flex items-center justify-between text-sm py-1.5 border-b last:border-b-0">
                                        <span className="truncate">{p.name}</span>
                                        {p.willCreate ? (
                                          <Badge className="bg-amber-600 text-white text-xs">criar</Badge>
                                        ) : (
                                          <Badge variant="secondary" className="text-xs">existe</Badge>
                                        )}
                                      </div>
                                    ))
                                  )}
                                </ScrollArea>
                              </div>
                              <div className="rounded-xl border p-3">
                                <div className="font-semibold mb-2 text-sm">Turmas</div>
                                <ScrollArea className="h-[280px] pr-3">
                                  {(preview?.entitiesPreview?.turmas ?? []).length === 0 ? (
                                    <div className="text-xs text-muted-foreground py-4 text-center">Nenhuma turma identificada.</div>
                                  ) : (
                                    (preview?.entitiesPreview?.turmas ?? []).map((t: any, idx: number) => (
                                      <div key={idx} className="flex items-center justify-between text-sm py-1.5 border-b last:border-b-0">
                                        <span className="truncate">{t.title}</span>
                                        {t.willCreate ? (
                                          <Badge className="bg-amber-600 text-white text-xs">criar</Badge>
                                        ) : (
                                          <Badge variant="secondary" className="text-xs">existe</Badge>
                                        )}
                                      </div>
                                    ))
                                  )}
                                </ScrollArea>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-6 border rounded-lg bg-gray-50">
                        Selecione um arquivo e clique em <span className="font-semibold">Simular</span> para ver o preview antes de confirmar.
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>


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
                        const hasPrazo = beneficio.prazoLances != null;
                        const tempoRestante = hasPrazo ? new Date(beneficio.prazoLances).getTime() - Date.now() : null;
                        const diasRestantes = tempoRestante ? Math.ceil(tempoRestante / (1000 * 60 * 60 * 24)) : null;
                        
                        return (
                          <Card key={beneficio.id} className="border-green-200">
                            <CardContent className="p-3">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium text-gray-900">{beneficio.titulo}</p>
                                  <p className="text-xs text-gray-500">
                                    {hasPrazo 
                                      ? `Termina em: ${diasRestantes && diasRestantes > 0 ? `${diasRestantes} dias` : 'Menos de 1 dia'}`
                                      : 'Sem prazo definido (aberto)'}
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

            {/* Donor Dashboard Tab - NOVA VERSÃO (igual ao Leo) */}
            <TabsContent value="donors" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Dashboard de Doadores</h2>
                  <p className="text-gray-600">Dados em tempo real do Stripe e doadores externos</p>
                </div>
              </div>

              {/* Status de Doações */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    Status de Doações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">{porStatusStripe.active}</div>
                      <p className="text-sm text-gray-600">Ativas</p>
                      <p className="text-xs text-gray-400">Pagando normalmente</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">{porStatusStripe.trialing}</div>
                      <p className="text-sm text-gray-600">Em Teste</p>
                      <p className="text-xs text-gray-400">Período de trial</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-3xl font-bold text-yellow-600">{porStatusStripe.past_due}</div>
                      <p className="text-sm text-gray-600">Pendentes</p>
                      <p className="text-xs text-gray-400">Pagamento atrasado</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-3xl font-bold text-red-600">{porStatusStripe.canceled}</div>
                      <p className="text-sm text-gray-600">Canceladas</p>
                      <p className="text-xs text-gray-400">Assinatura encerrada</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-3xl font-bold text-orange-600">{doadoresExternosData?.totalDoadores || 0}</div>
                      <p className="text-sm text-gray-600">Externos</p>
                      <p className="text-xs text-gray-400">Doações fora do app</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gráficos: Distribuição por Plano e Faixa de Valor */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribuição por Plano */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      Distribuição por Plano
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {porPlanoStripe.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={porPlanoStripe.filter((p: any) => p.quantidade > 0)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ plano, quantidade }: any) => `${plano.split(' ')[0]}: ${quantidade}`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="quantidade"
                          >
                            {porPlanoStripe.filter((p: any) => p.quantidade > 0).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={CORES_PLANO[index % CORES_PLANO.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any, name: string, props: any) => [
                            `${value} doadores (R$ ${props.payload.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'})`,
                            props.payload.plano
                          ]} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-gray-400">
                        Carregando dados...
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Distribuição por Faixa de Valor */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-indigo-600" />
                      Distribuição por Faixa de Valor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {distribuicaoPorValorStripe.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={distribuicaoPorValorStripe}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="faixa" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="quantidade" fill="#6366f1" name="Doadores" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[250px] text-gray-400">
                        Carregando dados...
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Gráfico de Motivos de Cancelamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-red-600" />
                    Motivos de Cancelamento
                    <Badge variant="outline" className="ml-2">
                      {porStatusStripe.canceled} cancelados
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dadosMotivosCancelamento.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Gráfico de Pizza */}
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={dadosMotivosCancelamento}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ motivo, quantidade }: any) => `${quantidade}`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="quantidade"
                          >
                            {dadosMotivosCancelamento.map((entry: any, index: number) => (
                              <Cell key={`cell-motivo-${index}`} fill={CORES_MOTIVO[index % CORES_MOTIVO.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any, name: string, props: any) => [
                              `${value} cancelamentos`,
                              props.payload.motivo
                            ]} 
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                      
                      {/* Legenda com lista de motivos */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-700">Ranking de Motivos</h4>
                        {dadosMotivosCancelamento.map((item: any, index: number) => (
                          <div key={item.motivo} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: CORES_MOTIVO[index % CORES_MOTIVO.length] }}
                              />
                              <span className="text-sm font-medium text-gray-700">{item.motivo}</span>
                            </div>
                            <Badge 
                              variant={index === 0 ? "destructive" : "secondary"}
                              className="font-bold"
                            >
                              {item.quantidade}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[200px] text-gray-400">
                      <PieChart className="w-12 h-12 mb-2" />
                      <p>Nenhum cancelamento registrado</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lista Individual de Doadores - Stripe */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Lista de Doadores Aplicativo - Dados em Tempo Real do Stripe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Campo de Pesquisa */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Pesquisar doador por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        data-testid="input-search-doadores-stripe"
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Telefone</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">Valor/mês</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Plano</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Periodicidade</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Motivo Cancelamento</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Adesão</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Dias</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Gritos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {listaDoadoresStripe
                          .filter((doador: any) => 
                            !searchTerm || 
                            doador.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            doador.plano?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            doador.telefone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            doador.email?.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .sort((a: any, b: any) => b.valor - a.valor)
                          .map((doador: any, index: number) => (
                            <tr key={doador.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 text-gray-800">{doador.nome}</td>
                              <td className="py-3 px-4 text-gray-600 text-sm">{doador.telefone || '-'}</td>
                              <td className="py-3 px-4 text-gray-600 text-sm truncate max-w-[200px]" title={doador.email}>{doador.email || '-'}</td>
                              <td className="py-3 px-4 text-right font-medium text-green-600">
                                R$ {doador.valor?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || '0,00'}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                  doador.plano === "platinum" ? "bg-purple-100 text-purple-700" :
                                  doador.plano === "grito" ? "bg-orange-100 text-orange-700" :
                                  doador.plano === "voz" ? "bg-blue-100 text-blue-700" :
                                  "bg-gray-100 text-gray-700"
                                }`}>
                                  {doador.plano === "platinum" ? "Platinum" :
                                   doador.plano === "grito" ? "Grito" :
                                   doador.plano === "voz" ? "Voz" : "Eco"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center text-gray-600">{doador.periodicidade || "Mensal"}</td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                  doador.status === 'active' ? 'bg-green-100 text-green-700' :
                                  doador.status === 'trialing' ? 'bg-blue-100 text-blue-700' :
                                  doador.status === 'canceled' ? 'bg-red-100 text-red-700' :
                                  doador.status === 'past_due' ? 'bg-orange-100 text-orange-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {doador.status === 'active' ? 'Ativo' : 
                                   doador.status === 'trialing' ? 'Trial' : 
                                   doador.status === 'canceled' ? 'Cancelado' :
                                   doador.status === 'past_due' ? 'Pagto Pendente' : 'Pendente'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-left">
                                {doador.status === 'canceled' ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">{doador.motivoCancelamento || '-'}</span>
                                    <button
                                      onClick={() => {
                                        setMotivoModalUserId(doador.userId || doador.id);
                                        setMotivoModalNome(doador.nome);
                                        setMotivoSelecionado(doador.motivoCancelamento || '');
                                        setShowMotivoModal(true);
                                      }}
                                      className="text-blue-600 hover:text-blue-800 text-xs underline"
                                    >
                                      {doador.motivoCancelamento ? 'Editar' : 'Adicionar'}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center text-gray-600">{doador.dataAdesao}</td>
                              <td className="py-3 px-4 text-center text-gray-600">{doador.diasComoDoador}</td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                                  (doador.gritos || 0) >= 500 ? 'bg-amber-100 text-amber-700' :
                                  (doador.gritos || 0) >= 100 ? 'bg-green-100 text-green-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {doador.gritos || 0}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {listaDoadoresStripe.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        Carregando doadores do Stripe...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Doadores Externos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-600" />
                    Doadores Externos - Doações fora do Aplicativo
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    Total: {doadoresExternosData?.totalDoadores || 0} doadores | 
                    Arrecadação: R$ {(doadoresExternosData?.arrecadacaoMensal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">Valor/mês</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Observação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doadoresExternosData?.doadores?.map((doador: any, index: number) => (
                          <tr key={doador.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-gray-800 font-medium">{doador.nome}</td>
                            <td className="py-3 px-4 text-right font-medium text-orange-600">
                              R$ {doador.valorMensal?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || '0,00'}
                            </td>
                            <td className="py-3 px-4 text-center text-gray-500 text-sm">{doador.observacao || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(!doadoresExternosData?.doadores || doadoresExternosData.doadores.length === 0) && (
                      <div className="text-center py-8 text-gray-400">
                        Carregando doadores externos...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Donor Origin Tab - Aba separada de Origem */}
            <TabsContent value="donor-origin" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Origem dos Doadores</h2>
                  <p className="text-gray-600">Análise de plataforma de origem dos doadores (Web App vs Mobile App)</p>
                </div>
              </div>
              <DonorOriginSection />
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
                  <RefreshCw className="w-8 h-8 animate-spin" />
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

            {/* Nova aba: Notificações In-App e Push */}
            <TabsContent value="notifications" className="space-y-6 mt-6">
              <NotificationsSection queryClient={queryClient} />
            </TabsContent>

            {/* Gestão de Equipe Tab */}
            <TabsContent value="gestao-equipe" className="space-y-6 mt-6">
              <TeamManagementSection />
            </TabsContent>

            {/* Ganhadores de Benefícios Tab */}
            <TabsContent value="ganhadores" className="space-y-6 mt-6">
              <GanhadoresSection queryClient={queryClient} />
            </TabsContent>

            {/* Catraca Intelbras / Webhook Tab */}
            <TabsContent value="catraca-webhook" className="space-y-6 mt-6">
              <CatracaWebhookSection />
            </TabsContent>

            <TabsContent value="instagram-analytics" className="mt-6">
              <InstagramAnalyticsSection />
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
                    <SelectItem value="check_in_consecutivo">Check-in Consecutivo</SelectItem>
                    <SelectItem value="completar_perfil">Completar Perfil</SelectItem>
                    <SelectItem value="convite_amigo">Convite Amigo</SelectItem>
                    <SelectItem value="especial">Especial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Campo de Dias Necessários - só aparece para Check-in Consecutivo */}
            {missionFormData.tipoMissao === 'check_in_consecutivo' && (
              <div>
                <Label>Dias Consecutivos Necessários</Label>
                <Input 
                  type="number"
                  min={1}
                  max={30}
                  value={missionFormData.diasNecessarios}
                  onChange={(e) => setMissionFormData(prev => ({ ...prev, diasNecessarios: parseInt(e.target.value) || 3 }))}
                  placeholder="3"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Quantos dias consecutivos de check-in são necessários para completar a missão
                </p>
              </div>
            )}
            
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
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                id="habilitarLinkCompartilhamento"
                checked={missionFormData.habilitarLinkCompartilhamento}
                onChange={(e) => setMissionFormData(prev => ({ ...prev, habilitarLinkCompartilhamento: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="habilitarLinkCompartilhamento" className="text-sm cursor-pointer">
                Habilitar Link de Compartilhamento (mostra botão "Compartilhar" ao invés do formulário de evidência)
              </Label>
            </div>
            {/* Campo de quantidade de amigos - aparece quando evidenceType é link */}
            {missionFormData.evidenceType === "link" && (
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <Label>Quantidade de Amigos Necessários</Label>
                <Input 
                  type="number"
                  min="1"
                  max="100"
                  value={missionFormData.quantidadeAmigos}
                  onChange={(e) => setMissionFormData(prev => ({ ...prev, quantidadeAmigos: parseInt(e.target.value) || 1 }))}
                  className="mt-1"
                />
                <p className="text-xs text-purple-600 mt-1">Número de amigos que o doador precisa convidar para completar a missão</p>
              </div>
            )}
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

      {/* Modal de Motivo de Cancelamento */}
      <Dialog open={showMotivoModal} onOpenChange={setShowMotivoModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Motivo do Cancelamento</DialogTitle>
            <DialogDescription>
              Selecione o motivo do cancelamento para {motivoModalNome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              {motivosPredefinidos.map((motivo) => (
                <button
                  key={motivo}
                  onClick={() => setMotivoSelecionado(motivo)}
                  className={`text-left px-4 py-3 rounded-lg border transition-colors ${
                    motivoSelecionado === motivo 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {motivo}
                </button>
              ))}
            </div>
            
            {motivoSelecionado === 'Outro' && (
              <Input
                placeholder="Digite o motivo..."
                value={motivoCustom}
                onChange={(e) => setMotivoCustom(e.target.value)}
                autoFocus
              />
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowMotivoModal(false);
                  setMotivoSelecionado('');
                  setMotivoCustom('');
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveMotivo}
                disabled={(!motivoSelecionado || (motivoSelecionado === 'Outro' && !motivoCustom)) || savingMotivo}
              >
                {savingMotivo ? 'Salvando...' : 'Salvar Motivo'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}