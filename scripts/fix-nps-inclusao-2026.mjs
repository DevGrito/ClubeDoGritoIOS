/**
 * Corrige NPS Inclusão 2026 em nps_scores_mensais.
 * Anual = média aritmética dos meses com dado.
 * Uso: node scripts/fix-nps-inclusao-2026.mjs [--dry-run]
 */
import pg from "pg";
import { readFileSync, existsSync } from "fs";

const dryRun = process.argv.includes("--dry-run");
const envFile = ".env.local-test";

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
});

const MESES = [
  { mes: 3, nps: 97 },
  { mes: 4, nps: 98 },
  { mes: 5, nps: 90 },
  { mes: 6, nps: 100 },
];

const npsAnual = Math.round(MESES.reduce((s, m) => s + m.nps, 0) / MESES.length);

console.log(dryRun ? "=== DRY RUN ===" : "=== Aplicando correção ===");
for (const { mes, nps } of MESES) console.log(`Mês ${mes}: NPS ${nps}`);
console.log(`\nAnual (média): (${MESES.map((m) => m.nps).join(" + ")}) / ${MESES.length} = ${npsAnual}`);

if (dryRun) {
  await pool.end();
  process.exit(0);
}

const client = await pool.connect();
try {
  await client.query("BEGIN");

  for (const { mes, nps } of MESES) {
    await client.query(
      `INSERT INTO nps_scores_mensais
         (programa, ano, mes, nps_score, total_respostas, promotores, neutros, detratores, calculado_em)
       VALUES ('inclusao', 2026, $1, $2, 0, 0, 0, 0, NOW())
       ON CONFLICT (programa, ano, mes) DO UPDATE SET
         nps_score = EXCLUDED.nps_score,
         calculado_em = NOW()`,
      [mes, nps],
    );
  }

  const upd = await client.query(
    `UPDATE nps_scores_mensais SET nps_score=$1, total_respostas=$2, calculado_em=NOW()
     WHERE programa='inclusao' AND ano=2026 AND mes IS NULL`,
    [npsAnual, MESES.length],
  );
  if (upd.rowCount === 0) {
    await client.query(
      `INSERT INTO nps_scores_mensais
         (programa, ano, mes, nps_score, total_respostas, promotores, neutros, detratores, calculado_em)
       VALUES ('inclusao', 2026, NULL, $1, $2, 0, 0, 0, NOW())`,
      [npsAnual, MESES.length],
    );
  }

  await client.query("COMMIT");
  console.log("\n✅ Banco atualizado.");

  const check = await pool.query(
    `SELECT mes, nps_score FROM nps_scores_mensais
     WHERE programa='inclusao' AND ano=2026 ORDER BY mes NULLS FIRST`,
  );
  console.table(check.rows);
} catch (e) {
  await client.query("ROLLBACK");
  console.error("❌ Erro:", e.message);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
