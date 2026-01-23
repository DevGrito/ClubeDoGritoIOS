// Global error handler for uncaught errors and unhandled promise rejections
export function setupGlobalErrorHandling() {
  // Capturar erros JavaScript não tratados
  window.addEventListener('error', (event) => {
    logClientError({
      type: 'javascript-error',
      message: event.error?.message || event.message,
      stack: event.error?.stack,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    });
  });

  // Capturar promises rejeitadas não tratadas
  window.addEventListener('unhandledrejection', (event) => {
    logClientError({
      type: 'unhandled-promise-rejection',
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    });
  });
}

// Função para enviar erros do cliente para o backend
async function logClientError(errorData: any) {
  try {
    await fetch('/api/log-client-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorData),
      credentials: 'include',
    });
  } catch (logError) {
    console.error('Failed to log client error:', logError);
  }
}

// Funções auxiliares para verificar compatibilidade
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      console.warn('localStorage not available');
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      console.warn('localStorage not available');
    }
  }
};

export const safeURLSearchParams = (url?: string) => {
  try {
    return new URLSearchParams(url);
  } catch {
    // Fallback para navegadores antigos
    const params = new Map<string, string>();
    if (url) {
      const pairs = url.replace(/^\?/, '').split('&');
      pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        if (key) {
          params.set(decodeURIComponent(key), decodeURIComponent(value || ''));
        }
      });
    }
    return {
      get: (key: string) => params.get(key),
      set: (key: string, value: string) => params.set(key, value),
      toString: () => Array.from(params.entries())
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')
    };
  }
};