/**
 * E2E push (fluxo admin/dev) — API + banco
 * Uso: dotenv -e .env.local-test -- node scripts/e2e-push-admin.mjs [usuario] [senha]
 */
import pg from "pg";
import { readFileSync, existsSync } from "fs";

const BASE = process.env.E2E_BASE_URL || "http://localhost:4000";
const { Pool } = pg;

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i);
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnvFile(".env.local-test");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5433),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: false,
});

const report = {
  ok: [],
  fail: [],
  security: [],
  logs: [],
};

function pass(msg) {
  report.ok.push(msg);
  console.log(`✅ ${msg}`);
}
function fail(msg, detail) {
  const line = detail ? `${msg}: ${detail}` : msg;
  report.fail.push(line);
  console.log(`❌ ${line}`);
}

function fakeFcmToken(suffix = "e2e") {
  const base = `e2e_${suffix}_${Date.now()}_`;
  return (base + "A".repeat(Math.max(0, 140 - base.length))).slice(0, 180);
}

class CookieJar {
  constructor() {
    this.map = new Map();
  }
  ingest(res) {
    const raw = res.headers.getSetCookie?.() || [];
    for (const c of raw) {
      const part = c.split(";")[0];
      const eq = part.indexOf("=");
      if (eq > 0) this.map.set(part.slice(0, eq), part.slice(eq + 1));
    }
    const single = res.headers.get("set-cookie");
    if (single && !raw.length) {
      for (const c of single.split(/,(?=\s*\w+=)/)) {
        const part = c.split(";")[0];
        const eq = part.indexOf("=");
        if (eq > 0) this.map.set(part.slice(0, eq).trim(), part.slice(eq + 1).trim());
      }
    }
  }
  header() {
    if (!this.map.size) return "";
    return Array.from(this.map.entries()).map(([k, v]) => `${k}=${v}`).join("; ");
  }
}

async function fetchJson(path, { method = "GET", body, jar } = {}) {
  const headers = { "Content-Type": "application/json" };
  const cookie = jar?.header();
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  jar?.ingest(res);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text.slice(0, 200) };
  }
  return { res, data };
}

async function findDevCredentials(cliUser, cliPass) {
  if (cliUser && cliPass) return { usuario: cliUser, senha: cliPass };
  const r = await pool.query(
    `SELECT usuario, senha, tipo, id, nome FROM developers WHERE ativo IS NOT FALSE ORDER BY id LIMIT 10`
  );
  const marketing = r.rows.find((x) => x.tipo === "marketing");
  const admin = r.rows.find((x) => x.tipo === "admin");
  const any = marketing || admin || r.rows[0];
  if (!any) throw new Error("Nenhum developer ativo no banco");
  return { usuario: any.usuario, senha: String(any.senha), devId: any.id, nome: any.nome, tipo: any.tipo };
}

async function main() {
  const cliUser = process.argv[2];
  const cliPass = process.argv[3];

  console.log(`\n=== E2E Push Admin — ${BASE} ===\n`);

  // ── Segurança sem sessão ──
  for (const [method, path] of [
    ["GET", "/api/push/tokens/count"],
    ["POST", "/api/push/send"],
    ["POST", "/api/push/send-to-all-donors"],
    ["POST", "/api/push/test"],
    ["POST", "/api/push/register-token"],
  ]) {
    const { res } = await fetchJson(path, {
      method,
      body:
        method === "POST"
          ? { token: fakeFcmToken(), userKey: "1", userType: "dev", title: "t", body: "b" }
          : undefined,
    });
    if (res.status === 401 || res.status === 403) {
      report.security.push(`${method} ${path} → ${res.status}`);
    } else {
      fail(`Segurança ${method} ${path}`, `esperado 401/403, obteve ${res.status}`);
    }
  }
  pass(`Rotas sensíveis bloqueadas sem sessão (${report.security.length} checks)`);

  // ── Login dev ──
  const creds = await findDevCredentials(cliUser, cliPass);
  const jar = new CookieJar();
  const login = await fetchJson("/api/dev/login", {
    method: "POST",
    body: { usuario: creds.usuario, senha: creds.senha },
    jar,
  });
  if (!login.res.ok) {
    fail("Login dev", `${login.res.status} ${login.data?.error || ""}`);
    console.log("\nDica: dotenv -e .env.local-test -- node scripts/e2e-push-admin.mjs <usuario> <senha>\n");
    await pool.end();
    process.exit(1);
  }
  const devId = login.data?.developer?.id ?? creds.devId;
  const devPapel =
    login.data?.developer?.tipo === "marketing"
      ? "dev-marketing"
      : login.data?.developer?.tipo === "admin"
        ? "dev-admin"
        : "dev";
  pass(`Login dev (${creds.usuario}, id=${devId}, papel=${devPapel})`);

  const session = await fetchJson("/api/auth/session", { jar });
  if (!session.res.ok) fail("Sessão após login", String(session.res.status));
  else pass(`Sessão ativa: id=${session.data?.id} papel=${session.data?.papel || session.data?.role}`);

  const userKey = String(devId);
  const token = fakeFcmToken("admin");

  // ── Registrar token ──
  const reg = await fetchJson("/api/push/register-token", {
    method: "POST",
    jar,
    body: { token, userKey, userType: devPapel, platform: "web", nome: creds.nome || "E2E Dev" },
  });
  if (!reg.res.ok) fail("register-token", `${reg.res.status} ${reg.data?.error}`);
  else pass("register-token aceito (201/200)");

  const dbRow = await pool.query(
    `SELECT user_key, user_type, platform, ativo, LEFT(token, 20) AS token_prefix, LENGTH(token) AS token_len
     FROM fcm_tokens WHERE token = $1`,
    [token]
  );
  if (!dbRow.rows.length) fail("Token no banco", "não encontrado");
  else {
    const row = dbRow.rows[0];
    if (row.user_key === userKey && row.ativo) {
      pass(`Token salvo: user_key=${row.user_key} user_type=${row.user_type} prefix=${row.token_prefix}...`);
    } else {
      fail("Token no banco", JSON.stringify(row));
    }
  }

  // userKey errado → 403
  const regBad = await fetchJson("/api/push/register-token", {
    method: "POST",
    jar,
    body: { token: fakeFcmToken("bad"), userKey: "999999", userType: devPapel, platform: "web" },
  });
  if (regBad.res.status === 403) pass("register-token rejeita userKey de outro usuário (403)");
  else fail("register-token ownership", `status ${regBad.res.status}`);

  // ── Contagem ──
  const count = await fetchJson("/api/push/tokens/count", { jar });
  if (!count.res.ok) fail("tokens/count", String(count.res.status));
  else {
    const total = count.data?.total ?? 0;
    if (total >= 1) pass(`tokens/count total=${total}`);
    else fail("tokens/count", "total=0 após registro");
  }

  // ── Teste (usuário logado) ──
  const test = await fetchJson("/api/push/test", {
    method: "POST",
    jar,
    body: { title: "E2E Teste Push", body: "Mensagem de teste automatizado" },
  });
  if (!test.res.ok) {
    fail("push/test", `${test.res.status} ${test.data?.error}`);
  } else {
    const t = test.data;
    pass(
      `push/test: firebaseAccepted=${t.firebaseAccepted} enviados=${t.enviados}/${t.totalTokens} falhas=${t.falhas}`
    );
    if (!t.firebaseAccepted) {
      report.logs.push("FCM rejeitou token sintético (esperado sem navegador real)");
    }
  }

  // ── send-to-all-donors ──
  const donors = await fetchJson("/api/push/send-to-all-donors", {
    method: "POST",
    jar,
    body: { title: "E2E Doadores", body: "Teste massa doadores" },
  });
  if (!donors.res.ok) fail("send-to-all-donors", `${donors.res.status} ${donors.data?.error}`);
  else {
    const d = donors.data;
    pass(
      `send-to-all-donors: totalTokens=${d.totalTokens} enviados=${d.enviados} falhas=${d.falhas} tokensInvalidosRemovidos=${d.tokensInvalidosRemovidos ?? 0}`
    );
    report.donorsSummary = {
      totalTokens: d.totalTokens,
      enviados: d.enviados,
      falhas: d.falhas,
      tokensInvalidosRemovidos: d.tokensInvalidosRemovidos ?? 0,
    };
  }

  // title/body vazios
  const badDonors = await fetchJson("/api/push/send-to-all-donors", {
    method: "POST",
    jar,
    body: { title: "", body: "" },
  });
  if (badDonors.res.status === 400) pass("send-to-all-donors valida title/body vazios (400)");
  else fail("validação title/body", `status ${badDonors.res.status}`);

  // Limpar token e2e
  await pool.query("DELETE FROM fcm_tokens WHERE token = $1", [token]).catch(() => {});

  console.log("\n=== RESUMO ===");
  console.log("OK:", report.ok.length);
  console.log("Falhas:", report.fail.length);
  if (report.donorsSummary) console.log("Doadores:", JSON.stringify(report.donorsSummary, null, 2));

  await pool.end();
  process.exit(report.fail.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
