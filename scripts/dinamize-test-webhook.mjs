/**
 * POST de teste — recusa total LGPD (contato novo).
 * Uso: npx dotenv-cli -e .env.local-test -- node scripts/dinamize-test-webhook.mjs
 */
const url = process.env.DINAMIZE_WEBHOOK_URL?.trim();
if (!url) {
  console.error("DINAMIZE_WEBHOOK_URL não configurada");
  process.exit(1);
}

const payload = {
  email: "teste.lgpd.recusa@teste.com",
  nome: "Teste LGPD Recusa",
  telefone: "5531999999999",
  status_doador: "ativo",
  plano: "mensal",
  valor_doacao: 50,
  origem: "clube_do_grito",
  data_entrada: "2026-06-05",
  stripe_customer_id: "cus_teste_lgpd_recusa",
  id_usuario_clube: "teste_lgpd_recusa_001",
  tipo_evento: "consent_update",
  marketing_automation_blocked: true,
  allow_marketing_campaigns: false,
  allow_relationship_campaigns: false,
  optin_email: false,
  optin_marketing: false,
  optin_communications: false,
  sync_intent: "consent_update",
};

console.log("POST Dinamize — recusa total LGPD");
console.log(JSON.stringify(payload, null, 2));

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(payload),
});

const body = await res.text();
console.log("\nHTTP", res.status, res.statusText);
console.log("Resposta:", body || "(vazia)");

process.exit(res.ok ? 0 : 1);
