import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mail, Lock, Eye, EyeOff, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import girlImage from "../app-assets/Gemini_Generated_Image_b8g3y7b8g3y7b8g3_1769198371783.png";

export default function ProfessorLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

    if (!senha.trim()) {
      toast({
        title: "Senha obrigatória",
        description: "Por favor, digite sua senha",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);

    try {
      const data = await apiRequest("/api/login/professor", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), senha: senha.trim() })
      });

      sessionStorage.setItem("professor_auth", "true");
      sessionStorage.setItem("professor_data", JSON.stringify(data.professor));
      
      localStorage.setItem("userId", data.userId.toString());
      localStorage.setItem("professorId", data.professor.id.toString());
      localStorage.setItem("userPapel", data.professor.role || "professor");
      localStorage.setItem("userName", data.professor.nome || "Professor");
      localStorage.setItem("isVerified", "true");

      console.log("✅ Login professor bem-sucedido:", data.professor, "userId:", data.userId);

      setLocation(data.professor.redirectPath || "/professor");

    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      toast({
        title: "Erro no login",
        description: error.message || "Verifique suas credenciais",
        variant: "destructive"
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
      <div className="w-full md:w-1/2 min-h-screen bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-500 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
        {/* Círculos decorativos de fundo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

        {/* Container com título e card */}
        <div className="w-full max-w-md relative z-10 space-y-4">
          {/* Título Principal */}
          <h1 className="text-3xl md:text-4xl text-black text-center drop-shadow-lg">
            <span className="font-bold">Impacto</span> <span className="italic">Social</span>
          </h1>

          {/* Card Glassmorphism */}
          <div className="backdrop-blur-xl bg-yellow-100/40 rounded-3xl p-6 md:p-8 shadow-2xl border border-yellow-200/50 relative overflow-hidden">
            {/* Formas geométricas decorativas */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-400/40 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-yellow-500/40 rounded-full blur-3xl"></div>
            
            <div className="space-y-4 relative z-10">
              {/* Campo Email */}
              <div>
                <label htmlFor="email-input" className="block text-sm font-medium text-black/90 mb-2">
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
                    data-testid="input-email-professor"
                    disabled={loading}
                    aria-label="E-mail institucional"
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div>
                <label htmlFor="senha-input" className="block text-sm font-medium text-black/90 mb-2">
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
                    data-testid="input-senha-professor"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    data-testid="button-toggle-password-professor"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
          
              {/* Identificador da tela */}
              <div className="text-center">
                <p className="text-sm text-black/80">
                  Acesso para Professores
                </p>
              </div>

              {/* Botão Entrar */}
              <Button 
                onClick={handleLogin}
                className="w-full h-12 bg-black hover:bg-gray-800 text-white font-bold text-base rounded-xl shadow-lg transition-all"
                data-testid="button-login-professor"
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
                <p className="text-xs text-black/70">
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
