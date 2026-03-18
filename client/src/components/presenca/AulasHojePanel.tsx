import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Clock, UserPlus, Wifi, WifiOff, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCPF } from "@/lib/utils";

interface Presenca {
  cpf: string;
  nome: string;
  check_in_at: string | null;
  check_out_at: string | null;
  fonte: "catraca" | "manual";
  status: string;
}

interface Aula {
  id: number;
  nome: string;
  modulo: string;
  turma_id: number;
  data: string;
  start_time: string;
  end_time: string;
  status: string;
  unidade: string | null;
  total_presentes: number;
  presencas: Presenca[];
}

interface Props {
  modulo: "pec" | "inclusao" | "psico";
  turmaId?: number;
  userId: string;
  participantes?: { cpf: string; nome: string }[];
}

function formatTime(t: string | null) {
  if (!t) return "-";
  return new Date(t).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function AulasHojePanel({ modulo, turmaId, userId, participantes = [] }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedAulaId, setExpandedAulaId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAulaId, setSelectedAulaId] = useState<number | null>(null);
  const [addCpf, setAddCpf] = useState("");
  const [addNome, setAddNome] = useState("");
  const [addStatus, setAddStatus] = useState("presente");

  const queryKey = ["/api/aulas/hoje", modulo, turmaId];

  const { data: aulas = [], isLoading } = useQuery<Aula[]>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ modulo });
      if (turmaId) params.set("turma_id", String(turmaId));
      const res = await fetch(`/api/aulas/hoje?${params}`, { credentials: "include", headers: { "x-user-id": userId } });
      if (!res.ok) throw new Error("Erro ao buscar aulas de hoje");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const addPresencaMutation = useMutation({
    mutationFn: async ({ aulaId, cpf, status }: { aulaId: number; cpf: string; status: string }) => {
      return apiRequest("POST", `/api/aulas/${aulaId}/presencas`, { cpf, status });
    },
    onSuccess: () => {
      toast({ title: "Presença registrada", description: "Aluno marcado manualmente com sucesso." });
      queryClient.invalidateQueries({ queryKey });
      setShowAddModal(false);
      setAddCpf("");
      setAddNome("");
    },
    onError: () => toast({ title: "Erro ao registrar", variant: "destructive" }),
  });

  const handleAddPresenca = () => {
    if (!selectedAulaId) return;
    const cpfDigits = addCpf.replace(/\D/g, "");
    if (cpfDigits.length !== 11) {
      toast({ title: "CPF inválido", description: "Digite um CPF com 11 dígitos.", variant: "destructive" });
      return;
    }
    addPresencaMutation.mutate({ aulaId: selectedAulaId, cpf: cpfDigits, status: addStatus });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
        <Clock className="w-4 h-4 animate-spin" />
        Buscando aulas de hoje...
      </div>
    );
  }

  if (aulas.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-4 border rounded-lg px-4 bg-gray-50">
        <AlertCircle className="w-4 h-4" />
        Nenhuma aula cadastrada na grade para hoje. Verifique a grade horária.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
        <Clock className="w-4 h-4" />
        Aulas de hoje — {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" })}
      </div>

      {aulas.map((aula) => {
        const isExpanded = expandedAulaId === aula.id;
        const catracaCount = aula.presencas.filter(p => p.fonte === "catraca").length;
        const manualCount = aula.presencas.filter(p => p.fonte === "manual").length;

        return (
          <Card key={aula.id} className="border-l-4 border-l-orange-400">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-semibold text-sm">{aula.nome}</div>
                    <div className="text-xs text-gray-500">
                      {aula.start_time?.slice(0, 5)} – {aula.end_time?.slice(0, 5)}
                      {aula.unidade && ` · ${aula.unidade}`}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      aula.status === "finalizada"
                        ? "text-gray-400 border-gray-200"
                        : aula.status === "em_andamento"
                        ? "text-green-600 border-green-300 bg-green-50"
                        : "text-blue-600 border-blue-300 bg-blue-50"
                    }
                  >
                    {aula.status === "finalizada" ? "Finalizada" : aula.status === "em_andamento" ? "Em andamento" : "Aberta"}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-lg font-bold text-orange-600">{aula.total_presentes}</div>
                    <div className="text-xs text-gray-400">presentes</div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedAulaId(aula.id);
                        setShowAddModal(true);
                      }}
                      disabled={aula.status === "finalizada"}
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
                      Adicionar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedAulaId(isExpanded ? null : aula.id)}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Mini badges de fonte */}
              {(catracaCount > 0 || manualCount > 0) && (
                <div className="flex gap-2 mt-1">
                  {catracaCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <Wifi className="w-3 h-3" /> {catracaCount} catraca
                    </span>
                  )}
                  {manualCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-blue-600">
                      <UserPlus className="w-3 h-3" /> {manualCount} manual
                    </span>
                  )}
                </div>
              )}
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0 px-4 pb-3">
                {aula.presencas.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Nenhuma presença registrada ainda.</p>
                ) : (
                  <div className="space-y-1">
                    {aula.presencas.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          {p.fonte === "catraca" ? (
                            <Wifi className="w-3 h-3 text-green-500" />
                          ) : (
                            <UserPlus className="w-3 h-3 text-blue-500" />
                          )}
                          <span className="font-medium">{p.nome}</span>
                          <span className="text-gray-400">{formatCPF(p.cpf)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-500">
                          {p.check_in_at && <span>↓ {formatTime(p.check_in_at)}</span>}
                          {p.check_out_at && <span>↑ {formatTime(p.check_out_at)}</span>}
                          <Badge
                            variant="outline"
                            className={
                              p.status === "presente"
                                ? "text-green-600 border-green-200 bg-green-50 text-xs"
                                : "text-red-600 border-red-200 bg-red-50 text-xs"
                            }
                          >
                            {p.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Modal para adicionar presença manual */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar Presença Manual</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {participantes.length > 0 ? (
              <div>
                <label className="text-xs font-medium text-gray-600">Participante</label>
                <Select
                  value={addCpf}
                  onValueChange={(val) => {
                    const p = participantes.find(x => x.cpf === val);
                    setAddCpf(val);
                    setAddNome(p?.nome || "");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o participante" />
                  </SelectTrigger>
                  <SelectContent>
                    {participantes.map(p => (
                      <SelectItem key={p.cpf} value={p.cpf}>
                        {p.nome} — {formatCPF(p.cpf)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <label className="text-xs font-medium text-gray-600">CPF</label>
                <Input
                  placeholder="000.000.000-00"
                  value={addCpf}
                  onChange={(e) => setAddCpf(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-gray-600">Status</label>
              <Select value={addStatus} onValueChange={setAddStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presente">Presente</SelectItem>
                  <SelectItem value="ausente">Ausente</SelectItem>
                  <SelectItem value="justificativa">Justificativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={handleAddPresenca}
              disabled={addPresencaMutation.isPending || !addCpf}
            >
              {addPresencaMutation.isPending ? "Salvando..." : "Confirmar Presença"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
