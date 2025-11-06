import React, { useState, useEffect } from 'react';
import { AlertCircle, X, Settings, Eye } from 'lucide-react';

interface DevModeBannerProps {
  /** Se deve mostrar sempre ou só quando IS_DEV_MODE estiver ativo */
  force?: boolean;
}

const DevModeBanner: React.FC<DevModeBannerProps> = ({ force = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [devModeInfo, setDevModeInfo] = useState({
    isActive: false,
    hasDevAccess: false,
    origin: null as string | null
  });

  useEffect(() => {
    checkDevModeStatus();
  }, []);

  const checkDevModeStatus = async () => {
    try {
      // Verificar se há parâmetros de desenvolvedor
      const urlParams = new URLSearchParams(window.location.search);
      const devAccess = urlParams.get('dev_access') === 'true';
      const origin = urlParams.get('origin');
      
      // Verificar sessão dev local
      const devSession = sessionStorage.getItem('dev_session') === 'active';
      
      // Verificar se modo dev global está ativo via API
      const response = await fetch('/api/dev/status');
      let globalDevMode = false;
      
      if (response.ok) {
        const data = await response.json();
        globalDevMode = data.isDevModeActive;
      }

      const info = {
        isActive: globalDevMode,
        hasDevAccess: devAccess || devSession,
        origin
      };

      setDevModeInfo(info);
      setIsVisible(force || info.isActive || info.hasDevAccess);
      
    } catch (error) {
      console.warn('Failed to check dev mode status:', error);
      
      // Fallback: verificar apenas parâmetros locais
      const urlParams = new URLSearchParams(window.location.search);
      const devAccess = urlParams.get('dev_access') === 'true';
      const devSession = sessionStorage.getItem('dev_session') === 'active';
      
      if (devAccess || devSession) {
        setDevModeInfo({
          isActive: false,
          hasDevAccess: true,
          origin: urlParams.get('origin')
        });
        setIsVisible(true);
      }
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Manter banner oculto por 30 segundos
    setTimeout(() => {
      setIsDismissed(false);
    }, 30000);
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  const getBannerType = () => {
    if (devModeInfo.isActive) {
      return {
        icon: <Settings className="w-4 h-4" />,
        text: 'Modo Desenvolvedor Global Ativo',
        description: 'Acesso livre a todas as telas • Autenticação desabilitada',
        className: 'bg-orange-500/90 text-white border-orange-600'
      };
    } else if (devModeInfo.hasDevAccess) {
      return {
        icon: <Eye className="w-4 h-4" />,
        text: 'Acesso de Desenvolvedor',
        description: `Via ${devModeInfo.origin || 'painel'} • Visualização de tela`,
        className: 'bg-blue-500/90 text-white border-blue-600'
      };
    } else {
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        text: 'Modo Dev Ativo',
        description: 'Ambiente de desenvolvimento',
        className: 'bg-gray-500/90 text-white border-gray-600'
      };
    }
  };

  const bannerConfig = getBannerType();

  return (
    <div 
      className={`
        fixed top-0 left-0 right-0 z-[10500] 
        ${bannerConfig.className}
        border-b backdrop-blur-sm
        animate-in slide-in-from-top duration-300
      `}
      role="banner"
      aria-label="Banner de modo desenvolvedor"
    >
      <div className="flex items-center justify-between px-4 py-2 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          {bannerConfig.icon}
          <div className="min-w-0">
            <div className="text-sm font-medium leading-tight">
              {bannerConfig.text}
            </div>
            <div className="text-xs opacity-90 leading-tight">
              {bannerConfig.description}
            </div>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="ml-4 hover:bg-white/20 rounded p-1 transition-colors flex-shrink-0"
          title="Ocultar por 30 segundos"
          aria-label="Fechar banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DevModeBanner;