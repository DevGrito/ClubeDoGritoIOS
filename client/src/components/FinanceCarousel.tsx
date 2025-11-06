import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import IndicadorCard from "./IndicadorCard";

interface FinanceCarouselProps {
  cards: Array<{
    title: string;
    value: number;
    formattedValue: string;
    color: "yellow" | "black" | "green" | "red";
    icon: any;
    subtitle: string;
    loading?: boolean;
    trend?: { type: 'up' | 'down' | 'stable'; text: string; } | undefined;
  }>;
  isLoading?: boolean;
}

export default function FinanceCarousel({ cards, isLoading = false }: FinanceCarouselProps) {
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
    loop: false
  });

  return (
    <div className="relative">
      {/* Carrossel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {cards.map((card, index) => (
            <div 
              key={card.title} 
              className="flex-none w-[280px] sm:w-[300px]"
            >
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <IndicadorCard
                  title={card.title}
                  value={card.value}
                  formattedValue={card.formattedValue}
                  color={card.color}
                  icon={card.icon}
                  subtitle={card.subtitle}
                  loading={card.loading || isLoading}
                  trend={card.trend}
                  data-testid={`indicador-${card.title.toLowerCase().replace(/ /g, '-')}`}
                />
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
