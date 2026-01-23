import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Shield, Key } from "lucide-react";

export default function AdminRedeCredenciais() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [pv, setPv] = useState("");
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    try {
      const res = await fetch("/api/admin/rede/status");
      const data = await res.json();
      setConfigured(data.configured);
    } catch (error) {
      console.error("Erro ao verificar status:", error);
      setConfigured(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    
    if (!pv.trim() || !token.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha PV e Token",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/rede/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pv: pv.trim(), token: token.trim() })
      });

      const data = await res.json();

      if (data.ok) {
        toast({
          title: "Sucesso!",
          description: "Credenciais salvas com segurança",
        });
        setConfigured(true);
        setPv("");
        setToken("");
      } else {
        throw new Error(data.error || "Erro ao salvar");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar credenciais",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <CardTitle className="text-2xl">Credenciais Rede (e.Rede)</CardTitle>
              <CardDescription>
                Configure as credenciais de integração com o gateway de pagamento Rede
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status */}
          <Alert className={configured ? "border-green-500" : configured === false ? "border-yellow-500" : ""}>
            <div className="flex items-center gap-2">
              {configured === null ? (
                <div className="h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : configured ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-yellow-600" />
              )}
              <AlertDescription className="font-medium">
                Status: {configured === null ? "Verificando..." : configured ? "Configurado" : "Pendente"}
              </AlertDescription>
            </div>
          </Alert>

          {/* Formulário */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pv" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                PV (Ponto de Venda / Filiação)
              </Label>
              <Input
                id="pv"
                type="text"
                placeholder="Ex: 1234567890"
                value={pv}
                onChange={(e) => setPv(e.target.value)}
                data-testid="input-rede-pv"
              />
              <p className="text-sm text-gray-500">
                Número do PV fornecido pela Rede
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="token" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Token de Autenticação
              </Label>
              <Input
                id="token"
                type="password"
                placeholder="Token da API Rede"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                data-testid="input-rede-token"
              />
              <p className="text-sm text-gray-500">
                Token de acesso à API da Rede
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              data-testid="button-salvar-credenciais"
            >
              {isLoading ? "Salvando..." : "Salvar Credenciais"}
            </Button>
          </form>

          {/* Informações de segurança */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Segurança:</strong> Os valores são criptografados com AES-256-GCM antes de serem armazenados 
              no banco de dados. Não ficam visíveis depois de salvos.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
