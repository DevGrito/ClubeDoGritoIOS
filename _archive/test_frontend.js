
// Testar JavaScript direto no frontend
const testData = {
  name: "Projeto Teste JS",
  description: "Teste via JS",
  category: "SCFV",
  who_can_participate: "Teste",
  period_start: null,
  period_end: null
};

fetch("/api/projects", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(testData),
  credentials: "include"
}).then(r => r.json()).then(console.log).catch(console.error);

