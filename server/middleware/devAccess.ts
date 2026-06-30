import { Request, Response, NextFunction } from 'express';
import { isDevModeActive, logDevModeActivity } from '../config/devMode';

// Middleware para verificar acesso de desenvolvedor
export const checkDevAccess = (req: Request, res: Response, next: NextFunction) => {
  // Verificar se o modo desenvolvedor está ativo globalmente
  const globalDevMode = isDevModeActive();
  
  const origin = req.query.origin;
  
  // Verificar se é uma sessão de desenvolvedor (apenas para rotas não-asset)
  const isAssetRequest = req.path.includes('/@vite') || 
                        req.path.includes('/src/') || 
                        req.path.includes('/@react') ||
                        req.path.includes('/api/auth') ||
                        req.path.includes('/assets/') ||
                        req.path.includes('/uploads/');

  // Verificar se há uma sessão de desenvolvedor ativa
  const hasActiveDevSession = (req as any).session && (req as any).session.developerId && 
    ((req as any).session.userPapel === 'dev' || (req as any).session.userPapel === 'desenvolvedor');

  const sessionData = (req as any).session as any;
  const sessionRole = sessionData?.userPapel || sessionData?.user?.role || sessionData?.user?.papel;
  const hasPrivilegedSession = ["dev", "desenvolvedor", "admin", "leo"].includes(String(sessionRole || "").toLowerCase());

  // Se modo dev global estiver ativo, permitir acesso
  if (globalDevMode || hasActiveDevSession || hasPrivilegedSession) {
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

  return res.status(403).json({ error: "Acesso de desenvolvedor não autorizado" });
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