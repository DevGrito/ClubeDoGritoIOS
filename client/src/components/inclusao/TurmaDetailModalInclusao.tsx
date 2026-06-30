import { useState, useEffect, useRef, useCallback } from "react";
import { formatCPF } from "@/lib/utils";
import { authFetch } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Users, Plus, Search, UserX, FileDown, Phone, User, MapPin, GraduationCap } from "lucide-react";
import { FrequenciaModal } from "@/components/presenca/FrequenciaModal";
import { ParticipanteDetalhesModal, type DetalhesSection } from "@/components/ParticipanteDetalhesModal";
import { SituacaoFormacaoBadge } from "@/components/turma/SituacaoFormacaoBadge";
import { DESLIGAMENTO_MOTIVOS } from "@shared/turmaMotivos";
import {
  getSituacaoFormacaoInclusao,
  isAlunoEvadidoInclusao,
  isTurmaFinalizadaInclusao,
} from "@/lib/turmaSituacaoAluno";

interface TurmaDetailModalInclusaoProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  turma: any;
}

function formatarData(data: string | null | undefined) {
  if (!data) return "Não informado";
  try {
    const d = new Date(data + "T12:00:00");
    return d.toLocaleDateString("pt-BR");
  } catch {
    return data;
  }
}

function gerarPDFListaAlunos(turma: any, alunos: any[]) {
  const horario = turma.horarioEntrada && turma.horarioSaida
    ? `${turma.horarioEntrada} - ${turma.horarioSaida}`
    : turma.horario || "Não informado";
  const dataInicio = formatarData(turma.dataInicio);
  const dataFim = formatarData(turma.dataFim);
  const alunosAtivos = [...alunos]
    .filter(a => !isAlunoEvadidoInclusao(a))
    .sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"));

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Lista de Alunos - ${turma.nome}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #222; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .info { font-size: 13px; color: #555; margin-bottom: 3px; }
    h2 { font-size: 17px; margin-top: 30px; border-bottom: 2px solid #333; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    td { padding: 9px 4px; border-bottom: 1px solid #ddd; font-size: 14px; }
    .num { color: #888; width: 36px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>${turma.nome || "Turma"}</h1>
  <p class="info"><strong>Horário:</strong> ${horario}</p>
  <p class="info"><strong>Data de início:</strong> ${dataInicio}</p>
  <p class="info"><strong>Data de fim:</strong> ${dataFim}</p>
  <h2>Lista de Alunos (${alunosAtivos.length} ativos)</h2>
  <table>
    <tbody>
      ${alunosAtivos.map((a, i) => `<tr><td class="num">${i + 1}.</td><td>${a.nome || a.nomeCompleto || "—"}</td></tr>`).join("")}
    </tbody>
  </table>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}

export function TurmaDetailModalInclusao({ open, onOpenChange, turma }: TurmaDetailModalInclusaoProps) {
  const { toast } = useToast();
  const [turmaAlunos, setTurmaAlunos] = useState<any[]>([]);
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [filterAlunos, setFilterAlunos] = useState<"todos" | "evadidos">("todos");
  const [searchEnrolled, setSearchEnrolled] = useState("");
  const [showAddAluno, setShowAddAluno] = useState(false);
  const [searchAluno, setSearchAluno] = useState("");
  const [allParticipantes, setAllParticipantes] = useState<any[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [pendingAddParticipante, setPendingAddParticipante] = useState<{ id: number; nome: string } | null>(null);
  const [dataIngressoInclusao, setDataIngressoInclusao] = useState<string>(new Date().toISOString().split('T')[0]);
  const [desligarModal, setDesligarModal] = useState<{ id: number; nome: string } | null>(null);
  const [desligarMotivo, setDesligarMotivo] = useState("");
  const [submittingDesligar, setSubmittingDesligar] = useState(false);
  const [evasaoModal, setEvasaoModal] = useState<{ id: number; nome: string } | null>(null);
  const [dataEvasao, setDataEvasao] = useState(new Date().toISOString().split("T")[0]);
  const [submittingEvasao, setSubmittingEvasao] = useState(false);
  const [frequencias, setFrequencias] = useState<Record<string, { presencas: number; total: number }> | null>(null);
  const [freqModalAluno, setFreqModalAluno] = useState<{ id: number; nome: string } | null>(null);
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);
  const [fullParticipanteData, setFullParticipanteData] = useState<any>(null);
  const loadSeqRef = useRef(0);

  const isAbortError = (err: unknown) =>
    err instanceof DOMException && err.name === "AbortError";

  const loadTurmaAlunos = useCallback(async (turmaId: number, signal?: AbortSignal) => {
    const seq = ++loadSeqRef.current;
    setLoadingAlunos(true);
    try {
      const resp = await authFetch(
        `/api/turmas-inclusao/${turmaId}/participantes`,
        { credentials: "include", signal },
        { on401: "returnResponse" }
      );
      if (signal?.aborted || seq !== loadSeqRef.current) return;

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        toast({
          title: "Erro ao carregar alunos",
          description: errData.error || "Não foi possível buscar os alunos desta turma.",
          variant: "destructive",
        });
        setTurmaAlunos([]);
        return;
      }

      const data = await resp.json();
      if (signal?.aborted || seq !== loadSeqRef.current) return;

      const lista = Array.isArray(data) ? data : (data?.data ?? data?.participantes ?? []);
      setTurmaAlunos(
        (Array.isArray(lista) ? lista : []).map((a: any) => ({
          ...a,
          evasaoAtiva: a.evasaoAtiva === true || a.evasao_ativa === true,
          evasaoId: a.evasaoId ?? a.evasao_id ?? null,
        }))
      );
    } catch (err) {
      if (signal?.aborted || isAbortError(err) || seq !== loadSeqRef.current) return;
      toast({ title: "Erro ao carregar alunos", variant: "destructive" });
      setTurmaAlunos([]);
    } finally {
      if (seq === loadSeqRef.current) setLoadingAlunos(false);
    }
  }, [toast]);

  const handleClickAluno = async (aluno: any) => {
    setShowDetalhesModal(true);
    setLoadingDetalhes(true);
    setFullParticipanteData(null);
    try {
      const res = await fetch(`/api/participantes-inclusao/${aluno.id}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setFullParticipanteData(data);
      }
    } catch (err) {
      console.error("Erro ao buscar detalhes do participante:", err);
    } finally {
      setLoadingDetalhes(false);
    }
  };

  const reloadAlunos = useCallback(async () => {
    if (!turma?.id) return;
    await loadTurmaAlunos(Number(turma.id));
  }, [turma?.id, loadTurmaAlunos]);

  useEffect(() => {
    if (!open || !turma?.id) {
      setFrequencias(null);
      return;
    }

    const turmaId = Number(turma.id);
    const controller = new AbortController();
    const { signal } = controller;

    setTurmaAlunos([]);
    setFilterAlunos("todos");
    setSearchEnrolled("");
    setShowAddAluno(false);
    loadTurmaAlunos(turmaId, signal);

    (async () => {
      try {
        const resp = await fetch(
          `/api/frequencia/turma?tipo=inclusao&turmaId=${turmaId}`,
          { credentials: "include", signal }
        );
        if (signal.aborted) return;
        if (resp.ok) {
          const data = await resp.json();
          setFrequencias(data.porParticipante || {});
        }
      } catch (err) {
        if (!isAbortError(err)) {
          setFrequencias(null);
        }
      }
    })();

    return () => controller.abort();
  }, [open, turma?.id, loadTurmaAlunos]);

  const fetchAllParticipantes = async () => {
    setLoadingAll(true);
    try {
      const resp = await fetch("/api/participantes-inclusao", { credentials: "include" });
      if (resp.ok) {
        const data = await resp.json();
        setAllParticipantes(Array.isArray(data) ? data : []);
      }
    } catch {
      console.error("Erro ao buscar participantes");
    } finally {
      setLoadingAll(false);
    }
  };

  const handleAddAluno = async (participanteId: number, dataIngresso?: string) => {
    if (!turma?.id) return;
    setAddingId(participanteId);
    try {
      const resp = await fetch(`/api/participantes-inclusao/${participanteId}/turmas/${turma.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ dataIngresso: dataIngresso || undefined }),
      });
      if (resp.ok) {
        toast({ title: "Participante adicionado à turma." });
        await reloadAlunos();
      } else {
        const err = await resp.json().catch(() => ({}));
        toast({ title: "Erro", description: err.error || "Não foi possível adicionar.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao adicionar", variant: "destructive" });
    } finally {
      setAddingId(null);
    }
  };

  const handleDesligar = async () => {
    if (!desligarModal || !desligarMotivo || !turma?.id) return;
    setSubmittingDesligar(true);
    try {
      const resp = await fetch(`/api/participantes-inclusao/${desligarModal.id}/turmas/${turma.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ motivo: desligarMotivo }),
      });
      if (resp.ok) {
        toast({ title: "Participante desligado", description: `Motivo: ${desligarMotivo}` });
        setDesligarModal(null);
        setDesligarMotivo("");
        await reloadAlunos();
      } else {
        const err = await resp.json().catch(() => ({}));
        toast({ title: "Erro", description: err.error || "Não foi possível desligar.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao desligar", variant: "destructive" });
    } finally {
      setSubmittingDesligar(false);
    }
  };

  const handleMarcarEvasao = async () => {
    if (!evasaoModal || !turma?.id || !dataEvasao) return;
    setSubmittingEvasao(true);
    try {
      const resp = await fetch(`/api/participantes-inclusao/${evasaoModal.id}/turmas/${turma.id}/evasao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ dataEvasao }),
      });
      if (resp.ok) {
        toast({ title: "Evasão registrada", description: `${evasaoModal.nome} — ${formatarData(dataEvasao)}` });
        setEvasaoModal(null);
        await reloadAlunos();
      } else {
        const err = await resp.json().catch(() => ({}));
        toast({ title: "Erro", description: err.error || "Não foi possível registrar evasão.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao registrar evasão", variant: "destructive" });
    } finally {
      setSubmittingEvasao(false);
    }
  };

  const handleReverterEvasao = async (aluno: any) => {
    if (!turma?.id) return;
    try {
      const resp = await fetch(`/api/participantes-inclusao/${aluno.id}/turmas/${turma.id}/reverter-evasao`, {
        method: "POST",
        credentials: "include",
      });
      if (resp.ok) {
        toast({ title: "Aluno reativado", description: `${aluno.nome || aluno.nomeCompleto} está ativo novamente na turma.` });
        await reloadAlunos();
      } else {
        const err = await resp.json().catch(() => ({}));
        toast({ title: "Erro", description: err.error || "Não foi possível reverter.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao reverter evasão", variant: "destructive" });
    }
  };

  const enrolledIds = new Set(
    turmaAlunos.filter(a => !isAlunoEvadidoInclusao(a)).map(a => a.id)
  );

  const filteredAlunos = turmaAlunos
    .filter(a => {
      if (filterAlunos === "evadidos" && !isAlunoEvadidoInclusao(a)) return false;
      if (searchEnrolled.trim()) {
        const term = searchEnrolled.trim().toLowerCase();
        const nome = (a.nome || a.nomeCompleto || "").toLowerCase();
        const cpf = (a.cpf || "");
        if (!nome.includes(term) && !cpf.includes(searchEnrolled.trim())) return false;
      }
      return true;
    })
    .sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"));

  const totalEvadidos = turmaAlunos.filter(isAlunoEvadidoInclusao).length;

  const availableParticipantes = allParticipantes
    .filter(p => !enrolledIds.has(p.id))
    .filter(p => {
      if (!searchAluno) return true;
      const term = searchAluno.toLowerCase();
      return (p.nome || p.nomeCompleto || "").toLowerCase().includes(term) || (p.cpf || "").includes(term);
    })
    .sort((a, b) => {
      const aInativo = (a.status || "").toLowerCase() === "inativo";
      const bInativo = (b.status || "").toLowerCase() === "inativo";
      if (aInativo !== bInativo) return aInativo ? 1 : -1;
      return (a.nome || a.nomeCompleto || "").localeCompare(b.nome || b.nomeCompleto || "", "pt-BR");
    });

  const horario = turma?.horarioEntrada && turma?.horarioSaida
    ? `${turma.horarioEntrada} - ${turma.horarioSaida}`
    : turma?.horario || "A definir";

  const turmaFinalizada = isTurmaFinalizadaInclusao(turma);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Turma</DialogTitle>
          </DialogHeader>
          {turma && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nome</label>
                  <p className="text-sm">{turma.nome || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Código</label>
                  <p className="text-sm">{turma.codigo || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Local</label>
                  <p className="text-sm">{turma.local || "Não especificado"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Situação</label>
                  <p className="text-sm">{turma.status || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Horário</label>
                  <p className="text-sm">{horario}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Período</label>
                  <p className="text-sm">
                    {turma.dataInicio ? formatarData(turma.dataInicio) : "—"}
                    {" a "}
                    {turma.dataFim ? formatarData(turma.dataFim) : "—"}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4" /> Alunos da Turma
                    <span className="text-xs font-normal text-gray-500">
                      ({turmaAlunos.length} no total{totalEvadidos > 0 ? `, ${totalEvadidos} evadido${totalEvadidos !== 1 ? "s" : ""}` : ""})
                    </span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => gerarPDFListaAlunos(turma, turmaAlunos)}
                    >
                      <FileDown className="w-3 h-3 mr-1" /> Baixar lista
                    </Button>
                    <Button
                      size="sm"
                      variant={showAddAluno ? "secondary" : "default"}
                      className="h-8 text-xs"
                      onClick={() => {
                        if (!showAddAluno) {
                          setShowAddAluno(true);
                          setSearchAluno("");
                          if (allParticipantes.length === 0) fetchAllParticipantes();
                        } else {
                          setShowAddAluno(false);
                        }
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" /> {showAddAluno ? "Fechar" : "Adicionar Aluno"}
                    </Button>
                    <Select value={filterAlunos} onValueChange={(v: any) => setFilterAlunos(v)}>
                      <SelectTrigger className="w-[130px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="evadidos">Evadidos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {turmaAlunos.length > 0 && (
                  <div className="mb-3">
                    <Input
                      placeholder="Buscar aluno por nome..."
                      value={searchEnrolled}
                      onChange={e => setSearchEnrolled(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                )}

                {loadingAlunos ? (
                  <div className="text-center py-6 text-sm text-gray-500">Carregando alunos...</div>
                ) : filteredAlunos.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-400">
                    {searchEnrolled.trim() ? "Nenhum aluno encontrado." : filterAlunos === "evadidos" ? "Nenhum aluno evadido nesta turma." : "Nenhum aluno matriculado."}
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-xs">Nome</TableHead>
                          <TableHead className="text-xs">CPF</TableHead>
                          <TableHead className="text-xs">Frequência</TableHead>
                          <TableHead className="text-xs">Situação</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs text-right">Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAlunos.map((a: any) => {
                          const isEvadido = isAlunoEvadidoInclusao(a);
                          const dataEvasaoAluno = a.dataEvasao || a.dataEvasaoPec;
                          const freqData = frequencias?.[String(a.id)];
                          const pres = freqData?.presencas ?? null;
                          const total = freqData?.total ?? 0;
                          const pct = pres !== null && total > 0 ? Math.round((pres / total) * 100) : null;
                          const corBadge =
                            pct === null ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            : pct >= 85 ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : pct >= 60 ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            : "bg-red-100 text-red-700 hover:bg-red-200";
                          return (
                            <TableRow key={a.id} className={isEvadido ? "bg-gray-50/80" : ""}>
                              <TableCell className="text-sm py-2">
                                <button
                                  className="font-medium text-left text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                                  onClick={() => handleClickAluno(a)}
                                >
                                  {a.nome || a.nomeCompleto || "—"}
                                </button>
                                <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3 shrink-0" />
                                  {a.telefone || 'Não informado'}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm py-2 text-gray-500">{formatCPF(a.cpf)}</TableCell>
                              <TableCell className="py-2">
                                <button
                                  onClick={() => setFreqModalAluno({ id: a.id, nome: a.nome || a.nomeCompleto || "—" })}
                                  className={`text-xs font-semibold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${corBadge}`}
                                  title="Ver detalhe de frequência"
                                >
                                  {pct !== null ? `${pct}% (${pres}/${total})` : "Sem dados"}
                                </button>
                              </TableCell>
                              <TableCell className="py-2">
                                <SituacaoFormacaoBadge
                                  situacao={getSituacaoFormacaoInclusao(turmaFinalizada, a.status)}
                                />
                              </TableCell>
                              <TableCell className="py-2">
                                {isEvadido ? (
                                  <div>
                                    <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700">Evadido</Badge>
                                    {dataEvasaoAluno && (
                                      <p className="text-xs text-gray-400 mt-0.5">{formatarData(dataEvasaoAluno)}</p>
                                    )}
                                  </div>
                                ) : (
                                  <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-100">Ativo</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right py-2">
                                {isEvadido ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-green-700 border-green-200 hover:bg-green-50"
                                    onClick={() => handleReverterEvasao(a)}
                                  >
                                    Reativar
                                  </Button>
                                ) : (
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs text-orange-600 border-orange-200 hover:bg-orange-50"
                                      onClick={() => {
                                        setEvasaoModal({ id: a.id, nome: a.nome || a.nomeCompleto || "Participante" });
                                        setDataEvasao(new Date().toISOString().split("T")[0]);
                                      }}
                                    >
                                      <UserX className="w-3 h-3 mr-1" /> Evasão
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                      onClick={() => { setDesligarModal({ id: a.id, nome: a.nome || a.nomeCompleto || "Participante" }); setDesligarMotivo(""); }}
                                    >
                                      <UserX className="w-3 h-3 mr-1" /> Desligar
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {showAddAluno && (
                  <div className="mt-4 border rounded-lg p-3 bg-blue-50/50">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Adicionar participante à turma:</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Search className="w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Digite o nome ou CPF para buscar..."
                        value={searchAluno}
                        onChange={e => setSearchAluno(e.target.value)}
                        className="h-8 text-sm bg-white"
                      />
                    </div>
                    {loadingAll ? (
                      <div className="text-center py-3 text-sm text-gray-500">Carregando...</div>
                    ) : !searchAluno ? (
                      <div className="text-center py-3 text-sm text-gray-400">Digite o nome para buscar.</div>
                    ) : availableParticipantes.length === 0 ? (
                      <div className="text-center py-3 text-sm text-gray-400">Nenhum participante encontrado.</div>
                    ) : (
                      <div className="max-h-[200px] overflow-y-auto space-y-1">
                        {availableParticipantes.slice(0, 20).map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between bg-white rounded px-3 py-1.5 text-sm">
                            <div className="flex items-center gap-2">
                              <span>{(p.nome || p.nomeCompleto || "").trim()}</span>
                              {(p.status || "").toLowerCase() === "inativo" && (
                                <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Inativo</span>
                              )}
                            </div>
                            <Button
                              size="sm"
                              className="h-6 text-xs px-2"
                              disabled={addingId === p.id}
                              onClick={() => {
                                setDataIngressoInclusao(new Date().toISOString().split('T')[0]);
                                setPendingAddParticipante({ id: p.id, nome: p.nome || p.nomeCompleto || String(p.id) });
                              }}
                            >
                              {addingId === p.id ? "..." : "+ Adicionar"}
                            </Button>
                          </div>
                        ))}
                        {availableParticipantes.length > 20 && (
                          <p className="text-xs text-center text-gray-400 py-1">Mostrando 20 de {availableParticipantes.length}. Refine a busca.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!desligarModal} onOpenChange={open => { if (!open) { setDesligarModal(null); setDesligarMotivo(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desligar da Turma</AlertDialogTitle>
            <AlertDialogDescription>
              Selecione o motivo do desligamento de <strong>{desligarModal?.nome}</strong>. O vínculo será removido (não conta como evasão).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-3 grid grid-cols-1 gap-2">
            {DESLIGAMENTO_MOTIVOS.map(motivo => (
              <Button
                key={motivo}
                type="button"
                variant={desligarMotivo === motivo ? "default" : "outline"}
                size="sm"
                className="text-xs justify-start h-9"
                onClick={() => setDesligarMotivo(motivo)}
              >
                {motivo}
              </Button>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submittingDesligar}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDesligar}
              disabled={submittingDesligar || !desligarMotivo}
              className="bg-red-600 hover:bg-red-700"
            >
              {submittingDesligar ? "Desligando..." : "Confirmar Desligamento"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!evasaoModal} onOpenChange={open => { if (!open) setEvasaoModal(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar Evasão</DialogTitle>
            <DialogDescription>
              Informe a data de evasão de <strong>{evasaoModal?.nome}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="dataEvasaoInclusao">Data de evasão</Label>
            <Input
              id="dataEvasaoInclusao"
              type="date"
              value={dataEvasao}
              onChange={e => setDataEvasao(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="mt-1"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEvasaoModal(null)} disabled={submittingEvasao}>Cancelar</Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              disabled={!dataEvasao || submittingEvasao}
              onClick={handleMarcarEvasao}
            >
              {submittingEvasao ? "Registrando..." : "Confirmar Evasão"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingAddParticipante} onOpenChange={(open) => { if (!open) setPendingAddParticipante(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Data de Ingresso</DialogTitle>
            <DialogDescription>Informe a data em que o participante ingressou na turma.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Participante</p>
              <p className="text-sm text-gray-900">{pendingAddParticipante?.nome}</p>
            </div>
            <div>
              <Label htmlFor="dataIngressoInclusaoInput">Data de ingresso</Label>
              <Input
                id="dataIngressoInclusaoInput"
                type="date"
                value={dataIngressoInclusao}
                onChange={(e) => setDataIngressoInclusao(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setPendingAddParticipante(null)}>Cancelar</Button>
            <Button
              className="bg-green-500 hover:bg-green-600"
              disabled={!dataIngressoInclusao || !!addingId}
              onClick={() => {
                if (!pendingAddParticipante) return;
                handleAddAluno(pendingAddParticipante.id, dataIngressoInclusao);
                setPendingAddParticipante(null);
              }}
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {freqModalAluno && (
        <FrequenciaModal
          open={!!freqModalAluno}
          onOpenChange={(v) => { if (!v) setFreqModalAluno(null); }}
          nomeAluno={freqModalAluno.nome}
          nomeTurma={turma?.nome || ""}
          tipo="inclusao"
          turmaId={turma?.id}
          participanteId={freqModalAluno.id}
        />
      )}

      <ParticipanteDetalhesModal
        open={showDetalhesModal}
        onOpenChange={(v) => { setShowDetalhesModal(v); if (!v) setFullParticipanteData(null); }}
        title="Detalhes do Participante"
        loading={loadingDetalhes}
        color="blue"
        nome={fullParticipanteData?.nome}
        cpf={fullParticipanteData ? formatCPF(fullParticipanteData.cpf) : undefined}
        status={fullParticipanteData?.status}
        sections={fullParticipanteData ? ([
          {
            title: "Identificação",
            icon: User,
            fields: [
              { label: "Gênero", value: fullParticipanteData.genero },
              { label: "Idade", value: (() => { const idade = fullParticipanteData.idade; return (idade && idade > 0 && idade < 150) ? `${idade} anos` : undefined; })() },
              { label: "Data de Nascimento", value: fullParticipanteData.dataNascimento ? new Date(String(fullParticipanteData.dataNascimento).slice(0,10) + 'T12:00:00').toLocaleDateString('pt-BR') : undefined },
              { label: "Data de Ingresso", value: fullParticipanteData.dataIngresso ? new Date(fullParticipanteData.dataIngresso).toLocaleDateString('pt-BR') : undefined },
              { label: "Nº Matrícula", value: fullParticipanteData.codigoMatricula },
              { label: "Forma de Acesso", value: fullParticipanteData.formaAcesso },
              { label: "Nacionalidade", value: fullParticipanteData.nacionalidade },
            ],
          },
          {
            title: "Contato",
            icon: Phone,
            fields: [
              { label: "Telefone", value: fullParticipanteData.telefone },
              { label: "Email", value: fullParticipanteData.email },
            ],
          },
          {
            title: "Endereço",
            icon: MapPin,
            fields: [
              { label: "CEP", value: fullParticipanteData.cep },
              { label: "Logradouro", value: fullParticipanteData.logradouro, fullWidth: true },
              { label: "Número", value: fullParticipanteData.numero },
              { label: "Complemento", value: fullParticipanteData.complemento },
              { label: "Bairro", value: fullParticipanteData.bairro },
              { label: "Cidade", value: fullParticipanteData.cidade },
              { label: "Estado", value: fullParticipanteData.estado },
            ],
          },
          {
            title: "Escolaridade e Profissional",
            icon: GraduationCap,
            cols: 2,
            fields: [
              { label: "Escolaridade", value: fullParticipanteData.escolaridade },
              { label: "Experiência Profissional", value: fullParticipanteData.experienciaProfissional },
              { label: "Objetivos Profissionais", value: fullParticipanteData.objetivosProfissionais, fullWidth: true },
            ],
          },
          {
            title: "Turmas",
            icon: Users,
            fields: (fullParticipanteData.turmas && Array.isArray(fullParticipanteData.turmas) && fullParticipanteData.turmas.length > 0)
              ? fullParticipanteData.turmas.map((t: any) => ({ label: t.nome, value: t.status || "ativo" }))
              : [{ label: "Turmas", value: "Nenhuma turma vinculada" }],
          },
        ] as DetalhesSection[]) : []}
      />
    </>
  );
}
