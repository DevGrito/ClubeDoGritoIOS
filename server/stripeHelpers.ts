import Stripe from 'stripe';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

/**
 * Normaliza telefone brasileiro para formato E.164 (+5511987654321)
 */
export function normalizePhoneToE164(phone: string): string {
  if (!phone) return '';

  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Remove leading zeros
  cleaned = cleaned.replace(/^0+/, '');
  
  // Remove country code 55 if already present
  if (cleaned.startsWith('55')) {
    cleaned = cleaned.substring(2);
  }
  
  // For 10-digit numbers (landline), add 9 to convert to mobile format
  if (cleaned.length === 10) {
    const ddd = cleaned.substring(0, 2);
    const numero = cleaned.substring(2);
    cleaned = `${ddd}9${numero}`;
  }
  
  // Return in E.164 format: +55 + DDD + number
  return `+55${cleaned}`;
}

/**
 * Gera variações de telefone brasileiro para busca na Stripe
 * Retorna: ['+5511987654321', '11987654321', '5511987654321']
 */
export function getPhoneSearchVariants(phone: string): string[] {
  if (!phone) return [];
  
  try {
    const e164 = normalizePhoneToE164(phone);
    const digitsOnly = e164.replace(/\D/g, ''); // 5511987654321
    const withoutCountry = digitsOnly.substring(2); // 11987654321
    
    return [e164, withoutCountry, digitsOnly];
  } catch {
    // Se normalização falhar, tentar buscar pelo original
    const cleaned = phone.replace(/\D/g, '');
    return cleaned ? [cleaned] : [];
  }
}

/**
 * 🎯 FUNÇÃO CENTRALIZADA - Previne duplicação de Stripe Customers
 * 
 * Garante que cada usuário tenha APENAS 1 customer na Stripe:
 * 1. Verifica se já existe no banco (user.stripeCustomerId)
 * 2. Se não existe no banco, busca na Stripe por telefone/email
 * 3. Só cria novo customer se realmente não existir
 * 4. Atualiza banco automaticamente
 * 5. Retorna customerId sempre
 */
export async function getOrCreateStripeCustomer(
  userId: number,
  contactInfo?: { nome?: string; telefone?: string; email?: string }
): Promise<string> {
  try {
    console.log(`🔍 [GET_OR_CREATE_CUSTOMER] Iniciando para user ${userId}`);

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (!user) {
      throw new Error(`User ${userId} não encontrado no banco`);
    }

    if (user.stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        if (!customer.deleted) {
          console.log(`✅ [GET_OR_CREATE_CUSTOMER] Customer existente encontrado: ${user.stripeCustomerId}`);
          return user.stripeCustomerId;
        } else {
          console.warn(`⚠️  [GET_OR_CREATE_CUSTOMER] Customer ${user.stripeCustomerId} foi deletado, criando novo`);
        }
      } catch (error) {
        console.warn(`⚠️  [GET_OR_CREATE_CUSTOMER] Customer ${user.stripeCustomerId} inválido, procurando outro`);
      }
    }

    const nome = contactInfo?.nome || user.nome || '';
    const telefone = contactInfo?.telefone || user.telefone || '';
    const email = contactInfo?.email || user.email || '';

    // 🔍 BUSCA 1: Por telefone (previne duplicatas mesmo com emails diferentes)
    if (telefone) {
      const phoneVariants = getPhoneSearchVariants(telefone);
      
      if (phoneVariants.length > 0) {
        console.log(`🔍 [GET_OR_CREATE_CUSTOMER] Buscando por variações de telefone:`, phoneVariants);
        
        try {
          // Buscar por cada variação até encontrar
          for (const variant of phoneVariants) {
            const customersByPhone = await stripe.customers.search({
              query: `phone~"${variant}"`,
              limit: 10,
            });

            if (customersByPhone.data.length > 0) {
              const existingCustomer = customersByPhone.data.find(c => !c.deleted);
              
              if (existingCustomer) {
                console.log(`✅ [GET_OR_CREATE_CUSTOMER] Customer encontrado por telefone (variação: ${variant}): ${existingCustomer.id} (${existingCustomer.phone})`);
                
                await db.update(users)
                  .set({ stripeCustomerId: existingCustomer.id })
                  .where(eq(users.id, userId));
                
                return existingCustomer.id;
              }
            }
          }
        } catch (error) {
          console.warn(`⚠️  [GET_OR_CREATE_CUSTOMER] Erro na busca por telefone:`, error);
        }
      }
    }

    // 🔍 BUSCA 2: Por email (fallback se telefone não encontrou)
    if (email && email.includes('@')) {
      const customersByEmail = await stripe.customers.list({
        email: email,
        limit: 10,
      });

      for (const existingCustomer of customersByEmail.data) {
        if (!existingCustomer.deleted) {
          console.log(`✅ [GET_OR_CREATE_CUSTOMER] Customer encontrado por email: ${existingCustomer.id}`);
          
          await db.update(users)
            .set({ stripeCustomerId: existingCustomer.id })
            .where(eq(users.id, userId));
          
          return existingCustomer.id;
        }
      }
    }

    console.log(`➕ [GET_OR_CREATE_CUSTOMER] Criando novo customer para user ${userId}`);
    
    // Normalizar telefone para E.164 antes de salvar na Stripe
    let phoneToSave: string | undefined = undefined;
    if (telefone) {
      try {
        phoneToSave = normalizePhoneToE164(telefone);
        console.log(`📱 [GET_OR_CREATE_CUSTOMER] Telefone normalizado: ${telefone} → ${phoneToSave}`);
      } catch (error) {
        console.warn(`⚠️  [GET_OR_CREATE_CUSTOMER] Falha ao normalizar telefone, usando original:`, error);
        phoneToSave = telefone;
      }
    }
    
    const newCustomer = await stripe.customers.create({
      name: nome,
      phone: phoneToSave,
      email: email && email.includes('@') ? email : undefined,
      metadata: {
        userId: String(userId),
        source: 'clube_do_grito',
        created_by: 'getOrCreateStripeCustomer',
      },
    });

    console.log(`✅ [GET_OR_CREATE_CUSTOMER] Novo customer criado: ${newCustomer.id}`);

    await db.update(users)
      .set({ stripeCustomerId: newCustomer.id })
      .where(eq(users.id, userId));

    return newCustomer.id;

  } catch (error) {
    console.error(`❌ [GET_OR_CREATE_CUSTOMER] Erro:`, error);
    throw error;
  }
}

/**
 * 🛡️ FUNÇÃO AUXILIAR - Previne duplicação de Payment Methods
 * 
 * Verifica se o cartão já está salvo antes de anexar
 * Retorna: true se anexou novo cartão, false se cartão já existia
 */
export async function attachPaymentMethodSafely(
  paymentMethodId: string,
  customerId: string
): Promise<{ attached: boolean; paymentMethodId: string }> {
  try {
    const pmToAttach = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    if (!pmToAttach.card?.fingerprint) {
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
      console.log(`✅ [ATTACH_PM] Payment method ${paymentMethodId} anexado`);
      return { attached: true, paymentMethodId };
    }

    const existingPMs = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
      limit: 100,
    });

    const duplicate = existingPMs.data.find(
      pm => pm.card?.fingerprint === pmToAttach.card?.fingerprint
    );

    if (duplicate) {
      console.log(`⚠️  [ATTACH_PM] Cartão já existe: ${duplicate.id} (fingerprint: ${pmToAttach.card.fingerprint})`);
      console.log(`   Usando cartão existente em vez de duplicar`);
      return { attached: false, paymentMethodId: duplicate.id };
    }

    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    console.log(`✅ [ATTACH_PM] Payment method ${paymentMethodId} anexado (novo cartão)`);
    return { attached: true, paymentMethodId };

  } catch (error) {
    console.error(`❌ [ATTACH_PM] Erro ao anexar payment method:`, error);
    throw error;
  }
}
