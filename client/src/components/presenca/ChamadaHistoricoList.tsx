import { useState } from "react";
import { Calendar, ChevronDown, ChevronUp, Filter, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toYMDString } from "@/lib/class-days";

export interface ChamadaHistoricoRegistro {
  id: string | number;
  data?: string;
  dataAtividade?: string;
  turmaNome?: string;
  turma?: string;
  grupo?: string;
  totalPresentes?: number;
  totalAlunos?: number;
  presencas?: Array<{
    nome?: string;
    alunoNome?: string;
    presente?: boolean;
    justificativa?: string;
    justificativaMotivo?: string;
  }>;
  teveAlimentacao?: boolean | null;
}

interface Props {
  registros: ChamadaHistoricoRegistro[];
  loading?: boolean;
  emptyMessage?: string;
}

const normalizeToYMD = toYMDString;

export default function ChamadaHistoricoList({
  registros,
  loading = false,
  emptyMessage = "Nenhuma chamada registrada ainda.",
}: Props) {
  const [expandido, setExpandido] = useState<string | number | null>(null);
  const [soFaltasMap, setSoFaltasMap] = useState<Record<string | number, boolean>>({});

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Carregando histórico...</div>;
  }

  if (registros.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {registros.map((registro) => {
        const presentes = registro.totalPresentes ?? 0;
        const total = registro.totalAlunos ?? presentes;
        const dataAtividade = normalizeToYMD(registro.dataAtividade || registro.data);
        const presencas = registro.presencas || [];

        return (
          <div key={registro.id} className="border rounded-lg overflow-hidden">
            <div
              className="p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
              onClick={() => setExpandido(expandido === registro.id ? null : registro.id)}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="font-medium text-sm shrink-0">
                    {dataAtividade
                      ? new Date(dataAtividade + "T12:00:00").toLocaleDateString("pt-BR")
                      : "Sem data"}
                  </span>
                  <span className="text-gray-400 text-sm shrink-0">-</span>
                  <span className="text-sm truncate">
                    {registro.turmaNome || registro.turma || registro.grupo}
                  </span>
                </div>
                {expandido === registro.id ? (
                  <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-green-600 font-medium">
                  {presentes}/{total} presentes
                </span>
                {registro.teveAlimentacao === true && (
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                    <Utensils className="w-3 h-3 mr-1" />
                    Alimentação
                  </Badge>
                )}
              </div>
            </div>

            {expandido === registro.id && presencas.length > 0 && (
              <div className="p-3 border-t bg-white">
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <div className="text-sm font-medium text-gray-600">
                    Lista ({presencas.length} participantes):
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSoFaltasMap((prev) => ({ ...prev, [registro.id]: !prev[registro.id] }))
                    }
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors shrink-0 ${
                      soFaltasMap[registro.id]
                        ? "bg-red-100 text-red-700 border-red-300 font-semibold"
                        : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    <Filter className="w-3 h-3" />
                    {soFaltasMap[registro.id] ? "Ver todos" : "Só faltas"}
                  </button>
                </div>
                <div className="grid gap-1.5">
                  {[...presencas]
                    .sort((a, b) =>
                      (a.alunoNome || a.nome || "").localeCompare(b.alunoNome || b.nome || "", "pt-BR")
                    )
                    .filter((p) => (soFaltasMap[registro.id] ? !p.presente : true))
                    .map((p, idx) => {
                      const justif = p.justificativa || p.justificativaMotivo;
                      const isFaltaJustificada =
                        !p.presente && justif && justif !== "Sem justificativa";
                      return (
                        <div
                          key={idx}
                          className={`flex items-start justify-between py-1.5 px-2 rounded text-sm ${
                            p.presente
                              ? "bg-green-50"
                              : isFaltaJustificada
                                ? "bg-yellow-50"
                                : "bg-red-50"
                          }`}
                        >
                          <span className="font-medium">{p.alunoNome || p.nome}</span>
                          <div className="flex flex-col items-end gap-0.5 ml-2 shrink-0">
                            <span
                              className={`text-xs font-semibold ${
                                p.presente
                                  ? "text-green-700"
                                  : isFaltaJustificada
                                    ? "text-yellow-700"
                                    : "text-red-700"
                              }`}
                            >
                              {p.presente
                                ? "Presente"
                                : isFaltaJustificada
                                  ? "Falta Justificada"
                                  : "Falta"}
                            </span>
                            {!p.presente && justif && (
                              <span className="text-xs text-gray-500">{justif}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  {soFaltasMap[registro.id] &&
                    presencas.filter((p) => !p.presente).length === 0 && (
                      <div className="text-center py-3 text-sm text-gray-500">
                        Nenhuma falta registrada nesta aula.
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
