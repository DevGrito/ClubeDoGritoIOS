import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type PaymentStatus = "loading" | "success" | "error";

export default function PagamentoAprovadoPage() {
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<PaymentStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session = params.get("session_id");
    setSessionId(session);
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const confirmarPagamento = async () => {
      try {
        if (!sessionId) {
          setStatus("error");
          setErrorMessage("Sessão de pagamento não encontrada");
          return;
        }

        console.log("💳 Confirmando pagamento...", sessionId);
        const response = await fetch("/api/pagamentos/confirmar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          console.log("✅ Pagamento confirmado com sucesso!");
          setStatus("success");
          timeoutId = setTimeout(() => {
            setLocation("/ingresso");
          }, 2000);
        } else {
          console.error("❌ Pagamento não foi confirmado:", data);
          setStatus("error");
          setErrorMessage(data.error || data.message || "Não foi possível confirmar o pagamento");
        }
      } catch (error: any) {
        console.error("❌ Erro ao confirmar pagamento:", error);
        setStatus("error");
        setErrorMessage(error.message || "Erro de conexão ao verificar pagamento");
      }
    };

    if (sessionId) {
      confirmarPagamento();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [sessionId, setLocation]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-amber-50 p-6">
        <div className="text-center max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="bg-yellow-100 rounded-full p-4">
              <Loader2 className="w-16 h-16 text-yellow-600 animate-spin" data-testid="icon-loading" />
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-gray-900 mb-3" data-testid="titulo-verificando">
            Verificando pagamento...
          </h1>
          
          <p className="text-lg text-gray-600 mb-6" data-testid="mensagem-verificando">
            Aguarde enquanto confirmamos seu pagamento
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50 p-6">
        <div className="text-center max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="bg-red-100 rounded-full p-4">
              <XCircle className="w-16 h-16 text-red-600" data-testid="icon-erro" />
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-gray-900 mb-3" data-testid="titulo-erro">
            Pagamento não confirmado
          </h1>
          
          <p className="text-lg text-gray-600 mb-6" data-testid="mensagem-erro">
            {errorMessage || "Houve um problema ao processar seu pagamento. Por favor, tente novamente."}
          </p>

          <div className="space-y-3">
            <Button
              onClick={() => setLocation("/eventos")}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 w-full"
              data-testid="button-tentar-novamente"
            >
              Tentar novamente
            </Button>
            
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="px-8 py-3 w-full"
              data-testid="button-voltar-inicio"
            >
              Voltar ao início
            </Button>
          </div>

          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-gray-700 text-xs text-center leading-relaxed">
              Se você foi cobrado mas está vendo este erro, entre em contato conosco pelo WhatsApp para regularizarmos sua situação.
            </p>
          </div>
        </div>
      </div>
    );
  }

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

        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-4 max-w-md mx-auto">
          <p className="text-gray-700 text-xs text-center leading-relaxed">
            🔒 <span className="font-semibold">Ambiente 100% Seguro.</span> Seus dados pessoais e de pagamento estão protegidos. Seguimos rigorosamente todos os protocolos de segurança e as diretrizes da Lei Geral de Proteção de Dados (LGPD). Nenhuma informação do seu cartão é armazenada em nossos servidores.
          </p>
        </div>
      </div>
    </div>
  );
}
