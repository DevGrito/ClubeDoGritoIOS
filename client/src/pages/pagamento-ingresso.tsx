import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function PagamentoIngresso() {
  const { toast } = useToast();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [etapa, setEtapa] = useState<'formulario-dados' | 'selecao-quantidade'>('formulario-dados');
  const [quantidade, setQuantidade] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome || !telefone || !email) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para continuar",
        variant: "destructive"
      });
      return;
    }
    
    setEtapa('selecao-quantidade');
  };

  const handlePagamento = async () => {
    if (isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);

      const response = await fetch('/api/ingresso/cielo-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome,
          telefone,
          email,
          quantidade
        })
      });

      const data = await response.json();

      if (data.success && data.checkoutLink) {
        window.open(data.checkoutLink, '_blank');
        toast({
          title: "Ingressos reservados!",
          description: `${quantidade} ingresso(s) criado(s). Complete o pagamento na Cielo.`,
        });
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao criar ingressos",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao criar ingressos:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar sua solicitação",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 3000);
    }
  };

  const voltarDados = () => {
    setEtapa('formulario-dados');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        {/* Etapa 1: Formulário de Dados */}
        {etapa === 'formulario-dados' && (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-center mb-6" data-testid="titulo-formulario-dados">
              Seus dados
            </h2>

            <form onSubmit={handleFormSubmit} className="space-y-5">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Digite seu nome"
                  data-testid="input-nome"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="seu@email.com"
                  data-testid="input-email"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefone (WhatsApp)</label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="(31) 99999-9999"
                  data-testid="input-telefone"
                />
              </div>

              {/* Botão Continuar */}
              <button
                type="submit"
                className="w-full bg-yellow-500 text-black py-3 rounded-xl hover:bg-yellow-600 transition font-semibold mt-6"
                data-testid="button-continuar"
              >
                Continuar
              </button>
            </form>
          </div>
        )}

        {/* Etapa 2: Seleção de Quantidade - Cielo Checkout Link */}
        {etapa === 'selecao-quantidade' && (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-center mb-8" data-testid="titulo-cielo-checkout">
              Escolha a forma de pagamento
            </h2>
            
            {/* Box principal com borda cyan */}
            <div className="border-2 border-cyan-400 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-center mb-6">
                Pagar com Cartão ou PIX
              </h3>
              
              <p className="text-center text-gray-700 mb-6 font-medium">
                Quantos ingressos você quer comprar?
              </p>
              
              {/* Seletor de Quantidade - Grid de botões */}
              <div className="grid grid-cols-5 gap-3 mb-3">
                {[1, 2, 3, 4, 5].map((qtd) => (
                  <button
                    key={qtd}
                    type="button"
                    onClick={() => setQuantidade(qtd)}
                    className={`h-14 rounded-lg font-semibold transition ${
                      quantidade === qtd
                        ? 'bg-cyan-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    data-testid={`button-qty-${qtd}`}
                  >
                    {qtd}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-5 gap-3 mb-8">
                {[6, 7, 8, 9, 10].map((qtd) => (
                  <button
                    key={qtd}
                    type="button"
                    onClick={() => setQuantidade(qtd)}
                    className={`h-14 rounded-lg font-semibold transition ${
                      quantidade === qtd
                        ? 'bg-cyan-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    data-testid={`button-qty-${qtd}`}
                  >
                    {qtd}
                  </button>
                ))}
              </div>
              
              {/* Resumo do valor */}
              <div className="mb-8 bg-gray-50 p-4 rounded-lg">
                <p className="text-center text-gray-600 text-sm mb-2">
                  {quantidade} ingresso{quantidade > 1 ? 's' : ''} × R$ 1.000,00
                </p>
                <p className="text-center text-3xl font-bold text-cyan-600">
                  Total: R$ {(quantidade * 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              
              {/* Botão de Pagamento */}
              <button
                onClick={handlePagamento}
                disabled={isProcessing}
                className="w-full bg-cyan-500 text-white py-4 rounded-xl hover:bg-cyan-600 transition font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md"
                data-testid="button-pagar-cielo-link"
              >
                {isProcessing ? 'Criando ingressos...' : 'Pagar com Cartão ou PIX'}
              </button>
              
              <p className="text-center text-xs text-gray-500 mt-4">
                Abre checkout Cielo em nova janela
              </p>
            </div>
            
            {/* Botão Voltar */}
            <button
              onClick={voltarDados}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 transition mt-4"
              data-testid="button-voltar-cielo"
            >
              Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
