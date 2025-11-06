import pkg from "pg";
const {Pool} = pkg;
export {Pool};
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

// Tentar Digital Ocean primeiro, fallback para Replit se falhar
const useDO = process.env.DO_DB_HOST && process.env.DO_DB_USER;
let poolConfig: any;

if (useDO) {
  const host = process.env.DO_DB_HOST!;
  const user = process.env.DO_DB_USER!;
  const password = process.env.DO_DB_PASSWORD!;
  const database = process.env.DO_DB_NAME!;
  const port = process.env.DO_DB_PORT || '5432';

  console.log(`🔌 Tentando conectar ao banco: Digital Ocean PostgreSQL (${host}:${port})`);

  poolConfig = {
    host,
    port: parseInt(port),
    user,
    password,
    database,
    ssl: false,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  };
} else {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error("❌ Nenhuma configuração de banco encontrada!");
  }

  console.log(`🔌 Conectando ao banco: Replit PostgreSQL (fallback)`);

  poolConfig = {
    connectionString: databaseUrl,
    ssl: false,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  };
}

export const pool = new Pool(poolConfig);

pool.on("error", (err) => {
  console.error("Database pool error:", err);
});

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    console.log("Database connection successful");
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    throw new Error("Failed to connect to database: " + msg);
  }
}

export const db = drizzle(pool, { 
  schema,
  logger: {
    logQuery(query, params) {
      console.log('🔍 [DRIZZLE SQL]:', query);
      console.log('🔍 [DRIZZLE PARAMS]:', params);
    }
  }
});
