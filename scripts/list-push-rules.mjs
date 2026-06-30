import pg from "pg";
import { readFileSync, existsSync, writeFileSync } from "fs";

if (existsSync(".env.local-test")) {
  for (const line of readFileSync(".env.local-test", "utf8").split("\n")) {
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
  SELECT id, nome, gatilho, titulo, mensagem, destino_tela, destino_roles, url,
         cooldown_minutos, modulo_alvo, prioridade, tipo
  FROM push_rules
  WHERE ativo = true AND (send_push IS NULL OR send_push = true)
  ORDER BY gatilho, nome
`);
writeFileSync("scripts/_push-rules-active.json", JSON.stringify(rows, null, 2), "utf8");
console.error(`Total: ${rows.length} regras ativas → scripts/_push-rules-active.json`);
await pool.end();
