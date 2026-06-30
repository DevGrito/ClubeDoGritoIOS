import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, authFetch } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ChevronDown, ChevronUp, Loader2, User, Search, X } from "lucide-react";

interface Props {
  userId: string | number;
  userRole: string;
}

const RESPONSAVEIS = ["Psicólogo(a)", "Assistente Social", "Coordenação Psicossocial"];
const TIPOS_ATENDIMENTO = ["Atendimento psicossocial", "Visita domiciliar"];
const ORIGENS_ENCAMINHAMENTO = [
  "Não possui", "CRAS Luar da Pampulha", "CRAS Nacional", "CREAS Ribeirão das Neves",
  "Conselho Tutelar Justinópolis", "Conselho Tutelar Nacional",
  "Programa Saúde da Família Jardim Alvorada", "Programa Fica Vivo!", "PresP", "Outros projetos sociais",
];
const BAIRROS = [
  "Jardim Alvorada", "Soares", "Luana", "Rosimeire", "Verônica",
  "Xangri-lá / Parque Xangri-lá", "Bom Jesus", "Nacional", "Município de Belo Horizonte", "Outro",
];
const ENCAMINHAMENTOS = [
  "Conhecer / Procurar o setor de Inclusão Produtiva",
  "Conhecer / Procurar o setor do Programa Esportivo Cultural (PEC)",
  "Lista de espera – Psicanálise",
  "Encaminhamento para o CRAS Luar da Pampulha",
  "Encaminhamento para o CRAS Nacional",
  "Encaminhamento para o CREAS Ribeirão das Neves",
  "Encaminhamento para a rede de saúde mental",
  "Encaminhamento para o Conselho Tutelar",
  "Encaminhamento para outros projetos / iniciativas sociais",
  "Agendamento de identidade realizado pela equipe para o usuário",
  "Emissão de Carteira Digital de Trabalho",
  "Solicitação do benefício BPC/LOAS",
  "Encaminhamento para serviços de orientação jurídica",
];

const EMPTY_FORM = {
  responsavel: "", dataAtendimento: "", tipoAtendimento: "",
  encaminhamentoOrigem: [] as string[], encaminhamentoOrigemOutro: "",
  nomeAtendido: "", cpfAtendido: "", sexo: "", idade: "",
  bairro: "", bairroOutro: "", cep: "", endereco: "", numero: "", cidade: "", estado: "",
  demanda: "", encaminhamentosRealizados: [] as string[], registroProfissional: "",
};

function maskCpf(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2");
}

export default function DemandaEspontaneaSection({ userId, userRole }: Props) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [loadingCep, setLoadingCep] = useState(false);
  const [nameSearch, setNameSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [listSearch, setListSearch] = useState("");
  const suggestRef = useRef<HTMLDivElement>(null);

  const { data: demandas = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/demandas-espontaneas"],
    queryFn: async () => {
      const res = await authFetch("/api/demandas-espontaneas");
      if (!res.ok) throw new Error("Erro ao carregar");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("/api/demandas-espontaneas", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/demandas-espontaneas"] });
      setForm({ ...EMPTY_FORM });
      setNameSearch("");
      setShowForm(false);
      toast({ title: "Demanda registrada com sucesso!" });
    },
    onError: (e: any) => toast({ title: "Erro ao registrar", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/demandas-espontaneas/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/demandas-espontaneas"] });
      toast({ title: "Registro excluído" });
    },
    onError: (e: any) => toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" }),
  });

  const set = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const toggleMulti = (field: "encaminhamentoOrigem" | "encaminhamentosRealizados", value: string) => {
    const current: string[] = form[field];
    if (field === "encaminhamentosRealizados" && !current.includes(value) && current.length >= 3) {
      toast({ title: "Máximo 3 encaminhamentos", variant: "destructive" });
      return;
    }
    set(field, current.includes(value) ? current.filter((v) => v !== value) : [...current, value]);
  };

  const fetchCep = async (cep: string) => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        if (data.logradouro) set("endereco", data.logradouro);
        if (data.localidade) set("cidade", data.localidade);
        if (data.uf) set("estado", data.uf);
        const found = BAIRROS.find((b) => (data.bairro || "").toLowerCase().includes(b.toLowerCase().replace(" / ", " ").replace("-", "")));
        if (found) set("bairro", found);
      }
    } catch {}
    setLoadingCep(false);
  };

  const handleSubmit = () => {
    if (!form.responsavel || !form.dataAtendimento || !form.tipoAtendimento ||
        !form.nomeAtendido || !form.sexo || !form.idade || !form.bairro ||
        !form.demanda || !form.registroProfissional) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    if (form.bairro === "Outro" && !form.bairroOutro) {
      toast({ title: "Informe o bairro", variant: "destructive" });
      return;
    }
    createMutation.mutate({ ...form, idade: parseInt(form.idade), criadoPorUserId: userId, criadoPorRole: userRole });
  };

  const fmt = (d: string) => d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "";

  // Agrupar por nome_atendido
  const grouped: Record<string, any[]> = {};
  for (const d of demandas) {
    const key = d.nome_atendido || "Sem nome";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(d);
  }

  // Filtrar por busca (nome ou CPF)
  const lSearch = listSearch.toLowerCase().replace(/\D/g, "") || listSearch.toLowerCase();
  const filteredPeople = Object.keys(grouped).filter((name) => {
    if (!listSearch) return true;
    const nameMatch = name.toLowerCase().includes(listSearch.toLowerCase());
    const cpfMatch = grouped[name].some((d: any) => d.cpf_atendido && d.cpf_atendido.replace(/\D/g, "").includes(lSearch));
    return nameMatch || cpfMatch;
  }).sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));

  // Autocomplete: nomes únicos
  const uniqueNames = Array.from(new Set(demandas.map((d: any) => d.nome_atendido).filter(Boolean)));
  const filteredSuggestions = nameSearch.length >= 2
    ? uniqueNames.filter((n) => n.toLowerCase().includes(nameSearch.toLowerCase()))
    : [];

  const selectExistingPerson = (name: string) => {
    const latest = grouped[name]?.[0];
    if (latest) {
      setForm((f) => ({
        ...f,
        nomeAtendido: name,
        cpfAtendido: latest.cpf_atendido || f.cpfAtendido,
        sexo: latest.sexo || f.sexo,
        idade: latest.idade ? String(latest.idade) : f.idade,
        bairro: latest.bairro || f.bairro,
        bairroOutro: latest.bairro_outro || f.bairroOutro,
        cep: latest.cep || f.cep,
        endereco: latest.endereco || f.endereco,
        numero: latest.numero || f.numero,
        cidade: latest.cidade || f.cidade,
        estado: latest.estado || f.estado,
      }));
    }
    setNameSearch(name);
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Atendidos Comunidade</h2>
        <Button onClick={() => { setShowForm(!showForm); setForm({ ...EMPTY_FORM }); setNameSearch(""); }} size="sm"
          className={showForm ? "bg-gray-500 hover:bg-gray-600" : ""}>
          {showForm ? <><X className="w-4 h-4 mr-1" />Cancelar</> : <><Plus className="w-4 h-4 mr-1" />Nova Demanda</>}
        </Button>
      </div>

      {/* Formulário Nova Demanda */}
      {showForm && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-blue-700">Novo Atendimento Comunidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Autocomplete pessoa */}
            <div className="bg-white border border-blue-200 rounded-lg p-4">
              <Label className="text-sm font-semibold text-blue-700 mb-2 block">
                Pessoa atendida — selecione uma existente ou digite um novo nome
              </Label>
              <div className="relative" ref={suggestRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input className="pl-9" placeholder="Buscar pelo nome ou digitar novo..."
                    value={nameSearch}
                    onChange={(e) => { setNameSearch(e.target.value); set("nomeAtendido", e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)} />
                </div>
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredSuggestions.map((name) => (
                      <button key={name} type="button" onClick={() => selectExistingPerson(name)}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm flex items-center gap-2 border-b last:border-0">
                        <User className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <span>{name}</span>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {grouped[name]?.length || 0} demanda{(grouped[name]?.length || 0) !== 1 ? "s" : ""}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {form.nomeAtendido && grouped[form.nomeAtendido] && (
                <p className="text-xs text-blue-600 mt-2">✓ Pessoa com {grouped[form.nomeAtendido].length} demanda(s) anterior(es) — dados pré-preenchidos</p>
              )}
            </div>

            {/* 1. Identificação do Atendimento */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 border-b pb-1">1. Identificação do Atendimento</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm">Responsável pelo acolhimento <span className="text-red-500">*</span></Label>
                  <Select value={form.responsavel} onValueChange={(v) => set("responsavel", v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{RESPONSAVEIS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Data do atendimento <span className="text-red-500">*</span></Label>
                  <Input type="date" className="mt-1" value={form.dataAtendimento} onChange={(e) => set("dataAtendimento", e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm">Tipo de atendimento <span className="text-red-500">*</span></Label>
                  <Select value={form.tipoAtendimento} onValueChange={(v) => set("tipoAtendimento", v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{TIPOS_ATENDIMENTO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 2. Origem do Atendimento */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 border-b pb-1">2. Origem do Atendimento</h3>
              <Label className="text-sm">O usuário apresenta encaminhamento de equipamento público? Se sim, qual? (selecione quantos quiser)</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {ORIGENS_ENCAMINHAMENTO.map((o) => (
                  <button key={o} type="button" onClick={() => toggleMulti("encaminhamentoOrigem", o)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${form.encaminhamentoOrigem.includes(o) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"}`}>
                    {o}
                  </button>
                ))}
              </div>
              {form.encaminhamentoOrigem.includes("Outros projetos sociais") && (
                <Input className="mt-2" placeholder="Qual projeto social?" value={form.encaminhamentoOrigemOutro} onChange={(e) => set("encaminhamentoOrigemOutro", e.target.value)} />
              )}
            </div>

            {/* 3. Dados do Usuário Atendido */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 border-b pb-1">3. Dados do Usuário Atendido</h3>
              <div className="space-y-3">
                {/* Linha 1: Nome | CPF */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Nome completo <span className="text-red-500">*</span></Label>
                    <Input className="mt-1" placeholder="Nome do atendido" value={form.nomeAtendido}
                      onChange={(e) => { set("nomeAtendido", e.target.value); setNameSearch(e.target.value); }} />
                  </div>
                  <div>
                    <Label className="text-sm">CPF</Label>
                    <Input className="mt-1" placeholder="000.000.000-00" value={form.cpfAtendido}
                      onChange={(e) => set("cpfAtendido", maskCpf(e.target.value))} maxLength={14} />
                  </div>
                </div>
                {/* Linha 2: Sexo | Idade */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <Label className="text-sm">Sexo <span className="text-red-500">*</span></Label>
                    <Select value={form.sexo} onValueChange={(v) => set("sexo", v)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Feminino">Feminino</SelectItem>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                        <SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Idade <span className="text-red-500">*</span></Label>
                    <Input type="number" className="mt-1" placeholder="Ex: 25" value={form.idade} onChange={(e) => set("idade", e.target.value)} />
                  </div>
                </div>
                {/* Linha 3: Bairro | CEP | Número */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <Label className="text-sm">Bairro de residência <span className="text-red-500">*</span></Label>
                    <Select value={form.bairro} onValueChange={(v) => set("bairro", v)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>{BAIRROS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                    </Select>
                    {form.bairro === "Outro" && (
                      <Input className="mt-2" placeholder="Qual bairro?" value={form.bairroOutro} onChange={(e) => set("bairroOutro", e.target.value)} />
                    )}
                  </div>
                  <div>
                    <Label className="text-sm">CEP</Label>
                    <div className="flex gap-1 mt-1">
                      <Input placeholder="00000-000" value={form.cep} maxLength={9}
                        onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 8); set("cep", v.length > 5 ? v.slice(0, 5) + "-" + v.slice(5) : v); }}
                        onBlur={() => fetchCep(form.cep)} />
                      {loadingCep && <Loader2 className="w-4 h-4 animate-spin mt-2 text-gray-400" />}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">Número</Label>
                    <Input className="mt-1" placeholder="Ex: 123" value={form.numero} onChange={(e) => set("numero", e.target.value)} />
                  </div>
                </div>
                {/* Linha 4: Rua */}
                <div>
                  <Label className="text-sm">Rua / Avenida / Beco / Acesso</Label>
                  <Input className="mt-1" placeholder="Ex: Rua das Flores" value={form.endereco} onChange={(e) => set("endereco", e.target.value)} />
                </div>
                {/* Linha 5: Cidade | Estado */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-3">
                    <Label className="text-sm">Cidade</Label>
                    <Input className="mt-1" placeholder="Ex: Ribeirão das Neves" value={form.cidade} onChange={(e) => set("cidade", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-sm">Estado (UF)</Label>
                    <Input className="mt-1" placeholder="Ex: MG" maxLength={2} value={form.estado} onChange={(e) => set("estado", e.target.value.toUpperCase())} />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Demanda Apresentada */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 border-b pb-1">4. Demanda Apresentada</h3>
              <Label className="text-sm">Qual demanda o usuário apresenta? <span className="text-red-500">*</span></Label>
              <Textarea className="mt-1" rows={3} placeholder="Registre de forma breve e sucinta a situação apresentada."
                value={form.demanda} onChange={(e) => set("demanda", e.target.value)} />
            </div>

            {/* 5. Encaminhamentos Realizados */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 border-b pb-1">5. Encaminhamentos Realizados</h3>
              <Label className="text-sm">Selecione no máximo 3 opções ({form.encaminhamentosRealizados.length}/3 selecionadas)</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {ENCAMINHAMENTOS.map((e) => (
                  <button key={e} type="button" onClick={() => toggleMulti("encaminhamentosRealizados", e)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${form.encaminhamentosRealizados.includes(e) ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600 border-gray-300 hover:border-green-400"}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Registro Profissional */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 border-b pb-1">6. Registro Profissional</h3>
              <Label className="text-sm">Registro profissional do atendimento <span className="text-red-500">*</span></Label>
              <Textarea className="mt-1" rows={4} placeholder="Descreva o atendimento realizado e as orientações dadas ao usuário."
                value={form.registroProfissional} onChange={(e) => set("registroProfissional", e.target.value)} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Registro
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setForm({ ...EMPTY_FORM }); setNameSearch(""); }}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Demandas Realizadas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-700">
            Demandas Realizadas
            {demandas.length > 0 && <span className="ml-2 text-sm font-normal text-gray-400">({demandas.length} registro{demandas.length !== 1 ? "s" : ""})</span>}
          </h3>
          {/* Busca por nome ou CPF */}
          {demandas.length > 0 && (
            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input className="pl-9 h-9 text-sm" placeholder="Buscar por nome ou CPF..."
                value={listSearch} onChange={(e) => setListSearch(e.target.value)} />
              {listSearch && (
                <button className="absolute right-2 top-2" onClick={() => setListSearch("")}>
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : filteredPeople.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-gray-500">
              {listSearch ? "Nenhum resultado encontrado para a busca." : "Nenhum atendimento de comunidade registrado ainda."}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredPeople.map((person) => {
              const records = grouped[person];
              const isExpanded = expandedPerson === person;
              const latest = records[0];
              return (
                <Card key={person} className={`border-gray-200 transition-colors ${isExpanded ? "border-blue-300 bg-blue-50/20" : ""}`}>
                  <CardContent className="p-0">
                    <button className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => setExpandedPerson(isExpanded ? null : person)}>
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-800 text-sm">{person}</span>
                          {latest?.cpf_atendido && <span className="text-xs text-gray-400 font-mono">{latest.cpf_atendido}</span>}
                          <Badge variant="secondary" className="text-xs">{records.length} demanda{records.length !== 1 ? "s" : ""}</Badge>
                          {latest?.sexo && <span className="text-xs text-gray-500">{latest.sexo}</span>}
                          {latest?.idade && <span className="text-xs text-gray-500">{latest.idade} anos</span>}
                          {latest?.bairro && <span className="text-xs text-gray-500">{latest.bairro === "Outro" ? latest.bairro_outro : latest.bairro}</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">Último atendimento: {fmt(latest?.data_atendimento)} · {latest?.tipo_atendimento}</p>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-blue-100 px-4 pb-3 space-y-2 pt-3">
                        {records.map((d: any) => (
                          <div key={d.id} className="bg-white border border-gray-100 rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">{d.tipo_atendimento}</Badge>
                                  <Badge variant="secondary" className="text-xs">{d.responsavel}</Badge>
                                  <span className="text-xs text-gray-500">{fmt(d.data_atendimento)}</span>
                                </div>
                                <p className="text-sm text-gray-600">{d.demanda}</p>
                                {d.encaminhamentos_realizados?.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {d.encaminhamentos_realizados.map((e: string) => (
                                      <Badge key={e} className="text-xs bg-green-100 text-green-700 border-green-200">{e}</Badge>
                                    ))}
                                  </div>
                                )}
                                {d.registro_profissional && (
                                  <p className="text-xs text-gray-500 mt-2 italic line-clamp-2">{d.registro_profissional}</p>
                                )}
                              </div>
                              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                                onClick={() => { if (confirm("Excluir este registro?")) deleteMutation.mutate(d.id); }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
