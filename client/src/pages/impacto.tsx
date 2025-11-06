import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useUserData } from "@/hooks/useUserData";
import { useProfileImage } from "@/hooks/useProfileImage";
import { UserAvatar } from "@/components/UserAvatar";
import { motion } from "framer-motion";
import Logo from "@/components/logo";
import BottomNavigation from "@/components/bottom-navigation";
import { StoriesViewerFinal } from '@/components/StoriesViewerFinal';
import { TrendingUp, Users, Target, Award, Heart, Rocket, Menu, User, Gift, CreditCard, BookOpen, ChevronRight, RefreshCw, LogOut, Shield, PieChart, UserCheck, Calendar } from "lucide-react";
import { Cell, PieChart as RechartsPie, Pie, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { StripeKeyManager } from "@/components/StripeKeyManager";
import ImpactGestaoVista from "@/components/ImpactGestaoVista";

export default function Impacto() {
  const [, setLocation] = useLocation();
  const { userData } = useUserData();
  const { profileImage } = useProfileImage();
  const queryClient = useQueryClient();
  
  // Hook para buscar data da primeira doação
  const userId = typeof window !== 'undefined' ? localStorage.getItem("userId") : null;
  const { data: firstDonationData } = useQuery({
    queryKey: ['/api/users', userId, 'first-donation-date'],
    queryFn: () => fetch(`/api/users/${userId}/first-donation-date`).then(res => res.json()),
    enabled: !!userId
  });
  
  // Hook para buscar dados do Monday.com (Gestão à Vista)
  const { data: gvData } = useQuery({
    queryKey: ['/api/gv'],
    refetchInterval: 300000, // Atualiza a cada 5 minutos
    refetchOnWindowFocus: true
  });
  
  // Hook para verificar se meta de doações coletivas foi alcançada
  const { data: collectiveDonationsData } = useQuery<{
    total: number;
    metaAlcancada: boolean;
    meta: number;
  }>({
    queryKey: ['/api/collective-donations-total'],
    refetchInterval: 60000, // Atualiza a cada 1 minuto
    refetchOnWindowFocus: true
  });
  
  // Hook para buscar projetos apoiados baseado no plano do usuário
  const { data: supportedProjectData, isLoading: isLoadingSupportedProject } = useQuery<{
    userId: number;
    currentPlan: string;
    supportedProjects: {
      name: string;
      description: string;
      period: string;
    }[];
  }>({
    queryKey: ['/api/users', userId, 'supported-project'],
    queryFn: () => fetch(`/api/users/${userId}/supported-project`).then(res => res.json()),
    enabled: !!userId
  });
  
  // Hook para buscar dados de Inclusão Produtiva (pessoas em formação)
  const { data: inclusaoData } = useQuery({
    queryKey: ['/api/inclusao-produtiva/dados-mensais'],
    refetchInterval: 300000, // Atualiza a cada 5 minutos
  });
  
  // Hook para buscar dados de Psicossocial (famílias ativas)
  const { data: psicossocialData } = useQuery({
    queryKey: ['/api/psicossocial/dados-mensais'],
    refetchInterval: 300000, // Atualiza a cada 5 minutos
  });
  
  // Hook para buscar dados completos de Gestão à Vista (incluindo pizzas, idade, counters)
  const ano = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1; // Janeiro = 1, Dezembro = 12
  
  // Query para dados do mês atual (Pessoas em Formação)
  const { data: gestaoVistaMensal } = useQuery<{
    periodo: { ano: number; tipo: string; mes?: number };
    indicadores: any;
  }>({
    queryKey: ['gestao-vista-mensal', { ano, mes: mesAtual }],
    queryFn: async () => {
      const response = await fetch(`/api/gestao-vista?ano=${ano}&mes=${mesAtual}`);
      if (!response.ok) throw new Error('Erro ao buscar dados');
      return response.json();
    },
    refetchInterval: 300000,
  });
  
  // Query para dados anuais (Visitas em Domicílio, counters, pizzas, etc)
  const { data: gestaoVistaData, isLoading: loadingGestao } = useQuery<{
    periodo: { ano: number; tipo: string };
    indicadores: any;
    pessoasAtivas: {
      inclusaoProdutiva: { formados: number; emFormacao: number };
      pec: { criancasAtendidas: number };
      totais: { inclusao: number; pec: number; geral: number };
    };
    racaCor: { negras: number; pardas: number; brancas: number; indigenas: number; total: number };
    idade: { media: number; amostra: number };
    counters: {
      horaAula: number;
      atendimentos: number;
      pessoasImpactadas: { diretas: number; indiretas: number; total: number };
    };
  }>({
    queryKey: ['gestao-vista-anual', { ano }],
    queryFn: async () => {
      const response = await fetch(`/api/gestao-vista?ano=${ano}`);
      if (!response.ok) throw new Error('Erro ao buscar dados');
      return response.json();
    },
    refetchInterval: 300000,
  });

  // Hook para buscar dados demográficos agregados (PEC + Inclusão Produtiva)
  const { data: dadosDemograficos, isLoading: loadingDemograficos } = useQuery<{
    success: boolean;
    totalParticipantes: number;
    genero: Array<{ name: string; value: number; percentage: number }>;
    racaCor: Array<{ name: string; value: number; percentage: number }>;
    idade: Array<{ name: string; value: number; percentage: number }>;
  }>({
    queryKey: ['/api/dados-demograficos'],
    refetchInterval: 300000, // Atualiza a cada 5 minutos
    refetchOnMount: true,
  });
  
  // Estados para animação dos counters
  const [horaAulaAnimated, setHoraAulaAnimated] = useState(0);
  const [atendimentosAnimated, setAtendimentosAnimated] = useState(0);
  const [pessoasImpactadasAnimated, setPessoasImpactadasAnimated] = useState(0);
  const [impactoAnualAnimated, setImpactoAnualAnimated] = useState(0);
  
  // Cores para os gráficos - Tons de Amarelo e Laranja
  const COLORS_PESSOAS = ['#FFD700', '#FFA500'];
  const COLORS_RACA = ['#FFD700', '#FFC107', '#FF9800', '#F97316']; // Amarelo ouro → Âmbar → Laranja médio → Laranja escuro
  const COLORS_GENERO = ['#FFD700', '#FF9800', '#FF6B00']; // Amarelo → Laranja médio → Laranja
  const COLORS_IDADE = ['#FFD700', '#FFC107', '#FF9800', '#FF6B00', '#F97316']; // Gradiente completo de amarelo a laranja
  
  // Animar counters quando dados carregarem
  useEffect(() => {
    if (gestaoVistaData?.counters) {
      const duration = 1000;
      const steps = 60;
      const stepTime = duration / steps;

      // Animar Hora-aula
      let currentHora = 0;
      const horaIncrement = gestaoVistaData.counters.horaAula / steps;
      const horaInterval = setInterval(() => {
        currentHora += horaIncrement;
        if (currentHora >= gestaoVistaData.counters.horaAula) {
          setHoraAulaAnimated(gestaoVistaData.counters.horaAula);
          clearInterval(horaInterval);
        } else {
          setHoraAulaAnimated(Math.floor(currentHora));
        }
      }, stepTime);

      // Animar Atendimentos
      let currentAtend = 0;
      const atendIncrement = gestaoVistaData.counters.atendimentos / steps;
      const atendInterval = setInterval(() => {
        currentAtend += atendIncrement;
        if (currentAtend >= gestaoVistaData.counters.atendimentos) {
          setAtendimentosAnimated(gestaoVistaData.counters.atendimentos);
          clearInterval(atendInterval);
        } else {
          setAtendimentosAnimated(Math.floor(currentAtend));
        }
      }, stepTime);

      // Animar Pessoas Impactadas
      let currentPessoas = 0;
      const pessoasIncrement = gestaoVistaData.counters.pessoasImpactadas.total / steps;
      const pessoasInterval = setInterval(() => {
        currentPessoas += pessoasIncrement;
        if (currentPessoas >= gestaoVistaData.counters.pessoasImpactadas.total) {
          setPessoasImpactadasAnimated(gestaoVistaData.counters.pessoasImpactadas.total);
          clearInterval(pessoasInterval);
        } else {
          setPessoasImpactadasAnimated(Math.floor(currentPessoas));
        }
      }, stepTime);

      return () => {
        clearInterval(horaInterval);
        clearInterval(atendInterval);
        clearInterval(pessoasInterval);
      };
    }
  }, [gestaoVistaData]);

  // Animar contador de Impacto Anual (sempre mostra 317.062)
  useEffect(() => {
    const targetValue = 317062;
    const duration = 2000; // 2 segundos
    const steps = 60;
    const stepTime = duration / steps;
    const increment = targetValue / steps;

    let currentValue = 0;
    const interval = setInterval(() => {
      currentValue += increment;
      if (currentValue >= targetValue) {
        setImpactoAnualAnimated(targetValue);
        clearInterval(interval);
      } else {
        setImpactoAnualAnimated(Math.floor(currentValue));
      }
    }, stepTime);

    return () => clearInterval(interval);
  }, []); // Executa apenas uma vez ao montar o componente
  
  // Estado para controlar o menu lateral de ajuda
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  
  // Estados para Stories
  const [isStoriesOpen, setIsStoriesOpen] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  
  // Estado para indicadores de scroll das histórias
  const [currentHistoriaSlide, setCurrentHistoriaSlide] = useState(0);
  const historiasScrollRef = useRef<HTMLDivElement>(null);
  
  // Estado para indicadores de scroll dos gráficos demográficos
  const [currentGraficoSlide, setCurrentGraficoSlide] = useState(0);
  const graficosScrollRef = useRef<HTMLDivElement>(null);
  
  // Estado para indicadores de scroll do carrossel de métricas
  const [currentMetricaSlide, setCurrentMetricaSlide] = useState(0);
  const metricasScrollRef = useRef<HTMLDivElement>(null);

  const openStories = (index: number) => {
    console.log('🎯 ABRINDO STORIES - Novo layout deve aparecer');
    setCurrentStoryIndex(index);
    setIsStoriesOpen(true);
  };

  const closeStories = () => {
    setIsStoriesOpen(false);
  };

  // Função para forçar atualização das histórias
  const forceRefreshHistorias = async () => {
    await queryClient.invalidateQueries({ 
      queryKey: ['/api/historias-inspiradoras'] 
    });
  };

  // Hook para buscar histórias inspiradoras do banco de dados
  const { data: historiasInspiradoras = [], isLoading: loadingHistorias } = useQuery<any[]>({
    queryKey: ['/api/historias-inspiradoras'],
    refetchInterval: 5000, // Atualiza a cada 5 segundos para maior responsividade
    refetchOnWindowFocus: true, // Recarrega quando a janela ganha foco
    refetchOnMount: true, // Recarrega sempre que o componente for montado
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
  const splitTextIntoSlides = (text: string, maxChars: number = 800): string[] => {
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
      const textSlides = splitTextIntoSlides(texto, 800); // Limite de 800 caracteres por slide
      
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
  
  // Listener de scroll para atualizar indicadores das histórias
  useEffect(() => {
    const handleHistoriaScroll = () => {
      if (historiasScrollRef.current) {
        const scrollLeft = historiasScrollRef.current.scrollLeft;
        const cardWidth = 320 + 16; // largura do card + espaçamento
        const currentIndex = Math.round(scrollLeft / cardWidth);
        setCurrentHistoriaSlide(Math.max(0, Math.min(finalStories.length - 1, currentIndex)));
      }
    };

    const scrollContainer = historiasScrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleHistoriaScroll);
      return () => scrollContainer.removeEventListener('scroll', handleHistoriaScroll);
    }
  }, [finalStories.length]);
  
  // Listener de scroll para atualizar indicadores dos gráficos demográficos
  useEffect(() => {
    const handleGraficoScroll = () => {
      if (graficosScrollRef.current) {
        const scrollLeft = graficosScrollRef.current.scrollLeft;
        const cardWidth = 380 + 24; // largura do card (380px) + gap (24px)
        const currentIndex = Math.round(scrollLeft / cardWidth);
        setCurrentGraficoSlide(Math.max(0, Math.min(2, currentIndex))); // 3 cards (0-2)
      }
    };

    const scrollContainer = graficosScrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleGraficoScroll);
      return () => scrollContainer.removeEventListener('scroll', handleGraficoScroll);
    }
  }, []);
  
  // Listener de scroll para atualizar indicadores do carrossel de métricas
  useEffect(() => {
    const handleMetricaScroll = () => {
      if (metricasScrollRef.current) {
        const scrollLeft = metricasScrollRef.current.scrollLeft;
        const cardWidth = 280 + 24; // largura do card (280px) + gap (24px)
        const currentIndex = Math.round(scrollLeft / cardWidth);
        setCurrentMetricaSlide(Math.max(0, Math.min(1, currentIndex))); // 2 cards (0-1)
      }
    };

    const scrollContainer = metricasScrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleMetricaScroll);
      return () => scrollContainer.removeEventListener('scroll', handleMetricaScroll);
    }
  }, []);
  
  // Estado para a seção de impacto
  const [impactSectionVisible, setImpactSectionVisible] = useState(false);
  const impactSectionRef = useRef<HTMLDivElement>(null);
  
  // Estado para o carrossel de estatísticas
  const [currentStatsSlide, setCurrentStatsSlide] = useState(0);
  const [statsTouchStart, setStatsTouchStart] = useState(0);
  const [statsTouchEnd, setStatsTouchEnd] = useState(0);
  const statsScrollRef = useRef<HTMLDivElement>(null);
  
  // Intersection Observer para detectar quando a seção de impacto entra na tela
  useEffect(() => {
    const current = impactSectionRef.current;
    if (!current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImpactSectionVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(current);

    return () => {
      observer.unobserve(current);
    };
  }, []);

  // Fallback: ativar animação após 2 segundos se ainda não foi ativada
  useEffect(() => {
    if (!impactSectionVisible) {
      const timer = setTimeout(() => {
        setImpactSectionVisible(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [impactSectionVisible]);

  // Auto-scroll para o carrossel de estatísticas com indicadores
  useEffect(() => {
    const handleStatsScroll = () => {
      if (statsScrollRef.current) {
        const scrollLeft = statsScrollRef.current.scrollLeft;
        const cardWidth = 280 + 16; // largura do card + espaçamento
        const currentIndex = Math.round(scrollLeft / cardWidth);
        setCurrentStatsSlide(Math.max(0, Math.min(statsData.length - 1, currentIndex)));
      }
    };

    const scrollContainer = statsScrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleStatsScroll);
      return () => scrollContainer.removeEventListener('scroll', handleStatsScroll);
    }
  }, []);

  // Função para rolar para um slide específico
  const scrollToStatsSlide = (index: number) => {
    if (statsScrollRef.current) {
      const cardWidth = 280 + 16; // largura do card + espaçamento
      const scrollPosition = cardWidth * index;
      statsScrollRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  };

  const planDisplayNames = {
    eco: "Eco",
    voz: "Voz", 
    grito: "O Grito",
    platinum: "Platinum"
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "bom dia";
    if (hour < 18) return "boa tarde";
    return "boa noite";
  };

  // Função para extrair número de crianças do programa Esporte e Cultura
  const getCriancasEsporteCultura = () => {
    if (!gvData || !(gvData as any)?.programs) return 42;
    
    const esporteCulturaProgram = (gvData as any).programs.find(
      (program: any) => program.slug === "esporte-cultura"
    );
    
    if (!esporteCulturaProgram?.workstreams) return 0;
    
    // Buscar indicadores que representem crianças/atendimentos
    for (const workstream of esporteCulturaProgram.workstreams) {
      if (workstream.indicators) {
        for (const indicator of workstream.indicators) {
          // Buscar por indicadores que representem número de crianças/atendimentos
          if (indicator.slug?.includes('criancas') || 
              indicator.slug?.includes('atendimentos') ||
              indicator.slug?.includes('participantes') ||
              indicator.value > 0) {
            return indicator.value || 0;
          }
        }
      }
    }
    
    // Fallback: se não encontrar dados específicos, usar um número baseado nos dados disponíveis
    return 42; // Valor padrão baseado nos dados de impacto
  };

  // Função para formatar a data em português
  const formatMonthYear = (dateData: any) => {
    if (!dateData) return "carregando...";
    
    // Formato completo com dia
    if (dateData.day && dateData.monthNamePt && dateData.year) {
      return `${dateData.day} de ${dateData.monthNamePt} de ${dateData.year}`;
    }
    
    // Fallback: formato sem dia
    if (dateData.monthNamePt && dateData.year) {
      return `${dateData.monthNamePt} de ${dateData.year}`;
    }
    
    // Fallback: formato com month (fallback antigo)
    if (dateData.month && dateData.year) {
      return `${dateData.month} de ${dateData.year}`;
    }
    
    return "carregando...";
  };
  
  // Função para formatar o mês vigente (mês atual)
  const formatCurrentMonth = () => {
    const now = new Date();
    const monthNames = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    return `${monthNames[now.getMonth()]} de ${now.getFullYear()}`;
  };
  
  // Função para calcular pessoas em formação (Inclusão Produtiva)
  // Pega do endpoint gestao-vista o valor do MÊS ATUAL
  const getPessoasEmFormacao = () => {
    if (!gestaoVistaMensal?.indicadores?.alunosEmFormacao) return 0;
    return gestaoVistaMensal.indicadores.alunosEmFormacao.valor;
  };
  
  // Função para calcular visitas em domicílio (TOTAL ANUAL - sempre anual)
  const getVisitasDomicilio = () => {
    // SEMPRE pega dos dados ANUAIS (não mensais), independente do mês
    if (!gestaoVistaData?.indicadores?.visitas) return 0;
    return gestaoVistaData.indicadores.visitas.valor;
  };

  // Array de dados das estatísticas
  const statsData = [
    { icon: Users, value: "42", label: "Vidas Impactadas", color: "gradient1" },
    { icon: Target, value: "18", label: "Meta Alcançada", color: "gradient2" },
    { icon: Award, value: "5", label: "Projetos Apoiados", color: "gradient3" },
    { icon: Heart, value: "R$ 485", label: "Valor Doado", color: "gradient4" }
  ];

  // Funções do carrossel de estatísticas
  const nextStatsSlide = () => {
    setCurrentStatsSlide((prev) => (prev + 1) % statsData.length);
  };

  const prevStatsSlide = () => {
    setCurrentStatsSlide((prev) => (prev - 1 + statsData.length) % statsData.length);
  };

  const goToStatsSlide = (index: number) => {
    setCurrentStatsSlide(index);
  };

  // Funções de swipe para estatísticas
  const handleStatsTouchStart = (e: React.TouchEvent) => {
    setStatsTouchEnd(0);
    setStatsTouchStart(e.targetTouches[0].clientX);
  };

  const handleStatsTouchMove = (e: React.TouchEvent) => {
    setStatsTouchEnd(e.targetTouches[0].clientX);
  };

  const handleStatsTouchEnd = () => {
    if (!statsTouchStart || !statsTouchEnd) return;
    const distance = statsTouchStart - statsTouchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextStatsSlide();
    } else if (isRightSwipe) {
      prevStatsSlide();
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20">
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
            <div className="flex flex-col items-center">
              {/* Foto de Perfil Circular */}
              <UserAvatar 
                size="md" 
                className="border-2 border-gray-200 mb-1"
                onClick={() => setLocation("/dados-cadastrais")}
              />
              {/* Badge do Plano */}
              <div className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full flex items-center space-x-1">
                <span>{planDisplayNames[userData.plano as keyof typeof planDisplayNames] || "Eco"}</span>
                <span className="text-orange-500">◆</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-4 md:px-8 md:py-8">
        {/* Saudação personalizada */}
        <div className="mb-4 md:mb-6 -mt-4">
          <h2 className="text-lg md:text-xl text-black mb-1">
            <span className="font-normal">Fala {userData.nome?.split(' ')[0] || "Doador"},</span> <span className="font-bold">seu impacto já é imenso!</span>
          </h2>
        </div>

        {/* Gestão à Vista - PRIMEIRO */}
        <div className="mb-6">
          <ImpactGestaoVista />
        </div>

        {/* Título da Página */}
        <div className="text-center mb-8">
          <h1 className="text-base text-gray-900 whitespace-nowrap">
            Sua contribuição <span className="font-bold">está transformando vidas</span>
          </h1>
        </div>


        {/* Linha de Impacto */}
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Linha de Impacto
          </h3>
          
          <div className="relative">
            {/* Linha vertical */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            <div className="space-y-6">
              {/* Primeira Doação */}
              <div className="flex items-start gap-4 group cursor-pointer">
                <div className="relative flex items-center justify-center">
                  <div className="w-8 h-8 bg-gray-400 group-hover:bg-green-500 rounded-2xl flex items-center justify-center z-10 transition-all duration-300 transform group-hover:scale-110">
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1 bg-gray-200 group-hover:bg-green-500 rounded-2xl p-4 transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-500 group-hover:text-black text-base">Primeira Doação</h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 group-hover:text-black/80">
                    <span>📍 {formatMonthYear(firstDonationData)}</span>
                  </div>
                </div>
              </div>

              {/* Pessoas em Formação (Inclusão Produtiva) */}
              <div className="flex items-start gap-4 group cursor-pointer">
                <div className="relative flex items-center justify-center">
                  <div className="w-8 h-8 bg-gray-400 group-hover:bg-purple-500 rounded-2xl flex items-center justify-center z-10 transition-all duration-300 transform group-hover:scale-110">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1 bg-gray-200 group-hover:bg-purple-500 rounded-2xl p-4 transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-500 group-hover:text-black text-base">Pessoas em Formação</h4>
                  </div>
                  <p className="text-gray-500 group-hover:text-black text-sm mb-1">
                    {getPessoasEmFormacao()} alunos estão em formação no Inclusão Produtiva
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 group-hover:text-black/80">
                    <span>📍 outubro de 2025</span>
                  </div>
                </div>
              </div>

              {/* Visitas em Domicílio (Total Anual) */}
              <div className="flex items-start gap-4 group cursor-pointer">
                <div className="relative flex items-center justify-center">
                  <div className="w-8 h-8 bg-gray-400 group-hover:bg-orange-500 rounded-2xl flex items-center justify-center z-10 transition-all duration-300 transform group-hover:scale-110">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1 bg-gray-200 group-hover:bg-orange-500 rounded-2xl p-4 transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-500 group-hover:text-black text-base">Visitas em Domicílio</h4>
                  </div>
                  <p className="text-gray-500 group-hover:text-black text-sm mb-1">
                    {getVisitasDomicilio().toLocaleString('pt-BR')} visitas em domicílio
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 group-hover:text-black/80">
                    <span>📍 total anual 2025</span>
                  </div>
                </div>
              </div>

              {/* Meta Alcançada - Só aparece quando meta for realmente atingida */}
              {collectiveDonationsData?.metaAlcancada && (
                <div className="flex items-start gap-4 group cursor-pointer">
                  <div className="relative flex items-center justify-center">
                    <div className="w-8 h-8 bg-gray-400 group-hover:bg-blue-500 rounded-2xl flex items-center justify-center z-10 transition-all duration-300 transform group-hover:scale-110">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 bg-gray-200 group-hover:bg-blue-500 rounded-2xl p-4 transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-500 group-hover:text-black text-base">Meta Alcançada</h4>
                      <span className="text-xs text-gray-400 group-hover:text-black/70">13:15</span>
                    </div>
                    <p className="text-gray-500 group-hover:text-black text-sm mb-1">
                      Chegamos a R$ {collectiveDonationsData?.total?.toFixed(2) || '500,00'} em doações coletivas
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 group-hover:text-black/80">
                      <span>📍 {formatCurrentMonth()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Projetos Apoiados - Múltiplos projetos (exceto alguns específicos) */}
              {supportedProjectData?.supportedProjects && supportedProjectData.supportedProjects.length > 0 
                ? supportedProjectData.supportedProjects
                    .filter(project => {
                      const projectName = project.name.toLowerCase();
                      return projectName !== 'favela 3d' && 
                             projectName !== 'programa de cultura e esporte' && 
                             projectName !== 'inclusão produtiva' && 
                             projectName !== 'método grito';
                    })
                    .map((project, index) => {
                    // Cores diferentes para cada projeto
                    const projectColors = [
                      { bg: 'purple-500', text: 'Projeto Apoiado' },
                      { bg: 'blue-500', text: 'Projeto Apoiado' },
                      { bg: 'green-500', text: 'Projeto Apoiado' },
                      { bg: 'orange-500', text: 'Projeto Apoiado' },
                    ];
                    const colorConfig = projectColors[index % projectColors.length];
                    
                    return (
                      <div key={index} className="flex items-start gap-4 group cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <div className={`w-8 h-8 bg-gray-400 group-hover:bg-${colorConfig.bg} rounded-2xl flex items-center justify-center z-10 transition-all duration-300 transform group-hover:scale-110`}>
                            <Award className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className={`flex-1 bg-gray-200 group-hover:bg-${colorConfig.bg} rounded-2xl p-4 transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-lg`}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-500 group-hover:text-black text-base">{colorConfig.text}</h4>
                          </div>
                          <p className="text-gray-500 group-hover:text-black text-sm mb-1">
                            Você ajudou a financiar o {project.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-400 group-hover:text-black/80">
                            <span>📍 {formatMonthYear(firstDonationData)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                : null
              }
            </div>
          </div>
        </div>

        {/* Carrossel de Gráficos e Métricas */}
        <div className="mb-8 mt-12">
          <div 
            ref={graficosScrollRef}
            className="overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory" 
            style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
          >
            <style>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div className="flex gap-6 px-4" style={{width: 'fit-content'}}>
                {/* Pizza 1: Gênero */}
                <div className="flex-shrink-0 bg-white rounded-3xl p-6 shadow-lg snap-center flex flex-col" style={{width: '380px', height: '380px'}}>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 text-center font-sans">
                    Gênero
                  </h3>
                  {loadingDemograficos ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                    </div>
                  ) : dadosDemograficos?.genero && dadosDemograficos.genero.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <RechartsPie>
                          <Pie
                            data={dadosDemograficos.genero}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.percentage}%`}
                            outerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {dadosDemograficos.genero.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS_GENERO[index % COLORS_GENERO.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number, name: string) => [`${value} pessoas`, name]} />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                        </RechartsPie>
                      </ResponsiveContainer>
                      <div className="text-center mt-2">
                        <div className="text-3xl font-extrabold text-gray-900 font-sans">
                          1.000
                        </div>
                        <div className="text-xs font-medium text-gray-600 mt-1 font-sans">
                          Total de participantes
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-gray-500">Sem dados disponíveis</div>
                  )}
                </div>

                {/* Pizza 2: Raça/Cor */}
                <div className="flex-shrink-0 bg-white rounded-3xl p-6 shadow-lg snap-center flex flex-col" style={{width: '380px', height: '380px'}}>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 text-center font-sans">
                    Raça/Cor
                  </h3>
                  {loadingDemograficos ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                    </div>
                  ) : dadosDemograficos?.racaCor && dadosDemograficos.racaCor.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={260}>
                        <RechartsPie>
                          <Pie
                            data={dadosDemograficos.racaCor}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.percentage}%`}
                            outerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {dadosDemograficos.racaCor.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS_RACA[index % COLORS_RACA.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number, name: string) => [`${value} pessoas`, name]} />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </>
                  ) : (
                    <div className="text-center text-gray-500">Sem dados disponíveis</div>
                  )}
                </div>

                {/* Pizza 3: Faixas Etárias */}
                <div className="flex-shrink-0 bg-white rounded-3xl p-6 shadow-lg snap-center flex flex-col" style={{width: '380px', height: '380px'}}>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 text-center font-sans">
                    Faixas Etárias
                  </h3>
                  {loadingDemograficos ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                    </div>
                  ) : dadosDemograficos?.idade && dadosDemograficos.idade.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={260}>
                        <RechartsPie>
                          <Pie
                            data={dadosDemograficos.idade}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.percentage}%`}
                            outerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {dadosDemograficos.idade.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS_IDADE[index % COLORS_IDADE.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number, name: string) => [`${value} pessoas`, name]} />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </>
                  ) : (
                    <div className="text-center text-gray-500">Sem dados disponíveis</div>
                  )}
                </div>
            </div>
          </div>
          
          {/* Indicadores de navegação para os gráficos */}
          <div className="flex justify-center gap-2 mt-6">
            {[0, 1, 2].map((index) => (
              <button
                key={index}
                onClick={() => {
                  if (graficosScrollRef.current) {
                    const cardWidth = 380 + 24; // largura do card (380px) + gap (24px)
                    graficosScrollRef.current.scrollTo({
                      left: cardWidth * index,
                      behavior: 'smooth'
                    });
                  }
                }}
                className={`transition-all duration-300 rounded-full ${
                  currentGraficoSlide === index 
                    ? 'w-8 h-2 bg-gray-800' 
                    : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Ir para gráfico ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Carrossel de Métricas (Horas/Aula e Impacto) */}
        <div className="mb-8">
          <div 
            ref={metricasScrollRef}
            className="overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory" 
            style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
          >
            <style>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div className="flex gap-6 px-4" style={{width: 'fit-content'}}>
                {/* Card 1: Horas/Aula */}
                <div className="flex-shrink-0 bg-white rounded-3xl p-5 shadow-lg flex flex-col items-center justify-center snap-center" style={{width: '280px', height: '200px'}}>
                  <h3 className="text-base font-bold text-gray-900 mb-2 text-center font-sans">
                    Horas/Aula
                  </h3>
                  <div className="text-center">
                    <div className="text-4xl font-extrabold text-gray-900 font-sans">
                      226.359
                    </div>
                  </div>
                </div>

                {/* Card 2: Impacto Direto e Indiretamente */}
                <div className="flex-shrink-0 bg-white rounded-3xl p-5 shadow-lg flex flex-col items-center justify-center snap-center" style={{width: '280px', height: '200px'}}>
                  <h3 className="text-base font-bold text-gray-900 mb-2 text-center font-sans">
                    Impacto Direto e Indiretamente
                  </h3>
                  <div className="text-center">
                    <div className="text-4xl font-extrabold text-gray-900 font-sans">
                      {impactoAnualAnimated.toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
            </div>
          </div>
          
          {/* Indicadores de navegação para as métricas */}
          <div className="flex justify-center gap-2 mt-6">
            {[0, 1].map((index) => (
              <button
                key={index}
                onClick={() => {
                  if (metricasScrollRef.current) {
                    const cardWidth = 280 + 24; // largura do card (280px) + gap (24px)
                    metricasScrollRef.current.scrollTo({
                      left: cardWidth * index,
                      behavior: 'smooth'
                    });
                  }
                }}
                className={`transition-all duration-300 rounded-full ${
                  currentMetricaSlide === index 
                    ? 'w-8 h-2 bg-gray-800' 
                    : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Ir para métrica ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Seção Histórias que Inspiram */}
        <div className="px-5 mb-8 mt-5">
          {/* Título da seção com botão de atualização */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800 text-left">Histórias que Inspiram</h3>
            <button
              onClick={forceRefreshHistorias}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200"
              title="Atualizar histórias"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
          
          {/* Container de rolagem horizontal */}
          <div 
            ref={historiasScrollRef}
            className="overflow-x-auto pb-4 -mx-4 md:-mx-8 scroll-smooth" 
            style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
          >
            <style>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
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
                    backgroundImage: story.image ? `url("${story.image}")` : 'url("https://images.unsplash.com/photo-1494790108755-2616c943f671?w=400&h=200&fit=crop&crop=face")',
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
          
          {/* Indicadores de navegação (bolinhas) */}
          {finalStories.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {finalStories.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (historiasScrollRef.current) {
                      const cardWidth = 320 + 16;
                      historiasScrollRef.current.scrollTo({
                        left: cardWidth * index,
                        behavior: 'smooth'
                      });
                    }
                  }}
                  className={`transition-all duration-300 rounded-full ${
                    currentHistoriaSlide === index 
                      ? 'w-8 h-2 bg-gray-800' 
                      : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Ir para história ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNavigation hidden={isStoriesOpen} />

      {/* Menu Lateral de Ajuda */}
      {showHelpMenu && (
        <div className="fixed inset-0 z-50">
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
                console.log('🔍 [IMPACTO] userData.role:', userData.role, 'isLeo:', userData.role === 'leo');
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

      {/* Stories Viewer */}
      {isStoriesOpen && finalStories.length > 0 && (
        <StoriesViewerFinal
          stories={finalStories}
          currentStoryIndex={currentStoryIndex}
          onClose={closeStories}
          onStoryChange={setCurrentStoryIndex}
        />
      )}
    </div>
  );
}