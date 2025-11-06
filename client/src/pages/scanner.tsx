import { useState, useEffect } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ScanLine, CheckCircle2, XCircle, AlertCircle, Camera, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface IngressoValidado {
  numero: string;
  nomeComprador: string;
  telefoneComprador: string;
  eventoNome: string;
  eventoData: string;
  eventoHora: string;
  tipoIngresso: "empresa" | "avulso";
  nomeEmpresa?: string;
}

export default function ScannerPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [scanning, setScanning] = useState(true);
  const [resultado, setResultado] = useState<'success' | 'error' | 'already-used' | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [ingressoValidado, setIngressoValidado] = useState<IngressoValidado | null>(null);
  const [dataUso, setDataUso] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    // Verificar autenticação do scanner
    const scannerAuth = sessionStorage.getItem("scanner_auth");
    if (scannerAuth !== "true") {
      setLocation("/scanner-login");
      return;
    }

    // Verificar se MediaDevices está disponível
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('MediaDevices API não disponível');
      setHasPermission(false);
      return;
    }

    // Verificar permissão de câmera - configuração mínima
    navigator.mediaDevices.getUserMedia({ 
      video: true,
      audio: false 
    })
      .then((stream) => {
        console.log('✅ Câmera autorizada');
        // Parar o stream do teste
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
      })
      .catch((err) => {
        console.error('❌ Erro ao pedir permissão da câmera:', err);
        setHasPermission(false);
      });
  }, [setLocation]);

  const handleScan = async (data: any) => {
    if (!data || !scanning) return;
    
    // Parar o scanner temporariamente
    setScanning(false);
    
    // Extrair o valor do QR Code corretamente
    let numeroIngresso = data;
    
    // Se for um array de resultados, pegar o primeiro
    if (Array.isArray(data) && data.length > 0) {
      numeroIngresso = data[0].rawValue || data[0].text || data[0];
    } else if (data.rawValue) {
      numeroIngresso = data.rawValue;
    } else if (data.text) {
      numeroIngresso = data.text;
    }
    
    console.log('🔍 QR Code escaneado:', numeroIngresso);
    
    try {
      const response = await fetch('/api/ingressos/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numeroIngresso }),
      });
      
      const resultado = await response.json();
      
      if (resultado.valido) {
        // Ingresso válido
        setResultado('success');
        setMensagem('Ingresso validado com sucesso!');
        setIngressoValidado({
          numero: resultado.ingresso.numero,
          nomeComprador: resultado.ingresso.nomeComprador,
          telefoneComprador: resultado.ingresso.telefoneComprador,
          eventoNome: resultado.ingresso.eventoNome,
          eventoData: resultado.ingresso.eventoData,
          eventoHora: resultado.ingresso.eventoHora,
          tipoIngresso: resultado.ingresso.tipoIngresso,
          nomeEmpresa: resultado.ingresso.nomeEmpresa,
        });
        
        // Som de sucesso (se disponível)
        const audio = new Audio('/success.mp3');
        audio.play().catch(() => {});
        
      } else if (resultado.error?.includes('já foi utilizado')) {
        // Ingresso já usado
        setResultado('already-used');
        setMensagem('Ingresso já foi utilizado anteriormente');
        setDataUso(resultado.dataUso);
        setIngressoValidado(resultado.ingresso ? {
          numero: resultado.ingresso.numero,
          nomeComprador: resultado.ingresso.nomeComprador,
          telefoneComprador: resultado.ingresso.telefoneComprador,
          eventoNome: resultado.ingresso.eventoNome,
          eventoData: resultado.ingresso.eventoData,
          eventoHora: resultado.ingresso.eventoHora,
          tipoIngresso: resultado.ingresso.tipoIngresso || "avulso",
          nomeEmpresa: resultado.ingresso.nomeEmpresa,
        } : null);
        
        // Som de erro
        const audio = new Audio('/error.mp3');
        audio.play().catch(() => {});
        
      } else {
        // Erro genérico
        setResultado('error');
        setMensagem(resultado.error || 'Ingresso inválido');
        
        // Som de erro
        const audio = new Audio('/error.mp3');
        audio.play().catch(() => {});
      }
      
      // Aguardar 6 segundos antes de permitir novo scan
      setTimeout(() => {
        setScanning(true);
        setResultado(null);
        setMensagem("");
        setIngressoValidado(null);
        setDataUso(null);
      }, 6000);
      
    } catch (error) {
      console.error('Erro ao validar ingresso:', error);
      setResultado('error');
      setMensagem('Erro ao conectar com servidor');
      
      // Aguardar 6 segundos antes de permitir novo scan
      setTimeout(() => {
        setScanning(true);
        setResultado(null);
        setMensagem("");
      }, 6000);
    }
  };

  const handleError = (error: any) => {
    console.error('Erro no scanner:', error);
  };

  const reiniciarScanner = () => {
    setScanning(true);
    setResultado(null);
    setMensagem("");
    setIngressoValidado(null);
    setDataUso(null);
  };

  if (hasPermission === false) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/admin-geral")}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-bold text-black">Scanner de Ingressos</h1>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6">
          <Card className="text-center">
            <CardHeader>
              <Camera className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <CardTitle className="text-red-600">Permissão de Câmera Negada</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Para escanear ingressos, você precisa permitir o acesso à câmera do seu dispositivo.
              </p>
              <Button onClick={() => window.location.reload()}>
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      <header className="bg-black shadow-sm border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/admin-geral")}
                className="p-2 text-white hover:bg-gray-800"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-bold text-white">Scanner de Ingressos</h1>
                <p className="text-xs text-gray-400">Escaneie o QR Code do ingresso</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={scanning ? "default" : "secondary"} className="bg-green-500">
                {scanning ? "Ativo" : "Pausado"}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  sessionStorage.removeItem("scanner_auth");
                  setLocation("/scanner-login");
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Área do Scanner */}
        <Card className="mb-6 overflow-hidden bg-gray-800 border-gray-700">
          <CardContent className="p-0">
            <div className="relative aspect-square bg-black">
              {scanning && hasPermission ? (
                <div className="relative w-full h-full">
                  <Scanner
                    onScan={handleScan}
                    onError={handleError}
                    allowMultiple={false}
                    scanDelay={300}
                    components={{
                      finder: false,
                    }}
                    formats={[
                      'qr_code',
                      'code_128',
                      'code_39',
                      'ean_13',
                      'ean_8',
                      'upc_a',
                      'upc_e'
                    ]}
                    styles={{
                      container: { 
                        width: '100%', 
                        height: '100%',
                      },
                      video: { 
                        objectFit: 'cover',
                      }
                    }}
                  />
                  
                  {/* Overlay de guia */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-64 border-4 border-yellow-400 rounded-lg relative">
                      <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-yellow-400"></div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-yellow-400"></div>
                      <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-yellow-400"></div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-yellow-400"></div>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <p className="text-white text-sm bg-black bg-opacity-50 inline-block px-4 py-2 rounded-full">
                      <ScanLine className="w-4 h-4 inline mr-2" />
                      Posicione o QR Code dentro da moldura
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-16 h-16 text-gray-600 animate-pulse" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resultado da Validação */}
        {resultado && (
          <Card className={`
            ${resultado === 'success' ? 'bg-green-50 border-green-500' : ''}
            ${resultado === 'already-used' ? 'bg-yellow-50 border-yellow-500' : ''}
            ${resultado === 'error' ? 'bg-red-50 border-red-500' : ''}
          `}>
            <CardHeader>
              <div className="flex items-center justify-center mb-3">
                {resultado === 'success' && <CheckCircle2 className="w-16 h-16 text-green-500" />}
                {resultado === 'already-used' && <AlertCircle className="w-16 h-16 text-yellow-500" />}
                {resultado === 'error' && <XCircle className="w-16 h-16 text-red-500" />}
              </div>
              <CardTitle className={`text-center ${
                resultado === 'success' ? 'text-green-700' : 
                resultado === 'already-used' ? 'text-yellow-700' : 
                'text-red-700'
              }`}>
                {resultado === 'success' && 'Ingresso Válido!'}
                {resultado === 'already-used' && 'Ingresso Já Utilizado'}
                {resultado === 'error' && 'Ingresso Inválido'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-center mb-4 ${
                resultado === 'success' ? 'text-green-600' : 
                resultado === 'already-used' ? 'text-yellow-600' : 
                'text-red-600'
              }`}>
                {mensagem}
              </p>
              
              {ingressoValidado && (
                <div className="bg-white rounded-lg p-4 space-y-3">
                  {/* Badge de Tipo de Ingresso */}
                  <div className="flex justify-center mb-2">
                    <Badge className={`text-sm px-4 py-1 ${
                      ingressoValidado.tipoIngresso === "empresa" 
                        ? "bg-blue-500 text-white" 
                        : "bg-purple-500 text-white"
                    }`}>
                      {ingressoValidado.tipoIngresso === "empresa" ? "🏢 EMPRESA" : "👤 AVULSO"}
                    </Badge>
                  </div>
                  
                  {/* Nome da Empresa (se for empresa) */}
                  {ingressoValidado.tipoIngresso === "empresa" && ingressoValidado.nomeEmpresa && (
                    <div className="bg-blue-50 p-2 rounded text-center border border-blue-200">
                      <span className="text-blue-800 font-semibold">{ingressoValidado.nomeEmpresa}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Ingresso:</span>
                    <span className="font-bold">#{ingressoValidado.numero}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nome:</span>
                    <span className="font-semibold">{ingressoValidado.nomeComprador}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Telefone:</span>
                    <span>{ingressoValidado.telefoneComprador}</span>
                  </div>
                  {dataUso && (
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-600">Usado em:</span>
                      <span className="text-red-600 font-semibold">
                        {new Date(dataUso).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              <Button 
                onClick={reiniciarScanner}
                className="w-full mt-4"
                data-testid="button-escanear-novamente"
              >
                Escanear Próximo Ingresso
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Instruções */}
        {!resultado && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-800 mb-3">
                <strong>📱 Como usar:</strong>
              </p>
              <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                <li>Peça para o cliente abrir o ingresso no celular</li>
                <li>Posicione o QR Code dentro da moldura amarela</li>
                <li>O scanner validará automaticamente</li>
                <li>Aguarde a confirmação verde para liberar entrada</li>
              </ol>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
