import { MapPin, Pencil, Phone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MoradaContatoParticipante, resolveMoradaContato } from "@/lib/moradaContato";

type Props = {
  item: Record<string, unknown>;
  participantes?: MoradaContatoParticipante[];
  getStatusLabel: (status: string) => string;
  monitorNome?: string;
  onEdit: (item: Record<string, unknown>) => void;
  onDelete: (id: number) => void;
  deletePending?: boolean;
};

export function MoradaReformaCard({
  item,
  participantes = [],
  getStatusLabel,
  monitorNome,
  onEdit,
  onDelete,
  deletePending,
}: Props) {
  const contato = resolveMoradaContato(item, participantes);
  const nome = String(item.participanteNome || item.participante_nome || "");
  const status = String(item.status || "");
  const data = String(item.data || "");
  const semana = item.semana;

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gradient-to-br from-white to-gray-50/80 shadow-sm">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="font-medium text-sm text-gray-800">{nome}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{semana}° Semana</span>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(item)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-red-600 hover:text-red-700"
            disabled={deletePending}
            onClick={() => onDelete(Number(item.id))}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-1">
        {monitorNome ? `${monitorNome} • ` : ""}
        {data ? new Date(data + "T12:00:00").toLocaleDateString("pt-BR") : "—"} • {getStatusLabel(status)}
      </p>

      <p className="text-xs text-gray-600 mt-1">Cômodos: {((item.comodos as string[]) || []).join(", ") || "—"}</p>

      <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
        <p className="text-xs text-gray-600 flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-purple-500 shrink-0" />
          <span className="font-medium text-gray-500">Telefone:</span>
          <span>{contato.telefone || "Não informado"}</span>
        </p>
        <p className="text-xs text-gray-600 flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
          <span className="font-medium text-gray-500 shrink-0">Endereço:</span>
          <span className="leading-snug">{contato.endereco || "Não informado"}</span>
        </p>
      </div>

      {item.observacoes ? (
        <p className="text-xs text-gray-700 mt-2 pt-2 border-t border-gray-100">{String(item.observacoes)}</p>
      ) : null}
    </div>
  );
}
