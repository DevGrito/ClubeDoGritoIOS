/**
 * Unifica duplicatas PEC/Inclusão no mestre (somente banco LOCAL).
 *
 * Dry-run (padrão):
 *   npx dotenv -e .env.test-local -- tsx scripts/merge-duplicatas-atendidos.ts
 *
 * Executar merges (confiança >= media):
 *   npx dotenv -e .env.test-local -- tsx scripts/merge-duplicatas-atendidos.ts --execute
 *
 * Só alta confiança (nome + nascimento):
 *   npx dotenv -e .env.test-local -- tsx scripts/merge-duplicatas-atendidos.ts --execute --min=alta
 */
import { Pool } from "pg";
import { runAtendidosGritoBackfill } from "../server/services/atendidosGritoBackfill";
import {
  assertLocalDatabase,
  runDedupMerge,
} from "../server/services/atendidosGritoDedupMerge";

function env(name: string, fallback = ""): string {
  return String(process.env[name] || fallback).trim();
}

async function main() {
  const execute = process.argv.includes("--execute");
  const minArg = process.argv.find((a) => a.startsWith("--min="));
  const minConfidence = (minArg?.split("=")[1] || "media") as "alta" | "media" | "baixa";

  const host = env("DB_HOST", "localhost");
  const port = Number(env("DB_PORT", "5432"));
  const user = env("DB_USER", "postgres");
  const password = env("DB_PASSWORD", "");
  const database = env("DB_NAME", "clube-do-grito-local");

  assertLocalDatabase(host, database);

  console.log("══════════════════════════════════════════");
  console.log(" Merge duplicatas atendidos_grito");
  console.log(` Host: ${host}:${port}`);
  console.log(` DB:   ${database}`);
  console.log(` Mode: ${execute ? "EXECUTE" : "DRY-RUN"}`);
  console.log(` Min:  ${minConfidence}`);
  console.log("══════════════════════════════════════════");

  const pool = new Pool({ host, port, user, password, database, ssl: false });

  try {
    const dbInfo = await pool.query(`SELECT current_database() AS db, inet_server_addr() AS addr`);
    console.log("Conectado:", dbInfo.rows[0]);

    // 1) Backfill por CPF (PEC/Inclusão → mestre)
    console.log("\n→ Backfill por CPF...");
    const backfill = await runAtendidosGritoBackfill(pool, { dryRun: !execute });
    console.log(
      JSON.stringify(
        {
          dryRun: backfill.dryRun,
          cpfsUnicos: backfill.cpfsUnicos,
          cpfsComMultiplasFontes: backfill.cpfsComMultiplasFontes,
          inseridos: backfill.inseridos,
          programasInseridos: backfill.programasInseridos,
          conflitosNome: backfill.conflitosNome,
        },
        null,
        2
      )
    );

    // 2) Dedup por nome (+ nascimento) entre CPFs diferentes
    console.log("\n→ Dedup por nome/nascimento (CPFs diferentes)...");
    const dedup = await runDedupMerge(pool, {
      dryRun: !execute,
      minConfidence,
    });

    console.log(
      JSON.stringify(
        {
          dryRun: dedup.dryRun,
          database: dedup.database,
          host: dedup.host,
          totalPessoas: dedup.totalPessoas,
          porCpf: dedup.porCpf,
          candidatosNome: dedup.candidatosNome,
          mergesFiltrados: dedup.merges.length,
          executed: dedup.executed,
          skipped: dedup.skipped,
          errors: dedup.errors,
          amostra: dedup.amostra.map((m) => ({
            conf: m.confidence,
            reason: m.reason,
            nome: m.nome,
            nasc: m.dataNascimento,
            winner: m.winnerCpf,
            loser: m.loserCpf,
            fontes: m.fontes,
            details: m.details,
          })),
        },
        null,
        2
      )
    );

    if (!execute) {
      console.log("\nDry-run OK. Para aplicar: adicione --execute");
    } else {
      console.log(`\nConcluído: ${dedup.executed} merges aplicados.`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("FALHA:", err?.message || err);
  process.exit(1);
});
