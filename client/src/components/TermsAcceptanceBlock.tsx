import { Shield } from "lucide-react";
import ConsentCheckbox from "./ConsentCheckbox";

export type AcceptanceArea = "events" | "students" | "employees" | "sponsors" | "council" | "donors";

export interface TermsState {
  termsAccepted: boolean;
  marketingAccepted: boolean;
  imageAccepted: boolean;
  guardianDeclared: boolean;
  communicationsAccepted: boolean;
}

interface Props {
  area: AcceptanceArea;
  state: TermsState;
  onChange: (state: TermsState) => void;
  onNavigate: (path: string) => void;
  showImageConsent?: boolean;
  showMarketingConsent?: boolean;
  showGuardianConsent?: boolean;
  showCommunicationsConsent?: boolean;
}

const AREA_CONFIG: Record<
  AcceptanceArea,
  { title: string; notice: string; termsLabel: React.ReactNode }
> = {
  events: {
    title: "Privacidade no evento",
    notice:
      "Usaremos seus dados para processar sua inscrição, emitir ingresso, confirmar presença, enviar informações sobre o evento e cumprir obrigações legais e de segurança.",
    termsLabel: (
      <>Li e aceito os <strong>Termos de Uso</strong> e a <strong>Política de Privacidade</strong>.</>
    ),
  },
  students: {
    title: "Privacidade de alunos e responsáveis",
    notice:
      "Os dados de alunos e responsáveis são utilizados para matrícula, controle de presença, segurança, acompanhamento das atividades, prestação de contas e comunicação com as famílias.",
    termsLabel: (
      <>Li e aceito a <strong>Política de Privacidade</strong> e os <strong>Termos de Uso</strong>.</>
    ),
  },
  employees: {
    title: "Privacidade e responsabilidade no uso interno",
    notice:
      "Ao acessar o sistema, você se compromete a utilizar os dados apenas para finalidades institucionais, respeitando a confidencialidade das informações de alunos, responsáveis, doadores, parceiros e projetos. O acesso é pessoal, intransferível e registrado para fins de segurança e auditoria.",
    termsLabel: (
      <>Li e aceito os <strong>Termos de Uso Interno</strong>, a <strong>Política de Privacidade</strong> e as regras de confidencialidade.</>
    ),
  },
  sponsors: {
    title: "Privacidade para patrocinadores",
    notice:
      "Os dados de representantes de patrocinadores são utilizados para relacionamento institucional, acesso a relatórios, prestação de contas e gestão da parceria. Os relatórios priorizam dados agregados.",
    termsLabel: (
      <>Li e aceito a <strong>Política de Privacidade</strong> e os <strong>Termos de Uso</strong> da área de patrocinadores.</>
    ),
  },
  council: {
    title: "Privacidade e confidencialidade para o conselho",
    notice:
      "Ao acessar a área do conselho, você se compromete a utilizar as informações apenas para fins de governança, acompanhamento institucional e prestação de contas. Dados, documentos e relatórios devem ser tratados com total confidencialidade.",
    termsLabel: (
      <>Li e aceito os <strong>Termos de Uso</strong>, a <strong>Política de Privacidade</strong> e o compromisso de confidencialidade.</>
    ),
  },
  donors: {
    title: "Privacidade para doadores",
    notice:
      "Seus dados são utilizados para processar sua doação, emitir recibo, comunicar o impacto do seu apoio e cumprir obrigações legais. Não compartilhamos seus dados com terceiros sem sua autorização.",
    termsLabel: (
      <>Li e aceito os <strong>Termos de Uso</strong> e a <strong>Política de Privacidade</strong>.</>
    ),
  },
};

export default function TermsAcceptanceBlock({
  area,
  state,
  onChange,
  onNavigate,
  showImageConsent = false,
  showMarketingConsent = true,
  showGuardianConsent = false,
  showCommunicationsConsent = false,
}: Props) {
  const config = AREA_CONFIG[area];
  const update = (key: keyof TermsState, value: boolean) =>
    onChange({ ...state, [key]: value });

  return (
    <div
      className="rounded-xl border border-gray-100 bg-white overflow-hidden"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-yellow-50 flex items-center gap-2">
        <div className="w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
          <Shield className="w-3.5 h-3.5 text-black" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">{config.title}</h3>
      </div>

      <div className="px-5 py-4 space-y-3">
        {/* Notice */}
        <p className="text-xs text-gray-600 leading-relaxed">{config.notice}</p>

        <div className="space-y-2.5 pt-1">
          {/* Guardian declaration (for students with minors) */}
          {showGuardianConsent && (
            <ConsentCheckbox
              id={`${area}-guardian`}
              checked={state.guardianDeclared}
              onChange={(v) => update("guardianDeclared", v)}
              required
            >
              Declaro que sou <strong>responsável legal</strong> pelo aluno ou tenho autorização para realizar este cadastro.
            </ConsentCheckbox>
          )}

          {/* Mandatory terms */}
          <ConsentCheckbox
            id={`${area}-terms`}
            checked={state.termsAccepted}
            onChange={(v) => update("termsAccepted", v)}
            required
          >
            {config.termsLabel}{" "}
            <button
              type="button"
              onClick={() => onNavigate("/politica-de-privacidade")}
              className="underline text-gray-500 hover:text-gray-700"
            >
              Política de Privacidade
            </button>{" "}
            ·{" "}
            <button
              type="button"
              onClick={() => onNavigate("/termos-de-uso")}
              className="underline text-gray-500 hover:text-gray-700"
            >
              Termos de Uso
            </button>
          </ConsentCheckbox>

          {/* Optional communications */}
          {showCommunicationsConsent && (
            <ConsentCheckbox
              id={`${area}-comms`}
              checked={state.communicationsAccepted}
              onChange={(v) => update("communicationsAccepted", v)}
            >
              Aceito receber comunicações por WhatsApp, e-mail ou telefone sobre atividades, horários, avisos e informações do projeto.
            </ConsentCheckbox>
          )}

          {/* Optional marketing */}
          {showMarketingConsent && (
            <ConsentCheckbox
              id={`${area}-marketing`}
              checked={state.marketingAccepted}
              onChange={(v) => update("marketingAccepted", v)}
            >
              Aceito receber comunicações do Instituto O Grito sobre eventos, campanhas e novidades.
            </ConsentCheckbox>
          )}

          {/* Optional image use */}
          {showImageConsent && (
            <ConsentCheckbox
              id={`${area}-image`}
              checked={state.imageAccepted}
              onChange={(v) => update("imageAccepted", v)}
            >
              Autorizo o uso da minha imagem em registros institucionais (fotos, vídeos, redes sociais, site, relatórios e campanhas do Instituto O Grito).{" "}
              <button
                type="button"
                onClick={() => onNavigate("/politica-de-uso-de-imagem")}
                className="underline text-gray-500 hover:text-gray-700"
              >
                Política de Uso de Imagem
              </button>
            </ConsentCheckbox>
          )}
        </div>

        <p className="text-xs text-gray-400 pt-1">
          <span className="text-red-500 font-bold">*</span> Campo obrigatório. Os itens sem asterisco são opcionais.
        </p>
      </div>
    </div>
  );
}
