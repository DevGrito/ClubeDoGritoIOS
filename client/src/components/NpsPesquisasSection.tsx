import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Trash2, ChevronRight, ChevronLeft, BarChart2,
  Star, MessageSquare, CheckCircle2, Lock, Unlock,
  X, GripVertical, Search, List, Pencil, Copy,
  Filter, Layers, Upload, GitBranch
} from "lucide-react";

interface Props {
  programa: "inclusao" | "pec";
  userId?: number;
}

type PerguntaTipo = "escala" | "texto" | "multipla_unica" | "multipla_multipla" | "evidencia";

type LogicaRegra = { tipo: "proxima" | "pergunta" | "bloco" | "fim"; ordem?: number; bloco_nome?: string };
type LogicaCondicional = Record<string, LogicaRegra>;
const BLOCO_DEFAULT_RULE_KEY = "__bloco_padrao__";

interface Pergunta {
  texto: string;
  tipo: PerguntaTipo;
  opcoes: string[];
  isNpsPrincipal?: boolean;
  bloco_nome?: string;
  logica_condicional?: LogicaCondicional;
  logicaAtiva?: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  aberta: "Aberta",
  fechada: "Fechada",
};
const STATUS_COLOR: Record<string, string> = {
  rascunho: "bg-gray-100 text-gray-700",
  aberta: "bg-green-100 text-green-700",
  fechada: "bg-red-100 text-red-700",
};

const DEFAULT_PERGUNTA_INCLUSAO: Pergunta = {
  texto: "Em uma escala de 0 a 10, o quanto você recomendaria um curso do Instituto O Grito a um amigo ou familiar?",
  tipo: "escala",
  opcoes: [],
  isNpsPrincipal: true,
};

const DEFAULT_PERGUNTA_PEC: Pergunta = {
  texto: "Em uma escala de 0 a 10, o quanto você recomendaria uma oficina do Instituto O Grito a um amigo ou familiar?",
  tipo: "escala",
  opcoes: [],
  isNpsPrincipal: true,
};

export default function NpsPesquisasSection({ programa, userId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"lista" | "form" | "resultado">("lista");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [titulo, setTitulo] = useState("");
  const [turmasSel, setTurmasSel] = useState<{ id: number; nome: string }[]>([]);
  const [buscaTurma, setBuscaTurma] = useState("");
  const PERGUNTAS_INICIAIS: Pergunta[] = programa === "inclusao"
    ? [DEFAULT_PERGUNTA_INCLUSAO]
    : programa === "pec"
    ? [DEFAULT_PERGUNTA_PEC]
    : [{ texto: "", tipo: "escala", opcoes: [] }];

  const [perguntas, setPerguntas] = useState<Pergunta[]>(PERGUNTAS_INICIAIS);
  const [copiandoDe, setCopiandoDe] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [carregandoCopia, setCarregandoCopia] = useState(false);
  const [novaSecaoNome, setNovaSecaoNome] = useState("");
  const [secaoAtiva, setSecaoAtiva] = useState("");

  const { data: turmasDisp = [] } = useQuery<{ id: number; nome: string }[]>({
    queryKey: ["/api/nps/turmas", programa],
    queryFn: async () => (await fetch(`/api/nps/turmas?programa=${programa}`)).json(),
  });

  const { data: pesquisas = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/nps/pesquisas", programa],
    queryFn: async () => (await fetch(`/api/nps/pesquisas?programa=${programa}`)).json(),
  });

  const { data: resultado } = useQuery<any>({
    queryKey: ["/api/nps/pesquisas", selectedId],
    queryFn: async () => (await fetch(`/api/nps/pesquisas/${selectedId}`)).json(),
    enabled: view === "resultado" && !!selectedId,
  });

  const resetForm = () => {
    setTitulo("");
    setTurmasSel([]);
    setBuscaTurma("");
    setPerguntas(PERGUNTAS_INICIAIS);
    setEditingId(null);
    setCopiandoDe(null);
  };

  const parseOpcoes = (opcoes: any): string[] => {
    if (Array.isArray(opcoes)) return opcoes;
    if (typeof opcoes === 'string' && opcoes) {
      try { return JSON.parse(opcoes); } catch { return []; }
    }
    return [];
  };

  const parseLogica = (lc: any): LogicaCondicional | undefined => {
    if (!lc) return undefined;
    if (typeof lc === 'object' && !Array.isArray(lc)) return lc as LogicaCondicional;
    if (typeof lc === 'string') { try { return JSON.parse(lc); } catch { return undefined; } }
    return undefined;
  };

  const aplicarCopia = async (pesquisaId: number) => {
    setCarregandoCopia(true);
    setCopiandoDe(pesquisaId);
    try {
      const data = await (await fetch(`/api/nps/pesquisas/${pesquisaId}`)).json();
      const pergList: any[] = data.resultado?.map((r: any) => r.pergunta) || [];
      if (pergList.length) {
        setPerguntas(pergList.map((perg: any) => {
          const lc = parseLogica(perg.logica_condicional);
          return {
            texto: perg.texto,
            tipo: perg.tipo as PerguntaTipo,
            opcoes: parseOpcoes(perg.opcoes),
            isNpsPrincipal: !!perg.is_nps_principal,
            bloco_nome: perg.bloco_nome || "",
            logica_condicional: lc,
            logicaAtiva: !!lc && Object.keys(lc).length > 0,
          };
        }));
        toast({ title: "Perguntas copiadas!", description: `${pergList.length} pergunta(s) carregadas.` });
      }
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    } finally {
      setCarregandoCopia(false);
    }
  };

  const openCreate = () => {
    resetForm();
    setView("form");
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    setTitulo(p.titulo);
    const turmas = p.turmas?.map((t: any) => ({ id: t.turma_id, nome: t.turma_nome })) || [];
    setTurmasSel(turmas);
    setBuscaTurma("");
    fetch(`/api/nps/pesquisas/${p.id}`)
      .then(r => r.json())
      .then(data => {
        const pergList: any[] = data.resultado?.map((r: any) => r.pergunta) || [];
        if (pergList.length) {
          setPerguntas(pergList.map((perg: any) => {
            const lc = parseLogica(perg.logica_condicional);
            return {
              texto: perg.texto,
              tipo: perg.tipo as PerguntaTipo,
              opcoes: parseOpcoes(perg.opcoes),
              isNpsPrincipal: !!perg.is_nps_principal,
              bloco_nome: perg.bloco_nome || "",
              logica_condicional: lc,
              logicaAtiva: !!lc && Object.keys(lc).length > 0,
            };
          }));
        }
        setView("form");
      })
      .catch(() => setView("form"));
  };

  const salvarMut = useMutation({
    mutationFn: async () => {
      const perguntasPayload = perguntas.map(p => ({
        texto: p.texto,
        tipo: p.tipo,
        opcoes: p.opcoes,
        isNpsPrincipal: p.isNpsPrincipal,
        bloco_nome: p.bloco_nome || null,
        logica_condicional: (p.logicaAtiva && p.logica_condicional && Object.keys(p.logica_condicional).length > 0)
          ? p.logica_condicional : null,
      }));

      if (editingId) {
        const r = await fetch(`/api/nps/pesquisas/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ titulo, turmas: turmasSel, perguntas: perguntasPayload }),
        });
        if (!r.ok) throw new Error((await r.json()).error);
        return r.json();
      } else {
        const r = await fetch("/api/nps/pesquisas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ titulo, programa, turmas: turmasSel, perguntas: perguntasPayload, criadoPor: userId }),
        });
        if (!r.ok) throw new Error((await r.json()).error);
        return r.json();
      }
    },
    onSuccess: () => {
      toast({ title: editingId ? "Pesquisa atualizada!" : "Pesquisa criada!" });
      queryClient.invalidateQueries({ queryKey: ["/api/nps/pesquisas", programa] });
      resetForm();
      setView("lista");
    },
    onError: (e: any) => toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" }),
  });

  const statusMut = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const r = await fetch(`/api/nps/pesquisas/${id}/status`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/nps/pesquisas", programa] }),
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/nps/pesquisas/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await r.json()).error);
    },
    onSuccess: () => {
      toast({ title: "Pesquisa excluída" });
      queryClient.invalidateQueries({ queryKey: ["/api/nps/pesquisas", programa] });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const addPergunta = (blocoNome?: string) => {
    const alvo = (blocoNome || secaoAtiva || "").trim();
    if (!alvo) {
      toast({ title: "Crie e selecione uma seção primeiro", variant: "destructive" });
      return;
    }
    setPerguntas((p) => [...p, { texto: "", tipo: "escala", opcoes: [], bloco_nome: alvo }]);
  };

  const addPerguntaAvulsa = () => {
    setPerguntas((p) => [...p, { texto: "", tipo: "escala", opcoes: [], bloco_nome: "" }]);
  };

  const criarSecao = () => {
    const nome = novaSecaoNome.trim();
    if (!nome) {
      toast({ title: "Informe o nome da seção", variant: "destructive" });
      return;
    }
    if (perguntas.some((p) => (p.bloco_nome || "").trim().toLowerCase() === nome.toLowerCase())) {
      toast({ title: "Seção já existe", description: "Escolha outro nome.", variant: "destructive" });
      return;
    }
    addPergunta(nome);
    setSecaoAtiva(nome);
    setNovaSecaoNome("");
    toast({ title: "Seção criada", description: `Nova seção "${nome}" adicionada.` });
  };
  const removePergunta = (i: number) => {
    if (perguntas[i]?.isNpsPrincipal) return;
    setPerguntas(p => p.filter((_, idx) => idx !== i));
  };
  const updatePergunta = (i: number, field: keyof Pergunta, val: any) => {
    if (perguntas[i]?.isNpsPrincipal && (field === "texto" || field === "tipo")) return;
    setPerguntas(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  };

  const addOpcao = (i: number) =>
    setPerguntas(p => p.map((item, idx) => idx === i ? { ...item, opcoes: [...item.opcoes, ""] } : item));
  const updateOpcao = (pi: number, oi: number, val: string) =>
    setPerguntas(p => p.map((item, idx) => idx === pi ? { ...item, opcoes: item.opcoes.map((o, j) => j === oi ? val : o) } : item));
  const removeOpcao = (pi: number, oi: number) =>
    setPerguntas(p => p.map((item, idx) => idx === pi ? { ...item, opcoes: item.opcoes.filter((_, j) => j !== oi) } : item));

  const updateLogicaRegra = (pergIdx: number, opcao: string, regra: LogicaRegra) => {
    setPerguntas(prev => prev.map((item, idx) => {
      if (idx !== pergIdx) return item;
      const lc: LogicaCondicional = { ...(item.logica_condicional || {}) };
      lc[opcao] = regra;
      return { ...item, logica_condicional: lc };
    }));
  };

  const getRegraPadraoBloco = (blocoNome: string): LogicaRegra => {
    const idxPrimeiraPergunta = perguntas.findIndex((pq) => (pq.bloco_nome || "").trim() === blocoNome.trim());
    if (idxPrimeiraPergunta === -1) return { tipo: "proxima" };
    const regra = perguntas[idxPrimeiraPergunta]?.logica_condicional?.[BLOCO_DEFAULT_RULE_KEY];
    return regra || { tipo: "proxima" };
  };

  const updateRegraPadraoBloco = (blocoNome: string, regra: LogicaRegra) => {
    setPerguntas(prev => {
      const idxPrimeiraPergunta = prev.findIndex((pq) => (pq.bloco_nome || "").trim() === blocoNome.trim());
      if (idxPrimeiraPergunta === -1) return prev;
      return prev.map((item, idx) => {
        if (idx !== idxPrimeiraPergunta) return item;
        const lc: LogicaCondicional = { ...(item.logica_condicional || {}) };
        lc[BLOCO_DEFAULT_RULE_KEY] = regra;
        return { ...item, logica_condicional: lc };
      });
    });
  };

  const moveQuestion = (from: number, to: number) => {
    if (to < 0 || to >= perguntas.length) return;
    setPerguntas(p => {
      const arr = [...p];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  };

  const toggleTurma = (t: { id: number; nome: string }) =>
    setTurmasSel(prev => prev.find(x => x.id === t.id) ? prev.filter(x => x.id !== t.id) : [...prev, t]);

  const isMultipla = (tipo: PerguntaTipo) => tipo === "multipla_unica" || tipo === "multipla_multipla";

  const perguntaValida = (p: Pergunta) => {
    if (!p.texto.trim()) return false;
    if (isMultipla(p.tipo)) return p.opcoes.length >= 2 && p.opcoes.every(o => o.trim());
    return true;
  };

  const tiposDisponiveis = [
    { tipo: "escala" as PerguntaTipo, icon: Star, label: "Escala 0–10" },
    { tipo: "texto" as PerguntaTipo, icon: MessageSquare, label: "Texto livre" },
    { tipo: "multipla_unica" as PerguntaTipo, icon: List, label: "Única escolha" },
    { tipo: "multipla_multipla" as PerguntaTipo, icon: List, label: "Múltipla escolha" },
    { tipo: "evidencia" as PerguntaTipo, icon: Upload, label: "Evidência" },
  ];

  // ── View: Criar / Editar ──────────────────────────────────────────────────
  if (view === "form") {
    const motivos: string[] = [];
    const blocosDisponiveis = Array.from(
      new Set(
        perguntas
          .map((pq) => (pq.bloco_nome || "").trim())
          .filter((nome) => !!nome)
      )
    );
    const secaoAtivaEfetiva = secaoAtiva || blocosDisponiveis[0] || "";
    const secoesResumo = blocosDisponiveis.map((nome) => ({
      nome,
      total: perguntas.filter((pq) => !pq.isNpsPrincipal && (pq.bloco_nome || "").trim() === nome).length,
    }));
    if (!titulo.trim()) motivos.push("título da pesquisa");
    if (!turmasSel.length) motivos.push("ao menos uma turma");
    if (!perguntas.every(perguntaValida)) {
      const invalidas = perguntas.filter(p => !perguntaValida(p));
      if (invalidas.some(p => !p.texto.trim())) motivos.push("texto de todas as perguntas");
      if (invalidas.some(p => isMultipla(p.tipo) && p.opcoes.length < 2)) motivos.push("mínimo 2 opções nas perguntas de múltipla escolha");
    }

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => { resetForm(); setView("lista"); }}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="text-lg">{editingId ? "Editar Pesquisa" : "Nova Pesquisa"}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Copiar perguntas de pesquisa anterior */}
          {!editingId && pesquisas.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-yellow-800">
                <Copy className="w-4 h-4" />
                Copiar perguntas de pesquisa anterior
              </div>
              <p className="text-xs text-yellow-700">Selecione uma pesquisa para importar as perguntas. Você poderá editar antes de salvar.</p>
              <select
                className="w-full text-sm border border-yellow-300 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                value={copiandoDe ?? ""}
                disabled={carregandoCopia}
                onChange={e => {
                  const val = e.target.value;
                  if (val) aplicarCopia(parseInt(val));
                  else { setCopiandoDe(null); setPerguntas(PERGUNTAS_INICIAIS); }
                }}
              >
                <option value="">— Não copiar (começar do zero) —</option>
                {[...pesquisas].sort((a, b) => b.id - a.id).map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {STATUS_LABEL[p.status]} · {p.titulo} ({p.total_perguntas} pergunta(s))
                  </option>
                ))}
              </select>
              {carregandoCopia && <p className="text-xs text-yellow-600 animate-pulse">Carregando perguntas...</p>}
            </div>
          )}

          {/* Título */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Título da pesquisa *</label>
            <Input placeholder="Ex: Satisfação 1º Semestre 2026" value={titulo} onChange={e => setTitulo(e.target.value)} />
          </div>

          {/* Turmas */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Turmas * <span className="text-gray-400 font-normal">(obrigatório)</span>
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Buscar turma..." value={buscaTurma} onChange={e => setBuscaTurma(e.target.value)} className="pl-9" />
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
              {!buscaTurma && (() => {
                const todosSelected = !!turmasSel.find(x => x.id === 0);
                return (
                  <button onClick={() => todosSelected
                    ? setTurmasSel([])
                    : setTurmasSel([{ id: 0, nome: "Todos os alunos" }])}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left font-semibold border-b mb-1 pb-2 transition-colors ${todosSelected ? "bg-yellow-400 text-gray-900" : "bg-yellow-50 hover:bg-yellow-100 text-yellow-800"}`}>
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${todosSelected ? "opacity-100" : "opacity-30"}`} />
                    ★ Todos os alunos
                  </button>
                );
              })()}
              {!turmasSel.find(x => x.id === 0) && turmasDisp.filter(t => t.nome.toLowerCase().includes(buscaTurma.toLowerCase())).map(t => {
                const sel = !!turmasSel.find(x => x.id === t.id);
                return (
                  <button key={t.id} onClick={() => toggleTurma(t)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${sel ? "bg-yellow-400 text-gray-900" : "bg-gray-50 hover:bg-gray-100 text-gray-700"}`}>
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${sel ? "opacity-100" : "opacity-0"}`} />
                    {t.nome}
                  </button>
                );
              })}
            </div>
            {turmasSel.length > 0 && (
              <p className="text-xs text-yellow-600 mt-1">
                {turmasSel.find(x => x.id === 0) ? "✓ Enviado a todos os alunos do programa" : `${turmasSel.length} turma(s) selecionada(s)`}
              </p>
            )}
          </div>

          {/* Perguntas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Perguntas *</label>
              <Button size="sm" variant="outline" onClick={addPerguntaAvulsa}>
                <Plus className="w-4 h-4 mr-1" /> Adicionar pergunta avulsa
              </Button>
            </div>
            <div className="mb-3 border rounded-lg p-3 bg-indigo-50/60 space-y-2">
              <p className="text-xs font-medium text-indigo-700">Sessões (blocos)</p>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Nome da seção (ex: Seção 02)"
                  value={novaSecaoNome}
                  onChange={(e) => setNovaSecaoNome(e.target.value)}
                  className="h-8 text-sm bg-white"
                />
                <Button size="sm" variant="outline" onClick={criarSecao}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Criar seção
                </Button>
              </div>
              {blocosDisponiveis.length > 0 && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {secoesResumo.map((secao) => (
                      <span key={secao.nome} className="text-xs px-2 py-1 rounded-full border bg-white text-indigo-700">
                        {secao.nome} ({secao.total})
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-[11px] text-indigo-600">
                Dica: você pode usar sessões (blocos) ou criar perguntas avulsas sem sessão.
              </p>
            </div>
            <div className="space-y-4">
              {perguntas.map((p, i) => p.isNpsPrincipal && (
                <div key={i} className="border rounded-xl p-3 space-y-3 bg-gray-50">
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-gray-400 mt-2.5 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                          Pergunta padrão NPS — não editável
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center shrink-0">{i + 1}</span>
                        <Input value={p.texto} disabled className="text-gray-900 cursor-not-allowed opacity-100 disabled:opacity-100" />
                      </div>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Star className="w-3 h-3" /> Escala 0–10 · Esta pergunta é usada no cálculo do NPS do dashboard
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {blocosDisponiveis.map((secaoNome) => {
                const itensSecao = perguntas
                  .map((pq, idx) => ({ p: pq, idx }))
                  .filter(({ p }) => !p.isNpsPrincipal && (p.bloco_nome || "").trim() === secaoNome);
                return (
                  <div key={secaoNome} className="border border-indigo-200 rounded-xl bg-indigo-50/40 overflow-hidden">
                    <div className="px-3 py-2 border-b border-indigo-200 bg-indigo-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-semibold text-indigo-700">Seção: {secaoNome}</span>
                        <span className="text-xs text-indigo-500">({itensSecao.length} pergunta(s))</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => addPergunta(secaoNome)}>
                        <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar pergunta
                      </Button>
                    </div>
                    <div className="p-3 space-y-3">
                      {itensSecao.map(({ p, idx: i }) => (
                        <div key={i} className="border rounded-xl p-3 space-y-3 bg-white">
                          <div className="flex items-start gap-2">
                            <GripVertical className="w-4 h-4 text-gray-400 mt-2.5 shrink-0" />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-400 bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center shrink-0">{i + 1}</span>
                                <Input
                                  placeholder="Digite a pergunta..."
                                  value={p.texto}
                                  onChange={e => updatePergunta(i, "texto", e.target.value)}
                                />
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {tiposDisponiveis.map(({ tipo, icon: Icon, label }) => (
                                  <button key={tipo} onClick={() => {
                                    updatePergunta(i, "tipo", tipo);
                                    if (isMultipla(tipo) && p.opcoes.length === 0) {
                                      updatePergunta(i, "opcoes", ["Opção 1", "Opção 2"]);
                                    }
                                    if (!isMultipla(tipo)) {
                                      updatePergunta(i, "logicaAtiva", false);
                                    }
                                  }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${p.tipo === tipo ? "bg-yellow-400 text-gray-900" : "bg-white border text-gray-600 hover:bg-gray-50"}`}>
                                    <Icon className="w-3 h-3" /> {label}
                                  </button>
                                ))}
                              </div>

                              {p.tipo === "evidencia" && (
                                <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                                  <Upload className="w-3.5 h-3.5 shrink-0" />
                                  O aluno será solicitado a enviar um arquivo (foto, PDF, etc.) como evidência.
                                </div>
                              )}

                              {isMultipla(p.tipo) && (
                                <div className="space-y-2 pt-1">
                                  <p className="text-xs font-medium text-gray-600">
                                    Opções {p.tipo === "multipla_unica" ? "(o aluno escolhe uma)" : "(o aluno escolhe uma ou mais)"} *
                                  </p>
                                  {p.opcoes.map((op, oi) => (
                                    <div key={oi} className="flex items-center gap-2">
                                      <div className={`w-4 h-4 rounded shrink-0 border-2 border-gray-300 ${p.tipo === "multipla_unica" ? "rounded-full" : "rounded"}`} />
                                      <Input
                                        placeholder={`Opção ${oi + 1}`}
                                        value={op}
                                        onChange={e => updateOpcao(i, oi, e.target.value)}
                                        className="h-8 text-sm"
                                      />
                                      {p.opcoes.length > 2 && (
                                        <button onClick={() => removeOpcao(i, oi)} className="text-red-400 hover:text-red-600 shrink-0">
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                  <button onClick={() => addOpcao(i)}
                                    className="flex items-center gap-1.5 text-xs text-yellow-700 hover:text-yellow-800 font-medium mt-1">
                                    <Plus className="w-3 h-3" /> Adicionar opção
                                  </button>
                                  {p.opcoes.filter(o => o.trim()).length < 2 && <p className="text-xs text-red-500">Mínimo 2 opções preenchidas</p>}
                                </div>
                              )}

                              {p.tipo === "multipla_unica" && (
                                <div className="border border-dashed border-purple-300 rounded-lg p-3 bg-purple-50 space-y-2">
                                  <button
                                    onClick={() => updatePergunta(i, "logicaAtiva", !p.logicaAtiva)}
                                    className={`flex items-center gap-2 text-xs font-semibold transition-colors ${p.logicaAtiva ? "text-purple-700" : "text-purple-400"}`}>
                                    <GitBranch className="w-3.5 h-3.5" />
                                    {p.logicaAtiva ? "Lógica condicional ativa" : "Ativar lógica condicional"}
                                    <span className={`ml-auto w-8 h-4 rounded-full transition-colors ${p.logicaAtiva ? "bg-purple-500" : "bg-gray-300"}`}>
                                      <span className={`block w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${p.logicaAtiva ? "translate-x-4.5" : "translate-x-0.5"}`} />
                                    </span>
                                  </button>

                                  {p.opcoes.filter(o => o.trim()).length < 2 ? (
                                    <p className="text-xs text-purple-500">Preencha ao menos 2 opções para configurar redirecionamento por resposta.</p>
                                  ) : p.logicaAtiva ? (
                                    <div className="space-y-2 pt-1">
                                      <p className="text-xs text-purple-600">Para cada resposta, escolha para qual pergunta ou bloco ir:</p>
                                      {p.opcoes.filter(o => o.trim()).map((op) => {
                                        const regra = p.logica_condicional?.[op] || { tipo: "proxima" as const };
                                        const destinoSelecionado =
                                          regra.tipo === "pergunta"
                                            ? `pergunta_${regra.ordem}`
                                            : regra.tipo === "bloco" && regra.bloco_nome
                                              ? `bloco_${regra.bloco_nome}`
                                              : regra.tipo;
                                        return (
                                          <div key={op} className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-medium text-gray-700 min-w-[80px] max-w-[120px] truncate bg-white border rounded px-2 py-1">
                                              {op}
                                            </span>
                                            <span className="text-xs text-gray-400">→ ir para</span>
                                            <select
                                              className="text-xs border border-purple-300 rounded-md px-2 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-400 flex-1 min-w-[140px]"
                                              value={destinoSelecionado}
                                              onChange={e => {
                                                const val = e.target.value;
                                                if (val === "proxima") updateLogicaRegra(i, op, { tipo: "proxima" });
                                                else if (val === "fim") updateLogicaRegra(i, op, { tipo: "fim" });
                                                else if (val.startsWith("pergunta_")) {
                                                  const ordem = parseInt(val.replace("pergunta_", ""));
                                                  updateLogicaRegra(i, op, { tipo: "pergunta", ordem });
                                                } else if (val.startsWith("bloco_")) {
                                                  const bloco_nome = val.replace("bloco_", "").trim();
                                                  updateLogicaRegra(i, op, { tipo: "bloco", bloco_nome });
                                                }
                                              }}
                                            >
                                              <option value="proxima">▶ Próxima pergunta</option>
                                              {blocosDisponiveis.map((blocoNome) => (
                                                <option key={blocoNome} value={`bloco_${blocoNome}`}>
                                                  📦 Bloco: {blocoNome}
                                                </option>
                                              ))}
                                              {perguntas.map((pq, pi) => pi !== i && (
                                                <option key={pi} value={`pergunta_${pi + 1}`}>
                                                  Pergunta {pi + 1}{pq.texto ? ` — ${pq.texto.substring(0, 30)}${pq.texto.length > 30 ? '...' : ''}` : ''}
                                                </option>
                                              ))}
                                              <option value="fim">⛔ Encerrar pesquisa</option>
                                            </select>
                                          </div>
                                        );
                                      })}
                                      <p className="text-xs text-purple-400 italic">Respostas sem regra configurada → seguem para a próxima pergunta.</p>
                                    </div>
                                  ) : null}
                                </div>
                              )}

                              <div className="flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="text-xs text-gray-600 bg-gray-50 border rounded px-2 py-1">
                                  Seção: {secaoNome}
                                </span>
                              </div>
                            </div>
                            <button onClick={() => removePergunta(i)} className="text-red-400 hover:text-red-600 mt-2 shrink-0">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {(() => {
                const itensAvulsos = perguntas
                  .map((pq, idx) => ({ p: pq, idx }))
                  .filter(({ p }) => !p.isNpsPrincipal && !(p.bloco_nome || "").trim());
                if (itensAvulsos.length === 0) return null;
                return (
                  <div className="border border-gray-200 rounded-xl bg-gray-50/70 overflow-hidden">
                    <div className="px-3 py-2 border-b border-gray-200 bg-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <List className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-semibold text-gray-700">Perguntas avulsas (sem seção)</span>
                        <span className="text-xs text-gray-500">({itensAvulsos.length} pergunta(s))</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={addPerguntaAvulsa}>
                        <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar avulsa
                      </Button>
                    </div>
                    <div className="p-3 space-y-3">
                      {itensAvulsos.map(({ p, idx: i }) => (
                        <div key={i} className="border rounded-xl p-3 space-y-3 bg-white">
                          <div className="flex items-start gap-2">
                            <GripVertical className="w-4 h-4 text-gray-400 mt-2.5 shrink-0" />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-400 bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center shrink-0">{i + 1}</span>
                                <Input
                                  placeholder="Digite a pergunta..."
                                  value={p.texto}
                                  onChange={e => updatePergunta(i, "texto", e.target.value)}
                                />
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {tiposDisponiveis.map(({ tipo, icon: Icon, label }) => (
                                  <button key={tipo} onClick={() => {
                                    updatePergunta(i, "tipo", tipo);
                                    if (isMultipla(tipo) && p.opcoes.length === 0) {
                                      updatePergunta(i, "opcoes", ["Opção 1", "Opção 2"]);
                                    }
                                    if (!isMultipla(tipo)) {
                                      updatePergunta(i, "logicaAtiva", false);
                                    }
                                  }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${p.tipo === tipo ? "bg-yellow-400 text-gray-900" : "bg-white border text-gray-600 hover:bg-gray-50"}`}>
                                    <Icon className="w-3 h-3" /> {label}
                                  </button>
                                ))}
                              </div>

                              {isMultipla(p.tipo) && (
                                <div className="space-y-2 pt-1">
                                  <p className="text-xs font-medium text-gray-600">
                                    Opções {p.tipo === "multipla_unica" ? "(o aluno escolhe uma)" : "(o aluno escolhe uma ou mais)"} *
                                  </p>
                                  {p.opcoes.map((op, oi) => (
                                    <div key={oi} className="flex items-center gap-2">
                                      <div className={`w-4 h-4 rounded shrink-0 border-2 border-gray-300 ${p.tipo === "multipla_unica" ? "rounded-full" : "rounded"}`} />
                                      <Input
                                        placeholder={`Opção ${oi + 1}`}
                                        value={op}
                                        onChange={e => updateOpcao(i, oi, e.target.value)}
                                        className="h-8 text-sm"
                                      />
                                      {p.opcoes.length > 2 && (
                                        <button onClick={() => removeOpcao(i, oi)} className="text-red-400 hover:text-red-600 shrink-0">
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                  <button onClick={() => addOpcao(i)}
                                    className="flex items-center gap-1.5 text-xs text-yellow-700 hover:text-yellow-800 font-medium mt-1">
                                    <Plus className="w-3 h-3" /> Adicionar opção
                                  </button>
                                </div>
                              )}

                              {p.tipo === "multipla_unica" && (
                                <div className="border border-dashed border-purple-300 rounded-lg p-3 bg-purple-50 space-y-2">
                                  <button
                                    onClick={() => updatePergunta(i, "logicaAtiva", !p.logicaAtiva)}
                                    className={`flex items-center gap-2 text-xs font-semibold transition-colors ${p.logicaAtiva ? "text-purple-700" : "text-purple-400"}`}>
                                    <GitBranch className="w-3.5 h-3.5" />
                                    {p.logicaAtiva ? "Lógica condicional ativa" : "Ativar lógica condicional"}
                                    <span className={`ml-auto w-8 h-4 rounded-full transition-colors ${p.logicaAtiva ? "bg-purple-500" : "bg-gray-300"}`}>
                                      <span className={`block w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${p.logicaAtiva ? "translate-x-4.5" : "translate-x-0.5"}`} />
                                    </span>
                                  </button>
                                  {p.opcoes.filter(o => o.trim()).length < 2 ? (
                                    <p className="text-xs text-purple-500">Preencha ao menos 2 opções para configurar o redirecionamento.</p>
                                  ) : p.logicaAtiva ? (
                                    <div className="space-y-2 pt-1">
                                      <p className="text-xs text-purple-600">Fluxo da pergunta (sem precisar de bloco):</p>
                                      {p.opcoes.filter(o => o.trim()).map((op) => {
                                        const regra = p.logica_condicional?.[op] || { tipo: "proxima" as const };
                                        const destinoSelecionado = regra.tipo === "pergunta" ? `pergunta_${regra.ordem}` : regra.tipo;
                                        return (
                                          <div key={op} className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-medium text-gray-700 min-w-[80px] max-w-[120px] truncate bg-white border rounded px-2 py-1">{op}</span>
                                            <span className="text-xs text-gray-400">→ ir para</span>
                                            <select
                                              className="text-xs border border-purple-300 rounded-md px-2 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-400 flex-1 min-w-[140px]"
                                              value={destinoSelecionado}
                                              onChange={e => {
                                                const val = e.target.value;
                                                if (val === "proxima") updateLogicaRegra(i, op, { tipo: "proxima" });
                                                else if (val === "fim") updateLogicaRegra(i, op, { tipo: "fim" });
                                                else if (val.startsWith("pergunta_")) {
                                                  const ordem = parseInt(val.replace("pergunta_", ""));
                                                  updateLogicaRegra(i, op, { tipo: "pergunta", ordem });
                                                }
                                              }}
                                            >
                                              <option value="proxima">▶ Próxima pergunta</option>
                                              {perguntas.map((pq, pi) => pi !== i && (
                                                <option key={pi} value={`pergunta_${pi + 1}`}>
                                                  Pergunta {pi + 1}{pq.texto ? ` — ${pq.texto.substring(0, 30)}${pq.texto.length > 30 ? '...' : ''}` : ''}
                                                </option>
                                              ))}
                                              <option value="fim">⛔ Encerrar pesquisa</option>
                                            </select>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : null}
                                </div>
                              )}
                            </div>
                            <button onClick={() => removePergunta(i)} className="text-red-400 hover:text-red-600 mt-2 shrink-0">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {blocosDisponiveis.length > 0 && (
            <div className="border border-dashed border-indigo-300 rounded-xl p-4 bg-indigo-50 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-800">
                <Layers className="w-4 h-4" />
                Fluxo entre blocos (estilo seções)
              </div>
              <p className="text-xs text-indigo-600">
                Define para onde ir ao terminar a última pergunta de cada bloco, quando não houver regra por resposta.
              </p>
              {blocosDisponiveis.map((blocoNome) => {
                const regra = getRegraPadraoBloco(blocoNome);
                const destinoSelecionado =
                  regra.tipo === "bloco" && regra.bloco_nome
                    ? `bloco_${regra.bloco_nome}`
                    : regra.tipo;
                return (
                  <div key={blocoNome} className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-gray-700 bg-white border rounded px-2 py-1 min-w-[130px]">
                      📦 {blocoNome}
                    </span>
                    <span className="text-xs text-gray-500">após este bloco ir para</span>
                    <select
                      className="text-xs border border-indigo-300 rounded-md px-2 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400 flex-1 min-w-[180px]"
                      value={destinoSelecionado}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "proxima") updateRegraPadraoBloco(blocoNome, { tipo: "proxima" });
                        else if (val === "fim") updateRegraPadraoBloco(blocoNome, { tipo: "fim" });
                        else if (val.startsWith("bloco_")) {
                          const alvoBloco = val.replace("bloco_", "").trim();
                          updateRegraPadraoBloco(blocoNome, { tipo: "bloco", bloco_nome: alvoBloco });
                        }
                      }}
                    >
                      <option value="proxima">▶ Próximo bloco na ordem do formulário</option>
                      {blocosDisponiveis.filter((nome) => nome !== blocoNome).map((nome) => (
                        <option key={nome} value={`bloco_${nome}`}>
                          📦 Bloco: {nome}
                        </option>
                      ))}
                      <option value="fim">⛔ Encerrar pesquisa</option>
                    </select>
                  </div>
                );
              })}
            </div>
          )}

          {motivos.length > 0 && (
            <p className="text-xs text-red-500 text-center -mb-2">Preencha: {motivos.join(", ")}.</p>
          )}
          <Button
            className="w-full bg-black hover:bg-gray-900 text-white"
            disabled={motivos.length > 0 || salvarMut.isPending}
            onClick={() => salvarMut.mutate()}
          >
            {salvarMut.isPending
              ? (editingId ? "Salvando..." : "Criando...")
              : (editingId ? "Salvar alterações" : "Criar Pesquisa")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── View: Resultado ──────────────────────────────────────────────────────
  if (view === "resultado" && resultado) {
    const npsGeral = resultado.resultado?.find((r: any) => r.pergunta?.tipo === "escala");
    const totalResp = resultado.total_respondentes || 0;
    const totalEleg = resultado.total_elegiveis || 0;
    const taxaResp = totalEleg > 0 ? Math.round((totalResp / totalEleg) * 100) : null;

    const promotores = npsGeral ? Object.entries(npsGeral.distribuicao as Record<string,number>).filter(([k]) => parseInt(k) >= 9).reduce((a, [,v]) => a + v, 0) : 0;
    const neutros    = npsGeral ? Object.entries(npsGeral.distribuicao as Record<string,number>).filter(([k]) => parseInt(k) >= 7 && parseInt(k) <= 8).reduce((a, [,v]) => a + v, 0) : 0;
    const detratores = npsGeral ? Object.entries(npsGeral.distribuicao as Record<string,number>).filter(([k]) => parseInt(k) <= 6).reduce((a, [,v]) => a + v, 0) : 0;
    const totalNps = promotores + neutros + detratores;
    const pctProm = totalNps > 0 ? Math.round((promotores / totalNps) * 100) : 0;
    const pctNeu  = totalNps > 0 ? Math.round((neutros    / totalNps) * 100) : 0;
    const pctDet  = totalNps > 0 ? Math.round((detratores / totalNps) * 100) : 0;
    const npsScore = pctProm - pctDet;

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setView("lista")}><ChevronLeft className="w-4 h-4" /></Button>
            <div className="flex-1">
              <CardTitle className="text-lg">{resultado.titulo}</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                {resultado.turmas?.map((t: any) => t.turma_nome).join(", ")}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 border rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Taxa de resposta</span>
              <span className="font-bold text-gray-900">
                {totalResp}{totalEleg > 0 ? ` de ${totalEleg}` : ""} respondeu{taxaResp !== null ? ` · ${taxaResp}%` : ""}
              </span>
            </div>
            {totalEleg > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: `${taxaResp ?? 0}%` }} />
              </div>
            )}
          </div>

          {npsGeral && (
            <div className="bg-black rounded-xl p-4 text-white space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">NPS Score</p>
              <p className="text-4xl font-black">{npsScore > 0 ? "+" : ""}{npsScore}</p>
              <div className="flex gap-3 text-sm">
                <span className="text-green-400 font-semibold">{pctProm}% Promotores</span>
                <span className="text-gray-400">{pctNeu}% Neutros</span>
                <span className="text-red-400 font-semibold">{pctDet}% Detratores</span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                {pctProm > 0 && <div className="bg-green-400" style={{ width: `${pctProm}%` }} />}
                {pctNeu > 0 && <div className="bg-gray-500" style={{ width: `${pctNeu}%` }} />}
                {pctDet > 0 && <div className="bg-red-500" style={{ width: `${pctDet}%` }} />}
              </div>
            </div>
          )}

          {resultado.resultado?.map((r: any) => (
            <div key={r.pergunta?.id} className="border rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-800">{r.pergunta?.texto}</p>
              {r.pergunta?.bloco_nome && (
                <p className="text-xs text-purple-600 font-medium">📦 {r.pergunta.bloco_nome}</p>
              )}
              <p className="text-xs text-gray-400">{r.total_respostas || 0} resposta(s)</p>

              {r.pergunta?.tipo === "escala" && r.distribuicao && (
                <div className="grid grid-cols-11 gap-1">
                  {Array.from({ length: 11 }, (_, n) => (
                    <div key={n} className="flex flex-col items-center gap-1">
                      <div className="h-12 w-full bg-gray-100 rounded flex items-end overflow-hidden">
                        <div
                          className="w-full bg-yellow-400 rounded transition-all"
                          style={{ height: `${r.total_respostas > 0 ? ((r.distribuicao[n] || 0) / r.total_respostas) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 font-bold">{n}</span>
                      <span className="text-xs text-gray-400">{r.distribuicao[n] || 0}</span>
                    </div>
                  ))}
                </div>
              )}

              {(r.pergunta?.tipo === "multipla_unica" || r.pergunta?.tipo === "multipla_multipla") && r.opcoes_contagem && (
                <div className="space-y-2">
                  {Object.entries(r.opcoes_contagem as Record<string,number>).sort((a,b) => b[1]-a[1]).map(([op, count]) => (
                    <div key={op} className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-700">
                        <span>{op}</span>
                        <span className="font-bold">{count} ({r.total_respostas > 0 ? Math.round((count/r.total_respostas)*100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${r.total_respostas > 0 ? (count/r.total_respostas)*100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {r.pergunta?.tipo === "texto" && r.respostas_texto?.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {r.respostas_texto.map((t: string, ti: number) => (
                    <p key={ti} className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">"{t}"</p>
                  ))}
                </div>
              )}

              {r.pergunta?.tipo === "evidencia" && (
                <p className="text-xs text-blue-500 italic">Pergunta de evidência — arquivos enviados pelos alunos não são exibidos aqui.</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // ── View: Lista ──────────────────────────────────────────────────────────
  if (isLoading) return <div className="text-sm text-gray-400 text-center py-10">Carregando...</div>;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Pesquisas NPS</CardTitle>
          <Button size="sm" className="bg-black hover:bg-gray-900 text-white" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" /> Nova
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {pesquisas.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma pesquisa criada ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...pesquisas].sort((a, b) => b.id - a.id).map((p: any) => (
              <div key={p.id} className="border rounded-xl p-4 space-y-3 bg-white hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[p.status] || "bg-gray-100 text-gray-700"}`}>
                        {STATUS_LABEL[p.status] || p.status}
                      </span>
                      <p className="text-sm font-bold text-gray-900 truncate">{p.titulo}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {p.total_perguntas} pergunta(s) · {p.total_respostas || 0} resposta(s)
                    </p>
                    <p className="text-xs text-gray-400">
                      {p.turmas?.map((t: any) => t.turma_nome).join(", ")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" className="text-xs h-7"
                    onClick={() => { setSelectedId(p.id); setView("resultado"); }}>
                    <BarChart2 className="w-3 h-3 mr-1" /> Resultados
                  </Button>
                  {p.status !== "fechada" && (
                    <Button size="sm" variant="outline" className="text-xs h-7"
                      onClick={() => openEdit(p)}>
                      <Pencil className="w-3 h-3 mr-1" /> Editar
                    </Button>
                  )}
                  {p.status === "aberta" && (
                    <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => statusMut.mutate({ id: p.id, status: "fechada" })}>
                      <Lock className="w-3 h-3 mr-1" /> Fechar
                    </Button>
                  )}
                  {p.status === "fechada" && (
                    <Button size="sm" variant="outline" className="text-xs h-7 text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => statusMut.mutate({ id: p.id, status: "aberta" })}>
                      <Unlock className="w-3 h-3 mr-1" /> Reabrir
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-xs h-7 text-red-400 hover:text-red-600 hover:bg-red-50 ml-auto"
                    onClick={() => { if (confirm("Excluir pesquisa?")) deleteMut.mutate(p.id); }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
