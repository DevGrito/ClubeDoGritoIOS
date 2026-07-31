import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  isAlunoPushSession,
  migratePushLocalStorageKeys,
  resolvePushUserKeyFromLocalCache,
  resolvePushUserKeyFromSession,
  resolvePushUserType,
  shouldTrustAlunoPortalCache,
} from "@/lib/pushUserKey";

function normalizeCpfKey(cpf: string | null | undefined): string | null {
  if (!cpf) return null;
  const digits = cpf.replace(/\D/g, "");
  if (digits.length >= 11) return digits.slice(0, 11);
  return digits || null;
}

type PushNotificationsContextValue = ReturnType<typeof usePushNotifications> & {
  userKey: string | null;
  userType: string | null;
  userName: string | null;
};

const PushNotificationsContext =
  createContext<PushNotificationsContextValue | null>(null);

function useAlunoSessionStorage() {
  const [alunoSession, setAlunoSession] = useState(() => ({
    auth: sessionStorage.getItem("aluno_auth") === "true",
    cpf: sessionStorage.getItem("aluno_cpf") || null,
    nome: sessionStorage.getItem("aluno_nome") || null,
  }));

  useEffect(() => {
    const refresh = () =>
      setAlunoSession({
        auth: sessionStorage.getItem("aluno_auth") === "true",
        cpf: sessionStorage.getItem("aluno_cpf") || null,
        nome: sessionStorage.getItem("aluno_nome") || null,
      });
    window.addEventListener("aluno-auth-changed", refresh);
    return () => window.removeEventListener("aluno-auth-changed", refresh);
  }, []);

  return alunoSession;
}

export function PushNotificationsProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending: sessionLoading } = useAuthSession();
  const { auth: alunoAuth, cpf: alunoCpf, nome: alunoNome } = useAlunoSessionStorage();

  const sessionIsAluno = isAlunoPushSession(session);
  const alunoPortalActive = shouldTrustAlunoPortalCache(session, alunoAuth, sessionLoading);
  const alunoFallback = alunoPortalActive && alunoCpf ? { cpf: alunoCpf } : null;
  const sessionKey = resolvePushUserKeyFromSession(session, alunoFallback);
  const alunoCpfKey = alunoPortalActive ? normalizeCpfKey(alunoCpf) : null;
  const sessionCpfKey = sessionIsAluno
    ? normalizeCpfKey(session?.cpf || String(session?.id ?? ""))
    : null;
  const localCacheKey = resolvePushUserKeyFromLocalCache();
  // Aluno: prioriza CPF estável; demais perfis: sessão HTTP ou cache local (doador/patrocinador)
  const userKey = alunoCpfKey || sessionCpfKey || sessionKey || localCacheKey;
  const userType = resolvePushUserType(session, alunoPortalActive);

  useEffect(() => {
    if (!userKey) return;
    migratePushLocalStorageKeys(userKey, [
      sessionKey,
      sessionCpfKey,
      alunoCpfKey,
      localCacheKey,
      session?.id != null ? String(session.id) : null,
    ]);
  }, [userKey, sessionKey, sessionCpfKey, alunoCpfKey, localCacheKey, session?.id]);
  const userName = session?.nome || alunoNome || null;

  const onAutoRegistered = useCallback(() => {
    if (userKey) localStorage.setItem(`push_registered_${userKey}`, "1");
  }, [userKey]);

  const push = usePushNotifications(userKey, userType, userName, onAutoRegistered);

  const value = useMemo(
    () => ({
      ...push,
      userKey,
      userType,
      userName,
    }),
    [push, userKey, userType, userName]
  );

  return (
    <PushNotificationsContext.Provider value={value}>
      {children}
    </PushNotificationsContext.Provider>
  );
}

export function usePushNotificationsContext(): PushNotificationsContextValue {
  const ctx = useContext(PushNotificationsContext);
  if (!ctx) {
    throw new Error(
      "usePushNotificationsContext deve ser usado dentro de PushNotificationsProvider"
    );
  }
  return ctx;
}
