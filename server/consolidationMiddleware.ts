// Middleware para consolidação automática de usuários
// Intercepta todos os cadastros e garante que virem "users" na tabela principal

import { Request, Response, NextFunction } from 'express';
import { consolidateUser } from './userConsolidation';

export interface UserRegistrationData {
  nome: string;
  telefone: string;
  email?: string;
  cpf?: string;
  tipo: 'doador' | 'professor' | 'aluno' | 'responsavel' | 'admin' | 'conselho' | 'desenvolvedor';
  fonte: 'doacao' | 'educacao' | 'familia' | 'admin' | 'conselho' | 'referral' | 'reativado_indicado';
  plano?: string;
}

// Middleware que intercepta registros e os consolida automaticamente
export const consolidationMiddleware = async (
  req: Request & { consolidatedUser?: any },
  res: Response,
  next: NextFunction
) => {
  try {
    // Verificar se há dados de usuário para consolidar
    if (req.body && (req.body.telefone || req.body.phone)) {
      const telefone = req.body.telefone || req.body.phone;
      const nome = req.body.nome || req.body.name || req.body.nomeCompleto || 'Usuário';
      const email = req.body.email || '';
      const cpf = req.body.cpf || '';
      
      // Determinar tipo e fonte baseado na rota
      let tipo: UserRegistrationData['tipo'] = 'doador';
      let fonte: UserRegistrationData['fonte'] = 'doacao';
      let plano = req.body.plano || 'eco';
      
      const route = req.path;
      
      if (route.includes('/payment-intent') || route.includes('/pos-pagamento')) {
        tipo = 'doador';
        fonte = 'doacao';
        plano = req.body.planId || req.body.plano || 'eco';
      } else if (route.includes('/professor') || route.includes('/educacao')) {
        tipo = 'professor';
        fonte = 'educacao';
      } else if (route.includes('/aluno')) {
        tipo = 'aluno';
        fonte = 'educacao';
      } else if (route.includes('/responsavel') || route.includes('/pais') || route.includes('/maes')) {
        tipo = 'responsavel';
        fonte = 'familia';
      } else if (route.includes('/conselho')) {
        tipo = 'conselho';
        fonte = 'conselho';
      }
      
      // Consolidar usuário automaticamente
      const consolidatedUser = await consolidateUser({
        nome,
        telefone,
        email,
        cpf,
        tipo,
        fonte,
        plano
      });
      
      // Adicionar ao request para uso posterior
      req.consolidatedUser = consolidatedUser;
      
      console.log(`[CONSOLIDAÇÃO] Usuário consolidado: ${nome} (${telefone}) como ${tipo} via ${fonte}`);
    }
    
    next();
  } catch (error) {
    console.error('Erro no middleware de consolidação:', error);
    // Não interromper o fluxo, apenas logar o erro
    next();
  }
};

// Função para aplicar consolidação em rotas específicas
export const applyConsolidationToRoutes = (app: any) => {
  // Rotas que devem consolidar usuários automaticamente
  const consolidationRoutes = [
    '/api/payment-intent',
    '/api/pos-pagamento',
    '/api/professor/*',
    '/api/aluno/*',
    '/api/responsavel/*',
    '/api/conselho/*'
  ];
  
  consolidationRoutes.forEach(route => {
    app.use(route, consolidationMiddleware);
  });
  
  console.log('[CONSOLIDAÇÃO] Middleware aplicado às rotas de cadastro');
};