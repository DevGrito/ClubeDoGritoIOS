import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, DollarSign, Target, Calculator } from "lucide-react";
import { motion } from "framer-motion";
import type { ResumoFinanceiro } from "@/types/financeiro";
import { formatBRLCompact } from "@/services/financeiroService";

interface FinanceiroCarouselProps {
  data: ResumoFinanceiro | null;
  loading: boolean;
  period: string;
  className?: string;
}

interface FinanceiroCardProps {
  title: string;
  value: number;
  period: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'previsto' | 'realizado' | 'saldo';
  loading?: boolean;
}

function FinanceiroCard({ title, value, period, icon: Icon, color, loading = false }: FinanceiroCardProps) {
  if (loading) {
    return (
      <div 
        className="min-w-[85%] md:min-w-0 md:flex-1 snap-start"
        data-testid={`card-${color}-loading`}
      >
        <Card className="h-full bg-gradient-to-br from-green-500 to-green-600 border-green-400">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-4 w-20 bg-green-400" />
              <Skeleton className="h-5 w-5 bg-green-400 rounded" />
            </div>
            <Skeleton className="h-8 w-24 bg-green-400 mb-2" />
            <Skeleton className="h-4 w-16 bg-green-400" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determinar cor do saldo
  const getSaldoColor = () => {
    if (color !== 'saldo') return '';
    return value >= 0 ? 'text-green-100' : 'text-red-200';
  };

  const getSaldoIcon = () => {
    if (color !== 'saldo') return Icon;
    return value >= 0 ? TrendingUp : TrendingDown;
  };

  const ActualIcon = getSaldoIcon();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-w-[85%] md:min-w-0 md:flex-1 snap-start"
      data-testid={`card-${color}`}
    >
      <Card className="h-full bg-gradient-to-br from-green-500 to-green-600 border-green-400 shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-green-100 text-sm uppercase tracking-wide">
              {title}
            </h3>
            <ActualIcon className="w-5 h-5 text-green-200" />
          </div>
          
          <div className={`text-2xl md:text-3xl font-bold mb-2 ${getSaldoColor()}`}>
            {color === 'saldo' && value > 0 && '+'}{formatBRLCompact(value)}
          </div>
          
          <Badge 
            variant="secondary" 
            className="bg-green-600/30 text-green-100 border-green-400/30 text-xs"
          >
            {period === 'mensal' ? 'Mês' : 
             period === 'trimestral' ? 'Trim.' :
             period === 'semestral' ? 'Sem.' :
             period === 'anual' ? 'Ano' : 'Período'}
          </Badge>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function FinanceiroCarousel({ data, loading, period, className = "" }: FinanceiroCarouselProps) {
  const cards = [
    {
      title: "Previsto",
      value: data?.previsto || 0,
      icon: Target,
      color: 'previsto' as const
    },
    {
      title: "Realizado", 
      value: data?.realizado || 0,
      icon: DollarSign,
      color: 'realizado' as const
    },
    {
      title: "Saldo",
      value: data?.saldo || 0,
      icon: Calculator,
      color: 'saldo' as const
    }
  ];

  return (
    <div className={`w-full ${className}`} data-testid="financeiro-carousel">
      {/* Mobile: Carrossel horizontal */}
      <div className="md:hidden">
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth px-4 pb-2">
          {cards.map((card) => (
            <FinanceiroCard
              key={card.color}
              title={card.title}
              value={card.value}
              period={period}
              icon={card.icon}
              color={card.color}
              loading={loading}
            />
          ))}
        </div>
      </div>

      {/* Desktop: Grid lado a lado */}
      <div className="hidden md:block">
        <div className="grid grid-cols-3 gap-4">
          {cards.map((card) => (
            <FinanceiroCard
              key={card.color}
              title={card.title}
              value={card.value}
              period={period}
              icon={card.icon}
              color={card.color}
              loading={loading}
            />
          ))}
        </div>
      </div>
    </div>
  );
}