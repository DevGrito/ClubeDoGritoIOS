/**
 * Catálogo de indicadores para push indicador_sem_dados (telas + checagem mês/anual).
 */
import * as gestaoVistaData from "./services/gestaoVistaData";
import type { MesFiltro } from "./services/gestaoVistaData";

export type IndicadorModulo = "pec" | "inclusao" | "psico" | "admin";

export type IndicadorCatalogEntry = {
  chave: string;
  nome: string;
  modulo: IndicadorModulo;
  /** Onde o indicador aparece (texto na notificação). */
  telas: string;
  getValor: (mes: MesFiltro) => Promise<number>;
};

/** Mês calendário atual em BRT (1–12). */
export function getMesAtualBrt(): number {
  const brt = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  return brt.getMonth() + 1;
}

type Indicadores2026 = Awaited<ReturnType<typeof gestaoVistaData.getIndicadores2026>>;

function fromGv(
  field: keyof Indicadores2026,
  nome: string,
  modulo: IndicadorModulo,
  telas: string
): IndicadorCatalogEntry {
  return {
    chave: field,
    nome,
    modulo,
    telas,
    getValor: async (mes) => {
      const ind = await gestaoVistaData.getIndicadores2026(mes);
      return Number(ind[field] ?? 0);
    },
  };
}

/** Indicadores alinhados às telas GV / coord / impacto do doador. */
export const PUSH_INDICADOR_CATALOG: IndicadorCatalogEntry[] = [
  fromGv(
    "criancasAtendidas",
    "Crianças Atendidas",
    "pec",
    "Coord. PEC, Monitor PEC, Dashboard GV › PEC, Impacto doador"
  ),
  fromGv(
    "frequencia",
    "Frequência",
    "pec",
    "Coord. PEC, Dashboard GV › PEC / Inclusão, Monitor"
  ),
  fromGv(
    "evasao",
    "Evasão",
    "pec",
    "Coord. PEC, Dashboard GV › PEC"
  ),
  fromGv(
    "alunosFormados",
    "Pessoas Formadas",
    "inclusao",
    "Coord. Inclusão, Dashboard GV › Inclusão, Impacto doador"
  ),
  fromGv(
    "alunosEmFormacao",
    "Pessoas em Formação",
    "inclusao",
    "Coord. Inclusão, Monitor Inclusão, Dashboard GV › Inclusão"
  ),
  fromGv(
    "geracaoRenda",
    "Geração de Renda",
    "inclusao",
    "Coord. Inclusão, Dashboard GV › Inclusão, Impacto doador"
  ),
  fromGv(
    "visitasDomicilio",
    "Visitas Domiciliares",
    "psico",
    "Coord. Psico, Dashboard GV › Psico, Impacto doador"
  ),
  fromGv(
    "atendimentosPsico",
    "Acolhimento Individual",
    "psico",
    "Coord. Psico, Dashboard GV › Psico"
  ),
  fromGv(
    "atendimentosColetivos",
    "Intervenções Coletivas",
    "psico",
    "Coord. Psico, Dashboard GV › Psico"
  ),
  fromGv(
    "avaliacaoAprendizagem",
    "Avaliação de Aprendizagem",
    "inclusao",
    "Coord. Inclusão, Dashboard GV › Inclusão"
  ),
  fromGv(
    "pesquisaSatisfacao",
    "Pesquisa de Satisfação",
    "pec",
    "Dashboard GV › PEC / Geral"
  ),
];
