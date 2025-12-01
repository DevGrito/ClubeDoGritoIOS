import { useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

const VERIFY_INTERVAL = 2 * 60 * 1000; // 2 minutos

export function useSubscriptionVerify() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const verifySubscription = useCallback(async () => {
    const phone = localStorage.getItem('userPhone');
    const userId = localStorage.getItem('userId');
    
    // Se não tem dados de login, não faz nada
    if (!phone || !userId) {
      console.log('🔍 [VERIFY] Sem dados de login, pulando verificação');
      return;
    }
    
    console.log('🔍 [VERIFY] Dados encontrados - phone:', phone, 'userId:', userId);

    try {
      console.log('🔍 [VERIFY] Verificando assinatura na Stripe para:', phone);
      
      const response = await fetch(`/api/subscription/verify?phone=${encodeURIComponent(phone)}`);
      const data = await response.json();
      
      console.log('🔍 [VERIFY] Resultado da verificação:', data);
      
      if (!data.hasActiveSubscription) {
        console.log('⚠️ [VERIFY] ASSINATURA INATIVA - fazendo logout automático...');
        
        // Limpar TODA a sessão
        localStorage.removeItem('isVerified');
        localStorage.removeItem('userPapel');
        localStorage.removeItem('hasActiveSubscription');
        localStorage.removeItem('subscriptionId');
        localStorage.removeItem('customerId');
        localStorage.removeItem('firstTimeAccess');
        localStorage.removeItem('hasDoadorRole');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userPhone');
        localStorage.removeItem('userEmail');
        sessionStorage.removeItem('justCompletedDonation');
        
        toast({
          title: 'Sessão encerrada',
          description: data.reason === 'no_active_subscription' 
            ? 'Sua assinatura não está mais ativa. Faça uma nova doação para continuar.'
            : 'Sua sessão expirou. Faça login novamente.',
          variant: 'destructive',
          duration: 5000
        });
        
        // Redirecionar para home
        setTimeout(() => {
          setLocation('/');
          window.location.reload();
        }, 1500);
      } else {
        console.log('✅ [VERIFY] Assinatura ativa confirmada');
      }
    } catch (error) {
      console.error('❌ [VERIFY] Erro ao verificar assinatura:', error);
    }
  }, [setLocation, toast]);

  useEffect(() => {
    // Verificar imediatamente ao montar
    console.log('🚀 [VERIFY] Iniciando verificação de assinatura...');
    verifySubscription();
    
    // Verificar periodicamente
    const interval = setInterval(() => {
      console.log('🔄 [VERIFY] Verificação periódica...');
      verifySubscription();
    }, VERIFY_INTERVAL);
    
    return () => clearInterval(interval);
  }, [verifySubscription]);

  return { verifySubscription };
}
