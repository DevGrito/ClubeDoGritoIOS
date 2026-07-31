/**
 * Smoke — Fase 4 FK atendido_cpf em monitor_participantes e documentos_participante
 * Uso: npx dotenv -e .env.test-local -- tsx scripts/test-fase4-fk-atendido-cpf.ts
 */
import { pool, runAutoMigrations } from "../server/db";

const TAG = `[test-fk ${new Date().toISOString()}]`;

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

async function columnExists(table: string, column: string) {
  const r = await pool.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_name = $1 AND column_name = $2`,
    [table, column]
  );
  return r.rows.length > 0;
}

async function main() {
  await runAutoMigrations();
  const db = (await pool.query(`SELECT current_database() AS db`)).rows[0]?.db;
  console.log(`${TAG} Banco: ${db}`);

  assert(await columnExists("monitor_participantes", "atendido_cpf"), "coluna monitor_participantes.atendido_cpf");
  assert(await columnExists("documentos_participante", "atendido_cpf"), "coluna documentos_participante.atendido_cpf");
  ok("colunas atendido_cpf existem");

  const fkMon = await pool.query(
    `SELECT 1 FROM pg_constraint WHERE conname = 'monitor_participantes_atendido_cpf_fkey'`
  );
  const fkDoc = await pool.query(
    `SELECT 1 FROM pg_constraint WHERE conname = 'documentos_participante_atendido_cpf_fkey'`
  );
  assert(fkMon.rows.length > 0, "FK monitor_participantes_atendido_cpf_fkey");
  assert(fkDoc.rows.length > 0, "FK documentos_participante_atendido_cpf_fkey");
  ok("FKs para atendidos_grito criadas");

  const stats = await pool.query<{
    mon_total: number;
    mon_filled: number;
    doc_total: number;
    doc_filled: number;
  }>(`
    SELECT
      (SELECT COUNT(*)::int FROM monitor_participantes) AS mon_total,
      (SELECT COUNT(*)::int FROM monitor_participantes WHERE atendido_cpf IS NOT NULL) AS mon_filled,
      (SELECT COUNT(*)::int FROM documentos_participante) AS doc_total,
      (SELECT COUNT(*)::int FROM documentos_participante WHERE atendido_cpf IS NOT NULL) AS doc_filled
  `);
  const s = stats.rows[0];
  ok(`monitor_participantes: ${s.mon_filled}/${s.mon_total} com atendido_cpf`);
  ok(`documentos_participante: ${s.doc_filled}/${s.doc_total} com atendido_cpf`);

  // Nenhum atendido_cpf órfão
  const orphans = await pool.query(`
    SELECT COUNT(*)::int AS n FROM (
      SELECT atendido_cpf AS cpf FROM monitor_participantes WHERE atendido_cpf IS NOT NULL
      UNION ALL
      SELECT atendido_cpf FROM documentos_participante WHERE atendido_cpf IS NOT NULL
    ) t
    WHERE NOT EXISTS (SELECT 1 FROM atendidos_grito ag WHERE ag.cpf = t.cpf)
  `);
  assert(orphans.rows[0].n === 0, `não deve haver atendido_cpf órfão (veio ${orphans.rows[0].n})`);
  ok("nenhum atendido_cpf órfão no mestre");

  console.log(`\n${TAG} TODOS OS TESTES PASSARAM\n`);
  await pool.end();
}

main().catch((e) => {
  console.error(TAG, e);
  process.exit(1);
});
