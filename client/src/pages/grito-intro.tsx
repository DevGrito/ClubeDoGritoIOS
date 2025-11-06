import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import gritoIllustration from "@assets/QUAL ÉSEU GRITO_1756904245577.png";

export default function GritoIntro() {
  const [, setLocation] = useLocation();

  const handleNext = () => {
    setLocation("/grito-selection");
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden" style={{ maxWidth: '400px', margin: '0 auto' }}>
      {/* Title Section */}
      <div className="absolute top-12 left-6 z-10">
        <h1 className="text-3xl font-normal text-black leading-tight tracking-normal font-inter">
          Que bom ter<br />
          <span className="font-bold">você por aqui!</span>
        </h1>
      </div>

      {/* Illustration - Large and positioned to create "vazado" effect */}
      <div className="absolute inset-0 flex items-end justify-center" style={{ bottom: '0px' }}>
        <img 
          src={gritoIllustration} 
          alt="Personagem com megafone" 
          className="h-auto object-contain"
          style={{ 
            width: '620px',
            maxHeight: '70vh',
            transform: 'translateX(-110px) translateY(20px)'
          }}
        />
      </div>

      {/* Bottom Button */}
      <div className="absolute bottom-8 right-6 z-10">
        <Button
          onClick={handleNext}
          className="w-16 h-16 bg-yellow-400 hover:bg-yellow-500 text-black rounded-full flex items-center justify-center shadow-lg"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}