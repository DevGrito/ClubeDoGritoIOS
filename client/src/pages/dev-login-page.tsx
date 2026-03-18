import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, User, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import girlImage from "../app-assets/image_1769199255257.png";

export default function DevLoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!usuario || !senha) {
      toast({
        title: "Erro",
        description: "Preencha usuário e senha",
        variant: "destructive",
      });
      return;
    }

    // ✅ LIMPAR TUDO ANTES DO LOGIN
    localStorage.clear();
    sessionStorage.clear();

    setLoading(true);

    try {
      const response = await apiRequest("/api/dev/login", {
        method: "POST",
        body: JSON.stringify({ usuario, senha }),
      }) as {
        success: boolean;
        developer: {
          id: number;
          usuario: string;
          nome: string;
          email?: string;
          tipo?: string;
        };
      };

      if (response.success && response.developer) {
        // Determinar o papel baseado no tipo do desenvolvedor
        const tipo = response.developer.tipo || "dev";
        const userPapel = tipo === "admin" ? "dev-admin" : (tipo === "marketing" ? "dev-marketing" : "dev");
        
        // Salvar dados na sessão (localStorage para compartilhar entre abas)
        localStorage.setItem("userPapel", userPapel);
        localStorage.setItem("isVerified", "true");
        localStorage.setItem("userId", response.developer.id.toString());
        localStorage.setItem("userName", response.developer.nome);
        localStorage.setItem("dev_auth", "true"); // ✅ MUDADO: localStorage ao invés de sessionStorage

        toast({
          title: "Login realizado!",
          description: `Bem-vindo, ${response.developer.nome}`,
        });

        // Redirecionar baseado no tipo/usuário do desenvolvedor
        if (response.developer.usuario === "dashboard_lancamento") {
          setLocation("/painel/estrategico/lancamento");
        } else if (tipo === "admin") {
          setLocation("/dev");
        } else if (tipo === "marketing") {
          setLocation("/dev/marketing");
        } else {
          setLocation("/dev");
        }
      }
    } catch (error: any) {
      console.error("Erro no login:", error);
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Lado Esquerdo - Imagem */}
      <div className="w-full md:w-1/2 h-64 md:h-screen relative overflow-hidden">
        <img 
          src={girlImage} 
          alt="Developer Girl" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Lado Direito - Login */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="w-full max-w-md space-y-8">
          {/* Título */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-2">Gritodev</h1>
          </div>

          {/* Card com Glassmorphism */}
          <div className="bg-gradient-to-br from-gray-700/40 via-gray-600/30 to-yellow-600/20 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
            <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
              {/* Campo Usuário */}
              <div className="space-y-2">
                <label className="text-sm text-white font-medium">Usuário</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                  <Input
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className="pl-10 h-12 bg-yellow-50 border-0 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-yellow-400 rounded-lg"
                    disabled={loading}
                    autoComplete="off"
                    data-testid="input-usuario"
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div className="space-y-2">
                <label className="text-sm text-white font-medium">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-yellow-50 border-0 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-yellow-400 rounded-lg"
                    disabled={loading}
                    autoComplete="new-password"
                    data-testid="input-senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Texto Acesso */}
              <p className="text-center text-sm text-gray-300">
                Acesso para Desenvolvedores
              </p>

              {/* Botão Login */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-all duration-300 shadow-lg"
                data-testid="button-login"
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>

              {/* Rodapé */}
              <p className="text-center text-xs text-gray-400 mt-4">
                Acesso restrito a desenvolvedores autorizados
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
