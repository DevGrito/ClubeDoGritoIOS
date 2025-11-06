import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import SubscriptionDrawer from '@/components/SubscriptionDrawer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Search,
  RefreshCw,
  ArrowUpDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Subscription {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  userPhone: string;
  stripeSubscriptionId: string;
  status: string;
  planType: string;
  amount: number;
  currency: string;
  billingDay: number;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  failureCount: number;
  lastPaymentAttempt: number | null;
  createdAt: string;
}

interface SubscriptionStats {
  totalMRR: number;
  activeSubscriptions: number;
  successRate: number;
  monthlyRevenue: number;
}

export default function Subscriptions() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'amount' | 'createdAt' | 'nextBilling'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleOpenDrawer = (id: number) => {
    setSelectedSubscriptionId(id);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedSubscriptionId(null);
  };

  // Buscar assinaturas com filtros
  const { data: subscriptionsData, isLoading: loadingSubscriptions } = useQuery<{ subscriptions: Subscription[] }>({
    queryKey: ['/api/subscriptions', statusFilter, planFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (planFilter !== 'all') params.append('plan', planFilter);
      
      const response = await fetch(`/api/subscriptions?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar assinaturas');
      }
      
      return response.json();
    },
  });

  const subscriptions = subscriptionsData?.subscriptions || [];

  // Buscar estatísticas
  const { data: stats, isLoading: loadingStats } = useQuery<SubscriptionStats>({
    queryKey: ['/api/subscriptions/stats'],
  });

  // Filtrar e ordenar assinaturas
  const filteredSubscriptions = subscriptions
    .filter((sub) => {
      const matchesSearch =
        sub.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.userPhone?.includes(searchTerm);
      return matchesSearch;
    })
    .sort((a, b) => {
      let compareValue = 0;
      if (sortBy === 'amount') {
        compareValue = a.amount - b.amount;
      } else if (sortBy === 'createdAt') {
        compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'nextBilling') {
        compareValue = a.currentPeriodEnd - b.currentPeriodEnd;
      }
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

  const handleSort = (field: 'amount' | 'createdAt' | 'nextBilling') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
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
    return (
      <Badge variant={config.variant} data-testid={`badge-status-${status}`}>
        {config.label}
      </Badge>
    );
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Assinaturas</h1>
          <p className="text-muted-foreground">
            Gerenciamento completo de assinaturas e cobranças
          </p>
        </div>
        <Button
          variant="outline"
          data-testid="button-reconcile"
          onClick={() => {
            // TODO: Implementar reconciliação manual
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reconciliar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-mrr">
                  R$ {((stats?.totalMRR || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">Receita Recorrente Mensal</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-active-subs">
                  {stats?.activeSubscriptions || 0}
                </div>
                <p className="text-xs text-muted-foreground">Doadores ativos</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-success-rate">
                  {stats?.successRate?.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">Pagamentos bem-sucedidos</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento do Mês</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-monthly-revenue">
                  R$ {((stats?.monthlyRevenue || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">Receita do mês atual</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros e Busca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="past_due">Em Atraso</SelectItem>
                <SelectItem value="canceled">Cancelada</SelectItem>
                <SelectItem value="incomplete">Incompleta</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-plan-filter">
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Planos</SelectItem>
                <SelectItem value="eco">Eco</SelectItem>
                <SelectItem value="voz">Voz</SelectItem>
                <SelectItem value="grito">Grito</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Assinaturas */}
      <Card>
        <CardHeader>
          <CardTitle>Assinaturas ({filteredSubscriptions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSubscriptions ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma assinatura encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doador</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort('amount')}
                      data-testid="header-sort-amount"
                    >
                      <div className="flex items-center gap-1">
                        Valor
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort('nextBilling')}
                      data-testid="header-sort-next-billing"
                    >
                      <div className="flex items-center gap-1">
                        Próx. Cobrança
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Falhas</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((sub) => (
                    <TableRow key={sub.id} data-testid={`row-subscription-${sub.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium" data-testid={`text-donor-name-${sub.id}`}>
                            {sub.userName || 'N/A'}
                          </div>
                          <div className="text-sm text-muted-foreground" data-testid={`text-donor-email-${sub.id}`}>
                            {sub.userEmail || sub.userPhone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" data-testid={`badge-plan-${sub.id}`}>
                          {getPlanBadge(sub.planType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium" data-testid={`text-amount-${sub.id}`}>
                        R$ {(sub.amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell data-testid={`text-next-billing-${sub.id}`}>
                        {format(new Date(sub.currentPeriodEnd * 1000), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {sub.failureCount > 0 ? (
                          <Badge variant="destructive" data-testid={`badge-failures-${sub.id}`}>
                            {sub.failureCount}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`button-details-${sub.id}`}
                          onClick={() => handleOpenDrawer(sub.id)}
                        >
                          Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drawer de Detalhes */}
      <SubscriptionDrawer
        subscriptionId={selectedSubscriptionId}
        open={drawerOpen}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}
