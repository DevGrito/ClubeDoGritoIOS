/**
 * Registra retroativamente evasões das turmas Empreendedoras da Beleza (Tarde/Noite).
 * Uso: npx dotenv -e .env.local-test -- npx tsx scripts/backfill-evasao-beleza.ts
 */
import { pool } from "../server/db.ts";
import { storage } from "../server/storage.ts";

const TURMA_IDS = [98, 99]; // Noite e Tarde
const DATA_EVASAO = "2026-07-01"; // última presença registrada

async function main() {
  const alunos = await pool.query(
    `
    SELECT
      pi.id AS participante_id,
      pi.nome,
      ti.id AS turma_id,
      ti.nome AS turma_nome,
      pt.status,
      (iev.id IS NOT NULL) AS ja_evadido
    FROM participantes_turmas pt
    JOIN participantes_inclusao pi ON pi.id = pt.participante_id
    JOIN turmas_inclusao ti ON ti.id = pt.turma_id
    LEFT JOIN inclusao_evasoes iev ON iev.participante_turma_id = pt.id AND iev.revertido_em IS NULL
    WHERE pt.turma_id = ANY($1::int[])
      AND pt.status = 'reprovado'
    ORDER BY ti.nome, pi.nome
  `,
    [TURMA_IDS]
  );

  if (alunos.rows.length === 0) {
    console.log("Nenhum aluno reprovado encontrado nas turmas 98/99.");
    await pool.end();
    return;
  }

  console.log(`Encontrados ${alunos.rows.length} aluno(s) para registrar evasão:\n`);

  let ok = 0;
  let skip = 0;

  for (const row of alunos.rows) {
    const { participante_id, nome, turma_id, turma_nome, ja_evadido } = row;

    if (ja_evadido) {
      console.log(`⏭️  ${nome} (${turma_nome}) — já possui evasão ativa`);
      skip++;
      continue;
    }

    try {
      await storage.registerInclusaoEvasao(participante_id, turma_id, DATA_EVASAO);
      console.log(`✅ ${nome} (${turma_nome}) — evasão registrada em ${DATA_EVASAO}`);
      ok++;
    } catch (err: any) {
      console.error(`❌ ${nome} (${turma_nome}) — erro: ${err.message}`);
    }
  }

  console.log(`\nConcluído: ${ok} registrada(s), ${skip} ignorada(s).`);

  // Verificação final
  const check = await pool.query(
    `
    SELECT pi.nome, ti.nome AS turma, iev.data_desligamento::text, pt.status
    FROM inclusao_evasoes iev
    JOIN participantes_inclusao pi ON pi.id = iev.participante_id
    JOIN turmas_inclusao ti ON ti.id = iev.turma_id
    JOIN participantes_turmas pt ON pt.id = iev.participante_turma_id
    WHERE iev.turma_id = ANY($1::int[]) AND iev.revertido_em IS NULL
    ORDER BY ti.nome, pi.nome
  `,
    [TURMA_IDS]
  );

  console.log("\n=== Evadidos ativos após backfill ===");
  for (const r of check.rows) {
    console.log(` - ${r.nome} | ${r.turma} | ${r.data_desligamento} | status: ${r.status}`);
  }

  await pool.end();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
