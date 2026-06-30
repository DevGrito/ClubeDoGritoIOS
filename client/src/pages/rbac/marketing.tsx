import { useState, useEffect } from "react";
import { clearLocalStoragePreservingLgpd } from "@/lib/auth-session";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Legend, ReferenceLine,
} from "recharts";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/lib/queryClient";
import AlterarSenhaMarketing from "@/components/AlterarSenhaMarketing";
import { PushNotificationSettings } from "@/components/PushNotificationSettings";
import {
  Shield,
  LogOut,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Minus,
  RefreshCw,
  KeyRound,
  AlertTriangle,
  Eye,
  Activity
} from "lucide-react";
const META_SEGUIDORES_ANUAL = 15000;
const SEGUIDORES_BASE       = 11538;
const META_GANHOS_ANUAL     = META_SEGUIDORES_ANUAL - SEGUIDORES_BASE;
const META_PERDIDOS_ANUAL   = 1500;
const META_DOADORES         = 1000;
const MESES_LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

/* ── Barra de progresso animada ─────────────────────────────────── */
function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  const [anim, setAnim] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnim(pct), 400); return () => clearTimeout(t); }, [pct]);
  return (
    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${anim}%`, backgroundColor: color }} />
    </div>
  );
}

/* ── Card de métrica principal ───────────────────────────────────── */
function MetricCard({ icon: Icon, label, value, sub, trend, color, bg }: {
  icon: any; label: string; value: string; sub?: string; trend?: string; color: string; bg: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className="p-3 rounded-xl flex-shrink-0" style={{ backgroundColor: bg }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">{value}</p>
        {sub  && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        {trend && <p className="text-xs font-semibold mt-1" style={{ color }}>{trend}</p>}
      </div>
    </div>
  );
}

/* ── Chip de seleção de ano/mês ─────────────────────────────────── */
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        active ? 'bg-pink-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

/* ── Página principal ────────────────────────────────────────────── */
export default function MarketingPage() {
  const fetch = authFetch;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAlterarSenhaModal, setShowAlterarSenhaModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [appIdInput, setAppIdInput] = useState('');
  const [appSecretInput, setAppSecretInput] = useState('');
  const [ano, setAno] = useState('2026');
  const [mes, setMes] = useState('todos');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'eventos'>('dashboard');

  const userName = localStorage.getItem("userName") || "Marketing";
  const userEmail = localStorage.getItem("userEmail") || "";

  const handleLogout = () => {
    clearLocalStoragePreservingLgpd();
    sessionStorage.clear();
    toast({ title: "Logout realizado", description: "Até logo!" });
    setLocation("/login/marketing");
  };

  /* ── Mutação de sincronização real com Instagram API ─── */
  const syncMutation = useMutation({
    mutationFn: () => {
      return authFetch('/api/instagram/metrics/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ periodLabel: 'morning' }),
      }).then(r => r.json());
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast({ title: "✅ Sincronizado!", description: `Seguidores atualizados: ${data?.data?.followers_total?.toLocaleString('pt-BR') || '—'}` });
        queryClient.invalidateQueries({ queryKey: ['/api/instagram/metrics/current'] });
      } else {
        toast({ title: "Aviso", description: data?.error || "Não foi possível sincronizar agora.", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao conectar com a API do Instagram.", variant: "destructive" });
    },
  });

  /* ── Mutação de salvar token Meta ─────────────────── */
  const saveTokenMutation = useMutation({
    mutationFn: (data: { token: string; appId?: string; appSecret?: string }) => {
      return authFetch('/api/admin/instagram/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json());
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast({ title: "✅ Token salvo!", description: data.message });
        setShowTokenModal(false);
        setTokenInput(''); setAppIdInput(''); setAppSecretInput('');
        queryClient.invalidateQueries({ queryKey: ['/api/admin/instagram/token-status'] });
        queryClient.invalidateQueries({ queryKey: ['/api/instagram/metrics/current'] });
      } else {
        toast({ title: "Erro ao salvar token", description: data?.error || "Verifique o token e tente novamente.", variant: "destructive" });
      }
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível salvar o token.", variant: "destructive" }),
  });

  /* ── Queries ─────────────────────────────────────── */
  const { data: tokenStatus } = useQuery<any>({
    queryKey: ['/api/admin/instagram/token-status'],
    queryFn: () => authFetch('/api/admin/instagram/token-status').then(r => r.json()),
    refetchInterval: 3600000,
    retry: false,
  });

  const { data: igMetrics, isLoading: loadingIg, refetch: refetchIg, error: igError } = useQuery<any>({
    queryKey: ['/api/instagram/metrics/current'],
    queryFn: () => authFetch('/api/instagram/metrics/current').then(r => r.json()),
    refetchInterval: 300000,
    retry: false,
  });

  const { data: segMensal, error: segError } = useQuery<any>({
    queryKey: ['/api/marketing-seguidores-mensal', ano],
    queryFn: () => authFetch(`/api/marketing-seguidores-mensal?ano=${ano}`).then(r => r.json()),
    refetchInterval: 60000,
  });

  const { data: doadores, error: doadoresError } = useQuery<any>({
    queryKey: ['/api/doadores/stats'],
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (igError) toast({ title: "Erro ao carregar métricas", description: "Não foi possível buscar os dados do Instagram.", variant: "destructive" });
  }, [igError]);

  useEffect(() => {
    if (segError) toast({ title: "Erro ao carregar seguidores", description: "Não foi possível buscar os dados de seguidores.", variant: "destructive" });
  }, [segError]);

  useEffect(() => {
    if (doadoresError) toast({ title: "Erro ao carregar doadores", description: "Não foi possível buscar os dados de doadores.", variant: "destructive" });
  }, [doadoresError]);

  /* ── Dados calculados ────────────────────────────── */
 const igData = igMetrics?.data;

const totalSeguidoresInstagram = Number(igData?.followers_total || SEGUIDORES_BASE);
const quantidadePostsInstagram = Number(igData?.posts_instagram_year || 0);
const visualizacoesReels = Number(igData?.reels_views || 0);
const engajamentoInstagram = Number(igData?.instagram_engagement || 0);

const followersReal = totalSeguidoresInstagram;

const syncedAt = igData?.created_at
  ? new Date(igData.created_at).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  : null;
  
  const segRows: any[]            = segMensal?.data || [];
  const segByMes: Record<string,any> = {};
  for (const r of segRows) segByMes[String(r.mes)] = r;
  const mesData = segByMes[mes];

  const acumulado = (key: string) => segRows.reduce((acc, r) => acc + (r[key] || 0), 0);
  const ultimoTotal = segRows.length > 0 ? segRows[segRows.length - 1].total_seguidores : followersReal;

  const segGanhos   = mes === 'todos' ? acumulado('seguidores_ganhos')   : (mesData?.seguidores_ganhos   ?? 0);
  const segPerdidos = mes === 'todos' ? acumulado('seguidores_perdidos') : (mesData?.seguidores_perdidos ?? 0);
  const liquido     = segGanhos - segPerdidos;
  const totalSeg    = mes === 'todos' ? followersReal : (mesData?.total_seguidores ?? followersReal);

  const taxaCrescimento = totalSeg > 0 ? Number(((segGanhos / totalSeg) * 100).toFixed(1)) : 0;

  const faltam           = Math.max(META_SEGUIDORES_ANUAL - followersReal, 0);
  const progressoPct     = Math.min(Math.round((followersReal / META_SEGUIDORES_ANUAL) * 100), 100);
  const progressColor    = progressoPct >= 100 ? '#22c55e' : progressoPct >= 70 ? '#f59e0b' : '#ec4899';

  const mesAtual         = new Date().getMonth() + 1;
  const mesesRestantes   = Math.max(12 - mesAtual, 1);
  const mediaNecessaria  = faltam > 0 ? Math.ceil(faltam / mesesRestantes) : 0;
  const mediaGanhosMes   = segRows.length > 0 ? Math.round(acumulado('seguidores_ganhos') / segRows.length) : 0;

  const doadoresAtivos   = (doadores?.porStatus?.active || 0) + (doadores?.porStatus?.trialing || 0);
  const tokenExpired     = tokenStatus && !tokenStatus.valid;
  const tokenDaysLeft    = tokenStatus?.daysLeft;
  const tokenWarnLow     = tokenDaysLeft !== undefined && tokenDaysLeft <= 7;

  /* Gráfico barras: ganhos vs perdidos */
  const barData = MESES_LABELS.map((m, i) => {
    const row = segRows.find((r: any) => Number(r.mes) === i + 1);
    return { mes: m, ganhos: row?.seguidores_ganhos || 0, perdidos: -(row?.seguidores_perdidos || 0) };
  });

  /* Gráfico linha: total acumulado */
  let acum = SEGUIDORES_BASE;
  const lineData = MESES_LABELS.map((m, i) => {
    const row = segRows.find((r: any) => Number(r.mes) === i + 1);
    if (row) acum = row.total_seguidores;
    return { mes: m, total: acum };
  });

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ───────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-none">Painel de Marketing</h1>
                <p className="text-xs text-gray-500 mt-0.5">{userEmail || userName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="flex items-center gap-1.5 text-xs"
                title={syncedAt ? `Última sinc: ${syncedAt}` : 'Sincronizar com Instagram'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                {syncMutation.isPending ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTokenModal(true)}
                className={`flex items-center gap-1.5 text-xs ${tokenExpired || tokenWarnLow ? 'border-red-400 text-red-600 hover:bg-red-50' : ''}`}
                title="Configurar token de acesso do Instagram"
              >
                {tokenExpired || tokenWarnLow ? <AlertTriangle className="w-3.5 h-3.5" /> : <KeyRound className="w-3.5 h-3.5" />}
                {tokenExpired ? 'Token expirado' : tokenWarnLow ? `${tokenDaysLeft}d` : 'Token'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowAlterarSenhaModal(true)} className="flex items-center gap-1.5 text-xs">
                <Shield className="w-3.5 h-3.5" />
                Senha
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open('https://canaldetransparencia.institutoogrito.com.br', '_blank')} className="flex items-center gap-1.5 text-xs bg-yellow-400 text-black hover:bg-yellow-500 border-yellow-400">
                <ExternalLink className="w-3.5 h-3.5" />
                Transparência
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-red-600 hover:bg-red-50">
                <LogOut className="w-3.5 h-3.5" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <PushNotificationSettings variant="panel" className="max-w-xl" />
      </div>

      {/* ── Tab Navigation ─────────────────────────── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Instagram', icon: '📊' },
              { id: 'eventos', label: 'Eventos', icon: '🎉' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main ─────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {activeTab === 'dashboard' && <>

        {/* Filtros de período */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Instagram Analytics</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {syncedAt ? `Dados atualizados em ${syncedAt}` : 'Buscando dados...'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {['2025', '2026'].map(a => (
                <Chip key={a} active={ano === a} onClick={() => { setAno(a); setMes('todos'); }}>{a}</Chip>
              ))}
            </div>
            <div className="w-px h-5 bg-gray-200" />
            <div className="flex gap-1 flex-wrap">
              <Chip active={mes === 'todos'} onClick={() => setMes('todos')}>Ano todo</Chip>
              {MESES_LABELS.map((m, i) => (
                <Chip key={i} active={mes === String(i + 1)} onClick={() => setMes(String(i + 1))}>{m}</Chip>
              ))}
            </div>
          </div>
        </div>

        {/* ── Painel principal: Total + Progress ─────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Total de Seguidores</p>
                <p className="text-xs text-gray-400">Instituto O Grito • Instagram</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-gray-900 tabular-nums">{followersReal.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-gray-400 mt-1">Meta: {META_SEGUIDORES_ANUAL.toLocaleString('pt-BR')}</p>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="mb-1">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold" style={{ color: progressColor }}>{progressoPct}% da meta</span>
              <span className="text-gray-400">
                Faltam <span className="font-bold text-gray-700">{faltam.toLocaleString('pt-BR')}</span> seguidores
              </span>
            </div>
            <ProgressBar value={followersReal} max={META_SEGUIDORES_ANUAL} color={progressColor} />
            <div className="flex justify-between text-[10px] text-gray-300 mt-1">
              <span>{SEGUIDORES_BASE.toLocaleString('pt-BR')} (início 2026)</span>
              <span>{META_SEGUIDORES_ANUAL.toLocaleString('pt-BR')} (meta)</span>
            </div>
          </div>

          {/* Alerta de meta */}
          {mediaNecessaria > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-lg px-3 py-2">
              <Target className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                Precisa ganhar <strong>{mediaNecessaria.toLocaleString('pt-BR')} seguidores/mês</strong> nos próximos {mesesRestantes} meses para bater a meta.
                {mediaGanhosMes > 0 && ` Média atual: ${mediaGanhosMes.toLocaleString('pt-BR')}/mês.`}
              </span>
            </div>
          )}
        </div>

        {/* ── 4 métricas ───────────────────────────────── */}
      {/* Métricas principais do Instagram */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Users,
              label: 'Total de Seguidores',
              value: totalSeguidoresInstagram.toLocaleString('pt-BR'),
              sub: `Meta: ${META_SEGUIDORES_ANUAL.toLocaleString('pt-BR')}`,
              color: '#8b5cf6',
              bg: '#ede9fe'
            },
            {
              icon: TrendingUp,
              label: 'Seguidores Ganhos',
              value: `+${segGanhos.toLocaleString('pt-BR')}`,
              sub: `Meta: ${(mes === 'todos' ? META_GANHOS_ANUAL : Math.ceil(META_GANHOS_ANUAL / 12)).toLocaleString('pt-BR')}`,
              color: '#10b981',
              bg: '#d1fae5'
            },
            {
              icon: TrendingDown,
              label: 'Seguidores Perdidos',
              value: `-${segPerdidos.toLocaleString('pt-BR')}`,
              sub: `Limite: ${(mes === 'todos' ? META_PERDIDOS_ANUAL : Math.ceil(META_PERDIDOS_ANUAL / 12)).toLocaleString('pt-BR')}`,
              color: '#ef4444',
              bg: '#fee2e2'
            },
            {
              icon: Target,
              label: 'Posts Instagram',
              value: quantidadePostsInstagram.toLocaleString('pt-BR'),
              sub: `Ano ${ano}`,
              color: '#ec4899',
              bg: '#fce7f3'
            },
            {
              icon: Eye,
              label: 'Visualizações de Reels',
              value: visualizacoesReels.toLocaleString('pt-BR'),
              sub: `Ano ${ano}`,
              color: '#6366f1',
              bg: '#e0e7ff'
            },
            {
              icon: Activity,
              label: 'Engajamento Instagram',
              value: engajamentoInstagram.toLocaleString('pt-BR'),
              sub: 'Interações capturadas pela Meta',
              color: '#f59e0b',
              bg: '#fef3c7'
            },
            {
              icon: Activity,
              label: 'Crescimento Líquido',
              value: `${liquido >= 0 ? '+' : ''}${liquido.toLocaleString('pt-BR')}`,
              sub: `Taxa: ${taxaCrescimento}%`,
              color: liquido >= 0 ? '#8b5cf6' : '#ef4444',
              bg: '#ede9fe'
            },
            {
              icon: Target,
              label: 'Média/Mês Necessária',
              value: mediaNecessaria > 0 ? `+${mediaNecessaria.toLocaleString('pt-BR')}` : '✓ Meta!',
              sub: `${mesesRestantes} meses restantes`,
              color: '#f59e0b',
              bg: '#fef3c7'
            },
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

        {/* ── Gráficos ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Ganhos vs Perdidos */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-bold text-gray-900 mb-0.5">Ganhos vs Perdidos por Mês</p>
            <p className="text-xs text-gray-400 mb-4">{ano}</p>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="mes" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickCount={4} axisLine={false} tickLine={false} />
                  <ReferenceLine y={0} stroke="#e2e8f0" strokeWidth={1} />
                  <Bar dataKey="ganhos"   fill="#10b981" radius={[3,3,0,0]} name="Ganhos" />
                  <Bar dataKey="perdidos" fill="#fca5a5" radius={[0,0,3,3]} name="Perdidos" />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} iconSize={8} iconType="circle" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: 11, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(v: number) => Math.abs(v).toLocaleString('pt-BR')}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Evolução total */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-bold text-gray-900 mb-0.5">Evolução Total de Seguidores</p>
            <p className="text-xs text-gray-400 mb-4">{ano} — linha rosa = meta {META_SEGUIDORES_ANUAL.toLocaleString('pt-BR')}</p>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="mes" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickCount={4} axisLine={false} tickLine={false} domain={['auto', META_SEGUIDORES_ANUAL + 500]} />
                  <ReferenceLine y={META_SEGUIDORES_ANUAL} stroke="#ec4899" strokeDasharray="5 3" strokeWidth={1.5} />
                  <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }} activeDot={{ r: 5 }} name="Total" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: 11, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(v: number) => v.toLocaleString('pt-BR')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        </>}

        {activeTab === 'eventos' && (
          <EventosGritoSection />
        )}

      </main>

      <AlterarSenhaMarketing open={showAlterarSenhaModal} onOpenChange={setShowAlterarSenhaModal} />

      {/* ── Modal de Configuração do Token Meta ───────── */}
      <Dialog open={showTokenModal} onOpenChange={setShowTokenModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <span>🔑</span> Configurar Token do Instagram
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
              <p className="font-semibold mb-1">Como obter o token permanente:</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Acesse <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="underline font-semibold">Graph API Explorer</a></li>
                <li>Selecione o app e clique em <strong>Generate Access Token</strong></li>
                <li>Cole o token abaixo + preencha App ID e App Secret para obter token <strong>permanente</strong></li>
                <li>Sem App ID/Secret: token expira em ~1 hora</li>
              </ol>
            </div>

            <div>
              <Label className="text-xs font-semibold">Token do Explorer *</Label>
              <Input
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                placeholder="EAA..."
                className="mt-1 text-xs font-mono"
              />
            </div>

            <div className="border-t pt-3">
              <p className="text-xs text-gray-500 mb-2 font-semibold">Opcional — para token permanente:</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">App ID</Label>
                  <Input value={appIdInput} onChange={e => setAppIdInput(e.target.value)} placeholder="123456..." className="mt-1 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">App Secret</Label>
                  <Input value={appSecretInput} onChange={e => setAppSecretInput(e.target.value)} placeholder="abc123..." className="mt-1 text-xs" type="password" />
                </div>
              </div>
            </div>

            <Button
              className="w-full bg-pink-500 hover:bg-pink-600 text-white"
              onClick={() => saveTokenMutation.mutate({ token: tokenInput, appId: appIdInput || undefined, appSecret: appSecretInput || undefined })}
              disabled={!tokenInput || saveTokenMutation.isPending}
            >
              {saveTokenMutation.isPending ? 'Salvando...' : (appIdInput && appSecretInput ? '🔄 Salvar e obter token permanente' : '💾 Salvar token')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
