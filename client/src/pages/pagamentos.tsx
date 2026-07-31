import React, { useEffect, useState } from "react";
import { clearLocalStoragePreservingLgpd } from "@/lib/auth-session";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Logo from "@/components/logo";
import BottomNavigation from "@/components/bottom-navigation";
import { UserAvatar } from "@/components/UserAvatar";
import { Menu, ArrowUpDown, CreditCard, Plus, Trash2, User, Gift, BookOpen, ChevronRight, TrendingUp, Eye, EyeOff, LogOut, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { planPrices } from "@/lib/stripe";
import { useToast } from "@/hooks/use-toast";
import { useUserData } from "@/hooks/useUserData";
import { useProfileImage } from "@/hooks/useProfileImage";
import CreditCardComponent from "@/components/CreditCard";
import AddPaymentMethodFlow from "@/components/AddPaymentMethodFlow";
import DonationHistoryDashboard from "@/components/DonationHistoryDashboard";
import { isLeoByRole } from "@shared/conselho";
import { openPrivacyPreferences } from "@/lib/consentManager";

// Helper para garantir que userId seja sempre número
const getUserId = (userData?: any): number => {
  const id = userData?.id || parseInt(localStorage.getItem("userId") || "0");
  return typeof id === 'number' ? id : parseInt(String(id));
};

// Estado global para sincronização dos cartões entre instâncias
// let globalCards: any[] = [];
// let globalCardUpdateCallbacks: Set<(cards: any[]) => void> = new Set();

// Componente SwipeableCardSelector estilo Tinder
function SwipeableCardSelector({ onCardSelect, showSelectButton = false, instanceId = 'default' }: { 
  onCardSelect: (cardId: string) => void;
  showSelectButton?: boolean;
  instanceId?: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [cards, setCards] = useState<any[]>([]);
  const [visibleCards, setVisibleCards] = useState<Record<string, boolean>>({});
  const [autoSyncAttempted, setAutoSyncAttempted] = useState(false);
  const { toast } = useToast();
  const { userData } = useUserData();
  const queryClient = useQueryClient();

  // Função para toggle da visibilidade do cartão
  const toggleCardVisibility = (cardId: string) => {
    setVisibleCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  // Cores sólidas para os cartões (SEM GRADIENTE)
  const cardColors = [
    "#FFC107", // Amarelo (Clube do Grito)
    "#374151", // Cinza escuro
    "#7c2d12", // Bordô
    "#7C3AED", // Roxo
    "#1D4ED8", // Azul
  ];

  // Buscar cartões reais do usuário - usar getUserId para garantir número
  const userId = getUserId(userData);

  // TRECHO ALTERADO - Query para buscar métodos de pagamento
  const { data: paymentMethodsData, isLoading: isLoadingCards, error: paymentMethodsError, refetch: refetchCards } = useQuery({
      queryKey: ['/api/users', userId, 'payment-methods'],
      queryFn: async () => {
        if (!userId) throw new Error('userId não definido');
        const response = await fetch(`/api/users/${userId}/payment-methods`);
        if (!response.ok) throw new Error('Erro ao buscar payment methods');
        return response.json();
      },
      enabled: !!userId && (typeof userId === 'number' || typeof userId === 'string'),
      retry: 1,
      staleTime: 30_000,
      gcTime: 60_000,
    });


  // Função para atualizar estado local e global
 /* const updateCardsGlobally = (newCards: any[]) => {
    console.log(`🔄 [${instanceId}] Atualizando cartões globalmente:`, newCards);
    globalCards = newCards;
    setCards(newCards);
    
    // Notificar outras instâncias
    globalCardUpdateCallbacks.forEach(callback => {
      if (callback !== updateLocalCards) {
        callback(newCards);
      }
    });
  }; */
  
  // Função para atualizar apenas estado local (quando notificado por outra instância)
  /* const updateLocalCards = (newCards: any[]) => {
    console.log(`📩 [${instanceId}] Recebendo atualização de cartões:`, newCards);
    setCards(newCards);
  }; */
  
  // Registrar callback para sincronização
 /* useEffect(() => {
    globalCardUpdateCallbacks.add(updateLocalCards);
    return () => {
      globalCardUpdateCallbacks.delete(updateLocalCards);
    };
  }, []); */
  
  // Processar cartões reais com gradientes
  useEffect(() => {
    setCards([]);
    setCurrentIndex(0);
    setVisibleCards({});
  }, [userId]);

  useEffect(() => {
        if (!userId) return;

        const pmRaw = (paymentMethodsData as any)?.paymentMethods;
        const methods: any[] = Array.isArray(pmRaw) ? pmRaw : [];

        if (methods.length > 0) {
          // Ordenar: cartão padrão (em uso) primeiro
          const sortedMethods = [...methods].sort((a, b) => {
            if (a.isDefault && !b.isDefault) return -1;
            if (!a.isDefault && b.isDefault) return 1;
            return 0;
          });

          const realCards = sortedMethods.map((pm: any, index: number) => ({
            id: pm.id,
            name: (userData as any)?.nome || 'TITULAR',
            number: `•••• •••• •••• ${pm.last4}`,
            type: pm.brand?.toUpperCase() || 'CARD',
            currency: 'BRL',
            color: cardColors[index % cardColors.length], // COR SÓLIDA
            expiry: `${String(pm.exp_month).padStart(2, '0')}/${String(pm.exp_year).slice(-2)}`,
            funding: pm.funding,
            isDefault: pm.isDefault,
            last4: pm.last4,
            brand: pm.brand,
            exp_month: pm.exp_month,
            exp_year: pm.exp_year,
          }));
          
          // Só atualiza se a lista de IDs dos cartões mudou
          const newIds = realCards.map(c => c.id).join(',');
          const oldIds = cards.map(c => c.id).join(',');
          
          if (newIds !== oldIds) {
            setCards(realCards);
            setCurrentIndex(0); // Só reseta index se cartões realmente mudaram
          }
        }
  }, [paymentMethodsData, userId]);

  // Sincronização automática com Stripe quando não há cartões
  useEffect(() => {
    const autoSyncStripe = async () => {
      // Só tenta sincronizar se:
      // 1. Tem userId válido
      // 2. Não está carregando
      // 3. Não há cartões locais
      // 4. Ainda não tentou sincronizar automaticamente
      if (!userId || isLoadingCards || autoSyncAttempted) {
        return;
      }

      const pmRaw = (paymentMethodsData as any)?.paymentMethods;
      const methods: any[] = Array.isArray(pmRaw) ? pmRaw : [];

      // Se já tem cartões, não precisa sincronizar
      if (methods.length > 0) {
        return;
      }

      setAutoSyncAttempted(true);

      try {
        const response = await apiRequest(`/api/users/${userId}/sync-stripe`, {
          method: 'POST'
        });

        if (response.paymentMethods && response.paymentMethods.length > 0) {
          await refetchCards();
        }
      } catch (error: any) {
        // Silently fail auto-sync
      }
    };

    autoSyncStripe();
  }, [userId, isLoadingCards, paymentMethodsData, autoSyncAttempted, refetchCards]);
    
  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left' && currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (direction === 'right' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const [startX, setStartX] = useState(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setStartX(e.clientX);
    setDragOffset(0);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      const currentX = e.clientX;
      const diff = currentX - startX;
      setDragOffset(diff);
    }
  };

  const handlePointerUp = () => {
    if (isDragging) {
      if (dragOffset > 80) {
        handleSwipe('right');
      } else if (dragOffset < -80) {
        handleSwipe('left');
      }
      setDragOffset(0);
      setIsDragging(false);
    }
  };

  const selectCard = async () => {
    const selected = cards[currentIndex];
    const userId = (userData as any)?.id; // fonte única
    
    if (!userId) {
      toast({
        title: "Erro",
        description: "Usuário não identificado. Tente recarregar a página.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      console.log('🔧 [FRONTEND] Definindo cartão padrão:', selected.id, 'para usuário:', userId);
      
      // Chamar API para definir cartão como padrão
      const response = await apiRequest(`/api/users/${userId}/default-payment-method`, {
        method: 'PUT',
        body: JSON.stringify({ paymentMethodId: selected.id }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.success) {
        onCardSelect(selected.id);
        toast({
          title: "Cartão Principal Alterado",
          description: `${selected.type} ••${selected.number.slice(-4)} é agora seu cartão principal!`,
        });
        
        // Reordenar carrossel: mover cartão selecionado para primeira posição
        const reorderedCards = [selected, ...cards.filter(card => card.id !== selected.id)];
          setCards(reorderedCards);
          setCurrentIndex(0);
  
        await queryClient.invalidateQueries({
          queryKey: ['/api/users', userId, 'payment-methods'],
        });
        
        console.log(`🔄 [${instanceId}] Cartão movido para primeira posição:`, selected.id);
        
        // Invalidar cache para atualizar dados
       await queryClient.invalidateQueries({
        queryKey: ['/api/users', userId, 'payment-methods']
      });
      } else {
        throw new Error('Falha na resposta da API');
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Erro ao definir cartão padrão:', error);
      toast({
        title: "Erro ao Alterar Cartão",
        description: "Não foi possível alterar o cartão principal. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const deleteCard = async (cardId: string) => {
    if (cards.length <= 1) {
      toast({
        title: "Não é possível deletar",
        description: "Você deve ter pelo menos um cartão cadastrado.",
        variant: "destructive"
      });
      return;
    }

    const userId = (userData as any)?.id || localStorage.getItem("userId");
    
    if (!userId) {
      toast({
        title: "Erro",
        description: "Usuário não identificado. Tente recarregar a página.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Chamar API para deletar cartão
      await apiRequest(`/api/users/${userId}/payment-methods/${cardId}`, {
        method: 'DELETE'
      });
      
      // Invalidar cache para atualizar lista de cartões
      await queryClient.invalidateQueries({
        queryKey: ['/api/users', userId, 'payment-methods']
      });
      
      // Remover cartão da lista local
      const updatedCards = cards.filter(card => card.id !== cardId);
      setCards(updatedCards);
      
      // Ajustar currentIndex se necessário
      if (currentIndex >= updatedCards.length) {
        setCurrentIndex(updatedCards.length - 1);
      }
      
      toast({
        title: "Cartão Removido",
        description: "Cartão foi removido com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro ao Remover Cartão",
        description: "Não foi possível remover o cartão. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  if (isLoadingCards) {
    return (
      <div className="space-y-6 py-4">
        <div className="text-center">
          <h3 className="text-lg font-bold text-white mb-2">Seus Cartões</h3>
          <p className="text-sm text-gray-400">Carregando seus cartões...</p>
        </div>
        <div className="relative h-56 mx-auto max-w-sm flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  // REMOVIDO CARTÃO DE EXEMPLO - Sempre buscar do Stripe
  if (cards.length === 0 && !isLoadingCards) {
    return (
      <div className="space-y-6 py-4 relative">
        <div className="text-center">
          <h3 className="text-lg font-bold text-white mb-4">Nenhum Cartão Cadastrado</h3>
          <p className="text-sm text-gray-400 mb-6">Adicione um cartão para continuar</p>
          <div className="w-16 h-16 mx-auto bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 py-2 relative">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-white mb-1">Seus Cartões</h3>
      </div>

      {/* Botão olhinho - Canto superior direito, fora do cartão */}
      <div className="absolute top-0 right-4 z-20">
        <Button
          onClick={() => toggleCardVisibility(cards[currentIndex]?.id)}
          className="w-10 h-10 p-0 bg-transparent hover:bg-gray-200/10 text-black dark:text-white rounded-full"
          size="sm"
        >
          {visibleCards[cards[currentIndex]?.id] ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </Button>
      </div>

      {/* Stack de cartões */}
      <div 
        className="relative h-56 mx-auto max-w-sm cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ touchAction: 'pan-y' }}
      >
        {cards.map((card, index) => {
          const isActive = index === currentIndex;
          const offset = (index - currentIndex) * 8; // 8px para efeito de empilhamento
          const scale = isActive ? 1 : 0.95;
          const opacity = isActive ? 1 : 0.7;
          
          // Z-index corrigido: cartão ativo sempre fica no topo
          const zIndex = isActive ? 999 : cards.length - Math.abs(index - currentIndex);
          
          return (
            <div
              key={card.id}
              className="absolute inset-0 w-full h-full rounded-2xl shadow-md transition-all duration-300"
              style={{
                backgroundColor: card.color, // COR SÓLIDA (sem gradiente)
                transform: `translateX(${offset + (isActive ? dragOffset : 0)}px) scale(${scale})`,
                opacity: opacity,
                zIndex: zIndex,
              }}
            >
              <div className="p-6 text-white h-full flex flex-col justify-between relative select-none" style={{ pointerEvents: 'none' }}>
                {/* Ícone de deletar - só no modal e só se houver mais de 1 cartão */}
                {showSelectButton && cards.length > 1 && isActive && (
                  <div className="absolute top-2 right-2 z-10 pointer-events-auto">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCard(card.id);
                      }}
                      className="w-8 h-8 p-0 bg-red-600/80 hover:bg-red-700 text-white rounded-full backdrop-blur-sm border border-white/20"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                
                {visibleCards[card.id] ? (
                  // CARTÃO VISÍVEL - Mostrar informações reais
                  <>
                    {/* Header do cartão */}
                    <div className="flex justify-between items-start">
                      <div className="flex space-x-1">
                        <div className="w-8 h-8 bg-red-500 rounded-full opacity-90" />
                        <div className="w-8 h-8 bg-yellow-400 rounded-full opacity-90 -ml-3" />
                      </div>
                      <div className="text-right">
                        <div className="text-xs opacity-75">EUR</div>
                        <div className="text-sm font-bold">{card.currency}</div>
                      </div>
                    </div>

                    {/* Número do cartão */}
                    <div className="text-xl font-mono tracking-wider">
                      **** **** **** {card.last4 || card.number?.slice(-4)}
                    </div>

                    {/* Nome do titular e dados adicionais */}
                    <div>
                      <div className="text-sm font-semibold">{card.name?.toUpperCase()}</div>
                      <div className="text-xs opacity-75">
                        {card.type} • Exp: {String(card.exp_month || '12').padStart(2, '0')}/{String(card.exp_year || '28').slice(-2)}
                      </div>
                    </div>
                  </>
                ) : (
                  // CARTÃO OCULTO - Não mostrar NENHUMA informação
                  <>
                    {/* Header vazio */}
                    <div className="flex justify-between items-start">
                      <div className="flex space-x-1">
                        <div className="w-8 h-8 bg-white/20 rounded-full" />
                        <div className="w-8 h-8 bg-white/20 rounded-full -ml-3" />
                      </div>
                      <div className="text-right opacity-0">
                        <div className="text-xs">•</div>
                        <div className="text-sm font-bold">•</div>
                      </div>
                    </div>

                    {/* Número oculto */}
                    <div className="text-xl font-mono tracking-wider">
                      •••• •••• •••• ••••
                    </div>

                    {/* Nome e dados ocultos */}
                    <div>
                      <div className="text-sm font-semibold">••••••••••</div>
                      <div className="text-xs opacity-75">
                        •••• • Exp: ••/••
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Indicadores (bolinhas) - APENAS VISUAL, não clicáveis */}
      <div className="flex justify-center space-x-2 mt-4">
        {cards.map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentIndex ? 'bg-yellow-400' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>

      {/* Botão de seleção - só aparece no modal */}
      {showSelectButton && (
        <div className="flex justify-center mt-4">
          <Button
            onClick={selectCard}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-12 py-3 rounded-full text-sm"
          >
            SELECIONAR ESTE CARTÃO
          </Button>
        </div>
      )}
    </div>
  );
}

// Adicionar cartão: AddPaymentMethodFlow (SetupIntent + paymentMethodId — SEC-006)

// Componente animado para contar números
function AnimatedCounter({ targetValue, delay = 0 }: { targetValue: number; delay?: number }) {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 2000; // 2 segundos
      const steps = 60; // 60 frames para animação suave
      const increment = targetValue / steps;
      let step = 0;

      const interval = setInterval(() => {
        step++;
        const newValue = Math.min(step * increment, targetValue);
        setCurrentValue(Math.round(newValue));
        
        if (step >= steps) {
          clearInterval(interval);
          setCurrentValue(targetValue);
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [targetValue, delay]);

  return <span>{currentValue}</span>;
}

// Componente de Barra Horizontal para Progresso Anual
function ImpactProgressBar({ 
  causaName, 
  progressPercentage, 
  valueContributed, 
  annualValue, 
  color, 
  currentMonth,
  periodicidade = 'monthly'
}: { 
  causaName: string; 
  progressPercentage: number; 
  valueContributed: number; 
  annualValue: number; 
  color: string;
  currentMonth: number;
  periodicidade?: string;
}) {
  // Calcular meses faltando baseado na periodicidade
  const mesesFaltando = 12 - currentMonth;
  
  return (
    <div className="space-y-3">
      {/* Nome da Causa e Porcentagem Animada */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-900">{causaName}</h3>
        <span className="text-sm font-bold text-gray-900">
          <AnimatedCounter targetValue={Math.round(progressPercentage)} delay={500} />%
        </span>
      </div>
      
      {/* Barra de Progresso Animada */}
      <div className="w-full bg-gray-200 rounded-full h-4 relative">
        <motion.div 
          className="h-4 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: "0%" }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ 
            duration: 2, 
            ease: "easeOut",
            delay: 0.5
          }}
        />
      </div>
      
      {/* Informações de Valor */}
      <div className="flex justify-center items-center text-sm">
        <span className="text-gray-600">
          Meta anual: <strong>R$ {annualValue.toFixed(2).replace('.', ',')}</strong>
        </span>
      </div>
      
    </div>
  );
}

// Componente do Gráfico Circular original (manter para compatibilidade)
function CircularProgress({ value, total, color = "#22c55e" }: { value: number; total: number; color?: string }) {
  const percentage = (value / total) * 100;
  const radius = 45;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Progress circle */}
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            R$ {value.toFixed(0)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Pagamentos() {
  const [, setLocation] = useLocation();
  const [showAddCardFlow, setShowAddCardFlow] = useState(false);
  const [showChangeCardModal, setShowChangeCardModal] = useState(false);
  
  // ✅ CSS para remover fundo azul do modal
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      [data-radix-dialog-overlay] {
        background-color: transparent !important;
        backdrop-filter: none !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const { userData } = useUserData();
  const { profileImage } = useProfileImage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const userIsLeo = isLeoByRole(localStorage.getItem('userPapel'));
  // ✅ CORREÇÃO: Declarar userId PRIMEIRO
  const userId = localStorage.getItem("userId");
  
  // Verificar se é usuário Influencer (esconder valores)
  const isInfluencer = userData?.nome === "Influencer" || (userData as any)?.id === 142;
  
  // Verificar se veio da central de ajuda
  const urlParams = new URLSearchParams(window.location.search);
  const fromHelp = urlParams.get('from') === 'help';
  
  // Estado para controlar o menu lateral de ajuda
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  
  // Sempre será anual (sem filtro de período)

  // Buscar payment methods do usuário
  const { data: paymentMethods = [], refetch: refetchPaymentMethods } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      if (!userId) throw new Error("User ID not found");
      
      try {
        const response = await apiRequest(`/api/users/${userId}/payment-methods`);
        return response.paymentMethods || [];
      } catch (error) {
        console.log("Erro ao carregar métodos de pagamento:", error);
        // Retornar um cartão de exemplo para demonstração
        return [{
          id: "demo_card",
          last4: "1234",
          brand: "visa",
          exp_month: 12,
          exp_year: 2028
        }];
      }
    },
  });
  
  // Buscar as causas do usuário
  const { data: userCausas = [] } = useQuery({
    queryKey: ['user-causas', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      try {
        const response = await apiRequest(`/api/users/${userId}/causas`);
        return response.causas || [];
      } catch (error) {
        console.log("Erro ao carregar causas do usuário:", error);
        // Fallback para causas padrão baseado no plano
        return ['cultura', 'esporte'];
      }
    },
    enabled: !!userId
  });

  // userData já vem do hook useUserData, não precisa desse useEffect

  // Mapear planos para display
  const planDisplayNames = {
    eco: "Eco",
    voz: "Voz", 
    grito: "O Grito",
    platinum: "Platinum",
  };

  // Mapeamento de nomes das causas para exibição dinâmica
  const causaDisplayNames = {
    cultura: 'Seu Grito pela Cultura transforma!',
    esporte: 'Seu Grito pelo Esporte transforma!', 
    educacao: 'Seu Grito pela Educação transforma!',
    criancas: 'Seu Grito pelas Crianças transforma!',
    jovens: 'Seu Grito pelos Jovens transforma!',
    meio_ambiente: 'Seu Grito pelo Meio Ambiente transforma!',
    saude: 'Seu Grito pela Saúde transforma!'
  };
  
  // Cores para cada causa
  const causaColors = {
    cultura: '#8B5CF6', // roxo
    esporte: '#22C55E', // verde
    educacao: '#3B82F6', // azul
    criancas: '#F59E0B', // amarelo
    jovens: '#EF4444', // vermelho
    meio_ambiente: '#10B981', // verde claro
    saude: '#EC4899' // rosa
  };
  
  // Buscar dados de impacto dinâmicos do backend (endpoint antigo)
  const { data: backendImpactData, isLoading: impactLoading, error: impactError } = useQuery({
    queryKey: [`/api/users/${userId}/impact-data`],
    enabled: !!userId,
    refetchOnWindowFocus: true,
    staleTime: 0, // Sempre buscar dados frescos
  });

  // 💰 NOVO: Buscar estatísticas de doações do Stripe
  const { data: donationStats, isLoading: donationStatsLoading } = useQuery({
    queryKey: [`/api/users/${userId}/donation-stats`],
    enabled: !!userId,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // SEMPRE buscar dados frescos (bug fix)
  });

  console.log('💰 [DONATION STATS] Dados do Stripe RAW:', JSON.stringify(donationStats, null, 2));
  console.log('💰 [DONATION STATS] totalDoado:', (donationStats as any)?.totalDoado);

  // Combinar dados do backend com causas do usuário
  // PRIORIDADE: Usar dados do Stripe (donationStats) se disponível, senão usar backend antigo
  const periodicidade = (donationStats as any)?.periodicidade || 'monthly';
  
  // Mapear periodicidade para quantidade de períodos no ano e label
  const periodicidadeInfo = {
    monthly: { periodos: 12, label: 'meses' },
    quarterly: { periodos: 4, label: 'trimestres' },
    semiannual: { periodos: 2, label: 'semestres' },
    annual: { periodos: 1, label: 'ano' }
  };
  
  const periodoInfo = periodicidadeInfo[periodicidade as keyof typeof periodicidadeInfo] || periodicidadeInfo.monthly;
  
  const _annualValue  = (donationStats as any)?.metaAnual  ?? (backendImpactData as any)?.annualValue  ?? 0;
  const _contributed  = (donationStats as any)?.totalDoado ?? (backendImpactData as any)?.realDonationsTotal ?? 0;
  const impactData = {
    mainCausa: userCausas.length > 0 ? userCausas[0] : 'cultura',
    annualValue: _annualValue,
    monthlyValue: (donationStats as any)?.valorMensal ?? (backendImpactData as any)?.monthlyContribution ?? 0,
    valueContributed: _contributed,
    valueRemaining: Math.max(0, _annualValue - _contributed),
    progressPercentage: (donationStats as any)?.progresso ?? (backendImpactData as any)?.progressPercentage ?? 0,
    currentMonth: new Date().getMonth() + 1,
    monthsDonated: (donationStats as any)?.mesesDoados ?? 0,
    periodicidade: periodicidade,
    periodosPorAno: periodoInfo.periodos,
    periodoLabel: periodoInfo.label
  };

  // ✅ DEBUG: Log do valor final sendo exibido
  console.log('💰 [IMPACTO DEBUG] Final Value:', impactData.valueContributed);
  
  // Manter compatibilidade (pode remover depois se não usar mais)
  const impactValues = {
    total: impactData.annualValue,
    cultura: impactData.mainCausa === 'cultura' ? impactData.annualValue : 0,
    esporte: impactData.mainCausa === 'esporte' ? impactData.annualValue : 0
  };

  // Função para deletar cartão
  const handleDeleteCard = async (paymentMethodId: string) => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("User ID not found");

      await apiRequest(`/api/users/${userId}/payment-methods/${paymentMethodId}`, {
        method: 'DELETE'
      });

      toast({
        title: "Cartão removido",
        description: "O cartão foi removido com sucesso!",
      });

      refetchPaymentMethods();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover cartão. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="min-h-screen bg-white pb-nav font-inter"
    >
      {/* Header */}
      <header className="bg-white">
        <div className="px-4 pt-12 pb-3 flex items-center">
          {/* Elemento da Esquerda: Menu Hamburger */}
          <div className="w-16 flex justify-start">
            <button 
              onClick={() => setShowHelpMenu(true)}
              className="flex flex-col space-y-1 p-2 items-start"
            >
              <div className="w-6 h-0.5 bg-gray-700"></div>
              <div className="w-4 h-0.5 bg-gray-700"></div>
              <div className="w-6 h-0.5 bg-gray-700"></div>
            </button>
          </div>
          
          {/* Elemento Central: Logo */}
          <div className="flex-1 flex justify-center">
            <Logo size="md" />
          </div>
          
          {/* Elemento da Direita: Perfil do Usuário */}
          <div className="w-16 flex justify-end">
            <div className="flex flex-col items-center">
              {/* Foto de Perfil Circular */}
              <div className="mb-1">
                <UserAvatar 
                  size="md"
                  className="border-2 border-gray-200"
                  onClick={() => setLocation("/dados-cadastrais")}
                  clickable={true}
                />
              </div>
              {/* Badge do Plano */}
              <div className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full flex items-center space-x-1">
                <span>{planDisplayNames[userData.plano as keyof typeof planDisplayNames] || "Eco"}</span>
                <span className="text-orange-500">◆</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-4 md:px-8 md:py-8">
        <div className="space-y-4">
            {/* Nome do Usuário */}
            <div className="mb-2">
              <h1 className="text-xl font-bold text-gray-900 tracking-wide">
                {userData.nome.toUpperCase() || "USUÁRIO"}
              </h1>
            </div>

            {/* Carrossel de Cartões - OCULTAR quando modais estão abertos */}
            {!showAddCardFlow && !showChangeCardModal && (
              <div className="mb-4">
                <SwipeableCardSelector 
                  instanceId="main-carousel"
                  onCardSelect={(cardId) => {
                    console.log('Cartão selecionado no carrossel principal:', cardId);
                  }} />
              </div>
            )}

            {/* Botões de Ação para Cartões */}
            <div className="space-y-3">
                <Dialog onOpenChange={setShowChangeCardModal}>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full bg-gray-800 hover:bg-gray-700 text-white rounded-full px-4 py-2.5 text-sm"
                    >
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      TROCAR CARTÃO
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] bg-transparent border-none shadow-none max-h-[90vh] overflow-y-auto z-[9999]" style={{backgroundColor: 'transparent', zIndex: 9999}}>
                    <style>{`
                      [data-radix-dialog-overlay] {
                        z-index: 9998 !important;
                      }
                      [data-radix-dialog-content] {
                        z-index: 9999 !important;
                      }
                      [data-radix-collection-item] svg {
                        color: white !important;
                      }
                      button[aria-label="Close"] {
                        color: white !important;
                        background-color: rgba(55, 65, 81, 0.8) !important;
                      }
                      button[aria-label="Close"]:hover {
                        color: #FCD34D !important;
                        background-color: rgba(75, 85, 99, 1) !important;
                      }
                    `}</style>
                    <SwipeableCardSelector 
                      instanceId="modal-selector"
                      showSelectButton={true}
                      onCardSelect={async (cardId) => {
                        console.log('🔄 [MODAL] Iniciando troca de cartão:', cardId);
                        
                        const userId = (userData as any)?.id || localStorage.getItem("userId");
                        
                        if (!userId) {
                          toast({
                            title: "Erro",
                            description: "Usuário não identificado. Tente recarregar a página.",
                            variant: "destructive"
                          });
                          return;
                        }
                        
                        try {
                          const response = await apiRequest(`/api/users/${userId}/default-payment-method`, {
                            method: 'PUT',
                            body: JSON.stringify({ paymentMethodId: cardId }),
                            headers: { 'Content-Type': 'application/json' }
                          });

                          if (response.success) {
                            // Fechar modal
                            setShowChangeCardModal(false);
                            
                            // Buscar cartão selecionado dos dados de payment methods
                            const pmData = paymentMethods as any[];
                            const selectedCard = pmData.find((pm: any) => pm.id === cardId);
                            
                            if (selectedCard) {
                              toast({
                                title: "Cartão Principal Alterado",
                                description: `${selectedCard.brand?.toUpperCase()} ••${selectedCard.last4} é agora seu cartão principal!`,
                              });
                              
                              console.log('🎉 [MODAL] Cartão alterado com sucesso:', cardId);
                            }
                            
                            // Invalidar cache para atualizar
                            await queryClient.invalidateQueries({
                              queryKey: ['payment-methods']
                            });
                          } else {
                            throw new Error('Falha na resposta da API');
                          }
                        } catch (error) {
                          console.error('❌ [MODAL] Erro ao definir cartão padrão:', error);
                          toast({
                            title: "Erro ao Alterar Cartão",
                            description: "Não foi possível alterar o cartão principal. Tente novamente.",
                            variant: "destructive"
                          });
                        }
                      }} />
                  </DialogContent>
                </Dialog>
                
                <Button 
                  className="w-full bg-red-900 hover:bg-red-950 text-white rounded-full px-4 py-2.5 text-sm"
                  onClick={() => setShowAddCardFlow(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  ADICIONAR CARTÃO
                </Button>
              </div>

            {/* Seção: Histórico de Doações */}
            <div className="space-y-6">
              <DonationHistoryDashboard 
                userId={parseInt((userData as any)?.id?.toString() || localStorage.getItem("userId") || "0")}
                className="mb-8"
              />
            </div>
            
            {/* Nova Seção: Seu Impacto */}
            <div className="space-y-6">
              {/* Card do Impacto - Estilo botão amarelo */}
              <div className="bg-yellow-400 rounded-2xl p-6">
                <div className="flex justify-between items-start mb-1">
                  <h2 className="text-sm font-medium text-black font-inter">SEU IMPACTO</h2>
                  <span className="text-xs text-black/80 font-medium font-inter">TOTAL DOADO</span>
                </div>
                <div className="text-3xl font-bold text-black font-inter">
                  {isInfluencer ? "---" : `R$ ${impactData.valueContributed.toFixed(2).replace('.', ',')}`}
                </div>
                <div className="mt-2 text-xs text-black/70">
                  {isInfluencer ? "Acesso Influencer" : `Meta anual: R$ ${impactData.annualValue.toFixed(2).replace('.', ',')} (R$ ${impactData.monthlyValue.toFixed(2).replace('.', ',')} × ${impactData.periodosPorAno} ${impactData.periodoLabel})`}
                </div>
              </div>

              {/* Barra de Progresso da Causa Principal - esconde para Influencer */}
              {!isInfluencer && (
              <div className="bg-white p-6 rounded-lg border border-gray-100">
                <ImpactProgressBar
                  causaName={causaDisplayNames[impactData.mainCausa as keyof typeof causaDisplayNames] || impactData.mainCausa.toUpperCase()}
                  progressPercentage={impactData.progressPercentage}
                  valueContributed={impactData.valueContributed}
                  annualValue={impactData.annualValue}
                  color={causaColors[impactData.mainCausa as keyof typeof causaColors] || '#FFD700'}
                  currentMonth={impactData.currentMonth}
                  periodicidade={impactData.periodicidade}
                />
              </div>
              )}

              {/* Banner de Progresso do Ano - Componente Interativo */}
              <div 
                className="bg-yellow-50 p-6 rounded-xl border-2 border-yellow-400 cursor-pointer hover:bg-yellow-100 transition-colors duration-200"
                onClick={() => {
                  toast({
                    title: "Progresso Detalhado",
                    description: "Acompanhe seu impacto mensal e metas na seção Impact!",
                  });
                }}
              >
                <div className="flex items-start space-x-4">
                  <TrendingUp className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
                  <div className="text-sm text-gray-800 leading-relaxed">
                    {isInfluencer ? (
                      <span className="text-gray-700">Você tem acesso Influencer ao app. Obrigado por divulgar o Clube do Grito!</span>
                    ) : (
                      <>
                        Você apoiou o Grito em{' '}
                        <span className="font-semibold text-gray-900">{impactData.monthsDonated} {impactData.monthsDonated === 1 ? 'mês' : 'meses'}</span>{' '}
                        este ano, somando{' '}
                        <span className="font-semibold text-gray-900">R$ {impactData.valueContributed.toFixed(2).replace('.', ',')}</span>.
                        {' '}Faltam{' '}
                        <span className="font-semibold text-gray-900">R$ {impactData.valueRemaining.toFixed(2).replace('.', ',')}</span>{' '}
                        para completar sua meta anual.
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
        </div>
      </main>

      <BottomNavigation />

      {/* Novo fluxo para adicionar cartão */}
      {showAddCardFlow && (
        <div className="fixed inset-0 z-[9999] bg-white">
          <AddPaymentMethodFlow
            userId={(userData as any)?.id?.toString() || localStorage.getItem("userId") || ""}
            onSuccess={() => {
              setShowAddCardFlow(false);
              // Atualizar dados após sucesso
              window.location.reload();
            }}
            onCancel={() => setShowAddCardFlow(false)}
          />
        </div>
      )}

      {/* Menu Lateral de Ajuda */}
      {showHelpMenu && (
        <div className="fixed inset-0 z-[99999]">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowHelpMenu(false)}
          />
          
          {/* Menu Lateral */}
          <motion.div
            initial={{ x: -400 }}
            animate={{ x: 0 }}
            exit={{ x: -400 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute top-0 left-0 h-full w-80 bg-white shadow-lg overflow-y-auto"
          >
            {/* Header do Menu */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-black">Fala {userData.nome?.split(' ')[0] || "Doador"}, tudo bem?</h2>
                <button
                  onClick={() => setShowHelpMenu(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Opções do Menu */}
            <div className="space-y-4 mt-4">
              {/* Perfil */}
              <div>
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                  onClick={() => {
                    setShowHelpMenu(false);
                    setTimeout(() => setLocation("/perfil"), 150);
                  }}
                >
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Perfil
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Mostre quem você é nessa jornada.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
                <div className="border-b border-gray-100 mx-4"></div>
              </div>

              {/* Benefícios */}
              <div>
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                  onClick={() => {
                    setShowHelpMenu(false);
                    setTimeout(() => setLocation("/beneficios"), 150);
                  }}
                >
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <Gift className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Benefícios
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Vantagens que transformam seu dia a dia e o de muitos outros.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
                <div className="border-b border-gray-100 mx-4"></div>
              </div>

              {/* Financeiro */}
              <div>
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                  onClick={() => {
                    setShowHelpMenu(false);
                    setTimeout(() => setLocation("/pagamentos"), 150);
                  }}
                >
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Financeiro
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Transparência para você ver seu impacto.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
                <div className="border-b border-gray-100 mx-4"></div>
              </div>

              {/* Administrador - Apenas para o Leo */}
              {userIsLeo && (
                <div>
                  <div
                    className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                    onClick={() => {
                      setShowHelpMenu(false);
                      setTimeout(() => setLocation('/administrador'), 150);
                    }}
                  >
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                        Administrador
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                        Acesso ao painel administrativo completo.
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                  <div className="border-b border-gray-100 mx-4"></div>
                </div>
              )}

              {/* Privacidade e cookies */}
              <div>
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                  onClick={() => {
                    setShowHelpMenu(false);
                    openPrivacyPreferences();
                  }}
                >
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Privacidade e cookies
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Preferências e leitura dos documentos legais
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
                <div className="border-b border-gray-100 mx-4"></div>
              </div>

              {/* Deslogar */}
              <div>
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => {
                    setShowHelpMenu(false);
                    toast({
                      title: "Saindo da conta",
                      description: "Você será desconectado...",
                    });
                    clearLocalStoragePreservingLgpd();
                    sessionStorage.clear();
                    setTimeout(() => window.location.href = "/entrar", 1000);
                  }}
                >
                  <LogOut className="w-6 h-6 text-gray-700 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Deslogar
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Saindo agora, mas seu impacto continua.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}