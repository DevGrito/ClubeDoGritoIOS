import Stripe from 'stripe';
import { db } from '../db';
import { ingressos } from '@shared/schema';
import { eq, desc, sql } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface SyncResult {
  total: number;
  novos: number;
  existentes: number;
  erros: number;
  detalhes: Array<{
    paymentIntentId: string;
    status: 'criado' | 'existente' | 'erro';
    mensagem?: string;
  }>;
}

export async function syncStripeIngressos(): Promise<SyncResult> {
  console.log('🔄 [STRIPE SYNC] Iniciando sincronização automática...');
  
  const resultado: SyncResult = {
    total: 0,
    novos: 0,
    existentes: 0,
    erros: 0,
    detalhes: []
  };

  try {
    const pagamentos: any[] = [];
    let hasMore = true;
    let startingAfter: string | undefined = undefined;
    
    // Buscar TODOS os PaymentIntents de ingressos
    while (hasMore) {
      const params: any = {
        limit: 100,
      };
      
      if (startingAfter) {
        params.starting_after = startingAfter;
      }
      
      const paymentIntents = await stripe.paymentIntents.list(params);
      
      // Filtrar apenas ingressos 2026
      const ingressos = paymentIntents.data.filter(pi => 
        pi.metadata?.tipo === 'ingresso_2026'
      );
      
      pagamentos.push(...ingressos);
      
      hasMore = paymentIntents.has_more;
      if (hasMore && paymentIntents.data.length > 0) {
        startingAfter = paymentIntents.data[paymentIntents.data.length - 1].id;
      }
    }
    
    console.log(`📋 [STRIPE SYNC] Encontrados ${pagamentos.length} PaymentIntents de ingressos`);
    resultado.total = pagamentos.length;
    
    // Processar cada pagamento
    for (const pi of pagamentos) {
      try {
        // Verificar se já existe no banco pelo stripeCheckoutSessionId
        const existente = await db
          .select({
            id: ingressos.id,
            numero: ingressos.numero,
            stripeCheckoutSessionId: ingressos.stripeCheckoutSessionId
          })
          .from(ingressos)
          .where(eq(ingressos.stripeCheckoutSessionId, pi.id))
          .limit(1);
        
        if (existente.length > 0) {
          // Já existe
          resultado.existentes++;
          resultado.detalhes.push({
            paymentIntentId: pi.id,
            status: 'existente'
          });
          continue;
        }
        
        // Verificar se o pagamento foi aprovado
        if (pi.status !== 'succeeded') {
          continue;
        }
        
        // Criar novo ingresso
        const nome = pi.metadata?.nome || 'Sem nome';
        const telefone = pi.metadata?.telefone || '';
        const email = pi.metadata?.email || 'contato@institutoogrito.com.br';
        
        // Gerar próximo número de ingresso (filtrar apenas números válidos)
        const ultimoIngresso = await db
          .select({
            numero: ingressos.numero
          })
          .from(ingressos)
          .where(sql`${ingressos.numero} ~ '^[0-9]+$'`) // Apenas números válidos
          .orderBy(sql`CAST(${ingressos.numero} AS INTEGER) DESC`)
          .limit(1);
        
        let proximoNumero = 1;
        if (ultimoIngresso.length > 0) {
          const ultimoNum = parseInt(ultimoIngresso[0].numero);
          proximoNumero = isNaN(ultimoNum) ? 1 : ultimoNum + 1;
        }
        
        // Inserir ingresso
        await db.insert(ingressos).values({
          numero: proximoNumero.toString().padStart(3, '0'),
          nomeComprador: nome,
          telefoneComprador: telefone,
          emailComprador: email,
          valorPago: pi.amount,
          gateway: 'stripe',
          status: 'aprovado',
          stripeCheckoutSessionId: pi.id,
          eventoNome: 'IV ENCONTRO Do Grito',
          eventoData: '23 Outubro de 2025',
          eventoHora: '19h30',
          dataCompra: new Date(pi.created * 1000),
        });
        
        resultado.novos++;
        resultado.detalhes.push({
          paymentIntentId: pi.id,
          status: 'criado',
          mensagem: `Ingresso #${proximoNumero} criado para ${nome}`
        });
        
        console.log(`✅ [STRIPE SYNC] Ingresso #${proximoNumero} criado: ${nome}`);
        
      } catch (error: any) {
        resultado.erros++;
        resultado.detalhes.push({
          paymentIntentId: pi.id,
          status: 'erro',
          mensagem: error.message
        });
        console.error(`❌ [STRIPE SYNC] Erro ao processar ${pi.id}:`, error.message);
      }
    }
    
    console.log(`✅ [STRIPE SYNC] Concluído: ${resultado.novos} novos, ${resultado.existentes} existentes, ${resultado.erros} erros`);
    
  } catch (error: any) {
    console.error('❌ [STRIPE SYNC] Erro geral na sincronização:', error);
    throw error;
  }
  
  return resultado;
}
