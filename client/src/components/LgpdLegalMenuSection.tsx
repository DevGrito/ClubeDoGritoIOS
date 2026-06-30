import { Eye, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { openPrivacyPreferences } from "@/lib/consentManager";
import PrivacyPreferencesMenuItem from "@/components/PrivacyPreferencesMenuItem";

function MeusDadosDrawerItem({ onAfterClick }: { onAfterClick?: () => void }) {
  const [, setLocation] = useLocation();

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200"
        onClick={() => {
          onAfterClick?.();
          setLocation("/meus-dados");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onAfterClick?.();
            setLocation("/meus-dados");
          }
        }}
      >
        <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
          <Eye className="w-6 h-6 text-black" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-base">Meus dados (LGPD)</h3>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
            Consultar, exportar ou solicitar sobre seus dados
          </p>
        </div>
      </div>
      <div className="border-b border-gray-100 mx-4" />
    </div>
  );
}

/** Painel inline para Configurações (professor, monitor, coordenador, aluno). */
export function LgpdMeusDadosSettingsPanel({
  className = "",
  dark = false,
}: {
  className?: string;
  dark?: boolean;
}) {
  const [, setLocation] = useLocation();
  const border = dark ? "border-slate-600" : "border-gray-200";
  const title = dark ? "text-slate-200" : "text-gray-700";
  const muted = dark ? "text-slate-400" : "text-gray-500";
  const btnOutline = dark
    ? "border-slate-600 bg-slate-800 text-white hover:bg-slate-700"
    : "border-gray-200";

  return (
    <div className={`border rounded-lg p-4 space-y-3 ${border} ${className}`}>
      <h3 className={`font-semibold text-sm flex items-center gap-2 ${title}`}>
        <Shield className="w-4 h-4 text-yellow-600" />
        Privacidade e LGPD
      </h3>
      <p className={`text-xs leading-relaxed ${muted}`}>
        Escolha o que podemos usar sobre seus dados (cookies, comunicações e imagem).
      </p>
      <Button
        type="button"
        variant="outline"
        className={`w-full justify-start ${btnOutline}`}
        onClick={() => openPrivacyPreferences()}
      >
        <Shield className="w-4 h-4 mr-2 text-yellow-600 shrink-0" />
        Gerenciar cookies e privacidade
      </Button>
      <Button
        type="button"
        variant="ghost"
        className={`w-full justify-start text-sm ${dark ? "text-slate-200 hover:text-white hover:bg-slate-700" : "text-gray-700 hover:text-gray-900"}`}
        onClick={() => setLocation("/meus-dados")}
      >
        <Eye className="w-4 h-4 mr-2 text-yellow-600 shrink-0" />
        Meus dados (LGPD)
      </Button>
    </div>
  );
}

/** Preferências LGPD + portal do titular (drawer patrocinador, conselho…). */
export function LgpdLegalDrawerGroup({ onAfterClick }: { onAfterClick?: () => void }) {
  return (
    <>
      <PrivacyPreferencesMenuItem onAfterClick={onAfterClick} />
      <MeusDadosDrawerItem onAfterClick={onAfterClick} />
    </>
  );
}

/** Botão único para headers — abre modal Privacidade e cookies. */
export function LgpdLegalHeaderButtons({
  buttonClassName = "",
  size = "sm" as const,
  tone = "light",
}: {
  buttonClassName?: string;
  size?: "sm" | "default";
  /** `dark` = fundo escuro (headers slate); `light` = fundo claro */
  tone?: "light" | "dark";
}) {
  const toneClass =
    tone === "dark"
      ? "border-slate-500 bg-slate-800 text-white hover:bg-slate-700 hover:text-white"
      : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50";
  const cls = [toneClass, buttonClassName].filter(Boolean).join(" ");

  return (
    <Button variant="outline" size={size} className={cls} onClick={() => openPrivacyPreferences()}>
      <Shield className="w-4 h-4 mr-1 shrink-0" />
      Privacidade e cookies
    </Button>
  );
}
