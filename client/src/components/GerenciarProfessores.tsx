import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  Plus, Search, Edit, Trash2, Lock, Eye, EyeOff, Users, GraduationCap, Mail, Phone, X, UserCheck, UserX
} from "lucide-react";

interface GerenciarProfessoresProps {
  programa: 'pec' | 'inclusao_produtiva';
}

export default function GerenciarProfessores({ programa }: GerenciarProfessoresProps) {
  const { toast } = useToast();
  const [busca, setBusca] = useState('');
  const [showCriarModal, setShowCriarModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [showSenhaModal, setShowSenhaModal] = useState(false);
  const [showExcluirDialog, setShowExcluirDialog] = useState(false);
  const [selectedProf, setSelectedProf] = useState<any>(null);
  const [showSenha, setShowSenha] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: ''
  });

  const [editFormData, setEditFormData] = useState({
    nome: '',
    email: '',
    telefone: ''
  });

  const [novaSenha, setNovaSenha] = useState('');

  const programaLabel = programa === 'pec' ? 'PEC' : 'Inclusão Produtiva';

  const { data: professores = [], isLoading } = useQuery({
    queryKey: ['/api/coordenador/professores', programa],
    queryFn: async () => {
      const response = await fetch(`/api/coordenador/professores?programa=${programa}`);
      if (!response.ok) throw new Error('Falha ao carregar professores');
      return response.json();
    },
  });

  const criarMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/coordenador/professores', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      toast({ title: "Professor criado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['/api/coordenador/professores', programa] });
      setShowCriarModal(false);
      setFormData({ nome: '', email: '', senha: '', telefone: '' });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar professor", description: error.message, variant: "destructive" });
    }
  });

  const editarMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/coordenador/professores/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      toast({ title: "Professor atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['/api/coordenador/professores', programa] });
      setShowEditarModal(false);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar professor", description: error.message, variant: "destructive" });
    }
  });

  const alterarSenhaMutation = useMutation({
    mutationFn: async ({ id, novaSenha }: { id: number; novaSenha: string }) => {
      return await apiRequest(`/api/coordenador/professores/${id}/senha`, { method: 'PATCH', body: JSON.stringify({ novaSenha }) });
    },
    onSuccess: () => {
      toast({ title: "Senha alterada com sucesso!" });
      setShowSenhaModal(false);
      setNovaSenha('');
    },
    onError: (error: any) => {
      toast({ title: "Erro ao alterar senha", description: error.message, variant: "destructive" });
    }
  });

  const excluirMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/coordenador/professores/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast({ title: "Professor desativado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['/api/coordenador/professores', programa] });
      setShowExcluirDialog(false);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao desativar professor", description: error.message, variant: "destructive" });
    }
  });

  const profsFiltrados = professores.filter((p: any) => {
    if (!busca) return true;
    const term = busca.toLowerCase();
    return p.nome?.toLowerCase().includes(term) || p.email?.toLowerCase().includes(term);
  });

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-row items-center justify-between w-full">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-500" />
            Gerenciar Professores - {programaLabel}
          </CardTitle>
          <Button className="bg-blue-500 hover:bg-blue-600" onClick={() => {
            setFormData({ nome: '', email: '', senha: '', telefone: '' });
            setShowCriarModal(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Professor
          </Button>
        </div>
        <div className="w-full">
          <Input
            placeholder="Buscar professor por nome ou email..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-gray-500 py-8">Carregando professores...</p>
        ) : profsFiltrados.length === 0 ? (
          <div className="text-center py-8">
            <GraduationCap className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">
              {busca ? 'Nenhum professor encontrado com este filtro.' : 'Nenhum professor cadastrado ainda.'}
            </p>
            {!busca && (
              <Button className="bg-blue-500 hover:bg-blue-600" onClick={() => setShowCriarModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Primeiro Professor
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {profsFiltrados.map((prof: any) => (
              <div key={prof.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{prof.nome}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Mail className="w-3 h-3" /> {prof.email}
                        {prof.telefone && (
                          <>
                            <span className="text-gray-300">|</span>
                            <Phone className="w-3 h-3" /> {prof.telefone}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge className={prof.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {prof.ativo ? (
                      <><UserCheck className="w-3 h-3 mr-1" /> Ativo</>
                    ) : (
                      <><UserX className="w-3 h-3 mr-1" /> Inativo</>
                    )}
                  </Badge>
                </div>
                
                {prof.turmas && prof.turmas.length > 0 && (
                  <div className="mb-3">
                    <span className="text-xs text-gray-500 font-medium">Turmas vinculadas:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {prof.turmas.map((t: any, idx: number) => (
                        <Badge key={idx} className="text-xs bg-blue-500 text-white hover:bg-blue-600">
                          <Users className="w-3 h-3 mr-1" />
                          {t.turma_nome || `Turma #${t.turma_id}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    setSelectedProf(prof);
                    setEditFormData({ nome: prof.nome, email: prof.email, telefone: prof.telefone || '' });
                    setShowEditarModal(true);
                  }}>
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setSelectedProf(prof);
                    setNovaSenha('');
                    setShowSenhaModal(true);
                  }}>
                    <Lock className="w-4 h-4 mr-1" />
                    Alterar Senha
                  </Button>
                  {prof.ativo && (
                    <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => {
                      setSelectedProf(prof);
                      setShowExcluirDialog(true);
                    }}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Desativar
                    </Button>
                  )}
                  {!prof.ativo && (
                    <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50" onClick={() => {
                      editarMutation.mutate({ id: prof.id, data: { ativo: true } });
                    }}>
                      <UserCheck className="w-4 h-4 mr-1" />
                      Reativar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={showCriarModal} onOpenChange={setShowCriarModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar Professor - {programaLabel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome completo *</label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome do professor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="professor@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Senha de acesso *</label>
              <div className="relative">
                <Input
                  type={showSenha ? "text" : "password"}
                  value={formData.senha}
                  onChange={(e) => setFormData(prev => ({ ...prev, senha: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowSenha(!showSenha)}
                >
                  {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telefone</label>
              <Input
                value={formData.telefone}
                onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                placeholder="(31) 99999-9999"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowCriarModal(false)}>Cancelar</Button>
              <Button 
                className="bg-blue-500 hover:bg-blue-600"
                disabled={criarMutation.isPending}
                onClick={() => {
                  criarMutation.mutate({
                    nome: formData.nome,
                    email: formData.email,
                    senha: formData.senha,
                    telefone: formData.telefone || undefined,
                    programa
                  });
                }}
              >
                {criarMutation.isPending ? 'Criando...' : 'Criar Professor'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditarModal} onOpenChange={setShowEditarModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Professor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome completo</label>
              <Input
                value={editFormData.nome}
                onChange={(e) => setEditFormData(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telefone</label>
              <Input
                value={editFormData.telefone}
                onChange={(e) => setEditFormData(prev => ({ ...prev, telefone: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowEditarModal(false)}>Cancelar</Button>
              <Button 
                className="bg-blue-500 hover:bg-blue-600"
                disabled={editarMutation.isPending}
                onClick={() => {
                  if (selectedProf) {
                    editarMutation.mutate({ id: selectedProf.id, data: editFormData });
                  }
                }}
              >
                {editarMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSenhaModal} onOpenChange={setShowSenhaModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Senha - {selectedProf?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nova senha *</label>
              <div className="relative">
                <Input
                  type={showNovaSenha ? "text" : "password"}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowNovaSenha(!showNovaSenha)}
                >
                  {showNovaSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowSenhaModal(false)}>Cancelar</Button>
              <Button 
                className="bg-blue-500 hover:bg-blue-600"
                disabled={alterarSenhaMutation.isPending}
                onClick={() => {
                  if (selectedProf) {
                    alterarSenhaMutation.mutate({ id: selectedProf.id, novaSenha });
                  }
                }}
              >
                {alterarSenhaMutation.isPending ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showExcluirDialog} onOpenChange={setShowExcluirDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar Professor</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar o acesso do professor <strong>{selectedProf?.nome}</strong>? 
              Ele não poderá mais fazer login. Esta ação pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => {
                if (selectedProf) excluirMutation.mutate(selectedProf.id);
              }}
            >
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
