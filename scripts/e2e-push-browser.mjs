/**
 * E2E UI: Dev Marketing → Push (registro + contagem)
 * Requer: servidor em http://localhost:4000 e playwright chromium
 */
import { readFileSync, existsSync } from "fs";
import pg from "pg";

function loadEnv() {
  if (!existsSync(".env.local-test")) return;
  for (const line of readFileSync(".env.local-test", "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[t.slice(0, i)]) process.env[t.slice(0, i)] = v;
  }
}
loadEnv();

const BASE = process.env.E2E_BASE_URL || "http://localhost:4000";

async function getMarketingCreds() {
  const pool = new pg.Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5433),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: false,
  });
  const r = await pool.query(
    `SELECT usuario, senha FROM developers WHERE tipo = 'marketing' AND ativo IS NOT FALSE LIMIT 1`
  );
  await pool.end();
  if (!r.rows[0]) throw new Error("Sem dev marketing no banco");
  return r.rows[0];
}

async function main() {
  const { chromium } = await import("playwright");
  const creds = await getMarketingCreds();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ permissions: ["notifications"] });
  const page = await context.newPage();

  const results = { steps: [], errors: [] };

  try {
    await page.goto(`${BASE}/dev/login`, { waitUntil: "networkidle", timeout: 60000 });
    await page.fill('input[type="text"], input:not([type="password"])', creds.usuario);
    await page.fill('input[type="password"]', String(creds.senha));
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dev/, { timeout: 30000 });
    results.steps.push("Login dev/marketing OK");

    await page.goto(`${BASE}/dev/marketing`, { waitUntil: "networkidle", timeout: 60000 });
    await page.getByRole("button", { name: /push-notifications|notificações push/i }).click({ timeout: 15000 }).catch(async () => {
      await page.getByText(/notificações push/i).first().click();
    });
    await page.waitForTimeout(1500);
    results.steps.push("Acesso Dev Marketing → Push OK");

    const totalBefore = await page.locator("text=Total").locator("..").locator(".text-2xl").first().textContent().catch(() => "?");

    await page.getByRole("button", { name: /registrar este navegador/i }).click({ timeout: 10000 });
    await page.waitForTimeout(5000);

    const toast = await page.locator("[role='status'], .toast, [data-state='open']").first().textContent({ timeout: 8000 }).catch(() => "");
    if (/registrado|sucesso/i.test(toast || "")) results.steps.push("Toast de registro OK");
    else results.errors.push(`Toast registro: ${toast || "(não detectado)"}`);

    await page.waitForTimeout(2000);
    const totalAfter = await page.locator("text=Total").locator("..").locator(".text-2xl").first().textContent().catch(() => "?");
    results.steps.push(`Contagem tokens: antes=${totalBefore} depois=${totalAfter}`);

    // Notificação nativa do browser (se permissão concedida e FCM retornou token)
    const notifGranted = await page.evaluate(() => Notification.permission);
    results.steps.push(`Notification.permission=${notifGranted}`);
  } catch (e) {
    results.errors.push(e.message);
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(results, null, 2));
  process.exit(results.errors.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
