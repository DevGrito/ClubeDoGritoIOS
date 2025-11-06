import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from 'framer-motion';
import phoneIllustration from "@assets/image_1756326888573.png";
import coinIcon from "@assets/image_1756386204050.png";
import communityIllustration from "@assets/image_1756392045123.png";

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

export default function BeneficiosOnboarding() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [userFirstName, setUserFirstName] = useState("");
  const [progressWidth, setProgressWidth] = useState(0);
  const [userPlan, setUserPlan] = useState("eco");

  // Buscar dados do usuário do localStorage
  useEffect(() => {
    const userName = localStorage.getItem("userName");
    const userPlanData = localStorage.getItem("userPlan");
    
    if (userName) {
      const firstName = userName.split(' ')[0];
      setUserFirstName(firstName);
    }
    
    if (userPlanData) {
      setUserPlan(userPlanData);
    }
  }, []);

  // Função para calcular gritos baseado no plano
  const getGritosIniciais = (plano: string): number => {
    const gritosPlanos = {
      'eco': 50,
      'voz': 75,
      'grito': 100,
      'platinum': 150,
      'diamante': 200
    };
    
    return gritosPlanos[plano.toLowerCase()] || 50;
  };

  const gritosIniciais = getGritosIniciais(userPlan);

  // Animar barra de progresso na terceira tela
  useEffect(() => {
    if (currentStep === 2) {
      const timer = setTimeout(() => {
        // Calcular porcentagem baseada nos gritos iniciais (de uma meta de 300 para o próximo nível)
        const progressPercentage = (gritosIniciais / 300) * 100;
        setProgressWidth(progressPercentage);
        // Tocar som de progresso
        playProgressSound();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, gritosIniciais]);

  // Função para tocar som de progresso usando Web Audio API
  const playProgressSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Criar um som de progresso agradável que acompanha a barra (2 segundos)
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configurar o som - frequência que sobe gradualmente durante 2 segundos
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 2.0);
      
      // Configurar volume com fade in/out suave durante os 2 segundos
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.12, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.12, audioContext.currentTime + 1.8);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.0);
      
      // Tocar o som por 2 segundos (mesma duração da animação da barra)
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 2.0);
      
    } catch (error) {
      // Silenciosamente ignorar erros de áudio (caso o navegador não suporte)
      console.log('Audio not supported');
    }
  };

  const handleNext = () => {
    if (currentStep === 0) {
      // Delay para permitir animação de saída
      setTimeout(() => {
        setCurrentStep(1);
        // Ativar confete na segunda tela
        setShowConfetti(true);
        // Desativar confete após 4 segundos
        setTimeout(() => setShowConfetti(false), 4000);
      }, 150);
    } else if (currentStep === 1) {
      // Ir para terceira tela
      setTimeout(() => {
        setCurrentStep(2);
      }, 150);
    } else if (currentStep === 2) {
      // Ir para quarta tela
      setTimeout(() => {
        setCurrentStep(3);
      }, 150);
    } else {
      // Marcar onboarding como completo e ir para tela principal de benefícios
      const userId = localStorage.getItem('userId');
      
      console.log('🎯 FINALIZANDO ONBOARDING - userId:', userId);
      
      // Salvar SEMPRE a chave global primeiro
      localStorage.setItem("viuBoasVindasBeneficios", "true");
      console.log('✅ Chave global salva: viuBoasVindasBeneficios = true');
      
      // Salvar também específico para o usuário SE houver userId
      if (userId && userId !== 'null' && userId !== 'undefined') {
        const userSpecificKey = `viuBoasVindasBeneficios_${userId}`;
        localStorage.setItem(userSpecificKey, "true");
        console.log('✅ Chave específica salva:', userSpecificKey, '= true');
      } else {
        console.warn('⚠️ userId não válido, apenas chave global foi salva');
      }
      
      // Verificar se realmente foi salvo
      const verificacaoGlobal = localStorage.getItem("viuBoasVindasBeneficios");
      const verificacaoUser = userId ? localStorage.getItem(`viuBoasVindasBeneficios_${userId}`) : null;
      console.log('🔍 VERIFICAÇÃO FINAL - Global:', verificacaoGlobal, 'User:', verificacaoUser);
      
      console.log('✅ Onboarding marcado como completo para usuário:', userId);
      
      // Delay para permitir animação de saída
      setTimeout(() => {
        setLocation("/beneficios");
      }, 150);
    }
  };

  const handleBack = () => {
    setTimeout(() => {
      setCurrentStep(currentStep - 1);
    }, 150);
  };

  return (
    <div className="min-h-screen bg-white relative">
      {/* Botão de voltar - só aparece da segunda tela em diante */}
      <AnimatePresence mode="wait">
        {currentStep > 0 && (
          <motion.button
            key={`back-button-${currentStep}`}
            onClick={handleBack}
            className="fixed top-10 left-10 z-50 flex items-center justify-center text-xl"
            style={{
              color: '#000000',
              fontFamily: 'Inter, sans-serif'
            }}
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            whileHover={{ scale: 1.2, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.8, transition: { duration: 0.1 } }}
          >
            {'<'}
          </motion.button>
        )}
      </AnimatePresence>
      
      <AnimatePresence mode="wait">
        {currentStep === 0 ? (
          // Primeira tela - Boas vindas ao Clube do Grito
          <motion.div 
            key="step1"
            className="min-h-screen bg-white flex flex-col px-8"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <div className="pt-48">
              <p 
                className="text-2xl leading-relaxed mb-32 text-left"
                style={{ 
                  color: '#000000', 
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: '1.4'
                }}
              >
                Você acaba de entrar<br />
                no <span className="font-bold">Clube do Grito</span>.
              </p>
              
              <div className="mt-56">
                <button
                  onClick={handleNext}
                  className="px-8 py-3 rounded-2xl font-medium text-lg "
                  style={{
                    backgroundColor: '#FFD700',
                    color: '#000000',
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  Estamos Juntos
                </button>
              </div>
            </div>
          </motion.div>
        ) : currentStep === 1 ? (
          // Segunda tela - Sistema de Gritos
          <motion.div 
            key="step2"
            className="min-h-screen bg-white px-8 pt-8"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            {/* Ilustração do celular */}
            <div className="mb-2 text-center">
              <motion.img 
                src={phoneIllustration} 
                alt="Celular com moeda dourada" 
                className="w-300 h-auto"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              />
            </div>
            
            <div className="mb-16">
              <p 
                className="text-2xl leading-relaxed text-left"
                style={{ 
                  color: '#000000', 
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: '1.4'
                }}
              >
                Aqui você ganha <span className="font-bold">Gritos</span><br />
                (pontos) com suas ações<br />
                e pode trocar.
              </p>
            </div>
            
            <div className="fixed bottom-6 right-6">
              <button
                onClick={handleNext}
                className="bg-yellow-400 text-black px-6 py-3 rounded-full font-medium hover:bg-yellow-500 transition-colors cursor-pointer text-lg"
                style={{
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                Continuar
              </button>
            </div>
          </motion.div>
        ) : currentStep === 2 ? (
          // Terceira tela - Parabéns pelos 50 Gritos
          <motion.div 
            key="step3"
            className="min-h-screen bg-white px-8 pt-8"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <div className="max-w-md mx-auto">
              <p 
                className="text-2xl font-medium mb-8 text-left max-w-xs mx-auto mt-32"
                style={{ 
                  color: '#000000', 
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: '1.4'
                }}
              >
                Parabéns, você ganhou<br />
                <span className="font-bold">{gritosIniciais} Gritos...</span>
              </p>
              
              {/* Barra de progresso tipo bateria */}
              <div className="max-w-xs mx-auto mb-8 mt-32">
                <div className="relative overflow-visible">
                  {/* Barra de fundo cinza */}
                  <div 
                    className="w-full h-20 rounded-2xl relative"
                    style={{ backgroundColor: '#D1D5DB' }}
                  >
                    {/* Barra verde preenchida */}
                    <motion.div 
                      className="h-full rounded-2xl"
                      style={{ backgroundColor: '#10B981' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressWidth}%` }}
                      transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
                    >
                    </motion.div>
                    
                    {/* Moeda dourada na quina superior direita DA BARRA */}
                    <motion.div
                      className="absolute -top-14 -right-14 w-32 h-32 z-10"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 2.5, ease: "easeOut" }}
                    >
                      <img 
                        src={coinIcon}
                        alt="Moeda dourada"
                        className="w-full h-full"
                      />
                    </motion.div>
                  </div>
                </div>
              </div>
              
              <p 
                className="text-2xl leading-relaxed text-left mt-24 mb-8 max-w-xs mx-auto"
                style={{ 
                  color: '#000000', 
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: '1.4'
                }}
              >
                <span className="font-bold">Faltam {300 - gritosIniciais} para</span><br />
                desbloquear seu<br />
                primeiro <span className="font-bold">Selo.</span>
              </p>
            </div>
            
            <div className="fixed bottom-6 right-6">
              <button
                onClick={handleNext}
                className="bg-yellow-400 text-black px-6 py-3 rounded-full font-medium hover:bg-yellow-500 transition-colors cursor-pointer text-lg"
                style={{
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                Continuar
              </button>
            </div>
          </motion.div>
        ) : (
          // Quarta tela - Impacto na Comunidade
          <motion.div 
            key="step4"
            className="min-h-screen bg-white px-8 pt-8"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <div className="max-w-md mx-auto">
              {/* Ilustração da comunidade */}
              <div className="mb-8 text-center mt-24">
                <motion.img 
                  src={communityIllustration} 
                  alt="Pessoas segurando coração - impacto na comunidade" 
                  className="w-full h-auto max-w-sm"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                />
              </div>
              
              <motion.div
                className="mt-24 flex justify-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.0, ease: "easeOut" }}
              >
                <div className="max-w-sm">
                  <p 
                    className="text-2xl text-left"
                    style={{ 
                      color: '#000000', 
                      fontFamily: 'Inter, sans-serif',
                      lineHeight: '1.4'
                    }}
                  >
                    Cada vez que você doa,<br />
                    indica ou compartilha,<br />
                    mais vidas são impactadas.
                  </p>
                </div>
              </motion.div>
            </div>
            
            <div className="fixed bottom-6 right-6">
              <button
                onClick={handleNext}
                className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors cursor-pointer text-lg"
                style={{
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                O importante é continuar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {showConfetti && <Confetti />}
    </div>
  );
}