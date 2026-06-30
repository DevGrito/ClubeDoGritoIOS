import { readFileSync, writeFileSync } from "fs";

const rules = JSON.parse(readFileSync("scripts/_push-rules-active.json", "utf8"));
const routes = readFileSync("server/routes.ts", "utf8");

/** Heurística: trecho após o gatilho no código */
function findTriggerContext(gatilho) {
  const patterns = [
    new RegExp(`firePushRulesByTrigger\\(\\s*["']${gatilho}["']`, "g"),
    new RegExp(`fr\\(\\s*["']${gatilho}["']`, "g"),
    new RegExp(`["']${gatilho}["']`, "g"),
  ];
  const hits = [];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(routes)) !== null) {
      const line = routes.slice(0, m.index).split("\n").length;
      const chunk = routes.slice(Math.max(0, m.index - 400), m.index + 200);
      let when = "disparo no código";
      if (/cron\.schedule/.test(chunk)) when = "CRON agendado";
      else if (/PUSH-CRON/.test(chunk)) when = "job CRON push";
      else if (/POST|app\.(post|put|patch|delete)/i.test(chunk)) when = "ação HTTP/API";
      else if (/scanner|catraca/i.test(chunk)) when = "scanner/catraca";
      else if (/login/i.test(chunk)) when = "login";
      hits.push({ line, when });
    }
  }
  const uniq = new Map();
  for (const h of hits) uniq.set(`${h.line}:${h.when}`, h);
  return [...uniq.values()].slice(0, 5);
}

const TRIGGER_WHEN = {
  termos_pendentes: "CRON: segunda-feira 9h BRT — staff/users e alunos (PEC + Inclusão) sem termos/privacidade na versão exigida",
  foto_aluno_pendente: "CRON sexta 10h BRT — agrupa por turma; 1 push com quantidade para equipe",
  cadastro_incompleto: "CRON — cadastros sem CPF/nome; push para equipe da turma",
  baixa_frequencia_aluno: "CRON — frequência abaixo do limiar; equipe da turma",
  risco_evasao: "CRON — indicadores de evasão; equipe da turma",
  aluno_faltas_consecutivas: "CRON — 3+ faltas seguidas; equipe da turma",
  aula_proxima: "CRON a cada 15 min — aula do professor em ~30 min (users.id)",
  aula_aluno_proxima: "CRON a cada 15 min — aula do aluno em ~30 min (CPF)",
  chamada_disponivel: "CRON a cada 15 min — chamada aberta para professor (users.id)",
  chamada_pendente: "CRON 20h BRT — aulas do dia sem chamada finalizada",
  chamada_nao_finalizada: "CRON 20h BRT — alias fluxo chamadas pendentes",
  catraca_saida_pendente: "CRON — saídas na catraca não confirmadas",
  atividade_professor_pendente: "CRON — professor com atividade pedagógica em aberto",
  lembrete_checkin: "CRON 10h, 14h e 19h BRT — doadores sem check-in no dia",
  leilao_encerrando: "CRON a cada 30 min — leilão encerra em até 1h (broadcast doador)",
  inadimplencia: "CRON 9h BRT — doadores inadimplentes",
  meta_batida: "CRON 8h BRT — cada indicador GV (mensal + anual); broadcast impacto/equipe/técnico",
  indicador_sem_dados: "CRON 9h BRT — indicador do conselho zerado",
  aluno_chegou: "Scanner presença (PEC/Inclusão) — entrada na turma; equipe via targetUserKeys",
  presenca_catraca_registrada: "Scanner presença — equipe da turma",
  presenca_confirmada_aluno: "Scanner presença — aluno (CPF)",
  senha_alterada: "Alteração de senha (staff ou aluno)",
  primeiro_acesso_realizado: "Primeiro login com token FCM registrado",
  aluno_primeiro_acesso: "Login portal aluno (gatilho pode variar no código)",
  termos_aceitos: "POST /api/aceitar-termos",
  lance_recebido: "Novo lance em benefício/leilão — dono do lance anterior",
  lance_superado: "Lance superado no leilão",
  nova_missao: "Nova missão publicada — broadcast doadores",
  novo_beneficio: "Novo benefício — broadcast doadores",
  historia_sucesso_publicada: "História publicada — broadcast doadores",
  historia_sucesso_atualizada: "História atualizada — broadcast doadores",
  correcao_chamada_solicitada: "Solicitação de correção de chamada — monitores da turma",
  chamada_editada_manual: "Chamada editada manualmente — equipe da turma",
  turma_professor_alterada: "Professor da turma alterado — users.id do professor",
  firebase_token_invalido: "Token FCM inválido detectado no envio",
  cron_falhou: "Falha em job CRON (alerta técnico)",
  integracao_falhou: "Falha de integração externa",
  erro_critico_sistema: "Erro crítico capturado",
};

const out = rules.map((r) => ({
  id: r.id,
  nome: r.nome,
  gatilho: r.gatilho,
  titulo: r.titulo,
  mensagem: r.mensagem,
  destino_tela: r.destino_tela,
  destino_roles: r.destino_roles,
  url: r.url,
  cooldown_minutos: r.cooldown_minutos,
  modulo_alvo: r.modulo_alvo,
  quando_dispara:
    TRIGGER_WHEN[r.gatilho] ||
    findTriggerContext(r.gatilho)
      .map((h) => `linha ~${h.line} (${h.when})`)
      .join("; ") ||
    "gatilho definido na regra; disparo depende de evento no sistema",
}));

writeFileSync("scripts/_push-catalog.json", JSON.stringify(out, null, 2), "utf8");
console.log("catalog:", out.length, "regras");
