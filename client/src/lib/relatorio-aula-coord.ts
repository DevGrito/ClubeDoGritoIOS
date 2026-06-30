export type RelatorioAulaTab = "todos" | "feitos" | "pendentes";

export type RelatorioAulaFiltros = {
  texto: string;
  professor: string;
  turma: string;
  dataInicio: string;
  dataFim: string;
};

export type RelatorioListaItem =
  | { kind: "pendente"; key: string; sortDate: string; plano: Record<string, unknown> }
  | { kind: "feito"; key: string; sortDate: string; aula: Record<string, unknown> };

export function countPlanosPendentes(planos: unknown[]): number {
  return (planos as { temRelatorio?: boolean }[]).filter((p) => !p.temRelatorio).length;
}

export function filterPlanosPendentes(planos: unknown[], f: RelatorioAulaFiltros) {
  return (planos as Record<string, unknown>[]).filter((p) => {
    if (p.temRelatorio) return false;
    const titulo = String(p.titulo || "");
    const textoOk = !f.texto || titulo.toLowerCase().includes(f.texto.toLowerCase());
    const profOk = !f.professor || String(p.professorNome || "") === f.professor;
    const turmaOk = !f.turma || String(p.turmaNome || "") === f.turma;
    const data = String(p.data || "");
    const dataOk =
      (!f.dataInicio || data >= f.dataInicio) && (!f.dataFim || data <= f.dataFim);
    return textoOk && profOk && turmaOk && dataOk;
  });
}

/** Relatórios já registrados na tabela aula_registrada (qualquer statusAula). */
export function filterAulasFeitas(aulas: unknown[], f: RelatorioAulaFiltros) {
  return (aulas as Record<string, unknown>[]).filter((a) => {
    const titulo = String(a.titulo || "");
    const textoOk = !f.texto || titulo.toLowerCase().includes(f.texto.toLowerCase());
    const profOk = !f.professor || String(a.professorNome || "") === f.professor;
    const turmaOk = !f.turma || String(a.turmaNome || "") === f.turma;
    const data = String(a.data || "");
    const dataOk =
      (!f.dataInicio || data >= f.dataInicio) && (!f.dataFim || data <= f.dataFim);
    return textoOk && profOk && turmaOk && dataOk;
  });
}

export function buildRelatorioLista(
  tab: RelatorioAulaTab,
  planos: unknown[],
  aulas: unknown[],
  f: RelatorioAulaFiltros
): RelatorioListaItem[] {
  const pendentes = filterPlanosPendentes(planos, f);
  const feitos = filterAulasFeitas(aulas, f);

  const items: RelatorioListaItem[] = [];

  if (tab === "todos" || tab === "pendentes") {
    for (const p of pendentes) {
      const data = String(p.data || "");
      items.push({
        kind: "pendente",
        key: `p-${p.id}`,
        sortDate: data,
        plano: p,
      });
    }
  }

  if (tab === "todos" || tab === "feitos") {
    for (const a of feitos) {
      const data = String(a.data || "");
      items.push({
        kind: "feito",
        key: `a-${a.id}`,
        sortDate: data,
        aula: a,
      });
    }
  }

  if (tab === "pendentes") {
    return items.sort((x, y) => y.sortDate.localeCompare(x.sortDate));
  }

  return items.sort((x, y) => y.sortDate.localeCompare(x.sortDate));
}

export function statusAulaBadgeClass(status?: string | null): string {
  const s = String(status || "ministrada").toLowerCase();
  if (s === "ministrada") {
    return "shrink-0 capitalize text-xs bg-green-100 text-green-700 border border-green-200 hover:bg-green-100";
  }
  if (s === "cancelada") {
    return "shrink-0 capitalize text-xs bg-red-100 text-red-700 border border-red-200 hover:bg-red-100";
  }
  if (s === "adiada") {
    return "shrink-0 capitalize text-xs bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-100";
  }
  return "shrink-0 capitalize text-xs bg-gray-100 text-gray-700 border border-gray-200";
}

export function statusAulaLabel(status?: string | null): string {
  const s = String(status || "ministrada");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function collectProfessoresRelatorio(planos: unknown[], aulas: unknown[]): string[] {
  const set = new Set<string>();
  for (const p of planos as { professorNome?: string }[]) {
    if (p.professorNome) set.add(p.professorNome);
  }
  for (const a of aulas as { professorNome?: string }[]) {
    if (a.professorNome) set.add(a.professorNome);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function collectTurmasRelatorio(planos: unknown[], aulas: unknown[]): string[] {
  const set = new Set<string>();
  for (const p of planos as { turmaNome?: string }[]) {
    if (p.turmaNome) set.add(p.turmaNome);
  }
  for (const a of aulas as { turmaNome?: string }[]) {
    if (a.turmaNome) set.add(a.turmaNome);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
}
