import { useState, useEffect, useCallback } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

// Importar imagens de patrocinadores
import patrocinador1 from "@assets/1.png";
import patrocinador2 from "@assets/2.png";
import patrocinador3 from "@assets/3.png";
import patrocinador4 from "@assets/4.png";
import patrocinador5 from "@assets/5.png";
import patrocinador6 from "@assets/6.png";
import patrocinador7 from "@assets/7.png";
import patrocinador8 from "@assets/8.png";
import patrocinador9 from "@assets/9.png";
import patrocinador10 from "@assets/10.png";
import patrocinador11 from "@assets/11.png";
import patrocinador12 from "@assets/12.png";
import patrocinador13 from "@assets/13.png";
import patrocinador14 from "@assets/14.png";
import patrocinador15 from "@assets/15.png";

const patrocinadores = [
  { src: patrocinador1, alt: "Patrocinador 1" },
  { src: patrocinador2, alt: "Patrocinador 2" },
  { src: patrocinador3, alt: "Patrocinador 3" },
  { src: patrocinador4, alt: "Patrocinador 4" },
  { src: patrocinador5, alt: "Patrocinador 5" },
  { src: patrocinador6, alt: "Patrocinador 6" },
  { src: patrocinador7, alt: "Patrocinador 7" },
  { src: patrocinador8, alt: "Patrocinador 8" },
  { src: patrocinador9, alt: "Patrocinador 9" },
  { src: patrocinador10, alt: "Patrocinador 10" },
  { src: patrocinador11, alt: "Patrocinador 11" },
  { src: patrocinador12, alt: "Patrocinador 12" },
  { src: patrocinador13, alt: "Patrocinador 13" },
  { src: patrocinador14, alt: "Patrocinador 14" },
  { src: patrocinador15, alt: "Patrocinador 15" },
];

interface PatrocinadoresCarouselProps {
  compact?: boolean;
  showTitle?: boolean;
  className?: string;
}

export default function PatrocinadoresCarousel({ 
  compact = false, 
  showTitle = false,
  className = "" 
}: PatrocinadoresCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  // Atualizar o índice atual quando o slide mudar
  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className={`px-4 max-w-sm mx-auto mt-8 mb-8 ${className}`}>
      {showTitle && (
        <h2 className="text-xl font-bold text-center mb-4" style={{ color: '#3B014F' }}>
          Patrocinadores
        </h2>
      )}
      
      <Carousel 
        className="w-full"
        setApi={setApi}
        plugins={[
          Autoplay({
            delay: 3000,
            stopOnInteraction: false,
            stopOnMouseEnter: false,
          }),
        ]}
        opts={{
          loop: true,
        }}
      >
        <CarouselContent>
          {patrocinadores.map((patrocinador, index) => (
            <CarouselItem key={index}>
              <div className="overflow-hidden">
                <img 
                  src={patrocinador.src}
                  alt={patrocinador.alt}
                  className="w-full h-auto object-contain"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Bolinhas indicadoras */}
      <div className="flex justify-center gap-2 mt-4">
        {patrocinadores.map((_, index) => (
          <button
            key={index}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === current 
                ? 'w-8 bg-[#FFCC00]' 
                : 'w-2 bg-gray-300 hover:bg-gray-400'
            }`}
            onClick={() => api?.scrollTo(index)}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
