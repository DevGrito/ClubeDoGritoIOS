/**
 * Copia o banco de produção ( .env.local-test ) para o banco local ( .env.test-local ).
 * Uso: npx dotenv -e .env.local-test -e .env.test-local -- tsx scripts/copy-prod-to-local-db.ts
 *
 * Requer PostgreSQL client tools (pg_dump / pg_restore) — ex.: PostgreSQL 18 no Windows.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PG_BIN = process.env.PG_BIN || "C:\\Program Files\\PostgreSQL\\18\\bin";
const pgDump = path.join(PG_BIN, "pg_dump.exe");
const pgRestore = path.join(PG_BIN, "pg_restore.exe");
const psql = path.join(PG_BIN, "psql.exe");

const ROOT = path.resolve(import.meta.dirname, "..");
const PROD_ENV_FILE = path.join(ROOT, ".env.local-test");
const LOCAL_ENV_FILE = path.join(ROOT, ".env.test-local");

function loadEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo não encontrado: ${filePath}`);
  }
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function stripQuotes(s: string) {
  return s.replace(/^["']|["']$/g, "");
}

function run(cmd: string, args: string[], env: NodeJS.ProcessEnv) {
  console.log(`\n> ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, {
    env: { ...process.env, ...env },
    stdio: "inherit",
    shell: false,
    windowsHide: true,
  });
  if (r.error) throw r.error;
  return r.status ?? 1;
}

function main() {
  for (const bin of [pgDump, pgRestore, psql]) {
    if (!fs.existsSync(bin)) {
      throw new Error(`Binário não encontrado: ${bin}. Ajuste PG_BIN ou instale PostgreSQL client.`);
    }
  }

  const prodEnv = loadEnvFile(PROD_ENV_FILE);
  const localEnv = loadEnvFile(LOCAL_ENV_FILE);

  const prodHost = stripQuotes(prodEnv.DB_HOST || "");
  const prodPort = stripQuotes(prodEnv.DB_PORT || "5432");
  const prodUser = stripQuotes(prodEnv.DB_USER || prodEnv.POSTGRES_USER || "postgres");
  const prodDb = stripQuotes(prodEnv.DB_NAME || prodEnv.POSTGRES_DB || "");
  const prodPassword = stripQuotes(prodEnv.DB_PASSWORD || prodEnv.POSTGRES_PASSWORD || "");

  const localHost = stripQuotes(localEnv.LOCAL_DB_HOST || localEnv.DB_HOST || "localhost");
  const localPort = stripQuotes(localEnv.LOCAL_DB_PORT || localEnv.DB_PORT || "5432");
  const localUser = stripQuotes(localEnv.LOCAL_DB_USER || localEnv.DB_USER || "postgres");
  const localDb = stripQuotes(localEnv.LOCAL_DB_NAME || localEnv.DB_NAME || "");
  const localPassword = stripQuotes(
    localEnv.LOCAL_DB_PASSWORD || localEnv.DB_PASSWORD || localEnv.POSTGRES_PASSWORD || ""
  );

  if (!prodHost || !prodDb || !prodPassword) {
    throw new Error(`Credenciais de produção incompletas em ${PROD_ENV_FILE}`);
  }
  if (!localDb || !localPassword) {
    throw new Error(`Credenciais locais incompletas em ${LOCAL_ENV_FILE}`);
  }

  if (localHost === prodHost && localDb === prodDb && localPort === prodPort) {
    throw new Error("Origem e destino iguais — abortado por segurança.");
  }

  const reportsDir = path.resolve("reports", "db-copy");
  fs.mkdirSync(reportsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const dumpFile = path.join(reportsDir, `prod-${prodDb}-${stamp}.dump`);

  console.log("=== Cópia produção → banco local ===");
  console.log(`Origem:  ${prodUser}@${prodHost}:${prodPort}/${prodDb}`);
  console.log(`Destino: ${localUser}@${localHost}:${localPort}/${localDb}`);
  console.log(`Dump:    ${dumpFile}`);

  console.log("\n1/3 Testando conexão com produção...");
  run(psql, [
    "-h", prodHost,
    "-p", prodPort,
    "-U", prodUser,
    "-d", prodDb,
    "-c", "SELECT current_database() AS db, (SELECT count(*) FROM aluno) AS alunos;",
  ], { PGPASSWORD: prodPassword });

  console.log("\n2/3 Exportando produção (pg_dump)...");
  const dumpStatus = run(pgDump, [
    "-h", prodHost,
    "-p", prodPort,
    "-U", prodUser,
    "-d", prodDb,
    "-Fc",
    "--no-owner",
    "--no-acl",
    "-f", dumpFile,
  ], { PGPASSWORD: prodPassword });

  if (dumpStatus !== 0) {
    throw new Error(`pg_dump falhou com código ${dumpStatus}`);
  }

  const sizeMb = (fs.statSync(dumpFile).size / (1024 * 1024)).toFixed(2);
  console.log(`Dump concluído (${sizeMb} MB).`);

  console.log("\n3/3 Encerrando conexões no banco local e restaurando...");
  run(psql, [
    "-h", localHost,
    "-p", localPort,
    "-U", localUser,
    "-d", "postgres",
    "-c",
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${localDb.replace(/'/g, "''")}' AND pid <> pg_backend_pid();`,
  ], { PGPASSWORD: localPassword });

  const restoreStatus = run(pgRestore, [
    "-h", localHost,
    "-p", localPort,
    "-U", localUser,
    "-d", localDb,
    "--clean",
    "--if-exists",
    "--no-owner",
    "--no-acl",
    dumpFile,
  ], { PGPASSWORD: localPassword });

  // pg_restore costuma retornar 1 com avisos não fatais
  if (restoreStatus > 1) {
    throw new Error(`pg_restore falhou com código ${restoreStatus}`);
  }

  console.log("\n4/4 Validando destino...");
  run(psql, [
    "-h", localHost,
    "-p", localPort,
    "-U", localUser,
    "-d", localDb,
    "-c",
    `SELECT current_database() AS db,
            (SELECT count(*) FROM aluno) AS alunos,
            (SELECT count(*) FROM participantes_inclusao) AS inclusao;`,
  ], { PGPASSWORD: localPassword });

  console.log("\n✅ Cópia concluída. Use npm run dev:test-local para subir o app no banco local.");
}

try {
  main();
} catch (e) {
  console.error("\n❌", e instanceof Error ? e.message : e);
  process.exit(1);
}
