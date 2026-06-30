import { useState, useEffect } from "react";
import { formatCPF } from "@/lib/utils";
import { authFetch } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Users, Plus, Search, UserX, ArrowRightLeft, FileDown, Phone } from "lucide-react";
import { DESLIGAMENTO_MOTIVOS, TRANSICAO_PEC_MOTIVO } from "@shared/turmaMotivos";
import { FrequenciaModal } from "@/components/presenca/FrequenciaModal";
import { SituacaoFormacaoBadge } from "@/components/turma/SituacaoFormacaoBadge";
import {
  getSituacaoFormacaoPec,
  isAlunoEvadidoPec,
  isTurmaFinalizadaPec,
} from "@/lib/turmaSituacaoAluno";

interface TurmaDetailModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedInstance: any;
  onClickAluno?: (aluno: any) => void;
}



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
    .filter(a => !isAlunoEvadidoPec(a) && a.enrollment_active !== false)
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

export function TurmaDetailModal({ open, onOpenChange, selectedInstance, onClickAluno }: TurmaDetailModalProps) {
  const { toast } = useToast();
  const [turmaAlunos, setTurmaAlunos] = useState<any[]>([]);
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [showEvasaoDialog, setShowEvasaoDialog] = useState(false);
  const [evasaoAluno, setEvasaoAluno] = useState<any>(null);
  const [modoEvasaoDialog, setModoEvasaoDialog] = useState<"evasao" | "transicao">("evasao");
  const [dataEvasao, setDataEvasao] = useState(new Date().toISOString().split("T")[0]);
  const [submittingEvasao, setSubmittingEvasao] = useState(false);
  const [desligarModal, setDesligarModal] = useState<{ cpf: string; nome: string } | null>(null);
  const [desligarMotivo, setDesligarMotivo] = useState("");
  const [submittingDesligar, setSubmittingDesligar] = useState(false);
  const [filterAlunos, setFilterAlunos] = useState<"todos" | "evadidos">("todos");
  const [searchEnrolled, setSearchEnrolled] = useState("");
  const [showAddAluno, setShowAddAluno] = useState(false);
  const [searchAluno, setSearchAluno] = useState("");
  const [allAlunos, setAllAlunos] = useState<any[]>([]);
  const [loadingAllAlunos, setLoadingAllAlunos] = useState(false);
  const [addingAluno, setAddingAluno] = useState<string | null>(null);
  const [pendingAddAlunoCpf, setPendingAddAlunoCpf] = useState<{ cpf: string; nome: string } | null>(null);
  const [dataIngressoPec, setDataIngressoPec] = useState<string>(new Date().toISOString().split('T')[0]);
  const [frequencias, setFrequencias] = useState<{ porAluno: Record<string, { presencas: number; totalAulas: number }> } | null>(null);
  const [freqModalAluno, setFreqModalAluno] = useState<{ cpf: string; nome: string } | null>(null);

  const fetchAlunos = async () => {
    if (!selectedInstance?.id) return;
    setLoadingAlunos(true);
    try {
      const resp = await authFetch(
        `/api/pec/turma-alunos/${selectedInstance.id}?includeEvadidos=true`,
        { credentials: "include" },
        { on401: "returnResponse" }
      );
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
      const lista = Array.isArray(data) ? data : (data?.data ?? data?.alunos ?? []);
      setTurmaAlunos(
        (Array.isArray(lista) ? lista : []).map((a: any) => ({
          ...a,
          evasaoAtiva: a.evasaoAtiva === true || a.evasao_ativa === true,
          evasaoId: a.evasaoId ?? a.evasao_id ?? null,
        }))
      );
    } catch (err) {
      console.error("Erro ao buscar alunos da turma:", err);
      toast({
        title: "Erro ao carregar alunos",
        description: "Não foi possível buscar os alunos desta turma.",
        variant: "destructive",
      });
      setTurmaAlunos([]);
    } finally {
      setLoadingAlunos(false);
    }
  };

  const fetchFrequencias = async () => {
    if (!selectedInstance?.id) return;
    try {
      const resp = await fetch(`/api/frequencia/turma?tipo=pec&turmaId=${selectedInstance.id}`, { credentials: "include" });
      if (resp.ok) setFrequencias(await resp.json());
    } catch {}
  };

  useEffect(() => {
    if (open && selectedInstance?.id) {
      fetchAlunos();
      fetchFrequencias();
      setFilterAlunos("todos");
      setSearchEnrolled("");
      setShowAddAluno(false);
    } else {
      setFrequencias(null);
    }
  }, [open, selectedInstance?.id]);

  const isTransicao = modoEvasaoDialog === "transicao";

  const handleMarcarEvasao = async () => {
    if (!evasaoAluno || !selectedInstance?.id) return;
    setSubmittingEvasao(true);
    try {
      const body = isTransicao
        ? { studentCpf: evasaoAluno.cpf, motivo: TRANSICAO_PEC_MOTIVO }
        : { studentCpf: evasaoAluno.cpf, dataEvasao };
      const resp = await fetch(`/api/pec/turma-alunos/${selectedInstance.id}/evasao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (resp.ok) {
        if (isTransicao) {
          toast({ title: "Transição realizada", description: `${evasaoAluno.nome_completo || evasaoAluno.nome} foi transferido para Inclusão Produtiva com sucesso.` });
        } else {
          toast({ title: "Evasão registrada", description: `${evasaoAluno.nome_completo || evasaoAluno.nome} — ${new Date(dataEvasao + "T12:00:00").toLocaleDateString("pt-BR")}` });
        }
        setShowEvasaoDialog(false);
        setEvasaoAluno(null);
        setModoEvasaoDialog("evasao");
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

  const handleDesligar = async () => {
    if (!desligarModal || !desligarMotivo || !selectedInstance?.id) return;
    setSubmittingDesligar(true);
    try {
      const resp = await fetch(`/api/pec/turma-alunos/${selectedInstance.id}/remover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentCpf: desligarModal.cpf, motivo: desligarMotivo }),
      });
      if (resp.ok) {
        toast({ title: "Aluno desligado", description: `Motivo: ${desligarMotivo}` });
        setDesligarModal(null);
        setDesligarMotivo("");
        await fetchAlunos();
      } else {
        const errData = await resp.json().catch(() => ({}));
        toast({ title: "Erro", description: errData.error || "Não foi possível desligar.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro", description: "Erro ao desligar aluno.", variant: "destructive" });
    } finally {
      setSubmittingDesligar(false);
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
      const resp = await authFetch("/api/pec/alunos", { credentials: "include" }, { on401: "returnResponse" });
      if (resp.ok) {
        const data = await resp.json();
        setAllAlunos(Array.isArray(data) ? data : (data.alunos || data?.data || []));
      }
    } catch (err) {
      console.error("Erro ao buscar todos os alunos:", err);
    } finally {
      setLoadingAllAlunos(false);
    }
  };

  const handleAddAluno = async (alunoCpf: string, enrollmentDate?: string) => {
    if (!selectedInstance?.id) return;
    setAddingAluno(alunoCpf);
    try {
      const resp = await fetch(`/api/pec/turma-alunos/${selectedInstance.id}/adicionar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentCpf: alunoCpf, enrollmentDate: enrollmentDate || undefined }),
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

  const filteredAlunos = turmaAlunos.filter(a => {
    if (filterAlunos === "evadidos" && !isAlunoEvadidoPec(a)) return false;
    if (searchEnrolled.trim()) {
      const term = searchEnrolled.trim().toLowerCase();
      const nome = (a.nome_completo || a.nome || "").toLowerCase();
      const cpf = (a.cpf || "");
      if (!nome.includes(term) && !cpf.includes(searchEnrolled.trim())) return false;
    }
    return true;
  }).sort((a: any, b: any) => (a.nome_completo || a.nome || "").localeCompare(b.nome_completo || b.nome || "", 'pt-BR'));

  const totalEvadidos = turmaAlunos.filter(isAlunoEvadidoPec).length;
  const turmaFinalizada = isTurmaFinalizadaPec(selectedInstance);

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
                      ({turmaAlunos.length} no total{totalEvadidos > 0 ? `, ${totalEvadidos} evadido${totalEvadidos !== 1 ? 's' : ''}` : ''})
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
                    {searchEnrolled.trim() ? "Nenhum aluno encontrado com esse nome." : filterAlunos === "evadidos" ? "Nenhum aluno evadido nesta turma." : "Nenhum aluno matriculado nesta turma."}
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
                          const cpfRaw = (a.cpf || "").replace(/[^0-9]/g, "");
                          const alunoFreq = frequencias?.porAluno?.[cpfRaw] ?? null;
                          const pres = alunoFreq?.presencas ?? null;
                          const total = alunoFreq?.totalAulas ?? 0;
                          const pct = pres !== null && total > 0 ? Math.round((pres / total) * 100) : null;
                          const corBadge =
                            pct === null || total === 0 ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            : pct >= 85 ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : pct >= 60 ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            : "bg-red-100 text-red-700 hover:bg-red-200";
                          const isEvadido = isAlunoEvadidoPec(a);
                          const isTransicao = !isEvadido && a.enrollment_active === false && a.motivo_evasao === TRANSICAO_PEC_MOTIVO;
                          const dataEvasaoAluno = a.data_evasao_registro || a.data_evasao;
                          const saiuDaTurma = isEvadido || isTransicao || a.enrollment_active === false;
                          return (
                          <TableRow key={a.cpf} className={saiuDaTurma ? "bg-gray-50/80" : ""}>
                            <TableCell className="text-sm py-2">
                              {onClickAluno ? (
                                <button
                                  className="font-medium text-left text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                                  onClick={() => onClickAluno(a)}
                                >
                                  {a.nome_completo || a.nome || '—'}
                                </button>
                              ) : (
                                <div>{a.nome_completo || a.nome || '—'}</div>
                              )}
                              <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 shrink-0" />
                                {a.telefone || 'Não informado'}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm py-2 text-gray-500">{formatCPF(a.cpf)}</TableCell>
                            <TableCell className="py-2">
                              <button
                                onClick={() => setFreqModalAluno({ cpf: cpfRaw, nome: a.nome_completo || a.nome || "—" })}
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${corBadge}`}
                                title="Ver detalhe de frequência"
                              >
                                {pct !== null && total > 0 ? `${pct}% (${pres}/${total})` : total === 0 ? "Sem aulas" : "0%"}
                              </button>
                            </TableCell>
                            <TableCell className="py-2">
                              <SituacaoFormacaoBadge
                                situacao={getSituacaoFormacaoPec(turmaFinalizada, a)}
                              />
                            </TableCell>
                            <TableCell className="py-2">
                              {isEvadido ? (
                                <div>
                                  <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700">Evadido</Badge>
                                  {dataEvasaoAluno && (
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      {new Date(String(dataEvasaoAluno).slice(0, 10) + "T12:00:00").toLocaleDateString("pt-BR")}
                                    </p>
                                  )}
                                </div>
                              ) : isTransicao ? (
                                <div>
                                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Transição</Badge>
                                  <p className="text-xs text-gray-500 mt-0.5">{a.motivo_evasao}</p>
                                </div>
                              ) : a.enrollment_active === false ? (
                                <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700">Inativo</Badge>
                              ) : (
                                <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-100">Ativo</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right py-2">
                              {isEvadido || isTransicao || a.enrollment_active === false ? (
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
                                      setEvasaoAluno(a);
                                      setModoEvasaoDialog("evasao");
                                      setDataEvasao(new Date().toISOString().split("T")[0]);
                                      setShowEvasaoDialog(true);
                                    }}
                                  >
                                    <UserX className="w-3 h-3 mr-1" /> Evasão
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => { setDesligarModal({ cpf: a.cpf, nome: a.nome_completo || a.nome || "Aluno" }); setDesligarMotivo(""); }}
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
                              onClick={() => {
                                setDataIngressoPec(new Date().toISOString().split('T')[0]);
                                setPendingAddAlunoCpf({ cpf: a.cpf, nome: a.nome_completo || a.nome || a.cpf });
                              }}
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
            <AlertDialogTitle>{isTransicao ? "Transição para Inclusão" : "Registrar Evasão"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isTransicao
                ? <>Transferir <strong>{evasaoAluno?.nome_completo || evasaoAluno?.nome}</strong> para Inclusão Produtiva (não conta como evasão).</>
                : <>Informe a data de evasão de <strong>{evasaoAluno?.nome_completo || evasaoAluno?.nome}</strong>.</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-3 space-y-3">
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={modoEvasaoDialog === "evasao" ? "default" : "outline"} onClick={() => setModoEvasaoDialog("evasao")}>Evasão</Button>
              <Button type="button" size="sm" variant={modoEvasaoDialog === "transicao" ? "default" : "outline"} onClick={() => setModoEvasaoDialog("transicao")}>
                <ArrowRightLeft className="w-3 h-3 mr-1" /> Transição
              </Button>
            </div>
            {modoEvasaoDialog === "evasao" ? (
              <div>
                <Label htmlFor="dataEvasaoPec">Data de evasão</Label>
                <Input
                  id="dataEvasaoPec"
                  type="date"
                  value={dataEvasao}
                  onChange={e => setDataEvasao(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="mt-1"
                />
              </div>
            ) : (
              <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">O aluno será cadastrado na Inclusão Produtiva automaticamente.</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submittingEvasao}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarcarEvasao}
              disabled={submittingEvasao || (modoEvasaoDialog === "evasao" && !dataEvasao)}
              className={isTransicao ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"}
            >
              {submittingEvasao ? "Registrando..." : isTransicao ? "Confirmar Transição" : "Confirmar Evasão"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* Dialog: Data de Ingresso ao adicionar aluno PEC */}
      <Dialog open={!!pendingAddAlunoCpf} onOpenChange={(open) => { if (!open) setPendingAddAlunoCpf(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Data de Ingresso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Aluno</p>
              <p className="text-sm text-gray-900">{pendingAddAlunoCpf?.nome}</p>
            </div>
            <div>
              <Label htmlFor="dataIngressoPecInput">Data de ingresso na turma</Label>
              <Input
                id="dataIngressoPecInput"
                type="date"
                value={dataIngressoPec}
                onChange={(e) => setDataIngressoPec(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setPendingAddAlunoCpf(null)}>Cancelar</Button>
            <Button
              className="bg-green-500 hover:bg-green-600"
              disabled={!dataIngressoPec || !!addingAluno}
              onClick={() => {
                if (!pendingAddAlunoCpf) return;
                handleAddAluno(pendingAddAlunoCpf.cpf, dataIngressoPec);
                setPendingAddAlunoCpf(null);
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
          nomeTurma={selectedInstance?.title || selectedInstance?.nome || ""}
          tipo="pec"
          turmaId={selectedInstance?.id}
          cpf={freqModalAluno.cpf}
        />
      )}
    </>
  );
}
