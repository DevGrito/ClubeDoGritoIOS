import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, PaymentRequestButtonElement, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Smartphone, Check, Calendar, Sparkles, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import coneImage from "@assets/image_1764861877259.png";
import { planPrices, planDetails } from "@/lib/stripe";
import useEmblaCarousel from 'embla-carousel-react';

const periodicityLabels: Record<string, string> = {
  'mensal': 'Mensal',
  'trimestral': 'Trimestral', 
  'semestral': 'Semestral',
  'anual': 'Anual'
};

const getPeriodicityText = (periodicity: string) => {
  const texts: Record<string, string> = {
    'mensal': 'por mês',
    'trimestral': 'por trimestre',
    'semestral': 'por semestre',
    'anual': 'por ano'
  };
  return texts[periodicity] || 'por mês';
};

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "pk_test_51RdaS1Qlsea8vAKZC1WmSHcCGXNGGTxJuLZ3iq90MUpeCxq5CUhj5C2QwmHWO008hWIMSaZ0yh75EzrSUpXyvTs6002cYD8L9l");

interface PlanoAnterior {
  nome: string;
  valor: number;
  valorCentavos: number;
  periodicidade: string;
  priceId: string;
  status: string;
}

interface PlanoOpcao {
  id: string;
  nome: string;
  valor: number;
  valorCentavos: number;
  isAnterior: boolean;
  isUpgrade: boolean;
  color: string;
}

const planOrder = ['eco', 'voz', 'grito', 'platinum'];

// Função para obter benefícios de cada plano (sincronizado com /plans)
const getPlanBenefits = (planId: string): string[] => {
  switch (planId) {
    case 'eco':
      return [
        "Participação no Clube com benefícios básicos",
        "Descontos em parceiros selecionados",
        "Acesso às missões simples dentro do app",
        "Relatórios mensais de impacto social"
      ];
    case 'voz':
      return [
        "Todos os benefícios do Eco +",
        "Acesso a prêmios de experiências ou produtos",
        "Mais pontos por check-ins e missões",
        "Descontos maiores em parceiros do Grito"
      ];
    case 'grito':
      return [
        "Todos os benefícios anteriores",
        "Acesso VIP a eventos exclusivos",
        "Mentoria com líderes sociais",
        "Participação em projetos especiais"
      ];
    case 'platinum':
      return [
        "Todos os benefícios do Grito +",
        "Créditos extras para sorteios e prêmios",
        "Experiências de bem-estar exclusivas",
        "Presentes e produtos oficiais do Grito"
      ];
    default:
      return [
        "Benefícios básicos do clube",
        "Acesso à plataforma"
      ];
  }
};

interface ReactivateFormProps {
  onPaymentReady: (secret: string, subId: string, plano: PlanoOpcao, periodicity: string) => void;
}

function ReactivateForm({ onPaymentReady }: ReactivateFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);
  const [showAppleGooglePay, setShowAppleGooglePay] = useState(false);
  const [planoAnterior, setPlanoAnterior] = useState<PlanoAnterior | null>(null);
  const [loadingPlano, setLoadingPlano] = useState(true);
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoOpcao | null>(null);
  const [planosDisponiveis, setPlanosDisponiveis] = useState<PlanoOpcao[]>([]);
  const [isPeriodicityModalOpen, setIsPeriodicityModalOpen] = useState(false);
  const [selectedPlanForPeriodicity, setSelectedPlanForPeriodicity] = useState<string>("");
  const [selectedPeriodicity, setSelectedPeriodicity] = useState<string>("mensal");
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);
  
  // Embla Carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false, 
    align: 'center',
    containScroll: 'trimSnaps'
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };
    
    emblaApi.on('select', onSelect);
    onSelect();
    
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    const fetchPlanoAnterior = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          console.log('⚠️ [REACTIVATE] Sem userId no localStorage');
          setLoadingPlano(false);
          return;
        }

        const response = await fetch('/api/billing/previous-plan', {
          credentials: 'include',
          headers: {
            'x-user-id': userId
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.plano) {
            setPlanoAnterior(data.plano);
            console.log('[REACTIVATE] Plano anterior recebido:', data.plano);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar plano anterior:', error);
      } finally {
        setLoadingPlano(false);
      }
    };

    fetchPlanoAnterior();
  }, []);

  // Calcular planos disponíveis baseado na HIERARQUIA do plano anterior
  // Hierarquia: eco(0) < voz(1) < grito(2) < platinum(3)
  useEffect(() => {
    if (!planoAnterior) return;

    // Identificar o plano pelo VALOR MENSAL EQUIVALENTE
    // (considerando que trimestral/anual têm valores totais maiores)
    const valorTotal = planoAnterior.valorCentavos;
    const periodicidade = planoAnterior.periodicidade?.toLowerCase() || 'mensal';
    
    // Calcular valor mensal equivalente
    let valorMensal = valorTotal;
    if (periodicidade.includes('trimestral') || periodicidade === 'quarter') {
      valorMensal = Math.round(valorTotal / 3);
    } else if (periodicidade.includes('semestral')) {
      valorMensal = Math.round(valorTotal / 6);
    } else if (periodicidade.includes('anual') || periodicidade === 'year') {
      valorMensal = Math.round(valorTotal / 12);
    }
    
    let planIdAnterior = 'eco'; // default
    
    // Mapear valor mensal para plano
    if (valorMensal <= 990) planIdAnterior = 'eco';           // R$ 9,90/mês
    else if (valorMensal <= 1990) planIdAnterior = 'voz';     // R$ 19,90/mês
    else if (valorMensal <= 2990) planIdAnterior = 'grito';   // R$ 29,90/mês
    else planIdAnterior = 'platinum';                          // acima de R$ 29,90/mês
    
    // Encontrar o índice do plano anterior na hierarquia
    const tierAnterior = planOrder.indexOf(planIdAnterior);
    console.log(`[REACTIVATE] Plano anterior: ${planoAnterior.nome} (R$ ${valorTotal/100} ${periodicidade}, mensal equiv: R$ ${valorMensal/100}) -> ${planIdAnterior} (tier ${tierAnterior})`);
    
    const opcoes: PlanoOpcao[] = [];

    // Adicionar todos os planos que estão no mesmo tier ou acima
    for (let i = 0; i < planOrder.length; i++) {
      const planId = planOrder[i];
      
      // Pular planos abaixo do tier anterior (não mostrar downgrades)
      if (i < tierAnterior) continue;
      
      const planInfo = planDetails[planId as keyof typeof planDetails];
      const planPrice = planPrices[planId as keyof typeof planPrices];
      
      if (planInfo && planPrice) {
        const valorPlano = planPrice.mensal.price;
        const isAnterior = planId === planIdAnterior;
        
        opcoes.push({
          id: planId,
          nome: planInfo.name,
          valor: valorPlano / 100,
          valorCentavos: valorPlano,
          isAnterior,
          isUpgrade: !isAnterior,
          color: planInfo.color
        });
      }
    }

    console.log('[REACTIVATE] Planos disponíveis (filtrados por tier):', opcoes.map(p => p.nome));
    setPlanosDisponiveis(opcoes);
    
    // Selecionar o primeiro plano (que deve ser o plano anterior)
    if (opcoes.length > 0) {
      setPlanoSelecionado(opcoes[0]);
    }
  }, [planoAnterior]);

  useEffect(() => {
    if (!stripe || !planoSelecionado) return;

    const pr = stripe.paymentRequest({
      country: 'BR',
      currency: 'brl',
      total: {
        label: `Reativar ${planoSelecionado.nome} - Clube do Grito`,
        amount: planoSelecionado.valorCentavos,
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr);
        setCanMakePayment(true);
        setShowAppleGooglePay(true);
      }
    });

    pr.on('paymentmethod', async (event) => {
      try {
        setIsProcessing(true);

        const userId = localStorage.getItem('userId') || '';
        const setupResponse = await fetch('/api/billing/reactivate-with-setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
          credentials: 'include',
          body: JSON.stringify({
            planoId: planoSelecionado?.id,
            valorCentavos: planoSelecionado?.valorCentavos,
            periodicity: selectedPeriodicity
          })
        });

        const setupData = await setupResponse.json();

        if (!setupResponse.ok) {
          throw new Error(setupData.message || 'Erro ao iniciar reativação');
        }

        if (setupData.secretType === 'payment') {
          const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
            setupData.clientSecret,
            { payment_method: event.paymentMethod.id },
            { handleActions: false }
          );

          if (confirmError) {
            event.complete('fail');
            throw new Error(confirmError.message);
          }

          if (paymentIntent.status === 'requires_action') {
            const { error: actionError } = await stripe.confirmCardPayment(setupData.clientSecret);
            if (actionError) {
              event.complete('fail');
              throw new Error(actionError.message);
            }
          }
        } else {
          const { error: confirmError } = await stripe.confirmCardSetup(
            setupData.clientSecret,
            { payment_method: event.paymentMethod.id }
          );

          if (confirmError) {
            event.complete('fail');
            throw new Error(confirmError.message);
          }
        }

        event.complete('success');

        const confirmResponse = await fetch('/api/billing/reactivate-confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
          credentials: 'include',
          body: JSON.stringify({
            subscriptionId: setupData.subscriptionId,
            paymentMethodId: event.paymentMethod.id
          })
        });

        const confirmData = await confirmResponse.json();

        if (!confirmResponse.ok) {
          throw new Error(confirmData.message || 'Erro ao confirmar reativação');
        }

        localStorage.setItem('hasActiveSubscription', 'true');
        localStorage.setItem('subscriptionId', confirmData.subscriptionId);

        toast({
          title: "Assinatura reativada!",
          description: "Bem-vindo de volta ao Clube do Grito!",
        });

        setTimeout(() => {
          setLocation('/');
          window.location.reload();
        }, 1500);

      } catch (error: any) {
        console.error('Erro ao reativar com Apple/Google Pay:', error);
        toast({
          title: "Erro ao reativar",
          description: error.message || "Ocorreu um erro. Tente novamente.",
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
      }
    });

    return () => {
      pr.off('paymentmethod');
    };
  }, [stripe, planoSelecionado, toast, setLocation]);

  const handleCardReactivate = async () => {
    if (!stripe || !elements) {
      toast({
        title: "Erro",
        description: "Sistema de pagamento não carregado. Tente novamente.",
        variant: "destructive"
      });
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast({
        title: "Erro",
        description: "Por favor, preencha os dados do cartão.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const userId = localStorage.getItem('userId') || '';
      
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (pmError) {
        throw new Error(pmError.message);
      }

      const setupResponse = await fetch('/api/billing/reactivate-with-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        credentials: 'include',
        body: JSON.stringify({
          planoId: planoSelecionado?.id,
          valorCentavos: planoSelecionado?.valorCentavos,
          periodicity: selectedPeriodicity
        })
      });

      const setupData = await setupResponse.json();

      if (!setupResponse.ok) {
        throw new Error(setupData.message || 'Erro ao iniciar reativação');
      }

      if (setupData.secretType === 'payment') {
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          setupData.clientSecret,
          { payment_method: paymentMethod.id }
        );

        if (confirmError) {
          throw new Error(confirmError.message);
        }

        if (paymentIntent?.status !== 'succeeded' && paymentIntent?.status !== 'requires_capture') {
          throw new Error('Pagamento não foi concluído');
        }
      } else {
        const { error: setupError } = await stripe.confirmCardSetup(
          setupData.clientSecret,
          { payment_method: paymentMethod.id }
        );

        if (setupError) {
          throw new Error(setupError.message);
        }
      }

      const confirmResponse = await fetch('/api/billing/reactivate-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        credentials: 'include',
        body: JSON.stringify({
          subscriptionId: setupData.subscriptionId,
          paymentMethodId: paymentMethod.id
        })
      });

      const confirmData = await confirmResponse.json();

      if (!confirmResponse.ok) {
        throw new Error(confirmData.message || 'Erro ao confirmar reativação');
      }

      localStorage.setItem('hasActiveSubscription', 'true');
      localStorage.setItem('subscriptionId', confirmData.subscriptionId);

      toast({
        title: "Assinatura reativada!",
        description: "Bem-vindo de volta ao Clube do Grito!",
      });

      setTimeout(() => {
        setLocation('/');
        window.location.reload();
      }, 1500);

    } catch (error: any) {
      console.error('Erro ao reativar com cartão:', error);
      toast({
        title: "Erro ao reativar",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loadingPlano) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFD700]" />
      </div>
    );
  }

  // Etapa 1: Tela inicial - Mostra que a assinatura está pausada
  if (!showPaymentOptions) {
    return (
      <div className="w-full max-w-sm px-6">
        <img 
          src={coneImage} 
          alt="Cone dizendo OOPS!" 
          className="w-56 h-auto mb-6 self-center mx-auto"
          data-testid="img-pause-cone"
        />

        <div className="text-left">
          <h1 className="text-2xl font-normal text-gray-900 mb-0">
            Sua assinatura
          </h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-0">
            deu uma pausa.
          </h2>
        </div>

        <div className="pt-16">
          <Button 
            onClick={() => setShowPaymentOptions(true)}
            className="w-[90%] mx-auto flex items-center justify-center bg-[#22C55E] hover:bg-[#16A34A] text-white font-medium py-4 rounded-xl text-base transition-all duration-200 hover:scale-105 active:scale-95"
            data-testid="button-continue-subscription"
          >
            Bora continuar Ecoando Vozes?
          </Button>

          <button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              setLocation('/');
              window.location.reload();
            }}
            className="w-full mt-8 py-3 text-gray-500 text-sm flex items-center justify-center gap-2 hover:text-gray-700 transition-colors"
            data-testid="button-logout-paused"
          >
            <LogOut className="w-4 h-4" />
            Sair da conta
          </button>
        </div>
      </div>
    );
  }

  // Handler para selecionar plano e abrir modal de periodicidade
  const handlePlanSelect = (planId: string) => {
    setSelectedPlanForPeriodicity(planId);
    setIsPeriodicityModalOpen(true);
  };

  // Handler para selecionar periodicidade e ir para pagamento
  const handlePeriodicitySelect = async (planId: string, periodicity: string) => {
    setSelectedPeriodicity(periodicity);
    setIsPeriodicityModalOpen(false);
    setIsPreparingPayment(true);
    
    // Encontrar o plano selecionado
    const plano = planosDisponiveis.find(p => p.id === planId);
    let planoAtualizado = plano;
    
    if (plano) {
      // Atualizar o valor com base na periodicidade
      const planPrice = planPrices[planId as keyof typeof planPrices];
      const periodicityPrice = planPrice?.[periodicity as keyof typeof planPrice];
      
      if (periodicityPrice) {
        planoAtualizado = {
          ...plano,
          valor: periodicityPrice.price / 100,
          valorCentavos: periodicityPrice.price
        };
      }
    }
    
    // Criar setup para obter clientSecret
    try {
      const userId = localStorage.getItem('userId') || '';
      const setupResponse = await fetch('/api/billing/reactivate-with-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        credentials: 'include',
        body: JSON.stringify({
          planoId: planId,
          valorCentavos: planoAtualizado?.valorCentavos || plano?.valorCentavos,
          periodicity: periodicity
        })
      });
      
      const setupData = await setupResponse.json();
      
      if (!setupResponse.ok) {
        throw new Error(setupData.message || 'Erro ao preparar pagamento');
      }
      
      // Chamar callback para mostrar formulário de pagamento
      if (planoAtualizado) {
        onPaymentReady(setupData.clientSecret, setupData.subscriptionId, planoAtualizado, periodicity);
      }
    } catch (error: any) {
      console.error('Erro ao preparar pagamento:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível preparar o pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsPreparingPayment(false);
    }
  };

  // Etapa 2: Mostra carrossel de planos e opções de pagamento
  return (
    <>
      <div className="w-full max-w-md space-y-6 pt-16">
          {/* Botão Voltar */}
          <div className="px-4">
            <button 
              onClick={() => setShowPaymentOptions(false)}
              className="bg-[#FFD700] hover:bg-[#E6C200] text-black text-xs font-medium py-1.5 px-4 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
              data-testid="button-back-to-initial"
            >
              VOLTAR
            </button>
          </div>

          {/* Título */}
          <div className="text-left px-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Escolha seu plano
            </h2>
            {planoAnterior && (
              <p className="text-sm text-gray-500 mb-2">
                Seu plano anterior era R$ {planoAnterior.valor.toFixed(2).replace('.', ',')}
                {planoAnterior.periodicidade === 'mensal' && '/mês'}
                {planoAnterior.periodicidade === 'trimestral' && '/trimestre'}
                {planoAnterior.periodicidade === 'semestral' && '/semestre'}
                {planoAnterior.periodicidade === 'anual' && '/ano'}
                {!['mensal', 'trimestral', 'semestral', 'anual'].includes(planoAnterior.periodicidade) && `/${planoAnterior.periodicidade}`}
              </p>
            )}
            <p className="text-sm font-medium" style={{ color: '#111827' }}>
              Aumente seu plano e ganhe mais benefícios!
            </p>
          </div>

          {/* Carrossel de Planos - FILTRADO PELO PLANO ANTERIOR */}
          {planosDisponiveis.length > 0 && (
            <div className="embla overflow-hidden" ref={emblaRef}>
              <div className="embla__container flex gap-4 px-8 pb-8">
                {planosDisponiveis.map((plano) => {
                  const planInfo = planDetails[plano.id as keyof typeof planDetails];
                  const planPrice = planPrices[plano.id as keyof typeof planPrices];
                  const primaryPrice = planPrice?.mensal || { display: `R$ ${plano.valor.toFixed(2).replace('.', ',')}` };
                  
                  // Card especial para Platinum com gradiente
                  if (plano.id === 'platinum') {
                    return (
                      <div 
                        key={plano.id}
                        className="embla__slide flex-none cursor-pointer transition-all duration-300"
                        style={{ width: '300px', minWidth: '300px' }}
                      >
                        {/* Wrapper Platinum com gradiente especial */}
                        <div className={`bg-gradient-to-br from-blue-400 to-purple-600 p-1 rounded-3xl h-[550px] ${plano.isAnterior ? 'ring-4 ring-blue-500' : ''}`}>
                          <div className="bg-white rounded-3xl h-full grid grid-rows-[auto_auto_1fr_auto] p-6">
                            
                            {/* Badge interno */}
                            <div className="flex justify-center mb-4">
                              {plano.isAnterior ? (
                                <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                  SEU PLANO
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
                              <h3 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Inter' }}>
                                PLATINUM
                              </h3>
                              <p className="text-gray-600 text-sm mb-4" style={{ fontFamily: 'Inter' }}>
                                Cobrança mensal automática no valor que você escolher
                              </p>
                              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600" style={{ fontFamily: 'Inter' }}>
                                ESCOLHA SEU VALOR
                              </div>
                            </div>

                            {/* Lista de Benefícios - Scrollable */}
                            <div className="overflow-y-auto space-y-3 pr-2">
                              <div className="flex items-start gap-3">
                                <div className="mt-1 flex-shrink-0">
                                  <Check className="w-5 h-5 text-green-500" />
                                </div>
                                <span className="text-gray-700 text-sm leading-relaxed" style={{ fontFamily: 'Inter' }}>
                                  Flexibilidade total para escolher seu valor
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
                                  Pagamento via PIX ou Cartão
                                </span>
                              </div>
                            </div>

                            {/* Botão fixo */}
                            <div className="pt-4">
                              <Button 
                                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full font-semibold py-3 text-base shadow-md transition-all duration-200"
                                style={{ fontFamily: 'Inter' }}
                                onClick={() => handlePlanSelect(plano.id)}
                                data-testid={`button-select-plan-${plano.id}`}
                              >
                                {plano.isAnterior ? 'Renovar meu plano!' : 'Escolher meu valor!'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  // Card regular para outros planos
                  return (
                    <div 
                      key={plano.id}
                      className="embla__slide flex-none cursor-pointer transition-all duration-300"
                      style={{ width: '300px', minWidth: '300px' }}
                    >
                      {/* Card Regular - IGUAL AO PLANS.TSX */}
                      <div className={`bg-white rounded-3xl h-[550px] grid grid-rows-[auto_auto_1fr_auto] p-6 ${
                        plano.isAnterior 
                          ? 'border-4 border-blue-500' 
                          : 'border border-gray-200'
                      }`}>
                        
                        {/* Badge */}
                        <div className="flex justify-center mb-4">
                          {plano.isAnterior ? (
                            <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                              SEU PLANO
                            </div>
                          ) : plano.isUpgrade ? (
                            <div className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                              UPGRADE
                            </div>
                          ) : null}
                        </div>
                        
                        {/* Título e Preço */}
                        <div className="text-center mb-4">
                          <h3 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Inter' }}>
                            {plano.nome.toUpperCase()}
                          </h3>
                          {planInfo && (
                            <p className="text-gray-600 text-sm mb-4" style={{ fontFamily: 'Inter' }}>
                              {planInfo.description}
                            </p>
                          )}
                          <div className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'Inter' }}>
                            {primaryPrice.display}
                          </div>
                        </div>

                        {/* Lista de Benefícios - Scrollable */}
                        <div className="overflow-y-auto space-y-3 pr-2">
                          {getPlanBenefits(plano.id).map((benefit, idx) => (
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

                        {/* Botão fixo - IGUAL AO PLANS.TSX */}
                        <div className="pt-4">
                          <Button 
                            className="w-full bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold py-3 text-base shadow-md transition-all duration-200"
                            style={{ fontFamily: 'Inter' }}
                            onClick={() => handlePlanSelect(plano.id)}
                            data-testid={`button-select-plan-${plano.id}`}
                          >
                            {plano.isAnterior ? 'Renovar meu plano!' : 'Quero impactar!'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal de Seleção de Periodicidade - IGUAL AO PLANS.TSX */}
        <Dialog open={isPeriodicityModalOpen} onOpenChange={(open) => !isPreparingPayment && setIsPeriodicityModalOpen(open)}>
          <DialogContent className="sm:max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'Inter' }}>
                <Calendar className="w-5 h-5 text-blue-500" />
                {isPreparingPayment ? 'Preparando pagamento...' : 'Escolha sua periodicidade'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 px-2">
              {isPreparingPayment ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-10 h-10 animate-spin text-green-500 mb-4" />
                  <p className="text-gray-600 text-center" style={{ fontFamily: 'Inter' }}>
                    Preparando sua assinatura...
                  </p>
                  <p className="text-gray-400 text-sm text-center mt-2" style={{ fontFamily: 'Inter' }}>
                    Isso leva apenas alguns segundos
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <p className="text-gray-600 mb-4" style={{ fontFamily: 'Inter' }}>
                      Selecione como deseja pagar pelo plano <strong>{selectedPlanForPeriodicity && planDetails[selectedPlanForPeriodicity as keyof typeof planDetails]?.name}</strong>
                    </p>
                  </div>
                  
                  {/* Lista de periodicidades disponíveis */}
                  <div className="space-y-2">
                    {selectedPlanForPeriodicity && planDetails[selectedPlanForPeriodicity as keyof typeof planDetails]?.periodicities.map((periodicity) => {
                      const periodicityData = planPrices[selectedPlanForPeriodicity as keyof typeof planPrices]?.[periodicity as keyof typeof planPrices[keyof typeof planPrices]];
                      if (!periodicityData) return null;
                      
                      return (
                        <button
                          key={periodicity}
                          onClick={() => handlePeriodicitySelect(selectedPlanForPeriodicity, periodicity)}
                          className="w-full p-4 border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left"
                          data-testid={`button-periodicity-${periodicity}`}
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
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
}

// Componente separado para o formulário de pagamento com clientSecret
function PaymentFormWithSecret({ 
  clientSecret, 
  subscriptionId, 
  planoSelecionado, 
  selectedPeriodicity,
  onBack,
  showAppleGooglePay,
  paymentRequest
}: { 
  clientSecret: string;
  subscriptionId: string;
  planoSelecionado: PlanoOpcao | null;
  selectedPeriodicity: string;
  onBack: () => void;
  showAppleGooglePay: boolean;
  paymentRequest: any;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [elementsReady, setElementsReady] = useState(false);
  const [walletStatus, setWalletStatus] = useState<string | null>(null);

  useEffect(() => {
    if (stripe && elements) {
      setElementsReady(true);
    }
  }, [stripe, elements]);

  // Configurar handler do Apple Pay / Google Pay
  useEffect(() => {
    if (!paymentRequest || !stripe) return;

    const handlePaymentMethod = async (event: any) => {
      setIsProcessing(true);
      try {
        const userId = localStorage.getItem('userId') || '';
        
        // Confirmar o SetupIntent com o método de pagamento do Apple Pay/Google Pay
        const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(
          clientSecret,
          { payment_method: event.paymentMethod.id },
          { handleActions: false }
        );

        if (confirmError) {
          event.complete('fail');
          throw new Error(confirmError.message);
        }

        event.complete('success');

        // Confirmar reativação no backend
        const payResponse = await fetch(`/api/subscriptions/${subscriptionId}/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
          body: JSON.stringify({
            paymentMethodId: event.paymentMethod.id,
          })
        });

        if (!payResponse.ok) {
          throw new Error('Falha ao processar pagamento');
        }

        localStorage.setItem('hasActiveSubscription', 'true');
        localStorage.setItem('subscriptionId', subscriptionId);

        toast({
          title: "Assinatura reativada!",
          description: "Bem-vindo de volta ao Clube do Grito!",
        });

        setTimeout(() => {
          setLocation('/');
          window.location.reload();
        }, 1500);

      } catch (error: any) {
        console.error('Erro ao reativar com Apple/Google Pay:', error);
        toast({
          title: "Erro ao reativar",
          description: error.message || "Ocorreu um erro. Tente novamente.",
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
      }
    };

    paymentRequest.on('paymentmethod', handlePaymentMethod);
    
    // Verificar status das carteiras
    paymentRequest.canMakePayment().then((result: any) => {
      if (result?.applePay) {
        setWalletStatus('Apple Pay disponível');
      } else if (result?.googlePay) {
        setWalletStatus('Google Pay disponível');
      } else if (result) {
        setWalletStatus('Carteira digital disponível');
      }
    });

    return () => {
      paymentRequest.off('paymentmethod', handlePaymentMethod);
    };
  }, [paymentRequest, stripe, clientSecret, subscriptionId, toast, setLocation]);

  const handlePaymentElement = async () => {
    if (!stripe || !elements) {
      toast({
        title: "Erro",
        description: "Sistema de pagamento não carregado. Tente novamente.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const userId = localStorage.getItem('userId') || '';
      
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          payment_method_data: {
            billing_details: {},
          },
        },
        redirect: "if_required",
      });

      if (error) {
        throw new Error(error.message);
      }

      if (setupIntent?.status === 'succeeded') {
        const payResponse = await fetch(`/api/subscriptions/${subscriptionId}/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
          body: JSON.stringify({
            paymentMethodId: setupIntent.payment_method,
          })
        });

        if (!payResponse.ok) {
          throw new Error('Falha ao processar pagamento');
        }

        localStorage.setItem('hasActiveSubscription', 'true');
        localStorage.setItem('subscriptionId', subscriptionId);

        toast({
          title: "Assinatura reativada!",
          description: "Bem-vindo de volta ao Clube do Grito!",
        });

        setTimeout(() => {
          setLocation('/');
          window.location.reload();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Erro ao reativar:', error);
      toast({
        title: "Erro no pagamento",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-sm text-center px-4 pt-8">
      <h1 className="text-lg font-bold mb-6" style={{ color: "#000000" }}>
        Reative sua assinatura!
      </h1>

      {/* Resumo do plano */}
      <div className="mb-6">
        <div className="p-3 rounded-lg" style={{ backgroundColor: "#F5F5F5" }}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-700">Plano selecionado</span>
            <span className="font-semibold text-sm text-gray-900">
              {planoSelecionado?.nome} - R$ {planoSelecionado?.valor.toFixed(2).replace('.', ',')}/{selectedPeriodicity === 'mensal' ? 'mês' : selectedPeriodicity}
            </span>
          </div>
        </div>
      </div>

      {/* Apple Pay / Google Pay */}
      {showAppleGooglePay && paymentRequest && (
        <div className="mb-6">
          <div className="rounded-xl p-4" style={{ backgroundColor: "#FFFFFF" }}>
            <PaymentRequestButtonElement
              options={{
                paymentRequest,
                style: {
                  paymentRequestButton: {
                    theme: "dark",
                    height: "48px",
                    type: "default",
                  },
                },
              }}
              className="w-full"
            />
          </div>

          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="px-3 text-sm text-gray-500">ou pague com cartão</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>
        </div>
      )}

      {/* PaymentElement - igual ao donation-flow */}
      <div className="mb-6">
        <div className="rounded-xl p-4 text-left border border-gray-200" style={{ backgroundColor: "#FFFFFF" }}>
          {elementsReady ? (
            <PaymentElement
              options={{
                layout: { type: "tabs", defaultCollapsed: false },
                paymentMethodOrder: ["card"],
                fields: { billingDetails: { name: "auto", email: "auto" } },
              }}
            />
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Carregando...</span>
            </div>
          )}

          <button
            onClick={handlePaymentElement}
            disabled={isProcessing || !stripe || !elements}
            className="w-full h-12 rounded-xl font-medium mt-6"
            style={{ 
              backgroundColor: isProcessing ? "#E5E5E5" : "#22C55E", 
              color: isProcessing ? "#999" : "#FFF" 
            }}
            data-testid="button-confirm-reactivate"
          >
            {isProcessing ? "Processando..." : "Reativar minha assinatura"}
          </button>
        </div>
      </div>

      <p className="text-sm text-center mb-4" style={{ color: "#B0B0B0" }}>
        {isProcessing
          ? "Processando pagamento..."
          : "Seus dados estão seguros e criptografados"}
      </p>

      <button 
        onClick={onBack}
        className="text-gray-500 text-sm hover:text-gray-700 transition-colors"
        data-testid="button-cancel-reactivate"
      >
        Voltar
      </button>
    </div>
  );
}

export default function AssinaturaPausada() {
  const [, setLocation] = useLocation();
  const [clientSecret, setClientSecret] = useState<string>("");
  const [subscriptionId, setSubscriptionId] = useState<string>("");
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoOpcao | null>(null);
  const [selectedPeriodicity, setSelectedPeriodicity] = useState<string>("mensal");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [showAppleGooglePay, setShowAppleGooglePay] = useState(false);

  useEffect(() => {
    const hasActive = localStorage.getItem('hasActiveSubscription');
    if (hasActive === 'true') {
      setLocation('/');
    }
  }, [setLocation]);

  // Configurar Apple Pay / Google Pay quando temos clientSecret e plano
  useEffect(() => {
    if (!clientSecret || !planoSelecionado) return;
    
    const setupPaymentRequest = async () => {
      const stripe = await stripePromise;
      if (!stripe) return;

      const pr = stripe.paymentRequest({
        country: 'BR',
        currency: 'brl',
        total: {
          label: `Reativar ${planoSelecionado.nome}`,
          amount: planoSelecionado.valorCentavos,
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      const canMake = await pr.canMakePayment();
      console.log('[REACTIVATE] PaymentRequest canMakePayment:', canMake);
      
      if (canMake) {
        setPaymentRequest(pr);
        setShowAppleGooglePay(true);
      } else {
        setShowAppleGooglePay(false);
      }
    };

    setupPaymentRequest();
  }, [clientSecret, planoSelecionado]);

  const handlePaymentReady = (secret: string, subId: string, plano: PlanoOpcao, periodicity: string) => {
    setIsTransitioning(true);
    setClientSecret(secret);
    setSubscriptionId(subId);
    setPlanoSelecionado(plano);
    setSelectedPeriodicity(periodicity);
    
    // Pequeno delay para mostrar transição suave
    setTimeout(() => {
      setShowPaymentForm(true);
      setIsTransitioning(false);
    }, 300);
  };

  const handleBackToPlans = () => {
    setShowPaymentForm(false);
    setClientSecret("");
    setPaymentRequest(null);
    setShowAppleGooglePay(false);
  };

  // Loading de transição entre seleção de plano e formulário de pagamento
  if (isTransitioning) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-8">
        <div className="flex flex-col items-center w-full max-w-md">
          <Loader2 className="w-12 h-12 animate-spin text-green-500 mb-4" />
          <p className="text-gray-600 text-center font-medium">Preparando seu pagamento...</p>
          <p className="text-gray-400 text-sm text-center mt-2">Isso leva apenas alguns segundos</p>
        </div>
      </div>
    );
  }

  // Se temos clientSecret, mostra o formulário de pagamento com Elements configurado
  // IMPORTANTE: Usar key diferente para forçar remount do Elements com clientSecret
  if (showPaymentForm && clientSecret) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-8">
        <div className="flex flex-col items-center w-full max-w-md">
          <Elements 
            key={`payment-elements-${clientSecret}`}
            stripe={stripePromise} 
            options={{ 
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#22C55E',
                },
              },
            }}
          >
            <PaymentFormWithSecret 
              clientSecret={clientSecret}
              subscriptionId={subscriptionId}
              planoSelecionado={planoSelecionado}
              selectedPeriodicity={selectedPeriodicity}
              onBack={handleBackToPlans}
              showAppleGooglePay={showAppleGooglePay}
              paymentRequest={paymentRequest}
            />
          </Elements>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-8">
      <div className="flex flex-col items-center w-full max-w-md">
        <Elements key="reactivate-form-elements" stripe={stripePromise}>
          <ReactivateForm onPaymentReady={handlePaymentReady} />
        </Elements>
      </div>
    </div>
  );
}
