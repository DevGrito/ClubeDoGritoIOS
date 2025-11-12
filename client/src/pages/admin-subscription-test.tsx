import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AdminSubscriptionTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleConvert = async () => {
    if (!confirm('Tem certeza que deseja converter todas as doações antigas em assinaturas?\n\nIsso criará subscriptions no Stripe para todos os doadores que ainda não têm uma.')) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await apiRequest('/api/admin/convert-donations-to-subscriptions', {
        method: 'POST',
      });

      setResult(response);
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Erro ao converter doações'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-900 dark:text-purple-100 mb-2">
            🔧 Painel Admin - Conversão de Doações
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Converter doações antigas em assinaturas recorrentes
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>⚙️ Converter Doações em Assinaturas</CardTitle>
            <CardDescription>
              Este botão irá buscar todas as doações que ainda não foram convertidas em assinaturas
              e criará subscriptions recorrentes mensais no Stripe para cada uma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                <strong>ATENÇÃO:</strong> Esta ação criará subscriptions no Stripe para todos os
                doadores que fizeram pagamentos únicos. Cada pessoa receberá um novo PaymentIntent
                que precisará ser pago para ativar a assinatura mensal recorrente.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleConvert}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="lg"
              data-testid="button-convert-donations"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Convertendo...
                </>
              ) : (
                <>🔄 Converter Doações em Assinaturas</>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className={result.success ? "border-green-500" : "border-red-500"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-green-700 dark:text-green-400">Conversão Concluída</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="text-red-700 dark:text-red-400">Erro na Conversão</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.success ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600">{result.total}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Total Encontrados</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-green-500">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600">{result.sucessos}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">✅ Convertidos</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-red-500">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-red-600">{result.erros}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">❌ Erros</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {result.detalhes?.sucessos && result.detalhes.sucessos.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Subscriptions Criadas com Sucesso:
                      </h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {result.detalhes.sucessos.map((item: any, idx: number) => (
                          <Card key={idx} className="bg-green-50 dark:bg-green-900/20">
                            <CardContent className="p-4">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <strong>Doador ID:</strong> #{item.doadorId}
                                </div>
                                <div>
                                  <strong>Usuário ID:</strong> #{item.userId}
                                </div>
                                <div>
                                  <strong>Plano:</strong> {item.plano}
                                </div>
                                <div>
                                  <strong>Valor:</strong> R$ {item.valor.toFixed(2)}
                                </div>
                                <div className="col-span-2">
                                  <strong>Subscription ID:</strong>
                                  <code className="ml-2 text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded">
                                    {item.subscriptionId}
                                  </code>
                                </div>
                                <div className="col-span-2">
                                  <Badge variant="secondary" className="text-xs">
                                    PaymentIntent: {item.paymentIntentId}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.detalhes?.erros && result.detalhes.erros.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Erros Encontrados:
                      </h3>
                      <div className="space-y-2">
                        {result.detalhes.erros.map((item: any, idx: number) => (
                          <Alert key={idx} variant="destructive">
                            <AlertDescription>
                              <strong>Doador #{item.doadorId}:</strong> {item.error}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertDescription>
                    <strong>Erro:</strong> {result.error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>ℹ️ Informações Importantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>✅ <strong>Periodicidade:</strong> O sistema agora suporta mensal, trimestral, semestral e anual</p>
            <p>✅ <strong>Conversão:</strong> Doações antigas serão convertidas em subscriptions mensais</p>
            <p>✅ <strong>Status:</strong> Após conversão, as pessoas precisam completar o pagamento</p>
            <p>✅ <strong>Stripe:</strong> Todas as subscriptions serão criadas no Stripe com cobrança recorrente</p>
            <p>⚠️ <strong>Atenção:</strong> Apenas admin pode executar esta ação</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
