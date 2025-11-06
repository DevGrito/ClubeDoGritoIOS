import cron from 'node-cron';
import { db } from '../db';
import { donorSubscriptions, billingEvents } from '@shared/schema';
import { eq, ne, and, sql } from 'drizzle-orm';
import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY;

// 🔄 RECONCILIAÇÃO AUTOMÁTICA - Roda todos os dias às 3h da manhã
export function startSubscriptionReconciliation() {
  if (!stripeKey) {
    console.log('⚠️ [CRON] Stripe key não configurada, job de reconciliação desabilitado');
    return;
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2024-12-18.acacia',
  });

  cron.schedule('0 3 * * *', async () => {
    console.log('🔄 [CRON] Iniciando reconciliação automática de assinaturas...');
    
    try {
      let reconciledCount = 0;
      let errorCount = 0;
      
      // Buscar todas as assinaturas do banco que tenham stripeSubscriptionId (não só ativas!)
      const allSubscriptions = await db
        .select()
        .from(donorSubscriptions);
      
      console.log(`🔄 [CRON] ${allSubscriptions.length} assinaturas para reconciliar`);
      
      for (const sub of allSubscriptions) {
        if (!sub.stripeSubscriptionId) {
          console.log(`⚠️ [CRON] Assinatura ${sub.id} sem Stripe ID, pulando...`);
          continue;
        }
        
        try {
          // Buscar assinatura no Stripe
          const stripeSubscription = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
          
          // Verificar se status diverge
          if (stripeSubscription.status !== sub.status) {
            console.log(`🔄 [CRON] Divergência encontrada - Assinatura ${sub.id}: DB=${sub.status}, Stripe=${stripeSubscription.status}`);
            
            // Atualizar assinatura no banco
            await db
              .update(donorSubscriptions)
              .set({
                status: stripeSubscription.status,
                currentPeriodStart: stripeSubscription.current_period_start,
                currentPeriodEnd: stripeSubscription.current_period_end,
                cancelAt: stripeSubscription.cancel_at,
                canceledAt: stripeSubscription.canceled_at,
                updatedAt: new Date(),
              })
              .where(eq(donorSubscriptions.id, sub.id));
            
            // Registrar evento de reconciliação
            await db.insert(billingEvents).values({
              userId: sub.userId,
              subscriptionId: sub.id,
              stripeSubscriptionId: sub.stripeSubscriptionId,
              eventType: 'reconciliation.status_updated',
              status: stripeSubscription.status,
              payloadSummary: {
                previousStatus: sub.status,
                newStatus: stripeSubscription.status,
                source: 'cron_reconciliation',
              },
              processed: true,
            });
            
            reconciledCount++;
          }
        } catch (error: any) {
          console.error(`❌ [CRON] Erro ao reconciliar assinatura ${sub.id}:`, error.message);
          errorCount++;
        }
      }
      
      console.log(`✅ [CRON] Reconciliação concluída - ${reconciledCount} atualizadas, ${errorCount} erros`);
    } catch (error: any) {
      console.error('❌ [CRON] Erro na reconciliação automática:', error);
    }
  });
  
  console.log('✅ [CRON] Job de reconciliação de assinaturas agendado (todos os dias às 3h)');
}

// 🔄 DUNNING AUTOMÁTICO - Roda a cada 6 horas para tentar cobrar assinaturas past_due
export function startAutomaticDunning() {
  if (!stripeKey) {
    console.log('⚠️ [CRON] Stripe key não configurada, job de dunning desabilitado');
    return;
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2024-12-18.acacia',
  });

  cron.schedule('0 */6 * * *', async () => {
    console.log('⚠️ [CRON] Iniciando dunning automático...');
    
    try {
      let retryCount = 0;
      let successCount = 0;
      let errorCount = 0;
      
      // Buscar assinaturas past_due que ainda não foram tentadas nas últimas 6 horas
      const sixHoursAgo = new Date();
      sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);
      
      const pastDueSubscriptions = await db
        .select()
        .from(donorSubscriptions)
        .where(eq(donorSubscriptions.status, 'past_due'));
      
      console.log(`⚠️ [CRON] ${pastDueSubscriptions.length} assinaturas past_due encontradas`);
      
      for (const sub of pastDueSubscriptions) {
        if (!sub.stripeSubscriptionId) {
          continue;
        }
        
        // Pular se a última tentativa foi há menos de 6 horas
        if (sub.lastPaymentAttempt && new Date(sub.lastPaymentAttempt) > sixHoursAgo) {
          console.log(`⏭️ [CRON] Assinatura ${sub.id} tentada recentemente, pulando...`);
          continue;
        }
        
        try {
          retryCount++;
          
          // Buscar última invoice não paga
          const stripeSubscription = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
          const latestInvoiceId = typeof stripeSubscription.latest_invoice === 'string' 
            ? stripeSubscription.latest_invoice 
            : stripeSubscription.latest_invoice?.id;
          
          if (!latestInvoiceId) {
            console.log(`⚠️ [CRON] Assinatura ${sub.id} sem invoice, pulando...`);
            continue;
          }
          
          const invoice = await stripe.invoices.retrieve(latestInvoiceId);
          
          if (invoice.status === 'paid') {
            console.log(`✅ [CRON] Assinatura ${sub.id} já paga, atualizando status...`);
            
            await db
              .update(donorSubscriptions)
              .set({
                status: 'active',
                lastError: null,
                nextPaymentAttempt: null,
                updatedAt: new Date(),
              })
              .where(eq(donorSubscriptions.id, sub.id));
            
            successCount++;
            continue;
          }
          
          // Tentar cobrar novamente
          console.log(`🔄 [CRON] Tentando cobrar assinatura ${sub.id}...`);
          
          const paidInvoice = await stripe.invoices.pay(latestInvoiceId);
          
          // Atualizar assinatura
          await db
            .update(donorSubscriptions)
            .set({
              status: 'active',
              lastError: null,
              nextPaymentAttempt: null,
              lastPaymentAttempt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(donorSubscriptions.id, sub.id));
          
          // Registrar evento
          await db.insert(billingEvents).values({
            userId: sub.userId,
            subscriptionId: sub.id,
            stripeSubscriptionId: sub.stripeSubscriptionId,
            eventType: 'dunning.retry_succeeded',
            invoiceId: paidInvoice.id,
            amount: paidInvoice.amount_paid ? paidInvoice.amount_paid / 100 : null,
            currency: paidInvoice.currency,
            status: 'succeeded',
            processed: true,
          });
          
          successCount++;
          console.log(`✅ [CRON] Assinatura ${sub.id} cobrada com sucesso!`);
          
        } catch (error: any) {
          console.error(`❌ [CRON] Erro ao cobrar assinatura ${sub.id}:`, error.message);
          
          // Atualizar com erro
          await db
            .update(donorSubscriptions)
            .set({
              lastError: error.message,
              lastPaymentAttempt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(donorSubscriptions.id, sub.id));
          
          // Registrar evento
          await db.insert(billingEvents).values({
            userId: sub.userId,
            subscriptionId: sub.id,
            stripeSubscriptionId: sub.stripeSubscriptionId,
            eventType: 'dunning.retry_failed',
            status: 'failed',
            errorMessage: error.message,
            processed: true,
          });
          
          errorCount++;
        }
      }
      
      console.log(`✅ [CRON] Dunning concluído - ${retryCount} tentativas, ${successCount} sucessos, ${errorCount} erros`);
    } catch (error: any) {
      console.error('❌ [CRON] Erro no dunning automático:', error);
    }
  });
  
  console.log('✅ [CRON] Job de dunning automático agendado (a cada 6 horas)');
}
