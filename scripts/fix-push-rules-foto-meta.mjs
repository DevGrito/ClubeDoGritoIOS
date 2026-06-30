/**
 * Ajusta regras #77 (foto cadastro) e #40 (meta batida) no banco.
 * Uso: node scripts/fix-push-rules-foto-meta.mjs [--env .env.local-test]
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
    gatilho: "foto_aluno_pendente",
    nome: "Foto de cadastro pendente",
    titulo: "{{quantidade}} foto(s) pendente(s) no cadastro 📷",
    mensagem:
      "Turma {{turma}}: {{quantidade}} aluno(s) sem foto no cadastro. Adicione as fotos no cadastro para o registro de chamada.",
    destino_tela: "professor",
    destino_roles: [
      "coordenador_pec",
      "coordenador_inclusao",
      "monitor_pec",
      "monitor_inclusao",
      "professor_pec",
      "professor_inclusao",
    ],
    modulo_alvo: "pec",
    url: null,
  },
  {
    gatilho: "meta_batida",
    titulo: "Meta atingida! 🎯",
    mensagem:
      "{{nome_kpi}} ({{vertente}}) — meta {{periodo_label}} alcançada em {{data_realizacao}}: {{valor}} de {{meta}} ({{percentual}}%).",
    destino_tela: "todos",
    destino_roles: [
      "doador",
      "leo",
      "conselho",
      "patrocinador",
      "coordenador_pec",
      "coordenador_inclusao",
      "coordenador_psicossocial",
      "coordenador_psico",
      "monitor_pec",
      "monitor_inclusao",
      "monitor_psicossocial",
      "monitor_psico",
      "professor_pec",
      "professor_inclusao",
      "professor_psico",
      "dev",
      "dev-marketing",
      "desenvolvedor",
      "super_admin",
    ],
    modulo_alvo: "gestao_a_vista",
    url: null,
  },
];

for (const u of updates) {
  const sets = [];
  const params = [];
  let i = 1;
  for (const key of [
    "nome",
    "titulo",
    "mensagem",
    "destino_tela",
    "modulo_alvo",
    "url",
  ]) {
    if (u[key] !== undefined) {
      sets.push(`${key} = $${i++}`);
      params.push(u[key]);
    }
  }
  if (u.destino_roles) {
    sets.push(`destino_roles = $${i++}`);
    params.push(u.destino_roles);
  }
  params.push(u.gatilho);
  const r = await pool.query(
    `UPDATE push_rules SET ${sets.join(", ")} WHERE gatilho = $${i} RETURNING id, nome`,
    params
  );
  if (r.rowCount) console.log(`✓ ${u.gatilho} → ids ${r.rows.map((x) => x.id).join(", ")}`);
  else console.log(`✗ não encontrado: ${u.gatilho}`);
}

await pool.end();
console.log("Concluído.");
