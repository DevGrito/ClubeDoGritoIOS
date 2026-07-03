import { useQuery } from "@tanstack/react-query";
import { fetchAuthSessionAndSyncCache, type AuthSessionPayload } from "@/lib/auth-session";

export type AuthSession = AuthSessionPayload;

export function useAuthSession() {
  return useQuery<AuthSession | null>({
    queryKey: ["/api/auth/session"],
    queryFn: () => fetchAuthSessionAndSyncCache(),
    staleTime: 30_000,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  });
}
