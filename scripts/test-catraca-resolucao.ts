/**
 * Smoke test — resolução catraca via atendidos_grito + legado
 * Uso: npx dotenv -e .env.test-local -- tsx scripts/test-catraca-resolucao.ts
 */
import { pool } from "../server/db";
import { normalizeCpfDigits } from "@shared/cpf";

const TAG = `[test-catraca ${new Date().toISOString()}]`;

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

async function expandViaMestre(cpfCandidatos: string[]) {
  const with11 = cpfCandidatos.filter((c) => c.length >= 11);
  if (with11.length === 0) return { cpfs: cpfCandidatos, masterCpf: null as string | null };
  const r = await pool.query<{ cpf: string }>(
    `SELECT cpf FROM atendidos_grito WHERE cpf = ANY($1::text[]) LIMIT 1`,
    [with11]
  );
  if (!r.rows[0]) return { cpfs: cpfCandidatos, masterCpf: null };
  const masterCpf = normalizeCpfDigits(r.rows[0].cpf);
  return { cpfs: Array.from(new Set([masterCpf, ...cpfCandidatos])), masterCpf };
}

async function main() {
  const db = (await pool.query(`SELECT current_database() AS db`)).rows[0]?.db;
  console.log(`${TAG} Banco: ${db}`);

  // Pega um CPF que exista no mestre E em pelo menos um legado
  const sample = await pool.query<{ cpf: string; nome: string; tem_pec: boolean; tem_inc: boolean }>(`
    SELECT ag.cpf,
           ag.nome_completo AS nome,
           EXISTS (SELECT 1 FROM aluno a WHERE REGEXP_REPLACE(a.cpf,'[^0-9]','','g') = ag.cpf) AS tem_pec,
           EXISTS (SELECT 1 FROM participantes_inclusao p WHERE REGEXP_REPLACE(p.cpf,'[^0-9]','','g') = ag.cpf) AS tem_inc
    FROM atendidos_grito ag
    WHERE EXISTS (
      SELECT 1 FROM aluno a WHERE REGEXP_REPLACE(a.cpf,'[^0-9]','','g') = ag.cpf
      UNION ALL
      SELECT 1 FROM participantes_inclusao p WHERE REGEXP_REPLACE(p.cpf,'[^0-9]','','g') = ag.cpf
    )
    LIMIT 1
  `);

  assert(sample.rows[0], "precisa de pelo menos 1 CPF no mestre com legado");
  const cpf = sample.rows[0].cpf;
  ok(`amostra CPF=${cpf} nome=${sample.rows[0].nome} pec=${sample.rows[0].tem_pec} inclusao=${sample.rows[0].tem_inc}`);

  const expanded = await expandViaMestre([cpf, cpf.replace(/^0+/, "") || "0"]);
  assert(expanded.masterCpf === cpf, `mestre deve resolver CPF canônico (veio ${expanded.masterCpf})`);
  ok(`expandViaMestre OK — masterCpf=${expanded.masterCpf}`);

  if (sample.rows[0].tem_pec) {
    const pec = await pool.query(
      `SELECT cpf, nome_completo FROM aluno
       WHERE REGEXP_REPLACE(TRIM(COALESCE(cpf,'')), '[^0-9]', '', 'g') = ANY($1::text[])
       LIMIT 1`,
      [expanded.cpfs]
    );
    assert(pec.rows[0], "deve achar aluno PEC pelo CPF do mestre");
    ok(`resolução PEC via mestre OK — ${pec.rows[0].nome_completo}`);
  }

  if (sample.rows[0].tem_inc) {
    const inc = await pool.query(
      `SELECT id, nome FROM participantes_inclusao
       WHERE REGEXP_REPLACE(TRIM(COALESCE(cpf,'')), '[^0-9]', '', 'g') = ANY($1::text[])
       LIMIT 1`,
      [expanded.cpfs]
    );
    assert(inc.rows[0], "deve achar participante Inclusão pelo CPF do mestre");
    ok(`resolução Inclusão via mestre OK — ${inc.rows[0].nome}`);
  }

  // CPF inexistente no mestre
  const miss = await expandViaMestre(["00000000099"]);
  assert(miss.masterCpf === null, "CPF inventado não deve estar no mestre");
  ok("CPF inexistente no mestre retorna null (fallback legado esperado)");

  console.log(`\n${TAG} TODOS OS TESTES PASSARAM\n`);
  await pool.end();
}

main().catch((e) => {
  console.error(TAG, e);
  process.exit(1);
});
