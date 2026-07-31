import type { AuthSessionPayload } from "@/lib/auth-session";

export function isAlunoPushSession(session: AuthSessionPayload | null | undefined): boolean {
  if (!session) return false;
  return (
    session.actorType === "aluno_portal" ||
    session.actorType === "aluno" ||
    session.papel === "aluno_portal" ||
    session.papel === "aluno" ||
    session.role === "aluno_portal" ||
    session.role === "aluno"
  );
}

/** Chave canônica FCM: aluno → CPF; demais → users.id */
export function resolvePushUserKeyFromSession(
  session: AuthSessionPayload | null | undefined,
  alunoFallback?: { cpf?: string | null } | null
): string | null {
  const isAluno = isAlunoPushSession(session);

  if (isAluno) {
    const cpf = String(session?.cpf || session?.id || alunoFallback?.cpf || "")
      .replace(/\D/g, "");
    if (cpf.length >= 11) return cpf.slice(0, 11);
    return cpf || null;
  }

  if (alunoFallback?.cpf) {
    const cpf = String(alunoFallback.cpf).replace(/\D/g, "");
    if (cpf.length >= 11) return cpf.slice(0, 11);
  }

  if (session?.id != null) return String(session.id);
  return null;
}

/**
 * Cache sessionStorage do portal aluno só deve ser usado quando a sessão HTTP
 * também é aluno (ou ainda está carregando). Evita vincular push ao CPF antigo após logout.
 */
export function shouldTrustAlunoPortalCache(
  session: AuthSessionPayload | null | undefined,
  alunoAuth: boolean,
  sessionLoading = false
): boolean {
  if (!alunoAuth) return false;
  if (isAlunoPushSession(session)) return true;
  return !session && sessionLoading;
}

export function resolvePushUserType(
  session: AuthSessionPayload | null | undefined,
  alunoAuth?: boolean
): string | null {
  if (isAlunoPushSession(session) || alunoAuth) return "aluno";
  const fromSession = session?.papel || session?.role;
  if (fromSession) return fromSession;
  if (typeof window !== "undefined") {
    const papel = localStorage.getItem("userPapel");
    if (papel) return papel;
  }
  return session ? "user" : null;
}

const PUSH_STORAGE_SUFFIXES = [
  "push_opt_out_",
  "push_registered_",
  "push_dismissed_",
  "push_snoozed_",
] as const;

/** Unifica flags push quando a chave do usuário mudou (ex.: aluno CPF vs id). */
export function migratePushLocalStorageKeys(
  canonicalKey: string,
  alternateKeys: Array<string | null | undefined>
): void {
  if (!canonicalKey || typeof window === "undefined") return;
  for (const alt of alternateKeys) {
    const altKey = (alt || "").trim();
    if (!altKey || altKey === canonicalKey) continue;
    for (const prefix of PUSH_STORAGE_SUFFIXES) {
      const from = `${prefix}${altKey}`;
      const to = `${prefix}${canonicalKey}`;
      const value = localStorage.getItem(from);
      if (value != null && localStorage.getItem(to) == null) {
        localStorage.setItem(to, value);
      }
      localStorage.removeItem(from);
    }
  }
}

/** Fallback quando /api/auth/session ainda não carregou (doador, patrocinador, etc.). */
export function resolvePushUserKeyFromLocalCache(): string | null {
  if (typeof window === "undefined") return null;

  const userId = localStorage.getItem("userId");
  if (userId && /^\d+$/.test(userId)) return userId;

  if (sessionStorage.getItem("aluno_auth") === "true") {
    const cpf = String(sessionStorage.getItem("aluno_cpf") || "").replace(/\D/g, "");
    if (cpf.length >= 11) return cpf.slice(0, 11);
  }

  return null;
}
