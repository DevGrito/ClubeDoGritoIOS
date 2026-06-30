import pkg from "pg";
const { Pool, types } = pkg;

// Retorna o tipo date (OID 1082) como string pura (ex: "2026-04-01")
// sem converter para Date UTC — evita o deslocamento de -3h (fuso BR)
types.setTypeParser(1082, (val: string) => val);

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

type DbConfig = {
  source: string;
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: boolean | { rejectUnauthorized: boolean } | undefined;
};

function getDockerConfig(): DbConfig | null {
  if (
    process.env.DB_HOST &&
    process.env.DB_USER &&
    process.env.DB_PASSWORD &&
    process.env.DB_NAME
  ) {
    return {
      source: "DB_* (Docker)",
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    };
  }
  return null;
}

function getDigitalOceanConfig(): DbConfig | null {
  // opcional: DO_DATABASE_URL
  if (process.env.DO_DATABASE_URL) {
    const url = new URL(process.env.DO_DATABASE_URL);
    return {
      source: "Digital Ocean",
      host: url.hostname,
      port: Number(process.env.DO_DB_PORT || url.port || 5432),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ""),
      ssl: process.env.DO_DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    };
  }

  // opcional: DO_DB_*
  if (
    process.env.DO_DB_HOST &&
    process.env.DO_DB_USER &&
    process.env.DO_DB_PASSWORD &&
    process.env.DO_DB_NAME
  ) {
    return {
      source: "Digital Ocean",
      host: process.env.DO_DB_HOST,
      port: Number(process.env.DO_DB_PORT) || 5432,
      user: process.env.DO_DB_USER,
      password: process.env.DO_DB_PASSWORD,
      database: process.env.DO_DB_NAME,
      ssl: process.env.DO_DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    };
  }

  return null;
}

function getNeonConfig(): DbConfig | null {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      source: "Neon",
      host: url.hostname,
      port: Number(url.port || 5432),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ""),
      ssl: { rejectUnauthorized: false },
    };
  }
  return null;
}

const dockerConfig = getDockerConfig();
const doConfig = getDigitalOceanConfig();
const neonConfig = getNeonConfig();

export const activeConfig: DbConfig | null = dockerConfig || doConfig || neonConfig;

if (!activeConfig) {
  throw new Error(
    "❌ ERRO CRÍTICO: Nenhum banco configurado! Configure DB_*, DO_DB_* ou DATABASE_URL."
  );
}

export let dbSource = activeConfig.source;

console.log(
  `🔌 CONECTANDO AO BANCO: ${activeConfig.source} (${activeConfig.host}:${activeConfig.port}/${activeConfig.database})`
);

export let pool = new Pool({
  host: activeConfig.host,
  port: activeConfig.port,
  user: activeConfig.user,
  password: activeConfig.password,
  database: activeConfig.database,
  ssl: activeConfig.ssl,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  // mantém tudo no public
  options: "-c search_path=public",
});

export let db: NodePgDatabase<typeof schema> = drizzle(pool, {
  schema,
  logger: { logQuery() {} },
});

pool.on("connect", async (client) => {
  try {
    await client.query("SET search_path TO public");
  } catch (err) {
    console.error("❌ Erro ao definir search_path:", err);
  }
});

pool.on("error", (err) => {
  console.error("❌ Database pool error:", err);
});

async function tryConnect(config: DbConfig | null): Promise<boolean> {
  if (!config) return false;
  const testPool = new Pool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    ssl: config.ssl,
    connectionTimeoutMillis: 8_000,
    max: 1,
  });
  try {
    const maxRetries = 3;
    for (let i = 1; i <= maxRetries; i++) {
      try {
        console.log(`🔄 [${config.source}] Tentativa ${i}/${maxRetries}...`);
        const client = await testPool.connect();
        const result = await client.query("SELECT current_database() AS db");
        client.release();
        console.log(`✅ ${config.source} conectado: ${result.rows[0]?.db}`);
        return true;
      } catch (err: any) {
        if (i === maxRetries) throw err;
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    return false;
  } catch (err: any) {
    console.error(`❌ ${config.source} falhou: ${err.message}`);
    return false;
  } finally {
    await testPool.end().catch(() => {});
  }
}

export function refreshDrizzle() {
  db = drizzle(pool, { schema, logger: { logQuery() {} } });
}

export async function runAutoMigrations() {
  try {
    console.log("🔄 Verificando migrações pendentes...");

    await pool.query(`
      ALTER TABLE monitor_grupos 
      ADD COLUMN IF NOT EXISTS horario_inicio TEXT,
      ADD COLUMN IF NOT EXISTS horario_fim TEXT,
      ADD COLUMN IF NOT EXISTS dias_semana TEXT[];
    `);

    await pool.query(`
      ALTER TABLE instance_enrollments
      ADD COLUMN IF NOT EXISTS evadido BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS motivo_evasao TEXT,
      ADD COLUMN IF NOT EXISTS data_evasao TIMESTAMP,
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo';
    `);
    await pool.query(`
      UPDATE instance_enrollments SET status = 'ativo' WHERE status IS NULL;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS registros_confidenciais (
        id SERIAL PRIMARY KEY,
        monitor_user_id INTEGER NOT NULL,
        vertente TEXT NOT NULL,
        tipo TEXT NOT NULL,
        titulo TEXT NOT NULL,
        conteudo TEXT NOT NULL,
        participante_nome TEXT,
        participante_id INTEGER,
        data DATE NOT NULL,
        status TEXT DEFAULT 'ativo',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      ALTER TABLE registros_confidenciais
      ADD COLUMN IF NOT EXISTS participante_cpf TEXT,
      ADD COLUMN IF NOT EXISTS participante_origem TEXT,
      ADD COLUMN IF NOT EXISTS participante_data_nascimento TEXT;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS psico_registros_confidenciais (
        id SERIAL PRIMARY KEY,
        criado_por_user_id INTEGER NOT NULL,
        criado_por_role TEXT NOT NULL DEFAULT 'monitor',
        vertente TEXT NOT NULL DEFAULT 'todos',
        tipo TEXT NOT NULL,
        titulo TEXT,
        conteudo TEXT NOT NULL,
        participante_nome TEXT,
        participante_id INTEGER,
        participante_cpf TEXT,
        participante_data_nascimento TEXT,
        data DATE NOT NULL,
        status TEXT DEFAULT 'ativo',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS psico_registros (
        id SERIAL PRIMARY KEY,
        criado_por_user_id INTEGER NOT NULL,
        criado_por_role TEXT NOT NULL DEFAULT 'monitor',
        vertente TEXT NOT NULL DEFAULT 'todos',
        tipo TEXT NOT NULL,
        conteudo TEXT NOT NULL,
        participante_nome TEXT,
        participante_cpf TEXT,
        data DATE NOT NULL,
        status TEXT DEFAULT 'ativo',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      ALTER TABLE chamada
      ADD COLUMN IF NOT EXISTS foto_comprovante TEXT;
    `);

    await pool.query(`
      ALTER TABLE chamada_aluno
      ADD COLUMN IF NOT EXISTS justificativa TEXT;
    `);

    await pool.query(`
      ALTER TABLE presencas_inclusao
      ADD COLUMN IF NOT EXISTS justificativa TEXT,
      ADD COLUMN IF NOT EXISTS foto_comprovante TEXT;
    `);

    await pool.query(`
      ALTER TABLE sessions
      ADD COLUMN IF NOT EXISTS foto_comprovante TEXT;
    `);

    await pool.query(`
      ALTER TABLE atividades_monitor
      ADD COLUMN IF NOT EXISTS contexto TEXT;
    `);

    // Marcar atividades existentes que têm marcadores [TURMA:] como psicossocial
    await pool.query(`
      UPDATE atividades_monitor 
      SET contexto = 'psicossocial' 
      WHERE contexto IS NULL 
      AND observacoes LIKE '%[TURMA:%' 
      AND observacoes LIKE '%[PARTICIPANTES:%';
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS vendas_outlet (
        id SERIAL PRIMARY KEY,
        vendedor_id INTEGER,
        vendedor_nome TEXT NOT NULL,
        data DATE NOT NULL,
        fluxo_pessoas INTEGER NOT NULL DEFAULT 0,
        itens_vendidos INTEGER NOT NULL DEFAULT 0,
        valor_total NUMERIC(10,2) NOT NULL DEFAULT 0,
        observacao TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketing_seguidores_mensal (
        id SERIAL PRIMARY KEY,
        ano INTEGER NOT NULL,
        mes INTEGER NOT NULL,
        seguidores_ganhos INTEGER NOT NULL DEFAULT 0,
        seguidores_perdidos INTEGER NOT NULL DEFAULT 0,
        total_seguidores INTEGER NOT NULL DEFAULT 0,
        materiais_distribuidos INTEGER NOT NULL DEFAULT 0,
        doadores_ativos INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(ano, mes)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketing_metricas_custom (
        id SERIAL PRIMARY KEY,
        ano INTEGER NOT NULL,
        nome TEXT NOT NULL,
        categoria TEXT NOT NULL DEFAULT 'geral',
        unidade TEXT NOT NULL DEFAULT 'numero',
        realizado NUMERIC(14,2) NOT NULL DEFAULT 0,
        meta NUMERIC(14,2) NOT NULL DEFAULT 0,
        ordem INTEGER NOT NULL DEFAULT 0,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(ano, nome)
      );
    `);

    await pool.query(`
      ALTER TABLE marketing_metricas_custom
      ADD COLUMN IF NOT EXISTS categoria TEXT NOT NULL DEFAULT 'geral',
      ADD COLUMN IF NOT EXISTS unidade TEXT NOT NULL DEFAULT 'numero',
      ADD COLUMN IF NOT EXISTS ordem INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS created_by INTEGER,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);

    await pool.query(`
      ALTER TABLE marketing_seguidores_mensal ADD COLUMN IF NOT EXISTS doadores_ativos INTEGER NOT NULL DEFAULT 0;
    `);

    await pool.query(`DELETE FROM marketing_seguidores_mensal WHERE ano = 2025 AND mes = 12`);

    await pool.query(`
      UPDATE marketing_seguidores_mensal SET doadores_ativos = 29, total_seguidores = 11359 WHERE ano = 2026 AND mes = 1
    `);

    const checkData = await pool.query(`SELECT COUNT(*) as cnt FROM marketing_seguidores_mensal WHERE ano = 2026`);
    if (parseInt(checkData.rows[0].cnt) === 0) {
      await pool.query(`
        INSERT INTO marketing_seguidores_mensal (ano, mes, seguidores_ganhos, seguidores_perdidos, total_seguidores, materiais_distribuidos, doadores_ativos)
        VALUES 
          (2026, 1, 223, 171, 11359, 0, 29),
          (2026, 2, 170, 73, 11456, 0, 0)
        ON CONFLICT (ano, mes) DO NOTHING;
      `);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS aluno_responsaveis (
        id SERIAL PRIMARY KEY,
        aluno_cpf TEXT NOT NULL REFERENCES aluno(cpf),
        responsavel_id INTEGER NOT NULL REFERENCES responsaveis(id),
        e_principal BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(aluno_cpf, responsavel_id)
      );
    `);

    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'aluno_responsaveis_aluno_cpf_responsavel_id_key') THEN
          ALTER TABLE aluno_responsaveis ADD CONSTRAINT aluno_responsaveis_aluno_cpf_responsavel_id_key UNIQUE(aluno_cpf, responsavel_id);
        END IF;
      END $$;
    `);

    await pool.query(`
      ALTER TABLE responsaveis
      ADD COLUMN IF NOT EXISTS rg TEXT,
      ADD COLUMN IF NOT EXISTS orgao_emissor_rg TEXT,
      ADD COLUMN IF NOT EXISTS data_nascimento DATE,
      ADD COLUMN IF NOT EXISTS genero TEXT,
      ADD COLUMN IF NOT EXISTS estado_civil TEXT,
      ADD COLUMN IF NOT EXISTS escolaridade TEXT,
      ADD COLUMN IF NOT EXISTS situacao_trabalhista TEXT,
      ADD COLUMN IF NOT EXISTS renda_familiar TEXT,
      ADD COLUMN IF NOT EXISTS cep TEXT,
      ADD COLUMN IF NOT EXISTS logradouro TEXT,
      ADD COLUMN IF NOT EXISTS numero TEXT,
      ADD COLUMN IF NOT EXISTS complemento TEXT,
      ADD COLUMN IF NOT EXISTS bairro TEXT,
      ADD COLUMN IF NOT EXISTS cidade TEXT,
      ADD COLUMN IF NOT EXISTS estado TEXT,
      ADD COLUMN IF NOT EXISTS whatsapp TEXT;
    `);

    await pool.query(`
      ALTER TABLE responsaveis ALTER COLUMN cpf DROP NOT NULL;
    `);

    // Alinha tipos de pergunta NPS aceitos no banco com frontend/backend.
    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'nps_perguntas'
        ) THEN
          IF EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conrelid = 'nps_perguntas'::regclass
              AND conname = 'nps_perguntas_tipo_check'
          ) THEN
            ALTER TABLE nps_perguntas DROP CONSTRAINT nps_perguntas_tipo_check;
          END IF;

          ALTER TABLE nps_perguntas
          ADD CONSTRAINT nps_perguntas_tipo_check
          CHECK (tipo IN ('escala', 'texto', 'multipla_unica', 'multipla_multipla', 'evidencia'));
        END IF;
      END
      $$;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS inclusao_evasoes (
        id SERIAL PRIMARY KEY,
        participante_turma_id INTEGER REFERENCES participantes_turmas(id) ON DELETE SET NULL,
        participante_id INTEGER NOT NULL REFERENCES participantes_inclusao(id) ON DELETE CASCADE,
        turma_id INTEGER NOT NULL REFERENCES turmas_inclusao(id) ON DELETE CASCADE,
        data_desligamento DATE NOT NULL,
        registrado_em TIMESTAMP NOT NULL DEFAULT NOW(),
        revertido_em TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS pec_evasoes (
        id SERIAL PRIMARY KEY,
        enrollment_id INTEGER REFERENCES instance_enrollments(id) ON DELETE SET NULL,
        activity_instance_id INTEGER NOT NULL REFERENCES activity_instances(id) ON DELETE CASCADE,
        student_cpf TEXT NOT NULL,
        data_desligamento DATE NOT NULL,
        registrado_em TIMESTAMP NOT NULL DEFAULT NOW(),
        revertido_em TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_inclusao_evasoes_ativa
        ON inclusao_evasoes (participante_id, turma_id)
        WHERE revertido_em IS NULL;
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_pec_evasoes_ativa
        ON pec_evasoes (activity_instance_id, student_cpf)
        WHERE revertido_em IS NULL;
    `);

    // Migra evasões legadas (Desistência ou status evadido) para inclusao_evasoes
    await pool.query(`
      INSERT INTO inclusao_evasoes (participante_turma_id, participante_id, turma_id, data_desligamento, registrado_em)
      SELECT pt.id, pt.participante_id, pt.turma_id,
        COALESCE(pt.data_desligamento::date, pt.data_inscricao::date, CURRENT_DATE),
        COALESCE(pt.data_desligamento::timestamp, pt.created_at, NOW())
      FROM participantes_turmas pt
      WHERE (
        pt.motivo_desligamento = 'Desistência'
        OR lower(COALESCE(pt.status, '')) = 'evadido'
      )
        AND NOT EXISTS (
          SELECT 1 FROM inclusao_evasoes ev
          WHERE ev.participante_id = pt.participante_id
            AND ev.turma_id = pt.turma_id
            AND ev.revertido_em IS NULL
        );
    `);

    await pool.query(`
      UPDATE participantes_turmas
      SET status = 'evadido', motivo_desligamento = NULL, data_desligamento = NULL
      WHERE motivo_desligamento = 'Desistência'
        OR lower(COALESCE(status, '')) = 'evadido';
    `);

    await pool.query(`
      INSERT INTO pec_evasoes (enrollment_id, activity_instance_id, student_cpf, data_desligamento, registrado_em)
      SELECT ie.id, ie.activity_instance_id, ie.student_cpf,
        COALESCE(ie.data_evasao::date, CURRENT_DATE),
        COALESCE(ie.data_evasao, NOW())
      FROM instance_enrollments ie
      WHERE ie.evadido IS TRUE
        AND COALESCE(ie.motivo_evasao, '') <> 'Transição para Inclusão Produtiva'
        AND NOT EXISTS (
          SELECT 1 FROM pec_evasoes pe
          WHERE pe.enrollment_id = ie.id AND pe.revertido_em IS NULL
        );
    `);

    await pool.query(`
      UPDATE participantes_turmas pt
      SET status = 'reprovado'
      FROM turmas_inclusao t
      WHERE pt.turma_id = t.id
        AND lower(COALESCE(t.status, '')) IN ('concluido', 'concluida', 'finalizado', 'encerrado', 'encerrada')
        AND lower(COALESCE(pt.status, '')) = 'evadido'
        AND COALESCE(pt.motivo_desligamento, '') <> 'Desistência'
        AND NOT EXISTS (
          SELECT 1 FROM inclusao_evasoes ev
          WHERE ev.participante_id = pt.participante_id
            AND ev.turma_id = pt.turma_id
            AND ev.revertido_em IS NULL
        );
    `);

    console.log("✅ Migrações automáticas concluídas");

    const { rows: enumRows } = await pool.query<{ enumlabel: string }>(`
      SELECT e.enumlabel FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'coord_setor'
    `);
    const coordSetores = new Set(enumRows.map((r) => r.enumlabel));
    for (const value of ["negocios_sociais", "almoxarifado"]) {
      if (!coordSetores.has(value)) {
        await pool.query(`ALTER TYPE coord_setor ADD VALUE '${value}'`);
      }
    }

    await pool.query(`
      UPDATE coordenadores
      SET email = 'almoxarifado@institutoogrito.org'
      WHERE lower(email) = 'almoxarifado@institutoogrito.com.br';
    `);

    await pool.query(`
      DELETE FROM coordenadores d
      WHERE lower(d.email) = 'almoxarifado@institutoogrito.org'
        AND d.id > (
          SELECT min(c.id) FROM coordenadores c
          WHERE lower(c.email) = 'almoxarifado@institutoogrito.org'
        );
    `);

    await pool.query(`
      INSERT INTO coordenadores (nome, email, password_hash, setor, redirect_path, ativo, primeiro_acesso)
      SELECT v.nome, v.email, v.password_hash, v.setor::coord_setor, v.redirect_path, v.ativo, v.primeiro_acesso
      FROM (VALUES
        (
          'Almoxarifado',
          'almoxarifado@institutoogrito.org',
          '$2a$10$M7ziitztb3wRuNVg4WwO0ulDBmo.yeyzHBYgKIBQXZJdXWkw1K5KC',
          'almoxarifado',
          '/coordenador/almoxarifado',
          true,
          false
        ),
        (
          'Negócios Sociais',
          'negocios@institutoogrito.com.br',
          '$2a$10$bBmMrIOXlQwk/SPSNzF4T.lZ2cCQ3PZcMwrbMJk0xIKjA/10kZCny',
          'negocios_sociais',
          '/coordenador/negocios-sociais',
          true,
          false
        )
      ) AS v(nome, email, password_hash, setor, redirect_path, ativo, primeiro_acesso)
      WHERE NOT EXISTS (
        SELECT 1 FROM coordenadores c WHERE lower(c.email) = lower(v.email)
      );
    `);
  } catch (error) {
    console.error(
      "⚠️ Erro nas migrações automáticas (pode ser ignorado se colunas já existem):",
      error instanceof Error ? error.message : error
    );
  }
 
}
 export async function testDatabaseConnection() {
  // tenta conectar no config ativo (DB_* / DO_* / DATABASE_URL)
  const ok = await tryConnect(activeConfig);
  if (!ok) {
    throw new Error(`Falha ao conectar no banco (${activeConfig?.source || "desconhecido"})`);
  }
  return true;
}