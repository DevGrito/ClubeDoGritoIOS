import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, MessageCircle, Share, Heart } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface HistoriaInspiradora {
  id: number;
  titulo: string;
  nome: string;
  texto?: string;
  imagemBox?: string;
  imagemStory?: string;
  ativo: boolean;
  ordem: number;
  createdAt: string;
  updatedAt: string;
}

interface Story {
  id: string;
  title: string;
  name: string;
  image: string;
  slides: StorySlide[];
}

interface StorySlide {
  id: string;
  type: 'image' | 'text';
  image?: string;
  title?: string;
  content?: string;
  backgroundColor?: string;
  duration: number; // em segundos
}

interface StoriesViewerProps {
  stories?: Story[];
  initialStoryIndex?: number;
  onClose: () => void;
  useRealData?: boolean; // Flag para usar dados reais do banco
}

// Interface para páginas do carrossel linear
interface Page {
  id: string;
  type: 'image' | 'text';
  image?: string;
  title?: string;
  content?: string;
  backgroundColor?: string;
  duration: number;
  storyIndex: number;
  storyTitle: string;
  storyName: string;
  storyId: string;
  slideIndexInStory: number;
  globalPageIndex: number;
}

// Hook para buscar e converter histórias do banco
const useHistoriasInspiradoras = (useRealData: boolean = false) => {
  const { data: historias = [], isLoading } = useQuery<HistoriaInspiradora[]>({
    queryKey: ['/api/historias-inspiradoras'],
    enabled: useRealData,
    refetchInterval: 30000,
  });

  // Função para quebrar texto longo em múltiplos slides - cortando em pontos finais
  const splitTextIntoSlides = (text: string, maxChars: number = 600): string[] => {
    if (text.length <= maxChars) return [text];
    
    const slides: string[] = [];
    let currentText = text;
    
    while (currentText.length > maxChars) {
      // Procurar o último ponto final antes do limite
      let cutPoint = currentText.lastIndexOf('.', maxChars);
      
      // Se não encontrar ponto final, procurar exclamação ou interrogação
      if (cutPoint === -1) {
        cutPoint = Math.max(
          currentText.lastIndexOf('!', maxChars),
          currentText.lastIndexOf('?', maxChars)
        );
      }
      
      // Se ainda não encontrar nenhuma pontuação, procurar último espaço
      if (cutPoint === -1) {
        cutPoint = currentText.lastIndexOf(' ', maxChars);
      }
      
      // Se não encontrar nem espaço, cortar no limite mesmo
      if (cutPoint === -1) cutPoint = maxChars;
      
      // Adicionar 1 para incluir a pontuação no slide atual
      if (cutPoint < maxChars && (currentText[cutPoint] === '.' || currentText[cutPoint] === '!' || currentText[cutPoint] === '?')) {
        cutPoint += 1;
      }
      
      slides.push(currentText.substring(0, cutPoint).trim());
      currentText = currentText.substring(cutPoint).trim();
    }
    
    // Adicionar o restante se houver
    if (currentText.length > 0) {
      slides.push(currentText);
    }
    
    return slides;
  };

  // Converter histórias do banco para o formato do StoriesViewer
  const convertToStories = (historias: HistoriaInspiradora[]): Story[] => {
    return historias.map(historia => {
      const texto = historia.texto || `A história de ${historia.nome} é uma demonstração real de como o Clube do Grito transforma vidas. Cada doação contribui para mudanças significativas na comunidade.`;
      const textSlides = splitTextIntoSlides(texto, 600); // Limite de 600 caracteres por slide
      
      const slides: StorySlide[] = [
        {
          id: `${historia.id}_1`,
          type: 'image' as const,
          image: historia.imagemStory || '/api/placeholder/300/400',
          title: historia.titulo,
          duration: 5
        }
      ];
      
      // Adicionar slides de texto baseados na quebra
      textSlides.forEach((textPart, index) => {
        slides.push({
          id: `${historia.id}_text_${index + 1}`,
          type: 'text' as const,
          content: textPart,
          backgroundColor: '#FFD700',
          duration: 6
        });
      });
      
      return {
        id: historia.id.toString(),
        title: historia.titulo,
        name: historia.nome,
        image: historia.imagemBox || '/api/placeholder/300/400',
        slides
      };
    });
  };

  return {
    historias,
    stories: convertToStories(historias),
    isLoading
  };
};

// Interface para interações
interface HistoriaInteracoes {
  curtida: boolean;
  comentario: boolean;
  compartilhamento: boolean;
}

// Hook para gerenciar interações do usuário
const useStoryInteractions = (historiaId: number | null, userId: number | null) => {
  const queryClient = useQueryClient();
  
  const { data: interacoes = { curtida: false, comentario: false, compartilhamento: false } } = useQuery<HistoriaInteracoes>({
    queryKey: [`/api/historias-interacoes/${historiaId}/user/${userId}`],
    enabled: !!userId && !!historiaId
  });

  const interactionMutation = useMutation({
    mutationFn: async ({ tipo, acao }: { tipo: 'curtida' | 'comentario' | 'compartilhamento', acao: 'add' | 'remove' }) => {
      if (!userId || !historiaId) throw new Error('Usuário não logado ou história não encontrada');
      
      if (acao === 'add') {
        return apiRequest('/api/historias-interacoes', {
          method: 'POST',
          body: JSON.stringify({
            usuarioId: userId,
            historiaId: historiaId,
            tipo: tipo
          })
        });
      } else {
        return apiRequest('/api/historias-interacoes', {
          method: 'DELETE',
          body: JSON.stringify({
            usuarioId: userId,
            historiaId: historiaId,
            tipo: tipo
          })
        });
      }
    },
    onSuccess: () => {
      // Invalidar cache das interações
      queryClient.invalidateQueries({ 
        queryKey: [`/api/historias-interacoes/${historiaId}/user/${userId}`] 
      });
      // Invalidar cache das estatísticas
      queryClient.invalidateQueries({ 
        queryKey: [`/api/historias-interacoes/${historiaId}/stats`] 
      });
    }
  });

  const toggleInteraction = (tipo: 'curtida' | 'comentario' | 'compartilhamento') => {
    if (!historiaId || !userId) return;
    const jaInteragiu = interacoes[tipo];
    interactionMutation.mutate({
      tipo,
      acao: jaInteragiu ? 'remove' : 'add'
    });
  };

  return {
    interacoes,
    toggleInteraction,
    isLoading: interactionMutation.isPending
  };
};

export default function StoriesViewer({ 
  stories, 
  initialStoryIndex = 0, 
  onClose,
  useRealData = false
}: StoriesViewerProps) {
  // Buscar dados reais se solicitado
  const { stories: realStories, isLoading } = useHistoriasInspiradoras(useRealData);
  
  // Usar dados reais ou mock dependendo da prop
  const finalStories = useRealData ? realStories : (stories || []);
  
  // Obter usuário atual
  const userId = localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')!) : null;
  
  // Se está carregando dados reais, mostrar loading
  if (useRealData && isLoading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        <span className="ml-3 text-white">Carregando histórias...</span>
      </div>
    );
  }
  
  // Se não há histórias, mostrar mensagem
  if (useRealData && finalStories.length === 0) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-lg mb-4">Nenhuma história disponível</p>
          <button 
            onClick={onClose}
            className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  // 🎯 SISTEMA CARROSSEL LINEAR - Achatar todos os slides de todas as histórias
  const allPages = useMemo(() => {
    const pages: Page[] = [];
    let globalIndex = 0;
    
    finalStories.forEach((story, storyIdx) => {
      // Expandir slides longos em múltiplos slides
      const expandedSlides = story.slides.flatMap(slide => {
        if (slide.type === 'text' && slide.content && slide.content.length > 600) {
          const splitTextIntoSlides = (text: string, maxChars: number = 600): string[] => {
            if (text.length <= maxChars) return [text];
            
            const slides: string[] = [];
            let currentText = text;
            
            while (currentText.length > maxChars) {
              let cutPoint = currentText.lastIndexOf('.', maxChars);
              
              if (cutPoint === -1) {
                cutPoint = Math.max(
                  currentText.lastIndexOf('!', maxChars),
                  currentText.lastIndexOf('?', maxChars)
                );
              }
              
              if (cutPoint === -1) {
                cutPoint = currentText.lastIndexOf(' ', maxChars);
              }
              
              if (cutPoint === -1) cutPoint = maxChars;
              
              if (cutPoint < maxChars && (currentText[cutPoint] === '.' || currentText[cutPoint] === '!' || currentText[cutPoint] === '?')) {
                cutPoint += 1;
              }
              
              slides.push(currentText.substring(0, cutPoint).trim());
              currentText = currentText.substring(cutPoint).trim();
            }
            
            if (currentText.length > 0) {
              slides.push(currentText);
            }
            
            return slides;
          };
          
          return splitTextIntoSlides(slide.content, 600).map((chunk, i) => ({
            ...slide,
            id: `${slide.id}-${i}`,
            content: chunk
          }));
        }
        return [slide];
      });
      
      // Criar páginas para cada slide expandido
      expandedSlides.forEach((slide, slideIdx) => {
        pages.push({
          ...slide,
          storyIndex: storyIdx,
          storyTitle: story.title,
          storyName: story.name,
          storyId: story.id,
          slideIndexInStory: slideIdx,
          globalPageIndex: globalIndex
        });
        globalIndex++;
      });
    });
    
    return pages;
  }, [finalStories]);

  // 🎯 CALCULAR PÁGINA INICIAL baseado na história atual
  const startingPageIndex = useMemo(() => {
    let pageIndex = 0;
    for (let i = 0; i < initialStoryIndex; i++) {
      const storyPages = allPages.filter(page => page.storyIndex === i);
      pageIndex += storyPages.length;
    }
    return pageIndex;
  }, [allPages, initialStoryIndex]);

  // Estado do carrossel linear
  const [currentPageIndex, setCurrentPageIndex] = useState(startingPageIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [showReactions, setShowReactions] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comment, setComment] = useState("");

  // Opções de reações disponíveis
  const reactions = [
    { emoji: '😂', label: 'Alegria' },
    { emoji: '😢', label: 'Tristeza' },
    { emoji: '❤️', label: 'Amor' },
    { emoji: '😱', label: 'Surpresa' },
    { emoji: '😡', label: 'Raiva' },
    { emoji: '😍', label: 'Paixão' },
    { emoji: '🥰', label: 'Esperança' },
    { emoji: '💪', label: 'Força' }
  ];
  
  // Refs para controle
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTouchRef = useRef(0);
  
  // Página atual
  const currentPage = useMemo(() => allPages[currentPageIndex], [allPages, currentPageIndex]);
  
  // 🎯 SLIDES DA HISTÓRIA ATUAL (para barras de progresso)
  const currentStoryPages = useMemo(() => {
    if (!currentPage) return [];
    return allPages.filter(page => page.storyIndex === currentPage.storyIndex);
  }, [allPages, currentPage]);
  
  // Índice do slide atual dentro da história atual
  const currentSlideInStory = useMemo(() => {
    if (!currentPage) return 0;
    return currentPage.slideIndexInStory;
  }, [currentPage]);
  
  // Hook para interações com a história atual
  const historiaId = currentPage ? parseInt(currentPage.storyId) : null;
  const { interacoes, toggleInteraction, isLoading: isInteractionLoading } = useStoryInteractions(historiaId, userId);


  // 🎯 NAVEGAÇÃO CARROSSEL LINEAR SIMPLES
  const navigateCarousel = useCallback((direction: 'next' | 'previous') => {
    if (direction === 'next') {
      if (currentPageIndex < allPages.length - 1) {
        setCurrentPageIndex(prev => prev + 1);
        setProgress(0);
      } else {
        // Última página - fechar
        onClose();
      }
    } else {
      if (currentPageIndex > 0) {
        setCurrentPageIndex(prev => prev - 1);
        setProgress(0);
      }
    }
  }, [currentPageIndex, allPages.length, onClose]);

  // Handlers de navegação
  const handleNext = useCallback(() => {
    navigateCarousel('next');
  }, [navigateCarousel]);

  const handlePrevious = useCallback(() => {
    navigateCarousel('previous');
  }, [navigateCarousel]);

  // 🎯 PRÉ-CARREGAMENTO OBRIGATÓRIO - Preload das próximas 2-3 páginas
  useEffect(() => {
    const preloadImages: HTMLImageElement[] = [];
    for (let i = 1; i <= 3; i++) {
      const nextPage = allPages[currentPageIndex + i];
      if (nextPage?.type === 'image' && nextPage.image) {
        const img = new Image();
        img.src = nextPage.image;
        preloadImages.push(img);
      }
    }
    return () => preloadImages.forEach(img => img.src = '');
  }, [currentPageIndex, allPages]);

  // 🎯 AUTO-PROGRESS SIMPLIFICADO
  useEffect(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    if (!isPlaying || !currentPage) return;

    // 🎯 GUARDA DURATION - Evitar divisão por zero, mínimo 5 segundos
    const totalDuration = Math.max(currentPage.duration, 5) * 1000;
    const updateInterval = 50;
    const increment = (updateInterval / totalDuration) * 100;
    
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + increment;
        
        if (newProgress >= 100) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          
          setTimeout(() => {
            navigateCarousel('next');
          }, 0);
          
          return 100;
        }
        return newProgress;
      });
    }, updateInterval);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [currentPageIndex, isPlaying, currentPage, navigateCarousel]);

  const handlePlayPause = useCallback((shouldPlay: boolean) => {
    setIsPlaying(shouldPlay);
  }, []);

  // 🎯 CONTROLES TOUCH SIMPLIFICADOS
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    lastTouchRef.current = Date.now();
    handlePlayPause(false);
    
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY
    };
  }, [handlePlayPause]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handlePlayPause(true);
    
    if (!touchStartRef.current) return;
    
    const touch = e.changedTouches[0];
    const touchEnd = { x: touch.clientX, y: touch.clientY };
    const touchStart = touchStartRef.current;
    
    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = Math.abs(touchEnd.y - touchStart.y);
    
    // Se foi mais movimento vertical que horizontal, ignorar
    if (deltaY > Math.abs(deltaX)) {
      touchStartRef.current = null;
      return;
    }
    
    const touchDuration = Date.now() - lastTouchRef.current;
    
    // Só processar se foi toque rápido (< 300ms) e movimento mínimo
    if (touchDuration < 300 && Math.abs(deltaX) > 20) {
      if (deltaX > 0) {
        // Swipe direita = voltar
        handlePrevious();
      } else {
        // Swipe esquerda = avançar
        handleNext();
      }
    } else if (touchDuration < 300) {
      // Toque simples - usar posição na tela
      const screenWidth = window.innerWidth;
      if (touchEnd.x < screenWidth / 3) {
        handlePrevious();
      } else if (touchEnd.x > (screenWidth * 2) / 3) {
        handleNext();
      }
    }
    
    touchStartRef.current = null;
  }, [handlePlayPause, handleNext, handlePrevious]);

  // Mouse handlers para desktop
  const handleMouseStart = useCallback((e: React.MouseEvent) => {
    handlePlayPause(false);
    touchStartRef.current = {
      x: e.clientX,
      y: e.clientY
    };
    lastTouchRef.current = Date.now();
  }, [handlePlayPause]);

  const handleMouseEnd = useCallback((e: React.MouseEvent) => {
    handlePlayPause(true);
    
    const touchDuration = Date.now() - lastTouchRef.current;
    
    // Só processar cliques rápidos
    if (touchDuration < 300) {
      const screenWidth = window.innerWidth;
      if (e.clientX < screenWidth / 3) {
        handlePrevious();
      } else if (e.clientX > (screenWidth * 2) / 3) {
        handleNext();
      }
    }
    
    touchStartRef.current = null;
  }, [handlePlayPause, handleNext, handlePrevious]);

  // Calcular progresso das barras baseado na história atual
  const calculateProgress = (slideIdx: number) => {
    if (!currentPage) return 0;
    
    if (slideIdx < currentSlideInStory) return 100;
    if (slideIdx > currentSlideInStory) return 0;
    if (slideIdx === currentSlideInStory) {
      return progress;
    }
    return 0;
  };

  // Compartilhar
  const handleShare = async () => {
    // Registrar interação de compartilhamento
    if (userId && historiaId) {
      toggleInteraction('compartilhamento');
    }
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `História: ${currentPage?.storyName}`,
          text: currentPage?.title || 'Confira esta história inspiradora!',
          url: window.location.href
        });
      } catch (error) {
        console.log('Erro ao compartilhar:', error);
      }
    } else {
      // Fallback para dispositivos sem API de compartilhamento
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para área de transferência!');
    }
  };

  // Gerenciar curtidas
  const handleReactionClick = () => {
    if (userId && historiaId) {
      toggleInteraction('curtida');
    }
  };

  const selectReaction = (emoji: string) => {
    setSelectedReaction(selectedReaction === emoji ? null : emoji);
    setShowReactions(false);
    console.log('Reação selecionada:', emoji);
  };

  // Fechar menu de reações ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => {
      if (showReactions) {
        setShowReactions(false);
      }
    };

    if (showReactions) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showReactions]);

  // Enviar comentário
  const handleSubmitComment = () => {
    if (comment.trim()) {
      console.log('Comentário enviado:', comment);
      
      // Registrar interação de comentário
      if (userId && historiaId) {
        toggleInteraction('comentario');
      }
      
      setComment("");
      setShowCommentInput(false);
    }
  };

  if (!currentPage) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col stories-viewer bg-black"
      style={{
        height: '100dvh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'hidden'
      }}
    >
      {/* Barras de progresso - sempre no topo */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="flex space-x-1">
          {currentStoryPages.map((_, slideIdx) => (
            <div key={slideIdx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{ 
                  width: `${calculateProgress(slideIdx)}%` 
                }}
              />
            </div>
          ))}
        </div>
        
        {/* Botão de fechar */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center"
          style={{ touchAction: 'manipulation' }}
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Áreas invisíveis para navegação - acima do conteúdo, abaixo dos controles */}
      <div className="absolute inset-0 z-10 flex pointer-events-none">
        {/* Área esquerda - voltar */}
        <div 
          className="w-1/3 h-full pointer-events-auto"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseStart}
          onMouseUp={handleMouseEnd}
        />
        {/* Área central - sem interação para não interferir com botões */}
        <div className="w-1/3 h-full" />
        {/* Área direita - avançar */}
        <div 
          className="w-1/3 h-full pointer-events-auto"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseStart}
          onMouseUp={handleMouseEnd}
        />
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 relative overflow-visible">
        {/* Verificar se é o primeiro slide para layout especial */}
        {currentSlideInStory === 0 ? (
          /* Layout da capa: imagem ocupando todo o espaço + overlay branco diagonal */
          <>
            {/* Imagem de fundo ocupando toda a tela */}
            {currentPage.image ? (
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${currentPage.image})` }}
              />
            ) : (
              <div className="absolute inset-0 bg-gray-300 flex items-center justify-center">
                <p className="text-gray-600">Imagem não encontrada</p>
              </div>
            )}

            {/* Overlay branco padrão no rodapé - gradiente CSS para linhas retas */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-64"
              style={{
                background: 'linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 30%, rgba(255,255,255,0.5) 60%, rgba(255,255,255,0) 100%)'
              }}
            />
            
            {/* Título posicionado independentemente sobre tudo */}
            <div className="absolute bottom-24 left-6 right-6 z-30">
              <h3 className="text-black text-2xl font-bold leading-tight drop-shadow-sm">
                {currentPage.storyTitle}
              </h3>
            </div>
          </>
        ) : (
          /* Layout padrão para outros slides */
          <>
            {/* Background da imagem ou cor */}
            {currentPage.type === 'image' && currentPage.image ? (
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${currentPage.image})` }}
              />
            ) : (
              <div 
                className="absolute inset-0"
                style={{ backgroundColor: currentPage.backgroundColor || '#FFD700' }}
              />
            )}

            {/* Conteúdo do slide - MAXIMIZANDO ESPAÇO E FONTE */}
            <div className="relative h-full flex flex-col justify-center p-3 pb-20">
              <div className="w-full h-full flex items-center justify-center overflow-y-auto">
                {currentPage.content && (
                  <div 
                    className="text-black text-left w-full"
                    style={{
                      fontSize: '18px',
                      lineHeight: '1.6',
                      maxHeight: '60vh',
                      display: 'flex',
                      alignItems: 'center',
                      maxWidth: '90%',
                      margin: '0 auto',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                      hyphens: 'auto'
                    }}
                  >
                    {currentPage.content}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Indicadores de área de toque (apenas visual de debug - remover em produção) */}
        <div className="absolute inset-0 flex">
          <div className="w-1/3 h-full" />
          <div className="flex-1 h-full" />
          <div className="w-1/3 h-full" />
        </div>
      </div>

      {/* Barra de interação inferior */}
      <div className="absolute bottom-4 left-0 right-0 z-20 px-4">
        <div className="flex items-center justify-around bg-black/50 backdrop-blur-sm rounded-full py-3 px-6">
          {/* Reações */}
          <div className="relative">
            <button 
              onClick={handleReactionClick}
              className={`transition-all duration-200 active:scale-95 p-2 rounded-full ${interacoes.curtida ? 'text-red-500 animate-pulse' : 'text-white/70'}`}
              style={{ touchAction: 'manipulation' }}
              disabled={isInteractionLoading}
            >
              <Heart className={`w-6 h-6 ${interacoes.curtida ? 'fill-red-500' : ''}`} />
            </button>
            
          </div>

          {/* Comentar */}
          <button 
            onClick={() => setShowCommentInput(true)}
            className="text-white/70 transition-all duration-200 active:scale-95 p-2 rounded-full hover:text-white"
            style={{ touchAction: 'manipulation' }}
          >
            <MessageCircle className="w-6 h-6" />
          </button>

          {/* Compartilhar */}
          <button 
            onClick={handleShare}
            className="text-white/70 transition-all duration-200 active:scale-95 p-2 rounded-full hover:text-white"
            style={{ touchAction: 'manipulation' }}
          >
            <Share className="w-6 h-6" />
          </button>
          </div>
        </div>

      {/* Campo de comentário */}
      {showCommentInput && (
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-black/80 backdrop-blur-sm p-4">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Adicione um comentário..."
              className="flex-1 bg-white/20 text-white placeholder-white/70 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/50"
              autoFocus
            />
            <button 
              onClick={handleSubmitComment}
              className="bg-white text-black px-4 py-2 rounded-full font-medium"
              style={{ touchAction: 'manipulation' }}
            >
              Enviar
            </button>
            <button 
              onClick={() => setShowCommentInput(false)}
              className="text-white p-2"
              style={{ touchAction: 'manipulation' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}