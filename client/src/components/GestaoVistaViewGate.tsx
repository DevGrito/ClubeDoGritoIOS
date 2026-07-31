import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Lock, Loader2 } from "lucide-react";

type UnlockStatus = {
  unlocked: boolean;
  expiresAt: number | null;
  configured: boolean;
};

interface Props {
  children: ReactNode;
}

export default function GestaoVistaViewGate({ children }: Props) {
  const [status, setStatus] = useState<UnlockStatus | null>(null);
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gestao-vista/unlock/status", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Não foi possível verificar o acesso.");
      const data = (await res.json()) as UnlockStatus;
      setStatus(data);
      setError(null);
    } catch {
      setError("Erro ao verificar acesso. Tente recarregar a página.");
      setStatus({ unlocked: false, expiresAt: null, configured: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void checkStatus();
  }, []);

  const handleUnlock = async () => {
    if (!senha.trim()) {
      setError("Digite a senha de visualização.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/gestao-vista/unlock", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha: senha.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Senha incorreta.");
        return;
      }

      setSenha("");
      await checkStatus();
    } catch {
      setError("Erro ao validar senha. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
      </div>
    );
  }

  if (status?.unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900">
      <div
        className="absolute inset-0 blur-xl scale-105 opacity-40 pointer-events-none select-none"
        aria-hidden
      >
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
          <div className="h-24 rounded-xl bg-slate-800/80 mb-4" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-slate-800/60" />
            ))}
          </div>
          <div className="h-64 rounded-xl bg-slate-800/60" />
        </div>
      </div>

      <div className="absolute inset-0 bg-slate-950/70" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-900/90 backdrop-blur-md p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-yellow-500/15">
              <Lock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Gestão à Vista</h2>
              <p className="text-sm text-slate-400">Área restrita para visualização</p>
            </div>
          </div>

          <p className="text-sm text-slate-400 mb-5">
            Digite a senha de visualização para acessar o dashboard de metas e indicadores.
            O acesso permanece liberado por 24 horas neste navegador.
          </p>

          {!status?.configured && (
            <p className="text-sm text-amber-400/90 mb-4 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
              Senha de visualização ainda não configurada no servidor.
            </p>
          )}

          <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="gv-view-password">
            Senha de visualização
          </label>
          <div className="relative mb-4">
            <Input
              id="gv-view-password"
              type={showPassword ? "text" : "password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleUnlock()}
              placeholder="Digite a senha"
              className="bg-slate-800 border-slate-600 text-white pr-10"
              autoComplete="current-password"
              disabled={submitting || !status?.configured}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-400 mb-4">{error}</p>
          )}

          <Button
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold"
            onClick={() => void handleUnlock()}
            disabled={submitting || !status?.configured}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validando...
              </>
            ) : (
              "Acessar dashboard"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
