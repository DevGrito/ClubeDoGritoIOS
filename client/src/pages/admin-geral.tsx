import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Settings, 
  UserPlus, 
  UserMinus, 
  Users, 
  FileText, 
  BarChart3, 
  Shield,
  CreditCard,
  Database,
  Activity,
  Lock
} from "lucide-react";
import { useLocation } from "wouter";
import Logo from "@/components/logo";
import BottomNav from "@/components/bottom-nav";
import { adminEmails, isAdminEmail, getConselhoStats } from "@shared/conselho";
import { useToast } from "@/hooks/use-toast";

export default function AdminGeral() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const nome = localStorage.getItem("userName") || "Administrador";
    const email = localStorage.getItem("userEmail") || "";
    const papel = localStorage.getItem("userPapel") || "";
    
    setUserName(nome);
    setUserEmail(email);
    
    // Check if user is admin based on role from phone verification or email
    setIsAdmin(papel === "admin" || isAdminEmail(email));
    setStats(getConselhoStats());
  }, []);

  const adminActions = [
    { 
      name: "Criar Página", 
      icon: FileText, 
      color: "bg-blue-500 hover:bg-blue-600",
      description: "Criar novas páginas do sistema"
    },
    { 
      name: "Adicionar Usuário", 
      icon: UserPlus, 
      color: "bg-green-500 hover:bg-green-600",
      description: "Adicionar novos usuários"
    },
    { 
      name: "Remover Usuário", 
      icon: UserMinus, 
      color: "bg-red-500 hover:bg-red-600",
      description: "Remover usuários existentes"
    },
    { 
      name: "Gerenciar Perfis", 
      icon: Users, 
      color: "bg-purple-500 hover:bg-purple-600",
      description: "Gerenciar perfis de usuários"
    },
    { 
      name: "Editar Conteúdos", 
      icon: FileText, 
      color: "bg-yellow-500 hover:bg-yellow-600",
      description: "Editar conteúdos do sistema"
    },
    { 
      name: "Gerenciar Gráficos", 
      icon: BarChart3, 
      color: "bg-indigo-500 hover:bg-indigo-600",
      description: "Configurar dashboards e gráficos"
    },
    { 
      name: "Ver Logs do Sistema", 
      icon: Activity, 
      color: "bg-gray-500 hover:bg-gray-600",
      description: "Visualizar logs e atividades"
    },
    { 
      name: "Gerenciar Assinaturas", 
      icon: CreditCard, 
      color: "bg-pink-500 hover:bg-pink-600",
      description: "Gerenciar planos e assinaturas"
    }
  ];

  const handleActionClick = (actionName: string) => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: `${actionName} será implementado em breve.`,
    });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white shadow-sm border-b border-gray-100">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/perfil")}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-bold text-black">Administração</h1>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="mb-4">
                <Lock className="w-16 h-16 mx-auto text-red-500 mb-4" />
                <Logo size="md" className="mx-auto mb-4" />
              </div>
              <h2 className="text-xl font-bold text-black mb-3">
                Acesso Negado
              </h2>
              <p className="text-gray-600 mb-4">
                Esta área é exclusiva para administradores do sistema Clube do Grito.
              </p>
              <Badge variant="destructive" className="mb-4">
                Acesso Administrativo Necessário
              </Badge>
              <p className="text-sm text-gray-500">
                Apenas usuários com permissões administrativas podem acessar esta seção.
              </p>
            </CardContent>
          </Card>
        </main>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/perfil")}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-black">Administração</h1>
          </div>
          <Badge className="bg-red-100 text-red-800">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Welcome */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Logo size="md" className="mx-auto mb-3" />
              <h2 className="text-xl font-bold text-black mb-2">
                Bem-vindo(a), {userName.split(' ')[0]}
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                Você tem acesso completo ao sistema
              </p>
              <Badge className="bg-red-100 text-red-800">
                <Shield className="w-3 h-3 mr-1" />
                Administrador
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* System Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Estatísticas do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Membros do Conselho:</span>
                <Badge variant="outline">{stats?.totalMembers || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Administradores:</span>
                <Badge variant="outline">{adminEmails.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Último Acesso:</span>
                <span className="text-sm text-black">
                  {new Date().toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Admin Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-black flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Ações Administrativas
          </h3>
          
          <div className="grid grid-cols-1 gap-3">
            {adminActions.map((action) => (
              <Card 
                key={action.name} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleActionClick(action.name)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center text-white transition-colors`}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-black text-sm">
                        {action.name}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Security Notice */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800 text-sm">
                  Aviso de Segurança
                </h4>
                <p className="text-xs text-yellow-700 mt-1">
                  Todas as ações administrativas são registradas e monitoradas. 
                  Use suas permissões com responsabilidade.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}