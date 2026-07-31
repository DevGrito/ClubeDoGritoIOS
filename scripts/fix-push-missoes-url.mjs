/**
 * Atualiza URL de clique das regras de missão para /missoes-semanais.
 * Uso: npx dotenv -e .env.local-test -- node scripts/fix-push-missoes-url.mjs
 */
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
  const before = await pool.query(`
    SELECT id, gatilho, url FROM push_rules
    WHERE gatilho IN ('nova_missao', 'missao_concluida') OR url = '/missoes'
    ORDER BY id
  `);
  console.log("ANTES:", JSON.stringify(before.rows, null, 2));

  const upd = await pool.query(`
    UPDATE push_rules
    SET url = '/missoes-semanais'
    WHERE gatilho IN ('nova_missao', 'missao_concluida')
      AND (url = '/missoes' OR url IS NULL)
    RETURNING id, gatilho, url
  `);
  console.log("ATUALIZADAS:", JSON.stringify(upd.rows, null, 2));

  const after = await pool.query(`
    SELECT id, gatilho, url FROM push_rules
    WHERE gatilho IN ('nova_missao', 'missao_concluida')
    ORDER BY id
  `);
  console.log("DEPOIS:", JSON.stringify(after.rows, null, 2));
} finally {
  await pool.end();
}
