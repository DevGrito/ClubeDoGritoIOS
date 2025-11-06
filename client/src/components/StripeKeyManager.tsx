import { useState } from 'react';
import { RefreshCw, Key, CreditCard, Save, X, AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import { useStripeKeys } from '@/hooks/useStripeKeys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StripeKeyManagerProps {
  /** Se true, mostra uma versão compacta do componente */
  compact?: boolean;
  /** Título personalizado para o componente */
  title?: string;
  /** Se true, permite edição das chaves (apenas para desenvolvedores) */
  allowEdit?: boolean;
  /** Callback executado quando as chaves são atualizadas com sucesso */
  onKeysUpdated?: () => void;
}

/**
 * Componente completo para gerenciar chaves da Stripe
 * 
 * Características:
 * - Exibe status atual das chaves com máscaras de segurança
 * - Permite atualização segura das chaves (apenas desenvolvedores)
 * - Interface responsiva e intuitiva
 * - Validações automáticas
 * - Notificações de sucesso/erro
 */
export function StripeKeyManager({
  compact = false,
  title = "Configuração Stripe API",
  allowEdit = true,
  onKeysUpdated
}: StripeKeyManagerProps) {
  const {
    stripeKeys,
    isFullyConfigured,
    isProduction,
    isLoading,
    isUpdating,
    refetch,
    updateKeys,
    updateSuccess
  } = useStripeKeys();

  const [showForm, setShowForm] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [publicKey, setPublicKey] = useState('');

  // Resetar form quando atualização for bem-sucedida
  if (updateSuccess && showForm) {
    setShowForm(false);
    setSecretKey('');
    setPublicKey('');
    onKeysUpdated?.();
  }

  const handleUpdateKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (secretKey && publicKey) {
      updateKeys({
        secretKey,
        publicKey
      });
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setSecretKey('');
    setPublicKey('');
  };

  if (compact) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isFullyConfigured ? 'bg-green-100' : 'bg-red-100'}`}>
              {isFullyConfigured ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">Stripe API</p>
              <p className="text-sm text-gray-500">
                {isFullyConfigured ? (
                  <>✅ Configurado {isProduction ? '(Produção)' : '(Teste)'}</>
                ) : (
                  <>❌ Chaves não configuradas</>
                )}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-gray-600">Gerencie as chaves da API da Stripe com segurança</p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Status das chaves */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Key className="w-5 h-5" />
          Status Atual das Chaves
        </h3>

        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ) : stripeKeys ? (
          <div className="space-y-4">
            {/* Secret Key Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium text-gray-700">Secret Key:</span>
                <span className={`ml-2 px-2 py-1 text-xs rounded ${
                  stripeKeys.hasSecretKey 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {stripeKeys.hasSecretKey ? '✅ Configurada' : '❌ Ausente'}
                </span>
                {isProduction && stripeKeys.hasSecretKey && (
                  <span className="ml-2 px-2 py-1 text-xs rounded bg-orange-100 text-orange-700">
                    🔴 PRODUÇÃO
                  </span>
                )}
              </div>
              {stripeKeys.maskedSecretKey && (
                <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded font-mono">
                  {stripeKeys.maskedSecretKey}
                </code>
              )}
            </div>

            {/* Public Key Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium text-gray-700">Public Key:</span>
                <span className={`ml-2 px-2 py-1 text-xs rounded ${
                  stripeKeys.hasPublicKey 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {stripeKeys.hasPublicKey ? '✅ Configurada' : '❌ Ausente'}
                </span>
              </div>
              {stripeKeys.maskedPublicKey && (
                <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded font-mono">
                  {stripeKeys.maskedPublicKey}
                </code>
              )}
            </div>

            {/* Última atualização */}
            <div className="text-sm text-gray-500 border-t pt-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Última verificação: {new Date(stripeKeys.lastUpdated).toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Erro ao carregar status das chaves
          </div>
        )}
      </div>

      {/* Formulário de atualização - apenas se permitido */}
      {allowEdit && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Atualizar Chaves
            </h3>
            <Button
              variant="outline"
              onClick={() => setShowForm(!showForm)}
              className={showForm ? "bg-gray-100" : "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"}
            >
              {showForm ? 'Cancelar' : 'Alterar Chaves'}
            </Button>
          </div>

          {showForm ? (
            <form onSubmit={handleUpdateKeys} className="space-y-4">
              <div>
                <Label htmlFor="secretKey" className="text-sm font-medium text-gray-700">
                  Stripe Secret Key
                </Label>
                <Input
                  id="secretKey"
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="sk_test_... ou sk_live_..."
                  className="font-mono text-sm mt-1"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Deve começar com 'sk_'. Mantenha esta chave sempre secreta.
                </p>
              </div>

              <div>
                <Label htmlFor="publicKey" className="text-sm font-medium text-gray-700">
                  Stripe Public Key
                </Label>
                <Input
                  id="publicKey"
                  type="text"
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  placeholder="pk_test_... ou pk_live_..."
                  className="font-mono text-sm mt-1"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Deve começar com 'pk_'. Esta chave é segura para uso público.
                </p>
              </div>

              {/* Aviso importante */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      ⚠️ ATENÇÃO - Importante
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>As chaves serão atualizadas temporariamente (até o próximo restart)</li>
                        <li>Para persistência permanente, atualize no painel de Secrets do Replit</li>
                        <li>Teste sempre em ambiente de desenvolvimento primeiro</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões do formulário */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isUpdating || !secretKey || !publicKey}
                  className="flex items-center gap-2"
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Atualizar Chaves
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-sm text-gray-600 space-y-2">
              <p>• Clique em "Alterar Chaves" para inserir novas credenciais da Stripe</p>
              <p>• As chaves são validadas automaticamente antes da aplicação</p>
              <p>• Todo acesso é auditado e registrado nos logs do sistema</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}