export type SituacaoFormacao = "em_formacao" | "formado" | "reprovado";

const TURMA_FINALIZADA_INCLUSAO = new Set([
  "concluido",
  "concluida",
  "finalizado",
  "encerrado",
  "encerrada",
]);

const TURMA_FINALIZADA_PEC = new Set([
  "encerrada",
  "concluido",
  "concluida",
  "inativo",
  "inativa",
  "finalizado",
]);

const STATUS_FORMADO = new Set(["concluido", "concluida", "formado"]);

export function isTurmaFinalizadaInclusao(turma: { status?: string } | null | undefined): boolean {
  const s = (turma?.status || "").toLowerCase();
  return TURMA_FINALIZADA_INCLUSAO.has(s);
}

export function isTurmaFinalizadaPec(
  instance: { situation?: string; status?: string } | null | undefined
): boolean {
  const s = (instance?.situation || instance?.status || "").toLowerCase();
  return TURMA_FINALIZADA_PEC.has(s);
}

function isStatusFormado(status: string | null | undefined): boolean {
  return STATUS_FORMADO.has((status || "").toLowerCase());
}

/** Situação acadêmica na turma (Inclusão — status do vínculo em participantes_turmas). */
export function getSituacaoFormacaoInclusao(
  turmaFinalizada: boolean,
  vinculoStatus: string | null | undefined
): SituacaoFormacao {
  if (!turmaFinalizada) return "em_formacao";
  if (isStatusFormado(vinculoStatus)) return "formado";
  const v = (vinculoStatus || "").toLowerCase();
  if (v === "reprovado" || v === "evadido") return "reprovado";
  return "reprovado";
}

/** Situação acadêmica na turma (PEC — status do vínculo em instance_enrollments). */
export function getSituacaoFormacaoPec(
  turmaFinalizada: boolean,
  aluno: { status?: string | null; situacao_atendimento?: string | null }
): SituacaoFormacao {
  if (!turmaFinalizada) return "em_formacao";
  const vinculo = (aluno.status || "").toLowerCase();
  if (isStatusFormado(vinculo)) return "formado";
  if (vinculo === "reprovado" || vinculo === "evadido") return "reprovado";
  // Legado: turmas encerradas antes do campo status
  if (isStatusFormado(aluno.situacao_atendimento)) return "formado";
  return "reprovado";
}

export const SITUACAO_FORMACAO_LABEL: Record<SituacaoFormacao, string> = {
  em_formacao: "Em formação",
  formado: "Formado",
  reprovado: "Reprovado",
};

export const SITUACAO_FORMACAO_BADGE_CLASS: Record<SituacaoFormacao, string> = {
  em_formacao: "bg-yellow-100 text-yellow-800",
  formado: "bg-green-100 text-green-800",
  reprovado: "bg-red-100 text-red-700",
};

/** Evasão ativa — fonte de verdade: pec_evasoes (via evasao_ativa da API). */
export function isAlunoEvadidoPec(aluno: {
  evasao_ativa?: boolean | null;
  evasaoAtiva?: boolean | null;
  evasao_id?: number | null;
  evasaoId?: number | null;
}): boolean {
  if (aluno.evasao_ativa === true || aluno.evasaoAtiva === true) return true;
  return (aluno.evasao_id ?? aluno.evasaoId ?? null) != null;
}

/** Evasão ativa — fonte de verdade: inclusao_evasoes (via evasaoAtiva da API). */
export function isAlunoEvadidoInclusao(aluno: {
  evasaoAtiva?: boolean | null;
  evasao_ativa?: boolean | null;
  evasaoId?: number | null;
  evasao_id?: number | null;
}): boolean {
  if (aluno.evasaoAtiva === true || aluno.evasao_ativa === true) return true;
  return (aluno.evasaoId ?? aluno.evasao_id ?? null) != null;
}
