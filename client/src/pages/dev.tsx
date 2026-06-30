import React, { useState, useEffect } from 'react';
import { clearLocalStoragePreservingLgpd } from "@/lib/auth-session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Monitor, 
  Users, 
  Clock, 
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Search,
  Calendar,
  LogOut,
  Key,
  ExternalLink,
  Mail,
  Phone,
  Shield,
  User,
  FileText,
  Activity,
  Radio
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PrivacyConsentsAuditSection from "@/components/dev/PrivacyConsentsAuditSection";
import ChamadaAuditoriaSection from "@/components/presenca/ChamadaAuditoriaSection";
import LgpdObservabilitySection from "@/components/dev/LgpdObservabilitySection";
import DinamizeObservabilitySection from "@/components/dev/DinamizeObservabilitySection";
import { LgpdLegalHeaderButtons } from "@/components/LgpdLegalMenuSection";
import { PushNotificationSettings } from "@/components/PushNotificationSettings";

type DevTab = "usuarios" | "telas" | "consentimentos" | "observabilidade" | "dinamize" | "chamadas";

function getInitialDevTab(): DevTab {
  if (typeof window === "undefined") return "usuarios";
  const tab = new URLSearchParams(window.location.search).get("tab");
  if (
    tab === "consentimentos" ||
    tab === "observabilidade" ||
    tab === "chamadas" ||
    tab === "dinamize" ||
    tab === "telas" ||
    tab === "usuarios"
  ) {
    return tab;
  }
  return "usuarios";
}

interface SistemaTela {
  id: number;
  nome: string;
  titulo: string;
  rota: string;
  status: string;
  descricao: string;
  modulo: string;
  tipo: string;
  ultimaAtualizacao: string;
  atualizadoPor?: string;
  responseMs?: number | null;
  ultimoHealthCheck?: string | null;
}

interface SistemaUsuario {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  tipo: string;
  papel: string;
  verificado: boolean;
  ativo: boolean;
  plano: string;
  dataCadastro: string;
  ultimoAcesso: string;
  telasAcesso: string[];
  totalAcessos: number;
  ultimaAtividade: string;
  fonte: string;
}

interface TelaHistorico {
  id: number;
  telaId: number;
  tipoAlteracao: string;
  descricao: string;
  responsavel: string;
  dataAlteracao: string;
}

const PAPEL_COLORS: Record<string, string> = {
  monitor_pec: 'bg-yellow-100 text-yellow-800',
  monitor_inclusao: 'bg-cyan-100 text-cyan-800',
  monitor_psico: 'bg-purple-100 text-purple-800',
  coordenador_pec: 'bg-yellow-200 text-yellow-900',
  coordenador_inclusao: 'bg-cyan-200 text-cyan-900',
  coordenador_psico: 'bg-purple-200 text-purple-900',
  tecnica_psico: 'bg-violet-200 text-violet-900',
  professor: 'bg-green-100 text-green-800',
  professor_pec: 'bg-green-100 text-green-800',
  professor_inclusao: 'bg-emerald-100 text-emerald-800',
  professor_psico: 'bg-violet-100 text-violet-800',
  aluno: 'bg-gray-100 text-gray-800',
  student: 'bg-gray-100 text-gray-700',
  doador: 'bg-amber-100 text-amber-800',
  admin: 'bg-red-100 text-red-800',
  leo: 'bg-red-200 text-red-900',
  desenvolvedor: 'bg-yellow-100 text-yellow-800',
  dev: 'bg-yellow-100 text-yellow-800',
  'dev-marketing': 'bg-pink-100 text-pink-800',
  patrocinador: 'bg-orange-100 text-orange-800',
  patrocinador_2026: 'bg-orange-100 text-orange-800',
  conselho: 'bg-teal-100 text-teal-800',
  monitor: 'bg-yellow-50 text-yellow-700',
  coordenador: 'bg-yellow-50 text-yellow-700',
};

function getPapelColor(papel: string): string {
  return PAPEL_COLORS[papel] || 'bg-gray-100 text-gray-700';
}

/** URL para abrir tela em nova aba a partir do painel dev (marca origem para UI/auditoria). */
function getDevUrl(rota: string): string {
  const path = rota.startsWith('/') ? rota : `/${rota}`;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}origin=dev_panel`;
}

function markDevPanelOpen(): void {
  localStorage.setItem('dev_panel_active', 'true');
  localStorage.setItem('dev_panel_timestamp', String(Date.now()));
}

function getPapelLabel(papel: string): string {
  const labels: Record<string, string> = {
    monitor_pec: 'Monitor PEC',
    monitor_inclusao: 'Monitor Inclusão',
    monitor_psico: 'Monitor Psico',
    coordenador_pec: 'Coord. PEC',
    coordenador_inclusao: 'Coord. Inclusão',
    coordenador_psico: 'Coord. Psico',
    tecnica_psico: 'Técnica Psico',
    professor: 'Professor',
    professor_pec: 'Prof. PEC',
    professor_inclusao: 'Prof. Inclusão',
    professor_psico: 'Prof. Psico',
    aluno: 'Aluno',
    student: 'Aluno',
    doador: 'Doador',
    admin: 'Admin',
    leo: 'Leo (Super)',
    desenvolvedor: 'Dev',
    dev: 'Dev',
    'dev-marketing': 'Dev Marketing',
    patrocinador: 'Patrocinador',
    patrocinador_2026: 'Patrocinador',
    conselho: 'Conselho',
    user: 'Usuário',
    responsavel: 'Responsável',
    monitor: 'Monitor',
    coordenador: 'Coordenador',
  };
  return labels[papel] || papel;
}

export default function DevPanel() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // ── Estados da aba ──
  const [activeTab, setActiveTab] = useState<DevTab>(getInitialDevTab);

  // ── Estados da aba Usuários ──
  const [selectedUsuario, setSelectedUsuario] = useState<SistemaUsuario | null>(null);
  const [searchUsuarios, setSearchUsuarios] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  // ── Estados da aba Telas ──
  const [selectedTela, setSelectedTela] = useState<SistemaTela | null>(null);
  const [searchTelas, setSearchTelas] = useState('');
  const [searchHistorico, setSearchHistorico] = useState('');
  const [showHistorico, setShowHistorico] = useState(false);

  // ── Outros estados ──
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ── Sincroniza ?tab= na URL ──
  useEffect(() => {
    const url = new URL(window.location.href);
    if (activeTab === "usuarios") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", activeTab);
    }
    const search = url.searchParams.toString();
    window.history.replaceState({}, "", search ? `${url.pathname}?${search}` : url.pathname);
  }, [activeTab]);

  // ── Limpeza ao trocar de aba ──
  useEffect(() => {
    if (activeTab === 'usuarios') {
      setSelectedTela(null);
      setSearchTelas('');
      setShowHistorico(false);
    } else if (activeTab === 'telas') {
      setSelectedUsuario(null);
      setSearchUsuarios('');
      setFiltroTipo('todos');
    } else if (activeTab === 'consentimentos' || activeTab === 'observabilidade' || activeTab === 'dinamize' || activeTab === 'chamadas') {
      setSelectedUsuario(null);
      setSelectedTela(null);
      setSearchUsuarios('');
      setSearchTelas('');
      setFiltroTipo('todos');
      setShowHistorico(false);
    }
  }, [activeTab]);

  // ── Queries ──
  const { data: usuarios = [], isLoading: usuariosLoading, error: usuariosError, refetch: refetchUsuarios } = useQuery({
    queryKey: ['/api/dev/users'],
    queryFn: async () => {
      const r = await fetch('/api/dev/users');
      if (!r.ok) throw new Error('Falha ao carregar usuários');
      return await r.json() as SistemaUsuario[];
    },
    enabled: activeTab === 'usuarios',
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
  });

  const { data: telas = [], isLoading: telasLoading, error: telasError, refetch: refetchTelas } = useQuery({
    queryKey: ['/api/dev/telas'],
    queryFn: async () => {
      const r = await fetch('/api/dev/telas?t=' + Date.now());
      if (!r.ok) throw new Error('Falha ao carregar telas');
      return await r.json() as SistemaTela[];
    },
    enabled: activeTab === 'telas',
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    if (usuariosError) toast({ title: "Erro ao carregar usuários", description: "Não foi possível buscar a lista de usuários.", variant: "destructive" });
  }, [usuariosError]);

  useEffect(() => {
    if (telasError) toast({ title: "Erro ao carregar telas", description: "Não foi possível buscar a lista de telas.", variant: "destructive" });
  }, [telasError]);

  const [recheckLoading, setRecheckLoading] = useState(false);
  const handleRecheck = async () => {
    setRecheckLoading(true);
    try {
      const r = await fetch('/api/dev/telas/recheck', { method: 'POST' });
      if (!r.ok) throw new Error('Falha ao iniciar verificação');
      await new Promise(r => setTimeout(r, 8000));
      await refetchTelas();
    } catch (err: any) {
      toast({ title: "Erro na verificação", description: err.message || "Não foi possível verificar as telas.", variant: "destructive" });
    } finally {
      setRecheckLoading(false);
    }
  };

  const { data: telaHistorico = [], isLoading: historicoLoading } = useQuery<TelaHistorico[]>({
    queryKey: ['/api/dev/tela-historico', selectedTela?.id],
    enabled: !!selectedTela && activeTab === 'telas',
  });

  const { data: enrolledCount = { pec: 0, inclusao: 0, total: 0 } } = useQuery<{ pec: number; inclusao: number; total: number }>({
    queryKey: ['/api/dev/enrolled-count'],
    queryFn: async () => {
      const r = await fetch('/api/dev/enrolled-count');
      if (!r.ok) return { pec: 0, inclusao: 0, total: 0 };
      return r.json();
    },
    staleTime: 60000,
  });

  // ── Mudar senha ──
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Erro", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Erro", description: "A senha deve ter no mínimo 8 caracteres.", variant: "destructive" });
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      toast({ title: "Erro", description: "A senha deve conter pelo menos uma letra maiúscula.", variant: "destructive" });
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      toast({ title: "Erro", description: "A senha deve conter pelo menos um número.", variant: "destructive" });
      return;
    }
    setIsChangingPassword(true);
    try {
      await apiRequest('/api/dev/alterar-senha', {
        method: 'POST',
        body: JSON.stringify({ senhaAtual: currentPassword, novaSenha: newPassword }),
        headers: { 'Content-Type': 'application/json' }
      });
      toast({ title: "Senha alterada!", description: "Senha alterada com sucesso. Você será desconectado." });
      setTimeout(() => { clearLocalStoragePreservingLgpd(); setLocation('/'); }, 2000);
    } catch (error: any) {
      toast({ title: "Erro ao alterar senha", description: error.message || "Ocorreu um erro.", variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // ── Helpers de status ──
  const getStatusColor = (status: string) => {
    if (status === 'OK') return 'bg-green-500';
    if (status === 'Em atenção') return 'bg-yellow-500';
    if (status === 'Erro') return 'bg-red-500';
    return 'bg-gray-500';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'OK') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (status === 'Em atenção') return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    if (status === 'Erro') return <XCircle className="w-4 h-4 text-red-600" />;
    return <Monitor className="w-4 h-4 text-gray-600" />;
  };

  const abrirTela = (rota: string) => {
    if (rota === '/dev/marketing') { setLocation(rota); return; }
    const novaAba = window.open(rota, '_blank');
    if (!novaAba) {
      toast({
        title: "Popup bloqueado",
        description: "Permita popups para este site ou clique com botão direito e abra em nova aba.",
        variant: "destructive",
        duration: 6000,
      });
    }
  };

  // ── Filtros de usuários ──
  const tiposDisponiveis = Array.from(new Set(usuarios.map((u: SistemaUsuario) => u.papel || u.tipo))).sort();

  const usuariosFiltrados = usuarios
    .filter((u: SistemaUsuario) => {
      const matchBusca =
        (u.nome || '').toLowerCase().includes(searchUsuarios.toLowerCase()) ||
        (u.telefone || '').includes(searchUsuarios) ||
        (u.email || '').toLowerCase().includes(searchUsuarios.toLowerCase()) ||
        (u.papel || u.tipo || '').toLowerCase().includes(searchUsuarios.toLowerCase());
      const matchTipo = filtroTipo === 'todos' || (u.papel || u.tipo) === filtroTipo;
      return matchBusca && matchTipo;
    })
    .sort((a: SistemaUsuario, b: SistemaUsuario) =>
      (a.nome || '').localeCompare(b.nome || '', 'pt-BR')
    );

  // Contagem por tipo para stats
  const contaPorTipo = usuarios.reduce((acc: Record<string, number>, u: SistemaUsuario) => {
    const t = u.papel || u.tipo || 'user';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  // Equipe: exclui conta de teste (Dev Clube, tipo=aluno) e duplicata (Professor Emily)
  const usuariosEquipe = usuarios.filter((u: SistemaUsuario) =>
    u.tipo !== 'aluno' && u.nome !== 'Professor Emily'
  );
  const contaPorTipoEquipe = usuariosEquipe.reduce((acc: Record<string, number>, u: SistemaUsuario) => {
    const t = u.papel || u.tipo || 'user';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const { data: stripeCount } = useQuery<{ count: number }>({
    queryKey: ['/api/dev/stripe/active-count'],
    queryFn: async () => {
      const r = await fetch('/api/dev/stripe/active-count');
      if (!r.ok) throw new Error('Falha');
      return r.json();
    },
    staleTime: 60_000,
  });

  // Doadores ativos = assinaturas ativas na Stripe (fonte mais precisa)
  const doadoresAtivos = stripeCount?.count ?? usuarios.filter((u: SistemaUsuario) =>
    (u.papel === 'doador' || u.tipo === 'doador') && u.ativo
  ).length;

  // ── Filtros de telas ──
  const telasFiltradas = telas.filter((t: SistemaTela) => {
    const s = searchTelas.toLowerCase();
    return t.titulo.toLowerCase().includes(s) || t.nome.toLowerCase().includes(s) ||
      t.rota.toLowerCase().includes(s) || t.modulo.toLowerCase().includes(s);
  });

  const historicoFiltrado = telaHistorico.filter((e: TelaHistorico) =>
    e.descricao.toLowerCase().includes(searchHistorico.toLowerCase()) ||
    e.tipoAlteracao.toLowerCase().includes(searchHistorico.toLowerCase()) ||
    e.responsavel.toLowerCase().includes(searchHistorico.toLowerCase())
  );

  // ── Render aba Usuários ──
  const renderUsuarios = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <div className="lg:col-span-2 space-y-4">
        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Total', value: (enrolledCount.total || 0) + (doadoresAtivos || 0) + ((contaPorTipoEquipe['professor_pec'] || 0) + (contaPorTipoEquipe['professor_inclusao'] || 0) + (contaPorTipoEquipe['professor_psico'] || 0) + (contaPorTipoEquipe['professor'] || 0) + (contaPorTipoEquipe['monitor_pec'] || 0) + (contaPorTipoEquipe['monitor_inclusao'] || 0) + (contaPorTipoEquipe['monitor_psico'] || 0) + (contaPorTipoEquipe['monitor'] || 0) + (contaPorTipoEquipe['coordenador_pec'] || 0) + (contaPorTipoEquipe['coordenador_inclusao'] || 0) + (contaPorTipoEquipe['coordenador_psico'] || 0) + (contaPorTipoEquipe['coordenador'] || 0)), color: 'bg-gray-100 text-gray-800' },
            { label: 'Alunos em turmas', value: enrolledCount.total, color: 'bg-gray-100 text-gray-800' },
            { label: 'Doadores ativos', value: doadoresAtivos, color: 'bg-gray-100 text-gray-800' },
            { label: 'Equipe', value: (contaPorTipoEquipe['professor_pec'] || 0) + (contaPorTipoEquipe['professor_inclusao'] || 0) + (contaPorTipoEquipe['professor_psico'] || 0) + (contaPorTipoEquipe['professor'] || 0) + (contaPorTipoEquipe['monitor_pec'] || 0) + (contaPorTipoEquipe['monitor_inclusao'] || 0) + (contaPorTipoEquipe['monitor_psico'] || 0) + (contaPorTipoEquipe['monitor'] || 0) + (contaPorTipoEquipe['coordenador_pec'] || 0) + (contaPorTipoEquipe['coordenador_inclusao'] || 0) + (contaPorTipoEquipe['coordenador_psico'] || 0) + (contaPorTipoEquipe['coordenador'] || 0), color: 'bg-gray-100 text-gray-800' },
          ].map(s => (
            <div key={s.label} className={`rounded-lg p-3 text-center ${s.color}`}>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="w-5 h-5" />
              Usuários do Sistema
              <Badge className="bg-yellow-400 text-black text-xs">{usuariosFiltrados.length}</Badge>
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nome, telefone, email, papel..."
                  value={searchUsuarios}
                  onChange={e => setSearchUsuarios(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-full sm:w-44 text-sm">
                  <SelectValue placeholder="Filtrar por papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os papéis</SelectItem>
                  {tiposDisponiveis.map(t => (
                    <SelectItem key={t} value={t}>{getPapelLabel(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => refetchUsuarios()} title="Atualizar">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {usuariosLoading ? (
              <div className="text-center py-8 text-gray-500">Carregando usuários...</div>
            ) : usuariosError ? (
              <div className="text-center py-8 text-red-600">Erro ao carregar usuários</div>
            ) : usuariosFiltrados.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Nenhum usuário encontrado</div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto overscroll-contain pr-1">
                {usuariosFiltrados.map((usuario: SistemaUsuario, index: number) => (
                  <div
                    key={`user-${usuario.id}-${index}`}
                    onClick={() => setSelectedUsuario(prev => prev?.id === usuario.id ? null : usuario)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedUsuario?.id === usuario.id
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{usuario.nome || 'Nome não disponível'}</p>
                        <p className="text-xs text-gray-500 truncate">{usuario.telefone}</p>
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getPapelColor(usuario.papel || usuario.tipo)}`}>
                            {getPapelLabel(usuario.papel || usuario.tipo)}
                          </span>
                          <Badge className={`text-xs h-4 px-1 ${usuario.ativo ? 'bg-yellow-400 text-black' : 'bg-red-500 text-white'}`}>
                            {usuario.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                          {usuario.fonte && usuario.fonte !== 'users' && (
                            <Badge variant="outline" className="text-xs h-4 px-1 bg-yellow-50">{usuario.fonte}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-500">{usuario.telasAcesso?.length || 0} telas</p>
                        {usuario.dataCadastro && (
                          <p className="text-xs text-gray-400">
                            {new Date(usuario.dataCadastro).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Painel de detalhes */}
      <div>
        {selectedUsuario ? (
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{selectedUsuario.nome}</CardTitle>
                  <CardDescription className="mt-0.5">ID #{selectedUsuario.id}</CardDescription>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${getPapelColor(selectedUsuario.papel || selectedUsuario.tipo)}`}>
                  {getPapelLabel(selectedUsuario.papel || selectedUsuario.tipo)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{selectedUsuario.telefone || '—'}</span>
                </div>
                {selectedUsuario.email && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{selectedUsuario.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-700">
                  <Shield className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>
                    {selectedUsuario.ativo ? (
                      <span className="text-green-700 font-medium">Ativo</span>
                    ) : (
                      <span className="text-red-600 font-medium">Inativo</span>
                    )}
                    {selectedUsuario.verificado && <span className="text-gray-500 ml-1">• Verificado</span>}
                  </span>
                </div>
                {selectedUsuario.plano && selectedUsuario.plano !== 'eco' && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>Plano: <strong>{selectedUsuario.plano}</strong></span>
                  </div>
                )}
                {selectedUsuario.dataCadastro && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>Cadastro: {new Date(selectedUsuario.dataCadastro).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
                {selectedUsuario.fonte && (
                  <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                    Fonte: {selectedUsuario.fonte}
                  </div>
                )}
              </div>

              <div>
                <p className="font-medium text-gray-700 mb-2">Telas de acesso ({selectedUsuario.telasAcesso?.length || 0})</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {selectedUsuario.telasAcesso && selectedUsuario.telasAcesso.length > 0 ? (
                    selectedUsuario.telasAcesso.map((rota, i) => (
                      <div key={i} className="flex items-center gap-2 p-1.5 bg-gray-50 rounded text-xs">
                        <Monitor className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="text-gray-700 font-mono">{rota}</span>
                        <button
                          onClick={() => abrirTela(rota)}
                          className="ml-auto text-yellow-600 hover:text-yellow-800 shrink-0"
                          title="Abrir tela"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-xs text-center py-2">Nenhuma tela configurada</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Clique em um usuário para ver os detalhes</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  // ── Render aba Telas ──
  const renderTelas = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 flex-wrap">
              <Monitor className="w-5 h-5" />
              Todas as Telas do Sistema
              <Badge className="bg-yellow-400 text-black text-xs">{telasFiltradas.length} telas</Badge>
              <button
                onClick={handleRecheck}
                disabled={recheckLoading}
                className="ml-auto inline-flex items-center gap-1 px-2 py-1 text-xs rounded border bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 font-medium disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${recheckLoading ? 'animate-spin' : ''}`} />
                {recheckLoading ? 'Verificando...' : 'Verificar Agora'}
              </button>
            </CardTitle>
            <CardDescription>Lista completa incluindo telas restritas — Acesso via Dev Panel</CardDescription>
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Pesquisar por nome, rota ou módulo..."
                value={searchTelas}
                onChange={e => setSearchTelas(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {telasLoading ? (
              <div className="text-center py-8 text-gray-500">Carregando telas...</div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto overscroll-contain">
                {telasFiltradas.map((tela: SistemaTela) => (
                  <div
                    key={tela.id}
                    onClick={() => setSelectedTela(prev => prev?.id === tela.id ? null : tela)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTela?.id === tela.id
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-3 h-3 rounded-full shrink-0 ${getStatusColor(tela.status)}`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium text-gray-900">{tela.titulo}</h3>
                            <Badge
                              className={`text-xs ${tela.tipo === 'Restrito' ? 'bg-red-500 text-white' : tela.tipo === 'Público' ? 'bg-yellow-400 text-black' : 'bg-gray-400 text-white'}`}
                            >
                              {tela.tipo}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 truncate">{tela.rota} • {tela.modulo}</p>
                          <p className="text-xs text-gray-400 truncate">{tela.descricao}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="flex items-center gap-2 mb-1">
                          <a
                            href={tela.rota}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => {
                              e.stopPropagation();
                              markDevPanelOpen();
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border bg-yellow-400 border-yellow-400 text-black hover:bg-yellow-500 font-medium"
                          >
                            <Eye className="w-3 h-3" />
                            Dev Access
                          </a>
                          <Badge className={`${
                            tela.status === 'OK' ? 'bg-green-500 text-white' :
                            tela.status === 'Verificando' ? 'bg-gray-400 text-white' :
                            tela.status === 'Em atenção' ? 'bg-yellow-500 text-black' :
                            'bg-red-500 text-white'
                          }`}>
                            {tela.status === 'Verificando' ? '...' : tela.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(tela.ultimaAtualizacao).toLocaleDateString('pt-BR')}
                          {tela.responseMs != null && (
                            <span className="ml-1 text-gray-400">· {tela.responseMs}ms</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detalhes da tela */}
      <div>
        {selectedTela ? (
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">{selectedTela.titulo}</CardTitle>
              <CardDescription>Detalhes e histórico</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Status Atual</Label>
                <div className="flex items-center mt-1 gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedTela.status)}`} />
                  <span className="font-medium">{selectedTela.status}</span>
                </div>
              </div>

              <div>
                <Label>Informações</Label>
                <div className="space-y-1 mt-2 text-sm">
                  <p><strong>Rota:</strong> <span className="font-mono text-xs bg-gray-100 px-1 rounded">{selectedTela.rota}</span></p>
                  <p><strong>Módulo:</strong> {selectedTela.modulo}</p>
                  <p><strong>Tipo:</strong> {selectedTela.tipo}</p>
                </div>
              </div>

              <div>
                <Label>Última Atualização</Label>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(selectedTela.ultimaAtualizacao).toLocaleString('pt-BR')}
                  {selectedTela.atualizadoPor && ` por ${selectedTela.atualizadoPor}`}
                </p>
              </div>

              {selectedTela.descricao && (
                <div>
                  <Label>Descrição</Label>
                  <p className="text-sm text-gray-600 mt-1">{selectedTela.descricao}</p>
                </div>
              )}


              <a
                href={selectedTela.rota}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => markDevPanelOpen()}
                className="flex items-center justify-center w-full gap-2 px-3 py-2 text-sm font-medium rounded-md bg-yellow-400 text-black hover:bg-yellow-500"
              >
                <Eye className="w-4 h-4" />
                Abrir Tela em Nova Aba
              </a>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-gray-400">
              <Monitor className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Clique em uma tela para ver os detalhes</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Painel do Desenvolvedor</h1>
            <p className="text-gray-500 text-sm mt-0.5 hidden sm:block">Ferramentas de monitoramento e desenvolvimento</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="default" onClick={() => setShowChangePassword(true)} className="text-xs bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-400">
              <Key className="w-3 h-3 mr-1" />Mudar Senha
            </Button>
            <Button variant="outline" onClick={() => window.open('https://canaldetransparencia.institutoogrito.com.br', '_blank')} className="text-xs bg-yellow-400 text-black hover:bg-yellow-500 border-yellow-400">
              <ExternalLink className="w-3 h-3 mr-1" />Canal de Transparência
            </Button>
            <LgpdLegalHeaderButtons
              buttonClassName="text-xs bg-yellow-400 text-black hover:bg-yellow-500 border-yellow-400"
            />
            <Button variant="destructive" onClick={() => { clearLocalStoragePreservingLgpd(); sessionStorage.clear(); setLocation('/dev/login'); }} className="text-xs">
              <LogOut className="w-3 h-3 mr-1" />Sair
            </Button>
          </div>
        </div>

        <div className="mb-4 max-w-xl">
          <PushNotificationSettings variant="panel" />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6">
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'usuarios' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Usuários do Sistema
              {usuarios.length > 0 && <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{usuarios.length}</span>}
            </button>
            <button
              onClick={() => setActiveTab('telas')}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'telas' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Monitor className="w-4 h-4 inline mr-2" />
              Status das Telas
            </button>
            <button
              onClick={() => setActiveTab('consentimentos')}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'consentimentos' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Consentimentos LGPD
            </button>
            <button
              onClick={() => setActiveTab('observabilidade')}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'observabilidade' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Activity className="w-4 h-4 inline mr-2" />
              Observabilidade LGPD
            </button>
            <button
              onClick={() => setActiveTab('chamadas')}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'chamadas' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Auditoria Chamadas
            </button>
            <button
              onClick={() => setActiveTab('dinamize')}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'dinamize' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Radio className="w-4 h-4 inline mr-2" />
              Dinamize
            </button>
          </nav>
        </div>
      </div>

      {/* Conteúdo da aba */}
      <div className="overflow-hidden">
        {activeTab === 'usuarios' && renderUsuarios()}
        {activeTab === 'telas' && renderTelas()}
        {activeTab === 'consentimentos' && (
          <PrivacyConsentsAuditSection active />
        )}
        {activeTab === 'observabilidade' && (
          <LgpdObservabilitySection active />
        )}
        {activeTab === 'dinamize' && (
          <DinamizeObservabilitySection active />
        )}
        {activeTab === 'chamadas' && (
          <div className="p-4">
            <ChamadaAuditoriaSection />
          </div>
        )}
      </div>

      {/* Dialog mudar senha */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mudar Senha do Desenvolvedor</DialogTitle>
            <DialogDescription>Mínimo 8 caracteres, 1 letra maiúscula e 1 número.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {[
              { id: 'current', label: 'Senha Atual', value: currentPassword, setValue: setCurrentPassword, show: showCurrentPassword, setShow: setShowCurrentPassword },
              { id: 'new', label: 'Nova Senha', value: newPassword, setValue: setNewPassword, show: showNewPassword, setShow: setShowNewPassword },
              { id: 'confirm', label: 'Confirmar Nova Senha', value: confirmPassword, setValue: setConfirmPassword, show: showConfirmPassword, setShow: setShowConfirmPassword },
            ].map(field => (
              <div key={field.id}>
                <Label htmlFor={field.id}>{field.label}</Label>
                <div className="relative">
                  <Input
                    id={field.id}
                    type={field.show ? "text" : "password"}
                    value={field.value}
                    onChange={e => field.setValue(e.target.value)}
                    disabled={isChangingPassword}
                    className="pr-10"
                  />
                  <button type="button" onClick={() => field.setShow(!field.show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700" tabIndex={-1}>
                    {field.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setShowChangePassword(false);
              setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
              setShowCurrentPassword(false); setShowNewPassword(false); setShowConfirmPassword(false);
            }} disabled={isChangingPassword}>Cancelar</Button>
            <Button onClick={handleChangePassword} disabled={isChangingPassword} className="flex-1">
              {isChangingPassword ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Alterando...</> : <><Key className="w-4 h-4 mr-2" />Alterar Senha</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
