import fs from "fs";
import path from "path";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const installed = new Set([
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
  ...Object.keys(pkg.optionalDependencies || {}),
]);

const NODE_BUILTINS = new Set([
  "assert", "buffer", "child_process", "cluster", "crypto", "dgram", "dns",
  "events", "fs", "http", "https", "module", "net", "os", "path", "process",
  "querystring", "readline", "stream", "string_decoder", "timers", "tls",
  "tty", "url", "util", "vm", "zlib",
]);

const importRe =
  /(?:import|export)\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^./][^'"]*)['"]|import\(['"]([^./][^'"]*)['"]\)/g;

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === "dist" || e.name === ".git") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, files);
    else if (/\.(tsx?|jsx?|mjs|cjs)$/.test(e.name)) files.push(p);
  }
  return files;
}

function toPkgName(spec) {
  if (spec.startsWith("node:")) return null;
  if (spec.startsWith("@/") || spec.startsWith("@shared")) return null;
  return spec.startsWith("@")
    ? spec.split("/").slice(0, 2).join("/")
    : spec.split("/")[0];
}

const roots = ["client", "server", "shared"].filter((d) => fs.existsSync(d));
const missing = new Set();

for (const file of roots.flatMap((r) => walk(r))) {
  const content = fs.readFileSync(file, "utf8");
  let m;
  while ((m = importRe.exec(content))) {
    const pkgName = toPkgName(m[1] || m[2] || "");
    if (!pkgName || NODE_BUILTINS.has(pkgName)) continue;
    if (!installed.has(pkgName)) missing.add(pkgName);
  }
}

const list = [...missing].sort();
if (list.length === 0) {
  console.log("Nenhum pacote npm faltando.");
} else {
  console.log("Pacotes faltando:\n  " + list.join("\n  "));
  const prod = list.filter((n) => !n.includes("vitest") && !n.startsWith("@types/"));
  const dev = list.filter((n) => n.includes("vitest") || n.startsWith("@types/"));
  if (prod.length) console.log("\nInstalar tudo de uma vez:\n  npm install " + prod.join(" "));
  if (dev.length) console.log("\nDev:\n  npm install -D " + dev.join(" "));
}
