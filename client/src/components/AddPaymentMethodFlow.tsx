import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, PaymentRequestButtonElement, useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Smartphone, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Stripe setup
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

interface AddPaymentMethodFlowProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface AppleGooglePayAddProps {
  userId: string;
  onSuccess: () => void;
}

function AppleGooglePayAdd({ userId, onSuccess }: AppleGooglePayAddProps) {
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
          label: 'Adicionar Cartão',
          amount: 100,
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      pr.canMakePayment().then(result => {
        if (result) {
          setPaymentRequest(pr);
          
          pr.on('paymentmethod', async (ev: any) => {
            setIsProcessing(true);
            try {
              const response = await apiRequest(`/api/users/${userId}/payment-methods`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  paymentMethodId: ev.paymentMethod.id,
                }),
              });

              if (!response.success) {
                throw new Error(response.error || 'Erro ao adicionar cartão');
              }

              // Invalidar cache para atualizar lista de cartões
              await queryClient.invalidateQueries({ 
                queryKey: [`/api/users/${userId}/payment-methods`] 
              });

              ev.complete('success');
              
              toast({
                title: '🍎 Cartão adicionado com Apple Pay!',
                description: 'Seu método de pagamento foi salvo com segurança.',
                duration: 3000,
              });

              setTimeout(onSuccess, 1500);
            } catch (error: any) {
              ev.complete('fail');
              toast({
                title: 'Erro ao adicionar cartão',
                description: error.message || 'Ocorreu um erro ao salvar o método de pagamento.',
                variant: 'destructive',
                duration: 4000,
              });
            } finally {
              setIsProcessing(false);
            }
          });
        }
      });
    }
  }, [stripe, userId, onSuccess, toast]);

  if (!paymentRequest) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Adicionar Rápido</h3>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Use Apple Pay, Google Pay ou Samsung Pay para adicionar seu cartão de forma rápida e segura
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
            Salvando método de pagamento...
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

interface ManualCardAddProps {
  userId: string;
  onSuccess: () => void;
}

function ManualCardAdd({ userId, onSuccess }: ManualCardAddProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [setupIntentReady, setSetupIntentReady] = useState(false);

  // Criar SetupIntent quando componente carrega
  useEffect(() => {
    const createSetupIntent = async () => {
      try {
        const result = await apiRequest(`/api/users/${userId}/setup-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (result.clientSecret) {
          setClientSecret(result.clientSecret);
          setSetupIntentReady(true);
        } else {
          throw new Error('Erro ao preparar adicionar cartão');
        }
      } catch (error: any) {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao preparar adicionar cartão.',
          variant: 'destructive',
        });
      }
    };

    createSetupIntent();
  }, [userId, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);

    try {
      // Confirmar SetupIntent (salvar cartão sem cobrança)
      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (setupIntent?.status === "succeeded" && setupIntent.payment_method) {
        // Anexar payment method ao customer no backend
        const attachResponse = await apiRequest(`/api/users/${userId}/payment-methods`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentMethodId: setupIntent.payment_method
          })
        });

        if (!attachResponse.success) {
          throw new Error('Erro ao salvar cartão no servidor');
        }
        
        // Invalidar cache para atualizar lista de cartões
        await queryClient.invalidateQueries({ 
          queryKey: [`/api/users/${userId}/payment-methods`] 
        });
        
        toast({
          title: "💳 Cartão adicionado com sucesso!",
          description: "Seu método de pagamento foi salvo com segurança.",
          duration: 3000,
        });

        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (error: any) {
      
      toast({
        title: "Erro ao adicionar cartão",
        description: error.message || "Ocorreu um erro ao salvar o método de pagamento.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!setupIntentReady) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-600">Preparando formulário...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
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
                  lineHeight: "24px",
                  "::placeholder": {
                    color: "#9CA3AF",
                  },
                },
                invalid: {
                  color: "#EF4444",
                },
                complete: {
                  color: "#10B981",
                },
              },
              hidePostalCode: true,
              disabled: false,
            }}
            onChange={(event) => {
              if (event.error) {
              }
            }}
            onReady={() => {
            }}
            onFocus={() => {
            }}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing || !setupIntentReady}
        className="w-full h-14 bg-yellow-400 hover:bg-yellow-500 text-white font-semibold text-lg rounded-2xl shadow-lg transition-all duration-200"
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Salvando...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5" />
            Adicionar Cartão
          </div>
        )}
      </Button>
    </form>
  );
}

export default function AddPaymentMethodFlow({ userId, onSuccess, onCancel }: AddPaymentMethodFlowProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Adicionar Cartão</h1>
              <p className="text-sm text-gray-600">Salvar novo método de pagamento</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-8">
        {/* Payment Form */}
        <Elements stripe={stripePromise}>
          <AppleGooglePayAdd
            userId={userId}
            onSuccess={onSuccess}
          />
          <ManualCardAdd
            userId={userId}
            onSuccess={onSuccess}
          />
        </Elements>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-2">
            🔒 Seus dados estão seguros e criptografados
          </p>
          <p className="text-xs text-gray-400">
            Utilizamos os mais altos padrões de segurança para proteger suas informações.
          </p>
        </div>
      </main>
    </div>
  );
}