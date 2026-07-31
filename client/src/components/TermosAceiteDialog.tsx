import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface TermosAceiteDialogProps {
  recusou: boolean;
  aceitando: boolean;
  erroAceite?: string | null;
  onAceitar: () => void;
  onRecusar: () => void;
  onVoltar: () => void;
  onLerTermos: () => void;
}

/**
 * Modal de aceite de termos responsivo para celular:
 * cabe na viewport (dvh + safe-area), conteúdo rola e ações ficam fixas embaixo.
 */
export default function TermosAceiteDialog({
  recusou,
  aceitando,
  erroAceite,
  onAceitar,
  onRecusar,
  onVoltar,
  onLerTermos,
}: TermosAceiteDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      style={{
        paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))",
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
        paddingLeft: "max(0.75rem, env(safe-area-inset-left, 0px))",
        paddingRight: "max(0.75rem, env(safe-area-inset-right, 0px))",
      }}
    >
      <div
        className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        style={{ maxHeight: "min(92dvh, calc(100dvh - 1.5rem))" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="termos-aceite-titulo"
      >
        {recusou ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <AlertTriangle className="h-10 w-10 shrink-0 text-amber-400" />
                <p className="font-semibold text-gray-800">Acesso bloqueado</p>
                <p className="text-sm leading-relaxed text-gray-500">
                  É necessário aceitar os Termos de Uso para continuar usando o aplicativo.
                </p>
              </div>
            </div>
            <div className="shrink-0 border-t border-gray-100 px-5 py-4">
              <Button
                className="h-11 w-full rounded-xl bg-gray-800 font-semibold text-white hover:bg-gray-700"
                onClick={onVoltar}
              >
                Voltar e aceitar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 pb-3 pt-5">
              <p
                id="termos-aceite-titulo"
                className="text-center text-sm font-semibold leading-snug text-gray-800 sm:text-base"
              >
                Termos de Uso e Política de Privacidade atualizados
              </p>
              <p className="text-sm leading-relaxed text-gray-600">
                O Instituto O Grito atualizou os Termos de Uso e a Política de Privacidade do aplicativo Clube do Grito.
              </p>
              <p className="text-sm leading-relaxed text-gray-600">
                Essas atualizações são importantes para garantir mais transparência, segurança e melhorias na sua experiência. Recomendamos que você leia atentamente os documentos.
              </p>
              <p className="text-sm leading-relaxed text-gray-600">
                Para continuar utilizando o aplicativo, é necessário concordar com os novos termos.
              </p>
              <button
                type="button"
                className="text-left text-sm font-medium text-blue-600 underline"
                onClick={onLerTermos}
              >
                Ler Termos de Uso e Política de Privacidade
              </button>
              {erroAceite && (
                <p className="text-center text-sm text-red-600">{erroAceite}</p>
              )}
            </div>

            <div className="flex shrink-0 flex-col gap-2 border-t border-gray-100 bg-white px-5 py-4">
              <Button
                className="h-11 w-full rounded-xl bg-yellow-400 font-bold text-black hover:bg-yellow-300"
                onClick={onAceitar}
                disabled={aceitando}
              >
                {aceitando ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    Registrando...
                  </span>
                ) : (
                  "Li e Aceito"
                )}
              </Button>
              <Button
                variant="ghost"
                className="h-9 w-full text-sm text-gray-400 hover:text-gray-700"
                onClick={onRecusar}
                disabled={aceitando}
              >
                Recusar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
