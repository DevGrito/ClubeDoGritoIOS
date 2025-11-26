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
  ExternalLink
} from "lucide-react";

export default function MonitorPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedAluno, setSelectedAluno] = useState<any>(null);
  const [showEditAlunoModal, setShowEditAlunoModal] = useState(false);
  const [showViewAlunoModal, setShowViewAlunoModal] = useState(false);
  const [showAddAlunoModal, setShowAddAlunoModal] = useState(false);
  const [showAlterarSenhaModal, setShowAlterarSenhaModal] = useState(false);
  
  // Form state for edit modal
  const [editFormData, setEditFormData] = useState({
    observacoesPrivadas: '',
    acompanhamentoStatus: 'ativo'
  });
  
  // State for nova atividade modal and form
  const [showNovaAtividadeModal, setShowNovaAtividadeModal] = useState(false);
  const [novaAtividadeForm, setNovaAtividadeForm] = useState({
    titulo: '',
    descricao: '',
    tipo: 'reforco',
    grupo: '',
    data: '',
    horarioInicio: '',
    horarioFim: '',
    local: '',
    participantesEsperados: 0,
    observacoes: '',
    materiaisNecessarios: []
  });
  // State for novo grupo modal and form
  const [showNovoGrupoModal, setShowNovoGrupoModal] = useState(false);
  const [novoGrupoForm, setNovoGrupoForm] = useState({
    nome: '',
    nivel: '',
    alunos: 0,
    frequencia: '',
    atividade: ''
  });
  
  // State for registro form
  const [registroForm, setRegistroForm] = useState({
    dataAtividade: new Date().toISOString().split('T')[0],
    grupo: '',
    titulo: '',
    descricao: '',
    duracaoMinutos: '',
    participantes: '',
    resultadosObservacoes: ''
  });
  
  // State for presenca (attendance control)
  const [presencaData, setPresencaData] = useState(new Date().toISOString().split('T')[0]);
  const [presencaGrupo, setPresencaGrupo] = useState('');
  const [presencas, setPresencas] = useState<Array<{ alunoCpf: string, nome: string, presente: boolean }>>([]);
  
  // Obter dados do usuário do localStorage
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName") || "Monitor";
  const userPapel = localStorage.getItem("userPapel");

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
    enabled: !!userId
  });

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
    enabled: !!userId && activeSection === 'alunos'
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
    enabled: !!userId && showAddAlunoModal
  });

  // Query for atividades
  const { data: atividadesData, isLoading: atividadesLoading } = useQuery({
    queryKey: ['/api/monitor/atividades', userId],
    queryFn: async () => {
      const response = await fetch(`/api/monitor/${userId}/atividades`, {
        headers: { 'x-user-id': userId || '' }
      });
      if (!response.ok) throw new Error('Failed to fetch atividades');
      return response.json();
    },
    enabled: !!userId && activeSection === 'atividades'
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

  // Mutation for creating atividade
  const createAtividadeMutation = useMutation({
    mutationFn: async (formData: any) => {
      console.log("[DEBUG FRONTEND] Iniciando mutation de criar atividade");
      console.log("[DEBUG FRONTEND] formData recebido:", formData);
      console.log("[DEBUG FRONTEND] userId:", userId);
      
      // Convert date string to ISO timestamp
      const dataToSend = {
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
      queryClient.invalidateQueries({ queryKey: ['/api/monitor/atividades', userId] });
      toast({ title: "Atividade criada!", description: "Nova atividade adicionada com sucesso." });
      setShowNovaAtividadeModal(false);
      setNovaAtividadeForm({
        titulo: '',
        descricao: '',
        tipo: 'reforco',
        grupo: '',
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
  // Query for grupos
  const { data: gruposData, isLoading: gruposLoading } = useQuery({
    queryKey: ['/api/monitor/grupos', userId],
    queryFn: async () => {
      const response = await fetch(`/api/monitor/${userId}/grupos`, {
        headers: { 'x-user-id': userId || '' }
      });
      if (!response.ok) throw new Error('Failed to fetch grupos');
      return response.json();
    },
    enabled: !!userId && (activeSection === 'grupos' || activeSection === 'presenca')
  });

  // Mutation for creating grupo
  const createGrupoMutation = useMutation({
    mutationFn: async (formData: any) => {
      return apiRequest(`/api/monitor/${userId}/grupos`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/monitor/grupos', userId] });
      toast({ title: "Grupo criado!", description: "Novo grupo adicionado com sucesso." });
      setShowNovoGrupoModal(false);
      setNovoGrupoForm({
        nome: '',
        nivel: '',
        alunos: 0,
        frequencia: '',
        atividade: ''
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao criar grupo", 
        description: error.message || "Não foi possível criar o grupo.",
        variant: "destructive" 
      });
    }
  });

  // Query for registros
  const { data: registrosData, isLoading: registrosLoading } = useQuery({
    queryKey: ['/api/monitor/registros', userId],
    queryFn: async () => {
      const response = await fetch(`/api/monitor/${userId}/registros`, {
        headers: { 'x-user-id': userId || '' }
      });
      if (!response.ok) throw new Error('Failed to fetch registros');
      return response.json();
    },
    enabled: !!userId && activeSection === 'registro'
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
    enabled: !!userId && !!presencaGrupo && activeSection === 'presenca'
  });

  // Update presencas when students data changes
  useEffect(() => {
    if (grupoAlunosData && Array.isArray(grupoAlunosData)) {
      setPresencas(grupoAlunosData.map((aluno: any) => ({
        alunoCpf: aluno.cpf,
        nome: aluno.nome,
        presente: true
      })));
    }
  }, [grupoAlunosData]);

  // Mutation for creating registro
  const createRegistroMutation = useMutation({
    mutationFn: async (formData: any) => {
      return apiRequest(`/api/monitor/${userId}/registros`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/monitor/registros', userId] });
      toast({ title: "Registro criado!", description: "Atividade registrada com sucesso." });
      setRegistroForm({
        dataAtividade: new Date().toISOString().split('T')[0],
        grupo: '',
        titulo: '',
        descricao: '',
        duracaoMinutos: '',
        participantes: '',
        resultadosObservacoes: ''
      });
    },
    onError: (error: any) => {
      console.error("Error creating registro:", error);
      toast({ title: "Erro", description: "Não foi possível criar registro.", variant: "destructive" });
    }
  });

  // Mutation to save attendance (create chamada + presencas)
  const saveChamadaMutation = useMutation({
    mutationFn: async () => {
      if (!presencaGrupo || !presencaData) {
        throw new Error('Grupo e data são obrigatórios');
      }
      
      // First, create the chamada
      const chamadaResponse = await apiRequest(`/api/monitor/${userId}/chamada`, {
        method: 'POST',
        body: JSON.stringify({
          grupoId: parseInt(presencaGrupo),
          data: presencaData,
          observacoes: ''
        })
      });
      
      const chamada = await chamadaResponse.json();
      
      // Then, save the presencas
      await apiRequest(`/api/monitor/${userId}/chamada/${chamada.id}/presencas`, {
        method: 'POST',
        body: JSON.stringify({
          presencas: presencas.map(p => ({
            alunoCpf: p.alunoCpf,
            presente: p.presente
          }))
        })
      });
      
      return chamada;
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
    setTimeout(() => window.location.href = "/entrar", 500);
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

  return (
    <div className="min-h-screen bg-gray-50" data-testid="monitor-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900" data-testid="text-welcome">
                Área do Monitor
              </h1>
              <p className="text-gray-600" data-testid="text-username">Bem-vindo, {userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" data-testid="badge-role">
              👥 Monitor
            </Badge>
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleExportReport}
              data-testid="button-export"
              className="bg-blue-500 hover:bg-blue-600"
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
                <Target className="w-5 h-5 text-blue-500" />
                Resumo de Atividades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Alunos Supervisionados:</span>
                <span className="font-semibold" data-testid="text-total-alunos">
                  {dashboardData?.totalAlunos || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Grupos Ativos:</span>
                <span className="font-semibold" data-testid="text-grupos-ativos">
                  {dashboardData?.gruposAtivos || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Atividades Realizadas:</span>
                <span className="font-semibold" data-testid="text-atividades-realizadas">
                  {dashboardData?.atividadesRealizadas || 0}
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
                <Button 
                  className="w-full" 
                  variant={activeSection === 'atividades' ? 'default' : 'outline'}
                  data-testid="button-minhas-atividades"
                  onClick={() => setActiveSection('atividades')}
                >
                  <Activity className="w-4 h-4 mr-2" />
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

          {/* Grupos e Horários */}
          <Card data-testid="card-grupos">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-purple-500" />
                Grupos e Horários
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Gerencie seus grupos de trabalho e organize horários de atividades.
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  variant={activeSection === 'grupos' ? 'default' : 'outline'}
                  data-testid="button-meus-grupos"
                  onClick={() => setActiveSection('grupos')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Meus Grupos
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
                <CardTitle>Meus Alunos</CardTitle>
                <Button size="sm" className="bg-blue-500 hover:bg-blue-600" onClick={() => setShowAddAlunoModal(true)} data-testid="button-add-aluno">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Aluno
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
                      <label className="block text-sm font-medium mb-2">Grupo</label>
                      <Select value={presencaGrupo} onValueChange={setPresencaGrupo}>
                        <SelectTrigger data-testid="select-presenca-grupo">
                          <SelectValue placeholder="Selecione o grupo" />
                        </SelectTrigger>
                        <SelectContent>
                          {gruposData && Array.isArray(gruposData) && gruposData.length > 0 ? (
                            gruposData.map((grupo: any) => (
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
                          <div className="text-center py-8 text-gray-500">Nenhum aluno encontrado neste grupo</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {!presencaGrupo && (
                    <div className="text-center py-8 text-gray-500 border rounded-lg">
                      Selecione um grupo para visualizar a lista de alunos
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
                      atividadesData.map((atividade: any) => (
                        <div key={atividade.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">{atividade.titulo}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                <span>Grupo: {atividade.grupo || 'Não especificado'}</span>
                                <span>Horário: {atividade.horarioInicio} - {atividade.horarioFim}</span>
                                <span>Participantes: {atividade.participantesEsperados} alunos</span>
                              </div>
                            </div>
                            <Badge className={
                              atividade.status === 'planejada' ? 'bg-yellow-100 text-yellow-800' :
                              atividade.status === 'em_andamento' ? 'bg-blue-100 text-blue-800' :
                              atividade.status === 'concluida' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {atividade.status === 'planejada' ? 'Planejada' :
                               atividade.status === 'em_andamento' ? 'Em andamento' :
                               atividade.status === 'concluida' ? 'Concluída' : 'Cancelada'}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" data-testid={`button-chamada-${atividade.id}`}>
                              <UserCheck className="w-4 h-4 mr-1" />
                              Fazer Chamada
                            </Button>
                            <Button size="sm" variant="outline" data-testid={`button-editar-atividade-${atividade.id}`}>
                              <Edit className="w-4 h-4 mr-1" />
                              Editar
                            </Button>
                            <Button size="sm" variant="outline" data-testid={`button-detalhes-atividade-${atividade.id}`}>
                              <Eye className="w-4 h-4 mr-1" />
                              Detalhes
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
                    <h3 className="font-semibold mb-4">Registrar Nova Atividade</h3>
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
                        <label className="block text-sm font-medium mb-2">Grupo</label>
                        <Input 
                          placeholder="Ex: Grupo A" 
                          value={registroForm.grupo}
                          onChange={(e) => setRegistroForm({ ...registroForm, grupo: e.target.value })}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Título da Atividade</label>
                        <Input 
                          placeholder="Ex: Oficina de Matemática Lúdica" 
                          value={registroForm.titulo}
                          onChange={(e) => setRegistroForm({ ...registroForm, titulo: e.target.value })}
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
                    </div>
                    <Button 
                      className="mt-4 bg-blue-500 hover:bg-blue-600"
                      onClick={() => {
                        const payload = {
                          ...registroForm,
                          duracaoMinutos: registroForm.duracaoMinutos ? parseInt(registroForm.duracaoMinutos) : null,
                          participantes: registroForm.participantes ? parseInt(registroForm.participantes) : null
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
                      ) : registrosData && Array.isArray(registrosData) && registrosData.length > 0 ? (
                        registrosData.map((registro: any) => (
                          <div key={registro.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-green-500" />
                                <span className="font-medium">
                                  {new Date(registro.dataAtividade).toLocaleDateString('pt-BR')} - {registro.grupo}
                                </span>
                              </div>
                              <Badge className="bg-blue-100 text-blue-800">
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
                              <Button size="sm" variant="outline">
                                <Edit className="w-4 h-4 mr-1" />
                                Editar
                              </Button>
                              <Button size="sm" variant="outline">
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
                <CardTitle>Meus Grupos</CardTitle>
                <Button className="bg-purple-500 hover:bg-purple-600" onClick={() => setShowNovoGrupoModal(true)} data-testid="button-novo-grupo">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Grupo
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {[
                    {
                      nome: 'Grupo A - Reforço Escolar',
                      nivel: 'Ensino Fundamental',
                      alunos: 12,
                      frequencia: '89%',
                      atividade: 'Matemática/Português'
                    },
                    {
                      nome: 'Grupo B - Atividades Recreativas',
                      nivel: 'Misto',
                      alunos: 8,
                      frequencia: '94%',
                      atividade: 'Jogos Educativos'
                    }
                  ].map((grupo, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{grupo.nome}</h3>
                        <Badge className="bg-purple-100 text-purple-800">Ativo</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Nível:</span>
                          <p className="font-medium">{grupo.nivel}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Alunos:</span>
                          <p className="font-medium">{grupo.alunos}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Frequência:</span>
                          <p className="font-medium">{grupo.frequencia}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Atividade:</span>
                          <p className="font-medium">{grupo.atividade}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline" onClick={() => setActiveSection('alunos')}>
                          <Users className="w-4 h-4 mr-1" />
                          Ver Alunos
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setActiveSection('presenca')}>
                          <UserCheck className="w-4 h-4 mr-1" />
                          Fazer Chamada
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

          {activeSection === 'calendario' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Calendário</CardTitle>
                <Button className="bg-purple-500 hover:bg-purple-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Evento
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-7 gap-2 text-center">
                    <div className="font-semibold p-2">Dom</div>
                    <div className="font-semibold p-2">Seg</div>
                    <div className="font-semibold p-2">Ter</div>
                    <div className="font-semibold p-2">Qua</div>
                    <div className="font-semibold p-2">Qui</div>
                    <div className="font-semibold p-2">Sex</div>
                    <div className="font-semibold p-2">Sáb</div>
                    
                    {Array.from({ length: 35 }, (_, i) => {
                      const day = i - 6 + 1;
                      const isToday = day === 26;
                      const hasEvent = [15, 22, 29].includes(day);
                      
                      return (
                        <div key={i} className={`p-2 border rounded ${
                          isToday ? 'bg-blue-100 border-blue-300' :
                          hasEvent ? 'bg-green-50 border-green-200' :
                          day > 0 && day <= 30 ? 'hover:bg-gray-50' : 'text-gray-300'
                        }`}>
                          {day > 0 && day <= 30 && (
                            <div>
                              <span className="text-sm">{day}</span>
                              {hasEvent && (
                                <div className="w-1 h-1 bg-green-500 rounded-full mx-auto mt-1"></div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-4">Próximas Atividades</h3>
                    <div className="space-y-3">
                      {[
                        {
                          data: '29/09/2025',
                          titulo: 'Oficina de Matemática - Grupo A',
                          tipo: 'Reforço Escolar',
                          horario: '14:00',
                          local: 'Sala 2'
                        },
                        {
                          data: '30/09/2025',
                          titulo: 'Atividades Recreativas - Grupo B',
                          tipo: 'Recreação',
                          horario: '16:00',
                          local: 'Pátio'
                        },
                        {
                          data: '02/10/2025',
                          titulo: 'Reunião de Planejamento',
                          tipo: 'Reunião',
                          horario: '09:00',
                          local: 'Sala de Reuniões'
                        }
                      ].map((evento, index) => (
                        <div key={index} className="border rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-purple-500" />
                            <div>
                              <p className="font-medium">{evento.titulo}</p>
                              <p className="text-sm text-gray-500">
                                {evento.data} às {evento.horario} - {evento.local}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{evento.tipo}</Badge>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Horários dos Grupos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2 text-blue-600">Grupo A - Reforço Escolar</h4>
                        <div className="text-sm space-y-1">
                          <p><strong>Segunda:</strong> 14:00 - 16:00</p>
                          <p><strong>Quarta:</strong> 14:00 - 16:00</p>
                          <p><strong>Sexta:</strong> 14:00 - 16:00</p>
                          <p className="text-gray-500 mt-2">Local: Sala 2</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2 text-green-600">Grupo B - Atividades Recreativas</h4>
                        <div className="text-sm space-y-1">
                          <p><strong>Terça:</strong> 16:00 - 17:30</p>
                          <p><strong>Quinta:</strong> 16:00 - 17:30</p>
                          <p><strong>Sábado:</strong> 09:00 - 11:00</p>
                          <p className="text-gray-500 mt-2">Local: Pátio/Quadra</p>
                        </div>
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
                <CardTitle>Relatórios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-blue-500" />
                        Relatório de Frequência
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        Gere relatórios de presença dos grupos supervisionados.
                      </p>
                      <div className="space-y-2">
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o grupo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="grupo-a">Grupo A</SelectItem>
                            <SelectItem value="grupo-b">Grupo B</SelectItem>
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
                        <Activity className="w-4 h-4 text-green-500" />
                        Relatório de Atividades
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        Análise das atividades realizadas e participação.
                      </p>
                      <div className="space-y-2">
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo de atividade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todas">Todas</SelectItem>
                            <SelectItem value="reforco">Reforço Escolar</SelectItem>
                            <SelectItem value="recreativas">Recreativas</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Período" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="semanal">Semanal</SelectItem>
                            <SelectItem value="mensal">Mensal</SelectItem>
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
                    <h3 className="font-semibold mb-4">Relatórios Recentes</h3>
                    <div className="space-y-2">
                      {[
                        { nome: 'Frequência - Grupo A - Setembro 2025', data: '26/09/2025', tipo: 'PDF' },
                        { nome: 'Atividades - Todos os Grupos - Agosto 2025', data: '25/08/2025', tipo: 'PDF' }
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
            <Card>
              <CardHeader>
                <CardTitle>Acompanhamento Individual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-2">Buscar Aluno</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input placeholder="Nome do aluno..." className="pl-10" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-2">Grupo</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os grupos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os grupos</SelectItem>
                          <SelectItem value="grupo-a">Grupo A</SelectItem>
                          <SelectItem value="grupo-b">Grupo B</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="bg-blue-500 hover:bg-blue-600">
                      <Search className="w-4 h-4 mr-2" />
                      Buscar
                    </Button>
                  </div>
                  
                  <div className="grid gap-4">
                    {[
                      {
                        nome: 'Ana Costa',
                        grupo: 'Grupo A',
                        frequencia: 92,
                        progresso: 85,
                        observacoes: 'Excelente participação nas atividades',
                        ultimaAtividade: '25/09/2025',
                        status: 'Em dia'
                      },
                      {
                        nome: 'Carlos Silva',
                        grupo: 'Grupo B',
                        frequencia: 75,
                        progresso: 70,
                        observacoes: 'Necessita mais atenção em matemática',
                        ultimaAtividade: '24/09/2025',
                        status: 'Atenção'
                      },
                      {
                        nome: 'Maria Santos',
                        grupo: 'Grupo A',
                        frequencia: 96,
                        progresso: 95,
                        observacoes: 'Aluna exemplar, ajuda os colegas',
                        ultimaAtividade: '25/09/2025',
                        status: 'Destaque'
                      }
                    ].map((aluno, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-500" />
                            <h3 className="font-semibold">{aluno.nome}</h3>
                            <Badge variant="outline">{aluno.grupo}</Badge>
                          </div>
                          <Badge className={
                            aluno.status === 'Destaque' ? 'bg-green-100 text-green-800' :
                            aluno.status === 'Atenção' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }>
                            {aluno.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="text-center p-3 bg-blue-50 rounded">
                            <p className="text-2xl font-bold text-blue-600">{aluno.frequencia}%</p>
                            <p className="text-sm text-gray-600">Frequência</p>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded">
                            <p className="text-2xl font-bold text-green-600">{aluno.progresso}%</p>
                            <p className="text-sm text-gray-600">Progresso</p>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded">
                            <p className="text-sm font-medium text-purple-600">{aluno.ultimaAtividade}</p>
                            <p className="text-sm text-gray-600">Última Atividade</p>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Observações Recentes:</h4>
                          <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded">
                            {aluno.observacoes}
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4 mr-1" />
                            Adicionar Observação
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            Ver Histórico
                          </Button>
                          <Button size="sm" variant="outline">
                            <FileText className="w-4 h-4 mr-1" />
                            Relatório Individual
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Resumo Geral</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-blue-50 rounded">
                        <p className="text-xl font-bold text-blue-600">18</p>
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
                        <Input defaultValue={userName} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <Input defaultValue="monitor@institutoogrito.org" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Telefone</label>
                        <Input defaultValue="(31) 98765-4321" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Área de Atuação</label>
                        <Input defaultValue="Monitoria Educacional" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Grupos Supervisionados</label>
                        <div className="flex gap-2">
                          <Badge className="bg-blue-100 text-blue-800">Grupo A - Reforço Escolar</Badge>
                          <Badge className="bg-green-100 text-green-800">Grupo B - Atividades Recreativas</Badge>
                        </div>
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
                        <p className="text-xl font-bold text-blue-600">3</p>
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
                    className="bg-blue-500 hover:bg-blue-600"
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
                    <User className="w-5 h-5 text-blue-600" />
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
                    className="bg-blue-500 hover:bg-blue-600"
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
                  <Input
                    value={novaAtividadeForm.grupo}
                    onChange={(e) => setNovaAtividadeForm({...novaAtividadeForm, grupo: e.target.value})}
                    placeholder="Ex: Grupo A"
                    data-testid="input-atividade-grupo"
                  />
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

        {/* Modal de Novo Grupo */}
        <Dialog open={showNovoGrupoModal} onOpenChange={setShowNovoGrupoModal}>
          <DialogContent className="max-w-md">
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
                <label className="text-sm font-medium">Número de Alunos</label>
                <Input
                  type="number"
                  value={novoGrupoForm.alunos}
                  onChange={(e) => setNovoGrupoForm({ ...novoGrupoForm, alunos: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  data-testid="input-alunos-grupo"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Frequência (%)</label>
                <Input
                  value={novoGrupoForm.frequencia}
                  onChange={(e) => setNovoGrupoForm({ ...novoGrupoForm, frequencia: e.target.value })}
                  placeholder="Ex: 85.5"
                  data-testid="input-frequencia-grupo"
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
              <Button
                className="w-full bg-purple-500 hover:bg-purple-600"
                onClick={() => createGrupoMutation.mutate(novoGrupoForm)}
                disabled={createGrupoMutation.isPending || !novoGrupoForm.nome}
                data-testid="button-criar-grupo"
              >
                {createGrupoMutation.isPending ? 'Salvando...' : 'Criar Grupo'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Alteração de Senha */}
        <AlterarSenhaMonitor 
          open={showAlterarSenhaModal} 
          onOpenChange={setShowAlterarSenhaModal}
        />
      </div>
    </div>
  );
}
