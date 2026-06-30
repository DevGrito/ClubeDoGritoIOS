import { useState, useEffect } from "react";
import { X, CheckCircle2, XCircle, Loader2, BarChart2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AulaDetalhe {
  data: string;
  diaSemana: string;
  presente: boolean;
  fonte?: string | null;
  justificativa?: string | null;
}

interface FrequenciaDetalhe {
  totalAulas: number;
  presencas: number;
  ausencias: number;
  percentual: number;
  aulas: AulaDetalhe[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  nomeAluno: string;
  nomeTurma: string;
  tipo: "pec" | "inclusao";
  turmaId: string | number;
  cpf?: string;
  participanteId?: number;
}

function corFrequencia(pct: number) {
  if (pct >= 85) return { bg: "bg-green-100", text: "text-green-800", bar: "bg-green-500", label: "Boa frequência" };
  if (pct >= 60) return { bg: "bg-yellow-100", text: "text-yellow-800", bar: "bg-yellow-500", label: "Frequência regular" };
  return { bg: "bg-red-100", text: "text-red-800", bar: "bg-red-500", label: "Frequência baixa" };
}

function formatarData(data: string) {
  try {
    return new Date(data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return data;
  }
}

export function FrequenciaModal({ open, onOpenChange, nomeAluno, nomeTurma, tipo, turmaId, cpf, participanteId }: Props) {
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState<FrequenciaDetalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDados(null);
    setErro(null);
    setLoading(true);

    const params = new URLSearchParams({ tipo, turmaId: String(turmaId) });
    if (tipo === "pec" && cpf) params.set("cpf", cpf.replace(/[^0-9]/g, ""));
    if (tipo === "inclusao" && participanteId) params.set("participanteId", String(participanteId));

    fetch(`/api/frequencia/aluno?${params}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setErro(d.error);
        else setDados(d);
      })
      .catch(() => setErro("Erro ao carregar frequência"))
      .finally(() => setLoading(false));
  }, [open, tipo, turmaId, cpf, participanteId]);

  const cores = dados ? corFrequencia(dados.percentual) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <BarChart2 className="w-4 h-4 text-blue-500" />
            Frequência do Aluno
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0 gap-4">
          {/* Aluno / Turma info */}
          <div>
            <p className="font-semibold text-gray-900 text-sm">{nomeAluno}</p>
            <p className="text-xs text-gray-500">{nomeTurma}</p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-10 gap-3 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Carregando...</span>
            </div>
          )}

          {erro && (
            <div className="flex items-center gap-2 text-red-600 text-sm py-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {erro}
            </div>
          )}

          {dados && !loading && (
            <>
              {/* Percentual em destaque */}
              {dados.totalAulas === 0 ? (
                <div className="bg-gray-50 rounded-xl p-5 text-center border border-dashed border-gray-200">
                  <p className="text-gray-400 text-sm">Nenhuma aula registrada para esta turma ainda.</p>
                </div>
              ) : (
                <div className={`rounded-xl p-5 ${cores!.bg}`}>
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <p className={`text-4xl font-extrabold ${cores!.text}`}>{dados.percentual}%</p>
                      <p className={`text-xs font-medium mt-0.5 ${cores!.text}`}>{cores!.label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-700">{dados.presencas}<span className="text-base font-normal text-gray-400">/{dados.totalAulas}</span></p>
                      <p className="text-xs text-gray-500">aulas presentes</p>
                    </div>
                  </div>
                  {/* Barra de progresso */}
                  <div className="w-full bg-white/60 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${cores!.bar}`}
                      style={{ width: `${dados.percentual}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1.5">
                    <span>{dados.presencas} presente{dados.presencas !== 1 ? "s" : ""}</span>
                    <span>{dados.ausencias} ausente{dados.ausencias !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              )}

              {/* Lista de aulas */}
              {dados.aulas.length > 0 && (
                <div className="flex-1 overflow-y-auto border rounded-lg divide-y">
                  {dados.aulas.map((aula, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                      {aula.presente ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-800">{formatarData(aula.data)}</span>
                        <span className="text-xs text-gray-400 ml-2">{aula.diaSemana}</span>
                        {aula.justificativa && (
                          <p className="text-xs text-blue-600 mt-0.5 truncate">{aula.justificativa}</p>
                        )}
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${aula.presente ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {aula.presente ? "Presente" : "Ausente"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
