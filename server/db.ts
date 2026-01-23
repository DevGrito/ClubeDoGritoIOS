import pkg from "pg";
const { Pool } = pkg;

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

// ✅ EXIGIR DB_* (Digital Ocean via Docker / container)
if (
  !process.env.DB_HOST ||
  !process.env.DB_USER ||
  !process.env.DB_PASSWORD ||
  !process.env.DB_NAME ||
  !process.env.DB_PORT
) {
  throw new Error("❌ ERRO CRÍTICO: Variáveis DB_* não configuradas corretamente!");
}

type DbConfig = {
  source: string;
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: any;
};

const activeConfig: DbConfig = {
  source: "DB_*",
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 5432,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
};

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
  options: "-c search_path=public",
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

// ✅ drizzle (exportado)
export let db: NodePgDatabase<typeof schema> = drizzle(pool, {
  schema,
  logger: { logQuery() {} },
});

// ✅ teste de conexão (sem doConfig/neonConfig)
export async function testDatabaseConnection(retries: number = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 [DB_*] Tentativa ${attempt}/${retries}...`);
      const client = await pool.connect();
      const result = await client.query("SELECT current_database() as db_name");
      client.release();

      console.log(`✅ [DB_*] Conectado: ${result.rows[0]?.db_name}`);
      return true;
    } catch (error) {
      console.error(
        `❌ [DB_*] Tentativa ${attempt} falhou:`,
        error instanceof Error ? error.message : error
      );
      if (attempt < retries) await new Promise((r) => setTimeout(r, 2000));
    }
  }

  throw new Error("❌ Falha ao conectar no banco (DB_*) após tentativas.");
}

export function refreshDrizzle() {
  db = drizzle(pool, { schema, logger: true });
}

// Migração automática para adicionar colunas novas
export async function runAutoMigrations() {
  try {
    console.log("🔄 Verificando migrações pendentes...");

    await pool.query(`
      ALTER TABLE monitor_grupos 
      ADD COLUMN IF NOT EXISTS horario_inicio TEXT,
      ADD COLUMN IF NOT EXISTS horario_fim TEXT,
      ADD COLUMN IF NOT EXISTS dias_semana TEXT[];
    `);

    console.log("✅ Migrações automáticas concluídas");
  } catch (error) {
    console.error(
      "⚠️ Erro nas migrações automáticas (pode ser ignorado se colunas já existem):",
      error instanceof Error ? error.message : error
    );
  }
}
