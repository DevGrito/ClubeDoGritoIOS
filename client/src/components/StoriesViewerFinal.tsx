import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { X } from "lucide-react";
import megafoneIcon from '@assets/MEGAFONE SEM FUNDO_Prancheta 1_1756835037939.png';

interface Story {
  id: number;
  title: string;
  name: string;
  image: string;
  slides: Array<{
    id: string;
    type: 'image' | 'text';
    image?: string;
    title: string;
    content?: string;
    backgroundColor?: string;
    duration: number;
  }>;
}

interface StoriesViewerProps {
  stories: Story[];
  currentStoryIndex: number;
  onClose: () => void;
  onStoryChange: (index: number) => void;
}

// Interface para páginas do carrossel linear
interface Page {
  id: string;
  type: 'image' | 'text';
  image?: string;
  title: string;
  content?: string;
  backgroundColor?: string;
  duration: number;
  storyIndex: number;
  storyTitle: string;
  storyName: string;
  slideIndexInStory: number;
  globalPageIndex: number;
}

export function StoriesViewerFinal({ stories, currentStoryIndex, onClose, onStoryChange }: StoriesViewerProps) {
  // Estados simplificados para carrossel linear
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  
  // Refs para controle
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTouchRef = useRef(0);
  
  // Detectar dispositivo touch
  const isTouchDevice = 'ontouchstart' in window;

  // 🎯 FUNÇÃO PARA QUEBRAR TEXTO EM SLIDES - 600 CARACTERES + PONTO FINAL
  const splitTextIntoSlides = useCallback((text: string, maxChars: number = 600): string[] => {
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
  }, []);

  // 🎯 SISTEMA CARROSSEL LINEAR - Achatar todos os slides de todas as histórias
  const allPages = useMemo(() => {
    const pages: Page[] = [];
    let globalIndex = 0;
    
    stories.forEach((story, storyIdx) => {
      // Expandir slides longos em múltiplos slides
      const expandedSlides = story.slides.flatMap(slide => {
        if (slide.type === 'text' && slide.content && slide.content.length > 600) {
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
          slideIndexInStory: slideIdx,
          globalPageIndex: globalIndex
        });
        globalIndex++;
      });
    });
    
    return pages;
  }, [stories, splitTextIntoSlides]);

  // 🎯 CALCULAR PÁGINA INICIAL baseado na história atual
  const startingPageIndex = useMemo(() => {
    let pageIndex = 0;
    for (let i = 0; i < currentStoryIndex; i++) {
      const storyPages = allPages.filter(page => page.storyIndex === i);
      pageIndex += storyPages.length;
    }
    return pageIndex;
  }, [allPages, currentStoryIndex]);

  // Estado do carrossel linear
  const [currentPageIndex, setCurrentPageIndex] = useState(startingPageIndex);
  
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

  // 🎯 BUG FIX: SINCRONIZAÇÃO PARENT - Atualizar currentPageIndex quando currentStoryIndex muda externamente
  useEffect(() => {
    setCurrentPageIndex(startingPageIndex);
    setProgress(0);
  }, [currentStoryIndex, startingPageIndex]);

  // 🎯 ATUALIZAR onStoryChange quando história muda
  useEffect(() => {
    if (currentPage && currentPage.storyIndex !== currentStoryIndex) {
      onStoryChange(currentPage.storyIndex);
    }
  }, [currentPage, currentStoryIndex, onStoryChange]);

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

  // Handlers de navegação
  const handleNext = useCallback(() => {
    navigateCarousel('next');
  }, [navigateCarousel]);

  const handlePrevious = useCallback(() => {
    navigateCarousel('previous');
  }, [navigateCarousel]);

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
    
    const isHorizontalSwipe = Math.abs(deltaX) > 80 && deltaY < 100;
    
    if (isHorizontalSwipe) {
      if (deltaX > 0) {
        handlePrevious();
      } else {
        handleNext();
      }
    }
    
    touchStartRef.current = null;
  }, [handlePlayPause, handleNext, handlePrevious]);
  
  // Controles de mouse (apenas desktop)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isTouchDevice) return;
    handlePlayPause(false);
  }, [handlePlayPause, isTouchDevice]);
  
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isTouchDevice) return;
    handlePlayPause(true);
  }, [handlePlayPause, isTouchDevice]);
  
  // Áreas de clique
  const handleLeftClick = useCallback((e: React.MouseEvent) => {
    if (Date.now() - lastTouchRef.current < 700) return;
    if (isTouchDevice) return;
    
    e.preventDefault();
    e.stopPropagation();
    handlePrevious();
  }, [handlePrevious, isTouchDevice]);
  
  const handleRightClick = useCallback((e: React.MouseEvent) => {
    if (Date.now() - lastTouchRef.current < 700) return;
    if (isTouchDevice) return;
    
    e.preventDefault();
    e.stopPropagation();
    handleNext();
  }, [handleNext, isTouchDevice]);

  if (!currentPage) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col" 
      style={{ 
        backgroundColor: '#000000',
        width: '100vw',
        height: '100vh',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      {/* Header PRETO com barras de progresso */}
      <div className="px-4 pt-4 pb-2" style={{ backgroundColor: '#000000' }}>
        {/* Cabeçalho com foto e nome */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20">
              <div className="w-full h-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center">
                <span className="text-black text-xs font-bold">CG</span>
              </div>
            </div>
            <div className="text-white">
              <h3 className="font-semibold text-sm">{currentPage.storyName || "Histórias de Sucesso"}</h3>
              <p className="text-xs opacity-70">Clube do Grito</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded-full"
            data-testid="button-close-stories"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Barras de progresso BRANCAS - baseado na história atual */}
        <div className="flex space-x-1">
          {currentStoryPages.map((_, slideIdx) => (
            <div key={slideIdx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-300 ease-in-out" 
                style={{ 
                  width: slideIdx < currentSlideInStory ? '100%' : 
                         slideIdx === currentSlideInStory ? `${progress}%` : 
                         '0%' 
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Área principal */}
      <div className="flex-1 flex flex-col">
        {/* ÁREA PRINCIPAL DINÂMICA - Imagem ou Texto */}
        <div 
          className="flex-grow relative overflow-hidden flex items-center justify-center"
          style={{ 
            backgroundColor: currentPage.type === 'text' ? (currentPage.backgroundColor || '#FFD700') : '#000000' 
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        >
          {/* SLIDE DE IMAGEM */}
          {currentPage.type === 'image' && currentPage.image && (
            <img 
              src={currentPage.image}
              alt={currentPage.storyTitle}
              className="max-w-full max-h-full object-contain"
              style={{ 
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
              data-testid={`img-story-slide-${currentPageIndex}`}
            />
          )}

          {/* SLIDE DE TEXTO */}
          {currentPage.type === 'text' && (
            <div className="px-6 py-4 text-center max-w-full h-full flex flex-col">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#000000' }}>
                {currentPage.title || currentPage.storyTitle}
              </h2>
              {currentPage.content && (
                <div className="flex-1 flex items-center justify-center w-full">
                  <p 
                    className="leading-relaxed" 
                    style={{ 
                      color: '#000000',
                      lineHeight: '1.9',
                      fontSize: '24px',
                      textAlign: 'left',
                      maxWidth: '95%',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      minHeight: '70vh'
                    }}
                    data-testid={`text-story-content-${currentPageIndex}`}
                  >
                    {currentPage.content}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Megafone AZUL no canto superior direito */}
          <div className="absolute top-4 right-4 z-20">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: '#3B82F6' }}>
              <img 
                src={megafoneIcon}
                alt="Megafone"
                className="w-6 h-6 object-contain filter brightness-110"
              />
            </div>
          </div>

          {/* Áreas de clique para dispositivos não-touch */}
          {!isTouchDevice && (
            <>
              <div 
                className="absolute left-0 top-0 w-1/3 h-full z-30" 
                onClick={handleLeftClick}
                style={{ cursor: 'pointer' }}
                data-testid="area-click-previous"
              />
              <div 
                className="absolute right-0 top-0 w-1/3 h-full z-30" 
                onClick={handleRightClick}
                style={{ cursor: 'pointer' }}
                data-testid="area-click-next"
              />
            </>
          )}
        </div>

        {/* TÍTULO na parte inferior - FUNDO BRANCO */}
        <div className="p-6" style={{ backgroundColor: '#FFFFFF' }}>
          <h2 className="text-xl font-bold" style={{ color: '#000000' }} data-testid="text-story-title">
            {currentPage.storyTitle}
          </h2>
        </div>
      </div>
    </div>
  );
}