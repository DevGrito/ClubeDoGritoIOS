const diasSemanaMap: Record<string, number> = {
  'domingo': 0,
  'segunda': 1,
  'segunda-feira': 1,
  'terca': 2,
  'terça': 2,
  'terca-feira': 2,
  'terça-feira': 2,
  'quarta': 3,
  'quarta-feira': 3,
  'quinta': 4,
  'quinta-feira': 4,
  'sexta': 5,
  'sexta-feira': 5,
  'sabado': 6,
  'sábado': 6,
};

export interface DiasAulaOptions {
  dataInicio: string | Date | null | undefined;
  dataFim: string | Date | null | undefined;
  diasSemana: string[] | null | undefined;
}

export interface DiaAula {
  date: string;
  label: string;
  dayOfWeek: string;
}

const weekdayMap: Record<string, number> = {
  "Domingo": 0, "domingo": 0, "dom": 0,
  "Segunda": 1, "segunda": 1, "segunda-feira": 1, "seg": 1,
  "Terça": 2, "terça": 2, "terca": 2, "terça-feira": 2, "terca-feira": 2, "ter": 2,
  "Quarta": 3, "quarta": 3, "quarta-feira": 3, "qua": 3,
  "Quinta": 4, "quinta": 4, "quinta-feira": 4, "qui": 4,
  "Sexta": 5, "sexta": 5, "sexta-feira": 5, "sex": 5,
  "Sábado": 6, "sábado": 6, "sabado": 6, "sab": 6,
};

const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const dayLabelPtBR = (d: Date) =>
  d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export function toYMDString(raw: string | Date | null | undefined): string {
  if (raw == null || raw === "") return "";
  if (raw instanceof Date) {
    if (isNaN(raw.getTime())) return "";
    const y = raw.getFullYear();
    const m = String(raw.getMonth() + 1).padStart(2, "0");
    const d = String(raw.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  if (s.includes("T")) return s.split("T")[0].slice(0, 10);
  return "";
}

/** Alias usado em telas legadas — sempre retorna YYYY-MM-DD. */
export const normalizeToYMD = toYMDString;

/** Interpreta YYYY-MM-DD (ou ISO) como meio-dia local — evita shift UTC→local. */
export function parseDateLocal(raw: string | Date | null | undefined): Date | null {
  if (raw == null || raw === "") return null;
  if (raw instanceof Date) {
    if (isNaN(raw.getTime())) return null;
    return new Date(raw.getFullYear(), raw.getMonth(), raw.getDate(), 12, 0, 0);
  }
  const str = toYMDString(raw);
  const [y, m, d] = str.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function formatDateLocalPtBR(raw: string | Date | null | undefined): string {
  const d = parseDateLocal(raw);
  return d ? d.toLocaleDateString("pt-BR") : "";
}

/** Escolhe a data padrão ao abrir a chamada de uma turma. */
export function pickChamadaDataPreferencial(
  diasSemChamada: DiaAula[],
  hoje: string,
  turmaDataInicio?: string | Date | null
): string {
  const diaHojeAberto = diasSemChamada.find((d) => d.date === hoje);
  const proximaAulaAberta = diasSemChamada.find((d) => d.date > hoje);
  const inicioYmd = toYMDString(turmaDataInicio ?? null);
  const primeiraPendenteDesdeInicio = inicioYmd
    ? diasSemChamada.find((d) => d.date >= inicioYmd)?.date
    : undefined;
  const diasPassadosAbertos = diasSemChamada.filter((d) => d.date < hoje);
  return (
    diaHojeAberto?.date ||
    proximaAulaAberta?.date ||
    primeiraPendenteDesdeInicio ||
    diasPassadosAbertos.at(-1)?.date ||
    ""
  );
}

export function calcularDiasAula(options: DiasAulaOptions): DiaAula[] {
  const { dataInicio, dataFim, diasSemana } = options;
  
  if (!dataInicio || !diasSemana || diasSemana.length === 0) {
    return [];
  }

  const startDate = parseDateLocal(dataInicio);
  if (!dataFim) {
    return [];
  }
  const endDate = parseDateLocal(dataFim);
  if (!startDate || !endDate) {
    return [];
  }

  const diasNumeros = diasSemana
    .map(dia => diasSemanaMap[dia.toLowerCase().trim()])
    .filter(num => num !== undefined);

  if (diasNumeros.length === 0) {
    return [];
  }

  const result: DiaAula[] = [];
  const current = new Date(startDate);
  
  const diasSemanaLabels = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    
    if (diasNumeros.includes(dayOfWeek)) {
      const dateStr = toYMD(current);
      result.push({
        date: dateStr,
        label: current.toLocaleDateString('pt-BR'),
        dayOfWeek: diasSemanaLabels[dayOfWeek]
      });
    }
    
    current.setDate(current.getDate() + 1);
  }

  return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getDiasAulaParaTurma(turma: any): DiaAula[] {
  const diasSemana: string[] = Array.isArray(turma?.diasSemana)
    ? turma.diasSemana
    : Array.isArray(turma?.dias_semana)
      ? turma.dias_semana
      : [];
  if (!diasSemana.length) return [];

  const allowedWeekdays = new Set(
    diasSemana
      .map((ds) => weekdayMap[ds])
      .filter((n) => Number.isInteger(n))
  );
  if (!allowedWeekdays.size) return [];

  const diRaw =
    turma?.dataInicio ?? turma?.data_inicio ?? turma?.dataInicioISO ?? turma?.inicio ?? turma?.occurrence_start ?? null;
  const dfRaw =
    turma?.dataFim ?? turma?.data_fim ?? turma?.dataFimISO ?? turma?.fim ?? turma?.occurrence_end ?? null;

  if (!diRaw || !dfRaw) {
    return [];
  }

  const start = parseDateLocal(diRaw);
  const end = parseDateLocal(dfRaw);
  if (!start || !end) return [];

  const out: DiaAula[] = [];
  for (let cur = new Date(start); cur <= end; cur.setDate(cur.getDate() + 1)) {
    if (allowedWeekdays.has(cur.getDay())) {
      const ymd = toYMD(cur);
      out.push({
        date: ymd,
        label: dayLabelPtBR(new Date(cur)),
        dayOfWeek: diasSemana.find((ds) => weekdayMap[ds] === cur.getDay()) || "",
      });
    }
  }
  return out;
}

/** Registro de cancelamento/remanejamento (API Drizzle costuma usar camelCase; UI legada pode usar snake_case). */
export type ExcecaoCalendarioInput = {
  tipo: string;
  dataOriginal?: string | null;
  data_original?: string | null;
  novaData?: string | null;
  nova_data?: string | null;
};

function ymdExcecao(v: unknown): string {
  if (v == null || v === "") return "";
  const s = String(v);
  return s.includes("T") ? s.split("T")[0] : s;
}

function labelDiaAulaPtBr(dateYmd: string): string {
  const [y, m, d] = dateYmd.split("-").map(Number);
  if (!y || !m || !d) return dateYmd;
  const dt = new Date(y, m - 1, d, 12, 0, 0);
  return dayLabelPtBR(dt);
}

/**
 * Aplica cancelamentos e remanejamentos ao calendário usado no select de data da chamada.
 */
export function aplicarExcecoesNoCalendarioDeChamada(
  diasBase: DiaAula[],
  excecoes: ExcecaoCalendarioInput[] | null | undefined
): DiaAula[] {
  if (!excecoes?.length) return diasBase;
  const byDate = new Map<string, DiaAula>();
  for (const d of diasBase) {
    byDate.set(d.date, { ...d });
  }
  for (const exc of excecoes) {
    const orig = ymdExcecao(exc.dataOriginal ?? exc.data_original);
    if (!orig) continue;
    const tipo = String(exc.tipo || "").toLowerCase();
    if (tipo === "cancelamento") {
      byDate.delete(orig);
    } else if (tipo === "remanejamento") {
      const nova = ymdExcecao(exc.novaData ?? exc.nova_data);
      byDate.delete(orig);
      if (nova) {
        const existing = byDate.get(nova);
        byDate.set(nova, {
          date: nova,
          label: existing?.label || labelDiaAulaPtBr(nova),
          dayOfWeek: existing?.dayOfWeek || "",
        });
      }
    }
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/** Turmas concluídas, encerradas ou inativas não entram na aba Pendentes. */
export function isTurmaAtivaParaPendencias(status: string | null | undefined): boolean {
  const s = String(status ?? "").toLowerCase().trim();
  if (!s) return true;
  const inativas = new Set([
    "concluido",
    "concluida",
    "finalizado",
    "finalizada",
    "encerrada",
    "encerrado",
    "inativo",
    "inativa",
    "cancelado",
    "cancelada",
    "cancelled",
  ]);
  return !inativas.has(s);
}

export function getBrazilDateString(): string {
  const now = new Date();
  const brazilOffset = -3 * 60;
  const localOffset = now.getTimezoneOffset();
  const diff = brazilOffset - -localOffset;
  const brazil = new Date(now.getTime() + diff * 60 * 1000);
  return toYMD(
    new Date(brazil.getFullYear(), brazil.getMonth(), brazil.getDate(), 12, 0, 0)
  );
}

export interface DiaSelecaoTabletChamada {
  date: string;
  label: string;
  futura: boolean;
}

/** Dias exibidos no tablet: hoje + próximo (se hoje é dia de aula) ou só o próximo. */
export function getDiasSelecaoTabletChamada(
  todosDiasAula: string[],
  diasJaLancados: Iterable<string>,
  hoje: string
): DiaSelecaoTabletChamada[] {
  const lancados = new Set(diasJaLancados);
  const abertos = [...new Set(todosDiasAula)]
    .filter((d) => !lancados.has(d))
    .sort((a, b) => a.localeCompare(b));

  const hojeAberto = abertos.find((d) => d === hoje);
  const proximoAposHoje = abertos.find((d) => d > hoje);

  const picked: string[] = [];
  if (hojeAberto) {
    picked.push(hojeAberto);
    if (proximoAposHoje) picked.push(proximoAposHoje);
  } else if (proximoAposHoje) {
    picked.push(proximoAposHoje);
  }

  return picked.map((date) => {
    const d = parseDateLocal(date);
    const label = d
      ? d.toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : date;
    return { date, label, futura: date > hoje };
  });
}
