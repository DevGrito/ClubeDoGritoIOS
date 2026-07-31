import { pool } from "../server/db";
import { runAtendidosGritoBackfill } from "../server/services/atendidosGritoBackfill";

const execute = process.argv.includes("--execute");

async function main() {
  const result = await runAtendidosGritoBackfill(pool, { dryRun: !execute });
  console.log(JSON.stringify(result, null, 2));

  if (!execute) {
    console.log(
      "\nPrévia concluída sem alterações. Use --execute somente após revisar os conflitos."
    );
  }
}

main()
  .catch((error) => {
    console.error("Falha no backfill de atendidos_grito:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
