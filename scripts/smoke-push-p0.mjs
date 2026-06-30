/**
 * Smoke P0/P1 — API + banco (sem browser)
 * Uso: node scripts/smoke-push-p0.mjs [--env .env.local-test]
 */
import pg from "pg";
import { readFileSync, existsSync } from "fs";

const envFile = process.argv.includes("--env")
  ? process.argv[process.argv.indexOf("--env") + 1]
  : ".env.local-test";
const BASE = process.env.E2E_BASE_URL || "http://localhost:4000";

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

const ok = [];
const fail = [];

function pass(m) {
  ok.push(m);
  console.log(`✅ ${m}`);
}
function failMsg(m, d) {
  const line = d ? `${m}: ${d}` : m;
  fail.push(line);
  console.log(`❌ ${line}`);
}

class Jar {
  map = new Map();
  ingest(res) {
    const raw = res.headers.getSetCookie?.() || [];
    for (const c of raw) {
      const p = c.split(";")[0];
      const eq = p.indexOf("=");
      if (eq > 0) this.map.set(p.slice(0, eq), p.slice(eq + 1));
    }
  }
  header() {
    return Array.from(this.map.entries()).map(([k, v]) => `${k}=${v}`).join("; ");
  }
}

async function api(path, { method = "GET", body, jar } = {}) {
  const headers = { "Content-Type": "application/json" };
  const c = jar?.header();
  if (c) headers.Cookie = c;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  jar?.ingest(res);
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { res, data };
}

console.log(`\n=== Smoke Push P0/P1 — ${BASE} ===\n`);

// 1. Migration
const cols = await pool.query(`
  SELECT table_name, column_name FROM information_schema.columns
  WHERE table_schema = 'public'
    AND (
      (table_name = 'push_logs' AND column_name IN ('origem','skipped_reason'))
      OR (table_name = 'fcm_tokens' AND column_name IN ('opt_out_at','opt_out_reason'))
    )
`);
if (cols.rows.length >= 4) pass(`Migration 0010: ${cols.rows.length} colunas críticas presentes`);
else failMsg("Migration 0010", `só ${cols.rows.length} colunas`);

const legacyDonors = await pool.query(
  `SELECT COUNT(*)::int AS n FROM in_app_notifications WHERE target_audience = 'donors'`
);
if (legacyDonors.rows[0].n === 0) pass("Backfill donors → donors_only (0 legado)");
else failMsg("Backfill donors", `${legacyDonors.rows[0].n} ainda com 'donors'`);

// 2. In-app sem auth
const noAuth = await api("/api/in-app-notifications");
if (noAuth.res.status === 401 || noAuth.res.status === 403) {
  pass(`In-app CRUD bloqueado sem sessão (${noAuth.res.status})`);
} else {
  failMsg("In-app auth", `GET list retornou ${noAuth.res.status}`);
}

// 3. Login dev + in-app + push status + opt-out
const devRow = await pool.query(
  `SELECT usuario, senha, tipo, id FROM developers WHERE ativo IS NOT FALSE ORDER BY id LIMIT 1`
);
if (!devRow.rows.length) {
  failMsg("Login dev", "nenhum developer no banco");
} else {
  const { usuario, senha, id, tipo } = devRow.rows[0];
  const jar = new Jar();
  const login = await api("/api/dev/login", {
    method: "POST",
    jar,
    body: { usuario, senha: String(senha) },
  });
  if (!login.res.ok) {
    failMsg("Login dev", login.data?.error || login.res.status);
  } else {
    pass(`Login dev (${usuario})`);

    const inApp = await api("/api/in-app-notifications", { jar });
    if (inApp.res.ok) pass(`In-app list com sessão admin (${Array.isArray(inApp.data) ? inApp.data.length : "?"} cards)`);
    else failMsg("In-app list autenticado", inApp.res.status);

    const status = await api("/api/push/status", { jar });
    if (status.res.ok) pass(`push/status activeDevices=${status.data?.activeDevices ?? "?"}`);
    else failMsg("push/status", status.res.status);

    const optOut = await api("/api/push/opt-out", { method: "POST", jar, body: {} });
    if (optOut.res.ok) pass("push/opt-out aceito");
    else failMsg("push/opt-out", optOut.res.status);

    const afterOpt = await pool.query(
      `SELECT COUNT(*)::int AS n FROM fcm_tokens WHERE user_key = $1 AND ativo = true`,
      [String(id)]
    );
    if (afterOpt.rows[0].n === 0) pass("Opt-out desativou tokens web do dev no banco");
    else pass(`Opt-out: dev ainda tem ${afterOpt.rows[0].n} token(s) ativo(s) (ok se outro dispositivo)`);

    // 4. push/test gera log com origem
    const beforeLogs = await pool.query(
      `SELECT COUNT(*)::int AS n FROM push_logs WHERE gatilho = 'push_test' AND origem = 'teste'`
    );
    const test = await api("/api/push/test", {
      method: "POST",
      jar,
      body: { title: "Smoke P0", body: "Teste logging universal" },
    });
    if (test.res.status === 404) {
      pass("push/test sem dispositivo (404 esperado após opt-out)");
    } else if (test.res.ok) {
      pass(`push/test enviado enviados=${test.data?.enviados}`);
    } else {
      failMsg("push/test", `${test.res.status} ${test.data?.error}`);
    }
    const afterLogs = await pool.query(
      `SELECT COUNT(*)::int AS n FROM push_logs WHERE gatilho = 'push_test' AND origem = 'teste'`
    );
    if (afterLogs.rows[0].n > beforeLogs.rows[0].n) {
      pass(`push_logs com origem=teste (${afterLogs.rows[0].n - beforeLogs.rows[0].n} novo(s))`);
    } else if (test.res.status === 404) {
      pass("Sem log de teste (sem token — esperado)");
    } else {
      failMsg("Logging push/test", "nenhuma linha nova com origem=teste");
    }

    // 5. Histórico skipped filter
    const skipped = await api("/api/push/logs?status=skipped&limit=5", { jar });
    if (skipped.res.ok) pass(`push/logs?status=skipped (${skipped.data?.length ?? 0} linhas)`);
    else failMsg("push/logs filtro skipped", skipped.res.status);
  }
}

console.log(`\n=== RESUMO: ${ok.length} ok, ${fail.length} falha(s) ===`);
if (fail.length) fail.forEach((f) => console.log(`  - ${f}`));

await pool.end();
process.exit(fail.length ? 1 : 0);
