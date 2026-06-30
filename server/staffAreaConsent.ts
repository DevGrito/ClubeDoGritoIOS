import { pool } from "./db";
import { getPolicyBundleId } from "../shared/lgpdPolicyVersions";

export type StaffKind = "professor" | "monitor" | "coordenador";

export type StaffEntityRef = {
  kind: StaffKind;
  staffId: number;
};

const STAFF_TABLE: Record<StaffKind, string> = {
  professor: "professores",
  monitor: "monitores",
  coordenador: "coordenadores",
};

/** Áreas gravadas também na ficha de staff (prova direta pelo id da ficha). */
export const STAFF_FICHA_CONSENT_AREAS = new Set<string>(["employees"]);

export function parseStaffKind(raw: unknown): StaffKind | null {
  const k = String(raw || "").toLowerCase();
  if (k === "professor" || k === "monitor" || k === "coordenador") return k;
  return null;
}

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

export async function ensureStaffAreaConsentsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS staff_area_consents (
      id SERIAL PRIMARY KEY,
      staff_kind VARCHAR(30) NOT NULL,
      staff_id INTEGER NOT NULL,
      consent_area VARCHAR(50) NOT NULL,
      policy_bundle_id VARCHAR(200) NOT NULL,
      privacy_policy_version VARCHAR(10) DEFAULT '1.0',
      terms_version VARCHAR(10) DEFAULT '1.0',
      image_use BOOLEAN NOT NULL DEFAULT FALSE,
      communications BOOLEAN NOT NULL DEFAULT FALSE,
      marketing BOOLEAN NOT NULL DEFAULT FALSE,
      source VARCHAR(100),
      ip_address VARCHAR(100),
      user_agent TEXT,
      accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT staff_area_consents_unique UNIQUE (staff_kind, staff_id, consent_area, policy_bundle_id)
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_staff_area_consents_lookup
      ON staff_area_consents (staff_kind, staff_id, consent_area)
  `);
}

async function staffEntityExists(kind: StaffKind, staffId: number): Promise<boolean> {
  const table = STAFF_TABLE[kind];
  const result = await pool.query(`SELECT 1 FROM ${table} WHERE id = $1 LIMIT 1`, [staffId]);
  return (result.rowCount ?? 0) > 0;
}

export async function resolveStaffEntityFromSession(
  req: {
    user?: {
      id?: unknown;
      professorId?: number | null;
      monitorId?: number | null;
      coordenadorId?: number | null;
      papel?: string;
      role?: string;
      actorType?: string;
    };
    session?: {
      user?: {
        professorId?: number | null;
        monitorId?: number | null;
        coordenadorId?: number | null;
        id?: unknown;
        papel?: string;
        role?: string;
        actorType?: string;
      };
      coordenadorId?: number | null;
      userId?: unknown;
      userPapel?: string;
      actorType?: string;
    };
  }
): Promise<StaffEntityRef | null> {
  const user = req.user;
  const sess = req.session;
  const sessionUser = sess?.user;
  const actorType = String(
    user?.actorType ?? user?.role ?? user?.papel ?? sess?.actorType ?? sessionUser?.actorType ?? ""
  ).toLowerCase();
  const papel = String(
    user?.papel ?? user?.role ?? sess?.userPapel ?? sessionUser?.papel ?? sessionUser?.role ?? ""
  ).toLowerCase();

  const professorId =
    parsePositiveInt(user?.professorId) ?? parsePositiveInt(sessionUser?.professorId) ?? null;
  const monitorId =
    parsePositiveInt(user?.monitorId) ?? parsePositiveInt(sessionUser?.monitorId) ?? null;
  const coordenadorId =
    parsePositiveInt(user?.coordenadorId) ??
    parsePositiveInt(sess?.coordenadorId) ??
    parsePositiveInt(sessionUser?.coordenadorId) ??
    null;

  const isProfessor =
    actorType === "professor" || papel.startsWith("professor_") || papel === "professor_lider";
  const isMonitor = actorType === "monitor" || papel.startsWith("monitor_");
  const isCoordenador =
    actorType === "coordenador" || papel.startsWith("coordenador_") || papel === "tecnica_psico";

  if (professorId && isProfessor && (await staffEntityExists("professor", professorId))) {
    return { kind: "professor", staffId: professorId };
  }
  if (monitorId && isMonitor && (await staffEntityExists("monitor", monitorId))) {
    return { kind: "monitor", staffId: monitorId };
  }
  if (coordenadorId && isCoordenador && (await staffEntityExists("coordenador", coordenadorId))) {
    return { kind: "coordenador", staffId: coordenadorId };
  }

  return null;
}

/** Só retorna ficha de staff autenticada na sessão (hints só validam, nunca substituem). */
export async function resolveStaffEntityForAreaConsent(
  req: Parameters<typeof resolveStaffEntityFromSession>[0],
  hints?: { staff_tipo?: unknown; staff_id?: unknown }
): Promise<StaffEntityRef | null> {
  const fromSession = await resolveStaffEntityFromSession(req);
  if (!fromSession) return null;

  const hintedKind = parseStaffKind(hints?.staff_tipo);
  const hintedId = parsePositiveInt(hints?.staff_id);
  if (hintedKind && hintedId) {
    if (hintedKind !== fromSession.kind || hintedId !== fromSession.staffId) {
      console.warn(
        `[staff_area_consents] Hint ignorado (sessão=${fromSession.kind}:${fromSession.staffId}, hint=${hintedKind}:${hintedId})`
      );
    }
  }

  return fromSession;
}

export async function hasStaffAreaConsentOnServer(
  kind: StaffKind,
  staffId: number,
  consentArea: string,
  policyBundleId: string = getPolicyBundleId()
): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM staff_area_consents
      WHERE staff_kind = $1 AND staff_id = $2 AND consent_area = $3 AND policy_bundle_id = $4
      LIMIT 1`,
    [kind, staffId, consentArea, policyBundleId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function persistStaffAreaConsent(params: {
  entity: StaffEntityRef;
  consentArea: string;
  policyBundleId?: string;
  privacyPolicyVersion?: string;
  termsVersion?: string;
  imageUse?: boolean;
  communications?: boolean;
  marketing?: boolean;
  source?: string;
  ip?: string | null;
  ua?: string | null;
}): Promise<void> {
  const policyBundleId = params.policyBundleId ?? getPolicyBundleId();
  await pool.query(
    `INSERT INTO staff_area_consents
      (staff_kind, staff_id, consent_area, policy_bundle_id,
       privacy_policy_version, terms_version, image_use, communications, marketing,
       source, ip_address, user_agent, accepted_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
     ON CONFLICT (staff_kind, staff_id, consent_area, policy_bundle_id)
     DO UPDATE SET
       privacy_policy_version = EXCLUDED.privacy_policy_version,
       terms_version = EXCLUDED.terms_version,
       image_use = EXCLUDED.image_use,
       communications = EXCLUDED.communications,
       marketing = EXCLUDED.marketing,
       source = EXCLUDED.source,
       ip_address = EXCLUDED.ip_address,
       user_agent = EXCLUDED.user_agent,
       accepted_at = NOW()`,
    [
      params.entity.kind,
      params.entity.staffId,
      params.consentArea,
      policyBundleId,
      params.privacyPolicyVersion ?? "1.0",
      params.termsVersion ?? "1.0",
      !!params.imageUse,
      !!params.communications,
      !!params.marketing,
      params.source ?? "area_gate_staff",
      params.ip ?? null,
      params.ua ?? null,
    ]
  );
}
