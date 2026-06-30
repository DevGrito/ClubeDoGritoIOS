import { useLocation } from "wouter";
import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PagamentoReprovadoPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50 p-6">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="bg-red-100 rounded-full p-4">
            <XCircle className="w-16 h-16 text-red-600" data-testid="icon-erro" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-3" data-testid="titulo-reprovado">
          Ops! Pagamento não concluído
        </h1>
        
        <p className="text-lg text-gray-600 mb-8" data-testid="mensagem-reprovado">
          Não conseguimos aprovar seu pagamento. Por favor, tente novamente.
        </p>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => setLocation("/eventos")}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3"
            data-testid="button-tentar-novamente"
          >
            Tentar novamente
          </Button>

          <Button
            variant="outline"
            onClick={() => setLocation("/tdoador")}
            className="border-gray-300 text-gray-700 px-8 py-3"
            data-testid="button-voltar-inicio"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao início
          </Button>
        </div>

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
