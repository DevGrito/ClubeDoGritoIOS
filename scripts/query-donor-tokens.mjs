import pg from "pg";
import { readFileSync, existsSync } from "fs";
if (existsSync(".env.local-test")) {
  for (const line of readFileSync(".env.local-test", "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[t.slice(0, i)] = v;
  }
}
const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5433),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: false,
});
const r = await pool.query(
  `SELECT COUNT(*)::int AS total FROM fcm_tokens WHERE ativo = true AND user_type = ANY(ARRAY['doador','leo'])`
);
console.log("donor_active_tokens", r.rows[0].total);
await pool.end();
