import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/logo";
import { ArrowLeft, TrendingUp, Check, Calendar, Sparkles } from "lucide-react";
import { planDetails, planPrices, periodicityLabels } from "@/lib/stripe";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import useEmblaCarousel from 'embla-carousel-react';

export default function ChangePlan() {
  console.log('🚀🚀🚀 [CHANGE-PLAN] Componente carregado! Versão NOVA com validação de downgrade!');
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isChanging, setIsChanging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para modals
  const [isPeriodicityModalOpen, setIsPeriodicityModalOpen] = useState(false);
  const [selectedPlanForPeriodicity, setSelectedPlanForPeriodicity] = useState<string>("");
  const [isCustomValueModalOpen, setIsCustomValueModalOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [customPeriodicity, setCustomPeriodicity] = useState<string>("mensal");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [planToChange, setPlanToChange] = useState<string | null>(null);
  const [periodicityToChange, setPeriodicityToChange] = useState<string | null>(null);
  
  // Embla Carousel
  const [emblaRef] = useEmblaCarousel({ 
    loop: false, 
    align: 'start',
    containScroll: 'trimSnaps'
  });

  useEffect(() => {
    loadUserData();
  }, []);

  // Função para calcular valor mensal equivalente baseado no plano e periodicidade
  const getMonthlyEquivalentValue = (planId: string, periodicity: string = 'mensal', customAmount?: number): number => {
    // Para platinum customizado, usar o valor customizado
    if (planId === 'platinum' && customAmount) {
      const intervalMonths = periodicity === 'mensal' ? 1 : periodicity === 'trimestral' ? 3 : periodicity === 'semestral' ? 6 : 12;
      return customAmount / intervalMonths;
    }
    
    // Para planos fixos, buscar na tabela de preços
    const plan = planPrices[planId as keyof typeof planPrices];
    if (!plan) return 0;
    
    const priceInfo = plan[periodicity as keyof typeof plan];
    if (!priceInfo || typeof priceInfo !== 'object' || !('price' in priceInfo)) return 0;
    
    const intervalMonths = priceInfo.interval_count || 1;
    return priceInfo.price / 100 / intervalMonths;
  };

  // Verificar se uma mudança seria downgrade
  const isDowngrade = (newPlanId: string, newPeriodicity: string = 'mensal', newCustomAmount?: number): boolean => {
    if (!currentUser?.plano) return false;
    
    // Buscar o valor customizado atual do usuário se for platinum
    // Se o campo não existir, assumir valor mínimo do plano platinum (R$ 35)
    const currentCustomAmount = currentUser.valorPersonalizado 
      ? parseFloat(currentUser.valorPersonalizado) 
      : (currentUser.plano === 'platinum' ? 35 : undefined);
    
    // Buscar periodicidade atual (assumir mensal se não tiver)
    const currentPeriodicity = currentUser.periodoDoacacao || 'mensal';
    
    const currentMonthlyValue = getMonthlyEquivalentValue(
      currentUser.plano, 
      currentPeriodicity,
      currentCustomAmount
    );
    
    const newMonthlyValue = getMonthlyEquivalentValue(
      newPlanId, 
      newPeriodicity,
      newCustomAmount
    );
    
    console.log('[DOWNGRADE CHECK]', {
      currentPlan: currentUser.plano,
      currentPeriodicity,
      currentMonthlyValue,
      newPlan: newPlanId,
      newPeriodicity,
      newMonthlyValue,
      isDowngrade: newMonthlyValue < currentMonthlyValue
    });
    
    // É downgrade se o novo valor mensal for menor que o atual
    return newMonthlyValue < currentMonthlyValue;
  };

  const loadUserData = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const isDevAccess = urlParams.get('dev_access') === 'true';
      const isFromDevPanel = urlParams.get('origin') === 'dev_panel';
      const devSession = sessionStorage.getItem('dev_session') === 'active';
      const userPapel = localStorage.getItem('userPapel');
      
      if (isDevAccess || isFromDevPanel || devSession || userPapel === 'desenvolvedor') {
        setCurrentUser({
          id: 999,
          nome: "Desenvolvedor - Modo Demo",
          telefone: "+5511999999999",
          email: "dev@clubedogrito.com",
          plano: "eco",
          stripeSubscriptionId: "demo_subscription_id",
          stripeCustomerId: "demo_customer_id"
        });
        setIsLoading(false);
        return;
      }
      
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setLocation("/");
        return;
      }

      const result = await apiRequest(`/api/users/${userId}`, {
        method: "GET",
      });
      
      console.log('[USER DATA LOADED]', {
        plano: result.plano,
        valorPersonalizado: result.valorPersonalizado,
        periodoDoacacao: result.periodoDoacacao,
        fullData: result
      });
      
      setCurrentUser(result);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do usuário",
        variant: "destructive",
      });
      setLocation("/welcome");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = (planId: string) => {
    // Verificar modo desenvolvedor
    const urlParams = new URLSearchParams(window.location.search);
    const isDevAccess = urlParams.get('dev_access') === 'true';
    const isFromDevPanel = urlParams.get('origin') === 'dev_panel';
    const devSession = sessionStorage.getItem('dev_session') === 'active';
    const userPapel = localStorage.getItem('userPapel');
    
    if (isDevAccess || isFromDevPanel || devSession || userPapel === 'desenvolvedor') {
      toast({
        title: "Modo Desenvolvedor",
        description: `Simulação: Plano alterado para ${planDetails[planId as keyof typeof planDetails]?.name}. Esta é uma demonstração.`,
      });
      return;
    }
    
    if (!currentUser?.stripeCustomerId && !currentUser?.stripeSubscriptionId) {
      toast({
        title: "Assinatura Necessária",
        description: "Você precisa fazer sua primeira doação para alterar planos.",
        variant: "destructive",
      });
      setTimeout(() => setLocation("/plans"), 2000);
      return;
    }

    if (planId === currentUser?.plano) {
      toast({
        title: "Informação",
        description: "Você já está neste plano!",
      });
      return;
    }

    // ⚠️ VALIDAR DOWNGRADE ANTES DE ABRIR O MODAL
    // Verificar com periodicidade 'mensal' como padrão (valor mínimo)
    if (isDowngrade(planId, 'mensal')) {
      const currentMonthlyValue = getMonthlyEquivalentValue(
        currentUser.plano, 
        currentUser.periodoDoacacao || 'mensal',
        currentUser.valorPersonalizado ? parseFloat(currentUser.valorPersonalizado) : undefined
      );
      
      toast({
        title: "❌ Downgrade não permitido",
        description: `Você contribui com R$ ${currentMonthlyValue.toFixed(2)}/mês. Apenas upgrades são permitidos!`,
        variant: "destructive",
      });
      return;
    }

    setSelectedPlanForPeriodicity(planId);
    setIsPeriodicityModalOpen(true);
  };

  const handleCustomValueClick = () => {
    // Permitir que usuários Platinum abram o modal para aumentar valor
    setIsCustomValueModalOpen(true);
  };

  const handlePeriodicitySelect = (planId: string, periodicity: string) => {
    // Validar se é downgrade
    if (isDowngrade(planId, periodicity)) {
      const currentMonthlyValue = getMonthlyEquivalentValue(
        currentUser.plano, 
        currentUser.periodoDoacacao || 'mensal',
        currentUser.valorPersonalizado ? parseFloat(currentUser.valorPersonalizado) : undefined
      );
      
      toast({
        title: "❌ Downgrade não permitido",
        description: `Você contribui com R$ ${currentMonthlyValue.toFixed(2)}/mês. Apenas upgrades são permitidos!`,
        variant: "destructive",
      });
      setIsPeriodicityModalOpen(false);
      return;
    }
    
    setIsPeriodicityModalOpen(false);
    setPlanToChange(planId);
    setPeriodicityToChange(periodicity);
    setShowConfirmModal(true);
  };
  
  const confirmChangePlan = async () => {
    if (!planToChange || !periodicityToChange) return;
    
    setShowConfirmModal(false);
    setIsChanging(true);

    try {
      const result = await apiRequest("/api/schedule-plan-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: currentUser.stripeSubscriptionId,
          newPlanId: planToChange,
          periodicity: periodicityToChange,
          userId: currentUser.id,
        }),
      });

      const effectiveDate = result.changeEffectiveDateFormatted || 'próximo ciclo de cobrança';
      
      toast({
        title: "Mudança de Plano Agendada!",
        description: `Seu plano será alterado para ${planDetails[planToChange as keyof typeof planDetails]?.name} (${periodicityLabels[periodicityToChange as keyof typeof periodicityLabels]}) em ${effectiveDate}.`,
      });

      try {
        await apiRequest(`/api/users/${currentUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: currentUser.nome,
            telefone: currentUser.telefone,
            plano: planToChange,
          }),
        });
        localStorage.setItem("userPlan", planToChange);
      } catch (userUpdateError: any) {
        console.warn("Aviso: Erro ao atualizar dados do usuário (não crítico):", userUpdateError);
      }

      setTimeout(() => setLocation("/welcome"), 2000);

    } catch (error: any) {
      console.error("Error changing plan:", error);
      toast({
        title: "Erro ao alterar plano",
        description: "Ocorreu um erro ao alterar seu plano. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsChanging(false);
      setPlanToChange(null);
      setPeriodicityToChange(null);
    }
  };
  
  const handleCustomValue = async () => {
    const value = parseFloat(customValue.replace(/[^\d,]/g, '').replace(',', '.'));
    
    // Validação especial para usuários Platinum existentes
    if (currentUser?.plano === 'platinum' && currentUser?.valorPersonalizado) {
      const currentValue = parseFloat(currentUser.valorPersonalizado);
      
      if (isNaN(value) || value <= currentValue) {
        toast({
          title: "❌ Valor não permitido",
          description: `Seu valor atual é R$ ${currentValue.toFixed(2)}. Você só pode escolher um valor maior para aumentar sua contribuição!`,
          variant: "destructive",
        });
        return;
      }
    } else {
      // Validação para novos usuários Platinum
      if (isNaN(value) || value < 30) {
        toast({
          title: "Valor Mínimo",
          description: "O valor mínimo para o Platinum é R$ 30,00.",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Validar downgrade geral (caso usuário venha de outro plano)
    if (isDowngrade('platinum', customPeriodicity, value)) {
      const currentMonthlyValue = getMonthlyEquivalentValue(
        currentUser.plano, 
        currentUser.periodoDoacacao || 'mensal',
        currentUser.valorPersonalizado ? parseFloat(currentUser.valorPersonalizado) : undefined
      );
      
      toast({
        title: "❌ Downgrade não permitido",
        description: `Você contribui com R$ ${currentMonthlyValue.toFixed(2)}/mês. Apenas upgrades são permitidos!`,
        variant: "destructive",
      });
      return;
    }
    
    setIsCustomValueModalOpen(false);
    setIsChanging(true);
    
    try {
      const result = await apiRequest("/api/schedule-plan-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: currentUser.stripeSubscriptionId,
          newPlanId: "platinum",
          customAmount: Math.round(value * 100),
          periodicity: customPeriodicity,
          userId: currentUser.id,
        }),
      });
      
      await apiRequest(`/api/users/${currentUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: currentUser.nome,
          telefone: currentUser.telefone,
          plano: "platinum",
          valorPersonalizado: value.toFixed(2)
        }),
      });
      
      localStorage.setItem("userPlan", "platinum");
      localStorage.setItem("customAmount", value.toString());
      
      const effectiveDate = result.changeEffectiveDateFormatted || 'próximo ciclo de cobrança';
      
      toast({
        title: "Mudança de Plano Agendada!",
        description: `Seu plano será alterado para Platinum (R$ ${value.toFixed(2).replace('.', ',')}/mês) em ${effectiveDate}.`,
      });
      
      setTimeout(() => setLocation("/welcome"), 2000);
      
    } catch (error: any) {
      console.error("Error changing to platinum plan:", error);
      toast({
        title: "Erro ao alterar plano",
        description: "Ocorreu um erro ao alterar seu plano para Platinum. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsChanging(false);
    }
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
  };

  const getPeriodicityText = (periodicity: string) => {
    const texts: { [key: string]: string } = {
      'mensal': 'por mês',
      'trimestral': 'por trimestre',
      'semestral': 'por semestre',
      'anual': 'por ano'
    };
    return texts[periodicity] || 'por mês';
  };

  const getPlanBenefits = (planId: string): string[] => {
    const benefits: { [key: string]: string[] } = {
      eco: [
        "Participação no Clube com benefícios básicos",
        "Descontos em parceiros selecionados (cafés, restaurantes, lojas)",
        "Acesso às missões simples dentro do app",
        "Relatórios mensais de impacto social"
      ],
      voz: [
        "Todos os benefícios do Eco +",
        "Acesso a prêmios de experiências ou produtos",
        "Mais pontos por check-ins e missões concluídas",
        "Descontos maiores em parceiros do Grito",
        "Brindes exclusivos da Griffte / Outlet Social",
        "Pontuação em dobro nas missões do app"
      ],
      grito: [
        "Todos os benefícios anteriores",
        "Acesso VIP a eventos exclusivos",
        "Mentoria com líderes sociais",
        "Participação em projetos especiais",
        "Suporte prioritário 24/7"
      ],
      platinum: [
        "Todos os benefícios do Grito +",
        "Créditos extras para sorteios e prêmios",
        "Acesso a experiências de bem-estar (ex.: sessões fitness, cultura, turismo social)",
        "Presentes e produtos oficiais do Grito (Griffte, Outlet Social)",
        "Reconhecimento dentro do app"
      ]
    };
    return benefits[planId] || [];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Logo size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-50 py-4">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              const urlParams = new URLSearchParams(window.location.search);
              const isDevAccess = urlParams.get('dev_access') === 'true';
              const isFromDevPanel = urlParams.get('origin') === 'dev_panel';
              if (isDevAccess || isFromDevPanel) {
                window.close();
              } else {
                setLocation("/welcome");
              }
            }}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <Logo size="md" />
          
          <div className="w-12"></div>
        </div>
        {currentUser?.nome?.includes("Desenvolvedor") && (
          <div className="text-center mt-2">
            <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded inline-block">
              🔧 Modo Desenvolvedor - Demonstração
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-black mb-2">
            Alterar seu Plano
          </h2>
          <p className="text-lg text-gray-600 mb-4">
            Plano atual: <span className="font-semibold">{currentUser?.plano ? planDetails[currentUser.plano as keyof typeof planDetails]?.name : "Eco"}</span>
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-center text-blue-800">
              <TrendingUp className="w-5 h-5 mr-2" />
              <span className="font-medium">A mudança será aplicada na próxima cobrança</span>
            </div>
          </div>
        </div>

        {/* Plans Carousel - IGUAL AO PLANS.TSX */}
        <div className="embla overflow-hidden" ref={emblaRef}>
          <div className="embla__container flex gap-4 px-8 pb-8">
            {Object.entries(planDetails).map(([planId, plan]) => {
              // Skip platinum and diamante plans (serão adicionados separadamente)
              if (planId === 'platinum' || planId === 'diamante') {
                return null;
              }

              const planPrice = planPrices[planId as keyof typeof planPrices];
              const primaryPrice = planPrice?.mensal || { display: "Personalizado" };
              const isCurrentPlan = planId === currentUser?.plano;
              
              // Verificar se seria downgrade (comparar com valor mensal mínimo do plano)
              const wouldBeDowngrade = !isCurrentPlan && isDowngrade(planId, 'mensal');
              
              // LOG DETALHADO para debug
              console.log(`[CARD ${planId.toUpperCase()}]`, {
                isCurrentPlan,
                wouldBeDowngrade,
                currentUser: {
                  plano: currentUser?.plano,
                  valorPersonalizado: currentUser?.valorPersonalizado,
                  periodoDoacacao: currentUser?.periodoDoacacao
                }
              });
              
              // Render regular plans (eco, voz, grito)
              return (
                <div 
                  key={planId}
                  className="embla__slide flex-none cursor-pointer transition-all duration-300"
                  style={{ width: '300px', minWidth: '300px' }}
                >
                  {/* Card Regular */}
                  <div className={`rounded-3xl shadow-lg h-[550px] grid grid-rows-[auto_auto_1fr_auto] p-6 ${
                    isCurrentPlan 
                      ? 'bg-gray-100 border-2 border-gray-400' 
                      : planId === 'voz' 
                      ? 'bg-white border-4 border-green-500' 
                      : 'bg-white border border-gray-200'
                  }`}>
                    
                    {/* Badge interno para planos populares ou plano atual */}
                    <div className="flex justify-center mb-4">
                      {isCurrentPlan ? (
                        <div className="bg-gray-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                          PLANO ATUAL
                        </div>
                      ) : (
                        'popular' in plan && plan.popular && !wouldBeDowngrade && (
                          <div className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                            POPULAR
                          </div>
                        )
                      )}
                    </div>
                    
                    {/* Título e Preço */}
                    <div className="text-center mb-4">
                      <h3 className={`text-2xl font-bold mb-2 ${isCurrentPlan ? 'text-gray-500' : 'text-gray-800'}`} style={{ fontFamily: 'Inter' }}>
                        {plan.name.toUpperCase()}
                      </h3>
                      <p className={`text-sm mb-4 ${isCurrentPlan ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontFamily: 'Inter' }}>
                        {plan.description}
                      </p>
                      <div className={`text-3xl font-bold ${isCurrentPlan ? 'text-gray-500' : 'text-gray-800'}`} style={{ fontFamily: 'Inter' }}>
                        {primaryPrice.display}
                      </div>
                    </div>

                    {/* Lista de Benefícios - Scrollable */}
                    <div className="overflow-y-auto space-y-3 pr-2">
                      {getPlanBenefits(planId).map((benefit, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="mt-1 flex-shrink-0">
                            <Check className={`w-5 h-5 ${isCurrentPlan ? 'text-gray-400' : 'text-green-500'}`} />
                          </div>
                          <span className={`text-sm leading-relaxed ${isCurrentPlan ? 'text-gray-400' : 'text-gray-700'}`} style={{ fontFamily: 'Inter' }}>
                            {benefit}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Botão fixo */}
                    <div className="pt-4">
                      <Button 
                        className={`w-full rounded-full font-semibold py-3 text-base shadow-md transition-all duration-200 ${
                          isCurrentPlan || wouldBeDowngrade
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                        style={{ fontFamily: 'Inter' }}
                        onClick={() => handlePlanSelect(planId)}
                        disabled={isCurrentPlan || wouldBeDowngrade || isChanging}
                        data-testid={`button-select-plan-${planId}`}
                      >
                        {isCurrentPlan ? "Plano Atual" : wouldBeDowngrade ? "Downgrade não permitido" : "Quero impactar!"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Card de Valor Livre - PLATINUM */}
            <div 
              className="embla__slide flex-none cursor-pointer transition-all duration-300"
              style={{ width: '300px', minWidth: '300px' }}
            >
              {/* Wrapper Valor Livre com gradiente especial */}
              <div className={`p-1 rounded-3xl h-[550px] ${
                currentUser?.plano === 'platinum' 
                  ? 'bg-gray-300' 
                  : 'bg-gradient-to-br from-blue-400 to-purple-600'
              }`}>
                <div className={`rounded-3xl shadow-lg h-full grid grid-rows-[auto_auto_1fr_auto] p-6 ${
                  currentUser?.plano === 'platinum' ? 'bg-gray-100' : 'bg-white'
                }`}>
                  
                  {/* Badge interno */}
                  <div className="flex justify-center mb-4">
                    {currentUser?.plano === 'platinum' ? (
                      <div className="bg-gray-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        PLANO ATUAL
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        <Sparkles className="w-4 h-4 inline mr-1" />
                        SEJA PLATINUM
                      </div>
                    )}
                  </div>
                  
                  {/* Título e Descrição */}
                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-bold mb-2 text-gray-800" style={{ fontFamily: 'Inter' }}>
                      PLATINUM
                    </h3>
                    <p className="text-sm mb-4 text-gray-600" style={{ fontFamily: 'Inter' }}>
                      {currentUser?.plano === 'platinum' ? 'Aumente sua contribuição mensal' : 'Cobrança mensal automática no valor que você escolher'}
                    </p>
                    <div className={`font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 ${
                      currentUser?.plano === 'platinum' ? 'text-xl' : 'text-3xl'
                    }`} style={{ fontFamily: 'Inter' }}>
                      {currentUser?.plano === 'platinum' ? 'AUMENTE SUA DOAÇÃO!' : 'ESCOLHA SEU VALOR'}
                    </div>
                  </div>

                  {/* Lista de Benefícios - Scrollable */}
                  <div className="overflow-y-auto space-y-3 pr-2">
                    {[
                      "Flexibilidade total para escolher seu valor de contribuição",
                      "Todos os benefícios do plano Platinum incluídos",
                      "Gritos proporcionais ao valor doado",
                      "Pagamento via PIX ou Cartão de Crédito",
                      "Seu impacto, sua escolha!",
                      "Todos os benefícios do Grito +",
                      "Créditos extras para sorteios e prêmios",
                      "Acesso a experiências de bem-estar (ex.: sessões fitness, cultura, turismo social)",
                      "Presentes e produtos oficiais do Grito (Griffte, Outlet Social)",
                      "Reconhecimento dentro do app"
                    ].map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          <Check className="w-5 h-5 text-green-500" />
                        </div>
                        <span className="text-sm leading-relaxed text-gray-700" style={{ fontFamily: 'Inter' }}>
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Botão fixo */}
                  <div className="pt-4">
                    <Button 
                      className={`w-full rounded-full font-semibold py-3 text-base shadow-md transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white`}
                      style={{ fontFamily: 'Inter' }}
                      onClick={handleCustomValueClick}
                      disabled={isChanging}
                      data-testid="button-select-custom-value"
                    >
                      {currentUser?.plano === 'platinum' ? "Aumentar meu impacto!" : "Escolher meu valor!"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* Modal de Periodicidade */}
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

      {/* Modal de Valor Customizado (Platinum) */}
      <Dialog open={isCustomValueModalOpen} onOpenChange={setIsCustomValueModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'Inter' }}>
              <Sparkles className="w-5 h-5 text-purple-500" />
              {currentUser?.plano === 'platinum' ? 'Aumentar contribuição' : 'Digite seu valor'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-2">
            
            {/* Mensagem informativa para usuários Platinum */}
            {currentUser?.plano === 'platinum' && currentUser?.valorPersonalizado && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800 font-semibold" style={{ fontFamily: 'Inter' }}>
                  Seu valor atual: R$ {parseFloat(currentUser.valorPersonalizado).toFixed(2).replace('.', ',')}
                </p>
                <p className="text-xs text-blue-600 mt-1" style={{ fontFamily: 'Inter' }}>
                  Você pode apenas aumentar seu valor de contribuição
                </p>
              </div>
            )}
            
            {/* Input de Valor */}
            <div className="space-y-2">
              <Label htmlFor="custom-value" className="text-gray-700" style={{ fontFamily: 'Inter' }}>
                {currentUser?.plano === 'platinum' ? 'Novo valor da contribuição mensal' : 'Valor da contribuição mensal'}
              </Label>
              <Input
                id="custom-value"
                type="text"
                inputMode="numeric"
                placeholder="R$ 50,00"
                value={customValue}
                onChange={handleValueChange}
                className="w-full h-16 text-2xl text-center border-2 border-purple-500 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus-visible:ring-purple-400 focus-visible:ring-offset-0"
                style={{ 
                  fontFamily: 'Inter', 
                  fontSize: '24px',
                  fontWeight: '600',
                  backgroundColor: '#FFFFFF'
                }}
                disabled={isChanging}
              />
              <p className="text-xs text-gray-500 text-center">
                Valor mínimo: R$ {
                  currentUser?.plano === 'platinum' && currentUser?.valorPersonalizado
                    ? (parseFloat(currentUser.valorPersonalizado) + 0.01).toFixed(2).replace('.', ',')
                    : '30,00'
                }
              </p>
            </div>
            
            {/* Seleção de Periodicidade */}
            <div className="space-y-2">
              <Label className="text-gray-700" style={{ fontFamily: 'Inter' }}>
                Periodicidade do pagamento
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {['mensal', 'trimestral', 'semestral', 'anual'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setCustomPeriodicity(period)}
                    className={`p-3 border-2 rounded-xl transition-all ${
                      customPeriodicity === period
                        ? 'border-purple-500 bg-purple-50 text-purple-700 font-semibold'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                    style={{ fontFamily: 'Inter' }}
                    disabled={isChanging}
                  >
                    {periodicityLabels[period as keyof typeof periodicityLabels]}
                  </button>
                ))}
              </div>
              
              {/* Cálculo do valor total */}
              {customValue && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mt-2">
                  <p className="text-sm text-purple-800 text-center font-semibold" style={{ fontFamily: 'Inter' }}>
                    Valor total: R$ {
                      (() => {
                        const monthlyValue = parseFloat(customValue.replace(/[^\d,]/g, '').replace(',', '.'));
                        const months = customPeriodicity === 'mensal' ? 1 : customPeriodicity === 'trimestral' ? 3 : customPeriodicity === 'semestral' ? 6 : 12;
                        return isNaN(monthlyValue) ? '0,00' : (monthlyValue * months).toFixed(2).replace('.', ',');
                      })()
                    }
                  </p>
                  <p className="text-xs text-purple-600 text-center mt-1" style={{ fontFamily: 'Inter' }}>
                    Cobrança {periodicityLabels[customPeriodicity as keyof typeof periodicityLabels].toLowerCase()}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsCustomValueModalOpen(false)}
                className="flex-1 rounded-2xl"
                disabled={isChanging}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCustomValue}
                disabled={!customValue || isChanging}
                className="flex-1 rounded-2xl bg-purple-600 hover:bg-purple-700"
              >
                {isChanging ? "Processando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação */}
      {showConfirmModal && planToChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-center mb-4">Confirmar Alteração</h3>
              <p className="text-gray-600 text-center mb-6">
                Você está alterando para o plano <strong>{planDetails[planToChange as keyof typeof planDetails]?.name}</strong>
                {periodicityToChange && ` (${periodicityLabels[periodicityToChange as keyof typeof periodicityLabels]})`}.
              </p>
              <p className="text-sm text-gray-500 text-center mb-6">
                A mudança será aplicada na próxima cobrança. Não há cobrança imediata.
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPlanToChange(null);
                    setPeriodicityToChange(null);
                  }}
                  className="flex-1"
                  disabled={isChanging}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmChangePlan}
                  disabled={isChanging}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {isChanging ? "Processando..." : "Confirmar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
