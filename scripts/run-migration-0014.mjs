import pg from "pg";
import { readFileSync, existsSync } from "fs";

const envFile = process.argv.includes("--env")
  ? process.argv[process.argv.indexOf("--env") + 1]
  : ".env.local-test";

if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (!process.env[t.slice(0, i)]) process.env[t.slice(0, i)] = v;
  }
}

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5433),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: false,
  connectionTimeoutMillis: 15000,
});

try {
  const sql = readFileSync("migrations/0014_staff_area_consents.sql", "utf8");
  await pool.query(sql);

  const table = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff_area_consents'
    ORDER BY ordinal_position
  `);

  const indexes = await pool.query(`
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'staff_area_consents'
    ORDER BY indexname
  `);

  console.log("Migration 0014 aplicada com sucesso.");
  console.log("Colunas:", table.rows.map((r) => r.column_name).join(", "));
  console.log("Índices:", indexes.rows.map((r) => r.indexname).join(", "));
} catch (e) {
  console.error("Falha:", e.message);
  process.exit(1);
} finally {
  await pool.end();
}
