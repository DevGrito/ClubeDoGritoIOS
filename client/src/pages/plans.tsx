import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { Crown, Star, Menu, Calendar, Check, CreditCard, QrCode, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/logo";
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from "@/lib/utils";

import { planDetails, planPrices, periodicityLabels } from "@/lib/stripe";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { marketingFetch } from "@/lib/marketingFetch";

import { getPlanImage } from "@/lib/plan-utils";
import diamondIcon from "../app-assets/image_1755634986577.png";
import planEcoImage from "../app-assets/image_1758053087579.png";
import planVozImage from "../app-assets/image_1758053103933.png";
import planGritoImage from "../app-assets/image_1758053124494.png";
import planPlatinumImage from "../app-assets/image_1758053146019.png";
import planDiamanteImage from "../app-assets/image_1758053162624.png";

export default function Plans() {
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isPeriodicityModalOpen, setIsPeriodicityModalOpen] = useState(false);
  const [selectedPlanForPeriodicity, setSelectedPlanForPeriodicity] = useState<string>("");
  const [customValue, setCustomValue] = useState("");
  const [isCustomValueModalOpen, setIsCustomValueModalOpen] = useState(false);
  const [customPeriodicity, setCustomPeriodicity] = useState<string>("mensal");
  const [isLoading, setIsLoading] = useState(false);
  const [tier, setTier] = useState("");
  const [estimatedGritos, setEstimatedGritos] = useState(0);
  const { toast } = useToast();
  // Carrossel só no mobile; a partir de tablet o Embla desliga e o CSS assume o grid
  const [emblaRef] = useEmblaCarousel({
    loop: false,
    align: "start",
    containScroll: "trimSnaps",
    breakpoints: {
      "(min-width: 768px)": { active: false },
    },
  });

  // Mobile: slide do carrossel. Desktop: card compacto, sem esticar na altura
  const planSlideClass =
    "embla__slide flex-none w-[min(300px,85vw)] min-w-[min(300px,85vw)] cursor-pointer transition-all duration-300 md:w-[280px] md:min-w-[280px] md:max-w-[280px]";

  const planCardShellClass =
    "bg-white rounded-3xl shadow-lg h-[520px] grid grid-rows-[auto_auto_1fr_auto] p-5 sm:p-6 md:h-auto md:min-h-0 md:flex md:flex-col md:p-5";

  const planBenefitsClass =
    "space-y-3 overflow-y-auto pr-2 md:overflow-visible md:pr-0 md:space-y-2 md:mb-4";

  const planWrapperClass =
    "rounded-3xl h-[520px] md:h-auto md:min-h-0";

  // Capturar parâmetro ref da URL (link de indicação/marketing)
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get("ref");
  
  // Salvar refCode no localStorage e registrar clique se existir
  useEffect(() => {
    if (refCode) {
      localStorage.setItem("referralCode", refCode);
      console.log(`🔗 [PLANS] Link de indicação detectado: ${refCode}`);
      
      // Registrar clique na API (apenas uma vez por sessão)
      const clickKey = `ref_click_${refCode}`;
      if (!sessionStorage.getItem(clickKey)) {
        marketingFetch(
          `/api/mkt/track-click/${refCode}`,
          { method: "POST" },
          () => {
            console.log("⛔ [LGPD] Tracking de marketing bloqueado: consentimento não concedido.");
          }
        )
          .then((response) => {
            if (response) {
              sessionStorage.setItem(clickKey, "1");
              console.log(`✅ [PLANS] Clique registrado para: ${refCode}`);
            }
          })
          .catch((err) => console.error(`❌ [PLANS] Erro ao registrar clique:`, err));
      }
    }
  }, [refCode]);

  // Constantes para cálculo de valor livre
  const BASE_AMOUNT = 29.90;
  const BASE_POINTS = 150;
  const MIN_VALUE = 35.00;
  const MAX_VALUE = 50000.00;

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setSelectedPlanForPeriodicity(planId);
    setIsPeriodicityModalOpen(true);
  };

  const handlePeriodicitySelect = (planId: string, periodicity: string) => {
    // Save selected plan and periodicity to localStorage
    localStorage.setItem("selectedPlan", planId);
    localStorage.setItem("selectedPeriodicity", periodicity);
    
    setIsPeriodicityModalOpen(false);
    
    // Build URL with ref parameter if it exists
    const baseUrl = `/donation-flow?plan=${planId}&periodicity=${periodicity}`;
    const savedRefCode = localStorage.getItem("referralCode");
    const finalUrl = savedRefCode ? `${baseUrl}&ref=${savedRefCode}` : baseUrl;
    
    console.log(`🔗 [PLANS] Redirecionando para donation-flow com ref: ${savedRefCode || 'nenhum'}`);
    
    // Redirect to donation flow with all parameters
    setLocation(finalUrl);
  };

  const handlePremiumClick = () => {
    setIsPremiumModalOpen(true);
  };

  const handleCustomValueClick = () => {
    setIsCustomValueModalOpen(true);
  };

  // Função para calcular gritos
  const calcGritos = (value: number): number => {
    return Math.round((value / BASE_AMOUNT) * BASE_POINTS);
  };

  // Função para determinar tier
  // R$ 29,90 = Apoio Mensal; R$ 30,00+ = Platinum
  const getTier = (value: number): string => {
    return value >= 30.00 ? "Platinum" : "Apoio Mensal";
  };

  // Normalizar valor (substituir vírgula por ponto)
  const normalizeValue = (value: string): number => {
    const normalized = value.replace(/[^\d.,]/g, '').replace(',', '.');
    return parseFloat(normalized);
  };

  // Validar valor
  const validateValue = (value: number): { isValid: boolean; error?: string } => {
    if (isNaN(value) || value <= 0) {
      return { isValid: false, error: "Por favor, insira um valor válido maior que zero." };
    }
    if (value < MIN_VALUE) {
      return { isValid: false, error: `O valor mínimo é R$ ${MIN_VALUE.toFixed(2).replace('.', ',')}.` };
    }
    if (value > MAX_VALUE) {
      return { isValid: false, error: `O valor máximo é R$ ${MAX_VALUE.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.` };
    }
    return { isValid: true };
  };

  const handleCustomValueSubmit = () => {
    const value = parseFloat(customValue.replace(/[^\d.,]/g, '').replace(',', '.'));
    
    if (isNaN(value) || value <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido maior que zero.",
        variant: "destructive",
      });
      return;
    }

    if (value <= 29.90) {
      toast({
        title: "Que bom que quer contribuir!",
        description: "Para valores até R$ 29,90, temos outros planos perfeitos para você.",
        variant: "default",
      });
      return;
    }

    // Save custom amount to localStorage
    localStorage.setItem("customAmount", value.toString());
    localStorage.setItem("selectedPlan", "platinum");
    setIsPremiumModalOpen(false);
    
    // Redirect to new donation flow with custom amount directly
    setLocation(`/donation-flow?plan=platinum&amount=${value}`);
  };

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers === '') return '';
    
    const formatted = (parseInt(numbers) / 100).toFixed(2);
    return `R$ ${formatted.replace('.', ',')}`;
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setCustomValue(formatted);

    // Calcular tier e gritos em tempo real
    const numericValue = normalizeValue(formatted);
    if (!isNaN(numericValue) && numericValue > 0) {
      setTier(getTier(numericValue));
      setEstimatedGritos(calcGritos(numericValue));
    } else {
      setTier("");
      setEstimatedGritos(0);
    }
  };

  // Função para formatar números com separação de milhares
  const formatNumber = (num: number): string => {
    return num.toLocaleString('pt-BR');
  };

  const getPeriodicityText = (periodicity: string) => {
    const periodicityTexts: { [key: string]: string } = {
      'mensal': 'por mês',
      'trimestral': 'por trimestre',
      'semestral': 'por semestre',
      'anual': 'por ano'
    };
    return periodicityTexts[periodicity] || 'por mês';
  };

  const getPeriodicityMonths = (periodicity: string): number => {
    const monthsMap: { [key: string]: number } = {
      'mensal': 1,
      'trimestral': 3,
      'semestral': 6,
      'anual': 12
    };
    return monthsMap[periodicity] || 1;
  };

  const calculateTotalPeriod = (monthlyValue: number, periodicity: string): number => {
    return monthlyValue * getPeriodicityMonths(periodicity);
  };

  const getPlanCardStyle = (planId: string) => {
    switch (planId) {
      case 'voz':
        return 'border-green-500 bg-white';
      case 'platinum':
        return 'border-yellow-400 bg-yellow-50';
      case 'diamante':
        return 'border-gray-800 bg-gray-900 text-white';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getPlanButtonStyle = (planId: string) => {
    switch (planId) {
      case 'voz':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'platinum':
        return 'bg-yellow-400 hover:bg-yellow-500 text-black';
      case 'diamante':
        return 'bg-gray-800 hover:bg-gray-900 text-white';
      default:
        return 'bg-green-500 hover:bg-green-600 text-white';
    }
  };

  const getPlanImageSrc = (planId: string) => {
    switch (planId) {
      case 'eco':
        return planEcoImage;
      case 'voz':
        return planVozImage;
      case 'grito':
        return planGritoImage;
      case 'platinum':
        return planPlatinumImage;
      case 'diamante':
        return planDiamanteImage;
      default:
        return planEcoImage;
    }
  };

  const getPlanBenefits = (planId: string): string[] => {
    switch (planId) {
      case 'eco':
        return [
          "Participação no Clube com benefícios básicos",
          "Descontos em parceiros selecionados (cafés, restaurantes, lojas)",
          "Acesso às missões simples dentro do app",
          "Relatórios mensais de impacto social"
        ];
      case 'voz':
        return [
          "Todos os benefícios do Eco +",
          "Acesso a prêmios de experiências ou produtos",
          "Mais pontos por check-ins e missões concluídas",
          "Descontos maiores em parceiros do Grito",
          "Brindes exclusivos da Griffte / Outlet Social",
          "Pontuação em dobro nas missões do app"
        ];
      case 'grito':
        return [
          "Todos os benefícios anteriores",
          "Acesso VIP a eventos exclusivos",
          "Mentoria com líderes sociais",
          "Participação em projetos especiais",
          "Suporte prioritário 24/7"
        ];
      case 'platinum':
        return [
          "Todos os benefícios do Grito +",
          "Créditos extras para sorteios e prêmios",
          "Acesso a experiências de bem-estar (ex.: sessões fitness, cultura, turismo social)",
          "Presentes e produtos oficiais do Grito (Griffte, Outlet Social)",
          "Reconhecimento dentro do app"
        ];
      case 'diamante':
        return [
          "Todos os benefícios do Platinum +",
          "Experiências exclusivas e premium (viagens sociais, encontros especiais com líderes e artistas)",
          "Convites VIP para os grandes eventos do Instituto (ex: inaugurações, festivais,)",
          "Presentes e produtos oficiais do Grito (Griffte, Outlet Social)",
          "Badge Diamante no perfil com destaque máximo no ranking"
        ];
      default:
        return [
          "Benefícios básicos do clube",
          "Acesso à plataforma",
          "Suporte por email"
        ];
    }
  };



  return (
    <div className="min-h-screen bg-gray-50" style={{ backgroundColor: '#F5F5F5',
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
     }}>
      {/* Main Container com fundo branco sem card */}
      <div className="min-h-screen bg-white">
            <div className="w-full max-w-[1280px] mx-auto">
          
          {/* Header: título + Entrar */}
          <div className="flex items-start justify-between gap-4 px-6 sm:px-8 pb-6 md:pb-8">
            <h1
              className="text-gray-800 leading-tight text-left text-2xl md:text-[28px] lg:text-[32px] max-w-lg"
              style={{ fontFamily: 'Inter', fontWeight: '400' }}
            >
              Mais benefícios<br className="md:hidden" />
              {" "}para você.{" "}
              <span style={{ fontWeight: '700' }}>
                Mais<br className="md:hidden" />
                {" "}futuro para eles.
              </span>
            </h1>
            <Button
              onClick={() => setLocation('/entrar')}
              className="shrink-0 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-1.5 md:px-5 md:py-2 text-xs md:text-sm rounded-full shadow-md"
              data-testid="button-entrar"
            >
              ENTRAR
            </Button>
          </div>

          {/* Planos: carrossel no mobile; no notebook/PC cards de 300px centralizados (2x2 ou 4 em linha) */}
          <div className="embla overflow-hidden md:overflow-visible" ref={emblaRef}>
            <div className="embla__container flex gap-4 px-6 sm:px-8 pb-8 md:flex-wrap md:justify-center md:gap-5 md:pb-10 md:items-start">
              {Object.entries(planDetails).map(([planId, plan], index) => {
                // Skip platinum and diamante plans
                if (planId === 'platinum' || planId === 'diamante') {
                  return null;
                }

                // Get plan price data
                const planPrice = planPrices[planId as keyof typeof planPrices];
                const primaryPrice = planPrice?.mensal || { display: "Personalizado" };
                
                // Render premium plans with special wrappers (keeping old code structure for other plans)
                if (planId === 'platinum_old') {
                  return (
                    <div key={planId} className={planSlideClass}>
                      {/* Wrapper Premium Dourado */}
                      <div className={cn("bg-gradient-to-br from-yellow-300 to-amber-500 p-1", planWrapperClass)}>
                        <div className={planCardShellClass}>
                          
                          {/* Badge interno */}
                          <div className="flex justify-center mb-4">
                            <div className="bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-semibold">
                              ✨ SEJA PLATINUM
                            </div>
                          </div>
                          
                          {/* Título e Preço */}
                          <div className="text-center mb-4">
                            <h3 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Inter' }}>
                              {plan.name.toUpperCase()}
                            </h3>
                            <p className="text-gray-600 text-sm mb-4" style={{ fontFamily: 'Inter' }}>
                              {plan.description}
                            </p>
                            <div className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'Inter' }}>
                              {primaryPrice.display}
                            </div>
                          </div>

                          {/* Lista de Benefícios */}
                          <div className={planBenefitsClass}>
                            {getPlanBenefits(planId).map((benefit, idx) => (
                              <div key={idx} className="flex items-start gap-3">
                                <div className="mt-1 flex-shrink-0">
                                  <Check className="w-5 h-5 text-green-500" />
                                </div>
                                <span className="text-gray-700 text-sm leading-relaxed" style={{ fontFamily: 'Inter' }}>
                                  {benefit}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Botão fixo */}
                          <div className="pt-4">
                            <Button 
                              className="w-full bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold py-3 text-base shadow-md transition-all duration-200"
                              style={{ fontFamily: 'Inter' }}
                              onClick={() => handlePlanSelect(planId)}
                              data-testid={`button-select-plan-${planId}`}
                            >
                              Quero impactar!
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (planId === 'diamante') {
                  return (
                    <div key={planId} className={planSlideClass}>
                      {/* Wrapper Premium Diamante */}
                      <div className={cn("bg-gradient-to-br from-gray-800 via-white to-gray-800 p-1", planWrapperClass)}>
                        <div className="bg-gray-900 text-white rounded-3xl shadow-lg h-full grid grid-rows-[auto_auto_1fr_auto] p-6">
                          
                          {/* Badge interno */}
                          <div className="flex justify-center mb-4">
                            <div className="bg-gray-800 text-white px-4 py-1 rounded-full text-sm font-semibold border border-white">
                              💎 SEJA DIAMANTE
                            </div>
                          </div>
                          
                          {/* Título e Preço */}
                          <div className="text-center mb-4">
                            <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Inter' }}>
                              {plan.name.toUpperCase()}
                            </h3>
                            <p className="text-gray-300 text-sm mb-4" style={{ fontFamily: 'Inter' }}>
                              {plan.description}
                            </p>
                            <div className="text-3xl font-bold text-white" style={{ fontFamily: 'Inter' }}>
                              {primaryPrice.display}
                            </div>
                          </div>

                          {/* Lista de Benefícios */}
                          <div className={planBenefitsClass}>
                            {getPlanBenefits(planId).map((benefit, idx) => (
                              <div key={idx} className="flex items-start gap-3">
                                <div className="mt-1 flex-shrink-0">
                                  <Check className="w-5 h-5 text-green-500" />
                                </div>
                                <span className="text-gray-300 text-sm leading-relaxed" style={{ fontFamily: 'Inter' }}>
                                  {benefit}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Botão fixo */}
                          <div className="pt-4">
                            <Button 
                              className="w-full bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold py-3 text-base shadow-md transition-all duration-200"
                              style={{ fontFamily: 'Inter' }}
                              onClick={() => handlePlanSelect(planId)}
                              data-testid={`button-select-plan-${planId}`}
                            >
                              Quero impactar!
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Render regular plans (eco, voz, grito)
                return (
                  <div key={planId} className={planSlideClass}>
                    {/* Card Regular */}
                    <div className={cn(
                      planCardShellClass,
                      planId === 'voz'
                        ? 'border-4 border-green-500'
                        : 'border border-gray-200'
                    )}>
                      
                      {/* Badge interno para planos populares */}
                      <div className="flex justify-center mb-3 md:mb-2 min-h-[28px]">
                        {'popular' in plan && plan.popular && (
                          <div className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                            POPULAR
                          </div>
                        )}
                      </div>
                      
                      {/* Título e Preço */}
                      <div className="text-center mb-3 md:mb-2">
                        <h3 className="text-2xl md:text-xl font-bold text-gray-800 mb-2 md:mb-1" style={{ fontFamily: 'Inter' }}>
                          {plan.name.toUpperCase()}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3 md:mb-2" style={{ fontFamily: 'Inter' }}>
                          {plan.description}
                        </p>
                        <div className="text-3xl md:text-2xl font-bold text-gray-800" style={{ fontFamily: 'Inter' }}>
                          {primaryPrice.display}
                        </div>
                      </div>

                      {/* Lista de Benefícios */}
                      <div className={planBenefitsClass}>
                        {getPlanBenefits(planId).map((benefit, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="mt-1 flex-shrink-0">
                              <Check className="w-5 h-5 text-green-500" />
                            </div>
                            <span className="text-gray-700 text-sm leading-relaxed" style={{ fontFamily: 'Inter' }}>
                              {benefit}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Botão fixo */}
                      <div className="pt-4 md:pt-2 md:mt-auto">
                        <Button 
                          className="w-full bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold py-3 text-base shadow-md transition-all duration-200"
                          style={{ fontFamily: 'Inter' }}
                          onClick={() => handlePlanSelect(planId)}
                          data-testid={`button-select-plan-${planId}`}
                        >
                          Quero impactar!
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Card de Valor Livre - NOVO */}
              <div className={planSlideClass}>
                {/* Wrapper Valor Livre com gradiente especial */}
                <div className={cn("bg-gradient-to-br from-blue-400 to-purple-600 p-1", planWrapperClass)}>
                  <div className={planCardShellClass}>
                    
                    {/* Badge interno */}
                    <div className="flex justify-center mb-3 md:mb-2 min-h-[28px]">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        <Sparkles className="w-4 h-4 inline mr-1" />
                        SEJA PLATINUM
                      </div>
                    </div>
                    
                    {/* Título e Descrição */}
                    <div className="text-center mb-3 md:mb-2">
                      <h3 className="text-2xl md:text-xl font-bold text-gray-800 mb-2 md:mb-1" style={{ fontFamily: 'Inter' }}>
                        PLATINUM
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 md:mb-2" style={{ fontFamily: 'Inter' }}>
                        Cobrança mensal automática no valor que você escolher
                      </p>
                      <div className="text-xl md:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600" style={{ fontFamily: 'Inter' }}>
                        ESCOLHA SEU VALOR
                      </div>
                    </div>

                    {/* Lista de Benefícios */}
                    <div className={planBenefitsClass}>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          <Check className="w-5 h-5 text-green-500" />
                        </div>
                        <span className="text-gray-700 text-sm leading-relaxed" style={{ fontFamily: 'Inter' }}>
                          Flexibilidade total para escolher seu valor de contribuição
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          <Check className="w-5 h-5 text-green-500" />
                        </div>
                        <span className="text-gray-700 text-sm leading-relaxed" style={{ fontFamily: 'Inter' }}>
                          Todos os benefícios do plano Platinum incluídos
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          <Check className="w-5 h-5 text-green-500" />
                        </div>
                        <span className="text-gray-700 text-sm leading-relaxed" style={{ fontFamily: 'Inter' }}>
                          Gritos proporcionais ao valor doado
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          <Check className="w-5 h-5 text-green-500" />
                        </div>
                        <span className="text-gray-700 text-sm leading-relaxed" style={{ fontFamily: 'Inter' }}>
                          Pagamento via PIX ou Cartão de Crédito
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          <Check className="w-5 h-5 text-green-500" />
                        </div>
                        <span className="text-gray-700 text-sm leading-relaxed" style={{ fontFamily: 'Inter' }}>
                          Seu impacto, sua escolha!
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          <Check className="w-5 h-5 text-green-500" />
                        </div>
                        <span className="text-gray-700 text-sm leading-relaxed" style={{ fontFamily: 'Inter' }}>
                          Todos os benefícios do Grito +
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          <Check className="w-5 h-5 text-green-500" />
                        </div>
                        <span className="text-gray-700 text-sm leading-relaxed" style={{ fontFamily: 'Inter' }}>
                          Créditos extras para sorteios e prêmios
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          <Check className="w-5 h-5 text-green-500" />
                        </div>
                        <span className="text-gray-700 text-sm leading-relaxed" style={{ fontFamily: 'Inter' }}>
                          Acesso a experiências de bem-estar (ex.: sessões fitness, cultura, turismo social)
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          <Check className="w-5 h-5 text-green-500" />
                        </div>
                        <span className="text-gray-700 text-sm leading-relaxed" style={{ fontFamily: 'Inter' }}>
                          Presentes e produtos oficiais do Grito (Griffte, Outlet Social)
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          <Check className="w-5 h-5 text-green-500" />
                        </div>
                        <span className="text-gray-700 text-sm leading-relaxed" style={{ fontFamily: 'Inter' }}>
                          Reconhecimento dentro do app
                        </span>
                      </div>
                    </div>

                    {/* Botão fixo */}
                    <div className="pt-4 md:pt-2 md:mt-auto">
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full font-semibold py-3 text-base shadow-md transition-all duration-200"
                        style={{ fontFamily: 'Inter' }}
                        onClick={handleCustomValueClick}
                        data-testid="button-select-custom-value"
                      >
                        Escolher meu valor!
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Modal de Seleção de Periodicidade */}
      <Dialog open={isPeriodicityModalOpen} onOpenChange={setIsPeriodicityModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'Inter' }}>
              <Calendar className="w-5 h-5 text-blue-500" />
              Escolha sua periodicidade
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-2">
            <div className="text-center">
              <p className="text-gray-600 mb-4" style={{ fontFamily: 'Inter' }}>
                Selecione como deseja pagar pelo plano <strong>{selectedPlanForPeriodicity && planDetails[selectedPlanForPeriodicity as keyof typeof planDetails]?.name}</strong>
              </p>
            </div>
            
            {/* Lista de periodicidades disponíveis */}
            <div className="space-y-2">
              {selectedPlanForPeriodicity && planDetails[selectedPlanForPeriodicity as keyof typeof planDetails]?.periodicities.map((periodicity) => {
                const periodicityData = planPrices[selectedPlanForPeriodicity as keyof typeof planPrices][periodicity as keyof typeof planPrices[keyof typeof planPrices]];
                return (
                  <button
                    key={periodicity}
                    onClick={() => handlePeriodicitySelect(selectedPlanForPeriodicity, periodicity)}
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-800" style={{ fontFamily: 'Inter' }}>
                          {periodicityLabels[periodicity as keyof typeof periodicityLabels]}
                        </div>
                        <div className="text-gray-600 text-sm" style={{ fontFamily: 'Inter' }}>
                          {periodicityData.display} {getPeriodicityText(periodicity)}
                        </div>
                      </div>
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100"></div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setIsPeriodicityModalOpen(false)}
                className="flex-1 rounded-2xl"
                style={{ fontFamily: 'Inter' }}
              >
                Voltar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Valor Livre - NOVO */}
      <Dialog open={isCustomValueModalOpen} onOpenChange={setIsCustomValueModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'Inter' }}>
              <Sparkles className="w-5 h-5 text-purple-500" />
              Digite seu valor
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-2">
            
            {/* Input de Valor */}
            <div className="space-y-2">
              <Label htmlFor="custom-value" className="text-gray-700" style={{ fontFamily: 'Inter' }}>
                Valor da contribuição mensal
              </Label>
              <Input
                id="custom-value"
                type="text"
                inputMode="numeric"
                placeholder="R$ 50,00"
                value={customValue}
                onChange={handleValueChange}
                className="w-full h-16 text-2xl text-center border-2 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                style={{ 
                  fontFamily: 'Inter', 
                  fontSize: '24px',
                  fontWeight: '600',
                  borderColor: '#9333EA',
                  backgroundColor: '#FFFFFF'
                }}
                disabled={isLoading}
                data-testid="input-custom-donation-value"
              />
            </div>

            {/* Presets Rápidos */}
            <div className="space-y-2">
              <Label className="text-gray-700 text-sm" style={{ fontFamily: 'Inter' }}>
                Ou escolha um valor:
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {[35, 50, 60, 80, 100, 150, 200].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      const formatted = formatCurrency((preset * 100).toString());
                      setCustomValue(formatted);
                      const numericValue = normalizeValue(formatted);
                      if (!isNaN(numericValue) && numericValue > 0) {
                        setTier(getTier(numericValue));
                        setEstimatedGritos(calcGritos(numericValue));
                      }
                    }}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-purple-50 hover:border-purple-400 transition-all duration-200 text-sm font-medium"
                    style={{ fontFamily: 'Inter' }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Resumo Dinâmico - COM TOTAL DO PERÍODO */}
            <div className="p-4 bg-purple-50 rounded-xl" aria-live="polite">
              {customValue && tier && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tier:</span>
                    <span className="text-sm font-semibold text-purple-600">{tier}</span>
                  </div>
                  <div className="border-t border-purple-200 pt-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">Valor mensal:</span>
                      <span className="text-xs font-medium">{customValue}</span>
                    </div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">Meses do período:</span>
                      <span className="text-xs font-medium">{getPeriodicityMonths(customPeriodicity)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-purple-200">
                      <span className="text-sm font-semibold text-gray-800">Total do período:</span>
                      <span className="text-sm font-bold text-purple-700">
                        R$ {calculateTotalPeriod(normalizeValue(customValue), customPeriodicity).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 text-center mt-2">
                    💳 Cobrança automática {customPeriodicity} - Subscription recorrente
                  </div>
                </div>
              )}
              {!customValue && (
                <div className="text-sm text-gray-500 text-center">
                  Digite um valor para ver os detalhes
                </div>
              )}
            </div>

            {/* Seleção de Periodicidade */}
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold" style={{ fontFamily: 'Inter' }}>
                Escolha a periodicidade
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCustomPeriodicity('mensal')}
                  className={`p-3 border-2 rounded-xl transition-all duration-200 ${
                    customPeriodicity === 'mensal' 
                      ? 'border-purple-500 bg-purple-50 text-purple-700' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                  data-testid="button-periodicity-mensal"
                >
                  <div className="font-semibold text-sm" style={{ fontFamily: 'Inter' }}>Mensal</div>
                </button>
                <button
                  onClick={() => setCustomPeriodicity('trimestral')}
                  className={`p-3 border-2 rounded-xl transition-all duration-200 ${
                    customPeriodicity === 'trimestral' 
                      ? 'border-purple-500 bg-purple-50 text-purple-700' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                  data-testid="button-periodicity-trimestral"
                >
                  <div className="font-semibold text-sm" style={{ fontFamily: 'Inter' }}>Trimestral</div>
                </button>
                <button
                  onClick={() => setCustomPeriodicity('semestral')}
                  className={`p-3 border-2 rounded-xl transition-all duration-200 ${
                    customPeriodicity === 'semestral' 
                      ? 'border-purple-500 bg-purple-50 text-purple-700' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                  data-testid="button-periodicity-semestral"
                >
                  <div className="font-semibold text-sm" style={{ fontFamily: 'Inter' }}>Semestral</div>
                </button>
                <button
                  onClick={() => setCustomPeriodicity('anual')}
                  className={`p-3 border-2 rounded-xl transition-all duration-200 ${
                    customPeriodicity === 'anual' 
                      ? 'border-purple-500 bg-purple-50 text-purple-700' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                  data-testid="button-periodicity-anual"
                >
                  <div className="font-semibold text-sm" style={{ fontFamily: 'Inter' }}>Anual</div>
                </button>
              </div>
            </div>

            {/* Botões de Pagamento */}
            <div className="space-y-3 pt-2">
              {/* Botão Continuar */}
              <Button
                onClick={() => {
                  const numericValue = normalizeValue(customValue);
                  const validation = validateValue(numericValue);
                  
                  if (!validation.isValid) {
                    toast({
                      title: "Valor inválido",
                      description: validation.error,
                      variant: "destructive",
                    });
                    return;
                  }

                  localStorage.setItem("customAmount", numericValue.toString());
                  localStorage.setItem("selectedPlan", "platinum");
                  localStorage.setItem("selectedPeriodicity", customPeriodicity);
                  
                  const savedRefCode = localStorage.getItem("referralCode");
                  const baseUrl = `/donation-flow?plan=platinum&amount=${numericValue}&periodicity=${customPeriodicity}`;
                  const finalUrl = savedRefCode ? `${baseUrl}&ref=${savedRefCode}` : baseUrl;
                  
                  console.log(`🔗 [PLATINUM] Redirecionando para donation-flow: ${finalUrl}`);
                  
                  setIsCustomValueModalOpen(false);
                  setLocation(finalUrl);
                }}
                disabled={isLoading || !customValue}
                className="w-full h-12 rounded-xl font-semibold text-base shadow-md"
                style={{ 
                  fontFamily: 'Inter',
                  backgroundColor: '#FFCC00',
                  color: '#000000'
                }}
                data-testid="button-custom-pay-with-card"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Continuar
              </Button>

              {/* Botão Voltar */}
              <Button 
                variant="outline" 
                onClick={() => setIsCustomValueModalOpen(false)}
                disabled={isLoading}
                className="w-full rounded-xl"
                style={{ fontFamily: 'Inter' }}
              >
                Voltar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Rodapé ─────────────────────────────────────────────── */}
      <footer className="bg-gray-100 border-t border-gray-200 px-6 py-6 mt-8">
        <div className="max-w-lg md:max-w-4xl mx-auto text-center space-y-3">
          <p className="text-xs text-gray-500" style={{ fontFamily: 'Inter' }}>
            © {new Date().getFullYear()} Instituto O Grito. Todos os direitos reservados.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <button
              onClick={() => setLocation('/termos-de-uso')}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-black transition-colors"
              style={{ fontFamily: 'Inter' }}
            >
              <FileText className="w-3.5 h-3.5" />
              Termos de Uso
            </button>
            <button
              onClick={() => setLocation('/politica-de-privacidade')}
              className="text-xs text-gray-600 hover:text-black transition-colors underline"
              style={{ fontFamily: 'Inter' }}
            >
              Política de Privacidade
            </button>
            <button
              onClick={() => setLocation('/politica-de-cookies')}
              className="text-xs text-gray-600 hover:text-black transition-colors underline"
              style={{ fontFamily: 'Inter' }}
            >
              Política de Cookies
            </button>
            <button
              onClick={() => setLocation('/politica-de-uso-de-imagem')}
              className="text-xs text-gray-600 hover:text-black transition-colors underline"
              style={{ fontFamily: 'Inter' }}
            >
              Uso de Imagem
            </button>
            <button
              onClick={() => setLocation('/direitos-do-titular')}
              className="text-xs text-gray-600 hover:text-black transition-colors underline"
              style={{ fontFamily: 'Inter' }}
            >
              Direitos do Titular
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("openCookiePreferences"))}
              className="text-xs text-gray-600 hover:text-black transition-colors underline"
              style={{ fontFamily: 'Inter' }}
            >
              Preferências de privacidade
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
