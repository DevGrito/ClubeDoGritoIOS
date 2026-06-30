import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { auditAllSensitiveRoutes } from "./security/routeAuthAudit";

function collectServerSources(): string[] {
  const serverDir = path.join(process.cwd(), "server");
  const files: string[] = [];

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
        files.push(fs.readFileSync(full, "utf8"));
      }
    }
  }

  walk(serverDir);
  return files;
}

describe("SEC-026 route auth audit", () => {
  it("rotas sensíveis do manifesto declaram middleware de autenticação", () => {
    const issues = auditAllSensitiveRoutes(collectServerSources());
    expect(issues, JSON.stringify(issues, null, 2)).toEqual([]);
  });
});
