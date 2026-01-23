import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface StripeKeys {
  hasSecretKey: boolean;
  hasPublicKey: boolean;
  maskedSecretKey: string | null;
  maskedPublicKey: string | null;
  lastUpdated: string;
}

export interface UpdateStripeKeysData {
  secretKey: string;
  publicKey: string;
}

export interface UpdateStripeKeysResponse {
  success: boolean;
  message: string;
  warning?: string;
}

/**
 * Hook personalizado para gerenciar chaves da Stripe em qualquer parte do sistema
 * 
 * Fornece:
 * - Status atual das chaves (com máscaras de segurança)
 * - Função para atualizar chaves com validação
 * - Estados de loading e error
 * - Notificações automáticas de sucesso/erro
 */
export function useStripeKeys() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query para buscar o status das chaves (usando endpoint público)
  const {
    data: stripeKeys,
    isLoading,
    error,
    refetch
  } = useQuery<StripeKeys>({
    queryKey: ['/api/stripe/status'],
    refetchInterval: 1000 * 60 * 3, // Atualizar a cada 3 minutos
    retry: 2,
    staleTime: 10000, // Cache por 10 segundos
  });

  // Mutation para atualizar chaves
  const updateKeysMutation = useMutation<UpdateStripeKeysResponse, Error, UpdateStripeKeysData>({
    mutationFn: async (data: UpdateStripeKeysData) => {
      return await apiRequest('/api/dev/stripe/update-keys', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      // Notificação de sucesso
      toast({
        title: "✅ Chaves da Stripe atualizadas!",
        description: data.message,
      });

      // Aviso se necessário
      if (data.warning) {
        toast({
          title: "⚠️ Aviso",
          description: data.warning,
          variant: "destructive",
        });
      }

      // Invalidar cache para atualizar dados
      queryClient.invalidateQueries({ queryKey: ['/api/stripe/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro ao atualizar chaves",
        description: error.message || "Falha na comunicação com a API",
        variant: "destructive",
      });
    },
  });

  // Função helper para verificar se ambas as chaves estão configuradas
  const isFullyConfigured = stripeKeys?.hasSecretKey && stripeKeys?.hasPublicKey;

  // Função helper para verificar se é ambiente de produção
  const isProduction = stripeKeys?.maskedSecretKey?.startsWith('sk_live') ||
    stripeKeys?.maskedPublicKey?.startsWith('pk_live');

  return {
    // Dados
    stripeKeys,
    isFullyConfigured,
    isProduction,

    // Estados
    isLoading,
    isUpdating: updateKeysMutation.isPending,
    error,

    // Ações
    refetch,
    updateKeys: updateKeysMutation.mutate,

    // Status da mutation
    updateSuccess: updateKeysMutation.isSuccess,
    updateError: updateKeysMutation.error,
  };
}

/**
 * Hook simplificado para apenas verificar se as chaves estão configuradas
 * Útil para componentes que só precisam saber o status básico
 */
export function useStripeKeysStatus() {
  const { stripeKeys, isLoading, isFullyConfigured, isProduction } = useStripeKeys();

  return {
    hasKeys: isFullyConfigured,
    isProduction,
    isLoading,
    lastUpdated: stripeKeys?.lastUpdated,
  };
}