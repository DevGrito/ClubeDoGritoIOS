import type { Aluno, ParticipanteInclusao } from "@shared/schema";
import { isCpfProvisorio, normalizeCpfDigits } from "@shared/cpf";
import { pool } from "../db";

type ProgramaFonte = "pec" | "inclusao" | "psico_comunidade";

export type PsicoAtendidoComunidadeRecord = Record<string, unknown> & {
  id: number | string;
  nome?: string | null;
  cpf?: string | null;
};

function mapStatus(raw: string | null | undefined): string {
  const s = String(raw || "").toLowerCase().trim();
  if (
    [
      "inativo",
      "inativa",
      "cancelado",
      "cancelada",
      "evadido",
      "concluido",
      "concluída",
      "concluida",
      "suspenso",
      "desistente",
      "formado",
    ].includes(s)
  ) {
    return "inativo";
  }
  return "ativo";
}

function resolveDataEgresso(
  programaStatus: string,
  explicit?: Date | string | null
): Date | null {
  if (programaStatus !== "inativo") return null;
  if (explicit) return new Date(explicit);
  return new Date();
}

function toDateOnly(val: unknown): string | null {
  if (!val) return null;
  const s = String(val).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function pickString(...vals: unknown[]): string | null {
  for (const v of vals) {
    const s = v == null ? "" : String(v).trim();
    if (s) return s;
  }
  return null;
}

export type BeneficiosSociaisExtras = {
  pe_de_meia?: string | null;
  gas_do_povo?: string | null;
};

function buildBeneficiosSociais(bolsaFamilia: unknown, extras?: BeneficiosSociaisExtras) {
  return {
    bolsa_familia: mapSimNaoLegado(bolsaFamilia) || pickString(bolsaFamilia),
    pe_de_meia: mapSimNaoLegado(extras?.pe_de_meia) || pickString(extras?.pe_de_meia),
    gas_do_povo: mapSimNaoLegado(extras?.gas_do_povo) || pickString(extras?.gas_do_povo),
  };
}

function mapSimNaoLegado(val: unknown): string | null {
  const s = String(val ?? "").trim().toLowerCase();
  if (["sim", "s", "true"].includes(s)) return "sim";
  if (["nao", "não", "n", "false"].includes(s)) return "nao";
  return null;
}

export async function getAtendidoGritoByCpf(cpf: string): Promise<Record<string, unknown> | null> {
  const digits = normalizeCpfDigits(cpf);
  if (digits.length !== 11) return null;
  const { rows } = await pool.query(`SELECT * FROM atendidos_grito WHERE cpf = $1 LIMIT 1`, [digits]);
  return rows[0] || null;
}

/** Retorna CPF canônico do mestre se existir; senão null (não cria registro). */
export async function resolveAtendidoCpfIfExists(
  cpfRaw: string | null | undefined
): Promise<string | null> {
  const digits = normalizeCpfDigits(cpfRaw);
  if (digits.length !== 11) return null;
  const { rows } = await pool.query<{ cpf: string }>(
    `SELECT cpf FROM atendidos_grito WHERE cpf = $1 LIMIT 1`,
    [digits]
  );
  return rows[0]?.cpf || null;
}

export async function migrateAtendidoGritoCpf(oldCpfRaw: string, newCpfRaw: string): Promise<void> {
  const oldCpf = normalizeCpfDigits(oldCpfRaw);
  const newCpf = normalizeCpfDigits(newCpfRaw);
  if (oldCpf === newCpf || oldCpf.length !== 11 || newCpf.length !== 11) return;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: oldRows } = await client.query(
      `SELECT cpf FROM atendidos_grito WHERE cpf = $1 LIMIT 1`,
      [oldCpf]
    );
    if (oldRows.length === 0) {
      await client.query("COMMIT");
      return;
    }

    const { rows: newRows } = await client.query(
      `SELECT cpf FROM atendidos_grito WHERE cpf = $1 LIMIT 1`,
      [newCpf]
    );

    if (newRows.length === 0) {
      // Libera matrícula única no registro antigo antes de copiar (evita violação UNIQUE)
      await client.query(
        `UPDATE atendidos_grito SET numero_matricula = NULL WHERE cpf = $1`,
        [oldCpf]
      );
      await client.query(
        `INSERT INTO atendidos_grito (
          cpf, cpf_provisorio, nome_completo, data_nascimento, genero, escolaridade,
          instituicao_ensino, telefone, email, whatsapp, bolsa_familia, foto_perfil,
          numero_matricula, status, cep, logradouro, numero, complemento, bairro, cidade, estado,
          dados_complementares, fonte_ultima_atualizacao, legado_atualizado_em, created_at, updated_at
        )
        SELECT
          $2, $3, nome_completo, data_nascimento, genero, escolaridade,
          instituicao_ensino, telefone, email, whatsapp, bolsa_familia, foto_perfil,
          numero_matricula, status, cep, logradouro, numero, complemento, bairro, cidade, estado,
          dados_complementares, fonte_ultima_atualizacao, legado_atualizado_em, created_at, NOW()
        FROM atendidos_grito WHERE cpf = $1`,
        [oldCpf, newCpf, isCpfProvisorio(newCpf)]
      );
      await client.query(`UPDATE atendidos_grito_observacoes SET cpf = $2 WHERE cpf = $1`, [
        oldCpf,
        newCpf,
      ]);
      await client.query(`UPDATE atendidos_grito_programa SET cpf = $2 WHERE cpf = $1`, [
        oldCpf,
        newCpf,
      ]);
      // Reapontar FKs Fase 4 antes de apagar o CPF antigo
      await client.query(
        `UPDATE monitor_participantes SET atendido_cpf = $2 WHERE atendido_cpf = $1`,
        [oldCpf, newCpf]
      );
      await client.query(
        `UPDATE documentos_participante SET atendido_cpf = $2 WHERE atendido_cpf = $1`,
        [oldCpf, newCpf]
      );
      await client.query(`DELETE FROM atendidos_grito WHERE cpf = $1`, [oldCpf]);
    } else {
      await client.query(
        `UPDATE atendidos_grito_programa SET cpf = $2
         WHERE cpf = $1
           AND NOT EXISTS (
             SELECT 1 FROM atendidos_grito_programa p
             WHERE p.cpf = $2 AND p.programa = atendidos_grito_programa.programa
           )`,
        [oldCpf, newCpf]
      );
      await client.query(`DELETE FROM atendidos_grito_programa WHERE cpf = $1`, [oldCpf]);
      await client.query(`UPDATE atendidos_grito_observacoes SET cpf = $2 WHERE cpf = $1`, [
        oldCpf,
        newCpf,
      ]);
      await client.query(
        `UPDATE monitor_participantes SET atendido_cpf = $2 WHERE atendido_cpf = $1`,
        [oldCpf, newCpf]
      );
      await client.query(
        `UPDATE documentos_participante SET atendido_cpf = $2 WHERE atendido_cpf = $1`,
        [oldCpf, newCpf]
      );
      await client.query(`DELETE FROM atendidos_grito WHERE cpf = $1`, [oldCpf]);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getAtendidoGritoMatricula(cpf: string): Promise<string | null> {
  const digits = normalizeCpfDigits(cpf);
  if (digits.length !== 11) return null;
  const { rows } = await pool.query<{ numero_matricula: string | null }>(
    `SELECT numero_matricula FROM atendidos_grito WHERE cpf = $1 LIMIT 1`,
    [digits]
  );
  return rows[0]?.numero_matricula || null;
}

export async function resolveMatriculaGlobal(
  cpf: string,
  offered?: string | null
): Promise<string> {
  const cpfDigits = normalizeCpfDigits(cpf);
  const existing = await getAtendidoGritoMatricula(cpfDigits);
  if (existing) return existing;

  if (offered && String(offered).trim()) {
    const off = String(offered).trim();
    const { rows: conflict } = await pool.query(
      `SELECT cpf FROM atendidos_grito WHERE numero_matricula = $1 AND cpf <> $2 LIMIT 1`,
      [off, cpfDigits]
    );
    if (conflict.length === 0) return off;
  }

  for (let attempt = 0; attempt < 100; attempt++) {
    const { rows } = await pool.query<{ next_num: string }>(
      `SELECT nextval('matricula_global_seq')::text AS next_num`
    );
    const candidate = parseInt(rows[0]?.next_num || "1", 10).toString().padStart(4, "0");
    const { rows: taken } = await pool.query(
      `SELECT 1 FROM atendidos_grito WHERE numero_matricula = $1 LIMIT 1`,
      [candidate]
    );
    if (taken.length === 0) return candidate;
  }

  throw new Error("Não foi possível gerar matrícula global única");
}

export async function getNextCpfProvisorio(): Promise<string> {
  const { rows } = await pool.query<{ cpf: string }>(`
    SELECT cpf FROM atendidos_grito WHERE cpf LIKE '00000000%'
    UNION ALL
    SELECT cpf FROM aluno WHERE REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') LIKE '00000000%'
    UNION ALL
    SELECT cpf FROM participantes_inclusao WHERE REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') LIKE '00000000%'
    UNION ALL
    SELECT cpf FROM psico_atendidos_comunidade WHERE REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') LIKE '00000000%'
  `);

  let maxNum = 0;
  for (const row of rows) {
    const digits = normalizeCpfDigits(row.cpf);
    if (digits.length === 11 && digits.startsWith("00000000")) {
      const n = parseInt(digits.slice(9), 10);
      if (n > maxNum) maxNum = n;
    }
  }

  const next = maxNum + 1;
  const digits = `000000000${String(next).padStart(2, "0")}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

async function upsertAtendidoGrito(data: {
  cpf: string;
  nomeCompleto: string;
  dataNascimento: string | null;
  genero: string | null;
  escolaridade: string | null;
  instituicaoEnsino: string | null;
  telefone: string | null;
  email: string | null;
  whatsapp: string | null;
  bolsaFamilia: string | null;
  fotoPerfil: string | null;
  numeroMatricula: string | null;
  statusGlobal: string;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  fonte: ProgramaFonte;
  dadosComplementares: Record<string, unknown>;
}) {
  await pool.query(
    `INSERT INTO atendidos_grito (
      cpf, cpf_provisorio, nome_completo, data_nascimento, genero, escolaridade,
      instituicao_ensino, telefone, email, whatsapp, bolsa_familia, foto_perfil,
      numero_matricula, status, cep, logradouro, numero, complemento, bairro, cidade, estado,
      dados_complementares, fonte_ultima_atualizacao, legado_atualizado_em, updated_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,NOW(),NOW()
    )
    ON CONFLICT (cpf) DO UPDATE SET
      cpf_provisorio = EXCLUDED.cpf_provisorio,
      nome_completo = EXCLUDED.nome_completo,
      data_nascimento = COALESCE(EXCLUDED.data_nascimento, atendidos_grito.data_nascimento),
      genero = COALESCE(EXCLUDED.genero, atendidos_grito.genero),
      escolaridade = COALESCE(EXCLUDED.escolaridade, atendidos_grito.escolaridade),
      instituicao_ensino = COALESCE(EXCLUDED.instituicao_ensino, atendidos_grito.instituicao_ensino),
      telefone = COALESCE(EXCLUDED.telefone, atendidos_grito.telefone),
      email = COALESCE(EXCLUDED.email, atendidos_grito.email),
      whatsapp = COALESCE(EXCLUDED.whatsapp, atendidos_grito.whatsapp),
      bolsa_familia = COALESCE(EXCLUDED.bolsa_familia, atendidos_grito.bolsa_familia),
      foto_perfil = COALESCE(EXCLUDED.foto_perfil, atendidos_grito.foto_perfil),
      numero_matricula = COALESCE(EXCLUDED.numero_matricula, atendidos_grito.numero_matricula),
      status = EXCLUDED.status,
      cep = COALESCE(EXCLUDED.cep, atendidos_grito.cep),
      logradouro = COALESCE(EXCLUDED.logradouro, atendidos_grito.logradouro),
      numero = COALESCE(EXCLUDED.numero, atendidos_grito.numero),
      complemento = COALESCE(EXCLUDED.complemento, atendidos_grito.complemento),
      bairro = COALESCE(EXCLUDED.bairro, atendidos_grito.bairro),
      cidade = COALESCE(EXCLUDED.cidade, atendidos_grito.cidade),
      estado = COALESCE(EXCLUDED.estado, atendidos_grito.estado),
      dados_complementares = EXCLUDED.dados_complementares,
      fonte_ultima_atualizacao = EXCLUDED.fonte_ultima_atualizacao,
      legado_atualizado_em = NOW(),
      updated_at = NOW()`,
    [
      data.cpf,
      isCpfProvisorio(data.cpf),
      data.nomeCompleto,
      data.dataNascimento,
      data.genero,
      data.escolaridade,
      data.instituicaoEnsino,
      data.telefone,
      data.email,
      data.whatsapp,
      data.bolsaFamilia,
      data.fotoPerfil,
      data.numeroMatricula,
      data.statusGlobal,
      data.cep,
      data.logradouro,
      data.numero,
      data.complemento,
      data.bairro,
      data.cidade,
      data.estado,
      JSON.stringify(data.dadosComplementares),
      data.fonte,
    ]
  );
}

async function upsertPrograma(data: {
  cpf: string;
  programa: ProgramaFonte;
  status: string;
  legadoTipo: string;
  legadoId: string;
  dataIngresso?: Date | string | null;
  dataEgresso?: Date | string | null;
}) {
  const programaStatus = mapStatus(data.status);
  const dataEgresso = resolveDataEgresso(programaStatus, data.dataEgresso);

  await pool.query(
    `INSERT INTO atendidos_grito_programa (
      cpf, programa, status, legado_tipo, legado_id, data_ingresso, data_egresso, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
    ON CONFLICT (cpf, programa) DO UPDATE SET
      status = EXCLUDED.status,
      legado_tipo = EXCLUDED.legado_tipo,
      legado_id = EXCLUDED.legado_id,
      data_ingresso = COALESCE(EXCLUDED.data_ingresso, atendidos_grito_programa.data_ingresso),
      data_egresso = CASE
        WHEN EXCLUDED.status = 'inativo' THEN COALESCE(EXCLUDED.data_egresso, atendidos_grito_programa.data_egresso, NOW())
        ELSE NULL
      END,
      updated_at = NOW()`,
    [
      data.cpf,
      data.programa,
      programaStatus,
      data.legadoTipo,
      data.legadoId,
      data.dataIngresso ? new Date(data.dataIngresso) : null,
      dataEgresso,
    ]
  );
}

export async function syncFromPecAluno(
  alunoRecord: Aluno,
  extras?: BeneficiosSociaisExtras
): Promise<void> {
  const cpf = normalizeCpfDigits(alunoRecord.cpf);
  if (cpf.length !== 11) return;

  const programaStatus = mapStatus(alunoRecord.situacao_atendimento);
  const { rows: outrosProgramas } = await pool.query<{ ativo: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM atendidos_grito_programa
       WHERE cpf = $1 AND programa <> 'pec' AND status = 'ativo'
     ) AS ativo`,
    [cpf]
  );
  const statusGlobal =
    programaStatus === "ativo" || outrosProgramas[0]?.ativo ? "ativo" : "inativo";

  await upsertAtendidoGrito({
    cpf,
    nomeCompleto: alunoRecord.nome_completo,
    dataNascimento: toDateOnly(alunoRecord.data_nascimento),
    genero: pickString(alunoRecord.genero),
    escolaridade: pickString(alunoRecord.escolaridade, alunoRecord.serie),
    instituicaoEnsino: pickString(alunoRecord.instituicao_ensino),
    telefone: pickString(alunoRecord.telefone),
    email: pickString(alunoRecord.email),
    whatsapp: pickString(alunoRecord.whatsapp),
    bolsaFamilia: pickString(alunoRecord.bolsa_familia),
    fotoPerfil: pickString(alunoRecord.foto_perfil),
    numeroMatricula: pickString(alunoRecord.numero_matricula),
    statusGlobal,
    cep: pickString(alunoRecord.cep),
    logradouro: pickString(alunoRecord.logradouro),
    numero: pickString(alunoRecord.numero),
    complemento: pickString(alunoRecord.complemento),
    bairro: pickString(alunoRecord.bairro),
    cidade: pickString(alunoRecord.cidade),
    estado: pickString(alunoRecord.estado),
    fonte: "pec",
    dadosComplementares: {
      legado: "aluno",
      snapshot: alunoRecord,
      beneficios_sociais: buildBeneficiosSociais(alunoRecord.bolsa_familia, extras),
    },
  });

  await upsertPrograma({
    cpf,
    programa: "pec",
    status: programaStatus,
    legadoTipo: "aluno",
    legadoId: cpf,
    dataIngresso: alunoRecord.data_entrada || alunoRecord.createdAt,
    dataEgresso:
      programaStatus === "inativo"
        ? alunoRecord.data_inativacao || new Date()
        : null,
  });
}

export async function syncFromInclusaoParticipante(
  participante: ParticipanteInclusao,
  extras?: BeneficiosSociaisExtras
): Promise<void> {
  const cpf = normalizeCpfDigits(participante.cpf);
  if (cpf.length !== 11) return;

  const programaStatus = mapStatus(participante.status);
  const { rows: outrosProgramas } = await pool.query<{ ativo: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM atendidos_grito_programa
       WHERE cpf = $1 AND programa <> 'inclusao' AND status = 'ativo'
     ) AS ativo`,
    [cpf]
  );
  const statusGlobal =
    programaStatus === "ativo" || outrosProgramas[0]?.ativo ? "ativo" : "inativo";

  await upsertAtendidoGrito({
    cpf,
    nomeCompleto: participante.nome,
    dataNascimento: toDateOnly(participante.dataNascimento),
    genero: pickString(participante.genero),
    escolaridade: pickString(participante.escolaridade, participante.serie),
    instituicaoEnsino: pickString(participante.instituicaoEnsino),
    telefone: pickString(participante.telefone),
    email: pickString(participante.email),
    whatsapp: participante.telefoneWhatsapp ? pickString(participante.telefone) : pickString(participante.telefone),
    bolsaFamilia: pickString(participante.bolsaFamilia),
    fotoPerfil: pickString(participante.fotoUrl),
    numeroMatricula: pickString(participante.codigoMatricula),
    statusGlobal,
    cep: pickString(participante.cep),
    logradouro: pickString(participante.logradouro),
    numero: pickString(participante.numero),
    complemento: pickString(participante.complemento),
    bairro: pickString(participante.bairro),
    cidade: pickString(participante.cidade),
    estado: pickString(participante.estado),
    fonte: "inclusao",
    dadosComplementares: {
      legado: "participantes_inclusao",
      snapshot: participante,
      beneficios_sociais: buildBeneficiosSociais(participante.bolsaFamilia, extras),
    },
  });

  await upsertPrograma({
    cpf,
    programa: "inclusao",
    status: programaStatus,
    legadoTipo: "participantes_inclusao",
    legadoId: String(participante.id),
    dataIngresso: participante.dataIngresso || participante.dataEntrada || participante.createdAt,
    dataEgresso:
      programaStatus === "inativo"
        ? participante.dataEgresso || new Date()
        : null,
  });
}

export async function syncFromPsicoComunidade(
  record: PsicoAtendidoComunidadeRecord,
  extras?: BeneficiosSociaisExtras
): Promise<void> {
  const cpf = normalizeCpfDigits(record.cpf);
  if (cpf.length !== 11) return;

  const programaStatus = "ativo";
  const { rows: outrosProgramas } = await pool.query<{ ativo: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM atendidos_grito_programa
       WHERE cpf = $1 AND programa <> 'psico_comunidade' AND status = 'ativo'
     ) AS ativo`,
    [cpf]
  );
  const statusGlobal =
    programaStatus === "ativo" || outrosProgramas[0]?.ativo ? "ativo" : "inativo";

  const matricula = await resolveMatriculaGlobal(cpf, null);

  await upsertAtendidoGrito({
    cpf,
    nomeCompleto: pickString(record.nome) || "Sem nome",
    dataNascimento: toDateOnly(record.data_nascimento),
    genero: pickString(record.sexo),
    escolaridade: null,
    instituicaoEnsino: null,
    telefone: pickString(record.telefone),
    email: pickString(record.email),
    whatsapp: pickString(record.telefone),
    bolsaFamilia: mapSimNaoLegado(record.tem_bolsa_familia),
    fotoPerfil: pickString(record.foto_url),
    numeroMatricula: matricula,
    statusGlobal,
    cep: pickString(record.cep),
    logradouro: pickString(record.endereco, record.logradouro),
    numero: pickString(record.numero),
    complemento: pickString(record.complemento),
    bairro: pickString(record.bairro),
    cidade: pickString(record.cidade),
    estado: pickString(record.estado),
    fonte: "psico_comunidade",
    dadosComplementares: {
      legado: "psico_atendidos_comunidade",
      snapshot: record,
      igf: {
        numero_pessoas: record.numero_pessoas ?? null,
        criancas: record.criancas ?? null,
        adolescentes: record.adolescentes ?? null,
        adultos: record.adultos ?? null,
        idosos: record.idosos ?? null,
      },
      beneficios_sociais: buildBeneficiosSociais(record.tem_bolsa_familia, extras),
    },
  });

  await upsertPrograma({
    cpf,
    programa: "psico_comunidade",
    status: programaStatus,
    legadoTipo: "psico_atendidos_comunidade",
    legadoId: String(record.id),
    dataIngresso:
      record.created_at instanceof Date || typeof record.created_at === "string"
        ? record.created_at
        : new Date(),
    dataEgresso: null,
  });
}

/** Atualiza somente status do programa + status global (inativar/reativar). */
export async function syncLegadoStatusToAtendidoGrito(data: {
  cpf: string;
  programa: ProgramaFonte;
  legadoStatus: string;
  legadoTipo: string;
  legadoId: string;
  dataEgresso?: Date | string | null;
}): Promise<void> {
  const cpf = normalizeCpfDigits(data.cpf);
  if (cpf.length !== 11) return;

  const programaStatus = mapStatus(data.legadoStatus);
  await upsertPrograma({
    cpf,
    programa: data.programa,
    status: programaStatus,
    legadoTipo: data.legadoTipo,
    legadoId: data.legadoId,
    dataEgresso: data.dataEgresso,
  });

  const { rows } = await pool.query<{ any_ativo: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM atendidos_grito_programa
       WHERE cpf = $1 AND status = 'ativo'
     ) AS any_ativo`,
    [cpf]
  );
  const statusGlobal = rows[0]?.any_ativo ? "ativo" : "inativo";

  await pool.query(
    `UPDATE atendidos_grito SET status = $2, updated_at = NOW() WHERE cpf = $1`,
    [cpf, statusGlobal]
  );
}

export async function syncAtendidoGritoSafe(
  fn: () => Promise<void>,
  context: string
): Promise<void> {
  try {
    await fn();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[atendidos-grito] sync falhou (${context}):`, message);
  }
}

/** Monta payload no formato da tabela legada psico_atendidos_comunidade a partir do mestre. */
export function mapMasterToPsicoComunidadeRow(
  ag: Record<string, any>,
  programaId: number
): Record<string, any> {
  const dcRaw = ag.dados_complementares ?? ag.dadosComplementares;
  const dc =
    typeof dcRaw === "string"
      ? (() => {
          try {
            return JSON.parse(dcRaw);
          } catch {
            return {};
          }
        })()
      : dcRaw || {};
  const snap = (dc.snapshot || {}) as Record<string, any>;
  const igf = (dc.igf || {}) as Record<string, any>;
  const bolsa = pickString(ag.bolsa_familia, ag.bolsaFamilia);

  return {
    id: programaId,
    nome: ag.nome_completo || ag.nomeCompleto || snap.nome || "",
    cpf: ag.cpf,
    data_nascimento: ag.data_nascimento || ag.dataNascimento || null,
    sexo: ag.genero || snap.sexo || null,
    raca: snap.raca || null,
    telefone: ag.telefone || null,
    email: ag.email || null,
    cep: ag.cep || null,
    endereco: ag.logradouro || snap.endereco || null,
    numero: ag.numero || null,
    complemento: ag.complemento || null,
    bairro: ag.bairro || null,
    bairro_outro: snap.bairro_outro || null,
    cidade: ag.cidade || null,
    estado: ag.estado || null,
    foto_url: ag.foto_perfil || ag.fotoPerfil || null,
    tem_cad_unico: snap.tem_cad_unico || null,
    tem_bolsa_familia:
      bolsa === "sim" ? "Sim" : bolsa === "nao" ? "Não" : snap.tem_bolsa_familia || null,
    tem_bpc: snap.tem_bpc || null,
    numero_pessoas: igf.numero_pessoas ?? null,
    criancas: igf.criancas ?? null,
    adolescentes: igf.adolescentes ?? null,
    adultos: igf.adultos ?? null,
    idosos: igf.idosos ?? null,
    demandas: snap.demandas || null,
    observacoes: snap.observacoes || null,
    criado_por_user_id: snap.criado_por_user_id || null,
    created_at: ag.created_at || null,
    updated_at: ag.updated_at || null,
    _fonte: "atendidos_grito",
  };
}

export type PsicoComunidadeBody = {
  nome: string;
  cpf?: string | null;
  data_nascimento?: string | null;
  sexo?: string | null;
  raca?: string | null;
  telefone?: string | null;
  email?: string | null;
  cep?: string | null;
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  bairro_outro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  numero_pessoas?: number | string | null;
  criancas?: number | string | null;
  adolescentes?: number | string | null;
  adultos?: number | string | null;
  idosos?: number | string | null;
  tem_cad_unico?: string | null;
  tem_bolsa_familia?: string | null;
  tem_bpc?: string | null;
  demandas?: string | null;
  observacoes?: string | null;
  criado_por_user_id?: number | null;
  pe_de_meia?: string | null;
  gas_do_povo?: string | null;
  foto_url?: string | null;
};

/** Escrita só no mestre (quando LEGACY_WRITE_PSICO=false). Retorna shape legado com id=programa.id */
export async function upsertPsicoComunidadeMasterOnly(
  body: PsicoComunidadeBody,
  existingProgramaId?: number | null
): Promise<Record<string, any>> {
  const cpf = normalizeCpfDigits(body.cpf);
  if (cpf.length !== 11) {
    throw new Error("CPF com 11 dígitos é obrigatório no modo sem escrita legada");
  }
  if (!String(body.nome || "").trim()) {
    throw new Error("Nome é obrigatório");
  }

  let programaId = existingProgramaId || null;
  if (!programaId) {
    const { rows } = await pool.query<{ id: number }>(
      `SELECT id FROM atendidos_grito_programa
       WHERE cpf = $1 AND programa = 'psico_comunidade'
       LIMIT 1`,
      [cpf]
    );
    programaId = rows[0]?.id ?? null;
  }

  const record: PsicoAtendidoComunidadeRecord = {
    id: programaId || 0,
    nome: body.nome,
    cpf,
    data_nascimento: body.data_nascimento,
    sexo: body.sexo,
    raca: body.raca,
    telefone: body.telefone,
    email: body.email,
    cep: body.cep,
    endereco: body.endereco,
    numero: body.numero,
    complemento: body.complemento,
    bairro: body.bairro,
    bairro_outro: body.bairro_outro,
    cidade: body.cidade,
    estado: body.estado,
    numero_pessoas: body.numero_pessoas,
    criancas: body.criancas,
    adolescentes: body.adolescentes,
    adultos: body.adultos,
    idosos: body.idosos,
    tem_cad_unico: body.tem_cad_unico,
    tem_bolsa_familia: body.tem_bolsa_familia,
    tem_bpc: body.tem_bpc,
    demandas: body.demandas,
    observacoes: body.observacoes,
    criado_por_user_id: body.criado_por_user_id,
    foto_url: body.foto_url,
  };

  await syncFromPsicoComunidade(record, {
    pe_de_meia: body.pe_de_meia,
    gas_do_povo: body.gas_do_povo,
  });

  const { rows: progRows } = await pool.query<{ id: number }>(
    `SELECT id FROM atendidos_grito_programa
     WHERE cpf = $1 AND programa = 'psico_comunidade'
     LIMIT 1`,
    [cpf]
  );
  const finalProgramaId = progRows[0]?.id;
  if (!finalProgramaId) {
    throw new Error("Falha ao criar vínculo psico_comunidade no mestre");
  }

  await pool.query(
    `UPDATE atendidos_grito_programa
     SET legado_tipo = 'atendidos_grito_programa', legado_id = $2, updated_at = NOW()
     WHERE id = $1`,
    [finalProgramaId, String(finalProgramaId)]
  );

  // Re-sync com id estável
  if (!programaId || programaId !== finalProgramaId) {
    await syncFromPsicoComunidade(
      { ...record, id: finalProgramaId },
      { pe_de_meia: body.pe_de_meia, gas_do_povo: body.gas_do_povo }
    );
  }

  const ag = await getAtendidoGritoByCpf(cpf);
  if (!ag) throw new Error("Registro mestre não encontrado após upsert");
  return mapMasterToPsicoComunidadeRow(ag, finalProgramaId);
}

export async function listPsicoComunidadeFromMaster(): Promise<Record<string, any>[]> {
  const { rows } = await pool.query(
    `SELECT ag.*, p.id AS programa_id
     FROM atendidos_grito_programa p
     JOIN atendidos_grito ag ON ag.cpf = p.cpf
     WHERE p.programa = 'psico_comunidade' AND p.status = 'ativo'
     ORDER BY ag.nome_completo ASC`
  );
  return rows.map((r) => {
    const { programa_id, ...ag } = r;
    return mapMasterToPsicoComunidadeRow(ag, Number(programa_id));
  });
}

export async function getPsicoComunidadeFromMasterByProgramaId(
  programaId: number
): Promise<Record<string, any> | null> {
  const { rows } = await pool.query(
    `SELECT ag.*, p.id AS programa_id, p.status AS programa_status
     FROM atendidos_grito_programa p
     JOIN atendidos_grito ag ON ag.cpf = p.cpf
     WHERE p.id = $1 AND p.programa = 'psico_comunidade'
     LIMIT 1`,
    [programaId]
  );
  if (!rows[0]) return null;
  const { programa_id, programa_status, ...ag } = rows[0];
  if (programa_status === "inativo") return null;
  return mapMasterToPsicoComunidadeRow(ag, Number(programa_id));
}

/**
 * Cadastro unificado: grava só em atendidos_grito (sem programa e sem legado).
 * Programa pec/inclusao nasce na matrícula em turma.
 */
export async function upsertCadastroUnificadoMasterOnly(input: {
  cpf: string;
  nomeCompleto: string;
  dataNascimento?: string | null;
  genero?: string | null;
  escolaridade?: string | null;
  instituicaoEnsino?: string | null;
  telefone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  bolsaFamilia?: string | null;
  fotoPerfil?: string | null;
  numeroMatricula?: string | null;
  status?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  fonte: ProgramaFonte;
  dadosComplementares?: Record<string, unknown>;
  beneficiosExtras?: BeneficiosSociaisExtras;
}): Promise<Record<string, any>> {
  const cpf = normalizeCpfDigits(input.cpf);
  if (cpf.length !== 11) {
    throw new Error("CPF inválido: deve conter exatamente 11 dígitos numéricos.");
  }
  if (!String(input.nomeCompleto || "").trim()) {
    throw new Error("Nome completo é obrigatório.");
  }

  const numeroMatricula = await resolveMatriculaGlobal(cpf, input.numeroMatricula);

  await upsertAtendidoGrito({
    cpf,
    nomeCompleto: String(input.nomeCompleto).trim(),
    dataNascimento: toDateOnly(input.dataNascimento),
    genero: pickString(input.genero),
    escolaridade: pickString(input.escolaridade),
    instituicaoEnsino: pickString(input.instituicaoEnsino),
    telefone: pickString(input.telefone),
    email: pickString(input.email),
    whatsapp: pickString(input.whatsapp),
    bolsaFamilia: pickString(input.bolsaFamilia),
    fotoPerfil: pickString(input.fotoPerfil),
    numeroMatricula,
    statusGlobal: mapStatus(input.status || "ativo"),
    cep: pickString(input.cep),
    logradouro: pickString(input.logradouro),
    numero: pickString(input.numero),
    complemento: pickString(input.complemento),
    bairro: pickString(input.bairro),
    cidade: pickString(input.cidade),
    estado: pickString(input.estado),
    fonte: input.fonte,
    dadosComplementares: {
      ...(input.dadosComplementares || {}),
      beneficios_sociais: buildBeneficiosSociais(input.bolsaFamilia, input.beneficiosExtras),
    },
  });

  const ag = await getAtendidoGritoByCpf(cpf);
  if (!ag) throw new Error("Falha ao gravar atendidos_grito");
  return ag;
}

/** Vínculo de setor nasce na matrícula (pessoa vira atendido do programa ao entrar em turma). */
export async function ensureProgramaVinculo(
  cpfRaw: string,
  programa: "pec" | "inclusao"
): Promise<string> {
  const cpf = normalizeCpfDigits(cpfRaw);
  if (cpf.length !== 11) {
    throw new Error("CPF inválido: deve conter exatamente 11 dígitos numéricos.");
  }
  const master = await getAtendidoGritoByCpf(cpf);
  if (!master) {
    throw new Error("Pessoa não encontrada no cadastro unificado (atendidos_grito).");
  }

  await upsertPrograma({
    cpf,
    programa,
    status: "ativo",
    legadoTipo: "atendidos_grito",
    legadoId: cpf,
    dataIngresso: new Date(),
    dataEgresso: null,
  });

  await pool.query(
    `UPDATE atendidos_grito SET status = 'ativo', updated_at = NOW() WHERE cpf = $1`,
    [cpf]
  );

  return cpf;
}

export function mapMasterToAlunoShape(ag: Record<string, any>): Record<string, any> {
  return {
    cpf: ag.cpf,
    nome_completo: ag.nome_completo,
    foto_perfil: ag.foto_perfil,
    data_nascimento: ag.data_nascimento,
    genero: ag.genero,
    numero_matricula: ag.numero_matricula,
    situacao_atendimento: ag.status || "ativo",
    escolaridade: ag.escolaridade,
    instituicao_ensino: ag.instituicao_ensino,
    telefone: ag.telefone,
    email: ag.email,
    whatsapp: ag.whatsapp,
    bolsa_familia: ag.bolsa_familia,
    cep: ag.cep,
    logradouro: ag.logradouro,
    numero: ag.numero,
    complemento: ag.complemento,
    bairro: ag.bairro,
    cidade: ag.cidade,
    estado: ag.estado,
    area: "pec",
    createdAt: ag.created_at,
    updatedAt: ag.updated_at,
  };
}

export function mapMasterToParticipanteShape(ag: Record<string, any>): Record<string, any> {
  return {
    id: null,
    nome: ag.nome_completo,
    cpf: ag.cpf,
    email: ag.email,
    telefone: ag.telefone || ag.whatsapp || null,
    genero: ag.genero || "nao_informado",
    dataNascimento: ag.data_nascimento,
    escolaridade: ag.escolaridade,
    codigoMatricula: ag.numero_matricula,
    fotoUrl: ag.foto_perfil,
    status: ag.status || "ativo",
    cep: ag.cep,
    logradouro: ag.logradouro,
    numero: ag.numero,
    complemento: ag.complemento,
    bairro: ag.bairro,
    cidade: ag.cidade,
    estado: ag.estado,
    bolsaFamilia: ag.bolsa_familia,
    createdAt: ag.created_at,
    updatedAt: ag.updated_at,
    turmas: [],
  };
}

/**
 * Lista de cadastro PEC: todos os atendidos_grito (pool único).
 * Status do setor usa vínculo pec quando existir; senão o status global.
 * Shape compatível com a tabela `aluno` (consumido por /api/students/all).
 */
export async function listPecAlunosFromMaster(opts?: {
  status?: "ativos" | "inativos" | "todos";
  programa?: "grito" | "pec" | "inclusao";
}): Promise<Record<string, any>[]> {
  const status = opts?.status ?? "ativos";
  const programa = opts?.programa ?? "grito";

  const params: unknown[] = [];
  const where: string[] = ["(pp.cpf IS NOT NULL OR pi.cpf IS NOT NULL)"];

  if (programa === "pec") {
    where.push("pp.cpf IS NOT NULL");
  } else if (programa === "inclusao") {
    where.push("pi.cpf IS NOT NULL");
  }

  if (status === "ativos") {
    where.push(`LOWER(COALESCE(ag.status, 'ativo')) <> 'inativo'`);
  } else if (status === "inativos") {
    where.push(`LOWER(COALESCE(ag.status, 'ativo')) = 'inativo'`);
  }

  const { rows } = await pool.query(
    `SELECT
       ag.cpf,
       ag.nome_completo,
       ag.foto_perfil,
       ag.data_nascimento,
       ag.telefone,
       ag.created_at,
       COALESCE(pp.status, pi.status, ag.status, 'ativo') AS situacao_atendimento,
       (pp.cpf IS NOT NULL) AS tem_pec,
       (pi.cpf IS NOT NULL) AS tem_inclusao
     FROM atendidos_grito ag
     LEFT JOIN atendidos_grito_programa pp
       ON pp.cpf = ag.cpf AND pp.programa = 'pec'
     LEFT JOIN atendidos_grito_programa pi
       ON pi.cpf = ag.cpf AND pi.programa = 'inclusao'
     WHERE ${where.join(" AND ")}
     ORDER BY ag.nome_completo ASC`,
    params
  );

  return rows.map((r) => {
    const programas: Array<"pec" | "inclusao"> = [];
    if (r.tem_pec) programas.push("pec");
    if (r.tem_inclusao) programas.push("inclusao");
    return {
      cpf: r.cpf,
      nome_completo: r.nome_completo,
      foto_perfil: r.foto_perfil,
      data_nascimento: r.data_nascimento,
      telefone: r.telefone,
      situacao_atendimento: mapStatus(r.situacao_atendimento),
      area: "pec",
      createdAt: r.created_at,
      programas,
      temPec: !!r.tem_pec,
      temInclusao: !!r.tem_inclusao,
    };
  });
}

/**
 * Lista de cadastro Inclusão/Grito: atendidos com vínculo pec e/ou inclusão.
 * `id` numérico vem do legado quando existir (para rotas por id).
 */
export async function listInclusaoParticipantesFromMaster(opts?: {
  status?: "ativos" | "inativos" | "todos";
  programa?: "grito" | "pec" | "inclusao";
}): Promise<Record<string, any>[]> {
  const status = opts?.status ?? "ativos";
  const programa = opts?.programa ?? "grito";

  const where: string[] = ["(pp.cpf IS NOT NULL OR pi_prog.cpf IS NOT NULL)"];
  if (programa === "pec") where.push("pp.cpf IS NOT NULL");
  if (programa === "inclusao") where.push("pi_prog.cpf IS NOT NULL");
  if (status === "ativos") {
    where.push(`LOWER(COALESCE(ag.status, 'ativo')) <> 'inativo'`);
  } else if (status === "inativos") {
    where.push(`LOWER(COALESCE(ag.status, 'ativo')) = 'inativo'`);
  }

  const { rows } = await pool.query(
    `SELECT
       ag.cpf,
       ag.nome_completo,
       ag.foto_perfil,
       ag.data_nascimento,
       ag.telefone,
       ag.email,
       ag.genero,
       ag.created_at,
       ag.updated_at,
       COALESCE(pi_prog.status, pp.status, ag.status, 'ativo') AS programa_status,
       pi_prog.legado_id AS programa_legado_id,
       pi_prog.data_ingresso AS programa_data_ingresso,
       pi_prog.data_egresso AS programa_data_egresso,
       (pp.cpf IS NOT NULL) AS tem_pec,
       (pi_prog.cpf IS NOT NULL) AS tem_inclusao,
       pi.id AS participante_id,
       pi.status AS participante_status,
       pi.foto_url AS participante_foto_url
     FROM atendidos_grito ag
     LEFT JOIN atendidos_grito_programa pp
       ON pp.cpf = ag.cpf AND pp.programa = 'pec'
     LEFT JOIN atendidos_grito_programa pi_prog
       ON pi_prog.cpf = ag.cpf AND pi_prog.programa = 'inclusao'
     LEFT JOIN participantes_inclusao pi
       ON pi.cpf = ag.cpf
     WHERE ${where.join(" AND ")}
     ORDER BY ag.nome_completo ASC`
  );

  const turmasByCpf = new Map<string, any[]>();
  const cpfs = rows.map((r) => String(r.cpf || "")).filter(Boolean);
  if (cpfs.length > 0) {
    const { rows: turmaRows } = await pool.query(
      `SELECT
         pt.atendido_cpf AS cpf,
         t.id,
         t.nome,
         t.status,
         t.programa_id,
         t.data_inicio,
         t.data_fim,
         t.created_at,
         t.updated_at
       FROM participantes_turmas pt
       JOIN turmas_inclusao t ON t.id = pt.turma_id
       WHERE pt.atendido_cpf = ANY($1::text[])
       UNION ALL
       SELECT
         pi.cpf AS cpf,
         t.id,
         t.nome,
         t.status,
         t.programa_id,
         t.data_inicio,
         t.data_fim,
         t.created_at,
         t.updated_at
       FROM participantes_turmas pt
       JOIN turmas_inclusao t ON t.id = pt.turma_id
       JOIN participantes_inclusao pi ON pi.id = pt.participante_id
       WHERE pt.atendido_cpf IS NULL
         AND pt.participante_id IS NOT NULL
         AND pi.cpf = ANY($1::text[])`,
      [cpfs]
    );
    for (const tr of turmaRows) {
      const cpfKey = String(tr.cpf || "").replace(/\D/g, "");
      if (!cpfKey) continue;
      if (!turmasByCpf.has(cpfKey)) turmasByCpf.set(cpfKey, []);
      const list = turmasByCpf.get(cpfKey)!;
      if (list.some((x) => x.id === tr.id)) continue;
      list.push({
        id: tr.id,
        nome: tr.nome,
        status: tr.status,
        programaId: tr.programa_id,
        dataInicio: tr.data_inicio,
        dataFim: tr.data_fim,
        createdAt: tr.created_at,
        updatedAt: tr.updated_at,
      });
    }
  }

  return rows.map((r) => {
    const legadoFromPrograma = r.programa_legado_id
      ? Number(String(r.programa_legado_id).replace(/\D/g, ""))
      : NaN;
    const id =
      r.participante_id != null
        ? Number(r.participante_id)
        : Number.isFinite(legadoFromPrograma) && legadoFromPrograma > 0
          ? legadoFromPrograma
          : null;

    const statusMapped = mapStatus(
      r.participante_status || r.programa_status || "ativo"
    );

    const cpfKey = String(r.cpf || "").replace(/\D/g, "");
    const programas: Array<"pec" | "inclusao"> = [];
    if (r.tem_pec) programas.push("pec");
    if (r.tem_inclusao) programas.push("inclusao");

    return {
      id,
      nome: r.nome_completo,
      cpf: r.cpf,
      email: r.email,
      telefone: r.telefone,
      genero: r.genero,
      dataNascimento: r.data_nascimento,
      status: statusMapped,
      dataIngresso: r.programa_data_ingresso || null,
      dataEgresso: r.programa_data_egresso || null,
      fotoUrl: r.participante_foto_url || r.foto_perfil || null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      turmas: turmasByCpf.get(cpfKey) || [],
      programas,
      temPec: !!r.tem_pec,
      temInclusao: !!r.tem_inclusao,
    };
  });
}
