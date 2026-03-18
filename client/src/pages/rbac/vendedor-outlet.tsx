import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Store,
  Plus,
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  BarChart3,
} from "lucide-react";

export default function VendedorOutletPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"registro" | "historico" | "indicadores">("indicadores");
  const [vendedorNome, setVendedorNome] = useState(() => {
    return localStorage.getItem("outlet_vendedor_nome") || "";
  });
  const [nomeConfirmado, setNomeConfirmado] = useState(() => {
    return !!localStorage.getItem("outlet_vendedor_nome");
  });

  const [form, setForm] = useState({
    data: new Date().toISOString().split("T")[0],
    fluxoPessoas: "",
    itensVendidos: "",
    valorTotal: "",
    observacao: "",
  });

  const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1);
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear());
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ fluxoPessoas: "", itensVendidos: "", valorTotal: "", observacao: "" });

  const confirmarNome = () => {
    if (vendedorNome.trim()) {
      localStorage.setItem("outlet_vendedor_nome", vendedorNome.trim());
      setNomeConfirmado(true);
    }
  };

  const trocarVendedor = () => {
    localStorage.removeItem("outlet_vendedor_nome");
    setVendedorNome("");
    setNomeConfirmado(false);
  };

  const { data: vendas = [], isLoading: loadingVendas } = useQuery<any[]>({
    queryKey: ["/api/outlet/vendas", vendedorNome, filtroMes, filtroAno],
    queryFn: async () => {
      const res = await fetch(`/api/outlet/vendas?vendedor_nome=${encodeURIComponent(vendedorNome)}&mes=${filtroMes}&ano=${filtroAno}`);
      if (!res.ok) throw new Error("Erro ao buscar vendas");
      return res.json();
    },
    enabled: nomeConfirmado,
  });

  const { data: indicadores, isLoading: loadingIndicadores } = useQuery<any>({
    queryKey: ["/api/outlet/indicadores", vendedorNome, filtroMes, filtroAno],
    queryFn: async () => {
      const res = await fetch(`/api/outlet/indicadores?vendedor_nome=${encodeURIComponent(vendedorNome)}&mes=${filtroMes}&ano=${filtroAno}`);
      if (!res.ok) throw new Error("Erro ao buscar indicadores");
      return res.json();
    },
    enabled: nomeConfirmado,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/outlet/vendas", { method: "POST", body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/outlet/vendas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/outlet/indicadores"] });
      toast({ title: "Registro salvo com sucesso!" });
      setForm({ data: new Date().toISOString().split("T")[0], fluxoPessoas: "", itensVendidos: "", valorTotal: "", observacao: "" });
      setActiveTab("historico");
    },
    onError: (e: any) => toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return apiRequest(`/api/outlet/vendas/${id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/outlet/vendas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/outlet/indicadores"] });
      toast({ title: "Registro atualizado!" });
      setEditId(null);
    },
    onError: (e: any) => toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/outlet/vendas/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/outlet/vendas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/outlet/indicadores"] });
      toast({ title: "Registro excluido!" });
    },
    onError: (e: any) => toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!form.fluxoPessoas && !form.itensVendidos && !form.valorTotal) {
      toast({ title: "Preencha pelo menos um campo de venda", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      vendedorNome: vendedorNome.trim(),
      data: form.data,
      fluxoPessoas: parseInt(form.fluxoPessoas) || 0,
      itensVendidos: parseInt(form.itensVendidos) || 0,
      valorTotal: parseFloat(form.valorTotal) || 0,
      observacao: form.observacao,
    });
  };

  const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  if (!nomeConfirmado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Store className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl">Vendedor Outlet</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Digite seu nome para acessar</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={vendedorNome}
              onChange={(e) => setVendedorNome(e.target.value)}
              placeholder="Seu nome completo"
              onKeyDown={(e) => e.key === "Enter" && confirmarNome()}
            />
            <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={confirmarNome} disabled={!vendedorNome.trim()}>
              Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-4 md:px-6 border-l-4 border-l-orange-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Outlet - Vendedor</h1>
              <p className="text-sm text-gray-500">{vendedorNome}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={trocarVendedor}>Trocar vendedor</Button>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button size="sm" variant={activeTab === "indicadores" ? "default" : "outline"} onClick={() => setActiveTab("indicadores")}
            className={activeTab === "indicadores" ? "bg-orange-500 hover:bg-orange-600" : ""}>
            <BarChart3 className="w-4 h-4 mr-1" /> Indicadores
          </Button>
          <Button size="sm" variant={activeTab === "registro" ? "default" : "outline"} onClick={() => setActiveTab("registro")}
            className={activeTab === "registro" ? "bg-orange-500 hover:bg-orange-600" : ""}>
            <Plus className="w-4 h-4 mr-1" /> Novo Registro
          </Button>
          <Button size="sm" variant={activeTab === "historico" ? "default" : "outline"} onClick={() => setActiveTab("historico")}
            className={activeTab === "historico" ? "bg-orange-500 hover:bg-orange-600" : ""}>
            <Calendar className="w-4 h-4 mr-1" /> Historico
          </Button>
        </div>

        {activeTab === "indicadores" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <select className="border rounded-lg px-3 py-2 text-sm" value={filtroMes} onChange={(e) => setFiltroMes(parseInt(e.target.value))}>
                {meses.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select className="border rounded-lg px-3 py-2 text-sm" value={filtroAno} onChange={(e) => setFiltroAno(parseInt(e.target.value))}>
                {[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {loadingIndicadores ? (
              <div className="text-center py-8 text-gray-500">Carregando indicadores...</div>
            ) : indicadores ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Vendido</p>
                        <p className="text-xl font-bold text-green-600">
                          R$ {parseFloat(indicadores.total_vendido || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Itens Vendidos</p>
                        <p className="text-xl font-bold text-blue-600">{parseInt(indicadores.total_itens || 0)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Fluxo de Pessoas</p>
                        <p className="text-xl font-bold text-purple-600">{parseInt(indicadores.total_fluxo || 0)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            <Card>
              <CardContent className="p-4 text-center text-sm text-gray-500">
                <p className="font-medium">{meses[filtroMes - 1]} de {filtroAno}</p>
                <p>{indicadores?.total_registros || 0} dia(s) registrado(s) neste mês</p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "registro" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-orange-500" /> Registro Diario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Data</label>
                  <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Fluxo de Pessoas</label>
                  <Input type="number" min="0" placeholder="Quantidade de pessoas que passaram" value={form.fluxoPessoas}
                    onChange={(e) => setForm({ ...form, fluxoPessoas: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Itens Vendidos</label>
                  <Input type="number" min="0" placeholder="Quantidade de itens vendidos" value={form.itensVendidos}
                    onChange={(e) => setForm({ ...form, itensVendidos: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Valor Total Vendido (R$)</label>
                  <Input type="number" min="0" step="0.01" placeholder="0,00" value={form.valorTotal}
                    onChange={(e) => setForm({ ...form, valorTotal: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Observacao (opcional)</label>
                <textarea className="w-full border rounded-lg p-2 text-sm min-h-[80px]" value={form.observacao}
                  onChange={(e) => setForm({ ...form, observacao: e.target.value })} placeholder="Alguma observacao sobre o dia..." />
              </div>
              <div className="flex justify-end">
                <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleSubmit} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Salvando..." : "Salvar Registro"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "historico" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <select className="border rounded-lg px-3 py-2 text-sm" value={filtroMes} onChange={(e) => setFiltroMes(parseInt(e.target.value))}>
                {meses.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select className="border rounded-lg px-3 py-2 text-sm" value={filtroAno} onChange={(e) => setFiltroAno(parseInt(e.target.value))}>
                {[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {loadingVendas ? (
              <div className="text-center py-8 text-gray-500">Carregando historico...</div>
            ) : vendas.length > 0 ? (
              <div className="space-y-2">
                {vendas.map((v: any) => {
                  const isExpanded = expandedId === v.id;
                  const isEditing = editId === v.id;

                  if (isEditing) {
                    return (
                      <Card key={v.id} className="border-orange-200 bg-orange-50">
                        <CardContent className="p-4 space-y-3">
                          <h4 className="font-semibold text-orange-800">Editar Registro</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="text-sm font-medium mb-1 block">Fluxo</label>
                              <Input type="number" min="0" value={editForm.fluxoPessoas} onChange={(e) => setEditForm({ ...editForm, fluxoPessoas: e.target.value })} />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-1 block">Itens Vendidos</label>
                              <Input type="number" min="0" value={editForm.itensVendidos} onChange={(e) => setEditForm({ ...editForm, itensVendidos: e.target.value })} />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-1 block">Valor Total (R$)</label>
                              <Input type="number" min="0" step="0.01" value={editForm.valorTotal} onChange={(e) => setEditForm({ ...editForm, valorTotal: e.target.value })} />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Observacao</label>
                            <textarea className="w-full border rounded-lg p-2 text-sm" value={editForm.observacao}
                              onChange={(e) => setEditForm({ ...editForm, observacao: e.target.value })} />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => setEditId(null)}>Cancelar</Button>
                            <Button size="sm" className="bg-orange-500 hover:bg-orange-600" disabled={updateMutation.isPending}
                              onClick={() => updateMutation.mutate({
                                id: v.id,
                                fluxoPessoas: parseInt(editForm.fluxoPessoas) || 0,
                                itensVendidos: parseInt(editForm.itensVendidos) || 0,
                                valorTotal: parseFloat(editForm.valorTotal) || 0,
                                observacao: editForm.observacao,
                              })}>
                              {updateMutation.isPending ? "Salvando..." : "Salvar"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  return (
                    <div key={v.id} className="border rounded-lg overflow-hidden bg-white">
                      <button
                        type="button"
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-orange-50/50 transition-colors text-left"
                        onClick={() => setExpandedId(isExpanded ? null : v.id)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <ChevronRight className={`w-4 h-4 text-orange-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                          <span className="font-medium text-sm">{v.data ? new Date(v.data + "T12:00:00").toLocaleDateString("pt-BR") : "-"}</span>
                          <Badge variant="outline" className="text-xs border-green-300 text-green-600">
                            R$ {parseFloat(v.valor_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </Badge>
                          <span className="text-xs text-gray-400">{v.itens_vendidos} itens</span>
                        </div>
                        <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-700 h-7 w-7 p-0"
                            onClick={() => {
                              setEditId(v.id);
                              setEditForm({
                                fluxoPessoas: String(v.fluxo_pessoas || 0),
                                itensVendidos: String(v.itens_vendidos || 0),
                                valorTotal: String(v.valor_total || 0),
                                observacao: v.observacao || "",
                              });
                            }}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 h-7 w-7 p-0"
                            onClick={() => { if (confirm("Excluir este registro?")) deleteMutation.mutate(v.id); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="border-t bg-gray-50 px-4 py-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-purple-500" />
                              <span className="text-gray-500">Fluxo:</span>
                              <span className="font-medium">{v.fluxo_pessoas} pessoas</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ShoppingBag className="w-4 h-4 text-blue-500" />
                              <span className="text-gray-500">Itens:</span>
                              <span className="font-medium">{v.itens_vendidos} vendidos</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-green-500" />
                              <span className="text-gray-500">Valor:</span>
                              <span className="font-medium text-green-600">
                                R$ {parseFloat(v.valor_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                          {v.observacao && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-500">Observacao:</span>
                              <p className="text-gray-700 mt-1">{v.observacao}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 border rounded-lg bg-white">
                Nenhum registro encontrado para {meses[filtroMes - 1]} de {filtroAno}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
