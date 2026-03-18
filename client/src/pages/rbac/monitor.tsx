import React, { useState, useEffect, useRef } from "react";
import { formatCPF } from "@/lib/utils";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AlterarSenhaMonitor from "@/components/AlterarSenhaMonitor";
import { ComprehensiveStudentForm, maskPhone } from "@/components/comprehensive-student-form";
import { ParticipanteDetalhesModal, type DetalhesSection } from "@/components/ParticipanteDetalhesModal";
import { TurmaInclusaoForm } from "@/components/TurmaInclusaoForm";
import { getDiasAulaParaTurma, type DiaAula } from "@/lib/class-days";
import { InstanceForm, ActivityForm } from "@/components/pec/forms";
import { TurmaDetailModal } from "@/components/pec/TurmaDetailModal";
import { TurmaDetailModalInclusao } from "@/components/inclusao/TurmaDetailModalInclusao";
import { baixarListaAlunos } from "@/lib/pdfUtils";
import MonitorDashboard from "@/components/MonitorDashboard";
import PresencaInclusaoControl from "@/components/presenca/PresencaInclusaoControl";
import AulasHojePanel from "@/components/presenca/AulasHojePanel";
import ParticipantesInclusaoSection from "@/components/ParticipantesInclusaoSection";
import { GeracaoRendaSection } from "@/components/GeracaoRendaSection";
import DemandaEspontaneaSection from "@/components/DemandaEspontaneaSection";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Users, 
  BookOpen, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut,
  UserCheck,
  Clock,
  Target,
  Activity,
  Download,
  Plus,
  Search,
  User,
  CheckCircle,
  Loader2,
  XCircle,
  Edit,
  Eye,
  Shield,
  ExternalLink,
  GraduationCap,
  Briefcase,
  ArrowRight,
  Pencil,
  Wifi,
  WifiOff,
  UserMinus,
  UserPlus,
  Upload,
  FileText as FileTextIcon,
  X,
  History as HistoryIcon,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Check,
  Save,
  HeartHandshake,
  Camera,
  Zap,
  ScanFace,
  Hand,
  TrendingUp,
  Phone,
  MapPin,
  Heart,
  Shirt,
  Home,
  Lock,
  MessageSquare,
  Utensils,
  FileDown,
} from "lucide-react";

  type MonitorVertente = "selecao" | "pec" | "inclusao" | "psico";

 const maskCpfMonitor = (cpf: string | null | undefined): string => {
  const clean = String(cpf || '').replace(/\D/g, '');
  if (clean.length !== 11) return '***.***.***-**';
  return `***.***.*${clean[7]}${clean[8]}-${clean[9]}${clean[10]}`;
};

const normalizeTime = (t: any) => {
  if (!t) return "";
  const s = String(t);
  // aceita "14:40:00" ou "14:40"
  return s.length >= 5 ? s.slice(0, 5) : s;
};

const normalizeToYMD = (v: any) => {
  if (!v) return "";
  const s = String(v);
  return s.includes("T") ? s.split("T")[0] : s;
};


const normalizeDia = (dia: any) => {
  const d = String(dia ?? "").toLowerCase().trim();
  if (!d) return "";

  if (d.startsWith("seg")) return "Segunda";
  if (d.startsWith("ter")) return "Terça";
  if (d.startsWith("qua")) return "Quarta";
  if (d.startsWith("qui")) return "Quinta";
  if (d.startsWith("sex")) return "Sexta";
  if (d.startsWith("sab") || d.startsWith("sáb")) return "Sábado";

  // fallback: capitaliza primeira letra
  return d.charAt(0).toUpperCase() + d.slice(1);
};

function normalizeTurma(raw: any) {
  if (!raw) return raw;

  const diasRaw =
    raw.diasSemana ??
    raw.dias_semana ??
    raw.dias ??
    raw.dias_aula ??
    raw.diasSemanaSelecionados ??
    [];

  const diasList = Array.isArray(diasRaw)
    ? diasRaw
    : String(diasRaw)
        .split(/[;,|]/)
        .map((s) => s.trim())
        .filter(Boolean);

  const diasSemana = Array.from(
  new Set(diasList.map(normalizeDia).filter(Boolean))
);

  const horarioInicioRaw =
    raw.horarioInicio ?? raw.horario_inicio ?? raw.hora_inicio ?? raw.start_time ?? "";
  const horarioFimRaw =
    raw.horarioFim ?? raw.horario_fim ?? raw.hora_fim ?? raw.end_time ?? "";

  const horarioInicio = normalizeTime(horarioInicioRaw);
  const horarioFim = normalizeTime(horarioFimRaw);

  // ✅ pega datas em vários nomes possíveis
  const dataInicioRaw =
    raw.dataInicio ?? raw.data_inicio ?? raw.dt_inicio ?? raw.startDate ?? raw.start_date ?? raw.inicio ?? "";
  const dataFimRaw =
    raw.dataFim ?? raw.data_fim ?? raw.dt_fim ?? raw.endDate ?? raw.end_date ?? raw.fim ?? "";

  const dataInicio = normalizeToYMD(dataInicioRaw);
  const dataFim = normalizeToYMD(dataFimRaw);

  return {
    ...raw,
    diasSemana,
    horarioInicio,
    horarioFim,
    dataInicio,
    dataFim,
  };
}

const getVertente = (location?: string): MonitorVertente => {
  const loc = location ?? "";
  if (loc.includes("/monitor/pec")) return "pec";
  if (loc.includes("/monitor/inclusao")) return "inclusao";
  if (loc.includes("/monitor/psico")) return "psico";
  return "selecao";
};
    

  export default function MonitorPage() {
  const [location, setLocation] = useLocation();
  const vertente = getVertente(location)
  const { toast } = useToast();
   const [activeSection, setActiveSection] = useState<string>(() => {
    const papel = localStorage.getItem("userPapel") || "";
      return papel === "monitor_psico" ? "psico" : "dashboard";
    });
    const changeSection = (section: string) => {
      setActiveSection(section);
      requestAnimationFrame(() => {
        setTimeout(() => {
          const el = document.getElementById('monitor-content-area');
          console.log('[SCROLL] monitor-content-area found:', !!el, 'rect:', el?.getBoundingClientRect());
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      });
    };
    const [selectedAluno, setSelectedAluno] = useState<any>(null);
    const [filtroStatusTurma, setFiltroStatusTurma] = useState<string>('todos');
    const [buscaTurma, setBuscaTurma] = useState<string>('');
    const [showEditAlunoModal, setShowEditAlunoModal] = useState(false);
    const [showViewAlunoModal, setShowViewAlunoModal] = useState(false);
    const [showAlunoDetalhesModal, setShowAlunoDetalhesModal] = useState(false);
    const [fullAlunoData, setFullAlunoData] = useState<any>(null);
    const [loadingAlunoDetails, setLoadingAlunoDetails] = useState(false);
    const [showAddAlunoModal, setShowAddAlunoModal] = useState(false);
    const [showAlterarSenhaModal, setShowAlterarSenhaModal] = useState(false);
    const [presencaVertente, setPresencaVertente] = useState<MonitorVertente>(() => {
      if (vertente === 'pec' || vertente === 'inclusao') return vertente;
      return 'selecao';
    });
    const [catracaConnected, setCatracaConnected] = useState(false);
    const [dashFiltroAno, setDashFiltroAno] = useState<number>(new Date().getFullYear());
    const [dashFiltroMes, setDashFiltroMes] = useState<number>(0);

    
    // Estados para participantes de Inclusão Produtiva
    const [selectedParticipante, setSelectedParticipante] = useState<any>(null);
    const [showViewParticipanteModal, setShowViewParticipanteModal] = useState(false);
    const [showEditParticipanteModal, setShowEditParticipanteModal] = useState(false);
    const [showFinalizarTurmaModal, setShowFinalizarTurmaModal] = useState(false);
    const [participantesSelecionados, setParticipantesSelecionados] = useState<number[]>([]);
    const [participantesTurmaAtual, setParticipantesTurmaAtual] = useState<any[]>([]);
    const [isLoadingParticipantesTurma, setIsLoadingParticipantesTurma] = useState(false);
    const [isFinalizando, setIsFinalizando] = useState(false);
    const [buscaParticipante, setBuscaParticipante] = useState("");
    const [statusFilterInclusao, setStatusFilterInclusao] = useState<'todos' | 'ativo' | 'inativo'>('todos');
    const [psicoTab, setPsicoTab] = useState<"atendidos" | "frequencia" | "atividades" | "registros" | "confidencial" | "demanda">("atendidos");
    const changePsicoTab = (tab: "atendidos" | "frequencia" | "atividades" | "registros" | "confidencial" | "demanda") => {
      setPsicoTab(tab);
      requestAnimationFrame(() => {
        setTimeout(() => {
          const el = document.getElementById('monitor-content-area');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      });
    };
    const [psicoVertente, setPsicoVertente] = useState<"todos" | "pec" | "inclusao">("todos");
    const [buscaAtendido, setBuscaAtendido] = useState("");
    const [selectedTurmaId, setSelectedTurmaId] = useState<number | null>(null);
    const [psicoChamadaTurmaId, setPsicoChamadaTurmaId] = useState<string>("");
    const [psicoChamadaData, setPsicoChamadaData] = useState<string>("");
    const [psicoPresencas, setPsicoPresencas] = useState<{alunoCpf: string; nome: string; presente: boolean; justificativa?: string}[]>([]);
    const [psicoDiasAulaDisponiveis, setPsicoDiasAulaDisponiveis] = useState<{date: string; label: string}[]>([]);
    const [psicoChamadaPrograma, setPsicoChamadaPrograma] = useState<"pec" | "inclusao">("pec");
    const [psicoChamadaBusca, setPsicoChamadaBusca] = useState("");
    const [psicoAtivTurmaOpen, setPsicoAtivTurmaOpen] = useState(false);
    const [psicoAtivExpandida, setPsicoAtivExpandida] = useState<string | null>(null);
    const [psicoChamadaExpandida, setPsicoChamadaExpandida] = useState<string | null>(null);
    const [psicoAtivPrograma, setPsicoAtivPrograma] = useState<"pec" | "inclusao">("pec");
    const [psicoNovaAtividade, setPsicoNovaAtividade] = useState(false);
    const [psicoAtivSubTab, setPsicoAtivSubTab] = useState<"lista" | "registrar">("lista");
    const [psicoAtividadeForm, setPsicoAtividadeForm] = useState({ titulo: "", descricao: "", tipo: "roda_de_conversa", data: "", horarioInicio: "08:00", horarioFim: "10:00", turmaId: "", observacao: "" });
    const [psicoAtivDiasAula, setPsicoAtivDiasAula] = useState<{date: string; label: string; dayOfWeek?: string}[]>([]);
    const [expandedParticipantes, setExpandedParticipantes] = useState<Set<number>>(new Set());
    const [psicoAtivChamada, setPsicoAtivChamada] = useState<{loaded: boolean; exists: boolean; presencas: {alunoCpf: string; nome: string; presente: boolean; justificativa?: string}[]; editMode: boolean}>({loaded: false, exists: false, presencas: [], editMode: false});
    const [psicoNovoRegistro, setPsicoNovoRegistro] = useState(false);
    const [psicoRegistroForm, setPsicoRegistroForm] = useState({ vulnerabilidade: "baixa_vulnerabilidade", tipo: "atendimento_individual", conteudo: "", participanteNome: "", participanteCpf: "", participanteDataNascimento: "", data: new Date().toISOString().split("T")[0] });
    const [registrosSubTab, setRegistrosSubTab] = useState<"realizados" | "novo">("realizados");
    const [registroGeralForm, setRegistroGeralForm] = useState({ categoria: "atendimento_individual", conteudo: "", participanteNome: "", participanteCpf: "", participanteDataNascimento: "", data: new Date().toISOString().split("T")[0] });
    const [registroGeralPartBusca, setRegistroGeralPartBusca] = useState("");
    const [registroGeralPartOpen, setRegistroGeralPartOpen] = useState(false);
    const [espGritoParticipantes, setEspGritoParticipantes] = useState<{nome: string; cpf?: string; origem?: string}[]>([]);
    const [espGritoBusca, setEspGritoBusca] = useState("");
    const [espGritoPartOpen, setEspGritoPartOpen] = useState(false);
    const [espGritoColaboradoresIds, setEspGritoColaboradoresIds] = useState<number[]>([]);
    const [espGritoColabBusca, setEspGritoColabBusca] = useState("");
    const [editGeraisGeralId, setEditGeraisGeralId] = useState<number | null>(null);
    const [editGeraisGeralForm, setEditGeraisGeralForm] = useState({ tipo: "", conteudo: "", data: "" });
    const [editGeraisColaboradoresIds, setEditGeraisColaboradoresIds] = useState<number[]>([]);
    const [editGeraisColabBusca, setEditGeraisColabBusca] = useState("");
    const [viewGeraisRecord, setViewGeraisRecord] = useState<any | null>(null);

    const [registroPartBusca, setRegistroPartBusca] = useState("");
    const [registroPartOpen, setRegistroPartOpen] = useState(false);
    const [confSubTab, setConfSubTab] = useState<"realizados" | "novo">("realizados");
    const [confSearchTerm, setConfSearchTerm] = useState("");
    const [confExpandedParticipante, setConfExpandedParticipante] = useState<string | null>(null);
    const [confExpandedRegistro, setConfExpandedRegistro] = useState<number | null>(null);
    const [psicoAtividadeParticipantes, setPsicoAtividadeParticipantes] = useState<{id: string; nome: string; selecionado: boolean}[]>([]);
    
    // Form state for edit modal
    const [editFormData, setEditFormData] = useState({
      observacoesPrivadas: '',
      acompanhamentoStatus: 'ativo'
    });
    
    // State for nova atividade modal and form
    const [showNovaAtividadeModal, setShowNovaAtividadeModal] = useState(false);
    // State for nova oficina PEC (usa ActivityForm - mesma tabela do coordenador)
    const [showNovaOficinaModal, setShowNovaOficinaModal] = useState(false);
    const [novaAtividadeForm, setNovaAtividadeForm] = useState({
      titulo: '',
      descricao: '',
      tipo: 'reforco',
      grupo: '',
      grupoId: null as number | null,
      data: '',
      horarioInicio: '',
      horarioFim: '',
      local: '',
      participantesEsperados: 0,
      observacoes: '',
      materiaisNecessarios: []
    });
    
    // States para relatórios
    const [relatorioGrupoId, setRelatorioGrupoId] = useState<string>('todos');
    const [relatorioDataInicio, setRelatorioDataInicio] = useState('');
    const [relatorioDataFim, setRelatorioDataFim] = useState('');
    const [relatorioAtividadeId, setRelatorioAtividadeId] = useState<string>('todas');
    const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
    
    // States para acompanhamento individual
    const [acompanhamentoBusca, setAcompanhamentoBusca] = useState('');
    const [acompanhamentoGrupo, setAcompanhamentoGrupo] = useState('todos');
    
    // State for novo evento modal (calendário)
    const [showNovoEventoModal, setShowNovoEventoModal] = useState(false);
    const [novoEventoForm, setNovoEventoForm] = useState({
      titulo: '',
      descricao: '',
      data: '',
      horarioInicio: '',
      horarioFim: '',
      local: ''
    });
    
    // State for editing atividade/evento
    const [editandoAtividade, setEditandoAtividade] = useState<any>(null);
    const [editAtividadeForm, setEditAtividadeForm] = useState({
      titulo: '',
      descricao: '',
      data: '',
      horarioInicio: '',
      horarioFim: '',
      local: '',
      tipo: ''
    });
    
    // State for calendar month navigation
    const [calendarioMes, setCalendarioMes] = useState(new Date());
    // State for nova turma modal (usando componentes reutilizáveis)
    const [showNovaTurmaModal, setShowNovaTurmaModal] = useState(false);
    // State for nova grupo modal and form (legado - será substituído por turmas)
    const [showNovoGrupoModal, setShowNovoGrupoModal] = useState(false);
    const [novoGrupoForm, setNovoGrupoForm] = useState({
      nome: '',
      nivel: '',
      alunos: 0,
      frequencia: '',
      atividade: '',
      horarioInicio: '',
      horarioFim: '',
      diasSemana: [] as string[]
    });
    const [alunosSelecionadosNovoGrupo, setAlunosSelecionadosNovoGrupo] = useState<any[]>([]);
    const [searchNovoGrupo, setSearchNovoGrupo] = useState('');

    // State for gerenciar alunos na grupo
    const [showGerenciarAlunosModal, setShowGerenciarAlunosModal] = useState(false);
    const [showDetalhesTurmaModal, setShowDetalhesTurmaModal] = useState(false);
    const [showTurmaDetailModal, setShowTurmaDetailModal] = useState(false);
    const [showTurmaDetailModalInclusao, setShowTurmaDetailModalInclusao] = useState(false);
    const [turmaParaGerenciarInclusao, setTurmaParaGerenciarInclusao] = useState<any>(null);
    const [grupoSelecionado, setGrupoSelecionado] = useState<any>(null);
    const [alunosDoGrupo, setAlunosDoGrupo] = useState<any[]>([]);
    const [searchAlunoGrupo, setSearchAlunoGrupo] = useState('');
    
    // State for editar grupo
    const [showEditarGrupoModal, setShowEditarGrupoModal] = useState(false);
    const [showEditTurmaPecModal, setShowEditTurmaPecModal] = useState(false);
    const [showEditTurmaInclusaoModal, setShowEditTurmaInclusaoModal] = useState(false);
    const [turmaParaEditar, setTurmaParaEditar] = useState<any>(null);
    const [editarGrupoForm, setEditarGrupoForm] = useState({
      nome: '',
      nivel: '',
      atividade: '',
      alunos: 0,
      status: 'ativo',
      horarioInicio: '',
      horarioFim: '',
      diasSemana: [] as string[]
    });
    
    // State for registro form
    // State for viewing/editing registros
    const [selectedRegistro, setSelectedRegistro] = useState<any>(null);
    const [showViewRegistroModal, setShowViewRegistroModal] = useState(false);
    const [showEditRegistroModal, setShowEditRegistroModal] = useState(false);

    //State for inativar group
    const [confirmInativarOpen, setConfirmInativarOpen] = useState(false);
    const [turmaParaInativar, setTurmaParaInativar] = useState<any>(null);


    const [registroForm, setRegistroForm] = useState({
      atividadeId: null as number | null,
      grupoId: null as number | null,
      dataAtividade: new Date().toISOString().split('T')[0],
      grupo: '',
      titulo: '',
      descricao: '',
      duracaoMinutos: '',
      participantes: '',
      resultadosObservacoes: '',
      presencas: [] as { id: string; nome: string; presente: boolean }[]
    });
    
    // State for presenca (attendance control)
    const [presencaData, setPresencaData] = useState('');
    const [presencaGrupo, setPresencaGrupo] = useState('');
    const [diasAulaDisponiveis, setDiasAulaDisponiveis] = useState<DiaAula[]>([]);
    const [presencas, setPresencas] = useState<Array<{ alunoCpf: string, nome: string, presente: boolean, justificativa?: string, justificativaMotivo?: string, justificativaObs?: string, contaComoPresenca?: boolean, viaCatraca?: boolean, horaEntrada?: string }>>([]);
    const [showHistoricoChamadas, setShowHistoricoChamadas] = useState(false);
    const [modoManual, setModoManual] = useState(false);
  const [showModoManualDialog, setShowModoManualDialog] = useState(false);
  const [motivoManualSelect, setMotivoManualSelect] = useState('');
  const [descManual, setDescManual] = useState('');
  const [savingMotivoManual, setSavingMotivoManual] = useState(false);
  const [pinManual, setPinManual] = useState('');
  const [pinError, setPinError] = useState('');
    const [catracaApplied, setCatracaApplied] = useState(false);
    const [historicoExpandido, setHistoricoExpandido] = useState<number | null>(null);
    const [fotoFile, setFotoFile] = useState<File | null>(null);
    const [existingFotoUrl, setExistingFotoUrl] = useState<string | null>(null);
    const [editingChamadaId, setEditingChamadaId] = useState<number | null>(null);
    const [editingTeveAlimentacao, setEditingTeveAlimentacao] = useState<boolean | null>(null);
    const [showAlimentacaoModal, setShowAlimentacaoModal] = useState(false);
    const [pendingTeveAlimentacao, setPendingTeveAlimentacao] = useState<boolean | null>(null);
    const [showJustificativaModal, setShowJustificativaModal] = useState(false);
    const [modalJustItems, setModalJustItems] = useState<{alunoCpf: string; nome: string; motivo: string; obs: string; contaComoPresenca: boolean}[]>([]);
    const MOTIVOS_FALTA = [
      { label: 'Atestado médico', contaComoPresenca: true },
      { label: 'Doença', contaComoPresenca: true },
      { label: 'Guarda compartilhada', contaComoPresenca: true },
      { label: 'Escola / Conflito de horário', contaComoPresenca: true },
      { label: 'Trabalho', contaComoPresenca: true },
      { label: 'Transporte', contaComoPresenca: false },
      { label: 'Família', contaComoPresenca: false },
      { label: 'Compromisso pessoal', contaComoPresenca: false },
      { label: 'Chuva/Clima', contaComoPresenca: false },
      { label: 'Outro', contaComoPresenca: false },
      { label: 'Sem justificativa', contaComoPresenca: false },
    ];
    const [historicoFiltroNome, setHistoricoFiltroNome] = useState('');
    const [historicoFiltroData, setHistoricoFiltroData] = useState('');
    const [historicoFiltroTurma, setHistoricoFiltroTurma] = useState('');
    const [historicoFiltroDataInicio, setHistoricoFiltroDataInicio] = useState('');
    const [historicoFiltroDataFim, setHistoricoFiltroDataFim] = useState('');

    
    // States para cadastro de alunos/participantes por vertente
    const [showCadastroModal, setShowCadastroModal] = useState(false);
    const [desligarMonitorModal, setDesligarMonitorModal] = useState<{ participanteId: number; turmaId: number; nome: string } | null>(null);
    const [desligarMonitorMotivo, setDesligarMonitorMotivo] = useState("");
    const [desligarMonitorLoading, setDesligarMonitorLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingCpf, setEditingCpf] = useState<string | undefined>(undefined);
    const [viewMode, setViewMode] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('todos');
    const [cadastroForm, setCadastroForm] = useState({
      nome_completo: '',
      nome: '',
      cpf: '',
      data_nascimento: '',
      dataNascimento: '',
      genero: '',
      telefone: '',
      email: '',
      endereco: '',
      escolaridade: '',
      idade: 0,
      programaAtual: '',
      observacoes: '',
      codigoMatricula: '',
      identificador: '',
      dataIngresso: ''
    });
    
    // Estado para foto do participante (Inclusão)
    const [fotoParticipante, setFotoParticipante] = useState<File | null>(null);
    const [fotoParticipantePreview, setFotoParticipantePreview] = useState<string | null>(null);
    
    const handleFotoParticipanteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFotoParticipante(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setFotoParticipantePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    
    // Estado para grupos selecionadas (Inclusão)
    const [selectedgrupoIds, setSelectedgrupoIds] = useState<number[]>([]);
    
    // Obter dados do usuário do localStorage
    const userId = localStorage.getItem("userId");         // auth (users.id)
    const monitorId = localStorage.getItem("monitorId");   // route param (monitores.id)
    const userName = localStorage.getItem("userName") || "Monitor"; 
    const userEmail = localStorage.getItem("userEmail") || "";
    const userPapel = localStorage.getItem("userPapel") || "";
    const isMonitorLoggedIn =
      !!userPapel &&
      (userPapel === "monitor_pec" ||
      userPapel === "monitor_inclusao" ||
      userPapel === "monitor_psico" ||
      userPapel.includes("monitor"));
    const isDevUserForPsico = (userPapel === "dev" || userPapel === "desenvolvedor" || userPapel === "dev-marketing") && vertente === "psico";
    const isPsico = userPapel === "monitor_psico" || isDevUserForPsico;
    const safeUserId = String(userId || "");
    const safeMonitorId = String(monitorId || "");
    const monitorUserId = String(userId || "");
    // ✅ usa monitorId quando existir; se não, cai pro userId (pra não travar a tela)
    const resolvedMonitorId = safeMonitorId || safeUserId;

    // Estados para edição de perfil do monitor
    const [perfilNome, setPerfilNome] = useState(userName);

    
    // Estados para edição de perfil do monitor
    const [perfilEmail, setPerfilEmail] = useState(userEmail);
    const [perfilTelefone, setPerfilTelefone] = useState("");
    const [perfilAreaAtuacao, setPerfilAreaAtuacao] = useState("Monitoria Educacional");
    const [salvandoPerfil, setSalvandoPerfil] = useState(false);
    const pathMonitorId = safeMonitorId || safeUserId; // rota /api/monitor/:id = monitorId se existir
    const authUserId = safeUserId;

    // Verificar autenticação - só permite acesso via login de monitor ou dev
    useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const devAccess = urlParams.get("dev_access") === "true";
      const devSession = sessionStorage.getItem("dev_session") === "active";

    const devPanel = localStorage.getItem("dev_panel_active") === "true";
    const isDevUser = userPapel === "dev" || userPapel === "desenvolvedor" || userPapel === "dev-marketing";
    if (!isMonitorLoggedIn && !devAccess && !devSession && !devPanel && !isDevUser) {
      window.location.href = "/login/monitor";
    }
  }, [isMonitorLoggedIn]);

    useEffect(() => {
    // ✅ se for psico, força a rota /monitor/psico
    if (isPsico && vertente !== "psico") {
      setLocation("/monitor/psico");
      return;
    }

    // ✅ se NÃO for psico, não deixa ficar na rota /monitor/psico
    if (!isPsico && vertente === "psico") {
      setLocation("/monitor/pec");
    }
  }, [isPsico, vertente, setLocation]);
    // Query para buscar dados do dashboard do monitor
   const {
      data: dashboardData,
      isLoading: dashboardLoading,
      error: dashboardError,
    } = useQuery({
      queryKey: ["/api/monitor/dashboard", userId],
      queryFn: async () => {
        const response = await fetch(`/api/monitor/dashboard/${userId}`, {
          credentials: "include",
          headers: { "x-user-id": userId || "" },
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err?.error || "Falha ao carregar dashboard");
        }
        return response.json();
      },
      enabled: !!userId && (vertente === "pec" || vertente === "inclusao"),
    });
    // Query para buscar dados do perfil do monitor (por vertente)
    const { data: perfilData } = useQuery({
      queryKey: ["/api/monitor/perfil", userId, vertente],
      queryFn: async () => {
      const response = await fetch(
          `/api/monitor/${userId}/perfil?vertente=${vertente}`,
          { 
            credentials: "include",
            headers: { "x-user-id": userId || "" } 
          }
        );

        if (!response.ok) {
          // mantém seu comportamento de "perfil opcional"
          return null;
        }

        return response.json();
      },
      enabled: !!userId && (vertente === "pec" || vertente === "inclusao")
      
    });
    
    // Atualizar estados do perfil quando dados são carregados
    useEffect(() => {
      if (perfilData) {
        setPerfilNome(perfilData.nome_completo || perfilData.nome || userName);
        setPerfilEmail(perfilData.email || userEmail);
        setPerfilTelefone(perfilData.telefone || "");
        setPerfilAreaAtuacao(perfilData.area_atuacao || "Monitoria Educacional");
      }
    }, [perfilData]);
    
    // Função para salvar perfil do monitor
    const handleSalvarPerfil = async () => {
      setSalvandoPerfil(true);
      try {
      const response = await fetch(`/api/monitor/${userId}/perfil`, {
            method: 'PUT',
            credentials: "include",
            headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
            body: JSON.stringify({
            nome: perfilNome,
            email: perfilEmail,
            telefone: perfilTelefone,
            area_atuacao: perfilAreaAtuacao,
            vertente: vertente
          })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao salvar');
        }
        
        // Atualizar localStorage com novo nome
        localStorage.setItem("userName", perfilNome);
        
        toast({
          title: "Perfil atualizado!",
          description: "Suas informações foram salvas com sucesso."
        });
        
        queryClient.invalidateQueries({ queryKey: ['/api/monitor/perfil', userId, vertente] });
      } catch (error: any) {
        toast({
          title: "Erro ao salvar",
          description: error.message || "Não foi possível salvar as alterações.",
          variant: "destructive"
        });
      } finally {
        setSalvandoPerfil(false);
      }
    };

    // Query to fetch alunos data
    const { data: alunosData, isLoading: alunosLoading } = useQuery({
      queryKey: ["/api/monitor/alunos", userId],
      queryFn: async () => {
      const response = await fetch(`/api/monitor/${userId}/alunos`, {
          credentials: "include",
          headers: { "x-user-id": userId || "" }
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err?.error || "Falha ao carregar alunos");
        }

        return response.json();
      },
      enabled: !!userId && (activeSection === 'alunos' || activeSection === 'grupos' || showNovoGrupoModal || showGerenciarAlunosModal || showEditarGrupoModal),
      
    });
    // Query for available participantes
    const { data: participantesDisponiveis } = useQuery({
      queryKey: ["/api/monitor/participantes-disponiveis", userId],
      queryFn: async () => {
      const response = await fetch(
        `/api/monitor/${userId}/participantes-disponiveis`,
          { 
            credentials: "include",
            headers: { "x-user-id": userId || "" } 
          }
        );

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err?.error || "Falha ao carregar participantes disponíveis");
        }

        return response.json();
      },
      enabled: !!userId && showAddAlunoModal,
      
    });


      const { data: atividadesData, isLoading: atividadesLoading } = useQuery({
        queryKey: ["/api/monitor/atividades", userId, vertente],
        queryFn: async () => {
          const isDevMode =
            window.location.search.includes("dev_access=true") ||
            window.location.pathname.includes("/dev");

          const response = await fetch(
            `/api/monitor/${userId}/atividades?vertente=${encodeURIComponent(vertente)}`,
            {
              credentials: "include",
              headers: {
                "x-user-id": userId || "",
                ...(isDevMode ? { "x-dev-access": "true" } : {})
              }
            }
          );

          if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err?.error || "Falha ao carregar atividades");
          }

          return response.json();
        },
        enabled: !!userId && (vertente === "pec" || vertente === "inclusao"),
      });

    // Mutation for updating aluno
    const updateAlunoMutation = useMutation({
      mutationFn: async ({ id, data }: { id: number, data: any }) => {
        return apiRequest(`/api/monitor/alunos/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data)
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/monitor/alunos', userId] });
        toast({ title: "Aluno atualizado!", description: "Dados salvos com sucesso." });
        setShowEditAlunoModal(false);
      },
      onError: (error: any) => {
        toast({ title: "Erro ao salvar aluno", description: error.message || "Não foi possível salvar. Tente novamente.", variant: "destructive" });
      }
    });

    // Mutation for adding aluno
    const addAlunoMutation = useMutation({
      mutationFn: async (participanteId: number) => {
        return apiRequest(`/api/monitor/${userId}/alunos`, {
          method: 'POST',
          body: JSON.stringify({ participanteId })
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/monitor/alunos', userId] });
        toast({ title: "Aluno adicionado!", description: "Aluno atribuído com sucesso." });
        setShowAddAlunoModal(false);
      },
      onError: (error: any) => {
        toast({ title: "Erro ao adicionar aluno", description: error.message || "Não foi possível adicionar aluno. Tente novamente.", variant: "destructive" });
      }
    });

    // ========== QUERIES ESPECÍFICAS POR VERTENTE ==========
    
    // Query para listar todos os alunos PEC
    const { data: alunosPec = [], isLoading: alunosPecLoading, error: alunosPecError } = useQuery({
      queryKey: ['/api/monitor/pec/alunos', userId, vertente, activeSection],
      queryFn: async () => {
        const response = await fetch('/api/monitor/pec/alunos', {
          credentials: "include",
          headers: { 'x-user-id': userId || '' }
        });

        const json = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(json?.error || 'Falha ao carregar alunos PEC');

        // ✅ normaliza (caso backend retorne {success,data})
        const lista =
          Array.isArray(json) ? json :
          Array.isArray(json?.data) ? json.data :
          Array.isArray(json?.alunos) ? json.alunos :
          [];

        return lista;
      },
      enabled:
        !!userId &&
        vertente === "pec" &&
        (
          activeSection === "dashboard" ||
          activeSection === "alunos" ||
          activeSection === "grupos" ||
          activeSection === "presenca" ||
          activeSection === "acompanhamento" ||
          showNovoGrupoModal ||
          showGerenciarAlunosModal ||
          showEditarGrupoModal
        ),
    });
    // Query para listar todos os participantes de Inclusão
    const { 
    data: participantesInclusao, 
    isLoading: participantesLoading, 
    refetch: refetchParticipantes 
  } = useQuery({
    queryKey: ['/api/monitor/inclusao/participantes', userId, activeSection],
    queryFn: async () => {
      const response = await fetch('/api/monitor/inclusao/participantes', {
        credentials: "include",
        headers: { 'x-user-id': userId || '' }
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || 'Falha ao carregar participantes');
      }

      return response.json();
    },
    enabled:
      !!userId &&
      vertente === "inclusao" &&
      (activeSection === "dashboard" || activeSection === "alunos" || activeSection === "acompanhamento" || activeSection === "grupos" || showGerenciarAlunosModal),
  });

    // Query para buscar grupos do banco de dados (Inclusão)
    const { data: gruposData = [], isLoading: isLoadinggrupos } = useQuery({
      queryKey: ['/api/turmas-inclusao'],
      queryFn: async () => {
        const response = await fetch('/api/turmas-inclusao', { credentials: "include" });
        if (!response.ok) throw new Error('Falha ao carregar grupos');
        return response.json();
      },
      enabled: vertente === 'inclusao',
      
    });

    // Mutation para criar novo aluno PEC
    const criarAlunoPecMutation = useMutation({
      mutationFn: async (data: any) => {
        return apiRequest('/api/monitor/pec/alunos', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/monitor/pec/alunos'] });
        toast({ title: "Aluno cadastrado!", description: "Aluno PEC criado com sucesso." });
        setShowCadastroModal(false);
        setCadastroForm({ nome_completo: '', nome: '', cpf: '', data_nascimento: '', dataNascimento: '', genero: '', telefone: '', email: '', endereco: '', escolaridade: '', idade: 0, programaAtual: '', observacoes: '', codigoMatricula: '', identificador: '', dataIngresso: '' });
      },
      onError: (error: any) => {
        toast({ title: "Erro ao cadastrar aluno", description: error.message || "Não foi possível criar o aluno. Tente novamente.", variant: "destructive" });
      }
    });

    // Mutation para criar novo participante de Inclusão
    const criarParticipanteMutation = useMutation({
      mutationFn: async (data: any) => {
        return apiRequest('/api/monitor/inclusao/participantes', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/monitor/inclusao/participantes'] });
        toast({ title: "Participante cadastrado!", description: "Participante criado com sucesso." });
        setShowCadastroModal(false);
        setCadastroForm({ nome_completo: '', nome: '', cpf: '', data_nascimento: '', dataNascimento: '', genero: '', telefone: '', email: '', endereco: '', escolaridade: '', idade: 0, programaAtual: '', observacoes: '', codigoMatricula: '', identificador: '', dataIngresso: '' });
        setFotoParticipante(null);
        setFotoParticipantePreview(null);
        setSelectedgrupoIds([]);
      },
      onError: (error: any) => {
        toast({ title: "Erro ao cadastrar participante", description: error.message || "Não foi possível criar o participante. Tente novamente.", variant: "destructive" });
      }
    });

    // Mutation para inativar aluno PEC
    const inativarAlunoMutation = useMutation({
      mutationFn: async (cpf: string) => {
        const response = await fetch(`/api/students/${cpf}/inativar`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Erro ao inativar aluno');
        return response.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/monitor/pec/alunos'] });
        toast({ title: "Aluno inativado", description: "O aluno foi inativado com sucesso." });
      },
      onError: (error: any) => {
        toast({ title: "Erro ao inativar aluno", description: error.message || "Não foi possível inativar o aluno. Tente novamente.", variant: "destructive" });
      }
    });

    // Mutation para reativar aluno PEC
    const reativarAlunoMutation = useMutation({
      mutationFn: async (cpf: string) => {
        const response = await fetch(`/api/students/${cpf}/reativar`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Erro ao reativar aluno');
        return response.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/monitor/pec/alunos'] });
        toast({ title: "Aluno reativado", description: "O aluno foi reativado com sucesso." });
      },
      onError: (error: any) => {
        toast({ title: "Erro ao reativar aluno", description: error.message || "Não foi possível reativar o aluno. Tente novamente.", variant: "destructive" });
      }
    });

    // Mutation para inativar participante Inclusão
    const inativarParticipanteMutation = useMutation({
      mutationFn: async (id: number) => {
        const response = await fetch(`/api/monitor/inclusao/participantes/${id}/inativar`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Erro ao inativar participante');
        return response.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/monitor/inclusao/participantes'] });
        toast({ title: "Participante inativado", description: "O participante foi inativado com sucesso." });
      },
      onError: (error: any) => {
        toast({ title: "Erro ao inativar participante", description: error.message || "Não foi possível inativar o participante. Tente novamente.", variant: "destructive" });
      }
    });

    // Mutation para reativar participante Inclusão
    const reativarParticipanteMutation = useMutation({
      mutationFn: async (id: number) => {
        const response = await fetch(`/api/monitor/inclusao/participantes/${id}/reativar`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Erro ao reativar participante');
        return response.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/monitor/inclusao/participantes'] });
        toast({ title: "Participante reativado", description: "O participante foi reativado com sucesso." });
      },
      onError: (error: any) => {
        toast({ title: "Erro ao reativar participante", description: error.message || "Não foi possível reativar o participante. Tente novamente.", variant: "destructive" });
      }
    });

    // Mutation para atualizar participante Inclusão
    const atualizarParticipanteMutation = useMutation({
      mutationFn: async ({ id, data }: { id: number; data: any }) => {
    const response = await fetch(`/api/monitor/inclusao/participantes/${id}`, {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId || ""
          },
          body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Erro ao atualizar participante');
        return response.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/monitor/inclusao/participantes'] });
        toast({ title: "Participante atualizado", description: "Dados atualizados com sucesso." });
        setShowEditParticipanteModal(false);
        setSelectedParticipante(null);
      },
      onError: (error: any) => {
        toast({ title: "Erro ao atualizar participante", description: error.message || "Não foi possível atualizar o participante. Tente novamente.", variant: "destructive" });
      }
    });

    // Mutation for creating atividade
    const createAtividadeMutation = useMutation({
      mutationFn: async (formData: any) => {
        console.log("[DEBUG FRONTEND] Iniciando mutation de criar atividade");
        console.log("[DEBUG FRONTEND] formData recebido:", formData);
        console.log("[DEBUG FRONTEND] userId:", userId);
        
        // Convert date string to ISO timestamp
        const dataToSend = {
          vertente,
          ...formData,
          data: formData.data ? new Date(formData.data + 'T00:00:00').toISOString() : null,
        };
        
        console.log("[DEBUG FRONTEND] dataToSend (após conversão):", dataToSend);
        console.log("[DEBUG FRONTEND] URL:", `/api/monitor/${userId}/atividades`);
        
        return apiRequest(`/api/monitor/${userId}/atividades`, {
          method: 'POST',
          body: JSON.stringify(dataToSend)
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/monitor/atividades', userId, vertente] });
        toast({ title: "Atividade criada!", description: "Nova atividade adicionada com sucesso." });
        setShowNovaAtividadeModal(false);
        setNovaAtividadeForm({
          titulo: '',
          descricao: '',
          tipo: 'reforco',
          grupo: '',
          grupoId: null,
          data: '',
          horarioInicio: '',
          horarioFim: '',
          local: '',
          participantesEsperados: 0,
          observacoes: '',
          materiaisNecessarios: []
        });
      },
      onError: (error: any) => {
        console.error("Erro ao criar atividade:", error);
        toast({ title: "Erro ao criar atividade", description: error.message || "Não foi possível criar atividade. Tente novamente.", variant: "destructive" });
      }
    });

    // Mutation for deleting atividade
    const deleteAtividadeMutation = useMutation({
      mutationFn: async (atividadeId: number) => {
        return apiRequest(`/api/monitor/atividades/${atividadeId}`, {
          method: 'DELETE'
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/monitor/atividades', userId, vertente] });
        toast({ title: "Atividade excluída!", description: "Atividade removida com sucesso." });
      },
      onError: (error: any) => {
        console.error("Erro ao excluir atividade:", error);
        toast({ title: "Erro ao excluir atividade", description: error.message || "Não foi possível excluir atividade. Tente novamente.", variant: "destructive" });
      }
    });
    
    // Mutation for editing atividade
    const editAtividadeMutation = useMutation({
      mutationFn: async (data: { id: number; titulo: string; descricao: string; data: string; horarioInicio: string; horarioFim: string; local: string; tipo: string }) => {
        return apiRequest(`/api/monitor/atividades/${data.id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/monitor/atividades', userId, vertente] });
        toast({ title: "Atualizado!", description: "Atividade/evento atualizado com sucesso." });
        setEditandoAtividade(null);
      },
       onError: (error: any) => {
          console.error("Erro ao atualizar atividade:", error);
          toast({
            title: "Erro ao atualizar atividade",
            description: error.message || "Não foi possível atualizar. Tente novamente.",
            variant: "destructive"
          });
        }
    });
    const {
      data: monitorGruposData = [],
      isLoading: gruposLoading,
      error: gruposError,
    } = useQuery({
      queryKey: ["/api/monitor/grupos", resolvedMonitorId, vertente],
      queryFn: async () => {
        const url = `/api/monitor/${resolvedMonitorId}/grupos?vertente=${encodeURIComponent(vertente)}`;

        console.log("[TURMAS] url:", url, {
          resolvedMonitorId,
          safeMonitorId,
          safeUserId,
          vertente,
        });

        const response = await fetch(url, {
          credentials: "include",
          headers: { "x-user-id": safeUserId },
        });

        const json = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(json?.error || "Falha ao carregar turmas");

        const lista = Array.isArray(json) ? json : (json?.data ?? []);

        // ✅ garante que diasSemana/horarioInicio/horarioFim existam no front
        return lista.map(normalizeTurma);
      },
      enabled: !!resolvedMonitorId && (vertente === "pec" || vertente === "inclusao"),
      staleTime: 0,
    });

    // Mutation for creating grupo
    const createGrupoMutation = useMutation({
    mutationFn: async (formData: any) => {
        return apiRequest(`/api/monitor/${monitorId}/grupos`, {
          method: "POST",
          body: JSON.stringify({ ...formData, vertente })
        });
      },
      onSuccess: async (novoGrupo: any) => {
        // Adicionar alunos selecionados à grupo
        if (alunosSelecionadosNovoGrupo.length > 0 && novoGrupo?.id) {
          for (const aluno of alunosSelecionadosNovoGrupo) {
            try {
              const isPec = vertente === 'pec';
              const body = isPec 
                ? { participanteCpf: aluno.cpf, participanteTipo: 'pec' }
                : { participanteId: aluno.id, participanteTipo: 'inclusao' };
              
                await apiRequest(`/api/monitor/${monitorId}/grupos/${novoGrupo.id}/alunos`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
                  body: JSON.stringify(body)
                });
            } catch (e) {
              console.error('Erro ao adicionar aluno à grupo:', e);
            }
          }
        }
        queryClient.invalidateQueries({ queryKey: ['/api/monitor/grupos', resolvedMonitorId, vertente] });
        toast({ title: "grupo criada!", description: `Nova grupo adicionado com ${alunosSelecionadosNovoGrupo.length} aluno(s).` });
        setShowNovoGrupoModal(false);
        setNovoGrupoForm({
          nome: '',
          nivel: '',
          alunos: 0,
          frequencia: '',
          atividade: '',
          horarioInicio: '',
          horarioFim: '',
          diasSemana: []
        });
        setAlunosSelecionadosNovoGrupo([]);
        setSearchNovoGrupo('');
      },
      onError: (error: any) => {
        toast({ 
          title: "Erro ao criar grupo", 
          description: error.message || "Não foi possível criar a grupo.",
          variant: "destructive" 
        });
      }
    });

    const { data: psicoAtendidos = [], isLoading: loadingAtendidos, error: psicoAtendidosError } = useQuery({
        queryKey: ["/api/psico/participantes", psicoVertente],
        queryFn: async () => {
          const filtroParam = psicoVertente === "pec" ? "pec" : psicoVertente === "inclusao" ? "inclusao" : "todos";
          const res = await fetch(
            `/api/psico/participantes?filtro=${filtroParam}`,
            { credentials: "include", headers: { "x-user-id": authUserId } }
          );
          const json = await res.json().catch(() => ({ participantes: [] }));
          if (!res.ok) throw new Error(json?.error || "Falha ao buscar atendidos");

          const arr = json?.participantes || [];
          return arr.map((a: any) => ({
            ...a,
            __vertente: a.programa_origem || "pec",
            __nome: (a.nome || "-").replace(/^\s+|\s+$/g, ''),
            __doc: String(a.cpf || a.participante_id || ""),
            __turmaId: "",
            __turmaNome: a.programa_origem === "inclusao" ? "Inclusão Produtiva" : "PEC",
          }));
        },
        enabled: isPsico && !!authUserId,
      });
  const { data: psicoTurmas = [], isLoading: loadingTurmas } = useQuery({
    queryKey: ["/api/monitor/psico/turmas", safeMonitorId, psicoVertente],
    queryFn: async () => {
      const headers = { "x-user-id": safeUserId };
      const fetchTurmas = async (v: "pec" | "inclusao") => {
        const res = await fetch(
          `/api/monitor/${safeMonitorId}/grupos?vertente=${encodeURIComponent(v)}`,
          { credentials: "include", headers }
        );
        const json = await res.json().catch(() => ([]));
        if (!res.ok) throw new Error(json?.error || `Falha ao buscar turmas (${v})`);
        const arr = Array.isArray(json) ? json : (json?.data ?? []);
        return arr.map((t: any) => ({ ...normalizeTurma(t), __vertente: v }));
      };

      if (psicoVertente === "pec") return await fetchTurmas("pec");
      if (psicoVertente === "inclusao") return await fetchTurmas("inclusao");

      const [pec, inc] = await Promise.all([fetchTurmas("pec"), fetchTurmas("inclusao")]);
      return [...pec, ...inc];
    },
    enabled: isPsico && !!safeMonitorId && !!safeUserId,
  });
  const { data: psicoChamadasData = { chamadas: [] }, isLoading: loadingChamadas } = useQuery({
    queryKey: ["/api/psico/chamadas", psicoChamadaPrograma, psicoChamadaTurmaId],
    queryFn: async () => {
      let url = `/api/psico/chamadas?programa=${psicoChamadaPrograma}`;
      if (psicoChamadaTurmaId) url += `&turmaId=${psicoChamadaTurmaId}`;
      const res = await fetch(url, {
        credentials: "include",
        headers: { "x-user-id": authUserId },
      });
      const json = await res.json().catch(() => ({ chamadas: [] }));
      if (!res.ok) throw new Error(json?.error || "Falha ao buscar chamadas");
      return json;
    },
    enabled: isPsico && !!authUserId && psicoTab === "frequencia",
  });
  const psicoHistoricoChamadas = psicoChamadasData?.chamadas || [];

  const { data: psicoChamadaTurmas = [] } = useQuery({
    queryKey: ["/api/monitor/psico/chamada-turmas", resolvedMonitorId, psicoChamadaPrograma],
    queryFn: async () => {
      if (psicoChamadaPrograma === "pec") {
        const res = await fetch("/api/pec/instances", { credentials: "include" });
        const json = await res.json().catch(() => []);
        if (!res.ok) return [];
        const arr = Array.isArray(json) ? json : [];
        return arr.map((t: any) => ({ id: t.id, nome: t.name || t.title || `Turma ${t.id}`, __vertente: "pec" }));
      }
      const mid = resolvedMonitorId || safeUserId;
      const res = await fetch(
        `/api/monitor/${mid}/grupos?vertente=inclusao`,
        { credentials: "include", headers: { "x-user-id": safeUserId } }
      );
      const json = await res.json().catch(() => []);
      if (!res.ok) return [];
      const arr = Array.isArray(json) ? json : (json?.data ?? []);
      return arr.map((t: any) => ({ ...normalizeTurma(t), __vertente: "inclusao" }));
    },
    enabled: isPsico && !!(resolvedMonitorId || safeUserId) && psicoTab === "frequencia",
  });

  const { data: psicoAtivTurmas = [] } = useQuery({
    queryKey: ["/api/monitor/psico/ativ-turmas", resolvedMonitorId, psicoAtivPrograma],
    queryFn: async () => {
      if (psicoAtivPrograma === "pec") {
        const res = await fetch("/api/pec/instances", { credentials: "include" });
        const json = await res.json().catch(() => []);
        if (!res.ok) return [];
        const arr = Array.isArray(json) ? json : [];
        return arr.map((t: any) => ({ id: t.id, nome: t.name || t.title || `Turma ${t.id}`, __vertente: "pec" }));
      }
      const mid = resolvedMonitorId || safeUserId;
      const res = await fetch(
        `/api/monitor/${mid}/grupos?vertente=inclusao`,
        { credentials: "include", headers: { "x-user-id": safeUserId } }
      );
      const json = await res.json().catch(() => []);
      if (!res.ok) return [];
      const arr = Array.isArray(json) ? json : (json?.data ?? []);
      return arr.map((t: any) => ({ ...normalizeTurma(t), __vertente: "inclusao" }));
    },
    enabled: isPsico && !!(resolvedMonitorId || safeUserId) && psicoTab === "atividades",
  });

  const { data: psicoAtivChamadasData = { chamadas: [] } } = useQuery({
    queryKey: ["/api/psico/chamadas-ativ", psicoAtivPrograma, psicoAtividadeForm.turmaId],
    queryFn: async () => {
      if (!psicoAtividadeForm.turmaId) return { chamadas: [] };
      const url = `/api/psico/chamadas?programa=${psicoAtivPrograma}&turmaId=${psicoAtividadeForm.turmaId}`;
      const res = await fetch(url, {
        credentials: "include",
        headers: { "x-user-id": authUserId },
      });
      const json = await res.json().catch(() => ({ chamadas: [] }));
      if (!res.ok) return { chamadas: [] };
      return json;
    },
    enabled: isPsico && !!authUserId && psicoTab === "atividades" && !!psicoAtividadeForm.turmaId,
  });

 const { data: psicoAtividades = [], isLoading: loadingAtividades } = useQuery({
  queryKey: ["/api/monitor/atividades", monitorUserId, psicoVertente, "psicossocial"],
  queryFn: async () => {
    const res = await fetch(
      `/api/monitor/${monitorUserId}/atividades?vertente=${encodeURIComponent(psicoVertente)}&contexto=psicossocial`,
      {
        credentials: "include",
        headers: { "x-user-id": monitorUserId },
      }
    );
    const json = await res.json().catch(() => ([]));
    if (!res.ok) throw new Error(json?.error || "Falha ao buscar atividades");
    return Array.isArray(json) ? json : [];
  },
  enabled: isPsico && !!monitorUserId && psicoTab === "atividades",
});

  // Query para acompanhamentos pedagógicos dos professores (monitor psico)
  const { data: todosAcompanhamentosPsico = [] } = useQuery({
    queryKey: ['/api/professor/acompanhamentos/all'],
    queryFn: async () => {
      const res = await fetch('/api/professor/acompanhamentos/all');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isPsico && psicoTab === 'acompanhamentos',
  });

  const { data: psicoRegistrosConf = [], isLoading: loadingRegistrosConf } = useQuery({
    queryKey: ["/api/monitor/registros-confidenciais", monitorUserId, psicoVertente],
    queryFn: async () => {
      const res = await fetch(
        `/api/monitor/${monitorUserId}/registros-confidenciais?vertente=${encodeURIComponent(psicoVertente)}`,
        { credentials: "include", headers: { "x-user-id": monitorUserId } }
      );
      const json = await res.json().catch(() => ([]));
      if (!res.ok) throw new Error(json?.error || "Falha ao buscar registros");
      return Array.isArray(json) ? json : [];
    },
    enabled: isPsico && !!monitorUserId && (psicoTab === "confidencial" || psicoTab === "atendidos"),
  });

  const { data: registrosGerais = [], isLoading: loadingRegistrosGerais } = useQuery({
    queryKey: ["/api/monitor/registros-gerais", monitorUserId],
    queryFn: async () => {
      const res = await fetch(
        `/api/monitor/${monitorUserId}/registros-gerais`,
        { credentials: "include", headers: { "x-user-id": monitorUserId } }
      );
      const json = await res.json().catch(() => ([]));
      if (!res.ok) throw new Error(json?.error || "Falha ao buscar registros gerais");
      return Array.isArray(json) ? json : [];
    },
    enabled: isPsico && !!monitorUserId && psicoTab === "registros",
  });

  const { data: atendidosComunidade = [] } = useQuery({
    queryKey: ["/api/psico/atendidos-comunidade"],
    queryFn: async () => {
      const res = await fetch(`/api/psico/atendidos-comunidade`, { credentials: "include" });
      const json = await res.json().catch(() => ([]));
      return Array.isArray(json) ? json : [];
    },
    enabled: isPsico && (psicoTab === "registros" || psicoTab === "confidencial"),
  });

  const { data: psicoAtendidosRegistrados = [], isLoading: loadingAtendidosRegistrados } = useQuery({
    queryKey: ["/api/psico/atendidos-registrados", monitorUserId],
    queryFn: async () => {
      const res = await fetch(
        `/api/psico/atendidos-registrados?monitorUserId=${monitorUserId}`,
        { credentials: "include", headers: { "x-user-id": authUserId } }
      );
      const json = await res.json().catch(() => ({ atendidos: [] }));
      if (!res.ok) throw new Error(json?.error || "Falha ao buscar atendidos registrados");
      return json.atendidos || [];
    },
    enabled: isPsico && !!monitorUserId && psicoTab === "atendidos",
  });

  const { data: psicoDashStats } = useQuery({
    queryKey: ["/api/psico/dashboard-stats"],
    queryFn: async () => {
      const res = await fetch(
        `/api/psico/dashboard-stats?ano=${new Date().getFullYear()}`,
        { credentials: "include", headers: { "x-user-id": authUserId } }
      );
      const json = await res.json().catch(() => ({ data: {} }));
      return json.data || {};
    },
    enabled: isPsico,
  });

  const { data: colaboradoresData } = useQuery<any>({
    queryKey: ["/api/colaboradores"],
    queryFn: async () => {
      const res = await fetch(`/api/colaboradores?pageSize=200`, { credentials: "include" });
      return res.json();
    },
    enabled: isPsico,
  });
  const todosColaboradores: any[] = (colaboradoresData?.items || []).sort((a: any, b: any) => a.nome.localeCompare(b.nome));

  const [selectedAtendido, setSelectedAtendido] = useState<any>(null);
  const [selectedAtendidoPerfil, setSelectedAtendidoPerfil] = useState<any>(null);
  const [loadingAtendidoPerfil, setLoadingAtendidoPerfil] = useState(false);

  const abrirPerfilPsico = async (atendido: any) => {
    setSelectedAtendido(atendido);
    setSelectedAtendidoPerfil(null);
    if (!atendido?.cpf) return;
    setLoadingAtendidoPerfil(true);
    try {
      const cpfLimpo = atendido.cpf.replace(/\D/g, '');
      const res = await fetch(`/api/psico/atendido-perfil?cpf=${cpfLimpo}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.perfil) setSelectedAtendidoPerfil(data.perfil);
    } catch (e) { /* silencioso */ }
    setLoadingAtendidoPerfil(false);
  };

  const createPsicoAtividadeMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/monitor/${monitorUserId}/atividades?contexto=psicossocial`, {
        method: "POST",
        body: JSON.stringify({ ...data, vertente: data.vertente || psicoVertente, contexto: "psicossocial" }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monitor/atividades", monitorUserId, psicoVertente, "psicossocial"] });
      toast({ title: "Atividade registrada com sucesso!" });
      setPsicoNovaAtividade(false);
      setPsicoAtivSubTab("lista");
      setPsicoAtividadeForm({ titulo: "", descricao: "", tipo: "roda_de_conversa", data: "", horarioInicio: "08:00", horarioFim: "10:00", turmaId: "", observacao: "" });
      setPsicoAtivDiasAula([]);
      setPsicoAtivChamada({loaded: false, exists: false, presencas: [], editMode: false});
    },
    onError: (error: any) => toast({ title: "Erro ao registrar atividade", description: error.message || "Tente novamente.", variant: "destructive" }),
  });

  const createRegistroConfMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/monitor/${monitorUserId}/registros-confidenciais`, {
        method: "POST",
        body: JSON.stringify({ ...data, titulo: data.vulnerabilidade, vertente: psicoVertente }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monitor/registros-confidenciais", monitorUserId, psicoVertente] });
      queryClient.invalidateQueries({ queryKey: ["/api/psico/atendidos-registrados", monitorUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/psico/dashboard-stats"] });
      toast({ title: "Registro salvo!" });
      setPsicoNovoRegistro(false);
      setConfSubTab("realizados");
      setPsicoRegistroForm({ vulnerabilidade: "baixa_vulnerabilidade", tipo: "atendimento_individual", conteudo: "", participanteNome: "", participanteCpf: "", participanteDataNascimento: "", data: new Date().toISOString().split("T")[0] });
    },
    onError: (error: any) => toast({ title: "Erro ao salvar registro", description: error.message || "Tente novamente.", variant: "destructive" }),
  });

  const deleteRegistroConfMutation = useMutation({
    mutationFn: async (registroId: number) => {
      return apiRequest(`/api/monitor/${monitorUserId}/registros-confidenciais/${registroId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monitor/registros-confidenciais", monitorUserId, psicoVertente] });
      toast({ title: "Registro excluído!" });
    },
    onError: (error: any) => toast({ title: "Erro ao excluir registro", description: error.message || "Tente novamente.", variant: "destructive" }),
  });

  const [editRegistroId, setEditRegistroId] = useState<number | null>(null);
  const [editRegistroForm, setEditRegistroForm] = useState({ vulnerabilidade: "baixa_vulnerabilidade", tipo: "", conteudo: "", participanteNome: "", data: "" });
  const [editRegistroPartBusca, setEditRegistroPartBusca] = useState("");
  const [editRegistroPartOpen, setEditRegistroPartOpen] = useState(false);

  const updateRegistroConfMutation = useMutation({
    mutationFn: async ({ id, ...body }: { id: number; vulnerabilidade: string; tipo: string; conteudo: string; participanteNome: string; data: string }) => {
      return apiRequest(`/api/monitor/${monitorUserId}/registros-confidenciais/${id}`, {
        method: "PUT",
        body: JSON.stringify({ ...body, titulo: body.vulnerabilidade }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monitor/registros-confidenciais", monitorUserId, psicoVertente] });
      toast({ title: "Registro atualizado!" });
      setEditRegistroId(null);
    },
    onError: (error: any) => toast({ title: "Erro ao atualizar registro", description: error.message || "Tente novamente.", variant: "destructive" }),
  });

  const createRegistroGeralMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/monitor/${monitorUserId}/registros-gerais`, {
        method: "POST",
        body: JSON.stringify({ ...data, vertente: psicoVertente }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monitor/registros-gerais", monitorUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/psico/dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/psico/atendidos-registrados", monitorUserId] });
      toast({ title: "Registro salvo!" });
      setRegistrosSubTab("realizados");
      setRegistroGeralForm({ categoria: "atendimento_individual", conteudo: "", participanteNome: "", participanteCpf: "", participanteDataNascimento: "", data: new Date().toISOString().split("T")[0] });
      setEspGritoParticipantes([]);
      setEspGritoColaboradoresIds([]);
      setEspGritoColabBusca("");
      setRegistroGeralPartBusca("");
    },
    onError: (error: any) => toast({ title: "Erro ao salvar registro", description: error.message || "Tente novamente.", variant: "destructive" }),
  });

  const deleteRegistroGeralMutation = useMutation({
    mutationFn: async (registroId: number) => {
      return apiRequest(`/api/monitor/${monitorUserId}/registros-gerais/${registroId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monitor/registros-gerais", monitorUserId] });
      toast({ title: "Registro excluído!" });
    },
    onError: (error: any) => toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" }),
  });

  const updateRegistroGeralMutation = useMutation({
    mutationFn: async ({ id, ...body }: { id: number; tipo: string; conteudo: string; data: string; colaboradoresIds?: number[] | null }) => {
      return apiRequest(`/api/monitor/${monitorUserId}/registros-gerais/${id}`, { method: "PUT", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monitor/registros-gerais", monitorUserId] });
      toast({ title: "Registro atualizado!" });
      setEditGeraisGeralId(null);
      setEditGeraisColaboradoresIds([]);
      setEditGeraisColabBusca("");
    },
    onError: (error: any) => toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" }),
  });



  const savePsicoChamadaMutation = useMutation({
    mutationFn: async () => {
      if (!psicoChamadaTurmaId || !psicoChamadaData) throw new Error("Turma e data obrigatórios");
      return apiRequest(`/api/monitor/${monitorUserId}/registro-presenca`, {
        method: "POST",
        body: JSON.stringify({
          vertente: psicoVertente,
          grupoId: parseInt(psicoChamadaTurmaId),
          data: psicoChamadaData,
          observacoes: "",
          presencas: psicoPresencas.map(p => ({ alunoCpf: p.alunoCpf, alunoNome: p.nome, presente: p.presente, justificativa: p.justificativa || '' })),
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monitor/historico-chamadas", monitorUserId, psicoVertente] });
      toast({ title: "Chamada salva com sucesso!" });
      setPsicoPresencas([]);
      setPsicoChamadaData("");
    },
    onError: (error: any) => toast({ title: "Erro ao salvar chamada", description: error.message || "Tente novamente.", variant: "destructive" }),
  });

      // Mutation for updating grupo
    const updateGrupoMutation = useMutation({
      mutationFn: async ({ grupoId, formData }: { grupoId: number; formData: any }) => {
        const payload = buildGrupoPayload(formData); // ✅ agora existe

        const mid = Number(resolvedMonitorId); // ✅ usa o monitorId resolvido
        const url = `/api/monitor/${mid}/grupos/${grupoId}?vertente=${encodeURIComponent(vertente)}`;

        const response = await fetch(url, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": safeUserId || "", // ✅ mantém seu header padrão
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        const json = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(json?.error || "Falha ao atualizar turma");
        }

        return json; // ✅ importante retornar algo
      },

      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/monitor/grupos", resolvedMonitorId, vertente] });
        queryClient.invalidateQueries({ queryKey: ['/api/turmas-inclusao'] });
        queryClient.invalidateQueries({ queryKey: ['/api/professor/turmas'] });
        toast({ title: "Turma atualizada!", description: "As alterações foram salvas." });
        setShowEditarGrupoModal(false);
        setGrupoSelecionado(null);
      },

      onError: (error: any) => {
        toast({
          title: "Erro ao atualizar turma",
          description: error.message || "Não foi possível atualizar a turma.",
          variant: "destructive",
        });
      },
    });

    const reativarTurmaMutation = useMutation({
      mutationFn: async (grupo: any) => {
        if (vertente === 'pec') {
          const resp = await fetch(`/api/pec/instances/${grupo.id}/reativar`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'x-user-id': safeUserId || '' },
          });
          if (!resp.ok) throw new Error('Erro ao reativar turma PEC');
          return resp.json();
        } else {
          const resp = await fetch(`/api/turmas-inclusao/${grupo.id}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'x-user-id': safeUserId || '' },
            body: JSON.stringify({ status: 'ativo' }),
          });
          if (!resp.ok) throw new Error('Erro ao reativar turma');
          return resp.json();
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/monitor/grupos", resolvedMonitorId, vertente] });
        queryClient.invalidateQueries({ queryKey: ['/api/turmas-inclusao'] });
        toast({ title: "Turma reativada!", description: "A turma foi reativada com sucesso." });
      },
      onError: (error: any) => {
        toast({ title: "Erro ao reativar turma", description: error.message || "Não foi possível reativar a turma.", variant: "destructive" });
      },
    });

    // Query for registros
    const { data: registrosData, isLoading: registrosLoading } = useQuery({
      queryKey: ['/api/monitor/registros', userId, vertente],
      queryFn: async () => {
      const response = await fetch(`/api/monitor/${userId}/registros?vertente=${vertente}`, {
          credentials: "include",
          headers: { 'x-user-id': userId || '' }
        });
        if (!response.ok) throw new Error('Falha ao carregar registros');
        return response.json();
      },
      enabled: !!userId && (activeSection === 'registro' || activeSection === 'relatorios'),
      
    });

    // Query to fetch students when a group is selected
  const effectivePresencaVertente = (presencaVertente === "pec" || presencaVertente === "inclusao") ? presencaVertente : vertente;
  const { data: grupoAlunosData, isLoading: grupoAlunosLoading, error: grupoAlunosError } = useQuery({
    queryKey: ['/api/monitor/grupos/alunos', userId, presencaGrupo, effectivePresencaVertente],
    queryFn: async () => {
    const url = `/api/monitor/${resolvedMonitorId}/grupos/${presencaGrupo}/alunos?vertente=${encodeURIComponent(effectivePresencaVertente)}`


      const response = await fetch(url, {
        credentials: "include",
        headers: { 'x-user-id': userId || '' }
      });

      const json = await response.json().catch(() => (null));

      if (!response.ok) {
        throw new Error(json?.error || 'Falha ao carregar alunos da turma');
      }

      // ✅ Normaliza: API pode retornar array OU objeto com campo
      const lista =
        Array.isArray(json) ? json :
        Array.isArray(json?.alunos) ? json.alunos :
        Array.isArray(json?.students) ? json.students :
        Array.isArray(json?.participantes) ? json.participantes :
        Array.isArray(json?.data) ? json.data :
        [];

      // debug rápido pra você ver no console
      console.log('[PRESENCA] url:', url);
      console.log('[PRESENCA] raw json:', json);
      console.log('[PRESENCA] lista normalizada:', lista);

      return lista;
    },
    enabled:
      !!userId &&
      !!presencaGrupo &&
      activeSection === 'presenca' &&
      (effectivePresencaVertente === "pec" || effectivePresencaVertente === "inclusao")
  });

  const { data: monitorCatracaLog, refetch: refetchMonitorCatracaLog } = useQuery<{ data: string; entradas: any[]; total: number }>({
    queryKey: ['/api/webhook/presenca-log'],
    enabled: activeSection === 'presenca',
    refetchInterval: 30000,
  });

  const { data: monitorPecSession } = useQuery<any>({
    queryKey: ['/api/pec/session-by-date-monitor', presencaGrupo, presencaData],
    queryFn: async () => {
      const res = await fetch(`/api/pec/sessions?activity_instance_id=${presencaGrupo}&date=${presencaData}`, { credentials: 'include' });
      if (!res.ok) return null;
      const sessions = await res.json();
      if (Array.isArray(sessions)) {
        return sessions.find((s: any) => String(s.activity_instance_id) === String(presencaGrupo) && String(s.date).slice(0, 10) === presencaData) || null;
      }
      return null;
    },
    enabled: !!presencaGrupo && !!presencaData && activeSection === 'presenca' && effectivePresencaVertente === 'pec' && !editingChamadaId,
  });

  useEffect(() => {
    if (activeSection !== 'presenca') return;
    const es = new EventSource("/api/webhook/presenca-events");
    es.onopen = () => setCatracaConnected(true);
    es.onerror = () => setCatracaConnected(false);
    es.onmessage = (event) => {
      if (event.data === "connected") return;
      try {
        const data = JSON.parse(event.data);
        if (data.tipo === "presenca") {
          refetchMonitorCatracaLog();
          if (data.vertente === "pec") {
            queryClient.invalidateQueries({ queryKey: ['/api/pec/session-by-date-monitor', presencaGrupo, presencaData] });
          }
          setCatracaApplied(false);
        }
      } catch (_) {}
    };
    return () => { es.close(); setCatracaConnected(false); };
  }, [activeSection, presencaGrupo, presencaData]);

  useEffect(() => {
    if (editingChamadaId) return;
    if (Array.isArray(grupoAlunosData)) {
      const mapped = grupoAlunosData
        .map((aluno: any) => ({
          alunoCpf: String(
            aluno.cpf ||
            aluno.alunoCpf ||
            aluno.id ||
            aluno.participanteCpf ||
            aluno.participante_id ||
            ""
          ),
          nome: aluno.nome || aluno.nome_completo || aluno.alunoNome || aluno.nomeCompleto || "Sem nome",
          presente: false,
          justificativa: ''
        }))
        .filter((p) => p.alunoCpf && p.alunoCpf !== "undefined");

      setCatracaApplied(false);
      setModoManual(false);
      setPresencas(mapped);
    } else {
      setPresencas([]);
    }
  }, [grupoAlunosData, editingChamadaId]);

  useEffect(() => {
    if (editingChamadaId) return;
    if (effectivePresencaVertente !== 'pec') return;
    if (!monitorPecSession?.attendance) return;
    if (presencas.length === 0) return;
    const attendance = monitorPecSession.attendance as any[];
    const catracaEntries = attendance.filter((a: any) => a.origemCatraca === true && a.presente === true);
    if (catracaEntries.length === 0) return;
    if (catracaApplied) return;

    const catracaCpfMap = new Map(catracaEntries.map((a: any) => [a.alunoCpf, a]));
    const updated = presencas.map(p => {
      const entry = catracaCpfMap.get(p.alunoCpf);
      if (entry) {
        return { ...p, presente: true, viaCatraca: true, horaEntrada: entry.horaEntrada };
      }
      return p;
    });
    setCatracaApplied(true);
    setPresencas(updated);
  }, [monitorPecSession, presencas.length, editingChamadaId, catracaApplied, effectivePresencaVertente]);

    // Query para buscar histórico de chamadas
    const { data: historicoChamadas, isLoading: historicoLoading, refetch: refetchHistorico } = useQuery({
      queryKey: ['/api/monitor/historico-chamadas', userId, vertente],
      queryFn: async () => {
      const response = await fetch(`/api/monitor/${userId}/historico-chamadas?vertente=${vertente}`, {
          credentials: "include",
          headers: { 'x-user-id': userId || '' }
        });
        if (!response.ok) throw new Error('Falha ao carregar histórico');
        return response.json();
      },
      enabled:
      !!userId &&
      (vertente === "pec" || vertente === "inclusao") &&
      (activeSection === "dashboard" || activeSection === "presenca" || activeSection === "relatorios"),
      
    });

    // Calcular dias de aula quando turma muda (inclusao/pec)
    const prevPresencaGrupoRef = useRef<string>('');
    useEffect(() => {
      if (!presencaGrupo || (effectivePresencaVertente !== "pec" && effectivePresencaVertente !== "inclusao")) {
        setDiasAulaDisponiveis([]);
        setPresencaData("");
        prevPresencaGrupoRef.current = '';
        return;
      }
      if (presencaVertente !== effectivePresencaVertente) {
        setPresencaVertente(effectivePresencaVertente as MonitorVertente);
      }

      let turma: any = null;
      if (effectivePresencaVertente === 'inclusao') {
        turma = (gruposData || []).find((t: any) => String(t.id) === String(presencaGrupo))
          || (monitorGruposData || []).find((t: any) => String(t.id) === String(presencaGrupo));
      } else {
        const gruposArray = (monitorGruposData?.length ? monitorGruposData : gruposData) || [];
        const turmaRaw = gruposArray.find((t: any) => String(t.id) === String(presencaGrupo));
        turma = normalizeTurma(turmaRaw);
      }

      if (!turma) {
        setDiasAulaDisponiveis([]);
        setPresencaData("");
        return;
      }

      const todosDias = getDiasAulaParaTurma(turma);

      const datasComChamada = new Set(
        (Array.isArray(historicoChamadas) ? historicoChamadas : [])
          .filter((c: any) => String(c.grupoId || c.turmaId) === String(presencaGrupo))
          .map((c: any) => normalizeToYMD(c.dataAtividade || c.data))
      );

      if (editingChamadaId && presencaData) {
        const editingDate = presencaData;
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
        const turmaChanged = prevPresencaGrupoRef.current !== presencaGrupo;
        if (turmaChanged) {
          prevPresencaGrupoRef.current = presencaGrupo;
          setPresencaData(dias?.[0]?.date || "");
        } else if (!presencaData || !dias?.some(d => d.date === presencaData)) {
          setPresencaData(dias?.[0]?.date || "");
        }
      }
    }, [presencaGrupo, presencaVertente, vertente, monitorGruposData, gruposData, presencaData, historicoChamadas, editingChamadaId]);

    // Mutation for creating registro
    const createRegistroMutation = useMutation({
      mutationFn: async (formData: any) => {
        return apiRequest(`/api/monitor/${userId}/registros`, {
          method: 'POST',
          body: JSON.stringify({ ...formData, vertente })
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/monitor/registros', userId, vertente] });
        toast({ title: "Registro criado!", description: "Atividade registrada com sucesso." });
        setRegistroForm({
          atividadeId: null,
          grupoId: null,
          dataAtividade: new Date().toISOString().split('T')[0],
          grupo: '',
          titulo: '',
          descricao: '',
          duracaoMinutos: '',
          participantes: '',
          resultadosObservacoes: '',
          presencas: []
        });
      },
      onError: (error: any) => {
        console.error("Erro ao criar registro:", error);
        toast({ title: "Erro ao criar registro", description: error.message || "Não foi possível criar registro. Tente novamente.", variant: "destructive" });
      }
    });

    // Mutation to save attendance (usando nova rota que funciona com grupos diretamente)
    const saveChamadaMutation = useMutation({
      mutationFn: async (vars?: { teveAlimentacao?: boolean | null }) => {
        if (!presencaGrupo || !presencaData) {
          throw new Error('Grupo e data são obrigatórios');
        }
        if (!fotoFile && !editingChamadaId) {
          throw new Error('É obrigatório enviar a foto comprovante para finalizar a chamada.');
        }
        
        if (editingChamadaId) {
          if (effectivePresencaVertente === 'inclusao') {
            const response = await apiRequest(`/api/presencas-inclusao/editar`, {
              method: 'PUT',
              body: JSON.stringify({
                chamadaId: editingChamadaId,
                turmaId: parseInt(presencaGrupo),
                data: presencaData,
                teveAlimentacao: editingTeveAlimentacao,
                presencas: presencas.map(p => ({
                  alunoCpf: p.alunoCpf,
                  alunoNome: p.nome,
                  presente: p.presente,
                  justificativa: p.justificativa || '',
                  justificativaMotivo: p.justificativaMotivo || null,
                  justificativaObs: p.justificativaObs || null,
                  contaComoPresenca: p.contaComoPresenca ?? false,
                }))
              })
            });
            return response;
          } else {
            const sessionIdStr = String(editingChamadaId).replace('pec_', '');
            const sessionId = parseInt(sessionIdStr);
            const response = await apiRequest(`/api/pec/sessions/${sessionId}/editar`, {
              method: 'PUT',
              body: JSON.stringify({
                teveAlimentacao: editingTeveAlimentacao,
                attendance: presencas.map(p => ({
                  alunoCpf: p.alunoCpf,
                  alunoNome: p.nome,
                  presente: p.presente,
                  justificativa: p.justificativa || '',
                  status: !p.presente && p.justificativa && p.justificativa !== 'Sem justificativa' ? 'falta_justificada' : (p.presente ? 'presente' : 'falta')
                }))
              })
            });
            return response;
          }
        }
        
        const response = await apiRequest(`/api/monitor/${userId}/registro-presenca`, {
          method: 'POST',
          body: JSON.stringify({
            vertente: effectivePresencaVertente,
            grupoId: parseInt(presencaGrupo),
            data: presencaData,
            observacoes: '',
            teve_alimentacao: vars?.teveAlimentacao ?? null,
            presencas: presencas.map(p => ({
              alunoCpf: p.alunoCpf,
              alunoNome: p.nome,
              presente: p.presente,
              justificativa: p.justificativa || '',
              justificativaMotivo: p.justificativaMotivo || null,
              justificativaObs: p.justificativaObs || null,
              contaComoPresenca: p.contaComoPresenca ?? false,
              ...(p.viaCatraca ? { origemCatraca: true, horaEntrada: p.horaEntrada } : {})
            }))
          })
        });
        
        return response;
      },
      onSuccess: async () => {
        queryClient.invalidateQueries({ queryKey: ['/api/monitor/historico-chamadas', userId, vertente] });
        
        if (fotoFile && effectivePresencaVertente === 'inclusao') {
          try {
            const formData = new FormData();
            formData.append('foto', fotoFile);
            formData.append('turmaId', presencaGrupo);
            formData.append('data', presencaData);
            await fetch('/api/presencas-inclusao/foto', {
              method: 'POST',
              body: formData,
              credentials: 'include',
              headers: { 'x-user-id': userId || '' }
            });
          } catch (e) {
            console.error('Erro ao enviar foto:', e);
          }
        }
        
        toast({ 
          title: editingChamadaId ? "Chamada atualizada!" : "Chamada finalizada!", 
          description: editingChamadaId ? "Chamada editada com sucesso." : "Presença registrada com sucesso." 
        });
        setPresencaGrupo('');
        setPresencas([]);
        setFotoFile(null);
        setExistingFotoUrl(null);
        setEditingChamadaId(null);
        setEditingTeveAlimentacao(null);
      },
      onError: (error: any) => {
        console.error("Erro ao salvar chamada:", error);
        toast({ 
          title: "Erro ao salvar chamada", 
          description: error.message || "Não foi possível salvar a chamada. Tente novamente.", 
          variant: "destructive" 
        });
      }
    });

    useEffect(() => {
      if (!showEditarGrupoModal) return;
      if (!grupoSelecionado) return;

      const g = normalizeTurma(grupoSelecionado);

      setEditarGrupoForm({
        nome: g.nome ?? g.title ?? "",
        nivel: g.nivel ?? "",
        atividade: g.atividade ?? "",
        alunos: Number(g.alunos ?? g.participantesEsperados ?? 0),

        // status pode vir "ativo"/"inativo" ou "Ativo" etc
        status: String(g.status ?? g.situation ?? "ativo").toLowerCase(),

        horarioInicio: g.horarioInicio ?? "",
        horarioFim: g.horarioFim ?? "",
        diasSemana: Array.from(
          new Set(Array.isArray(g.diasSemana) ? g.diasSemana : [])
        )
      });
    }, [showEditarGrupoModal, grupoSelecionado]);

    const handleLogout = () => {
      localStorage.clear();
      sessionStorage.clear();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso."
      });
      setTimeout(() => window.location.href = "/login/monitor", 500);
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
    const listaAtendidosBase = (psicoAtendidos ?? []) as any[];

    const atendidosFiltrados = listaAtendidosBase.filter((a: any) => {
      const termo = String(buscaAtendido ?? "").toLowerCase().trim();
      if (!termo) return true;

      const nome =
        String(a?.nome ?? a?.nome_completo ?? a?.alunoNome ?? "").toLowerCase();

      const cpf = String(a?.cpf ?? a?.alunoCpf ?? "").toLowerCase();

      return nome.includes(termo) || cpf.includes(termo);
    });

    const atendidosFiltradosPorTurma = selectedTurmaId
      ? atendidosFiltrados.filter((a: any) =>
          String(a?.grupoId ?? a?.turmaId ?? a?.grupo_id ?? a?.turma_id ?? "") ===
          String(selectedTurmaId)
        )
      : atendidosFiltrados;

      const formatDateBR = (ymd?: string) => {
      if (!ymd) return "Não definida";
      // joga meio-dia pra não dar shift de timezone
      return new Date(`${ymd}T12:00:00`).toLocaleDateString("pt-BR");
    };


    if (!isPsico && dashboardLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando área do monitor...</p>
          </div>
        </div>
      );
    }

  if (vertente === 'selecao') {
        if (isPsico) {
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Redirecionando para Psicossocial...</p>
            </div>
          </div>
        );
      }
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Área do Monitor</h1>
            <p className="text-gray-600">Bem-vindo, {userName}! Selecione seu programa de atuação:</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 hover:border-yellow-500"
              onClick={() => setLocation('/monitor/pec')}
            >
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-10 h-10 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">PEC</h2>
                <p className="text-gray-600 mb-4">
                  Programa de Esporte e Cultura
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Cadastro e acompanhamento de alunos do programa de esporte e cultura
                </p>
                <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white">
                  Acessar PEC
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
            
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 hover:border-yellow-500"
              onClick={() => setLocation('/monitor/inclusao')}
            >
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-10 h-10 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Inclusão Produtiva</h2>
                <p className="text-gray-600 mb-4">
                  Programa de Inclusão Produtiva
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Cadastro e acompanhamento de participantes do programa de inclusão produtiva
                </p>
                <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white">
                  Acessar Inclusão
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-8">
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    );
  }

    const vertenteInfo: Record<MonitorVertente, { nome: string; cor: string; icon: any }> = {
      pec: { nome: "PEC - Esporte e Cultura", cor: "orange", icon: GraduationCap },
      inclusao: { nome: "Inclusão Produtiva", cor: "green", icon: Briefcase },
      psico: { nome: "Psicossocial", cor: "purple", icon: HeartHandshake ?? Shield ?? UserCheck },
      selecao: { nome: "Monitor", cor: "gray", icon: UserCheck },
    };

  const currentVertente = vertenteInfo[vertente] ?? vertenteInfo.selecao;
  const VertenteIcon = currentVertente?.icon ?? UserCheck;
   const buildGrupoPayload = (form: any) => ({
    nome: form.nome,
    nivel: form.nivel,
    atividade: form.atividade,
    alunos: form.alunos,
    status: form.status,

    // ✅ o backend espera assim:
    horarioInicio: form.horarioInicio || null,
    horarioFim: form.horarioFim || null,
    diasSemana: form.diasSemana || [],
  });

  // ✅ BLOCO NOVO: layout exclusivo do PSICO
  if (isPsico) {
    return (
      <div className="min-h-screen bg-slate-900" data-testid="monitor-page-psico">

        {/* Header psico (simples) */}
        <div className="bg-slate-900 border-b border-slate-700 px-4 py-4 md:px-6 border-l-4 border-l-purple-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <HeartHandshake className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">
                  Monitor - Psicossocial
                </h1>
                <p className="text-slate-400">Bem-vindo, {userName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline" className="border-purple-500 text-purple-600">
                🧠 Psicossocial
              </Badge>

              {/* seletor PEC / Inclusão */}
              <Select value={psicoVertente} onValueChange={(v: any) => setPsicoVertente(v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Vertente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pec">PEC</SelectItem>
                    <SelectItem value="inclusao">Inclusão</SelectItem>
                  </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>

        {/* Conteúdo psico - layout moderno */}
        <div className="container mx-auto px-4 py-6 md:px-6 md:py-8 space-y-6">

          {/* Dashboard KPIs - Monitor Psico */}
          <div className="rounded-2xl p-5" style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'}}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Painel do Monitor</h2>
                <p className="text-sm text-purple-300 font-medium">Psicossocial</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="rounded-xl p-4" style={{background:'rgba(234,88,12,0.15)', border:'1px solid rgba(234,88,12,0.3)'}}>
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-semibold text-orange-300 uppercase tracking-wide">Atendidos</span>
                </div>
                <div className="text-3xl font-bold text-white">{(psicoDashStats as any)?.atendidosCpf ?? (psicoAtendidosRegistrados as any[]).length}</div>
              </div>
              <div className="rounded-xl p-4" style={{background:'rgba(139,92,246,0.15)', border:'1px solid rgba(139,92,246,0.3)'}}>
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-semibold text-violet-300 uppercase tracking-wide">Atendimentos</span>
                </div>
                <div className="text-3xl font-bold text-white">{(psicoDashStats as any)?.atendimentoIndividual || 0}</div>
              </div>
              <div className="rounded-xl p-4" style={{background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.3)'}}>
                <div className="flex items-center gap-2 mb-2">
                  <Home className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold text-blue-300 uppercase tracking-wide">Visitas</span>
                </div>
                <div className="text-3xl font-bold text-white">{(psicoDashStats as any)?.visitaDomiciliar || 0}</div>
              </div>
              <div className="rounded-xl p-4" style={{background:'rgba(34,197,94,0.15)', border:'1px solid rgba(34,197,94,0.3)'}}>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-semibold text-green-300 uppercase tracking-wide">Atend. Coletivos</span>
                </div>
                <div className="text-3xl font-bold text-white">{(psicoDashStats as any)?.atendimentoColetivo || 0}</div>
              </div>
              <div className="rounded-xl p-4" style={{background:'rgba(234,179,8,0.15)', border:'1px solid rgba(234,179,8,0.3)'}}>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs font-semibold text-yellow-300 uppercase tracking-wide">Espaço O Grito</span>
                </div>
                <div className="text-3xl font-bold text-white">{(psicoDashStats as any)?.espacoOGrito || 0}</div>
              </div>
              <div className="rounded-xl p-4" style={{background:'rgba(249,115,22,0.15)', border:'1px solid rgba(249,115,22,0.3)'}}>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-semibold text-orange-300 uppercase tracking-wide">Demanda Espontânea</span>
                </div>
                <div className="text-3xl font-bold text-white">{(psicoDashStats as any)?.demandasEspontaneas || 0}</div>
              </div>
            </div>
          </div>

          {/* Módulos de Navegação - estilo coordenador */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">

            {/* Atendidos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserCheck className="w-5 h-5 text-indigo-500" />
                  Atendidos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-600 text-sm">Pessoas com atendimentos registrados pelo monitor.</p>
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    variant={psicoTab === 'atendidos' ? 'default' : 'outline'}
                    onClick={() => changePsicoTab('atendidos')}
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Ver Atendidos
                  </Button>
                  <Button
                    className="w-full"
                    variant={psicoTab === 'demanda' ? 'default' : 'outline'}
                    onClick={() => changePsicoTab('demanda')}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Demanda Espontânea
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Registros Psicossociais */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lock className="w-5 h-5 text-violet-500" />
                  Registros Psicossociais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-600 text-sm">Gerencie registros confidenciais e gerais de atendimentos.</p>
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    variant={psicoTab === 'confidencial' ? 'default' : 'outline'}
                    onClick={() => changePsicoTab('confidencial')}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Registros Confidenciais
                  </Button>
                  <Button
                    className="w-full"
                    variant={psicoTab === 'registros' ? 'default' : 'outline'}
                    onClick={() => changePsicoTab('registros')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Registros Gerais
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Presença e Atividades */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                  Presença e Atividades
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-600 text-sm">Controle de frequência e relatos das atividades realizadas.</p>
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    variant={psicoTab === 'frequencia' ? 'default' : 'outline'}
                    onClick={() => changePsicoTab('frequencia')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Controle de Presença
                  </Button>
                  <Button
                    className="w-full"
                    variant={psicoTab === 'atividades' ? 'default' : 'outline'}
                    onClick={() => changePsicoTab('atividades')}
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Relato de Atividades
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Acompanhamentos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="w-5 h-5 text-pink-500" />
                  Acompanhamentos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-600 text-sm">Casos em acompanhamento ativo pelo monitor.</p>
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    variant={psicoTab === 'acompanhamentos' ? 'default' : 'outline'}
                    onClick={() => changePsicoTab('acompanhamentos')}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Acompanhamentos
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Conteúdo Dinâmico */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
              {/* ATENDIDOS */}
              {psicoTab === "atendidos" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar atendido por nome ou CPF..."
                        value={buscaAtendido}
                        onChange={(e) => setBuscaAtendido(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-purple-600">{(psicoDashStats as any)?.atendimentoIndividual || 0}</div>
                      <div className="text-xs text-purple-700">Atend. Individuais</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600">{(psicoDashStats as any)?.visitaDomiciliar || 0}</div>
                      <div className="text-xs text-blue-700">Visitas Domiciliares</div>
                    </div>
                    <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">{(psicoDashStats as any)?.atendimentoColetivo || 0}</div>
                      <div className="text-xs text-green-700">Atend. Coletivos</div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-yellow-600">{(psicoDashStats as any)?.espacoOGrito || 0}</div>
                      <div className="text-xs text-yellow-700">Espaço O Grito</div>
                    </div>
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-red-600">{(psicoDashStats as any)?.acoesSaude || 0}</div>
                      <div className="text-xs text-red-700">Ações p/ Saúde</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-orange-600">{(psicoDashStats as any)?.demandasEspontaneas || 0}</div>
                      <div className="text-xs text-orange-700">Dem. Espontâneas</div>
                    </div>
                  </div>

                  {loadingAtendidosRegistrados ? (
                    <div className="text-center py-6 text-gray-500">Carregando atendidos...</div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>CPF</TableHead>
                            <TableHead>Atendimentos</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(() => {
                            const filtered = (psicoAtendidosRegistrados as any[]).filter((a: any) => {
                              if (!buscaAtendido.trim()) return true;
                              const termo = buscaAtendido.toLowerCase();
                              return (a.nome || "").toLowerCase().includes(termo) || (a.cpf || "").includes(buscaAtendido);
                            });
                            if (filtered.length === 0) return (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                                  Nenhum atendido encontrado. Cadastre atendimentos na aba "Registro Confidencial".
                                </TableCell>
                              </TableRow>
                            );
                            return filtered.map((a: any) => (
                              <TableRow key={a.id} className="cursor-pointer hover:bg-purple-50" onClick={() => abrirPerfilPsico(a)}>
                                <TableCell className="font-medium">{a.nome || "-"}</TableCell>
                                <TableCell className="text-sm text-gray-500">{formatCPF(a.cpf)}</TableCell>
                                <TableCell>
                                  <Badge className="bg-purple-100 text-purple-800">{a.totalAtendimentos} registro(s)</Badge>
                                </TableCell>
                                <TableCell>
                                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); abrirPerfilPsico(a); }}>
                                    <Eye className="w-4 h-4 mr-1" /> Ver
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ));
                          })()}
                        </TableBody>
                      </Table>

                      {selectedAtendido && (
                        <Dialog open={!!selectedAtendido} onOpenChange={() => { setSelectedAtendido(null); setSelectedAtendidoPerfil(null); }}>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-purple-600" />
                                Perfil Completo do Atendido
                              </DialogTitle>
                            </DialogHeader>

                            {loadingAtendidoPerfil && (
                              <div className="flex items-center justify-center py-6 text-purple-600">
                                <div className="animate-spin w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full mr-2" />
                                Carregando perfil...
                              </div>
                            )}

                            <div className="space-y-5">
                              {/* Identificação */}
                              <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-2 pb-1 border-b border-purple-100">Identificação</h4>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                  {[
                                    ["Nome", selectedAtendidoPerfil?.nome_completo || selectedAtendidoPerfil?.nome || selectedAtendido.nome],
                                    ["CPF", formatCPF(selectedAtendido.cpf)],
                                    ["Data de Nascimento", (() => { const d = selectedAtendidoPerfil?.data_nascimento || selectedAtendido.dataNascimento; if (!d) return "Não informado"; try { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR'); } catch { return d; } })()],
                                    ["Gênero", selectedAtendidoPerfil?.genero || "Não informado"],
                                    ["Cor/Raça", selectedAtendidoPerfil?.cor_raca || "Não informado"],
                                    ["Estado Civil", selectedAtendidoPerfil?.estado_civil || "Não informado"],
                                    ["Naturalidade", selectedAtendidoPerfil?.naturalidade || "Não informado"],
                                    ["Religião", selectedAtendidoPerfil?.religiao || "Não informado"],
                                  ].map(([label, val]) => (
                                    <div key={label as string}>
                                      <label className="text-xs font-medium text-gray-400">{label}</label>
                                      <p className="text-sm text-gray-800">{val || "Não informado"}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Contato */}
                              <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-2 pb-1 border-b border-purple-100">Contato</h4>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                  {[
                                    ["E-mail", selectedAtendidoPerfil?.email],
                                    ["Telefone", selectedAtendidoPerfil?.telefone],
                                    ["WhatsApp", selectedAtendidoPerfil?.whatsapp],
                                  ].map(([label, val]) => (
                                    <div key={label as string}>
                                      <label className="text-xs font-medium text-gray-400">{label}</label>
                                      <p className="text-sm text-gray-800">{val || "Não informado"}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Endereço */}
                              {selectedAtendidoPerfil && (
                                <div>
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-2 pb-1 border-b border-purple-100">Endereço</h4>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    {[
                                      ["Logradouro", [selectedAtendidoPerfil.logradouro, selectedAtendidoPerfil.numero, selectedAtendidoPerfil.complemento].filter(Boolean).join(', ')],
                                      ["Bairro", selectedAtendidoPerfil.bairro],
                                      ["Cidade/Estado", [selectedAtendidoPerfil.cidade, selectedAtendidoPerfil.estado].filter(Boolean).join(' - ')],
                                      ["CEP", selectedAtendidoPerfil.cep],
                                    ].map(([label, val]) => (
                                      <div key={label as string}>
                                        <label className="text-xs font-medium text-gray-400">{label}</label>
                                        <p className="text-sm text-gray-800">{val || "Não informado"}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Socioeconômico */}
                              {selectedAtendidoPerfil && (
                                <div>
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-2 pb-1 border-b border-purple-100">Dados Socioeconômicos</h4>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    {[
                                      ["Escolaridade", selectedAtendidoPerfil.escolaridade],
                                      ["Renda Familiar", selectedAtendidoPerfil.renda_familiar_mensal],
                                      ["Qtde. na residência", selectedAtendidoPerfil.quantas_pessoas_moram],
                                      ["Com quem mora", selectedAtendidoPerfil.com_quem_mora],
                                      ["Bolsa Família", selectedAtendidoPerfil.bolsa_familia ? "Sim" : (selectedAtendidoPerfil.recebe_bolsa_familia ? "Sim" : "Não")],
                                      ["BPC", selectedAtendidoPerfil.bpc ? "Sim" : "Não"],
                                      ["CadÚnico", selectedAtendidoPerfil.cadunico ? "Sim" : "Não"],
                                      ["NIS/PIS/PASEP", selectedAtendidoPerfil.nis_pis_pasep],
                                    ].map(([label, val]) => (
                                      <div key={label as string}>
                                        <label className="text-xs font-medium text-gray-400">{label}</label>
                                        <p className="text-sm text-gray-800">{val || "Não informado"}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Saúde */}
                              {selectedAtendidoPerfil && (
                                <div>
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-2 pb-1 border-b border-purple-100">Saúde</h4>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    {[
                                      ["Deficiência", selectedAtendidoPerfil.qual_deficiencia || selectedAtendidoPerfil.detalhes_deficiencia || (selectedAtendidoPerfil.possui_deficiencia ? "Sim (sem detalhes)" : "Não")],
                                      ["Alergia", selectedAtendidoPerfil.qual_alergia || selectedAtendidoPerfil.detalhes_alergia || (selectedAtendidoPerfil.possui_alergia ? "Sim (sem detalhes)" : "Não")],
                                      ["Medicamento", selectedAtendidoPerfil.qual_medicamento || selectedAtendidoPerfil.detalhes_medicamento || (selectedAtendidoPerfil.faz_uso_medicamento ? "Sim (sem detalhes)" : "Não")],
                                      ["Problema de Saúde", selectedAtendidoPerfil.qual_problema_saude || (selectedAtendidoPerfil.possui_problema_saude ? "Sim (sem detalhes)" : "Não")],
                                    ].map(([label, val]) => (
                                      <div key={label as string}>
                                        <label className="text-xs font-medium text-gray-400">{label}</label>
                                        <p className="text-sm text-gray-800">{val || "Não informado"}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Histórico de Atendimentos */}
                              <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-2 pb-1 border-b border-purple-100">
                                  Histórico de Atendimentos
                                  <span className="ml-2 font-normal text-purple-500">({selectedAtendido.totalAtendimentos} registros)</span>
                                </h4>
                                <div className="space-y-2 max-h-52 overflow-y-auto">
                                  {(selectedAtendido.atendimentos || []).length === 0 && (
                                    <p className="text-sm text-gray-400 text-center py-3">Nenhum atendimento registrado</p>
                                  )}
                                  {(selectedAtendido.atendimentos || []).map((at: any) => {
                                    const tipoLabels: Record<string, string> = { atendimento_individual: "Atendimento Individual", visita_domiciliar: "Visita Domiciliar", atendimento_coletivo: "Atendimento Coletivo", espaco_o_grito: "Espaço O Grito", acoes_saude: "Ações para Saúde", encaminhamento: "Encaminhamento", situacao_risco: "Situação de Risco", caravana_comunitaria: "Caravana Comunitária", outro: "Outro" };
                                    return (
                                      <div key={at.id} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                                        <div>
                                          <p className="text-sm font-medium text-gray-800">{at.titulo}</p>
                                          <p className="text-xs text-purple-600">{tipoLabels[at.tipo] || at.tipo}</p>
                                        </div>
                                        <span className="text-xs text-gray-400 whitespace-nowrap">{at.data ? new Date(at.data + 'T12:00:00').toLocaleDateString('pt-BR') : "-"}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {!selectedAtendidoPerfil && !loadingAtendidoPerfil && selectedAtendido.cpf && (
                                <p className="text-xs text-gray-400 text-center italic">Pessoa não encontrada no cadastro completo do sistema</p>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* FREQUENCIA / CHAMADAS - somente leitura - dois níveis: turmas → chamadas */}
              {psicoTab === "frequencia" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-700">Programa:</span>
                    <Button
                      size="sm"
                      variant={psicoChamadaPrograma === "pec" ? "default" : "outline"}
                      onClick={() => { setPsicoChamadaPrograma("pec"); setPsicoChamadaTurmaId(""); setPsicoChamadaExpandida(null); }}
                      className={psicoChamadaPrograma === "pec" ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                    >
                      PEC
                    </Button>
                    <Button
                      size="sm"
                      variant={psicoChamadaPrograma === "inclusao" ? "default" : "outline"}
                      onClick={() => { setPsicoChamadaPrograma("inclusao"); setPsicoChamadaTurmaId(""); setPsicoChamadaExpandida(null); }}
                      className={psicoChamadaPrograma === "inclusao" ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      Inclusão Produtiva
                    </Button>
                  </div>

                  {!psicoChamadaTurmaId ? (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Turmas - {psicoChamadaPrograma === "pec" ? "PEC" : "Inclusão Produtiva"}</h3>
                      <input
                        type="text"
                        placeholder="Buscar turma..."
                        value={psicoChamadaBusca}
                        onChange={(e) => setPsicoChamadaBusca(e.target.value)}
                        className="w-full px-3 py-2 mb-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                      {(psicoChamadaTurmas as any[]).length > 0 ? (
                        <div className="space-y-1">
                          {[...(psicoChamadaTurmas as any[])].filter((t: any) => !psicoChamadaBusca || (t.nome || `Turma ${t.id}`).toLowerCase().includes(psicoChamadaBusca.toLowerCase())).sort((a: any, b: any) => {
                            const aMax = psicoHistoricoChamadas.filter((c: any) => String(c.turmaId) === String(a.id)).reduce((m: string, c: any) => c.data > m ? c.data : m, "");
                            const bMax = psicoHistoricoChamadas.filter((c: any) => String(c.turmaId) === String(b.id)).reduce((m: string, c: any) => c.data > m ? c.data : m, "");
                            if (!aMax && !bMax) return (b.id || 0) - (a.id || 0);
                            if (!aMax) return 1;
                            if (!bMax) return -1;
                            return bMax.localeCompare(aMax);
                          }).map((t: any) => {
                            const turmasChamadas = psicoHistoricoChamadas.filter((c: any) => String(c.turmaId) === String(t.id));
                            const totalChamadas = turmasChamadas.length;
                            const freqMedia = totalChamadas > 0
                              ? Math.round(turmasChamadas.reduce((acc: number, c: any) => acc + (c.presentes || 0), 0) / turmasChamadas.reduce((acc: number, c: any) => acc + (c.total || 1), 0) * 100)
                              : 0;
                            return (
                              <div
                                key={t.id}
                                className="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => { setPsicoChamadaTurmaId(String(t.id)); setPsicoChamadaExpandida(null); }}
                              >
                                <div>
                                  <span className="font-medium text-gray-800 text-sm">{t.nome || `Turma ${t.id}`}</span>
                                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                    <span>{totalChamadas} chamadas</span>
                                    <span>Freq: <span className={`font-medium ${freqMedia >= 70 ? "text-green-600" : freqMedia >= 50 ? "text-yellow-600" : "text-red-600"}`}>{freqMedia}%</span></span>
                                  </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-400 border rounded-lg">
                          Nenhuma turma encontrada para {psicoChamadaPrograma === "pec" ? "PEC" : "Inclusão Produtiva"}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setPsicoChamadaTurmaId(""); setPsicoChamadaExpandida(null); }}
                          className="text-gray-600 hover:text-gray-800 px-2"
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                        </Button>
                        <h3 className="font-semibold text-gray-800">
                          {(psicoChamadaTurmas as any[]).find((t: any) => String(t.id) === psicoChamadaTurmaId)?.nome || "Turma"}
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        <div className={`${psicoChamadaPrograma === "pec" ? "bg-yellow-50" : "bg-green-50"} rounded-lg p-3 text-center`}>
                          <div className={`text-2xl font-bold ${psicoChamadaPrograma === "pec" ? "text-yellow-700" : "text-green-700"}`}>{psicoHistoricoChamadas.length}</div>
                          <div className={`text-xs ${psicoChamadaPrograma === "pec" ? "text-yellow-600" : "text-green-600"}`}>Presenças</div>
                        </div>
                        <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-purple-300">
                            {psicoHistoricoChamadas.length > 0 ? Math.round(psicoHistoricoChamadas.reduce((acc: number, c: any) => acc + (c.presentes || 0), 0) / psicoHistoricoChamadas.reduce((acc: number, c: any) => acc + (c.total || 1), 0) * 100) : 0}%
                          </div>
                          <div className="text-xs text-purple-400">Frequência Média</div>
                        </div>
                      </div>

                      {loadingChamadas ? (
                        <div className="text-center py-4 text-gray-500">Carregando...</div>
                      ) : psicoHistoricoChamadas.length > 0 ? (
                        <div className="space-y-2">
                          {psicoHistoricoChamadas.map((c: any, i: number) => (
                            <div key={c.id || i} className="border rounded-lg overflow-hidden">
                              <div
                                className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => setPsicoChamadaExpandida(psicoChamadaExpandida === c.id ? null : c.id)}
                              >
                                <span className="text-sm font-medium">{c.data}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm">
                                    <span className="text-green-600 font-medium">{c.presentes || 0}</span>
                                    <span className="text-gray-400"> / </span>
                                    <span className="text-gray-600">{c.total || 0}</span>
                                  </span>
                                  <span className="text-xs text-gray-400">{psicoChamadaExpandida === c.id ? "▲" : "▼"}</span>
                                </div>
                              </div>
                              {psicoChamadaExpandida === c.id && c.presencas && (
                                <div className="border-t">
                                  {[...c.presencas].sort((a: any, b: any) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR')).map((p: any, pi: number) => (
                                    <div key={p.alunoCpf || pi} className={`flex items-center justify-between px-4 py-2 border-b last:border-b-0 text-sm ${p.presente ? "bg-green-50" : "bg-red-50"}`}>
                                      <span>{(p.nome || 'Sem nome').replace(/^\s+|\s+$/g, '')}</span>
                                      <Badge variant="outline" className={p.presente ? "border-green-500 text-green-600" : "border-red-500 text-red-600"}>
                                        {p.presente ? "Presente" : p.justificativa ? `Falta - ${p.justificativa}` : "Falta"}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-400 border rounded-lg">Nenhuma chamada registrada para esta turma</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* RELATO DE ATIVIDADES */}
              {psicoTab === "atividades" && (
                <div className="space-y-4">
                  <div className="flex gap-2 border-b pb-2">
                    <button
                      onClick={() => setPsicoAtivSubTab("lista")}
                      className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${psicoAtivSubTab === "lista" ? "bg-purple-100 text-purple-700 border-b-2 border-purple-600" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Atividades Realizadas
                    </button>
                    <button
                      onClick={() => { setPsicoAtivSubTab("registrar"); setPsicoNovaAtividade(true); }}
                      className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${psicoAtivSubTab === "registrar" ? "bg-purple-100 text-purple-700 border-b-2 border-purple-600" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Registrar Nova
                    </button>
                  </div>

                  {psicoAtivSubTab === "registrar" && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                      <h4 className="font-semibold text-purple-800">Registrar Atividade</h4>
                      <div className="mb-3">
                        <label className="text-sm font-medium mb-1 block">Programa</label>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={psicoAtivPrograma === "pec" ? "default" : "outline"}
                            onClick={() => {
                              setPsicoAtivPrograma("pec");
                              setPsicoAtividadeForm(f => ({...f, turmaId: "", data: ""}));
                              setPsicoAtivDiasAula([]);
                              setPsicoAtivChamada({loaded: false, exists: false, presencas: [], editMode: false});
                              setPsicoAtividadeParticipantes([]);
                            }}
                            className={psicoAtivPrograma === "pec" ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                          >
                            PEC
                          </Button>
                          <Button
                            size="sm"
                            variant={psicoAtivPrograma === "inclusao" ? "default" : "outline"}
                            onClick={() => {
                              setPsicoAtivPrograma("inclusao");
                              setPsicoAtividadeForm(f => ({...f, turmaId: "", data: ""}));
                              setPsicoAtivDiasAula([]);
                              setPsicoAtivChamada({loaded: false, exists: false, presencas: [], editMode: false});
                              setPsicoAtividadeParticipantes([]);
                            }}
                            className={psicoAtivPrograma === "inclusao" ? "bg-green-600 hover:bg-green-700" : ""}
                          >
                            Inclusão Produtiva
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Titulo</label>
                          <Input value={psicoAtividadeForm.titulo} onChange={(e) => setPsicoAtividadeForm({...psicoAtividadeForm, titulo: e.target.value})} placeholder="Ex: Roda de conversa sobre ansiedade" />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Tipo</label>
                        <Select
                          value={psicoAtividadeForm.tipo || ""}
                          onValueChange={(v) => {
                            const isVisita = v === "visita_domiciliar";

                            // 1) atualiza o form SEM stale closure
                            setPsicoAtividadeForm((prev) => ({
                              ...prev,
                              tipo: v,

                              // 2) visita domiciliar não deve herdar turma/data/chamada
                              turmaId: isVisita ? "" : prev.turmaId,
                              data: isVisita ? "" : prev.data,
                            }));

                            // 3) limpa estados dependentes quando vira visita domiciliar
                            if (isVisita) {
                              setPsicoAtivDiasAula([]);
                              setPsicoAtivChamada({ loaded: false, exists: false, presencas: [], editMode: false });
                              setPsicoAtividadeParticipantes([]); // se visita não tem lista de turma
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="roda_de_conversa">Roda de Conversa</SelectItem>
                            <SelectItem value="atendimento_grupo">Atendimento em Grupo</SelectItem>
                            <SelectItem value="acao_socioemocional">Ação ou intervenção socioemocional</SelectItem>
                            <SelectItem value="palestra">Palestra</SelectItem>
                            <SelectItem value="visita_domiciliar">Visita Domiciliar</SelectItem>
                            <SelectItem value="encaminhamento">Encaminhamento</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                                                </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Turma ({psicoAtivPrograma === "pec" ? "PEC" : "Inclusão"})</label>
                          <div className="relative">
                            <div
                              className="w-full flex items-center border rounded-md bg-white cursor-pointer"
                              onClick={() => setPsicoAtivTurmaOpen(!psicoAtivTurmaOpen)}
                            >
                              <input
                                type="text"
                                placeholder={psicoAtividadeForm.turmaId ? ((psicoAtivTurmas as any[]).find((t: any) => String(t.id) === psicoAtividadeForm.turmaId)?.nome || `Turma ${psicoAtividadeForm.turmaId}`) : "Buscar ou selecionar turma..."}
                                value={psicoChamadaBusca}
                                onChange={(e) => { setPsicoChamadaBusca(e.target.value); setPsicoAtivTurmaOpen(true); }}
                                onFocus={() => setPsicoAtivTurmaOpen(true)}
                                className="flex-1 px-3 py-2 text-sm bg-transparent border-none focus:outline-none"
                              />
                              <ChevronDown className={`w-4 h-4 mr-2 text-gray-400 transition-transform ${psicoAtivTurmaOpen ? "rotate-180" : ""}`} />
                            </div>
                            {psicoAtivTurmaOpen && (
                              <div className="absolute z-50 w-full mt-1 border rounded-lg bg-white shadow-lg max-h-[220px] overflow-y-auto">
                                {(() => {
                                  const sorted = [...(psicoAtivTurmas as any[])].sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
                                  const filtered = sorted.filter((t: any) => !psicoChamadaBusca || (t.nome || `Turma ${t.id}`).toLowerCase().includes(psicoChamadaBusca.toLowerCase()));
                                  if (filtered.length === 0) return <div className="text-center text-gray-400 text-sm py-3">Nenhuma turma encontrada</div>;
                                  return filtered.map((t: any) => (
                                    <div
                                      key={t.id}
                                      className={`px-3 py-2.5 cursor-pointer text-sm hover:bg-gray-100 ${String(t.id) === psicoAtividadeForm.turmaId ? "bg-blue-50 font-medium" : ""}`}
                                      onClick={async () => {
                                        setPsicoChamadaBusca("");
                                        setPsicoAtivTurmaOpen(false);
                                        setPsicoAtividadeForm({...psicoAtividadeForm, turmaId: String(t.id), data: ""});
                                        setPsicoAtivChamada({loaded: false, exists: false, presencas: [], editMode: false});
                                        setPsicoAtividadeParticipantes([]);
                                        const tn = normalizeTurma(t);
                                        setPsicoAtivDiasAula(tn ? getDiasAulaParaTurma(tn) : []);
                                        try {
                                          const url = psicoAtivPrograma === "inclusao"
                                            ? `/api/monitor/${monitorUserId}/alunos?programType=inclusao&turmaId=${t.id}`
                                            : `/api/monitor/${monitorUserId}/alunos?programType=pec&grupoId=${t.id}`;
                                          const res = await fetch(url, { credentials: "include", headers: { "x-user-id": monitorUserId } });
                                          const json = await res.json().catch(() => []);
                                          const lista = Array.isArray(json) ? json : (json?.participantes || json?.data || []);
                                          setPsicoAtividadeParticipantes(lista.map((a: any) => ({
                                            id: String(a.cpf || a.id || a.participante_id || ""),
                                            nome: (a.nome || a.nome_completo || a.nomeCompleto || "Sem nome").replace(/^\s+|\s+$/g, ''),
                                            selecionado: true,
                                          })).filter((p: any) => p.id && p.id !== "undefined"));
                                        } catch { setPsicoAtividadeParticipantes([]); }
                                      }}
                                    >
                                      {t.nome || `Turma ${t.id}`}
                                    </div>
                                  ));
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Data da Aula</label>
                          <Select
                            value={psicoAtividadeForm.data}
                            onValueChange={(v) => {
                              setPsicoAtividadeForm({...psicoAtividadeForm, data: v});
                              const chamadas = psicoAtivChamadasData?.chamadas || [];
                              const chamadaDoDia = chamadas.find((c: any) => String(c.turmaId) === psicoAtividadeForm.turmaId && c.data === v);
                              if (chamadaDoDia && chamadaDoDia.presencas) {
                                const presencasList = Array.isArray(chamadaDoDia.presencas) ? chamadaDoDia.presencas : [];
                                const presentesList = presencasList.filter((p: any) => p.presente);
                                setPsicoAtivChamada({
                                  loaded: true,
                                  exists: true,
                                  presencas: presencasList.map((p: any) => ({
                                    alunoCpf: p.alunoCpf || "",
                                    nome: (p.nome || "Sem nome").replace(/^\s+|\s+$/g, ''),
                                    presente: p.presente !== false,
                                    justificativa: p.justificativa || '',
                                  })),
                                  editMode: false,
                                });
                                setPsicoAtividadeParticipantes(presentesList.map((p: any) => ({
                                  id: p.alunoCpf || "",
                                  nome: (p.nome || "Sem nome").replace(/^\s+|\s+$/g, ''),
                                  selecionado: true,
                                })));
                              } else {
                                setPsicoAtivChamada({ loaded: true, exists: false, presencas: [], editMode: false });
                              }
                            }}
                            disabled={!psicoAtividadeForm.turmaId}
                          >
                            <SelectTrigger><SelectValue placeholder="Selecione a data" /></SelectTrigger>
                            <SelectContent>
                              {psicoAtivDiasAula.map((d) => (
                                <SelectItem key={d.date} value={d.date}>{d.label} ({d.dayOfWeek})</SelectItem>
                              ))}
                              {psicoAtivDiasAula.length === 0 && (
                                <SelectItem value="__none" disabled>Nenhuma data disponível</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Horário Início</label>
                          <Input type="time" value={psicoAtividadeForm.horarioInicio} onChange={(e) => setPsicoAtividadeForm({...psicoAtividadeForm, horarioInicio: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Horário Fim</label>
                          <Input type="time" value={psicoAtividadeForm.horarioFim} onChange={(e) => setPsicoAtividadeForm({...psicoAtividadeForm, horarioFim: e.target.value})} />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Descrição</label>
                        <textarea
                          className="w-full border rounded-lg p-2 text-sm min-h-[80px]"
                          value={psicoAtividadeForm.descricao}
                          onChange={(e) => setPsicoAtividadeForm({...psicoAtividadeForm, descricao: e.target.value})}
                          placeholder="Descreva a atividade realizada, objetivos, metodologia..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Observação</label>
                        <textarea
                          className="w-full border rounded-lg p-2 text-sm min-h-[60px]"
                          value={psicoAtividadeForm.observacao}
                          onChange={(e) => setPsicoAtividadeForm({...psicoAtividadeForm, observacao: e.target.value})}
                          placeholder="Observações adicionais sobre a atividade..."
                        />
                      </div>
                      {psicoAtividadeParticipantes.length > 0 && (
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium">Participantes ({psicoAtividadeParticipantes.filter(p => p.selecionado).length}/{psicoAtividadeParticipantes.length})</label>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setPsicoAtividadeParticipantes(psicoAtividadeParticipantes.map(p => ({...p, selecionado: true})))}>Todos</Button>
                              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setPsicoAtividadeParticipantes(psicoAtividadeParticipantes.map(p => ({...p, selecionado: false})))}>Nenhum</Button>
                            </div>
                          </div>
                          <div className="max-h-40 overflow-y-auto border rounded-lg">
                            {psicoAtividadeParticipantes.map((p, idx) => (
                              <label key={p.id || idx} className="flex items-center gap-2 px-3 py-1.5 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer text-sm">
                                <input
                                  type="checkbox"
                                  checked={p.selecionado}
                                  onChange={() => {
                                    const updated = [...psicoAtividadeParticipantes];
                                    updated[idx] = {...updated[idx], selecionado: !updated[idx].selecionado};
                                    setPsicoAtividadeParticipantes(updated);
                                  }}
                                  className="rounded"
                                />
                                {p.nome}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {psicoAtividadeForm.turmaId && psicoAtividadeForm.data && psicoAtivChamada.loaded && (
                        <div className="border border-purple-200 rounded-lg p-3 bg-white">
                          <h5 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Chamada do Dia
                          </h5>
                          {psicoAtivChamada.exists ? (
                            <div>
                              <p className="text-xs text-green-700 mb-2">Chamada encontrada! Os participantes presentes foram adicionados automaticamente à atividade.</p>
                              <div className="flex gap-3 mb-2 text-sm">
                                <span className="text-green-600 font-medium">{psicoAtivChamada.presencas.filter(p => p.presente).length} presentes</span>
                                <span className="text-red-600 font-medium">{psicoAtivChamada.presencas.filter(p => !p.presente).length} ausentes</span>
                              </div>
                              <div className="max-h-48 overflow-y-auto border rounded-lg">
                                {[...psicoAtivChamada.presencas].sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR')).map((p, idx) => (
                                  <div key={p.alunoCpf || idx} className={`flex items-center justify-between px-3 py-1.5 border-b last:border-b-0 text-sm ${p.presente ? "bg-green-50" : "bg-red-50"}`}>
                                    <span>{p.nome}</span>
                                    <Badge variant="outline" className={p.presente ? "border-green-500 text-green-600" : "border-red-500 text-red-600"}>
                                      {p.presente ? "Presente" : p.justificativa ? `Falta - ${p.justificativa}` : "Falta"}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-sm text-amber-700">Nenhuma chamada registrada para esta data. Adicione os participantes manualmente ou selecione outra data com chamada registrada.</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => { setPsicoNovaAtividade(false); setPsicoAtivSubTab("lista"); setPsicoAtividadeParticipantes([]); setPsicoAtivDiasAula([]); setPsicoAtivChamada({loaded: false, exists: false, presencas: [], editMode: false}); }}>Cancelar</Button>
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                          disabled={!psicoAtividadeForm.titulo || !psicoAtividadeForm.data || createPsicoAtividadeMutation.isPending}
                          onClick={() => {
                            const participantesSelecionados = psicoAtividadeParticipantes.filter(p => p.selecionado);
                            const turmaObj = (psicoAtivTurmas as any[]).find((t: any) => String(t.id) === psicoAtividadeForm.turmaId);
                            const turmaNomeStr = turmaObj?.nome || `Turma ${psicoAtividadeForm.turmaId}`;
                            createPsicoAtividadeMutation.mutate({
                              titulo: psicoAtividadeForm.titulo,
                              descricao: psicoAtividadeForm.descricao,
                              observacoes: `${psicoAtividadeForm.observacao || ""}${participantesSelecionados.length > 0 ? `\n[TURMA: ${turmaNomeStr}]\n[PARTICIPANTES: ${participantesSelecionados.map(p => p.nome).join(", ")}]` : ""}`.trim(),
                              tipo: psicoAtividadeForm.tipo,
                              data: new Date(psicoAtividadeForm.data).toISOString(),
                              horarioInicio: psicoAtividadeForm.horarioInicio,
                              horarioFim: psicoAtividadeForm.horarioFim,
                              grupo: psicoAtividadeForm.turmaId,
                              participantesPresentes: participantesSelecionados.length,
                              participantesEsperados: psicoAtividadeParticipantes.length,
                              vertente: psicoAtivPrograma,
                            });
                          }}
                        >
                          {createPsicoAtividadeMutation.isPending ? "Salvando..." : "Salvar Atividade"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {psicoAtivSubTab === "lista" && (loadingAtividades ? (
                    <div className="text-center py-6 text-gray-500">Carregando atividades...</div>
                  ) : (psicoAtividades as any[]).length > 0 ? (
                    <div className="space-y-2">
                      {(psicoAtividades as any[]).map((at: any) => {
                        const tipoLabel: Record<string, string> = { roda_de_conversa: "Roda de Conversa", atendimento_grupo: "Atendimento em Grupo", oficina: "Ação ou intervenção socioemocional", acao_socioemocional: "Ação ou intervenção socioemocional", palestra: "Palestra", visita_domiciliar: "Visita Domiciliar", encaminhamento: "Encaminhamento", outro: "Outro", reforco: "Reforço", recreativa: "Recreativa" };
                        const isExpanded = psicoAtivExpandida === String(at.id);
                        const turmaName = (psicoAtivTurmas as any[]).find((t: any) => String(t.id) === String(at.turmaId || at.turma_id || at.grupo))?.nome || at.turmaNome || "";
                        return (
                          <div key={at.id} className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer" onClick={() => setPsicoAtivExpandida(isExpanded ? null : String(at.id))}>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{at.titulo}</h4>
                                <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                                  <Badge variant="outline" className="text-xs">{tipoLabel[at.tipo] || at.tipo}</Badge>
                                  <span>{at.data ? new Date(at.data).toLocaleDateString("pt-BR") : "-"}</span>
                                  {at.horarioInicio && <span>{at.horarioInicio} - {at.horarioFim}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className={at.status === "concluida" ? "border-green-500 text-green-600" : "border-green-500 text-green-600"}>
                                  {at.status === "concluida" ? "concluída" : "registrada"}
                                </Badge>
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                              </div>
                            </div>
                            {isExpanded && (() => {
                              const obs = at.observacoes || at.observacao || "";
                              const turmaMatch = obs.match(/\[TURMA:\s*(.+?)\]/);
                              const partMatch = obs.match(/\[PARTICIPANTES:\s*(.+?)\]/);
                              const displayTurma = turmaMatch?.[1] || turmaName || "";
                              const displayParticipantes = partMatch?.[1]?.split(",").map((n: string) => n.trim()).filter(Boolean) || [];
                              const obsClean = obs.replace(/\n?\[TURMA:.*?\]/g, "").replace(/\n?\[PARTICIPANTES:.*?\]/g, "").trim();
                              const vertLabel = at.vertente === "pec" ? "PEC" : at.vertente === "inclusao" ? "Inclusão Produtiva" : at.vertente === "psicossocial" ? "Psicossocial" : at.vertente === "todos" ? "Todas" : at.vertente;
                              return (
                                <div className="mt-3 pt-3 border-t space-y-2 text-sm text-gray-900">
                                  {displayTurma && (
                                    <div className="flex gap-2"><span className="font-medium text-gray-500 min-w-[100px]">Turma:</span> <span className="text-gray-900">{displayTurma}</span></div>
                                  )}
                                  {at.vertente && (
                                    <div className="flex gap-2"><span className="font-medium text-gray-500 min-w-[100px]">Vertente:</span> <span className="text-gray-900">{vertLabel}</span></div>
                                  )}
                                  {at.descricao && (
                                    <div className="flex gap-2"><span className="font-medium text-gray-500 min-w-[100px]">Descrição:</span> <span className="text-gray-900">{at.descricao}</span></div>
                                  )}
                                  {obsClean && (
                                    <div className="flex gap-2"><span className="font-medium text-gray-500 min-w-[100px]">Observação:</span> <span className="text-gray-900">{obsClean}</span></div>
                                  )}
                                  {at.local && (
                                    <div className="flex gap-2"><span className="font-medium text-gray-500 min-w-[100px]">Local:</span> <span className="text-gray-900">{at.local}</span></div>
                                  )}
                                  <div className="flex gap-2">
                                    <span className="font-medium text-gray-500 min-w-[100px]">Participantes:</span>
                                    <span className="text-gray-900">{at.participantesPresentes ?? 0} presentes / {at.participantesEsperados ?? 0} esperados</span>
                                  </div>
                                  {displayParticipantes.length > 0 && (() => {
                                    const atId = at.id;
                                    const isOpen = expandedParticipantes.has(atId);
                                    const MAX_VISIBLE = 3;
                                    const hasMore = displayParticipantes.length > MAX_VISIBLE;
                                    const visibleList = isOpen ? displayParticipantes : displayParticipantes.slice(0, MAX_VISIBLE);
                                    const toggleOpen = (e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      setExpandedParticipantes(prev => {
                                        const next = new Set(prev);
                                        if (next.has(atId)) next.delete(atId); else next.add(atId);
                                        return next;
                                      });
                                    };
                                    return (
                                      <div onClick={(e) => e.stopPropagation()}>
                                        <button
                                          type="button"
                                          onClick={toggleOpen}
                                          className="font-medium text-gray-500 flex items-center gap-1 hover:text-gray-700"
                                        >
                                          Alunos presentes ({displayParticipantes.length})
                                          {hasMore && (
                                            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                                          )}
                                        </button>
                                        <div className="mt-1 space-y-0.5">
                                          {visibleList.map((nome: string, i: number) => (
                                            <div key={i} className="text-xs text-gray-900 pl-2 border-l-2 border-gray-200">{nome}</div>
                                          ))}
                                          {hasMore && !isOpen && (
                                            <button
                                              type="button"
                                              onClick={toggleOpen}
                                              className="text-xs text-purple-600 hover:text-purple-700 pl-2"
                                            >
                                              +{displayParticipantes.length - MAX_VISIBLE} mais...
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400 border rounded-lg">
                      Nenhuma atividade registrada ainda
                    </div>
                  ))}
                </div>
              )}

              {/* REGISTROS GERAIS */}
              {psicoTab === "registros" && (() => {
                const todosParaRegistro = [
                  ...(psicoAtendidos as any[]).map((p: any) => ({ nome: p.__nome || p.nome, cpf: p.cpf || p.__doc, origem: p.__vertente === "inclusao" ? "Inclusão" : "PEC" })),
                  ...(atendidosComunidade as any[]).map((p: any) => ({ nome: p.nome, cpf: p.cpf, origem: "Comunidade" })),
                ];
                return (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-gray-800">Registros</h3>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <Button size="sm" variant={registrosSubTab === "realizados" ? "default" : "outline"} onClick={() => setRegistrosSubTab("realizados")} className={registrosSubTab === "realizados" ? "bg-blue-600 hover:bg-blue-700" : ""}>Realizados</Button>
                      <Button size="sm" variant={registrosSubTab === "novo" ? "default" : "outline"} onClick={() => setRegistrosSubTab("novo")} className={registrosSubTab === "novo" ? "bg-blue-600 hover:bg-blue-700" : ""}><Plus className="w-4 h-4 mr-1" /> Novo Registro</Button>
                    </div>

                    {registrosSubTab === "novo" && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                        <h4 className="font-semibold text-blue-800">Novo Registro</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Categoria</label>
                            <Select value={registroGeralForm.categoria} onValueChange={(v) => { setRegistroGeralForm({...registroGeralForm, categoria: v}); setEspGritoParticipantes([]); setEspGritoColaboradoresIds([]); setEspGritoColabBusca(""); }}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="espaco_o_grito">Espaço O Grito</SelectItem>
                                <SelectItem value="caravana_comunitaria">Caravana Comunitária</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Data</label>
                            <Input type="date" value={registroGeralForm.data} onChange={(e) => setRegistroGeralForm({...registroGeralForm, data: e.target.value})} />
                          </div>
                        </div>

                        {registroGeralForm.categoria === "atendimento_individual" ? (
                          <div className="relative">
                            <label className="text-sm font-medium mb-1 block">Participante</label>
                            <div className="flex gap-2">
                              <div className="flex-1 relative">
                                <Input
                                  value={registroGeralPartOpen ? registroGeralPartBusca : registroGeralForm.participanteNome}
                                  onChange={(e) => { setRegistroGeralPartBusca(e.target.value); setRegistroGeralPartOpen(true); setRegistroGeralForm({...registroGeralForm, participanteNome: e.target.value, participanteCpf: ""}); }}
                                  onFocus={() => { setRegistroGeralPartOpen(true); setRegistroGeralPartBusca(registroGeralForm.participanteNome || ""); }}
                                  onBlur={() => setTimeout(() => setRegistroGeralPartOpen(false), 200)}
                                  placeholder="Buscar por nome (PEC, Inclusão ou Comunidade)"
                                />
                                {registroGeralPartOpen && (() => {
                                  const filtrados = registroGeralPartBusca.trim()
                                    ? todosParaRegistro.filter(p => p.nome.toLowerCase().includes(registroGeralPartBusca.toLowerCase()) || (p.cpf || "").includes(registroGeralPartBusca))
                                    : todosParaRegistro;
                                  if (filtrados.length === 0) return null;
                                  return (
                                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                      {filtrados.slice(0, 20).map((p, i) => (
                                        <button key={i} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center gap-2 border-b border-gray-50 last:border-0"
                                          onClick={() => { setRegistroGeralForm({...registroGeralForm, participanteNome: p.nome, participanteCpf: p.cpf || ""}); setRegistroGeralPartBusca(p.nome); setRegistroGeralPartOpen(false); }}>
                                          <span className="font-medium text-gray-900">{p.nome}</span>
                                          <Badge variant="outline" className="text-xs ml-auto">{p.origem}</Badge>
                                        </button>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="text-sm font-medium mb-1 block">Colaboradores presentes <span className="text-gray-400 text-xs">({espGritoColaboradoresIds.length} selecionado(s))</span></label>
                            <Input
                              className="mb-2"
                              placeholder="Filtrar colaboradores..."
                              value={espGritoColabBusca}
                              onChange={(e) => setEspGritoColabBusca(e.target.value)}
                            />
                            <div className="border rounded-lg max-h-52 overflow-y-auto bg-white">
                              {todosColaboradores.filter((c: any) => !espGritoColabBusca || c.nome.toLowerCase().includes(espGritoColabBusca.toLowerCase())).map((c: any) => {
                                const checked = espGritoColaboradoresIds.includes(c.id);
                                return (
                                  <label key={c.id} className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-0">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => setEspGritoColaboradoresIds(prev => checked ? prev.filter(id => id !== c.id) : [...prev, c.id])}
                                      className="w-4 h-4 accent-blue-600"
                                    />
                                    <span className="text-sm text-gray-800">{c.nome}</span>
                                    {c.vinculo && <span className="ml-auto text-xs text-gray-400">{c.vinculo}</span>}
                                  </label>
                                );
                              })}
                              {todosColaboradores.length === 0 && <div className="px-3 py-4 text-sm text-gray-400 text-center">Carregando colaboradores...</div>}
                            </div>
                            {espGritoColaboradoresIds.length > 0 && (
                              <p className="text-xs text-blue-600 mt-1">{espGritoColaboradoresIds.length} colaborador(es) selecionado(s)</p>
                            )}
                          </div>
                        )}

                        <div>
                          <label className="text-sm font-medium mb-1 block">Descrição / Conteúdo</label>
                          <textarea className="w-full border rounded-lg p-2 text-sm min-h-[100px]" value={registroGeralForm.conteudo} onChange={(e) => setRegistroGeralForm({...registroGeralForm, conteudo: e.target.value})} placeholder="Descreva o registro..." />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={() => setRegistrosSubTab("realizados")}>Cancelar</Button>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700"
                            disabled={!registroGeralForm.conteudo || !registroGeralForm.data || (registroGeralForm.categoria === "atendimento_individual" && !registroGeralForm.participanteNome) || (registroGeralForm.categoria === "espaco_o_grito" && espGritoColaboradoresIds.length === 0) || createRegistroGeralMutation.isPending}
                            onClick={() => createRegistroGeralMutation.mutate({
                              tipo: registroGeralForm.categoria,
                              conteudo: registroGeralForm.conteudo,
                              data: registroGeralForm.data,
                              participanteNome: registroGeralForm.participanteNome || null,
                              participanteCpf: registroGeralForm.participanteCpf || null,
                              colaboradoresIds: registroGeralForm.categoria === "espaco_o_grito" ? espGritoColaboradoresIds : null,
                            })}>
                            {createRegistroGeralMutation.isPending ? "Salvando..." : "Salvar Registro"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {registrosSubTab === "realizados" && (
                      <div className="space-y-2">
                        {loadingRegistrosGerais ? (
                          <div className="text-center py-6 text-gray-500">Carregando...</div>
                        ) : (registrosGerais as any[]).length === 0 ? (
                          <div className="text-center py-8 text-gray-400 border rounded-lg">Nenhum registro ainda</div>
                        ) : (
                          (registrosGerais as any[]).map((r: any) => {
                            const catLabel: Record<string, string> = { atendimento_individual: "Atendimento Individual", espaco_o_grito: "Espaço O Grito", caravana_comunitaria: "Caravana Comunitária" };
                            let colaboradoresDisplay = "";
                            let colaboradoresIdsList: number[] = [];
                            if (r.colaboradoresIds) {
                              try {
                                colaboradoresIdsList = JSON.parse(r.colaboradoresIds);
                                const nomes = colaboradoresIdsList.map((id: number) => todosColaboradores.find((c: any) => c.id === id)?.nome).filter(Boolean);
                                colaboradoresDisplay = nomes.join(", ");
                              } catch {}
                            }
                            const isEditing = editGeraisGeralId === r.id;
                            return (
                              <div key={r.id} className="border rounded-lg p-3 space-y-2 bg-white">
                                {isEditing ? (
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="text-xs font-medium mb-1 block">Categoria</label>
                                        <Select value={editGeraisGeralForm.tipo} onValueChange={(v) => { setEditGeraisGeralForm({...editGeraisGeralForm, tipo: v}); setEditGeraisColaboradoresIds([]); setEditGeraisColabBusca(""); }}>
                                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="espaco_o_grito">Espaço O Grito</SelectItem>
                                            <SelectItem value="caravana_comunitaria">Caravana Comunitária</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium mb-1 block">Data</label>
                                        <Input type="date" className="h-8 text-sm" value={editGeraisGeralForm.data} onChange={(e) => setEditGeraisGeralForm({...editGeraisGeralForm, data: e.target.value})} />
                                      </div>
                                    </div>
                                    {editGeraisGeralForm.tipo === "espaco_o_grito" && (
                                      <div>
                                        <label className="text-xs font-medium mb-1 block">Colaboradores presentes <span className="text-gray-400">({editGeraisColaboradoresIds.length} selecionado(s))</span></label>
                                        <Input className="mb-1 h-8 text-sm" placeholder="Filtrar..." value={editGeraisColabBusca} onChange={(e) => setEditGeraisColabBusca(e.target.value)} />
                                        <div className="border rounded-lg max-h-40 overflow-y-auto bg-white">
                                          {todosColaboradores.filter((c: any) => !editGeraisColabBusca || c.nome.toLowerCase().includes(editGeraisColabBusca.toLowerCase())).map((c: any) => {
                                            const checked = editGeraisColaboradoresIds.includes(c.id);
                                            return (
                                              <label key={c.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-blue-50 cursor-pointer border-b last:border-0">
                                                <input type="checkbox" checked={checked} onChange={() => setEditGeraisColaboradoresIds(prev => checked ? prev.filter(id => id !== c.id) : [...prev, c.id])} className="w-3.5 h-3.5 accent-blue-600" />
                                                <span className="text-xs text-gray-800">{c.nome}</span>
                                              </label>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                    <div>
                                      <label className="text-xs font-medium mb-1 block">Descrição</label>
                                      <textarea className="w-full border rounded-lg p-2 text-sm min-h-[80px]" value={editGeraisGeralForm.conteudo} onChange={(e) => setEditGeraisGeralForm({...editGeraisGeralForm, conteudo: e.target.value})} />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                      <Button size="sm" variant="outline" onClick={() => { setEditGeraisGeralId(null); setEditGeraisColaboradoresIds([]); setEditGeraisColabBusca(""); }}>Cancelar</Button>
                                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700"
                                        disabled={updateRegistroGeralMutation.isPending}
                                        onClick={() => updateRegistroGeralMutation.mutate({ id: r.id, ...editGeraisGeralForm, colaboradoresIds: editGeraisGeralForm.tipo === "espaco_o_grito" ? editGeraisColaboradoresIds : null })}>
                                        {updateRegistroGeralMutation.isPending ? "Salvando..." : "Salvar"}
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs text-blue-700 border-blue-300">{catLabel[r.tipo] || r.tipo}</Badge>
                                        <span className="text-xs text-gray-400">{r.data ? new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR") : "-"}</span>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600" onClick={() => setViewGeraisRecord({ ...r, colaboradoresIdsList })}><Eye className="w-3.5 h-3.5" /></Button>
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditGeraisGeralId(r.id); setEditGeraisGeralForm({ tipo: r.tipo, conteudo: r.conteudo, data: r.data }); setEditGeraisColaboradoresIds(colaboradoresIdsList); setEditGeraisColabBusca(""); }}><Pencil className="w-3.5 h-3.5" /></Button>
                                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 h-7 w-7 p-0" onClick={() => { if (confirm("Excluir este registro?")) deleteRegistroGeralMutation.mutate(r.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                                      </div>
                                    </div>
                                    {colaboradoresDisplay && (
                                      <details className="text-xs">
                                        <summary className="cursor-pointer text-green-700 font-medium select-none list-none flex items-center gap-1">
                                          <span className="inline-block w-3 h-3 mr-0.5">▶</span>
                                          Colaboradores ({colaboradoresIdsList.length})
                                        </summary>
                                        <ul className="mt-1 pl-4 space-y-0.5 text-gray-700">
                                          {[...colaboradoresIdsList].map((id: number) => ({ id, nome: (todosColaboradores as any[]).find((c: any) => c.id === id)?.nome })).filter(x => x.nome).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map(({ id, nome }) => (
                                            <li key={id} className="list-disc">{nome}</li>
                                          ))}
                                        </ul>
                                      </details>
                                    )}
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.conteudo}</p>
                                  </>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* DIALOG VISUALIZAÇÃO REGISTRO GERAL */}
              <Dialog open={!!viewGeraisRecord} onOpenChange={(open) => { if (!open) setViewGeraisRecord(null); }}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {viewGeraisRecord && (() => {
                        const catLabel: Record<string, string> = { atendimento_individual: "Atendimento Individual", espaco_o_grito: "Espaço O Grito", caravana_comunitaria: "Caravana Comunitária" };
                        return catLabel[viewGeraisRecord.tipo] || viewGeraisRecord.tipo;
                      })()}
                    </DialogTitle>
                    <DialogDescription>
                      {viewGeraisRecord?.data ? new Date(viewGeraisRecord.data + "T12:00:00").toLocaleDateString("pt-BR") : ""}
                    </DialogDescription>
                  </DialogHeader>
                  {viewGeraisRecord && (
                    <div className="space-y-3">
                      {viewGeraisRecord.colaboradoresIdsList?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-green-700 mb-1">Colaboradores presentes ({viewGeraisRecord.colaboradoresIdsList.length})</p>
                          <ul className="space-y-0.5 pl-3">
                            {[...viewGeraisRecord.colaboradoresIdsList].map((id: number) => ({ id, nome: (todosColaboradores as any[]).find((c: any) => c.id === id)?.nome })).filter((x: any) => x.nome).sort((a: any, b: any) => a.nome.localeCompare(b.nome, 'pt-BR')).map(({ id, nome }: any) => (
                              <li key={id} className="text-sm text-gray-700 list-disc">{nome}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Descrição</p>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{viewGeraisRecord.conteudo}</p>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* REGISTRO CONFIDENCIAL */}
              {psicoTab === "confidencial" && (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                    <strong>Importante:</strong> Os registros confidenciais são visíveis para monitores psicossociais e coordenadores psicossociais. Apenas estas duas funções têm acesso a estes registros.
                  </div>

                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800">Registros Confidenciais</h3>
                  </div>

                  <div className="flex gap-2 mb-2">
                    <Button size="sm" variant={confSubTab === "realizados" ? "default" : "outline"} onClick={() => setConfSubTab("realizados")} className={confSubTab === "realizados" ? "bg-purple-600 hover:bg-purple-700" : ""}>
                      Registros Realizados
                    </Button>
                    <Button size="sm" variant={confSubTab === "novo" ? "default" : "outline"} onClick={() => { setConfSubTab("novo"); setPsicoNovoRegistro(true); }} className={confSubTab === "novo" ? "bg-purple-600 hover:bg-purple-700" : ""}>
                      <Plus className="w-4 h-4 mr-1" /> Novo Registro
                    </Button>
                  </div>

                  {confSubTab === "novo" && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                      <h4 className="font-semibold text-purple-800">Novo Registro Confidencial</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Tipo de Atendimento</label>
                          <Select value={psicoRegistroForm.tipo} onValueChange={(v) => setPsicoRegistroForm({...psicoRegistroForm, tipo: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="visita_domiciliar">Visita Domiciliar</SelectItem>
                              <SelectItem value="situacao_risco">Situação de Risco</SelectItem>
                              <SelectItem value="encaminhamento">Encaminhamento</SelectItem>
                              <SelectItem value="atendimento_individual">Atendimento Individual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Data</label>
                          <Input type="date" value={psicoRegistroForm.data} onChange={(e) => setPsicoRegistroForm({...psicoRegistroForm, data: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Vulnerabilidade</label>
                          <Select value={psicoRegistroForm.vulnerabilidade} onValueChange={(v) => setPsicoRegistroForm({...psicoRegistroForm, vulnerabilidade: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="baixa_vulnerabilidade">Baixa Vulnerabilidade</SelectItem>
                              <SelectItem value="media_vulnerabilidade">Média Vulnerabilidade</SelectItem>
                              <SelectItem value="alta_vulnerabilidade">Alta Vulnerabilidade</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="relative">
                          <label className="text-sm font-medium mb-1 block">Participante <span className="text-red-500">*</span></label>
                          <div className="flex gap-2">
                          <div className="flex-1 relative">
                          <Input
                            value={registroPartOpen ? registroPartBusca : psicoRegistroForm.participanteNome}
                            onChange={(e) => {
                              setRegistroPartBusca(e.target.value);
                              setRegistroPartOpen(true);
                              setPsicoRegistroForm({...psicoRegistroForm, participanteNome: e.target.value, participanteCpf: "", participanteDataNascimento: ""});
                            }}
                            onFocus={() => { setRegistroPartOpen(true); setRegistroPartBusca(psicoRegistroForm.participanteNome || ""); }}
                            onBlur={() => setTimeout(() => setRegistroPartOpen(false), 200)}
                            placeholder="Buscar por nome ou CPF"
                          />
                          {registroPartOpen && (() => {
                            const todosParticipantes = [
                              ...(psicoAtendidos as any[] || []),
                              ...(atendidosComunidade as any[]).map((p: any) => ({ __nome: p.nome, cpf: p.cpf, __vertente: "comunidade" })),
                            ];
                            const filtrados = registroPartBusca.trim()
                              ? todosParticipantes.filter((p: any) => 
                                  (p.__nome || p.nome || "").toLowerCase().includes(registroPartBusca.toLowerCase()) ||
                                  (p.cpf || p.__doc || "").includes(registroPartBusca)
                                )
                              : todosParticipantes;
                            if (filtrados.length === 0) return null;
                            return (
                              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {filtrados.slice(0, 20).map((p: any, i: number) => (
                                  <button
                                    key={p.id || i}
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 flex items-center gap-2 border-b border-gray-50 last:border-0"
                                    onClick={() => {
                                      const nome = p.__nome || p.nome || "";
                                      const cpf = p.cpf || p.__doc || "";
                                      const dataNasc = p.data_nascimento || p.dataNascimento || "";
                                      setPsicoRegistroForm({...psicoRegistroForm, participanteNome: nome, participanteCpf: cpf, participanteDataNascimento: dataNasc});
                                      setRegistroPartBusca(nome);
                                      setRegistroPartOpen(false);
                                    }}
                                  >
                                    <span className="font-medium text-gray-900">{p.__nome || p.nome}</span>
                                    {(p.cpf || p.__doc) && <span className="text-xs text-gray-400">{formatCPF(p.cpf || p.__doc)}</span>}
                                    <span className="text-xs text-gray-400 ml-auto">{p.__vertente === "comunidade" ? "Comunidade" : p.__vertente === "inclusao" ? "Inclusão" : "PEC"}</span>
                                  </button>
                                ))}
                                {filtrados.length > 20 && <div className="px-3 py-1 text-xs text-gray-400 text-center">Mostrando 20 de {filtrados.length}</div>}
                              </div>
                            );
                          })()}
                          {psicoRegistroForm.participanteNome && !registroPartOpen && (
                            <button type="button" className="absolute right-2 top-8 text-gray-400 hover:text-red-500 text-xs" onClick={() => { setPsicoRegistroForm({...psicoRegistroForm, participanteNome: "", participanteCpf: "", participanteDataNascimento: ""}); setRegistroPartBusca(""); }}>✕</button>
                          )}
                          </div>
                                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Descrição / Conteúdo</label>
                        <textarea
                          className="w-full border rounded-lg p-2 text-sm min-h-[120px]"
                          value={psicoRegistroForm.conteudo}
                          onChange={(e) => setPsicoRegistroForm({...psicoRegistroForm, conteudo: e.target.value})}
                          placeholder="Descreva em detalhes o atendimento, observações, encaminhamentos realizados..."
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => setConfSubTab("realizados")}>Cancelar</Button>
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                          disabled={!psicoRegistroForm.vulnerabilidade || !psicoRegistroForm.conteudo || !psicoRegistroForm.participanteNome || createRegistroConfMutation.isPending}
                          onClick={() => createRegistroConfMutation.mutate(psicoRegistroForm)}
                        >
                          {createRegistroConfMutation.isPending ? "Salvando..." : "Salvar Registro"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {confSubTab === "realizados" && (
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          value={confSearchTerm}
                          onChange={(e) => setConfSearchTerm(e.target.value)}
                          placeholder="Pesquisar por nome do participante..."
                          className="pl-9"
                        />
                      </div>

                  {loadingRegistrosConf ? (
                    <div className="text-center py-6 text-gray-500">Carregando registros...</div>
                  ) : (() => {
                    const allRegistros = (psicoRegistrosConf as any[]);
                    const tipoLabel: Record<string, string> = { atendimento_individual: "Atendimento Individual", visita_domiciliar: "Visita Domiciliar", atendimento_coletivo: "Atendimento Coletivo", espaco_o_grito: "Espaço O Grito", acoes_saude: "Ações para Saúde", encaminhamento: "Encaminhamento", situacao_risco: "Situação de Risco", contato_familiar: "Contato Familiar", relato_espontaneo: "Relato Espontâneo", observacao_comportamental: "Observação Comportamental", outro: "Outro" };
                    const vulnLabel: Record<string, string> = { baixa_vulnerabilidade: "Baixa Vulnerabilidade", media_vulnerabilidade: "Média Vulnerabilidade", alta_vulnerabilidade: "Alta Vulnerabilidade" };
                    const grouped: Record<string, any[]> = {};
                    const semParticipante: any[] = [];
                    allRegistros.forEach((r: any) => {
                      const nome = (r.participanteNome || "").trim();
                      if (!nome) { semParticipante.push(r); return; }
                      if (!grouped[nome]) grouped[nome] = [];
                      grouped[nome].push(r);
                    });
                    const participantNames = Object.keys(grouped).sort((a, b) => a.localeCompare(b, "pt-BR"));
                    const filteredNames = confSearchTerm.trim()
                      ? participantNames.filter(n => n.toLowerCase().includes(confSearchTerm.toLowerCase()))
                      : participantNames;
                    const totalRegistros = allRegistros.length;
                    if (totalRegistros === 0) return (
                      <div className="text-center py-8 text-gray-400 border rounded-lg">Nenhum registro confidencial</div>
                    );
                    if (confSearchTerm && filteredNames.length === 0 && semParticipante.length === 0) return (
                      <div className="text-center py-8 text-gray-400 border rounded-lg">Nenhum participante encontrado para essa pesquisa</div>
                    );

                    const renderRegistro = (r: any) => {
                      if (editRegistroId === r.id) {
                        return (
                          <div key={r.id} className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                            <h4 className="font-semibold text-purple-800">Editar Registro Confidencial</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="text-sm font-medium mb-1 block">Vulnerabilidade</label>
                                <Select value={editRegistroForm.vulnerabilidade} onValueChange={(v) => setEditRegistroForm({...editRegistroForm, vulnerabilidade: v})}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="baixa_vulnerabilidade">Baixa Vulnerabilidade</SelectItem>
                                    <SelectItem value="media_vulnerabilidade">Média Vulnerabilidade</SelectItem>
                                    <SelectItem value="alta_vulnerabilidade">Alta Vulnerabilidade</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-1 block">Tipo</label>
                                <Select value={editRegistroForm.tipo} onValueChange={(v) => setEditRegistroForm({...editRegistroForm, tipo: v})}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="visita_domiciliar">Visita Domiciliar</SelectItem>
                                    <SelectItem value="situacao_risco">Situação de Risco</SelectItem>
                                    <SelectItem value="encaminhamento">Encaminhamento</SelectItem>
                                    <SelectItem value="atendimento_individual">Atendimento Individual</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-1 block">Data</label>
                                <Input type="date" value={editRegistroForm.data} onChange={(e) => setEditRegistroForm({...editRegistroForm, data: e.target.value})} />
                              </div>
                              <div className="relative">
                                <label className="text-sm font-medium mb-1 block">Participante (opcional)</label>
                                <Input
                                  value={editRegistroPartOpen ? editRegistroPartBusca : editRegistroForm.participanteNome}
                                  onChange={(e) => {
                                    setEditRegistroPartBusca(e.target.value);
                                    setEditRegistroPartOpen(true);
                                    setEditRegistroForm({...editRegistroForm, participanteNome: e.target.value});
                                  }}
                                  onFocus={() => { setEditRegistroPartOpen(true); setEditRegistroPartBusca(editRegistroForm.participanteNome || ""); }}
                                  onBlur={() => setTimeout(() => setEditRegistroPartOpen(false), 200)}
                                  placeholder="Buscar ou digitar nome do atendido"
                                />
                                {editRegistroPartOpen && (() => {
                                  const todos = (psicoAtendidos as any[] || []);
                                  const filtrados = editRegistroPartBusca.trim()
                                    ? todos.filter((p: any) => (p.__nome || p.nome || "").toLowerCase().includes(editRegistroPartBusca.toLowerCase()))
                                    : todos;
                                  if (filtrados.length === 0) return null;
                                  return (
                                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                      {filtrados.slice(0, 20).map((p: any, i: number) => (
                                        <button key={p.id || i} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 flex items-center gap-2 border-b border-gray-50 last:border-0"
                                          onClick={() => { setEditRegistroForm({...editRegistroForm, participanteNome: p.__nome || p.nome}); setEditRegistroPartBusca(p.__nome || p.nome); setEditRegistroPartOpen(false); }}>
                                          <span className="font-medium text-gray-900">{p.__nome || p.nome}</span>
                                          <span className="text-xs text-gray-400 ml-auto">{p.__vertente === "inclusao" ? "Inclusão" : "PEC"}</span>
                                        </button>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-1 block">Conteudo</label>
                              <textarea className="w-full border rounded-lg p-2 text-sm min-h-[120px]" value={editRegistroForm.conteudo} onChange={(e) => setEditRegistroForm({...editRegistroForm, conteudo: e.target.value})} />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="sm" onClick={() => setEditRegistroId(null)}>Cancelar</Button>
                              <Button size="sm" className="bg-purple-600 hover:bg-purple-700"
                                disabled={!editRegistroForm.vulnerabilidade || !editRegistroForm.conteudo || updateRegistroConfMutation.isPending}
                                onClick={() => updateRegistroConfMutation.mutate({ id: r.id, ...editRegistroForm })}>
                                {updateRegistroConfMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                              </Button>
                            </div>
                          </div>
                        );
                      }
                      const isRegExpanded = confExpandedRegistro === r.id;
                      return (
                        <div key={r.id} className="border rounded-lg ml-4 overflow-hidden">
                          <button
                            type="button"
                            className="w-full flex items-center justify-between px-3 py-2 bg-white hover:bg-purple-50/50 transition-colors text-left"
                            onClick={() => setConfExpandedRegistro(isRegExpanded ? null : r.id)}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <ChevronRight className={`w-3 h-3 text-purple-400 transition-transform flex-shrink-0 ${isRegExpanded ? "rotate-90" : ""}`} />
                              <span className="font-medium text-sm truncate">{vulnLabel[r.titulo || ""] || r.titulo || "-"}</span>
                              <Badge variant="outline" className="text-xs border-purple-300 text-purple-600 flex-shrink-0">{tipoLabel[r.tipo] || r.tipo}</Badge>
                              <span className="text-xs text-gray-400 flex-shrink-0">{r.data ? new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR") : "-"}</span>
                            </div>
                            <div className="flex gap-1 ml-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" className="text-purple-500 hover:text-purple-700 hover:bg-purple-50 h-7 w-7 p-0"
                                onClick={() => {
                                  setEditRegistroId(r.id);
                                  setEditRegistroForm({ vulnerabilidade: r.titulo || "baixa_vulnerabilidade", tipo: r.tipo || "atendimento_individual", conteudo: r.conteudo || "", participanteNome: r.participanteNome || "", data: r.data || "" });
                                  setEditRegistroPartBusca(r.participanteNome || "");
                                }}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                                onClick={() => { if (confirm("Tem certeza que deseja excluir este registro?")) deleteRegistroConfMutation.mutate(r.id); }}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </button>
                          {isRegExpanded && (
                            <div className="border-t bg-gray-50 px-4 py-3 space-y-2">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                <div><span className="text-gray-500 font-medium">Tipo:</span> <span>{tipoLabel[r.tipo] || r.tipo}</span></div>
                                <div><span className="text-gray-500 font-medium">Data:</span> <span>{r.data ? new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR") : "-"}</span></div>
                                {r.participanteNome && <div><span className="text-gray-500 font-medium">Participante:</span> <span className="text-purple-600">{r.participanteNome}</span></div>}
                              </div>
                              <div>
                                <span className="text-gray-500 font-medium text-sm">Conteudo:</span>
                                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap bg-white rounded p-2 border">{r.conteudo}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    };

                    return (
                      <div className="space-y-2">
                        {confSearchTerm && <p className="text-xs text-gray-500">{filteredNames.length} participante(s) encontrado(s)</p>}
                        {filteredNames.map((nome) => {
                          const registros = grouped[nome];
                          const isExpanded = confExpandedParticipante === nome;
                          return (
                            <div key={nome} className="border rounded-lg overflow-hidden">
                              <button
                                type="button"
                                className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-purple-50 transition-colors"
                                onClick={() => setConfExpandedParticipante(isExpanded ? null : nome)}
                              >
                                <div className="flex items-center gap-2">
                                  <ChevronDown className={`w-4 h-4 text-purple-500 transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"}`} />
                                  <span className="font-medium text-gray-900">{nome}</span>
                                </div>
                                <Badge variant="outline" className="text-xs border-purple-300 text-purple-600">{registros.length} registro(s)</Badge>
                              </button>
                              {isExpanded && (
                                <div className="border-t bg-gray-50 p-3 space-y-2">
                                  {registros.map((r: any) => renderRegistro(r))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {semParticipante.length > 0 && !confSearchTerm && (
                          <div className="border rounded-lg overflow-hidden">
                            <button
                              type="button"
                              className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
                              onClick={() => setConfExpandedParticipante(confExpandedParticipante === "__sem_participante__" ? null : "__sem_participante__")}
                            >
                              <div className="flex items-center gap-2">
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${confExpandedParticipante === "__sem_participante__" ? "rotate-0" : "-rotate-90"}`} />
                                <span className="font-medium text-gray-500 italic">Sem participante vinculado</span>
                              </div>
                              <Badge variant="outline" className="text-xs">{semParticipante.length} registro(s)</Badge>
                            </button>
                            {confExpandedParticipante === "__sem_participante__" && (
                              <div className="border-t bg-gray-50 p-3 space-y-2">
                                {semParticipante.map((r: any) => renderRegistro(r))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                    </div>
                  )}
                </div>
              )}

              {/* ACOMPANHAMENTOS PEDAGÓGICOS */}
              {psicoTab === "acompanhamentos" && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">Observações pedagógicas registradas pelos professores sobre os alunos.</p>
                  {todosAcompanhamentosPsico.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 border rounded-lg">Nenhum acompanhamento registrado ainda.</div>
                  ) : (
                    <div className="space-y-3">
                      {todosAcompanhamentosPsico.map((ac: any) => {
                        const dateStr = ac.data;
                        return (
                          <div key={ac.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                              <span className="font-medium text-sm">{ac.titulo || 'Acompanhamento'}</span>
                              <div className="flex gap-2 flex-wrap">
                                {ac.tipoObservacao && (
                                  <span className="text-xs bg-blue-100 text-blue-700 rounded px-2 py-0.5 capitalize">{ac.tipoObservacao}</span>
                                )}
                                {dateStr && (
                                  <span className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">
                                    {new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00')).toLocaleDateString('pt-BR')}
                                  </span>
                                )}
                              </div>
                            </div>
                            {ac.alunoCpf && (
                              <p className="text-xs text-blue-600 mb-1">Aluno CPF: {ac.alunoCpf}</p>
                            )}
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{ac.observacoes}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* DEMANDA ESPONTÂNEA */}
              {psicoTab === "demanda" && (
                <DemandaEspontaneaSection
                  userId={String(authUserId || safeUserId || "")}
                  userRole="monitor_psico"
                />
              )}
          </div>
        </div>

      </div>
    );
  }
  return (
    
    <div className="min-h-screen bg-slate-900" data-testid="monitor-page">
      {/* Header */}
      <div className={`bg-slate-900 border-b border-slate-700 px-4 py-4 md:px-6 ${vertente === 'pec' ? 'border-l-4 border-l-orange-500' : vertente === 'inclusao' ? 'border-l-4 border-l-green-500' : ''}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${vertente === 'pec' ? 'bg-orange-500' : vertente === 'inclusao' ? 'bg-green-500' : 'bg-gray-500'} rounded-full flex items-center justify-center`}>
              <VertenteIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white" data-testid="text-welcome">
                  Monitor - {(currentVertente?.nome || (vertente === "psico" ? "Psicossocial" : "Monitor"))}
              </h1>
              <p className="text-slate-400" data-testid="text-username">Bem-vindo, {userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
                    <Badge
          variant="outline"
          className={
            vertente === "pec"
              ? "border-orange-500 text-orange-600"
              : vertente === "inclusao"
              ? "border-green-500 text-green-600"
              : vertente === "psico"
              ? "border-purple-500 text-purple-600"
              : ""
          }
        >
          {vertente === "pec"
            ? "🎓 PEC"
            : vertente === "inclusao"
            ? "💼 Inclusão"
            : vertente === "psico"
            ? "🧠 Psicossocial"
            : "👥 Monitor"}
        </Badge>
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleExportReport}
              data-testid="button-export"
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAlterarSenhaModal(true)}
              data-testid="button-alterar-senha"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Shield className="w-4 h-4 mr-2" />
              Alterar Senha
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
        
        {/* Dashboard Visual */}
        {(vertente === "pec" || vertente === "inclusao" || vertente === "psico") && (
          <MonitorDashboard
            vertente={vertente}
            dashboardData={dashboardData}
            alunosPec={alunosPec}
            participantesInclusao={participantesInclusao}
            monitorGruposData={monitorGruposData}
            gruposInclusaoData={gruposData}
            atividadesData={atividadesData}
            historicoChamadas={historicoChamadas}
            psicoAtendidos={psicoAtendidos}
            psicoTurmas={psicoTurmas}
            psicoHistoricoChamadas={psicoHistoricoChamadas}
            psicoAtividades={psicoAtividades}
            psicoRegistrosConf={psicoRegistrosConf}
            isLoading={vertente === "pec" ? (dashboardLoading || alunosPecLoading) : vertente === "inclusao" ? participantesLoading : loadingAtendidos}
            filtroAno={dashFiltroAno}
            filtroMes={dashFiltroMes}
            onFilterChange={(ano: number, mes: number) => { setDashFiltroAno(ano); setDashFiltroMes(mes); }}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Acompanhamento de Alunos */}
          <Card data-testid="card-alunos">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-green-500" />
                Acompanhamento de Alunos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Acompanhe o desenvolvimento dos alunos, frequência e progresso nas atividades.
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  variant={activeSection === 'alunos' ? 'default' : 'outline'}
                  data-testid="button-ver-alunos"
                  onClick={() => changeSection('alunos')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Meus Alunos
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'presenca' ? 'default' : 'outline'}
                  data-testid="button-presenca"
                  onClick={() => changeSection('presenca')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Controle de Presença
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Atividades Educativas */}
          <Card data-testid="card-atividades">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="w-5 h-5 text-orange-500" />
                Atividades Educativas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Organize e conduza atividades complementares e de reforço educativo.
              </p>
              <div className="space-y-2">
                {vertente === 'pec' && (
                  <Button 
                    className="w-full bg-blue-500 hover:bg-blue-600" 
                    data-testid="button-nova-oficina-menu"
                    onClick={() => setShowNovaOficinaModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Oficina
                  </Button>
                )}
                <Button 
                  className="w-full" 
                  variant={activeSection === 'atividades' ? 'default' : 'outline'}
                  data-testid="button-atividades"
                  onClick={() => changeSection('atividades')}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Minhas Atividades
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'registro' ? 'default' : 'outline'}
                  data-testid="button-registro-atividades"
                  onClick={() => changeSection('registro')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Registro de Atividades
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Turmas e Horários */}
          <Card data-testid="card-turmas">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-purple-500" />
                Turmas e Horários
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Gerencie suas turmas e organize horários de atividades.
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  variant={activeSection === 'grupos' ? 'default' : 'outline'}
                  data-testid="button-minhas-turmas"
                  onClick={() => changeSection('grupos')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Minhas Turmas
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'calendario' ? 'default' : 'outline'}
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
                <FileText className="w-5 h-5 text-red-500" />
                Relatórios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Gere relatórios de acompanhamento e desempenho dos alunos.
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  variant={activeSection === 'relatorios' ? 'default' : 'outline'}
                  data-testid="button-relatorio-desenvolvimento"
                  onClick={() => changeSection('relatorios')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Relatórios
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'acompanhamento' ? 'default' : 'outline'}
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
                {vertente === "inclusao" && (
                  <Button
                    className="w-full"
                    variant={activeSection === 'geracao-renda' ? 'default' : 'outline'}
                    onClick={() => changeSection('geracao-renda')}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Geração de Renda
                  </Button>
                )}
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

          <AlertDialog open={confirmInativarOpen} onOpenChange={setConfirmInativarOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Inativar turma</AlertDialogTitle>
                <AlertDialogDescription>
                  {turmaParaInativar?.nome
                    ? `Tem certeza que deseja inativar a turma "${turmaParaInativar.nome}"?`
                    : "Tem certeza que deseja inativar esta turma?"}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={updateGrupoMutation.isPending}>
                  Cancelar
                </AlertDialogCancel>

                <AlertDialogAction
                  disabled={updateGrupoMutation.isPending}
                  onClick={async () => {
                    if (!turmaParaInativar?.id) return;

                    if (vertente === 'inclusao') {
                      try {
                        const resp = await fetch(`/api/turmas-inclusao/${turmaParaInativar.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ status: 'inativo' })
                        });
                        if (!resp.ok) throw new Error('Falha ao inativar');
                        queryClient.invalidateQueries({ queryKey: ['/api/turmas-inclusao'] });
                        queryClient.invalidateQueries({ queryKey: ["/api/monitor/grupos", resolvedMonitorId, vertente] });
                        queryClient.invalidateQueries({ queryKey: ['/api/professor/turmas'] });
                        toast({ title: "Turma inativada!", description: "A turma foi inativada com sucesso." });
                      } catch {
                        toast({ title: "Erro ao inativar turma", variant: "destructive" });
                      }
                    } else {
                      updateGrupoMutation.mutate({
                        grupoId: turmaParaInativar.id,
                        formData: { status: "inativo" },
                      });
                    }

                    setConfirmInativarOpen(false);
                    setTurmaParaInativar(null);
                  }}
                >
                  {updateGrupoMutation.isPending ? "Inativando..." : "Confirmar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </div>

        {/* Footer de Navegação */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Área exclusiva para monitores • Sistema RBAC Isolado
          </p>
        </div>

        {/* Área de Conteúdo Dinâmica */}
        {!isPsico && (
        <div className="mt-8" id="monitor-content-area">
          {activeSection === 'dashboard' && (
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Principal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Visão geral das atividades de monitoria e acompanhamento.</p>
              </CardContent>
            </Card>
          )}

          {activeSection === 'alunos' && vertente === 'inclusao' && (
            <ParticipantesInclusaoSection showImportExport={false} hideSensitive={true} />
          )}

          {activeSection === 'alunos' && vertente !== 'inclusao' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {vertente === 'pec' ? '📚 Alunos do PEC' : 'Meus Alunos'}
                </CardTitle>
                <Button 
                  size="sm" 
                  className={vertente === 'pec' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-orange-500 hover:bg-orange-600'} 
                   onClick={() => {
                    setEditingCpf(undefined);

                      if (vertente === "pec") {
                        setViewMode(false);
                        setShowCadastroModal(true);
                      } else {
                        setShowAddAlunoModal(true);
                      }
                  }}
                  data-testid="button-add-aluno"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {vertente === 'pec' ? 'Novo Aluno' : 'Adicionar Aluno'}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder={vertente === 'pec' ? 'Buscar alunos por nome ou CPF...' : 'Buscar alunos...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10" 
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {vertente === 'pec' ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>CPF</TableHead>
                          <TableHead>Nascimento</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {alunosPecLoading ? (
                          <TableRow><TableCell colSpan={6}>Carregando...</TableCell></TableRow>
                        ) : [...(alunosPec || [])]
                          .sort((a: any, b: any) => {
                            const nomeA = (a.nome_completo || '').trim().toLowerCase();
                            const nomeB = (b.nome_completo || '').trim().toLowerCase();
                            return nomeA.localeCompare(nomeB, 'pt-BR');
                          })
                          .filter((a: any) => {
                            const matchesSearch = !searchTerm || 
                              (a.nome_completo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (a.cpf || '').includes(searchTerm);
                            const alunoStatus = a.situacao_atendimento || a.status || 'ativo';
                            const matchesStatus = statusFilter === 'todos' || alunoStatus === statusFilter;
                            return matchesSearch && matchesStatus;
                          }).length > 0 ? (
                          [...(alunosPec || [])]
                            .sort((a: any, b: any) => {
                              const nomeA = (a.nome_completo || '').trim().toLowerCase();
                              const nomeB = (b.nome_completo || '').trim().toLowerCase();
                              return nomeA.localeCompare(nomeB, 'pt-BR');
                            })
                            .filter((a: any) => {
                              const matchesSearch = !searchTerm || 
                                (a.nome_completo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (a.cpf || '').includes(searchTerm);
                              const alunoStatus = a.situacao_atendimento || a.status || 'ativo';
                              const matchesStatus = statusFilter === 'todos' || alunoStatus === statusFilter;
                              return matchesSearch && matchesStatus;
                            }).map((aluno: any) => {
                            const alunoStatus = aluno.situacao_atendimento || aluno.status || 'ativo';
                            const isInativo = alunoStatus === 'inativo';
                            return (
                              <TableRow key={aluno.id || aluno.cpf} className={isInativo ? 'opacity-60' : ''}>
                                <TableCell className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  {aluno.nome_completo}
                                </TableCell>
                                <TableCell>{maskCpfMonitor(aluno.cpf)}</TableCell>
                                <TableCell>{aluno.data_nascimento ? new Date(aluno.data_nascimento).toLocaleDateString('pt-BR') : '-'}</TableCell>
                                <TableCell>{aluno.telefone || '-'}</TableCell>
                                <TableCell>
                                  <Badge className={isInativo ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                                    {alunoStatus}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async () => {
                                        setSelectedAluno(aluno);
                                        setShowAlunoDetalhesModal(true);
                                        setLoadingAlunoDetails(true);
                                        try {
                                          const cpf = String(aluno.cpf || '').replace(/\D/g, '');
                                          const res = await fetch(`/api/students/${cpf}`, { credentials: 'include' });
                                          const json = await res.json();
                                          setFullAlunoData(json?.data ?? json ?? null);
                                        } catch {
                                          setFullAlunoData(null);
                                        } finally {
                                          setLoadingAlunoDetails(false);
                                        }
                                      }}
                                      className="h-8 px-2"
                                      title="Visualizar"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingCpf(aluno.cpf);
                                        setViewMode(false);
                                        setShowCadastroModal(true);
                                      }}
                                      className="h-8 px-2"
                                      title="Editar"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    {isInativo ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => reativarAlunoMutation.mutate(aluno.cpf)}
                                        disabled={reativarAlunoMutation.isPending}
                                        className="h-8 px-2 text-green-600 border-green-300 hover:bg-green-50"
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => inativarAlunoMutation.mutate(aluno.cpf)}
                                        disabled={inativarAlunoMutation.isPending}
                                        className="h-8 px-2 text-red-600 border-red-300 hover:bg-red-50"
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow><TableCell colSpan={6}>Nenhum aluno PEC encontrado</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Grupo</TableHead>
                          <TableHead>Frequência</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {alunosLoading ? (
                          <TableRow><TableCell colSpan={5}>Carregando...</TableCell></TableRow>
                        ) : alunosData?.length > 0 ? (
                          alunosData.map((aluno: any) => (
                            <TableRow key={aluno.id}>
                              <TableCell className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                {aluno.nome}
                              </TableCell>
                              <TableCell>{aluno.grupo || 'Sem grupo'}</TableCell>
                              <TableCell>{aluno.frequencia}%</TableCell>
                              <TableCell>
                                <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedAluno(aluno);
                                      setShowViewAlunoModal(true);
                                    }}
                                    data-testid={`button-view-aluno-${aluno.id}`}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedAluno(aluno);
                                      setEditFormData({
                                        observacoesPrivadas: aluno.observacoesPrivadas || '',
                                        acompanhamentoStatus: aluno.acompanhamentoStatus || 'ativo'
                                      });
                                      setShowEditAlunoModal(true);
                                    }}
                                    data-testid={`button-edit-aluno-${aluno.id}`}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow><TableCell colSpan={5}>Nenhum aluno atribuído</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'presenca' && vertente === 'inclusao' && (
            <Card className="mb-2">
              <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Aulas de Hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AulasHojePanel
                  modulo="inclusao"
                  turmaId={presencaGrupo ? Number(presencaGrupo) : undefined}
                  userId={userId || ''}
                  participantes={(grupoAlunosData as any[])?.map((a: any) => ({ cpf: a.cpf || '', nome: a.nome || a.nome_completo || '' })).filter((p: any) => p.cpf) || []}
                />
              </CardContent>
            </Card>
          )}

          {activeSection === 'presenca' && vertente === 'inclusao' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Controle de Presença
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
                  onClick={() => {
                    setShowHistoricoChamadas(!showHistoricoChamadas);
                    if (!showHistoricoChamadas) {
                      refetchHistorico();
                    }
                  }}
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
                        <Select
                          value={presencaGrupo}
                          onValueChange={(val) => {
                            setPresencaData("");
                            setPresencaGrupo(val);
                            const gruposArray = (monitorGruposData?.length ? monitorGruposData : gruposData) || [];
                            const turma = gruposArray.find((t: any) => String(t.id) === String(val));
                            const v = (turma?.vertente as MonitorVertente) || vertente;
                            setPresencaVertente(v);
                            setPresencas([]);
                          }}
                        >
                          <SelectTrigger data-testid="select-presenca-turma">
                            <SelectValue placeholder="Selecione a turma" />
                          </SelectTrigger>
                          <SelectContent>
                            {monitorGruposData && Array.isArray(monitorGruposData) && monitorGruposData.length > 0 ? (
                              monitorGruposData
                                .filter((g: any) => g.status !== 'inativo')
                                .map((grupo: any) => (
                                  <SelectItem key={grupo.id} value={grupo.id.toString()}>
                                    <div className="flex items-center gap-2">
                                      <span>{grupo.nome} {grupo.nivel ? `- ${grupo.nivel}` : ''}</span>
                                      {grupo.temCatraca && (
                                        <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 pointer-events-none">
                                          <Zap className="w-2.5 h-2.5 mr-0.5 inline" />
                                          Catraca
                                        </Badge>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))
                            ) : (
                              <SelectItem value="no-turmas" disabled>Nenhuma turma disponível</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium mb-2">Data da Aula</label>
                        <Select value={presencaData} onValueChange={setPresencaData} disabled={!presencaGrupo || !!editingChamadaId}>
                          <SelectTrigger data-testid="select-presenca-data">
                            <SelectValue placeholder={presencaGrupo ? "Selecione a data" : "Selecione a turma primeiro"} />
                          </SelectTrigger>
                          <SelectContent>
                            {diasAulaDisponiveis.length > 0 ? (
                              diasAulaDisponiveis.map((dia) => (
                                <SelectItem key={dia.date} value={dia.date}>
                                  {dia.label} ({dia.dayOfWeek})
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-dias" disabled>
                                {presencaGrupo ? "Nenhum dia de aula configurado" : "Selecione uma turma"}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      {presencaGrupo && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {editingChamadaId ? (
                            existingFotoUrl ? (
                              <div className="flex items-center gap-2">
                                <img src={existingFotoUrl} alt="Foto comprovante" className="w-10 h-10 rounded object-cover border" />
                                <span className="text-xs text-gray-500">Foto comprovante (somente leitura)</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Camera className="w-4 h-4 text-gray-400" />
                                <span className="text-xs text-gray-500">Sem foto comprovante</span>
                              </div>
                            )
                          ) : (
                            <>
                              <label className="flex items-center gap-2 cursor-pointer border rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
                                <Camera className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">{fotoFile ? fotoFile.name : 'Foto comprovante'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => setFotoFile(e.target.files?.[0] || null)}
                                />
                              </label>
                              {fotoFile && (
                                <img src={URL.createObjectURL(fotoFile)} alt="Preview" className="w-10 h-10 rounded object-cover border" />
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {editingChamadaId && (
                        <div className="border rounded-lg p-3 space-y-1">
                          <p className="text-xs font-medium text-gray-600 flex items-center gap-1">
                            <Utensils className="w-3.5 h-3.5" />
                            Teve alimentação nessa aula?
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingTeveAlimentacao(true)}
                              className={`flex-1 py-1.5 text-xs rounded-md border font-medium transition-colors ${editingTeveAlimentacao === true ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                            >
                              ✓ Sim, teve
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTeveAlimentacao(false)}
                              className={`flex-1 py-1.5 text-xs rounded-md border font-medium transition-colors ${editingTeveAlimentacao === false ? 'bg-red-50 border-red-400 text-red-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                            >
                              ✗ Não teve
                            </button>
                          </div>
                          {editingTeveAlimentacao === null && (
                            <p className="text-xs text-amber-600">Não definido (chamada antiga)</p>
                          )}
                        </div>
                      )}
                      <div className="relative">
                        <Button 
                          className="bg-green-500 hover:bg-green-600 w-full"
                          onClick={() => {
                            const semJust = presencas.filter(p => !p.presente && !p.justificativa);
                            if (semJust.length > 0) {
                              setModalJustItems(semJust.map(p => ({ alunoCpf: p.alunoCpf, nome: p.nome, motivo: 'Sem justificativa', obs: '', contaComoPresenca: false })));
                              setShowJustificativaModal(true);
                            } else {
                              if (!editingChamadaId) setShowAlimentacaoModal(true);
                              else saveChamadaMutation.mutate();
                            }
                          }}
                          disabled={!presencaGrupo || presencas.length === 0 || saveChamadaMutation.isPending}
                          data-testid="button-finalizar-chamada"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {saveChamadaMutation.isPending ? 'Salvando...' : editingChamadaId ? 'Atualizar Presenças' : 'Finalizar Chamada'}
                        </Button>
                      </div>
                      {editingChamadaId && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingChamadaId(null);
                            setPresencaGrupo('');
                            setPresencaData('');
                            setPresencas([]);
                            setFotoFile(null);
                            setExistingFotoUrl(null);
                            setEditingTeveAlimentacao(null);
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancelar Edição
                        </Button>
                      )}
                    </div>

                    {presencaGrupo && !editingChamadaId && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border">
                        <div className="flex items-center gap-2">
                          {modoManual ? (
                            <>
                              <Hand className="w-4 h-4 text-orange-500" />
                              <span className="text-sm font-medium text-orange-700">Modo Manual</span>
                              <span className="text-xs text-gray-500">- Marque presença manualmente</span>
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
                        <Button
                          variant={modoManual ? "default" : "outline"}
                          size="sm"
                          className={modoManual ? "bg-orange-500 hover:bg-orange-600" : ""}
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
                    )}

                    {presencaGrupo && monitorCatracaLog?.entradas && monitorCatracaLog.entradas.length > 0 && (
                      <div className="border rounded-lg p-3 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <Zap className="w-4 h-4 text-blue-500" />
                            Entradas via Catraca Hoje
                          </h4>
                          <span className="text-xs text-gray-400">
                            {monitorCatracaLog.entradas.filter((e: any) => {
                              const turma = monitorGruposData?.find((t: any) => t.id.toString() === presencaGrupo);
                              return turma ? (e.turma === turma.nome) : true;
                            }).length} registro{monitorCatracaLog.entradas.filter((e: any) => {
                              const turma = monitorGruposData?.find((t: any) => t.id.toString() === presencaGrupo);
                              return turma ? (e.turma === turma.nome) : true;
                            }).length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="grid gap-1.5 max-h-[160px] overflow-y-auto">
                          {monitorCatracaLog.entradas
                            .filter((e: any) => {
                              const turma = monitorGruposData?.find((t: any) => t.id.toString() === presencaGrupo);
                              return turma ? (e.turma === turma.nome) : true;
                            })
                            .map((entry: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between py-1.5 px-2 rounded bg-blue-50 border border-blue-100">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                  <span className="text-sm">{entry.nome}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[10px] px-1.5 border-blue-200 text-blue-600">
                                    {entry.turma}
                                  </Badge>
                                  <span className="text-xs text-gray-500 font-mono">{entry.hora}</span>
                                </div>
                              </div>
                            ))
                          }
                          {monitorCatracaLog.entradas.filter((e: any) => {
                            const turma = monitorGruposData?.find((t: any) => t.id.toString() === presencaGrupo);
                            return turma ? (e.turma === turma.nome) : true;
                          }).length === 0 && (
                            <div className="text-center py-2 text-xs text-gray-400">Nenhuma entrada desta turma hoje</div>
                          )}
                        </div>
                      </div>
                    )}

                    {presencaGrupo && (
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-4">
                          Lista de Presença - {monitorGruposData?.find((t: any) => t.id.toString() === presencaGrupo)?.nome || 'Turma'}
                          {editingChamadaId && <Badge className="ml-2 bg-yellow-500">Editando</Badge>}
                          {grupoAlunosLoading && <span className="text-sm text-gray-500 ml-2">Carregando...</span>}
                        </h3>
                        {grupoAlunosLoading ? (
                          <div className="text-center py-4 text-gray-500">Carregando participantes...</div>
                        ) : presencas.length === 0 ? (
                          <div className="text-center py-4 text-gray-500">
                            <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p>Nenhum participante nesta turma.</p>
                            <p className="text-sm">Adicione participantes na seção "Turmas".</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {[...presencas]
                              .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'))
                              .map((aluno) => {
                                const originalIndex = presencas.findIndex(p => p.alunoCpf === aluno.alunoCpf);
                                return (
                              <div key={aluno.alunoCpf} className={`flex items-center justify-between p-3 border rounded flex-wrap gap-2 ${!modoManual && !aluno.viaCatraca && !aluno.presente ? 'opacity-60' : ''}`}>
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
                                {modoManual || editingChamadaId ? (
                                <div className="flex items-center gap-4">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                      type="radio" 
                                      name={`presenca-${aluno.alunoCpf}`}
                                      checked={aluno.presente === true}
                                      onChange={() => {
                                        const newPresencas = [...presencas];
                                        newPresencas[originalIndex] = { ...aluno, presente: true, justificativa: undefined };
                                        setPresencas(newPresencas);
                                      }}
                                      className="w-4 h-4 text-green-600"
                                    />
                                    <span className="text-sm text-green-600">Presente</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                      type="radio" 
                                      name={`presenca-${aluno.alunoCpf}`}
                                      checked={aluno.presente === false}
                                      onChange={() => {
                                        const newPresencas = [...presencas];
                                        newPresencas[originalIndex] = { ...aluno, presente: false };
                                        setPresencas(newPresencas);
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
                                {aluno.presente === false && (modoManual || editingChamadaId) && (
                                  <div className="w-full mt-1 space-y-1">
                                    <div className="flex flex-wrap gap-1">
                                      {['Doença', 'Atestado médico', 'Escola', 'Trabalho', 'Transporte', 'Família', 'Compromisso pessoal', 'Chuva/Clima', 'Outro', 'Sem justificativa'].map((opcao) => (
                                        <button
                                          key={opcao}
                                          type="button"
                                          onClick={() => {
                                            const newPresencas = [...presencas];
                                            newPresencas[originalIndex] = { ...aluno, justificativa: opcao };
                                            setPresencas(newPresencas);
                                          }}
                                          className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${aluno.justificativa === opcao ? (opcao === 'Sem justificativa' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-blue-100 border-blue-400 text-blue-700') : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                                        >
                                          {opcao}
                                        </button>
                                      ))}
                                    </div>
                                    <Input
                                      placeholder="Ou escreva a justificativa..."
                                      value={aluno.justificativa || ''}
                                      onChange={(e) => {
                                        const newPresencas = [...presencas];
                                        newPresencas[originalIndex] = { ...aluno, justificativa: e.target.value };
                                        setPresencas(newPresencas);
                                      }}
                                      className="h-8 text-sm"
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
                    
                    {!presencaGrupo && (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Selecione uma turma para fazer a chamada</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Histórico de Presenças</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="text-sm font-medium">Turma</label>
                        <Select value={historicoFiltroTurma} onValueChange={setHistoricoFiltroTurma}>
                          <SelectTrigger>
                            <SelectValue placeholder="Todas as turmas" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todas">Todas as turmas</SelectItem>
                            {(monitorGruposData || []).map((turma: any) => (
                              <SelectItem key={turma.id} value={turma.nome}>{turma.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Data Início</label>
                        <Input
                          type="date"
                          value={historicoFiltroDataInicio}
                          onChange={(e) => setHistoricoFiltroDataInicio(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Data Fim</label>
                        <Input
                          type="date"
                          value={historicoFiltroDataFim}
                          onChange={(e) => setHistoricoFiltroDataFim(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    {historicoLoading ? (
                      <div className="text-center py-8 text-gray-500">Carregando histórico...</div>
                    ) : !historicoChamadas || !Array.isArray(historicoChamadas) || historicoChamadas.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Nenhuma chamada registrada ainda.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {historicoChamadas
                          .filter((registro: any) => {
                            const turmaNome = registro.grupo || registro.turmaNome || '';
                            const dataAtividade = registro.data || registro.dataAtividade;
                            
                            if (historicoFiltroTurma && historicoFiltroTurma !== 'todas' && turmaNome !== historicoFiltroTurma) {
                              return false;
                            }
                            if (historicoFiltroDataInicio && dataAtividade) {
                              const dataRegistro = new Date(dataAtividade);
                              const dataInicio = new Date(historicoFiltroDataInicio);
                              if (dataRegistro < dataInicio) return false;
                            }
                            if (historicoFiltroDataFim && dataAtividade) {
                              const dataRegistro = new Date(dataAtividade);
                              const dataFim = new Date(historicoFiltroDataFim);
                              dataFim.setHours(23, 59, 59);
                              if (dataRegistro > dataFim) return false;
                            }
                            return true;
                          })
                          .map((chamada: any) => {
                            const presentes = chamada.totalPresentes ?? 0;
                            const total = chamada.totalAlunos ?? presentes;
                            const dataAtividade = chamada.data || chamada.dataAtividade;
                            return (
                              <div key={chamada.id} className="border rounded-lg overflow-hidden">
                                <div 
                                  className="p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                                  onClick={() => setHistoricoExpandido(historicoExpandido === chamada.id ? null : chamada.id)}
                                >
                                  <div className="flex items-center gap-3">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium">
                                      {dataAtividade ? new Date(dataAtividade + 'T12:00:00').toLocaleDateString('pt-BR') : 'Sem data'}
                                    </span>
                                    <span className="text-gray-500">-</span>
                                    <span>{chamada.grupo || chamada.turmaNome}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-green-600 font-medium">
                                      {presentes}/{total} presentes
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const turmaId = chamada.grupoId || chamada.turmaId;
                                        setPresencaGrupo(String(turmaId));
                                        setPresencaData(dataAtividade || '');
                                        setEditingChamadaId(chamada.id);
                                        setPresencaVertente('inclusao' as MonitorVertente);
                                        setEditingTeveAlimentacao(chamada.teveAlimentacao ?? null);
                                        if (chamada.presencas && chamada.presencas.length > 0) {
                                          setPresencas(chamada.presencas.map((p: any) => ({
                                            alunoCpf: p.alunoCpf || p.cpf || '',
                                            nome: p.alunoNome || p.nome || 'Sem nome',
                                            presente: p.presente === true || p.status === 'presente',
                                            justificativa: p.justificativa || undefined,
                                          })));
                                        }
                                        const fotoUrl = chamada.fotoComprovante || chamada.foto_comprovante || (chamada.presencas || []).find((p: any) => p.fotoComprovante)?.fotoComprovante || null;
                                        setExistingFotoUrl(fotoUrl);
                                        setFotoFile(null);
                                        setShowHistoricoChamadas(false);
                                      }}
                                    >
                                      <Pencil className="w-3.5 h-3.5 mr-1" />
                                      Editar
                                    </Button>
                                    {historicoExpandido === chamada.id ? (
                                      <ChevronUp className="w-4 h-4 text-gray-500" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-gray-500" />
                                    )}
                                  </div>
                                </div>
                                
                                {historicoExpandido === chamada.id && chamada.presencas && (
                                  <div className="p-3 border-t bg-white">
                                    <div className="text-sm font-medium mb-2 text-gray-600">Lista de Presença:</div>
                                    <div className="grid gap-2">
                                      {chamada.presencas.map((p: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between py-1 px-2 rounded bg-gray-50">
                                          <span className="text-sm">{p.alunoNome || p.nome}</span>
                                          <span className={`text-xs font-medium ${p.presente ? 'text-green-600' : 'text-red-600'}`}>
                                            {p.presente ? 'Presente' : 'Falta'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === 'presenca' && vertente !== 'inclusao' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Controle de Presença
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
                  onClick={() => {
                    setShowHistoricoChamadas(!showHistoricoChamadas);
                    if (!showHistoricoChamadas) {
                      refetchHistorico();
                    }
                  }}
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
                        <Select
                          value={presencaGrupo}
                          onValueChange={(val) => {
                            setPresencaData("");
                            setPresencaGrupo(val);
                            const gruposArray = (monitorGruposData?.length ? monitorGruposData : gruposData) || [];
                            const turma = gruposArray.find((t: any) => String(t.id) === String(val));
                            const v = (turma?.vertente as MonitorVertente) || vertente;
                            setPresencaVertente(v);
                            setPresencas([]);
                          }}
                        >
                          <SelectTrigger data-testid="select-presenca-grupo">
                            <SelectValue placeholder="Selecione a turma" />
                          </SelectTrigger>
                          <SelectContent>
                            {monitorGruposData && Array.isArray(monitorGruposData) && monitorGruposData.length > 0 ? (
                              monitorGruposData
                                .filter((g: any) => g.status !== 'inativo')
                                .map((grupo: any) => {
                                  const temCatraca = grupo.control_mode === 'intelbras'
                                    || monitorCatracaLog?.entradas?.some((e: any) => e.turma === grupo.nome);
                                  return (
                                  <SelectItem key={grupo.id} value={grupo.id.toString()}>
                                    <div className="flex items-center gap-2">
                                      <span>{grupo.nome} {grupo.nivel ? `- ${grupo.nivel}` : ''}</span>
                                      {temCatraca && (
                                        <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 pointer-events-none">
                                          <Zap className="w-2.5 h-2.5 mr-0.5 inline" />
                                          Catraca
                                        </Badge>
                                      )}
                                    </div>
                                  </SelectItem>
                                  );
                                })
                            ) : (
                              <SelectItem value="no-grupos" disabled>Nenhuma turma disponível</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium mb-2">Data da Aula</label>
                        <Select value={presencaData} onValueChange={setPresencaData} disabled={!presencaGrupo || !!editingChamadaId}>
                          <SelectTrigger data-testid="select-presenca-data">
                            <SelectValue placeholder={presencaGrupo ? "Selecione a data" : "Selecione a turma primeiro"} />
                          </SelectTrigger>
                          <SelectContent>
                            {diasAulaDisponiveis.length > 0 ? (
                              diasAulaDisponiveis.map((dia) => (
                                <SelectItem key={dia.date} value={dia.date}>
                                  {dia.label} ({dia.dayOfWeek})
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-dias" disabled>
                                {presencaGrupo ? "Nenhum dia de aula configurado" : "Selecione uma turma"}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      {presencaGrupo && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {editingChamadaId ? (
                            existingFotoUrl ? (
                              <div className="flex items-center gap-2">
                                <img src={existingFotoUrl} alt="Foto comprovante" className="w-10 h-10 rounded object-cover border" />
                                <span className="text-xs text-gray-500">Foto comprovante (somente leitura)</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Camera className="w-4 h-4 text-gray-400" />
                                <span className="text-xs text-gray-500">Sem foto comprovante</span>
                              </div>
                            )
                          ) : (
                            <>
                              <label className="flex items-center gap-2 cursor-pointer border rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
                                <Camera className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">{fotoFile ? fotoFile.name : 'Foto comprovante'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => setFotoFile(e.target.files?.[0] || null)}
                                />
                              </label>
                              {fotoFile && (
                                <img src={URL.createObjectURL(fotoFile)} alt="Preview" className="w-10 h-10 rounded object-cover border" />
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {editingChamadaId && (
                        <div className="border rounded-lg p-3 space-y-1">
                          <p className="text-xs font-medium text-gray-600 flex items-center gap-1">
                            <Utensils className="w-3.5 h-3.5" />
                            Teve alimentação nessa aula?
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingTeveAlimentacao(true)}
                              className={`flex-1 py-1.5 text-xs rounded-md border font-medium transition-colors ${editingTeveAlimentacao === true ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                            >
                              ✓ Sim, teve
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTeveAlimentacao(false)}
                              className={`flex-1 py-1.5 text-xs rounded-md border font-medium transition-colors ${editingTeveAlimentacao === false ? 'bg-red-50 border-red-400 text-red-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                            >
                              ✗ Não teve
                            </button>
                          </div>
                          {editingTeveAlimentacao === null && (
                            <p className="text-xs text-amber-600">Não definido (chamada antiga)</p>
                          )}
                        </div>
                      )}
                      <div className="relative">
                        <Button 
                          className="bg-green-500 hover:bg-green-600 w-full"
                          onClick={() => {
                            const semJust = presencas.filter(p => !p.presente && !p.justificativa);
                            if (semJust.length > 0) {
                              setModalJustItems(semJust.map(p => ({ alunoCpf: p.alunoCpf, nome: p.nome, motivo: 'Sem justificativa', obs: '', contaComoPresenca: false })));
                              setShowJustificativaModal(true);
                            } else {
                              if (!editingChamadaId) setShowAlimentacaoModal(true);
                              else saveChamadaMutation.mutate();
                            }
                          }}
                          disabled={!presencaGrupo || presencas.length === 0 || saveChamadaMutation.isPending}
                          data-testid="button-finalizar-chamada"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {saveChamadaMutation.isPending ? 'Salvando...' : editingChamadaId ? 'Atualizar Presenças' : 'Finalizar Chamada'}
                        </Button>
                      </div>
                      {editingChamadaId && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingChamadaId(null);
                            setPresencaGrupo('');
                            setPresencaData('');
                            setPresencas([]);
                            setFotoFile(null);
                            setExistingFotoUrl(null);
                            setEditingTeveAlimentacao(null);
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancelar Edição
                        </Button>
                      )}
                    </div>

                    {presencaGrupo && !editingChamadaId && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border">
                        <div className="flex items-center gap-2">
                          {modoManual ? (
                            <>
                              <Hand className="w-4 h-4 text-orange-500" />
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
                        <Button
                          variant={modoManual ? "default" : "outline"}
                          size="sm"
                          className={modoManual ? "bg-orange-500 hover:bg-orange-600" : ""}
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
                    )}

                    {presencaGrupo && (
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-4">
                          Lista de Presença - {monitorGruposData?.find((t: any) => t.id.toString() === presencaGrupo)?.nome || 'Turma'}
                          {editingChamadaId && <Badge className="ml-2 bg-yellow-500">Editando</Badge>}
                          {grupoAlunosLoading && <span className="text-sm text-gray-500 ml-2">Carregando...</span>}
                        </h3>
                        {grupoAlunosLoading ? (
                          <div className="text-center py-4 text-gray-500">Carregando alunos...</div>
                        ) : presencas.length === 0 ? (
                          <div className="text-center py-4 text-gray-500">
                            <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p>Nenhum aluno nesta turma.</p>
                            <p className="text-sm">Adicione alunos na seção "Turmas".</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {[...presencas]
                              .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'))
                              .map((aluno) => {
                                const originalIndex = presencas.findIndex(p => p.alunoCpf === aluno.alunoCpf);
                                return (
                              <div key={aluno.alunoCpf} className={`flex items-center justify-between p-3 border rounded flex-wrap gap-2 ${!modoManual && !aluno.viaCatraca && !aluno.presente ? 'opacity-60' : ''}`}>
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
                                {modoManual || editingChamadaId ? (
                                <div className="flex items-center gap-4">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                      type="radio" 
                                      name={`presenca-pec-${aluno.alunoCpf}`}
                                      checked={aluno.presente === true}
                                      onChange={() => {
                                        const newPresencas = [...presencas];
                                        newPresencas[originalIndex] = { ...aluno, presente: true, justificativa: undefined };
                                        setPresencas(newPresencas);
                                      }}
                                      className="w-4 h-4 text-green-600"
                                    />
                                    <span className="text-sm text-green-600">Presente</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                      type="radio" 
                                      name={`presenca-pec-${aluno.alunoCpf}`}
                                      checked={aluno.presente === false}
                                      onChange={() => {
                                        const newPresencas = [...presencas];
                                        newPresencas[originalIndex] = { ...aluno, presente: false };
                                        setPresencas(newPresencas);
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
                                {aluno.presente === false && (modoManual || editingChamadaId) && (
                                  <div className="w-full mt-1 space-y-1">
                                    <div className="flex flex-wrap gap-1">
                                      {['Doença', 'Atestado médico', 'Escola', 'Trabalho', 'Transporte', 'Família', 'Compromisso pessoal', 'Chuva/Clima', 'Outro', 'Sem justificativa'].map((opcao) => (
                                        <button
                                          key={opcao}
                                          type="button"
                                          onClick={() => {
                                            const newPresencas = [...presencas];
                                            newPresencas[originalIndex] = { ...aluno, justificativa: opcao };
                                            setPresencas(newPresencas);
                                          }}
                                          className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${aluno.justificativa === opcao ? (opcao === 'Sem justificativa' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-blue-100 border-blue-400 text-blue-700') : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                                        >
                                          {opcao}
                                        </button>
                                      ))}
                                    </div>
                                    <Input
                                      placeholder="Ou escreva a justificativa..."
                                      value={aluno.justificativa || ''}
                                      onChange={(e) => {
                                        const newPresencas = [...presencas];
                                        newPresencas[originalIndex] = { ...aluno, justificativa: e.target.value };
                                        setPresencas(newPresencas);
                                      }}
                                      className="h-8 text-sm"
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
                    
                    {!presencaGrupo && (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Selecione uma turma para fazer a chamada</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Histórico de Presenças</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="text-sm font-medium">Turma</label>
                        <Select value={historicoFiltroTurma} onValueChange={setHistoricoFiltroTurma}>
                          <SelectTrigger>
                            <SelectValue placeholder="Todas as turmas" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todas">Todas as turmas</SelectItem>
                            {(monitorGruposData || []).map((turma: any) => (
                              <SelectItem key={turma.id} value={turma.nome}>{turma.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Data Início</label>
                        <Input
                          type="date"
                          value={historicoFiltroDataInicio}
                          onChange={(e) => setHistoricoFiltroDataInicio(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Data Fim</label>
                        <Input
                          type="date"
                          value={historicoFiltroDataFim}
                          onChange={(e) => setHistoricoFiltroDataFim(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    {historicoLoading ? (
                      <div className="text-center py-8 text-gray-500">Carregando histórico...</div>
                    ) : !historicoChamadas || !Array.isArray(historicoChamadas) || historicoChamadas.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Nenhuma chamada registrada ainda.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {historicoChamadas
                          .filter((chamada: any) => {
                            const turmaNome = chamada.grupo || chamada.turmaNome || '';
                            const dataAtividade = chamada.data || chamada.dataAtividade;
                            
                            if (historicoFiltroTurma && historicoFiltroTurma !== 'todas' && turmaNome !== historicoFiltroTurma) {
                              return false;
                            }
                            if (historicoFiltroDataInicio && dataAtividade) {
                              const dataRegistro = new Date(dataAtividade);
                              const dataInicio = new Date(historicoFiltroDataInicio);
                              if (dataRegistro < dataInicio) return false;
                            }
                            if (historicoFiltroDataFim && dataAtividade) {
                              const dataRegistro = new Date(dataAtividade);
                              const dataFim = new Date(historicoFiltroDataFim);
                              dataFim.setHours(23, 59, 59);
                              if (dataRegistro > dataFim) return false;
                            }
                            return true;
                          })
                          .map((chamada: any) => {
                            const presentes = chamada.totalPresentes ?? 0;
                            const total = chamada.totalAlunos ?? presentes;
                            const dataAtividade = chamada.data || chamada.dataAtividade;
                            return (
                              <div key={chamada.id} className="border rounded-lg overflow-hidden">
                                <div 
                                  className="p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                                  onClick={() => setHistoricoExpandido(historicoExpandido === chamada.id ? null : chamada.id)}
                                >
                                  <div className="flex items-center gap-3">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium">
                                      {dataAtividade ? new Date(dataAtividade + 'T12:00:00').toLocaleDateString('pt-BR') : 'Sem data'}
                                    </span>
                                    <span className="text-gray-500">-</span>
                                    <span>{chamada.grupo || chamada.turmaNome}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-green-600 font-medium">
                                      {presentes}/{total} presentes
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingChamadaId(chamada.id);
                                        setPresencaVertente(vertente as MonitorVertente);
                                        setEditingTeveAlimentacao(chamada.teveAlimentacao ?? null);
                                        setPresencaGrupo(String(chamada.grupoId));
                                        setPresencaData(chamada.data);
                                        const loaded = (chamada.presencas || []).map((p: any) => ({
                                          alunoCpf: p.alunoCpf || p.cpf || '',
                                          nome: p.alunoNome || p.nome || 'Sem nome',
                                          presente: p.presente === true || p.status === 'presente',
                                          justificativa: p.justificativa || ''
                                        }));
                                        setPresencas(loaded);
                                        const fotoUrl = chamada.fotoComprovante || chamada.foto_comprovante || (chamada.presencas || []).find((p: any) => p.fotoComprovante)?.fotoComprovante || null;
                                        setExistingFotoUrl(fotoUrl);
                                        setFotoFile(null);
                                        setShowHistoricoChamadas(false);
                                      }}
                                    >
                                      <Pencil className="w-3.5 h-3.5 mr-1" />
                                      Editar
                                    </Button>
                                    {historicoExpandido === chamada.id ? (
                                      <ChevronUp className="w-4 h-4 text-gray-500" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-gray-500" />
                                    )}
                                  </div>
                                </div>
                                
                                {historicoExpandido === chamada.id && chamada.presencas && (
                                  <div className="p-3 border-t bg-white">
                                    <div className="text-sm font-medium mb-2 text-gray-600">Lista de Presença:</div>
                                    <div className="grid gap-2">
                                      {chamada.presencas.map((p: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between py-1 px-2 rounded bg-gray-50">
                                          <span className="text-sm">{p.alunoNome || p.nome}</span>
                                          <span className={`text-xs font-medium ${p.presente ? 'text-green-600' : 'text-red-600'}`}>
                                            {p.presente ? 'Presente' : 'Falta'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === 'atividades' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Minhas Atividades</CardTitle>
                <Button className="bg-green-500 hover:bg-green-600" onClick={() => setShowNovaAtividadeModal(true)} data-testid="button-nova-atividade">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Atividade
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {atividadesLoading ? (
                      <div className="text-center py-8 text-gray-500">Carregando...</div>
                    ) : atividadesData && Array.isArray(atividadesData) && atividadesData.length > 0 ? (
                      atividadesData.filter((a: any) => a.tipo !== 'evento').map((atividade: any) => (
                        <div key={atividade.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">{atividade.titulo} {atividade.grupo ? `- ${atividade.grupo}` : ''}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                <span>
                                  {atividade.data ? (() => {
                                    try {
                                      const d = new Date(atividade.data);
                                      return !isNaN(d.getTime()) ? d.toLocaleDateString('pt-BR') : 'Data não definida';
                                    } catch { return 'Data não definida'; }
                                  })() : 'Data não definida'}
                                </span>
                                <span>às {atividade.horarioInicio || '—'}</span>
                                <span>- {atividade.local || 'Local não definido'}</span>
                              </div>
                            </div>
                            <Badge variant="outline">{atividade.tipo || 'Atividade'}</Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                setEditandoAtividade(atividade);
                                setEditAtividadeForm({
                                  titulo: atividade.titulo || '',
                                  descricao: atividade.descricao || '',
                                  data: atividade.data ? atividade.data.split('T')[0] : '',
                                  horarioInicio: atividade.horarioInicio || '',
                                  horarioFim: atividade.horarioFim || '',
                                  local: atividade.local || '',
                                  tipo: atividade.tipo || 'atividade'
                                });
                              }}
                              data-testid={`button-editar-atividade-${atividade.id}`}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Editar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => {
                                if (confirm('Tem certeza que deseja excluir esta atividade?')) {
                                  deleteAtividadeMutation.mutate(atividade.id);
                                }
                              }}
                              disabled={deleteAtividadeMutation.isPending}
                              data-testid={`button-excluir-atividade-${atividade.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">Nenhuma atividade criada</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'registro' && (
            <Card>
              <CardHeader>
                <CardTitle>Registro de Atividades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Registrar Execução de Atividade</h3>
                    
                    {/* Seleção de Atividade Existente */}
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <label className="block text-sm font-medium mb-2">Selecionar Atividade Planejada</label>
                      <Select
                        value={registroForm.atividadeId?.toString() || ''}
                        onValueChange={async (value) => {
                          const atividade = atividadesData?.find((a: any) => a.id.toString() === value);
                          if (atividade) {
                            // Buscar participantes do grupo
                            let participantesDoGrupo: any[] = [];
                            let grupoIdParaUsar = atividade.grupoId;
                            
                            // Se não tem grupoId mas tem nome do grupo, buscar o grupo pelo nome
                            if (!grupoIdParaUsar && atividade.grupo && monitorGruposData) {
                              const grupoEncontrado = monitorGruposData.find((g: any) => g.nome === atividade.grupo);
                              if (grupoEncontrado) {
                                grupoIdParaUsar = grupoEncontrado.id;
                              }
                            }
                            
                            if (grupoIdParaUsar) {
                              try {
                                const isDevMode = window.location.search.includes('dev_access=true') || window.location.pathname.includes('/dev');
                                const resp = await fetch(`/api/monitor/${userId}/grupos/${grupoIdParaUsar}/alunos${isDevMode ? '?dev_access=true' : ''}`, {
                                  credentials: 'include',
                                  headers: { 
                                    'x-user-id': userId || '',
                                    'Content-Type': 'application/json',
                                    ...(isDevMode && { 'x-dev-access': 'true' })
                                  }
                                });
                                if (resp.ok) {
                                  participantesDoGrupo = await resp.json();
                                } else {
                                  console.log('Resposta não ok:', resp.status);
                                }
                              } catch (e) {
                                console.error('Erro ao buscar participantes:', e);
                              }
                            }
                            setRegistroForm({
                              ...registroForm,
                              atividadeId: parseInt(value),
                              grupoId: atividade.grupoId || null,
                              dataAtividade: atividade.data ? atividade.data.split('T')[0] : registroForm.dataAtividade,
                              grupo: atividade.grupo || '',
                              titulo: atividade.titulo || '',
                              descricao: atividade.descricao || '',
                              duracaoMinutos: '',
                              participantes: String(atividade.participantesEsperados || participantesDoGrupo.length || 0),
                              presencas: participantesDoGrupo.map((p: any) => ({
                                id: p.cpf || p.id?.toString() || '',
                                nome: p.nomeCompleto || p.nome || 'Sem nome',
                                presente: false
                              }))
                            });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma atividade para registrar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {atividadesData && Array.isArray(atividadesData) && atividadesData
                            .filter((a: any) => a.tipo !== 'evento')
                            .map((atividade: any) => (
                              <SelectItem key={atividade.id} value={atividade.id.toString()}>
                                {atividade.titulo} - {atividade.data ? new Date(atividade.data.split('T')[0] + 'T12:00:00').toLocaleDateString('pt-BR') : 'Sem data'} ({atividade.grupo || 'Sem grupo'})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">Selecione uma atividade criada em "Minhas Atividades" para preencher automaticamente</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Data da Atividade</label>
                        <Input 
                          type="date" 
                          value={registroForm.dataAtividade}
                          onChange={(e) => setRegistroForm({ ...registroForm, dataAtividade: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Turma</label>
                        <Input 
                          placeholder="Ex: Grupo A" 
                          value={registroForm.grupo}
                          onChange={(e) => setRegistroForm({ ...registroForm, grupo: e.target.value })}
                          readOnly={!!registroForm.atividadeId}
                          className={registroForm.atividadeId ? 'bg-gray-100' : ''}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Título da Atividade</label>
                        <Input 
                          placeholder="Ex: Oficina de Matemática Lúdica" 
                          value={registroForm.titulo}
                          onChange={(e) => setRegistroForm({ ...registroForm, titulo: e.target.value })}
                          readOnly={!!registroForm.atividadeId}
                          className={registroForm.atividadeId ? 'bg-gray-100' : ''}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Descrição</label>
                        <Textarea 
                          placeholder="Descreva a atividade realizada, objetivos e metodologia..." 
                          rows={3}
                          value={registroForm.descricao}
                          onChange={(e) => setRegistroForm({ ...registroForm, descricao: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Duração (minutos)</label>
                        <Input 
                          type="number" 
                          placeholder="90"
                          value={registroForm.duracaoMinutos}
                          onChange={(e) => setRegistroForm({ ...registroForm, duracaoMinutos: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Participantes</label>
                        <Input 
                          type="number" 
                          placeholder="12"
                          value={registroForm.participantes}
                          onChange={(e) => setRegistroForm({ ...registroForm, participantes: e.target.value })}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Resultados e Observações</label>
                        <Textarea 
                          placeholder="Avalie os resultados da atividade e faça observações sobre a participação..." 
                          rows={2}
                          value={registroForm.resultadosObservacoes}
                          onChange={(e) => setRegistroForm({ ...registroForm, resultadosObservacoes: e.target.value })}
                        />
                      </div>
                      
                      {/* Lista de Presença */}
                      {(registroForm.presencas?.length || 0) > 0 && (
                        <div className="md:col-span-2 border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium">Lista de Presença</label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRegistroForm({
                                    ...registroForm,
                                    presencas: (registroForm.presencas || []).map(p => ({ ...p, presente: true })),
                                    participantes: String((registroForm.presencas || []).length)
                                  });
                                }}
                              >
                                Marcar Todos
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRegistroForm({
                                    ...registroForm,
                                    presencas: (registroForm.presencas || []).map(p => ({ ...p, presente: false })),
                                    participantes: '0'
                                  });
                                }}
                              >
                                Desmarcar Todos
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                            {(registroForm.presencas || []).map((p, index) => (
                              <div 
                                key={p.id} 
                                className={`flex items-center gap-2 p-2 rounded cursor-pointer ${p.presente ? 'bg-green-100' : 'bg-white'} border`}
                                onClick={() => {
                                  const novasPresencas = [...(registroForm.presencas || [])];
                                  novasPresencas[index] = { ...p, presente: !p.presente };
                                  const totalPresentes = novasPresencas.filter(pr => pr.presente).length;
                                  setRegistroForm({
                                    ...registroForm,
                                    presencas: novasPresencas,
                                    participantes: String(totalPresentes)
                                  });
                                }}
                              >
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${p.presente ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                                  {p.presente && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-sm">{p.nome}</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {(registroForm.presencas || []).filter(p => p.presente).length} de {(registroForm.presencas || []).length} presentes
                          </p>
                        </div>
                      )}
                    </div>
                    <Button 
                      className="mt-4 bg-orange-500 hover:bg-orange-600"
                      onClick={() => {
                        const payload = {
                          ...registroForm,
                          duracaoMinutos: registroForm.duracaoMinutos ? parseInt(registroForm.duracaoMinutos) : null,
                          participantes: registroForm.participantes ? parseInt(registroForm.participantes) : null,
                          diasSemana: Array.from(new Set(formData.diasSemana || [])),
                          presencas: JSON.stringify(registroForm.presencas)
                        };
                        createRegistroMutation.mutate(payload);
                      }}
                      disabled={createRegistroMutation.isPending || !registroForm.grupo || !registroForm.titulo}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {createRegistroMutation.isPending ? 'Salvando...' : 'Salvar Registro'}
                    </Button>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-4">Atividades Registradas Recentemente</h3>
                    <div className="space-y-3">
                      {registrosLoading ? (
                        <div className="text-center py-8 text-gray-500">Carregando...</div>
                      ) : registrosData && Array.isArray(registrosData) && registrosData.filter((r: any) => !r.titulo?.startsWith('Chamada -')).length > 0 ? (
                        registrosData.filter((r: any) => !r.titulo?.startsWith('Chamada -')).map((registro: any) => (
                          <div key={registro.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-green-500" />
                                <span className="font-medium">
                                  {new Date(registro.dataAtividade + 'T12:00:00').toLocaleDateString('pt-BR')} - {registro.grupo}
                                </span>
                              </div>
                              <Badge className="bg-orange-100 text-orange-800">
                                {registro.participantes || 0} alunos
                              </Badge>
                            </div>
                            <h4 className="font-medium mb-1">{registro.titulo}</h4>
                            {registro.descricao && <p className="text-sm text-gray-600 mb-2">{registro.descricao}</p>}
                            <p className="text-sm text-gray-600 mb-3">
                              Duração: {registro.duracaoMinutos ? `${registro.duracaoMinutos} min` : 'Não informada'}
                            </p>
                            {registro.resultadosObservacoes && (
                              <p className="text-sm text-gray-700 mb-3 bg-gray-50 p-2 rounded">
                                <strong>Resultados:</strong> {registro.resultadosObservacoes}
                              </p>
                            )}
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => { setSelectedRegistro(registro); setShowEditRegistroModal(true); }}>
                                <Edit className="w-4 h-4 mr-1" />
                                Editar
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => { setSelectedRegistro(registro); setShowViewRegistroModal(true); }}>
                                <Eye className="w-4 h-4 mr-1" />
                                Ver Detalhes
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">Nenhum registro de atividade ainda</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'grupos' && (
            <Card>
              <CardHeader className="flex flex-col gap-4">
                <div className="flex flex-row items-center justify-between w-full">
                  <CardTitle>Minhas Turmas</CardTitle>
                  <Button className="bg-green-500 hover:bg-green-600" onClick={() => setShowNovaTurmaModal(true)} data-testid="button-nova-turma">
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
                  {gruposError ? (
                    <div className="p-3 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm">
                      Erro ao carregar turmas: {String((gruposError as any)?.message || gruposError)}
                    </div>
                  ) : gruposLoading ? (
                    <p className="text-gray-500">Carregando grupos...</p>
                  ) : monitorGruposData && Array.isArray(monitorGruposData) && monitorGruposData.length > 0 ? (
                    [...monitorGruposData]
                      .filter((grupo: any) => {
                        if (filtroStatusTurma !== "inativo" && filtroStatusTurma !== "concluido" && (grupo.status === 'inativo' || grupo.status === 'encerrada')) return false;
                        if (filtroStatusTurma === "inativo" && grupo.status !== 'inativo') return false;
                        const nomeGrupo = (grupo.nome || '').toLowerCase();
                        if (buscaTurma && !nomeGrupo.includes(buscaTurma.toLowerCase())) return false;
                        if (filtroStatusTurma === "todos") return true;
                        if (filtroStatusTurma === "ativo") return grupo.status === "ativo" || grupo.status === "emandamento" || grupo.status === "em_andamento" || grupo.status === "execucao";
                        if (filtroStatusTurma === "planejado") return grupo.status === "planejado" || grupo.status === "pendente" || grupo.status === "planejamento";
                        if (filtroStatusTurma === "concluido") return grupo.status === "concluido" || grupo.status === "finalizado" || grupo.status === "encerrada";
                        return grupo.status === filtroStatusTurma;
                      })
                      .sort((a: any, b: any) => {
                        const dateA = new Date(a.createdAt || a.dataInicio || 0).getTime();
                        const dateB = new Date(b.createdAt || b.dataInicio || 0).getTime();
                        return dateB - dateA;
                      })
                      .map((grupo: any) => (
                      <div key={grupo.id} className="border rounded-lg p-4 border-green-200">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">{grupo.nome}</h3>
                          <Badge className={
                            grupo.status === 'concluido' || grupo.status === 'encerrada' ? "bg-blue-100 text-blue-800" :
                            grupo.status === 'planejamento' || grupo.status === 'planejado' ? "bg-yellow-100 text-yellow-800" :
                            grupo.status === 'inativo' ? "bg-gray-100 text-gray-600" :
                            "bg-green-100 text-green-800"
                          }>
                            {grupo.status === 'concluido' || grupo.status === 'encerrada' ? 'Finalizada' :
                             grupo.status === 'planejamento' || grupo.status === 'planejado' ? 'Planejada' :
                             grupo.status === 'inativo' ? 'Inativa' :
                             grupo.status === 'execucao' || grupo.status === 'ativo' ? 'Em Andamento' : 'Em Andamento'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Horário:</span>
                            <p className="font-medium">{grupo.horarioInicio || grupo.horarioEntrada || grupo.start_time || '-'} - {grupo.horarioFim || grupo.horarioSaida || grupo.end_time || '-'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Alunos:</span>
                            <p className="font-medium">{grupo.alunosCount || grupo.alunos || 0}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Local:</span>
                            <p className="font-medium">{grupo.local || grupo.location || '-'}</p>
                          </div>
                        </div>
                        {grupo.status === "concluido" && vertente === "inclusao" && (
                          <div className="flex items-center gap-2 mt-3 p-2 bg-green-50 rounded-md border border-green-200">
                            <GraduationCap className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700">
                              Turma Finalizada: {grupo.alunosConcluidos || 0} de {grupo.totalParticipantes || grupo.alunos || 0} alunos formados
                            </span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 mt-4">
                          <Button size="sm" variant="outline" onClick={() => {
                            setGrupoSelecionado(normalizeTurma(grupo));
                            setShowDetalhesTurmaModal(true);
                          }}>
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-50" onClick={() => {
                            setGrupoSelecionado(normalizeTurma(grupo));
                            if (vertente === 'inclusao') {
                              setTurmaParaGerenciarInclusao(normalizeTurma(grupo));
                              setShowTurmaDetailModalInclusao(true);
                            } else {
                              setShowTurmaDetailModal(true);
                            }
                          }}>
                            <UserPlus className="w-4 h-4 mr-1" />
                            Gerenciar Alunos
                          </Button>
                          {vertente === 'inclusao' && (
                            <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50"
                              onClick={() => baixarListaAlunos(grupo.id, normalizeTurma(grupo), false)}>
                              <FileDown className="w-4 h-4 mr-1" />
                              Baixar lista
                            </Button>
                          )}
                          {vertente === 'pec' && (
                            <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50"
                              onClick={() => baixarListaAlunos(grupo.id, normalizeTurma(grupo), true)}>
                              <FileDown className="w-4 h-4 mr-1" />
                              Baixar lista
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => {
                            if (vertente === 'inclusao') {
                              setTurmaParaEditar(normalizeTurma(grupo));
                              setShowEditTurmaInclusaoModal(true);
                            } else {
                              setGrupoSelecionado(normalizeTurma(grupo));
                              setShowEditTurmaPecModal(true);
                            }
                          }}>
                            <Pencil className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          {vertente === "inclusao" && grupo.status !== "concluido" && (
                            <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50" onClick={async () => {
                              setGrupoSelecionado(normalizeTurma(grupo));
                              setParticipantesSelecionados([]);
                              setIsLoadingParticipantesTurma(true);
                              try {
                                const response = await fetch(`/api/turmas-inclusao/${grupo.id}/participantes`);
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
                      {grupo.status === 'inativo' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:bg-green-50"
                          onClick={() => {
                            if (confirm(`Deseja reativar a turma "${grupo.nome || grupo.title}"?`)) {
                              reativarTurmaMutation.mutate(grupo);
                            }
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Reativar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-orange-600 hover:bg-orange-50"
                          onClick={() => {
                            setTurmaParaInativar(grupo);
                            setConfirmInativarOpen(true);
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Inativar
                        </Button>
                      )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Nenhuma turma cadastrada</p>
                      <p className="text-sm">Clique em "Nova Turma" para criar sua primeira turma</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'calendario' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Calendário</CardTitle>
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
                      onClick={() => setCalendarioMes(new Date(calendarioMes.getFullYear(), calendarioMes.getMonth() - 1, 1))}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <h3 className="text-lg font-semibold">
                      {calendarioMes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
                    </h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCalendarioMes(new Date(calendarioMes.getFullYear(), calendarioMes.getMonth() + 1, 1))}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-2 text-center">
                    <div className="font-semibold p-2">Dom</div>
                    <div className="font-semibold p-2">Seg</div>
                    <div className="font-semibold p-2">Ter</div>
                    <div className="font-semibold p-2">Qua</div>
                    <div className="font-semibold p-2">Qui</div>
                    <div className="font-semibold p-2">Sex</div>
                    <div className="font-semibold p-2">Sáb</div>
                    
                    {(() => {
                      const ano = calendarioMes.getFullYear();
                      const mes = calendarioMes.getMonth();
                      const primeiroDia = new Date(ano, mes, 1).getDay();
                      const diasNoMes = new Date(ano, mes + 1, 0).getDate();
                      const hoje = new Date();
                      
                      return Array.from({ length: 42 }, (_, i) => {
                        const day = i - primeiroDia + 1;
                        const isValidDay = day > 0 && day <= diasNoMes;
                        const isToday = isValidDay && day === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear();
                        
                        const atividadesNoDia = isValidDay && atividadesData && Array.isArray(atividadesData) 
                          ? atividadesData.filter((a: any) => {
                              if (!a.data) return false;
                              const dataAtiv = new Date(a.data);
                              return dataAtiv.getDate() === day && dataAtiv.getMonth() === mes && dataAtiv.getFullYear() === ano;
                            })
                          : [];
                        const hasEvent = atividadesNoDia.length > 0;
                        
                        return (
                          <div 
                            key={i} 
                            className={`p-2 border rounded cursor-pointer relative group ${
                              !isValidDay ? 'text-gray-300 bg-gray-50' :
                              isToday ? 'bg-orange-100 border-blue-300' :
                              hasEvent ? 'bg-green-50 border-green-200' :
                              'hover:bg-gray-50'
                            }`}
                          >
                            {isValidDay && (
                              <div>
                                <span className="text-sm">{day}</span>
                                {hasEvent && (
                                  <>
                                    <div className="flex gap-1 justify-center mt-1">
                                      {atividadesNoDia.some((a: any) => a.tipo !== 'evento') && (
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" title="Atividade"></div>
                                      )}
                                      {atividadesNoDia.some((a: any) => a.tipo === 'evento') && (
                                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" title="Evento"></div>
                                      )}
                                    </div>
                                    <div className="absolute z-50 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-2 px-3 -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full whitespace-pre-line min-w-max max-w-xs shadow-lg">
                                      {atividadesNoDia.map((a: any, idx: number) => (
                                        <div key={idx} className="py-0.5">
                                          {a.tipo === 'evento' ? '📅' : '📚'} {a.titulo}
                                          {a.horarioInicio && <span className="text-gray-300"> - {a.horarioInicio}</span>}
                                        </div>
                                      ))}
                                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full border-4 border-transparent border-t-gray-900"></div>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-4">Próximas Atividades e Eventos</h3>
                    <div className="space-y-3">
                      {(() => {
                        const ano = calendarioMes.getFullYear();
                        const mes = calendarioMes.getMonth();
                        const itens = atividadesData && Array.isArray(atividadesData) 
                          ? atividadesData.filter((a: any) => {
                              if (!a.data) return false;
                              const d = new Date(a.data);
                              return d.getMonth() === mes && d.getFullYear() === ano;
                            }).sort((a: any, b: any) => new Date(a.data).getTime() - new Date(b.data).getTime())
                          : [];
                        return itens.length > 0 ? (
                          itens.slice(0, 10).map((evento: any, index: number) => (
                            <div key={evento.id || index} className="border rounded-lg p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-purple-500" />
                                <div>
                                  <p className="font-medium">{evento.titulo}</p>
                                  <p className="text-sm text-gray-500">
                                    {evento.data ? (() => {
                                      try {
                                        const d = new Date(evento.data);
                                        return !isNaN(d.getTime()) ? d.toLocaleDateString('pt-BR') : 'Data não definida';
                                      } catch { return 'Data não definida'; }
                                    })() : 'Data não definida'} às {evento.horarioInicio || '—'} - {evento.local || 'Local não definido'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={evento.tipo === 'evento' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}>
                                  {evento.tipo === 'evento' ? 'Evento' : evento.tipo === 'reforco' ? 'Reforço' : evento.tipo === 'oficina' ? 'Oficina' : evento.tipo || 'Atividade'}
                                </Badge>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setEditandoAtividade(evento);
                                    setEditAtividadeForm({
                                      titulo: evento.titulo || '',
                                      descricao: evento.descricao || '',
                                      data: evento.data ? evento.data.split('T')[0] : '',
                                      horarioInicio: evento.horarioInicio || '',
                                      horarioFim: evento.horarioFim || '',
                                      local: evento.local || '',
                                      tipo: evento.tipo || 'atividade'
                                    });
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => {
                                    if (confirm('Tem certeza que deseja excluir?')) {
                                      deleteAtividadeMutation.mutate(evento.id);
                                    }
                                  }}
                                  disabled={deleteAtividadeMutation.isPending}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm italic">Nenhuma atividade ou evento neste mês. Clique em "Novo Evento" para adicionar.</p>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Horários das Turmas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {monitorGruposData && Array.isArray(monitorGruposData) && monitorGruposData.length > 0 ? (
                        monitorGruposData.map((grupo: any, index: number) => (
                          <div key={grupo.id}>
                            <h4 className={`font-medium mb-2 ${index % 2 === 0 ? 'text-orange-600' : 'text-green-600'}`}>
                              {grupo.nome} {grupo.atividade ? `- ${grupo.atividade}` : ''}
                            </h4>
                            <div className="text-sm space-y-1">
                              {grupo.diasSemana && grupo.diasSemana.length > 0 ? (
                                grupo.diasSemana.map((dia: string) => (
                                  <p key={dia}>
                                    <strong>{dia}:</strong> {grupo.horarioInicio || '—'} - {grupo.horarioFim || '—'}
                                  </p>
                                ))
                              ) : (
                                <p className="text-gray-400 italic">Horário não definido</p>
                              )}
                              {grupo.nivel && <p className="text-gray-500 mt-2">Nível: {grupo.nivel}</p>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 col-span-2">Nenhuma turma cadastrada. Crie turmas em "Minhas Turmas" para ver os horários aqui.</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                        <UserCheck className="w-4 h-4 text-orange-500" />
                        Relatório de Frequência/Registros
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        Gere relatórios dos registros de atividades por grupo.
                      </p>
                      <div className="space-y-2">
                        <Select value={relatorioGrupoId} onValueChange={setRelatorioGrupoId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a turma" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todas as Turmas</SelectItem>
                            {Array.isArray(monitorGruposData) && monitorGruposData.map((grupo: any) => (
                              <SelectItem key={grupo.id} value={grupo.id.toString()}>{grupo.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Input type="date" value={relatorioDataInicio} onChange={(e) => setRelatorioDataInicio(e.target.value)} placeholder="Data inicial" />
                          <Input type="date" value={relatorioDataFim} onChange={(e) => setRelatorioDataFim(e.target.value)} placeholder="Data final" />
                        </div>
                        <Button 
                          className="w-full bg-orange-500 hover:bg-orange-600"
                          disabled={gerandoRelatorio || historicoLoading}
                          onClick={() => {
                            setGerandoRelatorio(true);
                            const chamadas = historicoChamadas || [];
                            
                            const filteredChamadas = chamadas.filter((c: any) => {
                              if (relatorioGrupoId !== 'todos' && c.grupoId?.toString() !== relatorioGrupoId) return false;
                              if (relatorioDataInicio && c.data && c.data < relatorioDataInicio) return false;
                              if (relatorioDataFim && c.data && c.data > relatorioDataFim) return false;
                              return true;
                            });
                            
                            const formatData = (data: string) => {
                              if (!data) return '';
                              try { return new Date(data).toLocaleDateString('pt-BR'); } catch { return data; }
                            };
                            
                            const cleanText = (text: string) => {
                              if (!text) return '';
                              return text.replace(/;/g, ',').replace(/\n/g, ' ').replace(/"/g, "'");
                            };
                            
                            const sep = ';';
                            let csvContent = `Data${sep}Grupo${sep}Aluno${sep}Status${sep}Observacoes\n`;
                            
                            filteredChamadas.forEach((chamada: any) => {
                              const dataFormatada = formatData(chamada.data);
                              const grupo = cleanText(chamada.grupoNome || chamada.grupo || '');
                              const presencas = chamada.presencas || [];
                              
                              if (Array.isArray(presencas) && presencas.length > 0) {
                                presencas.forEach((p: any) => {
                                  const aluno = cleanText(p.alunoNome || p.nome || '');
                                  const status = p.presente ? 'Presente' : 'Ausente';
                                  const obs = cleanText(chamada.observacoes || '');
                                  csvContent += `${dataFormatada}${sep}${grupo}${sep}${aluno}${sep}${status}${sep}${obs}\n`;
                                });
                              } else {
                                csvContent += `${dataFormatada}${sep}${grupo}${sep}-${sep}-${sep}${cleanText(chamada.observacoes || '')}\n`;
                              }
                            });
                            
                            const BOM = '\uFEFF';
                            const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
                            const link = document.createElement('a');
                            link.href = URL.createObjectURL(blob);
                            link.download = `relatorio_frequencia_${new Date().toISOString().split('T')[0]}.csv`;
                            link.click();
                            
                            toast({ title: "Relatório gerado!", description: `${filteredChamadas.length} chamadas exportadas.` });
                            setGerandoRelatorio(false);
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {gerandoRelatorio ? 'Gerando...' : historicoLoading ? 'Carregando...' : 'Gerar Relatório CSV'}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-green-500" />
                        Relatório de Atividades
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        Exporte a lista de atividades planejadas.
                      </p>
                      <div className="space-y-2">
                        <Select value={relatorioAtividadeId} onValueChange={setRelatorioAtividadeId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione atividade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todas">Todas as Atividades</SelectItem>
                            {Array.isArray(atividadesData) && atividadesData.map((atv: any) => (
                              <SelectItem key={atv.id} value={atv.id.toString()}>{atv.titulo}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          className="w-full bg-green-500 hover:bg-green-600"
                          onClick={() => {
                            const filteredAtividades = (atividadesData || []).filter((a: any) => {
                              if (relatorioAtividadeId !== 'todas' && a.id?.toString() !== relatorioAtividadeId) return false;
                              return true;
                            });
                            
                            const formatData = (data: string) => {
                              if (!data) return '';
                              try { return new Date(data).toLocaleDateString('pt-BR'); } catch { return data; }
                            };
                            
                            const cleanText = (text: string) => {
                              if (!text) return '';
                              return text.replace(/;/g, ',').replace(/\n/g, ' ').replace(/"/g, "'");
                            };
                            
                            const sep = ';';
                            let csvContent = `Data${sep}Titulo${sep}Tipo${sep}Grupo${sep}Horario Inicio${sep}Horario Fim${sep}Local${sep}Status${sep}Descricao\n`;
                            filteredAtividades.forEach((a: any) => {
                              const data = formatData(a.data);
                              const titulo = cleanText(a.titulo);
                              const tipo = cleanText(a.tipo);
                              const grupo = cleanText(a.grupo);
                              const horarioInicio = a.horarioInicio || '';
                              const horarioFim = a.horarioFim || '';
                              const local = cleanText(a.local);
                              const status = a.status || '';
                              const descricao = cleanText(a.descricao);
                              csvContent += `${data}${sep}${titulo}${sep}${tipo}${sep}${grupo}${sep}${horarioInicio}${sep}${horarioFim}${sep}${local}${sep}${status}${sep}${descricao}\n`;
                            });
                            
                            const BOM = '\uFEFF';
                            const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
                            const link = document.createElement('a');
                            link.href = URL.createObjectURL(blob);
                            link.download = `relatorio_atividades_${new Date().toISOString().split('T')[0]}.csv`;
                            link.click();
                            
                            toast({ title: "Relatório gerado!", description: `${filteredAtividades.length} atividades exportadas.` });
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Gerar Relatório CSV
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Registros Recentes</h3>
                    <div className="space-y-2">
                      {Array.isArray(registrosData) && registrosData.length > 0 ? (
                        registrosData.slice(0, 5).map((registro: any, index: number) => (
                          <div key={registro.id || index} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                            <div>
                              <p className="font-medium">{registro.titulo}</p>
                              <p className="text-sm text-gray-500">
                                {registro.grupo} - {registro.dataAtividade ? new Date(registro.dataAtividade).toLocaleDateString('pt-BR') : '-'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{registro.participantes || 0} participantes</Badge>
                              <Button size="sm" variant="outline" onClick={() => {
                                setSelectedRegistro(registro);
                                setShowViewRegistroModal(true);
                              }}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">Nenhum registro encontrado. Crie registros na aba "Registrar Atividade".</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'acompanhamento' && (
            <Card>
              <CardHeader>
                <CardTitle>Acompanhamento Individual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex gap-4 items-end flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium mb-2">Buscar {vertente === 'pec' ? 'Aluno' : 'Participante'}</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          placeholder={`Nome ou CPF do ${vertente === 'pec' ? 'aluno' : 'participante'}...`} 
                          className="pl-10"
                          value={acompanhamentoBusca || ''}
                          onChange={(e) => setAcompanhamentoBusca(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium mb-2">Turma</label>
                      <Select value={acompanhamentoGrupo || 'todos'} onValueChange={setAcompanhamentoGrupo}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os grupos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os grupos</SelectItem>
                          {Array.isArray(monitorGruposData) && monitorGruposData.map((g: any) => (
                            <SelectItem key={g.id} value={g.id.toString()}>{g.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid gap-4">
                    {(() => {
                      const dados = vertente === 'pec' ? (alunosPec || []) : (participantesInclusao || []);
                      const filtrados = dados.filter((item: any) => {
                        if (acompanhamentoBusca) {
                          const nome = (item.nome || item.nomeCompleto || '').toLowerCase();
                          const cpf = (item.cpf || '').replace(/\D/g, '');
                          const busca = acompanhamentoBusca.toLowerCase().replace(/\D/g, '');
                          const buscaOriginal = acompanhamentoBusca.toLowerCase();
                          if (!nome.includes(buscaOriginal) && !cpf.includes(busca)) return false;
                        }
                        return true;
                      });
                      
                      if (filtrados.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>Nenhum {vertente === 'pec' ? 'aluno' : 'participante'} encontrado.</p>
                            <p className="text-sm">Cadastre {vertente === 'pec' ? 'alunos' : 'participantes'} na aba correspondente.</p>
                          </div>
                        );
                      }
                      
                      return filtrados.slice(0, 10).map((item: any, index: number) => (
                        <div key={item.cpf || item.id || index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <User className="w-5 h-5 text-orange-500" />
                              <h3 className="font-semibold">{item.nome || item.nomeCompleto}</h3>
                              {item.status && (
                                <Badge variant="outline" className={item.status === 'ativo' ? 'bg-green-50' : 'bg-gray-50'}>
                                  {item.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                            {item.dataNascimento && (
                              <div className="bg-gray-50 p-2 rounded">
                                <p className="text-gray-500">Nascimento</p>
                                <p className="font-medium">{new Date(item.dataNascimento).toLocaleDateString('pt-BR')}</p>
                              </div>
                            )}
                            {item.telefone && (
                              <div className="bg-gray-50 p-2 rounded">
                                <p className="text-gray-500">Telefone</p>
                                <p className="font-medium">{item.telefone}</p>
                              </div>
                            )}
                            {item.cidade && (
                              <div className="bg-gray-50 p-2 rounded">
                                <p className="text-gray-500">Cidade</p>
                                <p className="font-medium">{item.cidade}</p>
                              </div>
                            )}
                            {item.matricula && (
                              <div className="bg-orange-50 p-2 rounded">
                                <p className="text-gray-500">Matrícula</p>
                                <p className="font-medium text-orange-600">{item.matricula}</p>
                              </div>
                            )}
                          </div>
                          
                          {item.observacoesPrivadas && (
                            <div className="mb-4">
                              <h4 className="font-medium mb-2 text-sm">Observações:</h4>
                              <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded">
                                {item.observacoesPrivadas}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex gap-2 flex-wrap">
                            <Button size="sm" variant="outline" onClick={() => {
                              if (vertente === 'pec') {
                                setSelectedAluno(item);
                                setShowViewAlunoModal(true);
                              } else {
                                setSelectedParticipante(item);
                                setShowViewParticipanteModal(true);
                              }
                            }}>
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Detalhes
                            </Button>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Resumo Geral</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-blue-50 rounded">
                        <p className="text-xl font-bold text-orange-600">18</p>
                        <p className="text-sm text-gray-600">Total de Alunos</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded">
                        <p className="text-xl font-bold text-green-600">14</p>
                        <p className="text-sm text-gray-600">Em Dia</p>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded">
                        <p className="text-xl font-bold text-yellow-600">3</p>
                        <p className="text-sm text-gray-600">Precisam Atenção</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded">
                        <p className="text-xl font-bold text-purple-600">1</p>
                        <p className="text-sm text-gray-600">Destaques</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'geracao-renda' && vertente === 'inclusao' && (
            <GeracaoRendaSection />
          )}

          {activeSection === 'configuracoes' && (
            <Card>
              <CardHeader>
                <CardTitle>Meu Perfil e Configurações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Informações Pessoais
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Nome Completo</label>
                        <Input 
                          value={perfilNome} 
                          onChange={(e) => setPerfilNome(e.target.value)} 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <Input 
                          value={perfilEmail} 
                          onChange={(e) => setPerfilEmail(e.target.value)} 
                        />
                        <p className="text-xs text-orange-600 mt-1">Atenção: ao alterar o email, você precisará usar o novo email para fazer login</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Telefone</label>
                        <Input 
                          value={perfilTelefone} 
                          onChange={(e) => setPerfilTelefone(maskPhone(e.target.value))}
                          placeholder="(31) 99999-9999"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Área de Atuação</label>
                        <Input 
                          value={perfilAreaAtuacao} 
                          onChange={(e) => setPerfilAreaAtuacao(e.target.value)} 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Grupos Supervisionados</label>
                        <div className="flex gap-2">
                          <Badge className="bg-orange-100 text-orange-800">grupo Reforço Escolar</Badge>
                          <Badge className="bg-green-100 text-green-800">Grupo B - Atividades Recreativas</Badge>
                        </div>
                      </div>
                    </div>
                    <Button 
                      className="mt-4 bg-orange-500 hover:bg-orange-600"
                      onClick={handleSalvarPerfil}
                      disabled={salvandoPerfil}
                    >
                      {salvandoPerfil ? 'Salvando...' : 'Salvar Alterações'}
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
                          <p className="text-sm text-gray-500">Alertas sobre faltas frequentes dos alunos</p>
                        </div>
                        <Checkbox defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Relatórios Automáticos</p>
                          <p className="text-sm text-gray-500">Gerar relatórios semanais automaticamente</p>
                        </div>
                        <Checkbox />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Horário de Trabalho</label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Início</label>
                            <Input type="time" defaultValue="14:00" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Fim</label>
                            <Input type="time" defaultValue="18:00" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Estatísticas Pessoais
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-blue-50 rounded">
                        <p className="text-xl font-bold text-orange-600">3</p>
                        <p className="text-sm text-gray-600">Meses de Atuação</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded">
                        <p className="text-xl font-bold text-green-600">45</p>
                        <p className="text-sm text-gray-600">Atividades Realizadas</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded">
                        <p className="text-xl font-bold text-purple-600">18</p>
                        <p className="text-sm text-gray-600">Alunos Supervisionados</p>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded">
                        <p className="text-xl font-bold text-yellow-600">89%</p>
                        <p className="text-sm text-gray-600">Taxa de Frequência</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4 text-red-600">Zona de Perigo</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium mb-2">Alterar Senha</p>
                        <p className="text-sm text-gray-500 mb-3">Recomendamos alterar sua senha regularmente</p>
                        <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                          Alterar Senha
                        </Button>
                      </div>
                      <div>
                        <p className="font-medium mb-2">Solicitar Desligamento</p>
                        <p className="text-sm text-gray-500 mb-3">Entre em contato com a coordenação para processos de desligamento</p>
                        <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                          Contatar Coordenação
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div> )}

        {/* Modal de Editar Aluno */}
        <Dialog open={showEditAlunoModal} onOpenChange={setShowEditAlunoModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Dados do Aluno</DialogTitle>
            </DialogHeader>
            {selectedAluno && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome do Aluno</label>
                  <p className="text-gray-700 font-medium">{selectedAluno.nome}</p>
                  <p className="text-sm text-gray-500">Grupo: {selectedAluno.grupo || 'Sem grupo'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status de Acompanhamento</label>
                  <Select 
                    value={editFormData.acompanhamentoStatus}
                    onValueChange={(value) => setEditFormData({ ...editFormData, acompanhamentoStatus: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Observações Privadas</label>
                  <Textarea 
                    placeholder="Observações sobre o acompanhamento do aluno..." 
                    rows={4}
                    value={editFormData.observacoesPrivadas}
                    onChange={(e) => setEditFormData({ ...editFormData, observacoesPrivadas: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button 
                    className="bg-orange-500 hover:bg-orange-600"
                    onClick={() => {
                      updateAlunoMutation.mutate({ 
                        id: selectedAluno.id, 
                        data: editFormData 
                      });
                    }}
                    disabled={updateAlunoMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {updateAlunoMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowEditAlunoModal(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Visualizar Aluno */}
        <Dialog open={showViewAlunoModal} onOpenChange={setShowViewAlunoModal}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Perfil do Aluno</DialogTitle>
            </DialogHeader>
            {selectedAluno && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-orange-600" />
                    {selectedAluno.nome}
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Grupo</p>
                      <p className="font-medium">{selectedAluno.grupo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Frequência</p>
                      <p className="font-medium">{selectedAluno.frequencia}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Histórico de Frequência</h4>
                  <div className="space-y-2">
                    {['15/09/2025 - Presente', '12/09/2025 - Presente', '08/09/2025 - Falta'].map((registro, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span>{registro}</span>
                        {registro.includes('Presente') ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    className="bg-orange-500 hover:bg-orange-600"
                    onClick={() => {
                      setShowViewAlunoModal(false);
                      setShowEditAlunoModal(true);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Aluno
                  </Button>
                  <Button variant="outline" onClick={() => setShowViewAlunoModal(false)}>
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Adicionar Aluno */}
        <Dialog open={showAddAlunoModal} onOpenChange={setShowAddAlunoModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Aluno</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Selecione um participante para adicionar à sua lista:</p>
              {participantesDisponiveis && participantesDisponiveis.length > 0 ? (
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {participantesDisponiveis.map((participante: any) => (
                    <div key={participante.id} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer flex items-center justify-between" onClick={() => addAlunoMutation.mutate(participante.id)}>
                      <div>
                        <p className="font-medium">{participante.nome}</p>
                        {participante.grupo && <p className="text-sm text-gray-500">{participante.grupo}</p>}
                      </div>
                      <Button size="sm" variant="outline" disabled={addAlunoMutation.isPending} data-testid={`button-assign-${participante.id}`}>
                        {addAlunoMutation.isPending ? 'Adicionando...' : 'Adicionar'}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Nenhum participante disponível</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Nova Atividade */}
        <Dialog open={showNovaAtividadeModal} onOpenChange={setShowNovaAtividadeModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Atividade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Título*</label>
                  <Input
                    value={novaAtividadeForm.titulo}
                    onChange={(e) => setNovaAtividadeForm({...novaAtividadeForm, titulo: e.target.value})}
                    placeholder="Ex: Reforço Escolar - Matemática"
                    data-testid="input-atividade-titulo"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo*</label>
                  <Select
                    value={novaAtividadeForm.tipo}
                    onValueChange={(value) => setNovaAtividadeForm({...novaAtividadeForm, tipo: value})}
                  >
                    <SelectTrigger data-testid="select-atividade-tipo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reforco">Reforço Escolar</SelectItem>
                      <SelectItem value="recreativa">Atividade Recreativa</SelectItem>
                      <SelectItem value="oficina">Oficina</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={novaAtividadeForm.descricao}
                  onChange={(e) => setNovaAtividadeForm({...novaAtividadeForm, descricao: e.target.value})}
                  placeholder="Descreva a atividade..."
                  rows={3}
                  data-testid="textarea-atividade-descricao"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Grupo</label>
                  <Select
                    value={novaAtividadeForm.grupoId?.toString() || ''}
                    onValueChange={(value) => {
                      const grupoSelecionado = monitorGruposData?.find((g: any) => g.id.toString() === value);
                      const qtdParticipantes = grupoSelecionado?.qtdParticipantes || grupoSelecionado?.alunos || 0;
                      setNovaAtividadeForm({
                        ...novaAtividadeForm, 
                        grupoId: parseInt(value),
                        grupo: grupoSelecionado?.nome || '',
                        participantesEsperados: qtdParticipantes
                      });
                    }}
                  >
                    <SelectTrigger data-testid="select-atividade-grupo">
                      <SelectValue placeholder="Selecione uma turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {monitorGruposData && Array.isArray(monitorGruposData) && monitorGruposData.map((grupo: any) => (
                        <SelectItem key={grupo.id} value={grupo.id.toString()}>
                          {grupo.nome} ({grupo.qtdParticipantes || grupo.alunos || 0} participantes)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Data*</label>
                  <Input
                    type="date"
                    value={novaAtividadeForm.data}
                    onChange={(e) => setNovaAtividadeForm({...novaAtividadeForm, data: e.target.value})}
                    data-testid="input-atividade-data"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Horário Início*</label>
                  <Input
                    type="time"
                    value={novaAtividadeForm.horarioInicio}
                    onChange={(e) => setNovaAtividadeForm({...novaAtividadeForm, horarioInicio: e.target.value})}
                    data-testid="input-atividade-inicio"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Horário Fim*</label>
                  <Input
                    type="time"
                    value={novaAtividadeForm.horarioFim}
                    onChange={(e) => setNovaAtividadeForm({...novaAtividadeForm, horarioFim: e.target.value})}
                    data-testid="input-atividade-fim"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Participantes</label>
                  <Input
                    type="number"
                    value={novaAtividadeForm.participantesEsperados}
                    onChange={(e) => setNovaAtividadeForm({...novaAtividadeForm, participantesEsperados: parseInt(e.target.value) || 0})}
                    data-testid="input-atividade-participantes"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Local</label>
                <Input
                  value={novaAtividadeForm.local}
                  onChange={(e) => setNovaAtividadeForm({...novaAtividadeForm, local: e.target.value})}
                  placeholder="Ex: Sala 3"
                  data-testid="input-atividade-local"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowNovaAtividadeModal(false)} data-testid="button-cancelar-atividade">
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  if (!novaAtividadeForm.titulo || !novaAtividadeForm.data) {
                    toast({ 
                      title: "Campos obrigatórios", 
                      description: "Preencha título, data, horário início e horário fim.", 
                      variant: "destructive" 
                    });
                    return;
                  }
                  if (!novaAtividadeForm.horarioInicio || !novaAtividadeForm.horarioFim) {
                    toast({ 
                      title: "Campos obrigatórios", 
                      description: "Preencha título, data, horário início e horário fim.", 
                      variant: "destructive" 
                    });
                    return;
                  }
                  createAtividadeMutation.mutate(novaAtividadeForm);
                }}
                disabled={createAtividadeMutation.isPending || !novaAtividadeForm.titulo || !novaAtividadeForm.data || !novaAtividadeForm.horarioInicio || !novaAtividadeForm.horarioFim}
                data-testid="button-criar-atividade"
              >
                {createAtividadeMutation.isPending ? 'Salvando...' : 'Criar Atividade'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Novo Evento (Calendário) */}
        <Dialog open={showNovoEventoModal} onOpenChange={setShowNovoEventoModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Evento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título*</label>
                <Input
                  value={novoEventoForm.titulo}
                  onChange={(e) => setNovoEventoForm({...novoEventoForm, titulo: e.target.value})}
                  placeholder="Ex: Reunião de Pais"
                  data-testid="input-evento-titulo"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={novoEventoForm.descricao}
                  onChange={(e) => setNovoEventoForm({...novoEventoForm, descricao: e.target.value})}
                  placeholder="Descreva o evento..."
                  rows={2}
                  data-testid="textarea-evento-descricao"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Data*</label>
                <Input
                  type="date"
                  value={novoEventoForm.data}
                  onChange={(e) => setNovoEventoForm({...novoEventoForm, data: e.target.value})}
                  data-testid="input-evento-data"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Horário Início</label>
                  <Input
                    type="time"
                    value={novoEventoForm.horarioInicio}
                    onChange={(e) => setNovoEventoForm({...novoEventoForm, horarioInicio: e.target.value})}
                    data-testid="input-evento-inicio"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Horário Fim</label>
                  <Input
                    type="time"
                    value={novoEventoForm.horarioFim}
                    onChange={(e) => setNovoEventoForm({...novoEventoForm, horarioFim: e.target.value})}
                    data-testid="input-evento-fim"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Local</label>
                <Input
                  value={novoEventoForm.local}
                  onChange={(e) => setNovoEventoForm({...novoEventoForm, local: e.target.value})}
                  placeholder="Ex: Auditório"
                  data-testid="input-evento-local"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowNovoEventoModal(false)} data-testid="button-cancelar-evento">
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  if (!novoEventoForm.titulo || !novoEventoForm.data) {
                    toast({ 
                      title: "Campos obrigatórios", 
                      description: "Preencha título e data.", 
                      variant: "destructive" 
                    });
                    return;
                  }
                  createAtividadeMutation.mutate({
                    ...novoEventoForm,
                    tipo: 'evento',
                    grupo: '',
                    participantesEsperados: 0,
                    observacoes: '',
                    materiaisNecessarios: []
                  });
                  setShowNovoEventoModal(false);
                  setNovoEventoForm({ titulo: '', descricao: '', data: '', horarioInicio: '', horarioFim: '', local: '' });
                }}
                disabled={createAtividadeMutation.isPending || !novoEventoForm.titulo || !novoEventoForm.data}
                data-testid="button-criar-evento"
              >
                {createAtividadeMutation.isPending ? 'Salvando...' : 'Criar Evento'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Editar Atividade/Evento */}
        <Dialog open={!!editandoAtividade} onOpenChange={(open) => !open && setEditandoAtividade(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar {editAtividadeForm.tipo === 'evento' ? 'Evento' : 'Atividade'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título*</label>
                <Input
                  value={editAtividadeForm.titulo}
                  onChange={(e) => setEditAtividadeForm({...editAtividadeForm, titulo: e.target.value})}
                  placeholder="Título"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={editAtividadeForm.descricao}
                  onChange={(e) => setEditAtividadeForm({...editAtividadeForm, descricao: e.target.value})}
                  placeholder="Descrição..."
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Data*</label>
                <Input
                  type="date"
                  value={editAtividadeForm.data}
                  onChange={(e) => setEditAtividadeForm({...editAtividadeForm, data: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Horário Início</label>
                  <Input
                    type="time"
                    value={editAtividadeForm.horarioInicio}
                    onChange={(e) => setEditAtividadeForm({...editAtividadeForm, horarioInicio: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Horário Fim</label>
                  <Input
                    type="time"
                    value={editAtividadeForm.horarioFim}
                    onChange={(e) => setEditAtividadeForm({...editAtividadeForm, horarioFim: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Local</label>
                <Input
                  value={editAtividadeForm.local}
                  onChange={(e) => setEditAtividadeForm({...editAtividadeForm, local: e.target.value})}
                  placeholder="Local"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setEditandoAtividade(null)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  if (!editAtividadeForm.titulo || !editAtividadeForm.data) {
                    toast({ title: "Campos obrigatórios", description: "Preencha título e data.", variant: "destructive" });
                    return;
                  }
                  editAtividadeMutation.mutate({
                    id: editandoAtividade.id,
                    ...editAtividadeForm
                  });
                }}
                disabled={editAtividadeMutation.isPending || !editAtividadeForm.titulo || !editAtividadeForm.data}
              >
                {editAtividadeMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Novo Grupo */}
        <Dialog open={showNovoGrupoModal} onOpenChange={setShowNovoGrupoModal}>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Grupo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome do Grupo *</label>
                <Input
                  value={novoGrupoForm.nome}
                  onChange={(e) => setNovoGrupoForm({ ...novoGrupoForm, nome: e.target.value })}
                  placeholder="Ex: Grupo A"
                  data-testid="input-nome-grupo"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nível</label>
                <Input
                  value={novoGrupoForm.nivel}
                  onChange={(e) => setNovoGrupoForm({ ...novoGrupoForm, nivel: e.target.value })}
                  placeholder="Ex: Iniciante, Intermediário"
                  data-testid="input-nivel-grupo"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Atividade Principal</label>
                <Input
                  value={novoGrupoForm.atividade}
                  onChange={(e) => setNovoGrupoForm({ ...novoGrupoForm, atividade: e.target.value })}
                  placeholder="Ex: Reforço Escolar"
                  data-testid="input-atividade-grupo"
                />
              </div>
              
              {/* Horário */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Horário Início</label>
                  <Input
                    type="time"
                    value={novoGrupoForm.horarioInicio}
                    onChange={(e) => setNovoGrupoForm({ ...novoGrupoForm, horarioInicio: e.target.value })}
                    placeholder="14:00"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Horário Fim</label>
                  <Input
                    type="time"
                    value={novoGrupoForm.horarioFim}
                    onChange={(e) => setNovoGrupoForm({ ...novoGrupoForm, horarioFim: e.target.value })}
                    placeholder="16:00"
                  />
                </div>
              </div>
              
              {/* Dias da Semana */}
              <div>
                <label className="text-sm font-medium mb-2 block">Dias da Semana</label>
                <div className="flex flex-wrap gap-2">
                  {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((dia) => (
                    <label key={dia} className="flex items-center gap-1 cursor-pointer">
                      <Checkbox
                        checked={novoGrupoForm.diasSemana.includes(dia.toLowerCase())}
                        onCheckedChange={(checked) => {
                          const diaLower = dia.toLowerCase();
                          if (checked) {
                            setNovoGrupoForm({ ...novoGrupoForm, diasSemana: [...novoGrupoForm.diasSemana, diaLower] });
                          } else {
                            setNovoGrupoForm({ ...novoGrupoForm, diasSemana: novoGrupoForm.diasSemana.filter(d => d !== diaLower) });
                          }
                        }}
                      />
                      <span className="text-sm">{dia}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Número de Alunos (esperado)</label>
                <Input
                  type="number"
                  value={novoGrupoForm.alunos}
                  onChange={(e) => setNovoGrupoForm({ ...novoGrupoForm, alunos: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  data-testid="input-alunos-grupo"
                />
              </div>
              
              {/* Seleção de Alunos */}
              <div>
                <label className="text-sm font-medium">Selecionar Alunos ({alunosSelecionadosNovoGrupo.length} selecionados)</label>
                
                {/* Alunos selecionados */}
                {alunosSelecionadosNovoGrupo.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2 mt-1">
                    {alunosSelecionadosNovoGrupo.map((al: any) => (
                      <Badge key={al.cpf || al.id} className="bg-purple-100 text-purple-800 flex items-center gap-1">
                        {al.nome}
                        <X 
                          className="w-3 h-3 cursor-pointer hover:text-red-600" 
                          onClick={() => setAlunosSelecionadosNovoGrupo(prev => prev.filter(a => al.cpf ? a.cpf !== al.cpf : a.id !== al.id))}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
                
                <Input 
                  placeholder="Buscar aluno por nome ou CPF..." 
                  value={searchNovoGrupo}
                  onChange={(e) => setSearchNovoGrupo(e.target.value)}
                  className="mb-2"
                />
                <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                  {vertente === 'pec' && alunosPec && searchNovoGrupo.length >= 2 && (
                    alunosPec
                      .filter((al: any) => 
                        (al.nome_completo?.toLowerCase().includes(searchNovoGrupo.toLowerCase()) || (al.cpf || '').includes(searchNovoGrupo)) &&
                        !alunosSelecionadosNovoGrupo.some(a => a.cpf === al.cpf) &&
                        (al.situacao_atendimento === 'ativo' || al.situacao_atendimento === 'Ativo')
                      )
                      .slice(0, 10)
                      .map((al: any) => (
                        <div 
                          key={al.cpf} 
                          className={`flex items-center justify-between p-2 hover:bg-gray-50 ${novoGrupoForm.alunos > 0 && alunosSelecionadosNovoGrupo.length >= novoGrupoForm.alunos ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          onClick={() => {
                            if (novoGrupoForm.alunos > 0 && alunosSelecionadosNovoGrupo.length >= novoGrupoForm.alunos) {
                              toast({ title: "Limite atingido", description: `Máximo de ${novoGrupoForm.alunos} alunos permitido.`, variant: "destructive" });
                              return;
                            }
                            setAlunosSelecionadosNovoGrupo(prev => [...prev, { nome: al.nome_completo, cpf: al.cpf }]);
                            setSearchNovoGrupo('');
                          }}
                        >
                          <span className="text-sm">{al.nome_completo}</span>
                          <Plus className="w-4 h-4 text-purple-600" />
                        </div>
                      ))
                  )}
                  {vertente === 'inclusao' && participantesInclusao && searchNovoGrupo.length >= 2 && (
                    participantesInclusao
                      .filter((p: any) => 
                        (p.nomeCompleto?.toLowerCase().includes(searchNovoGrupo.toLowerCase()) || (p.cpf || '').includes(searchNovoGrupo)) &&
                        !alunosSelecionadosNovoGrupo.some(a => a.id === p.id) &&
                        p.status !== 'inativo'
                      )
                      .slice(0, 10)
                      .map((p: any) => (
                        <div 
                          key={p.id} 
                          className={`flex items-center justify-between p-2 hover:bg-gray-50 ${novoGrupoForm.alunos > 0 && alunosSelecionadosNovoGrupo.length >= novoGrupoForm.alunos ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          onClick={() => {
                            if (novoGrupoForm.alunos > 0 && alunosSelecionadosNovoGrupo.length >= novoGrupoForm.alunos) {
                              toast({ title: "Limite atingido", description: `Máximo de ${novoGrupoForm.alunos} alunos permitido.`, variant: "destructive" });
                              return;
                            }
                            setAlunosSelecionadosNovoGrupo(prev => [...prev, { id: p.id, nome: p.nomeCompleto }]);
                            setSearchNovoGrupo('');
                          }}
                        >
                          <span className="text-sm">{p.nomeCompleto}</span>
                          <Plus className="w-4 h-4 text-purple-600" />
                        </div>
                      ))
                  )}
                  {searchNovoGrupo.length < 2 && (
                    <p className="text-xs text-gray-400 p-2">Digite ao menos 2 caracteres para buscar</p>
                  )}
                </div>
              </div>
              
              <Button
                className="w-full bg-purple-500 hover:bg-purple-600"
                onClick={() => createGrupoMutation.mutate({
                  ...novoGrupoForm,
                  frequencia: novoGrupoForm.frequencia === '' ? null : novoGrupoForm.frequencia
                })}
                disabled={createGrupoMutation.isPending || !novoGrupoForm.nome}
                data-testid="button-criar-grupo"
              >
                {createGrupoMutation.isPending ? 'Salvando...' : 'Criar Grupo'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Detalhes da Turma */}
        <TurmaDetailModalInclusao
          open={showTurmaDetailModalInclusao}
          onOpenChange={setShowTurmaDetailModalInclusao}
          turma={turmaParaGerenciarInclusao}
        />
        <TurmaDetailModal
          open={showTurmaDetailModal}
          onOpenChange={setShowTurmaDetailModal}
          selectedInstance={grupoSelecionado}
        />

        <Dialog open={showDetalhesTurmaModal} onOpenChange={setShowDetalhesTurmaModal}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Turma</DialogTitle>
            </DialogHeader>
            {grupoSelecionado && (
              <div className="space-y-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{grupoSelecionado.nome || grupoSelecionado.title}</h3>
                    <Badge variant={grupoSelecionado.status === 'ativo' || grupoSelecionado.status === 'emandamento' ? 'default' : 'secondary'}>
                      {grupoSelecionado.status === 'emandamento' ? 'Em andamento' : 
                       grupoSelecionado.status === 'ativo' ? 'Ativa' : 
                       grupoSelecionado.status === 'concluido' ? 'Concluída' : 
                       grupoSelecionado.status === 'planejado' ? 'Planejada' : grupoSelecionado.status}
                    </Badge>
                  </div>
                  {grupoSelecionado.descricao && (
                    <p className="text-sm text-gray-600">{grupoSelecionado.descricao}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Código</p>
                    <p className="font-semibold">{grupoSelecionado.codigo || 'Não definido'}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Local</p>
                    <p className="font-semibold">{grupoSelecionado.local || 'Não definido'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Datas e Horários</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Data Início</p>
                      <p className="font-semibold">
                        {formatDateBR(grupoSelecionado.dataInicio || grupoSelecionado.data_inicio)}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Data Fim</p>
                      <p className="font-semibold">
                         {formatDateBR(grupoSelecionado.dataFim || grupoSelecionado.data_fim)}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Horário</p>
                      <p className="font-semibold">
                        {grupoSelecionado.horario || 
                         (grupoSelecionado.horarioInicio && grupoSelecionado.horarioFim 
                           ? `${grupoSelecionado.horarioInicio} - ${grupoSelecionado.horarioFim}` 
                           : 'Não definido')}
                      </p>
                    </div>
                  </div>
                  {(grupoSelecionado.diasSemana && grupoSelecionado.diasSemana.length > 0) && (
                    <div className="p-4 bg-blue-50 rounded-lg mt-4">
                      <p className="text-sm text-gray-600 mb-2">Dias da Semana</p>
                      <div className="flex flex-wrap gap-2">
                        {grupoSelecionado.diasSemana.map((dia: string) => (
                            <span
                              key={dia}
                              className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium"
                            >
                              {dia}
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
                      setShowEditTurmaPecModal(true);
                    }}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
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

        {/* Modal de Gerenciar Alunos na Turma */}
        <Dialog open={showGerenciarAlunosModal} onOpenChange={setShowGerenciarAlunosModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gerenciar Alunos - {grupoSelecionado?.nome}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Alunos já no grupo */}
              <div>
                <h4 className="font-medium mb-2">Alunos na Turma ({alunosDoGrupo.length})</h4>
                {alunosDoGrupo.length > 0 ? (
                  <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                    {[...alunosDoGrupo].sort((a: any, b: any) => (a.nome || "").localeCompare(b.nome || "", 'pt-BR')).map((al: any) => (
                      <div key={al.id || al.cpf} className="flex items-center justify-between p-2">
                        <span>{al.nome}</span>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => {
                            if (vertente === 'inclusao') {
                              setDesligarMonitorModal({ participanteId: al.id, turmaId: grupoSelecionado.id, nome: al.nome || "Participante" });
                              setDesligarMonitorMotivo("");
                            } else {
                              // PEC: remover diretamente
                              fetch('/api/professor/unenroll', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ studentCpf: al.cpf, classId: grupoSelecionado.id })
                              }).then(r => {
                                if (!r.ok) throw new Error('Erro');
                                setAlunosDoGrupo(prev => prev.filter(a => a.id !== al.id));
                                queryClient.invalidateQueries({ queryKey: ['/api/monitor/grupos', resolvedMonitorId, vertente] });
                                toast({ title: "Aluno removido da turma" });
                              }).catch(() => toast({ title: "Erro ao remover", variant: "destructive" }));
                            }
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Nenhum aluno na turma ainda</p>
                )}
              </div>

              {/* Adicionar alunos */}
              <div>
                <h4 className="font-medium mb-2">Adicionar Alunos</h4>
                <Input 
                  placeholder="Buscar por nome ou CPF..." 
                  value={searchAlunoGrupo}
                  onChange={(e) => setSearchAlunoGrupo(e.target.value)}
                  className="mb-2"
                />
                <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                  {vertente === 'pec' && alunosPec && (
                    alunosPec
                      .filter((al: any) => 
                        (al.nome_completo?.toLowerCase().includes(searchAlunoGrupo.toLowerCase()) || (al.cpf || '').includes(searchAlunoGrupo)) &&
                        !alunosDoGrupo.some(a => a.cpf === al.cpf || a.id === al.cpf)
                      )
                      .sort((a: any, b: any) => {
                        const aInativo = a.situacao_atendimento?.toLowerCase() === 'inativo';
                        const bInativo = b.situacao_atendimento?.toLowerCase() === 'inativo';
                        if (aInativo !== bInativo) return aInativo ? 1 : -1;
                        return (a.nome_completo || '').localeCompare(b.nome_completo || '', 'pt-BR');
                      })
                      .slice(0, 20)
                      .map((al: any) => (
                        <div key={al.cpf} className="flex items-center justify-between p-2">
                          <div className="flex items-center gap-2">
                            <span>{al.nome_completo}</span>
                            {al.situacao_atendimento?.toLowerCase() === 'inativo' && (
                              <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Inativo</span>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={async () => {
                              try {
                                const resp = await apiRequest(`/api/monitor/${userId}/grupos/${grupoSelecionado.id}/alunos`, {
                                    method: 'POST',
                                    body: JSON.stringify({
                                      participanteCpf: al.cpf,
                                      participanteTipo: 'pec'
                                    })
                                  });
                                if (resp.ok) {
                                 setAlunosDoGrupo(prev => [...prev, { id: al.cpf, cpf: al.cpf, nome: al.nome_completo, tipo: 'pec' }]);
                                    toast({ title: "Aluno adicionado à turma" });
                                }
                              } catch (e) {
                                toast({ title: "Erro ao adicionar", variant: "destructive" });
                              }
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                  )}
                  {vertente === 'inclusao' && participantesInclusao && (
                    participantesInclusao
                      .filter((p: any) => 
                        (p.nomeCompleto?.toLowerCase().includes(searchAlunoGrupo.toLowerCase()) || (p.cpf || '').includes(searchAlunoGrupo)) &&
                        !alunosDoGrupo.some(a => a.id === p.id)
                      )
                      .sort((a: any, b: any) => {
                        const aInativo = a.status?.toLowerCase() === 'inativo';
                        const bInativo = b.status?.toLowerCase() === 'inativo';
                        if (aInativo !== bInativo) return aInativo ? 1 : -1;
                        return (a.nomeCompleto || '').localeCompare(b.nomeCompleto || '', 'pt-BR');
                      })
                      .slice(0, 20)
                      .map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-2">
                          <div className="flex items-center gap-2">
                            <span>{p.nomeCompleto}</span>
                            {p.status?.toLowerCase() === 'inativo' && (
                              <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Inativo</span>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={async () => {
                              try {
                                const resp = await apiRequest(`/api/monitor/${userId}/grupos/${grupoSelecionado.id}/alunos`, {
                                      method: 'POST',
                                      body: JSON.stringify({
                                        participanteId: p.id,
                                        participanteTipo: 'inclusao'
                                      })
                                    });
                                if (resp.ok) {
                                  setAlunosDoGrupo(prev => [...prev, { id: p.id, nome: p.nomeCompleto, tipo: 'inclusao' }]);
                                  await queryClient.refetchQueries({ queryKey: ["/api/participantes-inclusao"] });
                                  toast({ title: "Participante adicionado à grupo" });
                                }
                              } catch (e) {
                                toast({ title: "Erro ao adicionar", variant: "destructive" });
                              }
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                  )}
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={() => {
                  setShowGerenciarAlunosModal(false);
                  queryClient.invalidateQueries({ queryKey: ['/api/monitor/grupos', resolvedMonitorId, vertente] });
                }}
              >
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Editar Grupo */}
        {/* Modal de Motivo de Desligamento (Inclusão) */}
        <Dialog open={!!desligarMonitorModal} onOpenChange={(open) => { if (!open) { setDesligarMonitorModal(null); setDesligarMonitorMotivo(""); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Desligar da Turma</DialogTitle>
              <DialogDescription>
                Selecione o motivo do desligamento de <strong>{desligarMonitorModal?.nome}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              {["Cadastro errado", "Empregabilidade", "Desistência", "Mudança de localidade", "Mudança de oficina/curso"].map(op => (
                <button
                  key={op}
                  type="button"
                  className={`w-full text-left px-4 py-2 rounded border transition-colors ${desligarMonitorMotivo === op ? "bg-red-100 border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-500 dark:text-red-300" : "hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700"}`}
                  onClick={() => setDesligarMonitorMotivo(op)}
                >
                  {op}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setDesligarMonitorModal(null); setDesligarMonitorMotivo(""); }}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={!desligarMonitorMotivo || desligarMonitorLoading}
                onClick={async () => {
                  if (!desligarMonitorModal || !desligarMonitorMotivo) return;
                  setDesligarMonitorLoading(true);
                  try {
                    const response = await fetch(`/api/participantes-inclusao/${desligarMonitorModal.participanteId}/turmas/${desligarMonitorModal.turmaId}`, {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ motivo: desligarMonitorMotivo }),
                    });
                    if (!response.ok) {
                      const err = await response.json();
                      throw new Error(err.error || "Erro ao desligar");
                    }
                    setAlunosDoGrupo(prev => prev.filter(a => a.id !== desligarMonitorModal.participanteId));
                    queryClient.invalidateQueries({ queryKey: ["/api/monitor/grupos", resolvedMonitorId, vertente] });
                    toast({ title: "Aluno desligado da turma", description: `Motivo: ${desligarMonitorMotivo}` });
                    setDesligarMonitorModal(null);
                    setDesligarMonitorMotivo("");
                  } catch (e: any) {
                    toast({ title: "Erro ao desligar", description: e.message, variant: "destructive" });
                  } finally {
                    setDesligarMonitorLoading(false);
                  }
                }}
              >
                {desligarMonitorLoading ? "Aguarde..." : "Confirmar Desligamento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditarGrupoModal} onOpenChange={setShowEditarGrupoModal}>          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Grupo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nome do Grupo *</label>
                  <Input
                    value={editarGrupoForm.nome}
                    onChange={(e) => setEditarGrupoForm({ ...editarGrupoForm, nome: e.target.value })}
                    placeholder="Nome do grupo"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Nível</label>
                  <Input
                    value={editarGrupoForm.nivel}
                    onChange={(e) => setEditarGrupoForm({ ...editarGrupoForm, nivel: e.target.value })}
                    placeholder="Ex: Iniciante, Intermediário"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Atividade</label>
                  <Input
                    value={editarGrupoForm.atividade}
                    onChange={(e) => setEditarGrupoForm({ ...editarGrupoForm, atividade: e.target.value })}
                    placeholder="Ex: Reforço Escolar"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Número de Alunos (esperado)</label>
                  <Input
                    type="number"
                    min="0"
                    value={editarGrupoForm.alunos}
                    onChange={(e) => setEditarGrupoForm({ ...editarGrupoForm, alunos: parseInt(e.target.value) || 0 })}
                    placeholder="Ex: 15"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={editarGrupoForm.status}
                    onValueChange={(value) => setEditarGrupoForm({ ...editarGrupoForm, status: value })}
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

              {/* Horário e Dias da Semana */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Horário e Dias</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium">Horário Início</label>
                    <Input
                      type="time"
                      value={editarGrupoForm.horarioInicio || ''}
                      onChange={(e) => setEditarGrupoForm({ ...editarGrupoForm, horarioInicio: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Horário Fim</label>
                    <Input
                      type="time"
                      value={editarGrupoForm.horarioFim || ''}
                      onChange={(e) => setEditarGrupoForm({ ...editarGrupoForm, horarioFim: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Dias da Semana</label>
                  <div className="flex flex-wrap gap-2">
                    {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((dia) => {
                      const dias = editarGrupoForm.diasSemana || [];
                      const isSelected = dias.includes(dia);
                      return (
                        <button
                          key={dia}
                          type="button"
                          onClick={() => {
                            const newDias = isSelected 
                              ? dias.filter((d: string) => d !== dia)
                              : [...dias, dia];
                            setEditarGrupoForm({ ...editarGrupoForm, diasSemana: newDias });
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                            isSelected 
                              ? 'bg-purple-600 text-white border-purple-600' 
                              : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                          }`}
                        >
                          {dia}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Alunos do Grupo */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Alunos na Turma ({alunosDoGrupo.length})
                </h4>
                {alunosDoGrupo.length > 0 ? (
                  <div className="border rounded-lg divide-y max-h-32 overflow-y-auto mb-3">
                    {[...alunosDoGrupo].sort((a: any, b: any) => (a.nome || "").localeCompare(b.nome || "", 'pt-BR')).map((al: any) => (
                      <div key={al.id || al.cpf} className="flex items-center justify-between p-2">
                        <span className="text-sm">{al.nome}</span>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          onClick={() => {
                            if (vertente === 'inclusao') {
                              setDesligarMonitorModal({ participanteId: al.id, turmaId: grupoSelecionado.id, nome: al.nome || "Participante" });
                              setDesligarMonitorMotivo("");
                            } else {
                              fetch('/api/professor/unenroll', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ studentCpf: al.cpf, classId: grupoSelecionado.id })
                              }).then(r => {
                                if (!r.ok) throw new Error('Erro');
                                setAlunosDoGrupo(prev => prev.filter(a => a.id !== al.id));
                                queryClient.invalidateQueries({ queryKey: ['/api/monitor/grupos', resolvedMonitorId, vertente] });
                                toast({ title: "Aluno removido da turma" });
                              }).catch(() => toast({ title: "Erro ao remover", variant: "destructive" }));
                            }
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-3">Nenhum aluno nesta turma</p>
                )}

                {/* Buscar e adicionar alunos */}
                <div>
                  <label className="text-sm font-medium">Adicionar Aluno</label>
                  <Input
                    value={searchAlunoGrupo}
                    onChange={(e) => setSearchAlunoGrupo(e.target.value)}
                    placeholder="Digite o nome do aluno para buscar..."
                    className="mb-2"
                  />
                  {searchAlunoGrupo.length >= 2 && (
                    <div className="border rounded-lg divide-y max-h-32 overflow-y-auto">
                      {vertente === 'pec' && alunosPec && (
                        alunosPec
                          .filter((al: any) => 
                            al.nome_completo?.toLowerCase().includes(searchAlunoGrupo.toLowerCase()) &&
                            !alunosDoGrupo.some(a => a.cpf === al.cpf || a.id === al.cpf) &&
                            (al.situacao_atendimento === 'ativo' || al.situacao_atendimento === 'Ativo')
                          )
                          .slice(0, 8)
                          .map((al: any) => (
                            <div key={al.cpf} className="flex items-center justify-between p-2 hover:bg-gray-50">
                              <span className="text-sm">{al.nome_completo}</span>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-6 text-purple-600 hover:text-purple-800"
                                onClick={async () => {
                                  try {
                                    const resp = await apiRequest(`/api/monitor/${userId}/grupos/${grupoSelecionado.id}/alunos`, {
                                          method: 'POST',
                                          body: JSON.stringify({
                                            participanteId: al.cpf,
                                            participanteTipo: 'pec'
                                          })
                                        });
                                    if (resp.ok) {
                                    setAlunosDoGrupo(prev => [...prev, { id: al.cpf, nome: al.nome_completo, tipo: 'pec' }]);
                                    toast({ title: "Participante adicionado à turma" });
                                    }
                                  } catch (e) {
                                    toast({ title: "Erro ao adicionar", variant: "destructive" });
                                  }
                                }}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Adicionar
                              </Button>
                            </div>
                          ))
                      )}
                      {vertente === 'inclusao' && participantesInclusao && (
                        participantesInclusao
                          .filter((p: any) => 
                            p.nomeCompleto?.toLowerCase().includes(searchAlunoGrupo.toLowerCase()) &&
                            !alunosDoGrupo.some(a => a.id === p.id) &&
                            p.status !== 'inativo'
                          )
                          .slice(0, 8)
                          .map((p: any) => (
                            <div key={p.id} className="flex items-center justify-between p-2 hover:bg-gray-50">
                              <span className="text-sm">{p.nomeCompleto}</span>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-6 text-purple-600 hover:text-purple-800"
                                onClick={async () => {
                                  try {
                                    const resp = await fetch(`/api/monitor/${userId}/grupos/${grupoSelecionado.id}/alunos`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ 
                                        participanteId: p.id, 
                                        participanteTipo: 'inclusao'
                                      })
                                    });
                                    if (resp.ok) {
                                      setAlunosDoGrupo(prev => [...prev, { id: p.id, nome: p.nomeCompleto, tipo: 'inclusao' }]);
                                      setSearchAlunoGrupo('');
                                      toast({ title: "Participante adicionado à grupo" });
                                    }
                                  } catch (e) {
                                    toast({ title: "Erro ao adicionar", variant: "destructive" });
                                  }
                                }}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Adicionar
                              </Button>
                            </div>
                          ))
                      )}
                    </div>
                  )}
                  {searchAlunoGrupo.length > 0 && searchAlunoGrupo.length < 2 && (
                    <p className="text-xs text-gray-400">Digite ao menos 2 caracteres para buscar</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowEditarGrupoModal(false);
                    queryClient.invalidateQueries({ queryKey: ['/api/monitor/grupos', resolvedMonitorId, vertente] });
                  }}
                >
                  Fechar
                </Button>
                <Button
                  className="flex-1 bg-purple-500 hover:bg-purple-600"
                  onClick={() => {
                      if (grupoSelecionado?.id) {
                       updateGrupoMutation.mutate({
                          grupoId: grupoSelecionado.id,
                          formData: buildGrupoPayload(editarGrupoForm)
                        });
                      }
                    }}
                  disabled={updateGrupoMutation.isPending || !editarGrupoForm.nome}
                >
                  {updateGrupoMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Alteração de Senha */}
        <AlterarSenhaMonitor 
          open={showAlterarSenhaModal} 
          onOpenChange={setShowAlterarSenhaModal}
        />

        {/* Modal de Visualizar Detalhes do Aluno PEC */}
        <ParticipanteDetalhesModal
          open={showAlunoDetalhesModal}
          onOpenChange={(open) => {
            setShowAlunoDetalhesModal(open);
            if (!open) setFullAlunoData(null);
          }}
          title="Detalhes Completos do Aluno"
          loading={loadingAlunoDetails}
          color="orange"
          foto={fullAlunoData?.foto_perfil}
          nome={fullAlunoData?.nome_completo}
          cpf={fullAlunoData?.cpf ? maskCpfMonitor(fullAlunoData.cpf) : undefined}
          status={fullAlunoData?.situacao_atendimento}
          sections={fullAlunoData ? ([
            {
              title: "Identificação",
              icon: User,
              fields: [
                { label: "Nome", value: fullAlunoData.nome_completo },
                { label: "Gênero", value: fullAlunoData.genero },
                { label: "Data de Nascimento", value: fullAlunoData.data_nascimento ? new Date(fullAlunoData.data_nascimento + 'T12:00:00').toLocaleDateString('pt-BR') : undefined },
                { label: "Nº Matrícula", value: fullAlunoData.codigo_matricula || fullAlunoData.matricula },
                { label: "Data de Ingresso", value: fullAlunoData.data_ingresso ? new Date(fullAlunoData.data_ingresso + 'T12:00:00').toLocaleDateString('pt-BR') : undefined },
              ],
            },
            {
              title: "Contato",
              icon: Phone,
              fields: [
                { label: "Telefone", value: fullAlunoData.telefone },
                { label: "Email", value: fullAlunoData.email },
                { label: "WhatsApp", value: fullAlunoData.whatsapp },
              ],
              extra: fullAlunoData.contatos_emergencia && Array.isArray(fullAlunoData.contatos_emergencia) && fullAlunoData.contatos_emergencia.length > 0 ? (
                <div>
                  <label className="text-xs font-medium text-gray-500">Contatos de Emergência</label>
                  <div className="space-y-1 mt-1">
                    {fullAlunoData.contatos_emergencia.map((c: any, i: number) => (
                      <p key={i} className="text-sm bg-white p-2 rounded">{c.nome}: {c.telefone}</p>
                    ))}
                  </div>
                </div>
              ) : undefined,
            },
            {
              title: "Endereço",
              icon: MapPin,
              fields: [
                { label: "CEP", value: fullAlunoData.cep },
                { label: "Logradouro", value: fullAlunoData.logradouro },
                { label: "Número", value: fullAlunoData.numero },
                { label: "Complemento", value: fullAlunoData.complemento },
                { label: "Bairro", value: fullAlunoData.bairro },
                { label: "Cidade", value: fullAlunoData.cidade },
                { label: "Estado", value: fullAlunoData.estado },
              ],
            },
            {
              title: "Informações Escolares",
              icon: GraduationCap,
              fields: [
                { label: "Série", value: fullAlunoData.serie },
                { label: "Situação Escolar", value: fullAlunoData.situacao_escolar },
                { label: "Turno", value: Array.isArray(fullAlunoData.turno_escolar) ? fullAlunoData.turno_escolar.join(', ') : fullAlunoData.turno_escolar },
                { label: "Instituição de Ensino", value: fullAlunoData.instituicao_ensino },
                { label: "Pode sair sozinho?", value: fullAlunoData.pode_sair_sozinho },
              ],
            },
            {
              title: "Saúde",
              icon: Heart,
              fields: [
                { label: "Tipo Sanguíneo", value: fullAlunoData.tipo_sanguineo },
                { label: "Particularidade de Saúde", value: fullAlunoData.possui_particularidade_saude },
                { label: "Detalhes", value: fullAlunoData.detalhes_particularidade },
                { label: "Alergia", value: fullAlunoData.possui_alergia },
                { label: "Detalhes Alergia", value: fullAlunoData.detalhes_alergia },
                { label: "Medicamento", value: fullAlunoData.faz_uso_medicamento },
                { label: "Detalhes Medicamento", value: fullAlunoData.detalhes_medicamento },
                { label: "Deficiência", value: fullAlunoData.possui_deficiencia },
                { label: "Detalhes Deficiência", value: fullAlunoData.detalhes_deficiencia },
                { label: "Restrição Alimentar", value: fullAlunoData.restricao_alimentar },
              ],
            },
          ] as DetalhesSection[]) : []}
          onEdit={() => {
            setShowAlunoDetalhesModal(false);
            setEditingCpf(selectedAluno?.cpf);
            setViewMode(false);
            setShowCadastroModal(true);
          }}
        />

        {/* Modal de Cadastro/Edição - PEC usa ComprehensiveStudentForm */}
        {vertente === 'pec' && (
          <ComprehensiveStudentForm 
            open={showCadastroModal} 
            onClose={() => {
              setShowCadastroModal(false);
              setEditingCpf(undefined);
              setViewMode(false);
              queryClient.invalidateQueries({ queryKey: ['/api/monitor/pec/alunos'] });
            }}
            editCpf={editingCpf}
            viewMode={viewMode}
          />
        )}

        {/* Modal de Cadastro - Inclusão usa formulário completo */}
        {vertente === 'inclusao' && (
          <ComprehensiveStudentForm
            open={showCadastroModal}
            onClose={() => {
              setShowCadastroModal(false);
              queryClient.invalidateQueries({ queryKey: ['/api/monitor/inclusao/participantes'] });
              queryClient.invalidateQueries({ queryKey: ['/api/participantes-inclusao'] });
            }}
            mode="inclusao"
          />
        )}

        {/* Modal de Visualizar Participante Inclusão */}
        <Dialog open={showViewParticipanteModal} onOpenChange={setShowViewParticipanteModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-600" />
                Visualizar Participante
              </DialogTitle>
            </DialogHeader>
            {selectedParticipante && (
              <div className="space-y-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-green-600" />
                    {selectedParticipante.nome}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">CPF</p>
                      <p className="font-medium">{maskCpfMonitor(selectedParticipante.cpf)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Idade</p>
                      <p className="font-medium">{selectedParticipante.idade} anos</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Gênero</p>
                      <p className="font-medium">{selectedParticipante.genero ? selectedParticipante.genero.charAt(0).toUpperCase() + selectedParticipante.genero.slice(1).toLowerCase() : '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Programa Atual</p>
                      <p className="font-medium">{selectedParticipante.programaAtual || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge className={selectedParticipante.status === 'inativo' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                        {selectedParticipante.status || 'ativo'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Escolaridade</p>
                      <p className="font-medium">{selectedParticipante.escolaridade || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Telefone</p>
                    <p className="font-medium">{selectedParticipante.telefone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedParticipante.email || '-'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Endereço</p>
                  <p className="font-medium">
                    {(() => {
                      const parts = [];
                      if (selectedParticipante.logradouro) {
                        let endereco = selectedParticipante.logradouro;
                        if (selectedParticipante.numero) endereco += `, ${selectedParticipante.numero}`;
                        if (selectedParticipante.complemento) endereco += ` - ${selectedParticipante.complemento}`;
                        parts.push(endereco);
                      }
                      if (selectedParticipante.bairro) parts.push(selectedParticipante.bairro);
                      if (selectedParticipante.cidade) {
                        let cidade = selectedParticipante.cidade;
                        if (selectedParticipante.estado) cidade += `/${selectedParticipante.estado}`;
                        parts.push(cidade);
                      }
                      if (selectedParticipante.cep) parts.push(`CEP: ${selectedParticipante.cep}`);
                      return parts.length > 0 ? parts.join(' - ') : (selectedParticipante.endereco || '-');
                    })()}
                  </p>
                </div>

                {selectedParticipante.observacoes && (
                  <div>
                    <p className="text-sm text-gray-600">Observações</p>
                    <p className="font-medium bg-gray-50 p-3 rounded">{selectedParticipante.observacoes}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    className="bg-green-500 hover:bg-green-600"
                    onClick={() => {
                      setShowViewParticipanteModal(false);
                      setShowEditParticipanteModal(true);
                    }}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="outline" onClick={() => setShowViewParticipanteModal(false)}>
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Ver Detalhes do Registro */}
        <Dialog open={showViewRegistroModal} onOpenChange={setShowViewRegistroModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                Detalhes do Registro
              </DialogTitle>
            </DialogHeader>
            {selectedRegistro && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg">{selectedRegistro.titulo}</h3>
                  <p className="text-sm text-gray-600">
                    {selectedRegistro.dataAtividade ? new Date(selectedRegistro.dataAtividade).toLocaleDateString('pt-BR') : '-'} - {selectedRegistro.grupo}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Duração</p>
                    <p className="font-medium">{selectedRegistro.duracaoMinutos ? `${selectedRegistro.duracaoMinutos} min` : 'Não informada'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Participantes</p>
                    <p className="font-medium">{selectedRegistro.participantes || '-'}</p>
                  </div>
                </div>
                {selectedRegistro.descricao && (
                  <div>
                    <p className="text-sm text-gray-600">Descrição</p>
                    <p className="font-medium bg-gray-50 p-3 rounded">{selectedRegistro.descricao}</p>
                  </div>
                )}
                {selectedRegistro.resultadosObservacoes && (
                  <div>
                    <p className="text-sm text-gray-600">Resultados/Observações</p>
                    <p className="font-medium bg-gray-50 p-3 rounded">{selectedRegistro.resultadosObservacoes}</p>
                  </div>
                )}
                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={() => { setShowViewRegistroModal(false); setShowEditRegistroModal(true); }}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="outline" onClick={() => setShowViewRegistroModal(false)}>
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Editar Registro */}
        <Dialog open={showEditRegistroModal} onOpenChange={setShowEditRegistroModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-orange-600" />
                Editar Registro
              </DialogTitle>
            </DialogHeader>
            {selectedRegistro && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Título</label>
                  <Input value={selectedRegistro.titulo || ''} onChange={(e) => setSelectedRegistro({...selectedRegistro, titulo: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium">Grupo</label>
                  <Input value={selectedRegistro.grupo || ''} onChange={(e) => setSelectedRegistro({...selectedRegistro, grupo: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium">Data</label>
                  <Input type="date" value={selectedRegistro.dataAtividade || ''} onChange={(e) => setSelectedRegistro({...selectedRegistro, dataAtividade: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Duração (min)</label>
                    <Input type="number" value={selectedRegistro.duracaoMinutos || ''} onChange={(e) => setSelectedRegistro({...selectedRegistro, duracaoMinutos: parseInt(e.target.value) || null})} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Participantes</label>
                    <Input type="number" value={selectedRegistro.participantes || ''} onChange={(e) => setSelectedRegistro({...selectedRegistro, participantes: parseInt(e.target.value) || null})} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea value={selectedRegistro.descricao || ''} onChange={(e) => setSelectedRegistro({...selectedRegistro, descricao: e.target.value})} rows={2} />
                </div>
                <div>
                  <label className="text-sm font-medium">Resultados/Observações</label>
                  <Textarea value={selectedRegistro.resultadosObservacoes || ''} onChange={(e) => setSelectedRegistro({...selectedRegistro, resultadosObservacoes: e.target.value})} rows={3} />
                </div>
                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={async () => {
                    try {
                      await apiRequest(`/api/monitor/${userId}/registros/${selectedRegistro.id}`, { method: 'PATCH', body: JSON.stringify(selectedRegistro) });
                      queryClient.invalidateQueries({ queryKey: ['/api/monitor/registros', userId, vertente] });
                      toast({ title: "Registro atualizado!", description: "As alterações foram salvas." });
                      setShowEditRegistroModal(false);
                    } catch (err) {
                      toast({ title: "Erro", description: "Não foi possível atualizar o registro.", variant: "destructive" });
                    }
                  }}>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => setShowEditRegistroModal(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Editar Participante Inclusão */}
        <Dialog open={showEditParticipanteModal} onOpenChange={setShowEditParticipanteModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-green-600" />
                Editar Participante
              </DialogTitle>
            </DialogHeader>
            {selectedParticipante && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Nome *</label>
                    <Input
                      value={selectedParticipante.nome || ''}
                      onChange={(e) => setSelectedParticipante({ ...selectedParticipante, nome: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">CPF</label>
                    <Input
                      value={selectedParticipante.cpf || ''}
                      onChange={(e) => setSelectedParticipante({ ...selectedParticipante, cpf: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Idade *</label>
                    <Input
                      type="number"
                      value={selectedParticipante.idade || ''}
                      onChange={(e) => setSelectedParticipante({ ...selectedParticipante, idade: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Gênero *</label>
                    <Select 
                      value={selectedParticipante.genero || ''} 
                      onValueChange={(v) => setSelectedParticipante({ ...selectedParticipante, genero: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Telefone</label>
                    <Input
                      value={selectedParticipante.telefone || ''}
                      onChange={(e) => setSelectedParticipante({ ...selectedParticipante, telefone: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={selectedParticipante.email || ''}
                      onChange={(e) => setSelectedParticipante({ ...selectedParticipante, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Programa Atual</label>
                    <Input
                      value={selectedParticipante.programaAtual || ''}
                      onChange={(e) => setSelectedParticipante({ ...selectedParticipante, programaAtual: e.target.value })}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Escolaridade</label>
                  <Select 
                    value={selectedParticipante.escolaridade || ''} 
                    onValueChange={(v) => setSelectedParticipante({ ...selectedParticipante, escolaridade: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a escolaridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fundamental_incompleto">Fundamental Incompleto</SelectItem>
                      <SelectItem value="fundamental_completo">Fundamental Completo</SelectItem>
                      <SelectItem value="medio_incompleto">Médio Incompleto</SelectItem>
                      <SelectItem value="medio_completo">Médio Completo</SelectItem>
                      <SelectItem value="superior_incompleto">Superior Incompleto</SelectItem>
                      <SelectItem value="superior_completo">Superior Completo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Endereço</label>
                  <Input
                    value={selectedParticipante.endereco || ''}
                    onChange={(e) => setSelectedParticipante({ ...selectedParticipante, endereco: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Observações</label>
                  <Textarea
                    value={selectedParticipante.observacoes || ''}
                    onChange={(e) => setSelectedParticipante({ ...selectedParticipante, observacoes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => {
                    setShowEditParticipanteModal(false);
                    setSelectedParticipante(null);
                  }}>
                    Cancelar
                  </Button>
                  <Button
                    className="bg-green-500 hover:bg-green-600"
                    disabled={atualizarParticipanteMutation.isPending || !selectedParticipante.nome}
                    onClick={() => atualizarParticipanteMutation.mutate({
                      id: selectedParticipante.id,
                      data: {
                        nome: selectedParticipante.nome,
                        cpf: selectedParticipante.cpf || null,
                        idade: selectedParticipante.idade,
                        genero: selectedParticipante.genero,
                        telefone: selectedParticipante.telefone || null,
                        email: selectedParticipante.email || null,
                        endereco: selectedParticipante.endereco || null,
                        escolaridade: selectedParticipante.escolaridade || null,
                        programaAtual: selectedParticipante.programaAtual || null,
                        observacoes: selectedParticipante.observacoes || null
                      }
                    })}
                  >
                    {atualizarParticipanteMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Nova Turma - PEC usa InstanceForm */}
        {vertente === 'pec' && (
          <InstanceForm 
            open={showNovaTurmaModal}
            onClose={() => setShowNovaTurmaModal(false)}
            monitorUserId={parseInt(userId || '0')}
          />
        )}

        {/* Modal de Nova Turma - Inclusão usa TurmaInclusaoForm */}
        {vertente === 'inclusao' && (
          <TurmaInclusaoForm 
            open={showNovaTurmaModal}
            onClose={() => setShowNovaTurmaModal(false)}
            monitorUserId={parseInt(userId || '0')}
          />
        )}

        {/* Modal de Editar Turma - Inclusão usa TurmaInclusaoForm */}
        {vertente === 'inclusao' && (
          <TurmaInclusaoForm 
            open={showEditTurmaInclusaoModal}
            onClose={() => {
              setShowEditTurmaInclusaoModal(false);
              setTurmaParaEditar(null);
              queryClient.invalidateQueries({ queryKey: ['/api/monitor/grupos', resolvedMonitorId, vertente] });
              queryClient.invalidateQueries({ queryKey: ['/api/turmas-inclusao'] });
            }}
            turma={turmaParaEditar}
            monitorUserId={parseInt(userId || '0')}
          />
        )}

        {/* Modal de Editar Turma PEC - usa InstanceForm (mesmo do coordenador) */}
        {vertente === 'pec' && (
          <InstanceForm
            open={showEditTurmaPecModal}
            onClose={() => {
              setShowEditTurmaPecModal(false);
              queryClient.invalidateQueries({ queryKey: ['/api/monitor/grupos', resolvedMonitorId, vertente] });
            }}
            instance={grupoSelecionado}
            monitorUserId={parseInt(userId || '0')}
          />
        )}

        {/* Modal de Nova Oficina PEC - usa ActivityForm (mesma tabela do coordenador) */}
        {vertente === 'pec' && (
          <ActivityForm 
            open={showNovaOficinaModal}
            onClose={() => setShowNovaOficinaModal(false)}
          />
        )}

        {/* Modal Finalizar Turma */}
        <Dialog open={showFinalizarTurmaModal} onOpenChange={setShowFinalizarTurmaModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-green-600" />
                Finalizar Turma: {grupoSelecionado?.nome}
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
                    {participantesTurmaAtual.filter((p: any) => (p.nome || '').toLowerCase().includes(buscaParticipante.toLowerCase()) || (p.cpf || '').includes(buscaParticipante)).map((participante: any) => (
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
                  if (!grupoSelecionado) return;
                  setIsFinalizando(true);
                  try {
                    const response = await fetch(`/api/turmas-inclusao/${grupoSelecionado.id}/finalizar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ participantesConcluidosIds: participantesSelecionados }) });
                    if (response.ok) {
                      const result = await response.json();
                      toast({ title: "Turma finalizada!", description: `${result.alunosConcluidos} aluno(s) formado(s) com certificado.` });
                      queryClient.invalidateQueries({ queryKey: ["/api/turmas-inclusao"] });
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
      </div>
      {/* Dialog justificativa Chamada Manual (PEC/Turmas monitor) */}
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
              <label className="text-sm font-medium text-gray-700">Descreva brevemente o ocorrido</label>
              <Textarea
                placeholder="Descreva brevemente o ocorrido (opcional)..."
                value={descManual}
                onChange={(e) => setDescManual(e.target.value)}
                className="h-20 resize-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">PIN de acesso <span className="text-red-500">*</span></label>
              <input
                type="password"
                maxLength={4}
                inputMode="numeric"
                pattern="[0-9]*"
                value={pinManual}
                onChange={(e) => { setPinManual(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError(''); }}
                placeholder="••••"
                className={`w-full border rounded-md px-3 py-2 text-sm text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-orange-400 ${pinError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              />
              {pinError && <p className="text-xs text-red-600">{pinError}</p>}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setShowModoManualDialog(false); setPinManual(''); setPinError(''); }} disabled={savingMotivoManual}>
              Cancelar
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600"
              disabled={!motivoManualSelect || pinManual.length < 4 || savingMotivoManual}
              onClick={async () => {
                setSavingMotivoManual(true);
                setPinError('');
                try {
                  const pinRes = await fetch('/api/presenca/validar-pin-manual', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pin: pinManual }),
                  });
                  if (!pinRes.ok) {
                    setPinError('PIN incorreto. Verifique e tente novamente.');
                    setSavingMotivoManual(false);
                    return;
                  }
                  const motivoFinal = descManual.trim() ? `${motivoManualSelect} — ${descManual.trim()}` : motivoManualSelect;
                  await fetch('/api/chamada-manual-log', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ motivo: motivoFinal, data: new Date().toISOString().slice(0, 10) }),
                  });
                  setShowModoManualDialog(false);
                  setMotivoManualSelect('');
                  setDescManual('');
                  setPinManual('');
                  setPinError('');
                  setModoManual(true);
                } catch (e) {
                  console.error('Erro ao ativar modo manual:', e);
                } finally {
                  setSavingMotivoManual(false);
                }
              }}
            >
              {savingMotivoManual ? 'Validando...' : 'Confirmar e Abrir Chamada Manual'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Justificativa de Faltas */}
      <Dialog open={showJustificativaModal} onOpenChange={setShowJustificativaModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-orange-500" />
              Justificar Faltas ({modalJustItems.length} aluno{modalJustItems.length !== 1 ? 's' : ''})
            </DialogTitle>
            <DialogDescription>Selecione o motivo da falta para cada aluno antes de finalizar.</DialogDescription>
          </DialogHeader>
          {modalJustItems.length > 1 && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  const firstMotivo = modalJustItems[0]?.motivo || 'Sem justificativa';
                  const firstObs = modalJustItems[0]?.obs || '';
                  const firstContaComoPresenca = MOTIVOS_FALTA.find(m => m.label === firstMotivo)?.contaComoPresenca ?? false;
                  setModalJustItems(modalJustItems.map(i => ({
                    ...i,
                    motivo: firstMotivo,
                    obs: firstObs,
                    contaComoPresenca: firstContaComoPresenca,
                  })));
                }}
              >
                Aplicar para todos
              </Button>
            </div>
          )}
          <div className="space-y-4 mt-1 max-h-[55vh] overflow-y-auto pr-1">
            {modalJustItems.map((item, idx) => (
              <div key={item.alunoCpf} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="font-medium text-sm flex-1 truncate">{item.nome}</span>
                  <Badge variant="destructive" className="text-xs">Falta</Badge>
                </div>
                <Select
                  value={item.motivo}
                  onValueChange={(val) => {
                    const info = MOTIVOS_FALTA.find(m => m.label === val);
                    const updated = [...modalJustItems];
                    updated[idx] = { ...item, motivo: val, contaComoPresenca: info?.contaComoPresenca ?? false };
                    setModalJustItems(updated);
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Selecione o motivo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MOTIVOS_FALTA.map(m => (
                      <SelectItem key={m.label} value={m.label}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {MOTIVOS_FALTA.find(m => m.label === item.motivo)?.contaComoPresenca ? (
                  <p className="text-xs text-green-600 font-medium">✓ Conta como presença</p>
                ) : (
                  <p className="text-xs text-red-500">✗ Não conta como presença</p>
                )}
                <Textarea
                  placeholder="Observações (opcional)"
                  value={item.obs}
                  onChange={(e) => {
                    const updated = [...modalJustItems];
                    updated[idx] = { ...item, obs: e.target.value };
                    setModalJustItems(updated);
                  }}
                  className="text-sm resize-none h-16"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowJustificativaModal(false)} className="flex-1">Cancelar</Button>
            <Button
              className="flex-1 bg-green-500 hover:bg-green-600"
              onClick={() => {
                if (!modalJustItems.every(i => i.motivo)) {
                  toast({ title: 'Preencha todos os motivos', variant: 'destructive' });
                  return;
                }
                const updatedPresencas = presencas.map(p => {
                  const justItem = modalJustItems.find(i => i.alunoCpf === p.alunoCpf);
                  if (justItem) return {
                    ...p,
                    justificativa: justItem.motivo,
                    justificativaMotivo: justItem.motivo,
                    justificativaObs: justItem.obs,
                    contaComoPresenca: justItem.contaComoPresenca,
                  };
                  return p;
                });
                setPresencas(updatedPresencas);
                setShowJustificativaModal(false);
                if (!editingChamadaId) setShowAlimentacaoModal(true);
                else saveChamadaMutation.mutate();
              }}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Salvar e Finalizar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal confirmação alimentação */}
      <Dialog open={showAlimentacaoModal} onOpenChange={(open) => { if (!open) setShowAlimentacaoModal(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-green-500" />
              Teve alimentação nessa aula?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Confirme se houve lanche nessa aula. Cada aluno presente conta como 1 lanche.
          </p>
          <div className="flex gap-3 mt-2">
            <Button
              className="flex-1 bg-green-500 hover:bg-green-600"
              disabled={saveChamadaMutation.isPending}
              onClick={() => { setShowAlimentacaoModal(false); saveChamadaMutation.mutate({ teveAlimentacao: true }); }}
            >
              ✓ Sim, teve lanche
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              disabled={saveChamadaMutation.isPending}
              onClick={() => { setShowAlimentacaoModal(false); saveChamadaMutation.mutate({ teveAlimentacao: false }); }}
            >
              Não teve
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
