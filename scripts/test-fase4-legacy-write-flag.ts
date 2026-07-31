/**
 * Teste flag ATENDIDOS_GRITO_LEGACY_WRITE_PSICO
 * Uso: npx dotenv -e .env.test-local -- tsx scripts/test-fase4-legacy-write-flag.ts
 */
import { pool } from "../server/db";
import {
  upsertPsicoComunidadeMasterOnly,
  getPsicoComunidadeFromMasterByProgramaId,
  listPsicoComunidadeFromMaster,
  syncLegadoStatusToAtendidoGrito,
} from "../server/services/atendidosGritoSync";
import { getAtendidosGritoWriteFlags, isLegacyWriteEnabled } from "../server/services/atendidosGritoFlags";
import { normalizeCpfDigits } from "@shared/cpf";

const TAG = `[test-flag ${new Date().toISOString()}]`;

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

async function main() {
  const db = (await pool.query(`SELECT current_database() AS db`)).rows[0]?.db;
  console.log(`${TAG} Banco: ${db}`);
  console.log(`${TAG} Flags:`, getAtendidosGritoWriteFlags());

  assert(isLegacyWriteEnabled() === true, "default global deve ser true sem env");
  assert(isLegacyWriteEnabled("psico_comunidade") === true, "default psico deve ser true");
  ok("defaults da flag OK");

  // Simula modo master-only chamando o upsert direto (independente do env)
  const cpf = "39053344705";
  await pool.query(`DELETE FROM atendidos_grito_programa WHERE cpf = $1 AND programa = 'psico_comunidade'`, [cpf]);
  // não apaga atendidos_grito se outros programas usam — limpa só se só psico
  const outros = await pool.query(
    `SELECT COUNT(*)::int AS n FROM atendidos_grito_programa WHERE cpf = $1 AND programa <> 'psico_comunidade'`,
    [cpf]
  );
  if ((outros.rows[0]?.n ?? 0) === 0) {
    await pool.query(`DELETE FROM atendidos_grito WHERE cpf = $1`, [cpf]);
  }

  const beforeLegado = await pool.query(
    `SELECT COUNT(*)::int AS n FROM psico_atendidos_comunidade WHERE REGEXP_REPLACE(COALESCE(cpf,''), '[^0-9]', '', 'g') = $1`,
    [cpf]
  );

  const row = await upsertPsicoComunidadeMasterOnly({
    nome: `Flag Test Psico ${Date.now()}`,
    cpf,
    data_nascimento: "1991-04-10",
    sexo: "feminino",
    telefone: "11966665555",
    cep: "01310100",
    endereco: "Av Paulista",
    numero: "1000",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    estado: "SP",
    tem_bolsa_familia: "Sim",
    pe_de_meia: "sim",
    gas_do_povo: "nao",
  });

  assert(row.id, "deve retornar id (programa_id)");
  assert(normalizeCpfDigits(row.cpf) === cpf, "cpf no retorno");
  assert(row._fonte === "atendidos_grito", "fonte mestre");
  ok(`upsert master-only OK — id=${row.id}`);

  const afterLegado = await pool.query(
    `SELECT COUNT(*)::int AS n FROM psico_atendidos_comunidade WHERE REGEXP_REPLACE(COALESCE(cpf,''), '[^0-9]', '', 'g') = $1`,
    [cpf]
  );
  assert(
    afterLegado.rows[0].n === beforeLegado.rows[0].n,
    `legado não deve crescer no master-only (antes=${beforeLegado.rows[0].n} depois=${afterLegado.rows[0].n})`
  );
  ok("legado psico não foi escrito no upsert master-only");

  const fetched = await getPsicoComunidadeFromMasterByProgramaId(row.id);
  assert(fetched?.nome === row.nome, "GET by programa id");
  const listed = await listPsicoComunidadeFromMaster();
  assert(listed.some((r) => r.id === row.id), "aparece no list do mestre");
  ok("leitura master-only OK");

  await syncLegadoStatusToAtendidoGrito({
    cpf,
    programa: "psico_comunidade",
    legadoStatus: "inativo",
    legadoTipo: "atendidos_grito_programa",
    legadoId: String(row.id),
    dataEgresso: new Date(),
  });
  const afterDel = await getPsicoComunidadeFromMasterByProgramaId(row.id);
  assert(afterDel === null, "após inativar não deve retornar no GET ativo");
  ok("inativar programa psico no mestre OK");

  // cleanup
  await pool.query(`DELETE FROM atendidos_grito_programa WHERE cpf = $1 AND programa = 'psico_comunidade'`, [cpf]);
  if ((outros.rows[0]?.n ?? 0) === 0) {
    await pool.query(`DELETE FROM atendidos_grito WHERE cpf = $1`, [cpf]);
  }

  console.log(`\n${TAG} TODOS OS TESTES PASSARAM\n`);
  await pool.end();
}

main().catch((e) => {
  console.error(TAG, e);
  process.exit(1);
});
