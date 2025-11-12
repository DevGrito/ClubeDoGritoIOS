import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

interface DevAccessInfo {
  isDeveloper: boolean;
  hasDevAccess: boolean;
  isGlobalDevMode: boolean;
  origin: string | null;
  shouldShowBackButton: boolean;
}

export const useDevAccess = (): DevAccessInfo => {
  const [location] = useLocation();
  const [devInfo, setDevInfo] = useState<DevAccessInfo>({
    isDeveloper: false,
    hasDevAccess: false,
    isGlobalDevMode: false,
    origin: null,
    shouldShowBackButton: false
  });

  useEffect(() => {
    checkDevStatus();
  }, [location]);

  const checkDevStatus = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const devAccess = urlParams.get('dev_access') === 'true';
    const origin = urlParams.get('origin');
    const devOrigin = sessionStorage.getItem('dev_origin');
    
    // Verificar se o usuário é desenvolvedor local (APENAS se já autenticado)
    const userPapel = localStorage.getItem('userPapel');
    const isLocalDev = devAccess || 
                      devOrigin === 'dev-panel' ||
                      sessionStorage.getItem('dev_session') === 'active' ||
                      userPapel === 'desenvolvedor';

    // Verificar se modo dev global está ativo
    let globalDevMode = false;
    try {
      const response = await fetch('/api/dev/status');
      if (response.ok) {
        const data = await response.json();
        globalDevMode = data.isDevModeActive;
      }
    } catch (error) {
      console.warn('Failed to check global dev mode status:', error);
    }

    const finalDevInfo = {
      isDeveloper: isLocalDev || globalDevMode,
      hasDevAccess: devAccess,
      isGlobalDevMode: globalDevMode,
      origin: origin || devOrigin,
      shouldShowBackButton: devAccess && origin === 'dev_panel'
    };

    setDevInfo(finalDevInfo);

    // Criar botão de voltar automaticamente se necessário
    if (devAccess && origin === 'dev_panel' && !document.getElementById('dev-back-button')) {
      createDevBackButton();
    }

    // Registrar atividade do desenvolvedor para auditoria
    if (devAccess || globalDevMode) {
      logDevActivity(location, globalDevMode ? 'global_dev_page_view' : 'page_view');
    }
  };

  return devInfo;
};

const createDevBackButton = () => {
  const backBtn = document.createElement('div');
  backBtn.id = 'dev-back-button';
  backBtn.innerHTML = `
    <button style="
      background: #2563eb;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: system-ui, -apple-system, sans-serif;
      transition: background 0.2s;
    " 
    onmouseover="this.style.background='#1d4ed8'" 
    onmouseout="this.style.background='#2563eb'"
    onclick="
      sessionStorage.setItem('dev_returning', 'true');
      window.location.href = '/dev';
    ">
      ← Painel Dev
    </button>
  `;
  
  backBtn.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    pointer-events: none;
  `;
  
  backBtn.querySelector('button')!.style.pointerEvents = 'auto';
  
  document.body.appendChild(backBtn);

  // Auto-remover após 10 segundos se não usado
  setTimeout(() => {
    const btn = document.getElementById('dev-back-button');
    if (btn) {
      btn.style.opacity = '0.6';
      btn.title = 'Clique para voltar ao Painel do Desenvolvedor';
    }
  }, 5000);
};

const logDevActivity = async (route: string, action: string) => {
  try {
    const timestamp = new Date().toISOString();
    const devLog = {
      route,
      action,
      timestamp,
      userAgent: navigator.userAgent,
      referrer: document.referrer
    };
    
    // Salvar log local (pode ser enviado para API posteriormente)
    const existingLogs = JSON.parse(localStorage.getItem('dev_activity_logs') || '[]');
    existingLogs.push(devLog);
    
    // Manter apenas os últimos 100 logs
    if (existingLogs.length > 100) {
      existingLogs.splice(0, existingLogs.length - 100);
    }
    
    localStorage.setItem('dev_activity_logs', JSON.stringify(existingLogs));
    
    console.log(`[DEV ACCESS] ${action} on ${route} at ${timestamp}`);
  } catch (error) {
    console.warn('Failed to log dev activity:', error);
  }
};

// Função para verificar se o usuário tem permissões de desenvolvedor
export const checkDevPermissions = (): boolean => {
  const urlParams = new URLSearchParams(window.location.search);
  const devAccess = urlParams.get('dev_access') === 'true';
  const devSession = sessionStorage.getItem('dev_session') === 'active';
  const devOrigin = sessionStorage.getItem('dev_origin') === 'dev-panel';
  
  return devAccess || devSession || devOrigin;
};

// Função para remover acesso de desenvolvedor
export const clearDevAccess = () => {
  sessionStorage.removeItem('dev_session');
  sessionStorage.removeItem('dev_origin');
  sessionStorage.removeItem('dev_scroll');
  sessionStorage.removeItem('dev_selected_tela');
  sessionStorage.removeItem('dev_returning');
  
  const backBtn = document.getElementById('dev-back-button');
  if (backBtn && backBtn.parentNode) {
    try {
      backBtn.parentNode.removeChild(backBtn);
    } catch (error) {
      console.warn('Failed to remove dev button:', error);
    }
  }
};