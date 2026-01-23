import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Download, Mail, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import IngressoDigital from "@/components/IngressoDigital";
import PatrocinadoresCarousel from "@/components/PatrocinadoresCarousel";

interface Ingresso {
  id: number;
  numero: string;
  nomeComprador: string;
  emailComprador: string;
  telefoneComprador: string;
  valorPago: number;
  status: string;
  dataCompra: string;
  stripeCheckoutSessionId: string;
}

export default function IngressoSucesso() {
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("session_id");
    setSessionId(id);
  }, []);

  // Buscar ingresso por session_id
  const { data: ingresso, isLoading, error } = useQuery<Ingresso>({
    queryKey: ["ingresso", sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error("Session ID não encontrado");
      
      const response = await fetch(`/api/ingresso/session/${sessionId}`);
      if (!response.ok) {
        throw new Error("Erro ao carregar ingresso");
      }
      return response.json();
    },
    enabled: !!sessionId,
  });

  const handleDownload = () => {
    // TODO: Implementar download do PDF
    toast({
      title: "Download",
      description: "Funcionalidade de download será implementada em breve.",
    });
  };

  const handleShare = () => {
    // TODO: Implementar compartilhamento
    toast({
      title: "Compartilhar",
      description: "Funcionalidade de compartilhamento será implementada em breve.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando seu ingresso...</p>
        </div>
      </div>
    );
  }

  if (error || !ingresso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erro ao carregar ingresso</h2>
          <p className="text-gray-600 mb-4">Não foi possível encontrar seu ingresso.</p>
          <Button onClick={() => window.location.href = "/pagamento/ingresso"}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-yellow-50 p-4">
      <div className="container mx-auto max-w-2xl py-8">
        {/* Header de Sucesso */}
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pagamento Confirmado!
          </h1>
          <p className="text-lg text-gray-600">
            Seu ingresso foi gerado com sucesso
          </p>
        </div>

        {/* Carrossel/Card do Ingresso */}
        <div className="mb-8">
          <IngressoDigital
            numero={ingresso.numero}
            nomeComprador={ingresso.nomeComprador}
            emailComprador={ingresso.emailComprador}
            telefoneComprador={ingresso.telefoneComprador}
            showQrCode={true}
          />
        </div>

        {/* Informações de confirmação */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="h-5 w-5 text-blue-500" />
              <div>
                <h3 className="font-medium text-gray-900">Confirmação por Email</h3>
                <p className="text-sm text-gray-600">
                  Uma cópia do seu ingresso foi enviada para {ingresso.emailComprador}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Número do Ingresso</p>
                <p className="font-semibold">#{ingresso.numero}</p>
              </div>
              <div>
                <p className="text-gray-600">Valor Pago</p>
                <p className="font-semibold">R$ {(ingresso.valorPago / 100).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">Data da Compra</p>
                <p className="font-semibold">
                  {new Date(ingresso.dataCompra).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <Badge className="bg-green-100 text-green-800">
                  {ingresso.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleDownload}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            data-testid="button-download-ingresso"
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar PDF
          </Button>
          
          <Button
            onClick={handleShare}
            variant="outline"
            className="flex-1"
            data-testid="button-share-ingresso"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Compartilhar
          </Button>
        </div>

        {/* Informações importante */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">Informações Importantes</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Guarde este ingresso com você durante todo o evento</li>
            <li>• O QR Code será necessário para entrada no local</li>
            <li>• Em caso de dúvidas, entre em contato conosco</li>
            <li>• Local do evento será divulgado em breve</li>
          </ul>
        </div>

        {/* Carrossel de Patrocinadores */}
        <PatrocinadoresCarousel className="mt-6" />

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