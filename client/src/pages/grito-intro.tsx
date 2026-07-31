import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import gritoIllustration from "../app-assets/QUAL ÉSEU GRITO_1756904245577.png";

export default function GritoIntro() {
  const [, setLocation] = useLocation();

  const handleNext = () => {
    setLocation("/grito-selection");
  };

  return (
    <div className="app-shell relative overflow-hidden bg-white">
      {/* Title Section */}
      <div
        className="absolute left-6 z-10"
        style={{ top: "max(3rem, calc(env(safe-area-inset-top, 0px) + 2rem))" }}
      >
        <h1 className="font-inter text-2xl leading-tight tracking-normal text-black sm:text-3xl">
          Que bom ter<br />
          <span className="font-bold">você por aqui!</span>
        </h1>
      </div>

      {/* Illustration - Large and positioned to create "vazado" effect */}
      <div className="absolute inset-0 flex items-end justify-center overflow-hidden">
        <img
          src={gritoIllustration}
          alt="Personagem com megafone"
          className="h-auto max-h-[70dvh] w-[min(155vw,38.75rem)] max-w-none object-contain"
          style={{
            transform: "translateX(-18%) translateY(1.25rem)",
          }}
        />
      </div>

      {/* Bottom Button */}
      <div
        className="absolute right-6 z-10"
        style={{ bottom: "max(2rem, calc(env(safe-area-inset-bottom, 0px) + 1.5rem))" }}
      >
        <Button
          onClick={handleNext}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400 text-black shadow-lg hover:bg-yellow-500"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
