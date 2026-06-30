import {
  appendPeriodoParams,
  isPeriodoTodos,
  periodoMesesLista,
  type PeriodoFiltro,
} from "@/pages/dashboard-gestao-vista/shared";

export type { PeriodoFiltro };
export { appendPeriodoParams, isPeriodoTodos, periodoMesesLista };

export function buildPeriodoSearchParams(ano: number, periodo: PeriodoFiltro): URLSearchParams {
  const params = new URLSearchParams();
  if (ano) params.set("ano", String(ano));
  appendPeriodoParams(params, periodo);
  return params;
}

export function buildPeriodoQueryString(ano: number, periodo: PeriodoFiltro): string {
  const qs = buildPeriodoSearchParams(ano, periodo).toString();
  return qs ? `?${qs}` : "";
}

/** Período totalmente no futuro (ex.: só meses que ainda não ocorreram no ano corrente). */
export function isFuturePeriodo(ano: number, periodo: PeriodoFiltro): boolean {
  const hoje = new Date();
  if (ano > hoje.getFullYear()) return true;
  if (ano < hoje.getFullYear() || isPeriodoTodos(periodo)) return false;
  const mesAtual = hoje.getMonth() + 1;
  const meses = mesesDoPeriodo(periodo);
  return meses.length > 0 && meses.every((m) => m > mesAtual);
}

/** Meses efetivos do período (contíguos min..max, como Gestão à Vista). */
export function mesesDoPeriodo(periodo: PeriodoFiltro): number[] {
  if (periodo === "todos") return [];
  return periodoMesesLista(periodo);
}

/** Qtd de meses para prorratear meta numérica (0 = meta anual inteira, ex. período "todos"). */
export function periodoQtdMesesParaMeta(periodo: PeriodoFiltro): number {
  if (periodo === "todos") return 0;
  return mesesDoPeriodo(periodo).length;
}

/** Meses com meta prevista para #EspaçoOGrito (fev–nov; jan e dez sem meta). */
const MESES_COM_META_ESPACO_GRITO = new Set([2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

/** Meta de #EspaçoOGrito: 1 por mês elegível no período (meta anual = 10). */
export function metaEspacoGritoPeriodo(periodo: PeriodoFiltro): number {
  if (periodo === "todos") {
    const mesLimite = new Date().getMonth() + 1;
    return [...MESES_COM_META_ESPACO_GRITO].filter((m) => m <= mesLimite).length;
  }
  return periodoMesesLista(periodo).filter((m) => MESES_COM_META_ESPACO_GRITO.has(m)).length;
}

export function filterByPeriodo(
  items: any[],
  ano: number,
  periodo: PeriodoFiltro,
  dateField: string = "created_at",
): any[] {
  if (!items || !Array.isArray(items)) return [];
  const meses = mesesDoPeriodo(periodo);
  return items.filter((item) => {
    const dateStr = item[dateField] || item.createdAt || item.created_at || item.data;
    if (!dateStr) return true;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;
    const itemYear = d.getFullYear();
    const itemMonth = d.getMonth() + 1;
    if (itemYear !== ano) return false;
    if (meses.length === 0) return true;
    return meses.includes(itemMonth);
  });
}
