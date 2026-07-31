import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

interface PageTransitionProps {
  children: React.ReactNode;
}

// Shell próprio com scroll interno (ex.: portal aluno)
const fullscreenLockedPages = ["/aluno"];

// Dashboards: sem slide/absolute (evita tela “cortada”), mas com scroll da página
const fullscreenScrollPages = [
  "/dev",
  "/dev/marketing",
  "/painel/estrategico/lancamento",
  "/dashboard/gestao/vista",
  "/gestao-vista",
];

function isFullscreenLocked(path: string) {
  return fullscreenLockedPages.includes(path);
}

function isFullscreenScroll(path: string) {
  return fullscreenScrollPages.includes(path);
}

// Páginas do menu amarelo que NÃO devem ter animação de slide
const menuPages = ["/tdoador", "/sorteio", "/noticias", "/pagamentos", "/central-ajuda", "/perfil", "/beneficios"];

// Definir hierarquia de páginas para determinar direção da animação
const pageHierarchy = {
  "/": 0,
  "/splash": 0,
  "/plans": 1,
  "/register": 2,
  "/donation-flow": 3,
  "/stripe-payment": 4,
  "/entrar": 5,
  "/verify": 6,
  "/tdoador": 10,
  "/administrador": 9,
  "/change-plan": 15,
  "/sorteio": 11,
  "/beneficios": 12,
  "/noticias": 20,
  "/perfil": 14,
  "/dados-cadastrais": 21,
  "/pagamentos": 13,
  "/configuracoes": 22,
  "/sobre": 23,
  "/conselho": 19,
  "/aguardando-aprovacao": 24,
  "/aluno": 25,
  "/patrocinador-dashboard": 26,
  "/central-ajuda": 16,
  "/sorteio-admin": 24,
  "/dev": 25,
};

let previousPath = "/";

export function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();
  const [direction, setDirection] = useState(1);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Aguardar próximo frame para evitar erros de DOM
    const timer = requestAnimationFrame(() => {
      setIsReady(true);
    });
    
    return () => cancelAnimationFrame(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    
    const currentLevel = pageHierarchy[location as keyof typeof pageHierarchy] ?? 0;
    const previousLevel = pageHierarchy[previousPath as keyof typeof pageHierarchy] ?? 0;
    
    // 1 = para frente (direita para esquerda), -1 = para trás (esquerda para direita)
    setDirection(currentLevel > previousLevel ? 1 : -1);
    
    previousPath = location;
  }, [location, isReady]);

  // Verificar se é transição entre páginas do menu amarelo
  const isMenuTransition = menuPages.includes(location) && menuPages.includes(previousPath);

  const variants = {
    enter: (direction: number) => ({
      x: isMenuTransition ? 0 : (direction > 0 ? "100%" : "-100%"),
      opacity: 1,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: isMenuTransition ? 0 : (direction > 0 ? "-100%" : "100%"),
      opacity: isMenuTransition ? 0 : 1,
    }),
  };

  if (!isReady) {
    if (isFullscreenLocked(location)) {
      return <div className="fixed inset-0 overflow-hidden">{children}</div>;
    }
    if (isFullscreenScroll(location)) {
      return <div className="fixed inset-0 overflow-y-auto overscroll-contain">{children}</div>;
    }
    return <div className="absolute inset-0 w-full h-full bg-white">{children}</div>;
  }

  if (isFullscreenLocked(location)) {
    return <div className="fixed inset-0 overflow-hidden">{children}</div>;
  }

  if (isFullscreenScroll(location)) {
    return <div className="fixed inset-0 overflow-y-auto overscroll-contain">{children}</div>;
  }

  return (
    <motion.div
      key={location}
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        type: "tween",
        ease: "easeInOut",
        duration: isMenuTransition ? 0.08 : 0.35,
      }}
      className="absolute inset-0 w-full h-full bg-white"
    >
      {children}
    </motion.div>
  );
}