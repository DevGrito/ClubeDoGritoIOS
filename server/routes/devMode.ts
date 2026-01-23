import { Request, Response } from 'express';
import { isDevModeActive, logDevModeActivity, setDevModeActive, getRuntimeDevMode } from '../config/devMode';

/**
 * Rota para verificar status do modo desenvolvedor
 */
export const getDevModeStatus = (req: Request, res: Response) => {
  try {
    const status = {
      isDevModeActive: isDevModeActive(),
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      requestId: Math.random().toString(36).substr(2, 9)
    };

    // Simplified logging without problematic IP detection
    logDevModeActivity('Dev mode status checked');

    res.json(status);
  } catch (error) {
    console.error('Error checking dev mode status:', error);
    res.status(500).json({ error: 'Failed to check dev mode status' });
  }
};

/**
 * Rota para alternar modo desenvolvedor (apenas em desenvolvimento)
 */
export const toggleDevMode = (req: Request, res: Response) => {
  try {
    // Verificar se estamos em desenvolvimento
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ 
        error: 'Dev mode toggle is only available in development environment' 
      });
    }

    const currentStatus = getRuntimeDevMode();
    const newStatus = !currentStatus;
    
    // Atualizar estado runtime
    const success = setDevModeActive(newStatus);

    logDevModeActivity(`Dev mode ${newStatus ? 'enabled' : 'disabled'}`);

    res.json({
      success,
      isDevModeActive: newStatus,
      message: `Dev mode ${newStatus ? 'enabled' : 'disabled'}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error toggling dev mode:', error);
    res.status(500).json({ error: 'Failed to toggle dev mode' });
  }
};

/**
 * Rota para obter logs de atividade do modo dev
 */
export const getDevModeLogs = (req: Request, res: Response) => {
  try {
    if (!isDevModeActive()) {
      return res.status(403).json({ error: 'Dev mode logs only available when dev mode is active' });
    }

    // Aqui você pode implementar busca de logs do banco de dados
    // Por enquanto, retorna logs básicos
    const logs = {
      devModeActive: isDevModeActive(),
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      message: 'Dev mode logs endpoint - implement database logging if needed'
    };

    res.json(logs);
  } catch (error) {
    console.error('Error fetching dev mode logs:', error);
    res.status(500).json({ error: 'Failed to fetch dev mode logs' });
  }
};