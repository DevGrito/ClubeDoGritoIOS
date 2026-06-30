import React, { useState, useEffect, useRef, lazy, Suspense, useCallback } from "react";
const ScannerPresencaModalLazy = lazy(() => import("@/components/presenca/ScannerPresencaModal"));
import { formatCPF } from "@/lib/utils";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { authFetch, queryClient } from "@/lib/queryClient";
import { logoutAndClearSession } from "@/lib/auth-session";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ComprehensiveStudentForm } from "@/components/comprehensive-student-form";
import { TurmaInclusaoForm } from "@/components/TurmaInclusaoForm";
import { InstanceForm } from "@/components/pec/forms";
import { TurmaDetailModal } from "@/components/pec/TurmaDetailModal";
import { TurmaDetailModalInclusao } from "@/components/inclusao/TurmaDetailModalInclusao";
import { baixarListaAlunos } from "@/lib/pdfUtils";
import MonitorDashboard from "@/components/MonitorDashboard";
import { buildPeriodoQueryString, type PeriodoFiltro } from "@/lib/dashboardPeriodoFiltro";
import { getDiasAulaParaTurma, aplicarExcecoesNoCalendarioDeChamada, toYMDString, type DiaAula } from "@/lib/class-days";
import ParticipantesInclusaoSection from "@/components/ParticipantesInclusaoSection";
import { useAuthSession } from "@/hooks/useAuthSession";

const normalizeToYMD = toYMDString;

const turmaJaTemRelatorioNaData = (relatorios: any[], turmaId: string, data: string) =>
  relatorios.some(
    (r) =>
      (r.turmaId ?? r.turma_id)?.toString() === turmaId &&
      normalizeToYMD(r.data) === data
  );

type DiaAulaTurmaItem = {
  date: string;
  label: string;
  turmaId: string;
  turmaNome: string;
};

const buildTodosDiasAulaDasTurmas = (turmas: any[]): DiaAulaTurmaItem[] => {
  const items: DiaAulaTurmaItem[] = [];
  for (const turma of turmas) {
    const status = turma.status || turma.situation || "ativo";
    if (status === "inativo" || status === "cancelado") continue;
    const turmaId = turma.id.toString();
    const turmaNome = turma.nome || turma.title || "Turma";
    for (const dia of getDiasAulaParaTurma(turma)) {
      items.push({ date: dia.date, label: dia.label, turmaId, turmaNome });
    }
  }
  return items.sort(
    (a, b) => b.date.localeCompare(a.date) || a.turmaNome.localeCompare(b.turmaNome)
  );
};

/** Todos os meses (jan–dez) entre dataInicio e dataFim das turmas ativas. */
const extrairTodosMesesDasTurmas = (turmas: any[]): string[] => {
  const parseYm = (raw: any): { year: number; month: number } | null => {
    const ymd = normalizeToYMD(raw);
    if (!ymd || ymd.length < 7) return null;
    const [year, month] = ymd.split("-").map(Number);
    if (!year || !month) return null;
    return { year, month };
  };

  let minYear = Infinity;
  let minMonth = 1;
  let maxYear = -Infinity;
  let maxMonth = 12;
  let hasRange = false;

  for (const turma of turmas) {
    const status = turma.status || turma.situation || "ativo";
    if (status === "inativo" || status === "cancelado") continue;

    const inicio = parseYm(
      turma?.dataInicio ?? turma?.data_inicio ?? turma?.dataInicioISO ?? turma?.inicio
    );
    const fim = parseYm(
      turma?.dataFim ?? turma?.data_fim ?? turma?.dataFimISO ?? turma?.fim
    );
    if (!inicio || !fim) continue;

    hasRange = true;
    if (inicio.year < minYear || (inicio.year === minYear && inicio.month < minMonth)) {
      minYear = inicio.year;
      minMonth = inicio.month;
    }
    if (fim.year > maxYear || (fim.year === maxYear && fim.month > maxMonth)) {
      maxYear = fim.year;
      maxMonth = fim.month;
    }
  }

  if (!hasRange) {
    const y = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, i) => `${y}-${String(i + 1).padStart(2, "0")}`);
  }

  const meses: string[] = [];
  let y = minYear;
  let m = minMonth;
  while (y < maxYear || (y === maxYear && m <= maxMonth)) {
    meses.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return meses;
};

/** Meses distintos (YYYY-MM) a partir dos dias de aula calculados. */
const extrairMesesDosDiasAula = (dias: { date: string }[]): string[] => {
  const meses = new Set<string>();
  for (const d of dias) {
    if (d.date?.length >= 7) meses.add(d.date.slice(0, 7));
  }
  return Array.from(meses).sort();
};

const formatMesRelatorioLabel = (ym: string) => {
  const mes = Number(ym.split("-")[1]);
  const label = new Date(2000, mes - 1, 1).toLocaleDateString("pt-BR", { month: "long" });
  return label.charAt(0).toUpperCase() + label.slice(1);
};
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getBrazilDateString, formatDateBrazil } from "@/lib/brazil-date";
import { isPlanoStatusExibivel, labelPlanoStatusExibivel } from "@/lib/plano-aula-status";
import { 
  Users, 
  BookOpen, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut,
  ExternalLink,
  GraduationCap,
  Clock,
  Target,
  Download,
  Plus,
  Search,
  User,
  CheckCircle,
  XCircle,
  Loader2,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  Camera,
  Pencil,
  Music,
  Paintbrush,
  Dumbbell,
  Code,
  Star,
  Heart,
  Lightbulb,
  Trophy,
  Mic,
  Zap,
  ScanFace,
  Hand,
  Wifi,
  WifiOff,
  Upload,
  Utensils,
  FileDown,
  MoreHorizontal,
  Shield
} from "lucide-react";

import AreaConsentGate, { useAreaConsentReady } from "@/components/AreaConsentGate";
import { PrivacyPreferencesDropdownItem } from "@/components/PrivacyPreferencesMenuItem";
import { LgpdLegalHeaderButtons, LgpdMeusDadosSettingsPanel } from "@/components/LgpdLegalMenuSection";
import { openPrivacyPreferences } from "@/lib/consentManager";
import { PushNotificationSettings } from "@/components/PushNotificationSettings";

const MARCADOR_ICONE_MAP: Record<string, any> = {
  book: BookOpen, music: Music, art: Paintbrush, sport: Dumbbell,
  code: Code, star: Star, heart: Heart, idea: Lightbulb,
  trophy: Trophy, mic: Mic, camera: Camera, pencil: Pencil,
};

export default function ProfessorPage() {
  const fetch = authFetch;
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { ready: consentReady, checking: consentChecking, markReady: setConsentReady } =
    useAreaConsentReady("employees");
  const [activeSection, setActiveSection] = useState('dashboard');
  const [catracaConnected, setCatracaConnected] = useState(false);
  const changeSection = (section: string) => {
    setActiveSection(section);
    requestAnimationFrame(() => {
      setTimeout(() => {
        const el = document.getElementById('professor-content-area');
        console.log('[SCROLL] professor-content-area found:', !!el, 'rect:', el?.getBoundingClientRect());
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    });
  };
  const [showEditPlanoModal, setShowEditPlanoModal] = useState(false);
  const [filtroStatusTurma, setFiltroStatusTurma] = useState<string>('todos');
  const [buscaTurma, setBuscaTurma] = useState<string>('');
  const [dashFiltroAno, setDashFiltroAno] = useState<number>(new Date().getFullYear());
  const [dashFiltroPeriodo, setDashFiltroPeriodo] = useState<PeriodoFiltro>("todos");
  const [showViewPlanoModal, setShowViewPlanoModal] = useState(false);
  const [showNovoPlanoModal, setShowNovoPlanoModal] = useState(false);
  const [showNovoRelatorioModal, setShowNovoRelatorioModal] = useState(false);
  const [selectedPlano, setSelectedPlano] = useState<any>(null);
  const [planoForm, setPlanoForm] = useState({
    turmaId: '',
    data: new Date().toISOString().split('T')[0],
    titulo: '',
    objetivos: '',
    conteudo: '',
    metodologia: '',
    recursos: '',
    avaliacao: '',
    duracaoMinutos: '',
    status: 'rascunho'
  });
  
  // States para cadastro de alunos PEC
  const [showCadastroAlunoPecModal, setShowCadastroAlunoPecModal] = useState(false);
  const [editingAlunoCpf, setEditingAlunoCpf] = useState<string | undefined>(undefined);
  const [viewModeAluno, setViewModeAluno] = useState(false);
  
  // State para data de ingresso ao adicionar aluno à turma
  const [pendingAddAlunoProf, setPendingAddAlunoProf] = useState<{ turmaId: number; participanteId: number; nome: string } | null>(null);
  const [dataIngressoProf, setDataIngressoProf] = useState<string>(() => getBrazilDateString());

  // States para cadastro de participantes (Inclusão)
  const [showNovoParticipanteModal, setShowNovoParticipanteModal] = useState(false);
  const [showEditParticipanteModal, setShowEditParticipanteModal] = useState(false);
  const [showViewParticipanteModal, setShowViewParticipanteModal] = useState(false);
  const [selectedParticipante, setSelectedParticipante] = useState<any>(null);
  const [buscaParticipante, setBuscaParticipante] = useState('');
  
  // States para gerenciamento de turmas
  const [showNovaTurmaModal, setShowNovaTurmaModal] = useState(false);
  const [showEditTurmaModal, setShowEditTurmaModal] = useState(false);
  const [showDetalhesTurmaModal, setShowDetalhesTurmaModal] = useState(false);
  const [showGerenciarAlunosModal, setShowGerenciarAlunosModal] = useState(false);
  const [showGerenciarAlunosTurmaInclusao, setShowGerenciarAlunosTurmaInclusao] = useState(false);
  const [turmaGerenciarInclusao, setTurmaGerenciarInclusao] = useState<any>(null);
  const [showTurmaDetailModal, setShowTurmaDetailModal] = useState(false);
  const [selectedTurma, setSelectedTurma] = useState<any>(null);
  const [showFinalizarTurmaModal, setShowFinalizarTurmaModal] = useState(false);
  const [participantesSelecionados, setParticipantesSelecionados] = useState<number[]>([]);
  const [participantesTurmaAtual, setParticipantesTurmaAtual] = useState<any[]>([]);
  const [isLoadingParticipantesTurma, setIsLoadingParticipantesTurma] = useState(false);
  const [isFinalizando, setIsFinalizando] = useState(false);
  const [buscaAlunoTurma, setBuscaAlunoTurma] = useState('');
  const [showAlimentacaoModal, setShowAlimentacaoModal] = useState(false);
  
  // States para controle de chamada/frequência
  const [chamadaData, setChamadaData] = useState('');
  const [chamadaTurmaId, setChamadaTurmaId] = useState('');
  const [presencas, setPresencas] = useState<Array<{ participanteId: number; nome: string; cpf?: string; presente: boolean; justificativa?: string; viaCatraca?: boolean; horaEntrada?: string }>>([]);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoFiles, setFotoFiles] = useState<File[]>([]);
  const [fotoRegistroAula, setFotoRegistroAula] = useState<File | null>(null);
  const fotoRegistroAulaRef = useRef<HTMLInputElement>(null);
  const [existingFotoUrl, setExistingFotoUrl] = useState<string | null>(null);
  const [editingChamada, setEditingChamada] = useState<any>(null);
  const [modoManual, setModoManual] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showModoManualDialog, setShowModoManualDialog] = useState(false);
  const [motivoManualSelect, setMotivoManualSelect] = useState('');
  const [descManual, setDescManual] = useState('');
  const [savingMotivoManual, setSavingMotivoManual] = useState(false);
  const [diasAulaDisponiveis, setDiasAulaDisponiveis] = useState<DiaAula[]>([]);
  
  // States para registro de aulas
  const [registroAulaForm, setRegistroAulaForm] = useState({
    data: getBrazilDateString(),
    turmaId: '',
    planoId: '',
    chamadaId: '',
    conteudo: '',
    observacoes: ''
  });
  const [registrosAulas, setRegistrosAulas] = useState<any[]>([]);
  const [filtroTurmaRel, setFiltroTurmaRel] = useState('');
  const [filtroMesRel, setFiltroMesRel] = useState("");
  const [filtroTurmaPlanos, setFiltroTurmaPlanos] = useState('');
  const [filtroPlanos, setFiltroPlanos] = useState({ nome: '', turma: '', data: '', responsavel: '' });
  const [abaPlanos, setAbaPlanos] = useState<'cadastrados' | 'pendentes'>('cadastrados');
  const [filtroDropdownAberto, setFiltroDropdownAberto] = useState<'turma' | 'responsavel' | null>(null);
  const [relatorioSelecionado, setRelatorioSelecionado] = useState<any>(null);
  const [filtroChamadaData, setFiltroChamadaData] = useState('');
  const [showHistoricoChamadas, setShowHistoricoChamadas] = useState(false);
  const [historicoFiltroTurma, setHistoricoFiltroTurma] = useState('');
  const [presencaTurmaBusca, setPresencaTurmaBusca] = useState('');
  const [historicoTurmaBusca, setHistoricoTurmaBusca] = useState('');
  const [relatorioTurmaBusca, setRelatorioTurmaBusca] = useState('');
  const [planoTurmaBusca, setPlanoTurmaBusca] = useState('');

  const [historicoFiltroDataInicio, setHistoricoFiltroDataInicio] = useState('');
  const [historicoFiltroDataFim, setHistoricoFiltroDataFim] = useState('');
  const [historicoTab, setHistoricoTab] = useState<'finalizadas' | 'pendentes'>('finalizadas');
  const [fotosGaleriaDialog, setFotosGaleriaDialog] = useState<{ turmaId: string; data: string; urls: string[] } | null>(null);
  const [fotosGaleriaLoading, setFotosGaleriaLoading] = useState(false);
  
  // States para calendário
  const [calendarioMes, setCalendarioMes] = useState(new Date());
  const [showNovoEventoModal, setShowNovoEventoModal] = useState(false);
  const [eventosProfessor, setEventosProfessor] = useState<Array<{
    id: number;
    titulo: string;
    data: string;
    horario: string;
    tipo: string;
    turmaId?: string;
    turmaNome?: string;
    descricao?: string;
  }>>([]);
  const [novoEvento, setNovoEvento] = useState({
    titulo: '',
    data: getBrazilDateString(),
    horario: '08:00',
    tipo: 'Aula',
    turmaId: '',
    descricao: ''
  });
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);
  
  // States para alunos PEC
  const [buscaAlunoPec, setBuscaAlunoPec] = useState('');
  const [statusFilterPec, setStatusFilterPec] = useState('todos');

  // States para acompanhamento pedagógico
  const [filtroTurmaAcomp, setFiltroTurmaAcomp] = useState('');
  const [buscaAlunoAcomp, setBuscaAlunoAcomp] = useState('');
  const [anotacoesAlunos, setAnotacoesAlunos] = useState<Record<number, string>>({});
  const [acompTurmaId, setAcompTurmaId] = useState('');
  const [acompDiaAulaId, setAcompDiaAulaId] = useState('');
  const [acompAlunoCpf, setAcompAlunoCpf] = useState('');
  const [acompAlunoNome, setAcompAlunoNome] = useState('');
  const [acompObservacao, setAcompObservacao] = useState('');
  const [acompTipo, setAcompTipo] = useState('comportamental');
  const [salvandoAcomp, setSalvandoAcomp] = useState(false);
  
  // Detectar vertente pela URL
  const vertente: 'pec' | 'inclusao' = location.includes('/professor/inclusao') ? 'inclusao' : 'pec';
  const vertenteLabel = vertente === 'pec' ? 'PEC' : 'Inclusão Produtiva';
  
  const { data: authSession } = useAuthSession();
  // Fonte principal de identidade via sessão backend; localStorage como fallback legado.
  const userId = String(authSession?.id || localStorage.getItem("userId") || "");
  const userName = localStorage.getItem("userName") || "Professor";
  const userPapel = localStorage.getItem("userPapel");

  // Query para buscar dados do dashboard do professor
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/professor/dashboard', userId, vertente, dashFiltroAno, dashFiltroPeriodo],
    queryFn: async () => {
      const periodoQs = buildPeriodoQueryString(dashFiltroAno, dashFiltroPeriodo).replace(/^\?/, '&');
      const response = await fetch(`/api/professor/dashboard/${userId}?vertente=${vertente}${periodoQs || `&ano=${dashFiltroAno}`}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error('Falha ao carregar dados do painel');
      return response.json();
    },
    enabled: !!userId,
    // Mantém último resultado enquanto aplica novo filtro
    placeholderData: (previousData) => previousData,
  });

  // Dados reais do usuário logado (evita exibir placeholders fixos no perfil)
  const { data: userProfileData } = useQuery({
    queryKey: ['/api/users', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error('Falha ao carregar perfil do usuário');
      return response.json();
    },
    enabled: !!userId,
  });

  // Query para listar participantes de Inclusão Produtiva (mesma API do coordenador)
  const { data: participantesInclusao = [], isLoading: participantesLoading, refetch: refetchParticipantes } = useQuery({
    queryKey: ['/api/participantes-inclusao'],
    queryFn: async () => {
      const response = await fetch('/api/participantes-inclusao');
      if (!response.ok) throw new Error('Falha ao carregar participantes');
      return response.json();
    },
    enabled: vertente === 'inclusao',
    
  });

  // Query para buscar turmas do professor (todas as turmas da vertente)
  const { data: minhasTurmas = [], isLoading: turmasLoading, refetch: refetchTurmas } = useQuery({
    queryKey: ['/api/professor/turmas', userId, vertente],
    queryFn: async () => {
      const response = await fetch(`/api/professor/${userId}/turmas?vertente=${vertente}`);
      if (!response.ok) throw new Error('Falha ao carregar turmas');
      return response.json();
    },
    enabled: !!userId,
    staleTime: 0,
  });

  // Query para buscar alunos PEC (mesma API do monitor)
  const { data: alunosPec = [], isLoading: alunosPecLoading } = useQuery({
    queryKey: ['/api/professor/pec/alunos', vertente],
    queryFn: async () => {
      const response = await fetch('/api/professor/pec/alunos');
      if (!response.ok) throw new Error('Falha ao carregar alunos PEC');
      return response.json();
    },
    enabled: vertente === 'pec',
  });

  // Mutation para inativar turma
  const inativarTurmaMutation = useMutation({
    mutationFn: async (turmaId: number) => {
      const response = await fetch(`/api/professor/${userId}/turmas/${turmaId}?vertente=${vertente}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'inativo' })
      });
      if (!response.ok) throw new Error('Falha ao inativar turma');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professor/turmas', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/turmas-inclusao'] });
      queryClient.invalidateQueries({ queryKey: ['/api/monitor/grupos'] });
      toast({ title: "Sucesso", description: "Turma inativada com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao inativar turma", description: error.message || "Não foi possível inativar a turma. Tente novamente.", variant: "destructive" });
    }
  });

  // Mutation para reativar turma
  const reativarTurmaMutation = useMutation({
    mutationFn: async (turmaId: number) => {
      const response = await fetch(`/api/professor/${userId}/turmas/${turmaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'emandamento' })
      });
      if (!response.ok) throw new Error('Falha ao reativar turma');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professor/turmas', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/turmas-inclusao'] });
      queryClient.invalidateQueries({ queryKey: ['/api/monitor/grupos'] });
      toast({ title: "Sucesso", description: "Turma reativada com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao reativar turma", description: error.message || "Não foi possível reativar a turma. Tente novamente.", variant: "destructive" });
    }
  });

  // Query para buscar alunos de uma turma específica
  const { data: alunosDaTurma = [], isLoading: alunosTurmaLoading, refetch: refetchAlunosTurma } = useQuery({
    queryKey: ['/api/professor/turmas/alunos', selectedTurma?.id],
    queryFn: async () => {
      if (!selectedTurma?.id) return [];
      const response = await fetch(`/api/professor/${userId}/turmas/${selectedTurma.id}/alunos?vertente=${vertente}`);
      if (!response.ok) throw new Error('Falha ao carregar alunos');
      return response.json();
    },
    enabled: !!selectedTurma?.id && showGerenciarAlunosModal,
    
  });

  // Mutation para adicionar aluno à turma
  const addAlunoTurmaMutation = useMutation({
    mutationFn: async ({ turmaId, participanteId, dataIngresso }: { turmaId: number; participanteId: number; dataIngresso?: string }) => {
      const response = await fetch(`/api/professor/${userId}/turmas/${turmaId}/alunos?vertente=${vertente}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participanteId, dataIngresso })
      });
      if (!response.ok) throw new Error('Falha ao adicionar aluno');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professor/turmas/alunos', selectedTurma?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/professor/turmas', userId] });
      toast({ title: "Sucesso", description: "Aluno adicionado à turma!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao adicionar aluno", description: error.message || "Não foi possível adicionar o aluno. Tente novamente.", variant: "destructive" });
    }
  });

  // Mutation para remover aluno da turma
  const removeAlunoTurmaMutation = useMutation({
    mutationFn: async ({ turmaId, alunoId }: { turmaId: number; alunoId: number }) => {
      const response = await fetch(`/api/professor/${userId}/turmas/${turmaId}/alunos/${alunoId}?vertente=${vertente}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Falha ao remover aluno');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professor/turmas/alunos', selectedTurma?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/professor/turmas', userId] });
      toast({ title: "Sucesso", description: "Aluno removido da turma!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao remover aluno", description: error.message || "Não foi possível remover o aluno. Tente novamente.", variant: "destructive" });
    }
  });

  // Query para buscar alunos da turma selecionada para chamada
  const { data: alunosChamada = [], isLoading: alunosChamadaLoading } = useQuery({
    queryKey: ['/api/professor/turmas/alunos/chamada', chamadaTurmaId, vertente, chamadaData],
    queryFn: async () => {
      if (!chamadaTurmaId) return [];
      const dateParam = chamadaData ? `&date=${chamadaData}` : '';
      const response = await fetch(`/api/professor/${userId}/turmas/${chamadaTurmaId}/alunos?vertente=${vertente}${dateParam}`);
      if (!response.ok) throw new Error('Falha ao carregar alunos');
      return response.json();
    },
    enabled: !!chamadaTurmaId && !!chamadaData && activeSection === 'frequencia',
  });

  const { data: profCatracaLog, refetch: refetchProfCatracaLog } = useQuery<{ data: string; entradas: any[]; total: number }>({
    queryKey: ['/api/webhook/presenca-log'],
    enabled: activeSection === 'frequencia',
    refetchInterval: 30000,
  });

  const { data: profPecSession } = useQuery<any>({
    queryKey: ['/api/pec/session-by-date-prof', chamadaTurmaId, chamadaData],
    queryFn: async () => {
      const res = await fetch(`/api/pec/sessions?activity_instance_id=${chamadaTurmaId}&date=${chamadaData}`, { credentials: 'include' });
      if (!res.ok) return null;
      const sessions = await res.json();
      if (Array.isArray(sessions)) {
        return sessions.find((s: any) => String(s.activity_instance_id) === String(chamadaTurmaId) && String(s.date).slice(0, 10) === chamadaData) || null;
      }
      return null;
    },
    enabled: !!chamadaTurmaId && !!chamadaData && activeSection === 'frequencia' && vertente === 'pec' && !editingChamada,
  });

  const { data: profIncPresencasDia } = useQuery<any[]>({
    queryKey: ['/api/presencas-inclusao/por-turma-data', chamadaTurmaId, chamadaData],
    queryFn: async () => {
      const res = await fetch(
        `/api/presencas-inclusao/por-turma-data?turmaId=${encodeURIComponent(chamadaTurmaId)}&data=${encodeURIComponent(chamadaData)}`,
        { credentials: 'include' }
      );
      if (!res.ok) return [];
      return res.json();
    },
    enabled:
      !!chamadaTurmaId &&
      !!chamadaData &&
      activeSection === 'frequencia' &&
      vertente === 'inclusao' &&
      !editingChamada,
  });

  useEffect(() => {
    const es = new EventSource("/api/webhook/presenca-events");
    es.onopen = () => setCatracaConnected(true);
    es.onerror = () => setCatracaConnected(false);
    return () => { es.close(); setCatracaConnected(false); };
  }, []);

    useEffect(() => {
    if (activeSection !== 'frequencia') return;
    const es = new EventSource("/api/webhook/presenca-events");
    es.onmessage = (event) => {
      if (event.data === "connected") return;
      try {
        const data = JSON.parse(event.data);
        if (data.tipo === "presenca") {
          refetchProfCatracaLog();
          if (data.vertente === "pec") {
            queryClient.invalidateQueries({ queryKey: ['/api/pec/session-by-date-prof', chamadaTurmaId, chamadaData] });
          }
          if (data.vertente === "inclusao") {
            queryClient.invalidateQueries({ queryKey: ['/api/presencas-inclusao/por-turma-data', chamadaTurmaId, chamadaData] });
          }
        }
      } catch (_) {}
    };
    return () => es.close();
  }, [activeSection, chamadaTurmaId, chamadaData]);

  useEffect(() => {
    if (editingChamada) return;
    if (alunosChamada.length === 0) return;

    const base = alunosChamada.map((aluno: any) => ({
      participanteId: aluno.id,
      nome: aluno.nome || aluno.nome_completo,
      cpf: aluno.cpf,
      presente: false,
      justificativa: '' as string | undefined,
    }));

    if (vertente === 'inclusao' && Array.isArray(profIncPresencasDia) && profIncPresencasDia.length > 0) {
      const fromDb = new Map<number, any>(
        profIncPresencasDia.map((r: any) => [Number(r.participanteId), r])
      );
      setPresencas(
        base.map((b: { participanteId: number; nome: string; cpf?: string; presente: boolean; justificativa?: string }) => {
          const row = fromDb.get(b.participanteId);
          if (!row) return { ...b, presente: false, justificativa: '' };
          return {
            ...b,
            presente: !!row.presente,
            justificativa: row.justificativa || '',
            viaCatraca: row.viaCatraca === true,
            horaEntrada: row.hora ? String(row.hora) : undefined,
          };
        })
      );
    } else {
      setPresencas(base);
    }
    setModoManual(false);
  }, [alunosChamada, editingChamada, vertente, profIncPresencasDia]);

  useEffect(() => {
    if (editingChamada) return;
    if (vertente !== 'pec') return;
    if (!profPecSession?.attendance) return;
    const attendance = profPecSession.attendance as any[];
    const catracaEntries = attendance.filter(
      (a: any) => (a.origemCatraca === true || a.origemScanner === true) && a.presente === true
    );
    if (catracaEntries.length === 0) return;

    const cpfDigits = (cpf: unknown) => String(cpf ?? "").replace(/\D/g, "");
    const catracaCpfMap = new Map(catracaEntries.map((a: any) => [cpfDigits(a.alunoCpf), a]));

    setPresencas((prev) => {
      if (prev.length === 0) return prev;
      return prev.map((p) => {
        const entry = catracaCpfMap.get(cpfDigits(p.cpf));
        if (entry) {
          return {
            ...p,
            presente: true,
            viaCatraca: entry.origemCatraca === true || entry.origemScanner === true,
            horaEntrada: entry.horaEntrada,
          };
        }
        return p;
      });
    });
  }, [profPecSession, presencas.length, editingChamada, vertente]);

  const refreshPresencaAposScanner = useCallback(() => {
    refetchProfCatracaLog();
    if (vertente === "pec" && chamadaTurmaId && chamadaData) {
      queryClient.invalidateQueries({ queryKey: ["/api/pec/session-by-date-prof", chamadaTurmaId, chamadaData] });
    }
    if (vertente === "inclusao" && chamadaTurmaId && chamadaData) {
      queryClient.invalidateQueries({ queryKey: ["/api/presencas-inclusao/por-turma-data", chamadaTurmaId, chamadaData] });
    }
  }, [vertente, chamadaTurmaId, chamadaData, queryClient, refetchProfCatracaLog]);

  const handleScannerPresencaRegistrada = useCallback((cpf: string) => {
    const hora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const cpfNorm = (v: unknown) => String(v ?? "").replace(/\D/g, "");
    setPresencas((prev) =>
      prev.map((p) =>
        cpfNorm(p.cpf) === cpfNorm(cpf) ? { ...p, presente: true, viaCatraca: true, horaEntrada: hora } : p
      )
    );
    refreshPresencaAposScanner();
  }, [refreshPresencaAposScanner]);

  // Query para buscar histórico de chamadas do professor (filtrado por vertente)
  const { data: historicoChamadas = [], isLoading: historicoLoading, refetch: refetchHistorico } = useQuery({
    queryKey: ['/api/professor/historico-chamadas', userId, vertente, dashFiltroAno, dashFiltroPeriodo],
    queryFn: async () => {
      const periodoQs = buildPeriodoQueryString(dashFiltroAno, dashFiltroPeriodo).replace(/^\?/, '&');
      const response = await fetch(`/api/professor/${userId}/historico-chamadas?vertente=${vertente}${periodoQs || `&ano=${dashFiltroAno}`}`);
      if (!response.ok) throw new Error('Falha ao carregar histórico');
      return response.json();
    },
    enabled: !!userId,
    
  });

  const { data: excecoesChamadaTurma = [] } = useQuery({
    queryKey: ['/api/turmas-inclusao/excecoes', chamadaTurmaId],
    queryFn: async () => {
      if (!chamadaTurmaId) return [];
      const r = await fetch(`/api/turmas-inclusao/${chamadaTurmaId}/excecoes`, { credentials: 'include' });
      if (!r.ok) return [];
      return r.json();
    },
    enabled: !!chamadaTurmaId && vertente === 'inclusao',
  });

  const { data: relatoriosAulas = [], isLoading: relatoriosLoading, refetch: refetchRelatorios } = useQuery({
    queryKey: ['/api/professor/registered-lessons', userId],
    queryFn: async () => {
      const response = await fetch(`/api/professor/registered-lessons/${userId}`);
      if (!response.ok) throw new Error('Falha ao carregar relatórios');
      return response.json();
    },
    enabled: !!userId,
  });

  // Query para alunos da turma selecionada no acompanhamento
  const { data: acompAlunosDaTurma = [] } = useQuery({
    queryKey: ['/api/professor/turmas/alunos/acomp', acompTurmaId, userId],
    queryFn: async () => {
      if (!acompTurmaId) return [];
      const response = await fetch(`/api/professor/${userId}/turmas/${acompTurmaId}/alunos?vertente=${vertente}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!acompTurmaId && !!userId,
  });

  // Query para sessões PEC da turma selecionada no acompanhamento (vertente PEC)
  const { data: pecSessoesAcomp = [] } = useQuery({
    queryKey: ['/api/pec/sessions/acomp', acompTurmaId],
    queryFn: async () => {
      if (!acompTurmaId) return [];
      const response = await fetch(`/api/pec/sessions?activity_instance_id=${acompTurmaId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!acompTurmaId && !!userId && vertente === 'pec',
  });

  // Query para listar acompanhamentos do professor
  const { data: listaAcompanhamentos = [], refetch: refetchAcompanhamentos } = useQuery({
    queryKey: ['/api/professor/acompanhamentos', userId],
    queryFn: async () => {
      const response = await fetch(`/api/professor/acompanhamentos/${userId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!userId,
  });

  // Calcular dias de aula quando turma muda (inclusao)
  const prevChamadaTurmaRef = useRef<string>('');
  useEffect(() => {
    if (chamadaTurmaId && vertente === 'inclusao') {
      const turma = minhasTurmas?.find((t: any) => t.id.toString() === chamadaTurmaId);
      if (turma) {
        const todosDias = aplicarExcecoesNoCalendarioDeChamada(
          getDiasAulaParaTurma(turma),
          excecoesChamadaTurma
        );
        const datasComChamada = new Set(
          (historicoChamadas || [])
            .filter((c: any) => String(c.grupoId || c.turmaId) === String(chamadaTurmaId) && (c.tipo !== 'inclusao' || c.fotoComprovante))
            .map((c: any) => normalizeToYMD(c.dataAtividade || c.data))
        );

        if (editingChamada && chamadaData) {
          const editingDate = chamadaData;
          const dias = todosDias.filter(d => !datasComChamada.has(d.date) || d.date === editingDate);
          if (!dias.some(d => d.date === editingDate)) {
            const diaEditando = { date: editingDate, label: new Date(editingDate + 'T12:00:00').toLocaleDateString('pt-BR'), dayOfWeek: '' };
            setDiasAulaDisponiveis([diaEditando, ...dias]);
          } else {
            setDiasAulaDisponiveis(dias);
          }
        } else {
          const dias = todosDias.filter(d => !datasComChamada.has(d.date));
          setDiasAulaDisponiveis(dias);
          const turmaChanged = prevChamadaTurmaRef.current !== chamadaTurmaId;
          if (turmaChanged) {
            prevChamadaTurmaRef.current = chamadaTurmaId;
            setChamadaData(dias.length > 0 ? dias[0].date : '');
          } else if (!chamadaData || !dias.some(d => d.date === chamadaData)) {
            setChamadaData(dias.length > 0 ? dias[0].date : '');
          }
        }
      }
    } else if (vertente !== 'inclusao') {
      setDiasAulaDisponiveis([]);
      prevChamadaTurmaRef.current = '';
      if (!chamadaData) {
        setChamadaData(getBrazilDateString());
      }
    }
  }, [chamadaTurmaId, minhasTurmas, vertente, historicoChamadas, editingChamada, excecoesChamadaTurma]);

  // Mutation para salvar chamada do professor
  const saveChamadaMutation = useMutation({
    mutationFn: async (params?: { teveAlimentacao?: boolean }) => {
      const teveAlimentacao = params?.teveAlimentacao ?? false;
      if (!chamadaTurmaId || !chamadaData) {
        throw new Error("Selecione uma turma e data");
      }
      const presencasData = presencas.map((p) => ({
        participanteId: p.participanteId,
        nome: p.nome,
        cpf: p.cpf,
        presente: p.presente,
        justificativa: p.justificativa,
        ...(p.viaCatraca ? { origemCatraca: true as const, horaEntrada: p.horaEntrada } : {}),
      }));

      if (editingChamada) {
        if (vertente === 'pec' && editingChamada.sessionId) {
          const res = await fetch(`/api/pec/sessions/${editingChamada.sessionId}/editar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attendance: presencasData })
          });
          if (!res.ok) throw new Error('Falha ao atualizar chamada');
          return res.json();
        } else {
          const res = await fetch(`/api/presencas-inclusao/editar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              turmaId: parseInt(chamadaTurmaId),
              data: chamadaData,
              presencas: presencasData
            })
          });
          if (!res.ok) throw new Error('Falha ao atualizar chamada');
          return res.json();
        }
      }

      const response = await fetch(`/api/professor/${userId}/registro-presenca`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turmaId: parseInt(chamadaTurmaId),
          data: chamadaData,
          vertente: vertente,
          presencas: presencasData,
          teveAlimentacao
        })
      });
      if (!response.ok) throw new Error('Falha ao salvar chamada');
      return response.json();
    },
    onSuccess: async (data) => {
      if (fotoFiles.length > 0) {
        try {
          if (vertente === 'inclusao') {
            const formData = new FormData();
            fotoFiles.forEach(f => formData.append('foto', f));
            formData.append('turmaId', chamadaTurmaId);
            formData.append('data', chamadaData);
            await fetch('/api/presencas-inclusao/foto', {
              method: 'POST',
              body: formData
            });
          } else if (vertente === 'pec') {
            const pecSessionId = editingChamada?.sessionId || data?.id || data?.sessionId;
            if (pecSessionId) {
              const formData = new FormData();
              fotoFiles.forEach(f => formData.append('foto', f));
              await fetch(`/api/pec/sessions/${pecSessionId}/foto`, {
                method: 'POST',
                body: formData
              });
            }
          }
        } catch (err) {
          console.error('Erro ao enviar fotos:', err);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['/api/professor/historico-chamadas', userId, vertente] });
      if (vertente === 'inclusao') {
        queryClient.invalidateQueries({
          queryKey: ['/api/presencas-inclusao/por-turma-data', chamadaTurmaId, chamadaData],
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/pec/sessions'] });
      toast({ title: editingChamada ? "Chamada atualizada!" : "Chamada finalizada!", description: "Presenças registradas com sucesso." });
      setChamadaTurmaId('');
      setPresencas([]);
      setFotoFile(null);
      setFotoFiles([]);
      setExistingFotoUrl(null);
      setEditingChamada(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao salvar chamada", description: error.message || "Não foi possível salvar a chamada. Tente novamente.", variant: "destructive" });
    }
  });

  // Query para buscar planos de aula do professor
  const { data: meusPlanos = [], isLoading: planosLoading, refetch: refetchPlanos } = useQuery({
    queryKey: ['/api/professor/turmas-planos-aula', userId, vertente],
    queryFn: async () => {
      const response = await fetch(`/api/professor/${userId}/turmas-planos-aula?vertente=${vertente}`);
      if (!response.ok) throw new Error('Falha ao carregar planos');
      return response.json();
    },
    enabled: !!userId && (activeSection === 'planos' || activeSection === 'aulas'),
    staleTime: 0,
  });

  const { data: planosPendentes = [], isLoading: planosPendentesLoading } = useQuery({
    queryKey: ['/api/professor/planos-aula/pendentes', userId, vertente],
    queryFn: async () => {
      const response = await fetch(`/api/professor/${userId}/planos-aula/pendentes?vertente=${vertente}`);
      if (!response.ok) throw new Error('Falha ao carregar planos pendentes');
      return response.json();
    },
    enabled: !!userId && activeSection === 'planos',
    staleTime: 0,
  });

  // Query para buscar datas que já têm plano na turma selecionada (qualquer professor)
  const [planoTurmaIdParaFiltro, setPlanoTurmaIdParaFiltro] = useState('');
  const { data: datasComPlanoData } = useQuery<{ datas: string[] }>({
    queryKey: ['/api/turmas/planos-datas', planoTurmaIdParaFiltro],
    queryFn: async () => {
      const r = await fetch(`/api/turmas/${planoTurmaIdParaFiltro}/planos-aula/datas`);
      if (!r.ok) return { datas: [] };
      return r.json();
    },
    enabled: !!planoTurmaIdParaFiltro && showNovoPlanoModal,
  });
  const datasComPlano: string[] = datasComPlanoData?.datas ?? [];

  // Mutation para criar plano de aula
  const criarPlanoMutation = useMutation({
    mutationFn: async (planoData: any) => {
      const response = await fetch(`/api/professor/${userId}/planos-aula?vertente=${vertente}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...planoData, vertente })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Falha ao criar plano');
      }
      return response.json();
    },
    onSuccess: (_, planoData) => {
      queryClient.invalidateQueries({ queryKey: ['/api/professor/planos-aula', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/professor/turmas-planos-aula', userId, vertente] });
      queryClient.invalidateQueries({ queryKey: ['/api/professor/planos-aula/pendentes', userId, vertente] });
      queryClient.invalidateQueries({ queryKey: ['/api/turmas/planos-datas', planoData.turmaId] });
      toast({ title: "Plano criado!", description: "Plano de aula criado com sucesso." });
      setShowNovoPlanoModal(false);
      setPlanoForm({
        turmaId: '', data: new Date().toISOString().split('T')[0], titulo: '', objetivos: '',
        conteudo: '', metodologia: '', recursos: '', avaliacao: '', duracaoMinutos: '', status: 'rascunho'
      });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar plano", description: error.message || "Não foi possível criar o plano. Tente novamente.", variant: "destructive" });
    }
  });

  // Mutation para atualizar plano de aula
  const atualizarPlanoMutation = useMutation({
    mutationFn: async ({ planoId, planoData }: { planoId: number; planoData: any }) => {
      const response = await fetch(`/api/professor/${userId}/planos-aula/${planoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planoData)
      });
      if (!response.ok) throw new Error('Falha ao atualizar plano');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professor/planos-aula', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/professor/turmas-planos-aula', userId, vertente] });
      queryClient.invalidateQueries({ queryKey: ['/api/professor/planos-aula/pendentes', userId, vertente] });
      toast({ title: "Plano atualizado!", description: "Plano de aula atualizado com sucesso." });
      setShowEditPlanoModal(false);
      setSelectedPlano(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar plano", description: error.message || "Não foi possível atualizar o plano. Tente novamente.", variant: "destructive" });
    }
  });

  // Mutation para excluir plano de aula
  const excluirPlanoMutation = useMutation({
    mutationFn: async (planoId: number) => {
      const response = await fetch(`/api/professor/${userId}/planos-aula/${planoId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Falha ao excluir plano');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professor/planos-aula', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/professor/turmas-planos-aula', userId, vertente] });
      queryClient.invalidateQueries({ queryKey: ['/api/professor/planos-aula/pendentes', userId, vertente] });
      toast({ title: "Plano excluído!", description: "Plano de aula removido com sucesso." });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir plano", description: error.message || "Não foi possível excluir o plano. Tente novamente.", variant: "destructive" });
    }
  });

  // Filtrar participantes que ainda não estão na turma
  const participantesDisponiveis = (participantesInclusao || []).filter((p: any) => {
    const jaEstaNaTurma = alunosDaTurma.some((a: any) => a.id === p.id);
    const matchBusca = !buscaAlunoTurma || (p.nome || '').toLowerCase().includes(buscaAlunoTurma.toLowerCase()) || (p.cpf || '').includes(buscaAlunoTurma);
    return !jaEstaNaTurma && matchBusca;
  }).sort((a: any, b: any) => {
    const aInativo = a.status?.toLowerCase() === 'inativo';
    const bInativo = b.status?.toLowerCase() === 'inativo';
    if (aInativo !== bInativo) return aInativo ? 1 : -1;
    return (a.nome || '').localeCompare(b.nome || '', 'pt-BR');
  });

  const handleLogout = async () => {
    await logoutAndClearSession();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso."
    });
    setTimeout(() => window.location.href = "/login/professor", 500);
  };

  // Funções para gerenciar planos de aula
  const handleEditPlano = (plano: any) => {
    setSelectedPlano(plano);
    setPlanoForm({
      turmaId: plano.turmaId?.toString() || '',
      data: plano.data || new Date().toISOString().split('T')[0],
      titulo: plano.titulo || '',
      objetivos: plano.objetivos || '',
      conteudo: plano.conteudo || '',
      metodologia: plano.metodologia || '',
      recursos: plano.recursos || '',
      avaliacao: plano.avaliacao || '',
      duracaoMinutos: plano.duracaoMinutos?.toString() || '',
      status: plano.status || 'rascunho'
    });
    setShowEditPlanoModal(true);
  };

  const handleViewPlano = (plano: any) => {
    setSelectedPlano(plano);
    setShowViewPlanoModal(true);
  };

  const handleDeletePlano = (plano: any) => {
    if (confirm(`Tem certeza que deseja excluir o plano "${plano.titulo}"?`)) {
      excluirPlanoMutation.mutate(plano.id);
    }
  };

  const handleAbrirPlanoPendente = (pendente: { turmaId: number; data: string }) => {
    setPlanoForm({
      turmaId: String(pendente.turmaId),
      data: pendente.data,
      titulo: '',
      objetivos: '',
      conteudo: '',
      metodologia: '',
      recursos: '',
      avaliacao: '',
      duracaoMinutos: '',
      status: 'rascunho',
    });
    setPlanoTurmaIdParaFiltro(String(pendente.turmaId));
    setShowNovoPlanoModal(true);
  };
  
  const handleSavePlano = () => {
    if (!planoForm.titulo || !planoForm.objetivos || !planoForm.conteudo) {
      toast({ title: "Campos obrigatórios", description: "Preencha título, objetivos e conteúdo.", variant: "destructive" });
      return;
    }
    criarPlanoMutation.mutate(planoForm);
  };
  
  const handleUpdatePlano = () => {
    if (!selectedPlano || !planoForm.titulo) {
      toast({ title: "Campos obrigatórios", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }
    atualizarPlanoMutation.mutate({ planoId: selectedPlano.id, planoData: planoForm });
  };

  const handleExportReport = () => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const url = `/export/google-slides?mes=${currentMonth}`;
    window.location.href = url;
    toast({
      title: "Exportando relatório",
      description: "O download será iniciado em breve..."
    });
  };

  const abrirNovoRelatorioVazio = () => {
    setRegistroAulaForm({
      data: getBrazilDateString(),
      turmaId: "",
      planoId: "",
      chamadaId: "",
      conteudo: "",
      observacoes: "",
    });
    setFotoRegistroAula(null);
    setShowNovoRelatorioModal(true);
  };

  const abrirRelatorioParaDia = (turmaId: string, data: string) => {
    const relatorio = (relatoriosAulas as any[]).find(
      (r) =>
        (r.turmaId ?? r.turma_id)?.toString() === turmaId &&
        normalizeToYMD(r.data) === data
    );
    if (relatorio) {
      setRelatorioSelecionado(relatorio);
      return;
    }
    const planoDoDia = meusPlanos.find(
      (p: any) =>
        normalizeToYMD(p.data) === data && p.turmaId?.toString() === turmaId
    );
    const chamadaDoDia = historicoChamadas.find((c: any) => {
      const turmaIdFromGrupo = c.grupo?.match(/turma_(\d+)/)?.[1];
      const dataStr = c.dataAtividade || c.data || "";
      return turmaIdFromGrupo === turmaId && normalizeToYMD(dataStr) === data;
    });
    setRegistroAulaForm({
      data,
      turmaId,
      planoId: planoDoDia?.id?.toString() || "",
      chamadaId: chamadaDoDia?.id?.toString() || "",
      conteudo: "",
      observacoes: "",
    });
    setFotoRegistroAula(null);
    setShowNovoRelatorioModal(true);
  };

  const handleSalvarRegistroAula = async () => {
    if (!registroAulaForm.turmaId) {
      toast({ title: "Turma obrigatória", description: "Selecione uma turma para registrar a aula.", variant: "destructive" });
      return;
    }
    if (!registroAulaForm.planoId) {
      toast({ title: "Plano de aula obrigatório", description: "Selecione um plano de aula antes de salvar.", variant: "destructive" });
      return;
    }
    if (!registroAulaForm.conteudo?.trim()) {
      toast({ title: "Relatório obrigatório", description: "Preencha o relatório de aula antes de salvar.", variant: "destructive" });
      return;
    }
    if (!fotoRegistroAula) {
      toast({ title: "Foto obrigatória", description: "Anexe uma foto da aula antes de salvar.", variant: "destructive" });
      return;
    }
    
    const turma = minhasTurmas.find((t: any) => t.id.toString() === registroAulaForm.turmaId);
    const plano = meusPlanos.find((p: any) => p.id.toString() === registroAulaForm.planoId);
    const chamada = historicoChamadas.find((c: any) => c.id?.toString() === registroAulaForm.chamadaId);
    
    // Usar totalPresentes e totalAlunos da chamada
    let chamadaInfo = '';
    if (chamada) {
      chamadaInfo = `${chamada.totalPresentes ?? 0}/${chamada.totalAlunos ?? 0} presentes`;
    }
    
    const titulo = plano?.titulo
      ? `${plano.titulo} - ${formatDateBrazil(registroAulaForm.data)}`
      : `Relatório - ${(turma?.nome || turma?.title) || 'Turma'} - ${formatDateBrazil(registroAulaForm.data)}`;

    const payload = {
      turmaId: parseInt(registroAulaForm.turmaId),
      professorId: parseInt(userId),
      planoAulaId: registroAulaForm.planoId ? parseInt(registroAulaForm.planoId) : null,
      data: registroAulaForm.data,
      titulo,
      conteudoMinistrado: registroAulaForm.conteudo,
      observacoes: registroAulaForm.observacoes || null,
      statusAula: 'ministrada',
    };

    try {
      const response = await fetch('/api/professor/registered-lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao salvar');
      }
      const aulaRegistrada = await response.json();
      // Upload da foto comprovante
      if (fotoRegistroAula && aulaRegistrada?.id) {
        const fd = new FormData();
        fd.append('foto', fotoRegistroAula);
        await fetch(`/api/professor/registered-lessons/${aulaRegistrada.id}/foto`, {
          method: 'PATCH',
          body: fd,
        }).catch(err => console.error('Erro ao enviar foto:', err));
      }
      refetchRelatorios();
      setRegistroAulaForm({
        data: getBrazilDateString(),
        turmaId: '',
        planoId: '',
        chamadaId: '',
        conteudo: '',
        observacoes: ''
      });
      setFotoRegistroAula(null);
      setShowNovoRelatorioModal(false);
      toast({ title: "Relatório salvo", description: "O relatório de aula foi registrado com sucesso." });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  const handleSalvarAcompanhamento = async () => {
    if (!acompTurmaId) return toast({ title: "Selecione a turma", variant: "destructive" });
    if (!acompDiaAulaId) return toast({ title: "Selecione o dia de aula", variant: "destructive" });
    if (!acompAlunoCpf) return toast({ title: "Selecione o aluno", variant: "destructive" });
    if (!acompObservacao.trim()) return toast({ title: "Preencha a observação", variant: "destructive" });
    setSalvandoAcomp(true);
    try {
      const diaAula = vertente === 'pec'
        ? pecSessoesAcomp.find((r: any) => r.id?.toString() === acompDiaAulaId)
        : relatoriosAulas.find((r: any) => r.id?.toString() === acompDiaAulaId);
      const data = diaAula?.date || diaAula?.data || new Date().toISOString().slice(0, 10);
      const turma = minhasTurmas.find((t: any) => t.id?.toString() === acompTurmaId);
      const titulo = `Acompanhamento - ${acompAlunoNome} - ${data}`;
      const response = await fetch('/api/professor/acompanhamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alunoCpf: acompAlunoCpf,
          professorId: parseInt(userId || '0'),
          turmaId: parseInt(acompTurmaId),
          data,
          titulo,
          tipoObservacao: acompTipo,
          observacoes: acompObservacao,
        }),
      });
      if (!response.ok) throw new Error('Erro ao salvar');
      toast({ title: "Acompanhamento salvo!" });
      setAcompTurmaId('');
      setAcompDiaAulaId('');
      setAcompAlunoCpf('');
      setAcompAlunoNome('');
      setAcompObservacao('');
      setAcompTipo('comportamental');
      refetchAcompanhamentos();
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally {
      setSalvandoAcomp(false);
    }
  };

  if (consentChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
      </div>
    );
  }

  if (!consentReady) {
    return <AreaConsentGate area="employees" onAccept={() => setConsentReady()} onNavigate={setLocation} />;
  }

  if (isLoading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando área do professor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900" data-testid="professor-page">
      {/* Header */}
      <div className={`bg-slate-900 border-b border-slate-700 px-4 py-4 md:px-6`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${vertente === 'pec' ? 'bg-yellow-500' : 'bg-green-500'}`}>
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white" data-testid="text-welcome">
                Professor - {vertenteLabel}
              </h1>
              <p className="text-slate-400" data-testid="text-username">Bem-vindo, {userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Badge className={vertente === 'pec' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'bg-green-100 text-green-800 border-green-300'} data-testid="badge-role">
              👨‍🏫 {vertenteLabel}
            </Badge>
            {/* Desktop: botões visíveis */}
            <div className="hidden sm:flex items-center gap-2 flex-wrap justify-end">
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleExportReport}
                data-testid="button-export"
                className={vertente === 'pec' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <LgpdLegalHeaderButtons />
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://canaldetransparencia.institutoogrito.com.br', '_blank')}
                className="bg-yellow-400 text-black hover:bg-yellow-500 border-yellow-400"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Canal de Transparência
              </Button>
            </div>
            {/* Mobile: menu recolhido */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="sm:hidden" data-testid="button-mobile-menu">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleExportReport} className="cursor-pointer">
                  <Download className="w-4 h-4 mr-2 text-green-600" />
                  Exportar
                </DropdownMenuItem>
                <PrivacyPreferencesDropdownItem />
                <DropdownMenuItem onClick={() => window.open('https://canaldetransparencia.institutoogrito.com.br', '_blank')} className="cursor-pointer">
                  <ExternalLink className="w-4 h-4 mr-2 text-yellow-600" />
                  Canal de Transparência
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
        
        {/* Dashboard Visual */}
        <MonitorDashboard
          vertente={vertente}
          isLoading={vertente === 'pec' ? (alunosPecLoading || turmasLoading) : (participantesLoading || turmasLoading)}
          alunosPec={vertente === 'pec' ? alunosPec : []}
          participantesInclusao={vertente === 'inclusao' ? participantesInclusao : []}
          monitorGruposData={vertente === 'pec' ? minhasTurmas : []}
          gruposInclusaoData={vertente === 'inclusao' ? minhasTurmas : []}
          historicoChamadas={historicoChamadas}
          titulo="Painel do Professor"
          filtroAno={dashFiltroAno}
          filtroPeriodo={dashFiltroPeriodo}
          onFilterChange={(ano: number, periodo: PeriodoFiltro) => {
            setDashFiltroAno(ano);
            setDashFiltroPeriodo(periodo);
          }}
          meusAlunos={dashboardData?.meusAlunos ?? 0}
          alunosFormados={dashboardData?.alunosFormados ?? 0}
          alunosEmFormacao={dashboardData?.alunosEmFormacao ?? 0}
          frequenciaMedia={dashboardData?.frequenciaMedia ?? 0}
          filterByTurmas={true}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Gestão de Alunos */}
          <Card data-testid="card-alunos">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-blue-500" />
                Gestão de Alunos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Gerencie informações dos seus alunos, acompanhe frequência e progresso acadêmico.
              </p>
              <div className="space-y-2">
                <Button 
                  
                  variant="outline" className={activeSection === "alunos" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-ver-alunos"
                  onClick={() => changeSection('alunos')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Ver Alunos
                </Button>
                <Button 
                  
                  variant="outline" className={activeSection === "frequencia" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-chamada"
                  onClick={() => changeSection('frequencia')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Controle de Presença
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Planos de Aula */}
          <Card data-testid="card-planos">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="w-5 h-5 text-green-500" />
                Planos de Aula
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Crie e gerencie seus planos de aula, definindo objetivos e metodologias.
              </p>
              <div className="space-y-2">
                <Button 
                  
                  variant="outline" className={activeSection === "planos" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-criar-plano"
                  onClick={() => changeSection('planos')}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Meus Planos
                </Button>
                <Button 
                  
                  variant="outline" className={activeSection === "aulas" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-registro-aulas"
                  onClick={() => changeSection('aulas')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Relatório de aula
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Turmas e Calendário */}
          <Card data-testid="card-turmas">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-purple-500" />
                Turmas e Calendário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Gerencie suas turmas e organize eventos no calendário acadêmico.
              </p>
              <div className="space-y-2">
                <Button 
                  
                  variant="outline" className={activeSection === "turmas" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-minhas-turmas"
                  onClick={() => changeSection('turmas')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Minhas Turmas
                </Button>
                <Button 
                  
                  variant="outline" className={activeSection === "calendario" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-calendario"
                  onClick={() => changeSection('calendario')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendário
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Relatórios */}
          <Card data-testid="card-relatorios">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-orange-500" />
                Relatórios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Gere relatórios de frequência, notas e acompanhamento pedagógico.
              </p>
              <div className="space-y-2">
                <Button 
                  
                  variant="outline" className={activeSection === "relatorios" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-relatorio-frequencia"
                  onClick={() => changeSection('relatorios')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Relatórios
                </Button>
                <Button 
                  
                  variant="outline" className={activeSection === "acompanhamento" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-acompanhamento"
                  onClick={() => changeSection('acompanhamento')}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Acompanhamento
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Configurações */}
          <Card data-testid="card-configuracoes">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="w-5 h-5 text-gray-500" />
                Configurações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Gerencie suas preferências e configurações da conta.
              </p>
              <div className="space-y-2">
                <Button 
                  
                  variant="outline" className={activeSection === "configuracoes" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-perfil"
                  onClick={() => changeSection('configuracoes')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Meu Perfil
                </Button>
                <Button variant="outline" className="w-full" onClick={() => openPrivacyPreferences()}>
                  <Shield className="w-4 h-4 mr-2" />
                  Privacidade e cookies
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Footer de Navegação */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Área exclusiva para professores • Sistema RBAC Isolado
          </p>
        </div>

        {/* Área de Conteúdo Dinâmica */}
        <div className="mt-8" id="professor-content-area">
          {activeSection === 'alunos' && vertente === 'inclusao' && (
            <ParticipantesInclusaoSection 
              showImportExport={false} 
              readOnly={true}
              filtroTurmaIds={(minhasTurmas || []).map((t: any) => t.id)}
            />
          )}
          
          {activeSection === 'alunos' && vertente === 'pec' && (
            <Card>
              <CardHeader>
                <CardTitle>Alunos do PEC</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="Buscar alunos por nome ou CPF..."
                        value={buscaAlunoPec}
                        onChange={(e) => setBuscaAlunoPec(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {alunosPecLoading ? (
                    <div className="text-center py-8 text-gray-500">Carregando alunos...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Nascimento</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...(alunosPec || [])]
                          .sort((a: any, b: any) => {
                            const nomeA = (a.nome_completo || '').trim().toLowerCase();
                            const nomeB = (b.nome_completo || '').trim().toLowerCase();
                            return nomeA.localeCompare(nomeB, 'pt-BR');
                          })
                          .filter((a: any) => {
                            return !buscaAlunoPec || 
                              (a.nome_completo || '').toLowerCase().includes(buscaAlunoPec.toLowerCase());
                          })
                          .map((aluno: any) => (
                            <TableRow key={aluno.cpf || aluno.id}>
                              <TableCell className="font-medium">{aluno.nome_completo || aluno.nome}</TableCell>
                              <TableCell>{aluno.telefone || '-'}</TableCell>
                              <TableCell>{aluno.data_nascimento ? formatDateBrazil(aluno.data_nascimento) : '-'}</TableCell>
                            </TableRow>
                          ))}
                        {alunosPec.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                              Nenhum aluno nas suas turmas.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'frequencia' && (
            <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" />Controle de Presença
                  {catracaConnected ? (
                    <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 text-xs">
                      <Wifi className="w-3 h-3 mr-1" />
                      Catraca Online
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-400 border-gray-200 text-xs">
                      <WifiOff className="w-3 h-3 mr-1" />
                      Catraca Offline
                    </Badge>
                  )}
                </CardTitle>
                <Button 
                  variant="outline"
                  onClick={() => setShowHistoricoChamadas(!showHistoricoChamadas)}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {showHistoricoChamadas ? 'Nova Chamada' : 'Ver Histórico'}
                </Button>
              </CardHeader>
              <CardContent>
                {!showHistoricoChamadas ? (
                  <div className="space-y-4">
                    <div className="flex gap-4 items-end flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium mb-2">Turma</label>
                        <Select value={chamadaTurmaId} onValueChange={(v) => { setChamadaTurmaId(v); setPresencaTurmaBusca(''); }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a turma" />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="px-2 pb-1 pt-1 sticky top-0 bg-white z-10" onKeyDown={e => e.stopPropagation()}>
                              <input
                                className="w-full rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-blue-400"
                                placeholder="Pesquisar turma..."
                                value={presencaTurmaBusca}
                                onChange={e => setPresencaTurmaBusca(e.target.value)}
                                onKeyDown={e => e.stopPropagation()}
                              />
                            </div>
                            {(minhasTurmas || []).filter((t: any) => {
                                if (t.status === 'inativo') return false;
                                const fim = t.occurrence_end || t.dataFim || t.data_fim || t.period_end;
                                if (fim) {
                                  const today = new Date(); today.setHours(0,0,0,0);
                                  return new Date(fim) >= today;
                                }
                                return true;
                              }).filter((t: any) => !presencaTurmaBusca || (t.nome || t.title || '').toLowerCase().includes(presencaTurmaBusca.toLowerCase()))
                              .map((turma: any) => (
                              <SelectItem key={turma.id} value={turma.id.toString()}>
                                <div className="flex items-center gap-2">
                                  <span>{(turma.nome || turma.title)}</span>
                                  {(turma.control_mode === 'intelbras' || turma.temCatraca) && (
                                    <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 pointer-events-none">
                                      <Zap className="w-2.5 h-2.5 mr-0.5 inline" />
                                      Catraca
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium mb-2">Data da Aula</label>
                        {vertente === 'inclusao' && diasAulaDisponiveis.length > 0 ? (
                          <Select value={chamadaData} onValueChange={setChamadaData} disabled={!chamadaTurmaId || !!editingChamada}>
                            <SelectTrigger>
                              <SelectValue placeholder={chamadaTurmaId ? "Selecione a data" : "Selecione a turma primeiro"} />
                            </SelectTrigger>
                            <SelectContent>
                              {diasAulaDisponiveis.map((dia) => (
                                <SelectItem key={dia.date} value={dia.date}>
                                  {dia.label} ({dia.dayOfWeek})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input 
                            type="date" 
                            value={chamadaData}
                            onChange={(e) => setChamadaData(e.target.value)}
                            disabled={!!editingChamada}
                          />
                        )}
                      </div>
                      {chamadaTurmaId && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <>
                            {existingFotoUrl && fotoFiles.length === 0 && (
                              <div className="flex items-center gap-2">
                                <img src={existingFotoUrl} alt="Foto atual" className="w-10 h-10 rounded object-cover border" />
                                <span className="text-xs text-gray-500">Foto atual</span>
                              </div>
                            )}
                            {fotoFiles.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {fotoFiles.map((f, i) => (
                                  <div key={i} className="relative">
                                    <img src={URL.createObjectURL(f)} alt={`Foto ${i+1}`} className="w-10 h-10 rounded object-cover border" />
                                    <button onClick={() => setFotoFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">×</button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <label className="flex items-center gap-2 cursor-pointer border rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
                              <Camera className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">{fotoFiles.length > 0 ? `${fotoFiles.length} foto(s) — adicionar mais` : existingFotoUrl ? 'Adicionar/substituir fotos' : 'Foto comprovante'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => { const sel = Array.from(e.target.files || []); setFotoFiles(prev => [...prev, ...sel]); e.target.value = ''; }}
                              />
                            </label>
                          </>
                        </div>
                      )}
                      <div 
                        className="relative"
                        onClick={() => {
                          if (presencas.some(p => !p.presente && !p.justificativa)) {
                            toast({ title: "Não é possível salvar", description: "Selecione uma justificativa para todos os alunos com falta antes de finalizar a chamada.", variant: "destructive" });
                          }
                        }}
                      >
                        <Button 
                          className="bg-green-500 hover:bg-green-600 w-full"
                          onClick={(e) => {
                            if (!presencas.some(p => !p.presente && !p.justificativa)) {
                              if (editingChamada) {
                                saveChamadaMutation.mutate({});
                              } else {
                                setShowAlimentacaoModal(true);
                              }
                            } else {
                              e.preventDefault();
                            }
                          }}
                          disabled={!chamadaTurmaId || presencas.length === 0 || saveChamadaMutation.isPending || presencas.some(p => !p.presente && !p.justificativa)}
                          title={presencas.some(p => !p.presente && !p.justificativa) ? 'Selecione uma justificativa para todos os alunos com falta antes de salvar' : ''}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {saveChamadaMutation.isPending ? 'Salvando...' : editingChamada ? 'Atualizar Chamada' : 'Finalizar Chamada'}
                        </Button>
                      </div>
                      {editingChamada && (
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setEditingChamada(null);
                            setChamadaTurmaId('');
                            setChamadaData('');
                            setPresencas([]);
                            setFotoFile(null);
                            setFotoFiles([]);
                            setExistingFotoUrl(null);
                          }}
                        >
                          Cancelar Edição
                        </Button>
                      )}
                    </div>
                    
                    {chamadaTurmaId && !editingChamada && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg bg-gray-50 border">
                        <div className="flex items-center gap-2 flex-1 flex-wrap">
                          {modoManual ? (
                            <>
                              <Hand className="w-4 h-4 text-orange-500 shrink-0" />
                              <span className="text-sm font-medium text-orange-700">Modo Manual</span>
                            </>
                          ) : (
                            <>
                              <ScanFace className="w-4 h-4 text-blue-500" />
                              <span className="text-sm font-medium text-blue-700">Chamada Facial / Catraca</span>
                              {presencas.some(p => p.viaCatraca) && (
                                <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5">
                                  <Zap className="w-2.5 h-2.5 mr-0.5 inline" />
                                  {presencas.filter(p => p.viaCatraca).length} entrada{presencas.filter(p => p.viaCatraca).length !== 1 ? 's' : ''}
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold"
                            onClick={() => setShowScanner(true)}
                          >
                            <ScanFace className="w-4 h-4 mr-1" />
                            Chamada O Grito
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={modoManual ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500" : "text-black hover:bg-gray-100 hover:text-black"}
                            onClick={() => {
                              if (modoManual) {
                                setModoManual(false);
                              } else {
                                setMotivoManualSelect('');
                                setDescManual('');
                                setShowModoManualDialog(true);
                              }
                            }}
                          >
                            {modoManual ? (
                              <>
                                <ScanFace className="w-4 h-4 mr-1" />
                                Voltar p/ Facial
                              </>
                            ) : (
                              <>
                                <Hand className="w-4 h-4 mr-1" />
                                Chamada Manual
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {showScanner && chamadaTurmaId && chamadaData && (
                      <React.Suspense fallback={
                        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center">
                          <div className="bg-slate-900 rounded-2xl border border-slate-700 p-8 flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                            <p className="text-slate-300 text-sm">Iniciando scanner...</p>
                          </div>
                        </div>
                      }>
                        <ScannerPresencaModalLazy
                          turmaId={chamadaTurmaId}
                          tipo={vertente === 'pec' ? 'pec' : 'inclusao'}
                          data={chamadaData}
                          onClose={() => setShowScanner(false)}
                          onFinalize={refreshPresencaAposScanner}
                          onPresencaRegistrada={handleScannerPresencaRegistrada}
                        />
                      </React.Suspense>
                    )}

                    {chamadaTurmaId && profCatracaLog?.entradas && profCatracaLog.entradas.length > 0 && (
                      <div className="border rounded-lg p-3 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <Zap className="w-4 h-4 text-blue-500" />
                            Entradas via Catraca Hoje
                          </h4>
                          <span className="text-xs text-gray-400">
                            {profCatracaLog.entradas.filter((e: any) => {
                              const turma = minhasTurmas?.find((t: any) => t.id.toString() === chamadaTurmaId);
                              return turma ? (e.turma === turma.nome || e.turma === turma.title) : true;
                            }).length} registro(s)
                          </span>
                        </div>
                        <div className="grid gap-1.5 max-h-[160px] overflow-y-auto">
                          {profCatracaLog.entradas
                            .filter((e: any) => {
                              const turma = minhasTurmas?.find((t: any) => t.id.toString() === chamadaTurmaId);
                              return turma ? (e.turma === turma.nome || e.turma === turma.title) : true;
                            })
                            .map((entry: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between py-1.5 px-2 rounded bg-blue-50 border border-blue-100">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                  <span className="text-sm">{entry.nome}</span>
                                </div>
                                <span className="text-xs text-gray-500 font-mono">{entry.hora}</span>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    )}

                    {chamadaTurmaId && (
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-4">
                          Lista de Presença - {minhasTurmas?.find((t: any) => t.id.toString() === chamadaTurmaId)?.nome || minhasTurmas?.find((t: any) => t.id.toString() === chamadaTurmaId)?.title || 'Turma'}
                        </h3>
                        {alunosChamadaLoading ? (
                          <div className="text-center py-4 text-gray-500">Carregando alunos...</div>
                        ) : presencas.length === 0 ? (
                          <div className="text-center py-4 text-gray-500">
                            <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p>Nenhum aluno nesta turma.</p>
                            <p className="text-sm">Adicione alunos na seção "Turmas".</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {[...presencas].sort((a, b) => (a.nome || '').localeCompare(b.nome || '')).map((aluno) => {
                              const realIndex = presencas.findIndex(p => p.participanteId === aluno.participanteId);
                              return (
                              <div key={aluno.participanteId} className={`flex flex-col gap-2 p-3 border rounded ${!modoManual && !aluno.viaCatraca && !aluno.presente ? 'opacity-60' : ''}`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span>{aluno.nome}</span>
                                    {aluno.viaCatraca && aluno.horaEntrada && (
                                      <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 text-[10px] px-1.5">
                                        <Zap className="w-2.5 h-2.5 mr-0.5 inline" />
                                        {aluno.horaEntrada}
                                      </Badge>
                                    )}
                                  </div>
                                  {modoManual || editingChamada ? (
                                  <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input 
                                        type="radio" 
                                        name={`presenca-${aluno.participanteId}`}
                                        checked={aluno.presente}
                                        onChange={() => {
                                          const updated = [...presencas];
                                          updated[realIndex].presente = true;
                                          updated[realIndex].justificativa = undefined;
                                          setPresencas(updated);
                                        }}
                                        className="w-4 h-4 text-green-600"
                                      />
                                      <span className="text-sm text-green-600">Presente</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input 
                                        type="radio" 
                                        name={`presenca-${aluno.participanteId}`}
                                        checked={!aluno.presente}
                                        onChange={() => {
                                          const updated = [...presencas];
                                          updated[realIndex].presente = false;
                                          setPresencas(updated);
                                        }}
                                        className="w-4 h-4 text-red-600"
                                      />
                                      <span className="text-sm text-red-600">Falta</span>
                                    </label>
                                  </div>
                                  ) : (
                                  <div className="flex items-center gap-2">
                                    {aluno.presente ? (
                                      <Badge className="bg-green-100 text-green-700 border-green-200">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Presente
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-gray-400 border-gray-200">
                                        Aguardando catraca
                                      </Badge>
                                    )}
                                  </div>
                                  )}
                                </div>
                                {!aluno.presente && (modoManual || editingChamada) && (
                                  <div className="ml-7 space-y-1">
                                    <div className="flex flex-wrap gap-1">
                                      {['Doença', 'Atestado médico', 'Escola', 'Trabalho', 'Transporte', 'Família', 'Compromisso pessoal', 'Chuva/Clima', 'Outro', 'Sem justificativa'].map((opcao) => (
                                        <button
                                          key={opcao}
                                          type="button"
                                          onClick={() => {
                                            const updated = [...presencas];
                                            updated[realIndex].justificativa = opcao;
                                            setPresencas(updated);
                                          }}
                                          className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${aluno.justificativa === opcao ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                                        >
                                          {opcao}
                                        </button>
                                      ))}
                                    </div>
                                    <Input
                                      placeholder="Ou escreva a justificativa..."
                                      value={aluno.justificativa || ''}
                                      onChange={(e) => {
                                        const updated = [...presencas];
                                        updated[realIndex].justificativa = e.target.value;
                                        setPresencas(updated);
                                      }}
                                      className="text-sm h-8"
                                    />
                                  </div>
                                )}
                              </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!chamadaTurmaId && (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Selecione uma turma para fazer a chamada</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="font-semibold">Histórico de Presenças</h3>
                      <div className="flex rounded-lg overflow-hidden border border-gray-200 text-sm">
                        <button
                          onClick={() => setHistoricoTab('finalizadas')}
                          className={`px-3 py-1.5 font-medium transition-colors ${historicoTab === 'finalizadas' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                        >
                          Finalizadas
                        </button>
                        <button
                          onClick={() => setHistoricoTab('pendentes')}
                          className={`px-3 py-1.5 font-medium border-l border-gray-200 transition-colors ${historicoTab === 'pendentes' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                        >
                          Pendentes
                        </button>
                      </div>
                    </div>
                    
                    {/* Filtros de pesquisa */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label className="text-sm font-medium">Turma</Label>
                        <Select value={historicoFiltroTurma} onValueChange={(v) => { setHistoricoFiltroTurma(v); setHistoricoTurmaBusca(''); }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Todas as turmas" />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="px-2 pb-1 pt-1 sticky top-0 bg-white z-10" onKeyDown={e => e.stopPropagation()}>
                              <input
                                className="w-full rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-blue-400"
                                placeholder="Pesquisar turma..."
                                value={historicoTurmaBusca}
                                onChange={e => setHistoricoTurmaBusca(e.target.value)}
                                onKeyDown={e => e.stopPropagation()}
                              />
                            </div>
                            <SelectItem value="todas">Todas as turmas</SelectItem>
                            {(minhasTurmas || []).filter((t: any) => !historicoTurmaBusca || (t.nome || t.title || '').toLowerCase().includes(historicoTurmaBusca.toLowerCase())).map((turma: any) => (
                              <SelectItem key={turma.id} value={(turma.nome || turma.title)}>{(turma.nome || turma.title)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Data Início</Label>
                        <Input
                          type="date"
                          value={historicoFiltroDataInicio}
                          onChange={(e) => setHistoricoFiltroDataInicio(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Data Fim</Label>
                        <Input
                          type="date"
                          value={historicoFiltroDataFim}
                          onChange={(e) => setHistoricoFiltroDataFim(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    {(historicoFiltroTurma || historicoFiltroDataInicio || historicoFiltroDataFim) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setHistoricoFiltroTurma('');
                          setHistoricoFiltroDataInicio('');
                          setHistoricoFiltroDataFim('');
                        }}
                      >
                        Limpar Filtros
                      </Button>
                    )}
                    
                    {historicoLoading ? (
                      <div className="text-center py-4 text-gray-500">Carregando histórico...</div>
                    ) : historicoChamadas.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Nenhuma chamada registrada ainda.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {historicoChamadas
                          .filter((registro: any) => {
                            const turmaNome = registro.turmaNome || '';
                            const dataAtividade = registro.dataAtividade || registro.data;
                            const isPec = registro.tipo === 'pec';
                            const temFoto = !!(registro.fotoComprovante || registro.foto_comprovante);
                            const hasPresencas = !!(registro.presencas && registro.presencas.length > 0);
                            
                            // Filtro por aba
                            if (historicoTab === 'finalizadas' && !(isPec ? (temFoto && hasPresencas) : temFoto)) return false;
                            if (historicoTab === 'pendentes' && (isPec ? (!hasPresencas || temFoto) : temFoto)) return false;
                            
                            // Filtro por turma
                            if (historicoFiltroTurma && historicoFiltroTurma !== 'todas' && turmaNome !== historicoFiltroTurma) {
                              return false;
                            }
                            
                            // Filtro por data início
                            if (historicoFiltroDataInicio && dataAtividade) {
                              const dataRegistro = new Date(dataAtividade);
                              const dataInicio = new Date(historicoFiltroDataInicio);
                              if (dataRegistro < dataInicio) return false;
                            }
                            
                            // Filtro por data fim
                            if (historicoFiltroDataFim && dataAtividade) {
                              const dataRegistro = new Date(dataAtividade);
                              const dataFim = new Date(historicoFiltroDataFim);
                              dataFim.setHours(23, 59, 59);
                              if (dataRegistro > dataFim) return false;
                            }
                            
                            return true;
                          })
                          .map((registro: any) => {
                          const presentes = registro.totalPresentes ?? 0;
                          const total = registro.totalAlunos ?? presentes;
                          const dataAtividade = registro.dataAtividade || registro.data;
                          const isPec = registro.tipo === 'pec';
                          const temFoto = isPec
                            ? !!(registro.presencas && registro.presencas.length > 0)
                            : !!(registro.fotoComprovante || registro.foto_comprovante);
                          const rawFoto = registro.fotoComprovante || registro.foto_comprovante || '';
                          let fotoCount = 1;
                          try { const arr = JSON.parse(rawFoto); if (Array.isArray(arr)) fotoCount = arr.length; } catch {}
                          const turmaId = String(registro.grupoId || registro.turmaId || registro.grupo_id || registro.turma_id || '');
                          return (
                            <div key={registro.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div>
                                  <h4 className="font-medium">{registro.turmaNome}</h4>
                                  <p className="text-sm text-gray-500">
                                    {dataAtividade ? formatDateBrazil(dataAtividade) : 'Data não disponível'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <Badge className="bg-green-100 text-green-800">
                                    {presentes}/{total} presentes
                                  </Badge>
                                  <span className="text-xs text-gray-500">{total > 0 ? Math.round((presentes / total) * 100) : 0}% frequência</span>
                                  {temFoto && turmaId && dataAtividade && (
                                    <button
                                      onClick={async () => {
                                        setFotosGaleriaLoading(true);
                                        try {
                                          if (isPec) {
                                            const sessionNumId = String(registro.id).replace('pec_', '');
                                            const r = await fetch(`/api/pec/sessions/${sessionNumId}/fotos`, { credentials: 'include' });
                                            const d = await r.json();
                                            setFotosGaleriaDialog({ turmaId, data: dataAtividade, urls: d.urls || [] });
                                          } else {
                                            const r = await fetch(`/api/presencas-inclusao/fotos/${turmaId}/${dataAtividade}`, { credentials: 'include' });
                                            const d = await r.json();
                                            setFotosGaleriaDialog({ turmaId, data: dataAtividade, urls: d.urls || [] });
                                          }
                                        } catch { setFotosGaleriaDialog({ turmaId, data: dataAtividade, urls: [] }); }
                                        setFotosGaleriaLoading(false);
                                      }}
                                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                                    >
                                      <Camera className="w-3.5 h-3.5" />
                                      {fotoCount > 1 ? `${fotoCount} fotos` : 'Foto'}
                                    </button>
                                  )}
                                  {!temFoto && (
                                    <span className="text-xs text-orange-500 font-medium">Sem foto</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            </>
          )}

          {activeSection === 'planos' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Planos de Aula</CardTitle>
                <Button 
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={() => {
                    setPlanoForm({
                      turmaId: '', data: new Date().toISOString().split('T')[0], titulo: '', objetivos: '',
                      conteudo: '', metodologia: '', recursos: '', avaliacao: '', duracaoMinutos: '', status: 'rascunho'
                    });
                    setShowNovoPlanoModal(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Plano
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap mb-5">
                  {(['cadastrados', 'pendentes'] as const).map((aba) => (
                    <button
                      key={aba}
                      type="button"
                      onClick={() => setAbaPlanos(aba)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        abaPlanos === aba
                          ? aba === 'pendentes'
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {aba === 'cadastrados'
                        ? `Cadastrados (${meusPlanos.length})`
                        : `Pendentes (${planosPendentes.length})`}
                    </button>
                  ))}
                </div>

                {abaPlanos === 'pendentes' ? (
                  planosPendentesLoading ? (
                    <div className="text-center py-8 text-gray-500">Carregando pendentes...</div>
                  ) : planosPendentes.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <p className="text-gray-500">Todos os dias de aula já têm plano cadastrado.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {(planosPendentes as any[]).map((pendente: any) => (
                        <div
                          key={`${pendente.turmaId}-${pendente.data}`}
                          className={`border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                            pendente.atrasado ? 'bg-orange-50 border-orange-200' : 'bg-white'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-semibold text-gray-900">{pendente.turmaNome}</h3>
                              {pendente.atrasado && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500 text-white shrink-0">
                                  Atrasado
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {pendente.label || formatDateBrazil(pendente.data)}
                              {pendente.dayOfWeek ? ` · ${pendente.dayOfWeek}` : ''}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 shrink-0"
                            onClick={() => handleAbrirPlanoPendente(pendente)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Criar plano
                          </Button>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                <>
                {/* Filtros: nome, turma, data, responsável */}
                {!planosLoading && meusPlanos.length > 0 && (() => {
                  const turmasUnicas = [...new Set((meusPlanos as any[]).map((p: any) => p.turmaNome).filter(Boolean))] as string[];
                  const responsaveisUnicos = [...new Set((meusPlanos as any[]).map((p: any) => p.professorNome).filter(Boolean))] as string[];
                  const temFiltro = filtroPlanos.nome || filtroPlanos.turma || filtroPlanos.data || filtroPlanos.responsavel;

                  const turmasSugeridas = turmasUnicas.filter(t =>
                    !filtroPlanos.turma || t.toLowerCase().includes(filtroPlanos.turma.toLowerCase())
                  );
                  const respSugeridos = responsaveisUnicos.filter(r =>
                    !filtroPlanos.responsavel || r.toLowerCase().includes(filtroPlanos.responsavel.toLowerCase())
                  );

                  return (
                    <div className="mb-5 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        {/* Nome */}
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-gray-500 font-medium">Nome</label>
                          <input
                            type="text"
                            placeholder="Buscar por título..."
                            value={filtroPlanos.nome}
                            onChange={e => setFiltroPlanos(f => ({ ...f, nome: e.target.value }))}
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                          />
                        </div>

                        {/* Turma — combobox customizado */}
                        <div className="flex flex-col gap-1 relative">
                          <label className="text-xs text-gray-500 font-medium">Turma</label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Selecionar ou digitar..."
                              value={filtroPlanos.turma}
                              onChange={e => { setFiltroPlanos(f => ({ ...f, turma: e.target.value })); setFiltroDropdownAberto('turma'); }}
                              onFocus={() => setFiltroDropdownAberto('turma')}
                              onBlur={() => setTimeout(() => setFiltroDropdownAberto(null), 150)}
                              className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full pr-8"
                            />
                            {filtroPlanos.turma && (
                              <button type="button" onClick={() => setFiltroPlanos(f => ({ ...f, turma: '' }))}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                            )}
                          </div>
                          {filtroDropdownAberto === 'turma' && turmasSugeridas.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-44 overflow-y-auto mt-1">
                              {turmasSugeridas.map(t => (
                                <button key={t} type="button"
                                  onMouseDown={() => { setFiltroPlanos(f => ({ ...f, turma: t })); setFiltroDropdownAberto(null); }}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors ${filtroPlanos.turma === t ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                                >{t}</button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Data */}
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-gray-500 font-medium">Data</label>
                          <input
                            type="date"
                            value={filtroPlanos.data}
                            onChange={e => setFiltroPlanos(f => ({ ...f, data: e.target.value }))}
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                          />
                        </div>

                        {/* Responsável — combobox customizado */}
                        <div className="flex flex-col gap-1 relative">
                          <label className="text-xs text-gray-500 font-medium">Responsável</label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Selecionar ou digitar..."
                              value={filtroPlanos.responsavel}
                              onChange={e => { setFiltroPlanos(f => ({ ...f, responsavel: e.target.value })); setFiltroDropdownAberto('responsavel'); }}
                              onFocus={() => setFiltroDropdownAberto('responsavel')}
                              onBlur={() => setTimeout(() => setFiltroDropdownAberto(null), 150)}
                              className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full pr-8"
                            />
                            {filtroPlanos.responsavel && (
                              <button type="button" onClick={() => setFiltroPlanos(f => ({ ...f, responsavel: '' }))}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                            )}
                          </div>
                          {filtroDropdownAberto === 'responsavel' && respSugeridos.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-44 overflow-y-auto mt-1">
                              {respSugeridos.map(r => (
                                <button key={r} type="button"
                                  onMouseDown={() => { setFiltroPlanos(f => ({ ...f, responsavel: r })); setFiltroDropdownAberto(null); }}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors ${filtroPlanos.responsavel === r ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                                >{r}</button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {temFiltro && (
                        <button
                          onClick={() => setFiltroPlanos({ nome: '', turma: '', data: '', responsavel: '' })}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Limpar filtros
                        </button>
                      )}
                    </div>
                  );
                })()}
                {planosLoading ? (
                  <div className="text-center py-8 text-gray-500">Carregando planos...</div>
                ) : meusPlanos.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Nenhum plano de aula criado ainda</p>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setPlanoForm({
                          turmaId: '', data: new Date().toISOString().split('T')[0], titulo: '', objetivos: '',
                          conteudo: '', metodologia: '', recursos: '', avaliacao: '', duracaoMinutos: '', status: 'rascunho'
                        });
                        setShowNovoPlanoModal(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Criar seu primeiro plano
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {(meusPlanos as any[])
                      .filter((p: any) => {
                        if (filtroPlanos.nome && !p.titulo?.toLowerCase().includes(filtroPlanos.nome.toLowerCase())) return false;
                        if (filtroPlanos.turma && !p.turmaNome?.toLowerCase().includes(filtroPlanos.turma.toLowerCase())) return false;
                        if (filtroPlanos.data && p.data !== filtroPlanos.data) return false;
                        if (filtroPlanos.responsavel && !p.professorNome?.toLowerCase().includes(filtroPlanos.responsavel.toLowerCase())) return false;
                        return true;
                      })
                      .map((plano: any) => (
                      <div key={plano.id} className={`border rounded-lg p-4 ${!plano.isMine ? 'bg-slate-50 border-slate-200' : ''}`}>
                        <div className="flex items-start justify-between mb-2 gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <h3 className="font-semibold">{plano.titulo}</h3>
                            {!plano.isMine && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 shrink-0">
                                {plano.professorNome || 'Colega'}
                              </span>
                            )}
                            {plano.temRelatorio && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 shrink-0">✓ com relatório</span>
                            )}
                          </div>
                          {isPlanoStatusExibivel(plano.status) && (
                            <Badge variant={plano.status === 'aplicado' ? 'secondary' : 'default'} className="shrink-0">
                              {labelPlanoStatusExibivel(plano.status)}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Turma:</strong> {plano.turmaNome || 'N/A'}</p>
                          <p><strong>Data:</strong> {formatDateBrazil(plano.data)}</p>
                          {plano.duracaoMinutos && <p><strong>Duração:</strong> {plano.duracaoMinutos} minutos</p>}
                        </div>
                        <div className="flex gap-2 mt-3">
                          {plano.isMine && (
                            <Button size="sm" variant="outline" onClick={() => handleEditPlano(plano)}>
                              <Edit className="w-4 h-4 mr-1" />
                              Editar
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => handleViewPlano(plano)}>
                            <FileText className="w-4 h-4 mr-1" />
                            Visualizar
                          </Button>
                          {plano.isMine && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => handleDeletePlano(plano)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Excluir
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </>
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === 'aulas' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Relatórios de Aulas</CardTitle>
                <Button className="bg-blue-500 hover:bg-blue-600" onClick={abrirNovoRelatorioVazio}>
                  <Plus className="w-4 h-4 mr-2" />Novo Relatório
                </Button>
              </CardHeader>
              <CardContent>
                {/* [FORM MOVED TO MODAL] */}
                <div className="border rounded-lg p-4 hidden">
                    <h3 className="font-semibold mb-4">Novo Relatório de Aula (placeholder - não renderiza)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Turma *</label>
                        <Select 
                          value={registroAulaForm.turmaId}
                          onValueChange={(v) => {
                            setRegistroAulaForm({...registroAulaForm, turmaId: v, planoId: '', chamadaId: '', data: ''});
                            setRelatorioTurmaBusca('');
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a turma" />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="px-2 pb-1 pt-1 sticky top-0 bg-white z-10" onKeyDown={e => e.stopPropagation()}>
                              <input
                                className="w-full rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-blue-400"
                                placeholder="Pesquisar turma..."
                                value={relatorioTurmaBusca}
                                onChange={e => setRelatorioTurmaBusca(e.target.value)}
                                onKeyDown={e => e.stopPropagation()}
                              />
                            </div>
                            {(minhasTurmas || [])
                              .slice()
                              .sort((a: any, b: any) =>
                                String(a?.nome || a?.title || '').localeCompare(
                                  String(b?.nome || b?.title || ''),
                                  'pt-BR',
                                  { sensitivity: 'base' }
                                )
                              )
                              .filter((turma: any) =>
                                !relatorioTurmaBusca ||
                                String(turma?.nome || turma?.title || '')
                                  .toLowerCase()
                                  .includes(relatorioTurmaBusca.toLowerCase())
                              )
                              .map((turma: any) => (
                              <SelectItem key={turma.id} value={turma.id.toString()}>
                                {(turma.nome || turma.title)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Data da Aula *</label>
                        {(() => {
                          const turmaSel = minhasTurmas.find((t: any) => t.id.toString() === registroAulaForm.turmaId);
                          const diasAula = turmaSel ? getDiasAulaParaTurma(turmaSel) : [];
                          const diasDisponiveis = diasAula.filter(
                            (d) => !turmaJaTemRelatorioNaData(relatoriosAulas as any[], registroAulaForm.turmaId, d.date)
                          );
                          return diasDisponiveis.length > 0 ? (
                            <Select value={registroAulaForm.data} onValueChange={(v) => {
                              const planoDoDia = meusPlanos.find((p: any) =>
                                p.data === v && p.turmaId?.toString() === registroAulaForm.turmaId
                              );
                              const chamadaDoDia = historicoChamadas.find((c: any) => {
                                const turmaIdFromGrupo = c.grupo?.match(/turma_(\d+)/)?.[1];
                                const dataStr = c.dataAtividade || c.data || '';
                                return turmaIdFromGrupo === registroAulaForm.turmaId && dataStr.startsWith(v);
                              });
                              setRegistroAulaForm(prev => ({
                                ...prev,
                                data: v,
                                planoId: planoDoDia?.id?.toString() || '',
                                chamadaId: chamadaDoDia?.id?.toString() || ''
                              }));
                            }}>
                              <SelectTrigger><SelectValue placeholder="Selecione o dia" /></SelectTrigger>
                              <SelectContent>
                                {diasDisponiveis.map((dia) => (
                                  <SelectItem key={dia.date} value={dia.date}>{dia.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Select disabled>
                              <SelectTrigger>
                                <SelectValue placeholder={
                                  !registroAulaForm.turmaId ? "Selecione a turma primeiro" :
                                  diasAula.length === 0 ? "Nenhum dia cadastrado" :
                                  "Todos os dias já têm relatório cadastrado"
                                } />
                              </SelectTrigger>
                            </Select>
                          );
                        })()}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Plano de Aula <span className="text-red-500">*</span></label>
                        <Select 
                          value={registroAulaForm.planoId}
                          onValueChange={(v) => {
                            setRegistroAulaForm(prev => ({ ...prev, planoId: v }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um plano de aula" />
                          </SelectTrigger>
                          <SelectContent>
                            {meusPlanos
                              .filter((p: any) => !registroAulaForm.turmaId || p.turmaId?.toString() === registroAulaForm.turmaId)
                              .map((plano: any) => (
                                <SelectItem key={plano.id} value={plano.id.toString()}>
                                  {plano.titulo} - {formatDateBrazil(plano.data)}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Chamada realizada (opcional)</label>
                        <Select 
                          value={registroAulaForm.chamadaId}
                          onValueChange={(v) => setRegistroAulaForm({...registroAulaForm, chamadaId: v})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a chamada (opcional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {historicoChamadas
                              .filter((c: any) => {
                                // Extrair turmaId do campo grupo (formato: turma_XX)
                                const turmaIdFromGrupo = c.grupo?.match(/turma_(\d+)/)?.[1];
                                const matchTurma = !registroAulaForm.turmaId || turmaIdFromGrupo === registroAulaForm.turmaId;
                                // Usar dataAtividade para filtro de data
                                const dataStr = c.dataAtividade || c.data || '';
                                const matchData = !filtroChamadaData || dataStr.startsWith(filtroChamadaData);
                                return matchTurma && matchData;
                              })
                              .map((chamada: any) => {
                                // Usar totalPresentes e totalAlunos da API
                                const presentes = chamada.totalPresentes ?? 0;
                                const total = chamada.totalAlunos ?? presentes;
                                const dataExibir = chamada.dataAtividade || chamada.data;
                                return (
                                  <SelectItem key={chamada.id} value={chamada.id.toString()}>
                                    {formatDateBrazil(dataExibir)} - {chamada.turmaNome || 'Turma'} ({presentes}/{total} presentes)
                                  </SelectItem>
                                );
                              })}
                          </SelectContent>
                        </Select>
                      </div>
                      {(() => {
                        const planoAtual = meusPlanos.find((p: any) => p.id.toString() === registroAulaForm.planoId);
                        if (!planoAtual) return null;
                        return (
                          <>
                            {planoAtual.objetivos && (
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2 text-slate-500">Objetivos do Plano de Aula</label>
                                <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 whitespace-pre-wrap min-h-[60px]">
                                  {planoAtual.objetivos}
                                </div>
                              </div>
                            )}
                            {planoAtual.conteudo && (
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2 text-slate-500">Conteúdo do Plano de Aula</label>
                                <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 whitespace-pre-wrap min-h-[60px]">
                                  {planoAtual.conteudo}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Relatório de aula *</label>
                        <Textarea 
                          placeholder="Descreva como a aula foi conduzida, o que funcionou, dificuldades encontradas, participação dos alunos..." 
                          rows={4}
                          value={registroAulaForm.conteudo}
                          onChange={(e) => setRegistroAulaForm({...registroAulaForm, conteudo: e.target.value})}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Observações</label>
                        <Textarea 
                          placeholder="Observações sobre a aula, participação dos alunos, etc." 
                          rows={2}
                          value={registroAulaForm.observacoes}
                          onChange={(e) => setRegistroAulaForm({...registroAulaForm, observacoes: e.target.value})}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">
                          Foto da Aula <span className="text-red-500">*</span>
                        </label>
                        <div
                          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${fotoRegistroAula ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400'}`}
                          onClick={() => fotoRegistroAulaRef.current?.click()}
                        >
                          {fotoRegistroAula ? (
                            <div className="flex items-center justify-center gap-3">
                              <img src={URL.createObjectURL(fotoRegistroAula)} alt="Preview" className="w-16 h-16 rounded object-cover border" />
                              <div className="text-left">
                                <p className="text-sm font-medium text-green-700">{fotoRegistroAula.name}</p>
                                <button type="button" className="text-xs text-red-500 mt-1 hover:underline"
                                  onClick={(e) => { e.stopPropagation(); setFotoRegistroAula(null); }}>
                                  Remover foto
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-400">
                              <Upload className="w-8 h-8 mx-auto mb-2" />
                              <p className="text-sm">Clique para anexar uma foto da aula</p>
                              <p className="text-xs mt-1">JPG, PNG ou WEBP</p>
                            </div>
                          )}
                        </div>
                        <input
                          ref={fotoRegistroAulaRef}
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setFotoRegistroAula(file);
                            if (fotoRegistroAulaRef.current) fotoRegistroAulaRef.current.value = '';
                          }}
                        />
                      </div>
                    </div>
                    <Button 
                      className="mt-4 bg-blue-500 hover:bg-blue-600"
                      onClick={handleSalvarRegistroAula}
                      disabled={!registroAulaForm.turmaId}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Salvar Registro
                    </Button>
                  </div>

                  <div className="flex flex-col gap-3 mb-4">
                    <div className="flex flex-col sm:flex-row gap-2 flex-wrap items-end">
                      <div className="flex flex-col gap-1 w-full sm:w-auto sm:min-w-[200px]">
                        <Label className="text-xs text-gray-500">Turma</Label>
                        <select
                          value={filtroTurmaRel}
                          onChange={(e) => setFiltroTurmaRel(e.target.value)}
                          className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        >
                          <option value="">Todas as turmas</option>
                          {(minhasTurmas as any[]).map((t: any) => (
                            <option key={t.id} value={t.id.toString()}>{t.nome || t.title}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1 w-full sm:w-auto sm:min-w-[200px]">
                        <Label className="text-xs text-gray-500">Mês</Label>
                        <select
                          value={filtroMesRel}
                          onChange={(e) => setFiltroMesRel(e.target.value)}
                          className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        >
                          <option value="">Todos os meses</option>
                          {(() => {
                            const dias = buildTodosDiasAulaDasTurmas(minhasTurmas);
                            const meses = extrairMesesDosDiasAula(dias);
                            const opcoes =
                              meses.length > 0 ? meses : extrairTodosMesesDasTurmas(minhasTurmas);
                            return opcoes;
                          })().map((ym) => (
                            <option key={ym} value={ym}>
                              {formatMesRelatorioLabel(ym)}
                            </option>
                          ))}
                        </select>
                      </div>
                      {(filtroTurmaRel || filtroMesRel) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="self-end"
                          onClick={() => {
                            setFiltroTurmaRel("");
                            setFiltroMesRel("");
                          }}
                        >
                          Limpar filtros
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Clique em um dia de aula para lançar ou visualizar o relatório.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {(() => {
                      const todosDias = buildTodosDiasAulaDasTurmas(minhasTurmas);
                      const diasFiltrados = todosDias.filter((d) => {
                        const matchTurma = !filtroTurmaRel || d.turmaId === filtroTurmaRel;
                        const matchMes = !filtroMesRel || d.date.startsWith(filtroMesRel);
                        return matchTurma && matchMes;
                      });

                      if (diasFiltrados.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <Calendar className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                            <p className="text-gray-500">
                              Nenhum dia de aula encontrado para os filtros selecionados.
                            </p>
                          </div>
                        );
                      }

                      return diasFiltrados.map((dia) => {
                        const temRelatorio = turmaJaTemRelatorioNaData(
                          relatoriosAulas as any[],
                          dia.turmaId,
                          dia.date
                        );
                        const planoDoDia = meusPlanos.find(
                          (p: any) =>
                            normalizeToYMD(p.data) === dia.date &&
                            p.turmaId?.toString() === dia.turmaId
                        );
                        const relatorioDoDia = (relatoriosAulas as any[]).find(
                          (r) =>
                            (r.turmaId ?? r.turma_id)?.toString() === dia.turmaId &&
                            normalizeToYMD(r.data) === dia.date
                        );
                        const subtitulo = relatorioDoDia?.titulo
                          || (planoDoDia?.titulo ? planoDoDia.titulo : null);

                        return (
                          <div
                            key={`${dia.turmaId}-${dia.date}`}
                            className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                              temRelatorio
                                ? "border-green-200 bg-green-50/40"
                                : planoDoDia
                                  ? "border-orange-200 bg-orange-50/40"
                                  : "border-gray-200"
                            }`}
                            onClick={() => abrirRelatorioParaDia(dia.turmaId, dia.date)}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText
                                  className={`w-4 h-4 shrink-0 ${
                                    temRelatorio
                                      ? "text-green-600"
                                      : planoDoDia
                                        ? "text-orange-500"
                                        : "text-gray-400"
                                  }`}
                                />
                                <div className="min-w-0">
                                  <span className="font-medium text-sm text-gray-800 block truncate">
                                    {dia.label}
                                  </span>
                                  {subtitulo && (
                                    <span className="text-xs text-gray-500 block truncate">{subtitulo}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-gray-500 hidden sm:inline">{dia.turmaNome}</span>
                                {temRelatorio ? (
                                  <Badge className="bg-green-100 text-green-800 text-xs shrink-0">
                                    Relatório feito
                                  </Badge>
                                ) : planoDoDia ? (
                                  <Badge variant="outline" className="text-xs border-orange-400 text-orange-600 shrink-0">
                                    Pendente
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs text-gray-500 shrink-0">
                                    Sem plano
                                  </Badge>
                                )}
                                {temRelatorio && (
                                  <span className="text-xs text-blue-600 flex items-center gap-1">
                                    <Eye className="w-3.5 h-3.5" /> Ver
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 sm:hidden">{dia.turmaNome}</p>
                          </div>
                        );
                      });
                    })()}
                  </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'turmas' && (
            <>
            <Card>
              <CardHeader className="flex flex-col gap-4">
                <div className="flex flex-row items-center justify-between w-full">
                  <CardTitle>Minhas Turmas</CardTitle>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" className={filtroStatusTurma === "todos" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500" : ""} size="sm" onClick={() => setFiltroStatusTurma("todos")}>Todas</Button>
                  <Button variant="outline" className={filtroStatusTurma === "ativo" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500" : ""} size="sm" onClick={() => setFiltroStatusTurma("ativo")}>Em Andamento</Button>
                  <Button variant="outline" className={filtroStatusTurma === "planejado" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500" : ""} size="sm" onClick={() => setFiltroStatusTurma("planejado")}>Planejadas</Button>
                  <Button variant="outline" className={filtroStatusTurma === "concluido" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500" : ""} size="sm" onClick={() => setFiltroStatusTurma("concluido")}>Concluídas</Button>
                  <Button variant="outline" className={filtroStatusTurma === "inativo" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500" : ""} size="sm" onClick={() => setFiltroStatusTurma("inativo")}>Inativas</Button>
                </div>
                <div className="w-full">
                  <Input
                    placeholder="Buscar turma pelo nome..."
                    value={buscaTurma}
                    onChange={(e) => setBuscaTurma(e.target.value)}
                    className="w-full max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {turmasLoading ? (
                  <div className="text-center py-8 text-gray-500">Carregando turmas...</div>
                ) : minhasTurmas.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-4">Nenhuma turma vinculada ao seu perfil. Solicite ao coordenador a vinculação.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {minhasTurmas
                      .filter((turma: any) => {
                        if (filtroStatusTurma !== "inativo" && filtroStatusTurma !== "concluido" && (turma.status === 'inativo' || turma.status === 'encerrada')) return false;
                        if (filtroStatusTurma === "inativo" && turma.status !== 'inativo') return false;
                        const nomeTurma = (turma.nome || turma.title || '').toLowerCase();
                        if (buscaTurma && !nomeTurma.includes(buscaTurma.toLowerCase())) return false;
                        if (filtroStatusTurma === "todos") return true;
                        if (filtroStatusTurma === "ativo") return turma.status === "ativo" || turma.status === "emandamento" || turma.status === "em_andamento" || turma.status === "execucao";
                        if (filtroStatusTurma === "planejado") return turma.status === "planejado" || turma.status === "pendente" || turma.status === "planejamento";
                        if (filtroStatusTurma === "concluido") return turma.status === "concluido" || turma.status === "finalizado" || turma.status === "encerrada";
                        return turma.status === filtroStatusTurma;
                      })
                      .sort((a: any, b: any) => {
                        const dataA = a.created_at || a.createdAt || a.data_inicio || "";
                        const dataB = b.created_at || b.createdAt || b.data_inicio || "";
                        return new Date(dataB).getTime() - new Date(dataA).getTime();
                      })
                      .map((turma: any) => (
                      <div key={turma.id} className="border rounded-lg p-4" style={{ borderColor: turma.marcadorCor || '#86efac' }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {turma.marcadorIcone && MARCADOR_ICONE_MAP[turma.marcadorIcone] && (() => {
                              const IconComp = MARCADOR_ICONE_MAP[turma.marcadorIcone];
                              return <IconComp className="w-5 h-5" style={{ color: turma.marcadorCor || '#22c55e' }} />;
                            })()}
                            {turma.marcadorCor && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: turma.marcadorCor }}></div>}
                            <h3 className="font-semibold">{(turma.nome || turma.title)}</h3>
                          </div>
                          <Badge className={
                            turma.status === "concluido" || turma.status === "encerrada" ? "bg-blue-100 text-blue-800" :
                            turma.status === "planejamento" || turma.status === "planejado" ? "bg-yellow-100 text-yellow-800" :
                            turma.status === "inativo" ? "bg-gray-100 text-gray-600" :
                            "bg-green-100 text-green-800"
                          }>
                            {turma.status === "concluido" || turma.status === "encerrada" ? "Finalizada" :
                             turma.status === "planejamento" || turma.status === "planejado" ? "Planejada" :
                             turma.status === "inativo" ? "Inativa" : "Em Andamento"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Horário:</span>
                            <p className="font-medium">{turma.horarioInicio || turma.horarioEntrada || turma.start_time || '-'} - {turma.horarioFim || turma.horarioSaida || turma.end_time || '-'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Alunos:</span>
                            <p className="font-medium">{turma.alunosCount || 0}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Local:</span>
                            <p className="font-medium">{turma.local || '-'}</p>
                          </div>
                        </div>
                        {turma.descricao && (
                          <p className="text-sm text-gray-600 mt-2">{turma.descricao}</p>
                        )}
                        {turma.status === "concluido" && vertente === "inclusao" && (
                          <div className="flex items-center gap-2 mt-3 p-2 bg-green-50 rounded-md border border-green-200">
                            <GraduationCap className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700">
                              Turma Finalizada: {turma.alunosConcluidos || 0} de {turma.totalParticipantes || turma.alunosCount || 0} alunos formados
                            </span>
                          </div>
                        )}
                        <div className="flex gap-2 mt-4 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => {
                            setSelectedTurma(turma);
                            setShowDetalhesTurmaModal(true);
                          }}>
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-50" onClick={() => {
                            setSelectedTurma(turma);
                            if (vertente === "inclusao") {
                              setTurmaGerenciarInclusao(turma);
                              setShowGerenciarAlunosTurmaInclusao(true);
                            } else {
                              setShowTurmaDetailModal(true);
                            }
                          }}>
                            <UserPlus className="w-4 h-4 mr-1" />
                            Gerenciar Alunos
                          </Button>
                          <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50"
                            onClick={() => baixarListaAlunos(turma.id, turma, vertente !== 'inclusao')}>
                            <FileDown className="w-4 h-4 mr-1" />
                            Baixar lista
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            setSelectedTurma(turma);
                            setShowEditTurmaModal(true);
                          }}>
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          {vertente === "inclusao" && turma.status !== "concluido" && (
                            <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50" onClick={async () => {
                              setSelectedTurma(turma);
                              setParticipantesSelecionados([]);
                              setIsLoadingParticipantesTurma(true);
                              try {
                                const response = await fetch(`/api/turmas-inclusao/${turma.id}/participantes`);
                                if (response.ok) {
                                  const data = await response.json();
                                  setParticipantesTurmaAtual(data.filter((p: any) => { const s = String(p?.status || "").toLowerCase(); return s === "ativo" || s === "concluido"; }));
                                } else {
                                  toast({ title: "Erro", description: "Não foi possível carregar os participantes", variant: "destructive" });
                                }
                              } catch (error) {
                                console.error("Erro ao carregar participantes:", error);
                                toast({ title: "Erro", description: "Erro ao carregar participantes", variant: "destructive" });
                              } finally {
                                setIsLoadingParticipantesTurma(false);
                              }
                              setShowFinalizarTurmaModal(true);
                            }}>
                              <GraduationCap className="w-4 h-4 mr-1" />
                              Finalizar
                            </Button>
                          )}
                          {turma.status === 'inativo' ? (
                            <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50" onClick={() => {
                              if (confirm(`Deseja reativar a turma "${(turma.nome || turma.title)}"?`)) {
                                reativarTurmaMutation.mutate(turma.id);
                              }
                            }}>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Reativar
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" className="text-orange-600 hover:bg-orange-50" onClick={() => {
                              if (confirm(`Tem certeza que deseja inativar a turma "${(turma.nome || turma.title)}"?`)) {
                                inativarTurmaMutation.mutate(turma.id);
                              }
                            }}>
                              <XCircle className="w-4 h-4 mr-1" />
                              Inativar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            </>
          )}

          {/* Modal Nova Turma - unificado: TurmaInclusaoForm (inclusão) / InstanceForm (PEC) */}
          {vertente === 'inclusao' ? (
            <TurmaInclusaoForm
              open={showNovaTurmaModal}
              onClose={() => {
                setShowNovaTurmaModal(false);
                queryClient.invalidateQueries({ queryKey: ['/api/professor/turmas', userId, vertente] });
              }}
              monitorUserId={parseInt(userId || '0')}
            />
          ) : (
            <InstanceForm 
              open={showNovaTurmaModal}
              onClose={() => {
                setShowNovaTurmaModal(false);
                queryClient.invalidateQueries({ queryKey: ['/api/professor/turmas', userId, vertente] });
              }}
              monitorUserId={parseInt(userId || '0')}
            />
          )}

          {/* Modal Editar Turma - usa TurmaInclusaoForm para inclusão, InstanceForm para PEC */}
          {vertente === 'inclusao' ? (
            <TurmaInclusaoForm
              open={showEditTurmaModal}
              onClose={() => {
                setShowEditTurmaModal(false);
                setSelectedTurma(null);
                queryClient.invalidateQueries({ queryKey: ['/api/professor/turmas', userId, vertente] });
              }}
              turma={selectedTurma}
              monitorUserId={parseInt(userId || '0')}
            />
          ) : (
            <InstanceForm 
              open={showEditTurmaModal}
              onClose={() => {
                setShowEditTurmaModal(false);
                setSelectedTurma(null);
                queryClient.invalidateQueries({ queryKey: ['/api/professor/turmas', userId, vertente] });
              }}
              instance={selectedTurma}
              monitorUserId={parseInt(userId || '0')}
            />
          )}

          <TurmaDetailModalInclusao
            open={showGerenciarAlunosTurmaInclusao}
            onOpenChange={setShowGerenciarAlunosTurmaInclusao}
            turma={turmaGerenciarInclusao}
          />
          <TurmaDetailModal
            open={showTurmaDetailModal}
            onOpenChange={setShowTurmaDetailModal}
            selectedInstance={selectedTurma}
          />

          {/* Modal Gerenciar Alunos da Turma (legacy) */}
          <Dialog open={showGerenciarAlunosModal} onOpenChange={(open) => {
            setShowGerenciarAlunosModal(open);
            if (!open) setSelectedTurma(null);
          }}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Gerenciar Alunos - {selectedTurma?.nome}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Alunos já na turma */}
                <div>
                  <h3 className="font-semibold text-green-700 mb-3">Alunos na Turma ({alunosDaTurma.length})</h3>
                  {alunosTurmaLoading ? (
                    <div className="text-center py-4 text-gray-500">Carregando...</div>
                  ) : alunosDaTurma.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 border rounded-lg bg-gray-50">
                      Nenhum aluno adicionado ainda
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                      {[...alunosDaTurma].sort((a: any, b: any) => (a.nome || "").localeCompare(b.nome || "", 'pt-BR')).map((aluno: any) => (
                        <div key={aluno.id} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-green-700" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{aluno.nome}</p>
                              <p className="text-xs text-gray-500">{aluno.codigoMatricula || aluno.cpf}</p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:bg-red-50"
                            disabled={removeAlunoTurmaMutation.isPending}
                            onClick={() => removeAlunoTurmaMutation.mutate({ turmaId: selectedTurma.id, alunoId: aluno.id })}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Buscar e adicionar alunos */}
                <div>
                  <h3 className="font-semibold mb-3">Adicionar Alunos</h3>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar participante por nome..."
                      value={buscaAlunoTurma}
                      onChange={(e) => setBuscaAlunoTurma(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                    {participantesDisponiveis.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        {buscaAlunoTurma ? 'Nenhum participante encontrado' : 'Todos os participantes já estão na turma'}
                      </div>
                    ) : (
                      participantesDisponiveis.slice(0, 20).map((participante: any) => (
                        <div key={participante.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded border">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{participante.nome}</p>
                                {participante.status?.toLowerCase() === 'inativo' && (
                                  <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Inativo</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">{participante.codigoMatricula || participante.cpf}</p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            className="bg-green-500 hover:bg-green-600"
                            disabled={addAlunoTurmaMutation.isPending}
                            onClick={() => {
                              setDataIngressoProf(getBrazilDateString());
                              setPendingAddAlunoProf({ turmaId: selectedTurma.id, participanteId: participante.id, nome: participante.nome || participante.cpf });
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                    {participantesDisponiveis.length > 20 && (
                      <p className="text-center text-sm text-gray-500 py-2">
                        Mostrando 20 de {participantesDisponiveis.length}. Use a busca para encontrar mais.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button variant="outline" onClick={() => { setShowGerenciarAlunosModal(false); setSelectedTurma(null); }}>
                    Fechar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {activeSection === 'calendario' && (() => {
            const ano = calendarioMes.getFullYear();
            const mes = calendarioMes.getMonth();
            const primeiroDia = new Date(ano, mes, 1).getDay();
            const ultimoDia = new Date(ano, mes + 1, 0).getDate();
            const hoje = new Date();
            const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
            
            const aulaColors = ['blue', 'indigo', 'pink', 'cyan', 'orange', 'emerald'];
            const aulasNoMes: Array<{ data: string; turmaNome: string; cor: string; horario?: string; icone?: string }> = [];

            minhasTurmas.forEach((turma: any, tIdx: number) => {
              const turmaStatus = turma.status || turma.situation || 'ativo';
              if (turmaStatus === 'inativo' || turmaStatus === 'cancelado') return;

              const cor = turma.marcadorCor || aulaColors[tIdx % aulaColors.length];
              const nomeTurma = turma.nome || turma.title || 'Turma';
              const horario = turma.horarioEntrada && turma.horarioSaida 
                ? `${turma.horarioEntrada} - ${turma.horarioSaida}` 
                : turma.horarioInicio && turma.horarioFim 
                  ? `${turma.horarioInicio} - ${turma.horarioFim}`
                  : turma.horario || '';

              const diasDaTurma = getDiasAulaParaTurma(turma);
              diasDaTurma.forEach((dia) => {
                const [dYear, dMonth] = dia.date.split('-').map(Number);
                if (dYear === ano && dMonth - 1 === mes) {
                  aulasNoMes.push({ data: dia.date, turmaNome: nomeTurma, cor, horario, icone: turma.marcadorIcone });
                }
              });
            });

            // Combinar planos de aula, chamadas e eventos do professor
            const todosEventos = [
              ...meusPlanos.map((p: any) => ({
                id: `plano-${p.id}`,
                data: p.data,
                titulo: p.titulo,
                tipo: 'Plano de Aula',
                turmaNome: p.turmaNome,
                cor: 'purple'
              })),
              ...historicoChamadas.map((c: any) => ({
                id: `chamada-${c.id}`,
                data: c.dataAtividade,
                titulo: c.titulo || 'Chamada',
                tipo: 'Chamada',
                turmaNome: c.turmaNome,
                cor: 'yellow'
              })),
              ...eventosProfessor.map((e) => ({
                id: `evento-${e.id}`,
                data: e.data,
                titulo: e.titulo,
                tipo: e.tipo,
                turmaNome: e.turmaNome,
                horario: e.horario,
                cor: 'green'
              }))
            ];
            
            // Verificar se um dia tem eventos
            const getDiaEventos = (dia: number) => {
              const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
              return todosEventos.filter(e => e.data?.startsWith(dataStr));
            };
            
            // Próximos eventos (a partir de hoje)
            const proximosEventos = todosEventos
              .filter(e => e.data && e.data >= hojeStr)
              .sort((a, b) => a.data.localeCompare(b.data))
              .slice(0, 5);
            
            return (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Calendário Acadêmico</CardTitle>
                  <Button className="bg-purple-500 hover:bg-purple-600" onClick={() => setShowNovoEventoModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Evento
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Navegação do mês */}
                    <div className="flex items-center justify-between mb-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCalendarioMes(new Date(ano, mes - 1, 1))}
                      >
                        ← Anterior
                      </Button>
                      <h3 className="text-lg font-semibold">
                        {calendarioMes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
                      </h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCalendarioMes(new Date(ano, mes + 1, 1))}
                      >
                        Próximo →
                      </Button>
                    </div>
                    
                    {/* Grade do calendário */}
                    <div className="grid grid-cols-7 gap-1 text-center">
                      <div className="font-semibold p-2 text-gray-600">Dom</div>
                      <div className="font-semibold p-2 text-gray-600">Seg</div>
                      <div className="font-semibold p-2 text-gray-600">Ter</div>
                      <div className="font-semibold p-2 text-gray-600">Qua</div>
                      <div className="font-semibold p-2 text-gray-600">Qui</div>
                      <div className="font-semibold p-2 text-gray-600">Sex</div>
                      <div className="font-semibold p-2 text-gray-600">Sáb</div>
                      
                      {Array.from({ length: 42 }, (_, i) => {
                        const dia = i - primeiroDia + 1;
                        const dentroDoMes = dia > 0 && dia <= ultimoDia;
                        const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                        const isHoje = dentroDoMes && dataStr === hojeStr;
                        const eventosNoDia = dentroDoMes ? getDiaEventos(dia) : [];
                        const temPlano = eventosNoDia.some(e => e.cor === 'purple');
                        const temChamada = eventosNoDia.some(e => e.cor === 'yellow');
                        const temEvento = eventosNoDia.some(e => e.cor === 'green');
                        const aulasNoDia = dentroDoMes ? aulasNoMes.filter(a => a.data === dataStr) : [];
                        const temAula = aulasNoDia.length > 0;
                        
                        return (
                          <div 
                            key={i} 
                            className={`p-2 border rounded min-h-[60px] cursor-pointer transition-colors ${
                              isHoje ? 'bg-blue-100 border-blue-400' :
                              temAula && dentroDoMes ? 'bg-blue-50/50' :
                              dentroDoMes ? 'hover:bg-gray-50' : 'bg-gray-50 text-gray-300'
                            }`}
                            onClick={() => {
                              if (dentroDoMes) {
                                setDiaSelecionado(new Date(ano, mes, dia));
                              }
                            }}
                          >
                            {dentroDoMes && (
                              <div>
                                <span className={`text-sm ${isHoje ? 'font-bold text-blue-700' : ''}`}>{dia}</span>
                                <div className="flex gap-0.5 justify-center mt-1 flex-wrap">
                                  {aulasNoDia.map((aula, aIdx) => {
                                    const isHex = aula.cor?.startsWith('#');
                                    const colorMap: Record<string, string> = {
                                      'blue': 'bg-blue-500', 'indigo': 'bg-indigo-500', 'pink': 'bg-pink-500',
                                      'cyan': 'bg-cyan-500', 'orange': 'bg-orange-500', 'emerald': 'bg-emerald-500'
                                    };
                                    const IconComp = aula.icone ? MARCADOR_ICONE_MAP[aula.icone] : null;
                                    const colorStyle = isHex ? { color: aula.cor } : undefined;
                                    const colorClass = isHex ? '' : (colorMap[aula.cor] ? colorMap[aula.cor].replace('bg-', 'text-') : 'text-blue-500');
                                    return IconComp
                                      ? <IconComp key={`aula-${aIdx}`} className={`w-3 h-3 ${colorClass}`} style={colorStyle} title={`${aula.turmaNome}${aula.horario ? ` (${aula.horario})` : ''}`} />
                                      : <div key={`aula-${aIdx}`} className={`w-2 h-2 rounded-sm ${isHex ? '' : (colorMap[aula.cor] || 'bg-blue-500')}`} style={isHex ? { backgroundColor: aula.cor } : undefined} title={`${aula.turmaNome}${aula.horario ? ` (${aula.horario})` : ''}`}></div>;
                                  })}
                                  {temPlano && <div className="w-2 h-2 bg-purple-500 rounded-full" title="Plano de Aula"></div>}
                                  {temChamada && <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Chamada"></div>}
                                  {temEvento && <div className="w-2 h-2 bg-green-500 rounded-full" title="Evento"></div>}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Legenda */}
                    <div className="flex gap-4 text-sm text-gray-600 justify-center border-t pt-4 flex-wrap">
                      {minhasTurmas.filter((t: any) => {
                        const s = t.status || 'ativo';
                        return s !== 'inativo' && s !== 'cancelado';
                      }).map((turma: any, tIdx: number) => {
                        const colorBgMap: Record<string, string> = {
                          'blue': 'bg-blue-500', 'indigo': 'bg-indigo-500', 'pink': 'bg-pink-500',
                          'cyan': 'bg-cyan-500', 'orange': 'bg-orange-500', 'emerald': 'bg-emerald-500'
                        };
                        const cor = turma.marcadorCor || aulaColors[tIdx % aulaColors.length];
                        const isHexCor = cor?.startsWith('#');
                        return (
                          <div key={`legend-${tIdx}`} className="flex items-center gap-1">
                            <div className={`w-3 h-3 rounded-sm ${isHexCor ? '' : (colorBgMap[cor] || 'bg-blue-500')}`} style={isHexCor ? { backgroundColor: cor } : undefined}></div>
                            <span>{turma.nome || turma.title || 'Turma'}</span>
                          </div>
                        );
                      })}
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span>Plano de Aula</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span>Chamada</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Evento</span>
                      </div>
                    </div>
                    
                    {/* Próximos Eventos */}
                    <div>
                      <h3 className="font-semibold mb-4">Próximos Eventos</h3>
                      <div className="space-y-3">
                        {proximosEventos.length === 0 ? (
                          <p className="text-gray-500 text-center py-4">Nenhum evento próximo</p>
                        ) : (
                          proximosEventos.map((evento, index) => (
                            <div key={index} className="border rounded-lg p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Calendar className={`w-5 h-5 ${
                                  evento.cor === 'purple' ? 'text-purple-500' :
                                  evento.cor === 'yellow' ? 'text-yellow-500' : 'text-green-500'
                                }`} />
                                <div>
                                  <p className="font-medium">{evento.titulo}</p>
                                  <p className="text-sm text-gray-500">
                                    {formatDateBrazil(evento.data)} {evento.horario && `às ${evento.horario}`}
                                    {evento.turmaNome && ` - ${evento.turmaNome}`}
                                  </p>
                                </div>
                              </div>
                              <Badge 
                                variant="outline"
                                className={
                                  evento.cor === 'purple' ? 'border-purple-300 text-purple-700' :
                                  evento.cor === 'yellow' ? 'border-yellow-300 text-yellow-700' : 'border-green-300 text-green-700'
                                }
                              >
                                {evento.tipo}
                              </Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {activeSection === 'relatorios' && (
            <Card>
              <CardHeader>
                <CardTitle>Relatórios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        Relatório de Frequência
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        Gere relatórios de presença e faltas dos alunos por período.
                      </p>
                      <div className="space-y-2">
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a turma" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="turma-a">Turma A</SelectItem>
                            <SelectItem value="turma-b">Turma B</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Input type="date" placeholder="Data inicial" />
                          <Input type="date" placeholder="Data final" />
                        </div>
                        <Button className="w-full bg-blue-500 hover:bg-blue-600">
                          <Download className="w-4 h-4 mr-2" />
                          Gerar Relatório
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-green-500" />
                        Relatório de Desempenho
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        Análise do progresso acadêmico e participação dos alunos.
                      </p>
                      <div className="space-y-2">
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a turma" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="turma-a">Turma A</SelectItem>
                            <SelectItem value="turma-b">Turma B</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Período" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mensal">Mensal</SelectItem>
                            <SelectItem value="bimestral">Bimestral</SelectItem>
                            <SelectItem value="semestral">Semestral</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button className="w-full bg-green-500 hover:bg-green-600">
                          <Download className="w-4 h-4 mr-2" />
                          Gerar Relatório
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Relatórios Gerados Recentemente</h3>
                    <div className="space-y-2">
                      {[
                        { nome: 'Frequência - Turma A - Setembro 2025', data: '26/09/2025', tipo: 'PDF' },
                        { nome: 'Desempenho - Turma B - Agosto 2025', data: '25/08/2025', tipo: 'PDF' }
                      ].map((relatorio, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="font-medium">{relatorio.nome}</p>
                            <p className="text-sm text-gray-500">Gerado em {relatorio.data}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{relatorio.tipo}</Badge>
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'acompanhamento' && (
            <div className="space-y-6">
              {/* Formulário de novo acompanhamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    Novo Acompanhamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 1. Turma */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Turma <span className="text-red-500">*</span></label>
                      <Select value={acompTurmaId} onValueChange={(v) => { setAcompTurmaId(v); setAcompDiaAulaId(''); setAcompAlunoCpf(''); setAcompAlunoNome(''); }}>
                        <SelectTrigger><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
                        <SelectContent>
                          {minhasTurmas.map((t: any) => (
                            <SelectItem key={t.id} value={t.id.toString()}>{t.nome || t.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 2. Dia de Aula */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Dia de Aula <span className="text-red-500">*</span></label>
                      <Select
                        value={acompDiaAulaId}
                        onValueChange={(v) => { setAcompDiaAulaId(v); setAcompAlunoCpf(''); setAcompAlunoNome(''); }}
                        disabled={!acompTurmaId}
                      >
                        <SelectTrigger><SelectValue placeholder={acompTurmaId ? "Selecione o dia" : "Selecione a turma primeiro"} /></SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const dias = vertente === 'pec'
                              ? pecSessoesAcomp
                              : relatoriosAulas.filter((r: any) => r.turmaId?.toString() === acompTurmaId || r.turma_id?.toString() === acompTurmaId);
                            if (dias.length === 0 && acompTurmaId) return (
                              <div className="px-3 py-2 text-sm text-gray-500">Nenhuma aula registrada para esta turma</div>
                            );
                            return dias.map((r: any) => {
                              const dateStr = r.date || r.data;
                              return (
                                <SelectItem key={r.id} value={r.id.toString()}>
                                  {dateStr ? new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00')).toLocaleDateString('pt-BR') : r.id} — {r.title || r.titulo || 'Aula'}
                                </SelectItem>
                              );
                            });
                          })()}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 3. Aluno */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Aluno <span className="text-red-500">*</span></label>
                      <Select
                        value={acompAlunoCpf}
                        onValueChange={(v) => {
                          setAcompAlunoCpf(v);
                          const aluno = acompAlunosDaTurma.find((a: any) => (a.cpf || a.aluno_cpf) === v);
                          setAcompAlunoNome(aluno?.nome || aluno?.nomeCompleto || aluno?.nome_completo || '');
                        }}
                        disabled={!acompDiaAulaId}
                      >
                        <SelectTrigger><SelectValue placeholder={acompDiaAulaId ? "Selecione o aluno" : "Selecione o dia primeiro"} /></SelectTrigger>
                        <SelectContent>
                          {acompAlunosDaTurma.map((a: any) => (
                            <SelectItem key={a.cpf || a.aluno_cpf || a.id} value={a.cpf || a.aluno_cpf || ''}>
                              {a.nome || a.nomeCompleto || a.nome_completo}
                            </SelectItem>
                          ))}
                          {acompAlunosDaTurma.length === 0 && acompDiaAulaId && (
                            <div className="px-3 py-2 text-sm text-gray-500">Nenhum aluno nesta turma</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 4. Tipo */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Tipo de Observação</label>
                      <Select value={acompTipo} onValueChange={setAcompTipo}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="comportamental">Comportamental</SelectItem>
                          <SelectItem value="academico">Acadêmico</SelectItem>
                          <SelectItem value="social">Social</SelectItem>
                          <SelectItem value="familiar">Familiar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 5. Observação */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Observação <span className="text-red-500">*</span></label>
                      <Textarea
                        placeholder="Descreva a observação de acompanhamento do aluno nesta aula..."
                        rows={4}
                        value={acompObservacao}
                        onChange={(e) => setAcompObservacao(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button
                    className="mt-4 bg-blue-500 hover:bg-blue-600"
                    onClick={handleSalvarAcompanhamento}
                    disabled={salvandoAcomp}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    {salvandoAcomp ? 'Salvando...' : 'Salvar Acompanhamento'}
                  </Button>
                </CardContent>
              </Card>

              {/* Histórico de acompanhamentos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-500" />
                    Histórico de Acompanhamentos ({listaAcompanhamentos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {listaAcompanhamentos.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Nenhum acompanhamento registrado ainda.</p>
                  ) : (
                    <div className="space-y-3">
                      {listaAcompanhamentos.slice(0, 20).map((ac: any) => (
                        <div key={ac.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{ac.titulo || 'Acompanhamento'}</span>
                            <Badge variant="outline" className="text-xs capitalize">{ac.tipoObservacao || ac.tipo_observacao || 'geral'}</Badge>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">{ac.data ? new Date(ac.data + 'T12:00:00').toLocaleDateString('pt-BR') : ''}</p>
                          <p className="text-sm text-gray-700">{ac.observacoes}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'configuracoes' && (
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <PushNotificationSettings variant="panel" />
                  <LgpdMeusDadosSettingsPanel />
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Informações Pessoais
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Nome Completo</label>
                        <Input defaultValue={`${userProfileData?.nome || userName} ${userProfileData?.sobrenome || ''}`.trim()} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <Input defaultValue={userProfileData?.email || ''} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Telefone</label>
                        <Input defaultValue={userProfileData?.telefone || ''} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Especialização</label>
                        <Input defaultValue={vertente === 'inclusao' ? 'Inclusão Produtiva' : 'PEC'} readOnly />
                      </div>
                    </div>
                    <Button className="mt-4 bg-blue-500 hover:bg-blue-600">
                      Salvar Alterações
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Preferências do Sistema
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Notificações por Email</p>
                          <p className="text-sm text-gray-500">Receber emails sobre atividades importantes</p>
                        </div>
                        <Checkbox defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Notificações de Frequência</p>
                          <p className="text-sm text-gray-500">Alertas sobre faltas dos alunos</p>
                        </div>
                        <Checkbox defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Lembretes de Aula</p>
                          <p className="text-sm text-gray-500">Lembrar sobre aulas programadas</p>
                        </div>
                        <Checkbox />
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4 text-red-600">Zona de Perigo</h3>
                    <div className="space-y-3">
                      <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                        Alterar Senha
                      </Button>
                      <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                        Desativar Conta Temporariamente
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>


      {/* Modal de Visualizar Participante - Inclusão */}
      <Dialog open={showViewParticipanteModal && !!selectedParticipante} onOpenChange={() => {
        setShowViewParticipanteModal(false);
        setSelectedParticipante(null);
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-green-500" />
              Detalhes do Participante
            </DialogTitle>
          </DialogHeader>
          {selectedParticipante && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Matrícula</p>
                  <p className="font-bold text-green-600">{selectedParticipante.matricula || '-'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge className={selectedParticipante.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {selectedParticipante.status || 'ativo'}
                  </Badge>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">Dados Pessoais</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Nome:</span> <span className="font-medium">{selectedParticipante.nomeCompleto}</span></div>
                  <div><span className="text-gray-500">CPF:</span> <span className="font-medium">{selectedParticipante.cpf}</span></div>
                  <div><span className="text-gray-500">Data Nascimento:</span> <span className="font-medium">{selectedParticipante.dataNascimento ? formatDateBrazil(selectedParticipante.dataNascimento) : '-'}</span></div>
                  <div><span className="text-gray-500">Telefone:</span> <span className="font-medium">{selectedParticipante.telefone || '-'}</span></div>
                  <div><span className="text-gray-500">Email:</span> <span className="font-medium">{selectedParticipante.email || '-'}</span></div>
                </div>
              </div>
              
              {selectedParticipante.endereco && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Endereço</h4>
                  <p className="text-sm">{selectedParticipante.endereco}, {selectedParticipante.bairro} - {selectedParticipante.cidade}/{selectedParticipante.uf}</p>
                  <p className="text-sm text-gray-500">CEP: {selectedParticipante.cep}</p>
                </div>
              )}
              
              {selectedParticipante.observacoesPrivadas && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Observações</h4>
                  <p className="text-sm text-gray-600">{selectedParticipante.observacoesPrivadas}</p>
                </div>
              )}
              
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Novo Plano de Aula */}
      <Dialog open={showNovoPlanoModal} onOpenChange={setShowNovoPlanoModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Plano de Aula</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Turma *</Label>
                <Select value={planoForm.turmaId} onValueChange={(v) => { setPlanoForm({...planoForm, turmaId: v, data: ''}); setPlanoTurmaIdParaFiltro(v); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
                  <SelectContent>
                    <div className="px-2 pb-1 pt-1 sticky top-0 bg-white z-10" onKeyDown={e => e.stopPropagation()}>
                      <input
                        className="w-full rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-blue-400"
                        placeholder="Pesquisar turma..."
                        value={planoTurmaBusca}
                        onChange={e => setPlanoTurmaBusca(e.target.value)}
                        onKeyDown={e => e.stopPropagation()}
                      />
                    </div>
                    {(minhasTurmas || [])
                      .slice()
                      .sort((a: any, b: any) =>
                        String(a?.nome || a?.title || '').localeCompare(
                          String(b?.nome || b?.title || ''),
                          'pt-BR',
                          { sensitivity: 'base' }
                        )
                      )
                      .filter((turma: any) =>
                        !planoTurmaBusca ||
                        String(turma?.nome || turma?.title || '')
                          .toLowerCase()
                          .includes(planoTurmaBusca.toLowerCase())
                      )
                      .map((turma: any) => (
                      <SelectItem key={turma.id} value={turma.id.toString()}>{(turma.nome || turma.title)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data *</Label>
                {(() => {
                  const turmaSel = minhasTurmas.find((t: any) => t.id.toString() === planoForm.turmaId);
                  const diasAula = turmaSel ? getDiasAulaParaTurma(turmaSel) : [];
                  const diasDisponiveis = diasAula.filter((d) => !datasComPlano.includes(d.date));
                  return diasDisponiveis.length > 0 ? (
                    <Select value={planoForm.data} onValueChange={(v) => setPlanoForm({...planoForm, data: v})}>
                      <SelectTrigger><SelectValue placeholder="Selecione o dia" /></SelectTrigger>
                      <SelectContent>
                        {diasDisponiveis.map((dia) => (
                          <SelectItem key={dia.date} value={dia.date}>{dia.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !planoForm.turmaId ? "Selecione a turma primeiro" :
                          diasAula.length === 0 ? "Nenhum dia cadastrado" :
                          "Todos os dias já têm plano cadastrado"
                        } />
                      </SelectTrigger>
                    </Select>
                  );
                })()}
              </div>
            </div>
            <div>
              <Label>Título *</Label>
              <Input value={planoForm.titulo} onChange={(e) => setPlanoForm({...planoForm, titulo: e.target.value})} placeholder="Ex: Introdução à Matemática" />
            </div>
            <div>
              <Label>Objetivos *</Label>
              <Textarea value={planoForm.objetivos} onChange={(e) => setPlanoForm({...planoForm, objetivos: e.target.value})} placeholder="Quais são os objetivos da aula?" rows={3} />
            </div>
            <div>
              <Label>Conteúdo *</Label>
              <Textarea value={planoForm.conteudo} onChange={(e) => setPlanoForm({...planoForm, conteudo: e.target.value})} placeholder="Conteúdo a ser abordado" rows={3} />
            </div>
            <div>
              <Label>Recursos</Label>
              <Input value={planoForm.recursos} onChange={(e) => setPlanoForm({...planoForm, recursos: e.target.value})} placeholder="Materiais necessários" />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowNovoPlanoModal(false)}>Cancelar</Button>
              <Button onClick={handleSavePlano} disabled={criarPlanoMutation.isPending}>
                {criarPlanoMutation.isPending ? 'Salvando...' : 'Salvar Plano'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Editar Plano de Aula */}
      <Dialog open={showEditPlanoModal} onOpenChange={setShowEditPlanoModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Plano de Aula</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Turma *</Label>
                <Select value={planoForm.turmaId} onValueChange={(v) => setPlanoForm({...planoForm, turmaId: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
                  <SelectContent>
                    {minhasTurmas.map((turma: any) => (
                      <SelectItem key={turma.id} value={turma.id.toString()}>{(turma.nome || turma.title)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data *</Label>
                {(() => {
                  const turmaSel = minhasTurmas.find((t: any) => t.id.toString() === planoForm.turmaId);
                  const diasAula = turmaSel ? getDiasAulaParaTurma(turmaSel) : [];
                  return diasAula.length > 0 ? (
                    <Select value={planoForm.data} onValueChange={(v) => setPlanoForm({...planoForm, data: v})}>
                      <SelectTrigger><SelectValue placeholder="Selecione o dia" /></SelectTrigger>
                      <SelectContent>
                        {diasAula.map((dia) => (
                          <SelectItem key={dia.date} value={dia.date}>{dia.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select disabled>
                      <SelectTrigger><SelectValue placeholder={planoForm.turmaId ? "Nenhum dia cadastrado" : "Selecione a turma primeiro"} /></SelectTrigger>
                    </Select>
                  );
                })()}
              </div>
            </div>
            <div>
              <Label>Título *</Label>
              <Input value={planoForm.titulo} onChange={(e) => setPlanoForm({...planoForm, titulo: e.target.value})} />
            </div>
            <div>
              <Label>Objetivos *</Label>
              <Textarea value={planoForm.objetivos} onChange={(e) => setPlanoForm({...planoForm, objetivos: e.target.value})} rows={3} />
            </div>
            <div>
              <Label>Conteúdo *</Label>
              <Textarea value={planoForm.conteudo} onChange={(e) => setPlanoForm({...planoForm, conteudo: e.target.value})} rows={3} />
            </div>
            <div>
              <Label>Metodologia *</Label>
              <Textarea value={planoForm.metodologia} onChange={(e) => setPlanoForm({...planoForm, metodologia: e.target.value})} rows={3} />
            </div>
            <div>
              <Label>Recursos</Label>
              <Input value={planoForm.recursos} onChange={(e) => setPlanoForm({...planoForm, recursos: e.target.value})} />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditPlanoModal(false)}>Cancelar</Button>
              <Button onClick={handleUpdatePlano} disabled={atualizarPlanoMutation.isPending}>
                {atualizarPlanoMutation.isPending ? 'Salvando...' : 'Atualizar Plano'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualizar Plano de Aula */}
      <Dialog open={showViewPlanoModal} onOpenChange={setShowViewPlanoModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPlano?.titulo || 'Plano de Aula'}</DialogTitle>
          </DialogHeader>
          {selectedPlano && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Turma</Label>
                  <p className="font-medium">{selectedPlano.turmaNome || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Data</Label>
                  <p className="font-medium">{formatDateBrazil(selectedPlano.data)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {isPlanoStatusExibivel(selectedPlano.status) && (
                  <div>
                    <Label className="text-gray-500">Status</Label>
                    <Badge variant={selectedPlano.status === 'aplicado' ? 'secondary' : 'default'}>
                      {labelPlanoStatusExibivel(selectedPlano.status)}
                    </Badge>
                  </div>
                )}
                {selectedPlano.duracaoMinutos && (
                  <div>
                    <Label className="text-gray-500">Duração</Label>
                    <p className="font-medium">{selectedPlano.duracaoMinutos} minutos</p>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-gray-500">Objetivos</Label>
                <p className="whitespace-pre-wrap">{selectedPlano.objetivos}</p>
              </div>
              <div>
                <Label className="text-gray-500">Conteúdo</Label>
                <p className="whitespace-pre-wrap">{selectedPlano.conteudo}</p>
              </div>
              <div>
                <Label className="text-gray-500">Metodologia</Label>
                <p className="whitespace-pre-wrap">{selectedPlano.metodologia}</p>
              </div>
              {selectedPlano.recursos && (
                <div>
                  <Label className="text-gray-500">Recursos</Label>
                  <p>{selectedPlano.recursos}</p>
                </div>
              )}
              {selectedPlano.avaliacao && (
                <div>
                  <Label className="text-gray-500">Avaliação</Label>
                  <p className="whitespace-pre-wrap">{selectedPlano.avaliacao}</p>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowViewPlanoModal(false)}>Fechar</Button>
                {selectedPlano?.professorId === parseInt(userId) && (
                  <Button onClick={() => {
                    setShowViewPlanoModal(false);
                    handleEditPlano(selectedPlano);
                  }}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Modal Novo Relatório de Aula */}
      <Dialog open={showNovoRelatorioModal} onOpenChange={(open) => { if (!open) setShowNovoRelatorioModal(false); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Relatório de Aula</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-sm font-medium mb-2">Turma *</label>
              <Select
                value={registroAulaForm.turmaId}
                onValueChange={(v) => {
                  setRegistroAulaForm({...registroAulaForm, turmaId: v, planoId: '', chamadaId: '', data: ''});
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {minhasTurmas.map((turma: any) => (
                    <SelectItem key={turma.id} value={turma.id.toString()}>
                      {(turma.nome || turma.title)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Data da Aula *</label>
              {(() => {
                const turmaSel = minhasTurmas.find((t: any) => t.id.toString() === registroAulaForm.turmaId);
                const diasAula = turmaSel ? getDiasAulaParaTurma(turmaSel) : [];
                const diasDisponiveis = diasAula.filter(
                  (d) => !turmaJaTemRelatorioNaData(relatoriosAulas as any[], registroAulaForm.turmaId, d.date)
                );
                return diasDisponiveis.length > 0 ? (
                  <Select value={registroAulaForm.data} onValueChange={(v) => {
                    const planoDoDia = meusPlanos.find((p: any) =>
                      p.data === v && p.turmaId?.toString() === registroAulaForm.turmaId
                    );
                    const chamadaDoDia = historicoChamadas.find((c: any) => {
                      const turmaIdFromGrupo = c.grupo?.match(/turma_(\d+)/)?.[1];
                      const dataStr = c.dataAtividade || c.data || '';
                      return turmaIdFromGrupo === registroAulaForm.turmaId && dataStr.startsWith(v);
                    });
                    setRegistroAulaForm(prev => ({
                      ...prev,
                      data: v,
                      planoId: planoDoDia?.id?.toString() || '',
                      chamadaId: chamadaDoDia?.id?.toString() || ''
                    }));
                  }}>
                    <SelectTrigger><SelectValue placeholder="Selecione o dia" /></SelectTrigger>
                    <SelectContent>
                      {diasDisponiveis.map((dia) => (
                        <SelectItem key={dia.date} value={dia.date}>{dia.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !registroAulaForm.turmaId ? "Selecione a turma primeiro" :
                        diasAula.length === 0 ? "Nenhum dia cadastrado" :
                        "Todos os dias já têm relatório cadastrado"
                      } />
                    </SelectTrigger>
                  </Select>
                );
              })()}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Plano de Aula <span className="text-red-500">*</span></label>
              <Select
                value={registroAulaForm.planoId}
                onValueChange={(v) => setRegistroAulaForm(prev => ({ ...prev, planoId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano de aula" />
                </SelectTrigger>
                <SelectContent>
                  {meusPlanos
                    .filter((p: any) => !registroAulaForm.turmaId || p.turmaId?.toString() === registroAulaForm.turmaId)
                    .map((plano: any) => (
                      <SelectItem key={plano.id} value={plano.id.toString()}>
                        {plano.titulo} - {formatDateBrazil(plano.data)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Chamada realizada (opcional)</label>
              <Select
                value={registroAulaForm.chamadaId}
                onValueChange={(v) => setRegistroAulaForm({...registroAulaForm, chamadaId: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a chamada (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {historicoChamadas
                    .filter((c: any) => {
                      const turmaIdFromGrupo = c.grupo?.match(/turma_(\d+)/)?.[1];
                      const matchTurma = !registroAulaForm.turmaId || turmaIdFromGrupo === registroAulaForm.turmaId;
                      const dataStr = c.dataAtividade || c.data || '';
                      const matchData = !filtroChamadaData || dataStr.startsWith(filtroChamadaData);
                      return matchTurma && matchData;
                    })
                    .map((chamada: any) => {
                      const presentes = chamada.totalPresentes ?? 0;
                      const total = chamada.totalAlunos ?? presentes;
                      const dataExibir = chamada.dataAtividade || chamada.data;
                      return (
                        <SelectItem key={chamada.id} value={chamada.id.toString()}>
                          {formatDateBrazil(dataExibir)} - {chamada.turmaNome || 'Turma'} ({presentes}/{total} presentes)
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>
            {(() => {
              const planoAtual = meusPlanos.find((p: any) => p.id.toString() === registroAulaForm.planoId);
              if (!planoAtual) return null;
              return (
                <>
                  {planoAtual.objetivos && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2 text-slate-500">Objetivos do Plano de Aula</label>
                      <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 whitespace-pre-wrap min-h-[60px]">
                        {planoAtual.objetivos}
                      </div>
                    </div>
                  )}
                  {planoAtual.conteudo && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2 text-slate-500">Conteúdo do Plano de Aula</label>
                      <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 whitespace-pre-wrap min-h-[60px]">
                        {planoAtual.conteudo}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Relatório de aula *</label>
              <Textarea
                placeholder="Descreva como a aula foi conduzida, o que funcionou, dificuldades encontradas, participação dos alunos..."
                rows={4}
                value={registroAulaForm.conteudo}
                onChange={(e) => setRegistroAulaForm({...registroAulaForm, conteudo: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Observações</label>
              <Textarea
                placeholder="Observações sobre a aula, participação dos alunos, etc."
                rows={2}
                value={registroAulaForm.observacoes}
                onChange={(e) => setRegistroAulaForm({...registroAulaForm, observacoes: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Foto da Aula <span className="text-red-500">*</span>
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${fotoRegistroAula ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400'}`}
                onClick={() => fotoRegistroAulaRef.current?.click()}
              >
                {fotoRegistroAula ? (
                  <div className="flex items-center justify-center gap-3">
                    <img src={URL.createObjectURL(fotoRegistroAula)} alt="Preview" className="w-16 h-16 rounded object-cover border" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-green-700">{fotoRegistroAula.name}</p>
                      <button type="button" className="text-xs text-red-500 mt-1 hover:underline"
                        onClick={(e) => { e.stopPropagation(); setFotoRegistroAula(null); }}>
                        Remover foto
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Clique para anexar uma foto da aula</p>
                    <p className="text-xs mt-1">JPG, PNG ou WEBP</p>
                  </div>
                )}
              </div>
              <input
                ref={fotoRegistroAulaRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setFotoRegistroAula(file);
                  if (fotoRegistroAulaRef.current) fotoRegistroAulaRef.current.value = '';
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowNovoRelatorioModal(false)}>Cancelar</Button>
            <Button
              className="bg-blue-500 hover:bg-blue-600"
              onClick={handleSalvarRegistroAula}
              disabled={!registroAulaForm.turmaId}
            >
              <FileText className="w-4 h-4 mr-2" />
              Salvar Registro
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualizar Relatório de Aula */}
      <Dialog open={!!relatorioSelecionado} onOpenChange={(open) => { if (!open) setRelatorioSelecionado(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{relatorioSelecionado?.titulo || 'Relatório de Aula'}</DialogTitle>
          </DialogHeader>
          {relatorioSelecionado && (() => {
            const turmaNome = minhasTurmas.find((t: any) => t.id === relatorioSelecionado.turmaId)?.nome || '';
            const isOwnReport = relatorioSelecionado.professorId === parseInt(userId || '0');
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Data</p>
                    <p className="font-medium">{formatDateBrazil(relatorioSelecionado.data)}</p>
                  </div>
                  {turmaNome && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Turma</p>
                      <p className="font-medium">{turmaNome}</p>
                    </div>
                  )}
                  {relatorioSelecionado.professorNome && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 mb-1">Professor(a)</p>
                      <p className="font-medium text-sm">{relatorioSelecionado.professorNome}{isOwnReport ? ' (você)' : ''}</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Relatório de aula</p>
                  <div className="border rounded-lg p-3 bg-gray-50 text-sm whitespace-pre-wrap">{relatorioSelecionado.conteudoMinistrado}</div>
                </div>
                {relatorioSelecionado.observacoes && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Observações</p>
                    <div className="border rounded-lg p-3 bg-gray-50 text-sm whitespace-pre-wrap">{relatorioSelecionado.observacoes}</div>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <Badge className="bg-green-100 text-green-800">{relatorioSelecionado.statusAula || 'ministrada'}</Badge>
                  {isOwnReport && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={async () => {
                        if (!confirm('Tem certeza que deseja excluir este relatório?')) return;
                        try {
                          const res = await fetch(`/api/professor/registered-lessons/${relatorioSelecionado.id}`, { method: 'DELETE' });
                          if (!res.ok) throw new Error('Erro ao excluir');
                          setRelatorioSelecionado(null);
                          refetchRelatorios();
                          toast({ title: 'Relatório excluído com sucesso' });
                        } catch (e: any) {
                          toast({ title: 'Erro ao excluir', description: e.message, variant: 'destructive' });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />Excluir
                    </Button>
                  )}
                </div>
                {!isOwnReport && (
                  <p className="text-xs text-gray-400 text-center pb-1">Relatório de outro professor — somente leitura</p>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Modal Novo Evento do Calendário */}
      <Dialog open={showNovoEventoModal} onOpenChange={setShowNovoEventoModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título do Evento</Label>
              <Input 
                value={novoEvento.titulo}
                onChange={(e) => setNovoEvento({...novoEvento, titulo: e.target.value})}
                placeholder="Ex: Prova de Matemática"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data</Label>
                <Input 
                  type="date"
                  value={novoEvento.data}
                  onChange={(e) => setNovoEvento({...novoEvento, data: e.target.value})}
                />
              </div>
              <div>
                <Label>Horário</Label>
                <Input 
                  type="time"
                  value={novoEvento.horario}
                  onChange={(e) => setNovoEvento({...novoEvento, horario: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>Tipo de Evento</Label>
              <Select 
                value={novoEvento.tipo}
                onValueChange={(v) => setNovoEvento({...novoEvento, tipo: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aula">Aula</SelectItem>
                  <SelectItem value="Prova">Prova</SelectItem>
                  <SelectItem value="Avaliação">Avaliação</SelectItem>
                  <SelectItem value="Reunião">Reunião</SelectItem>
                  <SelectItem value="Feriado">Feriado</SelectItem>
                  <SelectItem value="Administrativo">Administrativo</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Turma (opcional)</Label>
              <Select 
                value={novoEvento.turmaId}
                onValueChange={(v) => setNovoEvento({...novoEvento, turmaId: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma turma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {minhasTurmas.map((turma: any) => (
                    <SelectItem key={turma.id} value={turma.id.toString()}>{(turma.nome || turma.title)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea 
                value={novoEvento.descricao}
                onChange={(e) => setNovoEvento({...novoEvento, descricao: e.target.value})}
                placeholder="Detalhes do evento..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNovoEventoModal(false)}>
                Cancelar
              </Button>
              <Button 
                className="bg-purple-500 hover:bg-purple-600"
                onClick={() => {
                  if (!novoEvento.titulo) {
                    toast({ title: "Erro", description: "Informe o título do evento", variant: "destructive" });
                    return;
                  }
                  const turmaIdReal = novoEvento.turmaId === 'none' ? '' : novoEvento.turmaId;
                  const turma = minhasTurmas.find((t: any) => t.id.toString() === turmaIdReal);
                  const novoEventoCompleto = {
                    id: Date.now(),
                    titulo: novoEvento.titulo,
                    data: novoEvento.data,
                    horario: novoEvento.horario,
                    tipo: novoEvento.tipo,
                    turmaId: turmaIdReal,
                    turmaNome: turma?.nome,
                    descricao: novoEvento.descricao
                  };
                  setEventosProfessor(prev => [...prev, novoEventoCompleto]);
                  setNovoEvento({
                    titulo: '',
                    data: getBrazilDateString(),
                    horario: '08:00',
                    tipo: 'Aula',
                    turmaId: '',
                    descricao: ''
                  });
                  setShowNovoEventoModal(false);
                  toast({ title: "Evento criado", description: "O evento foi adicionado ao calendário." });
                }}
              >
                Criar Evento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal Detalhes do Dia */}
      <Dialog open={!!diaSelecionado} onOpenChange={() => setDiaSelecionado(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {diaSelecionado && formatDateBrazil(diaSelecionado.toISOString().split('T')[0])}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {diaSelecionado && (() => {
              const dataStr = diaSelecionado.toISOString().split('T')[0];

              const diasSemanaMapDialog: Record<string, number> = {
                'domingo': 0, 'segunda': 1, 'terca': 2, 'terça': 2, 'quarta': 3,
                'quinta': 4, 'sexta': 5, 'sabado': 6, 'sábado': 6,
                'seg': 1, 'ter': 2, 'qua': 3, 'qui': 4, 'sex': 5, 'sab': 6, 'dom': 0
              };
              const dayOfWeek = diaSelecionado.getDay();
              const aulasHoje = minhasTurmas.filter((turma: any) => {
                const dias = turma.diasSemana || turma.dias_semana || turma.diasAula || [];
                if (!Array.isArray(dias) || dias.length === 0) return false;
                const s = turma.status || 'ativo';
                if (s === 'inativo' || s === 'cancelado') return false;
                return dias.some((dia: string) => {
                  const diaLower = dia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  return diasSemanaMapDialog[diaLower] === dayOfWeek;
                });
              });

              const eventosDoDia = [
                ...aulasHoje.map((turma: any) => ({
                  titulo: turma.nome || turma.title || 'Aula',
                  tipo: 'Aula Programada',
                  cor: 'blue',
                  horario: turma.horarioEntrada && turma.horarioSaida 
                    ? `${turma.horarioEntrada} - ${turma.horarioSaida}` 
                    : turma.horarioInicio && turma.horarioFim 
                      ? `${turma.horarioInicio} - ${turma.horarioFim}`
                      : turma.horario || '',
                  turmaNome: turma.nome || turma.title
                })),
                ...meusPlanos.filter((p: any) => p.data?.startsWith(dataStr)).map((p: any) => ({
                  titulo: p.titulo,
                  tipo: 'Plano de Aula',
                  cor: 'purple',
                  turmaNome: p.turmaNome
                })),
                ...historicoChamadas.filter((c: any) => c.dataAtividade?.startsWith(dataStr)).map((c: any) => ({
                  titulo: c.titulo || 'Chamada',
                  tipo: 'Chamada',
                  cor: 'yellow',
                  turmaNome: c.turmaNome
                })),
                ...eventosProfessor.filter((e) => e.data === dataStr).map((e) => ({
                  titulo: e.titulo,
                  tipo: e.tipo,
                  cor: 'green',
                  horario: e.horario,
                  turmaNome: e.turmaNome
                }))
              ];
              
              return eventosDoDia.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum evento neste dia</p>
              ) : (
                eventosDoDia.map((evento, index) => (
                  <div key={index} className="border rounded-lg p-3 flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      evento.cor === 'blue' ? 'bg-blue-500' :
                      evento.cor === 'purple' ? 'bg-purple-500' :
                      evento.cor === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="font-medium">{evento.titulo}</p>
                      <p className="text-sm text-gray-500">
                        {evento.tipo}
                        {evento.horario && ` às ${evento.horario}`}
                        {evento.turmaNome && ` - ${evento.turmaNome}`}
                      </p>
                    </div>
                  </div>
                ))
              );
            })()}
            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={() => {
                if (diaSelecionado) {
                  setNovoEvento({...novoEvento, data: diaSelecionado.toISOString().split('T')[0]});
                  setDiaSelecionado(null);
                  setShowNovoEventoModal(true);
                }
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar evento neste dia
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Detalhes da Turma */}
      <Dialog open={showDetalhesTurmaModal} onOpenChange={setShowDetalhesTurmaModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Turma</DialogTitle>
          </DialogHeader>
          {selectedTurma && (
            <div className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{selectedTurma.nome || selectedTurma.title}</h3>
                  <Badge variant={selectedTurma.status === 'ativo' || selectedTurma.status === 'emandamento' ? 'default' : 'secondary'}>
                    {selectedTurma.status === 'emandamento' ? 'Em andamento' : 
                     selectedTurma.status === 'ativo' ? 'Ativa' : 
                     selectedTurma.status === 'concluido' ? 'Concluída' : 
                     selectedTurma.status === 'planejado' ? 'Planejada' : selectedTurma.status}
                  </Badge>
                </div>
                {selectedTurma.descricao && (
                  <p className="text-sm text-gray-600">{selectedTurma.descricao}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Código</p>
                  <p className="font-semibold">{selectedTurma.codigo || 'Não definido'}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Local</p>
                  <p className="font-semibold">{selectedTurma.local || 'Não definido'}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Datas e Horários</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Data Início</p>
                    <p className="font-semibold">
                      {selectedTurma.dataInicio || selectedTurma.data_inicio
                        ? formatDateBrazil(selectedTurma.dataInicio || selectedTurma.data_inicio)
                        : 'Não definida'}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Data Fim</p>
                    <p className="font-semibold">
                      {selectedTurma.dataFim || selectedTurma.data_fim
                        ? formatDateBrazil(selectedTurma.dataFim || selectedTurma.data_fim)
                        : 'Não definida'}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Horário</p>
                    <p className="font-semibold">
                      {selectedTurma.horario || 
                       ((selectedTurma.horarioInicio || selectedTurma.horarioEntrada || selectedTurma.start_time) && (selectedTurma.horarioFim || selectedTurma.horarioSaida || selectedTurma.end_time)
                         ? `${selectedTurma.horarioInicio || selectedTurma.horarioEntrada || selectedTurma.start_time} - ${selectedTurma.horarioFim || selectedTurma.horarioSaida || selectedTurma.end_time}` 
                         : 'Não definido')}
                    </p>
                  </div>
                </div>
                {(selectedTurma.diasSemana && selectedTurma.diasSemana.length > 0) && (
                  <div className="p-4 bg-blue-50 rounded-lg mt-4">
                    <p className="text-sm text-gray-600 mb-2">Dias da Semana</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTurma.diasSemana.map((dia: string) => (
                        <span key={dia} className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium">
                          {dia === 'segunda' ? 'Segunda' : 
                           dia === 'terca' ? 'Terça' : 
                           dia === 'quarta' ? 'Quarta' : 
                           dia === 'quinta' ? 'Quinta' : 
                           dia === 'sexta' ? 'Sexta' : 
                           dia === 'sabado' ? 'Sábado' : 
                           dia === 'domingo' ? 'Domingo' : dia}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetalhesTurmaModal(false);
                    setShowEditTurmaModal(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Turma
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDetalhesTurmaModal(false)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Finalizar Turma */}
      <Dialog open={showFinalizarTurmaModal} onOpenChange={setShowFinalizarTurmaModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-green-600" />
              Finalizar Turma: {selectedTurma?.nome || selectedTurma?.title}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mb-4">Selecione os participantes que concluíram o curso com certificado.</p>
          <div className="space-y-4">
            {isLoadingParticipantesTurma ? (
              <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
            ) : participantesTurmaAtual.length === 0 ? (
              <div className="text-center py-8 text-gray-500"><Users className="w-12 h-12 mx-auto mb-2 text-gray-300" /><p>Nenhum participante ativo nesta turma.</p></div>
            ) : (
              <>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Pesquisar participante..." value={buscaParticipante} onChange={(e) => setBuscaParticipante(e.target.value)} className="pl-10" />
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600">{participantesSelecionados.length} de {participantesTurmaAtual.length} selecionados</span>
                  <Button variant="outline" size="sm" onClick={() => { setParticipantesSelecionados(participantesSelecionados.length === participantesTurmaAtual.length ? [] : participantesTurmaAtual.map((p: any) => p.id)); }}>
                    {participantesSelecionados.length === participantesTurmaAtual.length ? "Desmarcar Todos" : "Selecionar Todos"}
                  </Button>
                </div>
                <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                  {participantesTurmaAtual.filter((p: any) => p.nome?.toLowerCase().includes(buscaParticipante.toLowerCase()) || (p.cpf || '').includes(buscaParticipante)).map((participante: any) => (
                    <label key={participante.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={participantesSelecionados.includes(participante.id)} onChange={(e) => { setParticipantesSelecionados(e.target.checked ? [...participantesSelecionados, participante.id] : participantesSelecionados.filter(id => id !== participante.id)); }} className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                      <div className="flex-1"><p className="font-medium">{participante.nome}</p>{participante.cpf && <p className="text-sm text-gray-500">CPF: {participante.cpf}</p>}</div>
                      {participantesSelecionados.includes(participante.id) && <CheckCircle className="w-5 h-5 text-green-600" />}
                    </label>
                  ))}
                </div>
              </>
            )}
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => { setShowFinalizarTurmaModal(false); setParticipantesSelecionados([]); setParticipantesTurmaAtual([]); setBuscaParticipante(""); }} disabled={isFinalizando}>Cancelar</Button>
              <Button className="bg-green-600 hover:bg-green-700 flex-1" disabled={isFinalizando || participantesTurmaAtual.length === 0} onClick={async () => {
                if (!selectedTurma) return;
                setIsFinalizando(true);
                try {
                  const response = await fetch(`/api/turmas-inclusao/${selectedTurma.id}/finalizar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ participantesConcluidosIds: participantesSelecionados }) });
                  if (response.ok) {
                    const result = await response.json();
                    toast({ title: "Turma finalizada!", description: `${result.alunosConcluidos} aluno(s) formado(s) com certificado.` });
                    queryClient.invalidateQueries({ queryKey: ["/api/professor/turmas"] });
                    setShowFinalizarTurmaModal(false); setParticipantesSelecionados([]); setParticipantesTurmaAtual([]); setBuscaParticipante("");
                  } else {
                    const error = await response.json();
                    toast({ title: "Erro", description: error.error || "Erro ao finalizar turma", variant: "destructive" });
                  }
                } catch (error) { toast({ title: "Erro", description: "Erro de conexão ao finalizar turma", variant: "destructive" }); }
                finally { setIsFinalizando(false); }
              }}>
                {isFinalizando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Finalizando...</> : <><GraduationCap className="w-4 h-4 mr-2" /> Finalizar Turma ({participantesSelecionados.length} concluídos)</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Dialog justificativa Chamada Manual */}
      <Dialog open={showModoManualDialog} onOpenChange={setShowModoManualDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>✋</span> Chamada Manual
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
              A chamada manual substitui o registro automático da catraca. O motivo ficará registrado para auditoria do coordenador.
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Motivo <span className="text-red-500">*</span></label>
              <Select value={motivoManualSelect} onValueChange={setMotivoManualSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Catraca desativada">Catraca desativada</SelectItem>
                  <SelectItem value="Aluno e/ou turma não cadastrada na catraca">Aluno e/ou turma não cadastrada na catraca</SelectItem>
                  <SelectItem value="Falta de luz no instituto">Falta de luz no instituto</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Descreva brevemente o ocorrido <span className="text-red-500">*</span></label>
              <Textarea
                placeholder="Descreva brevemente o ocorrido..."
                value={descManual}
                onChange={(e) => setDescManual(e.target.value)}
                className="h-20 resize-none"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowModoManualDialog(false)} disabled={savingMotivoManual}>
              Cancelar
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600"
              disabled={!motivoManualSelect || !descManual.trim() || savingMotivoManual}
              onClick={async () => {
                setSavingMotivoManual(true);
                const motivoFinal = descManual.trim() ? `${motivoManualSelect} — ${descManual.trim()}` : motivoManualSelect;
                try {
                  await fetch('/api/chamada-manual-log', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      motivo: motivoManualSelect,
                      observacao: descManual.trim(),
                      origem: 'professor',
                      data: new Date().toISOString().slice(0, 10),
                    }),
                  });
                } catch (e) {
                  console.error('Erro ao salvar log chamada manual:', e);
                } finally {
                  setSavingMotivoManual(false);
                  setShowModoManualDialog(false);
                  setMotivoManualSelect('');
                  setDescManual('');
                  setModoManual(true);
                }
              }}
            >
              Confirmar e Abrir Chamada Manual
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Alimentação */}
      <Dialog open={showAlimentacaoModal} onOpenChange={setShowAlimentacaoModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-orange-500" />
              Alimentação na Chamada
            </DialogTitle>
            <DialogDescription>
              Houve distribuição de lanche nesta chamada?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => {
                setShowAlimentacaoModal(false);
                saveChamadaMutation.mutate({ teveAlimentacao: true });
              }}
              disabled={saveChamadaMutation.isPending}
            >
              <Utensils className="w-4 h-4 mr-2" />
              Sim, teve lanche
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAlimentacaoModal(false);
                saveChamadaMutation.mutate({ teveAlimentacao: false });
              }}
              disabled={saveChamadaMutation.isPending}
            >
              Não teve lanche
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Data de Ingresso ao adicionar aluno */}
      <Dialog open={!!pendingAddAlunoProf} onOpenChange={(open) => { if (!open) setPendingAddAlunoProf(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Data de Ingresso</DialogTitle>
            <DialogDescription>Informe a data em que o participante ingressou na turma.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Participante</p>
              <p className="text-sm text-gray-900">{pendingAddAlunoProf?.nome}</p>
            </div>
            <div>
              <Label htmlFor="dataIngressoProfInput">Data de ingresso</Label>
              <Input
                id="dataIngressoProfInput"
                type="date"
                value={dataIngressoProf}
                onChange={(e) => setDataIngressoProf(e.target.value)}
                max={getBrazilDateString()}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setPendingAddAlunoProf(null)}>Cancelar</Button>
            <Button
              className="bg-green-500 hover:bg-green-600"
              disabled={!dataIngressoProf || addAlunoTurmaMutation.isPending}
              onClick={() => {
                if (!pendingAddAlunoProf) return;
                addAlunoTurmaMutation.mutate({
                  turmaId: pendingAddAlunoProf.turmaId,
                  participanteId: pendingAddAlunoProf.participanteId,
                  dataIngresso: dataIngressoProf,
                });
                setPendingAddAlunoProf(null);
              }}
            >
              {addAlunoTurmaMutation.isPending ? 'Adicionando...' : 'Confirmar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Galeria de fotos comprovante */}
      <Dialog open={!!fotosGaleriaDialog} onOpenChange={(o) => { if (!o) setFotosGaleriaDialog(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Fotos Comprovante
            </DialogTitle>
          </DialogHeader>
          {fotosGaleriaLoading ? (
            <div className="flex justify-center py-8 text-gray-500">Carregando fotos...</div>
          ) : fotosGaleriaDialog?.urls.length === 0 ? (
            <div className="flex justify-center py-8 text-gray-400">Nenhuma foto encontrada.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto py-2">
              {(fotosGaleriaDialog?.urls || []).map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                  <img src={url} alt={`Foto ${i + 1}`} className="w-full rounded-lg object-cover border hover:opacity-90 transition-opacity" style={{ maxHeight: 300 }} />
                  <span className="text-xs text-gray-400 mt-1 block text-center">Foto {i + 1}</span>
                </a>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}