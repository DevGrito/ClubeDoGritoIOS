import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface CreditCardProps {
  cardNumber?: string;
  holderName?: string;
  expiryDate?: string;
  cvv?: string;
  className?: string;
}

// Função para detectar a bandeira do cartão
const detectCardBrand = (cardNumber: string): string => {
  const number = cardNumber.replace(/\s/g, '');
  
  if (/^4/.test(number)) return 'visa';
  if (/^5[1-5]|^2[2-7]/.test(number)) return 'mastercard';
  if (/^3[47]/.test(number)) return 'amex';
  if (/^6/.test(number)) return 'discover';
  if (/^636368|^438935|^504175|^451416|^636297/.test(number)) return 'elo';
  if (/^50/.test(number)) return 'aura';
  
  return 'generic';
};

// Função para formatar número do cartão
const formatCardNumber = (number: string): string => {
  const cleaned = number.replace(/\s/g, '').replace(/\*/g, '');
  
  // Se já está mascarado, retorna como está
  if (number.includes('*')) {
    return number;
  }
  
  const match = cleaned.match(/.{1,4}/g);
  return match ? match.join(' ') : number;
};

// Função para mascarar número do cartão
const maskCardNumber = (number: string): string => {
  // Se já está mascarado, retorna como está
  if (number.includes('*')) {
    return number;
  }
  
  const cleaned = number.replace(/\s/g, '');
  if (cleaned.length >= 4) {
    return `**** **** **** ****`;
  }
  return number;
};

// Componente do ícone do chip
const ChipIcon = () => (
  <div className="w-12 h-8 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-md relative overflow-hidden">
    <div className="absolute inset-1 bg-gradient-to-br from-yellow-400 to-yellow-700 rounded-sm">
      <div className="grid grid-cols-3 grid-rows-2 gap-0.5 p-1 h-full">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-yellow-800 rounded-[1px]" />
        ))}
      </div>
    </div>
  </div>
);

// Componente dos logos das bandeiras
const CardBrandLogo = ({ brand }: { brand: string }) => {
  const logos = {
    visa: (
      <div className="text-white font-bold text-lg tracking-wider">VISA</div>
    ),
    mastercard: (
      <div className="flex space-x-1">
        <div className="w-6 h-6 bg-red-500 rounded-full opacity-90" />
        <div className="w-6 h-6 bg-yellow-400 rounded-full opacity-90 -ml-3" />
      </div>
    ),
    amex: (
      <div className="text-white font-bold text-sm">AMEX</div>
    ),
    elo: (
      <div className="text-white font-bold text-sm">ELO</div>
    ),
    discover: (
      <div className="text-white font-bold text-sm">DISCOVER</div>
    ),
    aura: (
      <div className="text-white font-bold text-sm">AURA</div>
    ),
    generic: (
      <div className="w-8 h-5 bg-gray-400 rounded opacity-50" />
    )
  };
  
  return logos[brand as keyof typeof logos] || logos.generic;
};

// Padrão geométrico como componente SVG - triângulos sobrepostos
const GeometricPattern = () => (
  <svg 
    className="absolute inset-0 w-full h-full" 
    viewBox="0 0 400 250"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <linearGradient id="triangleGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
      </linearGradient>
      <linearGradient id="triangleGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
      </linearGradient>
    </defs>
    
    {/* Triângulos grandes sobrepostos */}
    <polygon points="0,0 200,0 100,120" fill="url(#triangleGrad1)" />
    <polygon points="150,0 400,0 300,150" fill="url(#triangleGrad2)" />
    <polygon points="0,100 150,100 75,200" fill="url(#triangleGrad1)" />
    <polygon points="200,80 400,80 350,200" fill="url(#triangleGrad2)" />
    <polygon points="50,180 250,180 150,250" fill="url(#triangleGrad1)" />
    <polygon points="300,150 400,150 400,250" fill="url(#triangleGrad2)" />
  </svg>
);

const CreditCard: React.FC<CreditCardProps> = ({
  cardNumber = "1234 5678 9012 3456",
  holderName = "JOÃO SILVA",
  expiryDate = "12/28",
  cvv = "123",
  className = ""
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showNumber, setShowNumber] = useState(false);
  
  // Detectar se o número já está mascarado
  const isAlreadyMasked = cardNumber.includes('*');
  const cardBrand = detectCardBrand(cardNumber.replace(/\*/g, '1')); // Para detectar a bandeira mesmo com asterisco
  
  // Lógica de exibição do número
  let displayNumber;
  if (isAlreadyMasked) {
    // Se já está mascarado, só mostra completo se showNumber for true
    if (showNumber) {
      // Se showNumber é true, mostra um número fictício formatado
      displayNumber = "1234 5678 9012 " + cardNumber.slice(-4);
    } else {
      displayNumber = "**** **** **** ****";
    }
  } else {
    // Se não está mascarado, funciona normalmente
    displayNumber = showNumber ? formatCardNumber(cardNumber) : maskCardNumber(cardNumber);
  }

  return (
    <div className={`perspective-1000 ${className}`}>
      <motion.div
        className="relative w-80 h-48 cursor-pointer preserve-3d"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        onClick={() => setIsFlipped(!isFlipped)}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Frente do cartão */}
        <div 
          className="absolute inset-0 w-full h-full rounded-2xl backface-hidden"
          style={{ 
            background: "linear-gradient(135deg, #dc2626 0%, #e11d48 25%, #be185d 50%, #9d174d 75%, #7c2d12 100%)",
            backfaceVisibility: "hidden"
          }}
        >
          {/* Padrão geométrico */}
          <GeometricPattern />
          
          {/* Botão olho para ocultar/mostrar número */}
          <button
            className="absolute top-4 right-12 text-white hover:text-gray-300 transition-colors z-20 bg-black/20 rounded-full p-2"
            onClick={(e) => {
              e.stopPropagation();
              setShowNumber(!showNumber);
            }}
          >
            {showNumber ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          
          {/* Número do cartão */}
          <div className="absolute top-16 left-6">
            <div className="text-white text-base font-mono tracking-wider font-medium">
              {displayNumber}
            </div>
          </div>
          
          {/* Informações na parte inferior - sem títulos */}
          <div className="absolute bottom-8 left-6 right-6 flex justify-between">
            {/* Nome do portador - sem título */}
            <div className="flex-1">
              <div className="text-white text-xs font-medium uppercase tracking-wide">
                {holderName}
              </div>
            </div>
            
            {/* Data de validade - sem título */}
            <div className="text-right">
              <div className="text-white text-xs font-medium">
                {expiryDate}
              </div>
            </div>
          </div>
          
        </div>

        {/* Verso do cartão */}
        <div 
          className="absolute inset-0 w-full h-full rounded-2xl backface-hidden"
          style={{ 
            background: "linear-gradient(135deg, #dc2626 0%, #e11d48 25%, #be185d 50%, #9d174d 75%, #7c2d12 100%)",
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
        >
          {/* Padrão geométrico */}
          <GeometricPattern />
          
          {/* Tarja magnética */}
          <div className="absolute top-8 left-0 right-0 h-12 bg-black opacity-80" />
          
          {/* Área da assinatura e CVV */}
          <div className="absolute bottom-20 left-6 right-6">
            <div className="bg-white h-10 rounded flex items-center justify-end px-3 mb-4">
              <div className="text-black font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {cvv}
              </div>
            </div>
            
            <div className="text-gray-300 text-xs">
              Este cartão é propriedade do Clube do Grito e deve ser utilizado apenas pelo portador autorizado.
            </div>
          </div>
          
          {/* Logo da bandeira (verso) */}
          <div className="absolute bottom-6 right-6 flex items-center">
            <CardBrandLogo brand={cardBrand} />
          </div>
          
          {/* Logo "ECO" no verso */}
          <div className="absolute bottom-6 left-6 text-white font-bold text-sm opacity-60">
            ECO
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CreditCard;