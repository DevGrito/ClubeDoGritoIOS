import Stripe from 'stripe';
import { pool } from '../db';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any })
  : null;

/**
 * Captura snapshot mensal de doadores.
 * Usa a MESMA lógica do /api/doadores/stats:
 * - Deduplica por cliente usando apenas active/trialing/past_due/canceled (sem incomplete)
 * - Filtra por usuário local e exclusões configuradas
 * - ativos/trialing: snapshot do estado no último dia do mês
 * - evadidos: novos cancelamentos NAQUELE mês específico
 */
export async function captureMonthlyDonorSnapshot(
  ano?: number,
  mes?: number
): Promise<{ ativos: number; trialing: number; evadidos: number }> {
  if (!stripe) throw new Error('Stripe não configurado');

  const now = new Date();
  const targetAno = ano ?? now.getFullYear();
  const targetMes = mes ?? now.getMonth() + 1;

  const startOfMonth = Math.floor(new Date(targetAno, targetMes - 1, 1).getTime() / 1000);
  const endOfMonth   = Math.floor(new Date(targetAno, targetMes, 0, 23, 59, 59).getTime() / 1000);

  // Busca IDs de usuários locais com Stripe (igual ao stats endpoint)
  const { rows: localUsers } = await pool.query(
    `SELECT stripe_customer_id FROM users WHERE stripe_customer_id IS NOT NULL`
  );
  const localUserIds = new Set(localUsers.map((u: any) => u.stripe_customer_id));

  // Usuários excluídos das estatísticas
  const { rows: excluidos } = await pool.query(
    `SELECT stripe_customer_id, excluir_cancelamento_ate FROM users
     WHERE excluir_estatisticas = true OR excluir_cancelamento_ate IS NOT NULL`
  ).catch(() => ({ rows: [] }));
  const excludedIds = new Set(
    (excluidos as any[]).filter(e => !e.excluir_cancelamento_ate).map(e => e.stripe_customer_id)
  );
  const excludedUntil = new Map(
    (excluidos as any[]).filter(e => e.excluir_cancelamento_ate)
      .map(e => [e.stripe_customer_id, Math.floor(new Date(e.excluir_cancelamento_ate).getTime() / 1000)])
  );

  // Busca igual ao stats endpoint: só active/trialing/past_due/canceled (sem incomplete)
  const [activesData, trialingData, pastDueData, canceledData] = await Promise.all([
    stripe.subscriptions.list({ status: 'active',   limit: 100, created: { lte: endOfMonth } }).autoPagingToArray({ limit: 9999 }),
    stripe.subscriptions.list({ status: 'trialing', limit: 100, created: { lte: endOfMonth } }).autoPagingToArray({ limit: 9999 }),
    stripe.subscriptions.list({ status: 'past_due', limit: 100, created: { lte: endOfMonth } }).autoPagingToArray({ limit: 9999 }),
    stripe.subscriptions.list({ status: 'canceled', limit: 100, created: { lte: endOfMonth } }).autoPagingToArray({ limit: 9999 }),
  ]);

  const allSubs = [...activesData, ...trialingData, ...pastDueData, ...canceledData];

  // Deduplica igual ao stats endpoint (mais recente por cliente)
  const byCustomer = new Map<string, any>();
  for (const sub of allSubs) {
    const customerId = typeof sub.customer === 'string' ? sub.customer : (sub.customer as any)?.id;
    if (!customerId) continue;
    const existing = byCustomer.get(customerId);
    if (!existing || sub.created > existing.created) {
      byCustomer.set(customerId, sub);
    }
  }

  let ativos = 0, trialing = 0, evadidos = 0;

  for (const [cid, sub] of byCustomer) {
    const canceledAt = sub.canceled_at as number | null;
    const trialEnd   = sub.trial_end   as number | null;

    const canceledByEndOfMonth = canceledAt !== null && canceledAt <= endOfMonth;

    if (canceledByEndOfMonth) {
      // Conta como evadido DESTE mês se cancelou dentro do mês, tem usuário local, e não é excluído
      const canceledThisMonth = canceledAt >= startOfMonth;
      const isLocal = localUserIds.has(cid);
      const isExcluded = excludedIds.has(cid) || (excludedUntil.has(cid) && canceledAt! <= excludedUntil.get(cid)!);
      if (canceledThisMonth && isLocal && !isExcluded) {
        evadidos++;
      }
    } else {
      // Ativo no fim do mês — exclui past_due para consistência com o stats endpoint (active + trialing)
      if (sub.status === 'past_due') continue;
      if (trialEnd !== null && trialEnd > endOfMonth) trialing++;
      else ativos++;
    }
  }

  // Persiste no banco (upsert)
  await pool.query(
    `INSERT INTO doadores_historico_mensal (ano, mes, ativos, trialing, evadidos)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (ano, mes) DO UPDATE SET ativos=$3, trialing=$4, evadidos=$5, updated_at=NOW()`,
    [targetAno, targetMes, ativos, trialing, evadidos]
  );

  return { ativos, trialing, evadidos };
}
