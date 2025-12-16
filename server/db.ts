import pkg from "pg";
const {Pool} = pkg;
export {Pool};
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

// EXIGIR Digital Ocean - sem fallback!
// USAR BANCO CONFIGURADO VIA DB_* (container Docker)
if (
  !process.env.DB_HOST ||
  !process.env.DB_USER ||
  !process.env.DB_PASSWORD ||
  !process.env.DB_NAME ||
  !process.env.DB_PORT
) {
  throw new Error("❌ ERRO CRÍTICO: Variáveis DB_* não configuradas corretamente!");
}

const host = process.env.DB_HOST!;
const user = process.env.DB_USER!;
const password = process.env.DB_PASSWORD!;
const database = process.env.DB_NAME!;
const port = process.env.DB_PORT || "5432";

console.log(`🔌 CONECTANDO AO BANCO PRIMARY: Digital Ocean PostgreSQL (${host}:${port}/${database})`);

const poolConfig = {
  host,
  port: parseInt(port),
  user,
  password,
  database,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  options: '-c search_path=public',
};

export const pool = new Pool(poolConfig);

// Garantir que toda conexão use o schema public
pool.on('connect', async (client) => {
  try {
    await client.query('SET search_path TO public');
    console.log('✅ search_path definido para public');
  } catch (err) {
    console.error('❌ Erro ao definir search_path:', err);
  }
});

pool.on("error", (err) => {
  console.error("❌ Database pool error:", err);
  process.exit(1); // Falhar rápido se houver erro
});

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT inet_server_addr() as server_ip, current_database() as db_name");
    client.release();
    console.log(`✅ Digital Ocean PostgreSQL conectado: ${result.rows[0].db_name}`);
    return true;
  } catch (error) {
    console.error("❌ FALHA CRÍTICA: Não foi possível conectar ao Digital Ocean PostgreSQL:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    throw new Error("❌ Sistema DEVE usar Digital Ocean. Conexão falhou: " + msg);
  }
}

export const db = drizzle(pool, { 
  schema,
  logger: {
    logQuery(query, params) {
      // console.log('🔍 [DRIZZLE SQL]:', query);
      // console.log('🔍 [DRIZZLE PARAMS]:', params);
    }
  }
});
