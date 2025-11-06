import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, AlertCircle, Ticket, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoClube from "@assets/LOGO_CLUBE-05_1752081350082.png";
import PatrocinadoresCarousel from "@/components/PatrocinadoresCarousel";

export default function IngressoAvulsoResgatar() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [contato, setContato] = useState("");
  const [loading, setLoading] = useState(false);
  const [ingressos, setIngressos] = useState<any[]>([]);
  const [encontrado, setEncontrado] = useState(false);

  const handleBuscarIngressos = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contato.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Digite seu telefone para buscar seus ingressos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/ingressos/buscar-por-contato", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ contato: contato.trim() })
      });
      
      if (!response.ok) {
        throw new Error("Erro ao buscar ingressos");
      }

      const data = await response.json();
      
      if (!data.encontrado || data.quantidade === 0) {
        toast({
          title: "Nenhum ingresso encontrado",
          description: "Não encontramos ingressos com este telefone.",
          variant: "destructive",
        });
        setEncontrado(false);
        setIngressos([]);
      } else {
        setEncontrado(true);
        setIngressos(data.ingressos);
        toast({
          title: "Ingressos encontrados!",
          description: `Encontramos ${data.quantidade} ingresso(s) cadastrado(s).`,
        });
      }

    } catch (error: any) {
      toast({
        title: "Erro ao buscar ingressos",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
      setEncontrado(false);
      setIngressos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerIngresso = (numero: string) => {
    // Marcar que veio da página de resgate avulso
    sessionStorage.setItem('veioDeResgateAvulso', 'true');
    setLocation(`/ingresso/visualizar/${numero}`);
  };

  const voltarBusca = () => {
    setEncontrado(false);
    setIngressos([]);
    setContato("");
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="container mx-auto max-w-md px-4 py-8">
        
        {/* Header com Logo */}
        <div className="text-center mb-6">
          <img 
            src={logoClube} 
            alt="Clube do Grito" 
            className="h-32 mx-auto mb-4"
            data-testid="logo-clube"
          />
        </div>

        {/* Botão Voltar */}
        <button
          onClick={() => encontrado ? voltarBusca() : setLocation('/pagamento/ingresso')}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-6 transition"
          data-testid="button-voltar"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Voltar</span>
        </button>

        {/* Card de Busca - mostrar apenas se não encontrou ingressos */}
        {!encontrado && (
          <div className="bg-white border-4 border-gray-200 rounded-xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-black text-center mb-2">
              Meus Ingressos
            </h2>
            <p className="text-gray-600 text-center text-sm mb-6">
              Digite o telefone usado na compra
            </p>
            
            <form onSubmit={handleBuscarIngressos} className="space-y-4">
              <div>
                <label htmlFor="contato" className="text-gray-700 font-semibold mb-2 block">
                  Telefone *
                </label>
                <Input
                  id="contato"
                  type="text"
                  placeholder="Ex: 31999999999"
                  value={contato}
                  onChange={(e) => setContato(e.target.value)}
                  required
                  className="w-full h-14 text-lg"
                  data-testid="input-contato"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold text-lg py-6 disabled:bg-gray-300"
                data-testid="button-buscar-ingressos"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2" />
                    Buscando...
                  </>
                ) : (
                  "Buscar Meus Ingressos"
                )}
              </Button>
            </form>

            {/* Alerta informativo */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 mt-6">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-blue-800 text-sm">
                Digite o mesmo telefone usado no momento da compra.
              </p>
            </div>

            {/* Link para cotas empresariais */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-gray-600 text-sm text-center">
                Sua empresa tem cota de ingressos?{" "}
                <button
                  onClick={() => setLocation("/ingresso/resgate/identificar")}
                  className="text-yellow-600 hover:text-yellow-700 font-semibold underline transition-colors"
                  data-testid="link-resgate-cota"
                >
                  Clique aqui
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Card de Resultados - mostrar quando encontrar ingressos */}
        {encontrado && ingressos.length > 0 && (
          <div className="bg-white border-4 border-green-200 rounded-xl p-8 shadow-lg">
            <div className="text-center mb-6">
              <h3 className="text-3xl font-bold text-green-600 mb-2">
                {ingressos.length}
              </h3>
              <p className="text-gray-700">
                {ingressos.length === 1 ? 'Ingresso Encontrado' : 'Ingressos Encontrados'}
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {ingressos.map((ingresso, index) => (
                <div
                  key={ingresso.id}
                  className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4"
                  data-testid={`ingresso-card-${index}`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-black">
                          Ingresso #{ingresso.numero}
                        </p>
                        <p className="text-sm text-gray-600">
                          {ingresso.nomeComprador}
                        </p>
                        <p className="text-xs text-gray-500">
                          Comprado em {new Date(ingresso.dataCompra).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleVerIngresso(ingresso.numero)}
                        className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black"
                        data-testid={`button-ver-ingresso-${index}`}
                      >
                        <Ticket className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                      <Button
                        onClick={() => setLocation(`/ingresso/visualizar/${ingresso.numero}?download=true`)}
                        variant="outline"
                        className="flex-1"
                        data-testid={`button-baixar-ingresso-${index}`}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={voltarBusca}
              variant="outline"
              className="w-full"
              data-testid="button-nova-busca"
            >
              Fazer Nova Busca
            </Button>
          </div>
        )}

        {/* Carrossel de Patrocinadores */}
        <PatrocinadoresCarousel />

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
