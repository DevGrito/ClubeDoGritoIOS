import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Página de administração para autorizar conta PagBank via OAuth2
 * 
 * FLUXO:
 * 1. Verificar se já existe autorização ativa
 * 2. Se não, mostrar botão "Autorizar PagBank"
 * 3. Ao clicar, redireciona para /api/pagbank/oauth/authorize
 * 4. PagBank redireciona para /api/pagbank/oauth/callback
 * 5. Callback salva token e redireciona de volta para esta página com ?success=true
 */
export default function AdminPagBankOAuth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Verificar status da autorização
  const { data: status, isLoading, refetch } = useQuery<{
    authorized: boolean;
    message: string;
  }>({
    queryKey: ['/api/pagbank/oauth/status'],
  });

  // Processar parâmetros da URL (success/error após callback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');
    const errorMessage = params.get('error_description') || params.get('message');

    if (success === 'true') {
      toast({
        title: 'Autorização concluída!',
        description: 'Sua conta PagBank foi autorizada com sucesso. Você já pode processar pagamentos.',
      });
      // Limpar URL e recarregar status
      window.history.replaceState({}, '', '/admin/pagbank-oauth');
      refetch();
    } else if (error) {
      toast({
        title: 'Erro na autorização',
        description: errorMessage || 'Ocorreu um erro ao autorizar sua conta PagBank.',
        variant: 'destructive',
      });
      window.history.replaceState({}, '', '/admin/pagbank-oauth');
    }
  }, [toast, refetch]);

  const handleAuthorize = () => {
    // Redirecionar para o endpoint que inicia o fluxo OAuth2
    window.location.href = '/api/pagbank/oauth/authorize';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/admin')}
            data-testid="button-voltar"
          >
            ← Voltar para Admin
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/PagBank_logo.svg/512px-PagBank_logo.svg.png" 
                alt="PagBank" 
                className="h-8"
              />
              Autorização PagBank Connect
            </CardTitle>
            <CardDescription>
              Configure a integração OAuth2 para processar pagamentos de ingressos via PagBank
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : status?.authorized ? (
              // ✅ AUTORIZADO
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    {status.message}
                  </AlertDescription>
                </Alert>

                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                    ✅ Configuração completa
                  </h3>
                  <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                    <li>• Token OAuth2 ativo e válido</li>
                    <li>• Pagamentos com cartão de crédito habilitados</li>
                    <li>• Pagamentos via PIX habilitados</li>
                    <li>• Webhooks configurados automaticamente</li>
                  </ul>
                </div>

                <Button
                  onClick={handleAuthorize}
                  variant="outline"
                  className="w-full"
                  data-testid="button-reautorizar"
                >
                  🔄 Renovar autorização
                </Button>
              </div>
            ) : (
              // ❌ NÃO AUTORIZADO
              <div className="space-y-4">
                <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                    {status?.message || 'Autorização necessária para processar pagamentos'}
                  </AlertDescription>
                </Alert>

                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                    🔐 Como funciona a autorização OAuth2
                  </h3>
                  <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-400 list-decimal list-inside">
                    <li>Clique no botão "Autorizar PagBank" abaixo</li>
                    <li>Você será redirecionado para o site do PagBank</li>
                    <li>Faça login com sua conta PagBank Sandbox</li>
                    <li>Aprove as permissões solicitadas</li>
                    <li>Você será redirecionado de volta automaticamente</li>
                  </ol>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                    📋 Credenciais de Sandbox para teste
                  </h4>
                  <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1 font-mono">
                    <p>Email: y384790342717037749@sandbox.pagseguro.com.br</p>
                    <p>App ID: app1148840336</p>
                  </div>
                </div>

                <Button
                  onClick={handleAuthorize}
                  className="w-full bg-[#00A868] hover:bg-[#008f5a] text-white"
                  data-testid="button-autorizar"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Autorizar PagBank
                </Button>
              </div>
            )}

            <div className="pt-4 border-t">
              <details className="text-sm">
                <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  🔧 Informações técnicas
                </summary>
                <div className="space-y-2 text-slate-600 dark:text-slate-400 text-xs">
                  <p>
                    <strong>Ambiente:</strong> Sandbox (teste)
                  </p>
                  <p>
                    <strong>Escopo:</strong> APENAS compra de ingressos (demais pagamentos permanecem no Stripe)
                  </p>
                  <p>
                    <strong>Token:</strong> Armazenado com segurança no banco de dados
                  </p>
                  <p>
                    <strong>Renovação:</strong> Automática via refresh_token antes de expirar
                  </p>
                  <p>
                    <strong>Endpoints:</strong>
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>GET /api/pagbank/oauth/authorize - Iniciar autorização</li>
                    <li>GET /api/pagbank/oauth/callback - Receber callback</li>
                    <li>GET /api/pagbank/oauth/status - Verificar status</li>
                  </ul>
                </div>
              </details>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
