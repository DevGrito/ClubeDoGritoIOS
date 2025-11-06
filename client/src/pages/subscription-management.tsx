import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle, XCircle, AlertCircle, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { planDetails, planPriceIds } from "@/lib/stripe";
import { apiRequest } from "@/lib/queryClient";

interface SubscriptionManagementProps {
  currentPlan?: string;
  subscriptionId?: string;
  subscriptionStatus?: string;
}

export default function SubscriptionManagement({ 
  currentPlan = "eco", 
  subscriptionId = "sub_1234567890",
  subscriptionStatus = "active" 
}: SubscriptionManagementProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'canceled':
      case 'incomplete_expired':
      case 'unpaid':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'past_due':
      case 'incomplete':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <CreditCard className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativa';
      case 'canceled':
        return 'Cancelada';
      case 'past_due':
        return 'Pagamento em Atraso';
      case 'incomplete':
        return 'Aguardando Autenticação';
      case 'incomplete_expired':
        return 'Expirada';
      case 'unpaid':
        return 'Não Paga';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'canceled':
      case 'incomplete_expired':
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      case 'past_due':
      case 'incomplete':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleChangePlan = async (newPlanId: string) => {
    if (!subscriptionId || newPlanId === currentPlan) return;

    setIsUpdating(true);
    
    try {
      const response = await fetch('/api/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          newPlanId // Enviamos o ID do plano, o backend criará o price_data
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Plano atualizado!",
          description: data.message,
        });
        // Você pode adicionar um callback aqui para atualizar os dados da página pai
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o plano. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscriptionId) return;

    setIsUpdating(true);
    
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Assinatura cancelada",
          description: data.message,
        });
        setShowCancelDialog(false);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a assinatura. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setIsReactivating(true);
    
    try {
      // Buscar payment methods do usuário
      const pmResponse = await fetch('/api/payment-methods');
      const pmData = await pmResponse.json();
      
      if (!pmData.paymentMethods || pmData.paymentMethods.length === 0) {
        // Sem cartões, redirecionar para adicionar
        window.location.href = '/change-plan';
        return;
      }

      // Usar o cartão padrão ou o primeiro disponível
      const defaultCard = pmData.paymentMethods.find((pm: any) => pm.isDefault) || pmData.paymentMethods[0];
      
      // Chamar endpoint de reativação
      const result = await apiRequest('/api/billing/reactivate', {
        method: 'POST',
        body: JSON.stringify({
          paymentMethodId: defaultCard.id,
        }),
      });

      if (result.success) {
        if (result.requiresAction && result.clientSecret) {
          // 3DS necessário - armazenar clientSecret e redirecionar
          sessionStorage.setItem('pendingPaymentSecret', result.clientSecret);
          window.location.href = '/stripe-payment';
        } else {
          toast({
            title: "Assinatura reativada!",
            description: "Sua assinatura foi reativada com sucesso.",
          });
          // Recarregar página para atualizar status
          window.location.reload();
        }
      } else {
        throw new Error(result.message || 'Erro ao reativar assinatura');
      }
    } catch (error: any) {
      console.error('Error reactivating subscription:', error);
      toast({
        title: "Erro ao reativar",
        description: error.message || "Não foi possível reativar a assinatura. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsReactivating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Status da Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Plano atual:</span>
                <span className="text-lg font-bold">
                  {planDetails[currentPlan as keyof typeof planDetails]?.name || currentPlan}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(subscriptionStatus)}
                <Badge className={getStatusColor(subscriptionStatus)}>
                  {getStatusText(subscriptionStatus)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incomplete Expired / Unpaid - Reativar Assinatura */}
      {(subscriptionStatus === 'incomplete_expired' || subscriptionStatus === 'unpaid') && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Assinatura Expirada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700">
              Sua assinatura expirou porque o pagamento não foi concluído a tempo. 
              Para reativar sua assinatura, usaremos seu cartão cadastrado ou você pode adicionar um novo.
            </p>
            <Button 
              onClick={handleReactivateSubscription}
              disabled={isReactivating}
              className="w-full"
              data-testid="button-reactivate-subscription"
            >
              {isReactivating ? 'Reativando...' : 'Reativar Assinatura'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Incomplete - Autenticação 3DS Necessária */}
      {subscriptionStatus === 'incomplete' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Autenticação Necessária
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700">
              Seu banco requer autenticação adicional (3D Secure) para completar o pagamento.
              Clique no botão abaixo para continuar.
            </p>
            <Button 
              onClick={() => window.location.href = '/stripe-payment'}
              className="w-full"
              data-testid="button-complete-3ds"
            >
              Continuar Pagamento
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Past Due - Atualizar Cartão */}
      {subscriptionStatus === 'past_due' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Pagamento em Atraso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700">
              Não conseguimos processar seu pagamento. Verifique seu cartão ou adicione um novo método de pagamento.
              O Stripe tentará cobrar novamente automaticamente.
            </p>
            <Button 
              onClick={() => window.location.href = '/change-plan'}
              variant="outline"
              className="w-full"
              data-testid="button-update-card"
            >
              Atualizar Cartão
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plan Options */}
      {subscriptionStatus === 'active' && (
        <Card>
          <CardHeader>
            <CardTitle>Alterar Plano</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {Object.entries(planDetails).map(([planId, plan]) => {
                const isCurrentPlan = planId === currentPlan;
                const isUpgrade = ['eco', 'voz', 'grito'].indexOf(planId) > ['eco', 'voz', 'grito'].indexOf(currentPlan);
                
                return (
                  <div
                    key={planId}
                    className={`p-4 border rounded-lg ${isCurrentPlan ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          {plan.name}
                          {isCurrentPlan && <Badge variant="outline">Atual</Badge>}
                          {!isCurrentPlan && isUpgrade && <ArrowUpCircle className="w-4 h-4 text-green-600" />}
                          {!isCurrentPlan && !isUpgrade && <ArrowDownCircle className="w-4 h-4 text-orange-600" />}
                        </h3>
                        <p className="text-sm text-gray-600">{plan.description}</p>
                        <ul className="text-xs text-gray-500 mt-2">
                          {plan.features.map((feature, index) => (
                            <li key={index}>• {feature}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="text-right">
                        {!isCurrentPlan && (
                          <Button
                            onClick={() => handleChangePlan(planId)}
                            disabled={isUpdating}
                            variant={isUpgrade ? "default" : "outline"}
                            size="sm"
                          >
                            {isUpgrade ? 'Upgrade' : 'Downgrade'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Subscription */}
      {subscriptionStatus === 'active' && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Zona de Perigo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Cancelar sua assinatura significa que você perderá o acesso aos recursos premium no final do período atual.
              </p>
              
              <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                    Cancelar Assinatura
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tem certeza?</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Esta ação cancelará sua assinatura permanentemente. Você manterá acesso até o final do período atual, mas não será cobrado novamente.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCancelSubscription}
                        disabled={isUpdating}
                        variant="destructive"
                        className="flex-1"
                      >
                        {isUpdating ? 'Cancelando...' : 'Sim, cancelar assinatura'}
                      </Button>
                      <Button
                        onClick={() => setShowCancelDialog(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Não, manter assinatura
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}