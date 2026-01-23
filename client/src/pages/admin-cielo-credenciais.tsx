import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Save, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  merchantId: z.string().min(1, "MerchantId é obrigatório"),
  merchantKey: z.string().min(1, "MerchantKey é obrigatório")
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminCieloCredenciais() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      merchantId: "",
      merchantKey: ""
    }
  });

  useEffect(() => {
    checkCieloStatus();
  }, []);

  async function checkCieloStatus() {
    try {
      const res = await fetch('/api/admin/cielo/status');
      const data = await res.json();
      setIsConfigured(data.configured);
    } catch (error) {
      console.error('Erro ao verificar status Cielo:', error);
    } finally {
      setCheckingStatus(false);
    }
  }

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/cielo/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });

      const data = await response.json();

      if (data.ok) {
        toast({
          title: "✅ Credenciais salvas!",
          description: "As credenciais da Cielo foram salvas e criptografadas com sucesso.",
        });
        setIsConfigured(true);
        form.reset();
      } else {
        toast({
          title: "❌ Erro ao salvar",
          description: data.error || "Erro desconhecido",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "❌ Erro",
        description: error.message || "Erro ao salvar credenciais",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dev">
            <Button variant="outline" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Configurar Credenciais Cielo
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Configure as credenciais da Cielo API 3.0 (criptografadas no banco)
            </p>
          </div>
        </div>

        {checkingStatus ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600 dark:text-gray-400">Verificando status...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Alert className={isConfigured ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" : "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800"}>
              {isConfigured ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              )}
              <AlertDescription className={isConfigured ? "text-green-800 dark:text-green-200" : "text-yellow-800 dark:text-yellow-200"}>
                {isConfigured 
                  ? "✅ Credenciais da Cielo já estão configuradas"
                  : "⚠️ Credenciais da Cielo não configuradas"}
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Credenciais API Cielo</CardTitle>
                <CardDescription>
                  Insira suas credenciais da Cielo API 3.0. Elas serão criptografadas usando AES-256-GCM antes de serem armazenadas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="merchantId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Merchant ID</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" 
                              {...field} 
                              data-testid="input-merchant-id"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="merchantKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Merchant Key</FormLabel>
                          <FormControl>
                            <Input 
                              type="password"
                              placeholder="••••••••••••••••••••••••••••••••" 
                              {...field} 
                              data-testid="input-merchant-key"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full"
                      data-testid="button-save-credentials"
                    >
                      {isLoading ? (
                        "Salvando..."
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Salvar Credenciais
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ℹ️ Informações sobre a Cielo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Onde encontrar as credenciais:</h3>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Acesse o portal da Cielo: <a href="https://cadastro.cieloecommerce.cielo.com.br" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">cadastro.cieloecommerce.cielo.com.br</a></li>
                    <li>Faça login com suas credenciais</li>
                    <li>Vá em "Configurações" → "Dados Cadastrais"</li>
                    <li>Copie o MerchantId e o MerchantKey</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Ambientes:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Sandbox:</strong> apisandbox.cieloecommerce.cielo.com.br (testes)</li>
                    <li><strong>Produção:</strong> api.cieloecommerce.cielo.com.br (real)</li>
                  </ul>
                  <p className="mt-2">
                    O ambiente é controlado pela variável <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">CIELO_ENV</code> no .env
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Recursos implementados:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>✅ Checkout transparente com 3DS 2.0</li>
                    <li>✅ Parcelamento 1-10x sem juros</li>
                    <li>✅ Captura imediata (Capture=true)</li>
                    <li>✅ Autenticação 3D Secure (Authenticate=true)</li>
                    <li>✅ Consulta de status do pagamento</li>
                    <li>✅ Cancelamento de transação</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Cartões de teste (Sandbox):</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Visa:</strong> 4532117080573700 (CVV: 123, Validade: 12/2030)</li>
                    <li><strong>Mastercard:</strong> 5448280000000007 (CVV: 123, Validade: 12/2030)</li>
                    <li><strong>Elo:</strong> 6362970000457013 (CVV: 123, Validade: 12/2030)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
