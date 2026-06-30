/** Lista gatilho → rota de clique */
import { readFileSync } from "fs";
import { resolvePushClickPath } from "../server/pushClickUrls.ts";

const rules = JSON.parse(readFileSync("scripts/_push-rules-active.json", "utf8"));

const TELA = {
  "/": "Home / planos",
  "/tdoador": "Home do doador (check-in, gritos)",
  "/aluno": "Portal do aluno",
  "/professor": "Área do professor",
  "/professor/pec": "Professor PEC",
  "/professor/inclusao": "Professor Inclusão",
  "/monitor": "Área do monitor",
  "/monitor/pec": "Monitor PEC",
  "/monitor/inclusao": "Monitor Inclusão",
  "/monitor/psico": "Monitor psicossocial",
  "/coordenador": "Área do coordenador",
  "/coordenador/esporte-cultura": "Coordenador PEC",
  "/coordenador/inclusao-produtiva": "Coordenador Inclusão",
  "/coordenador/psicossocial": "Coordenador psicossocial",
  "/administrador": "Painel administrador",
  "/admin/solicitacoes-exclusao": "Solicitações exclusão chamada",
  "/dev/marketing": "Dev marketing",
  "/termos-servicos": "Termos de uso",
  "/politica-privacidade": "Política de privacidade",
  "/meus-dados": "Meus dados (LGPD)",
  "/configuracoes": "Configurações",
  "/pagamentos": "Pagamentos",
  "/subscriptions": "Assinatura",
  "/reativar-assinatura": "Reativar assinatura",
  "/beneficios": "Benefícios / leilões",
  "/meus-lances": "Meus lances",
  "/missoes": "Missões",
  "/noticias": "Notícias",
  "/scanner": "Scanner / catraca",
  "/conselho": "Conselho",
  "/painel/estrategico/lancamento": "Painel estratégico",
};

for (const r of rules.sort((a, b) => a.gatilho.localeCompare(b.gatilho))) {
  const path = resolvePushClickPath(r) || "—";
  const tela = TELA[path] || path;
  const status = r.ativo === false ? "INATIVA" : "ativa";
  console.log(`${r.gatilho}\t${path}\t${tela}\t${status}`);
}
