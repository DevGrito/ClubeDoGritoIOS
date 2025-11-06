import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUserData } from "@/hooks/useUserData";
import { useProfileImage } from "@/hooks/useProfileImage";
import Logo from "@/components/logo";
import BottomNavigation from "@/components/bottom-navigation";
import { UserAvatar } from "@/components/UserAvatar";
import perfilIcon from "@assets/image_1755890526622.png";
import beneficiosIcon from "@assets/image_1755890654323.png";
import financeiroIcon from "@assets/image_1755890729556.png";
import termosIcon from "@assets/image_1755890775086.png";

import { 
  Menu, UserCircle, FileText, Clock, Shield, LogOut, ChevronRight
} from "lucide-react";

export default function CentralAjuda() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { userData } = useUserData();
  const { profileImage } = useProfileImage();

  const getPlanDisplayName = (plano: string) => {
    const planNames = {
      eco: "Eco",
      voz: "Voz", 
      grito: "O Grito",
      platinum: "Platinum"
    };
    return planNames[plano as keyof typeof planNames] || "Eco";
  };


  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0] || fullName;
  };

  const handlePerfil = () => {
    // Delay para permitir animação de saída
    setTimeout(() => {
      setLocation("/perfil");
    }, 150);
  };

  const handleBeneficios = () => {
    // Delay para permitir animação de saída
    setTimeout(() => {
      setLocation("/beneficios");
    }, 150);
  };

  const handleFinanceiro = () => {
    // Delay para permitir animação de saída
    setTimeout(() => {
      setLocation("/pagamentos?from=help");
    }, 150);
  };

  const handleTermosDeUso = () => {
    // Delay para permitir animação de saída
    setTimeout(() => {
      setLocation('/termos-servicos?from=help');
    }, 150);
  };

  const handleDeslogar = () => {
    toast({
      title: "Saindo da conta",
      description: "Você será desconectado...",
    });
    
    // Clear all storage completely
    localStorage.clear();
    sessionStorage.clear();
    
    // Force full page reload to login page after a short delay
    setTimeout(() => {
      window.location.href = "/entrar";
    }, 1000);
  };

  const menuItems = [
    {
      id: "perfil",
      title: "Perfil",
      description: "Mostre quem você é nessa jornada.",
      icon: UserCircle,
      onClick: handlePerfil
    },
    {
      id: "beneficios", 
      title: "Benefícios",
      description: "Vantagens que transformam seu dia a dia e o de muitos outros.",
      icon: FileText,
      onClick: handleBeneficios
    },
    {
      id: "financeiro",
      title: "Financeiro", 
      description: "Transparência para você ver seu impacto.",
      icon: Clock,
      onClick: handleFinanceiro
    },
    {
      id: "termos",
      title: "Termos de Uso",
      description: "Segurança e clareza em cada passo.",
      icon: Shield,
      onClick: handleTermosDeUso
    },
    {
      id: "deslogar",
      title: "Deslogar",
      description: "Saindo agora, mas seu impacto continua.", 
      icon: LogOut,
      onClick: handleDeslogar
    }
  ];

  return (
    <div className="min-h-screen bg-white pb-20 font-inter">
      {/* Header */}
      <header className="bg-white">
        <div className="px-4 py-3 flex items-center">
          {/* Elemento da Esquerda: Menu Hamburger */}
          <div className="w-16 flex justify-start">
            <button className="flex flex-col space-y-1 p-2 items-start">
              <div className="w-6 h-0.5 bg-gray-700"></div>
              <div className="w-4 h-0.5 bg-gray-700"></div>
              <div className="w-6 h-0.5 bg-gray-700"></div>
            </button>
          </div>
          
          {/* Elemento Central: Logo */}
          <div className="flex-1 flex justify-center">
            <Logo size="md" />
          </div>
          
          {/* Elemento da Direita: Perfil do Usuário */}
          <div className="w-16 flex justify-end">
            <div className="flex flex-col items-center">
              {/* Foto de Perfil Circular */}
              <div className="mb-1">
                <UserAvatar 
                  size="md"
                  className="border-2 border-gray-200"
                  clickable={false}
                />
              </div>
              {/* Badge do Plano */}
              <div className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full flex items-center space-x-1">
                <span>{getPlanDisplayName(userData?.plano || "eco")}</span>
                <span className="text-orange-500">◆</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-4 md:px-8 md:py-8">
        <div className="space-y-4">
            {/* Saudação */}
            <div>
              <h1 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                Fala {getFirstName(userData?.nome || "Usuário")}, tudo bem?
              </h1>
            </div>

            {/* Menu Items - SEM cards aninhados */}
            <div className="space-y-4 -mx-6">
              {menuItems.map((item, index) => (
                <div key={item.id}>
                  <div
                    className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                    onClick={item.onClick}
                  >
                    {/* Ícone com fundo amarelo ou branco dependendo do tipo */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${item.id === "deslogar" ? "bg-white" : "bg-yellow-400"}`}>
                      {item.id === "perfil" ? (
                        <img src={perfilIcon} alt="Perfil" className="w-6 h-6" />
                      ) : item.id === "beneficios" ? (
                        <img src={beneficiosIcon} alt="Benefícios" className="w-6 h-6" />
                      ) : item.id === "financeiro" ? (
                        <img src={financeiroIcon} alt="Financeiro" className="w-6 h-6" />
                      ) : item.id === "termos" ? (
                        <img src={termosIcon} alt="Termos de Uso" className="w-6 h-6" />
                      ) : (
                        <item.icon className="w-6 h-6 text-gray-900" />
                      )}
                    </div>
                    
                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                        {item.description}
                      </p>
                    </div>
                    
                    {/* Seta */}
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                  {/* Separador entre itens (menos no último) */}
                  {index < menuItems.length - 1 && (
                    <div className="border-b border-gray-100 mx-4"></div>
                  )}
                </div>
              ))}
            </div>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
}