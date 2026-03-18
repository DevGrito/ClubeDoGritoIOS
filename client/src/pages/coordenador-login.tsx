
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import girlImage from "../app-assets/Gemini_Generated_Image_b8g3y7b8g3y7b8g3_1769198371783.png";

export default function CoordenadorLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    // Validar email
    if (!email.trim()) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, digite seu email institucional",
        variant: "destructive"
      });
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast({
        title: "Email inválido",
        description: "Por favor, digite um email válido",
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
        const response = await fetch("/api/login/coordenador", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), senha: senha.trim() }),
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          toast({
            title: "Erro no login",
            description: data.error || "Coordenador não encontrado",
            variant: "destructive",
          });
          return;
        }
        if (!data?.success || !data?.coordenador) {
          toast({
            title: "Erro no login",
            description: data?.error || "Resposta inválida do servidor",
            variant: "destructive",
          });
          return;
        }

        sessionStorage.setItem("coordenador_auth", "true");
        sessionStorage.setItem("coordenador_data", JSON.stringify(data.coordenador));

        // ✅ NÃO assume userId
        if (data?.coordenador?.id != null) {
          localStorage.setItem("coordenadorId", String(data.coordenador.id));
        }

        // Se seu app exige userId pra algumas telas, use fallback:
       // ✅ chaves EXCLUSIVAS de coordenador
        localStorage.setItem("coordenadorId", String(data.coordenador.id));
        localStorage.setItem("coordenadorNome", data.coordenador.nome || "Coordenador");
        localStorage.setItem("coordenadorEmail", data.coordenador.email || "");
       const role = (data.role || data.coordenador.role || "coordenador_inclusao").toLowerCase();

        // ✅ grava “verificado” pra AutoRedirect não te jogar pra /plans
        localStorage.setItem("isVerified", "true");

        // ✅ marca que é coordenador (ajuda o bypass)
        localStorage.setItem("actorType", "coordenador");
        localStorage.setItem("userPapel", role);

        // ✅ IGNORA redirectPath do backend (ele pode estar apontando pra RBAC/plans)
        const roleRouteMap: Record<string, string> = {
          coordenador_inclusao: "/coordenador/inclusao-produtiva",
          coordenador_pec: "/coordenador/esporte-cultura",
          coordenador_psico: "/coordenador/psicossocial",
        };

       const target = roleRouteMap[role];
        if (!target) {
          toast({
            title: "Erro no login",
            description: "Seu perfil não foi identificado. Fale com o admin.",
            variant: "destructive",
          });
          return;
        }
        setLocation(target);
      } catch (error) {
        console.error("Erro ao fazer login:", error);
        toast({
          title: "Erro",
          description: "Erro ao conectar com o servidor",
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
          alt="Criança do Instituto O Grito" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Lado Direito - Login */}
      <div className="w-full md:w-1/2 min-h-screen bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-500 flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
        {/* Círculos decorativos de fundo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

        {/* Container com título e card */}
        <div className="w-full max-w-md relative z-10 space-y-6">
          {/* Título Principal */}
          <h1 className="text-4xl md:text-5xl text-black text-center drop-shadow-lg">
            <span className="font-bold">Impacto</span> <span className="italic">Social</span>
          </h1>

          {/* Card Glassmorphism */}
          <div className="backdrop-blur-xl bg-gray-400/30 rounded-3xl p-8 md:p-10 shadow-2xl border border-white/30 relative overflow-hidden">
            {/* Formas geométricas decorativas */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-400/40 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-yellow-500/40 rounded-full blur-3xl"></div>
            
            <div className="space-y-6 relative z-10">
              {/* Campo Email */}
              <div>
                <label htmlFor="email-input" className="block text-sm font-medium text-white/90 mb-2">
                  E-mail
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <Input
                    id="email-input"
                    type="email"
                    placeholder="E-mail institucional"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !loading && handleLogin()}
                    className="h-11 pl-10 bg-white border-0 text-gray-900 placeholder:text-gray-400 text-sm focus:ring-2 focus:ring-white/50 rounded-xl"
                    data-testid="input-email-coordenador"
                    disabled={loading}
                    aria-label="E-mail institucional"
                    autoComplete="off"
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
                    placeholder="Senha institucional"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !loading && handleLogin()}
                    className="h-11 pl-10 pr-10 bg-white border-0 text-gray-900 placeholder:text-gray-400 text-sm focus:ring-2 focus:ring-white/50 rounded-xl"
                    disabled={loading}
                    aria-label="Senha"
                    data-testid="input-senha-coordenador"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    data-testid="button-toggle-password-coordenador"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Identificador da tela */}
              <div className="text-center">
                <p className="text-sm text-white/80">
                  Acesso para Coordenadores
                </p>
              </div>

              {/* Botão Entrar */}
              <Button 
                onClick={handleLogin}
                className="w-full h-12 bg-green-600 hover:bg-yellow-500 text-white font-bold text-base rounded-xl shadow-lg transition-all"
                data-testid="button-login-coordenador"
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
                  Não tem conta? Entre em contato com Admin.
                </p>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
  );
}
