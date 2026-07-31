import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart2,
  Clock,
  Loader2,
  MessageSquarePlus,
  Trash2,
  Brain,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FrequenciaModal } from "@/components/presenca/FrequenciaModal";

interface Props {
  cpf: string;
  nomeAluno?: string | null;
  participanteId?: number | null;
}

interface FrequenciaResumo {
  totalAulas: number;
  presencas: number;
  ausencias: number;
  percentual: number;
}

interface TurmaHistoricoItem {
  turmaId: number;
  nome: string;
  setor: "pec" | "inclusao";
  status: string;
  dataMatricula: string | null;
  dataInicio: string | null;
  dataFim: string | null;
  dataDesligamento: string | null;
  motivoEvasao: string | null;
  frequencia: FrequenciaResumo;
  participanteId?: number;
}

interface HistoricoResponse {
  cpf: string;
  nome: string | null;
  psico: {
    acompanhado: boolean;
    ultimoAtendimento: string | null;
    atendimentos?: Array<{
      id: number;
      data: string;
      tipo: string | null;
      resumo: string | null;
      fonte: string;
    }>;
  };
  turmas: { pec: TurmaHistoricoItem[]; inclusao: TurmaHistoricoItem[] };
  observacoes: Array<{
    id: number;
    autorNome: string;
    autorSetor: string;
    autorUserId: number | null;
    texto: string;
    createdAt: string;
  }>;
  timeline: Array<{
    id: string;
    data: string;
    tipo: string;
    setor: string;
    titulo: string;
    descricao?: string | null;
  }>;
}

const STATUS_LABELS: Record<string, string> = {
  cursando: "Cursando",
  formado: "Formado",
  evadido: "Evadido",
  reprovado: "Reprovado",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  cursando: "default",
  formado: "secondary",
  evadido: "destructive",
  reprovado: "outline",
};

function formatDate(data: string | null | undefined) {
  if (!data) return "—";
  try {
    return new Date(data + "T12:00:00").toLocaleDateString("pt-BR");
  } catch {
    return data;
  }
}

function corFrequencia(pct: number) {
  if (pct >= 85) return "text-green-700";
  if (pct >= 60) return "text-yellow-700";
  return "text-red-700";
}

function TurmaCard({
  turma,
  onVerFrequencia,
}: {
  turma: TurmaHistoricoItem;
  onVerFrequencia: (turma: TurmaHistoricoItem) => void;
}) {
  const pct = turma.frequencia.percentual;
  return (
    <div className="rounded-lg border p-3 space-y-2 bg-white">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-sm">{turma.nome}</p>
          <p className="text-xs text-muted-foreground">
            Matrícula: {formatDate(turma.dataMatricula)}
            {turma.dataFim ? ` · Fim: ${formatDate(turma.dataFim)}` : ""}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[turma.status] || "outline"}>
          {STATUS_LABELS[turma.status] || turma.status}
        </Badge>
      </div>
      {turma.motivoEvasao && (
        <p className="text-xs text-red-700">Motivo: {turma.motivoEvasao}</p>
      )}
      <div className="flex items-center justify-between text-sm">
        <span className={corFrequencia(pct)}>
          Frequência: {pct}% ({turma.frequencia.presencas}/{turma.frequencia.totalAulas} aulas)
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => onVerFrequencia(turma)}
        >
          <BarChart2 className="w-3.5 h-3.5 mr-1" />
          Detalhar
        </Button>
      </div>
    </div>
  );
}

export function AtendidoGritoHistorico({ cpf, nomeAluno, participanteId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: authSession } = useAuthSession();
  const currentUserId =
    typeof authSession?.id === "number"
      ? authSession.id
      : typeof authSession?.id === "string" && /^\d+$/.test(authSession.id)
        ? parseInt(authSession.id, 10)
        : null;
  const cpfDigits = cpf.replace(/\D/g, "");
  const [novaObs, setNovaObs] = useState("");
  const [freqModal, setFreqModal] = useState<{
    open: boolean;
    turma: TurmaHistoricoItem | null;
  }>({ open: false, turma: null });

  const { data, isLoading, error } = useQuery<HistoricoResponse>({
    queryKey: ["/api/atendidos-grito/historico", cpfDigits],
    queryFn: () => apiRequest(`/api/atendidos-grito/historico?cpf=${cpfDigits}`),
    enabled: cpfDigits.length === 11,
  });

  const createObsMutation = useMutation({
    mutationFn: (texto: string) =>
      apiRequest("/api/atendidos-grito/observacoes", {
        method: "POST",
        body: JSON.stringify({ cpf: cpfDigits, texto }),
      }),
    onSuccess: () => {
      setNovaObs("");
      queryClient.invalidateQueries({ queryKey: ["/api/atendidos-grito/historico", cpfDigits] });
      toast({ title: "Observação registrada" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    },
  });

  const deleteObsMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/atendidos-grito/observacoes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/atendidos-grito/historico", cpfDigits] });
      toast({ title: "Observação removida" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    },
  });

  if (cpfDigits.length !== 11) return null;

  return (
    <div className="mt-6 border-t pt-6 space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-blue-600" />
        <h3 className="text-base font-semibold text-gray-900">Histórico Unificado — Clube do Grito</h3>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Carregando histórico...
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">Não foi possível carregar o histórico.</p>
      )}

      {data && (
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="timeline" className="text-xs">Linha do tempo</TabsTrigger>
            <TabsTrigger value="pec" className="text-xs">
              <GraduationCap className="w-3 h-3 mr-1" />
              PEC ({data.turmas.pec.length})
            </TabsTrigger>
            <TabsTrigger value="inclusao" className="text-xs">
              <BookOpen className="w-3 h-3 mr-1" />
              Inclusão ({data.turmas.inclusao.length})
            </TabsTrigger>
            <TabsTrigger value="psico" className="text-xs">
              <Brain className="w-3 h-3 mr-1" />
              Psico
            </TabsTrigger>
            <TabsTrigger value="observacoes" className="text-xs">
              Observações ({data.observacoes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-3 space-y-2 max-h-72 overflow-y-auto">
            {data.timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum evento registrado.</p>
            ) : (
              data.timeline.map((ev) => (
                <div key={ev.id} className="flex gap-3 text-sm border-l-2 border-blue-200 pl-3 py-1">
                  <span className="text-xs text-muted-foreground whitespace-nowrap min-w-[72px]">
                    {formatDate(ev.data)}
                  </span>
                  <div>
                    <p className="font-medium">{ev.titulo}</p>
                    <p className="text-xs text-muted-foreground">{ev.setor}</p>
                    {ev.descricao && (
                      <p className="text-xs mt-0.5 text-gray-600">{ev.descricao}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="pec" className="mt-3 space-y-2">
            {data.turmas.pec.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem turmas no PEC.</p>
            ) : (
              data.turmas.pec.map((t) => (
                <TurmaCard
                  key={`pec-${t.turmaId}`}
                  turma={t}
                  onVerFrequencia={(turma) => setFreqModal({ open: true, turma })}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="inclusao" className="mt-3 space-y-2">
            {data.turmas.inclusao.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem turmas na Inclusão.</p>
            ) : (
              data.turmas.inclusao.map((t) => (
                <TurmaCard
                  key={`inc-${t.turmaId}`}
                  turma={t}
                  onVerFrequencia={(turma) => setFreqModal({ open: true, turma })}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="psico" className="mt-3 space-y-3">
            {data.psico.acompanhado ? (
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm">
                <p className="font-medium text-purple-900">Acompanhado pelo psicossocial</p>
                {data.psico.ultimoAtendimento && (
                  <p className="text-purple-800 mt-1">
                    Último atendimento: {formatDate(data.psico.ultimoAtendimento)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sem acompanhamento psicossocial registrado.</p>
            )}

            {data.psico.atendimentos && data.psico.atendimentos.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <p className="text-xs font-medium text-gray-700">Detalhes (equipe Psico)</p>
                {data.psico.atendimentos.map((a) => (
                  <div key={`${a.fonte}-${a.id}`} className="text-sm border rounded p-2">
                    <div className="flex justify-between gap-2">
                      <span className="font-medium">{formatDate(a.data)}</span>
                      <Badge variant="outline" className="text-[10px]">{a.tipo || a.fonte}</Badge>
                    </div>
                    {a.resumo && <p className="text-xs mt-1 text-gray-600">{a.resumo}</p>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="observacoes" className="mt-3 space-y-3">
            <div className="space-y-2">
              <Textarea
                placeholder="Nova observação cross-setor..."
                value={novaObs}
                onChange={(e) => setNovaObs(e.target.value)}
                rows={3}
                className="text-sm"
              />
              <Button
                type="button"
                size="sm"
                disabled={!novaObs.trim() || createObsMutation.isPending}
                onClick={() => createObsMutation.mutate(novaObs.trim())}
              >
                <MessageSquarePlus className="w-4 h-4 mr-1" />
                Adicionar observação
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {data.observacoes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma observação ainda.</p>
              ) : (
                data.observacoes.map((obs) => (
                  <div key={obs.id} className="border rounded p-3 text-sm bg-gray-50">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="font-medium">{obs.autorNome}</p>
                        <p className="text-xs text-muted-foreground">
                          {obs.autorSetor} · {formatDate(obs.createdAt.slice(0, 10))}
                        </p>
                      </div>
                      {currentUserId && obs.autorUserId === currentUserId && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-600"
                          onClick={() => deleteObsMutation.mutate(obs.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                    <p className="mt-2 text-gray-700 whitespace-pre-wrap">{obs.texto}</p>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {freqModal.turma && (
        <FrequenciaModal
          open={freqModal.open}
          onOpenChange={(open) => setFreqModal((s) => ({ ...s, open }))}
          nomeAluno={nomeAluno || data?.nome || "Aluno"}
          nomeTurma={freqModal.turma.nome}
          tipo={freqModal.turma.setor}
          turmaId={freqModal.turma.turmaId}
          cpf={cpfDigits}
          participanteId={
            freqModal.turma.participanteId ?? participanteId ?? undefined
          }
        />
      )}
    </div>
  );
}
