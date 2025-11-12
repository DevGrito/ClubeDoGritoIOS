import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/logo";

export default function CoordenadorLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!email.trim()) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, digite seu email institucional",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/login/coordenador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro no login",
          description: data.error || "Coordenador não encontrado",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Salvar sessão do coordenador
      sessionStorage.setItem("coordenador_auth", "true");
      sessionStorage.setItem("coordenador_data", JSON.stringify(data.coordenador));

      console.log("✅ Login bem-sucedido:", data.coordenador);

      // Redirecionar para o dashboard do setor
      setLocation(data.coordenador.redirectPath);

    } catch (error) {
      console.error("Erro ao fazer login:", error);
      toast({
        title: "Erro",
        description: "Erro ao conectar com o servidor",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Logo size="lg" className="mx-auto mb-6" />

        {/* Título e subtítulo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Entrar</h1>
          <p className="text-gray-600 text-sm">Digite seu e-mail para acessar</p>
        </div>

        {/* Card de login */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-4">
            {/* Campo de email */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                E-mail
              </label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && handleLogin()}
                className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-black focus:ring-black rounded-lg"
                data-testid="input-email-coordenador"
                disabled={loading}
              />
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50 bg-white rounded-lg font-medium"
                disabled={loading}
                data-testid="button-voltar"
              >
                Voltar
              </Button>

              <Button 
                onClick={handleLogin}
                className="flex-1 h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-lg"
                data-testid="button-login-coordenador"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
