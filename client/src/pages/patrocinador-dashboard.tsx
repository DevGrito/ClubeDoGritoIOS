import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/logo";
import { CompanyAvatar } from "@/components/CompanyAvatar";
import StoriesViewer from "@/components/StoriesViewer";
import BottomNavigation from "@/components/bottom-navigation";
import { 
  Menu,
  Home,
  FolderKanban,
  FileText,
  Package,
  LogOut,
  Building2,
  Users,
  MapPin,
  Heart,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  UsersRound,
  Phone,
  Mail,
  Settings,
  User,
  BarChart3,
  Filter,
  TrendingUp,
  BookOpen,
  Award,
  ShoppingBag,
  Briefcase,
  Store,
  Scissors,
  Target,
  GraduationCap,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import ImpactGestaoVista from "@/components/ImpactGestaoVista";

interface ImpactMetrics {
  vidasImpactadas: number;
  projetosApoiados: number;
  comunidadesAtendidas: number;
  voluntariosEngajados: number;
}

interface Projeto {
  id: number;
  nome: string;
  status: "Em andamento" | "Concluído";
  investimento: number;
}

interface ProgramaProgresso {
  nome: string;
  porcentagem: number;
  cor: string;
}

interface Historia {
  id: number;
  title: string;
  name: string;
  image: string;
  slides: Array<{
    id: string;
    type: 'image' | 'text';
    image?: string;
    title: string;
    content?: string;
    backgroundColor?: string;
    duration: number;
  }>;
}

interface PatrocinadorData {
  nomeEmpresa: string;
  logoUrl: string;
  impacto: ImpactMetrics;
  projetos: Projeto[];
  programas: ProgramaProgresso[];
}

const AnimatedCounter = ({ targetValue, delay = 0 }: { targetValue: number; delay?: number }) => {
  const [count, setCount] = useState(0);

  useState(() => {
    const timeout = setTimeout(() => {
      const duration = 1500;
      const steps = 60;
      const increment = targetValue / steps;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setCount(targetValue);
          clearInterval(timer);
        } else {
          setCount(Math.floor(increment * currentStep));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }, delay);

    return () => clearTimeout(timeout);
  });

  return <span>{count.toLocaleString('pt-BR')}</span>;
};

export default function PatrocinadorDashboard() {
  const [, setLocation] = useLocation();
  const [showStories, setShowStories] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeImpactIndex, setActiveImpactIndex] = useState(0);
  const impactScrollRef = useRef<HTMLDivElement>(null);
  const [isPausedAutoplay, setIsPausedAutoplay] = useState(false);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showPECDetails, setShowPECDetails] = useState(false);
  const [showInclusaoDetails, setShowInclusaoDetails] = useState(false);
  const [mesSelecionadoPEC, setMesSelecionadoPEC] = useState<number>(7);
  const [mesSelecionadoInclusao, setMesSelecionadoInclusao] = useState<number>(7);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const { toast } = useToast();

  // Estados para os modais de programas (igual ao doador)
  const [showPsicossocialModal, setShowPsicossocialModal] = useState(false);
  const [expandedPsicoCard, setExpandedPsicoCard] = useState<string | null>(null);
  const [showNegociosModal, setShowNegociosModal] = useState(false);
  const [expandedNegocioCard, setExpandedNegocioCard] = useState<string | null>(null);
  const [showPECModal, setShowPECModal] = useState(false);
  const [expandedPECCard, setExpandedPECCard] = useState<string | null>(null);
  const [showInclusaoModal, setShowInclusaoModal] = useState(false);
  const [expandedInclusaoCard, setExpandedInclusaoCard] = useState<string | null>(null);
  const [showF3DModal, setShowF3DModal] = useState(false);
  const [expandedF3DCard, setExpandedF3DCard] = useState<string | null>(null);

  // Buscar dados do PEC (para modal detalhes)
  const { data: dadosPEC, isLoading: isLoadingPEC } = useQuery<any>({
    queryKey: ['/api/pec/dados-mensais'],
    enabled: showPECDetails
  });

  // Buscar dados da Inclusão Produtiva (para modal detalhes)
  const { data: dadosInclusao, isLoading: isLoadingInclusao } = useQuery<any>({
    queryKey: ['/api/inclusao-produtiva/dados-mensais'],
    enabled: showInclusaoDetails
  });

  // ============ Queries para os modais de programas (igual ao doador) ============
  
  // Buscar dados de indicadores Psicossocial
  const { data: atencaoSocialData, isLoading: loadingAtencao } = useQuery<{
    success: boolean;
    data: {
      visitasDomiciliares: { realizadas: number; meta: number; percentual: number };
      atendimentosIndividuais: { realizados: number; meta: number; percentual: number };
    };
  }>({
    queryKey: ['/api/psico/indicadores/atencao-social'],
    enabled: showPsicossocialModal,
    queryFn: () => apiRequest('/api/psico/indicadores/atencao-social'),
  });

  const { data: metodoGritoData, isLoading: loadingMetodo } = useQuery<{
    success: boolean;
    data: {
      atendimentosColetivos: { realizados: number; percentualTurmas: number };
      espacosColetivos: { total: number; meta: number; percentual: number };
      caravanasComunitarias: number;
      acoesSaudeColaboradores: number;
    };
  }>({
    queryKey: ['/api/psico/indicadores/metodo-grito'],
    enabled: showPsicossocialModal,
    queryFn: () => apiRequest('/api/psico/indicadores/metodo-grito'),
  });

  // Buscar dados de Negócios Sociais
  const { data: negociosSociaisData, isLoading: loadingNegocios } = useQuery<{
    success: boolean;
    data: {
      outlet: {
        doacoesRecebidas: number;
        vendasPessoasImpactadas: number;
        pecasVendidas: number;
      };
      griffte: {
        pecasConfeccionadas: number;
        clientesAtendidos: number;
      };
    };
  }>({
    queryKey: ['/api/negocios-sociais'],
    enabled: showNegociosModal,
  });

  // Buscar dados de PEC para modal simplificado
  const { data: pecData, isLoading: loadingPEC } = useQuery<{
    success: boolean;
    data: {
      casaSonhar: {
        atendidos: number;
        atendimentos: number;
        frequencia: number;
        alimentacao: number;
        horaAula: number;
      };
      programaEsporteCultura: {
        atendidos: number;
        atendimentos: number;
        frequencia: number;
        alimentacao: number;
        horaAula: number;
      };
      serenata: {
        atendidos: number;
        atendimentos: number;
        frequencia: number;
        horaAula: number;
      };
    };
  }>({
    queryKey: ['/api/pec/dados-programas'],
    enabled: showPECModal,
  });

  // Buscar dados de Inclusão Produtiva para modal simplificado
  const { data: inclusaoData, isLoading: loadingInclusao } = useQuery<{
    projetos: Array<{
      nome: string;
      indicadores: Array<{ nome: string; valor: number; meta: number }>;
    }>;
    geracaoRenda?: { empregados: number; empreendedores: number };
  }>({
    queryKey: ['/api/inclusao-produtiva/indicadores'],
    enabled: showInclusaoModal,
  });

  // Buscar dados de Favela 3D (F3D)
  const { data: f3dData, isLoading: loadingF3D } = useQuery<{
    meses: string[];
    eixos: Array<{
      nome: string;
      indicadores: Array<{ nome: string; valor: number; impacto: number }>;
    }>;
  }>({
    queryKey: ['/api/favela-3d/dados-mensais'],
    enabled: showF3DModal,
  });

  // Helper functions para buscar valores mensais (igual ao Leo)
  const getValorMensalPEC = (projeto: string, indicador: string) => {
    if (!dadosPEC) return null;
    const projetoData = dadosPEC.projetos?.find((p: any) => p.projeto === projeto);
    if (!projetoData) return null;
    const indicadorData = projetoData.indicadores?.find((i: any) => i.nome === indicador);
    if (!indicadorData || !indicadorData.mensal) return null;
    return indicadorData.mensal[mesSelecionadoPEC];
  };

  const getValorMensalInclusao = (projeto: string, indicador: string) => {
    if (!dadosInclusao) return null;
    const projetoData = dadosInclusao.projetos?.find((p: any) => p.projeto === projeto);
    if (!projetoData) return null;
    const indicadorData = projetoData.indicadores?.find((i: any) => i.nome === indicador);
    if (!indicadorData || !indicadorData.mensal) return null;
    return indicadorData.mensal[mesSelecionadoInclusao];
  };

  // Verificar se está em modo dev e salvar no sessionStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isDevAccess = urlParams.get('dev_access') === 'true';
    const isFromDevPanel = urlParams.get('origin') === 'dev_panel';
    
    if (isDevAccess && isFromDevPanel) {
      sessionStorage.setItem('dev_session', 'active');
    }
  }, []);

  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const userId = localStorage.getItem("userId");
  const userEmail = localStorage.getItem("userEmail") || userData?.user?.email || "";
  const userName = localStorage.getItem("userName") || userData?.user?.nome || "Empresa Patrocinadora";

  // Buscar dados do patrocinador pelo email (categoria, valor, nome da empresa)
  const { data: patrocinadorInfo } = useQuery<{
    success: boolean;
    encontrado: boolean;
    patrocinador?: {
      id: number;
      nome: string;
      categoria: string;
      categoriaNome: string;
      valorPatrocinio: number;
      email: string;
    };
  }>({
    queryKey: ['/api/patrocinador/dados', userEmail],
    queryFn: () => fetch(`/api/patrocinador/dados/${encodeURIComponent(userEmail)}`).then(res => res.json()),
    enabled: !!userEmail
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "bom dia";
    if (hour < 18) return "boa tarde";
    return "boa noite";
  };

  const processImageUrl = (url: string) => {
    if (!url) return '/api/placeholder/300/400';
    
    if (url.includes('drive.google.com')) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (fileIdMatch) {
        return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
      }
    }
    
    return url;
  };

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
      
      if (cutPoint === -1) {
        cutPoint = currentText.lastIndexOf(' ', maxChars);
      }
      
      if (cutPoint === -1) {
        cutPoint = maxChars;
      }
      
      slides.push(currentText.substring(0, cutPoint + 1).trim());
      currentText = currentText.substring(cutPoint + 1).trim();
    }
    
    if (currentText.length > 0) {
      slides.push(currentText);
    }
    
    return slides;
  };

  const convertToStories = (historias: any[]) => {
    if (!historias || historias.length === 0) {
      return [];
    }
    
    return historias.map(historia => {
      const processedImageBox = processImageUrl(historia.imagemBox);
      const processedImageStory = processImageUrl(historia.imagemStory);
      const texto = historia.texto || `A história de ${historia.nome || historia.titulo} é uma demonstração real de como o Clube do Grito transforma vidas. Cada patrocínio contribui para mudanças significativas na comunidade.`;
      const textSlides = splitTextIntoSlides(texto, 600);
      
      const slides: any[] = [
        {
          id: `${historia.id}_1`,
          type: 'image' as const,
          image: processedImageStory,
          title: historia.titulo,
          duration: 5
        }
      ];
      
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
        image: processedImageBox,
        slides
      };
    });
  };

  const { data: historiasInspiradoras = [] } = useQuery<any[]>({
    queryKey: ["/api/historias-inspiradoras"],
  });

  const finalStories = convertToStories(historiasInspiradoras);

  const openStories = (storyIndex: number) => {
    setSelectedStoryIndex(storyIndex);
    setShowStories(true);
  };

  // Função auxiliar para parsear metas com comparadores
  const parseMeta = (value: any): { valor: number | null, operador: string | null } => {
    if (value === null || value === undefined || value === '') {
      return { valor: null, operador: null };
    }
    
    const stringValue = String(value).trim();
    
    // Detectar operador
    let operador = null;
    let numeroStr = stringValue;
    
    if (stringValue.startsWith('<=')) {
      operador = '<=';
      numeroStr = stringValue.substring(2);
    } else if (stringValue.startsWith('>=')) {
      operador = '>=';
      numeroStr = stringValue.substring(2);
    } else if (stringValue.startsWith('<')) {
      operador = '<';
      numeroStr = stringValue.substring(1);
    } else if (stringValue.startsWith('>')) {
      operador = '>';
      numeroStr = stringValue.substring(1);
    }
    
    // Limpar e parsear número
    numeroStr = numeroStr.replace(/[^\d.,-]/gi, '').trim();
    
    // Normalizar formato brasileiro
    if (numeroStr.includes(',')) {
      numeroStr = numeroStr.replace(/\./g, '').replace(',', '.');
    } else if (numeroStr.includes('.')) {
      const parts = numeroStr.split('.');
      const allThousands = parts.slice(1).every(part => part.length === 3);
      if (allThousands && parts.length > 1) {
        numeroStr = numeroStr.replace(/\./g, '');
      }
    }
    
    const valor = parseFloat(numeroStr);
    return {
      valor: isFinite(valor) ? valor : null,
      operador
    };
  };

  // Função auxiliar para normalizar valores
  const parseIndicadorValue = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return value;
    
    let stringValue = String(value).trim().replace(/[^\d.,-]/gi, '');
    
    if (stringValue.includes(',')) {
      stringValue = stringValue.replace(/\./g, '').replace(',', '.');
    } else if (stringValue.includes('.')) {
      const parts = stringValue.split('.');
      const allThousands = parts.slice(1).every(part => part.length === 3);
      if (allThousands && parts.length > 1) {
        stringValue = stringValue.replace(/\./g, '');
      }
    }
    
    const parsed = parseFloat(stringValue);
    return isFinite(parsed) ? parsed : null;
  };

  // Função para verificar se atingiu a meta considerando operadores
  const atingiuMeta = (valor: number | null, metaInfo: { valor: number | null, operador: string | null }): boolean | null => {
    if (valor === null || metaInfo.valor === null) return null;
    
    switch (metaInfo.operador) {
      case '<':
        return valor < metaInfo.valor;
      case '<=':
        return valor <= metaInfo.valor;
      case '>':
        return valor > metaInfo.valor;
      case '>=':
        return valor >= metaInfo.valor;
      default:
        // Sem operador, assume >= (atingiu ou superou)
        return valor >= metaInfo.valor;
    }
  };

  const { data: impactData } = useQuery<any>({
    queryKey: ['/api/gestao-vista/meta-realizado', { scope: 'annual', period: '2025' }],
  });

  // Buscar indicadores globais do banco Digital Ocean
  const { data: indicadoresGlobais } = useQuery<any>({
    queryKey: ['/api/indicadores-globais'],
  });

  // Buscar dados reais de progresso dos programas (mês 9 = setembro, último com dados)
  const { data: progressoData } = useQuery<any>({
    queryKey: ['/api/patrocinador/progresso-v2', { year: 2025, month: 9 }],
    staleTime: 0,
    refetchOnMount: true,
  });

  console.log('📊 [DEBUG] Dados de progresso recebidos:', progressoData);

  const patrocinadorData: PatrocinadorData = {
    nomeEmpresa: userName,
    logoUrl: "/placeholder-logo.png",
    impacto: {
      vidasImpactadas: 317062,
      projetosApoiados: 13,
      comunidadesAtendidas: 217,
      voluntariosEngajados: 78
    },
    projetos: [
      {
        id: 1,
        nome: "Programa de Cultura e Esporte",
        status: "Em andamento",
        investimento: 25000
      },
      {
        id: 2,
        nome: "Inclusão Produtiva",
        status: "Concluído",
        investimento: 15000
      }
    ],
    programas: progressoData?.programas || [
      { nome: "PROGRAMA DE CULTURA E ESPORTE", porcentagem: 90, cor: "#FFD700" },
      { nome: "INCLUSÃO PRODUTIVA", porcentagem: 70, cor: "#EF4444" },
      { nome: "FAVELA 3D", porcentagem: 65, cor: "#8B5CF6" },
      { nome: "MÉTODO GRITO", porcentagem: 45, cor: "#F97316" }
    ]
  };

  const handleLogout = () => {
    localStorage.clear();
    setLocation("/entrar");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const scrollToStory = (index: number) => {
    setActiveStoryIndex(index);
    if (scrollContainerRef.current) {
      const cardWidth = 320;
      const spacing = 16;
      const scrollPosition = (cardWidth + spacing) * index;
      scrollContainerRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
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

  const scrollToImpactCard = (index: number) => {
    setActiveImpactIndex(index);
    if (impactScrollRef.current) {
      const cardWidth = impactScrollRef.current.clientWidth;
      const scrollPosition = cardWidth * index;
      impactScrollRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const handleImpactScroll = () => {
      if (impactScrollRef.current) {
        const scrollLeft = impactScrollRef.current.scrollLeft;
        const cardWidth = impactScrollRef.current.clientWidth;
        const currentIndex = Math.round(scrollLeft / cardWidth);
        setActiveImpactIndex(Math.max(0, Math.min(3, currentIndex)));
      }
    };

    const impactContainer = impactScrollRef.current;
    if (impactContainer) {
      impactContainer.addEventListener('scroll', handleImpactScroll);
      return () => impactContainer.removeEventListener('scroll', handleImpactScroll);
    }
  }, []);

  // Autoplay do carrossel de impacto
  useEffect(() => {
    if (!isPausedAutoplay) {
      autoplayTimerRef.current = setInterval(() => {
        setActiveImpactIndex((prev) => {
          const nextIndex = (prev + 1) % 4;
          scrollToImpactCard(nextIndex);
          return nextIndex;
        });
      }, 5000); // Muda a cada 5 segundos
    }

    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    };
  }, [isPausedAutoplay]);

  // Pausar autoplay quando usuário interage
  const handleUserInteraction = () => {
    setIsPausedAutoplay(true);
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
    }
    
    // Retomar autoplay após 10 segundos de inatividade
    setTimeout(() => {
      setIsPausedAutoplay(false);
    }, 10000);
  };


  return (
    <motion.div 
      className="min-h-screen bg-white"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Header */}
      <header className="bg-white">
        <div className="px-4 py-3 flex items-center">
          {/* Elemento da Esquerda: Menu Hamburger */}
          <div className="w-16 flex justify-start">
            <button 
              onClick={() => setShowHelpMenu(true)}
              className="flex flex-col space-y-1 p-2 items-start"
              data-testid="button-menu"
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
          
          {/* Elemento da Direita: Perfil da Empresa */}
          <div className="w-16 flex justify-end">
            <div className="flex flex-col items-center">
              {/* Logo da Empresa */}
              <CompanyAvatar
                size="md"
                className="mb-1 border-2 border-gray-200"
                onClick={() => {
                  const urlParams = new URLSearchParams(window.location.search);
                  const devAccess = urlParams.get('dev_access');
                  const origin = urlParams.get('origin');
                  
                  if (devAccess === 'true' && origin === 'dev_panel') {
                    setLocation("/perfil-patrocinador?dev_access=true&origin=dev_panel");
                  } else {
                    setLocation("/perfil-patrocinador");
                  }
                }}
                companyName={userName}
              />
              
              {/* Badge Patrocinador */}
              <div className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full flex items-center space-x-1">
                <span>Patrocinador</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Saudação personalizada */}
          <div className="mb-8 -mt-4">
            <h2 className="text-xl md:text-2xl font-bold text-black mb-1">
              Olá {patrocinadorData.nomeEmpresa.split(' ')[0]}, {getGreeting()}!
            </h2>
          </div>

          {/* Seu Impacto em Números */}
          <div className="mb-8">
            <h2 className="text-base font-normal text-gray-900 mb-4">
              Seu Impacto em Números
            </h2>

            {/* Carrossel de Cards de Impacto */}
            <div 
              ref={impactScrollRef}
              onMouseDown={handleUserInteraction}
              onTouchStart={handleUserInteraction}
              className="overflow-x-auto snap-x snap-mandatory pb-4 cursor-grab active:cursor-grabbing" 
              style={{
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 justify-center md:justify-start" style={{width: 'fit-content', minWidth: '100%', marginLeft: 'auto', marginRight: 'auto'}}>
                {/* Card 1: Horas/Aula */}
                <Card data-testid="card-horas-aula" className="flex-shrink-0 w-[calc(100vw-2rem)] md:w-auto snap-start">
                  <CardContent className="py-10 px-4">
                    <div className="flex flex-col items-center text-center justify-center h-full">
                      <p className="text-sm text-gray-600 mb-2">Horas/Aula</p>
                      <p className="text-3xl font-bold text-gray-900">
                        <AnimatedCounter targetValue={indicadoresGlobais?.horasAula || 226359} />
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Card 2: Impacto Direto e Indiretamente */}
                <Card data-testid="card-impacto" className="flex-shrink-0 w-[calc(100vw-2rem)] md:w-auto snap-start">
                  <CardContent className="py-10 px-4">
                    <div className="flex flex-col items-center text-center justify-center h-full">
                      <p className="text-sm text-gray-600 mb-2">Impacto Direto e Indiretamente</p>
                      <p className="text-3xl font-bold text-gray-900">
                        <AnimatedCounter targetValue={indicadoresGlobais?.impactoDiretoIndireto || 317062} />
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Card 3: Atendimentos Socioemocionais */}
                <Card data-testid="card-atendimentos" className="flex-shrink-0 w-[calc(100vw-2rem)] md:w-auto snap-start">
                  <CardContent className="py-10 px-4">
                    <div className="flex flex-col items-center text-center justify-center h-full">
                      <p className="text-sm text-gray-600 mb-2">Atendimentos Socioemocionais</p>
                      <p className="text-3xl font-bold text-gray-900">
                        <AnimatedCounter targetValue={impactData?.kpis?.atendimentosSocioemocionais || 5024} />
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Card 4: Famílias Acompanhadas (exclusivo patrocinador) */}
                <Card data-testid="card-familias" className="flex-shrink-0 w-[calc(100vw-2rem)] md:w-auto snap-start">
                  <CardContent className="py-10 px-4">
                    <div className="flex flex-col items-center text-center justify-center h-full">
                      <p className="text-sm text-gray-600 mb-2">Famílias Acompanhadas</p>
                      <p className="text-3xl font-bold text-gray-900">
                        <AnimatedCounter targetValue={impactData?.kpis?.familiasAtivas || 219} />
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Indicadores do Carrossel (apenas mobile) */}
            <div className="flex justify-center space-x-2 mt-4 md:hidden">
              {[0, 1, 2, 3].map((index) => (
                <button
                  key={index}
                  onClick={() => {
                    handleUserInteraction();
                    scrollToImpactCard(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    activeImpactIndex === index 
                      ? 'bg-gray-800' 
                      : 'bg-gray-300 hover:bg-gray-500'
                  }`}
                  aria-label={`Ir para card ${index + 1}`}
                  data-testid={`indicator-impacto-${index}`}
                />
              ))}
            </div>
          </div>

          {/* Total Doado */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Sua Doação no O Grito!
            </h2>

            <Card className="hover:shadow-lg transition-shadow bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200" data-testid="card-total-investido">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {/* Categoria do Patrocinador */}
                  {patrocinadorInfo?.encontrado && patrocinadorInfo.patrocinador ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-medium text-gray-700">Patrocinador</span>
                        <span className="px-3 py-1 bg-yellow-500 text-white text-sm font-bold rounded-full">
                          {patrocinadorInfo.patrocinador.categoriaNome}
                        </span>
                      </div>
                      
                      {/* Nome da Empresa */}
                      <p className="text-base font-semibold text-gray-800">
                        {patrocinadorInfo.patrocinador.nome}
                      </p>
                      
                      {/* Valor Total */}
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Investido na Transformação!</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {formatCurrency(patrocinadorInfo.patrocinador.valorPatrocinio)}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-500">Cota não identificada</span>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Total Investido na Transformação!</p>
                        <p className="text-3xl font-bold text-gray-400">
                          R$ --
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Seção Com seu apoio, o impacto é imenso! - Cards de Programas (igual ao doador) */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 font-sans">
              Com seu apoio, o impacto é imenso!
            </h2>
            
            {/* Carrossel horizontal com todos os cards */}
            <div className="overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              <div className="flex gap-4 w-max items-start">
                {/* Card PEC */}
                <button
                  onClick={() => setShowPECModal(true)}
                  className="flex flex-col items-center outline-none focus:outline-none hover:opacity-80 transition-opacity cursor-pointer"
                  data-testid="card-programa-pec"
                >
                  <div className="w-20 h-20 bg-yellow-200 rounded-3xl flex items-center justify-center mb-2 shadow-sm">
                    <BookOpen className="w-10 h-10 text-gray-800" />
                  </div>
                  <span className="text-sm text-gray-800 font-semibold text-center">PEC</span>
                </button>

                {/* Card Psicossocial */}
                <button
                  onClick={() => setShowPsicossocialModal(true)}
                  className="flex flex-col items-center outline-none focus:outline-none hover:opacity-80 transition-opacity cursor-pointer"
                  data-testid="card-programa-psicossocial"
                >
                  <div className="w-20 h-20 bg-yellow-400 rounded-3xl flex items-center justify-center mb-2 shadow-sm">
                    <Heart className="w-10 h-10 text-gray-800" />
                  </div>
                  <span className="text-sm text-gray-800 font-semibold text-center leading-tight">Psicossocial</span>
                </button>

                {/* Card F3D */}
                <button
                  className="flex flex-col items-center outline-none focus:outline-none hover:opacity-80 transition-opacity cursor-pointer"
                  onClick={() => setShowF3DModal(true)}
                  data-testid="card-programa-f3d"
                >
                  <div className="w-20 h-20 bg-purple-300 rounded-3xl flex items-center justify-center mb-2 shadow-sm">
                    <Users className="w-10 h-10 text-gray-800" />
                  </div>
                  <span className="text-sm text-gray-800 font-semibold text-center">F3D</span>
                </button>

                {/* Card Negócios Sociais */}
                <button
                  className="flex flex-col items-center outline-none focus:outline-none hover:opacity-80 transition-opacity cursor-pointer"
                  onClick={() => setShowNegociosModal(true)}
                  data-testid="card-programa-negocios"
                >
                  <div className="w-20 h-20 bg-yellow-300 rounded-3xl flex items-center justify-center mb-2 shadow-sm">
                    <ShoppingBag className="w-10 h-10 text-gray-800" />
                  </div>
                  <span className="text-sm text-gray-800 font-semibold text-center leading-tight max-w-[80px]">Negócios Sociais</span>
                </button>

                {/* Card Inclusão Produtiva */}
                <button
                  className="flex flex-col items-center outline-none focus:outline-none hover:opacity-80 transition-opacity cursor-pointer"
                  onClick={() => setShowInclusaoModal(true)}
                  data-testid="card-programa-inclusao"
                >
                  <div className="w-20 h-20 bg-amber-200 rounded-3xl flex items-center justify-center mb-2 shadow-sm">
                    <Briefcase className="w-10 h-10 text-gray-800" />
                  </div>
                  <span className="text-sm text-gray-800 font-semibold text-center leading-tight max-w-[80px]">Inclusão Produtiva</span>
                </button>
              </div>
            </div>
          </div>

          {/* Gestão à Vista - igual ao doador */}
          <div className="mb-6">
            <ImpactGestaoVista mostrarAlunosEmFormacao={false} />
          </div>

          {/* Recursos e Contato */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Recursos e Contato
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <FileText className="w-10 h-10 text-blue-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Relatórios de Impacto
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Faça o download do relatório anual para acompanhar a prestação de contas.
                  </p>
                  <div className="space-y-2 mt-4">
                    <a href="/relatorio-anual-2024.pdf" download="Relatório Anual - 2024.pdf">
                      <Button variant="link" className="p-0 h-auto text-blue-600" data-testid="link-relatorio-anual">
                        <Download className="w-4 h-4 mr-2" />
                        Relatório Anual - 2024
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <Package className="w-10 h-10 text-purple-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Kit de Mídia
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Acesse nosso kit com logos, fotos e materiais para divulgação da nossa parceria.
                  </p>
                  <Button variant="default" className="w-full" data-testid="button-kit-midia">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Kit de Mídia
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Histórias que Inspiram */}
          {finalStories.length > 0 && (
            <div className="mb-8">
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
                        width: '320px',
                        height: '180px',
                        backgroundImage: story.image ? `url("${story.image}")` : 'url("https://images.unsplash.com/photo-1494790108755-2616c943f671?w=400&h=200&fit=crop&crop=face")',
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
                    data-testid={`indicator-historia-${index}`}
                  />
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Stories Viewer */}
        {showStories && (
          <StoriesViewer
            stories={finalStories}
            initialStoryIndex={selectedStoryIndex}
            onClose={() => setShowStories(false)}
          />
        )}

      {/* Modal de Detalhes do PEC (Cultura e Esporte) - Layout igual ao do Leo */}
      <Dialog open={showPECDetails} onOpenChange={setShowPECDetails}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Programa de Cultura e Esporte (PEC)</DialogTitle>
            <DialogDescription>
              Acompanhe os indicadores mensais dos projetos de Cultura e Esporte
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingPEC ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando dados...</p>
              </div>
            </div>
          ) : dadosPEC && dadosPEC.projetos?.length > 0 ? (
            <div className="space-y-6">
              {/* Filtro de Mês */}
              <Card>
                <CardHeader>
                  <CardTitle>Selecionar Mês</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={mesSelecionadoPEC.toString()} onValueChange={(value) => setMesSelecionadoPEC(parseInt(value))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {dadosPEC.meses?.map((mes: string, index: number) => (
                        <SelectItem key={index} value={index.toString()}>
                          {mes}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Gráfico de Visão Geral Consolidada - PEC */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6" />
                    Visão Geral - {dadosPEC.projetos?.[0]?.indicadores?.[0]?.nome || 'Evolução Mensal'}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Acompanhamento mensal de {dadosPEC.projetos?.[0]?.indicadores?.[0]?.nome?.toLowerCase()} dos 3 programas
                  </p>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Consolidar dados de todos os projetos por mês
                    const todosDados = dadosPEC.meses?.map((mes: string, idx: number) => {
                      const dataPoint: any = { mes };
                      
                      dadosPEC.projetos?.forEach((projeto: any, projetoIdx: number) => {
                        // Criar nome único para cada projeto
                        const nomeCompleto = projeto.projeto.toUpperCase();
                        let nomeProjetoCurto = '';
                        
                        if (nomeCompleto.includes('SALA') && nomeCompleto.includes('SERENATA')) nomeProjetoCurto = 'Sala Serenata';
                        else if (nomeCompleto.includes('POLO') && nomeCompleto.includes('GLÓRIA')) nomeProjetoCurto = 'Polo Glória';
                        else if (nomeCompleto.includes('CASA') && nomeCompleto.includes('SONHAR')) nomeProjetoCurto = 'Casa Sonhar';
                        else nomeProjetoCurto = projeto.projeto.split(' ').slice(0, 2).join(' '); // Pega 2 primeiras palavras
                        
                        const primeiroIndicador = projeto.indicadores?.[0];
                        if (primeiroIndicador) {
                          dataPoint[nomeProjetoCurto] = primeiroIndicador.mensal?.[idx] || 0;
                        }
                      });
                      
                      // Calcular total consolidado
                      dataPoint.Total = dadosPEC.projetos?.reduce((sum: number, projeto: any) => {
                        const valor = projeto.indicadores?.[0]?.mensal?.[idx] || 0;
                        return sum + valor;
                      }, 0) || 0;
                      
                      return dataPoint;
                    });

                    // Filtrar apenas até o mês selecionado
                    const dadosConsolidados = todosDados?.slice(0, mesSelecionadoPEC + 1) || [];

                    console.log('📊 [PEC GRÁFICO] Mês selecionado:', mesSelecionadoPEC);
                    console.log('📊 [PEC GRÁFICO] Dados filtrados:', dadosConsolidados);
                    console.log('📊 [PEC GRÁFICO] Projetos:', dadosPEC.projetos?.map((p: any) => p.projeto));

                    return (
                      <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={dadosConsolidados} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="mes" 
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            stroke="#d1d5db"
                          />
                          <YAxis 
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            stroke="#d1d5db"
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Legend 
                            wrapperStyle={{ paddingTop: '20px' }}
                            iconType="line"
                          />
                          {dadosPEC.projetos?.map((projeto: any, idx: number) => {
                            const nomeCompleto = projeto.projeto.toUpperCase();
                            let nomeProjetoCurto = '';
                            
                            if (nomeCompleto.includes('SALA') && nomeCompleto.includes('SERENATA')) nomeProjetoCurto = 'Sala Serenata';
                            else if (nomeCompleto.includes('POLO') && nomeCompleto.includes('GLÓRIA')) nomeProjetoCurto = 'Polo Glória';
                            else if (nomeCompleto.includes('CASA') && nomeCompleto.includes('SONHAR')) nomeProjetoCurto = 'Casa Sonhar';
                            else nomeProjetoCurto = projeto.projeto.split(' ').slice(0, 2).join(' ');
                            
                            const cores = ['#2563eb', '#60a5fa', '#93c5fd'];
                            return (
                              <Line 
                                key={projeto.projeto}
                                type="monotone" 
                                dataKey={nomeProjetoCurto} 
                                stroke={cores[idx % cores.length]} 
                                strokeWidth={3}
                                dot={{ r: 4 }}
                                name={nomeProjetoCurto}
                              />
                            );
                          })}
                        </LineChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Indicadores por Projeto */}
              {dadosPEC.projetos?.map((projeto: any) => (
                <Card key={projeto.projeto}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        {projeto.projeto}
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Filter className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {projeto.indicadores?.map((indicador: any) => (
                        <div key={indicador.nome} className="p-4 border rounded-lg">
                          <p className="text-sm text-gray-600 mb-2">{indicador.nome}</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {getValorMensalPEC(projeto.projeto, indicador.nome) || 0}
                          </p>
                          {indicador.meta && (
                            <p className="text-xs text-gray-500">Meta: {indicador.meta}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Gráfico de Evolução Mensal */}
                    {projeto.indicadores?.[0] && (
                      <div className="mt-6">
                        <h4 className="text-sm font-semibold mb-4">Evolução Mensal - {projeto.indicadores[0].nome}</h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={dadosPEC.meses?.map((mes: string, idx: number) => ({
                            mes,
                            valor: projeto.indicadores[0].mensal[idx] || 0
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mes" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="valor" fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-600">Nenhum dado disponível</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes da Inclusão Produtiva */}
      <Dialog open={showInclusaoDetails} onOpenChange={setShowInclusaoDetails}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Inclusão Produtiva</DialogTitle>
            <DialogDescription>
              Acompanhe os indicadores mensais<br />dos projetos de Inclusão Produtiva
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingInclusao ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando dados...</p>
              </div>
            </div>
          ) : !dadosInclusao ? (
            <div className="p-6">Carregando dados de Inclusão Produtiva...</div>
          ) : (
            <div className="space-y-6">
              {/* Filtro de Mês Global para Visão Geral */}
              <Card>
                <CardHeader>
                  <CardTitle>Selecionar Mês</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={mesSelecionadoInclusao.toString()} onValueChange={(value) => setMesSelecionadoInclusao(parseInt(value))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {dadosInclusao.meses?.map((mes: string, index: number) => (
                        <SelectItem key={index} value={index.toString()}>
                          {mes}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Gráfico de Visão Geral Consolidada - Inclusão Produtiva */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6" />
                    Visão Geral - {dadosInclusao.projetos?.[0]?.indicadores?.[0]?.nome || 'Evolução Mensal'}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Acompanhamento mensal de {dadosInclusao.projetos?.[0]?.indicadores?.[0]?.nome?.toLowerCase()} dos 3 programas
                  </p>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Consolidar dados de todos os projetos por mês
                    const todosDados = dadosInclusao.meses?.map((mes: string, idx: number) => {
                      const dataPoint: any = { mes };
                      
                      dadosInclusao.projetos?.forEach((projeto: any) => {
                        const nomeCompleto = projeto.projeto.toUpperCase();
                        let nomeProjetoCurto = '';
                        
                        if (nomeCompleto.includes('LAB')) nomeProjetoCurto = 'LAB Vozes';
                        else if (nomeCompleto.includes('PRESENCIAIS')) nomeProjetoCurto = 'Presencial';
                        else if (nomeCompleto.includes('EAD')) nomeProjetoCurto = 'EAD';
                        else nomeProjetoCurto = projeto.projeto.split(' ').slice(0, 2).join(' ');
                        
                        const primeiroIndicador = projeto.indicadores?.[0];
                        if (primeiroIndicador) {
                          dataPoint[nomeProjetoCurto] = primeiroIndicador.mensal?.[idx] || 0;
                        }
                      });
                      
                      // Calcular total consolidado
                      dataPoint.Total = dadosInclusao.projetos?.reduce((sum: number, projeto: any) => {
                        const valor = projeto.indicadores?.[0]?.mensal?.[idx] || 0;
                        return sum + valor;
                      }, 0) || 0;
                      
                      return dataPoint;
                    });

                    // Filtrar apenas até o mês selecionado
                    const dadosConsolidados = todosDados?.slice(0, mesSelecionadoInclusao + 1) || [];

                    console.log('📊 [INCLUSÃO GRÁFICO] Mês selecionado:', mesSelecionadoInclusao);
                    console.log('📊 [INCLUSÃO GRÁFICO] Dados filtrados:', dadosConsolidados);
                    console.log('📊 [INCLUSÃO GRÁFICO] Projetos:', dadosInclusao.projetos?.map((p: any) => p.projeto));

                    return (
                      <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={dadosConsolidados} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="mes" 
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            stroke="#d1d5db"
                          />
                          <YAxis 
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            stroke="#d1d5db"
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Legend 
                            wrapperStyle={{ paddingTop: '20px' }}
                            iconType="line"
                          />
                          {dadosInclusao.projetos?.map((projeto: any, idx: number) => {
                            const nomeCompleto = projeto.projeto.toUpperCase();
                            let nomeProjetoCurto = '';
                            
                            if (nomeCompleto.includes('LAB')) nomeProjetoCurto = 'LAB Vozes';
                            else if (nomeCompleto.includes('PRESENCIAIS')) nomeProjetoCurto = 'Presencial';
                            else if (nomeCompleto.includes('EAD')) nomeProjetoCurto = 'EAD';
                            else nomeProjetoCurto = projeto.projeto.split(' ').slice(0, 2).join(' ');
                            
                            const cores = ['#059669', '#10b981', '#34d399'];
                            return (
                              <Line 
                                key={projeto.projeto}
                                type="monotone" 
                                dataKey={nomeProjetoCurto} 
                                stroke={cores[idx % cores.length]} 
                                strokeWidth={3}
                                dot={{ r: 4 }}
                                name={nomeProjetoCurto}
                              />
                            );
                          })}
                        </LineChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Indicadores por Projeto (cada um com seu próprio filtro) */}
              {dadosInclusao.projetos?.map((projeto: any) => (
                <Card key={projeto.projeto}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        {projeto.projeto}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Filtro de Mês Individual */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Selecionar Mês</label>
                      <Select value={mesSelecionadoInclusao.toString()} onValueChange={(value) => setMesSelecionadoInclusao(parseInt(value))}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o mês" />
                        </SelectTrigger>
                        <SelectContent>
                          {dadosInclusao.meses?.map((mes: string, index: number) => (
                            <SelectItem key={index} value={index.toString()}>
                              {mes}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {projeto.indicadores?.map((indicador: any) => (
                        <div key={indicador.nome} className="p-4 border rounded-lg">
                          <p className="text-sm text-gray-600 mb-2">{indicador.nome}</p>
                          <p className="text-2xl font-bold text-green-600">
                            {getValorMensalInclusao(projeto.projeto, indicador.nome) || 0}
                          </p>
                          {indicador.meta && (
                            <p className="text-xs text-gray-500">Meta: {indicador.meta}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  
                  {/* Gráfico de Evolução Mensal */}
                  {projeto.indicadores?.[0] && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold mb-4">Evolução Mensal - {projeto.indicadores[0].nome}</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={dadosInclusao.meses?.map((mes: string, idx: number) => ({
                          mes,
                          valor: projeto.indicadores[0].mensal[idx] || 0
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="valor" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Menu Lateral - Design igual ao Conselheiro */}
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
                <h2 className="text-xl font-semibold text-black">
                  Fala {userName.split(' ')[0] || "Patrocinador"}, tudo bem?
                </h2>
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
                    setTimeout(() => setLocation("/perfil-patrocinador"), 150);
                  }}
                  data-testid="menu-perfil"
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

              {/* Home */}
              <div>
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                  onClick={() => setShowHelpMenu(false)}
                  data-testid="menu-home"
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

              {/* Canal de Transparência */}
              <div>
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                  onClick={() => {
                    setShowHelpMenu(false);
                    window.open('https://complaint-tracker-OGRITO.replit.app', '_blank');
                  }}
                  data-testid="menu-transparencia"
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
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    setShowHelpMenu(false);
                    setTimeout(() => {
                      setLocation("/entrar");
                      window.location.reload();
                    }, 150);
                  }}
                  data-testid="menu-deslogar"
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <LogOut className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base">
                      Deslogar
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      Encerrar sessão e deslogar.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
                <div className="border-b border-gray-100 mx-4"></div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ============ MODAIS DOS PROGRAMAS (igual ao doador) ============ */}

      {/* Modal de Indicadores Psicossocial */}
      <Dialog open={showPsicossocialModal} onOpenChange={setShowPsicossocialModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Heart className="w-6 h-6 text-yellow-600" />
              Indicadores Psicossocial
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Botão/Card 1: Atenção Social */}
            <div
              className="bg-yellow-50 rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl"
              onClick={() => setExpandedPsicoCard(expandedPsicoCard === 'atencao-social' ? null : 'atencao-social')}
              data-testid="card-atencao-social"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                      <Home className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Atenção Social</h3>
                  </div>
                  {expandedPsicoCard === 'atencao-social' ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                
                {expandedPsicoCard === 'atencao-social' && (
                  <div className="mt-4">
                    {loadingAtencao ? (
                      <div className="text-center py-4 text-gray-500">Carregando...</div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-3xl font-bold text-yellow-600 mb-1">
                            {atencaoSocialData?.data.visitasDomiciliares.realizadas}
                          </div>
                          <p className="text-xs text-gray-700 font-medium mb-1">Visitas Domiciliares</p>
                          <p className="text-xs text-gray-500">
                            {atencaoSocialData?.data.visitasDomiciliares.percentual}% da Meta 2025
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-3xl font-bold text-yellow-600 mb-1">
                            {atencaoSocialData?.data.atendimentosIndividuais.realizados}
                          </div>
                          <p className="text-xs text-gray-700 font-medium mb-1">Atendimentos Individuais</p>
                          <p className="text-xs text-gray-500">
                            {atencaoSocialData?.data.atendimentosIndividuais.percentual}% da Meta 2025
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Botão/Card 2: Método O Grito */}
            <div
              className="bg-yellow-50 rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl"
              onClick={() => setExpandedPsicoCard(expandedPsicoCard === 'metodo-grito' ? null : 'metodo-grito')}
              data-testid="card-metodo-grito"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Método O Grito</h3>
                  </div>
                  {expandedPsicoCard === 'metodo-grito' ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </div>

                {expandedPsicoCard === 'metodo-grito' && (
                  <div className="mt-4">
                    {loadingMetodo ? (
                      <div className="text-center py-4 text-gray-500">Carregando...</div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-3xl font-bold text-yellow-600 mb-1">
                            {metodoGritoData?.data.atendimentosColetivos.realizados.toLocaleString('pt-BR')}
                          </div>
                          <p className="text-xs text-gray-700 font-medium mb-1">Atendimentos Coletivos</p>
                          <p className="text-xs text-gray-500">
                            {metodoGritoData?.data.atendimentosColetivos.percentualTurmas}% das turmas
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-3xl font-bold text-yellow-600 mb-1">
                            {metodoGritoData?.data.espacosColetivos.total}
                          </div>
                          <p className="text-xs text-gray-700 font-medium mb-1">#EspaçoOgrito</p>
                          <p className="text-xs text-gray-500">
                            {metodoGritoData?.data.espacosColetivos.percentual}% da Meta 2025
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-3xl font-bold text-yellow-600 mb-1">
                            {metodoGritoData?.data.caravanasComunitarias}
                          </div>
                          <p className="text-xs text-gray-700 font-medium">Caravana Comunitária</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-3xl font-bold text-yellow-600 mb-1">
                            {metodoGritoData?.data.acoesSaudeColaboradores}
                          </div>
                          <p className="text-xs text-gray-700 font-medium">Ações de Saúde</p>
                          <p className="text-xs text-gray-500">para colaboradores</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Negócios Sociais */}
      <Dialog open={showNegociosModal} onOpenChange={setShowNegociosModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-yellow-600" />
              Negócios Sociais
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Card Outlet */}
            <div
              className="bg-yellow-50 rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl"
              onClick={() => setExpandedNegocioCard(expandedNegocioCard === 'outlet' ? null : 'outlet')}
              data-testid="card-outlet"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                      <Store className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">IOG Outlet</h3>
                  </div>
                  {expandedNegocioCard === 'outlet' ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                
                {expandedNegocioCard === 'outlet' && (
                  <div className="mt-4">
                    {loadingNegocios ? (
                      <div className="text-center py-4 text-gray-500">Carregando...</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1">
                            {negociosSociaisData?.data.outlet.doacoesRecebidas.toLocaleString('pt-BR')}
                          </div>
                          <p className="text-xs text-gray-700 font-medium">Doações Recebidas</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1">
                            {negociosSociaisData?.data.outlet.vendasPessoasImpactadas.toLocaleString('pt-BR')}
                          </div>
                          <p className="text-xs text-gray-700 font-medium">Vendas - Pessoas Impactadas</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1">
                            {negociosSociaisData?.data.outlet.pecasVendidas.toLocaleString('pt-BR')}
                          </div>
                          <p className="text-xs text-gray-700 font-medium">Peças / Itens Vendidos</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Card Griffte */}
            <div
              className="bg-yellow-50 rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl"
              onClick={() => setExpandedNegocioCard(expandedNegocioCard === 'griffte' ? null : 'griffte')}
              data-testid="card-griffte"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                      <Scissors className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">IOG Confecção</h3>
                  </div>
                  {expandedNegocioCard === 'griffte' ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                
                {expandedNegocioCard === 'griffte' && (
                  <div className="mt-4">
                    {loadingNegocios ? (
                      <div className="text-center py-4 text-gray-500">Carregando...</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1">
                            {negociosSociaisData?.data.griffte.pecasConfeccionadas.toLocaleString('pt-BR')}
                          </div>
                          <p className="text-xs text-gray-700 font-medium">Peças Confeccionadas</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1">
                            {negociosSociaisData?.data.griffte.clientesAtendidos.toLocaleString('pt-BR')}
                          </div>
                          <p className="text-xs text-gray-700 font-medium">Clientes Atendidos</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de PEC - Polo Esportivo Cultural */}
      <Dialog open={showPECModal} onOpenChange={setShowPECModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-yellow-600" />
              PEC - Polo Esportivo Cultural
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Card Casa Sonhar */}
            <div
              className="bg-yellow-50 rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl"
              onClick={() => setExpandedPECCard(expandedPECCard === 'casa-sonhar' ? null : 'casa-sonhar')}
              data-testid="card-casa-sonhar"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                      <Home className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Casa Sonhar</h3>
                  </div>
                  {expandedPECCard === 'casa-sonhar' ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                
                {expandedPECCard === 'casa-sonhar' && (
                  <div className="mt-4">
                    {loadingPEC ? (
                      <div className="text-center py-4 text-gray-500">Carregando...</div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-3xl font-bold text-yellow-600 mb-1">
                            {pecData?.data.casaSonhar.atendidos.toLocaleString('pt-BR')}
                          </div>
                          <p className="text-xs text-gray-700 font-medium">Atendidos</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-3xl font-bold text-yellow-600 mb-1">
                            {pecData?.data.casaSonhar.atendimentos.toLocaleString('pt-BR')}
                          </div>
                          <p className="text-xs text-gray-700 font-medium">Atendimentos</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-3xl font-bold text-yellow-600 mb-1">
                            {pecData?.data.casaSonhar.frequencia}%
                          </div>
                          <p className="text-xs text-gray-700 font-medium">Frequência</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-3xl font-bold text-yellow-600 mb-1">
                            {pecData?.data.casaSonhar.alimentacao.toLocaleString('pt-BR')}
                          </div>
                          <p className="text-xs text-gray-700 font-medium">Alimentação</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm col-span-2">
                          <div className="text-3xl font-bold text-yellow-600 mb-1">
                            {pecData?.data.casaSonhar.horaAula.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <p className="text-xs text-gray-700 font-medium">Hora-Aula</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Card Programa de Esporte e Cultura */}
            <div
              className="bg-yellow-50 rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl"
              onClick={() => setExpandedPECCard(expandedPECCard === 'esporte-cultura' ? null : 'esporte-cultura')}
              data-testid="card-esporte-cultura"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Programa de Esporte e Cultura</h3>
                  </div>
                  {expandedPECCard === 'esporte-cultura' ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                
                {expandedPECCard === 'esporte-cultura' && (
                  <div className="mt-4">
                    {loadingPEC ? (
                      <div className="text-center py-4 text-gray-500">Carregando...</div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-3xl font-bold text-yellow-600 mb-1">
                            {pecData?.data.programaEsporteCultura.atendidos.toLocaleString('pt-BR')}
                          </div>
                          <p className="text-xs text-gray-700 font-medium">Atendidos</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-3xl font-bold text-yellow-600 mb-1">
                            {pecData?.data.programaEsporteCultura.atendimentos.toLocaleString('pt-BR')}
                          </div>
                          <p className="text-xs text-gray-700 font-medium">Atendimentos</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-3xl font-bold text-yellow-600 mb-1">
                            {pecData?.data.programaEsporteCultura.frequencia}%
                          </div>
                          <p className="text-xs text-gray-700 font-medium">Frequência</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-3xl font-bold text-yellow-600 mb-1">
                            {pecData?.data.programaEsporteCultura.alimentacao.toLocaleString('pt-BR')}
                          </div>
                          <p className="text-xs text-gray-700 font-medium">Alimentação</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm col-span-2">
                          <div className="text-3xl font-bold text-yellow-600 mb-1">
                            {pecData?.data.programaEsporteCultura.horaAula.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <p className="text-xs text-gray-700 font-medium">Hora-Aula</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Card Serenata */}
            <div
              className="bg-yellow-50 rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl"
              onClick={() => setExpandedPECCard(expandedPECCard === 'serenata' ? null : 'serenata')}
              data-testid="card-serenata"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Serenata</h3>
                  </div>
                  {expandedPECCard === 'serenata' ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                
                {expandedPECCard === 'serenata' && (
                  <div className="mt-4">
                    {loadingPEC ? (
                      <div className="text-center py-4 text-gray-500">Carregando...</div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-3xl font-bold text-yellow-600 mb-1">
                            {pecData?.data.serenata.atendidos.toLocaleString('pt-BR')}
                          </div>
                          <p className="text-xs text-gray-700 font-medium">Atendidos</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-3xl font-bold text-yellow-600 mb-1">
                            {pecData?.data.serenata.atendimentos.toLocaleString('pt-BR')}
                          </div>
                          <p className="text-xs text-gray-700 font-medium">Atendimentos</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-3xl font-bold text-yellow-600 mb-1">
                            {pecData?.data.serenata.frequencia}%
                          </div>
                          <p className="text-xs text-gray-700 font-medium">Frequência</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-3xl font-bold text-yellow-600 mb-1">
                            {pecData?.data.serenata.horaAula.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <p className="text-xs text-gray-700 font-medium">Hora-Aula</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Inclusão Produtiva */}
      <Dialog open={showInclusaoModal} onOpenChange={setShowInclusaoModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-yellow-600" />
              Inclusão Produtiva
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {loadingInclusao ? (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : inclusaoData?.projetos ? (
              <>
              {/* Card Geração de Renda - aparece primeiro, sem precisar rolar */}
              <div className="bg-yellow-50 rounded-2xl shadow-lg overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">GERAÇÃO DE RENDA</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                      <div className="text-3xl font-bold text-yellow-600 mb-1">
                        {(inclusaoData.geracaoRenda?.empregados ?? 0).toLocaleString('pt-BR')}
                      </div>
                      <p className="text-xs text-gray-700 font-medium">Empregados</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                      <div className="text-3xl font-bold text-yellow-600 mb-1">
                        {(inclusaoData.geracaoRenda?.empreendedores ?? 0).toLocaleString('pt-BR')}
                      </div>
                      <p className="text-xs text-gray-700 font-medium">Empreendedores</p>
                    </div>
                  </div>
                </div>
              </div>
              {inclusaoData.projetos.map((projeto, index) => {
                const bgColors = ['bg-yellow-50', 'bg-yellow-50', 'bg-yellow-50'];
                const iconColors = ['bg-yellow-500', 'bg-yellow-500', 'bg-yellow-500'];
                const textColors = ['text-yellow-600', 'text-yellow-600', 'text-yellow-600'];
                const icons = [<Briefcase key="1" className="w-5 h-5 text-white" />, <GraduationCap key="2" className="w-5 h-5 text-white" />, <Target key="3" className="w-5 h-5 text-white" />];
                
                return (
                  <div
                    key={projeto.nome}
                    className={`${bgColors[index % 3]} rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl`}
                    onClick={() => setExpandedInclusaoCard(expandedInclusaoCard === projeto.nome ? null : projeto.nome)}
                    data-testid={`card-inclusao-${index}`}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${iconColors[index % 3]} rounded-xl flex items-center justify-center`}>
                            {icons[index % 3]}
                          </div>
                          <h3 className="text-lg font-bold text-gray-800">{projeto.nome}</h3>
                        </div>
                        {expandedInclusaoCard === projeto.nome ? (
                          <ChevronUp className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                      
                      {expandedInclusaoCard === projeto.nome && (
                        <div className="mt-4">
                          <div className="grid grid-cols-2 gap-3">
                            {projeto.indicadores.map((indicador, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-3 text-center shadow-sm">
                                <div className={`text-3xl font-bold ${textColors[index % 3]} mb-1`}>
                                  {indicador.valor.toLocaleString('pt-BR')}
                                </div>
                                <p className="text-xs text-gray-700 font-medium">{indicador.nome}</p>
                                {indicador.meta && (
                                  <div className="mt-2">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className={`h-2 rounded-full ${iconColors[index % 3]}`}
                                        style={{ width: `${Math.min(100, (indicador.valor / indicador.meta) * 100)}%` }}
                                      />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Meta: {indicador.meta}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">Nenhum dado disponível</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Favela 3D (F3D) */}
      <Dialog open={showF3DModal} onOpenChange={setShowF3DModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-600" />
              Favela 3D
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {loadingF3D ? (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : f3dData?.eixos ? (
              f3dData.eixos.map((eixo: any, index: number) => {
                const bgColors = ['bg-purple-50', 'bg-purple-50', 'bg-purple-50'];
                const iconColors = ['bg-purple-500', 'bg-purple-500', 'bg-purple-500'];
                const textColors = ['text-purple-600', 'text-purple-600', 'text-purple-600'];
                const icons = [<Users key="1" className="w-5 h-5 text-white" />, <TrendingUp key="2" className="w-5 h-5 text-white" />, <Home key="3" className="w-5 h-5 text-white" />];
                
                return (
                  <div
                    key={eixo.nome}
                    className={`${bgColors[index % 3]} rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl`}
                    onClick={() => setExpandedF3DCard(expandedF3DCard === eixo.nome ? null : eixo.nome)}
                    data-testid={`card-f3d-${index}`}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${iconColors[index % 3]} rounded-xl flex items-center justify-center`}>
                            {icons[index % 3]}
                          </div>
                          <h3 className="text-lg font-bold text-gray-800">{eixo.nome}</h3>
                        </div>
                        {expandedF3DCard === eixo.nome ? (
                          <ChevronUp className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                      
                      {expandedF3DCard === eixo.nome && (
                        <div className="mt-4">
                          <div className={`grid gap-3 ${eixo.indicadores.length === 1 ? 'grid-cols-1 max-w-[200px] mx-auto' : 'grid-cols-2'}`}>
                            {eixo.indicadores.map((indicador: any, idx: number) => (
                              <div key={idx} className="bg-white rounded-lg p-3 text-center shadow-sm">
                                <div className={`text-2xl font-bold ${textColors[index % 3]} mb-1`}>
                                  {(indicador.valor ?? 0).toLocaleString('pt-BR')}
                                </div>
                                <p className="text-xs text-gray-700 font-medium">{indicador.nome}</p>
                                {indicador.impacto > 0 && (
                                  <p className="text-xs text-green-600 mt-1">Pessoas Impactadas: {indicador.impacto.toLocaleString('pt-BR')}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">Nenhum dado disponível</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <BottomNavigation hidden={showStories} />
    </motion.div>
  );
}
