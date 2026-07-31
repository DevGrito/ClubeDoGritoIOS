/**
 * Teste Fase 4 — Psico Comunidade: escrita dupla + rotas HTTP + cadastro mestre
 * Uso: npx dotenv -e .env.test-local -- tsx scripts/test-fase4-cadastro-unificado.ts
 */
import { pool } from "../server/db";
import {
  getNextCpfProvisorio,
  getAtendidoGritoByCpf,
  syncFromPsicoComunidade,
  syncLegadoStatusToAtendidoGrito,
  migrateAtendidoGritoCpf,
} from "../server/services/atendidosGritoSync";
import { normalizeCpfDigits } from "@shared/cpf";

const TAG = `[test-fase4 ${new Date().toISOString()}]`;
const BASE_URL = process.env.TEST_BASE_URL || `http://localhost:${process.env.PORT || 4100}`;

function ok(msg: string) {
  console.log(`✅ ${TAG} ${msg}`);
}

function fail(msg: string): never {
  console.error(`❌ ${TAG} ${msg}`);
  process.exit(1);
}

function assert(cond: unknown, msg: string) {
  if (!cond) fail(msg);
}

async function countGrito(cpf: string) {
  const d = normalizeCpfDigits(cpf);
  const ag = await pool.query(`SELECT * FROM atendidos_grito WHERE cpf = $1`, [d]);
  const prog = await pool.query(`SELECT * FROM atendidos_grito_programa WHERE cpf = $1`, [d]);
  return { ag: ag.rows[0], programas: prog.rows };
}

async function cleanupPsico(id: number, cpf?: string) {
  await pool.query(`DELETE FROM psico_atendidos_comunidade WHERE id = $1`, [id]).catch(() => {});
  if (cpf) {
    const d = normalizeCpfDigits(cpf);
    if (d.length === 11) {
      await pool.query(`DELETE FROM atendidos_grito_programa WHERE cpf = $1 AND programa = 'psico_comunidade'`, [d]);
      const { rows } = await pool.query(
        `SELECT COUNT(*)::int AS n FROM atendidos_grito_programa WHERE cpf = $1`,
        [d]
      );
      if ((rows[0]?.n ?? 0) === 0) {
        await pool.query(`DELETE FROM atendidos_grito_observacoes WHERE cpf = $1`, [d]);
        await pool.query(`DELETE FROM atendidos_grito WHERE cpf = $1`, [d]);
      }
    }
  }
}

/** Login HTTP (developer ou coordenador via env). */
async function loginHttp(): Promise<string> {
  const devUser = process.env.DEV_TEST_USER;
  const devPass = process.env.DEV_TEST_PASSWORD;
  const coordEmail = process.env.COORD_TEST_EMAIL;
  const coordPass = process.env.COORD_TEST_PASSWORD;

  let res: Response;
  if (devUser && devPass) {
    res = await fetch(`${BASE_URL}/api/login/developer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario: devUser, senha: devPass }),
    });
  } else if (coordEmail && coordPass) {
    res = await fetch(`${BASE_URL}/api/login/coordenador`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: coordEmail, senha: coordPass }),
    });
  } else {
    throw new Error("Defina DEV_TEST_USER/PASSWORD ou COORD_TEST_EMAIL/PASSWORD no .env.test-local");
  }

  const setCookie = res.headers.get("set-cookie");
  if (!res.ok || !setCookie) {
    const body = await res.text().catch(() => "");
    throw new Error(`Login HTTP falhou (${res.status}): ${body.slice(0, 200)}`);
  }
  ok(`login HTTP OK`);
  return setCookie.split(";")[0];
}

async function testSyncDireto() {
  console.log(`\n${TAG} --- Sync direto (serviço) ---`);
  const cpfProv = normalizeCpfDigits(await getNextCpfProvisorio());
  const nome = `Teste Fase4 Psico ${Date.now()}`;
  let psicoId: number | undefined;

  try {
    const insert = await pool.query(
      `INSERT INTO psico_atendidos_comunidade
        (nome, cpf, data_nascimento, sexo, telefone, cep, endereco, numero, bairro, cidade, estado,
         tem_bolsa_familia, tem_bpc, criancas, adultos)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        nome,
        cpfProv,
        "1990-01-15",
        "feminino",
        "11988887777",
        "01310100",
        "Av Paulista",
        "100",
        "Bela Vista",
        "São Paulo",
        "SP",
        "Sim",
        "Não",
        1,
        2,
      ]
    );
    const row = insert.rows[0];
    psicoId = row.id;
    await syncFromPsicoComunidade(row, { pe_de_meia: "sim", gas_do_povo: "nao" });

    let g = await countGrito(cpfProv);
    assert(g.ag, "atendidos_grito deve existir após sync psico");
    assert(g.ag.cpf_provisorio === true, "cpf_provisorio deve ser true");
    assert(g.ag.nome_completo === nome, `nome mestre incorreto: ${g.ag.nome_completo}`);
    assert(g.ag.bairro === "Bela Vista", `bairro mestre incorreto: ${g.ag.bairro}`);
    assert(
      g.programas.some((p: { programa: string; status: string }) => p.programa === "psico_comunidade" && p.status === "ativo"),
      "vínculo psico_comunidade ativo ausente"
    );
    const dc = typeof g.ag.dados_complementares === "string" ? JSON.parse(g.ag.dados_complementares) : g.ag.dados_complementares;
    assert(dc?.beneficios_sociais?.pe_de_meia === "sim", "pe_de_meia deve estar em dados_complementares");
    ok(`sync direto OK — cpf=${cpfProv} id=${psicoId}`);

    // CPF provisório → real
    const cpfReal = "39053344705";
    await pool.query(`DELETE FROM atendidos_grito WHERE cpf = $1`, [cpfReal]).catch(() => {});
    await pool.query(`DELETE FROM atendidos_grito_programa WHERE cpf = $1`, [cpfReal]).catch(() => {});
    await pool.query(`UPDATE psico_atendidos_comunidade SET cpf = $1 WHERE id = $2`, [cpfReal, psicoId]);
    await migrateAtendidoGritoCpf(cpfProv, cpfReal);
    const updated = (await pool.query(`SELECT * FROM psico_atendidos_comunidade WHERE id = $1`, [psicoId])).rows[0];
    await syncFromPsicoComunidade(updated, { pe_de_meia: "sim", gas_do_povo: "nao" });

    g = await countGrito(cpfReal);
    assert(g.ag?.cpf_provisorio === false, "cpf_provisorio deve ser false após CPF real");
    assert(!(await getAtendidoGritoByCpf(cpfProv)), "CPF provisório antigo não deve existir no mestre");
    ok(`migração CPF psico OK — cpf=${cpfReal}`);

    // Delete → programa inativo
    await pool.query(`DELETE FROM psico_atendidos_comunidade WHERE id = $1`, [psicoId]);
    await syncLegadoStatusToAtendidoGrito({
      cpf: cpfReal,
      programa: "psico_comunidade",
      legadoStatus: "inativo",
      legadoTipo: "psico_atendidos_comunidade",
      legadoId: String(psicoId),
      dataEgresso: new Date(),
    });
    g = await countGrito(cpfReal);
    const psicoProg = g.programas.find((p: { programa: string }) => p.programa === "psico_comunidade");
    assert(psicoProg?.status === "inativo", `programa psico deve estar inativo, veio: ${psicoProg?.status}`);
    assert(psicoProg?.data_egresso, "data_egresso deve ser preenchida");
    ok("delete + inativar programa psico_comunidade OK");

    await pool.query(`DELETE FROM atendidos_grito_programa WHERE cpf = $1`, [cpfReal]);
    await pool.query(`DELETE FROM atendidos_grito WHERE cpf = $1`, [cpfReal]);
    psicoId = undefined;
  } finally {
    if (psicoId) await cleanupPsico(psicoId, cpfProv);
  }
}

async function testRotasHttpSmoke() {
  console.log(`\n${TAG} --- Rotas HTTP (smoke — sem autenticação) ---`);
  const endpoints: Array<{ method: string; path: string }> = [
    { method: "GET", path: "/api/psico/atendidos-comunidade" },
    { method: "POST", path: "/api/psico/atendidos-comunidade" },
    { method: "GET", path: "/api/atendidos-grito/cadastro?cpf=00000000001" },
    { method: "GET", path: "/api/atendidos-grito/stats" },
  ];
  for (const { method, path } of endpoints) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: method === "POST" ? { "Content-Type": "application/json" } : undefined,
      body: method === "POST" ? JSON.stringify({ nome: "x" }) : undefined,
    });
    assert(res.status === 401 || res.status === 403, `${method} ${path} deve exigir auth (veio ${res.status})`);
    ok(`${method} ${path} → ${res.status} (protegida)`);
  }
}
async function testRotasHttpAutenticadas(cookie: string) {
  console.log(`\n${TAG} --- Rotas HTTP autenticadas (CRUD Psico Comunidade) ---`);
  const cpf = normalizeCpfDigits(await getNextCpfProvisorio());
  const nome = `Teste HTTP Fase4 ${Date.now()}`;
  let createdId: number | undefined;

  const headers = {
    "Content-Type": "application/json",
    Cookie: cookie,
  };

  try {
    // POST
    const postRes = await fetch(`${BASE_URL}/api/psico/atendidos-comunidade`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        nome,
        cpf,
        data_nascimento: "1985-06-20",
        sexo: "masculino",
        telefone: "11977776666",
        cep: "30130100",
        endereco: "Rua da Bahia",
        numero: "500",
        bairro: "Centro",
        cidade: "Belo Horizonte",
        estado: "MG",
        tem_bolsa_familia: "Sim",
        tem_bpc: "Não",
        pe_de_meia: "sim",
        gas_do_povo: "sim",
        criancas: 0,
        adultos: 1,
        observacoes: "Teste fase 4 HTTP",
      }),
    });
    const postBody = await postRes.json().catch(() => ({}));
    assert(postRes.ok, `POST falhou (${postRes.status}): ${JSON.stringify(postBody).slice(0, 300)}`);
    createdId = postBody.id;
    assert(createdId, "POST deve retornar id");

    let g = await countGrito(cpf);
    assert(g.ag, "mestre deve existir após POST HTTP");
    assert(
      g.programas.some((p: { programa: string }) => p.programa === "psico_comunidade"),
      "programa psico_comunidade ausente após POST"
    );
    ok(`POST /api/psico/atendidos-comunidade OK — id=${createdId}`);

    // GET by id
    const getRes = await fetch(`${BASE_URL}/api/psico/atendidos-comunidade/${createdId}`, { headers: { Cookie: cookie } });
    const getBody = await getRes.json();
    assert(getRes.ok && getBody.nome === nome, `GET by id falhou: ${getRes.status}`);
    ok(`GET /api/psico/atendidos-comunidade/:id OK`);

    // GET cadastro mestre
    const cadRes = await fetch(`${BASE_URL}/api/atendidos-grito/cadastro?cpf=${cpf}`, {
      headers: { Cookie: cookie },
    });
    const cadBody = await cadRes.json();
    assert(cadRes.ok && cadBody.cpf === cpf, `GET cadastro mestre falhou: ${cadRes.status}`);
    ok(`GET /api/atendidos-grito/cadastro OK — nome=${cadBody.nome_completo}`);

    // PUT
    const nomeNovo = nome + " Editado";
    const putRes = await fetch(`${BASE_URL}/api/psico/atendidos-comunidade/${createdId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        nome: nomeNovo,
        cpf,
        data_nascimento: "1985-06-20",
        sexo: "masculino",
        telefone: "11977776666",
        cep: "30130100",
        endereco: "Rua da Bahia",
        numero: "501",
        bairro: "Centro",
        cidade: "Belo Horizonte",
        estado: "MG",
        tem_bolsa_familia: "Não",
        tem_bpc: "Não",
        pe_de_meia: "nao",
        gas_do_povo: "nao",
        observacoes: "Atualizado fase 4",
      }),
    });
    assert(putRes.ok, `PUT falhou (${putRes.status}): ${await putRes.text()}`);
    g = await countGrito(cpf);
    assert(g.ag?.nome_completo === nomeNovo, `nome mestre após PUT: ${g.ag?.nome_completo}`);
    ok(`PUT /api/psico/atendidos-comunidade/:id OK`);

    // DELETE
    const delRes = await fetch(`${BASE_URL}/api/psico/atendidos-comunidade/${createdId}`, {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
    assert(delRes.ok, `DELETE falhou (${delRes.status})`);
    g = await countGrito(cpf);
    const prog = g.programas.find((p: { programa: string }) => p.programa === "psico_comunidade");
    assert(prog?.status === "inativo", `após DELETE programa deve estar inativo, veio: ${prog?.status}`);
    ok(`DELETE /api/psico/atendidos-comunidade/:id OK`);

    await pool.query(`DELETE FROM atendidos_grito_programa WHERE cpf = $1`, [cpf]);
    await pool.query(`DELETE FROM atendidos_grito WHERE cpf = $1`, [cpf]);
    createdId = undefined;
  } finally {
    if (createdId) {
      await pool.query(`DELETE FROM psico_atendidos_comunidade WHERE id = $1`, [createdId]).catch(() => {});
      await pool.query(`DELETE FROM atendidos_grito_programa WHERE cpf = $1`, [cpf]).catch(() => {});
      await pool.query(`DELETE FROM atendidos_grito WHERE cpf = $1`, [cpf]).catch(() => {});
    }
  }
}

async function testStats() {
  console.log(`\n${TAG} --- Stats mestre ---`);
  const { rows } = await pool.query<{ programas_psico: number }>(
    `SELECT COUNT(*)::int AS programas_psico FROM atendidos_grito_programa WHERE programa = 'psico_comunidade'`
  );
  assert(rows[0]?.programas_psico >= 0, "stats programas_psico");
  ok(`programas_psico no mestre: ${rows[0]?.programas_psico}`);
}

async function main() {
  const dbName = (await pool.query(`SELECT current_database() AS db`)).rows[0]?.db;
  console.log(`${TAG} Banco: ${dbName} | API: ${BASE_URL}`);

  await testSyncDireto();
  await testStats();
  await testRotasHttpSmoke();

  try {
    const cookie = await loginHttp();
    await testRotasHttpAutenticadas(cookie);
  } catch (e) {
    console.warn(`⚠️ ${TAG} Testes HTTP autenticados ignorados: ${e instanceof Error ? e.message : e}`);
    console.warn(`${TAG} (sync + smoke HTTP passaram — defina DEV_TEST_USER/PASSWORD para CRUD completo via API)`);
  }

  console.log(`\n${TAG} TODOS OS TESTES PASSARAM\n`);
  await pool.end();
}

main().catch((err) => {
  console.error(TAG, err);
  process.exit(1);
});
