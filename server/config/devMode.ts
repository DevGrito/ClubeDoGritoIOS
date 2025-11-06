// Estado global do modo desenvolvedor (runtime)
let RUNTIME_DEV_MODE = false;

// Configuração do modo desenvolvedor
export const DEV_MODE_CONFIG = {
  // Verificar se estamos em desenvolvimento
  get IS_DEV_MODE() {
    return process.env.NODE_ENV === 'development' && 
           (process.env.IS_DEV_MODE === 'true' || RUNTIME_DEV_MODE);
  },
  
  // Banner de aviso para modo dev
  DEV_BANNER_TEXT: 'Modo Desenvolvedor Ativo',
  
  // Configurações de segurança
  ALLOWED_IN_PRODUCTION: false,
  
  // Log de auditoria
  LOG_DEV_ACCESS: process.env.NODE_ENV === 'development',
};

/**
 * Verifica se o modo desenvolvedor está ativo
 */
export const isDevModeActive = (): boolean => {
  // Só permitir em desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }
  
  return DEV_MODE_CONFIG.IS_DEV_MODE;
};

/**
 * Middleware para bypass de autenticação em modo dev
 */
export const shouldBypassAuth = (): boolean => {
  return isDevModeActive();
};

/**
 * Ativar/desativar modo desenvolvedor (runtime)
 */
export const setDevModeActive = (active: boolean): boolean => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Dev mode can only be toggled in development environment');
    return false;
  }
  
  RUNTIME_DEV_MODE = active;
  logDevModeActivity(`Dev mode ${active ? 'enabled' : 'disabled'} via runtime toggle`);
  return true;
};

/**
 * Obter estado atual do modo dev (runtime)
 */
export const getRuntimeDevMode = (): boolean => {
  return RUNTIME_DEV_MODE;
};

/**
 * Log de atividade do modo desenvolvedor
 */
export const logDevModeActivity = (activity: string, details?: any) => {
  if (!DEV_MODE_CONFIG.LOG_DEV_ACCESS) return;
  
  try {
    const timestamp = new Date().toISOString();
    const safeDetails = details && typeof details === 'object' ? 
      Object.fromEntries(Object.entries(details).filter(([_, v]) => v !== undefined)) : {};
    console.log(`[DEV-MODE] ${timestamp}: ${activity}`, Object.keys(safeDetails).length ? JSON.stringify(safeDetails) : '');
  } catch (error) {
    console.log(`[DEV-MODE] ${activity} (log error)`);
  }
};