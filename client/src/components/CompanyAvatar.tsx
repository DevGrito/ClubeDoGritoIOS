import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface CompanyAvatarProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
  clickable?: boolean;
  companyName?: string;
}

export function CompanyAvatar({ 
  size = "md", 
  className = "",
  onClick,
  clickable = true,
  companyName = "Empresa"
}: CompanyAvatarProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [imageVersion, setImageVersion] = useState<number>(Date.now());
  const [imageError, setImageError] = useState<boolean>(false);
  
  const userId = localStorage.getItem("userId");

  // Buscar dados do usuário da API para ter fotoPerfil atualizado
  const { data: apiUserData, refetch } = useQuery({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
    staleTime: 0, // SEMPRE buscar dados frescos
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // 🔍 Health check da foto (verificar se arquivo existe)
  const { data: healthData } = useQuery({
    queryKey: [`/api/users/${userId}/profile-image/health`],
    enabled: !!userId && !!apiUserData,
    staleTime: 30000, // Cache de 30s para health check
  });

  // Atualizar URL da imagem quando os dados da API mudarem
  useEffect(() => {
    if (!userId) {
      setLogoUrl(null);
      return;
    }

    // SEMPRE usar dados da API (banco de dados)
    if (apiUserData && typeof apiUserData === 'object') {
      const data = apiUserData as any;
      
      if (data.fotoPerfil) {
        // ✅ SISTEMA DE FALLBACK ROBUSTO
        
        // 1. Verificar health check se disponível
        if (healthData && typeof healthData === 'object') {
          const health = healthData as any;
          
          if (!health.valid) {
            console.error('❌ [COMPANY AVATAR] Health check falhou:', health.reason);
            console.error('❌ [COMPANY AVATAR] Foto inválida no banco:', data.fotoPerfil);
            setLogoUrl(null);
            setImageError(true);
            return;
          }
        }

        // 2. Tentar carregar a imagem
        const timestamp = Date.now();
        const imageUrl = `/api/users/${userId}/profile-image?v=${timestamp}`;
        
        console.log('🖼️ [COMPANY AVATAR] Carregando foto validada da API (banco):', imageUrl);
        console.log('🖼️ [COMPANY AVATAR] Caminho no banco:', data.fotoPerfil);
        console.log('🖼️ [COMPANY AVATAR] Health check:', healthData);
        
        setLogoUrl(imageUrl);
        setImageVersion(timestamp);
        setImageError(false);
      } else {
        console.log('🖼️ [COMPANY AVATAR] Nenhuma foto cadastrada no banco');
        setLogoUrl(null);
        setImageError(false);
      }
    }
  }, [userId, apiUserData, healthData]);

  // Escutar evento de atualização do perfil
  useEffect(() => {
    const handleUserDataUpdate = () => {
      console.log('🔄 [COMPANY AVATAR] Evento de atualização recebido - Buscando dados frescos da API');
      // Forçar refetch dos dados da API
      refetch();
      setImageError(false);
    };

    window.addEventListener('userDataUpdate', handleUserDataUpdate);

    return () => {
      window.removeEventListener('userDataUpdate', handleUserDataUpdate);
    };
  }, [refetch]);

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10", 
    lg: "h-16 w-16",
    xl: "h-24 w-24"
  };

  const getInitials = () => {
    if (!companyName.trim()) return "E";
    
    return companyName
      .split(' ')
      .filter(name => name.length > 0)
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarClasses = `${sizeClasses[size]} ${className} ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`;

  // Handler de erro de imagem com fallback automático
  const handleImageError = () => {
    console.error('❌ [COMPANY AVATAR] Erro ao carregar imagem:', logoUrl);
    console.error('❌ [COMPANY AVATAR] Ativando fallback - mostrando iniciais');
    setImageError(true);
    setLogoUrl(null);
    
    // Tentar revalidar depois de 5s
    setTimeout(() => {
      console.log('🔄 [COMPANY AVATAR] Tentando revalidar foto após erro...');
      refetch();
    }, 5000);
  };

  return (
    <Avatar 
      className={avatarClasses}
      onClick={onClick}
      data-testid="company-avatar"
    >
      {logoUrl && !imageError && (
        <AvatarImage 
          key={imageVersion}
          src={logoUrl} 
          alt={`Logo ${companyName}`}
          className="object-cover"
          onError={handleImageError}
        />
      )}
      <AvatarFallback className="bg-purple-100 text-purple-600">
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
}
