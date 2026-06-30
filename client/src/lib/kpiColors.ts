/**
 * FONTE CANÔNICA de cores para KPIs de meta no dashboard Gestão à Vista.
 *
 * Regra única:  ≥ 100% → verde  |  ≥ 80% → amarelo  |  < 80% → vermelho
 * Regra inversa (menor = melhor, ex: Evasão):
 *              ≤ 80% do limite → verde  |  ≤ 100% → amarelo  |  > 100% → vermelho
 *
 * NUNCA defina getColor/kpiColor em outro arquivo — importe daqui.
 */

export const KPI_GREEN   = '#22c55e';
export const KPI_YELLOW  = '#eab308';
export const KPI_RED     = '#ef4444';
export const KPI_NEUTRAL = '#64748b';

/** Cor por % de meta alcançada (valor já calculado como pct). */
export function kpiColor(pct: number): string {
  if (pct >= 100) return KPI_GREEN;
  if (pct >= 80)  return KPI_YELLOW;
  return KPI_RED;
}

/** Cor por % para métricas inversas (menor valor = melhor, ex: Evasão). */
export function kpiColorInverse(pct: number): string {
  if (pct <= 80)  return KPI_GREEN;
  if (pct <= 100) return KPI_YELLOW;
  return KPI_RED;
}
