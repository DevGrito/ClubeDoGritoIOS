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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Eye
} from "lucide-react";

export default function MonitorPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedAluno, setSelectedAluno] = useState<any>(null);
  const [showEditAlunoModal, setShowEditAlunoModal] = useState(false);
  const [showViewAlunoModal, setShowViewAlunoModal] = useState(false);
  
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
                      <TableRow>
                        <TableCell className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          Ana Costa
                        </TableCell>
                        <TableCell>Grupo A</TableCell>
                        <TableCell>92%</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedAluno({ nome: 'Ana Costa', grupo: 'Grupo A', frequencia: 92 });
                                setShowViewAlunoModal(true);
                              }}
                              data-testid="button-view-aluno-1"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedAluno({ nome: 'Ana Costa', grupo: 'Grupo A', frequencia: 92 });
                                setShowEditAlunoModal(true);
                              }}
                              data-testid="button-edit-aluno-1"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          Carlos Silva
                        </TableCell>
                        <TableCell>Grupo B</TableCell>
                        <TableCell>85%</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedAluno({ nome: 'Carlos Silva', grupo: 'Grupo B', frequencia: 85 });
                                setShowViewAlunoModal(true);
                              }}
                              data-testid="button-view-aluno-2"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedAluno({ nome: 'Carlos Silva', grupo: 'Grupo B', frequencia: 85 });
                                setShowEditAlunoModal(true);
                              }}
                              data-testid="button-edit-aluno-2"
                            >
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
                      <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-2">Grupo</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o grupo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grupo-a">Grupo A - Reforço Escolar</SelectItem>
                          <SelectItem value="grupo-b">Grupo B - Atividades Recreativas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="bg-green-500 hover:bg-green-600">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Finalizar Chamada
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Lista de Presença - Grupo A</h3>
                    <div className="space-y-3">
                      {[
                        { nome: 'Ana Costa', presente: true },
                        { nome: 'Carlos Silva', presente: true },
                        { nome: 'Maria Santos', presente: false },
                        { nome: 'João Oliveira', presente: true }
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

          {activeSection === 'atividades' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Minhas Atividades</CardTitle>
                <Button className="bg-green-500 hover:bg-green-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Atividade
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {[
                      {
                        titulo: 'Reforço Escolar - Matemática',
                        grupo: 'Grupo A',
                        horario: '14:00 - 16:00',
                        status: 'Em andamento',
                        participantes: 12
                      },
                      {
                        titulo: 'Atividades Recreativas',
                        grupo: 'Grupo B',
                        horario: '16:00 - 17:30',
                        status: 'Planejada',
                        participantes: 8
                      }
                    ].map((atividade, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{atividade.titulo}</h3>
                          <Badge variant={atividade.status === 'Em andamento' ? 'default' : 'secondary'}>
                            {atividade.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Grupo:</strong> {atividade.grupo}</p>
                          <p><strong>Horário:</strong> {atividade.horario}</p>
                          <p><strong>Participantes:</strong> {atividade.participantes} alunos</p>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" onClick={() => setActiveSection('presenca')}>
                            <UserCheck className="w-4 h-4 mr-1" />
                            Fazer Chamada
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            Detalhes
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'registro' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Registro de Atividades</CardTitle>
                <Button className="bg-green-500 hover:bg-green-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Atividade
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Registrar Nova Atividade</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Data da Atividade</label>
                        <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Grupo</label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o grupo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="grupo-a">Grupo A - Reforço Escolar</SelectItem>
                            <SelectItem value="grupo-b">Grupo B - Atividades Recreativas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Título da Atividade</label>
                        <Input placeholder="Ex: Oficina de Matemática Lúdica" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Descrição</label>
                        <Textarea placeholder="Descreva a atividade realizada, objetivos e metodologia..." rows={3} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Duração (minutos)</label>
                        <Input type="number" placeholder="90" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Participantes</label>
                        <Input type="number" placeholder="12" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Resultados e Observações</label>
                        <Textarea placeholder="Avalie os resultados da atividade e faça observações sobre a participação..." rows={2} />
                      </div>
                    </div>
                    <Button className="mt-4 bg-blue-500 hover:bg-blue-600">
                      <FileText className="w-4 h-4 mr-2" />
                      Salvar Registro
                    </Button>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-4">Atividades Registradas Recentemente</h3>
                    <div className="space-y-3">
                      {[
                        {
                          data: '25/09/2025',
                          grupo: 'Grupo A',
                          atividade: 'Oficina de Leitura Criativa',
                          participantes: 10,
                          duracao: '90 min'
                        },
                        {
                          data: '24/09/2025',
                          grupo: 'Grupo B',
                          atividade: 'Jogos Matemáticos',
                          participantes: 8,
                          duracao: '60 min'
                        },
                        {
                          data: '23/09/2025',
                          grupo: 'Grupo A',
                          atividade: 'Reforço de Português',
                          participantes: 12,
                          duracao: '120 min'
                        }
                      ].map((registro, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Activity className="w-4 h-4 text-green-500" />
                              <span className="font-medium">{registro.data} - {registro.grupo}</span>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800">
                              {registro.participantes} alunos
                            </Badge>
                          </div>
                          <h4 className="font-medium mb-1">{registro.atividade}</h4>
                          <p className="text-sm text-gray-600 mb-3">Duração: {registro.duracao}</p>
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
                      ))}
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
                <Button className="bg-purple-500 hover:bg-purple-600">
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
                  <label className="block text-sm font-medium mb-1">Nome</label>
                  <Input defaultValue={selectedAluno.nome} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Grupo</label>
                    <Select defaultValue={selectedAluno.grupo?.toLowerCase().replace(' ', '-')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grupo-a">Grupo A</SelectItem>
                        <SelectItem value="grupo-b">Grupo B</SelectItem>
                        <SelectItem value="grupo-c">Grupo C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <Select defaultValue="ativo">
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
                <div>
                  <label className="block text-sm font-medium mb-1">Observações</label>
                  <Textarea placeholder="Observações sobre o aluno..." rows={3} />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button 
                    className="bg-blue-500 hover:bg-blue-600"
                    onClick={() => {
                      toast({
                        title: "Aluno atualizado!",
                        description: `Dados de ${selectedAluno.nome} foram atualizados.`
                      });
                      setShowEditAlunoModal(false);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Salvar Alterações
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

      </div>
    </div>
  );
}