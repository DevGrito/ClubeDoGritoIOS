import { useEffect, useState, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PatrocinadoresCarousel from "@/components/PatrocinadoresCarousel";

// Importar imagens usando @assets do Vite
import logoEventoImg from "@assets/logo-evento.png";

interface TicketData {
  id: number;
  numero: string;
  data?: string;
  hora?: string;
  eventoData?: string;
  eventoHora?: string;
  eventoLocal?: string;
  nomeComprador: string | null;
  emailComprador: string;
  telefoneComprador?: string;
  imagemUrl?: string;
  valorPago: number;
  status: string;
  dataCompra: string;
  idCotaEmpresa?: number | null;
  stripeCheckoutSessionId?: string | null;
}

interface IngressoResponse {
  hasTicket: boolean;
  ticket: TicketData | null;
  error?: string;
}
interface TicketsListResponse {
  hasTicket: boolean;
  count?: number;
  tickets: TicketData[];
  ticket?: TicketData | null; // compat do backend
}


export default function IngressoPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/ingresso/visualizar/:id");
  const [userId, setUserId] = useState<string | null>(null);
  const [ingressoResgatadoNumero, setIngressoResgatadoNumero] = useState<string | null>(null);
  const [isFluxoCota, setIsFluxoCota] = useState(false);
  const ingressoNumero = params?.id;
  const printRef = useRef<HTMLDivElement>(null);

  // Detectar parâmetro de download
  const urlParams = new URLSearchParams(window.location.search);
  const shouldDownload = urlParams.get('download') === 'true';

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const resgatadoNumero = localStorage.getItem("ingressoResgatadoNumero");
    const cotaId = localStorage.getItem("ultimoResgateCotaId");
    console.log('🔧 [FRONTEND] useEffect inicial:', { storedUserId, resgatadoNumero, cotaId, paramsId: params?.id });
    setUserId(storedUserId);
    setIngressoResgatadoNumero(resgatadoNumero);
    setIsFluxoCota(!!cotaId);
    
    // Se tiver ingresso resgatado e não tiver número na URL, redirecionar
    if (resgatadoNumero && !params?.id) {
      console.log('↪️ [FRONTEND] Redirecionando para /ingresso/visualizar/' + resgatadoNumero);
      setLocation(`/ingresso/visualizar/${resgatadoNumero}`);
    }
  }, [params, setLocation]);

  const handleVoltar = (ticketData?: TicketData | null) => {
    const cotaId = localStorage.getItem("ultimoResgateCotaId");
    const veioDeResgateAvulso = sessionStorage.getItem('veioDeResgateAvulso');
    
    // Se veio com parâmetro de download, sempre voltar para resgate avulso
    if (shouldDownload) {
      setLocation("/ingresso/avulso/resgatar");
      return;
    }
    
    // Detectar se é ingresso de cota empresarial (tem idCotaEmpresa)
    if (ticketData && ticketData.idCotaEmpresa) {
      // Ingresso de empresa - voltar para página de resgate empresarial
      console.log('🔙 [VOLTAR] Ingresso de empresa detectado, voltando para /ingresso/resgate/identificar');
      localStorage.removeItem("ultimoResgateCotaId");
      setLocation("/ingresso/resgate/identificar");
    } 
    // Se ainda não tem ticketData mas tem marcadores de cota
    else if (isFluxoCota || cotaId) {
      console.log('🔙 [VOLTAR] Fluxo de cota detectado, voltando para /ingresso/resgate/identificar');
      localStorage.removeItem("ultimoResgateCotaId");
      setLocation("/ingresso/resgate/identificar");
    }
    // Verificar se veio da página de resgate avulso (prioridade)
    else if (veioDeResgateAvulso === 'true') {
      // Limpar marcador e voltar para página de resgate avulso
      console.log('🔙 [VOLTAR] Veio de resgate avulso, voltando para /ingresso/avulso/resgatar');
      sessionStorage.removeItem('veioDeResgateAvulso');
      setLocation("/ingresso/avulso/resgatar");
    }
    // Detectar se é ingresso avulso (tem pagamento Stripe e não tem cota)
    else if (ticketData && ticketData.stripeCheckoutSessionId && !ticketData.idCotaEmpresa) {
      // Ingresso avulso (comprado com PIX/Cartão) - voltar para resgate avulso
      console.log('🔙 [VOLTAR] Ingresso avulso com Stripe, voltando para /ingresso/avulso/resgatar');
      setLocation("/ingresso/avulso/resgatar");
    } 
    else {
      // Fluxo padrão - voltar para página de resgate avulso
      console.log('🔙 [VOLTAR] Fluxo padrão, voltando para /ingresso/avulso/resgatar');
      setLocation("/ingresso/avulso/resgatar");
    }
  };

  // Se tiver NÚMERO na URL, buscar ingresso específico
  const { data: ingressoEspecifico, isLoading: isLoadingEspecifico, error: errorEspecifico } = useQuery<TicketData>({
    queryKey: ["/api/ingressos", ingressoNumero],
    queryFn: async () => {
      console.log('🔍 [FRONTEND] Buscando ingresso por NÚMERO:', ingressoNumero);
      const response = await fetch(`/api/ingressos/${ingressoNumero}`);
      console.log('📡 [FRONTEND] Resposta da API:', response.status, response.ok);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [FRONTEND] Erro ao buscar ingresso:', errorText);
        // Limpar localStorage se o ingresso não existe mais
        localStorage.removeItem("ingressoResgatadoNumero");
        throw new Error('Ingresso não encontrado');
      }
      const data = await response.json();
      console.log('✅ [FRONTEND] Ingresso encontrado:', data);
      return data;
    },
    enabled: !!ingressoNumero,
    retry: false, // Não tentar novamente se não encontrar
  });
  // Quando NÃO há :id, buscamos todos os ingressos do usuário
  // TRECHO ALTERADO
    const { data, isLoading, error } = useQuery<TicketsListResponse>({
      queryKey: ["/api/ingressos/me", "all"],
      queryFn: async () => {
        const r = await fetch("/api/ingressos/me?all=1");
        if (!r.ok) throw new Error("Falha ao buscar ingressos");
        return r.json();
      },
      enabled: !!userId && !ingressoNumero, // mantém
    });

  // Função para fazer download direto do PDF (sem abrir janela de impressão)
  const handleDownloadPDF = async () => {
    if (!printRef.current) return;

    try {
      // Capturar o elemento como canvas
      const canvas = await html2canvas(printRef.current, {
        scale: 3, // Aumentar qualidade
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: printRef.current.scrollWidth,
        windowHeight: printRef.current.scrollHeight,
      });

      // Converter canvas para imagem
      const imgData = canvas.toDataURL('image/png');
      
      // Criar PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Dimensões da página A4 em mm
      const pdfWidth = 210;
      const pdfHeight = 297;
      
      // Calcular dimensões mantendo proporção
      const canvasAspectRatio = canvas.height / canvas.width;
      
      // Usar 80% da largura da página para margens
      let imgWidth = pdfWidth * 0.8;
      let imgHeight = imgWidth * canvasAspectRatio;
      
      // Se a altura ultrapassar a página, ajustar pela altura
      if (imgHeight > pdfHeight * 0.9) {
        imgHeight = pdfHeight * 0.9;
        imgWidth = imgHeight / canvasAspectRatio;
      }
      
      // Centralizar na página
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;

      // Adicionar imagem ao PDF
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

      // Fazer download do PDF
      pdf.save(`Ingresso_${ingressoNumero || 'Evento'}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    }
  };

  // Executar download automático quando parâmetro estiver presente
  useEffect(() => {
    if (shouldDownload && (ingressoEspecifico || data?.ticket) && printRef.current) {
      // Usar requestAnimationFrame para garantir renderização sem delay perceptível
      requestAnimationFrame(() => {
        handleDownloadPDF();
      });
    }
  }, [shouldDownload, ingressoEspecifico, data?.ticket]);

  // Interceptar botão "Voltar" do navegador quando vier com ?download=true
  useEffect(() => {
    if (shouldDownload) {
      const handlePopState = () => {
        setLocation('/ingresso/avulso/resgatar');
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [shouldDownload, setLocation]);

    // 🔹 NOVO: também buscamos ingressos salvos pelo fluxo avulso
    const ingressosAvulsoLocal =
      !ingressoNumero && !userId
        ? JSON.parse(localStorage.getItem("ingressosAvulso") || "[]")
        : [];

    // 🔹 NOVO: prioridade para /me; se não tiver, usa os avulsos do localStorage
    const tickets = !ingressoNumero
      ? (data?.tickets?.length ? data.tickets : ingressosAvulsoLocal)
      : [];

    // (opcional) log para depuração
    console.log("tickets(/me):", data?.tickets?.length || 0,
                "tickets(avulsoLocal):", ingressosAvulsoLocal.length);

    // Atualiza condição de redirecionamento para olhar `tickets`
    useEffect(() => {
      if (!ingressoNumero && tickets.length === 0) {
        console.log("📍 Nenhum ingresso encontrado, redirecionando para checkout");
        setLocation("/pagamento-ingresso");
      }
    }, [tickets.length, setLocation, ingressoNumero]);

  // Se houver erro ao buscar ingresso específico, limpar e redirecionar
  useEffect(() => {
    if (errorEspecifico && ingressoNumero) {
      console.error("❌ [FRONTEND] Ingresso não encontrado, erro:", errorEspecifico);
      console.log("🗑️ [FRONTEND] Limpando localStorage e redirecionando");
      localStorage.removeItem("ingressoResgatadoNumero");
      setLocation("/ingresso/resgate/identificar");
    }
  }, [errorEspecifico, ingressoNumero, setLocation]);

  // Loading state
  const loading = ingressoNumero ? isLoadingEspecifico : isLoading;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-yellow-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando seu ingresso...</p>
        </div>
      </div>
    );
  }

  // ✅ VALIDAÇÃO CRÍTICA: Bloquear acesso se pagamento não foi aprovado
  // Usar apenas dados já carregados para evitar erro de temporal dead zone
  const ticketToValidate = ingressoNumero ? ingressoEspecifico : data?.ticket;
  
  if (ticketToValidate && ticketToValidate.status !== 'aprovado' && ticketToValidate.status !== 'ativo' && ticketToValidate.status !== 'confirmado') {
    const statusTexto: Record<string, string> = {
      'pendente': 'Pagamento Pendente',
      'cancelado': 'Pagamento Cancelado',
      'paid': 'Processando Pagamento',
      'pending': 'Aguardando Confirmação',
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-yellow-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⏳</span>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            {statusTexto[ticketToValidate.status] || 'Aguardando Pagamento'}
          </h2>
          
          <p className="text-gray-600 mb-6">
            Seu ingresso ainda não pode ser visualizado. O pagamento precisa ser confirmado antes de liberar o acesso.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <strong>Status atual:</strong> {ticketToValidate.status}
            </p>
            <p className="text-sm text-gray-700 mt-2">
              <strong>Número do ingresso:</strong> {ticketToValidate.numero}
            </p>
          </div>
          
          <Button
            onClick={() => setLocation("/ingresso/resgate/identificar")}
            className="w-full bg-red-500 hover:bg-red-600 text-white"
            data-testid="button-voltar-bloqueio"
          >
            Voltar
          </Button>
        </div>
      </div>
    );
  }
  function renderTicketCard(t: TicketData) {
          return (
            <>
              {/* Cartão do ingresso */}
              <div className="px-4 py-6 flex justify-center">
                <div
                  className="relative w-full max-w-sm"
                  style={{
                    borderRadius: '24px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    border: '2px solid #FFDC5E',
                    overflow: 'hidden',
                  }}
                  data-testid="card-ingresso"
                >
                  {/* Seção 1: Amarela - Logo */}
                  <div className="relative px-6 py-6 flex flex-col items-center justify-center" style={{ backgroundColor: '#F9C73B' }}>
                    <div className="flex items-center justify-center -mt-2">
                      <img src={logoEventoImg} alt="Logo Do Grito" className="h-40 w-auto object-contain" />
                    </div>
                  </div>

                  {/* Seção 2: Informações */}
                  <div
                    className="relative px-6 py-8 pb-8"
                    style={{ backgroundColor: '#000000' }}
                  >
                    <div className="text-center space-y-4">
                      
                      {/* QR Code em primeiro lugar */}
                      <div className="flex justify-center">
                        <div className="bg-white p-4 rounded-lg shadow-lg" data-testid="qr-code">
                          <QRCode value={`INGRESSO-${t.numero}-${t.id}`} size={200} level="H" />
                        </div>
                      </div>

                      {/* Nome abaixo do QR Code */}
                      {t.nomeComprador && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">PARA</p>
                          <p className="text-xl font-bold uppercase tracking-wide text-white" data-testid="nome-participante">
                            {t.nomeComprador}
                          </p>
                        </div>
                      )}

                      {/* Data e Hora */}
                      <div className="mt-4 space-y-1">
                        <p className="text-white font-bold text-sm">Data: {t.data || t.eventoData}</p>
                        <p className="text-white font-bold text-sm">Horas: {t.hora || t.eventoHora}</p>
                      </div>

                      {/* Endereço */}
                      {t.eventoLocal && (
                        <div className="mt-3">
                          <p className="text-gray-300" style={{ fontSize: '10px', lineHeight: '1.2' }}>
                            📍 {t.eventoLocal}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações Adicionais */}
              <div className="px-4 max-w-sm mx-auto">
                <div className="bg-white rounded-lg p-4 shadow mb-4">
                  <h3 className="font-bold text-sm mb-2">📋 Informações do Comprador</h3>
                  <div className="space-y-1 text-xs text-gray-700">
                    <p><span className="font-semibold">Nome:</span> {t.nomeComprador}</p>
                    <p><span className="font-semibold">Email:</span> {t.emailComprador}</p>
                    {t.telefoneComprador && <p><span className="font-semibold">Telefone:</span> {t.telefoneComprador}</p>}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow">
                  <h3 className="font-bold text-sm mb-2">📱 Como usar seu ingresso</h3>
                  <ul className="space-y-1 text-xs text-gray-700">
                    <li>• Apresente este ingresso na entrada do evento</li>
                    <li>• O QR Code será escaneado para validação</li>
                    <li>• Guarde este ingresso até o dia do evento</li>
                    <li>• Em caso de dúvidas, entre em contato conosco</li>
                  </ul>
                </div>
              </div>
            </>
          );
        }

      // Determinar qual ingresso exibir
      let ticket: TicketData | null = null;

      // Caso 1: há número na URL → mostra ingresso específico (mantém fluxo antigo)
      if (ingressoNumero && ingressoEspecifico) {
        ticket = {
          ...ingressoEspecifico,
          data: ingressoEspecifico.data || ingressoEspecifico.eventoData,
          hora: ingressoEspecifico.hora || ingressoEspecifico.eventoHora,
          nomeComprador: ingressoEspecifico.nomeComprador || 'Sem nome definido',
          imagemUrl: "/assets/ingresso-iv-encontro.png",
          };
      } else if (!ingressoNumero && tickets.length === 1) {
        const t = tickets[0];
        ticket = {
          ...t,
          data: t.data || t.eventoData,
          hora: t.hora || t.eventoHora,
          nomeComprador: t.nomeComprador || 'Sem nome definido',
          imagemUrl: "/assets/ingresso-iv-encontro.png",
        };
      }
      else if (!ingressoNumero && tickets.length > 1) {
          return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 pb-24">
              <div className="bg-gradient-to-r from-red-600 to-red-500 text-white p-6">
                <button onClick={() => handleVoltar(null)} className="mb-4 flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <ArrowLeft className="w-5 h-5" />
                  <span>Voltar</span>
                </button>
                <h1 className="text-3xl font-bold">SEUS INGRESSOS</h1>
                <p className="text-sm opacity-90">Foram encontrados {tickets.length} ingressos vinculados ao seu telefone.</p>
              </div>

              <div className="px-4 max-w-sm mx-auto mt-6">
                <Carousel className="w-full">
                  <CarouselContent>
                      {tickets.map((t) => (
                          <CarouselItem key={t.id}>
                            {renderTicketCard(t)}
                          </CarouselItem>
                        ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </Carousel>

                <p className="text-center text-xs text-gray-500 mt-4">
                  Deslize para navegar pelos seus ingressos
                </p>
              </div>

              {/* Mantém o bloco de patrocinadores abaixo */}
              {/* ... seu bloco de patrocinadores ... */}
            </div>
          );
        }


  console.log('🎫 Ticket final:', ticket);
  console.log('🎫 ingressoNumero:', ingressoNumero);
  console.log('🎫 ingressoEspecifico:', ingressoEspecifico);

  // TRECHO ADICIONADO:
   
  if (!ticket) {
    // Verificar se existe cota no localStorage
    const cotaData = localStorage.getItem('cotaEmpresa');
    const cotaEmpresa = cotaData ? JSON.parse(cotaData) : null;
    
    // Se tem cota, verificar se há ingressos gerados
    const temIngressosGerados = cotaEmpresa && cotaEmpresa.quantidadeUsada > 0;
    const cotaEsgotada = cotaEmpresa && cotaEmpresa.quantidadeUsada >= cotaEmpresa.quantidadeTotal;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-yellow-50 p-4">
        <div className="text-center max-w-md mx-auto">
          {temIngressosGerados && cotaEsgotada ? (
            <>
              <h1 className="text-2xl font-bold mb-2">Todos os Ingressos foram gerados</h1>
              <p className="text-gray-600 mb-6">Sua cota está completa. Clique abaixo para visualizar todos os convites.</p>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => setLocation(`/ingresso/lista-cota/${cotaEmpresa.id}`)}
                  className="w-full h-14 text-lg font-semibold"
                  style={{
                    backgroundColor: '#D4A017',
                    color: '#000',
                  }}
                  data-testid="button-ver-convites-gerados"
                >
                  Ver Convites Gerados
                </Button>
                
                <Button 
                  onClick={() => handleVoltar(ticket)}
                  className="w-full h-14 bg-gray-200 hover:bg-gray-300 text-gray-700 text-lg"
                  data-testid="button-voltar-completo"
                >
                  Voltar
                </Button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-2">Nenhum ingresso encontrado</h1>
              <p className="text-gray-600 mb-6">Você ainda não possui ingressos.</p>
              
              <div className="space-y-3">
                {cotaEmpresa ? (
                  <Button 
                    onClick={() => setLocation(`/ingresso/lista-cota/${cotaEmpresa.id}`)}
                    className="w-full h-14 text-lg font-semibold"
                    style={{
                      backgroundColor: '#D4A017',
                      color: '#000',
                    }}
                    data-testid="button-ver-convites-gerados"
                  >
                    Ver Convites Gerados
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setLocation("/ingresso/resgate/identificar")}
                    className="w-full h-14 text-lg font-semibold"
                    style={{
                      backgroundColor: '#D4A017',
                      color: '#000',
                    }}
                    data-testid="button-adicionar-nome-convite"
                  >
                    Colocar Nome no Convite
                  </Button>
                )}
                
                <Button 
                  onClick={() => handleVoltar(ticket)}
                  className="w-full h-14 bg-gray-200 hover:bg-gray-300 text-gray-700 text-lg"
                  data-testid="button-voltar-empty"
                >
                  Voltar
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-500 text-white p-6">
        <button
          onClick={() => handleVoltar(ticket)}
          className="no-print mb-4 flex items-center gap-2 hover:opacity-80 transition-opacity"
          data-testid="button-voltar"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>
        
        <h1 className="text-3xl font-bold mb-2" data-testid="titulo-ingresso">INGRESSO</h1>
        <p className="text-sm opacity-90">
          Esse ingresso é a sua chave de acesso ao{" "}
          <span className="font-bold">Clube do Grito</span>. Mostre na entrada e
          prepare-se para Ecoar Vozes junto com a gente!
        </p>
      </div>

      {/* Ingresso Digital - Design Correto */}
      <div className="px-4 py-6 flex justify-center">
        <div 
          ref={printRef}
          className="relative w-full max-w-sm print:max-w-[300px] print:scale-75"
          style={{
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: '2px solid #FFDC5E',
            overflow: 'hidden',
          }}
          data-testid="card-ingresso"
        >
          {/* Seção 1: Amarela - Logo */}
          <div 
            className="relative px-6 py-6 print:py-4 flex flex-col items-center justify-center"
            style={{ backgroundColor: '#F9C73B' }}
          >
            <div className="flex items-center justify-center -mt-2">
              <img 
                src={logoEventoImg}
                alt="Logo Do Grito"
                className="h-40 print:h-28 w-auto object-contain"
              />
            </div>
          </div>

          {/* Seção 2: Preto - Informações */}
          <div 
            className="relative px-6 py-8 pb-8 print:py-4 print:pb-6"
            style={{
              backgroundColor: '#000000',
            }}
          >
            <div className="text-center space-y-4 print:space-y-2">
              {/* QR Code em primeiro lugar */}
              <div className="flex justify-center">
                <div 
                  className="bg-white p-4 print:p-3 rounded-lg shadow-lg"
                  data-testid="qr-code"
                >
                  <QRCode
                    value={`INGRESSO-${ticket.numero}-${ticket.id}`}
                    size={200}
                    level="H"
                    className="print:!w-[150px] print:!h-[150px]"
                  />
                </div>
              </div>

              {/* Nome abaixo do QR Code */}
              {ticket.nomeComprador && (
                <div className="mt-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">PARA</p>
                  <p 
                    className="text-xl font-bold uppercase tracking-wide text-white"
                    data-testid="nome-participante"
                  >
                    {ticket.nomeComprador}
                  </p>
                </div>
              )}

              {/* Data e Hora */}
              <div className="mt-4 space-y-1">
                <p className="text-white font-bold text-sm">
                  Data: {ticket.data}
                </p>
                <p className="text-white font-bold text-sm">
                  Horas: {ticket.hora}
                </p>
              </div>

              {/* Endereço */}
              {ticket.eventoLocal && (
                <div className="mt-3">
                  <p className="text-gray-300" style={{ fontSize: '10px', lineHeight: '1.2' }}>
                    📍 {ticket.eventoLocal}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Botão de Download */}
      <div className="no-print px-4 max-w-sm mx-auto mb-6">
        <Button
          onClick={handleDownloadPDF}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-6"
          data-testid="button-baixar-ingresso"
        >
          <Download className="w-5 h-5 mr-2" />
          Baixar Ingresso
        </Button>
      </div>

      {/* Informações Adicionais */}
      <div className="no-print px-4 max-w-sm mx-auto">
        <div className="bg-white rounded-lg p-4 shadow mb-4">
          <h3 className="font-bold text-sm mb-2">📋 Informações do Comprador</h3>
          <div className="space-y-1 text-xs text-gray-700">
            <p><span className="font-semibold">Nome:</span> {ticket.nomeComprador}</p>
            <p><span className="font-semibold">Email:</span> {ticket.emailComprador}</p>
            {ticket.telefoneComprador && (
              <p><span className="font-semibold">Telefone:</span> {ticket.telefoneComprador}</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow">
          <h3 className="font-bold text-sm mb-2">📱 Como usar seu ingresso</h3>
          <ul className="space-y-1 text-xs text-gray-700">
            <li>• Apresente este ingresso na entrada do evento</li>
            <li>• O QR Code será escaneado para validação</li>
            <li>• Guarde este ingresso até o dia do evento</li>
            <li>• Em caso de dúvidas, entre em contato conosco</li>
          </ul>
        </div>
      </div>

      {/* Carrossel de Patrocinadores */}
      <div className="no-print">
        <PatrocinadoresCarousel />
      </div>

      {/* Mensagem de Segurança LGPD */}
      <div className="px-4 max-w-sm mx-auto mt-6 mb-8">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-gray-700 text-xs text-center leading-relaxed">
            🔒 <span className="font-semibold">Ambiente 100% Seguro.</span> Seus dados pessoais e de pagamento estão protegidos. Seguimos rigorosamente todos os protocolos de segurança e as diretrizes da Lei Geral de Proteção de Dados (LGPD). Nenhuma informação do seu cartão é armazenada em nossos servidores.
          </p>
        </div>
      </div>
    </div>
  );
}
