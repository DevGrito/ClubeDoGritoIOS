import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, keepPreviousData } from "@tanstack/react-query";
import { apiRequest, authFetch, queryClient } from "@/lib/queryClient";
import { logoutAndClearSession } from "@/lib/auth-session";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PrivacyPreferencesDropdownItem } from "@/components/PrivacyPreferencesMenuItem";
import { LgpdLegalHeaderButtons, LgpdMeusDadosSettingsPanel } from "@/components/LgpdLegalMenuSection";
import { openPrivacyPreferences } from "@/lib/consentManager";
import { PushNotificationSettings } from "@/components/PushNotificationSettings";
import AreaConsentGate, { useAreaConsentReady } from "@/components/AreaConsentGate";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, formatCPF } from "@/lib/utils";
import {
  Users,
  BookOpen,
  Calendar,
  FileText,
  Settings,
  LogOut,
  BrainCircuit,
  Clock,
  Target,
  Activity,
  TrendingUp,
  UserCheck,
  Download,
  Plus,
  Search,
  User,
  CheckCircle,
  Edit,
  Eye,
  Building2,
  GraduationCap,
  Briefcase,
  Upload,
  Trash2,
  Lock,
  ExternalLink,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  UserX,
  Phone,
  MapPin,
  Heart,
  Shirt,
  Loader2,
  X,
  Camera,
  Pencil,
  Ban,
  FileDown,
  BarChart2,
  Check,
  ChevronsUpDown,
  MoreHorizontal,
  Shield
} from "lucide-react";
import { ProfileImageUploader } from "@/components/ProfileImageUploader";
import AlterarSenha from "@/components/AlterarSenha";
import { ComprehensiveStudentForm } from "@/components/comprehensive-student-form";
import { TurmaInclusaoForm } from "@/components/TurmaInclusaoForm";
import { getDiasAulaParaTurma, parseDateLocal, type DiaAula } from "@/lib/class-days";
import { isPlanoStatusExibivel, labelPlanoStatusExibivel } from "@/lib/plano-aula-status";
import RelatoriosAulasProfessoresSection from "@/components/coordenador/RelatoriosAulasProfessoresSection";
import { GeracaoRendaSection } from "@/components/GeracaoRendaSection";
import PresencaInclusaoControl from "@/components/presenca/PresencaInclusaoControl";
import PresencaManualSenhaCoordinatorModal from "@/components/presenca/PresencaManualSenhaCoordinatorModal";
import FrequenciaTurmas from "@/components/FrequenciaTurmas";
import AprovacoesSemana from "@/components/presenca/AprovacoesSemana";
import CoordenadorDashboard from "@/components/CoordenadorDashboard";
import { buildPeriodoQueryString, type PeriodoFiltro } from "@/lib/dashboardPeriodoFiltro";
import { RelatoriosPanel } from "@/components/RelatoriosPanel";
import ParticipantesInclusaoSection from "@/components/ParticipantesInclusaoSection";
import GerenciarProfessores from "@/components/GerenciarProfessores";
import NpsPesquisasSection from "@/components/NpsPesquisasSection";
import { TurmaDetailModalInclusao } from "@/components/inclusao/TurmaDetailModalInclusao";
import { baixarListaAlunos } from "@/lib/pdfUtils";
import VincularProfessoresTurma from "@/components/VincularProfessoresTurma";
import EventosGritoSection from "@/components/EventosGritoSection";
import { useAuthSession } from "@/hooks/useAuthSession";
import { gerarRelatorioTurma, type RelatorioDados } from "@/components/TurmaRelatorioInclusao";

// Helper para formatar status
const formatarStatus = (status: string | null | undefined): string => {
  if (!status) return 'Em andamento';

  const statusMap: Record<string, string> = {
    'emandamento': 'Em andamento',
    'em_andamento': 'Em andamento',
    'em-andamento': 'Em andamento',
    'ativo': 'Em andamento',
    'concluido': 'Concluído',
    'finalizado': 'Concluído',
  };

  return statusMap[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

const getStatusBadgeClass = (status: string | null | undefined): string => {
  const s = (status || '').toLowerCase();
  if (s === 'concluido' || s === 'finalizado') return 'bg-green-100 text-green-800 border border-green-200';
  return 'bg-blue-100 text-blue-800 border border-blue-200';
};

/** Resposta da API (camelCase Drizzle) ou legado snake_case. */
function ymdFromCampoExcecao(v: unknown): string {
  if (v == null || v === "") return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v);
  return s.includes("T") ? s.split("T")[0] : s;
}

function formatarDiaExcecaoPtBr(ymd: string): string {
  if (!ymd) return "—";
  return new Date(ymd + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const DIA_MAP_COORD: Record<string, number> = {
  domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6,
};

function formatYmdPtBr(v: unknown): string {
  if (!v) return "A definir";
  const d = parseDateLocal(v as string);
  return d ? d.toLocaleDateString("pt-BR") : "A definir";
}

function calcTurmaCargaHoraria(turma: any): { count: number; duracaoMin: number; totalHoras: number } | null {
  const dataInicio = turma.dataInicio || turma.data_inicio;
  const dataFim = turma.dataFim || turma.data_fim;
  const horarioEntrada = turma.horarioEntrada || turma.horario_entrada;
  const horarioSaida = turma.horarioSaida || turma.horario_saida;
  const diasRaw: string[] = turma.diasSemana || turma.dias_semana || [];
  const dias = [...new Set(diasRaw.map((d: string) => d.toLowerCase()))];
  if (!dataInicio || !dataFim || dias.length === 0 || !horarioEntrada || !horarioSaida) return null;
  const [hE, mE] = String(horarioEntrada).split(':').map(Number);
  const [hS, mS] = String(horarioSaida).split(':').map(Number);
  const duracaoMin = (hS * 60 + mS) - (hE * 60 + mE);
  if (duracaoMin <= 0) return null;
  const diasNums = dias.map((d: string) => DIA_MAP_COORD[d]).filter((d: any) => d !== undefined);
  let count = 0;
  const cur = parseDateLocal(dataInicio);
  const end = parseDateLocal(dataFim);
  if (!cur || !end) return null;
  while (cur <= end) {
    if (diasNums.includes(cur.getDay())) count++;
    cur.setDate(cur.getDate() + 1);
  }
  const totalHoras = count * (duracaoMin / 60);
  return { count, duracaoMin, totalHoras };
}

// Schema para validação do formulário de participante
const participanteSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  cpf: z.string().optional().or(z.literal('')),
  genero: z.enum(["Masculino", "Feminino", "Outro", "Prefiro não informar"], {
    required_error: "Gênero é obrigatório"
  }),
  idade: z.coerce.number().int().min(1, "Idade deve ser maior que zero").max(150, "Idade inválida"),
  codigoMatricula: z.string().optional().or(z.literal('')),
  identificador: z.string().optional().or(z.literal('')),
  dataIngresso: z.string().optional().or(z.literal('')),
  email: z.string().email("Email inválido").optional().or(z.literal('')),
  telefone: z.string().optional().or(z.literal('')),
  endereco: z.string().optional(),
  escolaridade: z.enum([
    "Fundamental Incompleto",
    "Fundamental Completo",
    "Médio Incompleto",
    "Médio Completo",
    "Superior Incompleto",
    "Superior Completo",
    "Pós-graduação"
  ]).optional(),
  experienciaProfissional: z.string().optional(),
  objetivosProfissionais: z.string().optional(),
  turmaIds: z.array(z.number()).optional()
});

type ParticipanteForm = z.infer<typeof participanteSchema>;

const formatCellSmart = (value: any, key?: string) => {
  if (value === null || value === undefined || value === "") return "—";

  const lowerKey = (key || "").toLowerCase();
  const looksLikeDateKey =
    lowerKey.includes("data") ||
    lowerKey.includes("date") ||
    lowerKey.includes("ingresso") ||
    lowerKey.includes("nascimento") ||
    lowerKey.includes("entrada");

  if (looksLikeDateKey) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return format(d, "dd/MM/yyyy");
  }

  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (Array.isArray(value)) return value.join(", ");

  if (typeof value === "object") {
    try { return JSON.stringify(value); } catch { return String(value); }
  }

  return String(value);
};

export default function CoordenadorInclusaoPage() {
  const fetch = authFetch;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { ready: consentReady, checking: consentChecking, markReady: setConsentReady } =
    useAreaConsentReady("employees");
  const [activeSection, setActiveSection] = useState('dashboard');
  const changeSection = (section: string) => {
    setActiveSection(section);
    requestAnimationFrame(() => {
      setTimeout(() => {
        const el = document.getElementById('coordenador-inclusao-content-area');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    });
  };
  const [showAddModal, setShowAddModal] = useState(false);
  const [filtroStatusTurma, setFiltroStatusTurma] = useState<string>('todos');
  const [filtroStatusPrograma, setFiltroStatusPrograma] = useState<string>('todos');
  const [buscaTurma, setBuscaTurma] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [coordenadorId, setCoordenadorId] = useState<number | null>(null);
  const { data: authSession } = useAuthSession();
  const userId = Number(authSession?.id || localStorage.getItem("userId") || localStorage.getItem("coordenadorId") || 0);
  const userName = "Coordenador";
  const userPapel = localStorage.getItem("userPapel");
  const [turmaParaFinalizarId, setTurmaParaFinalizarId] = useState<number | null>(null);
  const [turmaParaInativar, setTurmaParaInativar] = useState<any>(null);
  const [confirmInativarOpen, setConfirmInativarOpen] = useState(false);

  // 👇 novo: guardar o importId que o backend devolve
  const [importId, setImportId] = useState<string | null>(null);

  // 👇 preview da inclusão (só participantes, ou o pacote todo)
  const [previewData, setPreviewData] = useState<{
    participantes: any[];
    stats?: any;
  } | null>(null);

  // 👇 índices selecionados (na inclusão é o `row.index` do preview)
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [previewFiltro, setPreviewFiltro] = useState<"todos" | "validos" | "invalidos">("todos");
  const [previewPage, setPreviewPage] = useState(0);
  const ITEMS_PER_PAGE = 50;
  const [showEditProgramaModal, setShowEditProgramaModal] = useState(false);
  const [showDetalhesProgramaModal, setShowDetalhesProgramaModal] = useState(false);
  const [selectedPrograma, setSelectedPrograma] = useState<any>(null);
  const [dashFiltroAno, setDashFiltroAno] = useState(new Date().getFullYear());
  const [dashFiltroPeriodo, setDashFiltroPeriodo] = useState<PeriodoFiltro>("todos");
  const [showDetalhesTurmaModal, setShowDetalhesTurmaModal] = useState(false);
  const [showEditParceiroModal, setShowEditParceiroModal] = useState(false);
  const [showHistoricoModal, setShowHistoricoModal] = useState(false);
  const [selectedParceiro, setSelectedParceiro] = useState<any>(null);
  const [showNovoProgramaModal, setShowNovoProgramaModal] = useState(false);
  const [showNovaTurmaModal, setShowNovaTurmaModal] = useState(false);

  // Relatório de Turma
  const [relTurmaId, setRelTurmaId] = useState<string>('');
  const [relTipo, setRelTipo] = useState<'mensal' | 'geral'>('mensal');
  const [relMes, setRelMes] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [relDataInicio, setRelDataInicio] = useState<string>('');
  const [relDataFim, setRelDataFim] = useState<string>('');
  const [relLoading, setRelLoading] = useState(false);
  const [relTurmaOpen, setRelTurmaOpen] = useState(false);
  const [relTurmaBusca, setRelTurmaBusca] = useState('');
  const [desligarModal, setDesligarModal] = useState<{ participanteId: number; turmaId: number; nome: string } | null>(null);
  const [dashFiltroTurma, setDashFiltroTurma] = useState<string>("");
  const [dashFiltroPrograma, setDashFiltroPrograma] = useState<string>("");
  const [dashSemFormatura, setDashSemFormatura] = useState(false);
  const [desligarMotivo, setDesligarMotivo] = useState("");
  const [desligarLoading, setDesligarLoading] = useState(false);
  const [selectedTurma, setSelectedTurma] = useState<any>(null);
  const [showExcecaoModal, setShowExcecaoModal] = useState(false);
  const [excecaoTab, setExcecaoTab] = useState<"historico" | "registrar">("historico");
  const [excecaoFiltroTipo, setExcecaoFiltroTipo] = useState<"todos" | "cancelamento" | "remanejamento">("todos");
  const [excecaoHistoricoTurmaOpen, setExcecaoHistoricoTurmaOpen] = useState(false);
  const [excecaoRegistrarTurmaOpen, setExcecaoRegistrarTurmaOpen] = useState(false);
  const [excecaoDataOpenTab, setExcecaoDataOpenTab] = useState(false);
  const [excecaoDataOpenSection, setExcecaoDataOpenSection] = useState(false);
  const [excecaoEditModal, setExcecaoEditModal] = useState(false);
  const [excecaoEditando, setExcecaoEditando] = useState<any>(null);
  const [editNovaData, setEditNovaData] = useState("");
  const [editDataOriginal, setEditDataOriginal] = useState("");
  const [editMotivo, setEditMotivo] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [excecaoTurmaId, setExcecaoTurmaId] = useState<string>("");
  const [excecaoTurmaIdModal, setExcecaoTurmaIdModal] = useState<string>("");
  const [excecaoTurmaPopoverOpen, setExcecaoTurmaPopoverOpen] = useState(false);
  const [excecaoTipo, setExcecaoTipo] = useState<"cancelamento" | "remanejamento">("cancelamento");
  const [excecaoDataOriginal, setExcecaoDataOriginal] = useState("");
  const [excecaoMotivo, setExcecaoMotivo] = useState("");
  const [excecaoNovaData, setExcecaoNovaData] = useState("");
  const [excecaoLoading, setExcecaoLoading] = useState(false);
  const [confirmExcluirExcecaoOpen, setConfirmExcluirExcecaoOpen] = useState(false);
  const [excecaoParaExcluir, setExcecaoParaExcluir] = useState<any>(null);
  const [showEditTurmaModal, setShowEditTurmaModal] = useState(false);
  const [showFinalizarTurmaModal, setShowFinalizarTurmaModal] = useState(false);
  const [participantesSelecionados, setParticipantesSelecionados] = useState<number[]>([]);
  const [buscaParticipante, setBuscaParticipante] = useState("");
  const [participantesTurmaAtual, setParticipantesTurmaAtual] = useState<any[]>([]);
  const [isLoadingParticipantesTurma, setIsLoadingParticipantesTurma] = useState(false);
  const [isFinalizando, setIsFinalizando] = useState(false);
  const [showExcluirProgramaModal, setShowExcluirProgramaModal] = useState(false);
  const [programaToDelete, setProgramaToDelete] = useState<any>(null);
  const [showNovoParticipanteModal, setShowNovoParticipanteModal] = useState(false);
  const [fotoParticipantePreview, setFotoParticipantePreview] = useState<string | null>(null);
  const [fotoParticipanteFile, setFotoParticipanteFile] = useState<File | null>(null);
  const [showGerenciarAlunosTurmaModal, setShowGerenciarAlunosTurmaModal] = useState(false);
  const [turmaSelecionadaParaAlunos, setTurmaSelecionadaParaAlunos] = useState<any>(null);
  const [alunosDaTurma, setAlunosDaTurma] = useState<any[]>([]);
  const [searchAlunoTurma, setSearchAlunoTurma] = useState("");
  const [searchAcompanhamento, setSearchAcompanhamento] = useState("");
  const [loadingAlunosTurma, setLoadingAlunosTurma] = useState(false);
  const [showVincularProfessoresModal, setShowVincularProfessoresModal] = useState(false);
  const [turmaParaVincular, setTurmaParaVincular] = useState<any>(null);
  // Modais de planos e relatórios de aulas
  const [showPlanosAulaModal, setShowPlanosAulaModal] = useState(false);
  const [showRelatoriosAulaModal, setShowRelatoriosAulaModal] = useState(false);
  const [planoAulaDetalhes, setPlanoAulaDetalhes] = useState<any>(null);
  const [filtroProf, setFiltroProf] = useState("");
  const [filtroProfAtivoPlanos, setFiltroProfAtivoPlanos] = useState("");
  const [filtroTurmaAtivoPlanos, setFiltroTurmaAtivoPlanos] = useState("");
  const [filtroDataInicioPlanos, setFiltroDataInicioPlanos] = useState("");
  const [filtroDataFimPlanos, setFiltroDataFimPlanos] = useState("");

  const handleFotoParticipanteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoParticipanteFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoParticipantePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const [selectedParticipante, setSelectedParticipante] = useState<any>(null);
  const [fullParticipanteData, setFullParticipanteData] = useState<any>(null);
  const [loadingParticipanteDetails, setLoadingParticipanteDetails] = useState(false);
  const [showEditParticipanteModal, setShowEditParticipanteModal] = useState(false);
  const [showDetalhesParticipanteModal, setShowDetalhesParticipanteModal] = useState(false);
  const [showInativarParticipanteModal, setShowInativarParticipanteModal] = useState(false);
  const [participanteDocumentos, setParticipanteDocumentos] = useState<any[]>([]);
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);
  const [uploadingDocumento, setUploadingDocumento] = useState(false);
  const [showDocumentoPreviewModal, setShowDocumentoPreviewModal] = useState(false);
  const [documentoPreviewUrl, setDocumentoPreviewUrl] = useState<string>("");
  const [documentoPreviewNome, setDocumentoPreviewNome] = useState<string>("");
  const [statusFilterParticipantes, setStatusFilterParticipantes] = useState<string>('ativos');
  const [showEditFotoModal, setShowEditFotoModal] = useState(false);
  const [showHistoricoAcessosModal, setShowHistoricoAcessosModal] = useState(false);
  const [showAlterarSenhaModal, setShowAlterarSenhaModal] = useState(false);
  const [novaTurmaProgramaId, setNovaTurmaProgramaId] = useState<string>("");
  const [novaTurmaStatus, setNovaTurmaStatus] = useState<string>("emandamento");
  const [novaTurmaDataInicio, setNovaTurmaDataInicio] = useState<Date | undefined>(undefined);
  const [novaTurmaDataFim, setNovaTurmaDataFim] = useState<Date | undefined>(undefined);
  const [novaTurmaHoraInicio, setNovaTurmaHoraInicio] = useState<string>("");
  const [novaTurmaHoraFim, setNovaTurmaHoraFim] = useState<string>("");
  const [editTurmaStatus, setEditTurmaStatus] = useState<string>("emandamento");
  const [editTurmaHoraInicio, setEditTurmaHoraInicio] = useState<string>("");
  const [editTurmaHoraFim, setEditTurmaHoraFim] = useState<string>("");
  const [editTurmaDiasSemana, setEditTurmaDiasSemana] = useState<string[]>([]);

  const diasDaSemana = [
    { value: "segunda", label: "Seg" },
    { value: "terca", label: "Ter" },
    { value: "quarta", label: "Qua" },
    { value: "quinta", label: "Qui" },
    { value: "sexta", label: "Sex" },
    { value: "sabado", label: "Sáb" },
    { value: "domingo", label: "Dom" },
  ];

  // States para edição de programa
  const [editProgramaStatus, setEditProgramaStatus] = useState<string>("planejado");
  const [editProgramaModalidade, setEditProgramaModalidade] = useState<string>("presencial");

  // States para criação de programa
  const [createProgramaStatus, setCreateProgramaStatus] = useState<string>("planejado");
  const [createProgramaModalidade, setCreateProgramaModalidade] = useState<string>("presencial");


  // State para busca de participantes
  const [searchParticipante, setSearchParticipante] = useState<string>("");


  // Estados para o perfil do coordenador
  const [perfilNome, setPerfilNome] = useState<string>("");
  const [perfilEmail, setPerfilEmail] = useState<string>("");
  const [perfilTelefone, setPerfilTelefone] = useState<string>("");
  const [perfilRamal, setPerfilRamal] = useState<string>("");
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);


  const handleOpenImport = () => {
    setShowImportModal(true);
    setImportFile(null);

    // ✅ limpar cache local
    setImportId(null);
    setPreviewData(null);
    setSelectedIndexes([]);
  };

  const toggleSelectIndex = (idx: number) => {
    setSelectedIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleRunPreview = async () => {
    if (!importFile) {
      toast({
        title: "Selecione uma planilha",
        description: "Envie um arquivo .xlsx",
        variant: "destructive",
      });
      return;
    }

    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", importFile);

      const resp = await fetch("/api/inclusao/import/preview", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || "Falha ao ler a planilha.");
      console.log("[IMPORT PREVIEW] response:", json);
      console.log("[IMPORT PREVIEW] participantes length:", json?.preview?.participantes?.length);
      console.log("[IMPORT PREVIEW] stats:", json?.stats);

      // ✅ backend devolve: { importId, preview: { participantes... }, stats }
      setImportId(json.importId);
      setPreviewData({
        participantes: json.preview?.participantes || [],
        stats: json.stats,
      });

      // ✅ por padrão: seleciona todos válidos
      const valids = (json.preview?.participantes || [])
        .filter((r: any) => r?.isValid)
        .map((r: any) => r.index);
      setSelectedIndexes(valids);

      setPreviewFiltro("todos");
      setPreviewPage(0);

      toast({
        title: "Preview carregado",
        description: `Válidos: ${json.stats?.participantes?.valid ?? 0} | Inválidos: ${json.stats?.participantes?.invalid ?? 0}`,
      });
    } catch (e: any) {
      toast({
        title: "Erro no preview",
        description: e?.message || "Falha ao processar planilha.",
        variant: "destructive",
      });
    } finally {
      setImportLoading(false);
    }
  };

  const handleCommitImport = async () => {
    if (!importId) {
      toast({
        title: "Faça o preview primeiro",
        description: "Carregue o preview antes de confirmar a importação.",
        variant: "destructive",
      });
      return;
    }

    setImportLoading(true);
    try {
      const resp = await fetch("/api/inclusao/import/commit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          importId,
          selectedIndexes,
        }),
      });

      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || "Falha ao importar.");

      const imported = json.imported?.participantes ?? 0;
      const errors = json.errors ?? [];
      const warns = errors.filter((e: any) => e.level === "warning").length;
      const errs = errors.filter((e: any) => e.level !== "warning").length;

      toast({
        title: "Importação concluída",
        description: `Importados: ${imported} | Avisos: ${warns} | Erros: ${errs}`,
      });

      // ✅ atualiza lista
      queryClient.invalidateQueries({ queryKey: ["/api/participantes-inclusao"] });

      // ✅ fecha modal e limpa
      setShowImportModal(false);
      setImportFile(null);
      setImportId(null);
      setPreviewData(null);
      setSelectedIndexes([]);
    } catch (e: any) {
      toast({
        title: "Erro ao importar",
        description: e?.message || "Falha ao confirmar importação.",
        variant: "destructive",
      });
    } finally {
      setImportLoading(false);
    }
  };
  // keys "feias" / internas que não vale virar coluna
  const PREVIEW_EXCLUDE_KEYS = new Set([
    "errors",
    "isValid",
    "index",
  ]);

  const labelFromKey = (key: string) => {
    // transforma camelCase / snake_case em label bonitinha
    const spaced = key
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .trim();
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  };

  const formatCell = (value: any) => {
    if (value === null || value === undefined || value === "") return "—";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") {
      // tenta mostrar objeto sem quebrar a tabela
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  const getPreviewColumns = (rows: any[]) => {
    // junta todas as keys de row.data
    const set = new Set<string>();
    for (const r of rows || []) {
      const data = r?.data || {};
      Object.keys(data).forEach((k) => {
        if (!PREVIEW_EXCLUDE_KEYS.has(k)) set.add(k);
      });
    }

    // Ordem preferida (se existirem)
    const preferred = [
      "nome",
      "cpf",
      "genero",
      "idade",
      "telefone",
      "email",
      "endereco",
      "escolaridade",
      "experienciaProfissional",
      "objetivosProfissionais",
      "codigoMatricula",
      "identificador",
      "dataIngresso",
      "turmasCodigos",
      "turmaIds",
    ];

    const all = Array.from(set);

    // ordena: primeiro os preferred, depois o resto
    const preferredPresent = preferred.filter((k) => set.has(k));
    const rest = all.filter((k) => !preferredPresent.includes(k)).sort();
    return [...preferredPresent, ...rest];
  };

  // Coordenador sempre exibe "Coordenador" (não pega do localStorage)

  // Query para buscar dados do perfil do coordenador (users + coordenadores)
  const { data: perfilData, refetch: refetchPerfil } = useQuery({
    queryKey: ["/api/coordenador/me"],
    queryFn: async () => {
      const response = await fetch("/api/coordenador/me", {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) return null;
        if (response.status === 404) return null;
        throw new Error("Falha ao carregar perfil do coordenador");
      }

      const json = await response.json();
      const data = json?.data;

      if (!data) return null;

      setPerfilNome(data.nome || "");
      setPerfilEmail(data.email || "");
      setPerfilTelefone(data.telefone || "");
      setPerfilRamal(data.formacao || "");

      return data;
    },
  });
  const resolvedCoordenadorId =
    coordenadorId ?? (perfilData?.id ? Number(perfilData.id) : null);
  // Query para buscar dados do dashboard do coordenador
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/coordenador/dashboard", "inclusao"],
    queryFn: async () => {
      const response = await fetch("/api/coordenador/dashboard?area=inclusao", {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sessão expirada. Faça login novamente.");
        }
        if (response.status === 403) {
          throw new Error("Você não tem permissão para acessar este dashboard.");
        }
        throw new Error("Falha ao carregar dados do painel");
      }

      const json = await response.json();

      if (json?.coordenadorId) {
        setCoordenadorId(Number(json.coordenadorId));
      }

      return json;
    },
  });
  const {
    data: dashboardDemografico,
    isLoading: loadingDemografico,
    isError: dashboardDemograficoError,
    error: dashboardDemograficoErrorObj,
    refetch: refetchDashboardDemografico,
  } = useQuery<any>({
    queryKey: ['/api/coordenador/dashboard-demografico-inclusao', dashFiltroAno, dashFiltroPeriodo],
    queryFn: async () => {
      const url = '/api/coordenador/dashboard-demografico-inclusao' + buildPeriodoQueryString(dashFiltroAno, dashFiltroPeriodo);
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error('Falha ao carregar dados demográficos');
      return response.json();
    },
    placeholderData: keepPreviousData,
  });

  // Query para buscar programas do banco de dados
  const { data: programasData = [], isLoading: isLoadingProgramas } = useQuery({
    queryKey: ['/api/programas-inclusao'],
    queryFn: async () => {
      const response = await fetch('/api/programas-inclusao', {
        credentials: "include",
      });
      if (!response.ok) throw new Error('Falha ao carregar programas');
      return response.json();
    },

  });

  // Query para buscar turmas do banco de dados
  const { data: turmasData = [], isLoading: isLoadingTurmas } = useQuery({
    queryKey: ['/api/turmas-inclusao'],
    queryFn: async () => {
      const response = await fetch('/api/turmas-inclusao', { credentials: "include" })
      if (!response.ok) throw new Error('Falha ao carregar turmas');
      return response.json();
    },
    staleTime: 0,
  });

  const turmasAtivasExcecao = useMemo(() => {
    const statusAtivos = new Set([
      "ativo",
      "em_andamento",
      "emandamento",
      "em andamento",
      "andamento",
      "em-execucao",
      "em_execucao",
      "execucao",
    ]);

    return (turmasData as any[])
      .filter((turma: any) => {
        const statusNormalizado = String(turma?.status || "")
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/-/g, "_");

        return statusAtivos.has(statusNormalizado);
      })
      .sort((a: any, b: any) =>
        String(a?.nome || "").localeCompare(String(b?.nome || ""), "pt-BR", {
          sensitivity: "base",
        })
      );
  }, [turmasData]);

  const turmaParaFinalizar = turmasData?.find((t: any) => Number(t.id) === Number(turmaParaFinalizarId));

  const excluirExcecao = async () => {
    if (!excecaoParaExcluir?.id) return;
    try {
      await fetch(`/api/turmas-inclusao/excecoes/${excecaoParaExcluir.id}`, { method: 'DELETE', credentials: 'include' });
      toast({ title: "Registro removido." });
      refetchExcecoes();
      if (excecaoEditando?.id === excecaoParaExcluir.id) {
        setExcecaoEditModal(false);
      }
    } catch {
      toast({ title: "Erro ao remover", variant: "destructive" });
    } finally {
      setConfirmExcluirExcecaoOpen(false);
      setExcecaoParaExcluir(null);
    }
  };

  const { data: excecoesTodas = [], refetch: refetchExcecoes, isPending: loadingExcecoesTurma, isFetching: fetchingExcecoesTurma } = useQuery({
    queryKey: ['/api/turmas-inclusao/excecoes/todas'],
    queryFn: async () => {
      const r = await fetch('/api/turmas-inclusao/excecoes/todas', { credentials: 'include' });
      const j = await r.json().catch(() => null);
      if (!r.ok) return [];
      return Array.isArray(j) ? j : [];
    },
  });

  const excecoesTurma = useMemo(() => {
    if (!excecaoTurmaId) return (excecoesTodas as any[]);
    return (excecoesTodas as any[]).filter(
      (exc: any) => String(exc.turmaId ?? exc.turma_id) === String(excecaoTurmaId)
    );
  }, [excecoesTodas, excecaoTurmaId]);

  const { data: excecaoDiasAula = { dias: [] } } = useQuery({
    queryKey: ['/api/turmas-inclusao/dias-aula', excecaoTurmaIdModal],
    queryFn: async () => {
      if (!excecaoTurmaIdModal) return { dias: [] };
      const r = await fetch(`/api/turmas-inclusao/${excecaoTurmaIdModal}/dias-aula`, { credentials: 'include' });
      if (!r.ok) return { dias: [] };
      return r.json();
    },
    enabled: !!excecaoTurmaIdModal,
  });

  // Query para buscar participantes do banco de dados
  const { data: participantesData = [], isLoading: isLoadingParticipantes } = useQuery({
    queryKey: ['/api/participantes-inclusao'],
    queryFn: async () => {
      const response = await fetch('/api/participantes-inclusao', { credentials: "include" });
      if (!response.ok) throw new Error('Falha ao carregar participantes');
      return response.json();
    },

  });

  const { data: presencasData } = useQuery({
    queryKey: ['/api/inclusao/presencas', 2026],
    queryFn: async () => {
      const response = await fetch('/api/inclusao/presencas?ano=2026', { credentials: "include" });
      if (!response.ok) return { total: 0 };
      return response.json();
    },
    retry: false,
  });

  // Queries para planos de aula e aulas registradas (visão coordenador)
  const { data: planosAulaInclusao = [], isLoading: loadingPlanos, refetch: refetchPlanos } = useQuery({
    queryKey: ['/api/coordenador/inclusao/planos-aula'],
    queryFn: async () => {
      const r = await fetch('/api/coordenador/inclusao/planos-aula', { credentials: 'include' });
      if (!r.ok) throw new Error('Falha ao carregar planos de aula');
      return r.json();
    },
    enabled: activeSection === 'planos-aula' || activeSection === 'relatorios-aulas',
    staleTime: 0,
  });

  const { data: aulasRegistradasInclusao = [], isLoading: loadingRelatorios, refetch: refetchRelatorios } = useQuery({
    queryKey: ['/api/coordenador/inclusao/aulas-registradas'],
    queryFn: async () => {
      const r = await fetch('/api/coordenador/inclusao/aulas-registradas', { credentials: 'include' });
      if (!r.ok) throw new Error('Falha ao carregar relatórios de aulas');
      return r.json();
    },
    enabled: activeSection === 'relatorios-aulas',
    staleTime: 0,
  });

  const { data: metasInclusao } = useQuery<any>({
    queryKey: ['/api/metas-indicadores', dashFiltroAno, 'inclusao'],
    queryFn: async () => {
      const r = await fetch(`/api/metas-indicadores?ano=${dashFiltroAno}&vertente=inclusao`, { credentials: 'include' });
      if (!r.ok) return null;
      return r.json();
    },
  });

  const finalizarTurmaMutation = useMutation({
    mutationFn: async ({ turmaId, participantesConcluidosIds }: { turmaId: number; participantesConcluidosIds: number[] }) => {
      return apiRequest(`/api/turmas-inclusao/${turmaId}/finalizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantesConcluidosIds }),
      });
    },
    onSuccess: () => {
      toast({ title: "Turma finalizada!", description: "Turma encerrada com sucesso." });

      setShowFinalizarTurmaModal(false);
      setTurmaParaFinalizarId(null);
      setParticipantesSelecionados([]);
      setParticipantesTurmaAtual([]);

      // ✅ recarrega as turmas pra refletir concluído + contagens
      queryClient.invalidateQueries({ queryKey: ["/api/turmas-inclusao"] });

      // ✅ opcional (se sua UI depende disso em algum lugar)
      queryClient.invalidateQueries({ queryKey: ["/api/participantes-inclusao"] });
    },
    onError: (e: any) => {
      toast({
        title: "Erro ao finalizar turma",
        description: e?.message || "Não foi possível finalizar a turma. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Form para adicionar participante
  const formParticipante = useForm<ParticipanteForm>({
    resolver: zodResolver(participanteSchema),
    defaultValues: {
      nome: "",
      cpf: "",
      genero: undefined,
      idade: undefined,
      codigoMatricula: "",
      identificador: "",
      dataIngresso: "",
      email: "",
      telefone: "",
      endereco: "",
      escolaridade: undefined,
      experienciaProfissional: "",
      objetivosProfissionais: "",
      turmaIds: []
    }
  });

  // Form para editar participante
  const formEditParticipante = useForm<ParticipanteForm>({
    resolver: zodResolver(participanteSchema),
    defaultValues: {
      nome: "",
      cpf: "",
      genero: undefined,
      idade: undefined,
      codigoMatricula: "",
      identificador: "",
      dataIngresso: "",
      email: "",
      telefone: "",
      endereco: "",
      escolaridade: undefined,
      experienciaProfissional: "",
      objetivosProfissionais: "",
      turmaIds: []
    }
  });

  // Verificar e atualizar status de programas/turmas com data de conclusão passada ao carregar
  useEffect(() => {
    let ran = false;
    const verificarStatus = async () => {
      if (ran) return;
      ran = true;
      try {
        await fetch('/api/inclusao/verificar-status', { method: 'POST', credentials: "include" });
      } catch (err) {
        console.error('Erro ao verificar status:', err);
      }
    };
    verificarStatus();
  }, []);

  // Effect para carregar documentos do participante quando modal de edição é aberto
  // Nota: O formulário de edição agora é gerenciado pelo ComprehensiveStudentForm
  useEffect(() => {
    if (selectedParticipante && showEditParticipanteModal) {
      // Carregar documentos do participante (para exibição no modal de detalhes)
      const loadDocs = async () => {
        setLoadingDocumentos(true);
        try {
          const docsRes = await fetch(`/api/documentos/participante-inclusao/${selectedParticipante.id}`);
          const docsData = await docsRes.json();
          setParticipanteDocumentos(docsData || []);
        } catch (err) {
          console.error('Erro ao carregar documentos:', err);
          setParticipanteDocumentos([]);
        } finally {
          setLoadingDocumentos(false);
        }
      };
      loadDocs();
    }
  }, [selectedParticipante, showEditParticipanteModal]);

  // Mutation para criar participante
  const createParticipanteMutation = useMutation({
    mutationFn: async (data: ParticipanteForm) => {
      const transformedData = {
        ...data,
        dataIngresso: data.dataIngresso && data.dataIngresso !== ''
          ? new Date(data.dataIngresso)
          : undefined
      };
      return apiRequest(`/api/participantes-inclusao`, {
        method: 'POST',
        body: JSON.stringify(transformedData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: async (result: any) => {
      // Upload de foto se houver
      if (fotoParticipanteFile && result?.id) {
        try {
          const formData = new FormData();
          formData.append('foto', fotoParticipanteFile);
          await fetch(`/api/coordenador/participantes/${result.id}/foto`, {
            method: 'POST',
            body: formData
          });
        } catch (err) {
          console.error('Erro ao fazer upload da foto:', err);
        }
      }
      toast({
        title: "Participante criado!",
        description: "Participante adicionado com sucesso."
      });
      setShowNovoParticipanteModal(false);
      formParticipante.reset();
      setFotoParticipantePreview(null);
      setFotoParticipanteFile(null);
      queryClient.invalidateQueries({ queryKey: ['/api/participantes-inclusao'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coordenador/participantes'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar participante",
        description: error.message || "Não foi possível criar o participante. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Mutation para atualizar participante
  const updateParticipanteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ParticipanteForm }) => {
      const transformedData = {
        ...data,
        dataIngresso: data.dataIngresso && data.dataIngresso !== ''
          ? new Date(data.dataIngresso).toISOString()
          : undefined
      };
      return apiRequest(`/api/participantes-inclusao/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(transformedData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Participante atualizado!",
        description: "Os dados foram salvos com sucesso."
      });
      setShowEditParticipanteModal(false);
      setSelectedParticipante(null);
      queryClient.invalidateQueries({ queryKey: ['/api/participantes-inclusao'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coordenador/participantes'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar participante",
        description: error.message || "Não foi possível atualizar o participante. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Mutation para excluir programa
  const deleteProgramaMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/programas-inclusao/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Programa excluído!",
        description: "O programa e seus cursos foram removidos com sucesso."
      });
      setShowExcluirProgramaModal(false);
      setProgramaToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['/api/programas-inclusao'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir programa",
        description: error.message || "Não foi possível excluir o programa. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Funções para exportar/importar Excel
  const handleExportTemplate = () => {
    // Criar template Excel com colunas específicas
    const headers = [
      'Nome Completo',
      'CPF',
      'Email',
      'Telefone',
      'Endereço',
      'Curso/Programa',
      'Escolaridade',
      'Experiência Anterior'
    ];

    const exampleRow = [
      'Maria da Silva',
      '12345678901',
      'maria.silva@email.com',
      '11999999999',
      'Rua das Flores, 123 - São Paulo/SP',
      'Auxiliar Administrativo',
      'Ensino Médio Completo',
      'Trabalhou 2 anos como atendente'
    ];

    // Criar CSV para download
    const csvContent = [headers, exampleRow]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_participantes_inclusao_produtiva.csv';
    link.click();

    toast({
      title: "Template baixado!",
      description: "Use este arquivo como modelo para importar participantes."
    });
  };

  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

      // Validar headers
      const expectedHeaders = ['Nome Completo', 'CPF', 'Email', 'Telefone', 'Endereço', 'Curso/Programa', 'Escolaridade'];
      const isValidTemplate = expectedHeaders.every(header =>
        headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
      );

      if (!isValidTemplate) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, use o template correto baixado pelo sistema.",
          variant: "destructive"
        });
        return;
      }

      // Processar dados
      const participants = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
          if (values.length >= 7) {
            participants.push({
              nome: values[0],
              cpf: values[1],
              email: values[2],
              telefone: values[3],
              endereco: values[4],
              curso: values[5],
              escolaridade: values[6],
              experiencia: values[7] || ''
            });
          }
        }
      }

      if (participants.length > 0) {
        toast({
          title: `${participants.length} participantes prontos para importar`,
          description: "Confirme a importação para adicionar ao sistema."
        });
        // Aqui você pode processar a importação em lote
        console.log('Participantes para importar:', participants);
      }
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const handleSubmitParticipante = (data: ParticipanteForm) => {
    createParticipanteMutation.mutate(data);
  };

  const handleLogout = async () => {
    await logoutAndClearSession();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso."
    });
    setTimeout(() => window.location.href = "/login/coordenador", 500);
  };

  const handleExportReport = async () => {
    try {
      toast({
        title: "Gerando Apresentação",
        description: "Aguarde, estamos preparando seu relatório..."
      });

      const userId = localStorage.getItem('userId');
      console.log('🔑 [EXPORT] userId do localStorage:', userId);

      const response = await fetch('/api/export/relatorio-slides', {
        method: 'GET',
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar relatório');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Relatório_Inclusão_Produtiva_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Sucesso!",
        description: "Relatório exportado com sucesso."
      });
    } catch (error: any) {
      console.error('Erro ao exportar relatório:', error);
      toast({
        title: "Erro",
        description: "Não foi possível exportar o relatório. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleExportParticipantes = async () => {
    try {
      toast({
        title: "Exportando participantes",
        description: "Aguarde, estamos preparando seu arquivo Excel..."
      });

      const response = await fetch('/api/inclusao-produtiva/export-participantes');

      if (!response.ok) {
        throw new Error('Erro ao exportar participantes');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `participantes_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Sucesso!",
        description: "Participantes exportados com sucesso."
      });
    } catch (error: any) {
      console.error('Erro ao exportar participantes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível exportar os participantes. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleExportPresencas = async () => {
    try {
      toast({
        title: "Exportando presenças",
        description: "Aguarde, estamos preparando seu arquivo Excel..."
      });

      const response = await fetch('/api/inclusao-produtiva/export-presencas');

      if (!response.ok) {
        throw new Error('Erro ao exportar presenças');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `presencas_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Sucesso!",
        description: "Presenças exportadas com sucesso."
      });
    } catch (error: any) {
      console.error('Erro ao exportar presenças:', error);
      toast({
        title: "Erro",
        description: "Não foi possível exportar as presenças. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleImportParticipantes = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      toast({
        title: "Importando participantes",
        description: "Aguarde, estamos processando seu arquivo..."
      });

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;

        const response = await fetch('/api/inclusao-produtiva/import-participantes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ file: base64 })
        });

        if (!response.ok) {
          throw new Error('Erro ao importar participantes');
        }

        const result = await response.json();

        toast({
          title: "Importação concluída!",
          description: `${result.imported} de ${result.total} participantes importados com sucesso.${result.errors.length > 0 ? ` ${result.errors.length} erros encontrados.` : ''}`
        });

        queryClient.invalidateQueries({ queryKey: ['/api/participantes-inclusao'] });
      };

      reader.readAsDataURL(file);
      event.target.value = '';
    } catch (error: any) {
      console.error('Erro ao importar participantes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível importar os participantes. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleConfirmarFinalizacaoTurma = () => {
    if (!turmaParaFinalizarId) {
      toast({ title: "Erro", description: "Turma inválida para finalizar.", variant: "destructive" });
      return;
    }

    finalizarTurmaMutation.mutate({
      turmaId: turmaParaFinalizarId,
      participantesConcluidosIds: participantesSelecionados,
    });
  };

  if (consentChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
      </div>
    );
  }
  if (!consentReady) {
    return (
      <AreaConsentGate area="employees" onAccept={() => setConsentReady()} onNavigate={setLocation} />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando coordenação de inclusão produtiva...</p>
        </div>
      </div>
    );
  }

  return (

    <div className="min-h-screen bg-slate-900" data-testid="coordenador-inclusao-page">
      <PresencaManualSenhaCoordinatorModal vertente="inclusao" vertenteLabel="Inclusão Produtiva" />
      {/* MODAL IMPORTAÇÃO (Inclusão Produtiva) */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        {/* ✅ IMPORTANTE:
            - virou flex-col + overflow-hidden pra SEGURAR o layout
            - conteúdo interno que vai scrollar fica dentro do flex-1/min-h-0
        */}
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Importar participantes (Excel)</DialogTitle>
            <DialogDescription>
              Envie a planilha (.xlsx), revise o preview e confirme a importação.
            </DialogDescription>
          </DialogHeader>

          {/* ✅ Corpo do modal (pode crescer e scrollar) */}
          <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
            {/* Upload */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                />

                <Button
                  onClick={handleRunPreview}
                  disabled={!importFile || importLoading}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {importLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  Rodar preview
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setImportId(null);
                    setPreviewData(null);
                    setSelectedIndexes([]);
                  }}
                  disabled={importLoading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Fechar
                </Button>
              </div>

              {/* Stats */}
              {previewData?.stats?.participantes && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    Válidos: {previewData.stats.participantes.valid ?? 0}
                  </Badge>
                  <Badge variant="outline">
                    Inválidos: {previewData.stats.participantes.invalid ?? 0}
                  </Badge>
                  <Badge variant="outline">Selecionados: {selectedIndexes.length}</Badge>
                </div>
              )}
            </div>

            {/* Preview table + footer */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {previewData?.participantes?.length ? (
                (() => {
                  const fieldLabels: Record<string, string> = {
                    nome: "Nome",
                    cpf: "CPF",
                    genero: "Gênero",
                    email: "E-mail",
                    telefone: "Telefone",
                  };

                  const filteredRows = previewData.participantes.filter((r: any) => {
                    if (previewFiltro === "validos") return r.isValid;
                    if (previewFiltro === "invalidos") return !r.isValid;
                    return true;
                  });

                  const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);
                  const pageRows = filteredRows.slice(
                    previewPage * ITEMS_PER_PAGE,
                    (previewPage + 1) * ITEMS_PER_PAGE
                  );

                  const columns = ["nome", "cpf", "genero", "email", "telefone"];

                  return (
                    <div className="border rounded-md overflow-hidden flex flex-col flex-1 min-h-0">
                      {/* Filter tabs */}
                      <div className="flex items-center gap-2 p-2 border-b bg-gray-50">
                        <Button
                          size="sm"
                          variant="outline" className={previewFiltro === "todos" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500" : ""}
                          onClick={() => { setPreviewFiltro("todos"); setPreviewPage(0); }}
                        >
                          Todos ({previewData.participantes.length})
                        </Button>
                        <Button
                          size="sm"
                          variant="outline" className={previewFiltro === "validos" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500" : ""}
                          onClick={() => { setPreviewFiltro("validos"); setPreviewPage(0); }}
                        >
                          Válidos ({previewData.stats?.participantes?.valid ?? 0})
                        </Button>
                        <Button
                          size="sm"
                          variant="outline" className={previewFiltro === "invalidos" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500" : ""}
                          onClick={() => { setPreviewFiltro("invalidos"); setPreviewPage(0); }}
                        >
                          Inválidos ({previewData.stats?.participantes?.invalid ?? 0})
                        </Button>
                      </div>

                      {/* Scroll area */}
                      <div className="flex-1 min-h-0 overflow-auto">
                        <Table>
                          <TableHeader className="sticky top-0 z-10 bg-white shadow-sm">
                            <TableRow>
                              <TableHead className="w-[50px]">Sel.</TableHead>
                              <TableHead className="w-[60px]">Linha</TableHead>
                              <TableHead className="w-[90px]">Status</TableHead>
                              {columns.map((key) => (
                                <TableHead key={key} className="whitespace-nowrap">
                                  {fieldLabels[key] || key}
                                </TableHead>
                              ))}
                              <TableHead className="min-w-[300px]">Motivo</TableHead>
                            </TableRow>
                          </TableHeader>

                          <TableBody>
                            {pageRows.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                  Nenhum participante encontrado neste filtro.
                                </TableCell>
                              </TableRow>
                            )}
                            {pageRows.map((row: any) => {
                              const checked = selectedIndexes.includes(row.index);
                              return (
                                <TableRow
                                  key={row.index}
                                  className={!row.isValid ? "bg-red-50" : ""}
                                >
                                  <TableCell>
                                    <Checkbox
                                      checked={checked}
                                      disabled={!row.isValid}
                                      onCheckedChange={() => toggleSelectIndex(row.index)}
                                    />
                                  </TableCell>
                                  <TableCell className="text-xs text-gray-500">
                                    {row.index + 2}
                                  </TableCell>
                                  <TableCell>
                                    {row.isValid ? (
                                      <Badge className="bg-green-500 text-xs">OK</Badge>
                                    ) : (
                                      <Badge variant="destructive" className="text-xs">Erro</Badge>
                                    )}
                                  </TableCell>
                                  {columns.map((key) => (
                                    <TableCell key={key} className="whitespace-nowrap max-w-[200px] truncate">
                                      {row.data?.[key] || "—"}
                                    </TableCell>
                                  ))}
                                  <TableCell className="min-w-[300px]">
                                    {!row.isValid && row.errors?.length ? (
                                      <ul className="text-xs text-red-700 space-y-0.5">
                                        {row.errors.map((e: any, idx: number) => (
                                          <li key={idx} className="flex items-start gap-1">
                                            <span className="text-red-400 mt-0.5">•</span>
                                            <span>
                                              <strong>{fieldLabels[e.path] || e.path}:</strong>{" "}
                                              {e.message}
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <span className="text-xs text-green-600">Pronto para importar</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Pagination + Confirm */}
                      <div className="flex items-center justify-between gap-3 p-3 border-t bg-white">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={previewPage === 0}
                            onClick={() => setPreviewPage((p) => Math.max(0, p - 1))}
                          >
                            Anterior
                          </Button>
                          <span className="text-xs text-gray-600">
                            {totalPages > 0
                              ? `Página ${previewPage + 1} de ${totalPages} (${filteredRows.length} linhas)`
                              : "Nenhuma linha"}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={previewPage >= totalPages - 1}
                            onClick={() => setPreviewPage((p) => p + 1)}
                          >
                            Próxima
                          </Button>
                        </div>

                        <Button
                          onClick={handleCommitImport}
                          disabled={!importId || importLoading || selectedIndexes.length === 0}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {importLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          Confirmar importação ({selectedIndexes.length})
                        </Button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-sm text-gray-600 py-8 text-center">
                  Nenhum preview carregado ainda. Envie a planilha e clique em{" "}
                  <b>Rodar preview</b>.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 px-4 py-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white" data-testid="text-welcome">
                Coordenação Inclusão Produtiva
              </h1>
              <p className="text-slate-400" data-testid="text-username">Olá Coordenador</p>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            {/* Desktop: botões visíveis */}
            <div className="hidden sm:flex items-center gap-2 flex-wrap justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenImport}
                data-testid="button-import"
                className="border-green-500 text-green-700 hover:bg-green-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleExportReport}
                data-testid="button-export"
                className="bg-green-500 hover:bg-green-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://canaldetransparencia.institutoogrito.com.br', '_blank')}
                data-testid="button-transparencia"
                className="bg-yellow-400 text-black hover:bg-yellow-500 border-yellow-400"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Canal de Transparência
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-blue-500 text-white hover:bg-blue-600 border-blue-500"
                    data-testid="button-plano-acao"
                  >
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Plano de Ação
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
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
              <LgpdLegalHeaderButtons />
            </div>
            {/* Mobile: menu recolhido */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="sm:hidden" data-testid="button-mobile-menu">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleOpenImport} className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2 text-green-600" />
                  Importar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportReport} className="cursor-pointer">
                  <Download className="w-4 h-4 mr-2 text-green-600" />
                  Exportar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open('https://canaldetransparencia.institutoogrito.com.br', '_blank')} className="cursor-pointer">
                  <ExternalLink className="w-4 h-4 mr-2 text-yellow-600" />
                  Canal de Transparência
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open("https://monday.com/lang/pt", "_blank")} className="cursor-pointer">
                  <ClipboardList className="w-4 h-4 mr-2 text-blue-600" />
                  Plano de Ação — Monday
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open("https://slack.com/intl/pt-br/", "_blank")} className="cursor-pointer">
                  <ClipboardList className="w-4 h-4 mr-2 text-blue-600" />
                  Plano de Ação — Slack
                </DropdownMenuItem>
                <PrivacyPreferencesDropdownItem />
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
        {/* Navegação de Cards */}
        <CoordenadorDashboard
          data={dashboardDemografico ? { ...dashboardDemografico, presencas: presencasData?.total ?? 0 } : undefined}
          isLoading={loadingDemografico}
          isError={dashboardDemograficoError}
          errorMessage={(dashboardDemograficoErrorObj as Error)?.message || "Falha ao carregar os indicadores do dashboard."}
          onRetry={refetchDashboardDemografico}
          filtroAno={dashFiltroAno}
          filtroPeriodo={dashFiltroPeriodo}
          onFilterChange={(ano, periodo) => {
            setDashFiltroAno(ano);
            setDashFiltroPeriodo(periodo);
          }}
          tipo="inclusao"
          metaGeracaoRenda={
            (metasInclusao?.metas?.pessoasEmpregadas ?? 1000) +
            (metasInclusao?.metas?.empreendedores ?? 500)
          }
          metaFormados={metasInclusao?.metas?.alunosFormados ?? 2000}
          turmasDetalhadas={{
            ativas: (turmasData as any[]).filter((t: any) => !['concluido', 'inativo', 'finalizado', 'encerrado', 'encerrada'].includes((t.status || '').toLowerCase())).map((t: any) => ({ nome: t.nome || t.name || 'Turma', projeto: t.programa || t.projeto || t.programa_nome })),
            concluidas: (turmasData as any[]).filter((t: any) => ['concluido', 'inativo', 'finalizado', 'encerrado', 'encerrada'].includes((t.status || '').toLowerCase())).map((t: any) => ({ nome: t.nome || t.name || 'Turma', projeto: t.programa || t.projeto || t.programa_nome })),
          }}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          {/* Gestão de Participantes */}
          <Card data-testid="card-participantes">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-blue-500" />
                Gestão de Participantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Gerencie beneficiários dos programas de inclusão produtiva e acompanhe seu desenvolvimento.
              </p>
              <div className="space-y-2">
                <Button
                  
                  variant="outline" className={activeSection === "participantes" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-participantes"
                  onClick={() => changeSection('participantes')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Participantes
                </Button>
                <Button
                  
                  variant="outline" className={activeSection === "acompanhamento" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-acompanhamento"
                  onClick={() => changeSection('acompanhamento')}
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Acompanhamento
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Programas e Cursos */}
          <Card data-testid="card-programas">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="w-5 h-5 text-purple-500" />
                Programas e Cursos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Coordene cursos de capacitação profissional e programas de geração de renda.
              </p>
              <div className="space-y-2">
                <Button
                  
                  variant="outline" className={activeSection === "programas" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-programas"
                  onClick={() => changeSection('programas')}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Programas
                </Button>
                <Button
                  
                  variant="outline" className={activeSection === "turmas" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-turmas"
                  onClick={() => changeSection('turmas')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Turmas
                </Button>
                <Button
                  
                  variant="outline" className={activeSection === "geracao-renda" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  onClick={() => changeSection('geracao-renda')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Geração de Renda
                </Button>
                <Button
                  
                  variant="outline" className={activeSection === "presenca" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-chamadas"
                  onClick={() => changeSection('presenca')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Chamadas
                </Button>
                <Button
                  
                  variant="outline" className={activeSection === "excecoes" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  onClick={() => changeSection('excecoes')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Remanejamentos de Aulas
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Monitoramento e Avaliação */}
          <Card data-testid="card-monitoramento">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-red-500" />
                Monitoramento e Avaliação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Monitore resultados dos programas e avalie o impacto na inclusão produtiva.
              </p>
              <div className="space-y-2">
                <Button
                  
                  variant="outline" className={activeSection === "frequencias" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-frequencias"
                  onClick={() => changeSection('frequencias')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Ver Frequências
                </Button>
                <Button
                  
                  variant="outline" className={activeSection === "monitoramento" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-monitoramento"
                  onClick={() => changeSection('monitoramento')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Monitoramento
                </Button>
                <Button
                  
                  variant="outline" className={activeSection === "resultados" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-resultados"
                  onClick={() => changeSection('resultados')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Resultados
                </Button>
                <Button
                  
                  variant="outline" className={activeSection === "aprovacoes" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  onClick={() => changeSection('aprovacoes')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprovações
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Gerenciar Professores */}
          <Card data-testid="card-professores">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="w-5 h-5 text-teal-500" />
                Professores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Cadastre e gerencie os professores vinculados ao programa de inclusão produtiva.
              </p>
              <div className="space-y-2">
                <Button
                  
                  variant="outline" className={activeSection === "professores" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-professores"
                  onClick={() => changeSection('professores')}
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Gerenciar Professores
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => { setFiltroProf(""); setPlanoAulaDetalhes(null); changeSection('planos-aula'); }}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Planos de Aula
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => { setFiltroProf(""); changeSection('relatorios-aulas'); }}
                >
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Relatórios de Aulas
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Relatórios Gerenciais */}
          <Card data-testid="card-relatorios">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-indigo-500" />
                Relatórios Gerenciais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Gere relatórios executivos e análises de desempenho da área.
              </p>
              <div className="space-y-2">
                <Button
                  
                  variant="outline" className={activeSection === "relatorios" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-relatorios"
                  onClick={() => changeSection('relatorios')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Relatórios
                </Button>
                <Button
                  
                  variant="outline" className={activeSection === "nps" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  onClick={() => changeSection('nps')}
                >
                  <BarChart2 className="w-4 h-4 mr-2" />
                  Pesquisas NPS
                </Button>
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

          {/* Eventos */}
          <Card data-testid="card-eventos-grito">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-red-500" />
                Eventos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Crie e gerencie eventos do Instituto O Grito.
              </p>
              <div className="space-y-2">
                <Button
                  
                  variant="outline" className={activeSection === "eventos-grito" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  onClick={() => changeSection('eventos-grito')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Eventos
                </Button>

              </div>
            </CardContent>
          </Card>

        </div>

        {/* Footer de Navegação */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Coordenação de Inclusão Produtiva • Sistema RBAC Isolado
          </p>
        </div>

        {/* Área de Conteúdo Dinâmica */}
        <div className="mt-8" id="coordenador-inclusao-content-area">
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
            </div>
          )}

          {activeSection === 'participantes' && (
            <ParticipantesInclusaoSection showImportExport={true} />
          )}

          {activeSection === 'acompanhamento' && (
            <Card>
              <CardHeader>
                <CardTitle>Acompanhamento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Acompanhamento individual do progresso dos participantes.</p>
              </CardContent>
            </Card>
          )}

          {activeSection === 'professores' && (
            <GerenciarProfessores programa="inclusao_produtiva" />
          )}

          {activeSection === 'planos-aula' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Planos de Aula — Professores de Inclusão</h2>
                    <p className="text-gray-500 text-sm">Visualize todos os planos de aula registrados pelos professores do programa.</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => changeSection('professores')} className="border-gray-200 text-gray-600 hover:bg-gray-100">
                  ← Voltar
                </Button>
              </div>
              {/* Filtros */}
              {!planoAulaDetalhes && (
                <div className="space-y-2">
                  <div className="flex gap-2 flex-wrap items-center">
                    <Input
                      placeholder="Buscar por título..."
                      value={filtroProf}
                      onChange={e => setFiltroProf(e.target.value)}
                      className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 flex-1 min-w-[140px]"
                    />
                    <select
                      value={filtroProfAtivoPlanos}
                      onChange={e => setFiltroProfAtivoPlanos(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
                    >
                      <option value="">Todos os professores</option>
                      {[...new Set((planosAulaInclusao as any[]).map((p: any) => p.professorNome).filter(Boolean))].map((prof: any) => (
                        <option key={prof} value={prof}>{prof}</option>
                      ))}
                    </select>
                    <select
                      value={filtroTurmaAtivoPlanos}
                      onChange={e => setFiltroTurmaAtivoPlanos(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
                    >
                      <option value="">Todas as turmas</option>
                      {[...new Set((planosAulaInclusao as any[]).map((p: any) => p.turmaNome).filter(Boolean))].map((turma: any) => (
                        <option key={turma} value={turma}>{turma}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1 border border-gray-300 rounded-md px-3 py-1.5 bg-white">
                      <span className="text-xs text-gray-500 shrink-0">De</span>
                      <input
                        type="date"
                        value={filtroDataInicioPlanos}
                        onChange={e => setFiltroDataInicioPlanos(e.target.value)}
                        className="text-sm text-gray-700 bg-transparent focus:outline-none"
                      />
                      <span className="text-xs text-gray-400 shrink-0 px-1">até</span>
                      <input
                        type="date"
                        value={filtroDataFimPlanos}
                        onChange={e => setFiltroDataFimPlanos(e.target.value)}
                        className="text-sm text-gray-700 bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
              {loadingPlanos ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : planosAulaInclusao.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>Nenhum plano de aula registrado ainda.</p>
                </div>
              ) : planoAulaDetalhes ? (
                <div className="space-y-4">
                  <Button variant="outline" size="sm" onClick={() => setPlanoAulaDetalhes(null)} className="border-gray-200 text-gray-600 hover:bg-gray-100">
                    ← Voltar para a lista
                  </Button>
                  <div className="bg-gray-50 rounded-lg p-5 space-y-3 border border-gray-200">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{planoAulaDetalhes.titulo}</h3>
                      {isPlanoStatusExibivel(planoAulaDetalhes.status) && (
                        <Badge variant={planoAulaDetalhes.status === 'aplicado' ? 'secondary' : 'default'} className="capitalize">
                          {labelPlanoStatusExibivel(planoAulaDetalhes.status)}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div><span className="text-gray-500">Professor:</span> <span className="text-white font-medium">{planoAulaDetalhes.professorNome || '—'}</span></div>
                      <div><span className="text-gray-500">Turma:</span> <span className="text-white">{planoAulaDetalhes.turmaNome}</span></div>
                      <div><span className="text-gray-500">Data:</span> <span className="text-white">{planoAulaDetalhes.data ? new Date(planoAulaDetalhes.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</span></div>
                      {planoAulaDetalhes.duracaoMinutos && <div><span className="text-gray-500">Duração:</span> <span className="text-white">{planoAulaDetalhes.duracaoMinutos} min</span></div>}
                    </div>
                    <div><p className="text-gray-500 text-sm font-medium mb-1">Objetivos</p><p className="text-gray-700 text-sm whitespace-pre-wrap">{planoAulaDetalhes.objetivos}</p></div>
                    <div><p className="text-gray-500 text-sm font-medium mb-1">Conteúdo</p><p className="text-gray-700 text-sm whitespace-pre-wrap">{planoAulaDetalhes.conteudo}</p></div>
                    <div><p className="text-gray-500 text-sm font-medium mb-1">Metodologia</p><p className="text-gray-700 text-sm whitespace-pre-wrap">{planoAulaDetalhes.metodologia}</p></div>
                    {planoAulaDetalhes.recursos && <div><p className="text-gray-500 text-sm font-medium mb-1">Recursos</p><p className="text-gray-700 text-sm whitespace-pre-wrap">{planoAulaDetalhes.recursos}</p></div>}
                    {planoAulaDetalhes.avaliacao && <div><p className="text-gray-500 text-sm font-medium mb-1">Avaliação</p><p className="text-gray-700 text-sm whitespace-pre-wrap">{planoAulaDetalhes.avaliacao}</p></div>}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {(() => {
                    const filtrados = (planosAulaInclusao as any[]).filter((p: any) => {
                      const textoOk = !filtroProf || (p.titulo || '').toLowerCase().includes(filtroProf.toLowerCase());
                      const profOk = !filtroProfAtivoPlanos || (p.professorNome || '') === filtroProfAtivoPlanos;
                      const turmaOk = !filtroTurmaAtivoPlanos || (p.turmaNome || '') === filtroTurmaAtivoPlanos;
                      const dataOk = (!filtroDataInicioPlanos || (p.data || '') >= filtroDataInicioPlanos) &&
                                     (!filtroDataFimPlanos || (p.data || '') <= filtroDataFimPlanos);
                      return textoOk && profOk && turmaOk && dataOk;
                    });
                    return filtrados.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">Nenhum resultado para os filtros aplicados.</p>
                    ) : filtrados.map((p: any) => (
                      <div key={p.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-400 transition-colors cursor-pointer" onClick={() => setPlanoAulaDetalhes(p)}>
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{p.titulo}</p>
                            <p className="text-sm text-gray-500 mt-0.5">
                              <span className="text-blue-600">{p.professorNome || 'Professor'}</span>
                              {' · '}{p.turmaNome}
                              {' · '}{p.data ? new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                            </p>
                          </div>
                          {isPlanoStatusExibivel(p.status) && (
                            <Badge variant={p.status === 'aplicado' ? 'secondary' : 'default'} className="shrink-0 capitalize text-xs">
                              {labelPlanoStatusExibivel(p.status)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          )}

          {activeSection === 'relatorios-aulas' && (
            <RelatoriosAulasProfessoresSection
              vertente="inclusao"
              title="Relatórios de Aulas — Professores de Inclusão"
              subtitle="Aulas ministradas e registradas pelos professores do programa."
              planos={planosAulaInclusao}
              aulas={aulasRegistradasInclusao}
              loadingPlanos={loadingPlanos}
              loadingAulas={loadingRelatorios}
              onBack={() => { setFiltroProf(""); changeSection("professores"); }}
              fotoSignedUrlBase="/api/coordenador/inclusao/aula"
            />
          )}

          {activeSection === 'frequencias' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Frequência por Turma
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FrequenciaTurmas vertente="inclusao" coordenadorId={coordenadorId} enabled={activeSection === 'frequencias'} />
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'programas' && (
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
                    <CardTitle>Programas de Qualificação</CardTitle>
                    <Button
                      className="bg-green-500 hover:bg-green-600"
                      onClick={() => setShowNovoProgramaModal(true)}
                      data-testid="button-novo-programa"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Programa
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className={filtroStatusPrograma === "todos" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500" : ""} size="sm" onClick={() => setFiltroStatusPrograma("todos")}>Todos</Button>
                    <Button variant="outline" className={filtroStatusPrograma === "ativo" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500" : ""} size="sm" onClick={() => setFiltroStatusPrograma("ativo")}>Em Andamento</Button>
                    <Button variant="outline" className={filtroStatusPrograma === "planejado" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500" : ""} size="sm" onClick={() => setFiltroStatusPrograma("planejado")}>Planejados</Button>
                    <Button variant="outline" className={filtroStatusPrograma === "concluido" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500" : ""} size="sm" onClick={() => setFiltroStatusPrograma("concluido")}>Concluídos</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {isLoadingProgramas ? (
                    <p className="text-center text-gray-500">Carregando programas...</p>
                  ) : programasData.length === 0 ? (
                    <p className="text-center text-gray-500">Nenhum programa cadastrado. Clique em "Novo Programa" para criar.</p>
                  ) : programasData
                    .filter((programa: any) => {
                      if (filtroStatusPrograma === "todos") return true;
                      if (filtroStatusPrograma === "ativo") return programa.status === "ativo" || programa.status === "emandamento" || programa.status === "em_andamento";
                      if (filtroStatusPrograma === "planejado") return programa.status === "planejado" || programa.status === "pendente";
                      if (filtroStatusPrograma === "concluido") return programa.status === "concluido" || programa.status === "finalizado";
                      return programa.status === filtroStatusPrograma;
                    })
                    .sort((a: any, b: any) => {
                      const dataA = a.created_at || a.createdAt || a.data_inicio || "";
                      const dataB = b.created_at || b.createdAt || b.data_inicio || "";
                      return new Date(dataB).getTime() - new Date(dataA).getTime();
                    })
                    .map((programa: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-green-500" />
                            {programa.nome}
                          </h3>
                          <Badge className={getStatusBadgeClass(programa.status)}>
                            {formatarStatus(programa.status)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-500">Categoria:</span>
                            <p className="font-medium">{programa.categoria || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Modalidade:</span>
                            <p className="font-medium capitalize">{programa.modalidade || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Período:</span>
                            <p className="font-medium">
                              {programa.dataInicio && programa.dataFim
                                ? `${formatYmdPtBr(programa.dataInicio)} - ${formatYmdPtBr(programa.dataFim)}`
                                : programa.dataInicio
                                  ? `Início: ${formatYmdPtBr(programa.dataInicio)}`
                                  : 'A definir'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPrograma(programa);
                              setActiveSection('participantes');
                              toast({
                                title: "Visualizando Participantes",
                                description: `Mostrando participantes de ${programa.nome}`
                              });
                            }}
                            data-testid={`button-ver-participantes-${index}`}
                          >
                            <Users className="w-4 h-4 mr-1" />
                            Ver Participantes
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPrograma(programa);
                              setEditProgramaStatus(programa.status?.toLowerCase() || 'planejado');
                              setEditProgramaModalidade(programa.modalidade?.toLowerCase() || 'presencial');
                              setShowEditProgramaModal(true);
                            }}
                            data-testid={`button-editar-${index}`}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPrograma(programa);
                              setShowDetalhesProgramaModal(true);
                            }}
                            data-testid={`button-detalhes-${index}`}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Detalhes
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setProgramaToDelete(programa);
                              setShowExcluirProgramaModal(true);
                            }}
                            data-testid={`button-excluir-${index}`}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'turmas' && (
            <Card>
              <CardHeader className="flex flex-col gap-4">
                <div className="flex flex-row items-center justify-between w-full">
                  <CardTitle>Turmas de Capacitação</CardTitle>
                  <Button
                    className="bg-blue-500 hover:bg-blue-600"
                    onClick={() => setShowNovaTurmaModal(true)}
                    data-testid="button-nova-turma"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Turma
                  </Button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" className={filtroStatusTurma === "todos" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500" : ""} size="sm" onClick={() => setFiltroStatusTurma("todos")}>Todas</Button>
                  <Button variant="outline" className={filtroStatusTurma === "ativo" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500" : ""} size="sm" onClick={() => setFiltroStatusTurma("ativo")}>Em Andamento</Button>
                  <Button variant="outline" className={filtroStatusTurma === "concluido" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500" : ""} size="sm" onClick={() => setFiltroStatusTurma("concluido")}>Concluídas</Button>
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
                <div className="grid gap-4">
                  {isLoadingTurmas ? (
                    <p className="text-center text-gray-500">Carregando turmas...</p>
                  ) : turmasData.length === 0 ? (
                    <p className="text-center text-gray-500">Nenhuma turma cadastrada. Clique em "Nova Turma" para criar.</p>
                  ) : (
                    programasData.map((programa: any) => {
                      const turmasDoPrograma = turmasData
                        .filter((t: any) => {
                          const matchPrograma = t.programaId === programa.id || t.programa_id === programa.id;
                          if (!matchPrograma) return false;
                          const nomeTurma = (t.nome || t.title || '').toLowerCase();
                          if (buscaTurma && !nomeTurma.includes(buscaTurma.toLowerCase())) return false;
                          if (filtroStatusTurma === "todos") return true;
                          const ts = (t.status || '').toLowerCase();
                          if (filtroStatusTurma === "ativo") return ts === "ativo" || ts === "emandamento" || ts === "em_andamento" || ts === "em-andamento";
                          if (filtroStatusTurma === "concluido") return ts === "concluido" || ts === "finalizado";
                          return true;
                        })
                        .sort((a: any, b: any) => {
                          const dataA = a.created_at || a.createdAt || a.data_inicio || "";
                          const dataB = b.created_at || b.createdAt || b.data_inicio || "";
                          return new Date(dataB).getTime() - new Date(dataA).getTime();
                        });
                      if (turmasDoPrograma.length === 0) return null;

                      return (
                        <div key={programa.id} className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50/30">
                          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-purple-700">
                            <BookOpen className="w-5 h-5" />
                            {programa.nome}
                          </h3>
                          <div className="grid gap-3">
                            {turmasDoPrograma.map((turma: any, index: number) => (
                              <div key={turma.id} className="bg-white border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-500" />
                                    {turma.nome}
                                  </h4>
                                  <Badge className={getStatusBadgeClass(turma.status)}>
                                    {formatarStatus(turma.status)}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                                  <div>
                                    <span className="text-gray-500">Código:</span>
                                    <p className="font-medium">{turma.codigo || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Horário:</span>
                                    <p className="font-medium">
                                      {turma.horarioEntrada && turma.horarioSaida
                                        ? `${turma.horarioEntrada} - ${turma.horarioSaida}`
                                        : turma.horario || 'A definir'}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Local:</span>
                                    <p className="font-medium">{turma.local || 'A definir'}</p>
                                  </div>
                                  {(() => {
                                    const ch = calcTurmaCargaHoraria(turma);
                                    if (!ch) return null;
                                    return (
                                      <div>
                                        <span className="text-gray-500">Carga Horária:</span>
                                        <p className="font-medium text-blue-700">
                                          {ch.count} aula{ch.count !== 1 ? "s" : ""} × {ch.duracaoMin / 60 % 1 === 0 ? ch.duracaoMin / 60 : (ch.duracaoMin / 60).toFixed(1)}h = <strong>{ch.totalHoras % 1 === 0 ? ch.totalHoras : ch.totalHoras.toFixed(1)}h</strong>
                                        </p>
                                      </div>
                                    );
                                  })()}
                                </div>
                                {turma.descricao && (
                                  <p className="text-sm text-gray-600 mb-3">{turma.descricao}</p>
                                )}
                                {turma.status === "concluido" && (
                                  <div className="flex items-center gap-2 mb-3 p-2 bg-green-50 rounded-md border border-green-200">
                                    <GraduationCap className="w-4 h-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-700">
                                      Turma Finalizada: {turma.alunosConcluidos || 0} de {turma.totalParticipantes || 0} alunos formados
                                    </span>
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setTurmaSelecionadaParaAlunos({ ...turma, id: Number(turma.id) });
                                      setShowGerenciarAlunosTurmaModal(true);
                                    }}
                                  >
                                    <Users className="w-4 h-4 mr-1" />
                                    Gerenciar Alunos
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                    onClick={() => baixarListaAlunos(turma.id, turma, false)}
                                  >
                                    <FileDown className="w-4 h-4 mr-1" />
                                    Baixar lista
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-teal-300 text-teal-700 hover:bg-teal-50"
                                    onClick={() => {
                                      setTurmaParaVincular(turma);
                                      setShowVincularProfessoresModal(true);
                                    }}
                                  >
                                    <GraduationCap className="w-4 h-4 mr-1" />
                                    Professores
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedTurma(turma);
                                      setShowDetalhesTurmaModal(true);
                                    }}
                                    data-testid={`button-ver-turma-${index}`}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Ver Detalhes
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedTurma(turma);
                                      setEditTurmaStatus(turma.status || 'planejado');
                                      setEditTurmaDiasSemana(turma.diasSemana || turma.dias_semana || []);

                                      // Parsear horário se existir
                                      // Suporta formatos: "14:00 - 17:00" ou "Seg/Qua 13:00 as 18:00"
                                      if (turma.horario) {
                                        // Extrair horas usando regex
                                        const horaRegex = /(\d{1,2}:\d{2})/g;
                                        const horas = turma.horario.match(horaRegex);
                                        if (horas && horas.length >= 2) {
                                          setEditTurmaHoraInicio(horas[0]);
                                          setEditTurmaHoraFim(horas[1]);
                                        } else {
                                          setEditTurmaHoraInicio("");
                                          setEditTurmaHoraFim("");
                                        }
                                      } else {
                                        setEditTurmaHoraInicio("");
                                        setEditTurmaHoraFim("");
                                      }

                                      setShowEditTurmaModal(true);
                                    }}
                                    data-testid={`button-editar-turma-${index}`}
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Editar
                                  </Button>
                                  {turma.status !== "concluido" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-green-600 border-green-600 hover:bg-green-50"
                                      onClick={async () => {
                                        const turmaId = Number(turma.id);

                                        // ✅ Pré-verificação: checar se há chamadas antes de abrir o modal
                                        try {
                                          const resumoResp = await fetch(`/api/turmas-inclusao/${turmaId}/chamadas-resumo`, { credentials: "include" });
                                          const resumo = await resumoResp.json();
                                          if (resumo.count === 0) {
                                            toast({
                                              title: "Não é possível finalizar",
                                              description: `A turma "${turma.nome}" não possui nenhuma chamada registrada. Lance pelo menos uma chamada antes de finalizar.`,
                                              variant: "destructive",
                                            });
                                            return;
                                          }
                                        } catch {
                                          // Se falhar, deixa continuar (o backend vai validar)
                                        }

                                        // ✅ a fonte de verdade do modal é o ID, não o objeto
                                        setTurmaParaFinalizarId(turmaId);

                                        setParticipantesSelecionados([]);
                                        setParticipantesTurmaAtual([]);
                                        setIsLoadingParticipantesTurma(true);

                                        try {
                                          const response = await fetch(`/api/turmas-inclusao/${turmaId}/participantes`, {
                                            credentials: "include",
                                          });

                                          if (!response.ok) {
                                            throw new Error("Não foi possível carregar os participantes");
                                          }

                                          const data = await response.json();

                                          // ✅ inclui "ativo" e "concluido" (turmas antigas têm status concluido nos participantes_turmas)
                                          const ativos = (data || []).filter(
                                            (p: any) => {
                                              const s = String(p?.status || "").toLowerCase();
                                              return s === "ativo" || s === "concluido";
                                            }
                                          );

                                          setParticipantesTurmaAtual(ativos);
                                          setShowFinalizarTurmaModal(true);
                                        } catch (error: any) {
                                          console.error("Erro ao carregar participantes:", error);
                                          toast({
                                            title: "Erro",
                                            description: error?.message || "Erro ao carregar participantes",
                                            variant: "destructive",
                                          });

                                          // se falhar, não abre modal
                                          setTurmaParaFinalizarId(null);
                                          setShowFinalizarTurmaModal(false);
                                        } finally {
                                          setIsLoadingParticipantesTurma(false);
                                        }
                                      }}

                                      data-testid={`button-finalizar-turma-${index}`}
                                    >
                                      <GraduationCap className="w-4 h-4 mr-1" />
                                      Finalizar Turma
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'presenca' && (
            <div className="space-y-4">
            <PresencaInclusaoControl
              turmasData={turmasData || []}
              activeSection={activeSection}
              fetchHistorico={async () => {
                if (!resolvedCoordenadorId) return [];
                const response = await fetch(
                  `/api/coordenador/${resolvedCoordenadorId}/historico-chamadas?vertente=inclusao_produtiva`,
                  { credentials: "include" }
                );
                if (!response.ok) throw new Error('Falha ao carregar histórico');
                return response.json();
              }}
              fetchParticipantes={async (turmaId: string, date?: string) => {
                const dateParam = date ? `?date=${encodeURIComponent(date)}` : '';
                const response = await fetch(`/api/turmas-inclusao/${turmaId}/participantes${dateParam}`, {
                  credentials: "include",
                });
                if (!response.ok) throw new Error('Falha ao carregar alunos');
                return response.json();
              }}
              savePresenca={async (payload) => {
                if (!resolvedCoordenadorId) throw new Error("Coordenador não identificado na sessão.");
                const response = await fetch(`/api/coordenador/${resolvedCoordenadorId}/registro-presenca-inclusao`, {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                if (!response.ok) throw new Error('Falha ao salvar chamada');
                return response.json();
              }}
              editPresenca={async (payload) => {
                const response = await fetch(`/api/presencas-inclusao/editar`, {
                  method: "PUT",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                if (!response.ok) throw new Error('Falha ao atualizar chamada');
                return response.json();
              }}
              uploadFoto={async (formData) => {
                return fetch('/api/presencas-inclusao/foto', {
                  method: 'POST',
                  credentials: 'include',
                  body: formData,
                });
              }}
              historyQueryKey={['/api/coordenador/historico-chamadas-inclusao', coordenadorId]}
              canSolicitarExclusao={true}
              origemManual="coordenador"
            />
            </div>
          )}

          {activeSection === 'excecoes' && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    Remanejamentos e Cancelamentos
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (excecaoTurmaId) setExcecaoTurmaIdModal(excecaoTurmaId);
                      setShowExcecaoModal(true);
                    }}
                  >
                    + Registrar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-1 block">Filtrar por turma</label>
                    <Select value={excecaoTurmaId} onValueChange={setExcecaoTurmaId}>
                      <SelectTrigger className="w-full md:w-72">
                        <SelectValue placeholder="Selecione uma turma..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(turmasData as any[]).map((t: any) => (
                          <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {loadingExcecoesTurma || fetchingExcecoesTurma ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
                      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      Carregando remanejamentos e cancelamentos…
                    </div>
                  ) : excecoesTurma.length === 0 ? (
                    <p className="text-sm text-gray-400 py-2">
                      {excecaoTurmaId
                        ? "Nenhum remanejamento ou cancelamento registrado para esta turma."
                        : "Nenhum remanejamento ou cancelamento registrado."}
                    </p>
                  ) : (
                    <div className="space-y-2 mt-2">
                      {(excecoesTurma as any[]).map((exc: any) => {
                        const ymdOrig = ymdFromCampoExcecao(exc.dataOriginal ?? exc.data_original);
                        const ymdNova = ymdFromCampoExcecao(exc.novaData ?? exc.nova_data);
                        return (
                          <div key={exc.id} className="flex items-start justify-between p-3 border rounded-lg bg-gray-50">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={exc.tipo === 'cancelamento' ? 'destructive' : 'outline'} className="text-xs">
                                  {exc.tipo === 'cancelamento' ? 'Cancelamento' : 'Remanejamento'}
                                </Badge>
                              </div>
                              <div className="text-sm">
                                <span className="font-medium text-gray-700">Turma:</span>{" "}
                                <span className="text-gray-900">{exc.turmaNome || "-"}</span>
                              </div>
                              <div className="text-sm">
                                <span className="font-medium text-gray-700">Data:</span>{" "}
                                <span className="text-gray-900">
                                  {formatarDiaExcecaoPtBr(ymdOrig)}
                                  {exc.tipo === 'remanejamento' && ymdNova ? (
                                    <span className="text-gray-500"> → {formatarDiaExcecaoPtBr(ymdNova)}</span>
                                  ) : null}
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="font-medium text-gray-700">Motivo:</span>{" "}
                                <span className="text-gray-900">{exc.motivo || "-"}</span>
                              </div>
                            </div>
                            <button
                              className="text-gray-400 hover:text-red-500 ml-2 mt-0.5"
                              onClick={() => {
                                setExcecaoParaExcluir(exc);
                                setConfirmExcluirExcecaoOpen(true);
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )
                  }
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'acompanhamento' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-500" />
                  Acompanhamento Individual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Filtros */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <Input
                        placeholder="Buscar por nome ou CPF..."
                        className="w-full"
                        value={searchAcompanhamento}
                        onChange={(e) => setSearchAcompanhamento(e.target.value)}
                        data-testid="input-search-acompanhamento"
                      />
                    </div>
                    <Select defaultValue="todos">
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os Status</SelectItem>
                        <SelectItem value="ativo">Ativos</SelectItem>
                        <SelectItem value="pendente">Pendentes</SelectItem>
                        <SelectItem value="concluido">Concluídos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Lista de Acompanhamentos - DADOS REAIS */}
                  <div className="grid gap-4">
                    {participantesData.length > 0 ? participantesData
                      .filter((participante: any) => {
                        if (!searchAcompanhamento.trim()) return true;
                        const termo = searchAcompanhamento.toLowerCase();
                        return (participante.nome || '').toLowerCase().includes(termo) || (participante.cpf || '').includes(searchAcompanhamento);
                      })
                      .slice(0, 10).map((participante: any) => {
                        // Buscar turmas e programas do participante
                        const turmasParticipante = participante.turmas || [];
                        const programasParticipante = turmasParticipante
                          .map((t: any) => programasData.find((p: any) => p.id === t.programaId))
                          .filter(Boolean);

                        return (
                          <div key={participante.id} className="border rounded-lg p-4 bg-white dark:bg-gray-800">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-500" />
                                {participante.nome}
                              </h3>
                              <Badge variant="outline">
                                {turmasParticipante.length} {turmasParticipante.length === 1 ? 'turma' : 'turmas'}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Programas:</p>
                                <p className="font-medium">
                                  {programasParticipante.length > 0
                                    ? programasParticipante.map((p: any) => p.nome).join(', ')
                                    : 'Não vinculado'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Idade:</p>
                                <p className="font-medium">{(participante.idade && participante.idade > 0 && participante.idade < 150) ? `${participante.idade} anos` : 'Não informado'}</p>
                              </div>
                            </div>

                            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                              <p className="text-sm text-blue-700 dark:text-blue-400 mb-1">
                                Sistema de acompanhamento em desenvolvimento
                              </p>
                              <p className="text-xs text-blue-600 dark:text-blue-500">
                                Progresso, frequência e observações serão implementados em breve
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedParticipante(participante);
                                  setShowDetalhesParticipanteModal(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver Detalhes
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedParticipante(participante);
                                  setShowEditParticipanteModal(true);
                                }}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Editar
                              </Button>
                            </div>
                          </div>
                        );
                      }) : (
                      <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                        <UserCheck className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p>Nenhum participante cadastrado ainda.</p>
                        <p className="text-sm mt-2">Adicione participantes na seção "Participantes".</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


          {activeSection === 'monitoramento' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-red-500" />
                  Monitoramento e Indicadores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Filtros do Dashboard */}
                  <div className="flex flex-wrap gap-2 items-center bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 shrink-0">Filtrar:</span>
                    <select
                      className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                      value={dashFiltroPrograma}
                      onChange={(e) => setDashFiltroPrograma(e.target.value)}
                    >
                      <option value="">Todos os programas</option>
                      {programasData.map((p: any) => (
                        <option key={p.id} value={String(p.id)}>{p.nome}</option>
                      ))}
                    </select>
                    <select
                      className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                      value={dashFiltroTurma}
                      onChange={(e) => setDashFiltroTurma(e.target.value)}
                    >
                      <option value="">Todas as turmas</option>
                      {turmasData.map((t: any) => (
                        <option key={t.id} value={String(t.id)}>{t.nome}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dashSemFormatura}
                        onChange={(e) => setDashSemFormatura(e.target.checked)}
                        className="rounded"
                      />
                      Sem formatura
                    </label>
                    {(dashFiltroPrograma || dashFiltroTurma || dashSemFormatura) && (
                      <button
                        onClick={() => { setDashFiltroPrograma(""); setDashFiltroTurma(""); setDashSemFormatura(false); }}
                        className="text-xs text-red-500 hover:underline ml-auto"
                      >
                        Limpar filtros
                      </button>
                    )}
                  </div>

                  {/* Métricas Principais - DADOS REAIS */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            {dashSemFormatura ? "Sem Formatura" : "Total Participantes"}
                          </p>
                          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                            {dashSemFormatura
                              ? participantesData.filter((p: any) => p.status !== "formado" && p.status !== "concluido").length
                              : participantesData.filter((p: any) =>
                                (!dashFiltroPrograma || String(p.programaId) === dashFiltroPrograma)
                              ).length
                            }
                          </p>
                          {dashSemFormatura && (
                            <p className="text-xs text-blue-500 mt-1">status ≠ formado</p>
                          )}
                        </div>
                        <Users className="w-8 h-8 text-blue-500" />
                      </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600 dark:text-green-400">Programas Ativos</p>
                          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                            {programasData.filter((p: any) => p.status === 'ativo').length}
                          </p>
                        </div>
                        <BookOpen className="w-8 h-8 text-green-500" />
                      </div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600 dark:text-purple-400">Turmas em Andamento</p>
                          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                            {turmasData.filter((t: any) => t.status === 'ativo').length}
                          </p>
                        </div>
                        <GraduationCap className="w-8 h-8 text-purple-500" />
                      </div>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-orange-600 dark:text-orange-400">Atividades Registradas</p>
                          <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                            {turmasData.filter((t: any) => t.status === 'ativo').length}
                          </p>
                        </div>
                        <Briefcase className="w-8 h-8 text-orange-500" />
                      </div>
                    </div>

                    <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-teal-600 dark:text-teal-400">Alunos</p>
                          <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                            {dashboardDemografico?.alunosAtivos ?? participantesData.filter((p: any) => p.status === 'ativo').length}
                          </p>
                          <p className="text-xs text-teal-500 dark:text-teal-400 mt-1">
                            cadastrados e ativos
                          </p>
                        </div>
                        <Users className="w-8 h-8 text-teal-500" />
                      </div>
                    </div>

                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-indigo-600 dark:text-indigo-400">Atendidos</p>
                          <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                            {dashboardDemografico?.atendimentos ?? 0}
                          </p>
                          <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-1">
                            vínculos aluno-turma
                          </p>
                        </div>
                        <Activity className="w-8 h-8 text-indigo-500" />
                      </div>
                    </div>
                  </div>

                  {/* Distribuição por Gênero - DADOS REAIS */}
                  <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Distribuição por Gênero</h3>
                    <div className="space-y-3">
                      {(() => {
                        const generos = participantesData.reduce((acc: any, p: any) => {
                          const raw = (p.genero || '').trim();
                          const genero = raw ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase() : 'Não informado';
                          acc[genero] = (acc[genero] || 0) + 1;
                          return acc;
                        }, {});
                        const total = participantesData.length || 1;

                        return Object.entries(generos).map(([genero, count]: [string, any]) => {
                          const percentage = ((count / total) * 100).toFixed(1);
                          return (
                            <div key={genero}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium">{genero}</span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">{count} ({percentage}%)</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-purple-500 h-2 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Faixa Etária - DADOS REAIS */}
                  <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Distribuição por Faixa Etária</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(() => {
                        const faixas = {
                          '15-20': 0,
                          '21-30': 0,
                          '31-40': 0,
                          '41+': 0
                        };

                        participantesData.forEach((p: any) => {
                          const idade = p.idade;
                          if (idade >= 15 && idade <= 20) faixas['15-20']++;
                          else if (idade >= 21 && idade <= 30) faixas['21-30']++;
                          else if (idade >= 31 && idade <= 40) faixas['31-40']++;
                          else if (idade >= 41) faixas['41+']++;
                        });

                        return Object.entries(faixas).map(([faixa, count]) => (
                          <div key={faixa} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{faixa} anos</p>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Indicadores Futuros - PLACEHOLDER */}
                  <div className="bg-gray-50 dark:bg-gray-800 border-2 border-dashed rounded-lg p-6">
                    <h3 className="font-semibold mb-3 text-gray-600 dark:text-gray-400">
                      📊 Indicadores em Desenvolvimento
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                      Os seguintes indicadores serão implementados conforme dados de acompanhamento forem coletados:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-white dark:bg-gray-700 rounded border">
                        <p className="text-sm font-medium text-gray-400">Taxa de Conclusão</p>
                        <p className="text-xs text-gray-400">Em breve</p>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-700 rounded border">
                        <p className="text-sm font-medium text-gray-400">Empregabilidade</p>
                        <p className="text-xs text-gray-400">Em breve</p>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-700 rounded border">
                        <p className="text-sm font-medium text-gray-400">Satisfação Média</p>
                        <p className="text-xs text-gray-400">Em breve</p>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-700 rounded border">
                        <p className="text-sm font-medium text-gray-400">Taxa de Retenção</p>
                        <p className="text-xs text-gray-400">Em breve</p>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-700 rounded border">
                        <p className="text-sm font-medium text-gray-400">Frequência</p>
                        <p className="text-xs text-gray-400">Em breve</p>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-700 rounded border">
                        <p className="text-sm font-medium text-gray-400">Taxa de Evasão</p>
                        <p className="text-xs text-gray-400">Em breve</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'resultados' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Resultados e Impacto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Resumo de Resultados - DADOS REAIS E PLACEHOLDER */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg">
                      <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">Pessoas Beneficiadas</h3>
                      <p className="text-3xl font-bold text-green-900 dark:text-green-200">{participantesData.length}</p>
                      <p className="text-sm text-green-700 dark:text-green-400">Total de participantes cadastrados</p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg opacity-60">
                      <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Empregos Gerados</h3>
                      <p className="text-3xl font-bold text-blue-900 dark:text-blue-200">-</p>
                      <p className="text-sm text-blue-700 dark:text-blue-400">Dados em desenvolvimento</p>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg opacity-60">
                      <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Renda Média</h3>
                      <p className="text-3xl font-bold text-purple-900 dark:text-purple-200">-</p>
                      <p className="text-sm text-purple-700 dark:text-purple-400">Dados em desenvolvimento</p>
                    </div>
                  </div>

                  {/* Dados por Programa - DADOS REAIS */}
                  <div>
                    <h3 className="font-semibold mb-4">Visão por Programa</h3>
                    <div className="space-y-4">
                      {programasData.map((programa: any) => {
                        const turmasPrograma = turmasData.filter((t: any) => t.programaId === programa.id);

                        const participantesPrograma = participantesData.filter((p: any) =>
                          p.turmas?.some((t: any) => turmasPrograma.some((tp: any) => tp.id === t.id))
                        );

                        return (
                          <div key={programa.id} className="border rounded-lg p-4 bg-white dark:bg-gray-800">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-lg">{programa.nome}</h4>
                              <Badge className={getStatusBadgeClass(programa.status)}>
                                {formatarStatus(programa.status)}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Participantes</p>
                                <p className="text-2xl font-bold">{participantesPrograma.length}</p>
                              </div>
                              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Turmas</p>
                                <p className="text-2xl font-bold">{turmasPrograma.length}</p>
                              </div>
                              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded opacity-60">
                                <p className="text-sm text-gray-400">Empregabilidade</p>
                                <p className="text-xl font-bold text-gray-400">Em breve</p>
                              </div>
                            </div>

                            {programa.descricao && (
                              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{programa.descricao}</p>
                            )}
                          </div>
                        );
                      })}

                      {programasData.length === 0 && (
                        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                          <p>Nenhum programa cadastrado ainda.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Indicadores de Resultado Futuros - PLACEHOLDER */}
                  <div className="bg-gray-50 dark:bg-gray-800 border-2 border-dashed rounded-lg p-6">
                    <h3 className="font-semibold mb-3 text-gray-600 dark:text-gray-400">
                      📈 Indicadores de Resultado em Desenvolvimento
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                      Os seguintes dados serão implementados conforme sistema de acompanhamento for desenvolvido:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white dark:bg-gray-700 rounded border">
                        <h4 className="font-medium text-gray-400 mb-2">Empregabilidade por Programa</h4>
                        <p className="text-xs text-gray-400">Rastreamento de inserção no mercado de trabalho</p>
                      </div>
                      <div className="p-4 bg-white dark:bg-gray-700 rounded border">
                        <h4 className="font-medium text-gray-400 mb-2">Taxa de Conclusão</h4>
                        <p className="text-xs text-gray-400">Acompanhamento de conclusão</p>
                      </div>
                      <div className="p-4 bg-white dark:bg-gray-700 rounded border">
                        <h4 className="font-medium text-gray-400 mb-2">Evolução Mensal</h4>
                        <p className="text-xs text-gray-400">Histórico de resultados mês a mês</p>
                      </div>
                      <div className="p-4 bg-white dark:bg-gray-700 rounded border">
                        <h4 className="font-medium text-gray-400 mb-2">Depoimentos e Avaliações</h4>
                        <p className="text-xs text-gray-400">Feedback de participantes e empregadores</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


          {activeSection === 'relatorios' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    Relatórios Gerenciais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RelatoriosPanel vertente="inclusao" />
                </CardContent>
              </Card>

              {/* ── Relatório de Turma ──────────────────────────────────────── */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileDown className="w-5 h-5 text-emerald-600" />
                    Relatório de Turma
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    {/* Seleção de turma — combobox com busca */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Turma</label>
                      <Popover open={relTurmaOpen} onOpenChange={setRelTurmaOpen}>
                        <PopoverTrigger asChild>
                          <button
                            className="group w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm hover:bg-accent hover:text-white focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <span className={relTurmaId ? 'text-foreground group-hover:text-white' : 'text-muted-foreground group-hover:text-white'}>
                              {relTurmaId
                                ? (turmasData as any[]).find((t: any) => String(t.id) === relTurmaId)?.nome ?? 'Turma não encontrada'
                                : 'Selecione ou busque uma turma…'}
                            </span>
                            <ChevronsUpDown className="w-4 h-4 ml-2 shrink-0 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Buscar turma…"
                              value={relTurmaBusca}
                              onValueChange={setRelTurmaBusca}
                            />
                            <CommandList>
                              <CommandEmpty>Nenhuma turma encontrada.</CommandEmpty>
                              <CommandGroup>
                                {(turmasData as any[])
                                  .filter((t: any) =>
                                    !relTurmaBusca || t.nome?.toLowerCase().includes(relTurmaBusca.toLowerCase())
                                  )
                                  .map((t: any) => (
                                    <CommandItem
                                      key={t.id}
                                      value={t.nome}
                                      onSelect={() => {
                                        const v = String(t.id);
                                        setRelTurmaId(v);
                                        if (relTipo === 'geral') {
                                          if (t.dataInicio) setRelDataInicio(t.dataInicio.slice(0, 10));
                                          if (t.dataFim) setRelDataFim(t.dataFim.slice(0, 10));
                                        }
                                        setRelTurmaOpen(false);
                                        setRelTurmaBusca('');
                                      }}
                                    >
                                      <Check className={cn('w-4 h-4 mr-2', relTurmaId === String(t.id) ? 'opacity-100' : 'opacity-0')} />
                                      {t.nome}
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Tipo de relatório */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Tipo de Relatório</label>
                      <div className="flex gap-3">
                        {(['mensal', 'geral'] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setRelTipo(t)}
                            className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${relTipo === t
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400'
                              }`}
                          >
                            {t === 'mensal' ? 'Mensal' : 'Geral (Período Completo)'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Período */}
                    {relTipo === 'mensal' ? (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Mês / Ano</label>
                        <Input
                          type="month"
                          value={relMes}
                          onChange={(e) => setRelMes(e.target.value)}
                          className="w-48"
                        />
                      </div>
                    ) : (
                      <div className="flex gap-4 flex-wrap">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-700">Data início</label>
                          <Input
                            type="date"
                            value={relDataInicio}
                            onChange={(e) => setRelDataInicio(e.target.value)}
                            className="w-44"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-700">Data fim</label>
                          <Input
                            type="date"
                            value={relDataFim}
                            onChange={(e) => setRelDataFim(e.target.value)}
                            className="w-44"
                          />
                        </div>
                      </div>
                    )}

                    {/* Botão gerar */}
                    <Button
                      disabled={relLoading || !relTurmaId || (relTipo === 'geral' && (!relDataInicio || !relDataFim))}
                      onClick={async () => {
                        if (!relTurmaId) return;
                        let dI: string, dF: string;
                        if (relTipo === 'mensal') {
                          const [ano, mes] = relMes.split('-').map(Number);
                          dI = `${ano}-${String(mes).padStart(2, '0')}-01`;
                          const ultimo = new Date(ano, mes, 0).getDate();
                          dF = `${ano}-${String(mes).padStart(2, '0')}-${ultimo}`;
                        } else {
                          dI = relDataInicio;
                          dF = relDataFim;
                        }
                        setRelLoading(true);
                        try {
                          const resp = await fetch(
                            `/api/turmas-inclusao/${relTurmaId}/relatorio-turma?dataInicio=${dI}&dataFim=${dF}`,
                            { credentials: 'include' }
                          );
                          if (!resp.ok) throw new Error((await resp.json()).error || 'Erro na API');
                          const dados: RelatorioDados = await resp.json();
                          await gerarRelatorioTurma(dados, relTipo, dI, dF);
                        } catch (err: any) {
                          toast({ title: 'Erro ao gerar relatório', description: err.message || 'Tente novamente.', variant: 'destructive' });
                        } finally {
                          setRelLoading(false);
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {relLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Gerando PDF…
                        </>
                      ) : (
                        <>
                          <FileDown className="w-4 h-4 mr-2" />
                          Gerar PDF
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-gray-400">
                      O PDF inclui: dados da turma, frequência por aula, lista de inscritos, evasão, alimentação, NPS e galeria de fotos.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'aprovacoes' && (
            <AprovacoesSemana />
          )}

          {activeSection === 'geracao-renda' && (
            <GeracaoRendaSection />
          )}

          {activeSection === 'nps' && (
            <NpsPesquisasSection programa="inclusao" />
          )}

          {activeSection === 'eventos-grito' && (
            <EventosGritoSection defaultTab="eventos" showStats={false} />
          )}


          {activeSection === 'configuracoes' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-500" />
                  Meu Perfil e Configurações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <PushNotificationSettings variant="panel" />
                  <LgpdMeusDadosSettingsPanel />
                  {/* Informações do Perfil */}
                  <div>
                    <h3 className="font-semibold mb-4">Informações do Perfil</h3>
                    <div className="grid gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{userName}</h4>
                          <p className="text-gray-600">Coordenador de Inclusão Produtiva</p>
                          <Badge className="mt-1 bg-green-100 text-green-800">COORDENADOR_INCLUSAO</Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowEditFotoModal(true)}
                          data-testid="button-editar-foto"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar Foto
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Nome Completo</label>
                          <Input
                            value={perfilNome}
                            onChange={(e) => setPerfilNome(e.target.value)}
                            data-testid="input-perfil-nome"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Email</label>
                          <Input
                            value={perfilEmail}
                            onChange={(e) => setPerfilEmail(e.target.value)}
                            type="email"
                            data-testid="input-perfil-email"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Telefone</label>
                          <Input
                            value={perfilTelefone}
                            onChange={(e) => setPerfilTelefone(e.target.value)}
                            placeholder="(11) 99999-9999"
                            data-testid="input-perfil-telefone"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Formação</label>
                          <Input
                            value={perfilRamal}
                            onChange={(e) => setPerfilRamal(e.target.value)}
                            placeholder="Ex: Psicologia, Pedagogia"
                            data-testid="input-perfil-formacao"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preferências do Sistema */}
                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4">Preferências do Sistema</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Notificações por Email</p>
                          <p className="text-sm text-gray-600">Receber relatórios e alertas por email</p>
                        </div>
                        <Checkbox defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Relatórios Automáticos</p>
                          <p className="text-sm text-gray-600">Geração automática de relatórios mensais</p>
                        </div>
                        <Checkbox defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Notificações de Novos Participantes</p>
                          <p className="text-sm text-gray-600">Alertas quando novos participantes se inscrevem</p>
                        </div>
                        <Checkbox defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Alertas de Evasão</p>
                          <p className="text-sm text-gray-600">Notificações quando participantes faltam por 3+ dias</p>
                        </div>
                        <Checkbox defaultChecked />
                      </div>
                    </div>
                  </div>

                  {/* Segurança */}
                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4">Segurança</h3>
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setShowAlterarSenhaModal(true)}
                        data-testid="button-alterar-senha"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Alterar Senha
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setShowHistoricoAcessosModal(true)}
                        data-testid="button-historico-acessos"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Histórico de Acessos
                      </Button>
                    </div>
                  </div>

                  {/* Informações do Sistema */}
                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4">Informações do Sistema</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Versão do Sistema:</span>
                        <span className="font-medium">2.1.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Último Login:</span>
                        <span className="font-medium">26/09/2025 às 14:30</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nível de Acesso:</span>
                        <Badge className="bg-green-100 text-green-800">Coordenador</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ID do Usuário:</span>
                        <span className="font-medium font-mono text-sm">{userId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="border-t pt-6">
                    <div className="flex gap-3">
                      <Button
                        className="bg-green-500 hover:bg-green-600"
                        onClick={async () => {
                          if (!coordenadorId) {
                            toast({
                              title: "Erro",
                              description: "ID do coordenador não encontrado.",
                              variant: "destructive"
                            });
                            return;
                          }

                          setSalvandoPerfil(true);

                          try {
                            const response = await fetch(`/api/coordenadores/${coordenadorId}/profile`, {
                              method: 'PATCH',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                nome: perfilNome,
                                email: perfilEmail,
                                telefone: perfilTelefone,
                                formacao: perfilRamal,
                              }),
                            });

                            if (!response.ok) {
                              const error = await response.json();
                              throw new Error(error.error || 'Erro ao salvar perfil');
                            }

                            await refetchPerfil();

                            toast({
                              title: "Sucesso!",
                              description: "Alterações salvas com sucesso.",
                            });
                          } catch (error: any) {
                            console.error("Erro ao salvar perfil:", error);
                            toast({
                              title: "Erro",
                              description: error.message || "Erro ao salvar alterações.",
                              variant: "destructive"
                            });
                          } finally {
                            setSalvandoPerfil(false);
                          }
                        }}
                        disabled={salvandoPerfil}
                        data-testid="button-salvar-alteracoes"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {salvandoPerfil ? "Salvando..." : "Salvar Alterações"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          refetchPerfil();
                          toast({
                            description: "Alterações canceladas.",
                          });
                        }}
                        disabled={salvandoPerfil}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modal de Editar Programa */}
        <Dialog open={showEditProgramaModal} onOpenChange={setShowEditProgramaModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Programa de Qualificação</DialogTitle>
            </DialogHeader>
            {selectedPrograma && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome do Programa</label>
                    <Input id="edit-programa-nome" defaultValue={selectedPrograma.nome} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Modalidade</label>
                    <Select value={editProgramaModalidade} onValueChange={setEditProgramaModalidade}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="presencial">Presencial</SelectItem>
                        <SelectItem value="ead">EAD</SelectItem>
                        <SelectItem value="híbrido">Híbrido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Duração</label>
                    <Input id="edit-programa-duracao" defaultValue={selectedPrograma.duracao} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Vagas</label>
                    <Input id="edit-programa-vagas" type="number" defaultValue={selectedPrograma.numeroVagas} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Data de Início</label>
                    <Input id="edit-programa-data-inicio" type="date" defaultValue={selectedPrograma.dataInicio || ''} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Data de Conclusão</label>
                    <Input id="edit-programa-data-fim" type="date" defaultValue={selectedPrograma.dataFim || ''} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <Select value={editProgramaStatus} onValueChange={setEditProgramaStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planejado">Planejado</SelectItem>
                      <SelectItem value="em_andamento">Em andamento</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Descrição</label>
                  <Textarea
                    id="edit-programa-descricao"
                    placeholder="Descrição detalhada do programa..."
                    rows={4}
                    defaultValue={selectedPrograma.descricao}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    className="bg-green-500 hover:bg-green-600"
                    onClick={async () => {
                      try {
                        const nome = (document.getElementById('edit-programa-nome') as HTMLInputElement)?.value;
                        const duracao = (document.getElementById('edit-programa-duracao') as HTMLInputElement)?.value;
                        const numeroVagas = parseInt((document.getElementById('edit-programa-vagas') as HTMLInputElement)?.value || '0');
                        const descricao = (document.getElementById('edit-programa-descricao') as HTMLTextAreaElement)?.value;
                        const dataInicio = (document.getElementById('edit-programa-data-inicio') as HTMLInputElement)?.value || null;
                        const dataFim = (document.getElementById('edit-programa-data-fim') as HTMLInputElement)?.value || null;

                        const response = await fetch(`/api/programas-inclusao/${selectedPrograma.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            nome,
                            modalidade: editProgramaModalidade,
                            duracao,
                            numeroVagas,
                            status: editProgramaStatus,
                            descricao,
                            dataInicio,
                            dataFim
                          })
                        });

                        if (response.ok) {
                          toast({
                            title: "Programa atualizado!",
                            description: `${nome} foi atualizado com sucesso.`
                          });
                          setShowEditProgramaModal(false);
                          queryClient.invalidateQueries({ queryKey: ['/api/programas-inclusao'] });
                        } else {
                          throw new Error('Erro ao atualizar programa');
                        }
                      } catch (error) {
                        toast({
                          title: "Erro",
                          description: "Não foi possível atualizar o programa.",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </Button>
                  <Button variant="outline" onClick={() => setShowEditProgramaModal(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Detalhes do Programa */}
        <Dialog open={showDetalhesProgramaModal} onOpenChange={setShowDetalhesProgramaModal}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Programa</DialogTitle>
            </DialogHeader>
            {selectedPrograma && (
              <div className="space-y-6">
                {/* Informações Gerais */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-green-600" />
                      {selectedPrograma.nome}
                    </h3>
                    <Badge className={getStatusBadgeClass(selectedPrograma.status)}>{formatarStatus(selectedPrograma.status)}</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Categoria</p>
                      <p className="font-medium capitalize">{selectedPrograma.categoria || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Modalidade</p>
                      <p className="font-medium capitalize">{selectedPrograma.modalidade || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Período</p>
                      <p className="font-medium">
                        {selectedPrograma.dataInicio && selectedPrograma.dataFim
                          ? `${formatYmdPtBr(selectedPrograma.dataInicio)} - ${formatYmdPtBr(selectedPrograma.dataFim)}`
                          : selectedPrograma.dataInicio
                            ? `Início: ${formatYmdPtBr(selectedPrograma.dataInicio)}`
                            : 'A definir'}
                      </p>
                    </div>
                  </div>
                  {selectedPrograma.descricao && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">Descrição</p>
                      <p className="font-medium">{selectedPrograma.descricao}</p>
                    </div>
                  )}
                </div>

                {/* Estatísticas das Turmas */}
                {(() => {
                  const turmasDoPrograma = turmasData?.filter((t: any) =>
                    t.programaId === selectedPrograma.id || t.programa_id === selectedPrograma.id
                  ) || [];

                  const totalTurmas = turmasDoPrograma.length;
                  const turmasAtivas = turmasDoPrograma.filter((t: any) => t.status === 'em_andamento' || t.status === 'ativo').length;
                  const frequenciaMedia = turmasDoPrograma.length > 0
                    ? Math.round(turmasDoPrograma.reduce((acc: number, t: any) => acc + (t.frequencia || t.frequenciaMedia || 0), 0) / turmasDoPrograma.length)
                    : 0;

                  return totalTurmas > 0 ? (
                    <div>
                      <h4 className="font-semibold mb-3">Turmas do Programa</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="border rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-blue-600">{totalTurmas}</p>
                          <p className="text-sm text-gray-600">Turmas</p>
                        </div>
                        <div className="border rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-green-600">{turmasAtivas}</p>
                          <p className="text-sm text-gray-600">Ativas</p>
                        </div>
                        <div className="border rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-orange-600">{frequenciaMedia}%</p>
                          <p className="text-sm text-gray-600">Frequência Média</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      <p>Nenhuma turma cadastrada neste programa</p>
                    </div>
                  );
                })()}

                {/* Ações */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    className="bg-blue-500 hover:bg-blue-600"
                    onClick={() => {
                      setShowDetalhesProgramaModal(false);
                      setSelectedPrograma(selectedPrograma);
                      setActiveSection('participantes');
                    }}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Ver Participantes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditProgramaStatus(selectedPrograma?.status?.toLowerCase() || 'planejado');
                      setEditProgramaModalidade(selectedPrograma?.modalidade?.toLowerCase() || 'presencial');
                      setShowDetalhesProgramaModal(false);
                      setShowEditProgramaModal(true);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Programa
                  </Button>
                  <Button variant="outline" onClick={() => setShowDetalhesProgramaModal(false)}>
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Detalhes da Turma */}
        <Dialog open={showDetalhesTurmaModal} onOpenChange={setShowDetalhesTurmaModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Turma</DialogTitle>
            </DialogHeader>
            {selectedTurma && (
              <div className="space-y-6">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{selectedTurma.nome}</h3>
                    <Badge className={
                      (selectedTurma.status === 'concluido' || selectedTurma.status === 'finalizado')
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-blue-500 text-white border border-blue-600'
                    }>
                      {formatarStatus(selectedTurma.status)}
                    </Badge>
                  </div>
                  {selectedTurma.descricao && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedTurma.descricao}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Código</p>
                    <p className="font-semibold">{selectedTurma.codigo || 'Não definido'}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Programa</p>
                    <p className="font-semibold">{selectedTurma.programaNome || (programasData as any[]).find((p: any) => p.id === selectedTurma.programaId)?.nome || 'Não vinculado'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Datas e Horários</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Data Início</p>
                      <p className="font-semibold">
                        {selectedTurma.dataInicio
                          ? formatYmdPtBr(selectedTurma.dataInicio)
                          : 'Não definida'}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Data Fim</p>
                      <p className="font-semibold">
                        {selectedTurma.dataFim
                          ? formatYmdPtBr(selectedTurma.dataFim)
                          : 'Não definida'}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Horário</p>
                      <p className="font-semibold">{selectedTurma.horario || 'Não definido'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Local</p>
                      <p className="font-semibold">{selectedTurma.local || 'Não definido'}</p>
                    </div>
                  </div>
                  {(selectedTurma.diasSemana && selectedTurma.diasSemana.length > 0) && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mt-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Dias da Semana</p>
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
                  {(() => {
                    const ch = calcTurmaCargaHoraria(selectedTurma);
                    if (!ch) return null;
                    return (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg mt-4 flex items-start gap-2">
                        <BookOpen className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-green-800 dark:text-green-300">Carga Horária Total</p>
                          <p className="text-sm text-green-700 dark:text-green-400">
                            {ch.count} aula{ch.count !== 1 ? "s" : ""} × {ch.duracaoMin / 60 % 1 === 0 ? ch.duracaoMin / 60 : (ch.duracaoMin / 60).toFixed(1)}h por aula = <strong>{ch.totalHoras % 1 === 0 ? ch.totalHoras : ch.totalHoras.toFixed(1)}h no total</strong>
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {selectedTurma.observacoes && (
                  <div>
                    <h4 className="font-semibold mb-2">Observações</h4>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm">{selectedTurma.observacoes}</p>
                    </div>
                  </div>
                )}

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

        {/* Modal de Editar Parceiro */}
        <Dialog open={showEditParceiroModal} onOpenChange={setShowEditParceiroModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Parceiro</DialogTitle>
            </DialogHeader>
            {selectedParceiro && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome da Empresa</label>
                  <Input defaultValue={selectedParceiro.nome} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipo</label>
                    <Select defaultValue={selectedParceiro.tipo?.toLowerCase()}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contratante">Contratante</SelectItem>
                        <SelectItem value="patrocinador">Patrocinador</SelectItem>
                        <SelectItem value="fornecedor">Fornecedor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <Select defaultValue={selectedParceiro.status?.toLowerCase()}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="parceiro">Parceiro</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Área de Atuação</label>
                  <Input defaultValue={selectedParceiro.area} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Contato (E-mail)</label>
                    <Input type="email" defaultValue={selectedParceiro.contato} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Telefone</label>
                    <Input defaultValue={selectedParceiro.telefone} />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    className="bg-orange-500 hover:bg-orange-600"
                    onClick={() => {
                      toast({
                        title: "Parceiro atualizado!",
                        description: `${selectedParceiro.nome} foi atualizado com sucesso.`
                      });
                      setShowEditParceiroModal(false);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </Button>
                  <Button variant="outline" onClick={() => setShowEditParceiroModal(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Histórico */}
        <Dialog open={showHistoricoModal} onOpenChange={setShowHistoricoModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Histórico de Contratações</DialogTitle>
            </DialogHeader>
            {selectedParceiro && (
              <div className="space-y-6">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{selectedParceiro.nome}</h3>
                  <p className="text-sm text-gray-600">{selectedParceiro.area}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-500" />
                    Histórico de Contratações
                  </h4>
                  <div className="text-center py-8 border-2 border-dashed rounded-lg bg-gray-50 dark:bg-gray-800">
                    <Users className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Sistema de acompanhamento de contratações em desenvolvimento
                    </p>
                  </div>
                </div>

                {/* Preservando estrutura do modal para futuro uso */}
                <div className="hidden">
                  <div className="space-y-2">
                    {[].map((pessoa: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{pessoa.nome}</span>
                          </div>
                          <div className="text-sm text-gray-600">{pessoa.cargo}</div>
                          <div className="text-sm text-gray-600">Desde {pessoa.contratacao}</div>
                        </div>
                        <Badge variant={pessoa.status === 'ativo' ? 'default' : 'outline'}>{formatarStatus(pessoa.status)}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Estatísticas</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Contratados</p>
                      <p className="font-semibold">{selectedParceiro.contratados}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Vagas Abertas</p>
                      <p className="font-semibold">{selectedParceiro.vagas}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Taxa de Retenção</p>
                      <p className="font-semibold">75%</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    className="bg-orange-500 hover:bg-orange-600"
                    onClick={() => {
                      toast({
                        title: "Relatório exportado",
                        description: "O histórico foi exportado com sucesso."
                      });
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Histórico
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowHistoricoModal(false);
                      setShowEditParceiroModal(true);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Parceiro
                  </Button>
                  <Button variant="outline" onClick={() => setShowHistoricoModal(false)}>
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Novo Programa */}
        <Dialog open={showNovoProgramaModal} onOpenChange={setShowNovoProgramaModal}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Programa de Qualificação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome do Programa</label>
                <Input placeholder="Ex: Auxiliar Administrativo" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Modalidade</label>
                <Select value={createProgramaModalidade} onValueChange={setCreateProgramaModalidade}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="hibrido">Híbrido</SelectItem>
                    <SelectItem value="ead">EAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Data de Início</label>
                  <Input id="create-programa-data-inicio" type="date" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data de Conclusão</label>
                  <Input id="create-programa-data-fim" type="date" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select value={createProgramaStatus} onValueChange={setCreateProgramaStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planejado">Planejado</SelectItem>
                    <SelectItem value="em_andamento">Em andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <Textarea
                  placeholder="Descreva o programa e seus objetivos..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  className="bg-green-500 hover:bg-green-600"
                  onClick={async () => {
                    try {
                      const formData = {
                        nome: document.querySelector<HTMLInputElement>('input[placeholder="Ex: Auxiliar Administrativo"]')?.value,
                        modalidade: createProgramaModalidade,
                        dataInicio: (document.getElementById('create-programa-data-inicio') as HTMLInputElement)?.value || null,
                        dataFim: (document.getElementById('create-programa-data-fim') as HTMLInputElement)?.value || null,
                        status: createProgramaStatus,
                        categoria: 'profissionalizante',
                        descricao: document.querySelector<HTMLTextAreaElement>('textarea')?.value
                      };

                      const response = await fetch('/api/programas-inclusao', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                      });

                      if (response.ok) {
                        toast({
                          title: "Programa criado!",
                          description: "O novo programa foi criado com sucesso."
                        });
                        setShowNovoProgramaModal(false);
                        queryClient.invalidateQueries({ queryKey: ['/api/programas-inclusao'] });
                      } else {
                        throw new Error('Erro ao criar programa');
                      }
                    } catch (error) {
                      toast({
                        title: "Erro",
                        description: "Não foi possível criar o programa.",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Criar Programa
                </Button>
                <Button variant="outline" onClick={() => setShowNovoProgramaModal(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Nova Turma - Componente Reutilizável */}
        <TurmaInclusaoForm
          open={showNovaTurmaModal}
          onClose={() => setShowNovaTurmaModal(false)}
        />

        <TurmaDetailModalInclusao
          open={showGerenciarAlunosTurmaModal}
          onOpenChange={setShowGerenciarAlunosTurmaModal}
          turma={turmaSelecionadaParaAlunos}
        />

        {/* Modal de Editar Turma */}
        <TurmaInclusaoForm
          open={showEditTurmaModal}
          onClose={() => {
            setShowEditTurmaModal(false);
            setSelectedTurma(null);
          }}
          turma={selectedTurma}
        />

        {/* Modal de Editar Foto de Perfil */}
        <Dialog open={showEditFotoModal} onOpenChange={setShowEditFotoModal}>
          <DialogContent className="max-w-md w-[95vw]">
            <DialogHeader>
              <DialogTitle>Editar Foto de Perfil</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4 py-6">
              <ProfileImageUploader
                userId={Number(userId)}
                size="lg"
                onUploadSuccess={() => {
                  setTimeout(() => {
                    setShowEditFotoModal(false);
                  }, 1000);
                }}
              />
              <p className="text-sm text-gray-600 text-center">
                Clique na foto para fazer upload.<br />
                Formatos aceitos: JPG, PNG (máx. 5MB)
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Histórico de Acessos */}
        <Dialog open={showHistoricoAcessosModal} onOpenChange={setShowHistoricoAcessosModal}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-500" />
                Histórico de Acessos
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Usuário:</strong> {userName} (ID: {userId})
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Perfil:</strong> Coordenador de Inclusão Produtiva
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Acessos Recentes</h4>
                <div className="space-y-2">
                  {[
                    { data: "14/11/2024 12:40", ip: "186.215.xxx.xxx", navegador: "Chrome", acao: "Login realizado", status: "sucesso" },
                    { data: "14/11/2024 08:15", ip: "186.215.xxx.xxx", navegador: "Chrome", acao: "Login realizado", status: "sucesso" },
                    { data: "13/11/2024 16:23", ip: "186.215.xxx.xxx", navegador: "Chrome", acao: "Logout", status: "sucesso" },
                    { data: "13/11/2024 09:05", ip: "186.215.xxx.xxx", navegador: "Chrome", acao: "Login realizado", status: "sucesso" },
                    { data: "12/11/2024 14:45", ip: "186.215.xxx.xxx", navegador: "Chrome", acao: "Login realizado", status: "sucesso" },
                    { data: "12/11/2024 10:12", ip: "186.215.xxx.xxx", navegador: "Chrome", acao: "Login realizado", status: "sucesso" },
                    { data: "11/11/2024 15:30", ip: "186.215.xxx.xxx", navegador: "Firefox", acao: "Login realizado", status: "sucesso" },
                  ].map((acesso, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{acesso.data}</span>
                          <span className="text-xs text-gray-500">{acesso.ip} • {acesso.navegador}</span>
                        </div>
                        <div className="text-sm text-gray-600">{acesso.acao}</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">{acesso.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Estatísticas</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-1">Total de Acessos</p>
                    <p className="text-2xl font-semibold text-green-600">247</p>
                    <p className="text-xs text-gray-500 mt-1">Últimos 30 dias</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-1">Último Acesso</p>
                    <p className="text-lg font-semibold">Hoje</p>
                    <p className="text-xs text-gray-500 mt-1">12:40</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-1">Dispositivos</p>
                    <p className="text-2xl font-semibold text-green-600">2</p>
                    <p className="text-xs text-gray-500 mt-1">Ativos</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => {
                    toast({
                      title: "Relatório exportado",
                      description: "O histórico de acessos foi exportado com sucesso."
                    });
                  }}
                  data-testid="button-exportar-historico"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Histórico
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowHistoricoAcessosModal(false)}
                  data-testid="button-fechar-historico"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Confirmação de Exclusão */}
        <Dialog open={showExcluirProgramaModal} onOpenChange={(open) => {
          setShowExcluirProgramaModal(open);
          if (!open) {
            setProgramaToDelete(null);
          }
        }}>
          <DialogContent className="max-w-md w-[95vw]">
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
            </DialogHeader>
            {programaToDelete && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Tem certeza que deseja excluir o programa <strong>{programaToDelete.nome}</strong>?
                  {' Todos os dados associados também serão removidos.'}
                  {' '}Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-3 pt-4">
                  <Button
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => {
                      deleteProgramaMutation.mutate(programaToDelete.id);
                    }}
                    disabled={deleteProgramaMutation.isPending}
                    data-testid="button-confirmar-exclusao"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleteProgramaMutation.isPending ? 'Excluindo...' : 'Sim, Excluir'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowExcluirProgramaModal(false);
                      setProgramaToDelete(null);
                    }}
                    disabled={deleteProgramaMutation.isPending}
                    data-testid="button-cancelar-exclusao"
                  >
                    Cancelar
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
                Finalizar Turma: {turmaParaFinalizar?.nome || "—"}
              </DialogTitle>
              <DialogDescription>
                Selecione os participantes que concluíram o curso com certificado.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {isLoadingParticipantesTurma ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : participantesTurmaAtual.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhum participante ativo nesta turma.</p>
                </div>
              ) : (
                <>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Pesquisar participante..."
                      value={buscaParticipante}
                      onChange={(e) => setBuscaParticipante(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">
                      {participantesSelecionados.length} de {participantesTurmaAtual.length} selecionados
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (participantesSelecionados.length === participantesTurmaAtual.length) {
                          setParticipantesSelecionados([]);
                        } else {
                          setParticipantesSelecionados(
                            participantesTurmaAtual.map((p: any) => Number(p.id || p.participante_id))
                          );
                        }
                      }}
                    >
                      {participantesSelecionados.length === participantesTurmaAtual.length ? "Desmarcar Todos" : "Selecionar Todos"}
                    </Button>
                  </div>
                  <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                    {[...participantesTurmaAtual]
                      .sort((a: any, b: any) => (a.nome || "").localeCompare(b.nome || "", 'pt-BR'))
                      .filter((p: any) =>
                        String(p?.nome || "")
                          .toLowerCase()
                          .includes(String(buscaParticipante || "").toLowerCase())
                      )
                      .map((participante: any) => {
                        const pid = Number(participante.id || participante.participante_id);

                        return (
                          <label
                            key={pid}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={participantesSelecionados.includes(pid)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setParticipantesSelecionados((prev) => [...prev, pid]);
                                } else {
                                  setParticipantesSelecionados((prev) => prev.filter((id) => id !== pid));
                                }
                              }}
                              className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <div className="flex-1">
                              <p className="font-medium">{participante.nome}</p>
                              {participante.cpf && (
                                <p className="text-sm text-gray-500">CPF: {formatCPF(participante.cpf)}</p>
                              )}
                            </div>
                            {participantesSelecionados.includes(pid) && (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                          </label>
                        );
                      })}
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowFinalizarTurmaModal(false);
                    setParticipantesSelecionados([]);
                    setParticipantesTurmaAtual([]);
                    setBuscaParticipante("");
                  }}
                  disabled={isFinalizando}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 flex-1"
                  disabled={
                    finalizarTurmaMutation.isPending ||
                    participantesTurmaAtual.length === 0 ||
                    !turmaParaFinalizarId
                  }
                  onClick={handleConfirmarFinalizacaoTurma}
                >
                  {finalizarTurmaMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Finalizando...</>
                  ) : (
                    <><GraduationCap className="w-4 h-4 mr-2" /> Finalizar Turma ({participantesSelecionados.length} concluídos)</>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <AlterarSenha
          open={showAlterarSenhaModal}
          onOpenChange={setShowAlterarSenhaModal}
        />

        {/* Modal: Planos de Aula dos Professores de Inclusão */}
        {turmaParaVincular && (
          <VincularProfessoresTurma
            turmaId={turmaParaVincular.id}
            turmaTipo="inclusao"
            programa="inclusao_produtiva"
            open={showVincularProfessoresModal}
            onOpenChange={setShowVincularProfessoresModal}
            turmaNome={turmaParaVincular.nome}
          />
        )}

        {/* Modal: Editar Remanejamento / Cancelamento de Aula */}
        <Dialog open={excecaoEditModal} onOpenChange={(open) => {
          setExcecaoEditModal(open);
          if (!open) setExcecaoEditando(null);
        }}>
          <DialogContent className="max-w-md w-[95vw]">
            <DialogHeader>
              <DialogTitle>
                Editar {excecaoEditando?.tipo === 'cancelamento' ? 'Cancelamento' : 'Remanejamento'}
              </DialogTitle>
              <DialogDescription>
                {excecaoEditando?.tipo === 'cancelamento'
                  ? 'Altere a data da aula cancelada ou o motivo.'
                  : 'Altere a nova data da aula remanejada ou o motivo. As presenças serão movidas automaticamente.'}
              </DialogDescription>
            </DialogHeader>
            {excecaoEditando && (
              <div className="space-y-4 py-2">
                {excecaoEditando.tipo === 'cancelamento' ? (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Data da aula cancelada <span className="text-red-500">*</span></label>
                    <Input type="date" value={editDataOriginal} onChange={e => setEditDataOriginal(e.target.value)} />
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Nova data da aula <span className="text-red-500">*</span></label>
                    <Input type="date" value={editNovaData} onChange={e => setEditNovaData(e.target.value)} />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium mb-1 block">Motivo <span className="text-red-500">*</span></label>
                  <Textarea
                    value={editMotivo}
                    onChange={e => setEditMotivo(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter className="flex justify-between">
              <Button
                variant="destructive"
                size="sm"
                disabled={editLoading}
                onClick={() => {
                  setExcecaoParaExcluir(excecaoEditando);
                  setConfirmExcluirExcecaoOpen(true);
                }}
              >
                Excluir
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setExcecaoEditModal(false)}>Cancelar</Button>
                <Button
                  disabled={editLoading || !editMotivo || (excecaoEditando?.tipo === 'remanejamento' ? !editNovaData : !editDataOriginal)}
                  onClick={async () => {
                    setEditLoading(true);
                    try {
                      const body: any = { motivo: editMotivo };
                      if (excecaoEditando.tipo === 'remanejamento') body.novaData = editNovaData;
                      else body.dataOriginal = editDataOriginal;
                      const r = await fetch(`/api/turmas-inclusao/excecoes/${excecaoEditando.id}`, {
                        method: 'PATCH',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body),
                      });
                      if (!r.ok) throw new Error();
                      toast({ title: "Salvo com sucesso!" });
                      setExcecaoEditModal(false);
                      refetchExcecoes();
                    } catch {
                      toast({ title: "Erro ao salvar", variant: "destructive" });
                    } finally {
                      setEditLoading(false);
                    }
                  }}
                >
                  {editLoading ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal: Registrar Remanejamento / Cancelamento de Aula */}
        <Dialog open={showExcecaoModal} onOpenChange={(open) => {
          setShowExcecaoModal(open);
          if (!open) {
            setExcecaoTurmaIdModal("");
            setExcecaoTipo("cancelamento");
            setExcecaoDataOriginal("");
            setExcecaoMotivo("");
            setExcecaoNovaData("");
          }
        }}>
          <DialogContent className="max-w-md w-[95vw]">
            <DialogHeader>
              <DialogTitle>Remanejar ou Cancelar Aula</DialogTitle>
              <DialogDescription>
                Registre uma ocorrência pontual em uma turma sem alterar o calendário recorrente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium mb-1 block">Turma <span className="text-red-500">*</span></label>
                <Popover open={excecaoTurmaPopoverOpen} onOpenChange={setExcecaoTurmaPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={excecaoTurmaPopoverOpen}
                      className="w-full justify-between"
                    >
                      {excecaoTurmaIdModal
                        ? turmasAtivasExcecao.find((t: any) => String(t.id) === excecaoTurmaIdModal)?.nome || "Selecione a turma..."
                        : "Selecione a turma ativa..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent portalled={false} className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Pesquisar turma..." />
                      <CommandList>
                        <CommandEmpty>Nenhuma turma ativa encontrada.</CommandEmpty>
                        <CommandGroup>
                          {turmasAtivasExcecao.map((t: any) => (
                            <CommandItem
                              key={t.id}
                              value={`${t.nome} ${t.codigo || ""}`}
                              onSelect={() => {
                                setExcecaoTurmaIdModal(String(t.id));
                                setExcecaoDataOriginal("");
                                setExcecaoTurmaPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  excecaoTurmaIdModal === String(t.id) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {t.nome}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Aula afetada <span className="text-red-500">*</span></label>
                {!excecaoTurmaIdModal ? (
                  <p className="text-sm text-gray-400 italic">Selecione uma turma primeiro</p>
                ) : (excecaoDiasAula as any).dias?.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Nenhuma aula encontrada para esta turma</p>
                ) : (
                  <Popover open={excecaoDataOpenSection} onOpenChange={setExcecaoDataOpenSection}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                        {excecaoDataOriginal
                          ? new Date(excecaoDataOriginal + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
                          : "Selecione o dia da aula..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" style={{ minWidth: '320px' }}>
                      <Command>
                        <CommandInput placeholder="Pesquisar por data... (ex: 25/04)" />
                        <CommandEmpty>Nenhuma data encontrada.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-y-auto">
                          {((excecaoDiasAula as any).dias || []).map((data: string) => {
                            const label = new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
                            return (
                              <CommandItem
                                key={data}
                                value={label}
                                onSelect={() => { setExcecaoDataOriginal(data); setExcecaoDataOpenSection(false); }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", excecaoDataOriginal === data ? "opacity-100" : "opacity-0")} />
                                {label}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tipo <span className="text-red-500">*</span></label>
                <Select value={excecaoTipo} onValueChange={(v) => setExcecaoTipo(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cancelamento">Cancelamento</SelectItem>
                    <SelectItem value="remanejamento">Remanejamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {excecaoTipo === "remanejamento" && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Nova data da aula <span className="text-red-500">*</span></label>
                  <Input type="date" value={excecaoNovaData} onChange={e => setExcecaoNovaData(e.target.value)} />
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-1 block">Motivo <span className="text-red-500">*</span></label>
                <Textarea
                  placeholder="Explique o motivo do cancelamento ou remanejamento..."
                  value={excecaoMotivo}
                  onChange={e => setExcecaoMotivo(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExcecaoModal(false)}>Cancelar</Button>
              <Button
                disabled={excecaoLoading || !excecaoTurmaIdModal || !excecaoDataOriginal || !excecaoMotivo || (excecaoTipo === "remanejamento" && !excecaoNovaData)}
                onClick={async () => {
                  setExcecaoLoading(true);
                  try {
                    const r = await fetch(`/api/turmas-inclusao/${excecaoTurmaIdModal}/excecao`, {
                      method: "POST",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        dataOriginal: excecaoDataOriginal,
                        tipo: excecaoTipo,
                        motivo: excecaoMotivo,
                        novaData: excecaoTipo === "remanejamento" ? excecaoNovaData : undefined,
                      }),
                    });
                    if (!r.ok) throw new Error("Falha ao salvar");
                    toast({ title: "Registrado com sucesso!", description: `${excecaoTipo === "cancelamento" ? "Cancelamento" : "Remanejamento"} salvo.` });
                    if (excecaoTurmaIdModal) setExcecaoTurmaId(excecaoTurmaIdModal);
                    setShowExcecaoModal(false);
                    queryClient.invalidateQueries({ queryKey: ['/api/turmas-inclusao/excecoes', excecaoTurmaIdModal] });
                    setExcecaoTurmaIdModal("");
                    setExcecaoDataOriginal("");
                    setExcecaoMotivo("");
                    setExcecaoNovaData("");
                    refetchExcecoes();
                  } catch {
                    toast({ title: "Erro ao salvar", variant: "destructive" });
                  } finally {
                    setExcecaoLoading(false);
                  }
                }}
              >
                {excecaoLoading ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={confirmExcluirExcecaoOpen}
          onOpenChange={(open) => {
            setConfirmExcluirExcecaoOpen(open);
            if (!open) setExcecaoParaExcluir(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir registro</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover este registro de remanejamento/cancelamento? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={async (e) => {
                  e.preventDefault();
                  await excluirExcecao();
                }}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}