import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2, Users, GraduationCap, UserCheck, Briefcase, Eye, EyeOff } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TeamMember {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  programa?: string;
  setor?: string;
  ativo: boolean;
  data_admissao?: string;
  data_desligamento?: string;
  created_at?: string;
}

interface FormData {
  nome: string;
  email: string;
  senha: string;
  telefone: string;
  programa: string;
  ativo: boolean;
}

const programaLabels: Record<string, string> = {
  pec: 'PEC',
  inclusao_produtiva: 'Inclusão Produtiva',
  psicossocial: 'Psicossocial',
  esporte_cultura: 'Esporte e Cultura',
};

const programaColors: Record<string, string> = {
  pec: 'bg-blue-100 text-blue-800',
  inclusao_produtiva: 'bg-green-100 text-green-800',
  psicossocial: 'bg-purple-100 text-purple-800',
  esporte_cultura: 'bg-orange-100 text-orange-800',
};

const getProjectField = (member: TeamMember, isCoordinator: boolean) => {
  return isCoordinator ? member.setor : member.programa;
};

function TeamTable({ 
  data, 
  isLoading, 
  onEdit, 
  onDelete,
  type,
  isCoordinator = false
}: { 
  data: TeamMember[]; 
  isLoading: boolean; 
  onEdit: (member: TeamMember) => void;
  onDelete: (member: TeamMember) => void;
  type: string;
  isCoordinator?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum {type} cadastrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left p-3 font-semibold text-gray-700">Nome</th>
            <th className="text-left p-3 font-semibold text-gray-700">Email</th>
            <th className="text-left p-3 font-semibold text-gray-700">Telefone</th>
            <th className="text-left p-3 font-semibold text-gray-700">Projeto</th>
            <th className="text-left p-3 font-semibold text-gray-700">Status</th>
            <th className="text-right p-3 font-semibold text-gray-700">Ações</th>
          </tr>
        </thead>
        <tbody>
          {data.map((member) => (
            <tr key={member.id} className="border-b hover:bg-gray-50">
              <td className="p-3 font-medium">{member.nome}</td>
              <td className="p-3 text-gray-600">{member.email}</td>
              <td className="p-3 text-gray-600">{member.telefone || '-'}</td>
              <td className="p-3">
                {(() => {
                  const projectValue = getProjectField(member, isCoordinator) || '';
                  return (
                    <Badge className={programaColors[projectValue] || 'bg-gray-100 text-gray-800'}>
                      {programaLabels[projectValue] || projectValue}
                    </Badge>
                  );
                })()}
              </td>
              <td className="p-3">
                <Badge variant={member.ativo ? 'default' : 'secondary'}>
                  {member.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </td>
              <td className="p-3 text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(member)}
                    data-testid={`btn-edit-${type}-${member.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(member)}
                    data-testid={`btn-delete-${type}-${member.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TeamForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  isEditing,
  isPending,
  type,
  isCoordinator = false
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (data: any) => void;
  initialData?: TeamMember | null;
  isEditing: boolean;
  isPending: boolean;
  type: string;
  isCoordinator?: boolean;
}) {
  const getInitialProgramValue = () => {
    if (isCoordinator) {
      return initialData?.setor || 'psicossocial';
    }
    return initialData?.programa || 'pec';
  };

  const [formData, setFormData] = useState<FormData>({
    nome: initialData?.nome || '',
    email: initialData?.email || '',
    senha: '',
    telefone: initialData?.telefone || '',
    programa: getInitialProgramValue(),
    ativo: initialData?.ativo ?? true,
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCoordinator) {
      const { programa, ...rest } = formData;
      onSubmit({ ...rest, setor: programa });
    } else {
      onSubmit(formData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Editar ${type}` : `Novo ${type}`}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize os dados abaixo' : 'Preencha os dados para criar um novo usuário'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Nome completo"
              required
              data-testid="input-nome"
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
              required
              data-testid="input-email"
            />
          </div>

          <div>
            <Label htmlFor="senha">
              Senha {isEditing ? '(deixe em branco para manter)' : '*'}
            </Label>
            <div className="relative">
              <Input
                id="senha"
                type={showPassword ? 'text' : 'password'}
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                placeholder={isEditing ? 'Nova senha (opcional)' : 'Senha'}
                required={!isEditing}
                data-testid="input-senha"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="(00) 00000-0000"
              data-testid="input-telefone"
            />
          </div>

          <div>
            <Label htmlFor="programa">{isCoordinator ? 'Setor' : 'Projeto'} *</Label>
            <Select
              value={formData.programa}
              onValueChange={(value) => setFormData({ ...formData, programa: value })}
            >
              <SelectTrigger data-testid="select-programa">
                <SelectValue placeholder={isCoordinator ? 'Selecione o setor' : 'Selecione o projeto'} />
              </SelectTrigger>
              <SelectContent>
                {isCoordinator ? (
                  <>
                    <SelectItem value="psicossocial">Psicossocial</SelectItem>
                    <SelectItem value="esporte_cultura">Esporte e Cultura</SelectItem>
                    <SelectItem value="inclusao_produtiva">Inclusão Produtiva</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="pec">PEC</SelectItem>
                    <SelectItem value="inclusao_produtiva">Inclusão Produtiva</SelectItem>
                    <SelectItem value="psicossocial">Psicossocial</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {isEditing && (
            <div className="flex items-center justify-between">
              <Label htmlFor="ativo">Status Ativo</Label>
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                data-testid="switch-ativo"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1" data-testid="btn-submit-form">
              {isPending ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TeamSection({ 
  endpoint, 
  title, 
  icon: Icon,
  type,
  isCoordinator = false
}: { 
  endpoint: string; 
  title: string; 
  icon: any;
  type: string;
  isCoordinator?: boolean;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);

  const { data, isLoading } = useQuery<TeamMember[]>({
    queryKey: [endpoint],
  });

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest(endpoint, { method: 'POST', body: JSON.stringify(formData) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      toast({ title: `${title} criado com sucesso!` });
      setIsFormOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro ao criar', 
        description: error.message || 'Tente novamente',
        variant: 'destructive' 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...formData }: FormData & { id: number }) => {
      return apiRequest(`${endpoint}/${id}`, { method: 'PATCH', body: JSON.stringify(formData) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      toast({ title: `${title} atualizado com sucesso!` });
      setEditingMember(null);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro ao atualizar', 
        description: error.message || 'Tente novamente',
        variant: 'destructive' 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`${endpoint}/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      toast({ title: `${title} removido com sucesso!` });
      setDeletingMember(null);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro ao remover', 
        description: error.message || 'Tente novamente',
        variant: 'destructive' 
      });
    },
  });

  const handleCreate = (formData: FormData) => {
    createMutation.mutate(formData);
  };

  const handleUpdate = (formData: FormData) => {
    if (editingMember) {
      updateMutation.mutate({ ...formData, id: editingMember.id });
    }
  };

  const handleDelete = () => {
    if (deletingMember) {
      deleteMutation.mutate(deletingMember.id);
    }
  };

  const getFieldValue = (m: TeamMember) => isCoordinator ? m.setor : m.programa;
  
  const stats = {
    total: data?.length || 0,
    ativos: data?.filter(m => m.ativo).length || 0,
    pec: data?.filter(m => getFieldValue(m) === 'pec' || getFieldValue(m) === 'esporte_cultura').length || 0,
    inclusao: data?.filter(m => getFieldValue(m) === 'inclusao_produtiva').length || 0,
    psico: data?.filter(m => getFieldValue(m) === 'psicossocial').length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Icon className="w-8 h-8 text-blue-600" />
          <div>
            <h3 className="text-xl font-bold">{title}s</h3>
            <p className="text-gray-600 text-sm">Gerencie os {title.toLowerCase()}s do instituto</p>
          </div>
        </div>
        <Button onClick={() => setIsFormOpen(true)} data-testid={`btn-new-${type}`}>
          <Plus className="w-4 h-4 mr-2" />
          Novo {title}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-gray-600">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.ativos}</p>
            <p className="text-sm text-gray-600">Ativos</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.pec}</p>
            <p className="text-sm text-gray-600">{isCoordinator ? 'Esporte' : 'PEC'}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.inclusao}</p>
            <p className="text-sm text-gray-600">Inclusão</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.psico}</p>
            <p className="text-sm text-gray-600">Psico</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <TeamTable
            data={data || []}
            isLoading={isLoading}
            onEdit={(member) => setEditingMember(member)}
            onDelete={(member) => setDeletingMember(member)}
            type={type}
            isCoordinator={isCoordinator}
          />
        </CardContent>
      </Card>

      <TeamForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreate}
        isEditing={false}
        isPending={createMutation.isPending}
        type={title}
        isCoordinator={isCoordinator}
      />

      <TeamForm
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
        onSubmit={handleUpdate}
        initialData={editingMember}
        isEditing={true}
        isPending={updateMutation.isPending}
        type={title}
        isCoordinator={isCoordinator}
      />

      <AlertDialog open={!!deletingMember} onOpenChange={() => setDeletingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{deletingMember?.nome}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function TeamManagementSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-7 h-7 text-indigo-600" />
          Gestão de Equipe
        </h2>
        <p className="text-gray-600">Gerencie professores, monitores e coordenadores do instituto</p>
      </div>

      <Tabs defaultValue="professores" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="professores" className="flex items-center gap-2" data-testid="tab-professores">
            <GraduationCap className="w-4 h-4" />
            Professores
          </TabsTrigger>
          <TabsTrigger value="monitores" className="flex items-center gap-2" data-testid="tab-monitores">
            <UserCheck className="w-4 h-4" />
            Monitores
          </TabsTrigger>
          <TabsTrigger value="coordenadores" className="flex items-center gap-2" data-testid="tab-coordenadores">
            <Briefcase className="w-4 h-4" />
            Coordenadores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="professores" className="mt-6">
          <TeamSection 
            endpoint="/api/dev/professores" 
            title="Professor" 
            icon={GraduationCap}
            type="professor"
          />
        </TabsContent>

        <TabsContent value="monitores" className="mt-6">
          <TeamSection 
            endpoint="/api/dev/monitores" 
            title="Monitor" 
            icon={UserCheck}
            type="monitor"
          />
        </TabsContent>

        <TabsContent value="coordenadores" className="mt-6">
          <TeamSection 
            endpoint="/api/dev/coordenadores" 
            title="Coordenador" 
            icon={Briefcase}
            type="coordenador"
            isCoordinator={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
