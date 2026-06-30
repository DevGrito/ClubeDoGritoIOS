import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAuthSessionAndSyncCache, type AuthSessionPayload } from "@/lib/auth-session";

export type AuthSession = AuthSessionPayload;

export function useAuthSession() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const onAlunoAuth = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
    };
    window.addEventListener("aluno-auth-changed", onAlunoAuth);
    return () => window.removeEventListener("aluno-auth-changed", onAlunoAuth);
  }, [queryClient]);

  return useQuery<AuthSession | null>({
    queryKey: ["/api/auth/session"],
    queryFn: () => fetchAuthSessionAndSyncCache(),
    staleTime: 30_000,
    retry: false,
  });
}

