import { cn } from "@/lib/utils";
import clubeLogoImage from "../app-assets/CLUBE_DO GRITO_LOGO_Prancheta 1_1751996016284.png";

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export default function Logo({ size = "md", className }: LogoProps) {
  const sizeClasses = {
    xs: "h-12 w-14",
    sm: "h-36 w-40",
    md: "h-44 w-48",
    lg: "h-48 w-52",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <img 
        src={clubeLogoImage} 
        alt="Clube do Grito" 
        className={cn("object-contain", sizeClasses[size])}
      />
    </div>
  );
}
