import { Shield } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { openPrivacyPreferences } from "@/lib/consentManager";

export function PrivacyPreferencesDropdownItem({ onAfterClick }: { onAfterClick?: () => void }) {
  return (
    <DropdownMenuItem
      onClick={() => {
        openPrivacyPreferences();
        onAfterClick?.();
      }}
      className="cursor-pointer"
    >
      <Shield className="w-4 h-4 mr-2 text-yellow-600" />
      Privacidade e cookies
    </DropdownMenuItem>
  );
}

type Variant = "drawer" | "dropdown" | "sidebar";

interface Props {
  variant?: Variant;
  onAfterClick?: () => void;
  className?: string;
}

/** Item reutilizável para menus — abre o modal de preferências LGPD/cookies. */
export default function PrivacyPreferencesMenuItem({
  variant = "drawer",
  onAfterClick,
  className = "",
}: Props) {
  const handleClick = () => {
    openPrivacyPreferences();
    onAfterClick?.();
  };

  if (variant === "dropdown") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${className}`}
      >
        <Shield className="w-4 h-4 mr-2 text-yellow-600" />
        Privacidade e cookies
      </button>
    );
  }

  if (variant === "sidebar") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors text-left ${className}`}
      >
        <Shield className="w-4 h-4 text-yellow-600 shrink-0" />
        Privacidade e cookies
      </button>
    );
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        className={`flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 ${className}`}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
          <Shield className="w-6 h-6 text-black" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-base">Privacidade e cookies</h3>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
            Preferências, cookies e leitura dos documentos legais
          </p>
        </div>
      </div>
      <div className="border-b border-gray-100 mx-4" />
    </div>
  );
}
