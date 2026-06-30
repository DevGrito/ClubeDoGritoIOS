import React, { useState, useRef, useEffect } from "react";
import { formatCPF } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TrendingUp, Plus, Search, Trash2, Edit, Briefcase, Store, Upload, X, Eye, ExternalLink, Images, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const FAIXAS_SALARIAIS = [
  "Até 1 salário mínimo",
  "1 a 2 salários mínimos",
  "2 a 3 salários mínimos",
  "3 a 5 salários mínimos",
  "Acima de 5 salários mínimos",
];

const TIPOS_CONTRATO = [
  "CLT",
  "PJ",
  "Temporário",
  "Estágio",
  "Aprendiz",
  "Informal",
  "Outro",
];

const ESCOLARIDADES = [
  "Fundamental incompleto",
  "Fundamental completo",
  "Médio incompleto",
  "Médio completo",
  "Superior incompleto",
  "Superior completo",
  "Pós-graduação",
];

function formatCNPJ(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

const EMPTY_FORM = {
  tipo: "",
  cpf: "",
  nome: "",
  telefone: "",
  email: "",
  genero: "",
  escolaridade: "",
  raca: "",
  participanteInclusaoId: "",
  programaId: "",
  empresa: "",
  cargo: "",
  tipoContrato: "",
  dataContratacao: "",
  faixaSalarial: "",
  nomeNegocio: "",
  segmento: "",
  cnpj: "",
  faturamentoAproximado: "",
  dataInicioAtividade: "",
  observacoes: "",
  status: "ativo",
  padraoGf: null as boolean | null,
};

export function GeracaoRendaSection() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ ...EMPTY_FORM });
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroBusca, setFiltroBusca] = useState("");
  const [partBusca, setPartBusca] = useState("");
  const [partSelecionado, setPartSelecionado] = useState<any | null>(null);
  const [partDropdown, setPartDropdown] = useState(false);
  const [evidenciaFiles, setEvidenciaFiles] = useState<File[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewRecord, setViewRecord] = useState<any | null>(null);
  const [evidenciaModalRecord, setEvidenciaModalRecord] = useState<any | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [pdfModalUrl, setPdfModalUrl] = useState<string | null>(null);
  const [signedEvidUrls, setSignedEvidUrls] = useState<Record<string, string>>({});
  const [loadingSignedUrls, setLoadingSignedUrls] = useState(false);

  const registrosQuery = useQuery<any[]>({
    queryKey: ["/api/geracoes-de-renda", filtroTipo],
    queryFn: async () => {
      const tipoParam = filtroTipo && filtroTipo !== "edital_gf" ? `?tipo=${filtroTipo}` : "";
      const r = await fetch(`/api/geracoes-de-renda${tipoParam}`, { credentials: "include" });
      if (!r.ok) throw new Error("Erro ao carregar");
      return r.json();
    },
  });
  const registrosRaw: any[] = registrosQuery.data ?? [];
  const registros: any[] = registrosRaw.filter((r) => {
    if (filtroTipo === "edital_gf" && !r.padrao_gf) return false;
    if (!filtroBusca.trim()) return true;
    const q = filtroBusca.toLowerCase().replace(/[\.\-\/]/g, '');
    const nome = (r.nome || '').toLowerCase();
    const cpf = (r.cpf || '').replace(/[\.\-\/]/g, '');
    return nome.includes(filtroBusca.toLowerCase().trim()) || cpf.includes(q);
  });

  const programasQuery = useQuery<any[]>({
    queryKey: ["/api/programas-inclusao"],
    queryFn: async () => {
      const r = await fetch("/api/programas-inclusao", { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
  });
  const programas: any[] = programasQuery.data ?? [];

  const participantesQuery = useQuery<any[]>({
    queryKey: ["/api/geracoes-de-renda/buscar-participante", partBusca],
    queryFn: async () => {
      if (partBusca.length < 2) return [];
      const r = await fetch(`/api/geracoes-de-renda/buscar-participante?q=${encodeURIComponent(partBusca)}`, { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
    enabled: partBusca.length >= 2,
  });
  const participantes: any[] = participantesQuery.data ?? [];

  // Busca URLs pré-assinadas (GCS signed URLs) ao abrir qualquer modal com evidências
  async function fetchSignedUrls(record: any) {
    if (!record) { setSignedEvidUrls({}); return; }
    const evids: any[] = record.evidencias || [];
    const paths = evids.map((e: any) => e.storage_url).filter(Boolean);
    if (paths.length === 0) { setSignedEvidUrls({}); return; }
    setLoadingSignedUrls(true);
    try {
      const r = await fetch("/api/geracoes-de-renda/signed-urls", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths }),
      });
      if (r.ok) {
        const { urls } = await r.json();
        setSignedEvidUrls(urls || {});
      }
    } catch {}
    setLoadingSignedUrls(false);
  }

  useEffect(() => { fetchSignedUrls(evidenciaModalRecord); }, [evidenciaModalRecord]);
  useEffect(() => { fetchSignedUrls(viewRecord); }, [viewRecord]);

  const criarMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const r = await fetch("/api/geracoes-de-renda", {
        method: "POST",
        credentials: "include",
        body: data,
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({ error: "Erro" }));
        throw new Error(e.error || "Erro ao criar");
      }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/geracoes-de-renda"] });
      queryClient.invalidateQueries({ queryKey: ["/api/geracoes-de-renda/stats"] });
      toast({ title: "Registro criado com sucesso!" });
      closeDialog();
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const editarMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const r = await fetch(`/api/geracoes-de-renda/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({ error: "Erro" }));
        throw new Error(e.error || "Erro ao editar");
      }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/geracoes-de-renda"] });
      queryClient.invalidateQueries({ queryKey: ["/api/geracoes-de-renda/stats"] });
      toast({ title: "Registro atualizado!" });
      closeDialog();
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deletarMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/geracoes-de-renda/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error("Erro ao deletar");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/geracoes-de-renda"] });
      queryClient.invalidateQueries({ queryKey: ["/api/geracoes-de-renda/stats"] });
      toast({ title: "Registro removido" });
      setDeleteId(null);
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  function closeDialog() {
    setDialog(false);
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setPartBusca("");
    setPartSelecionado(null);
    setEvidenciaFiles([]);
    setTriedSubmit(false);
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setPartSelecionado(null);
    setPartBusca("");
    setEvidenciaFiles([]);
    setTriedSubmit(false);
    setDialog(true);
  }

  function openEdit(rec: any) {
    setEditing(rec);
    setPartSelecionado({ nome: rec.nome, cpf: rec.cpf, telefone: rec.telefone, email: rec.email, genero: rec.genero });
    setForm({
      tipo: rec.tipo || "",
      cpf: rec.cpf || "",
      nome: rec.nome || "",
      telefone: rec.telefone || "",
      email: rec.email || "",
      genero: rec.genero || "",
      escolaridade: rec.escolaridade || "",
      raca: rec.raca || "",
      participanteInclusaoId: rec.participante_inclusao_id || "",
      empresa: rec.empresa || "",
      cargo: rec.cargo || "",
      tipoContrato: rec.tipo_contrato || "",
      dataContratacao: rec.data_contratacao ? rec.data_contratacao.substring(0, 10) : "",
      faixaSalarial: rec.faixa_salarial || "",
      nomeNegocio: rec.nome_negocio || "",
      segmento: rec.segmento || "",
      cnpj: rec.cnpj || "",
      faturamentoAproximado: rec.faturamento_aproximado || "",
      dataInicioAtividade: rec.data_inicio_atividade ? rec.data_inicio_atividade.substring(0, 10) : "",
      observacoes: rec.observacoes || "",
      status: rec.status || "ativo",
      programaId: rec.programa_id ? String(rec.programa_id) : "",
      padraoGf: rec.padrao_gf === true ? true : rec.padrao_gf === false ? false : null,
    });
    setPartBusca(rec.nome || "");
    setDialog(true);
  }

  function selectParticipante(p: any) {
    setPartSelecionado(p);
    setPartBusca(p.nome);
    setPartDropdown(false);
    setForm((prev: any) => ({
      ...prev,
      cpf: p.cpf || "",
      nome: p.nome || "",
      telefone: p.telefone || "",
      email: p.email || "",
      genero: (() => {
        const g = (p.genero || "").toLowerCase().trim();
        if (g === "feminino") return "feminino";
        if (g === "masculino") return "masculino";
        if (g.includes("bin") || g.includes("nao") || g.includes("não")) return "nao_binario";
        if (g.includes("prefiro")) return "prefiro_nao_informar";
        if (g === "outro") return "outro";
        return g;
      })(),
      raca: p.raca || "",
      escolaridade: p.escolaridade || prev.escolaridade,
      participanteInclusaoId: p.id || "",
    }));
  }

  function handleSubmit() {
    setTriedSubmit(true);
    if (!form.tipo) return toast({ title: "Selecione o tipo", variant: "destructive" });
    // programaId is optional
    if (!form.nome || !form.cpf) return toast({ title: "Nome e CPF são obrigatórios", variant: "destructive" });
    if (form.tipo === "empregabilidade" && !form.empresa) {
      return toast({ title: "Informe a empresa", variant: "destructive" });
    }
    if (form.tipo === "empreendedorismo" && !form.segmento) {
      return toast({ title: "Informe a área de atuação", variant: "destructive" });
    }
    if (form.padraoGf === null || form.padraoGf === undefined) {
      return toast({ title: "Informe se é Edital Gerando Falcões", variant: "destructive" });
    }
    if (!editing && evidenciaFiles.length === 0) {
      return toast({ title: "Anexe pelo menos uma evidência", variant: "destructive" });
    }

    if (editing) {
      editarMutation.mutate({ id: editing.id, data: form });
    } else {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, String(v)); });
      evidenciaFiles.forEach(f => fd.append("evidencias", f));
      criarMutation.mutate(fd);
    }
  }

  const isBusy = criarMutation.isPending || editarMutation.isPending;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Geração de Renda
            </CardTitle>
            <Button onClick={openCreate} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Cadastrar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4 flex-wrap">
            <input
              type="text"
              value={filtroBusca}
              onChange={(e) => setFiltroBusca(e.target.value)}
              placeholder="Buscar por nome ou CPF..."
              className="border rounded-md px-3 py-2 text-sm flex-1 min-w-[200px] outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Select value={filtroTipo || "todos"} onValueChange={(v) => setFiltroTipo(v === "todos" ? "" : v)}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="empregabilidade">Empregabilidade</SelectItem>
                <SelectItem value="empreendedorismo">Empreendedorismo</SelectItem>
                <SelectItem value="edital_gf">Edital Gerando Falcões</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {registrosQuery.isLoading ? (
            <div className="py-10 text-center text-gray-500">Carregando...</div>
          ) : registros.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Nenhum registro de geração de renda ainda.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-1" /> Cadastrar primeiro
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Detalhe</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registros.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.nome}</TableCell>
                      <TableCell className="text-sm text-gray-500">{formatCPF(r.cpf)}</TableCell>
                      <TableCell>
                        {r.tipo === "empregabilidade" ? (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                            <Briefcase className="w-3 h-3 mr-1" />
                            Empregabilidade
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                            <Store className="w-3 h-3 mr-1" />
                            Empreendedorismo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.tipo === "empregabilidade"
                          ? [r.empresa, r.cargo].filter(Boolean).join(" — ")
                          : r.nome_negocio}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.status === "ativo" ? "default" : "secondary"}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {r.criado_em ? format(new Date(r.criado_em), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {Array.isArray(r.evidencias) && r.evidencias.length > 0 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                              title={`Ver evidências (${r.evidencias.length})`}
                              onClick={() => setEvidenciaModalRecord(r)}
                            >
                              <Images className="w-4 h-4" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewRecord(r)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(r)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => setDeleteId(r.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cadastro / Edição */}
      <Dialog open={dialog} onOpenChange={(v) => { if (!v) closeDialog(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Registro" : "Cadastrar Geração de Renda"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Tipo */}
            <div>
              <label className="text-sm font-medium mb-1 block">Tipo *</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setForm((p: any) => ({ ...p, tipo: "empregabilidade" }))}
                  disabled={!!editing}
                  className={`flex-1 border rounded-lg p-3 flex flex-col items-center gap-1 transition-colors ${
                    form.tipo === "empregabilidade"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300"
                  } ${editing ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <Briefcase className="w-5 h-5" />
                  <span className="text-sm font-medium">Empregabilidade</span>
                  <span className="text-xs text-gray-500">Vínculo empregatício</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm((p: any) => ({ ...p, tipo: "empreendedorismo" }))}
                  disabled={!!editing}
                  className={`flex-1 border rounded-lg p-3 flex flex-col items-center gap-1 transition-colors ${
                    form.tipo === "empreendedorismo"
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-gray-200 hover:border-gray-300"
                  } ${editing ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <Store className="w-5 h-5" />
                  <span className="text-sm font-medium">Empreendedorismo</span>
                  <span className="text-xs text-gray-500">Negócio próprio</span>
                </button>
              </div>
            </div>

            {/* Programa */}
            <div>
              <label className="text-sm font-medium mb-1 block">Programa de origem</label>
              <Select
                value={form.programaId || ""}
                onValueChange={(v) => setForm((p: any) => ({ ...p, programaId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o programa..." />
                </SelectTrigger>
                <SelectContent>
                  {programas.map((prog: any) => (
                    <SelectItem key={prog.id} value={String(prog.id)}>
                      {prog.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Busca de participante */}
            {!editing && (
              <div className="relative">
                <label className="text-sm font-medium mb-1 block">Participante *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <Input
                    className="pl-9"
                    placeholder="Buscar por nome ou CPF..."
                    value={partBusca}
                    onChange={(e) => {
                      setPartBusca(e.target.value);
                      setPartSelecionado(null);
                      setPartDropdown(true);
                    }}
                    onFocus={() => setPartDropdown(true)}
                  />
                  {partSelecionado && (
                    <button
                      type="button"
                      onClick={() => { setPartSelecionado(null); setPartBusca(""); setForm((p: any) => ({ ...p, cpf: "", nome: "", telefone: "", email: "", genero: "" })); }}
                      className="absolute right-2 top-2"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
                {partDropdown && participantes.length > 0 && !partSelecionado && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {participantes.map((p: any) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectParticipante(p)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <div className="font-medium text-sm">{p.nome}</div>
                        <div className="text-xs text-gray-500">{formatCPF(p.cpf)}</div>
                      </button>
                    ))}
                  </div>
                )}
                {partDropdown && partBusca.length >= 2 && participantes.length === 0 && !participantesQuery.isLoading && !partSelecionado && (
                  <div className="text-xs text-gray-500 mt-1">Nenhum participante encontrado. Preencha os dados manualmente abaixo.</div>
                )}
              </div>
            )}

            {/* Dados pessoais */}
            <div className="grid grid-cols-2 gap-3">
              {(() => {
                const locked = (field: string) => !!(partSelecionado && partSelecionado[field] && String(partSelecionado[field]).trim() !== "");
                const lockClass = (field: string) => locked(field) ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "";
                return (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Nome completo *</label>
                      <Input value={form.nome} onChange={(e) => setForm((p: any) => ({ ...p, nome: e.target.value }))} placeholder="Nome" readOnly={locked("nome")} className={lockClass("nome")} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">CPF *</label>
                      <Input value={form.cpf} onChange={(e) => setForm((p: any) => ({ ...p, cpf: e.target.value }))} placeholder="000.000.000-00" readOnly={locked("cpf")} className={lockClass("cpf")} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Telefone *</label>
                      <Input value={form.telefone} onChange={(e) => setForm((p: any) => ({ ...p, telefone: e.target.value }))} placeholder="(11) 99999-9999" readOnly={locked("telefone")} className={lockClass("telefone")} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">E-mail</label>
                      <Input value={form.email} onChange={(e) => setForm((p: any) => ({ ...p, email: e.target.value }))} placeholder="email@exemplo.com" readOnly={locked("email")} className={lockClass("email")} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Gênero *</label>
                      <Select value={form.genero || undefined} onValueChange={(v) => setForm((p: any) => ({ ...p, genero: v }))} disabled={locked("genero")}>
                        <SelectTrigger className={lockClass("genero")}><SelectValue placeholder="Selecionar" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="masculino">Masculino</SelectItem>
                          <SelectItem value="feminino">Feminino</SelectItem>
                          <SelectItem value="nao_binario">Não-binário</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                          <SelectItem value="prefiro_nao_informar">Prefiro não informar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                );
              })()}
              <div>
                <label className="text-sm font-medium mb-1 block">Escolaridade</label>
                <Select value={form.escolaridade} onValueChange={(v) => setForm((p: any) => ({ ...p, escolaridade: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {ESCOLARIDADES.map((e) => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Campos de Empregabilidade */}
            {form.tipo === "empregabilidade" && (
              <div className="space-y-3 border rounded-lg p-3 bg-blue-50/40">
                <p className="text-sm font-medium text-blue-700 flex items-center gap-1">
                  <Briefcase className="w-4 h-4" /> Dados de Empregabilidade
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Empresa *</label>
                    <Input value={form.empresa} onChange={(e) => setForm((p: any) => ({ ...p, empresa: e.target.value }))} placeholder="Nome da empresa" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Cargo</label>
                    <Input value={form.cargo} onChange={(e) => setForm((p: any) => ({ ...p, cargo: e.target.value }))} placeholder="Cargo/função" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Tipo de contrato</label>
                    <Select value={form.tipoContrato} onValueChange={(v) => setForm((p: any) => ({ ...p, tipoContrato: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                      <SelectContent>
                        {TIPOS_CONTRATO.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Data de contratação</label>
                    <Input type="date" value={form.dataContratacao} onChange={(e) => setForm((p: any) => ({ ...p, dataContratacao: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium mb-1 block">Faixa salarial</label>
                    <Select value={form.faixaSalarial} onValueChange={(v) => setForm((p: any) => ({ ...p, faixaSalarial: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                      <SelectContent>
                        {FAIXAS_SALARIAIS.map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Campos de Empreendedorismo */}
            {form.tipo === "empreendedorismo" && (
              <div className="space-y-3 border rounded-lg p-3 bg-orange-50/40">
                <p className="text-sm font-medium text-orange-700 flex items-center gap-1">
                  <Store className="w-4 h-4" /> Dados de Empreendedorismo
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Área de Atuação *</label>
                    <Input value={form.segmento} onChange={(e) => setForm((p: any) => ({ ...p, segmento: e.target.value }))} placeholder="Ex: Artesanato, Beleza, Alimentação..." />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Nome do negócio (opcional)</label>
                    <Input value={form.nomeNegocio} onChange={(e) => setForm((p: any) => ({ ...p, nomeNegocio: e.target.value }))} placeholder="Nome do empreendimento" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">CNPJ (opcional)</label>
                    <Input value={form.cnpj} onChange={(e) => setForm((p: any) => ({ ...p, cnpj: formatCNPJ(e.target.value) }))} placeholder="00.000.000/0000-00" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Faturamento aproximado</label>
                    <Input value={form.faturamentoAproximado} onChange={(e) => setForm((p: any) => ({ ...p, faturamentoAproximado: e.target.value }))} placeholder="Ex: R$ 3.000/mês" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Início da atividade</label>
                    <Input type="date" value={form.dataInicioAtividade} onChange={(e) => setForm((p: any) => ({ ...p, dataInicioAtividade: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}

            {/* Status (edição) */}
            {editing && (
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select value={form.status} onValueChange={(v) => setForm((p: any) => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="em_analise">Em análise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Evidência (somente criação) */}
            {!editing && (
              <div>
                <label className="text-sm font-medium mb-1 block">Evidência <span className="text-red-500">*</span></label>
                <div
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {evidenciaFiles.length > 0 ? (
                    <div className="space-y-1">
                      {evidenciaFiles.map((f, i) => (
                        <div key={i} className="flex items-center justify-center gap-2 text-green-600">
                          <Upload className="w-4 h-4" />
                          <span className="text-sm">{f.name}</span>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setEvidenciaFiles(prev => prev.filter((_, j) => j !== i)); }}>
                            <X className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      ))}
                      <p className="text-xs text-gray-400 mt-1">Clique para adicionar mais (máx. 5)</p>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm">
                      <Upload className="w-6 h-6 mx-auto mb-1" />
                      Clique para anexar fotos ou PDFs — obrigatório (máx. 5 arquivos, 10 MB cada)
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  multiple
                  onChange={(e) => {
                    const novos = Array.from(e.target.files || []);
                    setEvidenciaFiles(prev => [...prev, ...novos].slice(0, 5));
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                />
              </div>
            )}

            {/* Edital GF */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Edital Gerando Falcões? <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="padrao-gf-sim"
                    checked={form.padraoGf === true}
                    onCheckedChange={() => setForm((p: any) => ({ ...p, padraoGf: true }))}
                  />
                  <label htmlFor="padrao-gf-sim" className="text-sm cursor-pointer select-none">Sim</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="padrao-gf-nao"
                    checked={form.padraoGf === false}
                    onCheckedChange={() => setForm((p: any) => ({ ...p, padraoGf: false }))}
                  />
                  <label htmlFor="padrao-gf-nao" className="text-sm cursor-pointer select-none">Não</label>
                </div>
              </div>
              {triedSubmit && (form.padraoGf === null || form.padraoGf === undefined) && (
                <p className="text-red-500 text-xs mt-1">Selecione uma opção</p>
              )}
            </div>

            {/* Observações */}
            <div>
              <label className="text-sm font-medium mb-1 block">Observações</label>
              <Textarea
                value={form.observacoes}
                onChange={(e) => setForm((p: any) => ({ ...p, observacoes: e.target.value }))}
                placeholder="Notas adicionais..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeDialog} disabled={isBusy}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={isBusy}>
                {isBusy ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Visualizar registro */}
      <Dialog open={!!viewRecord} onOpenChange={(v) => { if (!v) setViewRecord(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes — {viewRecord?.nome}</DialogTitle>
          </DialogHeader>
          {viewRecord && (
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                {viewRecord.tipo === "empregabilidade" ? (
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200"><Briefcase className="w-3 h-3 mr-1" />Empregabilidade</Badge>
                ) : (
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200"><Store className="w-3 h-3 mr-1" />Empreendedorismo</Badge>
                )}
                <Badge variant={viewRecord.status === "ativo" ? "default" : "secondary"}>{viewRecord.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-y-2">
                <div><span className="text-gray-500">CPF:</span> {formatCPF(viewRecord.cpf)}</div>
                <div><span className="text-gray-500">Telefone:</span> {viewRecord.telefone}</div>
                <div><span className="text-gray-500">Email:</span> {viewRecord.email || "—"}</div>
                <div><span className="text-gray-500">Gênero:</span> {viewRecord.genero || "—"}</div>
                <div><span className="text-gray-500">Escolaridade:</span> {viewRecord.escolaridade || "—"}</div>
                <div className="col-span-2"><span className="text-gray-500">Programa:</span>{" "}
                  {programas.find((p: any) => p.id === viewRecord.programa_id)?.nome || "—"}
                </div>
              </div>
              {viewRecord.tipo === "empregabilidade" && (
                <div className="border rounded-lg p-3 bg-blue-50/40 space-y-1">
                  <p className="font-medium text-blue-700">Empregabilidade</p>
                  <div className="grid grid-cols-2 gap-y-1">
                    <div><span className="text-gray-500">Empresa:</span> {viewRecord.empresa || "—"}</div>
                    <div><span className="text-gray-500">Cargo:</span> {viewRecord.cargo || "—"}</div>
                    <div><span className="text-gray-500">Contrato:</span> {viewRecord.tipo_contrato || "—"}</div>
                    <div><span className="text-gray-500">Salário:</span> {viewRecord.faixa_salarial || "—"}</div>
                    <div><span className="text-gray-500">Contratação:</span> {viewRecord.data_contratacao ? format(new Date(viewRecord.data_contratacao), "dd/MM/yyyy", { locale: ptBR }) : "—"}</div>
                  </div>
                </div>
              )}
              {viewRecord.tipo === "empreendedorismo" && (
                <div className="border rounded-lg p-3 bg-orange-50/40 space-y-1">
                  <p className="font-medium text-orange-700">Empreendedorismo</p>
                  <div className="grid grid-cols-2 gap-y-1">
                    <div><span className="text-gray-500">Área de Atuação:</span> {viewRecord.segmento || viewRecord.nome_negocio || "—"}</div>
                    <div><span className="text-gray-500">Negócio:</span> {viewRecord.nome_negocio || "—"}</div>
                    <div><span className="text-gray-500">CNPJ:</span> {viewRecord.cnpj || "—"}</div>
                    <div><span className="text-gray-500">Faturamento:</span> {viewRecord.faturamento_aproximado || "—"}</div>
                    <div><span className="text-gray-500">Início:</span> {viewRecord.data_inicio_atividade ? format(new Date(viewRecord.data_inicio_atividade), "dd/MM/yyyy", { locale: ptBR }) : "—"}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Edital Gerando Falcões:</span>
                {viewRecord.padrao_gf ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200">Sim</Badge>
                ) : (
                  <Badge variant="secondary" className="text-white">Não</Badge>
                )}
              </div>
              {viewRecord.observacoes && (
                <div>
                  <span className="text-gray-500 block">Observações:</span>
                  <p className="mt-1 text-gray-700">{viewRecord.observacoes}</p>
                </div>
              )}
              {viewRecord.evidencias && viewRecord.evidencias.length > 0 && (
                <div>
                  <span className="text-gray-500 block mb-1">Evidências:</span>
                  <div className="space-y-2">
                    {viewRecord.evidencias.map((ev: any) => {
                      const sigUrl = signedEvidUrls[ev.storage_url] || "";
                      const isImage = ev.mime_type?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(ev.nome_arquivo);
                      return isImage ? (
                        <div key={ev.id}>
                          {sigUrl ? (
                            <img
                              src={sigUrl}
                              alt={ev.nome_arquivo}
                              onClick={() => setLightboxUrl(sigUrl)}
                              className="max-w-full rounded-lg border max-h-64 object-contain cursor-zoom-in hover:opacity-90 transition-opacity"
                            />
                          ) : (
                            <p className="text-xs text-gray-400">Carregando imagem...</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">{ev.nome_arquivo}</p>
                        </div>
                      ) : (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => sigUrl && setPdfModalUrl(sigUrl)}
                          disabled={!sigUrl}
                          className="flex items-center gap-1 text-blue-600 hover:underline text-xs disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          <ExternalLink className="w-3 h-3" />{ev.nome_arquivo}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Evidências */}
      <Dialog open={!!evidenciaModalRecord} onOpenChange={(v) => { if (!v) setEvidenciaModalRecord(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Images className="w-5 h-5 text-indigo-600" />
              Evidências — {evidenciaModalRecord?.nome}
            </DialogTitle>
          </DialogHeader>
          {evidenciaModalRecord && (
            <div className="space-y-4">
              {loadingSignedUrls ? (
                <p className="text-gray-400 text-sm text-center py-8">Carregando evidências...</p>
              ) : (evidenciaModalRecord.evidencias || []).length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">Nenhuma evidência cadastrada.</p>
              ) : (
                (evidenciaModalRecord.evidencias || []).map((ev: any) => {
                  const sigUrl = signedEvidUrls[ev.storage_url] || "";
                  const isImage = ev.mime_type?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(ev.nome_arquivo || '');
                  const isPdf = ev.mime_type === 'application/pdf' || /\.pdf$/i.test(ev.nome_arquivo || '');
                  return (
                    <div key={ev.id} className="border rounded-xl overflow-hidden bg-gray-50">
                      {/* Header do arquivo */}
                      <div className="flex items-center justify-between px-4 py-2 bg-white border-b">
                        <span className="text-sm font-medium text-gray-700 truncate flex-1">{ev.nome_arquivo}</span>
                        {sigUrl ? (
                          <a
                            href={sigUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-2 flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="w-3.5 h-3.5" />
                            Baixar
                          </a>
                        ) : (
                          <span className="ml-2 text-xs text-gray-400 px-3 py-1.5">Link indisponível</span>
                        )}
                      </div>
                      {/* Conteúdo */}
                      <div className="p-3">
                        {!sigUrl ? (
                          <div className="flex flex-col items-center gap-3 py-6">
                            <ExternalLink className="w-8 h-8 text-gray-300" />
                            <p className="text-sm text-gray-400">Não foi possível carregar o arquivo</p>
                          </div>
                        ) : isImage ? (
                          <div className="flex flex-col items-center gap-2">
                            <img
                              src={sigUrl}
                              alt={ev.nome_arquivo}
                              className="max-w-full max-h-96 object-contain rounded-lg cursor-zoom-in hover:opacity-90 transition-opacity shadow-sm"
                              onClick={() => setLightboxUrl(sigUrl)}
                            />
                            <p className="text-xs text-gray-400">Clique na imagem para ampliar</p>
                          </div>
                        ) : isPdf ? (
                          <div className="flex flex-col gap-2">
                            <iframe
                              src={sigUrl}
                              className="w-full h-80 rounded-lg border"
                              title={ev.nome_arquivo}
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-3 py-6">
                            <ExternalLink className="w-8 h-8 text-gray-400" />
                            <p className="text-sm text-gray-500">Arquivo não previsualizado</p>
                            <a
                              href={sigUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 hover:underline text-sm"
                            >
                              Abrir arquivo
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lightbox de imagem */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxUrl}
            alt="Evidência"
            className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Modal de PDF */}
      {pdfModalUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPdfModalUrl(null)}
        >
          <div
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="text-sm font-medium text-gray-700">Visualizar documento</span>
              <button
                onClick={() => setPdfModalUrl(null)}
                className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <iframe
              src={pdfModalUrl}
              className="flex-1 w-full rounded-b-xl"
              title="Documento"
            />
          </div>
        </div>
      )}

      {/* Confirmação de exclusão */}
      <AlertDialog open={deleteId !== null} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover registro</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro de geração de renda será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteId && deletarMutation.mutate(deleteId)}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
