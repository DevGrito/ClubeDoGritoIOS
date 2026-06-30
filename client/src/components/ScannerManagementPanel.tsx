import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, QrCode, Power, PowerOff, Key } from "lucide-react";
import { authFetch } from "@/lib/queryClient";

interface ScannerUser {
  id: number;
  nome: string;
  username: string;
  email: string | null;
  ativo: boolean;
  criado_em: string;
}

async function apiFetch(url: string, opts?: RequestInit) {
  const headers: Record<string, string> = {
    ...(opts?.body ? { "Content-Type": "application/json" } : {}),
    ...((opts?.headers as Record<string, string>) || {}),
  };
  const r = await authFetch(url, { ...opts, headers });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Erro");
  return d;
}

export default function ScannerManagementPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ScannerUser | null>(null);
  const [form, setForm] = useState({ nome: "", username: "", email: "", senha: "" });
  const [changePwdFor, setChangePwdFor] = useState<ScannerUser | null>(null);
  const [newPwd, setNewPwd] = useState("");

  const { data: scanners = [], isLoading } = useQuery<ScannerUser[]>({
    queryKey: ["/api/dev/scanner-usuarios"],
    queryFn: () => apiFetch("/api/dev/scanner-usuarios"),
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof form) =>
      apiFetch("/api/dev/scanner-usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/dev/scanner-usuarios"] });
      setShowForm(false);
      setForm({ nome: "", username: "", email: "", senha: "" });
      toast({ title: "Scanner criado com sucesso!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) =>
      apiFetch(`/api/dev/scanner-usuarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/dev/scanner-usuarios"] });
      setEditing(null);
      setChangePwdFor(null);
      setNewPwd("");
      toast({ title: "Scanner atualizado!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/dev/scanner-usuarios/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/dev/scanner-usuarios"] });
      toast({ title: "Scanner removido." });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ nome: "", username: "", email: "", senha: "" });
    setShowForm(true);
  };

  const openEdit = (s: ScannerUser) => {
    setEditing(s);
    setForm({ nome: s.nome, username: s.username, email: s.email || "", senha: "" });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.nome.trim() || !form.username.trim()) {
      toast({ title: "Nome e username são obrigatórios", variant: "destructive" });
      return;
    }
    if (!editing && !form.senha.trim()) {
      toast({ title: "Senha obrigatória para novo scanner", variant: "destructive" });
      return;
    }
    const body: any = { nome: form.nome, username: form.username, email: form.email || undefined };
    if (form.senha) body.senha = form.senha;
    if (editing) {
      updateMutation.mutate({ id: editing.id, body });
    } else {
      createMutation.mutate({ ...body, senha: form.senha });
    }
  };

  const handleToggleAtivo = (s: ScannerUser) => {
    updateMutation.mutate({ id: s.id, body: { ativo: !s.ativo } });
  };

  const handleChangePwd = () => {
    if (!newPwd.trim() || newPwd.length < 6) {
      toast({ title: "Senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    updateMutation.mutate({ id: changePwdFor!.id, body: { senha: newPwd } });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Usuários do Scanner</h2>
            <p className="text-sm text-gray-500">Gerencie quem pode acessar o scanner de ingressos</p>
          </div>
        </div>
        <Button onClick={openCreate} className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Scanner
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-700">{scanners.filter(s => s.ativo).length}</div>
            <div className="text-sm text-green-600 font-medium">Ativos</div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-gray-600">{scanners.length}</div>
            <div className="text-sm text-gray-500 font-medium">Total</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lista de Scanners</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : scanners.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <QrCode className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum scanner cadastrado. Clique em "Novo Scanner" para começar.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {scanners.map(s => (
                <div key={s.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${s.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {s.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{s.nome}</div>
                      <div className="text-xs text-gray-500">@{s.username}{s.email && ` · ${s.email}`}</div>
                    </div>
                    <Badge variant={s.ativo ? "default" : "secondary"} className={s.ativo ? "bg-green-100 text-green-700 border-green-200" : ""}>
                      {s.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setChangePwdFor(s)} className="flex items-center gap-1 text-xs">
                      <Key className="w-3 h-3" />
                      Senha
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(s)} className="flex items-center gap-1 text-xs">
                      <Edit className="w-3 h-3" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleAtivo(s)}
                      className={s.ativo ? "text-orange-600 border-orange-200 hover:bg-orange-50" : "text-green-600 border-green-200 hover:bg-green-50"}
                    >
                      {s.ativo ? <PowerOff className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { if (confirm(`Remover scanner "${s.nome}"?`)) deleteMutation.mutate(s.id); }}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Scanner" : "Novo Scanner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nome *</label>
              <Input
                placeholder="Ex: Scanner Entrada 1"
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Username *</label>
              <Input
                placeholder="Ex: scanner1"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                autoCapitalize="none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">E-mail (opcional)</label>
              <Input
                type="email"
                placeholder="scanner@institutoogrito.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            {!editing && (
              <div>
                <label className="text-sm font-medium text-gray-700">Senha *</label>
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={form.senha}
                  onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                />
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancelar</Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {createMutation.isPending || updateMutation.isPending ? "Salvando..." : editing ? "Salvar" : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={!!changePwdFor} onOpenChange={v => { if (!v) { setChangePwdFor(null); setNewPwd(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar Senha — {changePwdFor?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nova senha</label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setChangePwdFor(null); setNewPwd(""); }} className="flex-1">Cancelar</Button>
              <Button
                onClick={handleChangePwd}
                disabled={updateMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {updateMutation.isPending ? "Salvando..." : "Alterar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
