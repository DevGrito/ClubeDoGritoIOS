import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface PortalUser {
  id: number;
  nome: string;
  email: string;
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

export function usePortalAuth() {
  const { data: user, isLoading } = useQuery<PortalUser | null>({
    queryKey: ["/api/portal/me"],
    queryFn: async () => {
      const r = await fetch("/api/portal/me", { credentials: "include" });
      if (r.status === 401) return null;
      if (!r.ok) return null;
      return r.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const queryClient = useQueryClient();

  const logout = async () => {
    await fetch("/api/portal/logout", { method: "POST", credentials: "include" });
    queryClient.setQueryData(["/api/portal/me"], null);
    queryClient.removeQueries({ queryKey: ["/api/portal/meus-ingressos"] });
    queryClient.removeQueries({ queryKey: ["/api/portal/ingressos-pendentes"] });
    queryClient.invalidateQueries({ queryKey: ["/api/portal/me"] });
  };

  return {
    user: user || null,
    isLoggedIn: !!user,
    isLoading,
    logout,
  };
}
