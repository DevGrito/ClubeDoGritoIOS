import { useState } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { QrCode, Lock, User, ArrowLeft } from "lucide-react";
import { syncAuthSessionAfterLogin } from "@/lib/auth-session";

export default function ScannerLogin() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !senha.trim()) {
      setErro("Preencha usuário e senha.");
      return;
    }
    setLoading(true);
    setErro("");
    try {
      const r = await fetch("/api/scanner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: username.trim(), senha }),
      });
      const d = await r.json();
      if (!r.ok) {
        setErro(d.error || "Usuário ou senha incorretos.");
        return;
      }
      const session = await syncAuthSessionAfterLogin();
      if (!session || session.actorType !== "scanner") {
        setErro("Sessão não foi criada. Tente novamente.");
        return;
      }
      sessionStorage.setItem("scanner_user", d.usuario.username);
      setLocation("/scanner");
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1.5 bg-green-500" />
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mb-4">
              <QrCode className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Scanner de Ingressos</h1>
            <p className="text-gray-400 text-sm mt-1">Acesse com suas credenciais</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5">Usuário</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="nome de usuário"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500/20"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500/20"
                />
              </div>
            </div>

            {erro && (
              <div className="bg-red-500/10 border border-red-500/40 rounded-lg px-3 py-2.5 text-red-400 text-sm text-center">
                {erro}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold transition-colors"
            >
              {loading ? "Verificando..." : "Acessar Scanner"}
            </button>

            <button
              onClick={() => setLocation("/")}
              className="w-full py-2.5 rounded-xl border border-gray-600 text-gray-400 hover:bg-gray-700 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
