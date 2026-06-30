import { useState, useEffect, useCallback } from "react";
import { Shield, CheckCircle } from "lucide-react";
import { TERMS_VERSION, savePrivacyConsent } from "@/hooks/usePrivacyConsent";
import type { ConsentArea } from "@/hooks/usePrivacyConsent";
import logoPath from "../app-assets/Logo_Clube_Do_grito.png";

const CONSENT_KEY = (area: string) => `clube_grito_area_consent_${area}`;

/** Cache local — não é fonte de verdade (usar useAreaConsentReady). */
export function checkAreaConsentLocal(area: string): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_KEY(area));
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed.version === TERMS_VERSION;
  } catch {
    return false;
  }
}

/** @deprecated Use useAreaConsentReady — mantido para compatibilidade. */
export function checkAreaConsent(area: string): boolean {
  return checkAreaConsentLocal(area);
}

function saveAreaConsent(area: string, extras: Record<string, boolean>) {
  try {
    localStorage.setItem(
      CONSENT_KEY(area),
      JSON.stringify({ version: TERMS_VERSION, acceptedAt: new Date().toISOString(), ...extras })
    );
  } catch {}
}

interface AreaConfig {
  title: string;
  notice: string;
  mandatoryLabel: React.ReactNode;
  optionals?: { key: string; label: string }[];
  consentArea: ConsentArea;
}

export const AREA_CONSENT_CONFIGS = {
  employees: {
    title: "Privacidade e responsabilidade no uso interno",
    notice:
      "Ao acessar o sistema, você se compromete a utilizar os dados disponíveis apenas para finalidades institucionais, respeitando a confidencialidade das informações de alunos, responsáveis, doadores, parceiros e projetos. O acesso é pessoal, intransferível e registrado para fins de segurança e auditoria.",
    mandatoryLabel: (
      <>
        Li e aceito os <strong>Termos de Uso Interno</strong>, a{" "}
        <strong>Política de Privacidade</strong> e as regras de{" "}
        <strong>confidencialidade</strong> no tratamento de dados.
      </>
    ),
    optionals: [
      {
        key: "imageUse",
        label: "Autorizo o uso da minha imagem em materiais institucionais do Instituto O Grito.",
      },
    ],
    consentArea: "employees",
  },
  council: {
    title: "Privacidade e confidencialidade para o conselho",
    notice:
      "Ao acessar a área do conselho, você se compromete a utilizar as informações disponíveis apenas para fins de governança, acompanhamento institucional, prestação de contas e tomada de decisão. Dados pessoais, informações estratégicas, documentos internos e relatórios devem ser tratados com total confidencialidade.",
    mandatoryLabel: (
      <>
        Li e aceito os <strong>Termos de Uso</strong>, a{" "}
        <strong>Política de Privacidade</strong> e o{" "}
        <strong>compromisso de confidencialidade</strong> da área do conselho.
      </>
    ),
    consentArea: "council",
  },
  sponsors: {
    title: "Privacidade para patrocinadores",
    notice:
      "Os dados de representantes de patrocinadores são utilizados para relacionamento institucional, acesso a relatórios, prestação de contas, comunicação sobre projetos apoiados e gestão da parceria. Os relatórios priorizam dados agregados e evitam exposição desnecessária de dados pessoais de beneficiários.",
    mandatoryLabel: (
      <>
        Li e aceito a <strong>Política de Privacidade</strong> e os{" "}
        <strong>Termos de Uso</strong> da área de patrocinadores.
      </>
    ),
    optionals: [
      {
        key: "marketing",
        label:
          "Aceito receber comunicações institucionais, convites, campanhas e atualizações do Instituto O Grito.",
      },
    ],
    consentArea: "sponsors",
  },
  donors: {
    title: "Privacidade para doadores",
    notice:
      "Seus dados são utilizados para gestão da doação, emissão de comprovantes, comunicação sobre o impacto das contribuições, benefícios do clube e prestação de contas dos projetos apoiados. Você controla quais comunicações opcionais deseja receber.",
    mandatoryLabel: (
      <>
        Li e aceito a <strong>Política de Privacidade</strong> e os{" "}
        <strong>Termos de Uso</strong> do Clube do Grito.
      </>
    ),
    optionals: [
      {
        key: "marketing",
        label:
          "Aceito receber novidades, campanhas e convites do Instituto O Grito por e-mail ou outros canais.",
      },
      {
        key: "communications",
        label:
          "Aceito receber comunicações sobre minha doação, benefícios e atualizações do clube.",
      },
    ],
    consentArea: "donors",
  },
  students: {
    title: "Privacidade de alunos e responsáveis",
    notice:
      "Os dados de alunos e responsáveis são utilizados para matrícula, organização das turmas, controle de presença, segurança, acompanhamento das atividades, prestação de contas dos projetos e comunicação com as famílias.",
    mandatoryLabel: (
      <>
        Li e aceito a <strong>Política de Privacidade</strong> e os{" "}
        <strong>Termos de Uso</strong>.
      </>
    ),
    optionals: [
      {
        key: "communications",
        label:
          "Aceito receber comunicações por WhatsApp, e-mail ou telefone sobre atividades, horários, avisos e informações do projeto.",
      },
      {
        key: "imageUse",
        label:
          "Autorizo o uso de imagem do aluno em registros institucionais, redes sociais, site, relatórios e campanhas do Instituto O Grito.",
      },
    ],
    consentArea: "students",
  },
} as const;

const CONFIGS = AREA_CONSENT_CONFIGS;

export type AreaConsentKey = keyof typeof AREA_CONSENT_CONFIGS;

/** Consulta servidor como fonte de verdade; localStorage é cache. */
export function useAreaConsentReady(
  areaKey: AreaConsentKey,
  options?: { enabled?: boolean }
) {
  const config = CONFIGS[areaKey];
  const enabled = options?.enabled !== false;
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      setReady(true);
      setChecking(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(
          `/api/privacy/consent/area-status?area=${encodeURIComponent(config.consentArea)}`,
          { credentials: "include", cache: "no-store" }
        );
        if (cancelled) return;

        if (res.ok) {
          const data = (await res.json()) as { accepted?: boolean };
          if (data.accepted) {
            if (!checkAreaConsentLocal(areaKey)) saveAreaConsent(areaKey, {});
            setReady(true);
          } else {
            setReady(false);
          }
        } else {
          // Sem confirmação do servidor — não confiar em cache local
          setReady(false);
        }
      } catch {
        if (!cancelled) setReady(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [areaKey, config.consentArea, enabled]);

  const markReady = useCallback(() => setReady(true), []);

  return { ready, checking, markReady, consentArea: config.consentArea };
}

export function AreaConsentLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
    </div>
  );
}

interface Props {
  area: AreaConsentKey;
  onAccept: () => void;
  onNavigate: (path: string) => void;
}

export default function AreaConsentGate({ area, onAccept, onNavigate }: Props) {
  const config = CONFIGS[area];
  const [mandatoryChecked, setMandatoryChecked] = useState(false);
  const [optionals, setOptionals] = useState<Record<string, boolean>>(
    Object.fromEntries((config.optionals || []).map((o) => [o.key, false]))
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!mandatoryChecked) return;
    setSaving(true);
    setSaveError(null);
    try {
      await savePrivacyConsent({
        consentArea: config.consentArea,
        preferences: {
          necessary: true,
          marketing: optionals.marketing ?? false,
          imageUse: optionals.imageUse ?? false,
          communications: optionals.communications ?? false,
        },
        source: `area_gate_${area}`,
      });
      saveAreaConsent(area, { ...optionals });
      onAccept();
    } catch {
      setSaveError(
        "Não foi possível registrar o aceite no servidor. Verifique sua conexão e tente novamente."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white"
      style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      <div className="w-full max-w-md mx-auto px-5 py-8 flex flex-col items-center gap-5">
        <img src={logoPath} alt="Clube do Grito" className="h-16 w-16 object-contain rounded-full" />

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <Shield className="w-4 h-4 text-black" />
            </div>
            <h1 className="text-base font-bold text-gray-900">{config.title}</h1>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed text-left">{config.notice}</p>
        </div>

        <div className="w-full bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-3">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={mandatoryChecked}
              onChange={(e) => setMandatoryChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-yellow-400 flex-shrink-0"
            />
            <span className="text-xs text-gray-700 leading-relaxed">
              <span className="text-red-500 font-bold mr-0.5">*</span>
              {config.mandatoryLabel}
            </span>
          </label>

          {(config.optionals || []).map((opt) => (
            <label key={opt.key} className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={optionals[opt.key] ?? false}
                onChange={(e) => setOptionals((prev) => ({ ...prev, [opt.key]: e.target.checked }))}
                className="mt-0.5 w-4 h-4 rounded accent-yellow-400 flex-shrink-0"
              />
              <span className="text-xs text-gray-700 leading-relaxed">{opt.label}</span>
            </label>
          ))}

          <p className="text-xs text-gray-400 pt-1">
            <span className="text-red-500 font-bold">*</span> Obrigatório para acessar esta área.
          </p>
          {saveError && (
            <p className="text-xs text-red-600 text-center pt-1">{saveError}</p>
          )}
        </div>

        <button
          onClick={handleAccept}
          disabled={!mandatoryChecked || saving}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all bg-yellow-400 hover:bg-yellow-500 text-black disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          <CheckCircle className="w-4 h-4" />
          {saving ? "Salvando..." : "Aceitar e continuar"}
        </button>

        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => onNavigate("/politica-de-privacidade")}
            className="text-xs text-gray-400 underline hover:text-gray-600"
          >
            Política de Privacidade
          </button>
          <span className="text-gray-300 text-xs">·</span>
          <button
            onClick={() => onNavigate("/termos-de-uso")}
            className="text-xs text-gray-400 underline hover:text-gray-600"
          >
            Termos de Uso
          </button>
          <span className="text-gray-300 text-xs">·</span>
          <button
            onClick={() => onNavigate("/direitos-do-titular")}
            className="text-xs text-gray-400 underline hover:text-gray-600"
          >
            Direitos do Titular
          </button>
        </div>
      </div>
    </div>
  );
}
