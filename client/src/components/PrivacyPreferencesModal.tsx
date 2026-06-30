import { useState } from "react";
import { X, Shield, BarChart2, Settings, Megaphone, Camera, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { CookieConsent } from "@/hooks/useCookieConsent";

interface Props {
  open: boolean;
  currentConsent: CookieConsent | null;
  onSave: (prefs: { analytics: boolean; functional: boolean; marketing: boolean; imageUse: boolean; communications: boolean }) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

interface Category {
  key: "analytics" | "functional" | "marketing" | "imageUse" | "communications";
  icon: React.ReactNode;
  label: string;
  description: string;
}

const CATEGORIES: Category[] = [
  {
    key: "analytics",
    icon: <BarChart2 className="w-4 h-4" />,
    label: "Cookies de desempenho",
    description: "Ajudam a entender como as pessoas usam o site — quais páginas são mais acessadas e onde podemos melhorar. Só ativados com sua autorização.",
  },
  {
    key: "functional",
    icon: <Settings className="w-4 h-4" />,
    label: "Cookies de funcionalidade",
    description: "Permitem lembrar suas escolhas de navegação, preferências e configurações para uma experiência personalizada.",
  },
  {
    key: "marketing",
    icon: <Megaphone className="w-4 h-4" />,
    label: "Cookies de marketing",
    description: "Permitem personalizar campanhas, medir resultados de comunicação e criar públicos de relacionamento, sempre respeitando suas escolhas.",
  },
  {
    key: "imageUse",
    icon: <Camera className="w-4 h-4" />,
    label: "Uso de imagem",
    description: "Autoriza o uso de fotos e vídeos seus em materiais institucionais, redes sociais, site, relatórios e campanhas do Instituto O Grito.",
  },
  {
    key: "communications",
    icon: <MessageSquare className="w-4 h-4" />,
    label: "Comunicação por WhatsApp / e-mail / SMS",
    description: "Autoriza o envio de comunicações, lembretes, campanhas, relacionamento e atualizações pelos canais informados.",
  },
];

export default function PrivacyPreferencesModal({
  open,
  currentConsent,
  onSave,
  onAcceptAll,
  onRejectAll,
  onClose,
  onNavigate,
}: Props) {
  const [analytics, setAnalytics] = useState(currentConsent?.analytics ?? false);
  const [functional, setFunctional] = useState(currentConsent?.functional ?? false);
  const [marketing, setMarketing] = useState(currentConsent?.marketing ?? false);
  const [imageUse, setImageUse] = useState(currentConsent?.imageUse ?? false);
  const [communications, setCommunications] = useState(currentConsent?.communications ?? false);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!open) return null;

  const toggleMap: Record<string, [boolean, (v: boolean) => void]> = {
    analytics: [analytics, setAnalytics],
    functional: [functional, setFunctional],
    marketing: [marketing, setMarketing],
    imageUse: [imageUse, setImageUse],
    communications: [communications, setCommunications],
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <Shield className="w-4 h-4 text-black" />
            </div>
            <h2 className="font-bold text-gray-900 text-base">Preferências de privacidade</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
          {/* Necessários — sempre ativo */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-800">Cookies necessários</span>
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                Sempre ativo
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Essenciais para autenticação, segurança, sessão e prevenção de fraude. Não podem ser desativados.
            </p>
          </div>

          {/* Categorias opcionais */}
          {CATEGORIES.map(({ key, icon, label, description }) => {
            const [value, setValue] = toggleMap[key];
            const isOpen = expanded === key;
            return (
              <div key={key} className="rounded-xl border border-gray-100 bg-white p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setExpanded(isOpen ? null : key)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    <span className="text-gray-500">{icon}</span>
                    <span className="text-sm font-semibold text-gray-800">{label}</span>
                    {isOpen ? (
                      <ChevronUp className="w-3.5 h-3.5 text-gray-400 ml-1" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
                    )}
                  </button>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={value}
                    onClick={() => setValue(!value)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full p-0.5 transition-colors ml-3 ${
                      value ? "bg-yellow-400" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                        value ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                {isOpen && (
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">{description}</p>
                )}
              </div>
            );
          })}

          <div className="flex flex-wrap gap-3 pt-1 text-xs text-gray-400">
            <button onClick={() => onNavigate("/politica-de-privacidade")} className="underline hover:text-gray-600">Política de Privacidade</button>
            <span>·</span>
            <button onClick={() => onNavigate("/politica-de-cookies")} className="underline hover:text-gray-600">Política de Cookies</button>
            <span>·</span>
            <button onClick={() => onNavigate("/politica-de-uso-de-imagem")} className="underline hover:text-gray-600">Uso de Imagem</button>
            <span>·</span>
            <button onClick={() => onNavigate("/direitos-do-titular")} className="underline hover:text-gray-600">Direitos do Titular</button>
            <span>·</span>
            <button onClick={() => onNavigate("/termos-de-uso")} className="underline hover:text-gray-600">Termos de Uso</button>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="px-5 pb-6 pt-3 border-t border-gray-100 flex-shrink-0 space-y-2">
          <button
            onClick={() => onSave({ analytics, functional, marketing, imageUse, communications })}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold text-sm py-3 rounded-xl transition-colors"
          >
            Salvar preferências
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { onAcceptAll(); onClose(); }}
              className="text-sm font-medium py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700"
            >
              Aceitar tudo
            </button>
            <button
              onClick={() => { onRejectAll(); onClose(); }}
              className="text-sm font-medium py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700"
            >
              Recusar tudo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
