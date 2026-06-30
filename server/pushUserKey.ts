import type { Pool } from "pg";

/**
 * Resolve users.id a partir de user_key + user_type.
 * - Staff/doador: user_key numérico = users.id
 * - Aluno: user_key = CPF só dígitos
 */
export async function resolveUserIdFromPushKey(
  pool: Pool,
  userKey: string,
  userType: string
): Promise<number | null> {
  const key = (userKey || "").trim();
  if (!key) return null;

  if (/^\d+$/.test(key) && userType !== "aluno") {
    const id = parseInt(key, 10);
    return Number.isNaN(id) ? null : id;
  }

  const cpf = key.replace(/\D/g, "");
  if (cpf.length === 11 || userType === "aluno") {
    const r = await pool.query(
      `SELECT id FROM users WHERE REGEXP_REPLACE(COALESCE(cpf, ''), '[^0-9]', '', 'g') = $1 LIMIT 1`,
      [cpf]
    );
    return r.rows[0]?.id ?? null;
  }

  if (/^\d+$/.test(key)) {
    const id = parseInt(key, 10);
    return Number.isNaN(id) ? null : id;
  }

  return null;
}

/** Chave canônica para fcm_tokens: aluno → CPF; demais → users.id como string. */
export function canonicalPushUserKey(
  sessionUser: { id?: number | string; cpf?: string | null; actorType?: string },
  userType: string,
  bodyUserKey?: string
): string {
  const isAluno =
    sessionUser?.actorType === "aluno" ||
    sessionUser?.actorType === "aluno_portal" ||
    userType === "aluno" ||
    userType === "aluno_portal";

  if (isAluno) {
    const cpf = String(sessionUser?.cpf || bodyUserKey || sessionUser?.id || "")
      .replace(/\D/g, "");
    if (cpf.length >= 11) return cpf.slice(0, 11);
    return cpf || String(bodyUserKey || "").trim();
  }

  if (sessionUser?.id != null) return String(sessionUser.id);
  return String(bodyUserKey || "").trim();
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

/** user_key em fcm_tokens a partir da sessão autenticada */
export function resolvePushUserKeyFromSession(
  sessionUser:
    | { id?: number | string; cpf?: string | null; actorType?: string; papel?: string; role?: string }
    | undefined
): string | null {
  if (!sessionUser?.id && !sessionUser?.cpf) return null;
  if (isAlunoSessionUser(sessionUser)) {
    const cpf = String(sessionUser.cpf || sessionUser.id || "").replace(/\D/g, "");
    if (cpf.length >= 11) return cpf.slice(0, 11);
    return cpf || null;
  }
  if (sessionUser.id != null) return String(sessionUser.id);
  return null;
}
