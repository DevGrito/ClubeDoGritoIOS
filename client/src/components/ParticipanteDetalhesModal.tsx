import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, Edit } from "lucide-react";
import { AtendidoGritoHistorico } from "@/components/atendidos-grito/AtendidoGritoHistorico";
import { formatEnumLabel } from "@/lib/labelEnums";

function normalizeValue(val: string | null | undefined): string | undefined {
  if (val === null || val === undefined || val === "") return undefined;
  const formatted = formatEnumLabel(val, "");
  return formatted || undefined;
}

export interface DetalhesField {
  label: string;
  value: string | null | undefined;
  fullWidth?: boolean;
}

export interface DetalhesSection {
  title: string;
  icon: React.ElementType;
  fields: DetalhesField[];
  cols?: 2 | 3 | 4;
  extra?: React.ReactNode;
}

interface ParticipanteDetalhesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  loading: boolean;
  color: "orange" | "blue" | "green";
  foto?: string | null;
  nome?: string;
  cpf?: string;
  status?: string;
  sections?: DetalhesSection[];
  extraSections?: React.ReactNode;
  documentosPanel?: React.ReactNode;
  onEdit?: () => void;
  editLabel?: string;
  /** CPF com 11 dígitos para o histórico unificado (se omitido, extrai do prop `cpf`) */
  historicoCpf?: string;
  historicoParticipanteId?: number | null;
}

const colorMap = {
  orange: {
    heading: "text-orange-600",
    avatar: "bg-orange-100",
    icon: "text-orange-500",
    border: "border-orange-200",
    spinner: "border-orange-500",
    button: "bg-orange-500 hover:bg-orange-600",
  },
  blue: {
    heading: "text-blue-600",
    avatar: "bg-blue-100",
    icon: "text-blue-500",
    border: "border-blue-200",
    spinner: "border-blue-500",
    button: "bg-blue-500 hover:bg-blue-600",
  },
  green: {
    heading: "text-green-600",
    avatar: "bg-green-100",
    icon: "text-green-500",
    border: "border-green-200",
    spinner: "border-green-500",
    button: "bg-green-500 hover:bg-green-600",
  },
};

export function ParticipanteDetalhesModal({
  open,
  onOpenChange,
  title = "Detalhes Completos",
  loading,
  color,
  foto,
  nome,
  cpf,
  status,
  sections = [],
  extraSections,
  documentosPanel,
  onEdit,
  editLabel = "Editar",
  historicoCpf,
  historicoParticipanteId,
}: ParticipanteDetalhesModalProps) {
  const c = colorMap[color];
  const isAtivo = !status || status === "ativo" || status === "Ativo";
  const cpfHistorico = String(historicoCpf || cpf || "").replace(/\D/g, "");

  const gridCols = (cols?: 2 | 3 | 4) => {
    if (cols === 4) return "grid-cols-2 md:grid-cols-4";
    if (cols === 2) return "grid-cols-1 md:grid-cols-2";
    return "grid-cols-2 md:grid-cols-3";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className={`animate-spin w-8 h-8 border-4 ${c.spinner} border-t-transparent rounded-full`} />
            <span className="ml-3">Carregando dados...</span>
          </div>
        ) : (
          <div className="space-y-6">
            <div className={`flex items-center gap-4 pb-4 border-b`}>
              {foto && foto.trim() ? (
                <img
                  src={foto}
                  alt={nome}
                  className={`w-24 h-24 rounded-full object-cover border-2 ${c.border}`}
                />
              ) : (
                <div className={`w-24 h-24 rounded-full ${c.avatar} flex items-center justify-center`}>
                  <User className={`w-12 h-12 ${c.icon}`} />
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold">{nome || "-"}</h3>
                {cpf && <p className="text-gray-500">CPF: {cpf}</p>}
                <p className={`text-sm ${isAtivo ? "text-green-500" : "text-red-500"}`}>
                  Status: {isAtivo ? "Ativo" : "Inativo"}
                </p>
              </div>
            </div>

            {sections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <div key={idx}>
                  <h4 className={`font-semibold ${c.heading} mb-3 flex items-center gap-2`}>
                    <Icon className="w-4 h-4" /> {section.title}
                  </h4>
                  <div className={`grid ${gridCols(section.cols)} gap-4 bg-gray-50 p-4 rounded-lg`}>
                    {section.fields.map((field, fi) => (
                      <div key={fi} className={field.fullWidth ? "col-span-full" : ""}>
                        <label className="text-xs font-medium text-gray-500">{field.label}</label>
                        <p className="text-sm">{normalizeValue(field.value) || "-"}</p>
                      </div>
                    ))}
                  </div>
                  {section.extra && <div className="mt-3">{section.extra}</div>}
                </div>
              );
            })}

            {extraSections}

            {documentosPanel && (
              <div>
                <h4 className={`font-semibold ${c.heading} mb-3 flex items-center gap-2`}>
                  Documentos
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  {documentosPanel}
                </div>
              </div>
            )}

            {cpfHistorico.length === 11 && (
              <AtendidoGritoHistorico
                cpf={cpfHistorico}
                nomeAluno={nome}
                participanteId={historicoParticipanteId ?? undefined}
              />
            )}

            <div className="flex gap-2 pt-4 border-t">
              {onEdit && (
                <Button
                  className={`flex-1 ${c.button}`}
                  onClick={onEdit}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {editLabel}
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
