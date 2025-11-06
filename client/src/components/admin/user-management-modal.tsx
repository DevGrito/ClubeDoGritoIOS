import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, Search, Edit, Trash2, UserCheck, UserX } from "lucide-react";

interface User {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  papel: string;
  isVerified: boolean;
  createdAt: string;
}

export default function UserManagementModal() {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("GET", "/api/admin/users");
      const userData = await response.json();
      setUsers(userData);
      setFilteredUsers(userData);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  useEffect(() => {
    const filtered = users.filter(user => 
      user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.telefone.includes(searchTerm)
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleToggleVerification = async (userId: number, currentStatus: boolean) => {
    try {
      await apiRequest("POST", `/api/admin/users/${userId}/toggle-verification`, {
        isVerified: !currentStatus
      });
      
      toast({
        title: "Usuário atualizado",
        description: `Verificação ${!currentStatus ? 'ativada' : 'desativada'} com sucesso.`,
      });
      
      loadUsers();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o usuário.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${userName}?`)) {
      return;
    }

    try {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
      
      toast({
        title: "Usuário excluído",
        description: `${userName} foi removido do sistema.`,
      });
      
      loadUsers();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o usuário.",
        variant: "destructive",
      });
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      leo: "bg-yellow-100 text-yellow-800",
      admin: "bg-red-100 text-red-800",
      conselho: "bg-blue-100 text-blue-800",
      professor: "bg-green-100 text-green-800",
      aluno: "bg-purple-100 text-purple-800",
      colaborador: "bg-gray-100 text-gray-800",
      patrocinador: "bg-orange-100 text-orange-800",
      user: "bg-slate-100 text-slate-800"
    };
    return colors[role as keyof typeof colors] || colors.user;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-yellow-400">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-500 hover:bg-gray-600 rounded-lg flex items-center justify-center text-white">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-black text-sm">
                  Gerenciar Usuários
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  Gerenciar todos os usuários do sistema
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Gerenciar Usuários</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-gray-600 mt-2">Carregando usuários...</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-sm">{user.nome}</h4>
                        <Badge className={getRoleColor(user.papel)}>
                          {user.papel}
                        </Badge>
                        {user.isVerified && (
                          <Badge variant="outline" className="text-green-600">
                            Verificado
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500">{user.telefone}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleVerification(user.id, user.isVerified)}
                        className="h-8 px-2"
                      >
                        {user.isVerified ? (
                          <UserX className="w-3 h-3" />
                        ) : (
                          <UserCheck className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteUser(user.id, user.nome)}
                        className="h-8 px-2"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              {filteredUsers.length === 0 && !isLoading && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}