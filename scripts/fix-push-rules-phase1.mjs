/**
 * Fase 1: corrige textos/URLs de regras críticas no banco.
 * Uso: node scripts/fix-push-rules-phase1.mjs [--env .env.local-test]
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

const updates = [
  {
    gatilho: "termos_pendentes",
    titulo: "Termos de uso pendentes",
    mensagem: "{{nome}}, aceite os termos de uso atualizados para continuar usando a plataforma.",
    url: "/termos-servicos",
  },
  {
    gatilho: "foto_aluno_pendente",
    url: "/termos-servicos",
  },
  {
    gatilho: "exclusao_chamada_solicitada",
    url: "/admin/solicitacoes-exclusao",
  },
  {
    gatilho: "lembrete_checkin",
    url: "/tdoador",
  },
];

for (const u of updates) {
  const sets = [];
  const params = [];
  let i = 1;
  if (u.titulo) {
    sets.push(`titulo = $${i++}`);
    params.push(u.titulo);
  }
  if (u.mensagem) {
    sets.push(`mensagem = $${i++}`);
    params.push(u.mensagem);
  }
  if (u.url) {
    sets.push(`url = $${i++}`);
    params.push(u.url);
  }
  params.push(u.gatilho);
  const r = await pool.query(
    `UPDATE push_rules SET ${sets.join(", ")} WHERE gatilho = $${i} RETURNING id, nome`,
    params
  );
  if (r.rowCount) console.log(`Atualizado: ${u.gatilho} (${r.rows.map((x) => x.id).join(", ")})`);
  else console.log(`Não encontrado: ${u.gatilho}`);
}

await pool.end();
console.log("Concluído.");
