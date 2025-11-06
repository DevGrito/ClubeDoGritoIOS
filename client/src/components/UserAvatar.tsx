import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfileImage } from "@/hooks/useProfileImage";
import { useUserData } from "@/hooks/useUserData";
import { User } from "lucide-react";

interface UserAvatarProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showFallback?: boolean;
  onClick?: () => void;
  clickable?: boolean;
}

export function UserAvatar({ 
  size = "md", 
  className = "",
  showFallback = true,
  onClick,
  clickable = true
}: UserAvatarProps) {
  const { profileImage } = useProfileImage();
  const { userData } = useUserData();

  // Tamanhos do avatar
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10", 
    lg: "h-16 w-16",
    xl: "h-24 w-24"
  };

  // Gerar iniciais do usuário
  const getInitials = () => {
    const fullName = userData.nome + (userData.sobrenome ? ` ${userData.sobrenome}` : "");
    if (!fullName.trim()) return "U";
    
    return fullName
      .split(' ')
      .filter(name => name.length > 0)
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarClasses = `${sizeClasses[size]} ${className} ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`;

  return (
    <Avatar 
      className={avatarClasses}
      onClick={onClick}
      data-testid="user-avatar"
    >
      {profileImage && (
        <AvatarImage 
          src={profileImage} 
          alt={`Foto de ${userData.nome}`}
          className="object-cover"
        />
      )}
      <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-red-500 text-white font-semibold">
        {showFallback ? getInitials() : <User className="h-4 w-4" />}
      </AvatarFallback>
    </Avatar>
  );
}