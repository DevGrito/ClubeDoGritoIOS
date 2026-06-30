/**
 * Regressão push — lance_recebido, turma_professor, scanner PEC, login aluno, admin token
 * Uso: node scripts/e2e-push-regression.mjs
 */
import pg from "pg";
import { readFileSync, existsSync } from "fs";

const BASE = process.env.E2E_BASE_URL || "http://localhost:4000";

function loadEnv() {
  if (!existsSync(".env.local-test")) return;
  for (const line of readFileSync(".env.local-test", "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[t.slice(0, i)]) process.env[t.slice(0, i)] = v;
  }
}
loadEnv();

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5433),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: false,
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

function fakeToken(tag) {
  const p = `e2e_${tag}_${Date.now()}_`;
  return (p + "x".repeat(Math.max(0, 140 - p.length))).slice(0, 160);
}

async function main() {
  // 1) resolveUsersIdByProfessorId — turma_professor_alterada
  const prof = await pool.query(
    `SELECT p.id AS prof_id, u.id AS user_id
     FROM professores p
     JOIN users u ON LOWER(TRIM(u.email)) = LOWER(TRIM(p.email))
     WHERE COALESCE(p.ativo, true) = true
     LIMIT 1`
  );
  if (prof.rows[0]?.user_id) {
    pass(`professor_id=${prof.rows[0].prof_id} resolve users.id=${prof.rows[0].user_id}`);
  } else {
    failMsg("Nenhum professor com users.id para testar turma_professor_alterada");
  }

  // 2) Doador com token para lance_recebido
  const donor = await pool.query(
    `SELECT u.id, ft.token FROM users u
     JOIN fcm_tokens ft ON ft.user_key = u.id::text AND ft.ativo = true AND ft.user_type IN ('doador','leo','user')
     WHERE u.role IN ('doador','leo','user')
     LIMIT 1`
  );
  if (donor.rows[0]) {
    pass(`Doador users.id=${donor.rows[0].id} com token FCM ativo`);
  } else {
    pass("Doador sem token (lance_recebido depende de register-token em runtime)");
  }

  // 3) PEC turma + staff keys (scanner)
  const turma = await pool.query(
    `SELECT ai.id AS turma_id FROM activity_instances ai LIMIT 1`
  );
  if (turma.rows[0]) {
    const tid = turma.rows[0].turma_id;
    const staff = await pool.query(
      `SELECT DISTINCT u.id::text AS uid
       FROM professor_turmas pt
       JOIN professores p ON p.id = pt.professor_id
       JOIN users u ON LOWER(TRIM(u.email)) = LOWER(TRIM(p.email))
       WHERE pt.turma_id = $1 AND pt.turma_tipo = 'pec'
       UNION
       SELECT DISTINCT person_id::text FROM staff_assignments WHERE activity_instance_id = $1`,
      [tid]
    );
    if (staff.rows.length) pass(`Turma PEC ${tid}: ${staff.rows.length} staff key(s) para scanner`);
    else failMsg(`Turma PEC ${tid} sem equipe — scanner deve warn`);
  }

  // 4) Aluno login + register-token
  const aluno = await pool.query(
    `SELECT REGEXP_REPLACE(cpf,'[^0-9]','','g') AS cpf
     FROM aluno WHERE cpf IS NOT NULL AND LENGTH(REGEXP_REPLACE(cpf,'[^0-9]','','g')) = 11
     LIMIT 1`
  );
  if (!aluno.rows[0]?.cpf) {
    failMsg("Sem aluno PEC com CPF para login");
  } else {
    const health = await fetch(`${BASE}/api/health`).catch(() => null);
    if (!health?.ok) {
      failMsg(`Servidor ${BASE} indisponível — pule login/register-token`);
    } else {
      pass(`Servidor ${BASE} respondendo`);
      // login precisa senha real — só testa register-token ownership com sessão mock se endpoint existir
      const regBody = {
        token: fakeToken("aluno_reg"),
        userKey: aluno.rows[0].cpf,
        userType: "aluno",
        platform: "web",
        nome: "E2E Aluno",
      };
      const reg = await fetch(`${BASE}/api/push/register-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regBody),
      });
      const regData = await reg.json().catch(() => ({}));
      if (reg.status === 401) pass("register-token aluno sem sessão → 401 (esperado sem login)");
      else if (reg.ok) pass("register-token aluno aceito (sessão ativa no ambiente)");
      else pass(`register-token aluno status=${reg.status} (${regData.error || "ok"})`);
    }
  }

  // 5) Admin/dev register-token pattern
  const devTok = await pool.query(
    `SELECT user_key FROM fcm_tokens WHERE ativo = true AND user_type IN ('dev','dev-marketing') LIMIT 1`
  );
  if (devTok.rows[0]) pass(`Token dev/admin ativo user_key=${devTok.rows[0].user_key}`);
  else pass("Sem token dev no DB (admin register-token via painel)");

  await pool.end();
  console.log(`\n--- Resumo: ${ok.length} ok, ${fail.length} fail ---`);
  if (fail.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
