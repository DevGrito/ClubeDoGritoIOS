import { QueryClient, QueryFunction } from "@tanstack/react-query";

const isDev = import.meta.env.DEV;

function getLoginUrl(): string {
  const path = window.location.pathname;
  if (path.startsWith('/aluno') || path.startsWith('/menor')) return '/login/aluno';
  if (path.startsWith('/monitor')) return '/login/monitor';
  if (path.startsWith('/professor')) return '/login/professor';
  if (path.startsWith('/coordenador') || path.startsWith('/tecnica')) return '/login/coordenador';
  if (path.startsWith('/dev')) return '/dev/login';
  if (path.startsWith('/scanner')) return '/scanner-login';
  if (path.startsWith('/tablet/chamada')) return '/tablet/chamada/login';
  if (path.startsWith('/rbac/marketing')) return '/login/marketing';
  return '/entrar';
}

function redirectToLoginDueToExpiredSession(): void {
  if ((window as any).__authRedirecting) return;
  (window as any).__authRedirecting = true;
  const loginUrl = getLoginUrl();
  const currentPath = window.location.pathname;
  if (currentPath === loginUrl || currentPath.startsWith('/login')) return;
  sessionStorage.setItem('session_expired', 'true');
  window.location.href = loginUrl;
}

function buildAuthHeaders(extraHeaders?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...(extraHeaders || {}) };
  // Identidade deve ser resolvida exclusivamente pela sessão backend (cookie).
  // Nunca inferir usuário por localStorage para evitar vazamento de contexto entre perfis.
  if (headers["x-user-id"]) delete headers["x-user-id"];
  if (headers["x-coordenador-id"]) delete headers["x-coordenador-id"];
  if (headers["x-user-role"]) delete headers["x-user-role"];
  if (headers["x-coordenador-role"]) delete headers["x-coordenador-role"];
  if (headers["x-dev-access"]) delete headers["x-dev-access"];
  return headers;
}

export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: { on401?: "throw" | "returnResponse" }
): Promise<Response> {
  const headers = buildAuthHeaders(init?.headers as Record<string, string> | undefined);
  const res = await fetch(input, {
    ...init,
    headers,
    credentials: init?.credentials ?? "include",
    cache: init?.cache ?? "no-store",
  });

  if (res.status === 401 && (options?.on401 ?? "throw") === "throw") {
    redirectToLoginDueToExpiredSession();
    throw new Error("Sessão expirada");
  }

  return res;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    if (res.status === 401) {
      redirectToLoginDueToExpiredSession();
      throw new Error('Sessão expirada');
    }
    const text = (await res.text()) || res.statusText;
    let message = text || res.statusText;
    try {
      const json = JSON.parse(text);
      message = json.error || json.message || text;
    } catch {
    }
    throw new Error(message);
  }
}

export async function apiRequest(url: string, options?: {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
}): Promise<any> {
  const { method = 'GET', body, headers = {} } = options || {};
  
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...buildAuthHeaders(headers),
  };

  const res = await authFetch(url, {
    method,
    headers: requestHeaders,
    body,
  });

  await throwIfResNotOk(res);
  
  const text = await res.text();
  if (isDev) {
    console.log("[apiRequest]", method, url, "status:", res.status);
  }
  
  if (!text || text.trim() === '') {
    return null;
  }
  
  try {
    const parsed = JSON.parse(text);
    return parsed;
  } catch (error) {
    if (isDev) console.error("[apiRequest] JSON inválido:", method, url, error);
    throw new Error('Resposta inválida do servidor');
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers = buildAuthHeaders();
    const res = await authFetch(queryKey[0] as string, { headers }, { on401: "returnResponse" });

    if (res.status === 401) {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      redirectToLoginDueToExpiredSession();
      throw new Error('Sessão expirada');
    }

    await throwIfResNotOk(res);
    
    const text = await res.text();
    if (!text || text.trim() === '') {
      return null;
    }
    
    try {
      return JSON.parse(text);
    } catch (error) {
      if (isDev) console.error("[getQueryFn] JSON inválido:", error);
      throw new Error('Resposta inválida do servidor');
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
