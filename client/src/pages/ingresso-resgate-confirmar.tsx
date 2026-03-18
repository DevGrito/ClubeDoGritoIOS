import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import bannerEvento from "../app-assets/SAVE THE DATE_Prancheta 1_1758723929625.png";
import logoClube from "../app-assets/LOGO_CLUBE-05_1752081350082.png";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PatrocinadoresCarousel from "@/components/PatrocinadoresCarousel";

export default function IngressoResgateConfirmar() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [cotaEmpresa, setCotaEmpresa] = useState<any>(null);
  const [showNomeModal, setShowNomeModal] = useState(false);
  const [nomeParticipante, setNomeParticipante] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const cotaData = localStorage.getItem('cotaEmpresa');
    if (cotaData) {
      const parsedCota = JSON.parse(cotaData);
      // Revalidar cota para obter dados atualizados
      fetch('/api/cotas/validar-empresa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeEmpresa: parsedCota.nomeEmpresa,
          email: parsedCota.email
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.valida && data.cota) {
          setCotaEmpresa(data.cota);
          // Atualizar localStorage com dados frescos
          localStorage.setItem('cotaEmpresa', JSON.stringify(data.cota));
        } else {
          setLocation('/ingresso/resgate/identificar');
        }
      })
      .catch(error => {
        console.error('Erro ao revalidar cota:', error);
        setCotaEmpresa(parsedCota); // Fallback para dados antigos
      });
    } else {
      setLocation('/ingresso/resgate/identificar');
    }
  }, [setLocation]);

  const handleRetirarAgora = () => {
    // Abrir modal para inserir nome antes de gerar ingresso
    setShowNomeModal(true);
  };

  const handleVerIngressos = () => {
    // Navegar para página que lista ingressos já gerados
    setLocation(`/ingresso/lista-cota/${cotaEmpresa.id}`);
  };

  const handleConfirmarResgate = async () => {
    if (!nomeParticipante.trim()) {
      toast({
        title: "Atenção",
        description: "Por favor, digite o nome de quem vai usar o ingresso.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/cotas/resgatar-ingresso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idCota: cotaEmpresa.id,
          nomeComprador: nomeParticipante.trim(),
          emailComprador: cotaEmpresa.email
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao resgatar ingresso');
      }

      const resultado = await response.json();

      // Atualizar dados da cota com valores atualizados retornados pela API
      if (resultado.cotaAtualizada) {
        const cotaAtualizada = {
          ...cotaEmpresa,
          quantidadeUsada: resultado.cotaAtualizada.quantidadeUsada,
          quantidadeTotal: resultado.cotaAtualizada.quantidadeTotal
        };
        setCotaEmpresa(cotaAtualizada);
        localStorage.setItem('cotaEmpresa', JSON.stringify(cotaAtualizada));
      }
      
      // Salvar ID da cota e NÚMERO do ingresso para navegação de volta
      localStorage.setItem('ultimoResgateCotaId', cotaEmpresa.id.toString());
      localStorage.setItem('ingressoResgatadoNumero', resultado.ingresso.numero);
      
      // Fechar modal PRIMEIRO
      setShowNomeModal(false);
      setNomeParticipante("");
      
      console.log('🎯 [RESGATE] Ingresso criado, redirecionando para:', `/ingresso/visualizar/${resultado.ingresso.numero}`);
      
      // Redirecionar IMEDIATAMENTE para a página do ingresso com QR code
      setLocation(`/ingresso/visualizar/${resultado.ingresso.numero}`);
      
    } catch (error) {
      console.error('❌ Erro ao resgatar ingresso:', error);
      toast({
        title: "Erro",
        description: "Não foi possível resgatar o ingresso. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const voltar = () => {
    localStorage.removeItem('cotaEmpresa');
    setLocation('/ingresso/resgate/identificar');
  };

  if (!cotaEmpresa) {
    return null;
  }

  const disponiveis = cotaEmpresa.quantidadeTotal - cotaEmpresa.quantidadeUsada;

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
        
        {/* Card de Confirmação */}
        <div className="bg-white border-4 border-gray-200 rounded-xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-black text-center mb-8" data-testid="nome-empresa">
            {cotaEmpresa.nomeEmpresa}
          </h2>
          
          {/* Informações da Cota */}
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-gray-700">Total de Convites:</span>
              <span className="text-2xl font-bold text-black" data-testid="total-convites">
                {cotaEmpresa.quantidadeTotal}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-gray-700">Já Retirados:</span>
              <span className="text-2xl font-bold text-orange-500" data-testid="ja-retirados">
                {cotaEmpresa.quantidadeUsada}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-700 font-semibold">Disponíveis:</span>
              <span className="text-2xl font-bold text-green-600" data-testid="disponiveis">
                {disponiveis}
              </span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-3">
            <button
              onClick={handleRetirarAgora}
              disabled={disponiveis <= 0 || isProcessing}
              className="w-full bg-yellow-500 text-black py-4 rounded-xl hover:bg-yellow-600 transition font-semibold text-lg disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg"
              data-testid="button-retirar-agora"
            >
              {isProcessing ? 'Processando...' : 'Gerar Novo Convite'}
            </button>
            
            <button
              onClick={handleVerIngressos}
              className="w-full bg-gray-900 text-white py-4 rounded-xl hover:bg-gray-800 transition font-semibold text-lg"
              data-testid="button-ver-ingressos"
            >
              Ver Convites Gerados
            </button>
            
            <button
              onClick={voltar}
              className="w-full bg-gray-200 text-gray-700 py-4 rounded-xl hover:bg-gray-300 transition font-semibold text-lg"
              data-testid="button-voltar"
            >
              Voltar
            </button>
          </div>

          {/* Mensagem de cota esgotada */}
          {disponiveis <= 0 && (
            <div className="mt-6 p-4 bg-red-50 border border-red-300 rounded-lg">
              <p className="text-red-700 text-sm text-center font-semibold">
                ⚠️ Esta cota está esgotada. Não há mais ingressos disponíveis.
              </p>
            </div>
          )}
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

      {/* Modal para Nome do Participante */}
      <Dialog open={showNomeModal} onOpenChange={setShowNomeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Insira o Nome no Convite</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Digite o nome completo da pessoa que irá utilizar este convite. Este nome aparecerá impresso no ingresso.
            </p>
            
            <div>
              <Label htmlFor="nomeParticipante">Nome Completo *</Label>
              <Input
                id="nomeParticipante"
                value={nomeParticipante}
                onChange={(e) => setNomeParticipante(e.target.value)}
                placeholder="Ex: Maria da Silva Santos"
                className="mt-2"
                data-testid="input-nome-participante"
                disabled={isProcessing}
                autoFocus
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNomeModal(false);
                  setNomeParticipante("");
                }}
                disabled={isProcessing}
                className="flex-1"
                data-testid="button-cancelar-modal"
              >
                Cancelar
              </Button>
              
              <Button
                onClick={handleConfirmarResgate}
                disabled={isProcessing || !nomeParticipante.trim()}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                data-testid="button-confirmar-resgate"
              >
                {isProcessing ? 'Gerando Convite...' : 'Gerar Convite'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
