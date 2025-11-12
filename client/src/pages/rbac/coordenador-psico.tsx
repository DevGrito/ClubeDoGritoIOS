import React, { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import PsicoMonthlyReport from "@/components/psico/PsicoMonthlyReport";
import PsicoDashboard from "@/components/psico/PsicoDashboard";
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
  RefreshCw
} from "lucide-react";

export default function CoordenadorPsicoPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSection, setActiveSection] = useState('dashboard');
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
  const [selectedParticipante, setSelectedParticipante] = useState<any>(null);
  const [selectedFamilia, setSelectedFamilia] = useState<any>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [buscaAtendido, setBuscaAtendido] = useState('');
  const [buscaAtendidoFamilia, setBuscaAtendidoFamilia] = useState('');

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
    descricao: ''
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
  
  // Coordenador sempre exibe "Coordenador" (não pega do localStorage)
  // Pegar ID do coordenador do sessionStorage (login de coordenador)
  const coordenadorData = sessionStorage.getItem("coordenador_data");
  const coordenadorId = coordenadorData ? JSON.parse(coordenadorData).id : null;
  const userId = coordenadorId ? coordenadorId.toString() : null;
  const userName = "Coordenador";
  const userPapel = localStorage.getItem("userPapel");

  // Query para buscar dados do dashboard do coordenador
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/coordenador/dashboard', userId, 'psico'],
    queryFn: async () => {
      const response = await fetch(`/api/coordenador/dashboard/${userId}?area=psico`, {
        headers: { 'x-user-id': userId || '' }
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      return response.json();
    },
    enabled: !!userId
  });

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
            familiaId: familia.familia.id,
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
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateFamiliaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: typeof familiaForm }) => {
      return await apiRequest(`/api/psico/familias/${id}`, {
        method: 'PATCH',
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
        description: error.message,
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
        description: error.message,
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
        description: error.message,
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
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Query para buscar participantes vinculados
  const { data: participantesData, isLoading: isLoadingParticipantes } = useQuery({
    queryKey: ['/api/psico/participantes'],
    queryFn: async () => {
      const response = await fetch('/api/psico/participantes', {
        headers: { 'x-user-id': userId || '' }
      });
      if (!response.ok) throw new Error('Failed to fetch participantes');
      const data = await response.json();
      return data.participantes || [];
    },
    enabled: !!userId
  });

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
      return await apiRequest('/api/psico/sync-participantes', {
        method: 'POST',
        headers: {
          'x-user-id': userId || ''
        }
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Sincronização concluída!",
        description: `${data.vinculosCriados.total} vínculos criados (${data.vinculosCriados.inclusao} Inclusão + ${data.vinculosCriados.pec} PEC)`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/psico/participantes'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na sincronização",
        description: error.message,
        variant: "destructive"
      });
    }
  });

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
    select: (data: any) => data?.familias || []
  });

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
    select: (data: any) => data?.casos || []
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
      console.log('🔍 [ATENDIMENTOS DEBUG] Array de atendimentos:', result?.atendimentos);
      console.log('🔍 [ATENDIMENTOS DEBUG] Quantidade:', result?.atendimentos?.length);
      return result;
    },
    enabled: !!userId,
    select: (data: any) => {
      const atends = data?.atendimentos || [];
      console.log('🔍 [ATENDIMENTOS DEBUG] Após select:', atends);
      console.log('🔍 [ATENDIMENTOS DEBUG] Após select - quantidade:', atends.length);
      return atends;
    }
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
    select: (data: any) => data?.planos || []
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
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso."
    });
    setTimeout(() => window.location.href = "/login/coordenador", 500);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando coordenação psicossocial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="coordenador-psico-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900" data-testid="text-welcome">
                Coordenação Psicossocial
              </h1>
              <p className="text-gray-600" data-testid="text-username">Olá Coordenador</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" data-testid="badge-role">
              💜 Coordenador Psicossocial
            </Badge>
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
        {/* Tabs Principais */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">
              <Heart className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="participantes" data-testid="tab-participantes">
              <Users className="w-4 h-4 mr-2" />
              Participantes
            </TabsTrigger>
            <TabsTrigger value="casos" data-testid="tab-casos">
              <FileText className="w-4 h-4 mr-2" />
              Casos
            </TabsTrigger>
          </TabsList>

          {/* Aba Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <PsicoDashboard
              familias={familias}
              casos={casos}
              atendimentos={atendimentos}
              participantes={participantesData || []}
              encaminhamentos={[]}
              onViewDetails={(caso: any) => {
                setActiveTab('casos');
                setActiveSection('casos');
              }}
              onExportCSV={handleExportCSV}
            />
          </TabsContent>

          {/* Aba Participantes */}
          <TabsContent value="participantes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Participantes (Inclusão Produtiva e PEC)</span>
                  <Badge variant="outline" className="text-lg">
                    {participantesData?.length || 0} participantes
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  Lista de participantes da Inclusão Produtiva e PEC (Esporte e Cultura) vinculados automaticamente como atendidos do Psicossocial.
                </p>
                
                {participantesData && participantesData.length === 0 && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-yellow-900">Nenhum participante encontrado</h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          Os alunos já cadastrados no sistema ainda não foram vinculados. Clique no botão abaixo para sincronizar automaticamente.
                        </p>
                        <Button 
                          className="mt-3" 
                          onClick={() => syncParticipantesMutation.mutate()}
                          disabled={syncParticipantesMutation.isPending}
                          data-testid="button-sync-participantes"
                        >
                          {syncParticipantesMutation.isPending ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Sincronizando...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Sincronizar Alunos Existentes
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mb-4 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Buscar participante por nome..." 
                      className="pl-10" 
                      data-testid="input-search-participante"
                    />
                  </div>
                  {participantesData && participantesData.length > 0 && (
                    <Button 
                      variant="outline"
                      onClick={() => syncParticipantesMutation.mutate()}
                      disabled={syncParticipantesMutation.isPending}
                      data-testid="button-sync-participantes-header"
                    >
                      {syncParticipantesMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Sincronizando
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Sincronizar
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {isLoadingParticipantes ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Carregando participantes...</p>
                  </div>
                ) : participantesData && participantesData.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Programa</TableHead>
                          <TableHead>Gênero</TableHead>
                          <TableHead>Idade</TableHead>
                          <TableHead>Família Vinculada</TableHead>
                          <TableHead>Papel</TableHead>
                          <TableHead>Contato</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {participantesData.map((participante: any) => (
                          <TableRow key={participante.id} data-testid={`row-participante-${participante.id}`}>
                            <TableCell className="font-medium">{participante.nome}</TableCell>
                            <TableCell>
                              <Badge 
                                className={participante.programa_origem === 'pec' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'}
                              >
                                {participante.programa_origem === 'pec' ? '🏃 PEC' : '🎓 Inclusão'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {participante.genero || '-'}
                              </Badge>
                            </TableCell>
                            <TableCell>{participante.idade ? `${participante.idade} anos` : '-'}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{participante.familia_nome}</span>
                                <span className="text-xs text-gray-500">ID: {participante.familia_id}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {participante.papel ? (
                                <Badge className="bg-indigo-100 text-indigo-800">
                                  {participante.papel}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col text-sm">
                                {participante.telefone && (
                                  <span>{participante.telefone}</span>
                                )}
                                {participante.email && (
                                  <span className="text-xs text-gray-500">{participante.email}</span>
                                )}
                                {!participante.telefone && !participante.email && (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedParticipante(participante);
                                    setShowHistoricoModal(true);
                                  }}
                                  data-testid={`button-historico-participante-${participante.id}`}
                                  title="Ver histórico de atendimentos"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-lg bg-gray-50">
                    <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">Nenhum participante vinculado</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Participantes cadastrados na Inclusão Produtiva ou PEC aparecerão aqui automaticamente
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Casos - Conteúdo Atual */}
          <TabsContent value="casos" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Indicadores da Área */}
              <Card data-testid="card-indicadores">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="w-5 h-5 text-purple-500" />
                    Indicadores da Área
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Famílias Atendidas:</span>
                    <span className="font-semibold" data-testid="text-familias-atendidas">
                      {dashboardData?.familiasAtendidas || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Casos em Acompanhamento:</span>
                    <span className="font-semibold" data-testid="text-casos-acompanhamento">
                      {dashboardData?.casosAcompanhamento || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Taxa de Resolutividade:</span>
                    <span className="font-semibold text-purple-600" data-testid="text-taxa-resolutividade">
                      {dashboardData?.taxaResolutividade || 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>

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
                  onClick={() => setActiveSection('familias')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Famílias
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'casos' ? 'default' : 'outline'}
                  data-testid="button-casos"
                  onClick={() => setActiveSection('casos')}
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Casos Ativos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Participantes/Alunos */}
          <Card data-testid="card-participantes">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserCheck className="w-5 h-5 text-indigo-500" />
                Atendidos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Visualize os atendidos dos programas Inclusão Produtiva e PEC.
              </p>
              <Button 
                className="w-full" 
                variant={activeSection === 'participantes' ? 'default' : 'outline'}
                data-testid="button-participantes"
                onClick={() => setActiveSection('participantes')}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Ver Atendidos
              </Button>
            </CardContent>
          </Card>

          {/* Serviços Psicossociais */}
          <Card data-testid="card-servicos">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <HeartHandshake className="w-5 h-5 text-green-500" />
                Serviços Psicossociais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Coordene atendimentos individuais, grupos terapêuticos e oficinas.
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  variant={activeSection === 'atendimentos' ? 'default' : 'outline'}
                  data-testid="button-atendimentos"
                  onClick={() => setActiveSection('atendimentos')}
                >
                  <HeartHandshake className="w-4 h-4 mr-2" />
                  Atendimentos
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'grupos' ? 'default' : 'outline'}
                  data-testid="button-grupos"
                  onClick={() => setActiveSection('grupos')}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Grupos Terapêuticos
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
                  onClick={() => setActiveSection('violacoes')}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Violações de Direitos
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'medidas' ? 'default' : 'outline'}
                  data-testid="button-medidas"
                  onClick={() => setActiveSection('medidas')}
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
                  onClick={() => setActiveSection('rede')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Rede de Serviços
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'encaminhamentos' ? 'default' : 'outline'}
                  data-testid="button-encaminhamentos"
                  onClick={() => setActiveSection('encaminhamentos')}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Encaminhamentos
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
                  onClick={() => setActiveSection('relatorios')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Relatórios
                </Button>
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
            Coordenação Psicossocial • Sistema RBAC Isolado
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
                <p className="text-gray-600">Visualização geral dos indicadores e métricas de Coordenação Psicossocial.</p>
              </CardContent>
            </Card>
          )}

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
                                            observacoes: familia.observacoes || ''
                                          });
                                          setShowEditFamiliaModal(true);
                                        }}
                                      >
                                        <Edit className="h-4 w-4" />
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
                                        <Button variant="ghost" size="sm" data-testid="button-view-case">
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" data-testid="button-edit-case">
                                          <Edit className="h-4 w-4" />
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
                    <span>Atendidos (Inclusão Produtiva e PEC)</span>
                    <Badge variant="outline" className="text-lg">
                      {participantesData?.length || 0} atendidos
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">
                    Lista de participantes da Inclusão Produtiva e PEC (Esporte e Cultura) vinculados automaticamente como atendidos do Psicossocial.
                  </p>
                  
                  {participantesData && participantesData.length === 0 && (
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-yellow-900">Nenhum atendido encontrado</h3>
                          <p className="text-sm text-yellow-700 mt-1">
                            Os alunos já cadastrados no sistema ainda não foram vinculados. Clique no botão abaixo para sincronizar automaticamente.
                          </p>
                          <Button 
                            className="mt-3" 
                            onClick={() => syncParticipantesMutation.mutate()}
                            disabled={syncParticipantesMutation.isPending}
                            data-testid="button-sync-participantes"
                          >
                            {syncParticipantesMutation.isPending ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Sincronizando...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Sincronizar Alunos Existentes
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-4 flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="Buscar participante por nome..." 
                        className="pl-10" 
                        data-testid="input-search-participante"
                      />
                    </div>
                    {participantesData && participantesData.length > 0 && (
                      <Button 
                        variant="outline"
                        onClick={() => syncParticipantesMutation.mutate()}
                        disabled={syncParticipantesMutation.isPending}
                        data-testid="button-sync-participantes"
                      >
                        {syncParticipantesMutation.isPending ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Sincronizando
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Sincronizar
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {isLoadingParticipantes ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Carregando participantes...</p>
                    </div>
                  ) : participantesData && participantesData.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Programa</TableHead>
                            <TableHead>Gênero</TableHead>
                            <TableHead>Idade</TableHead>
                            <TableHead>Família Vinculada</TableHead>
                            <TableHead>Papel</TableHead>
                            <TableHead>Contato</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {participantesData.map((participante: any) => (
                            <TableRow key={participante.id} data-testid={`row-participante-${participante.id}`}>
                              <TableCell className="font-medium">{participante.nome}</TableCell>
                              <TableCell>
                                <Badge 
                                  className={participante.programa_origem === 'pec' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-green-100 text-green-800'}
                                >
                                  {participante.programa_origem === 'pec' ? '🏃 PEC' : '🎓 Inclusão'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {participante.genero || '-'}
                                </Badge>
                              </TableCell>
                              <TableCell>{participante.idade ? `${participante.idade} anos` : '-'}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{participante.familia_nome}</span>
                                  <span className="text-xs text-gray-500">ID: {participante.familia_id}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {participante.papel ? (
                                  <Badge className="bg-indigo-100 text-indigo-800">
                                    {participante.papel}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col text-sm">
                                  {participante.telefone && (
                                    <span>{participante.telefone}</span>
                                  )}
                                  {participante.email && (
                                    <span className="text-xs text-gray-500">{participante.email}</span>
                                  )}
                                  {!participante.telefone && !participante.email && (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedParticipante(participante);
                                      setShowHistoricoModal(true);
                                    }}
                                    data-testid={`button-historico-participante-${participante.id}`}
                                    title="Ver histórico de atendimentos"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12 border rounded-lg bg-gray-50">
                      <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium">Nenhum participante vinculado</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Participantes cadastrados na Inclusão Produtiva ou PEC aparecerão aqui automaticamente
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

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
                        <Input id="nome" defaultValue="Coordenador Psicossocial" />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" defaultValue="coordenador.psico@institutoogrito.org" />
                      </div>
                      <div>
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input id="telefone" defaultValue="(31) 98765-4321" />
                      </div>
                      <div>
                        <Label htmlFor="registro">Registro Profissional</Label>
                        <Input id="registro" defaultValue="CRP 04/12345" />
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
                          <p className="text-sm text-gray-500">Receber emails sobre casos críticos e atualizações</p>
                        </div>
                        <Checkbox defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Alertas de Casos Urgentes</p>
                          <p className="text-sm text-gray-500">Notificações imediatas para situações de risco</p>
                        </div>
                        <Checkbox defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Relatórios Automáticos</p>
                          <p className="text-sm text-gray-500">Envio automático de relatórios mensais</p>
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
                        Solicitar Transferência de Área
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
          </TabsContent>
        </Tabs>
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cadastrar Nova Família</DialogTitle>
            <DialogDescription>
              Preencha os dados da família para cadastro no programa psicossocial.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
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

          <DialogFooter className="sm:justify-between">
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
              <Input
                placeholder="🔍 Buscar atendido por nome..."
                value={buscaAtendido}
                onChange={(e) => setBuscaAtendido(e.target.value)}
                className="mb-2"
                data-testid="input-busca-atendido"
              />
              <Select 
                value={atendimentoForm.vinculoId?.toString() || ''} 
                onValueChange={(value) => {
                  const participante = participantesData?.find((p: any) => p.vinculo_id?.toString() === value);
                  setAtendimentoForm({ 
                    ...atendimentoForm, 
                    vinculoId: value ? parseInt(value) : null,
                    programaOrigem: participante?.programa_origem || null,
                    familiaId: participante?.familia_id || null
                  });
                  setBuscaAtendido('');
                }}
              >
                <SelectTrigger id="atend-atendido" data-testid="select-atendimento-atendido">
                  <SelectValue placeholder="Selecione o atendido" />
                </SelectTrigger>
                <SelectContent>
                  {participantesData
                    ?.filter((p: any) => 
                      !buscaAtendido || 
                      p.nome.toLowerCase().includes(buscaAtendido.toLowerCase())
                    )
                    .map((participante: any) => (
                      <SelectItem key={participante.vinculo_id} value={participante.vinculo_id.toString()}>
                        {participante.nome} ({participante.programa_origem === 'inclusao' ? 'Inclusão' : 'PEC'})
                      </SelectItem>
                    ))}
                  {participantesData?.filter((p: any) => 
                    !buscaAtendido || 
                    p.nome.toLowerCase().includes(buscaAtendido.toLowerCase())
                  ).length === 0 && (
                    <div className="p-2 text-center text-sm text-gray-500">
                      Nenhum atendido encontrado
                    </div>
                  )}
                </SelectContent>
              </Select>
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
                  <p className="font-medium">{selectedParticipante.nome}</p>
                  <Badge className={selectedParticipante.programa_origem === 'pec' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                    {selectedParticipante.programa_origem === 'pec' ? '🏃 PEC' : '🎓 Inclusão'}
                  </Badge>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isLoadingHistorico ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-500 mt-4">Carregando histórico...</p>
              </div>
            ) : historicoData && historicoData.atendimentos && historicoData.atendimentos.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Total de atendimentos: <strong>{historicoData.atendimentos.length}</strong>
                </p>
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
                    {atendimento.profissionalResponsavel && (
                      <p className="text-sm"><strong>Profissional:</strong> {atendimento.profissionalResponsavel}</p>
                    )}
                    {atendimento.resumo && (
                      <p className="text-sm"><strong>Resumo:</strong> {atendimento.resumo}</p>
                    )}
                    {atendimento.observacoes && (
                      <p className="text-sm text-gray-600">{atendimento.observacoes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum atendimento registrado ainda.</p>
              </div>
            )}
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
    </div>
  );
}