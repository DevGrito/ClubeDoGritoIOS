/**
 * Auditoria: placeholders {{x}} nas regras vs variáveis documentadas no código.
 * Uso: node scripts/audit-push-templates.mjs [--env .env.local-test]
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

/** Vars tipicamente enviadas por gatilho (heurística estática — expandir conforme código). */
const GATILHO_VARS_DOC = {
  termos_pendentes: ["nome", "data", "dedupe_key"],
  baixa_frequencia_aluno: ["nome", "nome_aluno", "percentual", "frequencia", "turma"],
  risco_evasao: ["nome", "nome_aluno", "percentual", "frequencia", "turma"],
  aluno_faltas_consecutivas: ["nome", "nome_aluno", "faltas", "turma"],
  lance_recebido: ["valor", "leilao", "titulo", "beneficio"],
  lance_superado: ["valor", "leilao", "titulo", "beneficio"],
  lembrete_checkin: ["nome"],
  foto_aluno_pendente: ["quantidade", "turma", "nome", "nome_aluno", "vertente"],
  aula_aluno_proxima: ["nome", "turma", "data", "horario", "minutos", "vertente"],
  presenca_confirmada_aluno: ["turma", "data", "nome"],
};

const ALIASES = {
  nome: ["nome_aluno"],
  nome_aluno: ["nome"],
  percentual: ["frequencia"],
  frequencia: ["percentual"],
  titulo: ["leilao", "beneficio"],
  leilao: ["titulo", "beneficio"],
  quantidade: ["total", "qtd"],
  total: ["quantidade"],
};

function extractPlaceholders(text) {
  const set = new Set();
  const re = /\{\{([a-zA-Z0-9_]+)\}\}/g;
  let m;
  while ((m = re.exec(text)) !== null) set.add(m[1].toLowerCase());
  return [...set];
}

function canResolve(key, knownVars) {
  const k = key.toLowerCase();
  if (k === "nome") return true;
  if (knownVars.has(k)) return true;
  for (const [canonical, alts] of Object.entries(ALIASES)) {
    if (k === canonical && [...knownVars].some((v) => alts.includes(v) || v === canonical)) return true;
    if (alts.includes(k) && knownVars.has(canonical)) return true;
  }
  return false;
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
  SELECT id, nome, gatilho, titulo, mensagem, ativo, url
  FROM push_rules
  ORDER BY ativo DESC, gatilho
`);

let problemas = 0;
for (const rule of rows) {
  const placeholders = [
    ...new Set([
      ...extractPlaceholders(rule.titulo || ""),
      ...extractPlaceholders(rule.mensagem || ""),
    ]),
  ].filter((p) => p !== "nome");

  if (!placeholders.length) continue;

  const docVars = new Set(
    (GATILHO_VARS_DOC[rule.gatilho] || []).map((v) => v.toLowerCase())
  );
  const missing = placeholders.filter((p) => !canResolve(p, docVars));

  if (missing.length) {
    problemas++;
    console.log(
      `${rule.ativo ? "✅" : "⏸️"} [${rule.gatilho}] id=${rule.id} — faltam no código: ${missing.join(", ")}`
    );
    if (!rule.url) console.log(`   url: (vazia)`);
  }
}

console.error(`\nRegras com placeholders possivelmente não cobertos: ${problemas}/${rows.length}`);
await pool.end();
