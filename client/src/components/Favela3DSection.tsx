import { useState, useEffect, useRef, type ReactNode } from "react";
import { ComprehensiveStudentForm } from "@/components/comprehensive-student-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Home, Plus, Trash2, Search, Loader2, User, FileText,
  Users, X, ChevronDown, ChevronUp, Edit2, Eye, ChevronRight, Layers,
  Camera, ArrowLeft, CalendarDays, UserCheck, Group, AlertTriangle
} from "lucide-react";

function getAuthUserId(): string {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("userId") ||
    sessionStorage.getItem("userId") ||
    localStorage.getItem("monitorId") ||
    ""
  );
}

/** @deprecated SEC-011 — use authFetch; sessão via cookie */
function buildFavelaHeaders(_explicitUserId?: string | number): Record<string, string> {
  return {};
}

interface Props {
  userId: string | number;
  userRole: string;
  initialTab?: "atendidos" | "registros";
}

type Relacionamento = {
  id: number;
  nome: string;
  parentesco?: string | null;
  relacao?: string | null;
  renda?: string | null;
  tipo?: string | null;
};

type Participante = {
  id: number;
  nome: string;
  cpf?: string | null;
  dataNascimento?: string | null;
  genero?: string | null;
  raca?: string | null;
  telefone?: string | null;
  email?: string | null;
  cep?: string | null;
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  igf?: string | null;
  temCadUnico?: any;
  temBolsaFamilia?: any;
  temBpc?: any;
  temCarteiraIdoso?: any;
  situacaoProfissional?: string | null;
  rendaTipo?: string | null;
  numeroPessoas?: number | null;
  criancas?: number | null;
  adolescentes?: number | null;
  adultos?: number | null;
  idosos?: number | null;
  demandas?: string | null;
  observacoes?: string | null;
  fotoUrl?: string | null;
  status?: string | null;
  relacionamentos?: Relacionamento[];
  escolaridade?: string | null;
  serie?: string | null;
  situacaoEscolar?: string | null;
  turnoEscolar?: string | null;
  instituicaoEnsino?: string | null;
  eAlfabetizado?: string | null;
  bairroEscola?: string | null;
};

type Registro = {
  id: number;
  participanteNome?: string | null;
  participanteCpf?: string | null;
  participanteId?: number | null;
  tipo: string;
  titulo?: string | null;
  conteudo: string;
  data: string;
  status?: string | null;
  createdAt?: string;
  categoria?: string | null;
  participantesIds?: number[] | null;
  participantesNomes?: string[];
};

const IGF_OPTIONS = [
  { value: "E1", label: "E1 — Extrema vulnerabilidade" },
  { value: "E2", label: "E2 — Alta vulnerabilidade" },
  { value: "P1", label: "P1 — Vulnerabilidade moderada" },
  { value: "P2", label: "P2 — Baixa vulnerabilidade" },
  { value: "D",  label: "D — Dignidade" },
];

const TIPOS_REGISTRO = [
  { value: "visita_domiciliar",      label: "Visita Domiciliar" },
  { value: "atendimento_individual", label: "Atendimento Individual" },
  { value: "atendimento_coletivo",   label: "Atendimento Coletivo" },
  { value: "encaminhamento",         label: "Encaminhamento" },
  { value: "mapeamento",             label: "Mapeamento" },
];

const GENEROS = ["Masculino", "Feminino", "Não-binário", "Prefiro não informar"];
const RACAS   = ["Branca", "Preta", "Parda", "Amarela", "Indígena", "Não informado"];
const SIM_NAO = ["Sim", "Não", "Não informado"];

const igfColor: Record<string, string> = {
  E1: "bg-red-100 text-red-700 border-red-200",
  E2: "bg-orange-100 text-orange-700 border-orange-200",
  P1: "bg-yellow-100 text-yellow-700 border-yellow-200",
  P2: "bg-blue-100 text-blue-700 border-blue-200",
  D:  "bg-green-100 text-green-700 border-green-200",
};

const tipoLabel: Record<string, string> = {
  visita_domiciliar:      "Visita Domiciliar",
  atendimento_individual: "Atend. Individual",
  atendimento_coletivo:   "Atend. Coletivo",
  encaminhamento:         "Encaminhamento",
  mapeamento:             "Mapeamento",
};

const tipoColor: Record<string, string> = {
  visita_domiciliar:      "bg-purple-100 text-purple-700",
  atendimento_individual: "bg-blue-100 text-blue-700",
  atendimento_coletivo:   "bg-indigo-100 text-indigo-700",
  encaminhamento:         "bg-orange-100 text-orange-700",
  mapeamento:             "bg-gray-100 text-gray-700",
};

const EMPTY_PARTICIPANTE = {
  nome: "", cpf: "", dataNascimento: "", genero: "", raca: "", telefone: "", email: "",
  cep: "", endereco: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "",
  igf: "", temCadUnico: "", temBolsaFamilia: "", temBpc: "",
  numeroPessoas: "", criancas: "", adolescentes: "", adultos: "", idosos: "",
  demandas: "", observacoes: "",
};

const CATEGORIAS_COLETIVO = [
  { value: "gerando_lideranca", label: "Gerando Liderança" },
  { value: "assembleia",        label: "Assembleia" },
  { value: "grupo_mulheres",    label: "Grupo de Mulheres" },
  { value: "triangulo",         label: "Triângulo" },
];

const EMPTY_REGISTRO = {
  participanteId: "" as string | number,
  participanteNome: "",
  participanteCpf: "",
  tipo: "",
  titulo: "",
  conteudo: "",
  data: new Date().toISOString().split("T")[0],
  categoria: "",
  participantesIds: [] as number[],
};

// ---- Helper: Field row ----
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

// ---- Cadastro Modal ----
function CadastroModal({
  open, onClose, onSubmit, isPending
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: typeof EMPTY_PARTICIPANTE) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState({ ...EMPTY_PARTICIPANTE });

  useEffect(() => {
    if (open) setForm({ ...EMPTY_PARTICIPANTE });
  }, [open]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="w-5 h-5 text-purple-600" />
            Cadastrar Família — Favela 3D
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Seção 1: Identificação */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 border-b pb-1">Identificação</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nome completo *">
                <Input value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Nome completo" />
              </Field>
              <Field label="CPF">
                <Input value={form.cpf} onChange={e => set("cpf", e.target.value)} placeholder="000.000.000-00" />
                <button type="button" className="text-xs text-purple-600 underline mt-1 block"
                  onClick={async () => { try { set("cpf", await gerarCpfProvisorio()); } catch {} }}>
                  Não tem CPF? Gerar provisório
                </button>
              </Field>
              <Field label="Data de Nascimento">
                <Input type="date" value={form.dataNascimento} onChange={e => set("dataNascimento", e.target.value)} />
              </Field>
              <Field label="Gênero">
                <Select value={form.genero} onValueChange={v => set("genero", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{GENEROS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Raça/Cor">
                <Select value={form.raca} onValueChange={v => set("raca", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{RACAS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Telefone">
                <Input value={form.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(00) 00000-0000" />
              </Field>
              <Field label="E-mail">
                <Input value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@exemplo.com" />
              </Field>
            </div>
          </div>

          {/* Seção 2: Endereço */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 border-b pb-1">Endereço</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="CEP">
                <Input value={form.cep} onChange={e => set("cep", e.target.value)} placeholder="00000-000" />
              </Field>
              <Field label="Logradouro">
                <Input value={form.endereco} onChange={e => set("endereco", e.target.value)} placeholder="Rua, Avenida..." />
              </Field>
              <Field label="Número">
                <Input value={form.numero} onChange={e => set("numero", e.target.value)} placeholder="Nº" />
              </Field>
              <Field label="Complemento">
                <Input value={form.complemento} onChange={e => set("complemento", e.target.value)} placeholder="Apto, Bloco..." />
              </Field>
              <Field label="Bairro">
                <Input value={form.bairro} onChange={e => set("bairro", e.target.value)} placeholder="Bairro" />
              </Field>
              <Field label="Cidade">
                <Input value={form.cidade} onChange={e => set("cidade", e.target.value)} placeholder="Cidade" />
              </Field>
              <Field label="Estado">
                <Input value={form.estado} onChange={e => set("estado", e.target.value)} placeholder="UF" maxLength={2} />
              </Field>
            </div>
          </div>

          {/* Seção 3: IGF */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 border-b pb-1">IGF — Índice Gerando Falcões (Opcional)</h3>
            <Field label="Classificação IGF (Opcional)">
              <Select value={form.igf} onValueChange={v => set("igf", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione o IGF..." /></SelectTrigger>
                <SelectContent>
                  {IGF_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Seção 4: Composição Familiar */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 border-b pb-1">Composição Familiar</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="Total de pessoas">
                <Input type="number" min={0} value={form.numeroPessoas} onChange={e => set("numeroPessoas", e.target.value)} placeholder="0" />
              </Field>
              <Field label="Crianças">
                <Input type="number" min={0} value={form.criancas} onChange={e => set("criancas", e.target.value)} placeholder="0" />
              </Field>
              <Field label="Adolescentes">
                <Input type="number" min={0} value={form.adolescentes} onChange={e => set("adolescentes", e.target.value)} placeholder="0" />
              </Field>
              <Field label="Adultos">
                <Input type="number" min={0} value={form.adultos} onChange={e => set("adultos", e.target.value)} placeholder="0" />
              </Field>
              <Field label="Idosos">
                <Input type="number" min={0} value={form.idosos} onChange={e => set("idosos", e.target.value)} placeholder="0" />
              </Field>
            </div>
          </div>

          {/* Seção 5: Benefícios Sociais */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 border-b pb-1">Benefícios Sociais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="CadÚnico">
                <Select value={form.temCadUnico} onValueChange={v => set("temCadUnico", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{SIM_NAO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Bolsa Família">
                <Select value={form.temBolsaFamilia} onValueChange={v => set("temBolsaFamilia", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{SIM_NAO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="BPC">
                <Select value={form.temBpc} onValueChange={v => set("temBpc", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{SIM_NAO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
          </div>

          {/* Seção 6: Demandas e Observações */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 border-b pb-1">Demandas e Observações</h3>
            <Field label="Demandas">
              <Textarea value={form.demandas} onChange={e => set("demandas", e.target.value)} placeholder="Principais demandas identificadas..." rows={3} />
            </Field>
            <Field label="Observações">
              <Textarea value={form.observacoes} onChange={e => set("observacoes", e.target.value)} placeholder="Observações gerais..." rows={3} />
            </Field>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button
            onClick={() => onSubmit(form)}
            disabled={isPending || !form.nome.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Cadastrar Família
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---- Edit Modal ----
function EditModal({
  participante, onClose, onSubmit, isPending
}: {
  participante: Participante;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<any>({
    ...participante,
    dataNascimento: participante.dataNascimento ? String(participante.dataNascimento).slice(0, 10) : "",
  });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-blue-600" />
            Editar Família — {participante.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {isCpfProvisorio(participante.cpf) && <CpfProvisorioAlerta />}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 border-b pb-1">Identificação</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nome completo *">
                <Input value={form.nome || ""} onChange={e => set("nome", e.target.value)} />
              </Field>
              <Field label="CPF">
                <Input value={form.cpf || ""} onChange={e => set("cpf", e.target.value)} placeholder="000.000.000-00" />
                <button type="button" className="text-xs text-purple-600 underline mt-1 block"
                  onClick={async () => { try { set("cpf", await gerarCpfProvisorio()); } catch {} }}>
                  Não tem CPF? Gerar provisório
                </button>
              </Field>
              <Field label="Data de Nascimento">
                <Input type="date" value={form.dataNascimento || ""} onChange={e => set("dataNascimento", e.target.value)} />
              </Field>
              <Field label="Gênero">
                <Select value={form.genero || ""} onValueChange={v => set("genero", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{GENEROS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Raça/Cor">
                <Select value={form.raca || ""} onValueChange={v => set("raca", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{RACAS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Telefone">
                <Input value={form.telefone || ""} onChange={e => set("telefone", e.target.value)} />
              </Field>
              <Field label="E-mail">
                <Input value={form.email || ""} onChange={e => set("email", e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 border-b pb-1">Endereço</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="CEP"><Input value={form.cep || ""} onChange={e => set("cep", e.target.value)} /></Field>
              <Field label="Logradouro"><Input value={form.endereco || ""} onChange={e => set("endereco", e.target.value)} /></Field>
              <Field label="Número"><Input value={form.numero || ""} onChange={e => set("numero", e.target.value)} /></Field>
              <Field label="Complemento"><Input value={form.complemento || ""} onChange={e => set("complemento", e.target.value)} /></Field>
              <Field label="Bairro"><Input value={form.bairro || ""} onChange={e => set("bairro", e.target.value)} /></Field>
              <Field label="Cidade"><Input value={form.cidade || ""} onChange={e => set("cidade", e.target.value)} /></Field>
              <Field label="Estado"><Input value={form.estado || ""} onChange={e => set("estado", e.target.value)} maxLength={2} /></Field>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 border-b pb-1">IGF — Índice Gerando Falcões (Opcional)</h3>
            <Field label="Classificação IGF (Opcional)">
              <Select value={form.igf || ""} onValueChange={v => set("igf", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione o IGF..." /></SelectTrigger>
                <SelectContent>
                  {IGF_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 border-b pb-1">Composição Familiar</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="Total"><Input type="number" min={0} value={form.numeroPessoas ?? ""} onChange={e => set("numeroPessoas", e.target.value)} /></Field>
              <Field label="Crianças"><Input type="number" min={0} value={form.criancas ?? ""} onChange={e => set("criancas", e.target.value)} /></Field>
              <Field label="Adolescentes"><Input type="number" min={0} value={form.adolescentes ?? ""} onChange={e => set("adolescentes", e.target.value)} /></Field>
              <Field label="Adultos"><Input type="number" min={0} value={form.adultos ?? ""} onChange={e => set("adultos", e.target.value)} /></Field>
              <Field label="Idosos"><Input type="number" min={0} value={form.idosos ?? ""} onChange={e => set("idosos", e.target.value)} /></Field>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 border-b pb-1">Benefícios Sociais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="CadÚnico">
                <Select value={form.temCadUnico || ""} onValueChange={v => set("temCadUnico", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{SIM_NAO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Bolsa Família">
                <Select value={form.temBolsaFamilia || ""} onValueChange={v => set("temBolsaFamilia", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{SIM_NAO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="BPC">
                <Select value={form.temBpc || ""} onValueChange={v => set("temBpc", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{SIM_NAO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 border-b pb-1">Demandas e Observações</h3>
            <Field label="Demandas">
              <Textarea value={form.demandas || ""} onChange={e => set("demandas", e.target.value)} rows={3} />
            </Field>
            <Field label="Observações">
              <Textarea value={form.observacoes || ""} onChange={e => set("observacoes", e.target.value)} rows={3} />
            </Field>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button
            onClick={() => onSubmit(form)}
            disabled={isPending || !form.nome?.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---- View Modal ----
const IGF_LABELS: Record<string, string> = {
  E1: "E1 — Extrema vulnerabilidade",
  E2: "E2 — Alta vulnerabilidade",
  P1: "P1 — Vulnerabilidade moderada",
  P2: "P2 — Baixa vulnerabilidade",
  D:  "D — Dignidade",
};

function ViewModal({ participante, onClose }: { participante: Participante; onClose: () => void }) {
  const [fullData, setFullData] = useState<Participante | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/favela3d/participantes/${participante.id}`, { credentials: "include", headers: buildFavelaHeaders() })
      .then(r => r.json())
      .then(d => { setFullData(d); setLoading(false); })
      .catch(() => { setFullData(participante); setLoading(false); });
  }, [participante.id]);

  const d = fullData || participante;

  const fmtBool = (v: any): string => {
    if (v === true || v === "true") return "Sim";
    if (v === false || v === "false") return "Não";
    if (typeof v === "string" && v.toLowerCase() === "sim") return "Sim";
    if (typeof v === "string" && (v.toLowerCase() === "nao" || v.toLowerCase() === "não")) return "Não";
    return v != null ? String(v) : "—";
  };

  const fmtDate = (v: any): string => {
    if (!v) return "—";
    const s = String(v).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, day] = s.split("-");
      return `${day}/${m}/${y}`;
    }
    return String(v);
  };

  const val = (v: any) => (v != null && v !== "") ? String(v) : "—";

  const SectionTitle = ({ children }: { children: ReactNode }) => (
    <div className="flex items-center gap-2 mb-3 mt-5">
      <div className="h-px flex-1 bg-gray-200" />
      <span className="text-xs font-semibold uppercase tracking-wider text-purple-700 px-2">{children}</span>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  );

  const Field = ({ label, value, full }: { label: string; value: any; full?: boolean }) => (
    <div className={full ? "col-span-2 sm:col-span-3" : ""}>
      <span className="text-xs text-gray-500 block mb-0.5">{label}</span>
      <span className="text-sm font-medium text-gray-800">{val(value)}</span>
    </div>
  );

  const familiares = (d.relacionamentos || []).filter(r => r.tipo === "familiar" || !r.tipo);
  const outros = (d.relacionamentos || []).filter(r => r.tipo === "outro");

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Home className="w-5 h-5 text-purple-600 flex-shrink-0" />
            {d.nome}
          </DialogTitle>
        </DialogHeader>

        {isCpfProvisorio(d.cpf) && <CpfProvisorioAlerta />}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
            <span className="ml-2 text-gray-500">Carregando dados...</span>
          </div>
        ) : (
          <div className="text-sm pb-2">

            {/* ── Seção 1: Identificação ── */}
            <SectionTitle>1. Identificação</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
              <Field label="Nome completo" value={d.nome} full />
              <Field label="CPF" value={d.cpf} />
              <Field label="Data de nascimento" value={fmtDate(d.dataNascimento)} />
              <Field label="Gênero" value={d.genero} />
              <Field label="Raça/Cor" value={d.raca} />
            </div>

            {/* ── Seção 2: Contato ── */}
            <SectionTitle>2. Contato</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
              <Field label="Telefone" value={d.telefone} />
              <Field label="E-mail" value={d.email} />
            </div>

            {/* ── Seção 3: Endereço ── */}
            <SectionTitle>3. Endereço</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
              <Field label="CEP" value={d.cep} />
              <Field label="Logradouro" value={d.endereco} />
              <Field label="Número" value={d.numero} />
              <Field label="Complemento" value={d.complemento} />
              <Field label="Bairro" value={d.bairro} />
              <Field label="Cidade" value={d.cidade} />
              <Field label="Estado" value={d.estado} />
            </div>

            {/* ── Seção 4: Classificação IGF ── */}
            <SectionTitle>4. Classificação IGF</SectionTitle>
            <div className="flex items-center gap-3">
              {d.igf ? (
                <>
                  <span className={`text-sm px-3 py-1 rounded-full border font-bold ${igfColor[d.igf] || "bg-gray-100 text-gray-700"}`}>
                    {d.igf}
                  </span>
                  <span className="text-sm text-gray-700">{IGF_LABELS[d.igf] || d.igf}</span>
                </>
              ) : (
                <span className="text-gray-400 text-sm">Não informado</span>
              )}
            </div>

            {/* ── Seção 5: Composição Familiar ── */}
            <SectionTitle>5. Composição Familiar</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
              <Field label="Total de pessoas" value={d.numeroPessoas} />
              <Field label="Crianças (0–11)" value={d.criancas} />
              <Field label="Adolescentes (12–17)" value={d.adolescentes} />
              <Field label="Adultos (18–59)" value={d.adultos} />
              <Field label="Idosos (60+)" value={d.idosos} />
            </div>

            {/* ── Seção 6: Benefícios Sociais ── */}
            <SectionTitle>6. Benefícios Sociais</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
              <Field label="CadÚnico" value={fmtBool(d.temCadUnico)} />
              <Field label="Bolsa Família" value={fmtBool(d.temBolsaFamilia)} />
              <Field label="BPC" value={fmtBool(d.temBpc)} />
              <Field label="Carteira de Idoso" value={fmtBool(d.temCarteiraIdoso)} />
            </div>

            {/* ── Seção 7: Situação Socioeconômica ── */}
            <SectionTitle>7. Situação Socioeconômica</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
              <Field label="Situação profissional" value={d.situacaoProfissional} />
              <Field label="Tipo de renda" value={d.rendaTipo} />
            </div>

            {/* ── Seção 8: Dados Escolares ── */}
            <SectionTitle>8. Dados Escolares</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
              <Field label="Escolaridade" value={
                d.escolaridade === 'nao_escolarizado' ? 'Não escolarizado' :
                d.escolaridade === 'fundamental_incompleto' ? 'Fundamental Incompleto' :
                d.escolaridade === 'eja_fundamental' ? 'EJA — Fundamental' :
                d.escolaridade === 'fundamental_completo' ? 'Fundamental Completo' :
                d.escolaridade === 'medio_incompleto' ? 'Médio Incompleto' :
                d.escolaridade === 'eja_medio' ? 'EJA — Médio' :
                d.escolaridade === 'medio_completo' ? 'Médio Completo' :
                d.escolaridade === 'superior_incompleto' ? 'Superior Incompleto' :
                d.escolaridade === 'superior_completo' ? 'Superior Completo' :
                d.escolaridade === 'pos_graduacao' ? 'Pós-Graduação' :
                d.escolaridade || null
              } />
              <Field label="Série / Ano" value={d.serie} />
              <Field label="Situação escolar" value={
                d.situacaoEscolar === 'cursando' ? 'Cursando' :
                d.situacaoEscolar === 'interrompido' ? 'Interrompido' :
                d.situacaoEscolar === 'concluido' ? 'Concluído' :
                d.situacaoEscolar || null
              } />
              <Field label="Turno" value={d.turnoEscolar ? d.turnoEscolar.split(',').map(t => t.trim()).join(', ') : null} />
              <Field label="Instituição de ensino" value={d.instituicaoEnsino} />
              <Field label="Bairro da escola" value={d.bairroEscola} />
              <Field label="Alfabetização" value={
                d.eAlfabetizado === 'sabe_ler_escrever' ? 'Sabe ler e escrever' :
                d.eAlfabetizado === 'nao_sabe_ler_nem_escrever' ? 'Não sabe ler nem escrever' :
                d.eAlfabetizado === 'nao_sabe_ler_nem_escrever_mas_assina' ? 'Não sabe ler/escrever, mas assina' :
                d.eAlfabetizado || null
              } />
            </div>

            {/* ── Seção 9: Demandas ── */}
            <SectionTitle>9. Demandas</SectionTitle>
            {d.demandas ? (
              <div className="flex flex-wrap gap-2">
                {String(d.demandas).split(",").map(dem => dem.trim()).filter(Boolean).map((dem, i) => (
                  <span key={i} className="text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-3 py-1">
                    {dem}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 text-sm">Nenhuma demanda registrada</span>
            )}

            {/* ── Seção 9: Observações ── */}
            <SectionTitle>10. Observações</SectionTitle>
            {d.observacoes ? (
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">{d.observacoes}</p>
            ) : (
              <span className="text-gray-400 text-sm">Sem observações</span>
            )}

            {/* ── Seção 10: Relacionamentos Familiares ── */}
            <SectionTitle>11. Relacionamentos Familiares</SectionTitle>
            {familiares.length === 0 ? (
              <span className="text-gray-400 text-sm">Nenhum relacionamento familiar cadastrado</span>
            ) : (
              <div className="space-y-2">
                {familiares.map((r, i) => (
                  <div key={r.id || i} className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5">
                    <div>
                      <span className="text-xs text-gray-500 block">Nome</span>
                      <span className="text-sm font-medium">{r.nome || "—"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Parentesco</span>
                      <span className="text-sm font-medium">{r.parentesco || "—"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Relação</span>
                      <span className="text-sm font-medium">{r.relacao || "—"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Renda</span>
                      <span className="text-sm font-medium">{r.renda || "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Seção 11: Outros Relacionamentos ── */}
            <SectionTitle>12. Outros Relacionamentos</SectionTitle>
            {outros.length === 0 ? (
              <span className="text-gray-400 text-sm">Nenhum outro relacionamento cadastrado</span>
            ) : (
              <div className="space-y-2">
                {outros.map((r, i) => (
                  <div key={r.id || i} className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5">
                    <div>
                      <span className="text-xs text-gray-500 block">Nome</span>
                      <span className="text-sm font-medium">{r.nome || "—"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Parentesco</span>
                      <span className="text-sm font-medium">{r.parentesco || "—"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Relação</span>
                      <span className="text-sm font-medium">{r.relacao || "—"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Renda</span>
                      <span className="text-sm font-medium">{r.renda || "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        <div className="flex justify-end pt-4 border-t mt-2">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Helper: exibe foto de uma reunião via signed URL
function ReuniaoFoto({ reuniaoId }: { reuniaoId: number }) {
  const { data } = useQuery<{ url: string }>({
    queryKey: ["/api/favela3d/reunioes", reuniaoId, "foto-serve"],
    queryFn: async () => {
      const r = await fetch(`/api/favela3d/reunioes/${reuniaoId}/foto-serve`, { credentials: "include", headers: buildFavelaHeaders() });
      if (!r.ok) throw new Error("no foto");
      return r.json();
    },
    retry: false,
    staleTime: 60000,
  });
  if (!data?.url) return null;
  return (
    <img src={data.url} alt="Foto do encontro"
      className="mt-2 rounded-lg max-h-48 object-cover border border-gray-100 w-full" />
  );
}

function isCpfProvisorio(cpf: string | null | undefined): boolean {
  if (!cpf) return false;
  const digits = cpf.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("000000000");
}

async function gerarCpfProvisorio(): Promise<string> {
  const r = await fetch("/api/favela3d/next-cpf-provisorio", { credentials: "include", headers: buildFavelaHeaders() });
  if (!r.ok) throw new Error("Erro ao gerar CPF");
  const { cpf } = await r.json();
  return cpf;
}

function CpfProvisorioAlerta() {
  return (
    <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-start gap-2 mb-2">
      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-amber-800 font-medium leading-tight">
        CPF provisório — atualize o CPF real desta pessoa assim que possível.
      </p>
    </div>
  );
}

function validarCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d){10}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  if (rem !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  return rem === parseInt(digits[10]);
}

export default function Favela3DSection({ userId, userRole, initialTab }: Props) {
  const { toast } = useToast();
  const tabMap = { atendidos: "familias" as const, registros: "registros" as const };
  const [activeTab, setActiveTab] = useState<"familias" | "registros" | "grupos">(
    initialTab ? tabMap[initialTab] : "familias"
  );

  useEffect(() => {
    if (initialTab) setActiveTab(tabMap[initialTab]);
  }, [initialTab]);

  // --- Famílias state ---
  const [buscaFamilia, setBuscaFamilia] = useState("");
  const [filtroProvFamilias, setFiltroProvFamilias] = useState(false);
  const [filtroProvPart, setFiltroProvPart] = useState(false);
  const [showCadastro, setShowCadastro] = useState(false);
  const [editingFamilia, setEditingFamilia] = useState<Participante | null>(null);
  const [viewingFamilia, setViewingFamilia] = useState<Participante | null>(null);
  const [confirmDeleteFamilia, setConfirmDeleteFamilia] = useState<number | null>(null);

  // --- Registros state ---
  const [regSubTab, setRegSubTab] = useState<"realizados" | "novo">("realizados");
  const [buscaRegistro, setBuscaRegistro] = useState("");
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);
  const [formRegistro, setFormRegistro] = useState({ ...EMPTY_REGISTRO });
  const [partBusca, setPartBusca] = useState("");
  const [partOpen, setPartOpen] = useState(false);
  const [editingRegistro, setEditingRegistro] = useState<Registro | null>(null);
  const [confirmDeleteRegistro, setConfirmDeleteRegistro] = useState<number | null>(null);
  const [viewingRegistro, setViewingRegistro] = useState<Registro | null>(null);
  // Multi-select para atendimento coletivo
  const [coletivoPartBusca, setColetivoPartBusca] = useState("");

  const favelaHeaders = buildFavelaHeaders(userId);

  // ---- Queries ----
  const { data: participantes = [], isLoading: loadingP } = useQuery<Participante[]>({
    queryKey: ["/api/favela3d/participantes"],
    queryFn: async () => {
      const res = await fetch("/api/favela3d/participantes", { credentials: "include", headers: favelaHeaders });
      if (!res.ok) throw new Error("Erro ao carregar participantes");
      return res.json();
    },
    staleTime: 30000,
  });

  const { data: registros = [], isLoading: loadingR } = useQuery<Registro[]>({
    queryKey: ["/api/favela3d/registros"],
    queryFn: async () => {
      const res = await fetch("/api/favela3d/registros", { credentials: "include", headers: favelaHeaders });
      if (!res.ok) throw new Error("Erro ao carregar registros");
      return res.json();
    },
    staleTime: 30000,
  });

  // ---- Mutations: Famílias ----
  const criarFamilia = useMutation({
    mutationFn: (data: typeof EMPTY_PARTICIPANTE) =>
      apiRequest("/api/favela3d/participantes", { method: "POST", body: JSON.stringify(data), headers: favelaHeaders }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favela3d/participantes"] });
      setShowCadastro(false);
      toast({ title: "Família cadastrada com sucesso!" });
    },
    onError: () => toast({ title: "Erro ao cadastrar família", variant: "destructive" }),
  });

  const atualizarFamilia = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest(`/api/favela3d/participantes/${id}`, { method: "PUT", body: JSON.stringify(data), headers: favelaHeaders }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favela3d/participantes"] });
      setEditingFamilia(null);
      toast({ title: "Família atualizada!" });
    },
    onError: () => toast({ title: "Erro ao atualizar família", variant: "destructive" }),
  });

  const excluirFamilia = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/favela3d/participantes/${id}`, { method: "DELETE", headers: favelaHeaders }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favela3d/participantes"] });
      setConfirmDeleteFamilia(null);
      toast({ title: "Família removida." });
    },
    onError: () => toast({ title: "Erro ao remover família", variant: "destructive" }),
  });

  // ---- Mutations: Registros ----
  const criarRegistro = useMutation({
    mutationFn: (data: typeof EMPTY_REGISTRO) =>
      apiRequest("/api/favela3d/registros", { method: "POST", body: JSON.stringify(data), headers: favelaHeaders }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favela3d/registros"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favela3d/stats"] });
      setRegSubTab("realizados");
      setFormRegistro({ ...EMPTY_REGISTRO, data: new Date().toISOString().split("T")[0] });
      setPartBusca("");
      setColetivoPartBusca("");
      toast({ title: "Registro salvo com sucesso!" });
    },
    onError: () => toast({ title: "Erro ao salvar registro", variant: "destructive" }),
  });

  const excluirRegistro = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/favela3d/registros/${id}`, { method: "DELETE", headers: favelaHeaders }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favela3d/registros"] });
      setConfirmDeleteRegistro(null);
      toast({ title: "Registro excluído." });
    },
    onError: () => toast({ title: "Erro ao excluir registro", variant: "destructive" }),
  });

  // ---- Stats ----
  const totalFamilias = participantes.length;
  const totalRegistros = registros.length;
  const totalVisitas = registros.filter(r => r.tipo === "visita_domiciliar").length;
  const totalAtendimentos = registros.filter(r => r.tipo === "atendimento_individual" || r.tipo === "atendimento_coletivo").length;

  // ---- Filtering ----
  const totalProvFamilias = participantes.filter(p => isCpfProvisorio(p.cpf)).length;

  const familiasFiltradas = participantes.filter(p => {
    const matchBusca = !buscaFamilia ||
      p.nome.toLowerCase().includes(buscaFamilia.toLowerCase()) ||
      (p.cpf || "").includes(buscaFamilia) ||
      (p.telefone || "").includes(buscaFamilia);
    const matchProv = !filtroProvFamilias || isCpfProvisorio(p.cpf);
    return matchBusca && matchProv;
  }).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  // ---- Grouped registros ----
  // Coletivos ficam em seção separada; individuais/visitas agrupados por participante
  const coletivos = registros.filter(r => r.tipo === "atendimento_coletivo");
  const individuais = registros.filter(r => r.tipo !== "atendimento_coletivo");

  const grouped: Record<string, Registro[]> = {};
  individuais.forEach(r => {
    const nome = (r.participanteNome || "Sem participante").trim();
    if (!grouped[nome]) grouped[nome] = [];
    grouped[nome].push(r);
  });
  const participantNames = Object.keys(grouped).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const filteredNames = buscaRegistro.trim()
    ? participantNames.filter(n => n.toLowerCase().includes(buscaRegistro.toLowerCase()))
    : participantNames;

  const categoriaLabel: Record<string, string> = {
    gerando_lideranca: "Gerando Liderança",
    assembleia: "Assembleia",
    grupo_mulheres: "Grupo de Mulheres",
    triangulo: "Triângulo",
  };
  const coletivosPorCategoria: Record<string, Registro[]> = {};
  coletivos.forEach(r => {
    const cat = (r as any).categoria || "sem_categoria";
    if (!coletivosPorCategoria[cat]) coletivosPorCategoria[cat] = [];
    coletivosPorCategoria[cat].push(r);
  });
  const [expandedColetivo, setExpandedColetivo] = useState<string | null>(null);
  const [expandedColetivoRegistro, setExpandedColetivoRegistro] = useState<number | null>(null);
  const [registrosViewTab, setRegistrosViewTab] = useState<'coletivos' | 'individuais'>('individuais');


  // ── GRUPOS FAVELA 3D ──────────────────────────────────────────────────────
  const [gruposSubTab, setGruposSubTab] = useState<"participantes" | "grupos" | "novo-grupo">("grupos");
  const [grupoSearch, setGrupoSearch] = useState("");
  const [selectedGrupo, setSelectedGrupo] = useState<any | null>(null);

  // Participantes state
  const [partForm, setPartForm] = useState({ nome: "", cpf: "", cep: "", rua: "", numero: "", bairro: "", cidade: "", estado: "", idade: "", genero: "" });
  const [editPart, setEditPart] = useState<any | null>(null);
  const editFormRef = useRef<HTMLDivElement>(null);
  const [viewPart, setViewPart] = useState<any | null>(null);
  const [viewReuniao, setViewReuniao] = useState<any | null>(null);
  const [partSearch, setPartSearch] = useState("");
  const [partSearchReuniao, setPartSearchReuniao] = useState("");
  const [showPartDropdown, setShowPartDropdown] = useState(false);

  // Grupos state
  const [grupoForm, setGrupoForm] = useState({ nome: "", descricao: "", member_ids: [] as number[] });
  const [grupoMembroSearch, setGrupoMembroSearch] = useState("");
  const [showMembroDropdown, setShowMembroDropdown] = useState(false);
  const [editGrupo, setEditGrupo] = useState<any | null>(null);
  const [viewGrupo, setViewGrupo] = useState<any | null>(null);
  const [viewGrupoMembros, setViewGrupoMembros] = useState<any[]>([]);
  const [reuniaoSearch, setReuniaoSearch] = useState("");

  // Reuniões state
  const [showReuniaoForm, setShowReuniaoForm] = useState(false);
  const [editReuniao, setEditReuniao] = useState<any | null>(null);
  const [reuniaoForm, setReuniaoForm] = useState({ data: "", descricao: "", titulo: "", participante_ids: [] as number[] });
  const [reuniaoFotoFile, setReuniaoFotoFile] = useState<File | null>(null);

  // Queries
  const { data: grupoParticipantes = [], refetch: refetchGrupoParticipantes } = useQuery<any[]>({
    queryKey: ["/api/favela3d/grupo-participantes"],
    staleTime: 60000,
  });
  const { data: grupoMembros = [], refetch: refetchGrupoMembros } = useQuery<any[]>({
    queryKey: ["/api/favela3d/grupos", selectedGrupo?.id, "membros"],
    queryFn: async () => {
      if (!selectedGrupo) return [];
      const r = await fetch(`/api/favela3d/grupos/${selectedGrupo.id}/membros`, { credentials: "include", headers: favelaHeaders });
      return r.ok ? r.json() : [];
    },
    enabled: !!selectedGrupo,
  });

  const { data: gruposKpi = { mulheres_pessoas: 0, outros_pessoas: 0 } } = useQuery<any>({
    queryKey: ["/api/favela3d/grupos-kpi"],
    enabled: activeTab === "grupos",
  });

  const { data: grupos = [], refetch: refetchGrupos } = useQuery<any[]>({
    queryKey: ["/api/favela3d/grupos"],
    enabled: activeTab === "grupos",
  });
  const { data: reunioes = [], refetch: refetchReunioes } = useQuery<any[]>({
    queryKey: ["/api/favela3d/grupos", selectedGrupo?.id, "reunioes"],
    queryFn: async () => {
      if (!selectedGrupo) return [];
      const r = await fetch(`/api/favela3d/grupos/${selectedGrupo.id}/reunioes`, { credentials: "include", headers: favelaHeaders });
      return r.json();
    },
    enabled: !!selectedGrupo,
  });

  // Mutations - Participantes
  const criarParticipante = useMutation({
    mutationFn: (data: any) => apiRequest("/api/favela3d/grupo-participantes", { method: "POST", body: JSON.stringify(data), headers: favelaHeaders }),
    onSuccess: () => { refetchGrupoParticipantes(); setPartForm({ nome: "", cpf: "", cep: "", rua: "", numero: "", bairro: "", cidade: "", estado: "", idade: "", genero: "" }); toast({ title: "Participante cadastrado!" }); },
    onError: (err: any) => {
      const msg = err?.message || "";
      toast({ title: msg.includes("CPF") ? msg : "Erro ao cadastrar", variant: "destructive" });
    },
  });
  const atualizarParticipante = useMutation({
    mutationFn: ({ id, data }: any) => apiRequest(`/api/favela3d/grupo-participantes/${id}`, { method: "PUT", body: JSON.stringify(data), headers: favelaHeaders }),
    onSuccess: () => { refetchGrupoParticipantes(); setEditPart(null); toast({ title: "Participante atualizado!" }); },
    onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
  });
  const excluirParticipante = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/favela3d/grupo-participantes/${id}`, { method: "DELETE", headers: favelaHeaders }),
    onSuccess: () => { refetchGrupoParticipantes(); toast({ title: "Participante excluído!" }); },
    onError: () => toast({ title: "Erro ao excluir", variant: "destructive" }),
  });

  // Mutations - Grupos
  const criarGrupo = useMutation({
    mutationFn: (data: any) => apiRequest("/api/favela3d/grupos", { method: "POST", body: JSON.stringify(data), headers: favelaHeaders }),
    onSuccess: () => { refetchGrupos(); setGrupoForm({ nome: "", descricao: "", member_ids: [] }); setGrupoMembroSearch(""); toast({ title: "Grupo criado!" }); },
    onError: () => toast({ title: "Erro ao criar grupo", variant: "destructive" }),
  });
  const atualizarGrupo = useMutation({
    mutationFn: ({ id, data }: any) => apiRequest(`/api/favela3d/grupos/${id}`, { method: "PUT", body: JSON.stringify(data), headers: favelaHeaders }),
    onSuccess: () => { refetchGrupos(); refetchGrupoMembros(); setEditGrupo(null); setGrupoMembroSearch(""); toast({ title: "Grupo atualizado!" }); },
    onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
  });
  const excluirGrupo = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/favela3d/grupos/${id}`, { method: "DELETE", headers: favelaHeaders }),
    onSuccess: () => { refetchGrupos(); setSelectedGrupo(null); toast({ title: "Grupo excluído!" }); },
    onError: () => toast({ title: "Erro ao excluir", variant: "destructive" }),
  });

  // Mutations - Reuniões
  const criarReuniao = useMutation({
    mutationFn: async (data: any) => {
      const reuniao = await apiRequest(`/api/favela3d/grupos/${selectedGrupo!.id}/reunioes`, { method: "POST", body: JSON.stringify(data), headers: favelaHeaders });
      if (reuniaoFotoFile) {
        const fd = new FormData(); fd.append("foto", reuniaoFotoFile);
        await fetch(`/api/favela3d/reunioes/${reuniao.id}/foto`, { method: "POST", body: fd, credentials: "include", headers: favelaHeaders });
      }
      return reuniao;
    },
    onSuccess: () => { refetchReunioes(); setShowReuniaoForm(false); setReuniaoForm({ data: "", descricao: "", titulo: "", participante_ids: [] }); setReuniaoFotoFile(null); toast({ title: "Reunião registrada!" }); },
    onError: () => toast({ title: "Erro ao registrar reunião", variant: "destructive" }),
  });
  const atualizarReuniao = useMutation({
    mutationFn: async ({ id, data }: any) => {
      const resp = await apiRequest(`/api/favela3d/reunioes/${id}`, { method: "PUT", body: JSON.stringify(data), headers: favelaHeaders });
      if (reuniaoFotoFile) {
        const fd = new FormData(); fd.append("foto", reuniaoFotoFile);
        await fetch(`/api/favela3d/reunioes/${id}/foto`, { method: "POST", body: fd, credentials: "include", headers: favelaHeaders });
      }
      return resp;
    },
    onSuccess: () => { refetchReunioes(); setEditReuniao(null); setReuniaoFotoFile(null); toast({ title: "Reunião atualizada!" }); },
    onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
  });
  const excluirReuniao = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/favela3d/reunioes/${id}`, { method: "DELETE", headers: favelaHeaders }),
    onSuccess: () => { refetchReunioes(); toast({ title: "Reunião excluída!" }); },
    onError: () => toast({ title: "Erro ao excluir", variant: "destructive" }),
  });

  // ---- Provisório counts ----
  const totalProvPart = (grupoParticipantes as any[]).filter((p: any) => isCpfProvisorio(p.cpf)).length;

  // ---- Toast uma vez por sessão ----
  useEffect(() => {
    if (participantes.length === 0) return;
    const key = "favela3d_prov_toast_shown";
    if (sessionStorage.getItem(key)) return;
    const total = totalProvFamilias + totalProvPart;
    if (total === 0) return;
    sessionStorage.setItem(key, "1");
    toast({
      title: `${total} registro${total > 1 ? "s" : ""} com CPF provisório`,
      description: "Atualize os CPFs reais assim que possível.",
    });
  }, [participantes, grupoParticipantes]);

  return (
    <div className="space-y-4">
      {/* Header — ocultar na seção de Grupos */}
      {activeTab !== "grupos" && (
      <div className="flex items-center gap-3">
        <Home className="w-6 h-6 text-purple-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">Favela 3D</h2>
          <p className="text-sm text-gray-500">Mapeamento e acompanhamento de famílias</p>
        </div>
      </div>
      )}

      {/* KPI Cards — ocultar na seção de Grupos */}
      {activeTab !== "grupos" && (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-purple-700">{totalFamilias}</p>
          <p className="text-xs text-purple-600 font-medium mt-1">Famílias</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{totalRegistros}</p>
          <p className="text-xs text-blue-600 font-medium mt-1">Registros</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-indigo-700">{totalVisitas}</p>
          <p className="text-xs text-indigo-600 font-medium mt-1">Visitas Dom.</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{totalAtendimentos}</p>
          <p className="text-xs text-green-600 font-medium mt-1">Atendimentos</p>
        </div>
      </div>
      )}

      {/* Banner CPF provisório — famílias (acima das tabs) */}
      {activeTab !== "grupos" && totalProvFamilias > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-800 text-sm font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>{totalProvFamilias} famíli{totalProvFamilias > 1 ? "as" : "a"} com CPF provisório</span>
          </div>
          <button className="text-xs text-amber-700 underline font-medium"
            onClick={() => { setActiveTab("familias"); setFiltroProvFamilias(true); }}>
            Ver famílias
          </button>
        </div>
      )}

      {/* Tabs — ocultar Atendidos/Registros quando em modo grupos */}
      {activeTab !== "grupos" && (
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("familias")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "familias"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users className="w-4 h-4 inline mr-1" />
          Atendidos Favela 3D ({totalFamilias})
        </button>
        <button
          onClick={() => setActiveTab("registros")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "registros"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileText className="w-4 h-4 inline mr-1" />
          Registros Favela 3D ({totalRegistros})
        </button>
      </div>
      )}

      {/* ======= TAB: FAMÍLIAS ======= */}
      {activeTab === "familias" && (
        <div className="space-y-4">
          {/* Header actions */}
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Famílias Cadastradas</h3>
            <Button
              onClick={() => setShowCadastro(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <Plus className="w-4 h-4" /> Cadastrar Família
            </Button>
          </div>

          {/* Search */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, CPF ou telefone..."
                value={buscaFamilia}
                onChange={e => setBuscaFamilia(e.target.value)}
                className="pl-9"
              />
            </div>
            {totalProvFamilias > 0 && (
              <button
                onClick={() => setFiltroProvFamilias(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors ${
                  filtroProvFamilias
                    ? "bg-amber-100 border-amber-400 text-amber-800"
                    : "bg-white border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-700"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {filtroProvFamilias ? `✕ Limpar filtro` : `CPF Prov. (${totalProvFamilias})`}
              </button>
            )}
          </div>

          {/* Table */}
          {loadingP ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>
          ) : familiasFiltradas.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border rounded-lg">
              {buscaFamilia ? "Nenhuma família encontrada." : "Nenhuma família cadastrada ainda."}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">Foto</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>IGF</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {familiasFiltradas.map(p => (
                    <TableRow key={p.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                          {p.fotoUrl
                            ? <img src={`/api/favela3d/participantes/${p.id}/foto-serve`} alt={p.nome} className="w-full h-full object-cover" />
                            : <Home className="w-4 h-4 text-purple-600" />}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-1.5 flex-wrap">
                          {p.nome}
                          {isCpfProvisorio(p.cpf) && (
                            <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-700 border border-amber-300 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                              <AlertTriangle className="w-2.5 h-2.5" />CPF Prov.
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{p.cpf || "—"}</TableCell>
                      <TableCell className="text-sm text-gray-500">{p.telefone || "—"}</TableCell>
                      <TableCell>
                        {p.igf ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${igfColor[p.igf] || "bg-gray-100 text-gray-700"}`}>
                            {p.igf}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => setViewingFamilia(p)}
                            className="p-1.5 text-gray-900 hover:text-black"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingFamilia(p)}
                            className="p-1.5 text-gray-900 hover:text-black"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteFamilia(p.id)}
                            className="p-1.5 text-red-400 hover:text-red-600"
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* ======= TAB: REGISTROS ======= */}
      {activeTab === "registros" && (
        <div className="space-y-4">
          {/* Toggle buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={regSubTab === "realizados" ? "default" : "outline"}
              onClick={() => setRegSubTab("realizados")}
              className={regSubTab === "realizados" ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              Registros Realizados
            </Button>
            <Button
              size="sm"
              variant={regSubTab === "novo" ? "default" : "outline"}
              onClick={() => setRegSubTab("novo")}
              className={regSubTab === "novo" ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              <Plus className="w-4 h-4 mr-1" /> Novo Registro
            </Button>
          </div>

          {/* --- Novo Registro form --- */}
          {regSubTab === "novo" && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-purple-800">Novo Registro — Favela 3D</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Tipo de Atendimento */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Tipo de Atendimento</label>
                  <Select
                    value={formRegistro.tipo}
                    onValueChange={v => setFormRegistro(f => ({ ...f, tipo: v, categoria: "", participantesIds: [] }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {TIPOS_REGISTRO.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Categoria — só para atendimento coletivo */}
                {formRegistro.tipo === "atendimento_coletivo" ? (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Categoria <span className="text-red-500">*</span></label>
                    <Select
                      value={formRegistro.categoria}
                      onValueChange={v => setFormRegistro(f => ({ ...f, categoria: v }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecione a categoria..." /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS_COLETIVO.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Data</label>
                    <Input
                      type="date"
                      value={formRegistro.data}
                      onChange={e => setFormRegistro(f => ({ ...f, data: e.target.value }))}
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-1 block">Título</label>
                  <Input
                    value={formRegistro.titulo}
                    onChange={e => setFormRegistro(f => ({ ...f, titulo: e.target.value }))}
                    placeholder="Ex: Visita — Maria Silva"
                  />
                </div>

                {/* Data (quando coletivo, fica aqui pois o campo ficou ocupado) */}
                {formRegistro.tipo === "atendimento_coletivo" && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Data</label>
                    <Input
                      type="date"
                      value={formRegistro.data}
                      onChange={e => setFormRegistro(f => ({ ...f, data: e.target.value }))}
                    />
                  </div>
                )}

                {/* Participante único — para tipos não coletivos */}
                {formRegistro.tipo !== "atendimento_coletivo" && (
                  <div className="relative">
                    <label className="text-sm font-medium mb-1 block">
                      Participante <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        value={partOpen ? partBusca : formRegistro.participanteNome}
                        onChange={e => {
                          setPartBusca(e.target.value);
                          setPartOpen(true);
                          setFormRegistro(f => ({ ...f, participanteNome: e.target.value, participanteId: "", participanteCpf: "" }));
                        }}
                        onFocus={() => { setPartOpen(true); setPartBusca(formRegistro.participanteNome || ""); }}
                        onBlur={() => {
                          const busca = partBusca.trim();
                          if (busca && !formRegistro.participanteId) {
                            const matches = participantes.filter(p =>
                              p.nome.toLowerCase().includes(busca.toLowerCase()) ||
                              (p.cpf || "").includes(busca)
                            );
                            if (matches.length === 1) {
                              setFormRegistro(f => ({
                                ...f,
                                participanteId: matches[0].id,
                                participanteNome: matches[0].nome,
                                participanteCpf: matches[0].cpf || "",
                              }));
                              setPartBusca("");
                            } else {
                              const exact = participantes.find(p =>
                                p.nome.toLowerCase() === busca.toLowerCase()
                              );
                              if (exact) {
                                setFormRegistro(f => ({
                                  ...f,
                                  participanteId: exact.id,
                                  participanteNome: exact.nome,
                                  participanteCpf: exact.cpf || "",
                                }));
                                setPartBusca("");
                              }
                            }
                          }
                          setTimeout(() => setPartOpen(false), 200);
                        }}
                        placeholder="Buscar participante cadastrado no Favela 3D..."
                      />
                      {partOpen && (() => {
                        const filtrados = partBusca.trim()
                          ? participantes.filter(p =>
                              p.nome.toLowerCase().includes(partBusca.toLowerCase()) ||
                              (p.cpf || "").includes(partBusca)
                            )
                          : participantes;
                        if (filtrados.length === 0) return (
                          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-gray-500">
                            Nenhum participante encontrado
                          </div>
                        );
                        return (
                          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {filtrados.slice(0, 30).map(p => (
                              <div
                                key={p.id}
                                className="px-3 py-2 hover:bg-purple-50 cursor-pointer text-sm flex items-center gap-2"
                                onMouseDown={() => {
                                  setFormRegistro(f => ({
                                    ...f,
                                    participanteId: p.id,
                                    participanteNome: p.nome,
                                    participanteCpf: p.cpf || "",
                                  }));
                                  setPartBusca("");
                                  setPartOpen(false);
                                }}
                              >
                                <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                  <Home className="w-3 h-3 text-purple-600" />
                                </div>
                                <div>
                                  <div className="font-medium">{p.nome}</div>
                                  {p.cpf && <div className="text-xs text-gray-400">{p.cpf}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                    {formRegistro.participanteNome && !formRegistro.participanteId && !partOpen && (
                      <p className="text-xs text-amber-600 mt-1">
                        Selecione o participante na lista para confirmar.
                      </p>
                    )}
                    {formRegistro.participanteId && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ {formRegistro.participanteNome} selecionado
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Multi-seleção de participantes — só para atendimento coletivo */}
              {formRegistro.tipo === "atendimento_coletivo" && (
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Participantes presentes <span className="text-xs text-gray-500">({formRegistro.participantesIds.length} selecionado(s))</span>
                  </label>
                  <Input
                    value={coletivoPartBusca}
                    onChange={e => setColetivoPartBusca(e.target.value)}
                    placeholder="Filtrar participantes..."
                    className="mb-2"
                  />
                  <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto bg-white divide-y divide-gray-100">
                    {participantes
                      .filter(p => !coletivoPartBusca.trim() ||
                        p.nome.toLowerCase().includes(coletivoPartBusca.toLowerCase()) ||
                        (p.cpf || "").includes(coletivoPartBusca))
                      .map(p => {
                        const checked = formRegistro.participantesIds.includes(p.id!);
                        return (
                          <label key={p.id} className="flex items-center gap-3 px-3 py-2 hover:bg-purple-50 cursor-pointer text-sm">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => setFormRegistro(f => ({
                                ...f,
                                participantesIds: checked
                                  ? f.participantesIds.filter(id => id !== p.id)
                                  : [...f.participantesIds, p.id!],
                              }))}
                              className="accent-purple-600"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{p.nome}</div>
                              {p.cpf && <div className="text-xs text-gray-400">{p.cpf}</div>}
                            </div>
                          </label>
                        );
                      })}
                    {participantes.length === 0 && (
                      <div className="p-3 text-sm text-gray-400 text-center">Nenhum participante cadastrado</div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-1 block">Descrição / Conteúdo</label>
                <Textarea
                  value={formRegistro.conteudo}
                  onChange={e => setFormRegistro(f => ({ ...f, conteudo: e.target.value }))}
                  placeholder="Descreva em detalhes o atendimento, observações, encaminhamentos realizados..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRegSubTab("realizados");
                    setFormRegistro({ ...EMPTY_REGISTRO, data: new Date().toISOString().split("T")[0] });
                    setPartBusca("");
                    setColetivoPartBusca("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => criarRegistro.mutate(formRegistro)}
                  disabled={
                    criarRegistro.isPending ||
                    !formRegistro.tipo ||
                    !formRegistro.conteudo.trim() ||
                    (formRegistro.tipo === "atendimento_coletivo"
                      ? !formRegistro.categoria || formRegistro.participantesIds.length === 0
                      : !formRegistro.participanteId)
                  }
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {criarRegistro.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Salvar Registro
                </Button>
              </div>
            </div>
          )}

          {/* --- Registros Realizados list --- */}
          {regSubTab === "realizados" && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={buscaRegistro}
                  onChange={e => setBuscaRegistro(e.target.value)}
                  placeholder="Pesquisar por nome do participante..."
                  className="pl-9"
                />
              </div>

              {/* ── Abas Coletivos / Individuais ── */}
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setRegistrosViewTab('individuais')}
                  className={`flex-1 text-xs font-medium py-1.5 px-3 rounded-md transition-colors ${registrosViewTab === 'individuais' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Individuais e Visitas {individuais.length > 0 && <span className="ml-1 bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full text-[10px]">{individuais.length}</span>}
                </button>
                <button
                  onClick={() => setRegistrosViewTab('coletivos')}
                  className={`flex-1 text-xs font-medium py-1.5 px-3 rounded-md transition-colors ${registrosViewTab === 'coletivos' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Atend. Coletivos {coletivos.length > 0 && <span className="ml-1 bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full text-[10px]">{coletivos.length}</span>}
                </button>
              </div>

              {loadingR ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>
              ) : registros.length === 0 ? (
                <div className="text-center py-8 text-gray-400 border rounded-lg">Nenhum registro cadastrado ainda</div>
              ) : (
                <div className="space-y-4">

                  {/* ── Atendimentos Coletivos ── */}
                  {registrosViewTab === 'coletivos' && (
                    <div>
                      {coletivos.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 border rounded-lg">Nenhum atendimento coletivo cadastrado</div>
                      ) : (
                      <div className="space-y-2">
                        {Object.entries(coletivosPorCategoria).map(([cat, regs]) => {
                          const isExp = expandedColetivo === cat;
                          return (
                            <div key={cat} className="border border-gray-200 rounded-lg overflow-hidden">
                              <button
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                                onClick={() => setExpandedColetivo(isExp ? null : cat)}
                              >
                                <div className="flex items-center gap-2">
                                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExp ? "rotate-90" : ""}`} />
                                  <span className="font-medium text-gray-800 text-sm">{categoriaLabel[cat] || cat}</span>
                                </div>
                                <Badge className="bg-purple-100 text-purple-800 text-xs">{regs.length} registro(s)</Badge>
                              </button>
                              {isExp && (
                                <div className="border-t border-gray-100 divide-y divide-gray-100">
                                  {regs.map(r => {
                                    const nomes: string[] = (r as any).participantesNomes || [];
                                    const isRecExpanded = expandedColetivoRegistro === r.id;
                                    return (
                                      <div key={r.id} className="px-4 py-3 bg-white">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoColor["atendimento_coletivo"] || "bg-gray-100 text-gray-700"}`}>Atend. Coletivo</span>
                                              <span className="text-xs text-gray-400">{r.data}</span>
                                              {nomes.length > 0 && (
                                                <button
                                                  onClick={() => setExpandedColetivoRegistro(isRecExpanded ? null : r.id)}
                                                  className="text-xs text-purple-600 hover:underline flex items-center gap-1"
                                                >
                                                  <Users className="w-3 h-3" />
                                                  {nomes.length} participante(s)
                                                  <ChevronRight className={`w-3 h-3 transition-transform ${isRecExpanded ? "rotate-90" : ""}`} />
                                                </button>
                                              )}
                                            </div>
                                            {r.titulo && <p className="text-sm font-medium text-gray-800 mb-1">{r.titulo}</p>}
                                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{r.conteudo}</p>
                                            {isRecExpanded && nomes.length > 0 && (
                                              <div className="mt-2 bg-gray-50 rounded-lg p-2 space-y-1">
                                                {nomes.map((nome, i) => (
                                                  <div key={i} className="flex items-center gap-2 text-xs text-gray-700">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                                                    {nome}
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-1 flex-shrink-0">
                                            <button onClick={() => setViewingRegistro(r)} className="p-1.5 text-black hover:text-gray-700" title="Visualizar"><Eye className="w-4 h-4" /></button>
                                            <button onClick={() => setConfirmDeleteRegistro(r.id)} className="p-1.5 text-red-400 hover:text-red-600" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      )}
                    </div>
                  )}

                  {/* ── Registros Individuais / Visitas agrupados por participante ── */}
                  {registrosViewTab === 'individuais' && (
                    <div>
                      {individuais.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 border rounded-lg">Nenhum registro individual ou visita cadastrado</div>
                      ) : filteredNames.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 border rounded-lg">Nenhum participante encontrado para essa pesquisa</div>
                      ) : (
                        <div className="space-y-2">
                          {filteredNames.map(nome => {
                            const regs = grouped[nome];
                            const isExpanded = expandedParticipant === nome;
                            return (
                              <div key={nome} className="border border-gray-200 rounded-lg overflow-hidden">
                                <button
                                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                                  onClick={() => setExpandedParticipant(isExpanded ? null : nome)}
                                >
                                  <div className="flex items-center gap-2">
                                    <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                                    <span className="font-medium text-gray-800 text-sm uppercase">{nome}</span>
                                  </div>
                                  <Badge className="bg-purple-100 text-purple-800 text-xs">{regs.length} registro(s)</Badge>
                                </button>
                                {isExpanded && (
                                  <div className="border-t border-gray-100 divide-y divide-gray-100">
                                    {regs.map(r => (
                                      <div key={r.id} className="px-4 py-3 bg-white">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoColor[r.tipo] || "bg-gray-100 text-gray-700"}`}>
                                                {tipoLabel[r.tipo] || r.tipo}
                                              </span>
                                              <span className="text-xs text-gray-400">{r.data}</span>
                                            </div>
                                            {r.titulo && <p className="text-sm font-medium text-gray-800 mb-1">{r.titulo}</p>}
                                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{r.conteudo}</p>
                                          </div>
                                          <div className="flex items-center gap-1 flex-shrink-0">
                                            <button onClick={() => setViewingRegistro(r)} className="p-1.5 text-black hover:text-gray-700" title="Visualizar"><Eye className="w-4 h-4" /></button>
                                            <button onClick={() => setConfirmDeleteRegistro(r.id)} className="p-1.5 text-red-400 hover:text-red-600" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======= MODALS ======= */}

      {/* Cadastro */}
      <ComprehensiveStudentForm
        open={showCadastro}
        onClose={() => {
          setShowCadastro(false);
          queryClient.invalidateQueries({ queryKey: ["/api/favela3d/participantes"] });
        }}
        mode="favela3d"
      />

      {/* Edição — usa o mesmo formulário completo do cadastro */}
      {editingFamilia && (
        <ComprehensiveStudentForm
          open={!!editingFamilia}
          onClose={() => {
            setEditingFamilia(null);
            queryClient.invalidateQueries({ queryKey: ["/api/favela3d/participantes"] });
          }}
          mode="favela3d"
          editId={editingFamilia.id}
        />
      )}

      {/* Visualização */}
      {viewingFamilia && (
        <ViewModal participante={viewingFamilia} onClose={() => setViewingFamilia(null)} />
      )}

      {/* Confirm delete família */}
      {confirmDeleteFamilia !== null && (
        <Dialog open onOpenChange={v => { if (!v) setConfirmDeleteFamilia(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600">Tem certeza que deseja remover esta família? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setConfirmDeleteFamilia(null)}>Cancelar</Button>
              <Button
                variant="destructive"
                onClick={() => excluirFamilia.mutate(confirmDeleteFamilia!)}
                disabled={excluirFamilia.isPending}
              >
                {excluirFamilia.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Remover
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* View registro */}
      {viewingRegistro && (
        <Dialog open onOpenChange={v => { if (!v) setViewingRegistro(null); }}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                {viewingRegistro.titulo || "Registro"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm pt-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${tipoColor[viewingRegistro.tipo] || "bg-gray-100 text-gray-700"}`}>
                  {tipoLabel[viewingRegistro.tipo] || viewingRegistro.tipo}
                </span>
                <span className="text-xs text-gray-500">Data: {viewingRegistro.data}</span>
                {viewingRegistro.participanteNome && (
                  <span className="text-xs text-gray-500">Participante: <span className="font-medium text-gray-700">{viewingRegistro.participanteNome}</span></span>
                )}
              </div>
              {viewingRegistro.titulo && (
                <div>
                  <span className="text-xs text-gray-500 block mb-0.5">Título</span>
                  <p className="font-medium text-gray-800">{viewingRegistro.titulo}</p>
                </div>
              )}
              <div>
                <span className="text-xs text-gray-500 block mb-0.5">Conteúdo</span>
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{viewingRegistro.conteudo}</p>
              </div>
            </div>
            <div className="flex justify-end pt-3 border-t mt-2">
              <Button variant="outline" onClick={() => setViewingRegistro(null)}>Fechar</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm delete registro */}
      {confirmDeleteRegistro !== null && (
        <Dialog open onOpenChange={v => { if (!v) setConfirmDeleteRegistro(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600">Tem certeza que deseja excluir este registro?</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setConfirmDeleteRegistro(null)}>Cancelar</Button>
              <Button
                variant="destructive"
                onClick={() => excluirRegistro.mutate(confirmDeleteRegistro!)}
                disabled={excluirRegistro.isPending}
              >
                {excluirRegistro.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Excluir
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ======= TAB: GRUPOS ======= */}
      {activeTab === "grupos" && (
        <div className="flex flex-col gap-4">

          {/* Header Grupos Favela 3D */}
          <div className="flex items-center gap-2 pb-2 border-b border-purple-100">
            <Layers className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="font-semibold text-purple-800 text-base">Grupos Favela 3D</h3>
              <p className="text-xs text-purple-400">Gerencie os grupos e seus encontros</p>
            </div>
          </div>

          {/* Banner CPF provisório — participantes dos grupos */}
          {totalProvPart > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-800 text-sm font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>{totalProvPart} participante{totalProvPart > 1 ? "s" : ""} dos grupos com CPF provisório</span>
              </div>
              <button className="text-xs text-amber-700 underline font-medium"
                onClick={() => { setGruposSubTab("participantes"); setFiltroProvPart(true); }}>
                Ver participantes
              </button>
            </div>
          )}

          {/* KPIs dos Grupos — Grupo de Mulheres vs. Outros */}
          {(() => {
            const gruposArr = grupos as any[];
            const gMulheres = gruposArr.find((g: any) => g.nome.toLowerCase().includes("mulheres"));
            const outros = gruposArr.filter((g: any) => !g.nome.toLowerCase().includes("mulheres"));
            const outrosEncontros = outros.reduce((acc: number, g: any) => acc + (g.total_reunioes || 0), 0);
            return (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100">
                  <p className="text-lg font-semibold text-purple-500 mb-1">Grupo de Mulheres</p>
                  <div className="flex justify-center gap-4">
                    <div>
                      <p className="text-2xl font-bold text-purple-700">{gMulheres?.total_reunioes ?? 0}</p>
                      <p className="text-xs text-purple-400 font-medium">Encontros</p>
                    </div>
                    <div className="w-px bg-purple-200" />
                    <div>
                      <p className="text-2xl font-bold text-purple-700">{(gruposKpi as any).mulheres_pessoas ?? 0}</p>
                      <p className="text-xs text-purple-400 font-medium">Pessoas</p>
                    </div>
                  </div>
                </div>
                <div className="bg-indigo-50 rounded-xl p-3 text-center border border-indigo-100">
                  <p className="text-lg font-semibold text-indigo-500 mb-1">Outros Grupos</p>
                  <div className="flex justify-center gap-4">
                    <div>
                      <p className="text-2xl font-bold text-indigo-700">{outrosEncontros}</p>
                      <p className="text-xs text-indigo-400 font-medium">Encontros</p>
                    </div>
                    <div className="w-px bg-indigo-200" />
                    <div>
                      <p className="text-2xl font-bold text-indigo-700">{(gruposKpi as any).outros_pessoas ?? 0}</p>
                      <p className="text-xs text-indigo-400 font-medium">Pessoas</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Sub-tabs: Grupos / Novo Grupo / Participantes */}
          <div className="flex gap-2 border-b border-gray-100 px-1 pb-0">
            {[
              { id: "grupos", label: "Grupos", icon: <Layers className="w-4 h-4" /> },
              { id: "novo-grupo", label: "Novo Grupo", icon: <Plus className="w-4 h-4" /> },
              { id: "participantes", label: "Participantes", icon: <Users className="w-4 h-4" /> },
            ].map(t => (
              <button key={t.id} onClick={() => { setGruposSubTab(t.id as any); setSelectedGrupo(null); }}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all ${gruposSubTab === t.id ? "border-purple-600 text-purple-700" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* ── SUB-TAB: PARTICIPANTES ── */}
          {gruposSubTab === "participantes" && (
            <>
            <div className="flex flex-col gap-4 px-1">
              <p className="text-xs text-gray-400">Cadastre as pessoas que poderão participar dos grupos Favela 3D.</p>

              {/* Form */}
              <div ref={editFormRef} className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <h4 className="text-sm font-semibold text-purple-800 mb-3">{editPart ? "Editar participante" : "Novo participante"}</h4>
                {editPart && isCpfProvisorio(editPart.cpf) && <CpfProvisorioAlerta />}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-gray-600 font-medium">Nome *</label>
                    <Input value={editPart ? editPart.nome : partForm.nome}
                      onChange={e => editPart ? setEditPart({...editPart, nome: e.target.value}) : setPartForm({...partForm, nome: e.target.value})}
                      placeholder="Nome completo" className="mt-1" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-600 font-medium">CPF *</label>
                    {(() => {
                      const cpfVal = editPart ? editPart.cpf || "" : partForm.cpf;
                      const isFull = cpfVal.replace(/\D/g,"").length === 11;
                      const isProv = isCpfProvisorio(cpfVal);
                      const isValid = !isFull || isProv || validarCPF(cpfVal);
                      return (
                        <>
                          <Input
                            value={cpfVal}
                            onChange={e => {
                              const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
                              const fmt = raw.length <= 3 ? raw : raw.length <= 6 ? `${raw.slice(0,3)}.${raw.slice(3)}` : raw.length <= 9 ? `${raw.slice(0,3)}.${raw.slice(3,6)}.${raw.slice(6)}` : `${raw.slice(0,3)}.${raw.slice(3,6)}.${raw.slice(6,9)}-${raw.slice(9)}`;
                              editPart ? setEditPart({...editPart, cpf: fmt}) : setPartForm({...partForm, cpf: fmt});
                            }}
                            placeholder="000.000.000-00" maxLength={14}
                            className={`mt-1 ${isFull && !isValid ? "border-red-400 focus:border-red-500" : ""}`} />
                          {isFull && !isValid && (
                            <p className="text-xs text-red-500 mt-1">CPF inválido. Verifique o número digitado.</p>
                          )}
                          <button type="button" className="text-xs text-purple-600 underline mt-1 block"
                            onClick={async () => {
                              try {
                                const cpf = await gerarCpfProvisorio();
                                editPart ? setEditPart({...editPart, cpf}) : setPartForm({...partForm, cpf});
                              } catch {}
                            }}>
                            Não tem CPF? Gerar provisório
                          </button>
                        </>
                      );
                    })()}
                  </div>
                  {/* CEP + Auto-preenchimento */}
                  <div className="col-span-2">
                    <label className="text-xs text-gray-600 font-medium">CEP</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={editPart ? editPart.cep || "" : partForm.cep}
                        onChange={e => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                          editPart ? setEditPart({...editPart, cep: v}) : setPartForm({...partForm, cep: v});
                        }}
                        onBlur={async () => {
                          const cep = (editPart ? editPart.cep : partForm.cep)?.replace(/\D/g, "");
                          if (cep?.length === 8) {
                            try {
                              const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                              const d = await r.json();
                              if (!d.erro) {
                                if (editPart) setEditPart({...editPart, rua: d.logradouro || "", bairro: d.bairro || "", cidade: d.localidade || "", estado: d.uf || ""});
                                else setPartForm(f => ({...f, rua: d.logradouro || "", bairro: d.bairro || "", cidade: d.localidade || "", estado: d.uf || ""}));
                              }
                            } catch {}
                          }
                        }}
                        placeholder="00000-000"
                        maxLength={9}
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-600 font-medium">Rua / Logradouro</label>
                    <Input value={editPart ? editPart.rua || "" : partForm.rua}
                      onChange={e => editPart ? setEditPart({...editPart, rua: e.target.value}) : setPartForm({...partForm, rua: e.target.value})}
                      placeholder="Nome da rua" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-medium">Número</label>
                    <Input value={editPart ? editPart.numero || "" : partForm.numero}
                      onChange={e => editPart ? setEditPart({...editPart, numero: e.target.value}) : setPartForm({...partForm, numero: e.target.value})}
                      placeholder="Ex: 123" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-medium">Bairro</label>
                    <Input value={editPart ? editPart.bairro || "" : partForm.bairro}
                      onChange={e => editPart ? setEditPart({...editPart, bairro: e.target.value}) : setPartForm({...partForm, bairro: e.target.value})}
                      placeholder="Nome do bairro" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-medium">Cidade</label>
                    <Input value={editPart ? editPart.cidade || "" : partForm.cidade}
                      onChange={e => editPart ? setEditPart({...editPart, cidade: e.target.value}) : setPartForm({...partForm, cidade: e.target.value})}
                      placeholder="Cidade" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-medium">Estado (UF)</label>
                    <Input value={editPart ? editPart.estado || "" : partForm.estado}
                      onChange={e => editPart ? setEditPart({...editPart, estado: e.target.value}) : setPartForm({...partForm, estado: e.target.value})}
                      placeholder="Ex: SP" maxLength={2} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-medium">Idade</label>
                    <Input type="number" value={editPart ? editPart.idade || "" : partForm.idade}
                      onChange={e => editPart ? setEditPart({...editPart, idade: e.target.value}) : setPartForm({...partForm, idade: e.target.value})}
                      placeholder="Ex: 32" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-medium">Gênero</label>
                    <Select value={editPart ? editPart.genero || "" : partForm.genero}
                      onValueChange={v => editPart ? setEditPart({...editPart, genero: v}) : setPartForm({...partForm, genero: v})}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="nao_binario">Não-binário</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                        <SelectItem value="prefiro_nao_dizer">Prefiro não dizer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {editPart ? (
                    <>
                      <Button size="sm" onClick={() => atualizarParticipante.mutate({ id: editPart.id, data: editPart })} disabled={atualizarParticipante.isPending || (editPart.cpf && editPart.cpf.replace(/\D/g,"").length === 11 && !isCpfProvisorio(editPart.cpf) && !validarCPF(editPart.cpf))}>
                        {atualizarParticipante.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}Salvar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditPart(null)}>Cancelar</Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => criarParticipante.mutate(partForm)} disabled={criarParticipante.isPending || !partForm.nome || !partForm.cpf || (!isCpfProvisorio(partForm.cpf) && !validarCPF(partForm.cpf))}>
                      {criarParticipante.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}Cadastrar
                    </Button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <Input placeholder="Buscar por nome ou CPF..." value={partSearch} onChange={e => setPartSearch(e.target.value)} className="pl-9" />
                </div>
                {totalProvPart > 0 && (
                  <button
                    onClick={() => setFiltroProvPart(v => !v)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors ${
                      filtroProvPart
                        ? "bg-amber-100 border-amber-400 text-amber-800"
                        : "bg-white border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-700"
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {filtroProvPart ? "✕ Limpar filtro" : `CPF Prov. (${totalProvPart})`}
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {(grupoParticipantes as any[]).filter(p => {
                  const q = partSearch.toLowerCase();
                  const matchBusca = p.nome.toLowerCase().includes(q) || (p.cpf || "").replace(/\D/g,"").includes(q.replace(/\D/g,"")) || (p.cpf || "").toLowerCase().includes(q);
                  const matchProv = !filtroProvPart || isCpfProvisorio(p.cpf);
                  return matchBusca && matchProv;
                }).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-4 py-3">
                    <div>
                      <p className="font-medium text-sm text-gray-800 flex items-center gap-1.5">
                        {p.nome}
                        {isCpfProvisorio(p.cpf) && (
                          <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-700 border border-amber-300 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                            <AlertTriangle className="w-2.5 h-2.5" />CPF Prov.
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">{[p.cpf ? `CPF: ${p.cpf}` : null, p.genero ? p.genero.charAt(0).toUpperCase() + p.genero.slice(1) : null, p.idade ? `${p.idade} anos` : null].filter(Boolean).join(" · ")}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="text-purple-500" onClick={() => setViewPart(p)}><Eye className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => { const raw = (p.cpf || "").replace(/\D/g,""); const fmt = raw.length === 11 ? `${raw.slice(0,3)}.${raw.slice(3,6)}.${raw.slice(6,9)}-${raw.slice(9)}` : p.cpf || ""; setEditPart({...p, cpf: fmt}); setTimeout(() => editFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }}><Edit2 className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => excluirParticipante.mutate(p.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
                {(grupoParticipantes as any[]).length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-6">Nenhum participante cadastrado ainda.</p>
                )}
              </div>
            </div>

            {/* Dialog: Ver detalhes do participante */}
            {viewPart && (
              <Dialog open onOpenChange={v => { if (!v) setViewPart(null); }}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-purple-800">{viewPart.nome}</DialogTitle>
                  </DialogHeader>
                  {isCpfProvisorio(viewPart.cpf) && <CpfProvisorioAlerta />}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    {viewPart.cpf && (
                      <div className="col-span-2"><p className="text-xs text-gray-400 font-medium">CPF</p><p className="text-gray-800 font-mono">{viewPart.cpf}</p></div>
                    )}
                    {viewPart.genero && (
                      <div><p className="text-xs text-gray-400 font-medium">Gênero</p><p className="text-gray-800">{viewPart.genero.charAt(0).toUpperCase() + viewPart.genero.slice(1)}</p></div>
                    )}
                    {viewPart.idade && (
                      <div><p className="text-xs text-gray-400 font-medium">Idade</p><p className="text-gray-800">{viewPart.idade} anos</p></div>
                    )}
                    {viewPart.cep && (
                      <div><p className="text-xs text-gray-400 font-medium">CEP</p><p className="text-gray-800">{viewPart.cep}</p></div>
                    )}
                    {viewPart.rua && (
                      <div className="col-span-2"><p className="text-xs text-gray-400 font-medium">Rua</p><p className="text-gray-800">{viewPart.rua}{viewPart.numero ? `, ${viewPart.numero}` : ""}</p></div>
                    )}
                    {viewPart.bairro && (
                      <div><p className="text-xs text-gray-400 font-medium">Bairro</p><p className="text-gray-800">{viewPart.bairro}</p></div>
                    )}
                    {viewPart.cidade && (
                      <div><p className="text-xs text-gray-400 font-medium">Cidade / UF</p><p className="text-gray-800">{viewPart.cidade}{viewPart.estado ? ` / ${viewPart.estado}` : ""}</p></div>
                    )}
                    {!viewPart.rua && !viewPart.cep && viewPart.endereco && (
                      <div className="col-span-2"><p className="text-xs text-gray-400 font-medium">Endereço</p><p className="text-gray-800">{viewPart.endereco}</p></div>
                    )}
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button variant="outline" onClick={() => setViewPart(null)}>Fechar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            </>
          )}

          {/* ── SUB-TAB: NOVO GRUPO ── */}
          {gruposSubTab === "novo-grupo" && (
            <div className="flex flex-col gap-4 px-1">
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <h4 className="text-sm font-semibold text-purple-800 mb-3">Novo grupo</h4>
                <div className="flex flex-col gap-2">
                  <Input value={grupoForm.nome} onChange={e => setGrupoForm({...grupoForm, nome: e.target.value})} placeholder="Nome do grupo" />
                  <Textarea value={grupoForm.descricao} onChange={e => setGrupoForm({...grupoForm, descricao: e.target.value})} placeholder="Descrição (opcional)" className="h-16" />
                      {/* Combobox de membros */}
                      <div>
                        <label className="text-xs text-gray-600 font-medium">Membros do grupo</label>
                        {(() => {
                          const ids = grupoForm.member_ids;
                          const toggle = (pid: number) => {
                            const next = ids.includes(pid) ? ids.filter(x => x !== pid) : [...ids, pid];
                            setGrupoForm({...grupoForm, member_ids: next});
                          };
                          const selected = (grupoParticipantes as any[]).filter((p: any) => ids.includes(p.id));
                          const filtered = (grupoParticipantes as any[]).filter((p: any) => {
                            if (ids.includes(p.id)) return false;
                            const q = grupoMembroSearch.toLowerCase();
                            return p.nome.toLowerCase().includes(q) || (p.cpf || "").replace(/\D/g,"").includes(q.replace(/\D/g,"")) || (p.cpf || "").toLowerCase().includes(q);
                          });
                          return (
                            <div className="mt-1 flex flex-col gap-2">
                              {selected.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {selected.map((p: any) => (
                                    <span key={p.id} className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full border border-purple-200">
                                      {p.nome}<button type="button" onClick={() => toggle(p.id)} className="ml-0.5 text-purple-400 hover:text-purple-700"><X className="w-3 h-3" /></button>
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                                <input type="text" value={grupoMembroSearch}
                                  onChange={e => { setGrupoMembroSearch(e.target.value); setShowMembroDropdown(true); }}
                                  onFocus={() => setShowMembroDropdown(true)}
                                  placeholder="Buscar participante para adicionar..."
                                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-purple-400 bg-white" />
                                {showMembroDropdown && grupoMembroSearch && (
                                  <div className="absolute z-20 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                                    {filtered.length > 0 ? filtered.map((p: any) => (
                                      <button key={p.id} type="button"
                                        onMouseDown={e => { e.preventDefault(); toggle(p.id); setGrupoMembroSearch(""); }}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 flex items-center gap-2">
                                        <Plus className="w-3 h-3 text-purple-400" />{p.nome}
                                      </button>
                                    )) : <p className="px-3 py-2 text-xs text-gray-400">Nenhum participante encontrado</p>}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                  <Button size="sm" className="self-start" onClick={() => { criarGrupo.mutate(grupoForm); setGruposSubTab("grupos" as any); }} disabled={criarGrupo.isPending || !grupoForm.nome}>
                    {criarGrupo.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}Criar grupo
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── SUB-TAB: GRUPOS ── */}
          {gruposSubTab === "grupos" && !selectedGrupo && (
            <div className="flex flex-col gap-4 px-1">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input placeholder="Buscar grupo por nome..." className="pl-9" onChange={e => setGrupoSearch(e.target.value)} value={grupoSearch} />
              </div>

              {/* Lista de grupos */}
              <div className="flex flex-col gap-3">
                {(grupos as any[]).filter((g: any) => g.nome.toLowerCase().includes(grupoSearch.toLowerCase())).map((g: any) => (
                  <div key={g.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-start justify-between hover:border-purple-200 transition-colors">
                    <button className="flex-1 text-left" onClick={() => { setSelectedGrupo(g); setShowReuniaoForm(false); setEditReuniao(null); }}>
                      <p className="font-semibold text-gray-800">{g.nome}</p>
                      {g.descricao && <p className="text-xs text-gray-500 mt-0.5">{g.descricao}</p>}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-purple-600 font-medium flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />{g.total_reunioes} encontro{g.total_reunioes !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />{g.total_participantes} pessoa{g.total_participantes !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </button>
                    <div className="flex gap-1 ml-2">
                      <Button size="sm" variant="ghost" className="text-purple-500" onClick={async () => { const r = await fetch(`/api/favela3d/grupos/${g.id}/membros`, { credentials: "include", headers: favelaHeaders }); const members = r.ok ? await r.json() : []; setViewGrupoMembros(members); setViewGrupo(g); }}><Eye className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={async () => { const r = await fetch(`/api/favela3d/grupos/${g.id}/membros`, { credentials: "include", headers: favelaHeaders }); const members = r.ok ? await r.json() : []; setEditGrupo({...g, member_ids: members.map((m: any) => m.id)}); setGrupoMembroSearch(""); setShowMembroDropdown(false); }}><Edit2 className="w-4 h-4" /></Button>
                      {!g.nome.toLowerCase().includes("mulheres") && (
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => excluirGrupo.mutate(g.id)}><Trash2 className="w-4 h-4" /></Button>
                      )}
                    </div>
                  </div>
                ))}
                {(grupos as any[]).length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-8">Nenhum grupo cadastrado ainda.</p>
                )}
              </div>
            </div>
          )}

          {/* ── MODAL: Ver grupo ── */}
          <Dialog open={!!viewGrupo} onOpenChange={o => { if (!o) setViewGrupo(null); }}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-purple-800">{viewGrupo?.nome}</DialogTitle>
              </DialogHeader>
              {viewGrupo?.descricao && (
                <p className="text-sm text-gray-600 -mt-2">{viewGrupo.descricao}</p>
              )}
              <div className="mt-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Membros ({viewGrupoMembros.length})
                </p>
                {viewGrupoMembros.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Nenhum membro cadastrado neste grupo.</p>
                ) : (
                  <div className="flex flex-col divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    {viewGrupoMembros.map((m: any, idx: number) => (
                      <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 bg-white">
                        <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700 shrink-0">
                          {m.nome?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-800">{m.nome}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5 text-purple-400" />{viewGrupo?.total_reunioes ?? 0} encontro{viewGrupo?.total_reunioes !== 1 ? "s" : ""}</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-indigo-400" />{viewGrupoMembros.length} pessoa{viewGrupoMembros.length !== 1 ? "s" : ""}</span>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* ── DETALHE DO GRUPO: reuniões ── */}
          {gruposSubTab === "grupos" && selectedGrupo && (
            <div className="flex flex-col gap-4 px-1">
              {/* Header do grupo */}
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-gray-800 flex-1">{selectedGrupo.nome}</h3>
                <Button size="sm" onClick={() => { const lastIds = (reunioes as any[])[0]?.presentes?.map((p: any) => p.id) || []; setShowReuniaoForm(true); setEditReuniao(null); setReuniaoForm({ data: "", descricao: "", titulo: "", participante_ids: lastIds }); setReuniaoFotoFile(null); setPartSearchReuniao(""); }}>
                  <Plus className="w-4 h-4 mr-1" />Nova reunião
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setSelectedGrupo(null); setShowReuniaoForm(false); setEditReuniao(null); }}>
                  <ArrowLeft className="w-4 h-4 mr-1" />Voltar
                </Button>
              </div>

              {/* Form de reunião */}
              {(showReuniaoForm || editReuniao) && (
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <h4 className="text-sm font-semibold text-purple-800 mb-3">{editReuniao ? "Editar reunião" : "Registrar reunião"}</h4>
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-xs text-gray-600 font-medium">Título / Assunto</label>
                      <Input placeholder="Ex: Roda de conversa sobre saúde mental"
                        value={editReuniao ? editReuniao.titulo || "" : reuniaoForm.titulo}
                        onChange={e => editReuniao ? setEditReuniao({...editReuniao, titulo: e.target.value}) : setReuniaoForm({...reuniaoForm, titulo: e.target.value})} className="mt-1" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 font-medium">Data *</label>
                      <Input type="date" className="mt-1"
                        value={editReuniao ? editReuniao.data?.split("T")[0] || "" : reuniaoForm.data}
                        onChange={e => editReuniao ? setEditReuniao({...editReuniao, data: e.target.value}) : setReuniaoForm({...reuniaoForm, data: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 font-medium">O que aconteceu?</label>
                      <Textarea className="mt-1 h-20" placeholder="Breve descrição do encontro..."
                        value={editReuniao ? editReuniao.descricao || "" : reuniaoForm.descricao}
                        onChange={e => editReuniao ? setEditReuniao({...editReuniao, descricao: e.target.value}) : setReuniaoForm({...reuniaoForm, descricao: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 font-medium">Participantes presentes</label>
                      {(() => {
                        const ids: number[] = editReuniao ? (editReuniao.participante_ids || []) : reuniaoForm.participante_ids;
                        const toggle = (pid: number) => {
                          const next = ids.includes(pid) ? ids.filter((x: number) => x !== pid) : [...ids, pid];
                          if (editReuniao) setEditReuniao({...editReuniao, participante_ids: next});
                          else setReuniaoForm({...reuniaoForm, participante_ids: next});
                        };
                        const members = (grupoMembros as any[]);
                        const filtered = members
                          .filter((p: any) => {
                            const q = partSearchReuniao.toLowerCase();
                            return p.nome.toLowerCase().includes(q) || (p.cpf || "").replace(/\D/g,"").includes(q.replace(/\D/g,"")) || (p.cpf || "").toLowerCase().includes(q);
                          })
                          .sort((a: any, b: any) => a.nome.localeCompare(b.nome, 'pt-BR'));
                        const presentCount = ids.filter((id: number) => members.some((m: any) => m.id === id)).length;
                        return (
                          <div className="mt-1 flex flex-col gap-2">
                            {/* Busca para filtrar a lista */}
                            <div className="relative">
                              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                              <input
                                type="text"
                                value={partSearchReuniao}
                                onChange={e => setPartSearchReuniao(e.target.value)}
                                placeholder="Filtrar membros..."
                                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-purple-400 bg-white"
                              />
                            </div>
                            {/* Lista de checkboxes */}
                            {members.length === 0 ? (
                              <p className="text-xs text-gray-400 py-2 text-center">Cadastre membros neste grupo primeiro</p>
                            ) : (
                              <>
                                <div className="text-xs text-purple-600 font-medium">{presentCount} de {members.length} presentes</div>
                                <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100 max-h-48 overflow-y-auto">
                                  {filtered.map((p: any) => (
                                    <label key={p.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${ids.includes(p.id) ? 'bg-purple-50' : 'bg-white hover:bg-gray-50'}`}>
                                      <input
                                        type="checkbox"
                                        checked={ids.includes(p.id)}
                                        onChange={() => toggle(p.id)}
                                        className="accent-purple-600 w-4 h-4 rounded"
                                      />
                                      <span className={`text-sm flex-1 ${ids.includes(p.id) ? 'text-purple-800 font-medium' : 'text-gray-700'}`}>{p.nome}</span>
                                      {ids.includes(p.id) && <span className="text-xs text-purple-500 font-medium">presente</span>}
                                    </label>
                                  ))}
                                  {filtered.length === 0 && (
                                    <p className="px-3 py-2 text-xs text-gray-400 text-center">Nenhum membro encontrado</p>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 font-medium">Foto do encontro</label>
                      <div className="mt-1 flex items-center gap-2">
                        <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors">
                          <Camera className="w-4 h-4" />
                          {reuniaoFotoFile ? reuniaoFotoFile.name : "Selecionar foto"}
                          <input type="file" accept="image/*" className="hidden" onChange={e => setReuniaoFotoFile(e.target.files?.[0] || null)} />
                        </label>
                        {reuniaoFotoFile && <Button size="sm" variant="ghost" onClick={() => setReuniaoFotoFile(null)}><X className="w-3 h-3" /></Button>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {editReuniao ? (
                        <>
                          <Button size="sm" onClick={() => atualizarReuniao.mutate({ id: editReuniao.id, data: { data: editReuniao.data?.split("T")[0], descricao: editReuniao.descricao, titulo: editReuniao.titulo, participante_ids: editReuniao.participante_ids || [] } })} disabled={atualizarReuniao.isPending}>
                            {atualizarReuniao.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}Salvar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditReuniao(null)}>Cancelar</Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" onClick={() => criarReuniao.mutate(reuniaoForm)} disabled={criarReuniao.isPending || !reuniaoForm.data}>
                            {criarReuniao.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}Registrar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setShowReuniaoForm(false)}>Cancelar</Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Busca de reuniões */}
              {(reunioes as any[]).length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por título ou data (ex: 22/04)..."
                    className="pl-9"
                    value={reuniaoSearch}
                    onChange={e => setReuniaoSearch(e.target.value)}
                  />
                </div>
              )}

              {/* Lista de reuniões */}
              <div className="flex flex-col gap-3">
                {(reunioes as any[]).filter((r: any) => {
                  const q = reuniaoSearch.toLowerCase().trim();
                  if (!q) return true;
                  const tituloMatch = (r.titulo || "").toLowerCase().includes(q);
                  const dataFormatada = r.data ? new Date(r.data.split("T")[0] + "T00:00:00").toLocaleDateString("pt-BR") : "";
                  const dataMatch = dataFormatada.includes(q);
                  return tituloMatch || dataMatch;
                }).map((r: any) => (
                  <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-purple-500" />
                        <span className="font-medium text-sm text-gray-800">
                          {r.data ? new Date(r.data.split("T")[0] + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="text-purple-500" onClick={() => setViewReuniao(r)}><Eye className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditReuniao({...r, data: r.data?.split("T")[0] || r.data, participante_ids: (r.presentes || []).map((p: any) => p.id)})}><Edit2 className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => excluirReuniao.mutate(r.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    {r.titulo && <p className="text-sm font-semibold text-gray-800 mb-1">{r.titulo}</p>}
                    {r.descricao && <p className="text-sm text-gray-500 mb-2">{r.descricao.length > 80 ? r.descricao.slice(0, 80) + "..." : r.descricao}</p>}
                    {r.presentes && r.presentes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        <UserCheck className="w-3.5 h-3.5 text-green-500 self-center" />
                        {(r.presentes as any[]).map((p: any) => (
                          <span key={p.id} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">{p.nome}</span>
                        ))}
                      </div>
                    )}
                    {r.foto_url && (
                      <ReuniaoFoto reuniaoId={r.id} />
                    )}
                  </div>
                ))}
                {(reunioes as any[]).length === 0 && !showReuniaoForm && (
                  <p className="text-center text-gray-400 text-sm py-8">Nenhuma reunião registrada ainda. Clique em "Nova reunião" para começar.</p>
                )}
                {(reunioes as any[]).length > 0 && reuniaoSearch && (reunioes as any[]).filter((r: any) => {
                  const q = reuniaoSearch.toLowerCase().trim();
                  const tituloMatch = (r.titulo || "").toLowerCase().includes(q);
                  const dataFormatada = r.data ? new Date(r.data.split("T")[0] + "T00:00:00").toLocaleDateString("pt-BR") : "";
                  return tituloMatch || dataFormatada.includes(q);
                }).length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-6">Nenhuma reunião encontrada para "{reuniaoSearch}".</p>
                )}
              </div>

              {/* Dialog: Ver detalhes da reunião */}
              {viewReuniao && (
                <Dialog open onOpenChange={v => { if (!v) setViewReuniao(null); }}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-purple-800">
                        {viewReuniao.titulo || "Detalhes da Reunião"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 text-sm max-h-[60vh] overflow-y-auto pr-1">
                      <div className="flex items-center gap-2 text-gray-600">
                        <CalendarDays className="w-4 h-4 text-purple-400" />
                        <span className="font-medium">
                          {viewReuniao.data ? new Date(viewReuniao.data.split("T")[0] + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "—"}
                        </span>
                      </div>
                      {viewReuniao.descricao && (
                        <div>
                          <p className="text-xs text-gray-400 font-medium uppercase mb-1">O que aconteceu</p>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words overflow-hidden">{viewReuniao.descricao}</p>
                        </div>
                      )}
                      {viewReuniao.presentes && viewReuniao.presentes.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-400 font-medium uppercase mb-2">Participantes ({viewReuniao.presentes.length})</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(viewReuniao.presentes as any[]).map((p: any) => (
                              <span key={p.id} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-100">{p.nome}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      <ReuniaoFoto reuniaoId={viewReuniao.id} />
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button variant="outline" onClick={() => setViewReuniao(null)}>Fechar</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}

          {/* Dialog editar grupo */}
          {editGrupo && (
            <Dialog open onOpenChange={v => { if (!v) setEditGrupo(null); }}>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Editar grupo</DialogTitle></DialogHeader>
                <div className="flex flex-col gap-3">
                  <Input value={editGrupo.nome} onChange={e => setEditGrupo({...editGrupo, nome: e.target.value})} placeholder="Nome do grupo" disabled={editGrupo.nome.toLowerCase().includes("mulheres")} className={editGrupo.nome.toLowerCase().includes("mulheres") ? "opacity-60 cursor-not-allowed bg-gray-100" : ""} />
                  <Textarea value={editGrupo.descricao || ""} onChange={e => setEditGrupo({...editGrupo, descricao: e.target.value})} placeholder="Descrição" className="h-16" />
                  <div>
                    <label className="text-xs text-gray-600 font-medium">Membros do grupo</label>
                    {(() => {
                      const ids: number[] = editGrupo.member_ids || [];
                      const toggle = (pid: number) => {
                        const next = ids.includes(pid) ? ids.filter((x: number) => x !== pid) : [...ids, pid];
                        setEditGrupo({...editGrupo, member_ids: next});
                      };
                      const selected = (grupoParticipantes as any[]).filter((p: any) => ids.includes(p.id));
                      const filtered = (grupoParticipantes as any[]).filter((p: any) => {
                        if (ids.includes(p.id)) return false;
                        const q = grupoMembroSearch.toLowerCase();
                        return p.nome.toLowerCase().includes(q) || (p.cpf || "").replace(/\D/g,"").includes(q.replace(/\D/g,"")) || (p.cpf || "").toLowerCase().includes(q);
                      });
                      return (
                        <div className="mt-1 flex flex-col gap-2">
                          {selected.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {selected.map((p: any) => (
                                <span key={p.id} className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full border border-purple-200">
                                  {p.nome}<button type="button" onClick={() => toggle(p.id)} className="ml-0.5 text-purple-400 hover:text-purple-700"><X className="w-3 h-3" /></button>
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                            <input type="text" value={grupoMembroSearch}
                              onChange={e => { setGrupoMembroSearch(e.target.value); setShowMembroDropdown(true); }}
                              onFocus={() => setShowMembroDropdown(true)}
                              placeholder="Buscar participante para adicionar..."
                              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-purple-400 bg-white" />
                            {showMembroDropdown && grupoMembroSearch && (
                              <div className="absolute z-20 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                                {filtered.length > 0 ? filtered.map((p: any) => (
                                  <button key={p.id} type="button"
                                    onMouseDown={e => { e.preventDefault(); toggle(p.id); setGrupoMembroSearch(""); }}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 flex items-center gap-2">
                                    <Plus className="w-3 h-3 text-purple-400" />{p.nome}
                                  </button>
                                )) : <p className="px-3 py-2 text-xs text-gray-400">Nenhum participante encontrado</p>}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => { setEditGrupo(null); setGrupoMembroSearch(""); }}>Cancelar</Button>
                  <Button onClick={() => atualizarGrupo.mutate({ id: editGrupo.id, data: { ...editGrupo, member_ids: editGrupo.member_ids || [] } })} disabled={atualizarGrupo.isPending}>
                    {atualizarGrupo.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}Salvar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

        </div>
      )}
    </div>
  );
}
