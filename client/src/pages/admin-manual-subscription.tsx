import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function AdminManualSubscription() {
  const [userId, setUserId] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState("9.90");
  const [intervalMonths, setIntervalMonths] = useState("1");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleCreateSubscription = async () => {
    if (!userId || !monthlyAmount) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/create-manual-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: parseInt(userId),
          monthlyAmount: parseFloat(monthlyAmount),
          intervalMonths: parseInt(intervalMonths),
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar subscription");
      }

      setResult({ success: true, data });
      toast({
        title: "✅ Subscription criada!",
        description: data.message,
      });
    } catch (error: any) {
      setResult({ success: false, error: error.message });
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
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-purple-900">
              🔧 Criar Subscription Manual
            </CardTitle>
            <CardDescription>
              Crie uma subscription recorrente para um usuário que já fez pelo menos um pagamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="userId">ID do Usuário</Label>
              <Input
                id="userId"
                type="number"
                placeholder="Ex: 90"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                data-testid="input-user-id"
              />
              <p className="text-sm text-muted-foreground">
                ID do usuário no banco de dados (ex: Alessandra = 90)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor Mensal (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="9.90"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
                data-testid="input-monthly-amount"
              />
              <p className="text-sm text-muted-foreground">
                Valor que será cobrado mensalmente
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interval">Intervalo de Cobrança</Label>
              <Select value={intervalMonths} onValueChange={setIntervalMonths}>
                <SelectTrigger data-testid="select-interval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Mensal (todo mês)</SelectItem>
                  <SelectItem value="3">Trimestral (a cada 3 meses)</SelectItem>
                  <SelectItem value="6">Semestral (a cada 6 meses)</SelectItem>
                  <SelectItem value="12">Anual (todo ano)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-yellow-900">⚠️ Pré-requisitos</h3>
              <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                <li>Usuário deve ter feito pelo menos um pagamento anteriormente</li>
                <li>Usuário deve ter um cartão salvo no Stripe</li>
                <li>A cobrança será automática no intervalo escolhido</li>
              </ul>
            </div>

            <Button
              onClick={handleCreateSubscription}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700"
              data-testid="button-create-subscription"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando subscription...
                </>
              ) : (
                "🚀 Criar Subscription Recorrente"
              )}
            </Button>

            {result && (
              <Card className={result.success ? "border-green-500" : "border-red-500"}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {result.success ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-green-700">Sucesso!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="text-red-700">Erro</span>
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.success ? (
                    <div className="space-y-2 text-sm">
                      <p><strong>Subscription ID:</strong> {result.data.subscription.id}</p>
                      <p><strong>Status:</strong> {result.data.subscription.status}</p>
                      <p><strong>Customer ID:</strong> {result.data.subscription.customerId}</p>
                      <p><strong>Valor:</strong> R$ {result.data.subscription.amount}</p>
                      <p><strong>Intervalo:</strong> {result.data.subscription.interval} mês(es)</p>
                      <p><strong>Próxima cobrança:</strong> {new Date(result.data.subscription.nextBillingDate).toLocaleDateString('pt-BR')}</p>
                      <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                        <p className="text-green-800 font-medium">{result.data.message}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-red-700 font-medium">{result.error}</p>
                      <pre className="text-xs bg-red-50 p-2 rounded overflow-auto">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-sm text-blue-900">📋 Exemplo: Alessandra</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-800">
                <ul className="space-y-1">
                  <li><strong>User ID:</strong> 90</li>
                  <li><strong>Nome:</strong> Alessandra Rodrigues Martins</li>
                  <li><strong>Telefone:</strong> +5531995013231</li>
                  <li><strong>Valor:</strong> R$ 9,90/mês</li>
                  <li><strong>Payment Intent:</strong> pi_3SBg1nHT8727OGtY19l0PQJA</li>
                </ul>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
