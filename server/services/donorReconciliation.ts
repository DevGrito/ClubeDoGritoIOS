import Stripe from 'stripe';
import { db } from '../db';
import { doadores, users } from '@shared/schema';
import { eq, notInArray, isNotNull } from 'drizzle-orm';
import { enviarDoadorParaDinamize } from './dinamize';

const stripeKey = process.env.STRIPE_SECRET_KEY;

function mapStatusLocal(stripeStatus: string): string {
  if (stripeStatus === 'active' || stripeStatus === 'trialing') return 'paid';
  if (stripeStatus === 'canceled') return 'canceled';
  return stripeStatus;
}

export async function reconcileDonors(): Promise<{
  verificados: number;
  corrigidos: number;
  dinamizeSyncados: number;
  erros: number;
}> {
  if (!stripeKey) {
    console.warn('[RECONCILE-DOADORES] Stripe key não configurada — abortando');
    return { verificados: 0, corrigidos: 0, dinamizeSyncados: 0, erros: 0 };
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' });

  let verificados = 0;
  let corrigidos = 0;
  let dinamizeSyncados = 0;
  let erros = 0;

  // Busca doadores com status não-terminal que tenham stripe_subscription_id
  const pendentes = await db
    .select()
    .from(doadores)
    .where(
      notInArray(doadores.status, ['paid', 'canceled'])
    );

  const comSubscription = pendentes.filter(d => d.stripeSubscriptionId);

  console.log(`[RECONCILE-DOADORES] ${pendentes.length} doadores não-terminais encontrados, ${comSubscription.length} com Stripe ID`);

  for (const doador of comSubscription) {
    verificados++;
    try {
      const stripeSub = await stripe.subscriptions.retrieve(doador.stripeSubscriptionId!);
      const novoStatus = mapStatusLocal(stripeSub.status);
      const statusAtual = doador.status;

      if (novoStatus === statusAtual) continue;

      const isAtivo = stripeSub.status === 'active' || stripeSub.status === 'trialing';

      console.log(`[RECONCILE-DOADORES] Doador ${doador.id} — DB: ${statusAtual} → Stripe: ${stripeSub.status} → corrigindo para ${novoStatus}`);

      await db
        .update(doadores)
        .set({
          status: novoStatus,
          ativo: isAtivo,
          ultimaDoacao: isAtivo ? new Date() : doador.ultimaDoacao,
          updatedAt: new Date(),
        } as any)
        .where(eq(doadores.id, doador.id));

      corrigidos++;

      // Sincroniza com Dinamize apenas se virou ativo (evita spam de cancelados)
      if (isAtivo) {
        try {
          const userRow = doador.userId
            ? await db.select().from(users).where(eq(users.id, doador.userId)).limit(1).then(r => r[0])
            : null;

          const valor = stripeSub.items.data[0]?.price?.unit_amount
            ? stripeSub.items.data[0].price.unit_amount / 100
            : Number(doador.valor) || 0;

          await enviarDoadorParaDinamize({
            id: doador.id,
            userId: doador.userId ?? undefined,
            email: userRow?.email ?? null,
            nome: userRow?.nome ?? null,
            telefone: userRow?.telefone ?? null,
            status: 'paid',
            plano: doador.plano || 'eco',
            valor,
            dataDoacaoInicial: doador.dataDoacaoInicial,
            stripeCustomerId: doador.stripeCustomerId,
            syncIntent: 'billing',
          });

          dinamizeSyncados++;
          console.log(`[RECONCILE-DOADORES] ✅ Doador ${doador.id} (${userRow?.email}) sincronizado com Dinamize`);
        } catch (dinamizeErr: any) {
          console.error(`[RECONCILE-DOADORES] ⚠️ Erro ao sincronizar doador ${doador.id} com Dinamize:`, dinamizeErr?.message);
        }
      }
    } catch (err: any) {
      console.error(`[RECONCILE-DOADORES] ❌ Erro ao processar doador ${doador.id}:`, err?.message);
      erros++;
    }
  }

  console.log(`[RECONCILE-DOADORES] Concluído — verificados: ${verificados}, corrigidos: ${corrigidos}, Dinamize: ${dinamizeSyncados}, erros: ${erros}`);
  return { verificados, corrigidos, dinamizeSyncados, erros };
}
