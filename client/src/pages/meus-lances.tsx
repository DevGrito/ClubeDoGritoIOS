import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Clock, Star, Trophy, AlertCircle, CheckCircle, Eye, X, Timer, Users, Target, TrendingUp, Plus, Sparkles, PartyPopper, Zap, RefreshCw, Heart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useUserData } from "@/hooks/useUserData";
import { useProfileImage } from "@/hooks/useProfileImage";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/logo";
import { motion } from "framer-motion";

interface Lance {
  id: number;
  beneficioId: number;
  userId: number;
  pontosOfertados: number;
  dataLance: string;
  status: 'ativo' | 'ganhou' | 'perdeu';
  beneficio: {
    id: number;
    titulo: string;
    descricao: string;
    imagemUrl?: string;
    imagemCardUrl?: string;
    imagemDetalhesUrl?: string;
    categoria: string;
  };
}

interface EstatisticasBeneficio {
  totalLances: number;
  posicaoUsuario: number;
  tempoRestante: {
    horas: number;
    minutos: number;
    segundos: number;
  };
  lanceEncerrado: boolean;
  gritosMinimos: number;
  top3Lances: {
    posicao: number;
    nome: string;
    pontos: number;
    isUsuario: boolean;
  }[];
  lanceUsuario: {
    pontos: number;
    dataLance: string;
  };
}

export default function MeusLances() {
  const [, setLocation] = useLocation();
  const { userData } = useUserData();
  const { profileImage } = useProfileImage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = localStorage.getItem("userId");
  const [lanceDetalhes, setLanceDetalhes] = useState<number | null>(null);
  const [showAumentarLance, setShowAumentarLance] = useState(false);
  const [novoLanceValor, setNovoLanceValor] = useState(0);

  // Refresh automático dos dados ao carregar a tela
  useEffect(() => {
    const refreshData = () => {
      if (!userId) return;
      
      // Invalidar queries para garantir dados atualizados
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/meus-lances'] });
        queryClient.invalidateQueries({ queryKey: ["user-gritos", userId] });
      }, 500);
    };

    refreshData();
  }, [userId, queryClient]);

  // Buscar lances do usuário com refrescamento automático inteligente
  const { data: lances = [], isLoading } = useQuery<Lance[]>({
    queryKey: ['/api/meus-lances'],
    queryFn: async () => {
      const response = await fetch('/api/meus-lances', {
        headers: {
          'x-user-id': userId || '',
        },
      });
      if (!response.ok) {
        throw new Error('Falha ao buscar lances');
      }
      return response.json();
    },
    // Refrescamento automático apenas quando há lances ativos
    refetchInterval: (query) => {
      const hasActiveLances = query.state.data?.some(lance => lance.status === 'ativo');
      return hasActiveLances ? 30000 : false; // 30 segundos se há lances ativos
    },
    refetchOnWindowFocus: true,
  });

  // Buscar estatísticas do benefício selecionado
  const { data: estatisticas, isLoading: isLoadingEstatisticas } = useQuery<EstatisticasBeneficio>({
    queryKey: [`/api/beneficios/${lanceDetalhes}/estatisticas`],
    enabled: !!lanceDetalhes,
    queryFn: async () => {
      const response = await fetch(`/api/beneficios/${lanceDetalhes}/estatisticas`, {
        headers: {
          'x-user-id': userId || '',
        },
      });
      if (!response.ok) {
        throw new Error('Falha ao buscar estatísticas');
      }
      return response.json();
    },
  });

  // Buscar dados do usuário incluindo gritos
  const { data: userStats } = useQuery({
    queryKey: ["user-gritos", userId],
    queryFn: async () => {
      if (!userId) return null;
      try {
        const response = await fetch(`/api/users/${userId}/gritos`);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error("Error fetching user gritos:", error);
      }
      return null;
    },
    enabled: !!userId
  });

  // Mutation para aumentar lance
  const aumentarLanceMutation = useMutation({
    mutationFn: async ({ beneficioId, pontosOfertados }: { beneficioId: number; pontosOfertados: number }) => {
      const response = await apiRequest(`/api/beneficios/${beneficioId}/lance`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: parseInt(userId!),
          pontosOfertados,
          aumentarLance: true
        })
      });
      return response;
    },
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: "✅ Lance aumentado com sucesso!",
          description: `${novoLanceValor} Gritos foram deduzidos da sua conta.`,
          duration: 5000,
        });

        // Invalidar queries para atualizar dados
        queryClient.invalidateQueries({ queryKey: ['/api/meus-lances'] });
        queryClient.invalidateQueries({ queryKey: [`/api/beneficios/${lanceDetalhes}/estatisticas`] });
        queryClient.invalidateQueries({ queryKey: ["user-gritos", userId] });
        
        setShowAumentarLance(false);
        setLanceDetalhes(null);
      }
    },
    onError: (error) => {
      console.error("Erro ao aumentar lance:", error);
      toast({
        title: "Erro",
        description: "Não foi possível aumentar seu lance. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const handleAumentarLance = () => {
    if (!estatisticas) return;
    
    // Calcular novo lance sugerido (melhor que o 1º lugar + valor mínimo dinâmico)
    const melhorLance = estatisticas.top3Lances[0]?.pontos || estatisticas.lanceUsuario.pontos;
    const incrementoMinimo = estatisticas.gritosMinimos || 1; // Fallback para 1 se não houver valor
    const novoLanceSugerido = melhorLance + incrementoMinimo;
    
    setNovoLanceValor(novoLanceSugerido);
    setShowAumentarLance(true);
  };

  const confirmarAumentarLance = () => {
    if (!lanceDetalhes || !novoLanceValor) return;
    
    aumentarLanceMutation.mutate({
      beneficioId: lanceDetalhes,
      pontosOfertados: novoLanceValor
    });
  };

  const getPlanDisplayName = (plano: string) => {
    const planNames = {
      eco: "Eco",
      voz: "Voz", 
      grito: "O Grito",
      platinum: "Platinum"
    };
    return planNames[plano as keyof typeof planNames] || "Eco";
  };

  const getStatusInfo = (status: string) => {
    
    switch (status) {
      case 'ativo':
        return {
          icon: <Clock className="w-5 h-5" />,
          text: 'Aguardando resultado',
          color: 'text-blue-600 bg-blue-50 border-blue-200',
          cardColor: '',
          showAnimation: false
        };
      case 'ganhou':
        return {
          icon: <Trophy className="w-5 h-5" />,
          text: '🎉 Parabéns! Você ganhou!',
          color: 'text-green-700 bg-gradient-to-r from-green-50 to-emerald-50 border-green-300',
          cardColor: 'bg-gradient-to-br from-green-50 via-emerald-50 to-yellow-50 border-2 border-green-200 shadow-lg',
          showAnimation: true
        };
      case 'perdeu':
        return {
          icon: <Heart className="w-5 h-5" />,
          text: 'Continue tentando! 💪',
          color: 'text-blue-600 bg-gradient-to-r from-blue-50 to-slate-50 border-blue-200',
          cardColor: 'bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50 border border-blue-100',
          showAnimation: false
        };
      default:
        return {
          icon: <Clock className="w-5 h-5" />,
          text: 'Status desconhecido',
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          cardColor: '',
          showAnimation: false
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando seus lances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => setLocation('/beneficios')}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
            data-testid="button-voltar-beneficios"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar</span>
          </button>
          
          <div className="flex items-center justify-center">
            <Logo size="sm" />
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Foto de Perfil */}
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300">
              {profileImage ? (
                <img 
                  src={profileImage}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-red-500 flex items-center justify-center text-white text-sm font-bold">
                  {userData.nome ? userData.nome.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                </div>
              )}
            </div>
            
            {/* Badge do Plano */}
            <div className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full flex items-center space-x-1">
              <span>{userData.plano ? getPlanDisplayName(userData.plano) : "Eco"}</span>
              <span className="text-orange-400">◆</span>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Seus Lances Ativos</h1>
          <p className="text-black">Acompanhe o status dos seus lances nos prêmios</p>
        </div>

        {lances.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Star className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-black mb-2">Nenhum lance ainda</h3>
            <p className="text-black mb-6">Você ainda não deu nenhum lance em prêmios</p>
            <Button
              onClick={() => setLocation('/beneficios')}
              className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 hover:from-yellow-500 hover:via-orange-500 hover:to-red-600 text-white font-semibold px-8 py-3 rounded-xl"
              data-testid="btn-explorar-beneficios-empty"
            >
              Explorar Benefícios
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {lances.map((lance, index) => {
              const statusInfo = getStatusInfo(lance.status);
              
              return (
                <motion.div
                  key={lance.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    scale: statusInfo.showAnimation ? [1, 1.02, 1] : 1
                  }}
                  transition={{ 
                    delay: index * 0.1,
                    scale: { duration: 2, repeat: statusInfo.showAnimation ? Infinity : 0, repeatType: "reverse" }
                  }}
                  className={`${statusInfo.cardColor || 'bg-white'} rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200`}
                  data-testid={`lance-card-${lance.id}`}
                >
                  <div className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Imagem do benefício */}
                      <div className="flex-shrink-0">
                        {(lance.beneficio.imagemCardUrl || lance.beneficio.imagemUrl) ? (
                          <img
                            src={lance.beneficio.imagemCardUrl || lance.beneficio.imagemUrl}
                            alt={lance.beneficio.titulo}
                            className="w-20 h-20 rounded-xl object-cover"
                            loading="lazy"
                            onError={(e) => {
                              // Fallback para imagemUrl se imagemCardUrl falhar
                              const img = e.currentTarget;
                              if (img.src.includes('tipo=card') && lance.beneficio.imagemUrl) {
                                img.src = lance.beneficio.imagemUrl;
                              }
                            }}
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                            <Star className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Informações do lance */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-black mb-2">
                          {lance.beneficio.titulo}
                        </h3>
                        <p className="text-gray-700 mb-3 line-clamp-2">
                          {lance.beneficio.descricao}
                        </p>
                        
                        <div className="space-y-4">
                          {/* Primeira linha: Lance e Data */}
                          <div className="flex items-center space-x-6">
                            <div className="text-sm">
                              <span className="text-black">Lance:</span>
                              <span className="font-bold text-yellow-600 ml-1">
                                {lance.pontosOfertados} Gritos
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {new Date(lance.dataLance).toLocaleDateString('pt-BR')}
                            </div>
                          </div>

                          {/* Segunda linha: Status e Botão */}
                          <div className="flex items-center justify-between gap-2 flex-nowrap">
                            <div className={`inline-flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold ${statusInfo.color} relative overflow-hidden flex-shrink max-w-[60%] sm:max-w-none`}
                                 data-testid={`status-${lance.status}-${lance.id}`}>
                              {statusInfo.showAnimation && (
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                  animate={{ x: [-100, 200] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                />
                              )}
                              <div className="relative z-10 flex items-center space-x-1 sm:space-x-2">
                                {statusInfo.icon}
                                {statusInfo.showAnimation && <Sparkles className="w-4 h-4 text-yellow-500" />}
                                <span className="whitespace-nowrap text-ellipsis overflow-hidden">{statusInfo.text}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0 min-w-0">
                              <div className="text-xs text-gray-400 hidden sm:block">
                                ID #{lance.id}
                              </div>
                              <Button
                                size="sm"
                                onClick={() => setLanceDetalhes(lance.beneficioId)}
                                className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 hover:from-yellow-500 hover:via-orange-500 hover:to-red-600 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm px-3 sm:px-4 min-w-[85px] sm:min-w-auto"
                                data-testid={`btn-detalhes-${lance.beneficioId}`}
                              >
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                <span className="whitespace-nowrap">Ver Detalhes</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informações extras por status */}
                  {lance.status === 'ativo' && (
                    <div className="px-6 pb-4 pt-4 mt-4 border-t border-gray-200">
                      <div className="bg-gray-200 rounded-full h-2">
                        <motion.div 
                          className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full"
                          animate={{ width: ['60%', '80%', '60%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        ></motion.div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Resultado será anunciado em breve
                      </p>
                    </div>
                  )}
                  
                  {lance.status === 'ganhou' && (
                    <div className="px-6 pb-4 pt-4 mt-4 border-t border-green-200 bg-gradient-to-r from-green-50 to-yellow-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <PartyPopper className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-semibold text-green-800">
                            Prêmio conquistado!
                          </span>
                        </div>
                        <div className="text-xs text-green-700">
                          <span className="font-medium">{lance.pontosOfertados} Gritos</span> foram descontados
                        </div>
                      </div>
                      <p className="text-xs text-green-600 mt-2">
                        🎉 Você será contatado em breve para receber seu prêmio!
                      </p>
                    </div>
                  )}
                  
                  {lance.status === 'perdeu' && (
                    <div className="px-6 pb-4 pt-4 mt-4 border-t border-blue-200 bg-gradient-to-r from-blue-50 to-slate-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Zap className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-800">
                            Seus Gritos foram devolvidos
                          </span>
                        </div>
                        <div className="text-xs text-blue-700">
                          <span className="font-medium">+{lance.pontosOfertados} Gritos</span> na sua conta
                        </div>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        💪 Continue participando! Você tem grandes chances de ganhar!
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Botão para voltar aos benefícios */}
        {lances.length > 0 && (
          <div className="mt-8 text-center">
            <Button
              onClick={() => setLocation('/beneficios')}
              variant="outline"
              className="border-2 border-gray-300 hover:border-yellow-400 text-black hover:text-yellow-600 font-semibold px-8 py-3 rounded-xl bg-transparent"
              data-testid="btn-explorar-mais-premios"
            >
              Explorar Mais Prêmios
            </Button>
          </div>
        )}

        {/* Modal de Detalhes */}
        {lanceDetalhes && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="p-6">
                {/* Cabeçalho */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">Detalhes do Lance</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLanceDetalhes(null)}
                    className="hover:bg-gray-100 rounded-full p-2"
                    data-testid="btn-fechar-modal"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {isLoadingEstatisticas ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Carregando estatísticas...</p>
                  </div>
                ) : estatisticas ? (
                  <div className="space-y-6">
                    {/* Tempo Restante */}
                    {!estatisticas.lanceEncerrado && (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <Timer className="w-5 h-5 text-blue-600" />
                          <h4 className="font-bold text-blue-900">Tempo Restante</h4>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {estatisticas.tempoRestante.horas}h {estatisticas.tempoRestante.minutos}m {estatisticas.tempoRestante.segundos}s
                        </div>
                        <p className="text-sm text-blue-700 mt-1">até o encerramento do lance</p>
                      </div>
                    )}

                    {/* Estatísticas Gerais */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-yellow-50 rounded-xl p-4 text-center">
                        <Users className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-yellow-600">{estatisticas.totalLances}</div>
                        <div className="text-sm text-yellow-700">Total de Lances</div>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4 text-center">
                        <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-600">#{estatisticas.posicaoUsuario}</div>
                        <div className="text-sm text-green-700">Sua Posição</div>
                      </div>
                    </div>

                    {/* Top 3 Lances */}
                    <div>
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                        <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                        Ranking dos Lances
                      </h4>
                      <div className="space-y-2">
                        {estatisticas.top3Lances.map((lance) => (
                          <div
                            key={lance.posicao}
                            className={`flex items-center justify-between p-3 rounded-xl border ${
                              lance.isUsuario
                                ? 'bg-yellow-50 border-yellow-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                lance.posicao === 1 ? 'bg-yellow-500 text-white' :
                                lance.posicao === 2 ? 'bg-gray-400 text-white' :
                                'bg-orange-400 text-white'
                              }`}>
                                {lance.posicao}
                              </div>
                              <div>
                                <div className={`font-medium ${
                                  lance.isUsuario ? 'text-yellow-700' : 'text-gray-900'
                                }`}>
                                  {lance.nome} {lance.isUsuario && '(Você)'}
                                </div>
                              </div>
                            </div>
                            <div className="font-bold text-yellow-600">
                              {lance.pontos} Gritos
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Seu Lance */}
                    {estatisticas.lanceUsuario ? (
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-4 border-2 border-yellow-200">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold text-yellow-900">Seu Lance</h4>
                          {!estatisticas.lanceEncerrado && estatisticas.posicaoUsuario > 1 && (
                            <Button
                              size="sm"
                              onClick={handleAumentarLance}
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200"
                              data-testid="btn-aumentar-lance"
                            >
                              <TrendingUp className="w-4 h-4 mr-1" />
                              Aumentar Lance
                            </Button>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-xl font-bold text-yellow-600">
                              {estatisticas.lanceUsuario.pontos} Gritos
                            </div>
                            <div className="text-sm text-yellow-700">
                              Posição #{estatisticas.posicaoUsuario} de {estatisticas.totalLances}
                              {estatisticas.posicaoUsuario > 1 && (
                                <span className="text-orange-600 ml-2">• Você pode melhorar!</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-sm text-yellow-700">
                            <div>Lance feito em:</div>
                            <div className="font-medium">
                              {new Date(estatisticas.lanceUsuario.dataLance).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 border-2 border-gray-200">
                        <div className="text-center">
                          <h4 className="font-bold text-gray-700 mb-2">Você ainda não tem lance neste benefício</h4>
                          <p className="text-sm text-gray-600">Vá para a página de benefícios para fazer seu primeiro lance.</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Erro ao carregar dados</h4>
                    <p className="text-gray-600">Não foi possível carregar as estatísticas do lance.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal de Aumentar Lance */}
        {showAumentarLance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
               data-testid="modal-aumentar-lance">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-gray-800 rounded-3xl max-w-md w-full shadow-2xl"
            >
              <div className="p-6">
                {/* Cabeçalho */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">Aumentar Lance</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAumentarLance(false)}
                    className="hover:bg-gray-100 rounded-full p-2"
                    data-testid="btn-fechar-modal-aumentar"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Status atual */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Situação Atual</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Seu lance atual:</span>
                      <span className="font-bold text-yellow-600">{estatisticas?.lanceUsuario.pontos} Gritos</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-gray-600">Sua posição:</span>
                      <span className="font-bold text-orange-600">#{estatisticas?.posicaoUsuario}</span>
                    </div>
                  </div>

                  {/* Novo lance */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                    <h4 className="font-semibold text-green-700 mb-3">Novo Lance Sugerido</h4>
                    <div className="flex items-center justify-center space-x-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setNovoLanceValor(Math.max(1, novoLanceValor - 5))}
                        className="border-green-300 hover:bg-green-50"
                      >
                        -5
                      </Button>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700">{novoLanceValor}</div>
                        <div className="text-sm text-green-600">Gritos</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setNovoLanceValor(novoLanceValor + 5)}
                        className="border-green-300 hover:bg-green-50"
                      >
                        +5
                      </Button>
                    </div>
                    
                    {userStats && (
                      <div className="mt-3 text-center text-sm text-green-700">
                        Você tem <span className="font-bold">{userStats.gritosTotal || 0} Gritos</span> disponíveis
                      </div>
                    )}
                  </div>

                  {/* Vantagem */}
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">🎯 Com este lance:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Você ficará em <strong>1º lugar</strong></li>
                      <li>• Maiores chances de ganhar o prêmio</li>
                      <li>• Diferença: +{novoLanceValor - (estatisticas?.lanceUsuario.pontos || 0)} Gritos</li>
                    </ul>
                  </div>

                  {/* Botões */}
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowAumentarLance(false)}
                      className="flex-1"
                      disabled={aumentarLanceMutation.isPending}
                      data-testid="btn-cancelar-aumento"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={confirmarAumentarLance}
                      disabled={aumentarLanceMutation.isPending || !userStats || (userStats.gritosTotal || 0) < novoLanceValor}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                      data-testid="btn-confirmar-aumento"
                    >
                      {aumentarLanceMutation.isPending ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Enviando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4" />
                          <span>Confirmar Lance</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}