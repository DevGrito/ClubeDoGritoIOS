import React, { useState, useEffect } from "react";
import { formatCPF } from "@/lib/utils";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import PsicoMonthlyReport from "@/components/psico/PsicoMonthlyReport";
import CoordenadorDashboard from "@/components/CoordenadorDashboard";
import { 
  Users,
  User,
  BookOpen, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut,
  Heart,
  Clock,
  Target,
  Activity,
  UserCheck,
  Shield,
  HeartHandshake,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Filter,
  Download,
  AlertTriangle,
  Upload,
  RefreshCw,
  Lock,
  ExternalLink,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Pencil
} from "lucide-react";
import AlterarSenha from "@/components/AlterarSenha";
import DemandaEspontaneaSection from "@/components/DemandaEspontaneaSection";

const LOWER_WORDS_PT = new Set(['de','da','do','dos','das','e','em','por','para','com','a','o','as','os','ao','aos']);
const normalizeName = (name: string) =>
  name.toLowerCase().split(' ').map((w, i) =>
    i === 0 || !LOWER_WORDS_PT.has(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w
  ).join(' ');

export default function CoordenadorPsicoPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSection, setActiveSection] = useState('dashboard');
  const changeSection = (section: string) => {
    setActiveSection(section);
    requestAnimationFrame(() => {
      setTimeout(() => {
        const el = document.getElementById('coordenador-psico-content-area');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    });
  };
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFamiliaModal, setShowFamiliaModal] = useState(false);
  const [showEditFamiliaModal, setShowEditFamiliaModal] = useState(false);
  const [showViewFamiliaModal, setShowViewFamiliaModal] = useState(false);
  const [showCasoModal, setShowCasoModal] = useState(false);
  const [showAtendimentoModal, setShowAtendimentoModal] = useState(false);
  const [showGrupoModal, setShowGrupoModal] = useState(false);
  const [showViolacaoModal, setShowViolacaoModal] = useState(false);
  const [showMedidaModal, setShowMedidaModal] = useState(false);
  const [showServicoModal, setShowServicoModal] = useState(false);
  const [showEncaminhamentoModal, setShowEncaminhamentoModal] = useState(false);
  const [showHistoricoModal, setShowHistoricoModal] = useState(false);
  const [showDeleteFamiliaDialog, setShowDeleteFamiliaDialog] = useState(false);
  const [showDeleteCasoDialog, setShowDeleteCasoDialog] = useState(false);
  const [confirmDeleteAtendido, setConfirmDeleteAtendido] = useState<{ open: boolean; id: number | null; nome: string }>({ open: false, id: null, nome: '' });
  const [confirmDeleteRegistro, setConfirmDeleteRegistro] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [showViewCasoModal, setShowViewCasoModal] = useState(false);
  const [showEditCasoModal, setShowEditCasoModal] = useState(false);
  const [showAlterarSenhaModal, setShowAlterarSenhaModal] = useState(false);
  const [selectedParticipante, setSelectedParticipante] = useState<any>(null);
  const [selectedFamilia, setSelectedFamilia] = useState<any>(null);
  const [selectedCaso, setSelectedCaso] = useState<any>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [buscaAtendido, setBuscaAtendido] = useState('');
  const [atendidoSelecionadoNome, setAtendidoSelecionadoNome] = useState('');
  const [buscaAtendidoFamilia, setBuscaAtendidoFamilia] = useState('');
  const [filtroPrograma, setFiltroPrograma] = useState<'todos' | 'pec' | 'inclusao'>('todos');
  const [buscaParticipante, setBuscaParticipante] = useState('');

  const [freqPrograma, setFreqPrograma] = useState<'pec' | 'inclusao'>('pec');
  const [freqTurmaId, setFreqTurmaId] = useState('');
  const [freqBusca, setFreqBusca] = useState('');
  const [freqExpandida, setFreqExpandida] = useState<string | null>(null);
  const [showCadastroAtendido, setShowCadastroAtendido] = useState(false);
  const [cadastroAtendidoForm, setCadastroAtendidoForm] = useState({ nome: '', cpf: '', data_nascimento: '', telefone: '', endereco: '', observacoes: '' });

  const [confSubTab, setConfSubTab] = useState<"realizados" | "novo">("realizados");
  const [confSearchTerm, setConfSearchTerm] = useState("");
  const [confExpandedParticipante, setConfExpandedParticipante] = useState<string | null>(null);
  const [confExpandedRegistro, setConfExpandedRegistro] = useState<number | null>(null);
  const [psicoRegistroForm, setPsicoRegistroForm] = useState({ titulo: "", tipo: "atendimento_individual", conteudo: "", participanteNome: "", participanteCpf: "", participanteDataNascimento: "", data: new Date().toISOString().split("T")[0] });
  const [registroPartBusca, setRegistroPartBusca] = useState("");
  const [registroPartOpen, setRegistroPartOpen] = useState(false);
  const [editRegistroId, setEditRegistroId] = useState<number | null>(null);
  const [editRegistroForm, setEditRegistroForm] = useState({ titulo: "", tipo: "", conteudo: "", participanteNome: "", data: "" });
  const [editRegistroPartBusca, setEditRegistroPartBusca] = useState("");
  const [editRegistroPartOpen, setEditRegistroPartOpen] = useState(false);

  // Estados para registros gerais (coordenador)
  const [geraisSubTab, setGeraisSubTab] = useState<"realizados" | "novo">("realizados");
  const [geraisSearchTerm, setGeraisSearchTerm] = useState("");
  const [geraisForm, setGeraisForm] = useState({ tipo: "espaco_o_grito", conteudo: "", participanteNome: "", participanteCpf: "", data: new Date().toISOString().split("T")[0] });
  const [editGeraisId, setEditGeraisId] = useState<number | null>(null);
  const [editGeraisForm, setEditGeraisForm] = useState({ tipo: "", conteudo: "", participanteNome: "", data: "" });
  const [geraisColaboradoresIds, setGeraisColaboradoresIds] = useState<number[]>([]);
  const [geraisColabBusca, setGeraisColabBusca] = useState("");
  const [editGeraisColaboradoresIds, setEditGeraisColaboradoresIds] = useState<number[]>([]);
  const [editGeraisColabBusca, setEditGeraisColabBusca] = useState("");
  const [viewGeraisGeralRecord, setViewGeraisGeralRecord] = useState<any | null>(null);

  // Estados para formulários
  const [familiaForm, setFamiliaForm] = useState({
    nomeResponsavel: '',
    numeroMembros: 1,
    telefone: '',
    endereco: '',
    status: 'ativo' as 'ativo' | 'inativo' | 'em_acompanhamento' | 'encerrado',
    observacoes: '',
    atendidosSelecionados: [] as number[]
  });

  const [casoForm, setCasoForm] = useState({
    familiaId: null as number | null,
    titulo: '',
    tipo: '', // Ex: "Violência Doméstica", "Dependência Química", etc
    prioridade: 'media' as 'baixa' | 'media' | 'alta' | 'urgente',
    status: 'aberto' as 'aberto' | 'em_atendimento' | 'em_acompanhamento' | 'finalizado',
    descricao: '',
    responsavelNome: ''
  });

  const [atendimentoForm, setAtendimentoForm] = useState({
    familiaId: null as number | null,
    casoId: null as number | null,
    vinculoId: null as number | null,
    programaOrigem: null as 'inclusao' | 'pec' | null,
    tipo: 'individual' as 'individual' | 'familiar' | 'grupo' | 'visita_domiciliar',
    dataAtendimento: new Date().toISOString().split('T')[0],
    duracaoMinutos: 60,
    profissionalResponsavel: '',
    resumo: '',
    observacoes: ''
  });

  const [planoForm, setPlanoForm] = useState({
    familiaId: null as number | null,
    casoId: null as number | null,
    tipoAcompanhamento: '', // Ex: "Visita Domiciliar", "Atendimento Técnico"
    frequencia: '', // Ex: "Semanal", "Quinzenal", "Mensal"
    estrategias: '',
    observacoes: ''
  });

  const [grupoForm, setGrupoForm] = useState({
    nome: '',
    tipo: 'terapeutico' as 'terapeutico' | 'apoio' | 'educativo' | 'oficina',
    facilitador: '',
    diaSemana: '',
    horario: '',
    local: '',
    maxParticipantes: 15,
    status: 'ativo' as 'ativo' | 'inativo' | 'em_formacao',
    descricao: '',
    objetivo: ''
  });

  const [violacaoForm, setViolacaoForm] = useState({
    vitimaNome: '',
    vitimaIdade: '',
    tipoViolacao: '',
    dataRegistro: new Date().toISOString().split('T')[0],
    status: 'em_investigacao' as 'em_investigacao' | 'em_acompanhamento' | 'encaminhado' | 'resolvido',
    prioridade: 'alta' as 'baixa' | 'media' | 'alta' | 'urgente',
    descricao: '',
    medidasTomadas: '',
    orgaosAcionados: ''
  });

  const [medidaForm, setMedidaForm] = useState({
    codigo: '',
    tipo: '',
    beneficiario: '',
    descricao: '',
    dataInicio: new Date().toISOString().split('T')[0],
    prazo: '',
    status: 'ativa' as 'ativa' | 'em_andamento' | 'concluida' | 'cancelada',
    responsavel: '',
    observacoes: ''
  });

  const [servicoForm, setServicoForm] = useState({
    nome: '',
    tipo: '',
    categoria: '',
    endereco: '',
    telefone: '',
    email: '',
    horarioFuncionamento: '',
    responsavel: '',
    descricao: '',
    observacoes: ''
  });

  const [encaminhamentoForm, setEncaminhamentoForm] = useState({
    familiaPessoa: '',
    servicoDestino: '',
    tipo: '',
    dataEncaminhamento: new Date().toISOString().split('T')[0],
    motivo: '',
    status: 'pendente' as 'pendente' | 'em_andamento' | 'concluido' | 'cancelado',
    prioridade: 'media' as 'baixa' | 'media' | 'alta',
    profissionalResponsavel: '',
    observacoes: ''
  });

  const [perfilForm, setPerfilForm] = useState({
    nome: '',
    email: '',
    telefone: ''
  });
  
  // Coordenador sempre exibe "Coordenador" (não pega do localStorage)
  // Pegar ID do coordenador do sessionStorage (login de coordenador)
  const rawCoordData =
    sessionStorage.getItem("coordenador_data") ||
    localStorage.getItem("coordenador_data");

  let coordenadorId: number | null = null;

  try {
    if (rawCoordData) coordenadorId = Number(JSON.parse(rawCoordData)?.id || null);
  } catch {
    coordenadorId = null;
  }

  // ✅ fallback: outras chaves comuns no seu projeto
  const fallbackId =
    Number(localStorage.getItem("coordenadorId") || 0) ||
    Number(localStorage.getItem("userId") || 0);

  // ✅ id final
  const finalId = coordenadorId || fallbackId || null;

  // ✅ userId que habilita as queries
  const userId = finalId ? String(finalId) : null;
  const userName = "Coordenador";
  const userPapel = localStorage.getItem("userPapel");

  // Estados de filtro do dashboard
  const [dashFiltroAno, setDashFiltroAno] = useState(new Date().getFullYear());
  const [dashFiltroMes, setDashFiltroMes] = useState(0);

  // Query para buscar dados do dashboard do coordenador
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/coordenador/dashboard', userId, 'psico'],
    queryFn: async () => {
      const response = await fetch(`/api/coordenador/dashboard/${userId}?area=psico`, {
        credentials: "include",
        headers: { 'x-user-id': userId || '' },
      });
      if (!response.ok) throw new Error('Falha ao carregar dados do painel');
      return response.json();
    },
    enabled: !!userId,
  });

  // Query para buscar dados demográficos do dashboard psico
  const { data: psicoDemogData, isLoading: isPsicoDemogLoading } = useQuery({
    queryKey: ['/api/coordenador/dashboard-demografico-psico', dashFiltroAno, dashFiltroMes],
    queryFn: async () => {
      const response = await fetch(`/api/coordenador/dashboard-demografico-psico?ano=${dashFiltroAno}&mes=${dashFiltroMes}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error('Falha ao carregar dashboard psico');
      return response.json();
    },
  });

  // Query para buscar dados do perfil do coordenador
  const { data: userData } = useQuery({
    queryKey: ['/api/coordenadores', coordenadorId],
    queryFn: async () => {
      const response = await fetch(`/api/coordenadores/${coordenadorId}`);
      if (!response.ok) throw new Error('Falha ao carregar dados do coordenador');
      return response.json();
    },
    enabled: !!coordenadorId,
    
  });

  // Atualizar form quando userData carregar
  useEffect(() => {
    if (userData) {
      setPerfilForm({
        nome: userData.nome || '',
        email: userData.email || '',
        telefone: userData.telefone || ''
      });
    }
  }, [userData]);

  // Mutations para criar entidades psicossociais
  const createFamiliaMutation = useMutation({
    mutationFn: async (data: typeof familiaForm) => {
      // Criar família
      const familia = await apiRequest('/api/psico/familias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || ''
        },
        body: JSON.stringify({
          nomeResponsavel: data.nomeResponsavel,
          numeroMembros: data.numeroMembros,
          telefone: data.telefone,
          endereco: data.endereco,
          status: data.status,
          observacoes: data.observacoes
        })
      });

      // Se houver atendidos selecionados, vincular à família
      if (data.atendidosSelecionados.length > 0) {
        // Separar IDs por programa
        const inclusaoIds: number[] = [];
        const pecIds: number[] = [];
        
        data.atendidosSelecionados.forEach(vinculoId => {
          const participante = participantesData?.find((p: any) => p.vinculo_id === vinculoId);
          if (participante) {
            if (participante.programa_origem === 'inclusao') {
              inclusaoIds.push(vinculoId);
            } else if (participante.programa_origem === 'pec') {
              pecIds.push(vinculoId);
            }
          }
        });

        await apiRequest('/api/psico/vincular-atendidos-familia', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId || ''
          },
         body: JSON.stringify({
        familiaId: familia?.data?.id, // <-- backend retorna { success, data }
        inclusaoIds,
        pecIds
          })
       });
      }

      return familia;
    },
    onSuccess: () => {
      toast({
        title: "Família cadastrada",
        description: "A família foi cadastrada com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/psico/familias'] });
      queryClient.invalidateQueries({ queryKey: ['/api/psico/participantes'] });
      setShowFamiliaModal(false);
      setBuscaAtendidoFamilia('');
      setFamiliaForm({
        nomeResponsavel: '',
        numeroMembros: 1,
        telefone: '',
        endereco: '',
        status: 'ativo',
        observacoes: '',
        atendidosSelecionados: []
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cadastrar família",
        description: error.message || "Não foi possível cadastrar a família. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const updateFamiliaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: typeof familiaForm }) => {
      return await apiRequest(`/api/psico/familias/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || ''
        },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Família atualizada",
        description: "A família foi atualizada com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/psico/familias'] });
      setShowEditFamiliaModal(false);
      setSelectedFamilia(null);
      setFamiliaForm({
        nomeResponsavel: '',
        numeroMembros: 1,
        telefone: '',
        endereco: '',
        status: 'ativo',
        observacoes: '',
        atendidosSelecionados: []
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar família",
        description: error.message || "Não foi possível atualizar a família. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const createCasoMutation = useMutation({
    mutationFn: async (data: typeof casoForm) => {
      return await apiRequest('/api/psico/casos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || ''
        },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Caso criado",
        description: "O caso foi criado com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/psico/casos'] });
      setShowCasoModal(false);
      setCasoForm({
        familiaId: null,
        titulo: '',
        tipo: '',
        prioridade: 'media',
        status: 'aberto',
        descricao: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar caso",
        description: error.message || "Não foi possível criar o caso. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const createAtendimentoMutation = useMutation({
    mutationFn: async (data: typeof atendimentoForm) => {
      return await apiRequest('/api/psico/atendimentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || ''
        },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Atendimento registrado",
        description: "O atendimento foi registrado com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/psico/atendimentos'] });
      setBuscaAtendido('');
      setAtendidoSelecionadoNome('');
      setAtendimentoForm({
        familiaId: null,
        casoId: null,
        vinculoId: null,
        programaOrigem: null,
        tipo: 'individual',
        dataAtendimento: new Date().toISOString().split('T')[0],
        duracaoMinutos: 60,
        profissionalResponsavel: '',
        resumo: '',
        observacoes: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar atendimento",
        description: error.message || "Não foi possível registrar o atendimento. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const createPlanoMutation = useMutation({
    mutationFn: async (data: typeof planoForm) => {
      return await apiRequest('/api/psico/planos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || ''
        },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Plano criado",
        description: "O plano de acompanhamento foi criado com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/psico/planos'] });
      setPlanoForm({
        familiaId: null,
        casoId: null,
        tipoAcompanhamento: '',
        frequencia: '',
        estrategias: '',
        observacoes: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar plano",
        description: error.message || "Não foi possível criar o plano. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const deleteFamiliaMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/psico/familias/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/psico/familias'] });
      toast({
        title: "Família excluída!",
        description: "A família foi excluída com sucesso."
      });
      setShowDeleteFamiliaDialog(false);
      setSelectedFamilia(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir família",
        description: error.message || "Não foi possível excluir a família.",
        variant: "destructive"
      });
    }
  });

  const deleteCasoMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/psico/casos/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/psico/casos'] });
      toast({
        title: "Caso excluído!",
        description: "O caso foi arquivado com sucesso."
      });
      setShowDeleteCasoDialog(false);
      setSelectedCaso(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir caso",
        description: error.message || "Não foi possível excluir o caso.",
        variant: "destructive"
      });
    }
  });

  const { data: participantesData = [], isLoading: isLoadingParticipantes } = useQuery({
    queryKey: ['/api/psico/participantes', userId, filtroPrograma],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filtroPrograma && filtroPrograma !== 'todos') params.set('filtro', filtroPrograma);
      const response = await fetch(`/api/psico/participantes?${params.toString()}`, {
        credentials: "include",
        headers: { 'x-user-id': userId || '' },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || 'Falha ao carregar participantes');
      }

      const data = await response.json();
      const lista = data?.participantes || data?.data || [];
      if (!Array.isArray(lista)) return [];
      for (const p of lista) {
        if (p.nome) p.nome = p.nome.replace(/^\s+|\s+$/g, '');
      }
      lista.sort((a: any, b: any) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
      return lista;
    },
    enabled: !!userId,
  });

  const participantesFiltrados = buscaParticipante
    ? participantesData.filter((p: any) => p.nome?.toLowerCase().includes(buscaParticipante.toLowerCase()))
    : participantesData;

  // Query para buscar histórico de atendimentos de um participante
  const { data: historicoData, isLoading: isLoadingHistorico } = useQuery({
    queryKey: ['/api/psico/atendimentos/participante', selectedParticipante?.vinculo_id, selectedParticipante?.programa_origem],
    enabled: !!selectedParticipante?.vinculo_id && !!selectedParticipante?.programa_origem && showHistoricoModal,
    queryFn: async () => {
      const url = `/api/psico/atendimentos/participante?vinculoId=${selectedParticipante.vinculo_id}&programaOrigem=${selectedParticipante.programa_origem}`;
      const response = await fetch(url, {
        headers: {
          'x-user-id': userId || ''
        }
      });
      if (!response.ok) throw new Error('Erro ao buscar histórico');
      return response.json();
    }
  });

  // Mutation para sincronizar participantes existentes
const syncParticipantesMutation = useMutation({
  mutationFn: async () => {
    const resp = await fetch('/api/psico/sync-participantes', {
      method: "POST",
      credentials: "include",
      headers: { 'x-user-id': userId || '' },
    });

    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(json?.error || "Erro ao sincronizar");
    return json;
  },
  onSuccess: (data: any) => {
    const total = data?.vinculosCriados?.total ?? 0;
    const inc = data?.vinculosCriados?.inclusao ?? 0;
    const pec = data?.vinculosCriados?.pec ?? 0;

    toast({
      title: "Sincronização concluída!",
      description: `${total} vínculos criados (${inc} Inclusão + ${pec} PEC)`,
    });

    queryClient.invalidateQueries({ queryKey: ['/api/psico/participantes'] });
  },
  onError: (error: any) => {
    toast({
      title: "Erro na sincronização",
      description: error.message || "Não foi possível sincronizar. Tente novamente.",
      variant: "destructive",
    });
  },
});

  const updatePerfilMutation = useMutation({
    mutationFn: async (data: typeof perfilForm) => {
      return await apiRequest(`/api/coordenadores/${coordenadorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/coordenadores', coordenadorId] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message || "Não foi possível atualizar o perfil. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const handleSavePerfil = () => {
    updatePerfilMutation.mutate(perfilForm);
  };

  // Query para buscar famílias
  const { data: familias = [], isLoading: isLoadingFamilias } = useQuery<any[]>({
    queryKey: ['/api/psico/familias'],
    queryFn: async () => {
      const response = await fetch('/api/psico/familias', {
        headers: { 'x-user-id': userId || '' }
      });
      if (!response.ok) throw new Error('Erro ao buscar famílias');
      return response.json();
    },
    enabled: !!userId,
    select: (res: any) => res?.data || [], // <-- backend retorna { success, data }
  })
  // Query para buscar casos
  const { data: casos = [], isLoading: isLoadingCasos } = useQuery({
    queryKey: ['/api/psico/casos'],
    queryFn: async () => {
      const response = await fetch('/api/psico/casos', {
        headers: { 'x-user-id': userId || '' }
      });
      if (!response.ok) throw new Error('Erro ao buscar casos');
      return response.json();
    },
    enabled: !!userId,
    select: (res: any) => res?.data || [], // <-- backend retorna { success, data }
  });

  // Query para buscar atendimentos
const { data: atendimentos = [], isLoading: isLoadingAtendimentos } = useQuery({
  queryKey: ['/api/psico/atendimentos'],
  queryFn: async () => {
    const response = await fetch('/api/psico/atendimentos', {
      headers: { 'x-user-id': userId || '' }
    });
    if (!response.ok) throw new Error('Erro ao buscar atendimentos');
    const result = await response.json();
    console.log('🔍 [ATENDIMENTOS DEBUG] Dados recebidos:', result);
    console.log('🔍 [ATENDIMENTOS DEBUG] Array (data):', result?.data);
    console.log('🔍 [ATENDIMENTOS DEBUG] Quantidade:', result?.data?.length);
    return result;
  },
  enabled: !!userId,
  select: (res: any) => {
    const atends = res?.data || []; // <-- backend retorna { success, data }
    console.log('🔍 [ATENDIMENTOS DEBUG] Após select:', atends);
    console.log('🔍 [ATENDIMENTOS DEBUG] Após select - quantidade:', atends.length);
    return atends;
  },
});
  // Query para buscar planos
const { data: planos = [], isLoading: isLoadingPlanos } = useQuery({
  queryKey: ['/api/psico/planos'],
  queryFn: async () => {
    const response = await fetch('/api/psico/planos', {
      headers: { 'x-user-id': userId || '' }
    });
    if (!response.ok) throw new Error('Erro ao buscar planos');
    return response.json();
  },
  enabled: !!userId,
  select: (res: any) => res?.data || [], // <-- backend retorna { success, data }
});
  const { data: atendidosRegistrados = [], isLoading: loadingAtendidosReg } = useQuery({
    queryKey: ['/api/psico/coordenador/atendidos-registrados'],
    queryFn: async () => {
      const res = await fetch(`/api/psico/coordenador/atendidos-registrados`, { credentials: 'include', headers: { 'x-user-id': userId || '' } });
      if (!res.ok) return [];
      const json = await res.json();
      return json.atendidos || [];
    },
    enabled: !!userId && activeSection === 'participantes',
  });

  const { data: atendidosComunidade = [], isLoading: loadingComunidade } = useQuery({
    queryKey: ['/api/psico/atendidos-comunidade'],
    queryFn: async () => {
      const res = await fetch('/api/psico/atendidos-comunidade', { headers: { 'x-user-id': userId || '' } });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!userId && activeSection === 'participantes',
  });

  const { data: psicoDashStats } = useQuery({
    queryKey: ['/api/psico/dashboard-stats'],
    queryFn: async () => {
      const res = await fetch(`/api/psico/dashboard-stats`, { headers: { 'x-user-id': userId || '' } });
      if (!res.ok) return {};
      return res.json();
    },
    enabled: activeSection === 'participantes',
  });

  const { data: freqChamadasData = { chamadas: [] }, isLoading: loadingFreqChamadas } = useQuery({
    queryKey: ['/api/psico/chamadas', freqPrograma, freqTurmaId],
    queryFn: async () => {
      let url = `/api/psico/chamadas?programa=${freqPrograma}`;
      if (freqTurmaId) url += `&turmaId=${freqTurmaId}`;
      const res = await fetch(url, { headers: { 'x-user-id': userId || '' } });
      if (!res.ok) return { chamadas: [] };
      return res.json().catch(() => ({ chamadas: [] }));
    },
    enabled: !!userId && activeSection === 'frequencias',
  });
  const freqHistorico = freqChamadasData?.chamadas || [];

  const { data: freqTurmas = [] } = useQuery({
    queryKey: ['/api/psico/freq-turmas', freqPrograma, userId],
    queryFn: async () => {
      if (freqPrograma === 'pec') {
        const res = await fetch('/api/pec/instances', { credentials: 'include', headers: { 'x-user-id': userId || '' } });
        const json = await res.json().catch(() => []);
        if (!res.ok) return [];
        const arr = Array.isArray(json) ? json : [];
        return arr.map((t: any) => ({ id: t.id, nome: t.name || t.title || `Turma ${t.id}` }));
      } else {
        const res = await fetch('/api/turmas-inclusao', { credentials: 'include', headers: { 'x-user-id': userId || '' } });
        const json = await res.json().catch(() => []);
        if (!res.ok) return [];
        const arr = Array.isArray(json) ? json : [];
        return arr.map((t: any) => ({ id: t.id, nome: t.nome || t.title || `Turma ${t.id}` }));
      }
    },
    enabled: !!userId && activeSection === 'frequencias',
  });

  const { data: todosAtendidosParaAtendimento = [] } = useQuery({
    queryKey: ['/api/psico/todos-atendidos-para-atendimento'],
    queryFn: async () => {
      const res = await fetch('/api/psico/todos-atendidos-para-atendimento', { headers: { 'x-user-id': userId || '' } });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!userId && (activeSection === 'atendimentos' || activeSection === 'confidencial' || showAtendimentoModal),
  });

  const cadastroAtendidoMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/psico/atendidos-comunidade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
        body: JSON.stringify({ ...data, coordenador_id: userId ? parseInt(userId) : null }),
      });
    },
    onSuccess: () => {
      toast({ title: "Atendido cadastrado com sucesso!" });
      setShowCadastroAtendido(false);
      setCadastroAtendidoForm({ nome: '', cpf: '', data_nascimento: '', telefone: '', endereco: '', observacoes: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/psico/atendidos-comunidade'] });
      queryClient.invalidateQueries({ queryKey: ['/api/psico/todos-atendidos-para-atendimento'] });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao cadastrar atendido", description: error.message, variant: "destructive" });
    }
  });

  const deleteAtendidoComunidadeMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/psico/atendidos-comunidade/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId || '' },
      });
    },
    onSuccess: () => {
      toast({ title: "Atendido removido com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['/api/psico/atendidos-comunidade'] });
      queryClient.invalidateQueries({ queryKey: ['/api/psico/todos-atendidos-para-atendimento'] });
    },
  });

  const { data: coordRegistrosConf = [], isLoading: loadingRegistrosConf } = useQuery({
    queryKey: ['/api/psico/coordenador/registros-confidenciais'],
    queryFn: async () => {
      const res = await fetch('/api/psico/coordenador/registros-confidenciais', { credentials: 'include', headers: { 'x-user-id': userId || '' } });
      const json = await res.json().catch(() => []);
      if (!res.ok) throw new Error(json?.error || "Falha ao buscar registros");
      return Array.isArray(json) ? json : [];
    },
    enabled: !!userId && activeSection === 'confidencial',
  });

  const createRegistroConfMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/psico/coordenador/registros-confidenciais', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/psico/coordenador/registros-confidenciais'] });
      toast({ title: "Registro salvo!" });
      setConfSubTab("realizados");
      setPsicoRegistroForm({ titulo: "", tipo: "atendimento_individual", conteudo: "", participanteNome: "", participanteCpf: "", participanteDataNascimento: "", data: new Date().toISOString().split("T")[0] });
    },
    onError: (error: any) => toast({ title: "Erro ao salvar registro", description: error.message || "Tente novamente.", variant: "destructive" }),
  });

  const deleteRegistroConfMutation = useMutation({
    mutationFn: async (registroId: number) => {
      return apiRequest(`/api/psico/coordenador/registros-confidenciais/${registroId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/psico/coordenador/registros-confidenciais'] });
      toast({ title: "Registro excluído!" });
    },
    onError: (error: any) => toast({ title: "Erro ao excluir registro", description: error.message || "Tente novamente.", variant: "destructive" }),
  });

  const updateRegistroConfMutation = useMutation({
    mutationFn: async ({ id, ...body }: { id: number; titulo: string; tipo: string; conteudo: string; participanteNome: string; data: string }) => {
      return apiRequest(`/api/psico/coordenador/registros-confidenciais/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/psico/coordenador/registros-confidenciais'] });
      toast({ title: "Registro atualizado!" });
      setEditRegistroId(null);
    },
    onError: (error: any) => toast({ title: "Erro ao atualizar registro", description: error.message || "Tente novamente.", variant: "destructive" }),
  });

  // Query e mutations para registros gerais (coordenador)
  const { data: coordRegistrosGerais = [], isLoading: loadingRegistrosGerais } = useQuery({
    queryKey: ['/api/psico/coordenador/registros-gerais'],
    queryFn: async () => {
      const res = await fetch('/api/psico/coordenador/registros-gerais', { credentials: 'include', headers: { 'x-user-id': userId || '' } });
      const json = await res.json().catch(() => []);
      if (!res.ok) throw new Error(json?.error || "Falha ao buscar registros gerais");
      return Array.isArray(json) ? json : [];
    },
    enabled: !!userId && activeSection === 'registros-gerais',
  });

  const { data: colaboradoresDataPsico } = useQuery<any>({
    queryKey: ["/api/colaboradores"],
    queryFn: async () => {
      const res = await fetch(`/api/colaboradores?pageSize=200`, { credentials: "include" });
      return res.json();
    },
  });
  const todosColaboradoresPsico: any[] = (colaboradoresDataPsico?.items || []).sort((a: any, b: any) => a.nome.localeCompare(b.nome));

  // Query para acompanhamentos pedagógicos dos professores
  const { data: todosAcompanhamentos = [] } = useQuery({
    queryKey: ['/api/professor/acompanhamentos/all'],
    queryFn: async () => {
      const res = await fetch('/api/professor/acompanhamentos/all');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!userId && activeSection === 'acompanhamentos',
  });

  const createGeraisMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/psico/coordenador/registros-gerais', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/psico/coordenador/registros-gerais'] });
      toast({ title: "Registro salvo!" });
      setGeraisSubTab("realizados");
      setGeraisForm({ tipo: "espaco_o_grito", conteudo: "", participanteNome: "", participanteCpf: "", data: new Date().toISOString().split("T")[0] });
      setGeraisColaboradoresIds([]);
      setGeraisColabBusca("");
    },
    onError: (error: any) => toast({ title: "Erro ao salvar registro", description: error.message || "Tente novamente.", variant: "destructive" }),
  });

  const deleteGeraisMutation = useMutation({
    mutationFn: async (registroId: number) => {
      return apiRequest(`/api/psico/coordenador/registros-gerais/${registroId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/psico/coordenador/registros-gerais'] });
      toast({ title: "Registro excluído!" });
    },
    onError: (error: any) => toast({ title: "Erro ao excluir registro", description: error.message || "Tente novamente.", variant: "destructive" }),
  });

  const updateGeraisMutation = useMutation({
    mutationFn: async ({ id, ...body }: { id: number; tipo: string; conteudo: string; participanteNome: string; data: string; colaboradoresIds?: number[] | null }) => {
      return apiRequest(`/api/psico/coordenador/registros-gerais/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/psico/coordenador/registros-gerais'] });
      toast({ title: "Registro atualizado!" });
      setEditGeraisId(null);
      setEditGeraisColaboradoresIds([]);
      setEditGeraisColabBusca("");
    },
    onError: (error: any) => toast({ title: "Erro ao atualizar registro", description: error.message || "Tente novamente.", variant: "destructive" }),
  });

  // Handlers para salvar dados
  const handleSaveFamilia = () => {
    if (!familiaForm.nomeResponsavel.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome do responsável da família.",
        variant: "destructive"
      });
      return;
    }
    createFamiliaMutation.mutate(familiaForm);
  };

  const handleUpdateFamilia = () => {
    if (!familiaForm.nomeResponsavel.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome do responsável da família.",
        variant: "destructive"
      });
      return;
    }
    if (selectedFamilia?.id) {
      updateFamiliaMutation.mutate({ id: selectedFamilia.id, data: familiaForm });
    }
  };

  const handleSaveCaso = () => {
    if (!casoForm.titulo.trim() || !casoForm.tipo.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título e tipo do caso.",
        variant: "destructive"
      });
      return;
    }
    createCasoMutation.mutate(casoForm);
  };

  const handleSaveAtendimento = () => {
    if (!atendimentoForm.dataAtendimento) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione a data do atendimento.",
        variant: "destructive"
      });
      return;
    }

    if (!atendimentoForm.vinculoId && !atendimentoForm.familiaId) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o atendido ou a família.",
        variant: "destructive"
      });
      return;
    }

    // Preparar dados para envio
    const dataToSend: any = {
      tipo: atendimentoForm.tipo,
      dataAtendimento: atendimentoForm.dataAtendimento,
      duracaoMinutos: atendimentoForm.duracaoMinutos,
      profissionalResponsavel: atendimentoForm.profissionalResponsavel,
      resumo: atendimentoForm.resumo,
      observacoes: atendimentoForm.observacoes,
      familiaId: atendimentoForm.familiaId,
      casoId: atendimentoForm.casoId,
    };

    // Adicionar campos de vínculo se houver atendido selecionado
    if (atendimentoForm.vinculoId && atendimentoForm.programaOrigem) {
      if (atendimentoForm.programaOrigem === 'inclusao') {
        dataToSend.psicoInclusaoVinculoId = atendimentoForm.vinculoId;
      } else if (atendimentoForm.programaOrigem === 'pec') {
        dataToSend.psicoPecVinculoId = atendimentoForm.vinculoId;
      }
    }

    createAtendimentoMutation.mutate(dataToSend);
  };

  const handleSavePlano = () => {
    if (!planoForm.estrategias?.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Descreva as estratégias do plano.",
        variant: "destructive"
      });
      return;
    }
    createPlanoMutation.mutate(planoForm);
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login/coordenador";
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

  const handleImportFile = async () => {
    if (!importFile) {
      toast({
        title: "Arquivo não selecionado",
        description: "Por favor, selecione um arquivo Excel (.xlsx, .xls) ou PDF (.pdf) para importar.",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      
      const response = await fetch('/api/psico/import', {
        method: 'POST',
        headers: {
          'x-user-id': userId || ''
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Importação concluída!",
          description: `${result.imported} registros importados com sucesso.`
        });
        setShowImportModal(false);
        setImportFile(null);
        queryClient.invalidateQueries({ queryKey: ['/api/psico/familias'] });
        queryClient.invalidateQueries({ queryKey: ['/api/psico/atendimentos'] });
      } else {
        throw new Error(result.error || 'Erro na importação');
      }
    } catch (error: any) {
      console.error('Erro ao importar:', error);
      toast({
        title: "Erro na importação",
        description: error.message || "Não foi possível importar o arquivo.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast({
        title: "Sem dados para exportar",
        description: "Não há dados disponíveis para exportação.",
        variant: "destructive"
      });
      return;
    }

    // Converter dados para CSV
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        // Escapar vírgulas e aspas
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(','))
    ].join('\n');

    // Criar e baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportação concluída!",
      description: `Arquivo ${filename} baixado com sucesso.`
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando coordenação psicossocial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900" data-testid="coordenador-psico-page">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 px-4 py-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white" data-testid="text-welcome">
                Coordenação Psicossocial
              </h1>
              <p className="text-slate-400" data-testid="text-username">
                Olá {userData?.nome || 'Coordenador'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
<Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowImportModal(true)}
              data-testid="button-import"
              className="border-purple-500 text-purple-500 hover:bg-purple-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleExportReport}
              data-testid="button-export"
              className="bg-purple-500 hover:bg-purple-600"
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
          data={psicoDemogData}
          isLoading={isPsicoDemogLoading}
          tipo="psico"
          filtroAno={dashFiltroAno}
          filtroMes={dashFiltroMes}
          onFilterChange={(ano, mes) => { setDashFiltroAno(ano); setDashFiltroMes(mes); }}
          titleOverride="Psicossocial"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">

          {/* Gestão de Famílias */}
          <Card data-testid="card-familias">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-blue-500" />
                Gestão de Famílias
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Gerencie famílias atendidas, acompanhe casos e coordene intervenções.
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  variant={activeSection === 'familias' ? 'default' : 'outline'}
                  data-testid="button-familias"
                  onClick={() => changeSection('familias')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Famílias
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'casos' ? 'default' : 'outline'}
                  data-testid="button-casos"
                  onClick={() => changeSection('casos')}
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Casos Ativos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Atendidos */}
          <Card data-testid="card-participantes">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserCheck className="w-5 h-5 text-indigo-500" />
                Atendidos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Pessoas com registros psicossociais cadastrados.
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  variant={activeSection === 'participantes' ? 'default' : 'outline'}
                  data-testid="button-participantes"
                  onClick={() => changeSection('participantes')}
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Ver Atendidos
                </Button>
                <Button
                  className="w-full"
                  variant={activeSection === 'demanda' ? 'default' : 'outline'}
                  onClick={() => changeSection('demanda')}
                >
                  <HeartHandshake className="w-4 h-4 mr-2" />
                  Demanda Espontânea
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Frequências e Acompanhamentos */}
          <Card data-testid="card-frequencias">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-blue-500" />
                Frequências e Turmas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Acompanhe as frequências das turmas de Inclusão Produtiva e PEC, e os acompanhamentos pedagógicos.
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  variant={activeSection === 'frequencias' ? 'default' : 'outline'}
                  onClick={() => changeSection('frequencias')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Ver Frequências
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'acompanhamentos' ? 'default' : 'outline'}
                  data-testid="button-acompanhamentos-freq"
                  onClick={() => changeSection('acompanhamentos')}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Acompanhamentos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Registros Psicossociais */}
          <Card data-testid="card-servicos">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <HeartHandshake className="w-5 h-5 text-green-500" />
                Registros Psicossociais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Gerencie registros confidenciais, gerais e documentação psicossocial.
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  variant={activeSection === 'confidencial' ? 'default' : 'outline'}
                  data-testid="button-confidencial"
                  onClick={() => changeSection('confidencial')}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Registros Confidenciais
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'registros-gerais' ? 'default' : 'outline'}
                  data-testid="button-registros-gerais"
                  onClick={() => changeSection('registros-gerais')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Registros Gerais
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Proteção Social */}
          <Card data-testid="card-protecao">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="w-5 h-5 text-red-500" />
                Proteção Social
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Gerencie situações de risco, violações de direitos e medidas protetivas.
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  variant={activeSection === 'violacoes' ? 'default' : 'outline'}
                  data-testid="button-violacoes"
                  onClick={() => changeSection('violacoes')}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Violações de Direitos
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'medidas' ? 'default' : 'outline'}
                  data-testid="button-medidas"
                  onClick={() => changeSection('medidas')}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Medidas Protetivas
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Rede de Serviços */}
          <Card data-testid="card-rede">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-orange-500" />
                Rede de Serviços
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Articule com rede de serviços e organize encaminhamentos.
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  variant={activeSection === 'rede' ? 'default' : 'outline'}
                  data-testid="button-rede"
                  onClick={() => changeSection('rede')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Rede de Serviços
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'encaminhamentos' ? 'default' : 'outline'}
                  data-testid="button-encaminhamentos"
                  onClick={() => changeSection('encaminhamentos')}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Encaminhamentos
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'grupos' ? 'default' : 'outline'}
                  data-testid="button-grupos"
                  onClick={() => changeSection('grupos')}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Grupos Terapêuticos
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
                Gere relatórios técnicos, estatísticas e análises de impacto social.
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
            Coordenação Psicossocial • Sistema RBAC Isolado
          </p>
        </div>


        {/* Área de Conteúdo Dinâmica */}
        <div className="mt-8" id="coordenador-psico-content-area">

          {activeSection === 'familias' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Gestão de Famílias</span>
                    <Button 
                      data-testid="button-add-family" 
                      className="flex items-center gap-2"
                      onClick={() => setShowFamiliaModal(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Cadastrar Família
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">Cadastro e acompanhamento das famílias atendidas pelo programa.</p>
                  
                  <Tabs defaultValue="lista" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="lista">Lista de Famílias</TabsTrigger>
                      <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
                      <TabsTrigger value="acompanhamento">Acompanhamento</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="lista" className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="Buscar família..." 
                            className="pl-10" 
                            data-testid="input-search-family"
                          />
                        </div>
                        <Select>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ativo">Ativo</SelectItem>
                            <SelectItem value="em-acompanhamento">Em Acompanhamento</SelectItem>
                            <SelectItem value="inativo">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" data-testid="button-filter">
                          <Filter className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Card>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Família</TableHead>
                              <TableHead>Responsável</TableHead>
                              <TableHead>Membros</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Último Atendimento</TableHead>
                              <TableHead>Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {isLoadingFamilias ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
                                    <span className="text-gray-500">Carregando famílias...</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : familias.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                  Nenhuma família cadastrada
                                </TableCell>
                              </TableRow>
                            ) : (
                              familias.map((familia: any) => (
                                <TableRow key={familia.id}>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">Família {familia.nomeResponsavel}</div>
                                      <div className="text-sm text-gray-500">ID: #{familia.id}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell>{familia.nomeResponsavel}</TableCell>
                                  <TableCell>{familia.numeroMembros} membros</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={
                                      familia.status === 'em_acompanhamento' ? 'bg-green-50 text-green-700' :
                                      familia.status === 'ativo' ? 'bg-blue-50 text-blue-700' :
                                      familia.status === 'inativo' ? 'bg-gray-50 text-gray-700' :
                                      'bg-red-50 text-red-700'
                                    }>
                                      {familia.status === 'em_acompanhamento' ? 'Em Acompanhamento' :
                                       familia.status === 'ativo' ? 'Ativo' :
                                       familia.status === 'inativo' ? 'Inativo' :
                                       'Encerrado'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{familia.ultimoAtendimento || 'N/A'}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        data-testid="button-view-family"
                                        onClick={() => {
                                          setSelectedFamilia(familia);
                                          setShowViewFamiliaModal(true);
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        data-testid="button-edit-family"
                                        onClick={() => {
                                          setSelectedFamilia(familia);
                                          setFamiliaForm({
                                            nomeResponsavel: familia.nomeResponsavel,
                                            numeroMembros: familia.numeroMembros,
                                            telefone: familia.telefone || '',
                                            endereco: familia.endereco || '',
                                            status: familia.status,
                                            observacoes: familia.observacoes || '',
                                            atendidosSelecionados: []
                                          });
                                          setShowEditFamiliaModal(true);
                                        }}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-red-600 hover:text-red-700"
                                        data-testid={`button-delete-family-${familia.id}`}
                                        onClick={() => {
                                          setSelectedFamilia(familia);
                                          setShowDeleteFamiliaDialog(true);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="estatisticas" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Total de Famílias</p>
                                <p className="text-2xl font-bold">87</p>
                              </div>
                              <Users className="h-8 w-8 text-blue-600" />
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Em Acompanhamento</p>
                                <p className="text-2xl font-bold">34</p>
                              </div>
                              <HeartHandshake className="h-8 w-8 text-green-600" />
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Casos Críticos</p>
                                <p className="text-2xl font-bold">12</p>
                              </div>
                              <Activity className="h-8 w-8 text-red-600" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="acompanhamento" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Plano de Acompanhamento</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="familia-select">Selecionar Família</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Escolha uma família" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="familia1">Família Silva</SelectItem>
                                  <SelectItem value="familia2">Família Santos</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="tipo-acompanhamento">Tipo de Acompanhamento</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="domiciliar">Visita Domiciliar</SelectItem>
                                  <SelectItem value="tecnico">Atendimento Técnico</SelectItem>
                                  <SelectItem value="grupo">Grupo Familiar</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="observacoes">Observações do Acompanhamento</Label>
                            <Textarea 
                              id="observacoes"
                              placeholder="Descreva o plano de acompanhamento..."
                              rows={4}
                            />
                          </div>
                          <Button 
                            data-testid="button-save-plan"
                            onClick={handleSavePlano}
                            disabled={createPlanoMutation.isPending}
                          >
                            {createPlanoMutation.isPending ? "Salvando..." : "Salvar Plano de Acompanhamento"}
                          </Button>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'casos' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Casos Ativos</span>
                    <Button 
                      data-testid="button-new-case" 
                      className="flex items-center gap-2"
                      onClick={() => setShowCasoModal(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Novo Caso
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">Gestão e acompanhamento dos casos psicossociais em andamento.</p>
                  
                  <Tabs defaultValue="ativos" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="ativos">Casos Ativos</TabsTrigger>
                      <TabsTrigger value="criticos">Críticos</TabsTrigger>
                      <TabsTrigger value="acompanhamento">Em Acompanhamento</TabsTrigger>
                      <TabsTrigger value="finalizados">Finalizados</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="ativos" className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="Buscar caso..." 
                            className="pl-10" 
                            data-testid="input-search-case"
                          />
                        </div>
                        <Select>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Prioridade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="media">Média</SelectItem>
                            <SelectItem value="baixa">Baixa</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" data-testid="button-export-cases">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Total Ativos</p>
                                <p className="text-2xl font-bold text-blue-600">{casos.filter(c => c.status === 'aberto').length}</p>
                              </div>
                              <Activity className="h-8 w-8 text-blue-600" />
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Críticos</p>
                                <p className="text-2xl font-bold text-red-600">{casos.filter(c => c.prioridade === 'alta').length}</p>
                              </div>
                              <AlertTriangle className="h-8 w-8 text-red-600" />
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Novos (Semana)</p>
                                <p className="text-2xl font-bold text-green-600">
                                  {casos.filter(c => {
                                    const casoDate = new Date(c.dataAbertura);
                                    const weekAgo = new Date();
                                    weekAgo.setDate(weekAgo.getDate() - 7);
                                    return casoDate >= weekAgo;
                                  }).length}
                                </p>
                              </div>
                              <Plus className="h-8 w-8 text-green-600" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Card>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Caso</TableHead>
                              <TableHead>Família/Pessoa</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Prioridade</TableHead>
                              <TableHead>Responsável</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {casos.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                  Nenhum caso cadastrado
                                </TableCell>
                              </TableRow>
                            ) : (
                              casos.map((caso: any) => {
                                const familia = familias.find((f: any) => f.id === caso.familiaId);
                                return (
                                  <TableRow key={caso.id}>
                                    <TableCell>
                                      <div>
                                        <div className="font-medium">#C{String(caso.id).padStart(3, '0')}</div>
                                        <div className="text-sm text-gray-500">
                                          Aberto {new Date(caso.dataAbertura).toLocaleDateString('pt-BR')}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>{familia ? familia.nomeResponsavel : 'Não especificado'}</TableCell>
                                    <TableCell>{caso.tipo}</TableCell>
                                    <TableCell>
                                      <Badge className={
                                        caso.prioridade === 'alta' ? 'bg-red-100 text-red-800' :
                                        caso.prioridade === 'media' ? 'bg-orange-100 text-orange-800' :
                                        'bg-yellow-100 text-yellow-800'
                                      }>
                                        {caso.prioridade === 'alta' ? 'Alta' : caso.prioridade === 'media' ? 'Média' : 'Baixa'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>{caso.responsavelNome || '-'}</TableCell>
                                    <TableCell>
                                      <Badge className={
                                        caso.status === 'aberto' ? 'bg-blue-100 text-blue-800' :
                                        caso.status === 'em_atendimento' ? 'bg-purple-100 text-purple-800' :
                                        'bg-green-100 text-green-800'
                                      }>
                                        {caso.status === 'aberto' ? 'Em Atendimento' : 
                                         caso.status === 'em_atendimento' ? 'Acompanhamento' : 
                                         'Fechado'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          data-testid="button-view-case"
                                          onClick={() => {
                                            setSelectedCaso(caso);
                                            setShowViewCasoModal(true);
                                          }}
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          data-testid="button-edit-case"
                                          onClick={() => {
                                            setSelectedCaso(caso);
                                            setCasoForm({
                                              familiaId: caso.familiaId || null,
                                              titulo: caso.titulo,
                                              tipo: caso.tipo,
                                              prioridade: caso.prioridade,
                                              status: caso.status,
                                              responsavelNome: caso.responsavelNome || '',
                                              descricao: caso.descricao || ''
                                            });
                                            setShowEditCasoModal(true);
                                          }}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="text-red-600 hover:text-red-700"
                                          data-testid={`button-delete-case-${caso.id}`}
                                          onClick={() => {
                                            setSelectedCaso(caso);
                                            setShowDeleteCasoDialog(true);
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="criticos" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-red-600">Casos Críticos - Atenção Imediata</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-medium text-red-800">#C001 - Família Silva</p>
                                <p className="text-sm text-red-700">Violência doméstica com risco iminente. Última intervenção: 25/09/2025</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                                    Intervenção Urgente
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    Ver Detalhes
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-medium text-orange-800">#C003 - Maria Oliveira</p>
                                <p className="text-sm text-orange-700">Criança em situação de vulnerabilidade. Acompanhamento semanal necessário.</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                                    Agendar Visita
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    Ver Detalhes
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="acompanhamento" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Plano de Acompanhamento de Casos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Selecionar Caso</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Escolha um caso" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="caso1">#C001 - Família Silva</SelectItem>
                                  <SelectItem value="caso2">#C002 - João Santos</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Frequência de Acompanhamento</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Frequência" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="semanal">Semanal</SelectItem>
                                  <SelectItem value="quinzenal">Quinzenal</SelectItem>
                                  <SelectItem value="mensal">Mensal</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Estratégias de Intervenção</Label>
                            <Textarea 
                              placeholder="Descreva as estratégias e objetivos do acompanhamento..."
                              rows={4}
                            />
                          </div>
                          <Button 
                            data-testid="button-save-monitoring"
                            onClick={handleSavePlano}
                            disabled={createPlanoMutation.isPending}
                          >
                            {createPlanoMutation.isPending ? "Salvando..." : "Salvar Plano de Acompanhamento"}
                          </Button>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="finalizados" className="space-y-4">
                      <Card>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Caso</TableHead>
                              <TableHead>Família/Pessoa</TableHead>
                              <TableHead>Data Abertura</TableHead>
                              <TableHead>Data Encerramento</TableHead>
                              <TableHead>Resultado</TableHead>
                              <TableHead>Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>#C100</TableCell>
                              <TableCell>Família Costa</TableCell>
                              <TableCell>15/08/2025</TableCell>
                              <TableCell>22/09/2025</TableCell>
                              <TableCell>
                                <Badge className="bg-green-100 text-green-800">Resolvido</Badge>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" data-testid="button-view-closed-case">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'participantes' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Atendidos</span>

                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-purple-700">{(psicoDashStats as any)?.data?.atendimentoIndividual || 0}</div>
                      <div className="text-xs text-purple-600">Atend. Individuais</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-700">{(psicoDashStats as any)?.data?.visitaDomiciliar || 0}</div>
                      <div className="text-xs text-blue-600">Visitas Domiciliares</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-700">{(psicoDashStats as any)?.data?.atendimentoColetivo || 0}</div>
                      <div className="text-xs text-green-600">Atend. Coletivos</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-yellow-700">{(psicoDashStats as any)?.data?.espacoOGrito || 0}</div>
                      <div className="text-xs text-yellow-600">Espaço O Grito</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-red-700">{(psicoDashStats as any)?.data?.acoesSaude || 0}</div>
                      <div className="text-xs text-red-600">Ações p/ Saúde</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-orange-700">{(psicoDashStats as any)?.data?.demandasEspontaneas || 0}</div>
                      <div className="text-xs text-orange-600">Dem. Espontâneas</div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input placeholder="Buscar atendido por nome ou CPF..." value={buscaParticipante} onChange={(e) => setBuscaParticipante(e.target.value)} className="pl-10" />
                      </div>
                    </div>
                    {loadingAtendidosReg ? (
                      <div className="text-center py-6 text-gray-500">Carregando atendidos...</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>CPF</TableHead>
                            <TableHead>Registros</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(() => {
                            const filtered = (atendidosRegistrados as any[]).filter((a: any) => {
                              if (!buscaParticipante.trim()) return true;
                              const termo = buscaParticipante.toLowerCase();
                              return (a.nome || "").toLowerCase().includes(termo) || (a.cpf || "").includes(buscaParticipante);
                            }).sort((a: any, b: any) => (a.nome || "").localeCompare(b.nome || "", 'pt-BR'));
                            if (filtered.length === 0) return (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                                  Nenhum atendido encontrado. Cadastre registros na seção "Serviços Psicossociais".
                                </TableCell>
                              </TableRow>
                            );
                            return filtered.map((a: any) => (
                              <TableRow key={a.id} className="cursor-pointer hover:bg-purple-50" onClick={() => { setSelectedParticipante(a); setShowHistoricoModal(true); }}>
                                <TableCell className="font-medium">{a.nome ? normalizeName(a.nome) : "-"}</TableCell>
                                <TableCell className="text-sm text-gray-500">{formatCPF(a.cpf)}</TableCell>
                                <TableCell>
                                  <Badge className="bg-purple-100 text-purple-800">{a.totalAtendimentos} registro(s)</Badge>
                                </TableCell>
                                <TableCell>
                                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedParticipante(a); setShowHistoricoModal(true); }}>
                                    <Eye className="w-4 h-4 mr-1" /> Ver
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ));
                          })()}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'frequencias' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    Frequências das Turmas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 flex-wrap mb-4">
                    <span className="text-sm font-medium text-gray-700">Programa:</span>
                    <Button size="sm" variant={freqPrograma === "pec" ? "default" : "outline"} onClick={() => { setFreqPrograma("pec"); setFreqTurmaId(""); setFreqExpandida(null); }} className={freqPrograma === "pec" ? "bg-yellow-500 hover:bg-yellow-600" : ""}>
                      PEC
                    </Button>
                    <Button size="sm" variant={freqPrograma === "inclusao" ? "default" : "outline"} onClick={() => { setFreqPrograma("inclusao"); setFreqTurmaId(""); setFreqExpandida(null); }} className={freqPrograma === "inclusao" ? "bg-green-600 hover:bg-green-700" : ""}>
                      Inclusão Produtiva
                    </Button>
                  </div>

                  {!freqTurmaId ? (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Turmas - {freqPrograma === "pec" ? "PEC" : "Inclusão Produtiva"}</h3>
                      <input type="text" placeholder="Buscar turma..." value={freqBusca} onChange={(e) => setFreqBusca(e.target.value)} className="w-full px-3 py-2 mb-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                      {(freqTurmas as any[]).length > 0 ? (
                        <div className="space-y-1">
                          {[...(freqTurmas as any[])].filter((t: any) => !freqBusca || (t.nome || t.title || `Turma ${t.id}`).toLowerCase().includes(freqBusca.toLowerCase())).sort((a: any, b: any) => {
                            const aMax = freqHistorico.filter((c: any) => String(c.turmaId) === String(a.id)).reduce((m: string, c: any) => c.data > m ? c.data : m, "");
                            const bMax = freqHistorico.filter((c: any) => String(c.turmaId) === String(b.id)).reduce((m: string, c: any) => c.data > m ? c.data : m, "");
                            if (!aMax && !bMax) return (b.id || 0) - (a.id || 0);
                            if (!aMax) return 1;
                            if (!bMax) return -1;
                            return bMax.localeCompare(aMax);
                          }).map((t: any) => {
                            const turmasChamadas = freqHistorico.filter((c: any) => String(c.turmaId) === String(t.id));
                            const totalChamadas = turmasChamadas.length;
                            const freqMedia = totalChamadas > 0 ? Math.round(turmasChamadas.reduce((acc: number, c: any) => acc + (c.presentes || 0), 0) / turmasChamadas.reduce((acc: number, c: any) => acc + (c.total || 1), 0) * 100) : 0;
                            return (
                              <div key={t.id} className="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => { setFreqTurmaId(String(t.id)); setFreqExpandida(null); }}>
                                <div>
                                  <span className="font-medium text-gray-800 text-sm">{t.nome || t.title || `Turma ${t.id}`}</span>
                                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                    <span>{totalChamadas} chamadas</span>
                                    <span>Freq: <span className={`font-medium ${freqMedia >= 70 ? "text-green-600" : freqMedia >= 50 ? "text-yellow-600" : "text-red-600"}`}>{freqMedia}%</span></span>
                                  </div>
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90" />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-400 border rounded-lg">
                          Nenhuma turma encontrada para {freqPrograma === "pec" ? "PEC" : "Inclusão Produtiva"}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Button size="sm" variant="ghost" onClick={() => { setFreqTurmaId(""); setFreqExpandida(null); }} className="text-gray-600 hover:text-gray-800 px-2">
                          ← Voltar
                        </Button>
                        <h3 className="font-semibold text-gray-800">
                          {(freqTurmas as any[]).find((t: any) => String(t.id) === freqTurmaId)?.nome || (freqTurmas as any[]).find((t: any) => String(t.id) === freqTurmaId)?.title || "Turma"}
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        <div className={`${freqPrograma === "pec" ? "bg-yellow-50" : "bg-green-50"} rounded-lg p-3 text-center`}>
                          <div className={`text-2xl font-bold ${freqPrograma === "pec" ? "text-yellow-700" : "text-green-700"}`}>{freqHistorico.length}</div>
                          <div className={`text-xs ${freqPrograma === "pec" ? "text-yellow-600" : "text-green-600"}`}>Chamadas</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-purple-700">
                            {freqHistorico.length > 0 ? Math.round(freqHistorico.reduce((acc: number, c: any) => acc + (c.presentes || 0), 0) / freqHistorico.reduce((acc: number, c: any) => acc + (c.total || 1), 0) * 100) : 0}%
                          </div>
                          <div className="text-xs text-purple-600">Frequência Média</div>
                        </div>
                      </div>

                      {loadingFreqChamadas ? (
                        <div className="text-center py-4 text-gray-500">Carregando...</div>
                      ) : freqHistorico.length > 0 ? (
                        <div className="space-y-2">
                          {freqHistorico.map((c: any, i: number) => (
                            <div key={c.id || i} className="border rounded-lg overflow-hidden">
                              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setFreqExpandida(freqExpandida === c.id ? null : c.id)}>
                                <span className="text-sm font-medium">{c.data}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm">
                                    <span className="text-green-600 font-medium">{c.presentes || 0}</span>
                                    <span className="text-gray-400"> / </span>
                                    <span className="text-gray-600">{c.total || 0}</span>
                                  </span>
                                  <span className="text-xs text-gray-400">{freqExpandida === c.id ? "▲" : "▼"}</span>
                                </div>
                              </div>
                              {freqExpandida === c.id && c.presencas && (
                                <div className="border-t">
                                  {[...c.presencas].sort((a: any, b: any) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR')).map((p: any, pi: number) => (
                                    <div key={p.alunoCpf || pi} className={`flex items-center justify-between px-4 py-2 border-b last:border-b-0 text-sm ${p.presente ? "bg-green-50" : "bg-red-50"}`}>
                                      <span>{(p.nome || 'Sem nome').trim()}</span>
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
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'confidencial' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-purple-500" />
                    Registros Confidenciais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-800">
                    <strong>Registros Confidenciais:</strong> Registre atendimentos individuais, visitas domiciliares, encaminhamentos e outras intervenções psicossociais de forma segura e organizada.
                  </div>

                  <div className="flex gap-2 mb-2">
                    <Button size="sm" variant={confSubTab === "realizados" ? "default" : "outline"} onClick={() => setConfSubTab("realizados")} className={confSubTab === "realizados" ? "bg-purple-600 hover:bg-purple-700" : ""}>
                      Registros Realizados
                    </Button>
                    <Button size="sm" variant={confSubTab === "novo" ? "default" : "outline"} onClick={() => setConfSubTab("novo")} className={confSubTab === "novo" ? "bg-purple-600 hover:bg-purple-700" : ""}>
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
                              <SelectItem value="atendimento_individual">Atendimento Individual</SelectItem>
                              <SelectItem value="visita_domiciliar">Visita Domiciliar</SelectItem>
                              <SelectItem value="situacao_risco">Situação de Risco</SelectItem>
                              <SelectItem value="encaminhamento">Encaminhamento</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Data</label>
                          <Input type="date" value={psicoRegistroForm.data} onChange={(e) => setPsicoRegistroForm({...psicoRegistroForm, data: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Título</label>
                          <Input value={psicoRegistroForm.titulo} onChange={(e) => setPsicoRegistroForm({...psicoRegistroForm, titulo: e.target.value})} placeholder="Ex: Atendimento - Maria Silva" />
                        </div>
                        <div className="relative">
                          <label className="text-sm font-medium mb-1 block">Participante</label>
                          <Input
                            value={registroPartOpen ? registroPartBusca : psicoRegistroForm.participanteNome}
                            onChange={(e) => {
                              setRegistroPartBusca(e.target.value);
                              setRegistroPartOpen(true);
                              setPsicoRegistroForm({...psicoRegistroForm, participanteNome: e.target.value, participanteCpf: "", participanteDataNascimento: ""});
                            }}
                            onFocus={() => { setRegistroPartOpen(true); setRegistroPartBusca(psicoRegistroForm.participanteNome || ""); }}
                            onBlur={() => setTimeout(() => setRegistroPartOpen(false), 200)}
                            placeholder="Buscar por nome (PEC/Inclusão/Comunidade) ou digitar novo"
                          />
                          {registroPartOpen && (() => {
                            const todosParticipantes = (todosAtendidosParaAtendimento as any[] || []);
                            const filtrados = registroPartBusca.trim()
                              ? todosParticipantes.filter((p: any) => 
                                  (p.label || p.nome || "").toLowerCase().includes(registroPartBusca.toLowerCase()) ||
                                  (p.cpf || "").includes(registroPartBusca)
                                )
                              : todosParticipantes;
                            if (filtrados.length === 0 && registroPartBusca.trim().length >= 2) return (
                              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">Nenhum participante encontrado.</p>
                                <p className="text-xs text-purple-600 font-medium">O nome digitado será usado como novo participante.</p>
                              </div>
                            );
                            if (filtrados.length === 0) return null;
                            return (
                              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {filtrados.slice(0, 20).map((p: any, i: number) => (
                                  <button
                                    key={p.id || i}
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 flex items-center gap-2 border-b border-gray-50 last:border-0"
                                    onClick={() => {
                                      const nome = p.nome || p.label || "";
                                      const cpf = p.cpf || "";
                                      const dataNasc = p.data_nascimento || "";
                                      setPsicoRegistroForm({...psicoRegistroForm, participanteNome: nome, participanteCpf: cpf, participanteDataNascimento: dataNasc});
                                      setRegistroPartBusca(nome);
                                      setRegistroPartOpen(false);
                                    }}
                                  >
                                    <span className="font-medium text-gray-900">{p.nome || p.label}</span>
                                    {p.cpf && <span className="text-xs text-gray-400">{formatCPF(p.cpf)}</span>}
                                    <span className="text-xs text-gray-400 ml-auto">{p.origem === 'inclusao' ? 'Inclusão' : p.origem === 'pec' ? 'PEC' : 'Comunidade'}</span>
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
                          disabled={!psicoRegistroForm.titulo || !psicoRegistroForm.conteudo || !psicoRegistroForm.participanteNome || createRegistroConfMutation.isPending}
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
                        const allRegistros = (coordRegistrosConf as any[]);
                        const tipoLabel: Record<string, string> = { atendimento_individual: "Atendimento Individual", visita_domiciliar: "Visita Domiciliar", atendimento_coletivo: "Atendimento Coletivo", espaco_o_grito: "Espaço O Grito", acoes_saude: "Ações para Saúde", encaminhamento: "Encaminhamento", situacao_risco: "Situação de Risco", relato_espontaneo: "Relato Espontâneo", observacao_comportamental: "Observação Comportamental", contato_familiar: "Contato Familiar", outro: "Outro" };
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
                                    <label className="text-sm font-medium mb-1 block">Título</label>
                                    <Input value={editRegistroForm.titulo} onChange={(e) => setEditRegistroForm({...editRegistroForm, titulo: e.target.value})} />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-1 block">Tipo</label>
                                    <Select value={editRegistroForm.tipo} onValueChange={(v) => setEditRegistroForm({...editRegistroForm, tipo: v})}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="atendimento_individual">Atendimento Individual</SelectItem>
                                        <SelectItem value="visita_domiciliar">Visita Domiciliar</SelectItem>
                                        <SelectItem value="situacao_risco">Situação de Risco</SelectItem>
                                        <SelectItem value="encaminhamento">Encaminhamento</SelectItem>
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
                                      const todos = (todosAtendidosParaAtendimento as any[] || []);
                                      const filtrados = editRegistroPartBusca.trim()
                                        ? todos.filter((p: any) => (p.label || p.nome || "").toLowerCase().includes(editRegistroPartBusca.toLowerCase()))
                                        : todos;
                                      if (filtrados.length === 0) return null;
                                      return (
                                        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                          {filtrados.slice(0, 20).map((p: any, i: number) => (
                                            <button key={p.id || i} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 flex items-center gap-2 border-b border-gray-50 last:border-0"
                                              onClick={() => { setEditRegistroForm({...editRegistroForm, participanteNome: p.nome || p.label}); setEditRegistroPartBusca(p.nome || p.label); setEditRegistroPartOpen(false); }}>
                                              <span className="font-medium text-gray-900">{p.nome || p.label}</span>
                                              <span className="text-xs text-gray-400 ml-auto">{p.origem === 'inclusao' ? 'Inclusão' : p.origem === 'pec' ? 'PEC' : 'Comunidade'}</span>
                                            </button>
                                          ))}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-1 block">Conteúdo</label>
                                  <textarea className="w-full border rounded-lg p-2 text-sm min-h-[120px]" value={editRegistroForm.conteudo} onChange={(e) => setEditRegistroForm({...editRegistroForm, conteudo: e.target.value})} />
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <Button variant="outline" size="sm" onClick={() => setEditRegistroId(null)}>Cancelar</Button>
                                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700"
                                    disabled={!editRegistroForm.titulo || !editRegistroForm.conteudo || updateRegistroConfMutation.isPending}
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
                                  <span className="font-medium text-sm truncate">{r.titulo}</span>
                                  <Badge variant="outline" className="text-xs border-purple-300 text-purple-600 flex-shrink-0">{tipoLabel[r.tipo] || r.tipo}</Badge>
                                  <span className="text-xs text-gray-400 flex-shrink-0">{r.data ? new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR") : "-"}</span>
                                </div>
                                <div className="flex gap-1 ml-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="sm" className="text-purple-500 hover:text-purple-700 hover:bg-purple-50 h-7 w-7 p-0"
                                    onClick={() => {
                                      setEditRegistroId(r.id);
                                      setEditRegistroForm({ titulo: r.titulo || "", tipo: r.tipo || "", conteudo: r.conteudo || "", participanteNome: r.participanteNome || "", data: r.data || "" });
                                      setEditRegistroPartBusca(r.participanteNome || "");
                                    }}>
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                                    onClick={() => setConfirmDeleteRegistro({ open: true, id: r.id })}>
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
                                    <span className="text-gray-500 font-medium text-sm">Conteúdo:</span>
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
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'registros-gerais' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Registros Gerais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    <strong>Registros Gerais:</strong> Registros não-confidenciais criados por monitores e coordenadores psicossociais. Todos os registros de ambas as funções são exibidos aqui.
                  </div>

                  <div className="flex gap-2 mb-2">
                    <Button size="sm" variant={geraisSubTab === "realizados" ? "default" : "outline"} onClick={() => setGeraisSubTab("realizados")} className={geraisSubTab === "realizados" ? "bg-blue-600 hover:bg-blue-700" : ""}>
                      Registros Realizados
                    </Button>
                    <Button size="sm" variant={geraisSubTab === "novo" ? "default" : "outline"} onClick={() => setGeraisSubTab("novo")} className={geraisSubTab === "novo" ? "bg-blue-600 hover:bg-blue-700" : ""}>
                      <Plus className="w-4 h-4 mr-1" /> Novo Registro
                    </Button>
                  </div>

                  {geraisSubTab === "novo" && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                      <h4 className="font-semibold text-blue-800">Novo Registro Geral</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Tipo</label>
                          <Select value={geraisForm.tipo} onValueChange={(v) => { setGeraisForm({...geraisForm, tipo: v}); setGeraisColaboradoresIds([]); setGeraisColabBusca(""); }}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="espaco_o_grito">Espaço O Grito</SelectItem>
                              <SelectItem value="caravana_comunitaria">Caravana Comunitária</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Data</label>
                          <Input type="date" value={geraisForm.data} onChange={(e) => setGeraisForm({...geraisForm, data: e.target.value})} />
                        </div>
                        {geraisForm.tipo !== "espaco_o_grito" && (
                        <div>
                          <label className="text-sm font-medium mb-1 block">Participante (opcional)</label>
                          <Input value={geraisForm.participanteNome} onChange={(e) => setGeraisForm({...geraisForm, participanteNome: e.target.value})} placeholder="Nome do participante" />
                        </div>
                        )}
                        {geraisForm.tipo === "espaco_o_grito" && (
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium mb-1 block">Colaboradores presentes <span className="text-gray-400 text-xs">({geraisColaboradoresIds.length} selecionado(s))</span></label>
                            <Input className="mb-2" placeholder="Filtrar colaboradores..." value={geraisColabBusca} onChange={(e) => setGeraisColabBusca(e.target.value)} />
                            <div className="border rounded-lg max-h-52 overflow-y-auto bg-white">
                              {todosColaboradoresPsico.filter((c: any) => !geraisColabBusca || c.nome.toLowerCase().includes(geraisColabBusca.toLowerCase())).map((c: any) => {
                                const checked = geraisColaboradoresIds.includes(c.id);
                                return (
                                  <label key={c.id} className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-0">
                                    <input type="checkbox" checked={checked} onChange={() => setGeraisColaboradoresIds(prev => checked ? prev.filter(id => id !== c.id) : [...prev, c.id])} className="w-4 h-4 accent-blue-600" />
                                    <span className="text-sm text-gray-800">{c.nome}</span>
                                    {c.vinculo && <span className="ml-auto text-xs text-gray-400">{c.vinculo}</span>}
                                  </label>
                                );
                              })}
                              {todosColaboradoresPsico.length === 0 && <div className="px-3 py-4 text-sm text-gray-400 text-center">Carregando colaboradores...</div>}
                            </div>
                            {geraisColaboradoresIds.length > 0 && <p className="text-xs text-blue-600 mt-1">{geraisColaboradoresIds.length} colaborador(es) selecionado(s)</p>}
                          </div>
                        )}
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium mb-1 block">Conteúdo</label>
                          <Textarea value={geraisForm.conteudo} onChange={(e) => setGeraisForm({...geraisForm, conteudo: e.target.value})} placeholder="Descreva o registro..." rows={4} />
                        </div>
                      </div>
                      <Button onClick={() => createGeraisMutation.mutate({ ...geraisForm, colaboradoresIds: geraisForm.tipo === "espaco_o_grito" ? geraisColaboradoresIds : null })} disabled={createGeraisMutation.isPending || !geraisForm.conteudo.trim() || (geraisForm.tipo === "espaco_o_grito" && geraisColaboradoresIds.length === 0)} className="bg-blue-600 hover:bg-blue-700">
                        {createGeraisMutation.isPending ? "Salvando..." : "Salvar Registro"}
                      </Button>
                    </div>
                  )}

                  {geraisSubTab === "realizados" && (
                    <div className="space-y-3">
                      <Input placeholder="Buscar registros..." value={geraisSearchTerm} onChange={(e) => setGeraisSearchTerm(e.target.value)} className="mb-2" />
                      {loadingRegistrosGerais ? (
                        <div className="text-center py-4 text-gray-500">Carregando...</div>
                      ) : (coordRegistrosGerais as any[]).filter((r: any) => !geraisSearchTerm || r.conteudo?.toLowerCase().includes(geraisSearchTerm.toLowerCase()) || r.participanteNome?.toLowerCase().includes(geraisSearchTerm.toLowerCase())).length === 0 ? (
                        <div className="text-center py-8 text-gray-400">Nenhum registro encontrado.</div>
                      ) : (
                        (coordRegistrosGerais as any[]).filter((r: any) => !geraisSearchTerm || r.conteudo?.toLowerCase().includes(geraisSearchTerm.toLowerCase()) || r.participanteNome?.toLowerCase().includes(geraisSearchTerm.toLowerCase())).map((r: any) => (
                          <div key={r.id} className="border rounded-lg p-3 bg-white space-y-2">
                            {editGeraisId === r.id ? (
                              <div className="space-y-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <Select value={editGeraisForm.tipo} onValueChange={(v) => { setEditGeraisForm({...editGeraisForm, tipo: v}); setEditGeraisColaboradoresIds([]); setEditGeraisColabBusca(""); }}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="espaco_o_grito">Espaço O Grito</SelectItem>
                                      <SelectItem value="caravana_comunitaria">Caravana Comunitária</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Input type="date" value={editGeraisForm.data} onChange={(e) => setEditGeraisForm({...editGeraisForm, data: e.target.value})} />
                                </div>
                                {editGeraisForm.tipo !== "espaco_o_grito" && (
                                  <Input value={editGeraisForm.participanteNome} onChange={(e) => setEditGeraisForm({...editGeraisForm, participanteNome: e.target.value})} placeholder="Participante" />
                                )}
                                {editGeraisForm.tipo === "espaco_o_grito" && (
                                  <div>
                                    <label className="text-xs font-medium mb-1 block">Colaboradores presentes <span className="text-gray-400">({editGeraisColaboradoresIds.length} selecionado(s))</span></label>
                                    <Input className="mb-1" placeholder="Filtrar..." value={editGeraisColabBusca} onChange={(e) => setEditGeraisColabBusca(e.target.value)} />
                                    <div className="border rounded-lg max-h-40 overflow-y-auto bg-white">
                                      {todosColaboradoresPsico.filter((c: any) => !editGeraisColabBusca || c.nome.toLowerCase().includes(editGeraisColabBusca.toLowerCase())).map((c: any) => {
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
                                <Textarea value={editGeraisForm.conteudo} onChange={(e) => setEditGeraisForm({...editGeraisForm, conteudo: e.target.value})} rows={3} />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => updateGeraisMutation.mutate({ id: r.id, ...editGeraisForm, colaboradoresIds: editGeraisForm.tipo === "espaco_o_grito" ? editGeraisColaboradoresIds : null })} disabled={updateGeraisMutation.isPending}>Salvar</Button>
                                  <Button size="sm" variant="outline" onClick={() => { setEditGeraisId(null); setEditGeraisColaboradoresIds([]); setEditGeraisColabBusca(""); }}>Cancelar</Button>
                                </div>
                              </div>
                            ) : (() => {
                                const tipoLabels: Record<string, string> = { atendimento_individual: "Atendimento Individual", atendimento_coletivo: "Atendimento Coletivo", espaco_o_grito: "Espaço O Grito", acoes_saude: "Ações para Saúde", encaminhamento: "Encaminhamento", situacao_risco: "Situação de Risco", outro: "Outro" };
                                let colaboradoresIdsList2: number[] = [];
                                let colaboradoresDisplay2 = "";
                                if (r.colaboradoresIds) {
                                  try {
                                    colaboradoresIdsList2 = JSON.parse(r.colaboradoresIds);
                                    const nomes = colaboradoresIdsList2.map((id: number) => todosColaboradoresPsico.find((c: any) => c.id === id)?.nome).filter(Boolean);
                                    colaboradoresDisplay2 = nomes.join(", ");
                                  } catch {}
                                }
                                return (
                              <>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <Badge variant="outline" className="text-xs mb-1 text-blue-700 border-blue-300">{tipoLabels[r.tipo] || r.tipo}</Badge>
                                    {r.participanteNome && <p className="text-sm font-medium text-gray-700">{r.participanteNome}</p>}
                                    {colaboradoresDisplay2 && (
                                      <details className="text-xs">
                                        <summary className="cursor-pointer text-green-700 font-medium select-none list-none flex items-center gap-1">
                                          <span className="inline-block w-3 h-3 mr-0.5">▶</span>
                                          Colaboradores ({colaboradoresIdsList2.length})
                                        </summary>
                                        <ul className="mt-1 pl-4 space-y-0.5 text-gray-700">
                                          {[...colaboradoresIdsList2].map((id: number) => ({ id, nome: (todosColaboradoresPsico as any[]).find((c: any) => c.id === id)?.nome })).filter(x => x.nome).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map(({ id, nome }) => (
                                            <li key={id} className="list-disc">{nome}</li>
                                          ))}
                                        </ul>
                                      </details>
                                    )}
                                    <p className="text-xs text-gray-500">{r.data ? new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR") : r.data} · Criado por: {r.criadoPorRole === 'coordenador' ? 'Coordenador' : 'Monitor'}</p>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-blue-600 h-7 w-7 p-0" onClick={() => setViewGeraisGeralRecord({ ...r, colaboradoresIdsList2 })}>
                                      <Eye className="w-3 h-3" />
                                    </Button>
                                    {r.criadoPorUserId === userId && (
                                      <>
                                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditGeraisId(r.id); setEditGeraisForm({ tipo: r.tipo, conteudo: r.conteudo, participanteNome: r.participanteNome || "", data: r.data }); setEditGeraisColaboradoresIds(colaboradoresIdsList2); setEditGeraisColabBusca(""); }}>
                                          <Pencil className="w-3 h-3" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => deleteGeraisMutation.mutate(r.id)} disabled={deleteGeraisMutation.isPending}>
                                          <Trash2 className="w-3 h-3 text-red-500" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.conteudo}</p>
                              </>
                                );
                              })()}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* DIALOG VISUALIZAÇÃO REGISTRO GERAL */}
          <Dialog open={!!viewGeraisGeralRecord} onOpenChange={(open) => { if (!open) setViewGeraisGeralRecord(null); }}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {viewGeraisGeralRecord && (() => {
                    const tipoLabels: Record<string, string> = { atendimento_individual: "Atendimento Individual", atendimento_coletivo: "Atendimento Coletivo", espaco_o_grito: "Espaço O Grito", acoes_saude: "Ações para Saúde", encaminhamento: "Encaminhamento", situacao_risco: "Situação de Risco", outro: "Outro" };
                    return tipoLabels[viewGeraisGeralRecord.tipo] || viewGeraisGeralRecord.tipo;
                  })()}
                </DialogTitle>
                <DialogDescription>
                  {viewGeraisGeralRecord?.data ? new Date(viewGeraisGeralRecord.data + "T12:00:00").toLocaleDateString("pt-BR") : ""}
                  {viewGeraisGeralRecord?.criadoPorRole && ` · Criado por: ${viewGeraisGeralRecord.criadoPorRole === 'coordenador' ? 'Coordenador' : 'Monitor'}`}
                </DialogDescription>
              </DialogHeader>
              {viewGeraisGeralRecord && (
                <div className="space-y-3">
                  {viewGeraisGeralRecord.participanteNome && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">Participante</p>
                      <p className="text-sm text-gray-800">{viewGeraisGeralRecord.participanteNome}</p>
                    </div>
                  )}
                  {viewGeraisGeralRecord.colaboradoresIdsList2?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-green-700 mb-1">Colaboradores presentes ({viewGeraisGeralRecord.colaboradoresIdsList2.length})</p>
                      <ul className="space-y-0.5 pl-3">
                        {[...viewGeraisGeralRecord.colaboradoresIdsList2].map((id: number) => ({ id, nome: (todosColaboradoresPsico as any[]).find((c: any) => c.id === id)?.nome })).filter((x: any) => x.nome).sort((a: any, b: any) => a.nome.localeCompare(b.nome, 'pt-BR')).map(({ id, nome }: any) => (
                          <li key={id} className="text-sm text-gray-700 list-disc">{nome}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Descrição</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{viewGeraisGeralRecord.conteudo}</p>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {activeSection === 'atendimentos' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Atendimentos Psicossociais</span>
                    <Button 
                      data-testid="button-new-appointment" 
                      className="flex items-center gap-2"
                      onClick={() => setShowAtendimentoModal(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Novo Atendimento
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">Coordenação dos atendimentos psicossociais individuais e familiares.</p>
                  
                  <Tabs defaultValue="agenda" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="agenda">Agenda</TabsTrigger>
                      <TabsTrigger value="historico">Histórico</TabsTrigger>
                      <TabsTrigger value="individuais">Individuais</TabsTrigger>
                      <TabsTrigger value="familiares">Familiares</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="agenda" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-blue-600">
                                {atendimentos.filter((a: any) => {
                                  const hoje = new Date().toISOString().split('T')[0];
                                  return a.dataAtendimento === hoje;
                                }).length}
                              </p>
                              <p className="text-sm text-gray-600">Hoje</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-green-600">
                                {atendimentos.filter((a: any) => {
                                  const hoje = new Date();
                                  const dataAtend = new Date(a.dataAtendimento);
                                  const diffDias = Math.ceil((dataAtend.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
                                  return diffDias >= 0 && diffDias <= 7;
                                }).length}
                              </p>
                              <p className="text-sm text-gray-600">Esta Semana</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-orange-600">
                                {atendimentos.filter((a: any) => a.status === 'reagendado').length}
                              </p>
                              <p className="text-sm text-gray-600">Reagendados</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-red-600">
                                {atendimentos.filter((a: any) => a.status === 'faltou').length}
                              </p>
                              <p className="text-sm text-gray-600">Ausências</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Próximos Atendimentos</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {atendimentos.filter((a: any) => new Date(a.dataAtendimento) >= new Date()).length > 0 ? (
                            <div className="space-y-3">
                              {atendimentos
                                .filter((a: any) => new Date(a.dataAtendimento) >= new Date())
                                .sort((a: any, b: any) => new Date(a.dataAtendimento).getTime() - new Date(b.dataAtendimento).getTime())
                                .slice(0, 5)
                                .map((atend: any) => (
                                  <div key={atend.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <div className="flex flex-col items-center">
                                        <span className="text-sm font-medium">
                                          {new Date(atend.dataAtendimento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {new Date(atend.dataAtendimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                        </span>
                                      </div>
                                      <div>
                                        <p className="font-medium">
                                          {atend.nomeParticipante || atend.nomeFamilia || 'Sem identificação'} - {atend.tipo}
                                        </p>
                                        <p className="text-sm text-gray-600">{atend.resumo || 'Atendimento psicossocial'}</p>
                                      </div>
                                    </div>
                                    <Badge className="bg-blue-100 text-blue-800">
                                      {atend.status || 'Agendado'}
                                    </Badge>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                              <p>Nenhum atendimento agendado</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="historico" className="space-y-4">
                      <Card>
                        {(() => {
                          console.log('🔍 [RENDER DEBUG] atendimentos:', atendimentos);
                          console.log('🔍 [RENDER DEBUG] atendimentos.length:', atendimentos?.length);
                          console.log('🔍 [RENDER DEBUG] Condição:', atendimentos && atendimentos.length > 0);
                          return null;
                        })()}
                        {atendimentos && atendimentos.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Atendido/Família</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Profissional</TableHead>
                                <TableHead>Duração</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {atendimentos
                                .sort((a: any, b: any) => new Date(b.dataAtendimento).getTime() - new Date(a.dataAtendimento).getTime())
                                .map((atend: any) => (
                                  <TableRow key={atend.id}>
                                    <TableCell>
                                      {new Date(atend.dataAtendimento).toLocaleDateString('pt-BR')}
                                    </TableCell>
                                    <TableCell>
                                      {atend.nomeParticipante || atend.nomeFamilia || 'Não identificado'}
                                    </TableCell>
                                    <TableCell className="capitalize">{atend.tipo}</TableCell>
                                    <TableCell>{atend.profissionalResponsavel || '-'}</TableCell>
                                    <TableCell>{atend.duracaoMinutos ? `${atend.duracaoMinutos} min` : '-'}</TableCell>
                                    <TableCell>
                                      <Badge className={
                                        atend.status === 'realizado' ? 'bg-green-100 text-green-800' :
                                        atend.status === 'reagendado' ? 'bg-orange-100 text-orange-800' :
                                        atend.status === 'faltou' ? 'bg-red-100 text-red-800' :
                                        'bg-blue-100 text-blue-800'
                                      }>
                                        {atend.status || 'Agendado'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        data-testid="button-view-appointment"
                                        title="Ver detalhes"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <CardContent className="py-12">
                            <div className="text-center text-gray-500">
                              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                              <p className="font-medium">Nenhum atendimento registrado</p>
                              <p className="text-sm mt-1">Clique em "Novo Atendimento" para começar</p>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="individuais" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Atendimentos Individuais</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {atendimentos.filter((a: any) => a.tipo === 'individual').length > 0 ? (
                            <div className="space-y-3">
                              {atendimentos
                                .filter((a: any) => a.tipo === 'individual')
                                .sort((a: any, b: any) => new Date(b.dataAtendimento).getTime() - new Date(a.dataAtendimento).getTime())
                                .map((atend: any) => (
                                  <div key={atend.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <h4 className="font-medium">{atend.nomeParticipante || 'Não identificado'}</h4>
                                        <p className="text-sm text-gray-600">
                                          {new Date(atend.dataAtendimento).toLocaleDateString('pt-BR')} - {atend.profissionalResponsavel || 'Sem profissional'}
                                        </p>
                                      </div>
                                      <Badge className={
                                        atend.status === 'realizado' ? 'bg-green-100 text-green-800' :
                                        atend.status === 'reagendado' ? 'bg-orange-100 text-orange-800' :
                                        atend.status === 'faltou' ? 'bg-red-100 text-red-800' :
                                        'bg-blue-100 text-blue-800'
                                      }>
                                        {atend.status || 'Agendado'}
                                      </Badge>
                                    </div>
                                    {atend.resumo && (
                                      <p className="text-sm text-gray-700 mt-2">{atend.resumo}</p>
                                    )}
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <User className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                              <p className="font-medium">Nenhum atendimento individual registrado</p>
                              <p className="text-sm mt-1">Clique em "Novo Atendimento" para criar</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="familiares" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Atendimentos Familiares</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {atendimentos.filter((a: any) => a.tipo === 'familiar').length > 0 ? (
                            <div className="space-y-3">
                              {atendimentos
                                .filter((a: any) => a.tipo === 'familiar')
                                .sort((a: any, b: any) => new Date(b.dataAtendimento).getTime() - new Date(a.dataAtendimento).getTime())
                                .map((atend: any) => (
                                  <div key={atend.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <h4 className="font-medium">{atend.nomeFamilia || 'Não identificado'}</h4>
                                        <p className="text-sm text-gray-600">
                                          {new Date(atend.dataAtendimento).toLocaleDateString('pt-BR')} - {atend.profissionalResponsavel || 'Sem profissional'}
                                        </p>
                                      </div>
                                      <Badge className={
                                        atend.status === 'realizado' ? 'bg-green-100 text-green-800' :
                                        atend.status === 'reagendado' ? 'bg-orange-100 text-orange-800' :
                                        atend.status === 'faltou' ? 'bg-red-100 text-red-800' :
                                        'bg-blue-100 text-blue-800'
                                      }>
                                        {atend.status || 'Agendado'}
                                      </Badge>
                                    </div>
                                    {atend.resumo && (
                                      <p className="text-sm text-gray-700 mt-2">{atend.resumo}</p>
                                    )}
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                              <p className="font-medium">Nenhum atendimento familiar registrado</p>
                              <p className="text-sm mt-1">Clique em "Novo Atendimento" para criar</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'grupos' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Grupos Terapêuticos</CardTitle>
                <Button 
                  className="bg-purple-500 hover:bg-purple-600"
                  onClick={() => setShowGrupoModal(true)}
                  data-testid="button-novo-grupo"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Grupo
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="Buscar grupos..." className="pl-10" />
                    </div>
                    <Select>
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
                  
                  <div className="grid gap-4">
                    {[
                      {
                        nome: 'Grupo Terapêutico de Mulheres',
                        tipo: 'Terapêutico',
                        participantes: 8,
                        facilitador: 'Ana Paula Costa',
                        horario: 'Quartas 14h-16h',
                        status: 'Ativo'
                      },
                      {
                        nome: 'Grupo de Apoio a Famílias',
                        tipo: 'Apoio',
                        participantes: 12,
                        facilitador: 'Carlos Silva',
                        horario: 'Sextas 16h-17h30',
                        status: 'Ativo'
                      },
                      {
                        nome: 'Grupo de Adolescentes',
                        tipo: 'Terapêutico',
                        participantes: 6,
                        facilitador: 'Marina Santos',
                        horario: 'Terças 15h-16h30',
                        status: 'Planejado'
                      }
                    ].map((grupo, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold flex items-center gap-2">
                            <Heart className="w-4 h-4 text-purple-500" />
                            {grupo.nome}
                          </h3>
                          <Badge variant={grupo.status === 'Ativo' ? 'default' : 'secondary'}>
                            {grupo.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-500">Tipo:</span>
                            <p className="font-medium">{grupo.tipo}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Participantes:</span>
                            <p className="font-medium">{grupo.participantes}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Facilitador:</span>
                            <p className="font-medium">{grupo.facilitador}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Horário:</span>
                            <p className="font-medium">{grupo.horario}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Users className="w-4 h-4 mr-1" />
                            Ver Participantes
                          </Button>
                          <Button size="sm" variant="outline">
                            <Calendar className="w-4 h-4 mr-1" />
                            Sessões
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'violacoes' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Violações de Direitos</CardTitle>
                <Button 
                  className="bg-red-500 hover:bg-red-600"
                  onClick={() => setShowViolacaoModal(true)}
                  data-testid="button-registrar-violacao"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Violação
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="Buscar casos..." className="pl-10" />
                    </div>
                    <Select>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Tipo de violação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="negligencia">Negligência</SelectItem>
                        <SelectItem value="violencia">Violência</SelectItem>
                        <SelectItem value="abandono">Abandono</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vítima</TableHead>
                        <TableHead>Tipo de Violação</TableHead>
                        <TableHead>Data do Registro</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <div>
                            <div className="font-medium">Menor A.S.</div>
                            <div className="text-sm text-gray-500">Idade: 8 anos</div>
                          </div>
                        </TableCell>
                        <TableCell>Negligência</TableCell>
                        <TableCell>15/09/2025</TableCell>
                        <TableCell>
                          <Badge className="bg-yellow-100 text-yellow-800">Em Investigação</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-red-100 text-red-800">Alta</Badge>
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
                        <TableCell>
                          <div>
                            <div className="font-medium">Maria C.</div>
                            <div className="text-sm text-gray-500">Idade: 34 anos</div>
                          </div>
                        </TableCell>
                        <TableCell>Violência Doméstica</TableCell>
                        <TableCell>20/09/2025</TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800">Em Acompanhamento</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-orange-100 text-orange-800">Média</Badge>
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

          {activeSection === 'medidas' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Medidas Protetivas</CardTitle>
                <Button 
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={() => setShowMedidaModal(true)}
                  data-testid="button-nova-medida"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Medida
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="Buscar medidas..." className="pl-10" />
                    </div>
                    <Select>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="ativa">Ativa</SelectItem>
                        <SelectItem value="cumprida">Cumprida</SelectItem>
                        <SelectItem value="violada">Violada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-4">
                    {[
                      {
                        id: 'MP001',
                        beneficiaria: 'Maria C.',
                        tipo: 'Medida Protetiva de Urgência',
                        descricao: 'Afastamento do agressor do lar',
                        dataInicio: '20/09/2025',
                        prazo: '6 meses',
                        status: 'Ativa'
                      },
                      {
                        id: 'MP002',
                        beneficiaria: 'Ana P.',
                        tipo: 'Proteção à Integridade Física',
                        descricao: 'Acompanhamento médico e psicológico',
                        dataInicio: '15/09/2025',
                        prazo: '3 meses',
                        status: 'Ativa'
                      }
                    ].map((medida, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold flex items-center gap-2">
                            <Shield className="w-4 h-4 text-orange-500" />
                            {medida.id} - {medida.beneficiaria}
                          </h3>
                          <Badge variant={medida.status === 'Ativa' ? 'default' : 'secondary'}>
                            {medida.status}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm mb-3">
                          <p><strong>Tipo:</strong> {medida.tipo}</p>
                          <p><strong>Descrição:</strong> {medida.descricao}</p>
                          <p><strong>Início:</strong> {medida.dataInicio}</p>
                          <p><strong>Prazo:</strong> {medida.prazo}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            Detalhes
                          </Button>
                          <Button size="sm" variant="outline">
                            <FileText className="w-4 h-4 mr-1" />
                            Relatório
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'rede' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Rede de Serviços</CardTitle>
                <Button 
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={() => setShowServicoModal(true)}
                  data-testid="button-novo-servico"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Serviço
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      {
                        nome: 'CAPS - Centro de Atenção Psicossocial',
                        tipo: 'Saúde Mental',
                        contato: '(31) 3333-4444',
                        endereco: 'Rua das Flores, 123',
                        disponibilidade: 'Segunda a Sexta 8h-17h'
                      },
                      {
                        nome: 'CREAS - Centro de Referência Especializado',
                        tipo: 'Assistência Social',
                        contato: '(31) 3555-6666',
                        endereco: 'Av. Principal, 456',
                        disponibilidade: 'Segunda a Sexta 7h-16h'
                      },
                      {
                        nome: 'Conselho Tutelar',
                        tipo: 'Proteção Infantil',
                        contato: '(31) 3777-8888',
                        endereco: 'Rua da Proteção, 789',
                        disponibilidade: '24h - Plantão'
                      },
                      {
                        nome: 'Defensoria Pública',
                        tipo: 'Jurídico',
                        contato: '(31) 3999-0000',
                        endereco: 'Praça da Justiça, 101',
                        disponibilidade: 'Segunda a Sexta 8h-18h'
                      }
                    ].map((servico, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-sm">{servico.nome}</h3>
                          <Badge variant="outline">{servico.tipo}</Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <p><strong>Contato:</strong> {servico.contato}</p>
                          <p><strong>Endereço:</strong> {servico.endereco}</p>
                          <p><strong>Funcionamento:</strong> {servico.disponibilidade}</p>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            Detalhes
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'encaminhamentos' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Encaminhamentos</CardTitle>
                <Button 
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => setShowEncaminhamentoModal(true)}
                  data-testid="button-novo-encaminhamento"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Encaminhamento
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="Buscar encaminhamentos..." className="pl-10" />
                    </div>
                    <Select>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="em-andamento">Em Andamento</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Família/Pessoa</TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <div>
                            <div className="font-medium">Maria Silva</div>
                            <div className="text-sm text-gray-500">Família Silva</div>
                          </div>
                        </TableCell>
                        <TableCell>CAPS - Atendimento Psicológico</TableCell>
                        <TableCell>20/09/2025</TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800">Em Andamento</Badge>
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
                        <TableCell>
                          <div>
                            <div className="font-medium">João Santos</div>
                            <div className="text-sm text-gray-500">Caso individual</div>
                          </div>
                        </TableCell>
                        <TableCell>CREAS - Acompanhamento Social</TableCell>
                        <TableCell>18/09/2025</TableCell>
                        <TableCell>
                          <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
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

          {activeSection === 'demanda' && (
            <DemandaEspontaneaSection
              userId={String(userId || "")}
              userRole="coordenador_psico"
            />
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
                        <FileText className="w-4 h-4 text-blue-500" />
                        Relatório de Famílias Atendidas
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        Gere relatórios detalhados das famílias em acompanhamento.
                      </p>
                      <div className="space-y-2">
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Período" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mensal">Mensal</SelectItem>
                            <SelectItem value="trimestral">Trimestral</SelectItem>
                            <SelectItem value="semestral">Semestral</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button className="w-full bg-blue-500 hover:bg-blue-600">
                          <Download className="w-4 h-4 mr-2" />
                          Gerar Relatório
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-green-500" />
                        Relatório de Casos Ativos
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        Análise dos casos em acompanhamento e resolutividade.
                      </p>
                      <div className="space-y-2">
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo de caso" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos os casos</SelectItem>
                            <SelectItem value="criticos">Casos críticos</SelectItem>
                            <SelectItem value="violacao">Violação de direitos</SelectItem>
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
                        { nome: 'Famílias Atendidas - Setembro 2025', data: '26/09/2025', tipo: 'PDF' },
                        { nome: 'Casos Críticos - Agosto 2025', data: '25/08/2025', tipo: 'PDF' },
                        { nome: 'Indicadores Mensais - Setembro 2025', data: '24/09/2025', tipo: 'Excel' }
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

          {activeSection === 'relatorios' && (
            <Card>
              <CardHeader>
                <CardTitle>Relatórios Mensais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Exportar Relatório Mensal
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Gere um relatório mensal no formato PDF seguindo o padrão do Instituto O Grito.
                      O relatório incluirá todos os atendimentos do mês selecionado.
                    </p>
                    
                    <PsicoMonthlyReport
                      month={new Date().toISOString().slice(0, 7)}
                      familias={Array.isArray(familias) ? familias : []}
                      atendimentos={Array.isArray(atendimentos) ? atendimentos : []}
                      casos={Array.isArray(casos) ? casos : []}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'acompanhamentos' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    Acompanhamentos Pedagógicos
                  </CardTitle>
                  <p className="text-sm text-gray-500">Observações registradas pelos professores sobre os alunos.</p>
                </CardHeader>
                <CardContent>
                  {todosAcompanhamentos.length === 0 ? (
                    <p className="text-gray-500 text-center py-10">Nenhum acompanhamento registrado ainda.</p>
                  ) : (
                    <div className="space-y-3">
                      {todosAcompanhamentos.map((ac: any) => {
                        const dateStr = ac.data;
                        return (
                          <div key={ac.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                              <span className="font-medium text-sm">{ac.titulo || 'Acompanhamento'}</span>
                              <div className="flex gap-2">
                                {ac.tipoObservacao && (
                                  <Badge variant="outline" className="text-xs capitalize">{ac.tipoObservacao}</Badge>
                                )}
                                {dateStr && (
                                  <Badge variant="secondary" className="text-xs">
                                    {new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00')).toLocaleDateString('pt-BR')}
                                  </Badge>
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
                </CardContent>
              </Card>
            </div>
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
                      <Users className="w-4 h-4" />
                      Informações Pessoais
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nome">Nome Completo</Label>
                        <Input 
                          id="nome" 
                          value={perfilForm.nome} 
                          onChange={(e) => setPerfilForm({...perfilForm, nome: e.target.value})}
                          data-testid="input-nome-perfil"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          value={perfilForm.email} 
                          onChange={(e) => setPerfilForm({...perfilForm, email: e.target.value})}
                          data-testid="input-email-perfil"
                        />
                      </div>
                      <div>
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input 
                          id="telefone" 
                          value={perfilForm.telefone} 
                          onChange={(e) => setPerfilForm({...perfilForm, telefone: e.target.value})}
                          data-testid="input-telefone-perfil"
                        />
                      </div>
                    </div>
                    <Button 
                      className="mt-4 bg-blue-500 hover:bg-blue-600"
                      onClick={handleSavePerfil}
                      disabled={updatePerfilMutation.isPending}
                      data-testid="button-salvar-perfil"
                    >
                      {updatePerfilMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
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
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de Importação */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Dados Psicossociais</DialogTitle>
            <DialogDescription>
              Faça upload de um arquivo Excel (.xlsx, .xls) ou PDF (.pdf) com dados de famílias e atendimentos.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
              <input
                type="file"
                id="file-upload"
                accept=".xlsx,.xls,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImportFile(file);
                  }
                }}
                data-testid="input-file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center">
                  <Upload className="h-12 w-12 text-gray-400 mb-3" />
                  {importFile ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900">{importFile.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(importFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 mb-1">
                        Clique para selecionar ou arraste o arquivo
                      </p>
                      <p className="text-xs text-gray-500">
                        Formatos aceitos: .xlsx, .xls, .pdf
                      </p>
                    </>
                  )}
                </div>
              </label>
            </div>

            {importFile && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-purple-900">Arquivo selecionado</p>
                    <p className="text-xs text-purple-700 mt-1">
                      Os dados serão importados para as tabelas de famílias e atendimentos.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setShowImportModal(false);
                setImportFile(null);
              }}
              data-testid="button-cancel-import"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImportFile}
              disabled={!importFile || isImporting}
              className="bg-purple-500 hover:bg-purple-600"
              data-testid="button-confirm-import"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Cadastro de Família */}
      <Dialog open={showFamiliaModal} onOpenChange={(open) => {
        setShowFamiliaModal(open);
        if (!open) setBuscaAtendidoFamilia('');
      }}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Cadastrar Nova Família</DialogTitle>
            <DialogDescription>
              Preencha os dados da família para cadastro no programa psicossocial.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 overflow-y-auto flex-1 px-4">
            <div className="space-y-2">
              <Label htmlFor="nome-responsavel">Nome do Responsável *</Label>
              <Input
                id="nome-responsavel"
                placeholder="Nome completo do responsável"
                value={familiaForm.nomeResponsavel}
                onChange={(e) => setFamiliaForm({ ...familiaForm, nomeResponsavel: e.target.value })}
                data-testid="input-nome-responsavel"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero-membros">Número de Membros</Label>
                <Input
                  id="numero-membros"
                  type="number"
                  min="1"
                  value={familiaForm.numeroMembros}
                  onChange={(e) => setFamiliaForm({ ...familiaForm, numeroMembros: parseInt(e.target.value) || 1 })}
                  data-testid="input-numero-membros"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  placeholder="(00) 00000-0000"
                  value={familiaForm.telefone}
                  onChange={(e) => setFamiliaForm({ ...familiaForm, telefone: e.target.value })}
                  data-testid="input-telefone"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                placeholder="Rua, número, bairro"
                value={familiaForm.endereco}
                onChange={(e) => setFamiliaForm({ ...familiaForm, endereco: e.target.value })}
                data-testid="input-endereco"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={familiaForm.status} 
                onValueChange={(value: any) => setFamiliaForm({ ...familiaForm, status: value })}
              >
                <SelectTrigger id="status" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="em_acompanhamento">Em Acompanhamento</SelectItem>
                  <SelectItem value="encerrado">Encerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Atendidos desta Família</Label>
              <Input
                placeholder="🔍 Buscar atendido por nome..."
                value={buscaAtendidoFamilia}
                onChange={(e) => setBuscaAtendidoFamilia(e.target.value)}
                className="mb-2"
                data-testid="input-busca-atendido-familia"
              />
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                {participantesData && participantesData.length > 0 ? (
                  participantesData
                    .filter((p: any) => 
                      !buscaAtendidoFamilia || 
                      p.nome.toLowerCase().includes(buscaAtendidoFamilia.toLowerCase())
                    )
                    .map((participante: any) => (
                    <label 
                      key={participante.vinculo_id} 
                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={familiaForm.atendidosSelecionados.includes(participante.vinculo_id)}
                        onChange={(e) => {
                          const vinculoId = participante.vinculo_id;
                          if (e.target.checked) {
                            setFamiliaForm({
                              ...familiaForm,
                              atendidosSelecionados: [...familiaForm.atendidosSelecionados, vinculoId]
                            });
                          } else {
                            setFamiliaForm({
                              ...familiaForm,
                              atendidosSelecionados: familiaForm.atendidosSelecionados.filter(id => id !== vinculoId)
                            });
                          }
                        }}
                        className="rounded"
                        data-testid={`checkbox-atendido-${participante.vinculo_id}`}
                      />
                      <span className="flex-1">
                        {participante.nome}
                        <Badge className={`ml-2 ${participante.programa_origem === 'pec' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                          {participante.programa_origem === 'pec' ? 'PEC' : 'Inclusão'}
                        </Badge>
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2">Nenhum atendido disponível</p>
                )}
                {participantesData && participantesData.length > 0 && 
                 participantesData.filter((p: any) => 
                   !buscaAtendidoFamilia || 
                   p.nome.toLowerCase().includes(buscaAtendidoFamilia.toLowerCase())
                 ).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-2">Nenhum atendido encontrado com esse nome</p>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {familiaForm.atendidosSelecionados.length} atendido(s) selecionado(s)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Informações adicionais sobre a família..."
                rows={3}
                value={familiaForm.observacoes}
                onChange={(e) => setFamiliaForm({ ...familiaForm, observacoes: e.target.value })}
                data-testid="textarea-observacoes"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between flex-shrink-0 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowFamiliaModal(false);
                setBuscaAtendidoFamilia('');
                setFamiliaForm({
                  nomeResponsavel: '',
                  numeroMembros: 1,
                  telefone: '',
                  endereco: '',
                  status: 'ativo',
                  observacoes: '',
                  atendidosSelecionados: []
                });
              }}
              data-testid="button-cancel-familia"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveFamilia}
              disabled={createFamiliaMutation.isPending}
              className="bg-purple-500 hover:bg-purple-600"
              data-testid="button-save-familia"
            >
              {createFamiliaMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Família */}
      <Dialog open={showEditFamiliaModal} onOpenChange={setShowEditFamiliaModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Família</DialogTitle>
            <DialogDescription>
              Atualize os dados da família selecionada.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome-responsavel">Nome do Responsável *</Label>
              <Input
                id="edit-nome-responsavel"
                placeholder="Nome completo do responsável"
                value={familiaForm.nomeResponsavel}
                onChange={(e) => setFamiliaForm({ ...familiaForm, nomeResponsavel: e.target.value })}
                data-testid="input-edit-nome-responsavel"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-numero-membros">Número de Membros</Label>
                <Input
                  id="edit-numero-membros"
                  type="number"
                  min="1"
                  value={familiaForm.numeroMembros}
                  onChange={(e) => setFamiliaForm({ ...familiaForm, numeroMembros: parseInt(e.target.value) || 1 })}
                  data-testid="input-edit-numero-membros"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-telefone">Telefone</Label>
                <Input
                  id="edit-telefone"
                  placeholder="(00) 00000-0000"
                  value={familiaForm.telefone}
                  onChange={(e) => setFamiliaForm({ ...familiaForm, telefone: e.target.value })}
                  data-testid="input-edit-telefone"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-endereco">Endereço</Label>
              <Input
                id="edit-endereco"
                placeholder="Rua, número, bairro"
                value={familiaForm.endereco}
                onChange={(e) => setFamiliaForm({ ...familiaForm, endereco: e.target.value })}
                data-testid="input-edit-endereco"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select 
                value={familiaForm.status} 
                onValueChange={(value: any) => setFamiliaForm({ ...familiaForm, status: value })}
              >
                <SelectTrigger id="edit-status" data-testid="select-edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="em_acompanhamento">Em Acompanhamento</SelectItem>
                  <SelectItem value="encerrado">Encerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-observacoes">Observações</Label>
              <Textarea
                id="edit-observacoes"
                placeholder="Informações adicionais sobre a família..."
                rows={3}
                value={familiaForm.observacoes}
                onChange={(e) => setFamiliaForm({ ...familiaForm, observacoes: e.target.value })}
                data-testid="textarea-edit-observacoes"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditFamiliaModal(false);
                setSelectedFamilia(null);
                setFamiliaForm({
                  nomeResponsavel: '',
                  numeroMembros: 1,
                  telefone: '',
                  endereco: '',
                  status: 'ativo',
                  observacoes: ''
                });
              }}
              data-testid="button-cancel-edit-familia"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateFamilia}
              disabled={updateFamiliaMutation.isPending}
              className="bg-purple-500 hover:bg-purple-600"
              data-testid="button-update-familia"
            >
              {updateFamiliaMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Atualizar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização de Família */}
      <Dialog open={showViewFamiliaModal} onOpenChange={setShowViewFamiliaModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Família</DialogTitle>
            <DialogDescription>
              Informações completas da família selecionada.
            </DialogDescription>
          </DialogHeader>
          
          {selectedFamilia && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">ID</Label>
                  <p className="font-medium">#{selectedFamilia.id}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Status</Label>
                  <p className="font-medium">
                    {selectedFamilia.status === 'em_acompanhamento' ? 'Em Acompanhamento' :
                     selectedFamilia.status === 'ativo' ? 'Ativo' :
                     selectedFamilia.status === 'inativo' ? 'Inativo' :
                     'Encerrado'}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm text-gray-500">Responsável</Label>
                <p className="font-medium">{selectedFamilia.nomeResponsavel}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Número de Membros</Label>
                  <p className="font-medium">{selectedFamilia.numeroMembros}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Telefone</Label>
                  <p className="font-medium">{selectedFamilia.telefone || 'N/A'}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm text-gray-500">Endereço</Label>
                <p className="font-medium">{selectedFamilia.endereco || 'N/A'}</p>
              </div>

              {selectedFamilia.observacoes && (
                <div>
                  <Label className="text-sm text-gray-500">Observações</Label>
                  <p className="text-sm">{selectedFamilia.observacoes}</p>
                </div>
              )}

              <div>
                <Label className="text-sm text-gray-500">Último Atendimento</Label>
                <p className="font-medium">{selectedFamilia.ultimoAtendimento || 'Nenhum atendimento registrado'}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowViewFamiliaModal(false);
                setSelectedFamilia(null);
              }}
              data-testid="button-close-view-familia"
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                setShowViewFamiliaModal(false);
                setFamiliaForm({
                  nomeResponsavel: selectedFamilia.nomeResponsavel,
                  numeroMembros: selectedFamilia.numeroMembros,
                  telefone: selectedFamilia.telefone || '',
                  endereco: selectedFamilia.endereco || '',
                  status: selectedFamilia.status,
                  observacoes: selectedFamilia.observacoes || ''
                });
                setShowEditFamiliaModal(true);
              }}
              className="bg-purple-500 hover:bg-purple-600"
              data-testid="button-edit-from-view"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Novo Caso */}
      <Dialog open={showCasoModal} onOpenChange={setShowCasoModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Novo Caso</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo caso psicossocial.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="caso-titulo">Título do Caso *</Label>
              <Input
                id="caso-titulo"
                placeholder="Ex: Acompanhamento familiar - Violência doméstica"
                value={casoForm.titulo}
                onChange={(e) => setCasoForm({ ...casoForm, titulo: e.target.value })}
                data-testid="input-caso-titulo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="caso-familia">Família</Label>
              <Select 
                value={casoForm.familiaId?.toString() || ''} 
                onValueChange={(value) => setCasoForm({ ...casoForm, familiaId: value ? parseInt(value) : null })}
              >
                <SelectTrigger id="caso-familia" data-testid="select-caso-familia">
                  <SelectValue placeholder="Selecione a família" />
                </SelectTrigger>
                <SelectContent>
                  {familias.map((familia: any) => (
                    <SelectItem key={familia.id} value={familia.id.toString()}>
                      Família {familia.nomeResponsavel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="caso-tipo">Tipo de Caso *</Label>
                <Select 
                  value={casoForm.tipo} 
                  onValueChange={(value) => setCasoForm({ ...casoForm, tipo: value })}
                >
                  <SelectTrigger id="caso-tipo" data-testid="select-caso-tipo">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Violência Doméstica">Violência Doméstica</SelectItem>
                    <SelectItem value="Dependência Química">Dependência Química</SelectItem>
                    <SelectItem value="Vulnerabilidade Social">Vulnerabilidade Social</SelectItem>
                    <SelectItem value="Conflito Familiar">Conflito Familiar</SelectItem>
                    <SelectItem value="Saúde Mental">Saúde Mental</SelectItem>
                    <SelectItem value="Negligência">Negligência</SelectItem>
                    <SelectItem value="Abandono">Abandono</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="caso-prioridade">Prioridade</Label>
                <Select 
                  value={casoForm.prioridade} 
                  onValueChange={(value: any) => setCasoForm({ ...casoForm, prioridade: value })}
                >
                  <SelectTrigger id="caso-prioridade" data-testid="select-caso-prioridade">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caso-descricao">Descrição</Label>
              <Textarea
                id="caso-descricao"
                placeholder="Descreva os detalhes do caso..."
                rows={4}
                value={casoForm.descricao}
                onChange={(e) => setCasoForm({ ...casoForm, descricao: e.target.value })}
                data-testid="textarea-caso-descricao"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setShowCasoModal(false);
                setCasoForm({
                  familiaId: null,
                  titulo: '',
                  tipo: '',
                  prioridade: 'media',
                  status: 'aberto',
                  descricao: ''
                });
              }}
              data-testid="button-cancel-caso"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveCaso}
              disabled={createCasoMutation.isPending}
              className="bg-purple-500 hover:bg-purple-600"
              data-testid="button-save-caso"
            >
              {createCasoMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                'Registrar Caso'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal - Novo Atendimento */}
      <Dialog open={showAtendimentoModal} onOpenChange={setShowAtendimentoModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Novo Atendimento</DialogTitle>
            <DialogDescription>
              Preencha os dados do atendimento psicossocial.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="atend-atendido">Atendido</Label>
              <div className="relative">
                <Input
                  id="atend-atendido"
                  placeholder="🔍 Buscar atendido por nome..."
                  value={atendidoSelecionadoNome || buscaAtendido}
                  onChange={(e) => {
                    setAtendidoSelecionadoNome('');
                    setBuscaAtendido(e.target.value);
                    if (!e.target.value) {
                      setAtendimentoForm({ ...atendimentoForm, vinculoId: null, programaOrigem: null, familiaId: null });
                    }
                  }}
                  data-testid="input-busca-atendido"
                />
                {buscaAtendido && !atendidoSelecionadoNome && (
                  <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {(todosAtendidosParaAtendimento as any[])
                      .filter((p: any) => (p.nome || '').toLowerCase().includes(buscaAtendido.toLowerCase()))
                      .slice(0, 30)
                      .map((pessoa: any) => (
                        <div
                          key={`${pessoa.origem}_${pessoa.id}`}
                          className="px-3 py-2 cursor-pointer hover:bg-purple-50 text-sm border-b last:border-b-0"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setAtendidoSelecionadoNome(pessoa.label || pessoa.nome);
                            setBuscaAtendido('');
                            setAtendimentoForm({ ...atendimentoForm, vinculoId: pessoa.id, programaOrigem: pessoa.origem, familiaId: null });
                          }}
                        >
                          {pessoa.label || pessoa.nome}
                        </div>
                      ))}
                    {(todosAtendidosParaAtendimento as any[]).filter((p: any) =>
                      (p.nome || '').toLowerCase().includes(buscaAtendido.toLowerCase())
                    ).length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500 text-center">Nenhum atendido encontrado</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="atend-familia">Família (opcional)</Label>
              <Select 
                value={atendimentoForm.familiaId?.toString() || ''} 
                onValueChange={(value) => setAtendimentoForm({ ...atendimentoForm, familiaId: value ? parseInt(value) : null })}
              >
                <SelectTrigger id="atend-familia" data-testid="select-atendimento-familia">
                  <SelectValue placeholder="Selecione a família" />
                </SelectTrigger>
                <SelectContent>
                  {familias.map((familia: any) => (
                    <SelectItem key={familia.id} value={familia.id.toString()}>
                      Família {familia.nomeResponsavel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="atend-caso">Caso Relacionado</Label>
              <Select 
                value={atendimentoForm.casoId?.toString() || ''} 
                onValueChange={(value) => setAtendimentoForm({ ...atendimentoForm, casoId: value ? parseInt(value) : null })}
              >
                <SelectTrigger id="atend-caso" data-testid="select-atendimento-caso">
                  <SelectValue placeholder="Selecione o caso (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {casos.map((caso: any) => (
                    <SelectItem key={caso.id} value={caso.id.toString()}>
                      {caso.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="atend-tipo">Tipo de Atendimento *</Label>
                <Select 
                  value={atendimentoForm.tipo} 
                  onValueChange={(value: any) => setAtendimentoForm({ ...atendimentoForm, tipo: value })}
                >
                  <SelectTrigger id="atend-tipo" data-testid="select-atendimento-tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="familiar">Familiar</SelectItem>
                    <SelectItem value="grupo">Grupo</SelectItem>
                    <SelectItem value="visita_domiciliar">Visita Domiciliar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="atend-data">Data *</Label>
                <Input
                  id="atend-data"
                  type="date"
                  value={atendimentoForm.dataAtendimento}
                  onChange={(e) => setAtendimentoForm({ ...atendimentoForm, dataAtendimento: e.target.value })}
                  data-testid="input-atendimento-data"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="atend-duracao">Duração (minutos) *</Label>
                <Input
                  id="atend-duracao"
                  type="number"
                  min="15"
                  step="15"
                  value={atendimentoForm.duracaoMinutos}
                  onChange={(e) => setAtendimentoForm({ ...atendimentoForm, duracaoMinutos: parseInt(e.target.value) || 60 })}
                  data-testid="input-atendimento-duracao"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="atend-profissional">Profissional Responsável</Label>
                <Input
                  id="atend-profissional"
                  placeholder="Ex: Psicólogo, Assistente Social"
                  value={atendimentoForm.profissionalResponsavel}
                  onChange={(e) => setAtendimentoForm({ ...atendimentoForm, profissionalResponsavel: e.target.value })}
                  data-testid="input-atendimento-profissional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="atend-resumo">Resumo do Atendimento</Label>
              <Textarea
                id="atend-resumo"
                placeholder="Resumo do que foi trabalhado no atendimento..."
                rows={3}
                value={atendimentoForm.resumo}
                onChange={(e) => setAtendimentoForm({ ...atendimentoForm, resumo: e.target.value })}
                data-testid="textarea-atendimento-resumo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="atend-observacoes">Observações</Label>
              <Textarea
                id="atend-observacoes"
                placeholder="Observações adicionais..."
                rows={2}
                value={atendimentoForm.observacoes}
                onChange={(e) => setAtendimentoForm({ ...atendimentoForm, observacoes: e.target.value })}
                data-testid="textarea-atendimento-observacoes"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setShowAtendimentoModal(false);
                setBuscaAtendido('');
                setAtendidoSelecionadoNome('');
                setAtendimentoForm({
                  familiaId: null,
                  casoId: null,
                  vinculoId: null,
                  programaOrigem: null,
                  tipo: 'individual',
                  dataAtendimento: new Date().toISOString().split('T')[0],
                  duracaoMinutos: 60,
                  profissionalResponsavel: '',
                  resumo: '',
                  observacoes: ''
                });
              }}
              data-testid="button-cancel-atendimento"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveAtendimento}
              disabled={createAtendimentoMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600"
              data-testid="button-save-atendimento"
            >
              {createAtendimentoMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                'Registrar Atendimento'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal - Histórico de Atendimentos do Participante */}
      <Dialog open={showHistoricoModal} onOpenChange={setShowHistoricoModal}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Atendimentos</DialogTitle>
            <DialogDescription>
              {selectedParticipante && (
                <div className="mt-2">
                  <p className="font-medium">{normalizeName(selectedParticipante.nome || "")}</p>
                  {selectedParticipante.programa_origem && (
                    <Badge className={selectedParticipante.programa_origem === 'pec' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                      {selectedParticipante.programa_origem === 'pec' ? 'PEC' : 'Inclusão Produtiva'}
                    </Badge>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {(() => {
              // Prioridade 1: atendimentos já incluídos no objeto (vêm de registros_confidenciais)
              const registros: any[] = selectedParticipante?.atendimentos || [];
              if (registros.length > 0) {
                const tipoLabel: Record<string, string> = {
                  atendimento_individual: 'Atendimento Individual',
                  atendimento_familiar: 'Atendimento Familiar',
                  atendimento_grupo: 'Atendimento em Grupo',
                  visita_domiciliar: 'Visita Domiciliar',
                  acolhimento: 'Acolhimento',
                  encaminhamento: 'Encaminhamento',
                };
                return (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Total de registros: <strong>{registros.length}</strong></p>
                    {registros.map((r: any) => (
                      <div key={r.id} className="border rounded-lg p-4 space-y-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">{r.titulo || tipoLabel[r.tipo] || r.tipo}</h4>
                          <Badge variant="outline">{tipoLabel[r.tipo] || r.tipo}</Badge>
                        </div>
                        {r.data && <p className="text-sm text-gray-500">{new Date(r.data).toLocaleDateString('pt-BR')}</p>}
                        {r.vertente && r.vertente !== 'todos' && <p className="text-xs text-gray-400">Vertente: {r.vertente}</p>}
                      </div>
                    ))}
                  </div>
                );
              }
              // Prioridade 2: histórico por vinculo_id (participantes de PEC/Inclusão)
              if (isLoadingHistorico) return (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Carregando histórico...</p>
                </div>
              );
              if (historicoData?.atendimentos?.length > 0) return (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Total de atendimentos: <strong>{historicoData.atendimentos.length}</strong></p>
                  {historicoData.atendimentos.map((atendimento: any) => (
                    <div key={atendimento.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">
                            {atendimento.tipo === 'individual' && 'Atendimento Individual'}
                            {atendimento.tipo === 'familiar' && 'Atendimento Familiar'}
                            {atendimento.tipo === 'grupo' && 'Atendimento em Grupo'}
                            {atendimento.tipo === 'visita_domiciliar' && 'Visita Domiciliar'}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {new Date(atendimento.dataAtendimento).toLocaleDateString('pt-BR')} • {atendimento.duracaoMinutos} min
                          </p>
                        </div>
                        <Badge variant="outline">{atendimento.tipo}</Badge>
                      </div>
                      {atendimento.resumo && <p className="text-sm"><strong>Resumo:</strong> {atendimento.resumo}</p>}
                    </div>
                  ))}
                </div>
              );
              return (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum registro encontrado.</p>
                </div>
              );
            })()}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowHistoricoModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal - Novo Grupo Terapêutico */}
      <Dialog open={showGrupoModal} onOpenChange={setShowGrupoModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Grupo Terapêutico</DialogTitle>
            <DialogDescription>
              Preencha os dados do grupo terapêutico.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grupo-nome">Nome do Grupo *</Label>
              <Input
                id="grupo-nome"
                placeholder="Ex: Grupo Terapêutico de Mulheres"
                value={grupoForm.nome}
                onChange={(e) => setGrupoForm({ ...grupoForm, nome: e.target.value })}
                data-testid="input-grupo-nome"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grupo-tipo">Tipo de Grupo *</Label>
                <Select 
                  value={grupoForm.tipo} 
                  onValueChange={(value: any) => setGrupoForm({ ...grupoForm, tipo: value })}
                >
                  <SelectTrigger id="grupo-tipo" data-testid="select-grupo-tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="terapeutico">Terapêutico</SelectItem>
                    <SelectItem value="apoio">Apoio</SelectItem>
                    <SelectItem value="educativo">Educativo</SelectItem>
                    <SelectItem value="oficina">Oficina</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grupo-status">Status</Label>
                <Select 
                  value={grupoForm.status} 
                  onValueChange={(value: any) => setGrupoForm({ ...grupoForm, status: value })}
                >
                  <SelectTrigger id="grupo-status" data-testid="select-grupo-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="em_formacao">Em Formação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grupo-facilitador">Facilitador/Profissional Responsável</Label>
              <Input
                id="grupo-facilitador"
                placeholder="Ex: Ana Paula Costa - Psicóloga"
                value={grupoForm.facilitador}
                onChange={(e) => setGrupoForm({ ...grupoForm, facilitador: e.target.value })}
                data-testid="input-grupo-facilitador"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grupo-dia">Dia da Semana</Label>
                <Select 
                  value={grupoForm.diaSemana} 
                  onValueChange={(value) => setGrupoForm({ ...grupoForm, diaSemana: value })}
                >
                  <SelectTrigger id="grupo-dia" data-testid="select-grupo-dia">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Segunda-feira">Segunda-feira</SelectItem>
                    <SelectItem value="Terça-feira">Terça-feira</SelectItem>
                    <SelectItem value="Quarta-feira">Quarta-feira</SelectItem>
                    <SelectItem value="Quinta-feira">Quinta-feira</SelectItem>
                    <SelectItem value="Sexta-feira">Sexta-feira</SelectItem>
                    <SelectItem value="Sábado">Sábado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grupo-horario">Horário</Label>
                <Input
                  id="grupo-horario"
                  type="time"
                  value={grupoForm.horario}
                  onChange={(e) => setGrupoForm({ ...grupoForm, horario: e.target.value })}
                  data-testid="input-grupo-horario"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="grupo-max">Máx. Participantes</Label>
                <Input
                  id="grupo-max"
                  type="number"
                  min="5"
                  max="30"
                  value={grupoForm.maxParticipantes}
                  onChange={(e) => setGrupoForm({ ...grupoForm, maxParticipantes: parseInt(e.target.value) || 15 })}
                  data-testid="input-grupo-max"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grupo-local">Local</Label>
              <Input
                id="grupo-local"
                placeholder="Ex: Sala 2 - Instituto O Grito"
                value={grupoForm.local}
                onChange={(e) => setGrupoForm({ ...grupoForm, local: e.target.value })}
                data-testid="input-grupo-local"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grupo-objetivo">Objetivo do Grupo</Label>
              <Textarea
                id="grupo-objetivo"
                placeholder="Descreva o objetivo e propósito do grupo..."
                rows={2}
                value={grupoForm.objetivo}
                onChange={(e) => setGrupoForm({ ...grupoForm, objetivo: e.target.value })}
                data-testid="textarea-grupo-objetivo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grupo-descricao">Descrição/Metodologia</Label>
              <Textarea
                id="grupo-descricao"
                placeholder="Metodologia utilizada, abordagem terapêutica, etc..."
                rows={3}
                value={grupoForm.descricao}
                onChange={(e) => setGrupoForm({ ...grupoForm, descricao: e.target.value })}
                data-testid="textarea-grupo-descricao"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setShowGrupoModal(false);
                setGrupoForm({
                  nome: '',
                  tipo: 'terapeutico',
                  facilitador: '',
                  diaSemana: '',
                  horario: '',
                  local: '',
                  maxParticipantes: 15,
                  status: 'ativo',
                  descricao: '',
                  objetivo: ''
                });
              }}
              data-testid="button-cancel-grupo"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "Em desenvolvimento",
                  description: "Funcionalidade de criar grupo em desenvolvimento.",
                });
                setShowGrupoModal(false);
              }}
              className="bg-purple-500 hover:bg-purple-600"
              data-testid="button-save-grupo"
            >
              Criar Grupo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal - Registrar Violação de Direitos */}
      <Dialog open={showViolacaoModal} onOpenChange={setShowViolacaoModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Violação de Direitos</DialogTitle>
            <DialogDescription>
              Registre casos de violações de direitos para acompanhamento e medidas protetivas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="violacao-vitima">Nome da Vítima *</Label>
                <Input
                  id="violacao-vitima"
                  placeholder="Nome completo ou iniciais"
                  value={violacaoForm.vitimaNome}
                  onChange={(e) => setViolacaoForm({ ...violacaoForm, vitimaNome: e.target.value })}
                  data-testid="input-violacao-vitima"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="violacao-idade">Idade da Vítima</Label>
                <Input
                  id="violacao-idade"
                  placeholder="Ex: 8 anos, 34 anos"
                  value={violacaoForm.vitimaIdade}
                  onChange={(e) => setViolacaoForm({ ...violacaoForm, vitimaIdade: e.target.value })}
                  data-testid="input-violacao-idade"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="violacao-tipo">Tipo de Violação *</Label>
              <Select 
                value={violacaoForm.tipoViolacao} 
                onValueChange={(value) => setViolacaoForm({ ...violacaoForm, tipoViolacao: value })}
              >
                <SelectTrigger id="violacao-tipo" data-testid="select-violacao-tipo">
                  <SelectValue placeholder="Selecione o tipo de violação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Negligência">Negligência</SelectItem>
                  <SelectItem value="Violência Doméstica">Violência Doméstica</SelectItem>
                  <SelectItem value="Violência Física">Violência Física</SelectItem>
                  <SelectItem value="Violência Psicológica">Violência Psicológica</SelectItem>
                  <SelectItem value="Violência Sexual">Violência Sexual</SelectItem>
                  <SelectItem value="Exploração Infantil">Exploração Infantil</SelectItem>
                  <SelectItem value="Abandono">Abandono</SelectItem>
                  <SelectItem value="Discriminação">Discriminação</SelectItem>
                  <SelectItem value="Outras">Outras</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="violacao-data">Data do Registro *</Label>
                <Input
                  id="violacao-data"
                  type="date"
                  value={violacaoForm.dataRegistro}
                  onChange={(e) => setViolacaoForm({ ...violacaoForm, dataRegistro: e.target.value })}
                  data-testid="input-violacao-data"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="violacao-prioridade">Prioridade *</Label>
                <Select 
                  value={violacaoForm.prioridade} 
                  onValueChange={(value: any) => setViolacaoForm({ ...violacaoForm, prioridade: value })}
                >
                  <SelectTrigger id="violacao-prioridade" data-testid="select-violacao-prioridade">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="violacao-status">Status</Label>
                <Select 
                  value={violacaoForm.status} 
                  onValueChange={(value: any) => setViolacaoForm({ ...violacaoForm, status: value })}
                >
                  <SelectTrigger id="violacao-status" data-testid="select-violacao-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="em_investigacao">Em Investigação</SelectItem>
                    <SelectItem value="em_acompanhamento">Em Acompanhamento</SelectItem>
                    <SelectItem value="encaminhado">Encaminhado</SelectItem>
                    <SelectItem value="resolvido">Resolvido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="violacao-descricao">Descrição do Caso *</Label>
              <Textarea
                id="violacao-descricao"
                placeholder="Descreva detalhadamente o caso de violação..."
                rows={4}
                value={violacaoForm.descricao}
                onChange={(e) => setViolacaoForm({ ...violacaoForm, descricao: e.target.value })}
                data-testid="textarea-violacao-descricao"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="violacao-medidas">Medidas Tomadas</Label>
              <Textarea
                id="violacao-medidas"
                placeholder="Descreva as medidas protetivas ou ações já tomadas..."
                rows={3}
                value={violacaoForm.medidasTomadas}
                onChange={(e) => setViolacaoForm({ ...violacaoForm, medidasTomadas: e.target.value })}
                data-testid="textarea-violacao-medidas"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="violacao-orgaos">Órgãos Acionados</Label>
              <Input
                id="violacao-orgaos"
                placeholder="Ex: Conselho Tutelar, CRAS, Polícia Civil"
                value={violacaoForm.orgaosAcionados}
                onChange={(e) => setViolacaoForm({ ...violacaoForm, orgaosAcionados: e.target.value })}
                data-testid="input-violacao-orgaos"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setShowViolacaoModal(false);
                setViolacaoForm({
                  vitimaNome: '',
                  vitimaIdade: '',
                  tipoViolacao: '',
                  dataRegistro: new Date().toISOString().split('T')[0],
                  status: 'em_investigacao',
                  prioridade: 'alta',
                  descricao: '',
                  medidasTomadas: '',
                  orgaosAcionados: ''
                });
              }}
              data-testid="button-cancel-violacao"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "Em desenvolvimento",
                  description: "Funcionalidade de registrar violação em desenvolvimento.",
                });
                setShowViolacaoModal(false);
              }}
              className="bg-red-500 hover:bg-red-600"
              data-testid="button-save-violacao"
            >
              Registrar Violação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal - Nova Medida Protetiva */}
      <Dialog open={showMedidaModal} onOpenChange={setShowMedidaModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Medida Protetiva</DialogTitle>
            <DialogDescription>
              Registre medidas protetivas aplicadas para proteção e acompanhamento.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="medida-codigo">Código/Identificação</Label>
                <Input
                  id="medida-codigo"
                  placeholder="Ex: MP001, MP-2025-001"
                  value={medidaForm.codigo}
                  onChange={(e) => setMedidaForm({ ...medidaForm, codigo: e.target.value })}
                  data-testid="input-medida-codigo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medida-tipo">Tipo de Medida Protetiva *</Label>
                <Select 
                  value={medidaForm.tipo} 
                  onValueChange={(value) => setMedidaForm({ ...medidaForm, tipo: value })}
                >
                  <SelectTrigger id="medida-tipo" data-testid="select-medida-tipo">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Medida Protetiva de Urgência">Medida Protetiva de Urgência</SelectItem>
                    <SelectItem value="Acolhimento Institucional">Acolhimento Institucional</SelectItem>
                    <SelectItem value="Afastamento do Agressor">Afastamento do Agressor</SelectItem>
                    <SelectItem value="Encaminhamento CREAS">Encaminhamento CREAS</SelectItem>
                    <SelectItem value="Encaminhamento CRAS">Encaminhamento CRAS</SelectItem>
                    <SelectItem value="Acompanhamento Psicológico">Acompanhamento Psicológico</SelectItem>
                    <SelectItem value="Acompanhamento Social">Acompanhamento Social</SelectItem>
                    <SelectItem value="Outras">Outras</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medida-beneficiario">Beneficiário/Pessoa Protegida *</Label>
              <Input
                id="medida-beneficiario"
                placeholder="Nome do beneficiário ou identificação"
                value={medidaForm.beneficiario}
                onChange={(e) => setMedidaForm({ ...medidaForm, beneficiario: e.target.value })}
                data-testid="input-medida-beneficiario"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medida-descricao">Descrição da Medida *</Label>
              <Textarea
                id="medida-descricao"
                placeholder="Descreva detalhadamente a medida protetiva aplicada..."
                rows={3}
                value={medidaForm.descricao}
                onChange={(e) => setMedidaForm({ ...medidaForm, descricao: e.target.value })}
                data-testid="textarea-medida-descricao"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="medida-data">Data de Início *</Label>
                <Input
                  id="medida-data"
                  type="date"
                  value={medidaForm.dataInicio}
                  onChange={(e) => setMedidaForm({ ...medidaForm, dataInicio: e.target.value })}
                  data-testid="input-medida-data"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medida-prazo">Prazo/Duração</Label>
                <Input
                  id="medida-prazo"
                  placeholder="Ex: 6 meses, 1 ano"
                  value={medidaForm.prazo}
                  onChange={(e) => setMedidaForm({ ...medidaForm, prazo: e.target.value })}
                  data-testid="input-medida-prazo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medida-status">Status</Label>
                <Select 
                  value={medidaForm.status} 
                  onValueChange={(value: any) => setMedidaForm({ ...medidaForm, status: value })}
                >
                  <SelectTrigger id="medida-status" data-testid="select-medida-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medida-responsavel">Profissional/Órgão Responsável</Label>
              <Input
                id="medida-responsavel"
                placeholder="Ex: Assistente Social Maria Silva - CREAS"
                value={medidaForm.responsavel}
                onChange={(e) => setMedidaForm({ ...medidaForm, responsavel: e.target.value })}
                data-testid="input-medida-responsavel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medida-observacoes">Observações</Label>
              <Textarea
                id="medida-observacoes"
                placeholder="Informações adicionais, acompanhamento, etc..."
                rows={3}
                value={medidaForm.observacoes}
                onChange={(e) => setMedidaForm({ ...medidaForm, observacoes: e.target.value })}
                data-testid="textarea-medida-observacoes"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setShowMedidaModal(false);
                setMedidaForm({
                  codigo: '',
                  tipo: '',
                  beneficiario: '',
                  descricao: '',
                  dataInicio: new Date().toISOString().split('T')[0],
                  prazo: '',
                  status: 'ativa',
                  responsavel: '',
                  observacoes: ''
                });
              }}
              data-testid="button-cancel-medida"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "Em desenvolvimento",
                  description: "Funcionalidade de registrar medida protetiva em desenvolvimento.",
                });
                setShowMedidaModal(false);
              }}
              className="bg-orange-500 hover:bg-orange-600"
              data-testid="button-save-medida"
            >
              Registrar Medida
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal - Novo Serviço na Rede */}
      <Dialog open={showServicoModal} onOpenChange={setShowServicoModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Serviço na Rede</DialogTitle>
            <DialogDescription>
              Adicione um novo serviço ou instituição parceira à rede de atendimento.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="servico-nome">Nome do Serviço/Instituição *</Label>
              <Input
                id="servico-nome"
                placeholder="Ex: CRAS Centro, CAPS Centro de Atenção Psicossocial"
                value={servicoForm.nome}
                onChange={(e) => setServicoForm({ ...servicoForm, nome: e.target.value })}
                data-testid="input-servico-nome"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="servico-tipo">Tipo de Serviço *</Label>
                <Select 
                  value={servicoForm.tipo} 
                  onValueChange={(value) => setServicoForm({ ...servicoForm, tipo: value })}
                >
                  <SelectTrigger id="servico-tipo" data-testid="select-servico-tipo">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRAS">CRAS - Centro de Referência de Assistência Social</SelectItem>
                    <SelectItem value="CREAS">CREAS - Centro de Referência Especializado</SelectItem>
                    <SelectItem value="CAPS">CAPS - Centro de Atenção Psicossocial</SelectItem>
                    <SelectItem value="Conselho Tutelar">Conselho Tutelar</SelectItem>
                    <SelectItem value="Saúde Mental">Saúde Mental</SelectItem>
                    <SelectItem value="Educação">Educação</SelectItem>
                    <SelectItem value="Proteção Infantil">Proteção Infantil</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="servico-categoria">Categoria</Label>
                <Select 
                  value={servicoForm.categoria} 
                  onValueChange={(value) => setServicoForm({ ...servicoForm, categoria: value })}
                >
                  <SelectTrigger id="servico-categoria" data-testid="select-servico-categoria">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Saúde Mental">Saúde Mental</SelectItem>
                    <SelectItem value="Assistência Social">Assistência Social</SelectItem>
                    <SelectItem value="Proteção Infantil">Proteção Infantil</SelectItem>
                    <SelectItem value="Conselho Tutelar">Conselho Tutelar</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servico-endereco">Endereço</Label>
              <Input
                id="servico-endereco"
                placeholder="Rua, número, bairro, cidade"
                value={servicoForm.endereco}
                onChange={(e) => setServicoForm({ ...servicoForm, endereco: e.target.value })}
                data-testid="input-servico-endereco"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="servico-telefone">Telefone</Label>
                <Input
                  id="servico-telefone"
                  placeholder="(31) 3333-3333"
                  value={servicoForm.telefone}
                  onChange={(e) => setServicoForm({ ...servicoForm, telefone: e.target.value })}
                  data-testid="input-servico-telefone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="servico-email">Email</Label>
                <Input
                  id="servico-email"
                  type="email"
                  placeholder="contato@servico.gov.br"
                  value={servicoForm.email}
                  onChange={(e) => setServicoForm({ ...servicoForm, email: e.target.value })}
                  data-testid="input-servico-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servico-horario">Horário de Funcionamento</Label>
              <Input
                id="servico-horario"
                placeholder="Ex: Segunda a Sexta, 8h às 17h"
                value={servicoForm.horarioFuncionamento}
                onChange={(e) => setServicoForm({ ...servicoForm, horarioFuncionamento: e.target.value })}
                data-testid="input-servico-horario"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="servico-responsavel">Responsável/Contato Principal</Label>
              <Input
                id="servico-responsavel"
                placeholder="Nome do responsável ou contato"
                value={servicoForm.responsavel}
                onChange={(e) => setServicoForm({ ...servicoForm, responsavel: e.target.value })}
                data-testid="input-servico-responsavel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="servico-descricao">Descrição dos Serviços Oferecidos</Label>
              <Textarea
                id="servico-descricao"
                placeholder="Descreva os principais serviços oferecidos..."
                rows={3}
                value={servicoForm.descricao}
                onChange={(e) => setServicoForm({ ...servicoForm, descricao: e.target.value })}
                data-testid="textarea-servico-descricao"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="servico-observacoes">Observações</Label>
              <Textarea
                id="servico-observacoes"
                placeholder="Informações adicionais, documentos necessários, etc..."
                rows={2}
                value={servicoForm.observacoes}
                onChange={(e) => setServicoForm({ ...servicoForm, observacoes: e.target.value })}
                data-testid="textarea-servico-observacoes"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setShowServicoModal(false);
                setServicoForm({
                  nome: '',
                  tipo: '',
                  categoria: '',
                  endereco: '',
                  telefone: '',
                  email: '',
                  horarioFuncionamento: '',
                  responsavel: '',
                  descricao: '',
                  observacoes: ''
                });
              }}
              data-testid="button-cancel-servico"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "Em desenvolvimento",
                  description: "Funcionalidade de cadastrar serviço em desenvolvimento.",
                });
                setShowServicoModal(false);
              }}
              className="bg-blue-500 hover:bg-blue-600"
              data-testid="button-save-servico"
            >
              Cadastrar Serviço
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal - Novo Encaminhamento */}
      <Dialog open={showEncaminhamentoModal} onOpenChange={setShowEncaminhamentoModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Encaminhamento</DialogTitle>
            <DialogDescription>
              Registre um encaminhamento para serviço da rede de atendimento.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="encaminhamento-pessoa">Família/Pessoa Encaminhada *</Label>
              <Input
                id="encaminhamento-pessoa"
                placeholder="Nome da família ou pessoa"
                value={encaminhamentoForm.familiaPessoa}
                onChange={(e) => setEncaminhamentoForm({ ...encaminhamentoForm, familiaPessoa: e.target.value })}
                data-testid="input-encaminhamento-pessoa"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="encaminhamento-servico">Serviço de Destino *</Label>
                <Select 
                  value={encaminhamentoForm.servicoDestino} 
                  onValueChange={(value) => setEncaminhamentoForm({ ...encaminhamentoForm, servicoDestino: value })}
                >
                  <SelectTrigger id="encaminhamento-servico" data-testid="select-encaminhamento-servico">
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAPS">CAPS - Atendimento Psicológico</SelectItem>
                    <SelectItem value="CREAS">CREAS - Acompanhamento Social</SelectItem>
                    <SelectItem value="CRAS">CRAS - Centro de Referência</SelectItem>
                    <SelectItem value="Conselho Tutelar">Conselho Tutelar</SelectItem>
                    <SelectItem value="Saúde">Unidade de Saúde</SelectItem>
                    <SelectItem value="Educação">Educação</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="encaminhamento-tipo">Tipo de Encaminhamento</Label>
                <Select 
                  value={encaminhamentoForm.tipo} 
                  onValueChange={(value) => setEncaminhamentoForm({ ...encaminhamentoForm, tipo: value })}
                >
                  <SelectTrigger id="encaminhamento-tipo" data-testid="select-encaminhamento-tipo">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Atendimento Psicológico">Atendimento Psicológico</SelectItem>
                    <SelectItem value="Acompanhamento Social">Acompanhamento Social</SelectItem>
                    <SelectItem value="Atendimento Médico">Atendimento Médico</SelectItem>
                    <SelectItem value="Proteção">Proteção</SelectItem>
                    <SelectItem value="Caso Individual">Caso Individual</SelectItem>
                    <SelectItem value="Caso Familiar">Caso Familiar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="encaminhamento-motivo">Motivo do Encaminhamento *</Label>
              <Textarea
                id="encaminhamento-motivo"
                placeholder="Descreva o motivo e necessidade do encaminhamento..."
                rows={3}
                value={encaminhamentoForm.motivo}
                onChange={(e) => setEncaminhamentoForm({ ...encaminhamentoForm, motivo: e.target.value })}
                data-testid="textarea-encaminhamento-motivo"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="encaminhamento-data">Data do Encaminhamento *</Label>
                <Input
                  id="encaminhamento-data"
                  type="date"
                  value={encaminhamentoForm.dataEncaminhamento}
                  onChange={(e) => setEncaminhamentoForm({ ...encaminhamentoForm, dataEncaminhamento: e.target.value })}
                  data-testid="input-encaminhamento-data"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="encaminhamento-prioridade">Prioridade</Label>
                <Select 
                  value={encaminhamentoForm.prioridade} 
                  onValueChange={(value: any) => setEncaminhamentoForm({ ...encaminhamentoForm, prioridade: value })}
                >
                  <SelectTrigger id="encaminhamento-prioridade" data-testid="select-encaminhamento-prioridade">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="encaminhamento-status">Status</Label>
                <Select 
                  value={encaminhamentoForm.status} 
                  onValueChange={(value: any) => setEncaminhamentoForm({ ...encaminhamentoForm, status: value })}
                >
                  <SelectTrigger id="encaminhamento-status" data-testid="select-encaminhamento-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="encaminhamento-responsavel">Profissional Responsável</Label>
              <Input
                id="encaminhamento-responsavel"
                placeholder="Nome do profissional que realizou o encaminhamento"
                value={encaminhamentoForm.profissionalResponsavel}
                onChange={(e) => setEncaminhamentoForm({ ...encaminhamentoForm, profissionalResponsavel: e.target.value })}
                data-testid="input-encaminhamento-responsavel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="encaminhamento-observacoes">Observações</Label>
              <Textarea
                id="encaminhamento-observacoes"
                placeholder="Informações complementares, documentos necessários, etc..."
                rows={2}
                value={encaminhamentoForm.observacoes}
                onChange={(e) => setEncaminhamentoForm({ ...encaminhamentoForm, observacoes: e.target.value })}
                data-testid="textarea-encaminhamento-observacoes"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setShowEncaminhamentoModal(false);
                setEncaminhamentoForm({
                  familiaPessoa: '',
                  servicoDestino: '',
                  tipo: '',
                  dataEncaminhamento: new Date().toISOString().split('T')[0],
                  motivo: '',
                  status: 'pendente',
                  prioridade: 'media',
                  profissionalResponsavel: '',
                  observacoes: ''
                });
              }}
              data-testid="button-cancel-encaminhamento"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "Em desenvolvimento",
                  description: "Funcionalidade de registrar encaminhamento em desenvolvimento.",
                });
                setShowEncaminhamentoModal(false);
              }}
              className="bg-green-500 hover:bg-green-600"
              data-testid="button-save-encaminhamento"
            >
              Registrar Encaminhamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação - Excluir Família */}
      <AlertDialog open={showDeleteFamiliaDialog} onOpenChange={setShowDeleteFamiliaDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a família {selectedFamilia?.nomeResponsavel}? Esta ação não pode ser desfeita.
              {selectedFamilia && " A família não pode ter casos ativos."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => selectedFamilia && deleteFamiliaMutation.mutate(selectedFamilia.id)}
              disabled={deleteFamiliaMutation.isPending}
            >
              {deleteFamiliaMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação - Remover Atendido Comunidade */}
      <AlertDialog open={confirmDeleteAtendido.open} onOpenChange={(open) => setConfirmDeleteAtendido(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover atendido</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{confirmDeleteAtendido.nome}</strong> dos atendidos? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => { if (confirmDeleteAtendido.id) deleteAtendidoComunidadeMutation.mutate(confirmDeleteAtendido.id); setConfirmDeleteAtendido({ open: false, id: null, nome: '' }); }}
              disabled={deleteAtendidoComunidadeMutation.isPending}
            >
              {deleteAtendidoComunidadeMutation.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação - Excluir Registro Confidencial */}
      <AlertDialog open={confirmDeleteRegistro.open} onOpenChange={(open) => setConfirmDeleteRegistro(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro confidencial? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => { if (confirmDeleteRegistro.id) deleteRegistroConfMutation.mutate(confirmDeleteRegistro.id); setConfirmDeleteRegistro({ open: false, id: null }); }}
              disabled={deleteRegistroConfMutation.isPending}
            >
              {deleteRegistroConfMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação - Excluir Caso */}
      <AlertDialog open={showDeleteCasoDialog} onOpenChange={setShowDeleteCasoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o caso {selectedCaso?.titulo}? O caso será marcado como fechado/arquivado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => selectedCaso && deleteCasoMutation.mutate(selectedCaso.id)}
              disabled={deleteCasoMutation.isPending}
            >
              {deleteCasoMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlterarSenha 
        open={showAlterarSenhaModal} 
        onOpenChange={setShowAlterarSenhaModal}
      />

      <Dialog open={showCadastroAtendido} onOpenChange={setShowCadastroAtendido}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cadastrar Atendido da Comunidade</DialogTitle>
            <DialogDescription>Preencha os dados do atendido. Após cadastrar, ele ficará disponível para registro de atendimentos.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={cadastroAtendidoForm.nome} onChange={(e) => setCadastroAtendidoForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" />
            </div>
            <div>
              <Label>CPF</Label>
              <Input value={cadastroAtendidoForm.cpf} onChange={(e) => setCadastroAtendidoForm(f => ({ ...f, cpf: e.target.value }))} placeholder="000.000.000-00" />
            </div>
            <div>
              <Label>Data de Nascimento</Label>
              <Input type="date" value={cadastroAtendidoForm.data_nascimento} onChange={(e) => setCadastroAtendidoForm(f => ({ ...f, data_nascimento: e.target.value }))} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={cadastroAtendidoForm.telefone} onChange={(e) => setCadastroAtendidoForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <Label>Endereço</Label>
              <Input value={cadastroAtendidoForm.endereco} onChange={(e) => setCadastroAtendidoForm(f => ({ ...f, endereco: e.target.value }))} placeholder="Endereço completo" />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={cadastroAtendidoForm.observacoes} onChange={(e) => setCadastroAtendidoForm(f => ({ ...f, observacoes: e.target.value }))} placeholder="Observações adicionais..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCadastroAtendido(false)}>Cancelar</Button>
            <Button onClick={() => { if (!cadastroAtendidoForm.nome.trim()) { toast({ title: "Nome é obrigatório", variant: "destructive" }); return; } cadastroAtendidoMutation.mutate(cadastroAtendidoForm); }} disabled={cadastroAtendidoMutation.isPending}>
              {cadastroAtendidoMutation.isPending ? "Salvando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}