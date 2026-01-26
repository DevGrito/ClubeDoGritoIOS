import React, { useState, useEffect } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AlterarSenhaMonitor from "@/components/AlterarSenhaMonitor";
import { ComprehensiveStudentForm, maskPhone } from "@/components/comprehensive-student-form";
import { TurmaInclusaoForm } from "@/components/TurmaInclusaoForm";
import { InstanceForm, ActivityForm } from "@/components/pec/forms";
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
  XCircle,
  Edit,
  Eye,
  Shield,
  ExternalLink,
  GraduationCap,
  Briefcase,
  ArrowRight,
  Pencil,
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
  Save
} from "lucide-react";

type MonitorVertente = 'selecao' | 'pec' | 'inclusao';

export default function MonitorPage() {
  const [location, setLocation] = useLocation();
  
  const getVertente = (): MonitorVertente => {
    if (location.includes('/monitor/pec')) return 'pec';
    if (location.includes('/monitor/inclusao')) return 'inclusao';
    return 'selecao';
  };
  
  const vertente = getVertente();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedAluno, setSelectedAluno] = useState<any>(null);
  const [showEditAlunoModal, setShowEditAlunoModal] = useState(false);
  const [showViewAlunoModal, setShowViewAlunoModal] = useState(false);
  const [showAddAlunoModal, setShowAddAlunoModal] = useState(false);
  const [showAlterarSenhaModal, setShowAlterarSenhaModal] = useState(false);
  
  // Estados para participantes de Inclusão Produtiva
  const [selectedParticipante, setSelectedParticipante] = useState<any>(null);
  const [showViewParticipanteModal, setShowViewParticipanteModal] = useState(false);
  const [showEditParticipanteModal, setShowEditParticipanteModal] = useState(false);
  const [statusFilterInclusao, setStatusFilterInclusao] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  
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
  const [grupoSelecionado, setGrupoSelecionado] = useState<any>(null);
  const [alunosDoGrupo, setAlunosDoGrupo] = useState<any[]>([]);
  const [searchAlunoGrupo, setSearchAlunoGrupo] = useState('');
  
  // State for editar grupo
  const [showEditarGrupoModal, setShowEditarGrupoModal] = useState(false);
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
  const [presencaData, setPresencaData] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  });
  const [presencaGrupo, setPresencaGrupo] = useState('');
  const [presencas, setPresencas] = useState<Array<{ alunoCpf: string, nome: string, presente: boolean }>>([]);
  const [showHistoricoChamadas, setShowHistoricoChamadas] = useState(false);
  const [historicoExpandido, setHistoricoExpandido] = useState<number | null>(null);
  const [historicoFiltroNome, setHistoricoFiltroNome] = useState('');
  const [historicoFiltroData, setHistoricoFiltroData] = useState('');
  const [historicoFiltroTurma, setHistoricoFiltroTurma] = useState('');
  
  // States para cadastro de alunos/participantes por vertente
  const [showCadastroModal, setShowCadastroModal] = useState(false);
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
  const userPapel = localStorage.getItem("userPapel");
  const userEmail = localStorage.getItem("userEmail") || "";
  
  // Estados para edição de perfil do monitor
  const [perfilNome, setPerfilNome] = useState(userName);
  const [perfilEmail, setPerfilEmail] = useState(userEmail);
  const [perfilTelefone, setPerfilTelefone] = useState("");
  const [perfilAreaAtuacao, setPerfilAreaAtuacao] = useState("Monitoria Educacional");
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  // Verificar autenticação - só permite acesso via login de monitor ou dev
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const devAccess = urlParams.get('dev_access') === 'true';
    const devSession = sessionStorage.getItem('dev_session') === 'active';
    const isMonitorLoggedIn = userPapel && (userPapel.includes('monitor') || userPapel === 'monitor_pec' || userPapel === 'monitor_inclusao');
    
    if (!isMonitorLoggedIn && !devAccess && !devSession) {
      window.location.href = '/login/monitor';
    }
  }, [userPapel]);

  // Query para buscar dados do dashboard do monitor
const { data: dashboardData, isLoading } = useQuery({
  queryKey: ['/api/monitor/dashboard', userId],
  queryFn: async () => {
    const response = await fetch(`/api/monitor/dashboard/${userId}`, {
      headers: { 'x-user-id': userId || '' }
    });
    if (!response.ok) throw new Error('Failed to fetch dashboard data');
    return response.json();
  },
  enabled: vertente !== 'selecao' && !!userId && !!monitorId
});
  
  // Query para buscar dados do perfil do monitor (por vertente)
  const { data: perfilData } = useQuery({
    queryKey: ['/api/monitor/perfil', userId, vertente],
    queryFn: async () => {
      const response = await fetch(`/api/monitor/${userId}/perfil?vertente=${vertente}`, {
        headers: { 'x-user-id': userId || '' }
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!userId && !!vertente && !!monitorId
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
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || ''
        },
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
    queryKey: ['/api/monitor/alunos', userId],
    queryFn: async () => {
      const response = await fetch(`/api/monitor/${userId}/alunos`, {
        headers: { 'x-user-id': userId || '' }
      });
      if (!response.ok) throw new Error('Failed to fetch alunos');
      return response.json();
    },
   enabled: !!userId && !!monitorId && (activeSection === 'alunos' || activeSection === 'grupos' || showNovoGrupoModal || showGerenciarAlunosModal || showEditarGrupoModal)
  });

  // Query for available participantes
  const { data: participantesDisponiveis } = useQuery({
    queryKey: ['/api/monitor/participantes-disponiveis', userId],
    queryFn: async () => {
      const response = await fetch(`/api/monitor/${userId}/participantes-disponiveis`, {
        headers: { 'x-user-id': userId || '' }
      });
      if (!response.ok) throw new Error('Failed to fetch participantes');
      return response.json();
    },
    enabled: !!userId && !!monitorId && showAddAlunoModal
  });


  const { data: atividadesData, isLoading: atividadesLoading } = useQuery({
    queryKey: ['/api/monitor/atividades', userId, vertente],
    queryFn: async () => {
      const isDevMode =
        window.location.search.includes('dev_access=true') ||
        window.location.pathname.includes('/dev');

      const response = await fetch(
        `/api/monitor/${userId}/atividades?vertente=${vertente}${isDevMode ? '&dev_access=true' : ''}`,
        {
          headers: {
            'x-user-id': userId || '',
            ...(isDevMode && { 'x-dev-access': 'true' })
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch atividades');
      return response.json();
    },
    enabled: vertente !== 'selecao' && !!userId && !!monitorId
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
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" });
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
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível adicionar aluno.", variant: "destructive" });
    }
  });

  // ========== QUERIES ESPECÍFICAS POR VERTENTE ==========
  
  // Query para listar todos os alunos PEC
  const { data: alunosPec, isLoading: alunosPecLoading, refetch: refetchAlunosPec } = useQuery({
    queryKey: ['/api/monitor/pec/alunos'],
    queryFn: async () => {
      const response = await fetch('/api/monitor/pec/alunos', {
        headers: { 'x-user-id': userId || '' }
      });
      if (!response.ok) throw new Error('Failed to fetch alunos PEC');
      return response.json();
    },
    enabled: !!userId && !!monitorId && (vertente === 'pec' || showNovoGrupoModal || showGerenciarAlunosModal || showEditarGrupoModal || activeSection === 'acompanhamento')
  });

  // Query para listar todos os participantes de Inclusão
  const { data: participantesInclusao, isLoading: participantesLoading, refetch: refetchParticipantes } = useQuery({
    queryKey: ['/api/monitor/inclusao/participantes'],
    queryFn: async () => {
      const response = await fetch('/api/monitor/inclusao/participantes', {
        headers: { 'x-user-id': userId || '' }
      });
      if (!response.ok) throw new Error('Failed to fetch participantes');
      return response.json();
    },
    enabled: !!userId && !!monitorId && (vertente === 'inclusao' || activeSection === 'acompanhamento')
  });

  // Query para buscar grupos do banco de dados (Inclusão)
  const { data: gruposData = [], isLoading: isLoadinggrupos } = useQuery({
    queryKey: ['/api/grupos-inclusao'],
    queryFn: async () => {
      const response = await fetch('/api/grupos-inclusao');
      if (!response.ok) throw new Error('Failed to fetch grupos');
      return response.json();
    },
    enabled: vertente === 'inclusao'
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
      toast({ title: "Erro ao cadastrar", description: error.message || "Não foi possível criar o aluno.", variant: "destructive" });
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
      toast({ title: "Erro ao cadastrar", description: error.message || "Não foi possível criar o participante.", variant: "destructive" });
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
      toast({ title: "Erro", description: error.message || "Não foi possível inativar o aluno.", variant: "destructive" });
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
      toast({ title: "Erro", description: error.message || "Não foi possível reativar o aluno.", variant: "destructive" });
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
      toast({ title: "Erro", description: error.message || "Não foi possível inativar o participante.", variant: "destructive" });
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
      toast({ title: "Erro", description: error.message || "Não foi possível reativar o participante.", variant: "destructive" });
    }
  });

  // Mutation para atualizar participante Inclusão
  const atualizarParticipanteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/monitor/inclusao/participantes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
      toast({ title: "Erro", description: error.message || "Não foi possível atualizar o participante.", variant: "destructive" });
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
      console.error("Error creating atividade:", error);
      toast({ title: "Erro", description: "Não foi possível criar atividade.", variant: "destructive" });
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
      console.error("Error deleting atividade:", error);
      toast({ title: "Erro", description: "Não foi possível excluir atividade.", variant: "destructive" });
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
      console.error("Error updating atividade:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar.", variant: "destructive" });
    }
  });

  // Query for grupos do monitor (sempre carregar para o resumo)
    const { data: monitorGruposData, isLoading: gruposLoading } = useQuery({
      queryKey: ['/api/monitor/grupos', userId, vertente],
      queryFn: async () => {
        const response = await fetch(`/api/monitor/${userId}/grupos?vertente=${vertente}`, {
          headers: { 'x-user-id': userId || '' }
        });
        if (!response.ok) throw new Error('Failed to fetch grupos');
        return response.json();
      },
      enabled: vertente !== 'selecao' && !!userId
    });

  // Mutation for creating grupo
  const createGrupoMutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await apiRequest(`/api/monitor/${userId}/grupos`, {
        method: 'POST',
        body: JSON.stringify({ ...formData, vertente })
      });
      return response;
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
            
              await apiRequest(`/api/monitor/${userId}/grupos/${novoGrupo.id}/alunos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
                body: JSON.stringify(body)
              });
          } catch (e) {
            console.error('Erro ao adicionar aluno à grupo:', e);
          }
        }
      }
      queryClient.invalidateQueries({ queryKey: ['/api/monitor/grupos', userId, vertente] });
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

  // Mutation for updating grupo
  const updateGrupoMutation = useMutation({
    mutationFn: async ({ grupoId, formData }: { grupoId: number, formData: any }) => {
      const response = await fetch(`/api/monitor/${userId}/grupos/${grupoId}?vertente=${vertente}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Failed to update turma');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/monitor/grupos', userId, vertente] });
      toast({ title: "Turma atualizada!", description: "As alterações foram salvas." });
      setShowEditarGrupoModal(false);
      setGrupoSelecionado(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao atualizar turma", 
        description: error.message || "Não foi possível atualizar a turma.",
        variant: "destructive" 
      });
    }
  });

  // Query for registros
  const { data: registrosData, isLoading: registrosLoading } = useQuery({
    queryKey: ['/api/monitor/registros', userId, vertente],
    queryFn: async () => {
      const response = await fetch(`/api/monitor/${userId}/registros?vertente=${vertente}`, {
        headers: { 'x-user-id': userId || '' }
      });
      if (!response.ok) throw new Error('Failed to fetch registros');
      return response.json();
    },
    enabled: !!userId && !!monitorId && (activeSection === 'registro' || activeSection === 'relatorios')
  });

  // Query to fetch students when a group is selected
  const { data: grupoAlunosData, isLoading: grupoAlunosLoading } = useQuery({
    queryKey: ['/api/monitor/grupos/alunos', userId, presencaGrupo],
    queryFn: async () => {
      const response = await fetch(`/api/monitor/${userId}/grupos/${presencaGrupo}/alunos`, {
        headers: { 'x-user-id': userId || '' }
      });
      if (!response.ok) throw new Error('Failed to fetch students');
      return response.json();
    },
    enabled: !!userId && !!monitorId && !!presencaGrupo && activeSection === 'presenca'
  });

  // Update presencas when students data changes
  useEffect(() => {
    if (grupoAlunosData && Array.isArray(grupoAlunosData)) {
      setPresencas(grupoAlunosData.map((aluno: any) => ({
        alunoCpf: aluno.id || aluno.cpf,
        nome: aluno.nome,
        presente: true
      })));
    }
  }, [grupoAlunosData]);

  // Query para buscar histórico de chamadas
  const { data: historicoChamadas, isLoading: historicoLoading, refetch: refetchHistorico } = useQuery({
    queryKey: ['/api/monitor/historico-chamadas', userId, vertente],
    queryFn: async () => {
      const response = await fetch(`/api/monitor/${userId}/historico-chamadas?vertente=${vertente}`, {
        headers: { 'x-user-id': userId || '' }
      });
      if (!response.ok) throw new Error('Failed to fetch historico');
      return response.json();
    },
    enabled: !!userId && !!monitorId && (activeSection === 'presenca' || activeSection === 'relatorios')
  });

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
      console.error("Error creating registro:", error);
      toast({ title: "Erro", description: "Não foi possível criar registro.", variant: "destructive" });
    }
  });

  // Mutation to save attendance (usando nova rota que funciona com grupos diretamente)
  const saveChamadaMutation = useMutation({
    mutationFn: async () => {
      if (!presencaGrupo || !presencaData) {
        throw new Error('Grupo e data são obrigatórios');
      }
      
      // Usar nova rota que funciona com grupos (sem precisar de grupo)
      const response = await apiRequest(`/api/monitor/${userId}/registro-presenca`, {
        method: 'POST',
        body: JSON.stringify({
          grupoId: parseInt(presencaGrupo),
          data: presencaData,
          observacoes: '',
          presencas: presencas.map(p => ({
            alunoCpf: p.alunoCpf,
            alunoNome: p.nome,
            presente: p.presente
          }))
        })
      });
      
      return response;
    },
    onSuccess: () => {
      toast({ 
        title: "Chamada finalizada!", 
        description: "Presença registrada com sucesso." 
      });
      // Reset form
      setPresencaGrupo('');
      setPresencas([]);
    },
    onError: (error: any) => {
      console.error("Error saving chamada:", error);
      toast({ 
        title: "Erro", 
        description: error.message || "Não foi possível salvar a chamada.", 
        variant: "destructive" 
      });
    }
  });

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

  if (isLoading) {
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

  const vertenteInfo = {
    pec: { nome: 'PEC - Esporte e Cultura', cor: 'blue', icon: GraduationCap },
    inclusao: { nome: 'Inclusão Produtiva', cor: 'green', icon: Briefcase },
    selecao: { nome: 'Monitor', cor: 'gray', icon: UserCheck }
  };
  
  const currentVertente = vertenteInfo[vertente];
  const VertenteIcon = currentVertente.icon;

  return (
    <div className="min-h-screen bg-gray-50" data-testid="monitor-page">
      {/* Header */}
      <div className={`bg-white border-b border-gray-200 px-4 py-4 md:px-6 ${vertente === 'pec' ? 'border-l-4 border-l-orange-500' : vertente === 'inclusao' ? 'border-l-4 border-l-green-500' : ''}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${vertente === 'pec' ? 'bg-orange-500' : vertente === 'inclusao' ? 'bg-green-500' : 'bg-gray-500'} rounded-full flex items-center justify-center`}>
              <VertenteIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900" data-testid="text-welcome">
                Monitor - {currentVertente.nome}
              </h1>
              <p className="text-gray-600" data-testid="text-username">Bem-vindo, {userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={vertente === 'pec' ? 'border-orange-500 text-orange-600' : vertente === 'inclusao' ? 'border-green-500 text-green-600' : ''} data-testid="badge-role">
              {vertente === 'pec' ? '🎓 PEC' : vertente === 'inclusao' ? '💼 Inclusão' : '👥 Monitor'}
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Resumo de Atividades */}
          <Card data-testid="card-resumo">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-orange-500" />
                Resumo de Atividades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{vertente === 'pec' ? 'Alunos' : 'Participantes'}:</span>
                <span className="font-semibold" data-testid="text-total-alunos">
                  {vertente === 'pec' ? (alunosPec?.length || 0) : (participantesInclusao?.length || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Turmas Ativas:</span>
                <span className="font-semibold" data-testid="text-turmas-ativas">
                  {(monitorGruposData?.filter((g: any) => g.status !== 'inativo').length || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Atividades Realizadas:</span>
                <span className="font-semibold" data-testid="text-atividades-realizadas">
                  {Array.isArray(atividadesData) ? atividadesData.filter((a: any) => a.tipo !== 'evento').length : 0}
                </span>
              </div>
            </CardContent>
          </Card>

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
                  onClick={() => setActiveSection('alunos')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Meus Alunos
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'presenca' ? 'default' : 'outline'}
                  data-testid="button-presenca"
                  onClick={() => setActiveSection('presenca')}
                >
                  <Clock className="w-4 h-4 mr-2" />
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
                  onClick={() => setActiveSection('atividades')}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Minhas Atividades
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'registro' ? 'default' : 'outline'}
                  data-testid="button-registro-atividades"
                  onClick={() => setActiveSection('registro')}
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
                  onClick={() => setActiveSection('grupos')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Minhas Turmas
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'calendario' ? 'default' : 'outline'}
                  data-testid="button-calendario"
                  onClick={() => setActiveSection('calendario')}
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
                  onClick={() => setActiveSection('relatorios')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Relatórios
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'acompanhamento' ? 'default' : 'outline'}
                  data-testid="button-acompanhamento"
                  onClick={() => setActiveSection('acompanhamento')}
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
                  className="w-full" 
                  variant={activeSection === 'configuracoes' ? 'default' : 'outline'}
                  data-testid="button-perfil"
                  onClick={() => setActiveSection('configuracoes')}
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
            Área exclusiva para monitores • Sistema RBAC Isolado
          </p>
        </div>

        {/* Área de Conteúdo Dinâmica */}
        <div className="mt-8">
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

          {activeSection === 'alunos' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {vertente === 'pec' ? '📚 Alunos do PEC' : vertente === 'inclusao' ? '💼 Participantes Inclusão' : 'Meus Alunos'}
                </CardTitle>
                <Button 
                  size="sm" 
                  className={vertente === 'pec' ? 'bg-orange-500 hover:bg-orange-600' : vertente === 'inclusao' ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'} 
                  onClick={() => {
                    setEditingCpf(undefined);
                    vertente ? setShowCadastroModal(true) : setShowAddAlunoModal(true);
                  }} 
                  data-testid="button-add-aluno"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {vertente === 'pec' ? 'Novo Aluno' : vertente === 'inclusao' ? 'Novo Participante' : 'Adicionar Aluno'}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder={vertente === 'pec' ? 'Buscar alunos por nome ou CPF...' : vertente === 'inclusao' ? 'Buscar participantes...' : 'Buscar alunos...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10" 
                      />
                    </div>
                    {vertente !== 'inclusao' && (
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
                    )}
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
                                <TableCell>{aluno.cpf}</TableCell>
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
                                      onClick={() => {
                                        setEditingCpf(aluno.cpf);
                                        setViewMode(true);
                                        setShowCadastroModal(true);
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
                  ) : vertente === 'inclusao' ? (
                    <>
                      {/* Filtro de status */}
                      <div className="flex gap-2 mb-4">
                        <Button
                          size="sm"
                          variant={statusFilterInclusao === 'todos' ? 'default' : 'outline'}
                          onClick={() => setStatusFilterInclusao('todos')}
                          className={statusFilterInclusao === 'todos' ? 'bg-green-500 hover:bg-green-600' : ''}
                        >
                          Todos
                        </Button>
                        <Button
                          size="sm"
                          variant={statusFilterInclusao === 'ativo' ? 'default' : 'outline'}
                          onClick={() => setStatusFilterInclusao('ativo')}
                          className={statusFilterInclusao === 'ativo' ? 'bg-green-500 hover:bg-green-600' : ''}
                        >
                          Ativos
                        </Button>
                        <Button
                          size="sm"
                          variant={statusFilterInclusao === 'inativo' ? 'default' : 'outline'}
                          onClick={() => setStatusFilterInclusao('inativo')}
                          className={statusFilterInclusao === 'inativo' ? 'bg-red-500 hover:bg-red-600' : ''}
                        >
                          Inativos
                        </Button>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Idade</TableHead>
                            <TableHead>Gênero</TableHead>
                            <TableHead>Programa</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {participantesLoading ? (
                            <TableRow><TableCell colSpan={6}>Carregando...</TableCell></TableRow>
                          ) : (participantesInclusao || []).filter((p: any) => {
                            const matchSearch = !searchTerm || 
                              (p.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (p.cpf || '').includes(searchTerm);
                            const matchStatus = statusFilterInclusao === 'todos' || 
                              (p.status || 'ativo') === statusFilterInclusao;
                            return matchSearch && matchStatus;
                          }).length > 0 ? (
                            (participantesInclusao || []).filter((p: any) => {
                              const matchSearch = !searchTerm || 
                                (p.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (p.cpf || '').includes(searchTerm);
                              const matchStatus = statusFilterInclusao === 'todos' || 
                                (p.status || 'ativo') === statusFilterInclusao;
                              return matchSearch && matchStatus;
                            })
                            .sort((a: any, b: any) => (a.nome || '').localeCompare(b.nome || ''))
                            .map((part: any) => (
                              <TableRow key={part.id}>
                                <TableCell className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  {part.nome}
                                </TableCell>
                                <TableCell>{part.idade} anos</TableCell>
                                <TableCell>{part.genero}</TableCell>
                                <TableCell>{part.programaAtual || '-'}</TableCell>
                                <TableCell>
                                  <Badge className={part.status === 'inativo' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                                    {part.status || 'ativo'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedParticipante(part);
                                        setShowViewParticipanteModal(true);
                                      }}
                                      title="Visualizar"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedParticipante(part);
                                        setShowEditParticipanteModal(true);
                                      }}
                                      title="Editar"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    {(part.status || 'ativo') === 'ativo' ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 hover:bg-red-50"
                                        onClick={() => inativarParticipanteMutation.mutate(part.id)}
                                        disabled={inativarParticipanteMutation.isPending}
                                        title="Inativar"
                                      >
                                        <UserMinus className="w-4 h-4" />
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-green-600 hover:bg-green-50"
                                        onClick={() => reativarParticipanteMutation.mutate(part.id)}
                                        disabled={reativarParticipanteMutation.isPending}
                                        title="Reativar"
                                      >
                                        <UserPlus className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow><TableCell colSpan={6}>Nenhum participante encontrado</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </>
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

          {activeSection === 'presenca' && (
            <Card>
              <CardHeader>
                <CardTitle>Controle de Presença</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-2">Data da Atividade</label>
                      <Input 
                        type="date" 
                        value={presencaData}
                        onChange={(e) => setPresencaData(e.target.value)}
                        data-testid="input-presenca-data"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-2">Turma</label>
                      <Select value={presencaGrupo} onValueChange={setPresencaGrupo}>
                        <SelectTrigger data-testid="select-presenca-grupo">
                          <SelectValue placeholder="Selecione a turma" />
                        </SelectTrigger>
                        <SelectContent>
                          {monitorGruposData && Array.isArray(monitorGruposData) && monitorGruposData.length > 0 ? (
                            monitorGruposData.map((grupo: any) => (
                              <SelectItem key={grupo.id} value={grupo.id.toString()}>
                                {grupo.nome} {grupo.nivel ? `- ${grupo.nivel}` : ''}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-grupos" disabled>Nenhum grupo disponível</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      className="bg-green-500 hover:bg-green-600"
                      onClick={() => saveChamadaMutation.mutate()}
                      disabled={!presencaGrupo || presencas.length === 0 || saveChamadaMutation.isPending}
                      data-testid="button-finalizar-chamada"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {saveChamadaMutation.isPending ? 'Salvando...' : 'Finalizar Chamada'}
                    </Button>
                  </div>
                  
                  {presencaGrupo && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-4">
                        Lista de Presença 
                        {grupoAlunosLoading && <span className="text-sm text-gray-500 ml-2">Carregando...</span>}
                      </h3>
                      <div className="space-y-3">
                        {presencas.length > 0 ? (
                          presencas.map((aluno, index) => (
                            <div key={aluno.alunoCpf} className="flex items-center justify-between p-3 border rounded">
                              <div className="flex items-center gap-3">
                                <User className="w-4 h-4 text-gray-400" />
                                <span>{aluno.nome}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <Checkbox 
                                    checked={aluno.presente}
                                    onCheckedChange={(checked) => {
                                      const newPresencas = [...presencas];
                                      newPresencas[index].presente = checked === true;
                                      setPresencas(newPresencas);
                                    }}
                                    data-testid={`checkbox-presente-${aluno.alunoCpf}`}
                                  />
                                  <span className="text-sm text-green-600">Presente</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <Checkbox 
                                    checked={!aluno.presente}
                                    onCheckedChange={(checked) => {
                                      const newPresencas = [...presencas];
                                      newPresencas[index].presente = checked !== true;
                                      setPresencas(newPresencas);
                                    }}
                                    data-testid={`checkbox-falta-${aluno.alunoCpf}`}
                                  />
                                  <span className="text-sm text-red-600">Falta</span>
                                </label>
                              </div>
                            </div>
                          ))
                        ) : grupoAlunosLoading ? (
                          <div className="text-center py-8 text-gray-500">Carregando alunos...</div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">Nenhum aluno encontrado nesta grupo</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {!presencaGrupo && (
                    <div className="text-center py-8 text-gray-500 border rounded-lg">
                      Selecione uma turma para visualizar a lista de alunos
                    </div>
                  )}
                  
                  {/* Botão para ver histórico */}
                  <div className="mt-6 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setShowHistoricoChamadas(!showHistoricoChamadas);
                        if (!showHistoricoChamadas) {
                          refetchHistorico();
                        }
                      }}
                    >
                      <HistoryIcon className="w-4 h-4 mr-2" />
                      {showHistoricoChamadas ? 'Ocultar Histórico' : 'Ver Histórico de Chamadas'}
                    </Button>
                  </div>
                  
                  {/* Histórico de Chamadas */}
                  {showHistoricoChamadas && (
                    <div className="mt-4 border rounded-lg p-4">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <HistoryIcon className="w-5 h-5" />
                        Histórico de Chamadas
                      </h3>
                      
                      {/* Filtros de pesquisa */}
                      <div className="flex gap-3 mb-4 flex-wrap">
                        <div className="flex-1 min-w-[200px]">
                          <Input
                            placeholder="Pesquisar por nome do aluno..."
                            value={historicoFiltroNome}
                            onChange={(e) => setHistoricoFiltroNome(e.target.value)}
                            className="w-full"
                          />
                        </div>
                        <div className="w-48">
                          <select
                            value={historicoFiltroTurma}
                            onChange={(e) => setHistoricoFiltroTurma(e.target.value)}
                            className="w-full border rounded-md p-2 text-sm"
                          >
                            <option value="">Todas as turmas</option>
                            {gruposData?.map((g: any) => (
                              <option key={g.id} value={g.nome}>{g.nome}</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-48">
                          <Input
                            type="date"
                            value={historicoFiltroData}
                            onChange={(e) => setHistoricoFiltroData(e.target.value)}
                            placeholder="Filtrar por data"
                          />
                        </div>
                        {(historicoFiltroNome || historicoFiltroData || historicoFiltroTurma) && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setHistoricoFiltroNome('');
                              setHistoricoFiltroData('');
                              setHistoricoFiltroTurma('');
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      {historicoLoading ? (
                        <div className="text-center py-8 text-gray-500">Carregando histórico...</div>
                      ) : historicoChamadas && Array.isArray(historicoChamadas) && historicoChamadas.length > 0 ? (
                        <div className="space-y-3">
                          {historicoChamadas
                            .filter((chamada: any) => {
                              const matchData = !historicoFiltroData || chamada.data === historicoFiltroData;
                              const matchTurma = !historicoFiltroTurma || chamada.grupo?.toLowerCase().includes(historicoFiltroTurma.toLowerCase());
                              const matchNome = !historicoFiltroNome || 
                                chamada.grupo?.toLowerCase().includes(historicoFiltroNome.toLowerCase()) ||
                                chamada.presencas?.some((p: any) => 
                                  (p.alunoNome || p.nome)?.toLowerCase().includes(historicoFiltroNome.toLowerCase())
                                );
                              return matchData && matchTurma && matchNome;
                            })
                            .map((chamada: any) => (
                            <div key={chamada.id} className="border rounded-lg overflow-hidden">
                              <div 
                                className="p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                                onClick={() => setHistoricoExpandido(historicoExpandido === chamada.id ? null : chamada.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <Calendar className="w-4 h-4 text-gray-500" />
                                  <span className="font-medium">
                                    {new Date(chamada.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                                  </span>
                                  <span className="text-gray-500">-</span>
                                  <span>{chamada.grupo}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-green-600 font-medium">
                                    {chamada.totalPresentes} presentes
                                  </span>
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
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          Nenhum registro de chamada encontrado
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Minhas Turmas</CardTitle>
                <Button className="bg-purple-500 hover:bg-purple-600" onClick={() => setShowNovaTurmaModal(true)} data-testid="button-nova-turma">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Turma
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {gruposLoading ? (
                    <p className="text-gray-500">Carregando grupos...</p>
                  ) : monitorGruposData && Array.isArray(monitorGruposData) && monitorGruposData.length > 0 ? (
                    monitorGruposData.map((grupo: any) => (
                      <div key={grupo.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">{grupo.nome}</h3>
                          <Badge className="bg-purple-100 text-purple-800">
                            {grupo.status === 'emandamento' ? 'Em Andamento' : 
                             grupo.status === 'ativo' ? 'Ativo' : 
                             grupo.status ? grupo.status.charAt(0).toUpperCase() + grupo.status.slice(1) : 'Ativo'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Nível:</span>
                            <p className="font-medium">{grupo.nivel || '-'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Alunos:</span>
                            <p className="font-medium">{grupo.alunos || 0}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Frequência:</span>
                            <p className="font-medium">{grupo.frequencia ? `${grupo.frequencia}%` : '-'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Atividade:</span>
                            <p className="font-medium">{grupo.atividade || '-'}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                          <Button size="sm" variant="outline" onClick={() => {
                            setGrupoSelecionado(grupo);
                            setShowGerenciarAlunosModal(true);
                            // Fetch alunos da grupo
                            fetch(`/api/monitor/${userId}/grupos/${grupo.id}/alunos`, {
                              credentials: 'include',
                              headers: { 'x-user-id': userId || '' }
                            })
                              .then(res => res.json())
                              .then(data => setAlunosDoGrupo(Array.isArray(data) ? data : []))
                              .catch(() => setAlunosDoGrupo([]));
                          }}>
                            <Users className="w-4 h-4 mr-1" />
                            Gerenciar Alunos
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            setPresencaGrupo(grupo.id.toString());
                            setActiveSection('presenca');
                          }}>
                            <UserCheck className="w-4 h-4 mr-1" />
                            Fazer Chamada
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            setGrupoSelecionado(grupo);
                            setEditarGrupoForm({
                              nome: grupo.nome || '',
                              nivel: grupo.nivel || '',
                              atividade: grupo.atividade || '',
                              alunos: grupo.alunos || 0,
                              status: grupo.status || 'ativo',
                              horarioInicio: grupo.horarioInicio || '',
                              horarioFim: grupo.horarioFim || '',
                              diasSemana: grupo.diasSemana || []
                            });
                            setSearchAlunoGrupo('');
                            // Buscar alunos da grupo ao abrir modal de edição
                            fetch(`/api/monitor/${userId}/grupos/${grupo.id}/alunos`, {
                              credentials: 'include',
                              headers: { 'x-user-id': userId || '' }
                            })
                              .then(res => res.json())
                              .then(data => setAlunosDoGrupo(Array.isArray(data) ? data : []))
                              .catch(() => setAlunosDoGrupo([]));
                            setShowEditarGrupoModal(true);
                          }}>
                            <Pencil className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
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
                          placeholder={`Nome do ${vertente === 'pec' ? 'aluno' : 'participante'}...`} 
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
                        const nome = item.nome || item.nomeCompleto || '';
                        if (acompanhamentoBusca && !nome.toLowerCase().includes(acompanhamentoBusca.toLowerCase())) return false;
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
        </div>

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
                  placeholder="Buscar aluno por nome..." 
                  value={searchNovoGrupo}
                  onChange={(e) => setSearchNovoGrupo(e.target.value)}
                  className="mb-2"
                />
                <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                  {vertente === 'pec' && alunosPec && searchNovoGrupo.length >= 2 && (
                    alunosPec
                      .filter((al: any) => 
                        al.nome_completo?.toLowerCase().includes(searchNovoGrupo.toLowerCase()) &&
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
                        p.nomeCompleto?.toLowerCase().includes(searchNovoGrupo.toLowerCase()) &&
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
                    {alunosDoGrupo.map((al: any) => (
                      <div key={al.id || al.cpf} className="flex items-center justify-between p-2">
                        <span>{al.nome}</span>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={async () => {
                            try {
                              let response;
                              if (vertente === 'inclusao') {
                                response = await fetch(`/api/participantes-inclusao/${al.id}/turmas/${grupoSelecionado.id}`, {
                                  method: 'DELETE',
                                  credentials: 'include'
                                });
                              } else {
                                // PEC: usar endpoint unenroll
                                response = await fetch('/api/professor/unenroll', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify({ studentCpf: al.cpf, classId: grupoSelecionado.id })
                                });
                              }
                              if (!response.ok) throw new Error('Erro ao remover');
                              setAlunosDoGrupo(prev => prev.filter(a => a.id !== al.id));
                              queryClient.invalidateQueries({ queryKey: ['/api/monitor', userId, 'grupos'] });
                              toast({ title: "Aluno removido da turma" });
                            } catch (e) {
                              toast({ title: "Erro ao remover", variant: "destructive" });
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
                  placeholder="Buscar por nome..." 
                  value={searchAlunoGrupo}
                  onChange={(e) => setSearchAlunoGrupo(e.target.value)}
                  className="mb-2"
                />
                <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                  {vertente === 'pec' && alunosPec && (
                    alunosPec
                      .filter((al: any) => 
                        al.nome_completo?.toLowerCase().includes(searchAlunoGrupo.toLowerCase()) &&
                        !alunosDoGrupo.some(a => a.cpf === al.cpf || a.id === al.cpf) &&
                        (al.situacao_atendimento === 'ativo' || al.situacao_atendimento === 'Ativo')
                      )
                      .slice(0, 20)
                      .map((al: any) => (
                        <div key={al.cpf} className="flex items-center justify-between p-2">
                          <span>{al.nome_completo}</span>
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
                        p.nomeCompleto?.toLowerCase().includes(searchAlunoGrupo.toLowerCase()) &&
                        !alunosDoGrupo.some(a => a.id === p.id) &&
                        p.status !== 'inativo'
                      )
                      .slice(0, 20)
                      .map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-2">
                          <span>{p.nomeCompleto}</span>
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
                  queryClient.invalidateQueries({ queryKey: ['/api/monitor/grupos', userId, vertente] });
                }}
              >
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Editar Grupo */}
        <Dialog open={showEditarGrupoModal} onOpenChange={setShowEditarGrupoModal}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
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
                    {alunosDoGrupo.map((al: any) => (
                      <div key={al.id || al.cpf} className="flex items-center justify-between p-2">
                        <span className="text-sm">{al.nome}</span>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          onClick={async () => {
                            try {
                              let response;
                              if (vertente === 'inclusao') {
                                response = await fetch(`/api/participantes-inclusao/${al.id}/turmas/${grupoSelecionado.id}`, {
                                  method: 'DELETE',
                                  credentials: 'include'
                                });
                              } else {
                                // PEC: usar endpoint unenroll
                                response = await fetch('/api/professor/unenroll', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify({ studentCpf: al.cpf, classId: grupoSelecionado.id })
                                });
                              }
                              if (!response.ok) throw new Error('Erro ao remover');
                              setAlunosDoGrupo(prev => prev.filter(a => a.id !== al.id));
                              queryClient.invalidateQueries({ queryKey: ['/api/monitor', userId, 'grupos'] });
                              toast({ title: "Aluno removido da turma" });
                            } catch (e) {
                              toast({ title: "Erro ao remover", variant: "destructive" });
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
                                            participanteId: p.id,
                                            participanteTipo: 'inclusao'
                                          })
                                        });
                                    if (resp.ok) {
                                    setAlunosDoGrupo(prev => [...prev, { id: p.id, nome: p.nomeCompleto, tipo: 'inclusao' }]);
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
                    queryClient.invalidateQueries({ queryKey: ['/api/monitor/grupos', userId, vertente] });
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
                        formData: editarGrupoForm
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

        {/* Modal de Cadastro/Edição - PEC usa ComprehensiveStudentForm */}
        {vertente === 'pec' && (
          <ComprehensiveStudentForm 
            open={showCadastroModal} 
            onClose={() => {
              setShowCadastroModal(false);
              setEditingCpf(undefined);
              setViewMode(false);
              refetchAlunosPec();
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
                      <p className="font-medium">{selectedParticipante.cpf || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Idade</p>
                      <p className="font-medium">{selectedParticipante.idade} anos</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Gênero</p>
                      <p className="font-medium">{selectedParticipante.genero}</p>
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

        {/* Modal de Nova Oficina PEC - usa ActivityForm (mesma tabela do coordenador) */}
        {vertente === 'pec' && (
          <ActivityForm 
            open={showNovaOficinaModal}
            onClose={() => setShowNovaOficinaModal(false)}
          />
        )}
      </div>
    </div>
  );
}
