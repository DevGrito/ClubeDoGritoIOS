import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus, Calendar, MapPin, Ticket, BarChart2, Upload,
  XCircle, ChevronRight, Users, TrendingUp, ScanLine, Pencil
} from "lucide-react";

const BRAND_RED = "#c0272d";

const CATEGORIAS_OPTS = [
  { value: "cultura", label: "Cultura" },
  { value: "esporte", label: "Esporte" },
  { value: "formacao", label: "Formação" },
  { value: "saude", label: "Saúde" },
  { value: "outro", label: "Outros" },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    ativo:     { label: "Ativo",      cls: "bg-green-100 text-green-700 border border-green-200" },
    cancelado: { label: "Cancelado",  cls: "bg-red-100 text-red-700 border border-red-200" },
    realizado: { label: "Realizado",  cls: "bg-gray-100 text-gray-600 border border-gray-200" },
  };
  const s = map[status] || { label: status, cls: "bg-gray-100 text-gray-600" };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>
      {s.label}
    </span>
  );
}

interface EventoForm {
  titulo: string; descricao: string; data_inicio: string;
  hora_inicio: string; hora_fim: string; logradouro: string;
  numero: string; bairro: string; cidade: string; estado: string;
  local: string; capacidade: string; categoria: string;
  gratuito: boolean; preco: string;
}

const EMPTY_FORM: EventoForm = {
  titulo: "", descricao: "", data_inicio: "", hora_inicio: "", hora_fim: "",
  logradouro: "", numero: "", bairro: "", cidade: "", estado: "MG",
  local: "", capacidade: "", categoria: "cultura", gratuito: true, preco: "0"
};

function eventoToForm(ev: any): EventoForm {
  const dataStr = ev.data_inicio ? ev.data_inicio.split("T")[0] : "";
  return {
    titulo: ev.titulo || "", descricao: ev.descricao || "",
    data_inicio: dataStr, hora_inicio: ev.hora_inicio || "", hora_fim: ev.hora_fim || "",
    logradouro: ev.endereco || "", numero: "", bairro: "",
    cidade: ev.cidade || "", estado: ev.estado || "MG",
    local: ev.local || "", capacidade: String(ev.capacidade || ""),
    categoria: ev.categoria || "cultura",
    gratuito: ev.gratuito !== false, preco: ev.gratuito ? "0" : String((ev.preco || 0) / 100),
  };
}

// ── Formulário reutilizável (criar/editar) ───────────────────────────────────
function EventoFormFields({
  form, setForm, bannerPreview, fileRef, onBannerChange, existingBannerUrl,
}: {
  form: EventoForm;
  setForm: (fn: (f: EventoForm) => EventoForm) => void;
  bannerPreview: string | null;
  fileRef: React.RefObject<HTMLInputElement>;
  onBannerChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  existingBannerUrl?: string | null;
}) {
  const displayBanner = bannerPreview || existingBannerUrl || null;
  return (
    <div className="space-y-4">
      {/* Banner */}
      <div>
        <Label className="text-xs font-semibold">Banner do evento</Label>
        <div
          className="mt-1 h-36 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-red-300 transition-colors overflow-hidden relative"
          onClick={() => fileRef.current?.click()}
        >
          {displayBanner ? (
            <img src={displayBanner} className="w-full h-full object-cover" alt="Banner" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <Upload className="w-6 h-6" />
              <span className="text-xs">Clique para adicionar banner</span>
            </div>
          )}
          {displayBanner && (
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
              Clique para trocar
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={onBannerChange} />
      </div>

      <div>
        <Label className="text-xs font-semibold">Título do evento *</Label>
        <Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
          placeholder="Ex: Sarau das Vozes do Grito" className="mt-1" />
      </div>

      <div>
        <Label className="text-xs font-semibold">Descrição</Label>
        <Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
          placeholder="Descreva o evento..." className="mt-1 resize-none" rows={3} />
      </div>

      <div>
        <Label className="text-xs font-semibold">Data do evento *</Label>
        <Input type="date" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))}
          className="mt-1" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold">Horário de início</Label>
          <Input type="time" value={form.hora_inicio} onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Horário de término</Label>
          <Input type="time" value={form.hora_fim} onChange={e => setForm(f => ({ ...f, hora_fim: e.target.value }))} className="mt-1" />
        </div>
      </div>

      <div>
        <Label className="text-xs font-semibold">Nome do local</Label>
        <Input value={form.local} onChange={e => setForm(f => ({ ...f, local: e.target.value }))}
          placeholder="Ex: Ginásio Municipal, Teatro O Grito" className="mt-1" />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold">Endereço</Label>
        <Input value={form.logradouro} onChange={e => setForm(f => ({ ...f, logradouro: e.target.value }))}
          placeholder="Logradouro (rua/av.)" className="mt-1" />
        <div className="grid grid-cols-3 gap-2">
          <Input value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} placeholder="Número" />
          <Input value={form.bairro} onChange={e => setForm(f => ({ ...f, bairro: e.target.value }))} placeholder="Bairro" className="col-span-2" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} placeholder="Cidade" className="col-span-2" />
          <Input value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} placeholder="UF" maxLength={2} />
        </div>
      </div>

      <div>
        <Label className="text-xs font-semibold">Quantidade de ingressos *</Label>
        <Input type="number" min={0} value={form.capacidade}
          onChange={e => setForm(f => ({ ...f, capacidade: e.target.value }))}
          placeholder="Ex: 200" className="mt-1" />
      </div>

      <div>
        <Label className="text-xs font-semibold">Categoria</Label>
        <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v }))}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIAS_OPTS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setForm(f => ({ ...f, gratuito: !f.gratuito }))}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.gratuito ? "bg-green-500" : "bg-gray-200"}`}>
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${form.gratuito ? "translate-x-6" : "translate-x-1"}`} />
        </button>
        <Label className="text-xs font-semibold cursor-pointer" onClick={() => setForm(f => ({ ...f, gratuito: !f.gratuito }))}>
          {form.gratuito ? "Gratuito" : "Pago"}
        </Label>
      </div>

      {!form.gratuito && (
        <div>
          <Label className="text-xs font-semibold">Preço (R$)</Label>
          <Input type="number" min={0} step={0.01} value={form.preco}
            onChange={e => setForm(f => ({ ...f, preco: e.target.value }))}
            placeholder="Ex: 25.00" className="mt-1" />
        </div>
      )}
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function EventosGritoSection({ defaultTab = "eventos", showStats = true }: { defaultTab?: "eventos" | "estatisticas"; showStats?: boolean }) {
  const [activeTab, setActiveTab] = useState<"eventos" | "estatisticas">(defaultTab);

  // Criar
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<EventoForm>(EMPTY_FORM);
  const [createBannerFile, setCreateBannerFile] = useState<File | null>(null);
  const [createBannerPreview, setCreateBannerPreview] = useState<string | null>(null);
  const createFileRef = useRef<HTMLInputElement>(null);

  // Editar
  const [editEvento, setEditEvento] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<EventoForm>(EMPTY_FORM);
  const [editBannerFile, setEditBannerFile] = useState<File | null>(null);
  const [editBannerPreview, setEditBannerPreview] = useState<string | null>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  // Estatísticas
  const [selectedEvento, setSelectedEvento] = useState<any | null>(null);

  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: eventos = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/eventos-grito/meus"],
    queryFn: async () => {
      const r = await fetch("/api/eventos-grito/meus", { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
  });

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/eventos-grito", selectedEvento?.id, "estatisticas"],
    queryFn: async () => {
      const r = await fetch(`/api/eventos-grito/${selectedEvento.id}/estatisticas`, { credentials: "include" });
      if (!r.ok) return null;
      return r.json();
    },
    enabled: !!selectedEvento,
  });

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async () => {
      const endereco = [createForm.logradouro, createForm.numero, createForm.bairro].filter(Boolean).join(", ");
      const r = await fetch("/api/eventos-grito", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: createForm.titulo, descricao: createForm.descricao,
          data_inicio: createForm.data_inicio, hora_inicio: createForm.hora_inicio, hora_fim: createForm.hora_fim,
          local: createForm.local || createForm.logradouro, endereco,
          cidade: createForm.cidade, estado: createForm.estado,
          capacidade: Number(createForm.capacidade), categoria: createForm.categoria,
          gratuito: createForm.gratuito, preco: createForm.gratuito ? 0 : Number(createForm.preco) * 100,
          status: "disponivel",
        }),
      });
      if (!r.ok) throw new Error("Erro ao criar evento");
      const ev = await r.json();
      if (createBannerFile) {
        const fd = new FormData();
        fd.append("banner", createBannerFile);
        await fetch(`/api/eventos-grito/${ev.id}/banner`, { method: "POST", credentials: "include", body: fd });
      }
      return ev;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/eventos-grito/meus"] });
      qc.invalidateQueries({ queryKey: ["/api/eventos-grito"] });
      setShowCreate(false);
      setCreateForm(EMPTY_FORM);
      setCreateBannerFile(null);
      setCreateBannerPreview(null);
      toast({ title: "Evento criado com sucesso!" });
    },
    onError: () => toast({ title: "Erro ao criar evento", variant: "destructive" }),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!editEvento) return;
      const endereco = [editForm.logradouro, editForm.numero, editForm.bairro].filter(Boolean).join(", ");
      const r = await fetch(`/api/eventos-grito/${editEvento.id}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: editForm.titulo, descricao: editForm.descricao,
          data_inicio: editForm.data_inicio, hora_inicio: editForm.hora_inicio, hora_fim: editForm.hora_fim,
          local: editForm.local || editForm.logradouro,
          endereco: endereco || editEvento.endereco,
          cidade: editForm.cidade, estado: editForm.estado,
          capacidade: Number(editForm.capacidade), categoria: editForm.categoria,
          gratuito: editForm.gratuito, preco: editForm.gratuito ? 0 : Number(editForm.preco) * 100,
          status: editEvento.status,
        }),
      });
      if (!r.ok) throw new Error("Erro ao editar evento");
      if (editBannerFile) {
        const fd = new FormData();
        fd.append("banner", editBannerFile);
        await fetch(`/api/eventos-grito/${editEvento.id}/banner`, { method: "POST", credentials: "include", body: fd });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/eventos-grito/meus"] });
      qc.invalidateQueries({ queryKey: ["/api/eventos-grito"] });
      setEditEvento(null);
      setEditBannerFile(null);
      setEditBannerPreview(null);
      toast({ title: "Evento atualizado!" });
    },
    onError: () => toast({ title: "Erro ao atualizar evento", variant: "destructive" }),
  });

  const cancelarMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/eventos-grito/${id}/cancelar`, { method: "PATCH", credentials: "include" });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/eventos-grito/meus"] });
      toast({ title: "Evento cancelado" });
    },
    onError: () => toast({ title: "Erro ao cancelar", variant: "destructive" }),
  });

  function fmtData(d: string) {
    try { return format(new Date(d), "dd 'de' MMM yyyy", { locale: ptBR }); }
    catch { return d; }
  }

  function openEdit(ev: any) {
    setEditEvento(ev);
    setEditForm(eventoToForm(ev));
    setEditBannerFile(null);
    setEditBannerPreview(null);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">Eventos</h2>
        {activeTab === "eventos" && (
          <Button size="sm" className="text-white gap-1.5" style={{ backgroundColor: BRAND_RED }}
            onClick={() => { setCreateForm(EMPTY_FORM); setCreateBannerFile(null); setCreateBannerPreview(null); setShowCreate(true); }}>
            <Plus className="w-4 h-4" />
            Criar Evento
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 px-6">
        {[
          { id: "eventos",      label: "Eventos",      icon: <Calendar className="w-4 h-4" /> },
          ...(showStats ? [{ id: "estatisticas", label: "Estatísticas", icon: <BarChart2 className="w-4 h-4" /> }] : []),
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
              activeTab === tab.id ? "border-red-600 text-red-700" : "border-transparent text-gray-400 hover:text-gray-700"
            }`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* ── ABA EVENTOS ──────────────────────────────────────── */}
        {activeTab === "eventos" && (
          <div className="space-y-3">
            {isLoading && <div className="text-center py-10 text-gray-400 text-sm">Carregando...</div>}

            {!isLoading && eventos.length === 0 && (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nenhum evento criado ainda</p>
                <p className="text-gray-400 text-sm mt-1">Clique em "Criar Evento" para começar</p>
              </div>
            )}

            {eventos.map((ev: any) => (
              <div key={ev.id} className="rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
                <div className="flex gap-4 p-4">
                  {ev.banner_url ? (
                    <img src={ev.banner_url} alt={ev.titulo} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg,#c0272d,#e05555)" }}>
                      <Calendar className="w-8 h-8 text-white opacity-80" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 text-sm truncate">{ev.titulo}</h3>
                      <StatusBadge status={ev.status} />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-0.5">
                      <Calendar className="w-3 h-3" />
                      {fmtData(ev.data_inicio)}{ev.hora_inicio && ` às ${ev.hora_inicio}`}{ev.hora_fim && ` – ${ev.hora_fim}`}
                    </div>
                    {ev.local && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-0.5">
                        <MapPin className="w-3 h-3" />
                        {ev.local}{ev.cidade && `, ${ev.cidade}`}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Ticket className="w-3 h-3" />{ev.capacidade ?? "–"} ingressos disponíveis
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="text-gray-600 text-xs gap-1"
                    onClick={() => openEdit(ev)}>
                    <Pencil className="w-3.5 h-3.5" />Editar
                  </Button>
                  {ev.status === "disponivel" && (
                    <Button size="sm" variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 text-xs gap-1"
                      onClick={() => cancelarMutation.mutate(ev.id)}
                      disabled={cancelarMutation.isPending}>
                      <XCircle className="w-3.5 h-3.5" />Cancelar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ABA ESTATÍSTICAS ──────────────────────────────────── */}
        {activeTab === "estatisticas" && (
          <div className="space-y-4">
            {eventos.length === 0 && (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
                <BarChart2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nenhum evento disponível</p>
              </div>
            )}

            {eventos.length > 0 && !selectedEvento && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 mb-3">Selecione um evento para ver as estatísticas:</p>
                {eventos.map((ev: any) => (
                  <button key={ev.id} onClick={() => setSelectedEvento(ev)}
                    className="w-full flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-red-200 hover:shadow-sm transition-all text-left">
                    <div className="flex items-center gap-3">
                      {ev.banner_url
                        ? <img src={ev.banner_url} className="w-10 h-10 rounded-lg object-cover" alt="" />
                        : <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: BRAND_RED }}>
                            <Calendar className="w-5 h-5 text-white" />
                          </div>
                      }
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{ev.titulo}</p>
                        <p className="text-xs text-gray-500">{fmtData(ev.data_inicio)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={ev.status} />
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedEvento && (
              <div className="space-y-4">
                <button className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  onClick={() => setSelectedEvento(null)}>← Todos os eventos</button>

                <div className="flex items-center gap-3 bg-gray-50 rounded-xl border border-gray-100 p-4">
                  {selectedEvento.banner_url
                    ? <img src={selectedEvento.banner_url} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" alt="" />
                    : <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: BRAND_RED }}>
                        <Calendar className="w-7 h-7 text-white" />
                      </div>
                  }
                  <div>
                    <h3 className="font-bold text-gray-900">{selectedEvento.titulo}</h3>
                    <p className="text-xs text-gray-500">{fmtData(selectedEvento.data_inicio)}{selectedEvento.local ? ` • ${selectedEvento.local}` : ""}</p>
                    <div className="mt-1"><StatusBadge status={selectedEvento.status} /></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: <Ticket className="w-5 h-5" />, label: "Disponibilizados", value: selectedEvento.capacidade ?? "–", color: "#6366f1", bg: "#eef2ff" },
                    { icon: <Users className="w-5 h-5" />, label: "Vendidos", value: stats?.ingressos?.vendidos ?? "0", color: "#10b981", bg: "#ecfdf5" },
                    { icon: <ScanLine className="w-5 h-5" />, label: "Escaneados", value: stats?.ingressos?.escaneados ?? "0", color: "#f59e0b", bg: "#fffbeb" },
                    { icon: <TrendingUp className="w-5 h-5" />, label: "Ticket Médio", value: selectedEvento.gratuito ? "Gratuito" : `R$ ${((selectedEvento.preco || 0) / 100).toFixed(2)}`, color: BRAND_RED, bg: "#fef2f2" },
                  ].map((kpi, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                      <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: kpi.bg }}>
                        <span style={{ color: kpi.color }}>{kpi.icon}</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">{kpi.label}</p>
                        <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                  <p className="text-sm font-bold text-gray-900 mb-3">Dados Demográficos</p>
                  {(!stats?.demograficos?.total || stats.demograficos.total === 0) ? (
                    <p className="text-xs text-gray-400 text-center py-6">Disponível após o primeiro ingresso escaneado.</p>
                  ) : (
                    <div className="space-y-4">
                      {/* Gênero */}
                      {stats.demograficos.genero?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Gênero</p>
                          <div className="space-y-1.5">
                            {stats.demograficos.genero.map((g: any) => {
                              const pct = Math.round((g.value / stats.demograficos.total) * 100);
                              return (
                                <div key={g.label} className="flex items-center gap-2">
                                  <span className="text-xs text-gray-600 w-32 flex-shrink-0">{g.label}</span>
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: BRAND_RED }} />
                                  </div>
                                  <span className="text-xs font-semibold text-gray-700 w-10 text-right">{g.value} ({pct}%)</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {/* Faixa Etária */}
                      {stats.demograficos.faixaEtaria?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Faixa Etária</p>
                          <div className="space-y-1.5">
                            {stats.demograficos.faixaEtaria.map((f: any) => {
                              const pct = Math.round((f.value / stats.demograficos.total) * 100);
                              return (
                                <div key={f.label} className="flex items-center gap-2">
                                  <span className="text-xs text-gray-600 w-32 flex-shrink-0">{f.label}</span>
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div className="h-2 rounded-full bg-indigo-400" style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="text-xs font-semibold text-gray-700 w-10 text-right">{f.value} ({pct}%)</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {/* Cidades */}
                      {stats.demograficos.cidades?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cidades</p>
                          <div className="space-y-1.5">
                            {stats.demograficos.cidades.map((c: any) => {
                              const pct = Math.round((c.value / stats.demograficos.total) * 100);
                              return (
                                <div key={c.label} className="flex items-center gap-2">
                                  <span className="text-xs text-gray-600 w-32 flex-shrink-0 truncate">{c.label}</span>
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="text-xs font-semibold text-gray-700 w-10 text-right">{c.value} ({pct}%)</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL CRIAR ──────────────────────────────────────────── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Criar Novo Evento</DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            <EventoFormFields
              form={createForm} setForm={setCreateForm}
              bannerPreview={createBannerPreview} fileRef={createFileRef}
              onBannerChange={e => {
                const f = e.target.files?.[0];
                if (f) { setCreateBannerFile(f); setCreateBannerPreview(URL.createObjectURL(f)); }
              }}
            />
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button className="flex-1 text-white" style={{ backgroundColor: BRAND_RED }}
                disabled={!createForm.titulo || !createForm.data_inicio || !createForm.capacidade || createMutation.isPending}
                onClick={() => createMutation.mutate()}>
                {createMutation.isPending ? "Criando..." : "Criar Evento"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── MODAL EDITAR ──────────────────────────────────────────── */}
      <Dialog open={!!editEvento} onOpenChange={v => { if (!v) { setEditEvento(null); setEditBannerFile(null); setEditBannerPreview(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Editar Evento</DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            <EventoFormFields
              form={editForm} setForm={setEditForm}
              bannerPreview={editBannerPreview} fileRef={editFileRef}
              existingBannerUrl={editEvento?.banner_url}
              onBannerChange={e => {
                const f = e.target.files?.[0];
                if (f) { setEditBannerFile(f); setEditBannerPreview(URL.createObjectURL(f)); }
              }}
            />
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setEditEvento(null); setEditBannerFile(null); setEditBannerPreview(null); }}>Cancelar</Button>
              <Button className="flex-1 text-white" style={{ backgroundColor: BRAND_RED }}
                disabled={!editForm.titulo || !editForm.data_inicio || editMutation.isPending}
                onClick={() => editMutation.mutate()}>
                {editMutation.isPending ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
