import React, { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { isLeoByRole } from '@shared/conselho';

// Componente para redirecionamento automático baseado no papel do usuário
export const AutoRedirect: React.FC = () => {
  const [location, setLocation] = useLocation();
  const hasRedirected = useRef(false);
  const errorCount = useRef(0);

  useEffect(() => {
    if (errorCount.current > 3) {
      console.error("🚨 AutoRedirect: Muitos erros, parando redirecionamentos");
      return;
    }

    // ✅ flags RBAC no sessionStorage
    const isCoordenadorAuth =
      sessionStorage.getItem("coordenador_auth") === "true";
    const isMonitorAuth =
      sessionStorage.getItem("monitor_auth") === "true";
    const isProfessorAuth =
      sessionStorage.getItem("professor_auth") === "true";

    // ✅ flags no localStorage
    const actorType = localStorage.getItem("actorType");
    const rawUserPapel = localStorage.getItem("userPapel");
    const userPapel = rawUserPapel ? rawUserPapel.toLowerCase() : null;

    // ✅ bypass robusto (se for RBAC, AutoRedirect não interfere)
    const isCoordRole = !!userPapel && userPapel.startsWith("coordenador_");
    const isProfessorOrMonitor = userPapel === "monitor" || userPapel === "professor";

    if (
      isCoordenadorAuth ||
      isMonitorAuth ||
      isProfessorAuth ||
      actorType === "coordenador" ||
      actorType === "monitor" ||
      actorType === "professor" ||
      isCoordRole ||
      isProfessorOrMonitor
    ) {
      return;
    }

    
    // Verificar se usuário está logado
    const isVerified = localStorage.getItem('isVerified') === 'true';

    // 🔐 SECURITY: DEV tem acesso APENAS se autenticado pelo backend (não por URL)
    // Parâmetros de URL como ?dev_access=true NÃO concedem mais acesso
    if (userPapel === 'desenvolvedor' ||
        userPapel === 'dev' ||
        userPapel === 'dev-admin' ||
        userPapel === 'dev-marketing' ||
        userPapel === 'marketing' ||
        location === '/dev' ||
        location === '/dev/login' ||
        location === '/dev/marketing') {
      return;
    }
    // Remoção da lógica automática de criação de sessão para Leo
    // Usuários devem passar pelo fluxo normal de autenticação

    // Se não está logado e não está em páginas públicas, redirecionar para login
   const publicRoutes = [
  '/plans', '/register', '/entrar', '/verify', '/checkout', '/success',
  '/pos-pagamento', '/aguardando-aprovacao', '/not-found',
  '/dev/login', '/dev/marketing',
  '/typeform-donation', '/donation-flow', '/stripe-payment', '/noticias',
  '/termos-servicos', '/politica-privacidade', '/pagamento/ingresso',
  '/ingresso/sucesso', '/ingresso-demo', '/pagamento/aprovado',
  '/pagamento/reprovado', '/pagamento-ingresso', '/ingresso',
  '/ingresso/avulso/resgatar', '/ingresso/resgate/identificar',
  '/ingresso/resgate/confirmar', '/scanner', '/scanner-login',
  '/login/coordenador', '/login/monitor', '/login/professor', '/ingressos/compras/extras',
  '/ingressos-esgotados',
  '/gestao/vista/dashboard',
   '/dashboard/gestao/vista'
];
    
    if (!userPapel || !isVerified) {
      // Redirecionar "/" para "/plans" quando não está logado
      if (location === '/') {
        setLocation('/plans');
        return;
      }
      
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
    case 'dev':
      return '/dev';
    case 'dev-admin':
      return '/dev'; // Admin Full Access começa em /dev, mas pode navegar para /dev/marketing
    case 'dev-marketing':
    case 'marketing':
      return '/dev/marketing';
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
      return '/professor';
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