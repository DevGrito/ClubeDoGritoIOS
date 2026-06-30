import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useMemo } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';

interface UserData {
  id?: number;
  nome: string;
  sobrenome: string;
  email: string;
  telefone: string;
  plano: string;
  fotoPerfil?: string;
  role?: string;
}

export function useUserData() {
  const { data: authSession } = useAuthSession();
  // 🔐 SECURITY: identidade principal vem da sessão backend.
  const userId = String(authSession?.id || localStorage.getItem("userId") || "");

  const { data: apiUserData, isLoading, error } = useQuery({
    queryKey: ["/api/user", userId],
    queryFn: async () => {
      const response = await fetch(`/api/user/${userId}?t=${Date.now()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error('Failed to fetch user data');
      return response.json();
    },
    enabled: !!userId,
    staleTime: 0,
    gcTime: 0,
    retry: 1,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Process the API data into our UserData format (memoized to prevent infinite loops)
  const userData: UserData = useMemo(() => {
    // 🔹 Lê possíveis dados já guardados no localStorage (apenas campos auxiliares)
    const storedEmail = localStorage.getItem("userEmail") || "";
    const storedPhone = localStorage.getItem("userPhone") || "";
    const storedPlan  = localStorage.getItem("userPlan")  || "eco";

    if (apiUserData && typeof apiUserData === "object") {
      const data = apiUserData as any;

      // Split the nome field into nome and sobrenome
      const fullName = data.nome || "";
      const nameParts = fullName.split(" ");
      const nome = nameParts[0] || "";
      const sobrenome = nameParts.slice(1).join(" ") || "";

      return {
        id: data.id,
        nome,
        sobrenome,
        // Usa API como fonte principal; fallback só para campos auxiliares.
        email: data.email || storedEmail,
        telefone: data.telefone || storedPhone,
        plano: data.plano || storedPlan,
        fotoPerfil: data.fotoPerfil || undefined,
        role: data.role || authSession?.papel || authSession?.role || undefined,
      };
    }

    // Sem dados da API: não usar nome/papel legados para evitar vazamento de contexto (ex.: monitor -> doador).
    const nome = "";
    const sobrenome = "";
    const email = authSession?.email || storedEmail;
    const telefone = storedPhone;
    const plano = storedPlan;
    const role = authSession?.papel || authSession?.role || undefined;

    const idNum = authSession?.id || undefined;

    return { id: idNum, nome, sobrenome, email, telefone, plano, role };
  }, [apiUserData, authSession]);

  // Update user data mutation
  const updateUserDataMutation = useMutation({
    mutationFn: async (data: Partial<UserData>) => {
      const fullName = `${data.nome || ''} ${data.sobrenome || ''}`.trim();

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({
          nome: fullName,
          email: data.email,
          telefone: data.telefone
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar dados');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update localStorage
      const fullName = `${variables.nome || ''} ${variables.sobrenome || ''}`.trim();
      localStorage.setItem("userName", fullName);
      if (variables.email) localStorage.setItem("userEmail", variables.email);
      if (variables.telefone) localStorage.setItem("userPhone", variables.telefone);

      // Invalidate user query to refetch - PADRONIZADO
      queryClient.invalidateQueries({ queryKey: ["/api/user", userId] });
    }
  });

  const updateUserData = async (data: Partial<UserData>) => {
    await updateUserDataMutation.mutateAsync(data);
  };

  return { userData, isLoading, error, updateUserData };
}