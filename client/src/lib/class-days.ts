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

function parseDateLocal(raw: string | Date): Date {
  const str = String(raw).split('T')[0];
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
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
  const diasSemana: string[] = Array.isArray(turma?.diasSemana) ? turma.diasSemana : [];
  if (!diasSemana.length) return [];

  const allowedWeekdays = new Set(
    diasSemana
      .map((ds) => weekdayMap[ds])
      .filter((n) => Number.isInteger(n))
  );
  if (!allowedWeekdays.size) return [];

  const diRaw =
    turma?.dataInicio ?? turma?.data_inicio ?? turma?.dataInicioISO ?? turma?.inicio ?? null;
  const dfRaw =
    turma?.dataFim ?? turma?.data_fim ?? turma?.dataFimISO ?? turma?.fim ?? null;

  if (!diRaw || !dfRaw) {
    return [];
  }

  const start = parseDateLocal(diRaw);
  const end = parseDateLocal(dfRaw);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

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

export function getBrazilDateString(): string {
  const now = new Date();
  const brasilOffset = -3 * 60;
  const localOffset = now.getTimezoneOffset();
  const diff = brasilOffset - localOffset;
  const brasilTime = new Date(now.getTime() + diff * 60 * 1000);
  return brasilTime.toISOString().split('T')[0];
}
