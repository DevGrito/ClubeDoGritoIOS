import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Tipos para as recomendações
export interface Recommendation {
  entityType: 'beneficio' | 'historia' | 'missao' | 'noticia' | 'leilao' | 'premio';
  entityId: string;
  title: string;
  category: string;
  tags: string[];
  score: number;
  reason: string;
  metadata?: {
    description?: string;
    imageUrl?: string;
    createdAt?: string;
    deadline?: string;
    points?: number;
    progress?: number;
    author?: string;
    difficulty?: 'facil' | 'medio' | 'dificil';
    estimatedTime?: string;
    reward?: string;
    publishedAt?: string;
    isFeatured?: boolean;
    status?: string;
  };
}

export interface UserProfile {
  topCategories: Array<{ category: string; score: number }>;
  topTags: Array<{ tag: string; score: number }>;
  totalInteractions: number;
  lastActivity: string | null;
}

export interface RecommendationResponse {
  recommendations: Recommendation[];
  userProfile: UserProfile;
  debug?: {
    algorithm: string;
    totalCandidates: number;
    filters: string[];
    scoringFactors: Record<string, number>;
    executionTimeMs?: number;
    coldStart?: boolean;
  };
}

export interface UseRecommendationsOptions {
  limit?: number;
  entityTypes?: string[];
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
}

export interface RecommendationFilters {
  categories?: string[];
  entityTypes?: string[];
  limit?: number;
}

/**
 * Hook principal para buscar recomendações personalizadas
 */
export function useRecommendations(
  userId: number | null | undefined,
  options: UseRecommendationsOptions = {}
) {
  const {
    limit = 10,
    entityTypes,
    enabled = true,
    refetchInterval = false,
    staleTime = 5 * 60 * 1000, // 5 minutos
  } = options;

  const queryKey = [
    `/api/recommendations/${userId}`,
    { limit, entityTypes: entityTypes?.sort() }
  ];

  const query = useQuery<RecommendationResponse>({
    queryKey,
    enabled: enabled && !!userId,
    staleTime,
    refetchInterval,
    retry: 2,
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (entityTypes?.length) {
        entityTypes.forEach(type => params.append('types', type));
      }

      const url = `/api/recommendations/${userId}${params.toString() ? `?${params.toString()}` : ''}`;
      
      console.log('🎯 [useRecommendations] Buscando recomendações:', {
        userId,
        url,
        filters: { limit, entityTypes }
      });

      return apiRequest(url);
    },
  });

  // Função para refrescar recomendações manualmente
  const refreshRecommendations = () => {
    console.log('🔄 [useRecommendations] Refresh manual solicitado');
    return query.refetch();
  };

  // Função para invalidar cache de recomendações
  const invalidateRecommendations = () => {
    const queryClient = useQueryClient();
    console.log('♻️ [useRecommendations] Invalidando cache de recomendações');
    return queryClient.invalidateQueries({ 
      queryKey: [`/api/recommendations/${userId}`] 
    });
  };

  return {
    ...query,
    recommendations: query.data?.recommendations || [],
    userProfile: query.data?.userProfile || null,
    debug: query.data?.debug || null,
    refreshRecommendations,
    invalidateRecommendations,
    isEmpty: !query.isLoading && (!query.data?.recommendations || query.data.recommendations.length === 0),
    hasUserProfile: !!query.data?.userProfile && query.data.userProfile.totalInteractions > 0,
  };
}

/**
 * Hook para buscar recomendações com filtros específicos
 */
export function useFilteredRecommendations(
  userId: number | null | undefined,
  filters: RecommendationFilters,
  enabled: boolean = true
) {
  return useRecommendations(userId, {
    limit: filters.limit,
    entityTypes: filters.entityTypes,
    enabled: enabled && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutos para filtros (mais dinâmico)
  });
}

/**
 * Hook para widget de recomendações (versão compacta)
 */
export function useRecommendationWidget(
  userId: number | null | undefined,
  options: { 
    limit?: number;
    entityTypes?: string[];
    enabled?: boolean;
  } = {}
) {
  const { limit = 5, ...otherOptions } = options;
  
  return useRecommendations(userId, {
    limit,
    staleTime: 10 * 60 * 1000, // 10 minutos (mais cache para widgets)
    refetchInterval: false,
    ...otherOptions,
  });
}

/**
 * Hook para buscar perfil de atividade do usuário
 */
export function useUserActivityProfile(
  userId: number | null | undefined,
  enabled: boolean = true
) {
  const queryKey = [`/api/users/${userId}/activity-profile`];

  return useQuery({
    queryKey,
    enabled: enabled && !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      
      console.log('📊 [useUserActivityProfile] Buscando perfil de atividade:', userId);
      
      return apiRequest(`/api/users/${userId}/activity-profile`);
    },
  });
}

/**
 * Hook para invalidar todas as queries relacionadas a recomendações
 */
export function useRecommendationCache() {
  const queryClient = useQueryClient();

  const invalidateAll = (userId?: number) => {
    const patterns = userId 
      ? [`/api/recommendations/${userId}`, `/api/users/${userId}/activity-profile`]
      : ['/api/recommendations/', '/api/users/'];

    patterns.forEach(pattern => {
      queryClient.invalidateQueries({ 
        queryKey: [pattern],
        type: 'all' 
      });
    });

    console.log('🧹 [useRecommendationCache] Cache invalidado:', patterns);
  };

  const clearAll = (userId?: number) => {
    const patterns = userId 
      ? [`/api/recommendations/${userId}`, `/api/users/${userId}/activity-profile`]
      : ['/api/recommendations/', '/api/users/'];

    patterns.forEach(pattern => {
      queryClient.removeQueries({ 
        queryKey: [pattern] 
      });
    });

    console.log('🗑️ [useRecommendationCache] Cache limpo:', patterns);
  };

  const preloadRecommendations = async (userId: number, options: UseRecommendationsOptions = {}) => {
    const { limit = 10, entityTypes } = options;
    const queryKey = [
      `/api/recommendations/${userId}`,
      { limit, entityTypes: entityTypes?.sort() }
    ];

    await queryClient.prefetchQuery({
      queryKey,
      queryFn: async () => {
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit.toString());
        if (entityTypes?.length) {
          entityTypes.forEach(type => params.append('types', type));
        }

        const url = `/api/recommendations/${userId}${params.toString() ? `?${params.toString()}` : ''}`;
        return apiRequest(url);
      },
      staleTime: 5 * 60 * 1000,
    });

    console.log('⚡ [useRecommendationCache] Recomendações pré-carregadas:', queryKey);
  };

  return {
    invalidateAll,
    clearAll,
    preloadRecommendations,
  };
}

// Utilities para trabalhar com recomendações
export const recommendationUtils = {
  /**
   * Agrupa recomendações por categoria
   */
  groupByCategory: (recommendations: Recommendation[]) => {
    return recommendations.reduce((groups, rec) => {
      const category = rec.category || 'Outros';
      if (!groups[category]) groups[category] = [];
      groups[category].push(rec);
      return groups;
    }, {} as Record<string, Recommendation[]>);
  },

  /**
   * Agrupa recomendações por tipo de entidade
   */
  groupByEntityType: (recommendations: Recommendation[]) => {
    return recommendations.reduce((groups, rec) => {
      const type = rec.entityType;
      if (!groups[type]) groups[type] = [];
      groups[type].push(rec);
      return groups;
    }, {} as Record<string, Recommendation[]>);
  },

  /**
   * Filtra recomendações por score mínimo
   */
  filterByScore: (recommendations: Recommendation[], minScore: number) => {
    return recommendations.filter(rec => rec.score >= minScore);
  },

  /**
   * Ordena recomendações por score (decrescente)
   */
  sortByScore: (recommendations: Recommendation[]) => {
    return [...recommendations].sort((a, b) => b.score - a.score);
  },

  /**
   * Obtém as top N recomendações
   */
  getTop: (recommendations: Recommendation[], count: number) => {
    return recommendationUtils.sortByScore(recommendations).slice(0, count);
  },

  /**
   * Verifica se uma recomendação é recente (últimos 7 dias)
   */
  isRecent: (recommendation: Recommendation) => {
    if (!recommendation.metadata?.createdAt) return false;
    const createdAt = new Date(recommendation.metadata.createdAt);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return createdAt > sevenDaysAgo;
  },

  /**
   * Formata o score de relevância para exibição
   */
  formatScore: (score: number) => {
    return Math.round(score * 100);
  },

  /**
   * Obtém a cor do badge baseada no score
   */
  getScoreBadgeColor: (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
  },

  /**
   * Gera texto amigável para o tipo de entidade
   */
  getEntityTypeLabel: (entityType: Recommendation['entityType']) => {
    const labels = {
      beneficio: 'Benefício',
      historia: 'História Inspiradora',
      missao: 'Missão',
      noticia: 'Notícia',
      leilao: 'Leilão',
      premio: 'Prêmio',
    };
    return labels[entityType] || entityType;
  },

  /**
   * Obtém ícone apropriado para o tipo de entidade
   */
  getEntityTypeIcon: (entityType: Recommendation['entityType']) => {
    const icons = {
      beneficio: '🎁',
      historia: '📖',
      missao: '🎯',
      noticia: '📰',
      leilao: '🏆',
      premio: '🏅',
    };
    return icons[entityType] || '📄';
  },
};