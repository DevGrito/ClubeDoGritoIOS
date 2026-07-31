import React, { useState, useEffect } from "react";
import { logoutAndClearSession } from "@/lib/auth-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, BarChart3, TrendingUp, Eye, EyeOff, FileText, DollarSign, Download, Code, Menu, User, Calendar, ChevronRight, BookOpen, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import Logo from "@/components/logo";
import BottomNavigation from "@/components/bottom-navigation";
import { isConselhoByRole } from "@shared/conselho";
import { useDevAccess } from "@/hooks/useDevAccess";
import DataDashboard from "@/components/conselho/data-dashboard";
import { useOmieData } from "@/hooks/useOmieData";
import IndicadorCard from "@/components/IndicadorCard";
import DashboardFinanceiro from "@/components/DashboardFinanceiro";
import FiltrosDinamicos from "@/components/FiltrosDinamicos";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ProgramsGraphDashboard from "@/components/charts/ProgramsGraphDashboard";
import InteractiveDashboard from "@/components/dashboard/InteractiveDashboard";
import DashboardGestaoVista from "@/pages/dashboard-gestao-vista";
import ConselhoFinanceiroSection from "./conselho/components/ConselhoFinanceiroSection";
import { UserAvatar } from "@/components/UserAvatar";
import { useUserData } from "@/hooks/useUserData";
import logoGrito from "../app-assets/logo-clube-grito-waves_1759419898299.png";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";
import StoriesViewer from "@/components/StoriesViewer";
import { useQuery } from '@tanstack/react-query';
import AreaConsentGate, { useAreaConsentReady } from "@/components/AreaConsentGate";
import { LgpdLegalDrawerGroup } from "@/components/LgpdLegalMenuSection";




export default function Conselho() {
  const [, setLocation] = useLocation();
  const { ready: consentReady, checking: consentChecking, markReady: setConsentReady } =
    useAreaConsentReady("council");
  const [userName, setUserName] = useState<string>("");
  
  // Verificação inicial rápida do localStorage para evitar flash de "Acesso Restrito"
  const getInitialAuth = () => {
    if (typeof window === 'undefined') return false;
    const userPapel = localStorage.getItem("userPapel");
    return userPapel === "conselho" || 
           userPapel === "conselheiro" || 
           userPapel === "desenvolvedor" || 
           userPapel === "admin" || 
           userPapel === "leo";
  };
  
  const [authorized, setAuthorized] = useState(getInitialAuth);
  const [demoMode, setDemoMode] = useState(false);
  const [isLoading, setIsLoading] = useState(!getInitialAuth());
  const [showData, setShowData] = useState(true);
  const { userData } = useUserData();
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Estados para Histórias que Inspiram
  const [showStories, setShowStories] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [showFinancePeriodPopover, setShowFinancePeriodPopover] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  
  // Estados para filtros do dashboard financeiro
  const [filtrosPeriodo, setFiltrosPeriodo] = useState<{
    mes: number | null;
    ano: number;
  }>({
    mes: null,
    ano: new Date().getFullYear()
  });

  // Hook para acesso de desenvolvedor
  const devAccess = useDevAccess();
  
  // Hook para dados do Omie
  const { 
    data: omieData, 
    loading: omieLoading, 
    error: omieError,
    periodosDisponiveis,
    refetch: refetchOmie,
    formatCurrency,
    filtrarPorPeriodo,
    filtrarPorArea,
    gerarDadosGrafico
  } = useOmieData();
  
  // Usar período padrão dos dados reais quando disponível
  React.useEffect(() => {
    if (periodosDisponiveis && 
        periodosDisponiveis.periodos?.length > 0 && 
        filtrosPeriodo.ano === new Date().getFullYear() &&
        periodosDisponiveis.periodoDefault?.ano !== new Date().getFullYear()) {
      console.log('📅 [CONSELHO] Usando período padrão dos dados:', periodosDisponiveis.periodoDefault);
      setFiltrosPeriodo(periodosDisponiveis.periodoDefault);
    }
  }, [periodosDisponiveis?.periodos?.length, periodosDisponiveis?.periodoDefault]);

  // Hook para buscar histórias inspiradoras
  const { data: historiasInspiradoras = [] } = useQuery<any[]>({
    queryKey: ['/api/historias-inspiradoras'],
  });

  // Função para processar URLs de imagens (Google Drive, etc)
  const processImageUrl = (url: string | null | undefined) => {
    if (!url) return '';
    if (url.includes('drive.google.com/file/d/')) {
      const fileIdMatch = url.match(/\/d\/([^/]+)/);
      if (fileIdMatch) {
        return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
      }
    }
    return url;
  };

  // Função para quebrar texto em slides
  const splitTextIntoSlides = (text: string, maxChars: number = 600): string[] => {
    if (text.length <= maxChars) return [text];
    const slides: string[] = [];
    let currentText = text;
    while (currentText.length > maxChars) {
      let cutPoint = currentText.lastIndexOf('.', maxChars);
      if (cutPoint === -1) {
        cutPoint = Math.max(
          currentText.lastIndexOf('!', maxChars),
          currentText.lastIndexOf('?', maxChars)
        );
      }
      if (cutPoint === -1) cutPoint = currentText.lastIndexOf(' ', maxChars);
      if (cutPoint === -1) cutPoint = maxChars;
      if (cutPoint < maxChars && (currentText[cutPoint] === '.' || currentText[cutPoint] === '!' || currentText[cutPoint] === '?')) {
        cutPoint += 1;
      }
      slides.push(currentText.substring(0, cutPoint).trim());
      currentText = currentText.substring(cutPoint).trim();
    }
    if (currentText.length > 0) slides.push(currentText);
    return slides;
  };

  // Converter histórias para formato do StoriesViewer
  const convertToStories = (historias: any[]) => {
    if (!historias || historias.length === 0) return [];
    return historias.map(historia => {
      const apiBox = `/api/historias-inspiradoras/${historia.id}/imagem?tipo=box`;
      const apiStory = `/api/historias-inspiradoras/${historia.id}/imagem?tipo=story`;

      const processedImageBox = processImageUrl(historia.imagemBox);
      const processedImageStory = processImageUrl(historia.imagemStory);
      const texto = historia.texto || `A história de ${historia.nome || historia.titulo} é uma demonstração real de como o Clube do Grito transforma vidas.`;
      const textSlides = splitTextIntoSlides(texto, 600);
      const slides: any[] = [{
        id: `${historia.id}_1`,
        type: 'image' as const,
        image: apiStory,
        title: historia.titulo,
        duration: 5
      }];
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
          image: apiBox, // backend primeiro
          slides
        };
    });
  };

  const finalStories = convertToStories(historiasInspiradoras);

  const openStories = (storyIndex: number) => {
    setSelectedStoryIndex(storyIndex);
    setShowStories(true);
  };

  const scrollToStory = (index: number) => {
    setActiveStoryIndex(index);
    if (scrollContainerRef.current) {
      const cardWidth = 320;
      const spacing = 16;
      const scrollPosition = (cardWidth + spacing) * index;
      scrollContainerRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  };

  // Detectar scroll manual e atualizar indicador
  React.useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const scrollLeft = scrollContainerRef.current.scrollLeft;
        const cardWidth = 320;
        const spacing = 16;
        const currentIndex = Math.round(scrollLeft / (cardWidth + spacing));
        setActiveStoryIndex(Math.max(0, Math.min(finalStories.length - 1, currentIndex)));
      }
    };
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [finalStories.length]);

  useEffect(() => {
    const checkAuthorization = async () => {
      // Se for acesso de desenvolvedor, autorizar automaticamente
      if (devAccess.hasDevAccess || devAccess.isDeveloper) {
        console.log("Developer access granted");
        setAuthorized(true);
        setUserName("Desenvolvedor");
        // Garantir que isVerified está setado para permitir acesso a outras rotas
        localStorage.setItem("isVerified", "true");
        localStorage.setItem("userPapel", "desenvolvedor");
        setIsLoading(false);
        return;
      }

      const userData = localStorage.getItem("userData");
      const userPapel = localStorage.getItem("userPapel");
      const userPhone = localStorage.getItem("userPhone");
      
      console.log("Conselho page - userData:", userData);
      console.log("Conselho page - userPapel:", userPapel);
      console.log("Conselho page - userPhone:", userPhone);
      
      if (userData) {
        const user = JSON.parse(userData);
        setUserName(user.nome || "");
        
        // Check if user is authorized - council member, admin, Leo, or approved user
        const isAuthorized = userPapel === "conselho" || 
                            userPapel === "admin" || 
                            userPapel === "leo" ||
                            (user.role === "conselho" || user.role === "conselheiro");
        
        console.log("Conselho page - isAuthorized by role:", isAuthorized);
        
        // If not authorized by role, check if user has approved council status
        if (!isAuthorized && userPhone) {
          try {
            const response = await fetch(`/api/conselho-status?telefone=${encodeURIComponent(userPhone)}`);
            const data = await response.json();
            console.log("Council status check:", data);
            if (data.status === "aprovado") {
              console.log("User approved via council status");
              setAuthorized(true);
            } else {
              console.log("User not approved, status:", data.status);
              setAuthorized(false);
            }
          } catch (error) {
            console.error("Error checking council status:", error);
            setAuthorized(false);
          }
        } else {
          setAuthorized(isAuthorized);
        }
      }
      setIsLoading(false);
    };
    
    checkAuthorization();
  }, [devAccess]);

  // Show loading while checking authorization
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-nav flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // If not authorized, show access denied screen
  if (!authorized && !demoMode) {
    return (
      <div className="min-h-screen bg-gray-50 pb-nav">
        <header className="bg-white shadow-sm border-b border-gray-100">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/perfil")}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-bold text-black">Conselho</h1>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6">
          <Card className="text-center">
            <CardContent className="p-6">
              <Logo size="lg" className="mx-auto mb-4" />
              <h2 className="text-xl font-bold text-black mb-3">
                Acesso Restrito
              </h2>
              <p className="text-gray-600 mb-4">
                Esta área é exclusiva para membros do Conselho do Clube do Grito.
              </p>
              <Badge variant="outline" className="mb-4">
                E-mail não autorizado
              </Badge>
              <p className="text-sm text-gray-500 mb-6">
                Se você é membro do conselho, entre em contato com o administrador.
              </p>
              
              {/* Demo Mode Button */}
              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-800 mb-3">Modo Demonstração</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Acesse a tela do conselho em modo de visualização
                </p>
                <Button 
                  onClick={() => setDemoMode(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Entrar no Modo Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>

        <BottomNavigation hideBeneficios={true} hidden={showStories} />
      </div>
    );
  }

  if (consentChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
      </div>
    );
  }

  if (!consentReady) {
    return <AreaConsentGate area="council" onAccept={() => setConsentReady()} onNavigate={setLocation} />;
  }

  return (
    <div className="min-h-screen bg-white pb-nav">
      {/* Header - Mesmo estilo das telas do doador */}
      <header className="bg-white">
        <div className="px-4 py-4 flex items-center">
          {/* Elemento da Esquerda: Menu Hamburger */}
          <div className="w-20 flex justify-start">
            <button 
              onClick={() => setShowMenu(true)}
              className="flex flex-col space-y-1 p-2 items-start"
              data-testid="button-menu-toggle"
            >
              <div className="w-6 h-0.5 bg-gray-700"></div>
              <div className="w-4 h-0.5 bg-gray-700"></div>
              <div className="w-6 h-0.5 bg-gray-700"></div>
            </button>
          </div>
          
          {/* Elemento Central: Logo do Clube do Grito - MUITO GRANDE e MAIS À ESQUERDA */}
          <div className="flex-1 flex justify-center -ml-8">
            <img 
              src={logoGrito} 
              alt="Clube do Grito" 
              className="h-36 w-auto object-contain"
            />
          </div>
          
          {/* Elemento da Direita: Perfil do Usuário */}
          <div className="w-20 flex justify-end">
            <div className="flex flex-col items-center gap-1.5">
              {/* Avatar GRANDE */}
              <UserAvatar 
                size="lg" 
                className="border-2 border-gray-200 cursor-pointer"
                onClick={() => setShowEditModal(true)}
                data-testid="avatar-conselho"
              />
              
              {/* Badge "Conselheiro" */}
              <div className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                <span>Conselheiro</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Saudação - SEM FUNDO, toda em negrito */}
      <div className="px-4 py-3">
        <p className="text-sm font-bold text-black font-inter">
          Olá, Conselheiro! Você é um Aliado do Grito ✊
        </p>
      </div>

      {/* Menu Lateral - Design Moderno igual ao Doador */}
      {showMenu && (
        <div className="fixed inset-0 z-[99999]">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMenu(false)}
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
                <h2 className="text-xl font-semibold text-black">
                  Fala {userData.nome?.split(' ')[0] || "Conselheiro"}, tudo bem?
                </h2>
                <button
                  onClick={() => setShowMenu(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Opções do Menu */}
            <div className="space-y-4 mt-4">
              {/* Home */}
              <div>
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                  onClick={() => setShowMenu(false)}
                >
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base">
                      Home
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      Acompanhe indicadores e métricas de impacto.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
                <div className="border-b border-gray-100 mx-4"></div>
              </div>

              {/* Perfil */}
              <div>
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                  onClick={() => {
                    setShowMenu(false);
                    setTimeout(() => setLocation("/perfil"), 150);
                  }}
                >
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base">
                      Perfil
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      Mostre quem você é nessa jornada.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
                <div className="border-b border-gray-100 mx-4"></div>
              </div>

              <LgpdLegalDrawerGroup onAfterClick={() => setShowMenu(false)} />

              {/* Canal de Transparência */}
              <div>
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                  onClick={() => {
                    setShowMenu(false);
                    window.open('https://canaldetransparencia.institutoogrito.com.br', '_blank');
                  }}
                >
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <ExternalLink className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base">
                      Canal de Transparência
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      Denúncias e sugestões com sigilo.
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
                    setShowMenu(false);
                    setTimeout(async () => {
                      await logoutAndClearSession();
                      window.location.href = "/plans";
                    }, 150);
                  }}
                >
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <ArrowLeft className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base">
                      Deslogar
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      Sair da sua conta com segurança.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      

      {/* Content */}
      <main className="w-full py-4 space-y-6 pb-28">
        {/* Gestão à Vista — full-bleed, responsivo */}
        <div className="w-full px-2 sm:px-3 lg:px-4">
          <DashboardGestaoVista embedded />
        </div>

        {/* Quadro Financeiro - DESABILITADO (APIs não implementadas) */}
        {/* <ConselhoFinanceiroSection /> */}

        {/* Dashboard Financeiro - Omie ERP - Clean */}
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          {/* Header compacto */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-black">Painel Financeiro</h3>
            </div>
          </div>

          {/* Dashboard Financeiro Integrado */}
          <DashboardFinanceiro
            filtrosPeriodo={filtrosPeriodo}
            onRefresh={() => refetchOmie()}
            showRefreshControls={true}
            showData={showData}
            onToggleShowData={() => setShowData(!showData)}
            className="space-y-6"
          />

          {/* Histórias que Inspiram */}
          {finalStories.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-left">Histórias que Inspiram</h3>
              
              <div 
                ref={scrollContainerRef}
                className="overflow-x-auto pb-4 -mx-4 md:-mx-8" 
                style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
              >
                <div className="flex space-x-4 px-4 md:px-8" style={{width: 'fit-content'}}>
                  {finalStories.map((story, index) => (
                    <div 
                      key={story.id}
                      onClick={() => openStories(index)}
                      className="relative flex-shrink-0 overflow-hidden rounded-2xl shadow-lg cursor-pointer hover:scale-[1.02] transition-transform duration-200"
                      style={{
                        width: 'min(320px, 85vw)',
                        height: '180px',
                        backgroundImage: `url("/api/historias-inspiradoras/${story.id}/imagem?tipo=box"), url(${JSON.stringify(
                              story.image ||
                                "https://images.unsplash.com/photo-1494790108755-2616c943f671?w=400&h=200&fit=crop&crop=face"
                            )})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                      data-testid={`story-card-${index}`}
                    >
                      <div className="absolute inset-0 bg-black/30"></div>
                      <div className="absolute bottom-4 left-4 text-white">
                        <h4 className="text-lg font-bold">Conheça</h4>
                        <h4 className="text-lg font-bold">{story.name}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center space-x-2 mt-4">
                {finalStories.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToStory(index)}
                    className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                      activeStoryIndex === index 
                        ? 'bg-gray-800' 
                        : 'bg-gray-300 hover:bg-gray-500'
                    }`}
                    aria-label={`Ir para história ${index + 1}`}
                    data-testid={`story-indicator-${index}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Mensagem do CEO */}
          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-yellow-200 shadow-sm">
            <CardContent className="pt-8 pb-8 px-6 md:px-12">
              <blockquote className="text-center">
                <p className="text-lg md:text-xl italic text-gray-700 leading-relaxed mb-6">
                  "O Clube do Grito segue sendo um espaço de conexão entre quem se importa de verdade, 
                  quem age, quem transforma. É uma alegria ter você com a gente nessa jornada!"
                </p>
                <footer className="text-right">
                  <div className="font-bold text-gray-900 text-lg">
                    – Léo Martins
                  </div>
                  <div className="text-gray-600 text-sm mt-1">
                    Fundador e CEO
                  </div>
                </footer>
              </blockquote>
            </CardContent>
          </Card>

          {/* 
          ========================================
          SEÇÃO TEMPORARIAMENTE REMOVIDA
          (Código mantido para uso futuro das funções de exportação)
          ========================================
          */}
          {/* Detalhes Adicionais - Cards de Contas a Receber/Pagar */}
          {/* 
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <TrendingUp className="w-5 h-5" />
                  Contas a Receber
                </CardTitle>
              </CardHeader>
              <CardContent>
                {omieLoading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : omieData.contasReceber.length === 0 ? (
                  <p className="text-gray-500 text-sm">Nenhuma conta a receber encontrada</p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total de contas:</span>
                      <span className="font-medium">{omieData.contasReceber.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Valor médio:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          omieData.contasReceber.reduce((acc: number, conta: any) => 
                            acc + parseFloat(conta.valor_documento || conta.valor || 0), 0
                          ) / omieData.contasReceber.length
                        )}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => console.log('Exportar contas a receber', omieData.contasReceber)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exportar Detalhes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <DollarSign className="w-5 h-5" />
                  Contas a Pagar
                </CardTitle>
              </CardHeader>
              <CardContent>
                {omieLoading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : omieData.contasPagar.length === 0 ? (
                  <p className="text-gray-500 text-sm">Nenhuma conta a pagar encontrada</p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total de contas:</span>
                      <span className="font-medium">{omieData.contasPagar.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pagas:</span>
                      <span className="font-medium text-green-600">
                        {omieData.contasPagar.filter((conta: any) => 
                          (conta.status_titulo || conta.status || '').toLowerCase().includes('pago') ||
                          (conta.status_titulo || conta.status || '').toLowerCase().includes('liquidado')
                        ).length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pendentes:</span>
                      <span className="font-medium text-yellow-600">
                        {omieData.contasPagar.filter((conta: any) => 
                          !(conta.status_titulo || conta.status || '').toLowerCase().includes('pago') &&
                          !(conta.status_titulo || conta.status || '').toLowerCase().includes('liquidado')
                        ).length}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => console.log('Exportar contas a pagar', omieData.contasPagar)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exportar Detalhes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          */}

          {/* Status da Conexão Omie - COMENTADO */}
          {/*
          <Card className="bg-gray-50 border-dashed">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    omieError ? 'bg-red-500' : omieLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
                  }`}></div>
                  <div>
                    <div className="font-medium text-sm">
                      Status: {omieError ? 'Erro' : omieLoading ? 'Carregando' : 'Conectado'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Omie ERP - Última atualização: {new Date().toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={refetchOmie}
                  variant="ghost"
                  size="sm"
                  disabled={omieLoading}
                >
                  {omieLoading ? 'Carregando...' : 'Atualizar'}
                </Button>
              </div>
            </CardContent>
          </Card>
          */}
        </div>

      </main>

      {/* Modal de Edição de Perfil */}
      <ProfileEditModal 
        open={showEditModal} 
        onOpenChange={setShowEditModal} 
      />

      {/* Stories Viewer */}
      {showStories && (
        <StoriesViewer
          stories={finalStories}
          initialStoryIndex={selectedStoryIndex}
          onClose={() => setShowStories(false)}
        />
      )}

      <BottomNavigation hideBeneficios={true} hidden={showStories} />
    </div>
  );
}