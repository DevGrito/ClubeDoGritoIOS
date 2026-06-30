import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ComprehensiveStudentForm } from "@/components/comprehensive-student-form";
import {
  Users, Plus, Search, Loader2, User, Edit2, Trash2, ChevronDown, ChevronUp
} from "lucide-react";

interface Props {
  userId: string | number;
  userRole: string;
}

type Pessoa = {
  id: number;
  nome: string;
  cpf?: string | null;
  data_nascimento?: string | null;
  sexo?: string | null;
  raca?: string | null;
  email?: string | null;
  telefone?: string | null;
  cep?: string | null;
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  numero_pessoas?: number | null;
  criancas?: number | null;
  adolescentes?: number | null;
  adultos?: number | null;
  idosos?: number | null;
  tem_cad_unico?: string | null;
  tem_bolsa_familia?: string | null;
  tem_bpc?: string | null;
  demandas?: string | null;
  observacoes?: string | null;
  created_at?: string | null;
};

function formatCPF(v?: string | null) {
  if (!v) return "—";
  const n = v.replace(/\D/g, "");
  if (n.length === 11) return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  return v;
}

function calcIdade(dataNasc?: string | null) {
  if (!dataNasc) return null;
  const d = new Date(dataNasc);
  const hoje = new Date();
  let age = hoje.getFullYear() - d.getFullYear();
  const m = hoje.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < d.getDate())) age--;
  return age >= 0 ? age : null;
}

export default function AtendidosComunidadeSection({ userId }: Props) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showCadastroCSF, setShowCadastroCSF] = useState(false);
  const [editIdCSF, setEditIdCSF] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const { data: pessoas = [], isLoading } = useQuery<Pessoa[]>({
    queryKey: ["/api/psico/atendidos-comunidade"],
    queryFn: async () => {
      const res = await fetch("/api/psico/atendidos-comunidade", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/psico/atendidos-comunidade/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/psico/atendidos-comunidade"] });
      toast({ title: "Pessoa removida." });
      setConfirmDelete(null);
    },
    onError: (e: any) => toast({ title: "Erro ao remover", description: e.message, variant: "destructive" }),
  });

  const filtered = (pessoas as Pessoa[]).filter(p => {
    if (!search.trim()) return true;
    const t = search.toLowerCase();
    return (p.nome || "").toLowerCase().includes(t) || (p.cpf || "").includes(search) || (p.bairro || "").toLowerCase().includes(t);
  }).sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            Atendidos Comunidade
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Pessoas da comunidade acompanhadas</p>
        </div>
        <Button onClick={() => setShowCadastroCSF(true)} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
          <Plus className="w-4 h-4" />
          Nova Pessoa
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nome, CPF ou bairro..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-purple-700 border-purple-200 bg-purple-50">
          {filtered.length} pessoa{filtered.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          <span className="ml-2 text-gray-500">Carregando...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{search ? "Nenhum resultado encontrado." : "Nenhuma pessoa cadastrada ainda."}</p>
          {!search && <p className="text-sm mt-1">Clique em "Nova Pessoa" para cadastrar.</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const idade = calcIdade(p.data_nascimento);
            const isExp = expanded === p.id;
            return (
              <div key={p.id} className="border border-gray-200 rounded-xl bg-white hover:border-purple-200 transition-all">
                <button
                  className="w-full text-left px-4 py-3 flex items-center gap-3"
                  onClick={() => setExpanded(isExp ? null : p.id)}
                >
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{p.nome}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                      {p.sexo && <span>{p.sexo}</span>}
                      {idade !== null && <span>{idade} anos</span>}
                      {p.bairro && <span>{p.bairro}</span>}
                      {p.cpf && <span className="font-mono">{formatCPF(p.cpf)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {p.tem_cad_unico === "Sim" && <Badge variant="outline" className="text-xs text-green-700 border-green-200 bg-green-50">CadÚnico</Badge>}
                    {p.tem_bolsa_familia === "Sim" && <Badge variant="outline" className="text-xs text-blue-700 border-blue-200 bg-blue-50">Bolsa Família</Badge>}
                    {isExp ? <ChevronUp className="w-4 h-4 text-gray-400 ml-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />}
                  </div>
                </button>

                {isExp && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      <div><span className="text-gray-400 text-xs block">CPF</span><span className="font-mono">{formatCPF(p.cpf)}</span></div>
                      <div><span className="text-gray-400 text-xs block">Nasc.</span>{p.data_nascimento ? new Date(p.data_nascimento).toLocaleDateString("pt-BR") : "—"}</div>
                      <div><span className="text-gray-400 text-xs block">Gênero</span>{p.sexo || "—"}</div>
                      <div><span className="text-gray-400 text-xs block">Raça/Cor</span>{p.raca || "—"}</div>
                      <div><span className="text-gray-400 text-xs block">Telefone</span>{p.telefone || "—"}</div>
                      <div><span className="text-gray-400 text-xs block">E-mail</span>{p.email || "—"}</div>
                      <div><span className="text-gray-400 text-xs block">Endereço</span>{p.endereco ? `${p.endereco}${p.numero ? ", " + p.numero : ""}${p.complemento ? " " + p.complemento : ""}` : "—"}</div>
                      <div><span className="text-gray-400 text-xs block">Bairro</span>{p.bairro || "—"}</div>
                      <div><span className="text-gray-400 text-xs block">Cidade/UF</span>{p.cidade || "—"}{p.estado ? ` / ${p.estado}` : ""}</div>
                    </div>
                    {(p.numero_pessoas || p.criancas || p.adolescentes || p.adultos || p.idosos) ? (
                      <div>
                        <span className="text-gray-400 text-xs block mb-1">Composição Familiar</span>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {p.numero_pessoas != null && <Badge variant="outline">{p.numero_pessoas} no total</Badge>}
                          {p.criancas != null && p.criancas > 0 && <Badge variant="outline">{p.criancas} crianças</Badge>}
                          {p.adolescentes != null && p.adolescentes > 0 && <Badge variant="outline">{p.adolescentes} adolescentes</Badge>}
                          {p.adultos != null && p.adultos > 0 && <Badge variant="outline">{p.adultos} adultos</Badge>}
                          {p.idosos != null && p.idosos > 0 && <Badge variant="outline">{p.idosos} idosos</Badge>}
                        </div>
                      </div>
                    ) : null}
                    <div className="flex gap-3 text-sm">
                      <span className="text-gray-400 text-xs">CadÚnico: <b className="text-gray-700">{p.tem_cad_unico || "—"}</b></span>
                      <span className="text-gray-400 text-xs">Bolsa Família: <b className="text-gray-700">{p.tem_bolsa_familia || "—"}</b></span>
                      <span className="text-gray-400 text-xs">BPC: <b className="text-gray-700">{p.tem_bpc || "—"}</b></span>
                    </div>
                    {p.demandas && (
                      <div className="bg-amber-50 rounded-lg p-3 text-sm text-gray-700">
                        <span className="font-medium text-amber-700 text-xs block mb-1">Demandas:</span>
                        {p.demandas}
                      </div>
                    )}
                    {p.observacoes && (
                      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                        <span className="font-medium text-gray-500 text-xs block mb-1">Observações:</span>
                        {p.observacoes}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditIdCSF(p.id)} className="gap-1">
                        <Edit2 className="w-3 h-3" /> Editar
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => setConfirmDelete(p.id)}>
                        <Trash2 className="w-3 h-3" /> Remover
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ComprehensiveStudentForm
        open={showCadastroCSF}
        onClose={() => {
          setShowCadastroCSF(false);
          queryClient.invalidateQueries({ queryKey: ["/api/psico/atendidos-comunidade"] });
          queryClient.invalidateQueries({ queryKey: ["/api/psico/todos-atendidos-para-atendimento"] });
        }}
        mode="comunidade"
      />

      <ComprehensiveStudentForm
        open={editIdCSF !== null}
        onClose={() => {
          setEditIdCSF(null);
          queryClient.invalidateQueries({ queryKey: ["/api/psico/atendidos-comunidade"] });
          queryClient.invalidateQueries({ queryKey: ["/api/psico/todos-atendidos-para-atendimento"] });
        }}
        mode="comunidade"
        editId={editIdCSF ?? undefined}
      />

      {confirmDelete !== null && (
        <Dialog open onOpenChange={v => { if (!v) setConfirmDelete(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Remover pessoa?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600">Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => deleteMutation.mutate(confirmDelete!)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Remover
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
