import { useState } from "react";
import { X, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import logoPath from "../../app-assets/Logo_Clube_Do_grito.png";

const BRAND = "#f59e0b";

interface LoginModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  message?: string;
}

export default function LoginModal({ onClose, onSuccess, message }: LoginModalProps) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [erro, setErro] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; senha: string }) => {
      const r = await fetch("/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!r.ok) {
        const e = await r.json();
        throw new Error(e.error || "Erro ao fazer login");
      }
      return r.json();
    },
    onSuccess: (data) => {
      queryClient.removeQueries({ queryKey: ["/api/portal/meus-ingressos"] });
      queryClient.removeQueries({ queryKey: ["/api/portal/ingressos-pendentes"] });
      queryClient.setQueryData(["/api/portal/me"], data.usuario);
      onSuccess?.();
      onClose();
    },
    onError: (e: Error) => {
      setErro(e.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    if (!email || !senha) { setErro("Preencha todos os campos"); return; }
    loginMutation.mutate({ email, senha });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo + título */}
        <div className="flex flex-col items-center mb-5">
          <img src={logoPath} alt="Clube do Grito" className="h-16 w-16 rounded-full mb-3 object-contain" />
          <h2 className="text-xl font-bold text-gray-900">Que bom ter você aqui!</h2>
          {message && (
            <p className="text-sm text-gray-500 mt-1 text-center">{message}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
            />
          </div>

          {/* Senha */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showSenha ? "text" : "password"}
              placeholder="Senha"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowSenha(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {erro && (
            <p className="text-red-500 text-xs text-center">{erro}</p>
          )}

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
            style={{ backgroundColor: BRAND }}
          >
            {loginMutation.isPending ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {/* Cadastro */}
        <p className="text-center text-sm text-gray-500 mt-4">
          Não possui uma conta?{" "}
          <button
            onClick={() => { onClose(); navigate("/eventos/cadastro"); }}
            className="font-semibold hover:underline"
            style={{ color: BRAND }}
          >
            Cadastre-se
          </button>
        </p>
      </div>
    </div>
  );
}
