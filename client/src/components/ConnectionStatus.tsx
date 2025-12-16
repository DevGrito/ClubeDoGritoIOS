import { useServerConnection } from '@/hooks/useServerConnection';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, WifiOff, Wifi } from 'lucide-react';

export function ConnectionStatus() {
  const { isConnected, isReconnecting, reconnectAttempts } = useServerConnection();

  if (isConnected) {
    return null; // Não mostrar nada quando tudo está funcionando
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4">
      <Alert className={`mx-auto max-w-md ${isReconnecting ? 'border-yellow-300 bg-yellow-50' : 'border-red-300 bg-red-50'}`}>
        <div className="flex items-center space-x-2">
          {isReconnecting ? (
            <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className="flex-1">
            {isReconnecting ? (
              <div>
                <div className="font-medium text-yellow-800">Servidor atualizando...</div>
                <div className="text-sm text-yellow-700">
                  Reconectando automaticamente ({reconnectAttempts}/5)
                </div>
              </div>
            ) : (
              <div>
                <div className="font-medium text-red-800">Conexão perdida</div>
                <div className="text-sm text-red-700">
                  Recarregue a página se o problema persistir
                </div>
              </div>
            )}
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
}

export default ConnectionStatus;