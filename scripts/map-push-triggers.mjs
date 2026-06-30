import { readFileSync } from "fs";

const rules = JSON.parse(readFileSync("scripts/_push-rules-active.json", "utf8"));
const routes = readFileSync("server/routes.ts", "utf8");

const gatilhos = [...new Set(rules.map((r) => r.gatilho))].sort();

for (const g of gatilhos) {
  const re = new RegExp(`["']${g}["']`, "g");
  const indices = [];
  let m;
  while ((m = re.exec(routes)) !== null) indices.push(m.index);
  const contexts = indices.slice(0, 3).map((i) => {
    const start = Math.max(0, routes.lastIndexOf("\n", i - 120) + 1);
    const end = routes.indexOf("\n", i + 80);
    return routes.slice(start, end === -1 ? i + 120 : end).trim().slice(0, 200);
  });
  const ruleCount = rules.filter((r) => r.gatilho === g).length;
  console.log(`\n### ${g} (${ruleCount} regra(s), ${indices.length} ref(s) no código)`);
  contexts.forEach((c, j) => console.log(`  [${j + 1}] ${c.replace(/\s+/g, " ")}`));
}
