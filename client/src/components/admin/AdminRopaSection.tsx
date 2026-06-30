import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Shield, RefreshCw, Database } from "lucide-react";

const EMPTY_ENTRY = {
  area: "", dados_coletados: "", titular: "", finalidade: "",
  base_legal: "", sistema: "", compartilha_com: "", retencao: "",
  medidas_seguranca: "", responsavel: "",
};

const FIELDS: { key: keyof typeof EMPTY_ENTRY; label: string; multi?: boolean }[] = [
  { key: "area", label: "Área *" },
  { key: "dados_coletados", label: "Dados Coletados *", multi: true },
  { key: "titular", label: "Titular dos Dados" },
  { key: "finalidade", label: "Finalidade", multi: true },
  { key: "base_legal", label: "Base Legal" },
  { key: "sistema", label: "Sistema de Armazenamento" },
  { key: "compartilha_com", label: "Compartilhado Com" },
  { key: "retencao", label: "Tempo de Retenção" },
  { key: "medidas_seguranca", label: "Medidas de Segurança", multi: true },
  { key: "responsavel", label: "Responsável" },
];

export default function AdminRopaSection() {
  const { toast } = useToast();
  const [editDialog, setEditDialog] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isNew, setIsNew] = useState(false);

  const { data: entries = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/admin/ropa"],
    queryFn: async () => {
      const r = await fetch("/api/admin/ropa", { credentials: "include" });
      if (!r.ok) throw new Error("Erro ao carregar ROPA");
      return r.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (entry: any) => {
      if (isNew) {
        return apiRequest("/api/admin/ropa", { method: "POST", body: JSON.stringify(entry) });
      }
      return apiRequest(`/api/admin/ropa/${entry.id}`, { method: "PATCH", body: JSON.stringify(entry) });
    },
    onSuccess: () => {
      toast({ title: isNew ? "Entrada criada!" : "Atualizado!" });
      setEditDialog(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ropa"] });
    },
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) =>
      apiRequest(`/api/admin/ropa/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "Entrada removida" });
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ropa"] });
    },
    onError: () => toast({ title: "Erro ao remover", variant: "destructive" }),
  });

  const openNew = () => { setIsNew(true); setEditDialog({ ...EMPTY_ENTRY }); };
  const openEdit = (e: any) => { setIsNew(false); setEditDialog({ ...e }); };

  const handleSave = () => {
    if (!editDialog?.area?.trim() || !editDialog?.dados_coletados?.trim()) {
      toast({ title: "Área e Dados Coletados são obrigatórios", variant: "destructive" });
      return;
    }
    saveMutation.mutate(editDialog);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500">LGPD</p>
          <h2 className="text-xl font-bold text-gray-900">ROPA — Registro de Atividades de Tratamento</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" onClick={openNew} className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
            <Plus className="w-4 h-4 mr-1" /> Nova entrada
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Registro de Operações de Tratamento (Art. 30 GDPR / LGPD)</p>
          <p className="text-xs text-blue-600 mt-1">
            Este registro documenta todas as atividades de tratamento de dados pessoais realizadas pela instituição.
            Mantenha sempre atualizado para conformidade regulatória.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma entrada encontrada.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {entries.map((entry: any) => (
            <Card key={entry.id} className="overflow-hidden">
              <CardHeader className="pb-2 bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-gray-900">{entry.area}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(entry)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(entry.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <RopaCell label="Dados Coletados" value={entry.dados_coletados} />
                  <RopaCell label="Titular" value={entry.titular} />
                  <RopaCell label="Finalidade" value={entry.finalidade} />
                  <RopaCell label="Base Legal" value={entry.base_legal} highlight />
                  <RopaCell label="Sistema" value={entry.sistema} />
                  <RopaCell label="Compartilha com" value={entry.compartilha_com} />
                  <RopaCell label="Retenção" value={entry.retencao} />
                  <RopaCell label="Segurança" value={entry.medidas_seguranca} />
                  <RopaCell label="Responsável" value={entry.responsavel} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? "Nova entrada ROPA" : "Editar entrada"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {FIELDS.map((f) => (
              <div key={f.key} className="space-y-1">
                <Label className="text-xs font-semibold text-gray-600">{f.label}</Label>
                {f.multi ? (
                  <Textarea
                    value={editDialog?.[f.key] || ""}
                    onChange={(e) => setEditDialog((prev: any) => ({ ...prev, [f.key]: e.target.value }))}
                    rows={2}
                    className="text-sm"
                  />
                ) : (
                  <Input
                    value={editDialog?.[f.key] || ""}
                    onChange={(e) => setEditDialog((prev: any) => ({ ...prev, [f.key]: e.target.value }))}
                    className="text-sm"
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar remoção</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Tem certeza que deseja remover esta entrada do ROPA?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteId!)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Removendo..." : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RopaCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  if (!value) return null;
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-sm ${highlight ? "font-semibold text-blue-700" : "text-gray-700"}`}>{value}</p>
    </div>
  );
}
