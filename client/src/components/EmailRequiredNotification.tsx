import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Check } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import clubeDoGritoLogo from '../app-assets/CLUBE_DO_GRITO_LOGO_Prancheta_1_1751996016284_(1)_1764696786533.png';

interface EmailRequiredNotificationProps {
  userId: number;
  userName: string | null;
  onEmailSaved: () => void;
}

export function EmailRequiredNotification({ userId, userName, onEmailSaved }: EmailRequiredNotificationProps) {
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValid(emailRegex.test(email));
  }, [email]);

  const saveMutation = useMutation({
    mutationFn: async (emailToSave: string) => {
      return apiRequest(`/api/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ email: emailToSave }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      toast({
        title: "E-mail cadastrado!",
        description: "Agora você tem acesso completo ao Clube do Grito.",
      });
      
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        parsed.email = email;
        localStorage.setItem('userData', JSON.stringify(parsed));
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId] });
      onEmailSaved();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (isValid && !saveMutation.isPending) {
      saveMutation.mutate(email);
    }
  };

  const displayName = userName ? userName.split(' ')[0] : 'Grito';

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
              Olá, {displayName}! Precisamos do seu e-mail
            </h2>

            <p className="text-gray-600 text-sm mb-6 leading-relaxed" data-testid="email-required-message">
              Para acessar os <strong>Benefícios</strong> e as <strong>Missões</strong> do Clube do Grito, 
              precisamos que você cadastre seu e-mail. É rápido e simples!
            </p>

            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="Digite seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-full focus:border-yellow-400 focus:outline-none transition-colors text-gray-900"
                  data-testid="input-email-required"
                />
                {isValid && (
                  <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!isValid || saveMutation.isPending}
                className={`w-full py-3 px-5 font-bold rounded-full transition-all ${
                  isValid && !saveMutation.isPending
                    ? 'bg-yellow-400 hover:bg-yellow-500 text-black'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                data-testid="btn-save-email"
              >
                {saveMutation.isPending ? 'Salvando...' : 'Confirmar E-mail'}
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
