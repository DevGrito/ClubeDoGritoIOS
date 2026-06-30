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
  const sql = readFileSync("migrations/0012_push_token_subscription_fields.sql", "utf8");
  await pool.query(sql);

  const cols = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'fcm_tokens'
      AND column_name IN ('user_id','user_agent','push_endpoint','push_p256dh','push_auth')
    ORDER BY 1
  `);

  const backfill = await pool.query(
    `SELECT COUNT(*)::int AS n FROM fcm_tokens WHERE user_id IS NOT NULL`
  );

  console.log("Migration 0012 aplicada com sucesso.");
  console.log("Colunas:", cols.rows.map((r) => r.column_name).join(", "));
  console.log("fcm_tokens com user_id:", backfill.rows[0].n);
} catch (e) {
  console.error("Falha:", e.message);
  process.exit(1);
} finally {
  await pool.end();
}
