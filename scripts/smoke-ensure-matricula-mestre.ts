/**
 * Smoke: cadastro só mestre + matrícula sem criar legado.
 * npx dotenv -e .env.test-local -- tsx scripts/smoke-ensure-matricula-mestre.ts
 */
import { pool, runAutoMigrations } from "../server/db";
import { storage } from "../server/storage";
import { isLegacyWriteEnabled } from "../server/services/atendidosGritoFlags";

const TEST_CPF = "00000000996";

async function cleanup() {
  await pool.query(`DELETE FROM participantes_turmas WHERE atendido_cpf = $1`, [TEST_CPF]).catch(() => {});
  await pool.query(`DELETE FROM participantes_turmas WHERE participante_id IN (
    SELECT id FROM participantes_inclusao WHERE cpf = $1
  )`, [TEST_CPF]).catch(() => {});
  await pool.query(`DELETE FROM instance_enrollments WHERE student_cpf = $1`, [TEST_CPF]).catch(() => {});
  await pool.query(`DELETE FROM participantes_inclusao WHERE cpf = $1`, [TEST_CPF]).catch(() => {});
  await pool.query(`DELETE FROM aluno WHERE cpf = $1`, [TEST_CPF]).catch(() => {});
  await pool.query(`DELETE FROM atendidos_grito_programa WHERE cpf = $1`, [TEST_CPF]).catch(() => {});
  await pool.query(`DELETE FROM atendidos_grito WHERE cpf = $1`, [TEST_CPF]).catch(() => {});
}

async function main() {
  await runAutoMigrations();

  const dbCheck = await pool.query(`SELECT current_database() AS db`);
  if (dbCheck.rows[0]?.db !== "clube-do-grito-local") {
    throw new Error(`Abortado: DB=${dbCheck.rows[0]?.db}`);
  }

  console.log("flags", {
    pec: isLegacyWriteEnabled("pec"),
    inclusao: isLegacyWriteEnabled("inclusao"),
  });

  await cleanup();

  const aluno = await storage.createAluno({
    cpf: TEST_CPF,
    nome_completo: "Smoke Cadastro So Mestre",
    data_nascimento: "2010-01-01",
    genero: "Masculino",
    situacao_atendimento: "ativo",
  });

  const alunoLegado = await pool.query(`SELECT 1 FROM aluno WHERE cpf = $1`, [TEST_CPF]);
  const master = await pool.query(`SELECT nome_completo FROM atendidos_grito WHERE cpf = $1`, [TEST_CPF]);
  const progBefore = await pool.query(
    `SELECT programa FROM atendidos_grito_programa WHERE cpf = $1`,
    [TEST_CPF]
  );

  const { rows: turmas } = await pool.query(
    `SELECT id FROM turmas_inclusao ORDER BY id DESC LIMIT 1`
  );
  if (!turmas[0]) throw new Error("Sem turma Inclusão para teste");
  const turmaId = Number(turmas[0].id);

  await storage.addAtendidoCpfToTurmaInclusao(TEST_CPF, turmaId, "2026-07-21");

  const partLegado = await pool.query(
    `SELECT 1 FROM participantes_inclusao WHERE cpf = $1`,
    [TEST_CPF]
  );
  const vinculo = await pool.query(
    `SELECT atendido_cpf, participante_id, status FROM participantes_turmas
     WHERE turma_id = $1 AND atendido_cpf = $2`,
    [turmaId, TEST_CPF]
  );
  const progAfter = await pool.query(
    `SELECT programa, status FROM atendidos_grito_programa WHERE cpf = $1 ORDER BY programa`,
    [TEST_CPF]
  );

  const { rows: pecTurmas } = await pool.query(
    `SELECT id FROM activity_instances ORDER BY id DESC LIMIT 1`
  );
  let pecOk = true;
  if (pecTurmas[0]) {
    const cpf = await storage.ensurePecAlunoFromMaster(TEST_CPF);
    const ex = await pool.query(
      `SELECT 1 FROM instance_enrollments WHERE activity_instance_id = $1 AND student_cpf = $2`,
      [pecTurmas[0].id, cpf]
    );
    if (!ex.rows.length) {
      await pool.query(
        `INSERT INTO instance_enrollments (activity_instance_id, student_cpf, active)
         VALUES ($1, $2, true)`,
        [pecTurmas[0].id, cpf]
      );
    }
    const ie = await pool.query(
      `SELECT student_cpf FROM instance_enrollments WHERE student_cpf = $1 LIMIT 1`,
      [TEST_CPF]
    );
    pecOk = ie.rows.length > 0;
  }

  const ok =
    !!aluno &&
    alunoLegado.rows.length === 0 &&
    master.rows.length === 1 &&
    progBefore.rows.length === 0 &&
    partLegado.rows.length === 0 &&
    vinculo.rows.length === 1 &&
    vinculo.rows[0].atendido_cpf === TEST_CPF &&
    vinculo.rows[0].participante_id == null &&
    progAfter.rows.some((p) => p.programa === "inclusao") &&
    pecOk;

  console.log(
    JSON.stringify(
      {
        ok,
        alunoNome: (aluno as any).nome_completo,
        alunoLegadoRows: alunoLegado.rows.length,
        master: master.rows[0],
        progBefore: progBefore.rows,
        partLegadoRows: partLegado.rows.length,
        vinculo: vinculo.rows[0],
        progAfter: progAfter.rows,
        pecOk,
      },
      null,
      2
    )
  );

  await cleanup();
  console.log(ok ? "SMOKE PASS" : "SMOKE FAIL");
  process.exit(ok ? 0 : 1);
}

main().catch(async (e) => {
  console.error("SMOKE ERROR:", e?.message || e);
  try {
    await cleanup();
  } catch {}
  process.exit(1);
});
