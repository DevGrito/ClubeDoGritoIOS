
import { useState } from "react";
import { useLocation } from "wouter";
import { SessionExpiredAlert } from "@/components/SessionExpiredAlert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Lock, Eye, EyeOff, KeyRound, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { syncAuthSessionAfterLogin } from "@/lib/auth-session";
import { getPostLoginPath } from "@/lib/post-login-redirect";
import girlImage from "../app-assets/Gemini_Generated_Image_b8g3y7b8g3y7b8g3_1769198371783.png";

export default function CoordenadorLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  // Primeiro acesso
  const [primeiroAcesso, setPrimeiroAcesso] = useState(false);
  const [coordenadorId, setCoordenadorId] = useState<number | null>(null);
  const [coordenadorRole, setCoordenadorRole] = useState<string>("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      toast({ title: "Email obrigatório", description: "Por favor, digite seu email institucional", variant: "destructive" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast({ title: "Email inválido", description: "Por favor, digite um email válido", variant: "destructive" });
      return;
    }
    if (!senha.trim()) {
      toast({ title: "Senha obrigatória", description: "Por favor, digite sua senha", variant: "destructive" });
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
        toast({ title: "Erro no login", description: data.error || "Coordenador não encontrado", variant: "destructive" });
        return;
      }
      if (!data?.success) {
        toast({ title: "Erro no login", description: data?.error || "Resposta inválida do servidor", variant: "destructive" });
        return;
      }

      // Primeiro acesso: mostrar tela de definição de email e senha
      if (data.primeiroAcesso) {
        setCoordenadorId(data.coordenadorId);
        setCoordenadorRole(data.role || "tecnica_psico");
        setPrimeiroAcesso(true);
        return;
      }

      if (!data?.coordenador) {
        toast({ title: "Erro no login", description: "Resposta inválida do servidor", variant: "destructive" });
        return;
      }

      const session = await syncAuthSessionAfterLogin();
      if (!session?.id) {
        toast({ title: "Erro no login", description: "Sessão não foi criada. Tente novamente.", variant: "destructive" });
        return;
      }
      const target = getPostLoginPath(session);
      if (!target.startsWith("/coordenador") && !target.startsWith("/tecnica")) {
        toast({ title: "Erro no login", description: "Seu perfil não foi identificado. Fale com o admin.", variant: "destructive" });
        return;
      }
      setLocation(target);
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      toast({ title: "Erro", description: "Erro ao conectar com o servidor", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDefinirAcesso = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!novoEmail.trim() || !emailRegex.test(novoEmail.trim())) {
      toast({ title: "Email inválido", description: "Digite um email válido", variant: "destructive" });
      return;
    }
    if (novaSenha.length < 8) {
      toast({ title: "Senha muito curta", description: "A senha deve ter no mínimo 8 caracteres", variant: "destructive" });
      return;
    }
    if (!/[A-Z]/.test(novaSenha)) {
      toast({ title: "Senha fraca", description: "A senha deve conter pelo menos uma letra maiúscula", variant: "destructive" });
      return;
    }
    if (!/[0-9]/.test(novaSenha)) {
      toast({ title: "Senha fraca", description: "A senha deve conter pelo menos um número", variant: "destructive" });
      return;
    }
    if (novaSenha !== confirmarSenha) {
      toast({ title: "Senhas não coincidem", description: "A confirmação de senha não confere", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/coordenador/definir-acesso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coordenadorId, novoEmail: novoEmail.trim(), novaSenha }),
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: "Erro", description: data.error || "Erro ao salvar acesso", variant: "destructive" });
        return;
      }

      toast({ title: "Acesso configurado!", description: "Seu email e senha foram salvos com sucesso." });

      // Fazer login com as novas credenciais
      const loginResp = await fetch("/api/login/coordenador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: novoEmail.trim(), senha: novaSenha }),
        credentials: "include",
      });
      const loginData = await loginResp.json();
      if (!loginResp.ok || !loginData?.coordenador) {
        toast({ title: "Acesso salvo!", description: "Faça login com seu novo email e senha.", variant: "default" });
        setPrimeiroAcesso(false);
        setEmail(novoEmail.trim());
        setSenha("");
        return;
      }

      const session = await syncAuthSessionAfterLogin();
      if (!session?.id) {
        toast({ title: "Acesso salvo!", description: "Faça login com seu novo email e senha.", variant: "default" });
        setPrimeiroAcesso(false);
        setEmail(novoEmail.trim());
        setSenha("");
        return;
      }
      setLocation(getPostLoginPath(session));
    } catch {
      toast({ title: "Erro de conexão", description: "Não foi possível conectar ao servidor", variant: "destructive" });
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

      {/* Lado Direito */}
      <div className="w-full md:w-1/2 min-h-screen bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-500 flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

        <div className="w-full max-w-md relative z-10 space-y-6">
          <SessionExpiredAlert />

          <h1 className="text-4xl md:text-5xl text-black text-center drop-shadow-lg">
            <span className="font-bold">Impacto</span> <span className="italic">Social</span>
          </h1>

          <div className="backdrop-blur-xl bg-gray-400/30 rounded-3xl p-8 md:p-10 shadow-2xl border border-white/30 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-400/40 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-yellow-500/40 rounded-full blur-3xl"></div>

            {!primeiroAcesso ? (
              /* ===== TELA DE LOGIN NORMAL ===== */
              <div className="space-y-6 relative z-10">
                <div>
                  <label htmlFor="email-input" className="block text-sm font-medium text-white/90 mb-2">E-mail</label>
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

                <div>
                  <label htmlFor="senha-input" className="block text-sm font-medium text-white/90 mb-2">Senha</label>
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
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-white/80">Acesso para Coordenadores</p>
                </div>

                <Button
                  onClick={handleLogin}
                  className="w-full h-12 bg-green-600 hover:bg-yellow-500 text-white font-bold text-base rounded-xl shadow-lg transition-all"
                  data-testid="button-login-coordenador"
                  disabled={loading}
                >
                  {loading ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" />Entrando...</>) : "Entrar"}
                </Button>

                <div className="text-center pt-4">
                  <p className="text-xs text-white/70">Não tem conta? Entre em contato com Admin.</p>
                </div>
              </div>
            ) : (
              /* ===== TELA DE PRIMEIRO ACESSO ===== */
              <div className="space-y-5 relative z-10">
                <div className="text-center space-y-1">
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center">
                      <KeyRound className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-white">Primeiro Acesso</h2>
                  <p className="text-sm text-white/80">Defina seu email e senha permanentes para continuar</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Seu e-mail</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <Input
                      type="email"
                      placeholder="Digite seu e-mail"
                      value={novoEmail}
                      onChange={(e) => setNovoEmail(e.target.value)}
                      className="h-11 pl-10 bg-white border-0 text-gray-900 placeholder:text-gray-400 text-sm rounded-xl"
                      disabled={loading}
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Nova senha</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <Input
                      type={showNovaSenha ? "text" : "password"}
                      placeholder="Mín. 8 caracteres, 1 maiúscula, 1 número"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      className="h-11 pl-10 pr-10 bg-white border-0 text-gray-900 placeholder:text-gray-400 text-sm rounded-xl"
                      disabled={loading}
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowNovaSenha(!showNovaSenha)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showNovaSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Confirmar senha</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {confirmarSenha && confirmarSenha === novaSenha
                        ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                        : <Lock className="w-4 h-4" />}
                    </div>
                    <Input
                      type={showConfirmarSenha ? "text" : "password"}
                      placeholder="Repita a senha"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !loading && handleDefinirAcesso()}
                      className="h-11 pl-10 pr-10 bg-white border-0 text-gray-900 placeholder:text-gray-400 text-sm rounded-xl"
                      disabled={loading}
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirmarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleDefinirAcesso}
                  className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-bold text-base rounded-xl shadow-lg transition-all"
                  disabled={loading}
                >
                  {loading ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" />Salvando...</>) : "Confirmar e Entrar"}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setPrimeiroAcesso(false)}
                    className="text-xs text-white/60 hover:text-white/90 underline"
                  >
                    Voltar ao login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
