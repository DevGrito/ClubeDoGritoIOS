import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import AlterarSenhaMarketing from "@/components/AlterarSenhaMarketing";
import { 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Shield,
  TrendingUp,
  Target,
  Mail,
  ExternalLink
} from "lucide-react";

export default function MarketingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showAlterarSenhaModal, setShowAlterarSenhaModal] = useState(false);
  
  // Obter dados do usuário do localStorage
  const userName = localStorage.getItem("userName") || "Marketing";
  const userEmail = localStorage.getItem("userEmail") || "";

  const handleLogout = () => {
    // Limpar dados de autenticação
    localStorage.clear();
    sessionStorage.clear();
    
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    
    setLocation("/login/marketing");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Painel de Marketing
                  </h1>
                  <p className="text-sm text-gray-600">
                    Olá, {userName}!
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAlterarSenhaModal(true)}
                className="flex items-center gap-2"
                data-testid="button-alterar-senha-marketing"
              >
                <Shield className="w-4 h-4" />
                Alterar Senha
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://complaint-tracker-OGRITO.replit.app', '_blank')}
                className="flex items-center gap-2 bg-yellow-400 text-black hover:bg-yellow-500 border-yellow-400"
                data-testid="button-transparencia-marketing"
              >
                <ExternalLink className="w-4 h-4" />
                Canal de Transparência
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600 hover:bg-red-50"
                data-testid="button-logout-marketing"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card de Boas-vindas */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-yellow-600" />
                Bem-vindo ao Painel de Marketing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Aqui você pode gerenciar campanhas, visualizar métricas de engajamento e acompanhar o desempenho das iniciativas de marketing social do Instituto O Grito.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="outline" className="bg-yellow-50">
                  Email: {userEmail}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Card de Campanhas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="w-5 h-5 text-yellow-600" />
                Campanhas Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-3xl font-bold text-gray-900">-</p>
                <p className="text-sm text-gray-600 mt-2">Campanhas em andamento</p>
              </div>
            </CardContent>
          </Card>

          {/* Card de Métricas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="w-5 h-5 text-yellow-600" />
                Métricas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-3xl font-bold text-gray-900">-</p>
                <p className="text-sm text-gray-600 mt-2">Relatórios disponíveis</p>
              </div>
            </CardContent>
          </Card>

          {/* Card de Engajamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
                Engajamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-3xl font-bold text-gray-900">-</p>
                <p className="text-sm text-gray-600 mt-2">Taxa de engajamento</p>
              </div>
            </CardContent>
          </Card>

          {/* Card de Configurações */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-yellow-600" />
                Configurações da Conta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Segurança</p>
                      <p className="text-sm text-gray-600">Altere sua senha regularmente para maior segurança</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAlterarSenhaModal(true)}
                    data-testid="button-alterar-senha-card-marketing"
                  >
                    Alterar Senha
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal de Alterar Senha */}
      <AlterarSenhaMarketing 
        open={showAlterarSenhaModal}
        onOpenChange={setShowAlterarSenhaModal}
      />
    </div>
  );
}
