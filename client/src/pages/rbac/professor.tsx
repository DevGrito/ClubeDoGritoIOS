import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ComprehensiveStudentForm } from "@/components/comprehensive-student-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getBrazilDateString, formatDateBrazil } from "@/lib/brazil-date";
import { 
  Users, 
  BookOpen, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut,
  GraduationCap,
  Clock,
  Target,
  Download,
  Plus,
  Search,
  User,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
  UserPlus
} from "lucide-react";

export default function ProfessorPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showEditPlanoModal, setShowEditPlanoModal] = useState(false);
  const [showViewPlanoModal, setShowViewPlanoModal] = useState(false);
  const [showNovoPlanoModal, setShowNovoPlanoModal] = useState(false);
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
  
  // States para cadastro de participantes (Inclusão)
  const [showNovoParticipanteModal, setShowNovoParticipanteModal] = useState(false);
  const [showEditParticipanteModal, setShowEditParticipanteModal] = useState(false);
  const [showViewParticipanteModal, setShowViewParticipanteModal] = useState(false);
  const [selectedParticipante, setSelectedParticipante] = useState<any>(null);
  const [buscaParticipante, setBuscaParticipante] = useState('');
  
  // States para gerenciamento de turmas
  const [showNovaTurmaModal, setShowNovaTurmaModal] = useState(false);
  const [showEditTurmaModal, setShowEditTurmaModal] = useState(false);
  const [showGerenciarAlunosModal, setShowGerenciarAlunosModal] = useState(false);
  const [selectedTurma, setSelectedTurma] = useState<any>(null);
  const [buscaAlunoTurma, setBuscaAlunoTurma] = useState('');
  const [novaTurmaForm, setNovaTurmaForm] = useState({
    nome: '',
    descricao: '',
    horarioEntrada: '',
    horarioSaida: '',
    local: ''
  });
  
  // States para controle de chamada/frequência
  const [chamadaData, setChamadaData] = useState(getBrazilDateString());
  const [chamadaTurmaId, setChamadaTurmaId] = useState('');
  const [presencas, setPresencas] = useState<Array<{ participanteId: number; nome: string; presente: boolean }>>([]);
  
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
  const [filtroChamadaData, setFiltroChamadaData] = useState('');
  const [showHistoricoChamadas, setShowHistoricoChamadas] = useState(false);
  const [historicoFiltroTurma, setHistoricoFiltroTurma] = useState('');
  const [historicoFiltroDataInicio, setHistoricoFiltroDataInicio] = useState('');
  const [historicoFiltroDataFim, setHistoricoFiltroDataFim] = useState('');
  
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
  
  // States para acompanhamento pedagógico
  const [filtroTurmaAcomp, setFiltroTurmaAcomp] = useState('');
  const [buscaAlunoAcomp, setBuscaAlunoAcomp] = useState('');
  const [anotacoesAlunos, setAnotacoesAlunos] = useState<Record<number, string>>({});
  
  // Detectar vertente pela URL
  const vertente: 'pec' | 'inclusao' = location.includes('/professor/inclusao') ? 'inclusao' : 'pec';
  const vertenteLabel = vertente === 'pec' ? 'PEC' : 'Inclusão Produtiva';
  
  // Obter dados do usuário do localStorage
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName") || "Professor";
  const userPapel = localStorage.getItem("userPapel");

  // Query para buscar dados do dashboard do professor
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/professor/dashboard', userId, vertente],
    queryFn: async () => {
      const response = await fetch(`/api/professor/dashboard/${userId}?vertente=${vertente}`, {
        headers: { 'x-user-id': userId || '' }
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      return response.json();
    },
    enabled: !!userId
  });

  // Query para listar participantes de Inclusão Produtiva (mesma API do coordenador)
  const { data: participantesInclusao = [], isLoading: participantesLoading, refetch: refetchParticipantes } = useQuery({
    queryKey: ['/api/participantes-inclusao'],
    queryFn: async () => {
      const response = await fetch('/api/participantes-inclusao');
      if (!response.ok) throw new Error('Failed to fetch participantes');
      return response.json();
    },
    enabled: vertente === 'inclusao'
  });

  // Query para buscar turmas do professor (todas as turmas da vertente)
  const { data: minhasTurmas = [], isLoading: turmasLoading, refetch: refetchTurmas } = useQuery({
    queryKey: ['/api/professor/turmas', userId, vertente],
    queryFn: async () => {
      const response = await fetch(`/api/professor/${userId}/turmas?vertente=${vertente}`);
      if (!response.ok) throw new Error('Failed to fetch turmas');
      return response.json();
    },
    enabled: !!userId
  });

  // Mutation para criar nova turma
  const createTurmaMutation = useMutation({
    mutationFn: async (data: typeof novaTurmaForm) => {
      const response = await fetch(`/api/professor/${userId}/turmas?vertente=${vertente}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create turma');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professor/turmas', userId, vertente] });
      setShowNovaTurmaModal(false);
      setNovaTurmaForm({ nome: '', descricao: '', horarioEntrada: '', horarioSaida: '', local: '' });
      toast({ title: "Sucesso", description: "Turma criada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao criar turma", variant: "destructive" });
    }
  });

  // Mutation para atualizar turma
  const updateTurmaMutation = useMutation({
    mutationFn: async ({ turmaId, data }: { turmaId: number; data: any }) => {
      const response = await fetch(`/api/professor/${userId}/turmas/${turmaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update turma');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professor/turmas', userId] });
      setShowEditTurmaModal(false);
      setSelectedTurma(null);
      toast({ title: "Sucesso", description: "Turma atualizada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao atualizar turma", variant: "destructive" });
    }
  });

  // Mutation para inativar turma
  const inativarTurmaMutation = useMutation({
    mutationFn: async (turmaId: number) => {
      const response = await fetch(`/api/professor/${userId}/turmas/${turmaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'inativo' })
      });
      if (!response.ok) throw new Error('Failed to inactivate turma');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professor/turmas', userId] });
      toast({ title: "Sucesso", description: "Turma inativada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao inativar turma", variant: "destructive" });
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
      if (!response.ok) throw new Error('Failed to reactivate turma');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professor/turmas', userId] });
      toast({ title: "Sucesso", description: "Turma reativada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao reativar turma", variant: "destructive" });
    }
  });

  // Query para buscar alunos de uma turma específica
  const { data: alunosDaTurma = [], isLoading: alunosTurmaLoading, refetch: refetchAlunosTurma } = useQuery({
    queryKey: ['/api/professor/turmas/alunos', selectedTurma?.id],
    queryFn: async () => {
      if (!selectedTurma?.id) return [];
      const response = await fetch(`/api/professor/${userId}/turmas/${selectedTurma.id}/alunos`);
      if (!response.ok) throw new Error('Failed to fetch alunos');
      return response.json();
    },
    enabled: !!selectedTurma?.id && showGerenciarAlunosModal
  });

  // Mutation para adicionar aluno à turma
  const addAlunoTurmaMutation = useMutation({
    mutationFn: async ({ turmaId, participanteId }: { turmaId: number; participanteId: number }) => {
      const response = await fetch(`/api/professor/${userId}/turmas/${turmaId}/alunos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participanteId })
      });
      if (!response.ok) throw new Error('Failed to add aluno');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professor/turmas/alunos', selectedTurma?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/professor/turmas', userId] });
      toast({ title: "Sucesso", description: "Aluno adicionado à turma!" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao adicionar aluno", variant: "destructive" });
    }
  });

  // Mutation para remover aluno da turma
  const removeAlunoTurmaMutation = useMutation({
    mutationFn: async ({ turmaId, alunoId }: { turmaId: number; alunoId: number }) => {
      const response = await fetch(`/api/professor/${userId}/turmas/${turmaId}/alunos/${alunoId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to remove aluno');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professor/turmas/alunos', selectedTurma?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/professor/turmas', userId] });
      toast({ title: "Sucesso", description: "Aluno removido da turma!" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao remover aluno", variant: "destructive" });
    }
  });

  // Query para buscar alunos da turma selecionada para chamada
  const { data: alunosChamada = [], isLoading: alunosChamadaLoading } = useQuery({
    queryKey: ['/api/professor/turmas/alunos/chamada', chamadaTurmaId],
    queryFn: async () => {
      if (!chamadaTurmaId) return [];
      const response = await fetch(`/api/professor/${userId}/turmas/${chamadaTurmaId}/alunos`);
      if (!response.ok) throw new Error('Failed to fetch alunos');
      return response.json();
    },
    enabled: !!chamadaTurmaId && activeSection === 'frequencia'
  });

  // Atualizar presenças quando os alunos da turma são carregados
  useEffect(() => {
    if (alunosChamada.length > 0) {
      setPresencas(alunosChamada.map((aluno: any) => ({
        participanteId: aluno.id,
        nome: aluno.nome,
        presente: true
      })));
    }
  }, [alunosChamada]);

  // Query para buscar histórico de chamadas do professor
  const { data: historicoChamadas = [], isLoading: historicoLoading, refetch: refetchHistorico } = useQuery({
    queryKey: ['/api/professor/historico-chamadas', userId],
    queryFn: async () => {
      const response = await fetch(`/api/professor/${userId}/historico-chamadas`);
      if (!response.ok) throw new Error('Failed to fetch historico');
      return response.json();
    },
    enabled: !!userId && (activeSection === 'frequencia' || activeSection === 'aulas')
  });

  // Mutation para salvar chamada do professor
  const saveChamadaMutation = useMutation({
    mutationFn: async () => {
      if (!chamadaTurmaId || !chamadaData) {
        throw new Error("Selecione uma turma e data");
      }
      const response = await fetch(`/api/professor/${userId}/registro-presenca`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turmaId: parseInt(chamadaTurmaId),
          data: chamadaData,
          presencas: presencas.map(p => ({
            participanteId: p.participanteId,
            presente: p.presente
          }))
        })
      });
      if (!response.ok) throw new Error('Failed to save chamada');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professor/historico-chamadas', userId] });
      toast({ title: "Chamada finalizada!", description: "Presenças registradas com sucesso." });
      setChamadaTurmaId('');
      setPresencas([]);
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message || "Não foi possível salvar a chamada.", variant: "destructive" });
    }
  });

  // Query para buscar planos de aula do professor
  const { data: meusPlanos = [], isLoading: planosLoading, refetch: refetchPlanos } = useQuery({
    queryKey: ['/api/professor/planos-aula', userId],
    queryFn: async () => {
      const response = await fetch(`/api/professor/${userId}/planos-aula`);
      if (!response.ok) throw new Error('Failed to fetch planos');
      return response.json();
    },
    enabled: !!userId && (activeSection === 'planos' || activeSection === 'aulas')
  });

  // Mutation para criar plano de aula
  const criarPlanoMutation = useMutation({
    mutationFn: async (planoData: any) => {
      const response = await fetch(`/api/professor/${userId}/planos-aula`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planoData)
      });
      if (!response.ok) throw new Error('Failed to create plano');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professor/planos-aula', userId] });
      toast({ title: "Plano criado!", description: "Plano de aula criado com sucesso." });
      setShowNovoPlanoModal(false);
      setPlanoForm({
        turmaId: '', data: new Date().toISOString().split('T')[0], titulo: '', objetivos: '',
        conteudo: '', metodologia: '', recursos: '', avaliacao: '', duracaoMinutos: '', status: 'rascunho'
      });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível criar o plano.", variant: "destructive" });
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
      if (!response.ok) throw new Error('Failed to update plano');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professor/planos-aula', userId] });
      toast({ title: "Plano atualizado!", description: "Plano de aula atualizado com sucesso." });
      setShowEditPlanoModal(false);
      setSelectedPlano(null);
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível atualizar o plano.", variant: "destructive" });
    }
  });

  // Mutation para excluir plano de aula
  const excluirPlanoMutation = useMutation({
    mutationFn: async (planoId: number) => {
      const response = await fetch(`/api/professor/${userId}/planos-aula/${planoId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete plano');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professor/planos-aula', userId] });
      toast({ title: "Plano excluído!", description: "Plano de aula removido com sucesso." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível excluir o plano.", variant: "destructive" });
    }
  });

  // Filtrar participantes que ainda não estão na turma
  const participantesDisponiveis = (participantesInclusao || []).filter((p: any) => {
    const jaEstaNaTurma = alunosDaTurma.some((a: any) => a.id === p.id);
    const matchBusca = !buscaAlunoTurma || (p.nome || '').toLowerCase().includes(buscaAlunoTurma.toLowerCase());
    return !jaEstaNaTurma && matchBusca;
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
  
  const handleSavePlano = () => {
    if (!planoForm.titulo || !planoForm.objetivos || !planoForm.conteudo || !planoForm.metodologia) {
      toast({ title: "Campos obrigatórios", description: "Preencha título, objetivos, conteúdo e metodologia.", variant: "destructive" });
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

  const handleSalvarRegistroAula = () => {
    if (!registroAulaForm.turmaId) {
      toast({ title: "Turma obrigatória", description: "Selecione uma turma para registrar a aula.", variant: "destructive" });
      return;
    }
    
    const turma = minhasTurmas.find((t: any) => t.id.toString() === registroAulaForm.turmaId);
    const plano = meusPlanos.find((p: any) => p.id.toString() === registroAulaForm.planoId);
    const chamada = historicoChamadas.find((c: any) => c.id?.toString() === registroAulaForm.chamadaId);
    
    // Extrair presentes/total da descrição da chamada (formato: "Presentes: X/Y. Dados: ...")
    let chamadaInfo = '';
    if (chamada) {
      const match = chamada.descricao?.match(/Presentes: (\d+)\/(\d+)/);
      if (match) {
        chamadaInfo = `${match[1]}/${match[2]} presentes`;
      }
    }
    
    const novoRegistro = {
      data: registroAulaForm.data,
      turmaId: registroAulaForm.turmaId,
      turmaNome: (turma?.nome || turma?.title) || '',
      planoId: registroAulaForm.planoId,
      planoTitulo: plano?.titulo || '',
      chamadaId: registroAulaForm.chamadaId,
      chamadaInfo,
      conteudo: registroAulaForm.conteudo,
      observacoes: registroAulaForm.observacoes
    };
    
    setRegistrosAulas(prev => [novoRegistro, ...prev]);
    setRegistroAulaForm({
      data: getBrazilDateString(),
      turmaId: '',
      planoId: '',
      chamadaId: '',
      conteudo: '',
      observacoes: ''
    });
    
    toast({ title: "Aula registrada", description: "O registro de aula foi salvo com sucesso." });
  };

  if (isLoading) {
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
    <div className="min-h-screen bg-gray-50" data-testid="professor-page">
      {/* Header */}
      <div className={`border-b px-4 py-4 md:px-6 ${vertente === 'pec' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${vertente === 'pec' ? 'bg-yellow-500' : 'bg-green-500'}`}>
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900" data-testid="text-welcome">
                Professor - {vertenteLabel}
              </h1>
              <p className="text-gray-600" data-testid="text-username">Bem-vindo, {userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={vertente === 'pec' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'bg-green-100 text-green-800 border-green-300'} data-testid="badge-role">
              👨‍🏫 {vertenteLabel}
            </Badge>
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
                <Target className="w-5 h-5 text-yellow-500" />
                Resumo de Atividades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Alunos:</span>
                <span className="font-semibold" data-testid="text-total-alunos">
                  {dashboardData?.totalAlunos || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Turmas Ativas:</span>
                <span className="font-semibold" data-testid="text-turmas-ativas">
                  {dashboardData?.turmasAtivas || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Aulas Ministradas:</span>
                <span className="font-semibold" data-testid="text-aulas-ministradas">
                  {dashboardData?.aulasMinistradas || 0}
                </span>
              </div>
            </CardContent>
          </Card>

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
                  className="w-full" 
                  variant={activeSection === 'alunos' ? 'default' : 'outline'}
                  data-testid="button-ver-alunos"
                  onClick={() => setActiveSection('alunos')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Ver Alunos
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'frequencia' ? 'default' : 'outline'}
                  data-testid="button-chamada"
                  onClick={() => setActiveSection('frequencia')}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Fazer Chamada
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
                  className="w-full" 
                  variant={activeSection === 'planos' ? 'default' : 'outline'}
                  data-testid="button-criar-plano"
                  onClick={() => setActiveSection('planos')}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Meus Planos
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'aulas' ? 'default' : 'outline'}
                  data-testid="button-registro-aulas"
                  onClick={() => setActiveSection('aulas')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Registro de Aulas
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
                  className="w-full" 
                  variant={activeSection === 'turmas' ? 'default' : 'outline'}
                  data-testid="button-minhas-turmas"
                  onClick={() => setActiveSection('turmas')}
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
                  className="w-full" 
                  variant={activeSection === 'relatorios' ? 'default' : 'outline'}
                  data-testid="button-relatorio-frequencia"
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
            Área exclusiva para professores • Sistema RBAC Isolado
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
                <p className="text-gray-600">Visão geral das suas atividades pedagógicas e turmas.</p>
              </CardContent>
            </Card>
          )}

          {activeSection === 'alunos' && vertente === 'inclusao' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-500" />
                  Participantes - Inclusão Produtiva
                </CardTitle>
                <Button 
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => setShowNovoParticipanteModal(true)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Novo Participante
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="Buscar participante por nome..." 
                        className="pl-10"
                        value={buscaParticipante}
                        onChange={(e) => setBuscaParticipante(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {participantesLoading ? (
                    <div className="text-center py-8">Carregando participantes...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Matrícula</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>CPF</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(participantesInclusao || [])
                          .filter((p: any) => !buscaParticipante || (p.nome || p.nomeCompleto || '')?.toLowerCase().includes(buscaParticipante.toLowerCase()))
                          .map((participante: any) => (
                            <TableRow key={participante.id}>
                              <TableCell className="font-mono text-green-600">{participante.codigoMatricula || participante.codigo_matricula || '-'}</TableCell>
                              <TableCell className="font-medium">{participante.nome || participante.nomeCompleto}</TableCell>
                              <TableCell>{participante.cpf}</TableCell>
                              <TableCell>
                                <Badge className={participante.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                  {participante.status || 'ativo'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedParticipante(participante);
                                      setShowViewParticipanteModal(true);
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedParticipante(participante);
                                      setShowEditParticipanteModal(true);
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        {(!participantesInclusao || participantesInclusao.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                              Nenhum participante cadastrado. Clique em "Novo Participante" para começar.
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
          
          {activeSection === 'alunos' && vertente === 'pec' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gestão de Alunos - PEC</CardTitle>
                <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Aluno
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Gestão de alunos PEC em desenvolvimento.</p>
                  <p className="text-sm">Use a tela do Monitor PEC para cadastrar alunos.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'frequencia' && (
            <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Controle de Frequência</CardTitle>
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
                        <label className="block text-sm font-medium mb-2">Data da Aula</label>
                        <Input 
                          type="date" 
                          value={chamadaData}
                          onChange={(e) => setChamadaData(e.target.value)}
                        />
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium mb-2">Turma</label>
                        <Select value={chamadaTurmaId} onValueChange={setChamadaTurmaId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a turma" />
                          </SelectTrigger>
                          <SelectContent>
                            {(minhasTurmas || []).filter((t: any) => t.status !== 'inativo').map((turma: any) => (
                              <SelectItem key={turma.id} value={turma.id.toString()}>
                                {(turma.nome || turma.title)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => saveChamadaMutation.mutate()}
                        disabled={!chamadaTurmaId || presencas.length === 0 || saveChamadaMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {saveChamadaMutation.isPending ? 'Salvando...' : 'Finalizar Chamada'}
                      </Button>
                    </div>
                    
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
                            {presencas.map((aluno, index) => (
                              <div key={aluno.participanteId} className="flex items-center justify-between p-3 border rounded">
                                <div className="flex items-center gap-3">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span>{aluno.nome}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                      type="radio" 
                                      name={`presenca-${aluno.participanteId}`}
                                      checked={aluno.presente}
                                      onChange={() => {
                                        const updated = [...presencas];
                                        updated[index].presente = true;
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
                                        updated[index].presente = false;
                                        setPresencas(updated);
                                      }}
                                      className="w-4 h-4 text-red-600"
                                    />
                                    <span className="text-sm text-red-600">Falta</span>
                                  </label>
                                </div>
                              </div>
                            ))}
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
                    <h3 className="font-semibold">Histórico de Chamadas</h3>
                    
                    {/* Filtros de pesquisa */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label className="text-sm font-medium">Turma</Label>
                        <Select value={historicoFiltroTurma} onValueChange={setHistoricoFiltroTurma}>
                          <SelectTrigger>
                            <SelectValue placeholder="Todas as turmas" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todas">Todas as turmas</SelectItem>
                            {minhasTurmas.map((turma: any) => (
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
                          // Parsear dados da descrição (formato: "Presentes: X/Y. Dados: [...]")
                          const descMatch = registro.descricao?.match(/Presentes: (\d+)\/(\d+)/);
                          const presentes = descMatch ? parseInt(descMatch[1]) : (registro.participantes || 0);
                          const total = descMatch ? parseInt(descMatch[2]) : presentes;
                          const dataAtividade = registro.dataAtividade || registro.data;
                          return (
                            <div key={registro.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">{registro.turmaNome}</h4>
                                  <p className="text-sm text-gray-500">
                                    {dataAtividade ? formatDateBrazil(dataAtividade) : 'Data não disponível'}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <Badge className="bg-green-100 text-green-800">
                                    {presentes}/{total} presentes
                                  </Badge>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {total > 0 ? Math.round((presentes / total) * 100) : 0}% frequência
                                  </p>
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
                    {meusPlanos.map((plano: any) => (
                      <div key={plano.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{plano.titulo}</h3>
                          <Badge variant={plano.status === 'aprovado' || plano.status === 'aplicado' ? 'default' : 'secondary'}>
                            {plano.status === 'rascunho' ? 'Rascunho' : plano.status === 'aprovado' ? 'Aprovado' : 'Aplicado'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Turma:</strong> {plano.turmaNome || 'N/A'}</p>
                          <p><strong>Data:</strong> {formatDateBrazil(plano.data)}</p>
                          {plano.duracaoMinutos && <p><strong>Duração:</strong> {plano.duracaoMinutos} minutos</p>}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" onClick={() => handleEditPlano(plano)}>
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleViewPlano(plano)}>
                            <FileText className="w-4 h-4 mr-1" />
                            Visualizar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDeletePlano(plano)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === 'aulas' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Registro de Aulas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Registrar Nova Aula</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Data da Aula</label>
                        <Input 
                          type="date" 
                          value={registroAulaForm.data}
                          onChange={(e) => setRegistroAulaForm({...registroAulaForm, data: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Turma *</label>
                        <Select 
                          value={registroAulaForm.turmaId}
                          onValueChange={(v) => {
                            setRegistroAulaForm({...registroAulaForm, turmaId: v, planoId: ''});
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
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Plano de Aula (opcional)</label>
                        <Select 
                          value={registroAulaForm.planoId}
                          onValueChange={(v) => {
                            setRegistroAulaForm({...registroAulaForm, planoId: v});
                            const planoSelecionado = meusPlanos.find((p: any) => p.id.toString() === v);
                            if (planoSelecionado) {
                              setRegistroAulaForm(prev => ({
                                ...prev,
                                planoId: v,
                                conteudo: planoSelecionado.conteudo || ''
                              }));
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um plano (opcional)" />
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
                      <div>
                        <label className="block text-sm font-medium mb-2">Filtrar chamadas por data</label>
                        <Input 
                          type="date"
                          value={filtroChamadaData}
                          onChange={(e) => setFiltroChamadaData(e.target.value)}
                          placeholder="Filtrar por data"
                        />
                      </div>
                      <div>
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
                                // Extrair presentes/total da descrição
                                const match = chamada.descricao?.match(/Presentes: (\d+)\/(\d+)/);
                                const presentes = match ? match[1] : '0';
                                const total = match ? match[2] : '0';
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
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Conteúdo Ministrado</label>
                        <Textarea 
                          placeholder="Descreva o conteúdo abordado na aula..." 
                          rows={3}
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
                  
                  <div>
                    <h3 className="font-semibold mb-4">Aulas Registradas</h3>
                    <div className="space-y-3">
                      {registrosAulas.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">Nenhuma aula registrada ainda</p>
                      ) : (
                        registrosAulas.map((aula: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                <span className="font-medium">
                                  {formatDateBrazil(aula.data)} - {aula.turmaNome || 'Turma'}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                {aula.planoTitulo && (
                                  <Badge className="bg-purple-100 text-purple-800">
                                    Plano: {aula.planoTitulo}
                                  </Badge>
                                )}
                                {aula.chamadaInfo && (
                                  <Badge className="bg-green-100 text-green-800">
                                    Chamada: {aula.chamadaInfo}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-gray-600 mb-2">{aula.conteudo || 'Sem conteúdo registrado'}</p>
                            {aula.observacoes && (
                              <p className="text-gray-500 text-sm italic">{aula.observacoes}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'turmas' && (
            <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Minhas Turmas</CardTitle>
                <Button className="bg-green-500 hover:bg-green-600" onClick={() => setShowNovaTurmaModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Turma
                </Button>
              </CardHeader>
              <CardContent>
                {turmasLoading ? (
                  <div className="text-center py-8 text-gray-500">Carregando turmas...</div>
                ) : minhasTurmas.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-4">Você ainda não criou nenhuma turma</p>
                    <Button className="bg-green-500 hover:bg-green-600" onClick={() => setShowNovaTurmaModal(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeira Turma
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {minhasTurmas.filter((turma: any) => turma.status !== 'inativo').map((turma: any) => (
                      <div key={turma.id} className="border rounded-lg p-4 border-green-200">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">{(turma.nome || turma.title)}</h3>
                          <Badge className="bg-green-100 text-green-800">
                            Ativa
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Horário:</span>
                            <p className="font-medium">{turma.horarioEntrada || '-'} - {turma.horarioSaida || '-'}</p>
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
                        <div className="flex gap-2 mt-4 flex-wrap">
                          <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-50" onClick={() => {
                            setSelectedTurma(turma);
                            setBuscaAlunoTurma('');
                            setShowGerenciarAlunosModal(true);
                          }}>
                            <UserPlus className="w-4 h-4 mr-1" />
                            Gerenciar Alunos
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            setSelectedTurma(turma);
                            setNovaTurmaForm({
                              nome: turma.nome || turma.title || '',
                              descricao: turma.descricao || '',
                              horarioEntrada: turma.horarioEntrada || '',
                              horarioSaida: turma.horarioSaida || '',
                              local: turma.local || ''
                            });
                            setShowEditTurmaModal(true);
                          }}>
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button size="sm" variant="outline" className="text-orange-600 hover:bg-orange-50" onClick={() => {
                            if (confirm(`Tem certeza que deseja inativar a turma "${(turma.nome || turma.title)}"?`)) {
                              inativarTurmaMutation.mutate(turma.id);
                            }
                          }}>
                            <XCircle className="w-4 h-4 mr-1" />
                            Inativar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Turmas Inativas */}
            {minhasTurmas.filter((turma: any) => turma.status === 'inativo').length > 0 && (
              <Card className="mt-4 border-gray-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-gray-600">Turmas Inativas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {minhasTurmas.filter((turma: any) => turma.status === 'inativo').map((turma: any) => (
                      <div key={turma.id} className="border rounded-lg p-4 border-gray-300 bg-gray-50 opacity-75">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-600">{(turma.nome || turma.title)}</h3>
                          <Badge className="bg-red-100 text-red-800">
                            Inativa
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Horário:</span>
                            <p className="font-medium text-gray-600">{turma.horarioEntrada || '-'} - {turma.horarioSaida || '-'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Alunos:</span>
                            <p className="font-medium text-gray-600">{turma.alunosCount || 0}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Local:</span>
                            <p className="font-medium text-gray-600">{turma.local || '-'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50" onClick={() => {
                            if (confirm(`Deseja reativar a turma "${(turma.nome || turma.title)}"?`)) {
                              reativarTurmaMutation.mutate(turma.id);
                            }
                          }}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Reativar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            </>
          )}

          {/* Modal Nova Turma */}
          <Dialog open={showNovaTurmaModal} onOpenChange={setShowNovaTurmaModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Turma</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome da Turma *</label>
                  <Input
                    placeholder="Ex: Turma de Costura - Manhã"
                    value={novaTurmaForm.nome}
                    onChange={(e) => setNovaTurmaForm(prev => ({ ...prev, nome: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    placeholder="Descreva a turma..."
                    value={novaTurmaForm.descricao}
                    onChange={(e) => setNovaTurmaForm(prev => ({ ...prev, descricao: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Horário Entrada</label>
                    <Input
                      type="time"
                      value={novaTurmaForm.horarioEntrada}
                      onChange={(e) => setNovaTurmaForm(prev => ({ ...prev, horarioEntrada: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Horário Saída</label>
                    <Input
                      type="time"
                      value={novaTurmaForm.horarioSaida}
                      onChange={(e) => setNovaTurmaForm(prev => ({ ...prev, horarioSaida: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Local</label>
                  <Input
                    placeholder="Ex: Sala 1, Oficina A"
                    value={novaTurmaForm.local}
                    onChange={(e) => setNovaTurmaForm(prev => ({ ...prev, local: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowNovaTurmaModal(false)}>Cancelar</Button>
                  <Button 
                    className="bg-green-500 hover:bg-green-600"
                    disabled={!novaTurmaForm.nome || createTurmaMutation.isPending}
                    onClick={() => createTurmaMutation.mutate(novaTurmaForm)}
                  >
                    {createTurmaMutation.isPending ? 'Criando...' : 'Criar Turma'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal Editar Turma */}
          <Dialog open={showEditTurmaModal} onOpenChange={setShowEditTurmaModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Turma</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome da Turma *</label>
                  <Input
                    placeholder="Ex: Turma de Costura - Manhã"
                    value={novaTurmaForm.nome}
                    onChange={(e) => setNovaTurmaForm(prev => ({ ...prev, nome: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    placeholder="Descreva a turma..."
                    value={novaTurmaForm.descricao}
                    onChange={(e) => setNovaTurmaForm(prev => ({ ...prev, descricao: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Horário Entrada</label>
                    <Input
                      type="time"
                      value={novaTurmaForm.horarioEntrada}
                      onChange={(e) => setNovaTurmaForm(prev => ({ ...prev, horarioEntrada: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Horário Saída</label>
                    <Input
                      type="time"
                      value={novaTurmaForm.horarioSaida}
                      onChange={(e) => setNovaTurmaForm(prev => ({ ...prev, horarioSaida: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Local</label>
                  <Input
                    placeholder="Ex: Sala 1, Oficina A"
                    value={novaTurmaForm.local}
                    onChange={(e) => setNovaTurmaForm(prev => ({ ...prev, local: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => { setShowEditTurmaModal(false); setSelectedTurma(null); }}>Cancelar</Button>
                  <Button 
                    className="bg-green-500 hover:bg-green-600"
                    disabled={!novaTurmaForm.nome || updateTurmaMutation.isPending}
                    onClick={() => updateTurmaMutation.mutate({ turmaId: selectedTurma.id, data: novaTurmaForm })}
                  >
                    {updateTurmaMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal Gerenciar Alunos da Turma */}
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
                      {alunosDaTurma.map((aluno: any) => (
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
                              <p className="font-medium text-sm">{participante.nome}</p>
                              <p className="text-xs text-gray-500">{participante.codigoMatricula || participante.cpf}</p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            className="bg-green-500 hover:bg-green-600"
                            disabled={addAlunoTurmaMutation.isPending}
                            onClick={() => addAlunoTurmaMutation.mutate({ turmaId: selectedTurma.id, participanteId: participante.id })}
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
                        
                        return (
                          <div 
                            key={i} 
                            className={`p-2 border rounded min-h-[60px] cursor-pointer transition-colors ${
                              isHoje ? 'bg-blue-100 border-blue-400' :
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
                    <div className="flex gap-4 text-sm text-gray-600 justify-center border-t pt-4">
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

          {activeSection === 'acompanhamento' && (() => {
            // Filtrar alunos baseado na busca
            const alunosFiltrados = participantesInclusao.filter((p: any) => {
              const matchBusca = !buscaAlunoAcomp || 
                (p.nome || p.nomeCompleto || '').toLowerCase().includes(buscaAlunoAcomp.toLowerCase());
              return matchBusca;
            });
            
            return (
            <Card>
              <CardHeader>
                <CardTitle>Acompanhamento Pedagógico</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-2">Buscar Aluno</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          placeholder="Nome do aluno..." 
                          className="pl-10"
                          value={buscaAlunoAcomp}
                          onChange={(e) => setBuscaAlunoAcomp(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-2">Turma</label>
                      <Select value={filtroTurmaAcomp} onValueChange={setFiltroTurmaAcomp}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todas as turmas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todas">Todas as turmas</SelectItem>
                          {minhasTurmas.map((turma: any) => (
                            <SelectItem key={turma.id} value={turma.id.toString()}>{(turma.nome || turma.title)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-4">Alunos ({alunosFiltrados.length})</h3>
                    {alunosFiltrados.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Nenhum aluno encontrado</p>
                    ) : (
                      <div className="space-y-3">
                        {alunosFiltrados.slice(0, 20).map((aluno: any) => (
                          <div key={aluno.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-500" />
                                <h4 className="font-semibold">{aluno.nome || aluno.nomeCompleto}</h4>
                              </div>
                              <Badge variant="outline">{aluno.turma || 'Sem turma'}</Badge>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">Anotações</label>
                              <Textarea 
                                placeholder="Escreva observações sobre o aluno..."
                                rows={2}
                                value={anotacoesAlunos[aluno.id] || ''}
                                onChange={(e) => setAnotacoesAlunos({...anotacoesAlunos, [aluno.id]: e.target.value})}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {alunosFiltrados.length > 20 && (
                      <p className="text-sm text-gray-500 text-center mt-2">
                        Mostrando 20 de {alunosFiltrados.length} alunos. Use a busca para filtrar.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })()}

          {activeSection === 'configuracoes' && (
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
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
                        <Input defaultValue="Pedro Silva" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <Input defaultValue="pedro.silva@institutoogrito.org" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Telefone</label>
                        <Input defaultValue="(31) 98765-4321" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Especialização</label>
                        <Input defaultValue="Matemática e Ciências" />
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

      {/* Modal de Novo Participante - Inclusão */}
      {showNovoParticipanteModal && vertente === 'inclusao' && (
        <ComprehensiveStudentForm 
          open={showNovoParticipanteModal}
          onClose={() => {
            setShowNovoParticipanteModal(false);
            refetchParticipantes();
          }}
          mode="inclusao"
        />
      )}

      {/* Modal de Editar Participante - Inclusão */}
      {showEditParticipanteModal && selectedParticipante && vertente === 'inclusao' && (
        <ComprehensiveStudentForm 
          open={showEditParticipanteModal}
          onClose={() => {
            setShowEditParticipanteModal(false);
            setSelectedParticipante(null);
            refetchParticipantes();
          }}
          editId={selectedParticipante.id}
          mode="inclusao"
        />
      )}

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
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => {
                  setShowViewParticipanteModal(false);
                  setShowEditParticipanteModal(true);
                }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>
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
                <Input type="date" value={planoForm.data} onChange={(e) => setPlanoForm({...planoForm, data: e.target.value})} />
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
              <Label>Metodologia *</Label>
              <Textarea value={planoForm.metodologia} onChange={(e) => setPlanoForm({...planoForm, metodologia: e.target.value})} placeholder="Como será conduzida a aula?" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Recursos</Label>
                <Input value={planoForm.recursos} onChange={(e) => setPlanoForm({...planoForm, recursos: e.target.value})} placeholder="Materiais necessários" />
              </div>
              <div>
                <Label>Duração (minutos)</Label>
                <Input type="number" value={planoForm.duracaoMinutos} onChange={(e) => setPlanoForm({...planoForm, duracaoMinutos: e.target.value})} placeholder="Ex: 60" />
              </div>
            </div>
            <div>
              <Label>Avaliação</Label>
              <Textarea value={planoForm.avaliacao} onChange={(e) => setPlanoForm({...planoForm, avaliacao: e.target.value})} placeholder="Como será avaliado o aprendizado?" rows={2} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={planoForm.status} onValueChange={(v) => setPlanoForm({...planoForm, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="aplicado">Aplicado</SelectItem>
                </SelectContent>
              </Select>
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
                <Input type="date" value={planoForm.data} onChange={(e) => setPlanoForm({...planoForm, data: e.target.value})} />
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Recursos</Label>
                <Input value={planoForm.recursos} onChange={(e) => setPlanoForm({...planoForm, recursos: e.target.value})} />
              </div>
              <div>
                <Label>Duração (minutos)</Label>
                <Input type="number" value={planoForm.duracaoMinutos} onChange={(e) => setPlanoForm({...planoForm, duracaoMinutos: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Avaliação</Label>
              <Textarea value={planoForm.avaliacao} onChange={(e) => setPlanoForm({...planoForm, avaliacao: e.target.value})} rows={2} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={planoForm.status} onValueChange={(v) => setPlanoForm({...planoForm, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="aplicado">Aplicado</SelectItem>
                </SelectContent>
              </Select>
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
                <div>
                  <Label className="text-gray-500">Status</Label>
                  <Badge variant={selectedPlano.status === 'aprovado' ? 'default' : 'secondary'}>
                    {selectedPlano.status === 'rascunho' ? 'Rascunho' : selectedPlano.status === 'aprovado' ? 'Aprovado' : 'Aplicado'}
                  </Badge>
                </div>
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
                <Button onClick={() => {
                  setShowViewPlanoModal(false);
                  handleEditPlano(selectedPlano);
                }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          )}
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
              const eventosDoDia = [
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
    </div>
  );
}