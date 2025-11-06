import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, PaymentRequestButtonElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, CreditCard, Smartphone } from "lucide-react";
import Logo from "@/components/logo";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { planPrices, periodicityLabels } from "@/lib/stripe";

// Stripe setup
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "pk_test_51RdaS1Qlsea8vAKZC1WmSHcCGXNGGTxJuLZ3iq90MUpeCxq5CUhj5C2QwmHWO008hWIMSaZ0yh75EzrSUpXyvTs6002cYD8L9l");

interface AppleGooglePayProps {
  planInfo: any;
  onSuccess: () => void;
}

function AppleGooglePay({ planInfo, onSuccess }: AppleGooglePayProps) {
  const stripe = useStripe();
  const { toast } = useToast();
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (stripe) {
      const pr = stripe.paymentRequest({
        country: 'BR',
        currency: 'brl',
        total: {
          label: `${planInfo.name} - ${periodicityLabels[planInfo.periodicity as keyof typeof periodicityLabels] || 'Mensal'}`,
          amount: Math.round(planInfo.price * 100), // Use the numeric price
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      pr.canMakePayment().then(result => {
        if (result) {
          setPaymentRequest(pr);
        }
      });

      pr.on('paymentmethod', async (ev) => {
        setIsProcessing(true);
        try {
          // Criar assinatura no backend (userId é derivado da sessão autenticada)
          const subscriptionResponse = await fetch('/api/create-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              planId: planInfo.planId, // Use backend identifier, not display name
              paymentMethodId: ev.paymentMethod.id,
              periodicity: planInfo.periodicity,
              price: planInfo.price,
            }),
          });

          if (!subscriptionResponse.ok) {
            throw new Error('Erro ao criar assinatura');
          }

          const { clientSecret, subscriptionId, customerId } = await subscriptionResponse.json();

          // Confirmar pagamento
          const { error: confirmError } = await stripe.confirmCardPayment(clientSecret);

          if (confirmError) {
            ev.complete('fail');
            throw new Error(confirmError.message);
          }

          // Salvar dados da assinatura
          localStorage.setItem('subscriptionId', subscriptionId);
          localStorage.setItem('customerId', customerId);
          localStorage.setItem('isVerified', 'true');
          localStorage.setItem('userPapel', 'doador');
          localStorage.setItem('hasActiveSubscription', 'true');
          localStorage.setItem('firstTimeAccess', 'true');

          ev.complete('success');
          
          toast({
            title: 'Pagamento realizado com sucesso!',
            description: 'Sua assinatura mensal foi ativada! Redirecionando...',
          });

          setTimeout(onSuccess, 2000);
        } catch (error: any) {
          ev.complete('fail');
          toast({
            title: 'Erro no pagamento',
            description: error.message || 'Ocorreu um erro ao processar o pagamento.',
            variant: 'destructive',
          });
        } finally {
          setIsProcessing(false);
        }
      });
    }
  }, [stripe, planInfo, onSuccess, toast]);

  if (!paymentRequest) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-red-500 rounded-full flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Pagamento Rápido</h3>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Use Apple Pay, Google Pay ou Samsung Pay para pagamento instantâneo
        </p>
        
        <div className="bg-gray-50 rounded-xl p-4">
          <PaymentRequestButtonElement 
            options={{ paymentRequest }} 
            className="PaymentRequestButton w-full"
            onClick={() => setIsProcessing(true)}
          />
        </div>
        
        {isProcessing && (
          <p className="text-sm text-gray-500 text-center mt-3">
            Processando pagamento...
          </p>
        )}
      </div>
      
      <div className="flex items-center justify-center mb-6">
        <div className="flex-1 h-px bg-gray-200"></div>
        <span className="px-4 text-sm text-gray-500 bg-gray-50">ou</span>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>
    </div>
  );
}

interface PaymentFormProps {
  planInfo: any;
  onSuccess: () => void;
}

function PaymentForm({ planInfo, onSuccess }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Elemento do cartão não encontrado");
      }

      // Criar token do cartão
      const { token, error: tokenError } = await stripe.createToken(cardElement);
      if (tokenError || !token) {
        throw new Error(tokenError?.message || "Erro ao processar dados do cartão");
      }

      // Criar assinatura no backend (userId é derivado da sessão autenticada)
      const subscriptionResponse = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: planInfo.planId, // Use backend identifier, not display name
          paymentMethodId: token.id,
          periodicity: planInfo.periodicity,
          price: planInfo.price,
        }),
      });

      if (!subscriptionResponse.ok) {
        throw new Error('Erro ao criar assinatura');
      }

      const { clientSecret: subscriptionClientSecret, subscriptionId, customerId } = await subscriptionResponse.json();

      // Confirmar pagamento da assinatura
      const { error, paymentIntent } = await stripe.confirmCardPayment(subscriptionClientSecret);

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent?.status === "succeeded") {
        // Salvar dados da assinatura
        localStorage.setItem('subscriptionId', subscriptionId);
        localStorage.setItem('customerId', customerId);
        localStorage.setItem("isVerified", "true");
        localStorage.setItem("userPapel", "doador");
        localStorage.setItem("hasActiveSubscription", "true");
        localStorage.setItem("firstTimeAccess", "true");
        
        // Criar registro de histórico de doação
        await apiRequest("/api/donation/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            status: "succeeded",
            subscriptionId: subscriptionId,
          }),
        });

        toast({
          title: "Assinatura ativada com sucesso!",
          description: "Sua assinatura mensal foi configurada! Redirecionando...",
        });

        setTimeout(onSuccess, 2000);
      }
    } catch (error: any) {
      toast({
        title: "Erro no pagamento",
        description: error.message || "Ocorreu um erro ao processar o pagamento.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-red-500 rounded-full flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Dados do Cartão</h3>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-100 focus-within:border-yellow-400 transition-colors">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#374151",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  "::placeholder": {
                    color: "#9CA3AF",
                  },
                },
                invalid: {
                  color: "#EF4444",
                },
              },
              hidePostalCode: true,
            }}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full h-14 bg-gradient-to-r from-yellow-400 to-red-500 hover:from-yellow-500 hover:to-red-600 text-white font-semibold text-lg rounded-2xl shadow-lg transition-all duration-200"
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Processando...
          </div>
        ) : (
          `Doar ${planInfo.displayValue}`
        )}
      </Button>
    </form>
  );
}

export default function StripePayment() {
  const [, setLocation] = useLocation();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Get payment info from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const responseId = urlParams.get("responseId");
  const donationId = urlParams.get("donationId");
  const planId = urlParams.get("plan");
  const amount = urlParams.get("amount");
  const clientSecret = urlParams.get("clientSecret");
  const paymentIntentId = urlParams.get("paymentIntentId");
  const periodicity = urlParams.get("periodicity") || "mensal"; // Default to mensal

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    console.log('💳 Loading payment data with params:', {
      donationId,
      clientSecret: clientSecret ? 'Present' : 'Missing',
      paymentIntentId,
      planId,
      amount
    });
    
    // Check for donation flow (new system) - use URL params directly
    if (donationId && clientSecret && paymentIntentId) {
      console.log('✅ All required params present, setting payment data');
      setPaymentData({
        paymentIntentId: paymentIntentId,
        clientSecret: clientSecret,
        status: 'pending',
        userId: localStorage.getItem("donationUserId"),
        doadorId: donationId,
      });
      setIsLoading(false);
      return;
    }
    
    // Fallback - try to get from localStorage if URL params incomplete
    if (donationId) {
      const storedClientSecret = localStorage.getItem("clientSecret");
      const storedPaymentIntentId = localStorage.getItem("paymentIntentId");
      
      if (storedClientSecret && storedPaymentIntentId) {
        setPaymentData({
          paymentIntentId: storedPaymentIntentId,
          clientSecret: storedClientSecret,
          status: 'pending',
          userId: localStorage.getItem("donationUserId"),
          doadorId: donationId,
        });
        setIsLoading(false);
        return;
      }
      
      // Last resort - try backend call
      try {
        const result = await apiRequest("/api/donation/payment-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ donationId }),
        });

        if (result.success) {
          setPaymentData({
            paymentIntentId: result.paymentIntentId,
            clientSecret: result.clientSecret,
            status: 'pending',
            userId: result.userId,
            doadorId: donationId,
          });
        } else {
          throw new Error("Dados de pagamento não encontrados");
        }
      } catch (error: any) {
        toast({
          title: "Erro",
          description: "Erro ao carregar dados do pagamento. Tente novamente.",
          variant: "destructive",
        });
        setLocation("/plans");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Legacy flow for responseId (Typeform)
    if (!responseId) {
      toast({
        title: "Erro",
        description: "Dados de pagamento não encontrados. Redirecionando...",
        variant: "destructive",
      });
      setLocation("/plans");
      return;
    }

    try {
      // Para demonstração, criar dados simulados
      if (responseId.startsWith('demo_')) {
        const mockData = {
          paymentIntentId: `pi_demo_${Date.now()}`,
          clientSecret: `pi_demo_${Date.now()}_secret_demo`,
          status: 'pending',
          userId: 999,
          doadorId: 1,
        };
        setPaymentData(mockData);
        setIsLoading(false);
        return;
      }

      // Buscar dados do pagamento via API
      const result = await apiRequest("/api/typeform/payment-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseId }),
      });

      if (!result.paymentIntentId || !result.clientSecret) {
        throw new Error("Dados de pagamento não encontrados");
      }

      setPaymentData(result);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do pagamento. Tente novamente.",
        variant: "destructive",
      });
      setLocation("/plans");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Configure user session for first-time donor access
    localStorage.setItem("userId", paymentData?.userId?.toString() || "");
    localStorage.setItem("userPapel", "doador");
    localStorage.setItem("isVerified", "true");
    localStorage.setItem("userPlan", planId || "eco");
    localStorage.setItem("hasActiveSubscription", "true");
    localStorage.setItem("firstTimeAccess", "true");
    localStorage.setItem("hasDoadorRole", "true");
    
    // Flag para priorizar dashboard doador no próximo login
    sessionStorage.setItem("justCompletedDonation", "true");

    // Redirecionar para dashboard do doador
    setLocation("/tdoador");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do pagamento...</p>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Logo size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Erro ao carregar dados do pagamento.</p>
          <Button onClick={() => setLocation("/plans")} className="mt-4">
            Voltar aos Planos
          </Button>
        </div>
      </div>
    );
  }

  // CRITICAL: Plan validation to prevent incorrect charging
  const planInfo = (() => {
    console.log('💳 [PLAN VALIDATION] planId:', planId, 'amount:', amount);
    
    // Critical validation: Ensure both planId and amount are present
    if (!planId && !amount) {
      console.error('❌ [PLAN ERROR] Missing both planId and amount - this causes incorrect charging!');
      toast({
        title: "Erro de Configuração",
        description: "Informações do plano não encontradas. Redirecionando...",
        variant: "destructive",
      });
      setTimeout(() => setLocation("/plans"), 2000);
      return { 
        name: "Erro", 
        displayValue: "R$ 0,00", 
        planId: "eco" // Safe fallback for backend
      };
    }
    
    // CRITICAL: Separate display names from backend identifiers
    let planDisplayName = "Eco";
    let planAmount = "R$ 9,90";
    let backendPlanId = "eco"; // This is what gets sent to backend
    
    if (planId) {
      const normalizedPlanId = planId.toLowerCase();
      switch (normalizedPlanId) {
        case "eco":
          planDisplayName = "Eco";
          planAmount = amount ? `R$ ${parseFloat(amount).toFixed(2).replace('.', ',')}` : "R$ 9,90";
          backendPlanId = "eco";
          break;
        case "voz":
          planDisplayName = "Voz";
          planAmount = amount ? `R$ ${parseFloat(amount).toFixed(2).replace('.', ',')}` : "R$ 19,90";
          backendPlanId = "voz";
          break;
        case "grito":
          planDisplayName = "O Grito";
          planAmount = amount ? `R$ ${parseFloat(amount).toFixed(2).replace('.', ',')}` : "R$ 29,90";
          backendPlanId = "grito";
          break;
        case "platinum":
          planDisplayName = "Platinum";
          planAmount = amount ? `R$ ${parseFloat(amount).toFixed(2).replace('.', ',')}` : "R$ 50,00";
          backendPlanId = "platinum";
          break;
        case "diamante":
          planDisplayName = "Diamante";
          planAmount = amount ? `R$ ${parseFloat(amount).toFixed(2).replace('.', ',')}` : "R$ 100,00";
          backendPlanId = "diamante";
          break;
        default:
          console.warn('⚠️ [PLAN WARNING] Unknown planId:', planId, '- using Eco as fallback');
          planDisplayName = "Eco";
          planAmount = "R$ 9,90";
          backendPlanId = "eco";
      }
    } else if (amount) {
      // If we have amount but no planId, try to infer the plan
      const amountNum = parseFloat(amount);
      if (amountNum === 9.90) {
        planDisplayName = "Eco";
        backendPlanId = "eco";
      } else if (amountNum === 19.90) {
        planDisplayName = "Voz";
        backendPlanId = "voz";
      } else if (amountNum === 29.90) {
        planDisplayName = "O Grito";
        backendPlanId = "grito";
      } else if (amountNum >= 50) {
        planDisplayName = "Platinum";
        backendPlanId = "platinum";
      } else {
        // For custom amounts, use platinum backend identifier
        planDisplayName = "Customizado";
        backendPlanId = "platinum";
      }
      planAmount = `R$ ${amountNum.toFixed(2).replace('.', ',')}`;
    }
    
    // Get correct price based on periodicity
    let actualPrice = parseFloat(amount || "0");
    if (planPrices[backendPlanId as keyof typeof planPrices]) {
      const planData = planPrices[backendPlanId as keyof typeof planPrices];
      const periodicityData = planData[periodicity as keyof typeof planData];
      if (periodicityData) {
        actualPrice = periodicityData.price / 100; // Convert from cents to reais
        planAmount = periodicityData.display;
      }
    }
    
    console.log('✅ [PLAN VALIDATED] display:', planDisplayName, 'amount:', planAmount, 'backendId:', backendPlanId, 'periodicity:', periodicity, 'price:', actualPrice);
    return { 
      name: planDisplayName, 
      displayValue: planAmount,
      planId: backendPlanId, // Backend identifier
      periodicity: periodicity,
      price: actualPrice // Numeric price for API calls
    };
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/plans")}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Logo size="sm" />
          </div>
          
          {/* Step indicator */}
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full ${
                  step === 5 ? "bg-yellow-400" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Finalize sua doação!
          </h1>
          <p className="text-gray-600">5 de 6</p>
        </div>

        {/* Plan Summary */}
        <div className="bg-gradient-to-r from-yellow-50 to-red-50 border-l-4 border-yellow-400 rounded-2xl p-6 mb-8">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Plano {planInfo.name}
            </h2>
            <p className="text-3xl font-bold text-green-600 mb-1">
              {planInfo.displayValue}
            </p>
            <p className="text-sm text-gray-600">{periodicityLabels[planInfo.periodicity as keyof typeof periodicityLabels] || 'Mensal'}</p>
          </div>
        </div>

        {/* Payment Form */}
        <Elements stripe={stripePromise}>
          <AppleGooglePay
            planInfo={planInfo}
            onSuccess={handlePaymentSuccess}
          />
          <PaymentForm
            planInfo={planInfo}
            onSuccess={handlePaymentSuccess}
          />
        </Elements>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-2">
            🔒 Seus dados estão seguros e criptografados
          </p>
          <p className="text-xs text-gray-400">
            Ao confirmar o pagamento, você concorda com nossos termos de uso.
          </p>
        </div>
      </main>
    </div>
  );
}