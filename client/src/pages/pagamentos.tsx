import React, { useEffect, useState } from "react";
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
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements, PaymentRequestButtonElement } from "@stripe/react-stripe-js";

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

  // Estado de erro removido - continuando sem exibir erro para cartões

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

// Inicializar Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

// Apple Pay REMOVIDO do modal de adicionar cartão 
// MOTIVO: Apple Pay não funciona com amount: 0 (Setup Intent)
// Apple Pay permanece disponível apenas no fluxo de doação onde há valor real

// Componente interno com PaymentElement MODERNO
function StripeCardForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userData } = useUserData();
  const userId = getUserId(userData); // Usar helper para garantir número
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      if (!userId) {
        throw new Error("Usuário não encontrado");
      }

      console.log('🔧 [PAYMENT ELEMENT] Criando payment method...');

      // Confirmar setup intent usando PaymentElement moderno
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required'
      });

      if (error) {
        throw new Error(error.message || 'Erro ao processar cartão');
      }

      if (setupIntent?.status === 'succeeded' && setupIntent.payment_method) {
        console.log('✅ [PAYMENT ELEMENT] Setup intent confirmado:', setupIntent.id);
        console.log('✅ [PAYMENT ELEMENT] Payment method criado:', setupIntent.payment_method);

        // Agora enviar apenas o ID para o backend
        const response = await apiRequest('/api/users/' + userId + '/payment-methods', {
          method: 'POST',
          body: JSON.stringify({ paymentMethodId: setupIntent.payment_method }),
          headers: { 'Content-Type': 'application/json' }
        });

      if (response.ok) {
        toast({
          title: "Cartão Adicionado",
          description: "Seu novo cartão foi salvo com segurança!",
        });

        // Invalidar cache para atualizar lista de cartões
        await queryClient.invalidateQueries({ 
          queryKey: ['/api/users', userId, 'payment-methods'] 
        });

        // Limpar formulário (PaymentElement não tem método clear)
        // Note: PaymentElement is automatically cleared after successful setup
        } else {
          throw new Error('Erro ao salvar cartão no servidor');
        }
      } else {
        throw new Error('Setup Intent não foi confirmado corretamente');
      }

    } catch (error: any) {
      console.error('❌ [PAYMENT ELEMENT] Erro:', error);
      toast({
        title: "Erro ao Adicionar Cartão",
        description: error.message || "Não foi possível salvar o cartão. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white">
      <div className="px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold mb-3" style={{ color: '#000000', fontFamily: 'Inter' }}>
            Adicionar novo cartão
          </h1>
          <p className="text-sm" style={{ color: '#666666', fontFamily: 'Inter' }}>
            Preencha os dados do seu cartão para adicionar como opção de pagamento.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PaymentElement MODERNO - Layout vertical automático */}
          <div className="rounded-xl p-6" style={{ backgroundColor: '#FFFFFF' }}>
            <PaymentElement
              onChange={(event) => {
                setIsReady(event.complete);
              }}
            />
          </div>

          {/* Ícone de segurança - IGUAL AO FLUXO DE DOAÇÃO */}
          <div className="flex items-center justify-center mt-6 text-sm" style={{ color: '#666666' }}>
            <span className="mr-2">🛡️</span>
            Seus dados estão seguros com criptografia Stripe
          </div>

          {/* Botão de ação - IGUAL AO FLUXO DE DOAÇÃO */}
          <button
            type="submit"
            disabled={!isReady || isLoading}
            className="w-full h-12 rounded-xl font-medium transition-all duration-300 mt-6"
            style={{
              backgroundColor: isReady && !isLoading ? '#FFD700' : '#E5E5E5',
              color: isReady && !isLoading ? '#000000' : '#999999',
              fontFamily: 'Inter'
            }}
          >
            {isLoading ? 'Adicionando...' : 'Adicionar cartão'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Componente wrapper com Elements Provider - PaymentElement precisa de clientSecret
function AddCardForm() {
  const [clientSecret, setClientSecret] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Criar um SetupIntent para adicionar cartão sem cobrança
    const createSetupIntent = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) return;

        // Criar setup intent para adicionar cartão
        const response = await fetch('/api/users/' + userId + '/setup-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ [SETUP INTENT] Dados recebidos:', data);
          
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          } else {
            console.error('❌ [SETUP INTENT] ClientSecret não encontrado na resposta');
          }
        } else {
          console.error('❌ [SETUP INTENT] Erro na resposta:', response.status);
        }
      } catch (error) {
        console.error('Erro ao criar setup intent:', error);
      } finally {
        setIsLoading(false);
      }
    };

    createSetupIntent();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full bg-white flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p style={{ color: '#666666', fontFamily: 'Inter' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="w-full bg-white flex items-center justify-center py-20">
        <div className="text-center">
          <p style={{ color: '#666666', fontFamily: 'Inter' }}>Erro ao carregar formulário de pagamento</p>
        </div>
      </div>
    );
  }

  return (
    <Elements 
      stripe={stripePromise} 
      options={{ 
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#FFD700',
            colorBackground: '#ffffff',
            colorText: '#000000',
            fontFamily: 'Inter, sans-serif',
            spacingUnit: '4px',
            borderRadius: '12px'
          }
        }
      }}
    >
      <StripeCardForm />
    </Elements>
  );
}

// Componente antigo com preview (mantenho para backup)
function AddCardFormOld() {
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  const [isFlipped, setIsFlipped] = useState(false);
  const { toast } = useToast();
  const { userData } = useUserData();
  const queryClient = useQueryClient();

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const validateExpiry = (expiry: string) => {
    if (!expiry || expiry.length !== 5) return false;
    const [month, year] = expiry.split('/');
    const monthNum = parseInt(month);
    const yearNum = parseInt('20' + year);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    if (monthNum < 1 || monthNum > 12) return false;
    if (yearNum < currentYear) return false;
    if (yearNum === currentYear && monthNum < currentMonth) return false;
    if (yearNum > currentYear + 20) return false; // Máximo 20 anos no futuro
    
    return true;
  };

  const displayCardNumber = () => {
    if (!cardData.number) return '•••• •••• •••• ••••';
    const cleanNumber = cardData.number.replace(/\s/g, '');
    const formatted = cleanNumber.padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim();
    return formatted;
  };

  const displayName = () => {
    return cardData.name || 'SEU NOME AQUI';
  };

  const displayExpiry = () => {
    return cardData.expiry || '••/••';
  };

  const detectCardBrand = (number: string) => {
    const cleanNumber = number.replace(/\s/g, '');
    if (/^4/.test(cleanNumber)) return 'visa';
    if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber)) return 'mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'amex';
    if (/^6(?:011|5)/.test(cleanNumber)) return 'discover';
    if (/^50[0-9]/.test(cleanNumber)) return 'elo';
    return 'visa';
  };

  const getBrandName = (brand: string) => {
    const names = {
      visa: 'VISA',
      mastercard: 'MASTERCARD',
      amex: 'AMEX',
      discover: 'DISCOVER',
      elo: 'ELO'
    };
    return names[brand as keyof typeof names] || 'VISA';
  };

  const currentBrand = detectCardBrand(cardData.number);

  return (
    <div className="space-y-4 py-4">
      {/* Formulário de cartão */}
      <div className="grid grid-cols-1 gap-4">
        {/* Número do cartão */}
        <div>
          <label className="text-sm text-gray-300 mb-2 block">Número do cartão</label>
          <input
            type="text"
            placeholder="4716 8039 0213 1234"
            value={cardData.number}
            onChange={(e) => {
              const formatted = formatCardNumber(e.target.value);
              if (formatted.length <= 19) {
                setCardData(prev => ({ ...prev, number: formatted }));
              }
            }}
            className="w-full p-3 bg-gray-800 border-2 border-purple-500 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
            maxLength={19}
          />
        </div>
        
        {/* Nome do titular */}
        <div>
          <label className="text-sm text-gray-300 mb-2 block">Nome do titular</label>
          <input
            type="text"
            placeholder="Nome como está no cartão"
            value={cardData.name}
            onChange={(e) => setCardData(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
          />
        </div>
        
        {/* Validade e CVV */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Validade</label>
            <input
              type="text"
              placeholder="mm/aa"
              value={cardData.expiry}
              onChange={(e) => {
                const formatted = formatExpiry(e.target.value);
                if (formatted.length <= 5) {
                  setCardData(prev => ({ ...prev, expiry: formatted }));
                }
              }}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
              maxLength={5}
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block flex items-center gap-1">
              CVV 
              <span className="text-gray-400 text-xs">ⓘ</span>
            </label>
            <input
              type="text"
              placeholder="•••"
              value={cardData.cvv}
              onFocus={() => setIsFlipped(true)}
              onBlur={() => setIsFlipped(false)}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                if (value.length <= 4) {
                  setCardData(prev => ({ ...prev, cvv: value }));
                }
              }}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
              maxLength={4}
            />
          </div>
        </div>

        {/* Preview do cartão */}
        <div className="flex flex-col items-center mt-4">
          <div 
            className="relative w-full max-w-sm h-48"
            style={{ perspective: '1000px' }}
          >
            <div 
              className="relative w-full h-full transition-transform duration-700 preserve-3d"
              style={{ 
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
            >
              {/* Frente do cartão */}
              <div 
                className="absolute inset-0 w-full h-full rounded-xl p-5 text-white shadow-lg"
                style={{ 
                  background: "linear-gradient(135deg, #dc2626 0%, #e11d48 25%, #be185d 50%, #9d174d 75%, #7c2d12 100%)",
                  backfaceVisibility: "hidden"
                }}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="text-sm font-semibold">{getBrandName(currentBrand)}</div>
                  <div className="text-xs">ⓘ</div>
                </div>
                <div className="space-y-3">
                  <div className="text-base font-mono tracking-wider">
                    {displayCardNumber()}
                  </div>
                  <div className="text-sm">
                    <div className="text-xs text-gray-200">{displayName()}</div>
                    <div className="text-xs">{displayExpiry()}</div>
                  </div>
                </div>
              </div>

              {/* Verso do cartão */}
              <div 
                className="absolute inset-0 w-full h-full rounded-xl p-5 text-white shadow-lg"
                style={{ 
                  background: "linear-gradient(135deg, #dc2626 0%, #e11d48 25%, #be185d 50%, #9d174d 75%, #7c2d12 100%)",
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)"
                }}
              >
                <div className="h-8 bg-black mt-4 mb-4"></div>
                <div className="bg-white text-black text-center py-1 rounded text-sm font-mono">
                  CVV: {cardData.cvv || '•••'}
                </div>
                <div className="text-xs text-gray-200 mt-4 text-center">
                  Código de segurança
                </div>
              </div>
            </div>
          </div>
          
          {/* Ícone de segurança */}
          <div className="flex items-center justify-center mt-3 text-green-400 text-sm">
            <span className="mr-2">🛡️</span>
            Seus dados estão seguros
          </div>
        </div>

        {/* Validação de data */}
        {cardData.expiry && !validateExpiry(cardData.expiry) && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mt-2">
            <p className="text-red-400 text-sm">
              ⚠️ A data de validade deve ser do mês atual ou posterior
            </p>
          </div>
        )}

        {/* Debug das validações */}
        <div className="text-xs text-gray-400 mt-2 space-y-1">
          <div>Número: {cardData.number ? '✓' : '✗'} ({cardData.number ? 'OK' : 'VAZIO'})</div>
          <div>Nome: {cardData.name ? '✓' : '✗'} ({cardData.name ? 'OK' : 'VAZIO'})</div>
          <div>Data válida: {validateExpiry(cardData.expiry) ? '✓' : '✗'} ({cardData.expiry})</div>
          <div>CVV: {cardData.cvv ? '✓' : '✗'} ({cardData.cvv ? 'OK' : 'VAZIO'})</div>
          <div>LocalStorage UserID: {localStorage.getItem("userId") ? '✓' : '✗'} ({localStorage.getItem("userId")})</div>
        </div>

        {/* Botão de ação */}
        <Button 
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 rounded-xl text-base mt-4 disabled:bg-gray-600 disabled:text-gray-400"
          disabled={!cardData.number || !cardData.name || !validateExpiry(cardData.expiry) || !cardData.cvv || !localStorage.getItem("userId")}
          onClick={async () => {
            try {
              const userId = localStorage.getItem("userId");
              if (!userId) {
                toast({
                  title: "Erro",
                  description: "Usuário não encontrado",
                  variant: "destructive"
                });
                return;
              }
              
              console.log('🔧 [FRONTEND] Enviando dados do cartão para API:', {
                userId,
                cardNumber: '****',
                cardholderName: cardData.name,
                expiry: cardData.expiry
              });

              // Salvar cartão no banco via Stripe
              const response = await apiRequest('/api/payment-methods', {
                method: 'POST',
                body: JSON.stringify({
                  cardNumber: cardData.number.replace(/\s/g, ''),
                  expiryMonth: cardData.expiry.split('/')[0],
                  expiryYear: '20' + cardData.expiry.split('/')[1],
                  cvc: cardData.cvv,
                  cardholderName: cardData.name,
                  userId: userId
                }),
                headers: { 'Content-Type': 'application/json' }
              });

              const result = await response.json();
              
              console.log('✅ [FRONTEND] Resposta da API:', result);
              
              if (!result.success) {
                throw new Error(result.message || 'Erro ao adicionar cartão');
              }
              
              toast({
                title: "Cartão Adicionado",
                description: "Seu novo cartão foi salvo com segurança!",
              });
              
              // Invalidar cache para atualizar lista de cartões
              await queryClient.invalidateQueries({ 
                queryKey: ['/api/users', userId, 'payment-methods'] 
              });
              
              // Limpar formulário
              setCardData({ number: '', name: '', expiry: '', cvv: '' });
              setIsFlipped(false);
            } catch (error: any) {
              toast({
                title: "Erro ao Adicionar Cartão",
                description: "Não foi possível salvar o cartão. Tente novamente.",
                variant: "destructive"
              });
            }
          }}
        >
          Adicionar cartão
        </Button>
      </div>
    </div>
  );
}

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
      
      {/* Informação do Mês */}
      <div className="text-xs text-gray-500 text-center">
        Mês {currentMonth}/12 • Faltam {mesesFaltando} {mesesFaltando === 1 ? 'mês' : 'meses'} para completar o ano
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
  
  // ✅ CORREÇÃO: Declarar userId PRIMEIRO
  const userId = localStorage.getItem("userId");
  
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
  
  const impactData = {
    mainCausa: userCausas.length > 0 ? userCausas[0] : 'cultura',
    annualValue: (donationStats as any)?.metaAnual || (backendImpactData as any)?.annualValue || 118.80,
    monthlyValue: (donationStats as any)?.valorMensal || (backendImpactData as any)?.monthlyContribution || 9.90,
    valueContributed: (donationStats as any)?.totalDoado || (backendImpactData as any)?.realDonationsTotal || 0,
    valueRemaining: ((donationStats as any)?.metaAnual || (backendImpactData as any)?.annualValue || 118.80) - ((donationStats as any)?.totalDoado || (backendImpactData as any)?.realDonationsTotal || 0),
    progressPercentage: (donationStats as any)?.progresso || (backendImpactData as any)?.progressPercentage || 0,
    currentMonth: (donationStats as any)?.mesesFaltando !== undefined ? (12 - (donationStats as any).mesesFaltando) : ((backendImpactData as any)?.currentMonth || 9),
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
      className="min-h-screen bg-white pb-20 font-inter"
    >
      {/* Header */}
      <header className="bg-white">
        <div className="px-4 py-3 flex items-center">
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
                  R$ {impactData.valueContributed.toFixed(2).replace('.', ',')}
                </div>
                <div className="mt-2 text-xs text-black/70">
                  Meta anual: R$ {impactData.annualValue.toFixed(2).replace('.', ',')} (R$ {impactData.monthlyValue.toFixed(2).replace('.', ',')} × {impactData.periodosPorAno} {impactData.periodoLabel})
                </div>
              </div>

              {/* Barra de Progresso da Causa Principal */}
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
                    <span className="font-bold text-gray-900">Progresso do ano:</span> Seu impacto atual é de{' '}
                    <span className="font-semibold text-gray-900">R$ {impactData.valueContributed.toFixed(2).replace('.', ',')}</span>{' '}
                    em {impactData.currentMonth} {impactData.currentMonth === 1 ? 'mês' : 'meses'}. Faltam{' '}
                    <span className="font-semibold text-gray-900">R$ {impactData.valueRemaining.toFixed(2).replace('.', ',')}</span>{' '}
                    para completar sua meta anual.
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
              {(() => {
                console.log('🔍 [PAGAMENTOS] userData.role:', userData.role, 'isLeo:', userData.role === 'leo');
                return userData.role === 'leo';
              })() && (
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

              {/* Termos de Uso */}
              <div>
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                  onClick={() => {
                    setShowHelpMenu(false);
                    setTimeout(() => setLocation('/termos-servicos?from=help'), 150);
                  }}
                >
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Termos de Uso
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      Segurança e clareza em cada passo.
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
                    localStorage.clear();
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