/**
 * Verifica se Firebase Admin inicializa com .env.local-test
 * Uso: node scripts/verify-firebase-admin.mjs
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envFile = resolve(root, ".env.local-test");

if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (!process.env[t.slice(0, i)]) process.env[t.slice(0, i)] = v;
  }
}

const gac = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
if (gac && !resolve(gac).startsWith("/") && !/^[A-Za-z]:/.test(gac)) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = resolve(root, gac);
}

if (!process.env.FIREBASE_SERVICE_ACCOUNT && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error("❌ Defina GOOGLE_APPLICATION_CREDENTIALS ou FIREBASE_SERVICE_ACCOUNT no .env.local-test");
  process.exit(1);
}

if (process.env.GOOGLE_APPLICATION_CREDENTIALS && !existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  console.error("❌ Arquivo não encontrado:", process.env.GOOGLE_APPLICATION_CREDENTIALS);
  console.error("   Baixe a chave no Firebase Console e rode:");
  console.error('   node scripts/setup-firebase-admin.mjs "C:\\caminho\\para\\chave.json"');
  process.exit(1);
}

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT?.trim()) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    const { initializeApp, cert, getApps } = await import("firebase-admin/app");
    if (getApps().length === 0) initializeApp({ credential: cert(serviceAccount) });
    console.log("✅ Firebase Admin OK (FIREBASE_SERVICE_ACCOUNT)");
    process.exit(0);
  }

  const { initializeApp, applicationDefault, getApps } = await import("firebase-admin/app");
  if (getApps().length === 0) initializeApp({ credential: applicationDefault() });
  console.log("✅ Firebase Admin OK");
  console.log("   GOOGLE_APPLICATION_CREDENTIALS=", process.env.GOOGLE_APPLICATION_CREDENTIALS || "(n/a)");
  process.exit(0);
} catch (e) {
  console.error("❌ Falha:", e.message);
  process.exit(1);
}
