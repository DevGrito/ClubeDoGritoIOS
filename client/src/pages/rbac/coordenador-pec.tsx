import React, { useState, useEffect } from "react";
import { formatCPF } from "@/lib/utils";
import FrequenciaTurmas from "@/components/FrequenciaTurmas";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import type { Project, Activity as PECActivity, ActivityInstance, User as UserType } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Users, 
  BookOpen, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut,
  Trophy,
  Clock,
  Target,
  Activity,
  Music,
  Award,
  Download,
  Plus,
  Search,
  User,
  Edit,
  Eye,
  Trash2,
  X,
  Lock,
  ExternalLink,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  UserX,
  Camera,
  Pencil,
  Upload,
  Phone,
  MapPin,
  Heart,
  Shirt,
  GraduationCap,
  Briefcase,
  UploadCloud,
  FileSpreadsheet,
  UserPlus,
  XCircle,
  Zap,
  Wifi,
  WifiOff,
  ScanFace,
  Hand,
  Utensils,
  AlertCircle,
  User,
  TrendingUp,
  FileDown,
} from "lucide-react";
import { InstanceForm, ActivityForm } from "@/components/pec/forms";
import { TurmaDetailModal } from "@/components/pec/TurmaDetailModal";
import { ComprehensiveStudentForm } from "@/components/comprehensive-student-form";
import { ParticipanteDetalhesModal, type DetalhesSection } from "@/components/ParticipanteDetalhesModal";
import AlterarSenha from "@/components/AlterarSenha";
import CoordenadorDashboard from "@/components/CoordenadorDashboard";
import GerenciarProfessores from "@/components/GerenciarProfessores";
import { baixarListaAlunos } from "@/lib/pdfUtils";
import VincularProfessoresTurma from "@/components/VincularProfessoresTurma";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function CoordenadorPECPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('dashboard');
  const lower = (v: any) => String(v ?? "").toLowerCase();
  
  // Estados para modais
  const [showNovaTurmaModal, setShowNovaTurmaModal] = useState(false);
  const [showNovaOficinaModal, setShowNovaOficinaModal] = useState(false);
  const [showAdicionarAlunoModal, setShowAdicionarAlunoModal] = useState(false);
  const [dashFiltroAno, setDashFiltroAno] = useState(new Date().getFullYear());
  const [dashFiltroMes, setDashFiltroMes] = useState(0);
  const [editStudentCpf, setEditStudentCpf] = useState<string | undefined>(undefined);
  const [showNovaAvaliacaoModal, setShowNovaAvaliacaoModal] = useState(false);
  const [showNovoPlanoModal, setShowNovoPlanoModal] = useState(false);
  const [showNovaApresentacaoModal, setShowNovaApresentacaoModal] = useState(false);
  const [showNovoProjetoModal, setShowNovoProjetoModal] = useState(false);
  const [showEditarProjetoModal, setShowEditarProjetoModal] = useState(false);
  const [showDetalhesProjetoModal, setShowDetalhesProjetoModal] = useState(false);
  const [showExcluirProjetoModal, setShowExcluirProjetoModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  
  // Estados para modais de oficinas
  const [showVisualizarOficinaModal, setShowVisualizarOficinaModal] = useState(false);
  const [showEditarOficinaModal, setShowEditarOficinaModal] = useState(false);
  const [showExcluirOficinaModal, setShowExcluirOficinaModal] = useState(false);
  const [forceDeletarTurmas, setForceDeletarTurmas] = useState(false);
  const [showAlimentacaoModal, setShowAlimentacaoModal] = useState(false);
  const [editingTeveAlimentacao, setEditingTeveAlimentacao] = useState<boolean | null>(null);
  const [showJustificativaFaltaModal, setShowJustificativaFaltaModal] = useState(false);
  const [modalJustFaltaItems, setModalJustFaltaItems] = useState<{cpf: string; nome: string; motivo: string; obs: string; contaComoPresenca: boolean}[]>([]);
  const MOTIVOS_FALTA_PEC = [
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
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  
  // Estados para turmas
  const [showVisualizarTurmaModal, setShowVisualizarTurmaModal] = useState(false);
  const [showEditarTurmaModal, setShowEditarTurmaModal] = useState(false);
  const [showExcluirTurmaModal, setShowExcluirTurmaModal] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<any>(null);
  const [filtroStatusTurma, setFiltroStatusTurma] = useState<string>('todos');
  const [buscaTurma, setBuscaTurma] = useState('');
  const [showVincularProfessoresModal, setShowVincularProfessoresModal] = useState(false);
  // Modais de planos e relatórios de aulas
  const [showPlanosAulaPecModal, setShowPlanosAulaPecModal] = useState(false);
  const [showRelatoriosAulaPecModal, setShowRelatoriosAulaPecModal] = useState(false);
  const [planoAulaPecDetalhes, setPlanoAulaPecDetalhes] = useState<any>(null);
  const [relatorioAulaPecDetalhes, setRelatorioAulaPecDetalhes] = useState<any>(null);
  const [filtroProfPec, setFiltroProfPec] = useState("");
  const [turmaParaVincular, setTurmaParaVincular] = useState<any>(null);
  
  // Estados para alunos
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [fullStudentData, setFullStudentData] = useState<any>(null);
  const [loadingStudentDetails, setLoadingStudentDetails] = useState(false);
  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false);
  const [studentDocumentos, setStudentDocumentos] = useState<any[]>([]);
  const [studentResponsaveis, setStudentResponsaveis] = useState<any[]>([]);
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);
  const [uploadingDocumento, setUploadingDocumento] = useState(false);
  const [viewingDocumento, setViewingDocumento] = useState<any>(null);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [showInativarConfirmModal, setShowInativarConfirmModal] = useState(false);
  const [statusFilterAlunos, setStatusFilterAlunos] = useState<string>('ativos');
  const [searchTermAlunos, setSearchTermAlunos] = useState<string>('');



  // Modal import
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  // Resultado do preview
  const [previewData, setPreviewData] = useState<{
    totalRows: number;
    validCount: number;
    invalidCount: number;
    validRows: any[];
    invalidRows: any[];
  } | null>(null);

  // Seleção do que vai importar (por default: tudo válido)
  const [selectedValidIndexes, setSelectedValidIndexes] = useState<number[]>([]);

  const handleOpenImport = () => {
  setShowImportModal(true);
  setImportFile(null);
  setPreviewData(null);
  setSelectedValidIndexes([]);
};

const handleRunPreview = async () => {
  if (!importFile) {
    toast({ title: "Selecione uma planilha", description: "Envie um arquivo .xlsx ou .csv.", variant: "destructive" });
    return;
  }

  setImportLoading(true);
  try {
    const formData = new FormData();
    formData.append("file", importFile);

    const resp = await fetch("/api/pec/import/alunos/preview", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    const json = await resp.json();
    if (!resp.ok) {
      throw new Error(json?.error || "Falha ao ler a planilha.");
    }

    // Esperado do backend (Opção A):
    // { totalRows, validRows: [{rowNumber, payload, warnings?}], invalidRows: [{rowNumber, errors}] }
    // Backend retorna: { summary: { total, valid, invalid }, results: [{ ok, rowNumber, errors, payload... }] }
    const results = Array.isArray(json?.results) ? json.results : [];

    const validRows = results.filter((r: any) => r.ok);
    const invalidRows = results.filter((r: any) => !r.ok);

    const totalRows = json?.summary?.total ?? results.length;

    setPreviewData({
      totalRows,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      validRows,
      invalidRows,
    });

    // Seleciona tudo que é válido
    setSelectedValidIndexes(validRows.map((_: any, idx: number) => idx));

    setPreviewData({
      totalRows,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      validRows,
      invalidRows,
    });

    // Seleciona tudo que é válido
    setSelectedValidIndexes(validRows.map((_: any, idx: number) => idx));

    toast({
      title: "Planilha lida com sucesso",
      description: `${validRows.length} linhas válidas, ${invalidRows.length} inválidas.`,
    });
  } catch (err: any) {
    console.error(err);
    toast({ title: "Erro no preview", description: err.message || "Erro ao processar arquivo.", variant: "destructive" });
  } finally {
    setImportLoading(false);
  }
};

const handleCommitImport = async () => {
  if (!previewData) {
    toast({ title: "Faça o preview primeiro", description: "Envie a planilha e rode o preview.", variant: "destructive" });
    return;
  }

  const rowsToImport = selectedValidIndexes.map((i) => previewData.validRows[i]).filter(Boolean);

  if (rowsToImport.length === 0) {
    toast({ title: "Nenhuma linha selecionada", description: "Selecione pelo menos 1 aluno válido.", variant: "destructive" });
    return;
  }

  setImportLoading(true);
  try {
    const resp = await fetch("/api/pec/import/alunos/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ rows: rowsToImport }),
    });

    const json = await resp.json();
    if (!resp.ok) {
      throw new Error(json?.error || "Falha ao importar alunos.");
    }

    // Esperado:
    // { insertedCount, skippedCount, errorsCount, skipped?, errors? }
        toast({
        title: "Importação concluída",
        description: `Inseridos: ${json?.summary?.inserted ?? 0} | Pulados: ${json?.summary?.skipped ?? 0} | Erros: ${json?.summary?.failed ?? 0}`,
      });

      // Recarrega lista de alunos PEC (você usa queryKey como string em useQuery)
     queryClient.invalidateQueries({ queryKey: ['/api/students/all', 'todos'] });

    // Fecha modal e limpa estados
    setShowImportModal(false);
    setImportFile(null);
    setPreviewData(null);
    setSelectedValidIndexes([]);
  } catch (err: any) {
    console.error(err);
    toast({ title: "Erro na importação", description: err.message || "Erro ao importar.", variant: "destructive" });
  } finally {
    setImportLoading(false);
  }
};

  
  // Estado para alterar senha
  const [showAlterarSenhaModal, setShowAlterarSenhaModal] = useState(false);
  
  // Estados para chamadas
  const [showNovaChamadaForm, setShowNovaChamadaForm] = useState(true);
  const [chamadaTurmaId, setChamadaTurmaId] = useState('');
  const [chamadaData, setChamadaData] = useState(new Date().toISOString().split('T')[0]);
  const [presencasChamada, setPresencasChamada] = useState<{alunoId: number; alunoNome: string; alunoCpf: string; presente: boolean; justificativa?: string; justificativaObs?: string; viaCatraca?: boolean; horaEntrada?: string}[]>([]);
  const [expandedChamadaId, setExpandedChamadaId] = useState<number | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [existingFotoUrl, setExistingFotoUrl] = useState<string | null>(null);
  const [editingChamadaId, setEditingChamadaId] = useState<number | null>(null);
  const pendingEditAttendanceRef = React.useRef<any[] | null>(null);
  const [historicoFiltroTurma, setHistoricoFiltroTurma] = useState('');
  const [historicoFiltroDataInicio, setHistoricoFiltroDataInicio] = useState('');
  const [historicoFiltroDataFim, setHistoricoFiltroDataFim] = useState('');
  const [modoManual, setModoManual] = useState(false);
  const [showModoManualDialog, setShowModoManualDialog] = useState(false);
  const [motivoManualSelect, setMotivoManualSelect] = useState('');
  const [descManual, setDescManual] = useState('');
  const [savingMotivoManual, setSavingMotivoManual] = useState(false);
  const [pinManual, setPinManual] = useState('');
  const [pinError, setPinError] = useState('');
  const [catracaApplied, setCatracaApplied] = useState(false);
  const [catracaConnected, setCatracaConnected] = useState(false);
  
  // State do formulário de projetos
  const [projetoForm, setProjetoForm] = useState({
    name: '',
    description: '',
    period_start: '',
    period_end: '',
    status: 'ativo',
    tempoIndeterminado: false
  });
  
  // Filtro de status para projetos
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  
  // Filtro de projeto para oficinas
  const [projetoFilterOficinas, setProjetoFilterOficinas] = useState<string>('todos');
  
  // Coordenador sempre exibe "Coordenador" (não pega do localStorage)
  const coordenadorId =
  localStorage.getItem("coordenadorId") ||
  localStorage.getItem("userId"); // fallback antigo

  const userPapel = localStorage.getItem("userPapel");
  const actorType = localStorage.getItem("actorType");

  const isCoordinator =
    actorType === "coordenador" || (userPapel || "").startsWith("coordenador");

  // Estados para perfil editável
  const [perfilData, setPerfilData] = useState({
    nome: "Coordenador",
    email: "",
    telefone: ""
  });
  const [loadingPerfil, setLoadingPerfil] = useState(false);

  // Buscar dados do coordenador
  const { data: coordData } = useQuery({
    queryKey: ['/api/coordenador/me'],
  });


  // Atualizar estados quando dados forem carregados
  useEffect(() => {
    if (coordData?.data) {
      setPerfilData({
        nome: coordData.data.nome || "Coordenador",
        email: coordData.data.email || "",
        telefone: coordData.data.telefone || ""
      });
    }
  }, [coordData]);

  // Mutation para salvar perfil
  const salvarPerfilMutation = useMutation({
    mutationFn: async (data: { nome: string; email: string; telefone: string }) => {
      return await apiRequest('/api/coordenador/me', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (response) => {
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso",
      });
      // Atualizar cache
      queryClient.invalidateQueries({ queryKey: ['/api/coordenador/me'] });
      // Atualizar localStorage se o nome foi alterado
      if (response.data) {
        localStorage.setItem("userName", response.data.nome);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message || "Não foi possível atualizar o perfil. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const handleSalvarPerfil = () => {
    if (!perfilData.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive",
      });
      return;
    }
    if (!perfilData.email.trim()) {
      toast({
        title: "Erro",
        description: "Email é obrigatório",
        variant: "destructive",
      });
      return;
    }
    salvarPerfilMutation.mutate(perfilData);
  };

  // Função para mudar seção e fazer scroll
  const changeSection = (section: string) => {
    setActiveSection(section);
    requestAnimationFrame(() => {
      setTimeout(() => {
        const el = document.getElementById('coordenador-content-area');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    });
  };

  // Handlers para os botões
  const handleNovaTurma = () => {
    setShowNovaTurmaModal(true);
  };

  const handleChamadaManual = () => {
    setShowNovaChamadaForm(true);
    setChamadaTurmaId('');
    setPresencasChamada([]);
    setFotoFile(null);
    setEditingChamadaId(null);
    setChamadaData(new Date().toISOString().split('T')[0]);
  };

  const handleChamadaIntebras = () => {
    toast({
      title: "Integração Intebras",
      description: "Funcionalidade em desenvolvimento."
    });
  };

  const handleNovaOficina = () => {
    setShowNovaOficinaModal(true);
  };

  const handleAdicionarAluno = () => {
    setEditStudentCpf(undefined);
    setShowAdicionarAlunoModal(true);
  };

  const handleNovaAvaliacao = () => {
    setShowNovaAvaliacaoModal(true);
  };

  const handleNovoPlano = () => {
    setShowNovoPlanoModal(true);
  };

  const handleNovaApresentacao = () => {
    setShowNovaApresentacaoModal(true);
  };

  const handleNovoProjeto = () => {
    setShowNovoProjetoModal(true);
  };

  const handleVerDetalhes = (projeto: any) => {
    setSelectedProject(projeto);
    setShowDetalhesProjetoModal(true);
  };

  const handleEditarProjeto = (projeto: any) => {
    setSelectedProject(projeto);
    setProjetoForm({
      name: projeto.name || '',
      description: projeto.description || '',
      period_start: projeto.period_start || '',
      period_end: projeto.period_end || '',
      status: projeto.status || 'ativo',
      tempoIndeterminado: projeto.period_end === null
    });
    setShowEditarProjetoModal(true);
  };

  const handleExcluirProjeto = (projeto: any) => {
    setSelectedProject(projeto);
    setShowExcluirProjetoModal(true);
  };

  // Handlers para oficinas
  const handleVisualizarOficina = (activity: any) => {
    setSelectedActivity(activity);
    setShowVisualizarOficinaModal(true);
  };

  const handleEditarOficina = (activity: any) => {
    setSelectedActivity(activity);
    setShowEditarOficinaModal(true);
  };

  const handleExcluirOficina = (activity: any) => {
    setSelectedActivity(activity);
    setForceDeletarTurmas(false);
    setShowExcluirOficinaModal(true);
  };

  // Handlers de turmas
  const handleViewTurma = (instance: any) => {
    setSelectedInstance(instance);
    setShowVisualizarTurmaModal(true);
  };

    const handleEditTurma = (instance: any) => {
      const normalized = {
        ...instance,
        // garante compatibilidade com formulários antigos que usam "name"
        name: String(instance?.name ?? instance?.title ?? ""),
        // garante title sempre string também
        title: String(instance?.title ?? instance?.name ?? ""),
        location: String(instance?.location ?? ""),
      };

      setSelectedInstance(normalized);
      setShowEditarTurmaModal(true);
    };

  const handleDeleteTurma = (instance: any) => {
    setSelectedInstance(instance);
    setShowExcluirTurmaModal(true);
  };

  // Mutation para criar projeto
  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        name: data.name,
        description: data.description || null,
        period_start: data.period_start || null,
        period_end: data.tempoIndeterminado ? null : (data.period_end || null),
        status: data.status || 'ativo'
      };
      return apiRequest('/api/projects', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: "Sucesso!", description: "Projeto criado com sucesso!" });
      setShowNovoProjetoModal(false);
      setProjetoForm({ name: '', description: '', period_start: '', period_end: '', status: 'ativo', tempoIndeterminado: false });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar projeto", description: error.message || "Não foi possível criar o projeto. Tente novamente.", variant: "destructive" });
    }
  });

  // Mutation para atualizar projeto
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const payload = {
        name: data.name,
        description: data.description || null,
        period_start: data.period_start || null,
        period_end: data.tempoIndeterminado ? null : (data.period_end || null),
        status: data.status || 'ativo'
      };
      return apiRequest(`/api/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: "Sucesso!", description: "Projeto atualizado com sucesso!" });
      setShowEditarProjetoModal(false);
      setSelectedProject(null);
      setProjetoForm({ name: '', description: '', period_start: '', period_end: '', status: 'ativo', tempoIndeterminado: false });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar projeto", description: error.message || "Não foi possível atualizar o projeto. Tente novamente.", variant: "destructive" });
    }
  });

  // Mutation para excluir projeto
  const excluirProjetoMutation = useMutation({
    mutationFn: async (projectId: number) => {
      return await apiRequest(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Projeto excluído",
        description: `O projeto "${selectedProject?.name}" foi excluído com sucesso.`,
      });
      setShowExcluirProjetoModal(false);
      setSelectedProject(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir projeto",
        description: error?.message || "Não foi possível excluir o projeto. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const confirmarExclusao = () => {
    if (selectedProject?.id) {
      excluirProjetoMutation.mutate(selectedProject.id);
    }
  };

  // Mutation para excluir oficina
  const excluirOficinaMutation = useMutation({
    mutationFn: async ({ activityId, force }: { activityId: number; force: boolean }) => {
      return await apiRequest(`/api/pec/activities/${activityId}${force ? '?force=true' : ''}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pec/activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pec/instances'] });
      toast({
        title: "Oficina excluída",
        description: `A oficina "${selectedActivity?.name}" foi excluída com sucesso.`,
      });
      setShowExcluirOficinaModal(false);
      setSelectedActivity(null);
      setForceDeletarTurmas(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir oficina",
        description: error?.message || "Não foi possível excluir a oficina. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const confirmarExclusaoOficina = () => {
    if (selectedActivity?.id) {
      excluirOficinaMutation.mutate({ activityId: selectedActivity.id, force: forceDeletarTurmas });
    }
  };
  
  // Mutation para excluir turma
  const deleteInstanceMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/pec/instances/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pec/instances'] });
      setShowExcluirTurmaModal(false);
      toast({ title: 'Turma inativada', description: 'Turma inativada com sucesso. Acesse o filtro "Inativas" para reativá-la.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao inativar turma', description: error.message || 'Não foi possível inativar a turma.', variant: 'destructive' });
    },
  });

  const reativarInstanceMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/pec/instances/${id}/reativar`, { method: 'PATCH' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pec/instances'] });
      toast({ title: 'Turma reativada', description: 'Turma reativada com sucesso!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao reativar turma', description: error.message || 'Não foi possível reativar a turma.', variant: 'destructive' });
    },
  });
  
  // Query para buscar dados do dashboard do coordenador
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: [`/api/coordenador/dashboard/${coordenadorId}?area=pec`],
    enabled: !!coordenadorId && isCoordinator,
  });

  // Query para buscar projetos do PEC (usando fetcher padrão)
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    
  });

  // Query para buscar atividades do PEC (usando fetcher padrão)
  const { data: activities = [] } = useQuery<PECActivity[]>({
    queryKey: ['/api/pec/activities'],
    
  });

  // Queries para planos de aula e aulas registradas (visão coordenador PEC)
  const { data: planosAulaPec = [], isLoading: loadingPlanosPec } = useQuery({
    queryKey: ['/api/coordenador/pec/planos-aula'],
    queryFn: async () => {
      const r = await fetch('/api/coordenador/pec/planos-aula', { credentials: 'include' });
      if (!r.ok) throw new Error('Falha ao carregar planos de aula');
      return r.json();
    },
    enabled: showPlanosAulaPecModal,
  });

  const { data: aulasRegistradasPec = [], isLoading: loadingRelatoriosPec } = useQuery({
    queryKey: ['/api/coordenador/pec/aulas-registradas'],
    queryFn: async () => {
      const r = await fetch('/api/coordenador/pec/aulas-registradas', { credentials: 'include' });
      if (!r.ok) throw new Error('Falha ao carregar relatórios de aulas');
      return r.json();
    },
    enabled: showRelatoriosAulaPecModal,
  });

  // Filtrar projetos baseado no status selecionado
  const projetosFiltrados = projects.filter((projeto: any) => {
    if (statusFilter === 'todos') return true;
    return projeto.status === statusFilter;
  });

  // Filtrar oficinas baseado no projeto selecionado
  const oficinasFiltradas = activities.filter((activity: any) => {
    if (projetoFilterOficinas === 'todos') return true;
    return activity.project_id?.toString() === projetoFilterOficinas;
  });

  // Query para buscar turmas/instâncias do PEC (usando fetcher padrão)
  const { data: instances = [] } = useQuery<ActivityInstance[]>({
    queryKey: ['/api/pec/instances'],
    
  });

  // Query para buscar chamadas (sessions) do PEC - mesma tabela que Monitor/Professor PEC
  const { data: chamadasPEC = [] } = useQuery<any[]>({
    queryKey: ['/api/pec/sessions'],
    queryFn: async () => {
      const response = await fetch('/api/pec/sessions', {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: activeSection === 'chamadas',
    
  });

  // Query para buscar dados de usuários
  const { data: usersData = [] } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
    
  });
  
  // Query para buscar alunos da turma selecionada para chamada
  const { data: alunosChamadaTurma = [], isLoading: loadingAlunosChamada } = useQuery<any[]>({
    queryKey: ['/api/pec/turma-alunos', chamadaTurmaId],
    queryFn: async () => {
      if (!chamadaTurmaId) return [];
     const response = await fetch(`/api/pec/turma-alunos/${chamadaTurmaId}`, {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!chamadaTurmaId && showNovaChamadaForm
  });

  React.useEffect(() => {
    if (editingChamadaId || !chamadaTurmaId) return;
    const DAY_MAP: Record<string, number> = { 'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6, 'Domingo': 0 };
    const selectedTurma = instances.find((t: any) => t.id.toString() === chamadaTurmaId);
    const diasSemana = selectedTurma?.dias_semana || selectedTurma?.days_of_week || selectedTurma?.diasSemana || [];
    const occStart = selectedTurma?.occurrence_start || selectedTurma?.start_date;
    const occEnd = selectedTurma?.occurrence_end || selectedTurma?.end_date;
    if (diasSemana.length > 0 && occStart && occEnd) {
      const jsDays = diasSemana.map((d: string) => DAY_MAP[d]).filter((d: number | undefined) => d !== undefined);
      const today = new Date().toISOString().split('T')[0];
      const current = new Date(occStart + 'T00:00:00');
      const end = new Date(occEnd + 'T00:00:00');
      let firstValid = '';
      let closestToToday = '';
      while (current <= end) {
        if (jsDays.includes(current.getDay())) {
          const dateStr = current.toISOString().split('T')[0];
          if (!firstValid) firstValid = dateStr;
          if (dateStr <= today) closestToToday = dateStr;
          if (dateStr >= today && !closestToToday) { closestToToday = dateStr; break; }
        }
        current.setDate(current.getDate() + 1);
      }
      setChamadaData(closestToToday || firstValid || today);
    }
  }, [chamadaTurmaId, instances, editingChamadaId]);

  const { data: catracaLog, refetch: refetchCatracaLog } = useQuery<{ data: string; entradas: any[]; total: number }>({
    queryKey: ['/api/webhook/presenca-log'],
    enabled: activeSection === 'chamadas',
    refetchInterval: 30000,
  });

  const { data: pecSessionExistente } = useQuery<any>({
    queryKey: ['/api/pec/session-by-date', chamadaTurmaId, chamadaData],
    queryFn: async () => {
      const res = await fetch(`/api/pec/sessions?activity_instance_id=${chamadaTurmaId}&date=${chamadaData}`, { credentials: 'include' });
      if (!res.ok) return null;
      const sessions = await res.json();
      if (Array.isArray(sessions)) {
        return sessions.find((s: any) => String(s.activity_instance_id) === String(chamadaTurmaId) && String(s.date).slice(0, 10) === chamadaData) || null;
      }
      return null;
    },
    enabled: !!chamadaTurmaId && !!chamadaData && activeSection === 'chamadas' && !editingChamadaId,
  });

  React.useEffect(() => {
    if (activeSection !== 'chamadas') return;
    const es = new EventSource("/api/webhook/presenca-events");
    es.onopen = () => setCatracaConnected(true);
    es.onerror = () => setCatracaConnected(false);
    es.onmessage = (event) => {
      if (event.data === "connected") { setCatracaConnected(true); return; }
      try {
        const data = JSON.parse(event.data);
        if (data.tipo === "presenca" && data.vertente === "pec") {
          refetchCatracaLog();
          queryClient.invalidateQueries({ queryKey: ['/api/pec/session-by-date', chamadaTurmaId, chamadaData] });
          setCatracaApplied(false);
        }
      } catch (_) {}
    };
    return () => { es.close(); setCatracaConnected(false); };
  }, [activeSection, chamadaTurmaId, chamadaData]);

  // Atualizar presenças quando alunos da turma são carregados
  React.useEffect(() => {
    if (alunosChamadaTurma.length === 0) return;

    // Modo EDIÇÃO: mesclar alunos matriculados com attendance salvo
    if (editingChamadaId && pendingEditAttendanceRef.current !== null) {
      const savedAttendance = pendingEditAttendanceRef.current;
      const savedMap = new Map(savedAttendance.map((a: any) => [a.alunoCpf, a]));
      const selectedTurmaData = instances.find((t: any) => t.id.toString() === chamadaTurmaId);
      setModoManual(false); // Sempre inicia em modo facial
      const merged = alunosChamadaTurma.map((aluno: any) => {
        const saved = savedMap.get(aluno.cpf);
        return {
          alunoId: aluno.id || aluno.cpf,
          alunoNome: getNomeAluno(aluno),
          alunoCpf: aluno.cpf,
          presente: saved ? (saved.presente === true || saved.status === 'presente') : false,
          justificativa: saved?.justificativa || '',
          viaCatraca: saved?.origemCatraca || false,
          horaEntrada: saved?.horaEntrada || undefined,
        };
      });
      setPresencasChamada(merged);
      pendingEditAttendanceRef.current = null;
      return;
    }

    // Modo NOVA CHAMADA: inicializar todos como ausentes
    if (!editingChamadaId) {
      setCatracaApplied(false);
      const selectedTurmaData = instances.find((t: any) => t.id.toString() === chamadaTurmaId);
      setModoManual(false); // Sempre inicia em modo facial
      setPresencasChamada(alunosChamadaTurma.map((aluno: any) => ({
        alunoId: aluno.id || aluno.cpf,
        alunoNome: getNomeAluno(aluno),
        alunoCpf: aluno.cpf,
        presente: false,
        justificativa: ''
      })));
    }
  }, [alunosChamadaTurma, editingChamadaId]);

  React.useEffect(() => {
    if (editingChamadaId) return;
    if (!pecSessionExistente?.attendance) return;
    if (presencasChamada.length === 0) return;
    const attendance = pecSessionExistente.attendance as any[];
    const catracaEntries = attendance.filter((a: any) => a.origemCatraca === true && a.presente === true);
    if (catracaEntries.length === 0) return;
    if (catracaApplied) return;

    const catracaCpfMap = new Map(catracaEntries.map((a: any) => [a.alunoCpf, a]));
    const updated = presencasChamada.map(p => {
      const entry = catracaCpfMap.get(p.alunoCpf);
      if (entry) {
        return { ...p, presente: true, viaCatraca: true, horaEntrada: entry.horaEntrada };
      }
      return p;
    });
    setCatracaApplied(true);
    setPresencasChamada(updated);
  }, [pecSessionExistente, presencasChamada.length, editingChamadaId, catracaApplied]);

  // Mutation para salvar chamada
  const salvarChamadaMutation = useMutation({
    mutationFn: async (vars?: { teveAlimentacao?: boolean | null }) => {
      if (!fotoFile && !editingChamadaId) {
        throw new Error("É obrigatório enviar a foto comprovante para finalizar a chamada.");
      }
      const turma = instances.find((i: any) => i.id.toString() === chamadaTurmaId);
      const url = editingChamadaId 
        ? `/api/pec/sessions/${editingChamadaId}/editar`
        : '/api/pec/sessions';
      const method = editingChamadaId ? 'PUT' : 'POST';
      const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: "include",
      body: JSON.stringify({
          activity_instance_id: parseInt(chamadaTurmaId),
          date: chamadaData,
          hours: '2.00',
          title: `Chamada - ${turma?.name || 'Turma'}`,
          status: 'realizado',
          teve_alimentacao: vars?.teveAlimentacao ?? null,
          attendance: presencasChamada.map(p => ({
            alunoNome: p.alunoNome,
            alunoCpf: p.alunoCpf,
            presente: p.presente,
            justificativa: !modoManual && !p.presente ? (p.justificativa || 'Sem justificativa') : (p.justificativa || ''),
            status: !p.presente && p.justificativa && p.justificativa !== 'Sem justificativa' ? 'falta_justificada' : (p.presente ? 'presente' : 'falta'),
            origemCatraca: p.viaCatraca || false,
            horaEntrada: p.horaEntrada || null,
          }))
        })
      });
      if (!response.ok) throw new Error(editingChamadaId ? 'Erro ao atualizar chamada' : 'Erro ao salvar chamada');
      const result = await response.json();

      if (fotoFile) {
        try {
          const formData = new FormData();
          formData.append('foto', fotoFile);
          formData.append('sessionId', String(result?.id || editingChamadaId || ''));
          await fetch('/api/pec/sessions/foto', {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });
        } catch (err) {
          console.error('Erro ao enviar foto comprovante:', err);
        }
      }

      return result;
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: editingChamadaId ? 'Chamada atualizada com sucesso!' : 'Chamada registrada com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/pec/sessions'] });
      setShowNovaChamadaForm(false);
      setChamadaTurmaId('');
      setPresencasChamada([]);
      setFotoFile(null);
      setExistingFotoUrl(null);
      setEditingChamadaId(null);
      setEditingTeveAlimentacao(null);
    },
    onError: (error: any) => {
      toast({ title: editingChamadaId ? 'Erro ao atualizar chamada' : 'Erro ao salvar chamada', description: error.message || 'Não foi possível salvar a chamada. Tente novamente.', variant: 'destructive' });
    }
  });

  // Query para buscar alunos da tabela aluno (todos os status para filtro funcionar no cliente)
  const { data: alunosData = [] } = useQuery<any[]>({
    queryKey: ['/api/students/all', 'todos'],
    queryFn: async () => {
      const res = await fetch('/api/students/all?status=todos', { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao carregar alunos');
      return res.json();
    },
  });

  const { data: turmasAtivasPec } = useQuery<{ totalAtivas: number; porProjeto: Array<{ projeto: string; total: number }> }>({
    queryKey: ['/api/gestao-vista/turmas-ativas-pec'],
    queryFn: () => fetch('/api/gestao-vista/turmas-ativas-pec').then(r => r.json()),
    refetchInterval: 120000,
  });

  const { data: dashboardDemografico, isLoading: loadingDemografico } = useQuery<any>({
    queryKey: ['/api/coordenador/dashboard-demografico', dashFiltroAno, dashFiltroMes],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dashFiltroAno) params.set('ano', String(dashFiltroAno));
      if (dashFiltroMes) params.set('mes', String(dashFiltroMes));
      const qs = params.toString();
      const url = '/api/coordenador/dashboard-demografico' + (qs ? `?${qs}` : '');
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error('Falha ao carregar dados demográficos');
      return response.json();
    },
  });

  const getNomeAluno = (aluno: any) => {
    const nome =
      aluno?.nome_completo ??
      aluno?.nomeCompleto ??
      aluno?.nome ??
      aluno?.name ??
      "";

    return String(nome).trim();
  };

  const students = alunosData.map((aluno: any) => ({
    id: aluno.id ?? aluno.cpf, // se existir id numérico, melhor; senão cpf
    nome: getNomeAluno(aluno),
    sobrenome: aluno?.sobrenome ? String(aluno.sobrenome).trim() : "",
    telefone: aluno?.telefone ? String(aluno.telefone) : "",
    email: aluno?.email ? String(aluno.email).trim() : "",
    role: "aluno",
    foto_perfil: aluno?.foto_perfil ?? null,
    cpf: aluno?.cpf ?? "",
    data_nascimento: aluno?.data_nascimento ?? null,
    genero: aluno?.genero ?? null,
    situacao_atendimento: aluno?.situacao_atendimento ?? "ativo",
  }));

  const handleLogout = () => {
    // remove só o que é do coordenador
    localStorage.removeItem("coordenadorId");
    localStorage.removeItem("coordenadorNome");
    localStorage.removeItem("coordenadorEmail");
    localStorage.removeItem("userPapel");
    localStorage.removeItem("actorType");
    sessionStorage.removeItem("coordenador_auth");
    sessionStorage.removeItem("coordenador_data");

    toast({ title: "Logout realizado", description: "Você foi desconectado com sucesso." });
    setTimeout(() => (window.location.href = "/login/coordenador"), 500);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando coordenação de esporte e cultura...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900" data-testid="coordenador-pec-page">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 px-4 py-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white" data-testid="text-welcome">
                Coordenação Esporte e Cultura
              </h1>
              <p className="text-slate-400" data-testid="text-username">Olá {perfilData.nome}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenImport}
              data-testid="button-import"
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
            >
            <UploadCloud className="w-4 h-4 mr-2" />
              Importar
            </Button>
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
        <CoordenadorDashboard
          data={dashboardDemografico}
          isLoading={loadingDemografico}
          filtroAno={dashFiltroAno}
          filtroMes={dashFiltroMes}
          onFilterChange={(ano, mes) => {
            setDashFiltroAno(ano);
            setDashFiltroMes(mes);
          }}
          tipo="pec"
          turmasAtivasPec={turmasAtivasPec}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Gestão de Alunos */}
          <Card data-testid="card-atletas">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-blue-500" />
                Gestão de Alunos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Gerencie alunos, acompanhe desempenho e organize equipes esportivas.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  className="w-full" 
                  variant={activeSection === 'projetos' ? 'default' : 'outline'}
                  data-testid="button-projetos"
                  onClick={() => changeSection('projetos')}
                  size="sm"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Projetos
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'turmas' ? 'default' : 'outline'}
                  data-testid="button-turmas"
                  onClick={() => changeSection('turmas')}
                  size="sm"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Turmas
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'atletas' ? 'default' : 'outline'}
                  data-testid="button-atletas"
                  onClick={() => changeSection('atletas')}
                  size="sm"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Alunos
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'avaliacoes' ? 'default' : 'outline'}
                  data-testid="button-avaliacoes"
                  onClick={() => changeSection('avaliacoes')}
                  size="sm"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Avaliações Físicas
                </Button>
                <Button 
                  className="w-full col-span-2" 
                  variant={activeSection === 'chamadas' ? 'default' : 'outline'}
                  data-testid="button-chamadas"
                  onClick={() => changeSection('chamadas')}
                  size="sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Chamadas
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Modalidades Esportivas */}
          <Card data-testid="card-modalidades">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="w-5 h-5 text-purple-500" />
                Modalidades Esportivas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Coordene diferentes modalidades esportivas e organize treinamentos.
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  variant={activeSection === 'modalidades' ? 'default' : 'outline'}
                  data-testid="button-modalidades"
                  onClick={() => changeSection('modalidades')}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Modalidades
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'treinamentos' ? 'default' : 'outline'}
                  data-testid="button-treinamentos"
                  onClick={() => changeSection('treinamentos')}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Treinamentos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Atividades Culturais */}
          <Card data-testid="card-cultura">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Music className="w-5 h-5 text-pink-500" />
                Atividades Culturais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Organize oficinas culturais, apresentações e festivais artísticos.
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  variant={activeSection === 'oficinas' ? 'default' : 'outline'}
                  data-testid="button-oficinas"
                  onClick={() => changeSection('oficinas')}
                >
                  <Music className="w-4 h-4 mr-2" />
                  Oficinas Culturais
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'apresentacoes' ? 'default' : 'outline'}
                  data-testid="button-apresentacoes"
                  onClick={() => changeSection('apresentacoes')}
                >
                  <Award className="w-4 h-4 mr-2" />
                  Apresentações
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Eventos e Competições */}
          <Card data-testid="card-eventos">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-red-500" />
                Eventos e Competições
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Organize campeonatos, festivais e eventos esportivo-culturais.
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full bg-red-500 hover:bg-red-600 text-white"
                  variant={activeSection === 'eventos' ? 'default' : 'default'}
                  data-testid="button-eventos"
                  onClick={() => changeSection('eventos')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Eventos
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'competicoes' ? 'default' : 'outline'}
                  data-testid="button-competicoes"
                  onClick={() => changeSection('competicoes')}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Competições
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
                Cadastre e gerencie os professores do programa PEC.
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
                  onClick={() => { setFiltroProfPec(""); setShowPlanosAulaPecModal(true); }}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Planos de Aula
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => { setFiltroProfPec(""); setShowRelatoriosAulaPecModal(true); }}
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
                Gere relatórios de performance, participação e impacto das atividades.
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
                  variant={activeSection === 'frequencias' ? 'default' : 'outline'}
                  data-testid="button-frequencias"
                  onClick={() => changeSection('frequencias')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Ver Frequências
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
            Coordenação Esporte e Cultura (PEC) • Sistema RBAC Isolado
          </p>
        </div>

        {/* Área de Conteúdo Dinâmica */}
        <div className="mt-8" id="coordenador-content-area">
          {activeSection === 'dashboard' && (
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Principal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Visualização geral dos indicadores e métricas do Polo Esportivo Cultural.</p>
              </CardContent>
            </Card>
          )}

          {activeSection === 'atletas' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gestão de Alunos</CardTitle>
                <Button size="sm" className="bg-blue-500 hover:bg-blue-600" onClick={handleAdicionarAluno} data-testid="button-adicionar-aluno">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Aluno
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="Buscar alunos..." 
                        className="pl-10" 
                        value={searchTermAlunos}
                        onChange={(e) => setSearchTermAlunos(e.target.value)}
                      />
                    </div>
                    <Select value={statusFilterAlunos} onValueChange={setStatusFilterAlunos}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="ativos">Ativos</SelectItem>
                        <SelectItem value="inativos">Inativos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {students.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum aluno encontrado. Clique em "Adicionar Aluno" para cadastrar.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Foto</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>CPF</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...students]
                          .sort((a: any, b: any) => {
                            const nomeA = (a.nome || '').trim().toLowerCase();
                              const nomeB = (b.nome || '').trim().toLowerCase();
                            return nomeA.localeCompare(nomeB, 'pt-BR');
                          })
                          .filter((student: any) => {
                            const matchesSearch = !searchTermAlunos || 
                              (student.nome || '').toLowerCase().includes(searchTermAlunos.toLowerCase()) ||
                              (student.cpf || '').includes(searchTermAlunos);
                            if (!matchesSearch) return false;
                            if (statusFilterAlunos === 'todos') return true;
                            if (statusFilterAlunos === 'ativos') return student.situacao_atendimento !== 'inativo';
                            if (statusFilterAlunos === 'inativos') return student.situacao_atendimento === 'inativo';
                            return true;
                          })
                          .map((student: any) => (
                          <TableRow key={student.id || student.cpf}>
                            <TableCell>
                              {student.foto_perfil && student.foto_perfil.trim() ? (
                                <img 
                                  src={student.foto_perfil} 
                                  alt={student.nome} 
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                  <User className="w-5 h-5 text-orange-500" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                               {student.nome?.trim() ? student.nome : "Sem nome"}
                            </TableCell>
                            <TableCell>{student.cpf || 'Não informado'}</TableCell>
                            <TableCell>{student.telefone || 'Não informado'}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                 onClick={async () => {
                                    setSelectedStudent(student);
                                    setShowStudentDetailsModal(true);
                                    setLoadingStudentDetails(true);

                                    const cpfAluno = String(student?.cpf || "").replace(/\D/g, ""); // ✅ garante cpf válido e limpo

                                    try {
                                      // 1) Buscar dados completos do aluno
                                        const resAluno = await fetch(`/api/students/${cpfAluno}`, {
                                        credentials: "include",
                                      });
                                     const alunoJson = await resAluno.json();

                                    if (!resAluno.ok) {
                                        toast({
                                          title: "Erro ao carregar aluno",
                                          description: alunoJson?.error || "Falha ao buscar dados do aluno.",
                                          variant: "destructive",
                                        });
                                        setFullStudentData(null);
                                        setStudentDocumentos([]);
                                        return;
                                      }
                                      const alunoData = alunoJson?.data ?? alunoJson;

                                     setFullStudentData(alunoData ?? null);

                                      // 2) Buscar responsáveis do aluno
                                      try {
                                        const resResp = await fetch(`/api/alunos/${cpfAluno}/responsaveis`, { credentials: 'include' });
                                        if (resResp.ok) {
                                          const respData = await resResp.json();
                                          setStudentResponsaveis(Array.isArray(respData) ? respData : []);
                                        } else {
                                          setStudentResponsaveis([]);
                                        }
                                      } catch {
                                        setStudentResponsaveis([]);
                                      }

                                      // 3) Buscar documentos do aluno (✅ usa o cpf certo)
                                    const userId = localStorage.getItem("userId");

                                    const resDocs = await fetch(`/api/documentos/aluno/${cpfAluno}`, {
                                      credentials: "include",
                                      headers: {
                                        "x-user-id": userId || "",
                                      },
                                    });
                                      const docsJson = await resDocs.json();

                                      if (!resDocs.ok) {
                                        setStudentDocumentos([]);
                                        toast({
                                          title: "Erro ao carregar documentos",
                                          description: docsJson?.error || "Falha ao buscar documentos.",
                                          variant: "destructive",
                                        });
                                        return;
                                      }

                                      // ✅ garante que sempre vira array
                                      setStudentDocumentos(Array.isArray(docsJson) ? docsJson : []);
                                    } catch (err) {
                                      console.error("Erro ao buscar dados do aluno:", err);
                                      setStudentDocumentos([]);
                                    } finally {
                                      setLoadingStudentDetails(false);
                                    }
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedStudent(student);
                                    setShowEditStudentModal(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className={student.situacao_atendimento === 'inativo' ? "text-green-500 hover:text-green-700" : "text-orange-500 hover:text-orange-700"}
                                  onClick={() => {
                                    setSelectedStudent(student);
                                    setShowInativarConfirmModal(true);
                                  }}
                                  title={student.situacao_atendimento === 'inativo' ? "Reativar aluno" : "Inativar aluno"}
                                >
                                  {student.situacao_atendimento === 'inativo' ? (
                                    <User className="w-4 h-4" />
                                  ) : (
                                    <UserX className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'professores' && (
            <GerenciarProfessores programa="pec" />
          )}

          {activeSection === 'avaliacoes' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Avaliações Físicas</CardTitle>
                <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={handleNovaAvaliacao}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Avaliação
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="Buscar alunos..." className="pl-10" />
                    </div>
                    <Select>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Tipo de Teste" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
                        <SelectItem value="flexibilidade">Flexibilidade</SelectItem>
                        <SelectItem value="resistencia">Resistência</SelectItem>
                        <SelectItem value="forca">Força</SelectItem>
                        <SelectItem value="velocidade">Velocidade</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <div className="text-gray-400 mb-2">
                      <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium mb-1">Módulo de Avaliações Físicas</p>
                    <p className="text-gray-500 text-sm">
                      Nenhuma avaliação registrada. Clique em "Nova Avaliação" para começar.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'projetos' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gestão de Projetos</CardTitle>
                <Button 
                  size="sm" 
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={handleNovoProjeto}
                  data-testid="button-novo-projeto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Projeto
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="Buscar projetos..." className="pl-10" />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40" data-testid="select-status-filter">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-4">
                    {projetosFiltrados.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        {projects.length === 0 
                          ? 'Nenhum projeto encontrado. Clique em "Novo Projeto" para adicionar.'
                          : `Nenhum projeto ${statusFilter === 'todos' ? '' : statusFilter} encontrado.`
                        }
                      </div>
                    ) : (
                      projetosFiltrados.map((projeto: any) => (
                        <div key={projeto.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold flex items-center gap-2">
                              <Target className="w-4 h-4 text-blue-500" />
                              {projeto.name}
                            </h3>
                            <Badge className={projeto.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {projeto.status === 'ativo' ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{projeto.description || 'Sem descrição'}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {projeto.period_start ? new Date(projeto.period_start).toLocaleDateString('pt-BR') : 'Data não informada'}
                            </span>
                            {projeto.period_end ? (
                              <span className="flex items-center gap-1">
                                até {new Date(projeto.period_end).toLocaleDateString('pt-BR')}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-orange-600 font-medium">
                                Tempo Indeterminado
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => handleVerDetalhes(projeto)}
                              data-testid={`button-ver-detalhes-${projeto.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Detalhes
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditarProjeto(projeto)}
                              data-testid={`button-editar-projeto-${projeto.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'turmas' && (
            <Card>
              <CardHeader className="flex flex-col gap-4">
                <div className="flex flex-row items-center justify-between w-full">
                  <CardTitle>Minhas Turmas</CardTitle>
                  <Button className="bg-green-500 hover:bg-green-600" onClick={handleNovaTurma}>
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
                {instances.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-4">Nenhuma turma encontrada</p>
                    <Button className="bg-green-500 hover:bg-green-600" onClick={handleNovaTurma}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeira Turma
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {instances
                      .filter((instance: any) => {
                        const status = instance.situation || instance.status || 'ativo';
                        if (filtroStatusTurma === 'inativo') return status === 'inativo';
                        if (status === 'inativo') return false;
                        if (status === 'encerrada' && filtroStatusTurma !== 'concluido') return false;
                        const nomeTurma = (instance.title || instance.name || '').toLowerCase();
                        if (buscaTurma && !nomeTurma.includes(buscaTurma.toLowerCase())) return false;
                        if (filtroStatusTurma === "todos") return true;
                        if (filtroStatusTurma === "ativo") return status === 'ativo' || status === 'execucao';
                        if (filtroStatusTurma === "planejado") return status === 'planejamento' || status === 'planejado' || status === 'pendente';
                        if (filtroStatusTurma === "concluido") return status === 'concluido' || status === 'encerrada';
                        return status === filtroStatusTurma;
                      })
                      .map((instance: any) => {
                        const status = instance.situation || instance.status || 'ativo';
                        return (
                          <div key={instance.id} className="border rounded-lg p-4 border-green-200">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold">{instance.title || instance.name}</h3>
                              <Badge className={
                                status === "concluido" || status === "encerrada" ? "bg-blue-100 text-blue-800" :
                                status === "planejamento" || status === "planejado" ? "bg-yellow-100 text-yellow-800" :
                                status === "inativo" ? "bg-gray-100 text-gray-600" :
                                "bg-green-100 text-green-800"
                              }>
                                {status === "concluido" || status === "encerrada" ? "Finalizada" :
                                 status === "planejamento" || status === "planejado" ? "Planejada" :
                                 status === "inativo" ? "Inativa" : "Em Andamento"}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Horário:</span>
                                <p className="font-medium">{instance.start_time && instance.end_time ? `${instance.start_time} - ${instance.end_time}` : (instance.schedule || '- - -')}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Alunos:</span>
                                <p className="font-medium">{instance.alunosCount || 0}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Local:</span>
                                <p className="font-medium">{instance.location || '-'}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-4 flex-wrap">
                              <Button size="sm" variant="outline" onClick={() => handleViewTurma(instance)}>
                                <Eye className="w-4 h-4 mr-1" />
                                Ver
                              </Button>
                              <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-50" onClick={() => {
                                setSelectedInstance(instance);
                                setShowVisualizarTurmaModal(true);
                              }}>
                                <UserPlus className="w-4 h-4 mr-1" />
                                Gerenciar Alunos
                              </Button>
                              <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                onClick={() => baixarListaAlunos(instance.id, instance, true)}>
                                <FileDown className="w-4 h-4 mr-1" />
                                Baixar lista
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-teal-300 text-teal-700 hover:bg-teal-50"
                                onClick={() => {
                                  setTurmaParaVincular(instance);
                                  setShowVincularProfessoresModal(true);
                                }}
                              >
                                <GraduationCap className="w-4 h-4 mr-1" />
                                Professores
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleEditTurma(instance)}>
                                <Edit className="w-4 h-4 mr-1" />
                                Editar
                              </Button>
                              {status === 'inativo' ? (
                                <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50" onClick={() => {
                                  if (confirm(`Deseja reativar a turma "${instance.title || instance.name}"?`)) {
                                    reativarInstanceMutation.mutate(instance.id);
                                  }
                                }}>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Reativar
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" className="text-orange-600 hover:bg-orange-50" onClick={() => {
                                  if (confirm(`Tem certeza que deseja inativar a turma "${instance.title || instance.name}"?`)) {
                                    deleteInstanceMutation.mutate(instance.id);
                                  }
                                }}>
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Inativar
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === 'frequencias' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Frequência por Turma — PEC
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FrequenciaTurmas vertente="pec" coordenadorId={coordenadorId} enabled={activeSection === 'frequencias'} />
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'chamadas' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Chamadas
                  {catracaConnected ? (
                    <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 text-[10px] px-1.5 py-0 ml-1">
                      <Wifi className="w-3 h-3 mr-0.5 inline" />
                      Catraca Online
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-400 border-gray-200 text-[10px] px-1.5 py-0 ml-1">
                      <WifiOff className="w-3 h-3 mr-0.5 inline" />
                      Catraca Offline
                    </Badge>
                  )}
                </CardTitle>
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (showNovaChamadaForm) {
                      setShowNovaChamadaForm(false);
                      setEditingChamadaId(null);
                      setFotoFile(null);
                      setExistingFotoUrl(null);
                    } else {
                      handleChamadaManual();
                    }
                  }}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {showNovaChamadaForm ? 'Ver Histórico' : 'Nova Chamada'}
                </Button>
              </CardHeader>
              <CardContent>
                {showNovaChamadaForm ? (
                  <div className="space-y-4">
                    <div className="flex gap-4 items-end flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium mb-2">Turma</label>
                        <Select value={chamadaTurmaId} onValueChange={setChamadaTurmaId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a turma" />
                          </SelectTrigger>
                          <SelectContent>
                            {instances.map((turma: any) => (
                              <SelectItem key={turma.id} value={turma.id.toString()}>
                                <div className="flex items-center gap-2">
                                  <span>{turma.name || turma.title}</span>
                                  {turma.control_mode === 'intelbras' && (
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
                        {(() => {
                          const DAY_LABEL_TO_JS: Record<string, number> = { 'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6, 'Domingo': 0 };
                          const JS_TO_DAY_LABEL: Record<number, string> = { 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado', 0: 'Domingo' };
                          const selectedTurma = instances.find((t: any) => t.id.toString() === chamadaTurmaId);
                          const diasSemana = selectedTurma?.dias_semana || selectedTurma?.days_of_week || selectedTurma?.diasSemana || [];
                          const occStart = selectedTurma?.occurrence_start || selectedTurma?.start_date;
                          const occEnd = selectedTurma?.occurrence_end || selectedTurma?.end_date;

                          if (chamadaTurmaId && diasSemana.length > 0 && occStart && occEnd) {
                            const jsDays = diasSemana.map((d: string) => DAY_LABEL_TO_JS[d]).filter((d: number | undefined) => d !== undefined);
                            const classDates: { value: string; label: string }[] = [];
                            const current = new Date(occStart + 'T00:00:00');
                            const end = new Date(occEnd + 'T00:00:00');
                            while (current <= end) {
                              if (jsDays.includes(current.getDay())) {
                                const dd = String(current.getDate()).padStart(2, '0');
                                const mm = String(current.getMonth() + 1).padStart(2, '0');
                                const yyyy = current.getFullYear();
                                const dateStr = `${yyyy}-${mm}-${dd}`;
                                const dayName = JS_TO_DAY_LABEL[current.getDay()] || '';
                                classDates.push({ value: dateStr, label: `${dd}/${mm}/${yyyy} - ${dayName}` });
                              }
                              current.setDate(current.getDate() + 1);
                            }

                            return (
                              <Select value={chamadaData} onValueChange={setChamadaData} disabled={!!editingChamadaId}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a data da aula" />
                                </SelectTrigger>
                                <SelectContent>
                                  {classDates.map((d) => (
                                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            );
                          }

                          return (
                            <Input 
                              type="date" 
                              value={chamadaData}
                              onChange={(e) => setChamadaData(e.target.value)}
                              disabled={!!editingChamadaId}
                            />
                          );
                        })()}
                      </div>
                      {chamadaTurmaId && (
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
                      <div 
                        className="relative"
                        onClick={() => {}}
                      >
                        <Button 
                          className="bg-green-500 hover:bg-green-600 w-full"
                          onClick={(e) => {
                            const faltasSemJustif = presencasChamada.filter(p => !p.presente);
                            if (faltasSemJustif.length > 0 && !editingChamadaId) {
                              setModalJustFaltaItems(faltasSemJustif.map(a => ({
                                cpf: a.alunoCpf,
                                nome: a.alunoNome,
                                motivo: a.justificativa || 'Sem justificativa',
                                obs: '',
                                contaComoPresenca: MOTIVOS_FALTA_PEC.find(m => m.label === (a.justificativa || 'Sem justificativa'))?.contaComoPresenca ?? false,
                              })));
                              setShowJustificativaFaltaModal(true);
                            } else if (!editingChamadaId) {
                              setShowAlimentacaoModal(true);
                            } else {
                              salvarChamadaMutation.mutate({ teveAlimentacao: editingTeveAlimentacao });
                            }
                          }}
                          disabled={presencasChamada.length === 0 || salvarChamadaMutation.isPending}
                          title=""
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {salvarChamadaMutation.isPending ? 'Salvando...' : (editingChamadaId ? 'Atualizar Presenças' : 'Finalizar Chamada')}
                        </Button>
                      </div>
                      {editingChamadaId && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingChamadaId(null);
                            setChamadaTurmaId('');
                            setPresencasChamada([]);
                            setFotoFile(null);
                            setExistingFotoUrl(null);
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancelar Edição
                        </Button>
                      )}
                    </div>
                    
                    {chamadaTurmaId && !editingChamadaId && (
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
                              {presencasChamada.some(p => p.viaCatraca) && (
                                <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5">
                                  <Zap className="w-2.5 h-2.5 mr-0.5 inline" />
                                  {presencasChamada.filter(p => p.viaCatraca).length} entrada{presencasChamada.filter(p => p.viaCatraca).length !== 1 ? 's' : ''}
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

                    {chamadaTurmaId && catracaLog?.entradas && catracaLog.entradas.length > 0 && (
                      <div className="border rounded-lg p-3 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <Zap className="w-4 h-4 text-blue-500" />
                            Entradas via Catraca Hoje
                          </h4>
                          <span className="text-xs text-gray-400">
                            {catracaLog.entradas.filter((e: any) => {
                              const turma = instances?.find((t: any) => t.id.toString() === chamadaTurmaId);
                              return turma ? (e.turma === turma.name || e.turma === turma.title) : true;
                            }).length} registro{catracaLog.entradas.filter((e: any) => {
                              const turma = instances?.find((t: any) => t.id.toString() === chamadaTurmaId);
                              return turma ? (e.turma === turma.name || e.turma === turma.title) : true;
                            }).length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="grid gap-1.5 max-h-[160px] overflow-y-auto">
                          {catracaLog.entradas
                            .filter((e: any) => {
                              const turma = instances?.find((t: any) => t.id.toString() === chamadaTurmaId);
                              return turma ? (e.turma === turma.name || e.turma === turma.title) : true;
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
                          {catracaLog.entradas.filter((e: any) => {
                            const turma = instances?.find((t: any) => t.id.toString() === chamadaTurmaId);
                            return turma ? (e.turma === turma.name || e.turma === turma.title) : true;
                          }).length === 0 && (
                            <div className="text-center py-2 text-xs text-gray-400">Nenhuma entrada desta turma hoje</div>
                          )}
                        </div>
                      </div>
                    )}

                    {chamadaTurmaId && (
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-4">
                          Lista de Presença - {instances.find((t: any) => t.id.toString() === chamadaTurmaId)?.name || instances.find((t: any) => t.id.toString() === chamadaTurmaId)?.title || 'Turma'}
                          {editingChamadaId && <Badge className="ml-2 bg-yellow-500">Editando</Badge>}
                          {loadingAlunosChamada && <span className="text-sm text-gray-500 ml-2">Carregando...</span>}
                        </h3>
                        {loadingAlunosChamada ? (
                          <div className="text-center py-4 text-gray-500">Carregando alunos...</div>
                        ) : presencasChamada.length === 0 ? (
                          <div className="text-center py-4 text-gray-500">
                            <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p>Nenhum aluno nesta turma.</p>
                            <p className="text-sm">Adicione alunos na seção "Turmas".</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {[...presencasChamada]
                              .map((aluno, originalIdx) => ({ ...aluno, originalIdx }))
                              .sort((a, b) => (a.alunoNome || '').localeCompare(b.alunoNome || '', 'pt-BR'))
                              .map((aluno) => {
                                const idx = aluno.originalIdx;
                                return (
                              <div key={aluno.alunoCpf} className={`flex items-center justify-between p-3 border rounded flex-wrap gap-2 ${!modoManual && !aluno.viaCatraca && !aluno.presente ? 'opacity-60' : ''}`}>
                                <div className="flex items-center gap-3">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span>{aluno.alunoNome}</span>
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
                                      name={`presenca-coord-${aluno.alunoCpf}`}
                                      checked={aluno.presente === true}
                                      onChange={() => {
                                        const updated = [...presencasChamada];
                                        updated[idx].presente = true;
                                        updated[idx].justificativa = '';
                                        setPresencasChamada(updated);
                                      }}
                                      className="w-4 h-4 text-green-600"
                                    />
                                    <span className="text-sm text-green-600">Presente</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                      type="radio" 
                                      name={`presenca-coord-${aluno.alunoCpf}`}
                                      checked={aluno.presente === false}
                                      onChange={() => {
                                        const updated = [...presencasChamada];
                                        updated[idx].presente = false;
                                        setPresencasChamada(updated);
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
                                {(modoManual || !!editingChamadaId) && aluno.presente === false && (
                                  <div className="w-full mt-1 space-y-1">
                                    <div className="flex flex-wrap gap-1">
                                      {['Doença', 'Atestado médico', 'Escola', 'Trabalho', 'Transporte', 'Família', 'Compromisso pessoal', 'Chuva/Clima', 'Outro', 'Sem justificativa'].map((opcao) => (
                                        <button
                                          key={opcao}
                                          type="button"
                                          onClick={() => {
                                            const updated = [...presencasChamada];
                                            updated[idx].justificativa = opcao;
                                            setPresencasChamada(updated);
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
                                        const updated = [...presencasChamada];
                                        updated[idx].justificativa = e.target.value;
                                        setPresencasChamada(updated);
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
                    
                    {!chamadaTurmaId && (
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
                            {instances.map((turma: any) => (
                              <SelectItem key={turma.id} value={turma.name || turma.title}>{turma.name || turma.title}</SelectItem>
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
                    
                    {chamadasPEC.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Nenhuma chamada registrada ainda.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {chamadasPEC
                          .filter((chamada: any) => {
                            const turma = instances.find((i: any) => i.id === chamada.activity_instance_id);
                            const turmaNome = turma?.name || turma?.title || '';
                            const dataAtividade = chamada.date?.split('T')[0] || '';
                            
                            if (historicoFiltroTurma && historicoFiltroTurma !== 'todas' && turmaNome !== historicoFiltroTurma) {
                              return false;
                            }
                            if (historicoFiltroDataInicio && dataAtividade) {
                              if (dataAtividade < historicoFiltroDataInicio) return false;
                            }
                            if (historicoFiltroDataFim && dataAtividade) {
                              if (dataAtividade > historicoFiltroDataFim) return false;
                            }
                            return true;
                          })
                          .map((chamada: any) => {
                            const turma = instances.find((i: any) => i.id === chamada.activity_instance_id);
                            const turmaName = turma?.name || turma?.title || `Turma ${chamada.activity_instance_id}`;
                            const presentes = chamada.attendance?.filter((a: any) => a.presente)?.length || 0;
                            const total = chamada.enrolledCount || chamada.attendance?.length || 0;
                            const isExpanded = expandedChamadaId === chamada.id;
                            
                            return (
                              <div key={chamada.id} className="border rounded-lg overflow-hidden">
                                <div 
                                  className="p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                                  onClick={() => setExpandedChamadaId(isExpanded ? null : chamada.id)}
                                >
                                  <div className="flex items-center gap-3">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium">
                                      {chamada.date?.split('T')[0]?.split('-').reverse().join('/') || ''}
                                    </span>
                                    <span className="text-gray-500">-</span>
                                    <span>{turmaName}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-green-600 font-medium">
                                      {presentes}/{total} presentes
                                    </span>
                                    {chamada.teveAlimentacao === true && (
                                      <span className="text-xs bg-orange-100 text-orange-700 border border-orange-200 rounded px-1.5 py-0.5 font-medium">🍽️ Alimentação</span>
                                    )}
                                    {chamada.teveAlimentacao === false && (
                                      <span className="text-xs bg-gray-100 text-gray-500 border border-gray-200 rounded px-1.5 py-0.5">Sem alimentação</span>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        pendingEditAttendanceRef.current = chamada.attendance || [];
                                        setPresencasChamada([]);
                                        setEditingChamadaId(chamada.id);
                                        setChamadaTurmaId(String(chamada.activity_instance_id));
                                        setChamadaData(chamada.date?.split('T')[0] || new Date().toISOString().split('T')[0]);
                                        const fotoUrl = chamada.fotoComprovante || (chamada.attendance || []).find((a: any) => a.fotoComprovante)?.fotoComprovante || null;
                                        setExistingFotoUrl(fotoUrl);
                                        setFotoFile(null);
                                        setEditingTeveAlimentacao(chamada.teveAlimentacao ?? null);
                                        setShowNovaChamadaForm(true);
                                      }}
                                    >
                                      <Pencil className="w-3.5 h-3.5 mr-1" />
                                      Editar
                                    </Button>
                                    {isExpanded ? (
                                      <ChevronUp className="w-4 h-4 text-gray-500" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-gray-500" />
                                    )}
                                  </div>
                                </div>
                                
                                {isExpanded && chamada.attendance && chamada.attendance.length > 0 && (
                                  <div className="p-3 border-t bg-white">
                                    <div className="text-sm font-medium mb-2 text-gray-600">Lista de Presença:</div>
                                    <div className="grid gap-2">
                                      {[...chamada.attendance]
                                        .sort((a: any, b: any) => (a.alunoNome || '').localeCompare(b.alunoNome || '', 'pt-BR'))
                                        .map((a: any, idx: number) => (
                                          <div key={idx} className="flex items-center justify-between py-1 px-2 rounded bg-gray-50">
                                            <span className="text-sm">{a.alunoNome}</span>
                                            <span className={`text-xs font-medium ${a.presente ? 'text-green-600' : 'text-red-600'}`}>
                                              {a.presente ? 'Presente' : 'Falta'}
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

          {activeSection === 'modalidades' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Modalidades Esportivas</CardTitle>
                <Button 
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={() => alert('Funcionalidade "Nova Modalidade" em desenvolvimento. Em breve você poderá cadastrar novas modalidades esportivas.')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Modalidade
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {[
                    {
                      nome: 'Futebol',
                      categorias: ['Sub-13', 'Sub-15', 'Sub-17'],
                      atletas: 45,
                      treinadores: 3,
                      horarios: 'Ter/Qui 16h-18h'
                    },
                    {
                      nome: 'Vôlei',
                      categorias: ['Sub-15', 'Sub-17'],
                      atletas: 28,
                      treinadores: 2,
                      horarios: 'Seg/Qua 17h-19h'
                    },
                    {
                      nome: 'Basquete',
                      categorias: ['Sub-15', 'Sub-17'],
                      atletas: 22,
                      treinadores: 2,
                      horarios: 'Sex 15h-17h'
                    }
                  ].map((modalidade, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-orange-500" />
                          {modalidade.nome}
                        </h3>
                        <Badge className="bg-orange-100 text-orange-800">Ativo</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">Categorias:</span>
                          <p className="font-medium">{modalidade.categorias.join(', ')}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Alunos:</span>
                          <p className="font-medium">{modalidade.atletas}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Treinadores:</span>
                          <p className="font-medium">{modalidade.treinadores}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Horários:</span>
                          <p className="font-medium">{modalidade.horarios}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => changeSection('atletas')}>
                          <Users className="w-4 h-4 mr-1" />
                          Ver Alunos
                        </Button>
                        <Button size="sm" variant="outline">
                          <Calendar className="w-4 h-4 mr-1" />
                          Horários
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'treinamentos' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Planos de Treinamento</CardTitle>
                <Button size="sm" className="bg-purple-500 hover:bg-purple-600" onClick={handleNovoPlano}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Plano
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="Buscar planos de treinamento..." className="pl-10" />
                    </div>
                    <Select>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Modalidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
                        <SelectItem value="futebol">Futebol</SelectItem>
                        <SelectItem value="volei">Vôlei</SelectItem>
                        <SelectItem value="basquete">Basquete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-4">
                    {[
                      {
                        nome: 'Preparação Física - Futebol Sub-17',
                        modalidade: 'Futebol',
                        categoria: 'Sub-17',
                        duracao: '12 semanas',
                        status: 'Ativo',
                        atletas: 15,
                        progresso: 65
                      },
                      {
                        nome: 'Técnico-Tático - Vôlei Sub-15',
                        modalidade: 'Vôlei',
                        categoria: 'Sub-15',
                        duracao: '8 semanas',
                        status: 'Planejado',
                        atletas: 12,
                        progresso: 25
                      },
                      {
                        nome: 'Condicionamento - Basquete',
                        modalidade: 'Basquete',
                        categoria: 'Sub-17',
                        duracao: '10 semanas',
                        status: 'Concluído',
                        atletas: 10,
                        progresso: 100
                      }
                    ].map((plano, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold flex items-center gap-2">
                            <Activity className="w-4 h-4 text-purple-500" />
                            {plano.nome}
                          </h3>
                          <Badge className={
                            plano.status === 'Ativo' ? 'bg-green-100 text-green-800' :
                            plano.status === 'Planejado' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {plano.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-500">Modalidade:</span>
                            <p className="font-medium">{plano.modalidade}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Categoria:</span>
                            <p className="font-medium">{plano.categoria}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Duração:</span>
                            <p className="font-medium">{plano.duracao}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Alunos:</span>
                            <p className="font-medium">{plano.atletas}</p>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-500">Progresso:</span>
                            <span className="font-medium">{plano.progresso}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full" 
                              style={{width: `${plano.progresso}%`}}
                            ></div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            Visualizar
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button size="sm" variant="outline">
                            <Users className="w-4 h-4 mr-1" />
                            Alunos
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'oficinas' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Oficinas Culturais</CardTitle>
                <Button size="sm" className="bg-pink-500 hover:bg-pink-600" onClick={handleNovaOficina}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Oficina
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="Buscar oficinas culturais..." className="pl-10" />
                    </div>
                    <Select value={projetoFilterOficinas} onValueChange={setProjetoFilterOficinas}>
                      <SelectTrigger className="w-48" data-testid="select-projeto-filter">
                        <SelectValue placeholder="Filtrar por Projeto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os Projetos</SelectItem>
                        {projects.map((projeto: any) => (
                          <SelectItem key={projeto.id} value={projeto.id.toString()}>
                            {projeto.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-4">
                    {oficinasFiltradas.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        {activities.length === 0 
                          ? 'Nenhuma oficina encontrada. Clique em "Nova Oficina" para adicionar.'
                          : 'Nenhuma oficina encontrada para este projeto.'
                        }
                      </div>
                    ) : (
                      oficinasFiltradas.map((activity: any) => (
                        <div key={activity.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold flex items-center gap-2">
                              <Music className="w-4 h-4 text-pink-500" />
                              {activity.name}
                            </h3>
                            <Badge className={activity.status === 'ativa' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {activity.status === 'ativa' ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          <div className="text-sm mb-3">
                            <span className="text-gray-500">Descrição:</span>
                            <p className="font-medium">{activity.description || 'Sem descrição'}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleVisualizarOficina(activity)}
                              data-testid={`button-visualizar-oficina-${activity.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Visualizar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditarOficina(activity)}
                              data-testid={`button-editar-oficina-${activity.id}`}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Editar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:border-red-600"
                              onClick={() => handleExcluirOficina(activity)}
                              data-testid={`button-excluir-oficina-${activity.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'apresentacoes' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Apresentações</CardTitle>
                <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600" onClick={handleNovaApresentacao}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Apresentação
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="Buscar apresentações..." className="pl-10" />
                    </div>
                    <Select>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
                        <SelectItem value="agendadas">Agendadas</SelectItem>
                        <SelectItem value="realizadas">Realizadas</SelectItem>
                        <SelectItem value="canceladas">Canceladas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Evento</TableHead>
                        <TableHead>Oficina</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Local</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-yellow-500" />
                          Festival de Talentos 2025
                        </TableCell>
                        <TableCell>Coral Infantil</TableCell>
                        <TableCell>15/10/2025</TableCell>
                        <TableCell>Auditório Principal</TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800">Agendada</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-yellow-500" />
                          Mostra de Teatro
                        </TableCell>
                        <TableCell>Teatro de Rua</TableCell>
                        <TableCell>22/09/2025</TableCell>
                        <TableCell>Praça Central</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">Realizada</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'eventos' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Eventos Esportivos</CardTitle>
                <Button size="sm" className="bg-red-500 hover:bg-red-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Evento
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="Buscar eventos..." className="pl-10" />
                    </div>
                    <Select>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="competicao">Competição</SelectItem>
                        <SelectItem value="festival">Festival</SelectItem>
                        <SelectItem value="torneio">Torneio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-4">
                    {[
                      {
                        nome: 'Torneio Intermunicipal de Futebol',
                        tipo: 'Torneio',
                        data: '20/10/2025',
                        local: 'Campo Principal',
                        participantes: 8,
                        status: 'Agendado'
                      },
                      {
                        nome: 'Festival de Vôlei Jovem',
                        tipo: 'Festival',
                        data: '05/11/2025',
                        local: 'Ginásio Municipal',
                        participantes: 12,
                        status: 'Planejamento'
                      },
                      {
                        nome: 'Copa Instituto O Grito de Basquete',
                        tipo: 'Competição',
                        data: '18/09/2025',
                        local: 'Quadra Coberta',
                        participantes: 6,
                        status: 'Realizado'
                      }
                    ].map((evento, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-red-500" />
                            {evento.nome}
                          </h3>
                          <Badge className={
                            evento.status === 'Agendado' ? 'bg-blue-100 text-blue-800' :
                            evento.status === 'Realizado' ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {evento.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-500">Tipo:</span>
                            <p className="font-medium">{evento.tipo}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Data:</span>
                            <p className="font-medium">{evento.data}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Local:</span>
                            <p className="font-medium">{evento.local}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Equipes:</span>
                            <p className="font-medium">{evento.participantes}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            Detalhes
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trophy className="w-4 h-4 mr-1" />
                            Resultados
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'competicoes' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Competições</CardTitle>
                <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Competição
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="Buscar competições..." className="pl-10" />
                    </div>
                    <Select>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Modalidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
                        <SelectItem value="futebol">Futebol</SelectItem>
                        <SelectItem value="volei">Vôlei</SelectItem>
                        <SelectItem value="basquete">Basquete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Competição</TableHead>
                        <TableHead>Modalidade</TableHead>
                        <TableHead>Nível</TableHead>
                        <TableHead>Alunos</TableHead>
                        <TableHead>Resultado</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-gold-500" />
                          Campeonato Regional de Futebol Sub-17
                        </TableCell>
                        <TableCell>Futebol</TableCell>
                        <TableCell>Regional</TableCell>
                        <TableCell>15</TableCell>
                        <TableCell>
                          <Badge className="bg-yellow-100 text-yellow-800">2º Lugar</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-gold-500" />
                          Torneio Municipal de Vôlei Feminino
                        </TableCell>
                        <TableCell>Vôlei</TableCell>
                        <TableCell>Municipal</TableCell>
                        <TableCell>12</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">1º Lugar</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}


          {activeSection === 'relatorios' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Relatórios Gerenciais</CardTitle>
                <Button size="sm" className="bg-gray-500 hover:bg-gray-600" onClick={handleExportReport}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Relatório
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4 hover:shadow-md cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <h3 className="font-semibold">Relatório de Alunos</h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">Dados completos dos alunos, modalidades e desempenho.</p>
                      <Button size="sm" variant="outline" className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Gerar Relatório
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg p-4 hover:shadow-md cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-5 h-5 text-purple-500" />
                        <h3 className="font-semibold">Relatório de Treinamentos</h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">Progressão dos planos de treinamento e frequência.</p>
                      <Button size="sm" variant="outline" className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Gerar Relatório
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg p-4 hover:shadow-md cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        <Music className="w-5 h-5 text-pink-500" />
                        <h3 className="font-semibold">Relatório Cultural</h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">Atividades culturais, oficinas e apresentações.</p>
                      <Button size="sm" variant="outline" className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Gerar Relatório
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg p-4 hover:shadow-md cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <h3 className="font-semibold">Relatório de Eventos</h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">Eventos realizados, participação e resultados.</p>
                      <Button size="sm" variant="outline" className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Gerar Relatório
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg p-4 hover:shadow-md cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-green-500" />
                        <h3 className="font-semibold">Relatório de Indicadores</h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">Indicadores de desempenho e metas alcançadas.</p>
                      <Button size="sm" variant="outline" className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Gerar Relatório
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg p-4 hover:shadow-md cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-red-500" />
                        <h3 className="font-semibold">Relatório de Frequência</h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">Frequência e assiduidade dos participantes.</p>
                      <Button size="sm" variant="outline" className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Gerar Relatório
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Relatório Mensal Automático</h4>
                    <p className="text-gray-600 text-sm mb-3">
                      Relatório completo gerado automaticamente todo mês com todos os indicadores do programa.
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleExportReport}>
                        <Download className="w-4 h-4 mr-2" />
                        Baixar Último Relatório
                      </Button>
                      <Button size="sm" variant="outline">
                        <Calendar className="w-4 h-4 mr-2" />
                        Programar Envio
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'configuracoes' && (
            <Card>
              <CardHeader>
                <CardTitle>Meu Perfil</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{perfilData.nome}</h3>
                      <p className="text-gray-600">Coordenador de Esporte e Cultura</p>
                      <Badge className="bg-orange-100 text-orange-800 mt-1">
                        🏆 PEC - Polo Esportivo Cultural
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-md">Informações Pessoais</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-500">Nome Completo</label>
                        <Input 
                          value={perfilData.nome} 
                          onChange={(e) => setPerfilData({ ...perfilData, nome: e.target.value })}
                          className="mt-1" 
                          data-testid="input-nome-perfil"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Email</label>
                        <Input 
                          type="email"
                          value={perfilData.email} 
                          onChange={(e) => setPerfilData({ ...perfilData, email: e.target.value })}
                          className="mt-1"
                          data-testid="input-email-perfil"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Telefone</label>
                        <Input 
                          value={perfilData.telefone} 
                          onChange={(e) => setPerfilData({ ...perfilData, telefone: e.target.value })}
                          className="mt-1"
                          data-testid="input-telefone-perfil"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Cargo</label>
                        <Input value="Coordenador de Esporte e Cultura" className="mt-1" disabled />
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Segurança
                    </h3>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Altere sua senha de acesso periodicamente para manter sua conta segura.
                      </p>
                      <Button
                        onClick={() => setShowAlterarSenhaModal(true)}
                        variant="outline"
                        data-testid="button-alterar-senha"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Alterar Senha
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-md mb-3">Estatísticas do Coordenador</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{dashboardData?.atletasAtivos || 0}</div>
                        <div className="text-sm text-gray-600">Alunos Supervisionados</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{dashboardData?.modalidades || 0}</div>
                        <div className="text-sm text-gray-600">Modalidades Ativas</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{dashboardData?.oficinasCulturais || 0}</div>
                        <div className="text-sm text-gray-600">Eventos Organizados</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">A+</div>
                        <div className="text-sm text-gray-600">Avaliação Geral</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      className="bg-orange-500 hover:bg-orange-600"
                      onClick={handleSalvarPerfil}
                      disabled={salvarPerfilMutation.isPending}
                      data-testid="button-salvar-perfil"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {salvarPerfilMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

      </div>

      {/* Modais */}
      <InstanceForm 
        open={showNovaTurmaModal}
        onClose={() => setShowNovaTurmaModal(false)}
      />

      <ComprehensiveStudentForm 
        open={showAdicionarAlunoModal}
        onClose={() => {
          setShowAdicionarAlunoModal(false);
          setEditStudentCpf(undefined);
        }}
        editCpf={editStudentCpf}
      />

      <ActivityForm 
        open={showNovaOficinaModal}
        onClose={() => setShowNovaOficinaModal(false)}
      />

      {/* Modais temporários - Alertas */}
      {showNovoPlanoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-2">Funcionalidade em Desenvolvimento</h3>
            <p className="text-gray-600 mb-4">
              O módulo "Novo Plano de Treinamento" está em desenvolvimento. Em breve você poderá criar planos personalizados para os atletas.
            </p>
            <Button onClick={() => setShowNovoPlanoModal(false)} className="w-full">
              Entendi
            </Button>
          </div>
        </div>
      )}

      {showNovaAvaliacaoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-2">Funcionalidade em Desenvolvimento</h3>
            <p className="text-gray-600 mb-4">
              O módulo "Nova Avaliação Física" está em desenvolvimento. Em breve você poderá registrar avaliações físicas dos atletas.
            </p>
            <Button onClick={() => setShowNovaAvaliacaoModal(false)} className="w-full">
              Entendi
            </Button>
          </div>
        </div>
      )}

      {showNovaApresentacaoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-2">Funcionalidade em Desenvolvimento</h3>
            <p className="text-gray-600 mb-4">
              O módulo "Nova Apresentação" está em desenvolvimento. Em breve você poderá agendar apresentações dos atletas.
            </p>
            <Button onClick={() => setShowNovaApresentacaoModal(false)} className="w-full">
              Entendi
            </Button>
          </div>
        </div>
      )}

      {/* Modal Novo Projeto */}
      {showNovoProjetoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNovoProjetoModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Novo Projeto</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowNovoProjetoModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nome do Projeto</label>
                <Input 
                  placeholder="Ex: Programa Esporte e Cultura 2025"
                  value={projetoForm.name}
                  onChange={(e) => setProjetoForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Descrição</label>
                <Input 
                  placeholder="Breve descrição do projeto"
                  value={projetoForm.description}
                  onChange={(e) => setProjetoForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select
                  value={projetoForm.status}
                  onValueChange={(value) => setProjetoForm(prev => ({ ...prev, status: value }))}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Data Início</label>
                  <Input 
                    type="date"
                    value={projetoForm.period_start}
                    onChange={(e) => setProjetoForm(prev => ({ ...prev, period_start: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Data Fim</label>
                  <Input 
                    type="date"
                    value={projetoForm.period_end}
                    onChange={(e) => setProjetoForm(prev => ({ ...prev, period_end: e.target.value }))}
                    disabled={projetoForm.tempoIndeterminado}
                    className={projetoForm.tempoIndeterminado ? 'bg-gray-100 cursor-not-allowed' : ''}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="tempo-indeterminado" 
                  checked={projetoForm.tempoIndeterminado}
                  onCheckedChange={(checked) => {
                    setProjetoForm(prev => ({
                      ...prev,
                      tempoIndeterminado: Boolean(checked),
                      period_end: Boolean(checked) ? '' : prev.period_end
                    }));
                  }}
                />
                <label htmlFor="tempo-indeterminado" className="text-sm font-medium cursor-pointer">
                  Tempo Indeterminado
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  className="flex-1 bg-blue-500 hover:bg-blue-600" 
                  onClick={() => createProjectMutation.mutate(projetoForm)}
                  disabled={createProjectMutation.isPending}
                >
                  {createProjectMutation.isPending ? 'Criando...' : 'Criar Projeto'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowNovoProjetoModal(false);
                  setProjetoForm({ name: '', description: '', period_start: '', period_end: '', status: 'ativo', tempoIndeterminado: false });
                }}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes do Projeto */}
      {showDetalhesProjetoModal && selectedProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDetalhesProjetoModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Detalhes do Projeto</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowDetalhesProjetoModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-xl text-blue-600">{selectedProject.name}</h4>
                <Badge className={selectedProject.status === 'ativo' ? 'bg-green-100 text-green-800 mt-2' : 'bg-red-100 text-red-800 mt-2'}>
                  {selectedProject.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Descrição</label>
                <p className="text-gray-700 mt-1">{selectedProject.description || 'Sem descrição disponível'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Data de Início</label>
                  <p className="text-gray-700 mt-1">{selectedProject.period_start ? new Date(selectedProject.period_start).toLocaleDateString('pt-BR') : 'Não informada'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Data de Término</label>
                  <p className="text-gray-700 mt-1">
                    {selectedProject.period_end ? new Date(selectedProject.period_end).toLocaleDateString('pt-BR') : 'Tempo Indeterminado'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1" onClick={() => {
                  setShowDetalhesProjetoModal(false);
                  handleEditarProjeto(selectedProject);
                }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Projeto
                </Button>
                <Button variant="outline" className="border-red-500 text-red-600 hover:bg-red-50" onClick={() => {
                  setShowDetalhesProjetoModal(false);
                  handleExcluirProjeto(selectedProject);
                }}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Projeto */}
      {showEditarProjetoModal && selectedProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEditarProjetoModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Editar Projeto</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowEditarProjetoModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nome do Projeto</label>
                <Input 
                  value={projetoForm.name}
                  onChange={(e) => setProjetoForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Descrição</label>
                <Input 
                  value={projetoForm.description}
                  onChange={(e) => setProjetoForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select
                  value={projetoForm.status}
                  onValueChange={(value) => setProjetoForm(prev => ({ ...prev, status: value }))}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Data Início</label>
                  <Input 
                    type="date" 
                    value={projetoForm.period_start}
                    onChange={(e) => setProjetoForm(prev => ({ ...prev, period_start: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Data Fim</label>
                  <Input 
                    type="date" 
                    value={projetoForm.period_end}
                    onChange={(e) => setProjetoForm(prev => ({ ...prev, period_end: e.target.value }))}
                    disabled={projetoForm.tempoIndeterminado}
                    className={projetoForm.tempoIndeterminado ? 'bg-gray-100 cursor-not-allowed' : ''}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="tempo-indeterminado-edit" 
                  checked={projetoForm.tempoIndeterminado}
                  onCheckedChange={(checked) => {
                    setProjetoForm(prev => ({
                      ...prev,
                      tempoIndeterminado: Boolean(checked),
                      period_end: Boolean(checked) ? '' : prev.period_end
                    }));
                  }}
                />
                <label htmlFor="tempo-indeterminado-edit" className="text-sm font-medium cursor-pointer">
                  Tempo Indeterminado
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  className="flex-1 bg-blue-500 hover:bg-blue-600" 
                  onClick={() => updateProjectMutation.mutate({ id: selectedProject.id, data: projetoForm })}
                  disabled={updateProjectMutation.isPending}
                >
                  {updateProjectMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowEditarProjetoModal(false);
                  setSelectedProject(null);
                  setProjetoForm({ name: '', description: '', period_start: '', period_end: '', status: 'ativo', tempoIndeterminado: false });
                }}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Excluir Projeto */}
      {showExcluirProjetoModal && selectedProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowExcluirProjetoModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">Confirmar Exclusão</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowExcluirProjetoModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                <Trash2 className="w-8 h-8 text-red-500" />
                <div>
                  <p className="font-medium text-gray-900">Tem certeza que deseja excluir?</p>
                  <p className="text-sm text-gray-600">Projeto: <strong>{selectedProject.name}</strong></p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Esta ação não pode ser desfeita. Todos os dados relacionados a este projeto serão permanentemente removidos.
              </p>
              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1 bg-red-500 hover:bg-red-600" 
                  onClick={confirmarExclusao}
                  disabled={excluirProjetoMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {excluirProjetoMutation.isPending ? 'Excluindo...' : 'Sim, Excluir'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowExcluirProjetoModal(false);
                    setSelectedProject(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Excluir Oficina */}
      {showExcluirOficinaModal && selectedActivity && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowExcluirOficinaModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">Confirmar Exclusão</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowExcluirOficinaModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                <Trash2 className="w-8 h-8 text-red-500" />
                <div>
                  <p className="font-medium text-gray-900">Tem certeza que deseja excluir?</p>
                  <p className="text-sm text-gray-600">Oficina: <strong>{selectedActivity.name}</strong></p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Esta ação não pode ser desfeita. A oficina será permanentemente removida.
              </p>
              {(() => {
                const inativaSituations = ['encerrada', 'inativo', 'inativa'];
                const turmasAtivas = instances.filter((i: any) => i.activity_id === selectedActivity?.id && !inativaSituations.includes(i.situation));
                const turmasInativas = instances.filter((i: any) => i.activity_id === selectedActivity?.id && inativaSituations.includes(i.situation));
                if (turmasInativas.length === 0 && turmasAtivas.length === 0) return null;
                return (
                  <div className="space-y-2">
                    {turmasInativas.length > 0 && turmasAtivas.length === 0 && (
                      <p className="text-sm text-green-700 bg-green-50 p-3 rounded">
                        <strong>Info:</strong> Esta oficina possui {turmasInativas.length} turma{turmasInativas.length !== 1 ? 's' : ''} encerrada{turmasInativas.length !== 1 ? 's' : ''}/inativa{turmasInativas.length !== 1 ? 's' : ''} que serão removidas automaticamente.
                      </p>
                    )}
                    {turmasAtivas.length > 0 && (
                      <>
                        <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
                          <strong>Atenção:</strong> Esta oficina possui <strong>{turmasAtivas.length} turma{turmasAtivas.length !== 1 ? 's' : ''} ativa{turmasAtivas.length !== 1 ? 's' : ''}</strong>. É necessário confirmar a exclusão.
                        </p>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={forceDeletarTurmas}
                            onChange={(e) => setForceDeletarTurmas(e.target.checked)}
                            className="w-4 h-4 accent-red-500"
                          />
                          <span className="text-sm text-red-700 font-medium">
                            Excluir também as {turmasAtivas.length} turma{turmasAtivas.length !== 1 ? 's' : ''} ativa{turmasAtivas.length !== 1 ? 's' : ''}
                          </span>
                        </label>
                        {!forceDeletarTurmas && (
                          <p className="text-xs text-gray-500">Marque a opção acima para poder excluir esta oficina.</p>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}
              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50" 
                  onClick={confirmarExclusaoOficina}
                  disabled={excluirOficinaMutation.isPending || (instances.filter((i: any) => i.activity_id === selectedActivity?.id && !['encerrada','inativo','inativa'].includes(i.situation)).length > 0 && !forceDeletarTurmas)}
                  data-testid="button-confirmar-excluir-oficina"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {excluirOficinaMutation.isPending ? 'Excluindo...' : 'Sim, Excluir'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowExcluirOficinaModal(false);
                    setSelectedActivity(null);
                  }}
                  data-testid="button-cancelar-excluir-oficina"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes da Oficina */}
      {showVisualizarOficinaModal && selectedActivity && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowVisualizarOficinaModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Detalhes da Oficina</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowVisualizarOficinaModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-xl text-pink-600 flex items-center gap-2">
                  <Music className="w-6 h-6" />
                  {selectedActivity.name}
                </h4>
                <Badge className={selectedActivity.status === 'ativa' ? 'bg-green-100 text-green-800 mt-2' : 'bg-gray-100 text-gray-800 mt-2'}>
                  {selectedActivity.status === 'ativa' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Descrição</label>
                <p className="text-gray-700 mt-1">{selectedActivity.description || 'Sem descrição disponível'}</p>
              </div>
              
              {/* Turmas vinculadas a esta oficina */}
              <div className="border-t pt-4 mt-4">
                <h5 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  Turmas desta Oficina
                </h5>
                {instances.filter((inst: any) => inst.activity_id === selectedActivity.id).length === 0 ? (
                  <p className="text-gray-500 text-sm">Nenhuma turma vinculada a esta oficina ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {instances
                      .filter((inst: any) => inst.activity_id === selectedActivity.id)
                      .map((turma: any) => (
                        <div key={turma.id} className="border rounded-lg p-3 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{turma.title}</p>
                              <p className="text-sm text-gray-500">
                                {turma.period_label} • {turma.location || 'Local não informado'}
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setShowVisualizarOficinaModal(false);
                                changeSection('turmas');
                              }}
                            >
                              Ver participantes
                            </Button>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t mt-4">
                <Button className="flex-1" onClick={() => {
                  setShowVisualizarOficinaModal(false);
                  handleEditarOficina(selectedActivity);
                }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Oficina
                </Button>
                <Button variant="outline" onClick={() => setShowVisualizarOficinaModal(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Oficina */}
      {showEditarOficinaModal && selectedActivity && (
        <ActivityForm
          open={showEditarOficinaModal}
          onClose={() => {
            setShowEditarOficinaModal(false);
            setSelectedActivity(null);
          }}
          activity={selectedActivity}
        />
      )}

      {/* Modal Visualizar Turma */}
      <TurmaDetailModal 
        open={showVisualizarTurmaModal} 
        onOpenChange={setShowVisualizarTurmaModal}
        selectedInstance={selectedInstance}
      />

      {/* Modal Editar Turma */}
      <InstanceForm
          open={showEditarTurmaModal}
          onClose={() => {
            setShowEditarTurmaModal(false);
            setSelectedInstance(null);
          }}
          instance={selectedInstance}
          activityId={selectedInstance?.activity_id || null}
      />

      {/* Modal Excluir Turma */}
      <AlertDialog open={showExcluirTurmaModal} onOpenChange={setShowExcluirTurmaModal}>
        <AlertDialogContent data-testid="modal-excluir-turma">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a turma "{selectedInstance?.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-delete"
              onClick={() => selectedInstance && deleteInstanceMutation.mutate(selectedInstance.id)}
              disabled={deleteInstanceMutation.isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteInstanceMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Visualizar Detalhes do Aluno - Completo */}
      <ParticipanteDetalhesModal
        open={showStudentDetailsModal}
        onOpenChange={(open) => {
          setShowStudentDetailsModal(open);
          if (!open) {
            setFullStudentData(null);
            setStudentResponsaveis([]);
          }
        }}
        title="Detalhes Completos do Aluno"
        loading={loadingStudentDetails}
        color="orange"
        foto={fullStudentData?.foto_perfil}
        nome={fullStudentData?.nome_completo}
        cpf={fullStudentData ? formatCPF(fullStudentData.cpf) : undefined}
        status={fullStudentData?.situacao_atendimento}
        sections={fullStudentData ? ([
          {
            title: "Identificação",
            icon: User,
            fields: [
              { label: "Data de Nascimento", value: fullStudentData.data_nascimento },
              { label: "Gênero", value: fullStudentData.genero },
              { label: "Nº Matrícula", value: fullStudentData.numero_matricula },
              { label: "Estado Civil", value: fullStudentData.estado_civil },
              { label: "Religião", value: fullStudentData.religiao },
              { label: "Naturalidade", value: fullStudentData.naturalidade },
              { label: "Nacionalidade", value: fullStudentData.nacionalidade },
              { label: "Cor/Raça", value: fullStudentData.cor_raca },
              { label: "Pode sair sozinho?", value: fullStudentData.pode_sair_sozinho },
            ],
          },
          {
            title: "Documentos",
            icon: FileText,
            fields: [
              { label: "CPF", value: formatCPF(fullStudentData.cpf) },
              { label: "RG", value: fullStudentData.rg },
              { label: "Órgão Emissor", value: fullStudentData.orgao_emissor },
              { label: "CTPS Número", value: fullStudentData.ctps_numero },
              { label: "CTPS Série", value: fullStudentData.ctps_serie },
              { label: "Título de Eleitor", value: fullStudentData.titulo_eleitor },
              { label: "NIS/PIS/PASEP", value: fullStudentData.nis_pis_pasep },
            ],
          },
          {
            title: "Contato",
            icon: Phone,
            fields: [
              { label: "Telefone", value: fullStudentData.telefone },
              { label: "Email", value: fullStudentData.email },
              { label: "WhatsApp", value: fullStudentData.whatsapp },
            ],
            extra: fullStudentData.contatos_emergencia && Array.isArray(fullStudentData.contatos_emergencia) && fullStudentData.contatos_emergencia.length > 0 ? (
              <div>
                <label className="text-xs font-medium text-gray-500">Contatos de Emergência</label>
                <div className="space-y-1 mt-1">
                  {fullStudentData.contatos_emergencia.map((c: any, i: number) => (
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
              { label: "CEP", value: fullStudentData.cep },
              { label: "Logradouro", value: fullStudentData.logradouro },
              { label: "Número", value: fullStudentData.numero },
              { label: "Complemento", value: fullStudentData.complemento },
              { label: "Bairro", value: fullStudentData.bairro },
              { label: "Cidade", value: fullStudentData.cidade },
              { label: "Estado", value: fullStudentData.estado },
            ],
          },
          {
            title: "Benefícios Sociais",
            icon: Heart,
            cols: 4,
            fields: [
              { label: "CadÚnico", value: fullStudentData.cadunico },
              { label: "Bolsa Família", value: fullStudentData.bolsa_familia },
              { label: "BPC", value: fullStudentData.bpc },
              { label: "Cartão Alimentação", value: fullStudentData.cartao_alimentacao },
            ],
          },
          {
            title: "Tamanhos",
            icon: Shirt,
            cols: 3,
            fields: [
              { label: "Camiseta", value: fullStudentData.tamanho_camiseta },
              { label: "Calça", value: fullStudentData.tamanho_calca },
              { label: "Calçado", value: fullStudentData.tamanho_calcado },
            ],
          },
          {
            title: "Informações Escolares",
            icon: GraduationCap,
            fields: [
              { label: "Série", value: fullStudentData.serie },
              { label: "Situação Escolar", value: fullStudentData.situacao_escolar },
              { label: "Turno", value: Array.isArray(fullStudentData.turno_escolar) ? fullStudentData.turno_escolar.join(', ') : fullStudentData.turno_escolar },
              { label: "Instituição de Ensino", value: fullStudentData.instituicao_ensino },
              { label: "Alfabetizado", value: fullStudentData.e_alfabetizado },
              { label: "Bairro da Escola", value: fullStudentData.bairro_escola },
            ],
          },
          {
            title: "Saúde",
            icon: Heart,
            fields: [
              { label: "Tipo Sanguíneo", value: fullStudentData.tipo_sanguineo },
              { label: "Particularidade de Saúde", value: fullStudentData.possui_particularidade_saude },
              { label: "Detalhes", value: fullStudentData.detalhes_particularidade },
              { label: "Alergia", value: fullStudentData.possui_alergia },
              { label: "Detalhes Alergia", value: fullStudentData.detalhes_alergia },
              { label: "Uso de Medicamento", value: fullStudentData.faz_uso_medicamento },
              { label: "Detalhes Medicamento", value: fullStudentData.detalhes_medicamento },
              { label: "Deficiência", value: fullStudentData.possui_deficiencia },
              { label: "Detalhes Deficiência", value: fullStudentData.detalhes_deficiencia },
              { label: "Restrição Alimentar", value: fullStudentData.restricao_alimentar },
              { label: "Convênio Médico", value: fullStudentData.possui_convenio_medico },
            ],
          },
          {
            title: "Informações Administrativas",
            icon: Calendar,
            fields: [
              { label: "Data de Entrada", value: fullStudentData.data_entrada },
              { label: "Forma de Acesso", value: fullStudentData.forma_acesso },
              { label: "Situação Atendimento", value: fullStudentData.situacao_atendimento || 'Ativo' },
            ],
            extra: (
              <>
                {fullStudentData.demandas && Array.isArray(fullStudentData.demandas) && fullStudentData.demandas.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">Demandas</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {fullStudentData.demandas.map((d: string, i: number) => (
                        <span key={i} className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">{d}</span>
                      ))}
                    </div>
                  </div>
                )}
                {fullStudentData.observacoes_gerais && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">Observações Gerais</label>
                    <p className="text-sm bg-white p-2 rounded mt-1">{fullStudentData.observacoes_gerais}</p>
                  </div>
                )}
              </>
            ),
          },
        ] as DetalhesSection[]) : []}
        extraSections={fullStudentData && (
          <>
            <div>
              <h4 className="font-semibold text-orange-600 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" /> Responsáveis
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                {studentResponsaveis.length > 0 ? (
                  studentResponsaveis.map((resp: any, i: number) => {
                    const parentescoLabels: Record<string, string> = { pai: 'Pai', mae: 'Mãe', avo: 'Avó/Avô', tio: 'Tio/Tia', irmao: 'Irmão/Irmã', tutor_legal: 'Tutor Legal', outro: 'Outro' };
                    const escolaridadeLabels: Record<string, string> = { nao_alfabetizado: 'Não Alfabetizado', fundamental_incompleto: 'Fund. Incompleto', fundamental_completo: 'Fund. Completo', medio_incompleto: 'Médio Incompleto', medio_completo: 'Médio Completo', superior_incompleto: 'Superior Incompleto', superior_completo: 'Superior Completo', pos_graduacao: 'Pós-Graduação' };
                    const trabLabels: Record<string, string> = { empregado_formal: 'Empregado (formal)', empregado_informal: 'Empregado (informal)', autonomo: 'Autônomo', desempregado: 'Desempregado', aposentado: 'Aposentado', do_lar: 'Do Lar', estudante: 'Estudante' };
                    return (
                      <div key={i} className={`bg-white p-4 rounded border ${resp.e_principal ? 'border-green-400 border-2' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <p className="text-sm font-bold">{resp.nome_completo}</p>
                          {resp.grau_parentesco && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              {parentescoLabels[resp.grau_parentesco] || resp.grau_parentesco}
                            </span>
                          )}
                          {resp.e_principal && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-semibold">Principal</span>}
                          {resp.mora_com_aluno && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">Mora com o aluno</span>}
                          {resp.e_contato_emergencia && <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">Emergência</span>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-500 uppercase tracking-wide text-xs">Identificação</p>
                            {resp.cpf && <div><span className="text-gray-500">CPF:</span> <span className="font-medium">{resp.cpf}</span></div>}
                            {resp.rg && <div><span className="text-gray-500">RG:</span> <span className="font-medium">{resp.rg}{resp.orgao_emissor_rg ? ` — ${resp.orgao_emissor_rg}` : ''}</span></div>}
                            {resp.data_nascimento && <div><span className="text-gray-500">Nascimento:</span> <span className="font-medium">{new Date(resp.data_nascimento + 'T12:00:00').toLocaleDateString('pt-BR')}</span></div>}
                            {resp.genero && <div><span className="text-gray-500">Gênero:</span> <span className="font-medium">{resp.genero.charAt(0).toUpperCase() + resp.genero.slice(1).toLowerCase()}</span></div>}
                            {resp.estado_civil && <div><span className="text-gray-500">Estado Civil:</span> <span className="font-medium">{resp.estado_civil}</span></div>}
                          </div>
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-500 uppercase tracking-wide text-xs">Contato</p>
                            {resp.telefone && <div><span className="text-gray-500">Telefone:</span> <span className="font-medium">{resp.telefone}</span></div>}
                            {resp.whatsapp && <div><span className="text-gray-500">WhatsApp:</span> <span className="font-medium">{resp.whatsapp}</span></div>}
                            {resp.email && <div><span className="text-gray-500">Email:</span> <span className="font-medium">{resp.email}</span></div>}
                          </div>
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-500 uppercase tracking-wide text-xs">Socioeconômico</p>
                            {resp.escolaridade && <div><span className="text-gray-500">Escolaridade:</span> <span className="font-medium">{escolaridadeLabels[resp.escolaridade] || resp.escolaridade}</span></div>}
                            {resp.situacao_trabalhista && <div><span className="text-gray-500">Situação:</span> <span className="font-medium">{trabLabels[resp.situacao_trabalhista] || resp.situacao_trabalhista}</span></div>}
                            {resp.profissao && <div><span className="text-gray-500">Profissão:</span> <span className="font-medium">{resp.profissao}</span></div>}
                            {resp.renda_familiar && <div><span className="text-gray-500">Renda Familiar:</span> <span className="font-medium">{resp.renda_familiar}</span></div>}
                          </div>
                          {(resp.logradouro || resp.bairro || resp.cidade || resp.cep) && (
                            <div className="space-y-1">
                              <p className="font-semibold text-gray-500 uppercase tracking-wide text-xs">Endereço</p>
                              {resp.cep && <div><span className="text-gray-500">CEP:</span> <span className="font-medium">{resp.cep}</span></div>}
                              {resp.logradouro && <div><span className="text-gray-500">Rua:</span> <span className="font-medium">{resp.logradouro}{resp.numero ? `, ${resp.numero}` : ''}{resp.complemento ? ` — ${resp.complemento}` : ''}</span></div>}
                              {resp.bairro && <div><span className="text-gray-500">Bairro:</span> <span className="font-medium">{resp.bairro}</span></div>}
                              {(resp.cidade || resp.estado) && <div><span className="text-gray-500">Cidade:</span> <span className="font-medium">{[resp.cidade, resp.estado].filter(Boolean).join(' — ')}</span></div>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500">Nenhum responsável cadastrado.</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-orange-600 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" /> Relações
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Relacionamentos Familiares</label>
                  {fullStudentData.relacionamentos_familiares && Array.isArray(fullStudentData.relacionamentos_familiares) && fullStudentData.relacionamentos_familiares.length > 0 ? (
                    <div className="space-y-2 mt-2">
                      {fullStudentData.relacionamentos_familiares.map((rel: any, i: number) => (
                        <div key={i} className="bg-white p-2 rounded border">
                          <p className="text-sm font-medium">{rel.nome}</p>
                          <p className="text-xs text-gray-500">{rel.parentesco} • {rel.relacao}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">Nenhum relacionamento familiar registrado.</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Outros Relacionamentos</label>
                  {fullStudentData.outros_relacionamentos && Array.isArray(fullStudentData.outros_relacionamentos) && fullStudentData.outros_relacionamentos.length > 0 ? (
                    <div className="space-y-2 mt-2">
                      {fullStudentData.outros_relacionamentos.map((rel: any, i: number) => (
                        <div key={i} className="bg-white p-2 rounded border">
                          <p className="text-sm font-medium">{rel.nome}</p>
                          <p className="text-xs text-gray-500">{rel.parentesco} • {rel.relacao}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">Nenhum relacionamento registrado.</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-orange-600 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Arquivos e Documentos
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="doc-upload-pec"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !selectedStudent?.cpf) return;
                      setUploadingDocumento(true);
                      const formData = new FormData();
                      formData.append('documento', file);
                      formData.append('tipoDocumento', 'Documento');
                      try {
                        const res = await fetch(`/api/documentos/aluno/${selectedStudent.cpf}`, { method: 'POST', body: formData });
                        const data = await res.json();
                        if (data.success) {
                          toast({ title: "Documento enviado com sucesso!" });
                          const docsRes = await fetch(`/api/documentos/aluno/${selectedStudent.cpf}`);
                          const docsData = await docsRes.json();
                          setStudentDocumentos(docsData || []);
                        } else {
                          toast({ title: "Erro ao enviar documento", variant: "destructive" });
                        }
                      } catch {
                        toast({ title: "Erro ao enviar documento", variant: "destructive" });
                      } finally {
                        setUploadingDocumento(false);
                        e.target.value = '';
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" disabled={uploadingDocumento} onClick={() => document.getElementById('doc-upload-pec')?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingDocumento ? 'Enviando...' : 'Enviar Documento'}
                  </Button>
                  <span className="text-xs text-gray-500">PDF, JPG, PNG (max 10MB)</span>
                </div>
                {studentDocumentos.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum documento cadastrado.</p>
                ) : (
                  <div className="space-y-2">
                    {studentDocumentos.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between bg-white p-2 rounded border">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-orange-500" />
                          <div>
                            <p className="text-sm font-medium">{doc.nomeArquivo || doc.nome_arquivo}</p>
                            <p className="text-xs text-gray-500">{doc.tipoDocumento || doc.tipo_documento} • {(doc.createdAt || doc.created_at) ? new Date(doc.createdAt || doc.created_at).toLocaleDateString('pt-BR') : ''}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => window.open(doc.urlArquivo || doc.url_arquivo, '_blank')}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={async () => {
                            if (!confirm('Excluir este documento?')) return;
                            try {
                              await fetch(`/api/documentos/${doc.id}`, { method: 'DELETE' });
                              toast({ title: "Documento excluído" });
                              setStudentDocumentos(prev => prev.filter((d: any) => d.id !== doc.id));
                            } catch {
                              toast({ title: "Erro ao excluir documento", variant: "destructive" });
                            }
                          }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        onEdit={() => {
          setShowStudentDetailsModal(false);
          setEditStudentCpf(selectedStudent?.cpf);
          setShowAdicionarAlunoModal(true);
        }}
      />

            {/* Modal Editar Aluno - Simplificado */}
      <Dialog open={showEditStudentModal} onOpenChange={setShowEditStudentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Aluno</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex justify-center">
                {selectedStudent.foto_perfil && selectedStudent.foto_perfil.trim() ? (
                  <img src={selectedStudent.foto_perfil} alt={selectedStudent.nome} className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
                    <User className="w-10 h-10 text-orange-500" />
                  </div>
                )}
              </div>
              <p className="text-center text-sm text-gray-500">
                Para editar os dados completos do aluno, use o formulário de cadastro.
              </p>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  onClick={() => {
                    setShowEditStudentModal(false);
                    setEditStudentCpf(selectedStudent?.cpf);
                    setShowAdicionarAlunoModal(true);
                  }}
                >
                  Abrir Formulário Completo
                </Button>
                <Button variant="outline" onClick={() => setShowEditStudentModal(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Inativação/Reativação */}
      <AlertDialog open={showInativarConfirmModal} onOpenChange={setShowInativarConfirmModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              {selectedStudent?.situacao_atendimento === 'inativo' ? (
                <User className="w-8 h-8 text-green-500" />
              ) : (
                <UserX className="w-8 h-8 text-orange-500" />
              )}
              <AlertDialogTitle>
                {selectedStudent?.situacao_atendimento === 'inativo' ? 'Reativar Aluno' : 'Inativar Aluno'}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              {selectedStudent?.situacao_atendimento === 'inativo' 
                ? `Tem certeza que deseja reativar o aluno "${selectedStudent?.nome}"? O aluno voltará a aparecer na lista de ativos.`
                : `Tem certeza que deseja inativar o aluno "${selectedStudent?.nome}"? O aluno não será excluído, apenas marcado como inativo no sistema. Esta ação pode ser revertida posteriormente.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={selectedStudent?.situacao_atendimento === 'inativo' ? "bg-green-500 hover:bg-green-600" : "bg-orange-500 hover:bg-orange-600"}
              onClick={async () => {
                if (selectedStudent?.cpf) {
                  try {
                    const endpoint = selectedStudent.situacao_atendimento === 'inativo' 
                      ? `/api/students/${selectedStudent.cpf}/reativar`
                      : `/api/students/${selectedStudent.cpf}/inativar`;
                    await apiRequest(endpoint, { method: 'PATCH' });
                    queryClient.invalidateQueries({ queryKey: ['/api/students/all', 'todos'] });
                    toast({
                      title: selectedStudent.situacao_atendimento === 'inativo' ? "Aluno reativado" : "Aluno inativado",
                      description: selectedStudent.situacao_atendimento === 'inativo' 
                        ? `${selectedStudent.nome} foi reativado com sucesso.`
                        : `${selectedStudent.nome} foi inativado com sucesso.`
                    });
                    setShowInativarConfirmModal(false);
                    setSelectedStudent(null);
                  } catch (error) {
                    toast({
                      title: "Erro",
                      description: selectedStudent.situacao_atendimento === 'inativo' 
                        ? "Não foi possível reativar o aluno."
                        : "Não foi possível inativar o aluno.",
                      variant: "destructive"
                    });
                  }
                }
              }}
            >
              {selectedStudent?.situacao_atendimento === 'inativo' ? (
                <>
                  <User className="w-4 h-4 mr-2" />
                  Reativar
                </>
              ) : (
                <>
                  <UserX className="w-4 h-4 mr-2" />
                  Inativar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal para visualizar documento */}
      <Dialog open={!!viewingDocumento} onOpenChange={(open) => !open && setViewingDocumento(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {viewingDocumento?.nomeArquivo || viewingDocumento?.nome_arquivo || 'Documento'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4 min-h-[400px] bg-gray-50 rounded-lg">
            {viewingDocumento && (viewingDocumento.mimeType?.startsWith('image/') || 
              (viewingDocumento.nomeArquivo || viewingDocumento.nome_arquivo || '').match(/\.(jpg|jpeg|png|gif|webp)$/i)) ? (
              <img 
                src={viewingDocumento.urlArquivo || viewingDocumento.url_arquivo} 
                alt={viewingDocumento.nomeArquivo || viewingDocumento.nome_arquivo}
                className="max-w-full max-h-[60vh] object-contain rounded"
              />
            ) : viewingDocumento && (viewingDocumento.mimeType === 'application/pdf' || 
              (viewingDocumento.nomeArquivo || viewingDocumento.nome_arquivo || '').endsWith('.pdf')) ? (
              <iframe 
                src={viewingDocumento.urlArquivo || viewingDocumento.url_arquivo}
                className="w-full h-[60vh] rounded border"
                title="Visualização PDF"
              />
            ) : (
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">
                  Pré-visualização não disponível para este tipo de arquivo.
                </p>
                <Button
                  onClick={() => window.open(viewingDocumento?.urlArquivo || viewingDocumento?.url_arquivo, '_blank')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Documento
                </Button>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-500">
              {viewingDocumento?.tipoDocumento || viewingDocumento?.tipo_documento || 'Documento'} 
              {viewingDocumento?.tamanhoBytes && ` • ${(viewingDocumento.tamanhoBytes / 1024).toFixed(1)} KB`}
            </div>
            <Button variant="outline" onClick={() => setViewingDocumento(null)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlterarSenha 
        open={showAlterarSenhaModal} 
        onOpenChange={setShowAlterarSenhaModal}
      />

            <Dialog open={showImportModal} onOpenChange={(v) => !v && setShowImportModal(false)}>
       <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Importar Alunos (PEC)
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload */}
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".xlsx,.csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
              <Button
                onClick={handleRunPreview}
                disabled={!importFile || importLoading}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {importLoading ? "Lendo..." : "Fazer preview"}
              </Button>
            </div>

            {importLoading && (
              <div className="space-y-2">
                <Progress value={70} />
                <p className="text-xs text-gray-500">Processando planilha...</p>
              </div>
            )}

            {/* Preview */}
            {previewData && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3 text-sm">
                  <Badge variant="outline">Total: {previewData.totalRows}</Badge>
                  <Badge className="bg-green-100 text-green-800">
                    Válidas: {previewData.validCount}
                  </Badge>
                  <Badge className="bg-red-100 text-red-800">
                    Inválidas: {previewData.invalidCount}
                  </Badge>
                </div>

                {/* Tabela válidas */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                    <p className="font-semibold text-sm">Linhas válidas</p>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSelectedValidIndexes(
                            previewData.validRows.map((_: any, idx: number) => idx)
                          )
                        }
                      >
                        Selecionar todas
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedValidIndexes([])}
                      >
                        Limpar seleção
                      </Button>
                    </div>
                  </div>

                  {/* Scroll vertical (ScrollArea) + scroll lateral (overflow-x-auto) */}
                  <ScrollArea className="h-[260px]">
                    <div className="w-full overflow-x-auto">
                      <Table className="min-w-[1100px] whitespace-nowrap">
                        <TableHeader className="sticky top-0 z-10 bg-gray-50">
                          <TableRow>
                            <TableHead className="w-[60px]">OK</TableHead>
                            <TableHead>Linha</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>CPF</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Data Nasc.</TableHead>

                            {/* (Opcional) se você quiser mostrar mais colunas no preview,
                                já deixa preparado aqui:
                            <TableHead>Gênero</TableHead>
                            <TableHead>Data Entrada</TableHead>
                            <TableHead>Forma Acesso</TableHead>
                            */}
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {previewData.validRows.map((r: any, idx: number) => {
                            const checked = selectedValidIndexes.includes(idx);
                            const p = r.payload || {};
                            return (
                              <TableRow key={idx}>
                                <TableCell>
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(v) => {
                                      const isChecked = !!v;
                                      setSelectedValidIndexes((prev) => {
                                        if (isChecked) return prev.includes(idx) ? prev : [...prev, idx];
                                        return prev.filter((x) => x !== idx);
                                      });
                                    }}
                                  />
                                </TableCell>
                                <TableCell>{r.rowNumber}</TableCell>
                                <TableCell className="font-medium">{p.nome_completo || "-"}</TableCell>
                                <TableCell>{formatCPF(p.cpf)}</TableCell>
                                <TableCell>{p.telefone || "-"}</TableCell>
                                <TableCell>{p.data_nascimento || "-"}</TableCell>

                                {/* (Opcional) exemplos se adicionar mais colunas:
                                <TableCell>{p.genero ? p.genero.charAt(0).toUpperCase() + p.genero.slice(1).toLowerCase() : "-"}</TableCell>
                                <TableCell>{p.data_entrada || "-"}</TableCell>
                                <TableCell>{p.forma_acesso || "-"}</TableCell>
                                */}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                </div>

                {/* Tabela inválidas */}
                {previewData.invalidRows.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-red-50">
                      <p className="font-semibold text-sm text-red-800">
                        Linhas inválidas (não serão importadas)
                      </p>
                    </div>

                    <ScrollArea className="h-[180px]">
                      <div className="w-full overflow-x-auto">
                        <Table className="min-w-[900px]">
                          <TableHeader className="sticky top-0 z-10 bg-red-50">
                            <TableRow>
                              <TableHead>Linha</TableHead>
                              <TableHead>Erros</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previewData.invalidRows.map((r: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell>{r.rowNumber}</TableCell>
                                <TableCell className="text-red-700">
                                  {(r.errors || [])
                                    .map((e: any) => e?.message || String(e))
                                    .join(" | ") || "Erro desconhecido"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Botões (commit/cancelar) - dentro do preview */}
                <div className="flex justify-end թվական gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowImportModal(false)}
                    disabled={importLoading}
                  >
                    Cancelar
                  </Button>

                  <Button
                    onClick={handleCommitImport}
                    disabled={importLoading || selectedValidIndexes.length === 0}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {importLoading ? "Importando..." : `Importar (${selectedValidIndexes.length})`}
                  </Button>
                </div>
              </div>
            )}
            </div>
          </DialogContent>
        </Dialog>
        {turmaParaVincular && (
          <VincularProfessoresTurma
            turmaId={turmaParaVincular.id}
            turmaTipo="pec"
            programa="pec"
            open={showVincularProfessoresModal}
            onOpenChange={setShowVincularProfessoresModal}
            turmaNome={turmaParaVincular.title || turmaParaVincular.name}
          />
        )}
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

      {/* Modal: Planos de Aula dos Professores de PEC */}
      <Dialog open={showPlanosAulaPecModal} onOpenChange={setShowPlanosAulaPecModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-500" />
              Planos de Aula — Professores de PEC
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Visualize todos os planos de aula registrados pelos professores do programa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Filtrar por professor ou título..."
              value={filtroProfPec}
              onChange={e => setFiltroProfPec(e.target.value)}
            />

            {loadingPlanosPec ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500" />
              </div>
            ) : planosAulaPec.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Nenhum plano de aula registrado ainda.</p>
              </div>
            ) : planoAulaPecDetalhes ? (
              <div className="space-y-4">
                <button className="text-sm text-blue-600 hover:underline" onClick={() => setPlanoAulaPecDetalhes(null)}>← Voltar para a lista</button>
                <div className="border rounded-lg p-5 space-y-3 bg-gray-50">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-lg font-semibold">{planoAulaPecDetalhes.titulo}</h3>
                    <Badge variant="outline" className="capitalize">{planoAulaPecDetalhes.status || 'rascunho'}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">Professor:</span> <span className="font-medium">{planoAulaPecDetalhes.professorNome || '—'}</span></div>
                    <div><span className="text-gray-500">Turma:</span> <span>{planoAulaPecDetalhes.turmaNome}</span></div>
                    <div><span className="text-gray-500">Data:</span> <span>{planoAulaPecDetalhes.data ? new Date(planoAulaPecDetalhes.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</span></div>
                    {planoAulaPecDetalhes.duracaoMinutos && <div><span className="text-gray-500">Duração:</span> <span>{planoAulaPecDetalhes.duracaoMinutos} min</span></div>}
                  </div>
                  <div><p className="text-gray-500 text-sm font-medium mb-1">Objetivos</p><p className="text-sm whitespace-pre-wrap">{planoAulaPecDetalhes.objetivos}</p></div>
                  <div><p className="text-gray-500 text-sm font-medium mb-1">Conteúdo</p><p className="text-sm whitespace-pre-wrap">{planoAulaPecDetalhes.conteudo}</p></div>
                  <div><p className="text-gray-500 text-sm font-medium mb-1">Metodologia</p><p className="text-sm whitespace-pre-wrap">{planoAulaPecDetalhes.metodologia}</p></div>
                  {planoAulaPecDetalhes.recursos && <div><p className="text-gray-500 text-sm font-medium mb-1">Recursos</p><p className="text-sm whitespace-pre-wrap">{planoAulaPecDetalhes.recursos}</p></div>}
                  {planoAulaPecDetalhes.avaliacao && <div><p className="text-gray-500 text-sm font-medium mb-1">Avaliação</p><p className="text-sm whitespace-pre-wrap">{planoAulaPecDetalhes.avaliacao}</p></div>}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {planosAulaPec
                  .filter((p: any) =>
                    !filtroProfPec ||
                    (p.professorNome || '').toLowerCase().includes(filtroProfPec.toLowerCase()) ||
                    (p.titulo || '').toLowerCase().includes(filtroProfPec.toLowerCase())
                  )
                  .map((p: any) => (
                    <div key={p.id} className="border rounded-lg p-4 hover:border-teal-500 hover:bg-teal-50 transition-colors cursor-pointer" onClick={() => setPlanoAulaPecDetalhes(p)}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{p.titulo}</p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            <span className="text-teal-600 font-medium">{p.professorNome || 'Professor'}</span>
                            {' · '}{p.turmaNome}
                            {' · '}{p.data ? new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0 capitalize text-xs">{p.status || 'rascunho'}</Badge>
                      </div>
                    </div>
                  ))}
                {planosAulaPec.filter((p: any) =>
                  !filtroProfPec ||
                  (p.professorNome || '').toLowerCase().includes(filtroProfPec.toLowerCase()) ||
                  (p.titulo || '').toLowerCase().includes(filtroProfPec.toLowerCase())
                ).length === 0 && (
                  <p className="text-center text-gray-500 py-4">Nenhum resultado para o filtro aplicado.</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Relatórios de Aulas dos Professores de PEC */}
      <Dialog open={showRelatoriosAulaPecModal} onOpenChange={setShowRelatoriosAulaPecModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-teal-500" />
              Relatórios de Aulas — Professores de PEC
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Aulas ministradas e registradas pelos professores do programa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Filtrar por professor ou título..."
              value={filtroProfPec}
              onChange={e => setFiltroProfPec(e.target.value)}
            />

            {loadingRelatoriosPec ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500" />
              </div>
            ) : aulasRegistradasPec.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Nenhuma aula registrada ainda.</p>
              </div>
            ) : relatorioAulaPecDetalhes ? (
              <div className="space-y-4">
                <button className="text-sm text-blue-600 hover:underline" onClick={() => setRelatorioAulaPecDetalhes(null)}>← Voltar para a lista</button>
                <div className="border rounded-lg p-5 space-y-3 bg-gray-50">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-lg font-semibold">{relatorioAulaPecDetalhes.titulo}</h3>
                    <Badge variant="outline" className="capitalize">{relatorioAulaPecDetalhes.statusAula || 'ministrada'}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">Professor:</span> <span className="font-medium">{relatorioAulaPecDetalhes.professorNome || '—'}</span></div>
                    <div><span className="text-gray-500">Turma:</span> <span>{relatorioAulaPecDetalhes.turmaNome}</span></div>
                    <div><span className="text-gray-500">Data:</span> <span>{relatorioAulaPecDetalhes.data ? new Date(relatorioAulaPecDetalhes.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</span></div>
                    {relatorioAulaPecDetalhes.duracaoMinutos && <div><span className="text-gray-500">Duração:</span> <span>{relatorioAulaPecDetalhes.duracaoMinutos} min</span></div>}
                  </div>
                  <div><p className="text-gray-500 text-sm font-medium mb-1">Conteúdo Ministrado</p><p className="text-sm whitespace-pre-wrap">{relatorioAulaPecDetalhes.conteudoMinistrado}</p></div>
                  {relatorioAulaPecDetalhes.competenciasTrabalhas && <div><p className="text-gray-500 text-sm font-medium mb-1">Competências Trabalhadas</p><p className="text-sm whitespace-pre-wrap">{relatorioAulaPecDetalhes.competenciasTrabalhas}</p></div>}
                  {relatorioAulaPecDetalhes.observacoes && <div><p className="text-gray-500 text-sm font-medium mb-1">Observações</p><p className="text-sm whitespace-pre-wrap">{relatorioAulaPecDetalhes.observacoes}</p></div>}
                  {relatorioAulaPecDetalhes.fotoComprovante && (
                    <div>
                      <p className="text-gray-500 text-sm font-medium mb-2">Foto Comprovante</p>
                      <img src={relatorioAulaPecDetalhes.fotoComprovante} alt="Foto comprovante" className="rounded-lg max-h-48 object-cover border" />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {aulasRegistradasPec
                  .filter((a: any) =>
                    !filtroProfPec ||
                    (a.professorNome || '').toLowerCase().includes(filtroProfPec.toLowerCase()) ||
                    (a.titulo || '').toLowerCase().includes(filtroProfPec.toLowerCase())
                  )
                  .map((a: any) => (
                    <div key={a.id} className="border rounded-lg p-4 hover:border-teal-500 hover:bg-teal-50 transition-colors cursor-pointer" onClick={() => setRelatorioAulaPecDetalhes(a)}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{a.titulo}</p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            <span className="text-teal-600 font-medium">{a.professorNome || 'Professor'}</span>
                            {' · '}{a.turmaNome}
                            {' · '}{a.data ? new Date(a.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                            {a.fotoComprovante && <span className="ml-2 text-green-600">· com foto</span>}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0 capitalize text-xs">{a.statusAula || 'ministrada'}</Badge>
                      </div>
                    </div>
                  ))}
                {aulasRegistradasPec.filter((a: any) =>
                  !filtroProfPec ||
                  (a.professorNome || '').toLowerCase().includes(filtroProfPec.toLowerCase()) ||
                  (a.titulo || '').toLowerCase().includes(filtroProfPec.toLowerCase())
                ).length === 0 && (
                  <p className="text-center text-gray-500 py-4">Nenhum resultado para o filtro aplicado.</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal justificativa de falta - aparece antes do modal de alimentação */}
      <Dialog open={showJustificativaFaltaModal} onOpenChange={(open) => { if (!open) setShowJustificativaFaltaModal(false); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-orange-500" />
              Justificar Faltas ({modalJustFaltaItems.length} aluno{modalJustFaltaItems.length !== 1 ? 's' : ''})
            </DialogTitle>
            <DialogDescription>Selecione o motivo da falta para cada aluno antes de finalizar.</DialogDescription>
          </DialogHeader>
          {modalJustFaltaItems.length > 1 && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  const firstMotivo = modalJustFaltaItems[0]?.motivo || 'Sem justificativa';
                  const firstObs = modalJustFaltaItems[0]?.obs || '';
                  const firstContaComoPresenca = MOTIVOS_FALTA_PEC.find(m => m.label === firstMotivo)?.contaComoPresenca ?? false;
                  setModalJustFaltaItems(modalJustFaltaItems.map(i => ({
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
            {modalJustFaltaItems.map((item, idx) => (
              <div key={item.cpf} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="font-medium text-sm flex-1 truncate">{item.nome}</span>
                  <Badge variant="destructive" className="text-xs">Falta</Badge>
                </div>
                <Select
                  value={item.motivo}
                  onValueChange={(val) => {
                    const info = MOTIVOS_FALTA_PEC.find(m => m.label === val);
                    const updated = [...modalJustFaltaItems];
                    updated[idx] = { ...item, motivo: val, contaComoPresenca: info?.contaComoPresenca ?? false };
                    setModalJustFaltaItems(updated);
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Selecione o motivo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MOTIVOS_FALTA_PEC.map(m => (
                      <SelectItem key={m.label} value={m.label}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {MOTIVOS_FALTA_PEC.find(m => m.label === item.motivo)?.contaComoPresenca ? (
                  <p className="text-xs text-green-600 font-medium">✓ Conta como presença</p>
                ) : (
                  <p className="text-xs text-red-500">✗ Não conta como presença</p>
                )}
                <Textarea
                  placeholder="Observações (opcional)"
                  value={item.obs}
                  onChange={(e) => {
                    const updated = [...modalJustFaltaItems];
                    updated[idx] = { ...item, obs: e.target.value };
                    setModalJustFaltaItems(updated);
                  }}
                  className="text-sm resize-none h-16"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowJustificativaFaltaModal(false)} className="flex-1">Cancelar</Button>
            <Button
              className="flex-1 bg-green-500 hover:bg-green-600"
              onClick={() => {
                if (!modalJustFaltaItems.every(i => i.motivo)) {
                  toast({ title: "Preencha todos os motivos", variant: "destructive" });
                  return;
                }
                const updated = presencasChamada.map(p => {
                  const justItem = modalJustFaltaItems.find(i => i.cpf === p.alunoCpf);
                  if (justItem) return { ...p, justificativa: justItem.motivo, justificativaObs: justItem.obs, contaComoPresenca: justItem.contaComoPresenca };
                  return p;
                });
                setPresencasChamada(updated);
                setShowJustificativaFaltaModal(false);
                setShowAlimentacaoModal(true);
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
              disabled={salvarChamadaMutation.isPending}
              onClick={() => { setShowAlimentacaoModal(false); salvarChamadaMutation.mutate({ teveAlimentacao: true }); }}
            >
              ✓ Sim, teve lanche
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              disabled={salvarChamadaMutation.isPending}
              onClick={() => { setShowAlimentacaoModal(false); salvarChamadaMutation.mutate({ teveAlimentacao: false }); }}
            >
              Não teve
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    );
  }