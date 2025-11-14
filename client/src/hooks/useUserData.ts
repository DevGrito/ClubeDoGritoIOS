import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

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
  // ⭐ VERIFICAR SE É ACESSO DEV PRIMEIRO
  const urlParams = new URLSearchParams(window.location.search);
  const isDevAccess = urlParams.get('dev_access') === 'true';
  const isFromDevPanel = urlParams.get('origin') === 'dev_panel';
  const devPanelActive = localStorage.getItem('dev_panel_active') === 'true';
  const devPanelTimestamp = localStorage.getItem('dev_panel_timestamp');
  const isRecentDevPanel =
    !!devPanelTimestamp && (Date.now() - parseInt(devPanelTimestamp, 10)) < 60_000;

  const isDevMode = (isDevAccess && isFromDevPanel) || (devPanelActive && isRecentDevPanel);

  const userId = localStorage.getItem("userId");

  const { data: apiUserData, isLoading, error } = useQuery({
    queryKey: ["/api/user", userId], // PADRONIZADO - array separado para bater com invalidações
    queryFn: async () => {
      const response = await fetch(`/api/user/${userId}?t=${Date.now()}`);
      if (!response.ok) throw new Error('Failed to fetch user data');
      return response.json();
    },
    enabled: !!userId && !isDevMode, // Desabilitar query se for dev mode
    staleTime: 0, // SEM CACHE - sempre buscar dados frescos
    gcTime: 0, // Não manter em cache
    retry: 1,
    refetchOnMount: 'always', // Sempre refetch ao montar
    refetchOnWindowFocus: true, // Refetch ao focar janela
  });

  // Process the API data into our UserData format
    const userData: UserData = (() => {
    // Se é dev mode, retornar dados mock do Leo
    if (isDevMode) {
      return {
        id: 24,
        nome: "Leo",
        sobrenome: "Martins",
        email: "leomarttins@institutoogrito.com.br",
        telefone: "31986631203",
        plano: "platinum",
        fotoPerfil: undefined,
        role: "leo",
      };
    }

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
  })();

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