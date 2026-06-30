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

const { rows } = await pool.query(`
  SELECT id, nome, gatilho, titulo, ativo, send_push, destino_tela, modulo_alvo, tipo
  FROM push_rules
  ORDER BY ativo DESC, gatilho, nome
`);
console.log(JSON.stringify(rows, null, 2));
console.error(`Total: ${rows.length} (${rows.filter((r) => r.ativo).length} ativas, ${rows.filter((r) => !r.ativo).length} inativas)`);
await pool.end();
