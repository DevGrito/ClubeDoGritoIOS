import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import KpiCard from "./KpiCard";

interface KpiCarouselProps {
  kpiCards: Array<{
    title: string;
    value: number;
    displayValue?: number | string;
    icon: any;
    subtitle?: string;
    description: string;
    color?: string; // Cor corporativa customizada
    darkText?: boolean; // Usar texto escuro para fundos claros
  }>;
  isLoading?: boolean;
}

export default function KpiCarousel({ kpiCards, isLoading = false }: KpiCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
    loop: false
  });

  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();

  const onSelect = () => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  };

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);
  }, [emblaApi]);

  return (
    <div className="relative">
      {/* Carrossel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {kpiCards.map((card, index) => (
            <div 
              key={card.title} 
              className="flex-none w-[280px] sm:w-[300px]"
            >
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <KpiCard
                  title={card.title}
                  value={card.displayValue !== undefined ? card.displayValue : card.value}
                  icon={card.icon}
                  subtitle={card.subtitle}
                  isLoading={isLoading}
                  color={card.color}
                  darkText={card.darkText}
                />
              </motion.div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}