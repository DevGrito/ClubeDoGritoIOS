import { Component, ReactNode } from "react";
import { clearLocalStoragePreservingLgpd } from "@/lib/auth-session";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorCount: number;
  lastErrorTime: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      errorCount: 0, 
      lastErrorTime: 0 
    };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('ErrorBoundary caught error:', error);
    return { 
      hasError: true, 
      error, 
      errorCount: 1,
      lastErrorTime: Date.now()
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary details:', error, errorInfo);
    
    // Detecta loops de erro
    const now = Date.now();
    const timeDiff = now - this.state.lastErrorTime;
    
    // Se erro em menos de 1 segundo, conta como loop potencial
    if (timeDiff < 1000) {
      const newCount = this.state.errorCount + 1;
      
      // Se mais de 3 erros em 1 segundo, força limpeza total
      if (newCount >= 3) {
        console.warn('🔄 Loop de erro detectado! Limpando dados...');
        this.forceCleanupAndReload();
        return;
      }
      
      this.setState({ errorCount: newCount, lastErrorTime: now });
    } else {
      // Reset contador se passou mais de 1 segundo
      this.setState({ errorCount: 1, lastErrorTime: now });
    }
    
    // Enviar erro para o backend para análise
    this.logClientError(error, errorInfo);
  }

  private async logClientError(error: Error, errorInfo?: any) {
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        errorInfo,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      };

      await fetch('/api/log-client-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
        credentials: 'include',
      }).catch(err => console.error('Failed to log client error:', err));
    } catch (logError) {
      console.error('Error logging client error:', logError);
    }
  }

  private handleReload = () => {
    try {
      // Preserva sessão do aluno para não deslogar ao recarregar
      const alunoAuth = sessionStorage.getItem('aluno_auth');
      const alunoCpf = sessionStorage.getItem('aluno_cpf');
      const alunoNome = sessionStorage.getItem('aluno_nome');
      sessionStorage.clear();
      if (alunoAuth) sessionStorage.setItem('aluno_auth', alunoAuth);
      if (alunoCpf) sessionStorage.setItem('aluno_cpf', alunoCpf);
      if (alunoNome) sessionStorage.setItem('aluno_nome', alunoNome);
      const keysToRemove = ['react-query-cache', 'form-data', 'temp-data'];
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (e) {
      console.warn('Erro ao limpar cache:', e);
    }
    window.location.reload();
  };
  
  private forceCleanupAndReload = () => {
    try {
      // Limpeza completa em caso de loop
      clearLocalStoragePreservingLgpd();
      sessionStorage.clear();
      
      // Limpa cache do navegador se possível
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      
      console.log('🧹 Limpeza de emergência concluída');
      
      // Recarrega após um pequeno delay
      setTimeout(() => {
        window.location.href = window.location.origin; // Vai para root
      }, 500);
    } catch (e) {
      console.error('Erro na limpeza de emergência:', e);
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Houve um erro
              </h1>
              <p className="text-gray-600 mb-6">
                Algo deu errado. Toque no botão abaixo para recarregar a página.
              </p>
            </div>
            <button
              onClick={this.handleReload}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}