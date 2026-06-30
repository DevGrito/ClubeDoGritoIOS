/** Metadados de turma/participantes embutidos em observacoes das intervenções psicossociais. */

export function parseIntervencaoObservacoes(obs: string) {
  const turmaMatch = obs.match(/\[TURMA:\s*(.+?)\]/);
  const partMatch = obs.match(/\[PARTICIPANTES:\s*(.+?)\]/);
  const esperadosMatch = obs.match(/\[ESPERADOS:\s*(\d+)\]/);
  const observacoesLimpa = obs
    .replace(/\n?\[TURMA:.*?\]/g, "")
    .replace(/\n?\[PARTICIPANTES:.*?\]/g, "")
    .replace(/\n?\[ESPERADOS:\s*\d+\]/g, "")
    .trim();
  const participantesNomes =
    partMatch?.[1]?.split(",").map((n) => n.trim()).filter(Boolean) || [];
  const participantesEsperados = esperadosMatch
    ? parseInt(esperadosMatch[1], 10)
    : null;
  return {
    turmaNome: turmaMatch?.[1] || "",
    participantesNomes,
    participantesEsperados: Number.isFinite(participantesEsperados) ? participantesEsperados : null,
    observacoesLimpa,
  };
}

export function buildIntervencaoObservacoes(
  observacoes: string,
  turmaNome: string | undefined,
  participantesNomes: string[],
  participantesEsperados?: number
) {
  const base = (observacoes || "").trim();
  const parts: string[] = [];
  if (base) parts.push(base);
  if (turmaNome) parts.push(`[TURMA: ${turmaNome}]`);
  if (participantesNomes.length > 0) {
    parts.push(`[PARTICIPANTES: ${participantesNomes.join(", ")}]`);
  }
  if (participantesEsperados != null && participantesEsperados > 0) {
    parts.push(`[ESPERADOS: ${participantesEsperados}]`);
  }
  return parts.join("\n").trim();
}

export function intervencaoDataIso(data: string | Date | null | undefined): string {
  if (!data) return "";
  const s = String(data);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  try {
    const d = data instanceof Date ? data : new Date(s);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
    }
  } catch {
    /* fallthrough */
  }
  if (s.includes("T")) return s.split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return "";
}

export type PsicoChamadaRef = {
  programa?: string;
  turmaId?: number | string;
  turmaNome?: string;
  data?: string | Date;
  total?: number;
  presentes?: number;
  presencas?: Array<{ presente?: boolean }>;
};

const normalizeTurmaNome = (nome: string) =>
  nome.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

/** Localiza a chamada PEC/Inclusão do mesmo dia/turma da intervenção. */
export function findChamadaParaIntervencao(
  chamadas: PsicoChamadaRef[],
  iv: {
    vertente?: string;
    grupo?: string | number | null;
    data?: string | Date | null;
    observacoes?: string;
    observacao?: string;
  },
  turmaNome?: string
): PsicoChamadaRef | null {
  const dataIso = intervencaoDataIso(iv.data);
  if (!dataIso) return null;

  const turmaId = iv.grupo != null && iv.grupo !== "" ? String(iv.grupo) : "";
  const obs = iv.observacoes || iv.observacao || "";
  const turmaFromObs = obs.match(/\[TURMA:\s*(.+?)\]/)?.[1]?.trim() || "";
  const nomeTurma = turmaNome || turmaFromObs;

  const vertente = iv.vertente;
  const programas =
    vertente === "pec" || vertente === "inclusao" ? [vertente] : ["pec", "inclusao"];

  const matchChamada = (c: PsicoChamadaRef, programa: string) => {
    if (c.programa !== programa) return false;
    if (intervencaoDataIso(c.data) !== dataIso) return false;
    if (turmaId && String(c.turmaId ?? "") === turmaId) return true;
    if (nomeTurma && c.turmaNome && normalizeTurmaNome(c.turmaNome) === normalizeTurmaNome(nomeTurma)) {
      return true;
    }
    return false;
  };

  for (const programa of programas) {
    const hit = chamadas.find((c) => matchChamada(c, programa));
    if (hit) return hit;
  }
  return null;
}

/** Total da turma na chamada (fonte: monitor PEC/Inclusão). */
export function contagemEsperadosFromChamada(chamada: PsicoChamadaRef | null): number {
  if (!chamada) return 0;
  if (chamada.total != null && chamada.total > 0) return chamada.total;
  const presencas = chamada.presencas ?? [];
  return presencas.length;
}

/**
 * Presentes = alunos na intervenção (lista/DB).
 * Esperados = total na chamada PEC/Inclusão do dia (quando existir).
 */
export function getIntervencaoParticipantesResumo(
  iv: {
    participantes_presentes?: number | null;
    participantesPresentes?: number | null;
    participantes_esperados?: number | null;
    participantesEsperados?: number | null;
  },
  participantesNomes: string[],
  participantesEsperadosObs?: number | null,
  chamada?: PsicoChamadaRef | null
) {
  const presentesDb =
    iv.participantes_presentes ?? iv.participantesPresentes ?? 0;
  const esperadosDb =
    iv.participantes_esperados ?? iv.participantesEsperados ?? 0;
  const presentes = presentesDb > 0 ? presentesDb : participantesNomes.length;

  const esperadosChamada = contagemEsperadosFromChamada(chamada ?? null);
  const esperados = Math.max(
    esperadosDb > 0 ? esperadosDb : 0,
    participantesEsperadosObs ?? 0,
    esperadosChamada
  );

  return { presentes, esperados };
}

export function formatIntervencaoParticipantesResumo(presentes: number, esperados: number) {
  if (esperados > 0) return `${presentes} presentes / ${esperados} esperados`;
  return `${presentes} presentes`;
}

/** Lista completa da chamada: todos os alunos; selecionado = presente na aula. */
export function participantesFromChamadaPresencas(presencasList: { alunoCpf?: string; nome?: string; presente?: boolean }[]) {
  return presencasList.map((p) => ({
    id: p.alunoCpf || "",
    nome: (p.nome || "Sem nome").replace(/^\s+|\s+$/g, ""),
    selecionado: !!p.presente,
  }));
}

export function canEditIntervencaoPsico(iv: any, currentUserId: string | number | null | undefined): boolean {
  if (!currentUserId) return false;
  const creatorId = iv?.monitorUserId ?? iv?.monitor_user_id;
  if (creatorId == null || creatorId === "") return false;
  return Number(creatorId) === Number(currentUserId);
}
