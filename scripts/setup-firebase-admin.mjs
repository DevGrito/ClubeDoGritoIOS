/**
 * Copia o JSON da service account do Firebase para secrets/ e valida.
 * Uso: node scripts/setup-firebase-admin.mjs <caminho-do-json-baixado>
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const src = process.argv[2];
if (!src) {
  console.error("Uso: node scripts/setup-firebase-admin.mjs <caminho-do-json>");
  process.exit(1);
}

const absSrc = resolve(src);
if (!existsSync(absSrc)) {
  console.error("Arquivo não encontrado:", absSrc);
  process.exit(1);
}

let parsed;
try {
  parsed = JSON.parse(readFileSync(absSrc, "utf8"));
} catch {
  console.error("O arquivo não é um JSON válido de service account.");
  process.exit(1);
}

if (!parsed.project_id || !parsed.private_key || !parsed.client_email) {
  console.error("JSON inválido: faltam project_id, private_key ou client_email.");
  process.exit(1);
}

if (parsed.project_id !== "clube-do-grito") {
  console.warn(`⚠️  project_id=${parsed.project_id} (esperado clube-do-grito). Continuando mesmo assim.`);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const destDir = resolve(root, "secrets");
const dest = resolve(destDir, "firebase-service-account.json");

mkdirSync(destDir, { recursive: true });
copyFileSync(absSrc, dest);
console.log("✅ Copiado para:", dest);
console.log("   project_id:", parsed.project_id);
console.log("   client_email:", parsed.client_email);

console.log("\nPróximo: reinicie npm run dev:test e rode node scripts/verify-firebase-admin.mjs");
