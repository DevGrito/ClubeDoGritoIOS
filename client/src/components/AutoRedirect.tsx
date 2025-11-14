import React, { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { isLeoMartins } from '@shared/conselho';

// Componente para redirecionamento automático baseado no papel do usuário
export const AutoRedirect: React.FC = () => {
  const [location, setLocation] = useLocation();
  const hasRedirected = useRef(false);
  const errorCount = useRef(0);

  useEffect(() => {
    // Proteção contra loops infinitos
    if (errorCount.current > 3) {
      console.error('🚨 AutoRedirect: Muitos erros, parando redirecionamentos');
      return;
    }
    
    // Verificar se é acesso DEV - bypass total de redirecionamento
    const urlParams = new URLSearchParams(window.location.search);
    const isDevAccess = urlParams.get('dev_access') === 'true';
    const isFromDevPanel = urlParams.get('origin') === 'dev_panel';
    const devSession = sessionStorage.getItem('dev_session') === 'active';
    
    // Verificar se é um coordenador autenticado - bypass total
    const isCoordenadorAuth = sessionStorage.getItem('coordenador_auth') === 'true';
    if (isCoordenadorAuth) {
      return; // Coordenadores têm seu próprio sistema de auth
    }
    
    // Verificar se usuário está logado
    const userPapel = localStorage.getItem('userPapel');
    const isVerified = localStorage.getItem('isVerified') === 'true';
    
    // DEV tem acesso universal - qualquer forma de acesso dev bypass redirecionamentos
    if (isDevAccess || 
        isFromDevPanel || 
        devSession || 
        userPapel === 'desenvolvedor' ||
        location === '/dev') {
      return;
    }

    // Remoção da lógica automática de criação de sessão para Leo
    // Usuários devem passar pelo fluxo normal de autenticação

    // Se não está logado e não está em páginas públicas, redirecionar para login
    const publicRoutes = ['/', '/plans', '/register', '/entrar', '/verify', '/checkout', '/success', '/pos-pagamento', '/aguardando-aprovacao', '/not-found', '/typeform-donation', '/donation-flow', '/stripe-payment', '/noticias', '/termos-servicos', '/politica-privacidade', '/pagamento/ingresso', '/ingresso/sucesso', '/ingresso-demo', '/pagamento/aprovado', '/pagamento/reprovado', '/pagamento-ingresso', '/ingresso', '/ingresso/avulso/resgatar', '/ingresso/resgate/identificar', '/ingresso/resgate/confirmar', '/scanner', '/scanner-login', '/login/coordenador', '/ingressos/compras/extras', '/ingressos-esgotados'];
    
    if (!userPapel || !isVerified) {
      if (!publicRoutes.includes(location) && !location.startsWith('/checkout/') && !location.startsWith('/ingresso/visualizar/') && !location.startsWith('/ingresso/lista-cota/')) {
        setLocation('/entrar');
      }
      return;
    }

    // Redirecionar usuários logados para suas páginas corretas
    if ((location === '/' || location === '/splash' || location === '/plans') && !hasRedirected.current) {
      // Verificar se acabou de fazer uma doação - priorizar dashboard doador
      const justDonated = sessionStorage.getItem('justCompletedDonation') === 'true';
      const hasDoadorRole = userPapel === 'doador' || localStorage.getItem('hasDoadorRole') === 'true';
      
      let targetRoute;
      if (justDonated || (hasDoadorRole && !sessionStorage.getItem('preferAdminView'))) {
        // Se acabou de doar ou é doador sem preferência admin, vai para dashboard doador
        targetRoute = '/tdoador';
        // Limpar flag de doação recente
        sessionStorage.removeItem('justCompletedDonation');
      } else {
        // Usar lógica padrão baseada no papel
        // ESPECIAL: Leo usa navegação de doador, não admin
        if (userPapel === 'leo') {
          targetRoute = '/tdoador'; // Leo vai para área doador por padrão
        } else {
          targetRoute = getDefaultRouteForRole(userPapel);
        }
      }
      
      if (targetRoute !== location) {
        hasRedirected.current = true;
        setLocation(targetRoute);
      }
    }
  }, [location]);

  return null;
};

// Função para obter rota padrão baseada no papel do usuário
function getDefaultRouteForRole(userPapel: string): string {
  switch (userPapel) {
    case 'super_admin':
      return '/administrador';
    case 'leo':
      return '/tdoador'; // 🔧 LEO VAI PARA ÁREA DOADOR POR PADRÃO
    case 'desenvolvedor':
      return '/dev';
    case 'admin':
      return '/admin-geral';
    // RBAC Roles - Rotas isoladas
    case 'professor':
      return '/professor';
    case 'monitor':
      return '/monitor';
    case 'coordenador_inclusao':
      return '/coordenador/inclusao-produtiva';
    case 'coordenador_pec':
      return '/coordenador/esporte-cultura';
    case 'coordenador_psico':
      return '/coordenador/psicossocial';
    // Legacy roles
    case 'lider':
    case 'professor_lider':
      return '/educacao';
    case 'aluno':
      return '/aluno';
    case 'conselho':
    case 'conselheiro':
      return '/conselho';
    case 'patrocinador':
      return '/patrocinador';
    case 'responsavel':
      return '/responsavel';
    case 'colaborador':
      return '/colaborador';
    case 'doador':
    case 'user':
    default:
      return '/tdoador';
  }
}

export default AutoRedirect;