/** Filtro de setor na gestão unificada de atendidos (mestre). */
export type ProgramaParticipanteFilter = "grito" | "pec" | "inclusao";

export function matchesProgramaParticipanteFilter(
  pessoa: {
    programas?: Array<string | null | undefined> | null;
    temPec?: boolean | null;
    temInclusao?: boolean | null;
  },
  filter: ProgramaParticipanteFilter
): boolean {
  if (filter === "grito") return true;

  const programas = Array.isArray(pessoa.programas)
    ? pessoa.programas.map((p) => String(p || "").toLowerCase())
    : [];

  const temPec =
    pessoa.temPec === true || programas.includes("pec");
  const temInclusao =
    pessoa.temInclusao === true || programas.includes("inclusao");

  if (filter === "pec") return temPec;
  if (filter === "inclusao") return temInclusao;
  return true;
}
