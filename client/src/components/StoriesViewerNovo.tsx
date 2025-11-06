import { useState, useEffect } from "react";
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

export function StoriesViewerNovo({ stories, currentStoryIndex, onClose, onStoryChange }: StoriesViewerProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const currentStory = stories[currentStoryIndex];
  const currentSlide = currentStory?.slides[currentSlideIndex];

  // Auto-progresso das barras
  useEffect(() => {
    if (!isPlaying || !currentSlide) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (100 / (currentSlide.duration * 10));
        if (newProgress >= 100) {
          handleNext();
          return 0;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentSlideIndex, isPlaying, currentSlide]);

  const handleNext = () => {
    if (currentSlideIndex < currentStory.slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
      setProgress(0);
    } else if (currentStoryIndex < stories.length - 1) {
      onStoryChange?.(currentStoryIndex + 1);
      setCurrentSlideIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
      setProgress(0);
    } else if (currentStoryIndex > 0) {
      onStoryChange?.(currentStoryIndex - 1);
      setCurrentSlideIndex(0);
      setProgress(0);
    }
  };

  // Controles de toque
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsPlaying(false);
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    setIsPlaying(true);
  };

  if (!currentStory || !currentSlide) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" style={{ backgroundColor: '#000000' }}>
      {/* Header com barras de progresso - fundo preto */}
      <div className="px-4 pt-4 pb-2 bg-black">
        {/* Cabeçalho com foto e nome */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20">
              <div className="w-full h-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center">
                <span className="text-black text-xs font-bold">CG</span>
              </div>
            </div>
            <div className="text-white">
              <h3 className="font-semibold text-sm">{currentStory.name || "Histórias de Sucesso"}</h3>
              <p className="text-xs opacity-70">Clube do Grito</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Barras de progresso - brancas */}
        <div className="flex space-x-1">
          {currentStory.slides.map((_, slideIdx) => (
            <div key={slideIdx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-300 ease-in-out" 
                style={{ 
                  width: slideIdx < currentSlideIndex ? '100%' : 
                         slideIdx === currentSlideIndex ? `${progress}%` : 
                         '0%' 
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Área principal - seguindo o layout da segunda imagem */}
      <div className="flex-1 flex flex-col">
        {/* Espaço para a imagem - ocupa a maior parte */}
        <div 
          className="flex-grow relative bg-black overflow-hidden flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
        >
          {/* Imagem centralizada */}
          {currentSlide.image && (
            <img 
              src={currentSlide.image}
              alt={currentStory.title}
              className="max-w-full max-h-full object-contain"
              style={{ 
                maxWidth: '100%',
                maxHeight: '100%'
              }}
            />
          )}

          {/* Texto "ESPAÇO PARA IMAGEM" se não houver imagem */}
          {!currentSlide.image && (
            <div className="text-white text-center">
              <h2 className="text-2xl font-bold mb-2">ESPAÇO PARA IMAGEM</h2>
              <p className="text-lg opacity-70">{currentStory.title}</p>
            </div>
          )}

          {/* Megafone no canto superior direito da área da imagem */}
          <div className="absolute top-4 right-4 z-20">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <img 
                src={megafoneIcon}
                alt="Megafone"
                className="w-6 h-6 object-contain filter brightness-110"
              />
            </div>
          </div>

          {/* Áreas de toque invisíveis para navegação */}
          <div 
            className="absolute left-0 top-0 w-1/3 h-full z-30" 
            onClick={handlePrevious}
          />
          <div 
            className="absolute right-0 top-0 w-1/3 h-full z-30" 
            onClick={handleNext}
          />
        </div>

        {/* Área do título na parte inferior - fundo branco */}
        <div className="bg-white p-6">
          <h2 className="text-black text-xl font-bold text-left">
            {currentStory.title}
          </h2>
        </div>
      </div>
    </div>
  );
}