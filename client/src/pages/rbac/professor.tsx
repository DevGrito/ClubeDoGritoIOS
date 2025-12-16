import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
  Trash2
} from "lucide-react";

export default function ProfessorPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showEditPlanoModal, setShowEditPlanoModal] = useState(false);
  const [showViewPlanoModal, setShowViewPlanoModal] = useState(false);
  const [selectedPlano, setSelectedPlano] = useState<any>(null);
  
  // Obter dados do usuário do localStorage
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName") || "Professor";
  const userPapel = localStorage.getItem("userPapel");

  // Query para buscar dados do dashboard do professor
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/professor/dashboard', userId],
    queryFn: async () => {
      const response = await fetch(`/api/professor/dashboard/${userId}`, {
        headers: { 'x-user-id': userId || '' }
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      return response.json();
    },
    enabled: !!userId
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
    setShowEditPlanoModal(true);
    toast({
      title: "Editar Plano",
      description: `Editando plano: ${plano.titulo}`
    });
  };

  const handleViewPlano = (plano: any) => {
    setSelectedPlano(plano);
    setShowViewPlanoModal(true);
  };

  const handleDeletePlano = (plano: any) => {
    if (confirm(`Tem certeza que deseja excluir o plano "${plano.titulo}"?`)) {
      toast({
        title: "Plano excluído",
        description: `O plano "${plano.titulo}" foi removido com sucesso.`,
        variant: "destructive"
      });
      // Aqui você pode implementar a lógica real de exclusão
    }
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando área do professor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="professor-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900" data-testid="text-welcome">
                Área do Professor
              </h1>
              <p className="text-gray-600" data-testid="text-username">Bem-vindo, {userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" data-testid="badge-role">
              👨‍🏫 Professor
            </Badge>
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleExportReport}
              data-testid="button-export"
              className="bg-yellow-500 hover:bg-yellow-600"
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

          {activeSection === 'alunos' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gestão de Alunos</CardTitle>
                <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Aluno
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="Buscar alunos por nome..." className="pl-10" />
                    </div>
                    <Select>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Turma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
                        <SelectItem value="turma-a">Turma A</SelectItem>
                        <SelectItem value="turma-b">Turma B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Turma</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Frequência</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          João Silva
                        </TableCell>
                        <TableCell>Turma A</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                        </TableCell>
                        <TableCell>95%</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                toast({
                                  title: "Editar Aluno",
                                  description: "Editando dados de João Silva"
                                });
                              }}
                              data-testid="button-edit-aluno-1"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                toast({
                                  title: "Relatório do Aluno",
                                  description: "Visualizando relatório de João Silva"
                                });
                              }}
                              data-testid="button-relatorio-aluno-1"
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          Maria Santos
                        </TableCell>
                        <TableCell>Turma A</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                        </TableCell>
                        <TableCell>87%</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                toast({
                                  title: "Editar Aluno",
                                  description: "Editando dados de Maria Santos"
                                });
                              }}
                              data-testid="button-edit-aluno-2"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                toast({
                                  title: "Relatório do Aluno",
                                  description: "Visualizando relatório de Maria Santos"
                                });
                              }}
                              data-testid="button-relatorio-aluno-2"
                            >
                              <FileText className="w-4 h-4" />
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

          {activeSection === 'frequencia' && (
            <Card>
              <CardHeader>
                <CardTitle>Controle de Frequência</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-2">Data da Aula</label>
                      <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-2">Turma</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a turma" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="turma-a">Turma A - Matemática</SelectItem>
                          <SelectItem value="turma-b">Turma B - Português</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="bg-green-500 hover:bg-green-600">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Finalizar Chamada
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Lista de Presença - Turma A</h3>
                    <div className="space-y-3">
                      {[
                        { nome: 'João Silva', presente: true },
                        { nome: 'Maria Santos', presente: true },
                        { nome: 'Pedro Costa', presente: false },
                        { nome: 'Ana Oliveira', presente: true }
                      ].map((aluno, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-3">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>{aluno.nome}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox checked={aluno.presente} />
                              <span className="text-sm text-green-600">Presente</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox checked={!aluno.presente} />
                              <span className="text-sm text-red-600">Falta</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'planos' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Planos de Aula</CardTitle>
                <Button 
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={() => {
                    toast({
                      title: "Novo Plano",
                      description: "Funcionalidade de criação de plano será implementada em breve."
                    });
                  }}
                  data-testid="button-novo-plano"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Plano
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {[
                      {
                        titulo: 'Introdução à Matemática Básica',
                        disciplina: 'Matemática',
                        data: '2025-09-30',
                        status: 'Rascunho'
                      },
                      {
                        titulo: 'Literatura Brasileira - Machado de Assis',
                        disciplina: 'Português', 
                        data: '2025-10-01',
                        status: 'Finalizado'
                      }
                    ].map((plano, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{plano.titulo}</h3>
                          <Badge variant={plano.status === 'Finalizado' ? 'default' : 'secondary'}>
                            {plano.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Disciplina:</strong> {plano.disciplina}</p>
                          <p><strong>Data:</strong> {plano.data}</p>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditPlano(plano)}
                            data-testid={`button-edit-plano-${index}`}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewPlano(plano)}
                            data-testid={`button-view-plano-${index}`}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            Visualizar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDeletePlano(plano)}
                            data-testid={`button-delete-plano-${index}`}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Nenhum plano de aula criado ainda</p>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Criar Plano",
                          description: "Funcionalidade de criação de plano será implementada em breve."
                        });
                      }}
                      data-testid="button-criar-primeiro-plano"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Criar seu primeiro plano
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'aulas' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Registro de Aulas</CardTitle>
                <Button className="bg-green-500 hover:bg-green-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Aula
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Registrar Nova Aula</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Data da Aula</label>
                        <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Turma</label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a turma" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="turma-a">Turma A - Matemática</SelectItem>
                            <SelectItem value="turma-b">Turma B - Português</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Conteúdo Ministrado</label>
                        <Textarea placeholder="Descreva o conteúdo abordado na aula..." rows={3} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Observações</label>
                        <Textarea placeholder="Observações sobre a aula, participação dos alunos, etc." rows={2} />
                      </div>
                    </div>
                    <Button className="mt-4 bg-blue-500 hover:bg-blue-600">
                      <FileText className="w-4 h-4 mr-2" />
                      Salvar Registro
                    </Button>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-4">Aulas Registradas</h3>
                    <div className="space-y-3">
                      {[
                        {
                          data: '25/09/2025',
                          turma: 'Turma A',
                          conteudo: 'Introdução à álgebra básica',
                          participacao: '95%'
                        },
                        {
                          data: '24/09/2025',
                          turma: 'Turma B',
                          conteudo: 'Análise sintática - período simples',
                          participacao: '88%'
                        }
                      ].map((aula, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-blue-500" />
                              <span className="font-medium">{aula.data} - {aula.turma}</span>
                            </div>
                            <Badge className="bg-green-100 text-green-800">
                              {aula.participacao} participação
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-3">{aula.conteudo}</p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4 mr-1" />
                              Editar
                            </Button>
                            <Button size="sm" variant="outline">
                              <FileText className="w-4 h-4 mr-1" />
                              Ver Detalhes
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

          {activeSection === 'turmas' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Minhas Turmas</CardTitle>
                <Button className="bg-purple-500 hover:bg-purple-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Turma
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {[
                    {
                      nome: 'Turma A - Matemática Básica',
                      periodo: 'Manhã',
                      alunos: 25,
                      frequencia: '89%',
                      status: 'Ativa'
                    },
                    {
                      nome: 'Turma B - Português Intermediário',
                      periodo: 'Tarde',
                      alunos: 18,
                      frequencia: '92%',
                      status: 'Ativa'
                    }
                  ].map((turma, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{turma.nome}</h3>
                        <Badge className="bg-green-100 text-green-800">{turma.status}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Período:</span>
                          <p className="font-medium">{turma.periodo}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Alunos:</span>
                          <p className="font-medium">{turma.alunos}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Frequência:</span>
                          <p className="font-medium">{turma.frequencia}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline" onClick={() => setActiveSection('alunos')}>
                          <Users className="w-4 h-4 mr-1" />
                          Ver Alunos
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setActiveSection('frequencia')}>
                          <Clock className="w-4 h-4 mr-1" />
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
                <CardTitle>Calendário Acadêmico</CardTitle>
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
                    <h3 className="font-semibold mb-4">Próximos Eventos</h3>
                    <div className="space-y-3">
                      {[
                        {
                          data: '29/09/2025',
                          titulo: 'Avaliação - Turma A',
                          tipo: 'Prova',
                          horario: '14:00'
                        },
                        {
                          data: '02/10/2025',
                          titulo: 'Reunião Pedagógica',
                          tipo: 'Reunião',
                          horario: '16:00'
                        },
                        {
                          data: '05/10/2025',
                          titulo: 'Entrega de Notas',
                          tipo: 'Administrativo',
                          horario: '09:00'
                        }
                      ].map((evento, index) => (
                        <div key={index} className="border rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-purple-500" />
                            <div>
                              <p className="font-medium">{evento.titulo}</p>
                              <p className="text-sm text-gray-500">
                                {evento.data} às {evento.horario}
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

          {activeSection === 'acompanhamento' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Acompanhamento Pedagógico</CardTitle>
                <Button className="bg-green-500 hover:bg-green-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Avaliação
                </Button>
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
                      <label className="block text-sm font-medium mb-2">Turma</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Todas as turmas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todas">Todas as turmas</SelectItem>
                          <SelectItem value="turma-a">Turma A</SelectItem>
                          <SelectItem value="turma-b">Turma B</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-2">Disciplina</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todas">Todas</SelectItem>
                          <SelectItem value="matematica">Matemática</SelectItem>
                          <SelectItem value="portugues">Português</SelectItem>
                          <SelectItem value="ciencias">Ciências</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="bg-blue-500 hover:bg-blue-600">
                      <Search className="w-4 h-4 mr-2" />
                      Buscar
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Registrar Nova Avaliação</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Aluno</label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o aluno" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="joao">João Silva</SelectItem>
                            <SelectItem value="maria">Maria Santos</SelectItem>
                            <SelectItem value="pedro">Pedro Costa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Área de Competência</label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a área" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="leitura">Leitura e Interpretação</SelectItem>
                            <SelectItem value="matematica">Raciocínio Matemático</SelectItem>
                            <SelectItem value="escrita">Escrita e Redação</SelectItem>
                            <SelectItem value="comportamento">Comportamento</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Nível Atual</label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o nível" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="iniciante">Iniciante</SelectItem>
                            <SelectItem value="basico">Básico</SelectItem>
                            <SelectItem value="intermediario">Intermediário</SelectItem>
                            <SelectItem value="avancado">Avançado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Data da Avaliação</label>
                        <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Observações sobre o Progresso</label>
                        <Textarea placeholder="Descreva o progresso, dificuldades encontradas e pontos fortes do aluno..." rows={3} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Metas e Objetivos</label>
                        <Textarea placeholder="Defina metas específicas para o próximo período..." rows={2} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Recomendações</label>
                        <Textarea placeholder="Atividades recomendadas, materiais de apoio, estratégias de ensino..." rows={2} />
                      </div>
                    </div>
                    <Button className="mt-4 bg-blue-500 hover:bg-blue-600">
                      <FileText className="w-4 h-4 mr-2" />
                      Salvar Avaliação
                    </Button>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-4">Avaliações Recentes</h3>
                    <div className="space-y-3">
                      {[
                        {
                          aluno: 'João Silva',
                          area: 'Matemática',
                          nivel: 'Intermediário',
                          data: '22/09/2025',
                          progresso: 'Bom',
                          observacoes: 'Melhorou significativamente na resolução de problemas'
                        },
                        {
                          aluno: 'Maria Santos',
                          area: 'Leitura',
                          nivel: 'Avançado',
                          data: '20/09/2025',
                          progresso: 'Excelente',
                          observacoes: 'Demonstra compreensão profunda dos textos'
                        },
                        {
                          aluno: 'Pedro Costa',
                          area: 'Comportamento',
                          nivel: 'Básico',
                          data: '18/09/2025',
                          progresso: 'Em desenvolvimento',
                          observacoes: 'Precisa trabalhar a concentração durante as atividades'
                        }
                      ].map((avaliacao, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <User className="w-5 h-5 text-blue-500" />
                              <h4 className="font-semibold">{avaliacao.aluno}</h4>
                              <Badge variant="outline">{avaliacao.area}</Badge>
                            </div>
                            <div className="text-sm text-gray-500">{avaliacao.data}</div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div className="text-center p-2 bg-blue-50 rounded">
                              <p className="text-sm font-medium text-blue-600">{avaliacao.nivel}</p>
                              <p className="text-xs text-gray-600">Nível Atual</p>
                            </div>
                            <div className="text-center p-2 bg-green-50 rounded">
                              <p className="text-sm font-medium text-green-600">{avaliacao.progresso}</p>
                              <p className="text-xs text-gray-600">Progresso</p>
                            </div>
                            <div className="text-center p-2 bg-purple-50 rounded">
                              <p className="text-sm font-medium text-purple-600">Em andamento</p>
                              <p className="text-xs text-gray-600">Status</p>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                              <strong>Observações:</strong> {avaliacao.observacoes}
                            </p>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4 mr-1" />
                              Editar
                            </Button>
                            <Button size="sm" variant="outline">
                              <FileText className="w-4 h-4 mr-1" />
                              Relatório
                            </Button>
                            <Button size="sm" variant="outline">
                              <Target className="w-4 h-4 mr-1" />
                              Definir Meta
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Resumo Pedagógico</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-blue-50 rounded">
                        <p className="text-xl font-bold text-blue-600">24</p>
                        <p className="text-sm text-gray-600">Alunos Avaliados</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded">
                        <p className="text-xl font-bold text-green-600">18</p>
                        <p className="text-sm text-gray-600">Com Progresso Positivo</p>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded">
                        <p className="text-xl font-bold text-yellow-600">4</p>
                        <p className="text-sm text-gray-600">Precisam Atenção</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded">
                        <p className="text-xl font-bold text-purple-600">2</p>
                        <p className="text-sm text-gray-600">Excelente Desempenho</p>
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
    </div>
  );
}