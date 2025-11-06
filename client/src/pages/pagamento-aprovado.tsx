import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PagamentoAprovadoPage() {
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session = params.get("session_id");
    setSessionId(session);
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const confirmarPagamento = async () => {
      try {
        if (sessionId) {
          console.log("💳 Confirmando pagamento...", sessionId);
          await fetch("/api/pagamentos/confirmar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ sessionId }),
          });
        }
      } catch (error) {
        console.error("Erro ao confirmar pagamento:", error);
      } finally {
        // Redirecionar para /ingresso após 2 segundos
        timeoutId = setTimeout(() => {
          setLocation("/ingresso");
        }, 2000);
      }
    };

    if (sessionId) {
      confirmarPagamento();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [sessionId, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="bg-green-100 rounded-full p-4">
            <CheckCircle className="w-16 h-16 text-green-600" data-testid="icon-sucesso" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-3" data-testid="titulo-aprovado">
          Pagamento aprovado 🎉
        </h1>
        
        <p className="text-lg text-gray-600 mb-6" data-testid="mensagem-aprovado">
          Seu ingresso foi liberado! Redirecionando...
        </p>

        <div className="mb-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        </div>

        <Button
          onClick={() => setLocation("/ingresso")}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
          data-testid="button-ver-ingresso"
        >
          Ver meu ingresso agora
        </Button>

        {/* Mensagem de Segurança LGPD */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-4 max-w-md mx-auto">
          <p className="text-gray-700 text-xs text-center leading-relaxed">
            🔒 <span className="font-semibold">Ambiente 100% Seguro.</span> Seus dados pessoais e de pagamento estão protegidos. Seguimos rigorosamente todos os protocolos de segurança e as diretrizes da Lei Geral de Proteção de Dados (LGPD). Nenhuma informação do seu cartão é armazenada em nossos servidores.
          </p>
        </div>
      </div>
    </div>
  );
}
