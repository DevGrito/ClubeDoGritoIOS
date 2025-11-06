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
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Search,
  Trophy,
  Dice6,
  Play,
  Plus,
  Calendar,
  LayoutGrid,
  GraduationCap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MondayTest } from "@/components/MondayTest";

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

// Componente de Administração do Sorteio para a Tela Dev
function SorteioAdminSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sorteioPendente, setSorteioPendente] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Estados para o formulário de cadastro
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    premio: '',
    dataSorteio: '',
    regras: 'Participação automática para doadores com pagamento em dia. Mais chances conforme o valor do plano: Eco=1, Voz=2, O Grito=3, Platinum=5 chances.'
  });

  // Query para sorteio ativo
  const { data: sorteioAtivo, isLoading: loadingSorteio } = useQuery({
    queryKey: ['sorteio-ativo'],
    queryFn: () => apiRequest('/api/sorteio/ativo'),
    retry: false,
  });

  // Query para participações do sorteio ativo
  const { data: participacoes, isLoading: loadingParticipacoes } = useQuery({
    queryKey: ['sorteio-participacoes', sorteioAtivo?.id],
    queryFn: () => apiRequest(`/api/sorteio/${sorteioAtivo.id}/participacoes`),
    enabled: !!sorteioAtivo?.id,
  });

  // Mutation para criar um novo sorteio
  const criarSorteioMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest('/api/sorteio/criar', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      setIsCreating(false);
      setShowCreateDialog(false);
      setFormData({
        nome: '',
        descricao: '',
        premio: '',
        dataSorteio: '',
        regras: 'Participação automática para doadores com pagamento em dia. Mais chances conforme o valor do plano: Eco=1, Voz=2, O Grito=3, Platinum=5 chances.'
      });
      toast({
        title: "Sorteio Criado com Sucesso!",
        description: "O novo sorteio foi cadastrado e já está disponível para os doadores.",
      });
      queryClient.invalidateQueries({ queryKey: ['sorteio-ativo'] });
    },
    onError: (error: any) => {
      setIsCreating(false);
      toast({
        title: "Erro ao criar sorteio",
        description: error.message || "Ocorreu um erro ao cadastrar o sorteio.",
        variant: "destructive",
      });
    },
  });

  // Mutation para realizar o sorteio
  const realizarSorteioMutation = useMutation({
    mutationFn: () => 
      apiRequest(`/api/sorteio/${sorteioAtivo.id}/realizar`, {
        method: 'POST',
        body: JSON.stringify({ metodo: 'automatico' }),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: (resultado) => {
      setSorteioPendente(false);
      toast({
        title: "Sorteio Realizado com Sucesso!",
        description: `Vencedor: ${resultado.resultado.vencedor}`,
      });
      queryClient.invalidateQueries({ queryKey: ['sorteio-ativo'] });
      queryClient.invalidateQueries({ queryKey: ['sorteio-resultados'] });
    },
    onError: (error: any) => {
      setSorteioPendente(false);
      toast({
        title: "Erro ao realizar sorteio",
        description: error.message || "Ocorreu um erro ao realizar o sorteio.",
        variant: "destructive",
      });
    },
  });

  const handleRealizarSorteio = () => {
    if (!sorteioAtivo) return;
    
    const confirmacao = window.confirm(
      `Confirma a realização do sorteio "${sorteioAtivo.nome}"?\n\nEsta ação não pode ser desfeita!`
    );
    
    if (confirmacao) {
      setSorteioPendente(true);
      realizarSorteioMutation.mutate();
    }
  };

  const handleCreateSorteio = () => {
    if (!formData.nome || !formData.premio || !formData.dataSorteio) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Verificar se é o mesmo mês
    const dataSorteio = new Date(formData.dataSorteio);
    const agora = new Date();
    
    if (dataSorteio.getMonth() === agora.getMonth() && dataSorteio.getFullYear() === agora.getFullYear()) {
      // Verificar se já existe sorteio para este mês
      // Esta validação será feita no backend
    }

    setIsCreating(true);
    criarSorteioMutation.mutate({
      ...formData,
      dataSorteio: new Date(formData.dataSorteio).toISOString(),
      status: 'ativo',
      ativo: true,
      tipoSorteio: 'mensal'
    });
  };

  const handleInputChange = React.useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  if (loadingSorteio) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderização do diálogo de criação de sorteio
  const renderCreateSorteioDialog = () => (
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogTrigger asChild>
        <Button className="mb-6">
          <Plus className="w-4 h-4 mr-2" />
          Criar Novo Sorteio
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Sorteio</DialogTitle>
          <DialogDescription>
            Preencha os dados do sorteio que será disponibilizado para os doadores.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="nome">Nome do Sorteio *</Label>
            <Input
              id="nome"
              placeholder="Ex: Sorteio Fevereiro 2025"
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="premio">Descrição do Prêmio *</Label>
            <Input
              id="premio"
              placeholder="Ex: Vale-compras R$ 500 + Kit Exclusivo"
              value={formData.premio}
              onChange={(e) => handleInputChange('premio', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="dataSorteio">Data do Sorteio *</Label>
            <Input
              id="dataSorteio"
              type="datetime-local"
              value={formData.dataSorteio}
              onChange={(e) => handleInputChange('dataSorteio', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="descricao">Descrição (Opcional)</Label>
            <Textarea
              id="descricao"
              placeholder="Informações adicionais sobre o sorteio"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="regras">Regras Adicionais (Opcional)</Label>
            <Textarea
              id="regras"
              placeholder="Regras específicas para este sorteio (opcional)"
              value={formData.regras}
              onChange={(e) => handleInputChange('regras', e.target.value)}
              rows={3}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowCreateDialog(false)}
            disabled={isCreating}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateSorteio} 
            disabled={isCreating}
            className="flex-1"
          >
            {isCreating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Criar Sorteio
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (!sorteioAtivo) {
    return (
      <div className="space-y-6">
        {renderCreateSorteioDialog()}
        
        <Card className="text-center">
          <CardContent className="py-12">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Nenhum Sorteio Ativo
            </h2>
            <p className="text-gray-600 mb-4">
              Não há sorteios ativos no momento. Crie um novo sorteio para começar.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalParticipantes = participacoes?.length || 0;
  const totalChances = participacoes?.reduce((sum: number, p: any) => sum + p.numeroChances, 0) || 0;
  const sorteioJaRealizado = sorteioAtivo.status === 'finalizado';

  return (
    <div className="space-y-6">
      {renderCreateSorteioDialog()}
      
      {/* Informações do Sorteio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-600" />
            {sorteioAtivo.nome}
            <Badge variant={sorteioJaRealizado ? "secondary" : "default"}>
              {sorteioJaRealizado ? "Finalizado" : "Ativo"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Prêmio</h3>
              <p className="text-sm text-blue-700">{sorteioAtivo.premio}</p>
              {sorteioAtivo.valorPremio && (
                <p className="text-xs text-blue-600">R$ {parseFloat(sorteioAtivo.valorPremio).toFixed(2).replace('.', ',')}</p>
              )}
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Users className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-semibold text-green-900">Participantes</h3>
              <p className="text-2xl font-bold text-green-700">{totalParticipantes}</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Dice6 className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-semibold text-purple-900">Total de Chances</h3>
              <p className="text-2xl font-bold text-purple-700">{totalChances}</p>
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                Data do sorteio: {new Date(sorteioAtivo.dataSorteio).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Participantes */}
      {loadingParticipacoes ? (
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </CardContent>
        </Card>
      ) : participacoes && participacoes.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Participantes Confirmados</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? "Ocultar" : "Ver"} Detalhes
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {participacoes.map((participacao: any) => (
                <div key={participacao.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-700 font-semibold">
                        {participacao.nome?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{participacao.nome || `Usuário ${participacao.userId}`}</p>
                      {showDetails && (
                        <p className="text-xs text-gray-500">ID: {participacao.userId}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mb-1">
                      Plano {participacao.planoAtual?.toUpperCase()}
                    </Badge>
                    <p className="text-sm font-semibold text-gray-700">
                      {participacao.numeroChances} {participacao.numeroChances === 1 ? 'chance' : 'chances'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum Participante</h3>
            <p className="text-gray-500">Ainda não há participações confirmadas neste sorteio.</p>
          </CardContent>
        </Card>
      )}

      {/* Botão de Realizar Sorteio */}
      {!sorteioJaRealizado && totalParticipantes > 0 && (
        <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardContent className="p-6 text-center space-y-4">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">Pronto para Sortear!</h3>
              <p className="text-gray-600">
                {totalParticipantes} {totalParticipantes === 1 ? 'pessoa confirmada' : 'pessoas confirmadas'} com {totalChances} chances no total
              </p>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={handleRealizarSorteio}
                disabled={realizarSorteioMutation.isPending || sorteioPendente}
                size="lg"
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 px-8"
              >
                {sorteioPendente ? (
                  <>
                    <Clock className="w-5 h-5 mr-2 animate-spin" />
                    Realizando Sorteio...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Realizar Sorteio Agora
                  </>
                )}
              </Button>
              
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                O sorteio será realizado de forma transparente e automática. O resultado ficará registrado permanentemente no sistema.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sorteio Já Realizado */}
      {sorteioJaRealizado && (
        <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
            <h3 className="text-xl font-bold text-green-900 mb-2">
              Sorteio Finalizado
            </h3>
            <p className="text-green-700">
              Este sorteio já foi realizado e finalizado. Confira o resultado no histórico.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function DevPanel() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('usuarios');
  
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
  const abrirTela = (rota: string) => {
    // ⭐ IMPORTANTE: Usar localStorage (compartilhado entre abas) ao invés de sessionStorage
    localStorage.setItem('dev_panel_active', 'true');
    localStorage.setItem('dev_panel_timestamp', Date.now().toString());
    
    // Construir URL com parâmetros de desenvolvedor para bypass de permissões
    const devUrl = `${rota}?dev_access=true&origin=dev_panel`;
    
    // Abrir em nova aba para não perder o painel do desenvolvedor
    const novaAba = window.open(devUrl, '_blank');
    
    if (novaAba) {
      console.log('✅ [DEV PANEL] Nova aba aberta com dev_access ativo:', devUrl);
    } else {
      console.error('❌ [DEV PANEL] Falha ao abrir nova aba - bloqueador de pop-up?');
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
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  abrirTela(tela.rota);
                                }}
                                className="text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Dev Access
                              </Button>
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
                    <Button
                      onClick={() => abrirTela(selectedTela.rota)}
                      className="w-full"
                      size="sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Abrir Tela em Nova Aba
                    </Button>
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

    if (activeTab === 'sorteio') {
      return <SorteioAdminSection />;
    }

    if (activeTab === 'monday') {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Monday.com API Integration Test</h2>
            <p className="text-gray-600 mb-6">Test the Monday.com API integration with your workspace</p>
          </div>
          <MondayTest />
        </div>
      );
    }

    if (activeTab === 'pec') {
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Sistema PEC - Projetos Educacionais Culturais
              </CardTitle>
              <CardDescription>
                Acesso direto ao sistema de coordenação PEC para gerenciar projetos, atividades, turmas e sessões educacionais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-1">Painel do Coordenador PEC</h3>
                    <p className="text-sm text-blue-700 mb-3">
                      Sistema completo para gestão de projetos educacionais, controle de presença, 
                      relatórios mensais e acompanhamento pedagógico.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-blue-600 mb-4">
                      <div>✅ Gestão de Projetos</div>
                      <div>✅ Controle de Atividades</div>
                      <div>✅ Administração de Turmas</div>
                      <div>✅ Lista de Alunos</div>
                      <div>✅ Diário de Sessões</div>
                      <div>✅ Controle de Presença</div>
                      <div>✅ Relatórios Mensais</div>
                      <div>✅ Galeria de Fotos</div>
                    </div>
                    <Button
                      onClick={() => {
                        window.open('/pec-coordenador?dev_access=true&origin=dev_panel', '_blank');
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      data-testid="btn-acessar-sistema-pec"
                    >
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Acessar Sistema PEC
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <h4 className="font-medium text-green-900">Status do Sistema</h4>
                  </div>
                  <p className="text-sm text-green-700 mb-2">
                    Sistema PEC totalmente funcional e testado.
                  </p>
                  <ul className="text-xs text-green-600 space-y-1">
                    <li>• Seeds de exemplo criados</li>
                    <li>• Validações implementadas</li>
                    <li>• UX otimizada</li>
                    <li>• Relatórios funcionando</li>
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <h4 className="font-medium text-amber-900">Dados de Exemplo</h4>
                  </div>
                  <p className="text-sm text-amber-700 mb-2">
                    O sistema contém dados de teste para demonstração.
                  </p>
                  <ul className="text-xs text-amber-600 space-y-1">
                    <li>• Projeto: Casa Sonhar</li>
                    <li>• Atividade: Contraturno</li>
                    <li>• 12 alunos inscritos</li>
                    <li>• 10 sessões setembro</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

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
            <Button variant="outline" onClick={() => queryClient.invalidateQueries()} className="text-xs sm:text-sm">
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Atualizar
            </Button>
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
            <button
              onClick={() => setActiveTab('sorteio')}
              className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'sorteio'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
              Administrar Sorteio
            </button>
            <button
              onClick={() => setActiveTab('monday')}
              className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'monday'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <LayoutGrid className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
              Monday.com API
            </button>
            <button
              onClick={() => setActiveTab('pec')}
              className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'pec'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
              Sistema PEC
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {renderTabContent()}
      </div>
    </div>
  );
}