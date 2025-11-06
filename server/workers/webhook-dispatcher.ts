import { createHmac } from 'crypto';
import { db } from '../db';
import { eq, and, lte, sql } from 'drizzle-orm';
import { gritoWebhookDeliveries, gritoWebhookSubscriptions, gritoEvents } from '@shared/schema';

const WEBHOOK_DISPATCHER_INTERVAL = 60 * 1000; // 1 minuto
const MAX_RETRIES = 6;
const BACKOFF_MINUTES = [2, 4, 8, 16, 32]; // backoff exponencial em minutos

interface DeliveryWithData {
  id: number;
  eventId: number;
  subscriptionId: number;
  status: string;
  attemptCount: number;
  nextAttemptAt: Date;
  lastAttemptAt: Date | null;
  response: any;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Dados do evento
  eventName: string;
  userId: number;
  occurredAt: Date;
  source: string;
  payload: any;
  // Dados da subscription
  endpointUrl: string;
  secret: string;
  destinationName: string;
}

async function sendWebhook(delivery: DeliveryWithData): Promise<{ success: boolean; response?: any; error?: string }> {
  try {
    const webhookPayload = {
      id: delivery.eventId,
      event_name: delivery.eventName,
      user_id: delivery.userId,
      occurred_at: delivery.occurredAt.toISOString(),
      source: delivery.source,
      payload: delivery.payload,
    };

    const body = JSON.stringify(webhookPayload);
    
    // Criar assinatura HMAC SHA256
    const signature = createHmac('sha256', delivery.secret)
      .update(body)
      .digest('hex');

    console.log(`📤 [WEBHOOK DISPATCH] Enviando para ${delivery.destinationName}: ${delivery.eventName}`);

    const response = await fetch(delivery.endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Grito-Event': delivery.eventName,
        'X-Grito-Signature': `sha256=${signature}`,
      },
      body,
    });

    if (response.ok) {
      const responseData = await response.text();
      console.log(`✅ [WEBHOOK SUCCESS] ${delivery.destinationName}: ${response.status}`);
      
      return {
        success: true,
        response: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseData,
        },
      };
    } else {
      const errorText = await response.text();
      console.error(`❌ [WEBHOOK ERROR] ${delivery.destinationName}: ${response.status} - ${errorText}`);
      
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
        response: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText,
        },
      };
    }
  } catch (error: any) {
    console.error(`❌ [WEBHOOK ERROR] ${delivery.destinationName}:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

function calculateNextAttempt(attemptCount: number): Date {
  if (attemptCount >= BACKOFF_MINUTES.length) {
    // Após todas as tentativas, marcar como falha
    return new Date();
  }
  
  const delayMinutes = BACKOFF_MINUTES[attemptCount];
  const nextAttempt = new Date();
  nextAttempt.setMinutes(nextAttempt.getMinutes() + delayMinutes);
  
  return nextAttempt;
}

async function processPendingDeliveries() {
  try {
    console.log('🔄 [WEBHOOK WORKER] Processando deliveries pendentes...');

    // Buscar até 20 deliveries pendentes que estão prontas para tentar
    const pendingDeliveries = await db
      .select({
        // Delivery data
        id: gritoWebhookDeliveries.id,
        eventId: gritoWebhookDeliveries.eventId,
        subscriptionId: gritoWebhookDeliveries.subscriptionId,
        status: gritoWebhookDeliveries.status,
        attemptCount: gritoWebhookDeliveries.attemptCount,
        nextAttemptAt: gritoWebhookDeliveries.nextAttemptAt,
        lastAttemptAt: gritoWebhookDeliveries.lastAttemptAt,
        response: gritoWebhookDeliveries.response,
        errorMessage: gritoWebhookDeliveries.errorMessage,
        createdAt: gritoWebhookDeliveries.createdAt,
        updatedAt: gritoWebhookDeliveries.updatedAt,
        // Event data
        eventName: gritoEvents.eventName,
        userId: gritoEvents.userId,
        occurredAt: gritoEvents.occurredAt,
        source: gritoEvents.source,
        payload: gritoEvents.payload,
        // Subscription data
        endpointUrl: gritoWebhookSubscriptions.endpointUrl,
        secret: gritoWebhookSubscriptions.secret,
        destinationName: gritoWebhookSubscriptions.destinationName,
      })
      .from(gritoWebhookDeliveries)
      .innerJoin(gritoEvents, eq(gritoWebhookDeliveries.eventId, gritoEvents.id))
      .innerJoin(gritoWebhookSubscriptions, eq(gritoWebhookDeliveries.subscriptionId, gritoWebhookSubscriptions.id))
      .where(and(
        eq(gritoWebhookDeliveries.status, 'PENDING'),
        lte(gritoWebhookDeliveries.nextAttemptAt, new Date())
      ))
      .limit(20);

    console.log(`📋 [WEBHOOK WORKER] Encontradas ${pendingDeliveries.length} deliveries para processar`);

    for (const delivery of pendingDeliveries) {
      try {
        const result = await sendWebhook(delivery as DeliveryWithData);
        
        const newAttemptCount = delivery.attemptCount + 1;
        
        if (result.success) {
          // Sucesso - marcar como OK
          await db
            .update(gritoWebhookDeliveries)
            .set({
              status: 'OK',
              attemptCount: newAttemptCount,
              lastAttemptAt: new Date(),
              response: result.response,
              errorMessage: null,
              updatedAt: new Date(),
            })
            .where(eq(gritoWebhookDeliveries.id, delivery.id));
          
          console.log(`✅ [WEBHOOK COMPLETE] Delivery ${delivery.id} para ${delivery.destinationName} concluída`);
        } else {
          // Falha - verificar se deve tentar novamente
          if (newAttemptCount >= MAX_RETRIES) {
            // Máximo de tentativas atingido - marcar como FAIL
            await db
              .update(gritoWebhookDeliveries)
              .set({
                status: 'FAIL',
                attemptCount: newAttemptCount,
                lastAttemptAt: new Date(),
                response: result.response,
                errorMessage: result.error,
                updatedAt: new Date(),
              })
              .where(eq(gritoWebhookDeliveries.id, delivery.id));
            
            console.log(`❌ [WEBHOOK FAILED] Delivery ${delivery.id} falhada após ${newAttemptCount} tentativas`);
          } else {
            // Agendar próxima tentativa com backoff exponencial
            const nextAttempt = calculateNextAttempt(newAttemptCount - 1);
            
            await db
              .update(gritoWebhookDeliveries)
              .set({
                attemptCount: newAttemptCount,
                lastAttemptAt: new Date(),
                nextAttemptAt: nextAttempt,
                response: result.response,
                errorMessage: result.error,
                updatedAt: new Date(),
              })
              .where(eq(gritoWebhookDeliveries.id, delivery.id));
            
            console.log(`🔄 [WEBHOOK RETRY] Delivery ${delivery.id} reagendada para ${nextAttempt.toISOString()}`);
          }
        }
      } catch (error) {
        console.error(`❌ [WEBHOOK WORKER] Erro ao processar delivery ${delivery.id}:`, error);
        
        // Marcar erro genérico e reagendar
        const newAttemptCount = delivery.attemptCount + 1;
        const nextAttempt = newAttemptCount >= MAX_RETRIES 
          ? new Date() 
          : calculateNextAttempt(newAttemptCount - 1);
        
        await db
          .update(gritoWebhookDeliveries)
          .set({
            status: newAttemptCount >= MAX_RETRIES ? 'FAIL' : 'PENDING',
            attemptCount: newAttemptCount,
            lastAttemptAt: new Date(),
            nextAttemptAt: nextAttempt,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            updatedAt: new Date(),
          })
          .where(eq(gritoWebhookDeliveries.id, delivery.id));
      }
    }

    console.log(`🎯 [WEBHOOK WORKER] Processamento concluído: ${pendingDeliveries.length} deliveries processadas`);
  } catch (error) {
    console.error('❌ [WEBHOOK WORKER] Erro geral:', error);
  }
}

async function startWebhookDispatcher() {
  console.log('🚀 [WEBHOOK WORKER] Iniciando webhook dispatcher...');
  console.log(`⏱️ [WEBHOOK WORKER] Intervalo: ${WEBHOOK_DISPATCHER_INTERVAL / 1000}s`);
  console.log(`🔄 [WEBHOOK WORKER] Max retries: ${MAX_RETRIES}`);
  console.log(`⏰ [WEBHOOK WORKER] Backoff: ${BACKOFF_MINUTES.join(', ')} minutos`);

  // Processar imediatamente
  await processPendingDeliveries();

  // Agendar execução periódica
  setInterval(async () => {
    await processPendingDeliveries();
  }, WEBHOOK_DISPATCHER_INTERVAL);

  console.log('✅ [WEBHOOK WORKER] Webhook dispatcher ativo');
}

// Iniciar worker se este arquivo for executado diretamente
if (require.main === module) {
  startWebhookDispatcher().catch((error) => {
    console.error('❌ [WEBHOOK WORKER] Falha ao iniciar:', error);
    process.exit(1);
  });
}

export { startWebhookDispatcher, processPendingDeliveries };