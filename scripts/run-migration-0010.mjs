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
  const sql = readFileSync("migrations/0010_push_notifications_p0.sql", "utf8");
  await pool.query(sql);

  const cols = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'push_logs' AND column_name IN ('origem','skipped_reason','canal','disparado_por_user_id')
    UNION ALL
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'fcm_tokens' AND column_name IN ('opt_out_at','opt_out_reason','created_at')
    ORDER BY 1
  `);

  const donors = await pool.query(
    `SELECT COUNT(*)::int AS donors_only FROM in_app_notifications WHERE target_audience = 'donors_only'`
  );
  const legacy = await pool.query(
    `SELECT COUNT(*)::int AS donors_legacy FROM in_app_notifications WHERE target_audience = 'donors'`
  );

  console.log("Migration 0010 aplicada com sucesso.");
  console.log("Colunas:", cols.rows.map((r) => r.column_name).join(", "));
  console.log("in_app donors_only:", donors.rows[0].donors_only);
  console.log("in_app donors (legado):", legacy.rows[0].donors_legacy);
} catch (e) {
  console.error("Falha:", e.message);
  process.exit(1);
} finally {
  await pool.end();
}
