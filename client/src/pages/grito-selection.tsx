import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const causas = [
  {
    id: "educacao",
    nome: "Pela Educação"
  },
  {
    id: "cultura",
    nome: "Pela Cultura"
  },
  {
    id: "esporte",
    nome: "Pelo Esporte"
  },
  {
    id: "criancas",
    nome: "Pelas Crianças"
  },
  {
    id: "jovens",
    nome: "Pelos Jovens"
  }
];

// Componente de confete
const Confetti = () => {
  const [windowHeight, setWindowHeight] = useState(800);
  
  useEffect(() => {
    // Verificar se window está disponível (compatibilidade SSR)
    if (typeof window !== 'undefined') {
      setWindowHeight(window.innerHeight);
    }
  }, []);

  const confettiPieces = useMemo(() => 
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 1.5,
      color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][Math.floor(Math.random() * 5)]
    })), []
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: piece.color,
            left: `${piece.left}%`,
            top: '-10px'
          }}
          initial={{ y: -10, opacity: 1, rotate: 0 }}
          animate={{ 
            y: windowHeight + 100, 
            opacity: 0, 
            rotate: 360 * 2,
            x: Math.sin(piece.id) * 50
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  );
};

export default function GritoSelection() {
  const [, setLocation] = useLocation();
  const [selectedCausa, setSelectedCausa] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { toast } = useToast();

  const selectCausa = (causaId: string) => {
    setSelectedCausa(causaId);
  };

  const handleSave = async () => {
    if (!selectedCausa) {
      toast({
        title: "Selecione uma causa",
        description: "Escolha uma causa que você deseja apoiar.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("User ID not found");

      await apiRequest(`/api/users/${userId}/causas`, {
        method: "POST",
        body: JSON.stringify({ causas: [selectedCausa] }),
      });

      toast({
        title: "Suas causas foram salvas!",
        description: "Agora você pode acompanhar o impacto das suas doações.",
        variant: "default",
      });

      // Ativar confete
      setShowConfetti(true);
      
      // Desativar confete e redirecionar após 3 segundos
      setTimeout(() => {
        setShowConfetti(false);
        setLocation("/tdoador");
      }, 3000);
    } catch (error) {
      console.error("Erro ao salvar causas:", error);
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="app-shell relative flex flex-col justify-center bg-gray-100 p-6"
      style={{
        paddingTop: "max(1.5rem, env(safe-area-inset-top, 0px))",
        paddingBottom: "max(6rem, calc(env(safe-area-inset-bottom, 0px) + 5rem))",
      }}
    >
      {/* Title */}
      <div className="mb-8 text-left sm:mb-12">
        <h1 className="mb-6 font-inter text-2xl font-normal leading-tight tracking-normal text-black sm:mb-8 sm:text-3xl">
          Agora me<br />
          conta, qual é<br />
          o seu <span className="font-bold">Grito?</span>
        </h1>
      </div>

      {/* Causas Buttons */}
      <div className="mb-8 space-y-3">
        {causas.map((causa) => (
          <button
            key={causa.id}
            onClick={() => selectCausa(causa.id)}
            className={`w-full rounded-full px-6 py-4 text-center text-base font-medium transition-all duration-200 ${
              selectedCausa === causa.id
                ? "bg-yellow-400 text-black"
                : "bg-gray-800 text-white hover:bg-red-800"
            }`}
          >
            {causa.nome}
          </button>
        ))}
      </div>

      {/* Continue Button */}
      <div
        className="absolute right-6 z-10"
        style={{ bottom: "max(2rem, calc(env(safe-area-inset-bottom, 0px) + 1.5rem))" }}
      >
        <Button
          onClick={handleSave}
          disabled={isLoading || !selectedCausa}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400 text-black shadow-lg hover:bg-yellow-500 disabled:bg-gray-300"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Confetti effect */}
      {showConfetti && <Confetti />}
    </div>
  );
}