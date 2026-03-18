import { useState, useEffect } from "react";
import { formatCPF } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Users, Plus, Search, UserX, FileDown } from "lucide-react";

const DESLIGAMENTO_MOTIVOS = [
  "Cadastro errado",
  "Empregabilidade",
  "Desistência",
  "Mudança de localidade",
  "Mudança de oficina/curso",
];

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
    .filter(a => (a.status || "ativo").toLowerCase() === "ativo")
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
  const [filterAlunos, setFilterAlunos] = useState<"ativos" | "inativos" | "todos">("todos");
  const [searchEnrolled, setSearchEnrolled] = useState("");
  const [showAddAluno, setShowAddAluno] = useState(false);
  const [searchAluno, setSearchAluno] = useState("");
  const [allParticipantes, setAllParticipantes] = useState<any[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [desligarModal, setDesligarModal] = useState<{ id: number; nome: string } | null>(null);
  const [desligarMotivo, setDesligarMotivo] = useState("");
  const [submittingDesligar, setSubmittingDesligar] = useState(false);

  const fetchAlunos = async () => {
    if (!turma?.id) return;
    setLoadingAlunos(true);
    try {
      const resp = await fetch(`/api/turmas-inclusao/${turma.id}/participantes`, { credentials: "include" });
      if (resp.ok) {
        const data = await resp.json();
        setTurmaAlunos(Array.isArray(data) ? data : []);
      }
    } catch {
      toast({ title: "Erro ao carregar alunos", variant: "destructive" });
    } finally {
      setLoadingAlunos(false);
    }
  };

  useEffect(() => {
    if (open && turma?.id) {
      fetchAlunos();
      setFilterAlunos("todos");
      setSearchEnrolled("");
      setShowAddAluno(false);
    }
  }, [open, turma?.id]);

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

  const handleAddAluno = async (participanteId: number) => {
    if (!turma?.id) return;
    setAddingId(participanteId);
    try {
      const resp = await fetch(`/api/participantes-inclusao/${participanteId}/turmas/${turma.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (resp.ok) {
        toast({ title: "Participante adicionado à turma." });
        await fetchAlunos();
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
        await fetchAlunos();
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

  const enrolledIds = new Set(turmaAlunos.map(a => a.id));

  const filteredAlunos = turmaAlunos
    .filter(a => {
      const isInativo = (a.status || "ativo").toLowerCase() !== "ativo";
      if (filterAlunos === "ativos" && isInativo) return false;
      if (filterAlunos === "inativos" && !isInativo) return false;
      if (searchEnrolled.trim()) {
        const term = searchEnrolled.trim().toLowerCase();
        const nome = (a.nome || a.nomeCompleto || "").toLowerCase();
        const cpf = (a.cpf || "");
        if (!nome.includes(term) && !cpf.includes(searchEnrolled.trim())) return false;
      }
      return true;
    })
    .sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"));

  const totalAtivos = turmaAlunos.filter(a => (a.status || "ativo").toLowerCase() === "ativo").length;
  const totalInativos = turmaAlunos.filter(a => (a.status || "ativo").toLowerCase() !== "ativo").length;

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
                      ({totalAtivos} ativo{totalAtivos !== 1 ? "s" : ""}{totalInativos > 0 ? `, ${totalInativos} inativo${totalInativos !== 1 ? "s" : ""}` : ""})
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
                        <SelectItem value="ativos">Ativos</SelectItem>
                        <SelectItem value="inativos">Inativos</SelectItem>
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
                    {searchEnrolled.trim() ? "Nenhum aluno encontrado." : filterAlunos === "inativos" ? "Nenhum aluno inativo." : "Nenhum aluno matriculado."}
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-xs">Nome</TableHead>
                          <TableHead className="text-xs">CPF</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs text-right">Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAlunos.map((a: any) => {
                          const isInativo = (a.status || "ativo").toLowerCase() !== "ativo";
                          return (
                            <TableRow key={a.id} className={isInativo ? "bg-gray-50/80" : ""}>
                              <TableCell className="text-sm py-2">{a.nome || a.nomeCompleto || "—"}</TableCell>
                              <TableCell className="text-sm py-2 text-gray-500">{formatCPF(a.cpf)}</TableCell>
                              <TableCell className="py-2">
                                {isInativo ? (
                                  <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700">Inativo</Badge>
                                ) : (
                                  <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-100">Ativo</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right py-2">
                                {!isInativo && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => { setDesligarModal({ id: a.id, nome: a.nome || a.nomeCompleto || "Participante" }); setDesligarMotivo(""); }}
                                  >
                                    <UserX className="w-3 h-3 mr-1" /> Desligar
                                  </Button>
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
                              onClick={() => handleAddAluno(p.id)}
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
              Selecione o motivo do desligamento de <strong>{desligarModal?.nome}</strong>.
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
    </>
  );
}
