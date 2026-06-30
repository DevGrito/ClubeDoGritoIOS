import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Pencil, Trash2, Calendar, ImageIcon, Check, X, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  disponivel: { label: "Disponível", color: "bg-green-100 text-green-700" },
  em_breve: { label: "Em breve", color: "bg-amber-100 text-amber-700" },
  encerrado: { label: "Encerrado", color: "bg-gray-100 text-gray-600" },
};

const CATEGORIAS = [
  { id: "cultura", label: "Cultura" },
  { id: "esporte", label: "Esporte" },
  { id: "formacao", label: "Formação" },
  { id: "saude", label: "Saúde" },
  { id: "outro", label: "Outro" },
];

function EventoForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState({
    titulo: initial?.titulo || "",
    descricao: initial?.descricao || "",
    data_inicio: initial?.data_inicio
      ? new Date(initial.data_inicio).toISOString().slice(0, 16)
      : "",
    data_fim: initial?.data_fim
      ? new Date(initial.data_fim).toISOString().slice(0, 16)
      : "",
    hora_inicio: initial?.hora_inicio || "",
    hora_fim: initial?.hora_fim || "",
    local: initial?.local || "",
    endereco: initial?.endereco || "",
    cidade: initial?.cidade || "Belo Horizonte",
    estado: initial?.estado || "MG",
    capacidade: initial?.capacidade?.toString() || "",
    status: initial?.status || "em_breve",
    gratuito: initial?.gratuito !== false,
    preco: initial?.preco ? (initial.preco / 100).toString() : "0",
    categoria: initial?.categoria || "cultura",
  });

  const set = (field: string, val: any) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.data_inicio) return;
    onSave({
      ...form,
      capacidade: form.capacidade ? Number(form.capacidade) : null,
      preco: Math.round(Number(form.preco) * 100),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Título *</label>
        <Input value={form.titulo} onChange={e => set("titulo", e.target.value)}
          placeholder="Nome do evento" required />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Descrição</label>
        <Textarea value={form.descricao} onChange={e => set("descricao", e.target.value)}
          placeholder="Descreva o evento..." rows={3} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Data/Hora início *</label>
          <Input type="datetime-local" value={form.data_inicio}
            onChange={e => set("data_inicio", e.target.value)} required />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Data/Hora fim</label>
          <Input type="datetime-local" value={form.data_fim}
            onChange={e => set("data_fim", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Hora início (exibição)</label>
          <Input value={form.hora_inicio} onChange={e => set("hora_inicio", e.target.value)}
            placeholder="ex: 19h30" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Hora fim</label>
          <Input value={form.hora_fim} onChange={e => set("hora_fim", e.target.value)}
            placeholder="ex: 22h00" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Local / Nome do espaço</label>
        <Input value={form.local} onChange={e => set("local", e.target.value)}
          placeholder="Ex: Casa de Cultura do Grito" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Endereço</label>
        <Input value={form.endereco} onChange={e => set("endereco", e.target.value)}
          placeholder="Rua, número, bairro..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Cidade</label>
          <Input value={form.cidade} onChange={e => set("cidade", e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Estado</label>
          <Input value={form.estado} onChange={e => set("estado", e.target.value)} maxLength={2} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Categoria</label>
          <Select value={form.categoria} onValueChange={v => set("categoria", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIAS.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Status</label>
          <Select value={form.status} onValueChange={v => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="em_breve">Em breve</SelectItem>
              <SelectItem value="disponivel">Disponível</SelectItem>
              <SelectItem value="encerrado">Encerrado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Capacidade</label>
          <Input type="number" value={form.capacidade} onChange={e => set("capacidade", e.target.value)}
            placeholder="nº de pessoas" min={1} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Ingresso</label>
          <button type="button" onClick={() => set("gratuito", !form.gratuito)}
            className={`w-full flex items-center justify-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition-colors ${
              form.gratuito ? "bg-green-50 border-green-400 text-green-700" : "bg-gray-50 border-gray-300 text-gray-600"
            }`}>
            {form.gratuito ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            Gratuito
          </button>
          {!form.gratuito && (
            <Input type="number" value={form.preco} onChange={e => set("preco", e.target.value)}
              placeholder="Valor em R$" min={0} step={0.01} className="mt-2" />
          )}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" disabled={isPending}
          className="flex-1 bg-[#c0272d] hover:bg-[#a0201f] text-white">
          {isPending ? "Salvando..." : initial ? "Salvar alterações" : "Criar evento"}
        </Button>
      </div>
    </form>
  );
}

export default function EventosAdmin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editEvento, setEditEvento] = useState<any | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const { data: eventos = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/eventos-grito"],
    queryFn: async () => {
      const r = await fetch("/api/eventos-grito", { credentials: "include" });
      if (!r.ok) throw new Error("Erro");
      return r.json();
    },
  });

  const criarMutation = useMutation({
    mutationFn: async (body: any) => {
      const r = await fetch("/api/eventos-grito", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Erro");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/eventos-grito"] });
      setShowForm(false);
      toast({ title: "Evento criado com sucesso!" });
    },
    onError: (e: any) => toast({ title: "Erro ao criar evento", description: e.message, variant: "destructive" }),
  });

  const editarMutation = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: any }) => {
      const r = await fetch(`/api/eventos-grito/${id}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Erro");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/eventos-grito"] });
      setEditEvento(null);
      toast({ title: "Evento atualizado!" });
    },
    onError: (e: any) => toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" }),
  });

  const deletarMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/eventos-grito/${id}`, { method: "DELETE", credentials: "include" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/eventos-grito"] });
      toast({ title: "Evento removido" });
    },
  });

  async function uploadBanner(id: number, file: File) {
    setUploadingId(id);
    try {
      const fd = new FormData();
      fd.append("banner", file);
      const r = await fetch(`/api/eventos-grito/${id}/banner`, {
        method: "POST", credentials: "include", body: fd,
      });
      if (!r.ok) throw new Error((await r.json()).error || "Erro");
      queryClient.invalidateQueries({ queryKey: ["/api/eventos-grito"] });
      toast({ title: "Banner enviado!" });
    } catch (e: any) {
      toast({ title: "Erro no upload", description: e.message, variant: "destructive" });
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#c0272d] sticky top-0 z-40 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-14 sm:h-16">
            <button onClick={() => navigate("/eventos")}
              className="flex items-center gap-2 text-white hover:text-white/80 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">Eventos</span>
            </button>
            <div className="flex-1 ml-1">
              <h1 className="font-bold text-white text-base sm:text-lg">Gerenciar Eventos</h1>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 bg-white text-[#c0272d] text-sm font-bold px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Novo evento</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && eventos.length === 0 && (
          <div className="text-center py-20">
            <Calendar className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-lg">Nenhum evento cadastrado</p>
            <button onClick={() => setShowForm(true)}
              className="mt-5 bg-[#c0272d] hover:bg-[#a0201f] text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors">
              Criar primeiro evento
            </button>
          </div>
        )}

        {/* Grid de eventos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {eventos.map(ev => {
            const data = new Date(ev.data_inicio);
            const s = STATUS_MAP[ev.status] || STATUS_MAP["em_breve"];
            return (
              <div key={ev.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <div className="relative h-36 bg-gray-200">
                  {ev.banner_url ? (
                    <img src={ev.banner_url} alt={ev.titulo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-100 to-red-200">
                      <ImageIcon className="w-10 h-10 text-red-300" />
                    </div>
                  )}
                  <label className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white text-xs px-2 py-1 rounded-lg cursor-pointer flex items-center gap-1 transition-colors">
                    <ImageIcon className="w-3 h-3" />
                    {uploadingId === ev.id ? "Enviando..." : "Trocar banner"}
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { if (e.target.files?.[0]) uploadBanner(ev.id, e.target.files[0]); }} />
                  </label>
                  {!ev.banner_url && (
                    <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                      1920 × 1080 px
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 flex-1 leading-tight line-clamp-2">{ev.titulo}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${s.color}`}>
                      {s.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    {format(data, "dd/MM/yyyy", { locale: ptBR })}
                    {ev.hora_inicio ? ` · ${ev.hora_inicio}` : ""}
                    {ev.local ? ` · ${ev.local}` : ""}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/eventos/${ev.id}`)}
                      className="flex items-center gap-1 text-xs flex-1">
                      <ExternalLink className="w-3 h-3" /> Ver página
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditEvento(ev)}
                      className="flex items-center gap-1 text-xs">
                      <Pencil className="w-3 h-3" /> Editar
                    </Button>
                    <Button size="sm" variant="outline"
                      onClick={() => { if (confirm("Remover este evento?")) deletarMutation.mutate(ev.id); }}
                      className="text-red-600 border-red-200 hover:bg-red-50 text-xs px-2">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal criar */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo evento</DialogTitle>
          </DialogHeader>
          <EventoForm onSave={d => criarMutation.mutate(d)} onCancel={() => setShowForm(false)} isPending={criarMutation.isPending} />
        </DialogContent>
      </Dialog>

      {/* Modal editar */}
      <Dialog open={!!editEvento} onOpenChange={v => !v && setEditEvento(null)}>
        <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar evento</DialogTitle>
          </DialogHeader>
          {editEvento && (
            <EventoForm initial={editEvento} onSave={d => editarMutation.mutate({ id: editEvento.id, body: d })}
              onCancel={() => setEditEvento(null)} isPending={editarMutation.isPending} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
