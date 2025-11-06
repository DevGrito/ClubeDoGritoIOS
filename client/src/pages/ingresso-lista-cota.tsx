import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Ticket, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IngressoCota {
  id: number;
  numero: string;
  nomeComprador: string | null;
  emailComprador: string;
  dataCompra: string;
  eventoData?: string;
  eventoHora?: string;
}

export default function IngressoListaCotaPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/ingresso/lista-cota/:idCota");
  const idCota = params?.idCota;

  const { data: ingressos, isLoading } = useQuery<IngressoCota[]>({
    queryKey: [`/api/cotas/${idCota}/ingressos`],
    enabled: !!idCota,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-yellow-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando ingressos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-500 text-white p-6">
        <button
          onClick={() => setLocation("/ingresso/resgate/confirmar")}
          className="mb-4 flex items-center gap-2 hover:opacity-80 transition-opacity"
          data-testid="button-voltar"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>
        
        <h1 className="text-3xl font-bold mb-2">Ingressos Gerados</h1>
        <p className="text-sm opacity-90">
          Lista de todos os ingressos já criados para esta empresa
        </p>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto">
        {!ingressos || ingressos.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center shadow">
            <Ticket className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2">Nenhum ingresso gerado ainda</h3>
            <p className="text-gray-600 mb-6">
              Clique em "Colocar Nome no Convite" para gerar o primeiro ingresso.
            </p>
            <Button
              onClick={() => setLocation("/ingresso/resgate/confirmar")}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              Gerar Ingresso
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {ingressos.map((ingresso) => (
              <div
                key={ingresso.id}
                className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setLocation(`/ingresso/visualizar/${ingresso.numero}`)}
                data-testid={`ingresso-${ingresso.id}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-yellow-100 p-3 rounded-lg">
                      <Ticket className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ingresso</p>
                      <p className="text-2xl font-bold text-gray-900">#{ingresso.numero}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nome:</span>
                    <span className="font-semibold text-gray-900">
                      {ingresso.nomeComprador || 'Sem nome definido'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">E-mail:</span>
                    <span className="text-gray-900">{ingresso.emailComprador}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gerado em:</span>
                    <span className="text-gray-900">
                      {new Date(ingresso.dataCompra).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t space-y-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/ingresso/visualizar/${ingresso.numero}`);
                    }}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                    data-testid={`button-visualizar-${ingresso.id}`}
                  >
                    Visualizar Ingresso
                  </Button>
                  
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`/ingresso/visualizar/${ingresso.numero}?download=true`, '_blank');
                    }}
                    variant="outline"
                    className="w-full"
                    data-testid={`button-baixar-${ingresso.id}`}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Ingresso
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mensagem de Segurança LGPD */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-gray-700 text-xs text-center leading-relaxed">
            🔒 <span className="font-semibold">Ambiente 100% Seguro.</span> Seus dados pessoais e de pagamento estão protegidos. Seguimos rigorosamente todos os protocolos de segurança e as diretrizes da Lei Geral de Proteção de Dados (LGPD). Nenhuma informação do seu cartão é armazenada em nossos servidores.
          </p>
        </div>
      </div>
    </div>
  );
}
