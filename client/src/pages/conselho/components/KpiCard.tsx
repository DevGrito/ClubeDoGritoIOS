import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  subtitle?: string;
  isLoading?: boolean;
  delay?: number; // For animation delay
  color?: string; // Cor corporativa customizada
  darkText?: boolean; // Usar texto escuro para fundos claros
}

export default function KpiCard({ 
  title, 
  value, 
  icon: Icon, 
  subtitle, 
  isLoading = false,
  delay = 0,
  color = '#0F4C5C', // Azul escuro corporativo como padrão
  darkText = false // Por padrão usa texto claro
}: KpiCardProps) {
  const formattedValue = typeof value === 'number' ? value.toLocaleString('pt-BR') : value;
  
  // Definir cores do texto baseado na prop darkText
  const textColor = darkText ? 'text-gray-900' : 'text-white';
  const textOpacity = darkText ? 'text-gray-700' : 'text-white/90';
  const badgeBg = darkText ? 'bg-gray-900/10' : 'bg-white/20';
  const badgeText = darkText ? 'text-gray-900' : 'text-white';
  const badgeBorder = darkText ? 'border-gray-900/20' : 'border-white/30';
  const iconBg = darkText ? 'bg-gray-900/10' : 'bg-white/20';
  const iconColor = darkText ? 'text-gray-900' : 'text-white';
  const loadingSkeleton = darkText ? 'bg-gray-900/10' : 'bg-white/20';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="h-[180px]"
    >
      <Card 
        className="h-full shadow-lg transition-shadow duration-300 border-0"
        style={{ backgroundColor: color }}
      >
        <CardContent className="p-6 h-full flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {subtitle && (
                <Badge 
                  variant="secondary" 
                  className={`${badgeBg} ${badgeText} ${badgeBorder} text-xs px-2 py-1`}
                >
                  {subtitle}
                </Badge>
              )}
            </div>
            <div className={`${iconBg} p-2 rounded-lg`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
          </div>
          
          <div className="flex-1 flex items-end">
            {isLoading ? (
              <div className="w-full">
                <div className={`h-8 ${loadingSkeleton} rounded animate-pulse mb-2`}></div>
                <div className={`h-4 ${loadingSkeleton} rounded animate-pulse w-3/4`}></div>
              </div>
            ) : (
              <div className="w-full">
                <div className={`text-3xl md:text-4xl font-bold ${textColor} mb-1`}>
                  {formattedValue}
                </div>
                <div className={`${textOpacity} text-xs font-medium uppercase tracking-wide`}>
                  {title.toLowerCase()}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}