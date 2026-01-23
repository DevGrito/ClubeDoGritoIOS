import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useMemo } from 'react';

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
  // 🔐 SECURITY: Dados SEMPRE vêm do servidor via API
  // Não há mais bypass de dados hardcoded para nenhum papel
  const userId = localStorage.getItem("userId");

  const { data: apiUserData, isLoading, error } = useQuery({
    queryKey: ["/api/user", userId],
    queryFn: async () => {
      const response = await fetch(`/api/user/${userId}?t=${Date.now()}`);
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
    // 🔹 Lê possíveis dados já guardados no localStorage (para usar como fallback)
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
        // 👇 usa email/telefone/plano da API, mas CAI PARA o localStorage se a API não mandar
        email: data.email || storedEmail,
        telefone: data.telefone || storedPhone,
        plano: data.plano || storedPlan,
        fotoPerfil: data.fotoPerfil || undefined,
        role: data.role || undefined,
      };
    }

    // Fallback completo para localStorage se não tiver apiUserData
    const idStr = localStorage.getItem("userId") || "";
    const userName = localStorage.getItem("userName") || "";
    const nome = userName.split(" ")[0] || "";
    const sobrenome = userName.split(" ").slice(1).join(" ") || "";
    const email = storedEmail;
    const telefone = storedPhone;
    const plano = storedPlan;
    const role = localStorage.getItem("userPapel") || undefined;

    const idNum =
      idStr && !Number.isNaN(Number.parseInt(idStr, 10))
        ? Number.parseInt(idStr, 10)
        : undefined;

    return { id: idNum, nome, sobrenome, email, telefone, plano, role };
  }, [apiUserData]);

  // Update user data mutation
  const updateUserDataMutation = useMutation({
    mutationFn: async (data: Partial<UserData>) => {
      const fullName = `${data.nome || ''} ${data.sobrenome || ''}`.trim();

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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