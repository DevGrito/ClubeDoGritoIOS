import React, { useMemo, useState } from "react";
import { ClipboardList, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  type RelatorioAulaTab,
  buildRelatorioLista,
  countPlanosPendentes,
  collectProfessoresRelatorio,
  collectTurmasRelatorio,
  filterAulasFeitas,
  statusAulaBadgeClass,
  statusAulaLabel,
} from "@/lib/relatorio-aula-coord";

type Vertente = "inclusao" | "pec";

const theme = {
  inclusao: {
    icon: "text-blue-600",
    tabTodos: "bg-blue-600 text-white border-blue-600",
    tabFeitos: "bg-green-500 text-white border-green-500",
    prof: "text-blue-600",
    hoverBorder: "hover:border-blue-400",
    ring: "focus:ring-blue-500",
    fotoBtn: "border-blue-300 text-blue-600 hover:bg-blue-50",
    spinner: "text-blue-600",
  },
  pec: {
    icon: "text-teal-600",
    tabTodos: "bg-teal-600 text-white border-teal-600",
    tabFeitos: "bg-green-500 text-white border-green-500",
    prof: "text-teal-600 font-medium",
    hoverBorder: "hover:border-teal-400",
    ring: "focus:ring-teal-500",
    fotoBtn: "border-teal-300 text-teal-600 hover:bg-teal-50",
    spinner: "text-teal-600",
  },
} as const;

export interface RelatoriosAulasProfessoresSectionProps {
  vertente: Vertente;
  title: string;
  subtitle: string;
  planos: unknown[];
  aulas: unknown[];
  loadingPlanos: boolean;
  loadingAulas: boolean;
  onBack: () => void;
  fotoSignedUrlBase: string;
}

export default function RelatoriosAulasProfessoresSection({
  vertente,
  title,
  subtitle,
  planos,
  aulas,
  loadingPlanos,
  loadingAulas,
  onBack,
  fotoSignedUrlBase,
}: RelatoriosAulasProfessoresSectionProps) {
  const t = theme[vertente];
  const [tab, setTab] = useState<RelatorioAulaTab>("todos");
  const [texto, setTexto] = useState("");
  const [professor, setProfessor] = useState("");
  const [turma, setTurma] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [detalhe, setDetalhe] = useState<Record<string, unknown> | null>(null);
  const [fotoModal, setFotoModal] = useState<string | null>(null);
  const [fotoLoading, setFotoLoading] = useState(false);

  const filtros = useMemo(
    () => ({ texto, professor, turma, dataInicio, dataFim }),
    [texto, professor, turma, dataInicio, dataFim]
  );

  const pendentesCount = useMemo(() => countPlanosPendentes(planos), [planos]);
  const feitosCount = useMemo(() => (aulas as unknown[]).length, [aulas]);
  const todosCount = pendentesCount + feitosCount;

  const lista = useMemo(
    () => buildRelatorioLista(tab, planos, aulas, filtros),
    [tab, planos, aulas, filtros]
  );

  const professores = useMemo(() => collectProfessoresRelatorio(planos, aulas), [planos, aulas]);
  const turmas = useMemo(() => collectTurmasRelatorio(planos, aulas), [planos, aulas]);

  const loading = tab === "pendentes" ? loadingPlanos : loadingPlanos || loadingAulas;

  const tabBtnClass = (s: RelatorioAulaTab) => {
    const active = tab === s;
    if (!active) return "bg-white text-gray-600 border-gray-300 hover:border-blue-400";
    if (s === "pendentes") return "bg-orange-500 text-white border-orange-500";
    if (s === "feitos") return t.tabFeitos;
    return t.tabTodos;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className={`w-6 h-6 ${t.icon}`} />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-gray-500 text-sm">{subtitle}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onBack} className="border-gray-200 text-gray-600 hover:bg-gray-100">
          ← Voltar
        </Button>
      </div>

      {!detalhe && (
        <div className="flex gap-2 flex-wrap">
          {(["todos", "feitos", "pendentes"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setTab(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${tabBtnClass(s)}`}
            >
              {s === "todos" ? `Todos (${todosCount})` : s === "feitos" ? `Feitos (${feitosCount})` : `Pendentes (${pendentesCount})`}
            </button>
          ))}
        </div>
      )}

      {!detalhe && (
        <div className="flex gap-2 flex-wrap items-center">
          <Input
            placeholder="Buscar por título..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 flex-1 min-w-[140px]"
          />
          <select
            value={professor}
            onChange={(e) => setProfessor(e.target.value)}
            className={`border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 ${t.ring} min-w-[140px]`}
          >
            <option value="">Todos os professores</option>
            {professores.map((prof) => (
              <option key={prof} value={prof}>
                {prof}
              </option>
            ))}
          </select>
          <select
            value={turma}
            onChange={(e) => setTurma(e.target.value)}
            className={`border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 ${t.ring} min-w-[140px]`}
          >
            <option value="">Todas as turmas</option>
            {turmas.map((tNome) => (
              <option key={tNome} value={tNome}>
                {tNome}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1 border border-gray-300 rounded-md px-3 py-1.5 bg-white">
            <span className="text-xs text-gray-500 shrink-0">De</span>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="text-sm text-gray-700 bg-transparent focus:outline-none"
            />
            <span className="text-xs text-gray-400 shrink-0 px-1">até</span>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="text-sm text-gray-700 bg-transparent focus:outline-none"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className={`w-6 h-6 animate-spin ${t.spinner}`} />
        </div>
      ) : detalhe ? (
        <div className="space-y-4">
          <Button variant="outline" size="sm" onClick={() => setDetalhe(null)} className="border-gray-200 text-gray-600 hover:bg-gray-100">
            ← Voltar para a lista
          </Button>
          <div className="bg-gray-50 rounded-lg p-5 space-y-3 border border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-lg font-semibold text-gray-900">{String(detalhe.titulo || "")}</h3>
              <Badge className={statusAulaBadgeClass(detalhe.statusAula as string)}>
                {statusAulaLabel(detalhe.statusAula as string)}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Professor:</span>{" "}
                <span className="font-medium">{String(detalhe.professorNome || "—")}</span>
              </div>
              <div>
                <span className="text-gray-500">Turma:</span> <span>{String(detalhe.turmaNome || "")}</span>
              </div>
              <div>
                <span className="text-gray-500">Data:</span>{" "}
                <span>
                  {detalhe.data
                    ? new Date(String(detalhe.data) + "T00:00:00").toLocaleDateString("pt-BR")
                    : "—"}
                </span>
              </div>
              {detalhe.duracaoMinutos != null && (
                <div>
                  <span className="text-gray-500">Duração:</span> <span>{String(detalhe.duracaoMinutos)} min</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Conteúdo Ministrado</p>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{String(detalhe.conteudoMinistrado || "")}</p>
            </div>
            {detalhe.competenciasTrabalhas && (
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Competências Trabalhadas</p>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">
                  {String(detalhe.competenciasTrabalhas)}
                </p>
              </div>
            )}
            {detalhe.observacoes && (
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Observações</p>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{String(detalhe.observacoes)}</p>
              </div>
            )}
            {detalhe.fotoComprovante && (
              <div>
                <p className="text-gray-500 text-sm font-medium mb-2">Foto Comprovante</p>
                <Button
                  variant="outline"
                  size="sm"
                  className={`flex items-center gap-2 ${t.fotoBtn}`}
                  disabled={fotoLoading}
                  onClick={async () => {
                    setFotoLoading(true);
                    try {
                      const resp = await fetch(`${fotoSignedUrlBase}/${detalhe.id}/foto-signed`);
                      const data = await resp.json();
                      if (data.url) setFotoModal(data.url);
                    } catch {
                      /* ignore */
                    }
                    setFotoLoading(false);
                  }}
                >
                  {fotoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>📷</span>}
                  Ver foto comprovante
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : lista.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>
            {tab === "pendentes"
              ? "Todos os planos já têm relatório!"
              : tab === "feitos"
                ? "Nenhuma aula registrada ainda."
                : "Nenhum relatório ou pendência encontrado."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {lista.map((item) =>
            item.kind === "pendente" ? (
              <div key={item.key} className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{String(item.plano.titulo || "")}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      <span className={t.prof}>{String(item.plano.professorNome || "Professor")}</span>
                      {" · "}
                      {String(item.plano.turmaNome || "")}
                      {item.plano.data && (
                        <>
                          {" · "}
                          {new Date(String(item.plano.data) + "T00:00:00").toLocaleDateString("pt-BR")}
                        </>
                      )}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs border-orange-400 text-orange-600 bg-white">
                    Sem relatório
                  </Badge>
                </div>
              </div>
            ) : (
              <div
                key={item.key}
                className={`bg-gray-50 rounded-lg p-4 border border-gray-200 ${t.hoverBorder} transition-colors cursor-pointer`}
                onClick={() => setDetalhe(item.aula)}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{String(item.aula.titulo || "")}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      <span className={t.prof}>{String(item.aula.professorNome || "Professor")}</span>
                      {" · "}
                      {String(item.aula.turmaNome || "")}
                      {" · "}
                      {item.aula.data
                        ? new Date(String(item.aula.data) + "T00:00:00").toLocaleDateString("pt-BR")
                        : "—"}
                      {item.aula.fotoComprovante && (
                        <span className="ml-2 text-green-600">· 📷 com foto</span>
                      )}
                    </p>
                  </div>
                  <Badge className={statusAulaBadgeClass(item.aula.statusAula as string)}>
                    {statusAulaLabel(item.aula.statusAula as string)}
                  </Badge>
                </div>
              </div>
            )
          )}
        </div>
      )}

      <Dialog open={!!fotoModal} onOpenChange={() => setFotoModal(null)}>
        <DialogContent className="max-w-3xl">
          {fotoModal && (
            <img src={fotoModal} alt="Foto comprovante" className="w-full h-auto rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
