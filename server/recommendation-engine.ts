import { db } from "./db";
import { 
  activityEvents, 
  userInterests, 
  beneficios, 
  historiasInspiradoras,
  missoesSemanais,
  users,
  type ActivityEvent, 
  type UserInterest,
  type RecommendationResponse,
  type RecommendationItem,
  ActivityEventType,
  EntityType
} from "@shared/schema";
import { eq, and, sql, desc, asc, gte, inArray } from "drizzle-orm";

// Configurações do algoritmo
interface RecommendationConfig {
  timeDecayFactor: number; // Fator de decaimento temporal (0.1 = decay rápido, 0.9 = decay lento)
  recencyWindowDays: number; // Janela de recência para boost (padrão: 7 dias)
  categoryDiversityThreshold: number; // % mínimo de diversidade de categorias (padrão: 0.2 = 20%)
  minActivityThreshold: number; // Mínimo de atividades para personalização
  coldStartFallback: boolean; // Se true, usa conteúdo popular para usuários novos
  debugMode: boolean; // Logs detalhados para debug
}

// Configuração padrão
const DEFAULT_CONFIG: RecommendationConfig = {
  timeDecayFactor: 0.85,
  recencyWindowDays: 7,
  categoryDiversityThreshold: 0.2,
  minActivityThreshold: 5,
  coldStartFallback: true,
  debugMode: false,
};

// Tipos para scoring interno
interface CategoryScore {
  category: string;
  score: number;
  interactions: number;
  lastInteraction: Date;
  avgTimeSpent: number;
  engagementScore: number;
}

interface ContentCandidate {
  entityType: string;
  entityId: string;
  title: string;
  category: string;
  tags: string[];
  publishedAt?: Date;
  popularity?: number;
  metadata?: Record<string, any>;
}

interface ScoredCandidate extends ContentCandidate {
  categoryAffinityScore: number;
  contentSimilarityScore: number;
  recencyBoostScore: number;
  diversityPenalty: number;
  finalScore: number;
  reason: string;
}

/**
 * Engine avançado de recomendações personalizadas
 * 
 * Implementa múltiplos algoritmos de scoring:
 * - Category Affinity: Baseado em preferências históricas
 * - Content Similarity: Similaridade com conteúdo consumido
 * - Recency Boost: Boost para conteúdo recente
 * - Diversity Engine: Garantia de diversificação
 * - Blend Engine: Mistura inteligente de tipos de conteúdo
 */
export class RecommendationEngine {
  private config: RecommendationConfig;

  constructor(config: Partial<RecommendationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Método principal para gerar recomendações personalizadas
   */
  async generateRecommendations(
    userId: number,
    entityTypes?: string[],
    limit: number = 10
  ): Promise<RecommendationResponse> {
    const startTime = Date.now();
    
    if (this.config.debugMode) {
      console.log(`🤖 [RECOMMENDATION ENGINE] Iniciando recomendações para usuário ${userId}`);
    }

    try {
      // 1. Análise do perfil do usuário
      const userProfile = await this.analyzeUserProfile(userId);
      
      // 2. Verificar se usuário tem atividade suficiente
      if (userProfile.totalInteractions < this.config.minActivityThreshold && this.config.coldStartFallback) {
        return await this.generateColdStartRecommendations(userId, entityTypes, limit);
      }

      // 3. Buscar candidatos de conteúdo
      const candidates = await this.fetchContentCandidates(entityTypes);

      // 4. Aplicar algoritmos de scoring
      const scoredCandidates = await this.scoreAllCandidates(userId, candidates, userProfile);

      // 5. Aplicar diversificação
      const diversifiedCandidates = this.applyDiversification(scoredCandidates, limit);

      // 6. Blending final e ordenação
      const finalRecommendations = this.blendAndRank(diversifiedCandidates, limit);

      const executionTime = Date.now() - startTime;

      if (this.config.debugMode) {
        console.log(`✅ [RECOMMENDATION ENGINE] Concluído em ${executionTime}ms - ${finalRecommendations.length} recomendações`);
      }

      return {
        recommendations: finalRecommendations,
        userProfile: {
          topCategories: userProfile.topCategories.slice(0, 5),
          topTags: userProfile.topTags.slice(0, 10),
          totalInteractions: userProfile.totalInteractions,
          lastActivity: userProfile.lastActivity,
        },
        debug: this.config.debugMode ? {
          algorithm: 'advanced_personalized',
          totalCandidates: candidates.length,
          filters: entityTypes || ['all'],
          scoringFactors: {
            categoryAffinity: 0.4,
            contentSimilarity: 0.3,
            recencyBoost: 0.2,
            diversity: 0.1,
          },
          executionTimeMs: executionTime,
          coldStart: false,
        } : undefined,
      };

    } catch (error) {
      console.error('❌ [RECOMMENDATION ENGINE] Erro ao gerar recomendações:', error);
      
      // Fallback para recomendações simples
      return await this.generateFallbackRecommendations(userId, entityTypes, limit);
    }
  }

  /**
   * Análise detalhada do perfil do usuário
   */
  private async analyzeUserProfile(userId: number): Promise<{
    totalInteractions: number;
    topCategories: Array<{ category: string; score: number }>;
    topTags: Array<{ tag: string; score: number }>;
    lastActivity: string | null;
    categoryScores: CategoryScore[];
    recentBehavior: ActivityEvent[];
  }> {
    // Buscar eventos recentes (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentEvents = await db
      .select()
      .from(activityEvents)
      .where(
        and(
          eq(activityEvents.userId, userId),
          gte(activityEvents.createdAt, thirtyDaysAgo)
        )
      )
      .orderBy(desc(activityEvents.createdAt));

    // Buscar interesses inferidos
    const interests = await db
      .select()
      .from(userInterests)
      .where(eq(userInterests.userId, userId))
      .orderBy(desc(userInterests.score));

    // Calcular scores por categoria
    const categoryScores = this.calculateCategoryAffinityScores(recentEvents);

    // Agrupar interesses
    const categoriesMap = new Map<string, number>();
    const tagsMap = new Map<string, number>();

    for (const interest of interests) {
      categoriesMap.set(interest.category, parseFloat(interest.score.toString()));
      tagsMap.set(interest.tag, parseFloat(interest.score.toString()));
    }

    const topCategories = Array.from(categoriesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([category, score]) => ({ category, score }));

    const topTags = Array.from(tagsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([tag, score]) => ({ tag, score }));

    return {
      totalInteractions: recentEvents.length,
      topCategories,
      topTags,
      lastActivity: recentEvents.length > 0 ? recentEvents[0].createdAt.toISOString() : null,
      categoryScores,
      recentBehavior: recentEvents.slice(0, 20),
    };
  }

  /**
   * Calcula scores de afinidade por categoria com decaimento temporal
   */
  private calculateCategoryAffinityScores(events: ActivityEvent[]): CategoryScore[] {
    const categoryData = new Map<string, {
      totalScore: number;
      interactions: number;
      timeSpent: number[];
      lastInteraction: Date;
      eventTypes: string[];
    }>();

    const now = new Date();

    for (const event of events) {
      const category = event.entityCategory || 'general';
      const eventDate = new Date(event.createdAt);
      const daysSinceEvent = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // Aplicar decaimento temporal
      const timeDecay = Math.exp(-daysSinceEvent * (1 - this.config.timeDecayFactor));
      
      // Peso baseado no tipo de evento
      const eventWeight = this.getEventWeight(event.eventType);
      
      // Score final para este evento
      const eventScore = eventWeight * timeDecay;

      if (!categoryData.has(category)) {
        categoryData.set(category, {
          totalScore: 0,
          interactions: 0,
          timeSpent: [],
          lastInteraction: eventDate,
          eventTypes: [],
        });
      }

      const data = categoryData.get(category)!;
      data.totalScore += eventScore;
      data.interactions++;
      data.eventTypes.push(event.eventType);
      
      if (event.duration) {
        data.timeSpent.push(event.duration);
      }

      if (eventDate > data.lastInteraction) {
        data.lastInteraction = eventDate;
      }
    }

    // Converter para CategoryScore
    return Array.from(categoryData.entries()).map(([category, data]) => ({
      category,
      score: data.totalScore,
      interactions: data.interactions,
      lastInteraction: data.lastInteraction,
      avgTimeSpent: data.timeSpent.length > 0 
        ? data.timeSpent.reduce((sum, time) => sum + time, 0) / data.timeSpent.length 
        : 0,
      engagementScore: this.calculateEngagementScore(data.eventTypes),
    })).sort((a, b) => b.score - a.score);
  }

  /**
   * Peso baseado no tipo de evento (mais engagement = mais peso)
   */
  private getEventWeight(eventType: string): number {
    const weights: Record<string, number> = {
      [ActivityEventType.VIEW]: 1.0,
      [ActivityEventType.CLICK]: 1.5,
      [ActivityEventType.DURATION]: 2.0,
      [ActivityEventType.LIKE]: 2.5,
      [ActivityEventType.SHARE]: 3.0,
      [ActivityEventType.COMPLETE]: 3.5,
      [ActivityEventType.COMMENT]: 4.0,
    };
    
    return weights[eventType] || 1.0;
  }

  /**
   * Calcula score de engagement baseado na variedade de eventos
   */
  private calculateEngagementScore(eventTypes: string[]): number {
    const uniqueTypes = new Set(eventTypes);
    const varietyScore = uniqueTypes.size / 7; // Max 7 tipos de evento
    const frequencyScore = Math.min(eventTypes.length / 10, 1); // Normalizado até 10 eventos
    
    return (varietyScore * 0.6) + (frequencyScore * 0.4);
  }

  /**
   * Busca candidatos de conteúdo de todas as fontes
   */
  private async fetchContentCandidates(entityTypes?: string[]): Promise<ContentCandidate[]> {
    const candidates: ContentCandidate[] = [];

    // Benefícios ativos
    if (!entityTypes || entityTypes.includes(EntityType.BENEFICIO)) {
      const beneficiosData = await db
        .select({
          id: beneficios.id,
          titulo: beneficios.titulo,
          categoria: beneficios.categoria,
          createdAt: beneficios.createdAt,
        })
        .from(beneficios)
        .where(eq(beneficios.ativo, true))
        .orderBy(desc(beneficios.ordem), desc(beneficios.createdAt));

      for (const beneficio of beneficiosData) {
        candidates.push({
          entityType: EntityType.BENEFICIO,
          entityId: beneficio.id.toString(),
          title: beneficio.titulo,
          category: beneficio.categoria,
          tags: [beneficio.categoria, 'beneficio'],
          publishedAt: beneficio.createdAt,
          metadata: { source: 'database' },
        });
      }
    }

    // Histórias inspiradoras
    if (!entityTypes || entityTypes.includes(EntityType.HISTORIA)) {
      const historiasData = await db
        .select({
          id: historiasInspiradoras.id,
          titulo: historiasInspiradoras.titulo,
          nome: historiasInspiradoras.nome,
          createdAt: historiasInspiradoras.createdAt,
        })
        .from(historiasInspiradoras)
        .where(eq(historiasInspiradoras.ativo, true))
        .orderBy(desc(historiasInspiradoras.ordem), desc(historiasInspiradoras.createdAt));

      for (const historia of historiasData) {
        candidates.push({
          entityType: EntityType.HISTORIA,
          entityId: historia.id.toString(),
          title: historia.titulo,
          category: 'inspiracao',
          tags: ['historia', 'inspiracao', 'social'],
          publishedAt: historia.createdAt,
          metadata: { source: 'database', nome: historia.nome },
        });
      }
    }

    // Missões semanais ativas
    if (!entityTypes || entityTypes.includes(EntityType.MISSAO)) {
      const missoesData = await db
        .select({
          id: missoesSemanais.id,
          titulo: missoesSemanais.titulo,
          descricao: missoesSemanais.descricao,
          tipoMissao: missoesSemanais.tipoMissao,
          createdAt: missoesSemanais.createdAt,
        })
        .from(missoesSemanais)
        .where(eq(missoesSemanais.ativo, true))
        .orderBy(desc(missoesSemanais.createdAt));

      for (const missao of missoesData) {
        candidates.push({
          entityType: EntityType.MISSAO,
          entityId: missao.id.toString(),
          title: missao.titulo,
          category: 'gamificacao',
          tags: ['missao', 'gamificacao', missao.tipoMissao || 'geral'],
          publishedAt: missao.createdAt,
          metadata: { source: 'database', tipo: missao.tipoMissao },
        });
      }
    }

    if (this.config.debugMode) {
      console.log(`📊 [RECOMMENDATION ENGINE] Encontrados ${candidates.length} candidatos de conteúdo`);
    }

    return candidates;
  }

  /**
   * Aplica todos os algoritmos de scoring aos candidatos
   */
  private async scoreAllCandidates(
    userId: number,
    candidates: ContentCandidate[],
    userProfile: any
  ): Promise<ScoredCandidate[]> {
    const scoredCandidates: ScoredCandidate[] = [];

    for (const candidate of candidates) {
      // 1. Category Affinity Score
      const categoryAffinityScore = this.calculateCategoryAffinityScore(
        candidate,
        userProfile.categoryScores
      );

      // 2. Content Similarity Score
      const contentSimilarityScore = this.calculateContentSimilarityScore(
        candidate,
        userProfile.topTags
      );

      // 3. Recency Boost Score
      const recencyBoostScore = this.calculateRecencyBoostScore(candidate);

      // 4. Diversity Penalty (será aplicado no final)
      const diversityPenalty = 0;

      // 5. Final Score (weighted average)
      const finalScore = (
        categoryAffinityScore * 0.4 +
        contentSimilarityScore * 0.3 +
        recencyBoostScore * 0.2 +
        (1 - diversityPenalty) * 0.1
      );

      // 6. Gerar razão da recomendação
      const reason = this.generateRecommendationReason(
        categoryAffinityScore,
        contentSimilarityScore,
        recencyBoostScore,
        candidate
      );

      scoredCandidates.push({
        ...candidate,
        categoryAffinityScore,
        contentSimilarityScore,
        recencyBoostScore,
        diversityPenalty,
        finalScore,
        reason,
      });
    }

    return scoredCandidates.sort((a, b) => b.finalScore - a.finalScore);
  }

  /**
   * Score baseado na afinidade com categorias do usuário
   */
  private calculateCategoryAffinityScore(
    candidate: ContentCandidate,
    categoryScores: CategoryScore[]
  ): number {
    const categoryMap = new Map(categoryScores.map(cs => [cs.category, cs.score]));
    
    const candidateCategory = candidate.category;
    const directScore = categoryMap.get(candidateCategory) || 0;
    
    // Também considerar tags relacionadas
    const tagScores = candidate.tags.map(tag => 
      categoryMap.get(tag) || 0
    );
    
    const avgTagScore = tagScores.length > 0 
      ? tagScores.reduce((sum, score) => sum + score, 0) / tagScores.length 
      : 0;

    // Score final = 70% categoria direta + 30% tags relacionadas
    const finalScore = (directScore * 0.7) + (avgTagScore * 0.3);
    
    // Normalizar entre 0-1
    return Math.min(finalScore / 10, 1);
  }

  /**
   * Score baseado na similaridade com conteúdo consumido
   */
  private calculateContentSimilarityScore(
    candidate: ContentCandidate,
    userTopTags: Array<{ tag: string; score: number }>
  ): number {
    if (userTopTags.length === 0) return 0;

    const userTagMap = new Map(userTopTags.map(ut => [ut.tag, ut.score]));
    
    let similaritySum = 0;
    let matchingTags = 0;

    for (const tag of candidate.tags) {
      const userTagScore = userTagMap.get(tag);
      if (userTagScore) {
        similaritySum += userTagScore;
        matchingTags++;
      }
    }

    if (matchingTags === 0) return 0;

    // Score baseado na média de similaridade das tags que combinam
    const avgSimilarity = similaritySum / matchingTags;
    
    // Boost para maior número de tags em comum
    const tagCoverageBoost = Math.min(matchingTags / candidate.tags.length, 1);
    
    return Math.min((avgSimilarity * tagCoverageBoost) / 10, 1);
  }

  /**
   * Score boost para conteúdo recente
   */
  private calculateRecencyBoostScore(candidate: ContentCandidate): number {
    if (!candidate.publishedAt) return 0.1; // Score baixo para conteúdo sem data
    
    const now = new Date();
    const publishDate = new Date(candidate.publishedAt);
    const daysSincePublished = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Boost máximo para conteúdo dos últimos 7 dias
    if (daysSincePublished <= this.config.recencyWindowDays) {
      return 1.0;
    }
    
    // Decay exponencial após a janela de recência
    const decayFactor = Math.exp(-(daysSincePublished - this.config.recencyWindowDays) / 30);
    return Math.max(decayFactor, 0.1);
  }

  /**
   * Aplica diversificação para evitar recomendações repetitivas
   */
  private applyDiversification(
    candidates: ScoredCandidate[],
    limit: number
  ): ScoredCandidate[] {
    const diversified: ScoredCandidate[] = [];
    const categoryCount = new Map<string, number>();
    const entityTypeCount = new Map<string, number>();
    
    const targetDiversityCount = Math.ceil(limit * this.config.categoryDiversityThreshold);
    
    for (const candidate of candidates) {
      if (diversified.length >= limit) break;
      
      const categoryFreq = categoryCount.get(candidate.category) || 0;
      const entityTypeFreq = entityTypeCount.get(candidate.entityType) || 0;
      
      // Aplicar penalty de diversidade
      let diversityPenalty = 0;
      
      // Penalty por categoria muito frequente
      if (categoryFreq >= Math.ceil(limit / 3)) {
        diversityPenalty += 0.3;
      }
      
      // Penalty por tipo de entidade muito frequente
      if (entityTypeFreq >= Math.ceil(limit / 2)) {
        diversityPenalty += 0.2;
      }
      
      // Aplicar penalty ao score
      const adjustedScore = candidate.finalScore * (1 - diversityPenalty);
      
      diversified.push({
        ...candidate,
        diversityPenalty,
        finalScore: adjustedScore,
      });
      
      // Atualizar contadores
      categoryCount.set(candidate.category, categoryFreq + 1);
      entityTypeCount.set(candidate.entityType, entityTypeFreq + 1);
    }
    
    return diversified.sort((a, b) => b.finalScore - a.finalScore);
  }

  /**
   * Blending final e ranking das recomendações
   */
  private blendAndRank(candidates: ScoredCandidate[], limit: number): RecommendationItem[] {
    return candidates.slice(0, limit).map(candidate => ({
      entityType: candidate.entityType as any,
      entityId: candidate.entityId,
      title: candidate.title,
      category: candidate.category,
      tags: candidate.tags,
      score: Math.round(candidate.finalScore * 100) / 100,
      reason: candidate.reason,
      metadata: {
        ...candidate.metadata,
        scoring: {
          categoryAffinity: Math.round(candidate.categoryAffinityScore * 100) / 100,
          contentSimilarity: Math.round(candidate.contentSimilarityScore * 100) / 100,
          recencyBoost: Math.round(candidate.recencyBoostScore * 100) / 100,
          diversityPenalty: Math.round(candidate.diversityPenalty * 100) / 100,
        },
      },
    }));
  }

  /**
   * Gera razão inteligente para a recomendação
   */
  private generateRecommendationReason(
    categoryScore: number,
    similarityScore: number,
    recencyScore: number,
    candidate: ContentCandidate
  ): string {
    if (categoryScore > 0.7) {
      return `Baseado no seu interesse em ${candidate.category}`;
    }
    
    if (similarityScore > 0.6) {
      return `Similar ao conteúdo que você curtiu`;
    }
    
    if (recencyScore > 0.8) {
      return `Conteúdo novo e relevante`;
    }
    
    if (categoryScore > 0.4) {
      return `Relacionado aos seus interesses`;
    }
    
    return `Descobrir algo novo`;
  }

  /**
   * Recomendações para usuários sem histórico suficiente (cold start)
   */
  private async generateColdStartRecommendations(
    userId: number,
    entityTypes?: string[],
    limit: number = 10
  ): Promise<RecommendationResponse> {
    if (this.config.debugMode) {
      console.log(`🆕 [RECOMMENDATION ENGINE] Cold start para usuário ${userId}`);
    }

    // Buscar conteúdo popular e recente
    const candidates = await this.fetchContentCandidates(entityTypes);
    
    // Para cold start, priorizar recência e diversidade
    const coldStartRecommendations = candidates
      .map(candidate => ({
        entityType: candidate.entityType as any,
        entityId: candidate.entityId,
        title: candidate.title,
        category: candidate.category,
        tags: candidate.tags,
        score: this.calculateRecencyBoostScore(candidate),
        reason: 'Conteúdo popular e recente',
        metadata: candidate.metadata,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return {
      recommendations: coldStartRecommendations,
      userProfile: {
        topCategories: [],
        topTags: [],
        totalInteractions: 0,
        lastActivity: null,
      },
      debug: this.config.debugMode ? {
        algorithm: 'cold_start',
        totalCandidates: candidates.length,
        filters: entityTypes || ['all'],
        scoringFactors: { recency: 1.0 },
      } : undefined,
    };
  }

  /**
   * Recomendações de fallback em caso de erro
   */
  private async generateFallbackRecommendations(
    userId: number,
    entityTypes?: string[],
    limit: number = 10
  ): Promise<RecommendationResponse> {
    console.log(`🔄 [RECOMMENDATION ENGINE] Fallback para usuário ${userId}`);

    try {
      // Fallback simples: buscar conteúdo mais recente
      const candidates = await this.fetchContentCandidates(entityTypes);
      
      const fallbackRecommendations = candidates
        .slice(0, limit)
        .map(candidate => ({
          entityType: candidate.entityType as any,
          entityId: candidate.entityId,
          title: candidate.title,
          category: candidate.category,
          tags: candidate.tags,
          score: 0.5,
          reason: 'Conteúdo recomendado',
          metadata: candidate.metadata,
        }));

      return {
        recommendations: fallbackRecommendations,
        userProfile: {
          topCategories: [],
          topTags: [],
          totalInteractions: 0,
          lastActivity: null,
        },
        debug: {
          algorithm: 'fallback',
          totalCandidates: candidates.length,
          filters: entityTypes || ['all'],
          scoringFactors: {},
        },
      };
    } catch (error) {
      console.error('❌ [RECOMMENDATION ENGINE] Erro no fallback:', error);
      
      return {
        recommendations: [],
        userProfile: {
          topCategories: [],
          topTags: [],
          totalInteractions: 0,
          lastActivity: null,
        },
      };
    }
  }
}