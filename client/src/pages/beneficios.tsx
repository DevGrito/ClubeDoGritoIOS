import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { motion } from 'framer-motion';
import { Star, Heart, MapPin, Menu, RefreshCw, ArrowLeft, CheckCircle, User, Gift, CreditCard, BookOpen, ChevronRight, ChevronLeft, LogOut, Shield } from 'lucide-react';
import StoriesViewer from '@/components/StoriesViewer';
import BottomNavigation from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Logo from "@/components/logo";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUserData } from "@/hooks/useUserData";
import { useProfileImage } from "@/hooks/useProfileImage";
import { UserAvatar } from "@/components/UserAvatar";
import * as LucideIcons from 'lucide-react';
import { beneficios } from "@shared/schema";
import useActivityTracker from "@/hooks/useActivityTracker";
import { CheckinCard } from "@/components/CheckinCard";

// Import Beneficio type from shared schema
type Beneficio = typeof beneficios.$inferSelect;

// Componente para mostrar o número do doador
const DonorNumberBadge = ({ userId }: { userId: number }) => {
  const { data: donorNumber, isLoading } = useQuery({
    queryKey: ['/api/users', userId, 'donor-number'],
    queryFn: () => apiRequest(`/api/users/${userId}/donor-number`),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  if (isLoading || !donorNumber?.success || !donorNumber?.donorNumber) {
    return null;
  }

  return (
    <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-md z-10">
      #{donorNumber.donorNumber}
    </div>
  );
};

// Componente para mostrar a escolha do "Grito" do usuário
const UserGritoBadge = ({ userId }: { userId: number }) => {
  const { data: userCausa, isLoading } = useQuery({
    queryKey: ['/api/users', userId, 'causa'],
    queryFn: () => apiRequest(`/api/users/${userId}/causa`),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !userCausa?.success || !userCausa?.causa) {
    return null;
  }

  return (
    <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-md z-10">
      {userCausa.causa}
    </div>
  );
};

// Componente para renderizar ícones do Lucide dinamicamente
const DynamicIcon = ({ iconName, className = "w-6 h-6" }: { iconName: string; className?: string }) => {
  const IconComponent = (LucideIcons as any)[iconName];
  
  if (!IconComponent) {
    // Fallback para ícone padrão caso o nome não seja encontrado
    return <Star className={className} />;
  }
  
  return <IconComponent className={className} />;
};

// Função para capitalizar primeira letra
const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
function getBeneficioImageSrc(b: any): string {
  if (!b) return "/assets/placeholder-beneficio.png";
  return (
    b.imagemCardUrl ||      // /api/beneficios/:id/imagem?tipo=card
    b.imagemUrl    ||       // /api/beneficios/:id/imagem (fallback)
    b.imagem       ||       // compat legado (backend já preenche /api/…)
    "/assets/placeholder-beneficio.png"
  );
}

// Dados serão carregados via useUserData hook
export default function Beneficios() {
  const [, setLocation] = useLocation();
  const [isStoriesOpen, setIsStoriesOpen] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showBeneficiosModal, setShowBeneficiosModal] = useState(false);

  // Usar hook centralizado para dados do usuário - DEVE vir antes de qualquer useEffect que use userData
  const { userData } = useUserData();
  const { profileImage } = useProfileImage();

  // Sistema de rastreamento de atividade
  const userIdFromStorage = parseInt(localStorage.getItem('userId') || '0', 10);
  const activityTracker = useActivityTracker({
    userId: userIdFromStorage,
    enableViewTracking: true,
    enableDurationTracking: true,
    minDurationMs: 4000, // Mínimo 4 segundos para considerar visualização de benefício
  });

  // Rastreamento inicial da página de benefícios
  useEffect(() => {
    if (userIdFromStorage > 0) {
      activityTracker.trackClick('page', 'beneficios', 'Página de Benefícios', 'navegacao', ['beneficios', 'home']);
    }
  }, [userIdFromStorage]);

  // 🎯 Verificar se é primeira vez acessando benefícios
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const viuBoasVindas = localStorage.getItem('viuBoasVindasBeneficios');
    const userSpecificKey = localStorage.getItem(`viuBoasVindasBeneficios_${userId}`);
    
    console.log('🔍 DEBUG ONBOARDING - userId:', userId);
    console.log('🔍 DEBUG ONBOARDING - userData:', userData);
    
    // Aguardar userId E userData serem carregados
    if (!userId || !userData) {
      console.log('⏳ Aguardando dados do usuário...');
      return;
    }
    
    // ✅ CORREÇÃO 1: Verificar se usuário tem mais de 1 dia de cadastro (não é novo)
    const dataCadastro = (userData as any).dataCadastro || (userData as any).createdAt;
    const isOldUser = dataCadastro && (Date.now() - new Date(dataCadastro).getTime() > 24 * 60 * 60 * 1000);
    
    // ✅ CORREÇÃO 2: Pular onboarding para roles específicos
    const skipOnboardingRoles = ['patrocinador', 'doador', 'leo', 'desenvolvedor', 'professor', 'conselho'];
    const shouldSkipByRole = userData.role && skipOnboardingRoles.includes(userData.role);
    
    // ✅ CORREÇÃO 3: Pular se já viu onboarding antes (localStorage)
    const hasSeenOnboarding = viuBoasVindas === 'true' || userSpecificKey === 'true';
    
    // Pular onboarding se: usuário antigo OU role especial OU já viu antes
    if (isOldUser || shouldSkipByRole || hasSeenOnboarding) {
      console.log('✅ Usuário', userId, '- pulando onboarding:', {isOldUser, shouldSkipByRole, hasSeenOnboarding});
      // Marcar como visto para não perguntar novamente
      localStorage.setItem('viuBoasVindasBeneficios', 'true');
      localStorage.setItem(`viuBoasVindasBeneficios_${userId}`, 'true');
      return;
    }
    
    // Se chegou aqui, é usuário novo que nunca viu onboarding
    console.log('🔄 Redirecionando para onboarding - primeira vez do usuário', userId);
    setLocation('/beneficios-onboarding');
  }, [setLocation, userData]);

  const openStories = (index: number) => {
    setCurrentStoryIndex(index);
    setIsStoriesOpen(true);
  };

  const closeStories = () => {
    setIsStoriesOpen(false);
  };
  const [showCheckinScreen, setShowCheckinScreen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentBenefitSlide, setCurrentBenefitSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const benefitScrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Estado para controlar o menu lateral de ajuda
  const [showHelpMenu, setShowHelpMenu] = useState(false);

  // Definição dos níveis da Jornada do Seu Grito
  const niveisJornada = [
    {
      id: 1,
      nome: "Aliado do Grito",
      descricao: "Primeiro passo na jornada de transformação",
      gritos: 0,
      imagem: "attached_assets/image_1756491369207.png",
      proximo: "Eco do Bem"
    },
    {
      id: 2,
      nome: "Eco do Bem",
      descricao: "Ampliando seu impacto na comunidade",
      gritos: 1001,
      imagem: "attached_assets/image_1756491440300.png",
      proximo: "Voz da Mudança"
    },
    {
      id: 3,
      nome: "Voz da Mudança",
      descricao: "Liderando mudanças positivas",
      gritos: 2501,
      imagem: "attached_assets/image_1756491479690.png",
      proximo: "Grito Poderoso"
    },
    {
      id: 4,
      nome: "Grito Poderoso", 
      descricao: "Criando impacto duradouro",
      gritos: 5001,
      imagem: "attached_assets/image_1756491507581.png",
      proximo: "Líder Transformador"
    },
    {
      id: 5,
      nome: "Líder Transformador",
      descricao: "Máximo nível de engajamento e impacto",
      gritos: 10001,
      imagem: "attached_assets/image_1756491533634.png",
      proximo: null
    }
  ];
  

  // ✅ Hooks movidos para o topo para evitar TDZ (Temporal Dead Zone)

  // Hook para buscar histórias inspiradoras do banco de dados
  const { data: historiasInspiradoras = [], isLoading: loadingHistorias } = useQuery<any[]>({
    queryKey: ['/api/historias-inspiradoras'],
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  // Função para tratar URLs de imagens
  const processImageUrl = (url: string) => {
    if (!url) return '/api/placeholder/300/400';
    
    // Se for URL do Google Drive, converter para formato direto
    if (url.includes('drive.google.com')) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (fileIdMatch) {
        return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
      }
    }
    
    // Se for URL do object storage ou qualquer outra URL, usar como está
    return url;
  };

  // Função para quebrar texto longo em múltiplos slides - cortando em pontos finais
  const splitTextIntoSlides = (text: string, maxChars: number = 700): string[] => {
    if (text.length <= maxChars) return [text];
    
    const slides: string[] = [];
    let currentText = text;
    
    while (currentText.length > maxChars) {
      // Procurar o último ponto final antes do limite
      let cutPoint = currentText.lastIndexOf('.', maxChars);
      
      // Se não encontrar ponto final, procurar exclamação ou interrogação
      if (cutPoint === -1) {
        cutPoint = Math.max(
          currentText.lastIndexOf('!', maxChars),
          currentText.lastIndexOf('?', maxChars)
        );
      }
      
      // Se ainda não encontrar nenhuma pontuação, procurar último espaço
      if (cutPoint === -1) {
        cutPoint = currentText.lastIndexOf(' ', maxChars);
      }
      
      // Se não encontrar nem espaço, cortar no limite mesmo
      if (cutPoint === -1) cutPoint = maxChars;
      
      // Adicionar 1 para incluir a pontuação no slide atual
      if (cutPoint < maxChars && (currentText[cutPoint] === '.' || currentText[cutPoint] === '!' || currentText[cutPoint] === '?')) {
        cutPoint += 1;
      }
      
      slides.push(currentText.substring(0, cutPoint).trim());
      currentText = currentText.substring(cutPoint).trim();
    }
    
    // Adicionar o restante se houver
    if (currentText.length > 0) {
      slides.push(currentText);
    }
    
    return slides;
  };

  // Converter histórias do banco para o formato do StoriesViewer
  const convertToStories = (historias: any[]) => {
    if (!historias || historias.length === 0) {
      return []; // Retorna lista vazia se não houver histórias
    }
    
    return historias.map(historia => {
      const processedImageBox = processImageUrl(historia.imagemBox);
      const processedImageStory = processImageUrl(historia.imagemStory);
      const texto = historia.texto || `A história de ${historia.nome || historia.titulo} é uma demonstração real de como o Clube do Grito transforma vidas. Cada doação contribui para mudanças significativas na comunidade.`;
      const textSlides = splitTextIntoSlides(texto, 700); // Limite de 700 caracteres por slide
      
      const slides: any[] = [
        {
          id: `${historia.id}_1`,
          type: 'image' as const,
          image: processedImageStory, // Usar imagem do story para o story completo
          title: historia.titulo,
          duration: 5
        }
      ];
      
      // Adicionar slides de texto baseados na quebra
      textSlides.forEach((textPart, index) => {
        slides.push({
          id: `${historia.id}_text_${index + 1}`,
          type: 'text' as const,
          content: textPart,
          backgroundColor: '#FFD700',
          duration: 6
        });
      });
      
      return {
        id: historia.id.toString(),
        title: historia.titulo,
        name: historia.nome || historia.titulo,
        image: processedImageBox, // Usar imagem do box para os cards
        slides
      };
    });
  };

  // Removido: histórias mock para exibir apenas histórias reais do banco

  // Usar dados reais do banco ou fallback para mock
  const finalStories = convertToStories(historiasInspiradoras);
  
  // Obter userId do localStorage
  const userId = localStorage.getItem("userId");
  
  // Buscar benefícios dinâmicos da API com polling para sincronização
  const { data: beneficios = [], isLoading: isLoadingBeneficios, refetch: refetchBeneficios } = useQuery<Beneficio[]>({
    queryKey: ['/api/beneficios'],
    refetchInterval: 10000, // Atualizar a cada 10 segundos para sincronização em tempo real
  });

  // 🔍 DEBUG: Log dos benefícios carregados
  useEffect(() => {
    console.log('🔍 BENEFÍCIOS CARREGADOS:', beneficios);
    beneficios.forEach((b: any) => {
    console.log(`🔍 Benefício ${b.id}: ${b.titulo}`, {
      imagemCardUrl: b.imagemCardUrl,
      imagemUrl: b.imagemUrl,
      imagem: b.imagem,
      chosen: getBeneficioImageSrc(b),
    });
  });
  }, [beneficios]);

  // Para compatibilidade com o resto do código, adicionar campos extras que são necessários  
  // Buscar dados reais do usuário do banco de dados - USANDO ENDPOINT CORRETO
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

  // Buscar KPIs do conselho para o card de impacto (dados reais do dashboard do Leo)
  const { data: conselhoKpis } = useQuery({
    queryKey: ["conselho-kpis"],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/conselho/kpis`);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error("Error fetching conselho KPIs:", error);
      }
      return null;
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  // Usar useMemo para garantir que extendedUserData seja recalculado quando userStats mudar
  const extendedUserData = useMemo(() => {
    return {
      nome: userData.nome || "Usuário", 
      plano: userData.plano || "eco",
      gritos_atuais: userStats?.gritosTotal ?? 0, // Usar o campo correto do novo endpoint
      gritos_proximo_nivel: userStats?.gritosParaProximoNivel ?? 300,
      nivel_atual: userStats?.nivelAtual ?? "Aliado do Grito",
      proximo_nivel: userStats?.proximoNivel ?? "Eco do Bem"
    };
  }, [userData, userStats]);

  // Função para atualizar dados
  const refetch = () => {
    // Esta função pode ser expandida se necessário
    console.log("Refetch called");
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

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0] || fullName;
  };


  // Controlar indicadores de bolinha baseado no scroll
  useEffect(() => {
    const carousel = document.getElementById('carrossel-jornada');
    if (!carousel) return;

    const handleScroll = () => {
      const scrollLeft = carousel.scrollLeft;
      const cardWidth = 208; // w-64 (256px) - mr-12 (48px) = 208px
      const currentIndex = Math.round(scrollLeft / cardWidth);
      
      setCurrentSlide(Math.min(currentIndex, niveisJornada.length - 1));
    };

    carousel.addEventListener('scroll', handleScroll);
    return () => carousel.removeEventListener('scroll', handleScroll);
  }, [niveisJornada.length]);

  const progressPercentage = extendedUserData ? (extendedUserData.gritos_atuais / extendedUserData.gritos_proximo_nivel) * 100 : 0;
  const gritosRestantes = extendedUserData ? extendedUserData.gritos_proximo_nivel - extendedUserData.gritos_atuais : 0;

  // Calcular nível atual baseado nos Gritos
  const nivelAtual = extendedUserData ? niveisJornada.find(nivel => {
    const gritosUsuario = extendedUserData.gritos_atuais || 0;
    const proximoNivel = niveisJornada.find(n => n.gritos > gritosUsuario);
    return proximoNivel ? nivel.gritos <= gritosUsuario && nivel.gritos >= (proximoNivel.gritos - 300) : nivel.gritos <= gritosUsuario;
  }) || niveisJornada[0] : niveisJornada[0];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 font-inter">
      {/* Header */}
      <header className="bg-white">
        <div className="px-4 py-3 flex items-center">
          {/* Elemento da Esquerda: Menu Hamburger */}
          <div className="w-16 flex justify-start">
            <button 
              onClick={() => setShowHelpMenu(true)}
              className="flex flex-col space-y-1 p-2 items-start"
            >
              <div className="w-6 h-0.5 bg-gray-700"></div>
              <div className="w-4 h-0.5 bg-gray-700"></div>
              <div className="w-6 h-0.5 bg-gray-700"></div>
            </button>
          </div>
          
          {/* Elemento Central: Logo */}
          <div className="flex-1 flex justify-center">
            <Logo size="md" />
          </div>
          
          {/* Elemento da Direita: Perfil do Usuário */}
          <div className="w-16 flex justify-end">
            <div className="flex flex-col items-center relative">
              {/* Foto de Perfil Circular */}
              <UserAvatar 
                size="md" 
                className="border-2 border-gray-200 mb-1"
                onClick={() => setLocation("/dados-cadastrais")}
              />
              
              {/* Badge do Grito */}
              {userIdFromStorage && (
                <UserGritoBadge userId={userIdFromStorage} />
              )}
              
              {/* Badge do Plano */}
              <div className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full flex items-center space-x-1">
                <span>{userData.plano ? getPlanDisplayName(userData.plano) : "Eco"}</span>
                <span className="text-orange-500">◆</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-4 md:px-8 md:py-8">
        {/* Saudação */}
        <div className="px-5 mb-8">
          <div className="mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-black mb-1">
              Fala {extendedUserData ? getFirstName(extendedUserData.nome) : "Usuário"}!
            </h2>
          </div>
          
          {/* Sistema de níveis com progresso */}
          <div className="mb-6">
            {/* Meta do próximo nível */}
            <div className="flex justify-end mb-1">
              <span className="text-sm font-bold text-gray-800">{extendedUserData?.gritos_proximo_nivel || 300}</span>
            </div>
            
            {/* Barra de progresso fina */}
            <div className="bg-gray-200 rounded-full h-4 mb-2 relative overflow-hidden">
              {extendedUserData && (
                <motion.div 
                  className="bg-yellow-400 h-full rounded-full flex items-center justify-center"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                >
                  <span className="text-sm font-bold text-black px-2">
                    {extendedUserData.gritos_atuais}
                  </span>
                </motion.div>
              )}
            </div>
            
            {/* Texto explicativo */}
            <p className="text-xs text-gray-600">
              {extendedUserData ? (
                <>
                  Faltam {gritosRestantes} Gritos para chegar ao próximo nível: <span className="font-bold">{extendedUserData?.proximo_nivel || "Eco do Bem"}</span>.
                </>
              ) : (
                "Carregando progresso..."
              )}
            </p>
          </div>
        </div>


        {/* Seção Seus Prêmios */}
        <div className="px-5 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-black">Seus Prêmios</h3>
            <button 
              className="text-blue-600 text-sm font-medium"
              onClick={() => setShowBeneficiosModal(true)}
              data-testid="button-ver-tudo"
            >
              Ver tudo
            </button>
          </div>


          {/* Loading state */}
          {isLoadingBeneficios && (
            <div className="flex items-center space-x-4 pb-4">
              <div className="animate-pulse">
                <div className="flex-shrink-0 w-48 h-40 bg-gray-200 rounded-2xl"></div>
              </div>
              <div className="animate-pulse">
                <div className="flex-shrink-0 w-48 h-40 bg-gray-200 rounded-2xl"></div>
              </div>
            </div>
          )}

          {/* Container de rolagem horizontal com botões de navegação */}
          {!isLoadingBeneficios && (
            <div className="relative">
              {/* Botão Anterior */}
              {currentBenefitSlide > 0 && (
                <button
                  onClick={() => {
                    const newIndex = currentBenefitSlide - 1;
                    benefitScrollContainerRef.current?.scrollTo({
                      left: newIndex * 336,
                      behavior: 'smooth'
                    });
                  }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
                  aria-label="Benefício anterior"
                  data-testid="button-prev-benefit"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-800" />
                </button>
              )}
              
              {/* Botão Próximo */}
              {currentBenefitSlide < beneficios.length - 1 && (
                <button
                  onClick={() => {
                    const newIndex = currentBenefitSlide + 1;
                    benefitScrollContainerRef.current?.scrollTo({
                      left: newIndex * 336,
                      behavior: 'smooth'
                    });
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
                  aria-label="Próximo benefício"
                  data-testid="button-next-benefit"
                >
                  <ChevronRight className="w-5 h-5 text-gray-800" />
                </button>
              )}
              
              <div 
                ref={benefitScrollContainerRef}
                className="overflow-x-auto pb-4 -mx-4 md:-mx-8" 
                style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
                onScroll={() => {
                  if (benefitScrollContainerRef.current) {
                    const scrollLeft = benefitScrollContainerRef.current.scrollLeft;
                    const cardWidth = 336; // 320px width + 16px margin
                    const currentIndex = Math.round(scrollLeft / cardWidth);
                    setCurrentBenefitSlide(Math.min(currentIndex, beneficios.length - 1));
                  }
                }}
              >
              <div className="flex space-x-4 px-4 md:px-8" style={{width: 'fit-content'}}>
                {beneficios.length > 0 ? (
                  beneficios.map((beneficio, index) => (
                    <motion.div 
                      key={beneficio.id}
                      className="relative flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 cursor-pointer"
                      style={{
                        width: '320px',
                        height: '180px'
                      }}
                      onClick={() => {
                        setLocation(`/beneficio-detalhes/${beneficio.id}`);
                        
                        // Rastrear clique no benefício
                        activityTracker.trackClick(
                          'beneficio',
                          beneficio.id.toString(),
                          beneficio.titulo,
                          beneficio.categoria,
                          ['beneficios', beneficio.categoria, 'card']
                        );
                      }}
                      whileHover={{ 
                        scale: 1.05,
                        rotateY: 5,
                        boxShadow: "0 25px 50px rgba(0, 0, 0, 0.3)"
                      }}
                      whileTap={{ 
                        scale: 0.95,
                        rotateY: -2
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        ease: "easeOut",
                        delay: index * 0.1
                      }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.2}
                      onDragEnd={(event, info) => {
                        const threshold = 50;
                        if (info.offset.x > threshold && currentBenefitSlide > 0) {
                          // Scroll para a esquerda
                          const newIndex = currentBenefitSlide - 1;
                          benefitScrollContainerRef.current?.scrollTo({
                            left: newIndex * 336,
                            behavior: 'smooth'
                          });
                        } else if (info.offset.x < -threshold && currentBenefitSlide < beneficios.length - 1) {
                          // Scroll para a direita
                          const newIndex = currentBenefitSlide + 1;
                          benefitScrollContainerRef.current?.scrollTo({
                            left: newIndex * 336,
                            behavior: 'smooth'
                          });
                        }
                      }}
                    >
                      {/* Imagem de fundo se houver - Otimizada para cards pequenos */}
                   {/* Imagem de fundo - prioriza /api/beneficios/:id/imagem */}
                    <img 
                      src={getBeneficioImageSrc(beneficio)}
                      alt={beneficio.titulo}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ 
                        imageRendering: 'crisp-edges',
                        filter: 'contrast(1.05) saturate(1.1)',
                        backfaceVisibility: 'hidden'
                      }}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/assets/placeholder-beneficio.png";
                      }}
                    />
                      
                      {/* Overlay escuro para melhor legibilidade */}
                      <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
                      
                      {/* Conteúdo do card */}
                      <div className="relative h-full p-6 text-white flex justify-between items-start">
                        {/* Lado esquerdo - Conteúdo */}
                        <div className="flex-1 flex flex-col justify-between h-full max-w-[60%]">
                          <div>
                            <h4 className="font-bold text-lg mb-3 leading-tight">{beneficio.titulo}</h4>
                            
                            {beneficio.pontosNecessarios && (
                              <div className="flex items-center space-x-2 mb-3">
                                <div className="bg-white/20 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
                                  <span className="mr-1">📎</span>
                                  {beneficio.pontosNecessarios}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {beneficio.planosDisponiveis && beneficio.planosDisponiveis.length > 0 && (
                            <div className="mt-auto">
                              <div className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full inline-block">
                                {beneficio.planosDisponiveis.map((plano: string) => plano.charAt(0).toUpperCase() + plano.slice(1)).join('\\')}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Lado direito - Categoria */}
                        <div className="flex-shrink-0 text-center">
                          {/* Texto da categoria */}
                          <div className="text-sm text-white/90 font-medium bg-white/20 px-3 py-2 rounded-lg">
                            {capitalizeFirstLetter(beneficio.categoria)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="w-full text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <div className="w-12 h-12 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500 text-xs">📦</span>
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm">Nenhum prêmio disponível no momento</p>
                    <button
                      onClick={() => refetchBeneficios()}
                      className="mt-2 text-yellow-600 text-sm hover:text-yellow-700"
                    >
                      Tentar novamente
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
          
          {/* Indicadores de navegação (pontinhos) */}
          {!isLoadingBeneficios && beneficios.length > 1 && (
            <div className="flex justify-center space-x-2 mt-4">
              {beneficios.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    benefitScrollContainerRef.current?.scrollTo({
                      left: index * 336,
                      behavior: 'smooth'
                    });
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentBenefitSlide 
                      ? 'bg-gray-800 scale-125' 
                      : 'bg-gray-300 hover:bg-gray-500'
                  }`}
                  whileHover={{ scale: 1.5 }}
                  whileTap={{ scale: 0.8 }}
                  aria-label={`Ir para prêmio ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Seção Check-in - Card que abre tela de progresso */}
        <div className="px-5 mb-8">
          <div 
            className="bg-yellow-400 rounded-3xl p-3.5 relative shadow-lg cursor-pointer"
            onClick={() => setShowCheckinScreen(true)}
          >
            {/* Moeda dourada no canto superior direito */}
            <div className="absolute -top-4 -right-4 pointer-events-none">
              <img 
                src="/coin-icon.png" 
                alt="Moeda" 
                className="w-16 h-16 object-contain"
              />
            </div>
            
            {/* Balão de fala */}
            <div className="absolute top-2.5 left-3.5 pointer-events-none">
              <div className="bg-white rounded-xl px-2.5 py-1 text-xs text-gray-700 relative shadow-md">
                <span>Grite hoje e ganhe mais pontos!</span>
                <div className="absolute -bottom-0.5 left-3 w-1.5 h-1.5 bg-white transform rotate-45"></div>
              </div>
            </div>
            
            {/* Conteúdo principal */}
            <div className="mt-11 mb-3.5">
              <h4 className="text-base font-bold text-black text-center leading-tight">
                Faça seu check-in diário e receba<br />
                +10 Gritos agora mesmo.
              </h4>
            </div>
            
            {/* Texto do botão */}
            <div className="w-full py-2.5 text-center rounded-full font-semibold text-sm bg-orange-200/30 border-2 border-orange-300 text-black">
              Ver progresso do check-in
            </div>
          </div>
        </div>
      </main>

      {/* Seção Jornada do Seu Grito */}
      <div className="max-w-md mx-auto">
        {/* Header da seção */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Jornada do Seu Grito</h2>
        </div>

        {/* Carrossel horizontal de níveis */}
        <div className="overflow-x-auto scrollbar-hide" id="carrossel-jornada">
          <div className="flex" style={{ width: 'fit-content' }}>
            {niveisJornada.map((nivel, index) => {
              const gritosUsuario = extendedUserData?.gritos_atuais || 0;
              const isAtingido = gritosUsuario >= nivel.gritos;
              const isBloqueado = !isAtingido;
              
              return (
                <motion.div 
                  key={nivel.id}
                  className="flex-shrink-0 w-64 h-80 relative -mr-12"
                  whileHover={{ scale: 1.02 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {/* Imagem completa como fundo do card - SEM badges */}
                  <div 
                    className={`w-full h-full bg-cover bg-center bg-no-repeat ${
                      isBloqueado ? 'filter grayscale opacity-60' : ''
                    }`}
                    style={{ 
                      backgroundImage: `url(${nivel.imagem})`,
                      backgroundSize: 'contain'
                    }}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {/* Indicadores de bolinha que seguem o scroll */}
        <div className="flex justify-center space-x-2 mt-4">
          {niveisJornada.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide ? 'bg-yellow-400' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Seção Gritos, Impacto e Missão - Layout Vertical */}
      <div className="max-w-md mx-auto px-5 mb-4 bg-transparent mt-12">
        
        {/* 1. Barra Fina de Gritos */}
        <div className="text-center">
          {(() => {
            const gritosAtuais = extendedUserData?.gritos_atuais || 0;
            const nivelAtualIndex = niveisJornada.findIndex(nivel => gritosAtuais < nivel.gritos);
            const proximoNivel = nivelAtualIndex !== -1 ? niveisJornada[nivelAtualIndex] : null;
            
            if (!proximoNivel) {
              return <p className="text-gray-900 font-medium mb-3">Parabéns! Você atingiu o nível máximo com {gritosAtuais} Gritos</p>;
            }
            
            const gritosRestantes = proximoNivel.gritos - gritosAtuais;
            return <p className="text-gray-900 font-medium mb-3">Faltam {gritosRestantes} gritos para o próximo nível</p>;
          })()}
          {(() => {
            const gritosAtuais = extendedUserData?.gritos_atuais || 0;
            // Encontrar nível atual e próximo
            const nivelAtualIndex = niveisJornada.findIndex(nivel => gritosAtuais < nivel.gritos);
            const proximoNivel = nivelAtualIndex !== -1 ? niveisJornada[nivelAtualIndex] : null;
            const gritosProximoNivel = proximoNivel ? proximoNivel.gritos : gritosAtuais;
            const nivelAnterior = nivelAtualIndex > 0 ? niveisJornada[nivelAtualIndex - 1] : { gritos: 0 };
            const gritosInicioNivel = nivelAnterior.gritos;
            
            // Calcular progresso dentro do nível atual
            const progressoNivel = gritosAtuais - gritosInicioNivel;
            const totalNivel = gritosProximoNivel - gritosInicioNivel;
            const porcentagem = Math.min((progressoNivel / totalNivel) * 100, 100);
            
            return (
              <div className="relative w-full h-8 bg-black rounded-full overflow-hidden flex items-center">
                <div 
                  className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${porcentagem}%` }}
                />
                <div className="absolute left-3 text-white font-bold text-sm">
                  {gritosAtuais}
                </div>
                <div className="absolute right-3 text-white font-bold text-sm">
                  {gritosProximoNivel}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Missão da Semana */}
        <div className="px-5 mb-6" style={{marginTop: '10px'}}>
          <motion.div 
            className="relative mx-auto bg-transparent cursor-pointer"
            style={{width: '338px', height: '156px'}}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLocation('/missoes-semanais')}
          >
            {/* Card principal */}
            <motion.div 
              style={{
                backgroundImage: 'url("/attached_assets/BG_1756832442490.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                width: '338px', 
                height: '156px',
                borderRadius: '20px'
              }} 
              className="relative overflow-visible"
            >
              {/* Conteúdo do card - textos à esquerda */}
              <div className="absolute left-0 top-0 z-30 p-6 flex flex-col justify-center h-full" style={{width: '200px'}}>
                {/* Cabeçalho com ícone */}
                <motion.div 
                  className="flex items-center mb-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <motion.div 
                    className="text-white mr-2 text-xs"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                  >
                    📈
                  </motion.div>
                  <motion.span 
                    className="text-xs text-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1 }}
                  >
                    Ganhe Gritos Hoje Mesmo!
                  </motion.span>
                </motion.div>
                
                {/* Título */}
                <div>
                  <motion.h3 
                    className="text-2xl font-normal text-white mb-0 leading-tight font-inter"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    Missão da
                  </motion.h3>
                  <motion.h3 
                    className="text-2xl font-bold text-white leading-tight font-inter italic"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    whileHover={{
                      scale: 1.05,
                      transition: { duration: 0.2 }
                    }}
                  >
                    Semana
                  </motion.h3>
                </div>
              </div>
            </motion.div>
            
            {/* Imagem das moedas sobreposta - fora do card */}
            <motion.div 
              className="absolute pointer-events-none"
              style={{
                right: '-20px',
                top: '-10px',
                zIndex: 20
              }}
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ 
                duration: 0.8, 
                delay: 0.7,
                type: "spring",
                bounce: 0.4
              }}
              whileHover={{
                rotate: [0, -5, 5, 0],
                scale: 1.1,
                transition: { duration: 0.6 }
              }}
            >
              {/* Imagem das moedas */}
              <motion.img 
                src="/attached_assets/image (7)_1756832872920.png" 
                alt="Moedas empilhadas"
                className="relative z-10"
                style={{width: '160px', height: '160px', objectFit: 'contain'}}
                animate={{
                  y: [0, -8, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Efeito de brilho nas moedas */}
              <motion.div
                className="absolute inset-0 rounded-full opacity-30"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%)',
                  width: '160px',
                  height: '160px'
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </motion.div>
        </div>
        
        {/* Botão Ver Lances - após Missão da Semana */}
        <div className="px-5 mb-6">
          <button
            onClick={() => setLocation('/meus-lances')}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Ver lances!
          </button>
        </div>
        
      </div>


      {/* Seção Histórias que Inspiram */}
      <div className="px-5 mb-8">
        {/* Título da seção */}
        <h3 className="text-xl font-bold text-gray-800 mb-4 text-left">Histórias que Inspiram</h3>
        
        {/* Container de rolagem horizontal */}
        <div 
          className="overflow-x-auto pb-4 -mx-4 md:-mx-8" 
          style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
        >
          <div className="flex space-x-4 px-4 md:px-8" style={{width: 'fit-content'}}>
            
            {/* Renderizar cards dinamicamente baseado nos dados do banco */}
            {finalStories.map((story, index) => (
              <div 
                key={story.id}
                onClick={() => openStories(index)}
                className="relative flex-shrink-0 overflow-hidden rounded-2xl shadow-lg cursor-pointer hover:scale-[1.02] transition-transform duration-200"
                style={{
                  width: '320px',
                  height: '180px',
                  backgroundImage: `url("/api/historias-inspiradoras/${story.id}/imagem?tipo=box"), url(${JSON.stringify(
                    story.image || "https://images.unsplash.com/photo-1494790108755-2616c943f671?w=400&h=200&fit=crop&crop=face"
                  )})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {/* Overlay escuro */}
                <div className="absolute inset-0 bg-black/30"></div>
                
                {/* Texto sobreposto */}
                <div className="absolute bottom-4 left-4 text-white">
                  <h4 className="text-lg font-bold">Conheça</h4>
                  <h4 className="text-lg font-bold">{story.name}</h4>
                </div>
              </div>
            ))}

          </div>
        </div>
      </div>

      
      {/* Menu de navegação inferior */}
      <BottomNavigation hidden={isStoriesOpen} />

      {/* Modal de Benefícios */}
      {showBeneficiosModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Todos os Seus Prêmios</h2>
                <button
                  onClick={() => setShowBeneficiosModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-light"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {beneficios.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {beneficios.map((beneficio: any) => (
                    <motion.div
                      key={beneficio.id}
                      className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 cursor-pointer"
                      onClick={() => {
                        setShowBeneficiosModal(false);
                        setLocation(`/beneficio-detalhes/${beneficio.id}`);
                      }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ height: '200px' }}
                    >
                      {/* Imagem de fundo se houver */}
                      {(beneficio as any).imagemUrl && (
                       <img
                          src={getBeneficioImageSrc(beneficio)}
                          alt={beneficio.titulo}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/assets/placeholder-beneficio.png";
                          }}
                      />
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/30"></div>
                      
                      {/* Conteúdo */}
                      <div className="relative h-full p-4 text-white flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-lg mb-2 leading-tight">{beneficio.titulo}</h3>
                          {beneficio.pontosNecessarios && (
                            <div className="bg-white/20 text-white px-2 py-1 rounded text-xs font-medium inline-flex items-center">
                              <span className="mr-1">📎</span>
                              {beneficio.pontosNecessarios}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-end justify-between">
                          {beneficio.planosDisponiveis && beneficio.planosDisponiveis.length > 0 && (
                            <div className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
                              {beneficio.planosDisponiveis.map((plano: string) => plano.charAt(0).toUpperCase() + plano.slice(1)).join('/')}
                            </div>
                          )}
                          
                          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <DynamicIcon iconName='Gift' className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Gift className="w-16 h-16 mx-auto" />
                  </div>
                  <p className="text-gray-500 text-lg mb-2">Nenhum prêmio disponível</p>
                  <p className="text-gray-400 text-sm">Novos prêmios serão adicionados em breve!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tela de Progresso do Check-in - Mesmo código da tela Home */}
      {showCheckinScreen && userData && (
        <motion.div 
          className="fixed inset-0 bg-white z-50 overflow-y-auto"
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {/* Header */}
          <div className="max-w-md mx-auto w-full px-4 py-4">
            {/* Botão voltar */}
            <div className="absolute top-8 left-8 z-10">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-gray-100 p-3"
                onClick={() => setShowCheckinScreen(false)}
                aria-label="Voltar"
              >
                <ArrowLeft className="text-gray-700" style={{ width: '28px', height: '28px' }} />
              </Button>
            </div>

            {/* Header padronizado */}
            <div className="p-5">
              <div className="relative">
                {/* Logo centralizada */}
                <div className="flex justify-center">
                  <Logo size="md" />
                </div>

                {/* Avatar do usuário posicionado no canto direito */}
                <div className="absolute top-0 right-0">
                  <UserAvatar size="lg" className="" />
                </div>
              </div>
            </div>

            {/* Conteúdo principal - Card inline igual tela Home */}
            <div className="px-4 mt-8">
              <CheckinCard 
                userId={userIdFromStorage}
                showMissoes={true}
                onCheckinComplete={() => {
                  // Invalidar queries após check-in
                  queryClient.invalidateQueries({ queryKey: ["/api/user", userIdFromStorage] });
                  queryClient.invalidateQueries({ queryKey: ["checkin-status", userIdFromStorage] });
                }}
                onClose={() => setShowCheckinScreen(false)} 
              />
            </div>
          </div>

          {/* Espaçamento para navegação */}
          <div className="h-24"></div>

          {/* Bottom Navigation */}
          <BottomNavigation onBeneficiosClick={() => setShowCheckinScreen(false)} hidden={isStoriesOpen} />
        </motion.div>
      )}

      {/* Stories Viewer */}
      {isStoriesOpen && (
        <StoriesViewer
          useRealData={true}
          initialStoryIndex={currentStoryIndex}
          onClose={closeStories}
        />
      )}

      {/* Menu Lateral de Ajuda */}
      {showHelpMenu && (
        <div className="fixed inset-0 z-[99999]">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowHelpMenu(false)}
          />
          
          {/* Menu Lateral */}
          <motion.div
            initial={{ x: -400 }}
            animate={{ x: 0 }}
            exit={{ x: -400 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute top-0 left-0 h-full w-80 bg-white shadow-lg overflow-y-auto"
          >
            {/* Header do Menu */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-black">Fala {userData.nome?.split(' ')[0] || "Doador"}, tudo bem?</h2>
                <button
                  onClick={() => setShowHelpMenu(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Opções do Menu */}
            <div className="space-y-4 mt-4">
              {/* Perfil */}
              <div>
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                  onClick={() => {
                    setShowHelpMenu(false);
                    setTimeout(() => setLocation("/perfil"), 150);
                  }}
                >
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Perfil
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Mostre quem você é nessa jornada.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
                <div className="border-b border-gray-100 mx-4"></div>
              </div>

              {/* Benefícios */}
              <div>
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                  onClick={() => {
                    setShowHelpMenu(false);
                    setTimeout(() => setLocation("/beneficios"), 150);
                  }}
                >
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <Gift className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Benefícios
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Vantagens que transformam seu dia a dia e o de muitos outros.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
                <div className="border-b border-gray-100 mx-4"></div>
              </div>

              {/* Financeiro */}
              <div>
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                  onClick={() => {
                    setShowHelpMenu(false);
                    setTimeout(() => setLocation("/pagamentos"), 150);
                  }}
                >
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Financeiro
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Transparência para você ver seu impacto.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
                <div className="border-b border-gray-100 mx-4"></div>
              </div>

              {/* Administrador - Apenas para o Leo */}
              {(() => {
                console.log('🔍 [BENEFICIOS] userData.role:', userData.role, 'isLeo:', userData.role === 'leo');
                return userData.role === 'leo';
              })() && (
                <div>
                  <div
                    className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                    onClick={() => {
                      setShowHelpMenu(false);
                      setTimeout(() => setLocation('/administrador'), 150);
                    }}
                  >
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                        Administrador
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                        Acesso ao painel administrativo completo.
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                  <div className="border-b border-gray-100 mx-4"></div>
                </div>
              )}

              {/* Termos de Uso */}
              <div>
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                  onClick={() => {
                    setShowHelpMenu(false);
                    setTimeout(() => setLocation('/termos-servicos?from=help'), 150);
                  }}
                >
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Termos de Uso
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Segurança e clareza em cada passo.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
                <div className="border-b border-gray-100 mx-4"></div>
              </div>

              {/* Deslogar */}
              <div>
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => {
                    setShowHelpMenu(false);
                    setTimeout(() => {
                      // Clear all localStorage data
                      localStorage.clear();
                      // Redirect to home page
                      setLocation('/');
                    }, 150);
                  }}
                >
                  <LogOut className="w-6 h-6 text-gray-700 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Deslogar
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Saindo agora, mas seu impacto continua.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

