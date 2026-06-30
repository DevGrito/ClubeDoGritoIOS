import { useState, useEffect, useRef } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ScanLine, CheckCircle2, XCircle, AlertCircle, Camera, LogOut, Ticket, User } from "lucide-react";
import { useLocation } from "wouter";
import { authFetch } from "@/lib/queryClient";
import { logoutAndClearSession } from "@/lib/auth-session";
import { useAuthSession } from "@/hooks/useAuthSession";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface IngressoInfo {
  codigo: string;
  titular: string;
  paraTerceiro?: boolean;
  beneficiarioNome?: string;
  eventoNome: string;
  eventoData: string;
  eventoHora: string;
  eventoLocal: string;
}

interface DemograficoInfo {
  nome: string;
  nascimento?: string | null;
  genero?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  email?: string | null;
}

const GENERO_LABEL: Record<string, string> = {
  masculino: "Masculino",
  feminino: "Feminino",
  nao_binario: "Não binário",
  outro: "Outro",
  prefiro_nao_informar: "Prefiro não informar",
};

function formatarNascimento(data: string | null | undefined) {
  if (!data) return null;
  try {
    return format(new Date(data), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return data;
  }
}

function buildEnderecoStr(d: DemograficoInfo) {
  const parts = [
    d.logradouro && d.numero ? `${d.logradouro}, ${d.numero}` : d.logradouro,
    d.bairro,
    d.cidade && d.estado ? `${d.cidade} - ${d.estado}` : d.cidade || d.estado,
    d.cep,
  ].filter(Boolean);
  return parts.join(" · ") || null;
}

export default function ScannerPage() {
  const [, setLocation] = useLocation();
  const [scanning, setScanning] = useState(true);
  const scanningRef = useRef(true); // lock síncrono — evita race condition de frames simultâneos
  const [resultado, setResultado] = useState<"success" | "error" | "already-used" | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [ingressoInfo, setIngressoInfo] = useState<IngressoInfo | null>(null);
  const [demografico, setDemografico] = useState<DemograficoInfo | null>(null);
  const [usadoEm, setUsadoEm] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const { data: authSession, isFetched, isLoading } = useAuthSession();

  useEffect(() => {
    if (!isFetched || isLoading) return;
    if (authSession?.actorType !== "scanner") {
      setLocation("/scanner-login");
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasPermission(false);
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        stream.getTracks().forEach((track) => track.stop());
        setHasPermission(true);
      })
      .catch(() => setHasPermission(false));
  }, [setLocation, authSession, isFetched, isLoading]);

  const handleScan = async (data: any) => {
    if (!data || !scanningRef.current) return;
    scanningRef.current = false; // bloqueia imediatamente (síncrono) — impede frames paralelos
    setScanning(false);

    let codigo = data;
    if (Array.isArray(data) && data.length > 0) {
      codigo = data[0].rawValue || data[0].text || data[0];
    } else if (data.rawValue) {
      codigo = data.rawValue;
    } else if (data.text) {
      codigo = data.text;
    }

    try {
      const response = await authFetch("/api/eventos/ingressos/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });
      const res = await response.json();

      if (res.valido) {
        setResultado("success");
        setMensagem("Entrada liberada!");
        setIngressoInfo(res.ingresso);
        setDemografico(res.demografico || null);
        new Audio("/success.mp3").play().catch(() => {});
      } else if (res.jaUsado) {
        setResultado("already-used");
        setMensagem("Este ingresso já foi usado na entrada.");
        setIngressoInfo(res.ingresso);
        setDemografico(res.demografico || null);
        setUsadoEm(res.usadoEm);
        new Audio("/error.mp3").play().catch(() => {});
      } else {
        setResultado("error");
        setMensagem(res.error || "Ingresso inválido");
        new Audio("/error.mp3").play().catch(() => {});
      }

    } catch {
      setResultado("error");
      setMensagem("Erro ao conectar com o servidor");
    }
  };

  const reiniciar = () => {
    scanningRef.current = true;
    setScanning(true);
    setResultado(null);
    setMensagem("");
    setIngressoInfo(null);
    setDemografico(null);
    setUsadoEm(null);
  };

  const formatarData = (data: string) => {
    try {
      return format(new Date(data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return data;
    }
  };

  if (hasPermission === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <Camera className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <CardTitle className="text-red-600">Permissão de Câmera Negada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Para escanear ingressos, permita o acesso à câmera.</p>
            <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      <header className="bg-black border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/admin-geral")}
              className="p-2 text-white hover:bg-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-white">Scanner de Eventos</h1>
              <p className="text-xs text-gray-400">Leia o QR Code do ingresso</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={scanning ? "bg-green-500" : "bg-gray-500"}>
              {scanning ? "Ativo" : "Pausado"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await logoutAndClearSession();
                setLocation("/scanner-login");
              }}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Câmera */}
        <Card className="overflow-hidden bg-gray-800 border-gray-700">
          <CardContent className="p-0">
            <div className="relative aspect-square bg-black">
              {scanning && hasPermission ? (
                <div className="relative w-full h-full">
                  <Scanner
                    onScan={handleScan}
                    onError={(e) => console.error("Scanner error:", e)}
                    allowMultiple={false}
                    scanDelay={300}
                    components={{ finder: false }}
                    formats={["qr_code", "code_128", "code_39"]}
                    styles={{
                      container: { width: "100%", height: "100%" },
                      video: { objectFit: "cover" },
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-64 border-4 border-yellow-400 rounded-lg relative">
                      <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-yellow-400" />
                      <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-yellow-400" />
                      <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-yellow-400" />
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-yellow-400" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <p className="text-white text-sm bg-black/50 inline-block px-4 py-2 rounded-full">
                      <ScanLine className="w-4 h-4 inline mr-2" />
                      Posicione o QR Code na moldura
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

        {/* Resultado */}
        {resultado && (
          <Card
            className={
              resultado === "success"
                ? "bg-green-50 border-2 border-green-500"
                : resultado === "already-used"
                ? "bg-yellow-50 border-2 border-yellow-500"
                : "bg-red-50 border-2 border-red-500"
            }
          >
            <CardHeader className="pb-2">
              <div className="flex flex-col items-center gap-2">
                {resultado === "success" && <CheckCircle2 className="w-14 h-14 text-green-500" />}
                {resultado === "already-used" && <AlertCircle className="w-14 h-14 text-yellow-500" />}
                {resultado === "error" && <XCircle className="w-14 h-14 text-red-500" />}
                <CardTitle
                  className={
                    resultado === "success"
                      ? "text-green-700 text-xl"
                      : resultado === "already-used"
                      ? "text-yellow-700 text-xl"
                      : "text-red-700 text-xl"
                  }
                >
                  {resultado === "success" && "✅ Entrada Liberada"}
                  {resultado === "already-used" && "⚠️ Ingresso Já Usado"}
                  {resultado === "error" && "❌ Ingresso Inválido"}
                </CardTitle>
                <p
                  className={`text-sm text-center ${
                    resultado === "success"
                      ? "text-green-600"
                      : resultado === "already-used"
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {mensagem}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Info do Ingresso */}
              {ingressoInfo && (
                <div className="bg-white rounded-xl p-4 space-y-2 shadow-sm">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Ticket className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400 font-mono">{ingressoInfo.codigo}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Titular da conta</span>
                    <span className="font-bold text-gray-800">{ingressoInfo.titular || "—"}</span>
                  </div>

                  {ingressoInfo.paraTerceiro && ingressoInfo.beneficiarioNome && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Ingresso para</span>
                      <span className="font-semibold text-blue-700">{ingressoInfo.beneficiarioNome}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-100 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Evento</span>
                      <span className="font-semibold text-gray-800 text-right max-w-[60%]">
                        {ingressoInfo.eventoNome}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Data</span>
                      <span className="text-gray-700 text-sm">{formatarData(ingressoInfo.eventoData)}</span>
                    </div>
                    {ingressoInfo.eventoHora && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Horário</span>
                        <span className="text-gray-700 text-sm">{ingressoInfo.eventoHora}</span>
                      </div>
                    )}
                    {ingressoInfo.eventoLocal && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Local</span>
                        <span className="text-gray-700 text-sm text-right max-w-[60%]">
                          {ingressoInfo.eventoLocal}
                        </span>
                      </div>
                    )}
                  </div>

                  {usadoEm && (
                    <div className="flex justify-between pt-2 border-t border-gray-100">
                      <span className="text-gray-500 text-sm">Usado em</span>
                      <span className="text-red-600 font-semibold text-sm">
                        {new Date(usadoEm).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Dados Demográficos do Portador */}
              {demografico && (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 pb-2 mb-2 border-b border-gray-100">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Dados do Portador
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Nome</span>
                      <span className="font-semibold text-gray-800 text-right max-w-[60%]">
                        {demografico.nome || "—"}
                      </span>
                    </div>
                    {demografico.nascimento && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Nascimento</span>
                        <span className="text-gray-700 text-sm">
                          {formatarNascimento(demografico.nascimento)}
                        </span>
                      </div>
                    )}
                    {demografico.genero && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Gênero</span>
                        <span className="text-gray-700 text-sm">
                          {GENERO_LABEL[demografico.genero] || demografico.genero}
                        </span>
                      </div>
                    )}
                    {buildEnderecoStr(demografico) && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-gray-500 text-sm shrink-0">Endereço</span>
                        <span className="text-gray-700 text-sm text-right">
                          {buildEnderecoStr(demografico)}
                        </span>
                      </div>
                    )}
                    {demografico.email && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">E-mail</span>
                        <span className="text-gray-700 text-sm text-right max-w-[60%]">
                          {demografico.email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button onClick={reiniciar} className="w-full">
                Escanear Próximo
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Instruções */}
        {!resultado && (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-5 pb-5">
              <p className="text-sm text-gray-300 mb-2 font-semibold">Como usar:</p>
              <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                <li>Peça ao participante para abrir o ingresso no celular</li>
                <li>Posicione o QR Code dentro da moldura amarela</li>
                <li>O scanner valida automaticamente</li>
                <li>Verde = entrada liberada | Vermelho = inválido</li>
              </ol>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
