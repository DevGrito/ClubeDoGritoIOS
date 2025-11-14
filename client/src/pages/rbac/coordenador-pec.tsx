import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import type { Project, Activity as PECActivity, ActivityInstance, User as UserType, Educador } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  UserCheck,
  Award,
  Download,
  Plus,
  Search,
  User,
  Edit,
  Eye,
  Trash2,
  X
} from "lucide-react";
import { InstanceForm, ActivityForm } from "@/components/pec/forms";
import { ComprehensiveStudentForm } from "@/components/comprehensive-student-form";

export default function CoordenadorPECPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('dashboard');
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  // Estados para modais
  const [showNovaTurmaModal, setShowNovaTurmaModal] = useState(false);
  const [showNovaOficinaModal, setShowNovaOficinaModal] = useState(false);
  const [showAdicionarAlunoModal, setShowAdicionarAlunoModal] = useState(false);
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
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  
  // Estados para modais de educadores
  const [showNovoEducadorModal, setShowNovoEducadorModal] = useState(false);
  const [showVisualizarEducadorModal, setShowVisualizarEducadorModal] = useState(false);
  const [showEditarEducadorModal, setShowEditarEducadorModal] = useState(false);
  const [selectedEducador, setSelectedEducador] = useState<any>(null);
  
  // Estados para turmas
  const [showVisualizarTurmaModal, setShowVisualizarTurmaModal] = useState(false);
  const [showEditarTurmaModal, setShowEditarTurmaModal] = useState(false);
  const [showExcluirTurmaModal, setShowExcluirTurmaModal] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<any>(null);
  
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
  
  // State do formulário de educadores
  const [educadorForm, setEducadorForm] = useState({
    cpf: '',
    nome_completo: '',
    telefone: '',
    email: '',
    formacao: '',
    especialidades: '',
    status: 'ativo'
  });
  
  // Coordenador sempre exibe "Coordenador" (não pega do localStorage)
  const userId = localStorage.getItem("userId");
  const userName = "Coordenador";
  const userPapel = localStorage.getItem("userPapel");

  // Função para mudar seção e fazer scroll
  const changeSection = (section: string) => {
    setActiveSection(section);
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Handlers para os botões
  const handleNovaTurma = () => {
    setShowNovaTurmaModal(true);
  };

  const handleChamadaManual = () => {
    toast({
      title: "Chamada Manual",
      description: "Funcionalidade em desenvolvimento."
    });
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
    setShowExcluirOficinaModal(true);
  };

  const handleVisualizarEducador = (educador: any) => {
    setSelectedEducador(educador);
    setShowVisualizarEducadorModal(true);
  };

  const handleEditarEducador = (educador: any) => {
    setSelectedEducador(educador);
    setEducadorForm({
      cpf: educador.cpf || '',
      nome_completo: educador.nome_completo || '',
      telefone: educador.telefone || '',
      email: educador.email || '',
      formacao: educador.formacao || '',
      especialidades: Array.isArray(educador.especialidades) ? educador.especialidades.join(', ') : '',
      status: educador.vinculo?.status || 'ativo'
    });
    setShowEditarEducadorModal(true);
  };

  // Handlers de turmas
  const handleViewTurma = (instance: any) => {
    setSelectedInstance(instance);
    setShowVisualizarTurmaModal(true);
  };

  const handleEditTurma = (instance: any) => {
    setSelectedInstance(instance);
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
      toast({ title: "Erro", description: error.message || "Erro ao criar projeto", variant: "destructive" });
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
      toast({ title: "Erro", description: error.message || "Erro ao atualizar projeto", variant: "destructive" });
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
        title: "Erro ao excluir",
        description: error?.message || "Não foi possível excluir o projeto.",
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
    mutationFn: async (activityId: number) => {
      return await apiRequest(`/api/pec/activities/${activityId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pec/activities'] });
      toast({
        title: "Oficina excluída",
        description: `A oficina "${selectedActivity?.name}" foi excluída com sucesso.`,
      });
      setShowExcluirOficinaModal(false);
      setSelectedActivity(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir",
        description: error?.message || "Não foi possível excluir a oficina.",
        variant: "destructive"
      });
    }
  });

  const confirmarExclusaoOficina = () => {
    if (selectedActivity?.id) {
      excluirOficinaMutation.mutate(selectedActivity.id);
    }
  };
  
  // Mutation para cadastrar educador
  const criarEducadorMutation = useMutation({
    mutationFn: async (data: any) => {
      // Processar especialidades usando função helper
      const especialidadesArray = processarEspecialidades(data.especialidades);
      
      // Validar que pelo menos uma especialidade foi informada
      if (especialidadesArray.length === 0) {
        throw new Error('Informe pelo menos uma especialidade válida');
      }
      
      const payload = {
        ...data,
        especialidades: especialidadesArray
      };
      
      return await apiRequest('/api/educadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/educadores/pec'] });
      toast({
        title: "Educador cadastrado!",
        description: "O educador foi cadastrado com sucesso."
      });
      setShowNovoEducadorModal(false);
      setEducadorForm({
        cpf: '',
        nome_completo: '',
        telefone: '',
        email: '',
        formacao: '',
        especialidades: '',
        status: 'ativo'
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cadastrar educador",
        description: error.message || "Não foi possível cadastrar o educador.",
        variant: "destructive"
      });
    }
  });

  const atualizarEducadorMutation = useMutation({
    mutationFn: async (data: any) => {
      const especialidadesArray = processarEspecialidades(data.especialidades);
      
      return await apiRequest(`/api/educadores/${selectedEducador.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          cpf: data.cpf,
          nome_completo: data.nome_completo,
          telefone: data.telefone,
          email: data.email || null,
          formacao: data.formacao || null,
          especialidades: especialidadesArray,
          status: data.status
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/educadores/pec'] });
      toast({
        title: "Educador atualizado!",
        description: "Os dados do educador foram atualizados com sucesso."
      });
      setShowEditarEducadorModal(false);
      setSelectedEducador(null);
      setEducadorForm({ cpf: '', nome_completo: '', telefone: '', email: '', formacao: '', especialidades: '', status: 'ativo' });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar educador",
        description: error.message || "Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Mutation para excluir turma
  const deleteInstanceMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/pec/instances/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pec/instances'] });
      setShowExcluirTurmaModal(false);
      toast({ title: 'Sucesso', description: 'Turma excluída com sucesso' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message || 'Erro ao excluir turma', variant: 'destructive' });
    },
  });
  
  const handleNovoEducador = () => {
    setShowNovoEducadorModal(true);
  };
  
  // Helper para processar e validar especialidades
  const processarEspecialidades = (especialidadesStr: string): string[] => {
    if (!especialidadesStr) return [];
    return especialidadesStr
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0);
  };
  
  // Validar se educador form tem especialidades válidas
  const educadorTemEspecialidadesValidas = (): boolean => {
    const especialidades = processarEspecialidades(educadorForm.especialidades);
    return especialidades.length > 0;
  };

  // Query para buscar dados do dashboard do coordenador
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: [`/api/coordenador/dashboard/${userId}`, { area: 'pec' }],
    enabled: !!userId
  });

  // Query para buscar projetos do PEC (usando fetcher padrão)
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Query para buscar atividades do PEC (usando fetcher padrão)
  const { data: activities = [] } = useQuery<PECActivity[]>({
    queryKey: ['/api/pec/activities'],
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

  // Query para buscar dados de usuários
  const { data: usersData = [] } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
  });
  
  // Query para buscar educadores do PEC
  const { data: educadores = [] } = useQuery<Educador[]>({
    queryKey: ['/api/educadores/pec'],
    enabled: activeSection === 'educadores'
  });

  // Filtrar apenas alunos
  const students = usersData.filter((u) => u.role === 'student' || u.role === 'aluno');

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
    <div className="min-h-screen bg-gray-50" data-testid="coordenador-pec-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900" data-testid="text-welcome">
                Coordenação Esporte e Cultura
              </h1>
              <p className="text-gray-600" data-testid="text-username">Olá Coordenador</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" data-testid="badge-role">
              🏆 Coordenador PEC
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
          
          {/* Indicadores da Área */}
          <Card data-testid="card-indicadores">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-orange-500" />
                Indicadores da Área
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Alunos Ativos:</span>
                <span className="font-semibold" data-testid="text-atletas-ativos">
                  {dashboardData?.atletasAtivos || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Modalidades Oferecidas:</span>
                <span className="font-semibold" data-testid="text-modalidades">
                  {dashboardData?.modalidades || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Eventos Realizados:</span>
                <span className="font-semibold text-orange-600" data-testid="text-eventos-realizados">
                  {dashboardData?.eventosRealizados || 0}
                </span>
              </div>
            </CardContent>
          </Card>

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
                  variant={activeSection === 'chamadas' ? 'default' : 'outline'}
                  data-testid="button-chamadas"
                  onClick={() => changeSection('chamadas')}
                  size="sm"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Chamadas
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'oficinas' ? 'default' : 'outline'}
                  data-testid="button-oficinas-alunos"
                  onClick={() => changeSection('oficinas')}
                  size="sm"
                >
                  <Music className="w-4 h-4 mr-2" />
                  Oficinas
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
                  <UserCheck className="w-4 h-4 mr-2" />
                  Avaliações Físicas
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

          {/* Gestão de Educadores */}
          <Card data-testid="card-educadores">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserCheck className="w-5 h-5 text-purple-500" />
                Gestão de Educadores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Gerencie educadores, cadastre profissionais e acompanhe especialidades.
              </p>
              <Button 
                className="w-full bg-purple-500 hover:bg-purple-600 text-white" 
                data-testid="button-educadores"
                onClick={() => changeSection('educadores')}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Educadores
              </Button>
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
        <div className="mt-8" ref={contentRef}>
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
                      <Input placeholder="Buscar alunos..." className="pl-10" />
                    </div>
                    <Select>
                      <SelectTrigger className="w-32">
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
                  
                  {students.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum aluno encontrado. Clique em "Adicionar Aluno" para cadastrar.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student: any) => (
                          <TableRow key={student.id}>
                            <TableCell className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              {student.nome || 'Sem nome'}
                            </TableCell>
                            <TableCell>{student.telefone || 'Não informado'}</TableCell>
                            <TableCell>
                              <Badge className={student.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {student.is_active ? 'Ativo' : 'Inativo'}
                              </Badge>
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
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'educadores' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gestão de Educadores</CardTitle>
                <Button size="sm" className="bg-purple-500 hover:bg-purple-600" onClick={handleNovoEducador} data-testid="button-novo-educador">
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Educador
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="Buscar educadores..." className="pl-10" data-testid="input-buscar-educadores" />
                    </div>
                  </div>
                  
                  {educadores.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum educador encontrado. Clique em "Cadastrar Educador" para adicionar.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>CPF</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Especialidades</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {educadores.map((educador: any) => (
                          <TableRow key={educador.id}>
                            <TableCell className="flex items-center gap-2">
                              <UserCheck className="w-4 h-4 text-purple-400" />
                              {educador.nome_completo || 'Sem nome'}
                            </TableCell>
                            <TableCell>{educador.cpf || 'Não informado'}</TableCell>
                            <TableCell>{educador.telefone || 'Não informado'}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {Array.isArray(educador.especialidades) && educador.especialidades.length > 0 
                                  ? educador.especialidades.map((esp: string, idx: number) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {esp}
                                      </Badge>
                                    ))
                                  : <span className="text-gray-400 text-sm">Nenhuma</span>
                                }
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={educador.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {educador.status === 'ativo' ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleVisualizarEducador(educador)}
                                  data-testid={`button-view-educador-${educador.id}`}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleEditarEducador(educador)}
                                  data-testid={`button-edit-educador-${educador.id}`}
                                >
                                  <Edit className="w-4 h-4" />
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
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gestão de Turmas</CardTitle>
                <Button size="sm" className="bg-blue-500 hover:bg-blue-600" onClick={handleNovaTurma}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Turma
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="Buscar turmas..." className="pl-10" />
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
                        <SelectItem value="musica">Música</SelectItem>
                        <SelectItem value="danca">Dança</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {instances.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Nenhuma turma encontrada. Clique em "Nova Turma" para adicionar.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Turma</TableHead>
                          <TableHead>Local</TableHead>
                          <TableHead>Horário</TableHead>
                          <TableHead>Vagas</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {instances.map((instance: any) => (
                          <TableRow key={instance.id}>
                            <TableCell>
                              <div className="font-medium">{instance.title}</div>
                            </TableCell>
                            <TableCell>{instance.location || 'Não especificado'}</TableCell>
                            <TableCell>
                              {instance.schedule || 'A definir'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {instance.max_participants ? `${instance.max_participants} vagas` : 'Ilimitado'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleViewTurma(instance)}
                                  data-testid={`button-view-turma-${instance.id}`}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEditTurma(instance)}
                                  data-testid={`button-edit-turma-${instance.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleDeleteTurma(instance)}
                                  data-testid={`button-delete-turma-${instance.id}`}
                                  className="hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
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

          {activeSection === 'chamadas' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Registro de Chamadas</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
                    data-testid="button-chamada-manual"
                    onClick={handleChamadaManual}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Manual
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-green-500 text-green-600 hover:bg-green-50"
                    data-testid="button-chamada-intebras"
                    onClick={handleChamadaIntebras}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Intebras
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="Buscar turma..." className="pl-10" />
                    </div>
                    <Select>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hoje">Hoje</SelectItem>
                        <SelectItem value="semana">Esta Semana</SelectItem>
                        <SelectItem value="mes">Este Mês</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <div className="text-gray-400 mb-2">
                      <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium mb-1">Módulo de Chamadas</p>
                    <p className="text-gray-500 text-sm">
                      Nenhuma chamada registrada. Clique em "Nova Chamada" para começar.
                    </p>
                  </div>
                </div>
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
                        <Button size="sm" variant="outline" onClick={() => setActiveSection('atletas')}>
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
                      <h3 className="font-semibold text-lg">{userName}</h3>
                      <p className="text-gray-600">Coordenador de Esporte e Cultura</p>
                      <Badge className="bg-orange-100 text-orange-800 mt-1">
                        🏆 PEC - Polo Esportivo Cultural
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-md">Informações Pessoais</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-gray-500">Nome Completo</label>
                          <Input value={userName} className="mt-1" />
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">Email</label>
                          <Input value="coordenador@institutoogrito.org" className="mt-1" />
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">Telefone</label>
                          <Input value="(31) 99999-9999" className="mt-1" />
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">Cargo</label>
                          <Input value="Coordenador de Esporte e Cultura" className="mt-1" disabled />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold text-md">Preferências do Sistema</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-gray-500">Tema</label>
                          <Select>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Selecione o tema" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="claro">Claro</SelectItem>
                              <SelectItem value="escuro">Escuro</SelectItem>
                              <SelectItem value="auto">Automático</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">Idioma</label>
                          <Select>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Português (Brasil)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pt-br">Português (Brasil)</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">Notificações</label>
                          <Select>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Ativadas" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todas">Todas</SelectItem>
                              <SelectItem value="importantes">Apenas Importantes</SelectItem>
                              <SelectItem value="desativadas">Desativadas</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
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
                        <div className="text-2xl font-bold text-green-600">{dashboardData?.eventosRealizados || 0}</div>
                        <div className="text-sm text-gray-600">Eventos Organizados</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">A+</div>
                        <div className="text-sm text-gray-600">Avaliação Geral</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <Edit className="w-4 h-4 mr-2" />
                      Salvar Alterações
                    </Button>
                    <Button variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Configurações Avançadas
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
        onClose={() => setShowAdicionarAlunoModal(false)}
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
              <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
                <strong>Atenção:</strong> Se esta oficina possuir turmas relacionadas, a exclusão será bloqueada.
              </p>
              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1 bg-red-500 hover:bg-red-600" 
                  onClick={confirmarExclusaoOficina}
                  disabled={excluirOficinaMutation.isPending}
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

      {/* Modal Cadastrar Educador */}
      {showNovoEducadorModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNovoEducadorModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-purple-600">Cadastrar Novo Educador</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowNovoEducadorModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">CPF *</label>
                <Input 
                  placeholder="000.000.000-00"
                  value={educadorForm.cpf}
                  onChange={(e) => setEducadorForm(prev => ({ ...prev, cpf: e.target.value }))}
                  data-testid="input-educador-cpf"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Nome Completo *</label>
                <Input 
                  placeholder="Ex: João Silva Santos"
                  value={educadorForm.nome_completo}
                  onChange={(e) => setEducadorForm(prev => ({ ...prev, nome_completo: e.target.value }))}
                  data-testid="input-educador-nome"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Telefone *</label>
                <Input 
                  placeholder="(31) 99999-9999"
                  value={educadorForm.telefone}
                  onChange={(e) => setEducadorForm(prev => ({ ...prev, telefone: e.target.value }))}
                  data-testid="input-educador-telefone"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input 
                  placeholder="educador@example.com"
                  type="email"
                  value={educadorForm.email}
                  onChange={(e) => setEducadorForm(prev => ({ ...prev, email: e.target.value }))}
                  data-testid="input-educador-email"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Formação</label>
                <Input 
                  placeholder="Ex: Licenciatura em Educação Física"
                  value={educadorForm.formacao}
                  onChange={(e) => setEducadorForm(prev => ({ ...prev, formacao: e.target.value }))}
                  data-testid="input-educador-formacao"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Especialidades *</label>
                <Input 
                  placeholder="Ex: Futebol, Vôlei, Basquete (separados por vírgula)"
                  value={educadorForm.especialidades}
                  onChange={(e) => setEducadorForm(prev => ({ ...prev, especialidades: e.target.value }))}
                  data-testid="input-educador-especialidades"
                />
                <p className="text-xs text-gray-500 mt-1">Separe múltiplas especialidades por vírgula</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select
                  value={educadorForm.status}
                  onValueChange={(value) => setEducadorForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger data-testid="select-educador-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  className="flex-1 bg-purple-500 hover:bg-purple-600" 
                  onClick={() => criarEducadorMutation.mutate(educadorForm)}
                  disabled={
                    criarEducadorMutation.isPending || 
                    !educadorForm.cpf || 
                    !educadorForm.nome_completo || 
                    !educadorForm.telefone ||
                    !educadorTemEspecialidadesValidas()
                  }
                  data-testid="button-salvar-educador"
                >
                  {criarEducadorMutation.isPending ? 'Cadastrando...' : 'Cadastrar Educador'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowNovoEducadorModal(false);
                  setEducadorForm({
                    cpf: '',
                    nome_completo: '',
                    telefone: '',
                    email: '',
                    formacao: '',
                    especialidades: '',
                    status: 'ativo'
                  });
                }} data-testid="button-cancelar-educador">
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualizar Educador */}
      {showVisualizarEducadorModal && selectedEducador && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Detalhes do Educador</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowVisualizarEducadorModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nome Completo</label>
                <p className="text-gray-700 mt-1">{selectedEducador.nome_completo}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">CPF</label>
                  <p className="text-gray-700 mt-1">{selectedEducador.cpf}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Telefone</label>
                  <p className="text-gray-700 mt-1">{selectedEducador.telefone}</p>
                </div>
              </div>
              {selectedEducador.email && (
                <div>
                  <label className="text-sm font-medium text-gray-500">E-mail</label>
                  <p className="text-gray-700 mt-1">{selectedEducador.email}</p>
                </div>
              )}
              {selectedEducador.formacao && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Formação</label>
                  <p className="text-gray-700 mt-1">{selectedEducador.formacao}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Especialidades</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Array.isArray(selectedEducador.especialidades) && selectedEducador.especialidades.length > 0 
                    ? selectedEducador.especialidades.map((esp: string, idx: number) => (
                        <Badge key={idx} variant="outline">
                          {esp}
                        </Badge>
                      ))
                    : <span className="text-gray-400 text-sm">Nenhuma especialidade cadastrada</span>
                  }
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <Badge className={selectedEducador.vinculo?.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {selectedEducador.vinculo?.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t mt-4">
              <Button className="flex-1" onClick={() => {
                setShowVisualizarEducadorModal(false);
                handleEditarEducador(selectedEducador);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Editar Educador
              </Button>
              <Button variant="outline" onClick={() => setShowVisualizarEducadorModal(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Educador */}
      {showEditarEducadorModal && selectedEducador && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Editar Educador</h3>
              <Button variant="ghost" size="sm" onClick={() => {
                setShowEditarEducadorModal(false);
                setSelectedEducador(null);
              }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">CPF</label>
                <Input
                  value={educadorForm.cpf}
                  onChange={(e) => setEducadorForm({ ...educadorForm, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  disabled
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nome Completo *</label>
                <Input
                  value={educadorForm.nome_completo}
                  onChange={(e) => setEducadorForm({ ...educadorForm, nome_completo: e.target.value })}
                  placeholder="Nome completo do educador"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Telefone *</label>
                  <Input
                    value={educadorForm.telefone}
                    onChange={(e) => setEducadorForm({ ...educadorForm, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">E-mail</label>
                  <Input
                    value={educadorForm.email}
                    onChange={(e) => setEducadorForm({ ...educadorForm, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Formação</label>
                <Input
                  value={educadorForm.formacao}
                  onChange={(e) => setEducadorForm({ ...educadorForm, formacao: e.target.value })}
                  placeholder="Ex: Pedagogia, Artes, etc."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Especialidades</label>
                <Input
                  value={educadorForm.especialidades}
                  onChange={(e) => setEducadorForm({ ...educadorForm, especialidades: e.target.value })}
                  placeholder="Ex: dança, música, teatro (separar por vírgula)"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select 
                  value={educadorForm.status} 
                  onValueChange={(value) => setEducadorForm({ ...educadorForm, status: value })}
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
            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1 bg-purple-500 hover:bg-purple-600" 
                onClick={() => atualizarEducadorMutation.mutate(educadorForm)}
                disabled={
                  atualizarEducadorMutation.isPending || 
                  !educadorForm.nome_completo || 
                  !educadorForm.telefone
                }
              >
                {atualizarEducadorMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
              <Button variant="outline" onClick={() => {
                setShowEditarEducadorModal(false);
                setSelectedEducador(null);
              }}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualizar Turma */}
      <Dialog open={showVisualizarTurmaModal} onOpenChange={setShowVisualizarTurmaModal}>
        <DialogContent className="max-w-2xl" data-testid="modal-visualizar-turma">
          <DialogHeader>
            <DialogTitle>Detalhes da Turma</DialogTitle>
          </DialogHeader>
          {selectedInstance && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Título</label>
                  <p className="text-sm" data-testid="text-turma-title">{selectedInstance.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Código</label>
                  <p className="text-sm" data-testid="text-turma-code">{selectedInstance.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Local</label>
                  <p className="text-sm" data-testid="text-turma-location">{selectedInstance.location || 'Não especificado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Situação</label>
                  <p className="text-sm" data-testid="text-turma-situation">{selectedInstance.situation}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Período</label>
                  <p className="text-sm" data-testid="text-turma-period">{selectedInstance.period_label || 'Não especificado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Horário</label>
                  <p className="text-sm" data-testid="text-turma-schedule">
                    {selectedInstance.start_time && selectedInstance.end_time 
                      ? `${selectedInstance.start_time} - ${selectedInstance.end_time}`
                      : 'A definir'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Faixa Etária</label>
                  <p className="text-sm" data-testid="text-turma-age-range">
                    {selectedInstance.age_min && selectedInstance.age_max
                      ? `${selectedInstance.age_min} - ${selectedInstance.age_max} anos`
                      : 'Não especificado'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Modo de Controle</label>
                  <p className="text-sm" data-testid="text-turma-control-mode">
                    {selectedInstance.control_mode === 'manual' ? 'Manual' : 'Intelbras'}
                  </p>
                </div>
              </div>
              {selectedInstance.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Observações</label>
                  <p className="text-sm" data-testid="text-turma-notes">{selectedInstance.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
    </div>
  );
}