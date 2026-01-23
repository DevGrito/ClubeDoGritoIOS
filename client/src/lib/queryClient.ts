import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    try {
      const json = JSON.parse(text);
      const message = json.error || json.message || text;
      throw new Error(message);
    } catch (e) {
      throw new Error(text || res.statusText);
    }
  }
}

export async function apiRequest(url: string, options?: {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
}): Promise<any> {
  const { method = 'GET', body, headers = {} } = options || {};
  
  const userId = localStorage.getItem("userId");
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };
  
  if (userId) {
    requestHeaders['x-user-id'] = userId;
  }
  
  const res = await fetch(url, {
    method,
    headers: requestHeaders,
    body,
    credentials: 'include',
    cache: 'no-store',
  });

  await throwIfResNotOk(res);
  
  // Verificar se a resposta tem conteúdo antes de parsear JSON
  const text = await res.text();
  console.log('[DEBUG apiRequest]', method, url, 'Response text:', text);
  
  if (!text || text.trim() === '') {
    return null;
  }
  
  try {
    const parsed = JSON.parse(text);
    console.log('[DEBUG apiRequest]', method, url, 'Parsed successfully:', parsed);
    return parsed;
  } catch (error) {
    console.error('[ERROR apiRequest]', method, url, 'Erro ao parsear JSON:', error, 'Resposta:', text);
    throw new Error('Resposta inválida do servidor');
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const userId = localStorage.getItem("userId");
    const headers: Record<string, string> = {};
    
    if (userId) {
      headers['x-user-id'] = userId;
    }
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers,
      cache: 'no-store',
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    
    // Verificar se a resposta tem conteúdo antes de parsear JSON
    const text = await res.text();
    if (!text || text.trim() === '') {
      return null;
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
