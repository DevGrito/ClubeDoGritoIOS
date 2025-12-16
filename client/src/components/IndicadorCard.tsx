import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

// Interface para definir as propriedades do componente
interface IndicadorCardProps {
  title: string;
  value: number | string;
  formattedValue?: string; // Valor formatado customizado (para privacidade)
  color?: "yellow" | "black" | "white" | "green" | "red" | "primary" | "secondary" | "success" | "warning" | "danger";
  icon?: LucideIcon;
  subtitle?: string;
  trend?: {
    type: "up" | "down" | "stable";
    text: string;
  };
  loading?: boolean;
  className?: string;
}

// Componente para exibir indicadores financeiros modernos
export default function IndicadorCard({ 
  title, 
  value, 
  formattedValue,
  color = "primary", 
  icon: Icon,
  subtitle,
  trend,
  loading = false,
  className = ""
}: IndicadorCardProps) {
  // Definir cores baseadas na prop color - suporte para múltiplos temas
  const colorClasses = {
    // Tema claro moderno para conselho financeiro
    yellow: {
      bg: "bg-gradient-to-br from-[#FFCC00] to-[#FFD700]",
      text: "text-yellow-900",
      border: "border-[#FFCC00]",
      iconBg: "bg-gradient-to-br from-[#FFD700] to-[#FFAA00]",
      iconText: "text-yellow-900",
      accent: "text-yellow-700"
    },
    black: {
      bg: "bg-gradient-to-br from-gray-900 to-black",
      text: "text-white",
      border: "border-gray-700",
      iconBg: "bg-gradient-to-br from-gray-700 to-gray-800",
      iconText: "text-white",
      accent: "text-gray-300"
    },
    white: {
      bg: "bg-gradient-to-br from-white to-gray-50",
      text: "text-gray-900",
      border: "border-gray-200",
      iconBg: "bg-gradient-to-br from-gray-100 to-gray-200",
      iconText: "text-gray-700",
      accent: "text-gray-600"
    },
    green: {
      bg: "bg-gradient-to-br from-green-500 to-green-600",
      text: "text-white",
      border: "border-green-400",
      iconBg: "bg-gradient-to-br from-green-600 to-green-700",
      iconText: "text-white",
      accent: "text-green-100"
    },
    red: {
      bg: "bg-gradient-to-br from-red-500 to-red-600",
      text: "text-white",
      border: "border-red-400",
      iconBg: "bg-gradient-to-br from-red-600 to-red-700",
      iconText: "text-white",
      accent: "text-red-100"
    },
    // Tema escuro moderno (manter compatibilidade)
    primary: {
      bg: "bg-gradient-to-br from-slate-800 to-slate-900",
      text: "text-white",
      border: "border-slate-700",
      iconBg: "bg-gradient-to-br from-blue-600 to-blue-700",
      iconText: "text-white",
      accent: "text-blue-400"
    },
    secondary: {
      bg: "bg-gradient-to-br from-slate-700 to-slate-800", 
      text: "text-white",
      border: "border-slate-600",
      iconBg: "bg-gradient-to-br from-purple-600 to-purple-700",
      iconText: "text-white",
      accent: "text-purple-400"
    },
    success: {
      bg: "bg-gradient-to-br from-emerald-800 to-emerald-900",
      text: "text-white",
      border: "border-emerald-600",
      iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      iconText: "text-white",
      accent: "text-emerald-300"
    },
    warning: {
      bg: "bg-gradient-to-br from-amber-800 to-amber-900",
      text: "text-white",
      border: "border-amber-600",
      iconBg: "bg-gradient-to-br from-amber-500 to-amber-600",
      iconText: "text-white",
      accent: "text-amber-300"
    },
    danger: {
      bg: "bg-gradient-to-br from-red-800 to-red-900",
      text: "text-white",
      border: "border-red-600",
      iconBg: "bg-gradient-to-br from-red-500 to-red-600",
      iconText: "text-white",
      accent: "text-red-300"
    }
  };

  const styles = colorClasses[color] || colorClasses.primary;

  // Função para formatar valores monetários
  const formatValue = (val: number | string): string => {
    if (typeof val === 'number') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(val);
    }
    return val;
  };

  if (loading) {
    return (
      <Card 
        className={`${styles.bg} ${styles.border} border shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-500 ${className}`}
        data-testid={`indicador-card-${title.toLowerCase().replace(/\s+/g, '-')}-loading`}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-3 flex-1">
              <div className="h-4 bg-slate-600 rounded-lg animate-pulse w-2/3"></div>
              <div className="h-10 bg-slate-600 rounded-lg animate-pulse w-3/4"></div>
              <div className="h-3 bg-slate-700 rounded-lg animate-pulse w-1/2"></div>
            </div>
            <div className="ml-4">
              <div className="w-14 h-14 bg-slate-600 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`${styles.bg} ${styles.border} border shadow-xl backdrop-blur-sm transition-all duration-300 group ${className}`}
      data-testid={`indicador-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            {/* Título */}
            <div className="flex items-center justify-between">
              <h3 
                className={`text-sm font-semibold ${styles.text} opacity-90 tracking-wide`}
                data-testid={`indicador-title-${title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {title}
              </h3>
              {trend && (
                <div className="flex items-center space-x-1">
                  {trend.type === 'up' && (
                    <div className="flex items-center text-emerald-400 text-xs font-medium">
                      <span className="text-emerald-400">↗</span>
                      <span className="ml-1">{trend.text}</span>
                    </div>
                  )}
                  {trend.type === 'down' && (
                    <div className="flex items-center text-red-400 text-xs font-medium">
                      <span className="text-red-400">↘</span>
                      <span className="ml-1">{trend.text}</span>
                    </div>
                  )}
                  {trend.type === 'stable' && (
                    <div className="flex items-center text-slate-400 text-xs font-medium">
                      <span className="text-slate-400">→</span>
                      <span className="ml-1">{trend.text}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Valor principal */}
            <div 
              className={`text-2xl md:text-3xl xl:text-4xl font-bold ${styles.text} group-hover:${styles.accent} transition-colors duration-300`}
              data-testid={`indicador-value-${title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {formattedValue || formatValue(value)}
            </div>
            
            {/* Subtítulo/descrição adicional */}
            {subtitle && (
              <p className={`text-xs ${styles.text} opacity-70 font-medium`}>
                {subtitle}
              </p>
            )}
          </div>
          
          {/* Ícone */}
          {Icon && (
            <div className="ml-4">
              <div className={`${styles.iconBg} p-4 rounded-xl shadow-lg transition-all duration-300`}>
                <Icon 
                  className={`w-7 h-7 ${styles.iconText}`} 
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Interface para o componente compacto
interface IndicadorCardCompactProps {
  title: string;
  value: number | string;
  color?: "yellow" | "black" | "white";
  loading?: boolean;
}

// Componente alternativo com layout mais compacto
export function IndicadorCardCompact({ 
  title, 
  value, 
  color = "yellow",
  loading = false 
}: IndicadorCardCompactProps) {
  const colorClasses = {
    yellow: "bg-yellow-400 text-yellow-900",
    black: "bg-gray-900 text-white",
    white: "bg-white text-gray-900 border border-gray-200"
  };

  if (loading) {
    return (
      <div 
        className={`${colorClasses[color]} p-4 rounded-lg shadow`}
        data-testid={`indicador-compact-${title.toLowerCase().replace(/\s+/g, '-')}-loading`}
      >
        <div className="h-4 bg-gray-300 rounded animate-pulse mb-2"></div>
        <div className="h-6 bg-gray-300 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div 
      className={`${colorClasses[color]} p-4 rounded-lg shadow hover:shadow-md transition-shadow`}
      data-testid={`indicador-compact-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="text-sm font-medium opacity-80 mb-1">{title}</div>
      <div className="text-xl font-bold">
        {typeof value === 'number' ? 
          new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(value) : 
          value
        }
      </div>
    </div>
  );
}