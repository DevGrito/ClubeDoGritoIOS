import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useServerConnection() {
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const { toast } = useToast();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    let reconnectInterval: NodeJS.Timeout;

    const checkConnection = async () => {
      try {
        const response = await fetch('/api/dev/status', {
          method: 'GET',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (response.ok) {
          // Servidor está ativo
          if (!isConnected) {
            setIsConnected(true);
            setIsReconnecting(false);
            reconnectAttemptsRef.current = 0;
            
            toast({
              title: "Conexão restaurada",
              description: "Servidor reconectado com sucesso",
              duration: 3000,
            });
          }
        } else {
          throw new Error('Server responded with error');
        }
      } catch (error) {
        // Servidor não está respondendo
        if (isConnected) {
          setIsConnected(false);
          setIsReconnecting(true);
          
          toast({
            title: "Servidor atualizando",
            description: "Reconectando automaticamente...",
            duration: 3000,
          });
        }
        
        reconnectAttemptsRef.current += 1;
        
        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setIsReconnecting(false);
          toast({
            title: "Problema de conexão",
            description: "Recarregue a página manualmente",
            variant: "destructive",
            duration: 5000,
          });
        }
      }
    };

    // Verificar conexão inicial
    checkConnection();

    // Verificar periodicamente se desconectado
    reconnectInterval = setInterval(() => {
      if (!isConnected && reconnectAttemptsRef.current < maxReconnectAttempts) {
        checkConnection();
      }
    }, 2000); // Verificar a cada 2 segundos

    // Listener para mudanças de visibilidade da página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected) {
        checkConnection();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(reconnectInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isConnected, toast]);

  return {
    isConnected,
    isReconnecting,
    reconnectAttempts: reconnectAttemptsRef.current,
  };
}