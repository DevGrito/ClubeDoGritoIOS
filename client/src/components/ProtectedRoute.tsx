import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useAuthSession } from '@/hooks/useAuthSession';
import { syncSessionToLocalStorage } from '@/lib/auth-session';
import { isLeoByRole } from '@shared/conselho';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  routeName: string;
}

// Mapeamento de papéis para suas rotas permitidas - RBAC System
const ROLE_TO_ALLOWED_ROUTES: Record<string, string[]> = {
  'super_admin': ['/', '/plans', '/administrador', '/leo-martins', '/central-ajuda', '/admin/privacy-consents', '/admin/ropa', '/dev', '/coordenador/negocios-sociais', '/coordenador/almoxarifado'],
  'leo': ['/', '/plans', '/administrador', '/leo-martins', '/central-ajuda', '/tdoador', '/welcome', '/busca', '/noticias', '/perfil', '/meus-dados', '/dados-cadastrais', '/pagamentos', '/configuracoes', '/sobre', '/change-plan', '/beneficios', '/meus-lances', '/missoes-semanais', '/admin/privacy-consents', '/admin/ropa', '/dev', '/coordenador/negocios-sociais', '/coordenador/almoxarifado'],
  'desenvolvedor': ['/', '/plans', '/dev', '/dev/marketing', '/dev/login', '/administrador', '/central-ajuda', '/perfil', '/meus-dados', '/dados-cadastrais', '/sobre', '/configuracoes', '/admin/privacy-consents'],
  'dev': ['/', '/plans', '/dev', '/dev/marketing', '/dev/login', '/administrador', '/central-ajuda', '/perfil', '/meus-dados', '/dados-cadastrais', '/sobre', '/configuracoes', '/admin/privacy-consents'],
  'dev-admin': ['/', '/plans', '/dev', '/dev/marketing', '/dev/login', '/administrador', '/central-ajuda', '/perfil', '/meus-dados', '/dados-cadastrais', '/sobre', '/configuracoes'],
  'dev-marketing': ['/', '/plans', '/dev/marketing', '/dev/login', '/central-ajuda', '/perfil', '/meus-dados', '/dados-cadastrais', '/sobre', '/configuracoes'],
  'admin': ['/', '/plans', '/admin-geral', '/central-ajuda', '/professor', '/professor/pec', '/professor/inclusao', '/monitor', '/coordenador', '/coordenador/inclusao-produtiva', '/coordenador/esporte-cultura', '/coordenador/psicossocial', '/coordenador/negocios-sociais', '/coordenador/almoxarifado', '/pec', '/patrocinador-dashboard', '/perfil-patrocinador', '/admin/privacy-consents'],

  'professor': ['/', '/plans', '/professor', '/professor/pec', '/professor/inclusao', '/central-ajuda', '/meus-dados'],
  'professor_pec': ['/', '/plans', '/professor', '/professor/pec', '/central-ajuda', '/meus-dados'],
  'professor_inclusao': ['/', '/plans', '/professor', '/professor/inclusao', '/central-ajuda', '/meus-dados'],
  'professor_psico': ['/', '/plans', '/professor', '/professor/pec', '/professor/inclusao', '/central-ajuda', '/meus-dados'],
  'marketing': ['/', '/plans', '/rbac/marketing', '/central-ajuda', '/perfil', '/meus-dados', '/dados-cadastrais', '/sobre', '/configuracoes'],
  'monitor': ['/', '/plans', '/monitor', '/central-ajuda', '/meus-dados'],
  'monitor_pec': ['/', '/plans', '/monitor', '/central-ajuda', '/meus-dados'],
  'monitor_inclusao': ['/', '/plans', '/monitor', '/central-ajuda', '/meus-dados'],
  'monitor_psico': ['/', '/plans', '/monitor', '/monitor/psico', '/central-ajuda', '/meus-dados'],
  'coordenador_inclusao': ['/', '/plans', '/coordenador', '/coordenador/inclusao-produtiva', '/central-ajuda', '/meus-dados'],
  'coordenador_pec': ['/', '/plans', '/coordenador', '/coordenador/esporte-cultura', '/central-ajuda', '/meus-dados'],
  'coordenador_psico': ['/', '/plans', '/coordenador', '/coordenador/psicossocial', '/central-ajuda', '/meus-dados'],
  'coordenador_negocios': ['/', '/plans', '/coordenador/negocios-sociais', '/central-ajuda', '/login/coordenador', '/meus-dados'],
  'coordenador_almoxarifado': ['/', '/plans', '/coordenador/almoxarifado', '/central-ajuda', '/login/coordenador', '/meus-dados'],
  'tecnica_psico': ['/', '/plans', '/tecnica', '/tecnica/psicossocial', '/central-ajuda', '/meus-dados'],

  'lider': ['/', '/plans', '/professor', '/central-ajuda', '/meus-dados'],
  'professor_lider': ['/', '/plans', '/professor', '/central-ajuda', '/meus-dados'],
  'aluno': ['/', '/plans', '/aluno', '/central-ajuda', '/meus-dados'],
  'doador': ['/', '/plans', '/tdoador', '/welcome', '/busca', '/noticias', '/perfil', '/meus-dados', '/dados-cadastrais', '/pagamentos', '/configuracoes', '/sobre', '/change-plan', '/central-ajuda'],
  'user': ['/', '/plans', '/tdoador', '/welcome', '/busca', '/noticias', '/perfil', '/meus-dados', '/dados-cadastrais', '/pagamentos', '/configuracoes', '/sobre', '/change-plan', '/central-ajuda'],
  'conselho': ['/', '/plans', '/conselho', '/central-ajuda', '/perfil', '/meus-dados', '/dados-cadastrais', '/sobre', '/configuracoes'],
  'conselheiro': ['/', '/plans', '/conselho', '/central-ajuda', '/perfil', '/meus-dados', '/dados-cadastrais', '/sobre', '/configuracoes'],
  'patrocinador': ['/', '/plans', '/patrocinador-dashboard', '/patrocinador', '/perfil-patrocinador', '/meus-dados', '/central-ajuda'],
  'responsavel': ['/', '/plans', '/responsavel', '/central-ajuda'],
  'colaborador': ['/', '/plans', '/colaborador', '/central-ajuda'],
};

const PUBLIC_ROUTES = [
  '/', '/plans', '/register', '/entrar', '/verify', '/checkout', '/success',
  '/pos-pagamento', '/aguardando-aprovacao', '/not-found', '/perfil',
  '/typeform-donation', '/donation-flow', '/stripe-payment', '/noticias',
  '/termos-servicos', '/politica-privacidade', '/pagamento/ingresso',
  '/pagamento/sucesso', '/login/developer', '/login/coordenador', '/login/monitor', '/login/professor', '/login/marketing', '/scanner-login', '/tablet/chamada/login'
];

const DEV_ROLES = new Set(['desenvolvedor', 'dev', 'dev-admin', 'dev-marketing']);

/** Portal do aluno usa papel aluno_portal na sessão; RBAC trata como aluno. */
function normalizeRbacRole(papel: string): string {
  if (papel === 'aluno_portal') return 'aluno';
  return papel;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  routeName
}) => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: session, isLoading, isFetched } = useAuthSession();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!isFetched && isLoading) return;

    if (PUBLIC_ROUTES.includes(routeName)) {
      setAllowed(true);
      return;
    }

    // SEC-008: autorização só com sessão backend confirmada
    if (!session?.id) {
      toast({
        title: "Acesso negado",
        description: "Você precisa fazer login para acessar esta área.",
        variant: "destructive",
      });
      if (routeName?.startsWith('/coordenador')) {
        setLocation('/login/coordenador');
      } else if (routeName?.startsWith('/professor/')) {
        setLocation('/login/professor');
      } else if (routeName?.startsWith('/monitor')) {
        setLocation('/login/monitor');
      } else {
        setLocation('/entrar');
      }
      setAllowed(false);
      return;
    }

    syncSessionToLocalStorage(session);

    const userPapel = normalizeRbacRole(session.papel || session.role || '');
    if (!userPapel) {
      setLocation('/entrar');
      setAllowed(false);
      return;
    }

    if (DEV_ROLES.has(userPapel)) {
      setAllowed(true);
      return;
    }

    const hasActiveSubscription = localStorage.getItem('hasActiveSubscription') === 'true';
    const isAdminOnlyRole = [
      'professor', 'professor_lider', 'lider',
      'monitor', 'monitor_pec', 'monitor_inclusao', 'monitor_psico',
      'coordenador', 'coordenador_inclusao', 'coordenador_pec', 'coordenador_psico', 'tecnica_psico',
      'conselho', 'conselheiro',
      'admin', 'super_admin', 'desenvolvedor', 'developer', 'dev',
      'marketing', 'gestor_setor', 'gestor_projeto',
      'oficineiro', 'oficineiro_pec', 'aluno', 'patrocinador',
    ].includes(userPapel);

    const isDonorRoute = ['/tdoador', '/welcome', '/beneficios', '/missoes', '/missoes-semanais', '/meus-lances', '/sorteio', '/impacto', '/link-indicacao'].includes(routeName);

    if (isDonorRoute && !isAdminOnlyRole && !hasActiveSubscription) {
      toast({
        title: "Assinatura inativa",
        description: "Sua assinatura precisa ser reativada para acessar esta área.",
        variant: "destructive",
      });
      setLocation('/assinatura-pausada');
      setAllowed(false);
      return;
    }

    if (isLeoByRole(userPapel) && routeName === '/leo-martins') {
      setAllowed(true);
      return;
    }

    const userAllowedRoutes = ROLE_TO_ALLOWED_ROUTES[userPapel] || [];
    const hasPermission =
      allowedRoles.includes(userPapel) || userAllowedRoutes.includes(routeName);

    if (!hasPermission) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      setLocation(getDefaultRouteForRole(userPapel));
      setAllowed(false);
      return;
    }

    setAllowed(true);
  }, [
    allowedRoles,
    routeName,
    session,
    isLoading,
    isFetched,
    setLocation,
    toast,
  ]);

  if (!isFetched || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
};

function getDefaultRouteForRole(userPapel: string): string {
  switch (userPapel) {
    case 'professor':
    case 'professor_psico':
      return '/professor';
    case 'professor_pec':
      return '/professor/pec';
    case 'professor_inclusao':
      return '/professor/inclusao';
    case 'monitor':
    case 'monitor_pec':
    case 'monitor_inclusao':
    case 'monitor_psico':
      return '/monitor';
    case 'coordenador_inclusao':
      return '/coordenador/inclusao-produtiva';
    case 'coordenador_pec':
      return '/coordenador/esporte-cultura';
    case 'coordenador_psico':
      return '/coordenador/psicossocial';
    case 'tecnica_psico':
      return '/tecnica/psicossocial';
    case 'super_admin':
    case 'leo':
      return '/administrador';
    case 'desenvolvedor':
    case 'dev':
      return '/dev';
    case 'dev-marketing':
      return '/dev/marketing';
    case 'admin':
      return '/admin-geral';
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
    default:
      return '/tdoador';
  }
}

export default ProtectedRoute;
