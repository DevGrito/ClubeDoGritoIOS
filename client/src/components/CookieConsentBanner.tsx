import { useEffect } from "react";
import { Shield } from "lucide-react";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import PrivacyPreferencesModal from "./PrivacyPreferencesModal";

interface Props {
  onNavigate: (path: string) => void;
}

export default function CookieConsentBanner({ onNavigate }: Props) {
  const {
    consent,
    syncError,
    needsBanner,
    showPreferences,
    acceptAll,
    rejectAll,
    savePreferences,
    openPreferences,
    closePreferences,
  } = useCookieConsent();

  useEffect(() => {
    const handler = () => openPreferences();
    window.addEventListener("openCookiePreferences", handler);
    return () => window.removeEventListener("openCookiePreferences", handler);
  }, [openPreferences]);

  return (
    <>
      {/* Banner principal */}
      {needsBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4">
          <div
            className="max-w-xl mx-auto rounded-2xl shadow-xl border border-gray-200 bg-white p-5"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 mb-1">
                  Seus dados, sua escolha
                </p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Usamos cookies para manter o site funcionando, melhorar sua experiência e, quando autorizado, personalizar comunicações. Você pode aceitar tudo, recusar cookies não essenciais ou{" "}
                  <button onClick={openPreferences} className="underline text-black font-medium">
                    gerenciar suas preferências
                  </button>
                  .{" "}
                  <button onClick={() => onNavigate("/politica-de-privacidade")} className="underline text-gray-500">
                    Política de Privacidade
                  </button>
                  .
                </p>

                {syncError && (
                  <p className="text-xs text-red-600 mt-2">{syncError}</p>
                )}

                {/* Botões — empilhados no mobile, lado a lado no desktop */}
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <button
                    onClick={acceptAll}
                    className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors"
                  >
                    Aceitar tudo
                  </button>
                  <button
                    onClick={rejectAll}
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold py-2.5 px-4 rounded-xl border border-gray-200 transition-colors"
                  >
                    Recusar tudo
                  </button>
                  <button
                    onClick={openPreferences}
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-600 text-xs font-medium py-2.5 px-4 rounded-xl border border-gray-200 transition-colors"
                  >
                    Gerenciar preferências
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de preferências */}
      <PrivacyPreferencesModal
        open={showPreferences}
        currentConsent={consent}
        onSave={savePreferences}
        onAcceptAll={acceptAll}
        onRejectAll={rejectAll}
        onClose={closePreferences}
        onNavigate={onNavigate}
      />
    </>
  );
}
