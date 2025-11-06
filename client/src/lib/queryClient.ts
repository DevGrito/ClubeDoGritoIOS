import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";

// Base do backend: usa VITE_API_BASE em build web e, no app nativo, força seu domínio
const API_BASE =
  import.meta.env?.VITE_API_BASE ||
  (Capacitor.isNativePlatform()
    ? "https://clubedogrito.institutoogrito.com.br"
    : "");

// Prefixa a URL quando vier relativa (/api/...)
function withBase(url: string) {
  if (/^https?:\/\//i.test(url)) return url;      // já é absoluta
  if (url.startsWith("/")) return `${API_BASE}${url}`;
  return url; // rotas relativas a página (evitar quebrar outros casos)
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(url: string, options?: {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
}): Promise<any> {
  const { method = 'GET', body, headers = {} } = options || {};

  const finalUrl = withBase(url);

  const res = await fetch(finalUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body,
    credentials: 'include',
  });

  await throwIfResNotOk(res);

  // Verifica conteúdo antes de tentar JSON
  const text = await res.text();
  if (!text || text.trim() === '') {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Erro ao parsear JSON:', error, 'Resposta:', text);
    throw new Error('Resposta inválida do servidor');
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // queryKey[0] costuma ser '/api/...'
    const raw = String(queryKey[0] ?? "");
    const finalUrl = withBase(raw);

    const res = await fetch(finalUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null as unknown as T;
    }

    await throwIfResNotOk(res);

    const text = await res.text();
    if (!text || text.trim() === '') {
      return null as unknown as T;
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      console.error('Erro ao parsear JSON no getQueryFn:', error, 'Resposta:', text);
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
