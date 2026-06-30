import type { Pool } from "pg";

export type EligibleParticipante = {
  id: number;
  nome: string;
  cpf: string | null;
};

export type PresencaListItem = {
  participanteId?: number;
  id?: number;
  nome?: string;
  alunoNome?: string;
  presente?: boolean;
  observacoes?: string | null;
  justificativa?: string | null;
  justificativaMotivo?: string | null;
  hora?: string;
  viaCatraca?: boolean;
  [key: string]: unknown;
};

export type HistoricoChamadaGroup = {
  grupoId?: number;
  turmaId?: number;
  data?: string | Date | null;
  presencas: PresencaListItem[];
  totalPresentes?: number;
  totalAlunos?: number;
  tipo?: string;
};

/** Participantes elegíveis na chamada: ativos na data, já ingressados, não evadidos antes da data. */
export async function fetchEligibleParticipantesTurmaInclusao(
  pool: Pool,
  turmaId: number,
  dateYMD: string
): Promise<EligibleParticipante[]> {
  const { rows } = await pool.query(
    `
    SELECT pi.id, pi.nome, pi.cpf
    FROM participantes_turmas pt
    JOIN participantes_inclusao pi ON pi.id = pt.participante_id
    LEFT JOIN inclusao_evasoes iev ON iev.participante_turma_id = pt.id AND iev.revertido_em IS NULL
    WHERE pt.turma_id = $1
      AND COALESCE(pt.status, 'ativo') = 'ativo'
      AND (pt.data_ingresso IS NULL OR pt.data_ingresso <= $2::date)
      AND (iev.id IS NULL OR iev.data_desligamento > $2::date)
    ORDER BY pi.nome
    `,
    [turmaId, dateYMD]
  );
  return rows;
}

export function mergePresencasWithEligible(
  saved: PresencaListItem[],
  eligible: EligibleParticipante[]
): PresencaListItem[] {
  const byId = new Map<number, PresencaListItem>();
  for (const p of saved) {
    const id = Number(p.participanteId ?? p.id);
    if (id) byId.set(id, p);
  }
  for (const e of eligible) {
    if (!byId.has(e.id)) {
      byId.set(e.id, {
        participanteId: e.id,
        id: e.id,
        nome: e.nome,
        presente: false,
      });
    }
  }
  return Array.from(byId.values()).sort((a, b) =>
    String(a.nome || a.alunoNome || "").localeCompare(String(b.nome || b.alunoNome || ""), "pt-BR")
  );
}

export async function enrichHistoricoGroupsWithEligible(
  pool: Pool,
  groups: HistoricoChamadaGroup[]
): Promise<void> {
  const cache = new Map<string, EligibleParticipante[]>();
  for (const group of groups) {
    if (group.tipo && group.tipo !== "inclusao") continue;
    const turmaId = Number(group.grupoId ?? group.turmaId);
    const dateYMD = String(group.data ?? "").split("T")[0];
    if (!turmaId || !dateYMD) continue;

    const cacheKey = `${turmaId}_${dateYMD}`;
    if (!cache.has(cacheKey)) {
      cache.set(cacheKey, await fetchEligibleParticipantesTurmaInclusao(pool, turmaId, dateYMD));
    }
    const eligible = cache.get(cacheKey)!;
    group.presencas = mergePresencasWithEligible(group.presencas || [], eligible);
    group.totalAlunos = group.presencas.length;
    group.totalPresentes = group.presencas.filter((p) => p.presente === true).length;
  }
}
