import { loadStripe } from "@stripe/stripe-js";

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || "pk_test_51RdaS1Qlsea8vAKZC1WmSHcCGXNGGTxJuLZ3iq90MUpeCxq5CUhj5C2QwmHWO008hWIMSaZ0yh75EzrSUpXyvTs6002cYD8L9l";

export const stripePromise = loadStripe(stripePublicKey);

// Note: Agora usamos price_data dinâmico em vez de Price IDs pré-criados
// Isso elimina a necessidade de criar produtos no Stripe Dashboard antecipadamente

export const planPrices = {
  eco: { 
    mensal: { price: 990, display: "R$ 9,90", interval: "month" as const },
    trimestral: { price: 2970, display: "R$ 29,70", interval: "month" as const, interval_count: 3 },
    semestral: { price: 5940, display: "R$ 59,40", interval: "month" as const, interval_count: 6 },
    anual: { price: 11880, display: "R$ 118,80", interval: "month" as const, interval_count: 12 }
  },
  voz: { 
    mensal: { price: 1990, display: "R$ 19,90", interval: "month" as const },
    trimestral: { price: 5970, display: "R$ 59,70", interval: "month" as const, interval_count: 3 },
    semestral: { price: 11940, display: "R$ 119,40", interval: "month" as const, interval_count: 6 },
    anual: { price: 23880, display: "R$ 238,80", interval: "month" as const, interval_count: 12 }
  },
  grito: { 
    mensal: { price: 2990, display: "R$ 29,90", interval: "month" as const },
    trimestral: { price: 8970, display: "R$ 89,70", interval: "month" as const, interval_count: 3 },
    semestral: { price: 17940, display: "R$ 179,40", interval: "month" as const, interval_count: 6 },
    anual: { price: 35880, display: "R$ 358,80", interval: "month" as const, interval_count: 12 }
  },
  platinum: { 
    mensal: { price: 5000, display: "R$ 50,00", interval: "month" as const },
    trimestral: { price: 15000, display: "R$ 150,00", interval: "month" as const, interval_count: 3 },
    semestral: { price: 30000, display: "R$ 300,00", interval: "month" as const, interval_count: 6 },
    anual: { price: 60000, display: "R$ 600,00", interval: "month" as const, interval_count: 12 }
  },
  diamante: { 
    mensal: { price: 10000, display: "R$ 100,00", interval: "month" as const },
    trimestral: { price: 30000, display: "R$ 300,00", interval: "month" as const, interval_count: 3 },
    semestral: { price: 60000, display: "R$ 600,00", interval: "month" as const, interval_count: 6 },
    anual: { price: 120000, display: "R$ 1200,00", interval: "month" as const, interval_count: 12 }
  },
};

export const planDetails = {
  eco: {
    name: "Eco",
    description: "Seu Grito começa a se propagar!",
    subtitle: "Plano básico",
    features: [
      "Acesso básico à plataforma",
      "Suporte por email"
    ],
    icon: "leaf",
    color: "from-green-400 to-green-600",
    periodicities: ["mensal", "trimestral", "semestral", "anual"] as const,
    minCommitment: 6, // meses
  },
  voz: {
    name: "Voz",
    description: "Deixe seu Grito tomar força!",
    subtitle: "Plano intermediário",
    features: [
      "Tudo do plano Eco",
      "Recursos avançados",
      "Suporte prioritário"
    ],
    icon: "volume-up",
    color: "from-yellow-400 to-yellow-600",
    popular: true,
    periodicities: ["mensal", "trimestral", "semestral", "anual"] as const,
    minCommitment: 3, // meses
  },
  grito: {
    name: "O Grito",
    description: "Seu Grito Ecoa por toda parte!",
    subtitle: "Plano premium",
    features: [
      "Tudo dos planos anteriores",
      "Recursos exclusivos",
      "Suporte 24/7"
    ],
    icon: "bullhorn",
    color: "from-red-400 to-red-600",
    periodicities: ["mensal", "trimestral", "semestral", "anual"] as const,
    minCommitment: 3, // meses
  },
  platinum: {
    name: "Platinum",
    description: "Seu impacto, sua escolha!",
    subtitle: "Plano premium",
    features: [
      "Todos os benefícios do Grito +",
      "Créditos extras para sorteios e prêmios",
      "Acesso a experiências de bem-estar (ex.: sessões fitness, cultura, turismo social)",
      "Presentes e produtos oficiais do Grito (Griffte, Outlet Social)",
      "Reconhecimento dentro do app"
    ],
    icon: "crown",
    color: "from-yellow-400 to-yellow-600",
    periodicities: ["mensal", "trimestral", "semestral", "anual"] as const,
    minCommitment: 1, // meses
    special: true, // Flag para indicar estilo especial
  },
  diamante: {
    name: "Diamante",
    description: "O máximo impacto social!",
    subtitle: "Plano exclusivo",
    features: [
      "Todos os benefícios do Platinum +",
      "Experiências exclusivas e premium (viagens sociais, encontros especiais com líderes e artistas)",
      "Convites VIP para os grandes eventos do Instituto (ex: inaugurações, festivais,)",
      "Presentes e produtos oficiais do Grito (Griffte, Outlet Social)",
      "Badge Diamante no perfil com destaque máximo no ranking"
    ],
    icon: "diamond",
    color: "from-gray-800 to-gray-900",
    periodicities: ["mensal", "trimestral", "semestral", "anual"] as const,
    minCommitment: 1, // meses
    special: true, // Flag para indicar estilo especial
  },
};

// Mapeamento de periodicidades para exibição
export const periodicityLabels = {
  mensal: "Mensal",
  trimestral: "Trimestral (3 meses)",
  semestral: "Semestral (6 meses)",
  anual: "Anual (12 meses)"
} as const;
