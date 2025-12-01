import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useProfileImage } from "@/hooks/useProfileImage";
import { UserAvatar } from "@/components/UserAvatar";
import { useUserData } from "@/hooks/useUserData";
import Logo from "@/components/logo";
import BottomNavigation from "@/components/bottom-navigation";
import StoriesViewer from "@/components/StoriesViewer";
import { logger } from "@/utils/logger";
import { CheckinCard } from "@/components/CheckinCard";
import ImpactGestaoVista from "@/components/ImpactGestaoVista";
import { IndiqueGanhe } from "@/components/IndiqueGanhe";
import { isLeoMartins } from "@shared/conselho";

import outletLogo from "@assets/7f1ea56f-9e4c-4d9a-8f13-a744dc9538a6_1754683715214.png";
import griffteLogo from "@assets/c735de54-82fe-432d-876d-508c7a28ca87_1754683710836.png";
import { getPlanImage } from "@/lib/plan-utils";

import {
  Heart,
  Star,
  ArrowRight,
  User,
  Calendar,
  CreditCard,
  TrendingUp,
  HelpCircle,
  Award,
  DollarSign,
  Crown,
  ShoppingBag,
  Store,
  Scissors,
  Shirt,
  Smartphone,
  BookOpen,
  Settings,
  Mail,
  Phone,
  Gift,
  Zap,
  Target,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Search,
  QrCode,
  Coins,
  LogOut,
  Monitor,
  Shield,
  X,
  Utensils,
  UtensilsCrossed,
  Clock,
  Users,
  Bus,
  Home,
  Briefcase,
  GraduationCap,
  Music,
  ExternalLink,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { planPrices } from "@/lib/stripe";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { type Beneficio } from "@shared/schema";
import { Cell, PieChart as RechartsPie, Pie, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const updateUserSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  telefone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
});

// Componente simples para animar números
const AnimatedNumber = ({
  targetValue,
  delay = 0,
}: {
  targetValue: number;
  delay?: number;
}) => {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 1200; // 1.2 segundos
      const steps = 60; // 60 frames para animação suave
      const increment = targetValue / steps;
      let step = 0;

      const interval = setInterval(() => {
        step++;
        const newValue = Math.min(step * increment, targetValue);
        setCurrentValue(Math.round(newValue));

        if (step >= steps) {
          clearInterval(interval);
          setCurrentValue(targetValue);
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [targetValue, delay]);

  return <span>{currentValue}</span>;
};

type UpdateUserForm = z.infer<typeof updateUserSchema>;

// Componente para mostrar o número do doador
const DonorNumberBadge = ({ userId }: { userId: number }) => {
  const { data: donorNumber, isLoading } = useQuery({
    queryKey: ["/api/users", userId, "donor-number"],
    queryFn: () => apiRequest(`/api/users/${userId}/donor-number`),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    gcTime: 10 * 60 * 1000, // Manter em cache por 10 minutos
  });

  if (isLoading || !donorNumber?.isDonor) {
    return null;
  }

  return (
    <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full mb-1 flex items-center">
      <Shield className="w-3 h-3 mr-1" />
      <span>Doador #{donorNumber.donorNumber}</span>
    </div>
  );
};

// Componente para mostrar a escolha do "Grito" do usuário
const UserGritoBadge = ({ userId }: { userId: number }) => {
  const { data: userCausa, isLoading } = useQuery({
    queryKey: ["/api/users", userId, "causa"],
    queryFn: () => apiRequest(`/api/users/${userId}/causa`),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    gcTime: 10 * 60 * 1000, // Manter em cache por 10 minutos
  });

  if (isLoading || !userCausa?.causa) {
    return null;
  }

  const gritoLabels: Record<
    string,
    { label: string; icon: any; color: string }
  > = {
    educacao: { label: "Pela Educação", icon: BookOpen, color: "bg-blue-500" },
    cultura: { label: "Pela Cultura", icon: Star, color: "bg-purple-500" },
    esporte: { label: "Pelo Esporte", icon: Target, color: "bg-green-500" },
    criancas: { label: "Pelas Crianças", icon: Heart, color: "bg-pink-500" },
    jovens: { label: "Pelos Jovens", icon: Zap, color: "bg-orange-500" },
  };

  const gritoInfo = gritoLabels[userCausa.causa] || {
    label: "Pelo Instituto",
    icon: Heart,
    color: "bg-gray-500",
  };

  const IconComponent = gritoInfo.icon;

  return (
    <div
      className={`${gritoInfo.color} text-white text-xs font-bold px-2 py-1 rounded-full mb-1 flex items-center`}
    >
      <IconComponent className="w-3 h-3 mr-1" />
      <span>{gritoInfo.label}</span>
    </div>
  );
};

// Componente para renderizar ícones do Lucide dinamicamente
const DynamicIcon = ({
  iconName,
  className = "w-6 h-6",
}: {
  iconName: string;
  className?: string;
}) => {
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

// Componente para animar contadores de porcentagem
const AnimatedCounter = ({
  targetValue,
  delay = 0,
  shouldStart = false,
}: {
  targetValue: number;
  delay?: number;
  shouldStart?: boolean;
}) => {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    if (!shouldStart) {
      setCurrentValue(0);
      return;
    }

    const timer = setTimeout(() => {
      const duration = 1200; // 1.2 segundos
      const steps = 60; // 60 FPS
      const increment = targetValue / steps;
      let current = 0;

      const interval = setInterval(() => {
        current += increment;
        if (current >= targetValue) {
          setCurrentValue(targetValue);
          clearInterval(interval);
        } else {
          setCurrentValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [targetValue, delay, shouldStart]);

  return <span>{currentValue}</span>;
};

// Componente do Carrossel de Publicidade
function PublicityCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const publicityItems = [
    {
      id: 1,
      title: "Desconto Especial",
      description: "20% OFF em produtos selecionados",
      bgColor: "from-blue-50 to-blue-100",
      borderColor: "border-blue-200",
      textColor: "text-blue-800",
      icon: Gift,
    },
    {
      id: 2,
      title: "Novos Conteúdos",
      description: "Acesse materiais exclusivos",
      bgColor: "from-green-50 to-green-100",
      borderColor: "border-green-200",
      textColor: "text-green-800",
      icon: Zap,
    },
    {
      id: 3,
      title: "Promoção Flash",
      description: "Ofertas por tempo limitado",
      bgColor: "from-orange-50 to-orange-100",
      borderColor: "border-orange-200",
      textColor: "text-orange-800",
      icon: Target,
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % publicityItems.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + publicityItems.length) % publicityItems.length
    );
  };

  // Touch handlers for swipe functionality - improved sensitivity
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);

    // Prevenir scroll horizontal se houver movimento significativo
    if (touchStart && Math.abs(touchStart - currentTouch) > 10) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const threshold = 30; // Reduzido para 30px para maior sensibilidade
    const isLeftSwipe = distance > threshold;
    const isRightSwipe = distance < -threshold;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }

    // Reset touch values
    setTouchStart(0);
    setTouchEnd(0);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000); // Auto-advance every 5 seconds
    return () => clearInterval(timer);
  }, [nextSlide]);

  const currentItem = publicityItems[currentSlide];
  const IconComponent = currentItem.icon;

  return (
    <div
      className="relative h-60 md:h-72 overflow-hidden rounded-lg border bg-gradient-to-br from-gray-50 to-gray-100"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Card
        className={`h-full bg-gradient-to-br ${currentItem.bgColor} ${currentItem.borderColor} border-2 cursor-grab active:cursor-grabbing`}
      >
        <CardContent className="p-6 md:p-8 h-full flex flex-col justify-center">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-5 bg-white/20 rounded-full">
                <IconComponent className="w-14 h-14 md:w-16 md:h-16 text-current" />
              </div>
            </div>
            <div className="space-y-3">
              <h3
                className={`text-2xl md:text-3xl font-bold ${currentItem.textColor}`}
              >
                {currentItem.title}
              </h3>
              <p
                className={`text-lg md:text-xl ${currentItem.textColor} opacity-90`}
              >
                {currentItem.description}
              </p>
            </div>
          </div>

          {/* Navigation arrows */}
          <div className="absolute top-1/2 left-2 right-2 flex justify-between items-center -translate-y-1/2 pointer-events-none">
            <button
              onClick={prevSlide}
              className="p-2 rounded-full bg-white/50 hover:bg-white/70 transition-colors pointer-events-auto z-10"
              aria-label="Slide anterior"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="p-2 rounded-full bg-white/50 hover:bg-white/70 transition-colors pointer-events-auto z-10"
              aria-label="Próximo slide"
            >
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Slide indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {publicityItems.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "bg-white scale-125 shadow-sm"
                : "bg-white/50 hover:bg-white/70"
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { profileImage } = useProfileImage();
  const { userData } = useUserData();

  // Obter userId do localStorage
  const userId = (userData as any)?.id ?? null;

  // Estado para a seção de impacto
  const [impactSectionVisible, setImpactSectionVisible] = useState(false);
  const impactSectionRef = useRef<HTMLDivElement>(null);

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
      { threshold: 0.1 } // Diminuir o threshold para disparar mais cedo
    );

    observer.observe(current);

    return () => {
      observer.unobserve(current);
    };
  }, []);

  // Fallback: ativar animação após 3 segundos se ainda não foi ativada
  useEffect(() => {
    if (!impactSectionVisible) {
      const timer = setTimeout(() => {
        setImpactSectionVisible(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [impactSectionVisible]);

  const [isEditing, setIsEditing] = useState(false);

  // Estado para controlar o card ativo nas histórias
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Estado para controlar o card ativo dos produtos exclusivos
  // Estados para o carrossel de benefícios
  const [currentBenefitSlide, setCurrentBenefitSlide] = useState(0);
  const benefitScrollContainerRef = useRef<HTMLDivElement>(null);

  // Estado para controlar o Stories viewer
  const [showStories, setShowStories] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  // Estado para controlar o menu lateral de ajuda
  const [showHelpMenu, setShowHelpMenu] = useState(false);

  // Estado para controlar o modal de benefícios
  const [showBeneficiosModal, setShowBeneficiosModal] = useState(false);

  // Estado para controlar o modal de programas
  const [programaAberto, setProgramaAberto] = useState<string | null>(null);

  // Estado para controlar modal Psicossocial
  const [showPsicossocialModal, setShowPsicossocialModal] = useState(false);
  const [expandedPsicoCard, setExpandedPsicoCard] = useState<string | null>(null);

  // Estado para controlar modal Negócios Sociais
  const [showNegociosModal, setShowNegociosModal] = useState(false);
  const [expandedNegocioCard, setExpandedNegocioCard] = useState<string | null>(null);

  // Estado para controlar modal PEC
  const [showPECModal, setShowPECModal] = useState(false);
  const [expandedPECCard, setExpandedPECCard] = useState<string | null>(null);

  // Estado para controlar modal Inclusão Produtiva
  const [showInclusaoModal, setShowInclusaoModal] = useState(false);
  const [expandedInclusaoCard, setExpandedInclusaoCard] = useState<string | null>(null);

  // Estado para controlar modal F3D (Favela 3D)
  const [showF3DModal, setShowF3DModal] = useState(false);
  const [expandedF3DCard, setExpandedF3DCard] = useState<string | null>(null);

  // Buscar dados da Gestão à Vista para todos os programas
  const { data: gestaoVistaData } = useQuery({
    queryKey: ['gestao-vista', 2025, null, null], // Ano todo, sem filtro de mês/programa
    queryFn: () => apiRequest('/api/gestao-vista?ano=2025'),
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

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

  // Buscar dados de PEC
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

  // Buscar dados de Inclusão Produtiva
  const { data: inclusaoData, isLoading: loadingInclusao } = useQuery<{
    projetos: Array<{
      nome: string;
      indicadores: Array<{ nome: string; valor: number; meta: number }>;
    }>;
  }>({
    queryKey: ['/api/inclusao-produtiva/indicadores'],
    enabled: showInclusaoModal,
  });

  // Buscar dados de Favela 3D (F3D)
  const { data: f3dData, isLoading: loadingF3D } = useQuery<{
    meses: string[];
    eixos: Array<{
      nome: string;
      indicadores: Array<{ nome: string; mensal: (number | null)[] }>;
    }>;
  }>({
    queryKey: ['/api/favela-3d/dados-mensais'],
    enabled: showF3DModal,
  });

  // Dados detalhados dos programas (placeholder - será substituído por dados reais futuramente)
  const programasData: Record<string, {
    nome: string;
    cor: string;
    corTexto: string;
    categorias: Array<{
      titulo: string;
      dados: Array<{ label: string; valor: string; }>;
    }>;
  }> = {
    f3d: {
      nome: "F3D",
      cor: "bg-purple-600",
      corTexto: "text-purple-600",
      categorias: [
        {
          titulo: "Decolagem",
          dados: [
            { label: "Famílias atendidas", valor: "89" },
            { label: "Atividades realizadas", valor: "24" },
          ]
        },
        {
          titulo: "Moradia e Urbanismo",
          dados: [
            { label: "Reformas concluídas", valor: "12" },
            { label: "Famílias beneficiadas", valor: "45" },
          ]
        },
        {
          titulo: "Des. Social",
          dados: [
            { label: "Projetos ativos", valor: "8" },
            { label: "Pessoas impactadas", valor: "156" },
          ]
        }
      ]
    },
    pec: {
      nome: "PEC",
      cor: "bg-yellow-400",
      corTexto: "text-yellow-600",
      categorias: [
        {
          titulo: "Alunos por Atividade",
          dados: [
            { label: "Cultura", valor: "42 alunos" },
            { label: "Esporte", valor: "58 alunos" },
            { label: "Contraturno", valor: "120 alunos" },
          ]
        },
        {
          titulo: "Métricas Gerais",
          dados: [
            { label: "Atendimentos", valor: "320" },
            { label: "Refeições servidas", valor: "1.250" },
            { label: "Horas aulas", valor: "850h" },
          ]
        }
      ]
    },
    inclusao: {
      nome: "Inclusão Produtiva",
      cor: "bg-orange-500",
      corTexto: "text-orange-600",
      categorias: [
        {
          titulo: "Cursos por Área",
          dados: [
            { label: "Beleza", valor: "18 alunos" },
            { label: "Manuais", valor: "24 alunos" },
            { label: "Tecnologia", valor: "32 alunos" },
            { label: "Adm. e Operacional", valor: "15 alunos" },
          ]
        },
        {
          titulo: "Resultados",
          dados: [
            { label: "Empregados", valor: "45 pessoas" },
            { label: "Empreendedores", valor: "23 pessoas" },
          ]
        },
        {
          titulo: "Modalidade",
          dados: [
            { label: "Presencial", valor: "58 alunos" },
            { label: "EAD", valor: "31 alunos" },
          ]
        }
      ]
    },
    psicossocial: {
      nome: "Psicossocial",
      cor: "bg-yellow-500",
      corTexto: "text-yellow-600",
      categorias: [
        {
          titulo: "Atividades",
          dados: [
            { label: "Atendimentos", valor: gestaoVistaData?.indicadores?.atendimentos?.valor?.toString() || "324" },
            { label: "Visitas", valor: gestaoVistaData?.indicadores?.visitas?.valor?.toString() || "3174" },
            { label: "Encontros Coletivos", valor: "48" },
          ]
        }
      ]
    },
    negocios: {
      nome: "Negócios Sociais",
      cor: "bg-yellow-600",
      corTexto: "text-yellow-700",
      categorias: [
        {
          titulo: "Outlet",
          dados: [
            { label: "Itens doados", valor: "1.245 itens" },
            { label: "Vendas", valor: "R$ 12.800" },
            { label: "Pessoas impactadas", valor: "89" },
          ]
        },
        {
          titulo: "Griffte",
          dados: [
            { label: "Peças confeccionadas", valor: "156 peças" },
            { label: "Clientes atendidos", valor: "67" },
          ]
        }
      ]
    }
  };

  // Hook para buscar histórias inspiradoras do banco de dados
  const { data: historiasInspiradoras = [], isLoading: loadingHistorias } =
    useQuery<any[]>({
      queryKey: ["/api/historias-inspiradoras"],
      // Removido refetchInterval para evitar polling constante
    });

  // Função para tratar URLs de imagens
  const processImageUrl = (url: string) => {
    if (!url) return "/api/placeholder/300/400";

    // Se for URL do Google Drive, converter para formato direto
    if (url.includes("drive.google.com")) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (fileIdMatch) {
        return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
      }
    }

    // Se for URL do object storage ou qualquer outra URL, usar como está
    return url;
  };

  // Função para quebrar texto longo em múltiplos slides - cortando em pontos finais
  const splitTextIntoSlides = (
    text: string,
    maxChars: number = 600
  ): string[] => {
    if (text.length <= maxChars) return [text];

    const slides: string[] = [];
    let currentText = text;

    while (currentText.length > maxChars) {
      // Procurar o último ponto final antes do limite
      let cutPoint = currentText.lastIndexOf(".", maxChars);

      // Se não encontrar ponto final, procurar exclamação ou interrogação
      if (cutPoint === -1) {
        cutPoint = Math.max(
          currentText.lastIndexOf("!", maxChars),
          currentText.lastIndexOf("?", maxChars)
        );
      }

      // Se ainda não encontrar nenhuma pontuação, procurar último espaço
      if (cutPoint === -1) {
        cutPoint = currentText.lastIndexOf(" ", maxChars);
      }

      // Se não encontrar nem espaço, cortar no limite mesmo
      if (cutPoint === -1) cutPoint = maxChars;

      // Adicionar 1 para incluir a pontuação no slide atual
      if (
        cutPoint < maxChars &&
        (currentText[cutPoint] === "." ||
          currentText[cutPoint] === "!" ||
          currentText[cutPoint] === "?")
      ) {
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

    return historias.map((historia) => {
      const processedImageBox = processImageUrl(historia.imagemBox);
      const processedImageStory = processImageUrl(historia.imagemStory);
      const texto =
        historia.texto ||
        `A história de ${
          historia.nome || historia.titulo
        } é uma demonstração real de como o Clube do Grito transforma vidas. Cada doação contribui para mudanças significativas na comunidade.`;
      const textSlides = splitTextIntoSlides(texto, 600); // Limite de 600 caracteres por slide

      const slides: any[] = [
        {
          id: `${historia.id}_1`,
          type: "image" as const,
          image: processedImageStory, // Usar imagem do story para o story completo
          title: historia.titulo,
          duration: 5,
        },
      ];

      // Adicionar slides de texto baseados na quebra
      textSlides.forEach((textPart, index) => {
        slides.push({
          id: `${historia.id}_text_${index + 1}`,
          type: "text" as const,
          content: textPart,
          backgroundColor: "#FFD700",
          duration: 6,
        });
      });

      return {
        id: historia.id.toString(),
        title: historia.titulo,
        name: historia.nome || historia.titulo,
        image: processedImageBox, // Usar imagem do box para os cards
        slides,
      };
    });
  };

  // Removido: histórias mock para exibir apenas histórias reais do banco

  // Usar dados reais do banco ou fallback para mock
  const finalStories = convertToStories(historiasInspiradoras);

  // Função para abrir stories
  const openStories = (storyIndex: number) => {
    setSelectedStoryIndex(storyIndex);
    setShowStories(true);
  };

  const [isLoading, setIsLoading] = useState(() => {
    // Só mostra loading na primeira vez da sessão
    return !sessionStorage.getItem("hasLoadedDashboard");
  });

  // Função para navegar entre os cards das histórias
  const scrollToStory = (index: number) => {
    setActiveStoryIndex(index);
    if (scrollContainerRef.current) {
      const cardWidth = 320; // largura do card
      const spacing = 16; // espaço entre cards (space-x-4 = 1rem = 16px)
      const scrollPosition = (cardWidth + spacing) * index;
      scrollContainerRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
    }
  };

  // Detectar scroll manual e atualizar indicador ativo
  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const scrollLeft = scrollContainerRef.current.scrollLeft;
        const cardWidth = 320;
        const spacing = 16;
        const currentIndex = Math.round(scrollLeft / (cardWidth + spacing));
        setActiveStoryIndex(Math.max(0, Math.min(2, currentIndex)));
      }
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const form = useForm<UpdateUserForm>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      nome: "",
      telefone: "",
    },
  });

  useEffect(() => {
    // ⭐ PRIORIDADE 1: Verificar se é acesso via dev panel PRIMEIRO
    const urlParams = new URLSearchParams(window.location.search);
    const isDevAccess = urlParams.get("dev_access") === "true";
    const isFromDevPanel = urlParams.get("origin") === "dev_panel";
    const devPanelActive = localStorage.getItem("dev_panel_active") === "true";
    const devPanelTimestamp = localStorage.getItem("dev_panel_timestamp");
    const isRecentDevPanel =
      devPanelTimestamp && Date.now() - parseInt(devPanelTimestamp) < 60000;

    // Se é acesso dev, desativar loading IMEDIATAMENTE sem esperar userData
    if (
      (isDevAccess && isFromDevPanel) ||
      (devPanelActive && isRecentDevPanel)
    ) {
      console.log(
        "✅ [WELCOME DEV] Acesso dev detectado - desativando loading"
      );
      setIsLoading(false);
      sessionStorage.setItem("hasLoadedDashboard", "true");
      return; // RETORNA AQUI - não executa o resto
    }

    // Check if user is verified (apenas para acesso normal)
    const isVerified = localStorage.getItem("isVerified");
    if (!isVerified) {
      setLocation("/");
      return;
    }

    // Initialize form with userData when it's loaded (apenas para acesso normal)
    if (userData.nome || userData.telefone) {
      form.reset({
        nome: userData.nome,
        telefone: userData.telefone,
      });

      // Desativar loading quando os dados carregarem
      if (isLoading) {
        setTimeout(() => {
          setIsLoading(false);
          sessionStorage.setItem("hasLoadedDashboard", "true");
        }, 1500); // 1.5 segundos para mostrar a logo
      }
    }
  }, [userData, setLocation, form, isLoading]); // Adicionado isLoading de volta

  const { updateUserData } = useUserData();

  const onSubmit = async (data: UpdateUserForm) => {
    try {
      await updateUserData({
        nome: data.nome.split(" ")[0] || data.nome,
        sobrenome: data.nome.split(" ").slice(1).join(" ") || "",
        telefone: data.telefone,
        email: userData.email,
        plano: userData.plano,
      });

      setIsEditing(false);
      toast({
        title: "Dados atualizados",
        description: "Suas informações foram atualizadas com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar dados. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const planDisplayNames = {
    eco: "Eco",
    voz: "Voz",
    grito: "O Grito",
    platinum: "Platinum",
  };

  const planPrice =
    planPrices[userData.plano as keyof typeof planPrices]?.mensal?.display || "R$ 9,90";

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const calculateTotalDonations = () => {
    // Calcular baseado em um período padrão de 3 meses (exemplo)
    const monthsDiff = 3;
    const planValue =
      planPrices[userData.plano as keyof typeof planPrices]?.mensal?.price ||
      990;
    const hour = new Date().getHours();
    if (hour < 18) return "boa tarde";
    return "boa noite";
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "bom dia";
    if (hour < 18) return "boa tarde";
    return "boa noite";
  };

  // 🎯 BENEFÍCIOS DINÂMICOS DA API - Mesma lógica da página de benefícios
  const { data: beneficios = [], isLoading: beneficiosLoading } = useQuery<
    Beneficio[]
  >({
    queryKey: ["/api/beneficios"],
    retry: 1,
  });

  // 🎯 DADOS DE IMPACTO - Buscar dados reais de Meta vs Realizado
  const { data: impactData } = useQuery<any>({
    queryKey: ['/api/gestao-vista/meta-realizado', { scope: 'annual', period: '2025' }],
    queryFn: () => apiRequest('/api/gestao-vista/meta-realizado?scope=annual&period=2025'),
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  // 👶 CRIANÇAS ATENDIDAS - Endpoint específico que soma último mês de cada projeto
  const { data: criancasAtendidasData } = useQuery<any>({
    queryKey: ['/api/criancas-atendidas'],
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  // 📊 DADOS DEMOGRÁFICOS - Para os gráficos de pizza
  const { data: dadosDemograficos, isLoading: loadingDemograficos } = useQuery<any>({
    queryKey: ['/api/demograficos'],
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  // Cores para os gráficos - Tons de Amarelo e Laranja
  const COLORS_RACA = ['#FFD700', '#FFC107', '#FF9800', '#F97316']; // Amarelo ouro → Âmbar → Laranja médio → Laranja escuro
  const COLORS_GENERO = ['#FFD700', '#FF9800', '#FF6B00']; // Amarelo → Laranja médio → Laranja
  const COLORS_IDADE = ['#FFD700', '#FFC107', '#FF9800', '#FF6B00', '#F97316']; // Gradiente completo de amarelo a laranja

  // Processar dados de impacto: buscar indicadores específicos
  const programasImpacto = (() => {
    if (!impactData?.data || impactData.data.length === 0) {
      return [];
    }

    // Indicadores específicos que o usuário quer exibir (nomes exatos da API)
    const indicadoresDesejados = [
      { buscar: ["Alunos Formados"], exibir: "Alunos formados", cor: "#10b981" }, // verde
      { buscar: ["Quantidade de Alunos"], exibir: "Crianças atendidas", cor: "#3b82f6", useCustomEndpoint: true }, // azul - usa endpoint específico
      { 
        buscar: ["Alunos Ativos", "Quantidade de Alunos"], 
        exibir: "Alunos em Formação", 
        cor: "#ec4899", 
        somarTodos: true,
        projetos: ["CURSOS EAD CGD", "LAB. VOZES DO FUTURO"] // Filtrar por nome do projeto
      }, // rosa - soma Cursos EAD + Lab
      { buscar: ["Empregabilidade", "Taxa de Empregabilidade"], exibir: "Empregabilidade", cor: "#f59e0b", somarTodos: true }, // amarelo - soma Inclusão Produtiva + F3D
      { buscar: ["Famílias Ativas"], exibir: "Famílias Ativas da F3D", cor: "#8b5cf6" } // roxo
    ];

    // Buscar cada indicador e retornar quantidade realizada (não porcentagem)
    const programas = indicadoresDesejados
      .map(indicador => {
        // CRIANÇAS ATENDIDAS: Usar endpoint específico
        if (indicador.useCustomEndpoint && criancasAtendidasData?.success) {
          return {
            nome: indicador.exibir,
            quantidade: criancasAtendidasData.total,
            meta: criancasAtendidasData.meta || 600,
            porcentagem: criancasAtendidasData.porcentagem,
            cor: indicador.cor
          };
        }
        
        // LÓGICA PADRÃO: Pegar o item com maior realizado OU somar todos
        const items = impactData.data.filter((d: any) => {
          // Se tem projetos específicos, filtrar por indicador E projeto
          if (indicador.projetos && indicador.projetos.length > 0) {
            return indicador.buscar.some(busca => d.indicador_nome === busca) &&
                   indicador.projetos.includes(d.projeto_nome);
          }
          // Senão, usar apenas nomes dos indicadores
          return indicador.buscar.some(busca => d.indicador_nome === busca);
        });
        
        if (items.length > 0) {
          // Se somarTodos=true, somar todos os valores encontrados (evitando duplicatas)
          if (indicador.somarTodos) {
            // Usar Map para agrupar por nome do indicador e evitar duplicatas
            const valoresPorIndicador = new Map<string, number>();
            
            items.forEach((item: any) => {
              const chave = item.indicador_nome;
              const valorAtual = valoresPorIndicador.get(chave) || 0;
              const novoValor = item.realizado || 0;
              
              // Manter o maior valor para cada indicador (evita duplicatas)
              if (novoValor > valorAtual) {
                valoresPorIndicador.set(chave, novoValor);
              }
            });
            
            const totalRealizado = Array.from(valoresPorIndicador.values()).reduce((sum, val) => sum + val, 0);
            const totalMeta = items.reduce((sum: number, item: any) => sum + (item.meta || 0), 0);
            // Se meta for 0 mas tem realizado, mostrar 100% (barra completa)
            const porcentagem = totalMeta > 0 ? (totalRealizado / totalMeta) * 100 : (totalRealizado > 0 ? 100 : 0);
            
            return {
              nome: indicador.exibir,
              quantidade: Math.round(totalRealizado),
              meta: Math.round(totalMeta),
              porcentagem: Math.round(porcentagem),
              cor: indicador.cor
            };
          }
          
          // Senão, pegar o item com maior realizado (evita os zerados)
          const item = items.reduce((max: any, curr: any) => {
            return (curr.realizado || 0) > (max?.realizado || 0) ? curr : max;
          }, null);
          
          if (item) {
            // Se meta for 0 mas tem realizado, mostrar 100% (barra completa)
            const porcentagem = item.atingimento_percentual || (item.meta > 0 ? 0 : (item.realizado > 0 ? 100 : 0));
            
            return {
              nome: indicador.exibir,
              quantidade: Math.round(item.realizado || 0),
              meta: Math.round(item.meta || 100),
              porcentagem: Math.round(porcentagem),
              cor: indicador.cor
            };
          }
        }

        return null;
      })
      .filter(
        (
          p
        ): p is {
          nome: string;
          quantidade: number;
          meta: number;
          porcentagem: number;
          cor: string;
        } => p !== null
      );

    return programas;
  })();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <Logo size="lg" className="mx-auto" />
          </div>
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

              {/* Badge - Doador */}
              {userId && (
                <>
                  <DonorNumberBadge userId={userId} />
                </>
              )}

              {/* Badge do Plano */}
              <div className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full flex items-center space-x-1">
                <span>
                  {planDisplayNames[
                    userData.plano as keyof typeof planDisplayNames
                  ] || "Eco"}
                </span>
                <span className="text-orange-500">◆</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-4 md:px-8 md:py-8">
        {/* 1. Saudação personalizada */}
        <div className="mb-4 md:mb-6 -mt-4">
          <h2 className="text-xl md:text-2xl font-bold text-black mb-1">
            Fala {(userData?.nome === "Influencer" || (userData as any)?.id === 142) ? "Grito" : (userData.nome?.split(" ")[0] || "Doador")}, {getGreeting()}!
          </h2>
        </div>

        {/* 2. Banner amarelo */}
        <div className="mb-6 py-4 px-6 bg-yellow-400 -mx-4 md:-mx-8 flex items-center justify-between">
          {/* Lado Esquerdo: Textos */}
          <div className="flex flex-col">
            <p className="text-black text-xs font-normal mb-1">
              Você já faz a diferença.
            </p>
            <h3 className="text-black text-xl font-bold">Quer ir além?</h3>
          </div>

          {/* Lado Direito: Botão */}
          <button
            className="bg-black text-white px-5 py-2 rounded-full font-medium hover:bg-gray-800 transition-colors cursor-pointer text-sm"
            onClick={() => setLocation("/change-plan")}
          >
            Quero dar o próximo passo
          </button>
        </div>

        {/* 4. Seus Prêmios */}
        <div className="mb-6">
          {/* Título da seção com botão "Ver tudo" */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800 text-left">
              Seus Prêmios
            </h3>
            <button
              onClick={() => setShowBeneficiosModal(true)}
              className="text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors"
              data-testid="button-ver-tudo"
            >
              Ver tudo
            </button>
          </div>

          {/* Container de rolagem horizontal - mesmo da página de benefícios */}
          {!beneficiosLoading && (
            <div
              ref={benefitScrollContainerRef}
              className="overflow-x-auto pb-4 -mx-4 md:-mx-8"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              onScroll={() => {
                if (benefitScrollContainerRef.current) {
                  const scrollLeft =
                    benefitScrollContainerRef.current.scrollLeft;
                  const cardWidth = 336; // 320px width + 16px margin
                  const currentIndex = Math.round(scrollLeft / cardWidth);
                  setCurrentBenefitSlide(
                    Math.min(currentIndex, beneficios.length - 1)
                  );
                }
              }}
            >
              <div
                className="flex space-x-4 px-4 md:px-8"
                style={{ width: "fit-content" }}
              >
                {beneficios.length > 0 ? (
                  beneficios.map((beneficio, index) => (
                    <motion.div
                      key={beneficio.id}
                      className="relative flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 cursor-pointer"
                      style={{
                        width: "320px",
                        height: "180px",
                      }}
                      onClick={() =>
                        setLocation(`/beneficio-detalhes/${beneficio.id}`)
                      }
                      whileHover={{
                        scale: 1.05,
                        rotateY: 5,
                        boxShadow: "0 25px 50px rgba(0, 0, 0, 0.3)",
                      }}
                      whileTap={{
                        scale: 0.95,
                        rotateY: -2,
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        ease: "easeOut",
                        delay: index * 0.1,
                      }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.2}
                      onDragEnd={(event, info) => {
                        const threshold = 50;
                        if (
                          info.offset.x > threshold &&
                          currentBenefitSlide > 0
                        ) {
                          // Scroll para a esquerda
                          const newIndex = currentBenefitSlide - 1;
                          benefitScrollContainerRef.current?.scrollTo({
                            left: newIndex * 336,
                            behavior: "smooth",
                          });
                        } else if (
                          info.offset.x < -threshold &&
                          currentBenefitSlide < beneficios.length - 1
                        ) {
                          // Scroll para a direita
                          const newIndex = currentBenefitSlide + 1;
                          benefitScrollContainerRef.current?.scrollTo({
                            left: newIndex * 336,
                            behavior: "smooth",
                          });
                        }
                      }}
                    >
                      {/* Imagem de fundo se houver - Otimizada para cards pequenos */}
                      { beneficio.imagem && (
                        <img 
                          src={beneficio.imagem}
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
                            const img = e.target as HTMLImageElement;
                            img.style.display = 'none';
                          }}
                        />
                      )}

                      {/* Overlay escuro para melhor legibilidade */}
                      <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>

                      {/* Conteúdo do card */}
                      <div className="relative h-full p-6 text-black flex justify-between items-start">
                        {/* Lado esquerdo - Conteúdo */}
                        <div className="flex-1 flex flex-col justify-between h-full max-w-[60%]">
                          <div>
                            <h4 className="font-bold text-lg mb-3 leading-tight text-black">
                              {beneficio.titulo}
                            </h4>

                            {beneficio.pontosNecessarios && (
                              <div className="flex items-center space-x-2 mb-3">
                                <div className="bg-black/10 text-black px-2 py-1 rounded text-xs font-medium flex items-center">
                                  <span className="mr-1">📎</span>
                                  {beneficio.pontosNecessarios}
                                </div>
                              </div>
                            )}
                          </div>

                          {beneficio.planosDisponiveis &&
                            beneficio.planosDisponiveis.length > 0 && (
                              <div className="mt-auto">
                                <div className="text-sm font-medium bg-black/10 text-black px-3 py-1 rounded-full inline-block">
                                  {beneficio.planosDisponiveis
                                    .map(
                                      (plano) =>
                                        plano.charAt(0).toUpperCase() +
                                        plano.slice(1)
                                    )
                                    .join("\\")}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="w-full text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <DynamicIcon
                        iconName="Package"
                        className="w-12 h-12 mx-auto"
                      />
                    </div>
                    <p className="text-gray-500 text-sm">
                      Nenhum prêmio disponível no momento
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Indicadores de navegação (pontinhos) */}
          {!beneficiosLoading && beneficios.length > 1 && (
            <div className="flex justify-center space-x-2 mt-4">
              {beneficios.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    benefitScrollContainerRef.current?.scrollTo({
                      left: index * 336,
                      behavior: "smooth",
                    });
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentBenefitSlide
                      ? "bg-gray-800 scale-125"
                      : "bg-gray-300 hover:bg-gray-500"
                  }`}
                  whileHover={{ scale: 1.5 }}
                  whileTap={{ scale: 0.8 }}
                  aria-label={`Ir para prêmio ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* 5. Seção Com seu apoio, o impacto é imenso! - Cards de Programas */}
        <div ref={impactSectionRef} className="mb-6 px-4">
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

        {/* Modal de Indicadores Psicossocial */}
        <Dialog open={showPsicossocialModal} onOpenChange={setShowPsicossocialModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Heart className="w-6 h-6 text-yellow-600" />
                Indicadores Psicossocial
              </DialogTitle>
            </DialogHeader>
            
            <p className="text-sm text-gray-500 mt-1">Dados Anuais 2025</p>
            
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
                          {/* Card Visitas Domiciliares */}
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <div className="text-3xl font-bold text-yellow-600 mb-1">
                              {atencaoSocialData?.data.visitasDomiciliares.realizadas}
                            </div>
                            <p className="text-xs text-gray-700 font-medium mb-1">Visitas Domiciliares</p>
                            <p className="text-xs text-gray-500">
                              {atencaoSocialData?.data.visitasDomiciliares.percentual}% da Meta 2025
                            </p>
                          </div>

                          {/* Card Atendimentos Individuais */}
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
                          {/* Card Atendimentos Coletivos */}
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <div className="text-3xl font-bold text-yellow-600 mb-1">
                              {metodoGritoData?.data.atendimentosColetivos.realizados.toLocaleString('pt-BR')}
                            </div>
                            <p className="text-xs text-gray-700 font-medium mb-1">Atendimentos Coletivos</p>
                            <p className="text-xs text-gray-500">
                              {metodoGritoData?.data.atendimentosColetivos.percentualTurmas}% das turmas
                            </p>
                          </div>

                          {/* Card Espaços Coletivos */}
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <div className="text-3xl font-bold text-yellow-600 mb-1">
                              {metodoGritoData?.data.espacosColetivos.total}
                            </div>
                            <p className="text-xs text-gray-700 font-medium mb-1">#EspaçoOgrito</p>
                            <p className="text-xs text-gray-500">
                              {metodoGritoData?.data.espacosColetivos.percentual}% da Meta 2025
                            </p>
                          </div>

                          {/* Card Caravana Comunitária */}
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <div className="text-3xl font-bold text-yellow-600 mb-1">
                              {metodoGritoData?.data.caravanasComunitarias}
                            </div>
                            <p className="text-xs text-gray-700 font-medium">Caravana Comunitária</p>
                          </div>

                          {/* Card Ações de Saúde */}
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
            
            <p className="text-sm text-gray-500 mt-1">Dados Anuais 2025</p>
            
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
                      <h3 className="text-lg font-bold text-gray-800">Outlet</h3>
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
                          {/* Doações Recebidas */}
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1">
                              {negociosSociaisData?.data.outlet.doacoesRecebidas.toLocaleString('pt-BR')}
                            </div>
                            <p className="text-xs text-gray-700 font-medium">Doações Recebidas</p>
                          </div>

                          {/* Vendas - Pessoas Impactadas */}
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1">
                              {negociosSociaisData?.data.outlet.vendasPessoasImpactadas.toLocaleString('pt-BR')}
                            </div>
                            <p className="text-xs text-gray-700 font-medium">Vendas - Pessoas Impactadas</p>
                          </div>

                          {/* Peças Vendidas */}
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
                      <h3 className="text-lg font-bold text-gray-800">Griffte</h3>
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
                          {/* Peças Confeccionadas */}
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1">
                              {negociosSociaisData?.data.griffte.pecasConfeccionadas.toLocaleString('pt-BR')}
                            </div>
                            <p className="text-xs text-gray-700 font-medium">Peças Confeccionadas</p>
                          </div>

                          {/* Clientes Atendidos */}
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

        {/* Modal de PEC */}
        <Dialog open={showPECModal} onOpenChange={setShowPECModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-yellow-600" />
                PEC
              </DialogTitle>
            </DialogHeader>
            
            <p className="text-sm text-gray-500 mt-1">Dados Anuais 2025</p>
            
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
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <div className="text-3xl font-bold text-yellow-600 mb-1">
                              {pecData?.data.casaSonhar.horaAula.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-gray-700 font-medium">Hora-Aula</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm" data-testid="card-evasao-casa-sonhar">
                            <div className="text-3xl font-bold text-red-500 mb-1">
                              {pecData?.data.casaSonhar.evasao || 0}
                            </div>
                            <p className="text-xs text-gray-700 font-medium">Evasão (alunos)</p>
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
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <div className="text-3xl font-bold text-yellow-600 mb-1">
                              {pecData?.data.programaEsporteCultura.horaAula.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-gray-700 font-medium">Hora-Aula</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm" data-testid="card-evasao-esporte-cultura">
                            <div className="text-3xl font-bold text-red-500 mb-1">
                              {pecData?.data.programaEsporteCultura.evasao || 0}
                            </div>
                            <p className="text-xs text-gray-700 font-medium">Evasão (alunos)</p>
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
                        <Music className="w-5 h-5 text-white" />
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
            
            <p className="text-sm text-gray-500 mt-1">Dados Anuais 2025</p>
            
            <div className="space-y-4 mt-4">
              {loadingInclusao ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : inclusaoData?.projetos ? (
                inclusaoData.projetos.map((projeto, index) => {
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
                })
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
            
            <p className="text-sm text-gray-500 mt-1">Dados Anuais 2025</p>
            
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

        {/* 6. Seção Check-in - Componente unificado */}
        <CheckinCard 
          userId={userId} 
          onCheckinComplete={() => {
            // Recarregar dados do usuário após check-in
            queryClient.invalidateQueries({ queryKey: ['/api/user', userId] });
            queryClient.invalidateQueries({ queryKey: ['checkin-status', userId] });
          }} 
        />

        {/* 7. Missão da Semana */}
        <motion.div
          className="relative mx-auto mb-[10px] bg-transparent cursor-pointer"
          style={{ width: "338px", height: "156px" }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          whileHover={{
            scale: 1.02,
            transition: { duration: 0.2 },
          }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setLocation("/missoes-semanais")}
        >
          {/* Card principal com sombra */}
          <motion.div
            style={{
              backgroundImage: 'url("/attached_assets/BG_1756832442490.png")',
              backgroundSize: "cover",
              backgroundPosition: "center",
              width: "338px",
              height: "156px",
              borderRadius: "20px",
            }}
            className="relative overflow-visible"
          >
            {/* Conteúdo do card - textos à esquerda */}
            <div
              className="absolute left-0 top-0 z-30 p-6 flex flex-col justify-center h-full"
              style={{ width: "200px" }}
            >
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
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
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
                    transition: { duration: 0.2 },
                  }}
                >
                  Semana
                </motion.h3>
              </div>
            </div>
          </motion.div>

          {/* Imagem das moedas sobreposta - fora do card */}
          <motion.div
            className="absolute"
            style={{
              right: "-20px",
              top: "-10px",
              zIndex: 20,
            }}
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.7,
              type: "spring",
              bounce: 0.4,
            }}
            whileHover={{
              rotate: [0, -5, 5, 0],
              scale: 1.1,
              transition: { duration: 0.6 },
            }}
          >
            {/* Imagem das moedas */}
            <motion.img
              src="/attached_assets/image (7)_1756832872920.png"
              alt="Moedas empilhadas"
              className="relative z-10"
              style={{ width: "160px", height: "160px", objectFit: "contain" }}
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Efeito de brilho nas moedas */}
            <motion.div
              className="absolute inset-0 rounded-full opacity-30"
              style={{
                background:
                  "radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%)",
                width: "160px",
                height: "160px",
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        </motion.div>

        {/* 9. Histórias que Inspiram */}
        <div className="mb-6">
          {/* Título da seção */}
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-left">
            Histórias que Inspiram
          </h3>

          {/* Container de rolagem horizontal */}
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto pb-4 -mx-4 md:-mx-8"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div
              className="flex space-x-4 px-4 md:px-8"
              style={{ width: "fit-content" }}
            >
              {/* Renderizar cards dinamicamente baseado nos dados do banco */}
              {finalStories.map((story, index) => (
                <div
                  key={story.id}
                  onClick={() => openStories(index)}
                  className="relative flex-shrink-0 overflow-hidden rounded-2xl shadow-lg cursor-pointer hover:scale-[1.02] transition-transform duration-200"
                  style={{
                    width: "320px",
                    height: "180px",
                    backgroundImage: `url("/api/historias-inspiradoras/${
                      story.id
                    }/imagem?tipo=box"), url(${JSON.stringify(
                      story.image ||
                        "https://images.unsplash.com/photo-1494790108755-2616c943f671?w=400&h=200&fit=crop&crop=face"
                    )})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
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

          {/* Indicadores de navegação (pontinhos) */}
          <div className="flex justify-center space-x-2 mt-4">
            {finalStories.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToStory(index)}
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  activeStoryIndex === index
                    ? "bg-gray-800"
                    : "bg-gray-300 hover:bg-gray-500"
                }`}
                aria-label={`Ir para história ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* 10. Indique e Ganhe - DESATIVADO (descomentar para reativar)
        <div className="mb-6">
          <IndiqueGanhe />
        </div>
        */}

        {/* Modal de edição */}
        {isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Editar Dados</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Digite seu nome" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="(00) 00000-0000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1">
                        Salvar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <BottomNavigation hidden={showStories} />

      {/* Stories Viewer */}
      {showStories && (
        <StoriesViewer
          stories={finalStories}
          initialStoryIndex={selectedStoryIndex}
          onClose={() => setShowStories(false)}
        />
      )}

      {/* Modal de Benefícios */}
      {showBeneficiosModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Todos os Seus Prêmios
                </h2>
                <button
                  onClick={() => setShowBeneficiosModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-light"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {beneficiosLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 h-48 rounded-xl mb-4"></div>
                      <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                      <div className="bg-gray-200 h-3 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : beneficios.length > 0 ? (
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
                      style={{ height: "200px" }}
                    >
                      {/* Imagem de fundo se houver */}
                      {beneficio.imagemUrl && (
                        <img
                          src={beneficio.imagemUrl}
                          alt={beneficio.titulo}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = "none";
                          }}
                        />
                      )}

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/30"></div>

                      {/* Conteúdo */}
                      <div className="relative h-full p-4 text-white flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-lg mb-2 leading-tight">
                            {beneficio.titulo}
                          </h3>
                          {beneficio.pontosNecessarios && (
                            <div className="bg-white/20 text-white px-2 py-1 rounded text-xs font-medium inline-flex items-center">
                              <span className="mr-1">📎</span>
                              {beneficio.pontosNecessarios}
                            </div>
                          )}
                        </div>

                        {beneficio.planosDisponiveis &&
                          beneficio.planosDisponiveis.length > 0 && (
                            <div className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full mt-2">
                              {beneficio.planosDisponiveis
                                .map(
                                  (plano: string) =>
                                    plano.charAt(0).toUpperCase() +
                                    plano.slice(1)
                                )
                                .join("/")}
                            </div>
                          )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Gift className="w-16 h-16 mx-auto" />
                  </div>
                  <p className="text-gray-500 text-lg mb-2">
                    Nenhum prêmio disponível
                  </p>
                  <p className="text-gray-400 text-sm">
                    Novos prêmios serão adicionados em breve!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
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
                <h2 className="text-xl font-semibold text-black">
                  Fala {(userData?.nome === "Influencer" || (userData as any)?.id === 142) ? "Grito" : (userData.nome?.split(" ")[0] || "Doador")}, tudo bem?
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
                    setTimeout(() => setLocation("/perfil"), 150);
                  }}
                >
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold text-gray-900 text-base"
                      style={{
                        fontFamily:
                          "SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
                      }}
                    >
                      Perfil
                    </h3>
                    <p
                      className="text-sm text-gray-600 mt-1 leading-relaxed"
                      style={{
                        fontFamily:
                          "SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
                      }}
                    >
                      Mostre quem você é nessa jornada.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
                <div className="border-b border-gray-100 mx-4"></div>
              </div>

              {/* Administrador - Apenas para Leo Martins */}
              {(() => {
                // Verificar se é Leo por email OU telefone
                const isLeoByEmail = isLeoMartins(userData.email || '');
                const normalizedPhone = (userData.telefone || '').replace(/\D/g, '');
                // Telefones do Leo: 31998783003, 31987830003, 31993741556
                const isLeoByPhone = normalizedPhone === '31998783003' || 
                                     normalizedPhone === '5531998783003' ||
                                     normalizedPhone === '31987830003' || 
                                     normalizedPhone === '5531987830003' ||
                                     normalizedPhone === '31993741556' ||
                                     normalizedPhone === '5531993741556';
                const isLeo = isLeoByEmail || isLeoByPhone;
                
                console.log('🔍 [LEO CHECK] Email:', userData.email, 'isLeoByEmail:', isLeoByEmail);
                console.log('🔍 [LEO CHECK] Phone:', userData.telefone, 'normalized:', normalizedPhone, 'isLeoByPhone:', isLeoByPhone);
                console.log('🔍 [LEO CHECK] Final isLeo:', isLeo);
                
                return isLeo;
              })() && (
                <div>
                  <div
                    className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-purple-50"
                    onClick={() => {
                      setShowHelpMenu(false);
                      setTimeout(() => setLocation("/administrador"), 150);
                    }}
                  >
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-semibold text-gray-900 text-base"
                        style={{
                          fontFamily:
                            "SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
                        }}
                      >
                        Administrador
                      </h3>
                      <p
                        className="text-sm text-gray-600 mt-1 leading-relaxed"
                        style={{
                          fontFamily:
                            "SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
                        }}
                      >
                        Painel executivo e gestão institucional.
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                  <div className="border-b border-gray-100 mx-4"></div>
                </div>
              )}

              {/* Benefícios */}
              <div>
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                  onClick={() => {
                    setShowHelpMenu(false);
                    const hasCompletedOnboarding = localStorage.getItem(
                      "viuBoasVindasBeneficios"
                    );
                    if (hasCompletedOnboarding) {
                      setTimeout(() => setLocation("/beneficios"), 150);
                    } else {
                      setTimeout(
                        () => setLocation("/beneficios-onboarding"),
                        150
                      );
                    }
                  }}
                >
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <Gift className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold text-gray-900 text-base"
                      style={{
                        fontFamily:
                          "SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
                      }}
                    >
                      Benefícios
                    </h3>
                    <p
                      className="text-sm text-gray-600 mt-1 leading-relaxed"
                      style={{
                        fontFamily:
                          "SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
                      }}
                    >
                      Vantagens que transformam seu dia a dia e o de muitos
                      outros.
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
                    <h3
                      className="font-semibold text-gray-900 text-base"
                      style={{
                        fontFamily:
                          "SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
                      }}
                    >
                      Financeiro
                    </h3>
                    <p
                      className="text-sm text-gray-600 mt-1 leading-relaxed"
                      style={{
                        fontFamily:
                          "SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
                      }}
                    >
                      Transparência para você ver seu impacto.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
                <div className="border-b border-gray-100 mx-4"></div>
              </div>

              {/* Administrador - Apenas para o Leo */}
              {(() => {
                console.log(
                  "🔍 [WELCOME] userData.role:",
                  userData.role,
                  "isLeo:",
                  userData.role === "leo"
                );
                return userData.role === "leo";
              })() && (
                <div>
                  <div
                    className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                    onClick={() => {
                      setShowHelpMenu(false);
                      setTimeout(() => setLocation("/administrador"), 150);
                    }}
                  >
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-semibold text-gray-900 text-base"
                        style={{
                          fontFamily:
                            "SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
                        }}
                      >
                        Administrador
                      </h3>
                      <p
                        className="text-sm text-gray-600 mt-1 leading-relaxed"
                        style={{
                          fontFamily:
                            "SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
                        }}
                      >
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
                    setTimeout(
                      () => setLocation("/termos-servicos?from=help"),
                      150
                    );
                  }}
                >
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold text-gray-900 text-base"
                      style={{
                        fontFamily:
                          "SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
                      }}
                    >
                      Termos de Uso
                    </h3>
                    <p
                      className="text-sm text-gray-600 mt-1 leading-relaxed"
                      style={{
                        fontFamily:
                          "SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
                      }}
                    >
                      Segurança e clareza em cada passo.
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
                >
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <ExternalLink className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold text-gray-900 text-base"
                      style={{
                        fontFamily:
                          "SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
                      }}
                    >
                      Canal de Transparência
                    </h3>
                    <p
                      className="text-sm text-gray-600 mt-1 leading-relaxed"
                      style={{
                        fontFamily:
                          "SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
                      }}
                    >
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
                    setShowHelpMenu(false);
                    toast({
                      title: "Saindo da conta",
                      description: "Você será desconectado...",
                    });
                    localStorage.clear();
                    sessionStorage.clear();
                    setTimeout(() => (window.location.href = "/entrar"), 1000);
                  }}
                >
                  <LogOut className="w-6 h-6 text-gray-700 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold text-gray-900 text-base"
                      style={{
                        fontFamily:
                          "SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
                      }}
                    >
                      Deslogar
                    </h3>
                    <p
                      className="text-sm text-gray-600 mt-1 leading-relaxed"
                      style={{
                        fontFamily:
                          "SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
                      }}
                    >
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

      {/* Modal de Dados dos Programas */}
      <Dialog open={programaAberto !== null} onOpenChange={(open) => !open && setProgramaAberto(null)}>
        <DialogContent className="max-w-md rounded-2xl max-h-[80vh] overflow-y-auto">
          {programaAberto && programasData[programaAberto] && (
            <>
              <DialogHeader>
                <DialogTitle className={`text-2xl font-bold font-sans ${programasData[programaAberto].corTexto}`}>
                  {programasData[programaAberto].nome}
                </DialogTitle>
              </DialogHeader>
            
            <p className="text-sm text-gray-500 mt-1">Dados Anuais 2025</p>

              {/* Categorias e Dados */}
              <div className="mt-4 space-y-6">
                {programasData[programaAberto].categorias.map((categoria, catIndex) => (
                  <div key={catIndex} className="space-y-3">
                    {/* Título da Categoria */}
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      {categoria.titulo}
                    </h3>
                    
                    {/* Lista de Dados */}
                    <div className="space-y-2">
                      {categoria.dados.map((dado, dadoIndex) => (
                        <div 
                          key={dadoIndex}
                          className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          data-testid={`dado-${catIndex}-${dadoIndex}`}
                        >
                          <span className="text-sm text-gray-700 font-medium">
                            {dado.label}
                          </span>
                          <span className={`text-base font-bold ${programasData[programaAberto].corTexto}`}>
                            {dado.valor}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
