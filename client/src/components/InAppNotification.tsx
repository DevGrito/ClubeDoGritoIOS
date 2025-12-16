import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { X, Mail, Check, Loader2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import clubeDoGritoLogo from '@assets/CLUBE_DO_GRITO_LOGO_Prancheta_1_1751996016284_(1)_1764696786533.png';

const DOADOR_ROUTES = [
  '/welcome',
  '/beneficios',
  '/beneficios-onboarding', 
  '/meus-lances',
  '/missoes',
  '/missoes-semanais',
  '/perfil',
  '/dados-cadastrais',
  '/configuracoes',
  '/tdoador',
  '/historias',
  '/indique-ganhe',
];

interface InAppNotificationData {
  id: number;
  title: string;
  message: string;
  primary_button_text: string | null;
  primary_button_action: string | null;
  secondary_button_text: string | null;
  secondary_button_action: string | null;
  progress_duration: number;
  created_at: string;
  scheduled_at: string | null;
  notification_type: string | null;
  blocked_routes: string | null;
  requirement_field: string | null;
}

function formatNotificationTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
    hour12: false
  });
}

function replaceVariables(text: string, userName: string | null): string {
  if (!text) return text;
  const name = userName || 'Grito';
  return text.replace(/\{nome\}/gi, name);
}

export function InAppNotification() {
  const [location, setLocation] = useLocation();
  const [progressWidth, setProgressWidth] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const { toast } = useToast();

  const userData = localStorage.getItem('userData');
  const parsedUserData = userData ? JSON.parse(userData) : null;
  const userId = parsedUserData?.id || localStorage.getItem('userId') || null;
  
  // Buscar dados do usuário do backend para verificação confiável de email
  const { data: backendUserData } = useQuery<{ email?: string } | null>({
    queryKey: ['/api/users', userId, 'email-check'],
    queryFn: async () => {
      if (!userId) return null;
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!userId,
    staleTime: 30000,
  });
  
  // Usar email do backend (mais confiável) ou do localStorage como fallback
  const userEmail = backendUserData?.email || parsedUserData?.email || null;
  
  const userPapel = localStorage.getItem('userPapel');
  const isVerified = localStorage.getItem('isVerified') === 'true';
  const isDoadorUser = userPapel === 'doador' || (isVerified && !!userId);
  const isDoadorRoute = DOADOR_ROUTES.some(route => location === route || location.startsWith(route + '/'));
  const isDoador = isDoadorUser && isDoadorRoute;
  
  const storedUserName = localStorage.getItem('userName');
  const userName = storedUserName 
    ? storedUserName.split(' ')[0]
    : (parsedUserData?.nome || parsedUserData?.name || null);

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(email));
  }, [email]);

  const { data: notification, isLoading } = useQuery<InAppNotificationData | null>({
    queryKey: ['/api/in-app-notifications/active', userId],
    queryFn: async () => {
      const response = await fetch(`/api/in-app-notifications/active${userId ? `?userId=${userId}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch notification');
      return response.json();
    },
    enabled: !dismissed && Boolean(isDoador),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const dismissMutation = useMutation({
    mutationFn: async ({ notificationId, action }: { notificationId: number; action: string }) => {
      return apiRequest(`/api/in-app-notifications/${notificationId}/dismiss`, {
        method: 'POST',
        body: JSON.stringify({ userId, action }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/in-app-notifications/active'] });
    },
  });

  const saveEmailMutation = useMutation({
    mutationFn: async (emailToSave: string) => {
      return apiRequest('/api/user/update-email', {
        method: 'POST',
        body: JSON.stringify({ userId: Number(userId), email: emailToSave }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      toast({
        title: "E-mail cadastrado!",
        description: "Agora você tem acesso completo ao Clube do Grito.",
      });
      
      if (userData) {
        const parsed = JSON.parse(userData);
        parsed.email = email;
        localStorage.setItem('userData', JSON.stringify(parsed));
      }
      
      if (notification) {
        dismissMutation.mutate({ notificationId: notification.id, action: 'email_saved' });
      }
      setDismissed(true);
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'email-check'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!notification || dismissed) return;
    
    const isEmailRequired = notification.notification_type === 'email_required';
    if (isEmailRequired) return;

    const duration = (notification.progress_duration || 5) * 1000;
    const intervalTime = 50;
    const increment = 100 / (duration / intervalTime);

    const interval = setInterval(() => {
      setProgressWidth(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [notification, dismissed]);

  const handleAction = (action: string | null, buttonType: 'primary' | 'secondary') => {
    if (!notification) return;

    const dismissAction = buttonType === 'primary' ? 'clicked_primary' : 'clicked_secondary';
    dismissMutation.mutate({ notificationId: notification.id, action: dismissAction });
    setDismissed(true);

    if (action && action !== 'dismiss') {
      setTimeout(() => {
        setLocation(action);
      }, 100);
    }
  };

  const handleClose = () => {
    if (!notification) return;
    dismissMutation.mutate({ notificationId: notification.id, action: 'dismissed' });
    setDismissed(true);
  };

  const handleEmailSubmit = () => {
    if (isEmailValid && !saveEmailMutation.isPending) {
      saveEmailMutation.mutate(email);
    }
  };

  if (!isDoador || isLoading || dismissed || !notification) {
    return null;
  }

  const isEmailRequired = notification.notification_type === 'email_required';
  
  let blockedRoutes: string[] = [];
  try {
    blockedRoutes = notification.blocked_routes ? JSON.parse(notification.blocked_routes) : [];
  } catch { blockedRoutes = []; }
  
  const isCurrentRouteBlocked = blockedRoutes.some(route => 
    location === route || location.startsWith(route + '/')
  );
  
  if (isEmailRequired && userEmail && userEmail.trim() !== '') {
    return null;
  }
  
  if (isEmailRequired && !isCurrentRouteBlocked) {
    return null;
  }

  const displayName = userName || 'Grito';

  if (isEmailRequired) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4"
          data-testid="email-required-overlay"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            data-testid="email-required-card"
          >
            <div className="h-2 bg-yellow-400" />

            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 flex-shrink-0">
                  <img 
                    src={clubeDoGritoLogo} 
                    alt="Clube do Grito" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Clube do Grito</p>
                  <p className="text-xs text-gray-500">Complete seu cadastro</p>
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-2" data-testid="email-required-title">
                {replaceVariables(notification.title, displayName)}
              </h2>

              <p className="text-gray-600 text-sm mb-6 leading-relaxed" data-testid="email-required-message">
                {replaceVariables(notification.message, displayName)}
              </p>

              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Digite seu e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                    className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-full focus:border-yellow-400 focus:outline-none transition-colors text-gray-900"
                    data-testid="input-email-required"
                  />
                  {isEmailValid && (
                    <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEmailSubmit}
                  disabled={!isEmailValid || saveEmailMutation.isPending}
                  className={`w-full py-3 px-5 font-bold rounded-full transition-all flex items-center justify-center gap-2 ${
                    isEmailValid && !saveEmailMutation.isPending
                      ? 'bg-yellow-400 hover:bg-yellow-500 text-black'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  data-testid="btn-save-email"
                >
                  {saveEmailMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    notification.primary_button_text || 'Confirmar E-mail'
                  )}
                </motion.button>
              </div>

              <p className="text-xs text-gray-400 text-center mt-4">
                Seu e-mail será usado para comunicações importantes sobre o Clube do Grito.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed inset-x-0 top-0 z-[9999] flex items-start justify-center p-4 pt-6"
        data-testid="in-app-notification-overlay"
      >
        <motion.div
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl"
          data-testid="in-app-notification-card"
        >
          <button
            onClick={handleClose}
            className="absolute top-6 right-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors"
            data-testid="btn-close-notification"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className="relative h-2 bg-gray-200 rounded-t-3xl mt-2 mx-2 overflow-visible">
            <motion.div
              className="absolute left-0 top-0 h-full bg-yellow-400 rounded-l-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressWidth}%` }}
              transition={{ duration: 0.05, ease: 'linear' }}
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-yellow-400 rounded-full shadow-md border-2 border-white z-10"
              style={{ left: `calc(${Math.min(progressWidth, 95)}% - 10px)` }}
            />
          </div>

          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 flex-shrink-0">
                <img 
                  src={clubeDoGritoLogo} 
                  alt="Clube do Grito" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <p className="font-bold text-gray-900">Clube do Grito</p>
                <p className="text-xs text-gray-500">{notification.scheduled_at ? formatNotificationTime(notification.scheduled_at) : (notification.created_at ? formatNotificationTime(notification.created_at) : 'Agora')}</p>
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2" data-testid="notification-title">
              {replaceVariables(notification.title, userName)}
            </h2>

            <p className="text-gray-600 text-sm mb-6 leading-relaxed" data-testid="notification-message">
              {replaceVariables(notification.message, userName)}
            </p>

            <div className="flex gap-3">
              {notification.primary_button_text && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAction(notification.primary_button_action, 'primary')}
                  className="flex-1 py-3 px-5 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-full transition-colors"
                  data-testid="btn-primary-action"
                >
                  {notification.primary_button_text}
                </motion.button>
              )}

              {notification.secondary_button_text && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAction(notification.secondary_button_action, 'secondary')}
                  className="flex-1 py-3 px-5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-full transition-colors"
                  data-testid="btn-secondary-action"
                >
                  {notification.secondary_button_text}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
