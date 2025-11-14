import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';

// Tipos para o sistema de rastreamento
export interface ActivityEvent {
  userId: number;
  eventType: 'view' | 'click' | 'duration' | 'complete' | 'share' | 'like' | 'comment' | 'start' | 'pause' | 'resume' | 'exit';
  entityType: 'noticia' | 'historia' | 'beneficio' | 'missao' | 'leilao' | 'premio' | 'page';
  entityId: string;
  entityTitle?: string;
  entityCategory?: string;
  entityTags?: string[];
  duration?: number;
  metadata?: Record<string, any>;
  sessionId?: string;
}

interface ActivityTrackerConfig {
  userId: number;
  sessionId?: string;
  batchSize?: number;
  debounceMs?: number;
  maxBatchWaitMs?: number;
  enableViewTracking?: boolean;
  enableDurationTracking?: boolean;
  minDurationMs?: number;
}

interface ViewSession {
  entityType: string;
  entityId: string;
  entityTitle?: string;
  entityCategory?: string;
  entityTags?: string[];
  startTime: number;
  lastActivity: number;
  totalDuration: number;
  isActive: boolean;
}

/**
 * Hook para rastreamento de atividade do usuário
 * Funcionalidades:
 * - Batching de eventos para eficiência
 * - Debouncing para evitar spam
 * - Timer automático para duração de visualização
 * - Gerenciamento de sessão de view
 * - Fallbacks para offline
 */
export function useActivityTracker(config: ActivityTrackerConfig) {
  const {
    userId,
    sessionId: providedSessionId,
    batchSize = 10,
    debounceMs = 1000,
    maxBatchWaitMs = 30000,
    enableViewTracking = true,
    enableDurationTracking = true,
    minDurationMs = 5000,
  } = config;

  // Estados
  const [sessionId] = useState(() => providedSessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [isTracking, setIsTracking] = useState(true);
  const [queueSize, setQueueSize] = useState(0);

  // Refs para gerenciamento
  const eventQueue = useRef<ActivityEvent[]>([]);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const batchTimer = useRef<NodeJS.Timeout>();
  const viewSession = useRef<ViewSession | null>(null);
  const pageVisibilityTimer = useRef<NodeJS.Timeout>();

  // Função para enviar eventos em lote
  const flushEvents = useCallback(async () => {
    if (eventQueue.current.length === 0) return;

    const eventsToSend = [...eventQueue.current];
    eventQueue.current = [];
    setQueueSize(0);

    try {
      console.log('📤 [ACTIVITY TRACKER] Enviando lote de eventos:', eventsToSend.length);

      await apiRequest('/api/activity/batch', {
        method: 'POST',
        body: JSON.stringify({ events: eventsToSend }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      //console.log('✅ [ACTIVITY TRACKER] Eventos enviados com sucesso');
    } catch (error) {
      //console.error('❌ [ACTIVITY TRACKER] Erro ao enviar eventos:', error);

      // Re-adicionar eventos na fila em caso de erro (com limite)
      if (eventQueue.current.length < batchSize * 2) {
        eventQueue.current.unshift(...eventsToSend);
        setQueueSize(eventQueue.current.length);
      }
    }
  }, [batchSize]);

  // Mantém referência estável da função
  const flushEventsRef = useRef(flushEvents);
  useEffect(() => {
    flushEventsRef.current = flushEvents;
  }, [flushEvents]);

  // Função para adicionar evento à fila
  const queueEvent = useCallback((event: Omit<ActivityEvent, 'userId' | 'sessionId'>) => {
    if (!isTracking || !userId) return;

    const fullEvent: ActivityEvent = {
      ...event,
      userId,
      sessionId,
      metadata: {
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        ...event.metadata,
      },
    };

    eventQueue.current.push(fullEvent);
    setQueueSize(eventQueue.current.length);

    console.log('📊 [ACTIVITY TRACKER] Evento adicionado à fila:', {
      eventType: event.eventType,
      entityType: event.entityType,
      entityId: event.entityId,
      queueSize: eventQueue.current.length,
    });

    // Flush imediato se atingir o tamanho do lote
    if (eventQueue.current.length >= batchSize) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      flushEvents();
      return;
    }

    // Debounce para envio
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(flushEvents, debounceMs);
  }, [userId, sessionId, isTracking, batchSize, debounceMs, flushEvents]);

  // Timer para garantir envio máximo em intervalo definido
  useEffect(() => {
    batchTimer.current = setInterval(() => {
      if (eventQueue.current.length > 0) {
        flushEventsRef.current();
      }
    }, maxBatchWaitMs);

    return () => {
      clearInterval(batchTimer.current!);
    };
  }, [maxBatchWaitMs]);

  // Função para iniciar sessão de view
  const startViewSession = useCallback((
    entityType: ActivityEvent['entityType'],
    entityId: string,
    entityTitle?: string,
    entityCategory?: string,
    entityTags?: string[]
  ) => {
    if (!enableViewTracking) return;

    // Finalizar sessão anterior se existir
    if (viewSession.current?.isActive) {
      endViewSession();
    }

    const now = Date.now();
    viewSession.current = {
      entityType,
      entityId,
      entityTitle,
      entityCategory,
      entityTags,
      startTime: now,
      lastActivity: now,
      totalDuration: 0,
      isActive: true,
    };

    // Registrar evento de início
    queueEvent({
      eventType: 'view',
      entityType,
      entityId,
      entityTitle,
      entityCategory,
      entityTags,
      metadata: { action: 'start' },
    });

    console.log('👁️ [ACTIVITY TRACKER] Sessão de view iniciada:', {
      entityType,
      entityId,
      entityTitle,
    });
  }, [enableViewTracking, queueEvent]);

  // Função para finalizar sessão de view
  const endViewSession = useCallback(() => {
    if (!viewSession.current?.isActive || !enableDurationTracking) return;

    const session = viewSession.current;
    const now = Date.now();
    const totalDuration = Math.round((now - session.startTime) / 1000); // em segundos

    if (totalDuration >= Math.round(minDurationMs / 1000)) {
      queueEvent({
        eventType: 'duration',
        entityType: session.entityType as ActivityEvent['entityType'],
        entityId: session.entityId,
        entityTitle: session.entityTitle,
        entityCategory: session.entityCategory,
        entityTags: session.entityTags,
        duration: totalDuration,
        metadata: { action: 'end' },
      });

      console.log('⏱️ [ACTIVITY TRACKER] Sessão de view finalizada:', {
        entityType: session.entityType,
        entityId: session.entityId,
        duration: totalDuration,
      });
    }

    viewSession.current.isActive = false;
  }, [enableDurationTracking, minDurationMs, queueEvent]);

  // Função para rastrear clique
  const trackClick = useCallback((
    entityType: ActivityEvent['entityType'],
    entityId: string,
    entityTitle?: string,
    entityCategory?: string,
    entityTags?: string[],
    metadata?: Record<string, any>
  ) => {
    queueEvent({
      eventType: 'click',
      entityType,
      entityId,
      entityTitle,
      entityCategory,
      entityTags,
      metadata,
    });

    console.log('🖱️ [ACTIVITY TRACKER] Clique rastreado:', {
      entityType,
      entityId,
      entityTitle,
    });
  }, [queueEvent]);

  // Função para rastrear conclusão
  const trackComplete = useCallback((
    entityType: ActivityEvent['entityType'],
    entityId: string,
    entityTitle?: string,
    entityCategory?: string,
    entityTags?: string[],
    metadata?: Record<string, any>
  ) => {
    queueEvent({
      eventType: 'complete',
      entityType,
      entityId,
      entityTitle,
      entityCategory,
      entityTags,
      metadata,
    });

    console.log('✅ [ACTIVITY TRACKER] Conclusão rastreada:', {
      entityType,
      entityId,
      entityTitle,
    });
  }, [queueEvent]);

  // Função para rastrear compartilhamento
  const trackShare = useCallback((
    entityType: ActivityEvent['entityType'],
    entityId: string,
    entityTitle?: string,
    entityCategory?: string,
    entityTags?: string[],
    metadata?: Record<string, any>
  ) => {
    queueEvent({
      eventType: 'share',
      entityType,
      entityId,
      entityTitle,
      entityCategory,
      entityTags,
      metadata,
    });

    console.log('📤 [ACTIVITY TRACKER] Compartilhamento rastreado:', {
      entityType,
      entityId,
      entityTitle,
    });
  }, [queueEvent]);

  // Função para rastrear curtida
  const trackLike = useCallback((
    entityType: ActivityEvent['entityType'],
    entityId: string,
    entityTitle?: string,
    entityCategory?: string,
    entityTags?: string[],
    metadata?: Record<string, any>
  ) => {
    queueEvent({
      eventType: 'like',
      entityType,
      entityId,
      entityTitle,
      entityCategory,
      entityTags,
      metadata,
    });

    console.log('❤️ [ACTIVITY TRACKER] Curtida rastreada:', {
      entityType,
      entityId,
      entityTitle,
    });
  }, [queueEvent]);

  // Gerenciamento de visibilidade da página
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Página ficou oculta - finalizar sessão de view
        endViewSession();

        // Flush eventos pendentes após um delay
        pageVisibilityTimer.current = setTimeout(() => {
          flushEvents();
        }, 1000);
      } else {
        // Página ficou visível - cancelar flush pendente
        if (pageVisibilityTimer.current) {
          clearTimeout(pageVisibilityTimer.current);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (pageVisibilityTimer.current) {
        clearTimeout(pageVisibilityTimer.current);
      }
    };
  }, [endViewSession, flushEvents]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      // Finalizar sessão ativa
      if (viewSession.current?.isActive) {
        endViewSession();
      }

      // Flush eventos pendentes
      if (eventQueue.current.length > 0) {
        flushEvents();
      }

      // Limpar timers
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (batchTimer.current) {
        clearInterval(batchTimer.current);
      }
      if (pageVisibilityTimer.current) {
        clearTimeout(pageVisibilityTimer.current);
      }
    };
  }, [endViewSession, flushEvents]);

  const endViewSessionRef = useRef(endViewSession);
  useEffect(() => {
    endViewSessionRef.current = endViewSession;
  }, [endViewSession]);

  // Flush antes de sair da página
  useEffect(() => {
    const handleBeforeUnload = () => {
      endViewSessionRef.current();
      // Envio síncrono para garantir que os dados sejam enviados
      if (eventQueue.current.length > 0) {
        navigator.sendBeacon('/api/activity/batch', JSON.stringify({
          events: eventQueue.current
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return {
    // Estados
    isTracking,
    queueSize,
    sessionId,

    // Controles
    setIsTracking,
    flushEvents,

    // Funções de rastreamento
    startViewSession,
    endViewSession,
    trackClick,
    trackComplete,
    trackShare,
    trackLike,

    // Função genérica
    track: queueEvent,
  };
}

export default useActivityTracker;