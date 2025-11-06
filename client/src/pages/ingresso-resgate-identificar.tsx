import { useState } from "react";
import { useLocation } from "wouter";
import logoClube from "@assets/LOGO_CLUBE-05_1752081350082.png";
import PatrocinadoresCarousel from "@/components/PatrocinadoresCarousel";

export default function IngressoResgateIdentificar() {
  const [, setLocation] = useLocation();
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [erro, setErro] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nomeEmpresa.trim()) {
      setErro("Por favor, digite o nome da empresa");
      return;
    }

    setIsValidating(true);
    setErro("");

    try {
      const response = await fetch('/api/cotas/validar-empresa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nomeEmpresa: nomeEmpresa.trim() }),
      });

      const resultado = await response.json();

      if (resultado.valida && resultado.cota) {
        // Empresa validada! Redirecionar para página de resgate com dados da cota
        // Armazenar dados da cota no localStorage para usar na próxima página
        localStorage.setItem('cotaEmpresa', JSON.stringify(resultado.cota));
        setLocation('/ingresso/resgate/confirmar');
      } else {
        setErro(resultado.mensagem || "Empresa não encontrada");
      }
      
    } catch (error) {
      console.error('❌ Erro ao validar empresa:', error);
      setErro("Erro ao validar empresa. Tente novamente.");
    } finally {
      setIsValidating(false);
    }
  };

  const voltar = () => {
    setLocation('/ingresso/pagamento');
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
        
        {/* Card de Identificação da Empresa */}
        <div className="bg-black border-t-4 border-[#FFCC00] rounded-xl p-8 text-white">
          {/* Botão Voltar */}
          <button
            onClick={voltar}
            className="mb-6 text-yellow-500 hover:text-yellow-400 flex items-center gap-2 text-sm"
            data-testid="button-voltar"
          >
            ← Voltar
          </button>

          <h2 className="text-2xl font-bold text-white text-center mb-4" data-testid="titulo-identificacao">
            Resgate de Cota Empresarial
          </h2>
          
          <p className="text-white text-center mb-6 text-sm">
            Digite o nome da sua empresa para validar a cota.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Nome da Empresa */}
            <div>
              <label htmlFor="nomeEmpresa" className="block text-white font-semibold mb-2">
                Qual sua empresa? *
              </label>
              <input
                type="text"
                id="nomeEmpresa"
                value={nomeEmpresa}
                onChange={(e) => setNomeEmpresa(e.target.value)}
                placeholder="Digite o nome completo da empresa"
                className="w-full px-4 py-3 rounded-xl text-black"
                data-testid="input-nome-empresa"
                disabled={isValidating}
              />
            </div>

            {/* Mensagem de Erro */}
            {erro && (
              <div className="p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg" data-testid="mensagem-erro">
                <p className="text-red-200 text-sm text-center">
                  ⚠️ {erro}
                </p>
              </div>
            )}

            {/* Botão Validar */}
            <button
              type="submit"
              disabled={isValidating || !nomeEmpresa.trim()}
              className="w-full bg-yellow-500 text-black py-4 rounded-xl hover:bg-yellow-600 transition font-semibold text-lg disabled:bg-gray-300"
              data-testid="button-validar-empresa"
            >
              {isValidating ? 'Validando...' : 'Validar Empresa'}
            </button>
          </form>

          {/* Informações Adicionais */}
          <div className="mt-8 p-4 bg-yellow-500 bg-opacity-10 rounded-lg border border-yellow-500">
            <p className="text-sm text-yellow-200 text-center">
              💡 O nome da empresa deve ser exatamente como foi cadastrado no sistema de cotas. Em caso de dúvidas, entre em contato com o responsável pela cota na sua empresa.
            </p>
          </div>
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
