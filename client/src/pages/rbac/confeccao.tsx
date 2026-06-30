import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, authFetch } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Scissors, Plus, Search, ChevronRight, FileText,
  Pencil, CheckCircle2, XCircle, Package, Truck, BarChart3,
  ClipboardList, Factory, CheckCheck,
} from "lucide-react";

const fmt = (v: any) => parseFloat(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
const fmtDate = (d: string) => {
  if (!d) return "-";
  const s = typeof d === "string" ? d.substring(0, 10) : String(d);
  const [y, m, day] = s.split("-");
  return `${day}/${m}/${y}`;
};
const STATUS_LABEL: Record<string, string> = { pendente: "Pendente", aprovado: "Aprovado", entregue: "Entregue" };
const STATUS_COLOR: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-700",
  aprovado: "bg-blue-100 text-blue-700",
  entregue: "bg-green-100 text-green-700",
};
const TAMANHOS = ["PP", "P", "M", "G", "GG", "XG", "XGG"];
const ETAPAS = ["Corte", "Peça Piloto", "Fechamento", "Abastecimento", "Arremate", "Personalização", "Embalagem"];
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 flex flex-col gap-2 border border-slate-700">
      <p className="text-2xl font-bold text-white">{value.toLocaleString("pt-BR")}</p>
      <p className="text-xs text-slate-400 leading-tight">{label}</p>
    </div>
  );
}

const emptyOrc = () => ({
  clienteNome: "", empresa: "", documento: "", data: new Date().toISOString().split("T")[0],
  produto: "", tecido: "", modelagem: "", personalizacao: "",
  quantidade: "", gradeTamanhos: {} as Record<string, number>,
  valorUnitario: "", desconto: "", arquivoUrl: "",
});

const emptyProd = () => ({
  data: new Date().toISOString().split("T")[0],
  etapas: [] as string[],
  orcamentoCodigos: [] as string[],
  codigoInput: "",
  observacoes: "",
});

function generatePDF(orc: any) {
  const grade = orc.grade_tamanhos || {};
  const gradeHtml = Object.entries(grade).filter(([, v]) => Number(v) > 0)
    .map(([k, v]) => `<td style="border:1px solid #ddd;padding:6px 10px;text-align:center"><b>${k}</b><br>${v}</td>`).join("") || `<td style="border:1px solid #ddd;padding:6px 10px">—</td>`;
  const total = (parseFloat(orc.quantidade || 0) * parseFloat(orc.valor_unitario || 0)) - parseFloat(orc.desconto || 0);
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>Orçamento ${orc.codigo}</title>
  <style>body{font-family:Arial,sans-serif;padding:32px;color:#111} h1{color:#1e3a5f} table{border-collapse:collapse;width:100%} td,th{border:1px solid #ddd;padding:8px 12px} th{background:#f5f5f5} .label{color:#666;font-size:12px} .value{font-size:15px;font-weight:600} .total{font-size:18px;color:#1e3a5f;font-weight:bold}</style>
  </head><body>
  <h1>Orçamento ${orc.codigo}</h1>
  <p style="color:#888;margin-top:-12px">${fmtDate(orc.data)}</p>
  <h3>Dados do Cliente</h3>
  <table><tr><td class="label">Nome</td><td class="value">${orc.cliente_nome}</td><td class="label">Empresa</td><td class="value">${orc.empresa || "—"}</td></tr>
  <tr><td class="label">CNPJ/CPF</td><td class="value">${orc.documento || "—"}</td><td class="label">Status</td><td class="value">${STATUS_LABEL[orc.status]}</td></tr></table>
  <h3>Produto</h3>
  <table><tr><td class="label">Produto</td><td class="value">${orc.produto || "—"}</td><td class="label">Tecido</td><td class="value">${orc.tecido || "—"}</td></tr>
  <tr><td class="label">Modelagem</td><td class="value">${orc.modelagem || "—"}</td><td class="label">Personalização</td><td class="value">${orc.personalizacao || "—"}</td></tr></table>
  <h3>Grade de Tamanhos</h3>
  <table><tr>${gradeHtml}</tr></table>
  <h3>Valores</h3>
  <table><tr><td class="label">Quantidade Total</td><td class="value">${orc.quantidade}</td><td class="label">Valor Unitário</td><td class="value">R$ ${fmt(orc.valor_unitario)}</td></tr>
  <tr><td class="label">Desconto</td><td class="value">R$ ${fmt(orc.desconto)}</td><td class="label total">Total</td><td class="total">R$ ${fmt(total)}</td></tr></table>
  ${orc.criado_por ? `<p style="margin-top:32px;color:#888;font-size:12px">Criado por: ${orc.criado_por}</p>` : ""}
  <script>window.onload=()=>window.print()</script>
  </body></html>`;
  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); }
}

export default function ConfeccaoPage() {
  const fetch = authFetch;
  const { toast } = useToast();
  const [responsavel, setResponsavel] = useState(() => localStorage.getItem("confeccao_responsavel") || "");
  const [nomeConfirmado, setNomeConfirmado] = useState(() => !!localStorage.getItem("confeccao_responsavel"));
  const [activeSection, setActiveSection] = useState<"novo-pedido"|"buscar-pedido"|"producao">("novo-pedido");

  // Dashboard
  const [dashAno, setDashAno] = useState(2026);
  const [dashMes, setDashMes] = useState<number|"">("");

  // Buscar pedidos
  const [filtroCodigo, setFiltroCodigo] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [expandedId, setExpandedId] = useState<number|null>(null);

  // Buscar produção
  const [prodFiltroData, setProdFiltroData] = useState("");
  const [prodFiltroResp, setProdFiltroResp] = useState("");

  // Formulários
  const [orcForm, setOrcForm] = useState(emptyOrc());
  const [prodForm, setProdForm] = useState(emptyProd());

  const confirmar = () => {
    if (responsavel.trim()) { localStorage.setItem("confeccao_responsavel", responsavel.trim()); setNomeConfirmado(true); }
  };
  const trocar = () => { localStorage.removeItem("confeccao_responsavel"); setResponsavel(""); setNomeConfirmado(false); };
  const goTo = (s: typeof activeSection) => { setActiveSection(s); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const setO = (k: string, v: any) => setOrcForm(f => ({ ...f, [k]: v }));
  const setP = (k: string, v: any) => setProdForm(f => ({ ...f, [k]: v }));

  const { data: dashboard } = useQuery<any>({
    queryKey: ["/api/confeccao/dashboard", dashAno, dashMes],
    queryFn: async () => {
      const p = new URLSearchParams({ ano: String(dashAno) });
      if (dashMes) p.append("mes", String(dashMes));
      const r = await fetch(`/api/confeccao/dashboard?${p}`);
      return r.json();
    },
    enabled: nomeConfirmado,
  });

  const { data: orcamentos = [], refetch: refetchOrc } = useQuery<any[]>({
    queryKey: ["/api/confeccao/orcamentos", filtroCodigo, filtroCliente, filtroStatus],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (filtroCodigo) p.append("codigo", filtroCodigo);
      if (filtroCliente) p.append("cliente", filtroCliente);
      if (filtroStatus) p.append("status", filtroStatus);
      const r = await fetch(`/api/confeccao/orcamentos?${p}`);
      return r.json();
    },
    enabled: nomeConfirmado,
  });

  const { data: producoes = [] } = useQuery<any[]>({
    queryKey: ["/api/confeccao/producao", prodFiltroData, prodFiltroResp],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (prodFiltroData) p.append("data", prodFiltroData);
      if (prodFiltroResp) p.append("responsavel", prodFiltroResp);
      const r = await fetch(`/api/confeccao/producao?${p}`);
      return r.json();
    },
    enabled: nomeConfirmado,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/confeccao/orcamentos"] });
    queryClient.invalidateQueries({ queryKey: ["/api/confeccao/dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["/api/confeccao/producao"] });
  };

  const createOrc = useMutation({
    mutationFn: (data: any) => apiRequest("/api/confeccao/orcamentos", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { invalidate(); toast({ title: "Orçamento criado!" }); setOrcForm(emptyOrc()); goTo("buscar-pedido"); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateOrc = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/confeccao/orcamentos/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => { invalidate(); toast({ title: "Atualizado!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const createProd = useMutation({
    mutationFn: (data: any) => apiRequest("/api/confeccao/producao", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { invalidate(); toast({ title: "Produção registrada!" }); setProdForm(emptyProd()); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const handleSubmitOrc = () => {
    if (!orcForm.clienteNome.trim()) { toast({ title: "Nome do cliente é obrigatório", variant: "destructive" }); return; }
    if (!orcForm.data) { toast({ title: "Data é obrigatória", variant: "destructive" }); return; }
    createOrc.mutate({ ...orcForm, criadoPor: responsavel });
  };

  const handleSubmitProd = () => {
    if (!prodForm.data) { toast({ title: "Data é obrigatória", variant: "destructive" }); return; }
    if (prodForm.etapas.length === 0) { toast({ title: "Selecione ao menos uma etapa", variant: "destructive" }); return; }
    if (prodForm.orcamentoCodigos.length === 0) { toast({ title: "Adicione ao menos um orçamento", variant: "destructive" }); return; }
    createProd.mutate({ ...prodForm, responsavel, orcamentoCodigos: prodForm.orcamentoCodigos });
  };

  const toggleEtapa = (e: string) => {
    setProdForm(f => ({ ...f, etapas: f.etapas.includes(e) ? f.etapas.filter(x => x !== e) : [...f.etapas, e] }));
  };

  const addCodigo = () => {
    const cod = prodForm.codigoInput.trim().toUpperCase();
    if (!cod) return;
    if (prodForm.orcamentoCodigos.includes(cod)) { toast({ title: "Código já adicionado" }); return; }
    setProdForm(f => ({ ...f, orcamentoCodigos: [...f.orcamentoCodigos, cod], codigoInput: "" }));
  };

  const setGrade = (tam: string, val: string) => {
    setOrcForm(f => ({ ...f, gradeTamanhos: { ...f.gradeTamanhos, [tam]: parseInt(val) || 0 } }));
  };

  const totalOrc = (parseFloat(orcForm.quantidade || "0") * parseFloat(orcForm.valorUnitario || "0")) - parseFloat(orcForm.desconto || "0");

  if (!nomeConfirmado) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-3">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Scissors className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl">IOG Confecção</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Digite seu nome para acessar</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input value={responsavel} onChange={e => setResponsavel(e.target.value)} placeholder="Seu nome completo" onKeyDown={e => e.key === "Enter" && confirmar()} />
            <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold" onClick={confirmar} disabled={!responsavel.trim()}>Entrar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 px-4 py-4 md:px-6 border-l-4 border-l-blue-500">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">IOG Confecção</h1>
              <p className="text-slate-400 text-sm">{responsavel}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="border-slate-600 text-slate-900 hover:bg-slate-700 hover:text-white" onClick={trocar}>Trocar usuário</Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:px-6 space-y-6">

        {/* DASHBOARD */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h2 className="text-white font-semibold text-base">Indicadores</h2>
            </div>
            <div className="flex gap-2">
              <select value={dashAno} onChange={e => setDashAno(Number(e.target.value))}
                className="bg-slate-800 text-white text-sm border border-slate-600 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-400">
                <option value={2026}>2026</option>
              </select>
              <select value={dashMes} onChange={e => setDashMes(e.target.value === "" ? "" : Number(e.target.value))}
                className="bg-slate-800 text-white text-sm border border-slate-600 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-400">
                <option value="">Todos os meses</option>
                {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <KpiCard label="Clientes Atendidos" value={dashboard?.clientesAtendidos ?? 0} />
            <KpiCard label="Pedidos Entregues"  value={dashboard?.pedidosEntregues  ?? 0} />
            <KpiCard label="Peças Produzidas"   value={dashboard?.pecasProduzidas   ?? 0} />
          </div>
        </div>

        <div className="border-t border-slate-700" />

        {/* CARDS DE AÇÃO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { key: "novo-pedido" as const, icon: Plus, title: "Novo Pedido", desc: "Cadastre um novo orçamento de confecção com dados do cliente, produto, grade e valores." },
            { key: "buscar-pedido" as const, icon: Search, title: "Buscar Pedido", desc: "Consulte orçamentos, aprove pedidos e registre entregas." },
            { key: "producao" as const, icon: Factory, title: "Produção Diária", desc: "Registre e consulte a produção diária por etapa e orçamento." },
          ].map(({ key, icon: Icon, title, desc }) => (
            <Card key={key} className={`bg-white ${activeSection === key ? "ring-2 ring-blue-500" : ""}`}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-gray-900">
                  <Icon className="w-5 h-5 text-gray-900" />{title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-500 text-sm">{desc}</p>
                <Button
                  className={`w-full font-semibold text-sm ${activeSection === key ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                  onClick={() => goTo(key)}
                >
                  {activeSection === key ? `${title} Aberto` : title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* === NOVO PEDIDO === */}
        {activeSection === "novo-pedido" && (
          <Card className="border-l-4 border-l-blue-500 bg-white">
            <CardHeader><CardTitle className="text-lg text-gray-900 flex items-center gap-2"><Plus className="w-5 h-5" />Novo Orçamento</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {/* Cliente */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Dados do Cliente</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium mb-1 block text-gray-600">Nome do Cliente <span className="text-red-500">*</span></label>
                    <Input value={orcForm.clienteNome} onChange={e => setO("clienteNome", e.target.value)} placeholder="Nome completo" /></div>
                  <div><label className="text-xs font-medium mb-1 block text-gray-600">Empresa</label>
                    <Input value={orcForm.empresa} onChange={e => setO("empresa", e.target.value)} placeholder="Nome da empresa" /></div>
                  <div><label className="text-xs font-medium mb-1 block text-gray-600">CNPJ / CPF</label>
                    <Input value={orcForm.documento} onChange={e => setO("documento", e.target.value)} placeholder="000.000.000-00" /></div>
                  <div><label className="text-xs font-medium mb-1 block text-gray-600">Data <span className="text-red-500">*</span></label>
                    <Input type="date" value={orcForm.data} onChange={e => setO("data", e.target.value)} /></div>
                </div>
              </div>

              {/* Produto */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Produto</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium mb-1 block text-gray-600">Produto</label>
                    <Input value={orcForm.produto} onChange={e => setO("produto", e.target.value)} placeholder="Ex: Camiseta, Calça..." /></div>
                  <div><label className="text-xs font-medium mb-1 block text-gray-600">Tecido</label>
                    <Input value={orcForm.tecido} onChange={e => setO("tecido", e.target.value)} placeholder="Ex: Malha, Brim..." /></div>
                  <div><label className="text-xs font-medium mb-1 block text-gray-600">Modelagem</label>
                    <Input value={orcForm.modelagem} onChange={e => setO("modelagem", e.target.value)} placeholder="Ex: Slim, Regular..." /></div>
                  <div><label className="text-xs font-medium mb-1 block text-gray-600">Personalização</label>
                    <Input value={orcForm.personalizacao} onChange={e => setO("personalizacao", e.target.value)} placeholder="Ex: Bordado, Silk..." /></div>
                </div>
              </div>

              {/* Grade */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Grade de Tamanhos</p>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                  {TAMANHOS.map(t => (
                    <div key={t} className="text-center">
                      <label className="text-xs font-bold text-gray-600 block mb-1">{t}</label>
                      <Input type="number" min="0" placeholder="0" value={orcForm.gradeTamanhos[t] || ""} onChange={e => setGrade(t, e.target.value)} className="text-center h-9 text-sm" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Valores */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Valores</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="text-xs font-medium mb-1 block text-gray-600">Quantidade Total</label>
                    <Input type="number" min="0" value={orcForm.quantidade} onChange={e => setO("quantidade", e.target.value)} /></div>
                  <div><label className="text-xs font-medium mb-1 block text-gray-600">Valor Unitário (R$)</label>
                    <Input type="number" min="0" step="0.01" value={orcForm.valorUnitario} onChange={e => setO("valorUnitario", e.target.value)} /></div>
                  <div><label className="text-xs font-medium mb-1 block text-gray-600">Desconto (R$)</label>
                    <Input type="number" min="0" step="0.01" value={orcForm.desconto} onChange={e => setO("desconto", e.target.value)} /></div>
                </div>
                {totalOrc > 0 && (
                  <p className="mt-2 text-right text-green-700 font-bold">Total: R$ {fmt(totalOrc)}</p>
                )}
              </div>

              {/* Arquivo */}
              <div>
                <label className="text-xs font-medium mb-1 block text-gray-600">Link do Arquivo / Referência</label>
                <Input value={orcForm.arquivoUrl} onChange={e => setO("arquivoUrl", e.target.value)} placeholder="URL do arquivo ou referência" />
              </div>

              <div className="flex justify-end">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold" onClick={handleSubmitOrc} disabled={createOrc.isPending}>
                  {createOrc.isPending ? "Salvando..." : "Salvar Orçamento"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* === BUSCAR PEDIDO === */}
        {activeSection === "buscar-pedido" && (
          <Card className="border-l-4 border-l-blue-500 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 flex items-center gap-2"><Search className="w-5 h-5" />Buscar Pedidos</CardTitle>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div><label className="text-xs text-gray-500 mb-1 block">Código ORC</label>
                  <Input value={filtroCodigo} onChange={e => setFiltroCodigo(e.target.value)} placeholder="ORC-001" className="h-9 text-sm" /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Cliente</label>
                  <Input value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)} placeholder="Nome do cliente" className="h-9 text-sm" /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Status</label>
                  <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
                    className="w-full h-9 border border-input rounded-md px-3 text-sm bg-background">
                    <option value="">Todos</option>
                    <option value="pendente">Pendente</option>
                    <option value="aprovado">Aprovado</option>
                    <option value="entregue">Entregue</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {orcamentos.length === 0 ? (
                <div className="text-center py-8 text-gray-400 border rounded-lg">Nenhum orçamento encontrado</div>
              ) : (
                <div className="space-y-2">
                  {orcamentos.map((orc: any) => {
                    const isExp = expandedId === orc.id;
                    const grade = orc.grade_tamanhos || {};
                    const total = (parseFloat(orc.quantidade || 0) * parseFloat(orc.valor_unitario || 0)) - parseFloat(orc.desconto || 0);
                    return (
                      <div key={orc.id} className="border rounded-xl overflow-hidden bg-white">
                        <button type="button" className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left"
                          onClick={() => setExpandedId(isExp ? null : orc.id)}>
                          <div className="flex items-center gap-3 flex-1 flex-wrap">
                            <ChevronRight className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExp ? "rotate-90" : ""}`} />
                            <span className="font-mono text-sm font-bold text-blue-700">{orc.codigo}</span>
                            <span className="font-medium text-sm text-gray-900">{orc.cliente_nome}</span>
                            {orc.empresa && <span className="text-xs text-gray-400">{orc.empresa}</span>}
                            <span className="text-xs text-gray-400">{fmtDate(orc.data)}</span>
                            <Badge className={`text-xs border-0 ${STATUS_COLOR[orc.status]}`}>{STATUS_LABEL[orc.status]}</Badge>
                            <span className="text-xs text-green-700 font-semibold">R$ {fmt(total)}</span>
                            <span className="text-xs text-gray-400">{orc.quantidade} peças</span>
                          </div>
                          <div className="flex gap-1 flex-shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                            {orc.status === "pendente" && (
                              <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white text-xs h-7 px-2"
                                onClick={() => updateOrc.mutate({ id: orc.id, status: "aprovado" })}>
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Aprovar
                              </Button>
                            )}
                            {orc.status === "aprovado" && (
                              <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white text-xs h-7 px-2"
                                onClick={() => updateOrc.mutate({ id: orc.id, status: "entregue" })}>
                                <Truck className="w-3.5 h-3.5 mr-1" />Entregue
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-gray-500 hover:text-blue-600 h-7 px-2"
                              onClick={() => generatePDF(orc)}>
                              <FileText className="w-3.5 h-3.5 mr-1" />PDF
                            </Button>
                          </div>
                        </button>
                        {isExp && (
                          <div className="border-t bg-gray-50 p-4 space-y-3 text-sm">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {orc.produto && <div><span className="text-xs text-gray-500">Produto</span><p className="font-medium">{orc.produto}</p></div>}
                              {orc.tecido && <div><span className="text-xs text-gray-500">Tecido</span><p className="font-medium">{orc.tecido}</p></div>}
                              {orc.modelagem && <div><span className="text-xs text-gray-500">Modelagem</span><p className="font-medium">{orc.modelagem}</p></div>}
                              {orc.personalizacao && <div><span className="text-xs text-gray-500">Personalização</span><p className="font-medium">{orc.personalizacao}</p></div>}
                              {orc.documento && <div><span className="text-xs text-gray-500">CNPJ/CPF</span><p className="font-medium">{orc.documento}</p></div>}
                              {orc.criado_por && <div><span className="text-xs text-gray-500">Criado por</span><p className="font-medium">{orc.criado_por}</p></div>}
                            </div>
                            {Object.keys(grade).some(k => grade[k] > 0) && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Grade de Tamanhos</p>
                                <div className="flex gap-2 flex-wrap">
                                  {Object.entries(grade).filter(([, v]) => Number(v) > 0).map(([k, v]) => (
                                    <span key={k} className="bg-white border rounded px-2 py-0.5 text-xs font-medium">{k}: {String(v)}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {orc.arquivo_url && (
                              <div><span className="text-xs text-gray-500">Arquivo:</span> <a href={orc.arquivo_url} target="_blank" rel="noreferrer" className="text-blue-600 text-xs underline">{orc.arquivo_url}</a></div>
                            )}
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

        {/* === PRODUÇÃO DIÁRIA === */}
        {activeSection === "producao" && (
          <div className="space-y-4">
            {/* Cadastrar */}
            <Card className="border-l-4 border-l-blue-500 bg-white">
              <CardHeader><CardTitle className="text-lg text-gray-900 flex items-center gap-2"><Factory className="w-5 h-5" />Registrar Produção</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium mb-1 block text-gray-600">Data <span className="text-red-500">*</span></label>
                    <Input type="date" value={prodForm.data} onChange={e => setP("data", e.target.value)} /></div>
                  <div><label className="text-xs font-medium mb-1 block text-gray-600">Responsável</label>
                    <Input value={responsavel} disabled className="bg-gray-50" /></div>
                </div>

                {/* Orçamentos */}
                <div>
                  <label className="text-xs font-medium mb-1 block text-gray-600">Orçamentos vinculados <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <Input value={prodForm.codigoInput} onChange={e => setP("codigoInput", e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addCodigo()}
                      placeholder="Ex: ORC-001" className="flex-1 text-sm" />
                    <Button type="button" variant="outline" onClick={addCodigo} className="text-sm">Adicionar</Button>
                  </div>
                  {prodForm.orcamentoCodigos.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {prodForm.orcamentoCodigos.map(c => (
                        <span key={c} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-mono px-2 py-1 rounded">
                          {c}
                          <button onClick={() => setP("orcamentoCodigos", prodForm.orcamentoCodigos.filter(x => x !== c))}><XCircle className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Etapas */}
                <div>
                  <p className="text-xs font-medium mb-2 block text-gray-600">Etapas realizadas <span className="text-red-500">*</span></p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {ETAPAS.map(e => (
                      <button key={e} type="button" onClick={() => toggleEtapa(e)}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all
                          ${prodForm.etapas.includes(e) ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-500"}`}>
                        {prodForm.etapas.includes(e) ? <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> : <XCircle className="w-3.5 h-3.5 text-gray-300" />}
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="text-xs font-medium mb-1 block text-gray-600">Observações</label>
                  <Textarea value={prodForm.observacoes} onChange={e => setP("observacoes", e.target.value)} placeholder="Observações opcionais..." rows={2} className="text-sm" />
                </div>

                <div className="flex justify-end">
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold" onClick={handleSubmitProd} disabled={createProd.isPending}>
                    {createProd.isPending ? "Salvando..." : "Registrar Produção"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Consultar */}
            <Card className="bg-white border">
              <CardHeader>
                <CardTitle className="text-base text-gray-900 flex items-center gap-2"><ClipboardList className="w-4 h-4" />Histórico de Produção</CardTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div><label className="text-xs text-gray-500 mb-1 block">Data</label>
                    <Input type="date" value={prodFiltroData} onChange={e => setProdFiltroData(e.target.value)} className="h-9 text-sm" /></div>
                  <div><label className="text-xs text-gray-500 mb-1 block">Responsável</label>
                    <Input value={prodFiltroResp} onChange={e => setProdFiltroResp(e.target.value)} placeholder="Nome..." className="h-9 text-sm" /></div>
                </div>
              </CardHeader>
              <CardContent>
                {producoes.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 border rounded-lg text-sm">Nenhum registro encontrado</div>
                ) : (
                  <div className="space-y-2">
                    {producoes.map((prod: any) => (
                      <div key={prod.id} className="border rounded-lg p-3 bg-gray-50 space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="font-medium text-sm text-gray-900">{fmtDate(prod.data)}</span>
                          <span className="text-xs text-gray-500">por <span className="font-medium text-gray-700">{prod.responsavel}</span></span>
                        </div>
                        {prod.orcamento_codigos?.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {prod.orcamento_codigos.map((c: string) => (
                              <span key={c} className="bg-blue-100 text-blue-700 text-xs font-mono px-2 py-0.5 rounded">{c}</span>
                            ))}
                          </div>
                        )}
                        {prod.etapas?.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {prod.etapas.map((e: string) => (
                              <span key={e} className="flex items-center gap-1 bg-white border text-xs px-2 py-0.5 rounded text-gray-600">
                                <CheckCheck className="w-3 h-3 text-blue-500" />{e}
                              </span>
                            ))}
                          </div>
                        )}
                        {prod.observacoes && <p className="text-xs text-gray-500 italic">{prod.observacoes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
