/** Versão vigente dos Termos de Uso (alinhada ao backend TERMS_VERSION_REQUIRED). */
export const TERMOS_VERSAO_ATUAL = "2026-04-01";

export const TERMOS_CACHE_KEY = "termos_aceito_versao";

export function getTermosActor(): { userId: string; tipo: string } | null {
  const coordenadorId = localStorage.getItem("coordenadorId");
  const monitorId = localStorage.getItem("monitorId");
  const professorId = localStorage.getItem("professorId");
  const userId = localStorage.getItem("userId");
  if (coordenadorId) return { userId: coordenadorId, tipo: "coordenador" };
  if (monitorId) return { userId: monitorId, tipo: "monitor" };
  if (professorId) return { userId: professorId, tipo: "professor" };
  if (userId) return { userId, tipo: "user" };
  return null;
}

/** Usuário já autenticado (doador, staff etc.) — não deve ir para donation-flow ao aceitar termos. */
export function isAuthenticatedForTermos(): boolean {
  if (localStorage.getItem("isVerified") !== "true") return false;
  return getTermosActor() !== null;
}

export async function registrarAceiteTermos(
  userId: string,
  tipo: string
): Promise<boolean> {
  try {
    const res = await fetch("/api/aceitar-termos", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: Number(userId),
        versao: TERMOS_VERSAO_ATUAL,
        tipo,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function markTermosAcceptedInSession(): void {
  sessionStorage.setItem(TERMOS_CACHE_KEY, TERMOS_VERSAO_ATUAL);
}

export async function verificarTermosAceitos(
  userId: string,
  tipo: string
): Promise<boolean> {
  try {
    const res = await fetch(`/api/termos/status?userId=${userId}&tipo=${tipo}`, {
      credentials: "include",
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.aceitou === true;
  } catch {
    return false;
  }
}
