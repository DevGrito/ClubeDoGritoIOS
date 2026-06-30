import { queryClient } from "@/lib/queryClient";
import type { ConsentArea } from "@/hooks/usePrivacyConsent";
import { syncStoredPrivacyConsentAfterAuth } from "@/lib/syncPrivacyConsentAfterAuth";

export { clearLocalStoragePreservingLgpd } from "@/lib/privacyConsentStorage";

function consentAreaForSession(session: AuthSessionPayload): ConsentArea {
  const role = String(session.papel || session.role || "").toLowerCase();
  const actor = String(session.actorType || "").toLowerCase();
  if (role === "patrocinador") return "sponsors";
  if (role === "doador" || role === "user") return "donors";
  if (actor === "aluno_portal" || role === "aluno_portal" || role === "aluno") return "students";
  if (
    role === "professor" ||
    role === "monitor" ||
    role.startsWith("professor_") ||
    role.startsWith("monitor_") ||
    role.startsWith("coordenador")
  ) {
    return "employees";
  }
  if (role === "conselho" || role === "conselheiro") return "council";
  return "general";
}

/** Reenvia prefs locais ao servidor com sessão — vincula anonymous_consent_id ao user_id. */
async function syncPrivacyConsentAfterLogin(session: AuthSessionPayload): Promise<void> {
  await syncStoredPrivacyConsentAfterAuth({
    consentArea: consentAreaForSession(session),
    source: "post_login_sync",
  });
}

const AUTH_STORAGE_KEYS = [
  "userId",
  "userPapel",
  "userEmail",
  "userName",
  "monitorId",
  "professorId",
  "coordenadorId",
  "coordenadorNome",
  "coordenadorEmail",
  "coordenadorData",
  "actorType",
  "isVerified",
  "dev_panel_active",
  "dev_panel_timestamp",
  "hasActiveSubscription",
  "subscriptionPaused",
] as const;

const AUTH_SESSION_KEYS = [
  "coordenador_auth",
  "coordenador_data",
  "monitor_auth",
  "professor_auth",
  "almox_auth",
  "neg_auth",
  "dev_session",
  "session_expired",
] as const;

export type AuthSessionPayload = {
  id: number | string;
  papel?: string | null;
  role?: string | null;
  email?: string | null;
  nome?: string | null;
  actorType?: string | null;
  cpf?: string | null;
  vertente?: string | null;
  coordenadorId?: number | null;
  professorId?: number | null;
  monitorId?: number | null;
};

const ALUNO_PORTAL_CACHE_KEYS = ["aluno_cpf", "aluno_nome", "aluno_auth"] as const;
const SCANNER_CACHE_KEYS = ["scanner_auth", "scanner_user", "scanner_nome"] as const;
const TABLET_CHAMADA_CACHE_KEYS = [
  "tablet_chamada_auth",
  "tablet_chamada_vertente",
  "tablet_chamada_user",
] as const;

/** Espelha sessão do backend no localStorage (cache UI — não é fonte de autorização). */
export function syncSessionToLocalStorage(session: AuthSessionPayload): void {
  const papel = session.papel || session.role;
  if (papel) localStorage.setItem("userPapel", papel);
  localStorage.setItem("userId", String(session.id));
  if (session.email) localStorage.setItem("userEmail", session.email);
  if (session.nome) localStorage.setItem("userName", session.nome);
  localStorage.setItem("isVerified", "true");
  if (session.actorType) localStorage.setItem("actorType", session.actorType);

  if (session.coordenadorId && session.coordenadorId > 0) {
    localStorage.setItem("coordenadorId", String(session.coordenadorId));
  } else {
    localStorage.removeItem("coordenadorId");
  }
  if (session.professorId && session.professorId > 0) {
    localStorage.setItem("professorId", String(session.professorId));
  } else {
    localStorage.removeItem("professorId");
  }
  if (session.monitorId && session.monitorId > 0) {
    localStorage.setItem("monitorId", String(session.monitorId));
  } else {
    localStorage.removeItem("monitorId");
  }
}

/** Invalida React Query e recarrega sessão do backend após login bem-sucedido. */
export async function syncAuthSessionAfterLogin(): Promise<AuthSessionPayload | null> {
  await queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
  const session = await fetchAuthSessionAndSyncCache();
  if (session) {
    await syncPrivacyConsentAfterLogin(session);
  }
  return session;
}

/** Busca `/api/auth/session` e atualiza cache local. Retorna null se não autenticado. */
export async function fetchAuthSessionAndSyncCache(): Promise<AuthSessionPayload | null> {
  const res = await fetch("/api/auth/session", {
    credentials: "include",
    cache: "no-store",
  });
  if (res.status === 401 || !res.ok) return null;
  const session = (await res.json()) as AuthSessionPayload;
  if (!session?.id) return null;
  if (session.actorType === "aluno_portal") {
    const cpfDigits = String(session.cpf || session.id || "").replace(/\D/g, "");
    if (cpfDigits.length === 11) {
      syncAlunoPortalCache({ ...session, cpf: cpfDigits });
    }
    return session;
  }
  if (session.actorType === "scanner") {
    syncScannerCache(session);
    return session;
  }
  if (session.actorType === "tablet_chamada") {
    syncTabletChamadaCache(session);
    return session;
  }
  syncSessionToLocalStorage(session);
  return session;
}

/** Cache UI do portal do aluno (não é fonte de autorização). */
export function syncAlunoPortalCache(session: AuthSessionPayload): void {
  const cpf = (session.cpf || "").replace(/\D/g, "");
  if (cpf) sessionStorage.setItem("aluno_cpf", cpf);
  if (session.nome) sessionStorage.setItem("aluno_nome", session.nome);
  sessionStorage.setItem("aluno_auth", "true");
  window.dispatchEvent(new Event("aluno-auth-changed"));
}

export function syncScannerCache(session: AuthSessionPayload): void {
  sessionStorage.setItem("scanner_auth", "true");
  if (session.nome) sessionStorage.setItem("scanner_nome", session.nome);
}

export function syncTabletChamadaCache(session: AuthSessionPayload): void {
  sessionStorage.setItem("tablet_chamada_auth", "true");
  if (session.vertente) sessionStorage.setItem("tablet_chamada_vertente", session.vertente);
  if (session.nome) sessionStorage.setItem("tablet_chamada_user", session.nome);
}

export async function fetchAlunoPortalSession(): Promise<AuthSessionPayload | null> {
  const session = await fetchAuthSessionAndSyncCache();
  if (!session || session.actorType !== "aluno_portal" || !session.cpf) return null;
  return session;
}

export async function logoutAndClearSession(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  } catch {
    // Keep local cleanup even when backend logout fails.
  }

  for (const key of AUTH_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
  for (const key of AUTH_SESSION_KEYS) {
    sessionStorage.removeItem(key);
  }
  for (const key of ALUNO_PORTAL_CACHE_KEYS) {
    sessionStorage.removeItem(key);
  }
  for (const key of SCANNER_CACHE_KEYS) {
    sessionStorage.removeItem(key);
  }
  for (const key of TABLET_CHAMADA_CACHE_KEYS) {
    sessionStorage.removeItem(key);
  }
}

