/**
 * Fase 2: preenche url nas push_rules (onde vazio) usando o mesmo mapa do servidor.
 * Uso: npx tsx scripts/fix-push-rules-phase2.ts [--env .env.local-test] [--dry-run]
 */
import pg from "pg";
import { readFileSync, existsSync } from "fs";
import { resolvePushClickPath } from "../server/pushClickUrls.ts";

const dryRun = process.argv.includes("--dry-run");
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
  SELECT id, gatilho, nome, url, destino_tela, destino_roles, modulo_alvo, ativo
  FROM push_rules
  ORDER BY id
`);

let updated = 0;
let skipped = 0;

for (const rule of rows) {
  const current = (rule.url || "").trim();
  const resolved = resolvePushClickPath({
    url: rule.url,
    gatilho: rule.gatilho,
    destino_tela: rule.destino_tela,
    destino_roles: rule.destino_roles,
    modulo_alvo: rule.modulo_alvo,
  });

  if (!resolved) {
    skipped++;
    if (!current) {
      console.warn(`[skip] id=${rule.id} gatilho=${rule.gatilho} — sem rota mapeada`);
    }
    continue;
  }

  if (current === resolved) continue;

  if (!dryRun) {
    await pool.query(`UPDATE push_rules SET url = $1 WHERE id = $2`, [resolved, rule.id]);
  }
  updated++;
  console.log(
    `${dryRun ? "[dry-run] " : ""}${rule.gatilho} (id=${rule.id}): ${current || "(vazia)"} → ${resolved}`
  );
}

const stats = await pool.query(`
  SELECT COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE ativo AND url IS NOT NULL AND url != '')::int AS ativas_com_url
  FROM push_rules
`);

console.log(`\nAtualizadas: ${updated} | Sem rota mapeada: ${skipped} | Com URL (ativas): ${stats.rows[0].ativas_com_url}/${stats.rows[0].total}`);
await pool.end();
