import type { Pool } from "pg";
import { isCpfProvisorio, normalizeCpfDigits } from "@shared/cpf";

export type AtendidosGritoFonte = "pec" | "inclusao" | "psico_comunidade";

export interface AtendidosGritoBackfillPreview {
  dryRun: boolean;
  fontes: {
    pec: number;
    inclusao: number;
    psicoComunidade: number;
  };
  cpfsUnicos: number;
  cpfsComMultiplasFontes: number;
  conflitosNome: number;
  conflitosMatricula: number;
  semCpfValido: {
    inclusao: number;
    psicoComunidade: number;
  };
  inseridos: number;
  programasInseridos: number;
  amostraConflitosNome: Array<{ cpf: string; nomes: string[] }>;
  amostraConflitosMatricula: Array<{ cpf: string; matriculas: string[] }>;
}

interface NormalizedSource {
  fonte: AtendidosGritoFonte;
  cpf: string;
  updatedAt: Date;
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
  programaStatus: string;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  legadoTipo: string;
  legadoId: string;
  dataIngresso: Date | null;
  dataEgresso: Date | null;
  dadosComplementares: Record<string, unknown>;
}

function mapStatusGlobal(raw: string | null | undefined): string {
  const s = String(raw || "").toLowerCase().trim();
  if (["inativo", "inativa", "cancelado", "cancelada"].includes(s)) return "inativo";
  return "ativo";
}

function mapProgramaStatus(raw: string | null | undefined): string {
  return mapStatusGlobal(raw);
}

function toDateOnly(val: unknown): string | null {
  if (!val) return null;
  const s = String(val).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function toDate(val: unknown): Date | null {
  if (!val) return null;
  const d = new Date(String(val));
  return Number.isNaN(d.getTime()) ? null : d;
}

function pickString(...vals: unknown[]): string | null {
  for (const v of vals) {
    const s = v == null ? "" : String(v).trim();
    if (s) return s;
  }
  return null;
}

async function loadPecSources(pool: Pool): Promise<NormalizedSource[]> {
  const { rows } = await pool.query<Record<string, unknown>>(`
    SELECT *
    FROM aluno
    WHERE REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') ~ '^[0-9]{11}$'
  `);

  return rows.map((r) => {
    const cpf = normalizeCpfDigits(r.cpf);
    const updatedAt = toDate(r.updated_at) || toDate(r.created_at) || new Date(0);
    const { cpf: _c, nome_completo, updated_at, created_at, ...rest } = r as Record<string, unknown>;
    return {
      fonte: "pec" as const,
      cpf,
      updatedAt,
      nomeCompleto: pickString(nome_completo) || "Sem nome",
      dataNascimento: toDateOnly(r.data_nascimento),
      genero: pickString(r.genero),
      escolaridade: pickString(r.escolaridade),
      instituicaoEnsino: pickString(r.instituicao_ensino),
      telefone: pickString(r.telefone),
      email: pickString(r.email),
      whatsapp: pickString(r.whatsapp),
      bolsaFamilia: pickString(r.bolsa_familia),
      fotoPerfil: pickString(r.foto_perfil),
      numeroMatricula: pickString(r.numero_matricula),
      statusGlobal: mapStatusGlobal(r.situacao_atendimento as string),
      programaStatus: mapProgramaStatus(r.situacao_atendimento as string),
      cep: pickString(r.cep),
      logradouro: pickString(r.logradouro),
      numero: pickString(r.numero),
      complemento: pickString(r.complemento),
      bairro: pickString(r.bairro),
      cidade: pickString(r.cidade),
      estado: pickString(r.estado),
      legadoTipo: "aluno",
      legadoId: cpf,
      dataIngresso: toDate(r.data_entrada) || toDate(r.created_at),
      dataEgresso: toDate(r.data_inativacao),
      dadosComplementares: rest,
    };
  });
}

async function loadInclusaoSources(pool: Pool): Promise<{
  valid: NormalizedSource[];
  semCpf: number;
}> {
  const { rows } = await pool.query<Record<string, unknown>>(`SELECT * FROM participantes_inclusao`);
  let semCpf = 0;
  const valid: NormalizedSource[] = [];

  for (const r of rows) {
    const cpf = normalizeCpfDigits(r.cpf);
    if (cpf.length !== 11) {
      semCpf++;
      continue;
    }
    const updatedAt = toDate(r.updated_at) || toDate(r.created_at) || new Date(0);
    const {
      id,
      cpf: _c,
      nome,
      updated_at,
      created_at,
      ...rest
    } = r as Record<string, unknown>;

    valid.push({
      fonte: "inclusao",
      cpf,
      updatedAt,
      nomeCompleto: pickString(nome) || "Sem nome",
      dataNascimento: toDateOnly(r.data_nascimento),
      genero: pickString(r.genero),
      escolaridade: pickString(r.escolaridade),
      instituicaoEnsino: pickString(r.instituicao_ensino),
      telefone: pickString(r.telefone),
      email: pickString(r.email),
      whatsapp: r.telefone_whatsapp ? pickString(r.telefone) : pickString(r.telefone),
      bolsaFamilia: pickString(r.bolsa_familia),
      fotoPerfil: pickString(r.foto_url),
      numeroMatricula: pickString(r.codigo_matricula),
      statusGlobal: mapStatusGlobal(r.status as string),
      programaStatus: mapProgramaStatus(r.status as string),
      cep: pickString(r.cep),
      logradouro: pickString(r.logradouro),
      numero: pickString(r.numero),
      complemento: pickString(r.complemento),
      bairro: pickString(r.bairro),
      cidade: pickString(r.cidade),
      estado: pickString(r.estado),
      legadoTipo: "participantes_inclusao",
      legadoId: String(id),
      dataIngresso: toDate(r.data_ingresso) || toDate(r.data_entrada) || toDate(r.created_at),
      dataEgresso: toDate(r.data_egresso),
      dadosComplementares: rest,
    });
  }

  return { valid, semCpf };
}

async function loadPsicoComunidadeSources(pool: Pool): Promise<{
  valid: NormalizedSource[];
  semCpf: number;
}> {
  const { rows } = await pool.query<Record<string, unknown>>(`SELECT * FROM psico_atendidos_comunidade`);
  let semCpf = 0;
  const valid: NormalizedSource[] = [];

  for (const r of rows) {
    const cpf = normalizeCpfDigits(r.cpf);
    if (cpf.length !== 11) {
      semCpf++;
      continue;
    }
    const updatedAt = toDate(r.updated_at) || toDate(r.created_at) || new Date(0);
    const { id, cpf: _c, nome, updated_at, created_at, ...rest } = r as Record<string, unknown>;

    valid.push({
      fonte: "psico_comunidade",
      cpf,
      updatedAt,
      nomeCompleto: pickString(nome) || "Sem nome",
      dataNascimento: toDateOnly(r.data_nascimento),
      genero: null,
      escolaridade: null,
      instituicaoEnsino: null,
      telefone: pickString(r.telefone),
      email: null,
      whatsapp: null,
      bolsaFamilia: null,
      fotoPerfil: null,
      numeroMatricula: null,
      statusGlobal: "ativo",
      programaStatus: "ativo",
      cep: null,
      logradouro: pickString(r.endereco),
      numero: null,
      complemento: null,
      bairro: null,
      cidade: null,
      estado: null,
      legadoTipo: "psico_atendidos_comunidade",
      legadoId: String(id),
      dataIngresso: toDate(r.created_at),
      dataEgresso: null,
      dadosComplementares: rest,
    });
  }

  return { valid, semCpf };
}

function groupByCpf(sources: NormalizedSource[]): Map<string, NormalizedSource[]> {
  const map = new Map<string, NormalizedSource[]>();
  for (const s of sources) {
    const list = map.get(s.cpf) || [];
    list.push(s);
    map.set(s.cpf, list);
  }
  return map;
}

export async function runAtendidosGritoBackfill(
  pool: Pool,
  options: { dryRun?: boolean } = {}
): Promise<AtendidosGritoBackfillPreview> {
  const dryRun = options.dryRun !== false;

  const [pecSources, inclusaoLoad, psicoLoad] = await Promise.all([
    loadPecSources(pool),
    loadInclusaoSources(pool),
    loadPsicoComunidadeSources(pool),
  ]);

  const allSources = [...pecSources, ...inclusaoLoad.valid, ...psicoLoad.valid];
  const byCpf = groupByCpf(allSources);

  const amostraConflitosNome: Array<{ cpf: string; nomes: string[] }> = [];
  const amostraConflitosMatricula: Array<{ cpf: string; matriculas: string[] }> = [];
  let conflitosNome = 0;
  let conflitosMatricula = 0;
  let cpfsComMultiplasFontes = 0;

  let inseridos = 0;
  let programasInseridos = 0;

  const client = dryRun ? null : await pool.connect();

  try {
    if (client) await client.query("BEGIN");

    for (const [cpf, sources] of byCpf.entries()) {
      const fontesSet = new Set(sources.map((s) => s.fonte));
      if (fontesSet.size > 1) cpfsComMultiplasFontes++;

      const nomes = [...new Set(sources.map((s) => s.nomeCompleto.trim().toLowerCase()))];
      if (nomes.length > 1) {
        conflitosNome++;
        if (amostraConflitosNome.length < 10) {
          amostraConflitosNome.push({ cpf, nomes: sources.map((s) => s.nomeCompleto) });
        }
      }

      const matriculas = [
        ...new Set(sources.map((s) => s.numeroMatricula).filter(Boolean) as string[]),
      ];
      if (matriculas.length > 1) {
        conflitosMatricula++;
        if (amostraConflitosMatricula.length < 10) {
          amostraConflitosMatricula.push({ cpf, matriculas });
        }
      }

      const winner = [...sources].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
      const numeroMatricula =
        winner.numeroMatricula ||
        sources.map((s) => s.numeroMatricula).find(Boolean) ||
        null;

      const statusGlobal =
        sources.some((s) => s.statusGlobal === "ativo") ? "ativo" : winner.statusGlobal;

      let matriculaFinal = numeroMatricula;
      if (!dryRun && client && matriculaFinal) {
        const matriculaCheck = await client.query<{ cpf: string }>(
          `SELECT cpf FROM atendidos_grito
           WHERE numero_matricula = $1 AND cpf <> $2
           LIMIT 1`,
          [matriculaFinal, cpf]
        );
        if (matriculaCheck.rows.length > 0) {
          matriculaFinal = null;
        }
      }

      if (!dryRun && client) {
        await client.query(
          `INSERT INTO atendidos_grito (
            cpf, cpf_provisorio, nome_completo, data_nascimento, genero, escolaridade,
            instituicao_ensino, telefone, email, whatsapp, bolsa_familia, foto_perfil,
            numero_matricula, status, cep, logradouro, numero, complemento, bairro, cidade, estado,
            dados_complementares, fonte_ultima_atualizacao, legado_atualizado_em, updated_at
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,NOW()
          )
          ON CONFLICT (cpf) DO UPDATE SET
            cpf_provisorio = EXCLUDED.cpf_provisorio,
            nome_completo = EXCLUDED.nome_completo,
            data_nascimento = EXCLUDED.data_nascimento,
            genero = EXCLUDED.genero,
            escolaridade = EXCLUDED.escolaridade,
            instituicao_ensino = EXCLUDED.instituicao_ensino,
            telefone = EXCLUDED.telefone,
            email = EXCLUDED.email,
            whatsapp = EXCLUDED.whatsapp,
            bolsa_familia = EXCLUDED.bolsa_familia,
            foto_perfil = EXCLUDED.foto_perfil,
            numero_matricula = EXCLUDED.numero_matricula,
            status = EXCLUDED.status,
            cep = EXCLUDED.cep,
            logradouro = EXCLUDED.logradouro,
            numero = EXCLUDED.numero,
            complemento = EXCLUDED.complemento,
            bairro = EXCLUDED.bairro,
            cidade = EXCLUDED.cidade,
            estado = EXCLUDED.estado,
            dados_complementares = EXCLUDED.dados_complementares,
            fonte_ultima_atualizacao = EXCLUDED.fonte_ultima_atualizacao,
            legado_atualizado_em = EXCLUDED.legado_atualizado_em,
            updated_at = NOW()`,
          [
            cpf,
            isCpfProvisorio(cpf),
            winner.nomeCompleto,
            winner.dataNascimento,
            winner.genero,
            winner.escolaridade,
            winner.instituicaoEnsino,
            winner.telefone,
            winner.email,
            winner.whatsapp,
            winner.bolsaFamilia,
            winner.fotoPerfil,
            matriculaFinal,
            statusGlobal,
            winner.cep,
            winner.logradouro,
            winner.numero,
            winner.complemento,
            winner.bairro,
            winner.cidade,
            winner.estado,
            JSON.stringify({
              vencedor: winner.fonte,
              fontes: [...fontesSet],
              legado: sources.map((s) => ({
                fonte: s.fonte,
                legadoTipo: s.legadoTipo,
                legadoId: s.legadoId,
                updatedAt: s.updatedAt.toISOString(),
              })),
              snapshotVencedor: winner.dadosComplementares,
            }),
            winner.fonte,
            winner.updatedAt,
          ]
        );
        inseridos++;
      } else {
        inseridos++;
      }

      for (const src of [...new Map(sources.map((s) => [s.fonte, s])).values()].sort(
        (a, b) => a.fonte.localeCompare(b.fonte)
      )) {
        if (!dryRun && client) {
          await client.query(
            `INSERT INTO atendidos_grito_programa (
              cpf, programa, status, legado_tipo, legado_id, data_ingresso, data_egresso, updated_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
            ON CONFLICT (cpf, programa) DO UPDATE SET
              status = EXCLUDED.status,
              legado_tipo = EXCLUDED.legado_tipo,
              legado_id = EXCLUDED.legado_id,
              data_ingresso = COALESCE(EXCLUDED.data_ingresso, atendidos_grito_programa.data_ingresso),
              data_egresso = COALESCE(EXCLUDED.data_egresso, atendidos_grito_programa.data_egresso),
              updated_at = NOW()`,
            [
              cpf,
              src.fonte,
              src.programaStatus,
              src.legadoTipo,
              src.legadoId,
              src.dataIngresso,
              src.dataEgresso,
            ]
          );
        }
        programasInseridos++;
      }
    }

    if (client) await client.query("COMMIT");
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    throw error;
  } finally {
    client?.release();
  }

  return {
    dryRun,
    fontes: {
      pec: pecSources.length,
      inclusao: inclusaoLoad.valid.length,
      psicoComunidade: psicoLoad.valid.length,
    },
    cpfsUnicos: byCpf.size,
    cpfsComMultiplasFontes,
    conflitosNome,
    conflitosMatricula,
    semCpfValido: {
      inclusao: inclusaoLoad.semCpf,
      psicoComunidade: psicoLoad.semCpf,
    },
    inseridos,
    programasInseridos,
    amostraConflitosNome,
    amostraConflitosMatricula,
  };
}

export async function queryAtendidosGritoStats(pool: Pool) {
  const { rows } = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM atendidos_grito) AS total_atendidos,
      (SELECT COUNT(*)::int FROM atendidos_grito WHERE status = 'ativo') AS ativos,
      (SELECT COUNT(*)::int FROM atendidos_grito WHERE cpf_provisorio = TRUE) AS cpf_provisorio,
      (SELECT COUNT(*)::int FROM atendidos_grito_programa) AS total_programas,
      (SELECT COUNT(*)::int FROM atendidos_grito_programa WHERE programa = 'pec') AS programas_pec,
      (SELECT COUNT(*)::int FROM atendidos_grito_programa WHERE programa = 'inclusao') AS programas_inclusao,
      (SELECT COUNT(*)::int FROM atendidos_grito_programa WHERE programa = 'psico_comunidade') AS programas_psico
  `);
  return rows[0];
}
