import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, authFetch } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Store, Plus, Search, ChevronRight,
  Pencil, Trash2, CheckCircle2, XCircle, ClipboardList, History, BarChart3,
} from "lucide-react";

// Formata valor monetário
const fmt = (v: any) => parseFloat(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

// Formata data de forma robusta (string "YYYY-MM-DD" ou ISO com timezone)
const fmtDate = (d: string) => {
  if (!d) return "-";
  const s = typeof d === "string" ? d.substring(0, 10) : String(d);
  const [year, month, day] = s.split("-");
  if (!year || !month || !day) return d;
  return `${day}/${month}/${year}`;
};

const totalValor = (f: any) =>
  parseFloat(f.dinheiro_valor || 0) + parseFloat(f.credito_valor || 0) +
  parseFloat(f.debito_valor || 0) + parseFloat(f.pix_valor || 0) + parseFloat(f.vale_valor || 0);

const totalQtd = (f: any) =>
  parseInt(f.dinheiro_qtd || 0) + parseInt(f.credito_qtd || 0) +
  parseInt(f.debito_qtd || 0) + parseInt(f.pix_qtd || 0) + parseInt(f.vale_qtd || 0);

const emptyForm = () => ({
  data: new Date().toISOString().split("T")[0],
  publico: "",
  teveLive: false, teveCacambas: false, qtdCacambas: "",
  teveItensRecebidos: false, qtdItens: "", teveBazar: false, teveParceria: false,
  dinheiroQtd: "", dinheiroValor: "", creditoQtd: "", creditoValor: "",
  debitoQtd: "", debitoValor: "", pixQtd: "", pixValor: "", valeQtd: "", valeValor: "",
});

const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

const FORMAS = [
  { label: "Dinheiro", qKey: "dinheiroQtd", vKey: "dinheiroValor", dbQtd: "dinheiro_qtd", dbVal: "dinheiro_valor" },
  { label: "Crédito",  qKey: "creditoQtd",  vKey: "creditoValor",  dbQtd: "credito_qtd",  dbVal: "credito_valor"  },
  { label: "Débito",   qKey: "debitoQtd",   vKey: "debitoValor",   dbQtd: "debito_qtd",   dbVal: "debito_valor"   },
  { label: "PIX",      qKey: "pixQtd",      vKey: "pixValor",      dbQtd: "pix_qtd",      dbVal: "pix_valor"      },
  { label: "Vale",     qKey: "valeQtd",     vKey: "valeValor",     dbQtd: "vale_qtd",     dbVal: "vale_valor"     },
];

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 flex flex-col gap-2 border border-slate-700">
      <p className="text-2xl font-bold text-white">{value.toLocaleString("pt-BR")}</p>
      <p className="text-xs text-slate-400 leading-tight">{label}</p>
    </div>
  );
}

function ToggleButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all
        ${active ? "border-gray-900 bg-gray-100 text-gray-900" : "border-gray-200 bg-white text-gray-400"}`}>
      {active
        ? <CheckCircle2 className="w-4 h-4 text-gray-900" />
        : <XCircle className="w-4 h-4 text-gray-300" />}
      {label}
    </button>
  );
}

export default function VendedorOutletPage() {
  const fetch = authFetch;
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<"cadastro" | "historico">("cadastro");
  const [vendedorNome, setVendedorNome] = useState(() => localStorage.getItem("outlet_vendedor_nome") || "");
  const [nomeConfirmado, setNomeConfirmado] = useState(() => !!localStorage.getItem("outlet_vendedor_nome"));
  const [form, setForm] = useState(emptyForm());
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const [dashAno, setDashAno] = useState(2026);
  const [dashMes, setDashMes] = useState<number | "">("");

  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  const [filtroInicio, setFiltroInicio] = useState(firstOfMonth);
  const [filtroFim, setFiltroFim] = useState(today);

  const confirmarNome = () => {
    if (vendedorNome.trim()) {
      localStorage.setItem("outlet_vendedor_nome", vendedorNome.trim());
      setNomeConfirmado(true);
    }
  };
  const trocarVendedor = () => {
    localStorage.removeItem("outlet_vendedor_nome");
    setVendedorNome(""); setNomeConfirmado(false);
  };
  const goTo = (section: "cadastro" | "historico") => {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const setF = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const { data: dashboard, isLoading: dashLoading } = useQuery<any>({
    queryKey: ["/api/outlet/dashboard", dashAno, dashMes],
    queryFn: async () => {
      const params = new URLSearchParams({ ano: String(dashAno) });
      if (dashMes) params.append("mes", String(dashMes));
      const res = await fetch(`/api/outlet/dashboard?${params}`);
      if (!res.ok) throw new Error("Erro ao buscar dashboard");
      return res.json();
    },
    enabled: nomeConfirmado,
  });

  const { data: fechamentos = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/outlet/fechamentos", vendedorNome, filtroInicio, filtroFim],
    queryFn: async () => {
      const params = new URLSearchParams({ vendedor_nome: vendedorNome, data_inicio: filtroInicio, data_fim: filtroFim });
      const res = await fetch(`/api/outlet/fechamentos?${params}`);
      if (!res.ok) throw new Error("Erro ao buscar fechamentos");
      return res.json();
    },
    enabled: nomeConfirmado,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/outlet/fechamentos"] });
    queryClient.invalidateQueries({ queryKey: ["/api/outlet/dashboard"] });
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/outlet/fechamentos", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Fechamento salvo com sucesso!" });
      setForm(emptyForm());
      goTo("historico");
    },
    onError: (e: any) => toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/outlet/fechamentos/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Registro atualizado!" }); setEditId(null);
    },
    onError: (e: any) => toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/outlet/fechamentos/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Registro excluído!" });
    },
    onError: (e: any) => toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!form.data) {
      toast({ title: "Data é obrigatória", variant: "destructive" }); return;
    }
    if (!form.publico || parseInt(form.publico) < 0) {
      toast({ title: "Público (pessoas na loja) é obrigatório", variant: "destructive" }); return;
    }
    if (form.teveCacambas && (!form.qtdCacambas || parseInt(form.qtdCacambas) <= 0)) {
      toast({ title: "Informe a quantidade de caçambas", variant: "destructive" }); return;
    }
    if (form.teveItensRecebidos && (!form.qtdItens || parseInt(form.qtdItens) <= 0)) {
      toast({ title: "Informe a quantidade de itens recebidos", variant: "destructive" }); return;
    }
    createMutation.mutate({ ...form, vendedorNome });
  };

  if (!nomeConfirmado) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-3">
            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Store className="w-8 h-8 text-gray-900" />
            </div>
            <CardTitle className="text-xl">IOG Outlet</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Digite seu nome para acessar</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input value={vendedorNome} onChange={(e) => setVendedorNome(e.target.value)} placeholder="Seu nome completo" onKeyDown={(e) => e.key === "Enter" && confirmarNome()} />
            <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold" onClick={confirmarNome} disabled={!vendedorNome.trim()}>Entrar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 px-4 py-4 md:px-6 border-l-4 border-l-yellow-400">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
              <Store className="w-6 h-6 text-gray-900" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">IOG Outlet</h1>
              <p className="text-slate-400 text-sm">{vendedorNome}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="border-slate-600 text-slate-900 hover:bg-slate-700 hover:text-white" onClick={trocarVendedor}>
            Trocar vendedor
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:px-6 md:py-8 space-y-6">

        {/* ===== DASHBOARD ===== */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-yellow-400" />
              <h2 className="text-white font-semibold text-base">Indicadores</h2>
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={dashAno}
                onChange={(e) => setDashAno(Number(e.target.value))}
                className="bg-slate-800 text-white text-sm border border-slate-600 rounded-lg px-3 py-1.5 focus:outline-none focus:border-yellow-400"
              >
                <option value={2026}>2026</option>
              </select>
              <select
                value={dashMes}
                onChange={(e) => setDashMes(e.target.value === "" ? "" : Number(e.target.value))}
                className="bg-slate-800 text-white text-sm border border-slate-600 rounded-lg px-3 py-1.5 focus:outline-none focus:border-yellow-400"
              >
                <option value="">Todos os meses</option>
                {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
          </div>

          {dashLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => <div key={i} className="bg-slate-800 rounded-xl p-4 h-20 animate-pulse border border-slate-700" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <KpiCard label="Itens Recebidos"   value={dashboard?.itensRecebidos    ?? 0} />
              <KpiCard label="Caçambas do Bem"   value={dashboard?.cacambas          ?? 0} />
              <KpiCard label="Clientes Atendidos" value={dashboard?.clientesAtendidos ?? 0} />
              <KpiCard label="Itens Vendidos"    value={dashboard?.itensVendidos     ?? 0} />
              <KpiCard label="Lives Realizadas"  value={dashboard?.livesRealizadas   ?? 0} />
            </div>
          )}
        </div>

        {/* Separador */}
        <div className="border-t border-slate-700" />

        {/* ===== CARDS DE AÇÃO ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className={`bg-white ${activeSection === "cadastro" ? "ring-2 ring-yellow-400" : ""}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                <ClipboardList className="w-5 h-5 text-gray-900" />
                Cadastro do Dia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-500 text-sm">Registre o fechamento diário da loja: público, eventos, vendas por forma de pagamento e recebimentos.</p>
              <Button
                className={`w-full font-semibold ${activeSection === "cadastro"
                  ? "bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                onClick={() => goTo("cadastro")}
              >
                <Plus className="w-4 h-4 mr-2" />
                {activeSection === "cadastro" ? "Cadastro Aberto" : "Novo Fechamento"}
              </Button>
            </CardContent>
          </Card>

          <Card className={`bg-white ${activeSection === "historico" ? "ring-2 ring-yellow-400" : ""}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                <History className="w-5 h-5 text-gray-900" />
                Busca Histórico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-500 text-sm">Consulte e edite fechamentos anteriores. Filtre por período para visualizar o histórico de vendas.</p>
              <Button
                variant="outline"
                className={`w-full font-semibold border-gray-300 hover:bg-yellow-50 hover:border-yellow-400 hover:text-yellow-700 ${activeSection === "historico" ? "bg-yellow-400 text-gray-900 border-yellow-400 hover:bg-yellow-500 hover:text-gray-900" : ""}`}
                onClick={() => goTo("historico")}
              >
                <Search className="w-4 h-4 mr-2" />
                {activeSection === "historico" ? "Histórico Aberto" : `Ver Histórico (${fechamentos.length})`}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ===== CADASTRO ===== */}
        {activeSection === "cadastro" && (
          <Card className="border-l-4 border-l-yellow-400 bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                <Plus className="w-5 h-5 text-gray-900" /> Novo Fechamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Data + Público */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">
                    Data <span className="text-red-500">*</span>
                  </label>
                  <Input type="date" value={form.data} onChange={(e) => setF("data", e.target.value)} required />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">
                    Público — pessoas na loja <span className="text-red-500">*</span>
                  </label>
                  <Input type="number" min="0" placeholder="0" value={form.publico} onChange={(e) => setF("publico", e.target.value)} />
                </div>
              </div>

              {/* Eventos do dia */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Eventos do Dia</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <ToggleButton active={form.teveLive}           onClick={() => setF("teveLive", !form.teveLive)}                     label="Live" />
                  <ToggleButton active={form.teveBazar}          onClick={() => setF("teveBazar", !form.teveBazar)}                    label="Bazar" />
                  <ToggleButton active={form.teveParceria}       onClick={() => setF("teveParceria", !form.teveParceria)}              label="Parceria" />
                  <ToggleButton active={form.teveCacambas}       onClick={() => setF("teveCacambas", !form.teveCacambas)}              label="Caçambas" />
                  <ToggleButton active={form.teveItensRecebidos} onClick={() => setF("teveItensRecebidos", !form.teveItensRecebidos)}  label="Itens Recebidos" />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  {form.teveCacambas && (
                    <div>
                      <label className="text-sm font-medium mb-1 block text-gray-700">
                        Qtd. Caçambas <span className="text-red-500">*</span>
                      </label>
                      <Input type="number" min="1" placeholder="0" value={form.qtdCacambas} onChange={(e) => setF("qtdCacambas", e.target.value)} />
                    </div>
                  )}
                  {form.teveItensRecebidos && (
                    <div>
                      <label className="text-sm font-medium mb-1 block text-gray-700">
                        Qtd. Itens Recebidos <span className="text-red-500">*</span>
                      </label>
                      <Input type="number" min="1" placeholder="0" value={form.qtdItens} onChange={(e) => setF("qtdItens", e.target.value)} />
                    </div>
                  )}
                </div>
              </div>

              {/* Tabela de vendas */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Vendas por Forma de Pagamento</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-2 font-semibold text-gray-700 border border-gray-200">Forma</th>
                        <th className="text-center p-2 font-semibold text-gray-700 border border-gray-200">Quantidade</th>
                        <th className="text-center p-2 font-semibold text-gray-700 border border-gray-200">Valor (R$)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {FORMAS.map(({ label, qKey, vKey }) => (
                        <tr key={label} className="hover:bg-gray-50">
                          <td className="p-2 border border-gray-200 font-medium text-gray-700">{label}</td>
                          <td className="p-1 border border-gray-200">
                            <Input type="number" min="0" placeholder="0" value={(form as any)[qKey]} onChange={(e) => setF(qKey, e.target.value)} className="text-center h-8 text-sm" />
                          </td>
                          <td className="p-1 border border-gray-200">
                            <Input type="number" min="0" step="0.01" placeholder="0,00" value={(form as any)[vKey]} onChange={(e) => setF(vKey, e.target.value)} className="text-center h-8 text-sm" />
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold">
                        <td className="p-2 border border-gray-200 text-gray-700">Total</td>
                        <td className="p-2 border border-gray-200 text-center text-gray-700">
                          {FORMAS.reduce((acc, { qKey }) => acc + parseInt((form as any)[qKey] || "0"), 0)}
                        </td>
                        <td className="p-2 border border-gray-200 text-center text-green-700">
                          R$ {fmt(FORMAS.reduce((acc, { vKey }) => acc + parseFloat((form as any)[vKey] || "0"), 0))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold" onClick={handleSubmit} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Salvando..." : "Salvar Fechamento"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ===== HISTÓRICO ===== */}
        {activeSection === "historico" && (
          <Card className="border-l-4 border-l-yellow-400 bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                <History className="w-5 h-5 text-gray-900" /> Busca Histórico
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">De</label>
                  <Input type="date" value={filtroInicio} onChange={(e) => setFiltroInicio(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">Até</label>
                  <Input type="date" value={filtroFim} onChange={(e) => setFiltroFim(e.target.value)} className="h-9 text-sm" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-400">Carregando...</div>
              ) : fechamentos.length === 0 ? (
                <div className="text-center py-8 text-gray-400 border rounded-lg">Nenhum registro no período selecionado</div>
              ) : (
                <div className="space-y-2">
                  {fechamentos.map((f: any) => {
                    const isExpanded = expandedId === f.id;
                    const isEditing = editId === f.id;

                    if (isEditing) {
                      const ef = editForm;
                      const setEf = (key: string, val: any) => setEditForm((p: any) => ({ ...p, [key]: val }));
                      return (
                        <Card key={f.id} className="border-gray-300">
                          <CardContent className="p-4 space-y-4">
                            <p className="font-semibold text-gray-900">Editar — {fmtDate(f.data)}</p>
                            <div>
                              <label className="text-xs font-medium mb-1 block text-gray-700">Público</label>
                              <Input type="number" min="0" value={ef.publico} onChange={(e) => setEf("publico", e.target.value)} className="max-w-xs" />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {[
                                { key: "teveLive", label: "Live" }, { key: "teveBazar", label: "Bazar" },
                                { key: "teveParceria", label: "Parceria" }, { key: "teveCacambas", label: "Caçambas" },
                                { key: "teveItensRecebidos", label: "Itens Recebidos" },
                              ].map(({ key, label }) => (
                                <button key={key} type="button" onClick={() => setEf(key, !ef[key])}
                                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium ${ef[key] ? "border-gray-900 bg-gray-100 text-gray-900" : "border-gray-200 bg-white text-gray-400"}`}>
                                  {ef[key] ? <CheckCircle2 className="w-3.5 h-3.5 text-gray-900" /> : <XCircle className="w-3.5 h-3.5 text-gray-300" />}
                                  {label}
                                </button>
                              ))}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {ef.teveCacambas && <div><label className="text-xs mb-1 block text-gray-700">Qtd. Caçambas</label><Input type="number" value={ef.qtdCacambas} onChange={(e) => setEf("qtdCacambas", e.target.value)} /></div>}
                              {ef.teveItensRecebidos && <div><label className="text-xs mb-1 block text-gray-700">Qtd. Itens</label><Input type="number" value={ef.qtdItens} onChange={(e) => setEf("qtdItens", e.target.value)} /></div>}
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs border-collapse">
                                <thead>
                                  <tr className="bg-gray-50">
                                    <th className="p-2 border border-gray-200 text-left text-gray-700">Forma</th>
                                    <th className="p-2 border border-gray-200 text-gray-700">Qtd</th>
                                    <th className="p-2 border border-gray-200 text-gray-700">Valor</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {FORMAS.map(({ label, qKey, vKey }) => (
                                    <tr key={label}>
                                      <td className="p-1 border border-gray-200 font-medium text-gray-700">{label}</td>
                                      <td className="p-1 border border-gray-200"><Input type="number" min="0" value={ef[qKey]} onChange={(e) => setEf(qKey, e.target.value)} className="h-7 text-xs text-center" /></td>
                                      <td className="p-1 border border-gray-200"><Input type="number" min="0" step="0.01" value={ef[vKey]} onChange={(e) => setEf(vKey, e.target.value)} className="h-7 text-xs text-center" /></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="sm" onClick={() => setEditId(null)}>Cancelar</Button>
                              <Button size="sm" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900" disabled={updateMutation.isPending}
                                onClick={() => updateMutation.mutate({ id: f.id, ...ef })}>
                                {updateMutation.isPending ? "Salvando..." : "Salvar"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }

                    return (
                      <div key={f.id} className="border rounded-xl overflow-hidden bg-white">
                        <button type="button"
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                          onClick={() => setExpandedId(isExpanded ? null : f.id)}
                        >
                          <div className="flex items-center gap-3 flex-1 flex-wrap">
                            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`} />
                            <span className="font-medium text-sm text-gray-900">{fmtDate(f.data)}</span>
                            <Badge variant="outline" className="border-green-300 text-green-700 text-xs">R$ {fmt(totalValor(f))}</Badge>
                            <span className="text-xs text-gray-400">{totalQtd(f)} vendas</span>
                            <span className="text-xs text-gray-400">{f.publico || 0} pessoas</span>
                          </div>
                          <div className="flex gap-1 flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 h-7 w-7 p-0"
                              onClick={() => {
                                setEditId(f.id);
                                setEditForm({
                                  publico: String(f.publico || 0),
                                  teveLive: f.teve_live, teveBazar: f.teve_bazar, teveParceria: f.teve_parceria,
                                  teveCacambas: f.teve_cacambas, qtdCacambas: String(f.qtd_cacambas || 0),
                                  teveItensRecebidos: f.teve_itens_recebidos, qtdItens: String(f.qtd_itens || 0),
                                  dinheiroQtd: String(f.dinheiro_qtd || 0), dinheiroValor: String(f.dinheiro_valor || 0),
                                  creditoQtd: String(f.credito_qtd || 0), creditoValor: String(f.credito_valor || 0),
                                  debitoQtd: String(f.debito_qtd || 0), debitoValor: String(f.debito_valor || 0),
                                  pixQtd: String(f.pix_qtd || 0), pixValor: String(f.pix_valor || 0),
                                  valeQtd: String(f.vale_qtd || 0), valeValor: String(f.vale_valor || 0),
                                });
                              }}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 h-7 w-7 p-0"
                              onClick={() => { if (confirm("Excluir este fechamento?")) deleteMutation.mutate(f.id); }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t bg-gray-50 p-4 space-y-3">
                            {(f.teve_live || f.teve_bazar || f.teve_parceria || f.teve_cacambas || f.teve_itens_recebidos) && (
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 pb-1">
                                {f.teve_live     && <span>✓ Teve live</span>}
                                {f.teve_bazar    && <span>✓ Teve bazar</span>}
                                {f.teve_parceria && <span>✓ Teve parceria</span>}
                                {f.teve_cacambas && <span>✓ {f.qtd_cacambas} {parseInt(f.qtd_cacambas) === 1 ? "caçamba" : "caçambas"}</span>}
                                {f.teve_itens_recebidos && <span>✓ {f.qtd_itens} {parseInt(f.qtd_itens) === 1 ? "item recebido" : "itens recebidos"}</span>}
                              </div>
                            )}
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm border-collapse">
                                <thead>
                                  <tr className="bg-white">
                                    <th className="text-left p-2 border border-gray-200 font-semibold text-gray-700">Forma</th>
                                    <th className="text-center p-2 border border-gray-200 font-semibold text-gray-700">Qtd</th>
                                    <th className="text-center p-2 border border-gray-200 font-semibold text-gray-700">Valor</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {FORMAS.map(({ label, dbQtd, dbVal }) => (
                                    <tr key={label} className="hover:bg-gray-50">
                                      <td className="p-2 border border-gray-200 font-medium text-gray-700">{label}</td>
                                      <td className="p-2 border border-gray-200 text-center text-gray-700">{parseInt(f[dbQtd] || 0)}</td>
                                      <td className="p-2 border border-gray-200 text-center text-green-700">R$ {fmt(f[dbVal])}</td>
                                    </tr>
                                  ))}
                                  <tr className="bg-gray-50 font-bold">
                                    <td className="p-2 border border-gray-200 text-gray-700">Total</td>
                                    <td className="p-2 border border-gray-200 text-center text-gray-700">{totalQtd(f)}</td>
                                    <td className="p-2 border border-gray-200 text-center text-green-700">R$ {fmt(totalValor(f))}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
