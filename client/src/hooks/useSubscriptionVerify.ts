import { useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

const VERIFY_INTERVAL = 2 * 60 * 1000; // 2 minutos

function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function useSubscriptionVerify() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const verifySubscription = useCallback(async () => {
    const rawPhone = localStorage.getItem('userPhone');
    const userId = localStorage.getItem('userId');
    const userPapel = localStorage.getItem('userPapel');
    
    if (!rawPhone || !userId) {
      console.log('🔍 [VERIFY] Sem dados de login, pulando verificação');
      return;
    }
    
    // Papéis que NÃO precisam de assinatura (colaboradores internos)
    const rolesWithoutSubscription = [
      'desenvolvedor', 'developer', 'dev',
      'monitor', 'monitor_pec', 'monitor_inclusao', 'monitor_psico',
      'professor', 'professor_pec', 'professor_inclusao', 'professor_psico', 'professor_lider', 'lider',
      'coordenador', 'coordenador_pec', 'coordenador_inclusao', 'coordenador_psico',
      'admin', 'super_admin', 'leo',
      'conselho', 'conselheiro',
      'marketing', 'gestor_setor', 'gestor_projeto',
      'oficineiro', 'oficineiro_pec'
    ];
    
    if (userPapel && rolesWithoutSubscription.includes(userPapel.toLowerCase())) {
      console.log('🔍 [VERIFY] Papel sem necessidade de assinatura:', userPapel, '- pulando verificação');
      return;
    }
    
    // Verificar se está em páginas de doação - não interferir
    const currentPath = window.location.pathname;
    const isInDonationFlow = currentPath === '/' || 
                              currentPath === '/plans' || 
                              currentPath.startsWith('/donation-flow');
    
    if (isInDonationFlow) {
      console.log('🔍 [VERIFY] Em fluxo de doação, pulando verificação');
      return;
    }
    
    const phone = sanitizePhone(rawPhone);
    console.log('🔍 [VERIFY] Dados encontrados - phone:', phone, 'userId:', userId);

    try {
      console.log('🔍 [VERIFY] Verificando assinatura na Stripe para:', phone);
      
      const response = await fetch(`/api/subscription/verify?phone=${encodeURIComponent(phone)}`);
      
      if (!response.ok) {
        console.log('⚠️ [VERIFY] Erro HTTP na verificação, mantendo sessão:', response.status);
        return;
      }
      
      const data = await response.json();
      
      console.log('🔍 [VERIFY] Resultado da verificação:', data);
      
      if (data.isPaused || data.reason === 'subscription_paused' || data.reason === 'subscription_canceled') {
        console.log('⚠️ [VERIFY] ASSINATURA PAUSADA/CANCELADA - redirecionando para reativação...');
        
        localStorage.setItem('hasActiveSubscription', 'false');
        localStorage.setItem('subscriptionPaused', 'true');
        if (data.subscriptionId) localStorage.setItem('subscriptionId', data.subscriptionId);
        if (data.customerId) localStorage.setItem('customerId', data.customerId);
        
        // Verificar se já está na página de assinatura-pausada para evitar loop
        if (currentPath !== '/assinatura-pausada') {
          toast({
            title: 'Assinatura cancelada',
            description: 'Sua assinatura precisa ser reativada para continuar.',
            variant: 'destructive',
            duration: 5000
          });
          
          setTimeout(() => {
            setLocation('/assinatura-pausada');
          }, 1000);
        }
      } else if (data.reason === 'incomplete_subscription_cleared') {
        // Doação incompleta foi limpa - apenas atualizar localStorage silenciosamente
        console.log('🔄 [VERIFY] Doação incompleta limpa silenciosamente, permitindo nova doação');
        localStorage.setItem('hasActiveSubscription', 'false');
        localStorage.removeItem('subscriptionId');
      } else if (data.reason === 'no_active_subscription') {
        // ✅ NOVA LÓGICA: NÃO fazer logout automático
        // Apenas redirecionar para página de assinatura-pausada, mantendo a sessão
        console.log('⚠️ [VERIFY] SEM ASSINATURA - redirecionando para reativação (sem logout)...');
        
        localStorage.setItem('hasActiveSubscription', 'false');
        localStorage.setItem('subscriptionPaused', 'true');
        
        // Verificar se já está na página de assinatura-pausada para evitar loop
        if (currentPath !== '/assinatura-pausada') {
          toast({
            title: 'Assinatura inativa',
            description: 'Sua assinatura precisa ser reativada para continuar usando o app.',
            variant: 'destructive',
            duration: 5000
          });
          
          setTimeout(() => {
            setLocation('/assinatura-pausada');
          }, 1000);
        }
      } else if (!data.hasActiveSubscription && data.reason === 'not_found') {
        console.log('⚠️ [VERIFY] Usuário não encontrado no banco, mantendo sessão local');
      } else if (data.hasActiveSubscription) {
        console.log('✅ [VERIFY] Assinatura ativa confirmada');
      } else {
        console.log('⚠️ [VERIFY] Status desconhecido, mantendo sessão:', data.reason);
      }
    } catch (error) {
      console.error('❌ [VERIFY] Erro de rede ao verificar assinatura, mantendo sessão:', error);
    }
  }, [setLocation, toast]);

  useEffect(() => {
    console.log('🚀 [VERIFY] Iniciando verificação de assinatura...');
    verifySubscription();
    
    const interval = setInterval(() => {
      console.log('🔄 [VERIFY] Verificação periódica...');
      verifySubscription();
    }, VERIFY_INTERVAL);
    
    return () => clearInterval(interval);
  }, [verifySubscription]);

  return { verifySubscription };
}
