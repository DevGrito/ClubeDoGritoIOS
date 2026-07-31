import React, { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAuthSession } from '@/hooks/useAuthSession';

// Componente para redirecionamento automático baseado no papel do usuário
export const AutoRedirect: React.FC = () => {
  const [location, setLocation] = useLocation();
  const { data: session, isFetched, isLoading } = useAuthSession();
  const hasRedirected = useRef(false);
  const errorCount = useRef(0);

  useEffect(() => {
    if (!isFetched || isLoading) return;

    if (errorCount.current > 3) {
      console.error("🚨 AutoRedirect: Muitos erros, parando redirecionamentos");
      return;
    }

    const sessionPapel = (session?.papel || session?.role || '').toLowerCase();
    const actorType = session?.actorType || null;
    // O localStorage é apenas cache de UI. Redirecionamento autenticado deve
    // depender exclusivamente da sessão confirmada pelo backend.
    const userPapel = sessionPapel || null;
    const hasBackendSession = !!session?.id;

    const isPortalActor =
      actorType === 'coordenador' ||
      actorType === 'monitor' ||
      actorType === 'professor' ||
      actorType === 'aluno_portal' ||
      actorType === 'scanner' ||
      actorType === 'tablet_chamada' ||
      actorType === 'aluno';

    const isRbacRole =
      !!userPapel &&
      (userPapel.startsWith('coordenador_') ||
        userPapel.startsWith('professor') ||
        userPapel.startsWith('monitor') ||
        userPapel === 'tecnica_psico' ||
        userPapel === 'aluno' ||
        userPapel === 'aluno_portal' ||
        userPapel === 'coordenador_negocios' ||
        userPapel === 'coordenador_almoxarifado');

    if (hasBackendSession && (isPortalActor || isRbacRole)) {
      return;
    }

    // 🔐 SECURITY: DEV tem acesso APENAS se autenticado pelo backend (não por URL)
    if (
      (hasBackendSession &&
        (userPapel === 'desenvolvedor' ||
          userPapel === 'dev' ||
          userPapel === 'dev-admin' ||
          userPapel === 'dev-marketing' ||
          userPapel === 'marketing')) ||
      location === '/dev' ||
      location === '/dev/login' ||
      location === '/dev/marketing'
    ) {
      return;
    }

    const publicRoutes = [
      '/plans', '/register', '/entrar', '/verify', '/checkout', '/success',
      '/pos-pagamento', '/aguardando-aprovacao', '/not-found',
      '/dev/login', '/dev/marketing',
      '/typeform-donation', '/donation-flow', '/stripe-payment', '/noticias',
      '/termos-servicos', '/termos-de-uso', '/politica-de-privacidade', '/politica-privacidade', '/pagamento/aprovado',
      '/pagamento/reprovado', '/scanner', '/scanner-login',
      '/tablet/chamada', '/tablet/chamada/login',
      '/login/aluno', '/login/coordenador', '/login/monitor', '/login/professor',
      '/dashboard/gestao/vista',
      '/gestao-vista-preview',
      '/eventos', '/eventos/cadastro', '/eventos/perfil', '/eventos/admin',
      '/vendedor/outlet', '/confeccao',
    ];

    const isVerified = hasBackendSession;

    if (!userPapel || !isVerified) {
      const isEventosSubdomain = window.location.hostname === "eventos.institutoogrito.com.br";

      if (location === '/') {
        setLocation(isEventosSubdomain ? '/eventos' : '/plans');
        return;
      }

      if (!publicRoutes.includes(location) && !location.startsWith('/checkout/') && !location.startsWith('/eventos/') && !location.startsWith('/tablet/chamada')) {
        setLocation('/entrar');
      }
      return;
    }

    if ((location === '/' || location === '/splash' || location === '/plans') && !hasRedirected.current) {
      const justDonated = sessionStorage.getItem('justCompletedDonation') === 'true';
      const hasDoadorRole = userPapel === 'doador' || localStorage.getItem('hasDoadorRole') === 'true';

      let targetRoute;
      if (justDonated || (hasDoadorRole && !sessionStorage.getItem('preferAdminView'))) {
        targetRoute = '/tdoador';
        sessionStorage.removeItem('justCompletedDonation');
      } else if (userPapel === 'leo') {
        targetRoute = '/tdoador';
      } else {
        targetRoute = getDefaultRouteForRole(userPapel);
      }

      if (targetRoute !== location) {
        hasRedirected.current = true;
        setLocation(targetRoute);
      }
    }
  }, [location, session, isFetched, isLoading, setLocation]);

  return null;
};

function getDefaultRouteForRole(userPapel: string): string {
  switch (userPapel) {
    case 'super_admin':
      return '/administrador';
    case 'leo':
      return '/tdoador';
    case 'desenvolvedor':
    case 'dev':
      return '/dev';
    case 'dev-admin':
      return '/dev';
    case 'dev-marketing':
    case 'marketing':
      return '/dev/marketing';
    case 'admin':
      return '/admin-geral';
    case 'professor':
      return '/professor';
    case 'professor_pec':
      return '/professor/pec';
    case 'professor_inclusao':
      return '/professor/inclusao';
    case 'professor_psico':
      return '/professor';
    case 'monitor':
      return '/monitor';
    case 'coordenador_inclusao':
      return '/coordenador/inclusao-produtiva';
    case 'coordenador_pec':
      return '/coordenador/esporte-cultura';
    case 'coordenador_psico':
      return '/coordenador/psicossocial';
    case 'coordenador_negocios':
      return '/coordenador/negocios-sociais';
    case 'coordenador_almoxarifado':
      return '/coordenador/almoxarifado';
    case 'tecnica_psico':
      return '/tecnica/psicossocial';
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
