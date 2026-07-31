import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface PortalUser {
  id: number;
  nome: string;
  email: string;
  cpf?: string;
  dataNascimento?: string;
  genero?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  fotoUrl?: string;
}

export function clearPortalCaches(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.setQueryData(["/api/portal/me"], null);
  queryClient.removeQueries({ queryKey: ["/api/portal/meus-ingressos"] });
  queryClient.removeQueries({ queryKey: ["/api/portal/ingressos-pendentes"] });
  queryClient.removeQueries({ queryKey: ["/api/portal/eventos"] });
}

export function usePortalAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, isError, error, refetch } = useQuery<PortalUser | null>({
    queryKey: ["/api/portal/me"],
    queryFn: async () => {
      const r = await fetch("/api/portal/me", { credentials: "include", cache: "no-store" });
      if (r.status === 401) {
        // Só limpa caches relacionados; não apaga o user otimista via setQueryData(null)
        // antes do retorno — o React Query já substitui o data pelo null retornado.
        queryClient.removeQueries({ queryKey: ["/api/portal/meus-ingressos"] });
        queryClient.removeQueries({ queryKey: ["/api/portal/ingressos-pendentes"] });
        return null;
      }
      if (!r.ok) {
        throw new Error("Erro ao verificar autenticação");
      }
      return r.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const logout = async () => {
    try {
      await fetch("/api/portal/logout", { method: "POST", credentials: "include" });
    } finally {
      clearPortalCaches(queryClient);
      await queryClient.invalidateQueries({ queryKey: ["/api/portal/me"] });
    }
  };

  return {
    user: user || null,
    isLoggedIn: !!user,
    isLoading,
    isError,
    error,
    refetch,
    logout,
  };
}
