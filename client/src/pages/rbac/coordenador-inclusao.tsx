import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
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
  FileDown
} from "lucide-react";
import { ProfileImageUploader } from "@/components/ProfileImageUploader";
import AlterarSenha from "@/components/AlterarSenha";
import { ComprehensiveStudentForm } from "@/components/comprehensive-student-form";
import { TurmaInclusaoForm } from "@/components/TurmaInclusaoForm";
import { getDiasAulaParaTurma, type DiaAula } from "@/lib/class-days";
import { GeracaoRendaSection } from "@/components/GeracaoRendaSection";
import PresencaInclusaoControl from "@/components/presenca/PresencaInclusaoControl";
import FrequenciaTurmas from "@/components/FrequenciaTurmas";
import AprovacoesSemana from "@/components/presenca/AprovacoesSemana";
import CoordenadorDashboard from "@/components/CoordenadorDashboard";
import ParticipantesInclusaoSection from "@/components/ParticipantesInclusaoSection";
import GerenciarProfessores from "@/components/GerenciarProfessores";
import { TurmaDetailModalInclusao } from "@/components/inclusao/TurmaDetailModalInclusao";
import { baixarListaAlunos } from "@/lib/pdfUtils";
import VincularProfessoresTurma from "@/components/VincularProfessoresTurma";

// Helper para formatar status
const formatarStatus = (status: string | null | undefined): string => {
  if (!status) return 'Planejado';
  
  const statusMap: Record<string, string> = {
    'emandamento': 'Em andamento',
    'em_andamento': 'Em andamento',
    'em-andamento': 'Em andamento',
    'planejado': 'Planejado',
    'ativo': 'Ativo',
    'concluido': 'Concluído',
    'cancelado': 'Cancelado',
    'inativo': 'Inativo'
  };
  
  return statusMap[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

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
  const [, setLocation] = useLocation();
  const { toast } = useToast();
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
  const userId = Number(localStorage.getItem("userId") || localStorage.getItem("coordenadorId") || 0);
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
  const [dashFiltroMes, setDashFiltroMes] = useState(0);
  const [showDetalhesTurmaModal, setShowDetalhesTurmaModal] = useState(false);
  const [showEditParceiroModal, setShowEditParceiroModal] = useState(false);
  const [showHistoricoModal, setShowHistoricoModal] = useState(false);
  const [selectedParceiro, setSelectedParceiro] = useState<any>(null);
  const [showNovoProgramaModal, setShowNovoProgramaModal] = useState(false);
  const [showNovaTurmaModal, setShowNovaTurmaModal] = useState(false);
  const [desligarModal, setDesligarModal] = useState<{ participanteId: number; turmaId: number; nome: string } | null>(null);
  const [dashFiltroTurma, setDashFiltroTurma] = useState<string>("");
  const [dashFiltroPrograma, setDashFiltroPrograma] = useState<string>("");
  const [dashSemFormatura, setDashSemFormatura] = useState(false);
  const [desligarMotivo, setDesligarMotivo] = useState("");
  const [desligarLoading, setDesligarLoading] = useState(false);
  const [selectedTurma, setSelectedTurma] = useState<any>(null);
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
  const [relatorioAulaDetalhes, setRelatorioAulaDetalhes] = useState<any>(null);
  const [filtroProf, setFiltroProf] = useState("");
  
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
  const [novaTurmaStatus, setNovaTurmaStatus] = useState<string>("planejado");
  const [novaTurmaDataInicio, setNovaTurmaDataInicio] = useState<Date | undefined>(undefined);
  const [novaTurmaDataFim, setNovaTurmaDataFim] = useState<Date | undefined>(undefined);
  const [novaTurmaHoraInicio, setNovaTurmaHoraInicio] = useState<string>("");
  const [novaTurmaHoraFim, setNovaTurmaHoraFim] = useState<string>("");
  const [editTurmaStatus, setEditTurmaStatus] = useState<string>("planejado");
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

    const authId = String(coordenadorId ?? userId ?? "");
    const headers: Record<string, string> = {};
    if (authId && authId !== "0") headers["x-user-id"] = authId;
    const resp = await fetch("/api/inclusao/import/preview", {
      method: "POST",
      body: formData,
      credentials: "include",
      headers,
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
    const authId = String(coordenadorId ?? userId ?? "");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (authId && authId !== "0") headers["x-user-id"] = authId;
    const resp = await fetch("/api/inclusao/import/commit", {
      method: "POST",
      credentials: "include",
      headers,
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
    queryKey: ['/api/coordenadores', coordenadorId, 'profile'],
    queryFn: async () => {
      const response = await fetch(`/api/coordenadores/${coordenadorId}/profile`, {
        credentials: "include",
      });
      if (!response.ok) return null;

      const data = await response.json();
      setPerfilNome(data.nome || "");
      setPerfilEmail(data.email || "");
      setPerfilTelefone(data.telefone || "");
      setPerfilRamal(data.formacao || "");
      return data;
    },
    enabled: !!coordenadorId,
  });
  // Query para buscar dados do dashboard do coordenador
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/coordenador/dashboard', 'inclusao'],
    queryFn: async () => {
      const response = await fetch(`/api/coordenador/dashboard?area=inclusao`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error('Falha ao carregar dados do painel');

      const json = await response.json();

      // ✅ Pega do backend e salva no state
      if (json?.coordenadorId) setCoordenadorId(Number(json.coordenadorId));

      return json;
    },
    // ✅ NÃO trava com localStorage
  });

  const { data: dashboardDemografico, isLoading: loadingDemografico } = useQuery<any>({
    queryKey: ['/api/coordenador/dashboard-demografico-inclusao', dashFiltroAno, dashFiltroMes],
    queryFn: async () => {
      const authId = String(coordenadorId ?? userId ?? "");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (authId && authId !== "0") headers["x-user-id"] = authId;
      const params = new URLSearchParams();
      if (dashFiltroAno) params.set('ano', String(dashFiltroAno));
      if (dashFiltroMes) params.set('mes', String(dashFiltroMes));
      const qs = params.toString();
      const url = '/api/coordenador/dashboard-demografico-inclusao' + (qs ? `?${qs}` : '');
      const response = await fetch(url, {
        credentials: "include",
        headers,
      });
      if (!response.ok) throw new Error('Falha ao carregar dados demográficos');
      return response.json();
    },
    enabled: !!coordenadorId || !!userId,
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

  const turmaParaFinalizar = turmasData?.find((t: any) => Number(t.id) === Number(turmaParaFinalizarId));

  // Query para buscar participantes do banco de dados
  const { data: participantesData = [], isLoading: isLoadingParticipantes } = useQuery({
    queryKey: ['/api/participantes-inclusao'],
    queryFn: async () => {
      const response = await fetch('/api/participantes-inclusao', { credentials: "include" });
      if (!response.ok) throw new Error('Falha ao carregar participantes');
      return response.json();
    },
    
  });

  const { data: presençasData } = useQuery({
    queryKey: ['/api/inclusao/presenças', 2026],
    queryFn: async () => {
      const response = await fetch('/api/inclusao/presenças?ano=2026', { credentials: "include" });
      if (!response.ok) throw new Error('Falha ao carregar presenças');
      return response.json();
    },
  });

  // Queries para planos de aula e aulas registradas (visão coordenador)
  const { data: planosAulaInclusao = [], isLoading: loadingPlanos, refetch: refetchPlanos } = useQuery({
    queryKey: ['/api/coordenador/inclusao/planos-aula'],
    queryFn: async () => {
      const r = await fetch('/api/coordenador/inclusao/planos-aula', { credentials: 'include' });
      if (!r.ok) throw new Error('Falha ao carregar planos de aula');
      return r.json();
    },
    enabled: activeSection === 'planos-aula',
  });

  const { data: aulasRegistradasInclusao = [], isLoading: loadingRelatorios, refetch: refetchRelatorios } = useQuery({
    queryKey: ['/api/coordenador/inclusao/aulas-registradas'],
    queryFn: async () => {
      const r = await fetch('/api/coordenador/inclusao/aulas-registradas', { credentials: 'include' });
      if (!r.ok) throw new Error('Falha ao carregar relatórios de aulas');
      return r.json();
    },
    enabled: activeSection === 'relatorios-aulas',
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

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
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
                          variant={previewFiltro === "todos" ? "default" : "outline"}
                          onClick={() => { setPreviewFiltro("todos"); setPreviewPage(0); }}
                        >
                          Todos ({previewData.participantes.length})
                        </Button>
                        <Button
                          size="sm"
                          variant={previewFiltro === "validos" ? "default" : "outline"}
                          onClick={() => { setPreviewFiltro("validos"); setPreviewPage(0); }}
                          className={previewFiltro === "validos" ? "bg-green-500 hover:bg-green-600" : ""}
                        >
                          Válidos ({previewData.stats?.participantes?.valid ?? 0})
                        </Button>
                        <Button
                          size="sm"
                          variant={previewFiltro === "invalidos" ? "default" : "outline"}
                          onClick={() => { setPreviewFiltro("invalidos"); setPreviewPage(0); }}
                          className={previewFiltro === "invalidos" ? "bg-red-500 hover:bg-red-600 text-white" : ""}
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
          <div className="flex items-center gap-3">
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
              onClick={() => window.open('https://complaint-tracker-OGRITO.replit.app', '_blank')}
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
        {/* Navegação de Cards */}
        <CoordenadorDashboard
          data={dashboardDemografico ? { ...dashboardDemografico, presenças: presençasData?.total ?? 0 } : undefined}
          isLoading={loadingDemografico}
          filtroAno={dashFiltroAno}
          filtroMes={dashFiltroMes}
          onFilterChange={(ano, mes) => {
            setDashFiltroAno(ano);
            setDashFiltroMes(mes);
          }}
          tipo="inclusao"
          metaGeracaoRenda={metasInclusao?.metas?.geracaoRenda ?? 1500}
          metaFormados={metasInclusao?.metas?.alunosFormados ?? 2000}
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
                  className="w-full" 
                  variant={activeSection === 'participantes' ? 'default' : 'outline'}
                  data-testid="button-participantes"
                  onClick={() => changeSection('participantes')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Participantes
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'acompanhamento' ? 'default' : 'outline'}
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
                  className="w-full" 
                  variant={activeSection === 'programas' ? 'default' : 'outline'}
                  data-testid="button-programas"
                  onClick={() => changeSection('programas')}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Programas
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'turmas' ? 'default' : 'outline'}
                  data-testid="button-turmas"
                  onClick={() => changeSection('turmas')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Turmas
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'geracao-renda' ? 'default' : 'outline'}
                  onClick={() => changeSection('geracao-renda')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Geração de Renda
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'presenca' ? 'default' : 'outline'}
                  data-testid="button-chamadas"
                  onClick={() => changeSection('presenca')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Chamadas
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
                  className="w-full" 
                  variant={activeSection === 'frequencias' ? 'default' : 'outline'}
                  data-testid="button-frequencias"
                  onClick={() => changeSection('frequencias')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Ver Frequências
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'monitoramento' ? 'default' : 'outline'}
                  data-testid="button-monitoramento"
                  onClick={() => changeSection('monitoramento')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Monitoramento
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'resultados' ? 'default' : 'outline'}
                  data-testid="button-resultados"
                  onClick={() => changeSection('resultados')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Resultados
                </Button>
                <Button
                  className="w-full"
                  variant={activeSection === 'aprovacoes' ? 'default' : 'outline'}
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
                  className="w-full" 
                  variant={activeSection === 'professores' ? 'default' : 'outline'}
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
                  onClick={() => { setFiltroProf(""); setRelatorioAulaDetalhes(null); changeSection('relatorios-aulas'); }}
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
                  className="w-full" 
                  variant={activeSection === 'relatorios' ? 'default' : 'outline'}
                  data-testid="button-relatorios"
                  onClick={() => changeSection('relatorios')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Relatórios
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'configuracoes' ? 'default' : 'outline'}
                  data-testid="button-perfil"
                  onClick={() => changeSection('configuracoes')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Meu Perfil
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
            <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-teal-400" />
                  <div>
                    <h2 className="text-xl font-semibold text-white">Planos de Aula — Professores de Inclusão</h2>
                    <p className="text-slate-400 text-sm">Visualize todos os planos de aula registrados pelos professores do programa.</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => changeSection('professores')} className="border-slate-600 text-slate-300 hover:bg-slate-800">
                  ← Voltar
                </Button>
              </div>
              <Input
                placeholder="Filtrar por professor ou título..."
                value={filtroProf}
                onChange={e => setFiltroProf(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
              />
              {loadingPlanos ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
                </div>
              ) : planosAulaInclusao.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>Nenhum plano de aula registrado ainda.</p>
                </div>
              ) : planoAulaDetalhes ? (
                <div className="space-y-4">
                  <Button variant="outline" size="sm" onClick={() => setPlanoAulaDetalhes(null)} className="border-slate-600 text-slate-300 hover:bg-slate-800">
                    ← Voltar para a lista
                  </Button>
                  <div className="bg-slate-800 rounded-lg p-5 space-y-3 border border-slate-600">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="text-lg font-semibold text-white">{planoAulaDetalhes.titulo}</h3>
                      <Badge variant={planoAulaDetalhes.status === 'aprovado' ? 'default' : planoAulaDetalhes.status === 'aplicado' ? 'secondary' : 'outline'} className="capitalize">
                        {planoAulaDetalhes.status || 'rascunho'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-slate-400">Professor:</span> <span className="text-white font-medium">{planoAulaDetalhes.professorNome || '—'}</span></div>
                      <div><span className="text-slate-400">Turma:</span> <span className="text-white">{planoAulaDetalhes.turmaNome}</span></div>
                      <div><span className="text-slate-400">Data:</span> <span className="text-white">{planoAulaDetalhes.data ? new Date(planoAulaDetalhes.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</span></div>
                      {planoAulaDetalhes.duracaoMinutos && <div><span className="text-slate-400">Duração:</span> <span className="text-white">{planoAulaDetalhes.duracaoMinutos} min</span></div>}
                    </div>
                    <div><p className="text-slate-400 text-sm font-medium mb-1">Objetivos</p><p className="text-slate-200 text-sm whitespace-pre-wrap">{planoAulaDetalhes.objetivos}</p></div>
                    <div><p className="text-slate-400 text-sm font-medium mb-1">Conteúdo</p><p className="text-slate-200 text-sm whitespace-pre-wrap">{planoAulaDetalhes.conteudo}</p></div>
                    <div><p className="text-slate-400 text-sm font-medium mb-1">Metodologia</p><p className="text-slate-200 text-sm whitespace-pre-wrap">{planoAulaDetalhes.metodologia}</p></div>
                    {planoAulaDetalhes.recursos && <div><p className="text-slate-400 text-sm font-medium mb-1">Recursos</p><p className="text-slate-200 text-sm whitespace-pre-wrap">{planoAulaDetalhes.recursos}</p></div>}
                    {planoAulaDetalhes.avaliacao && <div><p className="text-slate-400 text-sm font-medium mb-1">Avaliação</p><p className="text-slate-200 text-sm whitespace-pre-wrap">{planoAulaDetalhes.avaliacao}</p></div>}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {planosAulaInclusao
                    .filter((p: any) =>
                      !filtroProf ||
                      (p.professorNome || '').toLowerCase().includes(filtroProf.toLowerCase()) ||
                      (p.titulo || '').toLowerCase().includes(filtroProf.toLowerCase())
                    )
                    .map((p: any) => (
                      <div key={p.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-teal-500 transition-colors cursor-pointer" onClick={() => setPlanoAulaDetalhes(p)}>
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{p.titulo}</p>
                            <p className="text-sm text-slate-400 mt-0.5">
                              <span className="text-teal-400">{p.professorNome || 'Professor'}</span>
                              {' · '}{p.turmaNome}
                              {' · '}{p.data ? new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                            </p>
                          </div>
                          <Badge variant={p.status === 'aprovado' ? 'default' : p.status === 'aplicado' ? 'secondary' : 'outline'} className="shrink-0 capitalize text-xs">
                            {p.status || 'rascunho'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  {planosAulaInclusao.filter((p: any) =>
                    !filtroProf ||
                    (p.professorNome || '').toLowerCase().includes(filtroProf.toLowerCase()) ||
                    (p.titulo || '').toLowerCase().includes(filtroProf.toLowerCase())
                  ).length === 0 && (
                    <p className="text-center text-slate-400 py-4">Nenhum resultado para o filtro aplicado.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeSection === 'relatorios-aulas' && (
            <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ClipboardList className="w-6 h-6 text-teal-400" />
                  <div>
                    <h2 className="text-xl font-semibold text-white">Relatórios de Aulas — Professores de Inclusão</h2>
                    <p className="text-slate-400 text-sm">Aulas ministradas e registradas pelos professores do programa.</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => changeSection('professores')} className="border-slate-600 text-slate-300 hover:bg-slate-800">
                  ← Voltar
                </Button>
              </div>
              <Input
                placeholder="Filtrar por professor ou título..."
                value={filtroProf}
                onChange={e => setFiltroProf(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
              />
              {loadingRelatorios ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
                </div>
              ) : aulasRegistradasInclusao.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>Nenhuma aula registrada ainda.</p>
                </div>
              ) : relatorioAulaDetalhes ? (
                <div className="space-y-4">
                  <Button variant="outline" size="sm" onClick={() => setRelatorioAulaDetalhes(null)} className="border-slate-600 text-slate-300 hover:bg-slate-800">
                    ← Voltar para a lista
                  </Button>
                  <div className="bg-slate-800 rounded-lg p-5 space-y-3 border border-slate-600">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="text-lg font-semibold text-white">{relatorioAulaDetalhes.titulo}</h3>
                      <Badge variant={relatorioAulaDetalhes.statusAula === 'ministrada' ? 'default' : 'secondary'} className="capitalize">
                        {relatorioAulaDetalhes.statusAula || 'ministrada'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-slate-400">Professor:</span> <span className="text-white font-medium">{relatorioAulaDetalhes.professorNome || '—'}</span></div>
                      <div><span className="text-slate-400">Turma:</span> <span className="text-white">{relatorioAulaDetalhes.turmaNome}</span></div>
                      <div><span className="text-slate-400">Data:</span> <span className="text-white">{relatorioAulaDetalhes.data ? new Date(relatorioAulaDetalhes.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</span></div>
                      {relatorioAulaDetalhes.duracaoMinutos && <div><span className="text-slate-400">Duração:</span> <span className="text-white">{relatorioAulaDetalhes.duracaoMinutos} min</span></div>}
                    </div>
                    <div><p className="text-slate-400 text-sm font-medium mb-1">Conteúdo Ministrado</p><p className="text-slate-200 text-sm whitespace-pre-wrap">{relatorioAulaDetalhes.conteudoMinistrado}</p></div>
                    {relatorioAulaDetalhes.competenciasTrabalhas && <div><p className="text-slate-400 text-sm font-medium mb-1">Competências Trabalhadas</p><p className="text-slate-200 text-sm whitespace-pre-wrap">{relatorioAulaDetalhes.competenciasTrabalhas}</p></div>}
                    {relatorioAulaDetalhes.observacoes && <div><p className="text-slate-400 text-sm font-medium mb-1">Observações</p><p className="text-slate-200 text-sm whitespace-pre-wrap">{relatorioAulaDetalhes.observacoes}</p></div>}
                    {relatorioAulaDetalhes.fotoComprovante && (
                      <div>
                        <p className="text-slate-400 text-sm font-medium mb-2">Foto Comprovante</p>
                        <img src={relatorioAulaDetalhes.fotoComprovante} alt="Foto comprovante" className="rounded-lg max-h-48 object-cover border border-slate-600" />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {aulasRegistradasInclusao
                    .filter((a: any) =>
                      !filtroProf ||
                      (a.professorNome || '').toLowerCase().includes(filtroProf.toLowerCase()) ||
                      (a.titulo || '').toLowerCase().includes(filtroProf.toLowerCase())
                    )
                    .map((a: any) => (
                      <div key={a.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-teal-500 transition-colors cursor-pointer" onClick={() => setRelatorioAulaDetalhes(a)}>
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{a.titulo}</p>
                            <p className="text-sm text-slate-400 mt-0.5">
                              <span className="text-teal-400">{a.professorNome || 'Professor'}</span>
                              {' · '}{a.turmaNome}
                              {' · '}{a.data ? new Date(a.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                              {a.fotoComprovante && <span className="ml-2 text-green-400">· 📷 com foto</span>}
                            </p>
                          </div>
                          <Badge variant={a.statusAula === 'ministrada' ? 'default' : 'secondary'} className="shrink-0 capitalize text-xs">
                            {a.statusAula || 'ministrada'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  {aulasRegistradasInclusao.filter((a: any) =>
                    !filtroProf ||
                    (a.professorNome || '').toLowerCase().includes(filtroProf.toLowerCase()) ||
                    (a.titulo || '').toLowerCase().includes(filtroProf.toLowerCase())
                  ).length === 0 && (
                    <p className="text-center text-slate-400 py-4">Nenhum resultado para o filtro aplicado.</p>
                  )}
                </div>
              )}
            </div>
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
                  <div className="flex flex-row items-center justify-between w-full">
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
                    <Button variant={filtroStatusPrograma === "todos" ? "default" : "outline"} size="sm" onClick={() => setFiltroStatusPrograma("todos")}>Todos</Button>
                    <Button variant={filtroStatusPrograma === "ativo" ? "default" : "outline"} size="sm" onClick={() => setFiltroStatusPrograma("ativo")}>Em Andamento</Button>
                    <Button variant={filtroStatusPrograma === "planejado" ? "default" : "outline"} size="sm" onClick={() => setFiltroStatusPrograma("planejado")}>Planejados</Button>
                    <Button variant={filtroStatusPrograma === "concluido" ? "default" : "outline"} size="sm" onClick={() => setFiltroStatusPrograma("concluido")}>Concluídos</Button>
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
                        <Badge variant={programa.status === 'em_andamento' || programa.status === 'ativo' ? 'default' : 'secondary'}>
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
                              ? `${new Date(programa.dataInicio).toLocaleDateString('pt-BR')} - ${new Date(programa.dataFim).toLocaleDateString('pt-BR')}`
                              : programa.dataInicio 
                                ? `Início: ${new Date(programa.dataInicio).toLocaleDateString('pt-BR')}`
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
                  <Button variant={filtroStatusTurma === "todos" ? "default" : "outline"} size="sm" onClick={() => setFiltroStatusTurma("todos")}>Todas</Button>
                  <Button variant={filtroStatusTurma === "ativo" ? "default" : "outline"} size="sm" onClick={() => setFiltroStatusTurma("ativo")}>Em Andamento</Button>
                  <Button variant={filtroStatusTurma === "planejado" ? "default" : "outline"} size="sm" onClick={() => setFiltroStatusTurma("planejado")}>Planejadas</Button>
                  <Button variant={filtroStatusTurma === "concluido" ? "default" : "outline"} size="sm" onClick={() => setFiltroStatusTurma("concluido")}>Concluídas</Button>
                  <Button variant={filtroStatusTurma === "inativo" ? "default" : "outline"} size="sm" onClick={() => setFiltroStatusTurma("inativo")}>Inativas</Button>
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
                          if (filtroStatusTurma !== "inativo" && t.status === 'inativo') return false;
                          const nomeTurma = (t.nome || t.title || '').toLowerCase();
                          if (buscaTurma && !nomeTurma.includes(buscaTurma.toLowerCase())) return false;
                          if (filtroStatusTurma === "todos") return true;
                          if (filtroStatusTurma === "ativo") return t.status === "ativo" || t.status === "emandamento" || t.status === "em_andamento";
                          if (filtroStatusTurma === "planejado") return t.status === "planejado" || t.status === "pendente";
                          if (filtroStatusTurma === "concluido") return t.status === "concluido" || t.status === "finalizado";
                          return t.status === filtroStatusTurma;
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
                                  <Badge variant={turma.status === 'ativo' ? 'default' : turma.status === 'inativo' ? 'destructive' : 'secondary'}>
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
                                      setTurmaSelecionadaParaAlunos(turma);
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
                                  {turma.status !== "inativo" && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                                      onClick={() => {
                                        setTurmaParaInativar(turma);
                                        setConfirmInativarOpen(true);
                                      }}
                                    >
                                      <Ban className="w-4 h-4 mr-1" />
                                      Inativar
                                    </Button>
                                  )}
                                  {turma.status !== "concluido" && turma.status !== "inativo" && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="text-green-600 border-green-600 hover:bg-green-50"
                                        onClick={async () => {  
                                      const turmaId = Number(turma.id);

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
                const response = await fetch(
                  `/api/coordenador/${coordenadorId}/historico-chamadas?vertente=inclusao_produtiva`,
                  { credentials: "include" }
                );
                if (!response.ok) throw new Error('Falha ao carregar histórico');
                return response.json();
              }}
              fetchParticipantes={async (turmaId: string) => {
                const response = await fetch(`/api/turmas-inclusao/${turmaId}/participantes`, {
                  credentials: "include",
                });
                if (!response.ok) throw new Error('Falha ao carregar alunos');
                return response.json();
              }}
              savePresenca={async (payload) => {
                const response = await fetch(`/api/coordenador/${coordenadorId}/registro-presenca-inclusao`, {
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
            />
            </div>
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
                  <div className="flex gap-4">
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
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
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
                              <Badge variant={programa.status === 'ativo' || programa.status === 'em_andamento' ? 'default' : 'secondary'}>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  Relatórios Gerenciais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Filtros para Relatórios */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-4">Gerar Relatório Personalizado</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Período</label>
                        <Select defaultValue="mes-atual">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mes-atual">Mês Atual</SelectItem>
                            <SelectItem value="ultimo-mes">Mês Anterior</SelectItem>
                            <SelectItem value="trimestre">Trimestre</SelectItem>
                            <SelectItem value="semestre">Semestre</SelectItem>
                            <SelectItem value="ano">Ano Inteiro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Programa</label>
                        <Select defaultValue="todos">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos os Programas</SelectItem>
                            {programasData.map((programa: any) => (
                              <SelectItem key={programa.id} value={programa.id.toString()}>
                                {programa.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Tipo</label>
                        <Select defaultValue="geral">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="geral">Relatório Geral</SelectItem>
                            <SelectItem value="participantes">Participantes</SelectItem>
                            <SelectItem value="resultados">Resultados</SelectItem>
                            <SelectItem value="financeiro">Impacto Financeiro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-end">
                        <Button className="w-full bg-indigo-500 hover:bg-indigo-600">
                          <Download className="w-4 h-4 mr-2" />
                          Gerar
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Relatórios - DADOS REAIS DISPONÍVEIS */}
                  <div className="space-y-4">
                    <h3 className="font-semibold mb-4">Relatórios Disponíveis</h3>
                    
                    {/* Relatório de Participantes - Com Dados Reais */}
                    <div className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Users className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">Lista de Participantes</h4>
                            <p className="text-sm text-gray-600 mb-2">Relatório com todos os participantes cadastrados e suas turmas</p>
                            <Badge variant="outline">Excel/PDF</Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-500 hover:bg-green-600">
                            <Download className="w-4 h-4 mr-1" />
                            Gerar
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Relatório de Programas - Com Dados Reais */}
                    <div className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <BookOpen className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">Relatório de Programas e Turmas</h4>
                            <p className="text-sm text-gray-600 mb-2">Visão geral dos programas, turmas e cursos ativos</p>
                            <Badge variant="outline">Excel/PDF</Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                            <Download className="w-4 h-4 mr-1" />
                            Gerar
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Relatório em Apresentação (Google Slides) - Com Dados Reais */}
                    <div className="border-2 border-green-200 rounded-lg p-4 bg-gradient-to-r from-green-50 to-emerald-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-green-500 rounded-lg">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold flex items-center gap-2">
                              Apresentação Executiva
                              <Badge className="bg-green-500 text-white text-xs">NOVO</Badge>
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              Relatório completo em slides com estatísticas, gráficos e dados dos participantes
                            </p>
                            <Badge variant="outline">Google Slides → PDF</Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="bg-green-500 hover:bg-green-600 text-white shadow-md"
                            onClick={async () => {
                              try {
                                toast({
                                  title: "Gerando Apresentação",
                                  description: "Aguarde, estamos preparando seu relatório..."
                                });

                                const userId = localStorage.getItem('userId');
                                console.log('🔑 [EXPORT-SLIDES] userId do localStorage:', userId);

                                const response = await fetch('/api/export/relatorio-slides', {
                                  method: 'GET',
                                  headers: {
                                    'x-user-id': userId || '1',
                                  },
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
                            }}
                            data-testid="button-exportar-slides"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Exportar
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Relatórios Futuros - Em Desenvolvimento */}
                    <div className="border-2 border-dashed rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                      <h4 className="font-semibold mb-2 text-gray-600 dark:text-gray-400">
                        📊 Relatórios Adicionais em Desenvolvimento
                      </h4>
                      <ul className="text-sm text-gray-500 space-y-1 ml-4">
                        <li>• Análise de Empregabilidade (quando sistema de vagas for implementado)</li>
                        <li>• Relatório de Parceiros (quando cadastro de parceiros for implementado)</li>
                        <li>• Impacto Social Quantitativo (quando métricas forem coletadas)</li>
                        <li>• Frequência e Progresso (quando sistema de acompanhamento for implementado)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'aprovacoes' && (
            <AprovacoesSemana />
          )}

          {activeSection === 'geracao-renda' && (
            <GeracaoRendaSection />
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
                <div className="grid grid-cols-2 gap-4">
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Duração</label>
                    <Input id="edit-programa-duracao" defaultValue={selectedPrograma.duracao} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Vagas</label>
                    <Input id="edit-programa-vagas" type="number" defaultValue={selectedPrograma.numeroVagas} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    <Badge>{formatarStatus(selectedPrograma.status)}</Badge>
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
                          ? `${new Date(selectedPrograma.dataInicio).toLocaleDateString('pt-BR')} - ${new Date(selectedPrograma.dataFim).toLocaleDateString('pt-BR')}`
                          : selectedPrograma.dataInicio 
                            ? `Início: ${new Date(selectedPrograma.dataInicio).toLocaleDateString('pt-BR')}`
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
                      <div className="grid grid-cols-3 gap-4">
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
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Turma</DialogTitle>
            </DialogHeader>
            {selectedTurma && (
              <div className="space-y-6">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{selectedTurma.nome}</h3>
                    <Badge variant={selectedTurma.status === 'ativo' ? 'default' : 'secondary'}>
                      {formatarStatus(selectedTurma.status)}
                    </Badge>
                  </div>
                  {selectedTurma.descricao && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedTurma.descricao}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Código</p>
                    <p className="font-semibold">{selectedTurma.codigo || 'Não definido'}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Programa</p>
                    <p className="font-semibold">{selectedTurma.programaNome || 'Não vinculado'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Datas e Horários</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Data Início</p>
                      <p className="font-semibold">
                        {selectedTurma.dataInicio 
                          ? new Date(selectedTurma.dataInicio).toLocaleDateString('pt-BR')
                          : 'Não definida'}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Data Fim</p>
                      <p className="font-semibold">
                        {selectedTurma.dataFim 
                          ? new Date(selectedTurma.dataFim).toLocaleDateString('pt-BR')
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
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-3 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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
        {/* Modal de Editar Turma */}
        <Dialog open={showEditTurmaModal} onOpenChange={setShowEditTurmaModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Turma</DialogTitle>
            </DialogHeader>
            {selectedTurma && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome da Turma *</label>
                  <Input 
                    placeholder="Ex: Turma A - Manhã" 
                    id="edit-turma-nome"
                    defaultValue={selectedTurma.nome}
                  />
                </div>
                

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Data de Início</label>
                    <Input 
                      type="date" 
                      id="edit-turma-data-inicio"
                      defaultValue={selectedTurma.dataInicio || selectedTurma.data_inicio || ''}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Data de Término</label>
                    <Input 
                      type="date" 
                      id="edit-turma-data-fim"
                      defaultValue={selectedTurma.dataFim || selectedTurma.data_fim || ''}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Hora de Início *</label>
                    <Input 
                      type="time" 
                      value={editTurmaHoraInicio}
                      onChange={(e) => setEditTurmaHoraInicio(e.target.value)}
                      placeholder="Ex: 14:00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Hora de Término *</label>
                    <Input 
                      type="time" 
                      value={editTurmaHoraFim}
                      onChange={(e) => setEditTurmaHoraFim(e.target.value)}
                      placeholder="Ex: 17:00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Local</label>
                  <Input 
                    placeholder="Ex: Sala 101" 
                    id="edit-turma-local"
                    defaultValue={selectedTurma.local || ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Dias da Semana</label>
                  <div className="flex flex-wrap gap-2">
                    {diasDaSemana.map((dia) => (
                      <button
                        key={dia.value}
                        type="button"
                        onClick={() => {
                          if (editTurmaDiasSemana.includes(dia.value)) {
                            setEditTurmaDiasSemana(editTurmaDiasSemana.filter(d => d !== dia.value));
                          } else {
                            setEditTurmaDiasSemana([...editTurmaDiasSemana, dia.value]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          editTurmaDiasSemana.includes(dia.value)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {dia.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Selecione os dias em que a turma acontece</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <Select value={editTurmaStatus} onValueChange={setEditTurmaStatus}>
                    <SelectTrigger id="edit-turma-status">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planejado">Planejado</SelectItem>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="emandamento">Em andamento</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Nome do Instrutor</label>
                  <Input 
                    placeholder="Nome do instrutor" 
                    id="edit-turma-instrutor"
                    defaultValue={selectedTurma.instrutorNome || selectedTurma.instrutor_nome || ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Descrição</label>
                  <Textarea 
                    placeholder="Descreva a turma e seus detalhes..."
                    rows={3}
                    id="edit-turma-descricao"
                    defaultValue={selectedTurma.descricao || ''}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    className="bg-blue-500 hover:bg-blue-600"
                    onClick={async () => {
                      if (!editTurmaHoraInicio) {
                        toast({ title: "Horário de início obrigatório", description: "Por favor, informe o horário de início da turma.", variant: "destructive" });
                        return;
                      }
                      if (!editTurmaHoraFim) {
                        toast({ title: "Horário de término obrigatório", description: "Por favor, informe o horário de término da turma.", variant: "destructive" });
                        return;
                      }
                      try {
                        // Formatar horário a partir das horas de início e fim
                        let horarioFormatado = "";
                        if (editTurmaHoraInicio && editTurmaHoraFim) {
                          horarioFormatado = `${editTurmaHoraInicio} - ${editTurmaHoraFim}`;
                        }
                        
                        const formData: Record<string, any> = {
                          nome: (document.getElementById('edit-turma-nome') as HTMLInputElement)?.value,
                          dataInicio: (document.getElementById('edit-turma-data-inicio') as HTMLInputElement)?.value || null,
                          dataFim: (document.getElementById('edit-turma-data-fim') as HTMLInputElement)?.value || null,
                          horario: horarioFormatado,
                          local: (document.getElementById('edit-turma-local') as HTMLInputElement)?.value,
                          diasSemana: editTurmaDiasSemana.length > 0 ? editTurmaDiasSemana : null,
                          instrutorNome: (document.getElementById('edit-turma-instrutor') as HTMLInputElement)?.value,
                          descricao: (document.getElementById('edit-turma-descricao') as HTMLTextAreaElement)?.value
                        };
                        if (editTurmaStatus !== (selectedTurma.status || 'planejado')) {
                          formData.status = editTurmaStatus;
                        }

                        const response = await fetch(`/api/turmas-inclusao/${selectedTurma.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(formData)
                        });

                        if (response.ok) {
                          toast({
                            title: "Turma atualizada!",
                            description: "As alterações foram salvas com sucesso."
                          });
                          setShowEditTurmaModal(false);
                          setSelectedTurma(null);
                          queryClient.invalidateQueries({ queryKey: ['/api/turmas-inclusao'] });
                        } else {
                          throw new Error('Erro ao atualizar turma');
                        }
                      } catch (error) {
                        toast({
                          title: "Erro",
                          description: "Não foi possível atualizar a turma.",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setShowEditTurmaModal(false);
                    setSelectedTurma(null);
                  }}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Editar Foto de Perfil */}
        <Dialog open={showEditFotoModal} onOpenChange={setShowEditFotoModal}>
          <DialogContent className="max-w-md">
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
                <div className="grid grid-cols-3 gap-4">
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
          <DialogContent className="max-w-md">
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
      </div>
    </div>
  );
}