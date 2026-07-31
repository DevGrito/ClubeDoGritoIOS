import { useState, useEffect, useCallback, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardFinanceiro from "@/components/DashboardFinanceiro";
import CoordenadorDashboard from "@/components/CoordenadorDashboard";
import TabMarketing from "@/pages/dashboard-gestao-vista/TabMarketing";
import { FAMILIAS_FAVELA3D_EXIBICAO, coletivosFavela3DNoPeriodo } from "@/pages/dashboard-gestao-vista/shared";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Crown,
  UserPlus,
  Users,
  Shield,
  GraduationCap,
  Briefcase,
  Star,
  UserCheck,
  UserX,
  UserMinus,
  BarChart3,
  FileText,
  Database,
  Settings,
  Activity,
  Lock,
  AlertTriangle,
  LogOut,
  Home,
  DollarSign,
  Heart,
  Building,
  Rocket,
  Handshake,
  TrendingUp,
  PieChart,
  Calendar,
  Clock,
  LineChart,
  Target,
  Award,
  MapPin,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertCircle,
  Percent,
  TrendingDown,
  User,
  Save,
  RefreshCw,
  Trophy,
  Code,
  Menu,
  Filter,
  Monitor,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  ClipboardList,
  Eye,
  EyeOff,
  ShoppingBag,
  Store,
  Scissors,
  Search,
  Wrench,
  X,
  Trash2,
  Loader2,
  Inbox
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import Logo from "@/components/logo";
import { isLeoByRole } from "@shared/conselho";
import { openPrivacyPreferences } from "@/lib/consentManager";
import { PushNotificationSettings } from "@/components/PushNotificationSettings";
import { LgpdLegalHeaderButtons } from "@/components/LgpdLegalMenuSection";
import { clearLocalStoragePreservingLgpd } from "@/lib/auth-session";
import { useToast } from "@/hooks/use-toast";
import { useDevAccess } from "@/hooks/useDevAccess";
import favela3dLogo from "../app-assets/Logo_Favela3D_GF_positivoo_1754341182028.png";
import { useIsMobile } from "@/hooks/use-mobile";
import MetaRealizadoCard from "@/components/meta-realizado-card";
import MetasIndicadoresForm from "@/components/MetasIndicadoresForm";
import { GestaoKpiCard } from "@/components/GestaoKpiCard";
import DashboardGestaoVista from "./dashboard-gestao-vista";
import ConselhoApprovalManager from "@/components/conselho-approval-manager";
import PrivacyConsentsAuditSection from "@/components/dev/PrivacyConsentsAuditSection";
import ChamadaAuditoriaSection from "@/components/presenca/ChamadaAuditoriaSection";
import AdminRopaSection from "@/components/admin/AdminRopaSection";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  Area,
  AreaChart,
  RadialBarChart,
  RadialBar,
  ComposedChart,
} from "recharts";

import { chartData } from "@/data/leoMartins";

interface LeoMartinsProps {
  demoMode?: boolean;
}

// Componente Seção Colaboradores
function ColaboradoresSection({ mesSelecionado }: { mesSelecionado: number }) {
  const [searchTerm, setSearchTerm] = useState("");

  // Buscar estatísticas
  const { data: statsData } = useQuery<any>({
    queryKey: ["/api/colaboradores/stats"],
    queryFn: () => fetch(`/api/colaboradores/stats`).then(r => r.json()),
  });

  // Buscar lista de colaboradores
  const { data: colaboradoresData } = useQuery<any>({
    queryKey: ["/api/colaboradores", searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({ pageSize: "100" });
      if (searchTerm.trim()) params.append("search", searchTerm.trim());
      const response = await fetch(`/api/colaboradores?${params}`);
      if (!response.ok) throw new Error("Erro ao buscar colaboradores");
      return response.json();
    },
  });

  return (
    <div className="space-y-6">
      {/* Cards de Resumo: Total, CLT e CNPJ */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { label: 'Total', value: statsData?.totalColaboradores || 0, border: '#bfdbfe', color: '#2563eb' },
          { label: 'CLT', value: statsData?.clt || 0, border: '#a7f3d0', color: '#059669' },
          { label: 'CNPJ', value: statsData?.cnpj || 0, border: '#fde68a', color: '#d97706' },
        ].map((item) => (
          <div key={item.label} style={{ flex: 1, border: `1px solid ${item.border}`, borderRadius: '8px', padding: '12px 8px', textAlign: 'center', background: '#fff' }}>
            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '4px' }}>{item.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Distribuição por Setor — oculto temporariamente
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-600" />
            Distribuição por Setor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(statsData?.porSetor || [
              { setor: "Programa Esportivo Cultural", total: 0 },
              { setor: "Inclusão Produtiva", total: 0 },
              { setor: "ADM/Financeiro", total: 0 },
              { setor: "Marketing e Comunicação", total: 0 },
              { setor: "Psicossocial", total: 0 },
              { setor: "Negócios Sociais", total: 0 },
            ]).map((s: any) => (
              <div key={s.setor} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{s.setor}</span>
                <span className="text-sm font-bold text-purple-700">{s.total}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      */}

      {/* Lista de Colaboradores */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-5 h-5 text-purple-600" />
            Lista de Colaboradores
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="flex-1 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {colaboradoresData?.items?.map((col: any) => (
              <div key={col.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-800">{col.nome}</p>
                  {col.cargo && <p className="text-xs text-gray-500">{col.cargo}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {col.vinculo && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${col.vinculo === 'CLT' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {col.vinculo}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {(!colaboradoresData?.items || colaboradoresData.items.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-6">Nenhum colaborador encontrado</p>
            )}
          </div>
          <div className="px-4 py-3 border-t bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-500">{colaboradoresData?.total || 0} colaboradores</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente Relatório Financeiro Detalhado
function RelatorioFinanceiroDetalhado() {
  const [mesSelecionado, setMesSelecionado] = useState<string>("2026");
  const [departamentoSelecionado, setDepartamentoSelecionado] = useState<string>("TODOS");

  const { data: departamentosData } = useQuery<any>({
    queryKey: ['/api/financeiro/departamentos'],
  });

  const { data: consolidado, isLoading } = useQuery<any>({
    queryKey: ['/api/financeiro/consolidado', mesSelecionado, departamentoSelecionado],
    queryFn: async () => {
      const params = new URLSearchParams({ periodo: mesSelecionado });
      if (departamentoSelecionado !== 'TODOS') params.append('departamento', departamentoSelecionado);
      const response = await fetch(`/api/financeiro/consolidado?${params}`);
      return response.json();
    },
  });

  const meses = [
    { value: "2026", label: "Ano Completo 2026" },
    { value: "2026-01", label: "Janeiro 2026" },
    { value: "2026-02", label: "Fevereiro 2026" },
    { value: "2026-03", label: "Março 2026" },
    { value: "2026-04", label: "Abril 2026" },
    { value: "2026-05", label: "Maio 2026" },
    { value: "2026-06", label: "Junho 2026" },
    { value: "2026-07", label: "Julho 2026" },
    { value: "2026-08", label: "Agosto 2026" },
    { value: "2026-09", label: "Setembro 2026" },
    { value: "2026-10", label: "Outubro 2026" },
    { value: "2026-11", label: "Novembro 2026" },
    { value: "2026-12", label: "Dezembro 2026" },
  ];

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (isLoading) return <div className="p-6">Carregando dados financeiros...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            Filtros do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Período</Label>
              <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="-1">📊 Todos (Geral)</SelectItem>
                  {meses.map(mes => (
                    <SelectItem key={mes.value} value={mes.value}>{mes.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Departamento</Label>
              <Select value={departamentoSelecionado} onValueChange={setDepartamentoSelecionado}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="-1">📊 Todos (Geral)</SelectItem>
                  <SelectItem value="TODOS">Todos os Departamentos</SelectItem>
                  {departamentosData?.departamentos?.map((dep: any) => (
                    <SelectItem key={dep.slug} value={dep.slug}>{dep.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Dashboard Financeiro - {meses.find(m => m.value === mesSelecionado)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 border rounded-lg bg-blue-50">
              <p className="text-sm text-gray-600 mb-2">Planejamento</p>
              <p className="text-3xl font-bold text-blue-600">{formatMoney(consolidado?.totais?.despesas_meta || 0)}</p>
              <p className="text-xs text-gray-500 mt-1">Metas da Planilha</p>
            </div>
            <div className="p-6 border rounded-lg bg-orange-50">
              <p className="text-sm text-gray-600 mb-2">Realizado (Pivot)</p>
              <p className="text-3xl font-bold text-orange-600">{formatMoney(consolidado?.totais?.despesas_realizado || 0)}</p>
              <p className="text-xs text-gray-500 mt-1">Controle de Pagamentos</p>
            </div>
            <div className={`p-6 border rounded-lg ${(consolidado?.totais?.despesas_resultado || 0) > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-sm text-gray-600 mb-2">Saldo Final</p>
              <p className={`text-3xl font-bold ${(consolidado?.totais?.despesas_resultado || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatMoney(consolidado?.totais?.despesas_resultado || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{(consolidado?.totais?.despesas_resultado || 0) > 0 ? '(Economia)' : '(Excedente)'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {departamentoSelecionado === 'TODOS' && consolidado?.por_departamento && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-600" />
              Gastos por Departamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Departamento</th>
                    <th className="text-right p-3">Contas a Pagar</th>
                    <th className="text-right p-3">Contas a Receber</th>
                    <th className="text-right p-3">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidado.por_departamento.map((dep: any) => (
                    <tr key={dep.departamento} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{dep.nome}</td>
                      <td className="p-3 text-right text-orange-600">{formatMoney(dep.contas_pagar)}</td>
                      <td className="p-3 text-right text-green-600">{formatMoney(dep.contas_receber)}</td>
                      <td className={`p-3 text-right font-semibold ${dep.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatMoney(dep.saldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {consolidado?.dados_mensais && typeof window !== 'undefined' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Evolução Mensal de Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={consolidado.dados_mensais}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                <Legend />
                <Bar dataKey="contas_pagar" name="Despesas" fill="#f97316" />
                <Bar dataKey="meta" name="Meta" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Componente Carrossel de Métricas (movido para fora do escopo principal)
function MetricsCarousel({ mesSelecionadoDashboard, totalPatrocinadoresAtivos, calcularAlunosAtivosMes, dadosMensais, dadosMensaisPEC, doadoresData, colaboradoresCount }: any) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start' });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  // Dados reais do Stripe
  const totalDoadores = doadoresData?.totalDoadores || 0;

  const cards = [
    {
      title: "Total Doadores",
      value: totalDoadores,
      subtitle: "Assinaturas ativas (Stripe)",
      meta: null,
      percentual: null
    },
    {
      title: "Alunos Ativos",
      value: calcularAlunosAtivosMes(mesSelecionadoDashboard),
      subtitle: dadosMensais?.meses?.[mesSelecionadoDashboard] || dadosMensaisPEC?.meses?.[mesSelecionadoDashboard] 
        ? `${dadosMensais?.meses?.[mesSelecionadoDashboard] || dadosMensaisPEC?.meses?.[mesSelecionadoDashboard]} 2026` 
        : 'Estudantes participantes',
      meta: 995,
      percentual: ((calcularAlunosAtivosMes(mesSelecionadoDashboard) / 995) * 100).toFixed(1)
    },
    {
      title: "Patrocinadores",
      value: totalPatrocinadoresAtivos,
      subtitle: "Parceiros cadastrados",
      meta: null
    },
    {
      title: "Colaboradores",
      value: colaboradoresCount || 0,
      subtitle: "Equipe colaborativa",
      meta: null
    }
  ];

  return (
    <div className="relative mb-4">
      <div className="overflow-hidden rounded-lg mb-4" ref={emblaRef}>
        <div className="flex gap-4">
          {cards.map((card, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0 md:flex-[0_0_calc(50%-8px)] lg:flex-[0_0_calc(25%-12px)]">
              <Card className="overflow-hidden h-full">
                <CardHeader className="pb-3 bg-yellow-400">
                  <CardTitle className="text-sm font-bold text-black">{card.title}</CardTitle>
                </CardHeader>
                <CardContent className="bg-white pt-4">
                  <div className="text-2xl font-bold text-black">{card.value}</div>
                  <p className="text-xs text-gray-500">{card.subtitle}</p>
                  {card.meta && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-blue-600">Meta:</span>
                        <span className="text-xs font-semibold text-blue-600">{card.meta.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs font-semibold text-gray-700">Realizado:</span>
                        <div className="flex items-center gap-1">
                          <span className={`text-xs font-bold ${
                            parseFloat(card.percentual) >= 90 ? 'text-green-600' : 
                            parseFloat(card.percentual) >= 70 ? 'text-yellow-600' : 
                            'text-red-600'
                          }`}>
                            {card.percentual}%
                          </span>
                          {parseFloat(card.percentual) >= 90 ? (
                            <TrendingUp className="w-3 h-3 text-green-600" />
                          ) : parseFloat(card.percentual) >= 70 ? (
                            <span className="text-yellow-600 text-xs">→</span>
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
      
      {/* Indicadores amarelos embaixo */}
      <div className="flex justify-center gap-2">
        {cards.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === selectedIndex 
                ? 'bg-[#FFCC00] w-6' 
                : 'bg-gray-300'
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function SolicitacoesExclusaoPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "pendente" | "confirmado" | "rejeitado">("pendente");
  const [filtroArea, setFiltroArea] = useState<"todas" | "pec" | "inclusao">("todas");
  const [busca, setBusca] = useState("");
  const [processandoId, setProcessandoId] = useState<number | null>(null);

  const { data: solicitacoes = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/admin/solicitacoes-exclusao"],
    queryFn: async () => {
      const r = await fetch("/api/admin/solicitacoes-exclusao", { credentials: "include" });
      if (!r.ok) throw new Error("Falha ao carregar");
      return r.json();
    },
  });

  const agir = async (id: number, acao: "confirmar" | "rejeitar") => {
    setProcessandoId(id);
    try {
      const r = await fetch(`/api/admin/solicitacoes-exclusao/${id}/${acao}`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || "Erro");
      }
      toast({
        title: acao === "confirmar" ? "Chamada excluída!" : "Solicitação rejeitada.",
        description: acao === "confirmar" ? "A chamada foi excluída com sucesso." : "A solicitação foi rejeitada.",
      });
      qc.invalidateQueries({ queryKey: ["/api/admin/solicitacoes-exclusao"] });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha na operação.", variant: "destructive" });
    } finally {
      setProcessandoId(null);
    }
  };

  const formatarDataHoraBrasilia = (isoString: string) => {
    try {
      const str = isoString.trim().replace(" ", "T");
      const utcStr = str.endsWith("Z") || str.includes("+") ? str : str + "Z";
      const d = new Date(utcStr);
      return d.toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit", month: "2-digit", year: "2-digit",
        hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  const buscaLower = busca.toLowerCase().trim();

  const filtered = (solicitacoes as any[]).filter((s) => {
    if (filtroStatus !== "todos" && s.status !== filtroStatus) return false;
    if (filtroArea !== "todas" && s.tipo !== filtroArea) return false;
    if (buscaLower) {
      const turma = (s.turma_nome || "").toLowerCase();
      const data = s.data_chamada ? new Date(s.data_chamada + "T12:00:00").toLocaleDateString("pt-BR") : "";
      const area = s.tipo === "pec" ? "pec" : "inclusão produtiva inclusao";
      if (!turma.includes(buscaLower) && !data.includes(buscaLower) && !area.includes(buscaLower)) return false;
    }
    return true;
  });

  const pendentes = (solicitacoes as any[]).filter((s) => s.status === "pendente").length;

  const statusBadge = (status: string) => {
    if (status === "pendente") return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Pendente</Badge>;
    if (status === "confirmado") return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Confirmado</Badge>;
    if (status === "rejeitado") return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Rejeitado</Badge>;
    return <Badge variant="outline" className="text-xs">{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          Solicitações de Exclusão de Chamadas
          {pendentes > 0 && <Badge className="bg-red-500 text-white ml-1">{pendentes}</Badge>}
        </h2>
        <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Filtros e busca */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por turma, data ou área..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>
        <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as any)}>
          <SelectTrigger className="w-full sm:w-44 bg-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="pendente">
              Pendente {pendentes > 0 && `(${pendentes})`}
            </SelectItem>
            <SelectItem value="confirmado">Confirmado</SelectItem>
            <SelectItem value="rejeitado">Rejeitado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroArea} onValueChange={(v) => setFiltroArea(v as any)}>
          <SelectTrigger className="w-full sm:w-48 bg-white">
            <SelectValue placeholder="Área" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as áreas</SelectItem>
            <SelectItem value="pec">PEC</SelectItem>
            <SelectItem value="inclusao">Inclusão Produtiva</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-gray-300" />
          Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            <Inbox className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">
              {busca ? "Nenhum resultado para a busca" : filtroStatus === "pendente" ? "Nenhuma solicitação pendente" : "Nenhuma solicitação encontrada"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((sol: any) => (
            <Card key={sol.id} className={sol.status === "pendente" ? "border-amber-200" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs font-medium">
                      {sol.tipo === "pec" ? "PEC" : "Inclusão Produtiva"}
                    </Badge>
                    {statusBadge(sol.status)}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    #{sol.id} · {sol.created_at ? formatarDataHoraBrasilia(sol.created_at) : "-"}
                  </span>
                </div>
                <div className="space-y-1 text-sm mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="font-medium">
                      {sol.data_chamada ? new Date(sol.data_chamada + "T12:00:00").toLocaleDateString("pt-BR") : "-"}
                    </span>
                    <span className="text-gray-400">—</span>
                    <span className="truncate">{sol.turma_nome || `Turma ${sol.turma_id}`}</span>
                  </div>
                  <div className="text-gray-600 flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400 shrink-0" />
                    {sol.presentes}/{sol.total_participantes} presentes
                  </div>
                  <div className="text-gray-600 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                    Solicitado por: <span className="font-medium">{sol.solicitado_por_nome || "—"}</span>
                  </div>
                  {sol.motivo && (
                    <div className="bg-gray-50 rounded p-2 text-gray-600 text-xs break-words overflow-hidden">
                      <span className="font-medium">Motivo:</span> {sol.motivo}
                    </div>
                  )}
                </div>
                {sol.status === "pendente" && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      disabled={processandoId === sol.id}
                      onClick={() => agir(sol.id, "confirmar")}
                    >
                      {processandoId === sol.id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
                      Confirmar Exclusão
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={processandoId === sol.id}
                      onClick={() => agir(sol.id, "rejeitar")}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LeoMartins({ demoMode = false }: LeoMartinsProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isLeo, setIsLeo] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [gestaoVistaData, setGestaoVistaData] = useState<any>(null);
  const [showGestaoVista, setShowGestaoVista] = useState(false);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const openGestaoVista = () => {
    setIsDrawerOpen(false);
    setShowGestaoVista(true);
    try {
      if ((screen.orientation as any)?.lock) {
        (screen.orientation as any).lock('landscape').catch(() => {});
      }
    } catch (_) {}
  };

  const closeGestaoVista = () => {
    setShowGestaoVista(false);
    try {
      if ((screen.orientation as any)?.unlock) {
        (screen.orientation as any).unlock();
      }
    } catch (_) {}
  };
  const [loading, setLoading] = useState(true);
  const [showFinanceiroData, setShowFinanceiroData] = useState(true);
  const [tempName, setTempName] = useState("");
  const [tempPhone, setTempPhone] = useState("");
  const [isComponentReady, setIsComponentReady] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [indicadoresData, setIndicadoresData] = useState<any>(null);
  const [dadosMensais, setDadosMensais] = useState<any>(null);
  const [mesSelecionadoLab, setMesSelecionadoLab] = useState<number>(0); // LAB. VOZES DO FUTURO
  const [mesSelecionadoCursos30h, setMesSelecionadoCursos30h] = useState<number>(0); // CURSOS PRESENCIAIS
  const [mesSelecionadoEad, setMesSelecionadoEad] = useState<number>(0); // CURSOS EAD CGD
  const [dadosMensaisPsicossocial, setDadosMensaisPsicossocial] = useState<any>(null);
  const [mesSelecionadoPsicossocial, setMesSelecionadoPsicossocial] = useState<number>(0); // 0 = Jan, 11 = Dez
  // Psico admin dashboard (igual coordenador-psico)
  const [dashFiltroAnoPsicoadmin, setDashFiltroAnoPsicoadmin] = useState(new Date().getFullYear());
  const [dashFiltroMesPsicoadmin, setDashFiltroMesPsicoadmin] = useState(0);
  const [dadosMensaisPEC, setDadosMensaisPEC] = useState<any>(null);
  const [mesSelecionadoPEC, setMesSelecionadoPEC] = useState<number>(0); // 0 = Jan, 11 = Dez
  const [dadosMensaisFavela3D, setDadosMensaisFavela3D] = useState<any>(null);
  const [mesSelecionadoFavela3D, setMesSelecionadoFavela3D] = useState<number>(0); // 0 = Jan, 11 = Dez
  const [anoFavela3D, setAnoFavela3D] = useState<number>(new Date().getFullYear());
  const [expandedF3DSection, setExpandedF3DSection] = useState<string | null>(null);
  const [mesSelecionadoDashboard, setMesSelecionadoDashboard] = useState<number>(-1); // -1 = Todos os meses // 7 = Agosto - Dashboard geral
  const [marketingData, setMarketingData] = useState<any>(null);
  const [anoPatrocinador, setAnoPatrocinador] = useState<number>(new Date().getFullYear()); // Ano selecionado para patrocinadores
  const [privacyPatrocinadores, setPrivacyPatrocinadores] = useState<boolean>(false); // Modo privacidade para patrocinadores
  const [anoDoador, setAnoDoador] = useState<number>(new Date().getFullYear()); // Ano selecionado para doadores
  const [anoIndicadores, setAnoIndicadores] = useState<number>(new Date().getFullYear()); // Ano selecionado para indicadores de programas
  const [mesSelecionadoFinanceiro, setMesSelecionadoFinanceiro] = useState<number | null>(null); // null = Ano todo
  const [mesSelecionadoMarketing, setMesSelecionadoMarketing] = useState<number | null>(null); // null = Ano todo
  const [expandedNegocioCard, setExpandedNegocioCard] = useState<'outlet' | 'griffte' | null>(null);
  const [expandedMktCard, setExpandedMktCard] = useState<'doadores' | 'seguidores' | null>(null);
  const [expandedInclusaoAdminCard, setExpandedInclusaoAdminCard] = useState<string | null>(null); // Card expandido na seção Inclusão Produtiva do admin
  const [expandedPECAdminCard, setExpandedPECAdminCard] = useState<string | null>(null); // Card expandido na seção PEC do admin
  const [anoPsicoAdmin, setAnoPsicoAdmin] = useState<2025 | 2026>(new Date().getFullYear() as 2025 | 2026);
  const [expandedPsicoCardAdmin, setExpandedPsicoCardAdmin] = useState<'atencao-social' | 'metodo-grito' | null>(null);
  const [kpiInclusaoAno, setKpiInclusaoAno] = useState(String(new Date().getFullYear())); // Filtro ano para KPIs de Inclusão no admin
  const [kpiInclusaoMes, setKpiInclusaoMes] = useState('todos'); // Filtro mês para KPIs de Inclusão no admin
  const [kpiPecMes, setKpiPecMes] = useState('todos'); // Filtro mês para KPIs de PEC 2026 no admin
  const [dashInclusaoFiltroAno, setDashInclusaoFiltroAno] = useState(new Date().getFullYear());
  const [dashInclusaoFiltroMes, setDashInclusaoFiltroMes] = useState(0);
  const [dashPecFiltroAno, setDashPecFiltroAno] = useState(new Date().getFullYear());
  const [dashPecFiltroMes, setDashPecFiltroMes] = useState(0);
  const [selectedArea, setSelectedArea] = useState<string | null>(null); // Área selecionada de cursos (tecnologia, beleza, etc.)
  const [selectedModalidade, setSelectedModalidade] = useState<string | null>(null); // Modalidade selecionada (presencial/ead)
  const [searchDoadorTerm, setSearchDoadorTerm] = useState(""); // Pesquisa na lista de doadores
  const isMobile = useIsMobile();
  const anoAnterior = new Date().getFullYear() - 1;

  const mesAtualIndex = new Date().getMonth();

  // Hook para acesso de desenvolvedor
  const devAccess = useDevAccess();

  // Query para buscar patrocinadores
  const { data: patrocinadoresData, isLoading, error } = useQuery({
  queryKey: ['/api/patrocinadores', anoPatrocinador],
  queryFn: async () => {
    const r = await fetch(`/api/patrocinadores?ano=${anoPatrocinador}`);
    if (!r.ok) throw new Error('Failed to fetch patrocinadores');
    return r.json();
  }
});

  // Total de patrocinadores (mesma lógica da página de Patrocinadores)
  const totalPatrocinadoresAtivos = patrocinadoresData?.totalPatrocinadores || 0;

  // Resetar scroll ao trocar de seção
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeSection]);

  // Buscar dados de indicadores de Inclusão Produtiva
  useEffect(() => {
    const fetchIndicadores = async () => {
      try {
        console.log("🔵 [LEO DASHBOARD] Buscando indicadores para ano " + anoIndicadores + "...");
        const response = await fetch("/api/inclusao-produtiva/indicadores?ano=" + anoIndicadores);
        if (!response.ok) throw new Error("Failed to fetch indicadores");
        const data = await response.json();
        console.log("✅ [LEO DASHBOARD] Indicadores recebidos:", data);
        setIndicadoresData(data);
      } catch (error) {
        console.error("❌ [LEO DASHBOARD] Erro ao buscar indicadores:", error);
      }
    };

    fetchIndicadores();
  }, [anoIndicadores]);

  // Buscar dados mensais de Inclusão Produtiva
  useEffect(() => {
    const fetchDadosMensais = async () => {
      try {
        console.log("📅 [LEO DASHBOARD] Buscando dados mensais " + anoIndicadores + "...");
        const response = await fetch("/api/inclusao-produtiva/dados-mensais?ano=" + anoIndicadores);
        if (!response.ok) throw new Error("Failed to fetch dados mensais");
        const data = await response.json();
        console.log("✅ [LEO DASHBOARD] Dados mensais recebidos:", data);
        setDadosMensais(data);
        
        // Detectar último mês com dados COMPLETOS para cada projeto individualmente
        data.projetos.forEach((projeto: any) => {
          const frequencia = projeto.indicadores.find((i: any) => i.nome === "Frequência");
          const quantidadeAlunos = projeto.indicadores.find((i: any) => i.nome === "Quantidade de Alunos" || i.nome === "Alunos Ativos");
          
          console.log(`🔍 [${projeto.projeto}] Verificando indicadores:`, {
            frequenciaEncontrada: !!frequencia,
            alunosEncontrado: !!quantidadeAlunos,
            nomeIndicadorAlunos: quantidadeAlunos?.nome
          });
          
          if (frequencia?.mensal && quantidadeAlunos?.mensal) {
            // Encontrar o último mês que tem dados em AMBOS os indicadores
            let ultimoMes = 0;
            for (let i = frequencia.mensal.length - 1; i >= 0; i--) {
              const temFreq = frequencia.mensal[i] !== null;
              const temAlunos = quantidadeAlunos.mensal[i] !== null;
              
              console.log(`  Mês ${data.meses[i]} (${i}): Freq=${frequencia.mensal[i]} (${temFreq}), Alunos=${quantidadeAlunos.mensal[i]} (${temAlunos})`);
              
              if (temFreq && temAlunos) {
                ultimoMes = i;
                console.log(`  ✅ Último mês completo encontrado: ${data.meses[i]} (índice ${i})`);
                break;
              }
            }
            
            // Definir o estado específico de cada projeto
            if (projeto.projeto === "LAB. VOZES DO FUTURO") {
              console.log(`📅 [LAB] Setando mês: ${data.meses[ultimoMes]} (índice ${ultimoMes})`);
              setMesSelecionadoLab(ultimoMes);
            } else if (projeto.projeto === "CURSOS PRESENCIAIS") {
              console.log(`📅 [CURSOS 30H] Setando mês: ${data.meses[ultimoMes]} (índice ${ultimoMes})`);
              setMesSelecionadoCursos30h(ultimoMes);
            } else if (projeto.projeto === "CURSOS EAD CGD") {
              console.log(`📅 [EAD] Setando mês: ${data.meses[ultimoMes]} (índice ${ultimoMes})`);
              setMesSelecionadoEad(ultimoMes);
            }
          }
        });
      } catch (error) {
        console.error(
          "❌ [LEO DASHBOARD] Erro ao buscar dados mensais:",
          error
        );
      }
    };

    fetchDadosMensais();
  }, [anoIndicadores]);

  // Buscar dados mensais de Psicossocial
  useEffect(() => {
    const fetchDadosMensaisPsicossocial = async () => {
      try {
        console.log("📅 [PSICOSSOCIAL] Buscando dados mensais para ano " + anoIndicadores + "...");
        const response = await fetch("/api/psicossocial/dados-mensais?ano=" + anoIndicadores);
        if (!response.ok)
          throw new Error("Failed to fetch dados mensais psicossocial");
        const data = await response.json();
        console.log("✅ [PSICOSSOCIAL] Dados mensais recebidos:", data);
        setDadosMensaisPsicossocial(data);

        // Detectar último mês com dados disponíveis
        let ultimoMesComDados = 0;
        if (Array.isArray(data.indicadores)) {
          data.indicadores.forEach((indicador: any) => {
            if (indicador.mensal && Array.isArray(indicador.mensal)) {
              indicador.mensal.forEach((valor: any, index: number) => {
                if (valor !== null && index > ultimoMesComDados) {
                  ultimoMesComDados = index;
                }
              });
            }
          });
        }

        console.log(
          `📅 [PSICOSSOCIAL] Último mês com dados: ${data.meses[ultimoMesComDados]}`
        );
        setMesSelecionadoPsicossocial(ultimoMesComDados);
      } catch (error) {
        console.error("❌ [PSICOSSOCIAL] Erro ao buscar dados mensais:", error);
      }
    };

    fetchDadosMensaisPsicossocial();
  }, [anoIndicadores]);

  // Buscar dados mensais de PEC (Esporte e Cultura)
  useEffect(() => {
    const fetchDadosMensaisPEC = async () => {
      try {
        console.log("📅 [PEC] Buscando dados mensais para ano " + anoIndicadores + "...");
        const response = await fetch("/api/pec/dados-mensais?ano=" + anoIndicadores);
        if (!response.ok) throw new Error("Failed to fetch dados mensais PEC");
        const data = await response.json();
        console.log("✅ [PEC] Dados mensais recebidos:", data);
        setDadosMensaisPEC(data);

        // Detectar último mês com dados disponíveis
        let ultimoMesComDados = 0;
        if (Array.isArray(data.projetos)) {
          data.projetos.forEach((projeto: any) => {
            if (projeto.indicadores && Array.isArray(projeto.indicadores)) {
              projeto.indicadores.forEach((indicador: any) => {
                if (indicador.mensal && Array.isArray(indicador.mensal)) {
                  indicador.mensal.forEach((valor: any, index: number) => {
                    if (valor !== null && index > ultimoMesComDados) {
                      ultimoMesComDados = index;
                    }
                  });
                }
              });
            }
          });
        }

        console.log(
          `📅 [PEC] Último mês com dados: ${data.meses[ultimoMesComDados]}`
        );
        setMesSelecionadoPEC(ultimoMesComDados);
      } catch (error) {
        console.error("❌ [PEC] Erro ao buscar dados mensais:", error);
      }
    };

    fetchDadosMensaisPEC();
  }, [anoIndicadores]);

  // Mesmos números do Dashboard Gestão à Vista — coletivos acumulados no ano
  const f3dFamiliasLeo = FAMILIAS_FAVELA3D_EXIBICAO;
  const f3dGerandoLiderAno = coletivosFavela3DNoPeriodo('gerando_lideranca', 'todos');
  const f3dAssembleiaAno = coletivosFavela3DNoPeriodo('assembleia', 'todos');

  // Buscar dados mensais de Favela 3D
  useEffect(() => {
    const fetchDadosMensaisFavela3D = async () => {
      try {
        console.log("📅 [FAVELA 3D] Buscando dados mensais " + anoIndicadores + "...");
        const response = await fetch("/api/favela-3d/dados-mensais");
        if (!response.ok)
          throw new Error("Failed to fetch dados mensais Favela 3D");
        const data = await response.json();
        console.log("✅ [FAVELA 3D] Dados mensais recebidos:", data);
        setDadosMensaisFavela3D(data);

        // Detectar último mês com dados disponíveis
        let ultimoMesComDados = 0;
        if (Array.isArray(data.eixos)) {
          data.eixos.forEach((eixo: any) => {
            if (eixo.indicadores && Array.isArray(eixo.indicadores)) {
              eixo.indicadores.forEach((indicador: any) => {
                if (indicador.mensal && Array.isArray(indicador.mensal)) {
                  indicador.mensal.forEach((valor: any, index: number) => {
                    if (valor !== null && index > ultimoMesComDados) {
                      ultimoMesComDados = index;
                    }
                  });
                }
              });
            }
          });
        }

        console.log(
          `📅 [FAVELA 3D] Último mês com dados: ${data.meses[ultimoMesComDados]}`
        );
        setMesSelecionadoFavela3D(ultimoMesComDados);
      } catch (error) {
        console.error("❌ [FAVELA 3D] Erro ao buscar dados mensais:", error);
      }
    };

    fetchDadosMensaisFavela3D();
  }, []);

  // Detectar último mês com dados (após carregar todos os dados mensais)
  useEffect(() => {
    if (dadosMensais && dadosMensaisPEC) {
      let ultimoMes = 0;

      // Verificar Inclusão Produtiva
      if (dadosMensais.projetos) {
        dadosMensais.projetos.forEach((projeto: any) => {
          projeto.indicadores?.forEach((indicador: any) => {
            if (indicador.nome === "Quantidade de Alunos" && indicador.mensal) {
              indicador.mensal.forEach((valor: any, index: number) => {
                if (valor !== null && index > ultimoMes) {
                  ultimoMes = index;
                }
              });
            }
          });
        });
      }

      // Verificar PEC
      if (dadosMensaisPEC.projetos) {
        dadosMensaisPEC.projetos.forEach((projeto: any) => {
          projeto.indicadores?.forEach((indicador: any) => {
            if (indicador.nome === "Quantidade de Alunos" && indicador.mensal) {
              indicador.mensal.forEach((valor: any, index: number) => {
                if (valor !== null && index > ultimoMes) {
                  ultimoMes = index;
                }
              });
            }
          });
        });
      }

      console.log(`📅 [DASHBOARD GERAL] Último mês com dados: ${ultimoMes}`);
      setMesSelecionadoDashboard(ultimoMes);
    }
  }, [dadosMensais, dadosMensaisPEC]);

  // Buscar dados de Marketing
  useEffect(() => {
    const fetchMarketingData = async () => {
      try {
        console.log("📊 [MARKETING] Buscando dados do dashboard para ano " + anoIndicadores + "...");
        const response = await fetch(`/api/marketing/dashboard?ano=${anoIndicadores}&mes=${mesSelecionadoMarketing || ""}`);
        if (!response.ok) throw new Error("Failed to fetch marketing data");
        const data = await response.json();
        console.log("✅ [MARKETING] Dados recebidos:", data);
        setMarketingData(data);
      } catch (error) {
        console.error("❌ [MARKETING] Erro ao buscar dados:", error);
      }
    };

    fetchMarketingData();
  }, [anoIndicadores, mesSelecionadoMarketing]);


  // Buscar dados dos Doadores (Stripe) com filtro de ano
  const { data: doadoresData } = useQuery<any>({
    queryKey: ['/api/doadores/stats', anoDoador],
    queryFn: () => fetch(`/api/doadores/stats?ano=${anoDoador}`).then(r => r.json()),
    refetchInterval: 300000,
    staleTime: 60000,
    refetchOnWindowFocus: true,
  });

  // Buscar total de colaboradores para o dashboard
  const { data: colaboradoresStatsData } = useQuery<any>({
    queryKey: ['/api/colaboradores/stats'],
    queryFn: () => fetch('/api/colaboradores/stats').then(r => r.json()),
    refetchInterval: 300000,
  });

  // Buscar doadores externos (doam fora do aplicativo)
  const { data: doadoresExternosData } = useQuery<any>({
    queryKey: ['/api/doadores-externos'],
    queryFn: () => fetch(`/api/doadores-externos`).then(r => r.json()),
    refetchInterval: 900000, // 15 minutos
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  // Buscar dados de Negócios Sociais (Griffite e Outlet)
  // Psico admin dashboard queries (idênticas às do coordenador-psico)
  const { data: psicoDemogDataAdmin, isLoading: isPsicoDemogLoadingAdmin } = useQuery({
    queryKey: ['/api/coordenador/dashboard-demografico-psico', dashFiltroAnoPsicoadmin, dashFiltroMesPsicoadmin],
    queryFn: async () => {
      const response = await fetch(`/api/coordenador/dashboard-demografico-psico?ano=${dashFiltroAnoPsicoadmin}&mes=${dashFiltroMesPsicoadmin}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erro ao buscar dados psico admin');
      return response.json();
    },
  });

  const { data: psicoKpisAdmin } = useQuery({
    queryKey: ['/api/psico/dashboard-kpis', dashFiltroAnoPsicoadmin, dashFiltroMesPsicoadmin],
    queryFn: async () => {
      const url = dashFiltroMesPsicoadmin > 0
        ? `/api/psico/dashboard-kpis?ano=${dashFiltroAnoPsicoadmin}&mes=${dashFiltroMesPsicoadmin}`
        : `/api/psico/dashboard-kpis?ano=${dashFiltroAnoPsicoadmin}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: atencaoSocialAdmin2025, isLoading: loadingAtencaoAdmin } = useQuery({
    queryKey: ['/api/psico/indicadores/atencao-social', 2025],
    queryFn: async () => {
      const res = await fetch('/api/psico/indicadores/atencao-social?ano=2025', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: metodoGritoAdmin2025, isLoading: loadingMetodoAdmin } = useQuery({
    queryKey: ['/api/psico/indicadores/metodo-grito', 2025],
    queryFn: async () => {
      const res = await fetch('/api/psico/indicadores/metodo-grito?ano=2025', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: atencaoSocialAdmin2026, isLoading: loadingAtencaoAdmin2026 } = useQuery({
    queryKey: ['/api/psico/indicadores/atencao-social', 2026],
    queryFn: async () => {
      const res = await fetch('/api/psico/indicadores/atencao-social?ano=2026', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: metodoGritoAdmin2026, isLoading: loadingMetodoAdmin2026 } = useQuery({
    queryKey: ['/api/psico/indicadores/metodo-grito', 2026],
    queryFn: async () => {
      const res = await fetch('/api/psico/indicadores/metodo-grito?ano=2026', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: intervencoesAdminCount } = useQuery<{ total: number }>({
    queryKey: ['/api/psico/intervencoes/count', anoIndicadores],
    queryFn: () => fetch(`/api/psico/intervencoes/count?ano=${anoIndicadores}`).then(r => r.json()),
    refetchInterval: 60000,
  });

  const dashMergedPsicoAdmin = psicoDemogDataAdmin ? {
    ...psicoDemogDataAdmin,
    totalAlunos:           psicoKpisAdmin?.atendidos             ?? psicoDemogDataAdmin?.totalAlunos,
    alunosAtivos:          psicoKpisAdmin?.atendidos             ?? psicoDemogDataAdmin?.alunosAtivos,
    horasAula:             psicoKpisAdmin?.atendimentos          ?? psicoDemogDataAdmin?.horasAula,
    atendimentos:          psicoKpisAdmin?.atendimentos          ?? psicoDemogDataAdmin?.atendimentos,
    visitasDomiciliares:   psicoKpisAdmin?.visitas               ?? psicoDemogDataAdmin?.visitasDomiciliares,
    atendimentosColetivos: psicoKpisAdmin?.atendimentosColetivos ?? psicoDemogDataAdmin?.atendimentosColetivos,
    espacoOGrito:          psicoKpisAdmin?.espacoOGrito          ?? psicoDemogDataAdmin?.espacoOGrito,
    demandasEspontaneas:   psicoKpisAdmin?.demandasEspontaneas   ?? psicoDemogDataAdmin?.demandasEspontaneas,
    psicoFamilias:         psicoKpisAdmin?.familias              ?? psicoDemogDataAdmin?.psicoFamilias,
    psicoCasos:            psicoKpisAdmin?.casosAtivos           ?? psicoDemogDataAdmin?.psicoCasos,
    frequenciaMedia:       psicoKpisAdmin?.resolutividade        ?? psicoDemogDataAdmin?.frequenciaMedia,
    alunosFormados:        psicoKpisAdmin?.casosEncerrados       ?? psicoDemogDataAdmin?.alunosFormados,
    visitasFavela3d:       psicoKpisAdmin?.visitasFavela3d       ?? psicoDemogDataAdmin?.visitasFavela3d       ?? 0,
    atendimentosFavela3d:  psicoKpisAdmin?.atendimentosFavela3d  ?? psicoDemogDataAdmin?.atendimentosFavela3d  ?? 0,
  } : (psicoKpisAdmin ? {
    totalAlunos:           psicoKpisAdmin.atendidos,
    alunosAtivos:          psicoKpisAdmin.atendidos,
    horasAula:             psicoKpisAdmin.atendimentos,
    atendimentos:          psicoKpisAdmin.atendimentos,
    visitasDomiciliares:   psicoKpisAdmin.visitas,
    atendimentosColetivos: psicoKpisAdmin.atendimentosColetivos,
    espacoOGrito:          psicoKpisAdmin.espacoOGrito,
    demandasEspontaneas:   psicoKpisAdmin.demandasEspontaneas,
    psicoFamilias:         psicoKpisAdmin.familias,
    psicoCasos:            psicoKpisAdmin.casosAtivos,
    frequenciaMedia:       psicoKpisAdmin.resolutividade,
    alunosFormados:        psicoKpisAdmin.casosEncerrados,
    visitasFavela3d:       psicoKpisAdmin.visitasFavela3d       ?? 0,
    atendimentosFavela3d:  psicoKpisAdmin.atendimentosFavela3d  ?? 0,
  } : undefined);

  const { data: negociosSociaisData, isLoading: loadingNegocios } = useQuery<{
    success: boolean;
    data: {
      outlet: {
        doacoesRecebidas: number;
        vendasPessoasImpactadas: number;
        pecasVendidas: number;
      };
      griffte: {
        pecasConfeccionadas: number;
        clientesAtendidos: number;
      };
    };
  }>({
    queryKey: ['/api/negocios-sociais', anoIndicadores],
    queryFn: () => fetch(`/api/negocios-sociais?ano=${anoIndicadores}`).then(r => r.json()),
  });

  const { data: indMktData } = useQuery<any>({
    queryKey: ['/api/indicadores-marketing', anoIndicadores],
    queryFn: () => fetch('/api/indicadores-marketing?ano=' + anoIndicadores).then(res => res.json()),
    refetchInterval: 60000
  });

  const { data: seguidoresMensalData } = useQuery<any>({
    queryKey: ['/api/marketing-seguidores-mensal', anoIndicadores],
    queryFn: () => fetch('/api/marketing-seguidores-mensal?ano=' + anoIndicadores).then(res => res.json()),
    refetchInterval: 60000
  });

  const { data: doadoresStatsData } = useQuery<any>({
    queryKey: ['/api/doadores/stats-marketing'],
    queryFn: () => fetch('/api/doadores/stats').then(res => res.json()),
    refetchInterval: 60000
  });

  const { data: negociosData } = useQuery<any>({
    queryKey: ['/api/negocios-sociais', anoIndicadores, mesSelecionadoMarketing],
    queryFn: () => fetch('/api/negocios-sociais?ano=' + anoIndicadores + (mesSelecionadoMarketing ? '&mes=' + mesSelecionadoMarketing : '')).then(r => r.json()),
    refetchInterval: 60000
  });

  const { data: dashInclusaoData, isLoading: loadingDashInclusao } = useQuery<any>({
    queryKey: ['/api/coordenador/dashboard-demografico-inclusao', dashInclusaoFiltroAno, dashInclusaoFiltroMes],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dashInclusaoFiltroAno) params.set('ano', String(dashInclusaoFiltroAno));
      if (dashInclusaoFiltroMes) params.set('mes', String(dashInclusaoFiltroMes));
      const qs = params.toString();
      const url = '/api/coordenador/dashboard-demografico-inclusao' + (qs ? `?${qs}` : '');
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error('Falha ao carregar dados demográficos inclusão');
      return response.json();
    },
    enabled: anoIndicadores === 2026,
  });

  const { data: atendidosInclusaoData } = useQuery<any>({
    queryKey: ['/api/inclusao/atendimentos', dashInclusaoFiltroAno, dashInclusaoFiltroMes],
    queryFn: async () => {
      const params = new URLSearchParams({ ano: String(dashInclusaoFiltroAno) });
      if (dashInclusaoFiltroMes) params.set('mes', String(dashInclusaoFiltroMes));
      const response = await fetch('/api/inclusao/atendimentos?' + params.toString(), { credentials: "include" });
      if (!response.ok) throw new Error('Falha ao carregar atendidos');
      return response.json();
    },
    enabled: anoIndicadores === 2026,
  });

  // KPI cards de Inclusão Produtiva no admin (filtro independente)
  const { data: gvKpiInclusao } = useQuery<any>({
    queryKey: ['/api/gestao-vista', kpiInclusaoAno, kpiInclusaoMes],
    queryFn: () => {
      const qp = kpiInclusaoMes === 'todos' ? `?ano=${kpiInclusaoAno}` : `?ano=${kpiInclusaoAno}&mes=${kpiInclusaoMes}`;
      return fetch(`/api/gestao-vista${qp}`).then(r => r.json());
    },
    enabled: anoIndicadores === 2026,
  });
  const { data: resumoKpiInclusao } = useQuery<any>({
    queryKey: ['/api/dashboard/inclusao/resumo', kpiInclusaoAno, kpiInclusaoMes],
    queryFn: () => {
      const start = kpiInclusaoMes !== 'todos' ? `${kpiInclusaoAno}-${String(kpiInclusaoMes).padStart(2,'0')}-01` : `${kpiInclusaoAno}-01-01`;
      const end   = kpiInclusaoMes !== 'todos' ? `${kpiInclusaoAno}-${String(kpiInclusaoMes).padStart(2,'0')}-31` : `${kpiInclusaoAno}-12-31`;
      return fetch(`/api/dashboard/inclusao/resumo?start=${start}&end=${end}`).then(r => r.json());
    },
    enabled: anoIndicadores === 2026,
  });
  const { data: metasKpiInclusao } = useQuery<any>({
    queryKey: ['/api/metas-indicadores', kpiInclusaoAno, 'inclusao'],
    queryFn: () => fetch(`/api/metas-indicadores?ano=${kpiInclusaoAno}&vertente=inclusao`).then(r => r.json()),
    enabled: anoIndicadores === 2026,
  });

  // Dados reais de 2025 para o painel de Inclusão (usa Gestão à Vista que tem dado_mensal)
  const { data: gvData2025 } = useQuery<any>({
    queryKey: ['/api/gestao-vista', 2025, 'anual'],
    queryFn: () => fetch('/api/gestao-vista?ano=2025').then(r => r.json()),
    enabled: anoIndicadores === 2025,
  });

  const { data: resumoAnual2025 } = useQuery<any>({
    queryKey: ['/api/inclusao-produtiva/resumo-anual', 2025],
    queryFn: () => fetch('/api/inclusao-produtiva/resumo-anual?ano=2025').then(r => r.json()),
    enabled: anoIndicadores === 2025,
  });

  // PEC 2026 — KPI cards + project cards (mesmos endpoints do TabPEC e welcome)
  const pecKpiUrl2026 = kpiPecMes === 'todos' ? `/api/pec/dashboard-kpis?ano=2026` : `/api/pec/dashboard-kpis?ano=2026&mes=${kpiPecMes}`;
  const { data: pecKpis2026 } = useQuery<any>({
    queryKey: [pecKpiUrl2026],
    enabled: activeSection === 'pec' && anoIndicadores === 2026,
  });
  const gvPecQp = kpiPecMes === 'todos' ? '?ano=2026' : `?ano=2026&mes=${kpiPecMes}`;
  const { data: gvDataPec2026 } = useQuery<any>({
    queryKey: ['/api/gestao-vista', '2026', kpiPecMes, 'pec'],
    queryFn: () => fetch(`/api/gestao-vista${gvPecQp}`).then(r => r.json()),
    enabled: activeSection === 'pec' && anoIndicadores === 2026,
  });
  const { data: metasPec2026 } = useQuery<any>({
    queryKey: ['/api/metas-indicadores', '2026', 'pec'],
    queryFn: () => fetch('/api/metas-indicadores?ano=2026&vertente=pec').then(r => r.json()),
    staleTime: 60000,
  });
  const dadosProgramasPecUrl = kpiPecMes === 'todos'
    ? '/api/pec/dados-programas?ano=2026'
    : `/api/pec/dados-programas?ano=2026&mes=${kpiPecMes}`;
  const { data: dadosProgramasPec } = useQuery<any>({
    queryKey: ['/api/pec/dados-programas', 2026, kpiPecMes],
    queryFn: () => fetch(dadosProgramasPecUrl).then(r => r.json()),
    enabled: activeSection === 'pec' && anoIndicadores === 2026,
  });

  const { data: dashPecData, isLoading: loadingDashPec } = useQuery<any>({
    queryKey: ['/api/coordenador/dashboard-demografico', dashPecFiltroAno, dashPecFiltroMes],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dashPecFiltroAno) params.set('ano', String(dashPecFiltroAno));
      if (dashPecFiltroMes) params.set('mes', String(dashPecFiltroMes));
      const qs = params.toString();
      const url = '/api/coordenador/dashboard-demografico' + (qs ? `?${qs}` : '');
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error('Falha ao carregar dados demográficos PEC');
      return response.json();
    },
    enabled: anoIndicadores === 2026,
  });

  // Buscar indicadores do Gestão à Vista (atendimentos por programa)
  const { data: gvIndicadoresData } = useQuery<any>({
    queryKey: ['/api/gestao-vista', anoIndicadores],
    queryFn: () => fetch(`/api/gestao-vista?ano=${anoIndicadores}`).then(r => r.json()),
    refetchInterval: 300000,
    refetchOnMount: true,
  });

  // Ref + drag-to-scroll para o carrossel demográfico (funciona no desktop também)
  const demograficosRef = useRef<HTMLDivElement>(null);
  const demograficosDrag = useRef({ active: false, startX: 0, scrollLeft: 0 });
  const pizzaRef = useRef<HTMLDivElement>(null);
  const pizzaDrag = useRef({ active: false, startX: 0, scrollLeft: 0 });

  // Buscar dados demográficos (Gênero, Raça/Cor, Idade)
  const { data: dadosDemograficos, isLoading: loadingDemograficos } = useQuery<{
    success: boolean;
    totalParticipantes: number;
    genero: Array<{ name: string; value: number; percentage: number }>;
    racaCor: Array<{ name: string; value: number; percentage: number }>;
    idade: Array<{ name: string; value: number; percentage: number }>;
  }>({
    queryKey: ['/api/dados-demograficos', anoIndicadores],
    queryFn: () => fetch(`/api/dados-demograficos?ano=${anoIndicadores}`).then(r => r.json()),
    refetchInterval: 300000,
    refetchOnMount: true,
  });

  // Cores para os gráficos demográficos
  const COLORS_RACA = ['#FFD700', '#FFC107', '#FF9800', '#F97316'];
  const COLORS_GENERO = ['#FFD700', '#FF9800', '#FF6B00'];
  const COLORS_IDADE = ['#FFD700', '#FFC107', '#FF9800', '#FF6B00', '#F97316'];

  // Queries de Cursos de Inclusão Produtiva
  const { data: tecnologiaData } = useQuery<any>({ queryKey: ['/api/inclusao-produtiva/tecnologia'], enabled: selectedArea === 'tecnologia' });
  const { data: belezaData } = useQuery<any>({ queryKey: ['/api/inclusao-produtiva/beleza'], enabled: selectedArea === 'beleza' });
  const { data: artesanatoData } = useQuery<any>({ queryKey: ['/api/inclusao-produtiva/artesanato'], enabled: selectedArea === 'artesanato' });
  const { data: empreendedorismoData } = useQuery<any>({ queryKey: ['/api/inclusao-produtiva/empreendedorismo'], enabled: selectedArea === 'empreendedorismo' });
  const { data: administrativoData } = useQuery<any>({ queryKey: ['/api/inclusao-produtiva/administrativo'], enabled: selectedArea === 'administrativo' });
  const { data: socioemocionalData } = useQuery<any>({ queryKey: ['/api/inclusao-produtiva/socioemocional'], enabled: selectedArea === 'socioemocional' });
  const { data: educacionalData } = useQuery<any>({ queryKey: ['/api/inclusao-produtiva/educacional'], enabled: selectedArea === 'educacional' });
  const { data: operacionalData } = useQuery<any>({ queryKey: ['/api/inclusao-produtiva/operacional'], enabled: selectedArea === 'operacional' });
  const { data: gastronomiaData } = useQuery<any>({ queryKey: ['/api/inclusao-produtiva/gastronomia'], enabled: selectedArea === 'gastronomia' });

  // Dados OFICIAIS dos Patrocinadores 2024 (Total: 56)
  const patrocinadores2024 = [
    // Oficial (1) - R$ 100.000
    { nome: "Banco Mercantil", categoria: "oficial", tipo: "empresa", valorPatrocinio: 100000, status: "ativo", contratosAtivos: true },
    
    // Diamante (2) - R$ 100.000
    { nome: "Construtora Barbosa Mello", categoria: "diamante", tipo: "empresa", valorPatrocinio: 100000, status: "ativo", contratosAtivos: true },
    { nome: "Grupo Boticário", categoria: "diamante", tipo: "empresa", valorPatrocinio: 100000, status: "ativo", contratosAtivos: true },
    
    // Master (10) - R$ 50.000
    { nome: "Patrus Transportes", categoria: "master", tipo: "empresa", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "IMAP", categoria: "master", tipo: "empresa", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "Milplan", categoria: "master", tipo: "empresa", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "Conserva", categoria: "master", tipo: "empresa", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "M.Roscoe", categoria: "master", tipo: "empresa", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "Via Jap", categoria: "master", tipo: "empresa", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "Via Natsu", categoria: "master", tipo: "empresa", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "Inter", categoria: "master", tipo: "empresa", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "Tracbel", categoria: "master", tipo: "empresa", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "Helena Teixeira", categoria: "master", tipo: "pessoa_fisica", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    
    // Gold (6) - R$ 30.000
    { nome: "Bernoulli", categoria: "gold", tipo: "empresa", valorPatrocinio: 30000, status: "ativo", contratosAtivos: true },
    { nome: "Fidens", categoria: "gold", tipo: "empresa", valorPatrocinio: 30000, status: "ativo", contratosAtivos: true },
    { nome: "Divine", categoria: "gold", tipo: "empresa", valorPatrocinio: 30000, status: "ativo", contratosAtivos: true },
    { nome: "Vetorial", categoria: "gold", tipo: "empresa", valorPatrocinio: 30000, status: "ativo", contratosAtivos: true },
    { nome: "Eugênio Mattar", categoria: "gold", tipo: "pessoa_fisica", valorPatrocinio: 30000, status: "ativo", contratosAtivos: true },
    { nome: "Regina Teixeira", categoria: "gold", tipo: "pessoa_fisica", valorPatrocinio: 30000, status: "ativo", contratosAtivos: true },
    
    // Silver (6) - R$ 20.000
    { nome: "Eupar", categoria: "silver", tipo: "empresa", valorPatrocinio: 20000, status: "ativo", contratosAtivos: true },
    { nome: "Patrimar", categoria: "silver", tipo: "empresa", valorPatrocinio: 20000, status: "ativo", contratosAtivos: true },
    { nome: "Geosol", categoria: "silver", tipo: "empresa", valorPatrocinio: 20000, status: "ativo", contratosAtivos: true },
    { nome: "Life Petlife DogLife", categoria: "silver", tipo: "empresa", valorPatrocinio: 20000, status: "ativo", contratosAtivos: true },
    { nome: "Ricardo Sena", categoria: "silver", tipo: "pessoa_fisica", valorPatrocinio: 20000, status: "ativo", contratosAtivos: true },
    { nome: "Beatriz Teixeira", categoria: "silver", tipo: "pessoa_fisica", valorPatrocinio: 20000, status: "ativo", contratosAtivos: true },
    
    // Bronze (31) - R$ 10.000
    { nome: "AVB", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Fundimig", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Mason Holdings", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Orizonti", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "OncoMed", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Corretores", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Serenata", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Taluari", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "A-Ponte", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "HFC", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Grupo Aterpa", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Gerson Bartolomeo", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "J. Mendes", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Kia", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Lubrificantes Savine", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Seculus", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Anuar Donato", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Botelho Spagnol", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Clara", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Caca Gontijo", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Conservasolo", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Estação de Turismo", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "ItaoPower", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "My Mall", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Sancruza", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Oncoclínicas", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Plena", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Rodcar", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "RobbySon", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "BTS", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Guilherme Noronha", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Adriana Almeida", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Lilian e Mauro Tunes", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Alícia e Walter Braga", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
  ];

  // Dados dos Patrocinadores 2025 (da planilha)
  const patrocinadores2025 = [
    // Oficial (1) - R$ 150.000
    { nome: "Conserva de Estradas LTDA", categoria: "oficial", tipo: "empresa", valorPatrocinio: 150000, status: "ativo", contratosAtivos: true },
    
    // Diamante (3) - R$ 100.000
    { nome: "Patrus/IMAP", categoria: "diamante", tipo: "empresa", valorPatrocinio: 100000, status: "ativo", contratosAtivos: true },
    { nome: "Mercantil", categoria: "diamante", tipo: "empresa", valorPatrocinio: 100000, status: "ativo", contratosAtivos: true },
    { nome: "FIDENS", categoria: "diamante", tipo: "empresa", valorPatrocinio: 100000, status: "ativo", contratosAtivos: true },
    
    // Master (6) - R$ 50.000
    { nome: "Helena Teixeira", categoria: "master", tipo: "pessoa_fisica", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "Rubens Menin (Inter)", categoria: "master", tipo: "pessoa_fisica", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "Doador Anônimo", categoria: "master", tipo: "pessoa_fisica", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "Milplan", categoria: "master", tipo: "empresa", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "LF P", categoria: "master", tipo: "pessoa_fisica", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "Regina Teixeira", categoria: "master", tipo: "pessoa_fisica", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    
    // Gold (6) - R$ 30.000
    { nome: "Ricardo Sena", categoria: "gold", tipo: "pessoa_fisica", valorPatrocinio: 30000, status: "ativo", contratosAtivos: true },
    { nome: "Eugenio Mattar", categoria: "gold", tipo: "pessoa_fisica", valorPatrocinio: 30000, status: "ativo", contratosAtivos: true },
    { nome: "Colégio Bernoulli", categoria: "gold", tipo: "empresa", valorPatrocinio: 30000, status: "ativo", contratosAtivos: true },
    { nome: "Otávio Euler (Eupar)", categoria: "gold", tipo: "pessoa_fisica", valorPatrocinio: 30000, status: "ativo", contratosAtivos: true },
    { nome: "Pedro", categoria: "gold", tipo: "pessoa_fisica", valorPatrocinio: 30000, status: "ativo", contratosAtivos: true },
    { nome: "IFMG/BMG", categoria: "gold", tipo: "empresa", valorPatrocinio: 30000, status: "ativo", contratosAtivos: true },
    
    // Silver (5) - R$ 20.000
    { nome: "Grupo Patrimar", categoria: "silver", tipo: "empresa", valorPatrocinio: 20000, status: "ativo", contratosAtivos: true },
    { nome: "Beatriz Teixeira Siqueira", categoria: "silver", tipo: "pessoa_fisica", valorPatrocinio: 20000, status: "ativo", contratosAtivos: true },
    { nome: "Guilherme Noronha", categoria: "silver", tipo: "pessoa_fisica", valorPatrocinio: 20000, status: "ativo", contratosAtivos: true },
    { nome: "Ronaro e Luciana Corrêa (Vetorial)", categoria: "silver", tipo: "pessoa_fisica", valorPatrocinio: 20000, status: "ativo", contratosAtivos: true },
    { nome: "projetoum", categoria: "silver", tipo: "empresa", valorPatrocinio: 20000, status: "ativo", contratosAtivos: true },
    
    // Bronze (25) - R$ 10.000
    { nome: "A Ponte BH", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Serenata", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Leonardo Abreu (Itau Power Shopping)", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Jacques Rios (PTO Andaimes)", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Seculus", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Alicia Fiqueiró", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Porcaro Negócios Imobiliários", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Márcio Ladeira e Vanessa (Luminatti)", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Mauro e Lilian Tunes", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Fred Silva (SDS Siderúrgica)", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Botelho Spagnol Carvalho Advogados", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Rochedo", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "DELP", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "SAVINE", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Rita e Marcelo Corrêa (Auto Rede)", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Anônimo", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Atelier Monica Maia", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "FUNDIMIG", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Aterpa", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Evandro Negrão de Lima (My Mall/Sancruza)", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Estação de Turismo", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "José Raimundo e Jussara", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Matheus Campara Elias (Nosso Bazzar)", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Anônimo (2)", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Cláudio Calonge", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
  ];

  const patrocinadoresFiltrados = patrocinadoresData?.patrocinadores || [];

  // Calcular estatísticas dos dados do banco
  const estatisticasFiltradas = {
    totalPatrocinadores: patrocinadoresFiltrados.length,
    investimentoTotal: patrocinadoresFiltrados.reduce(
      (acc: number, p: any) => acc + parseFloat(p.valorPatrocinio || "0"),
      0
    ),
    projetosAtivos: patrocinadoresFiltrados.filter((p: any) => p.status === 'ativo').length,
    contratosAtivos: patrocinadoresFiltrados.length > 0 
      ? Math.round((patrocinadoresFiltrados.filter((p: any) => p.contratosAtivos).length / patrocinadoresFiltrados.length) * 100)
      : 0
  };

  // Helper para pegar último valor não nulo
  const getUltimoValor = (valores: any[]) => {
    if (!valores) return null;
    return [...valores]
      .reverse()
      .find((v: any) => v !== null && v !== undefined);
  };

  // Helper para calcular percentual da meta
  const calcularPercentual = (valor: number, meta: string) => {
    const metaNumero = parseFloat(meta.replace(/[^0-9.]/g, ""));
    if (isNaN(metaNumero) || metaNumero === 0) return null;
    return ((valor / metaNumero) * 100).toFixed(1);
  };

  // Helper para buscar valor do indicador no mês selecionado
  const getValorMensal = (projeto: string, indicador: string) => {
    if (!dadosMensais) return null;
    const projetoData = dadosMensais.projetos.find(
      (p: any) => p.projeto === projeto
    );
    if (!projetoData) return null;
    const indicadorData = projetoData.indicadores.find(
      (i: any) => i.nome === indicador
    );
    if (!indicadorData || !indicadorData.mensal) return null;
    return indicadorData.mensal[mesSelecionadoDashboard];
  };

  // Helper para buscar meta do indicador
  const getMetaIndicador = (projeto: string, indicador: string) => {
    if (!dadosMensais) return null;
    const projetoData = dadosMensais.projetos.find(
      (p: any) => p.projeto === projeto
    );
    if (!projetoData) return null;
    const indicadorData = projetoData.indicadores.find(
      (i: any) => i.nome === indicador
    );
    return indicadorData?.meta || null;
  };

  // Helper para buscar valor do indicador Inclusão Produtiva no mês selecionado
  const getValorMensalInclusao = (projeto: string, indicador: string) => {
    if (!dadosMensais) return null;
    const projetoData = dadosMensais.projetos.find(
      (p: any) => p.projeto === projeto
    );
    if (!projetoData) return null;
    const indicadorData = projetoData.indicadores.find(
      (i: any) => i.nome === indicador
    );
    if (!indicadorData || !indicadorData.mensal) return null;
    
    // Usar o estado correto de cada projeto
    let mesIndex = 0;
    if (projeto === "LAB. VOZES DO FUTURO") mesIndex = mesSelecionadoLab;
    else if (projeto === "CURSOS PRESENCIAIS") mesIndex = mesSelecionadoCursos30h;
    else if (projeto === "CURSOS EAD CGD") mesIndex = mesSelecionadoEad;
    
    return indicadorData.mensal[mesIndex];
  };

  // Helper para buscar valor do indicador Psicossocial no mês selecionado
  const getValorMensalPsicossocial = (indicador: string) => {
    if (!dadosMensaisPsicossocial) return null;
    const indicadorData = dadosMensaisPsicossocial.indicadores.find(
      (i: any) => i.nome === indicador
    );
    if (!indicadorData || !indicadorData.mensal) return null;
    return indicadorData.mensal[mesSelecionadoPsicossocial];
  };

  // Helper para buscar valor do indicador PEC no mês selecionado
  const getValorMensalPEC = (projeto: string, indicador: string) => {
    if (!dadosMensaisPEC) return null;
    const projetoData = dadosMensaisPEC.projetos.find(
      (p: any) => p.projeto === projeto
    );
    if (!projetoData) return null;
    const indicadorData = projetoData.indicadores.find(
      (i: any) => i.nome === indicador
    );
    if (!indicadorData || !indicadorData.mensal) return null;
    return indicadorData.mensal[mesSelecionadoPEC];
  };

  // Helper para buscar meta do indicador PEC
  const getMetaIndicadorPEC = (projeto: string, indicador: string) => {
    if (!dadosMensaisPEC) return null;
    const projetoData = dadosMensaisPEC.projetos.find(
      (p: any) => p.projeto === projeto
    );
    if (!projetoData) return null;
    const indicadorData = projetoData.indicadores.find(
      (i: any) => i.nome === indicador
    );
    return indicadorData?.meta || null;
  };

  // Helper para buscar valor do indicador Favela 3D no mês selecionado
  const getValorMensalFavela3D = (eixo: string, indicador: string) => {
    if (!dadosMensaisFavela3D) return null;
    const eixoData = dadosMensaisFavela3D.eixos.find(
      (e: any) => e.nome === eixo
    );
    if (!eixoData) return null;
    const indicadorData = eixoData.indicadores.find(
      (i: any) => i.nome === indicador
    );
    if (!indicadorData || !indicadorData.mensal) return null;
    return indicadorData.mensal[mesSelecionadoFavela3D];
  };

  // Helper para buscar meta do indicador Favela 3D
  const getMetaIndicadorFavela3D = (eixo: string, indicador: string) => {
    if (!dadosMensaisFavela3D) return null;
    const eixoData = dadosMensaisFavela3D.eixos.find(
      (e: any) => e.nome === eixo
    );
    if (!eixoData) return null;
    const indicadorData = eixoData.indicadores.find(
      (i: any) => i.nome === indicador
    );
    return indicadorData?.meta || null;
  };

  // Helper para calcular total de alunos ativos (Inclusão Produtiva + PEC) do mês selecionado
  const calcularAlunosAtivosMes = (mesIndex: number) => {
    let total = 0;

    // Somar alunos da Inclusão Produtiva
    if (dadosMensais && dadosMensais.projetos) {
      dadosMensais.projetos.forEach((projeto: any) => {
        const indicadorAlunos = projeto.indicadores?.find(
          (i: any) => i.nome === "Quantidade de Alunos"
        );
        if (
          indicadorAlunos &&
          indicadorAlunos.mensal &&
          indicadorAlunos.mensal[mesIndex] !== null
        ) {
          total += indicadorAlunos.mensal[mesIndex];
        }
      });
    }

    // Somar alunos do PEC
    if (dadosMensaisPEC && dadosMensaisPEC.projetos) {
      dadosMensaisPEC.projetos.forEach((projeto: any) => {
        const indicadorAlunos = projeto.indicadores?.find(
          (i: any) => i.nome === "Quantidade de Alunos"
        );
        if (
          indicadorAlunos &&
          indicadorAlunos.mensal &&
          indicadorAlunos.mensal[mesIndex] !== null
        ) {
          total += indicadorAlunos.mensal[mesIndex];
        }
      });
    }

    return total;
  };

  // Pegar dados do Lab. Vozes do Futuro
  const labVozesData = indicadoresData?.projetos?.find(
    (p: any) => p.projeto === "LAB. VOZES DO FUTURO"
  );
  const frequenciaLab = labVozesData?.indicadores?.find(
    (i: any) => i.nome === "Frequência"
  );
  const evasaoLab = labVozesData?.indicadores?.find(
    (i: any) => i.nome === "Evasão"
  );
  const quantidadeAlunosLab = labVozesData?.indicadores?.find(
    (i: any) => i.nome === "Quantidade de Alunos"
  );
  const avaliacaoLab = labVozesData?.indicadores?.find(
    (i: any) => i.nome === "Avaliação de Aprendizagem"
  );
  const npsLab = labVozesData?.indicadores?.find((i: any) => i.nome === "NPS");
  const empregabilidadeLab = labVozesData?.indicadores?.find(
    (i: any) => i.nome === "Empregabilidade"
  );

  // Pegar dados dos Cursos Presenciais
  const cursosPresenciaisData = indicadoresData?.projetos?.find(
    (p: any) => p.projeto === "CURSOS PRESENCIAIS"
  );
  const frequenciaPresencial = cursosPresenciaisData?.indicadores?.find(
    (i: any) => i.nome === "Frequência"
  );
  const evasaoPresencial = cursosPresenciaisData?.indicadores?.find(
    (i: any) => i.nome === "Evasão"
  );
  const quantidadeAlunosPresencial = cursosPresenciaisData?.indicadores?.find(
    (i: any) => i.nome === "Quantidade de Alunos"
  );
  const avaliacaoPresencial = cursosPresenciaisData?.indicadores?.find(
    (i: any) => i.nome === "Avaliação de Aprendizagem"
  );
  const npsPresencial = cursosPresenciaisData?.indicadores?.find(
    (i: any) => i.nome === "NPS"
  );
  const empregabilidadePresencial = cursosPresenciaisData?.indicadores?.find(
    (i: any) => i.nome === "Empregabilidade"
  );

  // Pegar dados dos Cursos EAD CGD
  const cursosEadData = indicadoresData?.projetos?.find((p: any) => p.projeto === "CURSOS EAD CGD");
  const frequenciaEad = cursosEadData?.indicadores?.find((i: any) => i.nome === "Frequência");
  const evasaoEad = cursosEadData?.indicadores?.find((i: any) => i.nome === "Evasão");
  const quantidadeAlunosEad = cursosEadData?.indicadores?.find((i: any) => i.nome === "Quantidade de Alunos");
  const avaliacaoEad = cursosEadData?.indicadores?.find((i: any) => i.nome === "Avaliação de Aprendizagem");
  const npsEad = cursosEadData?.indicadores?.find((i: any) => i.nome === "NPS");
  const empregabilidadeEad = cursosEadData?.indicadores?.find(
    (i: any) => i.nome === "Empregabilidade"
  );

  // Chart colors for consistency
  const COLORS = [
    "#f59e0b",
    "#3b82f6",
    "#10b981",
    "#8b5cf6",
    "#ef4444",
    "#f97316",
    "#06b6d4",
    "#84cc16",
  ];

  // Council Approval Section Component
  const CouncilApprovalSection = () => {
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [councilMembers, setCouncilMembers] = useState<any[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const [processingRequest, setProcessingRequest] = useState<number | null>(
      null
    );
    const [newMemberPhone, setNewMemberPhone] = useState("");
    const [newMemberEmail, setNewMemberEmail] = useState("");
    const [addingMember, setAddingMember] = useState(false);

    // Load pending council requests and members
    useEffect(() => {
      fetchPendingRequests();
      fetchCouncilMembers();
    }, []);

    const fetchPendingRequests = async () => {
      try {
        setLoadingRequests(true);
        const response = await fetch("/api/pending-council-requests");
        if (response.ok) {
          const requests = await response.json();
          setPendingRequests(requests);
        }
      } catch (error) {
        console.error("Error fetching pending requests:", error);
      } finally {
        setLoadingRequests(false);
      }
    };

    const fetchCouncilMembers = async () => {
      try {
        setLoadingMembers(true);
        const response = await fetch("/api/council-members");
        if (response.ok) {
          const members = await response.json();
          setCouncilMembers(members);
        }
      } catch (error) {
        console.error("Error fetching council members:", error);
      } finally {
        setLoadingMembers(false);
      }
    };

    const handleAddMember = async () => {
      if (!newMemberPhone.trim() && !newMemberEmail.trim()) {
        toast({
          title: "Erro",
          description:
            "Digite pelo menos um telefone ou email para adicionar o membro.",
          variant: "destructive",
        });
        return;
      }

      try {
        setAddingMember(true);
        const response = await fetch("/api/add-council-member", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: newMemberPhone.trim(),
            email: newMemberEmail.trim(),
            addedBy: "Leo Martins",
          }),
        });

        if (response.ok) {
          toast({
            title: "Membro adicionado",
            description: "O membro foi adicionado ao conselho com sucesso.",
          });
          setNewMemberPhone("");
          setNewMemberEmail("");
          fetchCouncilMembers();
        } else {
          const error = await response.json();
          throw new Error(error.message || "Erro ao adicionar membro");
        }
      } catch (error) {
        toast({
          title: "Erro",
          description:
            (error as Error)?.message ||
            "Não foi possível adicionar o membro. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setAddingMember(false);
      }
    };

    const handleRemoveMember = async (memberId: number) => {
      try {
        const response = await fetch("/api/remove-council-member", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            memberId,
            removedBy: "Leo Martins",
          }),
        });

        if (response.ok) {
          toast({
            title: "Membro removido",
            description: "O membro foi removido do conselho com sucesso.",
          });
          fetchCouncilMembers();
        } else {
          throw new Error("Erro ao remover membro");
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível remover o membro. Tente novamente.",
          variant: "destructive",
        });
      }
    };

    const handleApprovalAction = async (
      requestId: number,
      action: "approve" | "reject"
    ) => {
      try {
        setProcessingRequest(requestId);
        const response = await fetch("/api/council-approval", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requestId,
            action,
            processedBy: "Leo Martins",
          }),
        });

        if (response.ok) {
          toast({
            title: `Solicitação ${
              action === "approve" ? "aprovada" : "rejeitada"
            }`,
            description: `A solicitação foi ${
              action === "approve" ? "aprovada" : "rejeitada"
            } com sucesso.`,
          });
          fetchPendingRequests(); // Refresh the list
        } else {
          throw new Error("Erro ao processar solicitação");
        }
      } catch (error) {
        toast({
          title: "Erro",
          description:
            "Não foi possível processar a solicitação. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setProcessingRequest(null);
      }
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              Gerenciamento do Conselho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Gerencie membros do conselho e solicitações de acesso. Apenas você
              pode aprovar, adicionar ou remover membros.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Membros: {councilMembers.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Pendentes: {pendingRequests.length}
                </span>
              </div>
              <Button
                onClick={() => {
                  fetchPendingRequests();
                  fetchCouncilMembers();
                }}
                variant="outline"
                size="sm"
                disabled={loadingRequests || loadingMembers}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${
                    loadingRequests || loadingMembers ? "animate-spin" : ""
                  }`}
                />
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add New Member */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-green-600" />
              Adicionar Membro do Conselho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="memberPhone">Telefone</Label>
                  <Input
                    id="memberPhone"
                    placeholder="(11) 99999-9999"
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="memberEmail">Email</Label>
                  <Input
                    id="memberEmail"
                    type="email"
                    placeholder="membro@exemplo.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={handleAddMember}
                disabled={
                  addingMember ||
                  (!newMemberPhone.trim() && !newMemberEmail.trim())
                }
                className="bg-green-600 hover:bg-green-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {addingMember ? "Adicionando..." : "Adicionar Membro"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Membros Ativos do Conselho
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMembers ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : councilMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Nenhum membro do conselho cadastrado
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {councilMembers.map((member) => (
                  <div
                    key={member.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Shield className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {member.nome || "Nome não informado"}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {member.telefone || member.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>
                            Adicionado em:{" "}
                            {new Date(
                              member.addedAt || member.createdAt
                            ).toLocaleString("pt-BR")}
                          </span>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            Ativo
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleRemoveMember(member.id)}
                          size="sm"
                          variant="destructive"
                        >
                          <UserMinus className="w-4 h-4 mr-1" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Requests List */}
        <Card>
          <CardHeader>
            <CardTitle>Solicitações Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRequests ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma solicitação pendente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {request.nome}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {request.telefone}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>
                            Solicitado em:{" "}
                            {new Date(request.requestedAt).toLocaleString(
                              "pt-BR"
                            )}
                          </span>
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-700 border-yellow-200"
                          >
                            Pendente
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() =>
                            handleApprovalAction(request.id, "approve")
                          }
                          disabled={processingRequest === request.id}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          onClick={() =>
                            handleApprovalAction(request.id, "reject")
                          }
                          disabled={processingRequest === request.id}
                          size="sm"
                          variant="destructive"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  useEffect(() => {
    // Desenvolvedor autenticado tem acesso total
    const papelLocal = localStorage.getItem("userPapel") || "";
    if (papelLocal === "dev" || papelLocal === "desenvolvedor" || papelLocal === "dev-admin" || papelLocal === "super_admin") {
      setUserName("Desenvolvedor");
      setUserEmail(localStorage.getItem("userEmail") || "dev@clubedogrito.com");
      setTempName(localStorage.getItem("userName") || "Desenvolvedor");
      setTempPhone(localStorage.getItem("userTelefone") || "");
      setIsLeo(true);
      loadGestaoVistaData();
      return;
    }

    if (demoMode) {
      // Demo mode: bypass authentication and set demo data
      setUserName("Léo Martins");
      setUserEmail("leo@clubedogrito.com");
      setTempName("Léo Martins");
      setTempPhone("+5531986631203");
      setIsLeo(true);
      loadGestaoVistaData();
      return;
    }

    const nome = localStorage.getItem("userName") || "Léo Martins";
    const email = localStorage.getItem("userEmail") || "";
    const papel = localStorage.getItem("userPapel") || "";
    const telefone = localStorage.getItem("userTelefone") || "";

    setUserName(nome);
    setUserEmail(email);
    setTempName(nome);
    setTempPhone(telefone);

    // Check if user is Leo based on role from phone verification or email
    const isLeoUser =
      papel === "leo" ||
      isLeoByRole(papel) ||
      
      false;

    setIsLeo(isLeoUser);

    // Load data from Gestão à Vista spreadsheet
    loadGestaoVistaData();
  }, [demoMode]);

  const loadGestaoVistaData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "/api/gestao-vista/meta-realizado?period=2026-01&scope=monthly"
      );
      if (response.ok) {
        const data = await response.json();
        setGestaoVistaData(data);
      } else {
        console.error("Erro ao carregar dados da Gestão à Vista");
        setGestaoVistaData(null);
      }
    } catch (error) {
      console.error("Erro ao carregar dados da Gestão à Vista:", error);
      setGestaoVistaData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearLocalStoragePreservingLgpd();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
    setLocation("/");
  };

  const handleUpdateName = async () => {
    if (!tempName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite um nome válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      const currentPhone = localStorage.getItem("userTelefone");

      const response = await fetch("/api/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          telefone: currentPhone,
          nome: tempName.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("userName", tempName);
        setUserName(tempName);
        toast({
          title: "Nome atualizado com sucesso",
          description: "Suas informações foram salvas no sistema.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erro ao atualizar nome",
          description: error.error || "Ocorreu um erro inesperado.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro de conectividade",
        description: "Não foi possível conectar com o servidor.",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePhone = async () => {
    if (!tempPhone.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite um telefone válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      const currentPhone = localStorage.getItem("userTelefone");

      const response = await fetch("/api/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          telefone: currentPhone,
          nome: userName,
          novoTelefone: tempPhone.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("userTelefone", tempPhone);
        toast({
          title: "Telefone atualizado com sucesso",
          description: "Suas informações foram salvas no sistema.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erro ao atualizar telefone",
          description: error.error || "Ocorreu um erro inesperado.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro de conectividade",
        description: "Não foi possível conectar com o servidor.",
        variant: "destructive",
      });
    }
  };

  const sidebarItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      section: "main",
      color: "text-gray-600",
    },
    {
      id: "doador",
      label: "Doadores",
      icon: Heart,
      section: "data",
      color: "text-gray-600",
    },
    {
      id: "patrocinador",
      label: "Patrocinadores",
      icon: Building,
      section: "data",
      color: "text-gray-600",
    },
    {
      id: "colaborador",
      label: "Colaboradores",
      icon: Handshake,
      section: "data",
      color: "text-gray-600",
    },
    {
      id: "conselho",
      label: "Conselho",
      icon: Shield,
      section: "admin",
      color: "text-red-600",
    },
    {
      id: "chamadas-auditoria",
      label: "Auditoria Chamadas",
      icon: ClipboardList,
      section: "admin",
      color: "text-orange-600",
    },
    {
      id: "solicitacoes-exclusao",
      label: "Exclusões Chamadas",
      icon: Trash2,
      section: "admin",
      color: "text-red-500",
    },
    {
      id: "lgpd-consentimentos",
      label: "Auditoria LGPD",
      icon: Shield,
      section: "admin",
      color: "text-indigo-600",
    },
    {
      id: "lgpd-ropa",
      label: "ROPA (LGPD)",
      icon: FileText,
      section: "admin",
      color: "text-indigo-600",
    },
    {
      id: "favela3d",
      label: "Favela 3D",
      icon: "logo",
      section: "gestao",
      color: "text-purple-600",
    },
    {
      id: "inclusao",
      label: "Inclusão Produtiva",
      icon: TrendingUp,
      section: "gestao",
      color: "text-green-600",
    },
    {
      id: "pec",
      label: "PEC",
      icon: FileText,
      section: "gestao",
      color: "text-orange-600",
    },
    {
      id: "psicossocial",
      label: "Psicossocial",
      icon: Users,
      section: "gestao",
      color: "text-blue-600",
    },
    {
      id: "negocios",
      label: "Negócios Sociais",
      icon: Briefcase,
      section: "gestao",
      color: "text-gray-600",
    },
    {
      id: "investimento",
      label: "Financeiro",
      icon: DollarSign,
      section: "gestao",
      color: "text-emerald-600",
    },
    {
      id: "marketing",
      label: "Mkt e Tecnologia",
      icon: TrendingUp,
      section: "gestao",
      color: "text-yellow-600",
    },
    {
      id: "metas-indicadores",
      label: "Metas e Indicadores",
      icon: Target,
      section: "gestao",
      color: "text-indigo-600",
    },
    {
      id: "settings",
      label: "Configurações",
      icon: Settings,
      section: "system",
      color: "text-gray-600",
    },
  ];

  const renderMobileDashboard = () => (
    <div className="space-y-4">
      {/* Mobile Header Cards - 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="text-lg font-bold text-yellow-700">
                  {chartData?.sectorComparison?.donation?.value}
                </div>
                <p className="text-xs text-yellow-600">Doadores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-lg font-bold text-blue-700">
                  {chartData?.sectorComparison?.sponor?.value}
                </div>
                <p className="text-xs text-blue-600">Patrocinadores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-lg font-bold text-green-700">
                  {chartData?.sectorComparison?.student?.value}
                </div>
                <p className="text-xs text-green-600">Alunos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Handshake className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-lg font-bold text-purple-700">
                  {chartData?.sectorComparison?.collaborator?.value}
                </div>
                <p className="text-xs text-purple-600">Colaboradores</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Pie Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-600" />
            Distribuição
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <RechartsPieChart>
              <Pie
                data={chartData?.distributionPieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData?.distributionPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Mobile Performance Indicator */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" />
            Performance Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Meta Geral</span>
              <span className="text-sm font-semibold">85%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full"
                style={{ width: "85%" }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );


  const renderDashboard = () => (
    <div className="space-y-6">

      {/* Total de Doadores (App + Externos) */}
      <Card className="border-green-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Target className="w-4 h-4 text-green-600" />
            Total de Doadores
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div style={{ background: '#f5f3ff', borderRadius: '8px', padding: isMobile ? '10px 6px' : '16px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? '1.5rem' : '1.875rem', fontWeight: 700, color: '#7c3aed' }}>
                {(doadoresData?.porStatus?.active || 0) + (doadoresData?.porStatus?.trialing || 0)}
              </div>
              <div style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: '#4b5563' }}>Aplicativo</div>
              {!isMobile && <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Via Stripe</div>}
            </div>
            <div style={{ background: '#fff7ed', borderRadius: '8px', padding: isMobile ? '10px 6px' : '16px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? '1.5rem' : '1.875rem', fontWeight: 700, color: '#ea580c' }}>
                {doadoresExternosData?.totalDoadores || 0}
              </div>
              <div style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: '#4b5563' }}>Externos</div>
              {!isMobile && <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Fora do app</div>}
            </div>
            <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: isMobile ? '10px 6px' : '16px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? '1.5rem' : '1.875rem', fontWeight: 700, color: '#16a34a' }}>
                {((doadoresData?.porStatus?.active || 0) + (doadoresData?.porStatus?.trialing || 0)) + (doadoresExternosData?.totalDoadores || 0)}
              </div>
              <div style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: '#4b5563' }}>Total</div>
              {!isMobile && <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Combinado</div>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Patrocinadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalPatrocinadoresAtivos}</div>
            <p className="text-xs text-gray-500">Parceiros cadastrados</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Colaboradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{colaboradoresStatsData?.totalColaboradores ?? 0}</div>
            <p className="text-xs text-gray-500">Equipe colaborativa</p>
          </CardContent>
        </Card>
      </div>

      {/* Atendimentos por Programa */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-5 h-5 text-blue-600" />
            Atendimentos por Programa
          </CardTitle>
          <p className="text-xs text-gray-500">Total acumulado 2026 • Atualizado em tempo real</p>
        </CardHeader>
        <CardContent>
          {(() => {
            const programas = [
              { nome: 'PEC', valor: gvIndicadoresData?.indicadores?.criancasAtendidas?.valor ?? 0, cor: 'bg-emerald-500' },
              { nome: 'Inclusão Produtiva', valor: atendidosInclusaoData?.total ?? dashInclusaoData?.atendimentos ?? 0, cor: 'bg-blue-500' },
              { nome: 'Psicossocial', valor: psicoKpisAdmin?.atendidos ?? dashMergedPsicoAdmin?.totalAlunos ?? 0, cor: 'bg-amber-500' },
            ];
            const total = programas.reduce((acc, p) => acc + p.valor, 0);
            return (
              <div className="space-y-4">
                <div className="text-center pb-2 border-b border-gray-100">
                  <span className="text-3xl font-bold text-gray-800">{total.toLocaleString('pt-BR')}</span>
                  <p className="text-xs text-gray-500 mt-1">Total de pessoas atendidas</p>
                </div>
                {programas.map((p) => (
                  <div key={p.nome} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${p.cor}`} />
                      <span className="text-sm font-medium text-gray-700">{p.nome}</span>
                    </div>
                    <span className="text-lg font-bold text-gray-800">{p.valor.toLocaleString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Gráficos Demográficos - Gênero e Raça/Cor */}
      <div
        ref={demograficosRef}
        className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto snap-x snap-mandatory pb-2 md:pb-0 md:overflow-visible select-none cursor-grab"
        onMouseDown={(e) => {
          const el = demograficosRef.current; if (!el) return;
          demograficosDrag.current = { active: true, startX: e.clientX, scrollLeft: el.scrollLeft };
          el.style.scrollSnapType = 'none';
          el.style.cursor = 'grabbing';
        }}
        onMouseMove={(e) => {
          const d = demograficosDrag.current; const el = demograficosRef.current;
          if (!d.active || !el) return;
          e.preventDefault();
          el.scrollLeft = d.scrollLeft - (e.clientX - d.startX) * 1.5;
        }}
        onMouseUp={() => {
          const el = demograficosRef.current;
          if (el) { el.style.scrollSnapType = ''; el.style.cursor = ''; }
          demograficosDrag.current.active = false;
        }}
        onMouseLeave={() => {
          const el = demograficosRef.current;
          if (el) { el.style.scrollSnapType = ''; el.style.cursor = ''; }
          demograficosDrag.current.active = false;
        }}
      >
        {/* Gráfico de Gênero */}
        <Card className="min-w-[82vw] md:min-w-0 snap-start flex-shrink-0 md:flex-shrink">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-yellow-600" />
              Gênero
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="h-[250px]">
              {loadingDemograficos ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                </div>
              ) : dadosDemograficos?.genero && dadosDemograficos.genero.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={dadosDemograficos.genero}
                      cx="50%"
                      cy="48%"
                      labelLine={false}
                      label={({ percentage }: any) => percentage >= 5 ? `${percentage}%` : ''}
                      outerRadius={65}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosDemograficos.genero.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_GENERO[index % COLORS_GENERO.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value} pessoas`, name]} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} iconType="square" />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-500 flex items-center justify-center h-full">Sem dados</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Raça/Cor */}
        <Card className="min-w-[82vw] md:min-w-0 snap-start flex-shrink-0 md:flex-shrink">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-600" />
              Raça/Cor
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="h-[250px]">
              {loadingDemograficos ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                </div>
              ) : dadosDemograficos?.racaCor && dadosDemograficos.racaCor.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={dadosDemograficos.racaCor}
                      cx="50%"
                      cy="48%"
                      labelLine={false}
                      label={({ percentage }: any) => percentage >= 5 ? `${percentage}%` : ''}
                      outerRadius={65}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosDemograficos.racaCor.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_RACA[index % COLORS_RACA.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value} pessoas`, name]} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} iconType="square" />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-500 flex items-center justify-center h-full">Sem dados</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Idade */}
        <Card className="min-w-[82vw] md:min-w-0 snap-start flex-shrink-0 md:flex-shrink">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Faixa Etária
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="h-[250px]">
              {loadingDemograficos ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                </div>
              ) : dadosDemograficos?.idade && dadosDemograficos.idade.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={dadosDemograficos.idade}
                      cx="50%"
                      cy="48%"
                      labelLine={false}
                      label={({ percentage }: any) => percentage >= 5 ? `${percentage}%` : ''}
                      outerRadius={65}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosDemograficos.idade.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_IDADE[index % COLORS_IDADE.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value} pessoas`, name]} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} iconType="square" iconSize={8} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-500 flex items-center justify-center h-full">Sem dados</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );

  const AdminGaugeChart = ({ 
    value, 
    meta, 
    label, 
    isInverse = false,
    hideMeta = false
  }: { 
    value: number; 
    meta: number; 
    label: string; 
    isInverse?: boolean;
    hideMeta?: boolean;
  }) => {
    const absValue = Math.abs(value);
    const absMeta = Math.abs(meta);
    const percentage = absMeta > 0 ? (absValue / absMeta) * 100 : 0;
    const cappedPercentage = Math.min(percentage, 100);
    
    const [animatedProgress, setAnimatedProgress] = useState(0);
    
    useEffect(() => {
      const duration = 1500;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setAnimatedProgress(easeOut * cappedPercentage);
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }, [cappedPercentage]);
    
    const isGoalMet = isInverse ? percentage <= 100 : percentage >= 100;
    
    const getColor = () => {
      if (isInverse) {
        if (percentage <= 80) return '#22c55e';
        if (percentage <= 100) return '#eab308';
        return '#ef4444';
      } else {
        if (percentage >= 100) return '#22c55e';
        if (percentage >= 80) return '#eab308';
        return '#ef4444';
      }
    };

    const color = getColor();
    
    const size = 140;
    const strokeWidth = 14;
    const radius = (size - strokeWidth) / 2;
    const circumference = Math.PI * radius;
    const progress = (animatedProgress / 100) * circumference;

    return (
      <div className="bg-white rounded-xl p-2 lg:p-4 border border-gray-200 shadow-sm flex flex-col items-center justify-center">
        <p className="text-gray-800 text-[10px] lg:text-base font-semibold mb-1 lg:mb-2 text-center leading-tight">{label}</p>
        
        <div className="relative">
          <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`} className="w-[80px] h-[45px] lg:w-[140px] lg:h-[80px]">
            <path
              d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <path
              d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${progress} ${circumference}`}
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-0">
            <span className="text-lg lg:text-3xl font-bold text-gray-900">
              {value.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
        
        {!hideMeta && isGoalMet && percentage >= 100 && (
          <div className="flex items-center justify-center gap-1 mt-0.5 lg:mt-1">
            <div className="w-4 h-4 lg:w-5 lg:h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-2 h-2 lg:w-3 lg:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-green-600 text-[8px] lg:text-xs font-bold">META ATINGIDA</span>
          </div>
        )}
        
        {!hideMeta && (
          <div className="flex items-center justify-between w-full mt-1 lg:mt-2 px-1 lg:px-2 gap-1">
            <span className="text-gray-500 text-[9px] lg:text-sm truncate">Meta: {meta.toLocaleString('pt-BR')}</span>
            {isGoalMet && percentage >= 100 ? (
              <span className="text-[9px] lg:text-sm font-bold px-1 lg:px-2 py-0.5 rounded bg-green-100 text-green-600 flex items-center gap-0.5 lg:gap-1 whitespace-nowrap">
                ✓ {Math.round(percentage)}%
              </span>
            ) : (
              <span className="text-[9px] lg:text-sm font-bold px-1 lg:px-2 py-0.5 rounded whitespace-nowrap" style={{ color, backgroundColor: `${color}15` }}>
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  // Helper para pegar último valor válido de um array
  const getLastValidValue = (arr: any[]) => {
    if (!arr || !Array.isArray(arr)) return 0;
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i] !== null && arr[i] !== undefined) return arr[i];
    }
    return 0;
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case "dashboard":
        return renderDashboard();
      case "doador":
        // ===== DADOS 100% REAIS DO STRIPE =====
        const statsDoadores = doadoresData || {};
        const totalDoadores = statsDoadores.totalDoadores || 0;
        const arrecadacaoMensal = statsDoadores.arrecadacaoMensal || 0;
        const doacaoMedia = statsDoadores.doacaoMedia || 0;
        const taxaRetencao = statsDoadores.taxaRetencao || 0;
        const porStatus = statsDoadores.porStatus || { active: 0, trialing: 0, past_due: 0 };
        const porPlano = statsDoadores.porPlano || [];
        const porPlanoAtivos = statsDoadores.porPlanoAtivos || [];
        const porPlanoPendentes = statsDoadores.porPlanoPendentes || [];
        const porPlanoCancelados = statsDoadores.porPlanoCancelados || [];
        const evolucaoMensal = statsDoadores.evolucaoMensal || [];
        const distribuicaoPorValor = statsDoadores.distribuicaoPorValor || [];
        const listaDoadores = statsDoadores.doadores || [];

        // Cores para os gráficos
        const CORES_PLANO = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
        const CORES_STATUS = { active: '#10b981', trialing: '#3b82f6', past_due: '#f59e0b' };

        return (
          <div className="space-y-6">
            {/* Seletor de Ano */}
            <div className="flex justify-end gap-2 mb-4">
              <Button
                onClick={() => setAnoDoador(2025)}
                variant={anoDoador === 2025 ? "default" : "outline"}
                className={
                  anoDoador === 2025
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : ""
                }
              >
                Doadores 2025
              </Button>
              <Button
                onClick={() => setAnoDoador(2026)}
                variant={anoDoador === 2026 ? "default" : "outline"}
                className={
                  anoDoador === 2026
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : ""
                }
              >
                Doadores 2026
              </Button>
            </div>

            {/* Total de Doadores (App + Externos) */}
            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-600" />
                  Total de Doadores
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 sm:p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl sm:text-3xl font-bold text-purple-700">{porStatus.active + porStatus.trialing}</div>
                    <p className="text-sm text-gray-600">Aplicativo</p>
                    <p className="text-xs text-gray-400">Via Stripe</p>
                  </div>
                  <div className="text-center p-2 sm:p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl sm:text-3xl font-bold text-orange-600">{doadoresExternosData?.totalDoadores || 0}</div>
                    <p className="text-sm text-gray-600">Externos</p>
                    <p className="text-xs text-gray-400">Fora do app</p>
                  </div>
                  <div className="text-center p-2 sm:p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl sm:text-3xl font-bold text-green-700">{(porStatus.active + porStatus.trialing) + (doadoresExternosData?.totalDoadores || 0)}</div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-xs text-gray-400">Combinado</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status de Doações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Status de Doações do Aplicativo - {anoDoador}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 md:gap-4">
                  <div className="text-center p-2 sm:p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600">{porStatus.active + porStatus.trialing}</div>
                    <p className="text-sm text-gray-600">Ativas</p>
                    <p className="text-xs text-gray-400">Pagando normalmente</p>
                  </div>
                  <div className="text-center p-2 sm:p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl sm:text-3xl font-bold text-yellow-600">{porStatus.past_due}</div>
                    <p className="text-sm text-gray-600">Pendentes</p>
                    <p className="text-xs text-gray-400">Pagamento atrasado</p>
                  </div>
                  <div className="text-center p-2 sm:p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl sm:text-3xl font-bold text-red-600">{porStatus.canceled}</div>
                    <p className="text-sm text-gray-600">Cancelados</p>
                    <p className="text-xs text-gray-400">Cancelados em {anoDoador}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gráficos: Distribuição por Plano separados por status */}
            <div
              ref={pizzaRef}
              className="flex lg:grid lg:grid-cols-3 gap-4 overflow-x-auto snap-x snap-mandatory pb-2 lg:pb-0 lg:overflow-visible select-none cursor-grab"
              onMouseDown={(e) => {
                const el = pizzaRef.current; if (!el) return;
                pizzaDrag.current = { active: true, startX: e.clientX, scrollLeft: el.scrollLeft };
                el.style.scrollSnapType = 'none';
                el.style.cursor = 'grabbing';
              }}
              onMouseMove={(e) => {
                const d = pizzaDrag.current; const el = pizzaRef.current;
                if (!d.active || !el) return;
                e.preventDefault();
                el.scrollLeft = d.scrollLeft - (e.clientX - d.startX) * 1.5;
              }}
              onMouseUp={() => {
                const el = pizzaRef.current;
                if (el) { el.style.scrollSnapType = ''; el.style.cursor = ''; }
                pizzaDrag.current.active = false;
              }}
              onMouseLeave={() => {
                const el = pizzaRef.current;
                if (el) { el.style.scrollSnapType = ''; el.style.cursor = ''; }
                pizzaDrag.current.active = false;
              }}
            >
              {/* Ativos */}
              <Card className="min-w-[82vw] lg:min-w-0 snap-start flex-shrink-0 lg:flex-shrink">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <PieChart className="w-4 h-4 text-green-600" />
                    Ativos ({porPlanoAtivos.reduce((a: number, p: any) => a + p.quantidade, 0)})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {porPlanoAtivos.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <RechartsPieChart>
                        <Pie
                          data={porPlanoAtivos}
                          cx="50%"
                          cy="40%"
                          labelLine={false}
                          label={({ quantidade }: any) => quantidade}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="quantidade"
                          nameKey="plano"
                        >
                          {porPlanoAtivos.map((_: any, index: number) => (
                            <Cell key={`cell-a-${index}`} fill={CORES_PLANO[index % CORES_PLANO.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any, _: string, props: any) => [
                          `${value} doadores (R$ ${props.payload.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'})`,
                          props.payload.plano
                        ]} />
                        <Legend formatter={(value: string, entry: any) => `${value}: ${entry.payload?.quantidade || 0}`} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">
                      Nenhum doador ativo
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pendentes */}
              <Card className="min-w-[82vw] lg:min-w-0 snap-start flex-shrink-0 lg:flex-shrink">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <PieChart className="w-4 h-4 text-yellow-600" />
                    Pendentes ({porPlanoPendentes.reduce((a: number, p: any) => a + p.quantidade, 0)})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {porPlanoPendentes.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <RechartsPieChart>
                        <Pie
                          data={porPlanoPendentes}
                          cx="50%"
                          cy="40%"
                          labelLine={false}
                          label={({ quantidade }: any) => quantidade}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="quantidade"
                          nameKey="plano"
                        >
                          {porPlanoPendentes.map((_: any, index: number) => (
                            <Cell key={`cell-p-${index}`} fill={['#f59e0b', '#ef4444', '#6366f1', '#ec4899'][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any, _: string, props: any) => [
                          `${value} doadores (R$ ${props.payload.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'})`,
                          props.payload.plano
                        ]} />
                        <Legend formatter={(value: string, entry: any) => `${value}: ${entry.payload?.quantidade || 0}`} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">
                      Nenhum pagamento pendente
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cancelados */}
              <Card className="min-w-[82vw] lg:min-w-0 snap-start flex-shrink-0 lg:flex-shrink">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <PieChart className="w-4 h-4 text-red-600" />
                    Cancelados ({porPlanoCancelados.reduce((a: number, p: any) => a + p.quantidade, 0)})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {porPlanoCancelados.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <RechartsPieChart>
                        <Pie
                          data={porPlanoCancelados}
                          cx="50%"
                          cy="40%"
                          labelLine={false}
                          label={({ quantidade }: any) => quantidade}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="quantidade"
                          nameKey="plano"
                        >
                          {porPlanoCancelados.map((_: any, index: number) => (
                            <Cell key={`cell-c-${index}`} fill={['#ef4444', '#f97316', '#a855f7', '#64748b'][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any, _: string, props: any) => [
                          `${value} doadores (R$ ${props.payload.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'})`,
                          props.payload.plano
                        ]} />
                        <Legend formatter={(value: string, entry: any) => `${value}: ${entry.payload?.quantidade || 0}`} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">
                      Nenhum cancelamento
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Evolução Mensal de Adesões */}
            <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Evolução Mensal de Adesões
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {evolucaoMensal.length > 0 ? (
                    <div style={{ overflowX: 'scroll', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }} className="-mx-2 px-2 pb-1">
                      <div style={{ minWidth: 380 }}>
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={evolucaoMensal} margin={{ right: 16 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip
                            formatter={(value: any, name: string) => {
                              if (name === "Valor Mensal (R$)") {
                                return `R$ ${parseFloat(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
                              }
                              return value;
                            }}
                          />
                          <Legend />
                          <Bar yAxisId="left" dataKey="novosDoadores" fill="#f59e0b" name="Novos Doadores" />
                          <Line yAxisId="right" type="monotone" dataKey="acumuladoDoadores" stroke="#3b82f6" strokeWidth={2} name="Acumulado" />
                        </ComposedChart>
                      </ResponsiveContainer>
                      </div>
                    </div>
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
                {distribuicaoPorValor.length > 0 ? (
                  <div style={{ overflowX: 'scroll', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }} className="-mx-2 px-2 pb-1">
                    <div style={{ minWidth: 340 }}>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={distribuicaoPorValor} margin={{ right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="faixa" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="quantidade" fill="#6366f1" name="Doadores" />
                      </BarChart>
                    </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[250px] text-gray-400">
                    Carregando dados...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lista Individual de Doadores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 flex-wrap">
                  <Users className="w-5 h-5 text-blue-600" />
                  Lista de Doadores Aplicativo - Dados em Tempo Real do Stripe
                  <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {(() => {
                      const filtrado = listaDoadores.filter((d: any) =>
                        !searchDoadorTerm ||
                        d.nome?.toLowerCase().includes(searchDoadorTerm.toLowerCase()) ||
                        d.plano?.toLowerCase().includes(searchDoadorTerm.toLowerCase())
                      ).length;
                      return searchDoadorTerm
                        ? `${filtrado} de ${listaDoadores.length}`
                        : listaDoadores.length;
                    })()}
                  </span>
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
                      value={searchDoadorTerm}
                      onChange={(e) => setSearchDoadorTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      data-testid="input-search-doadores"
                    />
                  </div>
                </div>
                <div style={{ overflowX: "scroll", WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }} className="-mx-2 px-2 pb-1">
                  <table className="w-full min-w-[480px]">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Valor/mês</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Plano</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Periodicidade</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Adesão</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Cancelamento</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Dias</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listaDoadores
                        .filter((doador: any) => 
                          !searchDoadorTerm || 
                          doador.nome?.toLowerCase().includes(searchDoadorTerm.toLowerCase()) ||
                          doador.plano?.toLowerCase().includes(searchDoadorTerm.toLowerCase())
                        )
                        .sort((a: any, b: any) => {
                          const statusOrder: Record<string, number> = { active: 0, trialing: 1, past_due: 2, canceled: 3 };
                          const statusDiff = (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4);
                          if (statusDiff !== 0) return statusDiff;
                          return (b.valor || 0) - (a.valor || 0);
                        })
                        .map((doador: any, index: number) => (
                          <tr key={doador.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-gray-800">{doador.nome}</td>
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
                            <td className="py-3 px-4 text-center text-gray-600">{doador.periodicidade || "Mensal"}
                            </td>
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
                            <td className="py-3 px-4 text-center text-gray-600">{doador.dataAdesao}</td>
                            <td className="py-3 px-4 text-center text-gray-600">
                              {doador.dataCancelamento ? (
                                <span className="text-red-500">{doador.dataCancelamento}</span>
                              ) : '-'}
                            </td>
                            <td className="py-3 px-4 text-center text-gray-600">{doador.diasComoDoador}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {listaDoadores.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      Carregando doadores do Stripe...
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 text-center mt-1 md:hidden">← arraste para ver mais →</p>
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
                <div style={{ overflowX: "scroll", WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }} className="-mx-2 px-2 pb-1">
                  <table className="w-full min-w-[480px]">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Observação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(doadoresExternosData?.doadores || [])
                        .map((doador: any, index: number) => (
                          <tr key={doador.id || index} className={`border-b border-gray-100 hover:bg-gray-50 ${doador.observacao === 'DOADOR ANJO' ? 'bg-yellow-50' : ''}`}>
                            <td className="py-3 px-4 text-gray-800">
                              {doador.nome}
                            </td>
                            <td className="py-3 px-4 text-center text-gray-600">
                              {doador.observacao === 'DOADOR ANJO' ? (
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-yellow-400 text-yellow-900">
                                  ✨ ANJO
                                </span>
                              ) : (doador.observacao || '-')}
                            </td>
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
                <p className="text-xs text-gray-400 text-center mt-1 md:hidden">← arraste para ver mais →</p>
              </CardContent>
            </Card>
          </div>
        );
      case "patrocinador":
        return (
          <div className="space-y-6">
            {/* Seletor de Ano */}
            <div className="flex justify-end items-center gap-2 mb-4">
              <button
                onClick={() => setPrivacyPatrocinadores(!privacyPatrocinadores)}
                className={`p-2 rounded-full border transition-colors ${privacyPatrocinadores ? 'bg-gray-200 border-gray-400 text-gray-600' : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600'}`}
                title={privacyPatrocinadores ? 'Mostrar valores' : 'Ocultar valores'}
              >
                {privacyPatrocinadores
                  ? <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
              <Button
                onClick={() => setAnoPatrocinador(2024)}
                variant={anoPatrocinador === 2024 ? "default" : "outline"}
                className={
                  anoPatrocinador === 2024
                    ? "bg-yellow-400 hover:bg-yellow-500 text-black"
                    : ""
                }
              >
                Patrocinadores 2024
              </Button>
              <Button
                onClick={() => setAnoPatrocinador(2025)}
                variant={anoPatrocinador === 2025 ? "default" : "outline"}
                className={
                  anoPatrocinador === 2025
                    ? "bg-yellow-400 hover:bg-yellow-500 text-black"
                    : ""
                }
              >
                Patrocinadores 2025
              </Button>
              <Button
                onClick={() => setAnoPatrocinador(2026)}
                variant={anoPatrocinador === 2026 ? "default" : "outline"}
                className={
                  anoPatrocinador === 2026
                    ? "bg-yellow-400 hover:bg-yellow-500 text-black"
                    : ""
                }
              >
                Patrocinadores 2026
              </Button>
            </div>

            {/* Patrocinador Header Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-yellow-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Patrocinadores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {estatisticasFiltradas.totalPatrocinadores}
                  </div>
                  <p className="text-xs text-gray-500">Parceiros cadastrados</p>
                </CardContent>
              </Card>
              
              <Card className="border-yellow-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Investimento Médio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {privacyPatrocinadores ? '---' : `R$ ${estatisticasFiltradas.totalPatrocinadores > 0 
                      ? (estatisticasFiltradas.investimentoTotal / estatisticasFiltradas.totalPatrocinadores).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : '0,00'}`}
                  </div>
                  <p className="text-xs text-gray-500">--</p>
                </CardContent>
              </Card>
              
              <Card className="border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Investimento Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {privacyPatrocinadores ? '---' : `R$ ${estatisticasFiltradas.investimentoTotal.toLocaleString('pt-BR')}`}
                  </div>
                  <p className="text-xs text-gray-500">--</p>
                </CardContent>
              </Card>
              
              <Card className="border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Contratos Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {estatisticasFiltradas.contratosAtivos}%
                  </div>
                  <p className="text-xs text-gray-500">--</p>
                </CardContent>
              </Card>
            </div>

            {/* Patrocinador Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Investment by Category */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Investimento por Setor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    key="patrocinador-investimento-chart"
                    style={{ width: "100%", height: "300px" }}
                  >
                    {typeof window !== "undefined" &&
                      (() => {
                        // Agrupar patrocinadores por categoria/setor
                        const investimentoPorSetor =
                          patrocinadoresFiltrados.reduce((acc: any, p: any) => {
                            const categoria =
                              p.categoria.charAt(0).toUpperCase() +
                              p.categoria.slice(1);
                            if (!acc[categoria]) {
                              acc[categoria] = 0;
                            }
                            acc[categoria] += parseFloat(
                              p.valorPatrocinio || 0
                            );
                            return acc;
                          }, {});

                        const setorData = Object.entries(investimentoPorSetor)
                          .map(([setor, valor]) => ({ setor, valor: privacyPatrocinadores ? 0 : valor }))
                          .sort((a: any, b: any) => {
                            const ordem: any = {
                              Oficial: 1,
                              Diamante: 2,
                              Master: 3,
                              Gold: 4,
                              Silver: 5,
                              Bronze: 6,
                            };
                            return (
                              (ordem[a.setor] || 99) - (ordem[b.setor] || 99)
                            );
                          });

                        return (
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={setorData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="setor" />
                              <YAxis />
                              <Tooltip
                                formatter={(value: any) =>
                                  `R$ ${parseFloat(value).toLocaleString(
                                    "pt-BR",
                                    { minimumFractionDigits: 2 }
                                  )}`
                                }
                              />
                              <Bar dataKey="valor" fill="#3b82f6" />
                            </BarChart>
                          </ResponsiveContainer>
                        );
                      })()}
                  </div>
                </CardContent>
              </Card>

              {/* Contract Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Status dos Contratos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {typeof window !== "undefined" &&
                    (() => {
                      // Calcular status dos contratos baseado nos patrocinadores filtrados
                      const contratosAtivos = patrocinadoresFiltrados.filter(
                        (p: any) => p.status === "ativo" && p.contratosAtivos
                      ).length;
                      const contratosRenovacao = patrocinadoresFiltrados.filter(
                        (p: any) => p.status === "renovacao"
                      ).length;
                      const contratosPendentes = patrocinadoresFiltrados.filter(
                        (p: any) => p.status === "pendente"
                      ).length;
                      const contratosCancelados =
                        patrocinadoresFiltrados.filter(
                          (p: any) =>
                            p.status === "cancelado" || p.status === "inativo"
                        ).length;

                      const statusData = [
                        {
                          status: "Ativos",
                          quantidade: privacyPatrocinadores ? 0 : contratosAtivos,
                          fill: "#10b981",
                        },
                        {
                          status: "Renovação",
                          quantidade: privacyPatrocinadores ? 0 : contratosRenovacao,
                          fill: "#3b82f6",
                        },
                        {
                          status: "Pendentes",
                          quantidade: privacyPatrocinadores ? 0 : contratosPendentes,
                          fill: "#f59e0b",
                        },
                        {
                          status: "Cancelados",
                          quantidade: privacyPatrocinadores ? 0 : contratosCancelados,
                          fill: "#ef4444",
                        },
                      ].filter((item) => item.quantidade > 0 || privacyPatrocinadores);

                      return (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={statusData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis
                              dataKey="status"
                              type="category"
                              width={100}
                            />
                            <Tooltip
                              formatter={(value: any) => [
                                `${value} contratos`,
                                "Quantidade",
                              ]}
                            />
                            <Bar dataKey="quantidade" radius={[0, 8, 8, 0]}>
                              {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      );
                    })()}
                </CardContent>
              </Card>
            </div>

            {/* Lista de Patrocinadores em Tabela */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Patrocinadores {anoPatrocinador}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ overflowX: "scroll", WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }} className="-mx-2 px-2 pb-1">
                  <table className="w-full min-w-[520px]">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Nome
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">
                          Cota
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">
                          Tipo
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {patrocinadoresFiltrados
                        .sort((a: any, b: any) => {
                          // Ordenar por categoria
                          const categoriaOrder: any = {
                            oficial: 1,
                            diamante: 2,
                            master: 3,
                            gold: 4,
                            silver: 5,
                            bronze: 6,
                          };
                          return (
                            categoriaOrder[a.categoria] -
                            categoriaOrder[b.categoria]
                          );
                        })
                        .map((patrocinador: any, index: number) => {
                          // Cores por categoria
                          const categoriaColors: any = {
                            oficial: "bg-yellow-100 text-yellow-700",
                            diamante: "bg-blue-100 text-blue-700",
                            master: "bg-purple-100 text-purple-700",
                            gold: "bg-amber-100 text-amber-700",
                            silver: "bg-gray-100 text-gray-700",
                            bronze: "bg-orange-100 text-orange-700",
                          };

                          return (
                            <tr
                              key={index}
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="py-3 px-4 text-gray-800">
                                {patrocinador.nome}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                    categoriaColors[patrocinador.categoria] ||
                                    "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {patrocinador.categoria
                                    .charAt(0)
                                    .toUpperCase() +
                                    patrocinador.categoria.slice(1)}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`inline-block px-3 py-1 rounded-full text-sm ${
                                    patrocinador.tipo === "empresa"
                                      ? "bg-green-100 text-green-700"
                                      : patrocinador.tipo === "anonimo"
                                      ? "bg-gray-100 text-gray-500"
                                      : "bg-indigo-100 text-indigo-700"
                                  }`}
                                >
                                  {patrocinador.tipo === "empresa"
                                    ? "Empresa"
                                    : patrocinador.tipo === "anonimo"
                                    ? "Anônimo"
                                    : "Pessoa Física"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400 text-center mt-1 md:hidden">← arraste para ver mais →</p>
              </CardContent>
            </Card>
          </div>
        );
      case "marketing":
        const is2026Mkt = anoIndicadores >= 2026;
        const META_ANUAL_SEGUIDORES_2026 = 15000;
        const SEGUIDORES_ATUAL_2026 = 11456;
        const SEGUIDORES_A_GANHAR_2026 = META_ANUAL_SEGUIDORES_2026 - SEGUIDORES_ATUAL_2026;
        const META_MENSAL_SEGUIDORES_2026 = Math.ceil(SEGUIDORES_A_GANHAR_2026 / 12);
        const META_ANUAL_PERDIDOS_2026 = 1500;
        const META_MENSAL_PERDIDOS_2026 = Math.ceil(META_ANUAL_PERDIDOS_2026 / 12);
        const META_ANUAL_MATERIAIS_2026 = 6000;
        const META_MENSAL_MATERIAIS_2026 = Math.ceil(META_ANUAL_MATERIAIS_2026 / 12);

        const mktRef = indMktData?.data;
        const segMensalRows = seguidoresMensalData?.data || [];
        const segMensalByMes: Record<string, { ganhos: number; perdidos: number; total: number; materiais: number; doadores: number }> = {};
        for (const row of segMensalRows) {
          segMensalByMes[String(row.mes)] = {
            ganhos: row.seguidores_ganhos,
            perdidos: row.seguidores_perdidos,
            total: row.total_seguidores,
            materiais: row.materiais_distribuidos,
            doadores: row.doadores_ativos || 0,
          };
        }

        const seguidoresGanhosAcumulado = segMensalRows.reduce((acc: number, r: any) => acc + r.seguidores_ganhos, 0);
        const seguidoresPerdidosAcumulado = segMensalRows.reduce((acc: number, r: any) => acc + r.seguidores_perdidos, 0);
        const materiaisAcumulado = segMensalRows.reduce((acc: number, r: any) => acc + r.materiais_distribuidos, 0);
        const ultimoMesTotal = segMensalRows.length > 0 ? segMensalRows[segMensalRows.length - 1].total_seguidores : SEGUIDORES_ATUAL_2026;

        const mesMktStr = mesSelecionadoMarketing === null ? 'todos' : String(mesSelecionadoMarketing);
        const mesDataMkt = segMensalByMes[mesMktStr];

        const mktSeguidoresGanhos = is2026Mkt
          ? (mesSelecionadoMarketing === null ? seguidoresGanhosAcumulado : (mesDataMkt?.ganhos ?? 0))
          : (mktRef?.seguidores_ganhos || 0);

        const metaSeguidoresGanhos2026 = is2026Mkt
          ? (mesSelecionadoMarketing === null ? SEGUIDORES_A_GANHAR_2026 : META_MENSAL_SEGUIDORES_2026)
          : (mktRef?.seguidores_ganhos_meta || 1);

        const mktSeguidoresPerdidos = is2026Mkt
          ? (mesSelecionadoMarketing === null ? seguidoresPerdidosAcumulado : (mesDataMkt?.perdidos ?? 0))
          : (mktRef?.seguidores_perdidos || 0);

        const metaSeguidoresPerdidos2026 = is2026Mkt
          ? (mesSelecionadoMarketing === null ? META_ANUAL_PERDIDOS_2026 : META_MENSAL_PERDIDOS_2026)
          : (mktRef?.seguidores_perdidos_meta || 1);

        const mktTotalSeguidores = is2026Mkt
          ? (mesSelecionadoMarketing === null ? ultimoMesTotal : (mesDataMkt?.total ?? ultimoMesTotal))
          : (mktRef?.total_seguidores || 11401);

        const mktMateriaisDistribuidos = is2026Mkt
          ? (mesSelecionadoMarketing === null ? materiaisAcumulado : (mesDataMkt?.materiais ?? 0))
          : (mktRef?.materiais_distribuidos || 0);

        const metaMateriaisDistribuidos2026 = is2026Mkt
          ? (mesSelecionadoMarketing === null ? META_ANUAL_MATERIAIS_2026 : META_MENSAL_MATERIAIS_2026)
          : (mktRef?.materiais_distribuidos_meta || 1);

        const doadoresAtivosVal = (doadoresStatsData?.porStatus?.active || 0) + (doadoresStatsData?.porStatus?.trialing || 0);
        const doadoresUltimoMes = segMensalRows.length > 0 ? (segMensalRows[segMensalRows.length - 1].doadores_ativos || 0) : 0;
        const mktDoadoresAtivos = is2026Mkt
          ? (mesSelecionadoMarketing === null ? doadoresUltimoMes : (mesDataMkt?.doadores ?? doadoresUltimoMes))
          : doadoresAtivosVal;
        const metaDoadores = 1000;
        const mktDoadoresEvadidos = doadoresStatsData?.porStatus?.canceled || 0;


        const MESES_MKT = [
          { value: "todos", label: "Todos os Meses" },
          { value: "1", label: "Janeiro" },
          { value: "2", label: "Fevereiro" },
          { value: "3", label: "Março" },
          { value: "4", label: "Abril" },
          { value: "5", label: "Maio" },
          { value: "6", label: "Junho" },
          { value: "7", label: "Julho" },
          { value: "8", label: "Agosto" },
          { value: "9", label: "Setembro" },
          { value: "10", label: "Outubro" },
          { value: "11", label: "Novembro" },
          { value: "12", label: "Dezembro" },
        ];

        return (
          <div className="space-y-6" key="marketing-section">
            {/* Seletores */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Ano:</span>
                <Button
                  size="sm"
                  variant={anoIndicadores === 2025 ? "default" : "outline"}
                  className={anoIndicadores === 2025 ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                  onClick={() => setAnoIndicadores(2025)}
                >
                  2025
                </Button>
                <Button
                  size="sm"
                  variant={anoIndicadores === 2026 ? "default" : "outline"}
                  className={anoIndicadores === 2026 ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                  onClick={() => setAnoIndicadores(2026)}
                >
                  2026
                </Button>
              </div>

            </div>

            {/* 2026: accordion cards; 2025: gauge charts */}
            {is2026Mkt ? (
            <div className="space-y-4">
              <p className="text-base font-semibold text-gray-900">Resultados Anuais por Segmento</p>
              {/* Card Doadores */}
              <div
                className="bg-yellow-50 rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl"
                onClick={() => setExpandedMktCard(expandedMktCard === 'doadores' ? null : 'doadores')}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                        <Heart className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800">Doadores</h3>
                    </div>
                    {expandedMktCard === 'doadores'
                      ? <ChevronUp className="w-5 h-5 text-gray-600" />
                      : <ChevronDown className="w-5 h-5 text-gray-600" />}
                  </div>
                  {expandedMktCard === 'doadores' && (
                    <div className="mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1">
                            {mktDoadoresAtivos.toLocaleString('pt-BR')}
                          </div>
                          <p className="text-xs text-gray-700 font-medium">Doadores Ativos</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1">
                            {mktDoadoresEvadidos.toLocaleString('pt-BR')}
                          </div>
                          <p className="text-xs text-gray-700 font-medium">Doadores Evadidos</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Seguidores */}
              <div
                className="bg-yellow-50 rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl"
                onClick={() => setExpandedMktCard(expandedMktCard === 'seguidores' ? null : 'seguidores')}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800">Seguidores</h3>
                    </div>
                    {expandedMktCard === 'seguidores'
                      ? <ChevronUp className="w-5 h-5 text-gray-600" />
                      : <ChevronDown className="w-5 h-5 text-gray-600" />}
                  </div>
                  {expandedMktCard === 'seguidores' && (
                    <div className="mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm col-span-2">
                          <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1">
                            {mktTotalSeguidores.toLocaleString('pt-BR')}
                          </div>
                          <p className="text-xs text-gray-700 font-medium">Total de Seguidores</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1">
                            {mktSeguidoresGanhos.toLocaleString('pt-BR')}
                          </div>
                          <p className="text-xs text-gray-700 font-medium">Seguidores Ganhos</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1">
                            {mktSeguidoresPerdidos.toLocaleString('pt-BR')}
                          </div>
                          <p className="text-xs text-gray-700 font-medium">Seguidores Perdidos</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            ) : (
              <div className="bg-white rounded-xl p-3 lg:p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 lg:gap-3 mb-3 lg:mb-4 flex-wrap">
                  <div className="p-2 lg:p-3 bg-pink-500 rounded-xl">
                    <Target className="w-4 h-4 lg:w-7 lg:h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-bold text-sm lg:text-xl">Marketing e Tecnologia</p>
                    <p className="text-gray-500 text-[10px] lg:text-sm">Indicadores de Crescimento - {anoIndicadores}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-[10px] lg:text-sm">Total Seguidores</p>
                    <p className="text-lg lg:text-3xl font-bold text-gray-900">{mktTotalSeguidores.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
                  <AdminGaugeChart
                    value={mktSeguidoresGanhos}
                    meta={mktRef?.seguidores_ganhos_meta || 1}
                    label="Seguidores Ganhos"
                  />
                  <AdminGaugeChart
                    value={mktSeguidoresPerdidos}
                    meta={mktRef?.seguidores_perdidos_meta || 1}
                    label="Seguidores Perdidos"
                    isInverse={true}
                  />
                  <AdminGaugeChart
                    value={mktDoadoresAtivos}
                    meta={metaDoadores}
                    label="Doadores Ativos"
                  />
                  <AdminGaugeChart
                    value={mktMateriaisDistribuidos}
                    meta={mktRef?.materiais_distribuidos_meta || 1}
                    label="Materiais Distribuídos"
                  />
                </div>
              </div>
            )}

          </div>
        );
      case "conselho":
        return (
          <div className="space-y-6">
            <ConselhoApprovalManager approverName={userName} />
          </div>
        );
      case "solicitacoes-exclusao":
        return <SolicitacoesExclusaoPanel />;
      case "chamadas-auditoria":
        return <ChamadaAuditoriaSection />;
      case "lgpd-consentimentos":
        return <PrivacyConsentsAuditSection active />;
      case "lgpd-ropa":
        return <AdminRopaSection />;
      case "settings":
        return (
          <div className="space-y-6">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-600" />
                  Configurações de Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Change Name */}
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <div className="flex space-x-3">
                    <Input
                      id="nome"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      placeholder="Digite seu nome completo"
                      className="flex-1"
                    />
                    <Button
                      onClick={handleUpdateName}
                      disabled={!tempName.trim() || tempName === userName}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                </div>

                {/* Change Phone */}
                <div className="space-y-2">
                  <Label htmlFor="telefone">Número de Telefone</Label>
                  <div className="flex space-x-3">
                    <Input
                      id="telefone"
                      value={tempPhone}
                      onChange={(e) => setTempPhone(e.target.value)}
                      placeholder="Digite seu telefone"
                      className="flex-1"
                    />
                    <Button
                      onClick={handleUpdatePhone}
                      disabled={
                        !tempPhone.trim() ||
                        tempPhone === localStorage.getItem("userTelefone")
                      }
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <PushNotificationSettings variant="card" />

            {/* Navigation Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Links Rápidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    onClick={() =>
                      window.open(
                        "https://clubedogrito.institutoogrito.com.br/noticias",
                        "_blank"
                      )
                    }
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Ver de Notícias
                  </Button>
                  <Button
                    onClick={() =>
                      window.open(
                        "https://canaldetransparencia.institutoogrito.com.br",
                        "_blank"
                      )
                    }
                    variant="outline"
                    className="w-full justify-start bg-yellow-400 text-black hover:bg-yellow-500 border-yellow-400"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Canal de Transparência
                  </Button>
                  <Button
                    onClick={() => setActiveSection("lgpd-consentimentos")}
                    variant="outline"
                    className="w-full justify-start border-indigo-300 text-indigo-900 hover:bg-indigo-50"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Auditoria de Consentimentos (LGPD)
                  </Button>
                  <Button
                    onClick={() => setActiveSection("lgpd-ropa")}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    ROPA — Registro de Tratamento
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Logout Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogOut className="w-5 h-5 text-gray-600" />
                  Sessão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      case "colaborador":
        return <ColaboradoresSection mesSelecionado={mesSelecionadoDashboard} />;
      case "favela3d":
        return (
          <div className="space-y-6">
            {/* Seletor de Ano */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Ano:</span>
              <Button
                size="sm"
                variant={anoFavela3D === 2025 ? "default" : "outline"}
                className={anoFavela3D === 2025 ? "bg-purple-600 hover:bg-purple-700" : ""}
                onClick={() => setAnoFavela3D(2025)}
              >2025</Button>
              <Button
                size="sm"
                variant={anoFavela3D === 2026 ? "default" : "outline"}
                className={anoFavela3D === 2026 ? "bg-purple-600 hover:bg-purple-700" : ""}
                onClick={() => setAnoFavela3D(2026)}
              >2026</Button>
            </div>

            {anoFavela3D === 2026 ? (
              <div className="space-y-4">
                {/* Panorama Favela 3D — accordion card */}
                <div
                  className="bg-purple-50 rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl"
                  onClick={() => setExpandedF3DSection(expandedF3DSection === 'panorama' ? null : 'panorama')}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Panorama Favela 3D</h3>
                      </div>
                      {expandedF3DSection === 'panorama' ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
                    </div>
                    {expandedF3DSection === 'panorama' && (
                      <div className="mt-4 grid grid-cols-1 gap-3">
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-2xl font-bold text-purple-600">{f3dFamiliasLeo.toLocaleString('pt-BR')}</div>
                          <p className="text-xs text-gray-700 font-medium">Famílias</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Atendimentos Coletivos — accordion card */}
                <div
                  className="bg-purple-50 rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl"
                  onClick={() => setExpandedF3DSection(expandedF3DSection === 'coletivos' ? null : 'coletivos')}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Atendimentos Coletivos</h3>
                      </div>
                      {expandedF3DSection === 'coletivos' ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
                    </div>
                    {expandedF3DSection === 'coletivos' && (
                      <div className="mt-4 space-y-3">
                        <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Gerando Liderança</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <div className="text-2xl font-bold text-purple-600">{f3dGerandoLiderAno.registros.toLocaleString('pt-BR')}</div>
                            <p className="text-xs text-gray-700 font-medium">Registros</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <div className="text-2xl font-bold text-purple-600">{f3dGerandoLiderAno.pessoas.toLocaleString('pt-BR')}</div>
                            <p className="text-xs text-gray-700 font-medium">Pessoas</p>
                          </div>
                        </div>
                        <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Assembleia</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <div className="text-2xl font-bold text-purple-600">{f3dAssembleiaAno.registros.toLocaleString('pt-BR')}</div>
                            <p className="text-xs text-gray-700 font-medium">Registros</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <div className="text-2xl font-bold text-purple-600">{f3dAssembleiaAno.pessoas.toLocaleString('pt-BR')}</div>
                            <p className="text-xs text-gray-700 font-medium">Pessoas</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : !dadosMensaisFavela3D ? (
              <div className="text-center py-8 text-gray-500">Carregando dados do Favela 3D...</div>
            ) : dadosMensaisFavela3D?.eixos ? (
              dadosMensaisFavela3D.eixos.map((eixo: any, index: number) => {
                const isExpanded = expandedF3DSection === eixo.nome;
                const eixoIcons: Record<string, any> = {
                  'Decolagem': <Rocket className="w-5 h-5 text-white" />,
                  'Desenvolvimento Social': <Users className="w-5 h-5 text-white" />,
                  'Moradia e Urbanismo': <Building className="w-5 h-5 text-white" />,
                };

                return (
                  <div
                    key={eixo.nome}
                    className="bg-purple-50 rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl"
                    onClick={() => setExpandedF3DSection(isExpanded ? null : eixo.nome)}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                            {eixoIcons[eixo.nome] || <TrendingUp className="w-5 h-5 text-white" />}
                          </div>
                          <h3 className="text-lg font-bold text-gray-800">{eixo.nome}</h3>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>

                      {isExpanded && (
                        <div className="mt-4">
                          <div className={`grid gap-3 ${eixo.indicadores.length === 1 ? 'grid-cols-1 max-w-[200px] mx-auto' : 'grid-cols-2'}`}>
                            {eixo.indicadores.map((indicador: any, idx: number) => (
                              <div key={idx} className="bg-white rounded-lg p-3 text-center shadow-sm">
                                <div className="text-2xl font-bold text-purple-600 mb-1">
                                  {(indicador.valor ?? 0).toLocaleString('pt-BR')}
                                </div>
                                <p className="text-xs text-gray-700 font-medium">{indicador.nome}</p>
                                {indicador.impacto > 0 && (
                                  <p className="text-xs text-green-600 mt-1">Pessoas Impactadas: {indicador.impacto.toLocaleString('pt-BR')}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">Nenhum dado disponível</div>
            )}
          </div>
        );
      case "inclusao": {
        if (anoIndicadores === 2025 && !indicadoresData) {
          return (
            <div className="p-6">Carregando dados de Inclusão Produtiva...</div>
          );
        }
        
        const inclusaoProjetoCores: { [key: string]: { bg: string; border: string; text: string; icon: string } } = {
          "LAB. VOZES DO FUTURO": { bg: "bg-green-50", border: "border-l-green-500", text: "text-green-600", icon: "bg-green-500" },
          "CURSOS PRESENCIAIS": { bg: "bg-green-50", border: "border-l-emerald-500", text: "text-emerald-600", icon: "bg-emerald-500" },
          "CURSOS EAD CGD": { bg: "bg-green-50", border: "border-l-teal-500", text: "text-teal-600", icon: "bg-teal-500" }
        };
        
        const getInclusaoIndicador = (projetoNome: string, indicadorNome: string) => {
          const projeto = indicadoresData?.projetos?.find((p: any) => p.nome === projetoNome);
          const indicador = projeto?.indicadores?.find((i: any) => i.nome === indicadorNome);
          return indicador?.valor || 0;
        };
        
        const totalAtendidosInclusao = indicadoresData?.projetos?.reduce((acc: number, p: any) => {
          const atendidos = p.indicadores?.find((i: any) => i.nome === "Atendidos");
          return acc + (atendidos?.valor || 0);
        }, 0) || 0;
        
        const totalHorasAulaInclusao = indicadoresData?.projetos?.reduce((acc: number, p: any) => {
          const horaAula = p.indicadores?.find((i: any) => i.nome === "Hora Aula");
          return acc + (horaAula?.valor || 0);
        }, 0) || 0;
        
        const totalEmpregados = indicadoresData?.projetos?.reduce((acc: number, p: any) => {
          const empregados = p.indicadores?.find((i: any) => i.nome === "Empregados");
          return acc + (empregados?.valor || 0);
        }, 0) || 0;
        
        const totalEmpreendedores = indicadoresData?.projetos?.reduce((acc: number, p: any) => {
          const empreendedores = p.indicadores?.find((i: any) => i.nome === "Empreendedores");
          return acc + (empreendedores?.valor || 0);
        }, 0) || 0;
        
        return (
          <div className="space-y-6" style={{ width: '100%', overflow: 'hidden' }}>

            {anoIndicadores === 2026 ? (
              (() => {
                if (!indicadoresData) {
                  return <div className="text-center py-8 text-gray-500">Carregando dados...</div>;
                }
                const projetos2026 = indicadoresData?.projetos || [];
                const geracaoRenda2026 = indicadoresData?.geracaoRenda || { empregados: 0, empreendedores: 0 };
                const npsGeral2026 = indicadoresData?.npsGeral ?? 0;

                const projetoConfig: Record<string, { icon: any; iconColor: string; bgColor: string; textColor: string }> = {
                  "LAB. VOZES DO FUTURO": { icon: <Briefcase className="w-5 h-5 text-white" />, iconColor: "bg-yellow-500", bgColor: "bg-yellow-50", textColor: "text-gray-900" },
                  "CURSOS PRESENCIAIS": { icon: <GraduationCap className="w-5 h-5 text-white" />, iconColor: "bg-yellow-500", bgColor: "bg-yellow-50", textColor: "text-gray-900" },
                  "CURSOS EAD CGD": { icon: <Target className="w-5 h-5 text-white" />, iconColor: "bg-yellow-500", bgColor: "bg-yellow-50", textColor: "text-gray-900" },
                };

                const npsColor = (nps: number) =>
                  nps >= 75 ? "text-green-600" : nps >= 50 ? "text-yellow-600" : nps >= 0 ? "text-orange-600" : "text-red-600";

                const indicadorLabel: Record<string, string> = {
                  "Hora Aula": "Horas/Aula", "Atendimentos": "Atendimentos", "Lanche": "Lanches",
                  "Frequência": "Frequência", "Atendidos": "Atendidos", "Evasão": "Evasão",
                };

                // ── Cálculo de metas (igual ao TabInclusao) ──────────────────────
                const indKpi      = gvKpiInclusao?.indicadores || {};
                const resumoKpi   = resumoKpiInclusao || gvKpiInclusao?.inclusaoData || {};
                const metasDB     = metasKpiInclusao?.metas || {};
                const mesAtualKpi = new Date().getMonth() + 1;
                const mesNumRawKpi = Number(kpiInclusaoMes);
                const mesNumKpi = (!kpiInclusaoMes || kpiInclusaoMes === 'todos' || isNaN(mesNumRawKpi) || mesNumRawKpi === 0)
                  ? Math.max(0, mesAtualKpi - 1) : 1;

                const META_EMP   = metasDB.pessoasEmpregadas ?? 1000;
                const META_EMPR  = metasDB.empreendedores ?? 500;
                const metaFormadosAnualKpi    = metasDB.alunosFormados ?? 2000;
                const metaFrequenciaKpi       = metasDB.frequencia     ?? 85;
                const metaEvasaoKpi           = metasDB.evasao         ?? 10;
                const metaEmpProrated         = mesNumKpi > 0 ? Math.round(META_EMP  * mesNumKpi / 11) : 0;
                const metaEmprProrated        = mesNumKpi > 0 ? Math.round(META_EMPR * mesNumKpi / 11) : 0;
                const metaFormadosProrated    = mesNumKpi > 0 ? Math.round(metaFormadosAnualKpi * mesNumKpi / 11) : 0;

                const getPct = (v: number, m: number, inv = false) => {
                  if (!m) return 0;
                  return Math.round(inv ? Math.max(0, (m - v) / m * 100) : Math.min(v / m * 100, 999));
                };
                const getBarColor = (pct: number) =>
                  pct >= 85 ? '#16a34a' : pct >= 50 ? '#ca8a04' : '#dc2626';

                const kpisCarrossel = [
                  {
                    label: 'Pessoas Empregadas',
                    valor: indKpi.pessoasEmpregadas?.valor ?? 0,
                    meta: metaEmpProrated || undefined,
                    metaAnual: META_EMP,
                    format: 'number' as const,
                  },
                  {
                    label: 'Pessoas Empreendendo',
                    valor: indKpi.empreendedores?.valor ?? 0,
                    meta: metaEmprProrated || undefined,
                    metaAnual: META_EMPR,
                    format: 'number' as const,
                  },
                  {
                    label: 'Pessoas Formadas',
                    valor: indKpi.alunosFormados?.valor ?? 0,
                    meta: metaFormadosProrated || undefined,
                    metaAnual: metaFormadosAnualKpi,
                    format: 'number' as const,
                  },
                  {
                    label: 'Pessoas em Formação',
                    valor: indKpi.alunosEmFormacao?.valor ?? resumoKpi.alunosAtivos ?? 0,
                    format: 'number' as const,
                  },
                  {
                    label: 'Frequência',
                    valor: resumoKpi.frequencia ?? indKpi.frequencia?.valor ?? 0,
                    meta: metaFrequenciaKpi,
                    format: 'percent' as const,
                  },
                  {
                    label: 'Evasão',
                    valor: indKpi.evasao?.valor ?? 0,
                    meta: metaEvasaoKpi,
                    metaNote: undefined,
                    inverse: true,
                    format: 'percent' as const,
                  },
                  {
                    label: 'Horas Aula',
                    valor: Number((resumoKpi.horasAula ?? 0).toFixed(0)),
                    format: 'number' as const,
                  },
                  {
                    label: 'Atendimentos',
                    valor: resumoKpi.atendimentos ?? 0,
                    format: 'number' as const,
                  },
                  {
                    label: 'NPS',
                    valor: indKpi.nps?.valor ?? 0,
                    meta: indKpi.nps?.meta ?? 90,
                    format: 'number' as const,
                  },
                ];

                const MESES_ADMIN = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

                return (
                  <div className="space-y-4" style={{ width: '100%', minWidth: 0 }}>
                    {/* Seção: Metas & Resultados */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900">Metas & Resultados</h3>
                        <select
                          className="border rounded px-1 py-0.5 text-[10px] w-auto md:px-2 md:py-1 md:text-xs bg-white"
                          value={kpiInclusaoMes}
                          onChange={e => setKpiInclusaoMes(e.target.value)}
                        >
                          <option value="todos">Todos os meses</option>
                          {MESES_ADMIN.slice(2).map((m, i) => <option key={i+2} value={String(i+2)}>{m}</option>)}
                        </select>
                      </div>
                      <p className="text-xs text-gray-500">KPIs de 2026</p>
                    </div>

                    {/* Carrossel de KPIs — scroll horizontal sem barra visível */}
                    <style>{`.kpi-carousel::-webkit-scrollbar{display:none}`}</style>
                    <div
                      className="kpi-carousel"
                      style={{
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        width: '100%',
                        maxWidth: '100%',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        cursor: 'grab',
                        paddingBottom: '4px',
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const el = e.currentTarget;
                        el.style.cursor = 'grabbing';
                        const startX = e.clientX;
                        const startScroll = el.scrollLeft;
                        const onMove = (me: MouseEvent) => {
                          el.scrollLeft = startScroll - (me.clientX - startX);
                        };
                        const onUp = () => {
                          el.style.cursor = 'grab';
                          window.removeEventListener('mousemove', onMove);
                          window.removeEventListener('mouseup', onUp);
                        };
                        window.addEventListener('mousemove', onMove);
                        window.addEventListener('mouseup', onUp);
                      }}
                    >
                      <div style={{ display: 'flex', gap: '12px', width: 'max-content', padding: '2px 2px 2px 2px' }}>
                        {kpisCarrossel.map((kpi, idx) => (
                          <GestaoKpiCard
                            key={idx}
                            label={kpi.label}
                            valor={kpi.valor}
                            meta={kpi.meta}
                            inverse={kpi.inverse}
                            format={kpi.format}
                            metaAnual={kpi.metaAnual}
                            variant="light"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Seção: Resultados Anuais por Vertente */}
                    <div className="pt-2 border-t border-gray-200">
                      <h3 className="text-base font-bold text-gray-900 mb-3">Resultados Anuais por Projeto</h3>
                    </div>

                    {projetos2026.map((projeto: any) => {
                      const cfg = projetoConfig[projeto.nome] || { icon: <Briefcase className="w-5 h-5 text-white" />, iconColor: "bg-green-600", bgColor: "bg-green-50", textColor: "text-green-700" };
                      const isOpen = expandedInclusaoAdminCard === projeto.nome;
                      return (
                        <div
                          key={projeto.nome}
                          className={`${cfg.bgColor} rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl`}
                          onClick={() => setExpandedInclusaoAdminCard(isOpen ? null : projeto.nome)}
                        >
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 ${cfg.iconColor} rounded-xl flex items-center justify-center`}>
                                  {cfg.icon}
                                </div>
                                <h3 className="text-base font-bold text-gray-800">{projeto.nome}</h3>
                              </div>
                              <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                            </div>

                            {isOpen && (
                              <div className="mt-4">
                                <div className="grid grid-cols-2 gap-3">
                                  {projeto.indicadores
                                    .filter((ind: any) => ind.nome !== "Evasão")
                                    .map((ind: any, idx: number) => (
                                      <div key={idx} className="bg-white rounded-lg p-3 text-center shadow-sm">
                                        <div className="text-2xl font-bold text-gray-900 mb-1">
                                          {ind.unidade === '%'
                                            ? `${Math.round(ind.valor)}%`
                                            : ind.nome === "Hora Aula"
                                              ? `${Number(ind.valor).toFixed(0)}h`
                                              : Math.round(ind.valor).toLocaleString('pt-BR')}
                                        </div>
                                        <p className="text-xs text-gray-600 font-medium">{indicadorLabel[ind.nome] || ind.nome}</p>
                                      </div>
                                    ))}
                                  {/* NPS expandido em card próprio dentro */}
                                  {projeto.nps !== undefined && (
                                    <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                                      <div className="text-2xl font-bold text-gray-900 mb-1">
                                        {projeto.nps}
                                      </div>
                                      <p className="text-xs text-gray-600 font-medium">NPS</p>
                                    </div>
                                  )}
                                  {/* Evasão separado */}
                                  {projeto.indicadores.filter((i: any) => i.nome === "Evasão").map((ind: any, idx: number) => (
                                    <div key={"ev" + idx} className="bg-white rounded-lg p-3 text-center shadow-sm">
                                      <div className="text-2xl font-bold text-gray-900 mb-1">
                                        {Math.round(ind.valor).toLocaleString('pt-BR')}
                                      </div>
                                      <p className="text-xs text-gray-600 font-medium">Evasão</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Card Geração de Renda */}
                    <div
                      className="bg-yellow-50 rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl"
                      onClick={() => setExpandedInclusaoAdminCard(expandedInclusaoAdminCard === 'geracaoRenda' ? null : 'geracaoRenda')}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                              <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-base font-bold text-gray-800">GERAÇÃO DE RENDA</h3>
                          </div>
                          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expandedInclusaoAdminCard === 'geracaoRenda' ? 'rotate-180' : ''}`} />
                        </div>
                        {expandedInclusaoAdminCard === 'geracaoRenda' && (
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                              <div className="text-2xl font-bold text-gray-900 mb-1">
                                {(geracaoRenda2026.empregados || 0).toLocaleString('pt-BR')}
                              </div>
                              <p className="text-xs text-gray-600 font-medium">Empregados</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                              <div className="text-2xl font-bold text-gray-900 mb-1">
                                {(geracaoRenda2026.empreendedores || 0).toLocaleString('pt-BR')}
                              </div>
                              <p className="text-xs text-gray-600 font-medium">Empreendedores</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })()
            ) : (
            <>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium text-gray-600">Mês:</span>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={mesSelecionadoDashboard}
                onChange={(e) => setMesSelecionadoDashboard(parseInt(e.target.value))}
              >
                <option value="-1">Ano Completo</option>
                <option value="0">Janeiro</option>
                <option value="1">Fevereiro</option>
                <option value="2">Março</option>
                <option value="3">Abril</option>
                <option value="4">Maio</option>
                <option value="5">Junho</option>
                <option value="6">Julho</option>
                <option value="7">Agosto</option>
                <option value="8">Setembro</option>
                <option value="9">Outubro</option>
                <option value="10">Novembro</option>
                <option value="11">Dezembro</option>
              </select>
            </div>
            
            {/* Resumo Geral - Acumulado 2025 (usa Gestão à Vista) */}
            {(() => {
              const gv25 = gvData2025?.indicadores || {};
              const resumoCards = [
                { label: 'Em Formação',    valor: (gv25.alunosEmFormacao?.valor ?? 0).toLocaleString('pt-BR') },
                { label: 'Formados',       valor: (gv25.alunosFormados?.valor ?? 0).toLocaleString('pt-BR') },
                { label: 'Frequência',     valor: `${gv25.frequencia?.valor ?? 0}%` },
                { label: 'Evasão',         valor: (gv25.evasao?.valor ?? 0).toLocaleString('pt-BR') },
                { label: 'NPS',            valor: String(gv25.nps?.valor ?? 0) },
                { label: 'Visitas Domicílio', valor: (gv25.visitas?.valor ?? 0).toLocaleString('pt-BR') },
              ];
              return (
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <Briefcase className="w-5 h-5" />
                      Inclusão Produtiva — Acumulado 2025
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {resumoCards.map((c, i) => (
                        <div key={i} className="p-3 bg-white border border-green-200 rounded-lg text-center">
                          <p className="text-2xl font-bold text-green-600">{c.valor}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{c.label}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Gráficos Comparativos — usa dadosMensaisInclusao (tem dados reais de 2025) */}
            {(() => {
              const getLastNonNull = (arr: any[]) => {
                if (!arr) return 0;
                for (let i = arr.length - 1; i >= 0; i--) {
                  if (arr[i] !== null && arr[i] !== undefined) return arr[i];
                }
                return 0;
              };
              const projetoLabel = (nome: string) =>
                nome?.includes('LAB') ? 'LAB' : nome?.includes('PRESENCIAL') ? 'Presencial' : 'EAD';
              const projDados = dadosMensais?.projetos || [];
              const chartAtivos = projDados.map((p: any) => ({
                nome: projetoLabel(p.projeto || p.nome || ''),
                valor: getLastNonNull(p.indicadores?.find((i: any) => i.nome === 'Alunos Ativos')?.mensal || []),
              }));
              const chartFreq = projDados.map((p: any) => ({
                nome: projetoLabel(p.projeto || p.nome || ''),
                valor: getLastNonNull(p.indicadores?.find((i: any) => i.nome === 'Frequência')?.mensal || []),
              }));
              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-700">Alunos Ativos por Projeto</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartAtivos}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="valor" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-700">Frequência por Projeto (%)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartFreq}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 100]} />
                          <Tooltip formatter={(value: number) => `${value}%`} />
                          <Bar dataKey="valor" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}

            {/* Cards por Projeto — usa resumoAnual2025 (inclusao_produtiva_dados) */}
            {(() => {
              const projetosAnuais = [
                {
                  nome: "LAB. VOZES DO FUTURO",
                  label: "LAB - Vozes do Futuro",
                  dados: resumoAnual2025?.lab,
                  cores: inclusaoProjetoCores["LAB. VOZES DO FUTURO"] || { bg: "bg-green-50", border: "border-l-green-500", text: "text-green-600", icon: "bg-green-500" },
                  icon: <Briefcase className="w-5 h-5 text-white" />,
                },
                {
                  nome: "CURSOS PRESENCIAIS",
                  label: "Cursos Presenciais (30h)",
                  dados: resumoAnual2025?.presencial,
                  cores: inclusaoProjetoCores["CURSOS PRESENCIAIS"] || { bg: "bg-green-50", border: "border-l-emerald-500", text: "text-emerald-600", icon: "bg-emerald-500" },
                  icon: <GraduationCap className="w-5 h-5 text-white" />,
                },
                {
                  nome: "CURSOS EAD CGD",
                  label: "Cursos EAD",
                  dados: resumoAnual2025?.ead,
                  cores: inclusaoProjetoCores["CURSOS EAD CGD"] || { bg: "bg-green-50", border: "border-l-teal-500", text: "text-teal-600", icon: "bg-teal-500" },
                  icon: <Target className="w-5 h-5 text-white" />,
                },
              ];
              return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {projetosAnuais.map((p) => {
                    const d = p.dados;
                    const indicadores = d ? [
                      { nome: "Hora Aula",      valor: d.horaAula,       unidade: "h" },
                      { nome: "Atendimentos",   valor: d.atendimentos,   unidade: "" },
                      { nome: "Lanche",         valor: d.lanche,         unidade: "" },
                      { nome: "Frequência",     valor: d.frequencia,     unidade: "%" },
                      { nome: "Atendidos",      valor: d.atendidos,      unidade: "" },
                      { nome: "Evasão",         valor: d.evasao,         unidade: "" },
                    ] : [];
                    return (
                      <Card key={p.nome} className={`${p.cores.bg} border-l-4 ${p.cores.border}`}>
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <div className={`w-8 h-8 ${p.cores.icon} rounded-lg flex items-center justify-center`}>{p.icon}</div>
                            <span className="text-gray-800">{p.label}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-3">
                            {indicadores.map((ind, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-3 text-center shadow-sm">
                                <div className={`text-2xl font-bold ${p.cores.text} mb-1`}>
                                  {ind.unidade === "%" ? `${ind.valor.toFixed(1)}%` : ind.valor.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </div>
                                <p className="text-xs text-gray-700 font-medium">{ind.nome}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              );
            })()}

            {/* NOVA SEÇÃO: Cursos Detalhados por Área */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Award className="w-5 h-5" />
                  Cursos por Área (Detalhado)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Card Tecnologia */}
                <div className="bg-yellow-50 rounded-2xl shadow-lg overflow-hidden">
                  <div
                    className="p-4 cursor-pointer transition-all duration-300 hover:bg-yellow-100"
                    onClick={() => setSelectedArea(selectedArea === 'tecnologia' ? null : 'tecnologia')}
                    data-testid="card-area-tecnologia"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                          <Monitor className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Tecnologia</h3>
                      </div>
                      {selectedArea === 'tecnologia' ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                  </div>

                  {selectedArea === 'tecnologia' && (
                    <div className="px-4 pb-4 space-y-3">
                      {tecnologiaData?.data.presencial && tecnologiaData.data.presencial.cursos.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                          <div
                            className="p-3 cursor-pointer transition-all duration-300 hover:bg-gray-50"
                            onClick={() => setSelectedModalidade(selectedModalidade === 'presencial' ? null : 'presencial')}
                            data-testid="btn-modalidade-presencial"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-yellow-600" />
                                <span className="font-semibold text-gray-800">Presencial</span>
                              </div>
                              {selectedModalidade === 'presencial' ? (
                                <ChevronUp className="w-4 h-4 text-gray-600" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-600" />
                              )}
                            </div>
                          </div>

                          {selectedModalidade === 'presencial' && (
                            <div className="px-3 pb-3 space-y-2">
                              <div className="bg-yellow-50 rounded-lg p-3 mb-3">
                                <h4 className="text-sm font-bold text-gray-800 mb-2">Totais Presencial</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-gray-600">
                                      {tecnologiaData?.data.presencial.cursos.length || 0}
                                    </div>
                                    <p className="text-xs text-gray-600">Cursos</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-yellow-600">
                                      {tecnologiaData?.data.presencial.totais.inscritos || 0}
                                    </div>
                                    <p className="text-xs text-gray-600">Inscritos</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-green-600">
                                      {tecnologiaData?.data.presencial.totais.formados || 0}
                                    </div>
                                    <p className="text-xs text-gray-600">Formados</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-red-600">
                                      {tecnologiaData?.data.presencial.totais.percentualEvasao || 0}%
                                    </div>
                                    <p className="text-xs text-gray-600">Evasão</p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-700">Cursos:</h4>
                                {tecnologiaData?.data.presencial.cursos.map((curso: any) => (
                                  <div key={curso.id} className="bg-gray-50 rounded-lg p-2 text-xs">
                                    <div className="font-semibold text-gray-800 mb-1">{curso.curso}</div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-1 text-gray-600">
                                      <div>
                                        <span className="font-medium">Inscritos:</span> {curso.inscritos ?? '-'}
                                      </div>
                                      <div>
                                        <span className="font-medium">Formados:</span> {curso.formados ?? '-'}
                                      </div>
                                      <div>
                                        <span className="font-medium">Evasão:</span> {curso.evasao ?? '-'}
                                      </div>
                                      <div className={curso.situacao === 'Concluído' ? 'text-green-600' : 'text-blue-600'}>
                                        {curso.situacao}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {tecnologiaData?.data.ead && tecnologiaData.data.ead.cursos.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                          <div
                            className="p-3 cursor-pointer transition-all duration-300 hover:bg-gray-50"
                            onClick={() => setSelectedModalidade(selectedModalidade === 'ead' ? null : 'ead')}
                            data-testid="btn-modalidade-ead"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Monitor className="w-5 h-5 text-blue-600" />
                                <span className="font-semibold text-gray-800">EAD</span>
                              </div>
                              {selectedModalidade === 'ead' ? (
                                <ChevronUp className="w-4 h-4 text-gray-600" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-600" />
                              )}
                            </div>
                          </div>

                          {selectedModalidade === 'ead' && (
                            <div className="px-3 pb-3 space-y-2">
                              <div className="bg-blue-50 rounded-lg p-3 mb-3">
                                <h4 className="text-sm font-bold text-gray-800 mb-2">Totais EAD</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-gray-600">
                                      {tecnologiaData?.data.ead.cursos.length || 0}
                                    </div>
                                    <p className="text-xs text-gray-600">Cursos</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-blue-600">
                                      {tecnologiaData?.data.ead.totais.inscritos || 0}
                                    </div>
                                    <p className="text-xs text-gray-600">Inscritos</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-green-600">
                                      {tecnologiaData?.data.ead.totais.formados || 0}
                                    </div>
                                    <p className="text-xs text-gray-600">Formados</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-red-600">
                                      {tecnologiaData?.data.ead.totais.percentualEvasao || 0}%
                                    </div>
                                    <p className="text-xs text-gray-600">Evasão</p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-700">Cursos:</h4>
                                {tecnologiaData?.data.ead.cursos.map((curso: any) => (
                                  <div key={curso.id} className="bg-gray-50 rounded-lg p-2 text-xs">
                                    <div className="font-semibold text-gray-800 mb-1">{curso.curso}</div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-1 text-gray-600">
                                      <div>
                                        <span className="font-medium">Inscritos:</span> {curso.inscritos ?? '-'}
                                      </div>
                                      <div>
                                        <span className="font-medium">Formados:</span> {curso.formados ?? '-'}
                                      </div>
                                      <div>
                                        <span className="font-medium">Evasão:</span> {curso.evasao ?? '-'}
                                      </div>
                                      <div className={curso.situacao === 'Concluído' ? 'text-green-600' : 'text-blue-600'}>
                                        {curso.situacao}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Beleza */}
                <div className="bg-yellow-50 rounded-2xl shadow-lg overflow-hidden">
                  <div
                    className="p-4 cursor-pointer transition-all duration-300 hover:bg-yellow-100"
                    onClick={() => setSelectedArea(selectedArea === 'beleza' ? null : 'beleza')}
                    data-testid="card-area-beleza"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                          <Star className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Beleza</h3>
                      </div>
                      {selectedArea === 'beleza' ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                  </div>

                  {selectedArea === 'beleza' && (
                    <div className="px-4 pb-4 space-y-3">
                      {belezaData?.data.presencial && belezaData.data.presencial.cursos.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                          <div
                            className="p-3 cursor-pointer transition-all duration-300 hover:bg-gray-50"
                            onClick={() => setSelectedModalidade(selectedModalidade === 'presencial-beleza' ? null : 'presencial-beleza')}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-yellow-600" />
                                <span className="font-semibold text-gray-800">Presencial</span>
                              </div>
                              {selectedModalidade === 'presencial-beleza' ? (
                                <ChevronUp className="w-4 h-4 text-gray-600" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-600" />
                              )}
                            </div>
                          </div>

                          {selectedModalidade === 'presencial-beleza' && (
                            <div className="px-3 pb-3 space-y-2">
                              <div className="bg-yellow-50 rounded-lg p-3 mb-3">
                                <h4 className="text-sm font-bold text-gray-800 mb-2">Totais Presencial</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-gray-600">
                                      {belezaData?.data.presencial.cursos.length || 0}
                                    </div>
                                    <p className="text-xs text-gray-600">Cursos</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-yellow-600">
                                      {belezaData?.data.presencial.totais.inscritos || 0}
                                    </div>
                                    <p className="text-xs text-gray-600">Inscritos</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-green-600">
                                      {belezaData?.data.presencial.totais.formados || 0}
                                    </div>
                                    <p className="text-xs text-gray-600">Formados</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-red-600">
                                      {belezaData?.data.presencial.totais.percentualEvasao || 0}%
                                    </div>
                                    <p className="text-xs text-gray-600">Evasão</p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-700">Cursos:</h4>
                                {belezaData?.data.presencial.cursos.map((curso: any) => (
                                  <div key={curso.id} className="bg-gray-50 rounded-lg p-2 text-xs">
                                    <div className="font-semibold text-gray-800 mb-1">{curso.curso}</div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-1 text-gray-600">
                                      <div>
                                        <span className="font-medium">Inscritos:</span> {curso.inscritos ?? '-'}
                                      </div>
                                      <div>
                                        <span className="font-medium">Formados:</span> {curso.formados ?? '-'}
                                      </div>
                                      <div>
                                        <span className="font-medium">Evasão:</span> {curso.evasao ?? '-'}
                                      </div>
                                      <div className={curso.situacao === 'Concluído' ? 'text-green-600' : 'text-blue-600'}>
                                        {curso.situacao}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Gastronomia */}
                <div className="bg-yellow-50 rounded-2xl shadow-lg overflow-hidden">
                  <div
                    className="p-4 cursor-pointer transition-all duration-300 hover:bg-yellow-100"
                    onClick={() => setSelectedArea(selectedArea === 'gastronomia' ? null : 'gastronomia')}
                    data-testid="card-area-gastronomia"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Gastronomia</h3>
                      </div>
                      {selectedArea === 'gastronomia' ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                  </div>

                  {selectedArea === 'gastronomia' && gastronomiaData && (
                    <div className="px-4 pb-4 space-y-3">
                      {gastronomiaData?.data.presencial && gastronomiaData.data.presencial.cursos.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                          <div
                            className="p-3 cursor-pointer transition-all duration-300 hover:bg-gray-50"
                            onClick={() => setSelectedModalidade(selectedModalidade === 'presencial-gastronomia' ? null : 'presencial-gastronomia')}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-yellow-600" />
                                <span className="font-semibold text-gray-800">Presencial</span>
                              </div>
                              {selectedModalidade === 'presencial-gastronomia' ? (
                                <ChevronUp className="w-4 h-4 text-gray-600" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-600" />
                              )}
                            </div>
                          </div>

                          {selectedModalidade === 'presencial-gastronomia' && (
                            <div className="px-3 pb-3 space-y-2">
                              <div className="bg-yellow-50 rounded-lg p-3 mb-3">
                                <h4 className="text-sm font-bold text-gray-800 mb-2">Totais Presencial</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-gray-600">
                                      {gastronomiaData?.data.presencial.cursos.length || 0}
                                    </div>
                                    <p className="text-xs text-gray-600">Cursos</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-yellow-600">
                                      {gastronomiaData?.data.presencial.totais.inscritos || 0}
                                    </div>
                                    <p className="text-xs text-gray-600">Inscritos</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-green-600">
                                      {gastronomiaData?.data.presencial.totais.formados || 0}
                                    </div>
                                    <p className="text-xs text-gray-600">Formados</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-red-600">
                                      {gastronomiaData?.data.presencial.totais.percentualEvasao || 0}%
                                    </div>
                                    <p className="text-xs text-gray-600">Evasão</p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-700">Cursos:</h4>
                                {gastronomiaData?.data.presencial.cursos.map((curso: any) => (
                                  <div key={curso.id} className="bg-gray-50 rounded-lg p-2 text-xs">
                                    <div className="font-semibold text-gray-800 mb-1">{curso.curso}</div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-1 text-gray-600">
                                      <div>
                                        <span className="font-medium">Inscritos:</span> {curso.inscritos ?? '-'}
                                      </div>
                                      <div>
                                        <span className="font-medium">Formados:</span> {curso.formados ?? '-'}
                                      </div>
                                      <div>
                                        <span className="font-medium">Evasão:</span> {curso.evasao ?? '-'}
                                      </div>
                                      <div className={curso.situacao === 'Concluído' ? 'text-green-600' : 'text-blue-600'}>
                                        {curso.situacao}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Cards das demais áreas - padrão similar */}
                {/* Artesanato, Empreendedorismo, Administrativo, Socioemocional, Educacional, Operacional */}
                {[
                  { id: 'artesanato', nome: 'Artesanato', data: artesanatoData, icon: 'Trophy' },
                  { id: 'empreendedorismo', nome: 'Empreendedorismo', data: empreendedorismoData, icon: 'Briefcase' },
                  { id: 'administrativo', nome: 'Administrativo', data: administrativoData, icon: 'FileText' },
                  { id: 'socioemocional', nome: 'Socioemocional', data: socioemocionalData, icon: 'Heart' },
                  { id: 'educacional', nome: 'Educacional', data: educacionalData, icon: 'BookOpen' },
                  { id: 'operacional', nome: 'Operacional', data: operacionalData, icon: 'Settings' }
                ].map((area) => {
                  const IconComponent = area.icon === 'Trophy' ? Trophy : 
                                      area.icon === 'Briefcase' ? Briefcase :
                                      area.icon === 'FileText' ? FileText :
                                      area.icon === 'Heart' ? Heart :
                                      area.icon === 'BookOpen' ? BookOpen : Settings;
                  
                  return (
                    <div key={area.id} className="bg-yellow-50 rounded-2xl shadow-lg overflow-hidden">
                      <div
                        className="p-4 cursor-pointer transition-all duration-300 hover:bg-yellow-100"
                        onClick={() => setSelectedArea(selectedArea === area.id ? null : area.id)}
                        data-testid={`card-area-${area.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                              <IconComponent className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">{area.nome}</h3>
                          </div>
                          {selectedArea === area.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-600" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                      </div>

                      {selectedArea === area.id && area.data && (
                        <div className="px-4 pb-4 space-y-3">
                          {area.data?.data.presencial && area.data.data.presencial.cursos.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                              <div
                                className="p-3 cursor-pointer transition-all duration-300 hover:bg-gray-50"
                                onClick={() => setSelectedModalidade(selectedModalidade === `presencial-${area.id}` ? null : `presencial-${area.id}`)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-yellow-600" />
                                    <span className="font-semibold text-gray-800">Presencial</span>
                                  </div>
                                  {selectedModalidade === `presencial-${area.id}` ? (
                                    <ChevronUp className="w-4 h-4 text-gray-600" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-600" />
                                  )}
                                </div>
                              </div>

                              {selectedModalidade === `presencial-${area.id}` && (
                                <div className="px-3 pb-3 space-y-2">
                                  <div className="bg-yellow-50 rounded-lg p-3 mb-3">
                                    <h4 className="text-sm font-bold text-gray-800 mb-2">Totais Presencial</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-gray-600">
                                          {area.data?.data.presencial.cursos.length || 0}
                                        </div>
                                        <p className="text-xs text-gray-600">Cursos</p>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-yellow-600">
                                          {area.data?.data.presencial.totais.inscritos || 0}
                                        </div>
                                        <p className="text-xs text-gray-600">Inscritos</p>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-green-600">
                                          {area.data?.data.presencial.totais.formados || 0}
                                        </div>
                                        <p className="text-xs text-gray-600">Formados</p>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-red-600">
                                          {area.data?.data.presencial.totais.percentualEvasao || 0}%
                                        </div>
                                        <p className="text-xs text-gray-600">Evasão</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-gray-700">Cursos:</h4>
                                    {area.data?.data.presencial.cursos.map((curso: any) => (
                                      <div key={curso.id} className="bg-gray-50 rounded-lg p-2 text-xs">
                                        <div className="font-semibold text-gray-800 mb-1">{curso.curso}</div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 text-gray-600">
                                          <div>
                                            <span className="font-medium">Inscritos:</span> {curso.inscritos ?? '-'}
                                          </div>
                                          <div>
                                            <span className="font-medium">Formados:</span> {curso.formados ?? '-'}
                                          </div>
                                          <div>
                                            <span className="font-medium">Evasão:</span> {curso.evasao ?? '-'}
                                          </div>
                                          <div className={curso.situacao === 'Concluído' ? 'text-green-600' : 'text-blue-600'}>
                                            {curso.situacao}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {area.data?.data.ead && area.data.data.ead.cursos.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                              <div
                                className="p-3 cursor-pointer transition-all duration-300 hover:bg-gray-50"
                                onClick={() => setSelectedModalidade(selectedModalidade === `ead-${area.id}` ? null : `ead-${area.id}`)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Monitor className="w-5 h-5 text-blue-600" />
                                    <span className="font-semibold text-gray-800">EAD</span>
                                  </div>
                                  {selectedModalidade === `ead-${area.id}` ? (
                                    <ChevronUp className="w-4 h-4 text-gray-600" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-600" />
                                  )}
                                </div>
                              </div>

                              {selectedModalidade === `ead-${area.id}` && (
                                <div className="px-3 pb-3 space-y-2">
                                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                                    <h4 className="text-sm font-bold text-gray-800 mb-2">Totais EAD</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-gray-600">
                                          {area.data?.data.ead.cursos.length || 0}
                                        </div>
                                        <p className="text-xs text-gray-600">Cursos</p>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-blue-600">
                                          {area.data?.data.ead.totais.inscritos || 0}
                                        </div>
                                        <p className="text-xs text-gray-600">Inscritos</p>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-green-600">
                                          {area.data?.data.ead.totais.formados || 0}
                                        </div>
                                        <p className="text-xs text-gray-600">Formados</p>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-red-600">
                                          {area.data?.data.ead.totais.percentualEvasao || 0}%
                                        </div>
                                        <p className="text-xs text-gray-600">Evasão</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-gray-700">Cursos:</h4>
                                    {area.data?.data.ead.cursos.map((curso: any) => (
                                      <div key={curso.id} className="bg-gray-50 rounded-lg p-2 text-xs">
                                        <div className="font-semibold text-gray-800 mb-1">{curso.curso}</div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 text-gray-600">
                                          <div>
                                            <span className="font-medium">Inscritos:</span> {curso.inscritos ?? '-'}
                                          </div>
                                          <div>
                                            <span className="font-medium">Formados:</span> {curso.formados ?? '-'}
                                          </div>
                                          <div>
                                            <span className="font-medium">Evasão:</span> {curso.evasao ?? '-'}
                                          </div>
                                          <div className={curso.situacao === 'Concluído' ? 'text-green-600' : 'text-blue-600'}>
                                            {curso.situacao}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

              </CardContent>
            </Card>
            </>
            )}
          </div>
        );
      }
      case "pec":
        return (
          <div className="space-y-6">
            {anoIndicadores === 2026 ? (() => {
              const mpec  = metasPec2026?.metas ?? {};
              const gvInd = gvDataPec2026?.indicadores ?? {};
              const gvPec = gvDataPec2026?.pecData ?? {};
              const atendidosMeta = mpec.criancasAtendidas ?? gvPec?.atendidos_meta ?? 500;
              const freqMeta      = mpec.frequencia        ?? 85;
              const evasaoMeta    = mpec.evasao            ?? 10;
              const npsMeta       = mpec.nps               ?? 90;

              const atendidos    = pecKpis2026?.atendidos    ?? gvInd?.criancasAtendidas?.valor ?? 0;
              const freq         = pecKpis2026?.frequenciaMedia ?? gvInd?.frequencia?.valor       ?? 0;
              const evasao       = pecKpis2026?.evasao       ?? gvInd?.evasao?.valor             ?? 0;
              const nps          = pecKpis2026?.nps          ?? gvInd?.criterioSucesso?.valor     ?? 0;
              const horasAula    = pecKpis2026?.horasAula    ?? 0;
              const atendimentos = pecKpis2026?.atendimentos ?? 0;
              const alimentacao  = pecKpis2026?.alimentacao  ?? 0;

              const pecKpis = [
                { label: 'Crianças Atendidas', valor: atendidos,    meta: atendidosMeta, inverse: false, fmt: 'n' },
                { label: 'Frequência',          valor: freq,         meta: freqMeta,      inverse: false, fmt: '%' },
                { label: 'Evasão',              valor: evasao,       meta: evasaoMeta,    inverse: true,  fmt: '%' },
                { label: 'NPS',                 valor: nps,          meta: npsMeta,       inverse: false, fmt: 'n' },
                { label: 'Horas Aula',          valor: horasAula,    meta: null,          inverse: false, fmt: 'n' },
                { label: 'Atendimentos',        valor: atendimentos, meta: null,          inverse: false, fmt: 'n' },
                { label: 'Alimentação',         valor: alimentacao,  meta: null,          inverse: false, fmt: 'n' },
              ];

              const projPec = dadosProgramasPec?.data ?? {};
              const pecProjetosCores: Record<string, {bg:string;border:string;text:string;icon:string}> = {
                casaSonhar:             { bg:'bg-orange-50', border:'border-l-orange-500',  text:'text-orange-600',  icon:'bg-orange-500'  },
                programaEsporteCultura: { bg:'bg-amber-50',  border:'border-l-amber-600',   text:'text-amber-600',   icon:'bg-amber-600'   },
                serenata:               { bg:'bg-yellow-50', border:'border-l-yellow-600',  text:'text-yellow-600',  icon:'bg-yellow-600'  },
              };
              const projetos = [
                { key: 'casaSonhar',             label: 'Casa Sonhar' },
                { key: 'programaEsporteCultura', label: 'Polo Esporte e Cultura' },
                { key: 'serenata',               label: 'Sala Serenata' },
              ];
              const projIcons = [
                <Users className="w-5 h-5 text-white" />,
                <Target className="w-5 h-5 text-white" />,
                <GraduationCap className="w-5 h-5 text-white" />,
              ];

              return (
                <div className="space-y-6">
                  {/* Título + filtro mês inline */}
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900">Metas & Resultados</h3>
                    <select
                      className="border rounded px-1 py-0.5 text-[10px] w-auto md:px-2 md:py-1 md:text-xs bg-white"
                      value={kpiPecMes}
                      onChange={e => setKpiPecMes(e.target.value)}
                    >
                      <option value="todos">Todos os meses</option>
                      {['Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((m, i) => <option key={i+2} value={String(i+2)}>{m}</option>)}
                    </select>
                    <p className="text-xs text-gray-500">KPIs de 2026</p>
                  </div>

                  {/* Carrossel de KPIs — mesmo padrão da Inclusão */}
                  <style>{`.kpi-carousel-pec::-webkit-scrollbar{display:none}`}</style>
                  <div
                    className="kpi-carousel-pec"
                    style={{
                      overflowX: 'auto', overflowY: 'hidden',
                      width: '100%', maxWidth: '100%',
                      WebkitOverflowScrolling: 'touch',
                      scrollbarWidth: 'none', msOverflowStyle: 'none',
                      cursor: 'grab', paddingBottom: '4px',
                    } as React.CSSProperties}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const el = e.currentTarget;
                      el.style.cursor = 'grabbing';
                      const startX = e.clientX;
                      const startScroll = el.scrollLeft;
                      const onMove = (me: MouseEvent) => { el.scrollLeft = startScroll - (me.clientX - startX); };
                      const onUp = () => {
                        el.style.cursor = 'grab';
                        window.removeEventListener('mousemove', onMove);
                        window.removeEventListener('mouseup', onUp);
                      };
                      window.addEventListener('mousemove', onMove);
                      window.addEventListener('mouseup', onUp);
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px', width: 'max-content', padding: '2px' }}>
                      {pecKpis.map((kpi, idx) => (
                        <GestaoKpiCard
                          key={idx}
                          label={kpi.label}
                          valor={kpi.valor}
                          meta={kpi.meta}
                          inverse={kpi.inverse}
                          format={kpi.fmt === '%' ? 'percent' : 'number'}
                          variant="light"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Cards por Projeto — expansíveis, igual ao Welcome e Inclusão */}
                  <div className="pt-2 border-t border-gray-200">
                    <h3 className="text-base font-bold text-gray-900 mb-3">Resultados Anuais por Projeto</h3>
                  </div>
                  <div className="space-y-4">
                    {projetos.map((p, idx) => {
                      const d = projPec[p.key];
                      const isOpen = expandedPECAdminCard === p.key;
                      return (
                        <div
                          key={p.key}
                          className="bg-yellow-50 rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl"
                          onClick={() => setExpandedPECAdminCard(isOpen ? null : p.key)}
                        >
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                                  {projIcons[idx]}
                                </div>
                                <h3 className="text-base font-bold text-gray-800">{p.label}</h3>
                              </div>
                              <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                            </div>
                            {isOpen && (
                              <div className="mt-4">
                                {!d ? (
                                  <p className="text-sm text-gray-400 text-center py-2">Sem dados disponíveis</p>
                                ) : (
                                  <div className="grid grid-cols-2 gap-3">
                                    {[
                                      { nome: 'Atendidos',    val: d.atendidos,        fmt: 'n' },
                                      { nome: 'Atendimentos', val: d.atendimentos,     fmt: 'n' },
                                      { nome: 'Horas Aula',   val: d.horaAula,         fmt: 'n' },
                                      { nome: 'Alimentação',  val: d.alimentacao ?? 0, fmt: 'n' },
                                      { nome: 'Frequência',   val: d.frequencia,       fmt: '%' },
                                      { nome: 'Evasão',       val: d.evasao ?? 0,      fmt: 'n' },
                                      { nome: 'NPS',          val: d.nps ?? 0,         fmt: 'n' },
                                    ].map((ind, i) => (
                                      <div key={i} className="bg-white rounded-lg p-3 text-center shadow-sm">
                                        <div className="text-2xl font-bold text-gray-900 mb-1">
                                          {ind.fmt === '%'
                                            ? `${Number(ind.val).toFixed(1)}%`
                                            : Number(ind.val).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                        </div>
                                        <p className="text-xs text-gray-700 font-medium">{ind.nome}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })() : (!dadosMensaisPEC ? <div className="p-6">Carregando dados do PEC...</div> : (
            <>
            {/* Seletor de Mês PEC */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium text-gray-600">Mês:</span>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={mesSelecionadoPEC}
                onChange={(e) => setMesSelecionadoPEC(parseInt(e.target.value))}
              >
                <option value="0">Janeiro</option>
                <option value="1">Fevereiro</option>
                <option value="2">Março</option>
                <option value="3">Abril</option>
                <option value="4">Maio</option>
                <option value="5">Junho</option>
                <option value="6">Julho</option>
                <option value="7">Agosto</option>
                <option value="8">Setembro</option>
                <option value="9">Outubro</option>
                <option value="10">Novembro</option>
                <option value="11">Dezembro</option>
              </select>
            </div>
            
            {/* Resumo Geral */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  Indicadores PEC - {anoIndicadores}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dadosMensaisPEC.resumo && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-orange-50 rounded-xl p-5 text-center">
                      <p className="text-4xl font-bold text-orange-600 mb-2">
                        {dadosMensaisPEC.resumo.totalAtendidos?.toLocaleString('pt-BR') || 0}
                      </p>
                      <p className="text-sm text-gray-600">Total Atendidos</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-5 text-center">
                      <p className="text-4xl font-bold text-orange-600 mb-2">
                        {dadosMensaisPEC.resumo.totalAtendimentos?.toLocaleString('pt-BR') || 0}
                      </p>
                      <p className="text-sm text-gray-600">Total Atendimentos</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-5 text-center">
                      <p className="text-4xl font-bold text-orange-600 mb-2">
                        {dadosMensaisPEC.resumo.frequenciaMedia || 0}%
                      </p>
                      <p className="text-sm text-gray-600">Frequência Média</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-5 text-center">
                      <p className="text-4xl font-bold text-red-600 mb-2">
                        {dadosMensaisPEC.resumo.totalEvasao?.toLocaleString('pt-BR') || 0}
                      </p>
                      <p className="text-sm text-gray-600">Total Evasão</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Projetos em Cards Separados */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {dadosMensaisPEC.projetos?.map((projeto: any, index: number) => {
                const colors = [
                  { border: 'border-l-orange-500', bg: 'bg-orange-500', text: 'text-orange-600' },
                  { border: 'border-l-amber-600', bg: 'bg-amber-600', text: 'text-amber-600' },
                  { border: 'border-l-yellow-600', bg: 'bg-yellow-600', text: 'text-yellow-600' }
                ];
                const color = colors[index % colors.length];
                return (
                  <Card key={projeto.nome} className={`border-l-4 ${color.border}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className={`text-lg font-bold ${color.text}`}>
                        {projeto.nome}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {projeto.indicadores?.map((indicador: any) => (
                          <div key={indicador.nome} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                            <span className="text-sm text-gray-600">{indicador.nome}</span>
                            <span className={`font-bold ${color.text}`}>
                              {typeof indicador.valor === 'number' 
                                ? indicador.valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
                                : indicador.valor || 0}
                              {indicador.suffix || ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Gráficos Comparativos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Atendidos por Projeto */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Comparativo de Atendidos por Projeto</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={dadosMensaisPEC.projetos?.map((p: any) => ({
                        nome: p.nome.length > 12 ? p.nome.substring(0, 12) + '...' : p.nome,
                        atendidos: p.indicadores?.find((i: any) => i.nome === 'Atendidos')?.valor || 0,
                        atendimentos: p.indicadores?.find((i: any) => i.nome === 'Atendimentos')?.valor || 0
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nome" tick={{ fontSize: 10 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="atendidos" fill="#f97316" name="Atendidos" />
                      <Bar dataKey="atendimentos" fill="#fdba74" name="Atendidos" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Gráfico de Frequência por Projeto */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Frequência por Projeto (%)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={dadosMensaisPEC.projetos?.map((p: any) => ({
                        nome: p.nome.length > 12 ? p.nome.substring(0, 12) + '...' : p.nome,
                        frequencia: p.indicadores?.find((i: any) => i.nome === 'Frequência')?.valor || 0,
                        horasAula: (p.indicadores?.find((i: any) => i.nome === 'Horas/Aula')?.valor || 0) / 100
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nome" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="frequencia" fill="#22c55e" name="Frequência %" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Horas/Aula */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Horas/Aula por Projeto</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={dadosMensaisPEC.projetos?.map((p: any) => ({
                      nome: p.nome,
                      horasAula: p.indicadores?.find((i: any) => i.nome === 'Horas/Aula')?.valor || 0
                    }))}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="nome" type="category" tick={{ fontSize: 11 }} width={150} />
                    <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />
                    <Bar dataKey="horasAula" fill="#3b82f6" name="Horas/Aula" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
            ))}
          </div>
        );
      case "psicossocial":
        return (
          <div className="space-y-6">
            {/* Seletor de ano */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={anoPsicoAdmin === 2025 ? "default" : "outline"}
                className={anoPsicoAdmin === 2025 ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                onClick={() => setAnoPsicoAdmin(2025)}
              >2025</Button>
              <Button
                size="sm"
                variant={anoPsicoAdmin === 2026 ? "default" : "outline"}
                className={anoPsicoAdmin === 2026 ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                onClick={() => setAnoPsicoAdmin(2026)}
              >2026</Button>
            </div>

            {anoPsicoAdmin === 2026 ? (
              <div className="space-y-4">
                <p className="text-base font-bold text-gray-700">Dados Anuais por Seguimento</p>

                {/* Card Atenção Social 2026 */}
                <div
                  className="bg-yellow-50 rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl"
                  onClick={() => setExpandedPsicoCardAdmin(expandedPsicoCardAdmin === 'atencao-social' ? null : 'atencao-social')}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                          <Home className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Atenção Social</h3>
                      </div>
                      {expandedPsicoCardAdmin === 'atencao-social' ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    {expandedPsicoCardAdmin === 'atencao-social' && (
                      <div className="mt-4">
                        {loadingAtencaoAdmin2026 ? (
                          <div className="text-center py-4 text-gray-500">Carregando...</div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                              <div className="text-3xl font-bold text-yellow-600 mb-1">
                                {atencaoSocialAdmin2026?.data?.visitasDomiciliares?.realizadas ?? 0}
                              </div>
                              <p className="text-xs text-gray-700 font-medium">Visitas Domiciliares</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                              <div className="text-3xl font-bold text-yellow-600 mb-1">
                                {atencaoSocialAdmin2026?.data?.atendimentosIndividuais?.realizados ?? 0}
                              </div>
                              <p className="text-xs text-gray-700 font-medium">Acolhimento Individual</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Método O Grito 2026 */}
                <div
                  className="bg-yellow-50 rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl"
                  onClick={() => setExpandedPsicoCardAdmin(expandedPsicoCardAdmin === 'metodo-grito' ? null : 'metodo-grito')}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Método O Grito</h3>
                      </div>
                      {expandedPsicoCardAdmin === 'metodo-grito' ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    {expandedPsicoCardAdmin === 'metodo-grito' && (
                      <div className="mt-4">
                        {loadingMetodoAdmin2026 ? (
                          <div className="text-center py-4 text-gray-500">Carregando...</div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                              <div className="text-3xl font-bold text-yellow-600 mb-1">
                                {(intervencoesAdminCount?.total ?? 0).toLocaleString('pt-BR')}
                              </div>
                              <p className="text-xs text-gray-700 font-medium">Intervenções</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                              <div className="text-3xl font-bold text-yellow-600 mb-1">
                                {metodoGritoAdmin2026?.data?.espacosColetivos?.total ?? 0}
                              </div>
                              <p className="text-xs text-gray-700 font-medium">#EspaçoOGrito</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Dados Anuais 2025</p>

                {/* Card Atenção Social */}
                <div
                  className="bg-yellow-50 rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl"
                  onClick={() => setExpandedPsicoCardAdmin(expandedPsicoCardAdmin === 'atencao-social' ? null : 'atencao-social')}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                          <Home className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Atenção Social</h3>
                      </div>
                      {expandedPsicoCardAdmin === 'atencao-social' ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    {expandedPsicoCardAdmin === 'atencao-social' && (
                      <div className="mt-4">
                        {loadingAtencaoAdmin ? (
                          <div className="text-center py-4 text-gray-500">Carregando...</div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                              <div className="text-3xl font-bold text-yellow-600 mb-1">
                                {atencaoSocialAdmin2025?.data?.visitasDomiciliares?.realizadas ?? 0}
                              </div>
                              <p className="text-xs text-gray-700 font-medium">Visitas Domiciliares</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                              <div className="text-3xl font-bold text-yellow-600 mb-1">
                                {atencaoSocialAdmin2025?.data?.atendimentosIndividuais?.realizados ?? 0}
                              </div>
                              <p className="text-xs text-gray-700 font-medium">Acolhimento Individual</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Método O Grito */}
                <div
                  className="bg-yellow-50 rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl"
                  onClick={() => setExpandedPsicoCardAdmin(expandedPsicoCardAdmin === 'metodo-grito' ? null : 'metodo-grito')}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Método O Grito</h3>
                      </div>
                      {expandedPsicoCardAdmin === 'metodo-grito' ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    {expandedPsicoCardAdmin === 'metodo-grito' && (
                      <div className="mt-4">
                        {loadingMetodoAdmin ? (
                          <div className="text-center py-4 text-gray-500">Carregando...</div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                              <div className="text-3xl font-bold text-yellow-600 mb-1">
                                {(intervencoesAdminCount?.total ?? 0).toLocaleString('pt-BR')}
                              </div>
                              <p className="text-xs text-gray-700 font-medium">Intervenções</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                              <div className="text-3xl font-bold text-yellow-600 mb-1">
                                {metodoGritoAdmin2025?.data?.espacosColetivos?.total ?? 0}
                              </div>
                              <p className="text-xs text-gray-700 font-medium">#EspaçoOGrito</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
            case "negocios": {
        const negData = (anoIndicadores === 2026 ? negociosData : negociosSociaisData);
        const outletDoacoes     = negData?.data?.outlet?.doacoesRecebidas   || 0;
        const outletPecas       = negData?.data?.outlet?.pecasVendidas      || 0;
        const outletPessoas     = negData?.data?.outlet?.clientesAtendidos  || 0;
        const outletCacambas    = negData?.data?.outlet?.cacambasDoBem      || 0;
        const outletLives       = negData?.data?.outlet?.livesRealizadas    || 0;
        const grifftePecas      = negData?.data?.griffte?.pecasConfeccionadas || 0;
        const griffteClientes   = negData?.data?.griffte?.clientesAtendidos   || 0;
        const grifftePedidos    = negData?.data?.griffte?.pedidosEntregues    || 0;

        return (
          <div className="space-y-6">
            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm font-medium text-gray-600">Ano:</span>
              <Button size="sm" variant={anoIndicadores === 2025 ? "default" : "outline"} className={anoIndicadores === 2025 ? "bg-yellow-600 hover:bg-yellow-700" : ""} onClick={() => setAnoIndicadores(2025)}>2025</Button>
              <Button size="sm" variant={anoIndicadores === 2026 ? "default" : "outline"} className={anoIndicadores === 2026 ? "bg-yellow-600 hover:bg-yellow-700" : ""} onClick={() => setAnoIndicadores(2026)}>2026</Button>

            </div>

            {loadingNegocios ? (
              <div className="text-center py-8 text-gray-500">Carregando dados...</div>
            ) : (
              <div className="space-y-4">
                {anoIndicadores === 2026
                  ? <p className="text-base font-semibold text-gray-900">Resultados Anuais por Negócio</p>
                  : <p className="text-sm text-gray-500">Dados Anuais {anoIndicadores}</p>}

                {/* Card IOG Outlet */}
                <div
                  className="bg-yellow-50 rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl"
                  onClick={() => setExpandedNegocioCard(expandedNegocioCard === 'outlet' ? null : 'outlet')}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                          <Store className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">IOG Outlet</h3>
                      </div>
                      {expandedNegocioCard === 'outlet'
                        ? <ChevronUp className="w-5 h-5 text-gray-600" />
                        : <ChevronDown className="w-5 h-5 text-gray-600" />}
                    </div>
                    {expandedNegocioCard === 'outlet' && (
                      <div className="mt-4">
                        <div className="grid grid-cols-2 gap-3">
                          {(anoIndicadores !== 2025 || outletDoacoes > 0) && (
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1">
                              {outletDoacoes.toLocaleString('pt-BR')}
                            </div>
                            <p className="text-xs text-gray-700 font-medium">Itens Recebidos</p>
                          </div>
                          )}
                          {(anoIndicadores !== 2025 || outletCacambas > 0) && (
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1">
                              {outletCacambas.toLocaleString('pt-BR')}
                            </div>
                            <p className="text-xs text-gray-700 font-medium">Caçambas do Bem</p>
                          </div>
                          )}
                          {(anoIndicadores !== 2025 || outletPessoas > 0) && (
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1">
                              {outletPessoas.toLocaleString('pt-BR')}
                            </div>
                            <p className="text-xs text-gray-700 font-medium">Clientes Atendidos</p>
                          </div>
                          )}
                          {(anoIndicadores !== 2025 || outletPecas > 0) && (
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1">
                              {outletPecas.toLocaleString('pt-BR')}
                            </div>
                            <p className="text-xs text-gray-700 font-medium">Itens Vendidos</p>
                          </div>
                          )}
                          {(anoIndicadores !== 2025 || outletLives > 0) && (
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm col-span-2">
                            <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1">
                              {outletLives.toLocaleString('pt-BR')}
                            </div>
                            <p className="text-xs text-gray-700 font-medium">Lives Realizadas</p>
                          </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card IOG Confecção */}
                <div
                  className="bg-yellow-50 rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl"
                  onClick={() => setExpandedNegocioCard(expandedNegocioCard === 'griffte' ? null : 'griffte')}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                          <Scissors className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">IOG Confecção</h3>
                      </div>
                      {expandedNegocioCard === 'griffte'
                        ? <ChevronUp className="w-5 h-5 text-gray-600" />
                        : <ChevronDown className="w-5 h-5 text-gray-600" />}
                    </div>
                    {expandedNegocioCard === 'griffte' && (
                      <div className="mt-4">
                        <div className="grid grid-cols-2 gap-3">
                          {(anoIndicadores !== 2025 || griffteClientes > 0) && (
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1">
                              {griffteClientes.toLocaleString('pt-BR')}
                            </div>
                            <p className="text-xs text-gray-700 font-medium">Clientes Atendidos</p>
                          </div>
                          )}
                          {(anoIndicadores !== 2025 || grifftePedidos > 0) && (
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1">
                              {grifftePedidos.toLocaleString('pt-BR')}
                            </div>
                            <p className="text-xs text-gray-700 font-medium">Pedidos Entregues</p>
                          </div>
                          )}
                          {(anoIndicadores !== 2025 || grifftePecas > 0) && (
                          <div className={`bg-white rounded-lg p-3 text-center shadow-sm${(anoIndicadores !== 2025 || grifftePedidos > 0) ? ' col-span-2' : ''}`}>
                            <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1">
                              {grifftePecas.toLocaleString('pt-BR')}
                            </div>
                            <p className="text-xs text-gray-700 font-medium">Peças Produzidas</p>
                          </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }
            case "investimento":
        return (
          <div className="space-y-6">
            {/* Seletor de Ano */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium text-gray-600">Ano:</span>
              <Button
                size="sm"
                variant={anoIndicadores === 2025 ? "default" : "outline"}
                className={anoIndicadores === 2025 ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                onClick={() => setAnoIndicadores(2025)}
              >
                2025
              </Button>
              <Button
                size="sm"
                variant={anoIndicadores === 2026 ? "default" : "outline"}
                className={anoIndicadores === 2026 ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                onClick={() => setAnoIndicadores(2026)}
              >
                2026
              </Button>
            </div>
            
            {anoIndicadores === 2026 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-4 bg-gray-100 rounded-2xl border border-gray-200">
                <Wrench className="w-10 h-10 text-gray-500" />
                <h3 className="text-lg font-bold text-gray-800">Em manutenção</h3>
                <p className="text-sm text-gray-600 max-w-xs">Estamos organizando os indicadores de 2026. Em breve tudo estará disponível aqui.</p>
              </div>
            ) : (
              <DashboardFinanceiro
                filtrosPeriodo={{ mes: null, ano: anoIndicadores }}
                showRefreshControls={true}
                showData={showFinanceiroData}
                onToggleShowData={() => setShowFinanceiroData(!showFinanceiroData)}
                className="space-y-4"
              />
            )}
          </div>
        );
      case "metas-indicadores":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">Controle de Metas e Indicadores</h2>
              <p className="text-sm text-gray-500">Defina e acompanhe as metas anuais de cada setor do Instituto.</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wider">PEC — Programa Esportivo Cultural</h3>
              <MetasIndicadoresForm vertente="pec" />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-yellow-700 uppercase tracking-wider">Inclusão Produtiva</h3>
              <MetasIndicadoresForm vertente="inclusao" />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wider">Psicossocial</h3>
              <MetasIndicadoresForm vertente="psico" />
            </div>
          </div>
        );
      default:
        return isMobile ? renderMobileDashboard() : renderDashboard();
    }
  };

  if (!isLeo && !demoMode) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white shadow-sm border-b border-gray-100">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/perfil")}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-bold text-black">Área Especial</h1>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6">
          <Card className="text-center border-red-200">
            <CardContent className="p-6">
              <div className="mb-4">
                <Lock className="w-16 h-16 mx-auto text-red-500 mb-4" />
                <Logo size="md" className="mx-auto mb-4" />
              </div>
              <h2 className="text-xl font-bold text-black mb-3">
                Acesso Ultra-Restrito
              </h2>
              <p className="text-gray-600 mb-4">
                Esta área é exclusiva para o super-administrador do sistema.
              </p>
              <Badge variant="destructive" className="mb-4">
                <Crown className="w-3 h-3 mr-1" />
                Acesso Especial Necessário
              </Badge>
              <p className="text-sm text-gray-500">
                Apenas o super-administrador pode acessar esta funcionalidade.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Mobile version - optimized layout with Drawer Menu
  if (isMobile) {
    return (
      <>
      <div className="min-h-screen bg-gray-50">
        {/* Overlay when drawer is open */}
        {isDrawerOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />
        )}

        {/* Side Drawer Menu */}
        <div
          className={`fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
            isDrawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Drawer Header */}
          <div className="bg-yellow-400 p-4 border-b border-yellow-500">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Crown className="w-6 h-6 text-black" />
                <div>
                  <h2 className="text-base font-bold text-black">
                    {devAccess.hasDevAccess ? "Dev - Leo" : "Leo Martins"}
                  </h2>
                  <p className="text-xs text-black/70">Super Admin</p>
                </div>
              </div>
              <Button
                onClick={() => setIsDrawerOpen(false)}
                variant="ghost"
                size="sm"
                className="text-black hover:bg-yellow-500 p-1"
              >
                ✕
              </Button>
            </div>
          </div>

          {/* Drawer Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            {/* Dashboard */}
            <div className="p-4 border-b">
              <button
                onClick={() => {
                  setActiveSection("dashboard");
                  setIsDrawerOpen(false);
                }}
                className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
                  activeSection === "dashboard"
                    ? "bg-yellow-400 text-black font-semibold"
                    : "hover:bg-gray-100 text-gray-900"
                }`}
              >
                <Home className="w-5 h-5 mr-3" />
                <span>Dashboard</span>
              </button>
            </div>

            {/* Programas */}
            <div className="p-4 border-b">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                Programas
              </h3>
              <div className="space-y-1">
                {sidebarItems
                  .filter((item) =>
                    [
                      "favela3d",
                      "inclusao",
                      "pec",
                      "psicossocial",
                      "negocios",
                      "investimento",
                      "marketing",
                    ].includes(item.id)
                  )
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id);
                        setIsDrawerOpen(false);
                      }}
                      className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-colors ${
                        activeSection === item.id
                          ? "bg-yellow-400 text-black font-semibold"
                          : "hover:bg-gray-100 text-gray-900"
                      }`}
                    >
                      {item.id === "favela3d" ? (
                        <img
                          src={favela3dLogo}
                          alt="Favela 3D"
                          className="w-5 h-5 mr-3"
                        />
                      ) : (
                        <item.icon className="w-5 h-5 mr-3" />
                      )}
                      <span className="text-sm whitespace-nowrap">{item.label}</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Comunidade */}
            <div className="p-4 border-b">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                Comunidade
              </h3>
              <div className="space-y-1">
                {sidebarItems
                  .filter((item) =>
                    ["doador", "patrocinador", "colaborador"].includes(
                      item.id
                    )
                  )
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id);
                        setIsDrawerOpen(false);
                      }}
                      className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-colors ${
                        activeSection === item.id
                          ? "bg-yellow-400 text-black font-semibold"
                          : "hover:bg-gray-100 text-gray-900"
                      }`}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      <span className="text-sm whitespace-nowrap">{item.label}</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Administração */}
            <div className="p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                Administração
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setActiveSection("conselho");
                    setIsDrawerOpen(false);
                  }}
                  className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-colors ${
                    activeSection === "conselho"
                      ? "bg-yellow-400 text-black font-semibold"
                      : "hover:bg-gray-100 text-gray-900"
                  }`}
                >
                  <Shield className="w-5 h-5 mr-3" />
                  <span className="text-sm">Conselho</span>
                </button>
                <button
                  onClick={() => {
                    setActiveSection("chamadas-auditoria");
                    setIsDrawerOpen(false);
                  }}
                  className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-colors ${
                    activeSection === "chamadas-auditoria"
                      ? "bg-yellow-400 text-black font-semibold"
                      : "hover:bg-gray-100 text-gray-900"
                  }`}
                >
                  <ClipboardList className="w-5 h-5 mr-3 text-orange-600" />
                  <span className="text-sm whitespace-nowrap">Auditoria Chamadas</span>
                </button>
                <button
                  onClick={() => {
                    setActiveSection("solicitacoes-exclusao");
                    setIsDrawerOpen(false);
                  }}
                  className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-colors ${
                    activeSection === "solicitacoes-exclusao"
                      ? "bg-yellow-400 text-black font-semibold"
                      : "hover:bg-gray-100 text-gray-900"
                  }`}
                >
                  <Trash2 className="w-5 h-5 mr-3 text-gray-900" />
                  <span className="text-sm whitespace-nowrap">Exclusões Chamadas</span>
                </button>
                <button
                  onClick={() => {
                    setActiveSection("lgpd-consentimentos");
                    setIsDrawerOpen(false);
                  }}
                  className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-colors ${
                    activeSection === "lgpd-consentimentos"
                      ? "bg-yellow-400 text-black font-semibold"
                      : "hover:bg-gray-100 text-gray-900"
                  }`}
                >
                  <Shield className="w-5 h-5 mr-3 text-indigo-700" />
                  <span className="text-sm whitespace-nowrap">Auditoria LGPD</span>
                </button>
                <button
                  onClick={() => {
                    setActiveSection("lgpd-ropa");
                    setIsDrawerOpen(false);
                  }}
                  className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-colors ${
                    activeSection === "lgpd-ropa"
                      ? "bg-yellow-400 text-black font-semibold"
                      : "hover:bg-gray-100 text-gray-900"
                  }`}
                >
                  <FileText className="w-5 h-5 mr-3 text-indigo-700" />
                  <span className="text-sm whitespace-nowrap">ROPA (LGPD)</span>
                </button>
                <button
                  onClick={() => {
                    setActiveSection("settings");
                    setIsDrawerOpen(false);
                  }}
                  className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-colors ${
                    activeSection === "settings"
                      ? "bg-yellow-400 text-black font-semibold"
                      : "hover:bg-gray-100 text-gray-900"
                  }`}
                >
                  <Settings className="w-5 h-5 mr-3" />
                  <span className="text-sm">Configurações</span>
                </button>
              </div>
            </div>
          </div>

          {/* Drawer Footer - Fixed Actions */}
          <div className="flex-shrink-0 bg-white border-t p-3">
            <button
              type="button"
              onClick={() => {
                openPrivacyPreferences();
                setIsDrawerOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-900 mb-1.5"
            >
              <Shield className="w-5 h-5 mr-3 text-yellow-600" />
              <span className="text-sm font-medium">Privacidade e cookies</span>
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem("preferAdminView");
                setLocation("/tdoador");
              }}
              className="flex items-center w-full px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-900 mb-1.5"
            >
              <Heart className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Modo Doador</span>
            </button>
            <button
              onClick={() => window.open('https://canaldetransparencia.institutoogrito.com.br', '_blank')}
              className="flex items-center w-full px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-900 mb-1.5"
            >
              <ExternalLink className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Canal de Transparência</span>
            </button>
            <button
              onClick={openGestaoVista}
              className="flex items-center w-full px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-900 mb-1.5"
            >
              <BarChart3 className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Dashboard Gestão à Vista</span>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center w-full px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-900 mb-1.5">
                  <ClipboardList className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">Plano de Ação</span>
                  <ChevronDown className="w-4 h-4 ml-auto" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem
                  onClick={() => window.open("https://monday.com/lang/pt", "_blank")}
                  className="cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Monday
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => window.open("https://slack.com/intl/pt-br/", "_blank")}
                  className="cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Slack
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-900"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Sair</span>
            </button>
          </div>
        </div>

        {/* Banner de acesso de desenvolvedor mobile */}
        {devAccess.hasDevAccess && (
          <div className="bg-blue-600 text-white px-4 py-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span>Modo Desenvolvedor Ativo</span>
              </div>
              {devAccess.shouldShowBackButton && (
                <Button
                  onClick={() => {
                    sessionStorage.setItem("dev_returning", "true");
                    setLocation("/dev");
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-blue-700 p-1"
                >
                  ← Dev
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Clean Mobile Header */}
        <header className="bg-white px-4 py-2 border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-black whitespace-nowrap">
                      {(sidebarItems.find((item) => item.id === activeSection)?.label || "Dashboard") + (activeSection === "colaborador" ? " - 2026" : "")}
                    </h2>
                    {(activeSection === "inclusao" || activeSection === "pec") && (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: new Date().getFullYear() - 2024 }, (_, i) => 2025 + i).map(ano => (
                          <Button key={ano} size="sm" variant={anoIndicadores === ano ? "default" : "outline"} className={`text-xs px-2 py-0.5 h-6 ${anoIndicadores === ano ? ("bg-yellow-500 hover:bg-yellow-600 text-white") : "text-black border-black/30"}`} onClick={() => setAnoIndicadores(ano)}>{ano}</Button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-black/70">
                    {devAccess.hasDevAccess ? "Dev Mode" : "Admin"}
                  </p>
                </div>
              </div>
            </div>
            {demoMode && (
              <Badge className="bg-blue-600 text-white text-xs px-2 py-1">
                Demo
              </Badge>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="pb-20 px-4 pt-4">
          {renderSectionContent()}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-black z-30" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="flex">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex-1 flex flex-col items-center gap-0.5 pt-2 pb-3 transition-colors text-white/50"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[9px] font-medium leading-tight">Menu</span>
            </button>
            <button
              onClick={() => setActiveSection("dashboard")}
              className={`flex-1 flex flex-col items-center gap-0.5 pt-2 pb-3 transition-colors ${
                activeSection === "dashboard"
                  ? "text-yellow-400"
                  : "text-white/50"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-[9px] font-medium leading-tight">Dashboard</span>
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem("preferAdminView");
                setLocation("/tdoador");
              }}
              className="flex-1 flex flex-col items-center gap-0.5 pt-2 pb-3 transition-colors text-white/50"
            >
              <Heart className="w-5 h-5" />
              <span className="text-[9px] font-medium leading-tight">Doador</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 flex flex-col items-center gap-0.5 pt-2 pb-3 transition-colors text-white/50"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-[9px] font-medium leading-tight">Sair</span>
            </button>
          </div>
        </div>
      </div>

      {/* Gestão à Vista — Overlay Fullscreen (mobile) */}
      {showGestaoVista && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#0f172a" }}>
          <div className="gestao-vista-landscape-wrapper">
            <DashboardGestaoVista onClose={closeGestaoVista} />
          </div>
        </div>
      )}
      </>
    );
  }

  // Desktop version - original layout
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Banner de acesso de desenvolvedor */}
      {devAccess.hasDevAccess && (
        <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white px-4 py-2 text-sm z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              <span>
                Modo Desenvolvedor - Acesso universal ativo (Leo Martins
                Dashboard)
              </span>
            </div>
            {devAccess.shouldShowBackButton && (
              <Button
                onClick={() => {
                  sessionStorage.setItem("dev_returning", "true");
                  setLocation("/dev");
                }}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-blue-700"
              >
                ← Voltar ao Painel Dev
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`w-64 bg-white text-black flex flex-col fixed h-screen z-10 overflow-y-auto border-r border-gray-200 ${
          devAccess.hasDevAccess ? "mt-10" : ""
        }`}
      >
        <div className="p-4 border-b border-yellow-600">
          <div className="flex items-center space-x-3">
            <Crown className="w-8 h-8 text-black" />
            <div>
              <h1 className="text-lg font-bold text-black">
                {devAccess.hasDevAccess
                  ? "Desenvolvedor - Leo Dashboard"
                  : "Clube do Grito"}
              </h1>
              <p className="text-sm text-black">
                {devAccess.hasDevAccess ? "Acesso Total" : "Admin Dashboard"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 pb-16 overflow-y-auto">
          {/* Botão para voltar à área de doador */}
          <div className="px-4 mb-6">
            <Button
              onClick={() => setLocation("/tdoador")}
              variant="outline"
              size="sm"
              className="w-full justify-start border-yellow-400 text-black hover:bg-yellow-50"
              data-testid="button-voltar-doador-desktop"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Área de Doador
            </Button>
          </div>

          <div className="px-4 mb-4">
            <h3 className="text-xs font-semibold text-black uppercase tracking-wider">
              Acesso Rápido
            </h3>
          </div>

          {sidebarItems
            .filter((item) => item.section === "main")
            .map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  activeSection === item.id
                    ? "text-black"
                    : "text-black hover:bg-gray-100"
                }`}
                style={
                  activeSection === item.id
                    ? { backgroundColor: "#FFF3CD" }
                    : {}
                }
              >
                {item.id === "favela3d" ? (
                  <img
                    src={favela3dLogo}
                    alt="Favela 3D Logo"
                    className="w-6 h-6 mr-3"
                  />
                ) : (
                  <item.icon className="w-6 h-6 mr-3" />
                )}
                {item.label}
              </button>
            ))}

          <div className="px-4 mt-6 mb-4">
            <h3 className="text-xs font-semibold text-black uppercase tracking-wider">
              Comunidade e Apoio
            </h3>
          </div>

          {sidebarItems
            .filter((item) => item.section === "data")
            .map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  activeSection === item.id
                    ? "text-black"
                    : "text-black hover:bg-gray-100"
                }`}
                style={
                  activeSection === item.id
                    ? { backgroundColor: "#FFF3CD" }
                    : {}
                }
              >
                {item.id === "favela3d" ? (
                  <img
                    src={favela3dLogo}
                    alt="Favela 3D Logo"
                    className="w-6 h-6 mr-3"
                  />
                ) : (
                  <item.icon className="w-6 h-6 mr-3" />
                )}
                {item.label}
              </button>
            ))}

          <div className="px-4 mt-6 mb-4">
            <h3 className="text-xs font-semibold text-black uppercase tracking-wider">
              Programas
            </h3>
          </div>

          {sidebarItems
            .filter((item) => item.section === "gestao")
            .map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  activeSection === item.id
                    ? "text-black"
                    : "text-black hover:bg-gray-100"
                }`}
                style={
                  activeSection === item.id
                    ? { backgroundColor: "#FFF3CD" }
                    : {}
                }
              >
                {item.id === "favela3d" ? (
                  <img
                    src={favela3dLogo}
                    alt="Favela 3D Logo"
                    className="w-6 h-6 mr-3"
                  />
                ) : (
                  <item.icon className="w-6 h-6 mr-3 text-gray-900" />
                )}
                <span className="text-gray-900">
                  {item.label}
                </span>
              </button>
            ))}
          <div className="px-4 mt-6 mb-4">
            <h3 className="text-xs font-semibold text-black uppercase tracking-wider">
              Administração
            </h3>
          </div>

          {sidebarItems
            .filter((item) => item.section === "admin")
            .map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  activeSection === item.id
                    ? "text-black"
                    : "text-black hover:bg-gray-100"
                }`}
                style={
                  activeSection === item.id
                    ? { backgroundColor: "#FFF3CD" }
                    : {}
                }
              >
                {item.id === "favela3d" ? (
                  <img
                    src={favela3dLogo}
                    alt="Favela 3D Logo"
                    className="w-6 h-6 mr-3"
                  />
                ) : (
                  <item.icon className={`w-6 h-6 mr-3 ${item.color || "text-gray-900"}`} />
                )}
                <span className="text-gray-900">
                  {item.label}
                </span>
              </button>
            ))}

          <div className="px-4 mt-6 mb-4">
            <h3 className="text-xs font-semibold text-black uppercase tracking-wider">
              Sistema
            </h3>
          </div>

          <button
            onClick={() => setActiveSection("settings")}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
              activeSection === "settings"
                ? "text-black"
                : "text-black hover:bg-gray-100"
            }`}
            style={
              activeSection === "settings" ? { backgroundColor: "#FFF3CD" } : {}
            }
          >
            <Settings className="w-6 h-6 mr-3" />
            Configurações
          </button>

          <button
            type="button"
            onClick={() => openPrivacyPreferences()}
            className="w-full flex items-center px-6 py-3 text-sm font-medium transition-colors text-black hover:bg-gray-100"
          >
            <Shield className="w-6 h-6 mr-3 text-yellow-600" />
            Privacidade e cookies
          </button>

          <button
            onClick={() => window.open("https://canaldetransparencia.institutoogrito.com.br", "_blank")}
            className="w-full flex items-center px-6 py-3 text-sm font-medium transition-colors bg-white hover:bg-gray-50 text-black"
          >
            <ExternalLink className="w-6 h-6 mr-3 text-yellow-500" />
            Canal de Transparência
          </button>

          <button
            onClick={openGestaoVista}
            className="w-full flex items-center px-6 py-3 text-sm font-medium transition-colors bg-white hover:bg-gray-50 text-black"
          >
            <BarChart3 className="w-6 h-6 mr-3 text-yellow-500" />
            Dashboard Gestão à Vista
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-full flex items-center px-6 py-3 text-sm font-medium transition-colors bg-white hover:bg-gray-50 text-black"
              >
                <ClipboardList className="w-6 h-6 mr-3 text-blue-500" />
                Plano de Ação
                <ChevronDown className="w-4 h-4 ml-auto text-blue-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onClick={() => window.open("https://monday.com/lang/pt", "_blank")}
                className="cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Monday
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.open("https://slack.com/intl/pt-br/", "_blank")}
                className="cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Slack
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col ml-64 min-w-0 overflow-x-hidden ${
          devAccess.hasDevAccess ? "mt-10" : ""
        }`}
      >
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {(sidebarItems.find((item) => item.id === activeSection)?.label || "Dashboard") + (activeSection === "colaborador" ? " - 2026" : "")}
              </h1>
              {(activeSection === "inclusao" || activeSection === "pec") && (
                <div className="flex items-center gap-2">
                  {Array.from({ length: new Date().getFullYear() - 2024 }, (_, i) => 2025 + i).map(ano => (
                    <Button key={ano} size="sm" variant={anoIndicadores === ano ? "default" : "outline"} className={anoIndicadores === ano ? ("bg-yellow-500 hover:bg-yellow-600 text-white") : ""} onClick={() => setAnoIndicadores(ano)}>{ano}</Button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {devAccess.hasDevAccess && (
                <Badge className="bg-blue-600 text-white">
                  <Code className="w-3 h-3 mr-1" />
                  Developer
                </Badge>
              )}
              <Badge className="bg-yellow-600 text-white">
                <Crown className="w-3 h-3 mr-1" />
                Super Admin
              </Badge>
              {demoMode && (
                <Badge className="bg-blue-600 text-white ml-2">Demo</Badge>
              )}
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {new Date().toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <LgpdLegalHeaderButtons />
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-x-hidden">{renderSectionContent()}</main>
      </div>

      {/* Gestão à Vista — Overlay Fullscreen */}
      {showGestaoVista && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#0f172a" }}>
          <div className="gestao-vista-landscape-wrapper">
            <DashboardGestaoVista onClose={closeGestaoVista} />
          </div>
        </div>
      )}
    </div>
  );
}
