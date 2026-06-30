/**
 * CRON meta_batida: detecta metas mensais e anuais dos indicadores GV
 * e dispara push para perfis que veem impacto/metas nas telas.
 */
import type { Pool } from "pg";
import * as gestaoVistaData from "./services/gestaoVistaData";
import { PUSH_INDICADOR_CATALOG, getMesAtualBrt } from "./pushIndicadorCatalog";
import type { IndicadorModulo } from "./pushIndicadorCatalog";

const PERCENT_INDICATORS = new Set([
  "frequencia",
  "evasao",
  "avaliacaoAprendizagem",
  "pesquisaSatisfacao",
]);

const INVERSE_INDICATORS = new Set(["evasao"]);

const VERTENTE_LABEL: Record<IndicadorModulo, string> = {
  pec: "PEC",
  inclusao: "Inclusão Produtiva",
  psico: "Psicossocial",
  admin: "Gestão",
};

const MESES_PT = [
  "",
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const META_BATIDA_DESTINO_ROLES = [
  "doador",
  "leo",
  "conselho",
  "patrocinador",
  "coordenador_pec",
  "coordenador_inclusao",
  "coordenador_psicossocial",
  "coordenador_psico",
  "monitor_pec",
  "monitor_inclusao",
  "monitor_psicossocial",
  "monitor_psico",
  "professor_pec",
  "professor_inclusao",
  "professor_psico",
  "dev",
  "dev-marketing",
  "desenvolvedor",
  "super_admin",
];

type MetasMap = Record<string, Record<string, number>>;

function buildMetasMap(rows: { vertente: string; indicador: string; meta: string | number }[]): MetasMap {
  const map: MetasMap = {};
  for (const row of rows) {
    if (!map[row.vertente]) map[row.vertente] = {};
    map[row.vertente][row.indicador] = parseFloat(String(row.meta));
  }
  return map;
}

function resolveMetaAnual(
  chave: string,
  modulo: IndicadorModulo,
  metasMap: MetasMap,
  ano: number
): number | null {
  const dbMod = modulo === "admin" ? "pec" : modulo;
  const fromDb = metasMap[dbMod]?.[chave];
  if (fromDb != null && fromDb > 0) return fromDb;

  if (chave === "geracaoRenda") {
    const renda = gestaoVistaData.resolveMetasInclusaoRenda(metasMap.inclusao ?? {});
    return renda.geracaoRenda > 0 ? renda.geracaoRenda : null;
  }

  const defaults = gestaoVistaData.metasAnuais2026 as Record<string, number>;
  const fallback = defaults[chave];
  return fallback != null && fallback > 0 ? fallback : null;
}

function metaMensal(metaAnual: number, chave: string): number {
  if (PERCENT_INDICATORS.has(chave)) return metaAnual;
  return Math.round(metaAnual / 11);
}

function isMetaAtingida(valor: number, meta: number, inverse: boolean): boolean {
  if (!meta || meta <= 0) return false;
  return inverse ? valor <= meta : valor >= meta;
}

function calcPercentual(valor: number, meta: number, inverse: boolean): number {
  if (!meta) return 0;
  if (inverse) {
    if (valor <= 0) return 100;
    return Math.round((meta / Math.max(valor, 0.01)) * 100);
  }
  return Math.round((valor / meta) * 100);
}

function dataRealizacaoBrt(): string {
  return new Date().toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export type FireMetaBatidaFn = (
  gatilho: string,
  vars: Record<string, string>
) => Promise<void>;

export async function runMetaBatidaCron(pool: Pool, fire: FireMetaBatidaFn): Promise<void> {
  const ano = new Date().getFullYear();
  const mesAtual = getMesAtualBrt();
  // Mensal: usa o último mês concluído (em janeiro, janeiro)
  const mesMensal = mesAtual > 1 ? mesAtual - 1 : mesAtual;

  const metasRes = await pool.query(
    "SELECT vertente, indicador, meta FROM metas_indicadores WHERE ano = $1",
    [ano]
  );
  const metasMap = buildMetasMap(metasRes.rows);
  const dataRealizacao = dataRealizacaoBrt();
  let disparos = 0;

  for (const ind of PUSH_INDICADOR_CATALOG) {
    const metaAnual = resolveMetaAnual(ind.chave, ind.modulo, metasMap, ano);
    if (!metaAnual) continue;

    const inverse = INVERSE_INDICATORS.has(ind.chave);
    const vertente = VERTENTE_LABEL[ind.modulo] || ind.modulo;

    const checks: { escopo: "anual" | "mensal"; mes: number | null; valor: number; meta: number }[] = [];

    const valorAnual = await ind.getValor(null);
    if (isMetaAtingida(valorAnual, metaAnual, inverse)) {
      checks.push({ escopo: "anual", mes: null, valor: valorAnual, meta: metaAnual });
    }

    const metaMes = metaMensal(metaAnual, ind.chave);
    const valorMes = await ind.getValor(mesMensal);
    if (isMetaAtingida(valorMes, metaMes, inverse)) {
      checks.push({ escopo: "mensal", mes: mesMensal, valor: valorMes, meta: metaMes });
    }

    for (const c of checks) {
      const dedupeKey = `meta_batida:${ind.chave}:${c.escopo}:${ano}${c.mes ? `:${c.mes}` : ""}`;
      const ja = await pool.query(
        `SELECT 1 FROM push_logs
         WHERE gatilho = 'meta_batida' AND payload->>'dedupe_key' = $1
           AND disparado_em > NOW() - INTERVAL '400 days'
         LIMIT 1`,
        [dedupeKey]
      );
      if (ja.rows.length > 0) continue;

      const periodoLabel =
        c.escopo === "anual"
          ? `anual de ${ano}`
          : `mensal de ${MESES_PT[c.mes!]}/${ano}`;

      const percentual = calcPercentual(c.valor, c.meta, inverse);

      console.log(
        `🎯 [PUSH-CRON] meta_batida: ${ind.nome} (${periodoLabel}) ${c.valor}/${c.meta} = ${percentual}%`
      );

      await fire("meta_batida", {
        nome_kpi: ind.nome,
        vertente,
        modulo: ind.modulo,
        periodo: c.escopo,
        periodo_label: periodoLabel,
        mes: c.mes ? String(c.mes) : "",
        ano: String(ano),
        data_realizacao: dataRealizacao,
        valor: String(Math.round(c.valor * 100) / 100),
        meta: String(c.meta),
        percentual: String(percentual),
        dedupe_key: dedupeKey,
      });
      disparos++;
    }
  }

  if (disparos > 0) {
    console.log(`✅ [PUSH-CRON] meta_batida: ${disparos} disparo(s)`);
  }
}
