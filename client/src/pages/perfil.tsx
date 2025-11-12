import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LogOut,
  User,
  UserPlus,
  Settings,
  CreditCard,
  Bell,
  Palette,
  Phone,
  Mail,
  MessageCircle,
  AlertCircle,
  Info,
  Users,
  Shield,
  Crown,
  FileText,
  ChevronRight,
  Calendar,
  MapPin,
  Star,
  Menu,
  Gift,
  BookOpen,
  Link as LinkIcon
} from "lucide-react";
import Logo from "@/components/logo";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";
import { useUserData } from "@/hooks/useUserData";
import { useProfileImage } from "@/hooks/useProfileImage";
import { UserAvatar } from "@/components/UserAvatar";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";

export default function Perfil() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { userData } = useUserData();
  const { profileImage } = useProfileImage();

  // Estado para controlar o menu lateral de ajuda
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  // Estado para controlar o modal de edição de perfil
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Estado para saber se o usuário é doador (verificado no backend)
  const [isDonorVerified, setIsDonorVerified] = useState<boolean | null>(null);
  // Estado para armazenar a campanha ativa
  const [activeCampaign, setActiveCampaign] = useState<any>(null);
  
  // Verificar se o usuário é doador consultando o backend
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      fetch(`/api/user/${userId}`)
        .then(res => res.json())
        .then(data => {
          const isUserDonor = data.tipo === 'doador' || data.papel === 'doador';
          setIsDonorVerified(isUserDonor);
          
          // Atualizar localStorage se necessário
          if (isUserDonor) {
            localStorage.setItem("isDonor", "true");
            localStorage.setItem("userType", "doador");
          }
        })
        .catch(err => console.error('Erro ao verificar status de doador:', err));
    }
  }, []);

  // Buscar campanha ativa de marketing
  useEffect(() => {
    fetch('/api/mkt/active-campaign')
      .then(res => res.json())
      .then(data => {
        if (data.campaign) {
          setActiveCampaign(data.campaign);
        }
      })
      .catch(err => console.error('Erro ao buscar campanha ativa:', err));
  }, []);

  const planDisplayNames = {
    eco: "Eco",
    voz: "Voz",
    grito: "O Grito",
    platinum: "Platinum"
  };

  // Função para verificar se é o Leo pelo role
  // TRECHO REMOVIDO
 // const isLeoUser = () => {
   // const isLeo = userData.role === 'leo';
    //console.log('🔍 [PERFIL] userData.role:', userData.role, 'isLeo:', isLeo);
    //return isLeo;
  //};

  const handleLogout = () => {
    console.log("Logout button clicked");

    // Show confirmation toast
    toast({
      title: "Saindo da conta",
      description: "Você será desconectado...",
    });
    
    // Clear all storage completely
    localStorage.clear();
    sessionStorage.clear();
    
    // Small delay to show toast, then redirect with full page reload
    setTimeout(() => {
      window.location.href = "/entrar";
    }, 1000);
  };

  // Get user data from localStorage
  const userName = localStorage.getItem("userName") || "Usuário";
  const userEmail = localStorage.getItem("userEmail") || "";
  const userPhone = localStorage.getItem("userPhone") || "";
  const userPlan = localStorage.getItem("userPlano") || "eco";
  // Check if user is a donor (has donation-related data)
  // Conselheiros devem ver a versão de doador (simples)
  // Leo não é doador, então não deve ser forçado como doador
  const userPapel = localStorage.getItem("userPapel") || "";
  const role = (userData?.role || userData?.papel || userPapel || "").toLowerCase();
  const userIsLeo = role === "leo";
  const isConselheiro = userPapel === "conselho" || userPapel === "conselheiro" || userPapel === "desenvolvedor";
  const isDonor = userIsLeo || 
                 isDonorVerified === true ||
                 userPapel === "conselho" ||
                 localStorage.getItem("isDonor") === "true" || 
                 localStorage.getItem("donationFlow") === "true" ||
                 localStorage.getItem("userType") === "doador";
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get plan info
  const getPlanInfo = (plan: string) => {
    switch (plan) {
      case 'eco': return { name: 'Eco', color: 'bg-green-100 text-green-800', price: 'R$ 9,90' };
      case 'voz': return { name: 'Voz', color: 'bg-blue-100 text-blue-800', price: 'R$ 19,90' };
      case 'grito': return { name: 'Grito', color: 'bg-purple-100 text-purple-800', price: 'R$ 29,90' };
      default: return { name: 'Eco', color: 'bg-green-100 text-green-800', price: 'R$ 9,90' };
    }
  };

  const planInfo = getPlanInfo(userPlan);

  // Menu sections with improved organization
  const menuSections = [
    {
      title: "Conta",
      items: [
        {
          icon: User,
          label: "Dados cadastrais",
          onClick: () => setLocation("/dados-cadastrais"),
          active: true
        },
        // Pagamentos - esconder para conselheiros
        ...(!isConselheiro ? [{ 
          icon: CreditCard, 
          label: "Pagamentos", 
          onClick: () => setLocation("/pagamentos"),
          active: true
        }] : []),
        // Admin button for Leo only
        ...(userIsLeo ? [{
          icon: Shield,
          label: "Área Administrativa",
          onClick: () => setLocation("/administrador"),
          active: true,
          highlight: true
        }] : [])
      ]
    },
    {
      title: "Configurações",
      items: [
        {
          icon: Settings,
          label: "Configurações",
          onClick: () => setLocation("/configuracoes"),
          active: true
        },
        {
          icon: Bell,
          label: "Notificações",
          onClick: () => { },
          active: false
        },
        {
          icon: Palette,
          label: "Aparência",
          onClick: () => { },
          active: false
        }
      ]
    },
    ...(isDonor ? [{
      title: activeCampaign ? activeCampaign.name : "Link de Afiliado",
      items: [
        {
          icon: Gift,
          label: "Link de Afiliado que Usei",
          onClick: () => setLocation("/link-afiliado-cadastro"),
          active: true
        }
      ]
    }] : []),
    {
      title: "Suporte",
      items: [
        {
          icon: Phone,
          label: "Contato",
          onClick: () => window.location.href = "tel:31986631203",
          active: true
        },
        {
          icon: Mail,
          label: "Email",
          onClick: () => window.location.href = "mailto:sac@institutoogrito.org",
          active: true
        },
        {
          icon: MessageCircle,
          label: "Chat",
          onClick: () => { },
          active: false
        },
        // Problemas com cobranças - esconder para conselheiros
        ...(!isConselheiro ? [{ 
          icon: AlertCircle, 
          label: "Problemas com cobranças", 
          onClick: () => window.location.href = "mailto:financeiro@institutoogrito.org",
          active: true
        }] : [])
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
        // Administrative items - APENAS para o Leo
        ...(userIsLeo ? [
          { 
            icon: Users, 
            label: "Painel do Conselho", 
            onClick: () => setLocation("/conselho"),
            active: true
          },
          {
            icon: Shield,
            label: "Administração",
            onClick: () => setLocation("/administrador"),
            active: true
          }
        ] : []),
        { 
          icon: FileText, 
          label: "Política de privacidade", 
          onClick: () => setLocation("/termos-servicos?from=profile"),
          active: true
        }
      ]
    }
  ];

  // Show improved profile page for logged in users
  return (
    <div className="min-h-screen bg-white pb-20 font-inter">
      {/* Header */}
      <header className="bg-white">
        <div className="px-4 py-3 flex items-center">
          {/* Elemento da Esquerda: Menu Hamburger */}
          <div className="w-16 flex justify-start">
            <button
              onClick={() => setShowHelpMenu(true)}
              className="flex flex-col space-y-1 p-2 items-start"
            >
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
            <div className="flex flex-col items-center gap-1.5">
              {/* Foto de Perfil Circular */}
              <UserAvatar 
                size="md" 
                className="border-2 border-gray-200 cursor-pointer"
                onClick={() => setShowEditModal(true)}
                data-testid="avatar-perfil"
              />
              {/* Badge do Plano ou Conselheiro */}
              {isConselheiro ? (
                <div className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                  <span>Conselheiro</span>
                </div>
              ) : (
                <div className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full flex items-center space-x-1">
                  <span>{planDisplayNames[userData.plano as keyof typeof planDisplayNames] || "Eco"}</span>
                  <span className="text-orange-500">◆</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>


      {/* Menu Sections */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Menu Sections */}
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
                        className={`flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer ${item.active
                          ? (item.highlight ? 'hover:bg-yellow-50 bg-yellow-400 border-2 border-yellow-600' : 'hover:bg-gray-50 hover:shadow-sm')
                          : 'opacity-50 cursor-not-allowed'
                          }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-5 h-5 ${item.highlight ? 'text-black' : 'text-gray-600'}`} />
                          <span className={`font-medium ${item.highlight ? 'text-black font-bold' : 'text-black'}`}>{item.label}</span>
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

      </div>

      {/* Modal de Edição de Perfil */}
      <ProfileEditModal 
        open={showEditModal} 
        onOpenChange={setShowEditModal} 
      />

      <BottomNavigation />

      {/* Menu Lateral de Ajuda */}
      {showHelpMenu && (
        <div className="fixed inset-0 z-50">
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
                <h2 className="text-xl font-semibold text-black">Fala {userName?.split(' ')[0] || "Doador"}, tudo bem?</h2>
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
              {/* Perfil */}
              <div>
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                  onClick={() => {
                    setShowHelpMenu(false);
                    setTimeout(() => setLocation("/perfil"), 150);
                  }}
                >
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Perfil
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Mostre quem você é nessa jornada.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
                <div className="border-b border-gray-100 mx-4"></div>
              </div>

              {/* Benefícios */}
              <div>
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                  onClick={() => {
                    setShowHelpMenu(false);
                    setTimeout(() => setLocation("/beneficios"), 150);
                  }}
                >
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <Gift className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Benefícios
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Vantagens que transformam seu dia a dia e o de muitos outros.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
                <div className="border-b border-gray-100 mx-4"></div>
              </div>

              {/* Financeiro */}
              <div>
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                  onClick={() => {
                    setShowHelpMenu(false);
                    setTimeout(() => setLocation("/pagamentos"), 150);
                  }}
                >
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Financeiro
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Transparência para você ver seu impacto.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
                <div className="border-b border-gray-100 mx-4"></div>
              </div>

              {/* Termos de Uso */}
              <div>
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                  onClick={() => {
                    setShowHelpMenu(false);
                    setTimeout(() => setLocation('/termos-servicos?from=help'), 150);
                  }}
                >
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Termos de Uso
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Segurança e clareza em cada passo.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
                <div className="border-b border-gray-100 mx-4"></div>
              </div>

              {/* Administrador - Apenas para o Leo */}
              {/* TRECHO REMOVIDO */}
              {userIsLeo && (
                  <div>
                    <div
                      className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                      onClick={() => {
                        setShowHelpMenu(false);
                        setTimeout(() => setLocation('/administrador'), 150);
                      }}
                    >
                      <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                          Administrador
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                          Acesso ao painel administrativo completo.
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>
                    <div className="border-b border-gray-100 mx-4"></div>
                  </div>
                )}

              {/* Deslogar */}
              <div>
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => {
                    setShowHelpMenu(false);
                    setTimeout(() => handleLogout(), 150);
                  }}
                >
                  <LogOut className="w-6 h-6 text-gray-700 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Deslogar
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Saindo agora, mas seu impacto continua.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}