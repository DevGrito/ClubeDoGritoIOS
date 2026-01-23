import { Express } from "express";
import Stripe from "stripe";
import { db } from "./db";
import { users, doadores, donorSubscriptions } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { normalizePhoneToE164 } from "./stripeHelpers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export function registerAdminManualSubscription(app: Express) {
  app.post("/api/admin/manual-subscription", async (req, res) => {
    try {
      const { telefone, nome, email, plano, valor, periodicidade, dataPagamento, stripeCustomerId, stripePaymentIntentId } = req.body;
      
      console.log(`🔧 [ADMIN MANUAL SUB] Criando assinatura manual para ${nome} (${telefone})`);
      
      // 1. Normalizar telefone
      const phoneNormalized = normalizePhoneToE164(telefone);
      
      // 2. Criar/atualizar usuário
      const userRows = await db.insert(users).values({
        nome,
        telefone: phoneNormalized,
        email: email || 'temp@temp.com',
        plano,
        role: 'doador',
        tipo: 'doador',
        fonte: 'doacao',
        verificado: true,
        ativo: true,
        stripeCustomerId: stripeCustomerId
      }).onConflictDoUpdate({
        target: users.telefone,
        set: {
          nome,
          email: email || sql`${users.email}`,
          plano,
          stripeCustomerId: stripeCustomerId || sql`${users.stripeCustomerId}`
        }
      }).returning();
      
      const user = userRows[0];
      console.log(`✅ [ADMIN MANUAL SUB] Usuário criado/atualizado: ID ${user.id}`);
      
      // 3. Calcular trial_end baseado na periodicidade
      const dataPagamentoDate = new Date(dataPagamento);
      const trialEndDate = new Date(dataPagamentoDate);
      
      // Adicionar período correspondente
      switch (periodicidade) {
        case 'mensal':
          trialEndDate.setMonth(trialEndDate.getMonth() + 1);
          break;
        case 'trimestral':
          trialEndDate.setMonth(trialEndDate.getMonth() + 3);
          break;
        case 'semestral':
          trialEndDate.setMonth(trialEndDate.getMonth() + 6);
          break;
        case 'anual':
          trialEndDate.setFullYear(trialEndDate.getFullYear() + 1);
          break;
        default:
          trialEndDate.setMonth(trialEndDate.getMonth() + 1);
      }
      
      const trialEnd = Math.floor(trialEndDate.getTime() / 1000);
      
      console.log(`📅 [ADMIN MANUAL SUB] Pagamento: ${dataPagamentoDate.toISOString()}, Periodicidade: ${periodicidade}, Trial até: ${trialEndDate.toISOString()}`);
      
      // 4. Obter/criar produto e price na Stripe para o plano
      const planPricing: Record<string, { price: number, defaultPeriod: string }> = {
        eco: { price: 2990, defaultPeriod: 'mensal' },
        voz: { price: 4990, defaultPeriod: 'mensal' },
        grito: { price: 8970, defaultPeriod: 'mensal' },
        platinum: { price: 10000, defaultPeriod: 'mensal' }
      };
      
      const planInfo = planPricing[plano] || { price: Number(valor) * 100, defaultPeriod: periodicidade };
      
      // Mapear periodicidade para Stripe interval
      const intervalMap: Record<string, { interval: 'month' | 'year', interval_count: number }> = {
        mensal: { interval: 'month', interval_count: 1 },
        trimestral: { interval: 'month', interval_count: 3 },
        semestral: { interval: 'month', interval_count: 6 },
        anual: { interval: 'year', interval_count: 1 }
      };
      
      const stripeInterval = intervalMap[periodicidade] || { interval: 'month', interval_count: 3 };
      
      // Buscar produto existente
      let product = (await stripe.products.list({ limit: 100 })).data.find(
        p => p.name === `Doação - ${plano.charAt(0).toUpperCase() + plano.slice(1)}`
      );
      
      if (!product) {
        product = await stripe.products.create({
          name: `Doação - ${plano.charAt(0).toUpperCase() + plano.slice(1)}`,
          description: `Plano ${plano} - ${periodicidade}`
        });
        console.log(`✅ [ADMIN MANUAL SUB] Produto criado: ${product.id}`);
      }
      
      // Buscar/criar price
      let price = (await stripe.prices.list({ product: product.id, limit: 100 })).data.find(
        p => p.unit_amount === planInfo.price && 
             p.recurring?.interval === stripeInterval.interval &&
             p.recurring?.interval_count === stripeInterval.interval_count
      );
      
      if (!price) {
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: planInfo.price,
          currency: 'brl',
          recurring: stripeInterval
        });
        console.log(`✅ [ADMIN MANUAL SUB] Price criado: ${price.id}`);
      }
      
      // 5. Criar subscription com trial_end
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: price.id }],
        trial_end: trialEnd,
        collection_method: 'charge_automatically',
        metadata: {
          userId: String(user.id),
          plano,
          periodicidade,
          manual_recovery: 'true',
          historic_payment_intent: stripePaymentIntentId || '',
          data_pagamento_manual: dataPagamento
        }
      });
      
      console.log(`✅ [ADMIN MANUAL SUB] Subscription criada: ${subscription.id}, trial até ${trialEndDate.toISOString()}`);
      
      // 6. Criar registro de doador
      const doadorRows = await db.insert(doadores).values({
        userId: user.id,
        plano,
        valor: String(valor),
        periodicidade,
        status: 'paid',
        dataDoacaoInicial: dataPagamentoDate,
        ultimaDoacao: dataPagamentoDate,
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        stripePaymentIntentId: stripePaymentIntentId || null,
        ativo: true
      }).returning();
      
      const doador = doadorRows[0];
      console.log(`✅ [ADMIN MANUAL SUB] Doador criado: ID ${doador.id}`);
      
      // 7. Criar registro de donor_subscriptions
      await db.insert(donorSubscriptions).values({
        userId: user.id,
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        status: 'active',
        planName: `${plano} - ${periodicidade}`,
        planPriceId: price.id,
        collectionMethod: 'charge_automatically',
        currentPeriodStart: Math.floor(dataPagamentoDate.getTime() / 1000),
        currentPeriodEnd: trialEnd,
        billingCycleAnchor: trialEnd
      });
      
      console.log(`✅ [ADMIN MANUAL SUB] donor_subscriptions criado`);
      
      // 8. Atualizar user com subscription ID
      await db.update(users)
        .set({ 
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: 'active'
        })
        .where(eq(users.id, user.id));
      
      res.json({
        success: true,
        userId: user.id,
        doadorId: doador.id,
        subscriptionId: subscription.id,
        customerId: stripeCustomerId,
        trialEnd: trialEndDate.toISOString(),
        nextPayment: trialEndDate.toISOString()
      });
      
    } catch (error: any) {
      console.error('❌ [ADMIN MANUAL SUB] Erro:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });
}
