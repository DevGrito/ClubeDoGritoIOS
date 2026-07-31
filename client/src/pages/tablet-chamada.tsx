import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ScanFace,
  LogOut,
  Calendar,
  Users,
  CheckCircle,
  CheckCircle2,
  UserX,
  Loader2,
  ChevronLeft,
  AlertCircle,
  Clock,
  Utensils,
  Hand,
  Lock,
  User,
  Pencil,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TABLET_JUSTIFICATIVAS_MANUAL, JUSTIFICATIVA_SEM_FOTO, FALTA_JUSTIFICATIVAS_OPCOES } from "@shared/chamada-manual";
import { fetchAuthSessionAndSyncCache, logoutAndClearSession } from "@/lib/auth-session";
import { queryClient } from "@/lib/queryClient";
import { formatCPF } from "@/lib/utils";
import type { PresencaRegistrada } from "@/components/presenca/ScannerPresencaModal";
import ChamadaHistoricoList, {
  type ChamadaHistoricoRegistro,
} from "@/components/presenca/ChamadaHistoricoList";

const ScannerPresencaModal = lazy(() => import("@/components/presenca/ScannerPresencaModal"));

type Etapa = "selecao" | "scanner" | "manual" | "revisao";

interface TurmaItem {
  id: number;
  nome: string;
}

interface RosterAluno {
  id: number | string;
  cpf: string;
  nome: string;
  telefone?: string | null;
  fotoUrl?: string | null;
}

interface ManualPresencaItem {
  cpf: string;
  nome: string;
  presente: boolean;
  justificativa: string;
}

interface DiaDisponivel {
  date: string;
  label: string;
  futura: boolean;
}

const VERTENTE_LABEL: Record<string, string> = {
  pec: "PEC — Esporte-Cultura",
  inclusao: "Inclusão Produtiva",
};

function pecSessionToHistorico(session: any, turmaNome: string): ChamadaHistoricoRegistro {
  const attendance = Array.isArray(session.attendance) ? session.attendance : [];
  const presentes = attendance.filter((a: any) => a.presente === true || a.status === "presente").length;
  return {
    id: session.id,
    data: String(session.date || "").split("T")[0],
    turmaNome,
    totalPresentes: presentes,
    totalAlunos: session.enrolledCount || attendance.length,
    presencas: attendance.map((a: any) => ({
      nome: a.alunoNome,
      alunoNome: a.alunoNome,
      presente: a.presente === true || a.status === "presente",
      justificativa: a.justificativa,
    })),
    teveAlimentacao: session.teveAlimentacao,
  };
}

export default function TabletChamadaPage() {
  const [, setLocation] = useLocation();
  const [etapa, setEtapa] = useState<Etapa>("selecao");
  const [vertente, setVertente] = useState<"pec" | "inclusao" | null>(null);
  const [turmaId, setTurmaId] = useState("");
  const [chamadaData, setChamadaData] = useState("");
  const [presencasScan, setPresencasScan] = useState<PresencaRegistrada[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [erroDia, setErroDia] = useState("");
  const [sucessoMsg, setSucessoMsg] = useState("");
  const [authOk, setAuthOk] = useState(false);
  const [showHistoricoChamadas, setShowHistoricoChamadas] = useState(false);
  const [showAlimentacaoModal, setShowAlimentacaoModal] = useState(false);
  const [modoChamadaAtual, setModoChamadaAtual] = useState<"facial" | "manual">("facial");
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [senhaManual, setSenhaManual] = useState("");
  const [justificativaManual, setJustificativaManual] = useState("");
  const [observacaoManual, setObservacaoManual] = useState("");
  const [senhaManualErro, setSenhaManualErro] = useState("");
  const [validandoSenhaManual, setValidandoSenhaManual] = useState(false);
  const [manualPresencas, setManualPresencas] = useState<ManualPresencaItem[]>([]);
  /** turmaId:data — manual já ativado (senha validada) nesta sessão */
  const [manualAtivadoChave, setManualAtivadoChave] = useState<string | null>(null);
  /** Após facial: editando lista (presenças/faltas) sem virar chamada 100% manual */
  const [editandoFacial, setEditandoFacial] = useState(false);
  /** Remonta o scanner ao Refazer */
  const [scannerKey, setScannerKey] = useState(0);

  const chaveManualAtual =
    turmaId && chamadaData ? `${turmaId}:${chamadaData}` : null;

  const entrarModoManual = () => {
    setModoChamadaAtual("manual");
    setEditandoFacial(false);
    setShowManualDialog(false);
    setEtapa("manual");
  };

  useEffect(() => {
    (async () => {
      const session = await fetchAuthSessionAndSyncCache();
      if (!session || session.actorType !== "tablet_chamada") {
        setLocation("/tablet/chamada/login");
        return;
      }
      const v =
        (session.vertente as "pec" | "inclusao") ||
        (sessionStorage.getItem("tablet_chamada_vertente") as "pec" | "inclusao" | null) ||
        null;
      setVertente(v);
      setAuthOk(true);
    })();
  }, [setLocation]);

  const { data: turmasPayload, isLoading: loadingTurmas } = useQuery<{ vertente: string; turmas: TurmaItem[] }>({
    queryKey: ["/api/tablet-chamada/turmas", vertente],
    enabled: authOk && !!vertente,
    staleTime: 0,
    queryFn: async () => {
      const res = await fetch("/api/tablet-chamada/turmas", { credentials: "include", cache: "no-store" });
      if (!res.ok) throw new Error("Erro ao carregar turmas");
      const data = await res.json();
      if (Array.isArray(data)) return { vertente: vertente || "", turmas: data };
      return data;
    },
  });

  const turmas = turmasPayload?.turmas ?? [];
  const turmaNome = turmas.find((t) => String(t.id) === turmaId)?.nome || "Turma";

  const { data: diasPayload, isLoading: loadingDias } = useQuery<{
    hoje: string;
    dias: DiaDisponivel[];
  }>({
    queryKey: ["/api/tablet-chamada/dias-disponiveis", turmaId],
    enabled: authOk && !!turmaId && etapa === "selecao",
    staleTime: 0,
    queryFn: async () => {
      const res = await fetch(`/api/tablet-chamada/dias-disponiveis?turmaId=${turmaId}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Erro ao carregar dias");
      return res.json();
    },
  });

  const diasAula = diasPayload?.dias ?? [];

  const historicoQueryKey = ["/api/tablet-chamada/historico", vertente, turmaId];

  const { data: historicoChamadas = [], isLoading: loadingHistorico, refetch: refetchHistorico } = useQuery<
    ChamadaHistoricoRegistro[]
  >({
    queryKey: historicoQueryKey,
    enabled: authOk && !!turmaId && !!vertente && etapa === "selecao" && showHistoricoChamadas,
    staleTime: 0,
    queryFn: async () => {
      const res = await fetch(
        `/api/tablet-chamada/historico?turmaId=${encodeURIComponent(turmaId)}`,
        { credentials: "include", cache: "no-store" }
      );
      if (!res.ok) throw new Error("Erro ao carregar histórico");
      const data = await res.json();
      if (vertente === "pec") {
        return (Array.isArray(data) ? data : [])
          .map((s: any) => pecSessionToHistorico(s, turmaNome));
      }
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: roster = [], isLoading: loadingRoster } = useQuery<RosterAluno[]>({
    queryKey: ["/api/tablet-chamada/roster", turmaId],
    enabled:
      authOk &&
      !!turmaId &&
      (etapa === "selecao" || etapa === "revisao" || etapa === "manual" || etapa === "scanner"),
    queryFn: async () => {
      const res = await fetch(`/api/tablet-chamada/roster?turmaId=${turmaId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao carregar alunos");
      return res.json();
    },
  });

  useEffect(() => {
    if (etapa !== "manual" || roster.length === 0) return;
    setManualPresencas((prev) => {
      const prevMap = new Map(prev.map((p) => [p.cpf, p]));
      const presentesScan = editandoFacial
        ? new Set(presencasScan.map((p) => p.cpf.replace(/\D/g, "")))
        : null;
      return roster.map((a) => {
        const cpf = a.cpf.replace(/\D/g, "");
        const existing = prevMap.get(cpf);
        if (existing) return existing;
        return {
          cpf,
          nome: a.nome,
          presente: presentesScan ? presentesScan.has(cpf) : false,
          justificativa: "",
        };
      });
    });
  }, [etapa, roster, editandoFacial, presencasScan]);

  useEffect(() => {
    if (chaveManualAtual && manualAtivadoChave && manualAtivadoChave !== chaveManualAtual) {
      setManualAtivadoChave(null);
    }
  }, [chaveManualAtual, manualAtivadoChave]);

  const manualPresentesCount = useMemo(
    () => manualPresencas.filter((p) => p.presente).length,
    [manualPresencas]
  );

  const presentesSet = useMemo(() => {
    if (modoChamadaAtual === "manual" || editandoFacial) {
      return new Set(manualPresencas.filter((p) => p.presente).map((p) => p.cpf));
    }
    return new Set(presencasScan.map((p) => p.cpf.replace(/\D/g, "")));
  }, [modoChamadaAtual, editandoFacial, manualPresencas, presencasScan]);

  const presentesRevisao = useMemo(() => {
    if (modoChamadaAtual === "manual" || editandoFacial) {
      return manualPresencas.filter((p) => p.presente);
    }
    return roster.filter((a) => presentesSet.has(a.cpf.replace(/\D/g, "")));
  }, [modoChamadaAtual, editandoFacial, manualPresencas, roster, presentesSet]);

  const faltantesRevisao = useMemo(() => {
    if (modoChamadaAtual === "manual" || editandoFacial) {
      return manualPresencas.filter((p) => !p.presente);
    }
    return roster.filter((a) => !presentesSet.has(a.cpf.replace(/\D/g, "")));
  }, [modoChamadaAtual, editandoFacial, manualPresencas, roster, presentesSet]);

  const handleLogout = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/tablet-chamada/turmas"] });
    await logoutAndClearSession();
    sessionStorage.removeItem("tablet_chamada_auth");
    sessionStorage.removeItem("tablet_chamada_vertente");
    sessionStorage.removeItem("tablet_chamada_user");
    setLocation("/tablet/chamada/login");
  };

  const alunosSemFoto = useMemo(
    () => roster.filter((a) => !a.fotoUrl),
    [roster]
  );

  const handleConfirmar = async (teveAlimentacao: boolean) => {
    if (!vertente || !turmaId || !chamadaData) return;
    setSalvando(true);
    setErro("");
    setShowAlimentacaoModal(false);
    try {
      const body: Record<string, unknown> = {
        turmaId: parseInt(turmaId),
        data: chamadaData,
        teveAlimentacao,
        modoChamada: modoChamadaAtual,
        justificativa: modoChamadaAtual === "manual" ? justificativaManual : undefined,
        observacao: modoChamadaAtual === "manual" ? observacaoManual : undefined,
      };

      if (modoChamadaAtual === "manual" || editandoFacial) {
        const horaPorCpf = new Map(
          presencasScan.map((p) => [p.cpf.replace(/\D/g, ""), p.hora] as const)
        );
        body.presencas = manualPresencas.map((p) => ({
          cpf: p.cpf,
          presente: p.presente,
          horaEntrada: p.presente ? horaPorCpf.get(p.cpf) || undefined : undefined,
          justificativa: p.presente ? undefined : p.justificativa.trim() || "Sem justificativa",
        }));
      } else {
        body.presentes = presencasScan.map((p) => ({
          cpf: p.cpf,
          horaEntrada: p.hora,
        }));
      }

      const res = await fetch("/api/tablet-chamada/finalizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Erro ao registrar chamada.");
        return;
      }
      setChamadaData("");
      setPresencasScan([]);
      setManualPresencas([]);
      setModoChamadaAtual("facial");
      setEditandoFacial(false);
      setJustificativaManual("");
      setObservacaoManual("");
      setManualAtivadoChave(null);
      setEtapa("selecao");
      setSucessoMsg(`Chamada registrada com sucesso! ${data.count ?? ""} aluno(s) processado(s).`);
      await queryClient.invalidateQueries({ queryKey: ["/api/tablet-chamada/dias-disponiveis", turmaId] });
      await queryClient.invalidateQueries({ queryKey: historicoQueryKey });
    } catch {
      setErro("Erro de conexão ao salvar chamada.");
    } finally {
      setSalvando(false);
    }
  };

  const handleFazerChamada = () => {
    setErroDia("");
    const diaSel = diasAula.find((d) => d.date === chamadaData);
    if (diaSel?.futura) {
      setErroDia("Chamadas futuras não podem ser lançadas.");
      return;
    }
    setModoChamadaAtual("facial");
    setEditandoFacial(false);
    setPresencasScan([]);
    setScannerKey((k) => k + 1);
    setEtapa("scanner");
  };

  const entrarEdicaoAposFacial = (lista: PresencaRegistrada[]) => {
    setPresencasScan(lista);
    const presentes = new Set(lista.map((p) => p.cpf.replace(/\D/g, "")));
    setManualPresencas(
      roster.map((a) => {
        const cpf = a.cpf.replace(/\D/g, "");
        return {
          cpf,
          nome: a.nome,
          presente: presentes.has(cpf),
          justificativa: "",
        };
      })
    );
    setModoChamadaAtual("facial");
    setEditandoFacial(true);
    setErroDia("");
    setEtapa("manual");
  };

  const refazerChamadaFacial = () => {
    setPresencasScan([]);
    setManualPresencas([]);
    setEditandoFacial(false);
    setErro("");
    setErroDia("");
    setScannerKey((k) => k + 1);
    setEtapa("scanner");
  };

  const abrirChamadaManual = () => {
    setErroDia("");
    const diaSel = diasAula.find((d) => d.date === chamadaData);
    if (diaSel?.futura) {
      setErroDia("Chamadas futuras não podem ser lançadas.");
      return;
    }
    if (chaveManualAtual && manualAtivadoChave === chaveManualAtual) {
      entrarModoManual();
      return;
    }
    setSenhaManual("");
    setSenhaManualErro("");
    setObservacaoManual("");
    if (alunosSemFoto.length > 0) {
      setJustificativaManual(JUSTIFICATIVA_SEM_FOTO);
    } else {
      setJustificativaManual("");
    }
    setShowManualDialog(true);
  };

  const confirmarChamadaManual = async () => {
    if (!justificativaManual || !observacaoManual.trim() || !senhaManual.trim()) {
      setSenhaManualErro("Preencha senha, justificativa e observação.");
      return;
    }
    setValidandoSenhaManual(true);
    setSenhaManualErro("");
    try {
      const pinRes = await fetch("/api/tablet-chamada/validar-senha-manual", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha: senhaManual }),
      });
      const pinData = await pinRes.json();
      if (!pinRes.ok) {
        setSenhaManualErro(pinData.error || "Senha incorreta.");
        return;
      }
      const precisaRegistrar =
        chaveManualAtual && manualAtivadoChave !== chaveManualAtual;
      if (precisaRegistrar) {
        await fetch("/api/chamada-manual-log", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            turmaId: turmaId ? parseInt(turmaId) : null,
            data: chamadaData,
            motivo: justificativaManual,
            observacao: observacaoManual.trim(),
            vertente,
            origem: "tablet",
          }),
        });
        setManualAtivadoChave(chaveManualAtual);
      }
      setManualPresencas([]);
      entrarModoManual();
    } catch {
      setSenhaManualErro("Erro de conexão.");
    } finally {
      setValidandoSenhaManual(false);
    }
  };

  const irParaChamadaFacial = () => {
    setErroDia("");
    const diaSel = diasAula.find((d) => d.date === chamadaData);
    if (diaSel?.futura) {
      setErroDia("Chamadas futuras não podem ser lançadas.");
      return;
    }
    setModoChamadaAtual("facial");
    setEditandoFacial(false);
    setPresencasScan([]);
    setScannerKey((k) => k + 1);
    setEtapa("scanner");
  };

  const revisarChamadaManual = () => {
    const faltasSemJustif = manualPresencas.filter(
      (p) => !p.presente && !String(p.justificativa || "").trim()
    );
    if (faltasSemJustif.length > 0) {
      setErroDia("Selecione ou escreva a justificativa para todas as faltas.");
      return;
    }
    setErroDia("");
    setEtapa("revisao");
  };

  const atualizarManualPresenca = (cpf: string, patch: Partial<ManualPresencaItem>) => {
    setManualPresencas((prev) =>
      prev.map((p) => (p.cpf === cpf ? { ...p, ...patch } : p))
    );
  };

  const voltarDaRevisao = () => {
    if (editandoFacial || modoChamadaAtual === "manual") {
      setEtapa("manual");
      return;
    }
    setScannerKey((k) => k + 1);
    setEtapa("scanner");
  };

  if (!authOk) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <ScanFace className="w-6 h-6 text-green-500" />
          <div>
            <p className="font-bold text-sm leading-tight text-gray-900">Chamada O Grito</p>
            <p className="text-xs text-gray-500">{vertente ? VERTENTE_LABEL[vertente] : ""}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </header>

      {etapa === "selecao" && (
        <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                Controle de Presença
              </CardTitle>
              {turmaId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => {
                    setShowHistoricoChamadas(!showHistoricoChamadas);
                    if (!showHistoricoChamadas) refetchHistorico();
                  }}
                >
                  <Clock className="w-4 h-4 mr-1.5" />
                  {showHistoricoChamadas ? "Nova Chamada" : "Ver Histórico"}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!showHistoricoChamadas ? (
                <div className="space-y-4">
                  {sucessoMsg && (
                    <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg p-3 text-green-800 text-sm">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      {sucessoMsg}
                    </div>
                  )}

                  <div className="flex gap-4 items-end flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium mb-2">Turma</label>
                      {loadingTurmas ? (
                        <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Carregando turmas...
                        </div>
                      ) : turmas.length === 0 ? (
                        <p className="text-sm text-gray-500">Nenhuma turma ativa encontrada.</p>
                      ) : (
                        <Select
                          value={turmaId}
                          onValueChange={(v) => {
                            setTurmaId(v);
                            setChamadaData("");
                            setSucessoMsg("");
                            setErroDia("");
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a turma" />
                          </SelectTrigger>
                          <SelectContent>
                            {turmas.map((t) => (
                              <SelectItem key={t.id} value={String(t.id)}>
                                {t.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {turmaId && (
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium mb-2">Data da Aula</label>
                        {loadingDias ? (
                          <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Carregando dias...
                          </div>
                        ) : diasAula.length === 0 ? (
                          <p className="text-sm text-gray-500">Nenhum dia de aula disponível para chamada.</p>
                        ) : (
                          <>
                            <Select
                              value={chamadaData}
                              onValueChange={(v) => {
                                setChamadaData(v);
                                setErroDia("");
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a data" />
                              </SelectTrigger>
                              <SelectContent>
                                {diasAula.map((d) => (
                                  <SelectItem key={d.date} value={d.date}>
                                    {d.label}
                                    {d.futura ? " (próxima aula)" : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {erroDia && (
                              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm mt-2">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                {erroDia}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {turmaId && (
                    <div className="space-y-3">
                      <h3 className="font-medium text-gray-700">
                        Lista de Presença — {turmaNome}
                      </h3>
                      {loadingRoster ? (
                        <div className="text-center py-4 text-gray-500">Carregando participantes...</div>
                      ) : roster.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p>Nenhum participante nesta turma.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto">
                          {[...roster]
                            .sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"))
                            .map((aluno) => {
                              const semFoto = !aluno.fotoUrl;
                              return (
                                <div
                                  key={String(aluno.id)}
                                  className="flex items-center justify-between p-3 border rounded flex-wrap gap-2"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <Avatar className="h-10 w-10 shrink-0">
                                      {aluno.fotoUrl ? (
                                        <AvatarImage
                                          src={aluno.fotoUrl}
                                          alt={aluno.nome}
                                          className="object-cover"
                                        />
                                      ) : null}
                                      <AvatarFallback className="bg-orange-100 text-orange-600 text-sm font-semibold">
                                        {(aluno.nome || "?").charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <span className="font-medium text-sm">
                                        {aluno.nome}
                                        {semFoto && <span className="text-red-600 ml-1">*</span>}
                                      </span>
                                      <p className="text-xs text-gray-500">
                                        CPF: {aluno.cpf ? formatCPF(aluno.cpf) : "Não informado"}
                                        {aluno.telefone ? ` · ${aluno.telefone}` : ""}
                                      </p>
                                      {semFoto && (
                                        <p className="text-xs text-red-600 mt-0.5">
                                          Aluno sem foto no sistema, impossivel fazer chamada.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-gray-400 border-gray-200 shrink-0">
                                    Aguardando chamada
                                  </Badge>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  )}

                  {!turmaId && (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Selecione uma turma para fazer a chamada</p>
                    </div>
                  )}

                  <Button
                    className="w-full bg-green-500 hover:bg-green-600"
                    disabled={!turmaId || !chamadaData}
                    onClick={handleFazerChamada}
                  >
                    <ScanFace className="w-4 h-4 mr-2" />
                    Fazer chamada (facial)
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                    disabled={!turmaId || !chamadaData}
                    onClick={abrirChamadaManual}
                  >
                    <Hand className="w-4 h-4 mr-2" />
                    Chamada manual
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold">Histórico de Chamadas</h3>
                  <p className="text-sm text-gray-500">{turmaNome}</p>
                  <ChamadaHistoricoList
                    registros={historicoChamadas}
                    loading={loadingHistorico}
                    emptyMessage="Nenhuma chamada registrada para esta turma."
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      )}

      {etapa === "manual" && turmaId && chamadaData && (
        <main className="flex-1 p-4 max-w-3xl mx-auto w-full pb-8 space-y-4">
          {erroDia && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {erroDia}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg bg-gray-50 border">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              {editandoFacial ? (
                <>
                  <Pencil className="w-4 h-4 text-yellow-600 shrink-0" />
                  <span className="text-sm font-medium text-yellow-800">Editar chamada</span>
                  <span className="text-xs text-gray-500">
                    - Ajuste presença/falta e justifique ausências
                  </span>
                </>
              ) : (
                <>
                  <Hand className="w-4 h-4 text-orange-500 shrink-0" />
                  <span className="text-sm font-medium text-orange-700">Modo Manual</span>
                  <span className="text-xs text-gray-500">- Marque presença manualmente</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {editandoFacial ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  onClick={refazerChamadaFacial}
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Refazer facial
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold"
                    onClick={irParaChamadaFacial}
                  >
                    <ScanFace className="w-4 h-4 mr-1" />
                    Chamada O Grito
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                    onClick={() => {
                      setModoChamadaAtual("facial");
                      setEditandoFacial(false);
                      setManualPresencas([]);
                      setEtapa("selecao");
                    }}
                  >
                    <ScanFace className="w-4 h-4 mr-1" />
                    Voltar p/ Facial
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-1">
              Lista de Presença - {turmaNome}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {new Date(chamadaData + "T12:00:00").toLocaleDateString("pt-BR")}
              {!editandoFacial && (
                <>
                  <span className="mx-2 text-gray-300">·</span>
                  <span className="text-orange-700">{justificativaManual}</span>
                </>
              )}
              {editandoFacial && (
                <>
                  <span className="mx-2 text-gray-300">·</span>
                  <span className="text-yellow-700">
                    {manualPresentesCount} presente{manualPresentesCount !== 1 ? "s" : ""} do facial
                  </span>
                </>
              )}
            </p>

            {loadingRoster ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            ) : manualPresencas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>Nenhum aluno nesta turma.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...manualPresencas]
                  .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
                  .map((aluno) => (
                    <div
                      key={aluno.cpf}
                      className="flex flex-col gap-2 p-3 border rounded-lg bg-white"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <User className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="font-medium text-sm text-gray-900">{aluno.nome}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`presenca-${aluno.cpf}`}
                              checked={aluno.presente === true}
                              onChange={() =>
                                atualizarManualPresenca(aluno.cpf, {
                                  presente: true,
                                  justificativa: "",
                                })
                              }
                              className="w-4 h-4 text-green-600"
                            />
                            <span className="text-sm text-green-600">Presente</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`presenca-${aluno.cpf}`}
                              checked={aluno.presente === false}
                              onChange={() =>
                                atualizarManualPresenca(aluno.cpf, { presente: false })
                              }
                              className="w-4 h-4 text-red-600"
                            />
                            <span className="text-sm text-red-600">Falta</span>
                          </label>
                        </div>
                      </div>

                      {!aluno.presente && (
                        <div className="w-full space-y-2 pl-7">
                          <div className="flex flex-wrap gap-1">
                            {FALTA_JUSTIFICATIVAS_OPCOES.map((opcao) => (
                              <button
                                key={opcao}
                                type="button"
                                onClick={() =>
                                  atualizarManualPresenca(aluno.cpf, { justificativa: opcao })
                                }
                                className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                                  opcao === "Sem justificativa"
                                    ? aluno.justificativa === opcao
                                      ? "bg-red-100 border-red-400 text-red-700"
                                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                                    : aluno.justificativa === opcao
                                      ? "bg-blue-100 border-blue-400 text-blue-700"
                                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                                }`}
                              >
                                {opcao}
                              </button>
                            ))}
                          </div>
                          <Input
                            placeholder="Ou escreva a justificativa..."
                            value={aluno.justificativa || ""}
                            onChange={(e) =>
                              atualizarManualPresenca(aluno.cpf, {
                                justificativa: e.target.value,
                              })
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}

            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 mt-6"
              disabled={loadingRoster || manualPresencas.length === 0}
              onClick={revisarChamadaManual}
            >
              Revisar chamada ({manualPresentesCount} presente
              {manualPresentesCount !== 1 ? "s" : ""})
            </Button>
          </div>
        </main>
      )}

      {etapa === "scanner" && turmaId && chamadaData && vertente && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
            </div>
          }
        >
          <ScannerPresencaModal
            key={scannerKey}
            turmaId={turmaId}
            tipo={vertente}
            data={chamadaData}
            modoLocal
            bloquearFechar
            onClose={() => {
              setEditandoFacial(false);
              setEtapa("selecao");
            }}
            onFinalizeComPresencas={(lista) => {
              setPresencasScan(lista);
              setEditandoFacial(false);
              setEtapa("revisao");
            }}
            onEditarComPresencas={entrarEdicaoAposFacial}
            onRefazer={refazerChamadaFacial}
            finalizeButtonLabel="Finalizar"
          />
        </Suspense>
      )}

      {etapa === "revisao" && (
        <main className="flex-1 p-4 max-w-2xl mx-auto w-full pb-8">
          <button
            onClick={voltarDaRevisao}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            {modoChamadaAtual === "manual"
              ? "Voltar à lista"
              : editandoFacial
                ? "Voltar à edição"
                : "Voltar ao scanner"}
          </button>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Confirmar chamada</CardTitle>
              <p className="text-sm text-gray-500 font-normal">
                {turmaNome} — {new Date(chamadaData + "T12:00:00").toLocaleDateString("pt-BR")}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {erro && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {erro}
                </div>
              )}

              {loadingRoster ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Presentes ({presentesRevisao.length})
                    </p>
                    {presentesRevisao.length === 0 ? (
                      <p className="text-sm text-gray-400">Nenhum aluno presente.</p>
                    ) : (
                      <div className="grid gap-1.5 max-h-48 overflow-y-auto">
                        {presentesRevisao.map((a) => {
                          const nome = "nome" in a ? a.nome : (a as RosterAluno).nome;
                          const cpf = "cpf" in a ? a.cpf : (a as RosterAluno).cpf;
                          const cpfNorm = cpf.replace(/\D/g, "");
                          const scan = presencasScan.find(
                            (p) => p.cpf.replace(/\D/g, "") === cpfNorm
                          );
                          return (
                            <div
                              key={cpf}
                              className="flex items-center justify-between py-1.5 px-2 rounded text-sm bg-green-50 gap-2"
                            >
                              <span className="font-medium min-w-0 truncate">{nome}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                {scan?.hora && (
                                  <span className="text-xs text-green-700 font-semibold">{scan.hora}</span>
                                )}
                                {modoChamadaAtual === "facial" && !editandoFacial && (
                                  <button
                                    type="button"
                                    title="Remover presença (marcado por engano)"
                                    className="text-xs text-red-600 hover:text-red-800 font-medium px-1.5 py-0.5 rounded hover:bg-red-100"
                                    onClick={() => {
                                      setPresencasScan((prev) =>
                                        prev.filter((p) => p.cpf.replace(/\D/g, "") !== cpfNorm)
                                      );
                                    }}
                                  >
                                    Remover
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <UserX className="w-3.5 h-3.5" />
                      Faltantes ({faltantesRevisao.length})
                    </p>
                    {faltantesRevisao.length === 0 ? (
                      <p className="text-sm text-gray-400">Todos os alunos estão presentes.</p>
                    ) : (
                      <div className="grid gap-1.5 max-h-48 overflow-y-auto">
                        {faltantesRevisao.map((a) => {
                          const nome = "nome" in a ? a.nome : (a as RosterAluno).nome;
                          const cpf = "cpf" in a ? a.cpf : (a as RosterAluno).cpf;
                          const justif =
                            (modoChamadaAtual === "manual" || editandoFacial) &&
                            "justificativa" in a
                              ? (a as ManualPresencaItem).justificativa
                              : null;
                          const rosterAluno = roster.find(
                            (r) => r.cpf.replace(/\D/g, "") === cpf.replace(/\D/g, "")
                          );
                          return (
                            <div key={cpf} className="py-1.5 px-2 rounded text-sm bg-red-50">
                              <span className="font-medium text-gray-800">{nome}</span>
                              {justif && (
                                <p className="text-xs text-red-600 mt-0.5">{justif}</p>
                              )}
                              {!justif &&
                                !rosterAluno?.fotoUrl &&
                                modoChamadaAtual === "facial" &&
                                !editandoFacial && (
                                <p className="text-xs text-red-600 mt-0.5">
                                  Aluno sem foto no sistema, impossivel fazer chamada.
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={voltarDaRevisao} disabled={salvando}>
                  Voltar
                </Button>
                <Button
                  className="flex-1 bg-green-500 hover:bg-green-600"
                  onClick={() => setShowAlimentacaoModal(true)}
                  disabled={salvando || loadingRoster}
                >
                  {salvando ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Confirmar chamada"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      )}

      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hand className="w-5 h-5 text-orange-500" />
              Chamada manual
            </DialogTitle>
            <DialogDescription>
              Informe a senha do coordenador, a justificativa e uma observação. O registro ficará disponível para auditoria.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Justificativa *</label>
              <Select value={justificativaManual} onValueChange={setJustificativaManual}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {TABLET_JUSTIFICATIVAS_MANUAL.map((j) => (
                    <SelectItem key={j} value={j}>
                      {j}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Observação *</label>
              <Textarea
                value={observacaoManual}
                onChange={(e) => setObservacaoManual(e.target.value)}
                placeholder="Descreva o ocorrido..."
                className="h-20 resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Senha do coordenador *
              </label>
              <Input
                type="password"
                value={senhaManual}
                onChange={(e) => {
                  setSenhaManual(e.target.value);
                  setSenhaManualErro("");
                }}
                autoComplete="off"
              />
            </div>
            {senhaManualErro && (
              <p className="text-sm text-red-600">{senhaManualErro}</p>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowManualDialog(false)} disabled={validandoSenhaManual}>
              Cancelar
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600"
              disabled={
                validandoSenhaManual ||
                !justificativaManual ||
                !observacaoManual.trim() ||
                !senhaManual.trim()
              }
              onClick={confirmarChamadaManual}
            >
              {validandoSenhaManual ? "Validando..." : "Confirmar e abrir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAlimentacaoModal} onOpenChange={setShowAlimentacaoModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-orange-500" />
              Alimentação na Chamada
            </DialogTitle>
            <DialogDescription>
              Houve distribuição de lanche nesta chamada? Cada aluno presente conta como 1 lanche.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => handleConfirmar(true)}
              disabled={salvando}
            >
              <Utensils className="w-4 h-4 mr-2" />
              Sim, teve lanche
            </Button>
            <Button
              variant="outline"
              onClick={() => handleConfirmar(false)}
              disabled={salvando}
            >
              Não teve lanche
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
