import type { Pool } from "pg";
import { normalizeCpfDigits } from "@shared/cpf";

export type TurmaStatus = "cursando" | "formado" | "evadido" | "reprovado";

export interface FrequenciaResumo {
  totalAulas: number;
  presencas: number;
  ausencias: number;
  percentual: number;
}

export interface TurmaHistoricoItem {
  turmaId: number;
  nome: string;
  setor: "pec" | "inclusao";
  status: TurmaStatus;
  dataMatricula: string | null;
  dataInicio: string | null;
  dataFim: string | null;
  dataDesligamento: string | null;
  motivoEvasao: string | null;
  frequencia: FrequenciaResumo;
  participanteId?: number;
}

export interface TimelineEvent {
  id: string;
  data: string;
  tipo: "matricula" | "evasao" | "conclusao" | "reprovacao" | "psico" | "observacao";
  setor: string;
  titulo: string;
  descricao?: string | null;
}

export interface PsicoAtendimentoResumo {
  id: number;
  data: string;
  tipo: string | null;
  resumo: string | null;
  fonte: "atendimento" | "registro" | "registro_confidencial";
}

export interface PsicoHistorico {
  acompanhado: boolean;
  ultimoAtendimento: string | null;
  atendimentos?: PsicoAtendimentoResumo[];
}

export interface ObservacaoHistorico {
  id: number;
  cpf: string;
  autorNome: string;
  autorSetor: string;
  autorUserId: number | null;
  texto: string;
  createdAt: string;
}

export interface AtendidoGritoHistorico {
  cpf: string;
  nome: string | null;
  psico: PsicoHistorico;
  turmas: {
    pec: TurmaHistoricoItem[];
    inclusao: TurmaHistoricoItem[];
  };
  observacoes: ObservacaoHistorico[];
  timeline: TimelineEvent[];
}

async function safeQuery<T = Record<string, unknown>>(
  pool: Pool,
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  try {
    const result = await pool.query<T>(sql, params);
    return result.rows;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[atendidos-grito] Query ignorada:", message);
    return [];
  }
}

function mapPecStatus(row: Record<string, unknown>): TurmaStatus {
  if (row.evadido === true) return "evadido";
  const status = String(row.status || "").toLowerCase();
  if (status === "concluido" || status === "concluída") return "formado";
  if (status === "reprovado") return "reprovado";
  return "cursando";
}

function mapInclusaoStatus(row: Record<string, unknown>): TurmaStatus {
  const status = String(row.pt_status || row.status || "").toLowerCase();
  if (status === "evadido") return "evadido";
  if (status === "reprovado") return "reprovado";
  if (["concluido", "concluida", "formado", "finalizado"].includes(status)) return "formado";
  return "cursando";
}

async function calcFrequenciaPec(
  pool: Pool,
  turmaId: number,
  cpf: string
): Promise<FrequenciaResumo> {
  const enrollRes = await pool.query<{ enrollment_date: string | null }>(
    `SELECT enrollment_date::date as enrollment_date
     FROM instance_enrollments
     WHERE activity_instance_id = $1
       AND REGEXP_REPLACE(student_cpf, '[^0-9]', '', 'g') = $2
     ORDER BY enrollment_date ASC NULLS FIRST
     LIMIT 1`,
    [turmaId, cpf]
  );
  const enrollmentDate = enrollRes.rows[0]?.enrollment_date || null;

  const rows = await pool.query<{ presente: boolean | null }>(
    `SELECT
       (SELECT (att->>'presente')::boolean
        FROM jsonb_array_elements(s.attendance) AS att
        WHERE REGEXP_REPLACE(att->>'alunoCpf', '[^0-9]', '', 'g') = $2
        LIMIT 1) as presente
     FROM sessions s
     WHERE s.activity_instance_id = $1
       AND s.attendance IS NOT NULL
       AND ($3::date IS NULL OR s.date::date >= $3::date)`,
    [turmaId, cpf, enrollmentDate]
  );

  const total = rows.rows.length;
  const presencas = rows.rows.filter((r) => r.presente === true).length;
  return {
    totalAulas: total,
    presencas,
    ausencias: total - presencas,
    percentual: total > 0 ? Math.round((presencas / total) * 100) : 0,
  };
}

async function calcFrequenciaInclusao(
  pool: Pool,
  turmaId: number,
  participanteId: number
): Promise<FrequenciaResumo> {
  const rows = await pool.query<{ presente: boolean }>(
    `SELECT presente
     FROM presencas_inclusao
     WHERE turma_id = $1 AND participante_id = $2`,
    [turmaId, participanteId]
  );
  const total = rows.rows.length;
  const presencas = rows.rows.filter((r) => r.presente === true).length;
  return {
    totalAulas: total,
    presencas,
    ausencias: total - presencas,
    percentual: total > 0 ? Math.round((presencas / total) * 100) : 0,
  };
}

async function resolveNomeByCpf(pool: Pool, cpf: string): Promise<string | null> {
  const rows = await safeQuery<{ nome: string }>(
    pool,
    `SELECT COALESCE(
       (SELECT nome_completo FROM atendidos_grito WHERE cpf = $1 LIMIT 1),
       (SELECT nome_completo FROM aluno WHERE REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') = $1 LIMIT 1),
       (SELECT nome FROM participantes_inclusao WHERE REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') = $1 LIMIT 1),
       (SELECT nome FROM psico_atendidos_comunidade WHERE REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') = $1 LIMIT 1)
     ) AS nome`,
    [cpf]
  );
  return rows[0]?.nome?.trim() || null;
}

async function fetchParticipanteInclusaoId(pool: Pool, cpf: string): Promise<number | null> {
  const rows = await safeQuery<{ id: number }>(
    pool,
    `SELECT id FROM participantes_inclusao
     WHERE REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') = $1
     ORDER BY id DESC LIMIT 1`,
    [cpf]
  );
  return rows[0]?.id ?? null;
}

async function fetchPsicoResumo(
  pool: Pool,
  cpf: string,
  psicoFullAccess: boolean
): Promise<PsicoHistorico> {
  const summaryRows = await safeQuery<{ ultimo: string | null; acompanhado: boolean }>(
    pool,
    `WITH datas AS (
       SELECT pa.data_atendimento::date AS data_ref
       FROM psico_atendimentos pa
       JOIN psico_inclusao_vinculo piv ON piv.id = pa.psico_inclusao_vinculo_id
       JOIN participantes_inclusao pi ON pi.id = piv.participante_inclusao_id
       WHERE REGEXP_REPLACE(pi.cpf, '[^0-9]', '', 'g') = $1
       UNION ALL
       SELECT pa.data_atendimento::date
       FROM psico_atendimentos pa
       JOIN psico_pec_vinculo ppv ON ppv.id = pa.psico_pec_vinculo_id
       JOIN enrollments en ON en.id = ppv.enrollment_id
       JOIN users u ON u.id = en.person_id
       WHERE REGEXP_REPLACE(COALESCE(u.cpf, ''), '[^0-9]', '', 'g') = $1
       UNION ALL
       SELECT pa.data_atendimento::date
       FROM psico_atendimentos pa
       JOIN psico_pec_vinculo ppv ON ppv.id = pa.psico_pec_vinculo_id
       JOIN enrollments en ON en.id = ppv.enrollment_id
       JOIN instance_enrollments ie ON ie.activity_instance_id = en.activity_instance_id
       WHERE REGEXP_REPLACE(ie.student_cpf, '[^0-9]', '', 'g') = $1
       UNION ALL
       SELECT pr.data::date FROM psico_registros pr
       WHERE REGEXP_REPLACE(COALESCE(pr.participante_cpf, ''), '[^0-9]', '', 'g') = $1
       UNION ALL
       SELECT prc.data::date FROM psico_registros_confidenciais prc
       WHERE REGEXP_REPLACE(COALESCE(prc.participante_cpf, ''), '[^0-9]', '', 'g') = $1
     )
     SELECT
       (SELECT MAX(data_ref)::text FROM datas) AS ultimo,
       (
         EXISTS (SELECT 1 FROM datas)
         OR EXISTS (
           SELECT 1 FROM psico_atendidos_comunidade pac
           WHERE REGEXP_REPLACE(COALESCE(pac.cpf, ''), '[^0-9]', '', 'g') = $1
         )
       ) AS acompanhado`,
    [cpf]
  );

  const base: PsicoHistorico = {
    acompanhado: summaryRows[0]?.acompanhado === true,
    ultimoAtendimento: summaryRows[0]?.ultimo || null,
  };

  if (!psicoFullAccess) return base;

  const atendimentos = await safeQuery<{
    id: number;
    data: string;
    tipo: string | null;
    resumo: string | null;
    fonte: PsicoAtendimentoResumo["fonte"];
  }>(
    pool,
    `SELECT id, data::text, tipo, resumo, fonte FROM (
       SELECT pa.id, pa.data_atendimento AS data, pa.tipo::text AS tipo, pa.resumo, 'atendimento'::text AS fonte
       FROM psico_atendimentos pa
       JOIN psico_inclusao_vinculo piv ON piv.id = pa.psico_inclusao_vinculo_id
       JOIN participantes_inclusao pi ON pi.id = piv.participante_inclusao_id
       WHERE REGEXP_REPLACE(pi.cpf, '[^0-9]', '', 'g') = $1
       UNION ALL
       SELECT pa.id, pa.data_atendimento, pa.tipo::text, pa.resumo, 'atendimento'
       FROM psico_atendimentos pa
       JOIN psico_pec_vinculo ppv ON ppv.id = pa.psico_pec_vinculo_id
       JOIN enrollments en ON en.id = ppv.enrollment_id
       JOIN users u ON u.id = en.person_id
       WHERE REGEXP_REPLACE(COALESCE(u.cpf, ''), '[^0-9]', '', 'g') = $1
       UNION ALL
       SELECT pa.id, pa.data_atendimento, pa.tipo::text, pa.resumo, 'atendimento'
       FROM psico_atendimentos pa
       JOIN psico_pec_vinculo ppv ON ppv.id = pa.psico_pec_vinculo_id
       JOIN enrollments en ON en.id = ppv.enrollment_id
       JOIN instance_enrollments ie ON ie.activity_instance_id = en.activity_instance_id
       WHERE REGEXP_REPLACE(ie.student_cpf, '[^0-9]', '', 'g') = $1
       UNION ALL
       SELECT pr.id, pr.data, pr.tipo, LEFT(pr.conteudo, 200), 'registro'
       FROM psico_registros pr
       WHERE REGEXP_REPLACE(COALESCE(pr.participante_cpf, ''), '[^0-9]', '', 'g') = $1
       UNION ALL
       SELECT prc.id, prc.data, prc.tipo, LEFT(prc.conteudo, 200), 'registro_confidencial'
       FROM psico_registros_confidenciais prc
       WHERE REGEXP_REPLACE(COALESCE(prc.participante_cpf, ''), '[^0-9]', '', 'g') = $1
     ) sub
     ORDER BY data DESC, id DESC`,
    [cpf]
  );

  return { ...base, atendimentos };
}

function buildTimeline(
  turmasPec: TurmaHistoricoItem[],
  turmasInclusao: TurmaHistoricoItem[],
  psico: PsicoHistorico,
  observacoes: ObservacaoHistorico[]
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const t of turmasPec) {
    if (t.dataMatricula) {
      events.push({
        id: `pec-mat-${t.turmaId}`,
        data: t.dataMatricula,
        tipo: "matricula",
        setor: "PEC",
        titulo: `Matrícula: ${t.nome}`,
      });
    }
    if (t.status === "evadido" && t.dataDesligamento) {
      events.push({
        id: `pec-eva-${t.turmaId}`,
        data: t.dataDesligamento,
        tipo: "evasao",
        setor: "PEC",
        titulo: `Evasão: ${t.nome}`,
        descricao: t.motivoEvasao,
      });
    }
    if (t.status === "formado" && t.dataFim) {
      events.push({
        id: `pec-form-${t.turmaId}`,
        data: t.dataFim,
        tipo: "conclusao",
        setor: "PEC",
        titulo: `Formado: ${t.nome}`,
      });
    }
    if (t.status === "reprovado" && t.dataFim) {
      events.push({
        id: `pec-rep-${t.turmaId}`,
        data: t.dataFim,
        tipo: "reprovacao",
        setor: "PEC",
        titulo: `Reprovado: ${t.nome}`,
      });
    }
  }

  for (const t of turmasInclusao) {
    if (t.dataMatricula) {
      events.push({
        id: `inc-mat-${t.turmaId}`,
        data: t.dataMatricula,
        tipo: "matricula",
        setor: "Inclusão",
        titulo: `Matrícula: ${t.nome}`,
      });
    }
    if (t.status === "evadido" && t.dataDesligamento) {
      events.push({
        id: `inc-eva-${t.turmaId}`,
        data: t.dataDesligamento,
        tipo: "evasao",
        setor: "Inclusão",
        titulo: `Evasão: ${t.nome}`,
        descricao: t.motivoEvasao,
      });
    }
    if (t.status === "formado" && t.dataFim) {
      events.push({
        id: `inc-form-${t.turmaId}`,
        data: t.dataFim,
        tipo: "conclusao",
        setor: "Inclusão",
        titulo: `Formado: ${t.nome}`,
      });
    }
    if (t.status === "reprovado" && t.dataFim) {
      events.push({
        id: `inc-rep-${t.turmaId}`,
        data: t.dataFim,
        tipo: "reprovacao",
        setor: "Inclusão",
        titulo: `Reprovado: ${t.nome}`,
      });
    }
  }

  if (psico.ultimoAtendimento) {
    events.push({
      id: "psico-ultimo",
      data: psico.ultimoAtendimento,
      tipo: "psico",
      setor: "Psicossocial",
      titulo: psico.acompanhado ? "Último atendimento psicossocial" : "Registro psicossocial",
    });
  }

  for (const obs of observacoes) {
    events.push({
      id: `obs-${obs.id}`,
      data: obs.createdAt.slice(0, 10),
      tipo: "observacao",
      setor: obs.autorSetor,
      titulo: `Observação — ${obs.autorNome}`,
      descricao: obs.texto,
    });
  }

  return events.sort((a, b) => b.data.localeCompare(a.data));
}

export async function fetchHistoricoByCpf(
  pool: Pool,
  rawCpf: string,
  options: { psicoFullAccess: boolean }
): Promise<AtendidoGritoHistorico | null> {
  const cpf = normalizeCpfDigits(rawCpf);
  if (cpf.length !== 11) return null;

  const [nome, participanteId, observacoes] = await Promise.all([
    resolveNomeByCpf(pool, cpf),
    fetchParticipanteInclusaoId(pool, cpf),
    fetchObservacoesByCpf(pool, cpf),
  ]);

  const pecRows = await safeQuery<Record<string, unknown>>(
    pool,
    `SELECT
       ai.id AS turma_id,
       ai.title AS nome,
       ie.enrollment_date::text AS data_matricula,
       ai.occurrence_start::text AS data_inicio,
       ai.occurrence_end::text AS data_fim,
       ie.evadido,
       ie.status,
       ie.motivo_evasao,
       ie.data_evasao::text AS data_evasao
     FROM instance_enrollments ie
     JOIN activity_instances ai ON ai.id = ie.activity_instance_id
     WHERE REGEXP_REPLACE(ie.student_cpf, '[^0-9]', '', 'g') = $1
     ORDER BY ie.enrollment_date DESC NULLS LAST`,
    [cpf]
  );

  const turmasPec: TurmaHistoricoItem[] = [];
  for (const row of pecRows) {
    const turmaId = Number(row.turma_id);
    const frequencia = await calcFrequenciaPec(pool, turmaId, cpf);
    turmasPec.push({
      turmaId,
      nome: String(row.nome || "Turma PEC"),
      setor: "pec",
      status: mapPecStatus(row),
      dataMatricula: (row.data_matricula as string) || null,
      dataInicio: (row.data_inicio as string) || null,
      dataFim: (row.data_fim as string) || null,
      dataDesligamento: (row.data_evasao as string) || null,
      motivoEvasao: (row.motivo_evasao as string) || null,
      frequencia,
    });
  }

  const inclRows = await safeQuery<Record<string, unknown>>(
    pool,
    `SELECT
       ti.id AS turma_id,
       CONCAT(pi_prog.nome, CASE WHEN ti.nome IS NOT NULL AND ti.nome <> '' THEN ' — ' || ti.nome ELSE '' END) AS nome,
       pt.data_inscricao::text AS data_matricula,
       ti.data_inicio::text AS data_inicio,
       ti.data_fim::text AS data_fim,
       pt.status AS pt_status,
       pt.motivo_desligamento,
       pt.data_desligamento::text AS data_desligamento,
       p.id AS participante_id
     FROM participantes_inclusao p
     JOIN participantes_turmas pt ON pt.participante_id = p.id
     JOIN turmas_inclusao ti ON ti.id = pt.turma_id
     JOIN programas_inclusao pi_prog ON pi_prog.id = ti.programa_id
     WHERE REGEXP_REPLACE(p.cpf, '[^0-9]', '', 'g') = $1
     ORDER BY pt.data_inscricao DESC NULLS LAST`,
    [cpf]
  );

  const turmasInclusao: TurmaHistoricoItem[] = [];
  for (const row of inclRows) {
    const turmaId = Number(row.turma_id);
    const partId = Number(row.participante_id);
    const frequencia = await calcFrequenciaInclusao(pool, turmaId, partId);
    turmasInclusao.push({
      turmaId,
      nome: String(row.nome || "Turma Inclusão"),
      setor: "inclusao",
      status: mapInclusaoStatus(row),
      dataMatricula: (row.data_matricula as string) || null,
      dataInicio: (row.data_inicio as string) || null,
      dataFim: (row.data_fim as string) || null,
      dataDesligamento: (row.data_desligamento as string) || null,
      motivoEvasao: (row.motivo_desligamento as string) || null,
      frequencia,
      participanteId: partId,
    });
  }

  const psico = await fetchPsicoResumo(pool, cpf, options.psicoFullAccess);

  return {
    cpf,
    nome,
    psico,
    turmas: { pec: turmasPec, inclusao: turmasInclusao },
    observacoes,
    timeline: buildTimeline(turmasPec, turmasInclusao, psico, observacoes),
  };
}

export async function fetchObservacoesByCpf(
  pool: Pool,
  rawCpf: string
): Promise<ObservacaoHistorico[]> {
  const cpf = normalizeCpfDigits(rawCpf);
  if (cpf.length !== 11) return [];

  const rows = await safeQuery<{
    id: number;
    cpf: string;
    autor_nome: string;
    autor_setor: string;
    autor_user_id: number | null;
    texto: string;
    created_at: string;
  }>(
    pool,
    `SELECT id, cpf, autor_nome, autor_setor, autor_user_id, texto, created_at::text
     FROM atendidos_grito_observacoes
     WHERE cpf = $1
     ORDER BY created_at DESC`,
    [cpf]
  );

  return rows.map((r) => ({
    id: r.id,
    cpf: r.cpf,
    autorNome: r.autor_nome,
    autorSetor: r.autor_setor,
    autorUserId: r.autor_user_id,
    texto: r.texto,
    createdAt: r.created_at,
  }));
}

export function resolveAutorSetor(role: string): string {
  const r = role.toLowerCase();
  if (r.includes("psico")) return "Psicossocial";
  if (r.includes("inclusao")) return "Inclusão Produtiva";
  if (r.includes("pec")) return "PEC";
  if (r === "professor" || r === "monitor") return "PEC";
  if (r.startsWith("coordenador")) return "Coordenação";
  return role || "Geral";
}

export async function createObservacao(
  pool: Pool,
  data: {
    cpf: string;
    texto: string;
    autorNome: string;
    autorSetor: string;
    autorUserId: number | null;
  }
): Promise<ObservacaoHistorico> {
  const cpf = normalizeCpfDigits(data.cpf);
  const texto = data.texto.trim();
  if (cpf.length !== 11) throw new Error("CPF inválido");
  if (!texto) throw new Error("Texto obrigatório");

  const rows = await pool.query<{
    id: number;
    cpf: string;
    autor_nome: string;
    autor_setor: string;
    autor_user_id: number | null;
    texto: string;
    created_at: string;
  }>(
    `INSERT INTO atendidos_grito_observacoes (cpf, autor_nome, autor_setor, autor_user_id, texto)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, cpf, autor_nome, autor_setor, autor_user_id, texto, created_at::text`,
    [cpf, data.autorNome, data.autorSetor, data.autorUserId, texto]
  );

  const r = rows.rows[0];
  return {
    id: r.id,
    cpf: r.cpf,
    autorNome: r.autor_nome,
    autorSetor: r.autor_setor,
    autorUserId: r.autor_user_id,
    texto: r.texto,
    createdAt: r.created_at,
  };
}

export async function deleteObservacao(
  pool: Pool,
  id: number,
  authorUserId: number | null
): Promise<boolean> {
  if (!authorUserId) return false;
  const result = await pool.query(
    `DELETE FROM atendidos_grito_observacoes
     WHERE id = $1 AND autor_user_id = $2`,
    [id, authorUserId]
  );
  return (result.rowCount ?? 0) > 0;
}
