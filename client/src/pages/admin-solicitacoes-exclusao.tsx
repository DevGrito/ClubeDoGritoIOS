import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertTriangle,
  Trash2,
  X,
  CheckCircle,
  Clock,
  ArrowLeft,
  Calendar,
  Users,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useLocation } from "wouter";

export default function AdminSolicitacoesExclusao() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [confirmarDialog, setConfirmarDialog] = useState<any | null>(null);
  const [rejeitarDialog, setRejeitarDialog] = useState<any | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "pendente" | "confirmado" | "rejeitado">("pendente");

  const { data: solicitacoes = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/admin/solicitacoes-exclusao"],
    queryFn: async () => {
      const r = await fetch("/api/admin/solicitacoes-exclusao", { credentials: "include" });
      if (!r.ok) throw new Error("Falha ao carregar solicitações");
      return r.json();
    },
  });

  const confirmarMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/admin/solicitacoes-exclusao/${id}/confirmar`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || "Falha ao confirmar");
      }
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Chamada excluída!", description: "A chamada foi excluída com sucesso." });
      setConfirmarDialog(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/solicitacoes-exclusao"] });
    },
    onError: (e: any) => {
      toast({ title: "Erro", description: e.message || "Não foi possível confirmar a exclusão.", variant: "destructive" });
    },
  });

  const rejeitarMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/admin/solicitacoes-exclusao/${id}/rejeitar`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || "Falha ao rejeitar");
      }
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Solicitação rejeitada.", description: "A solicitação foi rejeitada." });
      setRejeitarDialog(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/solicitacoes-exclusao"] });
    },
    onError: (e: any) => {
      toast({ title: "Erro", description: e.message || "Não foi possível rejeitar.", variant: "destructive" });
    },
  });

  const filtered = (solicitacoes as any[]).filter((s) =>
    filtroStatus === "todos" ? true : s.status === filtroStatus
  );

  const pendentes = (solicitacoes as any[]).filter((s) => s.status === "pendente").length;

  const statusBadge = (status: string) => {
    if (status === "pendente") return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pendente</Badge>;
    if (status === "confirmado") return <Badge className="bg-green-100 text-green-700 border-green-200">Confirmado</Badge>;
    if (status === "rejeitado") return <Badge className="bg-red-100 text-red-700 border-red-200">Rejeitado</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  const tipoBadge = (tipo: string) => {
    if (tipo === "pec") return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">PEC</Badge>;
    if (tipo === "inclusao") return <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">Inclusão</Badge>;
    return <Badge variant="outline" className="text-xs">{tipo}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/admin-geral")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-gray-900" />
            Solicitações de Exclusão de Chamadas
          </h1>
          <p className="text-xs text-gray-500">Revise e confirme as solicitações enviadas pelos coordenadores</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-4">
        {/* Filtro de status */}
        <div className="flex gap-2 flex-wrap">
          {(["todos", "pendente", "confirmado", "rejeitado"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                filtroStatus === s
                  ? "bg-gray-800 text-white border-gray-800"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {s === "todos" ? "Todos" : s.charAt(0).toUpperCase() + s.slice(1)}
              {s === "pendente" && pendentes > 0 && (
                <span className="ml-1.5 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendentes}</span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">
            <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-gray-300" />
            Carregando solicitações...
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">
                {filtroStatus === "pendente" ? "Nenhuma solicitação pendente" : "Nenhuma solicitação encontrada"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((sol: any) => (
              <Card key={sol.id} className={sol.status === "pendente" ? "border-amber-200" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {tipoBadge(sol.tipo)}
                      {statusBadge(sol.status)}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      #{sol.id} · {sol.created_at ? new Date(sol.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-"}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="font-medium">
                        {sol.data_chamada ? new Date(sol.data_chamada + "T12:00:00").toLocaleDateString("pt-BR") : "-"}
                      </span>
                      <span className="text-gray-400">—</span>
                      <span>{sol.turma_nome || `Turma ${sol.turma_id}`}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>{sol.presentes}/{sol.total_participantes} presentes</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>Solicitado por: <span className="font-medium">{sol.solicitado_por_nome || "—"}</span></span>
                    </div>
                    {sol.motivo && (
                      <div className="bg-gray-50 rounded p-2 text-gray-600 text-xs">
                        <span className="font-medium">Motivo:</span> {sol.motivo}
                      </div>
                    )}
                    {sol.status !== "pendente" && sol.confirmado_em && (
                      <div className="text-xs text-gray-400">
                        {sol.status === "confirmado" ? "Excluído" : "Rejeitado"} em{" "}
                        {new Date(sol.confirmado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                  </div>

                  {sol.status === "pendente" && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => setConfirmarDialog(sol)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Confirmar Exclusão
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setRejeitarDialog(sol)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Dialog confirmar exclusão */}
      <Dialog open={!!confirmarDialog} onOpenChange={(o) => { if (!o) setConfirmarDialog(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirmar Exclusão de Chamada
            </DialogTitle>
          </DialogHeader>
          {confirmarDialog && (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1 text-sm">
                <div><span className="font-medium">Tipo:</span> {confirmarDialog.tipo === "pec" ? "PEC" : "Inclusão Produtiva"}</div>
                <div><span className="font-medium">Turma:</span> {confirmarDialog.turma_nome}</div>
                <div><span className="font-medium">Data:</span> {confirmarDialog.data_chamada ? new Date(confirmarDialog.data_chamada + "T12:00:00").toLocaleDateString("pt-BR") : "-"}</div>
                <div><span className="font-medium">Presenças:</span> {confirmarDialog.presentes}/{confirmarDialog.total_participantes}</div>
              </div>
              <p className="text-sm text-gray-700 font-medium">
                Esta ação é irreversível. Todos os registros desta chamada serão permanentemente excluídos.
              </p>
              {confirmarDialog.motivo && (
                <p className="text-sm text-gray-500">Motivo: {confirmarDialog.motivo}</p>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmarDialog(null)} disabled={confirmarMutation.isPending}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmarDialog && confirmarMutation.mutate(confirmarDialog.id)}
              disabled={confirmarMutation.isPending}
            >
              {confirmarMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
              Excluir Chamada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog rejeitar */}
      <Dialog open={!!rejeitarDialog} onOpenChange={(o) => { if (!o) setRejeitarDialog(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="w-5 h-5" />
              Rejeitar Solicitação
            </DialogTitle>
          </DialogHeader>
          {rejeitarDialog && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Tem certeza que deseja rejeitar a solicitação de exclusão da chamada de{" "}
                <span className="font-medium">{rejeitarDialog.turma_nome}</span> em{" "}
                <span className="font-medium">
                  {rejeitarDialog.data_chamada ? new Date(rejeitarDialog.data_chamada + "T12:00:00").toLocaleDateString("pt-BR") : "-"}
                </span>?
              </p>
              <p className="text-sm text-gray-500">A chamada será mantida e o coordenador poderá fazer nova solicitação.</p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejeitarDialog(null)} disabled={rejeitarMutation.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => rejeitarDialog && rejeitarMutation.mutate(rejeitarDialog.id)}
              disabled={rejeitarMutation.isPending}
            >
              {rejeitarMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <X className="w-4 h-4 mr-1" />}
              Rejeitar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
