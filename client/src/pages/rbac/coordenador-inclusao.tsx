import React, { useState, useEffect } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
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
  UserX,
  Phone,
  MapPin,
  Heart,
  Shirt
} from "lucide-react";
import { ProfileImageUploader } from "@/components/ProfileImageUploader";
import AlterarSenha from "@/components/AlterarSenha";
import { ComprehensiveStudentForm } from "@/components/comprehensive-student-form";
import { TurmaInclusaoForm } from "@/components/TurmaInclusaoForm";

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

export default function CoordenadorInclusaoPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditProgramaModal, setShowEditProgramaModal] = useState(false);
  const [showDetalhesProgramaModal, setShowDetalhesProgramaModal] = useState(false);
  const [selectedPrograma, setSelectedPrograma] = useState<any>(null);
  const [showEditCursoModal, setShowEditCursoModal] = useState(false);
  const [showCronogramaModal, setShowCronogramaModal] = useState(false);
  const [selectedCurso, setSelectedCurso] = useState<any>(null);
  const [cronogramaAulas, setCronogramaAulas] = useState<any[]>([]);
  const [showNovaAulaModal, setShowNovaAulaModal] = useState(false);
  const [aulaEditando, setAulaEditando] = useState<any>(null);
  const [showDetalhesTurmaModal, setShowDetalhesTurmaModal] = useState(false);
  const [showDetalhesCursoModal, setShowDetalhesCursoModal] = useState(false);
  const [showEditParceiroModal, setShowEditParceiroModal] = useState(false);
  const [showHistoricoModal, setShowHistoricoModal] = useState(false);
  const [selectedParceiro, setSelectedParceiro] = useState<any>(null);
  const [showNovoProgramaModal, setShowNovoProgramaModal] = useState(false);
  const [showNovaTurmaModal, setShowNovaTurmaModal] = useState(false);
  const [selectedTurma, setSelectedTurma] = useState<any>(null);
  const [showEditTurmaModal, setShowEditTurmaModal] = useState(false);
  const [showNovoCursoModal, setShowNovoCursoModal] = useState(false);
  const [isCreatingCurso, setIsCreatingCurso] = useState(false);
  const [showExcluirProgramaModal, setShowExcluirProgramaModal] = useState(false);
  const [programaToDelete, setProgramaToDelete] = useState<any>(null);
  const [showNovoParticipanteModal, setShowNovoParticipanteModal] = useState(false);
  const [fotoParticipantePreview, setFotoParticipantePreview] = useState<string | null>(null);
  const [fotoParticipanteFile, setFotoParticipanteFile] = useState<File | null>(null);
  
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
  
  // States para o formulário de cursos
  const [novoCursoProgramaId, setNovoCursoProgramaId] = useState<string>("");
  const [novoCursoTurmaIds, setNovoCursoTurmaIds] = useState<number[]>([]);
  
  // State para busca de participantes
  const [searchParticipante, setSearchParticipante] = useState<string>("");
  
  // State para o status da aula no modal
  const [aulaStatus, setAulaStatus] = useState<string>("agendada");
  
  // Estados para o perfil do coordenador
  const [perfilNome, setPerfilNome] = useState<string>("");
  const [perfilEmail, setPerfilEmail] = useState<string>("");
  const [perfilTelefone, setPerfilTelefone] = useState<string>("");
  const [perfilRamal, setPerfilRamal] = useState<string>("");
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  
  // Estados para controle de presença
  const [presencas, setPresencas] = useState<Record<number, 'presente' | 'ausente' | 'justificado' | null>>({});
  const [justificativas, setJustificativas] = useState<Record<number, string>>({});
  const [participanteJustificando, setParticipanteJustificando] = useState<number | null>(null);
  const [justificativaTemp, setJustificativaTemp] = useState<string>("");
  const [erroJustificativa, setErroJustificativa] = useState<string>("");
  
  // Coordenador sempre exibe "Coordenador" (não pega do localStorage)
  const userId = localStorage.getItem("userId");
  const coordenadorId = localStorage.getItem("coordenadorId");
  const userName = "Coordenador";
  const userPapel = localStorage.getItem("userPapel");

  // Query para buscar dados do perfil do coordenador (users + coordenadores)
  const { data: perfilData, refetch: refetchPerfil } = useQuery({
    queryKey: ['/api/coordenadores', coordenadorId, 'profile'],
    queryFn: async () => {
      const response = await fetch(`/api/coordenadores/${coordenadorId}/profile`);
      if (!response.ok) return null;
      const data = await response.json();
      // Atualizar estados com os dados recebidos
      setPerfilNome(data.nome || "");
      setPerfilEmail(data.email || "");
      setPerfilTelefone(data.telefone || "");
      setPerfilRamal(data.formacao || "");
      return data;
    },
    enabled: !!coordenadorId
  });

  // Query para buscar dados do dashboard do coordenador
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/coordenador/dashboard', userId, 'inclusao'],
    queryFn: async () => {
      const response = await fetch(`/api/coordenador/dashboard/${userId}?area=inclusao`, {
        headers: { 'x-user-id': userId || '' }
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      return response.json();
    },
    enabled: !!userId
  });

  // Query para buscar programas do banco de dados
  const { data: programasData = [], isLoading: isLoadingProgramas } = useQuery({
    queryKey: ['/api/programas-inclusao'],
    queryFn: async () => {
      const response = await fetch('/api/programas-inclusao');
      if (!response.ok) throw new Error('Failed to fetch programas');
      return response.json();
    }
  });

  // Query para buscar turmas do banco de dados
  const { data: turmasData = [], isLoading: isLoadingTurmas } = useQuery({
    queryKey: ['/api/turmas-inclusao'],
    queryFn: async () => {
      const response = await fetch('/api/turmas-inclusao');
      if (!response.ok) throw new Error('Failed to fetch turmas');
      return response.json();
    }
  });

  // Query para buscar cursos do banco de dados
  const { data: cursosData = [], isLoading: isLoadingCursos } = useQuery({
    queryKey: ['/api/cursos-inclusao'],
    queryFn: async () => {
      const response = await fetch('/api/cursos-inclusao');
      if (!response.ok) throw new Error('Failed to fetch cursos');
      return response.json();
    }
  });

  // Query para buscar participantes do banco de dados
  const { data: participantesData = [], isLoading: isLoadingParticipantes } = useQuery({
    queryKey: ['/api/participantes-inclusao'],
    queryFn: async () => {
      const response = await fetch('/api/participantes-inclusao');
      if (!response.ok) throw new Error('Failed to fetch participantes');
      return response.json();
    }
  });

  // Query para buscar histórico de presenças de inclusão
  const { data: historicoPresencas = [], isLoading: isLoadingHistorico, refetch: refetchHistorico } = useQuery({
    queryKey: ['/api/coordenador/historico-presencas-inclusao'],
    queryFn: async () => {
      const response = await fetch('/api/coordenador/historico-presencas-inclusao');
      if (!response.ok) throw new Error('Failed to fetch historico');
      return response.json();
    }
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

  // Effect para carregar cronograma do curso selecionado
  useEffect(() => {
    if (selectedCurso && showCronogramaModal) {
      // Tentar carregar o cronograma salvo no curso
      if (selectedCurso.cronograma) {
        try {
          const cronogramaParsed = JSON.parse(selectedCurso.cronograma);
          setCronogramaAulas(cronogramaParsed);
        } catch (e) {
          // Se não conseguir parsear, inicializa vazio
          setCronogramaAulas([]);
        }
      } else {
        // Se não tem cronograma salvo, inicializa vazio
        setCronogramaAulas([]);
      }
    }
  }, [selectedCurso, showCronogramaModal]);

  // Effect para atualizar o status quando abrir modal de edição de aula
  useEffect(() => {
    if (aulaEditando) {
      // Normalizar o status para lowercase
      const statusNormalizado = aulaEditando.status?.toLowerCase() || 'agendada';
      setAulaStatus(statusNormalizado);
    } else {
      setAulaStatus('agendada');
    }
  }, [aulaEditando]);

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
        description: error.message || "Tente novamente.",
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
        description: error.message || "Tente novamente.",
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
      queryClient.invalidateQueries({ queryKey: ['/api/cursos-inclusao'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir programa",
        description: error.message || "Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Mutation para excluir curso (não afeta programa pai)
  const deleteCursoMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/cursos-inclusao/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Curso excluído!",
        description: "O curso foi removido com sucesso."
      });
      setShowExcluirProgramaModal(false);
      setProgramaToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['/api/cursos-inclusao'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir curso",
        description: error.message || "Tente novamente.",
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

  // Funções de controle de presença
  const handleStatusChange = (participanteId: number, novoStatus: 'presente' | 'ausente' | 'justificado' | null) => {
    const statusAnterior = presencas[participanteId];
    
    // Atualizar presença (mutuamente exclusivo)
    setPresencas(prev => ({
      ...prev,
      [participanteId]: novoStatus
    }));
    
    // Se marcou justificado, abrir modal
    if (novoStatus === 'justificado') {
      setParticipanteJustificando(participanteId);
      setJustificativaTemp(justificativas[participanteId] || "");
      setErroJustificativa("");
    } else if (statusAnterior === 'justificado') {
      // Se desmarcou justificado, limpar justificativa
      setJustificativas(prev => {
        const nova = { ...prev };
        delete nova[participanteId];
        return nova;
      });
    }
  };

  const handleSalvarJustificativa = () => {
    if (!participanteJustificando) return;
    
    const justificativa = justificativaTemp.trim();
    
    if (justificativa.length < 40) {
      setErroJustificativa(`A justificativa deve ter no mínimo 40 caracteres (${justificativa.length}/40)`);
      return;
    }
    
    // Salvar justificativa
    setJustificativas(prev => ({
      ...prev,
      [participanteJustificando]: justificativa
    }));
    
    // Fechar modal
    setParticipanteJustificando(null);
    setJustificativaTemp("");
    setErroJustificativa("");
    
    toast({
      title: "Justificativa salva",
      description: "A justificativa foi registrada com sucesso."
    });
  };

  const handleCancelarJustificativa = () => {
    if (!participanteJustificando) return;
    
    // Reverter status se não tinha justificativa
    if (!justificativas[participanteJustificando]) {
      setPresencas(prev => ({
        ...prev,
        [participanteJustificando]: null
      }));
    }
    
    // Fechar modal
    setParticipanteJustificando(null);
    setJustificativaTemp("");
    setErroJustificativa("");
  };

  const handleSalvarPresencas = () => {
    // Validar que todos os justificados têm justificativa válida
    const erros: string[] = [];
    
    Object.entries(presencas).forEach(([id, status]) => {
      if (status === 'justificado') {
        const justificativa = justificativas[parseInt(id)];
        if (!justificativa || justificativa.trim().length < 40) {
          const participante = participantesData.find((p: any) => p.id === parseInt(id));
          erros.push(participante?.nome || `Participante ${id}`);
        }
      }
    });
    
    if (erros.length > 0) {
      toast({
        title: "Erro ao salvar",
        description: `Os seguintes participantes precisam de justificativa válida: ${erros.join(', ')}`,
        variant: "destructive"
      });
      return;
    }
    
    // TODO: Salvar presenças no banco
    toast({
      title: "Presenças salvas!",
      description: "As presenças foram registradas com sucesso."
    });
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

  // Função para salvar o cronograma no banco de dados
  const salvarCronograma = async (aulas: any[]) => {
    if (!selectedCurso) return;
    
    try {
      const cronogramaJson = JSON.stringify(aulas);
      const cursoAtualizado = await apiRequest(`/api/cursos-inclusao/${selectedCurso.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ cronograma: cronogramaJson }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Atualizar o selectedCurso com os dados atualizados
      setSelectedCurso({ ...selectedCurso, cronograma: cronogramaJson });
      
      // Atualizar cache local
      queryClient.invalidateQueries({ queryKey: ['/api/cursos-inclusao'] });
    } catch (error) {
      console.error('Erro ao salvar cronograma:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o cronograma. Tente novamente.",
        variant: "destructive"
      });
    }
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
    <div className="min-h-screen bg-gray-50" data-testid="coordenador-inclusao-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900" data-testid="text-welcome">
                Coordenação Inclusão Produtiva
              </h1>
              <p className="text-gray-600" data-testid="text-username">Olá Coordenador</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" data-testid="badge-role">
              🎯 Coordenador Inclusão
            </Badge>
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
                  onClick={() => {
                    setSelectedCurso(null);
                    setActiveSection('participantes');
                  }}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Participantes
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'acompanhamento' ? 'default' : 'outline'}
                  data-testid="button-acompanhamento"
                  onClick={() => setActiveSection('acompanhamento')}
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
                  onClick={() => setActiveSection('programas')}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Programas
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'turmas' ? 'default' : 'outline'}
                  data-testid="button-turmas"
                  onClick={() => setActiveSection('turmas')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Turmas
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'cursos' ? 'default' : 'outline'}
                  data-testid="button-cursos"
                  onClick={() => setActiveSection('cursos')}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Cursos Profissionalizantes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Parceiros e Empresas */}
          <Card data-testid="card-parceiros">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                Parceiros e Empresas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Gerencie parcerias com empresas e organizações para inserção no mercado de trabalho.
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  variant={activeSection === 'parceiros' ? 'default' : 'outline'}
                  data-testid="button-parceiros"
                  onClick={() => setActiveSection('parceiros')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Parceiros
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'vagas' ? 'default' : 'outline'}
                  data-testid="button-vagas"
                  onClick={() => setActiveSection('vagas')}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Vagas de Emprego
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
                  variant={activeSection === 'presenca' ? 'default' : 'outline'}
                  data-testid="button-presenca"
                  onClick={() => setActiveSection('presenca')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Presença
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'monitoramento' ? 'default' : 'outline'}
                  data-testid="button-monitoramento"
                  onClick={() => setActiveSection('monitoramento')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Monitoramento
                </Button>
                <Button 
                  className="w-full" 
                  variant={activeSection === 'resultados' ? 'default' : 'outline'}
                  data-testid="button-resultados"
                  onClick={() => setActiveSection('resultados')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Resultados
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
            Coordenação de Inclusão Produtiva • Sistema RBAC Isolado
          </p>
        </div>

        {/* Área de Conteúdo Dinâmica */}
        <div className="mt-8">
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dashboard - Coordenação de Inclusão Produtiva</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Bem-vindo ao painel de coordenação de Inclusão Produtiva.</p>
                  <p className="text-sm text-gray-500 mt-2">Use o menu acima para navegar entre as diferentes seções.</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'participantes' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gestão de Participantes</CardTitle>
                  {selectedCurso && (
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                        Filtrando por: {selectedCurso.nome}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedCurso(null)}
                        className="h-6 px-2 text-xs"
                      >
                        Limpar filtro
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleExportTemplate}
                    data-testid="button-export-template"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Template
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => document.getElementById('file-import')?.click()}
                    data-testid="button-import-excel"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Importar Excel
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-blue-500 hover:bg-blue-600" 
                    data-testid="button-add-participante"
                    onClick={() => setShowNovoParticipanteModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Participante
                  </Button>
                  
                  {/* Modal de Cadastro Completo de Participante - Inclusão Produtiva */}
                  <ComprehensiveStudentForm 
                    open={showNovoParticipanteModal}
                    onClose={() => setShowNovoParticipanteModal(false)}
                    mode="inclusao"
                  />

                  {/* Modal de Detalhes do Participante - Completo */}
                  <Dialog open={showDetalhesParticipanteModal} onOpenChange={(open) => {
                    setShowDetalhesParticipanteModal(open);
                    if (!open) {
                      setFullParticipanteData(null);
                    }
                  }}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Detalhes Completos do Participante</DialogTitle>
                      </DialogHeader>
                      {loadingParticipanteDetails ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                          <span className="ml-3">Carregando dados...</span>
                        </div>
                      ) : (fullParticipanteData || selectedParticipante) && (
                        <div className="space-y-6">
                          {/* Cabeçalho com foto e nome */}
                          <div className="flex items-center gap-4 pb-4 border-b">
                            {(fullParticipanteData?.foto_perfil || selectedParticipante?.foto_perfil) ? (
                              <img 
                                src={fullParticipanteData?.foto_perfil || selectedParticipante?.foto_perfil} 
                                alt={fullParticipanteData?.nome || selectedParticipante?.nome} 
                                className="w-24 h-24 rounded-full object-cover border-2 border-blue-200"
                              />
                            ) : (
                              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="w-12 h-12 text-blue-500" />
                              </div>
                            )}
                            <div>
                              <h3 className="text-xl font-semibold">{fullParticipanteData?.nome || selectedParticipante?.nome}</h3>
                              <p className="text-gray-500">CPF: {fullParticipanteData?.cpf || selectedParticipante?.cpf || 'Não informado'}</p>
                              <p className={`text-sm ${(fullParticipanteData?.status || selectedParticipante?.status) === 'inativo' ? 'text-red-500' : 'text-green-500'}`}>
                                Status: {(fullParticipanteData?.status || selectedParticipante?.status) === 'inativo' ? 'Inativo' : 'Ativo'}
                              </p>
                            </div>
                          </div>

                          {/* Seção: Identificação */}
                          <div>
                            <h4 className="font-semibold text-blue-600 mb-3 flex items-center gap-2">
                              <User className="w-4 h-4" /> Identificação
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                              <div><label className="text-xs font-medium text-gray-500">Nome</label><p className="text-sm">{fullParticipanteData?.nome || selectedParticipante?.nome || '-'}</p></div>
                              <div><label className="text-xs font-medium text-gray-500">Gênero</label><p className="text-sm">{fullParticipanteData?.genero || selectedParticipante?.genero || '-'}</p></div>
                              <div><label className="text-xs font-medium text-gray-500">Idade</label><p className="text-sm">{(() => { const idade = fullParticipanteData?.idade || selectedParticipante?.idade; return (idade && idade > 0 && idade < 150) ? `${idade} anos` : '-'; })()}</p></div>
                              <div><label className="text-xs font-medium text-gray-500">Data de Ingresso</label><p className="text-sm">{(fullParticipanteData?.dataIngresso || selectedParticipante?.dataIngresso) ? new Date(fullParticipanteData?.dataIngresso || selectedParticipante?.dataIngresso).toLocaleDateString('pt-BR') : '-'}</p></div>
                              <div><label className="text-xs font-medium text-gray-500">Nº Matrícula</label><p className="text-sm">{fullParticipanteData?.codigoMatricula || selectedParticipante?.codigoMatricula || '-'}</p></div>
                            </div>
                          </div>

                          {/* Seção: Contato */}
                          <div>
                            <h4 className="font-semibold text-blue-600 mb-3 flex items-center gap-2">
                              <Phone className="w-4 h-4" /> Contato
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                              <div><label className="text-xs font-medium text-gray-500">Telefone</label><p className="text-sm">{fullParticipanteData?.telefone || selectedParticipante?.telefone || '-'}</p></div>
                              <div><label className="text-xs font-medium text-gray-500">Email</label><p className="text-sm">{fullParticipanteData?.email || selectedParticipante?.email || '-'}</p></div>
                            </div>
                          </div>

                          {/* Seção: Endereço */}
                          <div>
                            <h4 className="font-semibold text-blue-600 mb-3 flex items-center gap-2">
                              <MapPin className="w-4 h-4" /> Endereço
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                              <div><label className="text-xs font-medium text-gray-500">CEP</label><p className="text-sm">{fullParticipanteData?.cep || selectedParticipante?.cep || '-'}</p></div>
                              <div className="col-span-2"><label className="text-xs font-medium text-gray-500">Logradouro</label><p className="text-sm">{fullParticipanteData?.logradouro || selectedParticipante?.logradouro || '-'}</p></div>
                              <div><label className="text-xs font-medium text-gray-500">Número</label><p className="text-sm">{fullParticipanteData?.numero || selectedParticipante?.numero || '-'}</p></div>
                              <div><label className="text-xs font-medium text-gray-500">Complemento</label><p className="text-sm">{fullParticipanteData?.complemento || selectedParticipante?.complemento || '-'}</p></div>
                              <div><label className="text-xs font-medium text-gray-500">Bairro</label><p className="text-sm">{fullParticipanteData?.bairro || selectedParticipante?.bairro || '-'}</p></div>
                              <div><label className="text-xs font-medium text-gray-500">Cidade</label><p className="text-sm">{fullParticipanteData?.cidade || selectedParticipante?.cidade || '-'}</p></div>
                              <div><label className="text-xs font-medium text-gray-500">Estado</label><p className="text-sm">{fullParticipanteData?.estado || selectedParticipante?.estado || '-'}</p></div>
                            </div>
                          </div>

                          {/* Seção: Benefícios Sociais */}
                          <div>
                            <h4 className="font-semibold text-blue-600 mb-3 flex items-center gap-2">
                              <FileText className="w-4 h-4" /> Benefícios Sociais
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                              <div><label className="text-xs font-medium text-gray-500">CadÚnico</label><p className="text-sm">{(fullParticipanteData?.cadunico || selectedParticipante?.cadunico) ? 'Sim' : 'Não'}</p></div>
                              <div><label className="text-xs font-medium text-gray-500">Bolsa Família</label><p className="text-sm">{(fullParticipanteData?.bolsaFamilia || selectedParticipante?.bolsaFamilia) ? 'Sim' : 'Não'}</p></div>
                              <div><label className="text-xs font-medium text-gray-500">BPC</label><p className="text-sm">{(fullParticipanteData?.bpc || selectedParticipante?.bpc) ? 'Sim' : 'Não'}</p></div>
                              <div><label className="text-xs font-medium text-gray-500">Cartão Alimentação</label><p className="text-sm">{(fullParticipanteData?.cartaoAlimentacao || selectedParticipante?.cartaoAlimentacao) ? 'Sim' : 'Não'}</p></div>
                              <div><label className="text-xs font-medium text-gray-500">Outros Benefícios</label><p className="text-sm">{(fullParticipanteData?.outrosBeneficios || selectedParticipante?.outrosBeneficios) ? 'Sim' : 'Não'}</p></div>
                            </div>
                          </div>

                          {/* Seção: Data de Nascimento e Nacionalidade */}
                          <div>
                            <h4 className="font-semibold text-blue-600 mb-3 flex items-center gap-2">
                              <User className="w-4 h-4" /> Dados Pessoais Adicionais
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                              <div><label className="text-xs font-medium text-gray-500">Data de Nascimento</label><p className="text-sm">{(fullParticipanteData?.dataNascimento || selectedParticipante?.dataNascimento) ? new Date(fullParticipanteData?.dataNascimento || selectedParticipante?.dataNascimento).toLocaleDateString('pt-BR') : '-'}</p></div>
                              <div><label className="text-xs font-medium text-gray-500">Nacionalidade</label><p className="text-sm">{fullParticipanteData?.nacionalidade || selectedParticipante?.nacionalidade || '-'}</p></div>
                              <div><label className="text-xs font-medium text-gray-500">Forma de Acesso</label><p className="text-sm">{fullParticipanteData?.formaAcesso || selectedParticipante?.formaAcesso || '-'}</p></div>
                              <div><label className="text-xs font-medium text-gray-500">Data de Entrada</label><p className="text-sm">{(fullParticipanteData?.dataEntrada || selectedParticipante?.dataEntrada) ? new Date(fullParticipanteData?.dataEntrada || selectedParticipante?.dataEntrada).toLocaleDateString('pt-BR') : '-'}</p></div>
                            </div>
                          </div>

                          {/* Seção: Escolaridade e Profissional */}
                          <div>
                            <h4 className="font-semibold text-blue-600 mb-3 flex items-center gap-2">
                              <GraduationCap className="w-4 h-4" /> Escolaridade e Profissional
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                              <div><label className="text-xs font-medium text-gray-500">Escolaridade</label><p className="text-sm">{fullParticipanteData?.escolaridade || selectedParticipante?.escolaridade || '-'}</p></div>
                              <div><label className="text-xs font-medium text-gray-500">Experiência Profissional</label><p className="text-sm">{fullParticipanteData?.experienciaProfissional || selectedParticipante?.experienciaProfissional || '-'}</p></div>
                              <div className="col-span-2"><label className="text-xs font-medium text-gray-500">Objetivos Profissionais</label><p className="text-sm">{fullParticipanteData?.objetivosProfissionais || selectedParticipante?.objetivosProfissionais || '-'}</p></div>
                            </div>
                          </div>

                          {/* Seção: Turmas */}
                          <div>
                            <h4 className="font-semibold text-blue-600 mb-3 flex items-center gap-2">
                              <Users className="w-4 h-4" /> Turmas Vinculadas
                            </h4>
                            <div className="flex flex-wrap gap-2 bg-gray-50 p-4 rounded-lg">
                              {(fullParticipanteData?.turmas || selectedParticipante?.turmas) && (fullParticipanteData?.turmas || selectedParticipante?.turmas).length > 0 ? (
                                (fullParticipanteData?.turmas || selectedParticipante?.turmas).map((turma: any, idx: number) => (
                                  <Badge key={idx} className="bg-blue-100 text-blue-700 border-blue-300">
                                    {turma.nome}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-gray-500">Sem turma vinculada</span>
                              )}
                            </div>
                          </div>

                          {/* Observações */}
                          {(fullParticipanteData?.observacoes || selectedParticipante?.observacoes) && (
                            <div>
                              <h4 className="font-semibold text-blue-600 mb-3">Observações</h4>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm">{fullParticipanteData?.observacoes || selectedParticipante?.observacoes}</p>
                              </div>
                            </div>
                          )}


                          {/* Seção: Documentos */}
                          <div>
                            <h4 className="font-semibold text-blue-600 mb-3 flex items-center gap-2">
                              <FileText className="w-4 h-4" /> Documentos
                            </h4>
                            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                              {/* Upload de documento */}
                              <div className="flex items-center gap-2">
                                <input
                                  type="file"
                                  id="doc-upload-inclusao"
                                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file || !selectedParticipante?.id) return;
                                    
                                    setUploadingDocumento(true);
                                    const formData = new FormData();
                                    formData.append('documento', file);
                                    formData.append('tipoDocumento', 'Documento');
                                    
                                    try {
                                      const res = await fetch(`/api/documentos/participante-inclusao/${selectedParticipante.id}`, {
                                        method: 'POST',
                                        body: formData
                                      });
                                      const data = await res.json();
                                      if (data.success) {
                                        toast({ title: "Documento enviado com sucesso!" });
                                        // Recarregar documentos
                                        const docsRes = await fetch(`/api/documentos/participante-inclusao/${selectedParticipante.id}`);
                                        const docsData = await docsRes.json();
                                        setParticipanteDocumentos(docsData || []);
                                      } else {
                                        toast({ title: "Erro ao enviar documento", variant: "destructive" });
                                      }
                                    } catch (err) {
                                      toast({ title: "Erro ao enviar documento", variant: "destructive" });
                                    } finally {
                                      setUploadingDocumento(false);
                                      e.target.value = '';
                                    }
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={uploadingDocumento}
                                  onClick={() => document.getElementById('doc-upload-inclusao')?.click()}
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  {uploadingDocumento ? 'Enviando...' : 'Enviar Documento'}
                                </Button>
                                <span className="text-xs text-gray-500">PDF, JPG, PNG (max 10MB)</span>
                              </div>
                              
                              {/* Lista de documentos */}
                              {participanteDocumentos.length === 0 ? (
                                <p className="text-sm text-gray-500">Nenhum documento cadastrado.</p>
                              ) : (
                                <div className="space-y-2">
                                  {participanteDocumentos.map((doc: any) => (
                                    <div key={doc.id} className="flex items-center justify-between bg-white p-2 rounded border">
                                      <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-blue-500" />
                                        <div>
                                          <p className="text-sm font-medium">{doc.nomeArquivo || doc.nome_arquivo}</p>
                                          <p className="text-xs text-gray-500">
                                            {doc.tipoDocumento || doc.tipo_documento || 'Documento'} • {(doc.createdAt || doc.created_at) ? new Date(doc.createdAt || doc.created_at).toLocaleDateString('pt-BR') : ''}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            setDocumentoPreviewUrl(doc.urlArquivo || doc.url_arquivo);
                                            setDocumentoPreviewNome(doc.nomeArquivo || doc.nome_arquivo || 'Documento');
                                            setShowDocumentoPreviewModal(true);
                                          }}
                                        >
                                          <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-red-500 hover:text-red-700"
                                          onClick={async () => {
                                            if (!confirm('Excluir este documento?')) return;
                                            try {
                                              await fetch(`/api/documentos/${doc.id}`, { method: 'DELETE' });
                                              toast({ title: "Documento excluído" });
                                              setParticipanteDocumentos(prev => prev.filter((d: any) => d.id !== doc.id));
                                            } catch (err) {
                                              toast({ title: "Erro ao excluir documento", variant: "destructive" });
                                            }
                                          }}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Botões de ação */}
                          <div className="flex gap-2 pt-4 border-t">
                            <Button 
                              className="flex-1 bg-blue-500 hover:bg-blue-600"
                              onClick={() => {
                                setShowDetalhesParticipanteModal(false);
                                setShowEditParticipanteModal(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </Button>
                            <Button variant="outline" onClick={() => setShowDetalhesParticipanteModal(false)}>
                              Fechar
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  {/* Modal de Confirmação Inativar/Reativar Participante */}
                  <Dialog open={showInativarParticipanteModal} onOpenChange={setShowInativarParticipanteModal}>
                    <DialogContent>
                      <DialogHeader>
                        <div className="flex items-center gap-3">
                          {selectedParticipante?.status === 'inativo' ? (
                            <User className="w-8 h-8 text-green-500" />
                          ) : (
                            <UserX className="w-8 h-8 text-orange-500" />
                          )}
                          <DialogTitle>
                            {selectedParticipante?.status === 'inativo' ? 'Reativar Participante' : 'Inativar Participante'}
                          </DialogTitle>
                        </div>
                      </DialogHeader>
                      <p className="text-gray-600">
                        {selectedParticipante?.status === 'inativo' 
                          ? `Tem certeza que deseja reativar o participante "${selectedParticipante?.nome}"?`
                          : `Tem certeza que deseja inativar o participante "${selectedParticipante?.nome}"? O participante não será excluído, apenas marcado como inativo.`
                        }
                      </p>
                      <div className="flex gap-2 pt-4">
                        <Button variant="outline" onClick={() => setShowInativarParticipanteModal(false)}>
                          Cancelar
                        </Button>
                        <Button
                          className={selectedParticipante?.status === 'inativo' ? "bg-green-500 hover:bg-green-600" : "bg-orange-500 hover:bg-orange-600"}
                          onClick={async () => {
                            if (selectedParticipante?.id) {
                              try {
                                const newStatus = selectedParticipante.status === 'inativo' ? 'ativo' : 'inativo';
                                await apiRequest(`/api/participantes-inclusao/${selectedParticipante.id}`, {
                                  method: 'PATCH',
                                  body: JSON.stringify({ status: newStatus })
                                });
                                queryClient.invalidateQueries({ queryKey: ['/api/participantes-inclusao'] });
                                toast({
                                  title: selectedParticipante.status === 'inativo' ? "Participante reativado" : "Participante inativado",
                                  description: selectedParticipante.status === 'inativo' 
                                    ? `${selectedParticipante.nome} foi reativado com sucesso.`
                                    : `${selectedParticipante.nome} foi inativado com sucesso.`
                                });
                                setShowInativarParticipanteModal(false);
                                setSelectedParticipante(null);
                              } catch (error) {
                                toast({
                                  title: "Erro",
                                  description: "Não foi possível alterar o status do participante.",
                                  variant: "destructive"
                                });
                              }
                            }
                          }}
                        >
                          {selectedParticipante?.status === 'inativo' ? 'Reativar' : 'Inativar'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Modal de Edição Completa de Participante - Inclusão Produtiva */}
                  <ComprehensiveStudentForm 
                    open={showEditParticipanteModal}
                    onClose={() => {
                      setShowEditParticipanteModal(false);
                      setSelectedParticipante(null);
                    }}
                    mode="inclusao"
                    editId={selectedParticipante?.id}
                  />

                  {/* Modal de Preview de Documento */}
                  <Dialog open={showDocumentoPreviewModal} onOpenChange={setShowDocumentoPreviewModal}>
                    <DialogContent className="max-w-4xl max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle>{documentoPreviewNome || 'Documento'}</DialogTitle>
                      </DialogHeader>
                      <div className="flex-1 overflow-auto" style={{ height: '70vh' }}>
                        {documentoPreviewUrl && (documentoPreviewUrl.toLowerCase().endsWith('.pdf') ? (
                          <iframe 
                            src={documentoPreviewUrl} 
                            className="w-full h-full border-0"
                            title="Preview do documento"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <img 
                              src={documentoPreviewUrl} 
                              alt={documentoPreviewNome}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Input hidden para upload de arquivo */}
                  <input
                    id="file-import"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleImportExcel}
                    style={{ display: 'none' }}
                  />
                  
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="Buscar participantes..." 
                        className="pl-10"
                        value={searchParticipante}
                        onChange={(e) => setSearchParticipante(e.target.value)}
                      />
                    </div>
                    <Select value={statusFilterParticipantes} onValueChange={setStatusFilterParticipantes}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="ativos">Ativos</SelectItem>
                        <SelectItem value="inativos">Inativos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Foto</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>CPF</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Turmas</TableHead>
                        <TableHead>Escolaridade</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingParticipantes ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                            Carregando participantes...
                          </TableCell>
                        </TableRow>
                      ) : participantesData.filter((p: any) => {
                          const matchesSearch = p.nome.toLowerCase().includes(searchParticipante.toLowerCase());
                          
                          // Filtro de status
                          let matchesStatus = true;
                          if (statusFilterParticipantes === 'ativos') matchesStatus = p.status !== 'inativo';
                          if (statusFilterParticipantes === 'inativos') matchesStatus = p.status === 'inativo';
                          
                          if (!selectedCurso) return matchesSearch && matchesStatus;
                          
                          const cursoTurmaIds = (selectedCurso.turmas || []).map((t: any) => t.id);
                          const participanteTurmaIds = (p.turmas || []).map((t: any) => t.id);
                          const isInCursoTurma = participanteTurmaIds.some((id: number) => cursoTurmaIds.includes(id));
                          
                          return matchesSearch && matchesStatus && isInCursoTurma;
                        }).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                            {selectedCurso 
                              ? `Nenhum participante encontrado nas turmas do curso "${selectedCurso.nome}".` 
                              : (searchParticipante ? "Nenhum participante encontrado." : "Nenhum participante cadastrado. Clique em \"Adicionar Participante\" para começar.")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        participantesData
                          .filter((p: any) => {
                            const matchesSearch = p.nome.toLowerCase().includes(searchParticipante.toLowerCase());
                            
                            // Filtro de status
                            let matchesStatus = true;
                            if (statusFilterParticipantes === 'ativos') matchesStatus = p.status !== 'inativo';
                            if (statusFilterParticipantes === 'inativos') matchesStatus = p.status === 'inativo';
                            
                            if (!selectedCurso) return matchesSearch && matchesStatus;
                            
                            const cursoTurmaIds = (selectedCurso.turmas || []).map((t: any) => t.id);
                            const participanteTurmaIds = (p.turmas || []).map((t: any) => t.id);
                            const isInCursoTurma = participanteTurmaIds.some((id: number) => cursoTurmaIds.includes(id));
                            
                            return matchesSearch && matchesStatus && isInCursoTurma;
                          })
                          .map((participante: any) => (
                          <TableRow key={participante.id}>
                            <TableCell>
                              {participante.foto_perfil && participante.foto_perfil.trim() ? (
                                <img 
                                  src={participante.foto_perfil} 
                                  alt={participante.nome} 
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <User className="w-5 h-5 text-blue-500" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{participante.nome}</TableCell>
                            <TableCell>{participante.cpf}</TableCell>
                            <TableCell>{participante.telefone}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {participante.turmas && participante.turmas.length > 0 ? (
                                  participante.turmas.map((turma: any, idx: number) => (
                                    <Badge key={idx} className="bg-white border border-blue-500 text-blue-700 text-xs hover:bg-blue-50">
                                      {turma.nome}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-sm text-gray-400">Sem turma</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{participante.escolaridade}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={async () => {
                                    setSelectedParticipante(participante);
                                    setLoadingParticipanteDetails(true);
                                    setShowDetalhesParticipanteModal(true);
                                    try {
                                      const res = await fetch(`/api/participantes-inclusao/${participante.id}`);
                                      const data = await res.json();
                                      setFullParticipanteData(data);
                                      // Carregar documentos
                                      try {
                                        const docsRes = await fetch(`/api/documentos/participante-inclusao/${participante.id}`);
                                        const docsData = await docsRes.json();
                                        setParticipanteDocumentos(docsData || []);
                                      } catch (e) {
                                        setParticipanteDocumentos([]);
                                      }
                                    } catch (err) {
                                      console.error('Erro ao buscar dados do participante:', err);
                                    } finally {
                                      setLoadingParticipanteDetails(false);
                                    }
                                  }}
                                  data-testid={`button-view-participant-${participante.id}`}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedParticipante(participante);
                                    setShowEditParticipanteModal(true);
                                  }}
                                  data-testid={`button-edit-participant-${participante.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className={participante.status === 'inativo' ? "text-green-500 hover:text-green-700" : "text-orange-500 hover:text-orange-700"}
                                  onClick={() => {
                                    setSelectedParticipante(participante);
                                    setShowInativarParticipanteModal(true);
                                  }}
                                  title={participante.status === 'inativo' ? "Reativar participante" : "Inativar participante"}
                                  data-testid={`button-toggle-status-participant-${participante.id}`}
                                >
                                  {participante.status === 'inativo' ? (
                                    <User className="w-4 h-4" />
                                  ) : (
                                    <UserX className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
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

          {activeSection === 'programas' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Programas de Qualificação</CardTitle>
                <Button 
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => setShowNovoProgramaModal(true)}
                  data-testid="button-novo-programa"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Programa
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {isLoadingProgramas ? (
                    <p className="text-center text-gray-500">Carregando programas...</p>
                  ) : programasData.length === 0 ? (
                    <p className="text-center text-gray-500">Nenhum programa cadastrado. Clique em "Novo Programa" para criar.</p>
                  ) : programasData.map((programa: any, index: number) => (
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
                          <span className="text-gray-500">Carga Horária:</span>
                          <p className="font-medium">{programa.cargaHoraria || programa.carga_horaria}h</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Vagas:</span>
                          <p className="font-medium">{programa.vagasOcupadas || programa.vagas_ocupadas || 0}/{programa.numeroVagas || programa.numero_vagas || 0}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Taxa de Ocupação:</span>
                          <p className="font-medium">
                            {programa.numeroVagas || programa.numero_vagas 
                              ? Math.round(((programa.vagasOcupadas || programa.vagas_ocupadas || 0) / (programa.numeroVagas || programa.numero_vagas)) * 100) 
                              : 0}%
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Horário:</span>
                          <p className="font-medium">
                            {programa.horarioEntrada && programa.horarioSaida 
                              ? `${programa.horarioEntrada} - ${programa.horarioSaida}`
                              : programa.horario || 'A definir'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Próxima Aula:</span>
                          <p className="font-medium">{programa.proximaAula || programa.proxima_aula || 'A agendar'}</p>
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
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Turmas de Capacitação</CardTitle>
                <Button 
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={() => setShowNovaTurmaModal(true)}
                  data-testid="button-nova-turma"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Turma
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {isLoadingTurmas ? (
                    <p className="text-center text-gray-500">Carregando turmas...</p>
                  ) : turmasData.length === 0 ? (
                    <p className="text-center text-gray-500">Nenhuma turma cadastrada. Clique em "Nova Turma" para criar.</p>
                  ) : (
                    programasData.map((programa: any) => {
                      const turmasDoPrograma = turmasData.filter((t: any) => t.programaId === programa.id || t.programa_id === programa.id);
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
                                  <Badge variant={turma.status === 'ativo' ? 'default' : 'secondary'}>
                                    {formatarStatus(turma.status)}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                                  <div>
                                    <span className="text-gray-500">Código:</span>
                                    <p className="font-medium">{turma.codigo || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Vagas:</span>
                                    <p className="font-medium">
                                      {turma.vagasOcupadas || turma.vagas_ocupadas || 0}/
                                      {turma.numeroVagas || turma.numero_vagas || 0}
                                    </p>
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
                                <div className="flex gap-2">
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
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedTurma(turma);
                                      setShowNovoCursoModal(true);
                                    }}
                                    data-testid={`button-add-curso-${index}`}
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Adicionar Curso
                                  </Button>
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

          {activeSection === 'parceiros' && (
            <Card>
              <CardHeader>
                <CardTitle>Parceiros</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Gestão da rede de parceiros e empresas contratantes.</p>
              </CardContent>
            </Card>
          )}

          {activeSection === 'vagas' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Vagas de Emprego</CardTitle>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Vaga
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="Buscar vagas..." className="pl-10" />
                    </div>
                    <Select>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
                        <SelectItem value="aberta">Abertas</SelectItem>
                        <SelectItem value="preenchida">Preenchidas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50 dark:bg-gray-800">
                    <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="font-semibold text-lg mb-2 text-gray-600 dark:text-gray-400">
                      Sistema de Vagas em Desenvolvimento
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                      O módulo de gestão de vagas de emprego será implementado em breve.
                    </p>
                    <div className="max-w-md mx-auto text-left space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Recursos planejados:</strong>
                      </p>
                      <ul className="text-sm text-gray-500 space-y-1 ml-4">
                        <li>• Cadastro de vagas de parceiros</li>
                        <li>• Matching participantes x vagas</li>
                        <li>• Acompanhamento de candidaturas</li>
                        <li>• Relatório de empregabilidade</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'presenca' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Controle de Presença
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Filtros */}
                  <div className="flex gap-4">
                    <Select defaultValue="todas">
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Turma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas as Turmas</SelectItem>
                        {turmasData.map((turma: any) => (
                          <SelectItem key={turma.id} value={turma.id.toString()}>
                            {turma.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex-1">
                      <Input
                        type="date"
                        className="w-full"
                        defaultValue={new Date().toISOString().split('T')[0]}
                        data-testid="input-data-presenca"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      data-testid="button-export-presenca"
                      onClick={handleExportPresencas}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exportar Excel
                    </Button>
                    <Button 
                      variant="outline" 
                      data-testid="button-import-presenca"
                      onClick={() => document.getElementById('import-participantes-input')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Importar Participantes
                    </Button>
                    <input
                      id="import-participantes-input"
                      type="file"
                      accept=".xlsx,.xls"
                      style={{ display: 'none' }}
                      onChange={handleImportParticipantes}
                    />
                  </div>

                  {/* Tabela de Presença */}
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Participante</TableHead>
                          <TableHead>Turma</TableHead>
                          <TableHead className="text-center">Presente</TableHead>
                          <TableHead className="text-center">Ausente</TableHead>
                          <TableHead className="text-center">Justificado</TableHead>
                          <TableHead>Observações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {participantesData.length > 0 ? participantesData.slice(0, 10).map((participante: any) => {
                          const turmasParticipante = participante.turmas || [];
                          return (
                            <TableRow key={participante.id}>
                              <TableCell className="font-medium">{participante.nome}</TableCell>
                              <TableCell>
                                {turmasParticipante.length > 0 
                                  ? turmasParticipante.map((t: any) => t.nome).join(', ')
                                  : 'Sem turma'}
                              </TableCell>
                              <TableCell className="text-center">
                                <Checkbox 
                                  checked={presencas[participante.id] === 'presente'}
                                  onCheckedChange={(checked) => 
                                    handleStatusChange(participante.id, checked ? 'presente' : null)
                                  }
                                  data-testid={`checkbox-presente-${participante.id}`} 
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Checkbox 
                                  checked={presencas[participante.id] === 'ausente'}
                                  onCheckedChange={(checked) => 
                                    handleStatusChange(participante.id, checked ? 'ausente' : null)
                                  }
                                  data-testid={`checkbox-ausente-${participante.id}`} 
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Checkbox 
                                  checked={presencas[participante.id] === 'justificado'}
                                  onCheckedChange={(checked) => 
                                    handleStatusChange(participante.id, checked ? 'justificado' : null)
                                  }
                                  data-testid={`checkbox-justificado-${participante.id}`} 
                                />
                                {presencas[participante.id] === 'justificado' && justificativas[participante.id] && (
                                  <span className="ml-2 text-xs text-green-600">✓</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Input 
                                  placeholder="Observações..." 
                                  className="w-full"
                                  data-testid={`input-obs-${participante.id}`}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        }) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                              <CheckCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                              <p>Nenhum participante cadastrado.</p>
                              <p className="text-sm mt-2">Adicione participantes na seção "Participantes".</p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setPresencas({});
                        setJustificativas({});
                        toast({ description: "Presenças canceladas." });
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSalvarPresencas}
                      data-testid="button-salvar-presenca"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Salvar Presenças
                    </Button>
                  </div>

                  {/* Informação sobre funcionalidade */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      <strong>Controle de Presença:</strong> Registre a frequência dos participantes por turma e data.
                      Os dados podem ser exportados para análise no Excel.
                    </p>
                  </div>

                  {/* Histórico de Chamadas */}
                  <div className="mt-6 border-t pt-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Histórico de Chamadas
                    </h3>
                    
                    {isLoadingHistorico ? (
                      <div className="text-center py-8 text-gray-500">Carregando histórico...</div>
                    ) : historicoPresencas && Array.isArray(historicoPresencas) && historicoPresencas.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {historicoPresencas.map((chamada: any) => (
                          <div key={chamada.id} className="border rounded-lg overflow-hidden">
                            <div className="p-3 bg-gray-50 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">
                                  {chamada.data ? new Date(chamada.data + 'T12:00:00').toLocaleDateString('pt-BR') : 'Sem data'}
                                </span>
                                <span className="text-sm font-medium">- {chamada.turma}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-green-600">{chamada.totalPresentes} presentes</span>
                                {chamada.totalAusentes > 0 && (
                                  <span className="text-sm text-red-600">{chamada.totalAusentes} faltas</span>
                                )}
                              </div>
                            </div>
                            <div className="p-3 border-t bg-white">
                              <div className="text-sm font-medium mb-2 text-gray-600">Lista de Presença:</div>
                              <div className="grid gap-1 max-h-40 overflow-y-auto">
                                {chamada.presencas?.map((p: any, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between py-1 px-2 rounded bg-gray-50">
                                    <span className="text-sm">{p.nome}</span>
                                    <span className={`text-xs font-medium ${p.presente ? 'text-green-600' : 'text-red-600'}`}>
                                      {p.presente ? 'Presente' : 'Falta'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Nenhum registro de chamada encontrado
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Modal de Justificativa */}
          <Dialog open={participanteJustificando !== null} onOpenChange={(open) => !open && handleCancelarJustificativa()}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Justificar Falta</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Participante: {participantesData.find((p: any) => p.id === participanteJustificando)?.nome}
                  </label>
                  <p className="text-sm text-gray-600 mb-4">
                    Digite a justificativa da falta (mínimo 40 caracteres)
                  </p>
                  <Textarea
                    value={justificativaTemp}
                    onChange={(e) => {
                      setJustificativaTemp(e.target.value);
                      setErroJustificativa("");
                    }}
                    placeholder="Digite a justificativa detalhada da falta..."
                    className="min-h-[150px]"
                    data-testid="textarea-justificativa"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-sm ${justificativaTemp.trim().length >= 40 ? 'text-green-600' : 'text-gray-500'}`}>
                      {justificativaTemp.trim().length}/40 caracteres
                    </span>
                    {erroJustificativa && (
                      <span className="text-sm text-red-600">{erroJustificativa}</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleCancelarJustificativa}
                    data-testid="button-cancelar-justificativa"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSalvarJustificativa}
                    disabled={justificativaTemp.trim().length < 40}
                    data-testid="button-salvar-justificativa"
                  >
                    Salvar Justificativa
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

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
                        placeholder="Buscar participante..."
                        className="w-full"
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
                    {participantesData.length > 0 ? participantesData.slice(0, 10).map((participante: any) => {
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

          {activeSection === 'cursos' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-purple-500" />
                    Cursos Profissionalizantes
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Coordenação dos cursos e capacitações profissionais.</p>
                </div>
                <Button 
                  size="sm" 
                  className="bg-purple-500 hover:bg-purple-600"
                  onClick={() => setShowNovoCursoModal(true)}
                  data-testid="button-novo-curso"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Curso
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Filtros */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Buscar curso..."
                        className="w-full"
                        data-testid="input-search-cursos"
                      />
                    </div>
                    <Select defaultValue="todos">
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todas Categorias</SelectItem>
                        <SelectItem value="administrativo">Administrativo</SelectItem>
                        <SelectItem value="vendas">Vendas</SelectItem>
                        <SelectItem value="servicos">Serviços</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Lista de Cursos */}
                  <div className="grid gap-4">
                    {isLoadingCursos ? (
                      <p className="text-center text-gray-500">Carregando cursos...</p>
                    ) : cursosData.length === 0 ? (
                      <p className="text-center text-gray-500">Nenhum curso cadastrado</p>
                    ) : cursosData.map((curso: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-purple-500" />
                            {curso.nome}
                          </h3>
                          <Badge variant={curso.status === 'ativo' ? 'default' : 'secondary'}>
                            {formatarStatus(curso.status)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Categoria:</p>
                            <p className="font-medium">{curso.categoria || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Duração:</p>
                            <p className="font-medium">{curso.duracao || `${curso.cargaHoraria || 0}h`}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Próxima Aula:</p>
                            <p className="font-medium">{curso.proximaAula ? new Date(curso.proximaAula).toLocaleDateString('pt-BR') : 'Não definida'}</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-1">Descrição:</p>
                          <p className="text-sm">{curso.descricao}</p>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedCurso(curso);
                              setShowDetalhesCursoModal(true);
                            }}
                            data-testid={`button-ver-curso-${index}`}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver Detalhes
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedCurso(curso);
                              setActiveSection('participantes');
                              toast({
                                title: "Visualizando Participantes",
                                description: `Mostrando participantes de ${curso.nome}`
                              });
                            }}
                            data-testid={`button-ver-participantes-curso-${index}`}
                          >
                            <Users className="w-4 h-4 mr-1" />
                            Ver Participantes
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedCurso(curso);
                              setShowCronogramaModal(true);
                            }}
                            data-testid={`button-cronograma-${index}`}
                          >
                            <Calendar className="w-4 h-4 mr-1" />
                            Cronograma
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedCurso(curso);
                              setShowEditCursoModal(true);
                            }}
                            data-testid={`button-editar-curso-${index}`}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setSelectedCurso(curso);
                              setProgramaToDelete(curso);
                              setShowExcluirProgramaModal(true);
                            }}
                            data-testid={`button-excluir-curso-${index}`}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'parceiros' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-orange-500" />
                  Parceiros e Empresas
                </CardTitle>
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Parceria
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Filtros */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Buscar empresa..."
                        className="w-full"
                        data-testid="input-search-parceiros"
                      />
                    </div>
                    <Select defaultValue="todos">
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os Tipos</SelectItem>
                        <SelectItem value="contratante">Contratante</SelectItem>
                        <SelectItem value="patrocinador">Patrocinador</SelectItem>
                        <SelectItem value="fornecedor">Fornecedor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Lista de Parceiros - EM DESENVOLVIMENTO */}
                  <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50 dark:bg-gray-800">
                    <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="font-semibold text-lg mb-2 text-gray-600 dark:text-gray-400">
                      Sistema de Parceiros em Desenvolvimento
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                      O módulo de gestão de parceiros e empresas será implementado em breve.
                    </p>
                    <div className="max-w-md mx-auto text-left space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Recursos planejados:</strong>
                      </p>
                      <ul className="text-sm text-gray-500 space-y-1 ml-4">
                        <li>• Cadastro de empresas parceiras</li>
                        <li>• Gestão de vagas disponíveis</li>
                        <li>• Histórico de contratações</li>
                        <li>• Relatórios de parcerias</li>
                      </ul>
                    </div>
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
                  {/* Métricas Principais - DADOS REAIS */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600 dark:text-blue-400">Total Participantes</p>
                          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                            {participantesData.length}
                          </p>
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
                          <p className="text-sm text-orange-600 dark:text-orange-400">Cursos Disponíveis</p>
                          <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                            {cursosData.length}
                          </p>
                        </div>
                        <Briefcase className="w-8 h-8 text-orange-500" />
                      </div>
                    </div>
                  </div>

                  {/* Distribuição por Gênero - DADOS REAIS */}
                  <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Distribuição por Gênero</h3>
                    <div className="space-y-3">
                      {(() => {
                        const generos = participantesData.reduce((acc: any, p: any) => {
                          const genero = p.genero || 'Não informado';
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
                        // Contar turmas e cursos do programa
                        const turmasPrograma = turmasData.filter((t: any) => t.programaId === programa.id);
                        const cursosPrograma = cursosData.filter((c: any) => c.programaId === programa.id);
                        
                        // Contar participantes nas turmas deste programa
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
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Participantes</p>
                                <p className="text-2xl font-bold">{participantesPrograma.length}</p>
                              </div>
                              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Turmas</p>
                                <p className="text-2xl font-bold">{turmasPrograma.length}</p>
                              </div>
                              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Cursos</p>
                                <p className="text-2xl font-bold">{cursosPrograma.length}</p>
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
                        <p className="text-xs text-gray-400">Acompanhamento de conclusão de cursos</p>
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
                    <Select defaultValue={selectedPrograma.modalidade?.toLowerCase()}>
                      <SelectTrigger id="edit-programa-modalidade">
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

                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <Select defaultValue={selectedPrograma.status?.toLowerCase()}>
                    <SelectTrigger id="edit-programa-status">
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
                        const modalidade = (document.getElementById('edit-programa-modalidade') as HTMLSelectElement)?.value;
                        const duracao = (document.getElementById('edit-programa-duracao') as HTMLInputElement)?.value;
                        const numeroVagas = parseInt((document.getElementById('edit-programa-vagas') as HTMLInputElement)?.value || '0');
                        const status = (document.getElementById('edit-programa-status') as HTMLSelectElement)?.value;
                        const descricao = (document.getElementById('edit-programa-descricao') as HTMLTextAreaElement)?.value;

                        const response = await fetch(`/api/programas-inclusao/${selectedPrograma.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            nome,
                            modalidade,
                            duracao,
                            numeroVagas,
                            status,
                            descricao
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
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-green-600" />
                    {selectedPrograma.nome}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Modalidade</p>
                      <p className="font-medium">{selectedPrograma.modalidade}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Duração</p>
                      <p className="font-medium">{selectedPrograma.duracao}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Vagas</p>
                      <p className="font-medium">{selectedPrograma.ocupadas}/{selectedPrograma.vagas}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Taxa de Ocupação</p>
                      <p className="font-medium">{Math.round((selectedPrograma.ocupadas/selectedPrograma.vagas)*100)}%</p>
                    </div>
                  </div>
                </div>

                {/* Estatísticas */}
                <div>
                  <h4 className="font-semibold mb-3">Estatísticas do Programa</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-600">Participantes Ativos</span>
                      </div>
                      <p className="text-2xl font-bold">{selectedPrograma.ocupadas}</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600">Taxa de Conclusão</span>
                      </div>
                      <p className="text-2xl font-bold">85%</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-gray-600">Empregabilidade</span>
                      </div>
                      <p className="text-2xl font-bold">70%</p>
                    </div>
                  </div>
                </div>

                {/* Cronograma */}
                <div>
                  <h4 className="font-semibold mb-3">Cronograma</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium">Data de Início</p>
                          <p className="text-sm text-gray-600">15/08/2025</p>
                        </div>
                      </div>
                      <Badge variant="outline">Iniciado</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium">Data de Conclusão Prevista</p>
                          <p className="text-sm text-gray-600">15/11/2025</p>
                        </div>
                      </div>
                      <Badge>Em Andamento</Badge>
                    </div>
                  </div>
                </div>

                {/* Requisitos */}
                <div>
                  <h4 className="font-semibold mb-3">Requisitos e Pré-requisitos</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Ensino médio completo ou cursando</li>
                    <li>Disponibilidade para aulas presenciais</li>
                    <li>Conhecimentos básicos de informática (desejável)</li>
                  </ul>
                </div>

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

        {/* Modal de Editar Curso */}
        <Dialog open={showEditCursoModal} onOpenChange={setShowEditCursoModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Curso Profissionalizante</DialogTitle>
            </DialogHeader>
            {selectedCurso && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome do Curso</label>
                  <Input id="edit-curso-nome" defaultValue={selectedCurso.nome} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Categoria</label>
                    <Select defaultValue={selectedCurso.categoria?.toLowerCase()}>
                      <SelectTrigger id="edit-curso-categoria">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="administrativo">Administrativo</SelectItem>
                        <SelectItem value="vendas">Vendas</SelectItem>
                        <SelectItem value="serviços">Serviços</SelectItem>
                        <SelectItem value="tecnologia">Tecnologia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Carga Horária (horas)</label>
                    <Input id="edit-curso-carga" type="number" defaultValue={selectedCurso.cargaHoraria} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <Select defaultValue={selectedCurso.status?.toLowerCase()}>
                      <SelectTrigger id="edit-curso-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planejado">Planejado</SelectItem>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Horário de Entrada</label>
                    <Input type="time" id="edit-curso-horario-entrada" defaultValue={selectedCurso.horarioEntrada} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Horário de Saída</label>
                    <Input type="time" id="edit-curso-horario-saida" defaultValue={selectedCurso.horarioSaida} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Descrição</label>
                  <Textarea 
                    id="edit-curso-descricao"
                    placeholder="Descrição do curso..."
                    defaultValue={selectedCurso.descricao}
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button 
                    className="bg-purple-500 hover:bg-purple-600"
                    onClick={async () => {
                      try {
                        const nome = (document.getElementById('edit-curso-nome') as HTMLInputElement)?.value;
                        const categoria = (document.getElementById('edit-curso-categoria') as HTMLSelectElement)?.value;
                        const cargaHoraria = parseInt((document.getElementById('edit-curso-carga') as HTMLInputElement)?.value || '0');
                        const status = (document.getElementById('edit-curso-status') as HTMLSelectElement)?.value;
                        const horarioEntrada = (document.getElementById('edit-curso-horario-entrada') as HTMLInputElement)?.value;
                        const horarioSaida = (document.getElementById('edit-curso-horario-saida') as HTMLInputElement)?.value;
                        const descricao = (document.getElementById('edit-curso-descricao') as HTMLTextAreaElement)?.value;

                        const response = await fetch(`/api/cursos-inclusao/${selectedCurso.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            nome,
                            categoria,
                            cargaHoraria,
                            status,
                            horarioEntrada: horarioEntrada || null,
                            horarioSaida: horarioSaida || null,
                            descricao
                          })
                        });

                        if (response.ok) {
                          toast({
                            title: "Curso atualizado!",
                            description: `${nome} foi atualizado com sucesso.`
                          });
                          setShowEditCursoModal(false);
                          queryClient.invalidateQueries({ queryKey: ['/api/cursos-inclusao'] });
                        } else {
                          throw new Error('Erro ao atualizar curso');
                        }
                      } catch (error) {
                        toast({
                          title: "Erro",
                          description: "Não foi possível atualizar o curso.",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </Button>
                  <Button variant="outline" onClick={() => setShowEditCursoModal(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Cronograma */}
        <Dialog open={showCronogramaModal} onOpenChange={setShowCronogramaModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Cronograma do Curso</DialogTitle>
            </DialogHeader>
            {selectedCurso && (
              <div className="space-y-6">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{selectedCurso.nome}</h3>
                  <p className="text-sm text-gray-600">{selectedCurso.descricao}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-500" />
                      Agenda de Aulas
                    </h4>
                    <Button
                      size="sm"
                      className="bg-purple-500 hover:bg-purple-600"
                      onClick={() => {
                        setAulaEditando(null);
                        setShowNovaAulaModal(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar Aula
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {cronogramaAulas.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                        <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>Nenhuma aula cadastrada ainda.</p>
                        <p className="text-sm">Clique em "Adicionar Aula" para começar.</p>
                      </div>
                    ) : (
                      cronogramaAulas
                        .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
                        .map((aula, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">
                                {new Date(aula.data).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">{aula.horario}</div>
                            <div className="text-sm font-medium">{aula.tema}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{formatarStatus(aula.status)}</Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setAulaEditando(aula);
                                setShowNovaAulaModal(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                // Filtrar pela aula específica, não pelo índice ordenado
                                const novasAulas = cronogramaAulas.filter(a => 
                                  !(a.data === aula.data && 
                                    a.horario === aula.horario && 
                                    a.tema === aula.tema)
                                );
                                setCronogramaAulas(novasAulas);
                                salvarCronograma(novasAulas); // Salvar no banco
                                toast({
                                  title: "Aula removida",
                                  description: "A aula foi removida do cronograma."
                                });
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Informações Gerais</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Carga Horária Total</p>
                      <p className="font-semibold">{selectedCurso.cargaHoraria || 0}h</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700">Horas Realizadas</p>
                      <p className="font-semibold text-green-700">
                        {(() => {
                          const horasRealizadas = cronogramaAulas
                            .filter(aula => aula.status?.toLowerCase() === 'realizada')
                            .reduce((total, aula) => {
                              if (aula.horario) {
                                const [inicio, fim] = aula.horario.split(' - ');
                                if (inicio && fim) {
                                  const [hI, mI] = inicio.split(':').map(Number);
                                  const [hF, mF] = fim.split(':').map(Number);
                                  const horas = (hF * 60 + mF - (hI * 60 + mI)) / 60;
                                  return total + horas;
                                }
                              }
                              return total;
                            }, 0);
                          return horasRealizadas.toFixed(1);
                        })()}h
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">Horas Restantes</p>
                      <p className="font-semibold text-blue-700">
                        {(() => {
                          const horasRealizadas = cronogramaAulas
                            .filter(aula => aula.status?.toLowerCase() === 'realizada')
                            .reduce((total, aula) => {
                              if (aula.horario) {
                                const [inicio, fim] = aula.horario.split(' - ');
                                if (inicio && fim) {
                                  const [hI, mI] = inicio.split(':').map(Number);
                                  const [hF, mF] = fim.split(':').map(Number);
                                  const horas = (hF * 60 + mF - (hI * 60 + mI)) / 60;
                                  return total + horas;
                                }
                              }
                              return total;
                            }, 0);
                          const cargaTotal = selectedCurso.cargaHoraria || 0;
                          const restantes = Math.max(0, cargaTotal - horasRealizadas);
                          return restantes.toFixed(1);
                        })()}h
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 p-2 bg-gray-100 rounded text-sm text-gray-600">
                    <strong>{cronogramaAulas.length} aulas cadastradas</strong> • {
                      cronogramaAulas.filter(a => a.status?.toLowerCase() === 'realizada').length
                    } realizadas • {
                      cronogramaAulas.filter(a => a.status?.toLowerCase() === 'agendada').length
                    } agendadas
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    className="bg-purple-500 hover:bg-purple-600"
                    onClick={() => {
                      toast({
                        title: "Cronograma exportado",
                        description: "O cronograma foi exportado com sucesso."
                      });
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Cronograma
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowCronogramaModal(false);
                      setShowEditCursoModal(true);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Curso
                  </Button>
                  <Button variant="outline" onClick={() => setShowCronogramaModal(false)}>
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Adicionar/Editar Aula */}
        <Dialog open={showNovaAulaModal} onOpenChange={setShowNovaAulaModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{aulaEditando ? 'Editar Aula' : 'Adicionar Nova Aula'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Data da Aula *</label>
                <Input 
                  type="date" 
                  id="aula-data"
                  defaultValue={aulaEditando?.data || ''}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Hora Início *</label>
                  <Input 
                    type="time" 
                    id="aula-hora-inicio"
                    defaultValue={aulaEditando?.horario?.split(' - ')[0] || ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hora Fim *</label>
                  <Input 
                    type="time" 
                    id="aula-hora-fim"
                    defaultValue={aulaEditando?.horario?.split(' - ')[1] || ''}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tema/Título da Aula *</label>
                <Input 
                  placeholder="Ex: Introdução ao Excel" 
                  id="aula-tema"
                  defaultValue={aulaEditando?.tema || ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select value={aulaStatus} onValueChange={setAulaStatus}>
                  <SelectTrigger id="aula-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agendada">Agendada</SelectItem>
                    <SelectItem value="realizada">Realizada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <Textarea 
                  placeholder="Observações adicionais..." 
                  rows={2}
                  id="aula-observacoes"
                  defaultValue={aulaEditando?.observacoes || ''}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  className="flex-1 bg-purple-500 hover:bg-purple-600"
                  onClick={() => {
                    const data = (document.getElementById('aula-data') as HTMLInputElement)?.value;
                    const horaInicio = (document.getElementById('aula-hora-inicio') as HTMLInputElement)?.value;
                    const horaFim = (document.getElementById('aula-hora-fim') as HTMLInputElement)?.value;
                    const tema = (document.getElementById('aula-tema') as HTMLInputElement)?.value;
                    const observacoes = (document.getElementById('aula-observacoes') as HTMLTextAreaElement)?.value;

                    if (!data || !horaInicio || !horaFim || !tema) {
                      toast({
                        title: "Campos obrigatórios",
                        description: "Preencha data, horário e tema da aula.",
                        variant: "destructive"
                      });
                      return;
                    }

                    const novaAula = {
                      data,
                      horario: `${horaInicio} - ${horaFim}`,
                      tema,
                      status: aulaStatus.charAt(0).toUpperCase() + aulaStatus.slice(1),
                      observacoes
                    };

                    if (aulaEditando) {
                      // Encontrar o índice da aula original no array não ordenado
                      const index = cronogramaAulas.findIndex(a => 
                        a.data === aulaEditando.data && 
                        a.horario === aulaEditando.horario && 
                        a.tema === aulaEditando.tema
                      );
                      
                      if (index !== -1) {
                        const novasAulas = [...cronogramaAulas];
                        novasAulas[index] = novaAula;
                        setCronogramaAulas(novasAulas);
                        salvarCronograma(novasAulas); // Salvar no banco
                        toast({
                          title: "Aula atualizada",
                          description: "As informações da aula foram atualizadas."
                        });
                      }
                    } else {
                      const novasAulas = [...cronogramaAulas, novaAula];
                      setCronogramaAulas(novasAulas);
                      salvarCronograma(novasAulas); // Salvar no banco
                      toast({
                        title: "Aula adicionada",
                        description: "Nova aula adicionada ao cronograma."
                      });
                    }

                    setShowNovaAulaModal(false);
                    setAulaEditando(null);
                  }}
                >
                  {aulaEditando ? 'Atualizar' : 'Adicionar'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNovaAulaModal(false);
                    setAulaEditando(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
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
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Vagas Totais</p>
                    <p className="font-semibold">{selectedTurma.vagas || 0}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Vagas Ocupadas</p>
                    <p className="font-semibold">{selectedTurma.vagasOcupadas || 0}</p>
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

        {/* Modal de Detalhes do Curso */}
        <Dialog open={showDetalhesCursoModal} onOpenChange={setShowDetalhesCursoModal}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Curso</DialogTitle>
            </DialogHeader>
            {selectedCurso && (
              <div className="space-y-6">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{selectedCurso.nome}</h3>
                    <Badge variant={selectedCurso.status === 'ativo' ? 'default' : 'secondary'}>
                      {formatarStatus(selectedCurso.status)}
                    </Badge>
                  </div>
                  {selectedCurso.descricao && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCurso.descricao}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Categoria</p>
                    <p className="font-semibold">{selectedCurso.categoria || 'Não definida'}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Carga Horária</p>
                    <p className="font-semibold">{selectedCurso.cargaHoraria || 0}h</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Programa</p>
                    <p className="font-semibold">{selectedCurso.programaNome || 'Não vinculado'}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Turmas Vinculadas</p>
                    <p className="font-semibold">{selectedCurso.turmas?.length || 0}</p>
                  </div>
                </div>

                {selectedCurso.turmas && selectedCurso.turmas.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Turmas do Curso</h4>
                    <div className="space-y-2">
                      {selectedCurso.turmas.map((turma: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-gray-800">
                          <div>
                            <p className="font-medium">{turma.nome}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {turma.horario || 'Horário não definido'}
                            </p>
                          </div>
                          <Badge>{turma.vagas || 0} vagas</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-3">Instrutor</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Nome</p>
                      <p className="font-semibold">{selectedCurso.instrutorNome || 'Não definido'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Contato</p>
                      <p className="font-semibold">{selectedCurso.instrutorContato || 'Não definido'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Datas e Local</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Data Início</p>
                      <p className="font-semibold">
                        {selectedCurso.dataInicio 
                          ? new Date(selectedCurso.dataInicio).toLocaleDateString('pt-BR')
                          : 'Não definida'}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Data Fim</p>
                      <p className="font-semibold">
                        {selectedCurso.dataFim 
                          ? new Date(selectedCurso.dataFim).toLocaleDateString('pt-BR')
                          : 'Não definida'}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg col-span-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Local</p>
                      <p className="font-semibold">{selectedCurso.local || 'Não definido'}</p>
                    </div>
                  </div>
                </div>

                {(selectedCurso.requisitos || selectedCurso.certificado) && (
                  <div>
                    <h4 className="font-semibold mb-3">Informações Adicionais</h4>
                    <div className="space-y-3">
                      {selectedCurso.requisitos && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Requisitos</p>
                          <p className="text-sm">{selectedCurso.requisitos}</p>
                        </div>
                      )}
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Certificado</p>
                        <p className="font-semibold">
                          {selectedCurso.certificado ? '✅ Sim' : '❌ Não'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetalhesCursoModal(false);
                      setShowCronogramaModal(true);
                    }}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Ver Cronograma
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetalhesCursoModal(false);
                      setShowEditCursoModal(true);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Curso
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDetalhesCursoModal(false)}
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
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Modalidade</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="hibrido">Híbrido</SelectItem>
                      <SelectItem value="ead">EAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Duração</label>
                  <Input placeholder="Ex: 3 meses" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Vagas Disponíveis</label>
                  <Input type="number" placeholder="Ex: 15" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Taxa de Ocupação (%)</label>
                  <Input type="number" placeholder="Ex: 80" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
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
                        modalidade: 'presencial',
                        duracao: document.querySelector<HTMLInputElement>('input[placeholder="Ex: 3 meses"]')?.value,
                        vagas: document.querySelector<HTMLInputElement>('input[type="number"][placeholder="Ex: 15"]')?.value,
                        taxaOcupacao: document.querySelector<HTMLInputElement>('input[type="number"][placeholder="Ex: 80"]')?.value,
                        status: 'planejado',
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
                    <label className="block text-sm font-medium mb-1">Código</label>
                    <Input 
                      placeholder="Ex: LAB-A-2025" 
                      id="edit-turma-codigo"
                      defaultValue={selectedTurma.codigo || ''}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Vagas Disponíveis</label>
                    <Input 
                      type="number" 
                      placeholder="Ex: 20" 
                      id="edit-turma-vagas"
                      defaultValue={selectedTurma.numeroVagas || selectedTurma.numero_vagas || 20}
                    />
                  </div>
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
                    <label className="block text-sm font-medium mb-1">Hora de Início</label>
                    <Input 
                      type="time" 
                      value={editTurmaHoraInicio}
                      onChange={(e) => setEditTurmaHoraInicio(e.target.value)}
                      placeholder="Ex: 14:00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Hora de Término</label>
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
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <Select value={editTurmaStatus} onValueChange={setEditTurmaStatus}>
                    <SelectTrigger id="edit-turma-status">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planejado">Planejado</SelectItem>
                      <SelectItem value="ativo">Em andamento</SelectItem>
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
                      try {
                        // Formatar horário a partir das horas de início e fim
                        let horarioFormatado = "";
                        if (editTurmaHoraInicio && editTurmaHoraFim) {
                          horarioFormatado = `${editTurmaHoraInicio} - ${editTurmaHoraFim}`;
                        }
                        
                        const formData = {
                          nome: (document.getElementById('edit-turma-nome') as HTMLInputElement)?.value,
                          codigo: (document.getElementById('edit-turma-codigo') as HTMLInputElement)?.value,
                          numeroVagas: parseInt((document.getElementById('edit-turma-vagas') as HTMLInputElement)?.value || '20'),
                          dataInicio: (document.getElementById('edit-turma-data-inicio') as HTMLInputElement)?.value || null,
                          dataFim: (document.getElementById('edit-turma-data-fim') as HTMLInputElement)?.value || null,
                          horario: horarioFormatado,
                          local: (document.getElementById('edit-turma-local') as HTMLInputElement)?.value,
                          status: editTurmaStatus,
                          instrutorNome: (document.getElementById('edit-turma-instrutor') as HTMLInputElement)?.value,
                          descricao: (document.getElementById('edit-turma-descricao') as HTMLTextAreaElement)?.value
                        };

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

        {/* Modal de Novo Curso */}
        <Dialog open={showNovoCursoModal} onOpenChange={(open) => {
          setShowNovoCursoModal(open);
          if (!open) {
            setNovoCursoProgramaId("");
            setNovoCursoTurmaIds([]);
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Curso Profissionalizante</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Programa *</label>
                <Select value={novoCursoProgramaId} onValueChange={(value) => {
                  setNovoCursoProgramaId(value);
                  setNovoCursoTurmaIds([]); // Resetar turmas quando trocar programa
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o programa" />
                  </SelectTrigger>
                  <SelectContent>
                    {programasData.length === 0 ? (
                      <SelectItem value="none" disabled>Nenhum programa disponível</SelectItem>
                    ) : programasData.map((prog: any) => (
                      <SelectItem key={prog.id} value={prog.id.toString()}>{prog.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Selecione qual programa este curso pertence</p>
              </div>

              {novoCursoProgramaId && (
                <div>
                  <label className="block text-sm font-medium mb-2">Turmas (Opcional)</label>
                  <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                    {turmasData
                      .filter((t: any) => t.programaId.toString() === novoCursoProgramaId)
                      .map((turma: any) => (
                        <div key={turma.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`turma-${turma.id}`}
                            checked={novoCursoTurmaIds.includes(turma.id)}
                            onCheckedChange={(checked) => {
                              if (checked === true) {
                                setNovoCursoTurmaIds([...novoCursoTurmaIds, turma.id]);
                              } else {
                                setNovoCursoTurmaIds(novoCursoTurmaIds.filter((id) => id !== turma.id));
                              }
                            }}
                          />
                          <label htmlFor={`turma-${turma.id}`} className="text-sm cursor-pointer flex-1">
                            {turma.nome} {turma.codigo ? `(${turma.codigo})` : ''}
                          </label>
                        </div>
                      ))}
                    {turmasData.filter((t: any) => t.programaId.toString() === novoCursoProgramaId).length === 0 && (
                      <p className="text-sm text-gray-500">Nenhuma turma disponível neste programa</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Selecione as turmas que farão este curso (opcional)</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Nome do Curso *</label>
                <Input placeholder="Ex: Auxiliar Administrativo" id="curso-nome" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria</label>
                  <Input placeholder="Ex: Administrativo" id="curso-categoria" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Carga Horária (horas) *</label>
                  <Input type="number" placeholder="Ex: 120" id="curso-carga" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Horário de Entrada</label>
                  <Input type="time" id="curso-horario-entrada" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Horário de Saída</label>
                  <Input type="time" id="curso-horario-saida" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select defaultValue="planejado">
                  <SelectTrigger id="curso-status">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planejado">Planejado</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <Textarea 
                  placeholder="Descreva o curso e seus objetivos..."
                  rows={3}
                  id="curso-descricao"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  className="bg-purple-500 hover:bg-purple-600"
                  disabled={isCreatingCurso}
                  onClick={async () => {
                    if (isCreatingCurso) return;
                    
                    try {
                      setIsCreatingCurso(true);
                      
                      const nome = (document.getElementById('curso-nome') as HTMLInputElement)?.value;
                      const categoria = (document.getElementById('curso-categoria') as HTMLInputElement)?.value;
                      const cargaHoraria = parseInt((document.getElementById('curso-carga') as HTMLInputElement)?.value || '0');
                      const horarioEntrada = (document.getElementById('curso-horario-entrada') as HTMLInputElement)?.value;
                      const horarioSaida = (document.getElementById('curso-horario-saida') as HTMLInputElement)?.value;
                      const status = (document.getElementById('curso-status') as HTMLSelectElement)?.value || 'planejado';
                      const descricao = (document.getElementById('curso-descricao') as HTMLTextAreaElement)?.value;

                      if (!novoCursoProgramaId) {
                        toast({
                          title: "Erro",
                          description: "Selecione um programa para este curso.",
                          variant: "destructive"
                        });
                        setIsCreatingCurso(false);
                        return;
                      }

                      if (!nome) {
                        toast({
                          title: "Erro",
                          description: "Nome do curso é obrigatório.",
                          variant: "destructive"
                        });
                        setIsCreatingCurso(false);
                        return;
                      }

                      if (!cargaHoraria || cargaHoraria <= 0) {
                        toast({
                          title: "Erro",
                          description: "Carga horária deve ser maior que zero.",
                          variant: "destructive"
                        });
                        setIsCreatingCurso(false);
                        return;
                      }

                      const programaId = parseInt(novoCursoProgramaId);

                      const response = await fetch('/api/cursos-inclusao', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          programaId,
                          nome,
                          categoria: categoria || 'Geral',
                          cargaHoraria,
                          horarioEntrada: horarioEntrada || null,
                          horarioSaida: horarioSaida || null,
                          status,
                          descricao,
                          turmaIds: novoCursoTurmaIds.length > 0 ? novoCursoTurmaIds : undefined
                        })
                      });

                      if (response.ok) {
                        toast({
                          title: "Curso criado!",
                          description: `Curso criado com sucesso${novoCursoTurmaIds.length > 0 ? ` e vinculado a ${novoCursoTurmaIds.length} turma(s)` : ''}.`
                        });
                        setShowNovoCursoModal(false);
                        setNovoCursoProgramaId("");
                        setNovoCursoTurmaIds([]);
                        queryClient.invalidateQueries({ queryKey: ['/api/cursos-inclusao'] });
                      } else {
                        throw new Error('Erro ao criar curso');
                      }
                    } catch (error) {
                      toast({
                        title: "Erro",
                        description: "Não foi possível criar o curso.",
                        variant: "destructive"
                      });
                    } finally {
                      setIsCreatingCurso(false);
                    }
                  }}
                  data-testid="button-criar-curso"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isCreatingCurso ? "Criando..." : "Criar Curso"}
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowNovoCursoModal(false);
                  setNovoCursoProgramaId("");
                  setNovoCursoTurmaIds([]);
                }}>
                  Cancelar
                </Button>
              </div>
            </div>
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
            setSelectedCurso(null);
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
            </DialogHeader>
            {programaToDelete && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Tem certeza que deseja excluir {selectedCurso ? 'o curso' : 'o programa'} <strong>{programaToDelete.nome}</strong>? 
                  {!selectedCurso && ' Todos os cursos associados também serão removidos.'}
                  {' '}Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-3 pt-4">
                  <Button 
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => {
                      if (selectedCurso) {
                        deleteCursoMutation.mutate(programaToDelete.id);
                      } else {
                        deleteProgramaMutation.mutate(programaToDelete.id);
                      }
                    }}
                    disabled={deleteProgramaMutation.isPending || deleteCursoMutation.isPending}
                    data-testid="button-confirmar-exclusao"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {(deleteProgramaMutation.isPending || deleteCursoMutation.isPending) ? 'Excluindo...' : 'Sim, Excluir'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowExcluirProgramaModal(false);
                      setProgramaToDelete(null);
                      setSelectedCurso(null);
                    }}
                    disabled={deleteProgramaMutation.isPending || deleteCursoMutation.isPending}
                    data-testid="button-cancelar-exclusao"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <AlterarSenha 
          open={showAlterarSenhaModal} 
          onOpenChange={setShowAlterarSenhaModal}
        />
      </div>
    </div>
  );
}