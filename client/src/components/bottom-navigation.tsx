import { Home, Gift, TrendingUp, Heart, User, Ticket } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import homeIcon from "@assets/image_1756144268347.png";
import impactoIcon from "@assets/rocket_7339928_1756908855776.png";
import beneficiosIcon from "@assets/image_1756148798339.png";
import financeiroIcon from "@assets/image_1756148826775.png";
import perfilIcon from "@assets/image_1756148852420.png";

interface BottomNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: string;
}

const navItems: BottomNavItem[] = [
  {
    id: "home",
    label: "Home",
    icon: <img src={homeIcon} alt="Home" className="w-7 h-7" />,
    route: "/tdoador"
  },
  {
    id: "beneficios",
    label: "Benefícios",
    icon: <img src={beneficiosIcon} alt="Benefícios" className="w-7 h-7" />,
    route: "/beneficios"
  },
  {
    id: "financeiro",
    label: "Financeiro",
    icon: <img src={financeiroIcon} alt="Financeiro" className="w-7 h-7" />,
    route: "/pagamentos"
  },
  {
    id: "impacto",
    label: "Impacto",
    icon: <img src={impactoIcon} alt="Impacto" className="w-7 h-7" />,
    route: "/impacto"
  },
  {
    id: "perfil",
    label: "Perfil",
    icon: <img src={perfilIcon} alt="Perfil" className="w-7 h-7" />,
    route: "/perfil"
  }
];

export default function BottomNavigation({ onBeneficiosClick, hideBeneficios = false, hidden = false }: { onBeneficiosClick?: () => void; hideBeneficios?: boolean; hidden?: boolean }) {
  const [location, setLocation] = useLocation();

  // Detectar papel do usuário para ajustar menu
  const userPapel = typeof window !== 'undefined' ? localStorage.getItem('userPapel') : null;
  const isConselho = userPapel === 'conselho' || userPapel === 'conselheiro' || userPapel === 'desenvolvedor';
  
  // Verificar se está na página do conselho ou patrocinador (por rota ou papel)
  const isConselhoPage = location === '/conselho';
  const isPatrocinadorPage = location === '/patrocinador' || location === '/perfil-patrocinador';
  const isPatrocinador = userPapel === 'patrocinador' || isPatrocinadorPage;

  const getCurrentActiveItem = () => {
    if (location === "/tdoador") return "home";
    if (location === "/conselho") return "home";
    if (location === "/patrocinador") return "home";
    if (location === "/ingresso") return "ingresso";
    if (location === "/beneficios" || location === "/beneficios-onboarding" || location === "/sorteio" || location === "/missoes-semanais") return "beneficios";
    if (location === "/pagamentos" || location === "/financeiro") return "financeiro";
    if (location === "/impacto") return "impacto";
    if (location === "/perfil" || location === "/perfil-patrocinador") return "perfil";
    return "";
  };

  const activeItem = getCurrentActiveItem();

  const handleNavigation = (route: string, itemId: string) => {
    // Ajustar rota do Home baseado no papel do usuário
    if (itemId === "home" && isConselho) {
      setLocation("/conselho");
    } else if (itemId === "home" && isPatrocinador) {
      setLocation("/patrocinador");
    } else if (itemId === "perfil" && isPatrocinador) {
      // Manter parâmetros dev_access se existirem
      const urlParams = new URLSearchParams(window.location.search);
      const devAccess = urlParams.get('dev_access');
      const origin = urlParams.get('origin');
      
      if (devAccess === 'true' && origin === 'dev_panel') {
        setLocation("/perfil-patrocinador?dev_access=true&origin=dev_panel");
      } else {
        setLocation("/perfil-patrocinador");
      }
    } else {
      setLocation(route);
    }
  };

  // Filtrar navItems para usuários do conselho e patrocinador em TODAS as páginas
  const filteredNavItems = isConselho
    ? navItems.filter(item => item.id !== "beneficios" && item.id !== "impacto" && item.id !== "financeiro")
    : isPatrocinador
      ? navItems.filter(item => item.id === "home" || item.id === "perfil")
      : hideBeneficios 
        ? navItems.filter(item => item.id !== "beneficios")
        : navItems;

  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-yellow-400 z-50 transition-transform duration-300",
        hidden ? "translate-y-[120%]" : "translate-y-0"
      )}
      style={{ borderRadius: '20px 20px 45px 45px' }}
    >
      <div className="flex items-center justify-around py-0 px-4 max-w-md mx-auto">
        {filteredNavItems.map((item) => {
          const isActive = activeItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.route, item.id)}
              className={cn(
                "flex flex-col items-center justify-center p-0 min-w-0 flex-1 transition-transform duration-200",
                isActive ? "transform -translate-y-4" : ""
              )}
            >
              <div 
                className={cn(
                  "flex items-center justify-center mb-1 transition-all duration-200",
                  isActive ? "w-16 h-16 bg-black rounded-full border-8 border-white" : ""
                )}
              >
                <div className={cn(
                  "transition-all duration-200 flex items-center justify-center",
                  isActive ? "text-white" : "text-black",
                  isActive && (item.id === "home" || item.id === "beneficios" || item.id === "financeiro" || item.id === "impacto" || item.id === "perfil") ? "brightness-0 invert" : ""
                )}>
                  {item.icon}
                </div>
              </div>
              <span className={cn(
                "text-xs font-medium transition-colors duration-200",
                isActive ? "text-black" : "text-black"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}