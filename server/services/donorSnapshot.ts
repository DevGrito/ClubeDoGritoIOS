import Stripe from 'stripe';
import { pool } from '../db';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any })
  : null;

type SubRow = {
  status: string;
  canceled_at: number | null;
  created: number;
  trial_end: number | null;
};

async function fetchDedupedSubs(): Promise<Map<string, SubRow>> {
  if (!stripe) throw new Error('Stripe não configurado');
  const [actives, trialing, pastDue, canceled] = await Promise.all([
    stripe.subscriptions.list({ status: 'active', limit: 100 }).autoPagingToArray({ limit: 9999 }),
    stripe.subscriptions.list({ status: 'trialing', limit: 100 }).autoPagingToArray({ limit: 9999 }),
    stripe.subscriptions.list({ status: 'past_due', limit: 100 }).autoPagingToArray({ limit: 9999 }),
    stripe.subscriptions.list({ status: 'canceled', limit: 100 }).autoPagingToArray({ limit: 9999 }),
  ]);
  const byCustomer = new Map<string, SubRow>();
  for (const sub of [...actives, ...trialing, ...pastDue, ...canceled]) {
    const customerId = typeof sub.customer === 'string' ? sub.customer : (sub.customer as { id?: string })?.id;
    if (!customerId) continue;
    const existing = byCustomer.get(customerId);
    if (!existing || sub.created > existing.created) {
      byCustomer.set(customerId, {
        status: sub.status,
        canceled_at: sub.canceled_at,
        created: sub.created,
        trial_end: sub.trial_end,
      });
    }
  }
  return byCustomer;
}

/** Estoque no último dia do mês — ponto no tempo (past_due conta como ativo). */
function ativosFimDeMes(byCustomer: Map<string, SubRow>, endOfMonth: number): { ativos: number; trialing: number } {
  let ativos = 0;
  let trialing = 0;
  for (const sub of byCustomer.values()) {
    if (sub.created > endOfMonth) continue;
    if (sub.canceled_at !== null && sub.canceled_at <= endOfMonth) continue;
    if (sub.status === 'past_due') {
      ativos++;
      continue;
    }
    if (sub.trial_end !== null && sub.trial_end > endOfMonth) trialing++;
    else ativos++;
  }
  return { ativos, trialing };
}

/** Ao vivo — active + trialing + past_due (pagamento pendente). */
function ativosAoVivo(byCustomer: Map<string, SubRow>): { ativos: number; trialing: number } {
  let ativos = 0;
  let trialing = 0;
  for (const sub of byCustomer.values()) {
    if (sub.status === 'active' || sub.status === 'past_due') ativos++;
    else if (sub.status === 'trialing') trialing++;
  }
  return { ativos, trialing };
}

function evadidosNoMes(
  byCustomer: Map<string, SubRow>,
  localUserIds: Set<string>,
  excludedIds: Set<string>,
  excludedUntil: Map<string, number>,
  startOfMonth: number,
  endOfMonth: number,
): number {
  let evadidos = 0;
  for (const [cid, sub] of byCustomer) {
    const canceledAt = sub.canceled_at;
    if (sub.status !== 'canceled' || !canceledAt) continue;
    if (!localUserIds.has(cid)) continue;
    const isExcluded = excludedIds.has(cid) || (excludedUntil.has(cid) && canceledAt <= excludedUntil.get(cid)!);
    if (isExcluded) continue;
    if (canceledAt >= startOfMonth && canceledAt <= endOfMonth) evadidos++;
  }
  return evadidos;
}

/**
 * Captura snapshot mensal de doadores.
 * - ativos/trialing: ao vivo no mês vigente; fim do mês nos demais
 * - evadidos: cancelamentos no mês (mesma regra do /api/doadores/stats)
 */
export async function captureMonthlyDonorSnapshot(
  ano?: number,
  mes?: number,
): Promise<{ ativos: number; trialing: number; evadidos: number }> {
  if (!stripe) throw new Error('Stripe não configurado');

  const now = new Date();
  const targetAno = ano ?? now.getFullYear();
  const targetMes = mes ?? now.getMonth() + 1;
  const isMesVigente = targetAno === now.getFullYear() && targetMes === now.getMonth() + 1;

  const startOfMonth = Math.floor(new Date(targetAno, targetMes - 1, 1).getTime() / 1000);
  const endOfMonth = Math.floor(new Date(targetAno, targetMes, 0, 23, 59, 59).getTime() / 1000);

  const { rows: localUsers } = await pool.query(
    `SELECT stripe_customer_id FROM users WHERE stripe_customer_id IS NOT NULL`,
  );
  const localUserIds = new Set(localUsers.map((u: { stripe_customer_id: string }) => u.stripe_customer_id));

  const { rows: excluidos } = await pool.query(
    `SELECT stripe_customer_id, excluir_cancelamento_ate FROM users
     WHERE excluir_estatisticas = true OR excluir_cancelamento_ate IS NOT NULL`,
  ).catch(() => ({ rows: [] }));
  const excludedIds = new Set(
    (excluidos as { stripe_customer_id: string; excluir_cancelamento_ate: Date | null }[])
      .filter((e) => !e.excluir_cancelamento_ate)
      .map((e) => e.stripe_customer_id),
  );
  const excludedUntil = new Map(
    (excluidos as { stripe_customer_id: string; excluir_cancelamento_ate: Date }[])
      .filter((e) => e.excluir_cancelamento_ate)
      .map((e) => [e.stripe_customer_id, Math.floor(new Date(e.excluir_cancelamento_ate).getTime() / 1000)]),
  );

  const byCustomer = await fetchDedupedSubs();

  const stock = isMesVigente
    ? ativosAoVivo(byCustomer)
    : ativosFimDeMes(byCustomer, endOfMonth);
  const ativos = stock.ativos;
  const trialing = stock.trialing;
  const evadidos = evadidosNoMes(byCustomer, localUserIds, excludedIds, excludedUntil, startOfMonth, endOfMonth);

  await pool.query(
    `INSERT INTO doadores_historico_mensal (ano, mes, ativos, trialing, evadidos)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (ano, mes) DO UPDATE SET
       ativos = $3, trialing = $4, evadidos = $5, updated_at = NOW()`,
    [targetAno, targetMes, ativos, trialing, evadidos],
  );

  return { ativos, trialing, evadidos };
}

/** Atualiza o snapshot do mês corrente (uso em cron / pós-sync Stripe). */
export async function captureCurrentMonthDonorSnapshot(): Promise<{ ativos: number; trialing: number; evadidos: number }> {
  const now = new Date();
  return captureMonthlyDonorSnapshot(now.getFullYear(), now.getMonth() + 1);
}

/** Fecha o snapshot do mês anterior (rodar no dia 1). */
export async function capturePreviousMonthDonorSnapshot(): Promise<{ ativos: number; trialing: number; evadidos: number }> {
  const prev = new Date();
  prev.setMonth(prev.getMonth() - 1);
  return captureMonthlyDonorSnapshot(prev.getFullYear(), prev.getMonth() + 1);
}
