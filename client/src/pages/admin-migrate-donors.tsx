import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface MigrationDetail {
  doadorId: number;
  plano: string;
  valor: number | string;
  customerId?: string;
  subscriptionId?: string;
  periodicidade?: string;
  status: 'success' | 'error' | 'skipped';
  reason?: string;
  error?: string;
}

interface MigrationResult {
  total: number;
  migrated: number;
  errors: number;
  skipped: number;
  details: MigrationDetail[];
}

export default function AdminMigrateDonors() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const { toast } = useToast();

  const handleMigration = async () => {
    const confirmMessage = `
⚠️ ATENÇÃO - Você está prestes a:

1. Buscar todos os doadores que pagaram UMA VEZ
2. Criar assinaturas RECORRENTES no Stripe
3. Eles serão COBRADOS AUTOMATICAMENTE todo mês/trimestre/semestre/ano

Esses doadores serão migrados para assinaturas recorrentes.

Tem certeza que quer continuar?
    `.trim();

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/migrate-donors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao migrar doadores");
      }

      setResult(data);
      
      if (data.migrated > 0) {
        toast({
          title: "✅ Migração concluída!",
          description: `${data.migrated} doador(es) migrado(s) com sucesso!`,
        });
      } else if (data.skipped > 0) {
        toast({
          title: "⚠️ Migração finalizada",
          description: `${data.skipped} doador(es) foram pulados (sem cartão ou customer_id)`,
          variant: "default",
        });
      }
    } catch (error: any) {
      toast({
        title: "❌ Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-purple-900 flex items-center gap-2">
              <RefreshCw className="h-6 w-6" />
              Migrar Doadores para Assinaturas Recorrentes
            </CardTitle>
            <CardDescription>
              Converte doadores que pagaram uma vez em assinaturas recorrentes automáticas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-900 font-bold">Atenção!</AlertTitle>
              <AlertDescription className="text-yellow-800 space-y-2">
                <p>Esta ferramenta irá:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Buscar doadores que pagaram UMA VEZ (sem assinatura ativa)</li>
                  <li>Criar assinaturas recorrentes no Stripe usando o cartão já salvo</li>
                  <li>Ativar cobranças AUTOMÁTICAS conforme periodicidade escolhida</li>
                </ul>
                <p className="font-semibold mt-2">
                  ⚠️ Os doadores serão cobrados automaticamente a partir de agora!
                </p>
              </AlertDescription>
            </Alert>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-blue-900">Como funciona:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 ml-2">
                <li>Busca o <strong>customer_id</strong> no Stripe pelo payment_intent</li>
                <li>Verifica se o customer tem <strong>cartão salvo</strong></li>
                <li>Cria uma <strong>assinatura recorrente</strong> com a periodicidade escolhida</li>
                <li>Atualiza o banco de dados com o <strong>subscription_id</strong></li>
              </ol>
            </div>

            <Button
              onClick={handleMigration}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              size="lg"
              data-testid="button-migrate"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Migrando doadores...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Executar Migração
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold">Resultado da Migração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{result.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="bg-green-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-900">{result.migrated}</div>
                  <div className="text-sm text-green-700">✅ Migrados</div>
                </div>
                <div className="bg-yellow-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-900">{result.skipped}</div>
                  <div className="text-sm text-yellow-700">⚠️ Pulados</div>
                </div>
                <div className="bg-red-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-900">{result.errors}</div>
                  <div className="text-sm text-red-700">❌ Erros</div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Detalhes:</h3>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {result.details.map((detail, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        detail.status === 'success'
                          ? 'bg-green-50 border-green-200'
                          : detail.status === 'skipped'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {detail.status === 'success' ? (
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : detail.status === 'skipped' ? (
                          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">
                              Doador #{detail.doadorId}
                            </span>
                            <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                              {detail.plano.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-600">
                              R$ {typeof detail.valor === 'string' ? detail.valor : detail.valor.toFixed(2)}
                            </span>
                          </div>
                          
                          {detail.status === 'success' && (
                            <div className="text-xs text-green-700 space-y-0.5">
                              <div>✅ Subscription: <code className="bg-green-100 px-1 rounded">{detail.subscriptionId}</code></div>
                              <div>📅 Periodicidade: {detail.periodicidade}</div>
                            </div>
                          )}
                          
                          {detail.status === 'skipped' && (
                            <div className="text-xs text-yellow-700">
                              ⚠️ {detail.reason}
                            </div>
                          )}
                          
                          {detail.status === 'error' && (
                            <div className="text-xs text-red-700">
                              ❌ {detail.error}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
