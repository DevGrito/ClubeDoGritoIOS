import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  DollarSign,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SubscriptionDrawerProps {
  subscriptionId: number | null;
  open: boolean;
  onClose: () => void;
}

interface SubscriptionDetails {
  id: number;
  userId: number;
  stripeSubscriptionId: string;
  status: string;
  planType: string;
  amount: number;
  currency: string;
  billingDay: number;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAt: number | null;
  canceledAt: number | null;
  failureCount: number;
  lastError: string | null;
  nextPaymentAttempt: number | null;
  createdAt: string;
  user: {
    id: number;
    nome: string;
    email: string;
    telefone: string;
  };
}

interface BillingEvent {
  id: number;
  eventType: string;
  status: string;
  amount: number | null;
  currency: string;
  invoiceId: string | null;
  paymentIntentId: string | null;
  errorMessage: string | null;
  nextPaymentAttempt: number | null;
  createdAt: string;
}

export default function SubscriptionDrawer({ subscriptionId, open, onClose }: SubscriptionDrawerProps) {
  const { toast } = useToast();

  // Buscar detalhes da assinatura
  const { data: subscription, isLoading: loadingSubscription } = useQuery<SubscriptionDetails>({
    queryKey: [`/api/subscriptions/${subscriptionId}`],
    enabled: !!subscriptionId && open,
  });

  // Buscar eventos de billing
  const { data: eventsData, isLoading: loadingEvents } = useQuery<{ events: BillingEvent[] }>({
    queryKey: [`/api/subscriptions/${subscriptionId}/events`],
    enabled: !!subscriptionId && open,
  });

  const events = eventsData?.events || [];

  // Mutation para tentar cobrar novamente
  const retryMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/subscriptions/${id}/retry`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Cobrança iniciada',
        description: 'A tentativa de cobrança foi iniciada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/subscriptions/${subscriptionId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/subscriptions/${subscriptionId}/events`] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao cobrar',
        description: error.message || 'Não foi possível tentar cobrar novamente.',
        variant: 'destructive',
      });
    },
  });

  // Mutation para reativar assinatura
  const reactivateMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/subscriptions/${id}/reactivate`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Assinatura reativada',
        description: 'A assinatura foi reativada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/subscriptions/${subscriptionId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/subscriptions/${subscriptionId}/events`] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao reativar',
        description: error.message || 'Não foi possível reativar a assinatura.',
        variant: 'destructive',
      });
    },
  });

  const handleRetry = () => {
    if (subscriptionId) {
      retryMutation.mutate(subscriptionId);
    }
  };

  const handleReactivate = () => {
    if (subscriptionId) {
      reactivateMutation.mutate(subscriptionId);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      active: { variant: 'default', label: 'Ativa' },
      past_due: { variant: 'destructive', label: 'Em Atraso' },
      canceled: { variant: 'outline', label: 'Cancelada' },
      incomplete: { variant: 'secondary', label: 'Incompleta' },
      incomplete_expired: { variant: 'destructive', label: 'Expirada' },
      trialing: { variant: 'secondary', label: 'Trial' },
      unpaid: { variant: 'destructive', label: 'Não Paga' },
    };

    const config = statusMap[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPlanBadge = (plan: string) => {
    const planMap: Record<string, string> = {
      eco: 'Eco',
      voz: 'Voz',
      grito: 'Grito',
      platinum: 'Platinum',
    };
    return planMap[plan] || plan;
  };

  const getEventIcon = (eventType: string, status: string) => {
    if (eventType === 'invoice.paid' || status === 'succeeded') {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    if (eventType === 'invoice.payment_failed' || status === 'failed') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    if (eventType === 'invoice.payment_action_required' || status === 'requires_action') {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
    return <Clock className="h-4 w-4 text-gray-400" />;
  };

  const getEventTitle = (eventType: string) => {
    const titles: Record<string, string> = {
      'invoice.paid': 'Pagamento Confirmado',
      'invoice.payment_failed': 'Pagamento Falhou',
      'invoice.payment_action_required': '3DS Requerido',
      'customer.subscription.updated': 'Assinatura Atualizada',
      'customer.subscription.deleted': 'Assinatura Cancelada',
    };
    return titles[eventType] || eventType;
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto" data-testid="sheet-subscription-details">
        <SheetHeader>
          <SheetTitle>Detalhes da Assinatura</SheetTitle>
          <SheetDescription>
            Informações completas do doador e histórico de cobranças
          </SheetDescription>
        </SheetHeader>

        {loadingSubscription ? (
          <div className="space-y-4 mt-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : subscription ? (
          <div className="space-y-6 mt-6">
            {/* Informações do Doador */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informações do Doador</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium" data-testid="text-donor-name">
                    {subscription.user.nome}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm" data-testid="text-donor-email">
                    {subscription.user.email || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm" data-testid="text-donor-phone">
                    {subscription.user.telefone}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Detalhes da Assinatura */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detalhes da Assinatura</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span data-testid="badge-subscription-status">{getStatusBadge(subscription.status)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Plano</span>
                  <Badge variant="outline" data-testid="badge-subscription-plan">
                    {getPlanBadge(subscription.planType)}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Valor Mensal</span>
                  </div>
                  <span className="text-sm font-medium" data-testid="text-subscription-amount">
                    R$ {(subscription.amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Próxima Cobrança</span>
                  </div>
                  <span className="text-sm" data-testid="text-next-billing">
                    {format(new Date(subscription.currentPeriodEnd * 1000), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Dia de Cobrança</span>
                  </div>
                  <span className="text-sm" data-testid="text-billing-day">
                    Todo dia {subscription.billingDay}
                  </span>
                </div>
                {subscription.failureCount > 0 && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Falhas</span>
                      <Badge variant="destructive" data-testid="badge-failure-count">
                        {subscription.failureCount}
                      </Badge>
                    </div>
                  </>
                )}
                {subscription.lastError && (
                  <>
                    <Separator />
                    <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                      <p className="text-sm text-red-800 dark:text-red-200" data-testid="text-last-error">
                        {subscription.lastError}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Ações */}
            {(subscription.status === 'past_due' ||
              subscription.status === 'incomplete_expired' ||
              subscription.status === 'unpaid') && (
              <div className="flex gap-2">
                <Button
                  onClick={handleRetry}
                  disabled={retryMutation.isPending}
                  className="flex-1"
                  data-testid="button-retry-payment"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${retryMutation.isPending ? 'animate-spin' : ''}`} />
                  Tentar Cobrar Novamente
                </Button>
                {subscription.status === 'incomplete_expired' && (
                  <Button
                    onClick={handleReactivate}
                    disabled={reactivateMutation.isPending}
                    variant="outline"
                    className="flex-1"
                    data-testid="button-reactivate"
                  >
                    Reativar
                  </Button>
                )}
              </div>
            )}

            {/* Timeline de Eventos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Histórico de Eventos</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingEvents ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : events.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum evento registrado
                  </p>
                ) : (
                  <div className="space-y-4">
                    {events.map((event, index) => (
                      <div key={event.id} className="relative">
                        {index !== events.length - 1 && (
                          <div className="absolute left-2 top-8 h-full w-0.5 bg-gray-200 dark:bg-gray-700" />
                        )}
                        <div className="flex gap-3" data-testid={`event-${event.id}`}>
                          <div className="relative z-10 bg-white dark:bg-gray-950 p-1">
                            {getEventIcon(event.eventType, event.status)}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium" data-testid={`event-title-${event.id}`}>
                                  {getEventTitle(event.eventType)}
                                </p>
                                <p className="text-xs text-muted-foreground" data-testid={`event-date-${event.id}`}>
                                  {format(new Date(event.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                                {event.amount && (
                                  <p className="text-sm mt-1" data-testid={`event-amount-${event.id}`}>
                                    R$ {event.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                )}
                                {event.errorMessage && (
                                  <p className="text-xs text-red-600 dark:text-red-400 mt-1" data-testid={`event-error-${event.id}`}>
                                    {event.errorMessage}
                                  </p>
                                )}
                              </div>
                              <Badge variant="outline" className="text-xs" data-testid={`event-status-${event.id}`}>
                                {event.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <p className="text-center text-muted-foreground mt-6">Assinatura não encontrada</p>
        )}
      </SheetContent>
    </Sheet>
  );
}
