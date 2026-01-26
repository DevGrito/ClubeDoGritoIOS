
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, User, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import girlImage from "@assets/image_1769199255257.png";

export default function DevLogin() {
  const [, setLocation] = useLocation();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    // Validar usuário
    if (!usuario.trim()) {
      toast({
        title: "Usuário obrigatório",
        description: "Por favor, digite seu usuário",
        variant: "destructive"
      });
      return;
    }

    // Validar senha
    if (!senha.trim()) {
      toast({
        title: "Senha obrigatória",
        description: "Por favor, digite sua senha",
        variant: "destructive"
      });
      return;
    }

    // Validar política de senha
    if (senha.length < 8) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter no mínimo 8 caracteres",
        variant: "destructive"
      });
      return;
    }

    if (!/[A-Z]/.test(senha)) {
      toast({
        title: "Senha fraca",
        description: "A senha deve conter pelo menos uma letra maiúscula",
        variant: "destructive"
      });
      return;
    }

    if (!/[0-9]/.test(senha)) {
      toast({
        title: "Senha fraca",
        description: "A senha deve conter pelo menos um número",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/login/developer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, senha }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      setLoading(false);
      toast({
        title: "Erro no login",
        description: data.error ?? "Usuário ou senha inválidos",
        variant: "destructive",
      });
      return;
    }

    // 👇 pega o papel retornado (dev ou dev-marketing)
    const devRole = data.developer?.role ?? "dev";
    if (devRole === "dev-marketing") {
      setLoading(false);
      setLocation("/dev/marketing");
    } else {
      setLoading(false);
      setLocation("/dev");
    }

    // salva contexto de sessão
    localStorage.setItem("userPapel", devRole);
    localStorage.setItem("isVerified", "true");
    sessionStorage.setItem("dev_session", "active");

    // se for dev-marketing, manda direto pra tela certa
    if (devRole === "dev-marketing") {
      setLocation("/dev/marketing");
    } else {
      setLocation("/dev");
    }

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
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Lado Esquerdo - Imagem */}
      <div className="w-full md:w-1/2 h-64 md:h-screen relative overflow-hidden">
        <img 
          src={girlImage} 
          alt="Criança do Instituto O Grito" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Lado Direito - Login */}
      <div className="w-full md:w-1/2 min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
        {/* Círculos decorativos de fundo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gray-800/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gray-700/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

        {/* Container com título e card */}
        <div className="w-full max-w-md relative z-10 space-y-6">
          {/* Título Principal */}
          <h1 className="text-4xl md:text-5xl text-white text-center drop-shadow-lg font-bold">
            Gritodev
          </h1>

          {/* Card Glassmorphism */}
          <div className="backdrop-blur-xl bg-gray-400/30 rounded-3xl p-8 md:p-10 shadow-2xl border border-white/30 relative overflow-hidden">
            {/* Formas geométricas decorativas */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-400/40 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-yellow-500/40 rounded-full blur-3xl"></div>
            
            <div className="space-y-6 relative z-10">
              {/* Campo Usuário */}
              <div>
                <label htmlFor="usuario-input" className="block text-sm font-medium text-white/90 mb-2">
                  Usuário
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <User className="w-4 h-4" />
                  </div>
                  <Input
                    id="usuario-input"
                    type="text"
                    placeholder=""
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !loading && handleLogin()}
                    className="h-11 pl-10 bg-white border-0 text-gray-900 placeholder:text-gray-400 text-sm focus:ring-2 focus:ring-white/50 rounded-xl"
                    data-testid="input-usuario-dev"
                    disabled={loading}
                    aria-label="Usuário"
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div>
                <label htmlFor="senha-input" className="block text-sm font-medium text-white/90 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <Input
                    id="senha-input"
                    type={showPassword ? "text" : "password"}
                    placeholder=""
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !loading && handleLogin()}
                    className="h-11 pl-10 pr-10 bg-white border-0 text-gray-900 placeholder:text-gray-400 text-sm focus:ring-2 focus:ring-white/50 rounded-xl"
                    disabled={loading}
                    aria-label="Senha"
                    data-testid="input-senha-dev"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    data-testid="button-toggle-password-dev"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Identificador da tela */}
              <div className="text-center">
                <p className="text-sm text-white/80">
                  Acesso para Desenvolvedores
                </p>
              </div>

              {/* Botão Entrar */}
              <Button 
                onClick={handleLogin}
                className="w-full h-12 bg-green-600 hover:bg-yellow-500 text-white font-bold text-base rounded-xl shadow-lg transition-all"
                data-testid="button-login-dev"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>

              {/* Texto rodapé */}
              <div className="text-center pt-4">
                <p className="text-xs text-white/70">
                  Acesso restrito a desenvolvedores autorizados
                </p>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
  );
}
