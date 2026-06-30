#!/usr/bin/env npx tsx
/**
 * Backfill LGPD — termos → privacy_consents, HMAC legado, tag órfãos.
 *
 * Uso:
 *   npx dotenv -e .env.local-test -- npx tsx scripts/lgpd-backfill-consents.ts
 *   npx dotenv -e .env.local-test -- npx tsx scripts/lgpd-backfill-consents.ts --execute
 */
import pg from "pg";
import { runPrivacyConsentBackfill } from "../server/privacyConsentBackfill.ts";
import { ensureUserConsentsTable } from "../server/privacyConsentSchema.ts";

const execute = process.argv.includes("--execute");

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL_MODE === "disable" ? false : undefined,
  });

  try {
    await ensureUserConsentsTable(pool);
    console.log(execute ? "▶ Executando backfill..." : "▶ Simulação (dry-run)...");

    const result = await runPrivacyConsentBackfill(pool, { dryRun: !execute });
    console.log(JSON.stringify(result, null, 2));
    console.log(
      execute
        ? "✅ Backfill concluído."
        : "ℹ️  Adicione --execute para aplicar as mudanças."
    );
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("❌", err instanceof Error ? err.message : err);
  process.exit(1);
});
