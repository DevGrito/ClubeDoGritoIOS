import { pool } from "./db";
import { computeServerConsentIntegrity } from "./privacyConsentLgpd";
import { getPolicyBundleId } from "../shared/lgpdPolicyVersions";
import {
  LEGACY_CONSENT_TYPES,
  derivePrivacyFlagsFromLegacyRows,
  legacyRowsFromPrivacyFlags,
  type LegacyConsentRow,
  type LegacyConsentType,
  type PrivacyConsentFlags,
} from "./privacyConsentMappings";

export {
  LEGACY_CONSENT_TYPES,
  derivePrivacyFlagsFromLegacyRows,
  legacyRowsFromPrivacyFlags,
  type LegacyConsentRow,
  type LegacyConsentType,
  type PrivacyConsentFlags,
} from "./privacyConsentMappings";

type PrivacyConsentSession = {
  user?: {
    id?: unknown;
    cpf?: unknown;
    participanteId?: number | null;
    professorId?: number | null;
    monitorId?: number | null;
    coordenadorId?: number | null;
    papel?: string;
    role?: string;
    actorType?: string;
  };
  userId?: unknown;
  userPapel?: string;
  alunoCpf?: unknown;
  scannerUserId?: unknown;
  coordenadorId?: number | null;
  isCoordinator?: boolean;
  actorType?: string;
};

type PrivacyConsentRequestUser = PrivacyConsentSession["user"] & {
  papel?: string;
  role?: string;
  alunoCpf?: unknown;
  professorId?: number | null;
  monitorId?: number | null;
  coordenadorId?: number | null;
};

function parsePositiveInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  if (typeof value === "string") {
    const digits = value.replace(/\D/g, "");
    if (digits.length > 0 && digits.length <= 10) {
      const n = Number(digits);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return null;
}

function isCoordenadorActor(actorType: string, papel: string): boolean {
  const a = actorType.toLowerCase();
  const p = papel.toLowerCase();
  return a === "coordenador" || p.startsWith("coordenador_") || p === "tecnica_psico";
}

function isProfessorActor(actorType: string, papel: string): boolean {
  const a = actorType.toLowerCase();
  const p = papel.toLowerCase();
  return a === "professor" || p.startsWith("professor_") || p === "professor_lider" || p === "lider";
}

function isMonitorActor(actorType: string, papel: string): boolean {
  const a = actorType.toLowerCase();
  const p = papel.toLowerCase();
  return a === "monitor" || p.startsWith("monitor_");
}

function readPrivacyActorLabels(
  user: PrivacyConsentRequestUser | undefined,
  sess: PrivacyConsentSession | undefined
): { actorType: string; papel: string } {
  return {
    actorType: String(
      user?.actorType ?? user?.role ?? user?.papel ?? sess?.actorType ?? sess?.user?.actorType ?? ""
    ),
    papel: String(
      user?.papel ??
        user?.role ??
        sess?.userPapel ??
        sess?.user?.papel ??
        sess?.user?.role ??
        ""
    ),
  };
}

/** Resolve users.id a partir de ficha de staff (professor/monitor/coordenador). */
async function resolveStaffPrivacyUserIdFromSession(
  user: PrivacyConsentRequestUser | undefined,
  sess: PrivacyConsentSession | undefined
): Promise<number | null> {
  const { actorType, papel } = readPrivacyActorLabels(user, sess);
  const sessionUser = sess?.user;

  const professorId =
    parsePositiveInt(user?.professorId) ??
    parsePositiveInt(sessionUser?.professorId) ??
    null;
  const monitorId =
    parsePositiveInt(user?.monitorId) ?? parsePositiveInt(sessionUser?.monitorId) ?? null;
  const coordenadorId =
    parsePositiveInt(user?.coordenadorId) ??
    parsePositiveInt(sess?.coordenadorId) ??
    parsePositiveInt(sessionUser?.coordenadorId) ??
    (isCoordenadorActor(actorType, papel)
      ? parsePositiveInt(user?.id ?? sess?.userId ?? sessionUser?.id)
      : null);

  if (professorId && isProfessorActor(actorType, papel)) {
    const linked = await resolveUsersIdForTermosAceite("professor", professorId);
    if (linked) return linked;
  }

  if (monitorId && isMonitorActor(actorType, papel)) {
    const linked = await resolveUsersIdForTermosAceite("monitor", monitorId);
    if (linked) return linked;
  }

  if (coordenadorId && isCoordenadorActor(actorType, papel)) {
    const linked = await resolveUsersIdForTermosAceite("coordenador", coordenadorId);
    if (linked) return linked;
  }

  const rawEntityId = parsePositiveInt(user?.id ?? sess?.userId ?? sessionUser?.id);
  if (!rawEntityId) return null;

  // Sessões legadas: id da sessão é o id da ficha (professores/monitores/coordenadores).
  if (isProfessorActor(actorType, papel) && !professorId) {
    return resolveUsersIdForTermosAceite("professor", rawEntityId);
  }
  if (isMonitorActor(actorType, papel) && !monitorId) {
    return resolveUsersIdForTermosAceite("monitor", rawEntityId);
  }
  if (isCoordenadorActor(actorType, papel) && !coordenadorId) {
    return resolveUsersIdForTermosAceite("coordenador", rawEntityId);
  }

  return null;
}

/** Resolve users.id a partir de sessão (inclui aluno com id = CPF). */
export async function resolvePrivacyConsentUserId(req: {
  user?: PrivacyConsentRequestUser;
  session?: PrivacyConsentSession;
}): Promise<number | null> {
  const sess = req.session as PrivacyConsentSession | undefined;
  const user = req.user;

  const participanteId = user?.participanteId ?? sess?.user?.participanteId;
  if (typeof participanteId === "number" && participanteId > 0) {
    const byParticipante = await pool.query<{ cpf: string | null }>(
      `SELECT cpf FROM participantes_inclusao WHERE id = $1 LIMIT 1`,
      [participanteId]
    );
    const cpfDigits = (byParticipante.rows[0]?.cpf || "").replace(/\D/g, "");
    if (cpfDigits.length === 11) {
      const linked = await ensurePrivacyUserIdFromCpf(cpfDigits);
      if (linked) return linked;
    }
  }

  const cpfRaw =
    user?.cpf ??
    user?.alunoCpf ??
    sess?.user?.cpf ??
    sess?.alunoCpf ??
    null;
  const cpfKey = cpfRaw ? String(cpfRaw).replace(/\D/g, "") : "";
  if (cpfKey.length === 11) {
    return ensurePrivacyUserIdFromCpf(cpfKey);
  }

  const { actorType, papel } = readPrivacyActorLabels(user, sess);
  if (
    isProfessorActor(actorType, papel) ||
    isMonitorActor(actorType, papel) ||
    isCoordenadorActor(actorType, papel)
  ) {
    const staffUsersId = await resolveStaffPrivacyUserIdFromSession(user, sess);
    if (staffUsersId) return staffUsersId;
  }

  const rawUserId = user?.id ?? sess?.user?.id ?? sess?.userId ?? null;

  if (typeof rawUserId === "number" && Number.isFinite(rawUserId) && rawUserId > 0) {
    const byUsers = await pool.query<{ id: number }>(`SELECT id FROM users WHERE id = $1 LIMIT 1`, [
      rawUserId,
    ]);
    if (byUsers.rows[0]?.id) return byUsers.rows[0].id;
  }

  if (typeof rawUserId === "string") {
    const digits = rawUserId.replace(/\D/g, "");
    if (digits.length > 0 && digits.length <= 10) {
      const numericId = Number(digits);
      if (Number.isFinite(numericId) && numericId > 0) {
        const byUsers = await pool.query<{ id: number }>(`SELECT id FROM users WHERE id = $1 LIMIT 1`, [
          numericId,
        ]);
        if (byUsers.rows[0]?.id) return byUsers.rows[0].id;
      }
    }
    if (digits.length === 11) {
      return ensurePrivacyUserIdFromCpf(digits);
    }
  }

  const staffFallback = await resolveStaffPrivacyUserIdFromSession(user, sess);
  if (staffFallback) return staffFallback;

  if (typeof sess?.scannerUserId === "number" && sess.scannerUserId > 0) {
    const byScanner = await pool.query<{ id: number }>(`SELECT id FROM users WHERE id = $1 LIMIT 1`, [
      sess.scannerUserId,
    ]);
    if (byScanner.rows[0]?.id) return byScanner.rows[0].id;
  }

  return null;
}

async function lookupUserIdByCpf(cpfDigits: string): Promise<number | null> {
  const byCpf = await pool.query<{ id: number }>(
    `SELECT id FROM users WHERE REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') = $1 LIMIT 1`,
    [cpfDigits]
  );
  return byCpf.rows[0]?.id ?? null;
}

async function lookupUserIdByEmail(email: string): Promise<number | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const byEmail = await pool.query<{ id: number }>(
    `SELECT id FROM users WHERE LOWER(TRIM(email)) = $1 LIMIT 1`,
    [normalized]
  );
  return byEmail.rows[0]?.id ?? null;
}

type AlunoLinkSource = {
  nome: string;
  telefone: string | null;
  email: string | null;
};

async function fetchAlunoLinkSource(cpfDigits: string): Promise<AlunoLinkSource | null> {
  const pec = await pool.query<{
    nome_completo: string;
    telefone: string | null;
    whatsapp: string | null;
    email: string | null;
  }>(
    `SELECT nome_completo, telefone, whatsapp, email FROM aluno
     WHERE REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') = $1
     LIMIT 1`,
    [cpfDigits]
  );
  const pecRow = pec.rows[0];
  if (pecRow) {
    return {
      nome: pecRow.nome_completo,
      telefone: pecRow.telefone?.trim() || pecRow.whatsapp?.trim() || null,
      email: pecRow.email,
    };
  }

  const incl = await pool.query<{ nome: string; telefone: string | null; email: string | null }>(
    `SELECT nome, telefone, email FROM participantes_inclusao
     WHERE REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') = $1
       AND status IS DISTINCT FROM 'evadido'
     LIMIT 1`,
    [cpfDigits]
  );
  const inclRow = incl.rows[0];
  if (inclRow) {
    return {
      nome: inclRow.nome,
      telefone: inclRow.telefone?.trim() || null,
      email: inclRow.email,
    };
  }

  return null;
}

/** Cria ou reutiliza users.id mínimo (e-mail) quando não há telefone para consolidar. */
async function ensureMinimalUsersLink(params: {
  nome: string;
  email?: string | null;
  cpf?: string | null;
  tipo: string;
  role?: string;
}): Promise<number | null> {
  const email = params.email?.trim().toLowerCase();
  if (email) {
    const byEmail = await lookupUserIdByEmail(email);
    if (byEmail) {
      if (params.cpf) {
        await pool
          .query(
            `UPDATE users SET cpf = $2
              WHERE id = $1
                AND (cpf IS NULL OR REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') = '')`,
            [byEmail, params.cpf]
          )
          .catch(() => {});
      }
      return byEmail;
    }
  }

  if (params.cpf) {
    const byCpf = await lookupUserIdByCpf(params.cpf);
    if (byCpf) return byCpf;
  }

  if (!email) return null;

  const role = params.role || params.tipo;
  const inserted = await pool.query<{ id: number }>(
    `INSERT INTO users (nome, email, cpf, telefone, role, tipo, ativo, verificado)
     VALUES ($1, $2, $3, NULL, $4, $4, true, true)
     RETURNING id`,
    [params.nome, email, params.cpf || null, role]
  );
  return inserted.rows[0]?.id ?? null;
}

function staffRoleForTable(table: "professores" | "monitores" | "coordenadores"): string {
  if (table === "professores") return "professor";
  if (table === "monitores") return "monitor";
  return "coordenador";
}

/** Garante users.id para ficha de staff (e-mail ou telefone) quando ainda não há vínculo. */
export async function ensureStaffUsersLink(
  table: "professores" | "monitores" | "coordenadores",
  entityId: number
): Promise<number | null> {
  const linked = await resolveUsersIdForStaffTable(table, entityId);
  if (linked) return linked;

  const staff = await pool.query<{ nome: string; email: string | null }>(
    `SELECT nome, email FROM ${table} WHERE id = $1 LIMIT 1`,
    [entityId]
  );
  const row = staff.rows[0];
  if (!row?.email?.trim()) return null;

  return ensureMinimalUsersLink({
    nome: row.nome,
    email: row.email,
    tipo: staffRoleForTable(table),
    role: staffRoleForTable(table),
  });
}

/** Garante users.id para CPF de aluno (PEC, Inclusão ou e-mail mínimo). */
export async function ensurePrivacyUserIdFromCpf(cpfDigits: string): Promise<number | null> {
  const existing = await lookupUserIdByCpf(cpfDigits);
  if (existing) return existing;

  const source = await fetchAlunoLinkSource(cpfDigits);
  if (!source) return null;

  if (source.telefone) {
    try {
      const { consolidateUser } = await import("./userConsolidation");
      const consolidated = await consolidateUser({
        nome: source.nome,
        telefone: source.telefone,
        email: source.email || undefined,
        cpf: cpfDigits,
        tipo: "aluno",
        fonte: "educacao",
      });
      return consolidated.id;
    } catch {
      const again = await lookupUserIdByCpf(cpfDigits);
      if (again) return again;
    }
  }

  return ensureMinimalUsersLink({
    nome: source.nome,
    email: source.email,
    cpf: cpfDigits,
    tipo: "aluno",
  });
}

/** Verifica aceite de área no servidor (fonte de verdade para AreaConsentGate). */
export async function hasAreaConsentOnServer(
  userId: number,
  consentArea: string,
  policyBundleId: string = getPolicyBundleId()
): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM privacy_consents
      WHERE user_id = $1
        AND consent_area = $2
        AND policy_bundle_id = $3
      LIMIT 1`,
    [userId, consentArea, policyBundleId]
  );
  return (result.rowCount ?? 0) > 0;
}

async function resolveUsersIdForStaffTable(
  table: "professores" | "monitores" | "coordenadores",
  entityId: number
): Promise<number | null> {
  const staff = await pool.query<{ email: string | null; telefone: string | null; nome: string }>(
    `SELECT email, telefone, nome FROM ${table} WHERE id = $1 LIMIT 1`,
    [entityId]
  );
  const row = staff.rows[0];
  if (!row) return null;

  if (row.email) {
    const byEmail = await lookupUserIdByEmail(row.email);
    if (byEmail) return byEmail;
  }

  if (row.telefone?.trim()) {
    try {
      const { consolidateUser } = await import("./userConsolidation");
      const tipo =
        table === "professores" ? "professor" : table === "monitores" ? "professor" : "admin";
      const consolidated = await consolidateUser({
        nome: row.nome,
        telefone: row.telefone,
        email: row.email || undefined,
        tipo,
        fonte: "educacao",
      });
      return consolidated.id;
    } catch {
      return null;
    }
  }

  return null;
}

/** Mapeia aceite de termos (por tipo) para users.id em privacy_consents. */
export async function resolveUsersIdForTermosAceite(
  tipo: string,
  entityId: number | null,
  cpf?: string | null
): Promise<number | null> {
  const normalizedTipo = (tipo || "user").toLowerCase();

  if (normalizedTipo === "aluno") {
    const cpfDigits = (cpf || "").replace(/\D/g, "");
    return cpfDigits.length === 11 ? ensurePrivacyUserIdFromCpf(cpfDigits) : null;
  }

  if (!entityId) return null;

  if (normalizedTipo === "professor") {
    return (
      (await resolveUsersIdForStaffTable("professores", entityId)) ??
      (await ensureStaffUsersLink("professores", entityId))
    );
  }
  if (normalizedTipo === "monitor") {
    return (
      (await resolveUsersIdForStaffTable("monitores", entityId)) ??
      (await ensureStaffUsersLink("monitores", entityId))
    );
  }
  if (normalizedTipo === "coordenador") {
    return (
      (await resolveUsersIdForStaffTable("coordenadores", entityId)) ??
      (await ensureStaffUsersLink("coordenadores", entityId))
    );
  }

  const byUsers = await pool.query<{ id: number }>(`SELECT id FROM users WHERE id = $1 LIMIT 1`, [
    entityId,
  ]);
  return byUsers.rows[0]?.id ?? null;
}

/** Espelha aceite de termos em privacy_consents (trilha LGPD unificada). */
export async function mirrorTermosAceiteToPrivacyConsent(params: {
  tipo: string;
  userId?: number | null;
  cpf?: string | null;
  ip: string | null;
  ua: string | null;
}): Promise<void> {
  const privacyUserId = await resolveUsersIdForTermosAceite(
    params.tipo,
    params.userId ?? null,
    params.cpf
  );
  if (!privacyUserId) return;

  const existing = await getLatestPrivacyFlags(privacyUserId);
  await upsertPrivacyConsentForUser(
    privacyUserId,
    {
      necessary: true,
      analytics: !!existing?.analytics,
      functional: !!existing?.functional,
      marketing: !!existing?.marketing,
      image_use: !!existing?.image_use,
      communications: !!existing?.communications,
    },
    {
      ip: params.ip,
      ua: params.ua,
      source: "termos_aceite",
      // Termos gerais ≠ aceite por área (employees, students, council…).
      // Gates específicos gravam consent_area via AreaConsentGate.
      consentArea: "general",
    }
  );
}

export type PrivacyConsentRecord = {
  flags: PrivacyConsentFlags;
  consentVersion: string;
  source: string;
  updatedAt: string;
};

export async function getLatestPrivacyConsentRecord(
  userId: number
): Promise<PrivacyConsentRecord | null> {
  const result = await pool.query(
    `SELECT necessary, analytics, functional, marketing, image_use, communications,
            consent_version, source, updated_at
       FROM privacy_consents
      WHERE user_id = $1
      ORDER BY updated_at DESC
      LIMIT 1`,
    [userId]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    flags: {
      necessary: row.necessary !== false,
      analytics: !!row.analytics,
      functional: !!row.functional,
      marketing: !!row.marketing,
      image_use: !!row.image_use,
      communications: !!row.communications,
    },
    consentVersion: row.consent_version || "1.0",
    source: row.source || "unknown",
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function getLatestPrivacyFlags(userId: number): Promise<Partial<PrivacyConsentFlags> | null> {
  const record = await getLatestPrivacyConsentRecord(userId);
  return record?.flags ?? null;
}

/** Lista consentimentos legados para Meus dados (fonte: user_consents + fallback privacy). */
export async function listLegacyConsentsForUser(userId: number): Promise<LegacyConsentRow[]> {
  const legacy = await pool.query<LegacyConsentRow>(
    `SELECT consent_type, granted, version, granted_at, revoked_at
       FROM user_consents
      WHERE user_id = $1
      ORDER BY consent_type`,
    [userId]
  );

  if (legacy.rows.length >= LEGACY_CONSENT_TYPES.length) {
    return legacy.rows;
  }

  const privacyBase = await getLatestPrivacyFlags(userId);
  if (!privacyBase) {
    return legacy.rows;
  }

  const fromPrivacy = legacyRowsFromPrivacyFlags({
    necessary: true,
    analytics: !!privacyBase.analytics,
    functional: !!privacyBase.functional,
    marketing: !!privacyBase.marketing,
    image_use: !!privacyBase.image_use,
    communications: !!privacyBase.communications,
  });

  const byType = new Map(legacy.rows.map((r) => [r.consent_type, r]));
  for (const row of fromPrivacy) {
    if (!byType.has(row.consent_type)) {
      byType.set(row.consent_type, row);
    }
  }
  return Array.from(byType.values()).sort((a, b) => a.consent_type.localeCompare(b.consent_type));
}

export async function syncUserConsentsFromPrivacy(
  userId: number,
  flags: Pick<PrivacyConsentFlags, "analytics" | "marketing" | "communications">,
  meta: { ip: string | null; ua: string | null }
) {
  const mappings: Array<[LegacyConsentType, boolean]> = [
    ["data_analytics", flags.analytics],
    ["email_marketing", flags.marketing],
    ["third_party_share", flags.marketing],
    ["sms_contact", flags.communications],
    ["push_notifications", flags.communications],
  ];
  for (const [consent_type, granted] of mappings) {
    await pool.query(
      `INSERT INTO user_consents (user_id, consent_type, granted, version, granted_at, revoked_at, ip_address, user_agent, updated_at)
       VALUES ($1, $2, $3, '1.0', $4, $5, $6, $7, NOW())
       ON CONFLICT (user_id, consent_type) DO UPDATE SET
         granted = $3,
         granted_at = CASE WHEN $3 THEN NOW() ELSE user_consents.granted_at END,
         revoked_at = CASE WHEN NOT $3 THEN NOW() ELSE NULL END,
         ip_address = $6,
         user_agent = $7,
         updated_at = NOW()`,
      [userId, consent_type, granted, granted ? new Date() : null, !granted ? new Date() : null, meta.ip, meta.ua]
    );
  }
}

export async function upsertPrivacyConsentForUser(
  userId: number,
  flags: PrivacyConsentFlags,
  meta: {
    ip: string | null;
    ua: string | null;
    source?: string;
    role?: string | null;
    consentArea?: string;
  }
) {
  const consentArea = meta.consentArea ?? "general";
  const integrity = computeServerConsentIntegrity({
    consent_area: consentArea,
    consent_version: "1.0",
    privacy_policy_version: "1.0",
    cookie_policy_version: "1.0",
    terms_version: "1.0",
    image_policy_version: "1.0",
    necessary: flags.necessary !== false,
    analytics: flags.analytics,
    functional: flags.functional,
    marketing: flags.marketing,
    image_use: flags.image_use,
    communications: flags.communications,
  });

  await pool.query(
    `INSERT INTO privacy_consents
      (user_id, consent_area, consent_version, privacy_policy_version, cookie_policy_version,
       policy_hash, consent_hmac, policy_bundle_id,
       terms_version, image_policy_version, necessary, analytics, functional, marketing,
       image_use, communications, source, ip_address, user_agent, updated_at)
     VALUES ($1,$2,'1.0','1.0','1.0',$3,$4,$5,'1.0','1.0',$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())`,
    [
      userId,
      consentArea,
      integrity.policyHash,
      integrity.consentHmac,
      getPolicyBundleId(),
      flags.necessary !== false,
      flags.analytics,
      flags.functional,
      flags.marketing,
      flags.image_use,
      flags.communications,
      meta.source ?? "legacy_api",
      meta.ip,
      meta.ua,
    ]
  );
}

/** POST /api/consentimentos — grava legado + espelha em privacy_consents. */
export async function applyLegacyConsentUpdate(
  userId: number,
  consentType: string,
  granted: boolean,
  meta: { ip: string | null; ua: string | null; version?: string }
) {
  const version = meta.version ?? "1.0.0";
  await pool.query(
    `INSERT INTO user_consents (user_id, consent_type, granted, version, granted_at, revoked_at, ip_address, user_agent, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     ON CONFLICT (user_id, consent_type) DO UPDATE SET
       granted = $3, version = $4,
       granted_at = CASE WHEN $3 THEN NOW() ELSE user_consents.granted_at END,
       revoked_at = CASE WHEN NOT $3 THEN NOW() ELSE NULL END,
       ip_address = $7, user_agent = $8, updated_at = NOW()`,
    [userId, consentType, granted, version, granted ? new Date() : null, !granted ? new Date() : null, meta.ip, meta.ua]
  );

  const all = await pool.query<{ consent_type: string; granted: boolean }>(
    `SELECT consent_type, granted FROM user_consents WHERE user_id = $1`,
    [userId]
  );
  const privacyBase = await getLatestPrivacyFlags(userId);
  const flags = derivePrivacyFlagsFromLegacyRows(all.rows, privacyBase ?? undefined);

  await upsertPrivacyConsentForUser(userId, flags, {
    ip: meta.ip,
    ua: meta.ua,
    source: "meus_dados",
  });
}
