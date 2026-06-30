/**
 * SEC-026 — Inventário estático: rotas sensíveis devem declarar middleware de auth.
 * Uso: npx tsx scripts/audit-routes.ts
 */
import fs from "node:fs";
import path from "node:path";
import { auditAllSensitiveRoutes } from "../server/security/routeAuthAudit";

const ROOT = process.cwd();
const SERVER_DIR = path.join(ROOT, "server");

function collectTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectTsFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      out.push(full);
    }
  }
  return out;
}

const files = collectTsFiles(SERVER_DIR);
const sources = files.map((f) => fs.readFileSync(f, "utf8"));
const issues = auditAllSensitiveRoutes(sources);

if (issues.length === 0) {
  console.log(`✅ SEC-026: ${files.length} arquivos auditados — rotas sensíveis protegidas.`);
  process.exit(0);
}

console.error(`❌ SEC-026: ${issues.length} problema(s) em rotas sensíveis:\n`);
for (const issue of issues) {
  console.error(`  ${issue.method} ${issue.path} — ${issue.reason}`);
}
process.exit(1);
