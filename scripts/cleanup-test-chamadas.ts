/**
 * Remove chamadas de teste (turmas com "teste" / "chamda" no nome).
 *
 * Uso:
 *   npx tsx scripts/cleanup-test-chamadas.ts          # dry-run (só lista)
 *   npx tsx scripts/cleanup-test-chamadas.ts --execute  # apaga de fato
 */
import { pool } from "../server/db";

const EXECUTE = process.argv.includes("--execute");

async function main() {
  const turmas = await pool.query(`
    SELECT id, title FROM activity_instances
    WHERE title ILIKE '%teste%cham%' OR title ILIKE '%chamda%'
    ORDER BY id
  `);

  const turmasInc = await pool.query(`
    SELECT id, nome FROM turmas_inclusao
    WHERE nome ILIKE '%teste%cham%' OR nome ILIKE '%chamda%'
    ORDER BY id
  `);

  const pecIds = turmas.rows.map((r: { id: number }) => r.id);
  const incIds = turmasInc.rows.map((r: { id: number }) => r.id);

  console.log("Turmas PEC:", turmas.rows);
  console.log("Turmas Inclusão:", turmasInc.rows);

  if (pecIds.length === 0 && incIds.length === 0) {
    console.log("Nenhuma turma de teste encontrada.");
    await pool.end();
    return;
  }

  const sessions = pecIds.length
    ? await pool.query(
        `SELECT id, activity_instance_id, date FROM sessions WHERE activity_instance_id = ANY($1::int[])`,
        [pecIds]
      )
    : { rows: [] };

  const presencas = incIds.length
    ? await pool.query(
        `SELECT COUNT(*)::int AS n FROM presencas_inclusao WHERE turma_id = ANY($1::int[])`,
        [incIds]
      )
    : { rows: [{ n: 0 }] };

  const tabletLogs = await pool.query(
    `SELECT id, turma_id, data_chamada, modo FROM chamada_tablet_logs
     WHERE turma_id = ANY($1::int[]) OR turma_id = ANY($2::int[])
        OR turma_nome ILIKE '%teste%cham%' OR turma_nome ILIKE '%chamda%'`,
    [pecIds.length ? pecIds : [0], incIds.length ? incIds : [0]]
  );

  const manualLogs = await pool.query(
    `SELECT id, turma_id, data, origem FROM chamada_manual_logs
     WHERE turma_id = ANY($1::int[]) OR turma_id = ANY($2::int[])`,
    [pecIds.length ? pecIds : [0], incIds.length ? incIds : [0]]
  );

  console.log("\n--- Será removido ---");
  console.log(`Sessions PEC: ${sessions.rows.length}`, sessions.rows);
  console.log(`Presenças Inclusão: ${presencas.rows[0]?.n ?? 0}`);
  console.log(`Tablet logs: ${tabletLogs.rows.length}`, tabletLogs.rows);
  console.log(`Ativações manual: ${manualLogs.rows.length}`, manualLogs.rows);

  if (!EXECUTE) {
    console.log("\nDry-run. Para apagar, rode: npx tsx scripts/cleanup-test-chamadas.ts --execute");
    await pool.end();
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (pecIds.length) {
      await client.query(`DELETE FROM sessions WHERE activity_instance_id = ANY($1::int[])`, [pecIds]);
    }
    if (incIds.length) {
      await client.query(`DELETE FROM presencas_inclusao WHERE turma_id = ANY($1::int[])`, [incIds]);
    }
    await client.query(
      `DELETE FROM chamada_tablet_logs
       WHERE turma_id = ANY($1::int[]) OR turma_id = ANY($2::int[])
          OR turma_nome ILIKE '%teste%cham%' OR turma_nome ILIKE '%chamda%'`,
      [pecIds.length ? pecIds : [0], incIds.length ? incIds : [0]]
    );
    await client.query(
      `DELETE FROM chamada_manual_logs WHERE turma_id = ANY($1::int[]) OR turma_id = ANY($2::int[])`,
      [pecIds.length ? pecIds : [0], incIds.length ? incIds : [0]]
    );

    await client.query("COMMIT");
    console.log("\nLimpeza concluída.");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
