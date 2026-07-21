import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import {
  TERMOS_VERSAO_ATUAL,
  TERMOS_CACHE_KEY,
  getTermosActor,
  registrarAceiteTermos,
  markTermosAcceptedInSession,
  verificarTermosAceitos,
} from "@/lib/termosAcceptance";

interface TermosGuardProps {
  children: React.ReactNode;
}

export default function TermosGuard({ children }: TermosGuardProps) {
  const [status, setStatus] = useState<"loading" | "aceito" | "pendente">("loading");
  const [recusou, setRecusou] = useState(false);
  const [aceitando, setAceitando] = useState(false);
  const [erroAceite, setErroAceite] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (localStorage.getItem("dev_auth") === "true" || localStorage.getItem("userPapel") === "dev") {
      setStatus("aceito");
      return;
    }

    const info = getTermosActor();
    if (!info) {
      setStatus("aceito");
      return;
    }

    if (sessionStorage.getItem(TERMOS_CACHE_KEY) === TERMOS_VERSAO_ATUAL) {
      setStatus("aceito");
      return;
    }

    verificarTermosAceitos(info.userId, info.tipo).then((aceitou) => {
      if (aceitou) {
        markTermosAcceptedInSession();
        setStatus("aceito");
      } else {
        setStatus("pendente");
      }
    });
  }, []);

  const handleAceitar = async () => {
    setAceitando(true);
    setErroAceite(null);
    const info = getTermosActor();
    if (info) {
      const ok = await registrarAceiteTermos(info.userId, info.tipo);
      if (!ok) {
        setErroAceite("Não foi possível registrar o aceite. Verifique sua conexão e tente novamente.");
        setAceitando(false);
        return;
      }
      markTermosAcceptedInSession();
    }
    setStatus("aceito");
    setAceitando(false);
  };

  if (status === "loading") return <>{children}</>;
  if (status === "aceito") return <>{children}</>;

  return (
    <>
      {children}
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4"
        style={{
          paddingTop: "max(1rem, env(safe-area-inset-top, 0px))",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div
          className="bg-white w-full max-w-sm rounded-2xl shadow-xl flex flex-col min-h-0"
          style={{ maxHeight: "min(90dvh, calc(100dvh - 2rem))" }}
        >
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-5 sm:p-6 [-webkit-overflow-scrolling:touch]">
            {recusou ? (
              <div className="flex flex-col items-center gap-3 text-center py-2">
                <AlertTriangle className="w-10 h-10 text-amber-400 shrink-0" />
                <p className="font-semibold text-gray-800">Acesso bloqueado</p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  É necessário aceitar os Termos de Uso para continuar usando o aplicativo.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="font-semibold text-gray-800 text-base text-center leading-snug">
                  Termos de Uso e Política de Privacidade atualizados
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  O Instituto O Grito atualizou os Termos de Uso e a Política de Privacidade do aplicativo Clube do Grito.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Essas atualizações são importantes para garantir mais transparência, segurança e melhorias na sua experiência. Recomendamos que você leia atentamente os documentos.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Para continuar utilizando o aplicativo, é necessário concordar com os novos termos.
                </p>
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    className="text-sm text-blue-600 underline font-medium text-left"
                    onClick={() => setLocation("/termos-servicos?from=help")}
                  >
                    Ler Termos de Uso
                  </button>
                  <button
                    type="button"
                    className="text-sm text-blue-600 underline font-medium text-left"
                    onClick={() => setLocation("/politica-de-privacidade")}
                  >
                    Política de Privacidade
                  </button>
                </div>
                {erroAceite && (
                  <p className="text-sm text-red-600 text-center">{erroAceite}</p>
                )}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-gray-100 p-4 flex flex-col gap-2 bg-white rounded-b-2xl">
            {recusou ? (
              <Button
                className="w-full h-11 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold"
                onClick={() => setRecusou(false)}
              >
                Voltar e aceitar
              </Button>
            ) : (
              <>
                <Button
                  className="w-full h-11 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-bold"
                  onClick={handleAceitar}
                  disabled={aceitando}
                >
                  {aceitando ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Registrando...
                    </span>
                  ) : "Li e Aceito"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full h-9 text-gray-400 hover:text-gray-700 text-sm"
                  onClick={() => setRecusou(true)}
                >
                  Recusar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
