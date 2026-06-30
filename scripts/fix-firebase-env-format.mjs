/**
 * Extrai FIREBASE_SERVICE_ACCOUNT multilinha do .env e grava em secrets/.
 * Uso: node scripts/fix-firebase-env-format.mjs [.env.local-test] [.env]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envFiles = process.argv.slice(2).length
  ? process.argv.slice(2).map((f) => resolve(root, f))
  : [resolve(root, ".env.local-test"), resolve(root, ".env")];

const destDir = resolve(root, "secrets");
const dest = resolve(destDir, "firebase-service-account.json");

function extractJsonBlock(content) {
  const marker = "FIREBASE_SERVICE_ACCOUNT=";
  const start = content.indexOf(marker);
  if (start < 0) return null;
  const jsonStart = start + marker.length;
  if (content[jsonStart] !== "{") return null;
  let depth = 0;
  for (let i = jsonStart; i < content.length; i++) {
    const ch = content[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return content.slice(jsonStart, i + 1);
    }
  }
  return null;
}

let wroteJson = false;

for (const envPath of envFiles) {
  if (!existsSync(envPath)) {
    console.log("Ignorado (não existe):", envPath);
    continue;
  }
  const content = readFileSync(envPath, "utf8");
  const jsonBlock = extractJsonBlock(content);
  if (!jsonBlock) {
    if (content.includes("GOOGLE_APPLICATION_CREDENTIALS=")) {
      console.log("OK (já usa arquivo):", envPath);
    } else {
      console.log("Sem FIREBASE_SERVICE_ACCOUNT multilinha:", envPath);
    }
    continue;
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonBlock);
  } catch (e) {
    console.error("JSON inválido em", envPath, e.message);
    process.exit(1);
  }

  if (!wroteJson) {
    mkdirSync(destDir, { recursive: true });
    writeFileSync(dest, JSON.stringify(parsed, null, 2) + "\n");
    wroteJson = true;
    console.log("✅ Credencial gravada em secrets/firebase-service-account.json");
  }

  const replacement =
    "# Firebase Admin (arquivo local gitignored — não commitar)\nGOOGLE_APPLICATION_CREDENTIALS=secrets/firebase-service-account.json";
  const newContent = content.replace(
    /# Firebase Service Account\r?\nFIREBASE_SERVICE_ACCOUNT=\{[\s\S]*?\n\}/,
    replacement
  );
  writeFileSync(envPath, newContent);
  console.log("✅ .env atualizado:", envPath);
}

if (!wroteJson && existsSync(dest)) {
  console.log("Arquivo secrets/ já existe; nada a extrair.");
  process.exit(0);
}

if (!wroteJson) {
  console.error("Nenhum FIREBASE_SERVICE_ACCOUNT multilinha encontrado.");
  process.exit(1);
}
