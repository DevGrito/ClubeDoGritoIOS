import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useActivityTracker } from '@/hooks/useActivityTracker';

// Tipos para feedback de recomendações
export type FeedbackAction = 'like' | 'dislike' | 'not_interested' | 'viewed' | 'clicked' | 'shared' | 'saved';

export interface RecommendationFeedback {
  userId: number;
  entityType: string;
  entityId: string;
  entityTitle?: string;
  entityCategory?: string;
  entityTags?: string[];
  action: FeedbackAction;
  score?: number;
  reason?: string;
  context?: {
    position?: number;
    algorithm?: string;
    sessionId?: string;
    recommendationScore?: number;
    reasonDisplayed?: string;
    source?: string;
  };
  metadata?: Record<string, any>;
}

interface FeedbackResponse {
  success: boolean;
  message?: string;
  updated?: boolean;
}

interface UseFeedbackOptions {
  trackActivity?: boolean;
  showToast?: boolean;
  invalidateRecommendations?: boolean;
  optimisticUpdate?: boolean;
}

/**
 * Hook principal para enviar feedback sobre recomendações
 */
export function useRecommendationFeedback(
  userId: number | null | undefined,
  options: UseFeedbackOptions = {}
) {
  const {
    trackActivity = true,
    showToast = true,
    invalidateRecommendations = true,
    optimisticUpdate = false,
  } = options;

  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Activity tracker (opcional)
  const activityTracker = trackActivity && userId ? useActivityTracker({
    userId,
    enableViewTracking: false,
    enableDurationTracking: false,
    batchSize: 5,
    debounceMs: 500,
  }) : null;

  // Mutation para enviar feedback
  const feedbackMutation = useMutation<FeedbackResponse, Error, RecommendationFeedback>({
    mutationFn: async (feedback) => {
      console.log('📝 [useRecommendationFeedback] Enviando feedback:', feedback);
      
      return apiRequest('/api/recommendations/feedback', {
        method: 'POST',
        body: JSON.stringify(feedback),
      });
    },
    onSuccess: (response, variables) => {
      console.log('✅ [useRecommendationFeedback] Feedback enviado com sucesso:', response);

      // Toast de confirmação
      if (showToast) {
        const actionMessages = {
          like: 'Obrigado pelo feedback! Vamos mostrar mais conteúdo similar.',
          dislike: 'Feedback recebido! Vamos melhorar as recomendações.',
          not_interested: 'Ok, evitaremos mostrar conteúdo similar.',
          viewed: 'Visualização registrada.',
          clicked: 'Interação registrada.',
          shared: 'Compartilhamento registrado!',
          saved: 'Item salvo com sucesso!',
        };

        toast({
          title: 'Feedback recebido',
          description: actionMessages[variables.action] || 'Sua opinião nos ajuda a melhorar!',
          variant: variables.action === 'dislike' ? 'default' : 'default',
        });
      }

      // Rastrear atividade
      if (activityTracker && trackActivity) {
        const eventTypeMap = {
          like: 'like' as const,
          dislike: 'click' as const,
          not_interested: 'click' as const,
          viewed: 'view' as const,
          clicked: 'click' as const,
          shared: 'share' as const,
          saved: 'click' as const,
        };

        activityTracker.trackClick(
          variables.entityType as any,
          variables.entityId,
          variables.entityTitle,
          variables.entityCategory,
          variables.entityTags,
          {
            action: variables.action,
            feedbackScore: variables.score,
            feedbackReason: variables.reason,
            recommendationContext: variables.context,
            source: 'recommendation_feedback',
          }
        );
      }

      // Invalidar cache de recomendações para atualizar
      if (invalidateRecommendations && userId) {
        queryClient.invalidateQueries({
          queryKey: [`/api/recommendations/${userId}`],
        });

        // Também invalidar perfil de atividade
        queryClient.invalidateQueries({
          queryKey: [`/api/users/${userId}/activity-profile`],
        });
      }
    },
    onError: (error, variables) => {
      console.error('❌ [useRecommendationFeedback] Erro ao enviar feedback:', error);

      if (showToast) {
        toast({
          title: 'Erro ao enviar feedback',
          description: 'Não foi possível registrar sua opinião. Tente novamente.',
          variant: 'destructive',
        });
      }
    },
  });

  // Função para curtir uma recomendação
  const like = (
    entityType: string,
    entityId: string,
    entityTitle?: string,
    entityCategory?: string,
    entityTags?: string[],
    context?: RecommendationFeedback['context']
  ) => {
    if (!userId) return;

    return feedbackMutation.mutate({
      userId,
      entityType,
      entityId,
      entityTitle,
      entityCategory,
      entityTags,
      action: 'like',
      score: 1.0,
      context,
    });
  };

  // Função para não curtir uma recomendação
  const dislike = (
    entityType: string,
    entityId: string,
    entityTitle?: string,
    entityCategory?: string,
    entityTags?: string[],
    reason?: string,
    context?: RecommendationFeedback['context']
  ) => {
    if (!userId) return;

    return feedbackMutation.mutate({
      userId,
      entityType,
      entityId,
      entityTitle,
      entityCategory,
      entityTags,
      action: 'dislike',
      score: 0.0,
      reason,
      context,
    });
  };

  // Função para marcar como "não me interessa"
  const notInterested = (
    entityType: string,
    entityId: string,
    entityTitle?: string,
    entityCategory?: string,
    entityTags?: string[],
    reason?: string,
    context?: RecommendationFeedback['context']
  ) => {
    if (!userId) return;

    return feedbackMutation.mutate({
      userId,
      entityType,
      entityId,
      entityTitle,
      entityCategory,
      entityTags,
      action: 'not_interested',
      score: -0.5,
      reason,
      context,
    });
  };

  // Função para registrar visualização
  const markAsViewed = (
    entityType: string,
    entityId: string,
    entityTitle?: string,
    entityCategory?: string,
    entityTags?: string[],
    context?: RecommendationFeedback['context']
  ) => {
    if (!userId) return;

    return feedbackMutation.mutate({
      userId,
      entityType,
      entityId,
      entityTitle,
      entityCategory,
      entityTags,
      action: 'viewed',
      context,
    });
  };

  // Função para registrar clique
  const markAsClicked = (
    entityType: string,
    entityId: string,
    entityTitle?: string,
    entityCategory?: string,
    entityTags?: string[],
    context?: RecommendationFeedback['context']
  ) => {
    if (!userId) return;

    return feedbackMutation.mutate({
      userId,
      entityType,
      entityId,
      entityTitle,
      entityCategory,
      entityTags,
      action: 'clicked',
      context,
    });
  };

  // Função para registrar compartilhamento
  const markAsShared = (
    entityType: string,
    entityId: string,
    entityTitle?: string,
    entityCategory?: string,
    entityTags?: string[],
    shareMethod?: string,
    context?: RecommendationFeedback['context']
  ) => {
    if (!userId) return;

    return feedbackMutation.mutate({
      userId,
      entityType,
      entityId,
      entityTitle,
      entityCategory,
      entityTags,
      action: 'shared',
      context,
      metadata: {
        shareMethod,
      },
    });
  };

  // Função para marcar como salvo
  const markAsSaved = (
    entityType: string,
    entityId: string,
    entityTitle?: string,
    entityCategory?: string,
    entityTags?: string[],
    context?: RecommendationFeedback['context']
  ) => {
    if (!userId) return;

    return feedbackMutation.mutate({
      userId,
      entityType,
      entityId,
      entityTitle,
      entityCategory,
      entityTags,
      action: 'saved',
      context,
    });
  };

  // Função genérica para enviar qualquer tipo de feedback
  const sendFeedback = (feedback: Omit<RecommendationFeedback, 'userId'>) => {
    if (!userId) return;

    return feedbackMutation.mutate({
      userId,
      ...feedback,
    });
  };

  return {
    // Estado da mutation
    isLoading: feedbackMutation.isPending,
    isError: feedbackMutation.isError,
    isSuccess: feedbackMutation.isSuccess,
    error: feedbackMutation.error,
    data: feedbackMutation.data,

    // Funções de ação
    like,
    dislike,
    notInterested,
    markAsViewed,
    markAsClicked,
    markAsShared,
    markAsSaved,
    sendFeedback,

    // Reset da mutation
    reset: feedbackMutation.reset,
  };
}

/**
 * Hook para feedback com rate limiting (evita spam)
 */
export function useThrottledRecommendationFeedback(
  userId: number | null | undefined,
  throttleMs: number = 1000,
  options: UseFeedbackOptions = {}
) {
  const baseFeedback = useRecommendationFeedback(userId, {
    ...options,
    showToast: false, // Controlamos o toast manualmente
  });

  const { toast } = useToast();
  const lastFeedbackTime = React.useRef<number>(0);
  const pendingFeedback = React.useRef<{ action: () => void; timestamp: number } | null>(null);

  // Função throttled
  const throttledAction = (action: () => void, actionName: string = 'ação') => {
    const now = Date.now();
    const timeSinceLastFeedback = now - lastFeedbackTime.current;

    if (timeSinceLastFeedback < throttleMs) {
      // Armazenar feedback pendente
      pendingFeedback.current = { action, timestamp: now };

      const remainingMs = throttleMs - timeSinceLastFeedback;
      
      if (options.showToast !== false) {
        toast({
          title: 'Aguarde um momento',
          description: `Você pode fazer essa ${actionName} novamente em ${Math.ceil(remainingMs / 1000)} segundos.`,
          variant: 'default',
        });
      }

      // Executar feedback pendente após o throttle
      setTimeout(() => {
        if (pendingFeedback.current && pendingFeedback.current.timestamp === now) {
          pendingFeedback.current.action();
          pendingFeedback.current = null;
          lastFeedbackTime.current = Date.now();
        }
      }, remainingMs);

      return;
    }

    // Executar imediatamente
    action();
    lastFeedbackTime.current = now;
  };

  return {
    ...baseFeedback,

    // Versões throttled das funções
    like: (entityType: string, entityId: string, ...args: any[]) => {
      throttledAction(() => baseFeedback.like(entityType, entityId, ...args), 'curtida');
    },

    dislike: (entityType: string, entityId: string, ...args: any[]) => {
      throttledAction(() => baseFeedback.dislike(entityType, entityId, ...args), 'avaliação');
    },

    notInterested: (entityType: string, entityId: string, ...args: any[]) => {
      throttledAction(() => baseFeedback.notInterested(entityType, entityId, ...args), 'marcação');
    },
  };
}

/**
 * Hook para feedback em lote (bulk feedback)
 */
export function useBulkRecommendationFeedback(
  userId: number | null | undefined,
  options: UseFeedbackOptions = {}
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const bulkFeedbackMutation = useMutation<FeedbackResponse[], Error, RecommendationFeedback[]>({
    mutationFn: async (feedbacks) => {
      console.log('📦 [useBulkRecommendationFeedback] Enviando feedbacks em lote:', feedbacks.length);
      
      // Enviar todos os feedbacks em paralelo
      const promises = feedbacks.map(feedback => 
        apiRequest('/api/recommendations/feedback', {
          method: 'POST',
          body: JSON.stringify(feedback),
        })
      );

      return Promise.all(promises);
    },
    onSuccess: (responses, feedbacks) => {
      console.log('✅ [useBulkRecommendationFeedback] Feedbacks enviados:', responses.length);

      if (options.showToast !== false) {
        toast({
          title: 'Feedbacks enviados',
          description: `${responses.length} avaliações foram registradas com sucesso.`,
        });
      }

      // Invalidar cache
      if (options.invalidateRecommendations !== false && userId) {
        queryClient.invalidateQueries({
          queryKey: [`/api/recommendations/${userId}`],
        });
      }
    },
    onError: (error) => {
      console.error('❌ [useBulkRecommendationFeedback] Erro:', error);

      if (options.showToast !== false) {
        toast({
          title: 'Erro ao enviar feedbacks',
          description: 'Não foi possível registrar algumas avaliações.',
          variant: 'destructive',
        });
      }
    },
  });

  const sendBulkFeedback = (feedbacks: Omit<RecommendationFeedback, 'userId'>[]) => {
    if (!userId) return;

    const feedbacksWithUserId = feedbacks.map(feedback => ({
      userId,
      ...feedback,
    }));

    return bulkFeedbackMutation.mutate(feedbacksWithUserId);
  };

  return {
    isLoading: bulkFeedbackMutation.isPending,
    isError: bulkFeedbackMutation.isError,
    isSuccess: bulkFeedbackMutation.isSuccess,
    error: bulkFeedbackMutation.error,
    data: bulkFeedbackMutation.data,
    sendBulkFeedback,
    reset: bulkFeedbackMutation.reset,
  };
}

// Import React for useRef
import React from 'react';