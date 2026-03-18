import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Monitor, 
  Users, 
  Clock, 
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Search,
  Plus,
  Calendar,
  LogOut,
  Key,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SistemaTela {
  id: number;
  nome: string;
  titulo: string;
  rota: string;
  status: string;
  descricao: string;
  modulo: string;
  tipo: string;
  ultimaAtualizacao: string;
  atualizadoPor?: string;
}

interface SistemaUsuario {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  tipo: string;
  verificado: boolean;
  ativo: boolean;
  plano: string;
  dataCadastro: string;
  ultimoAcesso: string;
  telasAcesso: string[];
  totalAcessos: number;
  ultimaAtividade: string;
}

interface TelaHistorico {
  id: number;
  telaId: number;
  tipoAlteracao: string;
  descricao: string;
  responsavel: string;
  dataAlteracao: string;
}

// REMOVIDO: Componente SorteioAdminSection (conforme solicitação do usuário em 2025-11-18)
// O componente foi completamente removido para limpar a interface do painel de desenvolvedor

export default function DevPanel() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('usuarios');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Verificar se é devfull (admin) para mostrar botão de Marketing
  const userPapel = localStorage.getItem('userPapel');
  const isDevAdmin = userPapel === 'dev-admin';

  // Função para fazer logout
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setLocation('/dev/login');
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
  };

  // Função para mudar senha
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Erro",
        description: "A senha deve ter no mínimo 8 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      toast({
        title: "Erro",
        description: "A senha deve conter pelo menos uma letra maiúscula.",
        variant: "destructive",
      });
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      toast({
        title: "Erro",
        description: "A senha deve conter pelo menos um número.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiRequest('/api/dev/alterar-senha', {
        method: 'POST',
        body: JSON.stringify({ 
          senhaAtual: currentPassword,
          novaSenha: newPassword 
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      toast({
        title: "Senha alterada!",
        description: "Sua senha foi alterada com sucesso. Você será desconectado.",
      });

      setTimeout(() => {
        localStorage.clear();
        setLocation('/');
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Ocorreu um erro ao alterar a senha.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  // Limpar estado ao trocar de aba para evitar contaminação DE DADOS
  useEffect(() => {
    if (activeTab === 'usuarios') {
      setSelectedTela(null);
      setSearchTelas('');
    } else if (activeTab === 'telas') {
      setSelectedUsuario(null);
      setSearchUsuarios('');
    } else if (activeTab === 'sorteio') {
      setSelectedTela(null);
      setSelectedUsuario(null);
      setSearchTelas('');
      setSearchUsuarios('');
    } else if (activeTab === 'monday') {
      setSelectedTela(null);
      setSelectedUsuario(null);
      setSearchTelas('');
      setSearchUsuarios('');
    } else if (activeTab === 'pec') {
      setSelectedTela(null);
      setSelectedUsuario(null);
      setSearchTelas('');
      setSearchUsuarios('');
    }
  }, [activeTab]);
  const [selectedTela, setSelectedTela] = useState<SistemaTela | null>(null);
  const [selectedUsuario, setSelectedUsuario] = useState<SistemaUsuario | null>(null);
  const [showHistorico, setShowHistorico] = useState(false);
  
  // Estados para pesquisa
  const [searchUsuarios, setSearchUsuarios] = useState('');
  const [searchTelas, setSearchTelas] = useState('');
  const [searchHistorico, setSearchHistorico] = useState('');

  // Developer panel - direct access allowed
  useEffect(() => {
    // Allow direct access to developer panel
    console.log('Developer panel loaded:', location);
  }, [location]);

  // Queries para buscar dados reais do sistema - TIPOS EXPLÍCITOS E ISOLAMENTO GARANTIDO
  const { data: usuarios = [], isLoading: usuariosLoading, error: usuariosError } = useQuery({
    queryKey: ['/api/dev/users', activeTab],
    queryFn: async () => {
      const response = await fetch('/api/dev/users');
      if (!response.ok) throw new Error('Falha ao carregar usuários');
      return await response.json() as SistemaUsuario[];
    },
    enabled: activeTab === 'usuarios',
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
  });

  const { data: telas = [], isLoading: telasLoading, error: telasError } = useQuery({
    queryKey: ['/api/dev/telas', activeTab],
    queryFn: async () => {
      const response = await fetch('/api/dev/telas?t=' + Date.now()); // Force fresh data
      if (!response.ok) throw new Error('Falha ao carregar telas');
      const data = await response.json() as SistemaTela[];
      console.log('[DEV DEBUG] Telas carregadas:', data.length, 'telas');
      console.log('[DEV DEBUG] Tela de ingresso:', data.find(t => t.nome.includes('ingresso')));
      return data;
    },
    enabled: activeTab === 'telas',
    staleTime: 0, // No cache
    gcTime: 0, // No cache
  });

  const { data: telaHistorico = [], isLoading: historicoLoading } = useQuery<TelaHistorico[]>({
    queryKey: ['/api/dev/tela-historico', selectedTela?.id],
    enabled: !!selectedTela,
  });

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OK':
        return 'bg-green-500';
      case 'Em atenção':
        return 'bg-yellow-500';
      case 'Erro':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Função para obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OK':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Em atenção':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'Erro':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Monitor className="w-4 h-4 text-gray-600" />;
    }
  };

  // Função para navegar para uma tela específica
  const getDevUrl = (rota: string) => `${rota}?dev_access=true&origin=dev_panel`;

  const abrirTela = (rota: string) => {
    if (rota === '/dev/marketing') {
      setLocation(rota);
      return;
    }
    localStorage.setItem('dev_panel_active', 'true');
    localStorage.setItem('dev_panel_timestamp', Date.now().toString());
    const devUrl = getDevUrl(rota);
    const novaAba = window.open(devUrl, '_blank');
    if (!novaAba) {
      toast({
        title: "Popup bloqueado pelo navegador",
        description: "Clique com o botão direito no botão 'Abrir Tela' e escolha 'Abrir link em nova aba'. Ou permita popups para este site nas configurações do navegador.",
        variant: "destructive",
        duration: 8000,
      });
    }
  };

  // Usar apenas as telas do backend (atualizadas dinamicamente)
  const telasCompletas = telas || [];

  // GARANTIR QUE DADOS CORRETOS SEJAM EXIBIDOS EM CADA ABA
  const usuariosValidos = usuarios.filter((item: any) => 
    item && typeof item.nome === 'string' && typeof item.telefone === 'string' && typeof item.tipo === 'string'
  ) as SistemaUsuario[];

  const usuariosFiltrados = usuariosValidos.filter(usuario =>
    usuario.nome.toLowerCase().includes(searchUsuarios.toLowerCase()) ||
    usuario.telefone.includes(searchUsuarios) ||
    usuario.tipo.toLowerCase().includes(searchUsuarios.toLowerCase())
  );

  // Debug log para investigação
  console.log('[DEV DEBUG] Active Tab:', activeTab);
  console.log('[DEV DEBUG] Usuarios raw:', usuarios?.slice(0, 2));
  console.log('[DEV DEBUG] Usuarios válidos:', usuariosValidos?.slice(0, 2));

  const telasFiltradas = telasCompletas.filter(tela => {
    const searchLower = searchTelas.toLowerCase();
    const matches = 
      tela.titulo.toLowerCase().includes(searchLower) ||
      tela.nome.toLowerCase().includes(searchLower) ||
      tela.rota.toLowerCase().includes(searchLower) ||
      tela.modulo.toLowerCase().includes(searchLower);
    
    // Debug para "ingresso"
    if (searchLower === 'ingresso') {
      console.log('[DEV DEBUG FILTER] Tela:', tela.nome, 'Título:', tela.titulo, 'Matches:', matches);
    }
    
    return matches;
  });

  const historicoFiltrado = telaHistorico.filter(entry =>
    entry.descricao.toLowerCase().includes(searchHistorico.toLowerCase()) ||
    entry.tipoAlteracao.toLowerCase().includes(searchHistorico.toLowerCase()) ||
    entry.responsavel.toLowerCase().includes(searchHistorico.toLowerCase())
  );

  const renderTabContent = () => {
    if (activeTab === 'usuarios') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Lista de Usuários Reais */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Usuários do Sistema
                  <Badge variant="secondary" className="ml-2">
                    {usuariosFiltrados.length} usuários
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Lista completa de todos os usuários reais cadastrados
                </CardDescription>
                <div className="mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                    <Input
                      placeholder="Pesquisar usuários..."
                      value={searchUsuarios}
                      onChange={(e) => setSearchUsuarios(e.target.value)}
                      className="pl-8 sm:pl-10 text-sm"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {usuariosLoading ? (
                  <div className="text-center py-8">Carregando usuários...</div>
                ) : usuariosError ? (
                  <div className="text-center py-8 text-red-600">
                    Erro ao carregar usuários: {usuariosError.message}
                  </div>
                ) : usuarios.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum usuário encontrado
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-xs text-green-600 mb-2 p-2 bg-green-50 rounded">
                      ✓ Sistema de Consolidação: {usuariosValidos.length} usuários únicos registrados
                      <div className="text-xs text-gray-600 mt-1">
                        Tipos: {usuariosValidos.length > 0 ? Array.from(new Set(usuariosValidos.map(u => u.tipo))).join(', ') : 'Nenhum'}
                      </div>
                    </div>
                    {usuariosFiltrados.map((usuario: SistemaUsuario, index: number) => (
                      <div
                        key={`user-${usuario.id}-${index}`}
                        onClick={() => setSelectedUsuario(usuario)}
                        className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedUsuario?.id === usuario.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 text-sm sm:text-base">{usuario.nome || 'Nome não disponível'}</h3>
                            <p className="text-xs sm:text-sm text-gray-600">{usuario.telefone || 'Telefone não disponível'}</p>
                            <div className="flex items-center gap-1 sm:gap-2 mt-1 flex-wrap">
                              <Badge variant="outline" className="text-xs">{usuario.tipo || 'Tipo não definido'}</Badge>
                              <Badge variant={usuario.ativo ? "secondary" : "destructive"} className="text-xs">
                                {usuario.ativo ? "Ativo" : "Inativo"}
                              </Badge>
                              {(usuario as any).fonte && (
                                <Badge variant="outline" className="text-xs bg-blue-50">
                                  {(usuario as any).fonte}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right sm:text-right text-left">
                            <p className="text-xs sm:text-sm text-gray-500">
                              {usuario.telasAcesso?.length || 0} telas de acesso
                            </p>
                            {usuario.ultimoAcesso && (
                              <p className="text-xs text-gray-400 hidden sm:block">
                                Último acesso: {new Date(usuario.ultimoAcesso).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detalhes do Usuário Selecionado */}
          <div>
            {selectedUsuario ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{selectedUsuario.nome}</CardTitle>
                  <CardDescription>Permissões de acesso às telas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Informações Básicas</Label>
                    <div className="space-y-2 mt-2">
                      <p className="text-sm"><strong>Telefone:</strong> {selectedUsuario.telefone}</p>
                      <p className="text-sm"><strong>Tipo:</strong> {selectedUsuario.tipo}</p>
                      <p className="text-sm"><strong>Status:</strong> {selectedUsuario.ativo ? "Ativo" : "Inativo"}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Telas com Acesso Permitido</Label>
                    <div className="space-y-2 mt-2">
                      {selectedUsuario.telasAcesso && selectedUsuario.telasAcesso.length > 0 ? (
                        selectedUsuario.telasAcesso.map((telaRota, index) => {
                          const tela = telas.find(t => t.rota === telaRota);
                          return (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                              {tela ? (
                                <>
                                  {getStatusIcon(tela.status)}
                                  <span className="text-sm font-medium">{tela.titulo}</span>
                                  <Badge variant="outline" className="text-xs">{tela.modulo}</Badge>
                                </>
                              ) : (
                                <>
                                  <Monitor className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">{telaRota}</span>
                                </>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          Nenhuma tela de acesso configurada
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione um Usuário</h3>
                  <p className="text-gray-500">
                    Clique em um usuário para ver suas permissões de acesso
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === 'telas') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Lista de Telas com Status */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Todas as Telas do Sistema
                  <Badge variant="secondary" className="ml-2">
                    {telasFiltradas.length} telas
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Lista completa incluindo telas restritas e ocultas - Acesso via Dev Panel
                </CardDescription>
                <div className="mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Pesquisar telas por nome, rota ou módulo..."
                      value={searchTelas}
                      onChange={(e) => setSearchTelas(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {telasLoading ? (
                  <div className="text-center py-8">Carregando telas...</div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {telasFiltradas.map((tela: SistemaTela) => (
                      <div
                        key={tela.id}
                        onClick={() => setSelectedTela(tela)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedTela?.id === tela.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(tela.status)}`} />
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-gray-900">{tela.titulo}</h3>
                                <Badge variant={tela.tipo === 'Restrito' ? 'destructive' : tela.tipo === 'Público' ? 'secondary' : 'outline'} className="text-xs">
                                  {tela.tipo}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{tela.rota} • {tela.modulo}</p>
                              <p className="text-xs text-gray-400">{tela.descricao}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-2">
                              <a
                                href={getDevUrl(tela.rota)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  localStorage.setItem('dev_panel_active', 'true');
                                  localStorage.setItem('dev_panel_timestamp', Date.now().toString());
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 font-medium"
                              >
                                <Eye className="w-3 h-3" />
                                Dev Access
                              </a>
                              <Badge variant={tela.status === 'OK' ? 'secondary' : 'destructive'}>
                                {tela.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500">
                              Atualizada em {new Date(tela.ultimaAtualizacao).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detalhes da Tela Selecionada */}
          <div>
            {selectedTela ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{selectedTela.titulo}</CardTitle>
                  <CardDescription>Detalhes e histórico da tela</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Status Atual</Label>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedTela.status)}`} />
                        <span className="font-medium">{selectedTela.status}</span>
                      </div>
                      <Button
                        onClick={() => setShowHistorico(!showHistorico)}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {showHistorico ? 'Ocultar' : 'Ver'} Histórico
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Informações</Label>
                    <div className="space-y-1 mt-2">
                      <p className="text-sm"><strong>Rota:</strong> {selectedTela.rota}</p>
                      <p className="text-sm"><strong>Módulo:</strong> {selectedTela.modulo}</p>
                      <p className="text-sm"><strong>Tipo:</strong> {selectedTela.tipo}</p>
                    </div>
                  </div>

                  <div>
                    <Label>Última Atualização</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(selectedTela.ultimaAtualizacao).toLocaleString('pt-BR')}
                      {selectedTela.atualizadoPor && ` por ${selectedTela.atualizadoPor}`}
                    </p>
                  </div>

                  <div>
                    <Label>Descrição</Label>
                    <p className="text-sm text-gray-600 mt-1">{selectedTela.descricao}</p>
                  </div>

                  {/* Histórico de Alterações */}
                  {showHistorico && (
                    <div className="border-t pt-4">
                      <Label>Histórico de Alterações</Label>
                      <div className="mt-2">
                        <div className="relative mb-3">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Pesquisar no histórico..."
                            value={searchHistorico}
                            onChange={(e) => setSearchHistorico(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        {historicoLoading ? (
                          <div className="text-center py-4">
                            <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-sm text-gray-500">Carregando histórico...</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {historicoFiltrado.length > 0 ? (
                              historicoFiltrado.map((entry: TelaHistorico) => (
                                <div key={entry.id} className="flex items-start gap-3 p-2 bg-gray-50 rounded text-sm">
                                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                    entry.tipoAlteracao === 'criacao' ? 'bg-green-500' :
                                    entry.tipoAlteracao === 'modificacao' ? 'bg-blue-500' :
                                    entry.tipoAlteracao === 'bugfix' ? 'bg-red-500' :
                                    'bg-gray-500'
                                  }`} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className="text-xs">
                                        {entry.tipoAlteracao}
                                      </Badge>
                                      <span className="text-xs text-gray-500">
                                        {new Date(entry.dataAlteracao).toLocaleDateString('pt-BR')}
                                      </span>
                                    </div>
                                    <p className="text-gray-900 break-words">{entry.descricao}</p>
                                    <p className="text-xs text-gray-600">Por: {entry.responsavel}</p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-4 text-gray-500 text-sm">
                                {searchHistorico ? 'Nenhum resultado encontrado' : 'Nenhuma alteração registrada'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <a
                      href={getDevUrl(selectedTela.rota)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        localStorage.setItem('dev_panel_active', 'true');
                        localStorage.setItem('dev_panel_timestamp', Date.now().toString());
                      }}
                      className="flex items-center justify-center w-full gap-2 px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Eye className="w-4 h-4" />
                      Abrir Tela em Nova Aba
                    </a>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Monitor className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione uma Tela</h3>
                  <p className="text-gray-500">
                    Clique em uma tela para ver seus detalhes e status
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      );
    }

    // REMOVIDO: Seção de sorteio conforme solicitação do usuário
    // if (activeTab === 'sorteio') {
    //   return <SorteioAdminSection />;
    // }

    // REMOVIDO: Seção Monday.com API conforme solicitação (2025-11-18)
    // if (activeTab === 'monday') {
    //   return (
    //     <div className="space-y-6">
    //       <div className="text-center">
    //         <h2 className="text-2xl font-bold text-gray-900 mb-2">Monday.com API Integration Test</h2>
    //         <p className="text-gray-600 mb-6">Test the Monday.com API integration with your workspace</p>
    //       </div>
    //       <MondayTest />
    //     </div>
    //   );
    // }

    // REMOVIDO: Seção Sistema PEC conforme solicitação do usuário
    // if (activeTab === 'pec') {
    //   return (...)
    // }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      {/* Banner de Acesso de Desenvolvedor - Mobile Optimized */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-purple-100 border border-purple-300 rounded-lg">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
          <h2 className="font-semibold text-purple-800 text-sm sm:text-base">Modo Desenvolvedor Ativo</h2>
        </div>
        <p className="text-purple-700 text-xs sm:text-sm mt-1 hidden sm:block">
          Acesso total ao sistema com permissões especiais de desenvolvedor
        </p>
      </div>

      {/* Header - Mobile Optimized */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
              Painel do Desenvolvedor
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base hidden sm:block">
              Ferramentas essenciais de monitoramento e desenvolvimento
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            <Button 
              variant="default" 
              onClick={() => setShowChangePassword(true)} 
              className="text-xs sm:text-sm bg-amber-600 hover:bg-amber-700"
              data-testid="btn-mudar-senha-dev"
            >
              <Key className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Mudar Senha
            </Button>
            {isDevAdmin && (
              <Button 
                variant="default" 
                onClick={() => setLocation('/dev/marketing')} 
                className="text-xs sm:text-sm bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold"
                data-testid="btn-marketing-toggle"
              >
                <Monitor className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Painel Marketing
              </Button>
            )}
            <Button 
              variant="destructive" 
              onClick={handleLogout} 
              className="text-xs sm:text-sm"
              data-testid="btn-sair-dev"
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Sair
            </Button>
            <Button 
              variant="default" 
              onClick={() => abrirTela('/tdoador')} 
              className="text-xs sm:text-sm bg-green-600 hover:bg-green-700"
            >
              <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Acessar Doador
            </Button>
            <Button 
              variant="default" 
              onClick={() => abrirTela('/patrocinador')} 
              className="text-xs sm:text-sm bg-purple-600 hover:bg-purple-700"
            >
              <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Acessar Patrocinador
            </Button>
            <Button 
              variant="default" 
              onClick={() => abrirTela('/admin/rede/credenciais')} 
              className="text-xs sm:text-sm bg-blue-600 hover:bg-blue-700"
            >
              <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Config Rede
            </Button>
            <Button 
              variant="default" 
              onClick={() => abrirTela('/admin/cielo/credenciais')} 
              className="text-xs sm:text-sm bg-cyan-600 hover:bg-cyan-700"
            >
              <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Config Cielo
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('https://complaint-tracker-OGRITO.replit.app', '_blank')} 
              className="text-xs sm:text-sm bg-yellow-400 text-black hover:bg-yellow-500 border-yellow-400"
              data-testid="btn-transparencia-dev"
            >
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Canal de Transparência
            </Button>
            {/* REMOVIDO: Botão "Atualizar" conforme solicitação (2025-11-18) */}
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Mobile Optimized */}
      <div className="mb-6 sm:mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-2 sm:space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'usuarios'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
              Usuários e Acessos
            </button>
            <button
              onClick={() => setActiveTab('telas')}
              className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'telas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Monitor className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
              Status das Telas
            </button>
            {/* REMOVIDO: Aba Administrar Sorteio conforme solicitação do usuário */}
            {/* REMOVIDO: Aba Monday.com API conforme solicitação (2025-11-18) */}
            {/* REMOVIDO: Aba Sistema PEC conforme solicitação do usuário */}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {renderTabContent()}
      </div>

      {/* Dialog de Mudar Senha */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mudar Senha do Desenvolvedor</DialogTitle>
            <DialogDescription>
              A senha deve ter no mínimo 8 caracteres, pelo menos 1 letra maiúscula e 1 número.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Digite sua senha atual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isChangingPassword}
                  className="pr-10"
                  data-testid="input-senha-atual"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Digite a nova senha (mín. 8 caracteres)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isChangingPassword}
                  className="pr-10"
                  data-testid="input-nova-senha"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Digite novamente a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isChangingPassword}
                  className="pr-10"
                  data-testid="input-confirmar-senha"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowChangePassword(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setShowCurrentPassword(false);
                setShowNewPassword(false);
                setShowConfirmPassword(false);
              }}
              disabled={isChangingPassword}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleChangePassword} 
              disabled={isChangingPassword}
              className="flex-1"
              data-testid="btn-confirmar-mudar-senha"
            >
              {isChangingPassword ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Alterando...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Alterar Senha
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}