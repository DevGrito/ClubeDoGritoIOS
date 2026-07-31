import { getApps, initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import type { Pool } from "pg";
import {
  buildFcmWebPushParts,
  toAbsolutePushUrl,
} from "./pushClickUrls";

/** Papéis autorizados a disparar push administrativo / consultar tokens */
export const PUSH_ADMIN_ROLES = [
  "dev",
  "dev-marketing",
  "desenvolvedor",
  "dev-admin",
  "admin",
  "super_admin",
  "leo",
] as const;

const INVALID_FCM_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

let firebaseInitLogged = false;

export function maskFcmToken(token: string): string {
  if (!token || token.length < 16) return "(token-invalido)";
  return `${token.slice(0, 12)}...`;
}

export function getFirebaseAdminApp() {
  const apps = getApps();
  if (apps.length > 0) return apps[0]!;

  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (serviceAccountRaw) {
    try {
      const serviceAccount = JSON.parse(serviceAccountRaw);
      const projectId = serviceAccount?.project_id || "(sem project_id)";
      const app = initializeApp({ credential: cert(serviceAccount) });
      if (!firebaseInitLogged) {
        console.log(`[Firebase Admin] Inicializado via FIREBASE_SERVICE_ACCOUNT (project_id=${projectId})`);
        firebaseInitLogged = true;
      }
      return app;
    } catch (err: any) {
      console.error("[Firebase Admin] FIREBASE_SERVICE_ACCOUNT inválido:", err?.message || err);
      throw new Error("FIREBASE_SERVICE_ACCOUNT inválido ou mal formatado");
    }
  }

  const gacPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (gacPath) {
    const app = initializeApp({ credential: applicationDefault() });
    if (!firebaseInitLogged) {
      console.log(`[Firebase Admin] Inicializado via GOOGLE_APPLICATION_CREDENTIALS (${gacPath})`);
      firebaseInitLogged = true;
    }
    return app;
  }

  throw new Error(
    "Nenhuma credencial Firebase Admin disponível (FIREBASE_SERVICE_ACCOUNT ou GOOGLE_APPLICATION_CREDENTIALS)"
  );
}

export type FcmSendSummary = {
  totalTokens: number;
  enviados: number;
  falhas: number;
  tokensInvalidosRemovidos: number;
};

export async function sendFcmMulticast(
  dbPool: Pool,
  tokens: string[],
  payload: { title: string; body: string; url?: string },
  iconUrl: string,
  badgeUrl: string,
  rejectedPushTokens?: Set<string>
): Promise<FcmSendSummary> {
  const totalTokens = tokens.length;
  if (totalTokens === 0) {
    return { totalTokens: 0, enviados: 0, falhas: 0, tokensInvalidosRemovidos: 0 };
  }

  const adminApp = getFirebaseAdminApp();
  const messaging = getMessaging(adminApp);

  const clickUrl = toAbsolutePushUrl(payload.url);

  const parts = buildFcmWebPushParts({
    title: payload.title,
    body: payload.body,
    clickUrl,
    iconUrl,
    badgeUrl,
  });

  const message: any = {
    tokens,
    ...parts,
  };

  const response = await messaging.sendEachForMulticast(message);
  const invalidTokens: string[] = [];

  response.responses.forEach((r, i) => {
    if (r.success) return;
    const errCode = r.error?.code || "";
    if (INVALID_FCM_CODES.has(errCode)) {
      invalidTokens.push(tokens[i]);
    }
    console.warn(
      `[Push/FCM] Falha token ${maskFcmToken(tokens[i])} code=${errCode || "unknown"}`
    );
  });

  let tokensInvalidosRemovidos = 0;
  if (invalidTokens.length > 0) {
    await dbPool.query(
      "UPDATE fcm_tokens SET ativo = false, falhou_em = NOW(), updated_at = NOW() WHERE token = ANY($1)",
      [invalidTokens]
    );
    tokensInvalidosRemovidos = invalidTokens.length;
    invalidTokens.forEach((t) => rejectedPushTokens?.add(t));
    console.log(`[Push/FCM] ${tokensInvalidosRemovidos} token(s) marcado(s) como inativo(s)`);
  }

  return {
    totalTokens,
    enviados: response.successCount,
    falhas: response.failureCount,
    tokensInvalidosRemovidos,
  };
}

export async function sendFcmToSingleToken(
  token: string,
  payload: { title: string; body: string; url?: string },
  iconUrl: string,
  badgeUrl: string
): Promise<{ accepted: boolean; messageId?: string; errorCode?: string; errorMessage?: string }> {
  const adminApp = getFirebaseAdminApp();
  const messaging = getMessaging(adminApp);
  try {
    const clickUrl = toAbsolutePushUrl(payload.url);
    const parts = buildFcmWebPushParts({
      title: payload.title,
      body: payload.body,
      clickUrl,
      iconUrl,
      badgeUrl,
    });
    const messageId = await messaging.send({
      token,
      ...parts,
    });
    return { accepted: true, messageId };
  } catch (err: any) {
    const errorCode = err?.code || err?.errorInfo?.code || "unknown";
    return {
      accepted: false,
      errorCode,
      errorMessage: String(err?.message || "FCM error").slice(0, 200),
    };
  }
}

/** Valida corpo do registro de token FCM */
export function validateRegisterTokenBody(body: any): { ok: true; data: RegisterTokenPayload } | { ok: false; error: string } {
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const userKey = typeof body?.userKey === "string" ? body.userKey.trim() : String(body?.userKey ?? "").trim();
  const userType = typeof body?.userType === "string" ? body.userType.trim() : "";
  const platform = typeof body?.platform === "string" ? body.platform.trim() : "web";
  const nome = typeof body?.nome === "string" ? body.nome.trim().slice(0, 200) : null;
  const userAgent = typeof body?.userAgent === "string" ? body.userAgent.trim().slice(0, 512) : null;
  const pushEndpoint = typeof body?.pushEndpoint === "string" ? body.pushEndpoint.trim().slice(0, 2048) : null;
  const pushP256dh = typeof body?.pushP256dh === "string" ? body.pushP256dh.trim().slice(0, 512) : null;
  const pushAuth = typeof body?.pushAuth === "string" ? body.pushAuth.trim().slice(0, 256) : null;
  const userConsent = body?.userConsent === true;

  if (!token || token.length < 20 || token.length > 4096) {
    return { ok: false, error: "token FCM inválido" };
  }
  if (!userKey || userKey.length > 128) {
    return { ok: false, error: "userKey é obrigatório" };
  }
  if (!userType || userType.length > 64) {
    return { ok: false, error: "userType é obrigatório" };
  }
  if (!["web", "android", "ios"].includes(platform)) {
    return { ok: false, error: "platform deve ser web, android ou ios" };
  }

  return {
    ok: true,
    data: { token, userKey, userType, platform, nome, userAgent, pushEndpoint, pushP256dh, pushAuth, userConsent },
  };
}

export type RegisterTokenPayload = {
  token: string;
  userKey: string;
  userType: string;
  platform: string;
  nome: string | null;
  userAgent: string | null;
  pushEndpoint: string | null;
  pushP256dh: string | null;
  pushAuth: string | null;
  userConsent: boolean;
};

/** Gatilhos cujo destinatário direto é aluno (user_key = CPF limpo) */
export const ALUNO_PUSH_TARGET_GATILHOS = new Set([
  "presenca_confirmada_aluno",
  "falta_registrada_aluno",
  "aula_aluno_proxima",
  "turma_aluno_alterada",
  "acolhimento_agendado",
  "acolhimento_serie_criada",
  "acolhimento_cancelado",
  "acolhimento_faltou",
  "acolhimento_lembrete_d1",
  "acolhimento_lembrete_2h",
  "acolhimento_frequencia_baixa",
]);

/** Broadcast intencional apenas para doadores (evita vazar para aluno/staff). */
export const DOADOR_BROADCAST_GATILHOS = new Set([
  "nova_missao",
  "novo_beneficio",
  "historia_sucesso_publicada",
  "historia_sucesso_atualizada",
  "leilao_encerrando",
]);

export const DOADOR_FCM_USER_TYPES = ["doador", "leo", "user"] as const;

export const TERMS_VERSION_REQUIRED = "2026-04-01";
export const PRIVACY_POLICY_VERSION_REQUIRED = "1.0";
export const COOKIE_POLICY_VERSION_REQUIRED = "1.0";

/** Versão legada ainda aceita em privacy_consents.terms_version */
export const TERMS_VERSION_LEGACY = "1.0";

/**
 * Condição SQL: termos de uso desatualizados OU sem registro de privacidade/cookies (via privacy_consents).
 * Requer JOIN com users (alias u) para o subselect de pc.user_id.
 */
export const SQL_STAFF_TERMOS_OU_PRIVACY_PENDENTE = `
  (
    $TERMOS_TABLE$.termos_uso_aceito_em IS NULL
    OR $TERMOS_TABLE$.termos_uso_versao IS DISTINCT FROM $1
    OR (
      u.id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM privacy_consents pc
        WHERE pc.user_id = u.id
          AND pc.privacy_policy_version = $2
          AND pc.cookie_policy_version = $3
          AND (pc.terms_version = $1 OR pc.terms_version = $4)
        ORDER BY pc.updated_at DESC
        LIMIT 1
      )
    )
  )
`;

export function sqlStaffTermosOuPrivacyPendente(termosTable: string): string {
  return SQL_STAFF_TERMOS_OU_PRIVACY_PENDENTE.replace(/\$TERMOS_TABLE\$/g, termosTable);
}

export type PushVertente = "pec" | "inclusao" | "psico";

const COORD_SETOR_BY_VERTENTE: Record<PushVertente, string[]> = {
  pec: ["esporte_cultura"],
  inclusao: ["inclusao_produtiva"],
  psico: ["psicossocial"],
};

/** Professores, monitores e coordenadores da vertente vinculados à turma. */
export async function resolveStaffUserKeysForTurma(
  dbPool: Pool,
  vertente: PushVertente,
  turmaId: number,
  includeCoordenadores: boolean = true
): Promise<string[]> {
  const keys = new Set<string>();

  if (vertente === "pec") {
    const profs = await dbPool.query<{ uid: string }>(
      `SELECT DISTINCT u.id::text AS uid
       FROM professor_turmas pt
       JOIN professores p ON p.id = pt.professor_id
       JOIN users u ON LOWER(TRIM(u.email)) = LOWER(TRIM(p.email))
       WHERE pt.turma_id = $1 AND pt.turma_tipo = 'pec' AND COALESCE(u.ativo, true) = true`,
      [turmaId]
    );
    profs.rows.forEach((r) => keys.add(r.uid));

    const mons = await dbPool.query<{ uid: string }>(
      `SELECT DISTINCT person_id::text AS uid
       FROM staff_assignments
       WHERE activity_instance_id = $1`,
      [turmaId]
    );
    mons.rows.forEach((r) => keys.add(r.uid));
  } else if (vertente === "inclusao") {
    const profs = await dbPool.query<{ uid: string }>(
      `SELECT DISTINCT uid FROM (
         SELECT ti.professor_id::text AS uid
         FROM turmas_inclusao ti
         WHERE ti.id = $1 AND ti.professor_id IS NOT NULL
         UNION
         SELECT u.id::text AS uid
         FROM professor_turmas pt
         JOIN professores p ON p.id = pt.professor_id
         JOIN users u ON LOWER(TRIM(u.email)) = LOWER(TRIM(p.email))
         WHERE pt.turma_id = $1 AND pt.turma_tipo = 'inclusao' AND COALESCE(u.ativo, true) = true
       ) profs WHERE uid IS NOT NULL`,
      [turmaId]
    );
    profs.rows.forEach((r) => keys.add(r.uid));

    const mons = await dbPool.query<{ uid: string }>(
      `SELECT DISTINCT mp.monitor_user_id::text AS uid
       FROM participantes_turmas pt
       JOIN monitor_participantes mp ON mp.inclusao_participante_id = pt.participante_id
       WHERE pt.turma_id = $1`,
      [turmaId]
    );
    mons.rows.forEach((r) => keys.add(r.uid));
  }

  if (includeCoordenadores) {
    const setores = COORD_SETOR_BY_VERTENTE[vertente];
    const coords = await dbPool.query<{ uid: string }>(
      `SELECT DISTINCT u.id::text AS uid
       FROM coordenadores c
       JOIN users u ON LOWER(TRIM(u.email)) = LOWER(TRIM(c.email))
       WHERE c.ativo = true AND c.setor = ANY($1) AND COALESCE(u.ativo, true) = true`,
      [setores]
    );
    coords.rows.forEach((r) => keys.add(r.uid));
  }

  return [...keys];
}

export async function resolveUsersIdByEmail(dbPool: Pool, email: string): Promise<number | null> {
  const r = await dbPool.query<{ id: number }>(
    `SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1)) LIMIT 1`,
    [email]
  );
  return r.rows[0]?.id ?? null;
}

export async function resolveUsersIdByProfessorId(dbPool: Pool, professorId: number): Promise<number | null> {
  const r = await dbPool.query<{ id: number }>(
    `SELECT u.id FROM professores p
     JOIN users u ON LOWER(TRIM(u.email)) = LOWER(TRIM(p.email))
     WHERE p.id = $1 LIMIT 1`,
    [professorId]
  );
  return r.rows[0]?.id ?? null;
}

export async function resolveUsersIdByCoordenadorId(dbPool: Pool, coordenadorId: number): Promise<number | null> {
  const r = await dbPool.query<{ id: number }>(
    `SELECT u.id FROM coordenadores c
     JOIN users u ON LOWER(TRIM(u.email)) = LOWER(TRIM(c.email))
     WHERE c.id = $1 LIMIT 1`,
    [coordenadorId]
  );
  return r.rows[0]?.id ?? null;
}

export async function resolveUsersIdByDeveloperId(dbPool: Pool, developerId: number): Promise<number | null> {
  const r = await dbPool.query<{ id: number }>(
    `SELECT u.id FROM developers d
     JOIN users u ON LOWER(TRIM(u.email)) = LOWER(TRIM(d.email))
     WHERE d.id = $1 LIMIT 1`,
    [developerId]
  );
  return r.rows[0]?.id ?? null;
}

export async function resolveUsersIdByMonitorEmail(dbPool: Pool, email: string): Promise<number | null> {
  return resolveUsersIdByEmail(dbPool, email);
}

export type SenhaAlteradaPushTarget = { userId?: number; userKey?: string };

export function senhaAlteradaVars(): Record<string, string> {
  return { data: new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) };
}

export function normalizeCpfKey(cpf: unknown): string | null {
  const digits = String(cpf ?? "").replace(/\D/g, "");
  return digits.length === 11 ? digits : null;
}

const PUSH_VAR_ALIASES: Record<string, string[]> = {
  nome: ["nome_aluno"],
  nome_aluno: ["nome"],
  percentual: ["frequencia"],
  frequencia: ["percentual"],
  titulo: ["leilao", "beneficio"],
  leilao: ["titulo", "beneficio"],
  beneficio: ["titulo", "leilao"],
  quantidade: ["total", "qtd"],
  total: ["quantidade", "qtd"],
  erro: ["mensagem", "descricao"],
  descricao: ["erro", "mensagem", "erro_resumido"],
  erro_resumido: ["erro", "descricao", "mensagem"],
  servico: ["integracao"],
  integracao: ["servico"],
  nome_catraca: ["unidade", "catraca"],
  unidade: ["nome_catraca", "catraca"],
  catraca: ["nome_catraca", "unidade"],
};

/** Unifica nomes de variáveis entre templates (banco) e disparos (código). */
export function expandPushVars(vars: Record<string, string>): Record<string, string> {
  const expanded: Record<string, string> = { ...vars };
  for (const [canonical, alts] of Object.entries(PUSH_VAR_ALIASES)) {
    const primary = expanded[canonical];
    if (primary != null && primary !== "") {
      for (const alt of alts) {
        if (expanded[alt] == null || expanded[alt] === "") expanded[alt] = primary;
      }
      continue;
    }
    for (const alt of alts) {
      if (expanded[alt] != null && expanded[alt] !== "") {
        expanded[canonical] = expanded[alt];
        break;
      }
    }
  }
  return expanded;
}

export type RenderPushTemplateResult = {
  titulo: string;
  mensagem: string;
  leftovers: string[];
};

const UNRESOLVED_PLACEHOLDER_RE = /\{\{[a-zA-Z0-9_]+\}\}/g;

/**
 * Substitui {{vars}} e {{nome}}; remove placeholders não resolvidos (evita {{quantidade}} no push).
 */
export function renderPushTemplate(
  titulo: string,
  mensagem: string,
  vars: Record<string, string>,
  recipientNome?: string | null,
  context?: { gatilho?: string; logLeftovers?: boolean }
): RenderPushTemplateResult {
  const expanded = expandPushVars(vars);
  let t = titulo;
  let m = mensagem;

  for (const [key, val] of Object.entries(expanded)) {
    const re = new RegExp(`\\{\\{${key}\\}\\}`, "gi");
    t = t.replace(re, String(val));
    m = m.replace(re, String(val));
  }

  const primeiroNome = (recipientNome || "").split(" ")[0] || "você";
  t = t.replace(/\{\{nome\}\}/gi, primeiroNome);
  m = m.replace(/\{\{nome\}\}/gi, primeiroNome);

  const leftovers = new Set<string>();
  for (const text of [t, m]) {
    const re = /\{\{([a-zA-Z0-9_]+)\}\}/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) leftovers.add(match[1]);
  }
  const leftoverArr = [...leftovers];
  if (leftoverArr.length && context?.logLeftovers !== false) {
    console.warn(
      `[PushTemplate] Gatilho "${context?.gatilho || "?"}": placeholders não preenchidos: ${leftoverArr.join(", ")}`
    );
  }

  const clean = (s: string) =>
    s.replace(UNRESOLVED_PLACEHOLDER_RE, "").replace(/\s{2,}/g, " ").trim();

  return { titulo: clean(t), mensagem: clean(m), leftovers: leftoverArr };
}

export type AlunoTermosRow = {
  termos_uso_versao: string | null;
  termos_uso_aceito_em: Date | string | null;
};

/** Termos do aluno por CPF (tabela aluno). Participante Inclusão sem linha em aluno = pendente. */
export async function fetchAlunoTermosByCpf(
  dbPool: Pool,
  cpf: string
): Promise<{ row: AlunoTermosRow | null; knownStudent: boolean }> {
  const cpfKey = normalizeCpfKey(cpf);
  if (!cpfKey) return { row: null, knownStudent: false };

  const alunoRes = await dbPool.query<AlunoTermosRow>(
    `SELECT termos_uso_versao, termos_uso_aceito_em FROM aluno
     WHERE REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') = $1 LIMIT 1`,
    [cpfKey]
  );
  if (alunoRes.rows[0]) return { row: alunoRes.rows[0], knownStudent: true };

  const inclRes = await dbPool.query(
    `SELECT 1 FROM participantes_inclusao pi
     WHERE REGEXP_REPLACE(pi.cpf, '[^0-9]', '', 'g') = $1
       AND pi.status IS DISTINCT FROM 'evadido' LIMIT 1`,
    [cpfKey]
  );
  return { row: null, knownStudent: inclRes.rows.length > 0 };
}

/**
 * Persiste aceite de termos em aluno (CPF).
 * Se não existir linha em aluno, espelha participante Inclusão ativo com mesmo CPF (sem alterar schema).
 */
export async function persistAlunoTermosAceiteByCpf(
  dbPool: Pool,
  cpf: string,
  versao: string,
  meta?: { ip?: string | null; userAgent?: string | null }
): Promise<"updated" | "inserted_from_inclusao" | "not_found"> {
  const cpfKey = normalizeCpfKey(cpf);
  if (!cpfKey) return "not_found";

  const ip = meta?.ip ?? null;
  const userAgent = meta?.userAgent ?? null;

  const updated = await dbPool.query(
    `UPDATE aluno SET termos_uso_aceito_em = NOW(), termos_uso_versao = $1, termos_ip = $3, termos_user_agent = $4
     WHERE REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') = $2`,
    [versao, cpfKey, ip, userAgent]
  );
  if ((updated.rowCount ?? 0) > 0) return "updated";

  const inclRes = await dbPool.query<{
    nome: string;
    genero: string;
    data_nascimento: string | null;
  }>(
    `SELECT nome, genero, data_nascimento FROM participantes_inclusao
     WHERE REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') = $1
       AND status IS DISTINCT FROM 'evadido' LIMIT 1`,
    [cpfKey]
  );
  if (!inclRes.rows.length) return "not_found";

  const p = inclRes.rows[0];
  await dbPool.query(
    `INSERT INTO aluno (cpf, nome_completo, data_nascimento, genero, area, termos_uso_aceito_em, termos_uso_versao, termos_ip, termos_user_agent)
     VALUES ($1, $2, COALESCE($3::date, '2000-01-01'::date), $4, 'inclusao', NOW(), $5, $6, $7)
     ON CONFLICT (cpf) DO UPDATE SET
       termos_uso_aceito_em = NOW(),
       termos_uso_versao = EXCLUDED.termos_uso_versao,
       termos_ip = EXCLUDED.termos_ip,
       termos_user_agent = EXCLUDED.termos_user_agent`,
    [cpfKey, p.nome, p.data_nascimento, p.genero, versao, ip, userAgent]
  );
  return "inserted_from_inclusao";
}

export type AlunoPushTarget = { targetUserKey: string; targetUserType: "aluno" };

/** Resolve CPF do aluno a partir de campos explícitos (sem users.id). */
export function resolveAlunoPushTarget(input: {
  cpf?: string | null;
  studentCpf?: string | null;
  alunoCpf?: string | null;
}): AlunoPushTarget | null {
  for (const raw of [input.cpf, input.studentCpf, input.alunoCpf]) {
    const cpf = normalizeCpfKey(raw);
    if (cpf) return { targetUserKey: cpf, targetUserType: "aluno" };
  }
  return null;
}

/** Resolve CPF a partir de users.id somente se o CPF pertence a aluno PEC ou Inclusão. */
export async function resolveAlunoPushTargetFromUserId(
  dbPool: Pool,
  userId: number | string
): Promise<AlunoPushTarget | null> {
  const id = Number(userId);
  if (!id || Number.isNaN(id)) return null;

  const userRow = await dbPool.query(
    `SELECT REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') AS cpf FROM users WHERE id = $1 LIMIT 1`,
    [id]
  );
  const cpf = normalizeCpfKey(userRow.rows[0]?.cpf);
  if (!cpf) return null;

  const pec = await dbPool.query(
    `SELECT 1 FROM aluno WHERE REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') = $1 LIMIT 1`,
    [cpf]
  );
  if (pec.rows.length > 0) return { targetUserKey: cpf, targetUserType: "aluno" };

  const inc = await dbPool.query(
    `SELECT 1 FROM participantes_inclusao WHERE REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') = $1 LIMIT 1`,
    [cpf]
  );
  if (inc.rows.length > 0) return { targetUserKey: cpf, targetUserType: "aluno" };

  return null;
}

function isAlunoSessionUser(
  sessionUser: { actorType?: string; papel?: string; role?: string } | undefined
): boolean {
  return (
    sessionUser?.actorType === "aluno" ||
    sessionUser?.actorType === "aluno_portal" ||
    sessionUser?.papel === "aluno" ||
    sessionUser?.papel === "aluno_portal" ||
    sessionUser?.role === "aluno" ||
    sessionUser?.role === "aluno_portal"
  );
}

/** Garante que o usuário autenticado só registra o próprio dispositivo */
export function assertRegisterTokenOwnership(
  sessionUser:
    | { id?: number | string; actorType?: string; papel?: string; role?: string; cpf?: string }
    | undefined,
  payload: RegisterTokenPayload,
  isDevMode: boolean
): string | null {
  if (!sessionUser?.id) {
    return "Autenticação obrigatória para registrar dispositivo";
  }
  if (isDevMode) return null;

  if (isAlunoSessionUser(sessionUser)) {
    const sessionCpf = String(sessionUser.cpf || sessionUser.id).replace(/\D/g, "");
    const payloadCpf = payload.userKey.replace(/\D/g, "");
    if (!sessionCpf || sessionCpf.length !== 11) {
      return "Sessão de aluno inválida";
    }
    if (payloadCpf !== sessionCpf) {
      return "userKey não corresponde ao usuário autenticado";
    }
    if (payload.userType !== "aluno" && payload.userType !== "aluno_portal") {
      return "userType não corresponde ao usuário autenticado";
    }
    return null;
  }

  if (payload.userKey !== String(sessionUser.id)) {
    return "userKey não corresponde ao usuário autenticado";
  }
  return null;
}
