import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { motion } from 'framer-motion';
import { ArrowLeft, Star, AlertCircle, CheckCircle, Gift, Sparkles, Target, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useUserData } from "@/hooks/useUserData";
import { useToast } from "@/hooks/use-toast";
import * as LucideIcons from 'lucide-react';
import Logo from "@/components/logo";
import { useProfileImage } from "@/hooks/useProfileImage";

interface Beneficio {
  id: number;
  titulo: string;
  descricao: string;
  icone: string;
  imagem?: string;
  imagemUrl?: string;
  imagemCardUrl?: string; // Imagem específica para cards/thumbnails
  imagemDetalhesUrl?: string; // Imagem específica para view de detalhes
  categoria: string;
  planosDisponiveis: string[];
  pontosNecessarios: string | number;
  ativo: boolean;
  ordem: number;
  createdAt: string;
  updatedAt: string;
}

// Componente para renderizar ícones do Lucide dinamicamente
const DynamicIcon = ({ iconName, className = "w-6 h-6" }: { iconName: string; className?: string }) => {
  const IconComponent = (LucideIcons as any)[iconName];
  
  if (!IconComponent) {
    return <Star className={className} />;
  }
  
  return <IconComponent className={className} />;
};

// Função para capitalizar primeira letra
const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export default function BeneficioDetalhes() {
  const [, setLocation] = useLocation();
  const { id: beneficioId } = useParams<{ id: string }>();
  const { userData } = useUserData();
  const { profileImage } = useProfileImage();
  const { toast } = useToast();
  const [isSubmittingLance, setIsSubmittingLance] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [jaParticipou, setJaParticipou] = useState(false);
  const [valorLanceCustomizado, setValorLanceCustomizado] = useState<number>(0);

  // Buscar prêmio específico
  const { data: beneficio, isLoading: isLoadingBeneficio } = useQuery<Beneficio>({
    queryKey: [`/api/beneficios/${beneficioId}`],
    enabled: !!beneficioId,
    select: (data) => {
      // Transformar os dados para usar o endpoint de imagem correto
      return {
        ...data,
        imagemUrl: `/api/beneficios/${data.id}/imagem` // Usar o endpoint interno que funciona
      };
    }
  });

  // Buscar dados do usuário incluindo gritos
  const userId = localStorage.getItem("userId");
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

  // Verificar se usuário já participou deste prêmio
  const { data: participacaoData } = useQuery({
    queryKey: ["participacao-beneficio", userId, beneficioId],
    queryFn: async () => {
      if (!userId || !beneficioId) return null;
      try {
        const response = await fetch(`/api/users/${userId}/participacao-beneficio/${beneficioId}`);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error("Error checking participation:", error);
      }
      return { jaParticipou: false };
    },
    enabled: !!userId && !!beneficioId
  });

  // Atualizar estado baseado na resposta da API
  useEffect(() => {
    if (participacaoData) {
      setJaParticipou(participacaoData.jaParticipou || false);
    }
  }, [participacaoData]);

  const getPlanDisplayName = (plano: string) => {
    const planNames = {
      eco: "Eco",
      voz: "Voz", 
      grito: "O Grito",
      platinum: "Platinum"
    };
    return planNames[plano as keyof typeof planNames] || "Eco";
  };

  // Verificar elegibilidade
  const verificarElegibilidade = () => {
    if (!beneficio || !userData || !userStats) {
      return {
        elegivel: false,
        motivo: "Carregando dados...",
        tipo: "loading"
      };
    }

    const pontosNecessarios = typeof beneficio.pontosNecessarios === 'string' 
      ? parseInt(beneficio.pontosNecessarios.replace(/\D/g, '')) || 0
      : typeof beneficio.pontosNecessarios === 'number' 
        ? beneficio.pontosNecessarios 
        : 0;
    const pontosUsuario = userStats.gritosTotal || 0;
    const planoUsuario = userData.plano || "eco";

    // Verificar pontos
    if (pontosUsuario < pontosNecessarios) {
      const pontosFaltantes = pontosNecessarios - pontosUsuario;
      return {
        elegivel: false,
        motivo: `Você precisa de mais ${pontosFaltantes} Gritos`,
        tipo: "pontos"
      };
    }

    // Verificar se já participou
    if (jaParticipou) {
      return {
        elegivel: false,
        motivo: "Você já deu seu lance neste prêmio",
        tipo: "ja_participou"
      };
    }

    // Verificar plano
    if (beneficio.planosDisponiveis && beneficio.planosDisponiveis.length > 0) {
      const planosValidos = beneficio.planosDisponiveis.map(p => p.toLowerCase());
      if (!planosValidos.includes(planoUsuario.toLowerCase())) {
        const planosNomes = beneficio.planosDisponiveis.map(p => getPlanDisplayName(p)).join(", ");
        return {
          elegivel: false,
          motivo: `Exclusivo para assinantes ${planosNomes}`,
          tipo: "plano"
        };
      }
    }

    return {
      elegivel: true,
      motivo: "Você pode dar seu lance!",
      tipo: "elegivel"
    };
  };

  const elegibilidade = verificarElegibilidade();

  const handleDarLance = async () => {
    // Inicializar com o valor mínimo
    const minimo = beneficio ? 
      (typeof beneficio.pontosNecessarios === 'string' 
        ? parseInt(beneficio.pontosNecessarios.replace(/\D/g, '')) || 0
        : typeof beneficio.pontosNecessarios === 'number' 
          ? beneficio.pontosNecessarios 
          : 0)
      : 0;
    setValorLanceCustomizado(minimo);
    setShowConfirmModal(true);
  };

  const confirmarLance = async () => {
    if (!elegibilidade.elegivel || !beneficioId || !userId) return;
    
    // Validar valor mínimo
    const minimo = beneficio ? 
      (typeof beneficio.pontosNecessarios === 'string' 
        ? parseInt(beneficio.pontosNecessarios.replace(/\D/g, '')) || 0
        : typeof beneficio.pontosNecessarios === 'number' 
          ? beneficio.pontosNecessarios 
          : 0)
      : 0;
    
    if (valorLanceCustomizado < minimo) {
      toast({
        title: "Valor inválido",
        description: `O lance mínimo é ${minimo} Gritos`,
        variant: "destructive",
      });
      return;
    }
    
    if (userStats && valorLanceCustomizado > (userStats.gritosTotal || 0)) {
      toast({
        title: "Gritos insuficientes",
        description: `Você tem apenas ${userStats.gritosTotal || 0} Gritos`,
        variant: "destructive",
      });
      return;
    }
    
    setShowConfirmModal(false);
    setIsSubmittingLance(true);
    
    try {
      const response = await apiRequest(`/api/beneficios/${beneficioId}/lance`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          valorLance: valorLanceCustomizado,
          pontosOfertados: valorLanceCustomizado
        })
      });

      if (response.success) {
        toast({
          title: "✅ Seu lance foi registrado!",
          description: `${valorLanceCustomizado} Gritos foram deduzidos da sua conta.`,
          duration: 5000,
        });

        setJaParticipou(true);

        setTimeout(() => {
          setLocation('/meus-lances');
        }, 2000);
      }

    } catch (error) {
      console.error("Erro ao dar lance:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar seu lance. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingLance(false);
    }
  };

  if (isLoadingBeneficio) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando prêmio...</p>
        </div>
      </div>
    );
  }

  if (!beneficio) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Benefício não encontrado</h2>
          <p className="text-gray-600 mb-4">O prêmio que você está procurando não existe ou foi removido.</p>
          <Button onClick={() => setLocation('/beneficios')}>
            Voltar aos prêmios
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white font-inter">
      {/* Header com fundo branco */}
      <header className="bg-white border-b border-gray-100">
        <div className="px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => setLocation('/beneficios')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar</span>
          </button>
          
          <div className="flex items-center justify-center">
            <Logo size="sm" />
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Foto de Perfil */}
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
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
              <span className="text-orange-500">◆</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section com imagem */}
      <div className="relative">
        {(beneficio.imagemDetalhesUrl || beneficio.imagemUrl || beneficio.imagem) && (
          <div className="w-full h-80 relative overflow-hidden">
            <img 
              src={beneficio.imagem}
              alt={beneficio.titulo}
              className="w-full h-full object-cover"
              style={{ 
                imageRendering: 'crisp-edges',
                filter: 'contrast(1.05) saturate(1.1)',
                backfaceVisibility: 'hidden'
              }}
              loading="eager"
              decoding="sync"
              onError={(e) => {
                console.log("Erro ao carregar imagem de detalhes:", beneficio.imagemDetalhesUrl || beneficio.imagemUrl || beneficio.imagem);
                // Fallback para imagemUrl se imagemDetalhesUrl falhar
                const img = e.currentTarget;
                if (beneficio.imagemUrl) {
                  img.src = beneficio.imagemUrl;                  
                } else if (beneficio.imagem) {                  
                  img.src = beneficio.imagem;
                } else {
                  img.style.display = 'none';
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            
            {/* Badge de categoria flutuante */}
            <div className="absolute top-4 left-4">
              <div className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-2 rounded-full text-sm font-semibold shadow-lg">
                {capitalizeFirstLetter(beneficio.categoria)}
              </div>
            </div>
            
            {/* Badge de pontos flutuante */}
            <div className="absolute top-4 right-4">
              <div className="bg-yellow-400/90 backdrop-blur-sm text-black px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center space-x-1">
                <Sparkles className="w-4 h-4" />
                <span>{beneficio.pontosNecessarios} Gritos</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Conteúdo principal */}
      <main className="relative -mt-6 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white rounded-t-3xl shadow-xl overflow-hidden"
        >
          {/* Cabeçalho do prêmio */}
          <div className="px-6 pt-8 pb-6 border-b border-gray-100">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{beneficio.titulo}</h1>
            
            {/* Indicadores visuais */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1 text-green-600">
                <Target className="w-4 h-4" />
                <span className="font-medium">Disponível agora</span>
              </div>
              <div className="flex items-center space-x-1 text-blue-600">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Válido por tempo limitado</span>
              </div>
            </div>
          </div>

          {/* Descrição em card destacado */}
          <div className="px-6 py-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Gift className="w-6 h-6 mr-3 text-blue-600" />
                O que você vai receber
              </h2>
              <p className="text-gray-700 leading-relaxed text-lg">{beneficio.descricao}</p>
            </div>
          </div>

          {/* Status de elegibilidade - card destacado */}
          <div className="px-6 pb-6">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className={`p-6 rounded-2xl border-2 ${
                elegibilidade.elegivel 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                  : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-full ${
                  elegibilidade.elegivel ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {elegibilidade.elegivel ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`text-xl font-bold mb-2 ${
                    elegibilidade.elegivel ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {elegibilidade.elegivel ? "🎉 Você está elegível!" : "⚠️ Não elegível"}
                  </h3>
                  <p className={`text-lg mb-3 ${
                    elegibilidade.elegivel ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {elegibilidade.motivo}
                  </p>
                  {userStats && (
                    <div className="bg-white/50 rounded-lg p-3">
                      <p className="text-sm text-gray-700 font-medium">
                        💎 Seus Gritos: <span className="font-bold text-yellow-600">{userStats.gritosTotal || 0}</span> • 
                        📋 Plano: <span className="font-bold text-blue-600">{getPlanDisplayName(userData.plano || "eco")}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Informações detalhadas */}
          <div className="px-6 pb-6">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Detalhes importantes</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                  <span className="text-gray-700">{beneficio.pontosNecessarios} Gritos necessários para participar</span>
                </li>
                {beneficio.planosDisponiveis && beneficio.planosDisponiveis.length > 0 && (
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                    <span className="text-gray-700">Disponível para assinantes: {beneficio.planosDisponiveis.map(p => getPlanDisplayName(p)).join(", ")}</span>
                  </li>
                )}
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <span className="text-gray-700">Válido enquanto durar o estoque</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                  <span className="text-gray-700">Não é possível transferir o prêmio para terceiros</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Botão de ação moderno */}
          <div className="px-6 pb-8">
            <motion.div
              whileHover={{ scale: elegibilidade.elegivel ? 1.02 : 1 }}
              whileTap={{ scale: elegibilidade.elegivel ? 0.98 : 1 }}
            >
              <Button
                onClick={handleDarLance}
                disabled={!elegibilidade.elegivel || isSubmittingLance}
                className={`w-full py-4 text-xl font-bold rounded-2xl transition-all duration-300 ${
                  elegibilidade.elegivel
                    ? 'bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 hover:from-yellow-500 hover:via-orange-500 hover:to-red-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmittingLance ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Enviando seu lance...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-3">
                    {elegibilidade.elegivel ? (
                      <>
                        <Sparkles className="w-6 h-6" />
                        <span>🚀 Dar meu lance agora!</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-6 h-6" />
                        <span>Não elegível</span>
                      </>
                    )}
                  </div>
                )}
              </Button>
            </motion.div>
          </div>

          {/* Dicas para melhorar elegibilidade */}
          {!elegibilidade.elegivel && elegibilidade.tipo !== "loading" && (
            <div className="px-6 pb-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-200"
              >
                <h4 className="font-bold text-yellow-900 mb-4 text-lg flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  💡 Como se tornar elegível?
                </h4>
                {elegibilidade.tipo === "pontos" && (
                  <div className="space-y-3 text-yellow-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span>Complete suas missões diárias para ganhar mais Gritos</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span>Faça check-in todos os dias</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span>Participe de eventos especiais</span>
                    </div>
                  </div>
                )}
                {elegibilidade.tipo === "plano" && (
                  <div className="space-y-4">
                    <div className="space-y-3 text-yellow-800">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span>Considere fazer upgrade do seu plano</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span>Benefícios exclusivos estão disponíveis em planos superiores</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setLocation('/plans')}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl"
                    >
                      🚀 Ver planos disponíveis
                    </Button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Modal de Confirmação de Lance */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-yellow-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Quanto você quer oferecer?
              </h3>
              
              <p className="text-sm text-gray-500 mb-6">
                Mínimo: {beneficio.pontosNecessarios} Gritos • Você tem: {userStats?.gritosTotal || 0} Gritos
              </p>
              
              {/* Controle de valor do lance */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    type="button"
                    onClick={() => {
                      const minimo = typeof beneficio.pontosNecessarios === 'string' 
                        ? parseInt(beneficio.pontosNecessarios.replace(/\D/g, '')) || 0
                        : beneficio.pontosNecessarios || 0;
                      setValorLanceCustomizado(Math.max(minimo, valorLanceCustomizado - 10));
                    }}
                    variant="outline"
                    className="w-12 h-12 rounded-full text-2xl font-bold"
                    disabled={valorLanceCustomizado <= (typeof beneficio.pontosNecessarios === 'string' ? parseInt(beneficio.pontosNecessarios.replace(/\D/g, '')) || 0 : beneficio.pontosNecessarios || 0)}
                  >
                    −
                  </Button>
                  
                  <div className="flex-1">
                    <input
                      type="number"
                      value={valorLanceCustomizado}
                      onChange={(e) => {
                        const valor = parseInt(e.target.value) || 0;
                        const minimo = typeof beneficio.pontosNecessarios === 'string' 
                          ? parseInt(beneficio.pontosNecessarios.replace(/\D/g, '')) || 0
                          : beneficio.pontosNecessarios || 0;
                        const maximo = userStats?.gritosTotal || 0;
                        setValorLanceCustomizado(Math.min(Math.max(minimo, valor), maximo));
                      }}
                      className="w-full text-center text-4xl font-bold text-yellow-600 bg-transparent border-none focus:outline-none focus:ring-0"
                      min={typeof beneficio.pontosNecessarios === 'string' ? parseInt(beneficio.pontosNecessarios.replace(/\D/g, '')) || 0 : beneficio.pontosNecessarios || 0}
                      max={userStats?.gritosTotal || 0}
                    />
                    <p className="text-xs text-gray-500 mt-1">Gritos</p>
                  </div>
                  
                  <Button
                    type="button"
                    onClick={() => {
                      const maximo = userStats?.gritosTotal || 0;
                      setValorLanceCustomizado(Math.min(valorLanceCustomizado + 10, maximo));
                    }}
                    variant="outline"
                    className="w-12 h-12 rounded-full text-2xl font-bold"
                    disabled={valorLanceCustomizado >= (userStats?.gritosTotal || 0)}
                  >
                    +
                  </Button>
                </div>
                
                {/* Atalhos rápidos */}
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setValorLanceCustomizado(typeof beneficio.pontosNecessarios === 'string' ? parseInt(beneficio.pontosNecessarios.replace(/\D/g, '')) || 0 : beneficio.pontosNecessarios || 0)}
                    className="flex-1 py-2 text-xs font-medium bg-white rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Mínimo
                  </button>
                  <button
                    type="button"
                    onClick={() => setValorLanceCustomizado(userStats?.gritosTotal || 0)}
                    className="flex-1 py-2 text-xs font-medium bg-white rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Tudo
                  </button>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <Button
                  onClick={() => setShowConfirmModal(false)}
                  variant="outline"
                  className="flex-1 py-3 text-lg font-semibold border-2 border-gray-300 hover:border-gray-400"
                >
                  Cancelar
                </Button>
                
                <Button
                  onClick={confirmarLance}
                  disabled={isSubmittingLance}
                  className="flex-1 py-3 text-lg font-semibold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 hover:from-yellow-500 hover:via-orange-500 hover:to-red-600 text-white"
                >
                  {isSubmittingLance ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Enviando...</span>
                    </div>
                  ) : (
                    "Confirmar Lance"
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}