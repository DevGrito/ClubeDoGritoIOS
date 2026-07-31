import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { authFetch, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CalendarHeart, Check, Loader2, Plus, Search, X, UserX, Trash2, Percent, Clock, MapPin, CalendarDays, Repeat, ChevronDown, ChevronUp } from "lucide-react";

type Status = "agendado" | "realizado" | "faltou" | "cancelado" | "reagendado";

interface Acolhimento {
  id: number;
  alunoCpf: string;
  alunoNome: string;
  data: string;
  horaInicio: string;
  horaFim?: string | null;
  local?: string | null;
  profissionalNome?: string | null;
  status: Status;
  observacaoInterna?: string | null;
  serieId?: string | null;
}

interface Props {
  userId: string | number;
  userRole: string;
  userName?: string;
  /** Filtro inicial da agenda (ex.: push com ?filtro=pendentes) */
  initialFiltro?: "proximos" | "historico" | "cancelados" | "pendentes" | "todos";
}

const STATUS_LABEL: Record<Status, string> = {
  agendado: "Agendado",
  realizado: "Realizado",
  faltou: "Faltou",
  cancelado: "Cancelado",
  reagendado: "Reagendado",
};

const STATUS_CLASS: Record<Status, string> = {
  agendado: "bg-sky-100 text-sky-800 border-sky-200",
  realizado: "bg-emerald-100 text-emerald-800 border-emerald-200",
  faltou: "bg-rose-100 text-rose-800 border-rose-200",
  cancelado: "bg-slate-100 text-slate-600 border-slate-200",
  reagendado: "bg-orange-100 text-orange-800 border-orange-200",
};

const STATUS_ACCENT: Record<Status, string> = {
  agendado: "border-l-sky-500",
  realizado: "border-l-emerald-500",
  faltou: "border-l-rose-500",
  cancelado: "border-l-slate-400",
  reagendado: "border-l-orange-500",
};

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function fmtCpf(cpf?: string | null) {
  const d = onlyDigits(cpf || "");
  if (d.length !== 11) return cpf || "—";
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function fmtData(d?: string | null) {
  if (!d) return "—";
  const s = String(d).split("T")[0];
  const [y, m, day] = s.split("-");
  if (!y || !m || !day) return s;
  return `${day}/${m}/${y}`;
}

function fmtHora(h?: string | null) {
  if (!h) return "";
  return String(h).slice(0, 5);
}

const EMPTY = {
  alunoCpf: "",
  alunoNome: "",
  data: "",
  horaInicio: "",
  horaFim: "",
  local: "",
  observacaoInterna: "",
  recorrente: false,
  dataFim: "",
};

const DIAS_SEMANA_LABEL = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

function diaSemanaDaData(dataStr: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) return null;
  const [y, m, d] = dataStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d, 12, 0, 0);
  return DIAS_SEMANA_LABEL[dt.getDay()] || null;
}

function contarOcorrenciasSemanais(dataInicio: string, dataFim: string): number {
  if (!dataInicio || !dataFim || dataFim < dataInicio) return 0;
  const [y0, m0, d0] = dataInicio.split("-").map(Number);
  const cursor = new Date(y0, m0 - 1, d0, 12, 0, 0);
  const [yf, mf, df] = dataFim.split("-").map(Number);
  const fim = new Date(yf, mf - 1, df, 12, 0, 0);
  let n = 1;
  while (true) {
    cursor.setDate(cursor.getDate() + 7);
    if (cursor > fim) break;
    n++;
  }
  return n;
}

type FreqAluno = {
  alunoCpf: string;
  alunoNome: string;
  compareceu: number;
  faltas: number;
  total: number;
  percentual: number;
  ultimo?: Acolhimento;
  proximo?: Acolhimento;
};

function freqCorClass(pct: number) {
  if (pct >= 90) return { text: "text-green-600", bar: "bg-green-500", badge: "bg-green-100 text-green-800 border-green-200" };
  if (pct >= 85) return { text: "text-yellow-600", bar: "bg-yellow-400", badge: "bg-yellow-100 text-yellow-900 border-yellow-300" };
  return { text: "text-red-600", bar: "bg-red-500", badge: "bg-red-100 text-red-800 border-red-200" };
}

export default function PsicoAcolhimentosSection({ userId, userRole, userName, initialFiltro }: Props) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"agenda" | "frequencia">("agenda");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [buscaAluno, setBuscaAluno] = useState("");
  const [filtro, setFiltro] = useState<"proximos" | "historico" | "cancelados" | "pendentes" | "todos">(
    initialFiltro || "proximos"
  );
  const [listaBusca, setListaBusca] = useState("");
  const [freqBusca, setFreqBusca] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  const [serieAcao, setSerieAcao] = useState<{ serieId: string; tipo: "cancelar" | "excluir" } | null>(null);
  const [acoesExpandidasId, setAcoesExpandidasId] = useState<number | null>(null);

  const { data: acolhimentos = [], isLoading } = useQuery<Acolhimento[]>({
    queryKey: ["/api/psico/acolhimentos"],
    queryFn: async () => {
      const res = await authFetch("/api/psico/acolhimentos");
      if (!res.ok) throw new Error("Erro ao carregar acolhimentos");
      const json = await res.json();
      return json.data || json || [];
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const refreshAcolhimentos = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/psico/acolhimentos"] });
    await queryClient.refetchQueries({ queryKey: ["/api/psico/acolhimentos"] });
  };

  const { data: alunosLista = [], isLoading: loadingAlunos } = useQuery<any[]>({
    queryKey: ["/api/psico/todos-atendidos-para-atendimento"],
    queryFn: async () => {
      const res = await authFetch("/api/psico/todos-atendidos-para-atendimento");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: showForm,
  });

  const alunos = useMemo(() => {
    const list = (alunosLista || []) as any[];
    const q = buscaAluno.trim().toLowerCase();
    const qDigits = onlyDigits(q);

    // Unifica por CPF (ou por id se não tiver CPF válido) e junta as origens
    const byKey = new Map<string, any>();
    for (const a of list) {
      const cpf = onlyDigits(a.cpf || "");
      const key = cpf.length === 11 ? `cpf:${cpf}` : `id:${a.origem || "x"}:${a.id}`;
      const origemLabel =
        a.origem === "pec" ? "PEC" : a.origem === "inclusao" ? "Inclusão Produtiva" : a.origem === "comunidade" ? "Comunidade" : a.origem || "";
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, {
          ...a,
          cpf: cpf.length === 11 ? cpf : a.cpf || "",
          nome: a.nome || "",
          origens: origemLabel ? [origemLabel] : [],
        });
      } else {
        if (origemLabel && !existing.origens.includes(origemLabel)) {
          existing.origens.push(origemLabel);
        }
        if (!existing.nome && a.nome) existing.nome = a.nome;
        if (cpf.length === 11) existing.cpf = cpf;
      }
    }

    let merged = Array.from(byKey.values());
    if (q) {
      merged = merged.filter((a) => {
        const nome = (a.nome || "").toLowerCase();
        const cpf = onlyDigits(a.cpf || "");
        return nome.includes(q) || (qDigits.length > 0 && cpf.includes(qDigits));
      });
    }
    return merged.slice(0, 30);
  }, [alunosLista, buscaAluno]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const cpf = onlyDigits(form.alunoCpf);
      if (cpf.length !== 11) throw new Error("Selecione um aluno com CPF válido");
      if (!form.alunoNome.trim()) throw new Error("Nome do aluno obrigatório");
      if (!form.data) throw new Error("Data obrigatória");
      if (!form.horaInicio) throw new Error("Horário obrigatório");
      if (form.recorrente && !form.dataFim) throw new Error("Informe a data fim da recorrência");
      if (form.recorrente && form.dataFim < form.data) {
        throw new Error("Data fim deve ser igual ou posterior à data início");
      }

      const res = await authFetch("/api/psico/acolhimentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alunoCpf: cpf,
          alunoNome: form.alunoNome.trim(),
          data: form.data,
          horaInicio: form.horaInicio,
          horaFim: form.horaFim || null,
          local: form.local || null,
          observacaoInterna: form.observacaoInterna || null,
          profissionalNome: userName || null,
          recorrente: form.recorrente,
          dataFim: form.recorrente ? form.dataFim : null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || json.message || "Falha ao agendar");
      return json;
    },
    onSuccess: async (json: any) => {
      const total = Number(json?.total || 1);
      toast({
        title: total > 1 ? `${total} acolhimentos agendados` : "Acolhimento agendado",
        description:
          total > 1
            ? "Criados no mesmo dia da semana, até a data fim."
            : undefined,
      });
      setForm({ ...EMPTY });
      setBuscaAluno("");
      setShowForm(false);
      // Série recorrente: vai para Todos para já enxergar todos os dias criados
      if (total > 1) setFiltro("todos");
      await refreshAcolhimentos();
    },
    onError: (e: any) => {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: Status }) => {
      const res = await authFetch(`/api/psico/acolhimentos/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || json.message || "Falha ao atualizar");
      return json;
    },
    onSuccess: async (_d, vars) => {
      toast({
        title:
          vars.status === "realizado"
            ? "Marcado como realizado — registre o atendimento se necessário"
            : vars.status === "cancelado"
              ? "Cancelado — continua visível aqui e o aluno vê o aviso de cancelamento"
              : `Status: ${STATUS_LABEL[vars.status]}`,
      });
      // Atualiza cache na hora (sem esperar refetch)
      queryClient.setQueryData<Acolhimento[]>(["/api/psico/acolhimentos"], (old) =>
        (old || []).map((a) => (a.id === vars.id ? { ...a, status: vars.status } : a))
      );
      await refreshAcolhimentos();
    },
    onError: (e: any) => {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await authFetch(`/api/psico/acolhimentos/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || json.message || "Falha ao excluir");
      return json;
    },
    onSuccess: async (_d, id) => {
      toast({ title: "Excluído", description: "Removido da sua lista e do portal do aluno." });
      setExcluindoId(null);
      queryClient.setQueryData<Acolhimento[]>(["/api/psico/acolhimentos"], (old) =>
        (old || []).filter((a) => a.id !== id)
      );
      await refreshAcolhimentos();
    },
    onError: (e: any) => {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    },
  });

  const serieMutation = useMutation({
    mutationFn: async ({ serieId, tipo }: { serieId: string; tipo: "cancelar" | "excluir" }) => {
      const res =
        tipo === "cancelar"
          ? await authFetch(`/api/psico/acolhimentos/serie/${encodeURIComponent(serieId)}/cancelar`, {
              method: "PATCH",
            })
          : await authFetch(`/api/psico/acolhimentos/serie/${encodeURIComponent(serieId)}`, {
              method: "DELETE",
            });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || json.message || "Falha na série");
      return { ...json, tipo };
    },
    onSuccess: async (json) => {
      const total = json.total ?? 0;
      toast({
        title: json.tipo === "cancelar" ? "Série cancelada" : "Série excluída",
        description:
          json.tipo === "cancelar"
            ? `${total} encontro(s) aberto(s) cancelado(s). Histórico (realizado/faltou) preservado.`
            : `${total} encontro(s) aberto(s) removido(s). Histórico preservado.`,
      });
      setSerieAcao(null);
      await refreshAcolhimentos();
    },
    onError: (e: any) => {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    },
  });

  const hoje = new Date().toISOString().split("T")[0];

  const filtrados = useMemo(() => {
    let list = [...acolhimentos];
    if (filtro === "proximos") {
      list = list.filter((a) => {
        if (a.status !== "agendado" && a.status !== "reagendado") return false;
        const data = String(a.data).split("T")[0];
        return data >= hoje;
      });
    } else if (filtro === "pendentes") {
      // Passou o dia e ainda sem realizado/faltou
      list = list.filter((a) => {
        if (a.status !== "agendado" && a.status !== "reagendado") return false;
        const data = String(a.data).split("T")[0];
        return data < hoje;
      });
    } else if (filtro === "cancelados") {
      list = list.filter((a) => a.status === "cancelado");
    } else if (filtro === "historico") {
      list = list.filter((a) => a.status === "realizado" || a.status === "faltou");
    }
    const q = listaBusca.trim().toLowerCase();
    if (q) {
      const qDigits = onlyDigits(q);
      list = list.filter((a) => {
        const nomeMatch = (a.alunoNome || "").toLowerCase().includes(q);
        const cpfMatch =
          qDigits.length > 0 && onlyDigits(a.alunoCpf || "").includes(qDigits);
        return nomeMatch || cpfMatch;
      });
    }
    if (filtroData) {
      list = list.filter((a) => String(a.data).split("T")[0] === filtroData);
    }
    return list.sort((a, b) => {
      const ka = `${String(a.data).split("T")[0]}T${a.horaInicio || "00:00"}`;
      const kb = `${String(b.data).split("T")[0]}T${b.horaInicio || "00:00"}`;
      return filtro === "historico" || filtro === "cancelados" || filtro === "pendentes"
        ? kb.localeCompare(ka)
        : ka.localeCompare(kb);
    });
  }, [acolhimentos, filtro, listaBusca, filtroData, hoje]);

  const countPendentes = useMemo(
    () =>
      acolhimentos.filter((a) => {
        if (a.status !== "agendado" && a.status !== "reagendado") return false;
        return String(a.data).split("T")[0] < hoje;
      }).length,
    [acolhimentos, hoje]
  );

  const frequenciasAlunos = useMemo(() => {
    const byCpf = new Map<string, Acolhimento[]>();
    for (const a of acolhimentos) {
      const cpf = onlyDigits(a.alunoCpf || "");
      if (!cpf) continue;
      if (!byCpf.has(cpf)) byCpf.set(cpf, []);
      byCpf.get(cpf)!.push(a);
    }

    const rows: FreqAluno[] = [];
    for (const [cpf, items] of byCpf) {
      const concluidos = items.filter((a) => a.status === "realizado" || a.status === "faltou");
      // Só lista quem já tem pelo menos 1 concluído (senão % não faz sentido)
      if (concluidos.length === 0) continue;

      const compareceu = concluidos.filter((a) => a.status === "realizado").length;
      const faltas = concluidos.filter((a) => a.status === "faltou").length;
      const total = concluidos.length;
      const percentual = Math.round((compareceu / total) * 100);

      const sortedDesc = [...concluidos].sort((a, b) => {
        const ka = `${String(a.data).split("T")[0]}T${a.horaInicio || "00:00"}`;
        const kb = `${String(b.data).split("T")[0]}T${b.horaInicio || "00:00"}`;
        return kb.localeCompare(ka);
      });
      const futuro = items
        .filter((a) => {
          if (a.status !== "agendado" && a.status !== "reagendado") return false;
          return String(a.data).split("T")[0] >= hoje;
        })
        .sort((a, b) => {
          const ka = `${String(a.data).split("T")[0]}T${a.horaInicio || "00:00"}`;
          const kb = `${String(b.data).split("T")[0]}T${b.horaInicio || "00:00"}`;
          return ka.localeCompare(kb);
        });

      const nome =
        items.find((a) => a.alunoNome)?.alunoNome ||
        sortedDesc[0]?.alunoNome ||
        "—";

      rows.push({
        alunoCpf: cpf,
        alunoNome: nome,
        compareceu,
        faltas,
        total,
        percentual,
        ultimo: sortedDesc[0],
        proximo: futuro[0],
      });
    }

    const q = freqBusca.trim().toLowerCase();
    const qDigits = onlyDigits(q);
    let filtered = rows;
    if (q) {
      filtered = rows.filter((r) => {
        const nomeMatch = (r.alunoNome || "").toLowerCase().includes(q);
        const cpfMatch = qDigits.length > 0 && r.alunoCpf.includes(qDigits);
        return nomeMatch || cpfMatch;
      });
    }

    return filtered.sort((a, b) => {
      if (a.percentual !== b.percentual) return a.percentual - b.percentual;
      return (a.alunoNome || "").localeCompare(b.alunoNome || "", "pt-BR");
    });
  }, [acolhimentos, freqBusca, hoje]);

  const abrirAgendaDoAluno = (cpf: string, nome: string) => {
    setViewMode("agenda");
    setFiltro("todos");
    setListaBusca(nome || cpf);
    setFiltroData("");
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-yellow-200/80 shadow-sm">
        <CardHeader className="pb-3 bg-gradient-to-br from-yellow-50/80 via-white to-white border-b border-yellow-100">
          <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
            <span className="flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400 text-black shadow-sm shadow-yellow-400/30">
                <CalendarHeart className="w-4 h-4" />
              </span>
              <span className="text-lg tracking-tight">Acolhimentos</span>
            </span>
            {viewMode === "agenda" && (
              <Button
                onClick={() => setShowForm((v) => !v)}
                className="bg-yellow-400 text-black hover:bg-yellow-500 shadow-sm shadow-yellow-400/25"
                data-testid="button-novo-acolhimento"
              >
                <Plus className="w-4 h-4 mr-1" />
                Agendar
              </Button>
            )}
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
            {viewMode === "agenda"
              ? "Agenda visível ao aluno no portal (data, horário e local). Conteúdo clínico continua só nos registros."
              : "Frequência por aluno com base nos acolhimentos marcados como realizado ou faltou."}
          </p>
          <div className="inline-flex p-1 mt-3 rounded-xl bg-slate-100/90 border border-slate-200/80 w-full sm:w-auto">
            <button
              type="button"
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === "agenda"
                  ? "bg-white text-yellow-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              onClick={() => setViewMode("agenda")}
              data-testid="tab-acolhimentos-agenda"
            >
              <CalendarHeart className="w-3.5 h-3.5" />
              Agenda
            </button>
            <button
              type="button"
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === "frequencia"
                  ? "bg-white text-yellow-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              onClick={() => {
                setViewMode("frequencia");
                setShowForm(false);
              }}
              data-testid="tab-acolhimentos-frequencia"
            >
              <Percent className="w-3.5 h-3.5" />
              Frequência
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          {viewMode === "frequencia" ? (
            <>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-9 h-10 bg-slate-50/80 border-slate-200 focus-visible:ring-yellow-400/40"
                  placeholder="Buscar aluno por nome ou CPF..."
                  value={freqBusca}
                  onChange={(e) => setFreqBusca(e.target.value)}
                  data-testid="input-busca-freq-acolhimento"
                />
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                  Carregando...
                </div>
              ) : frequenciasAlunos.length === 0 ? (
                <div className="text-center text-slate-400 py-12 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                  {freqBusca.trim()
                    ? "Nenhum aluno encontrado com essa busca."
                    : "Ainda não há acolhimentos concluídos (realizado/faltou) para calcular frequência."}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {frequenciasAlunos.map((f) => {
                    const cores = freqCorClass(f.percentual);
                    return (
                      <button
                        key={f.alunoCpf}
                        type="button"
                        className="w-full text-left rounded-xl border border-slate-200 bg-white p-4 hover:border-yellow-300 hover:shadow-md hover:shadow-yellow-400/10 transition-all group"
                        onClick={() => abrirAgendaDoAluno(f.alunoCpf, f.alunoNome)}
                        data-testid={`card-freq-acolhimento-${f.alunoCpf}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate group-hover:text-yellow-800">
                              {f.alunoNome}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5 tabular-nums">{fmtCpf(f.alunoCpf)}</p>
                          </div>
                          <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${cores.badge}`}>
                            {f.percentual}%
                          </span>
                        </div>

                        <div className="flex items-end gap-3 mt-3">
                          <p className={`text-3xl font-bold leading-none tabular-nums ${cores.text}`}>
                            {f.percentual}
                            <span className="text-base font-semibold">%</span>
                          </p>
                          <div className="flex-1 pb-1">
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${cores.bar}`}
                                style={{ width: `${f.percentual}%` }}
                              />
                            </div>
                            <div className="flex justify-between mt-1.5 text-[11px] text-slate-500">
                              <span>{f.compareceu} compareceu</span>
                              <span>{f.faltas} faltas</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-500">
                          {f.ultimo && (
                            <p>
                              Último: {fmtData(f.ultimo.data)}
                              {f.ultimo.horaInicio ? ` às ${fmtHora(f.ultimo.horaInicio)}` : ""}
                              {" · "}
                              {STATUS_LABEL[f.ultimo.status] || f.ultimo.status}
                            </p>
                          )}
                          {f.proximo ? (
                            <p className="text-yellow-700 font-medium">
                              Próximo: {fmtData(f.proximo.data)}
                              {f.proximo.horaInicio ? ` às ${fmtHora(f.proximo.horaInicio)}` : ""}
                              {f.proximo.local ? ` · ${f.proximo.local}` : ""}
                            </p>
                          ) : (
                            <p className="text-slate-400">Sem próximo agendado</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
          {showForm && (
            <div className="border border-yellow-200/80 bg-gradient-to-br from-yellow-50/70 to-white rounded-xl p-4 space-y-3 shadow-sm">
              <div className="space-y-1 relative">
                <Label>Aluno</Label>
                <Input
                  placeholder="Buscar por nome ou CPF..."
                  value={form.alunoNome || buscaAluno}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, alunoNome: "", alunoCpf: "" }));
                    setBuscaAluno(e.target.value);
                  }}
                  data-testid="input-busca-aluno-acolhimento"
                />
                {buscaAluno && !form.alunoCpf && (
                  <div className="absolute z-20 w-full bg-white border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {loadingAlunos ? (
                      <p className="px-3 py-2 text-sm text-gray-500">Buscando...</p>
                    ) : alunos.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-gray-500">Nenhum aluno encontrado</p>
                    ) : (
                      alunos.map((a: any) => (
                        <button
                          key={`${onlyDigits(a.cpf || "") || a.id}_${(a.origens || []).join("-")}`}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-yellow-50 border-b last:border-0"
                          onClick={() => {
                            setForm((f) => ({
                              ...f,
                              alunoNome: a.nome || "",
                              alunoCpf: onlyDigits(a.cpf || ""),
                            }));
                            setBuscaAluno("");
                          }}
                        >
                          <span className="font-medium">{a.nome}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {a.cpf || "sem CPF"}
                            {(a.origens || []).length > 0 ? ` · ${(a.origens as string[]).join(" · ")}` : ""}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
                {form.alunoCpf && (
                  <p className="text-xs text-yellow-800 tabular-nums">CPF: {fmtCpf(form.alunoCpf)}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>{form.recorrente ? "Primeira data" : "Data"}</Label>
                  <Input
                    type="date"
                    value={form.data}
                    onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Início</Label>
                  <Input
                    type="time"
                    value={form.horaInicio}
                    onChange={(e) => setForm((f) => ({ ...f, horaInicio: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Fim (opcional)</Label>
                  <Input
                    type="time"
                    value={form.horaFim}
                    onChange={(e) => setForm((f) => ({ ...f, horaFim: e.target.value }))}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-yellow-100 bg-white p-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={!form.recorrente ? "default" : "outline"}
                    className={!form.recorrente ? "bg-yellow-400 text-black hover:bg-yellow-500" : ""}
                    onClick={() => setForm((f) => ({ ...f, recorrente: false, dataFim: "" }))}
                  >
                    Só um dia
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={form.recorrente ? "default" : "outline"}
                    className={form.recorrente ? "bg-yellow-400 text-black hover:bg-yellow-500" : ""}
                    onClick={() => setForm((f) => ({ ...f, recorrente: true }))}
                  >
                    Recorrente (mesmo dia da semana)
                  </Button>
                </div>
                {form.recorrente && (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label>Repetir até</Label>
                      <Input
                        type="date"
                        value={form.dataFim}
                        min={form.data || undefined}
                        onChange={(e) => setForm((f) => ({ ...f, dataFim: e.target.value }))}
                      />
                    </div>
                    {form.data && (
                      <p className="text-xs text-yellow-900">
                        Toda(o) <strong>{diaSemanaDaData(form.data)}</strong>
                        {form.dataFim
                          ? ` · ${contarOcorrenciasSemanais(form.data, form.dataFim)} encontro(s) até ${fmtData(form.dataFim)}`
                          : " · informe a data fim"}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label>Local</Label>
                <Input
                  placeholder="Ex: Sala Psico"
                  value={form.local}
                  onChange={(e) => setForm((f) => ({ ...f, local: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label>Obs. interna (não aparece para o aluno)</Label>
                <Textarea
                  rows={2}
                  value={form.observacaoInterna}
                  onChange={(e) => setForm((f) => ({ ...f, observacaoInterna: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button
                  className="bg-yellow-400 text-black hover:bg-yellow-500"
                  disabled={createMutation.isPending}
                  onClick={() => createMutation.mutate()}
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Plus className="w-4 h-4 mr-1" />
                  )}
                  {form.recorrente ? "Salvar série" : "Salvar agendamento"}
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex gap-1.5 flex-wrap p-1 rounded-xl bg-slate-50 border border-slate-100">
              {(
                [
                  ["proximos", "Próximos"],
                  ["pendentes", countPendentes > 0 ? `Pendentes (${countPendentes})` : "Pendentes"],
                  ["cancelados", "Cancelados"],
                  ["historico", "Histórico"],
                  ["todos", "Todos"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filtro === id
                      ? id === "pendentes"
                        ? "bg-amber-500 text-white shadow-sm"
                        : "bg-yellow-400 text-black shadow-sm shadow-yellow-400/25"
                      : id === "pendentes" && countPendentes > 0
                        ? "text-amber-700 hover:bg-amber-50"
                        : "text-slate-500 hover:text-slate-700 hover:bg-white"
                  }`}
                  onClick={() => setFiltro(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-9 h-10 bg-slate-50/80 border-slate-200 focus-visible:ring-yellow-400/40"
                  placeholder="Buscar por nome ou CPF..."
                  value={listaBusca}
                  onChange={(e) => setListaBusca(e.target.value)}
                  data-testid="input-filtro-nome-acolhimento"
                />
              </div>
              <div className="flex gap-2 items-center sm:w-auto">
                <Input
                  type="date"
                  className="h-10 sm:w-44 bg-slate-50/80 border-slate-200"
                  value={filtroData}
                  onChange={(e) => setFiltroData(e.target.value)}
                  data-testid="input-filtro-data-acolhimento"
                  title="Filtrar por data"
                />
                {(listaBusca || filtroData) && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-10 px-2 text-slate-500"
                    onClick={() => {
                      setListaBusca("");
                      setFiltroData("");
                    }}
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
              Carregando...
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center text-slate-400 py-12 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              Nenhum acolhimento nesta lista.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtrados.map((a) => (
                <div
                  key={a.id}
                  className={`rounded-xl border border-slate-200 bg-white border-l-4 pl-4 pr-4 py-3.5 space-y-2.5 shadow-sm shadow-slate-900/[0.02] ${
                    STATUS_ACCENT[a.status] || STATUS_ACCENT.agendado
                  } ${a.status === "cancelado" ? "bg-slate-50/80 opacity-95" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 leading-tight">{a.alunoNome}</p>
                      <p className="text-xs text-slate-400 mt-0.5 tabular-nums">{fmtCpf(a.alunoCpf)}</p>
                    </div>
                    <Badge
                      className={`border font-medium ${STATUS_CLASS[a.status] || STATUS_CLASS.agendado}`}
                    >
                      {STATUS_LABEL[a.status] || a.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                      {fmtData(a.data)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                      {fmtHora(a.horaInicio)}
                      {a.horaFim ? `–${fmtHora(a.horaFim)}` : ""}
                    </span>
                    {a.local && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                        {a.local}
                      </span>
                    )}
                  </div>

                  {a.status === "cancelado" && (
                    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200/80 rounded-lg px-2.5 py-1.5">
                      Cancelado — permanece aqui e o aluno vê o aviso. Use Excluir só se tiver sido um erro.
                    </p>
                  )}
                  {(a.status === "agendado" || a.status === "reagendado") &&
                    String(a.data).split("T")[0] < hoje && (
                    <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200/80 rounded-lg px-2.5 py-1.5">
                      Dia já passou — marque se a pessoa compareceu (Realizado) ou faltou.
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    {a.serieId && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-yellow-900 bg-yellow-100 border border-yellow-200 rounded-full px-2 py-0.5">
                        <Repeat className="w-3 h-3" />
                        Série
                      </span>
                    )}
                    {a.profissionalNome && (
                      <span className="text-xs text-slate-500">Profissional: {a.profissionalNome}</span>
                    )}
                  </div>
                  {a.observacaoInterna && (
                    <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5">
                      Interno: {a.observacaoInterna}
                    </p>
                  )}

                  {(a.status === "agendado" || a.status === "reagendado") && (
                    <div className="space-y-2 pt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          className="h-8 bg-emerald-600 hover:bg-emerald-700"
                          disabled={statusMutation.isPending}
                          onClick={() => statusMutation.mutate({ id: a.id, status: "realizado" })}
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Realizado
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-rose-200 text-rose-700 hover:bg-rose-50"
                          disabled={statusMutation.isPending}
                          onClick={() => statusMutation.mutate({ id: a.id, status: "faltou" })}
                        >
                          <UserX className="w-3.5 h-3.5 mr-1" />
                          Faltou
                        </Button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-0.5 text-xs text-slate-500 hover:text-slate-800 ml-auto sm:ml-0"
                          onClick={() => {
                            setAcoesExpandidasId((cur) => (cur === a.id ? null : a.id));
                            setExcluindoId(null);
                            setSerieAcao(null);
                          }}
                          data-testid={`button-mais-acoes-acolhimento-${a.id}`}
                        >
                          {acoesExpandidasId === a.id ? (
                            <>
                              Menos <ChevronUp className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              Mais ações <ChevronDown className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>

                      {acoesExpandidasId === a.id && (
                        <div className="space-y-1.5 border-l-2 border-yellow-300 pl-2.5">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                            <span className="text-slate-400 font-medium shrink-0">Este dia:</span>
                            <button
                              type="button"
                              className="text-slate-700 hover:underline disabled:opacity-50"
                              disabled={statusMutation.isPending}
                              onClick={() => statusMutation.mutate({ id: a.id, status: "cancelado" })}
                            >
                              Cancelar
                            </button>
                            <span className="text-slate-300">·</span>
                            {excluindoId === a.id ? (
                              <>
                                <button
                                  type="button"
                                  className="text-rose-700 font-medium hover:underline disabled:opacity-50"
                                  disabled={deleteMutation.isPending}
                                  onClick={() => deleteMutation.mutate(a.id)}
                                >
                                  {deleteMutation.isPending ? "Excluindo…" : "Confirmar exclusão"}
                                </button>
                                <button
                                  type="button"
                                  className="text-slate-500 hover:underline"
                                  onClick={() => setExcluindoId(null)}
                                >
                                  Voltar
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                className="text-slate-700 hover:underline"
                                onClick={() => setExcluindoId(a.id)}
                              >
                                Excluir
                              </button>
                            )}
                          </div>

                          {a.serieId && (
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                              <span className="inline-flex items-center gap-1 text-yellow-800 font-medium shrink-0">
                                <Repeat className="w-3 h-3" />
                                Série:
                              </span>
                              {serieAcao?.serieId === a.serieId ? (
                                <>
                                  <span className="text-slate-600">
                                    {serieAcao.tipo === "cancelar"
                                      ? "Cancelar todos os abertos?"
                                      : "Excluir todos os abertos?"}
                                  </span>
                                  <button
                                    type="button"
                                    className={`font-medium hover:underline disabled:opacity-50 ${
                                      serieAcao.tipo === "excluir" ? "text-rose-700" : "text-yellow-900"
                                    }`}
                                    disabled={serieMutation.isPending}
                                    onClick={() =>
                                      serieMutation.mutate({ serieId: a.serieId!, tipo: serieAcao.tipo })
                                    }
                                  >
                                    {serieMutation.isPending ? "Aguarde…" : "Confirmar"}
                                  </button>
                                  <button
                                    type="button"
                                    className="text-slate-500 hover:underline"
                                    onClick={() => setSerieAcao(null)}
                                  >
                                    Voltar
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className="text-yellow-900 hover:underline"
                                    onClick={() => setSerieAcao({ serieId: a.serieId!, tipo: "cancelar" })}
                                  >
                                    Cancelar série
                                  </button>
                                  <span className="text-slate-300">·</span>
                                  <button
                                    type="button"
                                    className="text-slate-700 hover:text-rose-700 hover:underline"
                                    onClick={() => setSerieAcao({ serieId: a.serieId!, tipo: "excluir" })}
                                  >
                                    Excluir série
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {a.status !== "agendado" && a.status !== "reagendado" && (
                    <div className="pt-0.5">
                      {acoesExpandidasId === a.id || excluindoId === a.id ? (
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                          {excluindoId === a.id ? (
                            <>
                              <button
                                type="button"
                                className="text-rose-700 font-medium hover:underline disabled:opacity-50"
                                disabled={deleteMutation.isPending}
                                onClick={() => deleteMutation.mutate(a.id)}
                              >
                                {deleteMutation.isPending ? "Excluindo…" : "Confirmar exclusão"}
                              </button>
                              <button
                                type="button"
                                className="text-slate-500 hover:underline"
                                onClick={() => {
                                  setExcluindoId(null);
                                  setAcoesExpandidasId(null);
                                }}
                              >
                                Voltar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="text-slate-600 hover:underline"
                                onClick={() => setExcluindoId(a.id)}
                              >
                                Excluir registro
                              </button>
                              <button
                                type="button"
                                className="text-slate-400 hover:underline"
                                onClick={() => setAcoesExpandidasId(null)}
                              >
                                Fechar
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="inline-flex items-center gap-0.5 text-xs text-slate-500 hover:text-slate-800"
                          onClick={() => setAcoesExpandidasId(a.id)}
                        >
                          Mais ações <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Cancelar: fica na lista e o aluno vê o aviso. Excluir: some daqui e do portal do aluno.
          </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
