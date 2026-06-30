/**
 * Fase 2 push: resolução de rota de clique (gatilho / destino / módulo) e payload FCM.
 */

export type PushRuleUrlSource = {
  url?: string | null;
  gatilho?: string | null;
  destino_tela?: string | null;
  destino_roles?: string[] | null;
  modulo_alvo?: string | null;
};

export type PushClickResolveContext = {
  gatilho?: string | null;
  userType?: string | null;
  vertente?: string | null;
  modulo?: string | null;
};

/** Gatilhos informativos — sem URL de clique. */
export const PUSH_GATILHOS_SEM_CLIQUE = new Set(["senha_alterada", "manual"]);

const MARKETING_DEV_GATILHOS = new Set([
  "marketing_metricas_atualizadas",
  "instagram_sync_falhou",
  "instagram_token_expirado",
  "notificacao_manual_enviada",
  "notificacao_manual_falhou",
  "campanha_cadastrada",
]);

const TECH_DEV_GATILHOS = new Set([
  "api_error",
  "cron_falhou",
  "firebase_token_invalido",
  "webhook_falhou",
  "integracao_falhou",
  "erro_critico_sistema",
  "alteracao_sensivel",
  "stripe_sync_falhou",
  "dinamize_sync_falhou",
  "cielo_falhou",
  "gcs_upload_falhou",
]);

/** Rotas explícitas por gatilho (prioridade sobre destino_tela, exceto sem-clique). */
export const PUSH_URL_BY_GATILHO: Record<string, string> = {
  termos_pendentes: "/termos-servicos",
  termos_aceitos: "/termos-servicos",
  lembrete_checkin: "/tdoador",
  exclusao_chamada_solicitada: "/admin/solicitacoes-exclusao",
  presenca_confirmada_aluno: "/aluno",
  falta_registrada_aluno: "/aluno",
  aula_aluno_proxima: "/aluno",
  turma_aluno_alterada: "/aluno",
  aluno_primeiro_acesso: "/aluno",
  lance_recebido: "/meus-lances",
  lance_superado: "/meus-lances",
  lance_vencedor: "/meus-lances",
  novo_lance_leilao: "/beneficios",
  leilao_encerrado: "/beneficios",
  leilao_encerrando: "/beneficios",
  novo_beneficio: "/beneficios",
  missao_concluida: "/missoes",
  nova_missao: "/missoes",
  conquista_liberada: "/tdoador",
  gritos_creditados: "/tdoador",
  gritos_utilizados: "/tdoador",
  gritos_doacao_confirmada: "/tdoador",
  primeiro_acesso_realizado: "/tdoador",
  doacao_confirmada: "/tdoador",
  doador_cadastrado: "/tdoador",
  doacao_recusada: "/pagamentos",
  cartao_expirando: "/pagamentos",
  plano_alterado: "/tdoador",
  assinatura_cancelada: "/reativar-assinatura",
  doador_inadimplente_5_dias: "/pagamentos",
  doador_inadimplente_7_dias: "/pagamentos",
  doador_inadimplente_15_dias: "/pagamentos",
  doador_inadimplente_30_dias: "/pagamentos",
  doador_inadimplente_60_dias: "/pagamentos",
  doador_inadimplente_180_dias: "/pagamentos",
  doador_inadimplente_365_dias: "/pagamentos",
  usuario_cadastrado: "/administrador",
  usuario_bloqueado: "/administrador",
  usuario_desbloqueado: "/administrador",
  permissao_alterada: "/administrador",
  cadastro_incompleto: "/coordenador",
  catraca_offline: "/dev",
  politica_privacidade_atualizada: "/politica-privacidade",
  relatorio_impacto_publicado: "/impacto",
  correcao_chamada_solicitada: "/admin/solicitacoes-exclusao",
  marketing_metricas_atualizadas: "/dev/marketing",
  instagram_sync_falhou: "/dev/marketing",
  instagram_token_expirado: "/dev/marketing",
  notificacao_manual_enviada: "/dev/marketing",
  notificacao_manual_falhou: "/dev/marketing",
  campanha_cadastrada: "/dev/marketing",
};

const PUSH_URL_BY_DESTINO_TELA: Record<string, string> = {
  doador: "/tdoador",
  aluno: "/aluno",
  professor: "/professor",
  monitor: "/monitor",
  coordenador: "/coordenador",
  administrador: "/administrador",
  dev: "/dev",
  conselho: "/conselho",
  todos: "/",
};

const PUSH_URL_BY_MODULO: Record<string, string> = {
  doador: "/tdoador",
  aluno: "/aluno",
  professor: "/professor",
  monitor: "/monitor",
  admin: "/administrador",
  pec: "/coordenador/esporte-cultura",
  inclusao: "/coordenador/inclusao-produtiva",
  psico: "/coordenador/psicossocial",
};

const INDICADOR_ROLES_BY_MODULO: Record<string, string[]> = {
  pec: ["coordenador_pec", "super_admin", "dev", "desenvolvedor", "leo"],
  inclusao: ["coordenador_inclusao", "super_admin", "dev", "desenvolvedor", "leo"],
  psico: ["coordenador_psico", "coordenador_psicossocial", "super_admin", "dev", "desenvolvedor", "leo"],
  admin: ["super_admin", "dev", "desenvolvedor", "leo"],
};

function normalizePath(path: string): string {
  const t = path.trim();
  if (!t) return "/";
  if (/^https?:\/\//i.test(t)) return t;
  return t.startsWith("/") ? t : `/${t}`;
}

function resolveMonitorVertenteUrl(vertente?: string | null): string {
  const v = (vertente || "").toLowerCase();
  if (v === "inclusao") return "/monitor/inclusao";
  return "/monitor/pec";
}

function resolveHistoriaClickUrl(userType?: string | null): string {
  const role = (userType || "").toLowerCase();
  if (role === "conselho" || role === "conselheiro") return "/conselho";
  if (role === "patrocinador") return "/patrocinador";
  return "/impacto";
}

/** Meta batida — leva cada papel à tela onde vê indicadores/metas. */
function resolveMetaBatidaClickUrl(
  userType?: string | null,
  vertente?: string | null,
  modulo?: string | null
): string {
  const role = (userType || "").toLowerCase();
  const v = (vertente || "").toLowerCase();
  const mod = (modulo || "").toLowerCase();

  if (role === "doador" || role === "leo" || role === "user") return "/impacto";
  if (role === "conselho" || role === "conselheiro") return "/conselho";
  if (role === "patrocinador") return "/patrocinador-dashboard";

  if (role.includes("monitor")) {
    if (mod === "inclusao" || v.includes("inclus") || role.includes("inclusao")) return "/monitor/inclusao";
    if (mod === "psico" || v.includes("psico") || role.includes("psico")) return "/monitor/psico";
    return "/monitor/pec";
  }
  if (role.includes("professor")) {
    if (mod === "inclusao" || v.includes("inclus") || role.includes("inclusao")) return "/professor/inclusao";
    if (mod === "psico" || v.includes("psico") || role.includes("psico")) return "/professor/psico";
    return "/professor/pec";
  }
  if (role.includes("coordenador")) {
    if (mod === "inclusao" || v.includes("inclus") || role.includes("inclusao")) return "/coordenador/inclusao-produtiva";
    if (mod === "psico" || v.includes("psico") || role.includes("psico")) return "/coordenador/psicossocial";
    return "/coordenador/esporte-cultura";
  }

  if (role === "super_admin" || role === "admin" || role === "dev" || role === "desenvolvedor" || role === "dev-marketing") {
    return "/dashboard/gestao/vista";
  }

  return "/dashboard/gestao/vista";
}

/** Foto pendente no cadastro — equipe abre área de gestão do aluno, não o portal do aluno. */
function resolveFotoAlunoPendenteClickUrl(userType?: string | null, vertente?: string | null): string {
  const role = (userType || "").toLowerCase();
  const v = (vertente || "").toLowerCase();

  if (role.includes("monitor")) {
    if (v.includes("inclus") || role.includes("inclusao")) return "/monitor/inclusao";
    return "/monitor/pec";
  }
  if (role.includes("professor")) {
    if (v.includes("inclus") || role.includes("inclusao")) return "/professor/inclusao";
    return "/professor/pec";
  }
  if (role.includes("coordenador")) {
    if (v.includes("inclus") || role.includes("inclusao")) return "/coordenador/inclusao-produtiva";
    if (role.includes("psico")) return "/coordenador/psicossocial";
    return "/coordenador/esporte-cultura";
  }
  return "/coordenador/esporte-cultura";
}

function resolveIndicadorClickUrl(userType?: string | null, modulo?: string | null): string {
  const role = (userType || "").toLowerCase();
  const mod = (modulo || "").toLowerCase();

  if (role === "dev" || role === "desenvolvedor") return "/dev";
  if (role === "super_admin" || role === "leo" || role === "admin") return "/administrador";

  if (mod === "inclusao" || role.includes("inclusao")) return "/coordenador/inclusao-produtiva";
  if (mod === "psico" || role.includes("psico")) return "/coordenador/psicossocial";
  if (mod === "pec" || role.includes("pec")) return "/coordenador/esporte-cultura";

  return "/dashboard/gestao/vista";
}

/** Infere rota por papéis (PEC / Inclusão / Psico). */
export function resolvePushUrlByRoles(destino_roles?: string[] | null): string | undefined {
  const roles = destino_roles || [];
  if (!roles.length) return undefined;

  const has = (frag: string) => roles.some((r) => r.includes(frag));

  if (has("monitor")) {
    if (has("inclusao")) return "/monitor/inclusao";
    if (has("psico")) return "/monitor/psico";
    return "/monitor/pec";
  }
  if (has("professor")) {
    if (has("inclusao")) return "/professor/inclusao";
    return "/professor/pec";
  }
  if (has("coordenador")) {
    if (has("inclusao")) return "/coordenador/inclusao-produtiva";
    if (has("psico")) return "/coordenador/psicossocial";
    return "/coordenador/esporte-cultura";
  }
  if (roles.some((r) => r === "dev-marketing" || r === "dev-admin")) {
    return "/dev/marketing";
  }
  if (roles.some((r) => r === "dev" || r === "desenvolvedor")) {
    return "/dev";
  }
  if (roles.some((r) => r === "admin" || r === "leo" || r === "super_admin")) {
    return "/administrador";
  }
  if (roles.some((r) => r === "aluno" || r === "student")) {
    return "/aluno";
  }
  if (roles.some((r) => r === "doador" || r === "leo" || r === "user")) {
    return "/tdoador";
  }
  return undefined;
}

export function resolveIndicadorDestinoRoles(modulo?: string | null): string[] | undefined {
  const mod = (modulo || "").toLowerCase();
  return INDICADOR_ROLES_BY_MODULO[mod];
}

/** Caminho relativo de clique para uma regra (sem host). */
export function resolvePushClickPath(
  rule: PushRuleUrlSource,
  ctx?: PushClickResolveContext
): string | undefined {
  const gatilho = (ctx?.gatilho || rule.gatilho || "").trim();

  if (gatilho && PUSH_GATILHOS_SEM_CLIQUE.has(gatilho)) {
    return undefined;
  }

  if (gatilho === "historia_sucesso_publicada" || gatilho === "historia_sucesso_atualizada") {
    return resolveHistoriaClickUrl(ctx?.userType);
  }

  if (
    gatilho === "aluno_chegou" ||
    gatilho === "aluno_nao_identificado" ||
    gatilho === "scanner_aluno_sem_turma" ||
    gatilho === "catraca_aluno_sem_turma"
  ) {
    return resolveMonitorVertenteUrl(ctx?.vertente);
  }

  if (gatilho === "indicador_sem_dados") {
    return resolveIndicadorClickUrl(ctx?.userType, ctx?.modulo || rule.modulo_alvo);
  }

  if (gatilho === "meta_batida") {
    return resolveMetaBatidaClickUrl(ctx?.userType, ctx?.vertente, ctx?.modulo);
  }

  if (gatilho === "foto_aluno_pendente") {
    return resolveFotoAlunoPendenteClickUrl(ctx?.userType, ctx?.vertente);
  }

  if (gatilho && TECH_DEV_GATILHOS.has(gatilho)) {
    return "/dev";
  }

  if (gatilho && MARKETING_DEV_GATILHOS.has(gatilho)) {
    return "/dev/marketing";
  }

  const explicit = rule.url?.trim();
  if (explicit) return normalizePath(explicit);

  if (gatilho && PUSH_URL_BY_GATILHO[gatilho]) {
    return normalizePath(PUSH_URL_BY_GATILHO[gatilho]);
  }

  const byRoles = resolvePushUrlByRoles(rule.destino_roles);
  if (byRoles) return byRoles;

  const modulo = (ctx?.modulo || rule.modulo_alvo || "").toLowerCase();
  if (modulo && PUSH_URL_BY_MODULO[modulo]) {
    return PUSH_URL_BY_MODULO[modulo];
  }

  const destino = (rule.destino_tela || "").toLowerCase();
  if (destino && PUSH_URL_BY_DESTINO_TELA[destino]) {
    return PUSH_URL_BY_DESTINO_TELA[destino];
  }

  return undefined;
}

export function getAppPublicBaseUrl(): string {
  const appUrl = process.env.APP_URL?.trim();
  if (appUrl) return appUrl.replace(/\/$/, "");
  const publicUrl = process.env.PUBLIC_APP_URL?.trim();
  if (publicUrl) return publicUrl.replace(/\/$/, "");
  const replit = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  if (replit) return `https://${replit}`;
  return "";
}

/** URL absoluta para FCM/webpush (clique no SW). */
export function toAbsolutePushUrl(pathOrUrl: string | null | undefined, baseUrl?: string): string | undefined {
  const raw = (pathOrUrl || "").trim();
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  const path = normalizePath(raw);
  const base = (baseUrl ?? getAppPublicBaseUrl()).replace(/\/$/, "");
  if (base) return `${base}${path}`;
  return path;
}

export function resolvePushClickUrl(
  rule: PushRuleUrlSource,
  baseUrl?: string,
  ctx?: PushClickResolveContext
): string | undefined {
  const path = resolvePushClickPath(rule, ctx);
  if (!path) return undefined;
  return toAbsolutePushUrl(path, baseUrl);
}

export type FcmWebPushParts = {
  webpush: {
    notification: Record<string, unknown>;
    fcmOptions?: { link: string };
  };
  data: Record<string, string>;
};

export function buildFcmWebPushParts(params: {
  title: string;
  body: string;
  clickUrl?: string | null;
  iconUrl: string;
  badgeUrl: string;
}): FcmWebPushParts {
  const clickUrl = params.clickUrl?.trim() || undefined;
  const data: Record<string, string> = {
    title: params.title,
    body: params.body,
  };
  if (clickUrl) data.url = clickUrl;

  return {
    webpush: {
      notification: {
        title: params.title,
        body: params.body,
        icon: params.iconUrl,
        badge: params.badgeUrl,
        vibrate: [200, 100, 200],
        ...(clickUrl ? { data: { url: clickUrl } } : {}),
      },
      ...(clickUrl ? { fcmOptions: { link: clickUrl } } : {}),
    },
    data,
  };
}

export function buildFcmTokenMessage(params: {
  token: string;
  title: string;
  body: string;
  clickUrl?: string | null;
  iconUrl: string;
  badgeUrl: string;
}) {
  const parts = buildFcmWebPushParts(params);
  return {
    token: params.token,
    ...parts,
  };
}
