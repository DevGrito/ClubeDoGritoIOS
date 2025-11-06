import { Request, Response, NextFunction } from 'express';
import { isDevModeActive, logDevModeActivity } from '../config/devMode';

// Middleware para verificar acesso de desenvolvedor
export const checkDevAccess = (req: Request, res: Response, next: NextFunction) => {
  // Verificar se o modo desenvolvedor está ativo globalmente
  const globalDevMode = isDevModeActive();
  
  // Verificar se há parâmetros de desenvolvedor na query string
  const devAccess = req.query.dev_access === 'true';
  const origin = req.query.origin;
  
  // Verificar headers de desenvolvedor
  const devHeader = req.headers['x-dev-access'] === 'true';
  
  // Verificar se é uma sessão de desenvolvedor (apenas para rotas não-asset)
  const isAssetRequest = req.path.includes('/@vite') || 
                        req.path.includes('/src/') || 
                        req.path.includes('/@react') ||
                        req.path.includes('/api/auth') ||
                        req.path.includes('/assets/') ||
                        req.path.includes('/uploads/');
  
  const devSession = !isAssetRequest && (
    req.headers.referer?.includes('dev_access=true') || 
    req.headers.referer?.includes('/dev')
  );

  // Se modo dev global estiver ativo, permitir acesso livre
  if (globalDevMode || devAccess || devHeader || devSession) {
    // Marcar request como acesso de desenvolvedor
    (req as any).isDeveloper = true;
    (req as any).devOrigin = origin || (globalDevMode ? 'dev-mode' : 'unknown');
    (req as any).isGlobalDevMode = globalDevMode;
    
    // Log de auditoria apenas para rotas importantes
    if (!isAssetRequest && globalDevMode) {
      logDevModeActivity(`Global dev access granted to ${req.path}`, { origin });
    } else if (!isAssetRequest) {
      console.log(`[DEV ACCESS] Developer access granted to ${req.path} from ${origin}`);
    }
    
    // Pular verificações de autenticação normais
    return next();
  }

  // Continuar com verificações normais de autenticação
  next();
};

// Middleware para logar atividades de desenvolvedor
export const logDevActivity = (req: Request, res: Response, next: NextFunction) => {
  if ((req as any).isDeveloper) {
    // Filtrar apenas rotas importantes (não assets)
    const isAssetRequest = req.path.includes('/@vite') || 
                          req.path.includes('/src/') || 
                          req.path.includes('/@react') ||
                          req.path.includes('/assets/') ||
                          req.path.includes('/uploads/');
    
    if (!isAssetRequest) {
      const activity = {
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        origin: (req as any).devOrigin,
        userAgent: req.headers['user-agent'],
        ip: req.ip
      };
      
      // Aqui você pode salvar no banco de dados se necessário
      console.log('[DEV ACTIVITY]', JSON.stringify(activity));
    }
  }
  
  next();
};

// Função para verificar se é uma requisição de desenvolvedor
export const isDevRequest = (req: Request): boolean => {
  return !!(req as any).isDeveloper;
};

// Função para verificar se é modo dev global
export const isGlobalDevMode = (req: Request): boolean => {
  return !!(req as any).isGlobalDevMode;
};