import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  modoHistorico: boolean;
  pendentesCount: number;
  onNovaChamada: () => void;
  onVerHistorico: () => void;
  onVerPendentes: () => void;
};

export function ChamadaPresencaNavButtons({
  modoHistorico,
  pendentesCount,
  onNovaChamada,
  onVerHistorico,
  onVerPendentes,
}: Props) {
  if (modoHistorico) {
    return (
      <Button variant="outline" onClick={onNovaChamada}>
        <Clock className="w-4 h-4 mr-2" />
        Nova Chamada
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      <button
        type="button"
        onClick={onVerPendentes}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors",
          "bg-white border-gray-200 text-amber-900 hover:bg-amber-50 shadow-sm"
        )}
      >
        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
        Pendentes
        {pendentesCount > 0 && (
          <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
            {pendentesCount}
          </span>
        )}
      </button>
      <Button variant="outline" onClick={onVerHistorico}>
        <Clock className="w-4 h-4 mr-2" />
        Ver Histórico
      </Button>
    </div>
  );
}
