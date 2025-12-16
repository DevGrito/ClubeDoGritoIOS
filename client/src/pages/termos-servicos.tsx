import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

export default function TermosServicos() {
  const [, setLocation] = useLocation();
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [showAcceptButton, setShowAcceptButton] = useState(false);
  
  // Verificar se veio da central de ajuda
  const urlParams = new URLSearchParams(window.location.search);
  const fromHelp = urlParams.get('from') === 'help';

  // Controlar indicador e botão baseado no scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 100;
      setShowScrollIndicator(!scrolled);

      // Mostrar botão quando chegar ao final do conteúdo (melhor detecção para mobile)
      const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop || window.pageYOffset;
      const clientHeight = document.documentElement.clientHeight || window.innerHeight;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px de margem para mobile
      setShowAcceptButton(isAtBottom);
    };

    window.addEventListener('scroll', handleScroll);
    
    // Verificar inicialmente se já está no final (para páginas pequenas)
    const checkInitialPosition = () => {
      handleScroll();
    };
    
    // Aguardar um pouco para o layout se estabilizar
    const timeoutId = setTimeout(checkInitialPosition, 500);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  const handleAccept = () => {
    // Marcar termos como aceitos no localStorage
    localStorage.setItem('termsAccepted', 'true');
    
    // Voltar para o fluxo de doação na etapa do nome (o sistema recupera o plano do localStorage)
    setLocation('/donation-flow?step=1');
  };

  const goBack = () => {
    // Usar histórico do navegador para voltar à tela anterior
    // Isso funcionará independentemente de onde o usuário veio
    window.history.back();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="min-h-screen bg-gray-50" 
      style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}
    >
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={goBack}
              className="mr-3 hover:bg-transparent"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider mb-2">EU CONCORDO</p>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Termos e Condições e a Política de Privacidade</h1>
              <p className="text-sm text-gray-500">Última atualização 11/09/2025</p>
            </div>
          </div>
        </div>
      </div>


      {/* Conteúdo */}
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        <div className="space-y-6">
          {/* TERMOS E CONDIÇÕES */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">TERMOS E CONDIÇÕES</h2>
          </div>

          {/* 1. Termos */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">1. Termos</h3>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              Ao acessar ao site Clube do Grito, concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis. Se você não concordar com algum desses termos, está proibido de usar ou acessar este site. Os materiais contidos neste site são protegidos pelas leis de direitos autorais e marcas comerciais aplicáveis.
            </p>
          </div>

          {/* 2. Uso de Licença */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">2. Uso de Licença</h3>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no site Clube do Grito, apenas para visualização transitória pessoal e não comercial. Esta é a concessão de uma licença, não uma transferência de título e, sob esta licença, você não pode:
            </p>
            <ul className="text-gray-700 text-sm leading-relaxed mb-4 pl-4 list-disc">
              <li>modificar ou copiar os materiais;</li>
              <li>usar os materiais para qualquer finalidade comercial ou para exibição pública (comercial ou não comercial);</li>
              <li>tentar descompilar ou fazer engenharia reversa de qualquer software contido no site Clube do Grito;</li>
              <li>remover quaisquer direitos autorais ou outras notações de propriedade dos materiais;</li>
              <li>transferir os materiais para outra pessoa ou 'espelhe' os materiais em qualquer outro servidor.</li>
            </ul>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              Esta licença será automaticamente rescindida se você violar alguma dessas restrições e poderá ser rescindida por Clube do Grito a qualquer momento. Ao encerrar a visualização desses materiais ou após o término desta licença, você deve apagar todos os materiais baixados em sua posse, seja em formato eletrônico ou impresso.
            </p>
          </div>

          {/* 3. Isenção de Responsabilidade */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">3. Isenção de Responsabilidade</h3>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              Os materiais no site da Clube do Grito são fornecidos 'como estão'. Clube do Grito não oferece garantias, expressas ou implícitas, e, por este meio, isenta e nega todas as outras garantias, incluindo, sem limitação, garantias implícitas ou condições de comercialização, adequação a um fim específico ou não violação de propriedade intelectual ou outra violação de direitos.
            </p>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              Além disso, o Clube do Grito não garante ou faz qualquer representação relativa à precisão, aos resultados prováveis ou à confiabilidade do uso dos materiais em seu site ou de outra forma relacionado a esses materiais ou em sites vinculados a este site.
            </p>
          </div>

          {/* Indicador de scroll */}
          {showScrollIndicator && (
            <div className="flex flex-col items-center py-4">
              <div className="bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center">
                <span>Role para baixo</span>
                <ChevronDown className="w-4 h-4 ml-2 animate-bounce" />
              </div>
            </div>
          )}

          {/* POLÍTICA DE PRIVACIDADE */}
          <div className="mb-8 mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">POLÍTICA DE PRIVACIDADE</h2>
          </div>

          {/* Privacidade */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Sua Privacidade</h3>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              A sua privacidade é importante para nós. É política do Clube do Grito respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no site Clube do Grito, e outros sites que possuímos e operamos.
            </p>
          </div>

          {/* Coleta de Informações */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Coleta de Informações</h3>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento. Também informamos por que estamos coletando e como será usado.
            </p>
          </div>

          {/* Uso das Informações */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Uso das Informações</h3>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.
            </p>
            
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei.
            </p>
          </div>

          {/* Sites Externos */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Sites Externos</h3>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              O nosso site pode ter links para sites externos que não são operados por nós. Esteja ciente de que não temos controle sobre o conteúdo e práticas desses sites e não podemos aceitar responsabilidade por suas respectivas políticas de privacidade.
            </p>
          </div>

          {/* Direitos do Usuário */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Direitos do Usuário</h3>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              Você é livre para recusar a nossa solicitação de informações pessoais, entendendo que talvez não possamos fornecer alguns dos serviços desejados.
            </p>
            
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              O uso continuado de nosso site será considerado como aceitação de nossas práticas em torno de privacidade e informações pessoais. Se você tiver alguma dúvida sobre como lidamos com dados do usuário e informações pessoais, entre em contato conosco.
            </p>
          </div>

          {/* Cookies e Publicidade */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Cookies e Publicidade</h3>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              O serviço Google AdSense que usamos para veicular publicidade usa um cookie DoubleClick para veicular anúncios mais relevantes em toda a Web e limitar o número de vezes que um determinado anúncio é exibido para você.
            </p>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              Para mais informações sobre o Google AdSense, consulte as FAQs oficiais sobre privacidade do Google AdSense.
            </p>
            <p className="text-gray-700 text-sm leading-relaxed">
              Utilizamos anúncios para compensar os custos de funcionamento deste site e fornecer financiamento para futuros desenvolvimentos. Os cookies de publicidade comportamental usados por este site foram desenvolvidos para garantir que você forneça os anúncios mais relevantes sempre que possível.
            </p>
          </div>
        </div>
      </div>

      {/* Fixed Accept Button - só aparece quando rolar até o final e NÃO veio da central de ajuda */}
      {!fromHelp && (
        <div className={`fixed bottom-4 left-0 right-0 p-4 z-30 transition-all duration-700 ease-in-out ${
          showAcceptButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}>
        <div className="max-w-md mx-auto flex justify-center">
          <Button
            onClick={handleAccept}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-8 rounded-full shadow-lg transform transition-transform duration-300 hover:scale-105"
            style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}
          >
            Aceite e Continue
          </Button>
        </div>
        </div>
      )}

      {/* Gradient fade effect to indicate more content */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 via-gray-50/80 to-transparent pointer-events-none z-10"></div>

      {/* Role para baixo indicator - fixed at bottom */}
      <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20 transition-opacity duration-500 ${showScrollIndicator ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-white border-2 border-black rounded-full px-6 py-2 shadow-lg">
          <span className="text-black font-medium text-sm">Role para baixo</span>
        </div>
      </div>
    </motion.div>
  );
}