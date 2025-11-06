import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "@/components/logo";
import { CompanyAvatar } from "@/components/CompanyAvatar";
import BottomNavigation from "@/components/bottom-navigation";
import { 
  LogOut, 
  Building2, 
  Settings, 
  Phone, 
  Mail, 
  Info, 
  FileText,
  ChevronRight,
  Menu,
  User,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";

export default function PerfilPatrocinador() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  
  const userId = Number(localStorage.getItem("userId"));
  const userName = localStorage.getItem("userName") || "Empresa";
  const userEmail = localStorage.getItem("userEmail") || "";
  const userPhone = localStorage.getItem("userTelefone") || "";

  const handleLogout = () => {
    toast({
      title: "Saindo da conta",
      description: "Você será desconectado...",
    });
    
    localStorage.clear();
    sessionStorage.clear();
    
    setTimeout(() => {
      window.location.href = "/entrar";
    }, 1000);
  };

  // Menu sections para patrocinador
  const menuSections = [
    {
      title: "Conta",
      items: [
        { 
          icon: Building2, 
          label: "Dados da Empresa", 
          onClick: () => setLocation("/dados-cadastrais"),
          active: true
        }
      ]
    },
    {
      title: "Configurações",
      items: [
        { 
          icon: Settings, 
          label: "Configurações", 
          onClick: () => setLocation("/configuracoes"),
          active: false
        }
      ]
    },
    {
      title: "Suporte",
      items: [
        { 
          icon: Phone, 
          label: "Contato", 
          onClick: () => window.open("tel:31986631203", "_self"),
          active: true
        },
        { 
          icon: Mail, 
          label: "Email", 
          onClick: () => window.open("mailto:sac@institutoogrito.org", "_self"),
          active: true
        }
      ]
    },
    {
      title: "Sobre",
      items: [
        { 
          icon: Info, 
          label: "O que é o Clube do Grito?", 
          onClick: () => setLocation("/sobre"),
          active: true
        },
        { 
          icon: FileText, 
          label: "Política de privacidade", 
          onClick: () => setLocation("/termos-servicos?from=profile"),
          active: true
        }
      ]
    }
  ];

  return (
    <motion.div 
      className="min-h-screen bg-white pb-20 font-inter"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Header */}
      <header className="bg-white">
        <div className="px-4 py-3 flex items-center">
          {/* Menu Hamburger */}
          <div className="w-16 flex justify-start">
            <button 
              onClick={() => setShowHelpMenu(true)}
              className="flex flex-col space-y-1 p-2 items-start"
              data-testid="button-menu"
            >
              <div className="w-6 h-0.5 bg-gray-700"></div>
              <div className="w-4 h-0.5 bg-gray-700"></div>
              <div className="w-6 h-0.5 bg-gray-700"></div>
            </button>
          </div>
          
          {/* Logo Central */}
          <div className="flex-1 flex justify-center">
            <Logo size="md" />
          </div>
          
          {/* Logo da Empresa (clicável) */}
          <div className="w-16 flex justify-end">
            <div className="flex flex-col items-center gap-1.5">
              <CompanyAvatar 
                size="md" 
                companyName={userName}
                className="border-2 border-gray-200 cursor-pointer"
                clickable={true}
                onClick={() => setShowEditModal(true)}
                data-testid="avatar-empresa"
              />
              <div className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-1 rounded-full">
                <span>Patrocinador</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Menu Sections */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {menuSections.map((section, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-black">
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {section.items.map((item, itemIndex) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={itemIndex}
                        onClick={item.active ? item.onClick : undefined}
                        className={`flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer ${
                          item.active 
                            ? 'hover:bg-gray-50 hover:shadow-sm'
                            : 'opacity-50 cursor-not-allowed'
                        }`}
                        data-testid={`menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="w-5 h-5 text-gray-600" />
                          <span className="font-medium text-black">{item.label}</span>
                        </div>
                        {item.active && (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Logout Button */}
        <Card className="mt-6 hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div
              onClick={handleLogout}
              className="flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer hover:bg-red-50"
              data-testid="button-sair"
            >
              <div className="flex items-center space-x-3">
                <LogOut className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-600">Sair da conta</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Edição de Perfil */}
      {showEditModal && (
        <ProfileEditModal
          userId={userId}
          userName={userName}
          userEmail={userEmail}
          userPhone={userPhone}
          isCompany={true}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Menu Lateral - Design igual ao Conselheiro */}
      {showHelpMenu && (
        <div className="fixed inset-0 z-[99999]">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowHelpMenu(false)}
          />
          
          {/* Menu Lateral */}
          <motion.div
            initial={{ x: -400 }}
            animate={{ x: 0 }}
            exit={{ x: -400 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute top-0 left-0 h-full w-80 bg-white shadow-lg overflow-y-auto"
          >
            {/* Header do Menu */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-black">
                  Fala {userName.split(' ')[0] || "Patrocinador"}, tudo bem?
                </h2>
                <button
                  onClick={() => setShowHelpMenu(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Opções do Menu */}
            <div className="space-y-4 mt-4">
              {/* Home */}
              <div>
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                  onClick={() => {
                    setShowHelpMenu(false);
                    setTimeout(() => setLocation("/patrocinador"), 150);
                  }}
                  data-testid="menu-home"
                >
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base">
                      Home
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      Acompanhe indicadores e métricas de impacto.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
                <div className="border-b border-gray-100 mx-4"></div>
              </div>

              {/* Perfil */}
              <div>
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                  onClick={() => setShowHelpMenu(false)}
                  data-testid="menu-perfil"
                >
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base">
                      Perfil
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      Mostre quem você é nessa jornada.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
                <div className="border-b border-gray-100 mx-4"></div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation />
    </motion.div>
  );
}
