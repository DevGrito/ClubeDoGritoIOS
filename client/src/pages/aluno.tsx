import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useDevAccess } from "@/hooks/useDevAccess";
import logoClube from "@assets/LOGO_CLUBE-05_1752081350082.png";
import { 
  Calendar, 
  BookOpen, 
  MessageSquare, 
  User, 
  Home,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Users,
  Quote,
  CalendarDays,
  ChevronRight,
  Menu,
  X,
  Target,
  Star,
  Award,
  Settings,
  LogOut,
  Plus,
  Bell,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Brain,
  Mail,
  CheckSquare,
  Calendar as CalendarIcon,
  FileText,
  BarChart3,
  Edit3,
  Phone,
  MessageCircle,
  Code
} from "lucide-react";

const AlunoPage = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const devAccess = useDevAccess();
  const [activeSection, setActiveSection] = useState('painel');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  
  // Estados dos dados do aluno
  const [studentData, setStudentData] = useState({
    name: "João Silva",
    phone: "(11) 99999-9999",
    cpf: "123.456.789-00",
    birthDate: "2000-05-15",
    subscriptionPlan: "Grito",
    presencePercentage: 85,
    isReturningAfterAbsence: false,
    lastClass: {
      name: "Matemática Aplicada",
      date: "2025-01-15",
      competency: "Resolução de problemas"
    },
    nextClass: {
      name: "Comunicação Digital",
      date: "2025-01-20",
      time: "14:00"
    },
    competencies: [
      { name: "Comunicação", progress: 75, feedback: "Excelente evolução na expressão oral!" },
      { name: "Pensamento Crítico", progress: 60, feedback: "Continue praticando a análise de problemas." },
      { name: "Colaboração", progress: 90, feedback: "Você é um exemplo de trabalho em equipe!" },
      { name: "Criatividade", progress: 45, feedback: "Explore mais sua imaginação nas atividades." }
    ],
    weeklyGoal: "Melhorar frequência e completar 3 tarefas pendentes"
  });

  // Dados para benefícios
  const benefits = [
    "Você aprende o que a escola não ensina.",
    "Oficinas, vivências, certificados e desenvolvimento pessoal.",
    "Conexão com oportunidades reais de futuro."
  ];

  // Depoimentos
  const testimonials = [
    {
      name: "Ana Paula",
      course: "Comunicação Digital",
      comment: "O projeto mudou minha vida. Hoje trabalho na área que sempre sonhei!"
    },
    {
      name: "Carlos Eduardo",
      course: "Empreendedorismo",
      comment: "Aprendi a ter confiança e hoje tenho meu próprio negócio."
    },
    {
      name: "Mariana Santos",
      course: "Tecnologia",
      comment: "As competências que desenvolvi aqui me abriram portas incríveis."
    }
  ];

  // Classes recentes
  const recentClasses = [
    { name: "Matemática Aplicada", date: "2025-01-15", status: "presente", content: "Funções e gráficos" },
    { name: "Comunicação Digital", date: "2025-01-12", status: "presente", content: "Redes sociais e marketing" },
    { name: "Empreendedorismo", date: "2025-01-10", status: "ausente", content: "Plano de negócios" },
    { name: "Pensamento Crítico", date: "2025-01-08", status: "presente", content: "Análise de problemas" }
  ];

  // Próximas aulas
  const upcomingClasses = [
    { name: "Comunicação Digital", date: "2025-01-20", time: "14:00" },
    { name: "Matemática Aplicada", date: "2025-01-22", time: "10:00" },
    { name: "Empreendedorismo", date: "2025-01-24", time: "16:00" }
  ];

  // Tarefas do aluno
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Entregar trabalho de Matemática",
      description: "Exercícios sobre funções quadráticas",
      dueDate: "2025-01-25",
      status: "pendente" as const,
      priority: "alta" as const,
      subject: "Matemática Aplicada"
    },
    {
      id: 2,
      title: "Participar da oficina de comunicação",
      description: "Workshop sobre apresentações em público",
      dueDate: "2025-01-28",
      status: "pendente" as const,
      priority: "media" as const,
      subject: "Comunicação Digital"
    },
    {
      id: 3,
      title: "Responder questionário de feedback",
      description: "Avaliação sobre as aulas do mês",
      dueDate: "2025-01-30",
      status: "concluido" as const,
      priority: "baixa" as const,
      subject: "Geral"
    }
  ]);

  // Recados
  const messages = [
    {
      id: 1,
      sender: "Prof. Maria",
      message: "Lembrete: Próxima aula teremos atividade prática. Tragam caderno!",
      date: "2025-01-18",
      read: false
    },
    {
      id: 2,
      sender: "Coordenação",
      message: "Reunião de pais marcada para 25/01. Confirmem presença.",
      date: "2025-01-17",
      read: true
    }
  ];

  // Estados para a seção de configurações
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(studentData.name);
  const [editedPhone, setEditedPhone] = useState(studentData.phone);
  const [editedEmail, setEditedEmail] = useState('');

  // Estados para o calendário
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [events, setEvents] = useState([
    {
      id: 1,
      title: "Feira de Competências",
      date: "2025-01-25",
      time: "09:00",
      type: "evento" as const,
      description: "Apresentação dos projetos desenvolvidos pelos alunos",
      location: "Auditório Principal"
    },
    {
      id: 2,
      title: "Workshop de Comunicação", 
      date: "2025-01-28",
      time: "14:00",
      type: "workshop" as const,
      description: "Técnicas avançadas de apresentação e comunicação",
      location: "Sala de Treinamento 2"
    }
  ]);
  const [reminders, setReminders] = useState([
    {
      id: 1,
      title: "Estudar para prova de Matemática",
      date: "2025-01-24",
      time: "10:00",
      description: "Revisar funções e gráficos"
    },
    {
      id: 2,
      title: "Entrega do projeto",
      date: "2025-01-26", 
      time: "23:59",
      description: "Projeto final de Comunicação Digital"
    }
  ]);

  // Estados para formulários
  const [newEvent, setNewEvent] = useState<{
    title: string;
    date: string;
    time: string;
    type: 'evento' | 'workshop' | 'reuniao';
    description: string;
    location: string;
  }>({
    title: '',
    date: '',
    time: '',
    type: 'evento',
    description: '',
    location: ''
  });
  
  const [newReminder, setNewReminder] = useState({
    title: '',
    date: '',
    time: '',
    description: ''
  });

  const handleLogout = () => {
    localStorage.clear();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
    setLocation("/");
  };

  const markMessageAsRead = (messageId: number) => {
    // Implementar lógica para marcar como lida
    toast({
      title: "Mensagem marcada como lida",
      description: "Obrigado pela confirmação!",
    });
  };

  const handleSaveProfile = () => {
    // Aqui seria feita a chamada para a API para salvar as alterações
    console.log('Salvando perfil:', { editedName, editedPhone, editedEmail });
    setIsEditing(false);
    toast({
      title: "Perfil atualizado",
      description: "Suas informações foram salvas com sucesso.",
    });
  };

  // Funções do calendário
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getEventsForDate = (date: string) => {
    const dateEvents = events.filter(event => event.date === date);
    const dateReminders = reminders.filter(reminder => reminder.date === date);
    const classesForDate = upcomingClasses.filter(classe => classe.date === date);
    
    return {
      events: dateEvents,
      reminders: dateReminders,
      classes: classesForDate
    };
  };

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const event = {
      id: Date.now(),
      ...newEvent
    };

    setEvents([...events, event]);
    setNewEvent({
      title: '',
      date: '',
      time: '',
      type: 'evento',
      description: '',
      location: ''
    });
    setShowEventModal(false);
    
    toast({
      title: "Evento adicionado",
      description: "Seu evento foi criado com sucesso.",
    });
  };

  const handleAddReminder = () => {
    if (!newReminder.title || !newReminder.date || !newReminder.time) {
      toast({
        title: "Erro", 
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const reminder = {
      id: Date.now(),
      ...newReminder
    };

    setReminders([...reminders, reminder]);
    setNewReminder({
      title: '',
      date: '',
      time: '',
      description: ''
    });
    setShowReminderModal(false);
    
    toast({
      title: "Lembrete adicionado",
      description: "Seu lembrete foi criado com sucesso.",
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Menu items reorganizado
  const menuItems = [
    { id: "painel", label: "Painel do Aluno", icon: BarChart3 },
    { id: "agenda", label: "Agenda", icon: CalendarIcon },
    { id: "aulas", label: "Minhas Aulas", icon: BookOpen },
    { id: "competencias", label: "Minhas Competências", icon: Brain },
    { id: "recados", label: "Recados", icon: Mail },
    { id: "perfil", label: "Meu Perfil", icon: User },
    { id: "configuracoes", label: "Configurações", icon: Settings },
    { id: "sair", label: "Sair", icon: LogOut }
  ];

  const getSectionTitle = (sectionId: string) => {
    const section = menuItems.find(item => item.id === sectionId);
    return section ? section.label : 'Dashboard';
  };

  const handleMenuClick = (sectionId: string) => {
    if (sectionId === 'sair') {
      handleLogout();
    } else {
      setActiveSection(sectionId);
      setShowMoreMenu(false);
    }
  };

  // Função para obter mensagem contextual
  const getContextualMessage = () => {
    if (studentData.isReturningAfterAbsence) {
      return "Que bom te ver de volta! Vamos recuperar o ritmo juntos?";
    }
    if (studentData.presencePercentage >= 90) {
      return "Sua dedicação é inspiradora! Continue assim!";
    }
    if (studentData.presencePercentage < 70) {
      return "Vamos melhorar sua frequência? Cada aula é importante!";
    }
    return "Pronto pra mais um passo rumo ao seu futuro?";
  };

  // Função para marcar tarefa como concluída
  const toggleTaskStatus = (taskId: number) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: task.status === 'pendente' ? 'concluido' : 'pendente' }
        : task
    ));
    
    toast({
      title: "Tarefa atualizada",
      description: "Status da tarefa foi alterado com sucesso.",
    });
  };

  // Renderizar seção ativa
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'painel':
        return renderPainel();
      case 'agenda':
        return renderAgenda();
      case 'aulas':
        return renderAulas();
      case 'competencias':
        return renderCompetencias();
      case 'recados':
        return renderRecados();
      case 'perfil':
        return renderPerfil();
      case 'configuracoes':
        return renderConfiguracoes();
      default:
        return renderPainel();
    }
  };

  const renderPainel = () => (
    <div className="space-y-6">
      {/* Saudação - seguindo padrão do professor */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {studentData.name}! Que bom te ver por aqui.
        </h1>
        <p className="text-gray-600 mt-1">{getContextualMessage()}</p>
        
        {/* Meta da semana */}
        {studentData.weeklyGoal && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Meta da Semana:</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">{studentData.weeklyGoal}</p>
          </div>
        )}
      </div>

      {/* Cards Dashboard - Desktop: Grid 2x2, Mobile: Empilhados verticalmente */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1 - Presença no Mês */}
        <Card className="bg-white border-green-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-lg text-gray-800">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              Presença no Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-green-600">{studentData.presencePercentage}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: `${studentData.presencePercentage}%` }}></div>
              </div>
              <p className="text-sm text-gray-600">
                {studentData.presencePercentage >= 80 ? "Excelente frequência!" : "Vamos melhorar?"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2 - Última Aula */}
        <Card className="bg-white border-blue-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-lg text-gray-800">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              Última Aula
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="font-medium text-blue-600">{studentData.lastClass.name}</div>
              <div className="text-sm text-gray-500">{studentData.lastClass.date}</div>
              <div className="text-xs text-gray-400">{studentData.lastClass.competency}</div>
              <Button variant="outline" size="sm" className="mt-2 w-full">
                Ver detalhes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 3 - Próxima Aula */}
        <Card className="bg-white border-orange-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-lg text-gray-800">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              Próxima Aula
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="font-medium text-orange-600">{studentData.nextClass.name}</div>
              <div className="text-sm text-gray-500 flex items-center">
                <CalendarDays className="h-4 w-4 mr-1" />
                {studentData.nextClass.date} às {studentData.nextClass.time}
              </div>
              <Button variant="outline" size="sm" className="mt-2 w-full">
                Adicionar lembrete
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 4 - Minha Evolução */}
        <Card className="bg-white border-purple-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-lg text-gray-800">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              Minha Evolução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {studentData.competencies.slice(0, 2).map((comp, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{comp.name}</span>
                    <span className="text-purple-600 font-semibold">{comp.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full transition-all duration-300" style={{ width: `${comp.progress}%` }}></div>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="mt-2 w-full">
                Ver todas competências
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Benefícios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-yellow-500" />
            Benefícios de estudar aqui
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{benefit}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Depoimentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Quote className="h-5 w-5 mr-2 text-blue-500" />
            Depoimentos de ex-alunos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="p-4 border rounded-lg">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                    <Users className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{testimonial.name}</div>
                    <div className="text-xs text-gray-500">{testimonial.course}</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{testimonial.comment}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAulas = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Minhas Aulas</h2>
      
      <div className="grid gap-4">
        {recentClasses.map((classe, idx) => (
          <Card key={idx}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium">{classe.name}</div>
                  <div className="text-sm text-gray-500">{classe.date}</div>
                  <div className="text-xs text-gray-400">{classe.content}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={classe.status === 'presente' ? 'default' : 'destructive'}
                    className={classe.status === 'presente' ? 'bg-green-100 text-green-800' : ''}
                  >
                    {classe.status}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCompetencias = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Minhas Competências</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {studentData.competencies.map((competency, idx) => (
          <Card key={idx} className="border-l-4 border-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <span className="text-lg">{competency.name}</span>
                </div>
                <Badge variant="outline" className="font-bold text-purple-600">
                  {competency.progress}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Barra de progresso */}
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${competency.progress}%` }}
                  ></div>
                </div>
                
                {/* Feedback textual */}
                {competency.feedback && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <MessageCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-purple-800">{competency.feedback}</p>
                    </div>
                  </div>
                )}
                
                {/* Nível da competência */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Iniciante</span>
                  <span>Intermediário</span>
                  <span>Avançado</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Resumo geral */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-800">
            <Award className="w-5 h-5 mr-2" />
            Resumo do Desenvolvimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(studentData.competencies.reduce((acc, comp) => acc + comp.progress, 0) / studentData.competencies.length)}%
              </div>
              <div className="text-sm text-purple-700">Progresso Médio</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {studentData.competencies.filter(comp => comp.progress >= 75).length}
              </div>
              <div className="text-sm text-green-700">Competências Avançadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {studentData.competencies.filter(comp => comp.progress < 60).length}
              </div>
              <div className="text-sm text-blue-700">Em Desenvolvimento</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Nova função para renderizar Agenda (substituindo renderCalendario)
  const renderAgenda = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Agenda - Calendário, Aulas e Tarefas</h2>
      
      {/* Próximas aulas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-blue-500" />
            Próximas Aulas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingClasses.map((classe, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <div className="font-medium text-blue-900">{classe.name}</div>
                  <div className="text-sm text-blue-600">{classe.date} às {classe.time}</div>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tarefas do Aluno */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckSquare className="h-5 w-5 mr-2 text-green-500" />
              Minhas Tarefas
            </div>
            <Badge variant="outline" className="text-xs">
              {tasks.filter(t => t.status === 'pendente').length} pendentes
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className={`p-4 border rounded-lg ${task.status === 'concluido' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <Checkbox
                      checked={task.status === 'concluido'}
                      onCheckedChange={() => toggleTaskStatus(task.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className={`font-medium ${task.status === 'concluido' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {task.title}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{task.description}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" size="sm">{task.subject}</Badge>
                        <div className="text-xs text-gray-500">Prazo: {task.dueDate}</div>
                        <Badge 
                          variant={task.priority === 'alta' ? 'destructive' : task.priority === 'media' ? 'default' : 'secondary'}
                          size="sm"
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Eventos e Workshops */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="h-5 w-5 mr-2 text-yellow-500" />
            Eventos e Workshops
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-yellow-900">{event.title}</div>
                    <div className="text-sm text-yellow-700">{event.date} às {event.time}</div>
                    <div className="text-xs text-yellow-600 mt-1">{event.location}</div>
                  </div>
                  <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                    {event.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lembretes pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="h-5 w-5 mr-2 text-purple-500" />
              Meus Lembretes
            </div>
            <Dialog open={showReminderModal} onOpenChange={setShowReminderModal}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Lembrete</DialogTitle>
                  <DialogDescription>
                    Adicione um lembrete pessoal
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reminderTitle">Título</Label>
                    <Input
                      id="reminderTitle"
                      value={newReminder.title}
                      onChange={(e) => setNewReminder({...newReminder, title: e.target.value})}
                      placeholder="Ex: Estudar para prova"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reminderDate">Data</Label>
                    <Input
                      id="reminderDate"
                      type="date"
                      value={newReminder.date}
                      onChange={(e) => setNewReminder({...newReminder, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reminderTime">Horário</Label>
                    <Input
                      id="reminderTime"
                      type="time"
                      value={newReminder.time}
                      onChange={(e) => setNewReminder({...newReminder, time: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reminderDescription">Descrição</Label>
                    <Textarea
                      id="reminderDescription"
                      value={newReminder.description}
                      onChange={(e) => setNewReminder({...newReminder, description: e.target.value})}
                      placeholder="Detalhes do lembrete..."
                    />
                  </div>
                  <Button onClick={handleAddReminder} className="w-full">
                    Adicionar Lembrete
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-purple-900">{reminder.title}</div>
                    <div className="text-sm text-purple-700">{reminder.date} às {reminder.time}</div>
                    {reminder.description && (
                      <div className="text-xs text-purple-600 mt-1">{reminder.description}</div>
                    )}
                  </div>
                  <Bell className="w-4 h-4 text-purple-600" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCalendario = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);
    const today = new Date();
    const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
    
    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    // Gerar array de dias para o calendário
    const calendarDays = [];
    
    // Adicionar espaços vazios para os dias antes do primeiro dia do mês
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(null);
    }
    
    // Adicionar os dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateString = formatDate(date);
      const dayEvents = getEventsForDate(dateString);
      
      calendarDays.push({
        day,
        date: dateString,
        isToday: isCurrentMonth && day === today.getDate(),
        events: dayEvents.events,
        reminders: dayEvents.reminders,
        classes: dayEvents.classes,
        hasItems: dayEvents.events.length > 0 || dayEvents.reminders.length > 0 || dayEvents.classes.length > 0
      });
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Calendário e Eventos</h2>
          <div className="flex gap-2">
            <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Evento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Evento</DialogTitle>
                  <DialogDescription>
                    Adicione um novo evento ao seu calendário
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="event-title">Título *</Label>
                    <Input
                      id="event-title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                      placeholder="Nome do evento"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="event-date">Data *</Label>
                      <Input
                        id="event-date"
                        type="date"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="event-time">Horário *</Label>
                      <Input
                        id="event-time"
                        type="time"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="event-type">Tipo</Label>
                    <Select value={newEvent.type} onValueChange={(value: 'evento' | 'workshop' | 'reuniao') => setNewEvent({...newEvent, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="evento">Evento</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="reuniao">Reunião</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="event-location">Local</Label>
                    <Input
                      id="event-location"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                      placeholder="Local do evento"
                    />
                  </div>
                  <div>
                    <Label htmlFor="event-description">Descrição</Label>
                    <Textarea
                      id="event-description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                      placeholder="Descrição do evento"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowEventModal(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddEvent}>
                    Criar Evento
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showReminderModal} onOpenChange={setShowReminderModal}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Bell className="h-4 w-4" />
                  Adicionar Lembrete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Lembrete</DialogTitle>
                  <DialogDescription>
                    Adicione um lembrete pessoal
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="reminder-title">Título *</Label>
                    <Input
                      id="reminder-title"
                      value={newReminder.title}
                      onChange={(e) => setNewReminder({...newReminder, title: e.target.value})}
                      placeholder="Nome do lembrete"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="reminder-date">Data *</Label>
                      <Input
                        id="reminder-date"
                        type="date"
                        value={newReminder.date}
                        onChange={(e) => setNewReminder({...newReminder, date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reminder-time">Horário *</Label>
                      <Input
                        id="reminder-time"
                        type="time"
                        value={newReminder.time}
                        onChange={(e) => setNewReminder({...newReminder, time: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="reminder-description">Descrição</Label>
                    <Textarea
                      id="reminder-description"
                      value={newReminder.description}
                      onChange={(e) => setNewReminder({...newReminder, description: e.target.value})}
                      placeholder="Descrição do lembrete"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowReminderModal(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddReminder}>
                    Criar Lembrete
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Calendário Visual */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Grade do calendário */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((dayData, index) => {
                if (!dayData) {
                  return <div key={index} className="p-2 h-20"></div>;
                }
                
                return (
                  <div
                    key={dayData.day}
                    className={`p-2 h-20 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                      dayData.isToday ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
                    } ${dayData.hasItems ? 'bg-yellow-50 border-yellow-200' : ''}`}
                    onClick={() => setSelectedDate(new Date(dayData.date))}
                  >
                    <div className={`text-sm font-medium ${dayData.isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                      {dayData.day}
                    </div>
                    
                    {/* Indicadores de eventos */}
                    <div className="mt-1 space-y-1">
                      {dayData.classes.length > 0 && (
                        <div className="w-full h-1 bg-blue-400 rounded-full"></div>
                      )}
                      {dayData.events.length > 0 && (
                        <div className="w-full h-1 bg-green-400 rounded-full"></div>
                      )}
                      {dayData.reminders.length > 0 && (
                        <div className="w-full h-1 bg-orange-400 rounded-full"></div>
                      )}
                    </div>
                    
                    {/* Contador de itens */}
                    {dayData.hasItems && (
                      <div className="text-xs text-gray-600 mt-1">
                        {dayData.classes.length + dayData.events.length + dayData.reminders.length} item(s)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Legenda */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Legenda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Aulas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Eventos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-2 bg-orange-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Lembretes</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Próximas Atividades */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Próximas Aulas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Próximas Aulas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingClasses.slice(0, 3).map((classe, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{classe.name}</div>
                      <div className="text-xs text-gray-500">{classe.date} às {classe.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Meus Lembretes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-600" />
                Meus Lembretes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reminders.slice(0, 3).map((reminder) => (
                  <div key={reminder.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Bell className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{reminder.title}</div>
                      <div className="text-xs text-gray-500">{reminder.date} às {reminder.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderRecados = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Recados e Avisos</h2>
      
      <div className="space-y-4">
        {messages.map((message) => (
          <Card key={message.id} className={message.read ? 'opacity-75' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium">{message.sender}</span>
                    <span className="text-xs text-gray-500">{message.date}</span>
                    {!message.read && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Novo
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-700">{message.message}</p>
                </div>
                {!message.read && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => markMessageAsRead(message.id)}
                  >
                    Confirmar leitura
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderPerfil = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Meu Perfil</h2>
      
      {/* Card com Foto e Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Foto do Perfil */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src="" alt={studentData.name} />
              <AvatarFallback className="text-xl bg-yellow-100 text-yellow-700">
                {studentData.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="font-semibold text-lg text-gray-900">{studentData.name}</h3>
              <p className="text-gray-500">Aluno do Clube do Grito</p>
            </div>
          </div>

          <Separator />

          {/* Informações Pessoais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">CPF</label>
              <div className="text-gray-900">{studentData.cpf}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Telefone</label>
              <div className="text-gray-900">{studentData.phone}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Data de Nascimento</label>
              <div className="text-gray-900">{studentData.birthDate}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Plano</label>
              <div className="text-gray-900">{studentData.subscriptionPlan}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card Progresso Geral */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso Geral</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {studentData.competencies.map((comp, idx) => (
            <div key={idx}>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">{comp.name}</span>
                <span className="text-blue-600 font-semibold">{comp.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${comp.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Card Sessão */}
      <Card>
        <CardHeader>
          <CardTitle>Sessão</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            onClick={handleLogout}
            className="w-full"
          >
            Sair da Conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderConfiguracoes = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
      
      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2 text-blue-500" />
            Preferências de Notificação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Lembrete de aulas</div>
              <div className="text-sm text-gray-500">Receber notificações sobre próximas aulas</div>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Novos recados</div>
              <div className="text-sm text-gray-500">Ser notificado sobre novos recados dos professores</div>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Tarefas pendentes</div>
              <div className="text-sm text-gray-500">Lembrete sobre tarefas próximas ao prazo</div>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
        </CardContent>
      </Card>

      {/* Contato com coordenação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="h-5 w-5 mr-2 text-green-500" />
            Precisa de Ajuda?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Entre em contato com nossa coordenação para esclarecer dúvidas ou relatar problemas.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Ligar para Coordenação
            </Button>
            <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informações do sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2 text-gray-500" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Versão do App:</span>
            <span>1.2.3</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Último Backup:</span>
            <span>05/01/2025 14:30</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status:</span>
            <Badge variant="outline" className="text-green-600 border-green-300">Online</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Card Editar Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            Editar Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            {/* Foto de Perfil */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <Avatar className="h-20 w-20 flex-shrink-0">
                <AvatarImage src="" alt={studentData.name} />
                <AvatarFallback className="text-lg bg-yellow-100 text-yellow-700">
                  {studentData.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <p className="text-sm text-gray-600">Foto do perfil</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Alterar foto
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    Remover
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Campos de Edição */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome Completo */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nome Completo</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">{studentData.name}</div>
                )}
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Telefone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedPhone}
                    onChange={(e) => setEditedPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">{studentData.phone}</div>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">E-mail</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editedEmail}
                    onChange={(e) => setEditedEmail(e.target.value)}
                    placeholder="Digite seu e-mail"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
                    {editedEmail || 'Não informado'}
                  </div>
                )}
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3 pt-4">
              {isEditing ? (
                <>
                  <Button onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700">
                    Salvar alterações
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700">
                  Editar perfil
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card Sair do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <LogOut className="w-5 h-5 text-red-600" />
              </div>
              Sair do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Clique no botão abaixo para fazer logout e retornar à tela de login.
            </p>
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              className="w-full md:w-auto"
            >
              Sair da conta
            </Button>
          </CardContent>
        </Card>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Menu Lateral - Desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:bg-white md:border-r md:shadow-sm">
        {/* Header do Menu - Logo */}
        <div className="flex items-center h-16 flex-shrink-0 px-4 border-b bg-white">
          <img 
            src={logoClube} 
            alt="Clube do Grito" 
            className="h-10 w-auto mr-3"
          />
          <span className="text-lg font-bold text-yellow-600">
            {devAccess.hasDevAccess ? "Desenvolvedor - Aluno Dashboard" : "Clube do Grito"}
          </span>
        </div>

        {/* Navegação Desktop */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.filter(item => item.id !== 'sair').map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleMenuClick(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeSection === item.id
                        ? "bg-yellow-50 text-yellow-700 border-l-4 border-yellow-500 shadow-sm"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Área Principal */}
      <div className={`flex-1 overflow-auto pb-24 md:pb-0 md:ml-64 ${devAccess.hasDevAccess ? 'pt-10' : ''}`}>
        {/* Banner de desenvolvedor mobile */}
        {devAccess.hasDevAccess && (
          <div className="md:hidden bg-blue-600 text-white px-4 py-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span>Modo Desenvolvedor</span>
              </div>
              {devAccess.shouldShowBackButton && (
                <Button
                  onClick={() => {
                    sessionStorage.setItem('dev_returning', 'true');
                    setLocation('/dev');
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-blue-700 p-1"
                >
                  ← Dev
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* Header Mobile - Logo e Info do Aluno */}
        <div className="md:hidden bg-white border-b px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src="" alt={studentData.name} />
                <AvatarFallback className="text-sm bg-yellow-100 text-yellow-700">
                  {studentData.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 truncate">{studentData.name}</h3>
                <p className="text-xs text-gray-500">Aluno</p>
              </div>
            </div>
            <img 
              src={logoClube} 
              alt="Clube do Grito" 
              className="h-14 w-auto flex-shrink-0 ml-4"
            />
          </div>
        </div>

        {/* Header Mobile - Título da Seção */}
        <div className="md:hidden bg-white border-b px-4 py-3">
          <h2 className="font-semibold text-lg text-gray-900">{getSectionTitle(activeSection)}</h2>
        </div>

        {/* Saudação Fixa - Desktop */}
        <div className="hidden md:block bg-white border-b px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">
            Olá, {studentData.name}!
          </h1>
        </div>

        {/* Conteúdo Dinâmico */}
        <div className="p-3 md:p-6 space-y-4">
          {renderActiveSection()}
        </div>
      </div>

      {/* Menu de Rodapé - Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="flex items-stretch px-2 py-3">
          {/* Botões principais do menu mobile */}
          {(() => {
            const mobileMenuItems = [
              { ...menuItems.find(item => item.id === "dashboard"), mobileLabel: "Início" },
              { ...menuItems.find(item => item.id === "aulas"), mobileLabel: "Aulas" },
              { ...menuItems.find(item => item.id === "calendario"), mobileLabel: "Calendário" },
              { ...menuItems.find(item => item.id === "recados"), mobileLabel: "Recados" },
            ];
            
            return mobileMenuItems.filter(item => item && item.icon && item.id).map((item) => {
              const Icon = item.icon!;
              const itemId = item.id!;
              return (
                <button
                  key={itemId}
                  onClick={() => handleMenuClick(itemId)}
                  className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all duration-200 min-h-[48px] ${
                    activeSection === itemId
                      ? "text-yellow-700 bg-yellow-50 shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  style={{ flex: 1 }}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-xs font-medium leading-tight text-center">{item.mobileLabel}</span>
                </button>
              );
            });
          })()}
          
          {/* Menu "Mais" para itens restantes */}
          <div className="relative" style={{ flex: 1 }}>
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all duration-200 text-gray-600 hover:bg-gray-100 w-full min-h-[48px]"
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              <span className="text-xs font-medium leading-tight">Mais</span>
            </button>
            
            {showMoreMenu && (
              <div className="absolute bottom-full right-0 mb-2 bg-white border rounded-lg shadow-lg min-w-[280px] z-60">
                <div className="space-y-4 p-4">
                  {menuItems.filter(item => !['painel', 'agenda', 'aulas', 'recados'].includes(item.id)).map((item, index) => {
                    const Icon = item.icon;
                    const filteredItems = menuItems.filter(item => !['painel', 'agenda', 'aulas', 'recados'].includes(item.id));
                    return (
                      <div key={item.id}>
                        <div
                          className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                          onClick={() => {
                            handleMenuClick(item.id);
                            setShowMoreMenu(false);
                          }}
                        >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                            item.id === 'sair' ? 'bg-white' : 'bg-yellow-400'
                          }`}>
                            <Icon className="w-6 h-6 text-black" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-base" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                              {item.label}
                            </h3>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        </div>
                        {index < filteredItems.length - 1 && (
                          <div className="border-b border-gray-100 mx-4"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlunoPage;