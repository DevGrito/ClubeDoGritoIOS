/**
 * Remove a regra push cadastro_aluno_pendente.
 * Uso: node scripts/delete-push-rule-cadastro-aluno-pendente.mjs [--env .env.local-test]
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
});

const gatilho = "cadastro_aluno_pendente";
const found = await pool.query(`SELECT id, nome FROM push_rules WHERE gatilho = $1`, [gatilho]);
if (!found.rows.length) {
  console.log(`Nenhuma regra com gatilho "${gatilho}" encontrada.`);
  await pool.end();
  process.exit(0);
}

for (const row of found.rows) {
  await pool.query(`DELETE FROM push_rules WHERE id = $1`, [row.id]);
  console.log(`Removida regra id=${row.id} nome="${row.nome}"`);
}

await pool.end();
console.log("Concluído.");
