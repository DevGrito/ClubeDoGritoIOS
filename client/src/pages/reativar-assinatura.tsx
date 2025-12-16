import { useLocation } from "wouter";
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, ArrowLeft, Heart, CreditCard } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ReativarAssinatura() {
  const [, setLocation] = useLocation();
  const userId = parseInt(localStorage.getItem('userId') || '0', 10);

  const { data: subscriptionStatus, isLoading } = useQuery({
    queryKey: ['/api/users', userId, 'stripe-subscription-status'],
    queryFn: () => apiRequest(`/api/users/${userId}/stripe-subscription-status`),
    enabled: userId > 0,
  });

  const handleReativar = () => {
    setLocation('/plans');
  };

  const handleLogout = () => {
    localStorage.clear();
    setLocation('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">Verificando sua assinatura...</p>
        </div>
      </div>
    );
  }

  const getStatusInfo = () => {
    const status = subscriptionStatus?.status;
    if (status === 'canceled' || status === 'incomplete_expired') {
      return {
        title: 'Sua assinatura foi cancelada',
        description: 'Para continuar aproveitando os benefícios do Clube do Grito e apoiando o Instituto O Grito, reative sua assinatura.',
        icon: AlertCircle,
        color: 'red'
      };
    }
    if (status === 'past_due') {
      return {
        title: 'Pagamento em atraso',
        description: 'Houve um problema com sua última cobrança. Atualize seu método de pagamento para continuar apoiando.',
        icon: CreditCard,
        color: 'orange'
      };
    }
    if (status === 'unpaid' || status === 'incomplete') {
      return {
        title: 'Pagamento pendente',
        description: 'Sua assinatura está com pagamento pendente. Complete o pagamento para acessar os benefícios.',
        icon: CreditCard,
        color: 'yellow'
      };
    }
    return {
      title: 'Assinatura inativa',
      description: 'Você ainda não tem uma assinatura ativa. Torne-se um doador para acessar os benefícios exclusivos.',
      icon: Heart,
      color: 'orange'
    };
  };

  const statusInfo = getStatusInfo();
  const IconComponent = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center justify-center">
          <Logo size="md" />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
            statusInfo.color === 'red' ? 'bg-red-100' :
            statusInfo.color === 'orange' ? 'bg-orange-100' :
            'bg-yellow-100'
          }`}>
            <IconComponent className={`w-10 h-10 ${
              statusInfo.color === 'red' ? 'text-red-500' :
              statusInfo.color === 'orange' ? 'text-orange-500' :
              'text-yellow-500'
            }`} />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 text-center mb-3">
            {statusInfo.title}
          </h1>

          <p className="text-gray-600 text-center mb-8 leading-relaxed">
            {statusInfo.description}
          </p>

          <div className="space-y-4">
            <Button
              onClick={handleReativar}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 rounded-full shadow-lg text-lg"
              data-testid="button-reactivate"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Reativar Minha Assinatura
            </Button>

            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full text-gray-500 hover:text-gray-700"
              data-testid="button-logout"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Sair da conta
            </Button>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Ao reativar, você volta a contribuir com a transformação de vidas através da educação, cultura e esporte.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
