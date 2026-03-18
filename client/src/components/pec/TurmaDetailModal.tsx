import { useState, useEffect } from "react";
import { formatCPF } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Users, Plus, Search, UserX, Trash2, ArrowRightLeft, FileDown } from "lucide-react";

interface TurmaDetailModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedInstance: any;
}

const EVASAO_MOTIVOS = ["Mudou de cidade", "Desistência da oficina/curso", "Conflito de horário", "Problemas familiares", "Questões financeiras", "Transferência de escola"];
const TRANSICAO_MOTIVO = "Transição para Inclusão Produtiva";


function gerarPDFListaAlunos(turma: any, alunos: any[]) {
  const horario = turma.start_time && turma.end_time
    ? `${turma.start_time} - ${turma.end_time}`
    : turma.horarioInicio && turma.horarioFim
    ? `${turma.horarioInicio} - ${turma.horarioFim}`
    : "Não informado";
  const fmt = (d: string | null | undefined) => {
    if (!d) return "Não informado";
    try { return new Date(d + "T12:00:00").toLocaleDateString("pt-BR"); } catch { return d; }
  };
  const alunosAtivos = [...alunos]
    .filter(a => !a.evadido && a.enrollment_active !== false)
    .sort((a, b) => (a.nome_completo || a.nome || "").localeCompare(b.nome_completo || b.nome || "", "pt-BR"));

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Lista de Alunos - ${turma.title || turma.nome}</title>
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
  <h1>${turma.title || turma.nome || "Turma"}</h1>
  <p class="info"><strong>Horário:</strong> ${horario}</p>
  <p class="info"><strong>Data de início:</strong> ${fmt(turma.start_date || turma.dataInicio)}</p>
  <p class="info"><strong>Data de fim:</strong> ${fmt(turma.end_date || turma.dataFim)}</p>
  <h2>Lista de Alunos (${alunosAtivos.length} ativos)</h2>
  <table><tbody>
    ${alunosAtivos.map((a, i) => `<tr><td class="num">${i + 1}.</td><td>${a.nome_completo || a.nome || "—"}</td></tr>`).join("")}
  </tbody></table>
</body>
</html>`;
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}

export function TurmaDetailModal({ open, onOpenChange, selectedInstance }: TurmaDetailModalProps) {
  const { toast } = useToast();
  const [turmaAlunos, setTurmaAlunos] = useState<any[]>([]);
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [showEvasaoDialog, setShowEvasaoDialog] = useState(false);
  const [evasaoAluno, setEvasaoAluno] = useState<any>(null);
  const [motivoEvasao, setMotivoEvasao] = useState("");
  const [submittingEvasao, setSubmittingEvasao] = useState(false);
  const [filterAlunos, setFilterAlunos] = useState<"ativos" | "inativos" | "todos">("todos");
  const [searchEnrolled, setSearchEnrolled] = useState("");
  const [showAddAluno, setShowAddAluno] = useState(false);
  const [searchAluno, setSearchAluno] = useState("");
  const [allAlunos, setAllAlunos] = useState<any[]>([]);
  const [loadingAllAlunos, setLoadingAllAlunos] = useState(false);
  const [addingAluno, setAddingAluno] = useState<string | null>(null);

  const fetchAlunos = async () => {
    if (!selectedInstance?.id) return;
    setLoadingAlunos(true);
    try {
      const resp = await fetch(`/api/pec/turma-alunos/${selectedInstance.id}?includeEvadidos=true`);
      if (resp.ok) {
        const data = await resp.json();
        setTurmaAlunos(data);
      }
    } catch (err) {
      console.error("Erro ao buscar alunos da turma:", err);
    } finally {
      setLoadingAlunos(false);
    }
  };

  useEffect(() => {
    if (open && selectedInstance?.id) {
      fetchAlunos();
      setFilterAlunos("todos");
      setSearchEnrolled("");
      setShowAddAluno(false);
    }
  }, [open, selectedInstance?.id]);

  const isTransicao = motivoEvasao === TRANSICAO_MOTIVO;

  const handleMarcarEvasao = async () => {
    if (!evasaoAluno || !selectedInstance?.id) return;
    setSubmittingEvasao(true);
    try {
      const resp = await fetch(`/api/pec/turma-alunos/${selectedInstance.id}/evasao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentCpf: evasaoAluno.cpf, motivo: motivoEvasao }),
      });
      if (resp.ok) {
        const result = await resp.json();
        if (isTransicao) {
          toast({ title: "Transição realizada", description: `${evasaoAluno.nome_completo || evasaoAluno.nome} foi transferido para Inclusão Produtiva com sucesso.` });
        } else {
          toast({ title: "Evasão registrada", description: `${evasaoAluno.nome_completo || evasaoAluno.nome} foi marcado como inativo.` });
        }
        setShowEvasaoDialog(false);
        setEvasaoAluno(null);
        setMotivoEvasao("");
        await fetchAlunos();
      } else {
        const errData = await resp.json().catch(() => ({}));
        toast({ title: "Erro", description: errData.error || "Não foi possível registrar a saída.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro", description: "Erro ao registrar evasão.", variant: "destructive" });
    } finally {
      setSubmittingEvasao(false);
    }
  };

  const handleReverterEvasao = async (aluno: any) => {
    if (!selectedInstance?.id) return;
    try {
      const resp = await fetch(`/api/pec/turma-alunos/${selectedInstance.id}/reverter-evasao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentCpf: aluno.cpf }),
      });
      if (resp.ok) {
        toast({ title: "Aluno reativado", description: `${aluno.nome_completo || aluno.nome} está ativo novamente.` });
        await fetchAlunos();
      }
    } catch {
      toast({ title: "Erro", description: "Erro ao reverter evasão.", variant: "destructive" });
    }
  };

  const fetchAllAlunos = async () => {
    setLoadingAllAlunos(true);
    try {
      const resp = await fetch("/api/pec/alunos");
      if (resp.ok) {
        const data = await resp.json();
        setAllAlunos(Array.isArray(data) ? data : (data.alunos || []));
      }
    } catch (err) {
      console.error("Erro ao buscar todos os alunos:", err);
    } finally {
      setLoadingAllAlunos(false);
    }
  };

  const handleAddAluno = async (alunoCpf: string) => {
    if (!selectedInstance?.id) return;
    setAddingAluno(alunoCpf);
    try {
      const resp = await fetch(`/api/pec/turma-alunos/${selectedInstance.id}/adicionar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentCpf: alunoCpf }),
      });
      if (resp.ok) {
        toast({ title: "Aluno adicionado", description: "Aluno matriculado na turma com sucesso." });
        await fetchAlunos();
      } else {
        const errData = await resp.json().catch(() => ({}));
        toast({ title: "Erro", description: errData.error || "Não foi possível adicionar o aluno.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro", description: "Erro ao adicionar aluno.", variant: "destructive" });
    } finally {
      setAddingAluno(null);
    }
  };

  const handleRemoveAluno = async (alunoCpf: string) => {
    if (!selectedInstance?.id) return;
    try {
      const resp = await fetch(`/api/pec/turma-alunos/${selectedInstance.id}/remover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentCpf: alunoCpf }),
      });
      if (resp.ok) {
        toast({ title: "Aluno removido", description: "Aluno removido da turma." });
        await fetchAlunos();
      }
    } catch {
      toast({ title: "Erro", description: "Erro ao remover aluno.", variant: "destructive" });
    }
  };

  const filteredAlunos = turmaAlunos.filter(a => {
    if (filterAlunos === "ativos" && (a.evadido || a.enrollment_active === false)) return false;
    if (filterAlunos === "inativos" && !a.evadido && a.enrollment_active !== false) return false;
    if (searchEnrolled.trim()) {
      const term = searchEnrolled.trim().toLowerCase();
      const nome = (a.nome_completo || a.nome || "").toLowerCase();
      const cpf = (a.cpf || "");
      if (!nome.includes(term) && !cpf.includes(searchEnrolled.trim())) return false;
    }
    return true;
  }).sort((a: any, b: any) => (a.nome_completo || a.nome || "").localeCompare(b.nome_completo || b.nome || "", 'pt-BR'));

  const totalAtivos = turmaAlunos.filter(a => !a.evadido && a.enrollment_active !== false).length;
  const totalInativos = turmaAlunos.filter(a => a.evadido || a.enrollment_active === false).length;

  const enrolledCpfs = new Set(turmaAlunos.map(a => a.cpf));
  const availableAlunos = allAlunos
    .filter(a => !enrolledCpfs.has(a.cpf))
    .filter(a => {
      if (!searchAluno) return true;
      const term = searchAluno.toLowerCase();
      return (a.nome_completo || a.nome || "").toLowerCase().includes(term) || (a.cpf || "").includes(term);
    })
    .sort((a, b) => {
      const aInativo = (a.situacao_atendimento || '').toLowerCase() === 'inativo';
      const bInativo = (b.situacao_atendimento || '').toLowerCase() === 'inativo';
      if (aInativo !== bInativo) return aInativo ? 1 : -1;
      const nomeA = (a.nome_completo || a.nome || "").trim().toLowerCase();
      const nomeB = (b.nome_completo || b.nome || "").trim().toLowerCase();
      return nomeA.localeCompare(nomeB, 'pt-BR');
    });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Turma</DialogTitle>
          </DialogHeader>
          {selectedInstance && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Título</label>
                  <p className="text-sm">{selectedInstance.title || selectedInstance.nome}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Código</label>
                  <p className="text-sm">{selectedInstance.code || '—'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Local</label>
                  <p className="text-sm">{selectedInstance.location || 'Não especificado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Situação</label>
                  <p className="text-sm">{selectedInstance.situation || selectedInstance.status || '—'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Horário</label>
                  <p className="text-sm">
                    {selectedInstance.start_time && selectedInstance.end_time 
                      ? `${selectedInstance.start_time} - ${selectedInstance.end_time}`
                      : selectedInstance.horarioInicio && selectedInstance.horarioFim
                      ? `${selectedInstance.horarioInicio} - ${selectedInstance.horarioFim}`
                      : 'A definir'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Faixa Etária</label>
                  <p className="text-sm">
                    {selectedInstance.age_min && selectedInstance.age_max
                      ? `${selectedInstance.age_min} - ${selectedInstance.age_max} anos`
                      : 'Não especificado'}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4" /> Alunos da Turma
                    <span className="text-xs font-normal text-gray-500">
                      ({totalAtivos} ativo{totalAtivos !== 1 ? 's' : ''}{totalInativos > 0 ? `, ${totalInativos} inativo${totalInativos !== 1 ? 's' : ''}` : ''})
                    </span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => gerarPDFListaAlunos(selectedInstance, turmaAlunos)}
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
                          if (allAlunos.length === 0) fetchAllAlunos();
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
                    {searchEnrolled.trim() ? "Nenhum aluno encontrado com esse nome." : filterAlunos === "inativos" ? "Nenhum aluno inativo nesta turma." : "Nenhum aluno matriculado nesta turma."}
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
                        {filteredAlunos.map((a: any) => (
                          <TableRow key={a.cpf} className={(a.evadido || a.enrollment_active === false) ? "bg-gray-50/80" : ""}>
                            <TableCell className="text-sm py-2">{a.nome_completo || a.nome || '—'}</TableCell>
                            <TableCell className="text-sm py-2 text-gray-500">{formatCPF(a.cpf)}</TableCell>
                            <TableCell className="py-2">
                              {(a.evadido || a.enrollment_active === false) ? (
                                <div>
                                  {a.motivo_evasao === TRANSICAO_MOTIVO ? (
                                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Transição</Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700">Inativo</Badge>
                                  )}
                                  {a.motivo_evasao && (
                                    <p className="text-xs text-gray-500 mt-0.5">{a.motivo_evasao}</p>
                                  )}
                                </div>
                              ) : (
                                <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-100">Ativo</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right py-2">
                              {(a.evadido || a.enrollment_active === false) ? (
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
                                    className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => { setEvasaoAluno(a); setMotivoEvasao(""); setShowEvasaoDialog(true); }}
                                  >
                                    <UserX className="w-3 h-3 mr-1" /> Evasão
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    className="h-7 text-xs text-gray-400 hover:text-red-600"
                                    onClick={() => handleRemoveAluno(a.cpf)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {showAddAluno && (
                  <div className="mt-4 border rounded-lg p-3 bg-blue-50/50">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Adicionar novo aluno à turma:</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Search className="w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Digite o nome do aluno para buscar..."
                        value={searchAluno}
                        onChange={e => setSearchAluno(e.target.value)}
                        className="h-8 text-sm bg-white"
                      />
                    </div>
                    {loadingAllAlunos ? (
                      <div className="text-center py-3 text-sm text-gray-500">Carregando alunos...</div>
                    ) : !searchAluno ? (
                      <div className="text-center py-3 text-sm text-gray-400">
                        Digite o nome do aluno para buscar.
                      </div>
                    ) : availableAlunos.length === 0 ? (
                      <div className="text-center py-3 text-sm text-gray-400">
                        Nenhum aluno encontrado com esse nome.
                      </div>
                    ) : (
                      <div className="max-h-[200px] overflow-y-auto space-y-1">
                        {availableAlunos.slice(0, 20).map((a: any) => (
                          <div key={a.cpf} className="flex items-center justify-between bg-white rounded px-3 py-1.5 text-sm">
                            <div className="flex items-center gap-2">
                              <span>{(a.nome_completo || a.nome || "").trim()}</span>
                              {(a.situacao_atendimento || '').toLowerCase() === 'inativo' && (
                                <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Inativo</span>
                              )}
                            </div>
                            <Button
                              size="sm"
                              className="h-6 text-xs px-2"
                              disabled={addingAluno === a.cpf}
                              onClick={() => handleAddAluno(a.cpf)}
                            >
                              {addingAluno === a.cpf ? "..." : "+ Adicionar"}
                            </Button>
                          </div>
                        ))}
                        {availableAlunos.length > 20 && (
                          <p className="text-xs text-center text-gray-400 py-1">Mostrando 20 de {availableAlunos.length}. Refine a busca.</p>
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

      <AlertDialog open={showEvasaoDialog} onOpenChange={setShowEvasaoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Registrar Saída do Aluno</AlertDialogTitle>
            <AlertDialogDescription>
              Registrar saída de <strong>{evasaoAluno?.nome_completo || evasaoAluno?.nome}</strong> desta turma?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-3 space-y-3">
            <div className="p-3 rounded-lg border-2 border-blue-200 bg-blue-50 cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => setMotivoEvasao(TRANSICAO_MOTIVO)}
            >
              <div className="flex items-center gap-2">
                <input type="radio" checked={motivoEvasao === TRANSICAO_MOTIVO} readOnly className="accent-blue-600" />
                <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800 text-sm">Transição para Inclusão Produtiva</span>
              </div>
              <p className="text-xs text-blue-600 mt-1 ml-6">O aluno será transferido automaticamente para o programa de Inclusão Produtiva. Não conta como evasão.</p>
            </div>

            <div className="border-t pt-3">
              <Label className="text-sm font-medium text-gray-700">Motivos de evasão</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {EVASAO_MOTIVOS.map(motivo => (
                  <Button
                    key={motivo}
                    type="button"
                    variant={motivoEvasao === motivo ? "default" : "outline"}
                    size="sm"
                    className="text-xs justify-start h-8"
                    onClick={() => setMotivoEvasao(motivo)}
                  >
                    {motivo}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Outro motivo:</Label>
              <Textarea 
                value={!EVASAO_MOTIVOS.includes(motivoEvasao) && motivoEvasao !== TRANSICAO_MOTIVO ? motivoEvasao : ""} 
                onChange={e => setMotivoEvasao(e.target.value)} 
                placeholder="Descreva o motivo..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submittingEvasao}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleMarcarEvasao}
              disabled={submittingEvasao}
              className={isTransicao ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"}
            >
              {submittingEvasao ? "Registrando..." : isTransicao ? "Confirmar Transição" : "Confirmar Evasão"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
